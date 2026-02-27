/**
 * 고객 아바타 타입 정의
 * Instanced Rendering을 위한 데이터 구조
 */

export interface CustomerAvatar {
  id: string;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; z: number }; // 이동 속도
  status: 'browsing' | 'purchasing' | 'leaving';
  timestamp?: number;
  /** 3D 아바타 모델 URL (GLB) */
  avatar_url?: string;
  /** 아바타 타입 (vip, regular, new, dormant 등) */
  avatar_type?: string;
}

export interface CustomerAvatarOverlayProps {
  customers: CustomerAvatar[];
  maxInstances?: number; // 최대 인스턴스 수 (기본: 200)
  animationSpeed?: number; // 애니메이션 속도 (기본: 1.0)
  showTrails?: boolean; // 이동 경로 표시 여부
}

export type CustomerStatus = 'browsing' | 'purchasing' | 'leaving';

export interface AvatarColors {
  browsing: string;   // 탐색 중 - 파란색
  purchasing: string; // 구매 중 - 초록색
  leaving: string;    // 퇴장 중 - 회색
}
