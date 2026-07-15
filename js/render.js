import { activeTab, pendingFiberSack, pendingPaperSack, state } from './state.js';
import { $, formatNumber } from './utils.js';
import { buildFiberSacks, buildFiberStats, buildPaperSacks, buildPaperStats, chip, withSkipFlags, availableFiberBatches, availableFiberSacks, availablePaperBatches, pendingFiberRemaining, pendingPaperRemaining } from './domain.js';
import { deleteRecord } from './db.js';

function bindDeleteButtons(containerId, onDone) {
  const el = $(containerId);
  if (!el) return;
  el.querySelectorAll('.rm').forEach((node) => {
    node.addEventListener('click', () => deleteRecord(node.dataset.key, node.dataset.id, onDone));
  });
}

function renderOverview() {
  const fiberStats = withSkipFlags(buildFiberStats());
  const fiberSacks = withSkipFlags(buildFiberSacks());
  const paperStats = withSkipFlags(buildPaperStats());
  const paperSacks = buildPaperSacks();
  const totalFiberKg = state.fiberProduction.reduce((sum, row) => sum + Number(row.kg || 0), 0);
  const totalPaperSheets = state.paperProduction.reduce((sum, row) => sum + Number(row.sheets || 0), 0);
  const flags = [...fiberStats, ...fiberSacks, ...paperStats].filter((item) => item.flagged).length;

  $('statRow').innerHTML = `
    <div class="stat"><div class="num">${fiberStats.length}</div><div class="lbl">Fiber Batches</div></div>
    <div class="stat"><div class="num">${formatNumber(totalFiberKg)} kg</div><div class="lbl">Total Fiber Produced</div></div>
    <div class="stat"><div class="num">${fiberSacks.length}</div><div class="lbl">Fiber Sacks</div></div>
    <div class="stat"><div class="num">${paperStats.length}</div><div class="lbl">Paper Batches</div></div>
    <div class="stat"><div class="num">${totalPaperSheets}</div><div class="lbl">Total Sheets Produced</div></div>
    <div class="stat"><div class="num">${paperSacks.length}</div><div class="lbl">Paper Sacks</div></div>
  `;

  $('flagBanner').innerHTML = flags > 0
    ? `<div class="flag-banner">&#9888; ${flags} batch/sack${flags > 1 ? 'es' : ''} flagged: used out of order while an older batch still has stock.</div>`
    : `<div class="flag-banner ok">&#10003; No FIFO issues detected. All batches are being used in the correct order.</div>`;

  $('ovFiberBatches').innerHTML = fiberStats.length ? `
    <table><thead><tr><th>Batch ID</th><th>Date</th><th>Produced (kg)</th><th>Used (kg)</th><th>Remaining (kg)</th><th>Status</th></tr></thead>
    <tbody>${fiberStats.map((row) => `<tr><td class="mono">${row.batch_code}</td><td>${row.date_produced}</td><td>${formatNumber(row.kg)}</td><td>${formatNumber(row.used)}</td><td>${formatNumber(row.remaining)}</td><td>${row.flagged ? '<span class="chip skip">Skipped</span>' : chip(row.status)}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No fiber batches yet.</div>`;

  $('ovFiberSacks').innerHTML = fiberSacks.length ? `
    <table><thead><tr><th>Sack ID</th><th>Date Packed</th><th>Fiber Batches Inside</th><th>Total (kg)</th><th>Used (kg)</th><th>Remaining (kg)</th><th>Status</th></tr></thead>
    <tbody>${fiberSacks.map((row) => `<tr><td class="mono">${row.sack_code}</td><td>${row.date}</td><td class="mono">${row.items.map((item) => `${item.batchId}:${formatNumber(item.kg)}`).join(', ')}</td><td>${formatNumber(row.total)}</td><td>${formatNumber(row.used)}</td><td>${formatNumber(row.remaining)}</td><td>${row.flagged ? '<span class="chip skip">Skipped</span>' : chip(row.status)}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No fiber sacks yet.</div>`;

  $('ovPaperBatches').innerHTML = paperStats.length ? `
    <table><thead><tr><th>Batch ID</th><th>Date</th><th>Fiber Sack Used</th><th>Sheets Produced</th><th>Used (sheets)</th><th>Remaining (sheets)</th><th>Status</th></tr></thead>
    <tbody>${paperStats.map((row) => `<tr><td class="mono">${row.batch_code}</td><td>${row.date_produced}</td><td class="mono">${row.fiber_sack_code}</td><td>${row.sheets}</td><td>${row.used}</td><td>${row.remaining}</td><td>${row.flagged ? '<span class="chip skip">Skipped</span>' : chip(row.status)}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No paper batches yet.</div>`;

  $('ovPaperSacks').innerHTML = paperSacks.length ? `
    <table><thead><tr><th>Sack ID</th><th>Date Packed</th><th>Paper Batches Inside</th><th>Total Sheets</th></tr></thead>
    <tbody>${paperSacks.map((row) => `<tr><td class="mono">${row.sack_code}</td><td>${row.date}</td><td class="mono">${row.items.map((item) => `${item.batchId}:${item.sheets}`).join(', ')}</td><td>${row.total}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No paper sacks yet.</div>`;
}

function renderFiberProdTable() {
  const rows = buildFiberStats();
  $('fiberProdTable').innerHTML = rows.length ? `
    <table><thead><tr><th>Batch ID</th><th>Date</th><th>Kg Produced</th><th>Used</th><th>Remaining</th><th>Status</th><th>Entered By</th><th></th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td class="mono">${row.batch_code}</td><td>${row.date_produced}</td><td>${formatNumber(row.kg)}</td><td>${formatNumber(row.used)}</td><td>${formatNumber(row.remaining)}</td><td>${chip(row.status)}</td><td>${row.entered_by}</td><td class="rm" data-key="fiberProduction" data-id="${row.id}">Delete</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No entries yet. Add the first fiber batch above.</div>`;
  bindDeleteButtons('fiberProdTable', renderAll);
}

function renderFiberSackTable() {
  const rows = buildFiberSacks();
  $('fiberSackTable').innerHTML = rows.length ? `
    <table><thead><tr><th>Sack ID</th><th>Date Packed</th><th>Fiber Batches</th><th>Total Kg</th><th>Used</th><th>Remaining</th><th>Status</th><th>Entered By</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td class="mono">${row.sack_code}</td><td>${row.date}</td><td class="mono">${row.items.map((item) => `${item.batchId}:${formatNumber(item.kg)}`).join(', ')}</td><td>${formatNumber(row.total)}</td><td>${formatNumber(row.used)}</td><td>${formatNumber(row.remaining)}</td><td>${chip(row.status)}</td><td>${row.entered_by}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No sacks packed yet.</div>`;
}

function renderPaperProdTable() {
  const rows = buildPaperStats();
  $('paperProdTable').innerHTML = rows.length ? `
    <table><thead><tr><th>Batch ID</th><th>Date</th><th>Fiber Sack Used</th><th>Kg Used</th><th>Sheets Produced</th><th>Used</th><th>Remaining</th><th>Status</th><th>Entered By</th><th></th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td class="mono">${row.batch_code}</td><td>${row.date_produced}</td><td class="mono">${row.fiber_sack_code}</td><td>${formatNumber(row.kg_used)}</td><td>${row.sheets}</td><td>${row.used}</td><td>${row.remaining}</td><td>${chip(row.status)}</td><td>${row.entered_by}</td><td class="rm" data-key="paperProduction" data-id="${row.id}">Delete</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No paper produced yet.</div>`;
  bindDeleteButtons('paperProdTable', renderAll);
}

function renderPaperSackTable() {
  const rows = buildPaperSacks();
  $('paperSackTable').innerHTML = rows.length ? `
    <table><thead><tr><th>Sack ID</th><th>Date Packed</th><th>Paper Batches</th><th>Total Sheets</th><th>Entered By</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td class="mono">${row.sack_code}</td><td>${row.date}</td><td class="mono">${row.items.map((item) => `${item.batchId}:${item.sheets}`).join(', ')}</td><td>${row.total}</td><td>${row.entered_by}</td></tr>`).join('')}</tbody></table>
  ` : `<div class="empty">No paper sacks packed yet.</div>`;
}

function populateFiberBatchDropdown() {
  const sel = $('fs_batch');
  const merged = availableFiberBatches().map((row) => ({
    ...row,
    liveRemaining: pendingFiberRemaining(row.id, row.remaining),
  })).filter((row) => row.liveRemaining > 0.0001);
  sel.innerHTML = merged.map((row) => `<option value="${row.id}">${row.batch_code} — ${formatNumber(row.liveRemaining)} kg available (produced ${row.date_produced})</option>`).join('');
  $('fs_batch_help').textContent = merged.length ? '' : 'No fiber batches available.';
}

function populatePaperSackDropdown() {
  const sel = $('pp_sack');
  const merged = availableFiberSacks();
  sel.innerHTML = merged.map((row) => `<option value="${row.sack_code}">${row.sack_code} — ${formatNumber(row.remaining)} kg available</option>`).join('');
  $('pp_sack_help').textContent = merged.length ? '' : 'No fiber sacks available.';
}

function populatePaperBatchDropdown() {
  const sel = $('ps_batch');
  const merged = availablePaperBatches().map((row) => ({
    ...row,
    liveRemaining: pendingPaperRemaining(row.id, row.remaining),
  })).filter((row) => row.liveRemaining > 0);
  sel.innerHTML = merged.map((row) => `<option value="${row.id}">${row.batch_code} — ${formatNumber(row.liveRemaining, 0)} sheets available (produced ${row.date_produced})</option>`).join('');
  $('ps_batch_help').textContent = merged.length ? '' : 'No paper batches available.';
}

function renderPendingFiberSack() {
  const table = $('fs_pending_table');
  const empty = $('fs_pending_empty');
  const saveBtn = $('fs_savesack');
  if (pendingFiberSack.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    saveBtn.disabled = true;
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';
  saveBtn.disabled = false;
  table.querySelector('tbody').innerHTML = pendingFiberSack.map((item, index) =>
    `<tr><td class="mono">${item.batchCode}</td><td>${formatNumber(item.kg)} kg</td><td class="rm" data-i="${index}">Remove</td></tr>`
  ).join('');
  table.querySelectorAll('.rm').forEach((node) => node.addEventListener('click', () => {
    pendingFiberSack.splice(Number(node.dataset.i), 1);
    renderPendingFiberSack();
    populateFiberBatchDropdown();
  }));
}

function renderPendingPaperSack() {
  const table = $('ps_pending_table');
  const empty = $('ps_pending_empty');
  const saveBtn = $('ps_savesack');
  if (pendingPaperSack.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    saveBtn.disabled = true;
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';
  saveBtn.disabled = false;
  table.querySelector('tbody').innerHTML = pendingPaperSack.map((item, index) =>
    `<tr><td class="mono">${item.batchCode}</td><td>${item.sheets} sheets</td><td class="rm" data-i="${index}">Remove</td></tr>`
  ).join('');
  table.querySelectorAll('.rm').forEach((node) => node.addEventListener('click', () => {
    pendingPaperSack.splice(Number(node.dataset.i), 1);
    renderPendingPaperSack();
    populatePaperBatchDropdown();
  }));
}

export function renderAll() {
  renderOverview();
  renderFiberProdTable();
  renderFiberSackTable();
  renderPaperProdTable();
  renderPaperSackTable();
  populateFiberBatchDropdown();
  populatePaperSackDropdown();
  populatePaperBatchDropdown();
  renderPendingFiberSack();
  renderPendingPaperSack();
}
