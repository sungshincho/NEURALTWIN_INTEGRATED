/**
 * NEURALTWIN Retail Domain Knowledge Database
 * 
 * 토픽 라우터(topicRouter.ts)에서 분류된 토픽에 따라
 * 해당 카테고리의 심화 지식만 선별하여 시스템 프롬프트에 주입합니다.
 * 
 * 목적: 토큰 절약 + 답변 정밀도 향상
 * 기본 시스템 프롬프트(~3,500 tokens)에 토픽별 지식(~500-800 tokens)을 추가
 */

export interface DomainKnowledge {
  id: string;
  name: string;
  nameKo: string;
  keywords: string[];            // 토픽 분류용 키워드
  keywordsKo: string[];          // 한국어 키워드
  context: string;               // 시스템 프롬프트에 주입될 심화 지식
  relatedTopics: string[];       // 연관 토픽 (추가 컨텍스트 후보)
}

export const RETAIL_KNOWLEDGE: DomainKnowledge[] = [
  // ═══════════════════════════════════════════
  //  1. STORE LAYOUT & CUSTOMER FLOW
  // ═══════════════════════════════════════════
  {
    id: "layout_flow",
    name: "Store Layout & Customer Flow",
    nameKo: "매장 레이아웃 & 고객 동선",
    keywords: ["layout", "floor plan", "traffic flow", "customer path", "store design", "aisle", "entrance", "decompression", "dead zone", "power path", "racetrack", "grid", "free-flow", "herringbone", "bottleneck", "navigation"],
    keywordsKo: ["레이아웃", "동선", "매장 설계", "통로", "입구", "감압", "데드존", "파워패스", "고객 흐름", "매장 구조", "플로어", "배치", "바닥", "통행", "이동 경로", "순환"],
    context: `[매장 레이아웃 심화]

■ Decompression Zone 실전 가이드
- 최소 1.5m(소형매장)~4.5m(대형매장) 확보
- 이 구간의 상품 인지율: 매장 중앙부 대비 70% 낮음
- 최적 연출: 클린한 오프닝, 조명 그라데이션, 향기 마케팅 시작점
- 관습 오류: 세일 배너, 장바구니, 고가 상품 배치 → 모두 비효율

■ 동선 유형별 적합 업태
| 레이아웃     | 적합 업태              | 핵심 장점          | 주의점              |
|-------------|----------------------|-------------------|---------------------|
| Grid        | 슈퍼마켓, 편의점, 약국  | 공간 효율 극대화    | 단조로움, 탐색 제한   |
| Racetrack   | 백화점, 대형 전문점     | 전체 순회 유도      | 목적 구매 불편       |
| Free-Flow   | 부티크, 럭셔리, 갤러리  | 자유로운 탐색       | 방향 상실 가능       |
| Herringbone | 좁은 매장, 서점        | 시야 확장          | 재고 보충 동선 복잡   |
| Hybrid      | 대형 할인점(월마트)     | 효율+탐색 균형      | 설계 복잡도 높음     |

■ Power Wall 전략
- 입구 우측 벽면 = 매장 내 최고 주목도 공간
- 신상품, 캠페인 주력상품, 고마진 아이템 배치
- 월 1~2회 교체로 신선함 유지 → 재방문 고객 관심 유지

■ Speed Bump 기법
- 매장 중앙 통로에 아일랜드 디스플레이 배치 → 이동 속도 25~30% 감속
- 감속된 고객의 추가 상품 접촉률 40%+ 향상
- 과도한 Speed Bump → 동선 불쾌감. 매장 100평당 2~3개가 적정

■ 비용 대비 효과
- 레이아웃 리모델링 평균 비용: 평당 $50~$200
- 기대 매출 증가: 7~10% (12~18개월 내 ROI 회수)
- 사전 시뮬레이션(디지털 트윈) 시 실패 리스크 70~80% 감소`,
    relatedTopics: ["vmd_display", "customer_analytics", "digital_twin"]
  },

  // ═══════════════════════════════════════════
  //  2. VMD & DISPLAY
  // ═══════════════════════════════════════════
  {
    id: "vmd_display",
    name: "Visual Merchandising & Display",
    nameKo: "비주얼 머천다이징 & 디스플레이",
    keywords: ["VMD", "visual merchandising", "display", "mannequin", "window", "planogram", "shelf", "golden zone", "eye level", "endcap", "gondola", "signage", "POP", "fixture", "color blocking", "cross merchandising"],
    keywordsKo: ["VMD", "비주얼 머천다이징", "진열", "디스플레이", "마네킹", "쇼윈도", "플라노그램", "선반", "골든존", "눈높이", "엔드캡", "곤돌라", "사이니지", "POP", "집기", "컬러블로킹", "교차진열", "연출"],
    context: `[VMD 심화]

■ VP-PP-IP 연계 전략
- VP(쇼윈도)로 브랜드 이미지·시즌 테마 전달 → 입점 유도
- PP(존별 포컬포인트)로 카테고리 스토리 전개 → 존 진입 유도
- IP(개별 진열)로 구매 결정 지원 → 전환 달성
- 이 3단계가 끊기면 "보기만 하고 안 사는" 매장이 됨

■ 골든존 상세
- 성인 눈높이: 120~170cm (중심 150cm)
- 골든존 매출 기여: 전체 선반의 35~40%
- 눈높이 -15cm(손높이, Grab Zone): 실구매 발생 최다 구간
- 최상단(180cm+): "빌보드 존". 시각 임팩트용 (대형 패키지, POP)
- 최하단(60cm 이하): 대용량, 저마진, 목적 구매 상품

■ 진열 밀도(Facing) 최적화
- 페이싱 1개 → 3개: 매출 평균 60% 증가
- 페이싱 3개 → 6개: 추가 매출 20% (체감 효과 감소)
- 최적점: 카테고리 점유율 비례 + 마진율 가중 배분

■ 시즌 VMD 캘린더 (한국 기준)
| 시기         | 테마              | 핵심 연출 포인트           |
|-------------|-------------------|--------------------------|
| 1~2월       | 설 선물, 봄 신상   | 레드/골드 톤, 기프트 세트   |
| 3~4월       | 봄 시즌, 신학기    | 파스텔, 프레시 그린        |
| 5~6월       | 가정의 달, 여름    | 가족 테마, 쿨톤, 아웃도어   |
| 7~8월       | 여름세일, 바캉스   | 볼륨 진열, 가격 소구       |
| 9~10월      | FW 시즌, 추석     | 웜톤, 레이어링, 기프트     |
| 11~12월     | 블프, 크리스마스    | 글리터, 레드/그린, 대량진열  |

■ 플라노그램 실행 체크리스트
- 페이싱 수 정확성 확인
- 가격 태그 부착 100%
- POS 자재 7개 이내 규칙 준수
- 상품 전면(Face-out) 정렬
- 재고 보충 상태 확인
- 컴플라이언스 감사 주 1회 이상`,
    relatedTopics: ["layout_flow", "sales_conversion", "pricing_promotion"]
  },

  // ═══════════════════════════════════════════
  //  3. SALES & CONVERSION
  // ═══════════════════════════════════════════
  {
    id: "sales_conversion",
    name: "Sales & Conversion Optimization",
    nameKo: "매출 & 전환 최적화",
    keywords: ["sales", "conversion", "revenue", "transaction", "ATV", "UPT", "basket", "upsell", "cross-sell", "bundle", "average order", "ticket", "checkout", "purchase", "close rate"],
    keywordsKo: ["매출", "전환", "전환율", "객단가", "건단가", "구매", "업셀", "크로스셀", "번들", "장바구니", "체크아웃", "계산", "결제", "구매율", "판매", "수익"],
    context: `[매출 & 전환 심화]

■ 매출 분해 공식 (Revenue Decomposition)
Revenue = Traffic × CVR × ATV
ATV = UPT × AUR

각 변수별 개선 전략:
- Traffic↑: 마케팅, 외부 사이니지, 앵커 테넌트, 이벤트
- CVR↑: 접객, 피팅룸 UX, 재고 가용성, 가격 투명성
- UPT↑: 크로스머천다이징, 코디 추천, 번들, "함께 구매" 진열
- AUR↑: 프리미엄 라인 확대, 업셀링 스크립트, 가치 프레젠테이션

■ 전환 퍼널 단계별 이탈 원인 & 대응
| 단계               | 평균 이탈률  | 주요 원인              | 대응 전략              |
|-------------------|------------|----------------------|----------------------|
| 매장 앞 → 입장     | 30~50%     | 매력도 부족, 진입장벽    | 파사드, 쇼윈도 강화     |
| 입장 → 상품 접촉   | 20~30%     | 동선 혼란, 관심사 미스매치 | 존 배치 최적화         |
| 상품 접촉 → 시착/체험| 40~60%    | 사이즈 부재, 직원 부재   | 피팅 안내, 접객 타이밍   |
| 시착 → 구매 결정    | 30~40%     | 가격, 대안 고민         | 코디 제안, 한정 혜택     |
| 구매 결정 → 결제    | 5~15%      | 대기, 결제 불편         | 모바일 POS, 셀프체크아웃 |

■ 업셀링 & 크로스셀링 스크립트 프레임워크
- 업셀링: "이 제품의 상위 라인은 [기능X]가 추가되어 있어요. 차이가 [금액]이라 오래 쓰시면 더 이득이에요."
- 크로스셀링: "이거 구매하시는 분들이 [상품Y]도 많이 가져가세요. 같이 사시면 [할인/혜택]이 있어요."
- 핵심: 고객의 이미 결정된 구매에 "추가 가치"를 제안. 절대 부담을 주지 않을 것.

■ 피팅룸 전환 극대화
- 피팅룸 이용 고객 전환율: 67% (비이용 10~20%)
- 피팅룸 대기 시 대안 상품 준비 → UPT 0.5~1.0 추가
- 조명: 자연광에 가까운 5000~5500K. 형광등 금지.
- 거울 각도: 약간 위를 향하게 → 체형이 좋아 보이는 효과
- 직원 체크인: "사이즈 맞으세요?" 타이밍에 코디 제안`,
    relatedTopics: ["pricing_promotion", "customer_analytics", "staff_productivity"]
  },

  // ═══════════════════════════════════════════
  //  4. INVENTORY & SUPPLY CHAIN
  // ═══════════════════════════════════════════
  {
    id: "inventory_supply",
    name: "Inventory & Supply Chain Management",
    nameKo: "재고 관리 & 공급망",
    keywords: ["inventory", "stock", "turnover", "shrinkage", "supply chain", "reorder", "safety stock", "dead stock", "FIFO", "warehouse", "logistics", "vendor", "procurement", "stockout", "overstock", "SKU", "assortment"],
    keywordsKo: ["재고", "인벤토리", "회전율", "손실", "공급망", "발주", "안전재고", "사장재고", "물류", "입고", "출고", "품절", "과재고", "SKU", "어소트먼트", "구색", "납품", "소싱"],
    context: `[재고 & 공급망 심화]

■ 재고 회전율 심층 분석
- 공식: COGS ÷ Average Inventory
- 회전율이 높다고 무조건 좋지 않음 → 품절 리스크 체크 필수
- 최적 회전율 = "고객이 원할 때 항상 있되, 남지 않는" 수준
- DSI (Days Sales of Inventory) = 365 ÷ 회전율
  · 패션: 30~60일 / 식료품: 5~25일 / 가구: 75~145일

■ ABC-XYZ 매트릭스
| 구분   | X (수요 안정)  | Y (수요 변동)  | Z (수요 불규칙) |
|-------|--------------|--------------|---------------|
| A(고가치)| AX: 자동 보충  | AY: 안전재고↑  | AZ: 주문 생산   |
| B(중가치)| BX: 정기 발주  | BY: 모니터링   | BZ: 축소 검토   |
| C(저가치)| CX: 최소 재고  | CY: 최소 재고  | CZ: 퇴출 검토   |

■ Shrinkage 방지 체계
1. 예방: RFID 태깅, AI CCTV, EAS 게이트, 잠금 진열
2. 탐지: 순환 실사(Cycle Count), 편차 분석, 이상 패턴 감지
3. 대응: 핫스팟 매핑, 직원 교육, 공급업체 검수 강화
4. 측정: 월별 shrinkage rate 추적, 카테고리별 분석

■ 수요 예측 방법론
- Moving Average: 단순하지만 시즌성 미반영
- Exponential Smoothing: 최근 데이터에 가중치, 트렌드 추적
- ARIMA: 시계열 패턴 분석, 시즌성 반영
- ML 기반: 날씨, 이벤트, SNS 트렌드, 경쟁사 가격 반영
- 예측 정확도 목표: MAPE 20% 이하 (식료품 10% 이하)

■ Dead Stock 처리 전략
- 180일+ 미판매: 할인 (30~50% off)
- 270일+ 미판매: 아울렛/B2B 처분
- 365일+ 미판매: 기부(세금 혜택) 또는 폐기
- 패션: 시즌 종료 후 90일 내 처분 완료 목표`,
    relatedTopics: ["sales_conversion", "pricing_promotion", "data_kpi"]
  },

  // ═══════════════════════════════════════════
  //  5. CUSTOMER ANALYTICS & CRM
  // ═══════════════════════════════════════════
  {
    id: "customer_analytics",
    name: "Customer Analytics & CRM",
    nameKo: "고객 분석 & CRM",
    keywords: ["customer", "segment", "RFM", "CLV", "lifetime value", "retention", "loyalty", "CRM", "NPS", "satisfaction", "churn", "repeat", "acquisition", "persona", "journey", "touchpoint", "omnichannel"],
    keywordsKo: ["고객", "세그먼트", "RFM", "생애가치", "유지율", "로열티", "충성", "CRM", "NPS", "만족도", "이탈", "재구매", "획득", "페르소나", "여정", "터치포인트", "옴니채널"],
    context: `[고객 분석 심화]

■ RFM 세그먼트별 전략
| 세그먼트      | R    | F    | M    | 비중     | 전략                        |
|-------------|------|------|------|---------|----------------------------|
| Champions   | ★★★  | ★★★  | ★★★  | 5~10%  | VIP 프로그램, 얼리 액세스      |
| Loyal       | ★★☆  | ★★★  | ★★☆  | 15~20% | 리워드 강화, 레퍼럴 유도       |
| Potential   | ★★★  | ★☆☆  | ★☆☆  | 10~15% | 재방문 인센티브, 카테고리 확장   |
| At Risk     | ★☆☆  | ★★☆  | ★★☆  | 10~15% | 윈백 캠페인, 개인화 오퍼       |
| Hibernating | ★☆☆  | ★☆☆  | ★☆☆  | 20~30% | 재활성화 시도 후 포기 판단      |

■ CLV 계산 및 활용
- 단순: (평균 객단가 × 연간 구매 횟수) × 평균 거래 기간(년)
- 고급: Σ (연간 수익 × 이익률) ÷ (1 + 할인율)^n - 획득비용
- 벤치마크: CAC < CLV × 0.33 (획득비용이 생애가치의 1/3 이하)
- 패션 CLV: $500~$2,000 / 럭셔리: $5,000~$50,000+
- 식료품: $5,000~$10,000 (주 1~2회 × 10년)

■ 고객 여정 매핑 (In-Store)
인지 → 흥미 → 탐색 → 비교 → 결정 → 구매 → 후속

각 단계별 측정 지표:
- 인지: 입장률(매장 앞 통행 대비)
- 탐색: 존 방문률, 상품 접촉률
- 비교: 체류시간, 피팅룸 이용률
- 결정: 장바구니 전환율
- 구매: 전환율, ATV
- 후속: 재구매율, NPS, 리뷰

■ 옴니채널 고객 행동
- ROPO (Research Online, Purchase Offline): 56~70%
- Showrooming (매장 확인 → 온라인 구매): 46%
- Webrooming (온라인 탐색 → 매장 구매): 69% (더 높음)
- BOPIS 고객의 매장 내 추가 구매율: 49%
- 옴니채널 고객 LTV: 단일채널 대비 30% 높음

■ Loyalty Program 설계 원칙
- 적립률: 구매의 1~5% (너무 높으면 마진 침식, 너무 낮으면 무관심)
- 등급 체계: 3~4 tier (Bronze/Silver/Gold/Platinum)
- 혜택 차등: VIP에게는 "돈으로 살 수 없는" 경험 제공
- 데이터 활용: 구매 이력 기반 개인화 추천 → 전환율 2~3배`,
    relatedTopics: ["sales_conversion", "staff_productivity", "data_kpi"]
  },

  // ═══════════════════════════════════════════
  //  6. STAFF & PRODUCTIVITY
  // ═══════════════════════════════════════════
  {
    id: "staff_productivity",
    name: "Staff Management & Productivity",
    nameKo: "인력 관리 & 생산성",
    keywords: ["staff", "employee", "labor", "scheduling", "productivity", "SPLH", "turnover", "hiring", "training", "shift", "workforce", "payroll", "overtime", "part-time", "incentive"],
    keywordsKo: ["인력", "직원", "스태프", "노동", "스케줄", "생산성", "시간당매출", "이직", "채용", "교육", "근무", "시프트", "인건비", "파트타임", "초과근무", "인센티브", "배치"],
    context: `[인력 관리 심화]

■ SPLH 최적화 프레임워크
1. 측정: 부서별·시간대별·직원별 SPLH 산출
2. 벤치마크: 자사 상위 25% 매장 SPLH를 목표치로 설정
3. 갭 분석: 하위 매장의 원인 파악 (과잉 인력? 낮은 전환?)
4. 조치: 트래픽 연동 스케줄 조정 → 전환율-인력 최적점 탐색
5. 모니터링: 주간 단위 추적, 월간 리뷰

■ 트래픽 연동 스케줄링
- 시간대별 방문객 데이터 → 인력 수요 곡선 생성
- 피크 시간: 필요 인력의 120~130% 배치 (서비스 품질 유지)
- 오프피크: 최소 인력(보안+기본 서비스) + 후방 업무(진열, 재고)
- 목표: 모든 시간대에서 고객 1명당 직원 대기시간 3분 이내

■ 직원 전환율 기여도 분석
| 인력 수준    | 전환율 변화    | 비고                    |
|------------|-------------|------------------------|
| 최소 인력    | 기준         | 보안·결제만 가능           |
| 적정 인력    | +15~25%     | 접객·안내 가능            |
| 최적 인력    | +25~35%     | 1:1 코디·체험 서비스 가능   |
| 과잉 인력    | +30~35%     | 추가 효과 미미, 인건비 낭비  |

■ 교육 ROI
- 신입 온보딩: 2~4주 투자 → 3개월 내 SPLH 동률 달성
- 상품 지식 교육: 전환율 15~30% 향상 (특히 가전, 화장품)
- 접객 스킬 교육: ATV 10~20% 향상
- 투자 대비: $1 교육 투자 → $4~$12 매출 환원 (업종별)

■ 이직 비용 & 방지
- 1인 이직 비용: 연봉의 50~200% (채용+교육+생산성 손실)
- 핵심 방지 전략: 안정적 스케줄링(매출 7%↑), 경력 경로 제시, 인센티브 연동
- 파트타임 이직률 76% → 시프트 스왑 시스템으로 유연성 제공 시 15~20%p 감소`,
    relatedTopics: ["sales_conversion", "data_kpi", "layout_flow"]
  },

  // ═══════════════════════════════════════════
  //  7. DATA & KPI
  // ═══════════════════════════════════════════
  {
    id: "data_kpi",
    name: "Data Analytics & KPI",
    nameKo: "데이터 분석 & KPI",
    keywords: ["KPI", "metrics", "analytics", "data", "dashboard", "report", "benchmark", "measurement", "performance", "ROI", "GMROI", "margin", "profit", "foot traffic", "heat map", "dwell time"],
    keywordsKo: ["KPI", "지표", "분석", "데이터", "대시보드", "리포트", "벤치마크", "측정", "성과", "ROI", "마진", "수익", "방문객", "히트맵", "체류시간", "매출분석"],
    context: `[데이터 분석 심화]

■ KPI 계층별 대시보드 설계
| Level | 대상      | 핵심 KPI (5~7개)                                     | 주기    |
|-------|---------|-----------------------------------------------------|-------|
| L1    | 경영진    | 매출성장률, GMROI, 순이익률, CLV, Market Share          | 월/분기 |
| L2    | 매장장    | 전환율, SPLH, ATV, 재고회전율, NPS, Shrinkage          | 주/월   |
| L3    | 현장직원  | UPT, 접객수, 피팅룸전환율, 시간당접객                     | 일/주   |

■ GMROI (Gross Margin Return on Inventory Investment)
- 공식: (연간 매출총이익 ÷ 평균 재고원가) × 100
- 해석: 재고에 투자한 $1당 얼마의 총이익을 생성하는가
- 건전 수준: 200%+ (투자 $1당 $2+ 총이익)
- 업종별: 패션 150~250% / 식료품 200~400% / 전자제품 100~200%
- GMROI < 100%: 재고 투자가 이익을 못 내는 상태 → 즉각 개선

■ Heat Map 분석 프레임워크
1. 핫존(Hot Zone): 높은 체류 + 높은 매출 → 최적. 유지 및 확대
2. 웜존(Warm Zone): 높은 체류 + 낮은 매출 → 전환 문제. VMD·가격 개선
3. 쿨존(Cool Zone): 낮은 체류 + 높은 매출 → 효율적. 체류↑로 추가 매출 가능
4. 콜드존(Cold Zone): 낮은 체류 + 낮은 매출 → Dead Zone. 재배치 또는 용도 변경

■ 시간대별 분석 활용
- 피크 아워 식별: 매출의 60~70%가 전체 영업시간의 30~40%에 집중
- 시간대별 전환율 비교: 피크 시 전환율 하락 → 인력 부족 시그널
- 시간대별 ATV 비교: 오전 ATV > 오후 ATV → 오후 업셀링 강화 필요
- 요일별 패턴: 토>일>금 (일반). 업종별 편차 크므로 자사 데이터 우선

■ 리포트 주기 & 액션 트리거
| 지표         | 주기  | 경고 기준               | 액션                    |
|-------------|------|----------------------|------------------------|
| 매출         | 일간  | 전주 동일 대비 -10%     | 즉시 원인 분석           |
| 전환율       | 일간  | 주간 평균 대비 -5%p     | 인력·VMD 점검           |
| 재고 회전율   | 주간  | QoQ 하락              | 발주량 조정, 프로모션      |
| Shrinkage   | 월간  | 3% 초과              | 전면 실사, 보안 강화       |
| NPS         | 월간  | 30 미만              | 고객 서비스 개선 태스크포스  |
| 고객 유지율   | 월간  | 60% 미만             | 윈백 캠페인 즉시 가동      |`,
    relatedTopics: ["sales_conversion", "inventory_supply", "customer_analytics"]
  },

  // ═══════════════════════════════════════════
  //  8. PRICING & PROMOTION
  // ═══════════════════════════════════════════
  {
    id: "pricing_promotion",
    name: "Pricing Strategy & Promotion",
    nameKo: "가격 전략 & 프로모션",
    keywords: ["price", "pricing", "promotion", "discount", "markdown", "sale", "BOGO", "bundle", "margin", "markup", "EDLP", "dynamic pricing", "clearance", "coupon", "loyalty points"],
    keywordsKo: ["가격", "프라이싱", "프로모션", "할인", "마크다운", "세일", "번들", "마진", "이벤트", "쿠폰", "포인트", "적립", "클리어런스", "정가", "할인율"],
    context: `[가격 & 프로모션 심화]

■ 가격 전략 매트릭스
| 전략          | 적합 업태          | 장점              | 리스크             |
|-------------|-----------------|------------------|-------------------|
| EDLP        | 대형마트, 창고형    | 고객 신뢰, 예측 가능  | 프로모션 탄력성 부족   |
| High-Low    | 백화점, 전문점     | 방문 유도, 기대감     | 정가 신뢰도 하락     |
| Premium     | 럭셔리, 프리미엄    | 브랜드 가치 유지      | 시장 축소 리스크     |
| Dynamic     | 이커머스, 항공      | 수익 극대화         | 고객 불만, 규제 리스크 |
| Value-Based | SaaS, 서비스     | 고객 가치 연동       | 가치 측정 어려움     |

■ 마크다운 최적화 전략
1단계 (시즌 50% 경과): 20~30% 할인 → 수요 테스트
2단계 (시즌 75% 경과): 40~50% 할인 → 적극 소진
3단계 (시즌 종료): 50~70% 할인 → 재고 클리어
원칙: 너무 이르면 마진 손실, 너무 늦으면 Dead Stock

■ 프로모션 ROI 계산
- Incremental Revenue = 프로모션 매출 - 기본 매출(Baseline)
- Cannibalization 차감 = 비프로모션 상품 매출 감소분
- Net Promo Revenue = Incremental - Cannibalization - 프로모션 비용
- 건전한 프로모션: Uplift 15~30%, Cannibalization 10% 이하

■ 심리적 가격 전략
- 끝수 가격: $9.99 vs $10.00 → 전자가 24% 더 높은 판매
- 앵커링: 비싼 상품 옆에 타겟 상품 배치 → 상대적 저렴 인식
- 디코이: 3가지 옵션 중 의도적 비합리 옵션 → 중간 옵션 선택 유도
- 번들: 개별 구매 대비 10~15% 저렴 → ATV 15~25% 증가

■ 한국 시장 특수 프로모션
- 1+1, 2+1: 한국 편의점·드럭스토어의 핵심 프로모션 유형
- 카드사 할인: 특정 카드 결제 시 5~10% 즉시 할인
- 적립금: 네이버/카카오/T멤버십 등 플랫폼 연동 포인트
- 라이브커머스: 실시간 방송 한정 특가 → 긴급성 + 소셜 프루프`,
    relatedTopics: ["sales_conversion", "inventory_supply", "customer_analytics"]
  },

  // ═══════════════════════════════════════════
  //  9. RETAIL TECHNOLOGY
  // ═══════════════════════════════════════════
  {
    id: "retail_tech",
    name: "Retail Technology",
    nameKo: "리테일 테크놀로지",
    keywords: ["technology", "tech", "digital", "RFID", "IoT", "sensor", "AI", "machine learning", "automation", "POS", "ESL", "beacon", "camera", "computer vision", "self-checkout", "kiosk"],
    keywordsKo: ["기술", "테크", "디지털", "RFID", "IoT", "센서", "AI", "인공지능", "자동화", "POS", "전자가격표", "비콘", "카메라", "셀프체크아웃", "키오스크", "스마트"],
    context: `[리테일 테크 심화]

■ 기술 도입 ROI 벤치마크
| 기술              | 초기 투자(매장당)  | 연간 절감/증가      | ROI 회수기간   |
|-----------------|-----------------|------------------|-------------|
| RFID            | $10K~$50K      | 재고정확도 95%+    | 6~12개월     |
| ESL             | $5K~$20K       | 인건비 30~50%↓    | 12~18개월    |
| AI CCTV         | $15K~$40K      | Shrinkage 20~30%↓| 12~24개월    |
| Self-Checkout   | $20K~$80K/대    | 인건비 절감        | 18~36개월    |
| 디지털 사이니지    | $2K~$10K/대    | 매출 29.5%↑       | 6~12개월     |
| WiFi Analytics  | $3K~$15K       | 동선 최적화 효과    | 6~12개월     |
| Smart Shelf     | $50~$200/선반   | 재고 실시간 모니터링 | 12~24개월    |

■ 고객 추적 기술 비교
| 기술            | 정확도    | 프라이버시  | 비용     | 적합 용도          |
|---------------|---------|----------|---------|-------------------|
| WiFi Sensing  | 2~5m    | 높음(비식별)| 중      | 동선·체류 분석       |
| BLE Beacon    | 1~3m    | 중간      | 저      | 근접 마케팅, 동선    |
| Computer Vision| <1m    | 낮음      | 고      | 행동 분석, 보안      |
| LiDAR         | <0.5m   | 높음      | 고      | 3D 매핑, 정밀 카운팅 |
| Thermal       | 1~2m    | 높음      | 중      | 인원 카운팅          |
| Pressure Mat  | <0.5m   | 높음      | 중      | 특정 구역 체류 분석   |

■ AI 활용 영역
1. 수요 예측: 날씨·이벤트·트렌드 반영 → 예측 정확도 30~50% 향상
2. 가격 최적화: 실시간 경쟁가·수요 반영 → Dynamic Pricing
3. 개인화 추천: 구매 이력 기반 → 전환율 2~3배
4. 시각 검색: 사진 기반 유사 상품 검색 → 탐색 시간 단축
5. 재고 최적화: 자동 발주·안전재고 조정 → 품절률 30~50% 감소
6. Loss Prevention: 이상 행동 패턴 감지 → Shrinkage 20~30% 감소`,
    relatedTopics: ["digital_twin", "data_kpi", "layout_flow"]
  },

  // ═══════════════════════════════════════════
  //  10. DIGITAL TWIN
  // ═══════════════════════════════════════════
  {
    id: "digital_twin",
    name: "Digital Twin & Simulation",
    nameKo: "디지털 트윈 & 시뮬레이션",
    keywords: ["digital twin", "simulation", "3D", "virtual", "model", "scenario", "what-if", "optimization", "twin", "replica"],
    keywordsKo: ["디지털 트윈", "시뮬레이션", "3D", "가상", "모델", "시나리오", "최적화", "트윈", "복제", "예측"],
    context: `[디지털 트윈 심화]

■ 리테일 디지털 트윈의 3계층
1. Static Twin: 매장 3D 모델 (레이아웃, 집기, 상품 위치)
2. Dynamic Twin: 실시간 데이터 연동 (방문객, 매출, 재고)
3. Predictive Twin: AI 기반 시뮬레이션 (What-if 시나리오)

■ 활용 시나리오
- 레이아웃 변경 사전 검증: "집기를 이동하면 동선이 어떻게 바뀔까?"
- 인력 배치 최적화: "토요일 오후에 직원 2명 추가하면 전환율이 얼마나 올라갈까?"
- 프로모션 시뮬레이션: "블랙프라이데이에 입구 디스플레이를 바꾸면?"
- 시즌 준비: "크리스마스 시즌 레이아웃을 미리 테스트"
- 신규 매장: "후보 레이아웃 3안을 비교 시뮬레이션"

■ ROI 분석
- 리모델링 실패 비용: 평당 $200~$500 (원상복구 포함)
- 디지털 트윈 시뮬레이션 비용: 실제 리모델링의 5~10%
- 사전 검증으로 실패 리스크 70~80% 감소
- 연간 3~4회 레이아웃 변경 시 ROI: 400~600%

■ NEURALTWIN의 디지털 트윈
- NEURALSENSE(IoT 센서)로 실시간 매장 데이터 수집
- 3D 매장 복제본에서 AI 기반 시뮬레이션
- 레이아웃 최적화, 인력 배치, 프로모션 효과 예측
- "보이지 않는 것을 시각화" (See the Unseen)`,
    relatedTopics: ["retail_tech", "layout_flow", "data_kpi"]
  },

  // ═══════════════════════════════════════════
  //  11. NEURALTWIN SOLUTION
  // ═══════════════════════════════════════════
  {
    id: "neuraltwin_solution",
    name: "NEURALTWIN Solution",
    nameKo: "NEURALTWIN 솔루션",
    keywords: ["NEURALTWIN", "neural", "solution", "product", "demo", "pricing", "plan", "feature", "service"],
    keywordsKo: ["뉴럴트윈", "솔루션", "제품", "서비스", "데모", "가격", "요금", "기능", "플랜"],
    context: `[NEURALTWIN 솔루션 정보]

■ 핵심 가치 제안
"왜 안 팔리는지, 어떻게 더 팔 수 있는지" — 데이터로 답하는 리테일 인텔리전스

■ 제품 구성
1. NEURALSENSE: IoT 센서 기반 매장 데이터 수집 시스템
   - WiFi/BLE 센서로 고객 동선·체류시간 실시간 추적
   - 비식별 데이터 처리 (개인정보 안전)
   
2. 디지털 트윈 스튜디오: 3D 매장 시각화 & 시뮬레이션
   - 매장의 가상 복제본에서 레이아웃 최적화
   - AI 기반 "What-if" 시나리오 검증
   
3. AI 인사이트: 데이터 기반 의사결정 지원
   - 존별 히트맵, KPI 대시보드, AI 추천
   - 매출 예측, 프로모션 효과 분석

■ PoC 실증 결과
- 480+ 방문객 추적
- 735,000+ 데이터 포인트 수집
- 3,000,000+ 시뮬레이션 수행

■ 기대 효과
- 매출 8~12% 증가 (레이아웃 최적화 + 데이터 기반 의사결정)
- 인건비 5~10% 최적화 (트래픽 연동 스케줄링)
- 리모델링 실패 비용 70~80% 절감 (사전 시뮬레이션)

(참고: 구체적 요금이나 기술 세부사항 질문 시 데모 신청을 안내할 것)`,
    relatedTopics: ["digital_twin", "retail_tech", "data_kpi"]
  },

  // ═══════════════════════════════════════════
  //  12. GENERAL / OTHERS
  // ═══════════════════════════════════════════
  {
    id: "general_retail",
    name: "General Retail Knowledge",
    nameKo: "일반 리테일 지식",
    keywords: ["retail", "store", "shop", "market", "industry", "trend", "future", "challenge", "strategy", "best practice"],
    keywordsKo: ["리테일", "매장", "매장 운영", "유통", "시장", "트렌드", "전략", "과제", "모범사례", "업계"],
    context: `[일반 리테일 심화]

■ 2025 리테일 메가트렌드
1. Phygital: 물리+디지털 경험 융합. 매장이 "체험 허브"로 진화
2. AI-Driven Decision: 직감→데이터 기반 의사결정 전환 가속
3. Sustainability: ESG 경영, 친환경 패키징, 로컬 소싱
4. Hyper-Personalization: 1:1 고객 맞춤 경험. AI 추천, Clienteling
5. Unified Commerce: POS/ERP/CRM/이커머스 완전 통합
6. Biophilic Design: 자연 요소 도입. 매출 40%↑, 가격 수용도 25%↑

■ 한국 리테일 시장 특성
- 유통 구조: 대형마트(이마트, 홈플러스) → 편의점(CU, GS25, 세븐) → 온라인(쿠팡, 네이버) 삼각 구도
- 편의점 밀도: 세계 최고 수준 (인구 약 1,300명당 1개)
- 모바일 결제: 80%+ (카카오페이, 네이버페이, 삼성페이)
- 새벽배송/당일배송: 이커머스 경쟁의 핵심 차별화
- 라이브커머스: 매출 비중 빠르게 성장. 카카오, 네이버, 쿠팡

■ 리테일 ROI 벤치마크
| 투자 영역          | 기대 ROI           | 회수 기간      |
|-------------------|-------------------|-------------|
| 레이아웃 최적화      | 매출 7~10%↑       | 12~18개월    |
| VMD 리뉴얼         | 매출 5~15%↑       | 3~6개월      |
| 직원 교육           | 전환율 15~30%↑     | 1~3개월      |
| 데이터 분석 도입     | 수익성 6~8%↑       | 6~12개월     |
| 옴니채널 통합       | LTV 30%↑          | 12~24개월    |`,
    relatedTopics: ["retail_tech", "digital_twin", "data_kpi"]
  }
];

/**
 * 토픽 ID로 도메인 지식을 조회하는 헬퍼 함수
 */
export function getKnowledgeById(topicId: string): DomainKnowledge | undefined {
  return RETAIL_KNOWLEDGE.find(k => k.id === topicId);
}

/**
 * 여러 토픽의 컨텍스트를 결합하는 헬퍼 함수
 */
export function combineKnowledgeContexts(topicIds: string[]): string {
  return topicIds
    .map(id => getKnowledgeById(id))
    .filter(Boolean)
    .map(k => k!.context)
    .join('\n\n');
}
