# NEURALTWIN OS 챗봇 — 인텐트 강화 설계 문서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **상태**: 설계 완료, 구현 대기
> **목적**: AI 인텐트 분류 및 엔티티 추출 정확도 향상

---

## 1. 현재 문제점 분석

### 1.1 근본 원인

```
현재: 정규식 패턴 기반 (열거형) → 정의된 표현만 인식
자연어: 무한한 variation → 모든 표현을 수동 정의 불가능
```

### 1.2 구체적 문제

| 카테고리 | 문제 | 예시 |
|:---------|:-----|:-----|
| **날짜 표현** | variation 부족 | "12월 1-10일" ✅ / "12월 1일부터 10일까지" ❌ / "12월 첫째주" ❌ |
| **용어 인식** | 대시보드 용어 미등록 | "순 방문객", "목표 달성률", "체류 시간" 등 미인식 |
| **용어 중의성** | 복수 탭에 존재하는 용어 | "순 방문객" → 개요탭? 고객탭? |
| **자연어 variation** | 동일 의도 다른 표현 | "보여줘" / "알려줘" / "확인해줘" / "어때?" |
| **조건부 응답** | 데이터 없을 때 처리 | 목표 미설정 시 "목표 달성률" 질문 응답 |

### 1.3 현재 시스템 한계

```
INTENT_CLASSIFICATION_PROMPT (현재):
- 9개 인텐트 나열만 존재
- 대시보드 구조 간략 설명 (탭명만 나열)
- Few-shot 예시 없음
- 엔티티 스키마 단순
- 용어 중의성 처리 규칙 없음
```

---

## 2. 해결 방향

### 2.1 접근 전략

| 단계 | 전략 | 효과 |
|:-----|:-----|:-----|
| **단기** | INTENT_CLASSIFICATION_PROMPT 대폭 강화 | 코드 변경 최소, 즉시 효과 |
| **중기** | AI-First 구조 전환 (패턴 의존도 감소) | 확장성 확보 |
| **장기** | 사용자 로그 분석 + 지속적 개선 | 정확도 고도화 |

### 2.2 핵심 원칙

1. **AI에게 풍부한 컨텍스트 제공**: 대시보드 전체 구조, 용어, 위치 정보
2. **컨텍스트 기반 추론**: 현재 페이지/탭 + 대화 맥락 활용
3. **조건부 응답 로직**: 데이터/설정 존재 여부에 따른 분기
4. **세분화된 액션 타입**: 스크롤, 모달, 하이라이트 등

---

## 3. 대시보드 구조 정의 (전체)

### 3.1 페이지-탭-섹션 계층 구조

