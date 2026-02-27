/**
 * optimizationValidator.ts
 *
 * 최적화 결과 유효성 검증 유틸리티
 * - 매장 경계 내 유효한 위치인지 확인
 * - 존재하는 가구로 재배치되는지 확인
 * - 유효하지 않은 재배치 항목 필터링
 */

// ============================================================================
// 타입 정의
// ============================================================================

interface Position {
  x: number;
  y?: number;
  z: number;
}

interface Zone {
  id: string;
  zone_name?: string;
  boundary?: Position[];
  polygon?: Position[];
  x?: number;
  z?: number;
  width?: number;
  depth?: number;
}

interface Furniture {
  id: string;
  furniture_code?: string;
  metadata?: {
    furniture_code?: string;
    code?: string;
    name?: string;
  };
  position?: Position;
}

interface FurnitureMove {
  furniture_code?: string;
  furnitureCode?: string;
  furniture_id?: string;
  furnitureId?: string;
  furniture_name?: string;
  to_position?: Position;
  toPosition?: Position;
  new_position?: Position;
  from_zone?: string;
  to_zone?: string;
  reason?: string;
}

interface ProductPlacement {
  product_sku?: string;
  productSku?: string;
  product_name?: string;
  productName?: string;
  to_furniture?: string;
  toFurniture?: string;
  to_furniture_id?: string;
  toFurnitureId?: string;
  to_slot_index?: number;
  toSlotIndex?: number;
  reason?: string;
}

interface OptimizationResult {
  furniture_moves?: FurnitureMove[];
  furnitureMoves?: FurnitureMove[];
  product_placements?: ProductPlacement[];
  productPlacements?: ProductPlacement[];
  [key: string]: unknown;
}

interface StoreData {
  zones: Zone[];
  furniture: Furniture[];
  storeBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

interface ValidationResult {
  isValid: boolean;
  filteredResult: OptimizationResult;
  removedItems: {
    furniture: FurnitureMove[];
    products: ProductPlacement[];
  };
  warnings: string[];
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 매장 경계 계산 (존 데이터 기반)
 */
function calculateStoreBounds(zones: Zone[]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  zones.forEach(zone => {
    const boundary = zone.boundary || zone.polygon;
    if (Array.isArray(boundary)) {
      boundary.forEach((point: Position | number[]) => {
        const x = typeof point === 'object' && 'x' in point ? point.x : (point as number[])[0];
        const z = typeof point === 'object' && 'z' in point
          ? point.z
          : typeof point === 'object' && 'y' in point
            ? point.y
            : (point as number[])[1];
        if (typeof x === 'number' && typeof z === 'number') {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }
      });
    } else if (zone.x !== undefined && zone.z !== undefined) {
      // 사각형 존
      const halfW = (zone.width || 2) / 2;
      const halfD = (zone.depth || 2) / 2;
      minX = Math.min(minX, zone.x - halfW);
      maxX = Math.max(maxX, zone.x + halfW);
      minZ = Math.min(minZ, zone.z - halfD);
      maxZ = Math.max(maxZ, zone.z + halfD);
    }
  });

  // 기본값 (계산 실패 시)
  if (!isFinite(minX)) {
    console.warn('[optimizationValidator] Could not calculate store bounds, using defaults');
    return { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  }

  return { minX, maxX, minZ, maxZ };
}

/**
 * Point-in-polygon 알고리즘 (Ray casting)
 */
function isPositionInZone(pos: Position, zone: Zone): boolean {
  const boundary = zone.boundary || zone.polygon;

  // 경계가 없으면 사각형 존으로 간주
  if (!boundary || !Array.isArray(boundary) || boundary.length < 3) {
    if (zone.x !== undefined && zone.z !== undefined) {
      const halfW = (zone.width || 2) / 2;
      const halfD = (zone.depth || 2) / 2;
      return (
        pos.x >= zone.x - halfW &&
        pos.x <= zone.x + halfW &&
        pos.z >= zone.z - halfD &&
        pos.z <= zone.z + halfD
      );
    }
    return true; // 경계 정보 없으면 통과
  }

  // Ray casting 알고리즘
  let inside = false;
  const x = pos.x, y = pos.z;

  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const point_i = boundary[i];
    const point_j = boundary[j];

    const xi = typeof point_i === 'object' && 'x' in point_i ? point_i.x : (point_i as number[])[0];
    const yi = typeof point_i === 'object' && 'z' in point_i
      ? point_i.z
      : typeof point_i === 'object' && 'y' in point_i
        ? (point_i as any).y
        : (point_i as number[])[1];
    const xj = typeof point_j === 'object' && 'x' in point_j ? point_j.x : (point_j as number[])[0];
    const yj = typeof point_j === 'object' && 'z' in point_j
      ? point_j.z
      : typeof point_j === 'object' && 'y' in point_j
        ? (point_j as any).y
        : (point_j as number[])[1];

    if (typeof xi !== 'number' || typeof yi !== 'number' || typeof xj !== 'number' || typeof yj !== 'number') {
      continue;
    }

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * 문자열 정규화 (대소문자, 공백, 특수문자 제거)
 */
function normalizeString(str: string | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\s\-_]/g, '')  // 공백, 하이픈, 언더스코어 제거
    .replace(/[^a-z0-9가-힣]/g, '');  // 특수문자 제거 (한글, 영문, 숫자만 유지)
}

/**
 * 문자열 유사도 계산 (Levenshtein distance 기반)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // 부분 문자열 매칭
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // 간단한 유사도 계산 (공통 문자 비율)
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;

  return intersection / union;
}

/**
 * 가구 찾기 (다양한 필드명 지원 + 퍼지 매칭)
 */
function findFurniture(furniture: Furniture[], code: string | undefined): Furniture | undefined {
  if (!code) return undefined;

  // 1. 정확한 매칭 시도
  const exactMatch = furniture.find(f =>
    f.id === code ||
    f.furniture_code === code ||
    f.metadata?.furniture_code === code ||
    f.metadata?.code === code ||
    f.metadata?.name === code ||
    (f as any).furniture_type === code
  );

  if (exactMatch) return exactMatch;

  // 2. 정규화된 문자열로 매칭 시도
  const normalizedCode = normalizeString(code);
  const normalizedMatch = furniture.find(f => {
    const candidates = [
      f.id,
      f.furniture_code,
      f.metadata?.furniture_code,
      f.metadata?.code,
      f.metadata?.name,
      (f as any).furniture_type,
    ].filter(Boolean);

    return candidates.some(c => normalizeString(c) === normalizedCode);
  });

  if (normalizedMatch) return normalizedMatch;

  // 3. 퍼지 매칭 (유사도 0.6 이상)
  let bestMatch: Furniture | undefined;
  let bestSimilarity = 0.6;  // 최소 유사도 임계값

  furniture.forEach(f => {
    const candidates = [
      f.id,
      f.furniture_code,
      f.metadata?.furniture_code,
      f.metadata?.code,
      f.metadata?.name,
      (f as any).furniture_type,
    ].filter(Boolean) as string[];

    candidates.forEach(candidate => {
      const similarity = calculateSimilarity(code, candidate);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = f;
      }
    });
  });

