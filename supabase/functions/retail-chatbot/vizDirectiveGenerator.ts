/**
 * NEURALTWIN VizDirective Generator
 *
 * topicRouter의 분류 결과를 기반으로 VizDirective 생성
 * Deno 호환 모듈
 */

// ═══════════════════════════════════════════
//  타입 정의 (프론트엔드와 동일 구조)
// ═══════════════════════════════════════════

export type VizState = 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';
export type CustomerStage = 'entry' | 'exploration' | 'purchase';

export interface VizAnnotation {
  zone: string;
  text: string;
  color: string;
}

export interface VizKPI {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  highlight?: boolean;
}

export interface DynamicZone {
  id: string;
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

export interface ZoneScale {
  [zoneId: string]: {
    scaleX?: number;
    scaleZ?: number;
  };
}

export interface VizDirective {
  vizState: VizState;
  highlights: string[];
  zones?: DynamicZone[];
  annotations?: VizAnnotation[];
  flowPath?: boolean;
  kpis?: VizKPI[];
  stage?: CustomerStage;
  zoneScale?: ZoneScale;
}

// ═══════════════════════════════════════════
//  업종별 기본 존 (폴백용)
// ═══════════════════════════════════════════

const DEFAULT_FASHION_ZONES: DynamicZone[] = [
  { id: 'decompression', label: '감압 구간', x: 0, z: 8, w: 8, d: 3, color: '#ff6b00' },
  { id: 'powerWall', label: '파워 월', x: 7, z: 5, w: 4, d: 5, color: '#22c55e' },
  { id: 'clothingMain', label: '의류 메인', x: 0, z: 0, w: 10, d: 8, color: '#0ea5e9' },
  { id: 'fittingRoom', label: '피팅룸', x: -6, z: -4, w: 5, d: 4, color: '#8b5cf6' },
  { id: 'checkout', label: '계산대', x: 6, z: 7, w: 4, d: 3, color: '#ef4444' },
  { id: 'accessory', label: '액세서리', x: -6, z: 4, w: 4, d: 4, color: '#f59e0b' },
];

const DEFAULT_CAFE_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 6, d: 3, color: '#ff6b00' },
  { id: 'order_counter', label: '주문 카운터', x: 5, z: 4, w: 5, d: 4, color: '#ef4444' },
  { id: 'kitchen', label: '주방/바', x: 7, z: 0, w: 4, d: 6, color: '#8b5cf6' },
  { id: 'seating_main', label: '좌석 구역', x: -2, z: 0, w: 10, d: 8, color: '#0ea5e9' },
  { id: 'takeout', label: '테이크아웃', x: -6, z: 7, w: 4, d: 3, color: '#22c55e' },
];

const DEFAULT_CONVENIENCE_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 6, d: 3, color: '#ff6b00' },
  { id: 'beverage', label: '음료/냉장', x: 7, z: 2, w: 4, d: 8, color: '#0ea5e9' },
  { id: 'snack', label: '간편식/스낵', x: 0, z: 2, w: 6, d: 6, color: '#22c55e' },
  { id: 'daily', label: '생활용품', x: -6, z: 2, w: 4, d: 6, color: '#8b5cf6' },
  { id: 'checkout', label: '계산대', x: -5, z: 7, w: 5, d: 3, color: '#ef4444' },
];

const DEFAULT_GROCERY_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 8, d: 3, color: '#ff6b00' },
  { id: 'produce', label: '농산/신선', x: -5, z: 4, w: 6, d: 5, color: '#22c55e' },
  { id: 'deli', label: '델리/정육', x: 5, z: 4, w: 6, d: 5, color: '#f59e0b' },
  { id: 'grocery_main', label: '가공식품', x: 0, z: -2, w: 12, d: 6, color: '#0ea5e9' },
  { id: 'beverage', label: '음료', x: 7, z: -2, w: 4, d: 6, color: '#8b5cf6' },
  { id: 'checkout', label: '계산대', x: -6, z: 7, w: 5, d: 3, color: '#ef4444' },
];