```yaml
Dashboard:
  - path: /data/control-tower
    name: 데이터 컨트롤타워
    aliases: [컨트롤타워, 데이터 컨트롤, data control tower]
    sections:
      - id: data-sources
        name: 데이터 소스
        components: [연결 목록, 새 연결 추가 버튼]

  - path: /insights
    name: 인사이트 허브
    aliases: [인사이트, insight, insights]
    tabs:
      - id: overview
        name: 개요
        aliases: [개요탭, overview, 오버뷰]
        sections:
          - id: kpi-cards
            name: KPI 카드 섹션
            components:
              - id: total-revenue
                name: 총 매출
                aliases: [매출, revenue, 수익]
              - id: unique-visitors
                name: 순 방문객
                aliases: [방문객, visitors, 고객수]
              - id: conversion-rate
                name: 전환율
                aliases: [conversion, 구매전환]
              - id: avg-transaction
                name: 평균 객단가
                aliases: [객단가, 거래금액]
          - id: goal-achievement
            name: 목표 달성률 섹션
            components:
              - id: goal-card
                name: 목표 달성률 카드
                aliases: [목표 달성, 목표, goal]
                requires: goal_settings  # 목표 설정 필요
                fallback_action: open_goal_settings_modal
          - id: trend-chart
            name: 트렌드 차트 섹션
            components:
              - id: revenue-trend
                name: 매출 추이
              - id: visitor-trend
                name: 방문객 추이
          - id: daily-summary
            name: 일별 요약 테이블

      - id: store
        name: 매장
        aliases: [매장탭, store, 스토어]
        sections:
          - id: store-performance
            name: 매장 성과
          - id: zone-heatmap
            name: 구역별 히트맵
          - id: traffic-flow
            name: 동선 분석

      - id: customer
        name: 고객
        aliases: [고객탭, customer, 고객분석]
        sections:
          - id: customer-kpi
            name: 고객 KPI
            components:
              - id: unique-visitors
                name: 순 방문객
                aliases: [방문객, visitors]
              - id: new-vs-returning
                name: 신규/재방문
              - id: dwell-time
                name: 체류 시간
                aliases: [체류시간, 머문시간]
          - id: customer-segments
            name: 고객 세그먼트
          - id: behavior-analysis
            name: 행동 분석

      - id: product
        name: 상품
        aliases: [상품탭, product, 상품분석]
        sections:
          - id: product-performance
            name: 상품 성과
          - id: category-analysis
            name: 카테고리 분석
          - id: sales-ranking
            name: 판매 순위

      - id: inventory
        name: 재고
        aliases: [재고탭, inventory, 재고관리]
        sections:
          - id: inventory-status
            name: 재고 현황
          - id: stock-alerts
            name: 재고 알림
          - id: reorder-suggestions
            name: 발주 제안

      - id: prediction
        name: 예측
        aliases: [예측탭, prediction, 예측분석]
        sections:
          - id: demand-forecast
            name: 수요 예측
          - id: trend-prediction
            name: 트렌드 예측

      - id: ai-recommendation
        name: AI추천
        aliases: [AI추천탭, ai-recommendation, AI 추천, 추천]
        sections:
          - id: action-recommendations
            name: 액션 추천
          - id: optimization-suggestions
            name: 최적화 제안

  - path: /studio
    name: 디지털트윈 스튜디오
    aliases: [스튜디오, studio, 디지털트윈, 디지털 트윈]
    tabs:
      - id: layer
        name: 레이어
        aliases: [레이어탭, layer]
      - id: ai-simulation
        name: AI 시뮬레이션
        aliases: [시뮬레이션탭, simulation, 시뮬레이션]
      - id: ai-optimization
        name: AI 최적화
        aliases: [최적화탭, optimization, 최적화]
      - id: apply
        name: 적용
        aliases: [적용탭, apply]

  - path: /roi
    name: ROI 측정
    aliases: [ROI, roi, 알오아이, ROI측정]
    sections:
      - id: strategy-performance
        name: 전략 성과
      - id: roi-analysis
        name: ROI 분석

  - path: /settings
    name: 설정 & 관리
    aliases: [설정, settings, 세팅]
    tabs:
      - id: store-management
        name: 매장 관리
        aliases: [매장관리, 매장설정]
      - id: data
        name: 데이터
        aliases: [데이터탭, 데이터설정]
      - id: users
        name: 사용자
        aliases: [사용자탭, 사용자관리, 팀원]
      - id: system
        name: 시스템
        aliases: [시스템탭, 시스템설정]
      - id: plan
        name: 플랜
        aliases: [플랜탭, 구독, 요금제]
```

### 3.2 용어-위치 매핑 테이블

동일 용어가 복수 위치에 존재하는 경우의 우선순위 정의:

```typescript
const TERM_LOCATION_MAP = {
  "순 방문객": {
    primary: { page: "/insights", tab: "customer", section: "customer-kpi" },
    secondary: [
      { page: "/insights", tab: "overview", section: "kpi-cards" }
    ],
    description: {
      customer: "고객 세그먼트별 상세 분석",
      overview: "전체 트래픽 요약"
    }
  },
  "매출": {
    primary: { page: "/insights", tab: "overview", section: "kpi-cards" },
    secondary: [
      { page: "/insights", tab: "product", section: "product-performance" },
      { page: "/roi", section: "strategy-performance" }
    ]
  },
  "전환율": {
    primary: { page: "/insights", tab: "overview", section: "kpi-cards" },
    secondary: [
      { page: "/insights", tab: "customer", section: "customer-kpi" }
    ]
  },
  "재고": {
    primary: { page: "/insights", tab: "inventory", section: "inventory-status" },
    secondary: [
      { page: "/insights", tab: "product", section: "product-performance" }
    ]
  },
  "목표 달성률": {
    primary: { page: "/insights", tab: "overview", section: "goal-achievement" },
    requires: "goal_settings",
    fallback: {
      message: "현재 설정된 목표가 없습니다. 목표 설정을 진행해주세요.",
      action: {
        type: "open_modal",
        modalId: "goal-settings",
        buttonText: "목표 설정하러 가기"
      }
    }
  },
  "체류 시간": {
    primary: { page: "/insights", tab: "customer", section: "customer-kpi" },
    secondary: [
      { page: "/insights", tab: "store", section: "zone-heatmap" }
    ]
  }
};
```

