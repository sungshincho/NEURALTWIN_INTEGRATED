import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartMappingRequest {
  import_id: string;
  id_columns: string[];
  foreign_key_columns: Record<string, string>;
  user_id?: string; // optional, for when called from pipeline
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { import_id, id_columns, foreign_key_columns, user_id } = await req.json() as SmartMappingRequest;

    // user_id가 제공되면 그것을 사용, 아니면 Authorization header에서 가져오기
    let userId: string;
    if (user_id) {
      userId = user_id;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Authorization required');

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error('Unauthorized');
      userId = user.id;
    }

    console.log('🧠 Smart ontology mapping for import:', import_id);

    // 데이터 가져오기
    const { data: importData, error: fetchError } = await supabase
      .from('user_data_imports')
      .select('*')
      .eq('id', import_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !importData) {
      throw new Error('Import not found');
    }

    const rawData = importData.raw_data as any[];
    const columns = Object.keys(rawData[0] || {});
    const dataSample = rawData.slice(0, 10);
    const fileName = importData.file_name.toLowerCase();

    // 기존 온톨로지 스키마 가져오기
    const { data: entityTypes } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', userId);

    const { data: relationTypes } = await supabase
      .from('ontology_relation_types')
      .select('*')
      .eq('user_id', userId);

    console.log(`📋 Existing: ${entityTypes?.length || 0} entity types, ${relationTypes?.length || 0} relation types`);

    // AI 기반 정교한 매핑
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const mappingPrompt = `당신은 온톨로지 설계 전문가입니다. 다음 데이터를 분석하고 완벽한 온톨로지 매핑을 생성하세요.

**데이터 정보:**
- 타입: ${importData.data_type}
- 파일: ${importData.file_name}
- 행 수: ${rawData.length}
- 컬럼: ${columns.join(', ')}

**식별된 ID 컬럼:** ${id_columns.join(', ')}
**외래 키 컬럼:** ${JSON.stringify(foreign_key_columns)}

**샘플 데이터 (10개):**
${JSON.stringify(dataSample, null, 2)}

**기존 엔티티 타입:**
${entityTypes?.map(et => `- ${et.name} (${et.label})`).join('\n') || '없음'}

**기존 관계 타입:**
${relationTypes?.map(rt => `- ${rt.name}: ${rt.source_entity_type} -> ${rt.target_entity_type}`).join('\n') || '없음'}

**파일명 기반 제약:**
- 현재 파일: ${importData.file_name}
- **CRITICAL 규칙: 파일명에 "brand"가 포함되지 않으면 절대 Brand 엔티티를 생성하지 마세요!**
- Brand 관련 외래 키(brand_id 등)가 있어도 관계만 생성하고 엔티티는 생성 금지
- Brand 엔티티는 오직 파일명에 "brand"가 포함된 파일(예: brand_master.csv, brand.csv)에서만 생성

**매핑 지침:**
1. **엔티티 타입 결정**:
   - 기존 엔티티 타입을 최대한 재사용
   - 필요하면 새로운 엔티티 타입 생성 (create_new: true)
   - 각 엔티티에 모든 관련 properties 매핑
   - **중요: 외래 키 컬럼(${Object.keys(foreign_key_columns).join(', ')})은 새로운 엔티티 타입을 만들지 마세요!**
   - 외래 키는 기존 엔티티와의 관계로만 처리
   - **특히 Brand 엔티티: 파일명에 "brand"가 없으면 절대 생성 금지!**

2. **Label 템플릿**:
   - ID 컬럼을 우선 사용
   - 의미 있는 이름 컬럼 사용
   - 예: {product_id}, {customer_name}, {store_code}

3. **Column Mappings (CRITICAL!)**:
   - **반드시 모든 컬럼을 매핑해야 합니다**
   - column_mappings 형식: { "속성명": "원본_컬럼명" }
   - **예시**: 컬럼이 [store_id, product_id, current_stock, minimum_stock]이면
     column_mappings는 {
       "store_id": "store_id",
       "product_id": "product_id", 
       "current_stock": "current_stock",
       "minimum_stock": "minimum_stock"
     }
   - ID 컬럼과 외래 키는 반드시 포함!
   - 속성명과 컬럼명은 동일하게 사용 (특별한 이유가 없으면)

4. **관계 생성**:
   - 외래 키(${Object.keys(foreign_key_columns).join(', ')})를 기반으로 관계만 생성
   - 외래 키 컬럼이 참조하는 엔티티 타입은 기존 타입 사용
   - source_key와 target_key는 실제 컬럼명 사용
   - 기존 관계 타입 재사용, 없으면 생성

**중요: column_mappings를 빈 객체 {}로 반환하지 마세요! 모든 컬럼을 매핑하세요!**`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: '온톨로지 설계 전문가로서 정확하고 완전한 매핑을 생성하세요. 모든 ID 컬럼과 외래 키를 properties에 반드시 포함시키세요.'
          },
          {
            role: 'user',
            content: mappingPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_ontology_mapping',
              description: '온톨로지 매핑을 생성합니다',
              parameters: {
                type: 'object',
                properties: {
                  entity_mappings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        entity_type_id: {
                          type: 'string',
                          description: '기존 엔티티 타입 ID 또는 "NEW"'
                        },
                        entity_type_name: { type: 'string' },
                        entity_type_label: { type: 'string' },
                        create_new: {
                          type: 'boolean',
                          description: '새 엔티티 타입 생성 여부'
                        },
                        properties_definition: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              type: { type: 'string' },
                              required: { type: 'boolean' }
                            }
                          },
                          description: '새 엔티티 타입의 속성 정의'
                        },
                        column_mappings: {
                          type: 'object',
                          description: 'REQUIRED! 모든 컬럼을 매핑. 형식: {"prop_name": "column_name"}. 예: {"store_id": "store_id", "product_id": "product_id", "quantity": "quantity"}. 빈 객체 금지!',
                          additionalProperties: { type: 'string' }
                        },
                        label_template: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['entity_type_id', 'entity_type_name', 'column_mappings', 'label_template']
                    }
                  },
                  relation_mappings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        relation_type_id: {
                          type: 'string',
                          description: '기존 관계 타입 ID 또는 "NEW"'
                        },
                        relation_type_name: { type: 'string' },
                        relation_type_label: { type: 'string' },
                        create_new: { type: 'boolean' },
                        source_entity_type_id: { type: 'string' },
                        target_entity_type_id: { type: 'string' },
                        source_key: {
                          type: 'string',
                          description: '소스 엔티티의 ID 컬럼명'
                        },
                        target_key: {
                          type: 'string',
                          description: '타겟 엔티티를 참조하는 외래 키 컬럼명'
                        },
                        directionality: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['relation_type_id', 'source_entity_type_id', 'target_entity_type_id', 'source_key', 'target_key']
                    }
                  }
                },
                required: ['entity_mappings', 'relation_mappings']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_ontology_mapping' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI mapping error:', errorText);
      throw new Error(`AI mapping failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // AI 응답 상세 로깅
    console.log('📝 AI Response structure:', {
      hasChoices: !!aiData.choices,
      choicesLength: aiData.choices?.length,
      hasMessage: !!aiData.choices?.[0]?.message,
      hasToolCalls: !!aiData.choices?.[0]?.message?.tool_calls,
      messageKeys: Object.keys(aiData.choices?.[0]?.message || {})
    });
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('❌ AI response without tool_calls:', JSON.stringify(aiData, null, 2));
      throw new Error('AI did not return mapping results. Check the AI response format.');
    }

    const mappingResult = JSON.parse(toolCall.function.arguments);
    console.log('✅ AI mapping generated');

    // Fallback 1: 파일명 기반 Brand 엔티티 필터링
    if (!fileName.includes('brand')) {
      const originalLength = mappingResult.entity_mappings.length;
      mappingResult.entity_mappings = mappingResult.entity_mappings.filter((em: any) => {
        const entityName = em.entity_type_name.toLowerCase();
        if (entityName === 'brand' || entityName.includes('brand')) {
          console.warn(`⚠️ Filtered out Brand entity from non-brand file: ${importData.file_name}`);
          return false;
        }
        return true;
      });
      if (originalLength !== mappingResult.entity_mappings.length) {
        console.log(`✅ Removed ${originalLength - mappingResult.entity_mappings.length} Brand entity mappings`);
      }
    }

    // Fallback 2: column_mappings가 비어있으면 자동으로 모든 컬럼 매핑
    mappingResult.entity_mappings.forEach((em: any) => {
      if (!em.column_mappings || Object.keys(em.column_mappings).length === 0) {
        console.warn(`⚠️ Empty column_mappings for ${em.entity_type_name}, auto-mapping all columns...`);
        em.column_mappings = {};
        columns.forEach((col: string) => {
          em.column_mappings[col] = col;
        });
        console.log(`✅ Auto-mapped ${columns.length} columns for ${em.entity_type_name}`);
      }
    });

    // 새로운 엔티티 타입 생성
    const createdEntityTypes: Record<string, string> = {};
    
    for (const entityMapping of mappingResult.entity_mappings) {
      if (entityMapping.create_new) {
        console.log(`🆕 Creating new entity type: ${entityMapping.entity_type_name}`);
        
        const { data: newEntityType, error } = await supabase
          .from('ontology_entity_types')
          .insert({
            name: entityMapping.entity_type_name,
            label: entityMapping.entity_type_label || entityMapping.entity_type_name,
            properties: entityMapping.properties_definition || [],
            user_id: userId,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to create entity type:', error);
        } else if (newEntityType) {
          createdEntityTypes[entityMapping.entity_type_name] = newEntityType.id;
          entityMapping.entity_type_id = newEntityType.id;
          console.log(`✅ Created entity type: ${newEntityType.id}`);
        }
      }
    }

    // 새로운 관계 타입 생성
    const createdRelationTypes: Record<string, string> = {};
    
    for (const relationMapping of mappingResult.relation_mappings) {
      if (relationMapping.create_new) {
        console.log(`🆕 Creating new relation type: ${relationMapping.relation_type_name}`);
        
        // 소스/타겟 엔티티 타입 ID 확인
        const sourceEntityId = createdEntityTypes[relationMapping.source_entity_type_id] || relationMapping.source_entity_type_id;
        const targetEntityId = createdEntityTypes[relationMapping.target_entity_type_id] || relationMapping.target_entity_type_id;

        const { data: newRelationType, error } = await supabase
          .from('ontology_relation_types')
          .insert({
            name: relationMapping.relation_type_name,
            label: relationMapping.relation_type_label || relationMapping.relation_type_name,
            source_entity_type: sourceEntityId,
            target_entity_type: targetEntityId,
            directionality: relationMapping.directionality || 'directed',
            user_id: userId,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to create relation type:', error);
        } else if (newRelationType) {
          createdRelationTypes[relationMapping.relation_type_name] = newRelationType.id;
          relationMapping.relation_type_id = newRelationType.id;
          console.log(`✅ Created relation type: ${newRelationType.id}`);
        }
      }
    }

    // 생성된 ID로 매핑 결과 업데이트
    mappingResult.entity_mappings.forEach((em: any) => {
      if (em.entity_type_id === 'NEW' && createdEntityTypes[em.entity_type_name]) {
        em.entity_type_id = createdEntityTypes[em.entity_type_name];
      }
    });

    mappingResult.relation_mappings.forEach((rm: any) => {
      if (rm.relation_type_id === 'NEW' && createdRelationTypes[rm.relation_type_name]) {
        rm.relation_type_id = createdRelationTypes[rm.relation_type_name];
      }
      if (rm.source_entity_type_id === 'NEW') {
        rm.source_entity_type_id = createdEntityTypes[rm.source_entity_type_id] || rm.source_entity_type_id;
      }
      if (rm.target_entity_type_id === 'NEW') {
        rm.target_entity_type_id = createdEntityTypes[rm.target_entity_type_id] || rm.target_entity_type_id;
      }
    });

    console.log(`✅ Mapping complete: ${mappingResult.entity_mappings.length} entities, ${mappingResult.relation_mappings.length} relations`);

    return new Response(
      JSON.stringify({
        success: true,
        entity_mappings: mappingResult.entity_mappings,
        relation_mappings: mappingResult.relation_mappings,
        created_entity_types: Object.keys(createdEntityTypes),
        created_relation_types: Object.keys(createdRelationTypes),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Smart mapping error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
