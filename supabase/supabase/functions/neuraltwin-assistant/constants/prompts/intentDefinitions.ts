/**
 * 인텐트 분류 프롬프트 — 인텐트 정의 (navigate ~ general_chat)
 */

export const INTENT_DEFINITIONS = `### 2. navigate (페이지 이동)
다른 페이지로 이동하려는 의도
- "인사이트 허브로 가줘", "스튜디오 열어줘"
- "ROI 측정 페이지", "설정으로 이동"

**page 값:** /insights, /studio, /roi, /settings, /data/control-tower

### 3. set_tab (탭 전환)
현재 페이지 내에서 탭만 변경
- "고객탭 보여줘", "재고탭 열어줘"
- "개요로 돌아가", "AI추천 탭"
- "AI추천 보여줘", "ai추천 탭 보여줘" → tab: "ai"
- "예측탭 열어줘", "예측 보여줘" → tab: "prediction"
- "매장탭 보여줘" → tab: "store"

**tab 값:**
- 인사이트: overview, store, customer, product, inventory, prediction, ai
- 스튜디오: layer, ai-simulation, ai-optimization, apply
- 설정: stores, data, users, system, license

**중요:** "AI추천", "AI 추천", "ai추천"이라는 단어가 포함되어 있고 탭 전환 의도면 반드시 tab: "ai"를 사용하세요 ("ai-recommendation"이 아님).

### 4. scroll_to_section (섹션 스크롤)
페이지 내 특정 섹션으로 스크롤
- "KPI 카드 보여줘", "트렌드 차트 확인"
- "목표 달성률 섹션", "히트맵 보기"
- "동선 분석", "재고 알림"

**sectionId 값:**
- 개요: overview-kpi-cards, overview-funnel, overview-goals, overview-insights
- 매장: store-kpi-cards, store-hourly-pattern, store-zone-dwell, store-zone-distribution, store-zone-performance
- 고객: customer-kpi-cards, customer-segment-distribution, customer-avg-purchase, customer-return-trend
- 상품: product-kpi-cards, product-top10, product-category-revenue, product-category-quantity
- 재고: inventory-kpi-cards, inventory-distribution, inventory-category, inventory-risk, inventory-movements, inventory-detail
- 예측: prediction-kpi-cards, prediction-revenue, prediction-visitors, prediction-conversion, prediction-daily, prediction-model
- AI추천: ai-active-strategies, ai-predict, ai-optimize, ai-recommend, ai-execute
- ROI 측정: roi-summary, strategy-performance, applied-strategies, roi-analysis
- 데이터 컨트롤타워: data-quality, data-sources, data-import, api-connections, pipeline, model-upload
- 설정(매장관리): settings-store-list
- 설정(데이터): settings-data-stats, settings-api-connections
- 설정(사용자): settings-members
- 설정(시스템): settings-org
- 설정(플랜): settings-subscription

### 5. open_modal (모달/팝업 열기)
설정 창이나 입력 폼을 **열려는** 의도 (확인이 아닌 설정/변경)
- "목표 설정해줘", "목표 설정하고 싶어" (새로 설정하려는 의도)
- "목표 설정창 켜줘", "목표 설정 창 열어줘", "목표 설정 창 켜줘"
- "데이터 내보내기", "사용자 초대"
- "새 연결 추가", "플랜 업그레이드"
- "매장 추가해줘", "새 매장 등록"

**modalId 값:**
- goal-settings, date-picker, export-data
- simulation-config, optimization-config
- new-connection, add-store, invite-user, plan-upgrade

**"켜줘/열어줘" + "창/설정창/팝업"** 패턴은 항상 open_modal로 분류하세요.

### 6. set_date_range (날짜 필터 변경)
데이터 조회 없이 날짜 필터만 변경
- "7일로 설정", "이번 달로 변경"
- "12/1~12/15 기간으로"

### 7. composite_navigate (복합 네비게이션)
페이지 + 탭 + 날짜가 복합된 요청
- "인사이트 허브 고객탭 7일 데이터로"

### 8. run_simulation (시뮬레이션 실행)
디지털트윈 시뮬레이션 **실행** 요청 (실행 의도가 명확할 때)
- "시뮬레이션 돌려줘", "시뮬레이션 실행해줘"
- "크리스마스 시뮬레이션 해줘", "연말 시나리오 돌려봐"
- "트래픽 시뮬레이션", "고객 흐름 예측해줘"
- "비 오는 평일 시뮬레이션 실행", "블랙프라이데이 시뮬레이션"

**entities.scenario 값** (시나리오가 언급된 경우만):
- christmas: 크리스마스, 크리스마스 시즌
- black_friday: 블랙프라이데이
- rainy_weekday: 비 오는 평일, 비오는 평일
- new_arrival: 신상품 출시, 신상품
- normal_weekend: 일반 주말, 주말
- cold_wave: 한파, 한파 경보
- year_end: 연말, 연말 파티

**entities.simulationType 값**:
- traffic_flow: 고객 흐름/트래픽/동선 (기본값)
- congestion: 혼잡도/병목
- revenue: 매출 예측

### 8-2. run_optimization (최적화 실행)
레이아웃/상품/동선 최적화 **실행** 요청
- "최적화 해줘", "최적화 실행해줘"
- "가구 배치 최적화", "상품 진열 최적화"
- "동선 개선해줘", "직원 배치 최적화"

**entities.optimizationType 값**:
- layout: 가구 배치 (기본값)
- merchandising: 상품 진열
- flow: 동선 개선
- staffing: 직원 배치
- both: 통합 최적화

### 8-3. toggle_overlay (스튜디오 시각화 토글)
디지털트윈 스튜디오의 시각화 레이어를 켜거나 끄는 요청
- "히트맵 켜줘", "히트맵 꺼줘", "히트맵 보여줘"
- "동선 켜줘", "동선 표시해줘", "동선 숨겨줘"
- "고객 아바타 켜줘", "고객 표시해줘", "고객 보여줘"
- "존 켜줘", "존 표시해줘", "존 경계 보여줘"
- "직원 켜줘", "직원 위치 보여줘", "직원 숨겨"

**entities.overlay 값**: heatmap, flow, avatar, zone, staff
**entities.visible 값** (선택):
- true: 켜줘, 보여줘, 표시, 활성화
- false: 꺼줘, 숨겨, 비활성화
- (생략): 토글

### 8-4. simulation_control (시뮬레이션 제어)
실행 중인 시뮬레이션의 재생/일시정지/정지/리셋/속도 변경
- "시뮬레이션 시작", "재생해줘" → simCommand: "play"
- "일시정지", "멈춰" → simCommand: "pause"
- "시뮬레이션 정지", "중지" → simCommand: "stop"
- "리셋", "초기화" → simCommand: "reset"
- "속도 2배로", "속도 0.5배" → simCommand: "set_speed", simSpeed: 2.0

**entities.simCommand 값**: play, pause, stop, reset, set_speed
**entities.simSpeed 값**: 0.5 ~ 4.0 사이의 숫자 (set_speed일 때만)

### 8-5. apply_preset (프리셋 시나리오 적용 - 실행 없이)
시나리오 프리셋을 **세팅만** 하고 실행은 하지 않는 요청
- "크리스마스 시나리오 적용해줘", "블프 시나리오 세팅해줘"
- "비 오는 평일로 세팅", "한파 시나리오 설정"

**entities.scenario 값**: (run_simulation과 동일)

**주의:** "시뮬레이션 해줘/돌려줘/실행" 등 실행 의도 → run_simulation
"적용/세팅/설정" 등 설정만 의도 → apply_preset

### 8-6. set_simulation_params (시뮬레이션 파라미터 설정)
시뮬레이션의 세부 파라미터를 변경하는 요청
- "실시간 모드로 변경", "AI 예측 모드로 바꿔" → simType: "realtime" / "prediction"
- "고객 200명으로 설정", "고객 수 50명" → customerCount: 200
- "시뮬레이션 시간 30분으로" → duration: 30

**entities.simType 값**: realtime, prediction
**entities.customerCount 값**: 숫자
**entities.duration 값**: 숫자(분)

### 8-7. set_optimization_config (최적화 설정 변경)
최적화의 목표/유형/강도를 **설정**하는 요청 (실행 아님)
- "최적화 목표를 매출로", "전환율 향상 목표로 설정"
- "레이아웃 최적화만 선택", "직원 배치도 포함"
- "강도 높음으로", "최적화 강도 낮게"

**entities.optGoal 값**: revenue, dwell_time, traffic, conversion
**entities.optTypes 값**: ["layout"], ["staffing"], ["layout", "staffing"]
**entities.optIntensity 값**: low, medium, high

### 8-8. set_view_mode (뷰 모드 전환)
최적화 결과 뷰 모드를 전환하는 요청
- "현재 상태 보여줘", "As-Is로" → viewMode: "as-is"
- "비교 모드", "비교해서 보여줘" → viewMode: "compare"
- "최적화 결과 보여줘", "To-Be로" → viewMode: "to-be"

**entities.viewMode 값**: as-is, compare, to-be

### 8-9. toggle_panel (패널 토글)
AI 리포트 또는 씬 저장 패널을 열거나 닫는 요청
- "AI 리포트 보여줘", "AI 리포트 열어줘" → panel: "resultReport", visible: true
- "AI 리포트 닫아줘" → panel: "resultReport", visible: false
- "씬 저장 열어줘", "씬 저장 패널 켜줘" → panel: "sceneSave", visible: true
- "씬 저장 닫아줘" → panel: "sceneSave", visible: false

**entities.panel 값**: resultReport, sceneSave
**entities.visible 값**: true (열기), false (닫기), 미지정 (토글)

### 8-10. save_scene (씬 저장)
현재 스튜디오 씬을 저장하는 요청
- "씬 저장해줘", "현재 상태 저장"
- "크리스마스 최적화로 저장해줘" → sceneName: "크리스마스 최적화"

**entities.sceneName 값**: 사용자가 지정한 이름 (선택)

### 8-11. set_environment (환경 설정 변경)
시뮬레이션 환경 조건을 변경하는 요청
- "날씨 비로 변경", "날씨 맑음으로" → weather
- "시간대 오전으로", "저녁 시간대로" → timeOfDay
- "공휴일로 설정", "주말로 변경" → holidayType

**entities.weather 값**: clear, rain, snow, clouds, heavy_snow
**entities.timeOfDay 값**: morning, afternoon, evening, night, peak
**entities.holidayType 값**: none, weekend, holiday, christmas, black_friday

### 9. general_chat (일반 대화)
위 어떤 인텐트에도 해당하지 않는 일반 대화
- "안녕", "뭐 할 수 있어?", "도움말"`;