---

## 4. 날짜 표현 Variation 정의

### 4.1 지원해야 할 날짜 표현 패턴

```yaml
날짜 표현 패턴:
  절대 날짜:
    - "12월 1일" → 2026-12-01
    - "12월 1일-10일" → 2026-12-01 ~ 2026-12-10
    - "12월 1-10일" → 2026-12-01 ~ 2026-12-10
    - "12월 1일부터 10일까지" → 2026-12-01 ~ 2026-12-10
    - "12/1" → 2026-12-01
    - "12/1-12/10" → 2026-12-01 ~ 2026-12-10
    - "12/1~10" → 2026-12-01 ~ 2026-12-10
    - "2026년 12월 1일" → 2026-12-01
    - "26년 12월" → 2026-12-01 ~ 2026-12-31

  상대 날짜:
    - "오늘" → today
    - "어제" → yesterday
    - "그제", "그저께" → 2 days ago
    - "이번 주" → this week (월~일)
    - "지난 주", "저번 주" → last week
    - "이번 달" → this month
    - "지난 달", "저번 달" → last month
    - "이번 분기" → this quarter
    - "올해" → this year

  상대 기간:
    - "최근 7일", "지난 7일" → last 7 days
    - "최근 일주일", "지난 일주일" → last 7 days
    - "최근 30일", "지난 한달" → last 30 days
    - "최근 90일", "지난 3개월" → last 90 days
    - "최근 1년" → last 365 days

  자연어 기간:
    - "12월 첫째주" → 12월 1일 ~ 12월 7일
    - "12월 둘째주" → 12월 8일 ~ 12월 14일
    - "12월 초" → 12월 1일 ~ 12월 10일
    - "12월 중순" → 12월 11일 ~ 12월 20일
    - "12월 말" → 12월 21일 ~ 12월 31일
    - "연말" → 12월 1일 ~ 12월 31일
    - "연초" → 1월 1일 ~ 1월 31일
    - "크리스마스 전후" → 12월 23일 ~ 12월 27일
    - "블랙프라이데이 주간" → 해당 주

  비교 기간:
    - "전주 대비" → 이번 주 vs 지난 주
    - "전월 대비" → 이번 달 vs 지난 달
    - "전년 동기 대비" → 올해 vs 작년 같은 기간
```

### 4.2 AI에게 제공할 날짜 파싱 지침

```
## 날짜 파싱 규칙

1. 연도가 명시되지 않으면 현재 연도(2026) 사용
2. 미래 날짜가 계산되면 과거로 해석 (12월 → 작년 12월)
3. "~부터", "~까지" 표현은 시작/종료 구분
4. "최근", "지난" 등은 오늘 기준 과거
5. "이번" 등은 현재 포함 기간
6. 불명확한 경우 가장 가까운 과거 해석

## 출력 형식
{
  "dateType": "absolute" | "relative" | "preset",
  "startDate": "YYYY-MM-DD",  // absolute인 경우
  "endDate": "YYYY-MM-DD",    // absolute인 경우
  "preset": "today" | "7d" | "30d" | "90d" | "thisWeek" | "thisMonth",  // preset인 경우
  "relativeDays": number      // relative인 경우 (음수 = 과거)
}
```

---

## 5. 새로운 UIAction 타입 정의

### 5.1 확장된 UIAction 스키마

