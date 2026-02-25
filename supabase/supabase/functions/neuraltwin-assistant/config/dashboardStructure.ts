/**
 * 대시보드 구조 정의
 * - 페이지-탭-섹션 계층 구조
 * - 용어-위치 매핑
 * - 모달/팝업 정의
 *
 * 인텐트 강화를 위한 핵심 컨텍스트 제공
 */

// ============================================
// 1. 페이지-탭-섹션 계층 구조
// ============================================

export interface DashboardComponent {
  id: string;
  name: string;
  aliases: string[];
  requires?: string;  // 필요한 설정/데이터
  fallbackAction?: string;  // 조건 미충족 시 액션
}

export interface DashboardSection {
  id: string;
  name: string;
  components?: DashboardComponent[];
}

export interface DashboardTab {
  id: string;
  name: string;
  aliases: string[];
  sections?: DashboardSection[];
}

export interface DashboardPage {
  path: string;
  name: string;
  aliases: string[];
  tabs?: DashboardTab[];
  sections?: DashboardSection[];
}

export const DASHBOARD_STRUCTURE: DashboardPage[] = [
  {
    path: '/data/control-tower',
    name: '데이터 컨트롤타워',
    aliases: ['컨트롤타워', '데이터 컨트롤', 'data control tower', '데이터컨트롤타워'],
    sections: [
      {
        id: 'data-quality',
        name: '데이터 품질 점수',
        components: [
          { id: 'quality-score-card', name: '품질 점수 카드', aliases: ['품질 점수', '데이터 품질', '품질'] },
        ],
      },
      {
        id: 'data-sources',
        name: '데이터 소스',
        components: [
          { id: 'connection-list', name: '연결 목록', aliases: ['데이터 연결', '소스 목록'] },
          { id: 'add-connection', name: '새 연결 추가', aliases: ['연결 추가', '소스 추가'] },
          { id: 'business-sources', name: '비즈니스 데이터 소스', aliases: ['비즈니스 소스', 'POS', '센서'] },
          { id: 'context-sources', name: '컨텍스트 데이터 소스', aliases: ['컨텍스트 소스', '날씨', '공휴일'] },
        ],
      },
      {
        id: 'data-import',
        name: '데이터 임포트',
        components: [
          { id: 'import-widget', name: '데이터 임포트 위젯', aliases: ['임포트', '파일 업로드'] },
          { id: 'import-history', name: '임포트 히스토리', aliases: ['임포트 내역', '업로드 이력'] },
        ],
      },
      {
        id: 'api-connections',
        name: 'API 연결',
        components: [
          { id: 'api-list', name: 'API 연결 목록', aliases: ['API 목록', 'API 현황'] },
        ],
      },
      {
        id: 'pipeline',
        name: '데이터 흐름',
        components: [
          { id: 'pipeline-timeline', name: '파이프라인 타임라인', aliases: ['데이터 흐름', '파이프라인', 'ETL'] },
        ],
      },
      {
        id: 'model-upload',
        name: '3D 모델 업로드',
        components: [
          { id: '3d-upload', name: '3D 모델 업로드', aliases: ['모델 업로드', '3D 업로드', 'GLB 업로드'] },
        ],
      },
    ],
  },
  {
    path: '/insights',
    name: '인사이트 허브',
    aliases: ['인사이트', 'insight', 'insights', '인사이트허브'],
    tabs: [
      {
        id: 'overview',
        name: '개요',
        aliases: ['개요탭', 'overview', '오버뷰', '전체'],
        sections: [
          {
            id: 'overview-kpi-cards',
            name: 'KPI 카드 섹션',
            components: [
              { id: 'total-footfall', name: '총 입장', aliases: ['입장객', 'footfall', '총 방문'] },
              { id: 'unique-visitors', name: '순 방문객', aliases: ['방문객', 'visitors', '고객수', '방문자'] },
              { id: 'total-revenue', name: '총 매출', aliases: ['매출', 'revenue', '수익', '매상'] },
              { id: 'conversion-rate', name: '전환율', aliases: ['conversion', '구매전환', '전환'] },
              { id: 'avg-transaction', name: '평균 객단가', aliases: ['객단가', '거래금액', '객단'] },
              { id: 'visit-frequency', name: '방문 빈도', aliases: ['방문빈도', '방문 주기'] },
            ],
          },
          {
            id: 'overview-funnel',
            name: '고객 여정 퍼널',
            components: [
              { id: 'funnel-chart', name: '퍼널 차트', aliases: ['퍼널', '고객 여정', '전환 퍼널'] },
            ],
          },
          {
            id: 'overview-goals',
            name: '목표 달성률 & AI 추천 효과',
            components: [
              {
                id: 'goal-card',
                name: '목표 달성률 카드',
                aliases: ['목표 달성', '목표', 'goal', '달성률'],
                requires: 'goal_settings',
                fallbackAction: 'open_goal_settings_modal',
              },
              { id: 'ai-effect', name: 'AI 추천 효과', aliases: ['추천 효과', 'AI 효과'] },
            ],
          },
          {
            id: 'overview-insights',
            name: '오늘의 AI 인사이트',
            components: [
              { id: 'daily-insight', name: 'AI 인사이트', aliases: ['인사이트', '오늘의 인사이트'] },
            ],
          },
        ],
      },
      {
        id: 'store',
        name: '매장',
        aliases: ['매장탭', 'store', '스토어', '매장분석'],
        sections: [
          {
            id: 'store-kpi-cards',
            name: '매장 KPI 카드',
            components: [
              { id: 'peak-time', name: '피크타임', aliases: ['피크시간', '가장 바쁜 시간'] },
              { id: 'popular-zone', name: '인기 존', aliases: ['인기 구역', '인기 매장'] },
              { id: 'avg-dwell', name: '평균 체류시간', aliases: ['체류시간', '평균 체류'] },
              { id: 'tracking-coverage', name: '센서 커버율', aliases: ['센서 커버리지', '트래킹'] },
            ],
          },
          {
            id: 'store-hourly-pattern',
            name: '시간대별 방문 패턴',
            components: [
              { id: 'hourly-chart', name: '시간대별 차트', aliases: ['시간별 방문', '시간대 패턴'] },
            ],
          },
          {
            id: 'store-zone-dwell',
            name: '존 체류시간',
            components: [
              { id: 'zone-dwell-chart', name: '존 체류시간 차트', aliases: ['존 체류', '구역 체류시간'] },
            ],
          },
          {
            id: 'store-zone-distribution',
            name: '존 방문자 분포',
            components: [
              { id: 'zone-visitor-chart', name: '존 방문자 분포 차트', aliases: ['존 분포', '구역별 방문'] },
            ],
          },
          {
            id: 'store-zone-performance',
            name: '존 성과 비교',
            components: [
              { id: 'zone-compare', name: '존 성과 비교', aliases: ['존 비교', '구역 성과'] },
            ],
          },
        ],
      },
      {
        id: 'customer',
        name: '고객',
        aliases: ['고객탭', 'customer', '고객분석', '고객 분석'],
        sections: [
          {
            id: 'customer-kpi-cards',
            name: '고객 KPI',
            components: [
              { id: 'unique-visitors', name: '순 방문객', aliases: ['방문객', 'visitors', '방문자 수'] },
              { id: 'repeat-rate', name: '재방문율', aliases: ['리피트율', '재방문 비율'] },
              { id: 'top-segment', name: '주요 세그먼트', aliases: ['세그먼트', '고객 유형'] },
              { id: 'loyal-customers', name: '충성 고객', aliases: ['단골', 'VIP 고객', '로열 고객'] },
            ],
          },
          {
            id: 'customer-segment-distribution',
            name: '고객 세그먼트 분포',
            components: [
              { id: 'segment-pie', name: '세그먼트 분포 차트', aliases: ['고객 분류', '세그먼트 차트'] },
            ],
          },
          {
            id: 'customer-avg-purchase',
            name: '세그먼트별 평균 구매',
            components: [
              { id: 'avg-purchase-chart', name: '평균 구매 차트', aliases: ['구매 금액', '세그먼트 구매'] },
            ],
          },
          {
            id: 'customer-return-trend',
            name: '재방문 추이',
            components: [
              { id: 'return-trend-chart', name: '재방문 추이 차트', aliases: ['재방문 트렌드'] },
            ],
          },
        ],
      },
      {
        id: 'product',
        name: '상품',
        aliases: ['상품탭', 'product', '상품분석', '상품 분석'],
        sections: [
          {
            id: 'product-kpi-cards',
            name: '상품 KPI 카드',
            components: [
              { id: 'total-revenue', name: '총 매출', aliases: ['매출', '상품 매출'] },
              { id: 'total-units', name: '총 판매량', aliases: ['판매량', '판매 수량'] },
              { id: 'bestseller', name: '베스트셀러', aliases: ['인기 상품', '최고 판매'] },
              { id: 'low-stock-count', name: '재고 부족', aliases: ['부족 상품', '품절 위험'] },
            ],
          },
          {
            id: 'product-top10',
            name: '상품 매출 TOP 10',
            components: [
              { id: 'top-products-chart', name: 'TOP 10 차트', aliases: ['인기 상품', '매출 순위'] },
            ],
          },
          {
            id: 'product-category-revenue',
            name: '카테고리별 매출 분포',
            components: [
              { id: 'category-revenue-chart', name: '카테고리 매출 차트', aliases: ['카테고리 분석', '카테고리별'] },
            ],
          },
          {
            id: 'product-category-quantity',
            name: '카테고리별 판매 수량',
            components: [
              { id: 'category-quantity-chart', name: '카테고리 수량 차트', aliases: ['카테고리 판매'] },
            ],
          },
        ],
      },
      {
        id: 'inventory',
        name: '재고',
        aliases: ['재고탭', 'inventory', '재고관리', '재고 관리'],
        sections: [
          {
            id: 'inventory-kpi-cards',
            name: '재고 KPI 카드',
            components: [
              { id: 'total-items', name: '총 상품 수', aliases: ['상품 수', '재고 수'] },
              { id: 'low-stock', name: '재고 부족', aliases: ['부족 알림', '재주문 필요'] },
              { id: 'overstock', name: '과잉 재고', aliases: ['과재고', '넘치는 재고'] },
              { id: 'healthy-stock', name: '정상 재고', aliases: ['양호 재고'] },
            ],
          },
          {
            id: 'inventory-distribution',
            name: '재고 상태 분포 차트',
            components: [
              { id: 'stock-distribution-chart', name: '분포 차트', aliases: ['재고 분포', '재고 비율'] },
            ],
          },
          {
            id: 'inventory-category',
            name: '카테고리별 재고 현황',
          },
          {
            id: 'inventory-risk',
            name: '재고 부족 경고 상품',
            components: [
              { id: 'risk-products', name: '위험 상품 목록', aliases: ['부족 상품', '경고 상품'] },
            ],
          },
          {
            id: 'inventory-movements',
            name: '최근 입출고 내역',
            components: [
              { id: 'movement-list', name: '입출고 목록', aliases: ['입고', '출고', '재고 이동'] },
            ],
          },
          {
            id: 'inventory-detail',
            name: '상세 재고 현황 테이블',
          },
        ],
      },
      {
        id: 'prediction',
        name: '예측',
        aliases: ['예측탭', 'prediction', '예측분석', '예측 분석'],
        sections: [
          {
            id: 'prediction-kpi-cards',
            name: '예측 KPI 카드',
            components: [
              { id: 'pred-revenue', name: '예상 매출', aliases: ['매출 예측'] },
              { id: 'pred-visitors', name: '예상 방문자', aliases: ['방문자 예측'] },
              { id: 'pred-conversion', name: '예상 전환율', aliases: ['전환율 예측'] },
              { id: 'pred-confidence', name: '예측 신뢰도', aliases: ['신뢰도', '정확도'] },
            ],
          },
          {
            id: 'prediction-revenue',
            name: '매출 예측 차트',
          },
          {
            id: 'prediction-visitors',
            name: '방문자 예측 차트',
          },
          {
            id: 'prediction-conversion',
            name: '전환율 예측 차트',
          },
          {
            id: 'prediction-daily',
            name: '일별 예측 상세 테이블',
          },
          {
            id: 'prediction-model',
            name: '예측 모델 정보',
          },
        ],
      },
      {
        id: 'ai',
        name: 'AI추천',
        aliases: ['AI추천탭', 'ai-recommendation', 'AI 추천', '추천', 'ai추천'],
        sections: [
          {
            id: 'ai-active-strategies',
            name: '활성 전략',
            components: [
              { id: 'active-list', name: '활성 전략 목록', aliases: ['실행 중 전략', '적용된 전략'] },
            ],
          },
          {
            id: 'ai-predict',
            name: '예측 (수요/방문자/시즌/리스크)',
            components: [
              { id: 'demand-forecast', name: '수요 예측', aliases: ['수요'] },
              { id: 'visitor-forecast', name: '방문자 예측', aliases: ['방문 예측'] },
              { id: 'season-trend', name: '시즌 트렌드', aliases: ['시즌', '계절성'] },
              { id: 'risk-prediction', name: '리스크 예측', aliases: ['위험 예측', '리스크'] },
            ],
          },
          {
            id: 'ai-optimize',
            name: '최적화 (가격/재고)',
            components: [
              { id: 'price-optimization', name: '가격 최적화', aliases: ['가격 전략', '가격 추천'] },
              { id: 'inventory-optimization', name: '재고 최적화', aliases: ['재고 전략', '재고 추천'] },
            ],
          },
          {
            id: 'ai-recommend',
            name: '전략 추천',
            components: [
              { id: 'strategy-list', name: '추천 전략 목록', aliases: ['추천 전략', '새로운 추천'] },
            ],
          },
          {
            id: 'ai-execute',
            name: '실행/캠페인',
            components: [
              { id: 'campaign-list', name: '캠페인 목록', aliases: ['활성 캠페인', '실행 중'] },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/studio',
    name: '디지털트윈 스튜디오',
    aliases: ['스튜디오', 'studio', '디지털트윈', '디지털 트윈'],
    tabs: [
      {
        id: 'layer',
        name: '레이어',
        aliases: ['레이어탭', 'layer', '3D 레이어'],
      },
      {
        id: 'ai-simulation',
        name: 'AI 시뮬레이션',
        aliases: ['시뮬레이션탭', 'simulation', '시뮬레이션', 'ai 시뮬레이션'],
      },
      {
        id: 'ai-optimization',
        name: 'AI 최적화',
        aliases: ['최적화탭', 'optimization', '최적화', 'ai 최적화'],
      },
      {
        id: 'apply',
        name: '적용',
        aliases: ['적용탭', 'apply'],
      },
    ],
  },
  {
    path: '/roi',
    name: 'ROI 측정',
    aliases: ['ROI', 'roi', '알오아이', 'ROI측정', 'ROI 분석', 'roi측정'],
    sections: [
      {
        id: 'roi-summary',
        name: 'ROI 요약 KPI',
        components: [
          { id: 'total-applied', name: '총 적용 전략', aliases: ['적용 전략 수', '총 적용'] },
          { id: 'success-rate', name: '성공률', aliases: ['전략 성공률'] },
          { id: 'average-roi', name: '평균 ROI', aliases: ['ROI 수치', 'ROI 평균'] },
          { id: 'revenue-impact', name: '총 추가매출', aliases: ['매출 효과', '추가 매출'] },
        ],
      },
      {
        id: 'strategy-performance',
        name: '카테고리별 성과',
        components: [
          { id: '2d-simulation', name: '2D 시뮬레이션 성과', aliases: ['인사이트 허브 전략', '2D 성과'] },
          { id: '3d-simulation', name: '3D 시뮬레이션 성과', aliases: ['디지털트윈 전략', '3D 성과'] },
        ],
      },
      {
        id: 'applied-strategies',
        name: '적용된 전략 이력',
        components: [
          { id: 'strategy-table', name: '전략 이력 테이블', aliases: ['적용 이력', '전략 히스토리'] },
        ],
      },
      {
        id: 'roi-analysis',
        name: 'AI 인사이트',
        components: [
          { id: 'ai-insight-card', name: 'AI 분석 인사이트', aliases: ['ROI 인사이트', 'AI 분석'] },
        ],
      },
    ],
  },
  {
    path: '/settings',
    name: '설정 & 관리',
    aliases: ['설정', 'settings', '세팅', '관리'],
    tabs: [
      {
        id: 'stores',
        name: '매장 관리',
        aliases: ['매장관리', '매장설정', 'store-management'],
        sections: [
          {
            id: 'settings-store-list',
            name: '매장 목록',
            components: [
              { id: 'store-table', name: '매장 테이블', aliases: ['매장 목록', '매장 리스트'] },
            ],
          },
        ],
      },
      {
        id: 'data',
        name: '데이터',
        aliases: ['데이터탭', '데이터설정'],
        sections: [
          {
            id: 'settings-data-stats',
            name: '데이터 통계',
            components: [
              { id: 'graph-entities', name: '그래프 엔티티', aliases: ['엔티티', '지식그래프'] },
              { id: 'graph-relations', name: '그래프 관계', aliases: ['관계', '릴레이션'] },
            ],
          },
          {
            id: 'settings-api-connections',
            name: 'API 연결 관리',
            components: [
              { id: 'connector-list', name: '커넥터 목록', aliases: ['API 커넥터', '커넥터'] },
            ],
          },
        ],
      },
      {
        id: 'users',
        name: '사용자',
        aliases: ['사용자탭', '사용자관리', '팀원'],
        sections: [
          {
            id: 'settings-members',
            name: '멤버 관리',
            components: [
              { id: 'member-table', name: '멤버 테이블', aliases: ['사용자 목록', '팀원 목록'] },
            ],
          },
        ],
      },
      {
        id: 'system',
        name: '시스템',
        aliases: ['시스템탭', '시스템설정'],
        sections: [
          {
            id: 'settings-org',
            name: '조직 설정',
            components: [
              { id: 'org-settings', name: '조직 정보', aliases: ['조직', '회사 정보'] },
              { id: 'notification-settings', name: '알림 설정', aliases: ['알림', '노티'] },
            ],
          },
        ],
      },
      {
        id: 'license',
        name: '플랜',
        aliases: ['플랜탭', '구독', '요금제', 'plan'],
        sections: [
          {
            id: 'settings-subscription',
            name: '구독 정보',
            components: [
              { id: 'subscription-info', name: '구독 현황', aliases: ['플랜 현황', '라이선스 현황'] },
              { id: 'license-table', name: '라이선스 목록', aliases: ['라이선스', '라이선스 키'] },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================
// 2. 용어-위치 매핑 (중의성 해소)
// ============================================

export interface TermLocation {
  page: string;
  tab?: string;
  section?: string;
  component?: string;
}

export interface TermLocationEntry {
  primary: TermLocation;
  secondary?: TermLocation[];
  description?: Record<string, string>;
  requires?: string;
  fallback?: {
    message: string;
    action: {
      type: string;
      modalId?: string;
      buttonText?: string;
    };
  };
}

export const TERM_LOCATION_MAP: Record<string, TermLocationEntry> = {
  // ===== 개요(Overview) 탭 용어 =====
  '입장객': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'total-footfall' },
  },
  '총 입장': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'total-footfall' },
  },
  '총입장': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'total-footfall' },
  },
  '순 방문객': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards', component: 'unique-visitors' },
    secondary: [
      { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'unique-visitors' },
    ],
    description: {
      customer: '고객 세그먼트별 상세 분석',
      overview: '전체 트래픽 요약',
    },
  },
  '방문객': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards', component: 'unique-visitors' },
    secondary: [
      { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'unique-visitors' },
    ],
  },
  '매출': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'total-revenue' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
      { page: '/roi', section: 'strategy-performance' },
    ],
    description: {
      overview: '전체 매출 요약',
      product: '상품별 매출 분석',
    },
  },
  '총 매출': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'total-revenue' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
    ],
    description: {
      overview: '전체 매출 요약',
      product: '상품별 매출 분석',
    },
  },
  '전환율': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'conversion-rate' },
    secondary: [
      { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
    ],
    description: {
      overview: '전체 구매 전환율',
      customer: '고객 세그먼트별 전환 분석',
    },
  },
  '구매 전환율': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'conversion-rate' },
  },
  '구매전환율': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'conversion-rate' },
  },
  '객단가': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'avg-transaction' },
  },
  '방문 빈도': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-kpi-cards', component: 'visit-frequency' },
  },
  '퍼널': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-funnel' },
  },
  '고객 여정': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-funnel' },
  },
  '목표 달성률': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-goals', component: 'goal-card' },
    requires: 'goal_settings',
    fallback: {
      message: '현재 설정된 목표가 없습니다. 목표 설정을 진행해주세요.',
      action: {
        type: 'open_modal',
        modalId: 'goal-settings',
        buttonText: '목표 설정하러 가기',
      },
    },
  },
  '목표': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-goals', component: 'goal-card' },
    requires: 'goal_settings',
  },
  'AI 추천 효과': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-goals', component: 'ai-effect' },
  },
  '추천 효과': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-goals', component: 'ai-effect' },
  },
  'AI 인사이트': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-insights' },
  },
  '오늘의 AI 인사이트': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-insights' },
  },
  '오늘의 인사이트': {
    primary: { page: '/insights', tab: 'overview', section: 'overview-insights' },
  },

  // ===== 매장(Store) 탭 용어 =====
  '피크타임': {
    primary: { page: '/insights', tab: 'store', section: 'store-kpi-cards', component: 'peak-time' },
  },
  '인기 존': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-performance', component: 'zone-compare' },
  },
  '인기존': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-performance', component: 'zone-compare' },
  },
  '센서 커버율': {
    primary: { page: '/insights', tab: 'store', section: 'store-kpi-cards', component: 'tracking-coverage' },
  },
  '시간대별 방문': {
    primary: { page: '/insights', tab: 'store', section: 'store-hourly-pattern' },
  },
  '시간대별 방문 패턴': {
    primary: { page: '/insights', tab: 'store', section: 'store-hourly-pattern' },
  },
  '존 체류시간': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-dwell' },
  },
  '존별 체류시간': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-dwell' },
  },
  '존 분석': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-dwell' },
  },
  '존별 방문자 분포': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-distribution' },
  },
  '존별 성과 비교': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-performance' },
  },
  '존별 성과': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-performance' },
  },
  '평균 체류시간': {
    primary: { page: '/insights', tab: 'store', section: 'store-kpi-cards', component: 'avg-dwell' },
    secondary: [
      { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
    ],
    description: {
      store: '매장 내 평균 체류시간',
      customer: '고객별 체류시간 분석',
    },
  },
  '체류 시간': {
    primary: { page: '/insights', tab: 'store', section: 'store-kpi-cards', component: 'avg-dwell' },
    secondary: [
      { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
    ],
    description: {
      store: '매장 내 평균 체류시간',
      customer: '고객별 체류시간 분석',
    },
  },
  '체류시간': {
    primary: { page: '/insights', tab: 'store', section: 'store-kpi-cards', component: 'avg-dwell' },
    secondary: [
      { page: '/insights', tab: 'customer', section: 'customer-kpi-cards' },
    ],
  },
  '히트맵': {
    primary: { page: '/insights', tab: 'store', section: 'store-zone-distribution' },
  },

  // ===== 고객(Customer) 탭 용어 =====
  '재방문율': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards', component: 'repeat-rate' },
  },
  '고객 세그먼트': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  },
  '충성 고객': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards', component: 'loyal-customers' },
  },
  '주요 세그먼트': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-kpi-cards', component: 'top-segment' },
  },
  '고객 세그먼트 분포': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  },
  '세그먼트별 평균 구매액': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-avg-purchase' },
  },
  '평균 구매액': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-avg-purchase' },
  },
  '세그먼트 상세 분석': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-segment-distribution' },
  },
  '재방문 추이': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-return-trend' },
  },
  '재방문 트렌드': {
    primary: { page: '/insights', tab: 'customer', section: 'customer-return-trend' },
  },

  // ===== 상품(Product) 탭 용어 =====
  '상품': {
    primary: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  },
  '판매량': {
    primary: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  },
  '판매 순위': {
    primary: { page: '/insights', tab: 'product', section: 'product-top10' },
  },
  '베스트셀러': {
    primary: { page: '/insights', tab: 'product', section: 'product-top10' },
  },
  '총 판매량': {
    primary: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  },
  '상품별 매출 TOP 10': {
    primary: { page: '/insights', tab: 'product', section: 'product-top10' },
  },
  '상품별 매출 top 10': {
    primary: { page: '/insights', tab: 'product', section: 'product-top10' },
  },
  '카테고리 분석': {
    primary: { page: '/insights', tab: 'product', section: 'product-category-revenue' },
  },
  '카테고리별 매출 분포': {
    primary: { page: '/insights', tab: 'product', section: 'product-category-revenue' },
  },
  '카테고리별 판매량': {
    primary: { page: '/insights', tab: 'product', section: 'product-category-quantity' },
  },
  '상품별 상세 성과': {
    primary: { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
  },

  // ===== 재고(Inventory) 탭 용어 =====
  '재고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
    ],
  },
  '재고 현황': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  },
  '재고 부족': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
  },
  '재고 알림': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
  },
  '과잉 재고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards', component: 'overstock' },
  },
  '입출고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-movements' },
  },
  '재고 분포': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-distribution' },
  },
  '총 상품 수': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards' },
  },
  '정상 재고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-kpi-cards', component: 'healthy-stock' },
  },
  '카테고리별 재고': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-category' },
  },
  '카테고리별 재고 현황': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-category' },
  },
  '재고 부족 경고 상품': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
  },
  '최근 입출고 내역': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-movements' },
  },
  '상세 재고 현황': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-detail' },
  },
  '재고부족': {
    primary: { page: '/insights', tab: 'inventory', section: 'inventory-risk' },
    secondary: [
      { page: '/insights', tab: 'product', section: 'product-kpi-cards' },
    ],
    description: {
      inventory: '재고 부족 경고 상품 목록',
      product: '재고 부족 상품 수',
    },
  },

  // ===== 예측/AI추천 탭 용어 (네비게이션만 수행, 데이터 조회 없음) =====
  '매출 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '방문자 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '전환율 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '수요 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '트렌드 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '예측 모델': { primary: { page: '/insights', tab: 'prediction' } },
  '예측 신뢰도': { primary: { page: '/insights', tab: 'prediction' } },
  '일별 예측': { primary: { page: '/insights', tab: 'prediction' } },
  '일별 예측 상세': { primary: { page: '/insights', tab: 'prediction' } },
  '활성 전략': { primary: { page: '/insights', tab: 'ai' } },
  '전략 추천': { primary: { page: '/insights', tab: 'ai' } },
  '가격 최적화': { primary: { page: '/insights', tab: 'ai' } },
  '재고 최적화': { primary: { page: '/insights', tab: 'ai' } },
  'AI 수요 예측': { primary: { page: '/insights', tab: 'ai' } },
  '시즌 트렌드': { primary: { page: '/insights', tab: 'ai' } },
  '리스크 예측': { primary: { page: '/insights', tab: 'ai' } },
  '캠페인': { primary: { page: '/insights', tab: 'ai' } },
  '캠페인 현황': { primary: { page: '/insights', tab: 'ai' } },

  // ===== 스튜디오 용어 =====
  '시뮬레이션': {
    primary: { page: '/studio', tab: 'ai-simulation' },
  },

  // ===== ROI 측정 용어 =====
  'ROI': {
    primary: { page: '/roi', section: 'roi-summary' },
  },
  'ROI 분석': {
    primary: { page: '/roi', section: 'roi-analysis' },
  },
  'ROI 측정': {
    primary: { page: '/roi', section: 'roi-summary' },
  },
  '전략 성과': {
    primary: { page: '/roi', section: 'strategy-performance' },
  },
  '적용된 전략': {
    primary: { page: '/roi', section: 'applied-strategies' },
  },
  '적용 전략': {
    primary: { page: '/roi', section: 'applied-strategies' },
  },
  '성공률': {
    primary: { page: '/roi', section: 'roi-summary', component: 'success-rate' },
  },
  '평균 ROI': {
    primary: { page: '/roi', section: 'roi-summary', component: 'average-roi' },
  },
  '추가매출': {
    primary: { page: '/roi', section: 'roi-summary', component: 'revenue-impact' },
  },
  '총 추가매출': {
    primary: { page: '/roi', section: 'roi-summary', component: 'revenue-impact' },
  },
  '매출 효과': {
    primary: { page: '/roi', section: 'roi-summary', component: 'revenue-impact' },
  },
  '카테고리별 성과': {
    primary: { page: '/roi', section: 'strategy-performance' },
  },
  '2D 시뮬레이션 성과': {
    primary: { page: '/roi', section: 'strategy-performance', component: '2d-simulation' },
  },
  '3D 시뮬레이션 성과': {
    primary: { page: '/roi', section: 'strategy-performance', component: '3d-simulation' },
  },

  // ===== 데이터 컨트롤타워 용어 =====
  '데이터 품질': {
    primary: { page: '/data/control-tower', section: 'data-quality' },
  },
  '데이터 품질 점수': {
    primary: { page: '/data/control-tower', section: 'data-quality' },
  },
  '품질 점수': {
    primary: { page: '/data/control-tower', section: 'data-quality' },
  },
  '데이터 소스': {
    primary: { page: '/data/control-tower', section: 'data-sources' },
  },
  '연결된 소스': {
    primary: { page: '/data/control-tower', section: 'data-sources' },
  },
  '비즈니스 데이터': {
    primary: { page: '/data/control-tower', section: 'data-sources', component: 'business-sources' },
  },
  '컨텍스트 데이터': {
    primary: { page: '/data/control-tower', section: 'data-sources', component: 'context-sources' },
  },
  '날씨 데이터': {
    primary: { page: '/data/control-tower', section: 'data-sources', component: 'context-sources' },
  },
  'API 연결': {
    primary: { page: '/data/control-tower', section: 'api-connections' },
  },
  'API 현황': {
    primary: { page: '/data/control-tower', section: 'api-connections' },
  },
  '파이프라인': {
    primary: { page: '/data/control-tower', section: 'pipeline' },
  },
  '데이터 흐름': {
    primary: { page: '/data/control-tower', section: 'pipeline' },
  },
  '임포트 히스토리': {
    primary: { page: '/data/control-tower', section: 'data-import', component: 'import-history' },
  },
  '임포트 내역': {
    primary: { page: '/data/control-tower', section: 'data-import', component: 'import-history' },
  },
  '3D 모델 업로드': {
    primary: { page: '/data/control-tower', section: 'model-upload' },
  },

  // ===== 설정 & 관리 용어 =====
  '매장 관리': {
    primary: { page: '/settings', tab: 'stores' },
  },
  '매장 설정': {
    primary: { page: '/settings', tab: 'stores' },
  },
  '사용자 관리': {
    primary: { page: '/settings', tab: 'users' },
  },
  '사용자 초대': {
    primary: { page: '/settings', tab: 'users' },
  },
  '팀원 관리': {
    primary: { page: '/settings', tab: 'users' },
  },
  '시스템 설정': {
    primary: { page: '/settings', tab: 'system' },
  },
  '알림 설정': {
    primary: { page: '/settings', tab: 'system' },
  },
  '조직 설정': {
    primary: { page: '/settings', tab: 'system' },
  },
  '플랜': {
    primary: { page: '/settings', tab: 'license' },
  },
  '구독': {
    primary: { page: '/settings', tab: 'license' },
  },
  '라이선스': {
    primary: { page: '/settings', tab: 'license' },
  },
  '요금제': {
    primary: { page: '/settings', tab: 'license' },
  },
  '플랜 업그레이드': {
    primary: { page: '/settings', tab: 'license' },
  },
  '데이터 설정': {
    primary: { page: '/settings', tab: 'data' },
  },
  '그래프 엔티티': {
    primary: { page: '/settings', tab: 'data' },
  },
  'API 커넥터': {
    primary: { page: '/settings', tab: 'data' },
  },
};

