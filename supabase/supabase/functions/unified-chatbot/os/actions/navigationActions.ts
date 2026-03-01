/**
 * 네비게이션 관련 액션 처리
 * Phase 2-A: navigate 액션
 * Phase 2-B: set_tab, set_date_range, composite_navigate 추가
 * Phase 3-B+: scroll_to_section, open_modal, highlight_element 추가
 */

import { ClassificationResult } from '../intent/classifier.ts';
import { MODAL_MAP } from '../config/dashboardStructure.ts';

// ============================================
// 확장된 UIAction 타입 정의
// ============================================

export type UIAction =
  // 기존 액션
  | { type: 'navigate'; target: string }
  | { type: 'set_tab'; target: string }
  | {
      type: 'set_date_range';
      preset?: string;
      startDate?: string;
      endDate?: string;
      target?: { startDate: string; endDate: string };
    }

  // 신규 액션 (Phase 3-B+)
  | {
      type: 'scroll_to_section';
      sectionId: string;
      highlight?: boolean;
      highlightDuration?: number;
    }
  | {
      type: 'scroll_to_component';
      componentId: string;
      highlight?: boolean;
    }
  | {
      type: 'open_modal';
      modalId: string;
      params?: Record<string, any>;
    }
  | {
      type: 'open_dialog';
      dialogId: string;
      params?: Record<string, any>;
    }
  | {
      type: 'highlight_element';
      elementId: string;
      duration?: number;
    }
  | {
      type: 'show_tooltip';
      targetId: string;
      message: string;
      position?: 'top' | 'bottom' | 'left' | 'right';
    }
  | { type: 'run_simulation'; [key: string]: any }
  | { type: 'run_optimization'; [key: string]: any }
  // ROI 테이블 제어 액션
  | {
      type: 'set_filter';
      filterId: string;
      value: string;
    }
  | {
      type: 'trigger_export';
      exportType?: string;
    }
  | {
      type: 'set_table_page';
      page: number | 'next' | 'prev';
    }

  // ============================================
  // 디지털트윈 스튜디오 제어 액션
  // ============================================

  // 오버레이 토글 (히트맵, 동선, 고객, 존, 직원)
  | {
      type: 'toggle_overlay';
      overlay: 'heatmap' | 'flow' | 'avatar' | 'zone' | 'staff';
      visible?: boolean; // 생략 시 토글, true/false면 명시적 설정
    }

  // 시뮬레이션 제어 (재생/일시정지/정지/리셋/속도)
  | {
      type: 'simulation_control';
      command: 'play' | 'pause' | 'stop' | 'reset' | 'set_speed';
      speed?: number; // set_speed일 때 0.5~4.0
    }

  // 프리셋 시나리오 적용
  | {
      type: 'apply_preset';
      preset: string; // PresetScenarioId
    }

  // 시뮬레이션 파라미터 설정
  | {
      type: 'set_simulation_params';
      params: {
        simulation_type?: 'realtime' | 'prediction';
        customer_count?: number;
        duration?: number;
      };
    }

  // 최적화 목표/옵션 설정
  | {
      type: 'set_optimization_config';
      config: {
        goal?: 'revenue' | 'dwell_time' | 'traffic' | 'conversion';
        types?: ('layout' | 'staffing')[];
        intensity?: 'low' | 'medium' | 'high';
      };
    }

  // 뷰 모드 전환 (As-Is / Compare / To-Be)
  | {
      type: 'set_view_mode';
      mode: 'as-is' | 'compare' | 'to-be';
    }

  // 패널 토글 (AI 리포트, 씬 저장)
  | {
      type: 'toggle_panel';
      panel: 'resultReport' | 'sceneSave';
      visible?: boolean;
    }

  // 씬 저장
  | {
      type: 'save_scene';
      name?: string;
    }

  // 환경 설정 (날씨, 시간대, 휴일)
  | {
      type: 'set_environment';
      weather?: string;
      timeOfDay?: string;
      holidayType?: string;
    };

export interface ActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
}

// ============================================
// 한글명 매핑
// ============================================

const PAGE_NAMES: Record<string, string> = {
  '/insights': '인사이트 허브',
  '/studio': '디지털트윈 스튜디오',
  '/roi': 'ROI 측정',
  '/settings': '설정',
  '/data/control-tower': '데이터 컨트롤타워',
};

