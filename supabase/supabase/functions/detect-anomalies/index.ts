// ============================================================================
// detect-anomalies/index.ts
// Z-score 기반 이상 탐지 Edge Function
// daily_kpis_agg 메트릭을 30일 이동평균 대비 분석하여 user_alerts 자동 생성
// 작성일: 2026-03-02
// ============================================================================

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/error.ts";
import { createSupabaseAdmin } from "../_shared/supabase-client.ts";

// ============================================================================
// Types
// ============================================================================

interface DetectAnomaliesRequest {
  mode?: "cron" | "manual";
  org_id?: string;
  store_id?: string;
  /** Number of days for rolling window (default: 30) */
  lookback_days?: number;
  /** Z-score threshold for anomaly detection (default: 2.0) */
  z_threshold?: number;
}

/** Metrics we monitor for anomalies */
const MONITORED_METRICS = [
  { column: "total_visitors", label: "방문자 수", unit: "명" },
  { column: "avg_visit_duration_seconds", label: "평균 체류시간", unit: "초" },
  { column: "conversion_rate", label: "전환율", unit: "%" },
  { column: "total_revenue", label: "매출", unit: "원" },
  { column: "avg_basket_size", label: "평균 객단가", unit: "원" },
] as const;

type MetricColumn = (typeof MONITORED_METRICS)[number]["column"];

interface MetricStats {
  mean: number;
  stddev: number;
  count: number;
}

interface AnomalyResult {
  metric: string;
  label: string;
  unit: string;
  current_value: number;
  mean: number;
  stddev: number;
  z_score: number;
  direction: "above" | "below";
  severity: "info" | "warning" | "critical";
}

interface StoreProcessingResult {
  org_id: string;
  store_id: string;
  store_name: string | null;
  date: string;
  anomalies_found: number;
  alerts_created: number;
  anomalies: AnomalyResult[];
  skipped_reason?: string;
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();

  try {
    const supabase = createSupabaseAdmin();

    // Parse request body
    let params: DetectAnomaliesRequest = {};
    if (req.method === "POST") {
      try {
        const body = await req.text();
        if (body.trim()) {
          params = JSON.parse(body);
        }
      } catch {
        // Empty body or invalid JSON → treat as cron mode
      }
    }

    const {
      mode = params.org_id ? "manual" : "cron",
      org_id,
      store_id,
      lookback_days = 30,
      z_threshold = 2.0,
    } = params;

    console.log(
      `[detect-anomalies] Starting anomaly detection — mode: ${mode}, ` +
        `org_id: ${org_id || "all"}, store_id: ${store_id || "all"}, ` +
        `lookback: ${lookback_days}d, z_threshold: ${z_threshold}`
    );

    // ========================================================================
    // 1. Determine which stores to process
    // ========================================================================
    const stores = await getTargetStores(supabase, org_id, store_id);

    if (stores.length === 0) {
      return jsonResponse({
        success: true,
        message: "No active stores found to process",
        stores_processed: 0,
        total_anomalies: 0,
        total_alerts_created: 0,
        results: [],
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[detect-anomalies] Processing ${stores.length} store(s)`);

    // ========================================================================
    // 2. Process each store
    // ========================================================================
    const results: StoreProcessingResult[] = [];
    let totalAnomalies = 0;
    let totalAlerts = 0;

    for (const store of stores) {
      try {
        const result = await processStore(
          supabase,
          store,
          lookback_days,
          z_threshold
        );
        results.push(result);
        totalAnomalies += result.anomalies_found;
        totalAlerts += result.alerts_created;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[detect-anomalies] Error processing store ${store.id}: ${msg}`
        );
        results.push({
          org_id: store.org_id,
          store_id: store.id,
          store_name: store.store_name,
          date: new Date().toISOString().split("T")[0],
          anomalies_found: 0,
          alerts_created: 0,
          anomalies: [],
          skipped_reason: `Error: ${msg}`,
        });
      }
    }

    console.log(
      `[detect-anomalies] Completed — ${totalAnomalies} anomalies found, ` +
        `${totalAlerts} alerts created across ${stores.length} stores`
    );

    return jsonResponse({
      success: true,
      mode,
      stores_processed: stores.length,
      total_anomalies: totalAnomalies,
      total_alerts_created: totalAlerts,
      results,
      executed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Anomaly detection failed";
    console.error("[detect-anomalies] Fatal error:", error);
    return errorResponse(errorMessage, 500);
  }
});

// ============================================================================
// Core Logic
// ============================================================================

/**
 * Get stores to process. In cron mode, get all stores from active orgs.
 * In manual mode, filter by org_id and/or store_id.
 */
async function getTargetStores(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  orgId?: string,
  storeId?: string
): Promise<Array<{ id: string; org_id: string; store_name: string | null }>> {
  let query = supabase
    .from("stores")
    .select("id, org_id, store_name")
    .eq("status", "active");

  if (storeId) {
    query = query.eq("id", storeId);
  }
  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[detect-anomalies] Error fetching stores:", error.message);
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }

