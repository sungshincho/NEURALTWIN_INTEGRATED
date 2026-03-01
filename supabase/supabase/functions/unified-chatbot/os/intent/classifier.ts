/**
 * AI-First 인텐트 분류기
 *
 * 분류 흐름:
 * 1. 캐시 확인 → 히트 시 바로 반환
 * 2. AI 분류 (Gemini) → 의미론적 인텐트 파악
 * 3. 엔티티 보강 → 패턴 기반 날짜/페이지 추출로 정교화
 * 4. 결과 캐싱
 */

import { callGemini, parseJsonResponse } from '../utils/geminiClient.ts';
import { INTENT_CLASSIFICATION_PROMPT, formatContext, formatProductCatalog } from '../constants/systemPrompt.ts';
import { getCachedIntent, setCachedIntent, cleanupExpiredCache } from '../utils/intentCache.ts';
import { extractDateRange, extractHour } from './entityExtractor.ts';
import { normalizeForMatch } from '../utils/normalize.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'ai' | 'cache' | 'fallback';
  reasoning?: string;
}

// AI 분류 결과 인터페이스
interface AIClassificationResponse {
  intent: string;
  confidence: number;
  reasoning?: string;
  entities?: {
    page?: string;
    tab?: string;
    sectionId?: string;
    modalId?: string;
    queryType?: string;
    period?: {
      type: string;
      startDate?: string;
      endDate?: string;
    };
    filter?: {
      status?: string;
      source?: string;
    };
    tablePage?: string | number;
    // 스튜디오 제어 엔티티
    scenario?: string;
    simulationType?: string;
    optimizationType?: string;
    overlay?: string;
    visible?: boolean;
    simCommand?: string;
    simSpeed?: number;
    simType?: string;
    customerCount?: number;
    duration?: number;
    optGoal?: string;
    optTypes?: string[];
    optIntensity?: string;
    viewMode?: string;
    panel?: string;
    sceneName?: string;
    weather?: string;
    timeOfDay?: string;
    holidayType?: string;
    preset?: string;
    // 세부 필터 엔티티
    itemFilter?: string[];   // 특정 항목 필터 (존 이름, 상품명 등)
    hour?: number;           // 특정 시간 (0-23)
    responseHint?: string;   // 응답 형식 힌트 (예: 'distribution')
  };
}

// 유효한 인텐트 목록
const VALID_INTENTS = [
  'query_kpi',
  'navigate',
  'set_tab',
  'scroll_to_section',
  'open_modal',
  'set_date_range',
  'composite_navigate',
  'run_simulation',
  'run_optimization',
  // 디지털트윈 스튜디오 제어 인텐트
  'toggle_overlay',
  'simulation_control',
  'apply_preset',
  'set_simulation_params',
  'set_optimization_config',
  'set_view_mode',
  'toggle_panel',
  'save_scene',
  'set_environment',
  'general_chat',
];