const DEFAULT_BEAUTY_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 8, d: 3, color: '#ff6b00' },
  { id: 'promotion', label: '프로모션/신상', x: 5, z: 5, w: 5, d: 4, color: '#22c55e' },
  { id: 'testerBar', label: '테스터 바', x: -4, z: 4, w: 5, d: 4, color: '#ec4899' },
  { id: 'skincare', label: '스킨케어', x: -4, z: -1, w: 6, d: 5, color: '#0ea5e9' },
  { id: 'makeup', label: '메이크업', x: 4, z: -1, w: 6, d: 5, color: '#8b5cf6' },
  { id: 'checkout', label: '계산대', x: 0, z: -6, w: 6, d: 3, color: '#ef4444' },
];

const DEFAULT_ELECTRONICS_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 8, d: 3, color: '#ff6b00' },
  { id: 'mobile', label: '모바일/태블릿', x: -4, z: 4, w: 5, d: 5, color: '#0ea5e9' },
  { id: 'laptop', label: '노트북/PC', x: 4, z: 4, w: 5, d: 5, color: '#22c55e' },
  { id: 'experience', label: '체험존', x: 0, z: 0, w: 8, d: 4, color: '#8b5cf6' },
  { id: 'accessory', label: '액세서리', x: -5, z: -4, w: 5, d: 4, color: '#f59e0b' },
  { id: 'service', label: 'AS/상담', x: 5, z: -4, w: 5, d: 4, color: '#ec4899' },
  { id: 'checkout', label: '계산대', x: 0, z: -7, w: 5, d: 3, color: '#ef4444' },
];

const DEFAULT_POPUP_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 6, d: 3, color: '#ff6b00' },
  { id: 'exhibition', label: '전시 구역', x: -4, z: 3, w: 6, d: 6, color: '#0ea5e9' },
  { id: 'experience', label: '체험존', x: 4, z: 3, w: 6, d: 6, color: '#8b5cf6' },
  { id: 'photo_zone', label: '포토존', x: -4, z: -3, w: 5, d: 4, color: '#f59e0b' },
  { id: 'sales', label: '판매 구역', x: 4, z: -3, w: 5, d: 4, color: '#22c55e' },
];

const DEFAULT_GENERAL_ZONES: DynamicZone[] = [
  { id: 'entrance', label: '입구', x: 0, z: 8, w: 6, d: 3, color: '#ff6b00' },
  { id: 'display_1', label: '진열 구역 1', x: -4, z: 2, w: 6, d: 6, color: '#0ea5e9' },
  { id: 'display_2', label: '진열 구역 2', x: 4, z: 2, w: 6, d: 6, color: '#22c55e' },
  { id: 'checkout', label: '카운터', x: 0, z: 7, w: 5, d: 3, color: '#ef4444' },
];

const DEFAULT_ZONES_BY_INDUSTRY: Record<string, DynamicZone[]> = {
  fashion: DEFAULT_FASHION_ZONES,
  beauty: DEFAULT_BEAUTY_ZONES,
  electronics: DEFAULT_ELECTRONICS_ZONES,
  cafe: DEFAULT_CAFE_ZONES,
  convenience: DEFAULT_CONVENIENCE_ZONES,
  grocery: DEFAULT_GROCERY_ZONES,
  popup: DEFAULT_POPUP_ZONES,
  general: DEFAULT_GENERAL_ZONES,
};

/**
 * 토픽 분류 + 메시지 내 브랜드/업종 키워드로부터 업종 추론
 */
function detectIndustry(topicCategory: string, message?: string): string {
  const msg = (message || '').toLowerCase();

  // 메시지 기반 업종 추론 (브랜드/키워드 우선)
  if (/올리브영|세포라|랄라블라|이니스프리|뷰티|화장품|코스메틱|드럭스토어|drug\s*store|스킨케어|메이크업/.test(msg)) {
    return 'beauty';
  }
  if (/삼성|애플|하이마트|전자|가전|일렉|전자제품|electronics/.test(msg)) {
    return 'electronics';
  }
  if (/카페|커피|베이커리|디저트|f&b/.test(msg)) return 'cafe';
  if (/편의점|gs25|cu|세븐일레븐|이마트24/.test(msg)) return 'convenience';
  if (/마트|식료품|슈퍼|grocery|이마트|홈플러스|코스트코/.test(msg)) return 'grocery';
  if (/팝업|pop-?up/.test(msg)) return 'popup';

  // 토픽 기반 2차 추론
  if (/vmd|layout|staff|pricing/.test(topicCategory)) return 'fashion';
  if (/inventory|supply/.test(topicCategory)) return 'grocery';

  return 'general';
}

