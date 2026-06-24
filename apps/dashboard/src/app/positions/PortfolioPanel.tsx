/**
 * Portfolio shell (UX_BLUEPRINT §6 S1): the two tabs (Simulated · Live), the customization toolbar,
 * and the all-positions surface. Re-homes the single-position ghost-trade panel into a portfolio
 * surface. Switching tabs re-derives the view only — it triggers no fetch and mutates no position.
 *
 * The Live tab renders the LOCKED placeholder (zero data source, zero network) — when Live is active
 * NO position data, entry affordance, or feed is wired.
 */
import { useMemo, useState } from 'react';
import {
  Box, Tabs, Tab, Card, CardContent, Stack, Typography, Chip, Button, Tooltip, Snackbar, Alert,
} from '@mui/material';
import type { TickerBundle, LiveUpdate } from '@org/api';
import { usePortfolio, OpenPositionInput } from './usePortfolio';
import { deriveGroups } from './derive';
import type { DerivedRow } from './derive';
import type { PositionStatus } from './types';
import { PositionsView } from './PositionsView';
import { CustomizationToolbar } from './CustomizationToolbar';
import { LiveTabPanel } from './LiveTabPanel';
import { PositionEntryDialog, EntryPrefill } from './PositionEntryDialog';
import { SIMULATED_TIP } from './labels';
import type { RowContext } from './PositionRow';

type Portfolio = ReturnType<typeof usePortfolio>;

interface Props {
  pf: Portfolio;
  data: TickerBundle | null;
  live: LiveUpdate | null;
  isLive: boolean;
  streamOffline: boolean;
  ticker: string;
  /** External request to open the entry dialog (e.g. from Accept-an-AI-rec). */
  entryPrefill?: EntryPrefill;
  entryOpen: boolean;
  onEntryOpen: (open: boolean) => void;
}

function isHistoryFilter(status: PositionStatus[]): boolean {
  return status.length > 0 && status.every((s) => s === 'closed' || s === 'cancelled');
}

export function PortfolioPanel({ pf, data, streamOffline, ticker, entryPrefill, entryOpen, onEntryOpen }: Props) {
  const [tab, setTab] = useState<'simulated' | 'live'>('simulated');
  const [toast, setToast] = useState<string | null>(null);
  const m = data?.market_state;

  // Build a markRes for a row by re-running the existing engine off the row's tracked stats.
  const markResFor = (row: DerivedRow): RowContext['markRes'] => {
    if (row.position.status !== 'open' && row.position.status !== 'pending') return null;
    return pf.markFor(row.position);
  };

  const { working } = pf;
  const groups = useMemo(
    () => deriveGroups(pf.rows, {
      filter: working.filter, sortKey: working.sortKey, sortDir: working.sortDir, group: working.group,
    }),
    [pf.rows, working.filter, working.sortKey, working.sortDir, working.group],
  );

  const handleConfirm = (input: OpenPositionInput) => {
    const res = pf.openPosition(input);
    if (!res.ok && res.reason) setToast(res.reason);
    onEntryOpen(false);
  };

  const strikeList = Array.from(new Set((data?.strike_profile.strikes ?? []).map((s) => s.strike))).sort((a, b) => a - b);
  const expirations = data?.expirations.map((e) => e.date) ?? [];

  return (
    <Card variant="outlined" sx={{ mt: 3 }} data-testid="portfolio-panel">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Positions portfolio</Typography>
          <Tooltip arrow title={SIMULATED_TIP}><Chip size="small" variant="outlined" label="SIMULATED" /></Tooltip>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab value="simulated" label="Simulated" data-testid="tab-simulated" />
          <Tab value="live" label="Live" data-testid="tab-live" />
        </Tabs>

        {tab === 'live' ? (
          <LiveTabPanel />
        ) : (
          <Box data-testid="simulated-surface">
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button variant="outlined" size="small" onClick={() => onEntryOpen(true)} disabled={!data} data-testid="open-entry">
                Open simulated position
              </Button>
            </Stack>

            <CustomizationToolbar pf={pf} positions={pf.positions} />

            <PositionsView
              groups={groups}
              columns={working.columns}
              layout={working.layout}
              density={working.density}
              streamOffline={streamOffline}
              totalCount={pf.positions.length}
              isHistory={isHistoryFilter(working.filter.status)}
              markResFor={markResFor}
              trendFor={pf.trendFor}
              onOpenEntry={() => onEntryOpen(true)}
              onClearFilter={() => pf.setFilter({ ticker: null, strategy: null, expiry: null, status: ['open'] })}
              onClose={pf.closePosition}
              onCancel={pf.cancelLimit}
            />

            <PositionEntryDialog
              open={entryOpen}
              ticker={ticker}
              expirations={expirations}
              strikes={strikeList}
              spot={m?.price ?? 0}
              prefill={entryPrefill}
              onClose={() => onEntryOpen(false)}
              onConfirm={handleConfirm}
            />
          </Box>
        )}

        <Snackbar open={!!toast} autoHideDuration={6000} onClose={() => setToast(null)}>
          <Alert severity="warning" onClose={() => setToast(null)} data-testid="entry-failure-toast">{toast}</Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
