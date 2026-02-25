// ============================================================================
// process-neuralsense-data/index.ts
// NEURALSENSE 센서 데이터 처리 (WiFi/BLE Probe Request)
// 매장 내 고객 행동 데이터를 zone_events로 변환
// 작성일: 2026-01-13
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Types
// ============================================================================

interface NeuralsenseReading {
  timestamp: string;
  hashed_mac: string;
  rssi_readings: Record<string, number>;  // {node_id: rssi_value}
  estimated_position?: {
    x: number;
    y: number;
    confidence: number;
  };
  zone_id?: string;
  device_type?: 'smartphone' | 'tablet' | 'wearable' | 'unknown';
}

interface NeuralsensePayload {
  node_id: string;          // NEURALSENSE 노드 식별자
  store_id: string;
  org_id?: string;
  firmware_version?: string;
  data_type: 'wifi' | 'ble' | 'hybrid';
  readings: NeuralsenseReading[];
  metadata?: Record<string, any>;
}

interface ProcessingResult {
  success: boolean;
  raw_import_id?: string;
  etl_run_id?: string;
  stats?: {
    total_readings: number;
    zone_events_created: number;
    visits_updated: number;
    unique_devices: number;
    duration_ms: number;
  };
  error?: string;
  warnings?: string[];
}