  return data || [];
}

/**
 * Process anomaly detection for a single store.
 */
async function processStore(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  store: { id: string; org_id: string; store_name: string | null },
  lookbackDays: number,
  zThreshold: number
): Promise<StoreProcessingResult> {
  const today = new Date().toISOString().split("T")[0];
  const lookbackDate = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  // ------------------------------------------------------------------
  // 2a. Fetch recent KPI data for this store (lookback window)
  // ------------------------------------------------------------------
  const { data: kpiData, error: kpiError } = await supabase
    .from("daily_kpis_agg")
    .select(
      "date, total_visitors, avg_visit_duration_seconds, conversion_rate, total_revenue, avg_basket_size"
    )
    .eq("store_id", store.id)
    .gte("date", lookbackDate)
    .order("date", { ascending: true });

  if (kpiError) {
    throw new Error(`Failed to fetch KPI data: ${kpiError.message}`);
  }

  if (!kpiData || kpiData.length < 7) {
    // Need at least 7 days of data for meaningful statistics
    return {
      org_id: store.org_id,
      store_id: store.id,
      store_name: store.store_name,
      date: today,
      anomalies_found: 0,
      alerts_created: 0,
      anomalies: [],
      skipped_reason: `Insufficient data: ${kpiData?.length || 0} days (minimum 7 required)`,
    };
  }

  // ------------------------------------------------------------------
  // 2b. Get the latest day's data (the one we check for anomalies)
  // ------------------------------------------------------------------
  const latestRecord = kpiData[kpiData.length - 1];
  // Historical data = everything except the latest record
  const historicalData = kpiData.slice(0, -1);

  if (historicalData.length < 5) {
    return {
      org_id: store.org_id,
      store_id: store.id,
      store_name: store.store_name,
      date: latestRecord.date,
      anomalies_found: 0,
      alerts_created: 0,
      anomalies: [],
      skipped_reason: `Insufficient historical data: ${historicalData.length} days (minimum 5 required)`,
    };
  }

  // ------------------------------------------------------------------
  // 2c. Compute Z-scores for each monitored metric
  // ------------------------------------------------------------------
  const anomalies: AnomalyResult[] = [];

  for (const metric of MONITORED_METRICS) {
    const currentValue = Number(latestRecord[metric.column]);

    // Skip if current value is null/NaN
    if (currentValue == null || isNaN(currentValue)) {
      continue;
    }

    // Calculate stats from historical data
    const stats = calculateStats(historicalData, metric.column);

    // Skip if insufficient non-null data points or zero stddev
    if (stats.count < 5 || stats.stddev === 0) {
      continue;
    }

    // Calculate Z-score
    const zScore = (currentValue - stats.mean) / stats.stddev;
    const absZScore = Math.abs(zScore);

    if (absZScore >= zThreshold) {
      const direction: "above" | "below" = zScore > 0 ? "above" : "below";
      const severity = classifySeverity(absZScore, direction, metric.column);

      anomalies.push({
        metric: metric.column,
        label: metric.label,
        unit: metric.unit,
        current_value: roundTo(currentValue, 2),
        mean: roundTo(stats.mean, 2),
        stddev: roundTo(stats.stddev, 2),
        z_score: roundTo(zScore, 3),
        direction,
        severity,
      });
    }
  }

  // ------------------------------------------------------------------
  // 2d. Create user_alerts for detected anomalies
  // ------------------------------------------------------------------
  let alertsCreated = 0;

  if (anomalies.length > 0) {
    alertsCreated = await createAlerts(
      supabase,
      store,
      latestRecord.date,
      anomalies
    );
  }

  return {
    org_id: store.org_id,
    store_id: store.id,
    store_name: store.store_name,
    date: latestRecord.date,
    anomalies_found: anomalies.length,
    alerts_created: alertsCreated,
    anomalies,
  };
}

// ============================================================================
// Statistical Helpers
// ============================================================================

/**
 * Calculate mean and standard deviation for a metric column across historical data.
 * Skips null/NaN values.
 */
