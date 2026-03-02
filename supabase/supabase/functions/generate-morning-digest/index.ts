// ============================================================================
// generate-morning-digest/index.ts
// AI-powered daily morning digest for retail store managers
// Runs as a cron job every morning at 8am KST, or manually per store
// ============================================================================

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/error.ts";
import { createSupabaseAdmin } from "../_shared/supabase-client.ts";
import { chatCompletion } from "../_shared/ai/gateway.ts";

// ============================================================================
// Types
// ============================================================================

interface GenerateDigestRequest {
  org_id?: string;
  store_id?: string;
}

interface StoreInfo {
  id: string;
  org_id: string;
  store_name: string | null;
  store_type: string | null;
  location: string | null;
  city: string | null;
  timezone: string | null;
}

interface DailyKpi {
  date: string;
  total_visitors: number | null;
  unique_visitors: number | null;
  returning_visitors: number | null;
  avg_visit_duration_seconds: number | null;
  total_transactions: number | null;
  total_revenue: number | null;
  avg_basket_size: number | null;
  conversion_rate: number | null;
  weather_condition: string | null;
  temperature: number | null;
  is_holiday: boolean | null;
  special_event: string | null;
}

interface RecentAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface DigestResult {
  org_id: string;
  store_id: string;
  store_name: string | null;
  success: boolean;
  error?: string;
}

interface AiDigestOutput {
  kpi_summary: {
    visitors: { value: number; change_pct: number; direction: string };
    conversion_rate: { value: number; change_pct: number; direction: string };
    avg_dwell_time: { value: number; change_pct: number; direction: string };
  };
  ai_insight: string;
  action_items: Array<{
    priority: number;
    title: string;
    description: string;
    category: string;
  }>;
  weekly_trend: {
    summary: string;
    highlights: string[];
  } | null;
  upcoming_context: {
    weather: string | null;
    events: string | null;
    recommendation: string;
  };
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

    // Parse request body — empty body = cron mode
    let params: GenerateDigestRequest = {};
    if (req.method === "POST") {
      try {
        const body = await req.text();
        if (body.trim()) {
          params = JSON.parse(body);
        }
      } catch {
        // Empty body or invalid JSON -> cron mode
      }
    }

    const { org_id, store_id } = params;
    const isCronMode = !org_id && !store_id;

    console.log(
      `[morning-digest] Starting — mode: ${isCronMode ? "cron" : "manual"}, ` +
        `org_id: ${org_id || "all"}, store_id: ${store_id || "all"}`
    );

    // ========================================================================
    // 1. Determine which stores to process
    // ========================================================================
    const stores = await getTargetStores(supabase, org_id, store_id);

    if (stores.length === 0) {
      console.log("[morning-digest] No active stores found to process");
      return jsonResponse({
        digests_generated: 0,
        errors: [],
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[morning-digest] Processing ${stores.length} store(s)`);

    // ========================================================================
    // 2. Process each store
    // ========================================================================
    const results: DigestResult[] = [];
    const errors: string[] = [];
    let digestsGenerated = 0;

    for (const store of stores) {
      try {
        const generated = await processStore(supabase, store);
        results.push({
          org_id: store.org_id,
          store_id: store.id,
          store_name: store.store_name,
          success: generated,
        });
        if (generated) digestsGenerated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[morning-digest] Error processing store ${store.id}: ${msg}`
        );
        errors.push(`${store.store_name || store.id}: ${msg}`);
        results.push({
          org_id: store.org_id,
          store_id: store.id,
          store_name: store.store_name,
          success: false,
          error: msg,
        });
      }
    }

    console.log(
      `[morning-digest] Completed — ${digestsGenerated} digests generated, ` +
        `${errors.length} errors across ${stores.length} stores`
    );

    return jsonResponse({
      digests_generated: digestsGenerated,
      errors,
      stores_processed: stores.length,
      results,
      executed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Morning digest generation failed";
    console.error("[morning-digest] Fatal error:", error);
    return errorResponse(errorMessage, 500);
  }
});

// ============================================================================
// Store Fetching
// ============================================================================

async function getTargetStores(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  orgId?: string,
  storeId?: string
): Promise<StoreInfo[]> {
  let query = supabase
    .from("stores")
    .select("id, org_id, store_name, store_type, location, city, timezone")
    .eq("status", "active");

  if (storeId) {
    query = query.eq("id", storeId);
  }
  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[morning-digest] Error fetching stores:", error.message);
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }

  return (data || []) as StoreInfo[];
}