  if (bestMatch) {
    console.log(`[optimizationValidator] Fuzzy matched '${code}' to furniture with similarity ${bestSimilarity.toFixed(2)}`);
  }

  return bestMatch;
}

// ============================================================================
// 메인 검증 함수
// ============================================================================

/**
 * 최적화 결과 유효성 검증
 * - 매장 경계 밖 재배치 필터링
 * - 존재하지 않는 가구 필터링
 * - 경고 메시지 생성
 */
export function validateOptimizationResult(
  result: OptimizationResult,
  storeData: StoreData
): ValidationResult {
  const warnings: string[] = [];
  const removedFurniture: FurnitureMove[] = [];
  const removedProducts: ProductPlacement[] = [];

  // 매장 경계 계산
  const bounds = storeData.storeBounds || calculateStoreBounds(storeData.zones);

  console.log('[optimizationValidator] Store bounds:', bounds);

  // 가구 이동 검증
  const furnitureMoves = result.furniture_moves || result.furnitureMoves || [];
  const validFurnitureMoves = furnitureMoves.filter((move) => {
    const code = move.furniture_code || move.furnitureCode || move.furniture_id || move.furnitureId;
    const toPos = move.to_position || move.toPosition || move.new_position;

    if (!toPos) {
      warnings.push(`가구 ${code}: 목표 위치 정보 없음`);
      removedFurniture.push(move);
      return false;
    }

    // 매장 경계 체크
    if (
      toPos.x < bounds.minX || toPos.x > bounds.maxX ||
      toPos.z < bounds.minZ || toPos.z > bounds.maxZ
    ) {
      warnings.push(`가구 ${code}: 목표 위치가 매장 범위 밖 (${toPos.x.toFixed(1)}, ${toPos.z.toFixed(1)})`);
      removedFurniture.push(move);
      return false;
    }

    // 유효한 존 내부인지 확인
    const inValidZone = storeData.zones.some(zone => isPositionInZone(toPos, zone));

    if (!inValidZone && storeData.zones.length > 0) {
      warnings.push(`가구 ${code}: 유효한 존 외부로 이동 시도`);
      removedFurniture.push(move);
      return false;
    }

    return true;
  });

  // 제품 재배치 검증
  const productPlacements = result.product_placements || result.productPlacements || [];
  const validProductPlacements = productPlacements.filter((placement) => {
    const sku = placement.product_sku || placement.productSku;
    const toFurnitureCode = placement.to_furniture || placement.toFurniture || placement.to_furniture_id || placement.toFurnitureId;

    if (!toFurnitureCode) {
      warnings.push(`제품 ${sku}: 목표 가구 정보 없음`);
      removedProducts.push(placement);
      return false;
    }

    // 목표 가구 존재 확인
    const targetFurniture = findFurniture(storeData.furniture, toFurnitureCode);

    if (!targetFurniture) {
      warnings.push(`제품 ${sku}: 목표 가구 '${toFurnitureCode}' 없음`);
      removedProducts.push(placement);
      return false;
    }

    // 목표 가구가 매장 내부에 있는지 확인
    const furniturePos = targetFurniture.position;
    if (furniturePos && (
      furniturePos.x < bounds.minX || furniturePos.x > bounds.maxX ||
      furniturePos.z < bounds.minZ || furniturePos.z > bounds.maxZ
    )) {
      warnings.push(`제품 ${sku}: 목표 가구가 매장 범위 밖`);
      removedProducts.push(placement);
      return false;
    }

    return true;
  });

  const isValid = removedFurniture.length === 0 && removedProducts.length === 0;

  console.log('[optimizationValidator] Validation result:', {
    isValid,
    validFurnitureMoves: validFurnitureMoves.length,
    validProductPlacements: validProductPlacements.length,
    removedFurniture: removedFurniture.length,
    removedProducts: removedProducts.length,
    warnings,
  });

  return {
    isValid,
    filteredResult: {
      ...result,
      furniture_moves: validFurnitureMoves,
      product_placements: validProductPlacements,
    },
    removedItems: {
      furniture: removedFurniture,
      products: removedProducts,
    },
    warnings,
  };
}

export default validateOptimizationResult;
