// ============================================================================
// etl-health/index.ts
// ETL 파이프라인 Health Check API
// 데이터 컨트롤타워의 파이프라인 상태 모니터링용
// 작성일: 2026-01-13
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckRequest {
  store_id?: string;
  org_id?: string;
  check_type?: 'full' | 'quick' | 'pipeline';  // default: 'quick'
  time_range_hours?: number;  // default: 24
}

interface LayerHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  record_count: number;
  recent_count: number;  // 최근 time_range 내 레코드
  last_updated: string | null;
  issues: string[];
}

interface PipelineHealth {
  l1_raw: LayerHealth;
  l2_fact: LayerHealth;
  l3_aggregate: LayerHealth;
  etl_runs: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    avg_duration_ms: number | null;
    last_run: string | null;
  };
}

interface HealthCheckResult {
  success: boolean;
  store_id?: string;
  org_id?: string;
  overall_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  overall_score: number;  // 0-100
  pipeline_health: PipelineHealth;
  data_freshness: {
    l1_freshness_hours: number | null;
    l2_freshness_hours: number | null;
    l3_freshness_hours: number | null;
    is_stale: boolean;
    stale_threshold_hours: number;
  };
  recommendations: string[];
  checked_at: string;
  duration_ms: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    let params: HealthCheckRequest = {};
    if (req.method === 'POST') {
      params = await req.json();
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      params = {
        store_id: url.searchParams.get('store_id') || undefined,
        org_id: url.searchParams.get('org_id') || undefined,
        check_type: (url.searchParams.get('check_type') || 'quick') as 'full' | 'quick' | 'pipeline',
        time_range_hours: parseInt(url.searchParams.get('time_range_hours') || '24'),
      };
    }

    const {
      store_id,
      org_id,
      check_type = 'quick',
      time_range_hours = 24,
    } = params;

    const timeRangeCutoff = new Date(Date.now() - time_range_hours * 60 * 60 * 1000).toISOString();

    console.log(`[etl-health] Checking health for store: ${store_id || 'all'}, type: ${check_type}`);

    // ========================================
    // Build filter conditions
    // ========================================
    const storeFilter = store_id ? { store_id } : {};
    const orgFilter = org_id ? { org_id } : {};
    const filters = { ...storeFilter, ...orgFilter };

    // ========================================
    // L1: raw_imports 상태
    // ========================================
    const l1Health = await checkL1Health(supabase, filters, timeRangeCutoff);

    // ========================================
    // L2: Fact Tables 상태
    // ========================================
    const l2Health = await checkL2Health(supabase, filters, timeRangeCutoff);

    // ========================================
    // L3: Aggregate Tables 상태
    // ========================================
    const l3Health = await checkL3Health(supabase, filters, timeRangeCutoff);

    // ========================================
    // ETL Runs 상태
    // ========================================
    const etlRunsHealth = await checkETLRunsHealth(supabase, filters, timeRangeCutoff);

    // ========================================
    // 데이터 신선도 계산
    // ========================================
    const dataFreshness = calculateDataFreshness(l1Health, l2Health, l3Health, time_range_hours);

    // ========================================
    // 전체 상태 계산
    // ========================================
    const pipelineHealth: PipelineHealth = {
      l1_raw: l1Health,
      l2_fact: l2Health,
      l3_aggregate: l3Health,
      etl_runs: etlRunsHealth,
    };

    const { overallStatus, overallScore, recommendations } = calculateOverallHealth(
      pipelineHealth,
      dataFreshness
    );

