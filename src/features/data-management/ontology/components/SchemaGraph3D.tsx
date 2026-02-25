import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  PerspectiveCamera,
  GizmoHelper,
  GizmoViewport,
  Line as DreiLine,
} from "@react-three/drei";
import * as THREE from "three";

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
  nodeType?: NodeType; // 엔티티 / 속성 / 관계 레이어 구분용
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  color: string;
  properties: PropertyField[];
  directionality: string;
  weight: number;
}

export interface SchemaGraph3DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  layoutType?: "layered" | "radial";
  priorityFilter?: string;
  highlightedNodeIds?: Set<string>;
}

/** ===================== 공통 유틸 & 레이아웃 ===================== **/

// 포스 시뮬레이션 훅 – 온톨로지 스키마에 최적화된 버전
function useForceSimulation(nodes: GraphNode[], links: GraphLink[], layoutType: "layered" | "radial") {
  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (!nodes.length) {
      setSimulatedNodes([]);
      setSimulatedLinks([]);
      return;
    }

    // 초기 분산
    const INITIAL_SPREAD_XY = 10;
    const INITIAL_SPREAD_Z = 10;

    const nodesCopy: GraphNode[] = nodes.map((n) => ({
      ...n,
      x: n.x ?? (Math.random() - 0.5) * INITIAL_SPREAD_XY,
      y: n.y ?? (Math.random() - 0.5) * INITIAL_SPREAD_XY,
      z: n.z ?? (Math.random() - 0.5) * INITIAL_SPREAD_Z,
    }));

    const linksCopy: GraphLink[] = links.map((l) => ({
      ...l,
      source:
        typeof l.source === "string"
          ? nodesCopy.find((n) => n.id === l.source)!
          : nodesCopy.find((n) => n.id === (l.source as GraphNode).id)!,
      target:
        typeof l.target === "string"
          ? nodesCopy.find((n) => n.id === l.target)!
          : nodesCopy.find((n) => n.id === (l.target as GraphNode).id)!,
    }));

    /** ---------- 레이어 레이아웃 (속성 / 엔티티 / 관계) ---------- **/
    if (layoutType === "layered") {
      const typeOrder: NodeType[] = ["property", "entity", "relation", "other"];
      const activeTypes = typeOrder.filter((t) => nodesCopy.some((n) => (n.nodeType ?? "entity") === t));

      // 레이어 간 기본 Z 오프셋 (z축 기준 정면 배치)
      const layerOffsetZ = 60;
      // 레이어 내부 grid 간격
      const gridSpacingX = 20;
      const gridSpacingY = 20;

      activeTypes.forEach((type, layerIndex) => {
        const layerNodes = nodesCopy.filter((n) => (n.nodeType ?? "entity") === type);
        if (!layerNodes.length) return;

        const count = layerNodes.length;
        const columns = Math.ceil(Math.sqrt(count)); // 대략 정사각형 그리드
        const rows = Math.ceil(count / columns);

        const centerLayerIndex = (activeTypes.length - 1) / 2;
        const baseZ = (layerIndex - centerLayerIndex) * layerOffsetZ;

        layerNodes.forEach((n, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);

          const offsetX = (col - (columns - 1) / 2) * gridSpacingX;
          const offsetY = (row - (rows - 1) / 2) * gridSpacingY;

          n.x = offsetX;
          n.y = offsetY;
          n.z = baseZ;
        });
      });

      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
      return;
    }

    /** ---------- 방사형 레이아웃 ---------- **/
    if (layoutType === "radial") {
      const angleStep = (2 * Math.PI) / nodesCopy.length;
      const radius = 55;
      nodesCopy.forEach((node, i) => {
        node.x = radius * Math.cos(i * angleStep);
        node.y = radius * Math.sin(i * angleStep);
        node.z = (Math.random() - 0.5) * 20;
      });

      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
      return;
    }
  }, [nodes, links, layoutType]);

  return { nodes: simulatedNodes, links: simulatedLinks };
}

/** ===================== 3D 요소들 ===================== **/

