import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  AppBar, Toolbar, Typography, Container, Box, Card, CardContent,
  Chip, CircularProgress, TextField, Stack, Alert,
} from '@mui/material';
import { getTicker, TickerBundle } from '@org/api';
import { GexProfileChart } from './gex-profile-chart';

const POLL_MS = 60_000; // matches the backend cache TTL

// Example of MUI's styled() API (the styled-components-style authoring experience, on
// MUI's Emotion engine). Color reacts to a prop, the way you'd do in styled-components.
const StatTile = styled(Card)<{ accent?: 'up' | 'down' | 'neutral' }>(
  ({ theme, accent }) => ({
    height: '100%',
    borderLeft: `4px solid ${
      accent === 'up' ? theme.palette.success.main
      : accent === 'down' ? theme.palette.error.main
      : theme.palette.divider
    }`,
  })
);

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'up' | 'down' | 'neutral' }) {
  return (
    <StatTile accent={accent} variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6">{value}</Typography>
      </CardContent>
    </StatTile>
  );
}

function TickerDashboard() {
  const { ticker = 'TSLA' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TickerBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState(ticker);

  const load = useCallback(() => {
    getTicker(ticker, { minDte: 7, maxDte: 45 })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message));
  }, [ticker]);

  useEffect(() => {
    setData(null);
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const m = data?.market_state;
  const fresh = data?.meta.freshness;
  const sig = data?.signals;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <TextField
          size="small" label="Ticker" value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && symbol) navigate(`/${symbol}`); }}
        />
        {sig?.regime && (
          <Chip
            label={sig.regime.replace('_', ' ')}
            color={sig.regime === 'positive_gamma' ? 'success' : 'error'}
          />
        )}
        {fresh?.stale && (
          <Alert severity="warning" sx={{ py: 0 }}>
            snapshot {fresh.data_age_seconds}s old — levels may be unreliable
          </Alert>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <CircularProgress />}

      {m && (
        <>
          <Typography variant="h1" gutterBottom>
            {m.ticker} · ${m.price?.toFixed(2)}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              (levels @ ${m.gex_spot?.toFixed(2)}, DTE {m.dte_min}–{m.dte_max})
            </Typography>
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
            <Stat label="Call wall" value={`$${m.call_wall}`} accent="up" />
            <Stat label="Put wall" value={`$${m.put_wall}`} accent="down" />
            <Stat label="Gamma flip" value={`$${m.gamma_flip}`} accent="neutral" />
            <Stat label="Peak GEX (magnet)" value={`$${m.peak_gex_strike ?? '—'}`} accent="neutral" />
            <Stat label="Net GEX" value={`$${(m.net_gex / 1e6).toFixed(1)}M`} accent={m.net_gex >= 0 ? 'up' : 'down'} />
            <Stat label="Max pain" value={`$${m.max_pain ?? '—'}`} accent="neutral" />
            <Stat label="IV / HV" value={m.iv_hv_ratio.toFixed(2)} accent="neutral" />
            <Stat label="Opportunity" value={`${sig?.opportunity_score ?? 0}`} accent="neutral" />
          </Box>

          {data?.strike_profile && (
            <GexProfileChart
              strikes={data.strike_profile.strikes}
              spot={m.gex_spot ?? m.price}
              callWall={m.call_wall}
              putWall={m.put_wall}
              gammaFlip={m.gamma_flip}
            />
          )}

          {sig?.setups?.length ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Setups</Typography>
              <Stack spacing={1}>
                {sig.setups.map((s, i) => (
                  <Card key={i} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {s.name} <Chip size="small" label={s.conviction} sx={{ ml: 1 }} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{s.rationale}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 3 }}>No clean setup right now.</Alert>
          )}
        </>
      )}
    </Container>
  );
}

export function App() {
  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar><Typography variant="h6">GammaFlow</Typography></Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<Navigate to="/TSLA" replace />} />
        <Route path="/:ticker" element={<TickerDashboard />} />
      </Routes>
    </>
  );
}

export default App;
