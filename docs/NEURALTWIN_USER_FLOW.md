# NEURALTWIN 사용자 플로우 가이드

> **버전**: 1.1
> **최종 업데이트**: 2026-01-06
> **변경 이력**:
> - v1.1: 인력 배치 최적화 (staffing) 유형 추가
> **문서 목적**: NEURALTWIN Customer Dashboard의 사용자 경험 및 기능별 유저 플로우 정의

---

## 목차

1. [사용자 유형 및 역할](#1-사용자-유형-및-역할)
2. [온보딩 플로우](#2-온보딩-플로우)
3. [주요 사용자 여정](#3-주요-사용자-여정)
4. [페이지별 사용자 플로우](#4-페이지별-사용자-플로우)
5. [기능별 상세 플로우](#5-기능별-상세-플로우)
6. [에러 및 예외 처리 플로우](#6-에러-및-예외-처리-플로우)

---

## 1. 사용자 유형 및 역할

### 1.1 사용자 역할 정의

```mermaid
mindmap
  root((NEURALTWIN<br/>사용자))
    매장 관리자
      매장 설정 관리
      레이아웃 편집
      AI 최적화 실행
      ROI 분석
    데이터 분석가
      인사이트 분석
      트렌드 확인
      리포트 생성
    운영 담당자
      시뮬레이션 실행
      문제점 진단
      최적화 적용
    시스템 관리자
      사용자 관리
      데이터 연동
      온톨로지 설정
```

### 1.2 역할별 주요 기능 접근

| 기능 | 매장 관리자 | 데이터 분석가 | 운영 담당자 | 시스템 관리자 |
|------|-------------|---------------|-------------|---------------|
| Insight Hub | ✅ | ✅ | ✅ | ✅ |
| Digital Twin Studio | ✅ | 👁️ (읽기) | ✅ | ✅ |
| ROI Measurement | ✅ | ✅ | 👁️ (읽기) | ✅ |
| Store Settings | ✅ | ❌ | ❌ | ✅ |
| Ontology Settings | ❌ | ❌ | ❌ | ✅ |
| Data Management | ✅ | 👁️ (읽기) | ❌ | ✅ |

---

## 2. 온보딩 플로우

### 2.1 신규 사용자 온보딩

```mermaid
flowchart TB
    START[회원가입 완료] --> WELCOME[환영 화면]
    WELCOME --> STORE_SETUP{매장 설정 필요?}

    STORE_SETUP -->|예| CREATE_STORE[매장 생성]
    STORE_SETUP -->|아니오 - 초대받음| JOIN_STORE[매장 참여]

    CREATE_STORE --> BASIC_INFO[기본 정보 입력]
    BASIC_INFO --> LAYOUT_UPLOAD{레이아웃 업로드?}

    LAYOUT_UPLOAD -->|예| UPLOAD[도면 업로드]
    LAYOUT_UPLOAD -->|나중에| SKIP_LAYOUT[건너뛰기]

    UPLOAD --> SETUP_ZONES[존 설정]
    SETUP_ZONES --> SETUP_FURNITURE[가구 배치]
    SETUP_FURNITURE --> SETUP_PRODUCTS[상품 등록]

    SKIP_LAYOUT --> TUTORIAL[튜토리얼]
    SETUP_PRODUCTS --> TUTORIAL

    JOIN_STORE --> TUTORIAL

    TUTORIAL --> COMPLETE[온보딩 완료]
    COMPLETE --> DASHBOARD[대시보드 진입]
```

### 2.2 온보딩 단계별 상세

```mermaid
flowchart LR
    subgraph "Step 1: 계정"
        S1A[이메일 입력]
        S1B[비밀번호 설정]
        S1C[프로필 설정]
    end

    subgraph "Step 2: 매장"
        S2A[매장명 입력]
        S2B[주소 입력]
        S2C[영업시간 설정]
    end

    subgraph "Step 3: 레이아웃"
        S3A[도면 업로드]
        S3B[존 정의]
        S3C[가구 배치]
    end

    subgraph "Step 4: 데이터"
        S4A[POS 연동]
        S4B[센서 연동]
        S4C[초기 데이터]
    end

    S1A --> S1B --> S1C --> S2A
    S2A --> S2B --> S2C --> S3A
    S3A --> S3B --> S3C --> S4A
    S4A --> S4B --> S4C
```

---

## 3. 주요 사용자 여정

### 3.1 매장 최적화 여정

```mermaid
journey
    title 매장 레이아웃 최적화 여정
    section 현황 파악
      Insight Hub 접속: 5: 매장관리자
      매출/트래픽 분석: 4: 매장관리자
      문제 존 식별: 4: 매장관리자
    section 시뮬레이션
      Digital Twin 접속: 5: 매장관리자
      시뮬레이션 실행: 4: 매장관리자
      문제점 진단 확인: 4: 매장관리자
    section 최적화
      AI 최적화 요청: 5: 매장관리자
      제안 검토: 4: 매장관리자
      변경사항 적용: 3: 매장관리자
    section 검증
      변경 후 시뮬레이션: 4: 매장관리자
      ROI 측정 설정: 4: 매장관리자
      결과 모니터링: 5: 매장관리자
```

### 3.2 일일 운영 모니터링 여정

```mermaid
journey
    title 일일 운영 모니터링 여정
    section 아침 체크
      대시보드 확인: 5: 운영담당자
      어제 KPI 리뷰: 4: 운영담당자
      알림 확인: 4: 운영담당자
    section 실시간 모니터링
      현재 방문객 확인: 5: 운영담당자
      혼잡 존 파악: 4: 운영담당자
      실시간 매출 확인: 4: 운영담당자
    section 대응
      문제 발생 시 조치: 3: 운영담당자
      인력 배치 조정: 3: 운영담당자
    section 마감
      일일 리포트 확인: 4: 운영담당자
      내일 예측 확인: 4: 운영담당자
```

### 3.3 데이터 분석 여정

```mermaid
journey
    title 주간 데이터 분석 여정
    section 데이터 수집
      Insight Hub 접속: 5: 데이터분석가
      기간 설정: 5: 데이터분석가
      데이터 필터링: 4: 데이터분석가
    section 분석
      매출 트렌드 분석: 4: 데이터분석가
      고객 동선 분석: 4: 데이터분석가
      상품 실적 분석: 4: 데이터분석가
    section 인사이트 도출
      상관관계 파악: 3: 데이터분석가
      패턴 식별: 3: 데이터분석가
      개선점 도출: 4: 데이터분석가
    section 보고
      리포트 생성: 4: 데이터분석가
      경영진 공유: 5: 데이터분석가
```

---

## 4. 페이지별 사용자 플로우

### 4.1 Insight Hub 사용자 플로우

```mermaid
flowchart TB
    subgraph "진입"
        ENTRY[Insight Hub 접속]
        DATE_SELECT[기간 선택]
    end

    subgraph "Overview 탭"
        OV_KPI[주요 KPI 확인]
        OV_TREND[트렌드 그래프]
        OV_ALERT[알림/이슈 확인]
    end

    subgraph "Sales Analysis 탭"
        SA_TOTAL[총 매출 확인]
        SA_HOURLY[시간대별 매출]
        SA_CATEGORY[카테고리별 매출]
        SA_COMPARE[기간 비교]
    end

    subgraph "Traffic Flow 탭"
        TF_HEATMAP[히트맵 확인]
        TF_PATH[고객 동선 분석]
        TF_BOTTLENECK[병목 구간 확인]
    end

    subgraph "Zone Performance 탭"
        ZP_RANKING[존 성과 순위]
        ZP_DWELL[체류 시간 분석]
        ZP_CONVERSION[존별 전환율]
    end

    subgraph "Product Analysis 탭"
        PA_BESTSELLER[베스트셀러]
        PA_UNDERPERFORM[저조 상품]
        PA_ASSOCIATION[연관 상품]
    end

    subgraph "Trends 탭"
        TR_WEEKLY[주간 트렌드]
        TR_MONTHLY[월간 트렌드]
        TR_FORECAST[예측 데이터]
    end

    ENTRY --> DATE_SELECT
    DATE_SELECT --> OV_KPI

    OV_KPI --> OV_TREND
    OV_TREND --> OV_ALERT

    OV_ALERT -->|매출 분석| SA_TOTAL
    SA_TOTAL --> SA_HOURLY
    SA_HOURLY --> SA_CATEGORY
    SA_CATEGORY --> SA_COMPARE

    OV_ALERT -->|트래픽 분석| TF_HEATMAP
    TF_HEATMAP --> TF_PATH
    TF_PATH --> TF_BOTTLENECK

    OV_ALERT -->|존 분석| ZP_RANKING
    ZP_RANKING --> ZP_DWELL
    ZP_DWELL --> ZP_CONVERSION

    OV_ALERT -->|상품 분석| PA_BESTSELLER
    PA_BESTSELLER --> PA_UNDERPERFORM
    PA_UNDERPERFORM --> PA_ASSOCIATION

    OV_ALERT -->|트렌드| TR_WEEKLY
    TR_WEEKLY --> TR_MONTHLY
    TR_MONTHLY --> TR_FORECAST
```

### 4.2 Digital Twin Studio 사용자 플로우

```mermaid
flowchart TB
    subgraph "초기화"
        ENTRY[Studio 접속]
        LOAD_3D[3D 모델 로딩]
        CAMERA_INIT[카메라 초기 위치]
    end

    subgraph "뷰 컨트롤"
        ORBIT[회전/팬/줌]
        VIEW_MODE[뷰 모드 변경]
        FLOOR_SELECT[층 선택]
    end

    subgraph "객체 선택"
        SELECT_ZONE[존 선택]
        SELECT_FURNITURE[가구 선택]
        SELECT_PRODUCT[상품 선택]
        VIEW_DETAIL[상세 정보 패널]
    end

    subgraph "편집 모드"
        EDIT_TOGGLE[편집 모드 전환]
        DRAG_MOVE[드래그 이동]
        ROTATE[회전]
        SAVE_LAYOUT[레이아웃 저장]
    end

    subgraph "시뮬레이션"
        SIM_PANEL[시뮬레이션 패널]
        SIM_OPTIONS[옵션 설정]
        SIM_SCENARIO[시나리오 선택]
        SIM_RUN[시뮬레이션 실행]
        SIM_RESULT[결과 확인]
        SIM_DIAG[문제점 진단]
    end

    subgraph "최적화"
        OPT_PANEL[최적화 패널]
        OPT_TYPE[최적화 유형 선택]
        OPT_RUN[AI 최적화 실행]
        OPT_REVIEW[제안 검토]
        OPT_APPLY[변경사항 적용]
        OPT_COMPARE[Before/After 비교]
    end

    ENTRY --> LOAD_3D --> CAMERA_INIT

    CAMERA_INIT --> ORBIT
    ORBIT --> VIEW_MODE
    VIEW_MODE --> FLOOR_SELECT

    FLOOR_SELECT --> SELECT_ZONE
    SELECT_ZONE --> VIEW_DETAIL
    SELECT_FURNITURE --> VIEW_DETAIL
    SELECT_PRODUCT --> VIEW_DETAIL

    VIEW_DETAIL --> EDIT_TOGGLE
    EDIT_TOGGLE --> DRAG_MOVE
    DRAG_MOVE --> ROTATE
    ROTATE --> SAVE_LAYOUT

    VIEW_DETAIL --> SIM_PANEL
    SIM_PANEL --> SIM_OPTIONS
    SIM_OPTIONS --> SIM_SCENARIO
    SIM_SCENARIO --> SIM_RUN
    SIM_RUN --> SIM_RESULT
    SIM_RESULT --> SIM_DIAG

    SIM_DIAG --> OPT_PANEL
    OPT_PANEL --> OPT_TYPE
    OPT_TYPE --> OPT_RUN
    OPT_RUN --> OPT_REVIEW
    OPT_REVIEW --> OPT_APPLY
    OPT_APPLY --> OPT_COMPARE
```

### 4.3 ROI Measurement 사용자 플로우

```mermaid
flowchart TB
    subgraph "측정 설정"
        ENTRY[ROI 측정 접속]
        SELECT_CHANGE[변경 항목 선택]
        SET_BASELINE[베이스라인 설정]
        SET_PERIOD[측정 기간 설정]
    end

    subgraph "데이터 입력"
        INPUT_COST[투자 비용 입력]
        INPUT_EXPECTED[예상 효과 입력]
        INPUT_ACTUAL[실제 결과 입력]
    end

    subgraph "분석 뷰"
        VIEW_COMPARE[Before/After 비교]
        VIEW_TREND[ROI 추이 그래프]
        VIEW_BREAKDOWN[항목별 분석]
    end

    subgraph "리포트"
        GEN_REPORT[리포트 생성]
        EXPORT[내보내기]
        SHARE[공유]
    end

    ENTRY --> SELECT_CHANGE
    SELECT_CHANGE --> SET_BASELINE
    SET_BASELINE --> SET_PERIOD

    SET_PERIOD --> INPUT_COST
    INPUT_COST --> INPUT_EXPECTED
    INPUT_EXPECTED --> INPUT_ACTUAL

    INPUT_ACTUAL --> VIEW_COMPARE
    VIEW_COMPARE --> VIEW_TREND
    VIEW_TREND --> VIEW_BREAKDOWN

    VIEW_BREAKDOWN --> GEN_REPORT
    GEN_REPORT --> EXPORT
    EXPORT --> SHARE
```

### 4.4 Settings 사용자 플로우

```mermaid
flowchart TB
    subgraph "Settings 진입"
        ENTRY[Settings 접속]
    end

    subgraph "Store Settings"
        SS_BASIC[기본 정보]
        SS_HOURS[영업 시간]
        SS_LAYOUT[레이아웃 관리]
        SS_ZONE[존 관리]
    end

    subgraph "Ontology"
        ONT_CAT[카테고리 관리]
        ONT_ATTR[속성 정의]
        ONT_REL[관계 설정]
        ONT_IMPORT[온톨로지 임포트]
    end

    subgraph "Data Management"
        DM_IMPORT[데이터 임포트]
        DM_EXPORT[데이터 익스포트]
        DM_SYNC[동기화 설정]
        DM_CLEAN[데이터 정리]
    end

    subgraph "Integrations"
        INT_POS[POS 연동]
        INT_SENSOR[센서 연동]
        INT_API[외부 API]
    end

    subgraph "User Settings"
        US_PROFILE[프로필 설정]
        US_NOTIF[알림 설정]
        US_PREF[환경 설정]
    end

    ENTRY --> SS_BASIC
    ENTRY --> ONT_CAT
    ENTRY --> DM_IMPORT
    ENTRY --> INT_POS
    ENTRY --> US_PROFILE

    SS_BASIC --> SS_HOURS --> SS_LAYOUT --> SS_ZONE
    ONT_CAT --> ONT_ATTR --> ONT_REL --> ONT_IMPORT
    DM_IMPORT --> DM_EXPORT --> DM_SYNC --> DM_CLEAN
    INT_POS --> INT_SENSOR --> INT_API
    US_PROFILE --> US_NOTIF --> US_PREF
```

---

## 5. 기능별 상세 플로우

### 5.1 AI 시뮬레이션 실행 플로우

```mermaid
flowchart TB
    subgraph "시뮬레이션 설정"
        START[시뮬레이션 시작]
        TYPE_SELECT{시뮬레이션 유형}

        TYPE_SELECT -->|예측형| PREDICTIVE[예측 시뮬레이션]
        TYPE_SELECT -->|진단형| DIAGNOSTIC[진단 시뮬레이션]
    end

    subgraph "옵션 설정"
        DURATION[시간 설정]
        CUSTOMERS[고객 수 설정]
        TIME_OF_DAY[시간대 선택]
    end

    subgraph "시나리오 선택"
        SCENARIO{시나리오 유형}
        SCENARIO -->|커스텀| CUSTOM[커스텀 설정]
        SCENARIO -->|프리셋| PRESET[프리셋 선택]

        PRESET --> CHRISTMAS[크리스마스]
        PRESET --> BLACKFRIDAY[블랙프라이데이]
        PRESET --> BACKTOSCHOOL[신학기]
        PRESET --> SUMMERSALE[여름 세일]
        PRESET --> NEWYEAR[새해 세일]
        PRESET --> WEEKEND[주말 피크]
        PRESET --> HOLIDAY[공휴일]
    end

    subgraph "실행 및 결과"
        RUN[실행]
        PROGRESS[진행 상황]
        RESULT[결과 표시]
        KPI_VIEW[KPI 확인]
        FLOW_VIEW[동선 시각화]
        ISSUE_VIEW[문제점 목록]
    end

    START --> TYPE_SELECT
    PREDICTIVE --> DURATION
    DIAGNOSTIC --> DURATION
    DURATION --> CUSTOMERS --> TIME_OF_DAY

    TIME_OF_DAY --> SCENARIO
    CUSTOM --> RUN
    CHRISTMAS --> RUN
    BLACKFRIDAY --> RUN
    BACKTOSCHOOL --> RUN
    SUMMERSALE --> RUN
    NEWYEAR --> RUN
    WEEKEND --> RUN
    HOLIDAY --> RUN

    RUN --> PROGRESS --> RESULT
    RESULT --> KPI_VIEW
    RESULT --> FLOW_VIEW
    RESULT --> ISSUE_VIEW
```

### 5.2 AI 최적화 실행 플로우

```mermaid
flowchart TB
    subgraph "최적화 시작"
        START[최적화 시작]
        ISSUE_SELECT[해결할 문제 선택]
    end

    subgraph "최적화 유형"
        TYPE{최적화 유형}
        TYPE -->|가구 배치| FURNITURE[가구 최적화]
        TYPE -->|상품 배치| PRODUCT[상품 최적화]
        TYPE -->|인력 배치| STAFFING[인력 최적화]
        TYPE -->|통합| BOTH[통합 최적화]
    end

    subgraph "AI 처리"
        AI_REQUEST[AI 요청]
        AI_PROCESS[AI 분석 중]
        AI_RESPONSE[AI 응답]
    end

    subgraph "결과 검토"
        REVIEW_CHANGES[변경사항 목록]
        PREVIEW_3D[3D 미리보기]
        EXPECTED_EFFECT[예상 효과 확인]
    end

    subgraph "적용"
        APPLY_DECISION{적용 여부}
        APPLY_DECISION -->|적용| APPLY[변경사항 적용]
        APPLY_DECISION -->|수정| MODIFY[수동 수정]
        APPLY_DECISION -->|취소| CANCEL[취소]

        APPLY --> SAVE[레이아웃 저장]
        MODIFY --> MANUAL_EDIT[수동 편집]
        MANUAL_EDIT --> SAVE
    end

    subgraph "검증"
        VERIFY_SIM[변경 후 시뮬레이션]
        COMPARE[Before/After 비교]
    end

    START --> ISSUE_SELECT --> TYPE
    FURNITURE --> AI_REQUEST
    PRODUCT --> AI_REQUEST
    STAFFING --> AI_REQUEST
    BOTH --> AI_REQUEST

    AI_REQUEST --> AI_PROCESS --> AI_RESPONSE

    AI_RESPONSE --> REVIEW_CHANGES
    REVIEW_CHANGES --> PREVIEW_3D
    PREVIEW_3D --> EXPECTED_EFFECT

    EXPECTED_EFFECT --> APPLY_DECISION

    SAVE --> VERIFY_SIM --> COMPARE
```

### 5.3 AI 시뮬레이션 → AI 최적화 연결 플로우

시뮬레이션에서 발견된 문제점을 최적화로 연결하는 통합 사용자 플로우입니다.

```mermaid
flowchart TB
    subgraph "Step 1: AI 시뮬레이션"
        SIM_START[AI 시뮬레이션 탭]
        PRESET_SELECT[프리셋 시나리오 선택]
        SIM_RUN[시뮬레이션 실행]
        SIM_RESULT[결과 확인]
        ISSUE_DETECT[문제점 감지]
    end

    subgraph "Step 2: 문제점 분석"
        ISSUE_LIST[문제점 목록 표시]
        ISSUE_DETAIL[이슈 상세 정보]
        ISSUE_IMPACT[예상 매출 손실]
        OPT_PROMPT["AI 최적화로 실행하시겠습니까?" 모달]
    end

    subgraph "Step 3: 최적화 연결"
        SELECT_ISSUES[해결할 문제 선택]
        NAV_OPT["AI 최적화 탭으로 이동" 클릭]
        TAB_SWITCH[AI 최적화 탭 전환]
    end

    subgraph "Step 4: AI 최적화 실행"
        DIAG_DISPLAY["문제점 시나리오" 섹션 표시]
        SCENARIO_INFO[시나리오 컨텍스트 표시]
        ISSUE_PREVIEW[이슈 목록 및 예상 영향]
        OPT_OPTION[최적화 옵션 설정]
        OPT_RUN[AI 최적화 실행]
        OPT_RESULT[최적화 결과 표시]
    end

    SIM_START --> PRESET_SELECT
    PRESET_SELECT --> SIM_RUN
    SIM_RUN --> SIM_RESULT
    SIM_RESULT --> ISSUE_DETECT

    ISSUE_DETECT -->|이슈 있음| ISSUE_LIST
    ISSUE_LIST --> ISSUE_DETAIL
    ISSUE_DETAIL --> ISSUE_IMPACT
    ISSUE_IMPACT --> OPT_PROMPT

    OPT_PROMPT --> SELECT_ISSUES
    SELECT_ISSUES --> NAV_OPT
    NAV_OPT --> TAB_SWITCH

    TAB_SWITCH --> DIAG_DISPLAY
    DIAG_DISPLAY --> SCENARIO_INFO
    SCENARIO_INFO --> ISSUE_PREVIEW
    ISSUE_PREVIEW --> OPT_OPTION
    OPT_OPTION --> OPT_RUN
    OPT_RUN --> OPT_RESULT
```

#### 사용자 인터랙션 상세

| 단계 | 사용자 액션 | 시스템 응답 |
|------|------------|------------|
| 1 | 프리셋 시나리오 선택 (예: 블랙프라이데이) | 환경 설정 자동 적용, 고객 수 조정 |
| 2 | "AI 예측 시뮬레이션 실행" 클릭 | 시뮬레이션 실행, 결과 및 문제점 표시 |
| 3 | 문제점 목록에서 해결할 이슈 확인 | 각 이슈의 위험도, 위치, 예상 영향 표시 |
| 4 | "AI 최적화로 해결하기" 클릭 | 최적화 모달 표시 |
| 5 | 해결할 문제 체크박스 선택 | 선택된 이슈 수 및 예상 회복 금액 표시 |
| 6 | "AI 최적화 탭으로 이동" 클릭 | AI 최적화 탭으로 전환, 문제점 시나리오 전달 |
| 7 | 최적화 옵션 설정 (유형, 변수) | 옵션 선택 UI |
| 8 | "AI 최적화 실행" 클릭 | AI가 진단 이슈를 최우선으로 해결하는 최적화 실행 |
| 9 | 최적화 결과 검토 | 권장사항, 예상 개선 효과, 3D 미리보기 |

#### 전달되는 진단 이슈 컨텍스트

시뮬레이션에서 최적화로 전달되는 데이터:

| 항목 | 설명 |
|------|------|
| `priority_issues` | 선택된 문제점 목록 (type, severity, zone, impact) |
| `scenario_context` | 적용된 프리셋 시나리오 정보 |
| `environment_context` | 환경 설정 (날씨, 시간대, 휴일) |
| `simulation_kpis` | 시뮬레이션 KPI 결과 |

### 5.4 데이터 임포트 플로우

```mermaid
flowchart TB
    subgraph "임포트 시작"
        START[데이터 임포트]
        TYPE_SELECT{데이터 유형}

        TYPE_SELECT -->|레이아웃| LAYOUT[레이아웃 임포트]
        TYPE_SELECT -->|상품| PRODUCT[상품 데이터]
        TYPE_SELECT -->|매출| SALES[매출 데이터]
        TYPE_SELECT -->|방문자| VISITOR[방문자 데이터]
    end

    subgraph "파일 처리"
        FILE_UPLOAD[파일 업로드]
        FILE_VALIDATE[파일 검증]
        FILE_PARSE[파싱]
    end

    subgraph "데이터 매핑"
        PREVIEW[데이터 미리보기]
        MAPPING[필드 매핑]
        TRANSFORM[데이터 변환]
    end

    subgraph "검증"
        VALIDATE[유효성 검사]
        ERROR_CHECK{오류 확인}
        ERROR_CHECK -->|오류 있음| ERROR_FIX[오류 수정]
        ERROR_CHECK -->|오류 없음| READY[임포트 준비]
        ERROR_FIX --> VALIDATE
    end

    subgraph "임포트 실행"
        CONFIRM[최종 확인]
        IMPORT[임포트 실행]
        PROGRESS[진행 상황]
        COMPLETE[완료]
    end

    LAYOUT --> FILE_UPLOAD
    PRODUCT --> FILE_UPLOAD
    SALES --> FILE_UPLOAD
    VISITOR --> FILE_UPLOAD

    FILE_UPLOAD --> FILE_VALIDATE --> FILE_PARSE

    FILE_PARSE --> PREVIEW --> MAPPING --> TRANSFORM

    TRANSFORM --> VALIDATE --> ERROR_CHECK

    READY --> CONFIRM --> IMPORT --> PROGRESS --> COMPLETE
```

### 5.4 존 관리 플로우

```mermaid
flowchart TB
    subgraph "존 관리 접근"
        START[존 관리 접속]
        VIEW_LIST[존 목록 보기]
    end

    subgraph "존 생성"
        CREATE_NEW[새 존 생성]
        DRAW_POLYGON[영역 그리기]
        SET_NAME[이름 설정]
        SET_TYPE[존 유형 선택]
        SET_PROPERTIES[속성 설정]
    end

    subgraph "존 유형"
        TYPE_ENTRANCE[입구]
        TYPE_CHECKOUT[계산대]
        TYPE_DISPLAY[진열대]
        TYPE_PROMO[프로모션]
        TYPE_REST[휴게공간]
        TYPE_STORAGE[창고]
    end

    subgraph "존 편집"
        SELECT_ZONE[존 선택]
        EDIT_BOUNDARY[경계 수정]
        EDIT_PROPS[속성 수정]
        DELETE_ZONE[존 삭제]
    end

    subgraph "존 분석"
        VIEW_STATS[통계 보기]
        VIEW_HEATMAP[히트맵]
        VIEW_FLOW[동선 분석]
    end

    START --> VIEW_LIST

    VIEW_LIST --> CREATE_NEW
    CREATE_NEW --> DRAW_POLYGON --> SET_NAME --> SET_TYPE

    SET_TYPE --> TYPE_ENTRANCE
    SET_TYPE --> TYPE_CHECKOUT
    SET_TYPE --> TYPE_DISPLAY
    SET_TYPE --> TYPE_PROMO
    SET_TYPE --> TYPE_REST
    SET_TYPE --> TYPE_STORAGE

    TYPE_ENTRANCE --> SET_PROPERTIES
    TYPE_CHECKOUT --> SET_PROPERTIES
    TYPE_DISPLAY --> SET_PROPERTIES
    TYPE_PROMO --> SET_PROPERTIES
    TYPE_REST --> SET_PROPERTIES
    TYPE_STORAGE --> SET_PROPERTIES

    VIEW_LIST --> SELECT_ZONE
    SELECT_ZONE --> EDIT_BOUNDARY
    SELECT_ZONE --> EDIT_PROPS
    SELECT_ZONE --> DELETE_ZONE

    SELECT_ZONE --> VIEW_STATS
    VIEW_STATS --> VIEW_HEATMAP --> VIEW_FLOW
```

---

## 6. 에러 및 예외 처리 플로우

### 6.1 일반 에러 처리

```mermaid
flowchart TB
    subgraph "에러 발생"
        ERROR[에러 발생]
        TYPE{에러 유형}
    end

    subgraph "네트워크 에러"
        NET_ERROR[네트워크 오류]
        NET_RETRY[자동 재시도]
        NET_FAIL[재시도 실패]
        NET_OFFLINE[오프라인 모드]
    end

    subgraph "인증 에러"
        AUTH_ERROR[인증 오류]
        AUTH_EXPIRED[세션 만료]
        AUTH_REDIRECT[로그인 리다이렉트]
    end

    subgraph "데이터 에러"
        DATA_ERROR[데이터 오류]
        DATA_INVALID[유효성 검사 실패]
        DATA_SHOW_MSG[에러 메시지 표시]
        DATA_GUIDE[수정 가이드]
    end

    subgraph "서버 에러"
        SERVER_ERROR[서버 오류]
        SERVER_MSG[에러 메시지]
        SERVER_SUPPORT[지원 문의 안내]
    end

    ERROR --> TYPE

    TYPE -->|네트워크| NET_ERROR
    NET_ERROR --> NET_RETRY
    NET_RETRY -->|실패| NET_FAIL
    NET_FAIL --> NET_OFFLINE

    TYPE -->|인증| AUTH_ERROR
    AUTH_ERROR --> AUTH_EXPIRED
    AUTH_EXPIRED --> AUTH_REDIRECT

    TYPE -->|데이터| DATA_ERROR
    DATA_ERROR --> DATA_INVALID
    DATA_INVALID --> DATA_SHOW_MSG
    DATA_SHOW_MSG --> DATA_GUIDE

    TYPE -->|서버| SERVER_ERROR
    SERVER_ERROR --> SERVER_MSG
    SERVER_MSG --> SERVER_SUPPORT
```

### 6.2 AI 기능 에러 처리

```mermaid
flowchart TB
    subgraph "AI 요청"
        REQUEST[AI 요청 전송]
        TIMEOUT{타임아웃?}
    end

    subgraph "타임아웃 처리"
        TIMEOUT -->|예| TIMEOUT_MSG[타임아웃 메시지]
        TIMEOUT_MSG --> RETRY_OPTION[재시도 옵션]
        RETRY_OPTION --> RETRY[재시도]
    end

    subgraph "응답 처리"
        TIMEOUT -->|아니오| RESPONSE[응답 수신]
        RESPONSE --> PARSE{파싱 성공?}
    end

    subgraph "파싱 에러"
        PARSE -->|실패| PARSE_ERROR[파싱 에러]
        PARSE_ERROR --> FALLBACK[폴백 응답]
        FALLBACK --> PARTIAL_RESULT[부분 결과 표시]
    end

    subgraph "성공 처리"
        PARSE -->|성공| VALIDATE{검증 성공?}
        VALIDATE -->|성공| DISPLAY[결과 표시]
        VALIDATE -->|실패| VALIDATE_ERROR[검증 에러]
        VALIDATE_ERROR --> WARN_MSG[경고 메시지 + 결과]
    end

    RETRY --> REQUEST
```

### 6.3 데이터 저장 실패 처리

```mermaid
flowchart TB
    subgraph "저장 시도"
        SAVE[저장 시도]
        RESULT{저장 성공?}
    end

    subgraph "실패 처리"
        RESULT -->|실패| SAVE_ERROR[저장 실패]
        SAVE_ERROR --> LOCAL_SAVE[로컬 저장]
        LOCAL_SAVE --> QUEUE[재시도 큐 추가]
        QUEUE --> NOTIFY[사용자 알림]
    end

    subgraph "복구"
        NOTIFY --> RECOVER{네트워크 복구?}
        RECOVER -->|예| AUTO_RETRY[자동 재시도]
        AUTO_RETRY --> SYNC[서버 동기화]
        SYNC --> CONFIRM[동기화 완료 알림]
    end

    subgraph "성공"
        RESULT -->|성공| SUCCESS[저장 완료]
        SUCCESS --> TOAST[성공 토스트]
    end
```

---

## 부록

### A. UI 컴포넌트 인터랙션 가이드

| 컴포넌트 | 인터랙션 | 결과 |
|----------|----------|------|
| 3D 캔버스 | 좌클릭 드래그 | 카메라 회전 |
| 3D 캔버스 | 우클릭 드래그 | 카메라 팬 |
| 3D 캔버스 | 스크롤 | 줌 인/아웃 |
| 객체 | 클릭 | 선택 |
| 객체 | 더블클릭 | 상세 정보 |
| 존 | 호버 | 하이라이트 |
| 차트 | 호버 | 툴팁 표시 |
| 테이블 행 | 클릭 | 상세 보기 |

### B. 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Esc` | 선택 해제 / 모달 닫기 |
| `Delete` | 선택 항목 삭제 |
| `Ctrl+S` | 저장 |
| `Ctrl+Z` | 실행 취소 |
| `Ctrl+Y` | 다시 실행 |
| `Space` | 시뮬레이션 일시정지/재생 |

### C. 관련 문서

- [NEURALTWIN_SERVICE_FLOW.md](./NEURALTWIN_SERVICE_FLOW.md) - 서비스 플로우 가이드
- [DIGITAL_TWIN_STUDIO_QA_GUIDE.md](./DIGITAL_TWIN_STUDIO_QA_GUIDE.md) - QA 가이드
- [AI_FINETUNING_DATASET_QA_GUIDE.md](./AI_FINETUNING_DATASET_QA_GUIDE.md) - AI 데이터셋 QA 가이드

---

## 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-01-06 | 초기 문서 작성 |
| 1.1 | 2026-01-06 | AI 시뮬레이션 → AI 최적화 연결 플로우 추가 (섹션 5.3) |