// 노드 3D – 글로우 / 코어 / 라벨 / 클릭
function Node3D({
  node,
  focused,
  dimmed,
  onClick,
  priorityFilter,
  highlighted,
}: {
  node: GraphNode;
  focused: boolean;
  dimmed: boolean;
  onClick: (node: GraphNode) => void;
  priorityFilter?: string;
  highlighted?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseColor = useMemo(() => {
    // priority 필터가 활성화된 경우 priority 색상 사용
    if (priorityFilter && priorityFilter !== "all") {
      const priority = (node as any).priority || "medium";
      switch (priority) {
        case "critical":
          return new THREE.Color("#FF0000"); // 레드
        case "high":
          return new THREE.Color("#FF7B00"); // 오렌지
        case "medium":
          return new THREE.Color("#FFFB00"); // 옐로우
        case "low":
          return new THREE.Color("#95FF00"); // 그린
        case "additional":
          return new THREE.Color("#919191"); // 그레이
        default:
          return new THREE.Color("#6b7280");
      }
    }

    // 기본 nodeType 색상
    const nodeType = node.nodeType ?? "entity";
    switch (nodeType) {
      case "entity":
        return new THREE.Color("#0073FF"); // 블루
      case "property":
        return new THREE.Color("#8C00FF"); // 퍼플
      case "relation":
        return new THREE.Color("#FF00A6"); // 핑크
      case "other":
      default:
        return new THREE.Color("#6b7280"); // 그레이
    }
  }, [node.nodeType, node, priorityFilter]);

  const baseRadius = Math.max(node.val / 7, 1.2);
  const maxBoost = focused || highlighted ? 1.5 : hovered ? 1.25 : 1;
  const radius = baseRadius * maxBoost;

  const connectionIntensity = Math.min(node.val / 40, 1);
  // 초기 상태: 중립적인 opacity (0.6)
  // dimmed: 어둡게 (0.3)
  // highlighted: 밝게 (0.95)
  const baseOpacity = dimmed ? 0.3 : highlighted ? 0.95 : 0.6;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);
      const pulse = 1 + (0.04 + connectionIntensity * 0.08) * Math.sin(t * 2.0 + node.id.length);
      meshRef.current.scale.setScalar(pulse);
    }

    if (glowRef.current) {
      glowRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);
      const glowPulse = 1 + (0.06 + connectionIntensity * 0.12) * Math.sin(t * 2.5 + node.id.length * 1.37);
      glowRef.current.scale.setScalar(glowPulse * (focused || highlighted ? 1.4 : 1.0));
    }

    if (coreRef.current) {
      coreRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);
    }
  });

  return (
    <group>
      {/* 외곽 글로우 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 2.8, 24, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={(hovered || focused ? 0.6 : 0.35) * (0.5 + connectionIntensity * 0.8)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 메인 구체 */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={(focused || highlighted ? 2.5 : hovered ? 1.8 : 0.9) * (0.8 + connectionIntensity * 0.6)}
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* 안쪽 코어 */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius * 0.55, 20, 20]} />
        <meshBasicMaterial color={baseColor} transparent opacity={dimmed ? 0.4 : highlighted ? 0.8 : 0.6} />
      </mesh>

      {/* 라벨 – 항상 표시 */}
      <Text
        position={[node.x || 0, (node.y || 0) + radius + 3, (node.z || 0) + 0.1]}
        fontSize={1.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.4}
        outlineColor="#000000"
      >
        {node.label}
      </Text>

      {node.properties?.length > 0 && (
        <Text
          position={[node.x || 0, (node.y || 0) + radius + 5, (node.z || 0) + 0.1]}
          fontSize={1.2}
          color="#a8b5d1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.3}
          outlineColor="#000000"
        >
          {node.properties.length} properties
        </Text>
      )}
    </group>
  );
}

