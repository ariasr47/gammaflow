/**
 * The Convexa wordmark + convexity-curve mark (UX_BLUEPRINT §1). UI-ONLY brand surface — it is the
 * single place the visible "Convexa" wordmark is rendered (nav + landing). It carries NO data, NO
 * fetch: the convexity mark is a decorative upward-curving (convex) SVG arc in `primary.main`, a nod
 * to the gamma/convexity curve the product computes — never a literal chart.
 *
 * Brand is UI-only (AC-Inv-9): this swaps only the *visible* wordmark. It renames no package, folder,
 * code identifier, or durable localStorage key.
 */
import { Box, Typography } from '@mui/material';

interface Props {
  /** Mark + wordmark height in px (mark scales with it). Nav ≈ 18, hero larger. */
  size?: number;
  /** Wordmark font size (CSS). Defaults to a nav-appropriate size. */
  fontSize?: string | number;
}

export function ConvexaMark({ size = 18, fontSize = '1.15rem' }: Props) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {/* Decorative convex arc — an upward-bowing curve in `primary.main`. No data, no fetch. */}
      <Box
        component="svg"
        viewBox="0 0 24 24"
        aria-hidden
        data-testid="convexa-mark"
        sx={{ width: size, height: size, display: 'block', flexShrink: 0, color: 'primary.main' }}
      >
        <path
          d="M2 20 C 7 19, 12 13, 22 4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Box>
      <Typography
        component="span"
        sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize, lineHeight: 1 }}
      >
        Convexa
      </Typography>
    </Box>
  );
}

export default ConvexaMark;
