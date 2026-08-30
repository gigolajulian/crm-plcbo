import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/* ============================================================================
   SUPABASE CLIENT

   CRMO runs in one of two modes:

   - **Local** (no credentials configured). Everything lives in localStorage.
     This is what the public demo runs on, and it works offline.
   - **Remote** (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set). Real auth,
     a Postgres database per workspace, and file storage.

   The anon key is *designed* to be public — it ships in the bundle. Data is
   protected by the row-level security policies in supabase/migrations, never by
   hiding this key. Never put the service-role key here: it bypasses RLS.
   ========================================================================== */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the app is wired to a backend. */
export const isRemote = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isRemote
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Narrowing helper so call sites do not each repeat the null check. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}

export const STORAGE_BUCKET = 'crmo-assets'
