import React, { useEffect, useMemo } from 'react';
import { SimulationScene } from '../components/SimulationScene';
import { SimulationControls } from '../components/SimulationControls';
import { SimulationMetrics } from '../components/SimulationMetrics';
import { useSimulationEngine } from '../hooks/useSimulationEngine';
import { useSimulationStore, EntityState } from '@/stores/simulationStore';
import { useOntologyEntities } from '@/hooks/useOntologyData';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Box, AlertTriangle } from 'lucide-react';

// ============== Zone Data Hook ==============

/**
 * zones_dim 테이블에서 구역 데이터를 가져오는 훅
 */
function useZonesData() {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zones-dim', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase
        .from('zones_dim')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============== Entity Conversion ==============

/**
 * zones_dim 데이터를 EntityState로 변환
 */
function convertZonesToEntities(zones: any[]): Record<string, EntityState> {
  const entities: Record<string, EntityState> = {};

  zones.forEach((zone) => {
    // coordinates에서 위치 추출
    const coords = zone.coordinates || {};
    const position: [number, number, number] = [
      coords.x || 0,
      0,
      coords.z || coords.y || 0,
    ];

    // 크기 계산
    const width = coords.width || Math.sqrt(zone.area_sqm || 25);
    const depth = coords.depth || Math.sqrt(zone.area_sqm || 25);

    entities[zone.id] = {
      id: zone.id,
      type: 'Zone',
      position,
      rotation: [0, 0, 0],
      scale: [width, 1, depth],
      metadata: {
        zone_name: zone.zone_name,
        zone_type: zone.zone_type,
        display_name: zone.display_name,
        description: zone.description,
        area_sqm: zone.area_sqm,
        capacity: zone.capacity,
        isEntrance: zone.zone_type === 'entrance',
      },
      isSelected: false,
      isHighlighted: false,
    };
  });

  return entities;
}

/**
 * graph_entities 데이터를 EntityState로 변환 (폴백)
 */
function convertGraphEntitiesToEntities(entities: any[]): Record<string, EntityState> {
  const result: Record<string, EntityState> = {};

  entities.forEach((entity) => {
    const pos = entity.model_3d_position || { x: 0, y: 0, z: 0 };
    const rot = entity.model_3d_rotation || { x: 0, y: 0, z: 0 };
    const scale = entity.model_3d_scale || { x: 1, y: 1, z: 1 };
    const typeName = entity.entity_type?.name || 'Unknown';

    result[entity.id] = {
      id: entity.id,
      type: typeName === 'zone' ? 'Zone' : typeName === 'product' ? 'Furniture' : 'Furniture',
      position: [pos.x || 0, pos.y || 0, pos.z || 0],
      rotation: [rot.x || 0, rot.y || 0, rot.z || 0],
      scale: [scale.x || 1, scale.y || 1, scale.z || 1],
      metadata: {
        ...entity.properties,
        name: entity.label,
        zone_name: entity.label,
        isEntrance: entity.properties?.isEntrance || entity.properties?.zone_type === 'entrance',
      },
      isSelected: false,
      isHighlighted: false,
    };
  });

  return result;
}

// ============== Main Page Component ==============

export function SimulationPage() {
  // Initialize simulation engine
  useSimulationEngine();

  const { setEntities, status, entities } = useSimulationStore();
  const { selectedStore } = useSelectedStore();

  // Load zone data from zones_dim
  const { data: zonesData, isLoading: zonesLoading, error: zonesError } = useZonesData();

  // Fallback: Load from graph_entities if zones_dim is empty
  const { data: graphEntities, isLoading: graphLoading } = useOntologyEntities();

  // Combined loading state
  const isLoading = zonesLoading || graphLoading;

  // Convert and set entities
  useEffect(() => {
    if (zonesData && zonesData.length > 0) {
      // Use zones_dim data
      const converted = convertZonesToEntities(zonesData);
      setEntities(converted);
    } else if (graphEntities && graphEntities.length > 0) {
      // Fallback to graph_entities
      const converted = convertGraphEntitiesToEntities(graphEntities);
      setEntities(converted);
    }
  }, [zonesData, graphEntities, setEntities]);

  // Entity count for display
  const entityCount = useMemo(() => Object.keys(entities).length, [entities]);
  const zoneCount = useMemo(
    () => Object.values(entities).filter((e) => e.type === 'Zone').length,
    [entities]
  );

  // No store selected warning
  if (!selectedStore) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            시뮬레이션을 시작하려면 먼저 매장을 선택해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-none border-b bg-background p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5" />
            <h1 className="text-lg font-semibold">AI 시뮬레이션</h1>
            <Badge variant="outline">{selectedStore.store_name}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                데이터 로딩 중...
              </span>
            ) : (
              <>
                <Badge variant="secondary">{zoneCount}개 구역</Badge>
                <Badge variant="secondary">{entityCount}개 엔티티</Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-slate-900">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>3D 씬 준비 중...</p>
              </div>
            </div>
          ) : entityCount === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center max-w-md">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">구역 데이터 없음</h3>
                <p className="text-sm text-slate-400">
                  선택한 매장에 구역 데이터가 없습니다.
                  zones_dim 테이블에 데이터를 추가하거나
                  온톨로지 그래프에 Zone 엔티티를 생성해주세요.
                </p>
              </div>
            </div>
          ) : (
            <SimulationScene className="w-full h-full" />
          )}

          {/* Status Overlay */}
          {status === 'running' && (
            <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              시뮬레이션 실행 중
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l bg-background overflow-y-auto">
          <div className="p-4 space-y-4">
            <SimulationControls />
            <SimulationMetrics />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationPage;
