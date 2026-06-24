/**
 * The all-positions view (UX_BLUEPRINT §6 S2/S3/S4/S5/S9): renders the derived groups as a dense
 * table (default) or cards, with per-group P/L subtotals. Empty/filtered-empty states render copy,
 * never an error/blank. Closed/cancelled (history) rows render their static realized facts. Live
 * cells degrade via PositionRow; static cells keep rendering.
 */
import {
  Box, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent,
  Button, Tooltip,
} from '@mui/material';
import type { DerivedGroup, DerivedRow } from './derive';
import type { ColumnKey, Density, LayoutMode } from './types';
import { COLUMN_LABELS } from './defaults';
import { cellContent, PendingAffordance, ClosedSummary, RowContext } from './PositionRow';
// PendingAffordance is rendered inline in both layouts for a pending row.
import type { PlSample } from './useTrends';
import { money, EMPTY_NO_POSITIONS, EMPTY_FILTERED, SUBTOTAL_TIP, HISTORY_CAPTION } from './labels';

export interface ViewProps {
  groups: DerivedGroup[];
  columns: ColumnKey[];
  layout: LayoutMode;
  density: Density;
  streamOffline: boolean;
  /** Total positions in the (unfiltered) collection — distinguishes "no positions" vs "filtered empty". */
  totalCount: number;
  /** Is the active filter the closed/history view (status = closed/cancelled)? */
  isHistory: boolean;
  markResFor: (row: DerivedRow) => RowContext['markRes'];
  trendFor: (id: string) => PlSample[];
  onOpenEntry: () => void;
  onClearFilter: () => void;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
}

export function PositionsView(props: ViewProps) {
  const { groups, totalCount, isHistory } = props;
  const visibleRowCount = groups.reduce((n, g) => n + g.rows.length, 0);

  if (visibleRowCount === 0) {
    if (isHistory) {
      return <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} data-testid="history-empty">No closed or cancelled positions yet.</Typography>;
    }
    if (totalCount === 0) {
      return (
        <Box sx={{ mt: 2 }} data-testid="empty-no-positions">
          <Typography variant="body2" color="text.secondary">{EMPTY_NO_POSITIONS}</Typography>
          <Button variant="outlined" sx={{ mt: 1 }} onClick={props.onOpenEntry}>Open simulated position</Button>
        </Box>
      );
    }
    return (
      <Box sx={{ mt: 2 }} data-testid="empty-filtered">
        <Typography variant="body2" color="text.secondary">{EMPTY_FILTERED}</Typography>
        <Button variant="text" sx={{ mt: 1 }} onClick={props.onClearFilter}>Clear filter</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {isHistory && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }} data-testid="history-caption">
          {HISTORY_CAPTION}
        </Typography>
      )}
      {props.layout === 'table'
        ? <TableLayout {...props} />
        : <CardLayout {...props} />}
    </Box>
  );
}

function ctxFor(props: ViewProps, row: DerivedRow): RowContext {
  return {
    row,
    markRes: props.markResFor(row),
    trend: props.trendFor(row.position.id),
    streamOffline: props.streamOffline,
    onClose: props.onClose,
    onCancel: props.onCancel,
  };
}

function Subtotal({ group }: { group: DerivedGroup }) {
  const excl = group.excludedCount > 0
    ? ` · ${group.excludedCount} position${group.excludedCount > 1 ? 's' : ''} excluded (unavailable)` : '';
  return (
    <Tooltip arrow title={SUBTOTAL_TIP}>
      <Typography component="span" variant="caption" color="text.secondary" data-testid="subtotal">
        Subtotal {money(group.subtotal)}{excl}
      </Typography>
    </Tooltip>
  );
}

function TableLayout(props: ViewProps) {
  const { columns, density } = props;
  const size = density === 'compact' ? 'small' : 'medium';
  const isGrouped = props.groups.length > 1 || props.groups[0]?.key !== '__all__';
  return (
    <Table size={size} data-testid="positions-table" data-density={density}>
      <TableHead>
        <TableRow>
          {columns.map((c) => <TableCell key={c}>{c === 'simulated' ? '' : COLUMN_LABELS[c]}</TableCell>)}
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {props.groups.map((g) => (
          <GroupRows key={g.key} group={g} props={props} columns={columns} showHeader={isGrouped} />
        ))}
      </TableBody>
    </Table>
  );
}

function GroupRows({ group, props, columns, showHeader }: { group: DerivedGroup; props: ViewProps; columns: ColumnKey[]; showHeader: boolean }) {
  return (
    <>
      {showHeader && (
        <TableRow data-testid="group-header" data-group={group.key}>
          <TableCell colSpan={columns.length + 1} sx={{ bgcolor: 'action.hover' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', opacity: props.streamOffline ? 0.7 : 1 }}>
              <Typography variant="subtitle2">{group.label} ({group.rows.length})</Typography>
              <Subtotal group={group} />
              {props.streamOffline && <Typography variant="caption" color="text.disabled">⏸</Typography>}
            </Stack>
          </TableCell>
        </TableRow>
      )}
      {group.rows.map((row) => {
        const ctx = ctxFor(props, row);
        const isTerminal = row.position.status === 'closed' || row.position.status === 'cancelled';
        return (
          <TableRow key={row.position.id} data-testid="position-row" data-id={row.position.id} data-status={row.position.status}>
            {columns.map((c) => <TableCell key={c}>{cellContent(c, ctx)}</TableCell>)}
            <TableCell>
              {row.position.status === 'open' && <Button size="small" onClick={() => props.onClose(row.position.id)}>Close</Button>}
              {row.position.status === 'pending' && <PendingAffordance ctx={ctx} />}
              {isTerminal && <ClosedSummary row={row} />}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function CardLayout(props: ViewProps) {
  const { columns, density } = props;
  const isGrouped = props.groups.length > 1 || props.groups[0]?.key !== '__all__';
  return (
    <Stack spacing={density === 'compact' ? 1 : 2} data-testid="positions-cards" data-density={density}>
      {props.groups.map((g) => (
        <Box key={g.key}>
          {isGrouped && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }} data-testid="group-header" data-group={g.key}>
              <Typography variant="subtitle2">{g.label} ({g.rows.length})</Typography>
              <Subtotal group={g} />
            </Stack>
          )}
          <Stack spacing={density === 'compact' ? 1 : 1.5}>
            {g.rows.map((row) => {
              const ctx = ctxFor(props, row);
              const isTerminal = row.position.status === 'closed' || row.position.status === 'cancelled';
              return (
                <Card key={row.position.id} variant="outlined" data-testid="position-card" data-id={row.position.id} data-status={row.position.status}>
                  <CardContent sx={{ py: density === 'compact' ? 1 : 1.5 }}>
                    <Stack spacing={0.5}>
                      {columns.filter((c) => c !== 'simulated').map((c) => (
                        <Stack key={c} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">{COLUMN_LABELS[c]}</Typography>
                          <Box>{cellContent(c, ctx)}</Box>
                        </Stack>
                      ))}
                      {isTerminal && <ClosedSummary row={row} />}
                      <PendingAffordance ctx={ctx} />
                      {row.position.status === 'open' && (
                        <Box><Button size="small" onClick={() => props.onClose(row.position.id)}>Close</Button></Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