// Session timeout (30분)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NeuralsensePayload = await req.json();
    const {
      node_id,
      store_id,
      org_id,
      firmware_version = '1.0.0',
      data_type,
      readings,
      metadata = {},
    } = payload;

    // Validation
    if (!node_id || !store_id || !data_type || !readings || !Array.isArray(readings)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: node_id, store_id, data_type, readings',
        } as ProcessingResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (readings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            total_readings: 0,
            zone_events_created: 0,
            visits_updated: 0,
            unique_devices: 0,
            duration_ms: Date.now() - startTime,
          },
        } as ProcessingResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[neuralsense] Processing ${readings.length} readings from ${node_id}`);

    // ========================================
    // 1. raw_imports에 원본 저장
    // ========================================
    const rawImportId = crypto.randomUUID();

    const { error: rawImportError } = await supabase
      .from('raw_imports')
      .insert({
        id: rawImportId,
        org_id: org_id || null,
        store_id,
        user_id: 'system',  // 시스템 사용자
        source_type: 'neuralsense',
        source_name: `${node_id}_${data_type}`,
        data_type: data_type,
        row_count: readings.length,
        status: 'processing',
        raw_data: readings,
        metadata: {
          device_type: 'neuralsense',
          node_id,
          firmware_version,
          signal_type: data_type,
          ...metadata,
        },
        etl_version: '2.0',
        started_at: new Date().toISOString(),
      });

    if (rawImportError) {
      console.error('[neuralsense] Failed to create raw_import:', rawImportError);
      warnings.push(`Failed to save raw data: ${rawImportError.message}`);
    }

    // ========================================
    // 2. ETL Run 생성
    // ========================================
    const etlRunId = crypto.randomUUID();

    await supabase.from('etl_runs').insert({
      id: etlRunId,
      org_id: org_id || null,
      store_id,
      etl_function: 'process-neuralsense-data',
      etl_version: '2.0',
      status: 'running',
      input_record_count: readings.length,
      raw_import_ids: [rawImportId],
      metadata: {
        node_id,
        data_type,
        firmware_version,
      },
      started_at: new Date().toISOString(),
    });

    // ========================================
    // 3. Zone 매핑 조회
    // ========================================
    const { data: zones } = await supabase
      .from('zones_dim')
      .select('id, zone_code, zone_name, zone_type, coordinates')
      .eq('store_id', store_id)
      .eq('is_active', true);

    const zoneMap = new Map(zones?.map((z: any) => [z.id, z]) || []);

    if (zoneMap.size === 0) {
      warnings.push('No active zones configured for this store');
    }

    // ========================================
    // 4. Zone Events 생성
    // ========================================
    const zoneEvents: any[] = [];
    const processedMacs = new Set<string>();
    const macToZoneMap = new Map<string, { zone_id: string; timestamp: string }>();

    for (const reading of readings) {
      const { timestamp, hashed_mac, estimated_position, zone_id } = reading;

      if (!hashed_mac || !timestamp) continue;

      processedMacs.add(hashed_mac);

      // Zone이 할당된 경우에만 이벤트 생성
      if (zone_id && zoneMap.has(zone_id)) {
        const previousZone = macToZoneMap.get(hashed_mac);

        // Zone 변경 감지 (enter 이벤트)
        if (!previousZone || previousZone.zone_id !== zone_id) {
          // 이전 zone에서 exit 이벤트 생성
          if (previousZone) {
            const dwellTime = Math.round(
              (new Date(timestamp).getTime() - new Date(previousZone.timestamp).getTime()) / 1000
            );

            zoneEvents.push({
              org_id: org_id || null,
              store_id,
              zone_id: previousZone.zone_id,
              event_type: 'exit',
              event_date: timestamp.split('T')[0],
              event_hour: new Date(timestamp).getHours(),
              event_timestamp: timestamp,
              visitor_id: hashed_mac,
              duration_seconds: dwellTime > 0 ? dwellTime : null,
              sensor_type: data_type,
              sensor_id: node_id,
              confidence_score: estimated_position?.confidence || null,
              metadata: {
                source_trace: {
                  raw_import_id: rawImportId,
                  node_id,
                  data_type,
                },
              },
            });
          }

          // 새 zone에 enter 이벤트 생성
          zoneEvents.push({
            org_id: org_id || null,
            store_id,
            zone_id,
            event_type: 'enter',
            event_date: timestamp.split('T')[0],
            event_hour: new Date(timestamp).getHours(),
            event_timestamp: timestamp,
            visitor_id: hashed_mac,
            duration_seconds: null,
            sensor_type: data_type,
            sensor_id: node_id,
            confidence_score: estimated_position?.confidence || null,
            metadata: {
              position: estimated_position || null,
              source_trace: {
                raw_import_id: rawImportId,
                node_id,
                data_type,
              },
            },
          });

          macToZoneMap.set(hashed_mac, { zone_id, timestamp });
        } else {
          // 같은 zone에 머무르는 경우 (dwell 이벤트)
          // dwell 이벤트는 5분 간격으로만 생성
          const previousTime = new Date(previousZone.timestamp).getTime();
          const currentTime = new Date(timestamp).getTime();

          if (currentTime - previousTime >= 5 * 60 * 1000) {  // 5분
            zoneEvents.push({
              org_id: org_id || null,
              store_id,
              zone_id,
              event_type: 'dwell',
              event_date: timestamp.split('T')[0],
              event_hour: new Date(timestamp).getHours(),
              event_timestamp: timestamp,
              visitor_id: hashed_mac,
              duration_seconds: Math.round((currentTime - previousTime) / 1000),
              sensor_type: data_type,
              sensor_id: node_id,
              confidence_score: estimated_position?.confidence || null,
              metadata: {
                position: estimated_position || null,
                source_trace: {
                  raw_import_id: rawImportId,
                  node_id,
                  data_type,
                },
              },
            });

            macToZoneMap.set(hashed_mac, { zone_id, timestamp });
          }
        }
      }
    }

    // Zone Events 일괄 삽입
    let zoneEventsCreated = 0;
    if (zoneEvents.length > 0) {
      const { error: eventError, data: insertedEvents } = await supabase
        .from('zone_events')
        .insert(zoneEvents)
        .select('id');

      if (eventError) {
        console.error('[neuralsense] Zone events insert error:', eventError);
        warnings.push(`Failed to insert some zone events: ${eventError.message}`);
      } else {
        zoneEventsCreated = insertedEvents?.length || 0;
      }
    }

    // ========================================
    // 5. Visit 세션 관리
    // ========================================
    let visitsUpdated = 0;

    for (const mac of processedMacs) {
      // 최근 30분 내 같은 MAC의 방문 세션 찾기
      const sessionCutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString();

      const { data: existingVisit } = await supabase
        .from('visits')
        .select('id, entry_time')
        .eq('store_id', store_id)
        .eq('visitor_id', mac)
        .gte('entry_time', sessionCutoff)
        .order('entry_time', { ascending: false })
        .limit(1)
        .single();

      if (existingVisit) {
        // 기존 세션 업데이트 (exit_time 갱신)
        await supabase
          .from('visits')
          .update({
            exit_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVisit.id);

        visitsUpdated++;
      } else {
        // 새 방문 세션 생성
        const { error: visitError } = await supabase
          .from('visits')
          .insert({
            org_id: org_id || null,
            store_id,
            visitor_id: mac,
            visit_date: new Date().toISOString().split('T')[0],
            entry_time: new Date().toISOString(),
            source: 'neuralsense',
            metadata: {
              node_id,
              data_type,
              raw_import_id: rawImportId,
            },
          });

        if (!visitError) {
          visitsUpdated++;
        }
      }
    }

    // ========================================
    // 6. Funnel Events 생성 (entry/exit)
    // ========================================
    // 매장 입장/퇴장 이벤트를 funnel_events에도 기록
    const entranceZone = zones?.find((z: any) => z.zone_type === 'entrance');

    if (entranceZone) {
      const entryFunnelEvents = zoneEvents
        .filter((e) => e.zone_id === entranceZone.id && e.event_type === 'enter')
        .map((e) => ({
          org_id: e.org_id,
          store_id: e.store_id,
          visitor_id: e.visitor_id,
          session_id: `${e.visitor_id}_${e.event_date}`,
          event_type: 'entry',
          event_date: e.event_date,
          event_hour: e.event_hour,
          event_timestamp: e.event_timestamp,
          zone_id: e.zone_id,
          device_type: 'unknown',
          metadata: e.metadata,
        }));

      if (entryFunnelEvents.length > 0) {
        const { error: funnelError } = await supabase
          .from('funnel_events')
          .insert(entryFunnelEvents);

        if (funnelError) {
          warnings.push(`Failed to insert funnel events: ${funnelError.message}`);
        }
      }
    }

    // ========================================
    // 7. 상태 업데이트 및 결과 반환
    // ========================================
    const durationMs = Date.now() - startTime;

    // raw_import 상태 업데이트
    await supabase
      .from('raw_imports')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        metadata: {
          device_type: 'neuralsense',
          node_id,
          firmware_version,
          signal_type: data_type,
          processing_result: {
            zone_events_created: zoneEventsCreated,
            visits_updated: visitsUpdated,
            unique_devices: processedMacs.size,
            duration_ms: durationMs,
          },
        },
      })
      .eq('id', rawImportId);

    // etl_run 상태 업데이트
    await supabase
      .from('etl_runs')
      .update({
        status: 'completed',
        output_record_count: zoneEventsCreated,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', etlRunId);

    const result: ProcessingResult = {
      success: true,
      raw_import_id: rawImportId,
      etl_run_id: etlRunId,
      stats: {
        total_readings: readings.length,
        zone_events_created: zoneEventsCreated,
        visits_updated: visitsUpdated,
        unique_devices: processedMacs.size,
        duration_ms: durationMs,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    console.log(`[neuralsense] Completed: ${JSON.stringify(result.stats)}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[neuralsense] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      } as ProcessingResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/*
 * Usage Example:
 *
 * POST /functions/v1/process-neuralsense-data
 * {
 *   "node_id": "NS-001",
 *   "store_id": "store-uuid",
 *   "org_id": "org-uuid",
 *   "firmware_version": "1.2.0",
 *   "data_type": "wifi",
 *   "readings": [
 *     {
 *       "timestamp": "2026-01-13T14:30:00.123Z",
 *       "hashed_mac": "a1b2c3d4e5f6",
 *       "rssi_readings": {
 *         "NS-001": -45,
 *         "NS-002": -62
 *       },
 *       "estimated_position": {
 *         "x": 12.5,
 *         "y": 8.3,
 *         "confidence": 0.85
 *       },
 *       "zone_id": "zone-uuid"
 *     }
 *   ]
 * }
 */
