# NEURALTWIN 서비스 플로우 가이드

> **버전**: 1.1
> **최종 업데이트**: 2026-01-06
> **변경 이력**:
> - v1.1: AI 함수 역할 분담 아키텍처 추가, advanced-ai-inference deprecated 처리, staffing 최적화 추가
> **문서 목적**: NEURALTWIN Customer Dashboard의 전체 시스템 아키텍처 및 서비스 플로우 정의

---

## 목차

1. [시스템 아키텍처 개요](#1-시스템-아키텍처-개요)
2. [전체 서비스 플로우](#2-전체-서비스-플로우)
3. [페이지별 서비스 플로우](#3-페이지별-서비스-플로우)
4. [Edge Function 플로우](#4-edge-function-플로우)
5. [데이터 플로우](#5-데이터-플로우)
6. [AI 통합 플로우](#6-ai-통합-플로우)
7. [인증 및 권한 플로우](#7-인증-및-권한-플로우)

---

## 1. 시스템 아키텍처 개요

### 1.1 전체 아키텍처 다이어그램

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React + TypeScript]
        THREE[Three.js / R3F]
        ZUSTAND[Zustand State]
        TANSTACK[TanStack Query]
    end

    subgraph "API Gateway"
        SUPABASE[Supabase Client]
        LOVABLE[Lovable API Gateway]
    end

    subgraph "Backend Services"
        subgraph "Edge Functions - Active"
            EF_OPT[generate-optimization<br/>가구/상품/인력 최적화]
            EF_SIM[run-simulation<br/>트래픽/시나리오 시뮬레이션]
            EF_AI[retail-ai-inference]
            EF_UNI[unified-ai]
            EF_ETL[etl-*]
        end

        subgraph "Edge Functions - Deprecated"
            EF_ADV[advanced-ai-inference ⚠️]
        end

        subgraph "Database"
            PG[(PostgreSQL)]
            STORAGE[(Storage)]
        end
    end

    subgraph "External AI"
        GEMINI[Gemini 2.5 Flash]
        CLAUDE[Claude API]
    end

    UI --> SUPABASE
    THREE --> ZUSTAND
    ZUSTAND --> TANSTACK
    TANSTACK --> SUPABASE

    SUPABASE --> EF_OPT
    SUPABASE --> EF_SIM
    SUPABASE --> EF_AI
    SUPABASE --> EF_UNI
    SUPABASE --> EF_ADV
    SUPABASE --> EF_ETL

    EF_OPT --> LOVABLE
    EF_SIM --> LOVABLE
    EF_AI --> LOVABLE
    EF_UNI --> LOVABLE
    EF_ADV --> LOVABLE

    LOVABLE --> GEMINI

    EF_OPT --> PG
    EF_SIM --> PG
    EF_ETL --> PG

    UI --> STORAGE
```

### 1.2 기술 스택

| 계층 | 기술 | 용도 |
|------|------|------|
| **Frontend** | React 18 + TypeScript | UI 프레임워크 |
| **3D 렌더링** | Three.js + React Three Fiber | 디지털 트윈 시각화 |
| **상태 관리** | Zustand | 클라이언트 상태 |
| **서버 상태** | TanStack Query | API 캐싱 및 동기화 |
| **스타일링** | Tailwind CSS + shadcn/ui | UI 컴포넌트 |
| **백엔드** | Supabase Edge Functions (Deno) | 서버리스 API |
| **데이터베이스** | PostgreSQL + PostGIS | 관계형 + 공간 데이터 |
| **AI Gateway** | Lovable API Gateway | AI API 중계 |
| **AI 모델** | Gemini 2.5 Flash | 시뮬레이션 및 최적화 |

---

## 2. 전체 서비스 플로우

### 2.1 애플리케이션 라우팅 구조

```mermaid
graph LR
    subgraph "Public Routes"
        AUTH["/auth"]
    end

    subgraph "Protected Routes"
        ROOT["/"] --> INSIGHT["/insight-hub"]
        ROOT --> STUDIO["/studio"]
        ROOT --> ROI["/roi-measurement"]
        ROOT --> SETTINGS["/settings"]
    end

    subgraph "Error Routes"
        E404["/*" → 404]
    end

    AUTH -->|Login Success| ROOT
    INSIGHT -->|Navigate| STUDIO
    STUDIO -->|Navigate| ROI
    ROI -->|Navigate| SETTINGS
```

### 2.2 페이지 개요

| 경로 | 페이지 | 주요 기능 |
|------|--------|-----------|
| `/auth` | AuthPage | 로그인/회원가입 |
| `/insight-hub` | InsightHubPage | 매장 인사이트 대시보드 |
| `/studio` | DigitalTwinStudioPage | 3D 매장 시뮬레이션 |
| `/roi-measurement` | ROIMeasurementPage | ROI 분석 및 측정 |
| `/settings` | SettingsPage | 설정 관리 |

---

## 3. 페이지별 서비스 플로우

### 3.1 Insight Hub 서비스 플로우

```mermaid
flowchart TB
    subgraph "Insight Hub Page"
        IH_ENTRY[페이지 진입]

        subgraph "탭 구조"
            TAB_OV[Overview]
            TAB_SALES[Sales Analysis]
            TAB_FLOW[Traffic Flow]
            TAB_ZONE[Zone Performance]
            TAB_PROD[Product Analysis]
            TAB_TREND[Trends]
        end

        subgraph "데이터 로드"
            LOAD_KPI[KPI 데이터]
            LOAD_SALES[매출 데이터]
            LOAD_VISITOR[방문자 데이터]
            LOAD_ZONE[존 데이터]
            LOAD_PRODUCT[상품 데이터]
        end

        subgraph "시각화"
            VIZ_CHART[차트 렌더링]
            VIZ_MAP[히트맵/플로우맵]
            VIZ_TABLE[데이터 테이블]
        end
    end

    IH_ENTRY --> TAB_OV
    TAB_OV --> LOAD_KPI
    TAB_SALES --> LOAD_SALES
    TAB_FLOW --> LOAD_VISITOR
    TAB_ZONE --> LOAD_ZONE
    TAB_PROD --> LOAD_PRODUCT

    LOAD_KPI --> VIZ_CHART
    LOAD_SALES --> VIZ_CHART
    LOAD_VISITOR --> VIZ_MAP
    LOAD_ZONE --> VIZ_MAP
    LOAD_PRODUCT --> VIZ_TABLE
```

**데이터 소스:**
- `daily_kpis` - 일별 KPI 집계
- `hourly_visitors` - 시간대별 방문자
- `zone_transitions` - 존 간 이동
- `product_performance` - 상품 실적
- `sales_transactions` - 판매 트랜잭션

### 3.2 Digital Twin Studio 서비스 플로우

```mermaid
flowchart TB
    subgraph "Digital Twin Studio"
        STUDIO_ENTRY[페이지 진입]

        subgraph "레이아웃 로드"
            LOAD_STORE[매장 정보 로드]
            LOAD_LAYOUT[레이아웃 데이터]
            LOAD_FURNITURE[가구 데이터]
            LOAD_PRODUCTS[상품 데이터]
            LOAD_ZONES[존 데이터]
        end

        subgraph "3D 렌더링"
            INIT_SCENE[Scene 초기화]
            RENDER_FLOOR[바닥/벽 렌더링]
            RENDER_FURNITURE[가구 3D 렌더링]
            RENDER_PRODUCTS[상품 렌더링]
            RENDER_ZONES[존 시각화]
        end

        subgraph "사용자 인터랙션"
            CAMERA_CTRL[카메라 제어]
            SELECT_OBJ[객체 선택]
            MOVE_OBJ[객체 이동]
            ROTATE_OBJ[객체 회전]
        end

        subgraph "AI 기능"
            AI_SIM[시뮬레이션 실행]
            AI_OPT[최적화 실행]
            AI_DIAG[문제점 진단]
        end
    end

    STUDIO_ENTRY --> LOAD_STORE
    LOAD_STORE --> LOAD_LAYOUT
    LOAD_LAYOUT --> LOAD_FURNITURE
    LOAD_LAYOUT --> LOAD_PRODUCTS
    LOAD_LAYOUT --> LOAD_ZONES

    LOAD_FURNITURE --> INIT_SCENE
    INIT_SCENE --> RENDER_FLOOR
    RENDER_FLOOR --> RENDER_FURNITURE
    RENDER_FURNITURE --> RENDER_PRODUCTS
    RENDER_PRODUCTS --> RENDER_ZONES

    RENDER_ZONES --> CAMERA_CTRL
    CAMERA_CTRL --> SELECT_OBJ
    SELECT_OBJ --> MOVE_OBJ
    SELECT_OBJ --> ROTATE_OBJ

    SELECT_OBJ --> AI_SIM
    AI_SIM --> AI_DIAG
    AI_DIAG --> AI_OPT
```

**Edge Function 호출:**
- `run-simulation` - AI 시뮬레이션
- `generate-optimization` - 최적화 제안
- `advanced-ai-inference` - 고급 AI 분석

### 3.3 ROI Measurement 서비스 플로우

```mermaid
flowchart TB
    subgraph "ROI Measurement"
        ROI_ENTRY[페이지 진입]

        subgraph "데이터 수집"
            COLLECT_BEFORE[변경 전 데이터]
            COLLECT_AFTER[변경 후 데이터]
            COLLECT_COST[투자 비용]
        end

        subgraph "ROI 계산"
            CALC_REVENUE[매출 변화]
            CALC_TRAFFIC[트래픽 변화]
            CALC_CONV[전환율 변화]
            CALC_ROI[ROI 산출]
        end

        subgraph "시각화"
            VIZ_COMPARE[Before/After 비교]
            VIZ_TREND[ROI 추이]
            VIZ_BREAKDOWN[항목별 분석]
        end
    end

    ROI_ENTRY --> COLLECT_BEFORE
    COLLECT_BEFORE --> COLLECT_AFTER
    COLLECT_AFTER --> COLLECT_COST

    COLLECT_COST --> CALC_REVENUE
    CALC_REVENUE --> CALC_TRAFFIC
    CALC_TRAFFIC --> CALC_CONV
    CALC_CONV --> CALC_ROI

    CALC_ROI --> VIZ_COMPARE
    VIZ_COMPARE --> VIZ_TREND
    VIZ_TREND --> VIZ_BREAKDOWN
```

### 3.4 Settings 서비스 플로우

```mermaid
flowchart TB
    subgraph "Settings Page"
        SET_ENTRY[페이지 진입]

        subgraph "탭 구조"
            TAB_STORE[Store Settings]
            TAB_ONTO[Ontology]
            TAB_DATA[Data Management]
            TAB_INTEG[Integrations]
            TAB_USER[User Settings]
        end

        subgraph "Store Settings"
            STORE_INFO[매장 기본 정보]
            STORE_HOURS[영업 시간]
            STORE_LAYOUT[레이아웃 설정]
        end

        subgraph "Ontology"
            ONTO_CAT[카테고리 관리]
            ONTO_ATTR[속성 정의]
            ONTO_REL[관계 설정]
        end

        subgraph "Data Management"
            DATA_IMPORT[데이터 임포트]
            DATA_EXPORT[데이터 익스포트]
            DATA_SYNC[동기화 설정]
        end
    end

    SET_ENTRY --> TAB_STORE
    TAB_STORE --> STORE_INFO
    TAB_ONTO --> ONTO_CAT
    TAB_DATA --> DATA_IMPORT
    TAB_INTEG --> EXT_API[외부 API 연동]
    TAB_USER --> USER_PREF[사용자 설정]
```

---

## 4. Edge Function 플로우

### 4.1 Edge Function 목록

| 함수명 | 유형 | 설명 | 상태 |
|--------|------|------|------|
| `generate-optimization` | AI | 가구/상품/인력 배치 최적화 | ✅ Active |
| `run-simulation` | AI | 트래픽/매출/시나리오 시뮬레이션 | ✅ Active |
| `retail-ai-inference` | AI | 소매 AI 추론 | ✅ Active |
| `advanced-ai-inference` | AI | 고급 AI 분석 | ⚠️ Deprecated |
| `unified-ai` | AI | 통합 AI 인터페이스 | ✅ Active |

#### AI 함수 역할 분담 (2024-01 아키텍처)

```
┌─────────────────────────────────────────────────────────────┐
│                     현재 아키텍처                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [시뮬레이션 담당]              [최적화 담당]                  │
│                                                              │
│   run-simulation              generate-optimization          │
│   ├─ 트래픽/매출 예측          ├─ 가구 배치 최적화 (furniture)│
│   ├─ 혼잡도 분석               ├─ 상품 배치 최적화 (product)  │
│   ├─ diagnostic_issues        ├─ 인력 배치 최적화 (staffing) │
│   └─ 시나리오 시뮬레이션       ├─ 통합 최적화 (both)          │
│                                ├─ 동선/VMD/연관성 분석         │
│                                └─ 매출/전환율 예측             │
│                                                              │
│  [Deprecated - 마이그레이션 중]                              │
│   advanced-ai-inference                                      │
│   ├─ layout_optimization → generate-optimization (both)     │
│   ├─ staffing_optimization → generate-optimization (staffing)│
│   ├─ flow_simulation → 유지 (분석용)                         │
│   └─ congestion_simulation → 유지 (분석용)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| 함수명 | 유형 | 설명 |
|--------|------|------|
| `etl-hourly-visitors` | ETL | 시간별 방문자 집계 |
| `etl-daily-kpis` | ETL | 일별 KPI 집계 |
| `etl-zone-transitions` | ETL | 존 이동 집계 |
| `analyze-associations` | Analytics | 연관 분석 |
| `analyze-flow` | Analytics | 동선 분석 |
| `send-notification` | Utility | 알림 발송 |

### 4.2 AI 시뮬레이션 플로우 (run-simulation)

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant EF as run-simulation
    participant DB as PostgreSQL
    participant AI as Lovable Gateway
    participant LOG as ai_response_logs

    Client->>EF: POST /run-simulation
    Note over Client,EF: {store_id, options, environment_context}

    EF->>DB: 매장 데이터 조회
    DB-->>EF: store_context

    EF->>DB: 레이아웃 데이터 조회
    DB-->>EF: layout_data

    EF->>DB: 존/가구/상품 데이터
    DB-->>EF: entities

    EF->>EF: 프롬프트 구성

    EF->>AI: AI 요청 (Gemini 2.5 Flash)
    AI-->>EF: simulation_result

    EF->>LOG: 응답 로깅
    Note over EF,LOG: 파인튜닝용 데이터 수집

    EF-->>Client: simulation_result
```

### 4.3 최적화 제안 플로우 (generate-optimization)

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant EF as generate-optimization
    participant DB as PostgreSQL
    participant FLOW as analyze-flow
    participant ASSOC as analyze-associations
    participant AI as Lovable Gateway
    participant LOG as ai_response_logs

    Client->>EF: POST /generate-optimization
    Note over Client,EF: {store_id, optimization_type}

    EF->>DB: 매장 컨텍스트 조회
    DB-->>EF: store_context

    par 병렬 분석
        EF->>FLOW: 동선 분석 요청
        FLOW-->>EF: flow_analysis
    and
        EF->>ASSOC: 연관 분석 요청
        ASSOC-->>EF: association_rules
    end

    EF->>EF: 분석 결과 통합

    EF->>AI: AI 최적화 요청
    AI-->>EF: optimization_suggestions

    EF->>LOG: 응답 로깅

    EF-->>Client: optimization_result
```

### 4.4 ETL 파이프라인 플로우

```mermaid
flowchart TB
    subgraph "ETL 스케줄링"
        CRON[Supabase Cron]
    end

    subgraph "데이터 소스"
        RAW_VISITOR[visitor_logs]
        RAW_SALES[sales_transactions]
        RAW_ZONE[zone_events]
    end

    subgraph "ETL Functions"
        ETL_HOURLY[etl-hourly-visitors]
        ETL_DAILY[etl-daily-kpis]
        ETL_ZONE[etl-zone-transitions]
        ETL_PRODUCT[etl-product-performance]
    end

    subgraph "집계 테이블"
        AGG_HOURLY[hourly_visitors]
        AGG_DAILY[daily_kpis]
        AGG_ZONE[zone_transitions]
        AGG_PRODUCT[product_performance]
    end

    CRON -->|매시간| ETL_HOURLY
    CRON -->|매일| ETL_DAILY
    CRON -->|매시간| ETL_ZONE
    CRON -->|매일| ETL_PRODUCT

    RAW_VISITOR --> ETL_HOURLY
    RAW_VISITOR --> ETL_DAILY
    RAW_SALES --> ETL_DAILY
    RAW_ZONE --> ETL_ZONE
    RAW_SALES --> ETL_PRODUCT

    ETL_HOURLY --> AGG_HOURLY
    ETL_DAILY --> AGG_DAILY
    ETL_ZONE --> AGG_ZONE
    ETL_PRODUCT --> AGG_PRODUCT
```

---

## 5. 데이터 플로우

### 5.1 데이터베이스 스키마 개요

```mermaid
erDiagram
    stores ||--o{ layouts : has
    stores ||--o{ daily_kpis : has
    stores ||--o{ hourly_visitors : has

    layouts ||--o{ furniture : contains
    layouts ||--o{ products : contains
    layouts ||--o{ zones : contains

    zones ||--o{ zone_transitions : from
    zones ||--o{ zone_transitions : to

    products ||--o{ product_performance : has
    products ||--o{ sales_transactions : in

    stores ||--o{ ai_response_logs : generates

    stores {
        uuid id PK
        string name
        string address
        jsonb settings
    }

    layouts {
        uuid id PK
        uuid store_id FK
        jsonb floor_data
        jsonb metadata
    }

    furniture {
        uuid id PK
        uuid layout_id FK
        string type
        jsonb position
        jsonb dimensions
    }

    zones {
        uuid id PK
        uuid layout_id FK
        string name
        string zone_type
        jsonb polygon
    }

    ai_response_logs {
        uuid id PK
        uuid store_id FK
        string function_name
        string simulation_type
        jsonb input_variables
        jsonb ai_response
        jsonb context_metadata
    }
```

### 5.2 실시간 데이터 플로우

```mermaid
flowchart LR
    subgraph "데이터 수집"
        POS[POS 시스템]
        SENSOR[센서 데이터]
        CAMERA[카메라 분석]
    end

    subgraph "Supabase Realtime"
        RT_CHANNEL[Realtime Channel]
        RT_BROADCAST[Broadcast]
    end

    subgraph "Frontend State"
        STORE[Zustand Store]
        QUERY[TanStack Query Cache]
    end

    subgraph "UI 업데이트"
        DASHBOARD[대시보드]
        STUDIO[3D Studio]
        ALERT[알림]
    end

    POS -->|WebSocket| RT_CHANNEL
    SENSOR -->|WebSocket| RT_CHANNEL
    CAMERA -->|REST API| RT_BROADCAST

    RT_CHANNEL --> STORE
    RT_BROADCAST --> QUERY

    STORE --> DASHBOARD
    STORE --> STUDIO
    QUERY --> DASHBOARD
    QUERY --> ALERT
```

---

## 6. AI 통합 플로우

### 6.1 AI Gateway 아키텍처

```mermaid
flowchart TB
    subgraph "Edge Functions - Active"
        EF1[run-simulation<br/>시뮬레이션 전담]
        EF2[generate-optimization<br/>최적화 전담]
        EF3[retail-ai-inference]
    end

    subgraph "Edge Functions - Deprecated"
        EF4[advanced-ai-inference<br/>⚠️ 점진적 제거 예정]
    end

    subgraph "Lovable API Gateway"
        GATEWAY[API Gateway]
        RATE_LIMIT[Rate Limiting]
        AUTH[API Key Auth]
    end

    subgraph "AI Models"
        GEMINI[Gemini 2.5 Flash]
    end

    subgraph "Response Processing"
        PARSE[JSON 파싱]
        VALIDATE[스키마 검증]
        LOG[응답 로깅]
    end

    EF1 --> GATEWAY
    EF2 --> GATEWAY
    EF3 --> GATEWAY
    EF4 --> GATEWAY

    GATEWAY --> AUTH
    AUTH --> RATE_LIMIT
    RATE_LIMIT --> GEMINI

    GEMINI --> PARSE
    PARSE --> VALIDATE
    VALIDATE --> LOG
    LOG --> EF1
    LOG --> EF2
    LOG --> EF3
    LOG --> EF4
```

### 6.2 프리셋 시나리오 플로우

```mermaid
flowchart TB
    subgraph "시나리오 선택"
        PRESET[프리셋 시나리오]
        CUSTOM[커스텀 시나리오]
    end

    subgraph "프리셋 시나리오 유형"
        S1[christmas - 크리스마스]
        S2[blackFriday - 블랙프라이데이]
        S3[backToSchool - 신학기]
        S4[summerSale - 여름 세일]
        S5[newYearSale - 새해 세일]
        S6[weekendRush - 주말 피크]
        S7[holidayEvent - 공휴일]
    end

    subgraph "컨텍스트 생성"
        ENV_CTX[environment_context]
        WEATHER[날씨 정보]
        EVENT[이벤트 정보]
        SEASON[계절 정보]
    end

    subgraph "AI 처리"
        PROMPT[프롬프트 구성]
        AI_CALL[AI 호출]
        RESULT[시뮬레이션 결과]
    end

    PRESET --> S1
    PRESET --> S2
    PRESET --> S3
    PRESET --> S4
    PRESET --> S5
    PRESET --> S6
    PRESET --> S7

    S1 --> ENV_CTX
    S2 --> ENV_CTX
    S3 --> ENV_CTX
    S4 --> ENV_CTX
    S5 --> ENV_CTX
    S6 --> ENV_CTX
    S7 --> ENV_CTX

    ENV_CTX --> WEATHER
    ENV_CTX --> EVENT
    ENV_CTX --> SEASON

    WEATHER --> PROMPT
    EVENT --> PROMPT
    SEASON --> PROMPT

    PROMPT --> AI_CALL
    AI_CALL --> RESULT
```

### 6.3 AI 시뮬레이션 → AI 최적화 연결 플로우

```mermaid
sequenceDiagram
    participant User as 사용자
    participant SimTab as AISimulationTab
    participant OptTab as AIOptimizationTab
    participant SIM_EF as run-simulation
    participant OPT_EF as generate-optimization
    participant AI as Lovable Gateway
    participant DB as ai_response_logs

    User->>SimTab: 시뮬레이션 실행
    SimTab->>SIM_EF: POST /run-simulation
    Note over SimTab,SIM_EF: environment_context, preset_scenario

    SIM_EF->>AI: AI 시뮬레이션 요청
    AI-->>SIM_EF: simulation_result + diagnostic_issues

    SIM_EF->>DB: 응답 로깅
    SIM_EF-->>SimTab: 결과 + 문제점 목록

    SimTab->>User: "AI 최적화로 실행하시겠습니까?"

    User->>SimTab: 문제점 선택 → 최적화 탭으로 이동 클릭
    SimTab->>OptTab: navigate with diagnostic_issues
    Note over SimTab,OptTab: scenario_context, environment_context,<br/>simulation_kpis, priority_issues

    OptTab->>User: "문제점 시나리오" 표시
    User->>OptTab: 옵션 설정 후 최적화 실행

    OptTab->>OPT_EF: POST /generate-optimization
    Note over OptTab,OPT_EF: diagnostic_issues를 최우선 해결 대상으로 전달

    OPT_EF->>OPT_EF: buildDiagnosticIssuesSection()
    Note over OPT_EF: 진단 이슈를 프롬프트 최상단에 배치

    OPT_EF->>AI: AI 최적화 요청 (이슈 우선 해결)
    AI-->>OPT_EF: optimization_result

    OPT_EF->>DB: 응답 로깅
    OPT_EF-->>OptTab: 최적화 결과
    OptTab->>User: 최적화 제안 표시
```

### 6.4 진단 이슈 컨텍스트 구조

```typescript
interface DiagnosticIssuesContext {
  priority_issues: {
    id: string;
    type: string;              // 'congestion' | 'bottleneck' | 'deadzone'
    severity: 'critical' | 'warning' | 'info';
    title: string;
    zone_id: string;
    zone_name: string;
    description: string;
    impact: {
      revenueImpact: number;   // 예상 매출 손실
      trafficImpact: number;
      conversionImpact: number;
    };
    recommendations: string[];
  }[];
  scenario_context: {          // 시뮬레이션 프리셋 시나리오
    id: string;
    name: string;
    description: string;
    risk_tags: string[];
  } | null;
  environment_context: {       // 환경 설정
    weather: string;
    holiday_type: string;
    time_of_day: string;
    traffic_multiplier: number;
  } | null;
  simulation_kpis: {           // 시뮬레이션 KPI
    visitors: number;
    revenue: number;
    conversion: number;
    avg_dwell: number;
  } | null;
}
```

### 6.5 AI 응답 로깅 플로우

```mermaid
sequenceDiagram
    participant EF as Edge Function
    participant AI as AI Gateway
    participant LOG as aiResponseLogger
    participant DB as ai_response_logs

    EF->>EF: createExecutionTimer().start()

    EF->>AI: AI 요청
    AI-->>EF: AI 응답

    EF->>EF: getElapsedMs()

    EF->>LOG: logAIResponse()
    Note over EF,LOG: input_variables, ai_response,<br/>context_metadata, execution_time_ms

    LOG->>LOG: sanitizeForJsonb()
    LOG->>LOG: createOptimizationSummary()

    LOG->>DB: INSERT INTO ai_response_logs
    DB-->>LOG: log_id

    LOG-->>EF: {success: true, logId}
```

---

## 7. 인증 및 권한 플로우

### 7.1 인증 플로우

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Auth as AuthPage
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    participant App as Protected Routes

    User->>Auth: 로그인 페이지 접속
    Auth->>User: 로그인 폼 표시

    User->>Auth: 이메일/비밀번호 입력
    Auth->>Supabase: signInWithPassword()

    alt 로그인 성공
        Supabase-->>Auth: session, user
        Auth->>DB: 사용자 프로필 조회
        DB-->>Auth: user_profile
        Auth->>App: 대시보드로 리다이렉트
    else 로그인 실패
        Supabase-->>Auth: error
        Auth->>User: 에러 메시지 표시
    end
```

### 7.2 권한 체크 플로우

```mermaid
flowchart TB
    subgraph "Route Guard"
        CHECK[라우트 접근]
        AUTH_CHECK{인증 확인}
        ROLE_CHECK{권한 확인}
    end

    subgraph "결과"
        ALLOW[접근 허용]
        REDIRECT[로그인 리다이렉트]
        FORBIDDEN[접근 거부]
    end

    CHECK --> AUTH_CHECK
    AUTH_CHECK -->|인증됨| ROLE_CHECK
    AUTH_CHECK -->|미인증| REDIRECT
    ROLE_CHECK -->|권한 있음| ALLOW
    ROLE_CHECK -->|권한 없음| FORBIDDEN
```

### 7.3 RLS (Row Level Security) 플로우

```mermaid
flowchart TB
    subgraph "요청"
        CLIENT[클라이언트 요청]
        JWT[JWT Token]
    end

    subgraph "Supabase"
        AUTH[auth.uid() 추출]
        RLS[RLS Policy 적용]
        QUERY[쿼리 실행]
    end

    subgraph "데이터 필터링"
        STORE_ACCESS[매장 접근 권한]
        DATA_FILTER[데이터 필터링]
    end

    CLIENT --> JWT
    JWT --> AUTH
    AUTH --> RLS
    RLS --> STORE_ACCESS
    STORE_ACCESS --> DATA_FILTER
    DATA_FILTER --> QUERY
```

---

## 부록

### A. 환경 변수

| 변수명 | 용도 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 공개 API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 역할 키 (서버용) |
| `LOVABLE_API_KEY` | AI Gateway API 키 |

### B. 관련 문서

- [NEURALTWIN_USER_FLOW.md](./NEURALTWIN_USER_FLOW.md) - 사용자 플로우 가이드
- [DIGITAL_TWIN_STUDIO_QA_GUIDE.md](./DIGITAL_TWIN_STUDIO_QA_GUIDE.md) - QA 가이드
- [AI_FINETUNING_DATASET_QA_GUIDE.md](./AI_FINETUNING_DATASET_QA_GUIDE.md) - AI 데이터셋 QA 가이드

---

## 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-01-06 | 초기 문서 작성 |
| 1.1 | 2026-01-06 | AI 시뮬레이션 → AI 최적화 연결 플로우 추가 (섹션 6.3, 6.4) |
