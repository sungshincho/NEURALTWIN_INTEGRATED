// ============================================================================
// replay-import/index.ts
// raw_imports 재처리 API - CTO 요구사항: "Raw data는 반드시 보존 (replay 가능)"
// 작성일: 2026-01-13
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplayRequest {
  raw_import_id: string;
  force?: boolean;  // true면 completed 상태도 재처리
  options?: {
    skip_existing?: boolean;  // 이미 처리된 레코드 건너뛰기
    dry_run?: boolean;        // 실제 저장 없이 시뮬레이션
  };
}

interface ReplayResult {
  success: boolean;
  raw_import_id: string;
  etl_run_id?: string;
  message?: string;
  error?: string;
  stats?: {
    input_records: number;
    output_records: number;
    skipped_records: number;
    duration_ms: number;
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { raw_import_id, force = false, options = {} }: ReplayRequest = await req.json();

    if (!raw_import_id) {
      return new Response(
        JSON.stringify({
          success: false,
          raw_import_id: '',
          error: 'raw_import_id is required',
        } as ReplayResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[replay-import] Starting replay for: ${raw_import_id}`);

    // ========================================
    // 1. raw_import 조회
    // ========================================
    const { data: rawImport, error: fetchError } = await supabase
      .from('raw_imports')
      .select('*')
      .eq('id', raw_import_id)
      .single();

    if (fetchError || !rawImport) {
      return new Response(
        JSON.stringify({
          success: false,
          raw_import_id,
          error: 'raw_import not found',
        } as ReplayResult),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 2. 상태 검증
    // ========================================
    if (rawImport.status === 'processing') {
      return new Response(
        JSON.stringify({
          success: false,
          raw_import_id,
          error: 'Import is currently being processed. Please wait.',
        } as ReplayResult),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rawImport.status === 'completed' && !force) {
      return new Response(
        JSON.stringify({
          success: false,
          raw_import_id,
          error: 'Import already completed. Use force=true to reprocess.',
        } as ReplayResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 3. raw_data 검증
    // ========================================
    if (!rawImport.raw_data ||
        (Array.isArray(rawImport.raw_data) && rawImport.raw_data.length === 0)) {
      return new Response(
        JSON.stringify({
          success: false,
          raw_import_id,
          error: 'No raw_data available for replay. Original data was not preserved.',
        } as ReplayResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dry run 모드
    if (options.dry_run) {
      const rowCount = Array.isArray(rawImport.raw_data)
        ? rawImport.raw_data.length
        : Object.keys(rawImport.raw_data).length;

      return new Response(
        JSON.stringify({
          success: true,
          raw_import_id,
          message: `Dry run: Would process ${rowCount} records`,
          stats: {
            input_records: rowCount,
            output_records: 0,
            skipped_records: 0,
            duration_ms: Date.now() - startTime,
          },
        } as ReplayResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // 4. ETL Run 생성 (추적용)
    // ========================================
    const etlRunId = crypto.randomUUID();

    const { error: etlRunError } = await supabase.from('etl_runs').insert({
      id: etlRunId,
      org_id: rawImport.org_id,
      store_id: rawImport.store_id,
      etl_function: 'replay-import',
      etl_version: '2.0',
      status: 'running',
      input_record_count: rawImport.row_count || 0,
      raw_import_ids: [raw_import_id],
      metadata: {
        replay: true,
        original_status: rawImport.status,
        original_import_date: rawImport.created_at,
        force_replay: force,
        options,
      },
      started_at: new Date().toISOString(),
    });

    if (etlRunError) {
      console.error('[replay-import] Failed to create etl_run:', etlRunError);
    }

    // ========================================
    // 5. raw_import 상태 업데이트 (processing)
    // ========================================
    await supabase
      .from('raw_imports')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        processed_at: null,
        completed_at: null,
        error_message: null,
        error_details: null,
        progress: { current: 0, total: rawImport.row_count || 0, percentage: 0 },
      })
      .eq('id', raw_import_id);

    // ========================================
    // 6. unified-etl 호출
    // ========================================
    let etlResult: any;
    let processedCount = 0;

    try {
      // 데이터 타입에 따라 적절한 ETL 호출
      const dataType = rawImport.data_type || rawImport.source_type || 'unknown';

      const etlPayload = {
        etl_type: 'raw_to_l2',
        org_id: rawImport.org_id,
        store_id: rawImport.store_id,
        import_id: raw_import_id,
        data_type: dataType,
        raw_data: rawImport.raw_data,
        source_name: `[REPLAY] ${rawImport.source_name || 'Unknown'}`,
        source_type: rawImport.source_type,
        options: {
          is_replay: true,
          original_import_id: raw_import_id,
          etl_run_id: etlRunId,
          skip_existing: options.skip_existing || false,
        },
      };

      console.log(`[replay-import] Calling unified-etl with data_type: ${dataType}`);

      const etlResponse = await fetch(
        `${supabaseUrl}/functions/v1/unified-etl`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(etlPayload),
        }
      );

      etlResult = await etlResponse.json();
      console.log(`[replay-import] ETL response:`, JSON.stringify(etlResult).substring(0, 200));

      if (etlResult.success) {
        processedCount = etlResult.processed_count || etlResult.stats?.processed_records || 0;
      }

    } catch (etlError) {
      console.error('[replay-import] ETL call failed:', etlError);
      etlResult = {
        success: false,
        error: etlError instanceof Error ? etlError.message : 'ETL call failed',
      };
    }

    // ========================================
    // 7. 결과에 따른 상태 업데이트
    // ========================================
    const finalStatus = etlResult.success ? 'completed' : 'failed';
    const durationMs = Date.now() - startTime;

    // raw_import 상태 업데이트
    await supabase
      .from('raw_imports')
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: etlResult.error || null,
        error_details: etlResult.errors ? { errors: etlResult.errors } : null,
        progress: {
          current: processedCount,
          total: rawImport.row_count || processedCount,
          percentage: 100
        },
        metadata: {
          ...(rawImport.metadata || {}),
          last_replay: {
            at: new Date().toISOString(),
            etl_run_id: etlRunId,
            success: etlResult.success,
            duration_ms: durationMs,
          },
        },
      })
      .eq('id', raw_import_id);

    // etl_run 상태 업데이트
    await supabase
      .from('etl_runs')
      .update({
        status: finalStatus,
        output_record_count: processedCount,
        duration_ms: durationMs,
        error_message: etlResult.error || null,
        error_details: etlResult.errors ? { errors: etlResult.errors } : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', etlRunId);

    // ========================================
    // 8. 응답 반환
    // ========================================
    const result: ReplayResult = {
      success: etlResult.success,
      raw_import_id,
      etl_run_id: etlRunId,
      message: etlResult.success
        ? `Replay completed successfully. Processed ${processedCount} records.`
        : `Replay failed: ${etlResult.error}`,
      error: etlResult.error,
      stats: {
        input_records: rawImport.row_count || 0,
        output_records: processedCount,
        skipped_records: etlResult.skipped_count || 0,
        duration_ms: durationMs,
      },
    };

    console.log(`[replay-import] Completed: ${JSON.stringify(result)}`);

    return new Response(
      JSON.stringify(result),
      {
        status: etlResult.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[replay-import] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        raw_import_id: '',
        error: errorMessage,
      } as ReplayResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/*
 * Usage Examples:
 *
 * 1. Basic replay:
 * POST /functions/v1/replay-import
 * {
 *   "raw_import_id": "uuid-here"
 * }
 *
 * 2. Force replay (even if completed):
 * POST /functions/v1/replay-import
 * {
 *   "raw_import_id": "uuid-here",
 *   "force": true
 * }
 *
 * 3. Dry run (simulation):
 * POST /functions/v1/replay-import
 * {
 *   "raw_import_id": "uuid-here",
 *   "options": { "dry_run": true }
 * }
 */
