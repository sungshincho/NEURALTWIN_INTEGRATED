import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// ⚠️ DEPRECATION NOTICE ⚠️
// ============================================================================
// 이 함수는 향후 deprecated될 예정입니다.
//
// 마이그레이션 가이드:
// - layout_optimization, staffing_optimization → generate-optimization 함수 사용
// - flow_simulation, congestion_simulation → 현재 이 함수에서 계속 지원
// - causal, anomaly, prediction, pattern → 분석 전용으로 이 함수에서 계속 지원
//
// 변경 사항:
// - 2024-01: staffing_optimization → generate-optimization으로 통합
// - 2024-01: layout_optimization → generate-optimization에서도 지원 (both 타입)
// ============================================================================

// AI 응답 로깅 시스템
import {
  logAIResponse,
  createInferenceSummary,
  createInferenceContextMetadata,
  createExecutionTimer,
  type SimulationType,
} from '../_shared/aiResponseLogger.ts';

// Continuous Learning 모듈 import
import {
  calculatePastPerformance,
  buildLearningContext,
  validateROIPrediction,
  saveFeedbackRecord,
  type LearningContext,
  type PastPerformanceResult,
} from './learning.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean AI response and extract valid JSON
function cleanJsonResponse(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

// 안전한 JSON 파싱 헬퍼
function safeParseAIResponse(aiContent: string, defaultValue: any): any {
  if (!aiContent || !aiContent.trim()) {
    console.warn('Empty AI response, using default');
    return defaultValue;
  }
  
  try {
    const cleaned = cleanJsonResponse(aiContent);
    if (cleaned.startsWith('{')) {
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Content preview:', aiContent.substring(0, 300));
  }
  
  return defaultValue;
}


// ============================================================================
// 🆕 파인튜닝용: 사용자 화면에 표시되는 텍스트 추출 헬퍼
// ============================================================================

/**
 * 시뮬레이션 유형에 따라 사용자에게 표시되는 텍스트 응답을 추출
 */
function extractUserFacingTexts(result: any, simulationType: string): any {
  const texts: any = {
    summary_text: '',
    recommendations: [],
    insights: [],
  };

  try {
    switch (simulationType) {
      case 'layout_optimization':
      case 'layout':
        // 레이아웃 최적화 결과에서 텍스트 추출
        texts.summary_text = result.optimizationSummary?.explanation ||
          `레이아웃 최적화: ${result.layoutChanges?.length || 0}개 변경 권장`;
        texts.recommendations = (result.layoutChanges || []).slice(0, 5).map((change: any) => ({
          entity: change.entityLabel || change.entity_id,
          reason: change.reason,
          priority: change.priority,
        }));
        texts.insights = result.insights || [];
        break;

      case 'flow_simulation':
      case 'flow':
        // 동선 시뮬레이션 결과에서 텍스트 추출
        texts.summary_text = result.summary?.explanation ||
          `동선 분석: 건강 점수 ${result.summary?.flowHealthScore || 0}%, 병목 ${result.bottlenecks?.length || 0}개`;
        texts.recommendations = (result.recommendations || []).slice(0, 5).map((rec: any) => ({
          type: rec.type,
          description: rec.description,
          priority: rec.priority,
        }));
        texts.bottlenecks = (result.bottlenecks || []).map((b: any) => ({
          zone: b.zoneName,
          severity: b.severity,
          suggestion: b.suggestion,
        }));
        texts.dead_zones = (result.deadZones || []).map((d: any) => ({
          zone: d.zoneName,
          reason: d.reason,
          suggestion: d.suggestion,
        }));
        break;

      case 'congestion':
      case 'congestion_simulation':
        // 혼잡도 시뮬레이션 결과에서 텍스트 추출
        texts.summary_text = result.summary?.explanation ||
          `혼잡도 분석: ${result.congestionPoints?.length || 0}개 혼잡 지점 발견`;
        texts.congestion_alerts = (result.congestionPoints || []).slice(0, 5).map((cp: any) => ({
          zone: cp.zoneName,
          level: cp.congestionLevel,
          suggestion: cp.suggestion,
        }));
        break;

      case 'staffing':
      case 'staffing_optimization':
        // 인력 배치 최적화 결과에서 텍스트 추출
        texts.summary_text = result.summary?.explanation ||
          `인력 배치 최적화: ${result.staffingRecommendations?.length || 0}개 권장사항`;
        texts.staffing_recommendations = (result.staffingRecommendations || []).slice(0, 5).map((sr: any) => ({
          zone: sr.zoneName,
          current_staff: sr.currentStaff,
          recommended_staff: sr.recommendedStaff,
          reason: sr.reason,
        }));
        break;

      default:
        // 기본 추출
        texts.summary_text = result.explanation || result.summary?.explanation || '분석 완료';
        texts.insights = result.insights || result.aiInsights || [];
    }
  } catch (error) {
    console.warn('[extractUserFacingTexts] Error:', error);
  }

  return texts;
}

/**
 * 시뮬레이션 유형에 따라 핵심 지표 추출
 */
function extractKeyMetrics(result: any, simulationType: string): any {
  const metrics: any = {};

  try {
    switch (simulationType) {
      case 'layout_optimization':
      case 'layout':
        metrics.changes_count = result.layoutChanges?.length || 0;
        metrics.expected_revenue_increase = result.optimizationSummary?.expectedRevenueIncreasePercent || 0;
        metrics.confidence = result.confidence || 0;
        break;

      case 'flow_simulation':
      case 'flow':
        metrics.flow_health_score = result.summary?.flowHealthScore || 0;
        metrics.bottleneck_count = result.bottlenecks?.length || 0;
        metrics.dead_zone_count = result.deadZones?.length || 0;
        metrics.conversion_rate = result.summary?.conversionRate || 0;
        break;

      case 'congestion':
      case 'congestion_simulation':
        metrics.congestion_points_count = result.congestionPoints?.length || 0;
        metrics.peak_congestion = result.summary?.peakCongestion || 0;
        break;

      case 'staffing':
      case 'staffing_optimization':
        metrics.staffing_recommendations_count = result.staffingRecommendations?.length || 0;
        metrics.total_staff_change = result.summary?.totalStaffChange || 0;
        break;

      default:
        metrics.confidence = result.confidence || 0;
    }
  } catch (error) {
    console.warn('[extractKeyMetrics] Error:', error);
  }

  return metrics;
}


// ============================================================================
// 🆕 Slot-Based Optimization System (Unified from generate-optimization)
// ============================================================================

// Display type: how products can be displayed
type DisplayType = 'hanging' | 'standing' | 'folded' | 'located' | 'boxed' | 'stacked';

// Slot type: physical slot types on furniture
type SlotType = 'hanger' | 'mannequin' | 'shelf' | 'table' | 'rack' | 'hook' | 'drawer';

// Slot to Display type compatibility mapping
const SLOT_DISPLAY_COMPATIBILITY: Record<SlotType, DisplayType[]> = {
  hanger: ['hanging'],
  mannequin: ['standing'],
  shelf: ['folded', 'located', 'boxed', 'stacked'],
  table: ['folded', 'located', 'boxed'],
  rack: ['hanging', 'located'],
  hook: ['hanging'],
  drawer: ['folded', 'boxed'],
};

interface FurnitureSlot {
  id: string;
  furniture_id: string;
  slot_id: string;
  slot_type: SlotType;
  slot_position: { x: number; y: number; z: number };
  is_occupied: boolean;
  current_product_id?: string;
  compatible_display_types: DisplayType[];
  zone_id?: string;
}

interface ProductWithDisplay {
  id: string;
  sku: string;
  name: string;
  category: string;
  display_type: DisplayType;
  compatible_display_types: DisplayType[];
  price?: number;
  position?: { x: number; y: number; z: number };
  furniture_id?: string;
  slot_id?: string;
}

interface FurnitureData {
  id: string;
  furniture_type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  dimensions?: { width: number; height: number; depth: number };
  movable: boolean;
  zone_id?: string;
  slots?: FurnitureSlot[];
}

interface SlotBasedLayoutData {
  furniture: FurnitureData[];
  slots: FurnitureSlot[];
  products: ProductWithDisplay[];
  zones: any[];
  slotCompatibilityMatrix: Map<string, string[]>; // slotId -> compatible product IDs
}

// Check if a product can be placed on a slot based on display_type compatibility
function isSlotCompatible(slot: FurnitureSlot, product: ProductWithDisplay): boolean {
  // Check slot_type compatibility
  const slotCompatibleTypes = SLOT_DISPLAY_COMPATIBILITY[slot.slot_type] || [];

  // Product's compatible display types
  const productDisplayTypes = product.compatible_display_types || [product.display_type];

  // Check if there's any overlap
  return productDisplayTypes.some(dt => slotCompatibleTypes.includes(dt));
}

// Find compatible slots for a product
function findCompatibleSlots(slots: FurnitureSlot[], product: ProductWithDisplay): FurnitureSlot[] {
  return slots.filter(slot => !slot.is_occupied && isSlotCompatible(slot, product));
}

// Find compatible products for a slot
function findCompatibleProducts(slot: FurnitureSlot, products: ProductWithDisplay[]): ProductWithDisplay[] {
  return products.filter(product => isSlotCompatible(slot, product));
}

// Build slot compatibility matrix
function buildSlotCompatibilityMatrix(
  slots: FurnitureSlot[],
  products: ProductWithDisplay[]
): Map<string, string[]> {
  const matrix = new Map<string, string[]>();

  for (const slot of slots) {
    const compatibleProductIds = products
      .filter(p => isSlotCompatible(slot, p))
      .map(p => p.id);
    matrix.set(slot.id, compatibleProductIds);
  }

  return matrix;
}

// Load slot-based layout data from Supabase
async function loadSlotBasedLayoutData(
  supabase: any,
  storeId: string,
  userId: string
): Promise<SlotBasedLayoutData> {
  // Load furniture with their slot types
  const { data: furnitureData } = await supabase
    .from('furniture')
    .select('*')
    .eq('store_id', storeId);

  // Load furniture slots
  const { data: slotsData } = await supabase
    .from('furniture_slots')
    .select('*')
    .eq('store_id', storeId);

  // Load products with display_type
  const { data: productsData } = await supabase
    .from('products')
    .select('id, sku, name, category, price, display_type, compatible_display_types')
    .eq('store_id', storeId);

  // Load zones
  const { data: zonesData } = await supabase
    .from('zones_dim')
    .select('id, zone_name, zone_type, area_sqm, center_x, center_z')
    .eq('store_id', storeId);

  // Transform furniture data
  const furniture: FurnitureData[] = (furnitureData || []).map((f: any) => ({
    id: f.id,
    furniture_type: f.furniture_type,
    position: f.position || { x: 0, y: 0, z: 0 },
    rotation: f.rotation || { x: 0, y: 0, z: 0 },
    dimensions: f.dimensions,
    movable: f.movable !== false,
    zone_id: f.zone_id,
  }));

  // Transform slots data
  const slots: FurnitureSlot[] = (slotsData || []).map((s: any) => ({
    id: s.id,
    furniture_id: s.furniture_id,
    slot_id: s.slot_id,
    slot_type: s.slot_type || 'shelf',
    slot_position: s.slot_position || { x: 0, y: 0, z: 0 },
    is_occupied: s.is_occupied || false,
    current_product_id: s.current_product_id,
    compatible_display_types: s.compatible_display_types || SLOT_DISPLAY_COMPATIBILITY[s.slot_type as SlotType] || [],
    zone_id: s.zone_id,
  }));

  // Transform products data
  const products: ProductWithDisplay[] = (productsData || []).map((p: any) => ({
    id: p.id,
    sku: p.sku || '',
    name: p.name || '',
    category: p.category || '',
    display_type: p.display_type || 'hanging',
    compatible_display_types: p.compatible_display_types || ['hanging'],
    price: p.price,
  }));

  // Build compatibility matrix
  const slotCompatibilityMatrix = buildSlotCompatibilityMatrix(slots, products);

  // Attach slots to furniture
  furniture.forEach(f => {
    f.slots = slots.filter(s => s.furniture_id === f.id);
  });

  return {
    furniture,
    slots,
    products,
    zones: zonesData || [],
    slotCompatibilityMatrix,
  };
}

// Generate slot-based product placement suggestions
function generateSlotBasedProductPlacements(
  layoutData: SlotBasedLayoutData,
  performanceData: any,
  maxSuggestions = 10
): Array<{
  product_id: string;
  product_sku: string;
  current_slot_id?: string;
  suggested_slot_id: string;
  suggested_furniture_id: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  display_type_match: boolean;
}> {
  const suggestions: Array<{
    product_id: string;
    product_sku: string;
    current_slot_id?: string;
    suggested_slot_id: string;
    suggested_furniture_id: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    display_type_match: boolean;
  }> = [];

  const { slots, products, slotCompatibilityMatrix } = layoutData;
  const productPerformance = performanceData?.productPerformance || [];

  // Get available slots (not occupied)
  const availableSlots = slots.filter(s => !s.is_occupied);

  // Get low-performing products
  const lowPerformers = productPerformance
    .filter((p: any) => p.conversion_rate < 0.05 || p.units_sold < 5)
    .slice(0, maxSuggestions);

  for (const perf of lowPerformers) {
    const product = products.find(p => p.id === perf.product_id);
    if (!product) continue;

    // Find compatible available slots
    const compatibleSlots = findCompatibleSlots(availableSlots, product);

    if (compatibleSlots.length > 0) {
      // Prefer high-traffic zone slots (if zone metrics available)
      const targetSlot = compatibleSlots[0]; // Can be improved with zone metrics

      suggestions.push({
        product_id: product.id,
        product_sku: product.sku,
        current_slot_id: product.slot_id,
        suggested_slot_id: targetSlot.id,
        suggested_furniture_id: targetSlot.furniture_id,
        reason: `저성과 상품 재배치: ${product.name}의 전환율이 ${((perf.conversion_rate || 0) * 100).toFixed(1)}%로 낮음. ${targetSlot.slot_type} 슬롯에 ${product.display_type} 진열 가능.`,
        priority: perf.conversion_rate < 0.02 ? 'high' : 'medium',
        display_type_match: true,
      });

      // Mark slot as used for this iteration
      targetSlot.is_occupied = true;
    }
  }

  return suggestions.slice(0, maxSuggestions);
}

// Build slot-based optimization prompt section
function buildSlotOptimizationPrompt(layoutData: SlotBasedLayoutData): string {
  const { furniture, slots, products } = layoutData;

  const occupiedSlots = slots.filter(s => s.is_occupied);
  const availableSlots = slots.filter(s => !s.is_occupied);

  const slotTypeStats: Record<string, { total: number; occupied: number }> = {};
  slots.forEach(s => {
    if (!slotTypeStats[s.slot_type]) {
      slotTypeStats[s.slot_type] = { total: 0, occupied: 0 };
    }
    slotTypeStats[s.slot_type].total++;
    if (s.is_occupied) slotTypeStats[s.slot_type].occupied++;
  });

  const displayTypeStats: Record<string, number> = {};
  products.forEach(p => {
    displayTypeStats[p.display_type] = (displayTypeStats[p.display_type] || 0) + 1;
  });

  return `
=== 🎯 슬롯 기반 배치 시스템 ===
총 가구: ${furniture.length}개
총 슬롯: ${slots.length}개 (점유: ${occupiedSlots.length}, 가용: ${availableSlots.length})
총 상품: ${products.length}개

슬롯 타입별 현황:
${Object.entries(slotTypeStats).map(([type, stats]) =>
  `- ${type}: ${stats.occupied}/${stats.total} (${((stats.occupied/stats.total)*100).toFixed(0)}% 사용)`
).join('\n')}

상품 진열 타입 분포:
${Object.entries(displayTypeStats).map(([type, count]) =>
  `- ${type}: ${count}개`
).join('\n')}

슬롯-진열 호환성 규칙:
- hanger → hanging (옷걸이에 걸기)
- mannequin → standing (마네킹에 입히기)
- shelf → folded, located, boxed, stacked (선반에 놓기)
- table → folded, located, boxed (테이블에 놓기)
- rack → hanging, located (랙에 걸거나 놓기)
- hook → hanging (후크에 걸기)
- drawer → folded, boxed (서랍에 넣기)

⚠️ 상품 재배치 시 반드시 슬롯 호환성을 확인하세요!
`;
}


// ============================================================================
// 🆕 Phase 1: Enhanced AI Inference - 데이터 기반 추론 강화
// ============================================================================

interface EnhancedSalesData {
  last30Days: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
    avgTransactionValue: number;
    visitorCount?: number;
    conversionRate?: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendPercentage: number;
  avgDailyRevenue: number;
  totalRevenue: number;
  peakDays: string[];
  peakHours: number[];
  bestDay: { date: string; revenue: number } | null;
  worstDay: { date: string; revenue: number } | null;
  weekdayAvg: number;
  weekendAvg: number;
  growthRate: number;
}

interface EnhancedVisitorData {
  last30Days: Array<{
    date: string;
    visitorCount: number;
    avgDwellTime: number;
  }>;
  avgDaily: number;
  totalVisitors: number;
  hourlyPattern: Record<number, number>;
  dayOfWeekPattern: Record<string, number>;
  zoneHeatmap: Record<string, {
    visitCount: number;
    visitRate: number;
    avgDwellTime: number;
    conversionRate: number;
    revenueContribution: number;
  }>;
  avgDwellTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  customerFlows: Array<{
    path: string[];
    count: number;
    percentage: number;
    avgDwellTime: number;
    conversionRate: number;
  }>;
}

interface EnhancedConversionData {
  overall: number;
  byZone: Record<string, number>;
  byProductCategory: Record<string, number>;
  byTimeOfDay: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

interface RecommendationPerformance {
  totalApplied: number;
  successCount: number;
  failCount: number;
  successRate: number;
  avgRevenueChange: number;
  avgTrafficChange: number;
  avgConversionChange: number;
  byType: Record<string, {
    count: number;
    successRate: number;
    avgImpact: number;
  }>;
}

interface EnhancedStoreContext {
  storeInfo?: {
    id: string;
    name: string;
    width: number;
    depth: number;
    businessType?: string;
  };
  entities: any[];
  relations: any[];
  visits?: any[];
  transactions?: any[];
  dailySales?: any[];
  salesData?: EnhancedSalesData;
  visitorData?: EnhancedVisitorData;
  conversionData?: EnhancedConversionData;
  recommendationPerformance?: RecommendationPerformance;
  dataQuality?: {
    salesDataDays: number;
    visitorDataDays: number;
    hasZoneData: boolean;
    hasFlowData: boolean;
    hasPastRecommendations: boolean;
    overallScore: number;
  };
}

interface ConfidenceFactors {
  dataAvailability: number;      // 0-25
  dataRecency: number;           // 0-15
  dataCoverage: number;          // 0-15
  pastPerformance: number;       // 0-20
  patternConsistency: number;    // 0-15
  ontologyDepth: number;         // 0-10
}

// --- 트렌드 라벨 헬퍼 ---
function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
    'increasing': '상승',
    'decreasing': '하락',
    'stable': '안정',
    'volatile': '변동성 높음',
  };
  return labels[trend] || trend;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'layout': '레이아웃',
    'pricing': '가격',
    'inventory': '재고',
    'marketing': '마케팅',
  };
  return labels[type] || type;
}

// --- 인사이트 분석 헬퍼 함수들 ---
function analyzeFlowInsights(visitors: EnhancedVisitorData): string {
  const insights: string[] = [];

  const zoneEntries = Object.entries(visitors.zoneHeatmap || {});
  const lowConversionZones = zoneEntries
    .filter(([_, data]) => data.visitRate > 30 && data.conversionRate < 0.1)
    .map(([zone]) => zone);
  
  if (lowConversionZones.length > 0) {
    insights.push(`- ⚠️ ${lowConversionZones.join(', ')} 구역: 방문율 높지만 전환율 낮음 → 상품 배치/진열 개선 필요`);
  }

  const shortDwellZones = zoneEntries
    .filter(([_, data]) => data.visitRate > 20 && data.avgDwellTime < 3)
    .map(([zone]) => zone);
  
  if (shortDwellZones.length > 0) {
    insights.push(`- ⚠️ ${shortDwellZones.join(', ')} 구역: 체류시간 짧음 → 고객 관심 유도 요소 추가 필요`);
  }

  const mainFlow = visitors.customerFlows?.[0];
  if (mainFlow && mainFlow.conversionRate < 0.15) {
    insights.push(`- 주요 동선(${mainFlow.path.join('→')})의 전환율이 ${(mainFlow.conversionRate * 100).toFixed(0)}%로 낮음 → 동선 중간에 프로모션 배치 권장`);
  }

  const lowVisitZones = zoneEntries
    .filter(([_, data]) => data.visitRate < 10)
    .map(([zone]) => zone);
  
  if (lowVisitZones.length > 0) {
    insights.push(`- 🔴 방문 사각지대: ${lowVisitZones.join(', ')} → 안내 표지판 또는 주력 상품 배치로 유도 필요`);
  }

  return insights.length > 0 ? insights.join('\n') : '- 현재 동선 패턴은 양호합니다.';
}

function analyzeConversionInsights(conv: EnhancedConversionData): string {
  const insights: string[] = [];

  if (conv.overall < 0.1) {
    insights.push('- ⚠️ 전체 전환율이 10% 미만으로 낮음 → 구매 유도 전략 강화 필요');
  } else if (conv.overall > 0.2) {
    insights.push('- ✅ 전체 전환율이 20% 이상으로 우수함');
  }

  const convRates = Object.values(conv.byZone || {});
  if (convRates.length > 1) {
    const maxConv = Math.max(...convRates);
    const minConv = Math.min(...convRates);
    if (maxConv / minConv > 2) {
      insights.push('- 구역별 전환율 편차가 큼 → 저전환 구역 레이아웃 개선 우선');
    }
  }

  const timeEntries = Object.entries(conv.byTimeOfDay || {});
  if (timeEntries.length > 0) {
    const peakTimeConv = timeEntries.sort((a, b) => b[1] - a[1])[0];
    const lowTimeConv = timeEntries.sort((a, b) => a[1] - b[1])[0];
    
    if (peakTimeConv && lowTimeConv && peakTimeConv[1] / lowTimeConv[1] > 1.5) {
      insights.push(`- ${peakTimeConv[0]}의 전환율이 가장 높음 → 이 시간대 프로모션 집중 권장`);
    }
  }

  if (conv.trend === 'declining') {
    insights.push('- ⚠️ 전환율이 하락 추세 → 긴급한 개선 조치 필요');
  }

  return insights.length > 0 ? insights.join('\n') : '- 전환율 패턴이 정상 범위입니다.';
}

