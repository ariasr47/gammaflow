# GammaFlow `market_state` — Field Glossary (for the trading AI)

**Pre-market reading:** every gamma level is computed from the **last completed session's
close** (`gex_spot`), so they describe dealer positioning *going into today*. `price` is the
current/indicative (pre-market, ~15-min delayed) quote. **Anchor the levels to `gex_spot`,
not `price`** — then compare `price` vs `gamma_flip`/walls to read the regime the open is
heading into. If `timestamp` looks stale, down-weight all greek/GEX fields.

## Identity & spot
- `ticker` — underlying symbol.
- `price` — current (delayed / pre-market) spot. Display only.
- `gex_spot` — spot the GEX/greek levels were computed at (last session close when closed; == `price` during RTH). **The levels are anchored here.**
- `timestamp` / `timestamp_iso` — options-snapshot time (ns epoch / UTC ISO). Staleness here = stale greeks/GEX.

## Dealer gamma structure (primary — gamma-based, most reliable)
- `net_gex` — net dealer $ gamma (calls +, puts −), per 1% move. **>0 = positive-gamma** (dealers dampen moves → vol-suppressed, mean-reverting); **<0 = negative-gamma** (dealers amplify → trending/volatile).
- `call_gex` / `put_gex` / `total_gex` — gross split: call gamma (≥0), put gamma (≤0), and |call|+|put|.
- `gamma_flip` — zero-gamma price nearest spot. **Above = positive-gamma regime; below = negative.** Key regime trigger.
- `call_wall` — strike with the most net-positive gamma → upside **resistance**.
- `put_wall` — strike with the most net-negative gamma → downside **support**.
- `peak_gex_strike` — strike with the most *total* gamma → **magnet/pin** (price gravitates here). Distinct from the walls; may or may not equal `call_wall`.

## Higher-order dealer greeks (use DIRECTIONALLY — sign/relative only)
- `net_vanna` — $ vanna (dDelta/dVol). Absolute magnitude is convention-dependent; read the sign and trend.
- `net_charm` — $ charm (dDelta/dTime; daily delta bleed). Directional.
- `net_volga` — $ volga (dVega/dVol). Directional.

## OI / sentiment
- `max_pain` — OI-based price minimizing total option-holder payout at `max_pain_expiration`. **Secondary, heuristic pin**; strengthens into that expiry. Different basis than gamma — when it agrees with `peak_gex_strike`, the pin is higher-conviction.
- `max_pain_expiration` — expiration `max_pain` is for (nearest monthly OPEX, YYYY-MM-DD).
- `put_call_ratio` — put OI / call OI, all expirations. >1 put-heavy, <1 call-heavy (positioning, not volume).

## Expiration (DTE) window
- `dte_min` / `dte_max` — the days-to-expiry window the **gamma structure** (`net_gex`, walls, `peak_gex_strike`, `gamma_flip`, gross GEX, higher-order greeks) was computed over. `null` = full chain. Set via the `min_dte` / `max_dte` query params. **Does NOT affect `max_pain` or `put_call_ratio`** — those always use the full chain. Restricting to e.g. 7–45 DTE gives stabler swing levels, free of the 0DTE/weekly noise that shifts intraday.

## Volatility
- `atm_iv` — ATM implied vol, % annualized (nearest tenor ≥ 7 DTE).
- `hv_30d` — 30-day realized vol, % annualized.
- `iv_hv_ratio` — `atm_iv`/`hv_30d`. **>1 = IV rich** (favors selling vol); **<1 = IV cheap** (favors buying vol).

## Mean-reversion (last completed RTH session)
- `vwap` — session volume-weighted average price.
- `vwap_upper_2/3`, `vwap_lower_2/3` — VWAP ± 2σ/3σ (volume-weighted). Mean-reversion bands; `null` if no session had enough data.

## Not populated yet
- `net_flow` — order-flow aggression. Currently `null` (not computed) — ignore until non-null.

**Reliability order:** gamma structure (`net_gex`, `gamma_flip`, walls, `peak_gex_strike`) > `iv_hv_ratio`/VWAP > `max_pain` > higher-order greeks (directional only).

---

# Endpoints — one ticker, on demand

The API computes on request for ONE ticker (no background loop, no watchlist) and caches
the result for a short TTL (default 60s) so polling at that cadence is instant and the
upstream feed isn't hammered. Every endpoint accepts the symbol plus an optional DTE window:

- `GET /{ticker}` — friendly URL (e.g. `/TSLA`). Returns the **full envelope** (below).
- `GET /api/ticker/{ticker}` — identical full envelope (canonical machine path).
- `GET /api/market-data?ticker=` — just the `market_state` slice.
- `GET /api/signals?ticker=` — just the `signals` slice.
- `GET /api/strike-profile?ticker=` — just the per-strike profile.

**Query params (all routes):** `min_dte`, `max_dte` — bound the expiration window the
gamma structure is computed over (omit for the full chain). For longer-dated / swing
levels use e.g. `?min_dte=7&max_dte=45`; the chosen window is echoed back as
`dte_min`/`dte_max`. The window shapes the gamma fields only — `max_pain` and
`put_call_ratio` stay on the full chain.

Unknown symbols (no option chain) return **404**. All routes share the cache, so a slice
request right after a bundle request is free; AI consumers should use the bundle route to
get `ai_eval` + `meta` in one call.

## Response envelope (bundle routes)

