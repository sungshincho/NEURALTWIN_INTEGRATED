/**
 * vmdEngine.ts - Phase 3: Visual Merchandising Engine
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 시각적 머천다이징(VMD) 원칙 기반 레이아웃 평가 및 개선 제안
 *
 * VMD 6대 원칙:
 * 1. Golden Zone - 눈높이 = 구매 높이
 * 2. Color Blocking - 색상 그룹핑으로 시각적 임팩트
 * 3. Visual Flow - Z패턴/F패턴 시선 유도
 * 4. Focal Point - 시선을 끄는 주력 디스플레이
 * 5. Breathing Room - 과밀 방지, 접근성 확보
 * 6. Cross Merchandising - 연관 상품 인접 배치
 */

import type { FlowAnalysisResult } from '../data/flowAnalyzer.ts';
import type { ProductAssociationResult } from '../data/associationMiner.ts';

// ============================================================================
// Type Definitions
// ============================================================================

export type VMDCategory =
  | 'golden_zone'
  | 'color_blocking'
  | 'visual_flow'
  | 'focal_point'
  | 'breathing_room'
  | 'cross_merchandising';

export type SlotHeight = 'floor' | 'low' | 'eye' | 'high' | 'top';
export type ProductPerformance = 'high' | 'medium' | 'low';
export type Severity = 'critical' | 'major' | 'minor';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Effort = 'low' | 'medium' | 'high';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Trend = 'improving' | 'stable' | 'declining';
export type ActionType = 'move' | 'swap' | 'add' | 'remove' | 'adjust';
export type TargetType = 'product' | 'furniture';
export type SuggestionType = 'product_move' | 'product_swap' | 'furniture_adjust' | 'add_product' | 'remove_product';

/**
 * 존 정보
 */
export interface Zone {
  id: string;
  code: string;
  name: string;
  type: string;
  areaSqm: number;
  furnitureCount?: number;
  isEntrance?: boolean;
}

/**
 * 슬롯 정보
 */
export interface SlotInfo {
  id: string;
  slotId: string;
  height: SlotHeight;
  isOccupied: boolean;
  productId?: string;
  compatibleDisplayTypes: string[];
}

/**
 * 가구 + 슬롯 정보
 */
export interface FurnitureWithSlots {
  id: string;
  code: string;
  name: string;
  zoneId: string;
  zoneCode: string;
  displayType: string;
  isFocalPoint: boolean;
  slots: SlotInfo[];
  occupancyRate: number;
  productCategories: string[];
  productColors: string[];
  avgProductPrice: number;
  avgProductPerformance: number;
  position: { x: number; y: number; z: number };
}

/**
 * 상품 + 배치 정보
 */
export interface ProductWithPlacement {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  color: string;
  margin?: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  performance: ProductPerformance;
  placement: {
    furnitureId: string;
    furnitureCode: string;
    slotId: string;
    slotHeight: SlotHeight;
    zoneId: string;
    zoneCode: string;
    zoneType: string;
  };
}

/**
 * VMD 분석 컨텍스트
 */
export interface VMDContext {
  zones: Zone[];
  furniture: FurnitureWithSlots[];
  products: ProductWithPlacement[];
  flowAnalysis: FlowAnalysisResult | null;
  associations: ProductAssociationResult | null;
  zoneAdjacency: Map<string, string[]>;
  furnitureAdjacency: Map<string, string[]>;
}

/**
 * VMD 위반 위치
 */
export interface ViolationLocation {
  zoneId?: string;
  zoneCode?: string;
  furnitureId?: string;
  furnitureCode?: string;
  productIds?: string[];
}

/**
 * VMD 위반 영향 추정
 */
export interface ImpactEstimate {
  revenueImpact: number;
  experienceImpact: number;
}

/**
 * VMD 위반 사항
 */
export interface VMDViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  category: VMDCategory;
  severity: Severity;
  location: ViolationLocation;
  description: string;
  currentState: string;
  idealState: string;
  impactEstimate: ImpactEstimate;
}

/**
 * VMD 개선 액션
 */
export interface VMDAction {
  actionType: ActionType;
  targetType: TargetType;
  targetId: string;
  targetCode: string;
  from?: {
    zoneCode: string;
    furnitureCode?: string;
    slotHeight?: string;
  };
  to?: {
    zoneCode: string;
    furnitureCode?: string;
    slotHeight?: string;
  };
  details: string;
}

/**
 * VMD 개선 제안
 */
export interface VMDSuggestion {
  id: string;
  violationId: string;
  type: SuggestionType;
  priority: Priority;
  actions: VMDAction[];
  expectedImprovement: {
    vmdScore: number;
    revenueImpact: number;
    experienceImpact: number;
  };
  effort: Effort;
  reasoning: string;
}

/**
 * 카테고리별 점수
 */
export interface CategoryScore {
  score: number;
  weight: number;
  violations: number;
  maxPossible: number;
}

/**
 * VMD 전체 점수
 */
export interface VMDScore {
  overall: number;
  breakdown: Record<VMDCategory, CategoryScore>;
  grade: Grade;
  trend: Trend;
}

/**
 * VMD 분석 결과
 */
export interface VMDAnalysisResult {
  score: VMDScore;
  violations: VMDViolation[];
  suggestions: VMDSuggestion[];
  summary: {
    criticalViolations: number;
    majorViolations: number;
    minorViolations: number;
    topPrioritySuggestion: string;
    quickWins: string[];
  };
  aiPromptContext: string;
}

/**
 * VMD 규칙 인터페이스
 */