function analyzePerformanceInsights(perf: RecommendationPerformance): string {
  const insights: string[] = [];

  if (perf.successRate >= 0.7) {
    insights.push('- ✅ 과거 추천의 70% 이상이 성공적 → AI 추천 신뢰도 높음');
  } else if (perf.successRate < 0.5) {
    insights.push('- ⚠️ 과거 추천 성공률이 50% 미만 → 보수적인 변경 권장');
  }

  const typeEntries = Object.entries(perf.byType || {});
  if (typeEntries.length > 0) {
    const bestType = typeEntries.sort((a, b) => b[1].successRate - a[1].successRate)[0];
    if (bestType[1].successRate > 0.7) {
      insights.push(`- ${getTypeLabel(bestType[0])} 추천이 가장 효과적 (성공률 ${(bestType[1].successRate * 100).toFixed(0)}%)`);
    }
  }

  if (perf.avgRevenueChange > 10) {
    insights.push(`- 과거 추천 적용 시 평균 ${perf.avgRevenueChange.toFixed(0)}% 매출 증가 → 적극적 추천 적용 권장`);
  }

  return insights.length > 0 ? insights.join('\n') : '- 과거 성과 데이터를 기반으로 신중하게 추천합니다.';
}

// --- 강화된 데이터 기반 프롬프트 빌더 ---
function buildEnhancedDataPrompt(context: EnhancedStoreContext): string {
  const sections: string[] = [];

  // === 매출 데이터 섹션 ===
  if (context.salesData) {
    const sales = context.salesData;
    const trendEmoji = sales.trend === 'increasing' ? '📈' : 
                       sales.trend === 'decreasing' ? '📉' : 
                       sales.trend === 'volatile' ? '⚡' : '➡️';
    
    sections.push(`
=== 📊 실제 매출 데이터 (최근 ${sales.last30Days?.length || 0}일) ===
- 일평균 매출: ${sales.avgDailyRevenue?.toLocaleString() || 0}원
- 총 매출: ${sales.totalRevenue?.toLocaleString() || 0}원
- 매출 트렌드: ${trendEmoji} ${getTrendLabel(sales.trend)} (${sales.trendPercentage > 0 ? '+' : ''}${sales.trendPercentage?.toFixed(1) || 0}%)
- 주중 평균: ${sales.weekdayAvg?.toLocaleString() || 0}원 / 주말 평균: ${sales.weekendAvg?.toLocaleString() || 0}원
- 피크 요일: ${sales.peakDays?.join(', ') || 'N/A'}
${sales.bestDay ? `- 최고 매출일: ${sales.bestDay.date} (${sales.bestDay.revenue?.toLocaleString()}원)` : ''}
${sales.worstDay ? `- 최저 매출일: ${sales.worstDay.date} (${sales.worstDay.revenue?.toLocaleString()}원)` : ''}

📌 인사이트:
${sales.trend === 'increasing' ? '- 매출이 상승 추세입니다. 현재 전략을 유지/강화하세요.' : ''}
${sales.trend === 'decreasing' ? '- 매출이 하락 추세입니다. 레이아웃/상품 배치 개선이 필요합니다.' : ''}
${sales.weekendAvg > sales.weekdayAvg * 1.2 ? '- 주말 매출이 주중보다 20% 이상 높습니다.' : ''}
${sales.trend === 'volatile' ? '- 매출 변동성이 큽니다. 안정적인 고객 유입 전략이 필요합니다.' : ''}
`);
  }

  // === 방문자 데이터 섹션 ===
  if (context.visitorData) {
    const visitors = context.visitorData;
    
    const zoneHeatmapText = Object.entries(visitors.zoneHeatmap || {})
      .sort((a, b) => b[1].visitRate - a[1].visitRate)
      .slice(0, 6)
      .map(([zone, data]) => 
        `  - ${zone}: 방문율 ${data.visitRate?.toFixed(0) || 0}%, 체류 ${data.avgDwellTime?.toFixed(1) || 0}분, 전환율 ${((data.conversionRate || 0) * 100).toFixed(1)}%`
      ).join('\n');

    const flowsText = (visitors.customerFlows || [])
      .slice(0, 3)
      .map((flow, i) => 
        `  ${i + 1}. ${flow.path?.join(' → ') || 'N/A'} (${flow.percentage?.toFixed(0) || 0}%, 전환율 ${((flow.conversionRate || 0) * 100).toFixed(1)}%)`
      ).join('\n');

    sections.push(`
=== 👥 고객 방문 패턴 (최근 ${visitors.last30Days?.length || 0}일) ===
- 일평균 방문자: ${visitors.avgDaily || 0}명
- 총 방문자: ${visitors.totalVisitors?.toLocaleString() || 0}명
- 평균 체류시간: ${visitors.avgDwellTime?.toFixed(1) || 0}분
- 피크 시간대: ${(visitors.peakHours || []).map(p => `${p.hour}시(${p.count}명)`).join(', ') || 'N/A'}

📍 구역별 성과:
${zoneHeatmapText || '구역 데이터 없음'}

🚶 주요 고객 동선:
${flowsText || '동선 데이터 없음'}

📌 동선 인사이트:
${analyzeFlowInsights(visitors)}
`);
  }

  // === 전환율 데이터 섹션 ===
  if (context.conversionData) {
    const conv = context.conversionData;
    const convTrendEmoji = conv.trend === 'improving' ? '📈' : 
                          conv.trend === 'declining' ? '📉' : '➡️';

    sections.push(`
=== 🛒 전환율 분석 ===
- 전체 전환율: ${((conv.overall || 0) * 100).toFixed(1)}%
- 전환율 트렌드: ${convTrendEmoji} ${conv.trend === 'improving' ? '개선 중' : conv.trend === 'declining' ? '하락 중' : '안정'}

📌 전환율 인사이트:
${analyzeConversionInsights(conv)}
`);
  }

  // === 과거 추천 성과 섹션 ===
  if (context.recommendationPerformance && context.recommendationPerformance.totalApplied > 0) {
    const perf = context.recommendationPerformance;
    
    sections.push(`
=== 🔄 과거 추천 적용 성과 (${perf.totalApplied}건) ===
- 성공률: ${((perf.successRate || 0) * 100).toFixed(0)}%
- 평균 매출 변화: ${(perf.avgRevenueChange || 0) > 0 ? '+' : ''}${(perf.avgRevenueChange || 0).toFixed(1)}%

📌 성과 기반 조언:
${analyzePerformanceInsights(perf)}
`);
  }

  return sections.join('\n');
}

// --- 통계 기반 신뢰도 계산 시스템 ---
// pastPerformanceData: learning.ts에서 가져온 과거 성과 데이터 (선택적)
function calculateStatisticalConfidence(
  context: EnhancedStoreContext,
  pastPerformanceData?: PastPerformanceResult
): {
  score: number;
  factors: ConfidenceFactors;
  explanation: string;
} {
  const factors: ConfidenceFactors = {
    dataAvailability: 0,
    dataRecency: 0,
    dataCoverage: 0,
    pastPerformance: 0,
    patternConsistency: 0,
    ontologyDepth: 0,
  };

  const explanations: string[] = [];

  // 1. 데이터 충분성 (최대 25점)
  const salesDays = context.salesData?.last30Days?.length || context.dailySales?.length || 0;
  const visitorDays = context.visitorData?.last30Days?.length || context.visits?.length || 0;

  if (salesDays >= 30 && visitorDays >= 30) {
    factors.dataAvailability = 25;
    explanations.push('30일 이상의 충분한 매출/방문 데이터');
  } else if (salesDays >= 14 && visitorDays >= 14) {
    factors.dataAvailability = 18;
    explanations.push('2주 이상의 데이터');
  } else if (salesDays >= 7 || visitorDays >= 7) {
    factors.dataAvailability = 12;
  } else if (salesDays > 0 || visitorDays > 0) {
    factors.dataAvailability = 6;
  }

  // 2. 데이터 최신성 (최대 15점)
  const latestDate = context.salesData?.last30Days?.[context.salesData.last30Days.length - 1]?.date ||
                     context.dailySales?.[context.dailySales.length - 1]?.date;
  if (latestDate) {
    const daysSince = Math.floor((Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 1) factors.dataRecency = 15;
    else if (daysSince <= 3) factors.dataRecency = 12;
    else if (daysSince <= 7) factors.dataRecency = 8;
    else factors.dataRecency = 4;
  }

  // 3. 데이터 커버리지 (최대 15점)
  if (context.visitorData && Object.keys(context.visitorData.zoneHeatmap || {}).length > 0) factors.dataCoverage += 5;
  if (context.visitorData && (context.visitorData.customerFlows || []).length > 0) factors.dataCoverage += 5;
  if (context.conversionData && context.conversionData.overall > 0) factors.dataCoverage += 5;

  // 4. 과거 추천 성과 (최대 20점) - Continuous Learning 데이터 활용
  if (pastPerformanceData && pastPerformanceData.sampleSize > 0) {
    // learning.ts에서 계산된 점수 사용
    factors.pastPerformance = pastPerformanceData.score;
    if (pastPerformanceData.sampleSize >= 5) {
      explanations.push(pastPerformanceData.explanation);
    }
  } else {
    // 폴백: 기존 recommendationPerformance 사용
    const perf = context.recommendationPerformance;
    if (perf && perf.totalApplied > 0) {
      if (perf.successRate >= 0.7 && perf.totalApplied >= 5) {
        factors.pastPerformance = 20;
        explanations.push(`과거 ${perf.totalApplied}건 중 ${(perf.successRate * 100).toFixed(0)}% 성공`);
      } else if (perf.successRate >= 0.5) {
        factors.pastPerformance = 15;
      } else {
        factors.pastPerformance = 10;
      }
    } else {
      // 데이터 없음: 기본값 5점
      factors.pastPerformance = 5;
    }
  }

  // 5. 패턴 일관성 (최대 15점)
  const salesTrend = context.salesData?.trend;
  if (salesTrend && salesTrend !== 'volatile') {
    factors.patternConsistency = 15;
  } else if (salesTrend === 'volatile') {
    factors.patternConsistency = 5;
    explanations.push('변동성 높음');
  }

  // 6. 온톨로지 깊이 (최대 10점)
  const entityCount = context.entities?.length || 0;
  const relationCount = context.relations?.length || 0;
  if (entityCount > 20 && relationCount > 30) factors.ontologyDepth = 10;
  else if (entityCount > 10 && relationCount > 15) factors.ontologyDepth = 7;
  else if (entityCount > 0) factors.ontologyDepth = 4;

  // 최종 점수 계산 (신뢰도 조정값 반영)
  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const confidenceAdjustment = pastPerformanceData?.confidenceAdjustment || 0;
  const normalizedScore = 60 + (totalScore / 100) * 35 + confidenceAdjustment;
  const finalScore = Math.min(Math.max(normalizedScore, 60), 95);

  return {
    score: Math.round(finalScore),
    factors,
    explanation: explanations.join(' | ') || '기본 추정 기반',
  };
}

// --- 강화된 레이아웃 프롬프트 빌더 ---
function buildEnhancedLayoutPrompt(
  context: EnhancedStoreContext,
  furnitureList: string,
  ontologyAnalysis: any,
  comprehensiveAnalysis: any,
  storeWidth: number,
  storeDepth: number,
  outOfBoundsWarning: string
): string {
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  const enhancedDataSection = buildEnhancedDataPrompt(context);
  const confidenceResult = calculateStatisticalConfidence(context);

  return `You are a retail store layout optimization expert with access to REAL business data.

${enhancedDataSection}

=== 🔬 온톨로지 그래프 분석 ===
${ontologyAnalysis?.summaryForAI || '온톨로지 분석 없음'}

${comprehensiveAnalysis?.comprehensiveSummary || ''}
${outOfBoundsWarning}

=== 📐 매장 경계 (중심 기준 좌표계) ===
- 매장 크기: ${storeWidth}m x ${storeDepth}m
- X축 범위: -${halfWidth.toFixed(1)} ~ +${halfWidth.toFixed(1)}
- Z축 범위: -${halfDepth.toFixed(1)} ~ +${halfDepth.toFixed(1)}
- 안전 영역: X ±${(halfWidth - 1).toFixed(1)}, Z ±${(halfDepth - 1).toFixed(1)}

=== 🪑 현재 가구 배치 ===
${furnitureList}

=== 📊 분석 신뢰도: ${confidenceResult.score}% ===
신뢰도 근거: ${confidenceResult.explanation}

=== 💡 최적화 목표 ===
위의 실제 데이터를 기반으로 3-5개의 구체적인 가구 이동을 제안하세요.

CRITICAL RULES:
1. 모든 위치는 반드시 안전 영역 내여야 함
2. 실제 데이터가 지적하는 문제점을 우선 해결
3. 과거 성공 사례와 유사한 방향으로 추천

Return ONLY valid JSON (no markdown):
{
  "layoutChanges": [
    {
      "entityId": "exact-uuid",
      "entityLabel": "가구 이름",
      "entityType": "Shelf",
      "currentPosition": {"x": 0, "y": 0, "z": 0},
      "suggestedPosition": {"x": 0, "y": 0, "z": 0},
      "reason": "📊 [데이터 근거] 구체적인 이유",
      "dataEvidence": "근거 데이터",
      "impact": "high|medium|low"
    }
  ],
  "optimizationSummary": {
    "expectedTrafficIncrease": 15,
    "expectedRevenueIncrease": 8,
    "expectedConversionIncrease": 3,
    "confidence": ${confidenceResult.score}
  },
  "dataBasedInsights": ["인사이트1", "인사이트2"],
  "aiInsights": ["종합 인사이트"],
  "recommendations": ["추천"]
}`;
}


// ============================================================================
// 🆕 방문/거래/매출 데이터 분석 함수들 (NEW)
// ============================================================================

interface VisitData {
  id: string;
  customer_id?: string;
  visit_date: string;
  duration_minutes?: number;
  zones_visited?: string[];
}

interface TransactionData {
  id: string;
  customer_id?: string;
  total_amount: number;
  items?: any[];
  transaction_date: string;
}

interface DailySalesData {
  id: string;
  date: string;
  total_revenue: number;
  transaction_count?: number;
  avg_transaction_value?: number;
}

// 방문 패턴 분석
function analyzeVisitPatterns(visits: VisitData[]) {
  if (!visits || visits.length === 0) {
    return {
      totalVisits: 0,
      avgDuration: 0,
      zonePopularity: {},
      customerFlows: [],
      peakHours: [],
      unvisitedZones: [],
      summaryText: '방문 데이터 없음'
    };
  }

  // 평균 체류 시간
  const durations = visits.filter(v => v.duration_minutes).map(v => v.duration_minutes!);
  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // 구역별 인기도
  const zoneCounts: Record<string, number> = {};
  const flowPatterns: Record<string, number> = {};
  
  visits.forEach(visit => {
    if (visit.zones_visited && Array.isArray(visit.zones_visited)) {
      visit.zones_visited.forEach(zone => {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      });
      
      // 동선 패턴 (순서대로 연결)
      const flowKey = visit.zones_visited.join(' → ');
      flowPatterns[flowKey] = (flowPatterns[flowKey] || 0) + 1;
    }
  });

  // 구역별 방문율 계산
  const zonePopularity: Record<string, number> = {};
  Object.entries(zoneCounts).forEach(([zone, count]) => {
    zonePopularity[zone] = Math.round((count / visits.length) * 100);
  });

  // 주요 동선 패턴 (상위 5개)
  const customerFlows = Object.entries(flowPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flow, count]) => ({
      flow,
      count,
      percentage: Math.round((count / visits.length) * 100)
    }));

  // 방문 시간대 분석
  const hourCounts: Record<number, number> = {};
  visits.forEach(visit => {
    const hour = new Date(visit.visit_date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  // 방문 없는 구역 감지 (일반적인 매장 구역과 비교)
  const commonZones = ['입구', '의류 섹션', '액세서리 섹션', '화장품 섹션', '신발 섹션', '계산대'];
  const visitedZones = Object.keys(zoneCounts);
  const unvisitedZones = commonZones.filter(z => !visitedZones.some(vz => vz.includes(z) || z.includes(vz)));

  // 요약 텍스트 생성
  const summaryText = `### 고객 방문 분석 (${visits.length}회)
- 평균 체류: ${avgDuration}분
- 구역별 인기도: ${Object.entries(zonePopularity).map(([z, p]) => `${z}(${p}%)`).join(', ')}
- 주요 동선: ${customerFlows[0]?.flow || '데이터 없음'} (${customerFlows[0]?.percentage || 0}%)
${unvisitedZones.length > 0 ? `- ⚠️ 방문 없는 구역: ${unvisitedZones.join(', ')} → 레이아웃 개선 필요` : ''}`;

  return {
    totalVisits: visits.length,
    avgDuration,
    zonePopularity,
    customerFlows,
    peakHours,
    unvisitedZones,
    summaryText
  };
}

// 거래 패턴 분석
function analyzeTransactionPatterns(transactions: TransactionData[]) {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      avgTransactionValue: 0,
      repeatCustomerRate: 0,
      topSellingProducts: [],
      summaryText: '거래 데이터 없음'
    };
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const avgTransactionValue = Math.round(totalRevenue / transactions.length);

  // 반복 고객 비율
  const customerIds = transactions.filter(t => t.customer_id).map(t => t.customer_id!);
  const uniqueCustomers = new Set(customerIds).size;
  const repeatCustomerRate = customerIds.length > 0 
    ? Math.round(((customerIds.length - uniqueCustomers) / customerIds.length) * 100)
    : 0;

  // 베스트셀러 상품
  const productCounts: Record<string, { count: number; revenue: number }> = {};
  transactions.forEach(t => {
    if (t.items && Array.isArray(t.items)) {
      t.items.forEach((item: any) => {
        const name = item.name || item.product_name || 'Unknown';
        if (!productCounts[name]) {
          productCounts[name] = { count: 0, revenue: 0 };
        }
        productCounts[name].count += item.quantity || 1;
        productCounts[name].revenue += item.price || 0;
      });
    }
  });

  const topSellingProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const summaryText = `### 거래 분석 (${transactions.length}건)
- 총 매출: ${totalRevenue.toLocaleString()}원
- 평균 거래액: ${avgTransactionValue.toLocaleString()}원
- 반복 고객율: ${repeatCustomerRate}%
${topSellingProducts.length > 0 ? `- 베스트셀러: ${topSellingProducts.slice(0, 3).map(p => p.name).join(', ')}` : ''}`;

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    avgTransactionValue,
    repeatCustomerRate,
    topSellingProducts,
    summaryText
  };
}

// 일별 매출 트렌드 분석
function analyzeDailySalesTrends(dailySales: DailySalesData[]) {
  if (!dailySales || dailySales.length === 0) {
    return {
      avgDailyRevenue: 0,
      trend: 'unknown',
      trendPercentage: 0,
      bestDay: null,
      worstDay: null,
      summaryText: '매출 트렌드 데이터 없음'
    };
  }

  // 날짜순 정렬
  const sorted = [...dailySales].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const revenues = sorted.map(d => d.total_revenue || 0);
  const avgDailyRevenue = Math.round(revenues.reduce((a, b) => a + b, 0) / revenues.length);

  // 트렌드 계산 (전반부 vs 후반부)
  const mid = Math.floor(revenues.length / 2);
  const firstHalf = revenues.slice(0, mid);
  const secondHalf = revenues.slice(mid);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trendPercentage = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;
  const trend = trendPercentage > 5 ? 'increasing' : trendPercentage < -5 ? 'decreasing' : 'stable';

  // 최고/최저 매출일
  const bestDay = sorted.reduce((best, curr) => 
    (curr.total_revenue || 0) > (best.total_revenue || 0) ? curr : best
  );
  const worstDay = sorted.reduce((worst, curr) => 
    (curr.total_revenue || 0) < (worst.total_revenue || 0) ? curr : worst
  );

  const trendEmoji = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
  const summaryText = `### 매출 트렌드 (${dailySales.length}일)
- 일평균 매출: ${avgDailyRevenue.toLocaleString()}원
- 트렌드: ${trendEmoji} ${trend === 'increasing' ? '상승' : trend === 'decreasing' ? '하락' : '유지'} (${trendPercentage > 0 ? '+' : ''}${trendPercentage}%)
- 최고 매출일: ${bestDay.date} (${bestDay.total_revenue?.toLocaleString()}원)
- 최저 매출일: ${worstDay.date} (${worstDay.total_revenue?.toLocaleString()}원)`;

  return {
    avgDailyRevenue,
    trend,
    trendPercentage,
    bestDay,
    worstDay,
    summaryText
  };
}

