/**
 * retailOptimizationSchema.ts
 *
 * 리테일 도메인 지식 기반 고도화된 JSON Schema
 * Structured Output을 위한 AI 응답 스키마 정의
 *
 * 도메인 지식 영역:
 * - VMD (Visual Merchandising) 원칙
 * - 고객 여정 (Customer Journey) 최적화
 * - 상품 배치 전략 (마진, 회전율, 연관성)
 * - 인력 배치 (서비스 레벨, 피크타임 대응)
 */

// ============================================================================
// 도메인 Enum 정의
// ============================================================================

/**
 * VMD (Visual Merchandising) 원칙
 */
export const VMD_PRINCIPLES = [
  'focal_point_creation',      // 포컬포인트 생성 (시선 집중점)
  'traffic_flow_optimization', // 동선 최적화
  'bottleneck_resolution',     // 병목 해소
  'dead_zone_activation',      // 데드존 활성화
  'sightline_improvement',     // 시야선 개선
  'accessibility_enhancement', // 접근성 향상
  'cross_sell_proximity',      // 크로스셀 근접 배치
  'negative_space_balance',    // 여백 균형
] as const;

export type VMDPrinciple = typeof VMD_PRINCIPLES[number];

/**
 * 상품 배치 전략
 */
export const PLACEMENT_STRATEGIES = [
  'golden_zone_placement',     // 골든존 배치 (눈높이 120-150cm)
  'eye_level_optimization',    // 아이레벨 최적화
  'impulse_buy_position',      // 충동구매 위치 (계산대/동선 교차점)
  'cross_sell_bundle',         // 크로스셀 번들 (연관상품)
  'high_margin_spotlight',     // 고마진 스포트라이트
  'slow_mover_activation',     // 저회전 상품 활성화
  'seasonal_highlight',        // 시즌 하이라이트
  'new_arrival_feature',       // 신상품 피처링
  'clearance_optimization',    // 클리어런스 최적화
  'hero_product_display',      // 히어로 상품 진열
] as const;

export type PlacementStrategy = typeof PLACEMENT_STRATEGIES[number];

/**
 * 인력 배치 전략
 */
export const STAFFING_STRATEGIES = [
  'peak_coverage',             // 피크타임 커버리지
  'bottleneck_support',        // 병목 지원
  'high_value_zone_focus',     // 고가치 존 집중
  'cross_zone_flexibility',    // 교차 존 유연배치
  'customer_service_boost',    // 고객 서비스 강화
  'queue_management',          // 대기줄 관리
  'fitting_room_priority',     // 피팅룸 우선 배치
  'entrance_greeting',         // 입구 환영 서비스
] as const;

export type StaffingStrategy = typeof STAFFING_STRATEGIES[number];

/**
 * 가구 타입
 */
export const FURNITURE_TYPES = [
  'shelf',                     // 선반
  'rack',                      // 랙
  'table',                     // 테이블
  'gondola',                   // 곤돌라
  'endcap',                    // 엔드캡
  'checkout_counter',          // 계산대
  'fitting_room',              // 피팅룸
  'display_stand',             // 디스플레이 스탠드
  'mannequin',                 // 마네킹
  'promotional_display',       // 프로모션 디스플레이
] as const;

export type FurnitureType = typeof FURNITURE_TYPES[number];

/**
 * 선반 레벨 (VMD 골든존 분석용)
 */
export const SHELF_LEVELS = [
  'floor',                     // 바닥 (0-30cm)
  'bottom',                    // 하단 (30-60cm)
  'middle',                    // 중단 (60-120cm)
  'eye_level',                 // 눈높이/골든존 (120-150cm)
  'top',                       // 상단 (150cm+)
] as const;

export type ShelfLevel = typeof SHELF_LEVELS[number];

/**
 * 직원 역할
 */
export const STAFF_ROLES = [
  'manager',                   // 매니저
  'sales',                     // 판매직원
  'cashier',                   // 계산원
  'security',                  // 보안요원
  'greeter',                   // 안내직원
  'fitting_room_attendant',    // 피팅룸 담당
  'stock',                     // 재고 담당
  'visual_merchandiser',       // VMD 담당
] as const;

