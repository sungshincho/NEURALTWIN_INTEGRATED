import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';

/**
 * 마스터 타입 + 사용자 타입 중 이름으로 엔티티 타입 ID 조회
 * 사용자 타입이 마스터 타입보다 우선
 */
async function getEntityTypeId(name: string, userId: string): Promise<string | null> {
  const { data: types } = await supabase
    .from('ontology_entity_types')
    .select('id, user_id')
    .eq('name', name)
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  if (!types || types.length === 0) return null;

  // 사용자 타입 우선, 없으면 마스터 타입 사용
  const userType = types.find(t => t.user_id === userId);
  const masterType = types.find(t => t.user_id === null);
  return userType?.id || masterType?.id || null;
}

/**
 * 마스터 타입 + 사용자 타입 중 이름으로 관계 타입 ID 조회
 * 사용자 타입이 마스터 타입보다 우선
 */
async function getRelationTypeId(name: string, userId: string): Promise<string | null> {
  const { data: types } = await supabase
    .from('ontology_relation_types')
    .select('id, user_id')
    .eq('name', name)
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  if (!types || types.length === 0) return null;

  // 사용자 타입 우선, 없으면 마스터 타입 사용
  const userType = types.find(t => t.user_id === userId);
  const masterType = types.find(t => t.user_id === null);
  return userType?.id || masterType?.id || null;
}

/**
 * 온톨로지 기반 엔티티 데이터를 가져오는 Hook (매장별 필터링)
 */
export function useOntologyEntities(entityTypeName?: string) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['ontology-entities', entityTypeName, selectedStore?.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      let query = supabase
        .from('graph_entities')
        .select(`
          *,
          entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // 매장별 필터링
      if (selectedStore) {
        query = query.eq('store_id', selectedStore.id);
      }

      // 특정 엔티티 타입 필터링 (마스터 + 사용자 타입 지원)
      if (entityTypeName) {
        const entityTypeId = await getEntityTypeId(entityTypeName, user.user.id);
        if (entityTypeId) {
          query = query.eq('entity_type_id', entityTypeId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore, // 매장이 선택되어야만 실행
  });
}

/**
 * 온톨로지 기반 관계 데이터를 가져오는 Hook (매장별 필터링)
 */
export function useOntologyRelations(sourceEntityTypeName?: string, targetEntityTypeName?: string) {
  const { selectedStore } = useSelectedStore();
  
  return useQuery({
    queryKey: ['ontology-relations', sourceEntityTypeName, targetEntityTypeName, selectedStore?.id],
    queryFn: async () => {
      let query = supabase
        .from('graph_relations')
        .select(`
          *,
          source:graph_entities!graph_relations_source_entity_id_fkey(*),
          target:graph_entities!graph_relations_target_entity_id_fkey(*),
          relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // 매장별 필터링
      if (selectedStore) {
        query = query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore, // 매장이 선택되어야만 실행
  });
}

/**
 * 그래프 쿼리: N-hop 탐색
 */
export function useGraphNHop(startEntityId: string, maxHops: number = 2) {
  return useQuery({
    queryKey: ['graph-n-hop', startEntityId, maxHops],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('graph_n_hop_query', {
        p_user_id: user.user.id,
        p_start_entity_id: startEntityId,
        p_max_hops: maxHops,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!startEntityId,
  });
}

/**
 * 온톨로지 데이터를 AI 추론용으로 변환
 */
export function transformToGraphData(entities: any[], relations: any[]) {
  return {
    nodes: entities.map(entity => ({
      id: entity.id,
      label: entity.label,
      type: entity.entity_type?.name || 'unknown',
      properties: entity.properties,
    })),
    edges: relations.map(relation => ({
      id: relation.id,
      source: relation.source_entity_id,
      target: relation.target_entity_id,
      type: relation.relation_type?.name || 'unknown',
      weight: relation.weight,
      properties: relation.properties,
    })),
  };
}

/**
 * 엔티티 타입별 집계 데이터 (매장별 필터링)
 */
export function useEntityAggregation(entityTypeName: string, aggregateField: string) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['entity-aggregation', entityTypeName, aggregateField, selectedStore?.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // 마스터 + 사용자 타입 지원
      const entityTypeId = await getEntityTypeId(entityTypeName, user.user.id);
      if (!entityTypeId) return [];

      let query = supabase
        .from('graph_entities')
        .select('label, properties')
        .eq('entity_type_id', entityTypeId);

      // 매장별 필터링
      if (selectedStore) {
        query = query.eq('store_id', selectedStore.id);
      }

      const { data: entities, error } = await query;

      if (error) throw error;

      // 집계 로직
      return entities?.map(e => ({
        label: e.label,
        value: e.properties?.[aggregateField] || 0,
      })) || [];
    },
    enabled: !!selectedStore,
  });
}

/**
 * 관계 기반 추론: 특정 엔티티와 연결된 다른 엔티티 찾기 (매장별 필터링)
 */
export function useRelatedEntities(entityId: string, relationTypeName?: string) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['related-entities', entityId, relationTypeName, selectedStore?.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      let query = supabase
        .from('graph_relations')
        .select(`
          target:graph_entities!graph_relations_target_entity_id_fkey(*),
          relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
        `)
        .eq('source_entity_id', entityId);

      // 매장별 필터링
      if (selectedStore) {
        query = query.eq('store_id', selectedStore.id);
      }

      // 마스터 + 사용자 타입 지원
      if (relationTypeName) {
        const relationTypeId = await getRelationTypeId(relationTypeName, user.user.id);
        if (relationTypeId) {
          query = query.eq('relation_type_id', relationTypeId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId && !!selectedStore,
  });
}
