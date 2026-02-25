/**
 * associationMiner.ts - Phase 0.3: Product Association Mining Module
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 상품 연관 규칙 마이닝 및 크로스셀/번들/임펄스 배치 기회 분석
 *
 * 주요 기능:
 * - Apriori 알고리즘 기반 연관 규칙 마이닝
 * - 카테고리 친화도 분석
 * - 상품 클러스터링
 * - 배치 추천 생성 (bundle, cross_sell, upsell, impulse)
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 연관 규칙
 */
export interface AssociationRule {
  ruleId: string;
  antecedent: string[];           // 선행 상품 ID
  consequent: string[];           // 후행 상품 ID
  antecedentSkus: string[];       // 선행 상품 SKU
  consequentSkus: string[];       // 후행 상품 SKU
  antecedentNames: string[];      // 선행 상품명 (표시용)
  consequentNames: string[];      // 후행 상품명 (표시용)
  support: number;                // 지지도 (0-1)
  confidence: number;             // 신뢰도 (0-1)
  lift: number;                   // 향상도 (>1이면 양의 연관)
  conviction: number;             // 확신도
  ruleStrength: 'very_strong' | 'strong' | 'moderate' | 'weak';
  metadata: {
    coOccurrenceCount: number;    // 동시 구매 횟수
    avgBasketValue: number;       // 함께 구매 시 평균 객단가
    categoryPair: string;         // 카테고리 조합 (예: "outerwear+accessory")
  };
}

/**
 * 상품 클러스터
 */
export interface ProductCluster {
  clusterId: string;
  clusterName: string;
  products: string[];             // 상품 ID 배열
  productSkus: string[];          // SKU 배열
  characteristics: {
    avgPrice: number;
    dominantCategory: string;
    priceRange: { min: number; max: number };
    seasonality: string;
  };
  placementStrategy: string;
}

/**
 * 카테고리 친화도
 */
export interface CategoryAffinity {
  category1: string;
  category2: string;
  affinityScore: number;          // 0-1
  commonPurchaseRate: number;     // 동시 구매율
  avgLift: number;                // 카테고리 간 평균 lift
  recommendedProximity: 'adjacent' | 'same_zone' | 'visible' | 'any';
  topProductPairs: Array<{
    product1Id: string;
    product1Sku: string;
    product2Id: string;
    product2Sku: string;
    lift: number;
  }>;
}

/**
 * 배치 추천
 */
export interface PlacementRecommendation {
  recommendationId: string;
  type: 'bundle' | 'cross_sell' | 'upsell' | 'impulse';
  priority: 'critical' | 'high' | 'medium' | 'low';
  primaryProduct: {
    id: string;
    sku: string;
    name: string;
    category: string;
    currentZone: string;
    price: number;
  };
  secondaryProducts: Array<{
    id: string;
    sku: string;
    name: string;
    category: string;
    currentZone: string;
    price: number;
  }>;
  recommendedZone: string;
  expectedLift: number;
  confidence: number;
  reason: string;
  implementationGuide: string;
}

/**
 * 상품 연관 분석 결과
 */
export interface ProductAssociationResult {
  storeId: string;
  analysisDate: string;
  analysisPeriodDays: number;

  // 핵심 분석 결과
  associationRules: AssociationRule[];
  productClusters: ProductCluster[];
  categoryAffinities: CategoryAffinity[];
  placementRecommendations: PlacementRecommendation[];

  // 요약
  summary: {
    totalTransactions: number;
    avgBasketSize: number;
    totalRulesFound: number;
    strongRulesCount: number;
    veryStrongRulesCount: number;
    topCategoryPair: string;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };

  // AI 프롬프트용 컨텍스트
  aiPromptContext: string;
}

// ============================================================================
// Database Row Types
// ============================================================================

interface TransactionRow {
  id: string;
  store_id: string;
  total_amount: number | null;
  transaction_datetime: string;
}