// 링크 3D – 허브 주변이 밝고 두껍게 보이도록
function Link3D({ link, dimmed, isNeighborLink }: { link: GraphLink; dimmed: boolean; isNeighborLink: boolean }) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;

  const points = useMemo(
    () => [
      [source.x || 0, source.y || 0, source.z || 0] as [number, number, number],
      [target.x || 0, target.y || 0, target.z || 0] as [number, number, number],
    ],
    [source.x, source.y, source.z, target.x, target.y, target.z],
  );

  const weightNorm = Math.min(link.weight ?? 0.7, 2);
  const intensity = (isNeighborLink ? 1.0 : 0.6) * (0.6 + 0.4 * (weightNorm / 2));

  const color = useMemo(() => {
    const baseHue = 190 + (link.weight || 0.4) * 40;
    return new THREE.Color().setHSL(baseHue / 360, 0.8, 0.6);
  }, [link.weight]);

  const width = 0.5 + intensity * 2.0;
  const opacity = (dimmed ? 0.35 : 0.8) * (isNeighborLink ? 1.2 : 0.9);

  const midPoint = useMemo(
    () =>
      [
        (source.x || 0) * 0.5 + (target.x || 0) * 0.5,
        (source.y || 0) * 0.5 + (target.y || 0) * 0.5,
        (source.z || 0) * 0.5 + (target.z || 0) * 0.5,
      ] as [number, number, number],
    [source.x, source.y, source.z, target.x, target.y, target.z],
  );

  return (
    <group>
      <DreiLine points={points} color={color} lineWidth={width} transparent opacity={opacity} />

      {/* 관계 라벨 */}
      <Text
        position={midPoint}
        fontSize={1.0}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.3}
        outlineColor="#000000"
      >
        {link.label}
      </Text>

      {/* 방향 화살표 */}
      {link.directionality !== "undirected" && (
        <mesh
          position={[
            (source.x || 0) * 0.6 + (target.x || 0) * 0.4,
            (source.y || 0) * 0.6 + (target.y || 0) * 0.4,
            (source.z || 0) * 0.6 + (target.z || 0) * 0.4,
          ]}
        >
          <coneGeometry args={[0.6, 1.6, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 1.2} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}

// 배경 파티클 – 전체 네뷸라 느낌 (배경색은 투명)
function BackgroundParticles({ count = 800 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 * Math.pow(Math.random(), 0.7);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.03;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.6} sizeAttenuation color="#5f7fb0" transparent opacity={0.25} depthWrite={false} />
    </points>
  );
}

/** 레이어 패널 (엔티티 / 속성 / 관계) **/
function LayerPanels({ nodes }: { nodes: GraphNode[] }) {
  const layers = useMemo(() => {
    const groups = new Map<NodeType, GraphNode[]>();

    nodes.forEach((n) => {
      const type = n.nodeType ?? "entity";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(n);
    });

    const entries: {
      type: NodeType;
      z: number;
      minY: number;
      maxY: number;
      color: string;
      label: string;
    }[] = [];

    const labelByType: Record<NodeType, string> = {
      entity: "Entities",
      property: "Properties",
      relation: "Relations",
      other: "Other",
    };

    const colorByType: Record<NodeType, string> = {
      entity: "#3b82f6",
      property: "#a855f7",
      relation: "#eab308",
      other: "#6b7280",
    };

    (["property", "entity", "relation", "other"] as NodeType[]).forEach((type) => {
      const group = groups.get(type);
      if (!group || !group.length) return;

      const zs = group.map((n) => n.z ?? 0);
      const ys = group.map((n) => n.y ?? 0);
      const z = zs.reduce((a, b) => a + b, 0) / zs.length;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      entries.push({
        type,
        z,
        minY,
        maxY,
        color: colorByType[type],
        label: labelByType[type],
      });
    });

    return entries;
  }, [nodes]);

  return (
    <>
      {layers.map((layer) => {
        const height = (layer.maxY - layer.minY || 40) + 30;
        const centerY = (layer.maxY + layer.minY) / 2;
        const width = 40;

        return (
          <group key={layer.type}>
            {/* 반투명 패널 */}
            <mesh position={[0, centerY, layer.z]} rotation={[0, 0, 0]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial color={layer.color} transparent opacity={0.08} />
            </mesh>

            {/* 레이어 라벨 */}
            <Text
              position={[0, layer.maxY + 12, layer.z + 0.1]}
              fontSize={2.2}
              color={layer.color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.4}
              outlineColor="#000000"
            >
              {layer.label}
            </Text>
          </group>
        );
      })}
    </>
  );
}

/** ===================== Scene & 메인 컴포넌트 ===================== **/

function Scene({ nodes, links, onNodeClick, layoutType, priorityFilter, highlightedNodeIds }: SchemaGraph3DProps) {
  const { camera } = useThree();

  const { nodes: simNodes, links: simLinks } = useForceSimulation(nodes, links, layoutType);

  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    camera.position.set(0, 0, 160);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 인접 노드/링크 계산
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    simLinks.forEach((l) => {
      const s = (l.source as GraphNode).id;
      const t = (l.target as GraphNode).id;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [simLinks]);

  // 하이라이트된 노드들의 이웃 계산
  const highlightedNeighbors = useMemo(() => {
    if (!highlightedNodeIds || highlightedNodeIds.size === 0) return new Set<string>();
    
    const neighbors = new Set<string>();
    highlightedNodeIds.forEach((nodeId) => {
      const nodeNeighbors = neighborMap.get(nodeId);
      if (nodeNeighbors) {
        nodeNeighbors.forEach((n) => neighbors.add(n));
      }
      neighbors.add(nodeId); // 하이라이트된 노드 자체도 포함
    });
    return neighbors;
  }, [highlightedNodeIds, neighborMap]);

  const handleNodeClick = (n: GraphNode) => {
    setFocusedId((prev) => (prev === n.id ? null : n.id));
    onNodeClick?.(n);
  };

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[40, 40, 80]} intensity={1.0} color="#d0ffff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#7fe8ff" />
      <pointLight position={[-60, -40, -60]} intensity={0.5} color="#2050ff" />

      {/* 네뷸라 파티클 */}
      <BackgroundParticles count={900} />

      {/* 레이어 패널 (layered 모드일 때) */}
      {layoutType === "layered" && <LayerPanels nodes={simNodes} />}

      {/* 링크 → 노드 순으로 렌더 */}
      {simLinks.map((link, i) => {
        const s = (link.source as GraphNode).id;
        const t = (link.target as GraphNode).id;

        // 하이라이트가 있으면 하이라이트 기준으로, 없으면 포커스 기준으로
        let isNeighborLink: boolean;
        let dimmed: boolean;
        
        if (highlightedNodeIds && highlightedNodeIds.size > 0) {
          isNeighborLink = highlightedNeighbors.has(s) && highlightedNeighbors.has(t);
          dimmed = !isNeighborLink;
        } else {
          isNeighborLink = !focusedId || s === focusedId || t === focusedId;
          dimmed = !!focusedId && !isNeighborLink;
        }

        return <Link3D key={`link-${i}-${s}-${t}`} link={link} dimmed={dimmed} isNeighborLink={isNeighborLink} />;
      })}

      {simNodes.map((node) => {
        const isFocused = focusedId === node.id;
        
        // 검색 하이라이트 처리
        const isHighlighted = highlightedNodeIds ? highlightedNodeIds.has(node.id) : false;
        
        // 하이라이트가 있으면 하이라이트 기준으로, 없으면 포커스 기준으로 dimmed 처리
        let dimmed: boolean;
        if (highlightedNodeIds && highlightedNodeIds.size > 0) {
          dimmed = !highlightedNeighbors.has(node.id);
        } else {
          const neighbors = neighborMap.get(focusedId || "") ?? new Set();
          const isNeighbor = neighbors.has(node.id);
          dimmed = !!focusedId && !isFocused && !isNeighbor;
        }

        return (
          <Node3D
            key={node.id}
            node={node}
            focused={isFocused}
            dimmed={dimmed}
            onClick={handleNodeClick}
            priorityFilter={priorityFilter}
            highlighted={isHighlighted}
          />
        );
      })}
    </>
  );
}

export function SchemaGraph3D({
  nodes,
  links,
  onNodeClick,
  layoutType = "layered",
  priorityFilter,
  highlightedNodeIds,
}: SchemaGraph3DProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "650px",
        borderRadius: "0.75rem",
        overflow: "hidden",
        // 배경색 없음 → 상위 레이아웃 배경이 그대로 비침
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true, // 투명 캔버스
          powerPreference: "high-performance",
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 160]} fov={70} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={60}
          maxDistance={320}
          autoRotate
          autoRotateSpeed={0.35}
        />

        <Scene
          nodes={nodes}
          links={links}
          onNodeClick={onNodeClick}
          layoutType={layoutType}
          priorityFilter={priorityFilter}
          highlightedNodeIds={highlightedNodeIds}
        />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={["#ff5555", "#55ff99", "#5599ff"]} labelColor="#ffffff" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
