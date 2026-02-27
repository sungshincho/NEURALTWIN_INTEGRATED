/**
 * useIoTRealtimeStatus.ts
 *
 * Lightweight hook that subscribes to the neuralsense_live_state table
 * via Supabase Realtime postgres_changes. Provides a live visitor list,
 * active count, connection status, and last-update timestamp.
 *
 * The table may not exist yet — the hook handles errors gracefully.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveVisitor {
  id: string;
  hashedMac: string;
  zoneId: string | null;
  zoneName?: string;
  status: string;
  confidence: number;
  lastSeen: string;
  position?: Record<string, unknown>;
}

export interface IoTRealtimeStatus {
  visitors: LiveVisitor[];
  activeCount: number;
  isConnected: boolean;
  lastUpdate: Date | null;
}

/**
 * Maps a raw DB row to a LiveVisitor.
 */
function rowToVisitor(row: Record<string, any>): LiveVisitor {
  return {
    id: row.id,
    hashedMac: row.hashed_mac ?? '',
    zoneId: row.current_zone_id ?? null,
    zoneName: undefined, // resolved later if zones_dim is joined
    status: row.status ?? 'browsing',
    confidence: Number(row.confidence ?? 0),
    lastSeen: row.last_seen ?? new Date().toISOString(),
    position: row.position ?? {},
  };
}

export function useIoTRealtimeStatus(storeId: string | undefined): IoTRealtimeStatus {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ---- Initial load ----
  const fetchInitial = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('neuralsense_live_state')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
        .order('last_seen', { ascending: false });

      if (error) {
        // Table might not exist yet — that's OK
        console.warn('[IoTRealtime] Initial fetch error (table may not exist):', error.message);
        return;
      }

      if (data) {
        setVisitors(data.map(rowToVisitor));
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.warn('[IoTRealtime] Unexpected error during initial fetch:', err);
    }
  }, [storeId]);

  // ---- Realtime subscription ----
  useEffect(() => {
    if (!storeId) {
      setVisitors([]);
      setIsConnected(false);
      setLastUpdate(null);
      return;
    }

    // Initial load
    fetchInitial();

    // Subscribe to postgres_changes on neuralsense_live_state
    const channel = supabase.channel(`iot-live-${storeId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'neuralsense_live_state',
          filter: `store_id=eq.${storeId}`,
        },
        (payload: any) => {
          const eventType: string = payload.eventType;
          const newRow = payload.new as Record<string, any> | undefined;
          const oldRow = payload.old as Record<string, any> | undefined;

          setLastUpdate(new Date());

          if (eventType === 'INSERT') {
            if (newRow && newRow.active !== false) {
              setVisitors((prev) => {
                // Avoid duplicates
                const exists = prev.some((v) => v.id === newRow.id);
                if (exists) return prev.map((v) => (v.id === newRow.id ? rowToVisitor(newRow) : v));
                return [...prev, rowToVisitor(newRow)];
              });
            }
          } else if (eventType === 'UPDATE') {
            if (newRow) {
              if (newRow.active === false) {
                // Remove inactive visitors
                setVisitors((prev) => prev.filter((v) => v.id !== newRow.id));
              } else {
                setVisitors((prev) =>
                  prev.some((v) => v.id === newRow.id)
                    ? prev.map((v) => (v.id === newRow.id ? rowToVisitor(newRow) : v))
                    : [...prev, rowToVisitor(newRow)]
                );
              }
            }
          } else if (eventType === 'DELETE') {
            const deletedId = oldRow?.id;
            if (deletedId) {
              setVisitors((prev) => prev.filter((v) => v.id !== deletedId));
            }
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [storeId, fetchInitial]);

  return {
    visitors,
    activeCount: visitors.length,
    isConnected,
    lastUpdate,
  };
}
