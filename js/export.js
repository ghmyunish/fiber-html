import { activeTab } from './state.js';
import { $ } from './utils.js';
import { buildFiberSacks, buildFiberStats, buildPaperSacks, buildPaperStats } from './domain.js';

function exportRows(rows, sheetName, workbook) {
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
}

export function exportCurrentTab() {
  const wb = XLSX.utils.book_new();
  const map = {
    overview: [
      { section: 'fiber_batches', rows: buildFiberStats() },
      { section: 'fiber_sacks', rows: buildFiberSacks() },
      { section: 'paper_batches', rows: buildPaperStats() },
      { section: 'paper_sacks', rows: buildPaperSacks() },
    ],
    fiberProd: [{ section: 'fiber_production', rows: buildFiberStats() }],
    fiberSack: [{ section: 'fiber_sack_storage', rows: buildFiberSacks().flatMap((row) => row.items.map((item) => ({ sack_code: row.sack_code, date_packed: row.date, entered_by: row.entered_by, fiber_batch_code: item.batchId, kg: item.kg }))) }],
    paperProd: [{ section: 'paper_production', rows: buildPaperStats() }],
    paperSack: [{ section: 'paper_sack_storage', rows: buildPaperSacks().flatMap((row) => row.items.map((item) => ({ sack_code: row.sack_code, date_packed: row.date, entered_by: row.entered_by, paper_batch_code: item.batchId, sheets: item.sheets }))) }],
  };
  (map[activeTab] || map.overview).forEach((block) => exportRows(block.rows, block.section, wb));
  XLSX.writeFile(wb, `${activeTab}-export.xlsx`);
}

export function exportAll() {
  const wb = XLSX.utils.book_new();
  exportRows(buildFiberStats(), 'fiber_batches_view', wb);
  exportRows(buildFiberSacks(), 'fiber_sacks_view', wb);
  exportRows(buildPaperStats(), 'paper_batches_view', wb);
  exportRows(buildPaperSacks(), 'paper_sacks_view', wb);
  XLSX.writeFile(wb, 'fiber-factory-all-data.xlsx');
}
