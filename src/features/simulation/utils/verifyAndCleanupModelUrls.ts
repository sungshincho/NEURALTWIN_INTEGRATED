import { supabase } from "@/integrations/supabase/client";

/**
 * 모든 엔티티 타입의 3D 모델 URL을 검증하고, 
 * 존재하지 않는 파일을 가리키는 URL을 자동으로 제거
 * 또한 model_3d_url이 제거된 엔티티 타입을 참조하는 graph_entities도 정리
 */
export async function verifyAndCleanupModelUrls(userId: string, storeId?: string) {
  try {
    console.log('🔍 Starting model URL verification...');

    // 1. model_3d_url이 있는 모든 엔티티 타입 조회
    const { data: entityTypes, error: fetchError } = await supabase
      .from('ontology_entity_types')
      .select('id, name, label, model_3d_url')
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching entity types:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!entityTypes || entityTypes.length === 0) {
      console.log('✅ No entity types with model URLs found');
      return { success: true, checked: 0, cleaned: 0 };
    }

    console.log(`📋 Found ${entityTypes.length} entity types with model URLs`);

    const invalidUrls: Array<{ id: string; name: string; url: string }> = [];

    // 2. 각 URL에 대해 파일 존재 여부 확인
    for (const entityType of entityTypes) {
      const url = entityType.model_3d_url;
      if (!url) continue;

      try {
        // URL에서 bucket과 path 추출
        // 예: https://fbffryjvvykhgoviektl.supabase.co/storage/v1/object/public/3d-models/path/to/file.glb
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length !== 2) {
          console.warn(`⚠️ Invalid URL format: ${url}`);
          invalidUrls.push({ id: entityType.id, name: entityType.name, url });
          continue;
        }

        const [bucket, ...pathParts] = urlParts[1].split('/');
        const filePath = pathParts.join('/');

        // 파일 존재 여부 확인
        const { data: fileData, error: fileError } = await supabase.storage
          .from(bucket)
          .list(filePath.split('/').slice(0, -1).join('/'), {
            search: filePath.split('/').pop()
          });

        if (fileError || !fileData || fileData.length === 0) {
          console.warn(`❌ File not found: ${filePath} in bucket ${bucket}`);
          invalidUrls.push({ id: entityType.id, name: entityType.name, url });
        } else {
          console.log(`✅ File exists: ${entityType.name} (${filePath})`);
        }
      } catch (error) {
        console.error(`Error checking file for ${entityType.name}:`, error);
        invalidUrls.push({ id: entityType.id, name: entityType.name, url });
      }
    }

    // 3. 존재하지 않는 파일을 가리키는 URL 제거
    const cleanedEntityTypeIds: string[] = [];
    if (invalidUrls.length > 0) {
      console.log(`🧹 Cleaning up ${invalidUrls.length} invalid URLs...`);

      for (const invalid of invalidUrls) {
        const { error: updateError } = await supabase
          .from('ontology_entity_types')
          .update({ 
            model_3d_url: null,
            model_3d_type: null,
            model_3d_dimensions: null,
            model_3d_metadata: null
          })
          .eq('id', invalid.id);

        if (updateError) {
          console.error(`Error updating ${invalid.name}:`, updateError);
        } else {
          console.log(`✅ Cleaned entity type: ${invalid.name}`);
          cleanedEntityTypeIds.push(invalid.id);
        }
      }
    }

    // 4. model_3d_url이 없는 엔티티 타입을 참조하는 graph_entities의 3D 정보 제거
    let cleanedEntities = 0;
    if (cleanedEntityTypeIds.length > 0) {
      console.log(`🧹 Cleaning up graph_entities referencing invalid entity types...`);
      
      // 해당 엔티티 타입을 사용하는 모든 graph_entities 조회
      const entityQuery = supabase
        .from('graph_entities')
        .select('id, label, entity_type_id')
        .eq('user_id', userId)
        .in('entity_type_id', cleanedEntityTypeIds);

      if (storeId) {
        entityQuery.eq('store_id', storeId);
      }

      const { data: affectedEntities, error: fetchEntitiesError } = await entityQuery;

      if (fetchEntitiesError) {
        console.error('Error fetching affected entities:', fetchEntitiesError);
      } else if (affectedEntities && affectedEntities.length > 0) {
        console.log(`Found ${affectedEntities.length} entities to clean up`);

        // 3D 관련 정보 제거
        const updateQuery = supabase
          .from('graph_entities')
          .update({
            model_3d_position: null,
            model_3d_rotation: null,
            model_3d_scale: null
          })
          .eq('user_id', userId)
          .in('entity_type_id', cleanedEntityTypeIds);

        if (storeId) {
          updateQuery.eq('store_id', storeId);
        }

        const { error: updateEntitiesError } = await updateQuery;

        if (updateEntitiesError) {
          console.error('Error cleaning up entities:', updateEntitiesError);
        } else {
          cleanedEntities = affectedEntities.length;
          console.log(`✅ Cleaned ${cleanedEntities} graph_entities`);
        }
      }
    }

    // 5. 스토리지에서 orphaned 파일 찾기 (참조되지 않는 파일)
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('3d-models')
      .list('', { limit: 1000 });

    let orphanedFiles = 0;
    if (storageFiles && !listError) {
      const allUrls = entityTypes
        .filter(et => et.model_3d_url)
        .map(et => {
          const urlParts = et.model_3d_url!.split('/storage/v1/object/public/3d-models/');
          return urlParts[1] || '';
        });

      const orphaned = storageFiles.filter(file => {
        const fileName = file.name;
        return !allUrls.some(url => url.includes(fileName));
      });

      orphanedFiles = orphaned.length;
      if (orphanedFiles > 0) {
        console.log(`ℹ️ Found ${orphanedFiles} orphaned files in storage (not referenced by any entity type)`);
      }
    }

    return {
      success: true,
      checked: entityTypes.length,
      cleaned: invalidUrls.length,
      cleanedEntities,
      orphanedFiles,
      invalidUrls: invalidUrls.map(u => ({ name: u.name, url: u.url })),
      affectedEntityTypes: cleanedEntityTypeIds
    };
  } catch (error) {
    console.error('Error in verifyAndCleanupModelUrls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
