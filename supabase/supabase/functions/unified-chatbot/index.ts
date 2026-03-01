/**
 * NEURALTWIN Unified Chatbot Edge Function
 *
 * 두 채널의 AI 챗봇을 단일 엔드포인트로 통합:
 * - Website 채널: 리테일 전문가 AI (retail-chatbot 파이프라인)
 * - OS 채널: 운영 어시스턴트 AI (neuraltwin-assistant 파이프라인)
 *
 * 채널 감지: X-NeuralTwin-Channel 헤더 또는 body shape 자동 감지
 */

import { handleWebsiteRequest } from './website/handler.ts';
import { handleOSRequest } from './os/handler.ts';

// ═══════════════════════════════════════════
//  CORS 헤더 (공유)
// ═══════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://neuraltwin.com',
  'https://www.neuraltwin.com',
  'https://neuraltwin.website',
  'https://www.neuraltwin.website',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app');
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-session-id, x-neuraltwin-channel',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ═══════════════════════════════════════════
//  채널 감지
// ═══════════════════════════════════════════

type Channel = 'website' | 'os';

function detectChannel(req: Request, body: Record<string, unknown>): Channel {
  // 1. 명시적 헤더 (우선순위 최고)
  const channelHeader = req.headers.get('X-NeuralTwin-Channel')?.toLowerCase();
  if (channelHeader === 'os') return 'os';
  if (channelHeader === 'website') return 'website';

  // 2. Body shape 감지 — OS는 항상 context.page + context.store 포함
  if (body.context && typeof body.context === 'object') {
    const ctx = body.context as Record<string, unknown>;
    if (ctx.page && ctx.store) return 'os';
  }

  // 3. sessionId 존재 → Website (게스트 채팅)
  if (body.sessionId) return 'website';

  // 4. 기본값: website (게스트 친화적)
  return 'website';
}

// ═══════════════════════════════════════════
//  메인 라우터
// ═══════════════════════════════════════════

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // POST만 허용
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Body를 읽어서 채널 감지 후, 각 핸들러에 위임
    // 핸들러가 body를 다시 읽을 수 있도록 Request를 복제
    const bodyText = await req.text();
    let body: Record<string, unknown>;

    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channel = detectChannel(req, body);
    console.log(`[unified-chatbot] Channel detected: ${channel}`);

    // 핸들러에 전달할 새 Request 생성 (body 복원)
    const handlerRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });

    if (channel === 'os') {
      return await handleOSRequest(handlerRequest);
    } else {
      return await handleWebsiteRequest(handlerRequest);
    }

  } catch (error) {
    console.error('[unified-chatbot] Router error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
