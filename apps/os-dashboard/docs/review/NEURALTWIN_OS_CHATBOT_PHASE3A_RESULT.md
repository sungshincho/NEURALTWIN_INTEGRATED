# NEURALTWIN OS 챗봇 — Phase 3-A 기능 개발 결과 문서

> **버전**: v1.2
> **작성일**: 2026-02-05
> **작성자**: Claude AI Assistant
> **커밋**: 최종 커밋 참조

---

## 1. 개발 목표

**일반 대화(general_chat) + Gemini AI 연동**

- 패턴 매칭 실패 시 Gemini 2.5 Flash로 AI 분류 폴백
- "안녕", "뭐 할 수 있어?" 같은 일반 대화에 자연어 응답
- 시스템 프롬프트 기반 페르소나 적용

---

## 2. 구현 결과

### 2.1 신규 파일 (4개)

| 파일 경로 | 설명 |
|-----------|------|
| `utils/geminiClient.ts` | Gemini API 클라이언트 (Lovable Gateway 경유) |
| `constants/systemPrompt.ts` | 시스템 프롬프트 + 인텐트 분류 프롬프트 |
| `actions/chatActions.ts` | 일반 대화 처리 + 후속 제안 생성 |
| `response/generator.ts` | 자연어 응답 생성 유틸리티 |

### 2.2 수정 파일 (2개)

| 파일 경로 | 수정 내용 |
|-----------|-----------|
| `intent/classifier.ts` | AI 폴백 로직 추가 (패턴 실패 → Gemini 분류) |
| `index.ts` | general_chat 인텐트 처리 추가 |

---

## 3. 주요 구현 내용

### 3.1 하이브리드 인텐트 분류

```
사용자 입력
    ↓
[1차] 패턴 매칭 (confidence ≥ 0.7)
    ↓ 실패
[2차] Gemini AI 분류 (confidence ≥ 0.4)
    ↓ 실패
[3차] general_chat 폴백
```

### 3.2 geminiClient.ts

```typescript
// Lovable API Gateway 경유 Gemini 2.5 Flash 호출
const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const TIMEOUT_MS = 15000;

// 주요 함수
- callGemini(messages, options): GeminiResponse
- parseJsonResponse<T>(content): T | null
```

### 3.3 시스템 프롬프트

```typescript
// NEURALTWIN AI Assistant 페르소나
- 역할: 유능한 운영 오퍼레이터
- 언어: 한국어
- 톤: 친근하고 전문적
- 제한: 데이터 삭제/시스템 변경 거절
```

### 3.4 일반 대화 처리

```typescript
// handleGeneralChat 흐름
1. 컨텍스트 기반 시스템 프롬프트 보강
2. 최근 대화 이력 10개 포함
3. Gemini API 호출
4. 문맥 기반 후속 제안 생성
```

### 3.5 index.ts 인텐트 처리 확장

```typescript
if (['navigate', 'set_tab', 'set_date_range', 'composite_navigate'].includes(intent)) {
  // 네비게이션 처리
} else if (intent === 'general_chat') {
  // AI 일반 대화 처리
  const chatResult = await handleGeneralChat(message, [], context);
}
```

---

## 4. 완료 체크리스트

### 파일 생성
- [x] `utils/geminiClient.ts` 생성
- [x] `constants/systemPrompt.ts` 생성
- [x] `actions/chatActions.ts` 생성
- [x] `response/generator.ts` 생성

### 파일 수정
- [x] `intent/classifier.ts`에 AI 폴백 추가
- [x] `index.ts`에 general_chat 처리 추가

### 기능 테스트 (배포 후 확인 필요)
- [ ] "안녕" → general_chat + 자연어 응답
- [ ] "뭐 할 수 있어?" → 기능 안내 응답
- [ ] 패턴 매칭 실패 시 AI 분류 폴백 동작
- [ ] AI 타임아웃 시 에러 메시지 반환
- [ ] 후속 제안 생성 확인

### 환경 변수
- [ ] `LOVABLE_API_KEY` 환경 변수 설정 확인

---

## 5. 파일 구조

```
supabase/functions/neuraltwin-assistant/
├── index.ts                 # 메인 엔트리 (general_chat 추가)
├── intent/
│   ├── patterns.ts          # 패턴 매칭 (기존)
│   ├── classifier.ts        # 하이브리드 분류기 (AI 폴백 추가)
│   └── entityExtractor.ts   # 엔티티 추출 (기존)
├── actions/
│   ├── navigationActions.ts # 네비게이션 액션 (기존)
│   └── chatActions.ts       # 일반 대화 처리 (신규)
├── response/
│   └── generator.ts         # 응답 생성기 (신규)
├── utils/
│   ├── session.ts           # 세션 관리 (기존)
│   ├── errorTypes.ts        # 에러 타입 (기존)
│   └── geminiClient.ts      # Gemini API 클라이언트 (신규)
└── constants/
    └── systemPrompt.ts      # 시스템 프롬프트 (신규)
```

---

## 6. 환경 변수 요구사항

Edge Function에 필요한 환경 변수:

| 변수명 | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (자동 설정) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 역할 키 (자동 설정) |
| `LOVABLE_API_KEY` | Lovable API Gateway 키 (**수동 설정 필요**) |

---

## 7. 다음 단계

**Phase 3-B**: KPI 조회
- `actions/queryActions.ts` — query_kpi 인텐트 처리
- 기존 DB 테이블 직접 쿼리 (daily_kpis_agg, zone_daily_metrics 등)
- 조회 결과 자연어 변환

---

## 8. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-02-05 | 최초 작성 |
| v1.1 | 2026-02-05 | Lovable API URL 수정 (`api.lovable.dev` → `ai.gateway.lovable.dev`) |
| v1.2 | 2026-02-05 | 모델명 수정 (`gemini-2.5-flash` → `google/gemini-2.5-flash`), channel enum 수정 (`os_assistant` → `os_app`) |

---

**Phase 3-A 개발 완료**
