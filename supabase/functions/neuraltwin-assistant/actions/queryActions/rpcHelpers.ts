/**
 * RPC 호출 헬퍼 — 프론트엔드와 동일 RPC 사용
 * 데이터 일관성 보장 (SECURITY DEFINER, org_id 필터)
 * 모든 탭이 공유하는 공용 RPC 함수 (크로스탭 사용)
 */

import { SupabaseClient } from './types.ts';

export async function rpcOverviewKpis(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_overview_kpis', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[])?.[0] ?? null;
}

export async function rpcZoneMetrics(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_zone_metrics', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcCustomerSegments(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_customer_segments', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcProductPerformance(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_product_performance', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcInventoryStatus(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase.rpc('get_inventory_status', {
    p_org_id: orgId,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcStoreGoals(supabase: SupabaseClient, orgId: string, storeId: string, date: string) {
  const { data, error } = await supabase.rpc('get_store_goals', {
    p_org_id: orgId, p_store_id: storeId, p_date: date,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcHourlyVisitors(
  supabase: SupabaseClient, orgId: string, storeId: string,
  startDate: string, endDate: string
) {
  const { data, error } = await supabase.rpc('get_hourly_entry_counts', {
    p_org_id: orgId, p_store_id: storeId,
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;
  // get_hourly_entry_counts returns {hour, count} — map to {hour, visitor_count} for downstream
  return ((data as any[]) ?? []).map((r: any) => ({ hour: r.hour, visitor_count: r.count }));
}

export async function rpcZonesDimList(supabase: SupabaseClient, orgId: string, storeId: string) {
  const { data, error } = await supabase.rpc('get_zones_dim_list', {
    p_org_id: orgId, p_store_id: storeId,
  });
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcAppliedStrategies(
  supabase: SupabaseClient, storeId: string,
  startDate?: string, endDate?: string, limit?: number
) {
  const params: any = { p_store_id: storeId };
  if (startDate) params.p_start_date = startDate;
  if (endDate) params.p_end_date = endDate;
  if (limit) params.p_limit = limit;
  const { data, error } = await supabase.rpc('get_applied_strategies', params);
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function rpcInventoryMovements(
  supabase: SupabaseClient, orgId: string,
  startDate: string, endDate: string, limit?: number
) {
  const params: any = {
    p_org_id: orgId, p_start_date: startDate, p_end_date: endDate,
  };
  if (limit) params.p_limit = limit;
  const { data, error } = await supabase.rpc('get_inventory_movements', params);
  if (error) throw error;
  return (data as any[]) ?? [];
}

/**
 * 전일 대비 비교를 위한 병렬 RPC 호출 헬퍼 (Phase 2-4)
 * 순차 2회 호출을 Promise.all로 병렬화 → 레이턴시 ~50% 감소
 */
export async function rpcOverviewKpisWithComparison(
  supabase: SupabaseClient, orgId: string, storeId: string,
  dateRange: { startDate: string; endDate: string; compareStartDate?: string; compareEndDate?: string }
): Promise<{ current: any; comparison: any | null }> {
  const promises: Promise<any>[] = [
    rpcOverviewKpis(supabase, orgId, storeId, dateRange.startDate, dateRange.endDate),
  ];
  if (dateRange.compareStartDate && dateRange.compareEndDate) {
    promises.push(rpcOverviewKpis(supabase, orgId, storeId, dateRange.compareStartDate, dateRange.compareEndDate));
  }
  const [current, comparison = null] = await Promise.all(promises);
  return { current, comparison };
}
