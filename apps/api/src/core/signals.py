"""
Signals layer: turns a computed market_state into ranked, explainable trade setups.

This is interpretation, not new measurement -- it reads the gamma/vol/level fields the
engine already produces and applies a transparent, regime-first rule set:

  1. Regime (net_gex sign) decides the playbook: positive gamma -> mean-reversion /
     premium-selling; negative gamma -> momentum / premium-buying.
  2. Levels (walls, peak GEX, VWAP bands) provide entries/targets.
  3. The IV/HV ratio biases structure (sell vs buy premium).
  4. Confluence (multiple factors agreeing) raises conviction and the opportunity score.

All thresholds are module constants so they are easy to tune. Every setup carries a
plain-English rationale so the downstream AI (and you) can see why it fired.
"""
import hashlib
import logging

logger = logging.getLogger("GammaFlowAsync")

# --- Tunable thresholds ---
NEAR_LEVEL_PCT = 0.0075      # within 0.75% of a level counts as "at" it
FAR_LEVEL_PCT = 0.03         # proximity score decays to 0 by 3% away
IV_RICH = 1.10               # iv_hv_ratio above -> IV rich (favor selling premium)
IV_CHEAP = 0.90              # iv_hv_ratio below -> IV cheap (favor buying premium)
FLIP_PROXIMITY_PCT = 0.01    # within 1% of gamma_flip -> regime-transition risk

DEFAULT_GATE_SCORE = 50      # opportunity_score at/above which a snapshot is AI-worthy
ACTIONABLE_CONVICTIONS = {"medium", "high"}


def _signed_pct(level, price):
    """Signed distance from price to a level, as a fraction of price (+ = level above)."""
    if not level or not price:
        return None
    return (level - price) / price


def _near(level, price, pct=NEAR_LEVEL_PCT):
    d = _signed_pct(level, price)
    return d is not None and abs(d) <= pct


