// src/features/ontology/utils/buildRetailOntologyGraph.ts
import {
  COMPREHENSIVE_ENTITY_TYPES,
  COMPREHENSIVE_RELATION_TYPES,
} from "@/features/data-management/ontology/utils/comprehensiveRetailSchema";

// ⚠️ SchemaGraph3D에서 쓰고 있는 타입 정의와 동일하게 맞춰주세요.
export interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export type NodeType = "entity" | "property" | "relation" | "other";

export interface GraphNode {
  id: string;
  name: string;
  label: string;
  color: string;
  properties: PropertyField[];
  val: number;
  nodeType?: NodeType;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  color: string;
  properties: PropertyField[];
  directionality: string;
  weight: number;
}

/**
 * NEURALTWIN 리테일 온톨로지 스키마 v2.1 을
 * OntologyGraph3D (3D 스키마 그래프)에서 쓸 수 있는 nodes/links로 변환
 *
 * - 엔티티 타입 1개당: nodeType: "entity"
 * - 각 엔티티의 속성마다 별도의 "property" 노드 + 엔티티 → 속성 링크
 * - 각 관계 타입마다: "relation" 노드 + (source 엔티티 → relation 노드 → target 엔티티) 링크
 */
export function buildRetailOntologyGraphData(): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  /** 1) 엔티티 타입 노드 생성 (Entity Layer) */
  const entityNodes: GraphNode[] = COMPREHENSIVE_ENTITY_TYPES.map(
    (entity, index): GraphNode => {
      const properties: PropertyField[] = entity.properties.map(
        (p: any, i: number) => ({
          id: `${entity.name}.${p.name}`,
          name: p.name,
          label: p.name,
          type: p.type,
          required: !!p.required,
        })
      );

      // val: 대략적인 node “중요도/크기” – 속성 수 + 우선순위에 따라 조금 키움
      const baseVal = 10 + properties.length * 0.8;

      return {
        id: entity.name, // e.g. "Product"
        name: entity.name,
        label: entity.label ?? entity.name,
        color: entity.color ?? "#3b82f6",
        properties,
        val: baseVal,
        nodeType: "entity",
      };
    }
  );

  /** 2) 속성 노드 생성 (Property Layer) */
  const propertyNodes: GraphNode[] = COMPREHENSIVE_ENTITY_TYPES.flatMap(
    (entity): GraphNode[] => {
      const color = entity.color ?? "#6b7280";

      return entity.properties.map((p: any, i: number) => {
        const id = `${entity.name}.${p.name}`;
        const label = `${p.name}`;
        const fields: PropertyField[] = [
          {
            id,
            name: p.name,
            label: p.name,
            type: p.type,
            required: !!p.required,
          },
        ];

        return {
          id,
          name: p.name,
          label,
          color,
          properties: fields,
          val: 5,
          nodeType: "property",
        };
      });
    }
  );

  /** 3) 관계 타입 노드 생성 (Relation Layer) */
  const relationNodes: GraphNode[] = COMPREHENSIVE_RELATION_TYPES.map(
    (relation, idx): GraphNode => {
      const properties: PropertyField[] = relation.properties.map(
        (p: any, i: number) => ({
          id: `${relation.name}.${p.name}`,
          name: p.name,
          label: p.name,
          type: p.type,
          required: !!p.required,
        })
      );

      const baseColor = "#eab308"; // Relations 공통 색 (노랑 계열)
      const val = 12 + properties.length * 0.5;

      return {
        id: relation.name, // e.g. "CONTAINS"
        name: relation.name,
        label: relation.label ?? relation.name,
        color: baseColor,
        properties,
        val,
        nodeType: "relation",
      };
    }
  );

  nodes.push(...entityNodes, ...propertyNodes, ...relationNodes);

  /** ID → Node lookup map (엔티티 이름, relation 이름 기준) */
  const nodeById = new Map<string, GraphNode>();
  nodes.forEach((n) => {
    nodeById.set(n.id, n);
  });

  /** 4) 엔티티 → 속성 링크 생성 */
  COMPREHENSIVE_ENTITY_TYPES.forEach((entity) => {
    entity.properties.forEach((p: any) => {
      const sourceId = entity.name;
      const targetId = `${entity.name}.${p.name}`;

      if (!nodeById.has(sourceId) || !nodeById.has(targetId)) return;

      links.push({
        source: sourceId,
        target: targetId,
        label: "hasProperty",
        color: entity.color ?? "#9ca3af",
        properties: [],
        directionality: "directed",
        weight: 0.5,
      });
    });
  });

  /** 5) 관계 타입 기반 링크 생성
   *
   * triad 패턴:
   *   sourceEntity  →  relationTypeNode  →  targetEntity
   *
   * 이렇게 하면 레이어 모드에서
   * - 왼쪽: 엔티티
   * - 가운데/오른쪽: relation 노드
   * - 링크는 두 단계로 분리되어 구조가 더 잘 보임
   */
  COMPREHENSIVE_RELATION_TYPES.forEach((relation) => {
    const relationNodeId = relation.name;
    const sourceEntityId = relation.source_entity_type;
    const targetEntityId = relation.target_entity_type;

    const relationColor = "#eab308";

    // 5-1) source 엔티티 → relation 노드
    if (nodeById.has(sourceEntityId) && nodeById.has(relationNodeId)) {
      links.push({
        source: sourceEntityId,
        target: relationNodeId,
        label: relation.label ?? relation.name,
        color: relationColor,
        properties: [],
        directionality: relation.directionality ?? "directed",
        weight: 1.0,
      });
    }

    // 5-2) relation 노드 → target 엔티티
    if (nodeById.has(relationNodeId) && nodeById.has(targetEntityId)) {
      links.push({
        source: relationNodeId,
        target: targetEntityId,
        label: relation.label ?? relation.name,
        color: relationColor,
        properties: [],
        directionality: relation.directionality ?? "directed",
        weight: 1.0,
      });
    }
  });

  return { nodes, links };
}