```typescript
type UIAction =
  // 기존 액션
  | { type: 'navigate'; page: string; }
  | { type: 'set_tab'; tab: string; }
  | { type: 'set_date_range'; preset?: string; startDate?: string; endDate?: string; }

  // 신규 액션
  | {
      type: 'scroll_to_section';
      sectionId: string;
      highlight?: boolean;        // 섹션 하이라이트 여부
      highlightDuration?: number; // 하이라이트 지속 시간 (ms)
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
    };
```

### 5.2 복합 액션 시퀀스

여러 액션을 순차 실행하는 경우:

```typescript
interface ActionSequence {
  actions: UIAction[];
  executeMode: 'sequential' | 'parallel';
  delayBetween?: number;  // sequential일 때 액션 간 딜레이 (ms)
}

// 예시: "목표 달성률 보여줘" → 목표 설정 안 된 경우
const goalNotSetSequence: ActionSequence = {
  actions: [
    { type: 'navigate', page: '/insights' },
    { type: 'set_tab', tab: 'overview' },
    { type: 'scroll_to_section', sectionId: 'goal-achievement', highlight: true },
  ],
  executeMode: 'sequential',
  delayBetween: 300
};
```

---

## 6. 컨텍스트 기반 추론 규칙

### 6.1 현재 위치 활용

```yaml
컨텍스트 추론 규칙:

  규칙 1 - 현재 탭 우선:
    조건: 요청된 용어가 현재 탭에 존재
    동작: 탭 전환 없이 해당 섹션으로 스크롤
    예시:
      - 현재: 개요탭
      - 요청: "순 방문객 보여줘"
      - 결과: 개요탭 KPI 카드 섹션으로 스크롤

  규칙 2 - 페이지 내 탭 전환:
    조건: 요청된 용어가 현재 페이지의 다른 탭에 존재
    동작: 해당 탭으로 전환 + 섹션 스크롤
    예시:
      - 현재: 인사이트 허브 > 매장탭
      - 요청: "순 방문객 보여줘"
      - 결과: 고객탭으로 전환 + 고객 KPI 섹션 스크롤

  규칙 3 - 페이지 이동:
    조건: 요청된 용어가 다른 페이지에만 존재
    동작: 페이지 이동 + 탭 전환 + 섹션 스크롤
    예시:
      - 현재: ROI 측정
      - 요청: "재고 현황 보여줘"
      - 결과: 인사이트 허브 > 재고탭 > 재고 현황 섹션

  규칙 4 - 용어 중의성 해소:
    조건: 요청된 용어가 복수 위치에 존재하고 현재 위치에 없음
    동작: primary 위치로 이동 + 대안 안내
    예시:
      - 현재: ROI 측정
      - 요청: "순 방문객 보여줘"
      - 결과: 고객탭으로 이동 + "개요탭에서도 확인 가능" 안내
```

### 6.2 대화 맥락 활용

```yaml
대화 맥락 규칙:

  규칙 1 - 이전 주제 연속:
    조건: 이전 대화에서 특정 탭/주제 언급
    동작: 해당 컨텍스트 유지
    예시:
      - 이전: "고객 분석 보여줘" → 고객탭 이동
      - 현재: "전환율은?"
      - 결과: 고객탭의 전환율 (개요탭 아님)

  규칙 2 - 비교 요청:
    조건: "대비", "비교", "차이" 표현
    동작: 비교 가능한 뷰/데이터 제공
    예시:
      - 요청: "지난주 대비 매출 어때?"
      - 결과: 매출 + 전주 대비 변화율 응답
```

---

## 7. 조건부 응답 로직

### 7.1 데이터/설정 존재 여부 확인

```typescript
interface ConditionalResponse {
  // 조건 확인
  condition: {
    type: 'data_exists' | 'setting_exists' | 'permission_check';
    target: string;  // 확인할 대상 (테이블, 설정 키 등)
    query?: string;  // 조건 확인 쿼리
  };

  // 조건 충족 시
  onSuccess: {
    message: string;
    actions: UIAction[];
    suggestions?: string[];
  };

  // 조건 미충족 시
  onFailure: {
    message: string;
    actions: UIAction[];
    actionButton?: {
      text: string;
      action: UIAction | ActionSequence;
    };
    suggestions?: string[];
  };
}
```

