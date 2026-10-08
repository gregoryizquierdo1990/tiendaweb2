import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials dynamically from localStorage or fall back to environment variables
const getSupabaseCredentials = () => {
  let url = '';
  let key = '';

  try {
    url = localStorage.getItem('CUSTOM_SUPABASE_URL') || '';
    key = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '';
  } catch (e) {
    console.warn('Could not read custom Supabase credentials from localStorage:', e);
  }

  if (!url) {
    url = import.meta.env.VITE_SUPABASE_URL || 'https://qsuizzbwgogtmenjofhy.supabase.co';
  }
  if (!key) {
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdWl6emJ3Z29ndG1lbmpvZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODk3MDcsImV4cCI6MjEwNjk2NTcwN30.J863Aks8lTpKfFpa71dZMZvizgGj5V31J2SptdYuRoU';
  }

  // Trim rest suffixes
  if (url.endsWith('/rest/v1/')) {
    url = url.slice(0, -9);
  } else if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8);
  }

  return { url, key };
};

const credentials = getSupabaseCredentials();

export const supabaseUrl = credentials.url;
export const supabaseAnonKey = credentials.key;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Constructor de consultas encadenables para entornos de producción donde
 * Supabase no está configurado en las variables de entorno de Vercel.
 * Evita que la aplicación lance excepciones no capturadas al importar módulos.
 */
function createFallbackBuilder() {
  const handler: any = {
    select: () => handler,
    insert: () => handler,
    update: () => handler,
    delete: () => handler,
    upsert: () => handler,
    eq: () => handler,
    neq: () => handler,
    gt: () => handler,
    lt: () => handler,
    order: () => handler,
    limit: () => handler,
    range: () => handler,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (val: any) => any, reject?: (err: any) => any) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject)
  };
  return handler;
}

const fallbackClient: any = {
  from: () => createFallbackBuilder(),
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase no configurado') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {}
  })
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (fallbackClient as SupabaseClient);
