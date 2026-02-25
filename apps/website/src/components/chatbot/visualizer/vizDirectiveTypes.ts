/**
 * NEURALTWIN Store Visualizer - VizDirective Types
 *
 * AI 응답이 비주얼라이저에 전달하는 지시 데이터 타입
 */

// ═══════════════════════════════════════════
//  카메라 상태 타입
// ═══════════════════════════════════════════

export type VizState = 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';

// ═══════════════════════════════════════════
//  어노테이션 타입
// ═══════════════════════════════════════════

export interface VizAnnotation {
  zone: string;           // STORE.zones의 키 (예: "decompression", "powerWall")
  text: string;           // 어노테이션 텍스트 (줄바꿈 허용: "비워두기!\n상품 배치 ✕")
  color: string;          // CSS hex 색상 (예: "#ff6b00")
}

// ═══════════════════════════════════════════
//  KPI 타입
// ═══════════════════════════════════════════

export interface VizKPI {
  label: string;          // "평균 전환율"
  value: string;          // "18%"
  sub: string;            // "패션 리테일"
  alert?: boolean;        // 경고 스타일 (빨간색 강조)
  highlight?: boolean;    // 포인트 스타일 (보라색 강조)
  gauge?: number;         // 0~100 게이지 (퍼센트 값이면 자동 표시)
  trend?: 'up' | 'down' | 'flat'; // 트렌드 화살표
}

// ═══════════════════════════════════════════
//  고객 여정 단계
// ═══════════════════════════════════════════

export type CustomerStage = 'entry' | 'exploration' | 'purchase';

// ═══════════════════════════════════════════
//  파라메트릭 스토어 설정 (PHASE H)
// ═══════════════════════════════════════════

/**
 * 매장 크기 파라미터
 * AI가 사용자 언급 (예: "200평 매장")에 따라 동적 생성
 */
export interface StoreParams {
  /** 매장 가로 크기 (m) - 기본값 20 */
  storeWidth?: number;

  /** 매장 세로 크기 (m) - 기본값 20 */
  storeDepth?: number;

  /** 매장 높이 (m) - 기본값 4 */
  storeHeight?: number;

  /** 피팅룸 개수 - 기본값 4 */
  fittingRoomCount?: number;
}

/**
 * 존별 크기 조정 배율
 * 특정 존이 크거나 작다고 언급 시 적용
 */
export interface ZoneScale {
  [zoneId: string]: {
    /** 가로 배율 (0.5 ~ 2.0) */
    scaleX?: number;
    /** 세로 배율 (0.5 ~ 2.0) */
    scaleZ?: number;
  };
}

// ═══════════════════════════════════════════
//  동적 존 정의 (AI 생성)
// ═══════════════════════════════════════════

/**
 * AI가 대화 맥락에 맞게 동적으로 생성하는 존 정의
 * 패션 매장뿐 아니라 F&B, 화장품, 전자제품 등 모든 업종에 대응
 */
/** 존 용도 타입 — 가구 생성 및 시각 표현 제어에 사용 */
export type ZoneType = 'display' | 'entrance' | 'corridor' | 'checkout' | 'seating' | 'storage' | 'experience';

export interface DynamicZone {
  /** 존 고유 ID (예: "entrance", "kitchen", "display") */
  id: string;
  /** 존 라벨 (한국어, 예: "쿠키 진열대") */
  label: string;
  /** 중심 X좌표 (-10 ~ 10) */
  x: number;
  /** 중심 Z좌표 (-10 ~ 10) */
  z: number;
  /** 가로 크기 (미터) */
  w: number;
  /** 세로 크기 (미터) */
  d: number;
  /** CSS hex 색상 (예: "#0ea5e9") */
  color: string;
  /** 존 용도 타입 — entrance/corridor는 가구 미생성 */
  type?: ZoneType;
}

// ═══════════════════════════════════════════
//  메인 VizDirective 타입
// ═══════════════════════════════════════════

/** 카메라 앵글 힌트 */
export type CameraAngle = 'front' | 'side' | 'top' | 'perspective';

export interface VizDirective {
  /** 카메라 프리셋 (overview, entry, exploration, purchase, topdown) */
  vizState: VizState;

  /** 하이라이트할 존 ID 배열 */
  highlights: string[];

