import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Unified ETL Function
 *
 * Consolidates 4 ETL functions into a single endpoint:
 * - raw_to_l2: Process raw CSV data into L2 fact/dimension tables
 * - l1_to_l2: Transform L1 data into L2 event tables
 * - l2_to_l3: Aggregate L2 data into L3 summary tables
 * - schema: Process data with ontology entity/relation mappings
 * - full_pipeline: Run L1→L2 and L2→L3 sequentially
 */

interface UnifiedETLRequest {
  etl_type: 'raw_to_l2' | 'l1_to_l2' | 'l2_to_l3' | 'schema' | 'full_pipeline';
  // Common parameters
  org_id?: string;
  store_id?: string;
  // Date range parameters
  date?: string;
  date_from?: string;
  date_to?: string;
  // raw_to_l2 specific
  import_id?: string;
  data_type?: string;
  raw_data?: any[];
  source_name?: string;  // 파일명 또는 소스 식별자
  source_type?: 'csv' | 'api' | 'webhook' | 'manual';  // 데이터 소스 유형
  // l1_to_l2 / l2_to_l3 specific
  target_tables?: string[];
  // schema ETL specific
  entity_mappings?: Array<{
    entity_type_id: string;
    column_mappings: Record<string, string>;
    label_template: string;
  }>;
  relation_mappings?: Array<{
    relation_type_id: string;
    source_entity_type_id: string;
    target_entity_type_id: string;
    source_key: string;
    target_key: string;
    properties?: Record<string, string>;
  }>;
  options?: Record<string, any>;
}

// ============================================================================
// raw_imports 테이블 연동 (CTO 요구사항: 원본 데이터 보존)
// ============================================================================

interface RawImportRecord {
  org_id?: string;
  store_id?: string;
  user_id: string;
  source_type: 'csv' | 'api' | 'webhook' | 'manual';
  source_name?: string;
  file_path?: string;
  row_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_type?: string;
  metadata: {
    columns?: string[];
    sample_rows?: Record<string, any>[];
    etl_version?: string;
    [key: string]: any;
  };
  raw_data?: any[];
}

