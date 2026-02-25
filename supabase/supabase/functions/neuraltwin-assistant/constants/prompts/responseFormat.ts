/**
 * 인텐트 분류 프롬프트 — 날짜 파싱 + JSON 응답 스키마 + 주의사항
 */

export const RESPONSE_FORMAT = `### 날짜 표현 파싱
- 상대 날짜: 오늘, 어제, 이번주, 지난주, 이번달, 지난달
- 기간: 7일, 30일, 90일
- 커스텀 일수: "최근 5일", "10일간", "15일 동안" 등 임의 일수
- 자연어: 12월 첫째주, 12월 초/중순/말, 연말, 연초
- 절대 범위: 12월 1-10일, 12/1~15

## 응답 형식 (반드시 JSON만)
\`\`\`json
{
  "intent": "인텐트명",
  "confidence": 0.0~1.0,
  "reasoning": "이 인텐트로 판단한 이유 (한 줄)",
  "entities": {
    "page": "/insights",
    "tab": "customer",
    "sectionId": "customer-kpi",
    "modalId": "goal-settings",
    "queryType": "revenue",
    "period": {
      "type": "today | yesterday | thisWeek | lastWeek | thisMonth | lastMonth | 7d | 30d | 90d | custom",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    },
    "filter": {
      "status": "all | active | completed | cancelled",
      "source": "all | 2d_simulation | 3d_simulation"
    },
    "tablePage": "next | prev | 숫자",
    "scenario": "christmas",
    "simulationType": "traffic_flow",
    "optimizationType": "layout",
    "overlay": "heatmap | flow | avatar | zone | staff",
    "visible": true,
    "simCommand": "play | pause | stop | reset | set_speed",
    "simSpeed": 2.0,
    "simType": "realtime | prediction",
    "customerCount": 100,
    "duration": 60,
    "optGoal": "revenue | dwell_time | traffic | conversion",
    "optTypes": ["layout", "staffing"],
    "optIntensity": "low | medium | high",
    "viewMode": "as-is | compare | to-be",
    "panel": "resultReport | sceneSave",
    "sceneName": "씬 이름",
    "weather": "clear | rain | snow | clouds | heavy_snow",
    "timeOfDay": "morning | afternoon | evening | night | peak",
    "holidayType": "none | weekend | holiday | christmas | black_friday",
    "itemFilter": ["존/상품/세그먼트 이름"],
    "hour": 0,
    "responseHint": "distribution"
  }
}
\`\`\`

**주의사항:**
- 엔티티는 해당하는 것만 포함 (불필요한 필드 제외)
- confidence는 확신도에 따라 0.5~1.0 사이로 설정
- 애매한 경우 가장 가능성 높은 인텐트 선택 후 confidence 낮춤
- reasoning은 간단히 한 줄로
- itemFilter: 특정 항목(존, 상품, 세그먼트 등)이 이름으로 언급된 경우만 포함. 핵심 키워드만 추출 (예: "액세서리 존" → "액세서리")
  - **고객 세그먼트 동의어 매핑**: 충성/단골/로열/loyal → "VIP", 신규/new → "New", 일반/regular → "Regular", 휴면/dormant → "Dormant"
  - 동의어가 언급되면 반드시 DB 세그먼트명(VIP, New, Regular, Dormant)으로 변환하여 itemFilter에 추출
- hour: 특정 시간이 언급된 경우만 포함 (0-23). "N시에 방문", "오후 N시" 등. 날짜의 일(日)과 혼동하지 말 것
- responseHint: zoneAnalysis/categoryAnalysis에서 "분포" → "distribution", categoryAnalysis에서 "판매량/수량" → "quantity". inventory에서 "SKU/sku넘버" → "sku", "현재고/재고 수량" → "currentStock", "적정재고" → "optimalStock", "최소재고" → "minimumStock", "품절 예상/소진 예상" → "stockout", "상태" → "status". 해당 없으면 생략`;
