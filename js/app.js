import { loadAll } from './db.js';
import { renderAll } from './render.js';
import { bindFiberProductionForm, bindFiberSackForm, bindPaperProductionForm, bindPaperSackForm, bindRefresh, bindTabs } from './forms.js';
import { exportAll, exportCurrentTab } from './export.js';
import { $, setSaving, todayStr } from './utils.js';
import { setEnv } from './env.js';

setEnv(window.FIBER_SUPABASE_URL, window.FIBER_SUPABASE_ANON_KEY);

function initDates() {
  ['fp_date', 'fs_date', 'pp_date', 'ps_date'].forEach((id) => {
    $(id).value = todayStr();
  });
}

function bindExports() {
  $('exportTabBtn').addEventListener('click', exportCurrentTab);
  $('exportAllBtn').addEventListener('click', exportAll);
}

async function init() {
  initDates();
  setSaving(true, 'Starting up...');
  bindTabs();
  bindRefresh(loadAll);
  bindExports();
  bindFiberProductionForm();
  bindFiberSackForm();
  bindPaperProductionForm();
  bindPaperSackForm();
  await loadAll();
  renderAll();
  $('saveText').textContent = 'All changes saved';
}

init().catch((error) => {
  console.error(error);
  setSaving(true, 'Startup failed');
});
