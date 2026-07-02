/**
 * TradeEntryDialog — the ONE shared sim-entry dialog (sim-entry-unification, owner items 2+3).
 * Used by BOTH launch sites:
 *   - Ticker page (`ticker/TickerDashboard.tsx`) → `useGhostTrade.openTrade` (single-trade engine);
 *   - Positions page (`positions/PositionsPanel.tsx`) → the server-gated `usePortfolio.openPosition`.
 *
 * Skin/structure are the REDESIGNED ghost-trade dialog (Figma 118:1446): a 400px panel-raised slate
 * dialog (`extrasFor(theme).panelRaised` — theme-native, zero hardcoded hex), uppercase field labels,
 * a Manual price / Market / Limit fill-mode segmented control, mandatory confirm, `SIMULATED` chip.
 *
 * Capabilities absorbed from the old `positions/PositionEntryDialog.tsx`:
 *   - the honest per-mode fill-basis preview + chips (`user-entered price` / `snapshot mid` /
 *     `theoretical`), driven by the EXISTING resolver (`positions/entry.ts` — not rewritten here);
 *   - the richer degraded states: `no_resolvable` (market can't fill — no quote AND no theoretical
 *     mark) vs transport `error`, plus the manual-mode "contract stats unavailable" caption;
 *   - mode-scoped price fields (a typed Manual price and a typed Limit price are remembered
 *     independently across mode switches);
 *   - resting-limit semantics (`restingLimit`): the Positions host implements the `pending →
 *     filled/cancelled` lifecycle, so the dialog labels the confirm "Place limit order" and previews
 *     the resting behavior + the already-crossable hint. The Ticker host's single-trade engine has no
 *     resting lifecycle, so without `restingLimit` a limit opens immediately at your price (the
 *     shipped ghost-trade behavior, preserved).
 *
 * SIMULATED everywhere — paper only, no broker, no real order path (`[no-real-order-path]`). The
 * dialog performs no write itself: it emits a mode-tagged `TradeEntrySubmit` and the host owns the
 * (server-gated, on Positions) write. No new/changed API call: the only network touch is the
 * EXISTING `GET /api/contract` lookup (`fetchTrackedContract`) both old dialogs already made.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  Dialog, DialogContent, Button, Chip, Stack, Typography, Select, MenuItem, ToggleButton,
  ToggleButtonGroup, TextField, Box, IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { fetchTrackedContract, OptionRight } from '@org/api';
import { resolveMarketFill, type ResolvedFill } from '../positions/entry';
import { SIMULATED_TIP, DISCLAIMER } from '../positions/labels';
import { extrasFor } from '../tokens';

/** Fill mode — how the entry price is decided. Local dialog state only (no store / lifecycle). */
export type FillMode = 'manual' | 'market' | 'limit';

/** The two bases a MARKET fill can resolve to (`resolveMarketFill` returns nothing else). */
export type MarketFillBasis = 'snapshot' | 'theoretical';

/** The entry pre-fill seam. Originally `{ expiration, strike, right }`; extended (FE-execution lane,
 *  UX_BLUEPRINT §5) to also seed qty/stop/target from an AI rec. Every seeded field stays editable.
 *  `provenance`/`sizingNote` are set only for an AI-sourced prefill (render the source chip + sizing
 *  copy); a manual/Prime prefill leaves them undefined. */
export interface EntryPrefill {
  expiration: string;
  strike: number;
  right: OptionRight;
  qty?: number;
  stop?: number | null;
  target?: number | null;
  provenance?: string;
  sizingNote?: string;
}

/** Common facts every confirm carries (the contract + risk plan). */
interface SubmitBase {
  ticker: string;
  expiration: string;
  strike: number;
  right: OptionRight;
  qty: number;
  stop: number | null;
  target: number | null;
}

/**
 * The mode-tagged confirm payload. Structurally a `positions/usePortfolio.OpenPositionInput`, so the
 * Positions host passes it straight through; the Ticker host maps it onto a ghost-trade
 * `NewTradeForm` (manual/limit → the typed price with basis `manual`; market → the resolved fill).
 */
export type TradeEntrySubmit =
  | (SubmitBase & { entryMode: 'manual'; price: number })
  | (SubmitBase & { entryMode: 'market'; resolvedMark: number; resolvedBasis: MarketFillBasis })
  | (SubmitBase & { entryMode: 'limit'; limitPrice: number });