// ═══════════════════════════════════════════
//  토픽→VizDirective 매핑
// ═══════════════════════════════════════════

interface TopicClassification {
  primaryTopic: string;
  confidence: number;
}

/**
 * 토픽 분류 결과와 턴 수를 기반으로 VizDirective 생성
 */
export function generateVizDirective(
  classification: TopicClassification,
  turnCount: number,
  message?: string
): VizDirective {
  const { primaryTopic } = classification;

  // 항상 vizDirective 생성 (모든 응답에서 zone 인터랙션 활성화)
  const result = generateTopicVizDirective(primaryTopic, turnCount);

  // 토픽 기반 fallback: 업종에 맞는 기본 존 포함
  if (result && !result.zones) {
    const industry = detectIndustry(primaryTopic, message);
    result.zones = DEFAULT_ZONES_BY_INDUSTRY[industry] || DEFAULT_GENERAL_ZONES;
  }

  // null이면 기본 overview 반환
  if (!result) {
    return {
      vizState: 'overview',
      highlights: ['decompression', 'powerWall', 'clothingMain', 'fittingRoom', 'checkout', 'accessory'],
      flowPath: false,
      zones: DEFAULT_FASHION_ZONES,
      kpis: [
        { label: '전환율', value: '15-25%', sub: '패션 평균' },
        { label: '객단가', value: '₩85,000', sub: '업계 평균' }
      ]
    };
  }

  return result;
}

