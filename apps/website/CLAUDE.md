# NEURALTWIN Dual Chatbot System

## 프로젝트 개요
NEURALTWIN 웹사이트 + OS에 탑재되는 듀얼 AI 챗봇 시스템.
- 웹사이트 챗봇 (NEURAL): 리테일 전문가 페르소나, Gemini 2.5 Pro, 리드 전환 목적
- OS 챗봇 (Assistant): 운영 오퍼레이터 페르소나, Gemini 2.5 Flash, 기능 실행 목적
- AI 모델은 전부 Lovable API Gateway를 경유. 직접 API 호출 하지 않음.

## 기술 스택
- Frontend: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Supabase Edge Functions (Deno)
- DB: Supabase PostgreSQL (기존 121 테이블 + 챗봇 7 테이블)
- AI: Gemini 2.5 Pro (웹 챗봇), Gemini 2.5 Flash (OS 챗봇) — 모두 Lovable Gateway 경유
- 3D: Three.js + React Three Fiber (기존)
- 상태관리: Zustand (기존), TanStack Query (기존)

## 사용자 시나리오 (4가지 — 반드시 이해)
```
① 웹사이트 비회원 → session_id로 대화 기록 (user_id = NULL)
② 웹사이트 회원 → session_id + user_id 둘 다 기록
③ 비회원→로그인 전환 → 기존 대화의 user_id를 자동 업데이트 (세션 인계)
④ OS 접속 → user_id로 웹 대화 기록 자동 조회 (Context Bridge)
```

## AI API 호출 패턴 (필독)
모든 AI 호출은 기존 run-simulation, generate-optimization 에서 사용하는 동일한 패턴을 따른다.
```typescript
const LOVABLE_GATEWAY_URL = 'https://lovable-api.anthropic.com/v1/chat/completions';

const response = await fetch(LOVABLE_GATEWAY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'gemini-2.5-pro',  // 웹 챗봇
    // model: 'gemini-2.5-flash',  // OS 챗봇
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,  // SSE 스트리밍 시
  }),
});
```
⚠️ 절대로 Anthropic API 직접 호출하지 말 것. ANTHROPIC_API_KEY 사용 안 함.

## 핵심 파일 — 리테일 전문가 시스템 (이미 작성 완료)
아래 3개 파일은 웹 챗봇의 두뇌에 해당. TASK 5에서 Deno 변환하여 사용.
- systemPrompt.ts: 리테일 전문가 페르소나, 답변 규칙, 도메인 프레임워크
- retailKnowledge.ts: 12개 토픽별 심화 도메인 지식 DB (토큰 절약용 분리 설계)
- topicRouter.ts: 사용자 질문 → 토픽 분류 → 해당 지식 주입 엔진

## 3개 파일의 연결 흐름 (반드시 이해 후 구현)
```
사용자 메시지 도착
  │
  ├─ topicRouter.buildEnrichedPrompt(message, conversationHistory)
  │    │
  │    ├─ classifyTopic(message, history)
  │    │    └─ scoreTopics() → RETAIL_KNOWLEDGE의 keywords/keywordsKo와 매칭
  │    │    └─ primaryTopic + secondaryTopic + confidence 결정
  │    │
  │    ├─ retailKnowledge.combineKnowledgeContexts([primaryId, secondaryId])
  │    │    └─ 해당 토픽의 context 필드만 추출 (토큰 절약)
  │    │
  │    └─ SYSTEM_PROMPT + TOPIC_INJECTION_PREFIX + topicContext 조립
  │
  └─ 반환: { systemPrompt: 최종조립결과, classification: 토픽분류정보 }
  │
  ▼
  AI API 호출:
    system = enrichedPrompt.systemPrompt  ← 여기에 주입
    messages = [...history, { role: 'user', content: message }]
  │
  ▼
  응답의 meta.topicCategory = classification.primaryTopic
  응답의 meta.confidence = classification.confidence
```

## 디렉토리 구조
```
src/
├── shared/chat/              # 공유 Chat UI Kit
│   ├── components/           # ChatBubble, ChatInput, TypingIndicator 등
│   ├── hooks/                # useStreaming, useChatSession
│   ├── utils/                # streaming.ts, messageFormatter.ts
│   └── types/                # chat.types.ts
├── components/
│   ├── chatbot/              # 웹사이트 챗봇 위젯
│   │   ├── ChatbotWidget.tsx
│   │   ├── ChatbotPanel.tsx
│   │   ├── LeadCaptureForm.tsx
│   │   └── useChatbot.ts
│   └── assistant/            # OS 챗봇 패널
│       ├── AssistantPanel.tsx
│       ├── AssistantProvider.tsx
│       └── useAssistant.ts
supabase/functions/
├── retail-chatbot/           # 웹사이트 챗봇 EF
│   ├── index.ts              # 메인 핸들러
│   ├── systemPrompt.ts       # ← Deno 변환된 버전
│   ├── retailKnowledge.ts    # ← Deno 변환된 버전
│   ├── topicRouter.ts        # ← Deno 변환된 버전
│   ├── salesBridge.ts        # 세일즈 브릿지 로직
│   ├── painPointExtractor.ts # Pain Point 자동 추출
│   └── suggestionGenerator.ts # 후속 질문 생성
├── neuraltwin-assistant/     # OS 챗봇 EF
│   ├── index.ts
│   ├── systemPrompt.ts       # ← OS 전용 시스템 프롬프트 (신규 작성)
│   ├── intent/
│   ├── actions/
│   ├── orchestrator/
│   └── response/
└── _shared/                  # 공유 유틸리티
    ├── chatLogger.ts
    ├── streamingResponse.ts
    ├── rateLimiter.ts
    ├── errorHandler.ts
    └── chatTypes.ts
```

## 핵심 규칙
1. AI 모델은 Lovable Gateway 경유 Gemini만 사용 (Claude API 직접 호출 금지)
2. 웹사이트 챗봇은 비인증+인증 모두 지원 → --no-verify-jwt로 배포하되, JWT가 있으면 user_id 추출
3. OS 챗봇은 인증 필수 → Supabase Auth 연동
4. DB는 통합 스키마 (chat_channel ENUM으로 구분)
5. 기존 Edge Functions (run-simulation, generate-optimization) 인터페이스 절대 변경 금지
6. AI API 키는 LOVABLE_API_KEY만 사용 (Deno.env.get('LOVABLE_API_KEY'))
7. 웹사이트 로그인 전환 시 세션 인계 (비회원 대화 → 회원 계정에 자동 연결)

## 환경변수
- LOVABLE_API_KEY: Gemini 2.5 Pro/Flash 중계 (기존 설정 그대로)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: 기존 설정
