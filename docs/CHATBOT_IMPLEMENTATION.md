# NEURALTWIN 웹사이트 AI 챗봇 — 구현 문서

> 최종 업데이트: 2026-02-11
> 브랜치: `claude/add-upload-reactions-export-NOtOS`

---

## 1. 시스템 개요

NEURALTWIN 웹사이트에 탑재되는 **리테일 전문 AI 챗봇 시스템**입니다.

| 구분 | 설명 |
|------|------|
| **페르소나** | 리테일 전문가 (매장 레이아웃, VMD, KPI, 전환율 등) |
| **AI 모델** | Gemini 2.5 Pro (Lovable Gateway 경유) |
| **프론트엔드** | React 18 + TypeScript + Three.js |
| **백엔드** | Supabase Edge Function (Deno) |
| **DB** | Supabase PostgreSQL |
| **3D 엔진** | Three.js + OrbitControls |

### 아키텍처 다이어그램

```
사용자 메시지 입력
     │
     ▼
┌─ Chat.tsx (프론트엔드) ─────────────────────┐
│  - 파일 업로드 (Supabase Storage)           │
│  - 히스토리 구성 (최근 20개)                │
│  - AbortController 기반 요청 관리           │
└────────────┬────────────────────────────────┘
             │ POST /functions/v1/retail-chatbot
             ▼
┌─ index.ts (Edge Function) ──────────────────┐
│  1. JWT 인증 확인                           │
│  2. Rate Limiting (비회원 10/분, 회원 30/분) │
│  3. Action 분기 (chat/lead/handover)        │
│  4. 토픽 분류 (topicRouter)                 │
│  5. 웹 검색 판단 (queryRouter → webSearch)  │
│  6. 파일 컨텍스트 구성                      │
│  7. Lovable Gateway AI 호출                 │
│  8. VizDirective 추출 + 한국어 라벨 보정    │
│  9. Pain Point 추출                         │
│ 10. Sales Bridge 평가                       │
│ 11. 후속 질문 생성                          │
│ 12. JSON 응답 반환                          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─ 프론트엔드 응답 처리 ─────────────────────┐
│  - 메시지 렌더링                           │
│  - VizDirective → 3D StoreVisualizer 반영  │
│  - KPI 바 / Stage Progress 표시            │
│  - Suggestions 칩 표시                     │
│  - Lead Form 조건부 표시                   │
└─────────────────────────────────────────────┘
```

---

## 2. 백엔드 Edge Function 상세

### 2.1 파일 구조

```
supabase/functions/retail-chatbot/
├── index.ts                 # 메인 핸들러 (라우팅, AI 호출, 응답 구성)
├── systemPrompt.ts          # 리테일 전문가 시스템 프롬프트 (~18,000 토큰)
├── retailKnowledge.ts       # 12개 토픽별 심화 도메인 지식 DB
├── topicRouter.ts           # 사용자 질문 → 토픽 분류 → 지식 주입
├── vizDirectiveGenerator.ts # 토픽 기반 VizDirective 기본값 생성
├── queryRouter.ts           # 웹 검색 필요성 판단 엔진
├── webSearch.ts             # Serper API 웹 검색 연동
├── painPointExtractor.ts    # Pain Point 자동 추출
├── salesBridge.ts           # 리드 스코어링 + 세일즈 단계 추적
└── suggestionGenerator.ts   # 맥락 기반 후속 질문 생성
```

### 2.2 토픽 라우터 (`topicRouter.ts`)

사용자 메시지를 분석하여 12개 리테일 토픽 중 가장 적합한 토픽을 분류합니다.

**분류 흐름:**
```
사용자 메시지 → scoreTopics() → keywords/keywordsKo 매칭
                    │
                    ├─ primaryTopic (최고 점수)
                    ├─ secondaryTopic (차순위)
                    └─ confidence (0~1)
                    │
                    ▼
combineKnowledgeContexts([primaryId, secondaryId])
                    │
                    ▼
SYSTEM_PROMPT + TOPIC_INJECTION_PREFIX + topicContext
```

