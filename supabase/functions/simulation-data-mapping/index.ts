import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * simulation-data-mapping Edge Function
 * 
 * 시뮬레이션 허브에서 사용할 데이터 소스 매핑 상태 조회 및 관리
 * 
 * 기능:
 * 1. 임포트된 데이터 소스 조회 및 온톨로지 매핑 상태
 * 2. 프리셋 API 연동 상태 조회 (날씨, 경제지표 등)
 * 3. 고객 연동 API 상태 조회 (POS, CRM, ERP)
 * 4. 전체 매핑 건강도 계산
 */

interface DataSourceMappingRequest {
  action: 'get_status' | 'refresh_mapping' | 'connect_api' | 'disconnect_api' | 'get_api_config';
  store_id: string;
  api_id?: string;
  api_config?: {
    type: 'preset' | 'custom';
    name: string;
    endpoint?: string;
    credentials?: Record<string, string>;
  };
}

interface ImportedDataSource {
  id: string;
  name: string;
  table: string;
  recordCount: number;
  lastUpdated: string;
  status: 'connected' | 'pending' | 'error';
  mappedToOntology: boolean;
  ontologyEntityType?: string;
  ontologyEntityCount?: number;
}

interface PresetApiSource {
  id: string;
  name: string;
  description: string;
  provider: string;
  enabled: boolean;
  lastSync?: string;
  dataPoints?: number;
  adminOnly: boolean;
}

interface CustomApiSource {
  id: string;
  name: string;
  type: 'pos' | 'crm' | 'erp' | 'other';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  recordCount?: number;
}

interface OntologyMappingStatus {
  totalEntities: number;
  mappedEntities: number;
  totalRelations: number;
  unmappedFields: string[];
  healthScore: number;
}

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

    const body: DataSourceMappingRequest = await req.json();
    const { action, store_id } = body;

    console.log(`📊 Data source mapping: ${action} for store ${store_id}`);

    let result;
    switch (action) {
      case 'get_status':
        result = await getDataSourceStatus(supabase, store_id, user.id);
        break;
      case 'refresh_mapping':
        result = await refreshOntologyMapping(supabase, store_id, user.id);
        break;
      case 'connect_api':
        result = await connectApi(supabase, store_id, user.id, body.api_config!);
        break;
      case 'disconnect_api':
        result = await disconnectApi(supabase, store_id, user.id, body.api_id!);
        break;
      case 'get_api_config':
        result = await getApiConfig(supabase, store_id, user.id);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Data source mapping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * 전체 데이터 소스 상태 조회
 */
async function getDataSourceStatus(supabase: any, storeId: string, userId: string) {
  // 1. 임포트된 데이터 조회
  const importedData = await getImportedDataSources(supabase, storeId, userId);
  
  // 2. 프리셋 API 상태 조회
  const presetApis = await getPresetApiSources(supabase, storeId, userId);
  
  // 3. 고객 연동 API 상태 조회
  const customApis = await getCustomApiSources(supabase, storeId, userId);
  
  // 4. 온톨로지 매핑 상태 계산
  const mappingStatus = await calculateMappingStatus(supabase, storeId, userId, importedData);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    importedData,
    presetApis,
    customApis,
    mappingStatus,
  };
}

/**
 * 임포트된 데이터 소스 조회
 */
