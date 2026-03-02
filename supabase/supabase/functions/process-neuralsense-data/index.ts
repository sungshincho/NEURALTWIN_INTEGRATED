// ============================================================================
// process-neuralsense-data/index.ts
// NEURALSENSE 센서 데이터 처리 (WiFi/BLE Probe Request)
// 매장 내 고객 행동 데이터를 zone_events로 변환
// 작성일: 2026-01-13
// ============================================================================

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";

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
    live_state_updated: number;
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

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const supabase = createSupabaseAdmin();

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
      return errorResponse('Missing required fields: node_id, store_id, data_type, readings', 400);
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
        user_id: '00000000-0000-0000-0000-000000000000',  // 시스템 사용자 (SYSTEM_USER_ID)
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
    // 4.5. neuralsense_live_state 실시간 업데이트
    // ========================================
    // 디바이스별 최신 리딩 → upsert_live_visitor RPC
    // Supabase Realtime (postgres_changes)로 3D 시각화에 자동 전달
    let liveStateUpdated = 0;
    const latestByMac = new Map<string, NeuralsenseReading>();

    for (const reading of readings) {
      if (!reading.hashed_mac) continue;
      const prev = latestByMac.get(reading.hashed_mac);
      if (!prev || reading.timestamp > prev.timestamp) {
        latestByMac.set(reading.hashed_mac, reading);
      }
    }

    for (const [mac, reading] of latestByMac) {
      let status = 'browsing';
      if (reading.zone_id) {
        const zone = zoneMap.get(reading.zone_id) as any;
        if (zone?.zone_type === 'entrance') status = 'entering';
        else if (zone?.zone_type === 'checkout') status = 'purchasing';
        else if (zone?.zone_type === 'exit') status = 'leaving';
      }

      const { error: liveError } = await supabase.rpc('upsert_live_visitor', {
        p_store_id: store_id,
        p_hashed_mac: mac,
        p_zone_id: reading.zone_id || null,
        p_position: reading.estimated_position
          ? { x: reading.estimated_position.x, y: reading.estimated_position.y, z: 0 }
          : {},
        p_rssi_readings: reading.rssi_readings || {},
        p_confidence: reading.estimated_position?.confidence || 0,
        p_session_id: null,
        p_status: status,
      });

      if (liveError) {
        warnings.push(`live_state upsert failed for ${mac}: ${liveError.message}`);
      } else {
        liveStateUpdated++;
      }
    }

    // ========================================
    // 5. Visit 세션 관리
    // ========================================
    // visits 테이블 실제 스키마:
    //   id (uuid PK), user_id (uuid NOT NULL), org_id, store_id,
    //   customer_id, visit_date (timestamptz NOT NULL),
    //   duration_minutes (int), zones_visited (text[]), created_at
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    let visitsUpdated = 0;

    // MAC별 방문 존 ID 수집
    const macZones = new Map<string, string[]>();
    for (const event of zoneEvents) {
      if (event.visitor_id && event.zone_id) {
        const existing = macZones.get(event.visitor_id) || [];
        if (!existing.includes(event.zone_id)) {
          existing.push(event.zone_id);
        }
        macZones.set(event.visitor_id, existing);
      }
    }

    for (const mac of processedMacs) {
      // 최근 30분 내 같은 MAC의 방문 세션 찾기
      const sessionCutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString();

      const { data: existingVisit } = await supabase
        .from('visits')
        .select('id, created_at, zones_visited')
        .eq('store_id', store_id)
        .eq('user_id', SYSTEM_USER_ID)
        .is('customer_id', null)
        .gte('created_at', sessionCutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const visitedZones = macZones.get(mac) || [];

      if (existingVisit) {
        // 기존 세션 업데이트: duration 계산 + zones_visited 병합
        const createdAt = new Date(existingVisit.created_at).getTime();
        const durationMinutes = Math.round((Date.now() - createdAt) / 60000);

        // 기존 zones_visited와 새 존 병합 (중복 제거)
        const prevZones: string[] = existingVisit.zones_visited || [];
        const mergedZones = [...new Set([...prevZones, ...visitedZones])];

        await supabase
          .from('visits')
          .update({
            duration_minutes: durationMinutes > 0 ? durationMinutes : null,
            zones_visited: mergedZones.length > 0 ? mergedZones : null,
          })
          .eq('id', existingVisit.id);

        visitsUpdated++;
      } else {
        // 새 방문 세션 생성
        const { error: visitError } = await supabase
          .from('visits')
          .insert({
            user_id: SYSTEM_USER_ID,
            org_id: org_id || null,
            store_id,
            customer_id: null,
            visit_date: new Date().toISOString(),
            duration_minutes: null,
            zones_visited: visitedZones.length > 0 ? visitedZones : null,
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
            live_state_updated: liveStateUpdated,
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
        live_state_updated: liveStateUpdated,
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

    return errorResponse(errorMessage, 500);
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