def generate_signals(state: dict) -> dict:
    """Produce regime, vol regime, level distances, setups, and a 0-100 opportunity score."""
    price = state.get("price") or state.get("gex_spot")
    flip = state.get("gamma_flip")
    net_gex = state.get("net_gex")
    call_wall = state.get("call_wall")
    put_wall = state.get("put_wall")
    peak = state.get("peak_gex_strike")
    max_pain = state.get("max_pain")
    ivhv = state.get("iv_hv_ratio")
    vu2 = state.get("vwap_upper_2")
    vl2 = state.get("vwap_lower_2")

    out = {
        "ticker": state.get("ticker"),
        "regime": None,
        "regime_note": None,
        "vol_regime": "neutral",
        "distances": {},
        "setups": [],
        "opportunity_score": 0,
    }

    if not price or flip is None or net_gex is None:
        out["regime_note"] = "insufficient data"
        return out

    # --- Regime (net gamma sign is the direct measure) ---
    positive_gamma = net_gex > 0
    out["regime"] = "positive_gamma" if positive_gamma else "negative_gamma"
    out["regime_note"] = (
        "Dealers long gamma -> hedging dampens moves; range-bound / mean-reverting."
        if positive_gamma else
        "Dealers short gamma -> hedging amplifies moves; trending / breakout-prone."
    )

    # --- Distances to key levels (signed % of price) ---
    dist = {
        "call_wall_pct": _signed_pct(call_wall, price),
        "put_wall_pct": _signed_pct(put_wall, price),
        "gamma_flip_pct": _signed_pct(flip, price),
        "peak_gex_pct": _signed_pct(peak, price),
        "max_pain_pct": _signed_pct(max_pain, price),
    }
    out["distances"] = {k: (round(v, 4) if v is not None else None) for k, v in dist.items()}

    near_flip = dist["gamma_flip_pct"] is not None and abs(dist["gamma_flip_pct"]) <= FLIP_PROXIMITY_PCT

    # --- Vol regime ---
    if ivhv:
        if ivhv >= IV_RICH:
            out["vol_regime"] = "iv_rich"      # options expensive vs realized -> sell premium
        elif ivhv <= IV_CHEAP:
            out["vol_regime"] = "iv_cheap"     # options cheap -> buy premium
    sell_prem = out["vol_regime"] == "iv_rich"
    buy_prem = out["vol_regime"] == "iv_cheap"

    setups = []

    def add(name, bias, strategy, rationale, conviction):
        setups.append({"name": name, "bias": bias, "strategy": strategy,
                       "rationale": rationale, "conviction": conviction})

    # --- Regime-transition alert (highest priority context) ---
    if near_flip:
        add(
            "Gamma-flip transition", "volatility",
            "long straddle / long vol" if buy_prem else "reduce size, expect expansion",
            f"Price within {FLIP_PROXIMITY_PCT:.0%} of zero-gamma ${flip:.2f}; a cross flips the "
            f"regime and tends to expand volatility.",
            "high" if buy_prem else "medium",
        )

    if positive_gamma:
        # Mean-reversion fades toward the magnet
        target = peak or max_pain
        if _near(call_wall, price):
            add(
                "Fade call wall", "short",
                "short / call credit spread" if sell_prem else "short toward magnet",
                f"Price at call wall ${call_wall:.2f} in positive gamma (resistance); dealers sell "
                f"rallies here. Target the magnet ${target:.2f}." + (" IV rich favors selling premium." if sell_prem else ""),
                "high" if sell_prem else "medium",
            )
        if _near(put_wall, price):
            add(
                "Fade put wall", "long",
                "long / put credit spread" if sell_prem else "long toward magnet",
                f"Price at put wall ${put_wall:.2f} in positive gamma (support); dealers buy dips here. "
                f"Target the magnet ${target:.2f}." + (" IV rich favors selling premium." if sell_prem else ""),
                "high" if sell_prem else "medium",
            )
        if vu2 and price >= vu2:
            add(
                "VWAP band reversion", "short", "short toward VWAP",
                f"Price at/above the +2σ VWAP band (${vu2:.2f}) in a mean-reverting regime.",
                "medium",
            )
        if vl2 and price <= vl2:
            add(
                "VWAP band reversion", "long", "long toward VWAP",
                f"Price at/below the -2σ VWAP band (${vl2:.2f}) in a mean-reverting regime.",
                "medium",
            )
        # Range / premium-sell when boxed between walls and IV is rich
        if sell_prem and call_wall and put_wall and not _near(call_wall, price) and not _near(put_wall, price):
            add(
                "Range premium sell", "neutral", "iron condor / short strangle",
                f"Positive gamma pins price between put wall ${put_wall:.2f} and call wall ${call_wall:.2f}; "
                f"IV rich (IV/HV {ivhv:.2f}) favors selling the range.",
                "medium",
            )

    else:  # negative gamma -> momentum
        if dist["put_wall_pct"] is not None and price < put_wall:
            add(
                "Put-wall breakdown", "short",
                "long puts / put debit spread" if buy_prem else "momentum short",
                f"Price below put wall ${put_wall:.2f} in negative gamma; dealer hedging accelerates "
                f"downside." + (" IV cheap favors buying premium." if buy_prem else ""),
                "high" if buy_prem else "medium",
            )
        if dist["call_wall_pct"] is not None and price > call_wall:
            add(
                "Call-wall breakout (squeeze)", "long",
                "long calls / call debit spread" if buy_prem else "momentum long",
                f"Price above call wall ${call_wall:.2f} in negative gamma; hedging can fuel a squeeze."
                + (" IV cheap favors buying premium." if buy_prem else ""),
                "high" if buy_prem else "medium",
            )
        if not setups or all(s["name"] == "Gamma-flip transition" for s in setups):
            add(
                "Trend regime", "directional", "trade with momentum, avoid fading",
                "Negative gamma: moves tend to extend. Favor breakouts; do not fade levels.",
                "low",
            )

    # --- Pin confluence: peak GEX and max pain agree near price ---
    if peak and max_pain and abs(_signed_pct(peak, price) or 1) < 0.02 and abs((peak - max_pain) / peak) < 0.01:
        add(
            "Pin confluence", "neutral", "expect pinning into monthly expiry",
            f"Gamma magnet ${peak:.2f} and max pain ${max_pain:.2f} coincide near price -> stronger pin.",
            "medium",
        )

    out["setups"] = setups
    out["opportunity_score"] = _opportunity_score(dist, ivhv, setups, near_flip)
    return out


