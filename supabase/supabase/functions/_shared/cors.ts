// ============================================================================
// Shared CORS headers for all Edge Functions
// ============================================================================

// ---------------------------------------------------------------------------
// 1. Simple wildcard CORS (대부분의 EF에서 사용)
// ---------------------------------------------------------------------------

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * OPTIONS preflight 요청 처리 (wildcard).
 * truthy 반환 시 즉시 return 하면 됨.
 */
export function handleCorsOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. Origin-aware strict CORS (unified-chatbot 등 인증/세션 EF용)
// ---------------------------------------------------------------------------

export const ALLOWED_ORIGINS = [
  'https://neuraltwin.com',
  'https://www.neuraltwin.com',
  'https://neuraltwin.website',
  'https://www.neuraltwin.website',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

/**
 * 요청 Origin에 따라 동적 CORS 헤더 생성.
 * - ALLOWED_ORIGINS 또는 *.vercel.app 허용
 * - 그 외는 기본 Origin (neuraltwin.com) 반환
 * - Credentials 포함
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app');
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, apikey, x-client-info, x-session-id, x-neuraltwin-channel',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Origin string 기반 동적 CORS 헤더 생성 (Request 객체 없이 사용).
 * SSE 스트리밍 등에서 Origin 문자열만 가지고 있을 때 사용.
 */
export function getCorsHeadersByOrigin(origin?: string): Record<string, string> {
  const isAllowed = origin
    ? ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')
    : false;
  const allowedOrigin = isAllowed ? origin! : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, apikey, x-client-info, x-session-id, x-neuraltwin-channel',
    'Access-Control-Allow-Credentials': 'true',
  };
}