**12개 토픽:**

| ID | 토픽명 | 핵심 키워드 |
|----|--------|-------------|
| layout_flow | 매장 레이아웃/동선 | 레이아웃, 동선, 배치, 히트맵 |
| vmd_display | VMD/비주얼 머천다이징 | VMD, 디스플레이, 진열, 마네킹 |
| sales_conversion | 매출/전환율 최적화 | 전환율, 객단가, 매출, KPI |
| inventory_supply | 재고/수요예측 | 재고, 발주, 수요예측, SCM |
| customer_analytics | 고객 분석/세분화 | 고객 분석, RFM, 세분화, 페르소나 |
| staff_productivity | 인력 배치/생산성 | 인력, 스케줄링, 생산성 |
| data_kpi | 데이터/KPI 대시보드 | 대시보드, KPI, 데이터, 보고서 |
| pricing_promotion | 가격/프로모션 | 프로모션, 할인, 가격 전략 |
| retail_tech | 리테일 테크 | IoT, 센서, AI, 디지털 전환 |
| digital_twin | 디지털 트윈 | 디지털 트윈, 시뮬레이션, 3D |
| neuraltwin_solution | NEURALTWIN 솔루션 | NEURALTWIN, NEURALSENSE |
| general_retail | 일반 리테일 | (기타 모든 주제) |

### 2.3 웹 검색 (`queryRouter.ts` + `webSearch.ts`)

사용자가 특정 브랜드/기업/제품을 언급하면 자동으로 웹 검색을 수행합니다.

**판단 기준 (`queryRouter.ts`):**
- 알려지지 않은 브랜드/기업명 감지
- 실시간 데이터 필요 여부 판단
- 검색 필요 이유 로깅

**검색 실행 (`webSearch.ts`):**
- Serper API (`google.serper.dev/search`)
- 한국어 결과 우선 (gl=kr, hl=ko)
- Knowledge Graph + Organic 결과 5개
- 시스템 프롬프트에 `[웹 검색 결과]` 형식으로 주입

### 2.4 Pain Point 추출 (`painPointExtractor.ts`)

사용자 메시지에서 비즈니스 고충을 자동으로 감지합니다.

| 카테고리 | 가중치 | 키워드 예시 |
|---------|--------|------------|
| cost_pressure | 3 | 비용, 예산, 절감, 인건비 |
| efficiency_gap | 2 | 비효율, 수작업, 시간 부족 |
| staffing_challenge | 2 | 인력 부족, 이직률, 채용 |
| technology_barrier | 2 | 기술 도입, 디지털화, 레거시 |
| data_insight_lack | 2 | 데이터 부족, 감으로, 분석 불가 |
| compliance_risk | 1 | 규정, 위반, 안전 |
| competition_threat | 2 | 경쟁사, 시장 점유율, 차별화 |

### 2.5 Sales Bridge (`salesBridge.ts`)

대화 진행도에 따른 리드 스코어링 및 세일즈 단계를 추적합니다.

**리드 스코어 산출:**
```
기본 점수: 0
+ 3턴 이상 대화: +20
+ Pain Point 감지: +25 (가중치 반영)
+ 고가치 토픽 (digital_twin, retail_tech): +20
+ 명시적 관심 표현: +30
+ neuraltwin_solution 토픽: +15
```

**세일즈 단계:**
```
awareness → interest → consideration → decision
                                         │
                      score ≥ 60 → Lead Form 표시
```

### 2.6 VizDirective 추출 및 검증

AI 응답에서 ` ```viz ``` ` 블록을 추출하고 검증합니다.

**핵심 기능:**
- JSON 파싱 + 유효성 검증
- 잘린 JSON 자동 복구 (`repairTruncatedJson`)
- 동적 존 좌표/크기 범위 제한
- **영문 라벨 → 한국어 자동 보정** (`enrichLabel` + 30+개 매핑 테이블)
- highlights/annotations가 존재하는 zone ID만 허용

---

## 3. 시스템 프롬프트 구조 (`systemPrompt.ts`)

