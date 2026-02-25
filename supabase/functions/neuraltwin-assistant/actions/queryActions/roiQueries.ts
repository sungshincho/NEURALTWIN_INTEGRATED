/**
 * ROI 측정 쿼리 핸들러
 * queryType: roiSummary, appliedStrategies, categoryPerformance,
 *            filterStrategies, exportStrategies, roiTablePage
 */

import { QueryActionResult, PageContext, UIAction, ClassificationResult, SupabaseClient } from './types.ts';
import { rpcAppliedStrategies } from './rpcHelpers.ts';
import { formatNumber } from './commonHelpers.ts';

export async function queryROISummary(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';
  try {
    const data = await rpcAppliedStrategies(supabase, storeId, dateRange.startDate, dateRange.endDate);
    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `해당 기간에 적용된 전략이 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['기간 변경해줘', '전체 기간으로 보여줘', '인사이트 허브로 가줘'],
      };
    }
    const totalApplied = data.length;
    const successCount = data.filter((s: any) => s.result === 'success' || s.status === 'completed').length;
    const successRate = totalApplied > 0 ? Math.round((successCount / totalApplied) * 100) : 0;
    const rois = data.filter((s: any) => s.final_roi != null || s.current_roi != null);
    const avgRoi = rois.length > 0
      ? Math.round(rois.reduce((sum: number, s: any) => sum + (s.final_roi ?? s.current_roi ?? 0), 0) / rois.length)
      : 0;
    const totalRevenueImpact = data.reduce((sum: number, s: any) => sum + (s.actual_revenue || 0), 0);
    const message = `ROI 요약 (${dateRange.startDate} ~ ${dateRange.endDate}):\n` +
      `• 총 적용 전략: ${totalApplied}개\n` +
      `• 성공률: ${successRate}%\n` +
      `• 평균 ROI: ${avgRoi}%\n` +
      `• 총 추가매출: ${formatNumber(totalRevenueImpact)}원` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['적용된 전략 이력 보여줘', '카테고리별 성과 보여줘', '인사이트 허브로 가줘'],
      data: { totalApplied, successRate, avgRoi, totalRevenueImpact },
    };
  } catch (error) {
    console.error('[queryROISummary] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: 'ROI 데이터를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘', '매출 알려줘'],
    };
  }
}

export async function queryAppliedStrategies(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';
  try {
    const data = await rpcAppliedStrategies(supabase, storeId, undefined, undefined, 10);
    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `적용된 전략 이력이 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['AI추천탭 보여줘', '인사이트 허브로 가줘'],
      };
    }
    const statusLabels: Record<string, string> = {
      completed: '완료', active: '진행중', pending: '대기', failed: '실패',
    };
    const resultLabels: Record<string, string> = {
      success: '성공', failure: '실패', partial: '부분성공', pending: '대기',
    };
    const strategyList = data.slice(0, 5).map((s: any) => {
      const status = statusLabels[s.status] || s.status || '-';
      const result = s.result ? (resultLabels[s.result] || s.result) : '-';
      const roi = s.final_roi ?? s.current_roi;
      const roiStr = roi != null ? ` (ROI: ${roi}%)` : '';
      return `• ${s.name || s.source_module || '전략'}: ${status}/${result}${roiStr}`;
    }).join('\n');
    const message = `최근 적용된 전략 (${data.length}건):\n\n${strategyList}` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['ROI 요약 보여줘', '카테고리별 성과 보여줘', 'AI추천탭 보여줘'],
      data: { strategies: data },
    };
  } catch (error) {
    console.error('[queryAppliedStrategies] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: '적용된 전략 이력을 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘'],
    };
  }
}

