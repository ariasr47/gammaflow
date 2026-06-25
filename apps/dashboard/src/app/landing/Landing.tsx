/**
 * Convexa landing page (`/`, full-bleed, OUTSIDE the shell — UX_BLUEPRINT §3, AC-Route-1 / AC-Nav-5).
 * A single dark marketing surface. STATIC — no fetch, no SSE, no compute (rendering `/` issues no
 * network request). It renders NO trader nav shell.
 *
 * Honesty floor (`[no-real-order-path]`): no affordance presents an un-built capability as working.
 * The brokerage-connect control is a NON-navigating waitlist acknowledgement (resting → acknowledged);
 * it never enters a broker flow and never dead-ends. Every value-prop CTA navigates into a real
 * in-shell route (no dead-end — AC-Land-4).
 */
import { useState } from 'react';
import {
  Box, Container, Stack, Typography, Button, Card, CardContent, Chip, Link, Divider, Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ConvexaMark } from '../shell/ConvexaMark';

const DEALER_GAMMA_GLOSS =
  'How options dealers are positioned — it tells you where price tends to get pulled toward or pushed ' +
  'away from, and whether the market is likely to calm down or speed up.';
const SIMULATED_GLOSS =
  'Practice mode — positions and P/L are tracked for you, but nothing is sent to a broker and no real ' +
  'money moves.';

interface ValueProp {
  title: string;
  body: React.ReactNode;
  ctaLabel: string;
  ctaTo: string;
  testid: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    title: 'Ticker / GEX analysis',
    body: (
      <>
        <Tooltip arrow title={DEALER_GAMMA_GLOSS}>
          <Box component="span" sx={{ borderBottom: '1px dotted', cursor: 'help' }}>Dealer gamma</Box>
        </Tooltip>{' '}
        walls, the gamma flip, live order flow, and volatility context for any ticker — the structure
        that says where price is pulled and whether the regime fades or trends.
      </>
    ),
    ctaLabel: 'Analyze a ticker →',
    ctaTo: '/ticker',
    testid: 'vp-ticker',
  },
  {
    title: 'Simulated positions portfolio',
    body: (
      <>
        Track simulated positions with live P/L, fills, grouping, and saved views. Paper-only — every
        trade is{' '}
        <Tooltip arrow title={SIMULATED_GLOSS}>
          <Box component="span" sx={{ borderBottom: '1px dotted', cursor: 'help' }}>SIMULATED</Box>
        </Tooltip>
        , nothing touches a broker.
      </>
    ),
    ctaLabel: 'Open Positions →',
    ctaTo: '/positions',
    testid: 'vp-positions',
  },
  {
    title: 'AI recommendations',
    body: (
      <>
        An AI read on the current setup — risk-first, framed by your trader persona, grounded in the
        positioning the engine already computed. Advisory only; you confirm every paper trade.
      </>
    ),
    ctaLabel: 'See it on a ticker →',
    ctaTo: '/ticker',
    testid: 'vp-airec',
  },
];

export function Landing() {
  // The brokerage-connect waitlist affordance is non-navigating: resting → acknowledged, in place.
  const [waitlisted, setWaitlisted] = useState(false);

  return (
    <Box
      data-testid="landing"
      sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}
    >
      {/* ===== Hero (AC-Land-1) ===== */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Convexity-curve motif — decorative SVG, low opacity, no data/fetch. */}
        <Box
          component="svg"
          viewBox="0 0 1200 400"
          aria-hidden
          data-testid="hero-motif"
          preserveAspectRatio="none"
          sx={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0.12, color: 'primary.main', pointerEvents: 'none',
          }}
        >
          <path d="M0 380 C 300 360, 600 240, 1200 30" fill="none" stroke="currentColor" strokeWidth={3} />
          <path d="M0 400 C 360 390, 700 300, 1200 90" fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.6} />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', py: { xs: 8, md: 12 } }}>
          <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
            <ConvexaMark size={40} fontSize="2.75rem" />
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700, lineHeight: 1.15 }}>
              See the AI read on your real positioning.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
              Connect your positions and get an AI read on your real risk — grounded in live{' '}
              <Tooltip arrow title={DEALER_GAMMA_GLOSS}>
                <Box component="span" sx={{ borderBottom: '1px dotted', cursor: 'help' }}>dealer gamma</Box>
              </Tooltip>
              , not vibes.
            </Typography>
            <Button
              component={RouterLink}
              to="/ticker"
              variant="contained"
              size="large"
              data-testid="cta-primary"
              sx={{ mt: 1 }}
            >
              Open the Ticker viewer →
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ===== Value props — what works today (AC-Land-2, AC-Land-4) ===== */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {VALUE_PROPS.map((vp) => (
            <Card key={vp.testid} variant="outlined" sx={{ bgcolor: 'background.paper' }} data-testid={vp.testid}>
              <CardContent>
                <Stack spacing={1.5} sx={{ height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{vp.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{vp.body}</Typography>
                  <Box>
                    <Link
                      component={RouterLink}
                      to={vp.ctaTo}
                      underline="hover"
                      data-testid={`${vp.testid}-cta`}
                      sx={{ fontWeight: 600 }}
                    >
                      {vp.ctaLabel}
                    </Link>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* ===== Honesty band — coming soon (AC-Land-5, AC-Land-6) ===== */}
      <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          {/* Brokerage connect — the headline future capability. Non-navigating waitlist affordance. */}
          <Card variant="outlined" sx={{ bgcolor: 'background.paper' }} data-testid="brokerage-block">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Box component="span" aria-hidden>🔒</Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Connect a real brokerage</Typography>
                <Chip size="small" variant="outlined" label="coming soon" sx={{ color: 'text.secondary' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Connect your real brokerage positions — get the same AI reads on the risk you&apos;re
                actually carrying. <strong>Coming soon.</strong>
              </Typography>
              {waitlisted ? (
                <Typography variant="body2" color="primary.main" data-testid="waitlist-ack">
                  Thanks — we&apos;ll let you know when brokerage connect is live.
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setWaitlisted(true)}
                  data-testid="waitlist-button"
                >
                  Notify me — coming soon
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Scanner — coming soon (AC-Land-6). Links to the honest placeholder page (never "working"). */}
          <Card variant="outlined" sx={{ bgcolor: 'background.paper' }} data-testid="scanner-block">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Scanner</Typography>
                <Chip size="small" variant="outlined" label="coming soon" sx={{ color: 'text.secondary' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A multi-ticker scanner to surface the best setups across names. <strong>Coming soon.</strong>
              </Typography>
              <Link component={RouterLink} to="/scanner" underline="hover" data-testid="scanner-cta">
                Preview the Scanner →
              </Link>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* ===== Footer (§3.4) ===== */}
      <Divider />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={1}>
          <ConvexaMark size={16} fontSize="1rem" />
          <Typography variant="caption" color="text.secondary" data-testid="footer-disclaimer">
            Convexa is an analysis tool. All positions and trades shown are <strong>simulated</strong>{' '}
            (paper). Not investment advice. No brokerage connection.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default Landing;