interface LineItemRow {
  id: string;
  transaction_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ProductRow {
  id: string;
  sku: string | null;
  product_name: string;
  category: string | null;
  price: number | null;
  brand: string | null;
}

interface ProductPlacementRow {
  product_id: string;
  zone_id: string | null;
}

// ============================================================================
// Constants
// ============================================================================

// Apriori 알고리즘 설정
const DEFAULT_CONFIG = {
  minSupport: 0.01,        // 최소 지지도 (1%)
  minConfidence: 0.3,      // 최소 신뢰도 (30%)
  minLift: 1.2,            // 최소 향상도
  maxRules: 100,           // 최대 규칙 수
};

// 규칙 강도 임계값
const RULE_STRENGTH_THRESHOLDS = {
  very_strong: { confidence: 0.7, lift: 3.0 },
  strong: { confidence: 0.5, lift: 2.0 },
  moderate: { confidence: 0.3, lift: 1.5 },
  // weak: 나머지
};

// 카테고리 친화도 기본값 (데이터 부족 시 fallback)
const DEFAULT_CATEGORY_AFFINITIES: Record<string, Record<string, number>> = {
  outerwear: { accessory: 0.8, tops: 0.6, bottoms: 0.5, bags: 0.7, shoes: 0.4 },
  tops: { bottoms: 0.85, accessory: 0.6, outerwear: 0.6, bags: 0.5, shoes: 0.4 },
  bottoms: { tops: 0.85, shoes: 0.7, accessory: 0.5, bags: 0.4, outerwear: 0.5 },
  accessory: { outerwear: 0.8, tops: 0.6, bags: 0.7, bottoms: 0.5, shoes: 0.5 },
  bags: { accessory: 0.7, outerwear: 0.6, tops: 0.5, bottoms: 0.4, shoes: 0.4 },
  shoes: { bottoms: 0.7, accessory: 0.5, bags: 0.4, tops: 0.4, outerwear: 0.3 },
};

// 분석에 필요한 최소 거래 수
const MIN_TRANSACTIONS_REQUIRED = 50;

// 분석 기본 기간 (일)
const DEFAULT_ANALYSIS_DAYS = 90;

// ============================================================================
// Main Function
// ============================================================================

/**
 * 상품 연관 분석 메인 함수
 *
 * 분석 우선순위:
 * 1. product_associations 테이블에서 사전 계산된 규칙 로드 (신뢰도 높음)
 * 2. 거래 데이터 기반 실시간 마이닝 (충분한 데이터 필요)
 * 3. 기본 카테고리 친화도 fallback (데이터 부족 시)
 */
export async function analyzeProductAssociations(
  supabase: any,
  storeId: string,
  daysBack: number = DEFAULT_ANALYSIS_DAYS
): Promise<ProductAssociationResult> {
  const analysisDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const startDateStr = startDate.toISOString().split('T')[0];

  console.log(`[AssociationMiner] Starting analysis for store ${storeId}`);
  console.log(`[AssociationMiner] Analysis period: ${startDateStr} to ${analysisDate}`);

  // 0. 먼저 product_associations 테이블에서 사전 계산된 규칙 시도
  const precomputedResult = await loadPrecomputedAssociations(supabase, storeId, daysBack);

  if (precomputedResult) {
    console.log(`[AssociationMiner] Using precomputed associations from product_associations table`);
    return precomputedResult;
  }

  console.log(`[AssociationMiner] No precomputed associations, falling back to real-time mining`);

  // 1. 데이터 로드
  const [transactions, lineItems, products, placements] = await Promise.all([
    loadTransactions(supabase, storeId, startDateStr),
    loadLineItems(supabase, storeId, startDateStr),
    loadProducts(supabase, storeId),
    loadProductPlacements(supabase, storeId),
  ]);

  console.log(`[AssociationMiner] Loaded: ${transactions.length} transactions, ${lineItems.length} line items, ${products.length} products`);

  // 데이터 품질 평가
  const dataQuality = evaluateDataQuality(transactions.length, lineItems.length, products.length);

  // 데이터 부족 시 빈 결과 + fallback 카테고리 친화도 반환
  if (transactions.length < MIN_TRANSACTIONS_REQUIRED) {
    console.log(`[AssociationMiner] Insufficient data (${transactions.length} < ${MIN_TRANSACTIONS_REQUIRED}), returning fallback`);
    return createFallbackResult(storeId, analysisDate, daysBack, products, placements, dataQuality);
  }

  // 2. 장바구니 구축
  const baskets = buildBaskets(lineItems);
  const avgBasketSize = calculateAvgBasketSize(baskets);

  console.log(`[AssociationMiner] Built ${baskets.size} baskets, avg size: ${avgBasketSize.toFixed(2)}`);

  // 3. 상품 ID → 정보 맵 생성
  const productMap = new Map<string, ProductRow>();
  products.forEach(p => productMap.set(p.id, p));

  // 상품 배치 맵 생성
  const placementMap = new Map<string, string>();
  placements.forEach(p => {
    if (p.zone_id) placementMap.set(p.product_id, p.zone_id);
  });

  // 4. 연관 규칙 마이닝
  const associationRules = mineAssociationRules(baskets, productMap, transactions, DEFAULT_CONFIG);

  console.log(`[AssociationMiner] Found ${associationRules.length} association rules`);

  // 5. 상품 클러스터링
  const productClusters = clusterProducts(associationRules, productMap);

  // 6. 카테고리 친화도 계산
  const categoryAffinities = calculateCategoryAffinities(baskets, productMap, associationRules);

  // 7. 배치 추천 생성
  const placementRecommendations = generatePlacementRecommendations(
    associationRules, productClusters, categoryAffinities, productMap, placementMap
  );

  // 8. 요약 생성
  const strongRulesCount = associationRules.filter(r =>
    r.ruleStrength === 'strong' || r.ruleStrength === 'very_strong'
  ).length;
  const veryStrongRulesCount = associationRules.filter(r => r.ruleStrength === 'very_strong').length;

  const topCategoryPair = categoryAffinities.length > 0
    ? `${categoryAffinities[0].category1}+${categoryAffinities[0].category2}`
    : 'N/A';

  const summary = {
    totalTransactions: transactions.length,
    avgBasketSize,
    totalRulesFound: associationRules.length,
    strongRulesCount,
    veryStrongRulesCount,
    topCategoryPair,
    dataQuality,
  };

  // 9. AI 프롬프트 컨텍스트 생성
  const aiPromptContext = buildAIPromptContext(
    associationRules, categoryAffinities, placementRecommendations, summary
  );

  const result: ProductAssociationResult = {
    storeId,
    analysisDate,
    analysisPeriodDays: daysBack,
    associationRules,
    productClusters,
    categoryAffinities,
    placementRecommendations,
    summary,
    aiPromptContext,
  };

  console.log(`[AssociationMiner] Analysis complete. Strong rules: ${strongRulesCount}, Recommendations: ${placementRecommendations.length}`);

  return result;
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * product_associations 테이블에서 사전 계산된 연관 규칙 로드
 * 테이블에 데이터가 있으면 실시간 마이닝 대신 이 데이터를 사용
 */
async function loadPrecomputedAssociations(
  supabase: any,
  storeId: string,
  daysBack: number
): Promise<ProductAssociationResult | null> {
  try {
    // 1. product_associations 테이블에서 연관 규칙 로드
    const { data: associations, error } = await supabase
      .from('product_associations')
      .select(`
        id,
        antecedent_product_id,
        consequent_product_id,
        support,
        confidence,
        lift,
        conviction,
        rule_type,
        rule_strength,
        placement_type,
        co_occurrence_count,
        avg_basket_value,
        antecedent_category,
        consequent_category,
        category_pair,
        sample_transaction_count,
        metadata,
        antecedent:antecedent_product_id(id, sku, product_name, category, price),
        consequent:consequent_product_id(id, sku, product_name, category, price)
      `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('lift', { ascending: false });

    if (error) {
      console.error('[AssociationMiner] Error loading precomputed associations:', error);
      return null;
    }

    // 데이터가 없으면 null 반환하여 실시간 마이닝으로 fallback
    if (!associations || associations.length === 0) {
      console.log('[AssociationMiner] No precomputed associations found');
      return null;
    }

    console.log(`[AssociationMiner] Loaded ${associations.length} precomputed associations`);

    // 2. 상품 정보 로드 (배치 정보용)
    const products = await loadProducts(supabase, storeId);
    const placements = await loadProductPlacements(supabase, storeId);

    const productMap = new Map<string, ProductRow>();
    products.forEach(p => productMap.set(p.id, p));

    const placementMap = new Map<string, string>();
    placements.forEach(p => {
      if (p.zone_id) placementMap.set(p.product_id, p.zone_id);
    });

    // 3. AssociationRule 형식으로 변환
    const associationRules: AssociationRule[] = associations.map((row: any, index: number) => {
      const antProduct = row.antecedent;
      const conProduct = row.consequent;

      return {
        ruleId: `precomputed_rule_${index + 1}`,
        antecedent: [row.antecedent_product_id],
        consequent: [row.consequent_product_id],
        antecedentSkus: [antProduct?.sku || ''],
        consequentSkus: [conProduct?.sku || ''],
        antecedentNames: [antProduct?.product_name || 'Unknown'],
        consequentNames: [conProduct?.product_name || 'Unknown'],
        support: parseFloat(row.support) || 0.01,
        confidence: parseFloat(row.confidence) || 0.3,
        lift: parseFloat(row.lift) || 1.0,
        conviction: parseFloat(row.conviction) || 1.0,
        ruleStrength: row.rule_strength as AssociationRule['ruleStrength'],
        metadata: {
          coOccurrenceCount: row.co_occurrence_count || 0,
          avgBasketValue: parseFloat(row.avg_basket_value) || 0,
          categoryPair: row.category_pair || `${row.antecedent_category}+${row.consequent_category}`,
        },
      };
    });

    // 4. 카테고리 친화도 계산 (사전 계산된 규칙 기반)
    const categoryAffinities = calculateCategoryAffinitiesFromRules(associationRules, productMap);

    // 5. 배치 추천 생성
    const productClusters = clusterProducts(associationRules, productMap);
    const placementRecommendations = generatePlacementRecommendationsFromPrecomputed(
      associations, productMap, placementMap
    );

    // 6. 요약 통계
    const strongRulesCount = associationRules.filter(r =>
      r.ruleStrength === 'strong' || r.ruleStrength === 'very_strong'
    ).length;
    const veryStrongRulesCount = associationRules.filter(r => r.ruleStrength === 'very_strong').length;

    const topCategoryPair = categoryAffinities.length > 0
      ? `${categoryAffinities[0].category1}+${categoryAffinities[0].category2}`
      : 'N/A';

    // 평균 sample_transaction_count로 데이터 품질 평가
    const avgSampleCount = associations.reduce((sum: number, a: any) =>
      sum + (a.sample_transaction_count || 0), 0) / associations.length;

    let dataQuality: ProductAssociationResult['summary']['dataQuality'] = 'poor';
    if (avgSampleCount >= 500) dataQuality = 'excellent';
    else if (avgSampleCount >= 200) dataQuality = 'good';
    else if (avgSampleCount >= 50) dataQuality = 'fair';

    const summary = {
      totalTransactions: Math.round(avgSampleCount),
      avgBasketSize: 2.5, // 사전 계산 시 추정값
      totalRulesFound: associationRules.length,
      strongRulesCount,
      veryStrongRulesCount,
      topCategoryPair,
      dataQuality,
    };

    // 7. AI 프롬프트 컨텍스트 생성
    const aiPromptContext = buildAIPromptContext(
      associationRules, categoryAffinities, placementRecommendations, summary
    );

    const analysisDate = new Date().toISOString().split('T')[0];

    return {
      storeId,
      analysisDate,
      analysisPeriodDays: daysBack,
      associationRules,
      productClusters,
      categoryAffinities,
      placementRecommendations,
      summary,
      aiPromptContext,
    };
  } catch (error) {
    console.error('[AssociationMiner] Exception in loadPrecomputedAssociations:', error);
    return null;
  }
}

/**
 * 사전 계산된 규칙에서 카테고리 친화도 계산
 */
function calculateCategoryAffinitiesFromRules(
  rules: AssociationRule[],
  productMap: Map<string, ProductRow>
): CategoryAffinity[] {
  const categoryPairs = new Map<string, {
    count: number;
    totalLift: number;
    totalConfidence: number;
    productPairs: Array<{ p1: string; p2: string; lift: number }>;
  }>();

  for (const rule of rules) {
    const antCat = productMap.get(rule.antecedent[0])?.category || rule.metadata.categoryPair?.split('+')[0] || 'unknown';
    const conCat = productMap.get(rule.consequent[0])?.category || rule.metadata.categoryPair?.split('+')[1] || 'unknown';

    if (antCat === conCat) continue;

    const pairKey = [antCat, conCat].sort().join('|');

    if (!categoryPairs.has(pairKey)) {
      categoryPairs.set(pairKey, { count: 0, totalLift: 0, totalConfidence: 0, productPairs: [] });
    }

    const pair = categoryPairs.get(pairKey)!;
    pair.count += 1;
    pair.totalLift += rule.lift;
    pair.totalConfidence += rule.confidence;
    pair.productPairs.push({
      p1: rule.antecedent[0],
      p2: rule.consequent[0],
      lift: rule.lift,
    });
  }

  const affinities: CategoryAffinity[] = [];

  for (const [pairKey, pairData] of categoryPairs) {
    const [cat1, cat2] = pairKey.split('|');
    const avgLift = pairData.count > 0 ? pairData.totalLift / pairData.count : 1;
    const avgConfidence = pairData.count > 0 ? pairData.totalConfidence / pairData.count : 0;

    // 친화도 점수 계산
    const affinityScore = Math.min(1, (avgLift - 1) / 3 + avgConfidence);

    let recommendedProximity: CategoryAffinity['recommendedProximity'] = 'any';
    if (affinityScore >= 0.7) recommendedProximity = 'adjacent';
    else if (affinityScore >= 0.5) recommendedProximity = 'same_zone';
    else if (affinityScore >= 0.3) recommendedProximity = 'visible';

    const topPairs = pairData.productPairs
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 5)
      .map(pp => ({
        product1Id: pp.p1,
        product1Sku: productMap.get(pp.p1)?.sku || '',
        product2Id: pp.p2,
        product2Sku: productMap.get(pp.p2)?.sku || '',
        lift: pp.lift,
      }));

    affinities.push({
      category1: cat1,
      category2: cat2,
      affinityScore,
      commonPurchaseRate: avgConfidence,
      avgLift,
      recommendedProximity,
      topProductPairs: topPairs,
    });
  }

  affinities.sort((a, b) => b.affinityScore - a.affinityScore);
  return affinities;
}

/**
 * 사전 계산된 연관 규칙에서 배치 추천 생성
 */
function generatePlacementRecommendationsFromPrecomputed(
  associations: any[],
  productMap: Map<string, ProductRow>,
  placementMap: Map<string, string>
): PlacementRecommendation[] {
  const recommendations: PlacementRecommendation[] = [];
  let recId = 1;

  for (const assoc of associations) {
    const antProduct = assoc.antecedent;
    const conProduct = assoc.consequent;

    if (!antProduct || !conProduct) continue;

    const placementType = assoc.placement_type as PlacementRecommendation['type'];
    const ruleStrength = assoc.rule_strength;

    // 우선순위 결정
    let priority: PlacementRecommendation['priority'] = 'low';
    if (ruleStrength === 'very_strong') priority = 'critical';
    else if (ruleStrength === 'strong') priority = 'high';
    else if (ruleStrength === 'moderate') priority = 'medium';

    const primaryZone = placementMap.get(assoc.antecedent_product_id) || 'unknown';
    const secondaryZone = placementMap.get(assoc.consequent_product_id) || 'unknown';

    // 같은 존에 이미 있으면 bundle/cross_sell 추천 스킵
    if (placementType === 'cross_sell' && primaryZone === secondaryZone && primaryZone !== 'unknown') {
      continue;
    }

    // 추천 사유 생성
    let reason = '';
    let implementationGuide = '';

    switch (placementType) {
      case 'bundle':
        reason = `${(assoc.confidence * 100).toFixed(0)}% 동시 구매율, ${parseFloat(assoc.lift).toFixed(1)}x 향상도`;
        implementationGuide = '번들 디스플레이 설치, 세트 프로모션 가격 책정 권장';
        break;
      case 'cross_sell':
        reason = `크로스셀 기회 - 현재 다른 구역에 배치됨`;
        implementationGuide = '연관 상품을 동일 구역 또는 인접 슬롯에 배치';
        break;
      case 'upsell':
        reason = `업셀 기회 - 고가 상품으로 연결 가능`;
        implementationGuide = '기본 상품 옆에 프리미엄 옵션 배치, 비교 디스플레이 활용';
        break;
      case 'impulse':
        reason = `저가 충동구매 유도 상품 - 연관 구매 빈도 높음`;
        implementationGuide = '계산대 또는 동선 마지막 구간에 배치';
        break;
    }

    recommendations.push({
      recommendationId: `rec_precomputed_${recId++}`,
      type: placementType,
      priority,
      primaryProduct: {
        id: assoc.antecedent_product_id,
        sku: antProduct.sku || '',
        name: antProduct.product_name || 'Unknown',
        category: antProduct.category || assoc.antecedent_category || '',
        currentZone: primaryZone,
        price: antProduct.price || 0,
      },
      secondaryProducts: [{
        id: assoc.consequent_product_id,
        sku: conProduct.sku || '',
        name: conProduct.product_name || 'Unknown',
        category: conProduct.category || assoc.consequent_category || '',
        currentZone: secondaryZone,
        price: conProduct.price || 0,
      }],
      recommendedZone: placementType === 'impulse' ? 'checkout' : primaryZone,
      expectedLift: parseFloat(assoc.lift) || 1.0,
      confidence: parseFloat(assoc.confidence) || 0.3,
      reason,
      implementationGuide,
    });
  }

  // 우선순위 순 정렬
  recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return recommendations;
}

async function loadTransactions(
  supabase: any,
  storeId: string,
  startDate: string
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, store_id, total_amount, transaction_datetime')
    .eq('store_id', storeId)
    .gte('transaction_datetime', startDate)
    .order('transaction_datetime', { ascending: false });

  if (error) {
    console.error('[AssociationMiner] Error loading transactions:', error);
    return [];
  }

  return data || [];
}

async function loadLineItems(
  supabase: any,
  storeId: string,
  startDate: string
): Promise<LineItemRow[]> {
  const { data, error } = await supabase
    .from('line_items')
    .select('id, transaction_id, product_id, quantity, unit_price, line_total')
    .eq('store_id', storeId)
    .gte('transaction_date', startDate)
    .not('product_id', 'is', null);

  if (error) {
    console.error('[AssociationMiner] Error loading line items:', error);
    return [];
  }

  return data || [];
}

async function loadProducts(
  supabase: any,
  storeId: string
): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, product_name, category, price, brand')
    .eq('store_id', storeId);

  if (error) {
    console.error('[AssociationMiner] Error loading products:', error);
    return [];
  }

  return data || [];
}

async function loadProductPlacements(
  supabase: any,
  storeId: string
): Promise<ProductPlacementRow[]> {
  const { data, error } = await supabase
    .from('product_placements')
    .select('product_id, furniture_slots!inner(furniture:furniture_id(zone_id))')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (error) {
    console.error('[AssociationMiner] Error loading placements:', error);
    return [];
  }

  // zone_id 추출
  return (data || []).map((p: any) => ({
    product_id: p.product_id,
    zone_id: p.furniture_slots?.furniture?.zone_id || null,
  }));
}

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * 장바구니 구축
 * transaction_id → Set<product_id>
 */
function buildBaskets(lineItems: LineItemRow[]): Map<string, Set<string>> {
  const baskets = new Map<string, Set<string>>();

  for (const item of lineItems) {
    if (!item.product_id) continue;

    if (!baskets.has(item.transaction_id)) {
      baskets.set(item.transaction_id, new Set());
    }
    baskets.get(item.transaction_id)!.add(item.product_id);
  }

  return baskets;
}

/**
 * 평균 장바구니 크기 계산
 */
function calculateAvgBasketSize(baskets: Map<string, Set<string>>): number {
  if (baskets.size === 0) return 0;

  let totalItems = 0;
  for (const basket of baskets.values()) {
    totalItems += basket.size;
  }

  return totalItems / baskets.size;
}

/**
 * 단일 아이템 빈도 계산
 */
function calculateItemFrequencies(
  baskets: Map<string, Set<string>>,
  minSupport: number
): Map<string, number> {
  const itemCounts = new Map<string, number>();
  const totalBaskets = baskets.size;

  // 각 아이템 등장 횟수 계산
  for (const basket of baskets.values()) {
    for (const item of basket) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    }
  }

