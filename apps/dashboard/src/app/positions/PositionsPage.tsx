/**
 * Standalone Positions page (ARCHITECTURE §4.3 / Q2). The RELOCATED `PortfolioPanel` was previously a
 * child of the Ticker viewer, which supplied it with `data`/`live`/`isLive`/`streamOffline` from the
 * Ticker page's bundle + SSE. On `/positions` there is no Ticker-page parent, so this thin wrapper
 * sources those itself using the EXISTING mechanisms (NO backend change):
 *
 *  - `usePortfolio` already does per-row mark sourcing via `GET /api/contract` (`fetchTrackedContract`)
 *    per OPEN/PENDING row — that is unchanged and is the primary mark source (AC-PosLive-1..4).
 *  - To give `computeMark` an anchor spot + a live underlying, this wrapper polls `GET /api/ticker`
 *    for the book's focused ticker and opens ONE page-scoped SSE via `streamTicker` (the same
 *    page-scoped lifecycle as the Ticker viewer: at most one SSE per ticker, torn down on unmount).
 *  - All sourcing is best-effort: a bundle/stream failure degrades marks (last-known / unavailable /
 *    no-live-quote) but NEVER blanks or drops a durable record (`[live-vs-static-isolation]`).
 *
 * The durable store + `usePortfolio` durability logic are UNCHANGED — this file adds no durable
 * page/shell state. The LOCKED Live tab and SIMULATED posture are untouched (`[no-real-order-path]`).
 */
import { useEffect, useMemo, useState } from 'react';
import { Container, Stack, Typography } from '@mui/material';
import { getTicker, streamTicker, TickerBundle, LiveUpdate } from '@org/api';
import { usePortfolio } from './usePortfolio';
import { PortfolioPanel } from './PortfolioPanel';
import { allPositions } from './store';

const POLL_MS = 60_000; // matches the backend cache TTL (same cadence as the Ticker viewer)
const STREAM_OFFLINE_MS = 15_000; // payload-gap watchdog → live-mark degrade (mirrors the Ticker page)
const DEFAULT_TICKER = 'TSLA';

/** Pick the focused ticker for the anchor bundle + SSE: the most-represented open/pending ticker in
 *  the durable book, falling back to the default. Per-row marks still resolve per their own ticker
 *  via `GET /api/contract`; this only sources the anchor spot + the live underlying for the stream. */
function focusedTicker(): string {
  const counts = new Map<string, number>();
  for (const p of allPositions()) {
    if (p.status !== 'open' && p.status !== 'pending') continue;
    counts.set(p.ticker, (counts.get(p.ticker) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [tk, n] of counts) {
    if (n > bestN) { best = tk; bestN = n; }
  }
  return best ?? DEFAULT_TICKER;
}

export function PositionsPage() {
  // The focused ticker is derived once on mount from the durable book (re-derives on remount, like a
  // reload). It drives the anchor bundle + the single page-scoped SSE.
  const ticker = useMemo(() => focusedTicker(), []);
  const [data, setData] = useState<TickerBundle | null>(null);
  const [live, setLive] = useState<LiveUpdate | null>(null);
  const [streamOffline, setStreamOffline] = useState(false);

  const isLive = (live?.live ?? false) && !streamOffline;

  // Anchor bundle: best-effort. A failure leaves `data` null — `usePortfolio` then degrades marks to
  // `tracking unavailable` / last-known per row, never blanking the records. Polls on the cache cadence.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getTicker(ticker)
        .then((d) => { if (!cancelled) setData(d); })
        .catch(() => { /* best-effort: leave prior data; per-row marks degrade, records persist */ });
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [ticker]);

  // ONE page-scoped SSE for the focused ticker (same lifecycle/teardown as the Ticker viewer). At most
  // one EventSource per ticker; closed on unmount. The watchdog flips `streamOffline` on a drop so live
  // marks degrade to ⏸ last known while durable records persist.
  useEffect(() => {
    setLive(null);
    setStreamOffline(false);
    let gapTimer: ReturnType<typeof setTimeout> | undefined;
    const unsub = streamTicker(ticker, {}, (u) => {
      setLive(u);
      setStreamOffline(false);
      if (gapTimer) clearTimeout(gapTimer);
      gapTimer = setTimeout(() => setStreamOffline(true), STREAM_OFFLINE_MS);
    });
    return () => { if (gapTimer) clearTimeout(gapTimer); unsub(); };
  }, [ticker]);

  const pf = usePortfolio(ticker, data, live, isLive, streamOffline);
  const [entryOpen, setEntryOpen] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack sx={{ mb: 1 }}>
        <Typography variant="h1">Positions</Typography>
        <Typography variant="body2" color="text.secondary">
          Your simulated book — paper-only, persisted in this browser. Live marks degrade gracefully; records never drop.
        </Typography>
      </Stack>
      <PortfolioPanel
        pf={pf} data={data} live={live} isLive={isLive} streamOffline={streamOffline}
        ticker={ticker} entryOpen={entryOpen} onEntryOpen={setEntryOpen}
      />
    </Container>
  );
}

export default PositionsPage;
