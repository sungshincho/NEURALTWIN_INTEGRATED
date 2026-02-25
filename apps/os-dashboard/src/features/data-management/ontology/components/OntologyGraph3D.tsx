import React, { useState, useMemo } from "react";
import { SchemaGraph3D, GraphNode, GraphLink } from "@/features/data-management/ontology/components/SchemaGraph3D";
import { useOntologySchema, transformSchemaToGraphData } from "@/hooks/useOntologySchema";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type LayoutType = "layered" | "radial";
type NodeTypeFilter = "entity" | "property" | "relation" | "all";
type PriorityFilter = "critical" | "high" | "medium" | "low" | "additional" | "all";

export function OntologyGraph3D() {
  // 현재 로그인한 사용자의 온톨로지 스키마 가져오기
  const { data: schemaData, isLoading } = useOntologySchema();
  
  const [layoutType, setLayoutType] = useState<LayoutType>("layered");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 스키마 데이터를 그래프 형식으로 변환
  const { nodes, links } = useMemo(() => {
    if (!schemaData) {
      return { nodes: [], links: [] };
    }
    return transformSchemaToGraphData(schemaData.entityTypes, schemaData.relationTypes);
  }, [schemaData]);

  // 검색 결과 하이라이트 및 필터링
  const { filteredNodes, filteredLinks, highlightedNodeIds } = useMemo(() => {
    let workingNodes = nodes;

    // 노드 타입 필터
    if (nodeTypeFilter !== "all") {
      workingNodes = workingNodes.filter((n) => n.nodeType === nodeTypeFilter);
    }

    // 중요도 필터
    if (priorityFilter !== "all") {
      workingNodes = workingNodes.filter((n) => (n as any).priority === priorityFilter);
    }

    // 검색 하이라이트
    const highlighted = new Set<string>();
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      workingNodes.forEach((n) => {
        // 노드 이름으로 검색
        const labelMatch = n.label?.toLowerCase().includes(query);
        const nameMatch = n.name?.toLowerCase().includes(query);
        
        // 속성 이름으로도 검색 (엔티티인 경우)
        const propertyMatch = n.properties?.some((p) => 
          p.name?.toLowerCase().includes(query)
        );
        
        if (labelMatch || nameMatch || propertyMatch) {
          highlighted.add(n.id);
        }
      });
    }

    // 필터링된 노드 ID 세트
    const nodeIds = new Set(workingNodes.map((n) => n.id));

    // 필터링된 노드에 연결된 링크만 포함
    const workingLinks = links.filter((l) => {
      const sourceId = typeof l.source === "string" ? l.source : l.source.id;
      const targetId = typeof l.target === "string" ? l.target : l.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { 
      filteredNodes: workingNodes, 
      filteredLinks: workingLinks,
      highlightedNodeIds: highlighted.size > 0 ? highlighted : undefined
    };
  }, [nodes, links, nodeTypeFilter, priorityFilter, searchQuery]);

  // 통계 계산
  const stats = useMemo(() => {
    const entityCount = filteredNodes.filter((n) => n.nodeType === "entity").length;
    const propertyCount = filteredNodes.filter((n) => n.nodeType === "property").length;
    const relationCount = filteredNodes.filter((n) => n.nodeType === "relation").length;
    const totalCount = filteredNodes.length;

    return {
      entity: entityCount,
      property: propertyCount,
      relation: relationCount,
      total: totalCount,
    };
  }, [filteredNodes]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 데이터가 없는 경우
  if (filteredNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
        <p className="text-muted-foreground">온톨로지 스키마가 비어있습니다.</p>
        <p className="text-sm text-muted-foreground">
          마스터 스키마 로딩 중이거나 검색 조건에 맞는 결과가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 w-full h-full p-2">
      {/* 좌측 3D 그래프 영역 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 검색창 */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="엔티티, 속성, 관계 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
        </div>

        {/* 필터 및 레이아웃 선택 UI */}
        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-4">
            {/* 레이아웃 선택 */}
            <div className="text-sm text-gray-400">
              Layout:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as LayoutType)}
              >
                <option value="layered">Layered (Property / Entity / Relation)</option>
                <option value="radial">Radial</option>
              </select>
            </div>

            {/* 노드 타입 필터 */}
            <div className="text-sm text-gray-400">
              Node Type:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={nodeTypeFilter}
                onChange={(e) => setNodeTypeFilter(e.target.value as NodeTypeFilter)}
              >
                <option value="all">All</option>
                <option value="entity" style={{ color: "#0073FF" }}>
                  엔티티 (블루)
                </option>
                <option value="property" style={{ color: "#8C00FF" }}>
                  속성 (퍼플)
                </option>
                <option value="relation" style={{ color: "#FF00A6" }}>
                  관계 (핑크)
                </option>
              </select>
            </div>

            {/* 중요도 필터 */}
            <div className="text-sm text-gray-400">
              Priority:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              >
                <option value="all">All</option>
                <option value="critical" style={{ color: "#FF0000" }}>
                  Critical (레드)
                </option>
                <option value="high" style={{ color: "#FF7B00" }}>
                  High (오렌지)
                </option>
                <option value="medium" style={{ color: "#FFFB00" }}>
                  Medium (옐로우)
                </option>
                <option value="low" style={{ color: "#95FF00" }}>
                  Low (그린)
                </option>
                <option value="additional" style={{ color: "#919191" }}>
                  Additional (그레이)
                </option>
              </select>
            </div>
          </div>

          {selectedNode && (
            <div className="text-xs text-gray-300">
              Selected: <span className="font-semibold">{selectedNode.label}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <SchemaGraph3D
            nodes={filteredNodes}
            links={filteredLinks}
            layoutType={layoutType}
            priorityFilter={priorityFilter}
            highlightedNodeIds={highlightedNodeIds}
            onNodeClick={(node) => setSelectedNode(node)}
          />
        </div>

        {/* 통계 정보 */}
        <div className="mt-3 grid grid-cols-4 gap-3 bg-black/60 border border-white/10 rounded-lg p-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <div className="text-xs">
              <div className="text-gray-400">엔티티</div>
              <div className="text-white font-semibold">{stats.entity}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <div className="text-xs">
              <div className="text-gray-400">속성</div>
              <div className="text-white font-semibold">{stats.property}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="text-xs">
              <div className="text-gray-400">관계</div>
              <div className="text-white font-semibold">{stats.relation}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="text-xs">
              <div className="text-gray-400">총 노드</div>
              <div className="text-white font-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 선택 노드 상세 패널 */}
      <div className="w-80 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-gray-200 overflow-y-auto flex-shrink-0">
        <div className="font-semibold text-sm mb-2 sticky top-0 bg-black/60 pb-2">Node Details</div>
        {selectedNode ? (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] text-gray-400">ID</div>
              <div className="break-all">{selectedNode.id}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Label</div>
              <div>{selectedNode.label}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Type</div>
              <div>{selectedNode.nodeType ?? "entity"}</div>
            </div>
            {selectedNode.properties?.length > 0 && (
              <div>
                <div className="text-[10px] text-gray-400 mb-1">Properties ({selectedNode.properties.length})</div>
                <ul className="max-h-52 overflow-auto pr-1 space-y-0.5">
                  {selectedNode.properties.map((p) => (
                    <li key={p.id}>
                      <span className="font-mono text-[11px] text-emerald-300">{p.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {" "}
                        : {p.type} {p.required ? "(required)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(selectedNode.nodeType === "entity" || selectedNode.nodeType === "relation") && (() => {
              const connectedProperties = filteredLinks
                .filter(link => {
                  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                  const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                  return (sourceId === selectedNode.id || targetId === selectedNode.id);
                })
                .map(link => {
                  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                  const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                  const connectedId = sourceId === selectedNode.id ? targetId : sourceId;
                  return filteredNodes.find(n => n.id === connectedId && n.nodeType === 'property');
                })
                .filter(Boolean);
              
              return connectedProperties.length > 0 ? (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Connected Properties ({connectedProperties.length})</div>
                  <ul className="max-h-52 overflow-auto pr-1 space-y-0.5">
                    {connectedProperties.map((p) => (
                      <li key={p!.id}>
                        <span className="font-mono text-[11px] text-purple-300">{p!.label}</span>
                        <span className="text-[10px] text-gray-400"> (property node)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="text-gray-500 text-[11px]">노드를 클릭하면 상세 정보가 여기에 표시됩니다.</div>
        )}
      </div>
    </div>
  );
}
