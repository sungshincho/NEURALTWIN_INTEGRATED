// ============================================================================
// Shared environment variable helpers for Edge Functions
// ============================================================================

/**
 * 환경변수를 가져오되, 없으면 Error throw.
 * `Deno.env.get('X')!` 대신 사용.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * 자주 쓰는 Supabase 환경변수 묶음.
 */
export function getEnvConfig() {
  return {
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
    supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
