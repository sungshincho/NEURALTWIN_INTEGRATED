/**
 * useStaffData.ts
 *
 * 실제 DB에서 스태프 데이터를 가져오는 훅
 * - staff 테이블에서 직원 정보 조회
 * - avatar_url, avatar_position, zone_id 등 포함
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// 타입 정의
// ============================================================================

export interface StaffMember {
  id: string;
  staff_code: string;
  staff_name: string;
  role: string;
  zone_id: string | null;
  zone_name?: string;
  avatar_url: string | null;
  avatar_position: { x: number; y: number; z: number };
  avatar_rotation?: { x: number; y: number; z: number };
  avatar_scale?: { x: number; y: number; z: number };
  is_active: boolean;
}

interface UseStaffDataOptions {
  storeId?: string;
  activeOnly?: boolean;
}

interface UseStaffDataReturn {
  staff: StaffMember[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// 역할별 색상 매핑
// ============================================================================

export const STAFF_ROLE_COLORS: Record<string, string> = {
  manager: '#8b5cf6',    // 보라색
  sales: '#22c55e',      // 초록색
  cashier: '#3b82f6',    // 파란색
  security: '#ef4444',   // 빨간색
  fitting: '#f59e0b',    // 주황색
  greeter: '#06b6d4',    // 청록색
  stock: '#6b7280',      // 회색
  default: '#9ca3af',    // 기본 회색
};

export function getStaffColor(role: string): string {
  return STAFF_ROLE_COLORS[role] || STAFF_ROLE_COLORS.default;
}

// ============================================================================
// useStaffData 훅
// ============================================================================

export function useStaffData(options: UseStaffDataOptions = {}): UseStaffDataReturn {
  const { storeId, activeOnly = true } = options;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStaff = async () => {
    if (!storeId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1단계: staff 테이블에서 기본 데이터 조회 (조인 없이)
      // 컬럼명: assigned_zone_id (zone_id 아님)
      let query = supabase
        .from('staff')
        .select(`
          id,
          staff_code,
          staff_name,
          role,
          assigned_zone_id,
          avatar_url,
          avatar_position,
          avatar_rotation,    
          avatar_scale,       
          is_active
        `)
        .eq('store_id', storeId);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: staffData, error: staffError } = await query;

      if (staffError) {
        console.error('[useStaffData] Staff query error:', staffError);
        throw new Error(staffError.message);
      }

      // 2단계: zones_dim에서 구역 이름 조회 (별도 쿼리)
      const zoneIds = (staffData || [])
        .map((s: any) => s.assigned_zone_id)
        .filter((id: any) => id != null);

      let zoneMap: Record<string, string> = {};

      if (zoneIds.length > 0) {
        const { data: zonesData } = await supabase
          .from('zones_dim')
          .select('id, zone_name')
          .in('id', zoneIds);

        if (zonesData) {
          zoneMap = zonesData.reduce((acc: Record<string, string>, z: any) => {
            acc[z.id] = z.zone_name;
            return acc;
          }, {});
        }
      }

      // 데이터 변환
      const staffMembers: StaffMember[] = (staffData || []).map((row: any) => ({
        id: row.id,
        staff_code: row.staff_code || '',
        staff_name: row.staff_name || '직원',
        role: row.role || 'staff',
        zone_id: row.assigned_zone_id, // assigned_zone_id를 zone_id로 매핑
        zone_name: row.assigned_zone_id ? (zoneMap[row.assigned_zone_id] || '미배정') : '미배정',
        avatar_url: row.avatar_url,
        avatar_position: parsePosition(row.avatar_position),
        avatar_rotation: parsePosition(row.avatar_rotation),
        avatar_scale: parsePosition(row.avatar_scale),
        is_active: row.is_active ?? true,
      }));

      setStaff(staffMembers);
    } catch (err) {
      console.error('[useStaffData] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staff data'));
      setStaff([]); // 에러 시 빈 배열 설정
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [storeId, activeOnly]);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
  };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function parsePosition(position: any): { x: number; y: number; z: number } {
  if (!position) {
    return { x: 0, y: 0, z: 0 };
  }

  // JSONB 필드는 이미 객체로 파싱됨
  if (typeof position === 'object') {
    return {
      x: Number(position.x) || 0,
      y: Number(position.y) || 0,
      z: Number(position.z) || 0,
    };
  }

  // 문자열인 경우 파싱
  if (typeof position === 'string') {
    try {
      const parsed = JSON.parse(position);
      return {
        x: Number(parsed.x) || 0,
        y: Number(parsed.y) || 0,
        z: Number(parsed.z) || 0,
      };
    } catch {
      return { x: 0, y: 0, z: 0 };
    }
  }

  return { x: 0, y: 0, z: 0 };
}

export default useStaffData;
