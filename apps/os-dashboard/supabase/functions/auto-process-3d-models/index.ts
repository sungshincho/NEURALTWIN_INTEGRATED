import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, storeId } = await req.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('files array is required');
    }

    if (!storeId) {
      throw new Error('storeId is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Processing ${files.length} files for user ${userId}, store ${storeId}`);

    // 1. 기존 엔티티 타입 가져오기
    const { data: existingTypes, error: typesError } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', userId);

    if (typesError) throw typesError;

    // 2. 파일명 그룹화 (mannequin_1, mannequin_2 -> mannequin)
    const groupedFiles: Record<string, typeof files> = {};
    for (const file of files) {
      const baseName = file.fileName.replace(/\.(glb|gltf)$/i, '').replace(/_\d+$|_$/, '');
      if (!groupedFiles[baseName]) {
        groupedFiles[baseName] = [];
      }
      groupedFiles[baseName].push(file);
    }

    console.log(`Grouped into ${Object.keys(groupedFiles).length} base names`);

    const results = [];

    // 3. 각 그룹 처리
    for (const [baseName, groupFiles] of Object.entries(groupedFiles)) {
      console.log(`Processing group: ${baseName} with ${groupFiles.length} files`);

      // AI로 엔티티 타입 결정
      const representativeFile = groupFiles[0];
      const prompt = `
You are an AI assistant that analyzes 3D model filenames for retail store environments.

Available Entity Types:
${existingTypes?.map(et => `- ${et.name}: ${et.label}`).join('\n') || 'None'}

3D Model Filename: "${representativeFile.fileName}"
Base Name: "${baseName}"

Tasks:
1. Infer what this represents (e.g., mannequin, display table, shelf, store building)
2. If it matches an existing entity type, return that name
3. If not, suggest a new entity type name and label (Korean)
4. Suggest dimensions (width, height, depth in meters)
5. Determine type: space, furniture, product, or other

Return JSON:
{
  "entity_type_name": "Display" or new name,
  "entity_type_label": "디스플레이" or new label,
  "is_new_type": true/false,
  "type": "space" | "furniture" | "product" | "other",
  "suggested_dimensions": {"width": 0.4, "height": 1.6, "depth": 0.4},
  "reasoning": "explanation"
}

Important Type Guidelines:
- Use "space" for: Store, Room, Building, Floor (large environment/structure models)
- Use "furniture" for: Shelves, Tables, Displays, Counters, Mannequins, Racks
- Use "product" for: Individual sellable items
- Use "other" only if none of the above apply`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You analyze 3D models for retail stores. Always return valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI analysis failed:', await aiResponse.text());
        throw new Error('AI analysis failed');
      }

      const aiData = await aiResponse.json();
      const analysis = JSON.parse(aiData.choices[0].message.content);
      console.log('AI Analysis:', analysis);

      // 4. 엔티티 타입 생성 또는 가져오기
      let entityTypeId: string;
      const firstFileUrl = groupFiles[0].publicUrl;
      
      if (analysis.is_new_type) {
        // 새 엔티티 타입 생성 (첫 번째 파일을 대표 모델로 설정)
        const { data: newType, error: createError } = await supabase
          .from('ontology_entity_types')
          .insert({
            user_id: userId,
            name: analysis.entity_type_name,
            label: analysis.entity_type_label,
            description: `AI-generated from ${baseName}`,
            model_3d_type: analysis.type,
            model_3d_dimensions: analysis.suggested_dimensions,
            model_3d_url: firstFileUrl,
            properties: []
          })
          .select()
          .single();

        if (createError) throw createError;
        entityTypeId = newType.id;
        console.log(`Created new entity type: ${analysis.entity_type_label} (${entityTypeId}) with model URL`);
      } else {
        // 기존 타입 사용 (model_3d_url이 없으면 업데이트)
        const existingType = existingTypes?.find(t => t.name === analysis.entity_type_name);
        if (!existingType) {
          throw new Error(`Entity type ${analysis.entity_type_name} not found`);
        }
        entityTypeId = existingType.id;
        
        // model_3d_url이 없으면 첫 번째 파일로 설정
        if (!existingType.model_3d_url) {
          const { error: updateError } = await supabase
            .from('ontology_entity_types')
            .update({ 
              model_3d_url: firstFileUrl,
              model_3d_dimensions: analysis.suggested_dimensions 
            })
            .eq('id', entityTypeId);
          
          if (updateError) console.error('Failed to update model_3d_url:', updateError);
          else console.log(`Updated entity type ${existingType.label} with model URL`);
        }
        
        console.log(`Using existing entity type: ${existingType.label} (${entityTypeId})`);
      }

      // 5. 매장 컨텍스트 수집 (AI 배치를 위한 정보)
      const { data: storeEntities, error: storeError } = await supabase
        .from('graph_entities')
        .select(`
          id,
          label,
          model_3d_position,
          entity_type_id,
          entity_types:entity_type_id (
            name,
            label,
            model_3d_type,
            model_3d_dimensions
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', userId);

      if (storeError) console.error('Failed to fetch store context:', storeError);

      const storeContext = {
        existing_furniture: storeEntities?.map(e => ({
          label: e.label,
          position: e.model_3d_position,
          type: e.entity_types?.name,
          dimensions: e.entity_types?.model_3d_dimensions
        })) || [],
        entrance_position: { x: 0, y: 0, z: 0 }, // 기본 출입구
        store_bounds: { width: 20, depth: 15 } // 기본 매장 크기
      };

      // 6. 메타데이터 JSON 확인 (As-Is 배치용)
      const metadataCache: Record<string, any> = {};
      for (const file of groupFiles) {
        const metadataFileName = file.fileName.replace(/\.(glb|gltf)$/i, '.json');
        try {
          const { data: metadataFile } = await supabase.storage
            .from('3d-models')
            .download(`${userId}/${storeId}/${metadataFileName}`);
          
          if (metadataFile) {
            const metadataText = await metadataFile.text();
            metadataCache[file.fileName] = JSON.parse(metadataText);
            console.log(`Found metadata for ${file.fileName}`);
          }
        } catch (e) {
          // 메타데이터 없음 - AI 배치 사용
        }
      }

      // 7. 각 파일을 인스턴스로 생성 (As-Is or AI 배치)
      for (let i = 0; i < groupFiles.length; i++) {
        const file = groupFiles[i];
        const instanceLabel = groupFiles.length > 1 
          ? `${analysis.entity_type_label} ${i + 1}`
          : analysis.entity_type_label;

        const metadata = metadataCache[file.fileName];
        let finalPosition = { x: 0, y: 0, z: 0 };
        let finalRotation = { x: 0, y: 0, z: 0 };
        let reasoning = "";
        let placementMode = "ai";

        // Scenario 1: As-Is 배치 (current_position이 있으면)
        if (metadata?.current_position) {
          finalPosition = metadata.current_position;
          finalRotation = metadata.current_rotation || { x: 0, y: 0, z: 0 };
          reasoning = "As-Is 레이아웃: 현재 매장 배치 그대로 구현";
          placementMode = "as-is";
          console.log(`As-Is Placement: ${instanceLabel} at (${finalPosition.x}, ${finalPosition.z})`);
        } 
        // Scenario 2: AI 기반 지능형 배치
        else {
          try {
            const placementPrompt = `
You are an AI assistant that optimizes furniture placement in retail stores.

New Furniture:
- Type: ${analysis.entity_type_label}
- Dimensions: ${JSON.stringify(analysis.suggested_dimensions)}
- Category: ${analysis.type}

Store Context:
- Entrance: ${JSON.stringify(storeContext.entrance_position)}
- Store Size: ${JSON.stringify(storeContext.store_bounds)}
- Existing Furniture: ${JSON.stringify(storeContext.existing_furniture.slice(0, 20))}

Placement Guidelines:
1. 고객 동선 최적화 (출입구에서 자연스러운 흐름)
2. 가시성 극대화 (주요 위치 우선 배치)
3. 기존 가구와 안전 거리 유지 (최소 1.5m)
4. Zone별 밀도 균형 (과밀 방지)
5. ${analysis.type === 'furniture' ? '판매 구역에 배치' : analysis.type === 'product' ? '진열대 근처 배치' : '매장 구조에 맞게 배치'}

Return optimal position using tool call.`;

            const placementResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: 'You optimize furniture placement in retail stores.' },
                  { role: 'user', content: placementPrompt }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "suggest_placement",
                    description: "Suggest optimal 3D position for furniture placement",
                    parameters: {
                      type: "object",
                      properties: {
                        position: {
                          type: "object",
                          properties: {
                            x: { type: "number", description: "X coordinate in meters" },
                            y: { type: "number", description: "Y coordinate in meters (usually 0)" },
                            z: { type: "number", description: "Z coordinate in meters" }
                          },
                          required: ["x", "y", "z"]
                        },
                        reasoning: {
                          type: "string",
                          description: "Explanation for this placement decision"
                        }
                      },
                      required: ["position", "reasoning"]
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "suggest_placement" } }
              }),
            });

            if (placementResponse.ok) {
              const placementData = await placementResponse.json();
              const toolCall = placementData.choices[0].message.tool_calls?.[0];
              if (toolCall) {
                const args = JSON.parse(toolCall.function.arguments);
                finalPosition = args.position;
                reasoning = args.reasoning;
                placementMode = "ai";
                console.log(`AI Placement: ${instanceLabel} at (${finalPosition.x}, ${finalPosition.z}) - ${reasoning}`);
              }
            } else {
              console.warn('AI placement failed, using fallback grid');
              // Fallback: Grid 배치
              finalPosition = {
                x: (i % 5) * 3,
                y: 0,
                z: Math.floor(i / 5) * 3
              };
              reasoning = "AI 추론 실패, 기본 그리드 배치";
              placementMode = "fallback";
            }
          } catch (placementError) {
            console.error('AI placement error:', placementError);
            // Fallback: Grid 배치
            finalPosition = {
              x: (i % 5) * 3,
              y: 0,
              z: Math.floor(i / 5) * 3
            };
            reasoning = "AI 추론 실패, 기본 그리드 배치";
            placementMode = "fallback";
          }
        }

        const { error: instanceError } = await supabase
          .from('graph_entities')
          .insert({
            user_id: userId,
            store_id: storeId,
            entity_type_id: entityTypeId,
            label: instanceLabel,
            model_3d_position: finalPosition,
            model_3d_rotation: finalRotation,
            model_3d_scale: metadata?.scale || { x: 1, y: 1, z: 1 },
            properties: {
              source: 'auto_upload',
              original_file: file.fileName,
              model_url: file.publicUrl,
              placement_mode: placementMode,
              placement_reasoning: reasoning,
              ...(metadata?.properties || {})
            }
          });

        if (instanceError) throw instanceError;
        console.log(`Created instance: ${instanceLabel} at (${finalPosition.x}, ${finalPosition.z})`);

        results.push({
          fileName: file.fileName,
          entityType: analysis.entity_type_label,
          instanceLabel,
          position: finalPosition,
          placementMode,
          reasoning
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Auto-process error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
