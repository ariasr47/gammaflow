/**
 * Portfolio shell (UX_BLUEPRINT §6 S1): the two tabs (Simulated · Live), the customization toolbar,
 * and the all-positions surface. Re-homes the single-position ghost-trade panel into a portfolio
 * surface. Switching tabs re-derives the view only — it triggers no fetch and mutates no position.
 *
 * The Live tab renders the LOCKED placeholder (zero data source, zero network) — when Live is active
 * NO position data, entry affordance, or feed is wired.
 *
 * Re-skin (convexa-redesign · Positions): the outer `Card`/"Positions portfolio" heading/`SIMULATED`
 * chip chrome is removed — underline tabs (Simulated + green PAPER badge ‖ 🔒 Live) render directly
 * under the page header. The gated "Open simulated position" CTA moves onto the toolbar's blue pill
 * (`data-testid="open-entry"`). The mandatory `positions-disclosure` (D6d) + the in-context sign-in
 * prompt + the server-gate wiring are all preserved verbatim. No data/handler changes.
 */
import { useMemo, useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import type { TickerBundle, LiveUpdate } from '@org/api';
import { usePortfolio, OpenPositionInput } from './usePortfolio';
import { deriveGroups } from './derive';
import type { DerivedRow } from './derive';
import type { PositionStatus } from './types';
import { PositionsView } from './PositionsView';
import { CustomizationToolbar } from './CustomizationToolbar';
import { LiveTabPanel } from './LiveTabPanel';
import { PositionEntryDialog, EntryPrefill } from './PositionEntryDialog';
import type { RowContext } from './PositionRow';
import { useGate } from '../auth/useGate';
import { SignInPrompt } from '../auth/SignInPrompt';
import { AUTH_COPY } from '../auth/copy';

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

  // Gated WRITE actions (UX_BLUEPRINT §2.6, AC-E1/E2/E3/E7). The route stays viewable anonymously;
  // ONLY the write actions gate. Logged-out ⇒ an in-context sign-in prompt, no execute.
  const gate = useGate();

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

  // Opening the entry dialog is itself a write intent: gate it logged-out (prompt, no dialog).
  const requestOpenEntry = () => {
    if (!gate.allowed) { gate.prompt(AUTH_COPY.positions.gateTrack); return; }
    gate.clear();
    onEntryOpen(true);
  };

  const handleConfirm = (input: OpenPositionInput) => {
    // Confirm is the state-bearing write (open / resting-limit / accept-an-AI-rec all land here).
    // SERVER-ENFORCED gate (AC-E7/D6e): await `POST /api/positions/sim-trade/gate` BEFORE the local
    // `openPosition` write. A stale-cookie / bypassed-FE-check path ⇒ the server returns 403 ⇒ the
    // guard re-shows the prompt and `openPosition` never runs, so NOTHING is persisted. The server is
    // the boundary of record; the FE auth check above is UX sugar only (D6e).
    void gate.guard(AUTH_COPY.positions.gateTrack, () => {
      const res = pf.openPosition(input);
      if (!res.ok && res.reason) setToast(res.reason);
      onEntryOpen(false);
    }, { serverGate: gate.simTradeGate });
  };

  // Save-view writes (save-as-new / save-changes) are state-bearing too — server-gate them the same
  // way so the local customization write is rejected server-side without a valid session (AC-E7).
  const guardSaveView = (run: () => void) => {
    void gate.guard(AUTH_COPY.positions.gateSaveView, run, { serverGate: gate.simTradeGate });
  };

  const strikeList = Array.from(new Set((data?.strike_profile.strikes ?? []).map((s) => s.strike))).sort((a, b) => a - b);
  const expirations = data?.expirations.map((e) => e.date) ?? [];

  const tabSx = (active: boolean, activeColor: string, inactiveColor: string) => ({
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    font: 'inherit',
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: '10px 4px',
    color: active ? activeColor : inactiveColor,
    borderBottom: '2px solid',
    borderColor: active ? 'primary.main' : 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  });

  return (
    <Box data-testid="portfolio-panel">
      {/* Underline tabs — directly under the page header (no outer Card chrome). */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', mt: '20px' }}>
        <Box
          component="button"
          type="button"
          onClick={() => setTab('simulated')}
          data-testid="tab-simulated"
          sx={tabSx(tab === 'simulated', 'primary.main', 'text.secondary')}
        >
          Simulated
          <Box
            component="span"
            sx={{
              fontSize: '0.62rem', fontWeight: 700, color: 'success.main',
              border: '1px solid', borderColor: (t) => `${t.palette.success.main}66`,
              borderRadius: '4px', padding: '1px 5px',
            }}
          >
            PAPER
          </Box>
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => setTab('live')}
          data-testid="tab-live"
          sx={{ ...tabSx(tab === 'live', 'text.primary', 'text.disabled'), ml: '18px' }}
        >
          🔒 Live
        </Box>
      </Box>

      {tab === 'live' ? (
        <LiveTabPanel />
      ) : (
        <Box data-testid="simulated-surface">
          {/* In-context sign-in prompt for a gated write (never silent; never a misleading error). */}
          <SignInPrompt
            text={gate.promptText}
            onSignIn={() => gate.signIn(gate.promptText ?? AUTH_COPY.positions.gateTrack)}
            testid="positions-signin-prompt"
          />

          <CustomizationToolbar
            pf={pf}
            positions={pf.positions}
            guardSaveView={guardSaveView}
            streamOffline={streamOffline}
            onOpenEntry={requestOpenEntry}
            canOpenEntry={!!data}
          />

          {/* Honest browser-local disclosure (D6d, mandatory) — a subtle info line; shown whether signed
              in or out (a property of data residency, not auth state). Must NOT imply sync/account-scoping. */}
          <Typography
            component="p"
            data-testid="positions-disclosure"
            sx={{ fontSize: '0.72rem', color: 'text.disabled', m: '0 0 12px', lineHeight: 1.5 }}
          >
            {AUTH_COPY.positions.disclosure}
          </Typography>

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
            onOpenEntry={requestOpenEntry}
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
    </Box>
  );
}