export async function queryROICategoryPerformance(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const isOnROI = pageContext?.current === '/roi';
  try {
    const data = await rpcAppliedStrategies(supabase, storeId, dateRange.startDate, dateRange.endDate);
    if (data.length === 0) {
      return {
        actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
        message: `해당 기간에 카테고리별 성과 데이터가 없습니다.${!isOnROI ? ' ROI 측정 페이지로 이동합니다.' : ''}`,
        suggestions: ['기간 변경해줘', 'ROI 요약 보여줘'],
      };
    }
    const sourceLabels: Record<string, string> = {
      insight_hub: '2D 시뮬레이션 (인사이트 허브)',
      studio: '3D 시뮬레이션 (디지털트윈)',
    };
    const grouped: Record<string, { count: number; successCount: number; totalRevenue: number; totalRoi: number; roiCount: number }> = {};
    data.forEach((s: any) => {
      const key = s.source || 'other';
      if (!grouped[key]) grouped[key] = { count: 0, successCount: 0, totalRevenue: 0, totalRoi: 0, roiCount: 0 };
      grouped[key].count++;
      if (s.result === 'success' || s.status === 'completed') grouped[key].successCount++;
      grouped[key].totalRevenue += s.actual_revenue || 0;
      const roi = s.final_roi ?? s.current_roi;
      if (roi != null) { grouped[key].totalRoi += roi; grouped[key].roiCount++; }
    });
    const lines = Object.entries(grouped).map(([source, g]) => {
      const label = sourceLabels[source] || source;
      const avgRoi = g.roiCount > 0 ? Math.round(g.totalRoi / g.roiCount) : 0;
      const successRate = g.count > 0 ? Math.round((g.successCount / g.count) * 100) : 0;
      return `[${label}]\n  전략 수: ${g.count}개 | 성공률: ${successRate}% | 평균 ROI: ${avgRoi}% | 추가매출: ${formatNumber(g.totalRevenue)}원`;
    }).join('\n\n');
    const message = `카테고리별 성과:\n\n${lines}` +
      (!isOnROI ? '\n\nROI 측정 페이지로 이동합니다.' : '');
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message,
      suggestions: ['ROI 요약 보여줘', '적용된 전략 이력 보여줘', '인사이트 허브로 가줘'],
      data: { categories: grouped },
    };
  } catch (error) {
    console.error('[queryROICategoryPerformance] Error:', error);
    return {
      actions: isOnROI ? [] : [{ type: 'navigate', target: '/roi' }],
      message: '카테고리별 성과를 조회하는 중 오류가 발생했습니다.',
      suggestions: ['ROI 측정 페이지로 가줘'],
    };
  }
}

export function handleFilterStrategies(
  classification: ClassificationResult,
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];
  const filterMessages: string[] = [];
  if (!isOnROI) { actions.push({ type: 'navigate', target: '/roi' }); }
  const statusFilter = classification.entities.filter?.status;
  if (statusFilter) {
    actions.push({ type: 'set_filter', filterId: 'status', value: statusFilter });
    const statusLabels: Record<string, string> = { active: '진행 중', completed: '완료', cancelled: '취소', all: '전체' };
    filterMessages.push(`상태: ${statusLabels[statusFilter] || statusFilter}`);
  }
  const sourceFilter = classification.entities.filter?.source;
  if (sourceFilter) {
    actions.push({ type: 'set_filter', filterId: 'source', value: sourceFilter });
    const sourceLabels: Record<string, string> = { '2d_simulation': '2D 시뮬레이션', '3d_simulation': '3D 시뮬레이션', all: '전체' };
    filterMessages.push(`출처: ${sourceLabels[sourceFilter] || sourceFilter}`);
  }
  const message = filterMessages.length > 0
    ? `적용 이력 필터를 변경합니다. (${filterMessages.join(', ')})`
    : '적용 이력 테이블로 이동합니다.';
  return { actions, message, suggestions: ['완료된 전략만 보여줘', '3D 시뮬레이션 전략만', '전체 보기', '내보내기 해줘'] };
}

export function handleExportStrategies(
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];
  if (!isOnROI) { actions.push({ type: 'navigate', target: '/roi' }); }
  actions.push({ type: 'trigger_export', exportType: 'strategies' });
  return { actions, message: '적용 이력을 CSV 파일로 내보냅니다.', suggestions: ['ROI 요약 보여줘', '카테고리별 성과 보여줘'] };
}

export function handleRoiTablePage(
  classification: ClassificationResult,
  pageContext?: PageContext
): QueryActionResult {
  const isOnROI = pageContext?.current === '/roi';
  const actions: UIAction[] = [];
  if (!isOnROI) { actions.push({ type: 'navigate', target: '/roi' }); }
  const tablePage = classification.entities.tablePage || 'next';
  actions.push({ type: 'set_table_page', page: tablePage });
  const pageLabel = tablePage === 'next' ? '다음' : tablePage === 'prev' ? '이전' : `${tablePage}`;
  return { actions, message: `적용 이력 ${pageLabel} 페이지로 이동합니다.`, suggestions: ['다음 페이지', '이전 페이지', '첫 페이지'] };
}