export type StaffRole = typeof STAFF_ROLES[number];

// ============================================================================
// 도메인 지식 코드북 (AI 학습/검증용)
// ============================================================================

/**
 * 배치 전략별 메타데이터
 */
export const PLACEMENT_STRATEGY_CODEBOOK: Record<PlacementStrategy, {
  description: string;
  applicable_to: string[];
  expected_lift: { min: number; max: number };
  requires?: string;
}> = {
  golden_zone_placement: {
    description: '눈높이(120-150cm) 프리미엄 위치 배치',
    applicable_to: ['high_margin', 'new_arrival', 'promotion'],
    expected_lift: { min: 0.15, max: 0.40 },
  },
  eye_level_optimization: {
    description: '아이레벨 = 바이레벨 원칙 적용',
    applicable_to: ['strategic_products', 'hero_items'],
    expected_lift: { min: 0.10, max: 0.30 },
  },
  impulse_buy_position: {
    description: '계산대/동선 교차점 충동구매 유도',
    applicable_to: ['accessories', 'consumables', 'low_price'],
    expected_lift: { min: 0.05, max: 0.20 },
  },
  cross_sell_bundle: {
    description: '연관상품 근접 배치 (장바구니 분석 기반)',
    applicable_to: ['complementary_products'],
    expected_lift: { min: 0.08, max: 0.25 },
    requires: 'association_rule',
  },
  high_margin_spotlight: {
    description: '고마진 상품 프리미엄 위치 집중',
    applicable_to: ['high_margin_products'],
    expected_lift: { min: 0.10, max: 0.25 },
  },
  slow_mover_activation: {
    description: '저회전 상품 고트래픽 존 이동',
    applicable_to: ['slow_moving_inventory'],
    expected_lift: { min: 0.20, max: 0.50 },
  },
  seasonal_highlight: {
    description: '시즌/이벤트 상품 전면 배치',
    applicable_to: ['seasonal_products', 'event_items'],
    expected_lift: { min: 0.12, max: 0.35 },
  },
  new_arrival_feature: {
    description: '신상품 피처링 (입구/포컬포인트)',
    applicable_to: ['new_arrivals'],
    expected_lift: { min: 0.15, max: 0.40 },
  },
  clearance_optimization: {
    description: '클리어런스 상품 효율적 소진',
    applicable_to: ['clearance', 'end_of_season'],
    expected_lift: { min: 0.10, max: 0.30 },
  },
  hero_product_display: {
    description: '시그니처/베스트셀러 상품 강조',
    applicable_to: ['bestsellers', 'signature_items'],
    expected_lift: { min: 0.08, max: 0.20 },
  },
};

/**
 * VMD 원칙별 메타데이터
 */
export const VMD_PRINCIPLE_CODEBOOK: Record<VMDPrinciple, {
  description: string;
  zone_types: string[];
  trigger?: string;
}> = {
  focal_point_creation: {
    description: '시선 집중점 생성 (입구/교차점)',
    zone_types: ['entrance', 'intersection', 'endcap'],
  },
  traffic_flow_optimization: {
    description: '고객 동선 최적화',
    zone_types: ['main_aisle', 'transition_zones'],
  },
  bottleneck_resolution: {
    description: '병목 구간 해소',
    zone_types: ['high_traffic_zones'],
    trigger: 'congestion_score > 0.7',
  },
  dead_zone_activation: {
    description: '저트래픽 존 활성화',
    zone_types: ['corner', 'back_area'],
    trigger: 'visit_rate < 0.2',
  },
  sightline_improvement: {
    description: '시야선 확보 및 개선',
    zone_types: ['entrance', 'main_aisle'],
  },
  accessibility_enhancement: {
    description: '접근성 향상 (동선 확보)',
    zone_types: ['all'],
  },
  cross_sell_proximity: {
    description: '연관상품 근접 배치',
    zone_types: ['product_zones'],
  },
  negative_space_balance: {
    description: '여백 균형으로 시각적 여유 확보',
    zone_types: ['premium_zones', 'display_areas'],
  },
};

