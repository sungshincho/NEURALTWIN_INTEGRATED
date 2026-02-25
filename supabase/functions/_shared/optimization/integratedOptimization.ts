/**
 * integratedOptimization.ts
 *
 * B안: AI 최적화 통합 유틸리티
 *
 * Features:
 * - 레이아웃 최적화 → 직원 위치 제안 생성
 * - 인력배치 최적화 → 가구 미세 조정 생성
 */

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// B안 타입 정의
// ============================================================================

export interface StaffSuggestion {
  staff_id: string;
  staff_name: string;
  role: string;
  current_position: Vector3D;
  suggested_position: Vector3D;
  suggested_rotation?: Vector3D;
  reason: string;
  is_optional: boolean;
  related_furniture_change_id?: string;
}

export interface StaffSuggestions {
  summary: {
    repositioned: number;
    note: string;
  };
  items: StaffSuggestion[];
}

export interface FurnitureAdjustment {
  furniture_id: string;
  furniture_type: string;
  furniture_name?: string;
  adjustment_type: 'position' | 'rotation' | 'both';
  current_position: Vector3D;
  current_rotation: Vector3D;
  adjusted_position: Vector3D;
  adjusted_rotation: Vector3D;
  adjustment_distance: number;
  reason: string;
  is_optional: boolean;
  related_staff_change_id?: string;
}

export interface FurnitureAdjustments {
  summary: {
    adjusted: number;
    note: string;
  };
  items: FurnitureAdjustment[];
}

// ============================================================================
// B안: 레이아웃 최적화 → 직원 위치 제안 생성
// ============================================================================

/**
 * 가구 변경사항을 분석하여 연동 직원 위치 제안 생성
 *
 * @param furnitureChanges - 가구 변경 목록
 * @param currentStaff - 현재 직원 목록
 * @param zones - 존 정보
 * @returns StaffSuggestions
 */
export function generateStaffSuggestionsFromLayout(
  furnitureChanges: any[],
  currentStaff: any[],
  zones: any[]
): StaffSuggestions {
  if (!currentStaff || currentStaff.length === 0) {
    return {
      summary: { repositioned: 0, note: '직원 데이터가 없습니다' },
      items: [],
    };
  }

  if (!furnitureChanges || furnitureChanges.length === 0) {
    return {
      summary: { repositioned: 0, note: '가구 변경사항이 없어 직원 재배치가 필요하지 않습니다' },
      items: [],
    };
  }

  const suggestions: StaffSuggestion[] = [];

  // 변경된 가구가 있는 존 식별
  const affectedZoneIds = new Set<string>();
  for (const change of furnitureChanges) {
    if (change.current?.zone_id) affectedZoneIds.add(change.current.zone_id);
    if (change.suggested?.zone_id) affectedZoneIds.add(change.suggested.zone_id);
  }

  // 영향받는 존에 있는 직원들에게 재배치 제안
  for (const staff of currentStaff) {
    const staffZoneId = staff.assigned_zone_id || staff.zone_id;

    if (affectedZoneIds.has(staffZoneId)) {
      // 해당 존의 가구 변경사항 찾기
      const relatedChange = furnitureChanges.find(
        c => c.current?.zone_id === staffZoneId || c.suggested?.zone_id === staffZoneId
      );

      if (relatedChange) {
        const currentPos = staff.avatar_position || staff.position || { x: 0, y: 0.5, z: 0 };

        // 가구 이동 방향과 반대 또는 보완하는 위치로 제안
        const furnitureDelta = {
          x: (relatedChange.suggested?.position?.x || 0) - (relatedChange.current?.position?.x || 0),
          z: (relatedChange.suggested?.position?.z || 0) - (relatedChange.current?.position?.z || 0),
        };

        // 직원은 가구와 적정 거리 유지하면서 고객 동선 커버리지 확보
        const suggestedPos = {
          x: currentPos.x + (furnitureDelta.x * 0.3), // 가구 이동의 30% 정도 따라감
          y: 0.5,
          z: currentPos.z + (furnitureDelta.z * 0.3) + 1.5, // 약간 뒤로 (고객 응대 위치)
        };

        suggestions.push({
          staff_id: staff.id || staff.staff_id,
          staff_name: staff.staff_name || staff.name || '직원',
          role: staff.role || 'sales',
          current_position: currentPos,
          suggested_position: suggestedPos,
          reason: `${relatedChange.furniture_type || '가구'} 재배치에 따른 최적 고객 응대 위치`,
          is_optional: true, // 레이아웃 최적화에서 직원 제안은 선택적
          related_furniture_change_id: relatedChange.furniture_id,
        });
      }
    }
  }

  return {
    summary: {
      repositioned: suggestions.length,
      note: suggestions.length > 0
        ? '가구 배치 변경에 따른 권장 직원 위치입니다 (선택 사항)'
        : '가구 변경에 영향받는 직원이 없습니다',
    },
    items: suggestions,
  };
}

// ============================================================================
// B안: 인력배치 최적화 → 가구 미세 조정 생성
// ============================================================================

/**
 * 직원 재배치에 따른 가구 미세 조정 제안 생성
 *
 * @param staffChanges - 직원 변경 목록
 * @param currentFurniture - 현재 가구 목록
 * @param maxAdjustmentDistance - 최대 조정 거리 (cm)
 * @returns FurnitureAdjustments
 */