// ============================================
// 3. 모달/팝업 ID 정의
// ============================================

export interface ModalDefinition {
  page: string | '*';  // '*'는 모든 페이지
  tab?: string;
  section?: string;
  description: string;
}

export const MODAL_MAP: Record<string, ModalDefinition> = {
  'goal-settings': {
    page: '/insights',
    tab: 'overview',
    section: 'goal-achievement',
    description: '목표 설정 모달',
  },
  'date-picker': {
    page: '*',
    description: '날짜 범위 선택 모달',
  },
  'export-data': {
    page: '/insights',
    description: '데이터 내보내기 모달',
  },
  'simulation-config': {
    page: '/studio',
    tab: 'ai-simulation',
    description: '시뮬레이션 설정 모달',
  },
  'optimization-config': {
    page: '/studio',
    tab: 'ai-optimization',
    description: '최적화 설정 모달',
  },
  'new-connection': {
    page: '/data/control-tower',
    description: '새 데이터 연결 추가 모달',
  },
  'add-store': {
    page: '/settings',
    tab: 'stores',
    description: '매장 추가 다이얼로그',
  },
  'invite-user': {
    page: '/settings',
    tab: 'users',
    description: '사용자 초대 모달',
  },
  'plan-upgrade': {
    page: '/settings',
    tab: 'license',
    description: '플랜 업그레이드 모달',
  },
};