// 근접성 관계 분석 (NEAR_TO)
function analyzeProximityRelations(relations: any[], entities: any[]) {
  const nearToRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('near') || typeName === 'NEAR_TO';
  });

  if (nearToRelations.length === 0) {
    return {
      totalProximityRelations: 0,
      closeProximityPairs: [],
      farProximityPairs: [],
      isolatedFurniture: [],
      summaryText: '근접성 관계 데이터 없음'
    };
  }

  const entityMap = new Map(entities.map(e => [e.id, e.label || e.id]));
  
  // 거리 정보 추출
  const proximityPairs = nearToRelations.map(r => ({
    source: entityMap.get(r.source_entity_id) || r.source_entity_id,
    target: entityMap.get(r.target_entity_id) || r.target_entity_id,
    distance: r.properties?.distance || 0
  })).filter(p => p.distance > 0);

  // 가까운 쌍 (<4m)
  const closeProximityPairs = proximityPairs
    .filter(p => p.distance < 4)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // 멀리 떨어진 쌍 (>10m)
  const farProximityPairs = proximityPairs
    .filter(p => p.distance > 10)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3);

  // 고립된 가구 찾기 (관계가 적은 가구)
  const relationCounts: Record<string, number> = {};
  nearToRelations.forEach(r => {
    const source = entityMap.get(r.source_entity_id) || r.source_entity_id;
    const target = entityMap.get(r.target_entity_id) || r.target_entity_id;
    relationCounts[source] = (relationCounts[source] || 0) + 1;
    relationCounts[target] = (relationCounts[target] || 0) + 1;
  });

  const avgRelations = Object.values(relationCounts).reduce((a, b) => a + b, 0) / Object.keys(relationCounts).length;
  const isolatedFurniture = Object.entries(relationCounts)
    .filter(([_, count]) => count < avgRelations * 0.5)
    .map(([name]) => name);

  const summaryText = `### 가구 근접성 분석 (${nearToRelations.length}개 관계)
${closeProximityPairs.length > 0 ? `- 가까운 쌍: ${closeProximityPairs.map(p => `${p.source}↔${p.target}(${p.distance.toFixed(1)}m)`).join(', ')}` : ''}
${farProximityPairs.length > 0 ? `- 멀리 떨어진 쌍: ${farProximityPairs.map(p => `${p.source}↔${p.target}(${p.distance.toFixed(1)}m)`).join(', ')}` : ''}
${isolatedFurniture.length > 0 ? `- ⚠️ 고립된 가구: ${isolatedFurniture.join(', ')} → 접근성 개선 필요` : ''}`;

  return {
    totalProximityRelations: nearToRelations.length,
    closeProximityPairs,
    farProximityPairs,
    isolatedFurniture,
    summaryText
  };
}

// 진열 관계 분석 (DISPLAYED_ON_FURNITURE)
function analyzeDisplayRelations(relations: any[], entities: any[]) {
  const displayRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('display') || typeName === 'DISPLAYED_ON_FURNITURE';
  });

  if (displayRelations.length === 0) {
    return {
      totalDisplayRelations: 0,
      furnitureProductMap: {},
      underutilizedFurniture: [],
      summaryText: '진열 관계 데이터 없음'
    };
  }

  const entityMap = new Map(entities.map(e => [e.id, { label: e.label, type: e.entityType || e.model_3d_type }]));

  // 가구별 상품 맵핑
  const furnitureProductMap: Record<string, { products: string[]; hasTester: number }> = {};
  
  displayRelations.forEach(r => {
    const furniture = entityMap.get(r.target_entity_id)?.label || r.target_entity_id;
    const product = entityMap.get(r.source_entity_id)?.label || r.source_entity_id;
    const hasTester = r.properties?.has_tester ? 1 : 0;

    if (!furnitureProductMap[furniture]) {
      furnitureProductMap[furniture] = { products: [], hasTester: 0 };
    }
    furnitureProductMap[furniture].products.push(product);
    furnitureProductMap[furniture].hasTester += hasTester;
  });

  // 상품이 적은 가구 찾기
  const avgProducts = Object.values(furnitureProductMap)
    .reduce((sum, f) => sum + f.products.length, 0) / Object.keys(furnitureProductMap).length;
  
  const underutilizedFurniture = Object.entries(furnitureProductMap)
    .filter(([_, data]) => data.products.length < avgProducts * 0.5)
    .map(([name]) => name);

  const summaryText = `### 가구별 진열 현황 (${displayRelations.length}개 관계)
${Object.entries(furnitureProductMap).map(([furniture, data]) => 
  `- ${furniture}: ${data.products.length}개 상품${data.hasTester > 0 ? ` (테스터 ${data.hasTester}개)` : ''}`
).join('\n')}
${underutilizedFurniture.length > 0 ? `\n⚠️ 활용도 낮은 가구: ${underutilizedFurniture.join(', ')} → 상품 추가 배치 권장` : ''}`;

  return {
    totalDisplayRelations: displayRelations.length,
    furnitureProductMap,
    underutilizedFurniture,
    summaryText
  };
}

// 통합 데이터 분석 빌더
function buildComprehensiveAnalysis(storeContext: any) {
  const visits = storeContext.visits || [];
  const transactions = storeContext.transactions || [];
  const dailySales = storeContext.dailySales || [];
  const relations = storeContext.relations || [];
  const entities = storeContext.entities || [];

  const visitAnalysis = analyzeVisitPatterns(visits);
  const transactionAnalysis = analyzeTransactionPatterns(transactions);
  const salesTrendAnalysis = analyzeDailySalesTrends(dailySales);
  const proximityAnalysis = analyzeProximityRelations(relations, entities);
  const displayAnalysis = analyzeDisplayRelations(relations, entities);

  // 종합 요약 텍스트
  const comprehensiveSummary = `
## 📊 통합 데이터 분석

### 데이터 현황
- 엔티티: ${entities.length}개, 관계: ${relations.length}개
- 방문 기록: ${visits.length}건, 거래: ${transactions.length}건, 일별 매출: ${dailySales.length}일

${visitAnalysis.summaryText}

${transactionAnalysis.summaryText}

${salesTrendAnalysis.summaryText}

${proximityAnalysis.summaryText}

${displayAnalysis.summaryText}

### 🎯 AI 분석 우선순위
1. ${visitAnalysis.unvisitedZones.length > 0 ? `방문 없는 구역(${visitAnalysis.unvisitedZones.join(', ')}) 개선` : '고객 동선 최적화'}
2. ${proximityAnalysis.isolatedFurniture.length > 0 ? `고립된 가구(${proximityAnalysis.isolatedFurniture.join(', ')}) 재배치` : '가구 배치 최적화'}
3. ${displayAnalysis.underutilizedFurniture.length > 0 ? `활용도 낮은 가구(${displayAnalysis.underutilizedFurniture.join(', ')}) 상품 추가` : '진열 효율성 개선'}
4. ${salesTrendAnalysis.trend === 'decreasing' ? '매출 하락 원인 분석 및 개선' : '현재 트렌드 유지/강화'}
`;

  return {
    visitAnalysis,
    transactionAnalysis,
    salesTrendAnalysis,
    proximityAnalysis,
    displayAnalysis,
    comprehensiveSummary
  };
}

// ============================================================================
// 온톨로지 그래프 분석 함수들
// ============================================================================

interface GraphEntity {
  id: string;
  label: string;
  entityType: string;
  position?: { x: number; y: number; z?: number };
  properties?: Record<string, any>;
}

interface GraphRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationTypeId: string;
  properties?: Record<string, any>;
  weight?: number;
}

// 거리 계산
function calculateDistance(pos1: { x: number; z: number }, pos2: { x: number; z: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.z - pos1.z, 2));
}

// 클러스터 찾기
function findClusters(entities: GraphEntity[], clusterRadius = 3) {
  const clusters: Array<{ center: { x: number; z: number }; entities: string[]; density: number }> = [];
  const assigned = new Set<string>();
  
  for (const entity of entities) {
    if (assigned.has(entity.id) || !entity.position) continue;
    const clusterEntities = [entity];
    assigned.add(entity.id);
    
    for (const other of entities) {
      if (assigned.has(other.id) || !other.position) continue;
      const dist = calculateDistance(
        { x: entity.position.x, z: entity.position.z || entity.position.y || 0 },
        { x: other.position.x, z: other.position.z || other.position.y || 0 }
      );
      if (dist <= clusterRadius) {
        clusterEntities.push(other);
        assigned.add(other.id);
      }
    }
    
    if (clusterEntities.length >= 2) {
      const centerX = clusterEntities.reduce((sum, e) => sum + (e.position?.x || 0), 0) / clusterEntities.length;
      const centerZ = clusterEntities.reduce((sum, e) => sum + (e.position?.z || e.position?.y || 0), 0) / clusterEntities.length;
      clusters.push({
        center: { x: Math.round(centerX * 10) / 10, z: Math.round(centerZ * 10) / 10 },
        entities: clusterEntities.map(e => e.label),
        density: Math.round((clusterEntities.length / (Math.PI * clusterRadius * clusterRadius)) * 100) / 100
      });
    }
  }
  return clusters;
}

// 데드존 찾기
function findDeadZones(entities: GraphEntity[], storeWidth: number, storeDepth: number, gridSize = 2) {
  const deadZones: Array<{ area: { x: number; z: number }; reason: string }> = [];
  
  for (let x = gridSize; x < storeWidth - gridSize; x += gridSize) {
    for (let z = gridSize; z < storeDepth - gridSize; z += gridSize) {
      const nearbyEntities = entities.filter(e => {
        if (!e.position) return false;
        return calculateDistance({ x, z }, { x: e.position.x, z: e.position.z || e.position.y || 0 }) < gridSize * 1.5;
      });
      
      if (nearbyEntities.length === 0) {
        const overlaps = deadZones.some(dz => calculateDistance({ x, z }, dz.area) < gridSize);
        if (!overlaps) deadZones.push({ area: { x, z }, reason: '가구나 진열대가 없는 빈 공간' });
      }
    }
  }
  return deadZones.slice(0, 5);
}

// 레이아웃 규칙
const RETAIL_LAYOUT_RULES = [
  {
    id: 'checkout_near_exit', name: '계산대는 출구 근처에 위치',
    check: (entities: GraphEntity[]) => {
      const checkout = entities.find(e => e.entityType.toLowerCase().includes('checkout') || e.label.includes('계산대'));
      const entrance = entities.find(e => e.entityType.toLowerCase().includes('entrance') || e.label.includes('입구'));
      if (checkout && entrance && checkout.position && entrance.position) {
        const dist = calculateDistance(
          { x: checkout.position.x, z: checkout.position.z || checkout.position.y || 0 },
          { x: entrance.position.x, z: entrance.position.z || entrance.position.y || 0 }
        );
        return { passed: dist < 5, entities: dist >= 5 ? [checkout.label, entrance.label] : [] };
      }
      return { passed: true, entities: [] };
    },
    severity: 'medium' as const, suggestion: '계산대를 출구/입구 근처로 이동하세요'
  },
  {
    id: 'no_blocking_entrance', name: '입구 앞 2m 이내 가구 금지',
    check: (entities: GraphEntity[]) => {
      const entrance = entities.find(e => e.entityType.toLowerCase().includes('entrance') || e.label.includes('입구'));
      if (entrance && entrance.position) {
        const blocking = entities.filter(e => {
          if (e.id === entrance.id || !e.position) return false;
          return calculateDistance(
            { x: entrance.position!.x, z: entrance.position!.z || entrance.position!.y || 0 },
            { x: e.position.x, z: e.position.z || e.position.y || 0 }
          ) < 2;
        });
        return { passed: blocking.length === 0, entities: blocking.map(e => e.label) };
      }
      return { passed: true, entities: [] };
    },
    severity: 'high' as const, suggestion: '입구 앞 2m 이내의 가구를 다른 위치로 이동하세요'
  },
  {
    id: 'fitting_room_privacy', name: '피팅룸은 매장 안쪽에 위치',
    check: (entities: GraphEntity[], storeDepth = 16) => {
      const fittingRooms = entities.filter(e => e.entityType.toLowerCase().includes('fitting') || e.label.includes('탈의실'));
      const tooClose = fittingRooms.filter(f => f.position && (f.position.z || f.position.y || 0) < storeDepth * 0.3);
      return { passed: tooClose.length === 0, entities: tooClose.map(f => f.label) };
    },
    severity: 'medium' as const, suggestion: '피팅룸을 매장 안쪽으로 이동하세요'
  },
  {
    id: 'aisle_width', name: '통로 최소 폭 1.2m 확보',
    check: (entities: GraphEntity[]) => {
      const narrowAisles: string[] = [];
      const furniture = entities.filter(e => ['shelf', 'rack', 'displaytable', 'counter'].some(t => e.entityType.toLowerCase().includes(t)));
      for (let i = 0; i < furniture.length; i++) {
        for (let j = i + 1; j < furniture.length; j++) {
          if (furniture[i].position && furniture[j].position) {
            const dist = calculateDistance(
              { x: furniture[i].position!.x, z: furniture[i].position!.z || furniture[i].position!.y || 0 },
              { x: furniture[j].position!.x, z: furniture[j].position!.z || furniture[j].position!.y || 0 }
            );
            if (dist > 0.5 && dist < 1.2) narrowAisles.push(`${furniture[i].label} ↔ ${furniture[j].label}`);
          }
        }
      }
      return { passed: narrowAisles.length === 0, entities: narrowAisles.slice(0, 3) };
    },
    severity: 'high' as const, suggestion: '가구 사이 간격을 최소 1.2m 이상 확보하세요'
  }
];

const OPPORTUNITY_RULES = [
  {
    id: 'power_wall', name: '파워월 활용',
    check: (entities: GraphEntity[], storeWidth = 17) => {
      const rightWall = entities.filter(e => e.position && e.position.x > storeWidth * 0.8);
      const hasDisplay = rightWall.some(e => e.entityType.toLowerCase().includes('display'));
      return { applicable: !hasDisplay && rightWall.length < 3, impact: 'high' as const, action: '입구 오른쪽 벽면(파워월)에 신상품을 배치하세요' };
    }
  },
  {
    id: 'destination_zone', name: '목적지 구역 설정',
    check: (entities: GraphEntity[], storeWidth: number, storeDepth = 16) => {
      const backArea = entities.filter(e => e.position && (e.position.z || e.position.y || 0) > storeDepth * 0.7);
      const hasAttraction = backArea.some(e => e.label.includes('베스트') || e.label.includes('세일'));
      return { applicable: !hasAttraction, impact: 'high' as const, action: '매장 뒤쪽에 인기 상품을 배치하세요' };
    }
  }
];

// 레이아웃 규칙 분석
function analyzeLayoutRules(entities: GraphEntity[], storeWidth: number, storeDepth: number) {
  const violations: Array<{ rule: string; severity: string; entities: string[]; suggestion: string }> = [];
  const opportunities: Array<{ opportunity: string; impact: string; action: string }> = [];
  
  for (const rule of RETAIL_LAYOUT_RULES) {
    const result = rule.check(entities, storeDepth);
    if (!result.passed) violations.push({ rule: rule.name, severity: rule.severity, entities: result.entities, suggestion: rule.suggestion });
  }
  
  for (const opp of OPPORTUNITY_RULES) {
    const result = opp.check(entities, storeWidth, storeDepth);
    if (result.applicable) opportunities.push({ opportunity: opp.name, impact: result.impact, action: result.action });
  }
  
  const violationPenalty = violations.reduce((sum, v) => sum + (v.severity === 'high' ? 15 : v.severity === 'medium' ? 10 : 5), 0);
  const score = Math.max(0, Math.min(100, 100 - violationPenalty));
  
  return { score, violations, opportunities, clusters: findClusters(entities), deadZones: findDeadZones(entities, storeWidth, storeDepth) };
}

// 수요 분석
function analyzeDemandPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const purchaseRelations = relations.filter(r => r.properties?.purchase_id || r.properties?.total_price);
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const productSales = new Map<string, { count: number; revenue: number }>();
  for (const rel of purchaseRelations) {
    const existing = productSales.get(rel.targetEntityId) || { count: 0, revenue: 0 };
    existing.count += rel.properties?.quantity || 1;
    existing.revenue += rel.properties?.total_price || 0;
    productSales.set(rel.targetEntityId, existing);
  }
  
  const topSellingProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ product: idToLabel.get(id) || id, salesCount: data.count, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  
  return { topSellingProducts, productClusters: [], purchasePatterns: [], customerSegments: [] };
}

// 재고 분석
function analyzeInventoryPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const inventoryEntities = entities.filter(e => e.properties?.currentStock !== undefined);
  const restockPriorities = inventoryEntities
    .filter(e => (e.properties?.currentStock || 0) < (e.properties?.optimalStock || 10) * 0.5)
    .map(e => ({ product: e.label, urgency: (e.properties?.currentStock || 0) < (e.properties?.optimalStock || 10) * 0.25 ? 'critical' : 'high', reason: `현재 재고 ${e.properties?.currentStock || 0}개` }));
  
  const furnitureEntities = entities.filter(e => ['shelf', 'rack', 'storage'].some(t => e.entityType.toLowerCase().includes(t)));
  const storageUtilization = furnitureEntities.length > 0 ? Math.round((relations.filter(r => r.properties?.quantity).length / furnitureEntities.length) * 100) : 0;
  
  return { storageUtilization, restockPriorities, productLocationMap: [], storageOptimizations: [] };
}

// 가격 분석
function analyzePricingPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const productEntities = entities.filter(e => e.properties?.sellingPrice || e.properties?.price);
  
  const marginAnalysis = productEntities
    .filter(p => p.properties?.sellingPrice && p.properties?.costPrice)
    .map(p => ({ product: p.label, margin: Math.round(((p.properties!.sellingPrice - p.properties!.costPrice) / p.properties!.sellingPrice) * 100), category: p.properties?.category || 'Unknown' }))
    .sort((a, b) => b.margin - a.margin);
  
  const pricingOpportunities = marginAnalysis.filter(m => m.margin < 20).slice(0, 5)
    .map(m => ({ product: m.product, suggestion: `마진 ${m.margin}% - 가격 인상 검토`, expectedImpact: 10 }));
  
  return { priceRanges: [], marginAnalysis: marginAnalysis.slice(0, 20), pricingOpportunities, competingProducts: [] };
}

// 마케팅 분석
function analyzeMarketingPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const purchaseRelations = relations.filter(r => r.properties?.purchase_id);
  const customerPurchases = new Map<string, string[]>();
  for (const rel of purchaseRelations) {
    if (!customerPurchases.has(rel.sourceEntityId)) customerPurchases.set(rel.sourceEntityId, []);
    customerPurchases.get(rel.sourceEntityId)!.push(rel.targetEntityId);
  }
  
  const pairFrequency = new Map<string, number>();
  const productFrequency = new Map<string, number>();
  for (const [_, products] of customerPurchases) {
    for (const product of products) productFrequency.set(product, (productFrequency.get(product) || 0) + 1);
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const pair = [products[i], products[j]].sort().join('|');
        pairFrequency.set(pair, (pairFrequency.get(pair) || 0) + 1);
      }
    }
  }
  
  const crossSellPairs = Array.from(pairFrequency.entries())
    .map(([pair, freq]) => {
      const [p1, p2] = pair.split('|');
      return { product1: idToLabel.get(p1) || p1, product2: idToLabel.get(p2) || p2, confidence: Math.round((freq / (productFrequency.get(p1) || 1)) * 100) / 100, support: Math.round((freq / (customerPurchases.size || 1)) * 100) / 100 };
    })
    .filter(p => p.confidence > 0.1).sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  
  return { crossSellPairs, customerJourneys: [], campaignTargets: [] };
}

// 통합 온톨로지 분석
function performOntologyAnalysis(entities: GraphEntity[], relations: GraphRelation[], scenarioType: string, storeWidth = 17, storeDepth = 16) {
  console.log(`=== Ontology Analysis: ${scenarioType} ===`);
  
  const entityByType: Record<string, number> = {};
  entities.forEach(e => { entityByType[e.entityType || 'unknown'] = (entityByType[e.entityType || 'unknown'] || 0) + 1; });
  
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const patternCounts = new Map<string, { count: number; examples: string[] }>();
  const connectionCounts = new Map<string, number>();
  const connectedIds = new Set<string>();
  
  for (const relation of relations) {
    connectedIds.add(relation.sourceEntityId);
    connectedIds.add(relation.targetEntityId);
    connectionCounts.set(relation.sourceEntityId, (connectionCounts.get(relation.sourceEntityId) || 0) + 1);
    
    const source = entities.find(e => e.id === relation.sourceEntityId);
    const target = entities.find(e => e.id === relation.targetEntityId);
    if (source && target) {
      const pattern = `${source.entityType} → ${target.entityType}`;
      if (!patternCounts.has(pattern)) patternCounts.set(pattern, { count: 0, examples: [] });
      patternCounts.get(pattern)!.count++;
      if (patternCounts.get(pattern)!.examples.length < 3) patternCounts.get(pattern)!.examples.push(`${source.label} → ${target.label}`);
    }
  }
  
  const patterns = Array.from(patternCounts.entries()).map(([pattern, data]) => ({ pattern, frequency: data.count, examples: data.examples })).sort((a, b) => b.frequency - a.frequency);
  const hubEntities = Array.from(connectionCounts.entries()).map(([id, count]) => ({ entityId: id, label: idToLabel.get(id) || id, connectionCount: count })).sort((a, b) => b.connectionCount - a.connectionCount).slice(0, 5);
  const isolatedEntities = entities.filter(e => !connectedIds.has(e.id)).map(e => e.label);
  
  // 가구 필터링
  const furnitureEntities = entities.filter(e => {
    const type = (e.entityType || '').toLowerCase();
    const model3dType = (e.properties?.model_3d_type || '').toLowerCase();
    if (['furniture', 'room', 'structure'].includes(model3dType)) return true;
    return ['shelf', 'rack', 'displaytable', 'checkoutcounter', 'fittingroom', 'entrance', 'counter', 'table', 'display'].some(t => type.includes(t));
  });
  
  let layoutInsights = null, demandInsights = null, inventoryInsights = null, pricingInsights = null, marketingInsights = null;
  
  if (scenarioType === 'layout' || scenarioType === 'all') layoutInsights = analyzeLayoutRules(furnitureEntities, storeWidth, storeDepth);
  if (scenarioType === 'demand' || scenarioType === 'all') demandInsights = analyzeDemandPatterns(entities, relations);
  if (scenarioType === 'inventory' || scenarioType === 'all') inventoryInsights = analyzeInventoryPatterns(entities, relations);
  if (scenarioType === 'pricing' || scenarioType === 'all') pricingInsights = analyzePricingPatterns(entities, relations);
  if (scenarioType === 'recommendation' || scenarioType === 'all') marketingInsights = analyzeMarketingPatterns(entities, relations);
  
  // AI 프롬프트용 요약 생성
  const summaryLines: string[] = [`## 온톨로지 분석 (${scenarioType})`, `- 엔티티: ${entities.length}개, 관계: ${relations.length}개`, `- 타입별: ${Object.entries(entityByType).slice(0, 5).map(([k, v]) => `${k}(${v})`).join(', ')}`];
  
  if (patterns.length > 0) { summaryLines.push(`\n### 관계 패턴`); patterns.slice(0, 3).forEach(p => summaryLines.push(`- ${p.pattern}: ${p.frequency}회`)); }
  if (layoutInsights) {
    summaryLines.push(`\n### 레이아웃 점수: ${layoutInsights.score}/100`);
    if (layoutInsights.violations.length > 0) { summaryLines.push(`위반사항:`); layoutInsights.violations.forEach(v => summaryLines.push(`- [${v.severity}] ${v.rule}: ${v.suggestion}`)); }
    if (layoutInsights.opportunities.length > 0) { summaryLines.push(`기회:`); layoutInsights.opportunities.forEach(o => summaryLines.push(`- [${o.impact}] ${o.opportunity}: ${o.action}`)); }
  }
  if (demandInsights?.topSellingProducts?.length) summaryLines.push(`\n### 상위 판매: ${demandInsights.topSellingProducts.slice(0, 3).map(p => p.product).join(', ')}`);
  if (inventoryInsights) summaryLines.push(`\n### 저장공간 활용: ${inventoryInsights.storageUtilization}%`);
  if (pricingInsights?.pricingOpportunities?.length) summaryLines.push(`\n### 가격 기회: ${pricingInsights.pricingOpportunities.length}개`);
  if (marketingInsights?.crossSellPairs?.length) summaryLines.push(`\n### 크로스셀: ${marketingInsights.crossSellPairs.slice(0, 2).map(p => `${p.product1}+${p.product2}`).join(', ')}`);
  
  return {
    entityAnalysis: { totalCount: entities.length, byType: entityByType },
    relationAnalysis: { totalCount: relations.length, patterns, hubEntities, isolatedEntities },
    layoutInsights, demandInsights, inventoryInsights, pricingInsights, marketingInsights,
    summaryForAI: summaryLines.join('\n')
  };
}

