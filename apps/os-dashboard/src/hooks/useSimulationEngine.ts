// src/hooks/useSimulationEngine.ts

/**
 * 실시간 시뮬레이션 엔진 훅
 *
 * - 고객 에이전트 생성 및 관리
 * - DB 기반 zone_transitions 확률적 존 전환
 * - 애니메이션 루프
 *
 * 🆕 통합: useCustomerFlowData를 사용하여 실제 DB 데이터 기반 시뮬레이션
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore, CustomerAgent, STATE_COLORS, CustomerState } from '@/stores/simulationStore';
import { useCustomerFlowData, FlowPath, ZoneInfo } from '@/features/studio/hooks/useCustomerFlowData';
import { getQualityConfig } from '@/utils/deviceCapability';

// ============================================
// 타입 정의
// ============================================

interface Zone {
  id: string;
  zone_name?: string;
  x?: number;
  z?: number;
  width?: number;
  depth?: number;
  zone_type?: string;
  coordinates?: {
    x?: number;
    z?: number;
    width?: number;
    depth?: number;
  };
}

interface UseSimulationEngineProps {
  storeId?: string;  // 🆕 storeId 추가 (DB 연동용)
  zones?: Zone[];    // 폴백용 (storeId 없을 때)
  enabled?: boolean;
}

// ============================================
// 유틸리티 함수
// ============================================

function generateId(): string {
  return `customer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getZonePosition(zone: Zone): { x: number; z: number; width: number; depth: number } {
  return {
    x: zone.x ?? zone.coordinates?.x ?? 0,
    z: zone.z ?? zone.coordinates?.z ?? 0,
    width: zone.width ?? zone.coordinates?.width ?? 2,
    depth: zone.depth ?? zone.coordinates?.depth ?? 2,
  };
}

function getRandomPositionInZone(zone: Zone): [number, number, number] {
  const { x, z, width, depth } = getZonePosition(zone);
  const rx = x + (Math.random() - 0.5) * width * 0.7;
  const rz = z + (Math.random() - 0.5) * depth * 0.7;
  return [rx, 0.5, rz];
}

// 🆕 ZoneInfo를 Zone으로 변환
function zoneInfoToZone(zoneInfo: ZoneInfo): Zone {
  return {
    id: zoneInfo.id,
    zone_name: zoneInfo.zone_name,
    zone_type: zoneInfo.zone_type,
    x: zoneInfo.center.x,
    z: zoneInfo.center.z,
    width: 3,  // 기본값
    depth: 3,
  };
}

function findZoneAtPosition(zones: Zone[], px: number, pz: number): Zone | null {
  return zones.find((zone) => {
    const { x, z, width, depth } = getZonePosition(zone);
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    return (
      px >= x - halfWidth &&
      px <= x + halfWidth &&
      pz >= z - halfDepth &&
      pz <= z + halfDepth
    );
  }) || null;
}

function isEntryZone(zone: Zone): boolean {
  const name = (zone.zone_name || '').toLowerCase();
  const type = (zone.zone_type || '').toLowerCase();
  return (
    type === 'entrance' ||
    type === 'entry' ||
    name.includes('입구') ||
    name.includes('entry') ||
    name.includes('entrance')
  );
}

function isExitZone(zone: Zone): boolean {
  const name = (zone.zone_name || '').toLowerCase();
  const type = (zone.zone_type || '').toLowerCase();
  return (
    type === 'exit' ||
    name.includes('출구') ||
    name.includes('exit') ||
    name.includes('checkout') ||
    name.includes('계산')
  );
}

// 🆕 transitionMatrix에서 확률 기반으로 다음 존 선택
function selectNextZoneByProbability(
  currentZoneId: string,
  transitionMatrix: Map<string, FlowPath[]>
): FlowPath | null {
  const possiblePaths = transitionMatrix.get(currentZoneId);
  if (!possiblePaths || possiblePaths.length === 0) return null;

  // 확률 기반 선택 (룰렛 휠)
  const random = Math.random();
  let cumulative = 0;

  for (const path of possiblePaths) {
    cumulative += path.transition_probability;
    if (random <= cumulative) {
      return path;
    }
  }

  // fallback: 첫 번째 경로
  return possiblePaths[0];
}

// ============================================
// 메인 훅
// ============================================

export function useSimulationEngine({
  storeId,
  zones: propZones = [],
  enabled = true
}: UseSimulationEngineProps) {
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // 🆕 DB에서 동선 데이터 로드
  const { data: flowData, isLoading: isLoadingFlowData } = useCustomerFlowData({
    storeId: storeId || '',
    enabled: enabled && !!storeId,
  });

  // 🆕 DB 데이터 또는 props 기반 zones 선택
  const dbZones: Zone[] = flowData?.zones?.map(zoneInfoToZone) || [];
  const zones = dbZones.length > 0 ? dbZones : propZones;

  // refs
  const zonesRef = useRef(zones);
  const configRef = useRef<typeof config | null>(null);
  const flowDataRef = useRef(flowData);

  const {
    isRunning,
    isPaused,
    customers,
    config,
    addCustomer,
    updateCustomer,
    removeCustomer,
    updateKPI,
    recordConversion,
    tick,
  } = useSimulationStore();

  // refs 업데이트
  zonesRef.current = zones;
  configRef.current = config;
  flowDataRef.current = flowData;

  // 🆕 DB 기반 입구 존 찾기
  const findEntryZone = useCallback((): Zone | null => {
    // DB에서 entranceZone이 있으면 우선 사용
    if (flowDataRef.current?.entranceZone) {
      return zoneInfoToZone(flowDataRef.current.entranceZone);
    }

    const currentZones = zonesRef.current;
    if (!currentZones || currentZones.length === 0) return null;

    // zone_type이 'entrance'인 존 찾기
    const byType = currentZones.find(z =>
      (z.zone_type || '').toLowerCase() === 'entrance' ||
      (z.zone_type || '').toLowerCase() === 'entry'
    );
    if (byType) return byType;

    // zone_name에 '입구' 포함된 존 찾기
    const byName = currentZones.find(z => {
      const name = (z.zone_name || '').toLowerCase();
      return name.includes('입구') || name.includes('entrance') || name.includes('entry');
    });
    if (byName) return byName;

    // 가장 낮은 z 좌표를 가진 존 (일반적으로 입구가 앞쪽에 위치)
    const sorted = [...currentZones].sort((a, b) => {
      const zA = a.z ?? a.coordinates?.z ?? 0;
      const zB = b.z ?? b.coordinates?.z ?? 0;
      return zA - zB;
    });

    return sorted[0] || null;
  }, []);

  // 🆕 DB 기반 출구 존 찾기 (입구 = 출구)
  const findExitZone = useCallback((): Zone | null => {
    // 출구는 입구와 동일 (출입구 개념)
    return findEntryZone();
  }, [findEntryZone]);

  const findBrowseZones = useCallback((): Zone[] => {
    const currentZones = zonesRef.current;
    if (!currentZones) return [];
    return currentZones.filter((z) => !isEntryZone(z) && !isExitZone(z));
  }, []);

  // 🆕 transitionMatrix에서 다음 존 선택 (확률 기반)
  const selectNextZone = useCallback((currentZoneId: string): Zone | null => {
    const currentFlowData = flowDataRef.current;

    // DB transitionMatrix가 있으면 확률 기반 선택
    if (currentFlowData?.transitionMatrix && currentFlowData.transitionMatrix.size > 0) {
      const nextPath = selectNextZoneByProbability(currentZoneId, currentFlowData.transitionMatrix);
      if (nextPath) {
        return zoneInfoToZone(nextPath.to_zone);
      }
    }

    // 폴백: 랜덤 선택
    const browseZones = findBrowseZones();
    if (browseZones.length > 0) {
      return browseZones[Math.floor(Math.random() * browseZones.length)];
    }

    return null;
  }, [findBrowseZones]);

  // 디버그 로깅
  useEffect(() => {
    const entryZone = findEntryZone();
    const exitZone = findExitZone();
    const browseZones = findBrowseZones();

    console.log('[useSimulationEngine] 🔄 Data updated:', {
      storeId,
      dbZonesCount: dbZones.length,
      propZonesCount: propZones.length,
      activeZonesCount: zones.length,
      hasTransitionMatrix: !!flowData?.transitionMatrix && flowData.transitionMatrix.size > 0,
      transitionPaths: flowData?.flowPaths?.length || 0,
      entryZone: entryZone?.zone_name,
      exitZone: exitZone?.zone_name,
      browseZones: browseZones.length,
      enabled,
      isRunning,
      isLoadingFlowData,
    });
  }, [zones, flowData, enabled, isRunning, isLoadingFlowData, storeId, dbZones.length, propZones.length, findEntryZone, findExitZone, findBrowseZones]);

  // 고객 수를 ref로 추적
  const customersRef = useRef(customers);
  customersRef.current = customers;

  // 새 고객 생성
  const spawnCustomer = useCallback(() => {
    const currentCustomerCount = customersRef.current.length;
    const currentConfig = configRef.current;
    const entryZone = findEntryZone();

    if (!entryZone) {
      console.log('[useSimulationEngine] No entry zone found, cannot spawn customer');
      return;
    }
    // 디바이스 품질에 따른 최대 고객 수 제한
    const deviceMaxCustomers = getQualityConfig().simulation.maxCustomers;
    const effectiveMax = Math.min(currentConfig?.maxCustomers || 30, deviceMaxCustomers);
    if (currentCustomerCount >= effectiveMax) {
      return;
    }

    const position = getRandomPositionInZone(entryZone);

    // 🆕 다음 존을 transitionMatrix 기반으로 선택
    const nextZone = selectNextZone(entryZone.id);
    const targetPosition = nextZone
      ? getRandomPositionInZone(nextZone)
      : getRandomPositionInZone(entryZone);

    const customer: CustomerAgent = {
      id: generateId(),
      position,
      targetPosition,
      targetZone: nextZone?.id || null,
      currentZone: entryZone.id,
      visitedZones: [entryZone.id],
      behavior: 'walking',
      state: 'entering',
      speed: 0.8 + Math.random() * 0.6,
      enteredAt: Date.now(),
      dwellTime: 0,
      purchaseProbability: currentConfig?.purchaseProbability || 0.164,
      color: STATE_COLORS.entering,
      path: [position],
    };

    console.log('[useSimulationEngine] 🚶 Spawning customer:', customer.id,
      'at', entryZone.zone_name || entryZone.id,
      '→', nextZone?.zone_name || 'same zone',
      `(pos: ${position[0].toFixed(1)}, ${position[2].toFixed(1)})`);
    addCustomer(customer);
  }, [findEntryZone, selectNextZone, addCustomer]);

  // 🆕 고객 상태 전환 (transitionMatrix 기반)
  const transitionCustomerState = useCallback((
    customer: CustomerAgent,
    currentZone: Zone | null
  ): { newState: CustomerState; newTarget: [number, number, number]; targetZoneId: string | null; shouldRemove: boolean } => {
    const exitZone = findExitZone();
    const currentConfig = configRef.current;
    const currentFlowData = flowDataRef.current;

    let newState: CustomerState = customer.state;
    let newTarget = customer.targetPosition;
    let targetZoneId: string | null = customer.targetZone;
    let shouldRemove = false;

    // 체류 시간에 따른 퇴장 확률 증가
    const dwellMinutes = customer.dwellTime / 60;
    const exitProbability = Math.min(0.3, dwellMinutes / 10); // 최대 30%

    switch (customer.state) {
      case 'entering':
        newState = 'browsing';
        // 🆕 transitionMatrix 기반으로 다음 존 선택
        if (currentZone) {
          const nextZone = selectNextZone(currentZone.id);
          if (nextZone) {
            newTarget = getRandomPositionInZone(nextZone);
            targetZoneId = nextZone.id;
          }
        }
        break;

      case 'browsing':
        // 🆕 확률 기반 상태 전환 (zone_transitions 확률 반영)
        const browseRoll = Math.random();

        if (browseRoll < 0.20) {
          // 20% 확률로 관심 상태
          newState = 'engaged';
        } else if (browseRoll < 0.20 + exitProbability) {
          // 체류 시간에 따른 퇴장 (입구로 복귀)
          newState = 'exiting';
          if (exitZone) {
            newTarget = getRandomPositionInZone(exitZone);
            targetZoneId = exitZone.id;
          }
        } else {
          // 🆕 다음 존으로 이동 (transitionMatrix 기반)
          if (currentZone) {
            const nextZone = selectNextZone(currentZone.id);
            if (nextZone) {
              newTarget = getRandomPositionInZone(nextZone);
              targetZoneId = nextZone.id;
            } else {
              // 다음 존이 없으면 퇴장
              newState = 'exiting';
              if (exitZone) {
                newTarget = getRandomPositionInZone(exitZone);
                targetZoneId = exitZone.id;
              }
            }
          }
        }
        break;

      case 'engaged':
        const engageRoll = Math.random();
        if (engageRoll < 0.30) {
          newState = 'fitting';
        } else if (engageRoll < 0.40) {
          newState = 'exiting';
          if (exitZone) {
            newTarget = getRandomPositionInZone(exitZone);
            targetZoneId = exitZone.id;
          }
        } else {
          newState = 'browsing';
          if (currentZone) {
            const nextZone = selectNextZone(currentZone.id);
            if (nextZone) {
              newTarget = getRandomPositionInZone(nextZone);
              targetZoneId = nextZone.id;
            }
          }
        }
        break;

      case 'fitting':
        if (Math.random() < (currentConfig?.purchaseProbability || 0.164) * 2.5) {
          newState = 'purchasing';
        } else {
          newState = 'exiting';
          if (exitZone) {
            newTarget = getRandomPositionInZone(exitZone);
            targetZoneId = exitZone.id;
          }
        }
        break;

      case 'purchasing':
        // 구매 기록
        const revenue = Math.floor(30000 + Math.random() * 150000);
        recordConversion(revenue);
        newState = 'exiting';
        if (exitZone) {
          newTarget = getRandomPositionInZone(exitZone);
          targetZoneId = exitZone.id;
        }
        break;

      case 'exiting':
        // 입구(출구)에 도착하면 제거
        shouldRemove = true;
        break;
    }

    return { newState, newTarget, targetZoneId, shouldRemove };
  }, [findExitZone, selectNextZone, recordConversion]);

  // 고객 업데이트
  const updateCustomers = useCallback((deltaTime: number) => {
    const speedMultiplier = config.speed;
    const currentZones = zonesRef.current;

    customers.forEach((customer) => {
      const [cx, cy, cz] = customer.position;
      const [tx, ty, tz] = customer.targetPosition;

      // 거리 계산
      const dx = tx - cx;
      const dz = tz - cz;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // 체류시간 업데이트
      const newDwellTime = customer.dwellTime + deltaTime * speedMultiplier;

      if (distance < 0.3) {
        // 목표 도달 - 상태 전환
        const currentZone = findZoneAtPosition(currentZones, cx, cz);
        const { newState, newTarget, targetZoneId, shouldRemove } = transitionCustomerState(customer, currentZone);

        if (shouldRemove) {
          removeCustomer(customer.id);
        } else {
          updateCustomer(customer.id, {
            state: newState,
            targetPosition: newTarget,
            targetZone: targetZoneId,
            color: STATE_COLORS[newState],
            currentZone: currentZone?.id || null,
            dwellTime: newDwellTime,
            path: [...customer.path, newTarget],
            visitedZones: targetZoneId && !customer.visitedZones.includes(targetZoneId)
              ? [...customer.visitedZones, targetZoneId]
              : customer.visitedZones,
          });
        }
      } else {
        // 이동
        const moveSpeed = customer.speed * speedMultiplier * deltaTime * 0.5;
        const ratio = Math.min(moveSpeed / distance, 1);

        const newPosition: [number, number, number] = [
          cx + dx * ratio,
          cy,
          cz + dz * ratio,
        ];

        updateCustomer(customer.id, {
          position: newPosition,
          dwellTime: newDwellTime,
          currentZone: findZoneAtPosition(currentZones, newPosition[0], newPosition[2])?.id || null,
        });
      }
    });

    // 구역별 점유율 업데이트
    const zoneOccupancy: Record<string, number> = {};
    currentZones.forEach((zone) => {
      const count = customers.filter((c) => c.currentZone === zone.id).length;
      zoneOccupancy[zone.id] = count;
    });
    updateKPI({ zoneOccupancy, currentCustomers: customers.length });

  }, [customers, config.speed, transitionCustomerState, updateCustomer, removeCustomer, updateKPI]);

  // refs로 콜백 추적
  const spawnCustomerRef = useRef(spawnCustomer);
  const updateCustomersRef = useRef(updateCustomers);
  const tickRef = useRef(tick);

  spawnCustomerRef.current = spawnCustomer;
  updateCustomersRef.current = updateCustomers;
  tickRef.current = tick;

  // 메인 애니메이션 루프
  useEffect(() => {
    if (!enabled || !isRunning || isPaused) {
      console.log('[useSimulationEngine] Animation loop not starting:', { enabled, isRunning, isPaused });
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    console.log('[useSimulationEngine] 🎬 Starting animation loop with DB data');
    let isActive = true;

    const animate = (time: number) => {
      if (!isActive) return;

      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      // 최대 델타 시간 제한
      const clampedDelta = Math.min(deltaTime, 0.1);

      // 시간 업데이트
      tickRef.current(clampedDelta);

      const currentZones = zonesRef.current;
      const currentConfig = configRef.current;

      if (currentZones && currentZones.length > 0 && currentConfig) {
        // 고객 생성 (확률적, 디바이스 스폰율 배율 적용)
        const deviceSpawnMul = getQualityConfig().simulation.spawnRateMultiplier;
        const spawnProb = currentConfig.spawnRate * clampedDelta * currentConfig.speed * deviceSpawnMul;
        if (Math.random() < spawnProb) {
          spawnCustomerRef.current();
        }

        // 고객 업데이트
        updateCustomersRef.current(clampedDelta);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      console.log('[useSimulationEngine] Stopping animation loop');
      isActive = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, isRunning, isPaused]);

  return {
    spawnCustomer,
    isActive: isRunning && !isPaused,
    isLoadingFlowData,
    hasDbData: dbZones.length > 0,
    transitionPathCount: flowData?.flowPaths?.length || 0,
  };
}

export default useSimulationEngine;