async function createRawImport(
  supabase: any,
  record: RawImportRecord
): Promise<{ id: string | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('raw_imports')
      .insert({
        org_id: record.org_id || null,
        store_id: record.store_id || null,
        user_id: record.user_id,
        source_type: record.source_type,
        source_name: record.source_name || null,
        file_path: record.file_path || null,
        row_count: record.row_count,
        status: record.status,
        data_type: record.data_type || null,
        metadata: record.metadata,
        raw_data: record.raw_data || null,
        etl_version: '2.0',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[raw_imports] INSERT failed:', error.message);
      return { id: null, error: error.message };
    }

    console.log(`[raw_imports] Created: ${data.id}`);
    return { id: data.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[raw_imports] Exception:', errorMsg);
    return { id: null, error: errorMsg };
  }
}

async function updateRawImportStatus(
  supabase: any,
  id: string,
  status: 'processing' | 'completed' | 'failed',
  additionalData?: {
    row_count?: number;
    error_message?: string;
    error_details?: any;
    progress?: { current: number; total: number; percentage: number };
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
    };

    if (status === 'processing') {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (additionalData?.row_count !== undefined) {
      updateData.row_count = additionalData.row_count;
    }

    if (additionalData?.error_message) {
      updateData.error_message = additionalData.error_message;
    }

    if (additionalData?.error_details) {
      updateData.error_details = additionalData.error_details;
    }

    if (additionalData?.progress) {
      updateData.progress = additionalData.progress;
    }

    await supabase
      .from('raw_imports')
      .update(updateData)
      .eq('id', id);

    console.log(`[raw_imports] Updated status: ${id} -> ${status}`);
  } catch (err) {
    console.error('[raw_imports] Status update failed:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if using service role key (for internal calls from scheduler)
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === supabaseServiceKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string | null = null;

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const body: UnifiedETLRequest = await req.json();
    console.log(`[unified-etl] Starting ETL type: ${body.etl_type}`);

    let result;
    switch (body.etl_type) {
      case 'raw_to_l2':
        result = await processRawToL2(supabase, userId, body);
        break;
      case 'l1_to_l2':
        result = await processL1ToL2(supabase, body);
        break;
      case 'l2_to_l3':
        result = await processL2ToL3(supabase, body);
        break;
      case 'schema':
        result = await processSchemaETL(supabase, userId!, body);
        break;
      case 'full_pipeline':
        result = await runFullPipeline(supabase, body);
        break;
      default:
        throw new Error(`Invalid ETL type: ${body.etl_type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[unified-etl] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// ETL Type: raw_to_l2 - Process raw CSV data into L2 tables
// ============================================================================

const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  customers: {
    'customer_id': 'id', 'id': 'id', 'name': 'name', 'customer_name': 'name',
    'email': 'email', 'phone': 'phone', 'gender': 'gender', 'age': 'age',
    'age_group': 'age_group', 'membership_tier': 'membership_tier',
  },
  products: {
    'product_id': 'id', 'id': 'id', 'name': 'product_name', 'product_name': 'product_name',
    'category': 'category', 'price': 'price', 'cost_price': 'cost_price',
    'stock': 'stock', 'sku': 'sku', 'brand': 'brand',
  },
  purchases: {
    'purchase_id': 'id', 'transaction_id': 'id', 'id': 'id', 'customer_id': 'customer_id',
    'product_id': 'product_id', 'quantity': 'quantity', 'unit_price': 'unit_price',
    'total_price': 'total_price', 'purchase_date': 'purchase_date', 'payment_method': 'payment_method',
  },
  visits: {
    'visit_id': 'id', 'id': 'id', 'customer_id': 'customer_id', 'visit_date': 'visit_date',
    'duration_minutes': 'duration_minutes', 'zones_visited': 'zones_visited',
  },
  staff: {
    'staff_id': 'id', 'id': 'id', 'name': 'name', 'role': 'role',
    'department': 'department', 'hire_date': 'hire_date', 'email': 'email',
  },
};

function mapFields(record: any, dataType: string): any {
  const mapping = FIELD_MAPPINGS[dataType] || {};
  const mapped: any = {};
  for (const [csvCol, value] of Object.entries(record)) {
    const dbCol = mapping[csvCol] || mapping[csvCol.toLowerCase()] || csvCol;
    mapped[dbCol] = value;
  }
  return mapped;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value).replace(/[,]/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(value: any): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function ensureUUID(value: any): string {
  if (!value) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(String(value))) return String(value);
  return crypto.randomUUID();
}

async function processRawToL2(supabase: any, userId: string | null, request: UnifiedETLRequest) {
  const { import_id, store_id, org_id, data_type, source_name, source_type } = request;
  let { raw_data } = request;
  let sourceName = source_name;

  console.log(`[raw_to_l2] Processing import: ${import_id}, type: ${data_type}`);

  // Load raw_data from import if not provided
  if (!raw_data && import_id) {
    const { data: importData, error: importError } = await supabase
      .from('user_data_imports')
      .select('raw_data, file_name')
      .eq('id', import_id)
      .single();

    if (importError || !importData) {
      throw new Error(`Import data not found: ${import_id}`);
    }
    raw_data = importData.raw_data;
    sourceName = sourceName || importData.file_name;
  }

  if (!Array.isArray(raw_data) || raw_data.length === 0) {
    throw new Error('No data to process');
  }

  // ============================================================================
  // raw_imports 기록 시작 (CTO 요구사항: 원본 데이터 보존)
  // ============================================================================
  let rawImportId: string | null = null;

  if (userId) {
    const rawImportResult = await createRawImport(supabase, {
      org_id: org_id,
      store_id: store_id,
      user_id: userId,
      source_type: source_type || 'csv',
      source_name: sourceName,
      row_count: raw_data.length,
      status: 'pending',
      data_type: data_type,
      metadata: {
        columns: Object.keys(raw_data[0] || {}),
        sample_rows: raw_data.slice(0, 3),  // 첫 3행만 샘플로 저장
        etl_version: '2.0',
        import_id: import_id || null,
      },
      raw_data: raw_data,  // 전체 원본 데이터 저장
    });

    rawImportId = rawImportResult.id;

    if (rawImportId) {
      // 처리 시작 상태로 변경
      await updateRawImportStatus(supabase, rawImportId, 'processing', {
        progress: { current: 0, total: raw_data.length, percentage: 0 },
      });
    }
  }

  const result: any = {
    success: false,
    data_type,
    records_processed: raw_data.length,
    records_inserted: 0,
    errors: [],
    tables_affected: [],
    raw_import_id: rawImportId,  // lineage 추적용
  };

  // Process based on data type
  if (data_type === 'customers') {
    const customersToUpsert = raw_data.map((record, idx) => {
      const mapped = mapFields(record, 'customers');
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id,
        store_id,
        name: mapped.name || `Customer ${idx + 1}`,
        email: mapped.email || null,
        phone: mapped.phone || null,
        gender: mapped.gender || null,
        age: parseNumber(mapped.age),
        age_group: mapped.age_group || null,
        total_visits: parseNumber(mapped.total_visits) || 0,
        total_spent: parseNumber(mapped.total_spent) || 0,
        membership_tier: mapped.membership_tier || 'basic',
      };
    });

    const { data: inserted, error } = await supabase
      .from('customers')
      .upsert(customersToUpsert, { onConflict: 'id' })
      .select();

    if (error) result.errors.push(error.message);
    else result.records_inserted = inserted?.length || 0;
    result.tables_affected = ['customers'];
  } else if (data_type === 'products') {
    const productsToUpsert = raw_data.map((record, idx) => {
      const mapped = mapFields(record, 'products');
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id,
        store_id,
        product_name: mapped.product_name || `Product ${idx + 1}`,
        category: mapped.category || 'uncategorized',
        price: parseNumber(mapped.price) || 0,
        stock: parseNumber(mapped.stock) || 0,
        sku: mapped.sku || null,
        brand: mapped.brand || null,
      };
    });

    const { data: inserted, error } = await supabase
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'id' })
      .select();

    if (error) result.errors.push(error.message);
    else result.records_inserted = inserted?.length || 0;
    result.tables_affected = ['products'];
  }
  // Add more data types as needed...

  result.success = result.errors.length === 0 || result.records_inserted > 0;

  // ============================================================================
  // raw_imports 상태 업데이트 (완료 또는 실패)
  // ============================================================================
  if (rawImportId) {
    if (result.success) {
      await updateRawImportStatus(supabase, rawImportId, 'completed', {
        row_count: result.records_inserted,
        progress: { current: result.records_inserted, total: raw_data.length, percentage: 100 },
      });
    } else {
      await updateRawImportStatus(supabase, rawImportId, 'failed', {
        error_message: result.errors.join('; '),
        error_details: { errors: result.errors, records_attempted: raw_data.length },
      });
    }
  }

  return result;
}

// ============================================================================
// ETL Type: l1_to_l2 - Transform L1 data into L2 event tables
// ============================================================================

async function processL1ToL2(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date_from, date_to, target_tables } = request;

  console.log(`[l1_to_l2] Processing org: ${org_id}, store: ${store_id}`);

  const results: Record<string, { processed: number; errors: number }> = {};
  const targetSet = new Set(target_tables || ['line_items', 'funnel_events', 'zone_events', 'zones_dim']);

  // Process purchases → line_items
  if (targetSet.has('line_items')) {
    let query = supabase.from('purchases').select('*');
    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);
    if (date_from) query = query.gte('purchase_date', date_from);
    if (date_to) query = query.lte('purchase_date', date_to);

    const { data: purchases, error } = await query;
    if (error) {
      results.line_items = { processed: 0, errors: 1 };
    } else if (purchases && purchases.length > 0) {
      const lineItems = purchases.map((p: any) => ({
        transaction_id: p.id,
        purchase_id: p.id,
        product_id: p.product_id,
        customer_id: p.customer_id,
        store_id: p.store_id,
        org_id: p.org_id,
        quantity: p.quantity || 1,
        unit_price: p.unit_price || 0,
        line_total: p.total_price || (p.unit_price * (p.quantity || 1)),
        transaction_date: p.purchase_date,
        transaction_hour: p.purchase_date ? new Date(p.purchase_date).getHours() : null,
      }));

      const { error: insertError } = await supabase.from('line_items').insert(lineItems);
      results.line_items = { processed: lineItems.length, errors: insertError ? 1 : 0 };
    } else {
      results.line_items = { processed: 0, errors: 0 };
    }
  }

  // Process visits → funnel_events
  if (targetSet.has('funnel_events')) {
    let query = supabase.from('visits').select('*');
    if (org_id) query = query.eq('org_id', org_id);
    if (store_id) query = query.eq('store_id', store_id);
    if (date_from) query = query.gte('visit_date', date_from);
    if (date_to) query = query.lte('visit_date', date_to);

    const { data: visits, error } = await query;
    if (error) {
      results.funnel_events = { processed: 0, errors: 1 };
    } else if (visits && visits.length > 0) {
      const funnelEvents: any[] = [];
      for (const visit of visits) {
        const visitDate = visit.visit_date || visit.created_at;
        funnelEvents.push({
          store_id: visit.store_id,
          org_id: visit.org_id,
          customer_id: visit.customer_id,
          visitor_id: visit.visitor_id || visit.id,
          session_id: visit.session_id || visit.id,
          event_type: 'entry',
          event_date: visitDate?.split('T')[0],
          event_hour: visitDate ? new Date(visitDate).getHours() : null,
          event_timestamp: visitDate,
        });
      }

      const { error: insertError } = await supabase
        .from('funnel_events')
        .upsert(funnelEvents, { onConflict: 'id', ignoreDuplicates: true });
      results.funnel_events = { processed: funnelEvents.length, errors: insertError ? 1 : 0 };
    } else {
      results.funnel_events = { processed: 0, errors: 0 };
    }
  }

  return {
    success: true,
    etl_type: 'l1_to_l2',
    results,
    processed_at: new Date().toISOString(),
  };
}

// ============================================================================
// ETL Type: l2_to_l3 - Aggregate L2 data into L3 summary tables
// ============================================================================

// source_trace 구조 정의
interface SourceTrace {
  raw_import_ids?: string[];
  source_tables: string[];
  date_range: { start: string; end: string };
  source_record_counts?: Record<string, number>;
  etl_run_id: string;
  etl_function: string;
  calculated_at: string;
}

// ETL 실행 기록 생성
async function createETLRun(
  supabase: any,
  params: {
    org_id?: string;
    store_id?: string;
    etl_function: string;
    date_range_start?: string;
    date_range_end?: string;
    raw_import_ids?: string[];
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('etl_runs')
      .insert({
        org_id: params.org_id || null,
        store_id: params.store_id || null,
        etl_function: params.etl_function,
        etl_version: '2.0',
        date_range_start: params.date_range_start || null,
        date_range_end: params.date_range_end || null,
        raw_import_ids: params.raw_import_ids || [],
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[etl_runs] CREATE failed:', error.message);
      return null;
    }

    console.log(`[etl_runs] Created: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error('[etl_runs] Exception:', err);
    return null;
  }
}

// ETL 실행 상태 업데이트
async function updateETLRunStatus(
  supabase: any,
  id: string,
  status: 'completed' | 'failed' | 'partial',
  stats?: {
    input_record_count?: number;
    output_record_count?: number;
    error_message?: string;
    error_details?: any;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const startedAt = new Date();
    const completedAt = new Date();
    const duration_ms = completedAt.getTime() - startedAt.getTime();

    await supabase
      .from('etl_runs')
      .update({
        status,
        completed_at: completedAt.toISOString(),
        duration_ms,
        input_record_count: stats?.input_record_count || 0,
        output_record_count: stats?.output_record_count || 0,
        error_message: stats?.error_message || null,
        error_details: stats?.error_details || null,
        metadata: stats?.metadata || {},
      })
      .eq('id', id);

    console.log(`[etl_runs] Updated: ${id} -> ${status}`);
  } catch (err) {
    console.error('[etl_runs] Status update failed:', err);
  }
}

async function processL2ToL3(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date, date_from, date_to, target_tables } = request;
  const targetDate = date || new Date().toISOString().split('T')[0];

  console.log(`[l2_to_l3] Aggregating for date: ${targetDate}, org: ${org_id}`);

  const results: Record<string, { processed: number; errors: number }> = {};
  const targetSet = new Set(target_tables || ['daily_kpis_agg', 'hourly_metrics', 'zone_daily_metrics']);

  // Get stores to aggregate
  let storeQuery = supabase.from('stores').select('id, org_id, area_sqm');
  if (org_id) storeQuery = storeQuery.eq('org_id', org_id);
  if (store_id) storeQuery = storeQuery.eq('id', store_id);

  const { data: stores } = await storeQuery;
  if (!stores || stores.length === 0) {
    return { success: true, etl_type: 'l2_to_l3', results, processed_at: new Date().toISOString() };
  }

  const dates = getDateRange(targetDate, date_from, date_to);
  const dateRangeStart = dates[0];
  const dateRangeEnd = dates[dates.length - 1];

  // ============================================================================
  // ETL Run 기록 시작 (Data Lineage 추적)
  // ============================================================================
  const etlRunId = await createETLRun(supabase, {
    org_id,
    store_id,
    etl_function: 'unified-etl:l2_to_l3',
    date_range_start: dateRangeStart,
    date_range_end: dateRangeEnd,
  });

  // source_trace 기본 구조
  const baseSourceTrace: Omit<SourceTrace, 'source_record_counts'> = {
    source_tables: ['line_items', 'funnel_events'],
    date_range: { start: dateRangeStart, end: dateRangeEnd },
    etl_run_id: etlRunId || crypto.randomUUID(),
    etl_function: 'unified-etl:l2_to_l3',
    calculated_at: new Date().toISOString(),
  };

  let totalInputRecords = 0;
  let totalOutputRecords = 0;

  // Aggregate daily_kpis_agg
  if (targetSet.has('daily_kpis_agg')) {
    const aggregations: any[] = [];

    for (const date of dates) {
      for (const store of stores) {
        const { data: lineItems } = await supabase
          .from('line_items')
          .select('*')
          .eq('store_id', store.id)
          .eq('transaction_date', date);

        const { data: funnelEvents } = await supabase
          .from('funnel_events')
          .select('*')
          .eq('store_id', store.id)
          .eq('event_date', date);

        const lineItemCount = (lineItems || []).length;
        const funnelEventCount = (funnelEvents || []).length;
        totalInputRecords += lineItemCount + funnelEventCount;

        const totalRevenue = (lineItems || []).reduce((sum: number, li: any) => sum + (li.line_total || 0), 0);
        const totalTransactions = new Set((lineItems || []).map((li: any) => li.transaction_id)).size;
        const entryEvents = (funnelEvents || []).filter((e: any) => e.event_type === 'entry');
        const totalVisitors = entryEvents.length;

        // source_trace 포함한 집계 레코드
        const sourceTrace: SourceTrace = {
          ...baseSourceTrace,
          source_record_counts: {
            line_items: lineItemCount,
            funnel_events: funnelEventCount,
          },
        };

        aggregations.push({
          date,
          store_id: store.id,
          org_id: store.org_id,
          total_revenue: totalRevenue,
          total_transactions: totalTransactions,
          total_visitors: totalVisitors,
          conversion_rate: totalVisitors > 0 ? (totalTransactions / totalVisitors) * 100 : 0,
          avg_transaction_value: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          calculated_at: new Date().toISOString(),
          source_trace: sourceTrace,  // Data Lineage 정보 추가
        });
      }
    }

    if (aggregations.length > 0) {
      const { error } = await supabase
        .from('daily_kpis_agg')
        .upsert(aggregations, { onConflict: 'date,store_id', ignoreDuplicates: false });
      results.daily_kpis_agg = { processed: aggregations.length, errors: error ? 1 : 0 };
      totalOutputRecords += aggregations.length;
    } else {
      results.daily_kpis_agg = { processed: 0, errors: 0 };
    }
  }

  // Aggregate zone_daily_metrics (with source_trace)
  if (targetSet.has('zone_daily_metrics')) {
    const zoneAggregations: any[] = [];

    for (const date of dates) {
      for (const store of stores) {
        // Get zone transitions for this store and date
        const { data: zoneTransitions } = await supabase
          .from('zone_transitions')
          .select('*')
          .eq('store_id', store.id)
          .gte('transition_time', `${date}T00:00:00`)
          .lt('transition_time', `${date}T23:59:59`);

        const { data: zones } = await supabase
          .from('zones_dim')
          .select('id, zone_name')
          .eq('store_id', store.id);

        if (!zones || zones.length === 0) continue;

        const transitionCount = (zoneTransitions || []).length;
        totalInputRecords += transitionCount;

        // Aggregate metrics per zone
        for (const zone of zones) {
          const zoneVisits = (zoneTransitions || []).filter(
            (zt: any) => zt.to_zone_id === zone.id || zt.from_zone_id === zone.id
          );

          const avgDwellTime = zoneVisits.length > 0
            ? zoneVisits.reduce((sum: number, zt: any) => sum + (zt.duration_seconds || 0), 0) / zoneVisits.length
            : 0;

          const sourceTrace: SourceTrace = {
            ...baseSourceTrace,
            source_tables: ['zone_transitions', 'zones_dim'],
            source_record_counts: {
              zone_transitions: zoneVisits.length,
              zones_dim: 1,
            },
          };

          zoneAggregations.push({
            date,
            store_id: store.id,
            org_id: store.org_id,
            zone_id: zone.id,
            zone_name: zone.zone_name,
            visit_count: zoneVisits.length,
            avg_dwell_time: avgDwellTime,
            calculated_at: new Date().toISOString(),
            source_trace: sourceTrace,
          });
        }
      }
    }

    if (zoneAggregations.length > 0) {
      const { error } = await supabase
        .from('zone_daily_metrics')
        .upsert(zoneAggregations, { onConflict: 'date,zone_id', ignoreDuplicates: false });
      results.zone_daily_metrics = { processed: zoneAggregations.length, errors: error ? 1 : 0 };
      totalOutputRecords += zoneAggregations.length;
    } else {
      results.zone_daily_metrics = { processed: 0, errors: 0 };
    }
  }

  // ============================================================================
  // ETL Run 완료 기록
  // ============================================================================
  if (etlRunId) {
    const hasErrors = Object.values(results).some(r => r.errors > 0);
    await updateETLRunStatus(supabase, etlRunId, hasErrors ? 'partial' : 'completed', {
      input_record_count: totalInputRecords,
      output_record_count: totalOutputRecords,
      metadata: {
        target_tables: Array.from(targetSet),
        results,
        dates_processed: dates.length,
        stores_processed: stores.length,
      },
    });
  }

  return {
    success: true,
    etl_type: 'l2_to_l3',
    results,
    etl_run_id: etlRunId,  // lineage 추적용
    aggregated_at: new Date().toISOString(),
  };
}

function getDateRange(date?: string, date_from?: string, date_to?: string): string[] {
  if (date_from && date_to) {
    const dates: string[] = [];
    const start = new Date(date_from);
    const end = new Date(date_to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }
  return [date || new Date().toISOString().split('T')[0]];
}

// ============================================================================
// ETL Type: schema - Process data with ontology entity/relation mappings
// ============================================================================

async function processSchemaETL(supabase: any, userId: string, request: UnifiedETLRequest) {
  const { import_id, store_id, entity_mappings, relation_mappings } = request;

  console.log(`[schema] Processing import: ${import_id}, mappings: ${entity_mappings?.length || 0}`);

  // Get import data
  const { data: importData, error: importError } = await supabase
    .from('user_data_imports')
    .select('raw_data')
    .eq('id', import_id)
    .eq('user_id', userId)
    .single();

  if (importError || !importData) {
    throw new Error('Import data not found');
  }

  const rawData = importData.raw_data as any[];
  console.log(`[schema] Processing ${rawData.length} records`);

  const entityMap = new Map<string, string>();
  const labelCache = new Map<string, string>();
  let totalCreated = 0;
  let totalReused = 0;

  // Process entity mappings
  for (const mapping of entity_mappings || []) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mapping.entity_type_id);

    let entityType: any;
    if (isUUID) {
      // UUID로 조회 시 마스터 타입도 허용
      const { data } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('id', mapping.entity_type_id)
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`)
        .single();
      entityType = data;
    } else {
      // 이름으로 조회 시 사용자 타입 우선, 마스터 타입 폴백
      const { data: types } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('name', mapping.entity_type_id)
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

      if (types && types.length > 0) {
        // 사용자 타입이 마스터 타입보다 우선
        entityType = types.find((t: any) => t.user_id === userId) || types.find((t: any) => t.user_id === null);
      }
    }

    if (!entityType) {
      console.warn(`[schema] Entity type not found: ${mapping.entity_type_id}`);
      continue;
    }

    // Get existing entities for this type
    const { data: existingEntities } = await supabase
      .from('graph_entities')
      .select('id, label, properties')
      .eq('user_id', userId)
      .eq('store_id', store_id)
      .eq('entity_type_id', entityType.id);

    if (existingEntities) {
      for (const entity of existingEntities) {
        const cacheKey = `${entityType.id}:${entity.label}`;
        labelCache.set(cacheKey, entity.id);
      }
    }

    // Extract unique entities
    const uniqueEntities = new Map<string, any>();

    for (const record of rawData) {
      const properties: Record<string, any> = {};
      for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
        if (record[columnName] !== undefined) {
          properties[propName] = record[columnName];
        }
      }

      let label = mapping.label_template;
      for (const [propName, columnName] of Object.entries(mapping.column_mappings)) {
        const value = record[columnName];
        if (value !== undefined && value !== null) {
          label = label.replace(`{${propName}}`, String(value));
          label = label.replace(`{${columnName}}`, String(value));
        }
      }

      const cacheKey = `${entityType.id}:${label}`;

      if (labelCache.has(cacheKey)) {
        totalReused++;
        continue;
      }

      if (!uniqueEntities.has(cacheKey)) {
        uniqueEntities.set(cacheKey, {
          user_id: userId,
          store_id,
          entity_type_id: entityType.id,
          label,
          properties: { ...properties, source_import_id: import_id },
        });
      }
    }

    // Batch insert entities
    const entitiesToInsert = Array.from(uniqueEntities.values());
    if (entitiesToInsert.length > 0) {
      const { data: entities, error } = await supabase
        .from('graph_entities')
        .insert(entitiesToInsert)
        .select();

      if (!error && entities) {
        totalCreated += entities.length;
        entities.forEach((entity: any) => {
          const cacheKey = `${entity.entity_type_id}:${entity.label}`;
          labelCache.set(cacheKey, entity.id);
          entityMap.set(cacheKey, entity.id);
        });
      }
    }
  }

  // Process relation mappings
  let totalRelations = 0;
  const relationsToInsert: any[] = [];
  const relationSet = new Set<string>();

  for (const relMapping of relation_mappings || []) {
    // Get relation type UUID
    const isRelTypeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relMapping.relation_type_id);
    let relationTypeId = relMapping.relation_type_id;

    if (!isRelTypeUUID) {
      // 이름으로 조회 시 마스터 타입 + 사용자 타입 통합 조회
      const { data: relationTypes } = await supabase
        .from('ontology_relation_types')
        .select('id, user_id')
        .eq('name', relMapping.relation_type_id)
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

      if (relationTypes && relationTypes.length > 0) {
        // 사용자 타입이 마스터 타입보다 우선
        const userType = relationTypes.find((t: any) => t.user_id === userId);
        const masterType = relationTypes.find((t: any) => t.user_id === null);
        relationTypeId = userType?.id || masterType?.id;
      } else {
        continue;
      }
    }

    for (const record of rawData) {
      const sourceValue = record[relMapping.source_key];
      const targetValue = record[relMapping.target_key];

      // Find source and target entities
      let sourceEntityId: string | undefined;
      let targetEntityId: string | undefined;

      for (const [key, id] of entityMap.entries()) {
        if (key.includes(sourceValue)) sourceEntityId = id;
        if (key.includes(targetValue)) targetEntityId = id;
      }

      if (!sourceEntityId || !targetEntityId) continue;

      const relationKey = `${sourceEntityId}:${relationTypeId}:${targetEntityId}`;
      if (relationSet.has(relationKey)) continue;
      relationSet.add(relationKey);

      relationsToInsert.push({
        user_id: userId,
        store_id,
        relation_type_id: relationTypeId,
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        weight: 1.0,
      });
    }
  }

  if (relationsToInsert.length > 0) {
    const { data: relations, error } = await supabase
      .from('graph_relations')
      .insert(relationsToInsert)
      .select();

    if (!error && relations) {
      totalRelations = relations.length;
    }
  }

  return {
    success: true,
    etl_type: 'schema',
    entities_created: totalCreated,
    entities_reused: totalReused,
    relations_created: totalRelations,
    summary: {
      total_records: rawData.length,
      entity_types: entity_mappings?.length || 0,
      relation_types: relation_mappings?.length || 0,
    },
  };
}

// ============================================================================
// ETL Type: full_pipeline - Run L1→L2 and L2→L3 sequentially
// ============================================================================

async function runFullPipeline(supabase: any, request: UnifiedETLRequest) {
  const { org_id, store_id, date_from, date_to } = request;

  console.log(`[full_pipeline] Running for org: ${org_id}`);

  const l1Result = await processL1ToL2(supabase, {
    ...request,
    etl_type: 'l1_to_l2'
  });

  const l2Result = await processL2ToL3(supabase, {
    ...request,
    etl_type: 'l2_to_l3'
  });

  return {
    success: true,
    etl_type: 'full_pipeline',
    stages: {
      l1_to_l2: l1Result,
      l2_to_l3: l2Result,
    },
    timestamp: new Date().toISOString(),
  };
}