### 7.2 조건부 응답 예시

```yaml
목표 달성률 조회:
  condition:
    type: setting_exists
    target: user_goals
    query: "SELECT * FROM user_goals WHERE user_id = $userId AND is_active = true"

  onSuccess:
    message: "현재 목표 달성률은 {achievementRate}%입니다. {trend} 추세를 보이고 있어요."
    actions:
      - type: navigate
        page: /insights
      - type: set_tab
        tab: overview
      - type: scroll_to_section
        sectionId: goal-achievement
        highlight: true
    suggestions:
      - "목표 수정하기"
      - "상세 분석 보기"

  onFailure:
    message: "현재 설정된 목표가 없습니다. 목표 설정을 진행해주세요."
    actions:
      - type: navigate
        page: /insights
      - type: set_tab
        tab: overview
      - type: scroll_to_section
        sectionId: goal-achievement
        highlight: true
    actionButton:
      text: "목표 설정하러 가기"
      action:
        type: open_modal
        modalId: goal-settings
    suggestions:
      - "목표 설정 방법 알려줘"
      - "다른 KPI 보기"

재고 알림 조회:
  condition:
    type: data_exists
    target: inventory_alerts
    query: "SELECT * FROM inventory_alerts WHERE store_id = $storeId AND status = 'active'"

  onSuccess:
    message: "{alertCount}개의 재고 알림이 있습니다."
    actions:
      - type: navigate
        page: /insights
      - type: set_tab
        tab: inventory
      - type: scroll_to_section
        sectionId: stock-alerts

  onFailure:
    message: "현재 재고 알림이 없습니다. 재고가 안정적으로 유지되고 있어요."
    actions:
      - type: navigate
        page: /insights
      - type: set_tab
        tab: inventory
    suggestions:
      - "재고 현황 보기"
      - "발주 제안 확인"
```

---

## 8. 강화된 INTENT_CLASSIFICATION_PROMPT

### 8.1 새로운 시스템 프롬프트 구조

```typescript
export const ENHANCED_SYSTEM_PROMPT = `당신은 NEURALTWIN AI Assistant입니다. "유능한 운영 오퍼레이터" 페르소나를 가지고 있습니다.

## 역할
- 사용자의 자연어 명령을 이해하고, NEURALTWIN 대시보드의 기능을 제어합니다.
- 항상 한국어로 응답합니다.
- 실행한 동작을 간결하게 설명하고, 후속 작업 2~3개를 제안합니다.

## NEURALTWIN 대시보드 완전 구조

### 페이지 및 탭 구조
1. **데이터 컨트롤타워** (/data/control-tower)
   - 데이터 소스 연결 관리
   - 새 연결 추가

2. **인사이트 허브** (/insights)
   - 개요탭: KPI 카드(매출, 순방문객, 전환율, 객단가), 목표 달성률, 트렌드 차트, 일별 요약
   - 매장탭: 매장 성과, 구역별 히트맵, 동선 분석
   - 고객탭: 고객 KPI(순방문객, 신규/재방문, 체류시간), 세그먼트, 행동 분석
   - 상품탭: 상품 성과, 카테고리 분석, 판매 순위
   - 재고탭: 재고 현황, 재고 알림, 발주 제안
   - 예측탭: 수요 예측, 트렌드 예측
   - AI추천탭: 액션 추천, 최적화 제안

3. **디지털트윈 스튜디오** (/studio)
   - 레이어탭: 3D 레이어 관리
   - AI 시뮬레이션탭: 시나리오 시뮬레이션
   - AI 최적화탭: 배치/동선 최적화
   - 적용탭: 변경사항 적용

4. **ROI 측정** (/roi)
   - 전략 성과 분석, ROI 분석

5. **설정 & 관리** (/settings)
   - 매장 관리, 데이터, 사용자, 시스템, 플랜 탭

