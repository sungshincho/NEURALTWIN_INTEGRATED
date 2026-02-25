import { useEffect, useRef, useCallback, useState } from 'react';
import { useSimulationStore, CustomerAgent, ZoneMetric, STATE_COLORS } from '@/stores/simulationStore';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';

/**
 * 시뮬레이션 엔진 훅
 *
 * 고객 에이전트의 이동, 행동 변화, 구역 메트릭 계산 등
 * 시뮬레이션 핵심 로직을 처리합니다.
 */
export function useSimulationEngine() {
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const { selectedStore } = useSelectedStore();

  // 고객 아바타 URL 캐시 (DB에서 로드)
  const [customerAvatars, setCustomerAvatars] = useState<string[]>([]);
  const avatarIndexRef = useRef(0);

  const {
    status,
    config,
    currentTime,
    customers,
    entities,
    tick,
    addCustomer,
    updateCustomer,
    removeCustomer,
    updateZoneMetrics,
    setResults,
  } = useSimulationStore();

  // 고객 아바타 URL 로드 (DB에서)
  useEffect(() => {
    const loadCustomerAvatars = async () => {
      if (!selectedStore?.id) return;

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('avatar_url')
          .eq('store_id', selectedStore.id)
          .not('avatar_url', 'is', null);

        if (!error && data && data.length > 0) {
          const urls = data.map((c: any) => c.avatar_url).filter(Boolean);
          setCustomerAvatars(urls);
          console.log('[SimulationEngine] Loaded customer avatars:', urls.length);
        }
      } catch (err) {
        console.error('[SimulationEngine] Failed to load customer avatars:', err);
      }
    };

    loadCustomerAvatars();
  }, [selectedStore?.id]);

  /**
   * 새로운 고객 에이전트 생성
   */
  const spawnCustomer = useCallback(() => {
    const zones = Object.values(entities).filter((e) => e.type === 'Zone');
    if (zones.length === 0) return;

    // 입구 구역 찾기 (없으면 첫 번째 구역 사용)
    const entranceZone =
      zones.find((z) => z.metadata?.isEntrance || z.metadata?.zone_type === 'entrance') ||
      zones[0];

    // 상태별 색상 사용
    const initialState = 'entering';

    // DB에서 로드한 아바타 URL 순환 사용
    let avatarUrl: string | undefined;
    if (customerAvatars.length > 0) {
      avatarUrl = customerAvatars[avatarIndexRef.current % customerAvatars.length];
      avatarIndexRef.current++;
    }

    const newCustomer: CustomerAgent = {
      id: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      position: [...entranceZone.position] as [number, number, number],
      targetPosition: [...entranceZone.position] as [number, number, number],
      targetZone: null,
      currentZone: entranceZone.id,
      visitedZones: [entranceZone.id],
      behavior: 'browsing',
      state: initialState,
      speed: 1 + Math.random() * 0.5,
      enteredAt: Date.now(),
      dwellTime: 0,
      purchaseProbability: 0.15 + Math.random() * 0.2,
      color: STATE_COLORS[initialState],
      path: [[...entranceZone.position] as [number, number, number]],
      avatar_url: avatarUrl, // DB에서 로드한 GLB 모델 URL
    };

    addCustomer(newCustomer);
  }, [entities, addCustomer, customerAvatars]);

  /**
   * 고객 에이전트 이동 및 행동 업데이트
   */
  const updateCustomers = useCallback(
    (deltaTime: number) => {
      const zones = Object.values(entities).filter((e) => e.type === 'Zone');

      customers.forEach((customer) => {
        switch (customer.behavior) {
          case 'browsing': {
            // 체류 시간 업데이트
            const newDwellTime = customer.dwellTime + deltaTime;

            // 일정 시간 후 다음 구역으로 이동 또는 퇴장
            const maxDwellTime = 30 + Math.random() * 60; // 30-90초
            if (newDwellTime > maxDwellTime) {
              const unvisited = zones.filter(
                (z) => !customer.visitedZones.includes(z.id)
              );

              if (unvisited.length > 0 && Math.random() > 0.3) {
                // 70% 확률로 다른 구역 방문
                const nextZone =
                  unvisited[Math.floor(Math.random() * unvisited.length)];
                updateCustomer(customer.id, {
                  targetZone: nextZone.id,
                  behavior: 'walking',
                  dwellTime: 0,
                });
              } else {
                // 30% 확률로 퇴장 또는 모든 구역 방문 완료
                // 구매 결정
                if (Math.random() < customer.purchaseProbability) {
                  updateCustomer(customer.id, {
                    behavior: 'purchasing',
                    dwellTime: 0,
                  });
                } else {
                  updateCustomer(customer.id, { behavior: 'exiting' });
                }
              }
            } else {
              updateCustomer(customer.id, { dwellTime: newDwellTime });
            }
            break;
          }

          case 'walking': {
            if (customer.targetZone) {
              const target = entities[customer.targetZone];
              if (target) {
                const dx = target.position[0] - customer.position[0];
                const dz = target.position[2] - customer.position[2];
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 1) {
                  // 목표 구역 도착
                  updateCustomer(customer.id, {
                    position: [...target.position] as [number, number, number],
                    behavior: 'browsing',
                    targetZone: null,
                    visitedZones: [...customer.visitedZones, customer.targetZone],
                  });
                } else {
                  // 이동 중
                  const speed = 2; // m/s
                  const newPosition: [number, number, number] = [
                    customer.position[0] + (dx / dist) * speed * deltaTime,
                    customer.position[1],
                    customer.position[2] + (dz / dist) * speed * deltaTime,
                  ];
                  updateCustomer(customer.id, { position: newPosition });
                }
              }
            }
            break;
          }

          case 'purchasing': {
            // 구매 행동 (2-5초)
            const purchaseDwellTime = customer.dwellTime + deltaTime;
            if (purchaseDwellTime > 2 + Math.random() * 3) {
              updateCustomer(customer.id, { behavior: 'exiting' });
            } else {
              updateCustomer(customer.id, { dwellTime: purchaseDwellTime });
            }
            break;
          }

          case 'exiting': {
            removeCustomer(customer.id);
            break;
          }
        }
      });
    },
    [customers, entities, updateCustomer, removeCustomer]
  );

  /**
   * 구역 메트릭 계산
   */
  const calculateZoneMetrics = useCallback(() => {
    const zones = Object.values(entities).filter((e) => e.type === 'Zone');

    const metrics: ZoneMetric[] = zones.map((zone) => {
      // 해당 구역을 방문한 고객 수
      const visitorsInZone = customers.filter((c) =>
        c.visitedZones.includes(zone.id)
      );

      // 현재 구역에 있는 고객 수 (히트맵용)
      const currentlyInZone = customers.filter((c) => {
        const dx = c.position[0] - zone.position[0];
        const dz = c.position[2] - zone.position[2];
        const zoneRadius = Math.max(zone.scale[0], zone.scale[2]) / 2 + 1;
        return Math.sqrt(dx * dx + dz * dz) < zoneRadius;
      });

      // 구매 고객 수
      const purchasingCustomers = visitorsInZone.filter(
        (c) => c.behavior === 'purchasing' || c.behavior === 'exiting'
      );

      // 메트릭 계산
      const visitorCount = visitorsInZone.length;
      const avgDwellTime =
        visitorsInZone.length > 0
          ? visitorsInZone.reduce((s, c) => s + c.dwellTime, 0) /
            visitorsInZone.length
          : 0;
      const conversionRate =
        visitorCount > 0
          ? (purchasingCustomers.length * 0.3) / visitorCount
          : 0;
      const revenue = purchasingCustomers.length * 50000; // 평균 5만원
      const heatmapIntensity = Math.min(currentlyInZone.length / 5, 1);

      return {
        zoneId: zone.id,
        zoneName: zone.metadata?.zone_name || zone.metadata?.name || zone.id,
        visitorCount,
        avgDwellTime,
        conversionRate,
        revenue,
        heatmapIntensity,
      };
    });

    updateZoneMetrics(metrics);
  }, [entities, customers, updateZoneMetrics]);

  /**
   * 시뮬레이션 결과 생성
   */
  const generateResults = useCallback(() => {
    const zoneMetrics = useSimulationStore.getState().zoneMetrics;

    const totalVisitors = zoneMetrics.reduce((s, z) => s + z.visitorCount, 0);
    const totalRevenue = zoneMetrics.reduce((s, z) => s + z.revenue, 0);
    const avgConversion =
      zoneMetrics.length > 0
        ? zoneMetrics.reduce((s, z) => s + z.conversionRate, 0) /
          zoneMetrics.length
        : 0;
    const avgDwellTime =
      zoneMetrics.length > 0
        ? zoneMetrics.reduce((s, z) => s + z.avgDwellTime, 0) /
          zoneMetrics.length
        : 0;

    // 병목 구역 식별
    const bottleneckZones = zoneMetrics
      .filter((z) => z.heatmapIntensity > 0.8)
      .map((z) => z.zoneName);

    // AI 추천 생성 (룰 기반)
    const recommendations: string[] = [];

    // 저전환율 구역
    const lowConversionZones = zoneMetrics.filter((z) => z.conversionRate < 0.1);
    if (lowConversionZones.length > 0) {
      recommendations.push(
        `${lowConversionZones.map((z) => z.zoneName).join(', ')} 구역의 상품 배치 개선을 권장합니다.`
      );
    }

    // 병목 구역
    if (bottleneckZones.length > 0) {
      recommendations.push(
        `${bottleneckZones.join(', ')} 구역에 혼잡이 발생합니다. 동선 개선을 검토하세요.`
      );
    }

    // 체류 시간 낮은 구역
    const lowDwellZones = zoneMetrics.filter((z) => z.avgDwellTime < 20);
    if (lowDwellZones.length > 0) {
      recommendations.push(
        `${lowDwellZones.map((z) => z.zoneName).join(', ')} 구역의 고객 참여도가 낮습니다. 인터랙티브 요소 추가를 고려하세요.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('현재 매장 레이아웃은 전반적으로 양호합니다.');
    }

    setResults({
      timestamp: Date.now(),
      metrics: {
        totalVisitors,
        totalRevenue,
        avgConversion,
        avgDwellTime,
        peakHour: 14, // 시뮬레이션에서는 고정
        bottleneckZones,
      },
      zoneMetrics,
      recommendations,
    });
  }, [setResults]);

  /**
   * 메인 시뮬레이션 루프
   */
  useEffect(() => {
    if (status !== 'running') {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      // 시뮬레이션 정지 시 lastTimeRef 리셋 (다음 시작 시 음수 delta 방지)
      lastTimeRef.current = 0;
      return;
    }

    const loop = (timestamp: number) => {
      // lastTimeRef가 0이거나 비정상적으로 오래된 경우 delta를 0으로 처리
      let delta = 0;
      if (lastTimeRef.current > 0) {
        const rawDelta = (timestamp - lastTimeRef.current) / 1000;
        // delta가 1초 이상이면 비정상 (탭 전환 등) - 스킵
        delta = rawDelta > 0 && rawDelta < 1 ? rawDelta : 0;
      }
      lastTimeRef.current = timestamp;

      // 시간 진행
      tick(delta);

      // 고객 생성 (평균 5초에 한 명)
      if (Math.random() < delta / 5) {
        spawnCustomer();
      }

      // 고객 업데이트
      updateCustomers(delta);

      // 매 초마다 메트릭 계산
      const currentTimeState = useSimulationStore.getState().currentTime;
      if (
        Math.floor(currentTimeState) !==
        Math.floor(currentTimeState - delta * useSimulationStore.getState().config.speed)
      ) {
        calculateZoneMetrics();
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [status, tick, spawnCustomer, updateCustomers, calculateZoneMetrics]);

  /**
   * 시뮬레이션 완료 시 결과 생성
   */
  useEffect(() => {
    if (status === 'completed') {
      generateResults();
    }
  }, [status, generateResults]);

  return {
    status,
    config,
    currentTime,
    customers,
    zoneMetrics: useSimulationStore.getState().zoneMetrics,
    results: useSimulationStore.getState().results,
  };
}

export default useSimulationEngine;