약 18,000 토큰 규모의 시스템 프롬프트로 AI의 행동을 제어합니다.

### 섹션 구성

| 섹션 | 내용 |
|------|------|
| 1. 기본 신원 | 리테일 전문가 "NEURAL" 페르소나 정의 |
| 2. 커뮤니케이션 규칙 | 존댓말, 전문 용어 사용, 톤 앤 매너 |
| 3.1 답변 구조 | 3단 구성 (요약 → 상세 → 액션) |
| 3.2 금지 영역 | 의료/법률/투자 등 비리테일 주제 차단 |
| 3.3 리테일 벤치마크 | 업종별 KPI 수치 기준 |
| 3.4 출력 형식 | 마크다운 / 테이블 / 넘버링 |
| 3.5 기술 가드레일 | 기술 스택/AI 모델 미공개 (비즈니스 가치로 전환) |
| 3.6 브랜드 가드레일 | 웹검색 결과 우선 활용, 모르면 솔직하게 인정 |
| 4. Sales Bridge | NEURALTWIN 솔루션 자연스러운 연결 규칙 |
| **5. VizDirective** | **3D 비주얼라이저 JSON 출력 규칙 (핵심)** |

### 섹션 5: VizDirective 규칙 상세

AI가 모든 리테일 관련 답변에 다음 JSON 블록을 출력합니다:

```json
{
  "vizState": "overview",
  "zones": [
    { "id": "entrance", "label": "입구/포토존", "x": 0, "z": 8, "w": 8, "d": 3, "color": "#ff6b00" },
    { "id": "display", "label": "쿠키 쇼케이스", "x": -3, "z": 2, "w": 6, "d": 5, "color": "#0ea5e9" },
    { "id": "tasting", "label": "시식 코너", "x": 4, "z": 0, "w": 4, "d": 4, "color": "#22c55e" },
    { "id": "limited", "label": "한정판 구역", "x": -4, "z": -5, "w": 5, "d": 4, "color": "#8b5cf6" },
    { "id": "counter", "label": "주문/포장 카운터", "x": 4, "z": -5, "w": 5, "d": 3, "color": "#ef4444" }
  ],
  "highlights": ["display", "tasting", "limited"],
  "annotations": [
    { "zone": "tasting", "text": "시식→구매 전환\n40% 목표", "color": "#22c55e" }
  ],
  "flowPath": true,
  "kpis": [
    { "label": "목표 객단가", "value": "SGD 25", "sub": "번들 세트 전략" },
    { "label": "구매 전환율", "value": "40%", "sub": "시식 제공 시 목표" }
  ],
  "stage": "exploration"
}
```

**업종별 존 구성 가이드:**

| 업종 | 존 구성 예시 |
|------|-------------|
| 패션 리테일 | 입구/감압, 파워 월, 의류 메인, 피팅룸, 계산대, 액세서리 |
| F&B / 카페 | 입구/포토존, 진열대/쇼케이스, 주문 카운터, 좌석 구역, 주방, 테이크아웃 |
| 팝업 스토어 | 입구/포토존, 메인 진열, 체험존, 한정판 구역, 계산대 |
| 화장품 | 입구, 테스터 바, 스킨케어, 메이크업, 컨설팅 존, 계산대 |
| 전자제품 | 입구, 체험 존, 전시 구역, AS/상담, 계산대 |
| 식료품 | 입구, 신선식품, 델리, 식료품, 음료, 계산대 |

**강제 규칙:**
- zones 최소 **4개 이상** 필수
- label은 반드시 **한국어**
- 각 zone w, d는 **최소 3m** 이상
- highlights 최소 2개, annotations 최소 1개, kpis 최소 2개

---

## 4. 3D 비주얼라이저 상세

### 4.1 파일 구조

