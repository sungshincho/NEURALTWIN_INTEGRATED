import { supabase } from "@/integrations/supabase/client";

/**
 * 삭제된 파일의 엔티티 참조를 자동으로 정리
 * - ontology_entity_types의 model_3d_url 제거
 * - graph_entities의 properties.model_url 제거
 */
export async function cleanupEntityReferences(
  fileUrl: string,
  userId: string
): Promise<{ success: boolean; entityTypesUpdated: number; entitiesUpdated: number }> {
  try {
    console.log('🧹 Cleaning up entity references for:', fileUrl);

    // 1. ontology_entity_types에서 해당 URL 제거
    const { data: entityTypes, error: entityTypesError } = await supabase
      .from('ontology_entity_types')
      .update({ model_3d_url: null })
      .eq('user_id', userId)
      .eq('model_3d_url', fileUrl)
      .select();

    if (entityTypesError) {
      console.error('Error updating entity types:', entityTypesError);
    } else {
      console.log(`✅ Updated ${entityTypes?.length || 0} entity types`);
    }

    // 2. graph_entities에서 properties.model_url 제거
    const { data: entities, error: entitiesError } = await supabase
      .from('graph_entities')
      .select('id, properties')
      .eq('user_id', userId);

    let entitiesUpdatedCount = 0;

    if (!entitiesError && entities) {
      const entitiesToUpdate = entities.filter(
        (entity) => entity.properties && (entity.properties as any).model_url === fileUrl
      );

      for (const entity of entitiesToUpdate) {
        const newProperties = { ...(entity.properties as any) };
        delete newProperties.model_url;

        const { error: updateError } = await supabase
          .from('graph_entities')
          .update({ properties: newProperties })
          .eq('id', entity.id);

        if (!updateError) {
          entitiesUpdatedCount++;
        } else {
          console.error(`Error updating entity ${entity.id}:`, updateError);
        }
      }

      console.log(`✅ Cleaned up ${entitiesUpdatedCount} entity instances`);
    }

    return {
      success: true,
      entityTypesUpdated: entityTypes?.length || 0,
      entitiesUpdated: entitiesUpdatedCount
    };
  } catch (error) {
    console.error('Error in cleanupEntityReferences:', error);
    return {
      success: false,
      entityTypesUpdated: 0,
      entitiesUpdated: 0
    };
  }
}