/**
 * AI-First 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  context?: {
    page?: { current?: string; tab?: string };
    dateRange?: { preset?: string; startDate?: string; endDate?: string };
  },
  loadProductCatalog?: () => Promise<{
    categories: string[];
    products: Array<{ name: string; category: string }>;
  } | undefined>
): Promise<ClassificationResult> {
  // 주기적 캐시 정리 (5% 확률)
  if (Math.random() < 0.05) {
    cleanupExpiredCache();
  }

  // 컨텍스트 탭 추출 (캐시 키에 포함하여 동일 메시지도 탭별 분류 구분)
  const currentTab = context?.page?.tab;

  // 1. 캐시 확인 (탭 컨텍스트 포함)
  const cached = getCachedIntent(message, currentTab);
  if (cached) {
    console.log('[classifier] Cache hit:', cached.intent);
    // 캐시된 결과도 visitors+hour → hourlyPattern 보정 적용
    if (cached.intent === 'query_kpi' && cached.entities.queryType === 'visitors' && cached.entities.hour !== undefined) {
      console.log('[classifier] Cache override: visitors + hour → hourlyPattern');
      cached.entities.queryType = 'hourlyPattern';
    }
    return {
      intent: cached.intent,
      confidence: cached.confidence,
      entities: cached.entities,
      method: 'cache',
    };
  }

  // 2. AI 분류 (캐시 미스 → 상품 카탈로그 lazy 로딩)
  console.log('[classifier] AI classification for:', message.substring(0, 50));

  // 캐시 미스일 때만 상품 카탈로그 로드 (성능 최적화)
  const productCatalog = await loadProductCatalog?.();

  try {
    // 프롬프트 생성
    const contextStr = formatContext(context);
    const catalogStr = formatProductCatalog(productCatalog);
    const prompt = INTENT_CLASSIFICATION_PROMPT
      .replace('{userMessage}', message)
      .replace('{context}', contextStr)
      .replace('{productCatalog}', catalogStr);

    // Gemini API 호출
    const response = await callGemini(
      [{ role: 'user', content: prompt }],
      { jsonMode: true, temperature: 0.1, maxTokens: 512 }
    );

    // 응답 파싱
    const parsed = parseJsonResponse<AIClassificationResponse>(response.content);

    if (parsed && parsed.intent && VALID_INTENTS.includes(parsed.intent)) {
      console.log('[classifier] AI result:', parsed.intent, 'confidence:', parsed.confidence);

      // 엔티티 변환 및 보강
      const entities = transformEntities(parsed.entities || {}, message);

      // 분류 보정: "visitors" + 특정 시간(hour)이 있으면 → "hourlyPattern"으로 재분류
      let finalIntent = parsed.intent;
      let finalConfidence = parsed.confidence;
      if (parsed.intent === 'query_kpi' && entities.queryType === 'visitors' && entities.hour !== undefined) {
        console.log('[classifier] Override: visitors + hour → hourlyPattern');
        entities.queryType = 'hourlyPattern';
        finalIntent = 'query_kpi';
      }

      // 분류 보정: 카테고리 vs 상품 중의성 해소
      if (parsed.intent === 'query_kpi' && productCatalog) {
        const corrected = disambiguateCategoryVsProduct(
          entities, message, productCatalog, finalConfidence
        );
        if (corrected.changed || corrected.confidence !== finalConfidence) {
          entities.queryType = corrected.queryType;
          if (corrected.itemFilter) entities.itemFilter = corrected.itemFilter;
          if (corrected.responseHint) entities.responseHint = corrected.responseHint;
          finalConfidence = corrected.confidence;
          console.log(`[classifier] Category/Product disambiguation: queryType=${corrected.queryType}, confidence=${corrected.confidence}`);
        }
      }

      // 캐시 저장 (탭 컨텍스트 포함)
      setCachedIntent(message, finalIntent, finalConfidence, entities, currentTab);

      return {
        intent: finalIntent,
        confidence: finalConfidence,
        entities,
        method: 'ai',
        reasoning: parsed.reasoning,
      };
    }

    console.warn('[classifier] Invalid AI response:', parsed);

  } catch (error) {
    console.error('[classifier] AI classification error:', error);
  }

  // 3. 폴백: general_chat
  console.log('[classifier] Falling back to general_chat');
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'fallback',
  };
}

/**
 * AI 응답 엔티티를 내부 형식으로 변환 및 보강
 */
