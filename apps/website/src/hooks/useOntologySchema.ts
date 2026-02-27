import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GraphNode, GraphLink } from '@/features/data-management/ontology/components/SchemaGraph3D';

/**
 * 마스터 온톨로지 + 사용자 커스텀 스키마를 가져오는 Hook
 * - 마스터 타입: org_id IS NULL AND user_id IS NULL
 * - 사용자 타입: user_id = current_user (마스터 타입 오버라이드 가능)
 */
export function useOntologySchema() {
  return useQuery({
    queryKey: ['ontology-schema'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // 마스터 타입 + 사용자 타입 통합 조회
      const { data: entityTypes, error: entityError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.user.id}`)
        .order('name');

      if (entityError) throw entityError;

      // 관계 타입도 동일하게 처리
      const { data: relationTypes, error: relationError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.user.id}`)
        .order('name');

      if (relationError) throw relationError;

      // 사용자 타입이 마스터 타입보다 우선 (이름 기준 중복 제거)
      const deduplicatedEntityTypes = deduplicateByName(entityTypes || []);
      const deduplicatedRelationTypes = deduplicateByName(relationTypes || []);

      return {
        entityTypes: deduplicatedEntityTypes,
        relationTypes: deduplicatedRelationTypes
      };
    }
  });
}

/**
 * 이름 기준 중복 제거 - 사용자 타입(user_id != null)이 마스터 타입보다 우선
 */
function deduplicateByName<T extends { name: string; user_id: string | null }>(items: T[]): T[] {
  const byName = new Map<string, T>();
  for (const item of items) {
    const existing = byName.get(item.name);
    // 사용자 타입이 마스터 타입보다 우선
    if (!existing || (item.user_id !== null && existing.user_id === null)) {
      byName.set(item.name, item);
    }
  }
  return Array.from(byName.values());
}

/**
 * 온톨로지 스키마를 3D 그래프 형식으로 변환
 */
export function transformSchemaToGraphData(entityTypes: any[], relationTypes: any[]): { nodes: GraphNode[], links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // 엔티티 타입 → 노드 변환
  entityTypes.forEach(entityType => {
    // 엔티티 노드 추가
    nodes.push({
      id: `entity-${entityType.name}`,
      name: entityType.label || entityType.name,
      label: entityType.label || entityType.name,
      nodeType: 'entity',
      color: '#3b82f6', // 블루
      val: 8,
      properties: [],
      priority: entityType.priority || 'medium',
    } as any);

    // 속성(properties) 노드 추가
    if (entityType.properties && typeof entityType.properties === 'object') {
      const properties = Array.isArray(entityType.properties) 
        ? entityType.properties 
        : Object.keys(entityType.properties);
      
      properties.forEach((prop: any) => {
        const propName = typeof prop === 'string' ? prop : prop.name;
        const propId = `prop-${entityType.name}-${propName}`;
        
        nodes.push({
          id: propId,
          name: propName,
          label: propName,
          nodeType: 'property',
          color: '#a855f7', // 퍼플
          val: 4,
          properties: [],
          priority: entityType.priority || 'medium', // 부모 엔티티의 priority 상속
        } as any);

        // 엔티티 → 속성 링크
        links.push({
          source: `entity-${entityType.name}`,
          target: propId,
          label: 'has_property',
          color: '#6b7280',
          properties: [],
          directionality: 'unidirectional',
          weight: 1,
        });
      });
    }
  });

  // 관계 타입 → 노드 및 링크 변환
  relationTypes.forEach(relationType => {
    const relationId = `relation-${relationType.name}-${relationType.source_entity_type}-${relationType.target_entity_type}`;
    
    // 관계 노드 추가
    nodes.push({
      id: relationId,
      name: relationType.label || relationType.name,
      label: relationType.label || relationType.name,
      nodeType: 'relation',
      color: '#eab308', // 옐로우
      val: 6,
      properties: [],
      priority: relationType.priority || 'medium',
    } as any);

    // source 엔티티 → 관계 링크
    const sourceEntityId = `entity-${relationType.source_entity_type}`;
    if (nodes.some(n => n.id === sourceEntityId)) {
      links.push({
        source: sourceEntityId,
        target: relationId,
        label: 'source',
        color: '#9ca3af',
        properties: [],
        directionality: relationType.directionality || 'unidirectional',
        weight: 1,
      });
    }

    // 관계 → target 엔티티 링크
    const targetEntityId = `entity-${relationType.target_entity_type}`;
    if (nodes.some(n => n.id === targetEntityId)) {
      links.push({
        source: relationId,
        target: targetEntityId,
        label: 'target',
        color: '#9ca3af',
        properties: [],
        directionality: relationType.directionality || 'unidirectional',
        weight: 1,
      });
    }
  });

  return { nodes, links };
}
