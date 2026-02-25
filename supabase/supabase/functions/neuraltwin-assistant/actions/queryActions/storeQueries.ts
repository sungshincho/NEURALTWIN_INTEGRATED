/**
 * 매장(Store) 탭 쿼리 핸들러
 * queryType: storeSummary, peakTime, popularZone, trackingCoverage,
 *            hourlyPattern, zoneAnalysis, zonePerformance, storeDwell
 */

import { QueryActionResult, PageContext, SupabaseClient } from './types.ts';
import { rpcHourlyVisitors, rpcZoneMetrics, rpcZonesDimList } from './rpcHelpers.ts';
import { createNavigationActions, getTabDisplayName } from './commonHelpers.ts';
import { normalizeForMatch } from '../../utils/normalize.ts';

// ---------------------------------------------------------------------------
// Non-exported helpers
// ---------------------------------------------------------------------------

function formatZoneList(zones: { name: string; visitors: number; avgDwellMinutes: number; conversionRate: string }[], limit = 5): string {
  return zones.slice(0, limit).map((z, i) =>
    `${i + 1}. ${z.name}: ${z.visitors.toLocaleString()}명 (체류 ${z.avgDwellMinutes}분, 전환율 ${z.conversionRate})`
  ).join('\n');
}

function filterZones(zones: { name: string; visitors: number; avgDwellMinutes: number; conversionRate: string }[], itemFilter?: string[]): {
  filtered: typeof zones;
  isFiltered: boolean;
} {
  if (!itemFilter || itemFilter.length === 0) return { filtered: zones, isFiltered: false };
  const filtered = zones.filter(z =>
    itemFilter.some(f => normalizeForMatch(z.name).includes(normalizeForMatch(f)))
  );
  return { filtered: filtered.length > 0 ? filtered : zones, isFiltered: filtered.length > 0 };
}

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function queryPeakTime(
  supabase: SupabaseClient,
  storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('peakTime', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 분석을 확인합니다.` : '';

  let data: any[] = [];
  try {
    data = await rpcHourlyVisitors(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  } catch (e) {
    console.error('[queryPeakTime] RPC error:', e);
  }

  if (data.length === 0) {
    return {
      actions,
      message: `피크타임 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['매장탭 보여줘', '방문객 알려줘'],
      data: null,
    };
  }

  const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
  const peak = sorted[0];
  const peakTime = peak ? `${peak.hour}시` : '확인 불가';
  const peakVisitors = peak ? Number(peak.visitor_count) : 0;

  return {
    actions,
    message: `피크타임은 ${peakTime}이며, 해당 시간대 방문객은 총 ${peakVisitors.toLocaleString()}명입니다.${tabMessage}`,
    suggestions: ['시간대별 방문 패턴 보여줘', '인기 존 알려줘', '매출 알려줘'],
    data: { peakTime, peakVisitors },
  };
}