async function getImportedDataSources(supabase: any, storeId: string, userId: string): Promise<ImportedDataSource[]> {
  const sources: ImportedDataSource[] = [];

  // products 테이블
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // 온톨로지 엔티티에서 Product 타입 카운트
  const { data: productEntities } = await supabase
    .from('graph_entities')
    .select('id, ontology_entity_types!inner(name)')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('ontology_entity_types.name', 'Product');

  sources.push({
    id: 'products',
    name: '상품 데이터',
    table: 'products',
    recordCount: productsCount || 0,
    lastUpdated: new Date().toISOString(),
    status: productsCount > 0 ? 'connected' : 'pending',
    mappedToOntology: (productEntities?.length || 0) > 0,
    ontologyEntityType: 'Product',
    ontologyEntityCount: productEntities?.length || 0,
  });

  // customers 테이블
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { data: customerEntities } = await supabase
    .from('graph_entities')
    .select('id, ontology_entity_types!inner(name)')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('ontology_entity_types.name', 'Customer');

  sources.push({
    id: 'customers',
    name: '고객 데이터',
    table: 'customers',
    recordCount: customersCount || 0,
    lastUpdated: new Date().toISOString(),
    status: customersCount > 0 ? 'connected' : 'pending',
    mappedToOntology: (customerEntities?.length || 0) > 0,
    ontologyEntityType: 'Customer',
    ontologyEntityCount: customerEntities?.length || 0,
  });

  // inventory_levels 테이블
  const { count: inventoryCount } = await supabase
    .from('inventory_levels')
    .select('*', { count: 'exact', head: true });

  sources.push({
    id: 'inventory',
    name: '재고 데이터',
    table: 'inventory_levels',
    recordCount: inventoryCount || 0,
    lastUpdated: new Date().toISOString(),
    status: inventoryCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true, // 재고는 별도 온톨로지 없이 사용
    ontologyEntityType: 'InventoryLevel',
  });

  // purchases 테이블
  const { count: purchasesCount } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  sources.push({
    id: 'purchases',
    name: '구매 데이터',
    table: 'purchases',
    recordCount: purchasesCount || 0,
    lastUpdated: new Date().toISOString(),
    status: purchasesCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true,
    ontologyEntityType: 'Purchase',
  });

  // visits 테이블
  const { count: visitsCount } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  sources.push({
    id: 'visits',
    name: '방문 데이터',
    table: 'visits',
    recordCount: visitsCount || 0,
    lastUpdated: new Date().toISOString(),
    status: visitsCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true,
    ontologyEntityType: 'Visit',
  });

  // dashboard_kpis 테이블
  const { count: kpisCount } = await supabase
    .from('dashboard_kpis')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  sources.push({
    id: 'kpis',
    name: 'KPI 데이터',
    table: 'dashboard_kpis',
    recordCount: kpisCount || 0,
    lastUpdated: new Date().toISOString(),
    status: kpisCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true,
    ontologyEntityType: 'DailyKPI',
  });

  // wifi_tracking 테이블
  const { count: wifiCount } = await supabase
    .from('wifi_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  sources.push({
    id: 'wifi_tracking',
    name: 'WiFi 트래킹',
    table: 'wifi_tracking',
    recordCount: wifiCount || 0,
    lastUpdated: new Date().toISOString(),
    status: wifiCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true,
    ontologyEntityType: 'WifiTracking',
  });

  // graph_entities 테이블 (온톨로지 엔티티)
  const { count: entitiesCount } = await supabase
    .from('graph_entities')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('user_id', userId);

  sources.push({
    id: 'ontology_entities',
    name: '온톨로지 엔티티',
    table: 'graph_entities',
    recordCount: entitiesCount || 0,
    lastUpdated: new Date().toISOString(),
    status: entitiesCount > 0 ? 'connected' : 'pending',
    mappedToOntology: true,
    ontologyEntityType: 'Entity',
  });

  return sources;
}

/**
 * 프리셋 API 소스 조회 (관리자 전용 설정)
 */
async function getPresetApiSources(supabase: any, storeId: string, userId: string): Promise<PresetApiSource[]> {
  // api_connections 테이블에서 프리셋 API 조회
  const { data: apiConnections } = await supabase
    .from('api_connections')
    .select('*')
    .eq('connection_type', 'preset')
    .or(`store_id.eq.${storeId},store_id.is.null`); // 전역 또는 매장별

  // 기본 프리셋 API 목록 (DB에 없으면 기본값)
  const defaultPresetApis: PresetApiSource[] = [
    {
      id: 'weather',
      name: '날씨 API',
      description: '기상청 날씨 데이터 (기온, 강수량, 습도)',
      provider: 'OpenWeather / 기상청',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'economic',
      name: '경제지표 API',
      description: '소비자물가지수, 경기동행지수, 소비심리지수',
      provider: 'KOSIS / 한국은행',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'holidays',
      name: '공휴일 API',
      description: '공휴일, 특별 기념일, 시즌 정보',
      provider: '공공데이터포털',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'population',
      name: '유동인구 API',
      description: '지역별 유동인구, 상권 분석 데이터',
      provider: 'SKT / KT',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'trends',
      name: '트렌드 API',
      description: '검색 트렌드, 소셜 버즈, 인기 키워드',
      provider: 'Naver DataLab',
      enabled: false,
      adminOnly: true,
    },
  ];

  // DB에 저장된 연결 상태로 업데이트
  return defaultPresetApis.map(api => {
    const connection = apiConnections?.find((c: any) => c.api_id === api.id);
    if (connection) {
      return {
        ...api,
        enabled: connection.is_active,
        lastSync: connection.last_sync_at,
        dataPoints: connection.data_points_count,
      };
    }
    return api;
  });
}

/**
 * 고객 연동 API 소스 조회
 */
