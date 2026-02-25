import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { parseCSVFromStorage } from './csv-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineRequest {
  import_id: string;
  store_id: string;
  auto_fix?: boolean;
  skip_validation?: boolean;
}

interface PipelineResult {
  success: boolean;
  validation?: any;
  mapping?: any;
  etl?: any;
  error?: string;
}

// 파이프라인 실행 함수
// 진행상황 업데이트 헬퍼 함수
async function updateProgress(
  supabase: any,
  import_id: string,
  stage: string,
  progress: number,
  details?: any
) {
  await supabase
    .from('user_data_imports')
    .update({
      progress: {
        stage,
        percentage: progress,
        timestamp: new Date().toISOString(),
        ...details
      }
    })
    .eq('id', import_id);
}

async function runPipeline(
  supabase: any,
  user: any,
  import_id: string,
  store_id: string,
  auto_fix: boolean,
  skip_validation: boolean,
  filePath?: string,
  fileType?: string
): Promise<PipelineResult> {
  const result: PipelineResult = { success: false };
  
  try {
    // 상태를 'processing'으로 업데이트
    await supabase
      .from('user_data_imports')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', import_id);

    // Storage에서 데이터 로드 (파일 경로가 있는 경우)
    if (filePath && (fileType === 'csv' || fileType === 'excel')) {
      console.log('📂 Loading data from Storage...');
      await updateProgress(supabase, import_id, 'loading', 5);
      
      try {
        const rawData = await parseCSVFromStorage(supabase, filePath, 'store-data');
        
        // user_data_imports의 raw_data를 실제 데이터로 업데이트
        await supabase
          .from('user_data_imports')
          .update({ 
            raw_data: rawData,
            row_count: rawData.length 
          })
          .eq('id', import_id);
        
        console.log(`✅ Loaded ${rawData.length} rows from Storage`);
        await updateProgress(supabase, import_id, 'loading', 10, { rows_loaded: rawData.length });
      } catch (error: any) {
        console.error('❌ Failed to load data from Storage:', error);
        throw new Error(`Storage data load failed: ${error.message}`);
      }
    }

    // Step 1: 데이터 검증 및 수정
    if (!skip_validation) {
      console.log('\n📍 STEP 1: Validating and fixing data...');
      await updateProgress(supabase, import_id, 'validation', 15);
      
      const validationResponse = await supabase.functions.invoke('validate-and-fix-csv', {
        body: {
          import_id,
          auto_fix,
          user_id: user.id,
        },
      });

      if (validationResponse.error) {
        console.error('❌ Validation failed:', validationResponse.error);
        throw new Error(`Validation failed: ${validationResponse.error.message}`);
      }

      result.validation = validationResponse.data;
      console.log('✅ Validation complete');
      console.log(`  - Data quality score: ${result.validation.data_quality_score}/100`);
      console.log(`  - Issues found: ${result.validation.issues.length}`);
      console.log(`  - Fixes applied: ${result.validation.fixes.length}`);
      await updateProgress(supabase, import_id, 'validation', 30, { 
        quality_score: result.validation.data_quality_score,
        issues: result.validation.issues.length
      });

    const criticalErrors = result.validation.issues.filter((i: any) => i.type === 'error');
    if (criticalErrors.length > 0 && result.validation.data_quality_score < 50) {
      console.warn(`⚠️  Low data quality score: ${result.validation.data_quality_score}/100`);
      console.warn(`⚠️  Critical errors: ${criticalErrors.length}`);
      console.warn('⚠️  Proceeding with caution...');
      
      criticalErrors.forEach((err: any, idx: number) => {
        console.warn(`   ${idx + 1}. [${err.column}] ${err.message}`);
      });
    }
  } else {
    console.log('⏭️  Skipping validation');
    result.validation = { skipped: true };
  }

    // Step 2: AI 기반 온톨로지 매핑 (캐시 우선 확인)
    console.log('\n📍 STEP 2: Generating ontology mapping...');
    await updateProgress(supabase, import_id, 'mapping', 35);

    // 임포트 데이터 타입 및 파일명 확인
    const { data: importData } = await supabase
      .from('user_data_imports')
      .select('data_type, file_name')
      .eq('id', import_id)
      .single();

    // 매핑 캐시 조회
    const { data: cachedMapping } = await supabase
      .from('ontology_mapping_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', importData?.data_type || 'unknown')
      .order('usage_count', { ascending: false })
      .order('confidence_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result_mapping;
    if (cachedMapping && cachedMapping.confidence_score > 0.7) {
      console.log(`🎯 Using cached mapping for ${importData?.data_type} (confidence: ${cachedMapping.confidence_score})`);
      result_mapping = {
        entity_mappings: cachedMapping.entity_mappings,
        relation_mappings: cachedMapping.relation_mappings,
        created_entity_types: [],
        created_relation_types: [],
        from_cache: true
      };

      // 캐시 사용 횟수 업데이트
      await supabase
        .from('ontology_mapping_cache')
        .update({ 
          usage_count: (cachedMapping.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cachedMapping.id);

      await updateProgress(supabase, import_id, 'mapping', 55, { from_cache: true });
    } else {
      console.log('🤖 Generating new AI mapping...');
      const mappingResponse = await supabase.functions.invoke('smart-ontology-mapping', {
        body: {
          import_id,
          id_columns: result.validation?.id_columns || [],
          foreign_key_columns: result.validation?.foreign_key_columns || {},
          user_id: user.id,
        },
      });

      if (mappingResponse.error) {
        console.error('❌ Mapping failed:', mappingResponse.error);
        throw new Error(`Mapping failed: ${mappingResponse.error.message}`);
      }

      result_mapping = mappingResponse.data;

      // 새 매핑을 캐시에 저장
      await supabase
        .from('ontology_mapping_cache')
        .insert({
          user_id: user.id,
          data_type: importData?.data_type || 'unknown',
          file_name_pattern: importData?.file_name?.replace(/\d+/g, '*') || '*.csv',
          entity_mappings: result_mapping.entity_mappings,
          relation_mappings: result_mapping.relation_mappings,
          confidence_score: result.validation?.data_quality_score / 100 || 0.5,
          usage_count: 1
        });

      await updateProgress(supabase, import_id, 'mapping', 60, { from_cache: false });
    }

    result.mapping = result_mapping;
    console.log('✅ Mapping complete');
    console.log(`  - Entity mappings: ${result.mapping.entity_mappings.length}`);
    console.log(`  - Relation mappings: ${result.mapping.relation_mappings.length}`);
    console.log(`  - Created entity types: ${result.mapping.created_entity_types?.length || 0}`);
    console.log(`  - Created relation types: ${result.mapping.created_relation_types?.length || 0}`);

    // Step 3: ETL 실행
    console.log('\n📍 STEP 3: Executing ETL...');
    await updateProgress(supabase, import_id, 'etl', 65);

    const etlResponse = await supabase.functions.invoke('unified-etl', {
      body: {
        etl_type: 'schema',
        import_id,
        store_id,
        entity_mappings: result.mapping.entity_mappings,
        relation_mappings: result.mapping.relation_mappings,
      },
    });

    if (etlResponse.error) {
      console.error('❌ ETL failed:', etlResponse.error);
      throw new Error(`ETL failed: ${etlResponse.error.message}`);
    }

    result.etl = etlResponse.data;
    console.log('✅ ETL complete');
    console.log(`  - Entities created: ${result.etl.entities_created || 0}`);
    console.log(`  - Entities reused: ${result.etl.entities_reused || 0}`);
    console.log(`  - Relations created: ${result.etl.relations_created || 0}`);
    await updateProgress(supabase, import_id, 'etl', 90, {
      entities_created: result.etl.entities_created,
      relations_created: result.etl.relations_created
    });

    // Step 4: 검증
    console.log('\n📍 STEP 4: Validating results...');
    await updateProgress(supabase, import_id, 'verification', 95);
    
    const { count: entitiesCount } = await supabase
      .from('graph_entities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('store_id', store_id);

    const { count: relationsCount } = await supabase
      .from('graph_relations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('store_id', store_id);

    console.log('✅ Validation complete');
    console.log(`  - Total entities in DB: ${entitiesCount}`);
    console.log(`  - Total relations in DB: ${relationsCount}`);

    if (relationsCount === 0 && result.mapping.relation_mappings.length > 0) {
      console.warn('⚠️  Warning: No relations created despite having relation mappings');
    }

    result.success = true;

    // 완료 상태 업데이트
    await supabase
      .from('user_data_imports')
      .update({ 
        status: 'completed',
        processing_completed_at: new Date().toISOString(),
        progress: {
          stage: 'completed',
          percentage: 100,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', import_id);

    console.log('\n🎉 Pipeline completed successfully!');
    console.log('═══════════════════════════════════════');

    return result;
  } catch (error: any) {
    console.error('❌ Pipeline error:', error);
    
    // 에러 상태 업데이트
    await supabase
      .from('user_data_imports')
      .update({ 
        status: 'failed',
        error_details: error.message,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', import_id);
    
    throw error;
  }
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
      throw new Error('Unauthorized');
    }

    const { import_id, store_id, auto_fix = true, skip_validation = false } = await req.json() as PipelineRequest;

    console.log('🚀 Starting integrated data pipeline');
    console.log(`📦 Import ID: ${import_id}`);
    console.log(`🏪 Store ID: ${store_id}`);

    // 데이터 크기 및 파일 경로 확인
    const { data: importData } = await supabase
      .from('user_data_imports')
      .select('row_count, raw_data, file_path, file_type')
      .eq('id', import_id)
      .single();
    
    const rowCount = importData?.row_count || 0;
    const filePath = importData?.file_path;
    console.log(`📊 Row count: ${rowCount}`);
    console.log(`📁 File path: ${filePath || 'N/A (data in raw_data)'}`);

    // 큰 데이터셋(100개 이상)은 백그라운드 처리
    if (rowCount >= 100) {
      console.log('⏰ Large dataset detected, processing in background...');
      
      // 상태를 'processing'으로 업데이트
      await supabase
        .from('user_data_imports')
        .update({ 
          data_type: 'processing_pipeline',
        })
        .eq('id', import_id);

      // 백그라운드 처리 시작
      const backgroundTask = async () => {
        try {
          const result = await runPipeline(
            supabase, 
            user, 
            import_id, 
            store_id, 
            auto_fix, 
            skip_validation,
            importData?.file_path,
            importData?.file_type
          );
          
          // 완료 상태 업데이트
          await supabase
            .from('user_data_imports')
            .update({ 
              data_type: 'completed',
              raw_data: { ...importData?.raw_data, pipeline_result: result }
            })
            .eq('id', import_id);
            
          console.log('✅ Background pipeline completed');
        } catch (error: any) {
          console.error('❌ Background pipeline error:', error);
          
          // 에러 상태 업데이트
          await supabase
            .from('user_data_imports')
            .update({ 
              data_type: 'failed',
              raw_data: { ...importData?.raw_data, error: error.message }
            })
            .eq('id', import_id);
        }
      };

      // 백그라운드로 실행 (fire and forget)
      backgroundTask().catch((err) => {
        console.error('Background task failed:', err);
      });

      // 즉시 응답 반환
      return new Response(
        JSON.stringify({
          success: true,
          processing_in_background: true,
          import_id,
          message: `Large dataset (${rowCount} rows) is being processed in background. Check import status for updates.`
        }),
        {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 작은 데이터셋은 동기 처리
    const result = await runPipeline(
      supabase, 
      user, 
      import_id, 
      store_id, 
      auto_fix, 
      skip_validation,
      importData?.file_path,
      importData?.file_type
    );

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Pipeline error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
