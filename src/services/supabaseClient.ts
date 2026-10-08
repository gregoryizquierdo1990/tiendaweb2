import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

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
