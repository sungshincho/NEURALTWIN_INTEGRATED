import { useMemo } from 'react';
import { useWiFiTracking } from './useWiFiTracking';
import type { StoreZone } from '@/features/simulation/types/iot.types';

export interface ZoneDwellTime {
  zoneId: string;
  zoneName: string;
  avgDwellTime: number; // 초 단위
  totalVisits: number;
  minDwellTime: number;
  maxDwellTime: number;
}

export interface DwellTimeStats {
  zoneDwellTimes: ZoneDwellTime[];
  overallAvgDwellTime: number;
}

export const useDwellTime = (storeId: string | undefined, zones: StoreZone[]) => {
  const { trackingData } = useWiFiTracking(storeId);

  const stats = useMemo(() => {
    if (!trackingData || trackingData.length === 0 || zones.length === 0) {
      return { zoneDwellTimes: [], overallAvgDwellTime: 0 };
    }

    // 세션별로 그룹화
    const sessionMap = new Map<string, typeof trackingData>();
    trackingData.forEach(point => {
      const sessionId = point.customer_id; // customer_id를 session으로 사용
      const session = sessionMap.get(sessionId) || [];
      session.push(point);
      sessionMap.set(sessionId, session);
    });

    // 존별 체류 시간 계산
    const zoneDwellMap = new Map<string, number[]>();

    sessionMap.forEach(session => {
      const sortedSession = session.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentZone: string | null = null;
      let zoneEntryTime: number | null = null;

      sortedSession.forEach((point, idx) => {
        const zone = zones.find(z => {
          const dx = point.x - z.center.x;
          const dz = point.z - z.center.z;
          return Math.sqrt(dx * dx + dz * dz) <= z.radius;
        });

        const pointTime = new Date(point.timestamp).getTime();

        if (zone) {
          if (zone.id !== currentZone) {
            // 이전 존 체류 시간 기록
            if (currentZone && zoneEntryTime) {
              const dwellTime = (pointTime - zoneEntryTime) / 1000; // 초 단위
              const times = zoneDwellMap.get(currentZone) || [];
              times.push(dwellTime);
              zoneDwellMap.set(currentZone, times);
            }
            
            // 새 존 진입
            currentZone = zone.id;
            zoneEntryTime = pointTime;
          }
        } else {
          // 존을 벗어남
          if (currentZone && zoneEntryTime) {
            const dwellTime = (pointTime - zoneEntryTime) / 1000;
            const times = zoneDwellMap.get(currentZone) || [];
            times.push(dwellTime);
            zoneDwellMap.set(currentZone, times);
          }
          currentZone = null;
          zoneEntryTime = null;
        }

        // 세션 마지막 포인트 처리
        if (idx === sortedSession.length - 1 && currentZone && zoneEntryTime) {
          const dwellTime = (pointTime - zoneEntryTime) / 1000;
          const times = zoneDwellMap.get(currentZone) || [];
          times.push(dwellTime);
          zoneDwellMap.set(currentZone, times);
        }
      });
    });

    // 통계 계산
    const zoneDwellTimes: ZoneDwellTime[] = zones.map(zone => {
      const times = zoneDwellMap.get(zone.id) || [];
      const avgDwellTime = times.length > 0 
        ? times.reduce((sum, t) => sum + t, 0) / times.length 
        : 0;
      
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        avgDwellTime: Math.round(avgDwellTime),
        totalVisits: times.length,
        minDwellTime: times.length > 0 ? Math.round(Math.min(...times)) : 0,
        maxDwellTime: times.length > 0 ? Math.round(Math.max(...times)) : 0
      };
    });

    const allTimes = Array.from(zoneDwellMap.values()).flat();
    const overallAvgDwellTime = allTimes.length > 0
      ? Math.round(allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length)
      : 0;

    return {
      zoneDwellTimes: zoneDwellTimes.sort((a, b) => b.avgDwellTime - a.avgDwellTime),
      overallAvgDwellTime
    };
  }, [trackingData, zones]);

  return stats;
};