export interface VMDRule {
  ruleId: string;
  ruleName: string;
  category: VMDCategory;
  priority: 1 | 2 | 3;
  severity: Severity;
  description: string;
  bestPractice: string;
  checkViolation: (context: VMDContext) => VMDViolation[];
  generateSuggestion: (violation: VMDViolation, context: VMDContext) => VMDSuggestion | null;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

/**
 * 카테고리별 가중치
 */
export const CATEGORY_WEIGHTS: Record<VMDCategory, number> = {
  golden_zone: 0.25,
  visual_flow: 0.20,
  focal_point: 0.15,
  breathing_room: 0.15,
  cross_merchandising: 0.15,
  color_blocking: 0.10,
};

/**
 * 충돌하는 색상 쌍
 */
const CONFLICTING_COLORS: [string, string][] = [
  ['red', 'green'],
  ['orange', 'blue'],
  ['purple', 'yellow'],
  ['pink', 'lime'],
];

/**
 * 유사 색상 그룹
 */
const SIMILAR_COLOR_GROUPS: string[][] = [
  ['red', 'orange', 'coral', 'salmon'],
  ['blue', 'navy', 'cyan', 'teal'],
  ['green', 'olive', 'lime', 'mint'],
  ['purple', 'violet', 'lavender', 'plum'],
  ['yellow', 'gold', 'cream', 'beige'],
  ['pink', 'rose', 'magenta', 'fuchsia'],
  ['brown', 'tan', 'camel', 'chocolate'],
  ['black', 'charcoal', 'gray', 'silver'],
  ['white', 'ivory', 'cream', 'off-white'],
];

/**
 * 포컬 포인트 가구 타입
 */
const FOCAL_POINT_FURNITURE_TYPES = [
  'mannequin',
  'display_table',
  'feature_wall',
  'pedestal',
  'showcase',
  'highlight_stand',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 슬롯 높이 추정
 */
export function estimateSlotHeight(y: number): SlotHeight {
  if (y < 0.3) return 'floor';
  if (y < 0.8) return 'low';
  if (y < 1.5) return 'eye';
  if (y < 2.0) return 'high';
  return 'top';
}

/**
 * 색상 정규화
 */
function normalizeColor(color: string): string {
  return color?.toLowerCase().trim() || 'unknown';
}

/**
 * 색상 충돌 여부 확인
 */
function areColorsConflicting(color1: string, color2: string): boolean {
  const c1 = normalizeColor(color1);
  const c2 = normalizeColor(color2);

  return CONFLICTING_COLORS.some(
    ([a, b]) => (c1.includes(a) && c2.includes(b)) || (c1.includes(b) && c2.includes(a))
  );
}

/**
 * 유사 색상 그룹 찾기
 */
function findColorGroup(color: string): string[] | null {
  const normalized = normalizeColor(color);
  return SIMILAR_COLOR_GROUPS.find(group =>
    group.some(c => normalized.includes(c) || c.includes(normalized))
  ) || null;
}

/**
 * 고유 색상 수 계산
 */
function countUniqueColorGroups(colors: string[]): number {
  const groups = new Set<number>();

  colors.forEach(color => {
    const groupIndex = SIMILAR_COLOR_GROUPS.findIndex(group =>
      group.some(c => normalizeColor(color).includes(c))
    );
    groups.add(groupIndex >= 0 ? groupIndex : -colors.indexOf(color) - 100);
  });

  return groups.size;
}

/**
 * 가구가 포컬 포인트인지 확인
 */
function isFocalPointFurniture(furniture: FurnitureWithSlots): boolean {
  return furniture.isFocalPoint ||
    FOCAL_POINT_FURNITURE_TYPES.some(type =>
      furniture.displayType?.toLowerCase().includes(type) ||
      furniture.code?.toLowerCase().includes(type)
    );
}

/**
 * 존이 입구인지 확인
 */
function isEntranceZone(zone: Zone): boolean {
  return zone.isEntrance ||
    zone.type?.toLowerCase().includes('entrance') ||
    zone.code?.toLowerCase().includes('entrance') ||
    zone.name?.toLowerCase().includes('입구');
}

/**
 * 성과 점수를 숫자로 변환
 */
function performanceToScore(performance: ProductPerformance): number {
  switch (performance) {
    case 'high': return 1.0;
    case 'medium': return 0.5;
    case 'low': return 0.2;
    default: return 0.5;
  }
}

/**
 * 인접 가구 찾기
 */
function findAdjacentFurniture(
  furniture: FurnitureWithSlots,
  allFurniture: FurnitureWithSlots[],
  maxDistance: number = 3.0
): FurnitureWithSlots[] {
  return allFurniture.filter(f => {
    if (f.id === furniture.id) return false;
    if (f.zoneId !== furniture.zoneId) return false;

    const dx = f.position.x - furniture.position.x;
    const dz = f.position.z - furniture.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    return distance <= maxDistance;
  });
}

// ============================================================================
// VMD Rules Implementation
// ============================================================================

/**
 * VMD 규칙 생성
 */
export function createVMDRules(): VMDRule[] {
  return [
    // ========== Golden Zone Rules ==========
    {
      ruleId: 'VMD_GOLDEN_001',
      ruleName: '골든존 저성과 상품',
      category: 'golden_zone',
      priority: 1,
      severity: 'critical',
      description: '눈높이(골든존)에 저성과 상품이 배치되어 있습니다.',
      bestPractice: '골든존에는 고성과/고마진 상품을 배치하여 매출을 극대화합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        const lowPerformersInGoldenZone = context.products.filter(
          p => p.placement.slotHeight === 'eye' && p.performance === 'low'
        );

        // 가구별로 그룹핑
        const byFurniture = new Map<string, ProductWithPlacement[]>();
        lowPerformersInGoldenZone.forEach(p => {
          const key = p.placement.furnitureId;
          if (!byFurniture.has(key)) byFurniture.set(key, []);
          byFurniture.get(key)!.push(p);
        });

        byFurniture.forEach((products, furnitureId) => {
          if (products.length >= 1) {
            const furniture = context.furniture.find(f => f.id === furnitureId);
            violations.push({
              id: generateId(),
              ruleId: 'VMD_GOLDEN_001',
              ruleName: '골든존 저성과 상품',
              category: 'golden_zone',
              severity: products.length >= 3 ? 'critical' : 'major',
              location: {
                furnitureId,
                furnitureCode: furniture?.code,
                zoneId: furniture?.zoneId,
                zoneCode: furniture?.zoneCode,
                productIds: products.map(p => p.id),
              },
              description: `${furniture?.code || furnitureId}의 골든존에 저성과 상품 ${products.length}개 발견`,
              currentState: `저성과 상품: ${products.map(p => p.name || p.sku).join(', ')}`,
              idealState: '골든존에는 고성과/고마진 상품만 배치',
              impactEstimate: {
                revenueImpact: -0.08 * products.length,
                experienceImpact: -0.03,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productIds = violation.location.productIds || [];
        const highPerformers = context.products.filter(
          p => p.performance === 'high' && p.placement.slotHeight !== 'eye'
        );

        if (highPerformers.length === 0) return null;

        const actions: VMDAction[] = productIds.slice(0, 3).map((productId, idx) => {
          const product = context.products.find(p => p.id === productId);
          const replacement = highPerformers[idx % highPerformers.length];

          return {
            actionType: 'swap' as ActionType,
            targetType: 'product' as TargetType,
            targetId: productId,
            targetCode: product?.sku || productId,
            from: {
              zoneCode: violation.location.zoneCode || '',
              furnitureCode: violation.location.furnitureCode,
              slotHeight: 'eye',
            },
            to: {
              zoneCode: replacement.placement.zoneCode,
              furnitureCode: replacement.placement.furnitureCode,
              slotHeight: replacement.placement.slotHeight,
            },
            details: `${product?.name || product?.sku}을(를) ${replacement.name || replacement.sku}과(와) 교체`,
          };
        });

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_swap',
          priority: 'critical',
          actions,
          expectedImprovement: {
            vmdScore: 5,
            revenueImpact: 0.12,
            experienceImpact: 0.05,
          },
          effort: 'low',
          reasoning: '골든존의 저성과 상품을 고성과 상품과 교체하여 매출 극대화',
        };
      },
    },

    {
      ruleId: 'VMD_GOLDEN_002',
      ruleName: '고마진 상품 비골든존 배치',
      category: 'golden_zone',
      priority: 2,
      severity: 'major',
      description: '고마진 상품이 골든존이 아닌 위치에 배치되어 있습니다.',
      bestPractice: '마진율 40% 이상 상품은 골든존에 우선 배치합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        const highMarginNotInGolden = context.products.filter(
          p => (p.margin && p.margin > 0.4) && p.placement.slotHeight !== 'eye'
        );

        if (highMarginNotInGolden.length >= 2) {
          violations.push({
            id: generateId(),
            ruleId: 'VMD_GOLDEN_002',
            ruleName: '고마진 상품 비골든존 배치',
            category: 'golden_zone',
            severity: highMarginNotInGolden.length >= 5 ? 'major' : 'minor',
            location: {
              productIds: highMarginNotInGolden.map(p => p.id),
            },
            description: `고마진 상품 ${highMarginNotInGolden.length}개가 골든존 외 배치`,
            currentState: `비골든존 배치: ${highMarginNotInGolden.slice(0, 5).map(p => p.name || p.sku).join(', ')}`,
            idealState: '고마진(>40%) 상품은 골든존 우선 배치',
            impactEstimate: {
              revenueImpact: -0.05 * Math.min(highMarginNotInGolden.length, 5),
              experienceImpact: 0,
            },
          });
        }

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productIds = violation.location.productIds || [];
        const emptyGoldenSlots = context.furniture.flatMap(f =>
          f.slots.filter(s => s.height === 'eye' && !s.isOccupied)
            .map(s => ({ furniture: f, slot: s }))
        );

        if (emptyGoldenSlots.length === 0) return null;

        const actions: VMDAction[] = productIds.slice(0, Math.min(3, emptyGoldenSlots.length)).map((productId, idx) => {
          const product = context.products.find(p => p.id === productId);
          const target = emptyGoldenSlots[idx];

          return {
            actionType: 'move' as ActionType,
            targetType: 'product' as TargetType,
            targetId: productId,
            targetCode: product?.sku || productId,
            from: {
              zoneCode: product?.placement.zoneCode || '',
              furnitureCode: product?.placement.furnitureCode,
              slotHeight: product?.placement.slotHeight,
            },
            to: {
              zoneCode: target.furniture.zoneCode,
              furnitureCode: target.furniture.code,
              slotHeight: 'eye',
            },
            details: `${product?.name || product?.sku}을(를) ${target.furniture.code} 골든존으로 이동`,
          };
        });

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_move',
          priority: 'high',
          actions,
          expectedImprovement: {
            vmdScore: 3,
            revenueImpact: 0.08,
            experienceImpact: 0.02,
          },
          effort: 'low',
          reasoning: '고마진 상품을 골든존으로 이동하여 노출도 및 구매 전환 향상',
        };
      },
    },

    // ========== Color Blocking Rules ==========
    {
      ruleId: 'VMD_COLOR_001',
      ruleName: '가구 내 색상 혼재',
      category: 'color_blocking',
      priority: 2,
      severity: 'minor',
      description: '동일 가구에 3가지 이상의 이질적인 색상이 혼재되어 있습니다.',
      bestPractice: '가구당 2가지 이하의 유사 색상 그룹으로 통일합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        context.furniture.forEach(f => {
          if (f.productColors.length < 3) return;

          const uniqueGroups = countUniqueColorGroups(f.productColors);

          if (uniqueGroups >= 3) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_COLOR_001',
              ruleName: '가구 내 색상 혼재',
              category: 'color_blocking',
              severity: uniqueGroups >= 4 ? 'major' : 'minor',
              location: {
                furnitureId: f.id,
                furnitureCode: f.code,
                zoneId: f.zoneId,
                zoneCode: f.zoneCode,
              },
              description: `${f.code}에 ${uniqueGroups}개 색상 그룹 혼재`,
              currentState: `색상: ${[...new Set(f.productColors)].join(', ')}`,
              idealState: '2가지 이하 유사 색상 그룹으로 통일',
              impactEstimate: {
                revenueImpact: -0.02,
                experienceImpact: -0.05,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const furniture = context.furniture.find(f => f.id === violation.location.furnitureId);
        if (!furniture) return null;

        const productsOnFurniture = context.products.filter(
          p => p.placement.furnitureId === furniture.id
        );

        // 가장 많은 색상 그룹 찾기
        const colorCounts = new Map<string, number>();
        productsOnFurniture.forEach(p => {
          const group = findColorGroup(p.color);
          const key = group ? group[0] : p.color;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        });

        const dominantColor = [...colorCounts.entries()]
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        const productsToMove = productsOnFurniture.filter(p => {
          const group = findColorGroup(p.color);
          return group ? !group.includes(dominantColor) : p.color !== dominantColor;
        });

        if (productsToMove.length === 0) return null;

        const actions: VMDAction[] = productsToMove.slice(0, 3).map(product => ({
          actionType: 'move' as ActionType,
          targetType: 'product' as TargetType,
          targetId: product.id,
          targetCode: product.sku,
          from: {
            zoneCode: product.placement.zoneCode,
            furnitureCode: product.placement.furnitureCode,
          },
          details: `${product.name || product.sku}(${product.color})을(를) 동일 색상 그룹 가구로 이동`,
        }));

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_move',
          priority: 'medium',
          actions,
          expectedImprovement: {
            vmdScore: 2,
            revenueImpact: 0.02,
            experienceImpact: 0.06,
          },
          effort: 'medium',
          reasoning: '색상 그룹핑으로 시각적 통일감 향상',
        };
      },
    },

    {
      ruleId: 'VMD_COLOR_002',
      ruleName: '인접 가구 색상 충돌',
      category: 'color_blocking',
      priority: 3,
      severity: 'minor',
      description: '인접한 가구 간에 충돌하는 색상이 배치되어 있습니다.',
      bestPractice: '인접 가구는 보완색 또는 유사색으로 조화롭게 배치합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        context.furniture.forEach(furniture => {
          if (furniture.productColors.length === 0) return;

          const adjacentFurniture = findAdjacentFurniture(furniture, context.furniture);
          const mainColor = furniture.productColors[0];

          adjacentFurniture.forEach(adj => {
            if (adj.productColors.length === 0) return;

            const adjMainColor = adj.productColors[0];
            if (areColorsConflicting(mainColor, adjMainColor)) {
              violations.push({
                id: generateId(),
                ruleId: 'VMD_COLOR_002',
                ruleName: '인접 가구 색상 충돌',
                category: 'color_blocking',
                severity: 'minor',
                location: {
                  furnitureId: furniture.id,
                  furnitureCode: furniture.code,
                  zoneId: furniture.zoneId,
                  zoneCode: furniture.zoneCode,
                },
                description: `${furniture.code}(${mainColor})와 ${adj.code}(${adjMainColor}) 색상 충돌`,
                currentState: `충돌 색상: ${mainColor} - ${adjMainColor}`,
                idealState: '인접 가구는 유사색 또는 보완색 사용',
                impactEstimate: {
                  revenueImpact: -0.01,
                  experienceImpact: -0.04,
                },
              });
            }
          });
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_swap',
          priority: 'low',
          actions: [{
            actionType: 'adjust',
            targetType: 'furniture',
            targetId: violation.location.furnitureId || '',
            targetCode: violation.location.furnitureCode || '',
            details: '인접 가구의 상품 색상 조정 또는 가구 위치 변경 검토',
          }],
          expectedImprovement: {
            vmdScore: 1,
            revenueImpact: 0.01,
            experienceImpact: 0.04,
          },
          effort: 'high',
          reasoning: '인접 가구 간 색상 조화로 시각적 편안함 향상',
        };
      },
    },

