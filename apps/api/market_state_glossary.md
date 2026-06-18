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

# `/api/scan` — opportunity-ranked watchlist

```json
{ "tickers": [
  { "ticker": "NVDA", "opportunity_score": 54, "regime": "negative_gamma", "vol_regime": "iv_rich",
    "price": 120.0, "gamma_flip": 118.0, "call_wall": 121.0, "put_wall": 110.0,
    "setup_count": 1, "top_setup": "Trend regime", "top_bias": "directional" } ,
  ... ] }
```

- `tickers` — **sorted by `opportunity_score` descending** (best opportunities first).
- Each row is a summary; pull the full picture for a name via `/api/signals?ticker=` and `/api/market-data?ticker=`.
- Use it to pick *which* names to focus on, then drill in. A high score flags "worth a look," not "take the trade" — always confirm with the per-ticker signals + the reliability order above.

**Caveat:** scores are comparable across the watchlist but are heuristic rankings, not probabilities. Treat `conviction`/`opportunity_score` as triage, not certainty; size and stop accordingly.
