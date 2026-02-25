/**
 * CustomerAvatarsOverlay.tsx
 *
 * 실시간 고객 시뮬레이션 오버레이
 * - useCustomerSimulation 훅 사용
 * - 확률 기반 존 간 이동 시각화
 * - 고객 타입별 색상 구분
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCustomerSimulation } from '../hooks/useCustomerSimulation';
import type { SimulatedCustomer } from '../simulation/CustomerSimulation';

interface CustomerAvatarsOverlayProps {
  visible: boolean;
  storeId: string;
  showLabels?: boolean;
  autoStart?: boolean;
  maxCustomers?: number;
  spawnInterval?: number;
}

export const CustomerAvatarsOverlay: React.FC<CustomerAvatarsOverlayProps> = ({
  visible,
  storeId,
  showLabels = false,
  autoStart = true,
  maxCustomers = 20,
  spawnInterval = 5,
}) => {
  const { state, isLoading, controls } = useCustomerSimulation({
    storeId,
    autoStart: visible && autoStart,
    maxCustomers,
    spawnInterval,
    enabled: visible,
  });

  // visible이 변경될 때 시뮬레이션 시작/정지
  React.useEffect(() => {
    if (visible && autoStart) {
      controls.start();
    } else if (!visible) {
      controls.pause();
    }
  }, [visible, autoStart, controls]);

  if (!visible) return null;

  if (isLoading) {
    return (
      <Html center>
        <div className="px-4 py-2 bg-black/80 rounded-lg text-sm text-white">
          시뮬레이션 데이터 로딩 중...
        </div>
      </Html>
    );
  }

  if (!state || state.customers.length === 0) {
    return null;
  }

  // 🆕 exiting 상태 제외하고 유효한 고객만 필터링 (고스트 아바타 방지)
  const activeCustomers = state.customers.filter(
    (c) => c.state !== 'exiting' && c.position && isValidPosition(c.position)
  );

  const returningCount = state.customers.filter((c) => c.state === 'returning').length;

  return (
    <group name="customer-avatars-overlay">
      {/* 통계 표시 */}
      <Html position={[0, 3, 0]} center>
        <div className="px-3 py-2 bg-black/80 rounded-lg text-xs text-white border border-white/20 pointer-events-none">
          <div className="flex items-center gap-3">
            <span>👥 {activeCustomers.length}명 활동 중</span>
            {returningCount > 0 && <span>🚶 {returningCount}명 퇴장 중</span>}
            <span>📊 총 {state.stats.totalCustomers}명</span>
            <span>🚪 {state.stats.exitedCustomers}명 퇴장</span>
            {state.stats.avgDwellTime > 0 && (
              <span>⏱️ 평균 {Math.round(state.stats.avgDwellTime)}초</span>
            )}
          </div>
        </div>
      </Html>

      {/* 고객 아바타들 - 유효한 고객만 렌더링 */}
      {activeCustomers.map((customer) => (
        <CustomerAvatar
          key={customer.id}
          customer={customer}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
};

// 🆕 위치 유효성 검사 (고스트 아바타 방지)
function isValidPosition(position: THREE.Vector3): boolean {
  if (!position) return false;
  const x = position.x;
  const z = position.z;
  // NaN, Infinity 체크 및 범위 검증
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    Math.abs(x) < 1000 &&
    Math.abs(z) < 1000
  );
}

// ===== 개별 고객 아바타 =====
interface CustomerAvatarProps {
  customer: SimulatedCustomer;
  showLabel: boolean;
}

const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  customer,
  showLabel,
}) => {
  // 아바타 타입에 따른 색상
  const color = useMemo(() => getAvatarColor(customer.avatarType), [customer.avatarType]);

  // 상태에 따른 투명도 (returning은 약간 더 투명하게)
  const opacity = customer.state === 'walking' ? 0.8 : customer.state === 'returning' ? 0.6 : 1;

  // 이동 방향 계산 (walking, returning 모두 적용)
  const direction = useMemo(() => {
    if ((customer.state === 'walking' || customer.state === 'returning') && customer.targetPosition) {
      return Math.atan2(
        customer.targetPosition.x - customer.position.x,
        customer.targetPosition.z - customer.position.z
      );
    }
    return 0;
  }, [customer.state, customer.targetPosition, customer.position]);

  return (
    <group position={[customer.position.x, 0, customer.position.z]}>
      {/* 캡슐 형태의 몸체 */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 머리 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 바닥 인디케이터 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 이동 방향 표시 (걷는 중 또는 돌아가는 중일 때) */}
      {(customer.state === 'walking' || customer.state === 'returning') && customer.targetPosition && (
        <mesh
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, -direction]}
        >
          <coneGeometry args={[0.15, 0.4, 8]} />
          <meshBasicMaterial
            color={customer.state === 'returning' ? '#f97316' : color}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* 상태 표시 */}
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={getStateColor(customer.state)} />
      </mesh>

      {/* 라벨 */}
      {showLabel && (
        <Html position={[0, 2.2, 0]} center distanceFactor={15}>
          <div className="px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white whitespace-nowrap pointer-events-none">
            <div>{formatAvatarType(customer.avatarType)}</div>
            <div className="text-white/60">{getStateLabel(customer.state)}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ===== 유틸리티 함수들 =====

// 아바타 타입별 색상
function getAvatarColor(avatarType: string): string {
  const colors: Record<string, string> = {
    vip_male: '#fbbf24',      // 금색
    vip_female: '#f59e0b',
    regular_male: '#3b82f6',  // 파랑
    regular_female: '#60a5fa',
    new_male: '#22c55e',      // 초록
    new_female: '#4ade80',
    dormant_male: '#6b7280',  // 회색
    dormant_female: '#9ca3af',
    teen_male: '#a855f7',     // 보라
    teen_female: '#c084fc',
    senior_male: '#78716c',   // 갈색
    senior_female: '#a8a29e',
  };

  return colors[avatarType] || '#6b7280';
}

// 상태별 색상
function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    browsing: '#22c55e',  // 초록 - 둘러보는 중
    walking: '#3b82f6',   // 파랑 - 이동 중
    idle: '#f59e0b',      // 노랑 - 대기 중
    returning: '#f97316', // 🆕 주황 - 입구로 돌아가는 중
    exiting: '#ef4444',   // 빨강 - 퇴장
  };

  return colors[state] || '#6b7280';
}

// 상태 라벨
function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    browsing: '둘러보는 중',
    walking: '이동 중',
    idle: '대기 중',
    returning: '퇴장 중', // 🆕
    exiting: '퇴장 완료',
  };

  return labels[state] || state;
}

// 아바타 타입 포맷팅
function formatAvatarType(type: string): string {
  const labels: Record<string, string> = {
    vip_male: 'VIP 남성',
    vip_female: 'VIP 여성',
    regular_male: '일반 남성',
    regular_female: '일반 여성',
    new_male: '신규 남성',
    new_female: '신규 여성',
    dormant_male: '휴면 남성',
    dormant_female: '휴면 여성',
    teen_male: '청소년 남성',
    teen_female: '청소년 여성',
    senior_male: '시니어 남성',
    senior_female: '시니어 여성',
  };

  return labels[type] || type.replace('_', ' ');
}

export default CustomerAvatarsOverlay;
