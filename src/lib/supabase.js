import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 
  import.meta.env?.VITE_SUPABASE_URL;

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 
  import.meta.env?.VITE_SUPABASE_ANON_KEY;

export let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables! Offline/fallback mode active.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Realtime subscription helper
export const subscribeToChannel = (channelName, callback) => {
  if (!supabase) return null;
  const channel = supabase.channel(channelName);
  
  channel
    .on('broadcast', { event: 'message' }, (payload) => {
      callback(payload);
    })
    .subscribe((status) => {
      console.log(`Channel ${channelName} status:`, status);
    });

  return channel;
};

// Subscribe to specific table changes
export const subscribeToTable = (table, filter, callback) => {
  if (!supabase) return null;
  const channel = supabase.channel(`${table}-changes`);
  
  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};

export default supabase;