// ============================================================================
// Core Processing — Single Store
// ============================================================================

async function processStore(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  store: StoreInfo
): Promise<boolean> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = getDateStr(today, -1);
  const sevenDaysAgoStr = getDateStr(today, -7);
  const fourteenDaysAgoStr = getDateStr(today, -14);

  const storeName = store.store_name || store.id.slice(0, 8);
  console.log(`[morning-digest] Processing store: ${storeName} (${store.id})`);

  // ------------------------------------------------------------------
  // Check for existing digest today (skip duplicates)
  // ------------------------------------------------------------------
  const { data: existingDigest } = await supabase
    .from("morning_digests")
    .select("id")
    .eq("store_id", store.id)
    .eq("digest_date", todayStr)
    .maybeSingle();

  if (existingDigest) {
    console.log(
      `[morning-digest] Digest already exists for ${storeName} on ${todayStr}, skipping`
    );
    return false;
  }

  // ------------------------------------------------------------------
  // Fetch yesterday's KPIs + last 7 days for comparison
  // ------------------------------------------------------------------
  const { data: kpiData, error: kpiError } = await supabase
    .from("daily_kpis_agg")
    .select(
      "date, total_visitors, unique_visitors, returning_visitors, " +
        "avg_visit_duration_seconds, total_transactions, total_revenue, " +
        "avg_basket_size, conversion_rate, weather_condition, temperature, " +
        "is_holiday, special_event"
    )
    .eq("store_id", store.id)
    .gte("date", fourteenDaysAgoStr)
    .lte("date", yesterdayStr)
    .order("date", { ascending: true });

  if (kpiError) {
    throw new Error(`Failed to fetch KPI data: ${kpiError.message}`);
  }

  if (!kpiData || kpiData.length === 0) {
    console.log(
      `[morning-digest] No KPI data found for ${storeName}, skipping`
    );
    return false;
  }

  const typedKpiData = kpiData as DailyKpi[];

  // Separate yesterday vs historical
  const yesterdayKpi = typedKpiData.find((k) => k.date === yesterdayStr);
  const last7Days = typedKpiData.filter(
    (k) => k.date >= sevenDaysAgoStr && k.date <= yesterdayStr
  );
  const previousWeek = typedKpiData.filter(
    (k) => k.date >= fourteenDaysAgoStr && k.date < sevenDaysAgoStr
  );

  if (!yesterdayKpi) {
    console.log(
      `[morning-digest] No data for yesterday (${yesterdayStr}) for ${storeName}, skipping`
    );
    return false;
  }

  // ------------------------------------------------------------------
  // Fetch recent anomaly alerts (last 3 days)
  // ------------------------------------------------------------------
  const threeDaysAgoStr = getDateStr(today, -3);
  const { data: recentAlerts } = await supabase
    .from("user_alerts")
    .select("id, alert_type, severity, title, message, metadata, created_at")
    .eq("store_id", store.id)
    .eq("alert_type", "anomaly_detection")
    .gte("created_at", `${threeDaysAgoStr}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .limit(5);

  const typedAlerts = (recentAlerts || []) as RecentAlert[];

  // ------------------------------------------------------------------
  // Determine if it's Monday for weekly trend
  // ------------------------------------------------------------------
  const isMonday = today.getDay() === 1;

  // ------------------------------------------------------------------
  // Build AI context
  // ------------------------------------------------------------------
  const context = buildAiContext(
    store,
    yesterdayKpi,
    last7Days,
    previousWeek,
    typedAlerts,
    isMonday
  );

  // ------------------------------------------------------------------
  // Generate AI digest
  // ------------------------------------------------------------------
  const digest = await generateAiDigest(context, isMonday);

  // ------------------------------------------------------------------
  // Store in morning_digests table
  // ------------------------------------------------------------------
  const { error: insertError } = await supabase
    .from("morning_digests")
    .insert({
      org_id: store.org_id,
      store_id: store.id,
      digest_date: todayStr,
      kpi_summary: digest.kpi_summary,
      ai_insight: digest.ai_insight,
      action_items: digest.action_items,
      weekly_trend: isMonday ? digest.weekly_trend : null,
      upcoming_context: digest.upcoming_context,
    });

  if (insertError) {
    throw new Error(`Failed to insert digest: ${insertError.message}`);
  }

  console.log(
    `[morning-digest] Successfully generated digest for ${storeName}`
  );
  return true;
}

// ============================================================================
// AI Context Builder
// ============================================================================

interface AiContext {
  store_name: string;
  store_type: string;
  location: string;
  yesterday: {
    date: string;
    visitors: number;
    conversion_rate: number;
    avg_dwell_time_seconds: number;
    revenue: number;
    avg_basket_size: number;
    transactions: number;
    weather: string | null;
    temperature: number | null;
    is_holiday: boolean;
    special_event: string | null;
  };
  seven_day_avg: {
    visitors: number;
    conversion_rate: number;
    avg_dwell_time_seconds: number;
    revenue: number;
    avg_basket_size: number;
  };
  previous_week_avg: {
    visitors: number;
    conversion_rate: number;
    avg_dwell_time_seconds: number;
    revenue: number;
  } | null;
  recent_anomalies: Array<{
    severity: string;
    title: string;
    created_at: string;
  }>;
  is_monday: boolean;
  daily_trend: Array<{
    date: string;
    visitors: number;
    revenue: number;
    conversion_rate: number;
  }>;
}

function buildAiContext(
  store: StoreInfo,
  yesterdayKpi: DailyKpi,
  last7Days: DailyKpi[],
  previousWeek: DailyKpi[],
  recentAlerts: RecentAlert[],
  isMonday: boolean
): AiContext {
  const avg7 = computeAverages(last7Days);
  const avgPrev = previousWeek.length >= 3 ? computeAverages(previousWeek) : null;

  return {
    store_name: store.store_name || "Unknown",
    store_type: store.store_type || "retail",
    location: store.city || store.location || "Unknown",
    yesterday: {
      date: yesterdayKpi.date,
      visitors: yesterdayKpi.total_visitors || 0,
      conversion_rate: Number(yesterdayKpi.conversion_rate) || 0,
      avg_dwell_time_seconds: yesterdayKpi.avg_visit_duration_seconds || 0,
      revenue: Number(yesterdayKpi.total_revenue) || 0,
      avg_basket_size: Number(yesterdayKpi.avg_basket_size) || 0,
      transactions: yesterdayKpi.total_transactions || 0,
      weather: yesterdayKpi.weather_condition,
      temperature: yesterdayKpi.temperature ? Number(yesterdayKpi.temperature) : null,
      is_holiday: yesterdayKpi.is_holiday || false,
      special_event: yesterdayKpi.special_event,
    },
    seven_day_avg: avg7,
    previous_week_avg: avgPrev,
    recent_anomalies: recentAlerts.map((a) => ({
      severity: a.severity,
      title: a.title,
      created_at: a.created_at,
    })),
    is_monday: isMonday,
    daily_trend: last7Days.map((d) => ({
      date: d.date,
      visitors: d.total_visitors || 0,
      revenue: Number(d.total_revenue) || 0,
      conversion_rate: Number(d.conversion_rate) || 0,
    })),
  };
}

function computeAverages(
  data: DailyKpi[]
): {
  visitors: number;
  conversion_rate: number;
  avg_dwell_time_seconds: number;
  revenue: number;
  avg_basket_size: number;
} {
  if (data.length === 0) {
    return {
      visitors: 0,
      conversion_rate: 0,
      avg_dwell_time_seconds: 0,
      revenue: 0,
      avg_basket_size: 0,
    };
  }

  const sum = (arr: (number | null)[]): number =>
    arr.reduce<number>((s, v) => s + (Number(v) || 0), 0);

  const len = data.length;
  return {
    visitors: roundTo(sum(data.map((d) => d.total_visitors)) / len, 1),
    conversion_rate: roundTo(sum(data.map((d) => d.conversion_rate)) / len, 2),
    avg_dwell_time_seconds: roundTo(
      sum(data.map((d) => d.avg_visit_duration_seconds)) / len,
      0
    ),
    revenue: roundTo(sum(data.map((d) => d.total_revenue)) / len, 0),
    avg_basket_size: roundTo(sum(data.map((d) => d.avg_basket_size)) / len, 0),
  };
}

// ============================================================================
// AI Digest Generation
// ============================================================================

const SYSTEM_PROMPT = `당신은 NeuralTwin 리테일 AI 어시스턴트입니다.
매장 관리자를 위한 아침 데일리 다이제스트를 생성합니다.

## 응답 언어
반드시 한국어로 응답하세요.

## 분석 프레임워크 (4-Layer)
모든 인사이트는 아래 프레임워크를 따릅니다:
1. **What**: 어제 무슨 일이 있었는가? (데이터 사실)
2. **Why**: 왜 그런 결과가 나왔는가? (원인 분석)
3. **So What**: 이것이 매장에 어떤 의미인가? (비즈니스 영향)
4. **Now What**: 오늘 무엇을 해야 하는가? (구체적 행동)

## 리테일 도메인 지식
- 방문자 수: 매장 유동인구의 핵심 지표. 날씨, 요일, 이벤트에 영향 받음
- 전환율: 방문자 대비 구매자 비율. 접객 품질, 상품 진열, 프로모션의 성과 지표
- 체류시간: 고객 관여도(engagement)의 대리 지표. 길수록 좋지만 너무 길면 혼잡 신호
- 객단가: 고객당 평균 구매 금액. 교차 판매, 업셀링 성과 반영
- 매출: 최종 성과 지표. 방문자 수 x 전환율 x 객단가로 분해 가능

## 출력 형식
반드시 아래 JSON 구조를 정확히 따르세요. JSON만 출력하고 다른 텍스트는 포함하지 마세요.

{
  "kpi_summary": {
    "visitors": { "value": <어제 방문자수>, "change_pct": <7일 평균 대비 변화율%>, "direction": "up|down|flat" },
    "conversion_rate": { "value": <어제 전환율>, "change_pct": <7일 평균 대비 변화율%>, "direction": "up|down|flat" },
    "avg_dwell_time": { "value": <어제 평균 체류시간(초)>, "change_pct": <7일 평균 대비 변화율%>, "direction": "up|down|flat" }
  },
  "ai_insight": "<가장 중요한 인사이트 1개. 4-Layer 프레임워크 기반으로 2~3문장.>",
  "action_items": [
    { "priority": 1, "title": "<행동 제목>", "description": "<구체적 행동 설명>", "category": "staffing|merchandising|promotion|operations" },
    { "priority": 2, "title": "<행동 제목>", "description": "<구체적 행동 설명>", "category": "staffing|merchandising|promotion|operations" },
    { "priority": 3, "title": "<행동 제목>", "description": "<구체적 행동 설명>", "category": "staffing|merchandising|promotion|operations" }
  ],
  "weekly_trend": {
    "summary": "<이번 주 vs 지난 주 비교 요약. 월요일에만 생성, 아니면 null>",
    "highlights": ["<주요 변화 1>", "<주요 변화 2>"]
  },
  "upcoming_context": {
    "weather": "<오늘 날씨 기반 영향 예측 또는 null>",
    "events": "<예정 이벤트/공휴일 정보 또는 null>",
    "recommendation": "<날씨/이벤트 기반 오늘의 대응 전략>"
  }
}`;

async function generateAiDigest(
  context: AiContext,
  isMonday: boolean
): Promise<AiDigestOutput> {
  const userMessage = buildUserPrompt(context, isMonday);

  console.log("[morning-digest] Calling AI for digest generation...");

  const response = await chatCompletion({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    maxTokens: 2000,
    jsonMode: true,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty response");
  }

  console.log("[morning-digest] AI response received, parsing...");

  try {
    const parsed = JSON.parse(content) as AiDigestOutput;
    return validateAndNormalizeDigest(parsed, context, isMonday);
  } catch (parseError) {
    console.error(
      "[morning-digest] Failed to parse AI response:",
      content.slice(0, 500)
    );
    throw new Error(
      `Failed to parse AI digest: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
    );
  }
}