// ============================================================================
// Structured Output용 JSON Schema 정의
// ============================================================================

/**
 * Gemini/OpenAI Structured Output용 JSON Schema
 */
export const RETAIL_OPTIMIZATION_SCHEMA = {
  type: 'object',
  required: ['furniture_changes', 'product_changes', 'summary'],
  additionalProperties: false,

  properties: {
    // ============================================================
    // 1. 추론 요약 (간결하게)
    // ============================================================
    reasoning_summary: {
      type: 'string',
      description: '핵심 최적화 전략 요약 (500자 이내)',
    },

    // ============================================================
    // 2. 가구 변경
    // ============================================================
    furniture_changes: {
      type: 'array',
      description: '가구 배치 변경 목록',
      items: {
        type: 'object',
        required: ['furniture_id', 'furniture_type', 'current', 'suggested',
                   'reason', 'priority', 'vmd_principle', 'expected_impact'],
        properties: {
          furniture_id: {
            type: 'string',
            description: '가구 UUID (데이터에서 정확히 가져올 것)'
          },
          furniture_type: {
            type: 'string',
            enum: FURNITURE_TYPES as unknown as string[],
            description: '가구 타입'
          },
          movable: {
            type: 'boolean',
            description: '이동 가능 여부 (false면 변경 불가)'
          },

          current: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },

          suggested: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },

          vmd_principle: {
            type: 'string',
            enum: VMD_PRINCIPLES as unknown as string[],
            description: '적용된 VMD 원칙'
          },

          reason: {
            type: 'string',
            description: '변경 이유 (데이터 기반 근거 포함)'
          },

          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: '우선순위'
          },

          expected_impact: {
            type: 'object',
            required: ['traffic_change', 'confidence'],
            properties: {
              traffic_change: {
                type: 'number',
                description: '트래픽 변화율 (-0.5 ~ 0.5)'
              },
              dwell_time_change: {
                type: 'number',
                description: '체류시간 변화율'
              },
              visibility_score: {
                type: 'number',
                description: '가시성 점수 (0-100)'
              },
              confidence: {
                type: 'number',
                description: '예측 신뢰도 (0-1)'
              },
            },
          },

          risk_level: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: '리스크 수준'
          },

          implementation_difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            description: '구현 난이도'
          },
        },
      },
    },

    // ============================================================
    // 3. 상품 변경
    // ============================================================
    product_changes: {
      type: 'array',
      description: '상품 배치 변경 목록',
      items: {
        type: 'object',
        required: ['product_id', 'sku', 'current', 'suggested',
                   'reason', 'priority', 'placement_strategy', 'expected_impact'],
        properties: {
          product_id: {
            type: 'string',
            description: '상품 UUID (데이터에서 정확히 가져올 것)'
          },
          sku: {
            type: 'string',
            description: '상품 SKU'
          },

          current: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              shelf_level: {
                type: 'string',
                enum: SHELF_LEVELS as unknown as string[],
                description: '선반 레벨 (VMD 골든존 분석용)'
              },
            },
          },

          suggested: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              shelf_level: {
                type: 'string',
                enum: SHELF_LEVELS as unknown as string[],
                description: '선반 레벨 (VMD 골든존 분석용)'
              },
            },
          },

          placement_strategy: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
                enum: PLACEMENT_STRATEGIES as unknown as string[],
                description: '적용된 배치 전략'
              },
              associated_products: {
                type: 'array',
                items: { type: 'string' },
                description: '연관 상품 ID (크로스셀인 경우)'
              },
              association_rule: {
                type: 'object',
                properties: {
                  confidence: {
                    type: 'number',
                    description: '연관규칙 신뢰도 (0-1)'
                  },
                  lift: {
                    type: 'number',
                    description: '연관규칙 리프트 (1 이상)'
                  },
                  support: {
                    type: 'number',
                    description: '연관규칙 지지도 (0-1)'
                  },
                },
              },
            },
          },

          reason: {
            type: 'string',
            description: '변경 이유 (데이터 기반 근거 포함)'
          },

          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: '우선순위'
          },

          expected_impact: {
            type: 'object',
            required: ['revenue_change', 'confidence'],
            properties: {
              revenue_change: {
                type: 'number',
                description: '매출 변화율 (-0.5 ~ 1.0)'
              },
              visibility_change: {
                type: 'number',
                description: '가시성 변화율'
              },
              conversion_change: {
                type: 'number',
                description: '전환율 변화율'
              },
              units_per_transaction_change: {
                type: 'number',
                description: '객단가 변화'
              },
              confidence: {
                type: 'number',
                description: '예측 신뢰도 (0-1)'
              },
            },
          },

          slot_compatibility: {
            type: 'object',
            properties: {
              is_compatible: {
                type: 'boolean',
                description: '슬롯 호환 여부'
              },
              display_type_match: {
                type: 'boolean',
                description: '디스플레이 타입 일치 여부'
              },
              size_fit: {
                type: 'string',
                enum: ['exact', 'acceptable', 'tight'],
                description: '사이즈 적합도'
              },
            },
          },
        },
      },
    },

    // ============================================================
    // 4. 종합 요약
    // ============================================================
    summary: {
      type: 'object',
      required: ['total_furniture_changes', 'total_product_changes',
                 'expected_revenue_improvement', 'expected_conversion_improvement',
                 'confidence_score', 'ai_insights'],
      properties: {
        total_furniture_changes: {
          type: 'integer',
          description: '총 가구 변경 수'
        },
        total_product_changes: {
          type: 'integer',
          description: '총 상품 변경 수'
        },

        expected_revenue_improvement: {
          type: 'number',
          description: '예상 매출 증가율 (0.05 = 5%)'
        },
        expected_traffic_improvement: {
          type: 'number',
          description: '예상 트래픽 변화율'
        },
        expected_conversion_improvement: {
          type: 'number',
          description: '예상 전환율 개선율'
        },
        expected_dwell_time_improvement: {
          type: 'number',
          description: '예상 체류시간 증가율 (0.05 = 5%)'
        },

        confidence_score: {
          type: 'number',
          description: '전체 추천 신뢰도 (0-1)'
        },

        key_strategies: {
          type: 'array',
          items: { type: 'string' },
          description: '핵심 전략 (3개 이내)'
        },

        ai_insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'AI 인사이트 (3-5개, VMD 원칙/배치 전략/연관 규칙/병목 해소 등 구체적 데이터 포함)'
        },

        issues_addressed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue_id: { type: 'string' },
              issue_type: { type: 'string' },
              resolution_approach: { type: 'string' },
              expected_resolution_rate: { type: 'number' },
            },
          },
          description: '해결된 이슈 (시뮬레이션 연계)'
        },

        risk_factors: {
          type: 'array',
          items: { type: 'string' },
          description: '리스크 요인 (3개 이내)'
        },

        environmental_adaptations: {
          type: 'array',
          items: { type: 'string' },
          description: '환경 적응 (시나리오 반영)'
        },
      },
    },
  },
};

