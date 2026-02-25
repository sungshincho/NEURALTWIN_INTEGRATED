import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  importId: string; // user_data_imports의 ID
  createEntities?: boolean; // 엔티티 자동 생성 여부
  entityTypeMapping?: Record<string, string>; // 데이터 타입 -> entity_type_id 매핑
  sourceType?: 'csv' | 'api' | 'webhook' | 'manual'; // 데이터 소스 유형
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
  row_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_type?: string;
  metadata: {
    columns?: string[];
    sample_rows?: Record<string, any>[];
    etl_version?: string;
    ontology_mapping?: any;
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

    await supabase
      .from('raw_imports')
      .update(updateData)
      .eq('id', id);

    console.log(`[raw_imports] Updated status: ${id} -> ${status}`);
  } catch (err) {
    console.error('[raw_imports] Status update failed:', err);
  }
}

interface Link3DModelRequest {
  modelUrl: string; // 3D 모델 URL
  entityTypeName?: string; // 연결할 엔티티 타입 이름
  autoCreateEntityType?: boolean; // 엔티티 타입 자동 생성
}

interface ImportResult {
  success: boolean;
  importId?: string;
  entitiesCreated: number;
  relationsCreated: number;
  entityTypesLinked: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const body = await req.json();
    const userId = user.id;

    let result: ImportResult = {
      success: true,
      entitiesCreated: 0,
      relationsCreated: 0,
      entityTypesLinked: 0,
      errors: []
    };

