import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { checkRateLimit, cleanupExpiredEntries } from '../_shared/rateLimiter.ts';
import { saveMessage } from '../_shared/chatLogger.ts';
import { logSessionStart } from '../_shared/chatEventLogger.ts';
import { getOrCreateSession } from './utils/session.ts';
import { createErrorResponse } from './utils/errorTypes.ts';
import { classifyIntent } from './intent/classifier.ts';
import { dispatchNavigationAction, UIAction } from './actions/navigationActions.ts';
import { handleGeneralChat } from './actions/chatActions.ts';
import { handleQueryKpi } from './actions/queryActions.ts';
import { handleRunSimulation, handleRunOptimization, dispatchStudioAction } from './actions/executionActions.ts';

// 스튜디오 제어 인텐트 목록
const STUDIO_CONTROL_INTENTS = [
  'toggle_overlay', 'simulation_control', 'apply_preset',
  'set_simulation_params', 'set_optimization_config', 'set_view_mode',
  'toggle_panel', 'save_scene', 'set_environment',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 요청 인터페이스
interface OSAssistantRequest {
  message: string;
  conversationId?: string;
  context: {
    page: {
      current: string;
      tab?: string;
    };
    dateRange?: {
      preset: string;
      startDate: string;
      endDate: string;
    };
    store: {
      id: string;
      name: string;
    };
  };
}

// 응답 인터페이스
interface OSAssistantResponse {
  message: string;
  actions?: UIAction[];
  suggestions?: string[];
  meta: {
    conversationId: string;
    intent: string;
    confidence: number;
    executionTimeMs: number;
  };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('AUTH_EXPIRED', corsHeaders);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return createErrorResponse('AUTH_EXPIRED', corsHeaders);
    }

    // 3. Rate Limiting
    const rateLimitResult = checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return createErrorResponse('RATE_LIMITED', corsHeaders);
    }

    // 4. 요청 파싱
    const body: OSAssistantRequest = await req.json();
    const { message, conversationId, context } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: '메시지를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4-1. 사용자-매장 소속 검증 + org_id 확보
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership?.org_id) {
      return new Response(
        JSON.stringify({ error: '조직 정보를 확인할 수 없습니다. 관리자에게 문의해주세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = membership.org_id;

    // 매장이 해당 조직 소속인지 검증
    if (context.store?.id) {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('org_id')
        .eq('id', context.store.id)
        .single();

      if (storeError || !storeData || storeData.org_id !== orgId) {
        return new Response(
          JSON.stringify({ error: '해당 매장에 접근 권한이 없습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. 대화 세션 관리
    const session = await getOrCreateSession(supabase, {
      conversationId,
      userId: user.id,
      storeId: context.store.id,
      initialContext: context,
    });

    if (!session) {
      return createErrorResponse('SESSION_ERROR', corsHeaders);
    }

    // 5-1. 새 세션이면 session_start 이벤트 기록
    if (session.isNew) {
      await logSessionStart(supabase, session.conversationId, {
        page: context.page,
        store_id: context.store.id,
      });
    }

    // 6. 사용자 메시지 저장
    await saveMessage(supabase, {
      conversation_id: session.conversationId,
      role: 'user',
      content: message,
      channel_data: {
        page: context.page,
        dateRange: context.dateRange,
      },
    });

    // 7. 인텐트 분류 (상품 카탈로그는 캐시 미스 시에만 lazy 로드)
    const loadProductCatalog = async () => {
      try {
        const { data: productData } = await supabase
          .from('products')
          .select('name, category')
          .eq('org_id', orgId);

        if (productData && productData.length > 0) {
          const categories = [...new Set(productData.map((p: any) => p.category).filter(Boolean))] as string[];
          const products = productData.map((p: any) => ({
            name: p.name as string,
            category: (p.category || '기타') as string,
          }));
          return { categories, products };
        }
        return undefined;
      } catch (e) {
        console.warn('[neuraltwin-assistant] Failed to load product catalog:', e);
        return undefined;
      }
    };

    const classification = await classifyIntent(message, context, loadProductCatalog);

    // 7-1. 카테고리/상품 중의성 → 사용자에게 되물어보기
    const queryType = classification.entities?.queryType;
    const isAmbiguousCategoryProduct = classification.intent === 'query_kpi'
      && ['categoryAnalysis', 'product'].includes(queryType)
      && classification.confidence <= 0.6
      && classification.entities?.itemFilter?.length > 0;

    if (isAmbiguousCategoryProduct) {
      const filterName = classification.entities.itemFilter[0];
      const disambiguationMessage = `"${filterName}"은(는) 카테고리 이름이기도 하고, 상품명에도 포함되어 있어요.\n\n어떤 걸 확인하시겠어요?\n• **"${filterName} 카테고리 매출"** — ${filterName} 카테고리 전체\n• **구체적인 상품명** — 예: "가죽 토트백 매출"`;
      const disambiguationSuggestions = [`${filterName} 카테고리 매출`, `${filterName} 카테고리 판매량`, 'TOP 상품 보여줘'];

      // 되묻기 응답 저장 및 반환
      await saveMessage(supabase, {
        conversation_id: session.conversationId,
        role: 'assistant',
        content: disambiguationMessage,
        channel_data: {
          intent: classification.intent,
          confidence: classification.confidence,
          actions: [],
          suggestions: disambiguationSuggestions,
          disambiguation: true,
        },
      });

      const executionTimeMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          message: disambiguationMessage,
          actions: [],
          suggestions: disambiguationSuggestions,
          meta: {
            conversationId: session.conversationId,
            intent: classification.intent,
            confidence: classification.confidence,
            executionTimeMs,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. 액션 실행 (Phase 3-A: general_chat, Phase 3-B: query_kpi)
    let actionResult = { actions: [] as UIAction[], message: '', suggestions: [] as string[] };
    const currentPage = context.page.current;

    if (['navigate', 'set_tab', 'set_date_range', 'composite_navigate', 'scroll_to_section', 'open_modal'].includes(classification.intent)) {
      // 네비게이션 관련 인텐트 (Phase 3-B+: scroll_to_section, open_modal 추가)
      actionResult = dispatchNavigationAction(classification, currentPage);
    } else if (classification.intent === 'query_kpi') {
      // KPI 데이터 조회
      const pageContext = {
        current: context.page.current,
        tab: context.page.tab,
      };
      const queryResult = await handleQueryKpi(supabase, classification, context.store.id, pageContext, orgId);
      actionResult = {
        actions: queryResult.actions,
        message: queryResult.message,
        suggestions: queryResult.suggestions,
      };
    } else if (classification.intent === 'run_simulation') {
      // 시뮬레이션 실행 - 스튜디오 이동 + (프리셋 적용) + 실행 이벤트 발행
      actionResult = handleRunSimulation(classification, context);
    } else if (classification.intent === 'run_optimization') {
      // 최적화 실행 - 스튜디오 이동 + 실행 이벤트 발행
      actionResult = handleRunOptimization(classification, context);
    } else if (STUDIO_CONTROL_INTENTS.includes(classification.intent)) {
      // 스튜디오 제어 (오버레이, 시뮬레이션 컨트롤, 프리셋, 뷰모드, 패널, 씬저장, 환경설정)
      actionResult = dispatchStudioAction(classification, context);
    } else if (classification.intent === 'general_chat') {
      // 일반 대화 (AI 응답)
      const chatResult = await handleGeneralChat(message, [], context);
      actionResult = {
        actions: [],
        message: chatResult.message,
        suggestions: chatResult.suggestions,
      };
    }

    // 9. 응답 생성
    const assistantMessage = actionResult.message ||
      `메시지를 받았습니다. 아직 "${classification.intent}" 기능은 준비 중이에요.`;
    const suggestions = actionResult.suggestions.length > 0
      ? actionResult.suggestions
      : ['인사이트 허브로 이동', '오늘 매출 조회', '시뮬레이션 실행'];
    const actions = actionResult.actions;

    // 10. 어시스턴트 메시지 저장
    await saveMessage(supabase, {
      conversation_id: session.conversationId,
      role: 'assistant',
      content: assistantMessage,
      channel_data: {
        intent: classification.intent,
        confidence: classification.confidence,
        actions,
        suggestions,
      },
    });

    // 11. 응답 반환
    const executionTimeMs = Date.now() - startTime;

    const response: OSAssistantResponse = {
      message: assistantMessage,
      actions,
      suggestions,
      meta: {
        conversationId: session.conversationId,
        intent: classification.intent,
        confidence: classification.confidence,
        executionTimeMs,
      },
    };

    // 주기적 정리 (10% 확률로 실행)
    if (Math.random() < 0.1) {
      cleanupExpiredEntries();
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[neuraltwin-assistant] Error:', error);
    return createErrorResponse('INTERNAL_ERROR', corsHeaders);
  }
});