function buildUserPrompt(context: AiContext, isMonday: boolean): string {
  const { yesterday, seven_day_avg, previous_week_avg, recent_anomalies } =
    context;

  // Compute change percentages for reference
  const visitorsChange =
    seven_day_avg.visitors > 0
      ? roundTo(
          ((yesterday.visitors - seven_day_avg.visitors) /
            seven_day_avg.visitors) *
            100,
          1
        )
      : 0;
  const conversionChange =
    seven_day_avg.conversion_rate > 0
      ? roundTo(
          ((yesterday.conversion_rate - seven_day_avg.conversion_rate) /
            seven_day_avg.conversion_rate) *
            100,
          1
        )
      : 0;
  const dwellChange =
    seven_day_avg.avg_dwell_time_seconds > 0
      ? roundTo(
          ((yesterday.avg_dwell_time_seconds -
            seven_day_avg.avg_dwell_time_seconds) /
            seven_day_avg.avg_dwell_time_seconds) *
            100,
          1
        )
      : 0;

  let prompt = `## 매장 정보
- 매장명: ${context.store_name}
- 업종: ${context.store_type}
- 위치: ${context.location}

## 어제 (${yesterday.date}) 실적
- 방문자 수: ${yesterday.visitors}명 (7일 평균: ${seven_day_avg.visitors}명, ${visitorsChange > 0 ? "+" : ""}${visitorsChange}%)
- 전환율: ${yesterday.conversion_rate}% (7일 평균: ${seven_day_avg.conversion_rate}%, ${conversionChange > 0 ? "+" : ""}${conversionChange}%)
- 평균 체류시간: ${yesterday.avg_dwell_time_seconds}초 (7일 평균: ${seven_day_avg.avg_dwell_time_seconds}초, ${dwellChange > 0 ? "+" : ""}${dwellChange}%)
- 매출: ${yesterday.revenue.toLocaleString()}원
- 객단가: ${yesterday.avg_basket_size.toLocaleString()}원
- 거래 건수: ${yesterday.transactions}건`;

  if (yesterday.weather) {
    prompt += `\n- 날씨: ${yesterday.weather}`;
    if (yesterday.temperature !== null) {
      prompt += ` (${yesterday.temperature}°C)`;
    }
  }
  if (yesterday.is_holiday) {
    prompt += `\n- 공휴일 여부: 예`;
  }
  if (yesterday.special_event) {
    prompt += `\n- 특별 이벤트: ${yesterday.special_event}`;
  }

  // Daily trend
  prompt += `\n\n## 최근 7일 일별 추이`;
  for (const day of context.daily_trend) {
    prompt += `\n- ${day.date}: 방문자 ${day.visitors}명, 매출 ${day.revenue.toLocaleString()}원, 전환율 ${day.conversion_rate}%`;
  }

  // Recent anomalies
  if (recent_anomalies.length > 0) {
    prompt += `\n\n## 최근 이상 탐지 알림`;
    for (const alert of recent_anomalies) {
      prompt += `\n- [${alert.severity}] ${alert.title} (${alert.created_at.split("T")[0]})`;
    }
  }

  // Weekly trend (Monday only)
  if (isMonday && previous_week_avg) {
    const weekVisitorChange =
      previous_week_avg.visitors > 0
        ? roundTo(
            ((seven_day_avg.visitors - previous_week_avg.visitors) /
              previous_week_avg.visitors) *
              100,
            1
          )
        : 0;
    const weekRevenueChange =
      previous_week_avg.revenue > 0
        ? roundTo(
            ((seven_day_avg.revenue - previous_week_avg.revenue) /
              previous_week_avg.revenue) *
              100,
            1
          )
        : 0;

    prompt += `\n\n## 주간 비교 (이번 주 vs 지난 주)
- 평균 방문자: ${seven_day_avg.visitors}명 vs ${previous_week_avg.visitors}명 (${weekVisitorChange > 0 ? "+" : ""}${weekVisitorChange}%)
- 평균 매출: ${seven_day_avg.revenue.toLocaleString()}원 vs ${previous_week_avg.revenue.toLocaleString()}원 (${weekRevenueChange > 0 ? "+" : ""}${weekRevenueChange}%)
- 평균 전환율: ${seven_day_avg.conversion_rate}% vs ${previous_week_avg.conversion_rate}%
- 평균 체류시간: ${seven_day_avg.avg_dwell_time_seconds}초 vs ${previous_week_avg.avg_dwell_time_seconds}초`;
  } else if (isMonday) {
    prompt += `\n\n## 주간 비교
지난 주 데이터가 충분하지 않아 비교 불가. weekly_trend를 null로 설정하세요.`;
  }

  if (!isMonday) {
    prompt += `\n\n참고: 오늘은 월요일이 아니므로 weekly_trend를 null로 설정하세요.`;
  }

  prompt += `\n\n위 데이터를 기반으로 아침 다이제스트를 생성해주세요.`;

  return prompt;
}

