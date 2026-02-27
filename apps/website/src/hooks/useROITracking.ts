/**
 * useROITracking.ts
 *
 * Customer Dashboard ROI 추적 Hook
 * - AI 추천 적용 전/후 KPI 비교
 * - 자동 ROI 계산 및 결과 표시
 * - 연간 영향 추정
 *
 * Origin: apps/os-dashboard/src/hooks/useROITracking.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// 타입 정의
// ============================================================================

export interface RecommendationApplication {
  id: string;
  org_id: string;
  store_id: string;
  scenario_id: string | null;
  recommendation_type: RecommendationType;
  recommendation_summary: string | null;
  recommendation_details: Record<string, any>;
  baseline_date: string;
  baseline_kpis: BaselineKPIs;
  applied_at: string | null;
  applied_by: string | null;
  measurement_period_days: number;
  measurement_start_date: string | null;
  measurement_end_date: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface ROIMeasurement {
  id: string;
  org_id: string;
  application_id: string;
  measurement_start_date: string;
  measurement_end_date: string;
  measurement_days: number;
  measured_kpis: BaselineKPIs;
  kpi_changes: KPIChanges;
  statistical_significance: StatisticalSignificance | null;
  estimated_annual_impact: AnnualImpact | null;
  summary_text: string | null;
  is_positive_impact: boolean | null;
  created_at: string;
}

export interface BaselineKPIs {
  total_revenue: number;
  total_visitors: number;
  conversion_rate: number;
  avg_transaction_value: number;
  items_per_transaction?: number;
  avg_dwell_time_minutes?: number;
}

export interface KPIChange {
  absolute: number;
  percentage: number;
}

export interface KPIChanges {
  total_revenue?: KPIChange;
  total_visitors?: KPIChange;
  conversion_rate?: KPIChange;
  avg_transaction_value?: KPIChange;
  [key: string]: KPIChange | undefined;
}

export interface StatisticalSignificance {
  p_value: number;
  confidence_interval: [number, number];
  sample_size: number;
  is_significant: boolean;
}

export interface AnnualImpact {
  revenue: number;
  visitors: number;
  transactions: number;
}

export type RecommendationType =
  | 'layout'
  | 'pricing'
  | 'inventory'
  | 'marketing'
  | 'staffing'
  | 'promotion';

export type ApplicationStatus =
  | 'pending'
  | 'applied'
  | 'measuring'
  | 'completed'
  | 'reverted';

// 추천 유형 한글 라벨
export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  layout: '레이아웃 최적화',
  pricing: '가격 최적화',
  inventory: '재고 최적화',
  marketing: '마케팅 최적화',
  staffing: '인력 배치',
  promotion: '프로모션',
};

// 상태 한글 라벨
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '대기 중',
  applied: '적용됨',
  measuring: '측정 중',
  completed: '완료',
  reverted: '되돌림',
};

// ============================================================================
// 추천 적용 목록 조회
// ============================================================================

export function useRecommendationApplications(storeId?: string) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['recommendation-applications', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('recommendation_applications' as any)
        .select(`
          *,
          stores (store_name),
          scenarios (scenario_name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }) as any);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as (RecommendationApplication & {
        stores: { store_name: string } | null;
        scenarios: { scenario_name: string } | null;
      })[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// ROI 측정 결과 조회
// ============================================================================

export function useROIMeasurements(applicationId?: string) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['roi-measurements', orgId, applicationId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('roi_measurements' as any)
        .select(`
          *,
          recommendation_applications (
            recommendation_type,
            recommendation_summary,
            store_id,
            stores (store_name)
          )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }) as any);

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as (ROIMeasurement & {
        recommendation_applications: {
          recommendation_type: RecommendationType;
          recommendation_summary: string | null;
          store_id: string;
          stores: { store_name: string } | null;
        } | null;
      })[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// ROI 요약 통계
// ============================================================================

export function useROISummary(storeId?: string) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['roi-summary', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return null;

      let query = (supabase
        .from('roi_measurements' as any)
        .select(`
          *,
          recommendation_applications!inner (
            recommendation_type,
            store_id
          )
        `)
        .eq('org_id', orgId) as any);

      if (storeId) {
        query = query.eq('recommendation_applications.store_id', storeId);
      }

      const { data: measurements, error } = await query;
      if (error) throw error;

      if (!measurements || measurements.length === 0) {
        return {
          totalApplications: 0,
          completedMeasurements: 0,
          avgROI: 0,
          positiveImpactRate: 0,
          totalEstimatedAnnualImpact: 0,
          byType: {} as Record<RecommendationType, { count: number; avgROI: number }>,
        };
      }

      const positiveCount = measurements.filter((m: any) => m.is_positive_impact).length;
      const roiValues = measurements
        .map((m: any) => (m.kpi_changes as any)?.total_revenue?.percentage || 0)
        .filter((v: number) => v !== 0);

      const avgROI = roiValues.length > 0
        ? roiValues.reduce((a: number, b: number) => a + b, 0) / roiValues.length
        : 0;

      const totalAnnualImpact = measurements
        .reduce((sum: number, m: any) => sum + ((m.estimated_annual_impact as any)?.revenue || 0), 0);

      const byType: Record<string, { count: number; totalROI: number }> = {};
      measurements.forEach((m: any) => {
        const type = (m.recommendation_applications as any)?.recommendation_type;
        if (type) {
          if (!byType[type]) byType[type] = { count: 0, totalROI: 0 };
          byType[type].count++;
          byType[type].totalROI += (m.kpi_changes as any)?.total_revenue?.percentage || 0;
        }
      });

      const byTypeResult: Record<string, { count: number; avgROI: number }> = {};
      Object.entries(byType).forEach(([type, data]) => {
        byTypeResult[type] = {
          count: data.count,
          avgROI: data.count > 0 ? data.totalROI / data.count : 0,
        };
      });

      return {
        totalApplications: measurements.length,
        completedMeasurements: measurements.length,
        avgROI: Math.round(avgROI * 10) / 10,
        positiveImpactRate: Math.round((positiveCount / measurements.length) * 100),
        totalEstimatedAnnualImpact: Math.round(totalAnnualImpact),
        byType: byTypeResult,
      };
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 추천 적용 시작 (베이스라인 캡처)
// ============================================================================

export function useApplyRecommendation() {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      scenarioId,
      recommendationType,
      recommendationSummary,
      recommendationDetails,
      measurementDays = 7,
    }: {
      storeId: string;
      scenarioId?: string;
      recommendationType: RecommendationType;
      recommendationSummary: string;
      recommendationDetails?: Record<string, any>;
      measurementDays?: number;
    }) => {
      if (!user?.id || !orgId) throw new Error('User not authenticated');
      if (!storeId) throw new Error('Store ID is required for ROI tracking');

      // 현재 KPI를 베이스라인으로 캡처
      const baselineKpis = await fetchCurrentKPIs(storeId, 7);

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await (supabase
        .from('recommendation_applications' as any)
        .insert({
          org_id: orgId,
          store_id: storeId,
          scenario_id: scenarioId || null,
          recommendation_type: recommendationType,
          recommendation_summary: recommendationSummary,
          recommendation_details: recommendationDetails || {},
          baseline_date: today,
          baseline_kpis: baselineKpis,
          applied_at: new Date().toISOString(),
          applied_by: user.id,
          measurement_period_days: measurementDays,
          measurement_start_date: today,
          measurement_end_date: addDays(today, measurementDays),
          status: 'applied',
        })
        .select()
        .single() as any);

      if (error) throw error;

      // KPI 스냅샷 저장 (베이스라인)
      await (supabase.from('kpi_snapshots' as any).insert({
        org_id: orgId,
        store_id: storeId,
        application_id: data.id,
        snapshot_date: today,
        snapshot_type: 'baseline',
        ...baselineKpis,
      }) as any);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-applications'] });
      toast({
        title: '추천 적용 시작!',
        description: `${data.measurement_period_days}일 후 ROI 결과를 확인할 수 있습니다.`,
      });
    },
    onError: () => {
      toast({
        title: '추천 적용 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// ROI 측정 완료 (측정 기간 후)
// ============================================================================

export function useCompleteROIMeasurement() {
  const { orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      if (!orgId) throw new Error('Org not found');

      // 적용 정보 조회
      const { data: application, error: appError } = await (supabase
        .from('recommendation_applications' as any)
        .select('*')
        .eq('id', applicationId)
        .single() as any);

      if (appError) throw appError;

      // 현재 KPI 측정
      const measuredKpis = await fetchCurrentKPIs(application.store_id, application.measurement_period_days);

      // 연간 영향 추정
      const baselineKpis = application.baseline_kpis as any;
      const dailyRevenueChange = (measuredKpis.total_revenue - (baselineKpis?.total_revenue || 0));
      const annualImpact = {
        revenue: Math.round(dailyRevenueChange * 365),
        visitors: Math.round((measuredKpis.total_visitors - (baselineKpis?.total_visitors || 0)) * 365),
        transactions: Math.round(
          ((measuredKpis.total_visitors * measuredKpis.conversion_rate / 100) -
           ((baselineKpis?.total_visitors || 0) * (baselineKpis?.conversion_rate || 0) / 100)) * 365
        ),
      };

      // ROI 계산 (%)
      const baselineRevenue = baselineKpis?.total_revenue || 0;
      const actualROI = baselineRevenue > 0
        ? ((measuredKpis.total_revenue - baselineRevenue) / baselineRevenue) * 100
        : 0;

      // ROI 측정 결과 저장
      const { data: measurement, error: measureError } = await (supabase
        .from('roi_measurements' as any)
        .insert({
          org_id: orgId,
          application_id: applicationId,
          measurement_start_date: application.measurement_start_date,
          measurement_end_date: new Date().toISOString().split('T')[0],
          measurement_days: application.measurement_period_days,
          measured_kpis: measuredKpis,
          estimated_annual_impact: annualImpact,
        })
        .select()
        .single() as any);

      if (measureError) throw measureError;

      // 적용 상태 업데이트
      await (supabase
        .from('recommendation_applications' as any)
        .update({ status: 'completed' })
        .eq('id', applicationId) as any);

      // KPI 스냅샷 저장 (측정 후)
      await (supabase.from('kpi_snapshots' as any).insert({
        org_id: orgId,
        store_id: application.store_id,
        application_id: applicationId,
        snapshot_date: new Date().toISOString().split('T')[0],
        snapshot_type: 'measurement',
        ...measuredKpis,
      }) as any);

      // Continuous Learning: strategy_feedback 테이블에 저장
      try {
        const recommendationDetails = application.recommendation_details || {};
        const expectedROI = recommendationDetails.expectedROI ||
          recommendationDetails.optimizationSummary?.expectedRevenueIncrease || 0;

        let feedbackType: string;
        if (actualROI >= expectedROI * 0.8) {
          feedbackType = 'success';
        } else if (actualROI >= expectedROI * 0.5) {
          feedbackType = 'partial';
        } else if (actualROI < 0) {
          feedbackType = 'negative';
        } else {
          feedbackType = 'failure';
        }

        const roiAccuracy = expectedROI !== 0
          ? Math.max(0, 100 - Math.abs((actualROI - expectedROI) / expectedROI) * 100)
          : 0;

        await supabase.from('strategy_feedback').insert({
          org_id: orgId,
          store_id: application.store_id,
          strategy_type: application.recommendation_type || 'layout',
          ai_recommendation: recommendationDetails,
          was_applied: true,
          applied_at: application.applied_at,
          result_measured: true,
          measurement_period_days: application.measurement_period_days,
          measurement_start_date: application.measurement_start_date,
          measurement_end_date: new Date().toISOString().split('T')[0],
          baseline_metrics: {
            revenue: baselineKpis?.total_revenue || 0,
            visitors: baselineKpis?.total_visitors || 0,
            conversion: baselineKpis?.conversion_rate || 0,
          },
          actual_metrics: {
            revenue: measuredKpis.total_revenue,
            visitors: measuredKpis.total_visitors,
            conversion: measuredKpis.conversion_rate,
          },
          expected_roi: expectedROI,
          actual_roi: Math.round(actualROI * 10) / 10,
          roi_accuracy: Math.round(roiAccuracy),
          feedback_type: feedbackType,
        });
      } catch (feedbackErr) {
        console.warn('[Learning] Failed to save feedback:', feedbackErr);
      }

      return measurement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-applications'] });
      queryClient.invalidateQueries({ queryKey: ['roi-measurements'] });
      queryClient.invalidateQueries({ queryKey: ['roi-summary'] });

      const change = (data?.kpi_changes as any)?.total_revenue;
      if (change) {
        toast({
          title: 'ROI 측정 완료!',
          description: `매출 ${change.percentage > 0 ? '+' : ''}${change.percentage}% (${formatCurrency(change.absolute)})`,
        });
      }
    },
    onError: () => {
      toast({
        title: 'ROI 측정 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 추천 되돌리기
// ============================================================================

export function useRevertRecommendation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase
        .from('recommendation_applications' as any)
        .update({
          status: 'reverted',
          reverted_at: new Date().toISOString(),
          reverted_reason: reason || null,
        })
        .eq('id', applicationId)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendation-applications'] });
      toast({
        title: '추천 되돌리기 완료',
        description: '이전 상태로 복원되었습니다.',
      });
    },
  });
}

// ============================================================================
// 측정 대기 중인 추천 조회
// ============================================================================

export function usePendingMeasurements(storeId?: string) {
  const { data: applications = [] } = useRecommendationApplications(storeId);

  const today = new Date().toISOString().split('T')[0];

  return applications.filter(app => {
    if (app.status !== 'applied') return false;
    if (!app.measurement_end_date) return false;
    return app.measurement_end_date <= today;
  });
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

async function fetchCurrentKPIs(storeId: string, days: number): Promise<BaselineKPIs> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('daily_kpis_agg')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      total_revenue: 0,
      total_visitors: 0,
      conversion_rate: 0,
      avg_transaction_value: 0,
    };
  }

  const sum = data.reduce(
    (acc, kpi) => ({
      total_revenue: acc.total_revenue + (kpi.total_revenue || 0),
      total_visitors: acc.total_visitors + (kpi.total_visitors || 0),
      total_transactions: acc.total_transactions + (kpi.total_transactions || 0),
    }),
    { total_revenue: 0, total_visitors: 0, total_transactions: 0 }
  );

  const avgRevenue = sum.total_revenue / days;
  const avgVisitors = sum.total_visitors / days;
  const avgTransactions = sum.total_transactions / days;
  const conversionRate = avgVisitors > 0 ? (avgTransactions / avgVisitors) * 100 : 0;
  const avgTransactionValue = avgTransactions > 0 ? sum.total_revenue / sum.total_transactions : 0;

  return {
    total_revenue: Math.round(avgRevenue),
    total_visitors: Math.round(avgVisitors),
    conversion_rate: Math.round(conversionRate * 10) / 10,
    avg_transaction_value: Math.round(avgTransactionValue),
  };
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${Math.round(value / 100000000)}억원`;
  } else if (value >= 10000) {
    return `${Math.round(value / 10000)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

// ============================================================================
// ROI 결과 포맷팅 유틸리티
// ============================================================================

export function formatROIChange(change: KPIChange | undefined): string {
  if (!change) return '-';
  const sign = change.percentage > 0 ? '+' : '';
  return `${sign}${change.percentage.toFixed(1)}%`;
}

export function formatKPIValue(key: string, value: number): string {
  switch (key) {
    case 'total_revenue':
    case 'avg_transaction_value':
      return formatCurrency(value);
    case 'total_visitors':
      return `${value.toLocaleString()}명`;
    case 'conversion_rate':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
}

export function getROIColor(percentage: number): string {
  if (percentage > 10) return 'text-green-600';
  if (percentage > 0) return 'text-green-500';
  if (percentage > -5) return 'text-yellow-500';
  return 'text-red-500';
}

export function getROIBgColor(percentage: number): string {
  if (percentage > 10) return 'bg-green-50';
  if (percentage > 0) return 'bg-green-50/50';
  if (percentage > -5) return 'bg-yellow-50';
  return 'bg-red-50';
}
