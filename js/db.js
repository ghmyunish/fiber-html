import { STATE_KEYS, TABLES, state, schemaReady, setSchemaReady, setSupabaseClient } from './state.js';
import { backendConfigured } from './env.js';
import { $, normalizeRow, setSaving, showConfigBanner } from './utils.js';

export function loadSupabaseClient() {
  if (!backendConfigured()) return null;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(window.FIBER_SUPABASE_URL, window.FIBER_SUPABASE_ANON_KEY);
}

async function bootstrapSchema() {
  const { data, error } = await window.__fiberSupabase.rpc('bootstrap_fiber_factory_schema');
  if (error) throw error;
  return Boolean(data?.ok ?? true);
}

async function tableExists(tableName) {
  const { error } = await window.__fiberSupabase.from(tableName).select('id').limit(1);
  return !error;
}

export async function ensureSchema() {
  try {
    await bootstrapSchema();
    const exists = await tableExists(TABLES.fiberProduction);
    if (!exists) throw new Error('schema bootstrap did not create the expected tables');
    setSchemaReady(true);
  } catch (error) {
    setSchemaReady(false);
    showConfigBanner(`<strong>Setup needed:</strong> ${error.message}. Run the bootstrap SQL in Supabase, then refresh.`);
    throw error;
  }
}

export async function loadAll() {
  if (!backendConfigured()) {
    showConfigBanner();
    setSaving(true, 'Supabase not configured');
    return;
  }
  if (!window.__fiberSupabase) {
    window.__fiberSupabase = loadSupabaseClient();
  }
  setSupabaseClient(window.__fiberSupabase);
  if (!window.__fiberSupabase) {
    showConfigBanner('<strong>Setup needed:</strong> Supabase client was not loaded. Check the CDN scripts.');
    setSaving(true, 'Supabase unavailable');
    return;
  }

  try {
    await ensureSchema();
    const queries = await Promise.all(STATE_KEYS.map((key) =>
      window.__fiberSupabase.from(TABLES[key]).select('*').order('created_at', { ascending: true })
    ));
    queries.forEach((result, idx) => {
      const key = STATE_KEYS[idx];
      if (result.error) throw result.error;
      state[key] = (result.data || []).map(normalizeRow);
    });
    setSaving(true);
    $('configBanner').style.display = 'none';
  } catch (error) {
    console.error(error);
    setSaving(true, 'Could not load data');
  }
}

export async function persist(key, rows) {
  if (!window.__fiberSupabase) throw new Error('Supabase is not initialized');
  if (!schemaReady) throw new Error('Schema is not ready');
  setSaving(false);
  const { error } = await window.__fiberSupabase.from(TABLES[key]).insert(rows);
  if (error) {
    setSaving(true, 'Save failed');
    throw error;
  }
  state[key].push(...rows);
  setSaving(true);
}

export async function deleteRecord(key, id, onSuccess) {
  if (!confirm('Delete this entry? This cannot be undone.')) return;
  setSaving(false);
  const { error } = await window.__fiberSupabase.from(TABLES[key]).delete().eq('id', id);
  if (error) {
    setSaving(true, 'Delete failed');
    alert('Could not delete. Check your connection and try again.');
    return;
  }
  state[key] = state[key].filter((row) => row.id !== id);
  setSaving(true);
  if (onSuccess) onSuccess();
}