const TAB_NAMES: Record<string, string> = {
  'overview': '개요',
  'store': '매장',
  'customer': '고객',
  'product': '상품',
  'inventory': '재고',
  'prediction': '예측',
  'ai': 'AI추천',
  'stores': '매장 관리',
  'data': '데이터',
  'users': '사용자',
  'system': '시스템',
  'license': '플랜',
  'layer': '레이어',
  'ai-simulation': 'AI 시뮬레이션',
  'ai-optimization': 'AI 최적화',
  'apply': '적용',
};

const SECTION_NAMES: Record<string, string> = {
  'kpi-cards': 'KPI 카드',
  'goal-achievement': '목표 달성률',
  'trend-chart': '트렌드 차트',
  'daily-summary': '일별 요약',
  'customer-kpi': '고객 KPI',
  'customer-segments': '고객 세그먼트',
  'zone-heatmap': '구역별 히트맵',
  'traffic-flow': '동선 분석',
  'inventory-status': '재고 현황',
  'stock-alerts': '재고 알림',
  'sales-ranking': '판매 순위',
  'product-performance': '상품 성과',
};

const MODAL_NAMES: Record<string, string> = {
  'goal-settings': '목표 설정',
  'date-picker': '날짜 선택',
  'export-data': '데이터 내보내기',
  'simulation-config': '시뮬레이션 설정',
  'optimization-config': '최적화 설정',
  'new-connection': '새 데이터 연결',
  'add-store': '매장 추가',
  'invite-user': '사용자 초대',
  'plan-upgrade': '플랜 업그레이드',
};

// ============================================
// 인텐트 핸들러들
// ============================================

/**
 * navigate 인텐트 처리
 */
export function handleNavigate(
  classification: ClassificationResult
): ActionResult {
  const targetPage = classification.entities.page;

  if (!targetPage) {
    return {
      actions: [],
      message: '어느 페이지로 이동할까요? 인사이트 허브, 스튜디오, ROI 측정, 설정 중에서 선택해주세요.',
      suggestions: [
        '인사이트 허브로 이동',
        '스튜디오 열어줘',
        'ROI 측정 페이지 보여줘',
      ],
    };
  }

  const pageName = PAGE_NAMES[targetPage] || targetPage;

  return {
    actions: [
      {
        type: 'navigate',
        target: targetPage,
      },
    ],
    message: `${pageName} 페이지로 이동합니다.`,
    suggestions: getSuggestionsForPage(targetPage),
  };
}

/**
 * set_tab 인텐트 처리
 */
export function handleSetTab(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  const tab = classification.entities.tab;
  const inferredPage = classification.entities.inferredPage;

  if (!tab) {
    return {
      actions: [],
      message: '어느 탭을 열까요? 고객, 매장, 상품, 재고, 예측, AI추천 중에서 선택해주세요.',
      suggestions: ['고객탭 보여줘', '매장탭 열어줘', '예측탭 보여줘'],
    };
  }

  const tabName = TAB_NAMES[tab] || tab;
  const targetPage = inferredPage || currentPage || '/insights';

  // URL 쿼리 파라미터 방식으로 탭 전환
  const targetUrl = `${targetPage}?tab=${tab}`;

  return {
    actions: [
      {
        type: 'navigate',
        target: targetUrl,
      },
    ],
    message: `${tabName} 탭으로 이동합니다.`,
    suggestions: getSuggestionsForTab(tab),
  };
}

/**
 * set_date_range 인텐트 처리
 */
