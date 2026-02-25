/**
 * 고객(Customer) 탭 쿼리 핸들러
 * queryType: visitors → overviewQueries.ts에서 처리 (rpcOverviewKpis 사용)
 * queryType: newVsReturning, repeatRate, customerSegment, loyalCustomers,
 *            segmentAvgPurchase, segmentVisitFrequency, segmentDetail
 * NOTE: dwellTime case는 디스패처에서 storeQueries.queryStoreDwell로 리다이렉트
 *       queryDwellTime 함수는 dead code이므로 삭제됨
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';
import { rpcOverviewKpis, rpcCustomerSegments } from './rpcHelpers.ts';
import { createNavigationActions, getTabDisplayName, formatNumber } from './commonHelpers.ts';
import { normalizeSegmentFilter } from './constants.ts';
import { normalizeForMatch } from '../../utils/normalize.ts';

export async function queryNewVsReturning(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('newVsReturning', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';
  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (!kpi) {
    return { actions, message: `신규/재방문 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['방문객 수 알려줘', '고객탭 보여줘'], data: null };
  }
  const uniqueVisitors = kpi.unique_visitors ?? 0;
  const totalReturning = kpi.returning_visitors ?? 0;
  const totalNew = uniqueVisitors - totalReturning;
  const newRate = uniqueVisitors > 0 ? Math.round((totalNew / uniqueVisitors) * 100) : 0;
  const returnRate = uniqueVisitors > 0 ? Math.round((totalReturning / uniqueVisitors) * 100) : 0;
  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 기간의 고객 구성:\n• 신규 고객: ${totalNew.toLocaleString()}명 (${newRate}%)\n• 재방문 고객: ${totalReturning.toLocaleString()}명 (${returnRate}%)${tabMessage}`,
    suggestions: ['방문객 수 알려줘', '체류 시간 알려줘'],
    data: { newVisitors: totalNew, returningVisitors: totalReturning, newRate, returnRate },
  };
}

export async function queryRepeatRate(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('repeatRate', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';
  const kpi = await rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (!kpi) {
    return { actions, message: `재방문율 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객탭 보여줘', '방문객 알려줘'], data: null };
  }
  const uniqueVisitors = kpi.unique_visitors ?? 0;
  const returningVisitors = kpi.returning_visitors ?? 0;
  const repeatRate = uniqueVisitors > 0 ? Math.round((returningVisitors / uniqueVisitors) * 100) : 0;
  return {
    actions,
    message: `재방문율은 ${repeatRate}%입니다 (재방문 고객 ${returningVisitors.toLocaleString()}명 / 순 방문객 ${uniqueVisitors.toLocaleString()}명).${tabMessage}`,
    suggestions: ['고객 세그먼트 보여줘', '충성 고객 알려줘', '방문객 알려줘'],
    data: { repeatRate, returningVisitors, uniqueVisitors },
  };
}

export async function queryCustomerSegment(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string,
  itemFilter?: string[], responseHint?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const isDistribution = responseHint === 'distribution';
  const { actions, tabChanged, targetTab } = createNavigationActions('customerSegment', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 세그먼트 분포를 확인합니다.` : '';
  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (segments.length === 0) {
    return { actions, message: `고객 세그먼트 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객탭 보여줘', '방문객 알려줘'], data: null };
  }
  let results = segments;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const normalized = normalizeSegmentFilter(itemFilter);
    const filtered = segments.filter((s: any) =>
      normalized.some(f => normalizeForMatch(s.segment_name || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  if (isDistribution) {
    const totalCustomers = results.reduce((sum: number, s: any) => sum + (s.customer_count || 0), 0);
    const segmentList = results.map((s: any) => {
      const count = s.customer_count || 0;
      const pct = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0';
      return `• ${s.segment_name}: ${pct}% (${count.toLocaleString()}명)`;
    }).join('\n');
    return {
      actions,
      message: `고객 세그먼트 분포${filterNote}:\n${segmentList}\n\n총 고객: ${totalCustomers.toLocaleString()}명${tabMessage}`,
      suggestions: ['세그먼트 상세 분석', '세그먼트별 평균 구매액', '충성 고객 알려줘'],
      data: { segments: results, totalCustomers },
    };
  }
  const segmentList = results.map((s: any) =>
    `• ${s.segment_name}: ${(s.customer_count || 0).toLocaleString()}명 (객단가 ₩${Math.round(s.avg_transaction_value || 0).toLocaleString()}, 방문 ${Number(s.visit_frequency || 0).toFixed(1)}회/월)`
  ).join('\n');
  const topSegment = results[0];
  return {
    actions,
    message: `주요 세그먼트는 "${topSegment?.segment_name || '-'}"입니다.${filterNote}\n\n${segmentList}${tabMessage}`,
    suggestions: ['세그먼트 분포 보여줘', '충성 고객 알려줘', '세그먼트별 평균 구매액'],
    data: { segments: results, topSegment: topSegment?.segment_name },
  };
}

export async function queryLoyalCustomers(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('loyalCustomers', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';
  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  const loyalKeywords = ['loyal', 'vip', 'champion', '충성', 'VIP'];
  const loyalSegments = segments.filter((s: any) =>
    loyalKeywords.some(kw => normalizeForMatch(s.segment_name || '').includes(normalizeForMatch(kw)))
  );
  if (loyalSegments.length === 0) {
    return { actions, message: `충성 고객 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객 세그먼트 보여줘', '재방문율 알려줘'], data: null };
  }
  const totalLoyal = loyalSegments.reduce((sum: number, s: any) => sum + (s.customer_count || 0), 0);
  const avgRevenue = loyalSegments.reduce((sum: number, s: any) => sum + (s.avg_transaction_value || 0), 0) / loyalSegments.length;
  return {
    actions,
    message: `충성 고객은 총 ${totalLoyal.toLocaleString()}명이며, 평균 구매금액은 ${formatNumber(Math.round(avgRevenue))}원입니다.${tabMessage}`,
    suggestions: ['고객 세그먼트 보여줘', '재방문율 알려줘', '매출 알려줘'],
    data: { totalLoyal, avgRevenue },
  };
}

export async function querySegmentAvgPurchase(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('segmentAvgPurchase', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 세그먼트별 평균 구매액을 확인합니다.` : '';
  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (segments.length === 0) {
    return { actions, message: `세그먼트별 평균 구매액 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객 세그먼트 보여줘', '고객탭 보여줘'], data: null };
  }
  let results = segments;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const normalized = normalizeSegmentFilter(itemFilter);
    const filtered = segments.filter((s: any) =>
      normalized.some(f => normalizeForMatch(s.segment_name || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  const segmentList = results.map((s: any) =>
    `• ${s.segment_name}: ₩${Math.round(s.avg_transaction_value || 0).toLocaleString()}`
  ).join('\n');
  return {
    actions,
    message: `세그먼트별 평균 구매액${filterNote}:\n${segmentList}${tabMessage}`,
    suggestions: ['세그먼트별 방문 빈도', '세그먼트 분포 보여줘', '세그먼트 상세 분석'],
    data: { segments: results },
  };
}

export async function querySegmentVisitFrequency(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('segmentVisitFrequency', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 세그먼트별 방문 빈도를 확인합니다.` : '';
  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (segments.length === 0) {
    return { actions, message: `세그먼트별 방문 빈도 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객 세그먼트 보여줘', '고객탭 보여줘'], data: null };
  }
  let results = segments;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const normalized = normalizeSegmentFilter(itemFilter);
    const filtered = segments.filter((s: any) =>
      normalized.some(f => normalizeForMatch(s.segment_name || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  const segmentList = results.map((s: any) =>
    `• ${s.segment_name}: ${Number(s.visit_frequency || 0).toFixed(1)}회/월`
  ).join('\n');
  return {
    actions,
    message: `세그먼트별 방문 빈도${filterNote}:\n${segmentList}${tabMessage}`,
    suggestions: ['세그먼트별 평균 구매액', '세그먼트 분포 보여줘', '세그먼트 상세 분석'],
    data: { segments: results },
  };
}

export async function querySegmentDetail(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('segmentDetail', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 세그먼트 상세 분석을 확인합니다.` : '';
  const segments = await rpcCustomerSegments(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (segments.length === 0) {
    return { actions, message: `세그먼트 상세 분석 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['고객 세그먼트 보여줘', '고객탭 보여줘'], data: null };
  }
  const segmentList = segments.map((s: any) =>
    `• ${s.segment_name}: ${(s.customer_count || 0).toLocaleString()}명 | ₩${Math.round(s.avg_transaction_value || 0).toLocaleString()} | ${Number(s.visit_frequency || 0).toFixed(1)}회/월`
  ).join('\n');
  return {
    actions,
    message: `세그먼트 상세 분석 (고객수 | 평균구매액 | 방문빈도):\n${segmentList}${tabMessage}`,
    suggestions: ['세그먼트 분포 보여줘', '충성 고객 알려줘', '재방문율 알려줘'],
    data: { segments },
  };
}
