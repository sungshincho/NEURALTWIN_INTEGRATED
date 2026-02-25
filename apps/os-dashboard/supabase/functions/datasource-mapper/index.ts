import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

/**
 * datasource-mapper Edge Function
 *
 * 데이터소스 등록, 스키마 추론, 매핑 관리를 담당하는 통합 함수
 *
 * Actions:
 * - register: 새 데이터소스 등록
 * - sync: 데이터소스 동기화 실행
 * - infer_schema: 데이터소스 스키마 자동 추론
 * - create_mapping: 엔티티/관계 매핑 생성
 * - get_mappings: 매핑 목록 조회
 * - delete_mapping: 매핑 삭제
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ActionType = 'register' | 'sync' | 'infer_schema' | 'create_mapping' | 'get_mappings' | 'delete_mapping' | 'get_sources';

interface DataSourceMapperRequest {
  action: ActionType;
  data_source_id?: string;
  config?: {
    store_id?: string;
    name?: string;
    description?: string;
    type?: string;
    connection_config?: Record<string, any>;
    entity_mappings?: EntityMappingConfig[];
    relation_mappings?: RelationMappingConfig[];
  };
}

interface EntityMappingConfig {
  source_table: string;
  filter_condition?: string;
  target_entity_type_id: string;
  property_mappings: PropertyMapping[];
  label_template: string;
}

interface RelationMappingConfig {
  source_table: string;
  target_relation_type_id: string;
  source_entity_resolver: EntityResolver;
  target_entity_resolver: EntityResolver;
  property_mappings?: PropertyMapping[];
}

interface PropertyMapping {
  source_column: string;
  target_property: string;
  transform?: string;
}

interface EntityResolver {
  type: 'column' | 'lookup' | 'fixed';
  column?: string;
  lookup_table?: string;
  lookup_column?: string;
  fixed_value?: string;
}

// 데이터소스 타입별 기본 스키마 템플릿
const schemaTemplates: Record<string, any> = {
  pos: {
    tables: [
      {
        name: 'transactions',
        display_name: '거래 데이터',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true, description: '거래 ID' },
          { name: 'timestamp', type: 'datetime', description: '거래 시간' },
          { name: 'total_amount', type: 'number', description: '총 금액' },
          { name: 'payment_method', type: 'string', description: '결제 수단' },
          { name: 'customer_id', type: 'string', description: '고객 ID' },
        ],
      },
      {
        name: 'line_items',
        display_name: '거래 항목',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'transaction_id', type: 'string', isForeignKey: true },
          { name: 'product_id', type: 'string', isForeignKey: true },
          { name: 'quantity', type: 'number' },
          { name: 'unit_price', type: 'number' },
          { name: 'discount', type: 'number' },
        ],
      },
      {
        name: 'products',
        display_name: '상품 마스터',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'price', type: 'number' },
          { name: 'sku', type: 'string' },
        ],
      },
    ],
  },
  wifi: {
    tables: [
      {
        name: 'device_detections',
        display_name: '기기 탐지',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'mac_address', type: 'string', description: 'MAC 주소 (해시)' },
          { name: 'timestamp', type: 'datetime' },
          { name: 'sensor_id', type: 'string' },
          { name: 'signal_strength', type: 'number' },
        ],
      },
      {
        name: 'sensors',
        display_name: '센서 위치',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'zone_id', type: 'string' },
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' },
        ],
      },
    ],
  },
  camera: {
    tables: [
      {
        name: 'person_tracks',
        display_name: '사람 추적',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'track_id', type: 'string' },
          { name: 'timestamp', type: 'datetime' },
          { name: 'camera_id', type: 'string' },
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' },
          { name: 'confidence', type: 'number' },
        ],
      },
      {
        name: 'zone_entries',
        display_name: '구역 진입',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'track_id', type: 'string' },
          { name: 'zone_id', type: 'string' },
          { name: 'entry_time', type: 'datetime' },
          { name: 'exit_time', type: 'datetime' },
          { name: 'dwell_seconds', type: 'number' },
        ],
      },
    ],
  },
  inventory: {
    tables: [
      {
        name: 'stock_levels',
        display_name: '재고 수준',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'product_id', type: 'string' },
          { name: 'quantity', type: 'number' },
          { name: 'location', type: 'string' },
          { name: 'last_updated', type: 'datetime' },
        ],
      },
      {
        name: 'stock_movements',
        display_name: '재고 이동',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'product_id', type: 'string' },
          { name: 'movement_type', type: 'string' },
          { name: 'quantity', type: 'number' },
          { name: 'timestamp', type: 'datetime' },
        ],
      },
    ],
  },
  crm: {
    tables: [
      {
        name: 'customers',
        display_name: '고객 정보',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'phone', type: 'string' },
          { name: 'segment', type: 'string' },
          { name: 'lifetime_value', type: 'number' },
        ],
      },
      {
        name: 'customer_events',
        display_name: '고객 이벤트',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'customer_id', type: 'string' },
          { name: 'event_type', type: 'string' },
          { name: 'timestamp', type: 'datetime' },
          { name: 'properties', type: 'json' },
        ],
      },
    ],
  },
  manual: {
    tables: [
      {
        name: 'custom_data',
        display_name: '사용자 정의 데이터',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'data', type: 'json' },
          { name: 'created_at', type: 'datetime' },
        ],
      },
    ],
  },
  external: {
    tables: [],
  },
  sensor: {
    tables: [
      {
        name: 'sensor_readings',
        display_name: '센서 측정값',
        columns: [
          { name: 'id', type: 'string', isPrimaryKey: true },
          { name: 'sensor_id', type: 'string' },
          { name: 'reading_type', type: 'string' },
          { name: 'value', type: 'number' },
          { name: 'timestamp', type: 'datetime' },
        ],
      },
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DataSourceMapperRequest = await req.json();
    const { action, data_source_id, config = {} } = body;

    console.log(`[datasource-mapper] Action: ${action}, User: ${user.id}`);

    let result: any;

    switch (action) {
      case 'register':
        result = await handleRegister(supabase, user.id, config);
        break;

      case 'sync':
        result = await handleSync(supabase, user.id, data_source_id!);
        break;

      case 'infer_schema':
        result = await handleInferSchema(supabase, user.id, data_source_id!);
        break;

      case 'create_mapping':
        result = await handleCreateMapping(supabase, user.id, data_source_id!, config);
        break;

      case 'get_mappings':
        result = await handleGetMappings(supabase, user.id, data_source_id!);
        break;

      case 'delete_mapping':
        result = await handleDeleteMapping(supabase, user.id, config);
        break;

      case 'get_sources':
        result = await handleGetSources(supabase, user.id, config.store_id);
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[datasource-mapper] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== Action Handlers ==============

async function handleRegister(supabase: any, userId: string, config: any) {
  const { store_id, name, description, type, connection_config = {} } = config;

  if (!name || !type) {
    throw new Error('name and type are required');
  }

  const { data: dataSource, error } = await supabase
    .from('data_sources')
    .insert({
      user_id: userId,
      store_id,
      name,
      description,
      type,
      connection_config,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  // 스키마 템플릿 자동 적용
  const schema = schemaTemplates[type] || { tables: [] };
  if (schema.tables.length > 0) {
    await supabase
      .from('data_sources')
      .update({ schema_definition: schema })
      .eq('id', dataSource.id);

    // 테이블 정의 저장
    for (const table of schema.tables) {
      await supabase.from('data_source_tables').insert({
        data_source_id: dataSource.id,
        table_name: table.name,
        display_name: table.display_name,
        columns: table.columns,
      });
    }
  }

  return {
    success: true,
    data_source_id: dataSource.id,
    schema_applied: schema.tables.length > 0,
  };
}

async function handleSync(supabase: any, userId: string, dataSourceId: string) {
  // 데이터소스 확인
  const { data: source, error: sourceError } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (sourceError || !source) {
    throw new Error('Data source not found');
  }

  // 동기화 상태 업데이트
  await supabase
    .from('data_sources')
    .update({ status: 'syncing' })
    .eq('id', dataSourceId);

  // 동기화 로그 생성
  const { data: syncLog, error: logError } = await supabase
    .from('data_source_sync_logs')
    .insert({
      data_source_id: dataSourceId,
      triggered_by: 'manual',
      status: 'running',
    })
    .select()
    .single();

  if (logError) throw logError;

  // 실제 동기화 로직 (비동기 처리)
  // TODO: 실제 데이터 동기화 구현
  // 현재는 시뮬레이션

  // 동기화 완료 처리
  await supabase
    .from('data_source_sync_logs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      entities_created: 0,
      entities_updated: 0,
      relations_created: 0,
    })
    .eq('id', syncLog.id);

  await supabase
    .from('data_sources')
    .update({
      status: 'active',
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success',
    })
    .eq('id', dataSourceId);

  return {
    success: true,
    sync_log_id: syncLog.id,
    message: 'Sync completed',
  };
}

async function handleInferSchema(supabase: any, userId: string, dataSourceId: string) {
  // 데이터소스 조회
  const { data: source, error: sourceError } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (sourceError || !source) {
    throw new Error('Data source not found');
  }

  // 타입별 스키마 템플릿 반환
  const schema = schemaTemplates[source.type] || { tables: [] };

  // 스키마 정의 저장
  await supabase
    .from('data_sources')
    .update({ schema_definition: schema })
    .eq('id', dataSourceId);

  // 기존 테이블 정의 삭제 후 재생성
  await supabase
    .from('data_source_tables')
    .delete()
    .eq('data_source_id', dataSourceId);

  for (const table of schema.tables) {
    await supabase.from('data_source_tables').insert({
      data_source_id: dataSourceId,
      table_name: table.name,
      display_name: table.display_name,
      columns: table.columns,
    });
  }

  return {
    success: true,
    schema,
    tables_count: schema.tables.length,
  };
}

async function handleCreateMapping(
  supabase: any,
  userId: string,
  dataSourceId: string,
  config: any
) {
  const { entity_mappings = [], relation_mappings = [] } = config;

  // 데이터소스 확인
  const { data: source, error: sourceError } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (sourceError || !source) {
    throw new Error('Data source not found');
  }

  let entityMappingsCreated = 0;
  let relationMappingsCreated = 0;

  // 엔티티 매핑 생성
  for (const mapping of entity_mappings) {
    const { error } = await supabase.from('ontology_entity_mappings').insert({
      data_source_id: dataSourceId,
      source_table: mapping.source_table,
      filter_condition: mapping.filter_condition,
      target_entity_type_id: mapping.target_entity_type_id,
      property_mappings: mapping.property_mappings || [],
      label_template: mapping.label_template || '${id}',
      is_active: true,
    });

    if (!error) entityMappingsCreated++;
  }

  // 관계 매핑 생성
  for (const mapping of relation_mappings) {
    const { error } = await supabase.from('ontology_relation_mappings').insert({
      data_source_id: dataSourceId,
      source_table: mapping.source_table,
      target_relation_type_id: mapping.target_relation_type_id,
      source_entity_resolver: mapping.source_entity_resolver,
      target_entity_resolver: mapping.target_entity_resolver,
      property_mappings: mapping.property_mappings || [],
      is_active: true,
    });

    if (!error) relationMappingsCreated++;
  }

  return {
    success: true,
    entity_mappings_created: entityMappingsCreated,
    relation_mappings_created: relationMappingsCreated,
  };
}

async function handleGetMappings(supabase: any, userId: string, dataSourceId: string) {
  // 데이터소스 확인
  const { data: source, error: sourceError } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (sourceError || !source) {
    throw new Error('Data source not found');
  }

  // 엔티티 매핑 조회
  const { data: entityMappings } = await supabase
    .from('ontology_entity_mappings')
    .select(`
      *,
      target_entity_type:ontology_entity_types(id, name, label)
    `)
    .eq('data_source_id', dataSourceId);

  // 관계 매핑 조회
  const { data: relationMappings } = await supabase
    .from('ontology_relation_mappings')
    .select(`
      *,
      target_relation_type:ontology_relation_types(id, name, label)
    `)
    .eq('data_source_id', dataSourceId);

  return {
    success: true,
    entity_mappings: entityMappings || [],
    relation_mappings: relationMappings || [],
  };
}

async function handleDeleteMapping(supabase: any, userId: string, config: any) {
  const { mapping_id, mapping_type } = config;

  if (!mapping_id || !mapping_type) {
    throw new Error('mapping_id and mapping_type are required');
  }

  const table = mapping_type === 'entity'
    ? 'ontology_entity_mappings'
    : 'ontology_relation_mappings';

  // 매핑이 사용자의 데이터소스에 속하는지 확인
  const { data: mapping, error: mappingError } = await supabase
    .from(table)
    .select(`
      id,
      data_source:data_sources(user_id)
    `)
    .eq('id', mapping_id)
    .single();

  if (mappingError || !mapping || mapping.data_source?.user_id !== userId) {
    throw new Error('Mapping not found or access denied');
  }

  // 삭제
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('id', mapping_id);

  if (deleteError) throw deleteError;

  return {
    success: true,
    deleted_mapping_id: mapping_id,
  };
}

async function handleGetSources(supabase: any, userId: string, storeId?: string) {
  let query = supabase
    .from('data_sources')
    .select(`
      *,
      tables:data_source_tables(*)
    `)
    .eq('user_id', userId);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return {
    success: true,
    data_sources: data || [],
  };
}
