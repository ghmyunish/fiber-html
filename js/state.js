export const TABLES = {
  fiberProduction: 'fiber_production',
  fiberSackStorage: 'fiber_sack_storage',
  paperProduction: 'paper_production',
  paperSackStorage: 'paper_sack_storage',
};

export const STATE_KEYS = Object.keys(TABLES);

export const state = {
  fiberProduction: [],
  fiberSackStorage: [],
  paperProduction: [],
  paperSackStorage: [],
};

export const pendingFiberSack = [];
export const pendingPaperSack = [];

export let activeTab = 'overview';
export let schemaReady = false;
export let supabaseClient = null;

export function setActiveTab(value) {
  activeTab = value;
}

export function setSchemaReady(value) {
  schemaReady = value;
}

export function setSupabaseClient(value) {
  supabaseClient = value;
}