/**
 * Staffing 최적화용 스키마 확장
 */
export const STAFFING_OPTIMIZATION_SCHEMA = {
  type: 'object',
  required: ['staffPositions', 'zoneCoverage', 'metrics', 'insights'],
  properties: {
    staffPositions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['staffId', 'role', 'currentPosition', 'suggestedPosition',
                   'assignment_strategy', 'reason'],
        properties: {
          staffId: { type: 'string' },
          staffCode: { type: 'string' },
          staffName: { type: 'string' },
          role: {
            type: 'string',
            enum: STAFF_ROLES as unknown as string[],
          },
          currentPosition: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          suggestedPosition: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
            },
          },
          current_zone: { type: 'string' },
          suggested_zone: { type: 'string' },
          assignment_strategy: {
            type: 'string',
            enum: STAFFING_STRATEGIES as unknown as string[],
            description: '배치 전략'
          },
          coverageGain: {
            type: 'number',
            description: '커버리지 개선율 (%)'
          },
          reason: { type: 'string' },
        },
      },
    },

    zoneCoverage: {
      type: 'array',
      items: {
        type: 'object',
        required: ['zoneId', 'zoneName', 'currentCoverage', 'suggestedCoverage'],
        properties: {
          zoneId: { type: 'string' },
          zoneName: { type: 'string' },
          currentCoverage: { type: 'number' },
          suggestedCoverage: { type: 'number' },
          requiredStaff: { type: 'integer' },
          currentStaff: { type: 'integer' },
        },
      },
    },

    metrics: {
      type: 'object',
      required: ['totalCoverage', 'coverageGain', 'customerServiceRateIncrease'],
      properties: {
        totalCoverage: { type: 'number' },
        avgResponseTime: { type: 'number' },
        coverageGain: { type: 'number' },
        customerServiceRateIncrease: { type: 'number' },
      },
    },

    insights: {
      type: 'array',
      items: { type: 'string' },
      description: 'AI 인사이트 (3-5개)'
    },

    confidence: {
      type: 'number',
      description: '추천 신뢰도 (0-1)'
    },
  },
};

