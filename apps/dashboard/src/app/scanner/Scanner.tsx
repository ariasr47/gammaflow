/**
 * Scanner — static "coming soon" placeholder (UX_BLUEPRINT §4, AC-Scan-1). In the shell, but does
 * ZERO data work: no fetch, no SSE, no compute, no backend call, no spinner/skeleton. The ABSENCE of
 * any network request is itself the AC-Scan-1 requirement — it must not imply it is working or
 * fetching. The later `scanner` feature builds the real thing.
 */
import { Container, Box, Card, CardContent, Stack, Typography, Chip, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function Scanner() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card variant="outlined" sx={{ bgcolor: 'background.paper' }} data-testid="scanner-placeholder">
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <Box sx={{ fontSize: '2.5rem', mb: 1 }} aria-hidden>🔭</Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Scanner — coming soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A multi-ticker scanner that surfaces the strongest setups across names is on the roadmap.
            It&apos;s not live yet — for now, analyze one ticker at a time on the{' '}
            <strong>Ticker</strong> page.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <Chip size="small" variant="outlined" label="coming soon" sx={{ color: 'text.secondary' }} />
            <Link component={RouterLink} to="/ticker" underline="hover" data-testid="scanner-ticker-link">
              Go to the Ticker viewer →
            </Link>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Scanner;