export function handleSetDateRange(
  classification: ClassificationResult
): ActionResult {
  const { datePreset, dateStart, dateEnd } = classification.entities;

  if (!datePreset && !dateStart) {
    return {
      actions: [],
      message: '어떤 기간으로 설정할까요? 오늘, 7일, 30일, 90일 또는 직접 날짜를 입력해주세요.',
      suggestions: ['오늘 데이터로 변경', '최근 7일로 설정', '11/4~11/15 기간으로'],
    };
  }

  const actions: UIAction[] = [];
  let message = '';

  if (datePreset) {
    actions.push({
      type: 'set_date_range',
      preset: datePreset,
    });

    const presetName: Record<string, string> = {
      'today': '오늘',
      'yesterday': '어제',
      '7d': '최근 7일',
      '30d': '최근 30일',
      '90d': '최근 90일',
      '365d': '최근 1년',
      'thisWeek': '이번 주',
      'lastWeek': '지난 주',
      'thisMonth': '이번 달',
      'lastMonth': '지난 달',
      'thisQuarter': '이번 분기',
      'thisYear': '올해',
    };

    message = `기간을 ${presetName[datePreset] || datePreset}로 설정합니다.`;
  } else if (dateStart && dateEnd) {
    actions.push({
      type: 'set_date_range',
      startDate: dateStart,
      endDate: dateEnd,
    });
    message = `기간을 ${dateStart} ~ ${dateEnd}로 설정합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 확인해줘', '고객 분석 보여줘', '인사이트 허브로 이동'],
  };
}

/**
 * scroll_to_section 인텐트 처리 (신규)
 */
export function handleScrollToSection(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  const sectionId = classification.entities.section;

  if (!sectionId) {
    return {
      actions: [],
      message: '어느 섹션으로 이동할까요?',
      suggestions: ['KPI 카드 보여줘', '트렌드 차트 확인', '목표 달성률 보기'],
    };
  }

  const sectionName = SECTION_NAMES[sectionId] || sectionId;

  return {
    actions: [
      {
        type: 'scroll_to_section',
        sectionId,
        highlight: true,
        highlightDuration: 2000,
      },
    ],
    message: `${sectionName} 섹션으로 이동합니다.`,
    suggestions: getSuggestionsForSection(sectionId),
  };
}

/**
 * open_modal 인텐트 처리 (신규)
 */
export function handleOpenModal(
  classification: ClassificationResult
): ActionResult {
  const modalId = classification.entities.modalId;

  if (!modalId) {
    return {
      actions: [],
      message: '어떤 설정을 열까요?',
      suggestions: ['목표 설정', '데이터 내보내기', '사용자 초대'],
    };
  }

  const modalName = MODAL_NAMES[modalId] || modalId;
  const modalConfig = MODAL_MAP[modalId];

  const actions: UIAction[] = [];

  // 모달이 특정 페이지/탭에 있는 경우 먼저 네비게이션
  if (modalConfig && modalConfig.page !== '*') {
    let targetUrl = modalConfig.page;
    if (modalConfig.tab) {
      targetUrl = `${modalConfig.page}?tab=${modalConfig.tab}`;
    }
    actions.push({
      type: 'navigate',
      target: targetUrl,
    });
  }

  // 모달 열기
  actions.push({
    type: 'open_modal',
    modalId,
  });

  return {
    actions,
    message: `${modalName} 창을 엽니다.`,
    suggestions: getSuggestionsForModal(modalId),
  };
}

/**
 * composite_navigate 인텐트 처리 (복합)
 */
export function handleCompositeNavigate(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  const actions: UIAction[] = [];
  const messages: string[] = [];

  const { page, tab, inferredPage, datePreset, dateStart, dateEnd } = classification.entities;

  // 1. 페이지 이동
  const targetPage = page || inferredPage || currentPage;
  if (targetPage && targetPage !== currentPage) {
    let targetUrl = targetPage;

    // 2. 탭 설정 (URL 쿼리 파라미터)
    if (tab) {
      targetUrl = `${targetPage}?tab=${tab}`;
      const tabName = TAB_NAMES[tab] || tab;
      messages.push(`${PAGE_NAMES[targetPage] || targetPage}의 ${tabName} 탭`);
    } else {
      messages.push(`${PAGE_NAMES[targetPage] || targetPage} 페이지`);
    }

    actions.push({
      type: 'navigate',
      target: targetUrl,
    });
  } else if (tab) {
    // 페이지 이동 없이 탭만 변경
    const targetUrl = `${currentPage || '/insights'}?tab=${tab}`;
    const tabName = TAB_NAMES[tab] || tab;
    messages.push(`${tabName} 탭`);

    actions.push({
      type: 'navigate',
      target: targetUrl,
    });
  }

  // 3. 날짜 범위 설정
  if (datePreset) {
    actions.push({
      type: 'set_date_range',
      preset: datePreset,
    });
    const presetName: Record<string, string> = {
      'today': '오늘',
      '7d': '최근 7일',
      '30d': '최근 30일',
      '90d': '최근 90일',
      'thisWeek': '이번 주',
      'lastWeek': '지난 주',
      'thisMonth': '이번 달',
      'lastMonth': '지난 달',
    };
    messages.push(`기간: ${presetName[datePreset] || datePreset}`);
  } else if (dateStart && dateEnd) {
    actions.push({
      type: 'set_date_range',
      startDate: dateStart,
      endDate: dateEnd,
    });
    messages.push(`기간: ${dateStart}~${dateEnd}`);
  }

  return {
    actions,
    message: messages.length > 0
      ? `${messages.join(', ')}(으)로 이동합니다.`
      : '이동할 위치를 파악하지 못했어요. 다시 말씀해주세요.',
    suggestions: ['오늘 매출 얼마야?', '시뮬레이션 돌려줘'],
  };
}

// ============================================
// 제안 생성 함수들
// ============================================

function getSuggestionsForPage(page: string): string[] {
  switch (page) {
    case '/insights':
      return [
        '고객탭 보여줘',
        '오늘 매출 얼마야?',
        '최근 7일 데이터로 변경해줘',
      ];
    case '/studio':
      return [
        'AI 시뮬레이션 탭 열어줘',
        '시뮬레이션 돌려줘',
        '최적화 해줘',
      ];
    case '/roi':
      return [
        'ROI 요약 보여줘',
        '적용된 전략 이력 보여줘',
        '카테고리별 성과 보여줘',
      ];
    case '/settings':
      return [
        '매장 관리 탭 열어줘',
        '사용자 목록 보여줘',
        '현재 플랜 확인해줘',
      ];
    case '/data/control-tower':
      return [
        '새 연결 추가해줘',
        '데이터 품질 확인해줘',
      ];
    default:
      return [];
  }
}

function getSuggestionsForTab(tab: string): string[] {
  switch (tab) {
    case 'customer':
      return ['고객 세그먼트 분석해줘', '방문객 수 알려줘'];
    case 'store':
      return ['존별 성과 보여줘', '히트맵 분석해줘'];
    case 'product':
      return ['베스트셀러 보여줘', '상품별 매출 알려줘'];
    case 'inventory':
      return ['재고 현황 보여줘', '부족 재고 알려줘'];
    case 'prediction':
      return ['내일 예측 보여줘', '주간 예측 알려줘'];
    case 'ai':
    case 'ai-recommendation':
      return ['AI 추천 전략 보여줘', '적용 가능한 전략 알려줘'];
    case 'ai-simulation':
      return ['시뮬레이션 돌려줘', '시나리오 추가해줘'];
    case 'ai-optimization':
      return ['최적화 실행해줘', '최적화 결과 보여줘'];
    default:
      return ['매출 알려줘', '데이터 분석해줘'];
  }
}

function getSuggestionsForSection(sectionId: string): string[] {
  switch (sectionId) {
    case 'kpi-cards':
      return ['매출 알려줘', '방문객 수 확인', '전환율 어때?'];
    case 'goal-achievement':
      return ['목표 설정하기', '목표 달성률 어때?'];
    case 'trend-chart':
      return ['최근 7일 트렌드', '매출 추이 확인'];
    case 'customer-kpi':
      return ['체류 시간 알려줘', '신규/재방문 비율'];
    case 'zone-heatmap':
      return ['인기 구역 확인', '동선 분석 보기'];
    case 'inventory-status':
      return ['부족 재고 확인', '발주 제안 보기'];
    case 'sales-ranking':
      return ['베스트셀러 확인', '카테고리별 분석'];
    default:
      return ['매출 알려줘', '고객 분석 보기'];
  }
}

function getSuggestionsForModal(modalId: string): string[] {
  switch (modalId) {
    case 'goal-settings':
      return ['목표 달성률 확인', '개요탭으로 이동'];
    case 'export-data':
      return ['인사이트 허브로 이동', '데이터 분석 보기'];
    case 'simulation-config':
      return ['시뮬레이션 실행', '결과 확인'];
    case 'invite-user':
      return ['사용자 관리', '설정으로 이동'];
    case 'new-connection':
      return ['연결된 소스 확인', '데이터 품질 점수 확인', '인사이트 허브로 이동'];
    default:
      return ['인사이트 허브로 이동', '매출 확인'];
  }
}

// ============================================
// 액션 디스패처
// ============================================

export function dispatchNavigationAction(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  switch (classification.intent) {
    case 'navigate':
      return handleNavigate(classification);

    case 'set_tab':
      return handleSetTab(classification, currentPage);

    case 'set_date_range':
      return handleSetDateRange(classification);

    case 'composite_navigate':
      return handleCompositeNavigate(classification, currentPage);

    case 'scroll_to_section':
      return handleScrollToSection(classification, currentPage);

    case 'open_modal':
      return handleOpenModal(classification);

    default:
      return {
        actions: [],
        message: '',
        suggestions: [],
      };
  }
}