function calculateStats(
  data: Record<string, unknown>[],
  column: MetricColumn
): MetricStats {
  const values: number[] = [];

  for (const row of data) {
    const val = Number(row[column]);
    if (val != null && !isNaN(val)) {
      values.push(val);
    }
  }

  if (values.length === 0) {
    return { mean: 0, stddev: 0, count: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance =
    squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  const stddev = Math.sqrt(variance);

  return { mean, stddev, count: values.length };
}

/**
 * Classify anomaly severity based on Z-score magnitude and context.
 *
 * - |Z| >= 3.0 → critical
 * - |Z| >= 2.5 → warning
 * - |Z| >= 2.0 → info
 *
 * Revenue/conversion drops are escalated by one severity level since they
 * have direct business impact.
 */
function classifySeverity(
  absZScore: number,
  direction: "above" | "below",
  metric: MetricColumn
): "info" | "warning" | "critical" {
  let severity: "info" | "warning" | "critical";

  if (absZScore >= 3.0) {
    severity = "critical";
  } else if (absZScore >= 2.5) {
    severity = "warning";
  } else {
    severity = "info";
  }

  // Escalate severity for business-critical metric drops
  const criticalDropMetrics: MetricColumn[] = [
    "total_revenue",
    "conversion_rate",
    "total_visitors",
  ];

  if (direction === "below" && criticalDropMetrics.includes(metric)) {
    if (severity === "info") severity = "warning";
    else if (severity === "warning") severity = "critical";
  }

  return severity;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ============================================================================
// Alert Creation
// ============================================================================

/**
 * Create user_alerts rows for detected anomalies.
 * Groups multiple anomalies into a single alert if they have the same severity,
 * or creates individual alerts for critical ones.
 */
async function createAlerts(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  store: { id: string; org_id: string; store_name: string | null },
  date: string,
  anomalies: AnomalyResult[]
): Promise<number> {
  const alerts: Array<{
    org_id: string;
    store_id: string;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    action_url: string;
    action_label: string;
    metadata: Record<string, unknown>;
    expires_at: string;
  }> = [];

  const storeName = store.store_name || store.id.slice(0, 8);

  // Critical anomalies get individual alerts
  const criticalAnomalies = anomalies.filter((a) => a.severity === "critical");
  for (const anomaly of criticalAnomalies) {
    const directionKo = anomaly.direction === "above" ? "급증" : "급감";
    alerts.push({
      org_id: store.org_id,
      store_id: store.id,
      alert_type: "anomaly_detection",
      severity: "critical",
      title: `[긴급] ${storeName} — ${anomaly.label} ${directionKo}`,
      message: buildAlertMessage(anomaly, date, storeName),
      action_url: `/dashboard/analytics?store_id=${store.id}&date=${date}`,
      action_label: "분석 대시보드 확인",
      metadata: {
        detection_date: date,
        anomaly_type: "z_score",
        metric: anomaly.metric,
        z_score: anomaly.z_score,
        current_value: anomaly.current_value,
        mean: anomaly.mean,
        stddev: anomaly.stddev,
        direction: anomaly.direction,
      },
      expires_at: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  // Non-critical anomalies: group into a single summary alert per severity
  const warnAnomalies = anomalies.filter((a) => a.severity === "warning");
  const infoAnomalies = anomalies.filter((a) => a.severity === "info");

  if (warnAnomalies.length > 0) {
    alerts.push(
      buildGroupAlert(store, storeName, date, "warning", warnAnomalies)
    );
  }

  if (infoAnomalies.length > 0) {
    alerts.push(
      buildGroupAlert(store, storeName, date, "info", infoAnomalies)
    );
  }

  if (alerts.length === 0) {
    return 0;
  }

  // Check for duplicate alerts (same store + same date + same alert_type)
  // to avoid flooding the user with repeated alerts on re-runs
  const { data: existingAlerts } = await supabase
    .from("user_alerts")
    .select("id, metadata")
    .eq("store_id", store.id)
    .eq("alert_type", "anomaly_detection")
    .gte(
      "created_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  const existingDates = new Set(
    (existingAlerts || []).map(
      (a: { metadata: { detection_date?: string } }) =>
        a.metadata?.detection_date
    )
  );

  // Filter out alerts for dates that already have alerts
  const newAlerts = alerts.filter(
    (a) => !existingDates.has(a.metadata.detection_date as string)
  );

  if (newAlerts.length === 0) {
    console.log(
      `[detect-anomalies] Skipping duplicate alerts for store ${store.id} on ${date}`
    );
    return 0;
  }

  const { error: insertError, data: insertedData } = await supabase
    .from("user_alerts")
    .insert(newAlerts)
    .select("id");

  if (insertError) {
    console.error(
      `[detect-anomalies] Failed to insert alerts: ${insertError.message}`
    );
    return 0;
  }

  console.log(
    `[detect-anomalies] Created ${insertedData?.length || 0} alerts for store ${storeName} (${store.id})`
  );

  return insertedData?.length || 0;
}

/**
 * Build a human-readable alert message for a single anomaly.
 */
function buildAlertMessage(
  anomaly: AnomalyResult,
  date: string,
  storeName: string
): string {
  const directionKo = anomaly.direction === "above" ? "상승" : "하락";
  const percentChange = anomaly.mean !== 0
    ? roundTo(
        ((anomaly.current_value - anomaly.mean) / anomaly.mean) * 100,
        1
      )
    : 0;
  const absPercent = Math.abs(percentChange);

  return (
    `${date} 기준, ${storeName}의 ${anomaly.label}이(가) ` +
    `30일 평균 대비 ${absPercent}% ${directionKo}했습니다.\n\n` +
    `현재값: ${anomaly.current_value.toLocaleString()}${anomaly.unit}\n` +
    `30일 평균: ${anomaly.mean.toLocaleString()}${anomaly.unit}\n` +
    `표준편차: ${anomaly.stddev.toLocaleString()}${anomaly.unit}\n` +
    `Z-score: ${anomaly.z_score} (임계값: ±2.0)`
  );
}

/**
 * Build a grouped alert for multiple anomalies of the same severity.
 */
function buildGroupAlert(
  store: { id: string; org_id: string },
  storeName: string,
  date: string,
  severity: "warning" | "info",
  anomalies: AnomalyResult[]
): {
  org_id: string;
  store_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  action_url: string;
  action_label: string;
  metadata: Record<string, unknown>;
  expires_at: string;
} {
  const severityLabel = severity === "warning" ? "주의" : "참고";

  const lines = anomalies.map((a) => {
    const dirKo = a.direction === "above" ? "상승" : "하락";
    const pctChange =
      a.mean !== 0
        ? roundTo(((a.current_value - a.mean) / a.mean) * 100, 1)
        : 0;
    return `- ${a.label}: ${a.current_value.toLocaleString()}${a.unit} (평균 ${a.mean.toLocaleString()}${a.unit}, ${Math.abs(pctChange)}% ${dirKo}, Z=${a.z_score})`;
  });

  return {
    org_id: store.org_id,
    store_id: store.id,
    alert_type: "anomaly_detection",
    severity,
    title: `[${severityLabel}] ${storeName} — ${anomalies.length}개 지표 이상 감지`,
    message:
      `${date} 기준, ${storeName}에서 다음 지표에 이상이 감지되었습니다:\n\n` +
      lines.join("\n"),
    action_url: `/dashboard/analytics?store_id=${store.id}&date=${date}`,
    action_label: "분석 대시보드 확인",
    metadata: {
      detection_date: date,
      anomaly_type: "z_score",
      anomaly_count: anomalies.length,
      metrics: anomalies.map((a) => ({
        metric: a.metric,
        z_score: a.z_score,
        current_value: a.current_value,
        mean: a.mean,
        direction: a.direction,
      })),
    },
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================================================
// Response Helper
// ============================================================================

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/*
 * Usage Examples:
 *
 * 1. Cron mode — process all active organizations:
 *    POST /functions/v1/detect-anomalies
 *    Body: {} or {"mode": "cron"}
 *
 * 2. Manual mode — specific organization:
 *    POST /functions/v1/detect-anomalies
 *    Body: {"org_id": "uuid"}
 *
 * 3. Manual mode — specific store:
 *    POST /functions/v1/detect-anomalies
 *    Body: {"org_id": "uuid", "store_id": "uuid"}
 *
 * 4. Custom thresholds:
 *    POST /functions/v1/detect-anomalies
 *    Body: {"lookback_days": 14, "z_threshold": 2.5}
 *
 * Response:
 * {
 *   "success": true,
 *   "mode": "cron",
 *   "stores_processed": 5,
 *   "total_anomalies": 3,
 *   "total_alerts_created": 2,
 *   "results": [
 *     {
 *       "org_id": "uuid",
 *       "store_id": "uuid",
 *       "store_name": "강남점",
 *       "date": "2026-03-01",
 *       "anomalies_found": 2,
 *       "alerts_created": 1,
 *       "anomalies": [
 *         {
 *           "metric": "total_visitors",
 *           "label": "방문자 수",
 *           "current_value": 45,
 *           "mean": 120.5,
 *           "stddev": 15.3,
 *           "z_score": -4.935,
 *           "direction": "below",
 *           "severity": "critical"
 *         }
 *       ]
 *     }
 *   ],
 *   "executed_at": "2026-03-02T09:00:00Z",
 *   "duration_ms": 1234
 * }
 */