// ============================================
// 4. 자연어 표현 Variation 사전
// ============================================

export const ACTION_EXPRESSIONS = {
  show: [
    '보여', '보여줘', '보여주세요', '보여줄래', '보여줄 수 있어',
    '알려', '알려줘', '알려주세요', '알려줄래',
    '확인', '확인해줘', '확인하고 싶어', '확인할래',
    '어때', '어떻게 돼', '어떻게 되어 있어',
    '뭐야', '뭔지', '뭔가',
  ],
  navigate: [
    '가', '가줘', '가고 싶어', '가볼래',
    '이동', '이동해', '이동해줘', '이동하고 싶어',
    '열어', '열어줘', '열어볼래',
  ],
  set: [
    '설정', '설정해', '설정해줘',
    '바꿔', '바꿔줘', '변경해', '변경해줘',
    '적용', '적용해', '적용해줘',
  ],
  execute: [
    '돌려', '돌려줘', '실행', '실행해', '실행해줘',
    '시작', '시작해', '시작해줘',
    '진행', '진행해', '진행해줘',
    '해봐', '해줘',
  ],
};

export const QUESTION_EXPRESSIONS = {
  status: [
    '얼마', '얼마야', '얼마지', '얼마인가',
    '몇', '몇이야', '몇이지', '몇인가',
    '어때', '어떻게 돼', '어떤 상태',
    '있어', '있나', '있는지',
  ],
  comparison: [
    '대비', '대비 어때', '비교', '비교해서',
    '차이', '차이가 뭐야', '뭐가 달라',
    '늘었어', '줄었어', '변화', '변화가 있어',
  ],
  recommendation: [
    '추천', '추천해줘', '뭐가 좋을까',
    '어떻게 하면 좋을까', '제안', '제안해줘',
  ],
};

