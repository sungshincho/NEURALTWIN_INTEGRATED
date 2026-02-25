import { useMemo } from 'react';
import { useWiFiTracking } from './useWiFiTracking';
import type { StoreZone } from '@/features/simulation/types/iot.types';

export interface ZoneTransition {
  fromZone: string;
  toZone: string;
  count: number;
  probability: number;
}

export interface ZoneTransitionStats {
  transitions: ZoneTransition[];
  totalTransitions: number;
  topTransitions: ZoneTransition[];
}

export const useZoneTransition = (storeId: string | undefined, zones: StoreZone[]) => {
  const { trackingData } = useWiFiTracking(storeId);

  const stats = useMemo(() => {
    if (!trackingData || trackingData.length === 0 || zones.length === 0) {
      return { transitions: [], totalTransitions: 0, topTransitions: [] };
    }

    // 세션별로 그룹화
    const sessionMap = new Map<string, typeof trackingData>();
    trackingData.forEach(point => {
      const sessionId = point.customer_id; // customer_id를 session으로 사용
      const session = sessionMap.get(sessionId) || [];
      session.push(point);
      sessionMap.set(sessionId, session);
    });

    // 각 세션에서 존 전환 추적
    const transitionMap = new Map<string, number>();
    
    sessionMap.forEach(session => {
      const sortedSession = session.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentZone: string | null = null;
      
      sortedSession.forEach(point => {
        // 현재 포인트가 어느 존에 속하는지 찾기
        const zone = zones.find(z => {
          const dx = point.x - z.center.x;
          const dz = point.z - z.center.z;
          return Math.sqrt(dx * dx + dz * dz) <= z.radius;
        });

        if (zone && zone.id !== currentZone && currentZone !== null) {
          const key = `${currentZone}->${zone.id}`;
          transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
        }
        
        if (zone) {
          currentZone = zone.id;
        }
      });
    });

    const totalTransitions = Array.from(transitionMap.values()).reduce((sum, count) => sum + count, 0);
    
    const transitions: ZoneTransition[] = Array.from(transitionMap.entries()).map(([key, count]) => {
      const [fromZone, toZone] = key.split('->');
      return {
        fromZone,
        toZone,
        count,
        probability: totalTransitions > 0 ? (count / totalTransitions) * 100 : 0
      };
    });

    const topTransitions = [...transitions]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      transitions,
      totalTransitions,
      topTransitions
    };
  }, [trackingData, zones]);

  return stats;
};