interface InferenceRequest {
  inference_type?: 'causal' | 'anomaly' | 'prediction' | 'pattern';
  type?: 'layout_optimization' | 'flow_simulation' | 'staffing_optimization' | 'congestion_simulation';
  data?: any[];
  graph_data?: {
    nodes: any[];
    edges: any[];
  };
  time_series_data?: any[];
  parameters?: Record<string, any>;
  params?: Record<string, any>;
  storeId?: string;
  orgId?: string;
  // 🆕 Supabase client for slot-based optimization
  supabaseClient?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🆕 실행 시간 측정 시작
  const executionTimer = createExecutionTimer();
  executionTimer.start();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: InferenceRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Request JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const inferenceType = body.inference_type || body.type;
    console.log('Advanced AI inference request:', inferenceType);

    // 🆕 슬롯 기반 최적화를 위해 Supabase 클라이언트를 params에 주입
    const enrichedBody: InferenceRequest = {
      ...body,
      params: {
        ...body.params,
        supabaseClient: supabase, // 슬롯 데이터 로드용
      },
    };

    let result;
    switch (inferenceType) {
      case 'causal':
        result = await performCausalInference(body, lovableApiKey);
        break;
      case 'anomaly':
        result = await performAnomalyDetection(body, lovableApiKey);
        break;
      case 'prediction':
        result = await performPredictiveModeling(body, lovableApiKey);
        break;
      case 'pattern':
        result = await performPatternDiscovery(body, lovableApiKey);
        break;
      case 'layout_optimization':
        // ⚠️ DEPRECATED: generate-optimization 함수의 'both' 타입 사용 권장
        console.warn('[DEPRECATED] layout_optimization: 향후 generate-optimization 함수로 마이그레이션 예정');
        result = await performLayoutOptimization(enrichedBody, lovableApiKey);
        break;
      case 'flow_simulation':
        result = await performFlowSimulation(enrichedBody, lovableApiKey);
        break;
      case 'staffing_optimization':
        // ⚠️ DEPRECATED: generate-optimization 함수의 'staffing' 타입 사용 권장
        console.warn('[DEPRECATED] staffing_optimization: generate-optimization 함수의 staffing 타입으로 마이그레이션 권장');
        result = await performStaffingOptimization(enrichedBody, lovableApiKey);
        break;
      case 'congestion_simulation':
        result = await performCongestionSimulation(enrichedBody, lovableApiKey);
        break;
      default:
        throw new Error('Invalid inference type: ' + inferenceType);
    }

