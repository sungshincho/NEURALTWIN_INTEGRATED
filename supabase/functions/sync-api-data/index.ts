// ============================================================================
// sync-api-data Edge Function (Phase 7 Enhanced)
// ============================================================================
// 기능:
// 1. 스케줄 기반 데이터 동기화
// 2. 직접 API 연결 동기화 (connection_id)
// 3. Phase 7 스키마 호환 (field_mappings, auth_config, raw_imports)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 변환 함수 정의 (Phase 7 field_mappings 지원)
const transformFunctions: Record<string, (value: any) => any> = {
  to_string: (v) => v?.toString() ?? null,
  to_integer: (v) => {
    const num = parseInt(v, 10);
    return isNaN(num) ? null : num;
  },
  to_decimal: (v) => {
    const num = parseFloat(v);
    return isNaN(num) ? null : num;
  },
  to_boolean: (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    return Boolean(v);
  },
  to_date: (v) => {
    if (!v) return null;
    const date = new Date(v);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  to_timestamp: (v) => {
    if (!v) return null;
    const date = new Date(v);
    return isNaN(date.getTime()) ? null : date.toISOString();
  },
  to_lowercase: (v) => v?.toString().toLowerCase() ?? null,
  to_uppercase: (v) => v?.toString().toUpperCase() ?? null,
  cents_to_decimal: (v) => {
    const num = parseInt(v, 10);
    return isNaN(num) ? null : num / 100;
  },
  unix_to_date: (v) => {
    if (!v) return null;
    const date = new Date(v * 1000);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  unix_to_timestamp: (v) => {
    if (!v) return null;
    const date = new Date(v * 1000);
    return isNaN(date.getTime()) ? null : date.toISOString();
  },
  direct: (v) => v,
};

// Phase 7 인증 헤더 빌더 (auth_config JSONB 지원)
function buildAuthHeaders(authType: string, authConfig: any, authValue?: string): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (authType) {
    case 'api_key':
      if (authConfig?.header_name && authConfig?.api_key) {
        headers[authConfig.header_name] = authConfig.api_key;
      } else if (authConfig?.api_key) {
        headers['X-API-Key'] = authConfig.api_key;
      } else if (authValue) {
        headers['X-API-Key'] = authValue;
      }
      break;
    case 'bearer':
      if (authConfig?.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`;
      } else if (authValue) {
        headers['Authorization'] = `Bearer ${authValue}`;
      }
      break;
    case 'basic':
      if (authConfig?.username && authConfig?.password) {
        const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (authValue) {
        headers['Authorization'] = `Basic ${authValue}`;
      }
      break;
    case 'oauth2':
      if (authConfig?.access_token) {
        headers['Authorization'] = `Bearer ${authConfig.access_token}`;
      }
      break;
  }

  return headers;
}

// Phase 7 필드 매핑 적용 (배열 형식 [{source, target, transform}])
function applyFieldMappingsV2(record: any, mappings: any[]): any {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    const { source, target, transform = 'direct' } = mapping;
    const sourceValue = getNestedValue(record, source);

    const transformFn = transformFunctions[transform] || transformFunctions.direct;
    result[target] = transformFn(sourceValue);
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { scheduleId, connection_id, manualRun = false, sync_type } = body;

    // =========================================================================
    // Phase 7: 직접 connection_id로 동기화 (스케줄 없이)
    // Phase 8: sync_type 지원 (manual, scheduled, retry)
    // =========================================================================
    if (connection_id && !scheduleId) {
      console.log(`Direct sync for connection: ${connection_id}, type: ${sync_type || 'manual'}`);

      // api-connector Edge Function으로 위임
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('api-connector', {
        body: {
          action: 'sync',
          connection_id,
          sync_type: sync_type || 'manual',
        },
      });

      if (syncError) {
        return new Response(
          JSON.stringify({ success: false, error: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(syncResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 기존 스케줄 기반 동기화
    // =========================================================================

    if (!scheduleId) {
      throw new Error('scheduleId is required');
    }

    console.log(`Starting data sync for schedule: ${scheduleId}`);

    // Get schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('data_sync_schedules')
      .select('*, data_source:external_data_sources(*)')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) throw scheduleError;
    if (!schedule) throw new Error('Schedule not found');

    // Check if schedule is enabled
    if (!schedule.is_enabled && !manualRun) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Schedule is disabled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry
    const logStartTime = new Date().toISOString();
    const { data: syncLog, error: logError } = await supabase
      .from('data_sync_logs')
      .insert({
        schedule_id: scheduleId,
        user_id: schedule.user_id,
        org_id: schedule.org_id,
        status: 'running',
        started_at: logStartTime,
        metadata: {
          manual_run: manualRun,
          source_type: schedule.data_source.source_type
        }
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // Get API connection details
      const { data: connection, error: connError } = await supabase
        .from('api_connections')
        .select('*')
        .eq('id', schedule.data_source_id)
        .single();

      if (connError) throw connError;
      if (!connection) throw new Error('API connection not found');

      // Build request headers (Phase 7: auth_config JSONB 지원)
      const authHeaders = buildAuthHeaders(
        connection.auth_type || 'none',
        connection.auth_config || {},
        connection.auth_value
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders,
        ...(connection.headers || {}),
      };

      console.log(`Calling API: ${connection.url}`);

      // Call the external API
      const apiStartTime = Date.now();
      const apiResponse = await fetch(connection.url, {
        method: connection.method || 'GET',
        headers,
      });

      const apiResponseTime = ((Date.now() - apiStartTime) / 1000).toFixed(2);

      if (!apiResponse.ok) {
        throw new Error(`API request failed with status ${apiResponse.status}`);
      }

      const contentType = apiResponse.headers.get('content-type');
      let apiData: any;

      if (contentType?.includes('application/json')) {
        apiData = await apiResponse.json();
      } else {
        const textData = await apiResponse.text();
        apiData = { raw_data: textData };
      }

      console.log(`API call successful. Response time: ${apiResponseTime}s`);

      // Get field mapping and ontology options from sync_config or connection
      // Phase 7: connection.field_mappings 배열 형식도 지원
      const fieldMapping = schedule.sync_config?.field_mapping || {};
      const fieldMappingsArray = connection.field_mappings || [];
      const targetTable = schedule.sync_config?.target_table || connection.target_table;
      const convertToOntology = schedule.sync_config?.convert_to_ontology || false;
      const ontologyEntityType = schedule.sync_config?.ontology_entity_type;
      const responseDataPath = schedule.sync_config?.data_path || connection.response_data_path || 'data';

      let recordsSynced = 0;
      let importId: string | null = null;

      // Process and insert data based on target table
      // Phase 7: field_mappings 배열 형식 또는 기존 field_mapping 객체 형식 지원
      const hasFieldMappings = fieldMappingsArray.length > 0 || Object.keys(fieldMapping).length > 0;

      if (targetTable && hasFieldMappings) {
        // Extract array from response (support nested paths)
        let dataArray = getNestedValue(apiData, responseDataPath);

        if (!Array.isArray(dataArray)) {
          dataArray = [dataArray];
        }

        // Phase 7: raw_imports에 원본 데이터 저장 (Data Lineage 지원)
        const batchId = crypto.randomUUID();
        const { data: rawImport } = await supabase
          .from('raw_imports')
          .insert({
            org_id: schedule.org_id,
            store_id: schedule.sync_config?.store_id || connection.store_id,
            user_id: schedule.user_id,
            source_type: 'api',
            data_type: targetTable,
            file_name: `api_sync_${connection.name}_${new Date().toISOString()}.json`,
            row_count: dataArray.length,
            raw_data: dataArray,
            status: 'processing',
            api_connection_id: connection.id,
            sync_batch_id: batchId,
            api_response_meta: {
              status_code: apiResponse.status,
              content_type: contentType,
              response_time: apiResponseTime,
              fetched_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        // Map and insert records (Phase 7: field_mappings 배열 형식 우선)
        const mappedRecords = dataArray.map((record: any) => {
          let mappedRecord: any = {
            user_id: schedule.user_id,
            org_id: schedule.org_id,
            store_id: schedule.sync_config?.store_id || connection.store_id || null,
          };

          // Phase 7: 배열 형식 field_mappings 우선 사용
          if (fieldMappingsArray.length > 0) {
            const mapped = applyFieldMappingsV2(record, fieldMappingsArray);
            mappedRecord = { ...mappedRecord, ...mapped };
          } else {
            // 기존 객체 형식 field_mapping
            for (const [dbColumn, apiField] of Object.entries(fieldMapping)) {
              const value = getNestedValue(record, apiField as string);
              if (value !== undefined) {
                mappedRecord[dbColumn] = value;
              }
            }
          }

          return mappedRecord;
        });

        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < mappedRecords.length; i += batchSize) {
          const batch = mappedRecords.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from(targetTable)
            .insert(batch);

          if (insertError) {
            console.error(`Batch insert error:`, insertError);
            throw insertError;
          }

          recordsSynced += batch.length;
        }

        console.log(`Successfully synced ${recordsSynced} records to ${targetTable}`);

        // Phase 7: raw_imports 상태 업데이트
        if (rawImport) {
          await supabase
            .from('raw_imports')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              progress: {
                current: recordsSynced,
                total: dataArray.length,
                percentage: 100,
              },
            })
            .eq('id', rawImport.id);
        }

        // 온톨로지 변환 옵션이 활성화된 경우
        if (convertToOntology) {
          console.log('🧠 Starting ontology conversion...');

          // user_data_imports 레코드 생성
          const { data: importRecord, error: importError } = await supabase
            .from('user_data_imports')
            .insert({
              user_id: schedule.user_id,
              org_id: schedule.org_id,
              store_id: schedule.sync_config?.store_id || null,
              file_name: `api_sync_${scheduleId}_${Date.now()}.json`,
              file_type: 'json',
              data_type: targetTable,
              raw_data: dataArray,
              row_count: dataArray.length,
              status: 'pending',
            })
            .select()
            .single();

          if (importError) {
            console.error('Failed to create import record:', importError);
          } else if (importRecord) {
            importId = importRecord.id;
            console.log(`Created import record: ${importId}`);

            // integrated-data-pipeline 호출하여 온톨로지 변환 실행
            try {
              const pipelineResponse = await supabase.functions.invoke('integrated-data-pipeline', {
                body: {
                  import_id: importId,
                  store_id: schedule.sync_config?.store_id,
                  auto_fix: true,
                  skip_validation: false,
                },
              });

              if (pipelineResponse.error) {
                console.error('Ontology conversion error:', pipelineResponse.error);
              } else {
                console.log('✅ Ontology conversion completed');
                console.log(`  - Entities created: ${pipelineResponse.data?.etl?.entities_created || 0}`);
                console.log(`  - Relations created: ${pipelineResponse.data?.etl?.relations_created || 0}`);
              }
            } catch (pipelineError) {
              console.error('Pipeline invocation error:', pipelineError);
            }
          }
        }
      } else {
        console.log('No field mapping configured, skipping data insertion');
      }

      // Update sync log with success
      await supabase
        .from('data_sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          metadata: {
            manual_run: manualRun,
            source_type: schedule.data_source.source_type,
            api_response_time: `${apiResponseTime}s`,
            target_table: targetTable,
            records_processed: recordsSynced,
            ontology_conversion: convertToOntology,
            import_id: importId,
          }
        })
        .eq('id', syncLog.id);

      // Update schedule's last run timestamp
      const nextRunAt = manualRun ? schedule.next_run_at : calculateNextRun(schedule.cron_expression);
      await supabase
        .from('data_sync_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          last_status: 'success',
          next_run_at: nextRunAt,
          error_message: null
        })
        .eq('id', scheduleId);

      // Update API connection last sync (Phase 7: 상세 상태 업데이트)
      const syncDuration = Date.now() - apiStartTime;
      await supabase
        .from('api_connections')
        .update({
          last_sync: new Date().toISOString(),
          status: 'active',
          last_error: null,
          total_records_synced: (connection.total_records_synced || 0) + recordsSynced,
          last_sync_duration_ms: syncDuration,
        })
        .eq('id', connection.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Data sync completed successfully',
          records_synced: recordsSynced,
          log_id: syncLog.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError: any) {
      console.error('Sync error:', syncError);

      // Update sync log with failure
      await supabase
        .from('data_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message,
          metadata: {
            manual_run: manualRun,
            error_details: syncError.toString()
          }
        })
        .eq('id', syncLog.id);

      // Update schedule with error
      await supabase
        .from('data_sync_schedules')
        .update({
          last_status: 'failed',
          error_message: syncError.message
        })
        .eq('id', scheduleId);

      // Phase 7: connection 상태 업데이트
      await supabase
        .from('api_connections')
        .update({
          status: 'error',
          last_error: syncError.message,
        })
        .eq('id', schedule.data_source_id);

      throw syncError;
    }

  } catch (error: any) {
    console.error('Error in sync-api-data:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to calculate next run time based on cron expression
function calculateNextRun(cronExpression: string): string {
  // Simple calculation - for production, use a cron parser library
  // This is a basic implementation for common patterns
  const now = new Date();
  
  // Parse cron: minute hour day month dayOfWeek
  const parts = cronExpression.split(' ');
  const [minute, hour, day, month, dayOfWeek] = parts;

  // Handle simple cases
  if (cronExpression === '0 * * * *') { // Every hour
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  } else if (cronExpression === '0 0 * * *') { // Daily at midnight
    now.setDate(now.getDate() + 1);
    now.setHours(0, 0, 0, 0);
  } else if (cronExpression.startsWith('*/')) { // Every N minutes
    const interval = parseInt(cronExpression.split(' ')[0].replace('*/', ''));
    now.setMinutes(now.getMinutes() + interval);
  } else {
    // Default: add 1 hour
    now.setHours(now.getHours() + 1);
  }

  return now.toISOString();
}
