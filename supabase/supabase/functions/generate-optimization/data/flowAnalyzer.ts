/**
 * flowAnalyzer.ts - Phase 0.2: Customer Flow Analysis Module
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 고객 동선 분석 및 존 전이 확률 행렬 생성
 *
 * 주요 기능:
 * - zone_transitions 데이터 기반 전이 확률 행렬 생성
 * - 고객 주요 경로 추출 (DFS/BFS)
 * - 병목 구간 및 데드존 식별
 * - 존별 유동 통계 계산
 * - 동선 최적화 기회 식별
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 존 전이 확률 행렬
 * N×N 행렬로 존 간 이동 확률을 표현
 */
export interface TransitionMatrix {
  zones: string[];                    // 존 ID 목록 (행렬 인덱스 순서)
  zoneNames: Map<string, string>;     // 존 ID → 존 이름 매핑
  matrix: number[][];                 // N×N 확률 행렬 (0~1)
  transitionCounts: number[][];       // N×N 실제 전이 횟수
  avgDurations: number[][];           // N×N 평균 전이 시간(초)
  totalTransitions: number;           // 총 전이 횟수
  analysisStartDate: string;          // 분석 시작일
  analysisEndDate: string;            // 분석 종료일
}

/**
 * 고객 이동 경로
 */
export interface CustomerPath {
  pathId: string;                     // 경로 고유 ID
  zones: string[];                    // 경로 상의 존 ID 목록
  zoneNames: string[];                // 경로 상의 존 이름 목록
  probability: number;                // 경로 발생 확률
  frequency: number;                  // 발생 빈도
  totalDuration: number;              // 총 소요 시간(초)
  avgDuration: number;                // 평균 소요 시간(초)
  conversionRate: number;             // 전환율 (계산대 도달률)
  pathType: 'entry_to_exit' | 'entry_to_checkout' | 'browsing' | 'direct';
}

/**
 * 병목 구간 정보
 */
export interface BottleneckZone {
  zoneId: string;                     // 존 ID
  zoneName: string;                   // 존 이름
  congestionScore: number;            // 혼잡도 점수 (0~1)
  avgWaitTime: number;                // 평균 대기 시간(초)
  peakHours: number[];                // 피크 시간대
  inboundFlow: number;                // 유입량
  outboundFlow: number;               // 유출량
  flowRatio: number;                  // 유입/유출 비율
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;             // 개선 권고사항
}

/**
 * 데드존 (저유동 구역) 정보
 */
export interface DeadZone {
  zoneId: string;                     // 존 ID
  zoneName: string;                   // 존 이름
  visitRate: number;                  // 방문율 (0~1)
  avgVisitors: number;                // 일평균 방문자 수
  avgDwellTime: number;               // 평균 체류 시간(초)
  reachability: number;               // 접근성 점수 (0~1)
  connectedZones: string[];           // 연결된 존 목록
  potentialValue: number;             // 잠재 가치 점수
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;             // 개선 권고사항
}

/**
 * 존별 유동 통계
 */
export interface ZoneFlowStats {
  zoneId: string;                     // 존 ID
  zoneName: string;                   // 존 이름
  zoneType: string;                   // 존 유형
  totalVisitors: number;              // 총 방문자 수
  uniqueVisitors: number;             // 고유 방문자 수
  avgDwellSeconds: number;            // 평균 체류 시간(초)
  entryCount: number;                 // 진입 횟수
  exitCount: number;                  // 이탈 횟수
  conversionCount: number;            // 전환 횟수
  conversionRate: number;             // 전환율
  bounceRate: number;                 // 이탈률
  flowThroughRate: number;            // 통과율
  peakHour: number;                   // 피크 시간
  peakOccupancy: number;              // 피크 점유율
  inboundTransitions: Map<string, number>;  // 유입 존별 전이 수
  outboundTransitions: Map<string, number>; // 유출 존별 전이 수
}

/**
 * 동선 최적화 기회
 */
export interface FlowOpportunity {
  opportunityId: string;              // 기회 ID
  type: 'redirect' | 'attract' | 'decongest' | 'connect' | 'optimize_path';
  priority: 'critical' | 'high' | 'medium' | 'low';
  sourceZones: string[];              // 관련 소스 존
  targetZones: string[];              // 관련 타겟 존
  currentState: string;               // 현재 상태 설명
  expectedImprovement: number;        // 예상 개선율 (%)
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  description: string;                // 기회 설명
  actionItems: string[];              // 실행 항목
}

/**
 * 고객 동선 분석 결과
 */
export interface FlowAnalysisResult {
  storeId: string;                    // 매장 ID
  analysisDate: string;               // 분석 일자
  analysisPeriodDays: number;         // 분석 기간 (일)

  // 핵심 분석 결과
  transitionMatrix: TransitionMatrix; // 전이 확률 행렬
  keyPaths: CustomerPath[];           // 주요 고객 경로
  bottlenecks: BottleneckZone[];      // 병목 구간
  deadZones: DeadZone[];              // 데드존
  zoneStats: ZoneFlowStats[];         // 존별 통계
  opportunities: FlowOpportunity[];   // 최적화 기회

  // 요약 메트릭
  summary: {
    totalZones: number;               // 총 존 수
    totalTransitions: number;         // 총 전이 수
    avgPathLength: number;            // 평균 경로 길이
    avgPathDuration: number;          // 평균 경로 소요시간
    overallConversionRate: number;    // 전체 전환율
    bottleneckCount: number;          // 병목 구간 수
    deadZoneCount: number;            // 데드존 수
    opportunityCount: number;         // 최적화 기회 수
    flowHealthScore: number;          // 동선 건강도 점수 (0~100)
  };