```
src/components/chatbot/visualizer/
├── StoreVisualizer.tsx       # 메인 React 컴포넌트 (Three.js 통합)
├── sceneBuilder.ts           # Three.js 씬 생성 (존, 가구, 동선, 파티클)
├── storeData.ts              # 기본 매장 데이터 (존, 가구, 카메라 프리셋)
├── vizDirectiveTypes.ts      # TypeScript 타입 정의
├── KPIBar.tsx                # KPI 카드 오버레이 컴포넌트
├── StageProgress.tsx         # 고객 여정 단계 표시 컴포넌트
└── index.ts                  # 모듈 exports
```

### 4.2 동적 존 시스템 (Method B: AI 동적 생성)

이전에는 패션 리테일 6개 존이 하드코딩되어 있었으나, 현재는 **AI가 대화 맥락에 맞는 존을 직접 생성**합니다.

**데이터 흐름:**

```
AI 응답 (viz 블록)
     │
     ▼
Backend: extractVizDirectiveFromResponse()
     │  - JSON 파싱
     │  - 좌표/크기 범위 검증
     │  - 한국어 라벨 보정 (enrichLabel)
     │
     ▼
Frontend: Chat.tsx → vizDirective state
     │
     ▼
StoreVisualizer (zones prop)
     │
     ├─ sceneBuilder.applyParamsToConfig(storeParams, zoneScale, dynamicZones)
     │      │
     │      ├─ dynamicZonesToRecord()       → 존 바닥면 + 테두리 렌더링
     │      ├─ generateFurnitureForZones()  → 존별 3~5개 와이어프레임 자동 생성
     │      └─ generateFlowFromZones()      → 존 순서 기반 동선 곡선
     │
     └─ StoreVisualizer.tsx
            ├─ zoneMap (O(1) 동적 존 조회)
            ├─ Zone 하이라이트 pulse 애니메이션
            ├─ Annotation 3D→2D 좌표 변환
            ├─ ZONES 범례 (한국어 라벨 + 색상)
            └─ VIEW 라벨 (현재 상태 표시)
```

### 4.3 자동 가구 생성 (`generateFurnitureForZones`)

동적 존 내부에 와이어프레임 집기(fixture)를 자동 배치합니다.

| 존 면적 | 집기 개수 | 크기 변형 |
|---------|----------|----------|
| < 10㎡ | 3개 | 낮은 카운터, 높은 선반, 중간 집기 |
| 10~20㎡ | 4개 | 랜덤 배치 (seeded random) |
| > 20㎡ | 5개 | 다양한 크기 조합 |

- **Seeded pseudo-random**: 같은 존에 항상 같은 배치 (일관성)
- **마진 유지**: 존 테두리에서 15% 안쪽에만 배치
- **3가지 크기 변형**: 낮은 테이블 (30%), 높은 선반 (30%), 중간 (40%)

### 4.4 카메라 프리셋

| vizState | 카메라 위치 | 용도 |
|----------|-----------|------|
| overview | (22, 20, 22) → (0,0,0) | 매장 전체 조감 |
| entry | (0, 18, 20) → (0,0,4) | 입구 정면 |
| exploration | (-18, 12, -8) → (-4,1,-4) | 내부 탐색 시점 |
| purchase | (14, 10, 16) → (6,1,6) | 계산대 포커스 |
| topdown | (0, 28, 0.1) → (0,0,0) | 수직 평면도 |

### 4.5 존 렌더링 가시성

| 상태 | 바닥면 opacity | 테두리 opacity |
|------|---------------|---------------|
| 비하이라이트 (기본) | 0.04 | 0.18 |
| 하이라이트 (pulse) | 0.13~0.37 | 0.70~1.00 |

---

## 5. 프론트엔드 기능 (`Chat.tsx`)

### 5.1 핵심 기능 목록

