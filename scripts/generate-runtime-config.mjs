import fs from 'node:fs/promises';
import path from 'node:path';

const outPath = path.resolve('js/runtime-config.js');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

const content = `window.FIBER_SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nwindow.FIBER_SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\n`;
await fs.writeFile(outPath, content, 'utf8');