interface Props {
  open: boolean;
  ticker: string;
  expirations: string[];
  strikes: number[];
  spot: number;
  prefill?: EntryPrefill;
  /** True when the HOST implements the resting-limit `pending → filled/cancelled` lifecycle
   *  (Positions). Controls the limit-mode copy + confirm label ONLY — the emitted payload is the same
   *  mode-tagged union either way. Absent (Ticker), a limit opens immediately at your price. */
  restingLimit?: boolean;
  onClose: () => void;
  onConfirm: (submit: TradeEntrySubmit) => void;
}

/** Uppercase caption label above a field (Figma label pattern; not a MUI floating InputLabel). The
 *  text node stays sentence-case (accessible name) and is uppercased visually via CSS. */
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        display: 'block', mb: 0.5, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'text.disabled',
      }}
    >
      {children}
    </Typography>
  );
}

export function TradeEntryDialog({
  open, ticker, expirations, strikes, spot, prefill, restingLimit = false, onClose, onConfirm,
}: Props) {
  const [mode, setMode] = useState<FillMode>('manual');
  const [expiration, setExpiration] = useState('');
  const [strike, setStrike] = useState<number | ''>('');
  const [right, setRight] = useState<OptionRight>('call');
  const [qty, setQty] = useState(1);
  const [stop, setStop] = useState<number | ''>('');
  const [target, setTarget] = useState<number | ''>('');
  const [manualPrice, setManualPrice] = useState<number | ''>('');
  const [limitPrice, setLimitPrice] = useState<number | ''>('');
  // Resolved market/theoretical fill for the picked contract (the EXISTING entry resolver).
  const [marketFill, setMarketFill] = useState<ResolvedFill | null>(null);
  const [fillState, setFillState] = useState<'idle' | 'loading' | 'error' | 'no_resolvable'>('idle');
  const [contractStatsFailed, setContractStatsFailed] = useState(false);

  // Reset fields each time the dialog opens (honor the Prime / AI prefill). A strike the prefill
  // names that isn't in the chain list still seeds — the user can adjust to the nearest listed one.
  useEffect(() => {
    if (!open) return;
    const nearest = strikes.length ? strikes.reduce((b, s) => (Math.abs(s - spot) < Math.abs(b - spot) ? s : b), strikes[0]) : '';
    setMode('manual');
    setExpiration(prefill?.expiration || expirations[0] || '');
    setStrike(prefill?.strike ?? nearest);
    setRight(prefill?.right ?? 'call');
    setQty(prefill?.qty && prefill.qty >= 1 ? prefill.qty : 1);
    setStop(prefill?.stop ?? '');
    setTarget(prefill?.target ?? '');
    setManualPrice('');
    setLimitPrice('');
    setMarketFill(null);
    setFillState('idle');
    setContractStatsFailed(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve the contract stats / market fill from the picked contract (mid → theoretical BS mark via
  // the shared resolver). Best-effort: a lookup failure only degrades THIS preview, never the app.
  useEffect(() => {
    if (!open || !expiration || strike === '') return;
    let cancelled = false;
    setFillState('loading');
    setContractStatsFailed(false);
    fetchTrackedContract(ticker, { expiration, strike: Number(strike), right })
      .then((tc) => {
        if (cancelled) return;
        if (!tc) {
          setContractStatsFailed(true);
          setMarketFill(null);
          setFillState('no_resolvable'); // 404 / not in snapshot
          return;
        }
        const fill = resolveMarketFill(tc, spot, right, Number(strike));
        if (!fill) { setMarketFill(null); setFillState('no_resolvable'); return; }
        setMarketFill(fill);
        setFillState('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setContractStatsFailed(true);
        setMarketFill(null);
        setFillState('error');
      });
    return () => { cancelled = true; };
  }, [open, ticker, expiration, strike, right, spot]);

  // ---- Derived previews / guards per mode ------------------------------------------------------
  const manualCost = manualPrice !== '' ? Number(manualPrice) * 100 * qty : null;
  const marketCost = marketFill ? marketFill.mark * 100 * qty : null;
  const limitCost = limitPrice !== '' ? Number(limitPrice) * 100 * qty : null;
  // The live-mark hint for the Limit preview: the same resolved mid/theoretical mark the market fill
  // uses (resolveMarketFill is the single source of that value).
  const liveMark = marketFill?.mark ?? null;
  const alreadyCrossable = liveMark != null && limitPrice !== '' && liveMark <= Number(limitPrice);

  const canConfirm = (() => {
    if (strike === '' || !expiration || qty < 1) return false;
    if (mode === 'manual') return manualPrice !== '' && Number(manualPrice) > 0;
    if (mode === 'market') return marketFill != null && fillState === 'idle';
    return limitPrice !== '' && Number(limitPrice) > 0; // limit
  })();

  // "Place limit order" only when the host actually rests the order (Positions lifecycle).
  const confirmLabel = restingLimit && mode === 'limit' ? 'Place limit order' : 'Open simulated position';
  const priceLabel = mode === 'limit' ? 'Limit price' : 'Manual price';

  const handleConfirm = () => {
    if (strike === '' || !expiration) return;
    const base: SubmitBase = {
      ticker, expiration, strike: Number(strike), right, qty,
      stop: stop === '' ? null : Number(stop), target: target === '' ? null : Number(target),
    };
    if (mode === 'manual' && manualPrice !== '') {
      onConfirm({ ...base, entryMode: 'manual', price: Number(manualPrice) });
    } else if (mode === 'market' && marketFill) {
      // Safe narrow: `resolveMarketFill` only ever returns `snapshot` or `theoretical`.
      onConfirm({ ...base, entryMode: 'market', resolvedMark: marketFill.mark, resolvedBasis: marketFill.basis as MarketFillBasis });
    } else if (mode === 'limit' && limitPrice !== '') {
      onConfirm({ ...base, entryMode: 'limit', limitPrice: Number(limitPrice) });
    }
  };

  // Recessed field fill (Figma). Matches BOTH the TextField case (`.MuiOutlinedInput-root` is a
  // descendant) and the bare Select case (the Select root IS `.MuiOutlinedInput-root`, so a descendant
  // selector alone would miss it — include the self-selector).
  const inputSx = {
    '& .MuiOutlinedInput-root, &.MuiOutlinedInput-root': { bgcolor: 'background.default' },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '14px', border: 1, borderColor: 'divider', backgroundImage: 'none',
            bgcolor: (theme) => extrasFor(theme).panelRaised,
          },
        },
      }}
    >
      <DialogContent data-testid="trade-entry-dialog" sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Header — title + SIMULATED (+ provenance) + close. */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ flexGrow: 1, minWidth: 0, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Open simulated position · {ticker}
              </Typography>
              <Chip
                size="small" label="SIMULATED" title={SIMULATED_TIP}
                sx={(t) => ({ bgcolor: alpha(t.palette.success.main, 0.18), color: 'success.main', fontWeight: 700, letterSpacing: '0.04em' })}
              />
              {prefill?.provenance && <Chip size="small" color="primary" variant="outlined" label={prefill.provenance} />}
            </Stack>
            <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Fill-mode segmented control. */}
          <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && setMode(v)} fullWidth aria-label="fill mode">
            <ToggleButton value="manual">Manual price</ToggleButton>
            <ToggleButton value="market">Market</ToggleButton>
            <ToggleButton value="limit">Limit</ToggleButton>
          </ToggleButtonGroup>

          {/* Expiration. */}
          <Box>
            <FieldLabel htmlFor="entry-expiration">Expiration</FieldLabel>
            <Select
              id="entry-expiration" size="small" fullWidth value={expiration}
              onChange={(e) => setExpiration(String(e.target.value))} sx={inputSx}
              inputProps={{ 'aria-label': 'Expiration' }}
            >
              {expirations.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </Box>

          {/* Strike. */}
          <Box>
            <FieldLabel htmlFor="entry-strike">Strike</FieldLabel>
            <Select
              id="entry-strike" size="small" fullWidth value={strike === '' ? '' : String(strike)}
              onChange={(e) => setStrike(Number(e.target.value))} sx={inputSx}
              inputProps={{ 'aria-label': 'Strike' }}
            >
              {strikes.map((s) => <MenuItem key={s} value={String(s)}>${s}</MenuItem>)}
            </Select>
          </Box>

          {/* Call / Put — active CALL = success green, active PUT = error red. */}
          <ToggleButtonGroup
            exclusive size="small" value={right} onChange={(_, v) => v && setRight(v)} fullWidth
            sx={{
              '& .MuiToggleButton-root.Mui-selected': { color: 'common.white' },
              '& .MuiToggleButton-root[value="call"].Mui-selected': {
                bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' },
              },
              '& .MuiToggleButton-root[value="put"].Mui-selected': {
                bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' },
              },
            }}
          >
            <ToggleButton value="call">Call</ToggleButton>
            <ToggleButton value="put">Put</ToggleButton>
          </ToggleButtonGroup>

          {/* Quantity. */}
          <Box>
            <FieldLabel htmlFor="entry-qty">Quantity</FieldLabel>
            <TextField
              id="entry-qty" size="small" fullWidth type="number" value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              slotProps={{ htmlInput: { min: 1, 'aria-label': 'Quantity' } }} sx={inputSx}
            />
          </Box>

          {/* Mode-scoped price (hidden in Market mode). Manual and Limit keep separate typed values. */}
          {mode !== 'market' && (
            <Box>
              <FieldLabel htmlFor="entry-price">{priceLabel}</FieldLabel>
              <TextField
                id="entry-price" size="small" fullWidth type="number"
                value={mode === 'limit' ? limitPrice : manualPrice}
                onChange={(e) => {
                  const v = e.target.value === '' ? '' as const : Number(e.target.value);
                  if (mode === 'limit') setLimitPrice(v); else setManualPrice(v);
                }}
                slotProps={{ htmlInput: { 'aria-label': priceLabel } }} sx={inputSx}
              />
            </Box>
          )}

          {/* Risk plan — editable; seeded from an AI rec's exit_plan when Accepted, blank for a
              manual entry. Not an input to the mark/P-L math (v1); recorded with the trade. */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel htmlFor="entry-stop">Stop (optional)</FieldLabel>
              <TextField
                id="entry-stop" size="small" fullWidth type="number" value={stop}
                onChange={(e) => setStop(e.target.value === '' ? '' : Number(e.target.value))}
                slotProps={{ htmlInput: { 'aria-label': 'Stop (optional)' } }} sx={inputSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel htmlFor="entry-target">Target (optional)</FieldLabel>
              <TextField
                id="entry-target" size="small" fullWidth type="number" value={target}
                onChange={(e) => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
                slotProps={{ htmlInput: { 'aria-label': 'Target (optional)' } }} sx={inputSx}
              />
            </Box>
          </Stack>

          {prefill?.sizingNote && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{prefill.sizingNote}</Typography>
          )}

          {/* Fill preview — per mode, honest about the basis (S6). */}
          <Box>
            {fillState === 'loading' ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Select a contract to see the fill.</Typography>
            ) : fillState === 'error' ? (
              <Typography variant="body2" color="error">Couldn't load the chain for entry — try again.</Typography>
            ) : mode === 'manual' ? (
              <>
                <Typography variant="body2" sx={{ color: manualPrice === '' ? 'text.secondary' : 'text.primary' }}>
                  {manualPrice === ''
                    ? 'Enter a price — opens at exactly the price you type.'
                    : `Opens at your price $${Number(manualPrice).toFixed(2)} · Cost $${manualCost?.toFixed(0)} — user-entered, not a market quote.`}
                </Typography>
                <Chip size="small" variant="outlined" sx={{ mt: 0.5 }} label="user-entered price" />
                {contractStatsFailed && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Contract stats unavailable — your entry still works.
                  </Typography>
                )}
              </>
            ) : mode === 'market' ? (
              fillState === 'no_resolvable' ? (
                <Typography variant="body2" color="error">
                  No quote or theoretical mark available for this contract — a market order can't fill. Try Manual price, or pick another contract.
                </Typography>
              ) : marketFill ? (
                <>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    Fill: mid ${marketFill.mark.toFixed(2)} · Cost ${marketCost?.toFixed(0)} (mid × 100 × qty)
                  </Typography>
                  <Chip
                    size="small" variant="outlined" sx={{ mt: 0.5 }}
                    label={marketFill.basis === 'theoretical' ? 'theoretical' : 'snapshot mid'}
                  />
                  {marketFill.basis === 'theoretical' && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      No live quote — fill will use a theoretical (Black-Scholes) mark.
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Select a contract to see the fill.</Typography>
              )
            ) : restingLimit ? (
              // Limit — the host rests it `pending` and fills only on a LIVE cross (Positions).
              <>
                <Typography variant="body2" sx={{ color: limitPrice === '' ? 'text.secondary' : 'text.primary' }}>
                  {limitPrice === ''
                    ? 'Enter a limit price.'
                    : `Rests until the live mark reaches $${Number(limitPrice).toFixed(2)}, then fills at $${Number(limitPrice).toFixed(2)}. Stays cancellable until it fills.`}
                </Typography>
                {alreadyCrossable && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    The live mark is already at or below your limit — this will fill on the next live tick.
                  </Typography>
                )}
              </>
            ) : (
              // Limit — immediate open at your price (Ticker: no resting lifecycle in the engine).
              <Typography variant="body2" sx={{ color: limitPrice === '' ? 'text.secondary' : 'text.primary' }}>
                {limitPrice === ''
                  ? 'Enter a limit price to see the fill.'
                  : `Fills at your limit $${Number(limitPrice).toFixed(2)} · Cost $${limitCost?.toFixed(0)} (price × 100 × qty)`}
              </Typography>
            )}
          </Box>

          {/* Disclaimer (verbatim). */}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{DISCLAIMER}</Typography>

          {/* Footer. */}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 0.5 }}>
            <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" disableElevation disabled={!canConfirm} onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