  // AI 프롬프트용 컨텍스트
  aiPromptContext: string;            // AI 프롬프트에 추가할 컨텍스트
}

// ============================================================================
// Database Row Types
// ============================================================================

interface ZoneTransitionRow {
  id: string;
  from_zone_id: string;
  to_zone_id: string;
  store_id: string;
  org_id: string | null;
  transition_date: string;
  transition_count: number | null;
  avg_duration_seconds: number | null;
  created_at: string | null;
}

interface ZoneDimRow {
  id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string | null;
  store_id: string;
  org_id: string | null;
  area_sqm: number | null;
  capacity: number | null;
  is_active: boolean | null;
}

interface ZoneDailyMetricsRow {
  id: string;
  zone_id: string | null;
  store_id: string | null;
  org_id: string | null;
  date: string;
  total_visitors: number | null;
  unique_visitors: number | null;
  avg_dwell_seconds: number | null;
  total_dwell_seconds: number | null;
  entry_count: number | null;
  exit_count: number | null;
  conversion_count: number | null;
  peak_hour: number | null;
  peak_occupancy: number | null;
  heatmap_intensity: number | null;
  revenue_attributed: number | null;
  interaction_count: number | null;
}

// ============================================================================
// Constants
// ============================================================================

// 병목 판단 임계값
const BOTTLENECK_THRESHOLDS = {
  critical: { flowRatio: 2.0, congestionScore: 0.8 },
  high: { flowRatio: 1.5, congestionScore: 0.6 },
  medium: { flowRatio: 1.2, congestionScore: 0.4 },
  low: { flowRatio: 1.0, congestionScore: 0.2 },
};

// 데드존 판단 임계값
const DEADZONE_THRESHOLDS = {
  critical: { visitRate: 0.05, reachability: 0.2 },
  high: { visitRate: 0.1, reachability: 0.3 },
  medium: { visitRate: 0.2, reachability: 0.5 },
  low: { visitRate: 0.3, reachability: 0.7 },
};

// 분석 기본 기간 (일)
const DEFAULT_ANALYSIS_DAYS = 30;

// 주요 경로 최대 개수
const MAX_KEY_PATHS = 10;

// 존 유형별 가중치
const ZONE_TYPE_WEIGHTS: Record<string, number> = {
  entrance: 1.0,
  main_hall: 0.9,
  clothing: 0.8,
  accessories: 0.7,
  fitting_room: 0.6,
  checkout: 1.0,
  lounge: 0.5,
  storage: 0.2,
  default: 0.5,
};

// ============================================================================
// Main Functions
// ============================================================================

/**
 * 고객 동선 분석 메인 함수
 * zone_transitions, zones_dim, zone_daily_metrics 데이터를 기반으로 종합 분석 수행
 */
export async function analyzeCustomerFlow(
  supabase: any,
  storeId: string,
  analysisDays: number = DEFAULT_ANALYSIS_DAYS
): Promise<FlowAnalysisResult> {
  const analysisDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - analysisDays);
  const startDateStr = startDate.toISOString().split('T')[0];

  console.log(`[FlowAnalyzer] Starting flow analysis for store ${storeId}`);
  console.log(`[FlowAnalyzer] Analysis period: ${startDateStr} to ${analysisDate}`);

  // 1. 데이터 로드
  const [transitions, zones, dailyMetrics] = await Promise.all([
    loadZoneTransitions(supabase, storeId, startDateStr, analysisDate),
    loadZones(supabase, storeId),
    loadZoneDailyMetrics(supabase, storeId, startDateStr, analysisDate),
  ]);

  console.log(`[FlowAnalyzer] Loaded ${transitions.length} transitions, ${zones.length} zones, ${dailyMetrics.length} daily metrics`);

  // 데이터가 없는 경우 빈 결과 반환
  if (zones.length === 0) {
    console.log('[FlowAnalyzer] No zones found, returning empty result');
    return createEmptyResult(storeId, analysisDate, analysisDays);
  }

  // 2. 전이 확률 행렬 생성
  const transitionMatrix = buildTransitionMatrix(transitions, zones, startDateStr, analysisDate);

  // 3. 존별 통계 계산
  const zoneStats = calculateZoneStats(zones, dailyMetrics, transitions);

  // 4. 주요 경로 추출
  const keyPaths = extractKeyPaths(transitionMatrix, zoneStats, zones);

  // 5. 병목 구간 식별
  const bottlenecks = identifyBottlenecks(zoneStats, transitionMatrix);

  // 6. 데드존 식별
  const deadZones = identifyDeadZones(zoneStats, transitionMatrix);

  // 7. 최적화 기회 식별
  const opportunities = identifyFlowOpportunities(
    transitionMatrix, keyPaths, bottlenecks, deadZones, zoneStats
  );

  // 8. 요약 메트릭 계산
  const summary = calculateSummary(
    zones, transitionMatrix, keyPaths, bottlenecks, deadZones, opportunities, zoneStats
  );

  // 9. AI 프롬프트 컨텍스트 생성
  const aiPromptContext = buildAIPromptContext(
    transitionMatrix, keyPaths, bottlenecks, deadZones, opportunities, summary
  );

  const result: FlowAnalysisResult = {
    storeId,
    analysisDate,
    analysisPeriodDays: analysisDays,
    transitionMatrix,
    keyPaths,
    bottlenecks,
    deadZones,
    zoneStats,
    opportunities,
    summary,
    aiPromptContext,
  };

  console.log(`[FlowAnalyzer] Analysis complete. Flow health score: ${summary.flowHealthScore}`);

  return result;
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * zone_transitions 데이터 로드
 */