export function generateFurnitureAdjustmentsFromStaffing(
  staffChanges: any[],
  currentFurniture: any[],
  maxAdjustmentDistance: number = 50
): FurnitureAdjustments {
  if (!currentFurniture || currentFurniture.length === 0) {
    return {
      summary: { adjusted: 0, note: '가구 데이터가 없습니다' },
      items: [],
    };
  }

  if (!staffChanges || staffChanges.length === 0) {
    return {
      summary: { adjusted: 0, note: '직원 변경사항이 없어 가구 조정이 필요하지 않습니다' },
      items: [],
    };
  }

  const adjustments: FurnitureAdjustment[] = [];
  const maxDistanceM = maxAdjustmentDistance / 100; // cm → m 변환

  // 이동 가능한 가구만 필터
  const movableFurniture = currentFurniture.filter(f => f.movable !== false);

  for (const staffChange of staffChanges) {
    const suggestedStaffPos = staffChange.suggestedPosition || staffChange.suggested?.position;
    if (!suggestedStaffPos) continue;

    // 직원 제안 위치 근처의 가구 찾기
    for (const furniture of movableFurniture) {
      const furniturePos = furniture.position || { x: 0, y: 0, z: 0 };

      // 직원과 가구 간 거리 계산
      const distance = Math.sqrt(
        Math.pow(suggestedStaffPos.x - furniturePos.x, 2) +
        Math.pow(suggestedStaffPos.z - furniturePos.z, 2)
      );

      // 직원 동선에 방해되는 가구 (1.5m 이내)
      if (distance < 1.5) {
        // 가구를 약간 이동시켜 직원 동선 확보
        const direction = {
          x: furniturePos.x - suggestedStaffPos.x,
          z: furniturePos.z - suggestedStaffPos.z,
        };
        const dirLength = Math.sqrt(direction.x ** 2 + direction.z ** 2) || 1;

        // 최대 조정 거리 제한 적용
        const adjustmentAmount = Math.min(maxDistanceM, 0.5); // 최대 50cm 또는 설정값

        const adjustedPos = {
          x: furniturePos.x + (direction.x / dirLength) * adjustmentAmount,
          y: furniturePos.y || 0,
          z: furniturePos.z + (direction.z / dirLength) * adjustmentAmount,
        };

        const adjustmentDistanceCm = adjustmentAmount * 100;

        // 이미 추가된 가구인지 확인
        if (!adjustments.find(a => a.furniture_id === furniture.id)) {
          adjustments.push({
            furniture_id: furniture.id,
            furniture_type: furniture.furniture_type || 'unknown',
            furniture_name: furniture.furniture_name,
            adjustment_type: 'position',
            current_position: furniturePos,
            current_rotation: furniture.rotation || { x: 0, y: 0, z: 0 },
            adjusted_position: adjustedPos,
            adjusted_rotation: furniture.rotation || { x: 0, y: 0, z: 0 },
            adjustment_distance: adjustmentDistanceCm,
            reason: `${staffChange.staffName || '직원'} 동선 확보를 위한 미세 조정 (${adjustmentDistanceCm.toFixed(0)}cm 이동)`,
            is_optional: true, // 인력배치 최적화에서 가구 조정은 선택적
            related_staff_change_id: staffChange.staffId || staffChange.staff_id,
          });
        }
      }
    }
  }

  return {
    summary: {
      adjusted: adjustments.length,
      note: adjustments.length > 0
        ? `직원 동선 확보를 위한 미세 조정 (최대 ${maxAdjustmentDistance}cm 이동)`
        : '직원 재배치에 따른 가구 조정이 필요하지 않습니다',
    },
    items: adjustments,
  };
}

// ============================================================================
// B안: 통합 최적화 결과 생성
// ============================================================================

/**
 * 레이아웃 최적화 결과에 직원 제안 추가
 */
export function enhanceLayoutResultWithStaff(
  layoutResult: any,
  currentStaff: any[],
  zones: any[],
  includeStaffOptimization: boolean = true
): any {
  if (!includeStaffOptimization) {
    return layoutResult;
  }

  const staffSuggestions = generateStaffSuggestionsFromLayout(
    layoutResult.furniture_changes || [],
    currentStaff,
    zones
  );

  return {
    ...layoutResult,
    staff_suggestions: staffSuggestions,
    summary: {
      ...layoutResult.summary,
      total_staff_suggestions: staffSuggestions.items.length,
    },
  };
}

/**
 * 인력배치 최적화 결과에 가구 조정 추가
 */
export function enhanceStaffingResultWithFurniture(
  staffingResult: any,
  currentFurniture: any[],
  allowFurnitureAdjustment: boolean = true,
  maxAdjustmentDistance: number = 50
): any {
  if (!allowFurnitureAdjustment) {
    return staffingResult;
  }

  const furnitureAdjustments = generateFurnitureAdjustmentsFromStaffing(
    staffingResult.staffPositions || [],
    currentFurniture,
    maxAdjustmentDistance
  );

  return {
    ...staffingResult,
    furniture_adjustments: furnitureAdjustments,
    metrics: {
      ...staffingResult.metrics,
      total_furniture_adjustments: furnitureAdjustments.items.length,
    },
  };
}
