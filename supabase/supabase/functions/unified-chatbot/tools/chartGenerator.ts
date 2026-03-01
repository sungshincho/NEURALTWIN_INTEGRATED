/**
 * Chart Generator — Function Calling Tool Implementation
 *
 * AI가 generate_chart 도구를 호출했을 때 실행되는 핸들러.
 * Supabase에서 데이터를 조회하여 차트 데이터를 생성합니다.
 */

import { createSupabaseAdmin } from "../../_shared/supabase-client.ts";

interface ChartRequest {
  chartType: string;
  metric: string;
  groupBy?: string;
  dateRange?: { start?: string; end?: string };
  title?: string;
  storeId?: string;
}

interface ChartData {
  type: string;
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
  }>;
  metadata: {
    metric: string;
    groupBy: string;
    dateRange: { start: string; end: string };
    generatedAt: string;
  };
}

/**
 * 차트 데이터 생성
 */
export async function generateChart(params: ChartRequest): Promise<ChartData> {
  const supabase = createSupabaseAdmin();
  const { chartType, metric, groupBy = 'day', dateRange, storeId } = params;

  // 기본 날짜 범위: 최근 7일
  const end = dateRange?.end || new Date().toISOString();
  const start = dateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let labels: string[] = [];
  let data: number[] = [];
  let title = params.title || '';

  try {
    // 메트릭별 데이터 조회
    switch (metric) {
      case 'revenue': {
        title = title || '매출 추이';
        const { data: rows } = await supabase
          .from('daily_store_stats')
          .select('date, total_revenue')
          .gte('date', start.slice(0, 10))
          .lte('date', end.slice(0, 10))
          .order('date')
          .limit(30);

        if (rows) {
          labels = rows.map((r: any) => r.date);
          data = rows.map((r: any) => Number(r.total_revenue) || 0);
        }
        break;
      }

      case 'visitors': {
        title = title || '방문자 추이';
        const { data: rows } = await supabase
          .from('daily_store_stats')
          .select('date, total_visitors')
          .gte('date', start.slice(0, 10))
          .lte('date', end.slice(0, 10))
          .order('date')
          .limit(30);

        if (rows) {
          labels = rows.map((r: any) => r.date);
          data = rows.map((r: any) => Number(r.total_visitors) || 0);
        }
        break;
      }

      case 'zone_traffic': {
        title = title || '존별 트래픽';
        const { data: rows } = await supabase
          .from('zone_analytics')
          .select('zone_name, visitor_count')
          .eq('store_id', storeId || '')
          .order('visitor_count', { ascending: false })
          .limit(10);

        if (rows) {
          labels = rows.map((r: any) => r.zone_name || 'Unknown');
          data = rows.map((r: any) => Number(r.visitor_count) || 0);
        }
        break;
      }

      default: {
        title = title || `${metric} 데이터`;
        // 일반적인 쿼리 — 테이블이 없을 수 있으므로 빈 배열 반환
        labels = ['데이터 없음'];
        data = [0];
      }
    }
  } catch (err) {
    console.warn('[ChartGenerator] Query error:', err);
    labels = ['조회 실패'];
    data = [0];
  }

  return {
    type: chartType,
    title,
    labels,
    datasets: [{
      label: title,
      data,
    }],
    metadata: {
      metric,
      groupBy,
      dateRange: { start, end },
      generatedAt: new Date().toISOString(),
    },
  };
}