    // ========== Visual Flow Rules ==========
    {
      ruleId: 'VMD_FLOW_001',
      ruleName: '존 입구 저가치 상품',
      category: 'visual_flow',
      priority: 1,
      severity: 'major',
      description: '존 입구에 저가치/저성과 상품이 배치되어 첫인상을 저해합니다.',
      bestPractice: '존 입구에는 고가치/신상품을 배치하여 시선을 유도합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        const entranceZones = context.zones.filter(isEntranceZone);

        entranceZones.forEach(zone => {
          const zoneFurniture = context.furniture.filter(f => f.zoneId === zone.id);
          const zoneProducts = context.products.filter(
            p => p.placement.zoneId === zone.id
          );

          const lowPerformers = zoneProducts.filter(p => p.performance === 'low');
          const lowPerformerRatio = zoneProducts.length > 0
            ? lowPerformers.length / zoneProducts.length
            : 0;

          if (lowPerformerRatio > 0.3 && lowPerformers.length >= 2) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_FLOW_001',
              ruleName: '존 입구 저가치 상품',
              category: 'visual_flow',
              severity: lowPerformerRatio > 0.5 ? 'critical' : 'major',
              location: {
                zoneId: zone.id,
                zoneCode: zone.code,
                productIds: lowPerformers.map(p => p.id),
              },
              description: `입구 존 ${zone.code}에 저성과 상품 비율 ${Math.round(lowPerformerRatio * 100)}%`,
              currentState: `저성과 상품 ${lowPerformers.length}개 / 전체 ${zoneProducts.length}개`,
              idealState: '입구 존 저성과 상품 비율 20% 이하',
              impactEstimate: {
                revenueImpact: -0.10,
                experienceImpact: -0.08,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productIds = violation.location.productIds || [];
        const highValueProducts = context.products.filter(
          p => (p.isNewArrival || p.isBestSeller || p.performance === 'high') &&
               p.placement.zoneId !== violation.location.zoneId
        );

        if (highValueProducts.length === 0) return null;

        const actions: VMDAction[] = productIds.slice(0, 3).map((productId, idx) => {
          const product = context.products.find(p => p.id === productId);
          const replacement = highValueProducts[idx % highValueProducts.length];

          return {
            actionType: 'swap' as ActionType,
            targetType: 'product' as TargetType,
            targetId: productId,
            targetCode: product?.sku || productId,
            from: {
              zoneCode: violation.location.zoneCode || '',
            },
            to: {
              zoneCode: replacement.placement.zoneCode,
            },
            details: `입구 ${product?.name || product?.sku}를 ${replacement.name || replacement.sku}(${replacement.isNewArrival ? '신상품' : '베스트셀러'})과 교체`,
          };
        });

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_swap',
          priority: 'critical',
          actions,
          expectedImprovement: {
            vmdScore: 6,
            revenueImpact: 0.12,
            experienceImpact: 0.10,
          },
          effort: 'low',
          reasoning: '입구 존에 고가치 상품을 배치하여 첫인상 및 구매 유도 강화',
        };
      },
    },

    {
      ruleId: 'VMD_FLOW_002',
      ruleName: '주요 동선 장애물',
      category: 'visual_flow',
      priority: 2,
      severity: 'major',
      description: '고트래픽 경로에 가구가 밀집되어 동선을 방해합니다.',
      bestPractice: '주요 동선에는 충분한 통로 폭(최소 1.2m)을 확보합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        if (!context.flowAnalysis?.bottlenecks) return violations;

        context.flowAnalysis.bottlenecks.forEach(bottleneck => {
          if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
            const zone = context.zones.find(z => z.id === bottleneck.zoneId);
            const zoneFurniture = context.furniture.filter(f => f.zoneId === bottleneck.zoneId);

            violations.push({
              id: generateId(),
              ruleId: 'VMD_FLOW_002',
              ruleName: '주요 동선 장애물',
              category: 'visual_flow',
              severity: bottleneck.severity === 'critical' ? 'critical' : 'major',
              location: {
                zoneId: bottleneck.zoneId,
                zoneCode: zone?.code,
              },
              description: `${zone?.code || bottleneck.zoneId} 구역 동선 병목 (혼잡도: ${Math.round(bottleneck.congestionScore * 100)}%)`,
              currentState: `가구 ${zoneFurniture.length}개, 혼잡도 ${Math.round(bottleneck.congestionScore * 100)}%`,
              idealState: '혼잡도 70% 이하, 통로 폭 1.2m 이상 확보',
              impactEstimate: {
                revenueImpact: -0.05,
                experienceImpact: -0.12,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const zoneFurniture = context.furniture.filter(
          f => f.zoneId === violation.location.zoneId
        );

        const movableFurniture = zoneFurniture.filter(
          f => f.occupancyRate < 0.5 || f.avgProductPerformance < 0.3
        );

        if (movableFurniture.length === 0) return null;

        const actions: VMDAction[] = movableFurniture.slice(0, 2).map(f => ({
          actionType: 'adjust' as ActionType,
          targetType: 'furniture' as TargetType,
          targetId: f.id,
          targetCode: f.code,
          from: {
            zoneCode: f.zoneCode,
          },
          details: `${f.code} 위치 조정 또는 다른 존으로 이동하여 통로 확보`,
        }));

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'furniture_adjust',
          priority: 'high',
          actions,
          expectedImprovement: {
            vmdScore: 4,
            revenueImpact: 0.05,
            experienceImpact: 0.15,
          },
          effort: 'high',
          reasoning: '동선 병목 해소로 고객 흐름 개선 및 체류 시간 증가',
        };
      },
    },

    // ========== Focal Point Rules ==========
    {
      ruleId: 'VMD_FOCAL_001',
      ruleName: '포컬 포인트 부재',
      category: 'focal_point',
      priority: 2,
      severity: 'major',
      description: '존에 시선을 끄는 포컬 포인트가 없습니다.',
      bestPractice: '각 존에 최소 1개의 포컬 포인트(마네킹, 디스플레이 테이블 등)를 설치합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        context.zones.forEach(zone => {
          const zoneFurniture = context.furniture.filter(f => f.zoneId === zone.id);
          const hasFocalPoint = zoneFurniture.some(isFocalPointFurniture);

          if (!hasFocalPoint && zoneFurniture.length >= 2) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_FOCAL_001',
              ruleName: '포컬 포인트 부재',
              category: 'focal_point',
              severity: zone.areaSqm > 30 ? 'major' : 'minor',
              location: {
                zoneId: zone.id,
                zoneCode: zone.code,
              },
              description: `${zone.code} 존에 포컬 포인트 없음`,
              currentState: `가구 ${zoneFurniture.length}개 중 포컬 포인트 0개`,
              idealState: '각 존에 최소 1개 포컬 포인트 필요',
              impactEstimate: {
                revenueImpact: -0.04,
                experienceImpact: -0.06,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const zone = context.zones.find(z => z.id === violation.location.zoneId);
        const zoneFurniture = context.furniture.filter(f => f.zoneId === violation.location.zoneId);

        // 가장 높은 성과의 가구를 포컬 포인트로 전환 제안
        const bestFurniture = zoneFurniture.sort(
          (a, b) => b.avgProductPerformance - a.avgProductPerformance
        )[0];

        if (!bestFurniture) return null;

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'furniture_adjust',
          priority: 'medium',
          actions: [{
            actionType: 'adjust' as ActionType,
            targetType: 'furniture' as TargetType,
            targetId: bestFurniture.id,
            targetCode: bestFurniture.code,
            details: `${bestFurniture.code}를 포컬 포인트로 강조 (조명, 사이니지 추가) 또는 마네킹 설치`,
          }],
          expectedImprovement: {
            vmdScore: 3,
            revenueImpact: 0.05,
            experienceImpact: 0.08,
          },
          effort: 'medium',
          reasoning: '포컬 포인트 추가로 시선 유도 및 존 인지도 향상',
        };
      },
    },

    {
      ruleId: 'VMD_FOCAL_002',
      ruleName: '포컬 포인트 비주력 상품',
      category: 'focal_point',
      priority: 1,
      severity: 'major',
      description: '포컬 포인트에 신상품이나 베스트셀러가 아닌 상품이 배치되어 있습니다.',
      bestPractice: '포컬 포인트에는 신상품, 베스트셀러, 시즌 주력 상품을 배치합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        const focalPointFurniture = context.furniture.filter(isFocalPointFurniture);

        focalPointFurniture.forEach(furniture => {
          const productsOnFocal = context.products.filter(
            p => p.placement.furnitureId === furniture.id
          );

          const nonFeaturedProducts = productsOnFocal.filter(
            p => !p.isNewArrival && !p.isBestSeller && p.performance !== 'high'
          );

          const nonFeaturedRatio = productsOnFocal.length > 0
            ? nonFeaturedProducts.length / productsOnFocal.length
            : 0;

          if (nonFeaturedRatio > 0.5 && nonFeaturedProducts.length >= 2) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_FOCAL_002',
              ruleName: '포컬 포인트 비주력 상품',
              category: 'focal_point',
              severity: nonFeaturedRatio > 0.7 ? 'critical' : 'major',
              location: {
                furnitureId: furniture.id,
                furnitureCode: furniture.code,
                zoneId: furniture.zoneId,
                zoneCode: furniture.zoneCode,
                productIds: nonFeaturedProducts.map(p => p.id),
              },
              description: `포컬 포인트 ${furniture.code}에 비주력 상품 ${Math.round(nonFeaturedRatio * 100)}%`,
              currentState: `비주력 상품 ${nonFeaturedProducts.length}개 / 전체 ${productsOnFocal.length}개`,
              idealState: '포컬 포인트는 신상품/베스트셀러 70% 이상',
              impactEstimate: {
                revenueImpact: -0.08,
                experienceImpact: -0.05,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productIds = violation.location.productIds || [];
        const featuredProducts = context.products.filter(
          p => (p.isNewArrival || p.isBestSeller) &&
               p.placement.furnitureId !== violation.location.furnitureId
        );

        if (featuredProducts.length === 0) return null;

        const actions: VMDAction[] = productIds.slice(0, 3).map((productId, idx) => {
          const product = context.products.find(p => p.id === productId);
          const replacement = featuredProducts[idx % featuredProducts.length];

          return {
            actionType: 'swap' as ActionType,
            targetType: 'product' as TargetType,
            targetId: productId,
            targetCode: product?.sku || productId,
            from: {
              zoneCode: violation.location.zoneCode || '',
              furnitureCode: violation.location.furnitureCode,
            },
            to: {
              zoneCode: replacement.placement.zoneCode,
              furnitureCode: replacement.placement.furnitureCode,
            },
            details: `포컬 포인트의 ${product?.name || product?.sku}를 ${replacement.name || replacement.sku}(${replacement.isNewArrival ? '신상품' : '베스트셀러'})으로 교체`,
          };
        });

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_swap',
          priority: 'high',
          actions,
          expectedImprovement: {
            vmdScore: 5,
            revenueImpact: 0.10,
            experienceImpact: 0.08,
          },
          effort: 'low',
          reasoning: '포컬 포인트에 주력 상품 배치로 시선 집중 및 판매 촉진',
        };
      },
    },

    // ========== Breathing Room Rules ==========
    {
      ruleId: 'VMD_SPACE_001',
      ruleName: '가구 점유율 과다',
      category: 'breathing_room',
      priority: 2,
      severity: 'major',
      description: '가구의 슬롯 점유율이 85%를 초과하여 상품이 과밀합니다.',
      bestPractice: '가구 점유율은 70-80%로 유지하여 상품 가시성을 확보합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        context.furniture.forEach(furniture => {
          if (furniture.occupancyRate > 0.85 && furniture.slots.length >= 4) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_SPACE_001',
              ruleName: '가구 점유율 과다',
              category: 'breathing_room',
              severity: furniture.occupancyRate > 0.95 ? 'critical' : 'major',
              location: {
                furnitureId: furniture.id,
                furnitureCode: furniture.code,
                zoneId: furniture.zoneId,
                zoneCode: furniture.zoneCode,
              },
              description: `${furniture.code} 점유율 ${Math.round(furniture.occupancyRate * 100)}%`,
              currentState: `점유 슬롯: ${furniture.slots.filter(s => s.isOccupied).length}/${furniture.slots.length}`,
              idealState: '점유율 70-80% 권장',
              impactEstimate: {
                revenueImpact: -0.03,
                experienceImpact: -0.07,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const furniture = context.furniture.find(f => f.id === violation.location.furnitureId);
        if (!furniture) return null;

        const productsOnFurniture = context.products.filter(
          p => p.placement.furnitureId === furniture.id
        );

        // 저성과 상품 우선 제거
        const lowPerformers = productsOnFurniture
          .filter(p => p.performance === 'low')
          .slice(0, Math.ceil(productsOnFurniture.length * 0.2));

        if (lowPerformers.length === 0) return null;

        const actions: VMDAction[] = lowPerformers.map(product => ({
          actionType: 'remove' as ActionType,
          targetType: 'product' as TargetType,
          targetId: product.id,
          targetCode: product.sku,
          from: {
            zoneCode: product.placement.zoneCode,
            furnitureCode: product.placement.furnitureCode,
          },
          details: `저성과 상품 ${product.name || product.sku} 제거하여 점유율 감소`,
        }));

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'remove_product',
          priority: 'medium',
          actions,
          expectedImprovement: {
            vmdScore: 3,
            revenueImpact: 0.02,
            experienceImpact: 0.08,
          },
          effort: 'low',
          reasoning: '과밀 해소로 상품 가시성 및 고객 접근성 향상',
        };
      },
    },

    {
      ruleId: 'VMD_SPACE_002',
      ruleName: '존 가구 밀도 과다',
      category: 'breathing_room',
      priority: 2,
      severity: 'major',
      description: '존 내 가구 밀도가 높아 고객 이동이 불편합니다.',
      bestPractice: '존당 가구 밀도는 면적의 40-50%를 초과하지 않도록 합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        context.zones.forEach(zone => {
          const zoneFurniture = context.furniture.filter(f => f.zoneId === zone.id);
          const furnitureDensity = zoneFurniture.length / (zone.areaSqm || 20);

          // 5m² 당 1개 이상 가구면 과밀
          if (furnitureDensity > 0.2 && zoneFurniture.length >= 3) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_SPACE_002',
              ruleName: '존 가구 밀도 과다',
              category: 'breathing_room',
              severity: furnitureDensity > 0.3 ? 'critical' : 'major',
              location: {
                zoneId: zone.id,
                zoneCode: zone.code,
              },
              description: `${zone.code} 가구 밀도 ${zoneFurniture.length}개/${zone.areaSqm}m²`,
              currentState: `밀도: ${(furnitureDensity * 100).toFixed(1)}% (가구 ${zoneFurniture.length}개)`,
              idealState: '밀도 20% 이하 권장 (5m²당 1개)',
              impactEstimate: {
                revenueImpact: -0.04,
                experienceImpact: -0.10,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const zoneFurniture = context.furniture.filter(
          f => f.zoneId === violation.location.zoneId
        );

        // 가장 성과 낮은 가구 제거 제안
        const lowestPerformance = zoneFurniture
          .sort((a, b) => a.avgProductPerformance - b.avgProductPerformance)
          .slice(0, 1);

        if (lowestPerformance.length === 0) return null;

        const actions: VMDAction[] = lowestPerformance.map(f => ({
          actionType: 'remove' as ActionType,
          targetType: 'furniture' as TargetType,
          targetId: f.id,
          targetCode: f.code,
          from: {
            zoneCode: f.zoneCode,
          },
          details: `저성과 가구 ${f.code} 제거 또는 다른 존으로 이동`,
        }));

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'furniture_adjust',
          priority: 'medium',
          actions,
          expectedImprovement: {
            vmdScore: 4,
            revenueImpact: 0.03,
            experienceImpact: 0.12,
          },
          effort: 'high',
          reasoning: '가구 밀도 감소로 고객 동선 및 쇼핑 경험 개선',
        };
      },
    },

    // ========== Cross Merchandising Rules ==========
    {
      ruleId: 'VMD_CROSS_001',
      ruleName: '연관 상품 분리 배치',
      category: 'cross_merchandising',
      priority: 1,
      severity: 'major',
      description: '강한 연관 관계(lift > 2)의 상품들이 서로 다른 존에 배치되어 있습니다.',
      bestPractice: '연관 상품은 인접 배치하여 크로스셀 기회를 극대화합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        if (!context.associations?.associationRules) return violations;

        const strongRules = context.associations.associationRules.filter(
          rule => rule.lift > 2 && (rule.ruleStrength === 'very_strong' || rule.ruleStrength === 'strong')
        );

        strongRules.forEach(rule => {
          const antecedentProduct = context.products.find(
            p => rule.antecedent.includes(p.id) || rule.antecedent.includes(p.sku)
          );
          const consequentProduct = context.products.find(
            p => rule.consequent.includes(p.id) || rule.consequent.includes(p.sku)
          );

          if (antecedentProduct && consequentProduct &&
              antecedentProduct.placement.zoneId !== consequentProduct.placement.zoneId) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_CROSS_001',
              ruleName: '연관 상품 분리 배치',
              category: 'cross_merchandising',
              severity: rule.lift > 3 ? 'critical' : 'major',
              location: {
                productIds: [antecedentProduct.id, consequentProduct.id],
              },
              description: `연관 상품(lift ${rule.lift.toFixed(1)}) 분리 배치`,
              currentState: `${antecedentProduct.name}(${antecedentProduct.placement.zoneCode}) ↔ ${consequentProduct.name}(${consequentProduct.placement.zoneCode})`,
              idealState: '연관 상품은 동일 존 또는 인접 존 배치',
              impactEstimate: {
                revenueImpact: -0.06,
                experienceImpact: -0.02,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productIds = violation.location.productIds || [];
        if (productIds.length < 2) return null;

        const product1 = context.products.find(p => p.id === productIds[0]);
        const product2 = context.products.find(p => p.id === productIds[1]);

        if (!product1 || !product2) return null;

        // 성과가 높은 상품의 존으로 이동
        const targetProduct = product1.performance === 'high' ? product1 :
                              product2.performance === 'high' ? product2 : product1;
        const moveProduct = targetProduct === product1 ? product2 : product1;

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'product_move',
          priority: 'high',
          actions: [{
            actionType: 'move' as ActionType,
            targetType: 'product' as TargetType,
            targetId: moveProduct.id,
            targetCode: moveProduct.sku,
            from: {
              zoneCode: moveProduct.placement.zoneCode,
              furnitureCode: moveProduct.placement.furnitureCode,
            },
            to: {
              zoneCode: targetProduct.placement.zoneCode,
            },
            details: `${moveProduct.name || moveProduct.sku}을(를) ${targetProduct.name || targetProduct.sku} 인접으로 이동`,
          }],
          expectedImprovement: {
            vmdScore: 4,
            revenueImpact: 0.08,
            experienceImpact: 0.03,
          },
          effort: 'low',
          reasoning: '연관 상품 인접 배치로 크로스셀 및 장바구니 금액 증가',
        };
      },
    },

    {
      ruleId: 'VMD_CROSS_002',
      ruleName: '크로스셀 기회 미활용',
      category: 'cross_merchandising',
      priority: 2,
      severity: 'minor',
      description: '고성과 상품 인접에 연관 상품이 배치되어 있지 않습니다.',
      bestPractice: '고성과 상품 주변에 보완재/연관 상품을 배치합니다.',

      checkViolation: (context: VMDContext): VMDViolation[] => {
        const violations: VMDViolation[] = [];

        const highPerformers = context.products.filter(p => p.performance === 'high');

        highPerformers.forEach(highProduct => {
          const sameFurnitureProducts = context.products.filter(
            p => p.placement.furnitureId === highProduct.placement.furnitureId &&
                 p.id !== highProduct.id
          );

          // 연관 상품 확인
          const hasRelatedProduct = sameFurnitureProducts.some(p => {
            if (!context.associations?.categoryAffinities) return false;
            return context.associations.categoryAffinities.some(
              aff => (aff.category1 === highProduct.category && aff.category2 === p.category) ||
                     (aff.category2 === highProduct.category && aff.category1 === p.category)
            );
          });

          if (!hasRelatedProduct && sameFurnitureProducts.length >= 2) {
            violations.push({
              id: generateId(),
              ruleId: 'VMD_CROSS_002',
              ruleName: '크로스셀 기회 미활용',
              category: 'cross_merchandising',
              severity: 'minor',
              location: {
                furnitureId: highProduct.placement.furnitureId,
                furnitureCode: highProduct.placement.furnitureCode,
                productIds: [highProduct.id],
              },
              description: `고성과 상품 ${highProduct.name} 인접에 연관 상품 없음`,
              currentState: `${highProduct.category} 카테고리만 존재`,
              idealState: '연관 카테고리 상품 인접 배치',
              impactEstimate: {
                revenueImpact: -0.03,
                experienceImpact: 0,
              },
            });
          }
        });

        return violations;
      },

      generateSuggestion: (violation: VMDViolation, context: VMDContext): VMDSuggestion | null => {
        const productId = violation.location.productIds?.[0];
        if (!productId) return null;

        const highProduct = context.products.find(p => p.id === productId);
        if (!highProduct || !context.associations?.categoryAffinities) return null;

        // 연관 카테고리 찾기
        const relatedCategories = context.associations.categoryAffinities
          .filter(aff =>
            aff.category1 === highProduct.category ||
            aff.category2 === highProduct.category
          )
          .map(aff =>
            aff.category1 === highProduct.category ? aff.category2 : aff.category1
          );

        // 연관 카테고리의 상품 찾기
        const relatedProduct = context.products.find(
          p => relatedCategories.includes(p.category) &&
               p.placement.furnitureId !== highProduct.placement.furnitureId
        );

        if (!relatedProduct) return null;

        return {
          id: generateId(),
          violationId: violation.id,
          type: 'add_product',
          priority: 'low',
          actions: [{
            actionType: 'move' as ActionType,
            targetType: 'product' as TargetType,
            targetId: relatedProduct.id,
            targetCode: relatedProduct.sku,
            from: {
              zoneCode: relatedProduct.placement.zoneCode,
              furnitureCode: relatedProduct.placement.furnitureCode,
            },
            to: {
              zoneCode: highProduct.placement.zoneCode,
              furnitureCode: highProduct.placement.furnitureCode,
            },
            details: `${relatedProduct.name || relatedProduct.sku}(${relatedProduct.category})을(를) ${highProduct.name || highProduct.sku} 인접으로 이동`,
          }],
          expectedImprovement: {
            vmdScore: 2,
            revenueImpact: 0.04,
            experienceImpact: 0.02,
          },
          effort: 'low',
          reasoning: '고성과 상품 인접에 연관 상품 배치로 크로스셀 기회 창출',
        };
      },
    },
  ];
}

// ============================================================================
// Context Building Functions
// ============================================================================

/**
 * VMD 분석용 컨텍스트 구성
 */
export function buildVMDContext(
  zones: any[],
  furniture: any[],
  products: any[],
  slots: any[],
  flowAnalysis: FlowAnalysisResult | null,
  associations: ProductAssociationResult | null,
  productPerformance: any[]
): VMDContext {
  // 존 변환
  const convertedZones: Zone[] = zones.map(z => ({
    id: z.id,
    code: z.zone_code || z.code,
    name: z.zone_name || z.name,
    type: z.zone_type || z.type || 'general',
    areaSqm: z.area_sqm || z.areaSqm || 20,
    isEntrance: z.zone_type?.includes('entrance') || z.zone_code?.includes('entrance'),
  }));

  // 상품 성과 맵 생성
  const performanceMap = new Map<string, ProductPerformance>();
  productPerformance.forEach(p => {
    const conversionRate = p.conversion_rate || 0;
    const revenue = p.revenue || p.total_revenue || 0;
    let performance: ProductPerformance = 'medium';

    if (conversionRate > 0.1 || revenue > 500000) performance = 'high';
    else if (conversionRate < 0.03 || revenue < 50000) performance = 'low';

    performanceMap.set(p.product_id, performance);
  });

  // 슬롯 맵 생성
  const slotMap = new Map<string, any>();
  slots.forEach(s => {
    slotMap.set(s.id, s);
  });

  // 가구별 슬롯 및 상품 정보 집계
  const furnitureProductsMap = new Map<string, any[]>();
  products.forEach(p => {
    const furnitureId = p.furniture_id;
    if (!furnitureProductsMap.has(furnitureId)) {
      furnitureProductsMap.set(furnitureId, []);
    }
    furnitureProductsMap.get(furnitureId)!.push(p);
  });

  // 가구 변환
  const convertedFurniture: FurnitureWithSlots[] = furniture.map(f => {
    const furnitureSlots = slots.filter(s => s.furniture_id === f.id);
    const furnitureProducts = furnitureProductsMap.get(f.id) || [];

    const occupiedSlots = furnitureSlots.filter(s =>
      furnitureProducts.some(p => p.slot_id === s.id)
    );

    const productColors = furnitureProducts
      .map(p => p.color || 'unknown')
      .filter(c => c !== 'unknown');

    const productCategories = [...new Set(furnitureProducts.map(p => p.category || 'general'))];

    const avgPrice = furnitureProducts.length > 0
      ? furnitureProducts.reduce((sum, p) => sum + (p.price || 0), 0) / furnitureProducts.length
      : 0;

    const avgPerformance = furnitureProducts.length > 0
      ? furnitureProducts.reduce((sum, p) => {
          const perf = performanceMap.get(p.id) || 'medium';
          return sum + performanceToScore(perf);
        }, 0) / furnitureProducts.length
      : 0.5;

    const zone = convertedZones.find(z => z.id === f.zone_id);

    return {
      id: f.id,
      code: f.furniture_code || f.code || f.id,
      name: f.furniture_name || f.name || '',
      zoneId: f.zone_id,
      zoneCode: zone?.code || '',
      displayType: f.furniture_type || f.displayType || 'rack',
      isFocalPoint: FOCAL_POINT_FURNITURE_TYPES.some(type =>
        (f.furniture_type || '').toLowerCase().includes(type)
      ),
      slots: furnitureSlots.map(s => ({
        id: s.id,
        slotId: s.slot_id,
        height: estimateSlotHeight(s.slot_position?.y || 1.0),
        isOccupied: furnitureProducts.some(p => p.slot_id === s.id),
        productId: furnitureProducts.find(p => p.slot_id === s.id)?.id,
        compatibleDisplayTypes: s.compatible_display_types || [],
      })),
      occupancyRate: furnitureSlots.length > 0
        ? occupiedSlots.length / furnitureSlots.length
        : 0,
      productCategories,
      productColors,
      avgProductPrice: avgPrice,
      avgProductPerformance: avgPerformance,
      position: {
        x: f.position_x || f.position?.x || 0,
        y: f.position_y || f.position?.y || 0,
        z: f.position_z || f.position?.z || 0,
      },
    };
  });

  // 상품 변환
  const convertedProducts: ProductWithPlacement[] = products.map(p => {
    const slot = slotMap.get(p.slot_id);
    const furn = convertedFurniture.find(f => f.id === p.furniture_id);
    const zone = convertedZones.find(z => z.id === furn?.zoneId);

    return {
      id: p.id,
      sku: p.sku || '',
      name: p.product_name || p.name || '',
      category: p.category || 'general',
      price: p.price || 0,
      color: p.color || 'unknown',
      margin: p.margin,
      isNewArrival: p.is_new_arrival || false,
      isBestSeller: p.is_best_seller || false,
      performance: performanceMap.get(p.id) || 'medium',
      placement: {
        furnitureId: p.furniture_id || '',
        furnitureCode: furn?.code || '',
        slotId: p.slot_id || '',
        slotHeight: estimateSlotHeight(slot?.slot_position?.y || p.position?.y || 1.0),
        zoneId: furn?.zoneId || '',
        zoneCode: zone?.code || '',
        zoneType: zone?.type || 'general',
      },
    };
  });

  // 인접 관계 구성
  const zoneAdjacency = new Map<string, string[]>();
  const furnitureAdjacency = new Map<string, string[]>();

  // 간단한 인접 관계 (같은 존 내 가구들)
  convertedZones.forEach(zone => {
    const zoneFurnitureIds = convertedFurniture
      .filter(f => f.zoneId === zone.id)
      .map(f => f.id);

    zoneFurnitureIds.forEach(fId => {
      furnitureAdjacency.set(fId, zoneFurnitureIds.filter(id => id !== fId));
    });
  });

  return {
    zones: convertedZones,
    furniture: convertedFurniture,
    products: convertedProducts,
    flowAnalysis,
    associations,
    zoneAdjacency,
    furnitureAdjacency,
  };
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * 모든 규칙 검사하여 위반 사항 수집
 */
export function checkAllViolations(
  rules: VMDRule[],
  context: VMDContext
): VMDViolation[] {
  const violations: VMDViolation[] = [];

  rules.forEach(rule => {
    try {
      const ruleViolations = rule.checkViolation(context);
      violations.push(...ruleViolations);
    } catch (error) {
      console.error(`[VMD] Rule ${rule.ruleId} check failed:`, error);
    }
  });

  // 심각도 순으로 정렬
  return violations.sort((a, b) => {
    const severityOrder = { critical: 0, major: 1, minor: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * 각 위반에 대한 개선 제안 생성
 */
export function generateAllSuggestions(
  violations: VMDViolation[],
  rules: VMDRule[],
  context: VMDContext
): VMDSuggestion[] {
  const suggestions: VMDSuggestion[] = [];

  violations.forEach(violation => {
    const rule = rules.find(r => r.ruleId === violation.ruleId);
    if (!rule) return;

    try {
      const suggestion = rule.generateSuggestion(violation, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    } catch (error) {
      console.error(`[VMD] Suggestion generation for ${violation.ruleId} failed:`, error);
    }
  });

  // 우선순위 순으로 정렬
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * VMD 점수 계산
 */
export function calculateVMDScore(
  violations: VMDViolation[],
  context: VMDContext
): VMDScore {
  const breakdown: Record<VMDCategory, CategoryScore> = {
    golden_zone: { score: 100, weight: CATEGORY_WEIGHTS.golden_zone, violations: 0, maxPossible: 100 },
    color_blocking: { score: 100, weight: CATEGORY_WEIGHTS.color_blocking, violations: 0, maxPossible: 100 },
    visual_flow: { score: 100, weight: CATEGORY_WEIGHTS.visual_flow, violations: 0, maxPossible: 100 },
    focal_point: { score: 100, weight: CATEGORY_WEIGHTS.focal_point, violations: 0, maxPossible: 100 },
    breathing_room: { score: 100, weight: CATEGORY_WEIGHTS.breathing_room, violations: 0, maxPossible: 100 },
    cross_merchandising: { score: 100, weight: CATEGORY_WEIGHTS.cross_merchandising, violations: 0, maxPossible: 100 },
  };

  // 위반별 점수 감점
  const severityPenalty = {
    critical: 25,
    major: 15,
    minor: 8,
  };

  violations.forEach(violation => {
    const category = violation.category;
    const penalty = severityPenalty[violation.severity];

    breakdown[category].violations += 1;
    breakdown[category].score = Math.max(0, breakdown[category].score - penalty);
  });

  // 전체 점수 계산 (가중 평균)
  const overall = Object.entries(breakdown).reduce((sum, [_, catScore]) => {
    return sum + (catScore.score * catScore.weight);
  }, 0);

  // 등급 결정
  let grade: Grade;
  if (overall >= 90) grade = 'A';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else if (overall >= 45) grade = 'D';
  else grade = 'F';

  return {
    overall: Math.round(overall),
    breakdown,
    grade,
    trend: 'stable', // 이전 데이터와 비교 필요
  };
}

/**
 * Quick Win 식별
 */
export function identifyQuickWins(suggestions: VMDSuggestion[]): string[] {
  return suggestions
    .filter(s => s.effort === 'low' && (s.priority === 'high' || s.priority === 'critical'))
    .slice(0, 5)
    .map(s => s.actions[0]?.details || s.reasoning);
}

/**
 * AI 프롬프트용 컨텍스트 생성
 */
function buildAIPromptContext(result: VMDAnalysisResult): string {
  const sections: string[] = [];

  sections.push(`## 🎨 VMD Analysis (Current Score: ${result.score.overall}/100, Grade: ${result.score.grade})`);

  sections.push(`\n### VMD Score Breakdown`);
  Object.entries(result.score.breakdown).forEach(([category, score]) => {
    const emoji = score.score >= 80 ? '✅' : score.score >= 60 ? '⚠️' : '❌';
    sections.push(`- ${emoji} ${category}: ${score.score}/100 (${score.violations} violations)`);
  });

  if (result.violations.length > 0) {
    sections.push(`\n### Critical VMD Issues (${result.summary.criticalViolations} critical, ${result.summary.majorViolations} major)`);
    result.violations
      .filter(v => v.severity === 'critical' || v.severity === 'major')
      .slice(0, 5)
      .forEach(v => {
        sections.push(`- [${v.severity.toUpperCase()}] ${v.description}`);
        sections.push(`  Current: ${v.currentState}`);
        sections.push(`  Ideal: ${v.idealState}`);
      });
  }

  if (result.suggestions.length > 0) {
    sections.push(`\n### Top VMD Recommendations`);
    result.suggestions
      .filter(s => s.priority === 'critical' || s.priority === 'high')
      .slice(0, 5)
      .forEach((s, i) => {
        sections.push(`${i + 1}. [${s.priority.toUpperCase()}] ${s.reasoning}`);
        s.actions.slice(0, 2).forEach(a => {
          sections.push(`   → ${a.details}`);
        });
        sections.push(`   Expected: +${Math.round(s.expectedImprovement.revenueImpact * 100)}% revenue, +${s.expectedImprovement.vmdScore} VMD score`);
      });
  }

  if (result.summary.quickWins.length > 0) {
    sections.push(`\n### Quick Wins (Low Effort, High Impact)`);
    result.summary.quickWins.forEach((qw, i) => {
      sections.push(`${i + 1}. ${qw}`);
    });
  }

  return sections.join('\n');
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * VMD 전체 분석 실행
 */
export function analyzeVMD(context: VMDContext): VMDAnalysisResult {
  const rules = createVMDRules();

  // 1. 위반 사항 검사
  const violations = checkAllViolations(rules, context);

  // 2. 개선 제안 생성
  const suggestions = generateAllSuggestions(violations, rules, context);

  // 3. 점수 계산
  const score = calculateVMDScore(violations, context);

  // 4. Quick Win 식별
  const quickWins = identifyQuickWins(suggestions);

  // 5. 요약 생성
  const summary = {
    criticalViolations: violations.filter(v => v.severity === 'critical').length,
    majorViolations: violations.filter(v => v.severity === 'major').length,
    minorViolations: violations.filter(v => v.severity === 'minor').length,
    topPrioritySuggestion: suggestions[0]?.reasoning || 'VMD 기준 준수 양호',
    quickWins,
  };

  const result: VMDAnalysisResult = {
    score,
    violations,
    suggestions,
    summary,
    aiPromptContext: '',
  };

  // 6. AI 프롬프트 컨텍스트 생성
  result.aiPromptContext = buildAIPromptContext(result);

  return result;
}

// ============================================================================
// Response Formatting Functions
// ============================================================================

/**
 * API 응답용 VMD 분석 결과 포맷팅
 */
export function formatVMDAnalysisForResponse(result: VMDAnalysisResult) {
  return {
    score: {
      overall: result.score.overall,
      grade: result.score.grade,
      breakdown: Object.fromEntries(
        Object.entries(result.score.breakdown).map(([category, score]) => [
          category,
          {
            score: score.score,
            violations: score.violations,
          },
        ])
      ),
    },
    violations_summary: {
      critical: result.summary.criticalViolations,
      major: result.summary.majorViolations,
      minor: result.summary.minorViolations,
    },
    top_suggestions: result.suggestions.slice(0, 5).map(s => ({
      priority: s.priority,
      action: s.actions[0]?.details || s.reasoning,
      expected_improvement: `+${Math.round(s.expectedImprovement.revenueImpact * 100)}% 매출`,
    })),
    quick_wins: result.summary.quickWins,
  };
}
