/**
 * useFlowSimulation.ts
 *
 * 동선 최적화 시뮬레이션 훅
 * - 고객 동선 패턴 분석 및 최적화
 * - 병목 지점 식별 및 해결책 제안
 * - 3D 시각화용 동선 데이터 제공
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/components/ui/use-toast';
import { buildStoreContext } from '../utils/store-context-builder';
import type {
  SimulationStatus,
  ConfidenceDetails,
  Bottleneck,
  SimulatedPath,
} from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

export interface FlowSimulationParams {
  duration: '30min' | '1hour' | '2hour' | '4hour';
  customerCount: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all';
  customerSegment?: 'all' | 'new' | 'returning' | 'vip';
  analysisType?: 'current' | 'optimized' | 'comparison';
}

export interface FlowPoint {
  x: number;
  y: number;
  z: number;
  t: number; // 시간 (초)
  speed?: number;
  dwell?: boolean;
}

export interface FlowPath {
  id: string;
  customerId: string;
  customerType: string;
  points: FlowPoint[];
  totalTime: number; // 초
  totalDistance: number; // 미터
  dwellZones: Array<{
    zoneId: string;
    zoneName: string;
    duration: number;
  }>;
  purchaseIntent: number; // 0-1
  converted: boolean;
}

export interface FlowBottleneck extends Bottleneck {
  id: string;
  zoneName: string;
  cause: string;
  suggestions: string[];
  impactLevel: 'high' | 'medium' | 'low';
  affectedCustomers: number;
}

export interface FlowOptimization {
  id: string;
  type: 'layout_change' | 'signage' | 'staff_position' | 'zone_resize';
  description: string;
  location: { x: number; y: number; z: number };
  expectedImprovement: number; // 퍼센트
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface FlowSimulationResult {
  id: string;
  status: SimulationStatus;
  timestamp: string;
  params: FlowSimulationParams;

  // 요약 메트릭
  summary: {
    totalCustomers: number;
    avgTravelTime: number; // 초
    avgTravelDistance: number; // 미터
    avgDwellTime: number; // 초
    conversionRate: number;
    bottleneckCount: number;
  };

  // 현재 vs 최적화 비교
  comparison: {
    currentPathLength: number;
    optimizedPathLength: number;
    pathLengthReduction: number;
    currentAvgTime: number;
    optimizedAvgTime: number;
    timeReduction: number;
    congestionReduction: number;
  };

  // 상세 데이터
  paths: FlowPath[];
  bottlenecks: FlowBottleneck[];
  optimizations: FlowOptimization[];

  // 존별 분석
  zoneAnalysis: Array<{
    zoneId: string;
    zoneName: string;
    visitCount: number;
    avgDwellTime: number;
    congestionLevel: number;
    conversionContribution: number;
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];

  // 3D 시각화 데이터
  visualization: {
    animatedPaths: Array<{
      id: string;
      points: FlowPoint[];
      color: string;
      type: 'current' | 'optimized';
    }>;
    bottleneckMarkers: Array<{
      position: { x: number; y: number; z: number };
      severity: number;
      radius: number;
    }>;
    flowHeatmap: Array<{
      x: number;
      z: number;
      density: number;
    }>;
    zoneFlowArrows: Array<{
      from: { x: number; y: number; z: number };
      to: { x: number; y: number; z: number };
      volume: number;
    }>;
  };
}

export interface UseFlowSimulationReturn {
  // 상태
  isSimulating: boolean;
  result: FlowSimulationResult | null;
  error: Error | null;
  progress: number;

  // 액션
  runSimulation: (params: FlowSimulationParams) => Promise<FlowSimulationResult>;
  applyOptimizations: (optimizationIds: string[]) => Promise<void>;
  resetResult: () => void;

  // 3D 시각화 데이터
  getVisualizationData: () => FlowSimulationResult['visualization'] | null;
  getAnimatedPaths: () => FlowPath[];

  // 히스토리
  history: FlowSimulationResult[];
  loadHistory: () => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useFlowSimulation(): UseFlowSimulationReturn {
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  const [result, setResult] = useState<FlowSimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<FlowSimulationResult[]>([]);

  // 시뮬레이션 히스토리 조회
  const { refetch: fetchHistory } = useQuery<any[], Error, any[], string[]>({
    queryKey: ['flow-simulation-history', selectedStore?.id || ''],
    queryFn: async () => {
      if (!selectedStore?.id) return [] as any[];

      const { data } = await supabase
        .from('ai_inference_results')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('inference_type', 'flow_simulation')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []) as any[];
    },
    enabled: false,
  });

  // 시뮬레이션 실행 mutation
  const simulationMutation = useMutation({
    mutationFn: async (params: FlowSimulationParams): Promise<FlowSimulationResult> => {
      if (!selectedStore?.id || !orgId) {
        throw new Error('매장 또는 조직 정보가 없습니다.');
      }

      setProgress(10);

      // 실제 매장 데이터 기반 storeContext 빌드
      console.log('[useFlowSimulation] Building store context for:', selectedStore.id);
      const storeContext = await buildStoreContext(selectedStore.id);
      console.log('[useFlowSimulation] Store context built:', {
        visits: storeContext.visits?.length,
        zones: storeContext.zones?.length,
        zoneMetrics: storeContext.zoneMetrics?.length,
        zoneTransitions: storeContext.zoneTransitions?.length,
        entrancePosition: storeContext.storeInfo.entrancePosition,
      });

      setProgress(30);

      // advanced-ai-inference Edge Function 호출 (storeContext 포함)
      const { data, error } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          type: 'flow_simulation',
          storeId: selectedStore.id,
          orgId,
          params: {
            duration: params.duration,
            customerCount: params.customerCount,
            timeOfDay: params.timeOfDay || 'all',
            customerSegment: params.customerSegment || 'all',
            analysisType: params.analysisType || 'comparison',
            storeContext, // 실제 매장 데이터 전달
          },
        },
      });

      setProgress(70);

      if (error) throw error;
      if (!data?.result) throw new Error('시뮬레이션 결과를 받지 못했습니다.');

      // 결과 변환 - 입구 위치, 실제 zone_transitions 데이터 전달
      const simulationResult = transformFlowResult(
        data.result,
        params,
        storeContext.storeInfo.entrancePosition,
        storeContext.zoneTransitions,
        storeContext.zones
      );

      setProgress(100);

      return simulationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: '동선 시뮬레이션 완료',
        description: `병목 지점 ${data.bottlenecks.length}개 발견, 이동 시간 ${data.comparison.timeReduction.toFixed(0)}% 단축 가능`,
      });
    },
    onError: (error) => {
      console.error('Flow simulation failed:', error);
      toast({
        title: '시뮬레이션 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  // 최적화 적용 mutation
  const applyMutation = useMutation({
    mutationFn: async (optimizationIds: string[]) => {
      if (!result || !selectedStore?.id) {
        throw new Error('적용할 결과가 없습니다.');
      }

      const selectedOptimizations = result.optimizations.filter(
        (opt) => optimizationIds.includes(opt.id)
      );

      // 적용 이력 저장
      await supabase.from('applied_strategies').insert([{
        org_id: orgId,
        store_id: selectedStore.id,
        name: 'Flow Optimization',
        source: 'ai_simulation',
        source_module: 'flow',
        expected_roi: selectedOptimizations.reduce(
          (sum, opt) => sum + opt.expectedImprovement,
          0
        ) / selectedOptimizations.length,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          result,
          appliedOptimizations: selectedOptimizations,
        } as any,
      }]);

      // 최적화 작업 생성
      for (const opt of selectedOptimizations) {
        await supabase.from('optimization_tasks').insert({
          org_id: orgId,
          store_id: selectedStore.id,
          task_type: opt.type,
          description: opt.description,
          location: opt.location,
          priority: opt.priority,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: '동선 최적화 적용됨',
        description: '작업 목록에서 상세 내용을 확인하세요.',
      });
    },
    onError: (error) => {
      console.error('Apply optimizations failed:', error);
      toast({
        title: '최적화 적용 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });

  // 시뮬레이션 실행
  const runSimulation = useCallback(async (params: FlowSimulationParams) => {
    return simulationMutation.mutateAsync(params);
  }, [simulationMutation]);

  // 최적화 적용
  const applyOptimizations = useCallback(async (optimizationIds: string[]) => {
    await applyMutation.mutateAsync(optimizationIds);
  }, [applyMutation]);

  // 결과 초기화
  const resetResult = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  // 시각화 데이터 가져오기
  const getVisualizationData = useCallback(() => {
    return result?.visualization || null;
  }, [result]);

  // 애니메이션 경로 가져오기
  const getAnimatedPaths = useCallback(() => {
    return result?.paths || [];
  }, [result]);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    const { data } = await fetchHistory();
    if (data) {
      setHistory(data.map(transformHistoryItem));
    }
  }, [fetchHistory]);

  return {
    isSimulating: simulationMutation.isPending,
    result,
    error: simulationMutation.error as Error | null,
    progress,

    runSimulation,
    applyOptimizations,
    resetResult,

    getVisualizationData,
    getAnimatedPaths,

    history,
    loadHistory,
  };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

interface ZoneTransitionData {
  fromZoneId: string;
  fromZoneName?: string;
  toZoneId: string;
  toZoneName?: string;
  transitionCount: number;
  avgDurationSeconds: number;
}

interface ZoneData {
  id: string;
  zoneName: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

function transformFlowResult(
  rawResult: any,
  params: FlowSimulationParams,
  entrancePosition?: { x: number; z: number } | null,
  zoneTransitions?: ZoneTransitionData[],
  zones?: ZoneData[]
): FlowSimulationResult {
  // 입구 위치 (storeContext에서 전달됨, 없으면 기본값)
  const entrance = entrancePosition || { x: 0, z: -8 };

  // 동선 경로 변환 - 입구에서 시작하도록 조정
  const paths: FlowPath[] = (rawResult.paths || []).map((path: any, idx: number) => {
    // 경로 포인트 변환
    let transformedPoints = (path.points || []).map((p: any) => ({
      x: p.x || 0,
      y: p.y || 0.5,
      z: p.z || p.y || 0,
      t: p.t || 0,
      speed: p.speed,
      dwell: p.dwell,
    }));

    // 🔧 FIX: 경로가 있으면 첫 번째 점을 입구 근처로 조정
    if (transformedPoints.length > 0) {
      // 첫 번째 점을 입구 위치 근처로 설정 (약간의 랜덤 오프셋 추가)
      const randomOffset = (Math.random() - 0.5) * 2; // -1 ~ 1
      transformedPoints[0] = {
        ...transformedPoints[0],
        x: entrance.x + randomOffset,
        z: entrance.z + Math.random() * 0.5, // 입구 약간 안쪽
      };
    }

    return {
      id: path.id || `path-${idx}`,
      customerId: path.customerId || `customer-${idx}`,
      customerType: path.customerType || 'standard',
      points: transformedPoints,
      totalTime: path.totalTime || 300,
      totalDistance: path.totalDistance || 45,
      dwellZones: path.dwellZones || [],
      purchaseIntent: path.purchaseIntent || Math.random(),
      converted: path.converted ?? Math.random() > 0.6,
    };
  });

  // 병목 지점 변환
  const bottlenecks: FlowBottleneck[] = (rawResult.bottlenecks || []).map(
    (bn: any, idx: number) => ({
      id: bn.id || `bottleneck-${idx}`,
      position: bn.position || { x: 0, y: 0, z: 0 },
      zoneName: bn.zoneName || bn.location || `구역 ${idx + 1}`,
      severity: bn.severity || bn.congestion / 100 || 0.7,
      avgWaitTime: bn.avgWaitTime || 30,
      frequency: bn.frequency || 0.5,
      cause: bn.cause || '통로 폭 부족',
      suggestions: bn.suggestions || bn.suggestion ? [bn.suggestion] : ['레이아웃 조정 필요'],
      impactLevel: bn.impactLevel || getImpactLevel(bn.severity || 0.7),
      affectedCustomers: bn.affectedCustomers || Math.floor((bn.severity || 0.7) * 50),
    })
  );

  // 최적화 제안 생성
  const optimizations: FlowOptimization[] = bottlenecks.map((bn, idx) => ({
    id: `opt-${idx}`,
    type: 'layout_change',
    description: bn.suggestions[0] || '레이아웃 조정',
    location: bn.position,
    expectedImprovement: (1 - bn.severity) * 30 + 10,
    effort: bn.impactLevel === 'high' ? 'high' : bn.impactLevel === 'medium' ? 'medium' : 'low',
    priority: idx + 1,
  }));

  // 존 분석 데이터 생성
  const zoneAnalysis = (rawResult.zoneAnalysis || generateZoneAnalysis(paths));

  // 신뢰도 정보
  const confidence: ConfidenceDetails = {
    overall: rawResult.confidence || 0.78,
    factors: {
      dataQuality: rawResult.confidenceFactors?.dataQuality || 0.82,
      modelAccuracy: rawResult.confidenceFactors?.modelAccuracy || 0.76,
      sampleSize: rawResult.confidenceFactors?.sampleSize || 0.75,
      variability: rawResult.confidenceFactors?.variability || 0.8,
    },
  };

  // 시각화 데이터 생성 - 실제 zone_transitions 데이터 활용
  const visualization = generateFlowVisualization(paths, bottlenecks, zoneTransitions, zones);

  // 비교 데이터
  const currentPathLength = rawResult.currentPathLength ||
    paths.reduce((sum, p) => sum + p.totalDistance, 0) / paths.length;
  const optimizedPathLength = rawResult.optimizedPathLength || currentPathLength * 0.85;

  const currentAvgTime = rawResult.currentAvgTime ||
    paths.reduce((sum, p) => sum + p.totalTime, 0) / paths.length;
  const optimizedAvgTime = rawResult.optimizedAvgTime || currentAvgTime * 0.82;

  return {
    id: rawResult.id || `flow-sim-${Date.now()}`,
    status: 'completed',
    timestamp: new Date().toISOString(),
    params,

    summary: {
      totalCustomers: params.customerCount,
      avgTravelTime: currentAvgTime,
      avgTravelDistance: currentPathLength,
      avgDwellTime: paths.reduce((sum, p) =>
        sum + p.dwellZones.reduce((s, z) => s + z.duration, 0), 0
      ) / paths.length || 120,
      conversionRate: paths.filter(p => p.converted).length / paths.length || 0.35,
      bottleneckCount: bottlenecks.length,
    },

    comparison: {
      currentPathLength,
      optimizedPathLength,
      pathLengthReduction: ((currentPathLength - optimizedPathLength) / currentPathLength) * 100,
      currentAvgTime,
      optimizedAvgTime,
      timeReduction: ((currentAvgTime - optimizedAvgTime) / currentAvgTime) * 100,
      congestionReduction: bottlenecks.length > 0
        ? bottlenecks.reduce((sum, bn) => sum + (1 - bn.severity), 0) / bottlenecks.length * 100
        : 0,
    },

    paths,
    bottlenecks,
    optimizations,
    zoneAnalysis,
    confidence,

    insights: rawResult.insights || generateFlowInsights(bottlenecks, paths),

    visualization,
  };
}

function getImpactLevel(severity: number): 'high' | 'medium' | 'low' {
  if (severity >= 0.7) return 'high';
  if (severity >= 0.4) return 'medium';
  return 'low';
}

function generateZoneAnalysis(paths: FlowPath[]): FlowSimulationResult['zoneAnalysis'] {
  // 실제 경로에서 방문한 존 정보 추출 (dwellZones에서)
  const zoneVisits: Record<string, { count: number; dwellSum: number }> = {};

  paths.forEach((path) => {
    if (path.dwellZones && path.dwellZones.length > 0) {
      path.dwellZones.forEach((dwell) => {
        const key = dwell.zoneId || dwell.zoneName;
        if (!zoneVisits[key]) {
          zoneVisits[key] = { count: 0, dwellSum: 0 };
        }
        zoneVisits[key].count += 1;
        zoneVisits[key].dwellSum += dwell.duration || 0;
      });
    }
  });

  // 실제 방문 데이터가 있으면 그것을 사용
  const zoneKeys = Object.keys(zoneVisits);
  if (zoneKeys.length > 0) {
    return zoneKeys.map((key, idx) => ({
      zoneId: key,
      zoneName: key,
      visitCount: zoneVisits[key].count,
      avgDwellTime: zoneVisits[key].count > 0
        ? zoneVisits[key].dwellSum / zoneVisits[key].count
        : 60,
      congestionLevel: Math.min(1, zoneVisits[key].count / paths.length),
      conversionContribution: zoneVisits[key].count / (paths.length * zoneKeys.length),
    }));
  }

  // 데이터가 없을 경우에만 기본값 사용 (실제 매장에서는 이 경우가 거의 없어야 함)
  console.warn('[useFlowSimulation] No zone data available, using defaults');
  const defaultZones = ['입구', '디스플레이 존', '상품 존', '계산대'];
  return defaultZones.map((zoneName, idx) => ({
    zoneId: `zone-${idx}`,
    zoneName,
    visitCount: Math.floor(paths.length * (0.3 + Math.random() * 0.7)),
    avgDwellTime: 30 + Math.random() * 120,
    congestionLevel: 0.2 + Math.random() * 0.6,
    conversionContribution: 0.1 + Math.random() * 0.3,
  }));
}

function generateFlowInsights(
  bottlenecks: FlowBottleneck[],
  paths: FlowPath[]
): string[] {
  const insights: string[] = [];

  if (bottlenecks.length > 0) {
    const worstBottleneck = bottlenecks.reduce((a, b) =>
      a.severity > b.severity ? a : b
    );
    insights.push(
      `가장 심각한 병목: ${worstBottleneck.zoneName} (심각도 ${(worstBottleneck.severity * 100).toFixed(0)}%)`
    );
  }

  const conversionRate = paths.filter(p => p.converted).length / paths.length;
  if (conversionRate < 0.3) {
    insights.push('전환율이 낮습니다. 고객 동선 최적화를 권장합니다.');
  }

  const avgDistance = paths.reduce((sum, p) => sum + p.totalDistance, 0) / paths.length;
  if (avgDistance > 50) {
    insights.push('평균 이동 거리가 깁니다. 주요 상품 배치 재검토를 권장합니다.');
  }

  return insights.length > 0 ? insights : ['동선 패턴이 양호합니다.'];
}

function generateFlowVisualization(
  paths: FlowPath[],
  bottlenecks: FlowBottleneck[],
  zoneTransitions?: ZoneTransitionData[],
  zones?: ZoneData[]
): FlowSimulationResult['visualization'] {
  // 애니메이션 경로
  const animatedPaths = paths.slice(0, 20).map((path) => ({
    id: path.id,
    points: path.points,
    color: path.converted ? '#22c55e' : '#ef4444',
    type: 'current' as const,
  }));

  // 병목 마커
  const bottleneckMarkers = bottlenecks.map((bn) => ({
    position: bn.position,
    severity: bn.severity,
    radius: 0.5 + bn.severity,
  }));

  // 동선 히트맵 - 실제 경로 데이터 기반
  const flowHeatmap: Array<{ x: number; z: number; density: number }> = [];

  // 경로 포인트에서 범위 계산
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  paths.forEach((path) => {
    path.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });
  });

  // 기본 범위 설정 (데이터가 없는 경우)
  if (!isFinite(minX)) {
    minX = -8; maxX = 8; minZ = -8; maxZ = 8;
  }

  // 약간의 패딩 추가
  const padding = 2;
  minX -= padding; maxX += padding; minZ -= padding; maxZ += padding;

  // 그리드 생성
  const step = Math.max(1, (maxX - minX) / 12);
  for (let x = minX; x <= maxX; x += step) {
    for (let z = minZ; z <= maxZ; z += step) {
      let density = 0;
      paths.forEach((path) => {
        path.points.forEach((point) => {
          const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.z - z, 2));
          if (dist < 2) {
            density += (2 - dist) / 2;
          }
        });
      });
      flowHeatmap.push({ x, z, density: Math.min(density / 10, 1) });
    }
  }

  // 존 간 이동 화살표 - 🔧 FIX: 실제 zone_transitions DB 데이터 우선 사용
  const zoneFlowArrows: Array<{
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
    volume: number;
  }> = [];

  // 존 ID -> 위치 맵 생성
  const zonePositionMap = new Map<string, { x: number; z: number }>();
  if (zones && zones.length > 0) {
    zones.forEach((zone) => {
      zonePositionMap.set(zone.id, { x: zone.x, z: zone.z });
    });
  }

  // 🔧 실제 zone_transitions 데이터가 있으면 사용
  if (zoneTransitions && zoneTransitions.length > 0 && zonePositionMap.size > 0) {
    console.log('[useFlowSimulation] Using real zone_transitions data:', zoneTransitions.length);

    // 최대 이동 횟수 계산
    const maxTransitionCount = Math.max(...zoneTransitions.map((t) => t.transitionCount), 1);

    // 상위 10개 이동 패턴을 화살표로 변환
    zoneTransitions
      .filter((t) => zonePositionMap.has(t.fromZoneId) && zonePositionMap.has(t.toZoneId))
      .slice(0, 10)
      .forEach((transition) => {
        const fromPos = zonePositionMap.get(transition.fromZoneId)!;
        const toPos = zonePositionMap.get(transition.toZoneId)!;

        zoneFlowArrows.push({
          from: { x: fromPos.x, y: 0.5, z: fromPos.z },
          to: { x: toPos.x, y: 0.5, z: toPos.z },
          volume: transition.transitionCount / maxTransitionCount,
        });
      });

    console.log('[useFlowSimulation] Generated', zoneFlowArrows.length, 'flow arrows from DB data');
  } else {
    // 🔧 FIX: zone_transitions 데이터가 없으면 flow arrows를 표시하지 않음
    // 이전에는 path-based mock 데이터를 생성했으나, 이는 실제 입구 위치와 무관한 잘못된 데이터였음
    console.log('[useFlowSimulation] No zone_transitions data available - skipping flow arrows (no mock data)');
    // zoneFlowArrows는 빈 배열로 유지
  }

  return {
    animatedPaths,
    bottleneckMarkers,
    flowHeatmap,
    zoneFlowArrows,
  };
}

function transformHistoryItem(item: any): FlowSimulationResult {
  return {
    id: item.id,
    status: item.status || 'completed',
    timestamp: item.created_at,
    params: item.parameters || { duration: '1hour', customerCount: 100 },
    summary: item.result?.summary || {
      totalCustomers: 0,
      avgTravelTime: 0,
      avgTravelDistance: 0,
      avgDwellTime: 0,
      conversionRate: 0,
      bottleneckCount: 0,
    },
    comparison: item.result?.comparison || {
      currentPathLength: 0,
      optimizedPathLength: 0,
      pathLengthReduction: 0,
      currentAvgTime: 0,
      optimizedAvgTime: 0,
      timeReduction: 0,
      congestionReduction: 0,
    },
    paths: item.result?.paths || [],
    bottlenecks: item.result?.bottlenecks || [],
    optimizations: item.result?.optimizations || [],
    zoneAnalysis: item.result?.zoneAnalysis || [],
    confidence: item.result?.confidence || {
      overall: 0.7,
      factors: { dataQuality: 0.7, modelAccuracy: 0.7, sampleSize: 0.7, variability: 0.7 },
    },
    insights: item.result?.insights || [],
    visualization: item.result?.visualization || {
      animatedPaths: [],
      bottleneckMarkers: [],
      flowHeatmap: [],
      zoneFlowArrows: [],
    },
  };
}

export default useFlowSimulation;
