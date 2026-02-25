import { useMemo } from 'react';
import { useWiFiTracking } from './useWiFiTracking';
import { useSelectedStore } from './useSelectedStore';
import { realToModel } from '@/features/simulation/utils/coordinateMapper';
import type { HeatPoint, StoreSpaceMetadata, StoreZone } from '@/features/simulation/types/iot.types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Determine which zone a coordinate falls into (using real-world coordinates)
 */
function getZoneId(x: number, z: number, zones?: StoreZone[]): string | undefined {
  if (!zones) return undefined;
  
  for (const zone of zones) {
    if (x >= zone.bounds.min_x && x <= zone.bounds.max_x &&
        z >= zone.bounds.min_z && z <= zone.bounds.max_z) {
      return zone.zone_id;
    }
  }
  
  return undefined;
}

/**
 * Fetch external context data (weather, holidays, events)
 */
function useContextData(storeId: string | undefined) {
  return useQuery({
    queryKey: ['context-data', storeId],
    queryFn: async () => {
      if (!storeId) return { weather: [], holidays: [], regional: [] };
      
      const [weatherRes, holidaysRes, regionalRes] = await Promise.all([
        supabase
          .from('weather_data')
          .select('*')
          .eq('store_id', storeId)
          .order('date', { ascending: false })
          .limit(30) as any,
        supabase
          .from('holidays_events')
          .select('*')
          .eq('store_id', storeId)
          .order('date', { ascending: false })
          .limit(30) as any,
        supabase
          .from('regional_data')
          .select('*')
          .order('date', { ascending: false })
          .limit(30) as any
      ]);

      return {
        weather: weatherRes.data || [],
        holidays: holidaysRes.data || [],
        regional: regionalRes.data || []
      };
    },
    enabled: !!storeId
  });
}

/**
 * Convert WiFi tracking data to 3D heatmap points with context
 * Handles coordinate transformation and zone mapping
 */
export function useTrafficHeatmap(storeId: string | undefined, timeOfDay?: number) {
  const wifiData = useWiFiTracking(storeId);
  const { selectedStore } = useSelectedStore();
  const { data: contextData } = useContextData(storeId);
  
  return useMemo(() => {
    if (!selectedStore?.metadata?.storeSpaceMetadata) {
      console.warn('No store space metadata found for heatmap');
      return [];
    }
    
    const metadata = selectedStore.metadata.storeSpaceMetadata as StoreSpaceMetadata;
    let trackingData = wifiData.trackingData || [];
    
    // Filter by time of day if specified
    if (timeOfDay !== undefined) {
      trackingData = trackingData.filter(point => {
        const hour = new Date(point.timestamp).getHours();
        return hour === timeOfDay;
      });
    }
    
    // Transform coordinates and map zones
    const heatPoints: HeatPoint[] = trackingData
      .filter(point => point.x !== undefined && point.z !== undefined)
      .map(point => {
        // Convert real-world coordinates to 3D model coordinates
        const modelCoords = realToModel(point.x!, point.z!, metadata);
        
        // Determine which zone this point belongs to
        const zone_id = getZoneId(point.x!, point.z!, metadata.zones);
        
        return {
          x: modelCoords.x,
          z: modelCoords.z,
          intensity: point.accuracy || 0.5,
          zone_id,
          timestamp: new Date(point.timestamp).toISOString(),
          realCoords: { x: point.x!, z: point.z! }
        };
      });
    
    return heatPoints;
  }, [wifiData.trackingData, selectedStore, timeOfDay]);
}

/**
 * Calculate zone statistics from heat points
 */
export function useZoneStatistics(heatPoints: HeatPoint[], metadata?: StoreSpaceMetadata) {
  return useMemo(() => {
    if (!metadata?.zones) return [];
    
    return metadata.zones.map(zone => {
      const zonePoints = heatPoints.filter(p => p.zone_id === zone.zone_id);
      const avgIntensity = zonePoints.length > 0
        ? zonePoints.reduce((sum, p) => sum + p.intensity, 0) / zonePoints.length
        : 0;
      
      return {
        ...zone,
        visitCount: zonePoints.length,
        avgIntensity,
        maxIntensity: Math.max(...zonePoints.map(p => p.intensity), 0)
      };
    });
  }, [heatPoints, metadata]);
}

/**
 * Analyze traffic patterns with context (weather, holidays, events)
 */
export function useTrafficContext(storeId: string | undefined) {
  const { data: contextData } = useContextData(storeId);
  
  return useMemo(() => {
    if (!contextData) return [];
    
    const insights: string[] = [];
    
    // 날씨 패턴 분석
    if (contextData.weather.length > 0) {
      const rainyDays = contextData.weather.filter(w => w.weather_condition?.includes('rain')).length;
      const totalDays = contextData.weather.length;
      
      if (rainyDays > 0) {
        const rainyRatio = (rainyDays / totalDays * 100).toFixed(0);
        insights.push(`🌧️ 비 오는 날 (${rainyRatio}%): 평균 유입 -15~25% 예상`);
      }
      
      const hotDays = contextData.weather.filter(w => w.temperature && w.temperature > 30).length;
      if (hotDays > 0) {
        insights.push(`☀️ 폭염일 (${hotDays}일): 오전·저녁 시간대 유입 집중 패턴`);
      }
    }
    
    // 공휴일/이벤트 패턴 분석
    if (contextData.holidays.length > 0) {
      const highImpactEvents = contextData.holidays.filter(h => 
        h.impact_level === 'high' || h.event_type === 'local_festival'
      );
      
      if (highImpactEvents.length > 0) {
        insights.push(`🎉 주요 이벤트 (${highImpactEvents.length}건): 주말 유입 +30~50% 증가 예상`);
      }
      
      const holidays = contextData.holidays.filter(h => h.event_type === 'national_holiday');
      if (holidays.length > 0) {
        insights.push(`🏖️ 공휴일 (${holidays.length}일): 점심~오후 시간대 피크 이동`);
      }
    }
    
    // 상권 데이터 패턴 분석 (현재는 생략 - 테이블 구조 업데이트 필요)
    // if (contextData.regional.length > 0) {
    //   추가 분석 로직
    // }
    
    return insights;
  }, [contextData]);
}
