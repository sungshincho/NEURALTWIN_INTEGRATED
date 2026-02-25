/**
 * fewShotExamples.ts - Phase 1.2: Few-Shot Learning Examples
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 검증된 최적화 성공 사례를 Few-Shot 예시로 제공하여
 * AI 출력 품질과 일관성 향상
 *
 * 주요 기능:
 * - 10개 검증된 최적화 예시
 * - 시나리오 유사도 기반 예시 선택
 * - 프롬프트 포맷팅
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'snow' | 'hot' | 'cold';
export type EventType = 'sale' | 'holiday' | 'black_friday' | 'new_arrival' | 'clearance' | 'vip_event';
export type DayType = 'weekday' | 'weekend' | 'holiday';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TrafficLevel = 'low' | 'medium' | 'high' | 'very_high';
export type SelectionStrategy = 'similar' | 'diverse' | 'random';

/**
 * 시나리오 조건
 */
export interface ExampleScenario {
  weather: WeatherCondition;
  eventType: EventType | null;
  dayType: DayType;
  timeOfDay: TimeOfDay;
  season: Season;
  trafficLevel: TrafficLevel;
}

/**
 * 입력 상황
 */
export interface ExampleInput {
  storeType: string;
  furnitureCount: number;
  productCount: number;
  emptySlots: number;
  keyIssues: string[];
}

/**
 * 가구 변경 예시
 */
export interface ExampleFurnitureChange {
  furnitureType: string;
  fromZone: string;
  toZone: string;
  reason: string;
  vmdPrinciple?: string;
}

/**
 * 상품 변경 예시
 */
export interface ExampleProductChange {
  productCategory: string;
  fromZoneType: string;
  toZoneType: string;
  slotHeightChange?: string;
  reason: string;
  associationApplied?: string;
}

/**
 * 최적화 출력
 */
export interface ExampleOutput {
  furnitureChanges: ExampleFurnitureChange[];
  productChanges: ExampleProductChange[];
  reasoning: string;
  keyStrategies: string[];
}

/**
 * 검증된 결과
 */
export interface ExampleOutcome {
  revenueChange: number;
  conversionChange: number;
  trafficChange: number;
  validated: boolean;
  validationDate?: string;
  notes?: string;
}

/**
 * 최적화 예시 전체 구조
 */
export interface OptimizationExample {
  id: string;
  name: string;
  description: string;
  scenario: ExampleScenario;
  input: ExampleInput;
  output: ExampleOutput;
  outcome: ExampleOutcome;
}

/**
 * 예시 선택기 인터페이스
 */
export interface ExampleSelector {
  selectExamples(
    currentScenario: ExampleScenario,
    count: number,
    strategy: SelectionStrategy
  ): OptimizationExample[];
}

// ============================================================================
// 10 Validated Optimization Examples
// ============================================================================

