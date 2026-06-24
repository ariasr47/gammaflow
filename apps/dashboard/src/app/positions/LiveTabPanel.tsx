/**
 * The Live tab (LOCKED placeholder — UX_BLUEPRINT §6 S10, ARCHITECTURE_CONTRACT §4.2). Present +
 * selectable, but structurally inert by construction: it imports NONE of the store, mark/fill engine,
 * `fetchTrackedContract`, the SSE feed, or the customization state; it receives no position data; it
 * makes NO network call and exposes NO entry / order affordance. If it imports nothing live, it can
 * wire to nothing.
 *
 * Zero-import boundary: this module imports ONLY MUI + the static copy constants. Do not add any
 * import of a data source here — that is the enforcement.
 */
import { Box, Card, CardContent, Stack, Typography, Chip } from '@mui/material';
import { LIVE_HEADING, LIVE_BODY, LIVE_LOCK_CHIP } from './labels';

export function LiveTabPanel() {
  return (
    <Box sx={{ mt: 2 }} data-testid="live-locked-panel">
      <Card variant="outlined" sx={{ bgcolor: 'action.hover', opacity: 0.85 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" color="text.secondary">🔒 {LIVE_HEADING}</Typography>
            <Chip size="small" variant="outlined" color="default" label={LIVE_LOCK_CHIP} data-testid="live-lock-chip" />
          </Stack>
          <Typography variant="body2" color="text.secondary">{LIVE_BODY}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
