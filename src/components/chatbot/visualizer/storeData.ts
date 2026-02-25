/**
 * NEURALTWIN Store Visualizer - Store Layout Data
 *
 * 매장 구조, 존, 가구, 카메라 프리셋 정의
 * wireframe-3d-viz.jsx 레퍼런스 기반
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface ZoneConfig {
  x: number;              // 중심 x좌표
  z: number;              // 중심 z좌표
  w: number;              // 가로 크기
  d: number;              // 세로 크기
  color: number;          // Three.js 색상 (hex number)
  label: string;          // 한국어\n영어 라벨
}

export interface FurnitureConfig {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  label: string;
}

export interface CameraPreset {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface StoreConfig {
  width: number;
  depth: number;
  height: number;
  zones: Record<string, ZoneConfig>;
}

// ═══════════════════════════════════════════
//  매장 레이아웃 상수
// ═══════════════════════════════════════════

export const STORE: StoreConfig = {
  width: 20,
  depth: 20,
  height: 4,
  zones: {
    decompression: {
      x: 0,
      z: 8,
      w: 8,
      d: 3,
      color: 0xff6b00,  // 주황색 (경고)
      label: "감압 구간\nDecompression"
    },
    powerWall: {
      x: 7,
      z: 5,
      w: 4,
      d: 5,
      color: 0x22c55e,  // 녹색 (주목)
      label: "파워 월\nPower Wall"
    },
    fittingRoom: {
      x: -6,
      z: -4,
      w: 5,
      d: 4,
      color: 0x8b5cf6,  // 보라색 (전환)
      label: "피팅룸\nFitting Room"
    },
    clothingMain: {
      x: 0,
      z: 0,
      w: 10,
      d: 8,
      color: 0x0ea5e9,  // 시안색 (메인)
      label: "의류 메인\nClothing Main"
    },
    checkout: {
      x: 6,
      z: 7,
      w: 4,
      d: 3,
      color: 0xef4444,  // 빨간색 (결제)
      label: "계산대\nCheckout"
    },
    accessory: {
      x: -6,
      z: 4,
      w: 4,
      d: 4,
      color: 0xf59e0b,  // 앰버색 (액세서리)
      label: "액세서리\nAccessory"
    }
  }
};

// ═══════════════════════════════════════════
//  카메라 프리셋
// ═══════════════════════════════════════════

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  overview: {
    pos: [22, 20, 22],
    target: [0, 0, 0],
    fov: 50
  },
  entry: {
    pos: [0, 18, 20],
    target: [0, 0, 4],
    fov: 45
  },
  exploration: {
    pos: [-18, 12, -8],
    target: [-4, 1, -4],
    fov: 50
  },
  purchase: {
    pos: [14, 10, 16],
    target: [6, 1, 6],
    fov: 48
  },
  topdown: {
    pos: [0, 28, 0.1],
    target: [0, 0, 0],
    fov: 42
  }
};

// ═══════════════════════════════════════════
//  가구 데이터
// ═══════════════════════════════════════════

export const FURNITURE_DATA: FurnitureConfig[] = [
  // 행거 (Clothing Main 영역)
  { x: -3, z: 2, w: 3, h: 1.8, d: 0.6, label: "행거 1" },
  { x: 0, z: 2, w: 3, h: 1.8, d: 0.6, label: "행거 2" },
  { x: 3, z: 2, w: 3, h: 1.8, d: 0.6, label: "행거 3" },
  { x: -3, z: -2, w: 3, h: 1.8, d: 0.6, label: "행거 4" },
  { x: 0, z: -2, w: 3, h: 1.8, d: 0.6, label: "행거 5" },
  { x: 3, z: -2, w: 3, h: 1.8, d: 0.6, label: "행거 6" },

  // 테이블 (중앙 디스플레이)
  { x: 0, z: 0, w: 2, h: 0.9, d: 1.2, label: "디스플레이 테이블" },

  // 마네킹 (Power Wall 근처)
  { x: 6, z: 3, w: 0.5, h: 1.7, d: 0.3, label: "마네킹 1" },
  { x: 7.5, z: 3, w: 0.5, h: 1.7, d: 0.3, label: "마네킹 2" },

  // 피팅룸 부스
  { x: -7, z: -3, w: 1.5, h: 2.2, d: 1.5, label: "피팅룸 1" },
  { x: -5, z: -3, w: 1.5, h: 2.2, d: 1.5, label: "피팅룸 2" },
  { x: -7, z: -5, w: 1.5, h: 2.2, d: 1.5, label: "피팅룸 3" },
  { x: -5, z: -5, w: 1.5, h: 2.2, d: 1.5, label: "피팅룸 4" },

  // 계산대
  { x: 6, z: 7, w: 2, h: 1.1, d: 0.8, label: "계산대" },
  { x: 6.5, z: 8, w: 0.4, h: 1.3, d: 0.4, label: "POS" },

  // 액세서리 진열대
  { x: -6, z: 3, w: 1.5, h: 1.4, d: 1.5, label: "액세서리 1" },
  { x: -6, z: 5, w: 1.5, h: 1.4, d: 1.5, label: "액세서리 2" }
];

// ═══════════════════════════════════════════
//  고객 동선 경로 포인트
// ═══════════════════════════════════════════

export const FLOW_CURVE_POINTS: [number, number, number][] = [
  [0, 0.3, 9.5],         // 입구
  [0, 0.3, 7],           // 감압구간 통과
  [4, 0.3, 5],           // 파워월로 우회전
  [6, 0.3, 3],           // 파워월 탐색
  [3, 0.3, 0],           // 메인 영역
  [-2, 0.3, -1],         // 중앙 탐색
  [-5, 0.3, -3],         // 피팅룸 방향
  [-6, 0.3, -4],         // 피팅룸 도착
  [-4, 0.3, 0],          // 돌아오기
  [2, 0.3, 4],           // 계산대 방향
  [5, 0.3, 6],           // 계산대 근처
  [6, 0.3, 7]            // 계산대 도착
];

// ═══════════════════════════════════════════
//  색상 팔레트 (NEURALTWIN 브랜딩)
// ═══════════════════════════════════════════

export const COLORS = {
  background: 0x0a0a0a,    // 순검정 (chat.css 일치)
  grid: {
    primary: 0x222222,     // 그리드 약간 밝게
    secondary: 0x181818
  },
  walls: 0x5a5a5a,         // 외벽 선명도 대폭 향상
  entrance: 0x00d4ff,      // 입구 시안 더 밝게
  furniture: 0x5e5e5e,     // 가구 선명도 추가 향상
  particle: 0x555555,      // 파티클 밝게
  fog: 0x0a0a0a
};

// ═══════════════════════════════════════════
//  존 라벨 (한국어)
// ═══════════════════════════════════════════

export const ZONE_LABELS_KO: Record<string, string> = {
  decompression: "감압 구간",
  powerWall: "파워 월",
  fittingRoom: "피팅룸",
  clothingMain: "의류 메인",
  checkout: "계산대",
  accessory: "액세서리"
};

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

/**
 * 존 ID로 존 설정 가져오기
 */
export function getZoneConfig(zoneId: string): ZoneConfig | undefined {
  return STORE.zones[zoneId];
}

/**
 * 존 색상을 CSS hex 문자열로 변환
 */
export function getZoneColorHex(zoneId: string): string {
  const zone = STORE.zones[zoneId];
  if (!zone) return "#64748b";
  return `#${zone.color.toString(16).padStart(6, "0")}`;
}

/**
 * 모든 존 ID 배열
 */
export function getAllZoneIds(): string[] {
  return Object.keys(STORE.zones);
}