  // 최소 지지도 필터링
  const frequentItems = new Map<string, number>();
  const minCount = Math.floor(totalBaskets * minSupport);

  for (const [item, count] of itemCounts) {
    if (count >= minCount) {
      frequentItems.set(item, count);
    }
  }

  return frequentItems;
}

/**
 * 2-아이템 조합 빈도 계산
 */
function calculatePairFrequencies(
  baskets: Map<string, Set<string>>,
  frequentItems: Map<string, number>
): Map<string, { count: number; totalValue: number }> {
  const pairCounts = new Map<string, { count: number; totalValue: number }>();
  const frequentItemSet = new Set(frequentItems.keys());

  for (const basket of baskets.values()) {
    // 빈발 아이템만 필터링
    const items = Array.from(basket).filter(item => frequentItemSet.has(item));

    // 2-조합 생성
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        // 정렬된 키 생성 (순서 무관하게 동일한 키)
        const key = [items[i], items[j]].sort().join('|');

        if (!pairCounts.has(key)) {
          pairCounts.set(key, { count: 0, totalValue: 0 });
        }
        pairCounts.get(key)!.count += 1;
      }
    }
  }

  return pairCounts;
}

/**
 * Apriori 알고리즘으로 연관 규칙 마이닝
 */
function mineAssociationRules(
  baskets: Map<string, Set<string>>,
  productMap: Map<string, ProductRow>,
  transactions: TransactionRow[],
  config: typeof DEFAULT_CONFIG
): AssociationRule[] {
  const totalBaskets = baskets.size;
  if (totalBaskets === 0) return [];

  // 1. 빈발 아이템 계산
  const itemFrequencies = calculateItemFrequencies(baskets, config.minSupport);

  // 2. 2-아이템 조합 빈도 계산
  const pairFrequencies = calculatePairFrequencies(baskets, itemFrequencies);

  // 3. 연관 규칙 생성
  const rules: AssociationRule[] = [];
  let ruleId = 1;

  for (const [pairKey, pairData] of pairFrequencies) {
    const [item1, item2] = pairKey.split('|');
    const pairCount = pairData.count;

    // 지지도 계산
    const support = pairCount / totalBaskets;
    if (support < config.minSupport) continue;

    // 양방향 규칙 생성 (A→B, B→A)
    const item1Count = itemFrequencies.get(item1) || 0;
    const item2Count = itemFrequencies.get(item2) || 0;

    // A→B 규칙
    const confidence1 = pairCount / item1Count;
    const lift1 = confidence1 / (item2Count / totalBaskets);

    if (confidence1 >= config.minConfidence && lift1 >= config.minLift) {
      const rule = createAssociationRule(
        ruleId++, [item1], [item2], support, confidence1, lift1,
        pairCount, productMap, pairData.totalValue / pairCount
      );
      rules.push(rule);
    }

    // B→A 규칙
    const confidence2 = pairCount / item2Count;
    const lift2 = confidence2 / (item1Count / totalBaskets);

    if (confidence2 >= config.minConfidence && lift2 >= config.minLift) {
      const rule = createAssociationRule(
        ruleId++, [item2], [item1], support, confidence2, lift2,
        pairCount, productMap, pairData.totalValue / pairCount
      );
      rules.push(rule);
    }
  }

  // Lift 기준 정렬 및 제한
  rules.sort((a, b) => b.lift - a.lift);
  return rules.slice(0, config.maxRules);
}

