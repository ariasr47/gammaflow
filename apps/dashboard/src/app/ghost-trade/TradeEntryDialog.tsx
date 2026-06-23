/**
 * Ghost-trade entry dialog (paper trade — no broker, no real order). Picks a contract, shows the
 * live fill (option mid → cost), and emits a NewTradeForm. Fills at the snapshot mid, or a labeled
 * theoretical mark when no quote exists.
 */
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Stack, Typography,
  FormControl, InputLabel, Select, MenuItem, ToggleButton, ToggleButtonGroup, TextField, Box,
} from '@mui/material';
import { fetchTrackedContract, OptionRight } from '@org/api';
import { bsPrice } from './mark';
import { NewTradeForm } from './useGhostTrade';
import type { MarkBasis } from './types';

const SIMULATED_TIP = 'A paper trade — no broker, no real money, no real order is ever placed.';
const DISCLAIMER =
  'Paper trade — no broker, no real money. Filled at the option mid; fees, slippage, taxes and ' +
  'assignment are not modeled.';

interface Props {
  open: boolean;
  ticker: string;
  expirations: string[];
  strikes: number[];
  spot: number;
  prefill?: { expiration: string; strike: number; right: OptionRight };
  onClose: () => void;
  onConfirm: (form: NewTradeForm) => void;
}

export function TradeEntryDialog({ open, ticker, expirations, strikes, spot, prefill, onClose, onConfirm }: Props) {
  const [expiration, setExpiration] = useState('');
  const [strike, setStrike] = useState<number | ''>('');
  const [right, setRight] = useState<OptionRight>('call');
  const [qty, setQty] = useState(1);
  const [fill, setFill] = useState<{ mark: number; basis: MarkBasis } | null>(null);
  const [fillState, setFillState] = useState<'idle' | 'loading' | 'error'>('idle');

  // Reset fields each time the dialog opens (honor the Prime prefill).
  useEffect(() => {
    if (!open) return;
    const nearest = strikes.length ? strikes.reduce((b, s) => (Math.abs(s - spot) < Math.abs(b - spot) ? s : b), strikes[0]) : '';
    setExpiration(prefill?.expiration ?? expirations[0] ?? '');
    setStrike(prefill?.strike ?? nearest);
    setRight(prefill?.right ?? 'call');
    setQty(1);
    setFill(null);
    setFillState('idle');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve the fill basis from the picked contract.
  useEffect(() => {
    if (!open || !expiration || strike === '') return;
    let cancelled = false;
    setFillState('loading');
    fetchTrackedContract(ticker, { expiration, strike: Number(strike), right })
      .then((tc) => {
        if (cancelled) return;
        if (!tc) { setFill(null); setFillState('error'); return; }
        const mid = tc.option_quote?.mid;
        if (mid != null) setFill({ mark: mid, basis: 'snapshot' });
        else if (tc.iv != null) setFill({ mark: bsPrice(right, spot, Number(strike), tc.dte, tc.iv), basis: 'theoretical' });
        else setFill(null);
        setFillState('idle');
      })
      .catch(() => { if (!cancelled) { setFill(null); setFillState('error'); } });
    return () => { cancelled = true; };
  }, [open, ticker, expiration, strike, right, spot]);

  const cost = fill ? fill.mark * 100 * qty : null;
  const canConfirm = fill != null && fillState !== 'error' && qty >= 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <span>Open simulated trade · {ticker}</span>
          <Chip size="small" color="default" variant="outlined" label="SIMULATED" title={SIMULATED_TIP} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Expiration</InputLabel>
            <Select label="Expiration" value={expiration} onChange={(e) => setExpiration(String(e.target.value))}>
              {expirations.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Strike</InputLabel>
            <Select label="Strike" value={strike === '' ? '' : String(strike)} onChange={(e) => setStrike(Number(e.target.value))}>
              {strikes.map((s) => <MenuItem key={s} value={String(s)}>${s}</MenuItem>)}
            </Select>
          </FormControl>
          <ToggleButtonGroup exclusive size="small" value={right} onChange={(_, v) => v && setRight(v)} fullWidth>
            <ToggleButton value="call">Call</ToggleButton>
            <ToggleButton value="put">Put</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small" type="number" label="Quantity" value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <Box>
            {fillState === 'error' ? (
              <Typography variant="body2" color="error">Couldn't load the chain for entry — try again.</Typography>
            ) : fill ? (
              <>
                <Typography variant="body2">
                  Fill: mid ${fill.mark.toFixed(2)} · Cost ${cost?.toFixed(0)} (mid × 100 × qty)
                </Typography>
                {fill.basis === 'theoretical' && (
                  <Typography variant="caption" color="text.secondary">
                    No live quote — fill will use a theoretical (Black-Scholes) mark.
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">Select a contract to see the fill.</Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">{DISCLAIMER}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained" disabled={!canConfirm}
          onClick={() => fill && onConfirm({ expiration, strike: Number(strike), right, qty, entryMark: fill.mark, entryBasis: fill.basis })}
        >
          Open simulated trade
        </Button>
      </DialogActions>
    </Dialog>
  );
}
