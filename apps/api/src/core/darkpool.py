"""
Off-exchange ("dark pool") activity from the trade tape.

Off-exchange prints are trades reported via a TRF (trf_id present) — dark pools/ATSs AND
internalized retail (wholesalers). So this is NOT a clean "institutions accumulating"
signal: side/intent are unknown and much of the volume is retail. We surface it only as
neutral CONTEXT: where off-exchange volume concentrated, and how much of total volume was
off-lit. The downstream AI is told not to infer direction.

Computed over a bounded recent window (see DARKPOOL_LOOKBACK_SECONDS) — not a multi-session
accumulation view, which would need a heavy batched pull.
"""
import logging

logger = logging.getLogger("GammaFlowAsync")


def analyze_off_exchange(trades: list, spot: float, *, top_n: int = 5,
                         bucket_pct: float = 0.0025, min_level_share: float = 0.03) -> dict | None:
    """
    Summarize off-exchange prints into volume-by-price levels + an off-exchange ratio.

    trades: list of TradePrint dicts (price, size, off_exchange).
    spot:   current/display spot, for proximity.
    Buckets prices to `bucket_pct` of spot (default 0.25%); keeps the top_n off-exchange
    levels that each hold >= min_level_share of off-exchange volume. Returns None when
    there's nothing usable so the caller can omit the block entirely.
    """
    if not trades or spot <= 0:
        return None

    total_vol = 0.0
    offex_vol = 0.0
    by_bucket: dict = {}   # bucketed price -> off-exchange shares
    step = max(spot * bucket_pct, 0.01)

    for tr in trades:
        size = tr.get("size") or 0.0
        if size <= 0:
            continue
        total_vol += size
        if not tr.get("off_exchange"):
            continue
        offex_vol += size
        bucket = round(round(tr["price"] / step) * step, 2)
        by_bucket[bucket] = by_bucket.get(bucket, 0.0) + size

    if offex_vol <= 0:
        return None

    levels = []
    for price, shares in sorted(by_bucket.items(), key=lambda kv: kv[1], reverse=True):
        if shares / offex_vol < min_level_share:
            continue
        levels.append({
            "price": price,
            "shares": int(shares),
            "share_of_offex_pct": round(100.0 * shares / offex_vol, 1),
            "proximity_pct": round((price - spot) / spot, 4),
        })
        if len(levels) >= top_n:
            break

    return {
        "ratio_pct": round(100.0 * offex_vol / total_vol, 1) if total_vol > 0 else None,
        "offex_shares": int(offex_vol),
        "total_shares": int(total_vol),
        "levels": levels,
        "note": "Off-exchange/TRF prints over a recent window; side & intent unknown, "
                "includes internalized retail. Use as context, not a directional signal.",
    }