/**
 * 연관 규칙 객체 생성
 */
function createAssociationRule(
  ruleId: number,
  antecedent: string[],
  consequent: string[],
  support: number,
  confidence: number,
  lift: number,
  coOccurrenceCount: number,
  productMap: Map<string, ProductRow>,
  avgBasketValue: number
): AssociationRule {
  // 확신도 계산
  const supportConsequent = support / confidence;
  const conviction = supportConsequent < 1 ? (1 - supportConsequent) / (1 - confidence) : Infinity;

  // 규칙 강도 분류
  let ruleStrength: AssociationRule['ruleStrength'] = 'weak';
  if (confidence >= RULE_STRENGTH_THRESHOLDS.very_strong.confidence &&
      lift >= RULE_STRENGTH_THRESHOLDS.very_strong.lift) {
    ruleStrength = 'very_strong';
  } else if (confidence >= RULE_STRENGTH_THRESHOLDS.strong.confidence &&
             lift >= RULE_STRENGTH_THRESHOLDS.strong.lift) {
    ruleStrength = 'strong';
  } else if (confidence >= RULE_STRENGTH_THRESHOLDS.moderate.confidence &&
             lift >= RULE_STRENGTH_THRESHOLDS.moderate.lift) {
    ruleStrength = 'moderate';
  }

  // 상품 정보 추출
  const getProductInfo = (ids: string[]) => {
    return ids.map(id => {
      const product = productMap.get(id);
      return {
        sku: product?.sku || id,
        name: product?.product_name || 'Unknown',
        category: product?.category || 'unknown',
      };
    });
  };

  const antecedentInfo = getProductInfo(antecedent);
  const consequentInfo = getProductInfo(consequent);

  // 카테고리 쌍
  const categories = new Set([
    ...antecedentInfo.map(p => p.category),
    ...consequentInfo.map(p => p.category),
  ]);
  const categoryPair = Array.from(categories).sort().join('+');

  return {
    ruleId: `rule_${ruleId}`,
    antecedent,
    consequent,
    antecedentSkus: antecedentInfo.map(p => p.sku),
    consequentSkus: consequentInfo.map(p => p.sku),
    antecedentNames: antecedentInfo.map(p => p.name),
    consequentNames: consequentInfo.map(p => p.name),
    support,
    confidence,
    lift,
    conviction: isFinite(conviction) ? conviction : 99,
    ruleStrength,
    metadata: {
      coOccurrenceCount,
      avgBasketValue: avgBasketValue || 0,
      categoryPair,
    },
  };
}