## 용어 중의성 처리
동일 용어가 복수 위치에 존재할 경우:
- "순 방문객": 고객탭(primary) / 개요탭(secondary)
- "매출": 개요탭(primary) / 상품탭, ROI(secondary)
- "전환율": 개요탭(primary) / 고객탭(secondary)
- "재고": 재고탭(primary) / 상품탭(secondary)

## 컨텍스트 기반 추론
1. 현재 위치(currentPage, currentTab)를 우선 확인
2. 현재 탭에 해당 데이터가 있으면 탭 전환 없이 스크롤
3. 없으면 primary 위치로 이동 + 대안 안내

## 조건부 응답
데이터/설정이 필요한 기능:
- "목표 달성률": 목표 설정 필요 → 없으면 설정 유도
- "재고 알림": 알림 데이터 필요 → 없으면 안정 상태 안내
- "시뮬레이션 결과": 실행된 시뮬레이션 필요 → 없으면 실행 유도

## 응답 스타일
- 친근하고 전문적인 톤
- 간결하되 필요한 정보 충분히 제공
- 기술 용어는 쉽게 풀어서 설명
- 이모지는 최소한으로 사용`;
```

### 8.2 새로운 인텐트 분류 프롬프트

```typescript
export const ENHANCED_INTENT_CLASSIFICATION_PROMPT = `사용자가 다음과 같이 말했습니다: "{userMessage}"

## 현재 컨텍스트
- 현재 페이지: {currentPage}
- 현재 탭: {currentTab}
- 이전 대화 요약: {conversationSummary}

아래 인텐트 중 하나로 분류하고 관련 엔티티를 추출하세요.
반드시 JSON으로만 응답하세요.

## 인텐트 목록

### 네비게이션
- **navigate**: 페이지 이동
- **set_tab**: 탭 전환
- **set_date_range**: 날짜 필터 변경
- **composite_navigate**: 페이지 + 탭 + 날짜 복합
- **scroll_to_section**: 특정 섹션으로 스크롤

### 데이터 조회
- **query_kpi**: KPI 데이터 조회 (매출, 방문객, 전환율 등)
- **query_detail**: 상세 데이터 조회 (특정 항목 드릴다운)

### 기능 실행
- **run_simulation**: 시뮬레이션 실행
- **run_optimization**: 최적화 실행
- **open_modal**: 모달/다이얼로그 열기
- **trigger_action**: 특정 기능 트리거

### 일반
- **general_chat**: 일반 대화, 인사, 도움말

## 날짜 표현 파싱
어떤 형식이든 다음으로 변환:
- "12월 1일부터 10일까지" → startDate: "2026-12-01", endDate: "2026-12-10"
- "12월 첫째주" → startDate: "2026-12-01", endDate: "2026-12-07"
- "지난 주" → preset: "lastWeek"
- "최근 7일" → preset: "7d"

## 용어-위치 매핑
- "순 방문객" → primary: customer탭, secondary: overview탭
- "목표 달성률" → overview탭, goal-achievement 섹션
- "재고 현황" → inventory탭, inventory-status 섹션
- "매출" → primary: overview탭, secondary: product탭

## 응답 형식 (JSON)
{
  "intent": "인텐트명",
  "confidence": 0.0~1.0,
  "entities": {
    "page": "/insights | /studio | /roi | /settings | /data/control-tower",
    "tab": "탭 ID",
    "section": "섹션 ID (스크롤 대상)",
    "component": "컴포넌트 ID (하이라이트 대상)",
    "dateType": "absolute | relative | preset",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "preset": "today | 7d | 30d | 90d | thisWeek | lastWeek | thisMonth | lastMonth",
    "queryType": "revenue | visitors | conversion | inventory | product | goal",
    "modalId": "모달 ID",
    "requiresCondition": "조건 확인 필요 여부",
    "conditionType": "goal_settings | data_exists | permission"
  },
  "contextUsed": {
    "usedCurrentLocation": true/false,
    "usedConversationHistory": true/false,
    "disambiguationApplied": true/false,
    "alternativeLocations": ["다른 가능한 위치들"]
  }
}

## Few-shot 예시