```json
{
  "market_state": { ... }, "signals": { ... }, "strike_profile": { ... },
  "ai_eval": { "ready": true, "reasons": ["score>=50", "setup:Fade call wall(high)"],
               "changed": true, "state_fingerprint": "a1b2c3d4e5f6", "score_threshold": 50 },
  "meta": {
    "served_at": "2026-06-21T13:45:01+00:00",
    "cache":     { "hit": false, "age_seconds": 0, "ttl_seconds": 60 },
    "freshness": { "snapshot_iso": "2026-06-21T13:30:00+00:00",
                   "data_age_seconds": 901, "stale": false, "stale_after_seconds": 1200 }
  }
}
```

- `meta.cache` — `hit` = served from memory (no upstream fetch); `age_seconds` since the
  cached compute; `ttl_seconds` = poll cadence the cache is tuned to.
- `meta.freshness` — **how old the actual market snapshot is.** `data_age_seconds` = now −
  options-snapshot time; `stale` = it exceeds `stale_after_seconds` (default 1200 ≈ the
  15-min delay + slack; lower to ~120 on a real-time tier). **Always check `stale` before
  trusting the greeks/GEX.** Note `data_age_seconds` includes the feed's inherent delay,
  so on the delayed tier expect ~900s+ even when everything is healthy.
- `ai_eval` — the **gate** that decides if this snapshot is worth the downstream strategy
  AI. `ready` = the rule layer found something actionable (score ≥ `score_threshold`, a
  medium/high-conviction setup, or price near the gamma flip); `reasons` lists what fired.
  `ready` is forced `false` (and `"stale data"` added to `reasons`) when `meta.freshness.stale`.
  `changed` = the picture differs from the last distinct compute for this ticker (dedupe),
  and `state_fingerprint` is a coarse, stable hash a consumer dedupes on. **Invoke the AI
  only when `ready && changed` and the fingerprint is new** — see `prompts/strategy_prompt.md`
  for the full hand-off contract and required output schema.
- `off_exchange` — **present only when `dark_pool=true`.** Off-exchange (TRF-reported)
  volume over a recent window: `ratio_pct` (off-lit share of volume), and `levels[]`
  (volume-by-price: `price`, `shares`, `share_of_offex_pct`, `proximity_pct`). **Context
  only — NOT directional.** Off-exchange volume includes dark pools/ATS *and* internalized
  retail, and prints carry no reliable side, so do not infer accumulation/distribution.
  When a level coincides with a gamma wall/flip it adds a small capped confluence bonus to
  `opportunity_score` (reflected in `signals.dark_pool_confluence`). If absent, the user
  disabled it — ignore entirely.

# `/api/signals` — pre-digested setups for ONE ticker

This is the backend's interpretation of `market_state` (same source of truth). Prefer
reasoning over these fields rather than re-deriving regime/levels yourself.

```json
{
  "ticker": "TSLA",
  "regime": "positive_gamma | negative_gamma",
  "regime_note": "plain-English description of the regime",
  "vol_regime": "iv_rich | iv_cheap | neutral",
  "distances": { "call_wall_pct": 0.0057, "put_wall_pct": -0.0446, "gamma_flip_pct": -0.0251,
                 "peak_gex_pct": 0.0057, "max_pain_pct": 0.0057 },
  "setups": [ { "name": "...", "bias": "...", "strategy": "...", "rationale": "...", "conviction": "low|medium|high" } ],
  "opportunity_score": 53
}
```

- `regime` — the master switch. **`positive_gamma`** = dealers dampen moves → range-bound / mean-reverting (favor fading levels, selling premium). **`negative_gamma`** = dealers amplify → trending / breakout-prone (favor momentum, buying premium; do NOT fade).
- `regime_note` — human-readable expansion of the regime.
- `vol_regime` — `iv_rich` (IV/HV ≥ 1.10 → favor selling premium), `iv_cheap` (≤ 0.90 → favor buying premium), else `neutral`.
- `distances` — signed distance from `price` to each level, as a fraction of price. **Positive = level is above price; negative = below.** (e.g. `call_wall_pct: 0.0057` = call wall 0.57% above; `put_wall_pct: -0.0446` = put wall 4.46% below.)
- `setups[]` — detected confluence trades, **most actionable first**. Per setup:
  - `name` — e.g. `Fade call wall`, `Fade put wall`, `VWAP band reversion`, `Range premium sell`, `Put-wall breakdown`, `Call-wall breakout (squeeze)`, `Gamma-flip transition`, `Pin confluence`, `Trend regime`.
  - `bias` — `long`, `short`, `neutral`, `directional`, or `volatility`.
  - `strategy` — suggested structure (e.g. "short / call credit spread", "iron condor", "long puts").
  - `rationale` — why it fired (cites the specific levels). **Use this as the explanation.**
  - `conviction` — `low` / `medium` / `high` (rises with confluence and IV alignment).
- `opportunity_score` — 0–100, how actionable this ticker is right now (proximity to a level + IV extremity + number of setups + transition bonus). Higher = more setups stacking near a tradeable level.

**How to read it:** lead with `regime`, take the top 1–2 `setups`, confirm direction against `distances` (is price actually near the level the setup names?) and `vol_regime` (does the structure fit — sell premium only when `iv_rich`, buy only when `iv_cheap`). An empty `setups` list means no clean edge right now — say so rather than forcing a trade.

**Caveat:** `conviction`/`opportunity_score` are heuristic, not probabilities. Treat them as triage, not certainty; size and stop accordingly.
