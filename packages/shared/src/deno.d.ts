// Ambient type declarations for Deno runtime (used in Supabase Edge Functions)
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;
}
