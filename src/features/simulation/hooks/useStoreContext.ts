import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Phase 1: 강화된 데이터 타입 정의
// ============================================================================

export interface StoreContextData {
  // 온톨로지 데이터 (3D 정보 포함)
  entities: {
    id: string;
    label: string;
    entityType: string;
    entity_type_name: string;
    model_3d_type: string | null;
    model_3d_url?: string | null;
    dimensions?: any;
    properties: any;
    position?: { x: number; y: number; z: number };
    model_3d_position?: { x: number; y: number; z: number };
    model_3d_rotation?: { x: number; y: number; z: number };
    model_3d_scale?: { x: number; y: number; z: number };
  }[];
  
  // 관계 데이터
  relations: {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    relation_type_id: string;
    relation_type_name?: string;
    properties: any;
  }[];
  
  // 방문 데이터
  visits: {
    id: string;
    customer_id: string;
    visit_date: string;
    duration_minutes: number;
    zones_visited: string[];
  }[];
  
  // 거래 데이터
  transactions: {
    id: string;
    customer_id?: string;
    total_amount: number;
    items?: any[];
    transaction_date: string;
  }[];
  
  // 일별 매출 데이터
  dailySales: {
    id: string;
    date: string;
    total_revenue: number;
    transaction_count: number;
    avg_transaction_value: number;
  }[];
  
  // KPI 데이터
  recentKpis: {
    date: string;
    totalVisits: number;
    totalRevenue: number;
    conversionRate: number;
    salesPerSqm: number;
  }[];
  
  // 재고 데이터
  inventory: {
    productSku: string;
    productName: string;
    currentStock: number;
    optimalStock: number;
    weeklyDemand: number;
  }[];
  
  // 상품 데이터
  products: {
    sku: string;
    name: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
  }[];
  
  // 매장 기본 정보
  storeInfo: {
    id: string;
    name: string;
    code: string;
    areaSqm?: number;
    width?: number;
    depth?: number;
    metadata: any;
  } | null;

  // ============================================================================
  // 🆕 Phase 1: 강화된 분석 데이터
  // ============================================================================
  
  salesAnalysis: SalesAnalysis | null;
  visitorAnalysis: VisitorAnalysis | null;
  conversionAnalysis: ConversionAnalysis | null;
  recommendationPerformance: RecommendationPerformance | null;
  dataQuality: DataQuality;
}

// 🆕 매출 분석
export interface SalesAnalysis {
  totalRevenue: number;
  avgDailyRevenue: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendPercentage: number;
  peakDays: string[];
  peakHours: number[];
  bestDay: { date: string; revenue: number } | null;
  worstDay: { date: string; revenue: number } | null;
  weekdayAvg: number;
  weekendAvg: number;
  growthRate: number;
}

// 🆕 방문자 분석
export interface VisitorAnalysis {
  totalVisitors: number;
  avgDaily: number;
  avgDwellTime: number;
  hourlyPattern: Record<number, number>;
  dayOfWeekPattern: Record<string, number>;
  zoneHeatmap: Record<string, ZoneMetrics>;
  peakHours: { hour: number; count: number }[];
  customerFlows: CustomerFlow[];
}

export interface ZoneMetrics {
  visitCount: number;
  visitRate: number;
  avgDwellTime: number;
  conversionRate: number;
}

export interface CustomerFlow {
  path: string[];
  count: number;
  percentage: number;
  conversionRate: number;
}

