/**
 * 개요(Overview) 탭 쿼리 핸들러
 * queryType: revenue, visitors, conversion, avgTransaction, summary,
 *            footfall, visitFrequency, funnel, goal
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';
import { rpcOverviewKpis, rpcOverviewKpisWithComparison, rpcStoreGoals } from './rpcHelpers.ts';
import { createNavigationActions, getTabDisplayName, getDateRange, formatNumber } from './commonHelpers.ts';
import { formatDataResponse } from '../../response/generator.ts';
import { findTermLocation } from '../../config/dashboardStructure.ts';

export async function queryRevenue(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { current: kpi, comparison: compareKpi } = await rpcOverviewKpisWithComparison(supabase, orgId, storeId, dateRange);
  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;

  let change: number | null = null;
  if (compareKpi) {
    const prevRevenue = compareKpi?.total_revenue ?? 0;
    if (prevRevenue > 0) {
      change = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    }
  }

  const responseData = { totalRevenue, totalTransactions, change };
  const { actions, tabChanged, targetTab } = createNavigationActions('revenue', dateRange, pageContext);

  let message = formatDataResponse('revenue', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  } else {
    message += '\n\n현재 탭에서 데이터를 확인할 수 있습니다.';
  }

  return {
    actions,
    message,
    suggestions: ['방문객 수 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

export async function queryVisitors(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { current: kpi, comparison: compareKpi } = await rpcOverviewKpisWithComparison(supabase, orgId, storeId, dateRange);
  const totalVisitors = kpi?.total_visitors ?? 0;
  const uniqueVisitors = kpi?.unique_visitors ?? 0;

  let change: number | null = null;
  if (compareKpi) {
    const prevUniqueVisitors = compareKpi?.unique_visitors ?? 0;
    if (prevUniqueVisitors > 0) {
      change = Math.round(((uniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors) * 100);
    }
  }

  const responseData = { totalVisitors, uniqueVisitors, change };
  const { actions, tabChanged, targetTab } = createNavigationActions('visitors', dateRange, pageContext);

  let message = formatDataResponse('visitors', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
    const termEntry = findTermLocation('방문객');
    if (termEntry?.secondary && termEntry.secondary.length > 0) {
      const secondaryTab = termEntry.secondary[0].tab;
      if (secondaryTab) {
        message += ` (${getTabDisplayName(secondaryTab)}탭에서도 요약 정보 확인 가능)`;
      }
    }
  } else {
    message += '\n\n현재 탭에서 데이터를 확인할 수 있습니다.';
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '전환율 어때?', '체류 시간 알려줘'],
    data: responseData,
  };
}

export async function queryConversion(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const funnelEntry = kpi?.funnel_entry ?? 0;
  const funnelPurchase = kpi?.funnel_purchase ?? 0;
  const conversionRate = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;

  const responseData = { conversionRate, totalVisitors: funnelEntry, totalTransactions: funnelPurchase };
  const { actions, tabChanged, targetTab } = createNavigationActions('conversion', dateRange, pageContext);

  let message = formatDataResponse('conversion', responseData);
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '방문객 수 알려줘'],
    data: responseData,
  };
}

export async function queryAvgTransaction(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const avgTransaction = kpi?.avg_transaction_value ?? 0;
  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;

  const responseData = { avgTransaction, totalRevenue, totalTransactions };
  const { actions, tabChanged, targetTab } = createNavigationActions('avgTransaction', dateRange, pageContext);

  let message = `평균 객단가는 ${Math.round(avgTransaction).toLocaleString()}원입니다.`;
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 알려줘', '전환율 어때?'],
    data: responseData,
  };
}

export async function querySummary(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('summary', dateRange, pageContext);

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 개요 데이터를 조회할 수 없습니다.`,
      suggestions: ['고객 여정 퍼널 보여줘', '고객탭 보여줘', '시뮬레이션 돌려줘'],
      data: null,
    };
  }

  const footfall = kpi.funnel_entry ?? kpi.total_visitors ?? 0;
  const totalRevenue = kpi.total_revenue ?? 0;
  const totalTransactions = kpi.total_transactions ?? 0;
  const funnelEntry = kpi.funnel_entry ?? 0;
  const funnelPurchase = kpi.funnel_purchase ?? 0;
  const conversionRate = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;

  let message = `${dateRange.startDate} ~ ${dateRange.endDate} 주요 지표입니다:\n` +
    `• 총 방문객: ${footfall.toLocaleString()}명\n` +
    `• 총 매출: ₩${totalRevenue.toLocaleString()}원\n` +
    `• 총 거래: ${totalTransactions.toLocaleString()}건\n` +
    `• 구매 전환율: ${conversionRate.toFixed(1)}%`;

  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['고객 여정 퍼널 보여줘', '고객탭 보여줘', '시뮬레이션 돌려줘'],
    data: { footfall, totalRevenue, totalTransactions, conversionRate },
  };
}

export async function queryFootfall(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('footfall', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `총 입장 횟수 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['순 방문객 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  const totalFootfall = kpi.funnel_entry ?? kpi.total_visitors ?? 0;
  const uniqueVisitors = kpi.unique_visitors ?? 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 총 입장 횟수는 ${totalFootfall.toLocaleString()}회입니다 (순 방문객 ${uniqueVisitors.toLocaleString()}명).${tabMessage}`,
    suggestions: ['순 방문객 알려줘', '전환율 어때?', '방문 빈도 알려줘'],
    data: { totalFootfall, uniqueVisitors },
  };
}

export async function queryVisitFrequency(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('visitFrequency', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  if (!kpi) {
    return {
      actions,
      message: `방문 빈도 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['방문객 수 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  const footfall = kpi.funnel_entry ?? 0;
  const uniqueVisitors = kpi.unique_visitors ?? 0;
  const visitFrequency = uniqueVisitors > 0 ? (footfall / uniqueVisitors) : 0;

  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 평균 방문 빈도는 ${visitFrequency.toFixed(1)}회입니다 (Footfall ${footfall.toLocaleString()} / 순 방문객 ${uniqueVisitors.toLocaleString()}명).${tabMessage}`,
    suggestions: ['입장객 수 알려줘', '재방문율 알려줘', '매출 알려줘'],
    data: { visitFrequency: Number(visitFrequency.toFixed(1)), footfall, uniqueVisitors },
  };
}

export async function queryFunnel(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');

  const { actions, tabChanged, targetTab } = createNavigationActions('funnel', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 퍼널을 확인합니다.` : '';

  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);

  const counts = {
    entry: kpi?.funnel_entry ?? 0,
    browse: kpi?.funnel_browse ?? 0,
    engage: kpi?.funnel_engage ?? 0,
    fitting: kpi?.funnel_fitting ?? 0,
    purchase: kpi?.funnel_purchase ?? 0,
  };

  if (counts.entry === 0) {
    return {
      actions,
      message: `퍼널 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매출 알려줘', '개요탭 보여줘'],
      data: null,
    };
  }

  return {
    actions,
    message: `고객 여정 퍼널:\n• 입장(Entry): ${counts.entry.toLocaleString()}명\n• 탐색(Browse): ${counts.browse.toLocaleString()}명\n• 참여(Engage): ${counts.engage.toLocaleString()}명\n• 피팅(Fitting): ${counts.fitting.toLocaleString()}명\n• 구매(Purchase): ${counts.purchase.toLocaleString()}건${tabMessage}`,
    suggestions: ['전환율 올리려면?', '매출 알려줘', '목표 달성률 보여줘'],
    data: { funnel: counts },
  };
}

export async function queryGoal(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const today = new Date().toISOString().split('T')[0];

  let goals: any[] = [];
  try {
    goals = await rpcStoreGoals(supabase, orgId || '', storeId, today);
  } catch (e) {
    console.error('[queryGoal] RPC error:', e);
  }

  if (!goals || goals.length === 0) {
    return {
      actions: [
        { type: 'navigate', target: '/insights?tab=overview' },
        { type: 'open_modal', modalId: 'goal-settings' },
      ],
      message: '현재 설정된 목표가 없습니다. 목표를 설정하시면 달성률을 확인할 수 있어요.\n\n목표 설정 창을 열어드리겠습니다.',
      suggestions: ['매출 알려줘', '방문객 수 확인', '전환율 어때?'],
      data: { hasGoal: false },
    };
  }

  const kpi = orgId
    ? await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate)
    : null;

  const totalRevenue = kpi?.total_revenue ?? 0;
  const totalVisitors = kpi?.total_visitors ?? 0;
  const totalTransactions = kpi?.total_transactions ?? 0;
  const funnelEntry = kpi?.funnel_entry ?? 0;
  const funnelPurchase = kpi?.funnel_purchase ?? 0;
  const avgConversion = funnelEntry > 0 ? (funnelPurchase / funnelEntry) * 100 : 0;
  const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const goalTypeLabels: Record<string, string> = {
    revenue: '매출', visitors: '방문자', conversion: '전환율', avg_basket: '객단가',
  };
  const goalTypeUnits: Record<string, string> = {
    revenue: '원', visitors: '명', conversion: '%', avg_basket: '원',
  };

  const results = goals.map(goal => {
    let currentValue = 0;
    switch (goal.goal_type) {
      case 'revenue': currentValue = totalRevenue; break;
      case 'visitors': currentValue = totalVisitors; break;
      case 'conversion': currentValue = avgConversion; break;
      case 'avg_basket': currentValue = avgBasket; break;
    }
    const progress = goal.target_value > 0 ? Math.min(Math.round((currentValue / goal.target_value) * 100), 100) : 0;
    const remaining = Math.max(goal.target_value - currentValue, 0);
    return { ...goal, currentValue, progress, remaining };
  });

  const overallRate = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.progress, 0) / results.length)
    : 0;

  const trend = overallRate >= 100 ? '목표를 달성했어요!' :
               overallRate >= 80 ? '목표 달성에 근접해 있어요.' :
               overallRate >= 50 ? '중간 정도 진행 중이에요.' : '목표까지 더 노력이 필요해요.';

  const details = results.map(r => {
    const label = goalTypeLabels[r.goal_type] || r.goal_type;
    const unit = goalTypeUnits[r.goal_type] || '';
    const currentStr = r.goal_type === 'conversion'
      ? `${r.currentValue.toFixed(1)}%`
      : `${formatNumber(Math.round(r.currentValue))}${unit}`;
    const targetStr = r.goal_type === 'conversion'
      ? `${r.target_value}%`
      : `${formatNumber(r.target_value)}${unit}`;
    return `• ${label}: ${currentStr} / ${targetStr} (${r.progress}%)`;
  }).join('\n');

  const { actions, tabChanged, targetTab } = createNavigationActions('goal', dateRange, pageContext);
  let message = `현재 목표 달성률은 평균 ${overallRate}%입니다. ${trend}\n\n${details}`;
  if (tabChanged) {
    message += `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['목표 설정 변경하기', '매출 알려줘', '상세 분석 보기'],
    data: { overallRate, goals: results, hasGoal: true },
  };
}
