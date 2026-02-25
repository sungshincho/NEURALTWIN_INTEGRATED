import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TrackingData, SensorPosition } from '@/features/simulation/types/iot.types';

interface WiFiTrackingRecord {
  id: string;
  timestamp: string;
  session_id: string;
  x: number;
  z: number;
  accuracy?: number;
  status?: string;
}

export function useWiFiTracking(storeId?: string) {
  const [zones, setZones] = useState<SensorPosition[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    loadWiFiData();

    // Realtime 구독
    const trackingChannel = supabase
      .channel('wifi-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wifi_tracking',
          filter: `store_id=eq.${storeId}`
        },
        () => {
          loadTrackingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trackingChannel);
    };
  }, [storeId]);

  async function loadWiFiData() {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadZones(),
        loadTrackingData()
      ]);
    } catch (err) {
      console.error('Failed to load WiFi data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load WiFi data');
    } finally {
      setLoading(false);
    }
  }

  async function loadZones() {
    try {
      const { data, error } = await supabase
        .from('wifi_zones')
        .select('*')
        .eq('store_id', storeId);

      if (error) {
        console.warn('wifi_zones query error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        // WiFi zones를 SensorPosition 형식으로 변환
        // coordinates는 jsonb로 {x, y, z} 또는 {min_x, min_z, max_x, max_z} 형식
        const sensors: SensorPosition[] = data.map((zone: any, index: number) => {
          const coords = zone.coordinates || {};
          return {
            sensor_id: `zone_${zone.id}`,
            sensor_type: 'wifi' as const,
            x: coords.x ?? coords.min_x ?? 0,
            y: coords.y ?? 1.5,
            z: coords.z ?? coords.min_z ?? 0,
            coverage_radius: 5
          };
        });
        setZones(sensors);
      }
    } catch (err) {
      console.warn('Failed to load wifi zones:', err);
    }
  }

  async function loadTrackingData() {
    try {
      const { data, error } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('store_id', storeId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        console.warn('wifi_tracking query error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const tracking: TrackingData[] = data.map((record: any) => ({
          customer_id: record.session_id || record.id,
          timestamp: new Date(record.timestamp).getTime(),
          sensor_id: 'tracking',
          x: record.x,
          z: record.z,
          accuracy: record.accuracy,
          status: record.status as any
        }));
        setTrackingData(tracking);
      }
    } catch (err) {
      console.warn('Failed to load tracking data:', err);
    }
  }

  const refresh = () => {
    loadWiFiData();
  };

  return {
    zones,
    trackingData,
    rawSignals: [], // deprecated
    heatmapCache: [], // deprecated
    loading,
    error,
    refresh
  };
}