export async function queryPopularZone(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('popularZone', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 존 분석을 확인합니다.` : '';
  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (zones.length === 0) {
    return { actions, message: `존 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  let results = zones;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = zones.filter((z: any) =>
      itemFilter.some(f => normalizeForMatch(z.zone_name || z.zone_id || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  const topZone = results[0];
  const zoneList = results.slice(0, 5).map((z: any, i: number) =>
    `${i + 1}. ${z.zone_name || z.zone_id}: ${(z.visitors || 0).toLocaleString()}명 (체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분)`
  ).join('\n');
  return {
    actions,
    message: `가장 인기 있는 존은 "${topZone.zone_name || topZone.zone_id}"입니다.${filterNote}\n\n${zoneList}${tabMessage}`,
    suggestions: ['존 체류시간 분석', '피크타임 알려줘', '매출 알려줘'],
    data: { zones: results },
  };
}

export async function queryTrackingCoverage(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  const { actions, tabChanged, targetTab } = createNavigationActions('trackingCoverage', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 확인합니다.` : '';
  let registeredZones: any[] = [];
  try { registeredZones = await rpcZonesDimList(supabase, orgId || '', storeId); } catch (e) { console.error('[queryTrackingCoverage] zones_dim RPC error:', e); }
  let zoneMetrics: any[] = [];
  try { if (orgId) { zoneMetrics = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate); } } catch (e) { console.error('[queryTrackingCoverage] zone_metrics RPC error:', e); }
  const totalZones = registeredZones.length;
  if (totalZones === 0) {
    return { actions, message: `센서 커버율 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  const zonesWithData = zoneMetrics.filter((z: any) => (z.visitors || 0) > 0).length;
  const coverage = Math.round((zonesWithData / totalZones) * 100);
  const trackedVisitors = zoneMetrics.reduce((sum: number, z: any) => sum + (z.visitors || 0), 0);
  return {
    actions,
    message: `센서 커버율은 ${coverage}%입니다 (${zonesWithData}/${totalZones} 존 데이터 수집 중, 추적 방문자 ${trackedVisitors.toLocaleString()}명).${tabMessage}`,
    suggestions: ['인기 존 알려줘', '피크타임 알려줘', '존 분석 보여줘'],
    data: { coverage, zonesWithData, totalZones, trackedVisitors },
  };
}

export async function queryHourlyPattern(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, hour?: number, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('hourlyPattern', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 시간대별 차트를 확인합니다.` : '';
  let data: any[] = [];
  try { data = await rpcHourlyVisitors(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate); } catch (e) { console.error('[queryHourlyPattern] RPC error:', e); }
  if (data.length === 0) {
    return { actions, message: `시간대별 방문 패턴 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  const hourlyMap: Record<number, number> = {};
  data.forEach((row: any) => { hourlyMap[row.hour] = row.visitor_count || 0; });
  if (hour !== undefined && hour >= 0 && hour <= 23) {
    const visitors = hourlyMap[hour] || 0;
    const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
    const peak = sorted[0];
    return {
      actions,
      message: `${dateRange.startDate} ${hour}시의 방문객은 ${visitors.toLocaleString()}명입니다.\n(피크타임: ${peak?.hour ?? '-'}시 ${Number(peak?.visitor_count || 0).toLocaleString()}명)${tabMessage}`,
      suggestions: ['피크타임 알려줘', '시간대별 전체 패턴 보여줘', '인기 존 알려줘'],
      data: { hour, visitors },
    };
  }
  const sorted = [...data].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
  const top3 = sorted.slice(0, 3).map((r: any) => `${r.hour}시: ${Number(r.visitor_count || 0).toLocaleString()}명`).join(', ');
  return {
    actions,
    message: `시간대별 방문 패턴 TOP 3: ${top3}${tabMessage}`,
    suggestions: ['피크타임 알려줘', '인기 존 알려줘', '방문객 알려줘'],
    data: { hourlyMap },
  };
}

export async function queryZoneAnalysis(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string,
  itemFilter?: string[], responseHint?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const isDistribution = responseHint === 'distribution';
  const { actions, tabChanged, targetTab } = createNavigationActions('zoneAnalysis', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 존 분석을 확인합니다.` : '';
  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (zones.length === 0) {
    return { actions, message: `존 분석 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  let results = zones;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = zones.filter((z: any) =>
      itemFilter.some(f => normalizeForMatch(z.zone_name || z.zone_id || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  if (isDistribution) {
    const totalVisitors = results.reduce((sum: number, z: any) => sum + (z.visitors || 0), 0);
    const zoneList = results.map((z: any) => {
      const visitors = z.visitors || 0;
      const pct = totalVisitors > 0 ? ((visitors / totalVisitors) * 100).toFixed(1) : '0';
      return `• ${z.zone_name || z.zone_id}: ${pct}% (${visitors.toLocaleString()}명)`;
    }).join('\n');
    return {
      actions,
      message: `존별 방문자 분포${filterNote} (중복 포함, 연 방문 기준):\n${zoneList}${tabMessage}`,
      suggestions: ['존별 성과 비교해줘', '인기 존 알려줘', '피크타임 알려줘'],
      data: { zones: results, totalVisitors },
    };
  }
  const zoneList = results.map((z: any) => {
    const convRate = (z.visitors || 0) > 0
      ? ((z.conversion_count || 0) / z.visitors * 100).toFixed(1)
      : '0';
    return `• ${z.zone_name || z.zone_id}: 방문 ${(z.visitors || 0).toLocaleString()}명, 체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분, 전환율 ${convRate}%`;
  }).join('\n');
  return {
    actions,
    message: `존별 분석 결과${filterNote} (방문자 수는 중복 포함):\n${zoneList}${tabMessage}`,
    suggestions: ['존별 방문자 분포 알려줘', '피크타임 알려줘', '체류시간 알려줘'],
    data: { zones: results },
  };
}

export async function queryZonePerformance(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string, itemFilter?: string[]
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('zonePerformance', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 존별 성과를 확인합니다.` : '';
  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (zones.length === 0) {
    return { actions, message: `존별 성과 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  let results = zones;
  let filterNote = '';
  if (itemFilter && itemFilter.length > 0) {
    const filtered = zones.filter((z: any) =>
      itemFilter.some(f => normalizeForMatch(z.zone_name || z.zone_id || '').includes(normalizeForMatch(f)))
    );
    if (filtered.length > 0) { results = filtered; filterNote = ` (${itemFilter.join(', ')} 필터 적용)`; }
  }
  const zoneList = results.map((z: any) => {
    const convRate = (z.visitors || 0) > 0
      ? ((z.conversion_count || 0) / z.visitors * 100).toFixed(1)
      : '0';
    return `• ${z.zone_name || z.zone_id}: 방문 ${(z.visitors || 0).toLocaleString()}명, 체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분, 전환율 ${convRate}%`;
  }).join('\n');
  return {
    actions,
    message: `존별 성과 비교${filterNote} (방문자 수는 중복 포함):\n${zoneList}${tabMessage}`,
    suggestions: ['존별 방문자 분포 알려줘', '인기 존 알려줘', '피크타임 알려줘'],
    data: { zones: results },
  };
}

export async function queryStoreDwell(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('storeDwell', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 확인합니다.` : '';
  const zones = await rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate);
  if (zones.length === 0) {
    return { actions, message: `평균 체류시간 데이터를 조회할 수 없습니다.${tabMessage}`, suggestions: ['매장탭 보여줘', '피크타임 알려줘'], data: null };
  }
  const totalDwellSeconds = zones.reduce((sum: number, z: any) => sum + (z.avg_dwell_seconds || 0), 0);
  const avgDwellMinutes = Math.round(totalDwellSeconds / zones.length / 60);
  return {
    actions,
    message: `평균 체류시간은 ${avgDwellMinutes}분입니다.${tabMessage}`,
    suggestions: ['존별 체류시간 보여줘', '피크타임 알려줘', '인기 존 알려줘'],
    data: { avgDwellMinutes },
  };
}

export async function queryStoreSummary(
  supabase: SupabaseClient, storeId: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext, orgId?: string
): Promise<QueryActionResult> {
  if (!orgId) throw new Error('orgId required');
  const { actions, tabChanged, targetTab } = createNavigationActions('storeSummary', dateRange, pageContext);
  const tabMessage = tabChanged ? `\n\n${getTabDisplayName(targetTab)}탭으로 이동하여 상세 데이터를 확인합니다.` : '';
  const [hourlyData, zones] = await Promise.all([
    rpcHourlyVisitors(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate),
    rpcZoneMetrics(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate),
  ]);
  if (hourlyData.length === 0 && zones.length === 0) {
    return {
      actions,
      message: `${dateRange.startDate} ~ ${dateRange.endDate} 매장 데이터를 조회할 수 없습니다.${tabMessage}`,
      suggestions: ['시간대별 방문 패턴 보여줘', '존 분석 보여줘', '피크타임 알려줘'],
      data: null,
    };
  }
  let peakTime = '확인 불가';
  let peakVisitors = 0;
  if (hourlyData.length > 0) {
    const sorted = [...hourlyData].sort((a: any, b: any) => (b.visitor_count || 0) - (a.visitor_count || 0));
    const peak = sorted[0];
    if (peak) { peakTime = `${peak.hour}시`; peakVisitors = Number(peak.visitor_count); }
  }
  let popularZone = '확인 불가';
  let topZonesText = '';
  if (zones.length > 0) {
    popularZone = zones[0].zone_name || zones[0].zone_id;
    topZonesText = zones.slice(0, 3).map((z: any) =>
      `  • ${z.zone_name || z.zone_id}: ${(z.visitors || 0).toLocaleString()}명 (체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분)`
    ).join('\n');
  }
  return {
    actions,
    message: `${dateRange.startDate} ~ ${dateRange.endDate} 매장 주요 지표입니다:\n` +
      `• 피크타임: ${peakTime} (${peakVisitors.toLocaleString()}명)\n` +
      `• 인기 존: ${popularZone}\n` +
      `• 운영 존: ${zones.length}개\n` +
      (topZonesText ? `\n존별 방문 TOP 3:\n${topZonesText}` : '') +
      tabMessage,
    suggestions: ['시간대별 방문 패턴 보여줘', '존 분석 보여줘', '피크타임 알려줘'],
    data: { peakTime, peakVisitors, popularZone, zones },
  };
}