  /** AI가 대화 맥락에 맞게 생성한 동적 존 배열 */
  zones?: DynamicZone[];

  /** 존 위 어노테이션 (선택) */
  annotations?: VizAnnotation[];

  /** 고객 동선 표시 여부 또는 존 ID 순서 배열 (비선형 동선) */
  flowPath?: boolean | string[];

  /** KPI 바 데이터 (선택) */
  kpis?: VizKPI[];

  /** 단계 프로그레스 (선택) */
  stage?: CustomerStage;

  /** 파라메트릭 매장 설정 (PHASE H) */
  storeParams?: StoreParams;

  /** 존별 크기 조정 (PHASE H) */
  zoneScale?: ZoneScale;

  /** 카메라가 포커싱할 존 ID (동적 카메라) */
  focusZone?: string;

  /** 카메라 앵글 힌트 (focusZone과 함께 사용) */
  cameraAngle?: CameraAngle;

  /** 전체 교체 vs 부분 업데이트 */
  updateMode?: 'full' | 'partial';

  /** 변경된 존 ID 목록 (애니메이션 대상) */
  changedZones?: string[];

  /** Before/After 비교 모드 (A-8) */
  compare?: {
    /** 비교 라벨 (예: "현재 레이아웃") */
    beforeLabel?: string;
    /** 비교 라벨 (예: "제안 레이아웃") */
    afterLabel?: string;
    /** Before 존 배열 (After는 메인 zones 사용) */
    beforeZones: DynamicZone[];
  };
}

// ═══════════════════════════════════════════
//  기본값 / 팩토리 함수
// ═══════════════════════════════════════════

/**
 * 기본 VizDirective 생성
 */
export function createDefaultVizDirective(): VizDirective {
  return {
    vizState: 'overview',
    highlights: [],
    flowPath: false
  };
}

/**
 * VizDirective 병합 (부분 업데이트용)
 */
export function mergeVizDirective(
  current: VizDirective,
  updates: Partial<VizDirective>
): VizDirective {
  return {
    ...current,
    ...updates,
    // 배열 필드: 새 값이 있으면 교체, 없으면 기존 유지 (undefined로 덮어쓰기 방지)
    highlights: updates.highlights ?? current.highlights,
    annotations: updates.annotations ?? current.annotations,
    kpis: updates.kpis ?? current.kpis,
    zones: updates.zones ?? current.zones,
    compare: updates.compare ?? current.compare,
  };
}

// ═══════════════════════════════════════════
//  검증 함수
// ═══════════════════════════════════════════

const VALID_VIZ_STATES: VizState[] = ['overview', 'entry', 'exploration', 'purchase', 'topdown'];
const VALID_STAGES: CustomerStage[] = ['entry', 'exploration', 'purchase'];

/**
 * VizDirective 유효성 검증
 */
export function isValidVizDirective(obj: unknown): obj is VizDirective {
  if (!obj || typeof obj !== 'object') return false;

  const directive = obj as Record<string, unknown>;

  // vizState 필수
  if (!directive.vizState || !VALID_VIZ_STATES.includes(directive.vizState as VizState)) {
    return false;
  }

  // highlights 필수 (빈 배열 허용)
  if (!Array.isArray(directive.highlights)) {
    return false;
  }

  // stage 검증 (있으면)
  if (directive.stage && !VALID_STAGES.includes(directive.stage as CustomerStage)) {
    return false;
  }

  return true;
}

/**
 * AI 응답에서 VizDirective JSON 파싱 시도
 * ```viz ... ``` 블록 또는 일반 JSON 파싱
 */
export function parseVizDirectiveFromResponse(response: string): VizDirective | null {
  // 1. ```viz 블록 찾기
  const vizBlockMatch = response.match(/```viz\s*\n?([\s\S]*?)\n?```/);
  if (vizBlockMatch) {
    try {
      const parsed = JSON.parse(vizBlockMatch[1].trim());
      if (isValidVizDirective(parsed)) {
        return parsed;
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  // 2. 일반 JSON 블록 찾기 (vizState 포함된)
  const jsonMatch = response.match(/\{[\s\S]*?"vizState"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (isValidVizDirective(parsed)) {
        return parsed;
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  return null;
}