/**
 * 상품 클러스터링 (강한 연관 기반)
 */
function clusterProducts(
  rules: AssociationRule[],
  productMap: Map<string, ProductRow>
): ProductCluster[] {
  // Union-Find 구조
  const parent = new Map<string, string>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  function union(x: string, y: string): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) {
      parent.set(px, py);
    }
  }

  // 강한 규칙의 상품들을 연결
  const strongRules = rules.filter(r =>
    r.ruleStrength === 'very_strong' || r.ruleStrength === 'strong'
  );

  for (const rule of strongRules) {
    for (const ant of rule.antecedent) {
      for (const con of rule.consequent) {
        union(ant, con);
      }
    }
  }

  // 클러스터 그룹화
  const clusters = new Map<string, Set<string>>();
  for (const [item] of parent) {
    const root = find(item);
    if (!clusters.has(root)) {
      clusters.set(root, new Set());
    }
    clusters.get(root)!.add(item);
  }

  // 클러스터 객체 생성
  const result: ProductCluster[] = [];
  let clusterId = 1;

  for (const [, productIds] of clusters) {
    if (productIds.size < 2) continue; // 단일 상품 클러스터 제외

    const products = Array.from(productIds);
    const productInfos = products.map(id => productMap.get(id)).filter(Boolean) as ProductRow[];

    if (productInfos.length === 0) continue;

    // 특성 계산
    const prices = productInfos.map(p => p.price || 0).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    // 지배적 카테고리 찾기
    const categoryCounts = new Map<string, number>();
    productInfos.forEach(p => {
      const cat = p.category || 'unknown';
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    const dominantCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

    // 배치 전략 결정
    let placementStrategy = '인접 배치 권장';
    if (avgPrice > 100000) {
      placementStrategy = '프리미엄 존 인접 배치';
    } else if (productInfos.length > 4) {
      placementStrategy = '동일 구역 내 분산 배치';
    }

    result.push({
      clusterId: `cluster_${clusterId++}`,
      clusterName: `${dominantCategory} 연관 그룹`,
      products,
      productSkus: productInfos.map(p => p.sku || ''),
      characteristics: {
        avgPrice,
        dominantCategory,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0,
        },
        seasonality: 'all_season', // 추후 시즌 데이터 연동
      },
      placementStrategy,
    });
  }

  return result;
}