    // ========================================
    // 결과 반환
    // ========================================
    const result: HealthCheckResult = {
      success: true,
      store_id,
      org_id,
      overall_status: overallStatus,
      overall_score: overallScore,
      pipeline_health: pipelineHealth,
      data_freshness: dataFreshness,
      recommendations,
      checked_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[etl-health] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        overall_status: 'unknown',
        overall_score: 0,
        error: errorMessage,
        checked_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function checkL1Health(
  supabase: any,
  filters: Record<string, string | undefined>,
  timeRangeCutoff: string
): Promise<LayerHealth> {
  const issues: string[] = [];

  try {
    // Total count
    let query = supabase
      .from('raw_imports')
      .select('id', { count: 'exact', head: true });

    if (filters.store_id) query = query.eq('store_id', filters.store_id);
    if (filters.org_id) query = query.eq('org_id', filters.org_id);

    const { count: totalCount } = await query;

    // Recent count
    let recentQuery = supabase
      .from('raw_imports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', timeRangeCutoff);

    if (filters.store_id) recentQuery = recentQuery.eq('store_id', filters.store_id);
    if (filters.org_id) recentQuery = recentQuery.eq('org_id', filters.org_id);

    const { count: recentCount } = await recentQuery;

    // Last updated
    let lastQuery = supabase
      .from('raw_imports')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (filters.store_id) lastQuery = lastQuery.eq('store_id', filters.store_id);
    if (filters.org_id) lastQuery = lastQuery.eq('org_id', filters.org_id);

    const { data: lastData } = await lastQuery;
    const lastUpdated = lastData?.[0]?.created_at || null;

    // Failed imports check
    let failedQuery = supabase
      .from('raw_imports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', timeRangeCutoff);

    if (filters.store_id) failedQuery = failedQuery.eq('store_id', filters.store_id);
    if (filters.org_id) failedQuery = failedQuery.eq('org_id', filters.org_id);

    const { count: failedCount } = await failedQuery;

    if (failedCount && failedCount > 0) {
      issues.push(`${failedCount} failed imports in the last period`);
    }

    // Pending imports check
    let pendingQuery = supabase
      .from('raw_imports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (filters.store_id) pendingQuery = pendingQuery.eq('store_id', filters.store_id);
    if (filters.org_id) pendingQuery = pendingQuery.eq('org_id', filters.org_id);

    const { count: pendingCount } = await pendingQuery;

    if (pendingCount && pendingCount > 10) {
      issues.push(`${pendingCount} pending imports in queue`);
    }

    // Determine status
    let status: LayerHealth['status'] = 'healthy';
    if (failedCount && failedCount > 5) status = 'critical';
    else if (failedCount && failedCount > 0) status = 'warning';
    else if (totalCount === 0) status = 'warning';

    return {
      status,
      record_count: totalCount || 0,
      recent_count: recentCount || 0,
      last_updated: lastUpdated,
      issues,
    };
  } catch (error) {
    console.error('[etl-health] L1 check error:', error);
    return {
      status: 'unknown',
      record_count: 0,
      recent_count: 0,
      last_updated: null,
      issues: ['Failed to check L1 layer'],
    };
  }
}

async function checkL2Health(
  supabase: any,
  filters: Record<string, string | undefined>,
  timeRangeCutoff: string
): Promise<LayerHealth> {
  const issues: string[] = [];

  try {
    // Check zone_events as primary L2 indicator
    let query = supabase
      .from('zone_events')
      .select('id', { count: 'exact', head: true });

    if (filters.store_id) query = query.eq('store_id', filters.store_id);
    if (filters.org_id) query = query.eq('org_id', filters.org_id);

    const { count: totalCount } = await query;

    // Recent count
    let recentQuery = supabase
      .from('zone_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', timeRangeCutoff);

    if (filters.store_id) recentQuery = recentQuery.eq('store_id', filters.store_id);
    if (filters.org_id) recentQuery = recentQuery.eq('org_id', filters.org_id);

    const { count: recentCount } = await recentQuery;

    // Last updated
    let lastQuery = supabase
      .from('zone_events')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (filters.store_id) lastQuery = lastQuery.eq('store_id', filters.store_id);
    if (filters.org_id) lastQuery = lastQuery.eq('org_id', filters.org_id);

    const { data: lastData } = await lastQuery;
    const lastUpdated = lastData?.[0]?.created_at || null;

    // Also check funnel_events
    let funnelQuery = supabase
      .from('funnel_events')
      .select('id', { count: 'exact', head: true });

    if (filters.store_id) funnelQuery = funnelQuery.eq('store_id', filters.store_id);
    if (filters.org_id) funnelQuery = funnelQuery.eq('org_id', filters.org_id);

    const { count: funnelCount } = await funnelQuery;

    // Determine status
    let status: LayerHealth['status'] = 'healthy';
    if (totalCount === 0 && funnelCount === 0) {
      status = 'warning';
      issues.push('No L2 event data available');
    }

    return {
      status,
      record_count: (totalCount || 0) + (funnelCount || 0),
      recent_count: recentCount || 0,
      last_updated: lastUpdated,
      issues,
    };
  } catch (error) {
    console.error('[etl-health] L2 check error:', error);
    return {
      status: 'unknown',
      record_count: 0,
      recent_count: 0,
      last_updated: null,
      issues: ['Failed to check L2 layer'],
    };
  }
}

async function checkL3Health(
  supabase: any,
  filters: Record<string, string | undefined>,
  timeRangeCutoff: string
): Promise<LayerHealth> {
  const issues: string[] = [];

  try {
    // Check daily_kpis_agg as primary L3 indicator
    let query = supabase
      .from('daily_kpis_agg')
      .select('id', { count: 'exact', head: true });

    if (filters.store_id) query = query.eq('store_id', filters.store_id);
    if (filters.org_id) query = query.eq('org_id', filters.org_id);

    const { count: totalCount } = await query;

    // Recent count (by calculated_at)
    let recentQuery = supabase
      .from('daily_kpis_agg')
      .select('id', { count: 'exact', head: true })
      .gte('calculated_at', timeRangeCutoff);

    if (filters.store_id) recentQuery = recentQuery.eq('store_id', filters.store_id);
    if (filters.org_id) recentQuery = recentQuery.eq('org_id', filters.org_id);

    const { count: recentCount } = await recentQuery;

    // Last updated
    let lastQuery = supabase
      .from('daily_kpis_agg')
      .select('calculated_at')
      .order('calculated_at', { ascending: false })
      .limit(1);

    if (filters.store_id) lastQuery = lastQuery.eq('store_id', filters.store_id);
    if (filters.org_id) lastQuery = lastQuery.eq('org_id', filters.org_id);

    const { data: lastData } = await lastQuery;
    const lastUpdated = lastData?.[0]?.calculated_at || null;

    // Check for missing source_trace (데이터 품질)
    let missingTraceQuery = supabase
      .from('daily_kpis_agg')
      .select('id', { count: 'exact', head: true })
      .or('source_trace.is.null,source_trace.eq.{}');

    if (filters.store_id) missingTraceQuery = missingTraceQuery.eq('store_id', filters.store_id);

    const { count: missingTraceCount } = await missingTraceQuery;

    if (missingTraceCount && missingTraceCount > 0) {
      issues.push(`${missingTraceCount} KPI records missing lineage info`);
    }

    // Determine status
    let status: LayerHealth['status'] = 'healthy';
    if (totalCount === 0) {
      status = 'warning';
      issues.push('No L3 aggregated data available');
    } else if (recentCount === 0) {
      status = 'warning';
      issues.push('No recent L3 data - aggregation may be stale');
    }

    return {
      status,
      record_count: totalCount || 0,
      recent_count: recentCount || 0,
      last_updated: lastUpdated,
      issues,
    };
  } catch (error) {
    console.error('[etl-health] L3 check error:', error);
    return {
      status: 'unknown',
      record_count: 0,
      recent_count: 0,
      last_updated: null,
      issues: ['Failed to check L3 layer'],
    };
  }
}

async function checkETLRunsHealth(
  supabase: any,
  filters: Record<string, string | undefined>,
  timeRangeCutoff: string
): Promise<PipelineHealth['etl_runs']> {
  try {
    let baseQuery = supabase.from('etl_runs').select('*');

    if (filters.store_id) baseQuery = baseQuery.eq('store_id', filters.store_id);
    if (filters.org_id) baseQuery = baseQuery.eq('org_id', filters.org_id);

    // Get all runs within time range
    const { data: runs } = await baseQuery.gte('started_at', timeRangeCutoff);

    if (!runs || runs.length === 0) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        avg_duration_ms: null,
        last_run: null,
      };
    }

    const completed = runs.filter((r: any) => r.status === 'completed').length;
    const failed = runs.filter((r: any) => r.status === 'failed').length;
    const running = runs.filter((r: any) => r.status === 'running').length;

    // Calculate avg duration for completed runs
    const completedRuns = runs.filter((r: any) => r.status === 'completed' && r.duration_ms);
    const avgDuration = completedRuns.length > 0
      ? Math.round(completedRuns.reduce((sum: number, r: any) => sum + r.duration_ms, 0) / completedRuns.length)
      : null;

    // Get last run time
    const sortedRuns = runs.sort((a: any, b: any) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const lastRun = sortedRuns[0]?.started_at || null;

    return {
      total: runs.length,
      completed,
      failed,
      running,
      avg_duration_ms: avgDuration,
      last_run: lastRun,
    };
  } catch (error) {
    console.error('[etl-health] ETL runs check error:', error);
    return {
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      avg_duration_ms: null,
      last_run: null,
    };
  }
}

function calculateDataFreshness(
  l1Health: LayerHealth,
  l2Health: LayerHealth,
  l3Health: LayerHealth,
  thresholdHours: number
): HealthCheckResult['data_freshness'] {
  const now = Date.now();

  const calcHours = (lastUpdated: string | null): number | null => {
    if (!lastUpdated) return null;
    return Math.round((now - new Date(lastUpdated).getTime()) / (1000 * 60 * 60));
  };

  const l1Hours = calcHours(l1Health.last_updated);
  const l2Hours = calcHours(l2Health.last_updated);
  const l3Hours = calcHours(l3Health.last_updated);

  const isStale = [l1Hours, l2Hours, l3Hours].some(
    (h) => h !== null && h > thresholdHours
  );

  return {
    l1_freshness_hours: l1Hours,
    l2_freshness_hours: l2Hours,
    l3_freshness_hours: l3Hours,
    is_stale: isStale,
    stale_threshold_hours: thresholdHours,
  };
}

function calculateOverallHealth(
  pipeline: PipelineHealth,
  freshness: HealthCheckResult['data_freshness']
): { overallStatus: HealthCheckResult['overall_status']; overallScore: number; recommendations: string[] } {
  const recommendations: string[] = [];
  let score = 100;

  // Layer status scores
  const statusScores = { healthy: 0, warning: -10, critical: -30, unknown: -20 };

  score += statusScores[pipeline.l1_raw.status];
  score += statusScores[pipeline.l2_fact.status];
  score += statusScores[pipeline.l3_aggregate.status];

  // ETL failure rate
  if (pipeline.etl_runs.total > 0) {
    const failureRate = pipeline.etl_runs.failed / pipeline.etl_runs.total;
    if (failureRate > 0.5) {
      score -= 30;
      recommendations.push('High ETL failure rate detected. Check error logs.');
    } else if (failureRate > 0.1) {
      score -= 10;
      recommendations.push('Some ETL failures detected. Review failed runs.');
    }
  }

  // Staleness penalty
  if (freshness.is_stale) {
    score -= 20;
    recommendations.push('Data is stale. Consider running ETL pipeline.');
  }

  // Running ETL check
  if (pipeline.etl_runs.running > 5) {
    score -= 10;
    recommendations.push('Multiple ETL processes running. Check for bottlenecks.');
  }

  // Add layer-specific issues to recommendations
  [...pipeline.l1_raw.issues, ...pipeline.l2_fact.issues, ...pipeline.l3_aggregate.issues]
    .forEach((issue) => {
      if (!recommendations.includes(issue)) {
        recommendations.push(issue);
      }
    });

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine overall status
  let overallStatus: HealthCheckResult['overall_status'] = 'healthy';
  if (score < 40) overallStatus = 'critical';
  else if (score < 70) overallStatus = 'warning';
  else if (score === 0) overallStatus = 'unknown';

  // Add positive recommendation if healthy
  if (overallStatus === 'healthy' && recommendations.length === 0) {
    recommendations.push('All systems operational.');
  }

  return { overallStatus, overallScore: score, recommendations };
}

/*
 * Usage Examples:
 *
 * GET /functions/v1/etl-health
 * GET /functions/v1/etl-health?store_id=xxx
 * GET /functions/v1/etl-health?store_id=xxx&check_type=full&time_range_hours=48
 *
 * POST /functions/v1/etl-health
 * {
 *   "store_id": "uuid",
 *   "check_type": "full",
 *   "time_range_hours": 24
 * }
 */
