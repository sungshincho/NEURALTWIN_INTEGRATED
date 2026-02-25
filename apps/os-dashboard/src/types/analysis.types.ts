/**
 * 분석 관련 공통 타입 정의
 * AI 인사이트, 상관관계 분석 등에 사용되는 타입들
 */

// 기본 Insight 타입
export interface BaseInsight {
  title: string;
  description: string;
  impact?: string;
}

// AI 분석용 Insight (AIInsights 컴포넌트용)
export interface AIInsight extends BaseInsight {
  type: "trend" | "warning" | "recommendation";
  impact?: "high" | "medium" | "low";
}

// 대시보드용 Insight (InsightsDashboard 컴포넌트용)
export interface DashboardInsight extends BaseInsight {
  category?: string;
  actionable?: string;
  recommendation?: string;
}

// 그래프 분석용 Insight (GraphAnalysisPage용)
export interface GraphInsight extends BaseInsight {
  recommendation: string;
}

// Alert 타입
export interface Alert {
  id: string;
  metric: string;
  condition: "above" | "below";
  threshold: number;
  enabled: boolean;
}

// Filter State 타입
export interface FilterState {
  dateRange: { from: Date; to?: Date } | undefined;
  store: string;
  category: string;
}

// 상관관계 분석 타입
export interface Correlation {
  factor1: string;
  factor2: string;
  correlation: number;
  correlationPercent?: string;
  insight?: string;
  actionable?: string;
}

// 구매 영향 요인 타입
export interface PurchaseInfluencer {
  factor: string;
  score: number;
  insight: string;
}

// WTP (Willingness To Pay) 분석 타입
export interface WTPAnalysis {
  avgWTP: number;
  atv: number;
  priceElasticityScore: number;
  priceElasticityInsights: string[];
  pricingRecommendation?: string;
  purchaseInfluencers?: PurchaseInfluencer[];
  actionable: string;
}
