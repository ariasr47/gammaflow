/**
 * The Live tab (LOCKED placeholder — UX_BLUEPRINT §6 S10, ARCHITECTURE_CONTRACT §4.2). Present +
 * selectable, but structurally inert by construction: it imports NONE of the store, mark/fill engine,
 * `fetchTrackedContract`, the SSE feed, or the customization state; it receives no position data; it
 * makes NO network call and exposes NO entry / order affordance. If it imports nothing live, it can
 * wire to nothing.
 *
 * Zero-import boundary (the `no-real-order-path` enforcement): this module imports ONLY MUI + the
 * static copy constants (`labels.ts`). Do NOT add any import of a data source here — that is the
 * enforcement. (The hatched-card visual is inlined here, NOT imported from `ui/ComingSoonBox`, so the
 * import surface stays MUI-only; the 18px-stripe hatch + the literals are reproduced per this frame.)
 */
import { Box, Typography } from '@mui/material';
import { LIVE_HEADING, LIVE_BODY, LIVE_LOCK_CHIP } from './labels';

export function LiveTabPanel() {
  return (
    <Box
      data-testid="live-locked-panel"
      sx={{
        mt: '24px',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '10px',
        // Hatched inert affordance — `#161b22` (paper) alternating with `#14181f` (hatch-alt), 18px
        // stripes per this frame. sx literals per the token map (prototype-only hatch extras).
        backgroundImage: 'repeating-linear-gradient(135deg, #161b22 0 18px, #14181f 18px 36px)',
        p: '48px',
        textAlign: 'center',
      }}
    >
      <Typography component="div" sx={{ fontSize: '1.6rem', mb: '10px' }}>🔒</Typography>
      <Typography component="h3" sx={{ fontSize: '1.15rem', fontWeight: 700, m: '0 0 8px' }}>
        {LIVE_HEADING}
      </Typography>
      <Typography
        component="p"
        sx={{ maxWidth: 440, mx: 'auto', fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.55, m: 0 }}
      >
        {LIVE_BODY}
      </Typography>
      <Box
        data-testid="live-lock-chip"
        component="span"
        sx={{
          display: 'inline-block',
          mt: '14px',
          fontSize: '0.68rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'warning.main',
          border: '1px solid rgba(255,167,38,0.35)',
          bgcolor: 'rgba(255,167,38,0.08)',
          borderRadius: 999,
          padding: '3px 10px',
        }}
      >
        {LIVE_LOCK_CHIP}
      </Box>
    </Box>
  );
}
