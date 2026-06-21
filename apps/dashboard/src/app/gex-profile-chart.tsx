import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell,
  ReferenceLine, Tooltip,
} from 'recharts';
import type { StrikeRow } from '@org/api';

interface Props {
  strikes: StrikeRow[];
  spot: number;
  callWall: number;
  putWall: number;
  gammaFlip: number;
}

const fmtM = (v: number) => `${(v / 1e6).toFixed(1)}M`;

/**
 * Horizontal net-GEX profile: one bar per strike (green = net positive / call-dominated,
 * red = net negative / put-dominated), strikes high→low on the Y axis. Call/put walls are
 * drawn at full opacity; spot and gamma flip are dashed reference lines.
 */
export function GexProfileChart({ strikes, spot, callWall, putWall, gammaFlip }: Props) {
  const theme = useTheme();
  const green = theme.palette.success.main;
  const red = theme.palette.error.main;

  const data = useMemo(() => {
    // Keep a readable window around spot, sorted high→low so high strikes sit on top.
    const lo = spot * 0.88;
    const hi = spot * 1.12;
    return strikes
      .filter((s) => s.strike >= lo && s.strike <= hi)
      .sort((a, b) => b.strike - a.strike);
  }, [strikes, spot]);

  // Snap a price to the nearest plotted strike so a category-axis reference line lands on a band.
  const nearest = (price: number) =>
    data.reduce(
      (best, s) => (Math.abs(s.strike - price) < Math.abs(best - price) ? s.strike : best),
      data[0]?.strike ?? price
    );

  if (!data.length) return null;

  const LegendDot = ({ color, label }: { color: string; label: string }) => (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color }} />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6">GEX strike profile</Typography>
          <Stack direction="row" spacing={2}>
            <LegendDot color={green} label="Call-dominated (net +)" />
            <LegendDot color={red} label="Put-dominated (net −)" />
          </Stack>
        </Stack>
        <ResponsiveContainer width="100%" height={Math.max(360, data.length * 22)}>
          <BarChart layout="vertical" data={data} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
            <XAxis type="number" tickFormatter={fmtM} stroke={theme.palette.text.secondary} />
            <YAxis
              type="category" dataKey="strike" width={56}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            />
            <Tooltip
              cursor={{ fill: theme.palette.action.hover }}
              formatter={(v) => fmtM(Number(v))}
              labelFormatter={(l) => `Strike $${l}`}
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
              labelStyle={{ color: theme.palette.text.secondary }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <ReferenceLine x={0} stroke={theme.palette.divider} />
            <ReferenceLine
              y={nearest(spot)} stroke={theme.palette.primary.main} strokeDasharray="4 3"
              label={{ value: `spot $${spot.toFixed(0)}`, position: 'right', fontSize: 11, fill: theme.palette.primary.main }}
            />
            <ReferenceLine
              y={nearest(gammaFlip)} stroke={theme.palette.warning.main} strokeDasharray="4 3"
              label={{ value: `flip $${gammaFlip.toFixed(0)}`, position: 'right', fontSize: 11, fill: theme.palette.warning.main }}
            />
            <Bar dataKey="net_gex" name="Net GEX" isAnimationActive={false}>
              {data.map((s) => (
                <Cell
                  key={s.strike}
                  fill={s.net_gex >= 0 ? green : red}
                  fillOpacity={s.strike === callWall || s.strike === putWall ? 1 : 0.82}
                  stroke={s.strike === callWall || s.strike === putWall ? theme.palette.common.white : 'none'}
                  strokeWidth={s.strike === callWall || s.strike === putWall ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default GexProfileChart;
