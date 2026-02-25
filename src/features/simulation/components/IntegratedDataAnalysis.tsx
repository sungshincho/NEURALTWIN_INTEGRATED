/**
 * IntegratedDataAnalysis.tsx
 * 
 * 시뮬레이션 실행 전 모든 데이터를 통합 분석하여
 * 베이스라인 인사이트를 제공하는 컴포넌트
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ShoppingCart,
  MapPin,
  Package,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Network,
  RefreshCw,
  Sparkles,
  Clock,
  DollarSign,
  Target,
  Layers,
} from 'lucide-react';

// ============================================================================
// 타입 정의
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
  total_visitors?: number;
  conversion_rate?: number;
}

interface RelationData {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type_name?: string;
  ontology_relation_types?: { name: string; label?: string };
  properties?: Record<string, any>;
}

interface EntityData {
  id: string;
  label?: string;
  entityType?: string;
  entity_type_name?: string;
  model_3d_type?: string;
  position?: { x: number; y: number; z?: number };
  properties?: Record<string, any>;
}

interface StoreContextData {
  entities?: EntityData[];
  relations?: RelationData[];
  visits?: VisitData[];
  transactions?: TransactionData[];
  dailySales?: DailySalesData[];
  products?: any[];
  inventory?: any[];
  recentKpis?: any[];
  storeInfo?: {
    name?: string;
    width?: number;
    depth?: number;
  };
}

interface IntegratedDataAnalysisProps {
  contextData: StoreContextData | null;
  loading?: boolean;
  onRefresh?: () => void;
}

// ============================================================================
// 분석 함수들
// ============================================================================

// 방문 패턴 분석
function analyzeVisitPatterns(visits: VisitData[]) {
  if (!visits || visits.length === 0) {
    return null;
  }

  const durations = visits.filter(v => v.duration_minutes).map(v => v.duration_minutes!);
  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const zoneCounts: Record<string, number> = {};
  const flowPatterns: Record<string, number> = {};
  
  visits.forEach(visit => {
    if (visit.zones_visited && Array.isArray(visit.zones_visited)) {
      visit.zones_visited.forEach(zone => {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      });
      const flowKey = visit.zones_visited.join(' → ');
      flowPatterns[flowKey] = (flowPatterns[flowKey] || 0) + 1;
    }
  });

  const zonePopularity: Record<string, number> = {};
  Object.entries(zoneCounts).forEach(([zone, count]) => {
    zonePopularity[zone] = Math.round((count / visits.length) * 100);
  });

  const customerFlows = Object.entries(flowPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flow, count]) => ({
      flow,
      count,
      percentage: Math.round((count / visits.length) * 100)
    }));

  // 피크 시간대 분석
  const hourCounts: Record<number, number> = {};
  visits.forEach(visit => {
    const hour = new Date(visit.visit_date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  // 방문 없는 구역 감지
  const commonZones = ['입구', '의류 섹션', '액세서리 섹션', '화장품 섹션', '신발 섹션', '계산대'];
  const visitedZones = Object.keys(zoneCounts);
  const unvisitedZones = commonZones.filter(z => 
    !visitedZones.some(vz => vz.includes(z) || z.includes(vz))
  );

  // 고유 고객 수
  const uniqueCustomers = new Set(visits.filter(v => v.customer_id).map(v => v.customer_id)).size;

  return {
    totalVisits: visits.length,
    uniqueCustomers,
    avgDuration,
    zonePopularity,
    customerFlows,
    peakHours,
    unvisitedZones,
  };
}

// 거래 패턴 분석
function analyzeTransactionPatterns(transactions: TransactionData[]) {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const avgTransactionValue = Math.round(totalRevenue / transactions.length);

  const customerIds = transactions.filter(t => t.customer_id).map(t => t.customer_id!);
  const uniqueCustomers = new Set(customerIds).size;
  const repeatCustomerRate = customerIds.length > 0 && uniqueCustomers > 0
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

  // 요일별 분석
  const dayOfWeekCounts: Record<number, { count: number; revenue: number }> = {};
  transactions.forEach(t => {
    const day = new Date(t.transaction_date).getDay();
    if (!dayOfWeekCounts[day]) {
      dayOfWeekCounts[day] = { count: 0, revenue: 0 };
    }
    dayOfWeekCounts[day].count += 1;
    dayOfWeekCounts[day].revenue += t.total_amount || 0;
  });

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    avgTransactionValue,
    uniqueCustomers,
    repeatCustomerRate,
    topSellingProducts,
    dayOfWeekCounts,
  };
}

// 일별 매출 트렌드 분석
function analyzeDailySalesTrends(dailySales: DailySalesData[]) {
  if (!dailySales || dailySales.length === 0) {
    return null;
  }

  const sorted = [...dailySales].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const revenues = sorted.map(d => d.total_revenue || 0);
  const avgDailyRevenue = Math.round(revenues.reduce((a, b) => a + b, 0) / revenues.length);

  // 트렌드 계산
  const mid = Math.floor(revenues.length / 2);
  const firstHalf = revenues.slice(0, mid);
  const secondHalf = revenues.slice(mid);
  
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
  
  const trendPercentage = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;
  const trend: 'increasing' | 'decreasing' | 'stable' = 
    trendPercentage > 5 ? 'increasing' : trendPercentage < -5 ? 'decreasing' : 'stable';

  const bestDay = sorted.reduce((best, curr) => 
    (curr.total_revenue || 0) > (best.total_revenue || 0) ? curr : best
  );
  const worstDay = sorted.reduce((worst, curr) => 
    (curr.total_revenue || 0) < (worst.total_revenue || 0) ? curr : worst
  );

  // 주간 패턴 분석
  const weeklyPattern = revenues.length >= 7 
    ? revenues.slice(-7).map((r, i) => ({ day: i, revenue: r }))
    : null;

  // 총 거래 수 계산 (dailySales의 transaction_count 합계)
  const totalTransactions = sorted.reduce((sum, d) => sum + (d.transaction_count || 0), 0);

  // 총 방문자 수 계산 (dailySales의 total_visitors 합계)
  const totalVisitors = sorted.reduce((sum, d) => sum + (d.total_visitors || 0), 0);

  // 평균 거래 금액 계산
  const avgTransactionValue = totalTransactions > 0
    ? Math.round(revenues.reduce((a, b) => a + b, 0) / totalTransactions)
    : 0;

  // 평균 전환율 계산
  const avgConversionRate = totalVisitors > 0
    ? Math.round((totalTransactions / totalVisitors) * 100 * 10) / 10
    : 0;

  return {
    totalDays: dailySales.length,
    avgDailyRevenue,
    trend,
    trendPercentage,
    bestDay,
    worstDay,
    weeklyPattern,
    totalRevenue: revenues.reduce((a, b) => a + b, 0),
    totalTransactions,
    totalVisitors,
    avgTransactionValue,
    avgConversionRate,
  };
}

// 근접성 관계 분석
function analyzeProximityRelations(relations: RelationData[], entities: EntityData[]) {
  const nearToRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('near') || typeName === 'NEAR_TO';
  });

  if (nearToRelations.length === 0) {
    return null;
  }

  const entityMap = new Map(entities.map(e => [e.id, e.label || e.id]));
  
  const proximityPairs = nearToRelations.map(r => ({
    source: entityMap.get(r.source_entity_id) || r.source_entity_id,
    target: entityMap.get(r.target_entity_id) || r.target_entity_id,
    distance: r.properties?.distance || 0
  })).filter(p => p.distance > 0);

  const closeProximityPairs = proximityPairs
    .filter(p => p.distance < 4)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  const farProximityPairs = proximityPairs
    .filter(p => p.distance > 10)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3);

  // 고립된 가구 찾기
  const relationCounts: Record<string, number> = {};
  nearToRelations.forEach(r => {
    const source = entityMap.get(r.source_entity_id) || r.source_entity_id;
    const target = entityMap.get(r.target_entity_id) || r.target_entity_id;
    relationCounts[source] = (relationCounts[source] || 0) + 1;
    relationCounts[target] = (relationCounts[target] || 0) + 1;
  });

  const avgRelations = Object.values(relationCounts).length > 0
    ? Object.values(relationCounts).reduce((a, b) => a + b, 0) / Object.keys(relationCounts).length
    : 0;
  
  const isolatedFurniture = Object.entries(relationCounts)
    .filter(([_, count]) => count < avgRelations * 0.5)
    .map(([name]) => name);

  return {
    totalRelations: nearToRelations.length,
    closeProximityPairs,
    farProximityPairs,
    isolatedFurniture,
    avgDistance: proximityPairs.length > 0 
      ? Math.round(proximityPairs.reduce((sum, p) => sum + p.distance, 0) / proximityPairs.length * 10) / 10
      : 0,
  };
}

// 진열 관계 분석
function analyzeDisplayRelations(relations: RelationData[], entities: EntityData[]) {
  const displayRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('display') || typeName === 'DISPLAYED_ON_FURNITURE';
  });

  if (displayRelations.length === 0) {
    return null;
  }

  const entityMap = new Map(entities.map(e => [e.id, { 
    label: e.label, 
    type: e.entityType || e.entity_type_name || e.model_3d_type 
  }]));

  const furnitureProductMap: Record<string, { products: string[]; hasTester: number }> = {};
  
  displayRelations.forEach(r => {
    const furnitureInfo = entityMap.get(r.target_entity_id);
    const productInfo = entityMap.get(r.source_entity_id);
    const furniture = furnitureInfo?.label || r.target_entity_id;
    const product = productInfo?.label || r.source_entity_id;
    const hasTester = r.properties?.has_tester ? 1 : 0;

    if (!furnitureProductMap[furniture]) {
      furnitureProductMap[furniture] = { products: [], hasTester: 0 };
    }
    furnitureProductMap[furniture].products.push(product);
    furnitureProductMap[furniture].hasTester += hasTester;
  });

  const avgProducts = Object.values(furnitureProductMap).length > 0
    ? Object.values(furnitureProductMap).reduce((sum, f) => sum + f.products.length, 0) / Object.keys(furnitureProductMap).length
    : 0;
  
  const underutilizedFurniture = Object.entries(furnitureProductMap)
    .filter(([_, data]) => data.products.length < avgProducts * 0.5)
    .map(([name]) => name);

  const overloadedFurniture = Object.entries(furnitureProductMap)
    .filter(([_, data]) => data.products.length > avgProducts * 1.5)
    .map(([name, data]) => ({ name, count: data.products.length }));

  return {
    totalRelations: displayRelations.length,
    furnitureCount: Object.keys(furnitureProductMap).length,
    furnitureProductMap,
    avgProductsPerFurniture: Math.round(avgProducts * 10) / 10,
    underutilizedFurniture,
    overloadedFurniture,
    totalTesters: Object.values(furnitureProductMap).reduce((sum, f) => sum + f.hasTester, 0),
  };
}

// 엔티티 분석
function analyzeEntities(entities: EntityData[]) {
  if (!entities || entities.length === 0) {
    return null;
  }

  const typeCount: Record<string, number> = {};
  const model3dTypeCount: Record<string, number> = {};

  entities.forEach(e => {
    const type = e.entityType || e.entity_type_name || 'unknown';
    const model3dType = e.model_3d_type || 'unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
    model3dTypeCount[model3dType] = (model3dTypeCount[model3dType] || 0) + 1;
  });

  const furnitureCount = entities.filter(e => 
    e.model_3d_type === 'furniture' || 
    ['shelf', 'rack', 'counter', 'table', 'display'].some(t => 
      (e.entityType || e.entity_type_name || '').toLowerCase().includes(t)
    )
  ).length;

  const productCount = entities.filter(e => 
    e.model_3d_type === 'product' ||
    (e.entityType || e.entity_type_name || '').toLowerCase().includes('product')
  ).length;

  const spaceCount = entities.filter(e => 
    e.model_3d_type === 'building' || 
    e.model_3d_type === 'space' ||
    (e.entityType || e.entity_type_name || '').toLowerCase().includes('store')
  ).length;

  return {
    totalEntities: entities.length,
    typeCount,
    model3dTypeCount,
    furnitureCount,
    productCount,
    spaceCount,
  };
}

// 상관관계 분석
function analyzeCorrelations(
  visitAnalysis: ReturnType<typeof analyzeVisitPatterns>,
  transactionAnalysis: ReturnType<typeof analyzeTransactionPatterns>,
  displayAnalysis: ReturnType<typeof analyzeDisplayRelations>,
) {
  const correlations: Array<{
    type: 'positive' | 'negative' | 'neutral';
    source: string;
    target: string;
    description: string;
    strength: number; // 0-100
  }> = [];

  // 방문 vs 거래 상관관계
  if (visitAnalysis && transactionAnalysis) {
    const visitToTxRatio = transactionAnalysis.totalTransactions / visitAnalysis.totalVisits;
    const conversionRate = Math.round(visitToTxRatio * 100);
    
    correlations.push({
      type: conversionRate > 30 ? 'positive' : conversionRate > 15 ? 'neutral' : 'negative',
      source: '방문',
      target: '구매',
      description: `방문 대비 구매 전환율: ${conversionRate}%`,
      strength: Math.min(conversionRate * 2, 100),
    });

    // 체류시간 vs 구매금액
    if (visitAnalysis.avgDuration > 0) {
      const revenuePerMinute = transactionAnalysis.avgTransactionValue / visitAnalysis.avgDuration;
      correlations.push({
        type: revenuePerMinute > 3000 ? 'positive' : 'neutral',
        source: '체류시간',
        target: '구매금액',
        description: `분당 평균 구매액: ${Math.round(revenuePerMinute).toLocaleString()}원`,
        strength: Math.min(revenuePerMinute / 50, 100),
      });
    }
  }

  // 진열 vs 매출 상관관계
  if (displayAnalysis && transactionAnalysis) {
    const revenuePerDisplay = transactionAnalysis.totalRevenue / displayAnalysis.totalRelations;
    correlations.push({
      type: revenuePerDisplay > 100000 ? 'positive' : 'neutral',
      source: '상품진열',
      target: '매출',
      description: `진열 상품당 매출: ${Math.round(revenuePerDisplay).toLocaleString()}원`,
      strength: Math.min(revenuePerDisplay / 2000, 100),
    });
  }

  return correlations;
}

// AI 인사이트 생성
function generateInsights(
  visitAnalysis: ReturnType<typeof analyzeVisitPatterns>,
  transactionAnalysis: ReturnType<typeof analyzeTransactionPatterns>,
  salesTrendAnalysis: ReturnType<typeof analyzeDailySalesTrends>,
  proximityAnalysis: ReturnType<typeof analyzeProximityRelations>,
  displayAnalysis: ReturnType<typeof analyzeDisplayRelations>,
  entityAnalysis: ReturnType<typeof analyzeEntities>,
) {
  const insights: Array<{
    type: 'warning' | 'opportunity' | 'strength' | 'info';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    suggestedAction?: string;
    relatedSimulation?: 'layout' | 'demand' | 'pricing' | 'inventory' | 'marketing';
  }> = [];

  // 방문 관련 인사이트
  if (visitAnalysis) {
    if (visitAnalysis.unvisitedZones.length > 0) {
      insights.push({
        type: 'warning',
        title: '방문 없는 구역 발견',
        description: `${visitAnalysis.unvisitedZones.join(', ')} 구역에 고객 방문이 없습니다.`,
        priority: 'high',
        actionable: true,
        suggestedAction: '레이아웃 시뮬레이션을 실행하여 동선을 개선하세요.',
        relatedSimulation: 'layout',
      });
    }

    if (visitAnalysis.avgDuration < 20) {
      insights.push({
        type: 'warning',
        title: '짧은 체류시간',
        description: `평균 체류시간이 ${visitAnalysis.avgDuration}분으로 짧습니다. 고객 경험 개선이 필요합니다.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '매장 레이아웃과 상품 진열을 검토하세요.',
        relatedSimulation: 'layout',
      });
    } else if (visitAnalysis.avgDuration > 45) {
      insights.push({
        type: 'strength',
        title: '높은 고객 참여도',
        description: `평균 체류시간이 ${visitAnalysis.avgDuration}분으로 고객들이 매장에 오래 머무릅니다.`,
        priority: 'low',
        actionable: false,
      });
    }

    if (visitAnalysis.customerFlows.length > 0 && visitAnalysis.customerFlows[0].percentage > 70) {
      insights.push({
        type: 'info',
        title: '주요 동선 패턴 발견',
        description: `고객의 ${visitAnalysis.customerFlows[0].percentage}%가 "${visitAnalysis.customerFlows[0].flow}" 경로를 따릅니다.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '이 동선에 주력 상품을 배치하세요.',
        relatedSimulation: 'layout',
      });
    }
  }

  // 거래 관련 인사이트
  if (transactionAnalysis) {
    if (transactionAnalysis.repeatCustomerRate > 30) {
      insights.push({
        type: 'strength',
        title: '높은 재방문율',
        description: `반복 구매 고객이 ${transactionAnalysis.repeatCustomerRate}%입니다.`,
        priority: 'low',
        actionable: false,
      });
    } else if (transactionAnalysis.repeatCustomerRate < 10) {
      insights.push({
        type: 'opportunity',
        title: '재방문 유도 기회',
        description: `반복 구매율이 ${transactionAnalysis.repeatCustomerRate}%로 낮습니다. 로열티 프로그램을 고려해보세요.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '마케팅 전략 시뮬레이션을 실행하세요.',
        relatedSimulation: 'marketing',
      });
    }

    if (transactionAnalysis.topSellingProducts.length > 0) {
      insights.push({
        type: 'info',
        title: '베스트셀러 상품',
        description: `"${transactionAnalysis.topSellingProducts[0].name}"이(가) 가장 많이 판매되었습니다.`,
        priority: 'low',
        actionable: true,
        suggestedAction: '베스트셀러 상품의 재고를 확인하고 가시성을 높이세요.',
        relatedSimulation: 'inventory',
      });
    }
  }

  // 매출 트렌드 인사이트
  if (salesTrendAnalysis) {
    if (salesTrendAnalysis.trend === 'increasing') {
      insights.push({
        type: 'strength',
        title: '매출 상승 추세',
        description: `매출이 ${salesTrendAnalysis.trendPercentage}% 상승하고 있습니다.`,
        priority: 'low',
        actionable: false,
      });
    } else if (salesTrendAnalysis.trend === 'decreasing') {
      insights.push({
        type: 'warning',
        title: '매출 하락 추세',
        description: `매출이 ${Math.abs(salesTrendAnalysis.trendPercentage)}% 하락하고 있습니다.`,
        priority: 'high',
        actionable: true,
        suggestedAction: '수요 예측 및 가격 최적화 시뮬레이션을 실행하세요.',
        relatedSimulation: 'demand',
      });
    }
  }

  // 레이아웃 관련 인사이트
  if (proximityAnalysis) {
    if (proximityAnalysis.isolatedFurniture.length > 0) {
      insights.push({
        type: 'warning',
        title: '고립된 가구 발견',
        description: `${proximityAnalysis.isolatedFurniture.join(', ')}이(가) 다른 가구들과 멀리 떨어져 있습니다.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '레이아웃 시뮬레이션으로 최적 위치를 찾으세요.',
        relatedSimulation: 'layout',
      });
    }

    if (proximityAnalysis.farProximityPairs.length > 0) {
      insights.push({
        type: 'opportunity',
        title: '가구 재배치 기회',
        description: `일부 가구들이 10m 이상 떨어져 있어 동선이 길어질 수 있습니다.`,
        priority: 'low',
        actionable: true,
        suggestedAction: '레이아웃 최적화를 통해 고객 동선을 단축하세요.',
        relatedSimulation: 'layout',
      });
    }
  }

  // 진열 관련 인사이트
  if (displayAnalysis) {
    if (displayAnalysis.underutilizedFurniture.length > 0) {
      insights.push({
        type: 'opportunity',
        title: '활용도 낮은 가구',
        description: `${displayAnalysis.underutilizedFurniture.join(', ')}에 더 많은 상품을 진열할 수 있습니다.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '재고 최적화 시뮬레이션으로 적절한 상품을 찾으세요.',
        relatedSimulation: 'inventory',
      });
    }

    if (displayAnalysis.overloadedFurniture.length > 0) {
      insights.push({
        type: 'warning',
        title: '과밀 진열 가구',
        description: `${displayAnalysis.overloadedFurniture.map(f => f.name).join(', ')}에 상품이 너무 많이 진열되어 있습니다.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: '상품을 분산 배치하여 가시성을 높이세요.',
        relatedSimulation: 'layout',
      });
    }
  }

  // 우선순위로 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export function IntegratedDataAnalysis({ 
  contextData, 
  loading = false,
  onRefresh 
}: IntegratedDataAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'sales' | 'layout' | 'insights'>('overview');

  // 분석 결과 계산
  const analysis = useMemo(() => {
    if (!contextData) return null;

    const visitAnalysis = analyzeVisitPatterns(contextData.visits || []);
    const transactionAnalysis = analyzeTransactionPatterns(contextData.transactions || []);
    const salesTrendAnalysis = analyzeDailySalesTrends(contextData.dailySales || []);
    const proximityAnalysis = analyzeProximityRelations(
      contextData.relations || [], 
      contextData.entities || []
    );
    const displayAnalysis = analyzeDisplayRelations(
      contextData.relations || [], 
      contextData.entities || []
    );
    const entityAnalysis = analyzeEntities(contextData.entities || []);
    const correlations = analyzeCorrelations(visitAnalysis, transactionAnalysis, displayAnalysis);
    const insights = generateInsights(
      visitAnalysis, 
      transactionAnalysis, 
      salesTrendAnalysis, 
      proximityAnalysis, 
      displayAnalysis, 
      entityAnalysis
    );

    return {
      visitAnalysis,
      transactionAnalysis,
      salesTrendAnalysis,
      proximityAnalysis,
      displayAnalysis,
      entityAnalysis,
      correlations,
      insights,
    };
  }, [contextData]);

  // 데이터 가용성 체크
  const dataAvailability = useMemo(() => {
    if (!contextData) return { total: 0, available: 0 };
    
    const checks = [
      { name: 'entities', available: (contextData.entities?.length || 0) > 0 },
      { name: 'relations', available: (contextData.relations?.length || 0) > 0 },
      { name: 'visits', available: (contextData.visits?.length || 0) > 0 },
      { name: 'transactions', available: (contextData.transactions?.length || 0) > 0 },
      { name: 'dailySales', available: (contextData.dailySales?.length || 0) > 0 },
      { name: 'products', available: (contextData.products?.length || 0) > 0 },
    ];

    return {
      total: checks.length,
      available: checks.filter(c => c.available).length,
      details: checks,
    };
  }, [contextData]);

  if (!contextData) {
    return null;
  }

  const TrendIcon = ({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const InsightIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'strength': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Sparkles className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <Card className="mb-6 border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    통합 데이터 분석
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI 분석
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    시뮬레이션 전 매장 데이터 종합 분석 및 인사이트
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* 데이터 가용성 표시 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">데이터 소스:</span>
                  <Badge variant="outline">
                    {dataAvailability.available}/{dataAvailability.total}
                  </Badge>
                </div>
                {/* 인사이트 개수 */}
                {analysis?.insights && analysis.insights.length > 0 && (
                  <Badge 
                    variant={analysis.insights.some(i => i.priority === 'high') ? 'destructive' : 'secondary'}
                    className="gap-1"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {analysis.insights.length}개 인사이트
                  </Badge>
                )}
                {onRefresh && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="overview" className="gap-1 text-xs">
                  <Layers className="h-3 w-3" />
                  개요
                </TabsTrigger>
                <TabsTrigger value="visits" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  방문
                </TabsTrigger>
                <TabsTrigger value="sales" className="gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  매출
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  레이아웃
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-1 text-xs">
                  <Lightbulb className="h-3 w-3" />
                  인사이트
                  {analysis?.insights && analysis.insights.filter(i => i.priority === 'high').length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {analysis.insights.filter(i => i.priority === 'high').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* 개요 탭 */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 방문 요약 - L3 우선 */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      총 방문
                    </div>
                    <div className="text-2xl font-bold">
                      {analysis?.salesTrendAnalysis?.totalVisitors || analysis?.visitAnalysis?.totalVisits || 0}
                      <span className="text-sm font-normal text-muted-foreground">회</span>
                    </div>
                    {analysis?.salesTrendAnalysis?.avgConversionRate ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        전환율 {analysis.salesTrendAnalysis.avgConversionRate}%
                      </div>
                    ) : analysis?.visitAnalysis?.avgDuration ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        평균 체류 {analysis.visitAnalysis.avgDuration}분
                      </div>
                    ) : null}
                  </div>

                  {/* 매출 요약 - L3 우선 */}
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      총 매출
                    </div>
                    <div className="text-2xl font-bold">
                      {((analysis?.salesTrendAnalysis?.totalRevenue || analysis?.transactionAnalysis?.totalRevenue || 0) / 10000).toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground">만원</span>
                    </div>
                    {analysis?.salesTrendAnalysis && (
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <TrendIcon trend={analysis.salesTrendAnalysis.trend} />
                        <span className={
                          analysis.salesTrendAnalysis.trend === 'increasing' ? 'text-green-600' :
                          analysis.salesTrendAnalysis.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                        }>
                          {analysis.salesTrendAnalysis.trendPercentage > 0 ? '+' : ''}
                          {analysis.salesTrendAnalysis.trendPercentage}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 거래 요약 - L3 우선 */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      총 거래
                    </div>
                    <div className="text-2xl font-bold">
                      {analysis?.salesTrendAnalysis?.totalTransactions || analysis?.transactionAnalysis?.totalTransactions || 0}
                      <span className="text-sm font-normal text-muted-foreground">건</span>
                    </div>
                    {(analysis?.salesTrendAnalysis || analysis?.transactionAnalysis) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        평균 {(((analysis.salesTrendAnalysis?.avgTransactionValue || analysis.transactionAnalysis?.avgTransactionValue || 0)) / 10000).toFixed(1)}만원
                      </div>
                    )}
                  </div>

                  {/* 엔티티 요약 */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Network className="h-4 w-4" />
                      지식 그래프
                    </div>
                    <div className="text-2xl font-bold">
                      {contextData.entities?.length || 0}
                      <span className="text-sm font-normal text-muted-foreground">개</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {contextData.relations?.length || 0}개 관계
                    </div>
                  </div>
                </div>

                {/* 상관관계 분석 */}
                {analysis?.correlations && analysis.correlations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      데이터 상관관계
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {analysis.correlations.map((corr, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            corr.type === 'positive' ? 'bg-green-50 border-green-200 dark:bg-green-950/30' :
                            corr.type === 'negative' ? 'bg-red-50 border-red-200 dark:bg-red-950/30' :
                            'bg-gray-50 border-gray-200 dark:bg-gray-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>{corr.source}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{corr.target}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {corr.description}
                          </p>
                          <Progress value={corr.strength} className="h-1 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 방문 분석 탭 */}
              <TabsContent value="visits" className="space-y-4">
                {analysis?.visitAnalysis ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">총 방문</div>
                        <div className="text-xl font-bold">{analysis.visitAnalysis.totalVisits}회</div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">고유 고객</div>
                        <div className="text-xl font-bold">{analysis.visitAnalysis.uniqueCustomers}명</div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">평균 체류</div>
                        <div className="text-xl font-bold">{analysis.visitAnalysis.avgDuration}분</div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">피크 시간</div>
                        <div className="text-xl font-bold">
                          {analysis.visitAnalysis.peakHours[0]?.hour || '-'}시
                        </div>
                      </div>
                    </div>

                    {/* 구역별 인기도 */}
                    {Object.keys(analysis.visitAnalysis.zonePopularity).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">구역별 방문율</h4>
                        <div className="space-y-2">
                          {Object.entries(analysis.visitAnalysis.zonePopularity)
                            .sort((a, b) => b[1] - a[1])
                            .map(([zone, percentage]) => (
                              <div key={zone} className="flex items-center gap-2">
                                <span className="text-sm w-24 truncate">{zone}</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-sm w-12 text-right">{percentage}%</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* 주요 동선 */}
                    {analysis.visitAnalysis.customerFlows.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">주요 고객 동선</h4>
                        <div className="space-y-2">
                          {analysis.visitAnalysis.customerFlows.map((flow, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                              <span className="text-sm">{flow.flow}</span>
                              <Badge variant="secondary">{flow.percentage}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 방문 없는 구역 경고 */}
                    {analysis.visitAnalysis.unvisitedZones.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          방문이 없는 구역: {analysis.visitAnalysis.unvisitedZones.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>방문 데이터가 없습니다</p>
                  </div>
                )}
              </TabsContent>

              {/* 매출 분석 탭 - L3 우선 */}
              <TabsContent value="sales" className="space-y-4">
                {analysis?.salesTrendAnalysis || analysis?.transactionAnalysis ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(analysis.salesTrendAnalysis || analysis.transactionAnalysis) && (
                        <>
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <div className="text-xs text-muted-foreground">총 거래</div>
                            <div className="text-xl font-bold">{analysis.salesTrendAnalysis?.totalTransactions || analysis.transactionAnalysis?.totalTransactions || 0}건</div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <div className="text-xs text-muted-foreground">총 매출</div>
                            <div className="text-xl font-bold">{((analysis.salesTrendAnalysis?.totalRevenue || analysis.transactionAnalysis?.totalRevenue || 0) / 10000).toFixed(0)}만원</div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <div className="text-xs text-muted-foreground">평균 거래액</div>
                            <div className="text-xl font-bold">{((analysis.salesTrendAnalysis?.avgTransactionValue || analysis.transactionAnalysis?.avgTransactionValue || 0) / 1000).toFixed(0)}천원</div>
                          </div>
                          {analysis.transactionAnalysis?.repeatCustomerRate !== undefined && (
                            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <div className="text-xs text-muted-foreground">재구매율</div>
                              <div className="text-xl font-bold">{analysis.transactionAnalysis.repeatCustomerRate}%</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* 매출 트렌드 */}
                    {analysis.salesTrendAnalysis && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendIcon trend={analysis.salesTrendAnalysis.trend} />
                          매출 트렌드 ({analysis.salesTrendAnalysis.totalDays}일)
                        </h4>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <div className="text-xs text-muted-foreground">일평균</div>
                            <div className="font-medium">{(analysis.salesTrendAnalysis.avgDailyRevenue / 10000).toFixed(1)}만원</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">최고</div>
                            <div className="font-medium text-green-600">
                              {analysis.salesTrendAnalysis.bestDay?.date?.split('-').slice(1).join('/')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">최저</div>
                            <div className="font-medium text-red-600">
                              {analysis.salesTrendAnalysis.worstDay?.date?.split('-').slice(1).join('/')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 베스트셀러 */}
                    {analysis.transactionAnalysis?.topSellingProducts && analysis.transactionAnalysis.topSellingProducts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">베스트셀러 상품</h4>
                        <div className="space-y-2">
                          {analysis.transactionAnalysis.topSellingProducts.slice(0, 5).map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                              <span className="text-sm flex items-center gap-2">
                                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                  {idx + 1}
                                </Badge>
                                {product.name}
                              </span>
                              <span className="text-sm text-muted-foreground">{product.count}개 판매</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>매출/거래 데이터가 없습니다</p>
                  </div>
                )}
              </TabsContent>

              {/* 레이아웃 분석 탭 */}
              <TabsContent value="layout" className="space-y-4">
                {analysis?.entityAnalysis ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">총 엔티티</div>
                        <div className="text-xl font-bold">{analysis.entityAnalysis.totalEntities}개</div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">가구</div>
                        <div className="text-xl font-bold">{analysis.entityAnalysis.furnitureCount}개</div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">상품</div>
                        <div className="text-xl font-bold">{analysis.entityAnalysis.productCount}개</div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">관계</div>
                        <div className="text-xl font-bold">{contextData.relations?.length || 0}개</div>
                      </div>
                    </div>

                    {/* 근접성 분석 */}
                    {analysis.proximityAnalysis && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">가구 근접성 분석</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">가까운 가구 쌍 ({`<`}4m)</div>
                            {analysis.proximityAnalysis.closeProximityPairs.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {analysis.proximityAnalysis.closeProximityPairs.slice(0, 3).map((pair, idx) => (
                                  <li key={idx} className="text-green-600">
                                    {pair.source} ↔ {pair.target} ({pair.distance.toFixed(1)}m)
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">없음</p>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">먼 가구 쌍 ({`>`}10m)</div>
                            {analysis.proximityAnalysis.farProximityPairs.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {analysis.proximityAnalysis.farProximityPairs.slice(0, 3).map((pair, idx) => (
                                  <li key={idx} className="text-red-600">
                                    {pair.source} ↔ {pair.target} ({pair.distance.toFixed(1)}m)
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">없음</p>
                            )}
                          </div>
                        </div>
                        {analysis.proximityAnalysis.isolatedFurniture.length > 0 && (
                          <Alert className="mt-3" variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              고립된 가구: {analysis.proximityAnalysis.isolatedFurniture.join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* 진열 분석 */}
                    {analysis.displayAnalysis && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">가구별 진열 현황</h4>
                        <div className="space-y-2">
                          {Object.entries(analysis.displayAnalysis.furnitureProductMap).map(([furniture, data]) => (
                            <div key={furniture} className="flex items-center justify-between">
                              <span className="text-sm">{furniture}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{data.products.length}개 상품</Badge>
                                {data.hasTester > 0 && (
                                  <Badge variant="secondary">테스터 {data.hasTester}개</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          평균 {analysis.displayAnalysis.avgProductsPerFurniture}개/가구
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>레이아웃 데이터가 없습니다</p>
                  </div>
                )}
              </TabsContent>

              {/* 인사이트 탭 */}
              <TabsContent value="insights" className="space-y-4">
                {analysis?.insights && analysis.insights.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.insights.map((insight, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30' :
                          insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30' :
                          insight.type === 'strength' ? 'bg-green-50 border-green-200 dark:bg-green-950/30' :
                          'bg-purple-50 border-purple-200 dark:bg-purple-950/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <InsightIcon type={insight.type} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{insight.title}</span>
                              <Badge 
                                variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {insight.priority === 'high' ? '높음' : insight.priority === 'medium' ? '중간' : '낮음'}
                              </Badge>
                              {insight.relatedSimulation && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  {insight.relatedSimulation === 'layout' && <MapPin className="h-3 w-3" />}
                                  {insight.relatedSimulation === 'demand' && <TrendingUp className="h-3 w-3" />}
                                  {insight.relatedSimulation === 'pricing' && <DollarSign className="h-3 w-3" />}
                                  {insight.relatedSimulation === 'inventory' && <Package className="h-3 w-3" />}
                                  {insight.relatedSimulation === 'marketing' && <Target className="h-3 w-3" />}
                                  {insight.relatedSimulation}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                            {insight.actionable && insight.suggestedAction && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                {insight.suggestedAction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>분석할 데이터가 충분하지 않습니다</p>
                    <p className="text-sm mt-1">더 많은 데이터를 추가하면 인사이트를 제공합니다</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default IntegratedDataAnalysis;