// 🆕 전환율 분석
export interface ConversionAnalysis {
  overall: number;
  byZone: Record<string, number>;
  byTimeOfDay: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

// 🆕 과거 추천 성과
export interface RecommendationPerformance {
  totalApplied: number;
  successCount: number;
  successRate: number;
  avgRevenueChange: number;
  avgTrafficChange: number;
  byType: Record<string, { count: number; successRate: number; avgImpact: number }>;
}

// 🆕 데이터 품질
export interface DataQuality {
  salesDataDays: number;
  visitorDataDays: number;
  hasZoneData: boolean;
  hasFlowData: boolean;
  hasPastRecommendations: boolean;
  overallScore: number;
}

// 🆕 AI 신뢰도 계산 결과
export interface ConfidenceScore {
  score: number;
  factors: {
    dataAvailability: number;
    dataRecency: number;
    dataCoverage: number;
    pastPerformance: number;
    patternConsistency: number;
    ontologyDepth: number;
  };
  explanation: string;
}

// ============================================================================
// Hook 구현
// ============================================================================

export function useStoreContext(storeId: string | undefined, days: number = 7) {
  const [contextData, setContextData] = useState<StoreContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<ConfidenceScore | null>(null);

  // 🆕 매출 데이터 분석
  const analyzeSalesData = useCallback((dailySales: any[], transactions: any[]): SalesAnalysis | null => {
    if (dailySales.length === 0 && transactions.length === 0) return null;

    // dailySales 사용 또는 transactions에서 집계
    let salesByDate: Record<string, { revenue: number; count: number }> = {};
    
    if (dailySales.length > 0) {
      dailySales.forEach(d => {
        salesByDate[d.date] = {
          revenue: d.total_revenue || 0,
          count: d.transaction_count || 0
        };
      });
    } else {
      transactions.forEach(t => {
        const date = t.transaction_date.split('T')[0];
        if (!salesByDate[date]) salesByDate[date] = { revenue: 0, count: 0 };
        salesByDate[date].revenue += t.total_amount || 0;
        salesByDate[date].count += 1;
      });
    }

    const dates = Object.keys(salesByDate).sort();
    const revenues = dates.map(d => salesByDate[d].revenue);
    
    if (revenues.length === 0) return null;

    const totalRevenue = revenues.reduce((a, b) => a + b, 0);
    const avgDailyRevenue = totalRevenue / revenues.length;

    // 트렌드 계산
    const mid = Math.floor(revenues.length / 2);
    const firstHalf = revenues.slice(0, mid);
    const secondHalf = revenues.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const trendPercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    const stdDev = calculateStdDev(revenues);
    if (stdDev > avgDailyRevenue * 0.5) {
      trend = 'volatile';
    } else if (trendPercentage > 5) {
      trend = 'increasing';
    } else if (trendPercentage < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // 요일별 분석
    const dayRevenues: Record<string, number[]> = {};
    dates.forEach(d => {
      const dayName = new Date(d).toLocaleDateString('ko-KR', { weekday: 'short' });
      if (!dayRevenues[dayName]) dayRevenues[dayName] = [];
      dayRevenues[dayName].push(salesByDate[d].revenue);
    });

    const dayAvgs = Object.entries(dayRevenues).map(([day, revs]) => ({
      day,
      avg: revs.reduce((a, b) => a + b, 0) / revs.length
    }));
    dayAvgs.sort((a, b) => b.avg - a.avg);
    const peakDays = dayAvgs.slice(0, 2).map(d => d.day);

    // 최고/최저 매출일
    const sortedDates = [...dates].sort((a, b) => salesByDate[b].revenue - salesByDate[a].revenue);
    const bestDay = sortedDates[0] ? { date: sortedDates[0], revenue: salesByDate[sortedDates[0]].revenue } : null;
    const worstDay = sortedDates[sortedDates.length - 1] 
      ? { date: sortedDates[sortedDates.length - 1], revenue: salesByDate[sortedDates[sortedDates.length - 1]].revenue }
      : null;

    // 주중/주말 평균
    const weekdayRevs = dates.filter(d => {
      const day = new Date(d).getDay();
      return day >= 1 && day <= 5;
    }).map(d => salesByDate[d].revenue);
    const weekendRevs = dates.filter(d => {
      const day = new Date(d).getDay();
      return day === 0 || day === 6;
    }).map(d => salesByDate[d].revenue);

    return {
      totalRevenue: Math.round(totalRevenue),
      avgDailyRevenue: Math.round(avgDailyRevenue),
      trend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      peakDays,
      peakHours: [14, 15, 16], // 기본값, 시간별 데이터 있으면 계산
      bestDay,
      worstDay,
      weekdayAvg: weekdayRevs.length > 0 ? Math.round(weekdayRevs.reduce((a, b) => a + b, 0) / weekdayRevs.length) : 0,
      weekendAvg: weekendRevs.length > 0 ? Math.round(weekendRevs.reduce((a, b) => a + b, 0) / weekendRevs.length) : 0,
      growthRate: Math.round(trendPercentage * 10) / 10
    };
  }, []);

  // 🆕 방문자 데이터 분석
  const analyzeVisitorData = useCallback((visits: any[]): VisitorAnalysis | null => {
    if (visits.length === 0) return null;

    const totalVisitors = visits.length;
    
    // 일별 집계
    const dailyVisits: Record<string, number> = {};
    const hourlyPattern: Record<number, number> = {};
    const dayOfWeekPattern: Record<string, number> = {};
    const zoneVisits: Record<string, { count: number; dwell: number; purchases: number }> = {};
    const flowPatterns: Record<string, { count: number; purchases: number }> = {};

    let totalDwell = 0;
    visits.forEach(v => {
      const date = v.visit_date.split('T')[0];
      dailyVisits[date] = (dailyVisits[date] || 0) + 1;

      const hour = new Date(v.visit_date).getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;

      const dayName = new Date(v.visit_date).toLocaleDateString('ko-KR', { weekday: 'short' });
      dayOfWeekPattern[dayName] = (dayOfWeekPattern[dayName] || 0) + 1;

      totalDwell += v.duration_minutes || 0;

      // 구역별
      if (v.zones_visited && Array.isArray(v.zones_visited)) {
        v.zones_visited.forEach((zone: string) => {
          if (!zoneVisits[zone]) zoneVisits[zone] = { count: 0, dwell: 0, purchases: 0 };
          zoneVisits[zone].count++;
          zoneVisits[zone].dwell += (v.duration_minutes || 0) / v.zones_visited.length;
        });

        // 동선 패턴
        const flowKey = v.zones_visited.join(' → ');
        if (!flowPatterns[flowKey]) flowPatterns[flowKey] = { count: 0, purchases: 0 };
        flowPatterns[flowKey].count++;
      }
    });

    const avgDaily = Math.round(totalVisitors / Object.keys(dailyVisits).length);
    const avgDwellTime = Math.round((totalDwell / totalVisitors) * 10) / 10;

    // 구역 히트맵
    const zoneHeatmap: Record<string, ZoneMetrics> = {};
    Object.entries(zoneVisits).forEach(([zone, data]) => {
      zoneHeatmap[zone] = {
        visitCount: data.count,
        visitRate: Math.round((data.count / totalVisitors) * 100),
        avgDwellTime: Math.round((data.dwell / data.count) * 10) / 10,
        conversionRate: data.count > 0 ? data.purchases / data.count : 0
      };
    });

    // 피크 시간
    const peakHours = Object.entries(hourlyPattern)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // 주요 동선
    const customerFlows = Object.entries(flowPatterns)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([path, data]) => ({
        path: path.split(' → '),
        count: data.count,
        percentage: Math.round((data.count / totalVisitors) * 100),
        conversionRate: data.count > 0 ? data.purchases / data.count : 0
      }));

    return {
      totalVisitors,
      avgDaily,
      avgDwellTime,
      hourlyPattern,
      dayOfWeekPattern,
      zoneHeatmap,
      peakHours,
      customerFlows
    };
  }, []);

  // 🆕 전환율 분석
  const analyzeConversionData = useCallback((
    salesAnalysis: SalesAnalysis | null,
    visitorAnalysis: VisitorAnalysis | null,
    transactions: any[]
  ): ConversionAnalysis | null => {
    if (!salesAnalysis || !visitorAnalysis || visitorAnalysis.totalVisitors === 0) return null;

    const totalTransactions = transactions.length;
    const overall = totalTransactions / visitorAnalysis.totalVisitors;

    // 구역별 전환율 (히트맵에서)
    const byZone: Record<string, number> = {};
    Object.entries(visitorAnalysis.zoneHeatmap).forEach(([zone, metrics]) => {
      byZone[zone] = metrics.conversionRate;
    });

    // 시간대별/요일별 (기본값)
    const byTimeOfDay: Record<string, number> = {
      '오전(9-12시)': overall * 0.85,
      '점심(12-14시)': overall * 1.2,
      '오후(14-18시)': overall * 1.1,
      '저녁(18-21시)': overall * 0.9
    };

    const byDayOfWeek: Record<string, number> = {
      '월': overall * 0.9, '화': overall * 0.85, '수': overall * 0.95,
      '목': overall * 1.0, '금': overall * 1.1, '토': overall * 1.25, '일': overall * 1.15
    };

    // 트렌드 (매출 트렌드 기반)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendPercentage = 0;
    if (salesAnalysis.trend === 'increasing') {
      trend = 'improving';
      trendPercentage = salesAnalysis.trendPercentage * 0.5;
    } else if (salesAnalysis.trend === 'decreasing') {
      trend = 'declining';
      trendPercentage = salesAnalysis.trendPercentage * 0.5;
    }

    return {
      overall: Math.round(overall * 1000) / 1000,
      byZone,
      byTimeOfDay,
      byDayOfWeek,
      trend,
      trendPercentage: Math.round(trendPercentage * 10) / 10
    };
  }, []);

  // 🆕 과거 추천 성과 로드
  const loadRecommendationPerformance = useCallback(async (storeId: string): Promise<RecommendationPerformance | null> => {
    try {
      const { data: applications } = await supabase
        .from('recommendation_applications')
        .select('*')
        .eq('store_id', storeId)
        .order('applied_at', { ascending: false })
        .limit(50);

      if (!applications || applications.length === 0) return null;

      const completed = applications.filter((a: any) => a.status === 'completed');
      const successful = completed.filter((a: any) => (a.roi_percentage || 0) > 0);

      const byType: Record<string, { count: number; successRate: number; avgImpact: number }> = {};
      applications.forEach((a: any) => {
        const type = a.recommendation_type || 'unknown';
        if (!byType[type]) byType[type] = { count: 0, successRate: 0, avgImpact: 0 };
        byType[type].count++;
      });

      return {
        totalApplied: applications.length,
        successCount: successful.length,
        successRate: completed.length > 0 ? successful.length / completed.length : 0,
        avgRevenueChange: calculateAvgChange(completed, 'total_revenue'),
        avgTrafficChange: calculateAvgChange(completed, 'total_visitors'),
        byType
      };
    } catch (e) {
      console.warn('Failed to load recommendation performance:', e);
      return null;
    }
  }, []);

  // 🆕 데이터 품질 계산
  const calculateDataQuality = useCallback((
    salesAnalysis: SalesAnalysis | null,
    visitorAnalysis: VisitorAnalysis | null,
    dailySales: any[],
    visits: any[],
    recPerf: RecommendationPerformance | null
  ): DataQuality => {
    let score = 50;

    const salesDataDays = dailySales.length;
    const visitorDataDays = visits.length > 0 ? new Set(visits.map(v => v.visit_date.split('T')[0])).size : 0;
    const hasZoneData = visitorAnalysis && Object.keys(visitorAnalysis.zoneHeatmap).length > 0;
    const hasFlowData = visitorAnalysis && visitorAnalysis.customerFlows.length > 0;
    const hasPastRecommendations = recPerf && recPerf.totalApplied > 0;

    // 점수 계산
    if (salesDataDays >= 30) score += 15;
    else if (salesDataDays >= 14) score += 10;
    else if (salesDataDays >= 7) score += 5;

    if (visitorDataDays >= 30) score += 15;
    else if (visitorDataDays >= 14) score += 10;
    else if (visitorDataDays >= 7) score += 5;

    if (hasZoneData) score += 10;
    if (hasFlowData) score += 5;
    if (hasPastRecommendations) score += 5;

    return {
      salesDataDays,
      visitorDataDays,
      hasZoneData: !!hasZoneData,
      hasFlowData: !!hasFlowData,
      hasPastRecommendations: !!hasPastRecommendations,
      overallScore: Math.min(score, 100)
    };
  }, []);

  // 🆕 AI 신뢰도 계산
  const calculateConfidence = useCallback((
    dataQuality: DataQuality,
    salesAnalysis: SalesAnalysis | null,
    recPerf: RecommendationPerformance | null,
    entities: any[],
    relations: any[]
  ): ConfidenceScore => {
    const factors = {
      dataAvailability: 0,
      dataRecency: 0,
      dataCoverage: 0,
      pastPerformance: 0,
      patternConsistency: 0,
      ontologyDepth: 0
    };
    const explanations: string[] = [];

    // 1. 데이터 충분성 (최대 25점)
    if (dataQuality.salesDataDays >= 30 && dataQuality.visitorDataDays >= 30) {
      factors.dataAvailability = 25;
      explanations.push('30일 이상 데이터');
    } else if (dataQuality.salesDataDays >= 14) {
      factors.dataAvailability = 18;
    } else if (dataQuality.salesDataDays >= 7) {
      factors.dataAvailability = 12;
    } else {
      factors.dataAvailability = 6;
      explanations.push('제한된 데이터');
    }

    // 2. 데이터 최신성 (최대 15점)
    factors.dataRecency = dataQuality.salesDataDays > 0 ? 15 : 5;

    // 3. 데이터 커버리지 (최대 15점)
    if (dataQuality.hasZoneData) factors.dataCoverage += 5;
    if (dataQuality.hasFlowData) factors.dataCoverage += 5;
    if (dataQuality.salesDataDays > 0) factors.dataCoverage += 5;

    // 4. 과거 추천 성과 (최대 20점)
    if (recPerf && recPerf.totalApplied >= 5 && recPerf.successRate >= 0.7) {
      factors.pastPerformance = 20;
      explanations.push(`과거 ${recPerf.totalApplied}건 중 ${Math.round(recPerf.successRate * 100)}% 성공`);
    } else if (recPerf && recPerf.successRate >= 0.5) {
      factors.pastPerformance = 15;
    } else if (recPerf && recPerf.totalApplied >= 3) {
      factors.pastPerformance = 10;
    }

    // 5. 패턴 일관성 (최대 15점)
    if (salesAnalysis && salesAnalysis.trend !== 'volatile') {
      factors.patternConsistency = 15;
    } else if (salesAnalysis?.trend === 'volatile') {
      factors.patternConsistency = 5;
      explanations.push('매출 변동성 높음');
    }

    // 6. 온톨로지 깊이 (최대 10점)
    if (entities.length > 20 && relations.length > 30) {
      factors.ontologyDepth = 10;
    } else if (entities.length > 10) {
      factors.ontologyDepth = 7;
    } else if (entities.length > 0) {
      factors.ontologyDepth = 4;
    }

    const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
    const normalizedScore = 60 + (totalScore / 100) * 35;
    const finalScore = Math.min(Math.max(normalizedScore, 60), 95);

    return {
      score: Math.round(finalScore),
      factors,
      explanation: explanations.join(' | ') || '기본 분석'
    };
  }, []);

  // 메인 데이터 로드
  useEffect(() => {
    if (!storeId) {
      setContextData(null);
      return;
    }

    const fetchStoreContext = async () => {
      setLoading(true);
      setError(null);

      try {
        // 매장 기본 정보
        const { data: store } = await supabase
          .from('stores')
          .select('id, store_name, store_code, area_sqm, metadata')
          .eq('id', storeId)
          .single();

        // 온톨로지 엔티티 (3D 정보 포함)
        const { data: entities } = await supabase
          .from('graph_entities')
          .select(`
            id,
            label,
            properties,
            model_3d_position,
            model_3d_rotation,
            model_3d_scale,
            entity_type_id,
            ontology_entity_types (
              name,
              label,
              model_3d_type,
              model_3d_url,
              model_3d_dimensions
            )
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(100);

        // 관계 데이터 조회
        const { data: relations } = await supabase
          .from('graph_relations')
          .select(`
            id,
            source_entity_id,
            target_entity_id,
            relation_type_id,
            properties,
            ontology_relation_types (
              name,
              label
            )
          `)
          .eq('store_id', storeId)
          .limit(200);

        // 방문 데이터 조회 (days 파라미터 사용)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: visits } = await supabase
          .from('store_visits')
          .select('id, customer_id, visit_date, duration_minutes, zones_visited, made_purchase')
          .eq('store_id', storeId)
          .gte('visit_date', startDate.toISOString())
          .order('visit_date', { ascending: false })
          .limit(days * 50); // 일당 약 50건

        // 거래 데이터 조회 (days 파라미터 사용)
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id, customer_id, total_amount, created_at')
          .eq('store_id', storeId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(days * 30); // 일당 약 30건

        // 일별 KPI 데이터 조회 (daily_kpis_agg 테이블 사용)
        let dailySales: any[] = [];
        const { data: dailyKpisData } = await supabase
          .from('daily_kpis_agg')
          .select('id, date, total_revenue, total_transactions, avg_transaction_value, total_visitors, conversion_rate')
          .eq('store_id', storeId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(days);

        if (dailyKpisData && dailyKpisData.length > 0) {
          dailySales = dailyKpisData.map(d => ({
            ...d,
            transaction_count: d.total_transactions // 필드명 매핑
          }));
        }

        // KPI 데이터 - L3 daily_kpis_agg 테이블만 사용 (3-Layer Architecture)
        let kpis: any[] = [];
        if (dailyKpisData && dailyKpisData.length > 0) {
          kpis = dailyKpisData.map(d => ({
            date: d.date,
            total_visits: d.total_visitors || 0,
            total_revenue: d.total_revenue || 0,
            conversion_rate: d.conversion_rate || 0,
            sales_per_sqm: 0
          }));
        }

        // 재고 정보
        const { data: inventoryData } = await supabase
          .from('inventory_levels')
          .select(`
            current_stock,
            optimal_stock,
            minimum_stock,
            weekly_demand,
            products (
              sku,
              name
            )
          `)
          .order('last_updated', { ascending: false })
          .limit(100);

        // 상품 정보
        const { data: productsData } = await supabase
          .from('products')
          .select('sku, product_name, category, cost_price, price')
          .order('created_at', { ascending: false })
          .limit(100);

        // 엔티티 매핑
        const mappedEntities = (entities || []).map(e => {
          const entityType = e.ontology_entity_types as any;
          return {
            id: e.id,
            label: e.label,
            entityType: entityType?.name || 'unknown',
            entity_type_name: entityType?.name || 'unknown',
            model_3d_type: entityType?.model_3d_type || null,
            model_3d_url: entityType?.model_3d_url || null,
            dimensions: entityType?.model_3d_dimensions || null,
            properties: e.properties || {},
            position: e.model_3d_position ? {
              x: (e.model_3d_position as any).x || 0,
              y: (e.model_3d_position as any).y || 0,
              z: (e.model_3d_position as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_position: e.model_3d_position ? {
              x: (e.model_3d_position as any).x || 0,
              y: (e.model_3d_position as any).y || 0,
              z: (e.model_3d_position as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_rotation: e.model_3d_rotation ? {
              x: (e.model_3d_rotation as any).x || 0,
              y: (e.model_3d_rotation as any).y || 0,
              z: (e.model_3d_rotation as any).z || 0
            } : { x: 0, y: 0, z: 0 },
            model_3d_scale: e.model_3d_scale ? {
              x: (e.model_3d_scale as any).x || 1,
              y: (e.model_3d_scale as any).y || 1,
              z: (e.model_3d_scale as any).z || 1
            } : { x: 1, y: 1, z: 1 },
          };
        });

        // 가구 엔티티 우선 정렬
        const sortedEntities = mappedEntities.sort((a, b) => {
          const priorityTypes = ['furniture', 'room', 'structure', 'building'];
          const aPriority = priorityTypes.includes(a.model_3d_type || '') ? 0 : 1;
          const bPriority = priorityTypes.includes(b.model_3d_type || '') ? 0 : 1;
          return aPriority - bPriority;
        });

        // 관계 매핑
        const mappedRelations = (relations || []).map(r => {
          const relationType = r.ontology_relation_types as any;
          return {
            id: r.id,
            source_entity_id: r.source_entity_id,
            target_entity_id: r.target_entity_id,
            relation_type_id: r.relation_type_id,
            relation_type_name: relationType?.name || 'unknown',
            properties: r.properties || {}
          };
        });

        // 방문 데이터 매핑
        const mappedVisits = (visits || []).map(v => ({
          id: v.id,
          customer_id: v.customer_id,
          visit_date: v.visit_date,
          duration_minutes: v.duration_minutes || 0,
          zones_visited: v.zones_visited || [],
          made_purchase: v.made_purchase
        }));

        // 거래 데이터 매핑 (transactions 테이블에 items 컬럼이 없을 수 있음)
        const mappedTransactions = (transactions || []).map((t: any) => ({
          id: t.id,
          customer_id: t.customer_id,
          total_amount: t.total_amount || t.total_price || 0,
          items: [],
          transaction_date: t.created_at || t.transaction_date
        }));

        // 🆕 Phase 1: 분석 데이터 생성
        const salesAnalysis = analyzeSalesData(dailySales, mappedTransactions);
        const visitorAnalysis = analyzeVisitorData(mappedVisits);
        const conversionAnalysis = analyzeConversionData(salesAnalysis, visitorAnalysis, mappedTransactions);
        const recPerf = await loadRecommendationPerformance(storeId);
        const dataQuality = calculateDataQuality(salesAnalysis, visitorAnalysis, dailySales, mappedVisits, recPerf);
        const confidence = calculateConfidence(dataQuality, salesAnalysis, recPerf, sortedEntities, mappedRelations);

        setConfidenceScore(confidence);

        // 매장 크기
        const metadata = store?.metadata as Record<string, any> | null;
        const storeWidth = metadata?.width || 17.4;
        const storeDepth = metadata?.depth || 16.6;

        console.log('📊 Store context loaded (Phase 1 Enhanced):', {
          entities: sortedEntities.length,
          relations: mappedRelations.length,
          visits: mappedVisits.length,
          transactions: mappedTransactions.length,
          dailySales: dailySales.length,
          kpis: kpis.length,
          totalRevenue: salesAnalysis?.totalRevenue || 0,
          salesTrend: salesAnalysis?.trend,
          visitorAvgDaily: visitorAnalysis?.avgDaily,
          dataQualityScore: dataQuality.overallScore,
          confidenceScore: confidence.score
        });

        setContextData({
          storeInfo: store ? {
            id: store.id,
            name: store.store_name,
            code: store.store_code,
            areaSqm: store.area_sqm,
            width: storeWidth,
            depth: storeDepth,
            metadata: store.metadata || {}
          } : null,
          
          entities: sortedEntities,
          relations: mappedRelations,
          
          visits: mappedVisits,
          transactions: mappedTransactions,
          
          dailySales: dailySales.map(d => ({
            id: d.id,
            date: d.date,
            total_revenue: d.total_revenue || 0,
            transaction_count: d.transaction_count || 0,
            avg_transaction_value: d.avg_transaction_value || 0,
            total_visitors: d.total_visitors || 0,
            conversion_rate: d.conversion_rate || 0
          })),
          
          recentKpis: (kpis || []).map(k => ({
            date: k.date,
            totalVisits: k.total_visits || 0,
            totalRevenue: k.total_revenue || 0,
            conversionRate: k.conversion_rate || 0,
            salesPerSqm: k.sales_per_sqm || 0
          })),
          
          inventory: (inventoryData || []).map(i => ({
            productSku: (i.products as any)?.sku || '',
            productName: (i.products as any)?.name || '',
            currentStock: i.current_stock || 0,
            optimalStock: i.optimal_stock || 0,
            weeklyDemand: i.weekly_demand || 0
          })),
          
          products: (productsData || []).map(p => ({
            sku: p.sku,
            name: p.product_name,
            category: p.category || '',
            costPrice: Number(p.cost_price) || 0,
            sellingPrice: Number(p.price) || 0
          })),

          // 🆕 Phase 1 분석 데이터
          salesAnalysis,
          visitorAnalysis,
          conversionAnalysis,
          recommendationPerformance: recPerf,
          dataQuality
        });

      } catch (e) {
        console.error('Store context fetch error:', e);
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreContext();
  }, [storeId, days, analyzeSalesData, analyzeVisitorData, analyzeConversionData, loadRecommendationPerformance, calculateDataQuality, calculateConfidence]);

  // 🆕 컨텍스트 새로고침 함수
  const refresh = useCallback(() => {
    if (storeId) {
      setContextData(null);
      // useEffect가 다시 실행됨
    }
  }, [storeId]);

  return { 
    contextData, 
    loading, 
    error,
    confidenceScore, // 🆕
    refresh // 🆕
  };
}

// ============================================================================
// Helper 함수들
// ============================================================================

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function calculateAvgChange(recommendations: any[], kpiKey: string): number {
  const completed = recommendations.filter(r => r.measured_kpis && r.baseline_kpis);
  if (completed.length === 0) return 0;

  const changes = completed.map(r => {
    const baseline = r.baseline_kpis?.[kpiKey] || 0;
    const measured = r.measured_kpis?.[kpiKey] || 0;
    return baseline > 0 ? ((measured - baseline) / baseline) * 100 : 0;
  });

  return changes.reduce((a, b) => a + b, 0) / changes.length;
}
