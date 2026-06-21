# GammaFlow → Strategy AI hand-off contract

GammaFlow does **not** call an LLM itself. It produces the analytics, a cheap rule-layer
gate, and a dedupe fingerprint; an **external** orchestrator decides when to invoke the
strategy AI and with what prompt. This file is that contract: when to call, what to send,
and what the AI must return.

## When to invoke (gate + dedupe)

Pull a ticker from the bundle route (`GET /{ticker}` or `/api/ticker/{ticker}`, optionally
`?min_dte=7&max_dte=45`). Invoke the AI **only** when:

```
ai_eval.ready == true            # rule layer says it's actionable
AND ai_eval.changed == true      # distinct from the last picture (server-side dedupe)
AND meta.freshness.stale == false
AND ai_eval.state_fingerprint not in <fingerprints you've already evaluated>
```

`ai_eval.ready` is already forced to `false` when the snapshot is stale, so the freshness
check is belt-and-suspenders. Record each `state_fingerprint` you act on and skip repeats —
that is the second, consumer-side dedupe and the authoritative one (the server's `changed`
flag only compares against the immediately preceding distinct compute).

Do not poll faster than the data changes: ~60s with the delayed feed (the cache TTL),
faster only on a real-time tier.

## What to send

- The full bundle from the route: `market_state`, `signals`, `strike_profile`, `meta`.
- `market_state_glossary.md` as the field reference (definitions, reliability order).
- The requested DTE window (`market_state.dte_min` / `dte_max`) so the AI sizes the trade
  to the horizon the levels were computed for.

## System prompt (risk-first)

> You are a disciplined options strategist. The user trades **longer-dated** options
> (typically 7–45 DTE) and is prone to greed and poor risk management — your job is to
> impose discipline, not to find a reason to trade.
>
> Read the bundle using the glossary's reliability order (gamma structure first, then
> IV/HV and VWAP, then max pain, then higher-order greeks directionally). Anchor levels to
> `gex_spot`, not `price`. Respect the regime: in `positive_gamma` favor mean-reversion /
> selling premium; in `negative_gamma` favor momentum / buying premium and do NOT fade.
>
> You must lead with risk. Return **`no_trade`** when `signals.setups` is empty,
> `meta.freshness.stale` is true, or there is no clean edge — saying "no trade" is a
> correct and common answer. When you do propose a trade, every risk field below is
> mandatory; do not omit them.
>
> Respond with **JSON only**, matching this schema.

## Required output schema

```json
{
  "decision": "trade | no_trade",
  "bias": "long | short | neutral | volatility",
  "structure": "e.g. call debit spread, put credit spread, long calls",
  "strikes": [/* concrete strike(s) */],
  "expiration": "YYYY-MM-DD within the requested DTE window",
  "entry_trigger": "the condition/level that confirms entry",
  "invalidation_level": 0.0,
  "max_risk": "max $ or % of account at risk",
  "position_size": "concrete size consistent with max_risk",
  "exit_plan": { "target": 0.0, "stop": 0.0 },
  "time_horizon": "expected holding period",
  "confidence": "low | medium | high",
  "rationale": "why, citing the specific GammaFlow levels (walls, flip, magnet, IV/HV)"
}
```

When `decision` is `no_trade`, set the trade fields to `null` and explain why in
`rationale`.