function transformEntities(
  aiEntities: AIClassificationResponse['entities'],
  originalMessage: string
): Record<string, any> {
  const entities: Record<string, any> = {};

  if (!aiEntities) {
    return entities;
  }

  // 페이지
  if (aiEntities.page) {
    entities.page = aiEntities.page;
  }

  // 탭
  if (aiEntities.tab) {
    entities.tab = aiEntities.tab;

    // 탭에서 페이지 추론
    if (!entities.page) {
      entities.inferredPage = inferPageFromTab(aiEntities.tab);
    }
  }

  // 섹션
  if (aiEntities.sectionId) {
    entities.section = aiEntities.sectionId;
  }

  // 모달
  if (aiEntities.modalId) {
    entities.modalId = aiEntities.modalId;
  }

  // 쿼리 타입
  if (aiEntities.queryType) {
    entities.queryType = aiEntities.queryType;
  }

  // 필터
  if (aiEntities.filter) {
    entities.filter = aiEntities.filter;
  }

  // 테이블 페이지
  if (aiEntities.tablePage !== undefined) {
    entities.tablePage = aiEntities.tablePage;
  }

  // 기간 처리
  if (aiEntities.period) {
    entities.period = aiEntities.period;

    // 날짜 프리셋
    if (aiEntities.period.type && aiEntities.period.type !== 'custom') {
      entities.datePreset = aiEntities.period.type;
    }

    // 커스텀 날짜 범위
    if (aiEntities.period.startDate) {
      entities.dateStart = aiEntities.period.startDate;
    }
    if (aiEntities.period.endDate) {
      entities.dateEnd = aiEntities.period.endDate;
    }
  }

  // 스튜디오 제어 엔티티 (직접 패스스루)
  const studioFields = [
    'scenario', 'simulationType', 'optimizationType',
    'overlay', 'visible', 'simCommand', 'simSpeed',
    'simType', 'customerCount', 'duration',
    'optGoal', 'optTypes', 'optIntensity',
    'viewMode', 'panel', 'sceneName',
    'weather', 'timeOfDay', 'holidayType', 'preset',
  ] as const;
  for (const field of studioFields) {
    if (aiEntities[field] !== undefined) {
      entities[field] = aiEntities[field];
    }
  }

  // 세부 필터 엔티티 (직접 패스스루)
  if (aiEntities.itemFilter && Array.isArray(aiEntities.itemFilter)) {
    entities.itemFilter = aiEntities.itemFilter;
  }
  if (aiEntities.hour !== undefined && typeof aiEntities.hour === 'number') {
    entities.hour = aiEntities.hour;
  }
  if (aiEntities.responseHint && typeof aiEntities.responseHint === 'string') {
    entities.responseHint = aiEntities.responseHint;
  }

  // 패턴 기반 날짜 추출 (항상 실행, AI보다 정확한 한국어 날짜 파싱)
  const extractedDate = extractDateRange(originalMessage);
  if (extractedDate) {
    if (extractedDate.preset) {
      // 프리셋은 AI가 이미 추출했으면 유지, 아니면 패턴 기반 사용
      if (!entities.period && !entities.datePreset) {
        entities.datePreset = extractedDate.preset;
        entities.period = { type: extractedDate.preset };
      }
    } else if (extractedDate.startDate && extractedDate.endDate) {
      // 커스텀 날짜(구체적 날짜)는 패턴 기반이 더 정확하므로 항상 우선
      console.log(`[classifier] Pattern date override: ${extractedDate.startDate}~${extractedDate.endDate}` +
        (entities.period?.startDate ? ` (AI was: ${entities.period.startDate}~${entities.period.endDate})` : ''));
      entities.dateStart = extractedDate.startDate;
      entities.dateEnd = extractedDate.endDate;
      entities.period = {
        type: 'custom',
        startDate: extractedDate.startDate,
        endDate: extractedDate.endDate,
      };
    }
  }

  // 패턴 기반 시간 보강 (AI가 시간을 못 추출했을 때)
  if (entities.hour === undefined) {
    const extractedHour = extractHour(originalMessage);
    if (extractedHour !== null) {
      entities.hour = extractedHour;
    }
  }

  return entities;
}

/**
 * 탭에서 페이지 추론
 */
function inferPageFromTab(tab: string): string | null {
  const insightsTabs = ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai', 'ai-recommendation'];
  const studioTabs = ['layer', 'ai-simulation', 'ai-optimization', 'apply'];
  const settingsTabs = ['stores', 'data', 'users', 'system', 'license'];

  if (insightsTabs.includes(tab)) return '/insights';
  if (studioTabs.includes(tab)) return '/studio';
  if (settingsTabs.includes(tab)) return '/settings';

  return null;
}

/**
 * 카테고리 vs 상품 중의성 해소 (후처리 보정)
 *
 * 규칙:
 * 1. 정확히 일치하는 상품명이 있으면 → product 우선
 * 2. 카테고리명만 매칭되면 → categoryAnalysis 우선
 * 3. 둘 다 매칭되고 애매하면 → confidence를 낮춰서 되물을 수 있게 함
 */
