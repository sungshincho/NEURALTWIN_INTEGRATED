/**
 * neuralsense_live_state 테이블 Realtime 구독을 통한 실시간 방문자 트래킹
 * postgres_changes로 DB 변경사항을 수신하여 3D 아바타 위치 업데이트
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CustomerAvatar } from '../types/avatar.types';
import type { StoreSpaceMetadata } from '../types/iot.types';
import { realToModel } from '../utils/coordinateMapper';

interface UseLiveStateTrackingProps {
  storeId: string;
  enabled?: boolean;
}

interface LiveStateTrackingResult {
  avatars: CustomerAvatar[];
  isConnected: boolean;
  activeCount: number;
  lastUpdate: number | null;
}

interface LiveStateRow {
  id: string;
  store_id: string;
  hashed_mac: string;
  current_zone_id: string | null;
  position: { x?: number; y?: number; z?: number } | null;
  confidence: number | null;
  session_id: string | null;
  status: string;
  last_seen: string;
  active: boolean;
}

const STATUS_MAP: Record<string, CustomerAvatar['status']> = {
  entering: 'browsing',
  browsing: 'browsing',
  purchasing: 'purchasing',
  leaving: 'leaving',
  exited: 'leaving',
};

/**
 * neuralsense_live_state → CustomerAvatar 변환
 */
function rowToAvatar(
  row: LiveStateRow,
  metadata: StoreSpaceMetadata | null,
): CustomerAvatar | null {
  if (!row.active) return null;

  let position = { x: 0, y: 0, z: 0 };

  if (row.position && row.position.x != null && row.position.y != null) {
    if (metadata) {
      const model = realToModel(row.position.x, row.position.y, metadata);
      position = { x: model.x, y: 0, z: model.z };
    } else {
      position = { x: row.position.x, y: 0, z: row.position.y };
    }
  }

  return {
    id: row.hashed_mac,
    position,
    status: STATUS_MAP[row.status] || 'browsing',
    timestamp: new Date(row.last_seen).getTime(),
  };
}

export function useLiveStateTracking({
  storeId,
  enabled = true,
}: UseLiveStateTrackingProps): LiveStateTrackingResult {
  const [avatars, setAvatars] = useState<CustomerAvatar[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const metadataRef = useRef<StoreSpaceMetadata | null>(null);
  const rowsRef = useRef<Map<string, LiveStateRow>>(new Map());

  // 매장 메타데이터 로드
  useEffect(() => {
    if (!enabled || !storeId) return;

    const loadMetadata = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('metadata')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('[live-state] Failed to load store metadata:', error);
        return;
      }

      const md = data?.metadata as any;
      metadataRef.current = {
        store_id: storeId,
        real_width: md?.real_width || 20,
        real_depth: md?.real_depth || 15,
        real_height: md?.real_height || 3,
        model_scale: md?.model_scale || 1.0,
        origin_offset: md?.origin_offset || { x: 0, y: 0, z: 0 },
        zones: md?.zones || [],
      };
    };

    loadMetadata();
  }, [storeId, enabled]);

  // rows → avatars 재계산
  const refreshAvatars = useCallback(() => {
    const result: CustomerAvatar[] = [];
    for (const row of rowsRef.current.values()) {
      const avatar = rowToAvatar(row, metadataRef.current);
      if (avatar) result.push(avatar);
    }
    setAvatars(result);
    setLastUpdate(Date.now());
  }, []);

  // 초기 데이터 페치 + Realtime 구독
  useEffect(() => {
    if (!enabled || !storeId) return;

    let cancelled = false;

    // 초기 로드: 현재 활성 방문자 전체
    const loadInitial = async () => {
      const { data, error } = await supabase
        .from('neuralsense_live_state')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true);

      if (error) {
        console.error('[live-state] Initial fetch error:', error);
        return;
      }

      if (cancelled) return;

      rowsRef.current.clear();
      for (const row of (data || []) as LiveStateRow[]) {
        rowsRef.current.set(row.hashed_mac, row);
      }
      refreshAvatars();
    };

    loadInitial();

    // Realtime 구독: INSERT, UPDATE, DELETE
    const channel = supabase
      .channel(`live-state-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neuralsense_live_state',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { hashed_mac?: string };
            if (old.hashed_mac) {
              rowsRef.current.delete(old.hashed_mac);
            }
          } else {
            const row = (payload.new as LiveStateRow);
            if (row.active) {
              rowsRef.current.set(row.hashed_mac, row);
            } else {
              rowsRef.current.delete(row.hashed_mac);
            }
          }
          refreshAvatars();
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [storeId, enabled, refreshAvatars]);

  return {
    avatars,
    isConnected,
    activeCount: avatars.length,
    lastUpdate,
  };
}
