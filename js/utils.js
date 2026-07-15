export const $ = (id) => document.getElementById(id);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const pad = (n) => String(n).padStart(4, '0');
export const uuid = () => crypto.randomUUID();
export const formatNumber = (value, digits = 1) => Number(value || 0).toFixed(digits);

export function setSaving(saved, text) {
  $('saveDot').style.background = saved ? '#7CD992' : '#e0c95a';
  $('saveText').textContent = text || (saved ? 'All changes saved' : 'Saving...');
}

export function showConfigBanner(message) {
  $('configBanner').style.display = 'block';
  if (message) $('configBanner').innerHTML = message;
}

export function setWarning(id, html) {
  const box = $(id);
  if (!html) {
    box.classList.remove('show');
    box.innerHTML = '';
    return;
  }
  box.classList.add('show');
  box.innerHTML = html;
}

export function normalizeRow(row) {
  const out = { ...row };
  ['kg', 'kg_used', 'sheets', 'sort_order'].forEach((key) => {
    if (out[key] !== undefined && out[key] !== null && out[key] !== '') out[key] = Number(out[key]);
  });
  return out;
}

export function latestRemainingFromLines(lines, sourceKey, qtyKey) {
  const bySource = new Map();
  for (const row of lines) {
    const sourceId = row[sourceKey];
    if (!bySource.has(sourceId)) bySource.set(sourceId, 0);
    bySource.set(sourceId, bySource.get(sourceId) + Number(row[qtyKey] || 0));
  }
  return bySource;
}
