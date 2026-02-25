import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

export function createSupabaseClient(useServiceRole = true) {
  const url = requireEnv('SUPABASE_URL');
  const key = useServiceRole
    ? requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    : requireEnv('SUPABASE_ANON_KEY');

  return createClient(url, key);
}

export function createSupabaseAdmin() {
  return createSupabaseClient(true);
}

export function createSupabaseAnon() {
  return createSupabaseClient(false);
}

/**
 * 사용자 JWT를 전달하여 RLS가 적용되는 클라이언트 생성.
 * Authorization 헤더를 그대로 넘겨야 할 때 사용.
 */
export function createSupabaseWithAuth(authHeader: string) {
  const url = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}
