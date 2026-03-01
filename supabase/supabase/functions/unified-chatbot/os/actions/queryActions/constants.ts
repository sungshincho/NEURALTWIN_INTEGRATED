/**
 * queryActions 공용 상수
 * - QUERY_TYPE_TO_TAB: 73개 queryType → 페이지/탭/섹션 매핑
 * - SEGMENT_SYNONYM_MAP: 한국어 동의어 → DB 세그먼트명
 * - INVENTORY_SNAPSHOT_NOTE: 재고 스냅샷 안내 문구
 */

// 세그먼트 동의어 → DB 세그먼트명 매핑 (충성→VIP, 신규→New 등)
export const SEGMENT_SYNONYM_MAP: Record<string, string> = {
  '충성': 'vip', '단골': 'vip', '로열': 'vip', 'loyal': 'vip',
  '신규': 'new', '새로운': 'new',
  '일반': 'regular', '보통': 'regular',
  '휴면': 'dormant', '이탈': 'dormant', '비활성': 'dormant',
};

export function normalizeSegmentFilter(itemFilter: string[]): string[] {
  return itemFilter.map(f => {
    const lower = f.toLowerCase();
    return SEGMENT_SYNONYM_MAP[lower] || lower;
  });
}

// 재고 데이터는 시계열이 아닌 현재 스냅샷 — 사용자에게 명시
export const INVENTORY_SNAPSHOT_NOTE = '\n\n※ 재고 데이터는 현재 시점 기준입니다.';

/**
 * 쿼리 타입별 관련 탭 매핑 (73개 엔트리)
 */
export const QUERY_TYPE_TO_TAB: Record<string, { page: string; tab?: string; section?: string }> = {
  // 개요(Overview) 탭
  revenue: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  conversion: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  avgTransaction: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  footfall: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  visitFrequency: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  funnel: { page: '/insights', tab: 'overview', section: 'overview-funnel' },
  goal: { page: '/insights', tab: 'overview', section: 'overview-goals' },
  aiEffect: { page: '/insights', tab: 'overview', section: 'overview-goals' },
  dailyInsight: { page: '/insights', tab: 'overview', section: 'overview-insights' },
  summary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards' },
  // 매장(Store) 탭
  storeSummary: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  peakTime: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  popularZone: { page: '/insights', tab: 'store', section: 'store-zone-performance' },
  trackingCoverage: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  hourlyPattern: { page: '/insights', tab: 'store', section: 'store-hourly-pattern' },
  zoneAnalysis: { page: '/insights', tab: 'store', section: 'store-zone-dwell' },
  zonePerformance: { page: '/insights', tab: 'store', section: 'store-zone-performance' },
  storeDwell: { page: '/insights', tab: 'store', section: 'store-kpi-cards' },
  // 고객(Customer) 탭
  visitors: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  dwellTime: { page: '/insights', tab: 'store', section: 'store-kpi-cards' }, // storeDwell로 통합, 매장탭으로 이동
  newVsReturning: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  repeatRate: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  customerSegment: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  loyalCustomers: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
  segmentAvgPurchase: { page: '/insights', tab: 'customer', section: 'customer-avg-purchase' },
  segmentVisitFrequency: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  segmentDetail: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  returnTrend: { page: '/insights', tab: 'customer', section: 'customer-return-trend' },
  // 상품(Product) 탭
  product: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  bestSeller: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  topProducts: { page: '/insights', tab: 'product', section: 'product-top10' },
  categoryAnalysis: { page: '/insights', tab: 'product', section: 'product-category-revenue' },
  unitsSold: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  // 재고(Inventory) 탭
  inventory: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  overstock: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  stockAlert: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
  stockMovement: { page: '/insights', tab: 'inventory', section: 'inventory-movements' },
  stockDistribution: { page: '/insights', tab: 'inventory', section: 'inventory-distribution' },
  healthyStock: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  inventoryCategory: { page: '/insights', tab: 'inventory', section: 'inventory-category' },
  inventoryDetail: { page: '/insights', tab: 'inventory', section: 'inventory-detail' },
  // 예측(Prediction) 탭 — 네비게이션만 수행
  predictionRevenue: { page: '/insights', tab: 'prediction' },
  predictionVisitors: { page: '/insights', tab: 'prediction' },
  predictionConversion: { page: '/insights', tab: 'prediction' },
  predictionSummary: { page: '/insights', tab: 'prediction' },
  predictionConfidence: { page: '/insights', tab: 'prediction' },
  predictionDaily: { page: '/insights', tab: 'prediction' },
  predictionModel: { page: '/insights', tab: 'prediction' },
  // AI추천(AI Recommendation) 탭 — 네비게이션만 수행
  activeStrategies: { page: '/insights', tab: 'ai' },
  strategyRecommendation: { page: '/insights', tab: 'ai' },
  priceOptimization: { page: '/insights', tab: 'ai' },
  inventoryOptimization: { page: '/insights', tab: 'ai' },
  demandForecast: { page: '/insights', tab: 'ai' },
  seasonTrend: { page: '/insights', tab: 'ai' },
  riskPrediction: { page: '/insights', tab: 'ai' },
  campaignStatus: { page: '/insights', tab: 'ai' },
  // 데이터 컨트롤타워 쿼리 (탭 없음)
  dataQuality: { page: '/data/control-tower', section: 'data-quality' },
  dataSources: { page: '/data/control-tower', section: 'data-sources' },
  contextDataSources: { page: '/data/control-tower', section: 'data-sources' },
  apiConnections: { page: '/data/control-tower', section: 'api-connections' },
  importHistory: { page: '/data/control-tower', section: 'data-import' },
  pipelineStatus: { page: '/data/control-tower', section: 'pipeline' },
  // ROI 측정 쿼리 (탭 없음)
  roiSummary: { page: '/roi', section: 'roi-summary' },
  appliedStrategies: { page: '/roi', section: 'applied-strategies' },
  categoryPerformance: { page: '/roi', section: 'strategy-performance' },
  roiInsight: { page: '/roi', section: 'roi-analysis' },
  filterStrategies: { page: '/roi', section: 'applied-strategies' },
  exportStrategies: { page: '/roi', section: 'applied-strategies' },
  roiTablePage: { page: '/roi', section: 'applied-strategies' },
  // 설정 & 관리 쿼리 (탭별)
  storeManagement: { page: '/settings', tab: 'stores', section: 'settings-store-list' },
  userManagement: { page: '/settings', tab: 'users', section: 'settings-members' },
  subscriptionInfo: { page: '/settings', tab: 'license', section: 'settings-subscription' },
  systemSettings: { page: '/settings', tab: 'system', section: 'settings-org' },
  dataSettings: { page: '/settings', tab: 'data', section: 'settings-data-stats' },
};