function generateTopicVizDirective(
  primaryTopic: string,
  turnCount: number
): VizDirective | null {
  // 토픽별 매핑 — zones 포함하여 반환 (AI가 동적 생성하지 않은 경우 fallback)
  switch (primaryTopic) {
    // ─────────────────────────────────────────
    // 전환율 최적화 (대화 진행에 따라 단계 변화)
    // ─────────────────────────────────────────
    case 'sales_conversion':
      return getConversionVizDirective(turnCount);

    // ─────────────────────────────────────────
    // 매장 레이아웃 & 고객 동선
    // ─────────────────────────────────────────
    case 'layout_flow':
      return {
        vizState: 'topdown',
        highlights: ['decompression', 'powerWall', 'clothingMain', 'fittingRoom', 'checkout', 'accessory'],
        flowPath: true,
        kpis: [
          { label: '매장 면적', value: '400㎡', sub: '표준' },
          { label: '존 구성', value: '6개', sub: '권장' },
          { label: '동선 효율', value: '78%', sub: '목표 85%' }
        ],
        zoneScale: {
          decompression: { scaleX: 1.15, scaleZ: 1.15 },
          powerWall: { scaleX: 1.15, scaleZ: 1.15 },
          clothingMain: { scaleX: 1.1, scaleZ: 1.1 },
          fittingRoom: { scaleX: 1.15, scaleZ: 1.15 },
          checkout: { scaleX: 1.15, scaleZ: 1.15 },
          accessory: { scaleX: 1.15, scaleZ: 1.15 }
        }
      };

    // ─────────────────────────────────────────
    // VMD & 디스플레이
    // ─────────────────────────────────────────
    case 'vmd_display':
      return {
        vizState: 'entry',
        highlights: ['powerWall', 'decompression'],
        flowPath: false,
        annotations: [
          { zone: 'powerWall', text: '시즌 주력\n시각적 임팩트', color: '#22c55e' },
          { zone: 'decompression', text: '비워두기\n첫인상 구간', color: '#ff6b00' }
        ],
        kpis: [
          { label: '시선 포착률', value: '3초+', sub: 'VP 기준' },
          { label: 'Golden Zone', value: '120-170cm', sub: '눈높이' }
        ],
        zoneScale: {
          powerWall: { scaleX: 1.5, scaleZ: 1.4 },
          decompression: { scaleX: 1.4, scaleZ: 1.3 },
          clothingMain: { scaleX: 0.8, scaleZ: 0.8 },
          fittingRoom: { scaleX: 0.7, scaleZ: 0.7 },
          checkout: { scaleX: 0.7, scaleZ: 0.7 },
          accessory: { scaleX: 0.8, scaleZ: 0.8 }
        }
      };

    // ─────────────────────────────────────────
    // 고객 분석 & CX
    // ─────────────────────────────────────────
    case 'customer_analytics':
      return getCustomerExperienceVizDirective(turnCount);

    // ─────────────────────────────────────────
    // 인력 생산성
    // ─────────────────────────────────────────
    case 'staff_productivity':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'fittingRoom', 'clothingMain'],
        flowPath: false,
        annotations: [
          { zone: 'checkout', text: '필수 1명\n피크시 2명', color: '#ef4444' },
          { zone: 'fittingRoom', text: '상시 1명', color: '#8b5cf6' },
          { zone: 'clothingMain', text: '유동 배치', color: '#0ea5e9' }
        ],
        kpis: [
          { label: 'SPLH', value: '$125', sub: '목표 $150' },
          { label: '인건비율', value: '12%', sub: '목표 10%' },
          { label: '커버리지', value: '85%', sub: '적정' }
        ],
        zoneScale: {
          checkout: { scaleX: 1.4, scaleZ: 1.4 },
          fittingRoom: { scaleX: 1.3, scaleZ: 1.3 },
          clothingMain: { scaleX: 1.2, scaleZ: 1.1 },
          decompression: { scaleX: 0.8, scaleZ: 0.8 },
          powerWall: { scaleX: 0.8, scaleZ: 0.8 },
          accessory: { scaleX: 0.8, scaleZ: 0.8 }
        }
      };

    // ─────────────────────────────────────────
    // 가격 & 프로모션
    // ─────────────────────────────────────────
    case 'pricing_promotion':
      return {
        vizState: 'purchase',
        highlights: ['checkout', 'clothingMain'],
        flowPath: false,
        kpis: [
          { label: '평균 객단가', value: '₩85,000', sub: '목표 ₩100K' },
          { label: '마크다운율', value: '25%', sub: '적정' },
          { label: 'UPT', value: '2.3', sub: '목표 2.8' }
        ],
        stage: 'purchase',
        zoneScale: {
          checkout: { scaleX: 1.5, scaleZ: 1.5 },
          clothingMain: { scaleX: 1.2, scaleZ: 1.1 },
          decompression: { scaleX: 0.7, scaleZ: 0.7 },
          powerWall: { scaleX: 0.8, scaleZ: 0.8 },
          fittingRoom: { scaleX: 0.8, scaleZ: 0.8 },
          accessory: { scaleX: 0.8, scaleZ: 0.8 }
        }
      };

    // ─────────────────────────────────────────
    // 재고 & 공급망
    // ─────────────────────────────────────────
    case 'inventory_supply':
      return {
        vizState: 'exploration',
        highlights: ['clothingMain', 'accessory', 'powerWall'],
        flowPath: false,
        kpis: [
          { label: '재고회전율', value: '8회/년', sub: '패션 평균' },
          { label: '품절률', value: '5%', sub: '목표 3%', alert: true },
          { label: 'Sell-Through', value: '72%', sub: '적정' }
        ],
        zoneScale: {
          clothingMain: { scaleX: 1.4, scaleZ: 1.3 },
          accessory: { scaleX: 1.3, scaleZ: 1.3 },
          powerWall: { scaleX: 1.2, scaleZ: 1.2 },
          decompression: { scaleX: 0.7, scaleZ: 0.7 },
          checkout: { scaleX: 0.8, scaleZ: 0.8 },
          fittingRoom: { scaleX: 0.8, scaleZ: 0.8 }
        }
      };

    // ─────────────────────────────────────────
    // 데이터/KPI
    // ─────────────────────────────────────────
    case 'data_kpi':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'decompression', 'fittingRoom'],
        flowPath: true,
        kpis: [
          { label: '전환율', value: '18%', sub: '패션 평균' },
          { label: '객단가', value: '₩85,000', sub: '목표 ₩100K' },
          { label: '체류시간', value: '12분', sub: '목표 15분' }
        ],
        zoneScale: {
          checkout: { scaleX: 1.3, scaleZ: 1.3 },
          decompression: { scaleX: 1.2, scaleZ: 1.2 },
          fittingRoom: { scaleX: 1.2, scaleZ: 1.2 },
          clothingMain: { scaleX: 1.1, scaleZ: 1.1 },
          powerWall: { scaleX: 0.9, scaleZ: 0.9 },
          accessory: { scaleX: 0.9, scaleZ: 0.9 }
        }
      };

    // ─────────────────────────────────────────
    // 디지털 트윈
    // ─────────────────────────────────────────
    case 'digital_twin':
      return {
        vizState: 'topdown',
        highlights: ['clothingMain', 'powerWall', 'fittingRoom'],
        flowPath: true,
        annotations: [
          { zone: 'clothingMain', text: '시뮬레이션\n영역', color: '#0ea5e9' }
        ],
        kpis: [
          { label: '시뮬레이션', value: '가능', sub: '레이아웃' },
          { label: '예상 효과', value: '8-12%', sub: '매출 증가' }
        ],
        zoneScale: {
          clothingMain: { scaleX: 1.5, scaleZ: 1.4 },
          powerWall: { scaleX: 1.2, scaleZ: 1.2 },
          fittingRoom: { scaleX: 1.3, scaleZ: 1.2 },
          decompression: { scaleX: 0.8, scaleZ: 0.8 },
          checkout: { scaleX: 0.8, scaleZ: 0.8 },
          accessory: { scaleX: 0.9, scaleZ: 0.9 }
        }
      };

    // ─────────────────────────────────────────
    // 리테일 테크
    // ─────────────────────────────────────────
    case 'retail_tech':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'clothingMain'],
        flowPath: true,
        kpis: [
          { label: 'RFID 정확도', value: '95%+', sub: '재고' },
          { label: '디지털 사이니지', value: '29%↑', sub: '매출 효과' }
        ],
        zoneScale: {
          checkout: { scaleX: 1.4, scaleZ: 1.3 },
          clothingMain: { scaleX: 1.3, scaleZ: 1.2 },
          decompression: { scaleX: 0.8, scaleZ: 0.8 },
          powerWall: { scaleX: 0.9, scaleZ: 0.9 },
          fittingRoom: { scaleX: 0.8, scaleZ: 0.8 },
          accessory: { scaleX: 0.9, scaleZ: 0.9 }
        }
      };

    // ─────────────────────────────────────────
    // NEURALTWIN 솔루션
    // ─────────────────────────────────────────
    case 'neuraltwin_solution':
      return {
        vizState: 'overview',
        highlights: ['decompression', 'powerWall', 'fittingRoom', 'checkout'],
        flowPath: true,
        annotations: [
          { zone: 'clothingMain', text: 'NEURALTWIN\n실시간 분석', color: '#0ea5e9' }
        ],
        kpis: [
          { label: '매출 증가', value: '8-12%', sub: '기대 효과', highlight: true },
          { label: '인건비 절감', value: '5-10%', sub: '최적화' },
          { label: '리스크 절감', value: '70-80%', sub: '시뮬레이션' }
        ],
        zoneScale: {
          clothingMain: { scaleX: 1.3, scaleZ: 1.3 },
          decompression: { scaleX: 1.2, scaleZ: 1.2 },
          powerWall: { scaleX: 1.2, scaleZ: 1.2 },
          fittingRoom: { scaleX: 1.2, scaleZ: 1.2 },
          checkout: { scaleX: 1.2, scaleZ: 1.2 },
          accessory: { scaleX: 1.1, scaleZ: 1.1 }
        }
      };

    // ─────────────────────────────────────────
    // 일반 리테일 (기본)
    // ─────────────────────────────────────────
    case 'general_retail':
    default:
      return {
        vizState: 'overview',
        highlights: ['decompression', 'powerWall', 'clothingMain', 'fittingRoom', 'checkout', 'accessory'],
        flowPath: false,
        kpis: [
          { label: '전환율', value: '15-25%', sub: '패션 평균' },
          { label: '객단가', value: '₩85,000', sub: '업계 평균' }
        ]
      };
  }
}

