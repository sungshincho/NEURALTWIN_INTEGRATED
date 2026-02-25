// ============================================================================
// Shared error response builder for Edge Functions
// ============================================================================

import { corsHeaders } from "./cors.ts";

/**
 * 표준 JSON 에러 Response 반환.
 */
export function errorResponse(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
