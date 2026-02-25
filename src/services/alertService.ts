/**
 * alertService.ts
 *
 * 알림 자동 생성 서비스
 */

import { supabase } from '@/integrations/supabase/client';

export interface GeneratedAlert {
  alertType: 'inventory' | 'conversion' | 'goal' | 'recommendation' | 'roi';
  severity: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// 재고 부족 체크
// ============================================================================

export async function checkInventoryAlerts(
  storeId: string,
  orgId: string
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  try {
    // products 테이블에서 재고 부족 체크
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, product_name, stock')
      .eq('store_id', storeId)
      .eq('org_id', orgId)
      .gt('stock', 0)
      .lt('stock', 10);

    if (lowStockProducts) {
      for (const product of lowStockProducts) {
        alerts.push({
          alertType: 'inventory',
          severity: (product.stock ?? 0) <= 3 ? 'critical' : 'warning',
          title: `재고 부족: ${product.product_name}`,
          message: `현재 재고 ${product.stock ?? 0}개 - 보충이 필요합니다`,
          actionUrl: `/inventory?product=${product.id}`,
          actionLabel: '재고 관리',
          metadata: {
            productId: product.id,
            currentStock: product.stock ?? 0,
          },
        });
      }
    }
  } catch (error) {
    console.error('Inventory alert check failed:', error);
  }

  return alerts;
}

// ============================================================================
// 전환율 하락 체크
// ============================================================================

export async function checkConversionAlerts(
  storeId: string,
  _orgId: string
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  try {
    // 최근 7일 평균 전환율
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const { data: recentKpis } = await supabase
      .from('daily_kpis_agg')
      .select('conversion_rate')
      .eq('store_id', storeId)
      .gte('date', recentDate.toISOString().split('T')[0]);

    // 이전 7일 평균 전환율
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - 14);
    const previousEnd = new Date();
    previousEnd.setDate(previousEnd.getDate() - 7);

    const { data: previousKpis } = await supabase
      .from('daily_kpis_agg')
      .select('conversion_rate')
      .eq('store_id', storeId)
      .gte('date', previousStart.toISOString().split('T')[0])
      .lt('date', previousEnd.toISOString().split('T')[0]);

    if (recentKpis?.length && previousKpis?.length) {
      const recentAvg =
        recentKpis.reduce((sum, k) => sum + (k.conversion_rate || 0), 0) /
        recentKpis.length;
      const previousAvg =
        previousKpis.reduce((sum, k) => sum + (k.conversion_rate || 0), 0) /
        previousKpis.length;

      // 15% 이상 하락 시 경고
      if (previousAvg > 0 && recentAvg < previousAvg * 0.85) {
        const dropPct = ((1 - recentAvg / previousAvg) * 100).toFixed(1);
        alerts.push({
          alertType: 'conversion',
          severity: 'warning',
          title: '전환율 하락 감지',
          message: `최근 7일 전환율 ${recentAvg.toFixed(1)}% (이전 대비 ${dropPct}% 하락)`,
          actionUrl: '/analysis/customer?section=funnel',
          actionLabel: '분석하기',
          metadata: {
            recentRate: recentAvg,
            previousRate: previousAvg,
            dropPercent: parseFloat(dropPct),
          },
        });
      }
    }
  } catch (error) {
    console.error('Conversion alert check failed:', error);
  }

  return alerts;
}

// ============================================================================
// 목표 달성 체크
// ============================================================================