/**
 * Validate AI output and fill in fallback values if fields are missing.
 */
function validateAndNormalizeDigest(
  parsed: AiDigestOutput,
  context: AiContext,
  isMonday: boolean
): AiDigestOutput {
  const { yesterday, seven_day_avg } = context;

  // Ensure kpi_summary has the expected structure
  if (!parsed.kpi_summary) {
    const visitorsChange =
      seven_day_avg.visitors > 0
        ? roundTo(
            ((yesterday.visitors - seven_day_avg.visitors) /
              seven_day_avg.visitors) *
              100,
            1
          )
        : 0;
    const conversionChange =
      seven_day_avg.conversion_rate > 0
        ? roundTo(
            ((yesterday.conversion_rate - seven_day_avg.conversion_rate) /
              seven_day_avg.conversion_rate) *
              100,
            1
          )
        : 0;
    const dwellChange =
      seven_day_avg.avg_dwell_time_seconds > 0
        ? roundTo(
            ((yesterday.avg_dwell_time_seconds -
              seven_day_avg.avg_dwell_time_seconds) /
              seven_day_avg.avg_dwell_time_seconds) *
              100,
            1
          )
        : 0;

    parsed.kpi_summary = {
      visitors: {
        value: yesterday.visitors,
        change_pct: visitorsChange,
        direction: visitorsChange > 1 ? "up" : visitorsChange < -1 ? "down" : "flat",
      },
      conversion_rate: {
        value: yesterday.conversion_rate,
        change_pct: conversionChange,
        direction: conversionChange > 1 ? "up" : conversionChange < -1 ? "down" : "flat",
      },
      avg_dwell_time: {
        value: yesterday.avg_dwell_time_seconds,
        change_pct: dwellChange,
        direction: dwellChange > 1 ? "up" : dwellChange < -1 ? "down" : "flat",
      },
    };
  }

  // Ensure ai_insight
  if (!parsed.ai_insight) {
    parsed.ai_insight = "데이터 분석 중 인사이트를 생성할 수 없습니다.";
  }

  // Ensure action_items has exactly 3 items
  if (!Array.isArray(parsed.action_items) || parsed.action_items.length === 0) {
    parsed.action_items = [
      {
        priority: 1,
        title: "어제 데이터 검토",
        description: "어제 실적 데이터를 대시보드에서 상세 확인하세요.",
        category: "operations",
      },
      {
        priority: 2,
        title: "직원 배치 점검",
        description: "오늘 예상 방문자 수에 맞춰 직원 배치를 조정하세요.",
        category: "staffing",
      },
      {
        priority: 3,
        title: "매장 진열 확인",
        description: "주요 상품 진열 상태와 재고를 확인하세요.",
        category: "merchandising",
      },
    ];
  }

  // Nullify weekly_trend if not Monday
  if (!isMonday) {
    parsed.weekly_trend = null;
  }

  // Ensure upcoming_context
  if (!parsed.upcoming_context) {
    parsed.upcoming_context = {
      weather: null,
      events: null,
      recommendation: "일반적인 매장 운영 절차를 따르세요.",
    };
  }

  return parsed;
}

// ============================================================================
// Utility Helpers
// ============================================================================

function getDateStr(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/*
 * Usage Examples:
 *
 * 1. Cron mode — process all active stores (every morning 8am):
 *    POST /functions/v1/generate-morning-digest
 *    Body: {} or empty
 *
 * 2. Manual mode — specific organization:
 *    POST /functions/v1/generate-morning-digest
 *    Body: {"org_id": "uuid"}
 *
 * 3. Manual mode — specific store:
 *    POST /functions/v1/generate-morning-digest
 *    Body: {"org_id": "uuid", "store_id": "uuid"}
 *
 * Response:
 * {
 *   "digests_generated": 5,
 *   "errors": [],
 *   "stores_processed": 5,
 *   "results": [
 *     { "org_id": "uuid", "store_id": "uuid", "store_name": "강남점", "success": true }
 *   ],
 *   "executed_at": "2026-03-02T23:00:00Z",
 *   "duration_ms": 4567
 * }
 */
