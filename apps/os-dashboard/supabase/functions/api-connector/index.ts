// ============================================================================
// Phase 7: API Connector Edge Function
// ============================================================================
// 기능:
// 1. API 연결 테스트 (test)
// 2. 데이터 동기화 실행 (sync)
// 3. 필드 매핑 미리보기 (preview)
// 4. 매핑 템플릿 적용 (apply-template)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 변환 함수 정의
const transformFunctions: Record<string, (value: any, config?: any) => any> = {
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
  to_array: (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map(s => s.trim());
    return v ? [v] : [];
  },
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

// 중첩 객체에서 값 추출
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    // 배열 인덱스 처리: field[0]
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      return current[arrayKey]?.[parseInt(index, 10)];
    }
    return current[key];
  }, obj);
}

// 필드 매핑 적용
function applyFieldMappings(record: any, mappings: any[]): any {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    const { source, target, transform = 'direct' } = mapping;
    const sourceValue = getNestedValue(record, source);

    const transformFn = transformFunctions[transform] || transformFunctions.direct;
    result[target] = transformFn(sourceValue);
  }

  return result;
}

// API 인증 헤더 구성
function buildAuthHeaders(authType: string, authConfig: any): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (authType) {
    case 'api_key':
      if (authConfig.header_name && authConfig.api_key) {
        headers[authConfig.header_name] = authConfig.api_key;
      } else if (authConfig.api_key) {
        headers['X-API-Key'] = authConfig.api_key;
      }
      break;
    case 'bearer':
      if (authConfig.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`;
      }
      break;
    case 'basic':
      // 토스페이먼츠 등 비밀번호가 빈 값인 경우도 지원
      if (authConfig.username) {
        const password = authConfig.password || '';
        const credentials = btoa(`${authConfig.username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    case 'oauth2':
      if (authConfig.access_token) {
        headers['Authorization'] = `Bearer ${authConfig.access_token}`;
      }
      break;
  }

  return headers;
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
    const { action, connection_id, connection_config } = body;

    console.log(`API Connector - Action: ${action}`);

    switch (action) {
      // ======================================================================
      // 1. API 연결 테스트
      // ======================================================================
      case 'test': {
        let config = connection_config;

        // connection_id가 있으면 DB에서 설정 로드
        if (connection_id && !config) {
          const { data: conn, error } = await supabase
            .from('api_connections')
            .select('*')
            .eq('id', connection_id)
            .single();

          if (error || !conn) {
            return new Response(
              JSON.stringify({ success: false, error: 'Connection not found' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          config = conn;
        }

        if (!config?.url) {
          return new Response(
            JSON.stringify({ success: false, error: 'URL is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 테스트 시작 시간
        const startTime = Date.now();

        // 인증 헤더 구성 (camelCase와 snake_case 둘 다 지원)
        const authHeaders = buildAuthHeaders(
          config.auth_type || config.authType || 'none',
          config.auth_config || config.authConfig || {}
        );

        // 요청 헤더 구성
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders,
          ...(config.headers || {}),
        };

        try {
          // API 호출
          const response = await fetch(config.url, {
            method: config.method || 'GET',
            headers: requestHeaders,
          });

          const responseTime = Date.now() - startTime;
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          // 응답 본문
          let responseData: any = null;
          let sampleData: any = null;

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              responseData = await response.json();

              // 샘플 데이터 추출 (response_data_path 사용)
              const dataPath = config.response_data_path || 'data';
              let dataArray = getNestedValue(responseData, dataPath);

              if (Array.isArray(dataArray) && dataArray.length > 0) {
                sampleData = dataArray.slice(0, 3); // 최대 3개 샘플
              } else if (dataArray && typeof dataArray === 'object') {
                sampleData = [dataArray];
              }
            }
          }

          // connection_id가 있으면 테스트 결과 업데이트
          if (connection_id) {
            await supabase
              .from('api_connections')
              .update({
                last_tested_at: new Date().toISOString(),
                status: response.ok ? 'active' : 'error',
                last_error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
              })
              .eq('id', connection_id);
          }

          return new Response(
            JSON.stringify({
              success: response.ok,
              status_code: response.status,
              status_text: response.statusText,
              response_time_ms: responseTime,
              headers: responseHeaders,
              sample_data: sampleData,
              record_count: Array.isArray(getNestedValue(responseData, config.response_data_path || 'data'))
                ? getNestedValue(responseData, config.response_data_path || 'data').length
                : null,
              message: response.ok ? 'Connection test successful' : `Request failed: ${response.statusText}`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (fetchError: any) {
          // 네트워크 오류
          if (connection_id) {
            await supabase
              .from('api_connections')
              .update({
                last_tested_at: new Date().toISOString(),
                status: 'error',
                last_error: fetchError.message,
              })
              .eq('id', connection_id);
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: fetchError.message,
              message: 'Network error or invalid URL',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // ======================================================================
      // 2. 데이터 동기화 실행
      // ======================================================================
      case 'sync': {
        if (!connection_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'connection_id is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // sync_type 파라미터 (manual, scheduled, retry)
        const syncType = body.sync_type || 'manual';

        // 연결 정보 로드
        const { data: conn, error: connError } = await supabase
          .from('api_connections')
          .select('*')
          .eq('id', connection_id)
          .single();

        if (connError || !conn) {
          return new Response(
            JSON.stringify({ success: false, error: 'Connection not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const startTime = Date.now();
        const batchId = crypto.randomUUID();

        // 상태 업데이트: 동기화 시작
        await supabase
          .from('api_connections')
          .update({ status: 'testing' })
          .eq('id', connection_id);

        // 동기화 로그 생성
        const { data: syncLog } = await supabase
          .from('api_sync_logs')
          .insert({
            api_connection_id: connection_id,
            sync_type: syncType,
            status: 'running',
            org_id: conn.org_id,
            request_url: conn.url,
          })
          .select()
          .single();

        try {
          // 인증 헤더 구성
          const authHeaders = buildAuthHeaders(conn.auth_type || 'none', conn.auth_config || {});

          // API 호출
          const response = await fetch(conn.url, {
            method: conn.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...authHeaders,
              ...(conn.headers || {}),
            },
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }

          const responseData = await response.json();

          // 데이터 추출
          const dataPath = conn.response_data_path || 'data';
          let dataArray = getNestedValue(responseData, dataPath);

          if (!Array.isArray(dataArray)) {
            dataArray = dataArray ? [dataArray] : [];
          }

          console.log(`Fetched ${dataArray.length} records from API`);

          // 필드 매핑 적용
          const fieldMappings = conn.field_mappings || [];
          let recordsCreated = 0;
          let recordsFailed = 0;

          if (conn.target_table && fieldMappings.length > 0) {
            // raw_imports에 원본 데이터 저장
            const { data: rawImport } = await supabase
              .from('raw_imports')
              .insert({
                org_id: conn.org_id,
                store_id: conn.store_id,
                user_id: conn.user_id,
                source_type: 'api',
                data_type: conn.target_table,
                file_name: `api_sync_${conn.name}_${new Date().toISOString()}.json`,
                row_count: dataArray.length,
                raw_data: dataArray,
                status: 'processing',
                api_connection_id: connection_id,
                sync_batch_id: batchId,
                api_response_meta: {
                  status_code: response.status,
                  content_type: response.headers.get('content-type'),
                  fetched_at: new Date().toISOString(),
                },
              })
              .select()
              .single();

            // 매핑된 데이터 생성
            const mappedRecords = dataArray.map((record: any) => {
              const mapped = applyFieldMappings(record, fieldMappings);
              return {
                ...mapped,
                org_id: conn.org_id,
                store_id: conn.store_id,
                user_id: conn.user_id,
              };
            });

            // 배치로 삽입
            const batchSize = 100;
            for (let i = 0; i < mappedRecords.length; i += batchSize) {
              const batch = mappedRecords.slice(i, i + batchSize);

              const { error: insertError } = await supabase
                .from(conn.target_table)
                .insert(batch);

              if (insertError) {
                console.error(`Batch insert error:`, insertError);
                recordsFailed += batch.length;
              } else {
                recordsCreated += batch.length;
              }
            }

            // raw_imports 상태 업데이트
            if (rawImport) {
              await supabase
                .from('raw_imports')
                .update({
                  status: recordsFailed > 0 ? 'partial' : 'completed',
                  completed_at: new Date().toISOString(),
                  progress: {
                    current: recordsCreated + recordsFailed,
                    total: dataArray.length,
                    percentage: 100,
                  },
                })
                .eq('id', rawImport.id);
            }
          }

          const duration = Date.now() - startTime;

          // 동기화 로그 업데이트
          if (syncLog) {
            await supabase
              .from('api_sync_logs')
              .update({
                completed_at: new Date().toISOString(),
                status: recordsFailed > 0 ? 'partial' : 'success',
                records_fetched: dataArray.length,
                records_created: recordsCreated,
                records_failed: recordsFailed,
                duration_ms: duration,
                response_status: response.status,
              })
              .eq('id', syncLog.id);
          }

          // 연결 상태 업데이트
          await supabase
            .from('api_connections')
            .update({
              status: recordsFailed > 0 ? 'error' : 'active',
              last_sync: new Date().toISOString(),
              total_records_synced: (conn.total_records_synced || 0) + recordsCreated,
              last_sync_duration_ms: duration,
              last_error: recordsFailed > 0 ? `${recordsFailed} records failed` : null,
            })
            .eq('id', connection_id);

          return new Response(
            JSON.stringify({
              success: true,
              batch_id: batchId,
              records_fetched: dataArray.length,
              records_created: recordsCreated,
              records_failed: recordsFailed,
              duration_ms: duration,
              message: `Sync completed: ${recordsCreated} records created`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (syncError: any) {
          console.error('Sync error:', syncError);

          const duration = Date.now() - startTime;

          // 동기화 로그 업데이트 (실패)
          if (syncLog) {
            await supabase
              .from('api_sync_logs')
              .update({
                completed_at: new Date().toISOString(),
                status: 'failed',
                error_message: syncError.message,
                duration_ms: duration,
              })
              .eq('id', syncLog.id);
          }

          // 연결 상태 업데이트 (오류)
          await supabase
            .from('api_connections')
            .update({
              status: 'error',
              last_error: syncError.message,
            })
            .eq('id', connection_id);

          return new Response(
            JSON.stringify({
              success: false,
              error: syncError.message,
              duration_ms: duration,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // ======================================================================
      // 3. 필드 매핑 미리보기
      // ======================================================================
      case 'preview': {
        const { sample_data, field_mappings } = body;

        if (!sample_data || !Array.isArray(sample_data)) {
          return new Response(
            JSON.stringify({ success: false, error: 'sample_data array is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!field_mappings || !Array.isArray(field_mappings)) {
          return new Response(
            JSON.stringify({ success: false, error: 'field_mappings array is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 샘플 데이터에 매핑 적용
        const previewResults = sample_data.slice(0, 5).map((record, index) => ({
          original: record,
          mapped: applyFieldMappings(record, field_mappings),
        }));

        return new Response(
          JSON.stringify({
            success: true,
            preview: previewResults,
            field_count: field_mappings.length,
            sample_count: previewResults.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ======================================================================
      // 4. 매핑 템플릿 적용
      // ======================================================================
      case 'apply-template': {
        const { provider, data_category, target_table } = body;

        if (!provider || !data_category) {
          return new Response(
            JSON.stringify({ success: false, error: 'provider and data_category are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 템플릿 조회
        const { data: template, error: templateError } = await supabase
          .from('api_mapping_templates')
          .select('*')
          .eq('provider', provider)
          .eq('data_category', data_category)
          .eq('is_active', true)
          .order('is_official', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (templateError) {
          return new Response(
            JSON.stringify({ success: false, error: templateError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!template) {
          // 템플릿이 없으면 generic 템플릿 시도
          const { data: genericTemplate } = await supabase
            .from('api_mapping_templates')
            .select('*')
            .eq('provider', 'generic')
            .eq('data_category', data_category)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (genericTemplate) {
            return new Response(
              JSON.stringify({
                success: true,
                template: genericTemplate,
                is_generic: true,
                message: `Using generic template for ${data_category}`,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: `No template found for ${provider}/${data_category}`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            template,
            is_official: template.is_official,
            message: `Template "${template.name}" loaded`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ======================================================================
      // 알 수 없는 액션
      // ======================================================================
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: ['test', 'sync', 'preview', 'apply-template'],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('API Connector Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