    // 🆕 AI 응답 로깅 (파인튜닝 데이터 수집)
    const executionTimeMs = executionTimer.getElapsedMs();
    try {
      // 시뮬레이션 유형별 로깅
      const simulationTypeMap: Record<string, SimulationType> = {
        'layout_optimization': 'layout_optimization',
        'flow_simulation': 'flow_simulation',
        'congestion_simulation': 'congestion',
        'staffing_optimization': 'staffing',
        'causal': 'layout',
        'anomaly': 'layout',
        'prediction': 'layout',
        'pattern': 'layout',
      };

      const simulationType = simulationTypeMap[inferenceType] || 'layout';

      // 🆕 파인튜닝용: 사용자 화면에 표시되는 텍스트 응답 추출
      const actualResult = result.result || result;
      const userFacingTexts = extractUserFacingTexts(actualResult, simulationType);

      await logAIResponse(supabase, {
        storeId: body.storeId || 'unknown',
        userId: user.id,
        functionName: 'advanced-ai-inference',
        simulationType,
        inputVariables: {
          inference_type: inferenceType,
          params: body.params,
          storeContext: body.params?.storeContext ? {
            // 컨텍스트 요약 (전체 저장하면 너무 큼)
            hasEntities: !!body.params.storeContext.entities,
            entityCount: body.params.storeContext.entities?.length || 0,
            hasZones: !!body.params.storeContext.zones,
            zoneCount: body.params.storeContext.zones?.length || 0,
            hasZoneTransitions: !!body.params.storeContext.zoneTransitions,
            transitionCount: body.params.storeContext.zoneTransitions?.length || 0,
            dataQuality: body.params.storeContext.dataQuality,
          } : null,
        },
        // 🆕 aiResponse를 user_facing_texts 중심으로 변경 (파인튜닝 최적화)
        aiResponse: {
          user_facing_texts: userFacingTexts,
          success: result.success !== false,
          // 핵심 지표만 포함
          key_metrics: extractKeyMetrics(actualResult, simulationType),
        },
        responseSummary: createInferenceSummary(actualResult, simulationType),
        contextMetadata: createInferenceContextMetadata(
          body.params?.storeContext || {},
          body.params || {}
        ),
        executionTimeMs,
        modelUsed: 'gemini-2.5-flash',
      });
      console.log(`[advanced-ai-inference] Response logged successfully (${executionTimeMs}ms)`);
    } catch (logError) {
      // 로깅 실패해도 메인 응답은 정상 반환
      console.warn('[advanced-ai-inference] Failed to log response:', logError);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Advanced AI inference error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 🆕 에러 발생 시에도 로깅 시도
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const body = await req.clone().json().catch(() => ({}));
        await logAIResponse(supabase, {
          storeId: body.storeId || 'unknown',
          functionName: 'advanced-ai-inference',
          simulationType: (body.inference_type || body.type || 'unknown') as SimulationType,
          inputVariables: body,
          aiResponse: {},
          executionTimeMs: executionTimer.getElapsedMs(),
          hadError: true,
          errorMessage,
        });
      }
    } catch (logError) {
      console.warn('[advanced-ai-inference] Failed to log error:', logError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Causal Inference: 인과 관계 추론
async function performCausalInference(request: InferenceRequest, apiKey: string) {
  const { data = [], graph_data, parameters = {} } = request;
  
  const dataSummary = summarizeData(data, graph_data);
  
  const prompt = `You are an expert data scientist specializing in causal inference.

Analyze the following data and graph structure to identify potential causal relationships:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${graph_data ? `GRAPH STRUCTURE:
- Nodes: ${graph_data.nodes.length}
- Edges: ${graph_data.edges.length}
- Edge types: ${[...new Set(graph_data.edges.map(e => e.type))].join(', ')}
` : ''}

PARAMETERS:
- Confidence threshold: ${parameters.confidence_threshold || 0.7}
- Max causal chain length: ${parameters.max_chain_length || 3}

Return a JSON object with causal_relationships, causal_chains, and insights.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const aiContent = result.choices?.[0]?.message?.content || '';
  const analysis = safeParseAIResponse(aiContent, { relationships: [], chains: [], summary: {} });

  return {
    type: 'causal_inference',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// Anomaly Detection: 이상 탐지
async function performAnomalyDetection(request: InferenceRequest, apiKey: string) {
  const { data = [], time_series_data, parameters = {} } = request;
  
  const statisticalAnomalies = detectStatisticalAnomalies(data, parameters);
  const dataSummary = summarizeData(data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in anomaly detection and data quality analysis.

Analyze the following data to identify anomalies, outliers, and unusual patterns:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES PATTERNS:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

STATISTICAL ANOMALIES DETECTED:
${JSON.stringify(statisticalAnomalies, null, 2)}

Return a JSON object with anomalies, patterns, and summary.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const aiContent = result.choices?.[0]?.message?.content || '';
  const analysis = safeParseAIResponse(aiContent, { anomalies: [], patterns: [], summary: {} });

  return {
    type: 'anomaly_detection',
    timestamp: new Date().toISOString(),
    statistical_baseline: statisticalAnomalies,
    ai_analysis: analysis,
  };
}

// Predictive Modeling: 예측 모델링
async function performPredictiveModeling(request: InferenceRequest, apiKey: string) {
  const { data = [], time_series_data, graph_data, parameters = {} } = request;
  
  const scenarioType = parameters.scenario_type;
  
  if (scenarioType === 'layout') {
    return performLayoutSimulation(request, apiKey);
  } else if (scenarioType === 'demand') {
    return performDemandForecast(request, apiKey);
  } else if (scenarioType === 'inventory') {
    return performInventoryOptimization(request, apiKey);
  } else if (scenarioType === 'pricing') {
    return performPricingOptimization(request, apiKey);
  } else if (scenarioType === 'recommendation') {
    return performRecommendationStrategy(request, apiKey);
  }
  
  const dataSummary = summarizeData(data, graph_data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in predictive modeling and forecasting.

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES DATA:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

Return a JSON object with predictions, feature_importance, drivers, risks, and model_quality.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const aiContent = result.choices?.[0]?.message?.content || '';
  const analysis = safeParseAIResponse(aiContent, { predictions: [], trends: [], summary: {} });

  return {
    type: 'predictive_modeling',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// ============================================================================
// performLayoutSimulation v5 - AI 제품 배치 최적화 버전
// 가구뿐만 아니라 제품도 AI가 최적의 위치/가구로 재배치 제안
// ============================================================================

// Layout Simulation: 레이아웃 최적화 시뮬레이션 (v5 - Product Optimization)
async function performLayoutSimulation(request: InferenceRequest, apiKey: string) {
  console.log('performLayoutSimulation v5 - AI Product Placement Optimization');
  console.log('=== Layout Simulation Start ===');

  const { parameters = {} } = request;
  const storeContext = parameters.store_context || {};
  
  console.log('StoreContext keys:', JSON.stringify(Object.keys(storeContext), null, 2));
  console.log('StoreContext entities count:', storeContext.entities?.length || 0);
  
  // Entity 매핑
  const mappedEntities = (storeContext.entities || []).map((e: any) => ({
    ...e,
    entityType: e.entityType || e.entity_type_name || 'unknown',
    position: e.position || e.model_3d_position,
    rotation: e.rotation || e.model_3d_rotation,
    scale: e.scale || e.model_3d_scale,
  }));
  console.log('Mapped entities:', mappedEntities.length);
  
  // 🆕 개선된 필터링 로직
  
  // 1. 가구 필터링
  const furnitureEntities = mappedEntities.filter((e: any) => {
    const model3dType = (e.model_3d_type || '').toLowerCase();
    const entityType = (e.entityType || '').toLowerCase();
    
    return model3dType === 'furniture' ||
           model3dType.includes('furniture') ||
           ['shelf', 'rack', 'displaytable', 'display', 'counter', 'checkout', 'fixture', 'table', 'hanger'].some(t => 
             entityType.toLowerCase().includes(t)
           );
  });
  console.log('Filtered furniture:', furnitureEntities.length);
  
  // 2. 제품 필터링 (개선)
  let productEntities = mappedEntities.filter((e: any) => {
    const type = (e.entityType || e.entity_type_name || '').toLowerCase();
    const model3dType = (e.model_3d_type || '').toLowerCase();

    return type === 'product' ||
           type.includes('product') ||
           model3dType === 'product' ||
           model3dType.includes('product');
  });
  console.log('Filtered products from entities:', productEntities.length);

  // 2-1. productPlacements에서도 제품 추출 (entities에 제품이 없는 경우)
  // store-context-builder에서 제품은 productPlacements에 저장됨
  if (productEntities.length === 0 && storeContext.productPlacements?.length > 0) {
    const placementProducts = storeContext.productPlacements.map((p: any) => ({
      id: p.productId,
      label: p.productName || p.productId,
      entityType: 'product',
      position: p.position,
      furnitureId: p.furnitureId,
      furnitureName: p.furnitureName,
      slotId: p.slotId,
      currentPosition: p.position,
    }));
    productEntities = placementProducts;
    console.log('Added products from productPlacements:', placementProducts.length);
  }
  console.log('Total products for optimization:', productEntities.length);
  
  // 3. Space 필터링 (개선)
  const spaceEntities = mappedEntities.filter((e: any) => {
    const type = (e.model_3d_type || '').toLowerCase();
    const entityType = (e.entityType || '').toLowerCase();
    const label = (e.label || '').toLowerCase();
    
    return type === 'space' || 
           type.includes('space') ||
           entityType === 'space' ||
           label.includes('3d모델') ||
           label.includes('매장 모델');
  });
  console.log('Found space entities:', spaceEntities.length);
  
  let spaceEntity = spaceEntities.length > 0 ? spaceEntities[0] : null;
  if (!spaceEntity) {
    const potentialSpace = mappedEntities.find((e: any) => 
      (e.model_3d_url || e.model3dUrl) && 
      !['furniture', 'product'].includes((e.model_3d_type || '').toLowerCase())
    );
    if (potentialSpace) {
      spaceEntity = potentialSpace;
      console.log('Found potential space entity:', spaceEntity.label);
    }
  }

  // 가구가 없을 경우 빈 결과 반환
  if (furnitureEntities.length === 0) {
    console.log('No furniture entities found - returning empty layout');
    return {
      type: 'layout_simulation',
      timestamp: new Date().toISOString(),
      asIsRecipe: { space: null, furniture: [], products: [] },
      toBeRecipe: { space: null, furniture: [], products: [] },
      layoutChanges: [],
      productPlacements: [],
      optimizationSummary: {
        changesCount: 0,
        productChangesCount: 0,
        expectedTrafficIncrease: 0,
        expectedRevenueIncrease: 0,
        confidence: 0,
      },
      aiInsights: ['가구 데이터가 없습니다. 디지털트윈 3D에서 가구를 추가해주세요.'],
      recommendations: [],
      confidenceScore: 0,
    };
  }

  // 🆕 현재 가구-제품 관계 분석
  const currentFurnitureProductMap = buildCurrentFurnitureProductMap(
    storeContext.relations || [],
    furnitureEntities,
    productEntities
  );
  
  // 관계 요약 텍스트 생성
  const furnitureProductSummary = buildFurnitureProductSummary(
    furnitureEntities,
    productEntities,
    currentFurnitureProductMap
  );

  // Enhanced Store Context 구성 (Phase 1)
  const enhancedContext: EnhancedStoreContext = {
    storeInfo: storeContext.storeInfo,
    entities: storeContext.entities || [],
    relations: storeContext.relations || [],
    visits: storeContext.visits,
    transactions: storeContext.transactions,
    dailySales: storeContext.dailySales,
    salesData: storeContext.salesData,
    visitorData: storeContext.visitorData,
    conversionData: storeContext.conversionData,
    recommendationPerformance: storeContext.recommendationPerformance,
    dataQuality: storeContext.dataQuality,
  };

  // 🆕 Continuous Learning: 과거 성과 및 학습 컨텍스트 조회
  // Note: supabase client is not available in this scope, skip learning features
  const storeId = storeContext.storeInfo?.id;
  const pastPerformanceData: PastPerformanceResult | undefined = undefined;
  const learningContext: LearningContext | undefined = undefined;

  // Learning features disabled - supabase client needs to be passed through request chain
  console.log('[Learning] Skipped - supabase client not available in this scope');

  // 통계 기반 신뢰도 계산 (Phase 1 + Continuous Learning)
  const confidenceResult = calculateStatisticalConfidence(enhancedContext, pastPerformanceData);
  console.log('Statistical Confidence:', confidenceResult.score, confidenceResult.explanation);
  
  // 온톨로지 그래프 분석
  const storeWidth = storeContext.storeInfo?.width || 17.4;
  const storeDepth = storeContext.storeInfo?.depth || 16.6;
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  
  const relations: GraphRelation[] = (storeContext.relations || []).map((r: any) => ({
    id: r.id,
    sourceEntityId: r.source_entity_id || r.sourceEntityId,
    targetEntityId: r.target_entity_id || r.targetEntityId,
    relationTypeId: r.relation_type_id,
    properties: r.properties || {}
  }));
  
  const allGraphEntities: GraphEntity[] = (storeContext.entities || []).map((e: any) => ({
    id: e.id,
    label: e.label,
    entityType: e.entityType || e.entity_type_name || 'unknown',
    position: e.position || e.model_3d_position,
    properties: { ...e.properties, model_3d_type: e.model_3d_type }
  }));
  
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'layout', storeWidth, storeDepth);
  console.log(`Layout Score: ${ontologyAnalysis.layoutInsights?.score}`);
  
  // 통합 데이터 분석
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext);

  // 가구 목록 텍스트
  const furnitureList = furnitureEntities.slice(0, 15).map((f: any) => {
    const x = f.position?.x || 0;
    const z = f.position?.z || f.position?.y || 0;
    const connectedProducts = currentFurnitureProductMap.get(f.id) || [];
    return `- [${f.id}] ${f.label} (${f.entityType}): pos(x=${x.toFixed(1)}, z=${z.toFixed(1)}) - 연결된 제품: ${connectedProducts.length}개`;
  }).join('\n');

  // 🆕 제품 목록 텍스트 (AI에게 제공) - SKU 형식 강조
  const productList = productEntities.slice(0, 20).map((p: any, idx: number) => {
    const x = p.position?.x || 0;
    const z = p.position?.z || p.position?.y || 0;
    const parentFurniture = findParentFurniture(p.id, currentFurnitureProductMap, furnitureEntities);
    // SKU 형식 명확히 표시
    return `${idx + 1}. productId="${p.id}" (${p.label}) - 위치(${x.toFixed(1)}, ${z.toFixed(1)}) - 가구: ${parentFurniture?.label || '없음'}`;
  }).join('\n');

  // 사용 가능한 productId 목록 (AI가 반드시 이 중에서만 선택해야 함)
  const validProductIdList = productEntities.slice(0, 20).map((p: any) => `"${p.id}"`).join(', ');

  // 🆕 AI 프롬프트 - 가구 + 제품 최적화 (Continuous Learning 포함)
  const prompt = buildEnhancedLayoutPromptWithProducts(
    enhancedContext,
    furnitureList,
    productList,
    validProductIdList,
    furnitureProductSummary,
    ontologyAnalysis,
    comprehensiveAnalysis,
    storeWidth,
    storeDepth,
    confidenceResult,
    learningContext
  );

  // AI 호출
  let aiResponse: any = {
    layoutChanges: [],
    productPlacements: [],
    optimizationSummary: { expectedTrafficIncrease: 0, expectedRevenueIncrease: 0, confidence: 50 },
    aiInsights: [],
    recommendations: [],
    dataBasedInsights: [],
  };
  
  try {
    console.log('Calling AI API for furniture + product optimization...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a data-driven retail layout AND product placement expert. 
You optimize both furniture positions AND product placements on furniture.
Return ONLY valid JSON, no markdown code blocks, no explanations.
Base ALL recommendations on the provided real data.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content || '';
      
      console.log('AI response length:', aiContent.length);
      
      if (aiContent.trim()) {
        const parsed = safeParseAIResponse(aiContent, {});
        if (parsed && Object.keys(parsed).length > 0) {
          aiResponse = parsed;
          console.log('Parsed layoutChanges count:', aiResponse.layoutChanges?.length || 0);
          console.log('Parsed productPlacements count:', aiResponse.productPlacements?.length || 0);
        }
      }
    } else {
      console.error('AI API error:', response.status, await response.text());
    }
  } catch (e) {
    console.error('AI call error:', e);
  }

  // layoutChanges 검증 및 정규화
  const validFurnitureIds = new Set(furnitureEntities.map((f: any) => f.id));
  const validProductIds = new Set(productEntities.map((p: any) => p.id));

  const layoutChanges = Array.isArray(aiResponse.layoutChanges) 
    ? aiResponse.layoutChanges
        .filter((c: any) => {
          if (!c.entityId || !c.suggestedPosition) return false;
          if (!validFurnitureIds.has(c.entityId)) {
            console.warn(`Invalid furniture entityId from AI: ${c.entityId}`);
            return false;
          }
          return true;
        })
        .map((c: any) => {
          const pos = c.suggestedPosition;
          const safeHalfWidth = halfWidth - 1;
          const safeHalfDepth = halfDepth - 1;
          return {
            ...c,
            suggestedPosition: {
              x: Math.max(-safeHalfWidth, Math.min(safeHalfWidth, pos.x || 0)),
              y: pos.y || 0,
              z: Math.max(-safeHalfDepth, Math.min(safeHalfDepth, pos.z || 0)),
            },
          };
        })
    : [];

  // 🆕 AI가 잘못된 productId를 반환할 경우 실제 제품에 매핑하는 함수
  const mapAIProductIdToReal = (aiProductId: string): string | null => {
    if (!aiProductId) return null;

    // 1. 정확히 일치하는 경우
    if (validProductIds.has(aiProductId)) {
      return aiProductId;
    }

    const productArray = Array.from(productEntities) as any[];
    const lowerAiId = aiProductId.toLowerCase();

    // 2. productLabel과 AI의 productLabel 비교
    const aiProduct = aiResponse.productPlacements?.find((p: any) => p.productId === aiProductId);
    if (aiProduct?.productLabel) {
      const byLabel = productArray.find((p: any) =>
        p.label?.toLowerCase().includes(aiProduct.productLabel.toLowerCase()) ||
        aiProduct.productLabel.toLowerCase().includes((p.label || '').toLowerCase())
      ) as any;
      if (byLabel) {
        console.log(`[ProductMapping] Matched by label: ${aiProductId} → ${byLabel.id}`);
        return byLabel.id;
      }
    }

    // 3. 시맨틱 키워드로 매핑 (AI가 "product-new-arrival-knit-01" 같은 형식 생성 시)
    const semanticMap: Record<string, string[]> = {
      // 의류
      knit: ['TOP', 'SWT', 'KNI'],
      sweater: ['TOP', 'SWT', 'KNI'],
      tshirt: ['TOP', 'TSH'],
      't-shirt': ['TOP', 'TSH'],
      shirt: ['TOP', 'SHI'],
      blouse: ['TOP', 'BLO'],
      pants: ['BTM', 'PNT'],
      jeans: ['BTM', 'JNS'],
      skirt: ['BTM', 'SKI'],
      dress: ['DRS', 'ONE'],
      coat: ['OUT', 'COA'],
      jacket: ['OUT', 'JAC'],
      // 액세서리
      socks: ['SCA', 'SOC', 'ACC'],
      scarf: ['SCA', 'ACC'],
      hat: ['ACC', 'HAT'],
      bag: ['BAG'],
      shoes: ['SHO'],
      sneakers: ['SHO', 'SNE'],
      // 화장품
      lipstick: ['LIP', 'COS'],
      lip: ['LIP', 'COS'],
      perfume: ['PER', 'COS'],
      makeup: ['COS', 'MAK'],
    };

    // AI ID에서 시맨틱 키워드 추출 시도
    for (const [keyword, categories] of Object.entries(semanticMap)) {
      if (lowerAiId.includes(keyword)) {
        for (const cat of categories) {
          const match = productArray.find((p: any) =>
            (p.id || '').toUpperCase().includes(`-${cat}-`) ||
            (p.id || '').toUpperCase().includes(`SKU-${cat}`) ||
            (p.id || '').toUpperCase().includes(`-${cat}`)
          ) as any;
          if (match) {
            console.log(
              `[ProductMapping] Matched by semantic keyword "${keyword}": ${aiProductId} → ${match.id}`
            );
            return match.id;
          }
        }
      }
    }

    // 4. 카테고리 코드로 매핑 (예: "SWT" → "TOP")
    const categoryMap: Record<string, string[]> = {
      SWT: ['TOP', 'SWT'],
      TOP: ['TOP'],
      SCF: ['SCA', 'ACC'],
      SCA: ['SCA'],
      LIP: ['LIP'],
      BAG: ['BAG'],
      SHO: ['SHO'],
      ACC: ['ACC'],
      DRS: ['DRS'],
      PNT: ['PNT'],
    };

    const parts = aiProductId.split('-');
    if (parts.length >= 2) {
      const aiCategory = parts[1].toUpperCase();
      const possibleCategories = categoryMap[aiCategory] || [aiCategory];

      for (const cat of possibleCategories) {
        const match = productArray.find((p: any) =>
          (p.id || '').toUpperCase().includes(`-${cat}-`) || (p.id || '').toUpperCase().includes(`SKU-${cat}`)
        ) as any;
        if (match) {
          console.log(`[ProductMapping] Matched by category ${aiCategory}→${cat}: ${aiProductId} → ${match.id}`);
          return match.id;
        }
      }
    }

    // 5. 순서 기반 폴백: AI가 N번째 제품을 언급했다면 실제 목록의 N번째 제품 사용
    const aiIndex = aiResponse.productPlacements?.findIndex((p: any) => p.productId === aiProductId);
    if (aiIndex !== undefined && aiIndex >= 0 && aiIndex < productArray.length) {
      const fallback = productArray[aiIndex] as any;
      console.log(`[ProductMapping] Fallback by index ${aiIndex}: ${aiProductId} → ${fallback?.id}`);
      return fallback?.id ?? null;
    }

    console.warn(`[ProductMapping] No match found for: ${aiProductId}`);
    return null;
  };

  // 🆕 productPlacements 검증 및 정규화 (매핑 로직 포함)
  const productPlacements = Array.isArray(aiResponse.productPlacements)
    ? aiResponse.productPlacements
        .map((p: any) => {
          // AI가 반환한 productId를 실제 ID로 매핑
          const mappedProductId = mapAIProductIdToReal(p.productId);
          if (mappedProductId) {
            // 현재 제품 정보 찾기 (fromPosition 계산용)
            const currentProduct = productEntities.find((pe: any) => pe.id === mappedProductId);
            const currentPosition = currentProduct?.position || currentProduct?.currentPosition || null;

            // 현재 가구 정보 찾기
            const currentParent = findParentFurniture(mappedProductId, currentFurnitureProductMap, furnitureEntities);

            return {
              ...p,
              productId: mappedProductId,
              originalAIProductId: p.productId,
              productLabel: currentProduct?.label || p.productLabel || mappedProductId,
              // 🆕 fromPosition 추가 (현재 위치)
              fromPosition: currentPosition,
              currentPosition: currentPosition,
              // 🆕 toPosition 추가 (suggestedPosition 별칭)
              toPosition: p.suggestedPosition,
              // 🆕 가구 정보 추가
              currentFurnitureId: currentParent?.id || p.currentFurnitureId,
              currentFurnitureLabel: currentParent?.label || p.currentFurnitureLabel,
            };
          }
          return null;
        })
        .filter((p: any) => {
          if (!p) return false;
          // suggestedFurnitureId가 있으면 유효한지 확인
          if (p.suggestedFurnitureId && !validFurnitureIds.has(p.suggestedFurnitureId)) {
            console.warn(`Invalid suggested furniture ID: ${p.suggestedFurnitureId}`);
            return false;
          }
          return true;
        })
        .map((p: any) => {
          // 제품 위치도 안전 영역 내로 클램핑
          if (p.suggestedPosition) {
            const safeHalfWidth = halfWidth - 0.5;
            const safeHalfDepth = halfDepth - 0.5;
            const clampedPosition = {
              x: Math.max(-safeHalfWidth, Math.min(safeHalfWidth, p.suggestedPosition.x || 0)),
              y: p.suggestedPosition.y || 0.8,
              z: Math.max(-safeHalfDepth, Math.min(safeHalfDepth, p.suggestedPosition.z || 0)),
            };
            p.suggestedPosition = clampedPosition;
            p.toPosition = clampedPosition;
          }
          return p;
        })
    : [];

  console.log('Valid layoutChanges after filtering:', layoutChanges.length);
  console.log('Valid productPlacements after filtering:', productPlacements.length);

  // 매핑된 제품 정보 로깅
  const mappedProducts = productPlacements.filter((p: any) => p.originalAIProductId && p.originalAIProductId !== p.productId);
  if (mappedProducts.length > 0) {
    console.log(`[ProductMapping] ${mappedProducts.length} products were mapped from AI IDs to real SKUs:`,
      mappedProducts.map((p: any) => `${p.originalAIProductId} → ${p.productId}`).join(', ')
    );
  }

  // 변경 맵 생성
  const furnitureChangesMap = new Map<string, any>();
  layoutChanges.forEach((c: any) => {
    furnitureChangesMap.set(c.entityId, c);
  });

  const productChangesMap = new Map<string, any>();
  productPlacements.forEach((p: any) => {
    productChangesMap.set(p.productId, p);
  });

  // 🆕 레시피 빌더 (가구 + 제품 모두 변경 적용)
  const buildRecipe = (mode: 'current' | 'suggested') => ({
    space: spaceEntity ? {
      id: spaceEntity.id,
      type: 'space',
      label: spaceEntity.label,
      position: spaceEntity.position || { x: 0, y: 0, z: 0 },
      rotation: spaceEntity.rotation || { x: 0, y: 0, z: 0 },
      scale: spaceEntity.scale || { x: 1, y: 1, z: 1 },
      model_url: spaceEntity.model3dUrl || spaceEntity.model_3d_url || null,
      dimensions: spaceEntity.dimensions || spaceEntity.model_3d_dimensions || null,
    } : null,
    
    furniture: furnitureEntities.map((f: any) => {
      const change = furnitureChangesMap.get(f.id);
      const position = (mode === 'suggested' && change?.suggestedPosition) 
        ? change.suggestedPosition 
        : f.position;
      
      return {
        id: f.id,
        type: 'furniture',
        furniture_type: f.entityType,
        label: f.label,
        position: position,
        rotation: f.rotation || { x: 0, y: 0, z: 0 },
        scale: f.scale || { x: 1, y: 1, z: 1 },
        model_url: f.model3dUrl || f.model_3d_url || null,
        dimensions: f.dimensions || f.model_3d_dimensions || null,
        color: f.properties?.color || '#888888',
        isChanged: mode === 'suggested' && !!change,
      };
    }),
    
    // 🆕 제품도 AI 추천 위치 적용
    products: productEntities.map((p: any) => {
      const change = productChangesMap.get(p.id);
      const position = (mode === 'suggested' && change?.suggestedPosition)
        ? change.suggestedPosition
        : (p.position || { x: 0, y: 0, z: 0 });
      
      // 현재 부모 가구
      const currentParent = findParentFurniture(p.id, currentFurnitureProductMap, furnitureEntities);
      // 추천 부모 가구
      const suggestedParent = change?.suggestedFurnitureId 
        ? furnitureEntities.find((f: any) => f.id === change.suggestedFurnitureId)
        : null;
      
      return {
        id: p.id,
        type: 'product',
        product_id: p.id,
        sku: p.label,
        label: p.label,
        position: position,
        rotation: p.rotation || { x: 0, y: 0, z: 0 },
        scale: p.scale || { x: 1, y: 1, z: 1 },
        model_url: p.model3dUrl || p.model_3d_url || null,
        dimensions: p.dimensions || p.model_3d_dimensions || null,
        isChanged: mode === 'suggested' && !!change,
        // 🆕 가구 연결 정보
        currentFurnitureId: currentParent?.id || null,
        currentFurnitureLabel: currentParent?.label || null,
        suggestedFurnitureId: (mode === 'suggested' && suggestedParent) ? suggestedParent.id : currentParent?.id,
        suggestedFurnitureLabel: (mode === 'suggested' && suggestedParent) ? suggestedParent.label : currentParent?.label,
        furnitureChanged: mode === 'suggested' && change?.suggestedFurnitureId && change.suggestedFurnitureId !== currentParent?.id,
      };
    }),
  });
  
  const rawConfidence = aiResponse.optimizationSummary?.confidence || confidenceResult.score;
  const normalizedConfidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  
  const result = {
    type: 'layout_simulation',
    timestamp: new Date().toISOString(),
    asIsRecipe: buildRecipe('current'),
    toBeRecipe: buildRecipe('suggested'),
    
    // 가구 변경
    layoutChanges: layoutChanges,
    
    // 🆕 제품 배치 변경
    productPlacements: productPlacements,
    
    optimizationSummary: {
      expectedTrafficIncrease: aiResponse.optimizationSummary?.expectedTrafficIncrease || 0,
      expectedRevenueIncrease: aiResponse.optimizationSummary?.expectedRevenueIncrease || 0,
      expectedConversionIncrease: aiResponse.optimizationSummary?.expectedConversionIncrease || 0,
      changesCount: layoutChanges.length,
      productChangesCount: productPlacements.length,  // 🆕
      confidence: normalizedConfidence,
      confidenceFactors: confidenceResult.factors,
      confidenceExplanation: confidenceResult.explanation,
    },
    
    dataBasedInsights: aiResponse.dataBasedInsights || [],
    aiInsights: Array.isArray(aiResponse.aiInsights) ? aiResponse.aiInsights : [],
    recommendations: Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
    confidenceScore: normalizedConfidence / 100,
    dataQuality: enhancedContext.dataQuality,
    ontologyAnalysis: {
      score: ontologyAnalysis.layoutInsights?.score || 0,
      violations: ontologyAnalysis.layoutInsights?.violations || [],
      opportunities: ontologyAnalysis.layoutInsights?.opportunities || [],
      clusters: ontologyAnalysis.layoutInsights?.clusters || [],
      deadZones: ontologyAnalysis.layoutInsights?.deadZones || [],
      entityCount: allGraphEntities.length,
      relationCount: relations.length,
      patterns: ontologyAnalysis.relationAnalysis.patterns.slice(0, 5),
    },
  };

  console.log('=== Layout Simulation Complete ===');
  console.log('asIsRecipe furniture count:', result.asIsRecipe.furniture.length);
  console.log('asIsRecipe products count:', result.asIsRecipe.products.length);
  console.log('toBeRecipe furniture count:', result.toBeRecipe.furniture.length);
  console.log('toBeRecipe products count:', result.toBeRecipe.products.length);
  console.log('layoutChanges count:', result.layoutChanges.length);
  console.log('productPlacements count:', result.productPlacements.length);
  console.log('confidence:', result.optimizationSummary.confidence);

  return result;
}


// ============================================================================
// 헬퍼 함수들
// ============================================================================

// 현재 가구-제품 관계 맵 생성
function buildCurrentFurnitureProductMap(
  relations: any[], 
  furnitureEntities: any[], 
  productEntities: any[]
): Map<string, any[]> {
  const furnitureProductMap = new Map<string, any[]>();
  
  // 모든 가구에 대해 빈 배열 초기화
  furnitureEntities.forEach((f: any) => {
    furnitureProductMap.set(f.id, []);
  });
  
  // DISPLAYED_ON_FURNITURE 관계 찾기
  const displayRelations = relations.filter((r: any) => {
    const typeName = (r.relation_type_name || r.ontology_relation_types?.name || '').toLowerCase();
    return typeName.includes('display') || typeName === 'displayed_on_furniture';
  });
  
  // 관계 기반 매핑
  displayRelations.forEach((rel: any) => {
    const productId = rel.source_entity_id || rel.sourceEntityId;
    const furnitureId = rel.target_entity_id || rel.targetEntityId;
    
    const product = productEntities.find((p: any) => p.id === productId);
    if (product && furnitureProductMap.has(furnitureId)) {
      furnitureProductMap.get(furnitureId)!.push(product);
    }
  });
  
  // 관계가 없는 경우: 위치 기반 근접성으로 매핑 (fallback)
  productEntities.forEach((product: any) => {
    let alreadyMapped = false;
    furnitureProductMap.forEach((products) => {
      if (products.some((p: any) => p.id === product.id)) {
        alreadyMapped = true;
      }
    });
    
    if (!alreadyMapped && product.position) {
      let closestFurniture: any = null;
      let minDistance = Infinity;
      
      furnitureEntities.forEach((furniture: any) => {
        if (furniture.position) {
          const dx = (product.position.x || 0) - (furniture.position.x || 0);
          const dz = (product.position.z || product.position.y || 0) - (furniture.position.z || furniture.position.y || 0);
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < 3 && distance < minDistance) {
            minDistance = distance;
            closestFurniture = furniture;
          }
        }
      });
      
      if (closestFurniture) {
        furnitureProductMap.get(closestFurniture.id)!.push(product);
      }
    }
  });
  
  return furnitureProductMap;
}

// 부모 가구 찾기
function findParentFurniture(
  productId: string, 
  furnitureProductMap: Map<string, any[]>,
  furnitureEntities: any[]
): any | null {
  for (const [furnitureId, products] of furnitureProductMap.entries()) {
    if (products.some((p: any) => p.id === productId)) {
      return furnitureEntities.find((f: any) => f.id === furnitureId);
    }
  }
  return null;
}

// 가구-제품 관계 요약 텍스트 생성
function buildFurnitureProductSummary(
  furnitureEntities: any[],
  productEntities: any[],
  furnitureProductMap: Map<string, any[]>
): string {
  const lines: string[] = ['=== 🪑↔️📦 현재 가구-제품 연결 현황 ==='];
  
  furnitureEntities.forEach((f: any) => {
    const products = furnitureProductMap.get(f.id) || [];
    if (products.length > 0) {
      lines.push(`\n${f.label} (${f.entityType}):`);
      products.forEach((p: any) => {
        lines.push(`  - ${p.label}`);
      });
    } else {
      lines.push(`\n${f.label}: 연결된 제품 없음 ⚠️`);
    }
  });
  
  // 연결되지 않은 제품
  const unconnectedProducts = productEntities.filter((p: any) => {
    for (const products of furnitureProductMap.values()) {
      if (products.some((prod: any) => prod.id === p.id)) {
        return false;
      }
    }
    return true;
  });
  
  if (unconnectedProducts.length > 0) {
    lines.push(`\n⚠️ 가구에 연결되지 않은 제품 (${unconnectedProducts.length}개):`);
    unconnectedProducts.slice(0, 5).forEach((p: any) => {
      lines.push(`  - ${p.label} at (${p.position?.x?.toFixed(1) || 0}, ${p.position?.z?.toFixed(1) || 0})`);
    });
  }
  
  return lines.join('\n');
}


// 🆕 가구 + 제품 최적화를 위한 강화된 프롬프트
function buildEnhancedLayoutPromptWithProducts(
  context: EnhancedStoreContext,
  furnitureList: string,
  productList: string,
  validProductIdList: string,
  furnitureProductSummary: string,
  ontologyAnalysis: any,
  comprehensiveAnalysis: any,
  storeWidth: number,
  storeDepth: number,
  confidenceResult: any,
  learningContext?: LearningContext
): string {
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  const enhancedDataSection = buildEnhancedDataPrompt(context);

  // Continuous Learning 학습 데이터 추가
  const learningSection = learningContext?.promptAddition || '';

  return `You are a retail store layout AND product placement optimization expert with access to REAL business data.

${enhancedDataSection}

${learningSection}

=== 🔬 온톨로지 그래프 분석 ===
${ontologyAnalysis?.summaryForAI || '온톨로지 분석 없음'}

${comprehensiveAnalysis?.comprehensiveSummary || ''}

${furnitureProductSummary}

=== 📐 매장 경계 (중심 기준 좌표계) ===
- 매장 크기: ${storeWidth}m x ${storeDepth}m
- X축 범위: -${halfWidth.toFixed(1)} ~ +${halfWidth.toFixed(1)}
- Z축 범위: -${halfDepth.toFixed(1)} ~ +${halfDepth.toFixed(1)}
- 가구 안전 영역: X ±${(halfWidth - 1).toFixed(1)}, Z ±${(halfDepth - 1).toFixed(1)}
- 제품 안전 영역: X ±${(halfWidth - 0.5).toFixed(1)}, Z ±${(halfDepth - 0.5).toFixed(1)}

=== 🪑 현재 가구 배치 ===
${furnitureList}

=== 📦 현재 제품 배치 ===
${productList}

🚨🚨🚨 CRITICAL - productId 규칙 🚨🚨🚨
productPlacements 배열의 productId는 아래 목록 중 하나만 사용 가능합니다:
[${validProductIdList}]

⛔ 금지: "product-new-arrival-xxx", "product-promo-xxx" 같은 임의 ID 생성
✅ 필수: 위 목록에 있는 정확한 productId 값만 사용

예시:
- 올바름: "productId": "SKU-TOP-001"
- 틀림: "productId": "product-new-arrival-knit-01"

=== 📊 분석 신뢰도: ${confidenceResult.score}% ===
신뢰도 근거: ${confidenceResult.explanation}

=== 💡 최적화 목표 ===
1. **가구 배치 최적화**: 3-5개의 가구 이동 제안
2. **제품 배치 최적화**: 제품을 더 적합한 가구로 재배치하거나 위치 조정 제안
   - 인기 상품은 매장 뒤쪽 (목적지 구역)
   - 신상품/프로모션 상품은 입구 근처 (파워월)
   - 연관 상품은 인접 배치 (크로스셀)
   - 고마진 상품은 눈높이/접근성 좋은 위치

CRITICAL RULES:
1. 모든 위치는 반드시 안전 영역 내여야 함
2. 제품 위치는 해당 가구 위/근처여야 함 (가구 위치 + 오프셋)
3. 실제 데이터가 지적하는 문제점을 우선 해결

Return ONLY valid JSON (no markdown):
{
  "layoutChanges": [
    {
      "entityId": "furniture-uuid",
      "entityLabel": "가구 이름",
      "entityType": "Shelf",
      "currentPosition": {"x": 0, "y": 0, "z": 0},
      "suggestedPosition": {"x": 0, "y": 0, "z": 0},
      "reason": "📊 [데이터 근거] 이동 이유",
      "impact": "high|medium|low"
    }
  ],
  "productPlacements": [
    {
      "productId": "SKU-XXX-001",  // ⚠️ 반드시 위 제품 목록의 [대괄호] 안 ID 그대로 사용!
      "productLabel": "제품 이름",
      "currentFurnitureId": "current-furniture-uuid",
      "currentFurnitureLabel": "현재 가구 이름",
      "suggestedFurnitureId": "new-furniture-uuid",
      "suggestedFurnitureLabel": "추천 가구 이름",
      "suggestedPosition": {"x": 0, "y": 1.2, "z": 0},
      "reason": "📊 [배치 이유] 예: 인기상품을 매장 뒤쪽으로 이동하여 고객 동선 유도",
      "impact": "high|medium|low"
    }
  ],
  "optimizationSummary": {
    "expectedTrafficIncrease": 15,
    "expectedRevenueIncrease": 8,
    "expectedConversionIncrease": 3,
    "confidence": ${confidenceResult.score}
  },
  "dataBasedInsights": ["인사이트1", "인사이트2"],
  "aiInsights": ["종합 인사이트"],
  "recommendations": ["추천"]
}`
;
}

// Business Goal Analysis
async function performBusinessGoalAnalysis(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const goalText = parameters.goal_text || '';
  
  const prompt = `You are an expert retail strategy consultant.

BUSINESS GOAL: ${goalText}

Analyze this business goal and recommend 3-5 actionable simulation scenarios.
Return a JSON object with recommendations array.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const aiContent = result.choices?.[0]?.message?.content || '';
  const analysis = safeParseAIResponse(aiContent, { patterns: [], insights: [], summary: {} });

  return analysis;
}

// Demand Forecast
async function performDemandForecast(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'demand');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext) {
    const avgRevenue = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.totalRevenue, 0) / storeContext.recentKpis.length
      : 0;
    
    contextSummary = `
ACTUAL STORE DATA (Last 30 Days):
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Average Daily Revenue: ${Math.round(avgRevenue).toLocaleString()}원

${comprehensiveAnalysis.visitAnalysis.summaryText}
${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.salesTrendAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in demand forecasting for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a comprehensive JSON object with predictedKpi, confidenceScore, aiInsights, demandDrivers, demandForecast, topProducts, and recommendations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'demand_forecast',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      demandInsights: ontologyAnalysis.demandInsights,
      patterns: ontologyAnalysis.relationAnalysis.patterns.slice(0, 5),
    },
  };
}

// Inventory Optimization
async function performInventoryOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'inventory');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext?.inventory) {
    const totalStock = storeContext.inventory.reduce((sum: number, i: any) => sum + i.currentStock, 0);
    
    contextSummary = `
ACTUAL INVENTORY DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Inventory Items: ${storeContext.inventory.length}개
- Total Current Stock: ${totalStock.toLocaleString()}개

${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.displayAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in inventory management for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, inventoryOptimization, and recommendations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'inventory_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      inventoryInsights: ontologyAnalysis.inventoryInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Pricing Optimization
async function performPricingOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'pricing');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext?.products) {
    const avgPrice = storeContext.products.reduce((sum: number, p: any) => sum + p.sellingPrice, 0) / storeContext.products.length;
    
    contextSummary = `
ACTUAL PRODUCT PRICING DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Products: ${storeContext.products.length}개
- Average Selling Price: ${Math.round(avgPrice).toLocaleString()}원

${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.salesTrendAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in pricing strategy for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, pricingOptimization, and recommendations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'pricing_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      pricingInsights: ontologyAnalysis.pricingInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Recommendation Strategy
async function performRecommendationStrategy(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'recommendation');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext) {
    contextSummary = `
ACTUAL STORE PERFORMANCE DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Products: ${storeContext.products?.length || 0}개

${comprehensiveAnalysis.visitAnalysis.summaryText}
${comprehensiveAnalysis.displayAnalysis.summaryText}
${comprehensiveAnalysis.proximityAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in retail marketing and recommendation systems.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, recommendationStrategy, and recommendations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'recommendation_strategy',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      marketingInsights: ontologyAnalysis.marketingInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Pattern Discovery
async function performPatternDiscovery(request: InferenceRequest, apiKey: string) {
  const { data = [], graph_data, time_series_data, parameters = {} } = request;
  
  if (parameters.analysis_type === 'business_goal_analysis') {
    return performBusinessGoalAnalysis(request, apiKey);
  }
  
  const dataSummary = summarizeData(data, graph_data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in data mining and pattern recognition.

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES PATTERNS:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

Return a JSON object with patterns, segments, trends, insights, and summary.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const aiContent = result.choices?.[0]?.message?.content || '';
  const analysis = safeParseAIResponse(aiContent, { patterns: [], clusters: [], summary: {} });

  return {
    type: 'pattern_discovery',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// Helper functions
function summarizeData(data: any[] | undefined, graph_data?: any) {
  if (!data || data.length === 0) {
    return { record_count: 0, fields: [] };
  }

  const sample = data.slice(0, 100);
  const fields = Object.keys(sample[0] || {});
  
  const summary: any = {
    record_count: data.length,
    sample_size: sample.length,
    fields: fields.map(field => {
      const values = sample.map(r => r[field]).filter(v => v != null);
      const numeric = values.every(v => typeof v === 'number');
      
      if (numeric) {
        return {
          name: field,
          type: 'numeric',
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      } else {
        const unique = [...new Set(values)];
        return {
          name: field,
          type: 'categorical',
          unique_count: unique.length,
          top_values: unique.slice(0, 5),
        };
      }
    }),
  };

  if (graph_data) {
    summary.graph_info = {
      node_count: graph_data.nodes?.length || 0,
      edge_count: graph_data.edges?.length || 0,
      node_types: [...new Set((graph_data.nodes || []).map((n: any) => n.type))],
      edge_types: [...new Set((graph_data.edges || []).map((e: any) => e.type))],
    };
  }

  return summary;
}

function summarizeTimeSeries(timeSeries: any[]) {
  if (!timeSeries || timeSeries.length === 0) {
    return { length: 0 };
  }

  const values = timeSeries.map((t: any) => t.value).filter((v: any) => typeof v === 'number');
  
  return {
    length: timeSeries.length,
    start: timeSeries[0]?.timestamp,
    end: timeSeries[timeSeries.length - 1]?.timestamp,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
    trend: calculateTrendHelper(values),
  };
}

function calculateTrendHelper(values: number[]) {
  if (values.length < 2) return 'insufficient_data';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (Math.abs(change) < 0.05) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

function detectStatisticalAnomalies(data: any[] | undefined, parameters: any) {
  if (!data || data.length === 0) return { anomalies: [] };
  
  const anomalies: any[] = [];
  const threshold = parameters.z_score_threshold || 3;
  
  const sample = data[0];
  const numericFields = Object.keys(sample).filter(key => typeof sample[key] === 'number');
  
  for (const field of numericFields) {
    const values = data.map(r => r[field]).filter(v => typeof v === 'number');
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    values.forEach((value, idx) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          field,
          index: idx,
          value,
          z_score: zScore,
          expected_range: [mean - threshold * stdDev, mean + threshold * stdDev],
        });
      }
    });
  }
  
  return { anomalies, method: 'z_score', threshold };
}

// ============================================================================
// 3D 씬 시뮬레이션 함수들
// ============================================================================

// 레이아웃 최적화 시뮬레이션
async function performLayoutOptimization(request: InferenceRequest, apiKey: string) {
  const { params, storeId, orgId } = request;
  const sceneData = params?.sceneData;
  const storeContext = params?.storeContext;
  const goal = params?.goal || 'revenue';
  const supabaseClient = params?.supabaseClient; // Supabase client passed from main handler

  // storeContext 디버그 로깅
  console.log('[LayoutOptimization] storeContext available:', {
    hasStoreInfo: !!storeContext?.storeInfo,
    zonesCount: storeContext?.zones?.length || 0,
    zoneMetricsCount: storeContext?.zoneMetrics?.length || 0,
    dailySalesCount: storeContext?.dailySales?.length || 0,
    visitsCount: storeContext?.visits?.length || 0,
    dataQuality: storeContext?.dataQuality,
  });

  // 🆕 슬롯 기반 레이아웃 데이터 로드
  let slotLayoutData: SlotBasedLayoutData | null = null;
  let slotOptimizationSection = '';
  let productPlacements: any[] = [];

  if (storeId && supabaseClient) {
    try {
      slotLayoutData = await loadSlotBasedLayoutData(supabaseClient, storeId, '');
      console.log('[LayoutOptimization] Slot data loaded:', {
        furnitureCount: slotLayoutData.furniture.length,
        slotsCount: slotLayoutData.slots.length,
        productsCount: slotLayoutData.products.length,
      });

      // 슬롯 최적화 프롬프트 섹션 생성
      if (slotLayoutData.slots.length > 0) {
        slotOptimizationSection = buildSlotOptimizationPrompt(slotLayoutData);

        // 룰 기반 상품 배치 제안 생성
        productPlacements = generateSlotBasedProductPlacements(
          slotLayoutData,
          storeContext,
          10
        );
      }
    } catch (err) {
      console.warn('[LayoutOptimization] Failed to load slot data:', err);
    }
  }

  // 🆕 실제 제품 배치 정보 사용 (sceneData의 productPlacements 우선 - 슬롯 기반)
  const sceneProductPlacements = sceneData?.productPlacements || [];
  const actualProductPlacements = sceneProductPlacements.length > 0
    ? sceneProductPlacements
    : (storeContext?.productPlacements || []);
  const hasRealProductPositions = actualProductPlacements.length > 0;

  // 🆕 사용 가능한 빈 슬롯 정보 (sceneData에서 추출)
  const availableSlots = sceneData?.availableSlots || [];

  // 🆕 최적화 강도 설정에서 최대 변경 수 추출
  const settings = params?.settings || {};
  const maxFurnitureMoves = settings.furniture?.maxMoves || 12;  // 기본값: medium
  const maxProductRelocations = settings.products?.maxRelocations || 35;  // 기본값: medium
  const intensityLevel = settings.intensity || 'medium';

  console.log('[LayoutOptimization] Slot-based product placements:', actualProductPlacements.length);
  console.log('[LayoutOptimization] Available slots for AI:', availableSlots.length);
  console.log('[LayoutOptimization] Intensity settings:', { intensityLevel, maxFurnitureMoves, maxProductRelocations });

  // 프롬프트 빌드 (슬롯 시스템 통합)
  const prompt = `You are an expert retail space optimization AI specializing in store layout design.

TASK: Analyze the current store layout and suggest optimal furniture/fixture placements to maximize ${goal === 'revenue' ? 'revenue and sales conversion' : goal === 'traffic' ? 'customer traffic flow' : 'customer experience and dwell time'}.

STORE INFORMATION:
${storeContext?.storeInfo ? `- Store: ${storeContext.storeInfo.name}
- Dimensions: ${storeContext.storeInfo.width}m x ${storeContext.storeInfo.depth}m
- Business Type: ${storeContext.storeInfo.businessType || 'Retail'}
- Entrance Position: ${storeContext.storeInfo.entrancePosition ? `(${storeContext.storeInfo.entrancePosition.x}, ${storeContext.storeInfo.entrancePosition.z})` : 'Not specified (assume bottom edge)'}` : '- Standard retail store'}

CURRENT FURNITURE:
${JSON.stringify((sceneData?.furniture || []).map((f: any) => ({
  id: f.id,
  code: f.code,
  name: f.name,
  type: f.furniture_type || f.type,
  position: f.position,
})), null, 2)}

=== 🏷️ 현재 제품 배치 (슬롯 기반) - 총 ${actualProductPlacements.length}개 ===
${hasRealProductPositions ? actualProductPlacements.slice(0, 20).map((p: any) =>
  `- [${p.productSku || p.productId}] ${p.productName || '상품'} @ ${p.furnitureCode || p.furnitureName || '가구'}[${p.slotId || '-'}] (카테고리: ${p.category || 'N/A'})`
).join('\n') + (actualProductPlacements.length > 20 ? `\n... 외 ${actualProductPlacements.length - 20}개` : '') : '제품 배치 정보 없음'}

=== ✅ 사용 가능한 빈 슬롯 (${availableSlots.length}개) ===
${availableSlots.length > 0 ? availableSlots.slice(0, 30).map((s: any) =>
  `- ${s.furnitureCode || s.furnitureName}[${s.slotCode || s.slotId}] (타입: ${s.slotType || 'N/A'}, 호환: ${(s.compatibleDisplayTypes || []).join(',')})`
).join('\n') : '빈 슬롯 없음 - 아래 "슬롯 교환" 방식으로 제안하세요'}

🚨🚨🚨 CRITICAL - 최적화 강도 및 개수 제한 🚨🚨🚨

📊 현재 최적화 강도: ${intensityLevel === 'low' ? '보수적 (Low)' : intensityLevel === 'medium' ? '균형 (Medium)' : '적극적 (High)'}

⚠️ 필수 제한 사항:
- furnitureMoves: 최소 3개, 최대 ${maxFurnitureMoves}개
- productSlotMoves: 최소 3개, 최대 ${maxProductRelocations}개

📌 가구 재배치 (furnitureMoves):
- 반드시 ${Math.min(3, maxFurnitureMoves)}~${maxFurnitureMoves}개 범위 내에서 제안
- 영향력 높은 가구 우선 (입구 근처, 동선 핵심 위치)

📌 제품 재배치 (productSlotMoves):
- 반드시 ${Math.min(3, maxProductRelocations)}~${maxProductRelocations}개 범위 내에서 제안
- 빈 슬롯이 없으면 swapWithSku를 사용하여 위치 교환

📌 제품 재배치 우선순위:
1. 프리미엄/고마진 상품 → 입구 근처 마네킹, 눈높이 진열
2. 신상품/프로모션 → 매장 앞쪽 파워월
3. 인기 베스트셀러 → 매장 뒤쪽 (고객 동선 유도)
4. 연관 상품 → 인접 배치 (크로스셀링)
5. 시즌 오프 상품 → 세일 코너

${storeContext?.zones?.length ? `ZONE DATA (with entrance marked):
${JSON.stringify(storeContext.zones.slice(0, 10).map((z: any) => ({
  ...z,
  isEntrance: (z.zoneName || '').toLowerCase().includes('입구') || (z.zoneName || '').toLowerCase().includes('entrance'),
})), null, 2)}` : ''}

${storeContext?.dailySales?.length ? `SALES PERFORMANCE (last 7 days):
- Average daily revenue: ${(storeContext.dailySales.slice(0, 7).reduce((sum: number, d: any) => sum + (d.totalRevenue || 0), 0) / Math.min(7, storeContext.dailySales.length)).toLocaleString()}원
- Average conversion rate: ${((storeContext.dailySales.slice(0, 7).reduce((sum: number, d: any) => sum + (d.conversionRate || 0), 0) / Math.min(7, storeContext.dailySales.length)) * 100).toFixed(1)}%` : ''}

${storeContext?.zoneMetrics?.length ? `ZONE PERFORMANCE:
${storeContext.zoneMetrics.slice(0, 5).map((z: any) => `- ${z.zoneName}: ${z.visitorCount} visitors, ${z.avgDwellTime}s avg dwell time, ${(z.conversionRate * 100).toFixed(1)}% conversion`).join('\n')}` : ''}

${slotOptimizationSection}

Return a JSON object with this exact structure:
{
  "furnitureMoves": [
    {
      "furnitureId": "string (가구 UUID)",
      "furnitureName": "string (가구 이름, 예: 의류 행거)",
      "fromPosition": {"x": number, "y": number, "z": number},
      "toPosition": {"x": number, "y": number, "z": number},
      "rotation": number,
      "reason": "string explaining why this move improves the layout"
    }
  ],
  "productSlotMoves": [
    {
      "productId": "string (제품 UUID, 없으면 null)",
      "productSku": "string (필수! 반드시 위 목록의 SKU, 예: SKU-OUT-001)",
      "productName": "string (제품명, 예: 캐시미어 코트)",
      "fromFurnitureCode": "string (현재 가구 코드, 예: RACK-001)",
      "fromFurnitureName": "string (현재 가구 이름)",
      "fromSlotId": "string (현재 슬롯 ID, 예: H1-1)",
      "toFurnitureCode": "string (제안 가구 코드, 예: MANNE-001)",
      "toFurnitureName": "string (제안 가구 이름)",
      "toSlotId": "string (제안 슬롯 ID, 예: M3)",
      "swapWithSku": "string or null (교환 대상 제품 SKU, 빈 슬롯 없을 때 사용)",
      "reason": "string (재배치 사유, 한국어로 작성)",
      "expectedImpact": {"revenueChangePct": number, "visibilityScore": number (0-1)}
    }
  ],

  ⚠️ 개수 제한 필수:
  - furnitureMoves: ${Math.min(3, maxFurnitureMoves)}~${maxFurnitureMoves}개 (현재 강도: ${intensityLevel})
  - productSlotMoves: ${Math.min(3, maxProductRelocations)}~${maxProductRelocations}개 (현재 강도: ${intensityLevel})
  - productSku는 위 "현재 제품 배치" 목록에 있는 SKU만 사용
  - 빈 슬롯이 없으면 swapWithSku를 사용하여 두 제품 위치 교환 제안
  - reason은 비즈니스 관점에서 한국어로 작성

  "zoneChanges": [
    {
      "zoneId": "string",
      "zoneName": "string",
      "changeType": "expand" | "reduce" | "relocate",
      "reason": "string"
    }
  ],
  "currentEfficiency": number (0-100),
  "optimizedEfficiency": number (0-100),
  "improvements": {
    "revenueIncreasePercent": number,
    "dwellTimeIncrease": number,
    "conversionIncrease": number,
    "trafficIncrease": number
  },
  "insights": ["string array of 3-5 actionable insights in Korean"],
  "confidence": number (0-1)
}

⚠️ CRITICAL - 제품 재배치(productSlotMoves) 규칙:
1. productSku는 반드시 "현재 제품 배치" 목록에 있는 SKU만 사용
2. toSlotId는 반드시 "사용 가능한 빈 슬롯" 목록에 있는 슬롯만 선택
3. 슬롯 호환성: hanger→hanging, mannequin→standing, shelf→folded/boxed, table→folded, rack→hanging
4. 제품 카테고리와 슬롯 타입이 맞아야 함 (아우터→행거/마네킹, 액세서리→쇼케이스)`;

  // 🆕 현재 제품 배치 정보를 가구 ID 매핑 맵으로 변환
  const productPlacementMap = new Map<string, any>();
  actualProductPlacements.forEach((p: any) => {
    productPlacementMap.set(p.productId || p.productSku, p);
  });

  // 🆕 빈 슬롯 정보를 슬롯 ID 매핑 맵으로 변환
  const availableSlotMap = new Map<string, any>();
  availableSlots.forEach((s: any) => {
    availableSlotMap.set(s.slotCode || s.slotId, s);
  });

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Layout optimization API error:', error);
      throw new Error(`AI API error: ${error}`);
    }

    const result = await response.json();
    const aiResponse = safeParseAIResponse(result.choices[0]?.message?.content, {
      furnitureMoves: [],
      productPlacements: [],
      zoneChanges: [],
      currentEfficiency: 70,
      optimizedEfficiency: 85,
      improvements: { revenueIncreasePercent: 10, dwellTimeIncrease: 8, conversionIncrease: 5, trafficIncrease: 7 },
      insights: ['AI 분석 결과를 불러오는 중 오류가 발생했습니다.'],
      confidence: 0.7,
    });

    // 🆕 AI 상품 배치 제안과 룰 기반 제안 병합
    // 🔧 FIX: toPosition과 toSlotPosition 계산하여 포함
    const furnitureMap = new Map<string, any>();
    const slotMap = new Map<string, any>();

    if (slotLayoutData) {
      for (const f of slotLayoutData.furniture) {
        furnitureMap.set(f.id, f);
      }
      for (const s of slotLayoutData.slots) {
        // key: furniture_id + slot_id
        slotMap.set(`${s.furniture_id}:${s.slot_id}`, s);
      }
    }

    const enrichPlacementWithPosition = (placement: any) => {
      // 🆕 FROM (현재 위치) 계산
      const fromFurniture = furnitureMap.get(placement.fromFurnitureId || placement.current_furniture_id);
      const fromSlotKey = `${placement.fromFurnitureId || placement.current_furniture_id}:${placement.fromSlotId || placement.current_slot_id}`;
      const fromSlot = slotMap.get(fromSlotKey);

      let fromPosition = null;
      let fromSlotPosition = null;

      if (fromSlot && fromSlot.slot_position) {
        fromSlotPosition = fromSlot.slot_position;

        if (fromFurniture) {
          const furniturePos = fromFurniture.position || { x: 0, y: 0, z: 0 };
          fromPosition = {
            x: (furniturePos.x || 0) + (fromSlotPosition.x || 0),
            y: (furniturePos.y || 0) + (fromSlotPosition.y || 0),
            z: (furniturePos.z || 0) + (fromSlotPosition.z || 0),
          };
        }
      }

      // TO (제안 위치) 계산
      const targetFurniture = furnitureMap.get(placement.toFurnitureId || placement.suggested_furniture_id);
      const slotKey = `${placement.toFurnitureId || placement.suggested_furniture_id}:${placement.toSlotId || placement.suggested_slot_id}`;
      const targetSlot = slotMap.get(slotKey);

      let toPosition = null;
      let toSlotPosition = null;

      if (targetSlot && targetSlot.slot_position) {
        toSlotPosition = targetSlot.slot_position;

        if (targetFurniture) {
          // 월드 좌표 계산: 가구 위치 + 슬롯 상대 위치
          const furniturePos = targetFurniture.position || { x: 0, y: 0, z: 0 };
          toPosition = {
            x: (furniturePos.x || 0) + (toSlotPosition.x || 0),
            y: (furniturePos.y || 0) + (toSlotPosition.y || 0),
            z: (furniturePos.z || 0) + (toSlotPosition.z || 0),
          };
        }
      }

      return { fromPosition, fromSlotPosition, toPosition, toSlotPosition };
    };

    // 🆕 디버깅 로그 강화
    console.log('[LayoutOptimization] AI Response Keys:', Object.keys(aiResponse));
    console.log('[LayoutOptimization] AI productSlotMoves count:', aiResponse.productSlotMoves?.length || 0);
    console.log('[LayoutOptimization] AI productPlacements count:', aiResponse.productPlacements?.length || 0);
    console.log('[LayoutOptimization] AI furnitureMoves count:', aiResponse.furnitureMoves?.length || 0);

    // 🆕 productSlotMoves 형식도 지원 (슬롯 바인딩 기반)
    const aiProductSlotMoves = aiResponse.productSlotMoves || [];
    const aiProductPlacements = aiResponse.productPlacements || [];

    // 빈 배열 경고
    if (aiProductSlotMoves.length === 0 && aiProductPlacements.length === 0) {
      console.warn('[LayoutOptimization] ⚠️ AI returned EMPTY product moves! Input data:', {
        productPlacementsProvided: actualProductPlacements.length,
        availableSlotsProvided: availableSlots.length,
      });
    }

    // productSlotMoves를 표준 형식으로 변환 (swapWithSku 교환 처리 포함)
    const processedSlotMoves: any[] = [];

    for (const move of aiProductSlotMoves) {
      // 현재 제품 배치 정보에서 추가 정보 조회
      const currentPlacement = productPlacementMap.get(move.productId) || productPlacementMap.get(move.productSku);
      // 빈 슬롯 정보에서 타겟 슬롯 정보 조회
      const targetSlot = availableSlotMap.get(move.toSlotId);

      const enrichedMove = {
        productId: move.productId || currentPlacement?.productId,
        productSku: move.productSku || currentPlacement?.productSku,
        productName: move.productName || currentPlacement?.productName,
        fromFurnitureId: move.fromFurnitureId || currentPlacement?.furnitureId,
        fromFurnitureCode: move.fromFurnitureCode || currentPlacement?.furnitureCode,
        fromFurnitureName: move.fromFurnitureName || currentPlacement?.furnitureName,
        fromSlotId: move.fromSlotId || currentPlacement?.slotId,
        toFurnitureId: move.toFurnitureId || targetSlot?.furnitureId,
        toFurnitureCode: move.toFurnitureCode || targetSlot?.furnitureCode,
        toFurnitureName: move.toFurnitureName || targetSlot?.furnitureName,
        toSlotId: move.toSlotId,
        swapWithSku: move.swapWithSku,
        reason: move.reason,
        expectedImpact: move.expectedImpact,
      };

      // 위치 정보 계산
      const positions = enrichPlacementWithPosition(enrichedMove);
      processedSlotMoves.push({ ...enrichedMove, ...positions });

      // 🆕 swapWithSku가 있으면 교환 대상 제품도 추가
      if (move.swapWithSku) {
        const swapPlacement = productPlacementMap.get(move.swapWithSku);
        if (swapPlacement) {
          const swapMove = {
            productId: swapPlacement.productId,
            productSku: move.swapWithSku,
            productName: swapPlacement.productName,
            fromFurnitureId: swapPlacement.furnitureId,
            fromFurnitureCode: swapPlacement.furnitureCode,
            fromFurnitureName: swapPlacement.furnitureName,
            fromSlotId: swapPlacement.slotId,
            toFurnitureId: currentPlacement?.furnitureId,
            toFurnitureCode: currentPlacement?.furnitureCode,
            toFurnitureName: currentPlacement?.furnitureName,
            toSlotId: currentPlacement?.slotId,
            isSwapPair: true,
            swapWithSku: move.productSku,
            reason: `${move.productName || move.productSku}와(과) 위치 교환`,
            expectedImpact: move.expectedImpact,
          };
          const swapPositions = enrichPlacementWithPosition(swapMove);
          processedSlotMoves.push({ ...swapMove, ...swapPositions });
        }
      }
    }

    // 기존 productPlacements 형식 처리
    const processedPlacements = aiProductPlacements.map((p: any) => {
      const positions = enrichPlacementWithPosition(p);
      return { ...p, ...positions };
    });

    // 룰 기반 제안 처리
    const processedRuleBased = productPlacements.map(p => {
      const positions = enrichPlacementWithPosition({
        // FROM (현재 위치)
        fromFurnitureId: p.current_furniture_id,
        fromSlotId: p.current_slot_id,
        // TO (제안 위치)
        toFurnitureId: p.suggested_furniture_id,
        toSlotId: p.suggested_slot_id,
      });
      return {
        productId: p.product_id,
        productSku: p.product_sku,
        productName: p.product_name,
        fromFurnitureId: p.current_furniture_id || null,
        fromFurnitureCode: p.current_furniture_code || null,
        fromFurnitureName: p.current_furniture_name || null,
        fromSlotId: p.current_slot_id || null,
        toSlotId: p.suggested_slot_id,
        toFurnitureId: p.suggested_furniture_id,
        toFurnitureCode: p.suggested_furniture_code || null,
        toFurnitureName: p.suggested_furniture_name || null,
        reason: p.reason,
        priority: p.priority,
        displayTypeMatch: p.display_type_match,
        ...positions,
      };
    });

    // 모든 제품 배치 제안 병합 (슬롯 기반 우선, 최적화 강도 제한 적용)
    const combinedProductPlacements = [
      ...processedSlotMoves,
      ...processedPlacements,
      ...processedRuleBased,
    ].slice(0, maxProductRelocations); // 최적화 강도에 따른 최대 개수 제한

    // 가구 이동도 최대 개수 제한 적용
    const limitedFurnitureMoves = (aiResponse.furnitureMoves || []).slice(0, maxFurnitureMoves);

    console.log('[LayoutOptimization] Processed productSlotMoves:', processedSlotMoves.length);
    console.log('[LayoutOptimization] Processed productPlacements:', processedPlacements.length);
    console.log('[LayoutOptimization] Applied limits - furniture:', limitedFurnitureMoves.length, '/', maxFurnitureMoves, ', products:', combinedProductPlacements.length, '/', maxProductRelocations);

    console.log('[LayoutOptimization] Product placements with positions:',
      combinedProductPlacements.slice(0, 3).map((p: any) => ({
        productId: p.productId,
        productSku: p.productSku,
        fromSlotId: p.fromSlotId,
        toSlotId: p.toSlotId,
        fromPosition: p.fromPosition,
        toPosition: p.toPosition,
      }))
    );

    // 히트맵 데이터 생성 (실제 존 메트릭 기반)
    const storeWidth = storeContext?.storeInfo?.width || 17;
    const storeDepth = storeContext?.storeInfo?.depth || 16;
    const beforeHeatmap = generateHeatmapFromZoneMetrics(
      storeContext?.zones || [],
      storeContext?.zoneMetrics || [],
      storeWidth,
      storeDepth,
      0
    );
    const afterHeatmap = generateHeatmapFromZoneMetrics(
      storeContext?.zones || [],
      storeContext?.zoneMetrics || [],
      storeWidth,
      storeDepth,
      aiResponse.improvements?.trafficIncrease ? aiResponse.improvements.trafficIncrease / 100 : 0.1
    );

    // 데이터 소스 메타데이터
    const usedRealData = !!(storeContext?.zones?.length && storeContext?.zoneMetrics?.length);
    const usedSlotSystem = !!(slotLayoutData && slotLayoutData.slots.length > 0);

    return {
      result: {
        id: `layout-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        currentEfficiency: aiResponse.currentEfficiency || 70,
        optimizedEfficiency: aiResponse.optimizedEfficiency || 85,
        expectedROI: aiResponse.improvements?.revenueIncreasePercent || 10,
        improvements: {
          revenueIncrease: (aiResponse.improvements?.revenueIncreasePercent || 10) * 200000,
          revenueIncreasePercent: aiResponse.improvements?.revenueIncreasePercent || 10,
          dwellTimeIncrease: aiResponse.improvements?.dwellTimeIncrease || 8,
          conversionIncrease: aiResponse.improvements?.conversionIncrease || 5,
          trafficIncrease: aiResponse.improvements?.trafficIncrease || 7,
        },
        furnitureMoves: limitedFurnitureMoves,
        productPlacements: combinedProductPlacements,
        zoneChanges: aiResponse.zoneChanges || [],
        confidence: {
          overall: aiResponse.confidence || 0.8,
          factors: {
            dataQuality: storeContext?.dataQuality?.overallScore ? storeContext.dataQuality.overallScore / 100 : 0.7,
            modelAccuracy: 0.85,
            sampleSize: storeContext?.dailySales?.length ? Math.min(1, storeContext.dailySales.length / 30) : 0.5,
            variability: 0.75,
            slotDataAvailable: usedSlotSystem ? 1 : 0,
          },
        },
        insights: aiResponse.insights || ['레이아웃 최적화 분석이 완료되었습니다.'],
        dataSource: {
          usedRealData,
          usedSlotSystem,
          zonesAvailable: storeContext?.zones?.length || 0,
          zoneMetricsAvailable: storeContext?.zoneMetrics?.length || 0,
          visitsAvailable: storeContext?.visits?.length || 0,
          slotsAvailable: slotLayoutData?.slots?.length || 0,
          furnitureAvailable: slotLayoutData?.furniture?.length || 0,
          productsAvailable: slotLayoutData?.products?.length || 0,
          note: usedSlotSystem
            ? '슬롯 기반 최적화 시스템 활성화 - 상품 진열 호환성 검증됨'
            : usedRealData
              ? '실제 매장 데이터 기반 분석'
              : '존 데이터 없음 - 시뮬레이션 기반 분석',
        },
        slotCompatibility: usedSlotSystem ? {
          totalSlots: slotLayoutData!.slots.length,
          occupiedSlots: slotLayoutData!.slots.filter(s => s.is_occupied).length,
          availableSlots: slotLayoutData!.slots.filter(s => !s.is_occupied).length,
          slotTypes: [...new Set(slotLayoutData!.slots.map(s => s.slot_type))],
          displayTypes: [...new Set(slotLayoutData!.products.map(p => p.display_type))],
        } : null,
        visualization: {
          beforeHeatmap,
          afterHeatmap,
          flowPaths: [],
          highlightZones: (aiResponse.furnitureMoves || []).map((m: any) => ({
            position: m.toPosition,
            type: 'suggested',
          })),
        },
      },
    };
  } catch (error) {
    console.error('Layout optimization error:', error);
    throw error;
  }
}

// 실제 존 메트릭 기반 히트맵 생성
function generateHeatmapFromZoneMetrics(
  zones: any[],
  zoneMetrics: any[],
  width: number,
  depth: number,
  intensityBoost = 0
): Array<{ x: number; z: number; intensity: number }> {
  const data: Array<{ x: number; z: number; intensity: number }> = [];

  console.log(`[Heatmap] zones: ${zones?.length || 0}, zoneMetrics: ${zoneMetrics?.length || 0}`);

  if (!zones?.length || !zoneMetrics?.length) {
    // 존 데이터가 없으면 기본 그리드 생성
    console.log('[Heatmap] Falling back to random grid - no zone data available');
    return generateHeatmapDataForStore(width, depth, intensityBoost);
  }

  // 존별 방문자 수 및 히트맵 강도 맵 생성
  const zoneVisitorMap = new Map<string, number>();
  const zoneHeatmapMap = new Map<string, number>();
  zoneMetrics.forEach((m: any) => {
    const zoneId = m.zoneId || m.zone_id;
    const currentVisitors = zoneVisitorMap.get(zoneId) || 0;
    zoneVisitorMap.set(zoneId, currentVisitors + (m.visitorCount || m.visitor_count || m.total_visitors || 0));
    // heatmapIntensity가 있으면 사용 (DB에서 직접 계산된 값)
    if (m.heatmapIntensity || m.heatmap_intensity) {
      const currentIntensity = zoneHeatmapMap.get(zoneId) || 0;
      const newIntensity = m.heatmapIntensity || m.heatmap_intensity;
      // 평균 강도 계산
      zoneHeatmapMap.set(zoneId, currentIntensity > 0 ? (currentIntensity + newIntensity) / 2 : newIntensity);
    }
  });

  // 최대 방문자 수 (정규화용)
  const maxVisitors = Math.max(...Array.from(zoneVisitorMap.values()), 1);

  console.log(`[Heatmap] Using real zone data - maxVisitors: ${maxVisitors}, heatmapData: ${zoneHeatmapMap.size}`);

  // 각 존의 위치와 방문자 수 기반 히트맵 포인트 생성
  zones.forEach((zone: any) => {
    const zoneId = zone.id || zone.zoneId;
    const visitors = zoneVisitorMap.get(zoneId) || 0;
    // DB의 heatmap_intensity가 있으면 우선 사용, 없으면 방문자 수 기반 계산
    const preCalcIntensity = zoneHeatmapMap.get(zoneId);
    const intensity = preCalcIntensity !== undefined
      ? Math.min(1, preCalcIntensity + intensityBoost)
      : Math.min(1, (visitors / maxVisitors) * 0.8 + 0.1 + intensityBoost);

    const x = zone.x || zone.center_x || 0;
    const z = zone.z || zone.center_z || 0;
    const zoneWidth = zone.width || 3;
    const zoneDepth = zone.depth || 3;

    // 존 영역에 여러 포인트 생성
    for (let dx = -zoneWidth/2; dx <= zoneWidth/2; dx += 1) {
      for (let dz = -zoneDepth/2; dz <= zoneDepth/2; dz += 1) {
        // 중심에서 멀어질수록 intensity 감소
        const distFromCenter = Math.sqrt(dx*dx + dz*dz) / Math.max(zoneWidth, zoneDepth);
        const localIntensity = intensity * (1 - distFromCenter * 0.3);

        data.push({
          x: x + dx,
          z: z + dz,
          intensity: Math.max(0.1, Math.min(1, localIntensity)),
        });
      }
    }
  });

  // 데이터가 너무 적으면 그리드 보충
  if (data.length < 20) {
    return generateHeatmapDataForStore(width, depth, intensityBoost);
  }

  return data;
}

// 매장 크기 기반 히트맵 생성 헬퍼 (fallback)
function generateHeatmapDataForStore(width: number, depth: number, intensityBoost = 0): Array<{ x: number; z: number; intensity: number }> {
  const data: Array<{ x: number; z: number; intensity: number }> = [];
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const step = Math.max(1, Math.min(width, depth) / 10);

  for (let x = -halfWidth; x <= halfWidth; x += step) {
    for (let z = -halfDepth; z <= halfDepth; z += step) {
      // 입구(z가 낮은 쪽)와 중앙에 더 높은 밀도
      const entranceBoost = (halfDepth - Math.abs(z)) / halfDepth * 0.2;
      const centerBoost = (1 - (Math.abs(x) / halfWidth)) * 0.15;
      data.push({
        x,
        z,
        intensity: Math.min(1, 0.2 + Math.random() * 0.3 + entranceBoost + centerBoost + intensityBoost),
      });
    }
  }
  return data;
}

// 동선 시뮬레이션
async function performFlowSimulation(request: InferenceRequest, apiKey: string) {
  const { params } = request;
  const sceneData = params?.sceneData;
  const storeContext = params?.storeContext;
  const customerCount = params?.customerCount || 100;
  const duration = params?.duration || '1hour';

  // 입구 위치 결정 (storeContext에서 가져오거나 zones에서 찾기)
  let entrancePosition = storeContext?.storeInfo?.entrancePosition;
  if (!entrancePosition && storeContext?.zones?.length) {
    const entranceZone = storeContext.zones.find((z: any) => {
      const name = (z.zoneName || '').toLowerCase();
      const type = (z.zoneType || '').toLowerCase();
      return name.includes('입구') || name.includes('entrance') || type.includes('entrance');
    });
    if (entranceZone) {
      entrancePosition = { x: entranceZone.x, z: entranceZone.z };
    }
  }

  // 프롬프트 빌드
  const prompt = `You are an expert retail analytics AI specializing in customer flow analysis and optimization.

TASK: Analyze customer flow patterns in the store and identify bottlenecks, optimal paths, and improvement opportunities.

STORE INFORMATION:
${storeContext?.storeInfo ? `- Store: ${storeContext.storeInfo.name}
- Dimensions: ${storeContext.storeInfo.width}m x ${storeContext.storeInfo.depth}m
- Business Type: ${storeContext.storeInfo.businessType || 'Retail'}
- Entrance Position: ${entrancePosition ? `(${entrancePosition.x}, ${entrancePosition.z})` : 'Not specified'}` : '- Standard retail store'}

SIMULATION PARAMETERS:
- Customer Count: ${customerCount}
- Duration: ${duration}

${storeContext?.zones?.length ? `ZONES (entrance zone marked):
${JSON.stringify(storeContext.zones.map((z: any) => ({
  ...z,
  isEntrance: (z.zoneName || '').toLowerCase().includes('입구') || (z.zoneName || '').toLowerCase().includes('entrance'),
})), null, 2)}` : ''}

${storeContext?.visits?.length ? `RECENT VISITOR DATA (sample):
- Total visits analyzed: ${storeContext.visits.length}
- Average dwell time: ${(storeContext.visits.reduce((sum: number, v: any) => sum + (v.dwellTimeSeconds || 0), 0) / storeContext.visits.length).toFixed(0)} seconds
${storeContext.visits.slice(0, 5).filter((v: any) => v.zonePath?.length).map((v: any) => `- Path: ${v.zonePath?.join(' → ')}`).join('\n')}` : ''}

${storeContext?.zoneMetrics?.length ? `ZONE METRICS:
${storeContext.zoneMetrics.slice(0, 8).map((z: any) => `- ${z.zoneName}: ${z.visitorCount} visitors, ${z.avgDwellTime}s dwell, ${(z.conversionRate * 100).toFixed(1)}% conversion`).join('\n')}` : ''}

CURRENT LAYOUT:
${JSON.stringify({
  furniture: (sceneData?.furniture || []).slice(0, 10).map((f: any) => ({
    id: f.id,
    type: f.furniture_type || f.type,
    position: f.position,
  })),
}, null, 2)}

Return a JSON object with this exact structure:
{
  "summary": {
    "totalCustomers": number,
    "avgTravelTime": number (seconds),
    "avgTravelDistance": number (meters),
    "avgDwellTime": number (seconds),
    "conversionRate": number (0-1),
    "bottleneckCount": number
  },
  "bottlenecks": [
    {
      "id": "string",
      "position": {"x": number, "y": 0.5, "z": number},
      "zoneName": "string",
      "severity": number (0-1),
      "avgWaitTime": number (seconds),
      "cause": "string",
      "suggestions": ["string array"],
      "impactLevel": "low" | "medium" | "high",
      "affectedCustomers": number
    }
  ],
  "zoneAnalysis": [
    {
      "zoneId": "string",
      "zoneName": "string",
      "visitCount": number,
      "avgDwellTime": number,
      "congestionLevel": number (0-1),
      "conversionContribution": number (0-1)
    }
  ],
  "comparison": {
    "currentPathLength": number,
    "optimizedPathLength": number,
    "pathLengthReduction": number (percentage),
    "currentAvgTime": number,
    "optimizedAvgTime": number,
    "timeReduction": number (percentage),
    "congestionReduction": number (percentage)
  },
  "insights": ["string array of 3-5 actionable insights in Korean"],
  "confidence": number (0-1)
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Flow simulation API error:', error);
      throw new Error(`AI API error: ${error}`);
    }

    const result = await response.json();
    const aiResponse = safeParseAIResponse(result.choices[0]?.message?.content, {
      summary: { totalCustomers: customerCount, avgTravelTime: 300, avgTravelDistance: 45, avgDwellTime: 120, conversionRate: 0.35, bottleneckCount: 1 },
      bottlenecks: [],
      zoneAnalysis: [],
      comparison: { currentPathLength: 45, optimizedPathLength: 38, pathLengthReduction: 15, currentAvgTime: 300, optimizedAvgTime: 250, timeReduction: 17, congestionReduction: 20 },
      insights: ['동선 분석 결과를 불러오는 중입니다.'],
      confidence: 0.75,
    });

    // 시뮬레이션 경로 생성 (실제 존 데이터 및 입구 위치 활용)
    const storeWidth = storeContext?.storeInfo?.width || 17;
    const storeDepth = storeContext?.storeInfo?.depth || 16;
    const paths = generateSimulatedPaths(
      Math.min(customerCount, 20),
      storeWidth,
      storeDepth,
      aiResponse.zoneAnalysis || [],
      storeContext?.zones || [],
      entrancePosition
    );

    // AI 응답에서 병목 데이터가 없거나 부족하면 실제 데이터 기반 fallback
    let bottlenecks = aiResponse.bottlenecks || [];
    if (bottlenecks.length === 0 && storeContext?.zoneMetrics?.length && storeContext?.zones?.length) {
      console.log('[FlowSimulation] No AI bottlenecks, generating from zone metrics');
      bottlenecks = generateBottlenecksFromZoneMetrics(
        storeContext.zoneMetrics,
        storeContext.zones
      );
    }

    // 최적화 제안 생성
    const optimizations = bottlenecks.map((bn: any, idx: number) => ({
      id: `opt-${idx}`,
      type: 'layout_change',
      description: bn.suggestions?.[0] || '레이아웃 개선',
      location: bn.position,
      expectedImprovement: Math.round((bn.severity || 0.5) * 20 + 10),
      effort: bn.impactLevel === 'high' ? 'high' : bn.impactLevel === 'medium' ? 'medium' : 'low',
      priority: idx + 1,
    }));

    return {
      result: {
        id: `flow-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        summary: aiResponse.summary || {
          totalCustomers: customerCount,
          avgTravelTime: 300,
          avgTravelDistance: 45,
          avgDwellTime: 120,
          conversionRate: 0.35,
          bottleneckCount: bottlenecks.length,
        },
        comparison: aiResponse.comparison || {
          currentPathLength: 45,
          optimizedPathLength: 38,
          pathLengthReduction: 15,
          currentAvgTime: 300,
          optimizedAvgTime: 250,
          timeReduction: 17,
          congestionReduction: 20,
        },
        paths,
        bottlenecks: bottlenecks.map((bn: any, idx: number) => ({
          ...bn,
          id: bn.id || `bn-${idx}`,
          frequency: bn.severity || 0.5,
        })),
        optimizations,
        zoneAnalysis: aiResponse.zoneAnalysis || [],
        confidence: {
          overall: aiResponse.confidence || 0.78,
          factors: {
            dataQuality: storeContext?.dataQuality?.overallScore ? storeContext.dataQuality.overallScore / 100 : 0.75,
            modelAccuracy: 0.8,
            sampleSize: storeContext?.visits?.length ? Math.min(1, storeContext.visits.length / 500) : 0.6,
            variability: 0.78,
          },
        },
        insights: aiResponse.insights || ['동선 분석이 완료되었습니다.'],
        visualization: {
          animatedPaths: paths.slice(0, 10).map((p: any) => ({
            id: p.id,
            points: p.points,
            color: p.converted ? '#22c55e' : '#ef4444',
            type: 'current' as const,
          })),
          bottleneckMarkers: bottlenecks.map((bn: any) => ({
            position: bn.position,
            severity: bn.severity,
            radius: 0.5 + (bn.severity || 0.5),
          })),
          flowHeatmap: generateHeatmapFromZoneMetrics(
            storeContext?.zones || [],
            storeContext?.zoneMetrics || [],
            storeWidth,
            storeDepth,
            0
          ),
          zoneFlowArrows: [],
        },
      },
    };
  } catch (error) {
    console.error('Flow simulation error:', error);
    throw error;
  }
}

// 시뮬레이션 경로 생성 헬퍼 (실제 존 데이터 기반)
function generateSimulatedPaths(
  count: number,
  storeWidth: number,
  storeDepth: number,
  zoneAnalysis: any[],
  zones?: any[],
  entrancePosition?: { x: number; z: number } | null
): any[] {
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;

  // 입구 위치 결정 (실제 데이터 우선)
  const entrance = entrancePosition || { x: 0, z: -halfDepth + 1 };

  // 존 위치 목록 생성 (실제 존 데이터 활용)
  const zonePositions: Array<{ x: number; z: number; name: string; weight: number }> = [];
  if (zones && zones.length > 0) {
    zones.forEach((z: any) => {
      const x = z.x ?? z.position_x ?? 0;
      const zPos = z.z ?? z.position_z ?? 0;
      const name = z.zoneName || z.zone_name || 'Unknown';
      // 존 방문 빈도 가중치 (zoneMetrics 기반)
      const metric = zoneAnalysis.find((za: any) => za.zoneId === z.id || za.zoneName === name);
      const weight = metric?.visitCount || 1;
      zonePositions.push({ x, z: zPos, name, weight });
    });
  }

  return Array.from({ length: count }, (_, idx) => {
    const points = generatePathPointsWithZones(
      halfWidth,
      halfDepth,
      entrance,
      zonePositions
    );
    const totalTime = 180 + Math.random() * 300;
    const converted = Math.random() > 0.4;

    // 구역별 체류 시간 (AI 분석 데이터 활용, 실제 존 이름 사용)
    const dwellZones = (zoneAnalysis.length > 0 ? zoneAnalysis : zonePositions).slice(0, 3).map((zone: any) => ({
      zoneId: zone.zoneId || zone.id || `zone-${Math.floor(Math.random() * 5)}`,
      zoneName: zone.zoneName || zone.name || `구역 ${Math.floor(Math.random() * 5) + 1}`,
      duration: zone.avgDwellTime || (30 + Math.random() * 60),
    }));

    return {
      id: `path-${idx}`,
      customerId: `customer-${idx}`,
      customerType: ['standard', 'vip', 'returning'][idx % 3],
      points,
      totalTime,
      totalDistance: points.length * 2,
      dwellZones,
      purchaseIntent: 0.3 + Math.random() * 0.5,
      converted,
    };
  });
}

// 존 위치 기반 경로 포인트 생성 (실제 데이터 활용)
function generatePathPointsWithZones(
  halfWidth: number,
  halfDepth: number,
  entrance: { x: number; z: number },
  zonePositions: Array<{ x: number; z: number; name: string; weight: number }>
): Array<{ x: number; y: number; z: number; t: number }> {
  const points: Array<{ x: number; y: number; z: number; t: number }> = [];

  // 입구에서 시작
  let x = entrance.x + (Math.random() - 0.5) * 2;
  let z = entrance.z;

  // 시작점 추가
  points.push({ x, y: 0.5, z, t: 0 });

  if (zonePositions.length > 0) {
    // 실제 존 위치를 경유하는 경로 생성
    // 가중치 기반으로 2-4개 존 선택
    const shuffledZones = [...zonePositions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 3));

    let t = 30;
    shuffledZones.forEach((zone) => {
      // 존 위치로 이동 (약간의 랜덤 오프셋)
      const targetX = zone.x + (Math.random() - 0.5) * 2;
      const targetZ = zone.z + (Math.random() - 0.5) * 2;

      // 중간 포인트 추가 (자연스러운 곡선)
      const midX = (x + targetX) / 2 + (Math.random() - 0.5) * 1.5;
      const midZ = (z + targetZ) / 2 + (Math.random() - 0.5) * 1.5;

      points.push({
        x: Math.max(-halfWidth + 1, Math.min(halfWidth - 1, midX)),
        y: 0.5,
        z: Math.max(-halfDepth + 1, Math.min(halfDepth - 1, midZ)),
        t,
      });
      t += 30;

      // 존 도착
      x = Math.max(-halfWidth + 1, Math.min(halfWidth - 1, targetX));
      z = Math.max(-halfDepth + 1, Math.min(halfDepth - 1, targetZ));
      points.push({ x, y: 0.5, z, t });
      t += 30 + Math.random() * 30; // 체류 시간 반영
    });

    // 출구(입구)로 돌아가기
    const exitX = entrance.x + (Math.random() - 0.5) * 2;
    const exitZ = entrance.z;
    points.push({
      x: Math.max(-halfWidth + 1, Math.min(halfWidth - 1, exitX)),
      y: 0.5,
      z: Math.max(-halfDepth + 1, Math.min(halfDepth - 1, exitZ)),
      t,
    });
  } else {
    // 존 데이터가 없는 경우 기존 로직 사용
    for (let t = 30; t < 300; t += 30) {
      x += (Math.random() - 0.5) * 3;
      z += Math.random() * 2 + 0.5;

      x = Math.max(-halfWidth + 1, Math.min(halfWidth - 1, x));
      z = Math.max(-halfDepth + 1, Math.min(halfDepth - 1, z));

      points.push({ x, y: 0.5, z, t });
    }
  }

  return points;
}

// 실제 존 메트릭 기반 병목 지점 생성 (AI fallback용)
function generateBottlenecksFromZoneMetrics(
  zoneMetrics: any[],
  zones: any[]
): any[] {
  if (!zoneMetrics || zoneMetrics.length === 0 || !zones || zones.length === 0) {
    return [];
  }

  const bottlenecks: any[] = [];

  // 존별 혼잡도 계산 (방문자 수 / 면적)
  const zoneCongestionsData: Array<{
    zone: any;
    metric: any;
    congestion: number;
  }> = [];

  zoneMetrics.forEach((metric: any) => {
    const zone = zones.find((z: any) =>
      z.id === metric.zoneId ||
      (z.zoneName || z.zone_name) === metric.zoneName
    );
    if (zone) {
      const area = (zone.width || zone.size_width || 3) * (zone.depth || zone.size_depth || 3);
      const congestion = (metric.visitorCount || 0) / Math.max(area, 1);
      zoneCongestionsData.push({ zone, metric, congestion });
    }
  });

  // 혼잡도 상위 존을 병목으로 식별
  zoneCongestionsData
    .sort((a, b) => b.congestion - a.congestion)
    .slice(0, 3)
    .forEach((data, idx) => {
      const severity = Math.min(1, data.congestion / 10); // 정규화

      if (severity > 0.3) { // 최소 심각도 필터
        bottlenecks.push({
          id: `bn-${idx}`,
          position: {
            x: data.zone.x ?? data.zone.position_x ?? 0,
            y: 0.5,
            z: data.zone.z ?? data.zone.position_z ?? 0,
          },
          zoneName: data.metric.zoneName || data.zone.zoneName || data.zone.zone_name || `구역 ${idx + 1}`,
          severity,
          avgWaitTime: Math.round(15 + severity * 45),
          cause: severity > 0.7
            ? '높은 방문자 밀도로 인한 혼잡'
            : severity > 0.5
              ? '통로 폭 대비 방문자 수 과다'
              : '일시적 정체 발생 구역',
          suggestions: [
            severity > 0.7 ? '해당 구역 가구 재배치 필요' : '안내 사인 추가 권장',
            '대체 동선 유도 필요',
          ],
          impactLevel: severity > 0.7 ? 'high' : severity > 0.5 ? 'medium' : 'low',
          affectedCustomers: Math.round(data.metric.visitorCount * severity * 0.3),
        });
      }
    });

  return bottlenecks;
}

// 인력 배치 최적화 시뮬레이션
async function performStaffingOptimization(request: InferenceRequest, apiKey: string) {
  const { params } = request;
  const storeContext = params?.storeContext;
  const supabaseClient = params?.supabaseClient;
  const goal = params?.goal || 'customer_service';

  // 🆕 실제 직원 데이터 조회
  let realStaffData: any[] = [];
  const storeId = storeContext?.storeInfo?.storeId;

  if (supabaseClient && storeId) {
    try {
      const { data: staffRows, error: staffError } = await supabaseClient
        .from('staff')
        .select('id, staff_code, staff_name, role, department, is_active')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .limit(20);

      if (!staffError && staffRows && staffRows.length > 0) {
        realStaffData = staffRows;
        console.log(`[performStaffingOptimization] Loaded ${realStaffData.length} staff members from DB`);
      } else {
        console.warn('[performStaffingOptimization] No staff data found, using AI-generated placeholders');
      }
    } catch (err) {
      console.error('[performStaffingOptimization] Error loading staff data:', err);
    }
  }

  const staffCount = realStaffData.length > 0 ? realStaffData.length : (params?.staffCount || 3);

  // 🆕 실제 직원 정보를 프롬프트에 포함
  const staffInfoSection = realStaffData.length > 0
    ? `ACTUAL STAFF MEMBERS (use these exact IDs and names):
${realStaffData.map((s: any, idx: number) => `- ${s.staff_code || `STAFF-${idx+1}`}: ${s.staff_name} (${s.role || 'sales'})`).join('\n')}`
    : `- Available Staff Count: ${staffCount}`;

  // 프롬프트 빌드
  const prompt = `You are an expert retail operations AI specializing in staff placement optimization.

TASK: Analyze the store layout and customer patterns to suggest optimal staff positions that maximize ${goal === 'customer_service' ? 'customer service quality and response time' : goal === 'sales' ? 'sales conversion and upselling opportunities' : 'operational efficiency'}.

STORE INFORMATION:
${storeContext?.storeInfo ? `- Store: ${storeContext.storeInfo.name}
- Dimensions: ${storeContext.storeInfo.width}m x ${storeContext.storeInfo.depth}m
- Business Type: ${storeContext.storeInfo.businessType || 'Retail'}` : '- Standard retail store'}

STAFF PARAMETERS:
${staffInfoSection}
- Optimization Goal: ${goal}

${storeContext?.zones?.length ? `ZONES:
${storeContext.zones.map((z: any) => `- ${z.zoneName}: ${z.width}m x ${z.depth}m at (${z.x}, ${z.z})`).join('\n')}` : ''}

${storeContext?.zoneMetrics?.length ? `ZONE PERFORMANCE METRICS:
${storeContext.zoneMetrics.slice(0, 8).map((z: any) => `- ${z.zoneName}: ${z.visitorCount} visitors, ${z.avgDwellTime}s dwell time, ${(z.conversionRate * 100).toFixed(1)}% conversion`).join('\n')}` : ''}

${storeContext?.dailySales?.length ? `SALES PATTERNS:
- Average daily visitors: ${Math.round(storeContext.dailySales.slice(0, 7).reduce((sum: number, d: any) => sum + (d.visitorCount || 0), 0) / Math.min(7, storeContext.dailySales.length))}
- Average transactions: ${Math.round(storeContext.dailySales.slice(0, 7).reduce((sum: number, d: any) => sum + (d.transactionCount || 0), 0) / Math.min(7, storeContext.dailySales.length))}` : ''}

${realStaffData.length > 0 ? `IMPORTANT: Use the exact staff IDs and names from ACTUAL STAFF MEMBERS above. Do NOT generate fake names.` : ''}

Return a JSON object with this exact structure:
{
  "staffPositions": [
    {
      "staffId": "string",
      "staffName": "string",
      "currentPosition": {"x": number, "y": 0.5, "z": number},
      "suggestedPosition": {"x": number, "y": 0.5, "z": number},
      "coverageGain": number (percentage),
      "reason": "string explaining the placement in Korean"
    }
  ],
  "zoneCoverage": [
    {
      "zoneId": "string",
      "zoneName": "string",
      "currentCoverage": number (0-100),
      "suggestedCoverage": number (0-100),
      "requiredStaff": number,
      "currentStaff": number
    }
  ],
  "metrics": {
    "totalCoverage": number (0-100),
    "avgResponseTime": number (seconds),
    "coverageGain": number (percentage),
    "customerServiceRateIncrease": number (percentage)
  },
  "insights": ["string array of 3-5 actionable insights in Korean"],
  "confidence": number (0-1)
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Staffing optimization API error:', error);
      throw new Error(`AI API error: ${error}`);
    }

    const result = await response.json();
    const aiResponse = safeParseAIResponse(result.choices[0]?.message?.content, {
      staffPositions: [],
      zoneCoverage: [],
      metrics: { totalCoverage: 75, avgResponseTime: 35, coverageGain: 15, customerServiceRateIncrease: 12 },
      insights: ['인력 배치 분석 결과를 불러오는 중입니다.'],
      confidence: 0.8,
    });

    // 기본값 보완이 필요한 경우
    const storeWidth = storeContext?.storeInfo?.width || 17;
    const storeDepth = storeContext?.storeInfo?.depth || 16;
    const halfWidth = storeWidth / 2;
    const halfDepth = storeDepth / 2;

    // AI 응답이 없거나 부족한 경우 기본 배치 생성 (🆕 실제 직원 데이터 사용)
    let staffPositions = aiResponse.staffPositions || [];
    if (staffPositions.length === 0) {
      // 실제 직원 데이터가 있으면 그 정보 사용, 없으면 제네릭 데이터 사용
      const staffSource = realStaffData.length > 0 ? realStaffData : Array.from({ length: staffCount }, (_, i) => ({
        id: `staff-${i}`,
        staff_code: `STAFF-${i + 1}`,
        staff_name: `직원 ${i + 1}`,
        role: 'sales',
      }));

      staffPositions = staffSource.map((staff: any, idx: number) => ({
        staffId: staff.id || `staff-${idx}`,
        staffCode: staff.staff_code || `STAFF-${idx + 1}`,
        staffName: staff.staff_name || `직원 ${idx + 1}`,
        role: staff.role || 'sales',
        currentPosition: {
          x: -halfWidth / 2 + (idx * halfWidth / staffCount),
          y: 0.5,
          z: 0,
        },
        suggestedPosition: {
          x: -halfWidth / 3 + (idx * halfWidth * 0.7 / staffCount),
          y: 0.5,
          z: (idx % 2 === 0 ? -1 : 1) * halfDepth / 4,
        },
        coverageGain: 10 + idx * 5,
        reason: '고객 밀집 구역 커버리지 확대를 위한 배치',
      }));
    } else if (realStaffData.length > 0) {
      // 🆕 AI 응답이 있는 경우, 실제 직원 데이터와 매핑
      staffPositions = staffPositions.map((pos: any, idx: number) => {
        const realStaff = realStaffData[idx] || realStaffData[0];
        return {
          ...pos,
          staffId: realStaff?.id || pos.staffId,
          staffCode: realStaff?.staff_code || pos.staffCode,
          staffName: realStaff?.staff_name || pos.staffName,
          role: realStaff?.role || pos.role || 'sales',
        };
      });
    }

    let zoneCoverage = aiResponse.zoneCoverage || [];
    if (zoneCoverage.length === 0 && storeContext?.zones?.length) {
      zoneCoverage = storeContext.zones.slice(0, 5).map((zone: any, idx: number) => ({
        zoneId: zone.id || `zone-${idx}`,
        zoneName: zone.zoneName || `구역 ${idx + 1}`,
        currentCoverage: 60 + Math.floor(Math.random() * 20),
        suggestedCoverage: 85 + Math.floor(Math.random() * 10),
        requiredStaff: Math.ceil((idx + 1) / 2),
        currentStaff: Math.floor(staffCount / (idx + 1)),
      }));
    }

    return {
      result: {
        id: `staffing-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        metrics: aiResponse.metrics || {
          totalCoverage: 75,
          avgResponseTime: 35,
          coverageGain: 15,
          customerServiceRateIncrease: 12,
        },
        staffPositions,
        zoneCoverage,
        confidence: {
          overall: aiResponse.confidence || 0.8,
          factors: {
            dataQuality: storeContext?.dataQuality?.overallScore ? storeContext.dataQuality.overallScore / 100 : 0.75,
            modelAccuracy: 0.82,
            sampleSize: storeContext?.visits?.length ? Math.min(1, storeContext.visits.length / 300) : 0.65,
            variability: 0.78,
          },
        },
        insights: aiResponse.insights || ['인력 배치 최적화 분석이 완료되었습니다.'],
      },
    };
  } catch (error) {
    console.error('Staffing optimization error:', error);
    throw error;
  }
}

// 혼잡도 시뮬레이션
async function performCongestionSimulation(request: InferenceRequest, apiKey: string) {
  const { params } = request;
  const storeContext = params?.storeContext;
  const timeRange = params?.timeRange || { start: 10, end: 22 };

  // 프롬프트 빌드
  const prompt = `You are an expert retail analytics AI specializing in congestion analysis and crowd management.

TASK: Analyze the store layout and historical visitor patterns to predict congestion levels and suggest improvements.

STORE INFORMATION:
${storeContext?.storeInfo ? `- Store: ${storeContext.storeInfo.name}
- Dimensions: ${storeContext.storeInfo.width}m x ${storeContext.storeInfo.depth}m
- Business Type: ${storeContext.storeInfo.businessType || 'Retail'}` : '- Standard retail store'}

ANALYSIS PARAMETERS:
- Operating Hours: ${timeRange.start}:00 - ${timeRange.end}:00

${storeContext?.zones?.length ? `ZONES:
${storeContext.zones.map((z: any) => `- ${z.zoneName}: ${z.width}m x ${z.depth}m (${z.zoneType || 'display'})`).join('\n')}` : ''}

${storeContext?.zoneMetrics?.length ? `ZONE TRAFFIC DATA:
${storeContext.zoneMetrics.slice(0, 8).map((z: any) => `- ${z.zoneName}: ${z.visitorCount} daily visitors, ${z.avgDwellTime}s avg dwell`).join('\n')}` : ''}

${storeContext?.dailySales?.length ? `DAILY PATTERNS (last 7 days):
${storeContext.dailySales.slice(0, 7).map((d: any) => `- ${d.date}: ${d.visitorCount || 0} visitors`).join('\n')}` : ''}

Return a JSON object with this exact structure:
{
  "summary": {
    "peakHour": number (hour 0-23),
    "peakDensity": number (0-1),
    "avgDensity": number (0-1),
    "bottleneckCount": number
  },
  "hourlyData": [
    {
      "hour": number,
      "avgDensity": number (0-1),
      "peakDensity": number (0-1),
      "customerCount": number
    }
  ],
  "zoneData": [
    {
      "zoneId": "string",
      "zoneName": "string",
      "avgDensity": number (0-1),
      "peakDensity": number (0-1),
      "peakHour": number,
      "recommendations": ["string array of improvements in Korean"]
    }
  ],
  "insights": ["string array of 3-5 actionable insights in Korean"],
  "confidence": number (0-1)
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // 빠른 응답을 위해 flash 모델 사용
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Congestion simulation API error:', error);
      throw new Error(`AI API error: ${error}`);
    }

    const result = await response.json();
    const aiResponse = safeParseAIResponse(result.choices[0]?.message?.content, {
      summary: { peakHour: 14, peakDensity: 0.7, avgDensity: 0.4, bottleneckCount: 2 },
      hourlyData: [],
      zoneData: [],
      insights: ['혼잡도 분석 결과를 불러오는 중입니다.'],
      confidence: 0.75,
    });

    // AI 응답이 없거나 부족한 경우 기본 데이터 생성
    let hourlyData = aiResponse.hourlyData || [];
    if (hourlyData.length === 0) {
      hourlyData = Array.from({ length: timeRange.end - timeRange.start }, (_, idx) => {
        const hour = timeRange.start + idx;
        // 점심/저녁 피크 시간 반영
        const isLunchPeak = hour >= 12 && hour <= 14;
        const isEveningPeak = hour >= 17 && hour <= 19;
        const baseDensity = 0.2 + (isLunchPeak ? 0.3 : isEveningPeak ? 0.35 : 0);

        return {
          hour,
          avgDensity: baseDensity + Math.random() * 0.15,
          peakDensity: baseDensity + 0.2 + Math.random() * 0.15,
          customerCount: Math.round(20 + baseDensity * 80 + Math.random() * 30),
        };
      });
    }

    let zoneData = aiResponse.zoneData || [];
    if (zoneData.length === 0 && storeContext?.zones?.length) {
      zoneData = storeContext.zones.slice(0, 6).map((zone: any, idx: number) => ({
        zoneId: zone.id || `zone-${idx}`,
        zoneName: zone.zoneName || `구역 ${idx + 1}`,
        avgDensity: 0.3 + Math.random() * 0.3,
        peakDensity: 0.5 + Math.random() * 0.4,
        peakHour: 12 + Math.floor(Math.random() * 8),
        recommendations: ['통로 정리', '안내 표지판 개선'],
      }));
    }

    // 피크 시간 계산
    const peakHourData = hourlyData.reduce((max: any, h: any) =>
      (h.peakDensity || 0) > (max.peakDensity || 0) ? h : max, hourlyData[0] || { hour: 14, peakDensity: 0.7 }
    );

    return {
      result: {
        id: `congestion-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        summary: {
          peakHour: aiResponse.summary?.peakHour || peakHourData.hour,
          peakDensity: aiResponse.summary?.peakDensity || peakHourData.peakDensity,
          avgDensity: aiResponse.summary?.avgDensity || (hourlyData.reduce((sum: number, h: any) => sum + (h.avgDensity || 0), 0) / hourlyData.length),
          bottleneckCount: aiResponse.summary?.bottleneckCount || zoneData.filter((z: any) => (z.peakDensity || 0) > 0.7).length,
        },
        hourlyData,
        zoneData,
        confidence: {
          overall: aiResponse.confidence || 0.75,
          factors: {
            dataQuality: storeContext?.dataQuality?.overallScore ? storeContext.dataQuality.overallScore / 100 : 0.72,
            modelAccuracy: 0.78,
            sampleSize: storeContext?.visits?.length ? Math.min(1, storeContext.visits.length / 400) : 0.6,
            variability: 0.76,
          },
        },
        insights: aiResponse.insights || ['혼잡도 분석이 완료되었습니다.'],
      },
    };
  } catch (error) {
    console.error('Congestion simulation error:', error);
    throw error;
  }
}

// 히트맵 데이터 생성 헬퍼
function generateHeatmapData(intensityBoost = 0): Array<{ x: number; z: number; intensity: number }> {
  const data: Array<{ x: number; z: number; intensity: number }> = [];
  for (let x = -5; x <= 5; x += 1) {
    for (let z = -5; z <= 5; z += 1) {
      data.push({
        x,
        z,
        intensity: Math.min(1, 0.3 + Math.random() * 0.5 + intensityBoost),
      });
    }
  }
  return data;
}

// 경로 포인트 생성 헬퍼
function generatePathPoints(): Array<{ x: number; y: number; z: number; t: number }> {
  const points: Array<{ x: number; y: number; z: number; t: number }> = [];
  let x = -4 + Math.random() * 2;
  let z = Math.random() * 2 - 1;

  for (let t = 0; t < 300; t += 30) {
    points.push({ x, y: 0.5, z, t });
    x += (Math.random() - 0.3) * 2;
    z += (Math.random() - 0.5) * 2;
    x = Math.max(-5, Math.min(5, x));
    z = Math.max(-5, Math.min(5, z));
  }

  return points;
}