### 예시 1: 단순 탭 전환
사용자: "고객탭 보여줘"
응답:
{
  "intent": "set_tab",
  "confidence": 0.95,
  "entities": {
    "page": "/insights",
    "tab": "customer"
  }
}

### 예시 2: 날짜 포함 복합 요청
사용자: "12월 첫째주 매출 보여줘"
응답:
{
  "intent": "query_kpi",
  "confidence": 0.90,
  "entities": {
    "page": "/insights",
    "tab": "overview",
    "section": "kpi-cards",
    "component": "total-revenue",
    "dateType": "absolute",
    "startDate": "2026-12-01",
    "endDate": "2026-12-07",
    "queryType": "revenue"
  }
}

### 예시 3: 용어 중의성 (현재 위치 활용)
현재 페이지: /insights, 현재 탭: overview
사용자: "순 방문객 보여줘"
응답:
{
  "intent": "scroll_to_section",
  "confidence": 0.90,
  "entities": {
    "section": "kpi-cards",
    "component": "unique-visitors"
  },
  "contextUsed": {
    "usedCurrentLocation": true,
    "alternativeLocations": ["/insights/customer"]
  }
}

### 예시 4: 조건부 응답 필요
사용자: "목표 달성률 어때?"
응답:
{
  "intent": "query_kpi",
  "confidence": 0.90,
  "entities": {
    "page": "/insights",
    "tab": "overview",
    "section": "goal-achievement",
    "queryType": "goal",
    "requiresCondition": true,
    "conditionType": "goal_settings"
  }
}

### 예시 5: 다양한 날짜 표현
사용자: "12월 1일부터 15일까지 방문객 데이터"
응답:
{
  "intent": "query_kpi",
  "confidence": 0.90,
  "entities": {
    "page": "/insights",
    "tab": "customer",
    "dateType": "absolute",
    "startDate": "2026-12-01",
    "endDate": "2026-12-15",
    "queryType": "visitors"
  }
}

### 예시 6: 모달 열기 요청
사용자: "목표 설정하고 싶어"
응답:
{
  "intent": "open_modal",
  "confidence": 0.90,
  "entities": {
    "page": "/insights",
    "tab": "overview",
    "section": "goal-achievement",
    "modalId": "goal-settings"
  }
}
`;
```

---

## 9. 모달/팝업 ID 정의

### 9.1 대시보드 모달 목록

```typescript
const MODAL_MAP = {
  // 인사이트 허브
  "goal-settings": {
    page: "/insights",
    tab: "overview",
    section: "goal-achievement",
    description: "목표 설정 모달"
  },
  "date-picker": {
    page: "*",  // 모든 페이지
    description: "날짜 범위 선택 모달"
  },
  "export-data": {
    page: "/insights",
    description: "데이터 내보내기 모달"
  },

  // 디지털트윈 스튜디오
  "simulation-config": {
    page: "/studio",
    tab: "ai-simulation",
    description: "시뮬레이션 설정 모달"
  },
  "optimization-config": {
    page: "/studio",
    tab: "ai-optimization",
    description: "최적화 설정 모달"
  },

  // 데이터 컨트롤타워
  "new-connection": {
    page: "/data/control-tower",
    description: "새 데이터 연결 추가 모달"
  },

  // 설정
  "invite-user": {
    page: "/settings",
    tab: "users",
    description: "사용자 초대 모달"
  },
  "plan-upgrade": {
    page: "/settings",
    tab: "plan",
    description: "플랜 업그레이드 모달"
  }
};
```

---

## 10. 자연어 표현 Variation 사전

### 10.1 동작 표현

```yaml
보여주기:
  - 보여줘, 보여주세요, 보여, 보여줄래, 보여줄 수 있어
  - 알려줘, 알려주세요, 알려, 알려줄래
  - 확인해줘, 확인하고 싶어, 확인할래
  - 어때, 어떻게 돼, 어떻게 되어 있어
  - 뭐야, 뭔지, 뭔가

이동하기:
  - 가줘, 이동해줘, 열어줘, 가고 싶어
  - ~로 가, ~으로 이동, ~에 가
  - ~좀 열어, ~좀 보여줘

설정하기:
  - 설정해줘, 바꿔줘, 변경해줘
  - ~로 설정, ~으로 바꿔
  - 적용해줘

실행하기:
  - 돌려줘, 실행해줘, 해줘
  - 시작해줘, 진행해줘
  - ~좀 해봐
```

