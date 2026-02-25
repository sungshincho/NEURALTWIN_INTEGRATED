import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(useServiceRole = true) {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('Missing SUPABASE_URL');

  const key = useServiceRole
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    : Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new Error(`Missing ${useServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY'}`);

  return createClient(url, key);
}

export function createSupabaseAdmin() {
  return createSupabaseClient(true);
}

export function createSupabaseAnon() {
  return createSupabaseClient(false);
}
