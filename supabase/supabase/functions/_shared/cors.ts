// ============================================================================
// Shared CORS headers for all Edge Functions
// ============================================================================

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * OPTIONS preflight 요청 처리.
 * truthy 반환 시 즉시 return 하면 됨.
 */
export function handleCorsOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