### 10.2 질문 표현

```yaml
상태 질문:
  - 얼마야, 얼마지, 얼마인가
  - 몇이야, 몇이지, 몇인가
  - 어때, 어떻게 돼, 어떤 상태야
  - 있어, 있나, 있는지

비교 질문:
  - 대비 어때, 비교해서 어때
  - 차이가 뭐야, 뭐가 달라
  - 늘었어, 줄었어, 변화가 있어

추천 요청:
  - 추천해줘, 뭐가 좋을까
  - 어떻게 하면 좋을까
  - 제안해줘
```

---

## 11. 섹션 ID 매핑

### 11.1 스크롤 대상 섹션 ID

```typescript
const SECTION_ID_MAP = {
  // 인사이트 허브 > 개요
  "insights-overview-kpi": "kpi-cards",
  "insights-overview-goal": "goal-achievement",
  "insights-overview-trend": "trend-chart",
  "insights-overview-daily": "daily-summary",

  // 인사이트 허브 > 고객
  "insights-customer-kpi": "customer-kpi",
  "insights-customer-segments": "customer-segments",
  "insights-customer-behavior": "behavior-analysis",

  // 인사이트 허브 > 재고
  "insights-inventory-status": "inventory-status",
  "insights-inventory-alerts": "stock-alerts",
  "insights-inventory-reorder": "reorder-suggestions",

  // ... (추가 섹션)
};
```

---

## 12. 구현 우선순위

### Phase 1: 프롬프트 강화 (즉시)
1. `ENHANCED_INTENT_CLASSIFICATION_PROMPT` 적용
2. 대시보드 구조 정보 추가
3. Few-shot 예시 추가

### Phase 2: 액션 확장 (단기)
1. `scroll_to_section` 액션 구현
2. `open_modal` 액션 구현
3. ActionDispatcher 확장

### Phase 3: 조건부 응답 (중기)
1. 조건 확인 로직 구현
2. 조건별 응답 분기
3. 대안 액션 버튼 구현

### Phase 4: 컨텍스트 고도화 (장기)
1. 대화 맥락 저장/활용
2. 사용자 선호도 학습
3. 실패 로그 분석 및 개선

---

## 13. 테스트 케이스

### 13.1 날짜 표현 테스트

| 입력 | 기대 출력 |
|:-----|:---------|
| "12월 1-10일" | startDate: 2026-12-01, endDate: 2026-12-10 |
| "12월 1일부터 10일까지" | startDate: 2026-12-01, endDate: 2026-12-10 |
| "12월 첫째주" | startDate: 2026-12-01, endDate: 2026-12-07 |
| "지난주" | preset: lastWeek |
| "최근 7일" | preset: 7d |
| "이번달 초" | startDate: 2026-02-01, endDate: 2026-02-10 |

### 13.2 용어 중의성 테스트

| 현재 위치 | 입력 | 기대 동작 |
|:---------|:-----|:---------|
| 개요탭 | "순 방문객 보여줘" | 개요탭 유지 + KPI 섹션 스크롤 |
| 매장탭 | "순 방문객 보여줘" | 고객탭 이동 + 안내 |
| ROI | "순 방문객 보여줘" | 고객탭 이동 + 대안 안내 |

### 13.3 조건부 응답 테스트

| 조건 | 입력 | 기대 응답 |
|:-----|:-----|:---------|
| 목표 설정됨 | "목표 달성률 어때?" | 달성률 수치 + 개요탭 스크롤 |
| 목표 미설정 | "목표 달성률 어때?" | 설정 유도 메시지 + 버튼 |
| 재고 알림 있음 | "재고 알림 있어?" | 알림 내용 + 재고탭 이동 |
| 재고 알림 없음 | "재고 알림 있어?" | 안정 상태 안내 |

---

**인텐트 강화 설계 문서 끝**