async function getCustomApiSources(supabase: any, storeId: string, userId: string): Promise<CustomApiSource[]> {
  const { data: apiConnections } = await supabase
    .from('api_connections')
    .select('*')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('connection_type', 'custom');

  if (!apiConnections || apiConnections.length === 0) {
    return [];
  }

  return apiConnections.map((conn: any) => ({
    id: conn.id,
    name: conn.name,
    type: conn.api_type || 'other',
    endpoint: conn.endpoint || '',
    status: conn.is_active ? 'connected' : 'disconnected',
    lastSync: conn.last_sync_at,
    recordCount: conn.data_points_count,
  }));
}

/**
 * 온톨로지 매핑 건강도 계산
 */
async function calculateMappingStatus(
  supabase: any, 
  storeId: string, 
  userId: string,
  importedData: ImportedDataSource[]
): Promise<OntologyMappingStatus> {
  // 온톨로지 엔티티 총 개수
  const { count: totalEntities } = await supabase
    .from('graph_entities')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('user_id', userId);

  // 온톨로지 관계 총 개수
  const { count: totalRelations } = await supabase
    .from('graph_relations')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('user_id', userId);

  // 매핑된 엔티티 수 (각 테이블에서 온톨로지에 매핑된 것)
  const mappedSources = importedData.filter(d => d.mappedToOntology && d.ontologyEntityCount && d.ontologyEntityCount > 0);
  const mappedEntities = mappedSources.reduce((sum, d) => sum + (d.ontologyEntityCount || 0), 0);

  // 미매핑 필드 체크
  const unmappedFields: string[] = [];
  const requiredTables = ['products', 'customers', 'purchases', 'visits', 'kpis'];
  
  for (const table of requiredTables) {
    const source = importedData.find(d => d.id === table);
    if (!source || source.recordCount === 0) {
      unmappedFields.push(table);
    }
  }

  // 건강도 계산 (0-100)
  // 기준: 필수 테이블 매핑 비율 (50%) + 온톨로지 엔티티 존재 (30%) + 관계 존재 (20%)
  const tableScore = ((requiredTables.length - unmappedFields.length) / requiredTables.length) * 50;
  const entityScore = (totalEntities || 0) > 0 ? 30 : 0;
  const relationScore = (totalRelations || 0) > 0 ? 20 : 0;
  
  const healthScore = Math.round(tableScore + entityScore + relationScore);

  return {
    totalEntities: totalEntities || 0,
    mappedEntities,
    totalRelations: totalRelations || 0,
    unmappedFields,
    healthScore,
  };
}

/**
 * 온톨로지 매핑 새로고침
 */
async function refreshOntologyMapping(supabase: any, storeId: string, userId: string) {
  console.log('🔄 Refreshing ontology mapping...');

  // smart-ontology-mapping 함수 호출하여 자동 매핑 실행
  // 여기서는 현재 상태만 다시 조회
  const result = await getDataSourceStatus(supabase, storeId, userId);
  
  return {
    ...result,
    refreshed: true,
    refreshedAt: new Date().toISOString(),
  };
}

/**
 * API 연결
 */
async function connectApi(
  supabase: any, 
  storeId: string, 
  userId: string,
  apiConfig: { type: 'preset' | 'custom'; name: string; endpoint?: string; credentials?: Record<string, string> }
) {
  const { data, error } = await supabase
    .from('api_connections')
    .upsert({
      store_id: storeId,
      user_id: userId,
      api_id: apiConfig.name.toLowerCase().replace(/\s+/g, '_'),
      name: apiConfig.name,
      connection_type: apiConfig.type,
      endpoint: apiConfig.endpoint,
      credentials: apiConfig.credentials,
      is_active: true,
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to connect API: ${error.message}`);
  }

  return {
    success: true,
    connection: data,
    message: `${apiConfig.name} API가 연결되었습니다.`,
  };
}

/**
 * API 연결 해제
 */
async function disconnectApi(supabase: any, storeId: string, userId: string, apiId: string) {
  const { error } = await supabase
    .from('api_connections')
    .update({ 
      is_active: false,
      disconnected_at: new Date().toISOString(),
    })
    .eq('id', apiId)
    .eq('store_id', storeId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to disconnect API: ${error.message}`);
  }

  return {
    success: true,
    message: 'API 연결이 해제되었습니다.',
  };
}

/**
 * API 설정 조회 (관리자용)
 */
async function getApiConfig(supabase: any, storeId: string, userId: string) {
  const { data: connections } = await supabase
    .from('api_connections')
    .select('*')
    .or(`store_id.eq.${storeId},store_id.is.null`);

  return {
    success: true,
    connections: connections || [],
  };
}
