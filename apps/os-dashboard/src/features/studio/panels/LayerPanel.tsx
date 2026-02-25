/**
 * LayerPanel.tsx
 *
 * 레이어 관리 패널 (v2 - Zone 기반 계층 구조)
 * - Zone별 가구 그룹핑
 * - 가구 → 제품 계층 표시
 * - 검색/필터 기능
 * - 가시성 토글
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Box,
  Folder,
  Search,
  MapPin,
  Package,
  Focus,
  Home,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useScene } from '../core/SceneProvider';
import { useStoreBounds } from '../hooks/useStoreBounds';
import type { LayerNode } from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

interface ZoneGroup {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  furniture: FurnitureWithChildren[];
}

interface FurnitureWithChildren {
  id: string;
  name: string;
  visible: boolean;
  zoneId?: string;
  children: ChildProduct[];
}

interface ChildProduct {
  id: string;
  name: string;
  visible: boolean;
  sku?: string;
  slotCode?: string;
}

// ============================================================================
// LayerPanel 컴포넌트
// ============================================================================
export function LayerPanel() {
  const { models, selectedId, select, updateModel, removeModel, toggleProductVisibility, isProductVisible, focusOnModel } = useScene();
  const { zones } = useStoreBounds();

  // 확장 상태
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['space', 'furniture', 'zones']));
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedFurniture, setExpandedFurniture] = useState<Set<string>>(new Set());

  // 검색/필터
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'furniture'>('all');

  // Zone ID → Name 매핑
  const zoneNameMap = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>();
    if (zones) {
      zones.forEach((zone) => {
        map.set(zone.id, { name: zone.zone_name, type: zone.zone_type });
      });
    }
    return map;
  }, [zones]);

  // 모델을 Zone별로 그룹화 (가구 → 제품 계층)
  const { spaceModel, zoneGroups, unassignedFurniture, childProductMap, stats } = useMemo(() => {
    let space: LayerNode | null = null;
    const groups = new Map<string, ZoneGroup>();
    const unassigned: FurnitureWithChildren[] = [];
    const cpMap = new Map<string, string>(); // childProductId → furnitureId
    let totalFurniture = 0;
    let totalProducts = 0;

    if (!models || !Array.isArray(models)) {
      return {
        spaceModel: null,
        zoneGroups: [],
        unassignedFurniture: [],
        childProductMap: cpMap,
        stats: { furniture: 0, products: 0 }
      };
    }

    models.forEach((model) => {
      // 공간 모델
      if (model.type === 'space') {
        space = {
          id: model.id,
          name: model.name,
          type: 'model',
          visible: model.visible,
          locked: false,
          modelId: model.id,
        };
        return;
      }

      // 가구 모델
      if (model.type === 'furniture') {
        totalFurniture++;
        const zoneId = (model.metadata as any)?.zoneId;
        const childProducts = (model.metadata as any)?.childProducts || [];

        // childProduct 매핑 생성
        childProducts.forEach((cp: any) => {
          cpMap.set(cp.id, model.id);
          totalProducts++;
        });

        const furnitureItem: FurnitureWithChildren = {
          id: model.id,
          name: model.name,
          visible: model.visible,
          zoneId,
          children: childProducts.map((cp: any) => ({
            id: cp.id,
            name: cp.name || cp.metadata?.productName || 'Product',
            visible: cp.visible !== false,
            sku: cp.metadata?.sku,
            slotCode: cp.metadata?.slotCode,
          })),
        };

        if (zoneId && zoneNameMap.has(zoneId)) {
          const zoneInfo = zoneNameMap.get(zoneId)!;
          if (!groups.has(zoneId)) {
            groups.set(zoneId, {
              zoneId,
              zoneName: zoneInfo.name,
              zoneType: zoneInfo.type,
              furniture: [],
            });
          }
          groups.get(zoneId)!.furniture.push(furnitureItem);
        } else {
          unassigned.push(furnitureItem);
        }
      }

      // 독립 제품 (placement가 아닌 경우)
      if (model.type === 'product' && !(model.metadata as any)?.isRelativePosition) {
        totalProducts++;
        // 독립 제품은 미배정 그룹에 추가
        unassigned.push({
          id: model.id,
          name: model.name,
          visible: model.visible,
          children: [],
        });
      }
    });

    // Zone 정렬 (zone_type 우선순위: entrance > display > checkout > fitting > other)
    const zoneTypeOrder: Record<string, number> = {
      entrance: 0,
      entry: 0,
      display: 1,
      clothing: 1,
      accessory: 1,
      cosmetics: 1,
      checkout: 2,
      fitting: 3,
      exit: 4,
    };

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      const orderA = zoneTypeOrder[a.zoneType.toLowerCase()] ?? 5;
      const orderB = zoneTypeOrder[b.zoneType.toLowerCase()] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return a.zoneName.localeCompare(b.zoneName);
    });

    return {
      spaceModel: space,
      zoneGroups: sortedGroups,
      unassignedFurniture: unassigned,
      childProductMap: cpMap,
      stats: { furniture: totalFurniture, products: totalProducts }
    };
  }, [models, zoneNameMap]);

  // 검색 필터링
  const filteredZoneGroups = useMemo(() => {
    if (!searchQuery && filterType === 'all') return zoneGroups;

    const query = searchQuery.toLowerCase();

    return zoneGroups.map((group) => ({
      ...group,
      furniture: group.furniture
        .map((f) => {
          // 먼저 children(제품) 필터링
          const filteredChildren = f.children.filter((c) => {
            if (!query) return true;
            return (
              c.name.toLowerCase().includes(query) ||
              c.sku?.toLowerCase().includes(query)
            );
          });

          if (filterType === 'furniture') {
            // 가구 필터: 가구만 검색, children 숨김
            if (query && !f.name.toLowerCase().includes(query)) {
              return null;
            }
            return {
              ...f,
              children: [], // 가구 필터에서는 제품 숨김
            };
          }

          // 전체 필터
          if (query) {
            const furnitureMatch = f.name.toLowerCase().includes(query);
            const hasChildMatch = filteredChildren.length > 0;

            if (!furnitureMatch && !hasChildMatch) {
              return null;
            }

            return {
              ...f,
              children: hasChildMatch ? filteredChildren : f.children,
            };
          }

          return f;
        })
        .filter((f): f is FurnitureWithChildren => f !== null),
    })).filter((group) => group.furniture.length > 0);
  }, [zoneGroups, searchQuery, filterType]);

  // 필터 전환 시 트리 닫힘 상태로 초기화
  useEffect(() => {
    setExpandedZones(new Set());
    setExpandedFurniture(new Set());
  }, [filterType]);

  // 🆕 3D에서 가구/제품 선택 시 해당 존과 가구를 자동으로 펼치기
  useEffect(() => {
    if (!selectedId) return;

    // 1. 선택된 ID가 가구인지 확인
    const selectedModel = models.find((m) => m.id === selectedId);
    if (selectedModel && selectedModel.type === 'furniture') {
      const zoneId = (selectedModel.metadata as any)?.zoneId;
      if (zoneId) {
        // zones 그룹 펼치기
        setExpandedGroups((prev) => new Set([...prev, 'zones']));
        // 해당 존 펼치기
        setExpandedZones((prev) => new Set([...prev, zoneId]));
      }
      return;
    }

    // 2. 선택된 ID가 childProduct(제품)인지 확인
    const parentFurnitureId = childProductMap.get(selectedId);
    if (parentFurnitureId) {
      const parentModel = models.find((m) => m.id === parentFurnitureId);
      if (parentModel) {
        const zoneId = (parentModel.metadata as any)?.zoneId;
        if (zoneId) {
          // zones 그룹 펼치기
          setExpandedGroups((prev) => new Set([...prev, 'zones']));
          // 해당 존 펼치기
          setExpandedZones((prev) => new Set([...prev, zoneId]));
          // 해당 가구 펼치기
          setExpandedFurniture((prev) => new Set([...prev, parentFurnitureId]));
        }
      }
    }

    // 3. 선택된 ID가 zoneGroups 내 가구인지 순회하여 확인 (직접 모델이 아닌 경우)
    for (const group of zoneGroups) {
      const foundFurniture = group.furniture.find((f) => f.id === selectedId);
      if (foundFurniture) {
        // zones 그룹 펼치기
        setExpandedGroups((prev) => new Set([...prev, 'zones']));
        // 해당 존 펼치기
        setExpandedZones((prev) => new Set([...prev, group.zoneId]));
        break;
      }

      // childProducts에서 찾기
      for (const furniture of group.furniture) {
        const foundChild = furniture.children.find((c) => c.id === selectedId);
        if (foundChild) {
          // zones 그룹 펼치기
          setExpandedGroups((prev) => new Set([...prev, 'zones']));
          // 해당 존 펼치기
          setExpandedZones((prev) => new Set([...prev, group.zoneId]));
          // 해당 가구 펼치기
          setExpandedFurniture((prev) => new Set([...prev, furniture.id]));
          break;
        }
      }
    }
  }, [selectedId, models, childProductMap, zoneGroups]);

  // 🆕 선택된 항목 ref 맵 (스크롤용)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 🆕 선택된 항목으로 스크롤
  useEffect(() => {
    if (!selectedId) return;

    // DOM 업데이트 후 스크롤 (존/가구 펼치기 후 실행되도록 딜레이)
    const timer = setTimeout(() => {
      const element = itemRefs.current.get(selectedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedId, expandedZones, expandedFurniture]);

  // 토글 핸들러
  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleZone = (zoneId: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const toggleFurnitureExpand = (furnitureId: string) => {
    setExpandedFurniture((prev) => {
      const next = new Set(prev);
      if (next.has(furnitureId)) next.delete(furnitureId);
      else next.add(furnitureId);
      return next;
    });
  };

  // 가시성 토글 (childProduct인 경우 개별 가시성 토글)
  const handleVisibilityToggle = useCallback((modelId: string) => {
    // 직접 모델인 경우
    const model = models.find((m) => m.id === modelId);
    if (model) {
      updateModel(modelId, { visible: !model.visible });
      return;
    }

    // childProduct인 경우
    if (childProductMap.has(modelId)) {
      toggleProductVisibility(modelId);
    }
  }, [models, childProductMap, updateModel, toggleProductVisibility]);

  // 모델 또는 childProduct의 가시성 확인
  const getModelVisibility = useCallback((modelId: string): boolean => {
    const model = models.find((m) => m.id === modelId);
    if (model) return model.visible;

    const parentFurnitureId = childProductMap.get(modelId);
    if (parentFurnitureId) {
      const parentModel = models.find((m) => m.id === parentFurnitureId);
      const parentVisible = parentModel?.visible ?? true;
      return parentVisible && isProductVisible(modelId);
    }

    return true;
  }, [models, childProductMap, isProductVisible]);

  // 카메라 포커스
  const handleFocus = useCallback((modelId: string) => {
    if (focusOnModel) {
      focusOnModel(modelId);
    }
    select(modelId);
  }, [focusOnModel, select]);

  // Zone 타입별 아이콘
  const getZoneIcon = (zoneType: string) => {
    const type = zoneType.toLowerCase();
    if (type.includes('entrance') || type.includes('entry')) return '🚪';
    if (type.includes('checkout') || type.includes('counter')) return '💳';
    if (type.includes('fitting')) return '👔';
    if (type.includes('clothing') || type.includes('clothes')) return '👕';
    if (type.includes('accessory')) return '👜';
    if (type.includes('cosmetic')) return '💄';
    return '📍';
  };

  return (
    <div className="p-3 space-y-4">
      {/* ========== 검색 & 필터 ========== */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <Input
            placeholder="이름 또는 SKU로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 border-0 text-sm h-8 text-white placeholder:text-white/70"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(['all', 'furniture'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'flex-1 px-2 py-1 text-[10px] rounded-lg border transition',
                filterType === type
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              )}
            >
              {type === 'all' ? '전체' : '가구'}
            </button>
          ))}
        </div>
      </div>

      {/* ========== 통계 ========== */}
      <div className="flex items-center gap-3 px-2 py-1.5 bg-white/5 rounded-lg text-[10px]">
        <div className="flex items-center gap-1 text-white/50">
          <Box className="h-3 w-3 text-yellow-400" />
          <span>가구 {stats.furniture}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50">
          <Package className="h-3 w-3 text-blue-400" />
          <span>제품 {stats.products}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50">
          <MapPin className="h-3 w-3 text-purple-400" />
          <span>존 {zoneGroups.length}</span>
        </div>
      </div>

      {/* ========== 공간 섹션 ========== */}
      {spaceModel && (
        <div className="space-y-1">
          <div
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
            onClick={() => toggleGroup('space')}
          >
            <button className="p-0.5">
              {expandedGroups.has('space') ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </button>
            <Home className="w-4 h-4 text-green-400" />
            <span className="flex-1 text-sm text-white font-medium">공간</span>
          </div>

          {expandedGroups.has('space') && (
            <div className="ml-4">
              <div
                className={cn(
                  'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer border border-transparent transition-colors group',
                  selectedId === spaceModel.modelId
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'hover:bg-white/5 hover:border-white/10'
                )}
                onClick={() => select(spaceModel.modelId || null)}
              >
                {/* 공간 모델은 항상 표시 (숨김 불가) */}
                <Checkbox
                  checked={true}
                  disabled={true}
                  className="h-3.5 w-3.5 border-green-500/50 data-[state=checked]:bg-green-600 opacity-50 cursor-not-allowed"
                />
                <Folder className="w-4 h-4 text-green-400" />
                <span className="flex-1 text-sm text-white truncate">{spaceModel.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (spaceModel.modelId) handleFocus(spaceModel.modelId);
                  }}
                >
                  <Focus className="w-3 h-3 text-blue-400" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 존 섹션 (Zone별 그룹) ========== */}
      <div className="space-y-1">
        <div
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
          onClick={() => toggleGroup('furniture')}
        >
          <button className="p-0.5">
            {expandedGroups.has('furniture') ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            )}
          </button>
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="flex-1 text-sm text-white font-medium">
            존 ({zoneGroups.length})
          </span>
        </div>

        {expandedGroups.has('furniture') && (
          <div className="ml-2 space-y-1">
            {/* Zone별 그룹 */}
            {filteredZoneGroups.map((group) => {
              const isZoneExpanded = expandedZones.has(group.zoneId);
              const visibleFurniture = group.furniture.filter(f => f.visible).length;

              return (
                <div key={group.zoneId} className="space-y-1">
                  {/* Zone 헤더 */}
                  <div
                    className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors ml-2"
                    onClick={() => toggleZone(group.zoneId)}
                  >
                    <button className="p-0.5">
                      {isZoneExpanded ? (
                        <ChevronDown className="w-3 h-3 text-white/60" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-white/60" />
                      )}
                    </button>
                    <span className="text-sm">{getZoneIcon(group.zoneType)}</span>
                    <span className="flex-1 text-xs text-white font-medium truncate">
                      {group.zoneName}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {visibleFurniture}/{group.furniture.length}
                    </span>
                  </div>

                  {/* Zone 내 가구 목록 */}
                  {isZoneExpanded && (
                    <div className="ml-6 space-y-0.5">
                      {group.furniture.map((furniture) => {
                        const isFurnitureExpanded = expandedFurniture.has(furniture.id);
                        const hasChildren = furniture.children.length > 0;
                        const isSelected = selectedId === furniture.id;
                        const visibleChildren = furniture.children.filter(c =>
                          getModelVisibility(c.id)
                        ).length;

                        return (
                          <div key={furniture.id} className="space-y-0.5">
                            {/* 가구 아이템 */}
                            <div
                              ref={(el) => {
                                if (el) itemRefs.current.set(furniture.id, el);
                                else itemRefs.current.delete(furniture.id);
                              }}
                              className={cn(
                                'flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer border border-transparent transition-colors group',
                                isSelected
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                  : 'hover:bg-white/5 hover:border-white/10'
                              )}
                              onClick={() => select(furniture.id)}
                            >
                              {hasChildren ? (
                                <button
                                  className="p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFurnitureExpand(furniture.id);
                                  }}
                                >
                                  {isFurnitureExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-white/60" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-white/60" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}

                              <Checkbox
                                checked={furniture.visible}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisibilityToggle(furniture.id);
                                }}
                                className="h-3 w-3 border-white/40 data-[state=checked]:bg-primary"
                              />

                              <Box className="w-3.5 h-3.5 text-yellow-400" />

                              <span
                                className={cn(
                                  'flex-1 text-xs truncate',
                                  furniture.visible ? 'text-white' : 'text-white/40'
                                )}
                              >
                                {furniture.name}
                              </span>

                              {hasChildren && (
                                <span className="text-[9px] text-white/30">
                                  ({visibleChildren}/{furniture.children.length})
                                </span>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFocus(furniture.id);
                                }}
                              >
                                <Focus className="w-2.5 h-2.5 text-blue-400" />
                              </Button>
                            </div>

                            {/* 가구 내 제품 (childProducts) */}
                            {isFurnitureExpanded && hasChildren && (
                              <div className="ml-6 space-y-0.5">
                                {furniture.children.map((child) => {
                                  const isChildVisible = getModelVisibility(child.id);
                                  const isChildSelected = selectedId === child.id;

                                  return (
                                    <div
                                      key={child.id}
                                      ref={(el) => {
                                        if (el) itemRefs.current.set(child.id, el);
                                        else itemRefs.current.delete(child.id);
                                      }}
                                      className={cn(
                                        'flex items-center gap-1.5 py-0.5 px-2 rounded cursor-pointer border border-transparent transition-colors group',
                                        isChildSelected
                                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                          : 'hover:bg-white/5 hover:border-white/10'
                                      )}
                                      onClick={() => select(child.id)}
                                    >
                                      <Checkbox
                                        checked={isChildVisible}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVisibilityToggle(child.id);
                                        }}
                                        className="h-2.5 w-2.5 border-yellow-500/50 data-[state=checked]:bg-yellow-600"
                                      />

                                      <Package className="w-3 h-3 text-blue-400" />

                                      <span
                                        className={cn(
                                          'flex-1 text-[10px] truncate',
                                          isChildVisible ? 'text-white/80' : 'text-white/30'
                                        )}
                                      >
                                        {child.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 미배정 가구 */}
            {unassignedFurniture.length > 0 && (
              <div className="space-y-1">
                <div
                  className="flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors ml-2"
                  onClick={() => toggleZone('unassigned')}
                >
                  <button className="p-0.5">
                    {expandedZones.has('unassigned') ? (
                      <ChevronDown className="w-3 h-3 text-white/60" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/60" />
                    )}
                  </button>
                  <span className="text-sm">📦</span>
                  <span className="flex-1 text-xs text-white/60 font-medium">
                    미배정
                  </span>
                  <span className="text-[10px] text-white/40">
                    {unassignedFurniture.length}
                  </span>
                </div>

                {expandedZones.has('unassigned') && (
                  <div className="ml-6 space-y-0.5">
                    {unassignedFurniture.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer border border-transparent transition-colors group',
                          selectedId === item.id
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'hover:bg-white/5 hover:border-white/10'
                        )}
                        onClick={() => select(item.id)}
                      >
                        <Checkbox
                          checked={item.visible}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVisibilityToggle(item.id);
                          }}
                          className="h-3 w-3 border-white/40 data-[state=checked]:bg-primary"
                        />
                        <Box className="w-3.5 h-3.5 text-white/40" />
                        <span className={cn(
                          'flex-1 text-xs truncate',
                          item.visible ? 'text-white/60' : 'text-white/30'
                        )}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 빈 상태 */}
      {models.length === 0 && (
        <div className="text-center py-4 text-white/40">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">모델이 없습니다</p>
        </div>
      )}
    </div>
  );
}

export default LayerPanel;