// ============================================
// 5. 유틸리티 함수
// ============================================

/**
 * 용어에서 위치 정보 찾기
 */
export function findTermLocation(
  term: string,
  currentPage?: string,
  currentTab?: string
): TermLocationEntry | null {
  // 정확한 매칭 먼저
  if (TERM_LOCATION_MAP[term]) {
    return TERM_LOCATION_MAP[term];
  }

  // 부분 매칭
  for (const [key, value] of Object.entries(TERM_LOCATION_MAP)) {
    if (term.includes(key) || key.includes(term)) {
      return value;
    }
  }

  return null;
}

/**
 * 현재 위치 기반 최적 타겟 결정
 */
export function resolveTargetLocation(
  entry: TermLocationEntry,
  currentPage?: string,
  currentTab?: string
): TermLocation {
  // 현재 페이지에 해당 데이터가 있으면 현재 위치 유지
  if (currentPage === entry.primary.page) {
    if (!entry.primary.tab || currentTab === entry.primary.tab) {
      return entry.primary;
    }
  }

  // secondary 위치 중 현재 위치와 일치하는 것 찾기
  if (entry.secondary) {
    for (const loc of entry.secondary) {
      if (currentPage === loc.page && (!loc.tab || currentTab === loc.tab)) {
        return loc;
      }
    }
  }

  // 기본값: primary 위치
  return entry.primary;
}

/**
 * 페이지 경로에서 페이지 정보 찾기
 */
export function findPageByPath(path: string): DashboardPage | undefined {
  return DASHBOARD_STRUCTURE.find(p => p.path === path);
}

/**
 * 탭 ID로 탭 정보 찾기
 */
export function findTabById(pagePath: string, tabId: string): DashboardTab | undefined {
  const page = findPageByPath(pagePath);
  return page?.tabs?.find(t => t.id === tabId);
}

/**
 * 섹션 ID로 섹션 정보 찾기
 */
export function findSectionById(
  pagePath: string,
  tabId: string | undefined,
  sectionId: string
): DashboardSection | undefined {
  const page = findPageByPath(pagePath);

  if (tabId) {
    const tab = page?.tabs?.find(t => t.id === tabId);
    return tab?.sections?.find(s => s.id === sectionId);
  }

  return page?.sections?.find(s => s.id === sectionId);
}
