export function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export function getEnvConfig() {
  return {
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY'),
    googleAiApiKey: Deno.env.get('GOOGLE_AI_API_KEY'),
    aiProvider: Deno.env.get('AI_PROVIDER') || 'google',
  };
}