    // CSV 데이터 임포트 + 온톨로지 생성
    if (body.importId) {
      await processCSVImport(supabase, userId, body as ImportRequest, result);
    }
    // 3D 모델 연결
    else if (body.modelUrl) {
      await link3DModel(supabase, userId, body as Link3DModelRequest, result);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Import error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        entitiesCreated: 0,
        relationsCreated: 0,
        entityTypesLinked: 0,
        errors: [errorMessage]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * CSV 임포트 데이터로부터 온톨로지 엔티티 생성
 */
async function processCSVImport(
  supabase: any,
  userId: string,
  request: ImportRequest,
  result: ImportResult
) {
  const { importId, createEntities = true, entityTypeMapping = {}, sourceType } = request;

  console.log('📊 Processing CSV import:', importId);

  // 1. user_data_imports에서 데이터 조회
  const { data: importData, error: importError } = await supabase
    .from('user_data_imports')
    .select('*')
    .eq('id', importId)
    .eq('user_id', userId)
    .single();

  if (importError || !importData) {
    result.errors.push(`Import not found: ${importError?.message}`);
    return;
  }

  result.importId = importId;

  const rawData = importData.raw_data as any[];
  const dataType = importData.data_type;
  const storeId = importData.store_id;
  const orgId = importData.org_id;
  const fileName = importData.file_name;

  // ============================================================================
  // raw_imports 기록 시작 (CTO 요구사항: 원본 데이터 보존)
  // ============================================================================
  let rawImportId: string | null = null;

  const rawImportResult = await createRawImport(supabase, {
    org_id: orgId,
    store_id: storeId,
    user_id: userId,
    source_type: sourceType || 'csv',
    source_name: fileName,
    row_count: rawData?.length || 0,
    status: 'pending',
    data_type: dataType,
    metadata: {
      columns: Object.keys(rawData?.[0] || {}),
      sample_rows: rawData?.slice(0, 3),
      etl_version: '2.0',
      import_id: importId,
      create_entities: createEntities,
      entity_type_mapping: entityTypeMapping,
    },
    raw_data: rawData,
  });

  rawImportId = rawImportResult.id;
  (result as any).rawImportId = rawImportId;

  if (rawImportId) {
    await updateRawImportStatus(supabase, rawImportId, 'processing');
  }

  if (!createEntities) {
    console.log('⏭️ Skipping entity creation');
    if (rawImportId) {
      await updateRawImportStatus(supabase, rawImportId, 'completed', {
        row_count: rawData?.length || 0,
      });
    }
    return;
  }

  console.log(`Processing ${rawData.length} rows of type: ${dataType}`);

  // 2. 적절한 entity_type 찾기 또는 생성
  let entityTypeId = entityTypeMapping[dataType];

  if (!entityTypeId) {
    // 기본 엔티티 타입 조회 (마스터 + 사용자 타입 통합)
    const entityTypeName = getEntityTypeNameForDataType(dataType);

    const { data: existingTypes } = await supabase
      .from('ontology_entity_types')
      .select('id, user_id')
      .eq('name', entityTypeName)
      .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

    if (existingTypes && existingTypes.length > 0) {
      // 사용자 타입이 마스터 타입보다 우선
      const userType = existingTypes.find((t: any) => t.user_id === userId);
      const masterType = existingTypes.find((t: any) => t.user_id === null);
      entityTypeId = userType?.id || masterType?.id;
    }

    // 마스터 타입도 없으면 새 사용자 타입 생성
    if (!entityTypeId) {
      const { data: newType, error: typeError } = await supabase
        .from('ontology_entity_types')
        .insert({
          user_id: userId,
          name: entityTypeName,
          label: entityTypeName,
          description: `Auto-generated for ${dataType} data`,
          properties: [],
          color: '#3b82f6'
        })
        .select()
        .single();

      if (typeError) {
        result.errors.push(`Failed to create entity type: ${typeError.message}`);
        return;
      }

      entityTypeId = newType.id;
      console.log(`✨ Created new entity type: ${entityTypeName}`);
    }
  }

  // 3. 각 데이터 행을 엔티티로 변환
  const entitiesToCreate: any[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 레이블 생성 (데이터 타입에 따라)
    const label = generateEntityLabel(row, dataType, i);

    entitiesToCreate.push({
      user_id: userId,
      store_id: storeId,
      entity_type_id: entityTypeId,
      label,
      properties: {
        ...row,
        source_import_id: importId,
        data_type: dataType,
        import_index: i
      }
    });
  }

  // 4. 엔티티 일괄 삽입 (최대 1000개씩)
  const BATCH_SIZE = 1000;
  for (let i = 0; i < entitiesToCreate.length; i += BATCH_SIZE) {
    const batch = entitiesToCreate.slice(i, i + BATCH_SIZE);
    
    const { error: insertError } = await supabase
      .from('graph_entities')
      .insert(batch);

    if (insertError) {
      result.errors.push(`Batch insert error: ${insertError.message}`);
    } else {
      result.entitiesCreated += batch.length;
    }
  }

  console.log(`✅ Created ${result.entitiesCreated} entities`);

  // 5. 관계 생성 (데이터에 따라)
  if (dataType === 'purchases' && result.entitiesCreated > 0) {
    const relationsCreated = await createPurchaseRelations(supabase, userId, importId, storeId);
    result.relationsCreated = relationsCreated;
  }

  // ============================================================================
  // raw_imports 상태 업데이트 (완료 또는 실패)
  // ============================================================================
  if (rawImportId) {
    const hasErrors = result.errors.length > 0;
    const status = hasErrors && result.entitiesCreated === 0 ? 'failed' : 'completed';

    await updateRawImportStatus(supabase, rawImportId, status, {
      row_count: result.entitiesCreated,
      error_message: hasErrors ? result.errors.join('; ') : undefined,
      error_details: hasErrors ? {
        errors: result.errors,
        entities_created: result.entitiesCreated,
        relations_created: result.relationsCreated,
      } : undefined,
    });
  }
}

/**
 * 3D 모델을 ontology_entity_types에 연결
 */
async function link3DModel(
  supabase: any,
  userId: string,
  request: Link3DModelRequest,
  result: ImportResult
) {
  const { modelUrl, entityTypeName, autoCreateEntityType = false } = request;
  
  console.log('🔗 Linking 3D model:', modelUrl);

  // 파일명에서 엔티티 타입 추론
  const fileName = modelUrl.split('/').pop() || '';
  const inferredTypeName = entityTypeName || inferEntityTypeFromFilename(fileName);

  // 1. 엔티티 타입 찾기 (마스터 + 사용자 타입 통합)
  const { data: entityTypes } = await supabase
    .from('ontology_entity_types')
    .select('*')
    .eq('name', inferredTypeName)
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  // 사용자 타입이 마스터 타입보다 우선
  let entityType = entityTypes?.find((t: any) => t.user_id === userId) ||
                   entityTypes?.find((t: any) => t.user_id === null);

  // 2. 없으면 생성 (autoCreate 옵션)
  if (!entityType && autoCreateEntityType) {
    const { data: newType, error: createError } = await supabase
      .from('ontology_entity_types')
      .insert({
        user_id: userId,
        name: inferredTypeName,
        label: inferredTypeName,
        description: `3D model entity type`,
        properties: [],
        color: '#8b5cf6',
        model_3d_url: modelUrl,
        model_3d_type: 'glb',
        model_3d_dimensions: { width: 1, height: 1, depth: 1 }
      })
      .select()
      .single();

    if (createError) {
      result.errors.push(`Failed to create entity type: ${createError.message}`);
      return;
    }

    entityType = newType;
    result.entityTypesLinked = 1;
    console.log(`✨ Created entity type with 3D model: ${inferredTypeName}`);
  }
  // 3. 있으면 업데이트
  else if (entityType) {
    const { error: updateError } = await supabase
      .from('ontology_entity_types')
      .update({
        model_3d_url: modelUrl,
        model_3d_type: 'glb',
        model_3d_dimensions: { width: 1, height: 1, depth: 1 }
      })
      .eq('id', entityType.id);

    if (updateError) {
      result.errors.push(`Failed to link model: ${updateError.message}`);
    } else {
      result.entityTypesLinked = 1;
      console.log(`🔗 Linked 3D model to: ${inferredTypeName}`);
    }
  } else {
    result.errors.push(`Entity type not found: ${inferredTypeName}. Enable autoCreateEntityType.`);
  }
}

/**
 * 구매 데이터에 대한 관계 생성 (Product -> Purchase)
 */
async function createPurchaseRelations(
  supabase: any,
  userId: string,
  importId: string,
  storeId: string | null
): Promise<number> {
  console.log('🔗 Creating purchase relations...');

  // purchases 타입의 엔티티 조회
  const { data: purchaseEntities } = await supabase
    .from('graph_entities')
    .select('id, properties')
    .eq('user_id', userId)
    .contains('properties', { source_import_id: importId });

  if (!purchaseEntities || purchaseEntities.length === 0) {
    return 0;
  }

  // Product 엔티티 타입 조회 (마스터 + 사용자 타입 통합)
  const { data: productTypes } = await supabase
    .from('ontology_entity_types')
    .select('id, user_id')
    .eq('name', 'Product')
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  // 사용자 타입이 마스터 타입보다 우선
  const productType = productTypes?.find((t: any) => t.user_id === userId) ||
                      productTypes?.find((t: any) => t.user_id === null);

  if (!productType) {
    console.log('⚠️ Product entity type not found, skipping relations');
    return 0;
  }

  const { data: productEntities } = await supabase
    .from('graph_entities')
    .select('id, properties, label')
    .eq('user_id', userId)
    .eq('entity_type_id', productType.id);

  if (!productEntities || productEntities.length === 0) {
    return 0;
  }

  // purchased 관계 타입 찾기 (마스터 + 사용자 타입 통합)
  const { data: relationTypes } = await supabase
    .from('ontology_relation_types')
    .select('id, user_id')
    .eq('name', 'purchased')
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  // 사용자 타입이 마스터 타입보다 우선
  let relationType = relationTypes?.find((t: any) => t.user_id === userId) ||
                     relationTypes?.find((t: any) => t.user_id === null);

  // 마스터/사용자 타입 모두 없으면 새 사용자 타입 생성
  if (!relationType) {
    const { data: newRelType } = await supabase
      .from('ontology_relation_types')
      .insert({
        user_id: userId,
        name: 'purchased',
        label: 'purchased',
        source_entity_type: 'Customer',
        target_entity_type: 'Product',
        description: 'Customer purchased a product'
      })
      .select()
      .single();

    relationType = newRelType;
  }

  // 관계 생성
  const relations: any[] = [];

  for (const purchase of purchaseEntities) {
    const props = purchase.properties as any;
    const productName = props.product_name || props.product;

    if (!productName) continue;

    // 제품명으로 Product 엔티티 찾기
    const matchingProduct = productEntities.find((p: any) => 
      p.label.toLowerCase().includes(productName.toLowerCase()) ||
      (p.properties as any).name?.toLowerCase() === productName.toLowerCase()
    );

    if (matchingProduct) {
      relations.push({
        user_id: userId,
        store_id: storeId,
        relation_type_id: relationType.id,
        source_entity_id: purchase.id,
        target_entity_id: matchingProduct.id,
        properties: {
          quantity: props.quantity || 1,
          price: props.price || props.amount,
          date: props.date || props.timestamp
        }
      });
    }
  }

  if (relations.length > 0) {
    const { error } = await supabase
      .from('graph_relations')
      .insert(relations);

    if (error) {
      console.error('Relations insert error:', error);
      return 0;
    }
  }

  console.log(`✅ Created ${relations.length} purchase relations`);
  return relations.length;
}

/**
 * 데이터 타입에 맞는 엔티티 타입 이름 반환
 */
function getEntityTypeNameForDataType(dataType: string): string {
  const mapping: Record<string, string> = {
    'customers': 'Customer',
    'products': 'Product',
    'purchases': 'Purchase',
    'visits': 'Visit',
    'stores': 'Store',
    'staff': 'Staff',
    'brands': 'Brand',
    'wifi_tracking': 'WiFiTracking',
    'wifi_zones': 'WiFiZone'
  };

  return mapping[dataType] || 'DataEntity';
}

/**
 * 데이터 행으로부터 엔티티 레이블 생성
 */
function generateEntityLabel(row: any, dataType: string, index: number): string {
  // 데이터 타입별 레이블 생성 로직
  if (dataType === 'customers') {
    return row.name || row.customer_name || `Customer ${index + 1}`;
  } else if (dataType === 'products') {
    return row.name || row.product_name || `Product ${index + 1}`;
  } else if (dataType === 'purchases') {
    return `Purchase ${row.purchase_id || index + 1}`;
  } else if (dataType === 'visits') {
    return `Visit ${row.visit_id || index + 1}`;
  } else if (dataType === 'stores') {
    return row.store_name || row.name || `Store ${index + 1}`;
  }

  return `${dataType} ${index + 1}`;
}

/**
 * 3D 모델 파일명에서 엔티티 타입 추론
 */
function inferEntityTypeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('shelf')) return 'Shelf';
  if (lower.includes('rack')) return 'Rack';
  if (lower.includes('display')) return 'Display';
  if (lower.includes('table')) return 'Table';
  if (lower.includes('chair')) return 'Chair';
  if (lower.includes('counter')) return 'Counter';
  if (lower.includes('wall')) return 'Wall';
  if (lower.includes('floor')) return 'Floor';
  if (lower.includes('store') || lower.includes('building')) return 'Store';
  
  return 'Object3D';
}