/**
 * 카테고리 친화도 계산
 */
function calculateCategoryAffinities(
  baskets: Map<string, Set<string>>,
  productMap: Map<string, ProductRow>,
  rules: AssociationRule[]
): CategoryAffinity[] {
  const categoryPairs = new Map<string, {
    count: number;
    totalLift: number;
    productPairs: Array<{ p1: string; p2: string; lift: number }>;
  }>();

  // 규칙에서 카테고리 쌍 집계
  for (const rule of rules) {
    const antCat = productMap.get(rule.antecedent[0])?.category || 'unknown';
    const conCat = productMap.get(rule.consequent[0])?.category || 'unknown';

    if (antCat === conCat) continue; // 동일 카테고리 제외

    const pairKey = [antCat, conCat].sort().join('|');

    if (!categoryPairs.has(pairKey)) {
      categoryPairs.set(pairKey, { count: 0, totalLift: 0, productPairs: [] });
    }

    const pair = categoryPairs.get(pairKey)!;
    pair.count += 1;
    pair.totalLift += rule.lift;
    pair.productPairs.push({
      p1: rule.antecedent[0],
      p2: rule.consequent[0],
      lift: rule.lift,
    });
  }

  // 장바구니에서 카테고리 동시 구매율 계산
  const categoryCoOccurrence = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const basket of baskets.values()) {
    const categories = new Set<string>();
    for (const productId of basket) {
      const cat = productMap.get(productId)?.category || 'unknown';
      categories.add(cat);
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    const catArray = Array.from(categories);
    for (let i = 0; i < catArray.length; i++) {
      for (let j = i + 1; j < catArray.length; j++) {
        const key = [catArray[i], catArray[j]].sort().join('|');
        categoryCoOccurrence.set(key, (categoryCoOccurrence.get(key) || 0) + 1);
      }
    }
  }

  // CategoryAffinity 객체 생성
  const affinities: CategoryAffinity[] = [];

  for (const [pairKey, pairData] of categoryPairs) {
    const [cat1, cat2] = pairKey.split('|');
    const coOccurrence = categoryCoOccurrence.get(pairKey) || 0;
    const totalBaskets = baskets.size;

    const commonPurchaseRate = totalBaskets > 0 ? coOccurrence / totalBaskets : 0;
    const avgLift = pairData.count > 0 ? pairData.totalLift / pairData.count : 1;

    // 친화도 점수 (lift와 동시구매율 조합)
    const affinityScore = Math.min(1, (avgLift - 1) / 3 + commonPurchaseRate);

    // 권장 근접성 결정
    let recommendedProximity: CategoryAffinity['recommendedProximity'] = 'any';
    if (affinityScore >= 0.7) {
      recommendedProximity = 'adjacent';
    } else if (affinityScore >= 0.5) {
      recommendedProximity = 'same_zone';
    } else if (affinityScore >= 0.3) {
      recommendedProximity = 'visible';
    }

    // 상위 상품 쌍
    const topPairs = pairData.productPairs
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 5)
      .map(pp => ({
        product1Id: pp.p1,
        product1Sku: productMap.get(pp.p1)?.sku || '',
        product2Id: pp.p2,
        product2Sku: productMap.get(pp.p2)?.sku || '',
        lift: pp.lift,
      }));

    affinities.push({
      category1: cat1,
      category2: cat2,
      affinityScore,
      commonPurchaseRate,
      avgLift,
      recommendedProximity,
      topProductPairs: topPairs,
    });
  }

  // 친화도 순 정렬
  affinities.sort((a, b) => b.affinityScore - a.affinityScore);

  return affinities;
}

/**
 * 배치 추천 생성
 */
