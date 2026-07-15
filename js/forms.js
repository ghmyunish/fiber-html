import { availableFiberBatches, availableFiberSacks, availablePaperBatches, pendingFiberRemaining, pendingPaperRemaining } from './domain.js';
import { persist } from './db.js';
import { renderAll } from './render.js';
import { activeTab, pendingFiberSack, pendingPaperSack, state, setActiveTab } from './state.js';
import { $, formatNumber, pad, setWarning, todayStr, uuid } from './utils.js';

function sumPendingFiberForBatch(batchId) {
  return pendingFiberSack.filter((item) => item.fiberProductionId === batchId).reduce((sum, item) => sum + item.kg, 0);
}

function sumPendingPaperForBatch(batchId) {
  return pendingPaperSack.filter((item) => item.paperProductionId === batchId).reduce((sum, item) => sum + item.sheets, 0);
}

export function bindTabs() {
  $('tabNav').addEventListener('click', (event) => {
    if (event.target.tagName !== 'BUTTON') return;
    setActiveTab(event.target.dataset.tab);
    document.querySelectorAll('#tabNav button').forEach((button) => button.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('main > section').forEach((section) => section.style.display = 'none');
    $('tab-' + activeTab).style.display = 'block';
  });
}

export function bindRefresh(refreshFn) {
  $('refreshBtn').addEventListener('click', async () => {
    await refreshFn();
    renderAll();
  });
}

export function bindFiberProductionForm() {
  $('formFiberProd').addEventListener('submit', async (event) => {
    event.preventDefault();
    const date_produced = $('fp_date').value;
    const kg = parseFloat($('fp_kg').value);
    const entered_by = $('fp_by').value.trim();
    if (!date_produced || !kg || !entered_by) return;
    const batch_code = 'FB-' + pad(state.fiberProduction.length + 1);
    const row = { id: uuid(), date_produced, kg, batch_code, entered_by, created_at: new Date().toISOString() };
    try {
      await persist('fiberProduction', [row]);
      event.target.reset();
      $('fp_date').value = todayStr();
      renderAll();
    } catch (error) {
      alert('Could not save the batch. Check your connection and try again.');
    }
  });
}

export function bindFiberSackForm() {
  $('fs_addline').addEventListener('click', () => {
    const batchId = $('fs_batch').value;
    const kg = parseFloat($('fs_kg').value);
    setWarning('fs_warning');
    if (!batchId || !kg || kg <= 0) return;
    const selected = availableFiberBatches().find((row) => row.id === batchId);
    if (!selected) return;
    const liveRemaining = pendingFiberRemaining(batchId, selected.remaining);
    if (kg > liveRemaining + 0.0001) {
      setWarning('fs_warning', `<strong>Quantity too high</strong>Only ${formatNumber(liveRemaining)} kg is available from ${selected.batch_code}.`);
      return;
    }
    const earlier = availableFiberBatches().filter((row) => row.seq < selected.seq && pendingFiberRemaining(row.id, row.remaining) > 0.0001);
    if (earlier.length) {
      setWarning('fs_warning', `<strong>Warning</strong>${earlier.map((row) => `${row.batch_code} still has ${formatNumber(pendingFiberRemaining(row.id, row.remaining))} kg unused and was produced before ${selected.batch_code}.`).join(' ')}`);
    }
    pendingFiberSack.push({ fiberProductionId: selected.id, batchCode: selected.batch_code, kg });
    $('fs_kg').value = '';
    renderAll();
  });

  $('fs_savesack').addEventListener('click', async () => {
    const date_packed = $('fs_date').value;
    const sack_code = $('fs_sackid').value.trim();
    const entered_by = $('fs_by').value.trim();
    if (!date_packed || !sack_code || !entered_by || pendingFiberSack.length === 0) {
      alert('Please fill in Date, Sack ID, Entered By, and add at least one fiber batch.');
      return;
    }
    const rows = pendingFiberSack.map((item) => ({
      id: uuid(),
      sack_code,
      date_packed,
      entered_by,
      fiber_production_id: item.fiberProductionId,
      fiber_production_batch_code: item.batchCode,
      kg: item.kg,
      created_at: new Date().toISOString(),
    }));
    try {
      await persist('fiberSackStorage', rows);
      pendingFiberSack.length = 0;
      $('formFiberSackHeader').reset();
      $('fs_date').value = todayStr();
      setWarning('fs_warning');
      renderAll();
    } catch (error) {
      alert('Could not save the sack. Check your connection and try again.');
    }
  });
}

export function bindPaperProductionForm() {
  $('pp_sack').addEventListener('change', () => {
    const sackCode = $('pp_sack').value;
    setWarning('pp_warning');
    if (!sackCode) return;
    const selected = availableFiberSacks().find((row) => row.sack_code === sackCode);
    if (!selected) return;
    const earlier = availableFiberSacks().filter((row) => row.seq < selected.seq && row.remaining > 0.0001);
    if (earlier.length) {
      setWarning('pp_warning', `<strong>Warning</strong>${earlier.map((row) => `${row.sack_code} still has ${formatNumber(row.remaining)} kg unused and was packed before ${sackCode}.`).join(' ')}`);
    }
  });

  $('formPaperProd').addEventListener('submit', async (event) => {
    event.preventDefault();
    const date_produced = $('pp_date').value;
    const sack_code = $('pp_sack').value;
    const kg_used = parseFloat($('pp_kg').value);
    const sheets = parseInt($('pp_sheets').value, 10);
    const entered_by = $('pp_by').value.trim();
    if (!date_produced || !sack_code || !kg_used || !sheets || !entered_by) return;
    const selected = availableFiberSacks().find((row) => row.sack_code === sack_code);
    if (!selected || kg_used > selected.remaining + 0.0001) {
      alert(`Only ${selected ? formatNumber(selected.remaining) : 0} kg is available in sack ${sack_code}.`);
      return;
    }
    const batch_code = 'PB-' + pad(state.paperProduction.length + 1);
    const row = {
      id: uuid(),
      date_produced,
      sack_code,
      fiber_sack_code: sack_code,
      kg_used,
      sheets,
      batch_code,
      entered_by,
      created_at: new Date().toISOString(),
    };
    try {
      await persist('paperProduction', [row]);
      event.target.reset();
      $('pp_date').value = todayStr();
      setWarning('pp_warning');
      renderAll();
    } catch (error) {
      alert('Could not save the batch. Check your connection and try again.');
    }
  });
}

export function bindPaperSackForm() {
  $('ps_addline').addEventListener('click', () => {
    const batchId = $('ps_batch').value;
    const sheets = parseInt($('ps_sheets').value, 10);
    setWarning('ps_warning');
    if (!batchId || !sheets || sheets <= 0) return;
    const selected = availablePaperBatches().find((row) => row.id === batchId);
    if (!selected) return;
    const liveRemaining = pendingPaperRemaining(batchId, selected.remaining);
    if (sheets > liveRemaining) {
      setWarning('ps_warning', `<strong>Quantity too high</strong>Only ${liveRemaining} sheets are available from ${selected.batch_code}.`);
      return;
    }
    const earlier = availablePaperBatches().filter((row) => row.seq < selected.seq && pendingPaperRemaining(row.id, row.remaining) > 0);
    if (earlier.length) {
      setWarning('ps_warning', `<strong>Warning</strong>${earlier.map((row) => `${row.batch_code} still has ${row.remaining - sumPendingPaperForBatch(row.id)} sheets unused and was produced before ${selected.batch_code}.`).join(' ')}`);
    }
    pendingPaperSack.push({ paperProductionId: selected.id, batchCode: selected.batch_code, sheets });
    $('ps_sheets').value = '';
    renderAll();
  });

  $('ps_savesack').addEventListener('click', async () => {
    const date_packed = $('ps_date').value;
    const sack_code = $('ps_sackid').value.trim();
    const entered_by = $('ps_by').value.trim();
    if (!date_packed || !sack_code || !entered_by || pendingPaperSack.length === 0) {
      alert('Please fill in Date, Sack ID, Entered By, and add at least one paper batch.');
      return;
    }
    const rows = pendingPaperSack.map((item) => ({
      id: uuid(),
      sack_code,
      date_packed,
      entered_by,
      paper_production_id: item.paperProductionId,
      paper_production_batch_code: item.batchCode,
      sheets: item.sheets,
      created_at: new Date().toISOString(),
    }));
    try {
      await persist('paperSackStorage', rows);
      pendingPaperSack.length = 0;
      $('formPaperSackHeader').reset();
      $('ps_date').value = todayStr();
      setWarning('ps_warning');
      renderAll();
    } catch (error) {
      alert('Could not save the sack. Check your connection and try again.');
    }
  });
}
