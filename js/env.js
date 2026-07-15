export function setEnv(url, anonKey) {
  window.__FIBER_SUPABASE_URL__ = url;
  window.__FIBER_SUPABASE_ANON_KEY__ = anonKey;
}

export function backendConfigured() {
  const url = window.__FIBER_SUPABASE_URL__;
  const key = window.__FIBER_SUPABASE_ANON_KEY__;
  return url && key && !url.startsWith('PASTE_') && !key.startsWith('PASTE_');
}