function generatePlacementRecommendations(
  rules: AssociationRule[],
  clusters: ProductCluster[],
  affinities: CategoryAffinity[],
  productMap: Map<string, ProductRow>,
  placementMap: Map<string, string>
): PlacementRecommendation[] {
  const recommendations: PlacementRecommendation[] = [];
  let recId = 1;

  // 1. Very Strong 규칙 → Bundle 추천
  const veryStrongRules = rules.filter(r => r.ruleStrength === 'very_strong');
  for (const rule of veryStrongRules.slice(0, 5)) {
    const primaryProduct = productMap.get(rule.antecedent[0]);
    const secondaryProduct = productMap.get(rule.consequent[0]);

    if (!primaryProduct || !secondaryProduct) continue;

    const primaryZone = placementMap.get(rule.antecedent[0]) || 'unknown';
    const secondaryZone = placementMap.get(rule.consequent[0]) || 'unknown';

    recommendations.push({
      recommendationId: `rec_${recId++}`,
      type: 'bundle',
      priority: 'critical',
      primaryProduct: {
        id: rule.antecedent[0],
        sku: primaryProduct.sku || '',
        name: primaryProduct.product_name,
        category: primaryProduct.category || '',
        currentZone: primaryZone,
        price: primaryProduct.price || 0,
      },
      secondaryProducts: [{
        id: rule.consequent[0],
        sku: secondaryProduct.sku || '',
        name: secondaryProduct.product_name,
        category: secondaryProduct.category || '',
        currentZone: secondaryZone,
        price: secondaryProduct.price || 0,
      }],
      recommendedZone: primaryZone,
      expectedLift: rule.lift,
      confidence: rule.confidence,
      reason: `${(rule.confidence * 100).toFixed(0)}% 동시 구매율, ${rule.lift.toFixed(1)}x 향상도`,
      implementationGuide: '번들 디스플레이 설치, 세트 프로모션 가격 책정 권장',
    });
  }

  // 2. Strong 규칙 → Cross-sell 추천
  const strongRules = rules.filter(r => r.ruleStrength === 'strong');
  for (const rule of strongRules.slice(0, 5)) {
    const primaryProduct = productMap.get(rule.antecedent[0]);
    const secondaryProduct = productMap.get(rule.consequent[0]);

    if (!primaryProduct || !secondaryProduct) continue;

    const primaryZone = placementMap.get(rule.antecedent[0]) || 'unknown';
    const secondaryZone = placementMap.get(rule.consequent[0]) || 'unknown';

    // 이미 인접한 경우 스킵
    if (primaryZone === secondaryZone) continue;

    recommendations.push({
      recommendationId: `rec_${recId++}`,
      type: 'cross_sell',
      priority: 'high',
      primaryProduct: {
        id: rule.antecedent[0],
        sku: primaryProduct.sku || '',
        name: primaryProduct.product_name,
        category: primaryProduct.category || '',
        currentZone: primaryZone,
        price: primaryProduct.price || 0,
      },
      secondaryProducts: [{
        id: rule.consequent[0],
        sku: secondaryProduct.sku || '',
        name: secondaryProduct.product_name,
        category: secondaryProduct.category || '',
        currentZone: secondaryZone,
        price: secondaryProduct.price || 0,
      }],
      recommendedZone: primaryZone,
      expectedLift: rule.lift,
      confidence: rule.confidence,
      reason: `크로스셀 기회 - 현재 다른 구역에 배치됨`,
      implementationGuide: '연관 상품을 동일 구역 또는 인접 슬롯에 배치',
    });
  }

  // 3. 저가 상품 → Impulse 추천 (계산대 근처)
  const lowPriceProducts = Array.from(productMap.values())
    .filter(p => p.price && p.price < 30000 && p.price > 5000)
    .sort((a, b) => (a.price || 0) - (b.price || 0));

  // 저가 상품 중 연관 규칙에 등장하는 것 우선
  const impulseProducts = lowPriceProducts.filter(p =>
    rules.some(r => r.consequent.includes(p.id))
  ).slice(0, 3);

  for (const product of impulseProducts) {
    const currentZone = placementMap.get(product.id) || 'unknown';

    // 계산대 근처가 아닌 경우만 추천
    if (currentZone.toLowerCase().includes('checkout')) continue;

    recommendations.push({
      recommendationId: `rec_${recId++}`,
      type: 'impulse',
      priority: 'medium',
      primaryProduct: {
        id: product.id,
        sku: product.sku || '',
        name: product.product_name,
        category: product.category || '',
        currentZone,
        price: product.price || 0,
      },
      secondaryProducts: [],
      recommendedZone: 'checkout', // 계산대 구역
      expectedLift: 1.5,
      confidence: 0.6,
      reason: `저가 충동구매 유도 상품 - 연관 구매 빈도 높음`,
      implementationGuide: '계산대 또는 동선 마지막 구간에 배치',
    });
  }

  // 4. 고가 연관 → Upsell 추천
  const highValueRules = rules.filter(rule => {
    const antPrice = productMap.get(rule.antecedent[0])?.price || 0;
    const conPrice = productMap.get(rule.consequent[0])?.price || 0;
    return conPrice > antPrice * 1.5 && conPrice > 50000;
  });

  for (const rule of highValueRules.slice(0, 3)) {
    const primaryProduct = productMap.get(rule.antecedent[0]);
    const secondaryProduct = productMap.get(rule.consequent[0]);

    if (!primaryProduct || !secondaryProduct) continue;

    const primaryZone = placementMap.get(rule.antecedent[0]) || 'unknown';

    recommendations.push({
      recommendationId: `rec_${recId++}`,
      type: 'upsell',
      priority: 'high',
      primaryProduct: {
        id: rule.antecedent[0],
        sku: primaryProduct.sku || '',
        name: primaryProduct.product_name,
        category: primaryProduct.category || '',
        currentZone: primaryZone,
        price: primaryProduct.price || 0,
      },
      secondaryProducts: [{
        id: rule.consequent[0],
        sku: secondaryProduct.sku || '',
        name: secondaryProduct.product_name,
        category: secondaryProduct.category || '',
        currentZone: placementMap.get(rule.consequent[0]) || 'unknown',
        price: secondaryProduct.price || 0,
      }],
      recommendedZone: primaryZone,
      expectedLift: rule.lift,
      confidence: rule.confidence,
      reason: `업셀 기회 - 고가 상품으로 연결 가능`,
      implementationGuide: '기본 상품 옆에 프리미엄 옵션 배치, 비교 디스플레이 활용',
    });
  }

  return recommendations;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 데이터 품질 평가
 */
function evaluateDataQuality(
  transactionCount: number,
  lineItemCount: number,
  productCount: number
): ProductAssociationResult['summary']['dataQuality'] {
  if (transactionCount >= 1000 && lineItemCount >= 3000 && productCount >= 50) {
    return 'excellent';
  } else if (transactionCount >= 500 && lineItemCount >= 1000) {
    return 'good';
  } else if (transactionCount >= MIN_TRANSACTIONS_REQUIRED) {
    return 'fair';
  } else {
    return 'poor';
  }
}

/**
 * Fallback 결과 생성 (데이터 부족 시)
 */
function createFallbackResult(
  storeId: string,
  analysisDate: string,
  daysBack: number,
  products: ProductRow[],
  placements: ProductPlacementRow[],
  dataQuality: ProductAssociationResult['summary']['dataQuality']
): ProductAssociationResult {
  // 기본 카테고리 친화도 생성
  const categoryAffinities: CategoryAffinity[] = [];
  const categories = ['outerwear', 'tops', 'bottoms', 'accessory', 'bags', 'shoes'];

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];
      const affinityScore = DEFAULT_CATEGORY_AFFINITIES[cat1]?.[cat2] || 0.3;

      let recommendedProximity: CategoryAffinity['recommendedProximity'] = 'any';
      if (affinityScore >= 0.7) recommendedProximity = 'adjacent';
      else if (affinityScore >= 0.5) recommendedProximity = 'same_zone';
      else if (affinityScore >= 0.3) recommendedProximity = 'visible';

      categoryAffinities.push({
        category1: cat1,
        category2: cat2,
        affinityScore,
        commonPurchaseRate: 0,
        avgLift: 1 + affinityScore,
        recommendedProximity,
        topProductPairs: [],
      });
    }
  }

  categoryAffinities.sort((a, b) => b.affinityScore - a.affinityScore);

  const aiPromptContext = `=== 상품 연관 분석 ===

## 데이터 부족 경고
거래 데이터가 부족하여 실제 연관 규칙을 마이닝할 수 없습니다.
기본 카테고리 친화도를 사용합니다.

## 기본 카테고리 친화도
${categoryAffinities.slice(0, 5).map(a =>
  `- ${a.category1} + ${a.category2}: 친화도 ${(a.affinityScore * 100).toFixed(0)}% → ${a.recommendedProximity} 배치 권장`
).join('\n')}

## 권장사항
- 거래 데이터 수집 후 재분석 필요
- 현재는 업계 표준 카테고리 친화도 기반으로 배치 권장
`;

  return {
    storeId,
    analysisDate,
    analysisPeriodDays: daysBack,
    associationRules: [],
    productClusters: [],
    categoryAffinities,
    placementRecommendations: [],
    summary: {
      totalTransactions: 0,
      avgBasketSize: 0,
      totalRulesFound: 0,
      strongRulesCount: 0,
      veryStrongRulesCount: 0,
      topCategoryPair: 'tops+bottoms',
      dataQuality,
    },
    aiPromptContext,
  };
}

