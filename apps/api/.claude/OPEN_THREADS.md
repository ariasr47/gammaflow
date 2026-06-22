# Open Threads (session snapshot)

> Unresolved decisions / deferred work carried out of a long working session. Pairs with
> `GAMMAFLOW_CONTEXT.md` (the standing ground truth) — this file is the "what's still open."
> Decisions, not deliberation. As of the latest commit; the code/docs are all committed & clean.

## 1. Data-vendor decision (OPEN — no change made yet)
Evaluating a possible move off Massive (= Polygon.io rebrand) because Massive does **not**
cover the overnight equity session (see thread 2). Conclusions reached:
- **Massive (current):** ~$200–400/mo flat per asset class; **computes greeks/IV/OI for us**
  (big convenience); covers **4 AM–8 PM ET only (no overnight)**. Best *value* for the core.
- **Databento:** the strongest platform — full OPRA options tape, Blue Ocean **overnight**,
  full-book fidelity, and would let us compute *all* greeks ourselves (unifying the
  vendor-vs-analytic gamma split). BUT: **no greeks provided**, OPRA is a separate plan, and
  **live overnight (Blue Ocean) appears gated to the Plus tier ~$1,500/mo** + license fees +
  separate OPRA. Premium choice; only worth it for a serious fidelity/options-flow upgrade,
  not just to fix overnight display. (Verify: does Standard $199 "US Equities Mini" live feed
  include Blue Ocean? If yes it gets much more attractive.)
- **Webull data API:** official MQTT stream, **carries overnight underlying**, ~free with a
  brokerage account — BUT **no options** (can't be the GEX source), **3 msg/s/connection**
  throttle (fine for price display, too sparse for tick-level flow), broker-gated/region-limited,
  licensing TBD. Only viable as a cheap *supplemental underlying-spot* source.
- **Leaning:** stay on Massive for value; if overnight must be solved cheaply, add Webull as a
  spot-only supplement; reserve Databento for a deliberate platform upgrade. Decision pending.

## 2. Overnight-coverage gap (OPEN — mitigated, not solved)
Massive has no 8 PM–4 AM ET data, so the overnight price (e.g. what Webull shows) can't be
sourced today. **Mitigation already shipped:** session-aware "overnight — no live data /
market closed / no live ticks" messaging + honest live-vs-stale handling (live spot = NBBO mid;
`live`/`market_session` flags). Actually sourcing the overnight price requires thread 1's vendor
decision (Databento Blue Ocean, or Webull supplement).

## 3. Dark-pool block trades + stream isolation (BACKEND LANDED — FE pending)
Contracts in `.claude/contracts/dark-pool-stream-isolation/`. **Backend (Session 4A) shipped:**
`BlockPrint`/`OffExchange` TypedDicts in `src/providers/base.py`; `blocks[]` derived in the same
off-exchange pass in `src/core/darkpool.py` (top-5 by notional, signed proximity, age, no `side`,
no new fetch); `BLOCK_MIN_SHARES` env (5000 default) + best-effort try/except in `main.py`
(`off_exchange = None` on any failure, bundle/SSE intact); `signals.py` untouched (blocks unscored).
Verified live against TSLA + a forced-failure test. Glossary + GAMMAFLOW_CONTEXT refreshed.
**Still open:** frontend lane (Session 4B) — the "Off-exchange blocks" UI section (UX_BLUEPRINT.md).
Archive `.claude/contracts/dark-pool-stream-isolation/` once the FE lane also lands (per DoD).

## 4. Smaller deferred items (proposed, not implemented)
- **Live gamma-flip anchoring:** when not in RTH, anchor the flip search to `gex_spot` (the
  close) instead of the live mid, for consistency with the bundle and to avoid a gapped
  pre-market anchor selecting a different crossing when multiple exist. Also lower the per-tick
  `Gamma flip $…` INFO log to debug (it spams every ~1.5s). Numerically near-zero impact; do for
  cleanliness. (User confirmed the displayed flip is fine as-is.)
- **Wall-selection guard:** walls are the global max/min net-GEX strike, so a deep-OTM
  round-number LEAP strike could in principle become "the wall" far from spot. Not biting now
  (the expiration filter mitigates). Add a distance/DTE guard only if it shows up live.
- **Multi-session dark-pool accumulation map:** current dark-pool is a bounded recent window;
  true multi-session block history needs a heavier batched pull. Future.

## 5. Resolved decisions (do NOT revisit)
- **Live spot = NBBO mid, not last trade** — smoother, better for anchoring; Webull shows last
  trade, hence small benign differences. Keep mid; do not add last-trade.
- **Gamma sourcing** — vendor gamma for walls/profile, analytic BS for the flip; the divergence
  is immaterial. Don't "fix" it via interpolation or borrow-rate calibration.
- **Dark pool** — context only, capped confluence, toggleable; never a directional "smart money"
  signal (off-exchange includes internalized retail; prints have no reliable side).