// ============================================================================
// API 요청용 response_format 객체 생성 함수
// ============================================================================

/**
 * Gemini/OpenAI API용 response_format 생성
 */
export function createResponseFormat(optimizationType: string): {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: typeof RETAIL_OPTIMIZATION_SCHEMA | typeof STAFFING_OPTIMIZATION_SCHEMA;
  };
} {
  if (optimizationType === 'staffing') {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'staffing_optimization_result',
        strict: true,
        schema: STAFFING_OPTIMIZATION_SCHEMA,
      },
    };
  }

  return {
    type: 'json_schema',
    json_schema: {
      name: 'retail_optimization_result',
      strict: true,
      schema: RETAIL_OPTIMIZATION_SCHEMA,
    },
  };
}

/**
 * 간단한 JSON object 모드 (fallback)
 */
export function createSimpleJsonFormat(): { type: 'json_object' } {
  return { type: 'json_object' };
}

// ============================================================================
// 스키마 검증 함수
// ============================================================================

/**
 * AI 응답이 스키마를 준수하는지 검증
 */
export function validateOptimizationResponse(
  response: any,
  optimizationType: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!response.furniture_changes && optimizationType !== 'staffing') {
    errors.push('furniture_changes 필드 누락');
  }
  if (!response.product_changes && optimizationType !== 'staffing') {
    errors.push('product_changes 필드 누락');
  }
  if (!response.summary) {
    errors.push('summary 필드 누락');
  }

  // 가구 변경 검증
  if (response.furniture_changes) {
    for (const fc of response.furniture_changes) {
      if (!fc.furniture_id) {
        errors.push('가구 변경에 furniture_id 누락');
      }
      if (fc.vmd_principle && !VMD_PRINCIPLES.includes(fc.vmd_principle)) {
        errors.push(`유효하지 않은 vmd_principle: ${fc.vmd_principle}`);
      }
    }
  }

  // 상품 변경 검증
  if (response.product_changes) {
    for (const pc of response.product_changes) {
      if (!pc.product_id) {
        errors.push('상품 변경에 product_id 누락');
      }
      if (pc.placement_strategy?.type && !PLACEMENT_STRATEGIES.includes(pc.placement_strategy.type)) {
        errors.push(`유효하지 않은 placement_strategy: ${pc.placement_strategy.type}`);
      }
    }
  }

  // summary 검증
  if (response.summary) {
    const s = response.summary;
    if (typeof s.expected_revenue_improvement !== 'number') {
      errors.push('summary.expected_revenue_improvement 누락 또는 타입 오류');
    }
    if (typeof s.confidence_score !== 'number') {
      errors.push('summary.confidence_score 누락 또는 타입 오류');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  RETAIL_OPTIMIZATION_SCHEMA,
  STAFFING_OPTIMIZATION_SCHEMA,
  VMD_PRINCIPLES,
  PLACEMENT_STRATEGIES,
  STAFFING_STRATEGIES,
  FURNITURE_TYPES,
  SHELF_LEVELS,
  STAFF_ROLES,
  PLACEMENT_STRATEGY_CODEBOOK,
  VMD_PRINCIPLE_CODEBOOK,
  createResponseFormat,
  createSimpleJsonFormat,
  validateOptimizationResponse,
};