// ═══════════════════════════════════════════
//  헬퍼 함수: 전환율 토픽 (대화 진행별 단계)
// ═══════════════════════════════════════════

function getConversionVizDirective(turnCount: number): VizDirective {
  // 첫 1-2턴: 전체 개요 (균일 배율)
  if (turnCount <= 1) {
    return {
      vizState: 'overview',
      highlights: [],
      flowPath: false,
      kpis: [
        { label: '평균 전환율', value: '18%', sub: '패션 리테일' },
        { label: '목표 전환율', value: '25%', sub: '우수 매장' },
        { label: '객단가', value: '₩85,000', sub: '업계 평균' }
      ],
      zoneScale: {
        decompression: { scaleX: 1.1, scaleZ: 1.1 },
        powerWall: { scaleX: 1.1, scaleZ: 1.1 },
        clothingMain: { scaleX: 1.05, scaleZ: 1.05 },
        fittingRoom: { scaleX: 1.05, scaleZ: 1.05 },
        checkout: { scaleX: 1.05, scaleZ: 1.05 },
        accessory: { scaleX: 1.0, scaleZ: 1.0 }
      }
    };
  }

  // 2-3턴: 진입 단계 — 입구/파워월 강조
  if (turnCount <= 3) {
    return {
      vizState: 'entry',
      highlights: ['decompression', 'powerWall'],
      flowPath: true,
      annotations: [
        { zone: 'decompression', text: '비워두기!\n상품 배치 ✕', color: '#ff6b00' },
        { zone: 'powerWall', text: '주력상품\n+고마진 배치', color: '#22c55e' }
      ],
      kpis: [
        { label: '입구 이탈률', value: '32%', sub: '목표 <25%', alert: true },
        { label: '감압구간', value: '1.2m', sub: '최소 1.5m 필요', alert: true },
        { label: '우회전율', value: '87%', sub: '정상 범위' }
      ],
      stage: 'entry',
      zoneScale: {
        decompression: { scaleX: 1.4, scaleZ: 1.3 },
        powerWall: { scaleX: 1.5, scaleZ: 1.4 },
        clothingMain: { scaleX: 0.8, scaleZ: 0.8 },
        fittingRoom: { scaleX: 0.7, scaleZ: 0.7 },
        checkout: { scaleX: 0.7, scaleZ: 0.7 },
        accessory: { scaleX: 0.8, scaleZ: 0.8 }
      }
    };
  }

  // 4-5턴: 탐색 단계 — 피팅룸/메인/액세서리 강조
  if (turnCount <= 5) {
    return {
      vizState: 'exploration',
      highlights: ['fittingRoom', 'clothingMain', 'accessory'],
      flowPath: true,
      annotations: [
        { zone: 'fittingRoom', text: '전환율 67%\n핵심 전환 포인트', color: '#8b5cf6' },
        { zone: 'clothingMain', text: '직원 접객\n전환율 +20-30%', color: '#0ea5e9' }
      ],
      kpis: [
        { label: '피팅룸 전환', value: '67%', sub: '핵심', highlight: true },
        { label: '체류시간', value: '8분', sub: '목표 12분' },
        { label: '접객률', value: '45%', sub: '목표 70%' }
      ],
      stage: 'exploration',
      zoneScale: {
        fittingRoom: { scaleX: 1.5, scaleZ: 1.4 },
        clothingMain: { scaleX: 1.3, scaleZ: 1.2 },
        accessory: { scaleX: 1.2, scaleZ: 1.2 },
        decompression: { scaleX: 0.7, scaleZ: 0.7 },
        powerWall: { scaleX: 0.8, scaleZ: 0.8 },
        checkout: { scaleX: 0.8, scaleZ: 0.8 }
      }
    };
  }

  // 6턴+: 구매 단계 — 계산대 강조
  return {
    vizState: 'purchase',
    highlights: ['checkout'],
    flowPath: false,
    annotations: [
      { zone: 'checkout', text: '대기 3분 이내!\n모바일 POS 활용', color: '#ef4444' }
    ],
    kpis: [
      { label: '계산대 대기', value: '2.5분', sub: '목표 <3분' },
      { label: 'UPT', value: '2.1', sub: '목표 2.5' },
      { label: '추가구매율', value: '15%', sub: '목표 25%' }
    ],
    stage: 'purchase',
    zoneScale: {
      checkout: { scaleX: 1.6, scaleZ: 1.5 },
      clothingMain: { scaleX: 0.8, scaleZ: 0.8 },
      decompression: { scaleX: 0.7, scaleZ: 0.7 },
      powerWall: { scaleX: 0.7, scaleZ: 0.7 },
      fittingRoom: { scaleX: 0.8, scaleZ: 0.8 },
      accessory: { scaleX: 0.7, scaleZ: 0.7 }
    }
  };
}

