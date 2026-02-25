/**
 * 인텐트 분류 프롬프트 — 중의성 해소 및 판단 기준
 */

export const DISAMBIGUATION_RULES = `## 중요 판단 기준

### "보여줘" 요청 해석
1. **데이터/수치를 보여달라** → query_kpi
   - "매출 보여줘", "방문객 보여줘", "목표 달성률 보여줘"
2. **특정 화면/섹션을 보여달라** → scroll_to_section 또는 set_tab
   - "KPI 카드 보여줘", "고객탭 보여줘"
3. **설정 화면을 열어달라** → open_modal
   - "목표 설정 창 열어줘"

### "목표 설정" 요청 해석
- "목표 설정 **보여줘/확인/어때**" → query_kpi (queryType: goal) - 현재 목표 확인
- "목표 **설정해줘/설정하고 싶어/변경/켜줘**" → open_modal (modalId: goal-settings) - 새로 설정
- "목표 설정창 켜줘", "목표 설정 창 열어줘" → open_modal (modalId: goal-settings)

### "AI추천" 요청 해석
- "AI추천 보여줘", "AI추천 탭 보여줘", "ai추천 탭" → set_tab (tab: "ai") - AI추천 탭 전환
- "활성 전략 보여줘", "전략 추천해줘" → query_kpi - AI추천 탭의 특정 데이터 조회

### "ROI" 요청 해석
- "ROI 보여줘", "ROI 얼마야?", "ROI 현황" → query_kpi (queryType: roiSummary)
- "적용된 전략 뭐야?", "전략 이력 보여줘" → query_kpi (queryType: appliedStrategies)
- "카테고리별 성과", "2D/3D 성과 비교" → query_kpi (queryType: categoryPerformance)
- "ROI 분석해줘", "ROI 인사이트" → query_kpi (queryType: roiInsight)
- "ROI 측정 페이지로 가줘" → navigate (page: "/roi")

### "설정" 요청 해석
- "매장 관리 보여줘", "등록된 매장 알려줘" → query_kpi (queryType: storeManagement)
- "사용자 목록", "팀원 몇 명?" → query_kpi (queryType: userManagement)
- "현재 플랜 뭐야?", "라이선스 확인" → query_kpi (queryType: subscriptionInfo)
- "시스템 설정 보여줘", "알림 설정 확인" → query_kpi (queryType: systemSettings)
- "데이터 설정", "커넥터 관리" → query_kpi (queryType: dataSettings)
- "매장 추가해줘", "새 매장 등록" → open_modal (modalId: add-store)
- "사용자 초대해줘" → open_modal (modalId: invite-user)
- "플랜 업그레이드" → open_modal (modalId: plan-upgrade)
- "매장 관리 탭 열어줘" → set_tab (tab: "stores")

### "ROI 테이블" 요청 해석
- "완료된 전략만 보여줘" → query_kpi (queryType: filterStrategies, filter: { status: "completed" })
- "3D 시뮬레이션 전략만" → query_kpi (queryType: filterStrategies, filter: { source: "3d_simulation" })
- "전체 보기", "필터 초기화" → query_kpi (queryType: filterStrategies, filter: { status: "all", source: "all" })
- "적용 이력 내보내줘", "CSV 다운로드" → query_kpi (queryType: exportStrategies)
- "다음 페이지" → query_kpi (queryType: roiTablePage, tablePage: "next")
- "이전 페이지" → query_kpi (queryType: roiTablePage, tablePage: "prev")
- "3페이지로" → query_kpi (queryType: roiTablePage, tablePage: 3)

### 중복 위치 용어 처리 (중의성 해소)
일부 용어는 여러 탭에 존재합니다. 이 경우 **현재 컨텍스트**를 고려하세요:
- **순 방문객** → 개요탭(overview), 고객탭(customer) 모두에 존재
- **총 매출** → 개요탭(overview), 상품탭(product) 모두에 존재
- **전환율** → 개요탭(overview), 고객탭(customer) 모두에 존재
- **재고 부족** → 상품탭(product), 재고탭(inventory) 모두에 존재
- **체류 시간** → 매장탭(store), 고객탭(customer) 모두에 존재

**판단 규칙:**
1. 사용자가 현재 해당 용어가 있는 탭에 있으면 → 현재 탭 유지 (query_kpi)
2. 사용자가 해당 용어가 없는 탭에 있으면 → 가장 관련성 높은 탭으로 이동 (query_kpi)
3. 확신이 낮으면 confidence를 낮게 (0.6~0.7) 설정

**visitors vs hourlyPattern 구분 (최우선):**
- "방문자/방문객/트래픽" 단어가 포함되더라도 **특정 시간(N시)이 함께 언급**되면 → **hourlyPattern** (매장 탭)
- "방문자/방문객/트래픽"만 단독이면 → **visitors** (고객 탭)
- 예: "12시 방문자 몇명?" → hourlyPattern, "25년 11월 1일 12시 방문자 몇명이야?" → hourlyPattern, "방문객 몇명?" → visitors`;