export async function checkGoalAlerts(
  storeId: string,
  orgId: string
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  try {
    const today = new Date().toISOString().split('T')[0];

    // 활성 목표 조회
    const { data: goals } = await supabase
      .from('store_goals')
      .select('*')
      .eq('store_id', storeId)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .lte('period_start', today)
      .gte('period_end', today);

    if (goals) {
      for (const goal of goals) {
        // 해당 기간의 KPI 조회
        const { data: kpis } = await supabase
          .from('daily_kpis_agg')
          .select('total_revenue, total_visitors, conversion_rate, avg_transaction_value')
          .eq('store_id', storeId)
          .gte('date', goal.period_start)
          .lte('date', goal.period_end);

        if (kpis && kpis.length > 0) {
          let currentValue = 0;

          switch (goal.goal_type) {
            case 'revenue':
              currentValue = kpis.reduce((sum, k) => sum + (k.total_revenue || 0), 0);
              break;
            case 'visitors':
              currentValue = kpis.reduce((sum, k) => sum + (k.total_visitors || 0), 0);
              break;
            case 'conversion':
              currentValue =
                kpis.reduce((sum, k) => sum + (k.conversion_rate || 0), 0) / kpis.length;
              break;
            case 'avg_basket':
              currentValue =
                kpis.reduce((sum, k) => sum + (k.avg_transaction_value || 0), 0) /
                kpis.length;
              break;
          }

          if (currentValue >= goal.target_value) {
            const goalLabels: Record<string, string> = {
              revenue: '매출',
              visitors: '방문자',
              conversion: '전환율',
              avg_basket: '객단가',
            };

            alerts.push({
              alertType: 'goal',
              severity: 'success',
              title: `🎉 ${goalLabels[goal.goal_type]} 목표 달성!`,
              message: `${goal.period_type === 'monthly' ? '이번 달' : goal.period_type === 'weekly' ? '이번 주' : '오늘'} 목표를 달성했습니다`,
              actionUrl: '/',
              actionLabel: '대시보드',
              metadata: {
                goalId: goal.id,
                goalType: goal.goal_type,
                targetValue: goal.target_value,
                currentValue,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Goal alert check failed:', error);
  }

  return alerts;
}

// ============================================================================
// ROI 측정 완료 체크
// ============================================================================

export async function checkROIAlerts(
  storeId: string,
  orgId: string
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  try {
    const today = new Date().toISOString().split('T')[0];

    // 측정 기간이 끝난 추천 적용 건 조회
    const { data: applications } = await supabase
      .from('recommendation_applications')
      .select('id, recommendation_summary, measurement_end_date')
      .eq('store_id', storeId)
      .eq('org_id', orgId)
      .eq('status', 'applied')
      .lte('measurement_end_date', today);

    if (applications) {
      for (const app of applications) {
        alerts.push({
          alertType: 'roi',
          severity: 'info',
          title: 'ROI 측정 준비 완료',
          message: `"${app.recommendation_summary}" 추천의 측정 기간이 종료되었습니다`,
          actionUrl: '/simulation',
          actionLabel: 'ROI 측정',
          metadata: {
            applicationId: app.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('ROI alert check failed:', error);
  }

  return alerts;
}

// ============================================================================
// 모든 알림 체크 (통합)
// ============================================================================

export async function checkAllAlerts(
  storeId: string,
  orgId: string
): Promise<GeneratedAlert[]> {
  const [inventory, conversion, goals, roi] = await Promise.all([
    checkInventoryAlerts(storeId, orgId),
    checkConversionAlerts(storeId, orgId),
    checkGoalAlerts(storeId, orgId),
    checkROIAlerts(storeId, orgId),
  ]);

  return [...inventory, ...conversion, ...goals, ...roi];
}

// ============================================================================
// 알림 저장
// ============================================================================

export async function saveAlerts(
  alerts: GeneratedAlert[],
  storeId: string,
  orgId: string,
  userId?: string
): Promise<void> {
  if (alerts.length === 0) return;

  const alertRecords = alerts.map((alert) => ({
    org_id: orgId,
    store_id: storeId,
    user_id: userId || null,
    alert_type: alert.alertType,
    severity: alert.severity,
    title: alert.title,
    message: alert.message || null,
    action_url: alert.actionUrl || null,
    action_label: alert.actionLabel || null,
    metadata: alert.metadata || {},
  }));

  const { error } = await supabase.from('user_alerts').insert(alertRecords);

  if (error) {
    console.error('Failed to save alerts:', error);
  }
}