/**
 * AI 프롬프트 컨텍스트 생성
 */
function buildAIPromptContext(
  rules: AssociationRule[],
  affinities: CategoryAffinity[],
  recommendations: PlacementRecommendation[],
  summary: ProductAssociationResult['summary']
): string {
  const lines: string[] = [];

  lines.push('=== 상품 연관 분석 ===');
  lines.push('');

  // 요약
  lines.push('## 분석 요약');
  lines.push(`- 총 거래 수: ${summary.totalTransactions.toLocaleString()}건`);
  lines.push(`- 평균 장바구니 크기: ${summary.avgBasketSize.toFixed(1)}개`);
  lines.push(`- 발견된 규칙 수: ${summary.totalRulesFound}개`);
  lines.push(`- 강한 규칙 수: ${summary.strongRulesCount}개 (매우 강함: ${summary.veryStrongRulesCount}개)`);
  lines.push(`- 최상위 카테고리 쌍: ${summary.topCategoryPair}`);
  lines.push(`- 데이터 품질: ${summary.dataQuality}`);
  lines.push('');

  // 상위 연관 규칙
  if (rules.length > 0) {
    lines.push('## 상위 연관 규칙');
    for (const rule of rules.slice(0, 10)) {
      const arrow = `${rule.antecedentNames.join(', ')} → ${rule.consequentNames.join(', ')}`;
      lines.push(`- [${rule.ruleStrength.toUpperCase()}] ${arrow}`);
      lines.push(`  신뢰도: ${(rule.confidence * 100).toFixed(0)}%, 향상도: ${rule.lift.toFixed(1)}x, 동시구매: ${rule.metadata.coOccurrenceCount}회`);
    }
    lines.push('');
  }

  // 카테고리 친화도
  if (affinities.length > 0) {
    lines.push('## 카테고리 친화도');
    for (const aff of affinities.slice(0, 5)) {
      lines.push(`- ${aff.category1} + ${aff.category2}: 친화도 ${(aff.affinityScore * 100).toFixed(0)}%`);
      lines.push(`  평균 향상도: ${aff.avgLift.toFixed(1)}x, 권장 배치: ${aff.recommendedProximity}`);
    }
    lines.push('');
  }

  // 배치 추천
  if (recommendations.length > 0) {
    lines.push('## 배치 추천');
    for (const rec of recommendations.slice(0, 8)) {
      lines.push(`- [${rec.type.toUpperCase()}/${rec.priority}] ${rec.primaryProduct.name}`);
      if (rec.secondaryProducts.length > 0) {
        lines.push(`  연관: ${rec.secondaryProducts.map(p => p.name).join(', ')}`);
      }
      lines.push(`  사유: ${rec.reason}`);
      lines.push(`  실행: ${rec.implementationGuide}`);
    }
    lines.push('');
  }

  // 최적화 가이드라인
  lines.push('## 연관성 기반 최적화 가이드라인');
  if (summary.veryStrongRulesCount > 0) {
    lines.push('- 🔥 매우 강한 연관 규칙 발견 - 번들 디스플레이 우선 적용');
  }
  if (summary.strongRulesCount > 3) {
    lines.push('- 💡 다수의 강한 연관 규칙 - 크로스셀 배치 적극 활용');
  }
  if (affinities.some(a => a.recommendedProximity === 'adjacent')) {
    lines.push('- 📍 인접 배치 권장 카테고리 쌍 존재 - 구역 재배치 고려');
  }

  return lines.join('\n');
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * 특정 상품의 연관 상품 조회
 */
export function getRelatedProducts(
  productId: string,
  rules: AssociationRule[],
  topN: number = 5
): Array<{ productId: string; sku: string; name: string; lift: number; confidence: number }> {
  const related = rules
    .filter(r => r.antecedent.includes(productId))
    .flatMap(r => r.consequent.map((id, idx) => ({
      productId: id,
      sku: r.consequentSkus[idx],
      name: r.consequentNames[idx],
      lift: r.lift,
      confidence: r.confidence,
    })))
    .sort((a, b) => b.lift - a.lift);

  // 중복 제거
  const seen = new Set<string>();
  return related.filter(r => {
    if (seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  }).slice(0, topN);
}

/**
 * 카테고리 쌍의 친화도 조회
 */
export function getCategoryAffinity(
  category1: string,
  category2: string,
  affinities: CategoryAffinity[]
): CategoryAffinity | null {
  const key1 = [category1, category2].sort().join('|');

  for (const aff of affinities) {
    const key2 = [aff.category1, aff.category2].sort().join('|');
    if (key1 === key2) return aff;
  }

  return null;
}