| 기능 | 설명 |
|------|------|
| **인라인 채팅** | 축소 모드에서 최근 3턴 표시, 이전 대화 접기/펼치기 |
| **전체화면 채팅** | 전체화면 오버레이, 축소↔전체화면 간 입력값 동기화 |
| **3D 비주얼라이저** | vizDirective가 있으면 55:45 분할 레이아웃, 모바일은 탭 전환 |
| **파일 업로드** | 이미지/PDF/DOCX/XLSX/TXT/CSV 지원, 10MB 제한, 텍스트 추출 |
| **메시지 리액션** | 복사/좋아요/싫어요 (클립보드 + 시각적 피드백) |
| **대화 내보내기** | Markdown / PDF / Word 3가지 형식 |
| **후속 질문 칩** | AI 제안 클릭 시 입력란에 자동 입력 |
| **Lead Capture Form** | Sales Bridge score ≥ 60일 때 표시 |
| **비회원 턴 제한** | 세션당 최대 10턴, 초과 시 모달 안내 |
| **플레이스홀더 로테이션** | 2.5초 간격 4가지 예시 질문 교체 |
| **타임라인 룰러** | 2018~2026년 마크 + minor tick (데코레이션) |

### 5.2 파일 업로드 파이프라인

```
사용자 파일 선택
     │
     ├─ 타입 검증 (ALLOWED_FILE_TYPES)
     ├─ 크기 검증 (MAX_FILE_SIZE: 10MB)
     │
     ▼
pendingFiles state (미리보기 표시)
     │
     ▼ [전송 시]
uploadChatFiles() → Supabase Storage
     │
     ├─ 텍스트 추출 (fileUpload.ts)
     │    ├─ PDF → pdfjs-dist (최대 30페이지)
     │    ├─ DOCX → mammoth
     │    ├─ XLSX → SheetJS (최대 5시트)
     │    └─ TXT/CSV/MD → FileReader.readAsText
     │
     ▼
API 요청 attachments에 포함 (name, type, size, url, textContent)
     │
     ▼
Backend: systemPrompt에 [파일: name]\n내용 형식으로 주입
```

### 5.3 대화 내보내기 (`exportConversation.ts`)

| 형식 | 라이브러리 | 특징 |
|------|-----------|------|
| Markdown | 내장 | 메시지별 `### User` / `### NEURAL` 헤더 |
| PDF | jsPDF | 한글 지원, 자동 페이지네이션 |
| Word | docx | 제목 + 테이블 스타일링 |

파일명: `NEURALTWIN_Chat_YYYYMMDD_HHMM.{md|pdf|docx}`

---

## 6. API 응답 구조

### 6.1 Chat 응답

```typescript
interface ChatResponse {
  // 텍스트 응답 (viz 블록 제거 후)
  content: string;

  // 세션 관리
  conversationId: string;
  sessionId: string;

  // 토픽 분류
  classification: {
    topic: string;     // 12개 토픽 ID 중 하나
    confidence: number; // 0~1
  };

  // 후속 질문 제안 (2~3개)
  suggestions: string[];

  // 리드 폼 표시 여부
  showLeadForm: boolean;

  // 세일즈 브릿지 정보
  salesBridge: {
    leadScore: number;  // 0~100
    stage: 'awareness' | 'interest' | 'consideration' | 'decision';
  };

  // Pain Point 분석
  painPoints: {
    detected: boolean;
    primary: string | null;
    summary: string;
  };

  // 3D 비주얼라이저 지시 데이터
  vizDirective: {
    vizState: 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';
    zones: DynamicZone[];       // AI가 생성한 매장 존 구조
    highlights: string[];       // 하이라이트할 존 ID
    annotations: VizAnnotation[]; // 존 위 텍스트 라벨
    flowPath: boolean;          // 동선 표시 여부
    kpis: VizKPI[];             // KPI 카드 데이터
    stage: CustomerStage;       // 고객 여정 단계
    storeParams?: StoreParams;  // 매장 크기 파라미터
    zoneScale?: ZoneScale;      // 존별 크기 조정
  } | null;
}
```

### 6.2 Action 엔드포인트

| action | 설명 | 필수 필드 |
|--------|------|----------|
| `chat` (기본) | AI 대화 | message, sessionId |
| `capture_lead` | 리드 정보 저장 | lead.email |
| `handover_session` | 비회원→회원 세션 인계 | sessionId + JWT |

---

## 7. DB 스키마 (챗봇 관련)

