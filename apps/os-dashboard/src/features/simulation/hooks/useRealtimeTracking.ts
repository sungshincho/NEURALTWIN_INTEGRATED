/**
 * Supabase Realtime을 활용한 IoT 트래킹 데이터 실시간 연동
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CustomerAvatar } from '../types/overlay.types';
import type { 
  TrackingData, 
  SensorPosition, 
  StoreSpaceMetadata,
  CustomerPresenceState 
} from '../types/iot.types';
import { realToModel, trilaterate, KalmanFilter, getZoneId } from '../utils/coordinateMapper';

interface UseRealtimeTrackingProps {
  storeId: string;
  enabled?: boolean;
}

interface RealtimeTrackingResult {
  avatars: CustomerAvatar[];
  isConnected: boolean;
  sensorCount: number;
  lastUpdate: number | null;
}

/**
 * IoT 센서 데이터를 실시간으로 수신하여 고객 아바타 위치 업데이트
 */
export function useRealtimeTracking({
  storeId,
  enabled = true
}: UseRealtimeTrackingProps): RealtimeTrackingResult {
  const [avatars, setAvatars] = useState<CustomerAvatar[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorCount, setSensorCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sensorsRef = useRef<SensorPosition[]>([]);
  const metadataRef = useRef<StoreSpaceMetadata | null>(null);
  const kalmanFiltersRef = useRef<Map<string, KalmanFilter>>(new Map());
  const trackingBufferRef = useRef<Map<string, TrackingData[]>>(new Map());
  // 고객 아바타 URL 캐시 (customer_id -> avatar_url)
  const customerAvatarsRef = useRef<Map<string, string>>(new Map());

  // 매장 메타데이터 및 센서 정보 로드
  useEffect(() => {
    if (!enabled || !storeId) return;

    const loadStoreConfig = async () => {
      try {
        // Fetch store metadata
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('metadata')
          .eq('id', storeId)
          .single();

        if (storeError) throw storeError;

        // Use metadata from database or fallback to defaults
        const metadata = storeData?.metadata as any;
        metadataRef.current = {
          store_id: storeId,
          real_width: metadata?.real_width || 20,
          real_depth: metadata?.real_depth || 15,
          real_height: metadata?.real_height || 3,
          model_scale: metadata?.model_scale || 1.0,
          origin_offset: metadata?.origin_offset || { x: 0, y: 0, z: 0 },
          zones: metadata?.zones || []
        };

        // 센서 위치 정보 로드 (iot_sensors 테이블 필요)
        // TODO: iot_sensors 테이블 생성 후 활성화
        /*
        const { data: sensorsData, error: sensorsError } = await supabase
          .from('iot_sensors')
          .select('*')
          .eq('store_id', storeId);

        if (!sensorsError && sensorsData) {
          sensorsRef.current = sensorsData.map((s: any) => ({
            sensor_id: s.sensor_id,
            sensor_type: s.sensor_type,
            x: s.position_x,
            y: s.position_y,
            z: s.position_z,
            coverage_radius: s.coverage_radius || 10
          }));
          setSensorCount(sensorsData.length);
        }
        */

        // 임시 센서 데이터 (테스트용)
        sensorsRef.current = [
          { sensor_id: 'wifi-01', sensor_type: 'wifi', x: 0, y: 2.5, z: -7, coverage_radius: 8 },
          { sensor_id: 'wifi-02', sensor_type: 'wifi', x: -8, y: 2.5, z: 0, coverage_radius: 8 },
          { sensor_id: 'wifi-03', sensor_type: 'wifi', x: 8, y: 2.5, z: 0, coverage_radius: 8 }
        ];
        setSensorCount(sensorsRef.current.length);

        // 고객 아바타 URL 로드 (3D 모델 렌더링용)
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, avatar_url, avatar_type')
          .eq('store_id', storeId)
          .not('avatar_url', 'is', null);

        if (!customersError && customers) {
          customers.forEach((c: any) => {
            if (c.avatar_url) {
              customerAvatarsRef.current.set(c.id, c.avatar_url);
            }
          });
          console.log(`고객 아바타 URL 로드: ${customers.length}건`);
        }

        console.log('매장 구성 로드 완료:', {
          metadata: metadataRef.current,
          sensors: sensorsRef.current.length,
          customerAvatars: customerAvatarsRef.current.size
        });
      } catch (error) {
        console.error('매장 구성 로드 실패:', error);
      }
    };

    loadStoreConfig();
  }, [storeId, enabled]);

  // Realtime 채널 구독
  useEffect(() => {
    if (!enabled || !storeId) return;

    const channel = supabase.channel(`store-tracking-${storeId}`, {
      config: {
        presence: {
          key: storeId
        }
      }
    });

    // Presence Sync - 모든 고객 상태 동기화
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState<CustomerPresenceState>();
      console.log('Presence sync:', Object.keys(presenceState).length, '명');

      const updatedAvatars: CustomerAvatar[] = [];
      Object.values(presenceState).forEach(presences => {
        presences.forEach(presence => {
          // 고객 아바타 URL 캐시에서 조회
          const avatarUrl = customerAvatarsRef.current.get(presence.customer_id);

          updatedAvatars.push({
            id: presence.customer_id,
            position: presence.position,
            velocity: presence.velocity,
            status: presence.status,
            timestamp: presence.last_updated,
            avatar_url: avatarUrl, // GLB 모델 URL 추가
          });
        });
      });

      setAvatars(updatedAvatars);
      setLastUpdate(Date.now());
    });

    // Presence Join - 새 고객 입장
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('새 고객 입장:', newPresences.length, '명');
      setLastUpdate(Date.now());
    });

    // Presence Leave - 고객 퇴장
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('고객 퇴장:', leftPresences.length, '명');
      setLastUpdate(Date.now());
    });

    // Broadcast - IoT 센서 트래킹 데이터 수신
    channel.on('broadcast', { event: 'tracking-update' }, ({ payload }) => {
      handleTrackingData(payload as TrackingData);
    });

    // 채널 구독
    channel.subscribe((status) => {
      console.log('Realtime 연결 상태:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [storeId, enabled]);

  /**
   * IoT 센서 데이터 처리 및 위치 추정
   */
  const handleTrackingData = (data: TrackingData) => {
    if (!metadataRef.current) return;

    const customerId = data.customer_id;

    // 고객별 트래킹 데이터 버퍼에 추가
    let buffer = trackingBufferRef.current.get(customerId);
    if (!buffer) {
      buffer = [];
      trackingBufferRef.current.set(customerId, buffer);
    }
    buffer.push(data);

    // 최근 5초 데이터만 유지
    const fiveSecondsAgo = Date.now() - 5000;
    buffer = buffer.filter(d => d.timestamp > fiveSecondsAgo);
    trackingBufferRef.current.set(customerId, buffer);

    // 삼각측량으로 위치 추정
    const position = trilaterate(buffer, sensorsRef.current);
    if (!position) return;

    // 실제 좌표를 3D 모델 좌표로 변환
    const modelPos = realToModel(position.x, position.z, metadataRef.current);

    // 칼만 필터 적용 (위치 스무딩)
    let kalman = kalmanFiltersRef.current.get(customerId);
    if (!kalman) {
      kalman = new KalmanFilter(modelPos.x, modelPos.z);
      kalmanFiltersRef.current.set(customerId, kalman);
    }

    const smoothed = kalman.update(modelPos.x, modelPos.z, 0.1);

    // 구역 판단
    const zoneId = getZoneId(smoothed.x, smoothed.z, metadataRef.current);

    // Presence 상태 업데이트 (다른 클라이언트와 공유)
    const status = data.status === 'entering' ? 'browsing' : (data.status || 'browsing');
    const presenceState: CustomerPresenceState = {
      customer_id: customerId,
      position: { x: smoothed.x, y: 0, z: smoothed.z },
      velocity: { x: smoothed.vx, z: smoothed.vz },
      status: status as 'browsing' | 'purchasing' | 'leaving',
      last_updated: Date.now(),
      zone_id: zoneId
    };

    channelRef.current?.track(presenceState);
  };

  return {
    avatars,
    isConnected,
    sensorCount,
    lastUpdate
  };
}
