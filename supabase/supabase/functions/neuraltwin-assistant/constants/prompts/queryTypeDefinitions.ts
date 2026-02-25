/**
 * 인텐트 분류 프롬프트 — queryType 정의 (query_kpi 섹션)
 * 탭별 queryType 목록과 분류 규칙
 */

export const QUERY_TYPE_DEFINITIONS = `### 1. query_kpi (데이터 조회) - 가장 우선
사용자가 특정 KPI나 데이터를 **알고 싶어할 때**
- "매출 얼마야?", "방문객 몇 명?", "전환율 어때?"
- "목표 달성률 보여줘", "목표 설정 보여줘" (현재 설정된 목표 확인)
- "12월 1-10일 순 방문객", "지난주 매출"
- "재고 현황", "베스트셀러", "체류 시간"
- "입장객 몇 명이야?", "방문 빈도 어때?", "퍼널 보여줘", "고객 여정 분석"
- "피크타임 언제야?", "인기 존 어디야?", "시간대별 방문 패턴", "존 분석 보여줘", "센서 커버율"
- "재방문율 어때?", "고객 세그먼트 보여줘", "충성 고객 몇 명?", "고객 분류"
- "인기 상품 TOP 10", "카테고리별 매출", "총 판매량 알려줘"
- "과잉 재고 몇 개?", "재고 부족 경고", "입출고 내역 보여줘", "재고 분포"
- "매출 예측 보여줘", "향후 방문자 예측", "전환율 예측", "예측 요약"
- "활성 전략 뭐 있어?", "전략 추천해줘", "가격 최적화 추천", "재고 최적화"
- "데이터 품질 점수 몇 점?", "연결된 소스 뭐야?", "파이프라인 상태 확인", "컨텍스트 데이터 소스 뭐 있어?", "날씨 데이터 확인"
- "연결된 API 알려줘", "API 현황", "임포트 히스토리 보여줘", "데이터 임포트 내역"
- "ROI 보여줘", "적용된 전략 알려줘", "전략 성과 어때?", "카테고리별 성과 보여줘"
- "매장 관리 보여줘", "사용자 목록 알려줘", "현재 플랜 뭐야?", "라이선스 확인"

**queryType 값:**

*개요(Overview) 탭:*
- revenue: 매출, 수익, 매상, 총 매출 (개요 맥락에서)
- conversion: 전환율, 구매 전환율, 구매전환율, 구매 전환
- avgTransaction: 객단가, 평균 거래금액
- footfall: 총 입장, 풋폴, 총입장, 총 입장 횟수, 입장 횟수, 총 방문 횟수, 몇번 입장, 몇번 들어왔어
- visitFrequency: 방문 빈도, 방문 주기, 일평균 방문
- funnel: 퍼널, 고객 여정, 여정 분석, 전환 퍼널, 고객 여정 퍼널
- goal: 목표, 목표달성률, 목표설정(확인용), 목표 달성률, 달성률
- aiEffect: AI 추천 효과, 추천 효과, AI 효과
- dailyInsight: 오늘의 AI 인사이트, AI 인사이트, 오늘의 인사이트, 인사이트 요약
- summary: 전체현황, 요약, 성과, 실적, 개요 데이터, 개요 요약, 개요 현황, 개요 실적, 개요 성과
  - "개요 데이터 보여줘", "25년 11월 1일 개요 데이터 보여줘", "개요 현황 알려줘"
  - **중요**: "개요" + "데이터/요약/현황/성과/실적/보여줘" 조합은 반드시 summary로 분류 (storeSummary가 아님)

*매장(Store) 탭:*
- storeSummary: 매장 데이터, 매장 요약, 매장 현황, 매장 전체, 매장탭 데이터, 매장 실적, 매장 성과
  - "매장탭 데이터 보여줘", "매장 현황 알려줘", "25년 11월 1일 매장탭 데이터 보여줘"
  - **중요**: "매장탭/매장" + "데이터/요약/현황/성과/실적/보여줘" 조합은 반드시 storeSummary로 분류 (summary가 아님)

**⚠️ 개요 vs 매장 구분 규칙:**
- "개요" 단어 포함 → summary (개요 탭, Overview)
- "매장" 단어 포함 → storeSummary (매장 탭, Store)
- 둘 다 없으면 → summary (기본값)
- peakTime: 피크타임, 피크시간, 가장 바쁜 시간, 혼잡 시간
- popularZone: 인기 존, 인기 구역, 인기존, 가장 많이 방문하는 존
- trackingCoverage: 센서 커버율, 센서 커버리지, 트래킹 범위, 센서 현황
- hourlyPattern: 시간대별 방문, 시간대별 패턴, 시간별 방문객, 시간대 분석, 시간대별 방문 패턴, "N시에 몇명 방문", "N시 방문객", "N시에 몇명", "오후 N시 트래픽"
  - **⚠️ 최우선 규칙**: 메시지에 특정 시간("N시", "오후 N시", "N시에")이 포함되고 방문/트래픽을 묻는 질문은 **무조건 hourlyPattern**으로 분류. visitors로 분류하면 안 됨.
  - 예시: "12시 방문자 몇명이야?" → hourlyPattern (hour: 12), "11월 1일 14시 방문객" → hourlyPattern (hour: 14), "오후 3시에 몇명 왔어?" → hourlyPattern (hour: 15)
  - 특정 시간이 있으면 → entities.hour에 시간 추출 (0-23, 24시간제)
  - "오후 3시" → hour: 15, "12시" → hour: 12, "저녁 7시" → hour: 19
- zoneAnalysis: 존 분석, 존별 체류시간, 존 방문자 분포, 구역별 분석, 존별 방문자 분포
  - 특정 존 이름이 언급되면 → entities.itemFilter에 존 이름 배열 추출
  - "액세서리존, 의류 존 비교" → itemFilter: ["액세서리", "의류"]
  - **"분포" 키워드 감지**: "존별 방문자 분포", "존 분포", "구역별 분포" 등 "분포"가 포함되면 → entities.responseHint: "distribution" 추가
  - "분포"가 없는 일반 존 분석이면 → responseHint 생략
- zonePerformance: 존별 성과 비교, 존별 성과, 존별 비교, 존 실적, 존별 실적 비교
  - 특정 존 이름이 언급되면 → entities.itemFilter에 존 이름 배열 추출
  - "신발존 성과" → itemFilter: ["신발"]
- popularZone: 인기 존, 인기 구역, 인기존, 가장 많이 방문하는 존
  - 특정 존 이름이 언급되면 → entities.itemFilter에 존 이름 배열 추출
- storeDwell: 평균 체류시간, 체류시간, 머문시간, 평균 체류
  - 탭 맥락(매장/고객)에 관계없이 모든 체류시간 질문은 storeDwell로 분류 (매장 탭으로 이동)

*고객(Customer) 탭:*
- visitors: 방문객, 고객수, 트래픽, 순방문객, 순 방문객, 입장객, 손님, 사람 몇명
  - **주의**: 특정 시간(N시)이 포함된 방문 질문은 visitors가 아닌 **hourlyPattern** (매장 탭)으로 분류. 예: "12시 방문자 몇명이야?" → hourlyPattern, "11월 1일 14시 트래픽" → hourlyPattern
  - **⚠️ visitors vs footfall 구분 규칙:**
  - "몇 명", "얼마나 왔어", "사람/손님/고객 + 수" → visitors (고유 방문자 수)
  - "몇 번", "몇 회", "횟수", "번 입장/들어왔어" → footfall (총 입장 횟수)
  - 예: "오늘 사람 몇명왔어?" → visitors, "오늘 손님 얼마나 왔어?" → visitors
  - 예: "사람들 몇번 들어왔어?" → footfall, "손님 몇번 입장했어?" → footfall
  - 애매한 경우 → visitors (기본값)
- newVsReturning: 신규고객, 재방문고객, 신규/재방문
- repeatRate: 재방문율, 리피트율, 재방문 비율
- customerSegment: 고객 세그먼트, 고객 분류, 고객 유형
  - **"분포" 키워드 감지**: "세그먼트 분포", "고객 세그먼트 분포", "세그먼트별 분포" 등 "분포"가 포함되면 → entities.responseHint: "distribution" 추가
  - "분포"가 없는 일반 세그먼트 질문이면 → responseHint 생략
  - 특정 세그먼트 이름이 언급되면 → entities.itemFilter에 세그먼트 이름 배열 추출
- loyalCustomers: 충성 고객, 단골, VIP 고객, 로열 고객
  - **인원수/존재 질문 전용**: "몇 명", "얼마나 있어", "충성고객 알려줘" 등 고객 수나 존재를 묻는 질문
  - "충성고객 몇명이야?" → loyalCustomers
  - "VIP 고객 몇명?" → loyalCustomers
  - "단골 얼마나 돼?" → loyalCustomers
  - **⚠️ 메트릭 질문은 loyalCustomers가 아님**: "평균 구매액", "방문빈도", "얼마 써?" 등 특정 메트릭을 묻는 질문은 → segmentAvgPurchase 또는 segmentVisitFrequency로 분류
- segmentAvgPurchase: 세그먼트별 평균 구매액, 세그먼트별 구매액, 평균 구매액, 얼마 써, 얼마나 써
  - **세그먼트명 목록**: VIP, New(신규), Regular(일반), Dormant(휴면) — 아래 이름 또는 한국어 동의어가 언급되면 반드시 itemFilter 추출
  - 특정 세그먼트 이름이 언급되면 → entities.itemFilter에 세그먼트 이름 배열 추출
  - "VIP 평균 구매액" → segmentAvgPurchase + itemFilter: ["VIP"]
  - "new고객 평균 얼마써?" → segmentAvgPurchase + itemFilter: ["New"]
  - "신규고객 평균 구매액" → segmentAvgPurchase + itemFilter: ["New"]
  - "일반고객 얼마 써?" → segmentAvgPurchase + itemFilter: ["Regular"]
  - "휴면고객 구매액" → segmentAvgPurchase + itemFilter: ["Dormant"]
  - "VIP 고객 얼마 써?" → segmentAvgPurchase + itemFilter: ["VIP"] (loyalCustomers 아님 — 메트릭 질문)
  - "충성고객 평균 구매액" → segmentAvgPurchase + itemFilter: ["VIP"] (충성=VIP 동의어)
  - 세그먼트 미언급 시 → 전체 세그먼트 조회 (itemFilter 없음)
- segmentVisitFrequency: 세그먼트별 방문 빈도, 세그먼트별 방문 주기, 세그먼트별 방문빈도
  - **세그먼트명 목록**: VIP, New(신규), Regular(일반), Dormant(휴면)
  - 특정 세그먼트 이름이 언급되면 → entities.itemFilter에 세그먼트 이름 배열 추출
  - "VIP 방문빈도" → segmentVisitFrequency + itemFilter: ["VIP"]
  - "충성고객 방문빈도" → segmentVisitFrequency + itemFilter: ["VIP"] (충성=VIP 동의어)
  - "new고객 몇번 방문?" → segmentVisitFrequency + itemFilter: ["New"]
  - "휴면고객 방문 주기" → segmentVisitFrequency + itemFilter: ["Dormant"]
  - **⚠️ visitFrequency(개요탭)와 구분**: 세그먼트명이 포함되면 → segmentVisitFrequency, 세그먼트명 없이 일반적 "방문 빈도" → visitFrequency(개요탭)
- segmentDetail: 세그먼트 상세 분석, 세그먼트 상세, 세그먼트 전체 정보
  - 고객수 + 평균 구매액 + 방문 빈도를 모두 포함하는 전체 테이블 응답
- returnTrend: 재방문 추이, 재방문 트렌드

*상품(Product) 탭:*
- product: 상품, 상품 실적, 상품별 상세 성과, 상품 상세
  - 특정 상품명이 언급되면 → entities.itemFilter에 상품명 배열 추출
  - "프리미엄 캐시미어 코트 매출" → product + itemFilter: ["프리미엄 캐시미어 코트"]
- bestSeller: 베스트셀러, 1등 상품, 가장 잘 팔리는 상품, 인기 1위, 베스트 상품
  - 1위 상품 1개만 반환하는 인텐트. "베스트셀러 뭐야?" → bestSeller
- topProducts: 인기 상품, TOP 상품, 매출 순위, 상품별 매출 TOP 10, 상품별 매출 top 10
  - 특정 상품명이 언급되면 → entities.itemFilter에 상품명 배열 추출
- categoryAnalysis: 카테고리 분석, 카테고리별 매출, 카테고리별 판매, 카테고리별 매출 분포, 카테고리별 판매량
  - **"분포" 키워드 감지**: "카테고리별 매출 분포" → entities.responseHint: "distribution" 추가
  - **"판매량"/"몇개"/"몇 개" 키워드 감지**: "카테고리별 판매량", "가방 몇개 팔았어?" → entities.responseHint: "quantity" 추가
  - 특정 카테고리명이 언급되면 → entities.itemFilter에 카테고리명 배열 추출
  - **⚠️ 카테고리명 직접 언급 규칙**: DB 카테고리 목록에 있는 이름이 언급되고, 매출/판매/팔았어/몇개 등 판매 관련 질문이면 → **categoryAnalysis**로 분류 ("카테고리별" 키워드 없어도)
  - "아우터 매출" → categoryAnalysis + itemFilter: ["아우터"]
  - "아우터 판매량" → categoryAnalysis + responseHint: "quantity" + itemFilter: ["아우터"]
  - "하의 매출 분포" → categoryAnalysis + responseHint: "distribution" + itemFilter: ["하의"]
  - "가방 몇개 팔았어?" → categoryAnalysis + responseHint: "quantity" + itemFilter: ["가방"]
  - "신발 매출 얼마야?" → categoryAnalysis + itemFilter: ["신발"]
  - "악세서리 얼마나 팔렸어?" → categoryAnalysis + responseHint: "quantity" + itemFilter: ["악세서리"]
- unitsSold: 총 판매량, 총 판매 수량, 판매 개수
  - **⚠️ 최우선 규칙**: 카테고리명이나 상품명이 포함된 판매량 질문은 unitsSold가 아님
  - "아우터 판매량" → categoryAnalysis + itemFilter: ["아우터"] (unitsSold 아님)
  - "코트 판매량" → product + itemFilter: ["코트"] (unitsSold 아님)
  - 카테고리/상품명 미포함 시에만 → unitsSold (전체 총 판매량)

*재고(Inventory) 탭:*
- inventory: 재고, 재고현황, 재고 상태, 총 상품 수
  - 특정 상품명이 언급되면 → entities.itemFilter에 상품명 배열 추출
  - 특정 카테고리명이 언급되면 → entities.itemFilter에 카테고리명 배열 추출
  - "프리미엄 캐시미어 코트 재고" → inventory + itemFilter: ["프리미엄 캐시미어 코트"]
  - "상의 재고 알려줘" → inventory + itemFilter: ["상의"]
  - **속성 키워드 감지** (responseHint):
    - "SKU"/"sku넘버"/"SKU번호" → responseHint: "sku"
    - "현재고"/"재고 수량"/"재고 몇 개" → responseHint: "currentStock"
    - "적정재고"/"적정 재고" → responseHint: "optimalStock"
    - "최소재고"/"최소 재고" → responseHint: "minimumStock"
    - "품절 예상"/"소진 예상"/"품절까지" → responseHint: "stockout"
    - "상태"/"재고 상태" (단독 상품과 함께) → responseHint: "status"
  - "가죽 토트백 SKU넘버 알려줘" → inventory + itemFilter: ["가죽 토트백"] + responseHint: "sku"
  - "코트 품절 예상일" → inventory + itemFilter: ["코트"] + responseHint: "stockout"
  - 상품명/카테고리명 미언급 시 → 전체 재고 요약 (기존 동작)
- overstock: 과잉 재고, 과재고, 재고 과잉, 넘치는 재고
  - 특정 카테고리명이 언급되면 → entities.itemFilter에 카테고리명 배열 추출
- stockAlert: 재고 부족 경고, 재고 부족, 재주문 필요, 부족 알림, 재고부족
  - 특정 카테고리명이 언급되면 → entities.itemFilter에 카테고리명 배열 추출
- stockMovement: 입출고, 입출고 내역, 입고, 출고, 재고 이동, 최근 입출고
- stockDistribution: 재고 분포, 재고 상태 분포, 재고 비율
- healthyStock: 정상 재고, 양호 재고, 정상 재고 몇 개
- inventoryCategory: 카테고리별 재고, 카테고리별 재고 현황
  - 특정 카테고리명이 언급되면 → entities.itemFilter에 카테고리명 배열 추출
  - "아우터 카테고리 재고" → inventoryCategory + itemFilter: ["아우터"]
- inventoryDetail: 상세 재고, 상세 재고 현황, 재고 테이블

*예측(Prediction) 탭:* (데이터 조회 없이 탭 이동만 수행)
- predictionRevenue, predictionVisitors, predictionConversion, predictionSummary, predictionConfidence, predictionDaily, predictionModel
- 매출 예측, 방문자 예측, 전환율 예측, 예측 요약, 예측 신뢰도, 일별 예측, 예측 모델 등
- → 예측 탭으로 이동하고 "예측 데이터는 예측 탭에서 직접 확인하실 수 있습니다" 안내

*AI추천(AI Recommendation) 탭:* (데이터 조회 없이 탭 이동만 수행)
- activeStrategies, strategyRecommendation, priceOptimization, inventoryOptimization, demandForecast, seasonTrend, riskPrediction, campaignStatus
- 활성 전략, 전략 추천, 가격 최적화, 재고 최적화, 수요 예측, 시즌 트렌드, 리스크 예측, 캠페인 등
- → AI추천 탭으로 이동하고 "AI 추천 데이터는 AI추천 탭에서 직접 확인하실 수 있습니다" 안내

*데이터 컨트롤타워:*
- dataQuality: 데이터 품질, 품질 점수, 데이터 품질 스코어
- dataSources: 연결된 소스, 데이터 소스, 비즈니스 데이터 소스, 비즈니스 소스
- contextDataSources: 컨텍스트 데이터 소스, 컨텍스트 소스, 날씨 데이터, 공휴일 데이터, 이벤트 데이터
- pipelineStatus: 파이프라인 상태, 데이터 흐름, 데이터 흐름 현황, ETL 현황, 데이터 수집 상태, 동기화 현황
- apiConnections: API 연결, 연결된 API, API 현황, API 연결 목록
- importHistory: 임포트 히스토리, 임포트 내역, 데이터 임포트, 업로드 이력

*ROI 측정:*
- roiSummary: ROI 요약, ROI 현황, ROI 얼마, ROI 보여줘, 성과 요약
- appliedStrategies: 적용된 전략, 적용 전략, 전략 이력, 적용 이력, 전략 히스토리
- categoryPerformance: 카테고리별 성과, 2D 성과, 3D 성과, 전략 카테고리, 시뮬레이션 성과
- roiInsight: ROI 인사이트, ROI 분석, 전략 분석

*ROI 테이블 제어:*
- filterStrategies: 필터 변경 요청. filter 엔티티에 status/source 포함
  - "완료된 전략만 보여줘" → filter: { status: "completed" }
  - "진행 중인 전략만" → filter: { status: "active" }
  - "취소된 전략" → filter: { status: "cancelled" }
  - "3D 시뮬레이션 전략만" → filter: { source: "3d_simulation" }
  - "2D 전략만 보여줘" → filter: { source: "2d_simulation" }
  - "전체 보기", "필터 초기화" → filter: { status: "all", source: "all" }
- exportStrategies: 적용 이력 내보내기, CSV 다운로드, 내보내기 해줘
- roiTablePage: 다음 페이지, 이전 페이지, N페이지로
  - "다음 페이지" → tablePage: "next"
  - "이전 페이지" → tablePage: "prev"
  - "1페이지로" → tablePage: 1, "3페이지" → tablePage: 3

*설정 & 관리:*
- storeManagement: 매장 관리, 매장 목록, 매장 설정, 등록된 매장
- userManagement: 사용자 관리, 팀원 관리, 멤버, 멤버 목록, 사용자 목록
- subscriptionInfo: 구독 정보, 플랜, 라이선스, 요금제, 구독 현황, 현재 플랜
- systemSettings: 시스템 설정, 조직 설정, 알림 설정, 타임존 설정, 알림
- dataSettings: 데이터 설정, 그래프 엔티티, 온톨로지, 커넥터 관리, API 커넥터`;