def _opportunity_score(dist: dict, ivhv, setups: list, near_flip: bool) -> int:
    """0-100 ranking score: proximity to an actionable level + vol extremity + confluence."""
    # Proximity: closeness to the nearest of call wall / put wall / gamma flip.
    candidates = [abs(d) for d in (dist["call_wall_pct"], dist["put_wall_pct"], dist["gamma_flip_pct"])
                  if d is not None]
    proximity = 0.0
    if candidates:
        nearest = min(candidates)
        proximity = max(0.0, 40.0 * (1.0 - nearest / FAR_LEVEL_PCT))

    vol = min(25.0, abs((ivhv or 1.0) - 1.0) * 50.0)
    setup = min(25.0, len(setups) * 8.0)
    transition = 10.0 if near_flip else 0.0

    return int(round(min(100.0, proximity + vol + setup + transition)))


def _sign(x) -> int:
    """-1 / 0 / +1 sign of a number, treating None as 0 (level above vs below price)."""
    if x is None:
        return 0
    return (x > 0) - (x < 0)


def state_fingerprint(sig: dict) -> str:
    """
    Short stable hash of the *material* picture, so a consumer (and our dedupe) can tell
    "same picture" from "new picture" across polls. Deliberately COARSE -- the
    opportunity_score is bucketed and only the SIGN of each level distance is used -- so a
    60s poll on a quiet tape yields an identical fingerprint, and it only changes when the
    regime, vol regime, the set of setups, the score bucket, or which side of a level
    price sits on actually changes.
    """
    dist = sig.get("distances") or {}
    parts = [
        sig.get("regime"),
        sig.get("vol_regime"),
        ",".join(sorted(s["name"] for s in sig.get("setups", []))),
        (sig.get("opportunity_score") or 0) // 10,
        _sign(dist.get("call_wall_pct")),
        _sign(dist.get("put_wall_pct")),
        _sign(dist.get("gamma_flip_pct")),
    ]
    raw = "|".join(str(p) for p in parts)
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def evaluate_gate(sig: dict, score_threshold: int = DEFAULT_GATE_SCORE) -> dict:
    """
    Cheap rule-layer gate that decides whether a snapshot is worth escalating to the
    downstream strategy AI. Keeps the AI off a firehose: it only fires when something is
    actually actionable. Stateless -- the `changed` dedupe (needs the prior fingerprint)
    is resolved by the caller; staleness is also forced off by the caller.

    ready = True when ANY of:
      - opportunity_score >= score_threshold
      - any setup has medium/high conviction
      - price is near the gamma flip (regime-transition risk)
    """
    reasons = []

    score = sig.get("opportunity_score") or 0
    if score >= score_threshold:
        reasons.append(f"score>={score_threshold}")

    for s in sig.get("setups", []):
        if s.get("conviction") in ACTIONABLE_CONVICTIONS:
            reasons.append(f"setup:{s['name']}({s['conviction']})")

    dist = (sig.get("distances") or {}).get("gamma_flip_pct")
    if dist is not None and abs(dist) <= FLIP_PROXIMITY_PCT:
        reasons.append("near gamma flip")

    return {"ready": bool(reasons), "reasons": reasons,
            "state_fingerprint": state_fingerprint(sig), "score_threshold": score_threshold}
