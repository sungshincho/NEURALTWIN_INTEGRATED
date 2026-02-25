/**
 * Lovable Gateway 임베딩 지원 여부 테스트
 * OpenAI + Gemini 임베딩 모델 모두 테스트
 * 한 번 호출 후 삭제할 임시 Edge Function
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async () => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';

  // OpenAI + Gemini 임베딩 모델 모두 테스트
  const models = [
    // OpenAI 모델
    'text-embedding-3-small',
    'text-embedding-3-large',
    // Gemini 임베딩 모델 (다양한 이름 형식 시도)
    'text-embedding-004',
    'gemini-embedding-exp-03-07',
    'gemini/text-embedding-004',
    'models/text-embedding-004',
  ];

  const results: Record<string, unknown> = {};
  const testInput = '리테일 매장 레이아웃 전환율 최적화 전략';

  for (const model of models) {
    try {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: testInput,
        }),
      });

      const body = await res.text();

      if (res.ok) {
        const parsed = JSON.parse(body);
        const embedding = parsed.data?.[0]?.embedding;
        results[model] = {
          status: res.status,
          ok: true,
          dimensions: embedding?.length || 'unknown',
          embeddingPreview: embedding?.slice(0, 5) || null,
          usage: parsed.usage || null,
        };
      } else {
        results[model] = {
          status: res.status,
          ok: false,
          error: body.slice(0, 500),
        };
      }
    } catch (err) {
      results[model] = {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Lovable 채팅 Gateway URL로도 시도 (다른 엔드포인트일 수 있음)
  const CHAT_GATEWAY_BASE = 'https://lovable-api.anthropic.com/v1/embeddings';
  for (const model of ['text-embedding-004', 'text-embedding-3-small']) {
    const key = `[alt-gateway] ${model}`;
    try {
      const res = await fetch(CHAT_GATEWAY_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input: testInput }),
      });

      const body = await res.text();
      if (res.ok) {
        const parsed = JSON.parse(body);
        const embedding = parsed.data?.[0]?.embedding;
        results[key] = {
          status: res.status,
          ok: true,
          dimensions: embedding?.length || 'unknown',
        };
      } else {
        results[key] = { status: res.status, ok: false, error: body.slice(0, 300) };
      }
    } catch (err) {
      results[key] = { status: 'error', message: err instanceof Error ? err.message : String(err) };
    }
  }

  return new Response(JSON.stringify({
    testInput,
    timestamp: new Date().toISOString(),
    results,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