async function loadZoneTransitions(
  supabase: any,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<ZoneTransitionRow[]> {
  const { data, error } = await supabase
    .from('zone_transitions')
    .select('*')
    .eq('store_id', storeId)
    .gte('transition_date', startDate)
    .lte('transition_date', endDate)
    .order('transition_date', { ascending: true });

  if (error) {
    console.error('[FlowAnalyzer] Error loading zone transitions:', error);
    return [];
  }

  return data || [];
}

/**
 * zones_dim 데이터 로드
 */
async function loadZones(
  supabase: any,
  storeId: string
): Promise<ZoneDimRow[]> {
  // zones_dim 테이블에서 로드
  let { data, error } = await supabase
    .from('zones_dim')
    .select('id, zone_code, zone_name, zone_type, store_id, org_id, area_sqm, capacity, is_active')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (error) {
    console.error('[FlowAnalyzer] Error loading zones:', error);
    return [];
  }

  return data || [];
}

/**
 * zone_daily_metrics 데이터 로드
 */
async function loadZoneDailyMetrics(
  supabase: any,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<ZoneDailyMetricsRow[]> {
  const { data, error } = await supabase
    .from('zone_daily_metrics')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('[FlowAnalyzer] Error loading zone daily metrics:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * 전이 확률 행렬 생성
 * N×N 행렬로 존 간 이동 확률 계산
 */
export function buildTransitionMatrix(
  transitions: ZoneTransitionRow[],
  zones: ZoneDimRow[],
  startDate: string,
  endDate: string
): TransitionMatrix {
  const zoneIds = zones.map(z => z.id);
  const n = zoneIds.length;

  // 존 이름 매핑
  const zoneNames = new Map<string, string>();
  zones.forEach(z => zoneNames.set(z.id, z.zone_name));

  // 행렬 초기화
  const transitionCounts: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const avgDurations: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const durationSums: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  // 존 ID → 인덱스 매핑
  const zoneIndexMap = new Map<string, number>();
  zoneIds.forEach((id, idx) => zoneIndexMap.set(id, idx));

  // 전이 데이터 집계
  let totalTransitions = 0;

  for (const t of transitions) {
    const fromIdx = zoneIndexMap.get(t.from_zone_id);
    const toIdx = zoneIndexMap.get(t.to_zone_id);

    if (fromIdx !== undefined && toIdx !== undefined) {
      const count = t.transition_count || 0;
      const duration = t.avg_duration_seconds || 0;

      transitionCounts[fromIdx][toIdx] += count;
      durationSums[fromIdx][toIdx] += duration * count;
      totalTransitions += count;
    }
  }

  // 확률 행렬 및 평균 시간 계산
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    const rowSum = transitionCounts[i].reduce((a, b) => a + b, 0);

    for (let j = 0; j < n; j++) {
      // 확률 계산
      matrix[i][j] = rowSum > 0 ? transitionCounts[i][j] / rowSum : 0;

      // 평균 시간 계산
      avgDurations[i][j] = transitionCounts[i][j] > 0
        ? durationSums[i][j] / transitionCounts[i][j]
        : 0;
    }
  }

  return {
    zones: zoneIds,
    zoneNames,
    matrix,
    transitionCounts,
    avgDurations,
    totalTransitions,
    analysisStartDate: startDate,
    analysisEndDate: endDate,
  };
}

/**
 * 주요 고객 경로 추출 (DFS 기반)
 */
export function extractKeyPaths(
  transitionMatrix: TransitionMatrix,
  zoneStats: ZoneFlowStats[],
  zones: ZoneDimRow[]
): CustomerPath[] {
  const paths: CustomerPath[] = [];
  const { zones: zoneIds, zoneNames, matrix, transitionCounts, avgDurations } = transitionMatrix;

  // 입구 존 찾기
  const entranceZones = zones.filter(z =>
    z.zone_type?.toLowerCase().includes('entrance') ||
    z.zone_code?.toLowerCase().includes('entrance') ||
    z.zone_name?.toLowerCase().includes('입구')
  );

  // 계산대 존 찾기
  const checkoutZones = zones.filter(z =>
    z.zone_type?.toLowerCase().includes('checkout') ||
    z.zone_code?.toLowerCase().includes('checkout') ||
    z.zone_name?.toLowerCase().includes('계산')
  );

  const entranceIds = new Set(entranceZones.map(z => z.id));
  const checkoutIds = new Set(checkoutZones.map(z => z.id));

  // 존 ID → 인덱스 매핑
  const zoneIndexMap = new Map<string, number>();
  zoneIds.forEach((id, idx) => zoneIndexMap.set(id, idx));

  // DFS로 주요 경로 탐색
  const discoveredPaths: Array<{
    path: string[];
    probability: number;
    frequency: number;
    duration: number;
  }> = [];

  // 각 입구에서 시작하는 경로 탐색
  for (const entranceId of entranceIds) {
    const startIdx = zoneIndexMap.get(entranceId);
    if (startIdx === undefined) continue;

    // DFS 탐색
    const stack: Array<{
      path: number[];
      probability: number;
      frequency: number;
      duration: number;
    }> = [{ path: [startIdx], probability: 1.0, frequency: 0, duration: 0 }];

    const visited = new Set<string>();

    while (stack.length > 0 && discoveredPaths.length < MAX_KEY_PATHS * 3) {
      const current = stack.pop()!;
      const lastIdx = current.path[current.path.length - 1];
      const pathKey = current.path.join('-');

      // 이미 방문한 경로 스킵
      if (visited.has(pathKey)) continue;
      visited.add(pathKey);

      // 경로가 충분히 길면 저장 (최소 2개 존)
      if (current.path.length >= 2) {
        discoveredPaths.push({
          path: current.path.map(i => zoneIds[i]),
          probability: current.probability,
          frequency: current.frequency,
          duration: current.duration,
        });
      }

      // 경로 길이 제한 (최대 7개 존)
      if (current.path.length >= 7) continue;

      // 다음 존으로 확장
      for (let nextIdx = 0; nextIdx < zoneIds.length; nextIdx++) {
        const prob = matrix[lastIdx][nextIdx];

        // 확률 임계값 이상인 전이만 탐색
        if (prob >= 0.05 && !current.path.includes(nextIdx)) {
          const transCount = transitionCounts[lastIdx][nextIdx];
          const duration = avgDurations[lastIdx][nextIdx];

          stack.push({
            path: [...current.path, nextIdx],
            probability: current.probability * prob,
            frequency: current.frequency + transCount,
            duration: current.duration + duration,
          });
        }
      }
    }
  }

  // 빈도 기준 정렬 및 상위 경로 선택
  discoveredPaths.sort((a, b) => b.frequency - a.frequency);
  const topPaths = discoveredPaths.slice(0, MAX_KEY_PATHS);

  // CustomerPath 객체 생성
  for (let i = 0; i < topPaths.length; i++) {
    const p = topPaths[i];
    const pathZoneNames = p.path.map(id => zoneNames.get(id) || id);

    // 경로 유형 판단
    let pathType: CustomerPath['pathType'] = 'browsing';
    const startsAtEntrance = entranceIds.has(p.path[0]);
    const endsAtCheckout = checkoutIds.has(p.path[p.path.length - 1]);

    if (startsAtEntrance && endsAtCheckout) {
      pathType = 'entry_to_checkout';
    } else if (startsAtEntrance) {
      pathType = 'entry_to_exit';
    } else if (p.path.length === 2) {
      pathType = 'direct';
    }

    // 전환율 계산
    const conversionRate = endsAtCheckout ? 1.0 : 0;

    paths.push({
      pathId: `path_${i + 1}`,
      zones: p.path,
      zoneNames: pathZoneNames,
      probability: p.probability,
      frequency: p.frequency,
      totalDuration: p.duration,
      avgDuration: p.path.length > 1 ? p.duration / (p.path.length - 1) : 0,
      conversionRate,
      pathType,
    });
  }

  return paths;
}

/**
 * 존별 유동 통계 계산
 */
export function calculateZoneStats(
  zones: ZoneDimRow[],
  dailyMetrics: ZoneDailyMetricsRow[],
  transitions: ZoneTransitionRow[]
): ZoneFlowStats[] {
  const stats: ZoneFlowStats[] = [];

  // 존별 일일 메트릭 집계
  const metricsByZone = new Map<string, ZoneDailyMetricsRow[]>();
  for (const m of dailyMetrics) {
    if (!m.zone_id) continue;
    const existing = metricsByZone.get(m.zone_id) || [];
    existing.push(m);
    metricsByZone.set(m.zone_id, existing);
  }

  // 존별 전이 집계
  const inboundByZone = new Map<string, Map<string, number>>();
  const outboundByZone = new Map<string, Map<string, number>>();

  for (const t of transitions) {
    const count = t.transition_count || 0;

    // 유입 (to_zone 기준)
    if (!inboundByZone.has(t.to_zone_id)) {
      inboundByZone.set(t.to_zone_id, new Map());
    }
    const inbound = inboundByZone.get(t.to_zone_id)!;
    inbound.set(t.from_zone_id, (inbound.get(t.from_zone_id) || 0) + count);

    // 유출 (from_zone 기준)
    if (!outboundByZone.has(t.from_zone_id)) {
      outboundByZone.set(t.from_zone_id, new Map());
    }
    const outbound = outboundByZone.get(t.from_zone_id)!;
    outbound.set(t.to_zone_id, (outbound.get(t.to_zone_id) || 0) + count);
  }

  // 각 존별 통계 계산
  for (const zone of zones) {
    const metrics = metricsByZone.get(zone.id) || [];
    const inbound = inboundByZone.get(zone.id) || new Map();
    const outbound = outboundByZone.get(zone.id) || new Map();

    // 메트릭 집계
    let totalVisitors = 0;
    let uniqueVisitors = 0;
    let totalDwellSeconds = 0;
    let entryCount = 0;
    let exitCount = 0;
    let conversionCount = 0;
    let peakHour = 0;
    let peakOccupancy = 0;

    for (const m of metrics) {
      totalVisitors += m.total_visitors || 0;
      uniqueVisitors += m.unique_visitors || 0;
      totalDwellSeconds += m.total_dwell_seconds || 0;
      entryCount += m.entry_count || 0;
      exitCount += m.exit_count || 0;
      conversionCount += m.conversion_count || 0;

      if ((m.peak_occupancy || 0) > peakOccupancy) {
        peakOccupancy = m.peak_occupancy || 0;
        peakHour = m.peak_hour || 0;
      }
    }

    const avgDwellSeconds = totalVisitors > 0 ? totalDwellSeconds / totalVisitors : 0;
    const conversionRate = totalVisitors > 0 ? conversionCount / totalVisitors : 0;
    const bounceRate = entryCount > 0 ? Math.max(0, (entryCount - exitCount) / entryCount) : 0;

    // 유입/유출 총합
    const totalInbound = Array.from(inbound.values()).reduce((a, b) => a + b, 0);
    const totalOutbound = Array.from(outbound.values()).reduce((a, b) => a + b, 0);
    const flowThroughRate = totalInbound > 0 ? totalOutbound / totalInbound : 0;

    stats.push({
      zoneId: zone.id,
      zoneName: zone.zone_name,
      zoneType: zone.zone_type || 'default',
      totalVisitors,
      uniqueVisitors,
      avgDwellSeconds,
      entryCount,
      exitCount,
      conversionCount,
      conversionRate,
      bounceRate,
      flowThroughRate,
      peakHour,
      peakOccupancy,
      inboundTransitions: inbound,
      outboundTransitions: outbound,
    });
  }

  return stats;
}

/**
 * 병목 구간 식별
 */
export function identifyBottlenecks(
  zoneStats: ZoneFlowStats[],
  transitionMatrix: TransitionMatrix
): BottleneckZone[] {
  const bottlenecks: BottleneckZone[] = [];

  // 전체 평균 계산
  const avgVisitors = zoneStats.reduce((sum, z) => sum + z.totalVisitors, 0) / Math.max(zoneStats.length, 1);
  const avgDwell = zoneStats.reduce((sum, z) => sum + z.avgDwellSeconds, 0) / Math.max(zoneStats.length, 1);

  for (const stat of zoneStats) {
    const totalInbound = Array.from(stat.inboundTransitions.values()).reduce((a, b) => a + b, 0);
    const totalOutbound = Array.from(stat.outboundTransitions.values()).reduce((a, b) => a + b, 0);

    // 유입/유출 비율
    const flowRatio = totalOutbound > 0 ? totalInbound / totalOutbound : totalInbound > 0 ? 2.0 : 1.0;

    // 혼잡도 점수 계산
    const visitorScore = avgVisitors > 0 ? Math.min(stat.totalVisitors / avgVisitors, 2) / 2 : 0;
    const dwellScore = avgDwell > 0 ? Math.min(stat.avgDwellSeconds / avgDwell, 3) / 3 : 0;
    const flowScore = Math.min(Math.max(flowRatio - 1, 0), 1);

    const congestionScore = (visitorScore * 0.3 + dwellScore * 0.4 + flowScore * 0.3);

    // 병목 여부 판단
    let severity: BottleneckZone['severity'] | null = null;

    if (congestionScore >= BOTTLENECK_THRESHOLDS.critical.congestionScore ||
        flowRatio >= BOTTLENECK_THRESHOLDS.critical.flowRatio) {
      severity = 'critical';
    } else if (congestionScore >= BOTTLENECK_THRESHOLDS.high.congestionScore ||
               flowRatio >= BOTTLENECK_THRESHOLDS.high.flowRatio) {
      severity = 'high';
    } else if (congestionScore >= BOTTLENECK_THRESHOLDS.medium.congestionScore ||
               flowRatio >= BOTTLENECK_THRESHOLDS.medium.flowRatio) {
      severity = 'medium';
    }

    if (severity) {
      const recommendation = generateBottleneckRecommendation(stat, congestionScore, flowRatio, severity);

      bottlenecks.push({
        zoneId: stat.zoneId,
        zoneName: stat.zoneName,
        congestionScore,
        avgWaitTime: stat.avgDwellSeconds,
        peakHours: stat.peakHour ? [stat.peakHour] : [],
        inboundFlow: totalInbound,
        outboundFlow: totalOutbound,
        flowRatio,
        severity,
        recommendation,
      });
    }
  }

  // 심각도 순 정렬
  bottlenecks.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return bottlenecks;
}

/**
 * 데드존 식별
 */
export function identifyDeadZones(
  zoneStats: ZoneFlowStats[],
  transitionMatrix: TransitionMatrix
): DeadZone[] {
  const deadZones: DeadZone[] = [];

  // 전체 방문자 수 및 평균 계산
  const totalAllVisitors = zoneStats.reduce((sum, z) => sum + z.totalVisitors, 0);
  const avgVisitors = totalAllVisitors / Math.max(zoneStats.length, 1);

  const { zones: zoneIds, matrix } = transitionMatrix;
  const zoneIndexMap = new Map<string, number>();
  zoneIds.forEach((id, idx) => zoneIndexMap.set(id, idx));

  for (const stat of zoneStats) {
    // 방문율 계산
    const visitRate = totalAllVisitors > 0 ? stat.totalVisitors / totalAllVisitors : 0;

    // 접근성 계산 (다른 존에서 이 존으로의 전이 확률 합)
    const zoneIdx = zoneIndexMap.get(stat.zoneId);
    let reachability = 0;
    const connectedZones: string[] = [];

    if (zoneIdx !== undefined) {
      for (let i = 0; i < zoneIds.length; i++) {
        if (i !== zoneIdx && matrix[i][zoneIdx] > 0) {
          reachability += matrix[i][zoneIdx];
          connectedZones.push(zoneIds[i]);
        }
      }
    }

    // 정규화
    reachability = Math.min(reachability, 1);

    // 잠재 가치 계산
    const zoneWeight = ZONE_TYPE_WEIGHTS[stat.zoneType.toLowerCase()] || ZONE_TYPE_WEIGHTS.default;
    const potentialValue = zoneWeight * (1 - visitRate) * 100;

    // 데드존 여부 판단
    let severity: DeadZone['severity'] | null = null;

    if (visitRate <= DEADZONE_THRESHOLDS.critical.visitRate &&
        reachability <= DEADZONE_THRESHOLDS.critical.reachability) {
      severity = 'critical';
    } else if (visitRate <= DEADZONE_THRESHOLDS.high.visitRate &&
               reachability <= DEADZONE_THRESHOLDS.high.reachability) {
      severity = 'high';
    } else if (visitRate <= DEADZONE_THRESHOLDS.medium.visitRate &&
               reachability <= DEADZONE_THRESHOLDS.medium.reachability) {
      severity = 'medium';
    } else if (visitRate <= DEADZONE_THRESHOLDS.low.visitRate) {
      severity = 'low';
    }

    if (severity) {
      const recommendation = generateDeadZoneRecommendation(stat, visitRate, reachability, severity);

      deadZones.push({
        zoneId: stat.zoneId,
        zoneName: stat.zoneName,
        visitRate,
        avgVisitors: stat.totalVisitors,
        avgDwellTime: stat.avgDwellSeconds,
        reachability,
        connectedZones,
        potentialValue,
        severity,
        recommendation,
      });
    }
  }

  // 심각도 순 정렬
  deadZones.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return deadZones;
}

/**
 * 동선 최적화 기회 식별
 */
export function identifyFlowOpportunities(
  transitionMatrix: TransitionMatrix,
  keyPaths: CustomerPath[],
  bottlenecks: BottleneckZone[],
  deadZones: DeadZone[],
  zoneStats: ZoneFlowStats[]
): FlowOpportunity[] {
  const opportunities: FlowOpportunity[] = [];
  let oppId = 1;

  // 1. 병목 해소 기회
  for (const bottleneck of bottlenecks) {
    if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
      opportunities.push({
        opportunityId: `opp_${oppId++}`,
        type: 'decongest',
        priority: bottleneck.severity === 'critical' ? 'critical' : 'high',
        sourceZones: [bottleneck.zoneId],
        targetZones: [],
        currentState: `${bottleneck.zoneName} 구역 혼잡도 ${(bottleneck.congestionScore * 100).toFixed(0)}%`,
        expectedImprovement: bottleneck.severity === 'critical' ? 25 : 15,
        implementationDifficulty: 'medium',
        description: `${bottleneck.zoneName} 구역의 혼잡을 완화하여 고객 경험 개선`,
        actionItems: [
          '인접 존으로 일부 상품/기능 분산',
          '동선 유도 사이니지 설치',
          '피크 시간대 스태프 추가 배치',
        ],
      });
    }
  }

  // 2. 데드존 활성화 기회
  for (const deadZone of deadZones) {
    if (deadZone.severity === 'critical' || deadZone.severity === 'high') {
      const nearbyZones = deadZone.connectedZones.slice(0, 3);

      opportunities.push({
        opportunityId: `opp_${oppId++}`,
        type: 'attract',
        priority: deadZone.severity === 'critical' ? 'high' : 'medium',
        sourceZones: nearbyZones,
        targetZones: [deadZone.zoneId],
        currentState: `${deadZone.zoneName} 방문율 ${(deadZone.visitRate * 100).toFixed(1)}%`,
        expectedImprovement: deadZone.potentialValue * 0.3,
        implementationDifficulty: deadZone.reachability < 0.3 ? 'hard' : 'medium',
        description: `${deadZone.zoneName} 구역으로 고객 유입 증가`,
        actionItems: [
          '시선을 끄는 VMD 요소 배치',
          '인기 상품 일부 이동 배치',
          '프로모션/이벤트 존 활용',
        ],
      });
    }
  }

  // 3. 경로 최적화 기회
  const lowConversionPaths = keyPaths.filter(p =>
    p.pathType === 'entry_to_exit' && p.frequency > 10
  );

  for (const path of lowConversionPaths.slice(0, 3)) {
    const checkoutZones = zoneStats.filter(z =>
      z.zoneType.toLowerCase().includes('checkout') ||
      z.zoneName.toLowerCase().includes('계산')
    );

    if (checkoutZones.length > 0) {
      opportunities.push({
        opportunityId: `opp_${oppId++}`,
        type: 'redirect',
        priority: 'medium',
        sourceZones: path.zones,
        targetZones: checkoutZones.map(z => z.zoneId),
        currentState: `경로 [${path.zoneNames.join(' → ')}]의 전환율 0%`,
        expectedImprovement: 10,
        implementationDifficulty: 'easy',
        description: `비전환 경로를 계산대 방향으로 유도`,
        actionItems: [
          '경로 상에 계산대 방향 안내 설치',
          '마지막 존에 연계 상품 배치',
          '계산대 가시성 확보',
        ],
      });
    }
  }

  // 4. 연결성 개선 기회
  const { matrix, zones: zoneIds } = transitionMatrix;
  const zoneIndexMap = new Map<string, number>();
  zoneIds.forEach((id, idx) => zoneIndexMap.set(id, idx));

  // 연결이 약한 존 쌍 찾기
  for (const stat of zoneStats) {
    const zoneIdx = zoneIndexMap.get(stat.zoneId);
    if (zoneIdx === undefined) continue;

    const outbound = stat.outboundTransitions;
    const totalOutbound = Array.from(outbound.values()).reduce((a, b) => a + b, 0);

    // 유출이 특정 존에 집중된 경우
    for (const [targetId, count] of outbound) {
      const ratio = totalOutbound > 0 ? count / totalOutbound : 0;
      if (ratio > 0.7 && totalOutbound > 50) {
        const targetStat = zoneStats.find(z => z.zoneId === targetId);
        const targetName = targetStat?.zoneName || targetId;

        // 다른 존과의 연결 기회 제안
        const alternativeZones = zoneStats
          .filter(z => z.zoneId !== stat.zoneId && z.zoneId !== targetId)
          .slice(0, 2);

        if (alternativeZones.length > 0 && opportunities.length < 10) {
          opportunities.push({
            opportunityId: `opp_${oppId++}`,
            type: 'connect',
            priority: 'low',
            sourceZones: [stat.zoneId],
            targetZones: alternativeZones.map(z => z.zoneId),
            currentState: `${stat.zoneName}에서 ${targetName}으로의 이동 집중 (${(ratio * 100).toFixed(0)}%)`,
            expectedImprovement: 8,
            implementationDifficulty: 'medium',
            description: `${stat.zoneName}에서 다른 구역으로의 분산 유도`,
            actionItems: [
              '대안 경로 시각적 안내 강화',
              '연결 존에 관심 상품 배치',
            ],
          });
        }
      }
    }
  }

  // 우선순위 순 정렬
  opportunities.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return opportunities.slice(0, 10);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 병목 구간 권고사항 생성
 */
function generateBottleneckRecommendation(
  stat: ZoneFlowStats,
  congestionScore: number,
  flowRatio: number,
  severity: BottleneckZone['severity']
): string {
  const recommendations: string[] = [];

  if (flowRatio > 1.5) {
    recommendations.push('유출 경로를 다양화하여 정체 해소 필요');
  }

  if (stat.avgDwellSeconds > 180) {
    recommendations.push('체류 시간이 길어 회전율 개선 필요');
  }

  if (stat.peakOccupancy > 0.8) {
    recommendations.push(`피크 시간(${stat.peakHour}시) 혼잡 관리 필요`);
  }

  if (congestionScore > 0.7) {
    recommendations.push('구역 확장 또는 기능 분산 검토');
  }

  return recommendations.length > 0
    ? recommendations.join('. ')
    : '일반적인 혼잡 관리 조치 권장';
}

/**
 * 데드존 권고사항 생성
 */
function generateDeadZoneRecommendation(
  stat: ZoneFlowStats,
  visitRate: number,
  reachability: number,
  severity: DeadZone['severity']
): string {
  const recommendations: string[] = [];

  if (reachability < 0.3) {
    recommendations.push('접근성 개선을 위한 동선 재설계 필요');
  }

  if (visitRate < 0.1) {
    recommendations.push('주요 동선에서 시인성 확보 필요');
  }

  if (stat.avgDwellSeconds < 30) {
    recommendations.push('체류 유도를 위한 매력 요소 추가');
  }

  if (stat.conversionRate < 0.05) {
    recommendations.push('전환 유도를 위한 프로모션 배치 검토');
  }

  return recommendations.length > 0
    ? recommendations.join('. ')
    : '구역 활성화를 위한 VMD 개선 권장';
}

/**
 * 요약 메트릭 계산
 */
function calculateSummary(
  zones: ZoneDimRow[],
  transitionMatrix: TransitionMatrix,
  keyPaths: CustomerPath[],
  bottlenecks: BottleneckZone[],
  deadZones: DeadZone[],
  opportunities: FlowOpportunity[],
  zoneStats: ZoneFlowStats[]
): FlowAnalysisResult['summary'] {
  // 평균 경로 길이
  const avgPathLength = keyPaths.length > 0
    ? keyPaths.reduce((sum, p) => sum + p.zones.length, 0) / keyPaths.length
    : 0;

  // 평균 경로 소요시간
  const avgPathDuration = keyPaths.length > 0
    ? keyPaths.reduce((sum, p) => sum + p.totalDuration, 0) / keyPaths.length
    : 0;

  // 전체 전환율
  const checkoutPaths = keyPaths.filter(p => p.pathType === 'entry_to_checkout');
  const overallConversionRate = keyPaths.length > 0
    ? checkoutPaths.length / keyPaths.length
    : 0;

  // 동선 건강도 점수 계산 (0~100)
  let flowHealthScore = 100;

  // 병목 감점
  for (const b of bottlenecks) {
    switch (b.severity) {
      case 'critical': flowHealthScore -= 15; break;
      case 'high': flowHealthScore -= 10; break;
      case 'medium': flowHealthScore -= 5; break;
      case 'low': flowHealthScore -= 2; break;
    }
  }

  // 데드존 감점
  for (const d of deadZones) {
    switch (d.severity) {
      case 'critical': flowHealthScore -= 10; break;
      case 'high': flowHealthScore -= 7; break;
      case 'medium': flowHealthScore -= 4; break;
      case 'low': flowHealthScore -= 2; break;
    }
  }

  // 전환율 보너스/감점
  flowHealthScore += (overallConversionRate - 0.3) * 20;

  // 범위 제한
  flowHealthScore = Math.max(0, Math.min(100, flowHealthScore));

  return {
    totalZones: zones.length,
    totalTransitions: transitionMatrix.totalTransitions,
    avgPathLength,
    avgPathDuration,
    overallConversionRate,
    bottleneckCount: bottlenecks.length,
    deadZoneCount: deadZones.length,
    opportunityCount: opportunities.length,
    flowHealthScore: Math.round(flowHealthScore),
  };
}

/**
 * AI 프롬프트 컨텍스트 생성
 */
function buildAIPromptContext(
  transitionMatrix: TransitionMatrix,
  keyPaths: CustomerPath[],
  bottlenecks: BottleneckZone[],
  deadZones: DeadZone[],
  opportunities: FlowOpportunity[],
  summary: FlowAnalysisResult['summary']
): string {
  const lines: string[] = [];

  lines.push('=== 고객 동선 분석 ===');
  lines.push('');

  // 요약
  lines.push('## 동선 요약');
  lines.push(`- 분석 존 수: ${summary.totalZones}개`);
  lines.push(`- 총 전이 횟수: ${summary.totalTransitions.toLocaleString()}회`);
  lines.push(`- 평균 경로 길이: ${summary.avgPathLength.toFixed(1)}개 존`);
  lines.push(`- 평균 경로 소요시간: ${Math.round(summary.avgPathDuration)}초`);
  lines.push(`- 전체 전환율: ${(summary.overallConversionRate * 100).toFixed(1)}%`);
  lines.push(`- 동선 건강도: ${summary.flowHealthScore}/100점`);
  lines.push('');

  // 주요 경로
  if (keyPaths.length > 0) {
    lines.push('## 주요 고객 경로 (상위 5개)');
    for (const path of keyPaths.slice(0, 5)) {
      lines.push(`- [${path.pathType}] ${path.zoneNames.join(' → ')} (빈도: ${path.frequency}, 확률: ${(path.probability * 100).toFixed(1)}%)`);
    }
    lines.push('');
  }

  // 전이 확률 (상위 연결)
  lines.push('## 주요 존 간 전이 확률');
  const { zones, zoneNames, matrix } = transitionMatrix;
  const topTransitions: Array<{ from: string; to: string; prob: number }> = [];

  for (let i = 0; i < zones.length; i++) {
    for (let j = 0; j < zones.length; j++) {
      if (matrix[i][j] >= 0.1) {
        topTransitions.push({
          from: zoneNames.get(zones[i]) || zones[i],
          to: zoneNames.get(zones[j]) || zones[j],
          prob: matrix[i][j],
        });
      }
    }
  }

  topTransitions.sort((a, b) => b.prob - a.prob);
  for (const t of topTransitions.slice(0, 10)) {
    lines.push(`- ${t.from} → ${t.to}: ${(t.prob * 100).toFixed(0)}%`);
  }
  lines.push('');

  // 병목 구간
  if (bottlenecks.length > 0) {
    lines.push('## 병목 구간');
    for (const b of bottlenecks) {
      lines.push(`- [${b.severity.toUpperCase()}] ${b.zoneName}: 혼잡도 ${(b.congestionScore * 100).toFixed(0)}%, 유입/유출 비율 ${b.flowRatio.toFixed(2)}`);
      lines.push(`  권고: ${b.recommendation}`);
    }
    lines.push('');
  }

  // 데드존
  if (deadZones.length > 0) {
    lines.push('## 데드존 (저유동 구역)');
    for (const d of deadZones) {
      lines.push(`- [${d.severity.toUpperCase()}] ${d.zoneName}: 방문율 ${(d.visitRate * 100).toFixed(1)}%, 접근성 ${(d.reachability * 100).toFixed(0)}%`);
      lines.push(`  권고: ${d.recommendation}`);
    }
    lines.push('');
  }

  // 최적화 기회
  if (opportunities.length > 0) {
    lines.push('## 동선 최적화 기회');
    for (const opp of opportunities.slice(0, 5)) {
      lines.push(`- [${opp.priority.toUpperCase()}/${opp.type}] ${opp.description}`);
      lines.push(`  현재 상태: ${opp.currentState}`);
      lines.push(`  예상 개선: ${opp.expectedImprovement.toFixed(0)}%`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 빈 결과 생성 (데이터 없을 때)
 */
function createEmptyResult(
  storeId: string,
  analysisDate: string,
  analysisDays: number
): FlowAnalysisResult {
  return {
    storeId,
    analysisDate,
    analysisPeriodDays: analysisDays,
    transitionMatrix: {
      zones: [],
      zoneNames: new Map(),
      matrix: [],
      transitionCounts: [],
      avgDurations: [],
      totalTransitions: 0,
      analysisStartDate: '',
      analysisEndDate: '',
    },
    keyPaths: [],
    bottlenecks: [],
    deadZones: [],
    zoneStats: [],
    opportunities: [],
    summary: {
      totalZones: 0,
      totalTransitions: 0,
      avgPathLength: 0,
      avgPathDuration: 0,
      overallConversionRate: 0,
      bottleneckCount: 0,
      deadZoneCount: 0,
      opportunityCount: 0,
      flowHealthScore: 0,
    },
    aiPromptContext: '=== 고객 동선 분석 ===\n\n분석할 존 데이터가 없습니다.',
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * 전이 확률 행렬을 2D 배열로 변환 (시각화용)
 */
export function matrixToArray(tm: TransitionMatrix): {
  labels: string[];
  data: number[][];
} {
  const labels = tm.zones.map(id => tm.zoneNames.get(id) || id);
  return { labels, data: tm.matrix };
}

/**
 * 특정 존에서 다음 존 예측
 */
export function predictNextZone(
  tm: TransitionMatrix,
  currentZoneId: string,
  topN: number = 3
): Array<{ zoneId: string; zoneName: string; probability: number }> {
  const zoneIdx = tm.zones.indexOf(currentZoneId);
  if (zoneIdx === -1) return [];

  const transitions = tm.zones.map((zoneId, idx) => ({
    zoneId,
    zoneName: tm.zoneNames.get(zoneId) || zoneId,
    probability: tm.matrix[zoneIdx][idx],
  }));

  return transitions
    .filter(t => t.probability > 0)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topN);
}

/**
 * 경로 확률 계산
 */
export function calculatePathProbability(
  tm: TransitionMatrix,
  path: string[]
): number {
  if (path.length < 2) return 1.0;

  let probability = 1.0;

  for (let i = 0; i < path.length - 1; i++) {
    const fromIdx = tm.zones.indexOf(path[i]);
    const toIdx = tm.zones.indexOf(path[i + 1]);

    if (fromIdx === -1 || toIdx === -1) return 0;

    probability *= tm.matrix[fromIdx][toIdx];
  }

  return probability;
}