| 테이블 | 주요 컬럼 | 용도 |
|--------|----------|------|
| `chat_conversations` | session_id, user_id, channel, message_count | 대화 세션 관리 |
| `chat_messages` | conversation_id, role, content, channel_data | 메시지 로그 |
| `chat_leads` | email, company, role, pain_points, conversation_id | 리드 정보 |
| `chat_events` | event_type, event_data, conversation_id | 이벤트 추적 |

### 사용자 시나리오 (4가지)

```
① 웹사이트 비회원 → session_id로 대화 기록 (user_id = NULL)
② 웹사이트 회원   → session_id + user_id 둘 다 기록
③ 비회원→로그인   → 기존 대화의 user_id를 자동 업데이트 (세션 인계)
④ OS 접속        → user_id로 웹 대화 기록 자동 조회 (Context Bridge)
```

---

## 8. 보안 및 성능

### 8.1 보안 조치

| 항목 | 구현 |
|------|------|
| **CORS** | 화이트리스트 방식 (neuraltwin.com, lovable.app 등) |
| **인증** | JWT 선택적 검증 (비회원도 접근 가능, --no-verify-jwt 배포) |
| **Rate Limiting** | 비회원 10/분, 회원 30/분 (인메모리 카운터) |
| **파일 검증** | MIME 타입 + 크기 제한 (10MB) |
| **API 키 보호** | LOVABLE_API_KEY만 서버사이드 사용 |
| **기술 정보 보호** | 시스템 프롬프트 가드레일 (기술 스택 비공개) |

### 8.2 성능 최적화

| 항목 | 구현 |
|------|------|
| **토큰 절약** | retailKnowledge 분리 설계 (관련 토픽만 주입) |
| **히스토리 제한** | 최근 20개 메시지만 전송 |
| **Viz 블록 복구** | max_tokens truncation 시 JSON 자동 복구 |
| **씬 재빌드 방지** | sceneConfigKey 메모이제이션 |
| **카메라 부드러운 전환** | lerp 보간 (0.025 factor) |
| **Collapsible 메시지** | 최근 3턴만 표시, 이전 대화 접기 |

---

## 9. 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `5dfc85b` | 비주얼라이저 콘텐츠 품질 개선 — 한국어 라벨 보정, 시각적 밀도 강화 |
| `b8069a7` | 동적 존 내부에 자동 와이어프레임 집기 생성 — 시각적 밀도 복원 |
| `a892f68` | 가드레일 Section 3.6이 웹 검색 결과를 무시하게 만드는 문제 수정 |
| `bb708fe` | AI 동적 존 생성 — 대화 맥락에 맞는 3D 매장 비주얼라이저 |
| `f4ff56d` | viz 블록 truncation 문제 해결 — max_tokens 8192 + 잘린 JSON 복구 |
| `fd90b24` | isMobile 변수 미정의 에러 수정 |
| `21f3f15` | 웹 검색 연동 — 모르는 브랜드/기업 실시간 검색 (Serper API) |
| `c16342a` | 브랜드/기업 정보 할루시네이션 방지 가드레일 추가 |
| `f84fd27` | PDF/DOCX/XLSX 파일 내용 파싱 및 AI 컨텍스트 전달 |
| `126ea63` | 파일 업로드 기능 구현 — Storage 업로드 + DB 기록 |
| `e39aec3` | CORS에 neuraltwin.website 도메인 추가 |

---

## 10. 환경변수

| 변수 | 용도 |
|------|------|
| `LOVABLE_API_KEY` | Gemini 2.5 Pro/Flash 중계 (Lovable Gateway) |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 사이드 DB 접근 |
| `SUPABASE_ANON_KEY` | JWT 검증용 |
| `SERPER_API_KEY` | 웹 검색 (Serper API) |

---

## 11. 배포

```bash
# Edge Function 배포 (비인증 접근 허용)
supabase functions deploy retail-chatbot --no-verify-jwt

# 프론트엔드 (Lovable 자동 배포)
# main 브랜치 머지 시 자동 빌드 + 배포
```