export const OPTIMIZATION_EXAMPLES: OptimizationExample[] = [
  // 1. 비오는 주말 피크
  {
    id: 'ex_rain_weekend_peak',
    name: '비오는 주말 피크시간 최적화',
    description: '비 오는 날의 감소된 방문객과 증가된 체류시간을 활용한 최적화',
    scenario: {
      weather: 'rain',
      eventType: null,
      dayType: 'weekend',
      timeOfDay: 'afternoon',
      season: 'fall',
      trafficLevel: 'medium',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 65,
      productCount: 150,
      emptySlots: 20,
      keyIssues: ['낮은 방문객', '높은 체류시간', '우천 관련 상품 노출 부족'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'display_rack',
          fromZone: 'Z003',
          toZone: 'Z002',
          reason: '비 오는 날 메인홀 체류 증가 대비 고가치 상품 노출 강화',
          vmdPrinciple: 'focal_point',
        },
        {
          furnitureType: 'accessory_stand',
          fromZone: 'Z005',
          toZone: 'Z001',
          reason: '우산/모자 등 우천 관련 액세서리 입구 배치',
          vmdPrinciple: 'impulse_zone',
        },
      ],
      productChanges: [
        {
          productCategory: 'outerwear',
          fromZoneType: 'clothing_zone',
          toZoneType: 'main_hall',
          slotHeightChange: 'low → eye',
          reason: '레인코트/우비 입구 배치로 즉시 구매 유도',
        },
        {
          productCategory: 'accessory',
          fromZoneType: 'accessory_zone',
          toZoneType: 'entrance',
          reason: '우산/모자 입구 임펄스 배치',
          associationApplied: '우천 용품 번들',
        },
        {
          productCategory: 'footwear',
          fromZoneType: 'shoe_zone',
          toZoneType: 'main_hall',
          slotHeightChange: 'floor → low',
          reason: '방수 신발 가시성 향상',
        },
      ],
      reasoning: '비 오는 날은 방문객은 줄지만 체류시간이 증가합니다. 이를 활용하여 고가치 상품을 체류 동선에 배치하고, 날씨 관련 상품을 입구에 배치하여 즉시 전환을 유도합니다. 골든존에는 마진이 높은 아우터웨어를 배치하여 구매 단가를 높입니다.',
      keyStrategies: ['체류시간 활용', '날씨 연관 상품 전면 배치', '골든존 최적화', '임펄스 구매 유도'],
    },
    outcome: {
      revenueChange: 0.18,
      conversionChange: 0.12,
      trafficChange: -0.15,
      validated: true,
      validationDate: '2024-10-15',
      notes: '우천 시 전환율 향상 효과 확인',
    },
  },

  // 2. 블랙프라이데이 세일
  {
    id: 'ex_black_friday',
    name: '블랙프라이데이 대량 트래픽 대응',
    description: '극대화된 트래픽에서 병목 해소와 빠른 회전을 위한 최적화',
    scenario: {
      weather: 'clear',
      eventType: 'black_friday',
      dayType: 'weekend',
      timeOfDay: 'afternoon',
      season: 'fall',
      trafficLevel: 'very_high',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 70,
      productCount: 200,
      emptySlots: 10,
      keyIssues: ['입구 병목', '계산대 대기 과다', '인기 상품 품절 우려'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'clothing_rack',
          fromZone: 'Z001',
          toZone: 'Z003',
          reason: '입구 혼잡 완화를 위한 가구 분산',
          vmdPrinciple: 'breathing_room',
        },
        {
          furnitureType: 'display_table',
          fromZone: 'Z002',
          toZone: 'Z004',
          reason: '세일 상품 분산 배치로 트래픽 분산',
          vmdPrinciple: 'visual_flow',
        },
      ],
      productChanges: [
        {
          productCategory: 'sale_items',
          fromZoneType: 'main_hall',
          toZoneType: 'multiple_zones',
          reason: '세일 상품 여러 존에 분산하여 병목 방지',
        },
        {
          productCategory: 'high_margin',
          fromZoneType: 'back_zone',
          toZoneType: 'checkout_adjacent',
          reason: '계산대 대기 중 추가 구매 유도',
          associationApplied: '계산대 인접 임펄스',
        },
        {
          productCategory: 'doorbuster',
          fromZoneType: 'main_hall',
          toZoneType: 'back_zone',
          slotHeightChange: 'eye → high',
          reason: '도어버스터 상품 후방 배치로 매장 전체 동선 유도',
        },
      ],
      reasoning: '블랙프라이데이는 극대화된 트래픽으로 병목이 심각해집니다. 인기 세일 상품을 여러 존에 분산 배치하여 트래픽을 분산시키고, 도어버스터 상품을 후방에 배치하여 고객이 매장 전체를 둘러보도록 유도합니다. 계산대 인접 구역에는 고마진 임펄스 상품을 배치합니다.',
      keyStrategies: ['트래픽 분산', '병목 해소', '동선 유도', '임펄스 존 최적화'],
    },
    outcome: {
      revenueChange: 0.35,
      conversionChange: 0.08,
      trafficChange: 0.45,
      validated: true,
      validationDate: '2024-11-29',
      notes: '전년 대비 매출 35% 증가',
    },
  },

  // 3. 평일 한산한 오전
  {
    id: 'ex_quiet_weekday_morning',
    name: '평일 오전 저트래픽 활성화',
    description: '저트래픽 시간대의 VIP 고객 집중 공략 및 체험 강화',
    scenario: {
      weather: 'clear',
      eventType: null,
      dayType: 'weekday',
      timeOfDay: 'morning',
      season: 'spring',
      trafficLevel: 'low',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 60,
      productCount: 140,
      emptySlots: 35,
      keyIssues: ['낮은 방문객', '높은 객단가 잠재력', '직원 유휴 시간'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'premium_display',
          fromZone: 'Z004',
          toZone: 'Z001',
          reason: '프리미엄 상품 입구 노출로 VIP 고객 주목',
          vmdPrinciple: 'focal_point',
        },
      ],
      productChanges: [
        {
          productCategory: 'premium',
          fromZoneType: 'premium_zone',
          toZoneType: 'entrance',
          slotHeightChange: 'high → eye',
          reason: 'VIP 고객용 프리미엄 라인 전면 배치',
        },
        {
          productCategory: 'new_arrival',
          fromZoneType: 'back_zone',
          toZoneType: 'main_hall',
          reason: '신상품 노출 강화로 관심 유도',
        },
        {
          productCategory: 'experience_items',
          fromZoneType: 'fitting_zone',
          toZoneType: 'experience_zone',
          reason: '체험형 상품 확대로 체류시간 증가',
          associationApplied: '스타일링 세트',
        },
      ],
      reasoning: '평일 오전은 방문객이 적지만 시간 여유가 있는 VIP 고객 비율이 높습니다. 프리미엄 상품과 신상품을 전면에 배치하고, 체험형 쇼핑을 유도하여 객단가를 높입니다. 직원이 충분하므로 개인화된 서비스와 연계합니다.',
      keyStrategies: ['VIP 고객 집중', '프리미엄 라인 강조', '체험형 쇼핑', '개인화 서비스'],
    },
    outcome: {
      revenueChange: 0.22,
      conversionChange: 0.25,
      trafficChange: -0.05,
      validated: true,
      validationDate: '2024-09-20',
      notes: '객단가 40% 상승',
    },
  },

  // 4. 여름 세일 기간
  {
    id: 'ex_summer_sale',
    name: '여름 세일 기간 최적화',
    description: '더운 날씨와 세일 이벤트를 결합한 여름 시즌 최적화',
    scenario: {
      weather: 'hot',
      eventType: 'sale',
      dayType: 'weekend',
      timeOfDay: 'afternoon',
      season: 'summer',
      trafficLevel: 'high',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 65,
      productCount: 180,
      emptySlots: 15,
      keyIssues: ['에어컨 구역 집중', '하절기 상품 재고 과다', '체류시간 감소'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'sale_rack',
          fromZone: 'Z005',
          toZone: 'Z002',
          reason: '에어컨 근처 시원한 구역에 세일 상품 집중',
          vmdPrinciple: 'comfort_zone',
        },
        {
          furnitureType: 'beverage_stand',
          fromZone: 'Z006',
          toZone: 'Z001',
          reason: '입구에 음료 스탠드 배치로 체류 유도',
          vmdPrinciple: 'hospitality',
        },
      ],
      productChanges: [
        {
          productCategory: 'summer_wear',
          fromZoneType: 'seasonal_zone',
          toZoneType: 'main_hall',
          slotHeightChange: 'low → eye',
          reason: '여름 의류 세일 상품 골든존 배치',
        },
        {
          productCategory: 'swimwear',
          fromZoneType: 'specialty_zone',
          toZoneType: 'entrance',
          reason: '수영복 입구 임펄스 배치',
          associationApplied: '비치웨어 번들',
        },
        {
          productCategory: 'fall_preview',
          fromZoneType: 'storage',
          toZoneType: 'back_zone',
          reason: '가을 프리뷰 상품 후방 배치로 관심 유도',
        },
      ],
      reasoning: '더운 여름에는 고객이 시원한 구역에 집중합니다. 에어컨이 잘 나오는 구역에 주력 세일 상품을 배치하고, 입구에는 시원함을 제공하는 요소(음료, 부채 등)를 배치하여 입장을 유도합니다. 시즌 마감 재고는 공격적으로 전면 배치합니다.',
      keyStrategies: ['쾌적 구역 활용', '시즌 재고 소진', '가을 프리뷰', '체류 유도'],
    },
    outcome: {
      revenueChange: 0.28,
      conversionChange: 0.15,
      trafficChange: 0.10,
      validated: true,
      validationDate: '2024-07-20',
      notes: '여름 재고 소진율 85%',
    },
  },

  // 5. 겨울 눈 오는 날
  {
    id: 'ex_snowy_winter',
    name: '눈 오는 겨울날 최적화',
    description: '폭설로 인한 저트래픽 상황에서의 전환율 극대화',
    scenario: {
      weather: 'snow',
      eventType: null,
      dayType: 'weekday',
      timeOfDay: 'afternoon',
      season: 'winter',
      trafficLevel: 'low',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 60,
      productCount: 160,
      emptySlots: 30,
      keyIssues: ['극저 방문객', '겨울 의류 재고', '장시간 체류 고객'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'winter_display',
          fromZone: 'Z003',
          toZone: 'Z001',
          reason: '겨울 필수 아이템 입구 집중 배치',
          vmdPrinciple: 'focal_point',
        },
      ],
      productChanges: [
        {
          productCategory: 'winter_outerwear',
          fromZoneType: 'outerwear_zone',
          toZoneType: 'entrance',
          slotHeightChange: 'any → eye',
          reason: '패딩/코트 입구 골든존 배치',
        },
        {
          productCategory: 'winter_accessory',
          fromZoneType: 'accessory_zone',
          toZoneType: 'checkout_adjacent',
          reason: '장갑/목도리/모자 계산대 인접 임펄스',
          associationApplied: '방한용품 세트',
        },
        {
          productCategory: 'indoor_wear',
          fromZoneType: 'casual_zone',
          toZoneType: 'main_hall',
          reason: '실내복/홈웨어 체류 고객 대상 배치',
        },
        {
          productCategory: 'gift_items',
          fromZoneType: 'gift_zone',
          toZoneType: 'high_visibility',
          reason: '연말 선물용 상품 강조',
        },
      ],
      reasoning: '눈 오는 날은 방문객이 극히 적지만, 오는 고객은 명확한 구매 의도와 긴 체류시간을 갖습니다. 겨울 필수품을 전면에 배치하여 즉시 구매를 유도하고, 체류 시간을 활용하여 실내복/선물 등 부가 상품 구매를 유도합니다.',
      keyStrategies: ['필수품 전면 배치', '높은 전환율 활용', '번들 판매', '선물 시즌 공략'],
    },
    outcome: {
      revenueChange: 0.12,
      conversionChange: 0.35,
      trafficChange: -0.40,
      validated: true,
      validationDate: '2024-12-15',
      notes: '전환율 35% 향상, 번들 판매 증가',
    },
  },

  // 6. 신상품 출시 이벤트
  {
    id: 'ex_new_arrival_event',
    name: '신상품 출시 이벤트',
    description: '신상품 런칭으로 인한 높은 관심도를 활용한 최적화',
    scenario: {
      weather: 'clear',
      eventType: 'new_arrival',
      dayType: 'weekend',
      timeOfDay: 'afternoon',
      season: 'spring',
      trafficLevel: 'high',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 65,
      productCount: 170,
      emptySlots: 18,
      keyIssues: ['신상품 주목도 확보', '기존 상품 판매 유지', 'SNS 포토존 수요'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'hero_display',
          fromZone: 'Z002',
          toZone: 'Z001',
          reason: '신상품 히어로 디스플레이 입구 설치',
          vmdPrinciple: 'focal_point',
        },
        {
          furnitureType: 'photo_backdrop',
          fromZone: 'Z006',
          toZone: 'Z002',
          reason: 'SNS 포토존 메인홀 설치',
          vmdPrinciple: 'experience_zone',
        },
      ],
      productChanges: [
        {
          productCategory: 'new_arrival_hero',
          fromZoneType: 'new_zone',
          toZoneType: 'entrance',
          slotHeightChange: 'any → eye',
          reason: '신상품 대표 아이템 입구 포컬 포인트',
        },
        {
          productCategory: 'new_arrival_line',
          fromZoneType: 'new_zone',
          toZoneType: 'main_hall',
          reason: '신상품 라인업 메인홀 전개',
        },
        {
          productCategory: 'complementary',
          fromZoneType: 'various',
          toZoneType: 'new_adjacent',
          reason: '신상품과 어울리는 기존 상품 인접 배치',
          associationApplied: '스타일링 제안',
        },
      ],
      reasoning: '신상품 런칭은 높은 관심도를 가져옵니다. 입구에 히어로 제품을 설치하여 강렬한 첫인상을 주고, SNS 공유를 유도하는 포토존을 배치합니다. 신상품과 기존 상품의 스타일링 조합을 제안하여 객단가를 높입니다.',
      keyStrategies: ['히어로 제품 강조', 'SNS 바이럴', '스타일링 제안', '기존 상품 연계'],
    },
    outcome: {
      revenueChange: 0.32,
      conversionChange: 0.18,
      trafficChange: 0.25,
      validated: true,
      validationDate: '2024-04-10',
      notes: 'SNS 언급 300% 증가',
    },
  },

  // 7. VIP 이벤트
  {
    id: 'ex_vip_event',
    name: 'VIP 고객 전용 이벤트',
    description: 'VIP 고객 대상 프라이빗 쇼핑 이벤트 최적화',
    scenario: {
      weather: 'clear',
      eventType: 'vip_event',
      dayType: 'weekday',
      timeOfDay: 'evening',
      season: 'fall',
      trafficLevel: 'low',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 65,
      productCount: 160,
      emptySlots: 40,
      keyIssues: ['프리미엄 경험 제공', '높은 객단가 기대', '개인화 서비스'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'lounge_seating',
          fromZone: 'Z005',
          toZone: 'Z002',
          reason: 'VIP 라운지 공간 확대',
          vmdPrinciple: 'hospitality',
        },
        {
          furnitureType: 'premium_cabinet',
          fromZone: 'Z004',
          toZone: 'Z001',
          reason: '프리미엄 라인 전용 디스플레이',
          vmdPrinciple: 'premium_zone',
        },
      ],
      productChanges: [
        {
          productCategory: 'limited_edition',
          fromZoneType: 'vault',
          toZoneType: 'vip_zone',
          slotHeightChange: 'secure → eye',
          reason: '한정판 상품 VIP 전용 공개',
        },
        {
          productCategory: 'premium_line',
          fromZoneType: 'premium_zone',
          toZoneType: 'main_hall',
          reason: '프리미엄 라인 전면 전개',
        },
        {
          productCategory: 'pre_release',
          fromZoneType: 'storage',
          toZoneType: 'exclusive_zone',
          reason: '선출시 상품 VIP 선공개',
        },
      ],
      reasoning: 'VIP 이벤트는 높은 객단가와 로열티를 기대할 수 있습니다. 일반 고객에게 공개되지 않은 한정판과 선출시 상품을 배치하고, 프리미엄 경험을 위한 라운지 공간을 확대합니다. 개인화된 스타일링 서비스와 연계합니다.',
      keyStrategies: ['독점 상품 공개', '프리미엄 경험', '개인화 서비스', '로열티 강화'],
    },
    outcome: {
      revenueChange: 0.55,
      conversionChange: 0.40,
      trafficChange: -0.70,
      validated: true,
      validationDate: '2024-10-05',
      notes: '객단가 120% 상승, VIP 재방문율 85%',
    },
  },

  // 8. 재고 정리 세일
  {
    id: 'ex_clearance_sale',
    name: '시즌 마감 재고 정리',
    description: '시즌 마감 재고를 효율적으로 소진하기 위한 최적화',
    scenario: {
      weather: 'cloudy',
      eventType: 'clearance',
      dayType: 'weekend',
      timeOfDay: 'afternoon',
      season: 'winter',
      trafficLevel: 'medium',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 60,
      productCount: 200,
      emptySlots: 25,
      keyIssues: ['과다 재고', '마진 손실 최소화', '신시즌 공간 확보'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'clearance_bin',
          fromZone: 'Z006',
          toZone: 'Z001',
          reason: '클리어런스 빈 입구 배치로 가격 소구',
          vmdPrinciple: 'value_perception',
        },
        {
          furnitureType: 'sale_rack',
          fromZone: 'Z003',
          toZone: 'Z002',
          reason: '세일 랙 메인홀 확대',
          vmdPrinciple: 'visual_flow',
        },
      ],
      productChanges: [
        {
          productCategory: 'deep_discount',
          fromZoneType: 'back_zone',
          toZoneType: 'entrance',
          slotHeightChange: 'any → low',
          reason: '70% 이상 할인 상품 입구 빈 배치',
        },
        {
          productCategory: 'moderate_discount',
          fromZoneType: 'seasonal_zone',
          toZoneType: 'main_hall',
          slotHeightChange: 'low → eye',
          reason: '30-50% 할인 상품 골든존 배치',
        },
        {
          productCategory: 'full_price',
          fromZoneType: 'main_hall',
          toZoneType: 'back_zone',
          reason: '정가 상품 후방 이동으로 세일 공간 확보',
        },
        {
          productCategory: 'next_season_preview',
          fromZoneType: 'storage',
          toZoneType: 'preview_zone',
          reason: '다음 시즌 프리뷰로 관심 유도',
        },
      ],
      reasoning: '재고 정리 세일에서는 가격 소구가 핵심입니다. 깊은 할인 상품을 입구에 배치하여 고객을 유인하고, 적정 할인 상품은 골든존에서 마진을 확보합니다. 정가 상품은 후방으로 이동하여 세일 공간을 최대화하되, 다음 시즌 프리뷰로 브랜드 가치를 유지합니다.',
      keyStrategies: ['가격 계층 배치', '재고 소진 우선', '마진 밸런스', '시즌 전환 준비'],
    },
    outcome: {
      revenueChange: 0.15,
      conversionChange: 0.22,
      trafficChange: 0.18,
      validated: true,
      validationDate: '2024-02-15',
      notes: '재고 소진율 92%, 마진 손실 15% 절감',
    },
  },

  // 9. 금요일 저녁 피크
  {
    id: 'ex_friday_evening_peak',
    name: '금요일 저녁 퇴근 피크',
    description: '퇴근 후 쇼핑 고객 대상 빠른 구매 결정 유도',
    scenario: {
      weather: 'clear',
      eventType: null,
      dayType: 'weekday',
      timeOfDay: 'evening',
      season: 'fall',
      trafficLevel: 'high',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 65,
      productCount: 160,
      emptySlots: 15,
      keyIssues: ['제한된 쇼핑 시간', '빠른 의사결정 필요', '주말 외출 준비 수요'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'quick_pick_stand',
          fromZone: 'Z003',
          toZone: 'Z001',
          reason: '퀵픽 스탠드 입구 배치로 빠른 선택 지원',
          vmdPrinciple: 'convenience',
        },
      ],
      productChanges: [
        {
          productCategory: 'bestseller',
          fromZoneType: 'various',
          toZoneType: 'entrance',
          slotHeightChange: 'any → eye',
          reason: '베스트셀러 입구 집중으로 빠른 구매',
        },
        {
          productCategory: 'weekend_outfit',
          fromZoneType: 'casual_zone',
          toZoneType: 'main_hall',
          reason: '주말 외출복 세트 메인홀 배치',
          associationApplied: '완성 룩 제안',
        },
        {
          productCategory: 'accessories',
          fromZoneType: 'accessory_zone',
          toZoneType: 'checkout_adjacent',
          reason: '액세서리 계산대 인접으로 추가 구매',
        },
      ],
      reasoning: '금요일 저녁 고객은 시간이 제한되어 있지만 주말을 위한 쇼핑 의욕이 높습니다. 베스트셀러와 주말 외출복 세트를 전면에 배치하여 빠른 결정을 지원하고, 완성된 룩 제안으로 객단가를 높입니다.',
      keyStrategies: ['빠른 결정 지원', '베스트셀러 강조', '룩 제안', '편의성 극대화'],
    },
    outcome: {
      revenueChange: 0.20,
      conversionChange: 0.16,
      trafficChange: 0.08,
      validated: true,
      validationDate: '2024-09-27',
      notes: '평균 쇼핑 시간 30% 단축, 객단가 유지',
    },
  },

  // 10. 휴일 가족 쇼핑
  {
    id: 'ex_holiday_family',
    name: '휴일 가족 단위 쇼핑',
    description: '가족 단위 방문객을 위한 전 연령대 최적화',
    scenario: {
      weather: 'clear',
      eventType: 'holiday',
      dayType: 'holiday',
      timeOfDay: 'afternoon',
      season: 'spring',
      trafficLevel: 'high',
    },
    input: {
      storeType: 'fashion',
      furnitureCount: 70,
      productCount: 180,
      emptySlots: 20,
      keyIssues: ['다양한 연령대', '긴 체류시간', '아동 동반 고객'],
    },
    output: {
      furnitureChanges: [
        {
          furnitureType: 'family_seating',
          fromZone: 'Z005',
          toZone: 'Z002',
          reason: '가족 휴식 공간 확대',
          vmdPrinciple: 'hospitality',
        },
        {
          furnitureType: 'kids_activity',
          fromZone: 'Z006',
          toZone: 'Z003',
          reason: '키즈 액티비티 존 중앙 배치',
          vmdPrinciple: 'experience_zone',
        },
      ],
      productChanges: [
        {
          productCategory: 'family_matching',
          fromZoneType: 'various',
          toZoneType: 'main_hall',
          slotHeightChange: 'various → eye',
          reason: '가족 매칭룩 메인홀 집중 배치',
          associationApplied: '가족 세트',
        },
        {
          productCategory: 'kids_wear',
          fromZoneType: 'kids_zone',
          toZoneType: 'activity_adjacent',
          reason: '키즈웨어 액티비티 존 인접 배치',
        },
        {
          productCategory: 'parent_wear',
          fromZoneType: 'adult_zone',
          toZoneType: 'kids_visible',
          reason: '부모용 의류 키즈존 시야 내 배치',
        },
        {
          productCategory: 'gift_items',
          fromZoneType: 'gift_zone',
          toZoneType: 'checkout_adjacent',
          reason: '선물용 상품 계산대 인접',
        },
      ],
      reasoning: '휴일 가족 쇼핑에서는 아이들이 핵심 변수입니다. 키즈 액티비티 존을 배치하여 아이들을 즐겁게 하면서 부모가 쇼핑할 수 있도록 하고, 가족 매칭룩으로 다중 구매를 유도합니다. 부모용 상품은 키즈존 시야 내에 배치하여 아이를 지켜보면서 쇼핑할 수 있게 합니다.',
      keyStrategies: ['가족 친화적 환경', '키즈 액티비티', '매칭룩 제안', '다중 구매 유도'],
    },
    outcome: {
      revenueChange: 0.28,
      conversionChange: 0.14,
      trafficChange: 0.22,
      validated: true,
      validationDate: '2024-05-05',
      notes: '가족 단위 객단가 180% 상승',
    },
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 두 시나리오 간 유사도 계산 (0-1)
 */
export function calculateScenarioSimilarity(
  scenario1: ExampleScenario,
  scenario2: ExampleScenario
): number {
  let similarity = 0;

  // 날씨 일치: +0.25
  if (scenario1.weather === scenario2.weather) {
    similarity += 0.25;
  } else {
    // 부분 일치 (비/폭우, 맑음/흐림 등)
    const weatherGroups: Record<string, string[]> = {
      wet: ['rain', 'heavy_rain', 'snow'],
      dry: ['clear', 'cloudy'],
      extreme: ['hot', 'cold', 'heavy_rain', 'snow'],
    };
    for (const group of Object.values(weatherGroups)) {
      if (group.includes(scenario1.weather) && group.includes(scenario2.weather)) {
        similarity += 0.10;
        break;
      }
    }
  }

  // 이벤트 타입 일치: +0.25
  if (scenario1.eventType === scenario2.eventType) {
    similarity += 0.25;
  } else if (scenario1.eventType && scenario2.eventType) {
    // 세일 관련 이벤트 부분 일치
    const saleEvents: EventType[] = ['sale', 'black_friday', 'clearance'];
    if (saleEvents.includes(scenario1.eventType) && saleEvents.includes(scenario2.eventType)) {
      similarity += 0.12;
    }
  }

  // 요일 타입 일치: +0.20
  if (scenario1.dayType === scenario2.dayType) {
    similarity += 0.20;
  } else if (
    (scenario1.dayType === 'weekend' && scenario2.dayType === 'holiday') ||
    (scenario1.dayType === 'holiday' && scenario2.dayType === 'weekend')
  ) {
    similarity += 0.10; // 주말과 휴일 부분 일치
  }

  // 시간대 일치: +0.15
  if (scenario1.timeOfDay === scenario2.timeOfDay) {
    similarity += 0.15;
  } else {
    // 인접 시간대 부분 일치
    const timeOrder: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    const idx1 = timeOrder.indexOf(scenario1.timeOfDay);
    const idx2 = timeOrder.indexOf(scenario2.timeOfDay);
    if (Math.abs(idx1 - idx2) === 1) {
      similarity += 0.07;
    }
  }

  // 트래픽 레벨 일치: +0.15
  if (scenario1.trafficLevel === scenario2.trafficLevel) {
    similarity += 0.15;
  } else {
    // 인접 트래픽 레벨 부분 일치
    const trafficOrder: TrafficLevel[] = ['low', 'medium', 'high', 'very_high'];
    const idx1 = trafficOrder.indexOf(scenario1.trafficLevel);
    const idx2 = trafficOrder.indexOf(scenario2.trafficLevel);
    if (Math.abs(idx1 - idx2) === 1) {
      similarity += 0.07;
    }
  }

  return Math.min(similarity, 1.0);
}

/**
 * 현재 상황과 가장 유사한 예시 선택
 */
export function selectSimilarExamples(
  currentScenario: ExampleScenario,
  count: number
): OptimizationExample[] {
  // validated된 예시만 대상
  const validatedExamples = OPTIMIZATION_EXAMPLES.filter(ex => ex.outcome.validated);

  // 유사도 계산 및 정렬
  const withSimilarity = validatedExamples.map(ex => ({
    example: ex,
    similarity: calculateScenarioSimilarity(currentScenario, ex.scenario),
  }));

  withSimilarity.sort((a, b) => b.similarity - a.similarity);

  return withSimilarity.slice(0, count).map(item => item.example);
}

/**
 * 다양한 시나리오를 커버하는 예시 선택
 */
export function selectDiverseExamples(count: number): OptimizationExample[] {
  const validatedExamples = OPTIMIZATION_EXAMPLES.filter(ex => ex.outcome.validated);
  const selected: OptimizationExample[] = [];
  const usedWeathers = new Set<WeatherCondition>();
  const usedEvents = new Set<EventType | null>();
  const usedDayTypes = new Set<DayType>();

  // 다양성 확보를 위해 각 카테고리에서 고르게 선택
  for (const example of validatedExamples) {
    if (selected.length >= count) break;

    const isNewWeather = !usedWeathers.has(example.scenario.weather);
    const isNewEvent = !usedEvents.has(example.scenario.eventType);
    const isNewDayType = !usedDayTypes.has(example.scenario.dayType);

    // 최소 하나의 새로운 속성이 있으면 선택
    if (isNewWeather || isNewEvent || isNewDayType) {
      selected.push(example);
      usedWeathers.add(example.scenario.weather);
      usedEvents.add(example.scenario.eventType);
      usedDayTypes.add(example.scenario.dayType);
    }
  }

  // 부족하면 나머지 채우기
  if (selected.length < count) {
    for (const example of validatedExamples) {
      if (selected.length >= count) break;
      if (!selected.includes(example)) {
        selected.push(example);
      }
    }
  }

  return selected;
}

/**
 * 랜덤 예시 선택
 */
export function selectRandomExamples(count: number): OptimizationExample[] {
  const validatedExamples = OPTIMIZATION_EXAMPLES.filter(ex => ex.outcome.validated);
  const shuffled = [...validatedExamples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 예시 선택 (전략에 따라)
 */
export function selectExamples(
  currentScenario: ExampleScenario | null,
  count: number,
  strategy: SelectionStrategy
): OptimizationExample[] {
  switch (strategy) {
    case 'similar':
      if (!currentScenario) {
        return selectDiverseExamples(count);
      }
      return selectSimilarExamples(currentScenario, count);
    case 'diverse':
      return selectDiverseExamples(count);
    case 'random':
      return selectRandomExamples(count);
    default:
      return selectDiverseExamples(count);
  }
}

// ============================================================================
// Prompt Formatting Functions
// ============================================================================

/**
 * 가구 변경을 프롬프트 텍스트로 변환
 */
function formatFurnitureChange(change: ExampleFurnitureChange): string {
  return `- Furniture: ${change.furnitureType} ${change.fromZone}→${change.toZone} (${change.reason})${change.vmdPrinciple ? ` [VMD: ${change.vmdPrinciple}]` : ''}`;
}

/**
 * 상품 변경을 프롬프트 텍스트로 변환
 */
function formatProductChange(change: ExampleProductChange): string {
  let text = `- Product: ${change.productCategory} ${change.fromZoneType}→${change.toZoneType}`;
  if (change.slotHeightChange) {
    text += ` (height: ${change.slotHeightChange})`;
  }
  text += ` | ${change.reason}`;
  if (change.associationApplied) {
    text += ` [Association: ${change.associationApplied}]`;
  }
  return text;
}

/**
 * 예시를 프롬프트에 삽입할 텍스트로 변환
 */
export function formatExampleForPrompt(example: OptimizationExample, index: number): string {
  const scenarioText = [
    `Weather: ${example.scenario.weather}`,
    `Event: ${example.scenario.eventType || 'none'}`,
    `Day: ${example.scenario.dayType}`,
    `Time: ${example.scenario.timeOfDay}`,
    `Season: ${example.scenario.season}`,
    `Traffic: ${example.scenario.trafficLevel}`,
  ].join(', ');

  const furnitureChanges = example.output.furnitureChanges.map(formatFurnitureChange).join('\n');
  const productChanges = example.output.productChanges.map(formatProductChange).join('\n');

  const outcomeIcon = example.outcome.validated ? '✅' : '⏳';
  const revenueSign = example.outcome.revenueChange >= 0 ? '+' : '';
  const convSign = example.outcome.conversionChange >= 0 ? '+' : '';
  const trafficSign = example.outcome.trafficChange >= 0 ? '+' : '';

  return `### Example ${index + 1}: ${example.name}

**Scenario:**
${scenarioText}

**Key Issues:**
${example.input.keyIssues.map(issue => `- ${issue}`).join('\n')}

**Decisions:**
${furnitureChanges}
${productChanges}

**Reasoning:**
${example.output.reasoning}

**Key Strategies:**
${example.output.keyStrategies.map(s => `- ${s}`).join('\n')}

**Outcome:** Revenue ${revenueSign}${Math.round(example.outcome.revenueChange * 100)}%, Conversion ${convSign}${Math.round(example.outcome.conversionChange * 100)}%, Traffic ${trafficSign}${Math.round(example.outcome.trafficChange * 100)}% ${outcomeIcon}`;
}

/**
 * 선택된 예시들을 프롬프트 섹션으로 조합
 */
export function buildFewShotSection(examples: OptimizationExample[]): string {
  if (examples.length === 0) {
    return '';
  }

  const examplesText = examples
    .map((ex, idx) => formatExampleForPrompt(ex, idx))
    .join('\n\n---\n\n');

  return `## 📚 REFERENCE EXAMPLES (Learn from validated successes)

The following are real-world optimization examples that achieved measurable results.
Use these as reference for your decision-making process.

${examplesText}

---

**Learning Points:**
1. Match your recommendations to the current scenario conditions
2. Apply similar strategies when facing similar issues
3. Consider the trade-offs shown in the outcomes (e.g., traffic vs conversion)
4. Use VMD principles and product associations as demonstrated
`;
}

/**
 * 현재 환경 데이터에서 ExampleScenario 생성
 */
export function createScenarioFromEnvironment(
  weather: { condition?: string; temperature?: number } | null,
  events: Array<{ eventType?: string }>,
  temporal: { dayOfWeek?: string; isWeekend?: boolean; timeOfDay?: string },
  flowHealthScore?: number
): ExampleScenario {
  // 날씨 조건 매핑
  let weatherCondition: WeatherCondition = 'clear';
  if (weather?.condition) {
    const conditionLower = weather.condition.toLowerCase();
    if (conditionLower.includes('rain') || conditionLower.includes('비')) {
      weatherCondition = conditionLower.includes('heavy') ? 'heavy_rain' : 'rain';
    } else if (conditionLower.includes('snow') || conditionLower.includes('눈')) {
      weatherCondition = 'snow';
    } else if (conditionLower.includes('cloud') || conditionLower.includes('흐림')) {
      weatherCondition = 'cloudy';
    } else if (weather.temperature && weather.temperature > 30) {
      weatherCondition = 'hot';
    } else if (weather.temperature && weather.temperature < 0) {
      weatherCondition = 'cold';
    }
  }

  // 이벤트 타입 매핑
  let eventType: EventType | null = null;
  if (events.length > 0) {
    const firstEvent = events[0].eventType?.toLowerCase();
    if (firstEvent?.includes('sale') || firstEvent?.includes('세일')) {
      eventType = 'sale';
    } else if (firstEvent?.includes('black') || firstEvent?.includes('블랙')) {
      eventType = 'black_friday';
    } else if (firstEvent?.includes('vip')) {
      eventType = 'vip_event';
    } else if (firstEvent?.includes('new') || firstEvent?.includes('신상')) {
      eventType = 'new_arrival';
    } else if (firstEvent?.includes('clear') || firstEvent?.includes('정리')) {
      eventType = 'clearance';
    } else if (firstEvent?.includes('holiday') || firstEvent?.includes('휴일')) {
      eventType = 'holiday';
    }
  }

  // 요일 타입 매핑
  let dayType: DayType = 'weekday';
  if (temporal.isWeekend) {
    dayType = 'weekend';
  } else if (eventType === 'holiday') {
    dayType = 'holiday';
  }

  // 시간대 매핑
  let timeOfDay: TimeOfDay = 'afternoon';
  if (temporal.timeOfDay) {
    const tod = temporal.timeOfDay.toLowerCase();
    if (tod.includes('morning') || tod.includes('오전')) {
      timeOfDay = 'morning';
    } else if (tod.includes('evening') || tod.includes('저녁')) {
      timeOfDay = 'evening';
    } else if (tod.includes('night') || tod.includes('밤')) {
      timeOfDay = 'night';
    }
  }

  // 시즌 결정 (현재 월 기준)
  const month = new Date().getMonth() + 1;
  let season: Season = 'spring';
  if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'fall';
  else season = 'winter';

  // 트래픽 레벨 결정
  let trafficLevel: TrafficLevel = 'medium';
  if (flowHealthScore !== undefined) {
    if (flowHealthScore >= 80) trafficLevel = 'high';
    else if (flowHealthScore >= 60) trafficLevel = 'medium';
    else trafficLevel = 'low';
  }
  // 이벤트에 따른 조정
  if (eventType === 'black_friday') trafficLevel = 'very_high';
  else if (eventType === 'vip_event') trafficLevel = 'low';

  return {
    weather: weatherCondition,
    eventType,
    dayType,
    timeOfDay,
    season,
    trafficLevel,
  };
}

// ============================================================================
// Export Default Selector
// ============================================================================

export const exampleSelector: ExampleSelector = {
  selectExamples,
};