function disambiguateCategoryVsProduct(
  entities: Record<string, any>,
  message: string,
  productCatalog: {
    categories?: string[];
    products?: Array<{ name: string; category: string }>;
  },
  currentConfidence: number
): {
  changed: boolean;
  queryType: string;
  itemFilter?: string[];
  responseHint?: string;
  confidence: number;
} {
  const queryType = entities.queryType;
  const itemFilter: string[] = entities.itemFilter || [];
  const messageLower = message.toLowerCase();

  // product/categoryAnalysis/topProducts 관련 쿼리만 대상
  if (!['product', 'categoryAnalysis', 'topProducts'].includes(queryType)) {
    return { changed: false, queryType, confidence: currentConfidence };
  }

  const categories = (productCatalog.categories || []).map(c => c.toLowerCase());
  const products = (productCatalog.products || []).map(p => ({
    name: p.name.toLowerCase(),
    category: p.category.toLowerCase(),
  }));

  // 판매 관련 키워드 감지 (responseHint 보정용)
  const quantityKeywords = /몇\s*개|몇개|판매량|팔았|팔렸|얼마나\s*팔/;
  const hasQuantityHint = quantityKeywords.test(message);

  // itemFilter가 있는 경우: 각 필터를 카테고리/상품에 대조
  if (itemFilter.length > 0) {
    for (const filter of itemFilter) {
      const filterLower = filter.toLowerCase();
      const filterNorm = normalizeForMatch(filter);

      // 정확히 일치하는 상품명이 있는지 확인 (공백 무시)
      const exactProductMatch = products.some(p => normalizeForMatch(p.name) === filterNorm || normalizeForMatch(p.name).includes(filterNorm));
      // 카테고리명과 일치하는지 확인 (공백 무시)
      const categoryMatch = categories.some(c => normalizeForMatch(c) === filterNorm || normalizeForMatch(c).includes(filterNorm) || filterNorm.includes(normalizeForMatch(c)));

      if (exactProductMatch && !categoryMatch) {
        // 상품명만 매칭 → product로 확정
        return {
          changed: queryType !== 'product',
          queryType: 'product',
          itemFilter,
          confidence: Math.max(currentConfidence, 0.85),
        };
      }

      if (categoryMatch && !exactProductMatch) {
        // 카테고리명만 매칭 → categoryAnalysis로 확정
        return {
          changed: queryType !== 'categoryAnalysis',
          queryType: 'categoryAnalysis',
          itemFilter,
          responseHint: hasQuantityHint ? 'quantity' : entities.responseHint,
          confidence: Math.max(currentConfidence, 0.85),
        };
      }

      if (categoryMatch && exactProductMatch) {
        // 둘 다 매칭 → 상품명이 카테고리명보다 더 구체적으로 매칭되는지 확인
        const exactNameMatch = products.some(p => normalizeForMatch(p.name) === filterNorm);
        if (exactNameMatch) {
          // 상품명 정확 일치 → product 우선
          return {
            changed: queryType !== 'product',
            queryType: 'product',
            itemFilter,
            confidence: Math.max(currentConfidence, 0.8),
          };
        }
        // 애매한 경우 → confidence 낮춤 (되물을 수 있게)
        return {
          changed: false,
          queryType: queryType,
          itemFilter,
          responseHint: hasQuantityHint ? 'quantity' : entities.responseHint,
          confidence: Math.min(currentConfidence, 0.55),
        };
      }
    }
  } else {
    // itemFilter가 없는 경우: 메시지에서 카테고리명 직접 탐지
    for (const cat of productCatalog.categories || []) {
      if (normalizeForMatch(messageLower).includes(normalizeForMatch(cat))) {
        // 동시에 상품명에도 포함되는지 확인
        const matchingProducts = products.filter(p => normalizeForMatch(p.name).includes(normalizeForMatch(cat)));
        const isAlsoProductName = matchingProducts.length > 0;

        if (!isAlsoProductName) {
          // 카테고리명만 매칭 → categoryAnalysis로 보정
          return {
            changed: queryType !== 'categoryAnalysis',
            queryType: 'categoryAnalysis',
            itemFilter: [cat],
            responseHint: hasQuantityHint ? 'quantity' : entities.responseHint,
            confidence: Math.max(currentConfidence, 0.85),
          };
        }
        // 상품명에도 포함 → 애매 → confidence 낮춤
        if (queryType !== 'categoryAnalysis') {
          return {
            changed: true,
            queryType: 'categoryAnalysis',
            itemFilter: [cat],
            responseHint: hasQuantityHint ? 'quantity' : entities.responseHint,
            confidence: Math.min(currentConfidence, 0.55),
          };
        }
      }
    }
  }

  // 변경 없음
  return { changed: false, queryType, confidence: currentConfidence };
}