// ═══════════════════════════════════════════
//  헬퍼 함수: CX 토픽 (대화 진행별 단계)
// ═══════════════════════════════════════════

function getCustomerExperienceVizDirective(turnCount: number): VizDirective {
  // 초기: 진입 경험 — 감압구간/파워월 강조
  if (turnCount <= 2) {
    return {
      vizState: 'entry',
      highlights: ['decompression', 'powerWall'],
      flowPath: true,
      kpis: [
        { label: '첫인상', value: '3초', sub: '결정 시간' },
        { label: 'NPS', value: '45', sub: '목표 60' }
      ],
      stage: 'entry',
      zoneScale: {
        decompression: { scaleX: 1.4, scaleZ: 1.3 },
        powerWall: { scaleX: 1.4, scaleZ: 1.3 },
        clothingMain: { scaleX: 0.8, scaleZ: 0.8 },
        fittingRoom: { scaleX: 0.7, scaleZ: 0.7 },
        checkout: { scaleX: 0.7, scaleZ: 0.7 },
        accessory: { scaleX: 0.8, scaleZ: 0.8 }
      }
    };
  }

  // 중반: 탐색 경험 — 메인/피팅룸/액세서리 강조
  if (turnCount <= 4) {
    return {
      vizState: 'exploration',
      highlights: ['clothingMain', 'fittingRoom', 'accessory'],
      flowPath: true,
      kpis: [
        { label: '탐색 만족도', value: '3.8/5', sub: '개선 필요' },
        { label: '직원 응대', value: '4.2/5', sub: '양호' }
      ],
      stage: 'exploration',
      zoneScale: {
        clothingMain: { scaleX: 1.3, scaleZ: 1.3 },
        fittingRoom: { scaleX: 1.4, scaleZ: 1.3 },
        accessory: { scaleX: 1.2, scaleZ: 1.2 },
        decompression: { scaleX: 0.7, scaleZ: 0.7 },
        powerWall: { scaleX: 0.8, scaleZ: 0.8 },
        checkout: { scaleX: 0.8, scaleZ: 0.8 }
      }
    };
  }

  // 후반: 결제 경험 — 계산대 강조
  return {
    vizState: 'purchase',
    highlights: ['checkout'],
    flowPath: false,
    kpis: [
      { label: '결제 경험', value: '4.0/5', sub: '양호' },
      { label: '재방문 의향', value: '65%', sub: '목표 80%' }
    ],
    stage: 'purchase',
    zoneScale: {
      checkout: { scaleX: 1.5, scaleZ: 1.5 },
      clothingMain: { scaleX: 0.8, scaleZ: 0.8 },
      decompression: { scaleX: 0.7, scaleZ: 0.7 },
      powerWall: { scaleX: 0.7, scaleZ: 0.7 },
      fittingRoom: { scaleX: 0.8, scaleZ: 0.8 },
      accessory: { scaleX: 0.7, scaleZ: 0.7 }
    }
  };
}
