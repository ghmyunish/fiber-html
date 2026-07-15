import { pendingFiberSack, pendingPaperSack, state } from './state.js';
import { latestRemainingFromLines } from './utils.js';

export function statusOf(total, used, remaining) {
  if (used <= 0) return 'notstarted';
  if (remaining <= 0.0001) return 'full';
  return 'partial';
}

export function chip(status) {
  const map = { notstarted: ['Not started', 'notstarted'], partial: ['Partially used', 'partial'], full: ['Fully used', 'full'] };
  const [label, cls] = map[status] || ['Unknown', 'notstarted'];
  return `<span class="chip ${cls}">${label}</span>`;
}

export function withSkipFlags(list) {
  return list.map((item, idx) => {
    const laterUsed = list.slice(idx + 1).some((x) => Number(x.used || 0) > 0);
    return { ...item, flagged: Number(item.remaining || 0) > 0.0001 && laterUsed };
  });
}

export function buildFiberStats() {
  const usedByBatch = latestRemainingFromLines(state.fiberSackStorage, 'fiber_production_id', 'kg');
  return state.fiberProduction.map((row, index) => {
    const used = usedByBatch.get(row.id) || 0;
    const remaining = Math.round((Number(row.kg || 0) - used) * 100) / 100;
    return { ...row, seq: index, used, remaining, status: statusOf(row.kg, used, remaining) };
  });
}

export function buildFiberSacks() {
  const groups = new Map();
  for (const row of state.fiberSackStorage) {
    if (!groups.has(row.sack_code)) groups.set(row.sack_code, []);
    groups.get(row.sack_code).push(row);
  }
  const paperUsedBySack = latestRemainingFromLines(state.paperProduction, 'fiber_sack_code', 'kg_used');
  return [...groups.entries()].map(([sackCode, rows], index) => {
    const total = rows.reduce((sum, row) => sum + Number(row.kg || 0), 0);
    const used = paperUsedBySack.get(sackCode) || 0;
    const remaining = Math.round((total - used) * 100) / 100;
    return {
      sack_code: sackCode,
      created_at: rows[0]?.created_at,
      date: rows[0]?.date_packed,
      entered_by: rows[0]?.entered_by,
      items: rows.map((row) => ({ batchId: row.fiber_production_batch_code, kg: row.kg })),
      total,
      used,
      remaining,
      seq: index,
      status: statusOf(total, used, remaining),
    };
  }).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

export function buildPaperStats() {
  const usedByBatch = latestRemainingFromLines(state.paperSackStorage, 'paper_production_id', 'sheets');
  return state.paperProduction.map((row, index) => {
    const used = usedByBatch.get(row.id) || 0;
    const remaining = Number(row.sheets || 0) - used;
    return { ...row, seq: index, used, remaining, status: statusOf(row.sheets, used, remaining) };
  });
}

export function buildPaperSacks() {
  const groups = new Map();
  for (const row of state.paperSackStorage) {
    if (!groups.has(row.sack_code)) groups.set(row.sack_code, []);
    groups.get(row.sack_code).push(row);
  }
  return [...groups.entries()].map(([sackCode, rows]) => ({
    sack_code: sackCode,
    created_at: rows[0]?.created_at,
    date: rows[0]?.date_packed,
    entered_by: rows[0]?.entered_by,
    items: rows.map((row) => ({ batchId: row.paper_production_batch_code, sheets: row.sheets })),
    total: rows.reduce((sum, row) => sum + Number(row.sheets || 0), 0),
  })).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

export function availableFiberBatches() {
  return buildFiberStats().filter((row) => row.remaining > 0.0001);
}

export function availableFiberSacks() {
  return buildFiberSacks().filter((row) => row.remaining > 0.0001);
}

export function availablePaperBatches() {
  return buildPaperStats().filter((row) => row.remaining > 0.0001);
}

export function pendingFiberRemaining(batchId, selectedRemaining) {
  return selectedRemaining - pendingFiberSack.filter((item) => item.fiberProductionId === batchId).reduce((sum, item) => sum + item.kg, 0);
}

export function pendingPaperRemaining(batchId, selectedRemaining) {
  return selectedRemaining - pendingPaperSack.filter((item) => item.paperProductionId === batchId).reduce((sum, item) => sum + item.sheets, 0);
}
