# NEURALTWIN OS 챗봇 — Phase 2-C 기능 개발 결과 문서

> **버전**: v1.1
> **작성일**: 2026-02-05
> **수정일**: 2026-02-05 (제약조건 완화 반영 - ChatPanel disabled 구현)
> **작성자**: Claude AI Assistant
> **커밋**: 최종 커밋 참조

---

## 1. 개발 목표

**프론트엔드 통합 — useAssistantChat 훅 + ActionDispatcher + DashboardLayout 연결**

- 채팅창에서 메시지 입력 시 실제 `neuraltwin-assistant` Edge Function 호출
- 응답의 `actions` 배열을 실행하여 실제 페이지 이동/탭 전환/날짜 변경
- "인사이트 허브 고객탭 보여줘" 명령 시 실제로 해당 페이지/탭으로 이동
- **로딩 중 입력창 비활성화** (v1.1 추가)

---

## 2. 구현 결과

### 2.1 신규 파일 (5개)

| 파일 경로 | 설명 |
|-----------|------|
| `src/hooks/useAssistantChat.ts` | AI 연동 채팅 훅 (기존 useChatPanel 대체) |
| `src/features/assistant/hooks/useActionDispatcher.ts` | UIAction 실행 훅 (navigate, set_date_range) |
| `src/features/assistant/hooks/useAssistantContext.ts` | 대시보드 상태 수집 훅 |
| `src/features/assistant/utils/actionDispatcher.ts` | 액션 검증 유틸리티 (순수 함수) |
| `src/features/assistant/context/AssistantProvider.tsx` | Assistant Context Provider |

### 2.2 수정 파일 (4개)

| 파일 경로 | 수정 내용 |
|-----------|-----------|
| `src/components/chat/ChatPanel.tsx` | `disabled` prop 추가 + ChatInput에 전달 |
| `src/components/DashboardLayout.tsx` | `useChatPanel` → `useAssistantChat` 교체 + disabled 전달 |
| `src/features/insights/InsightHubPage.tsx` | URL 쿼리 파라미터(`?tab=`)로 탭 전환 지원 |
| `src/features/studio/DigitalTwinStudioPage.tsx` | URL 쿼리 파라미터(`?tab=`)로 탭 전환 지원 |

---

## 3. 주요 구현 내용

### 3.1 ChatPanel.tsx — disabled prop 추가 (v1.1 신규)

```typescript
interface ChatPanelProps {
  // ... 기존 props
  disabled?: boolean;  // 추가
}

export function ChatPanel({
  // ... 기존 params
  disabled = false,  // 추가
}: ChatPanelProps) {
  // ...

  // ChatInput에 disabled 전달
  <ChatInput onSend={onSendMessage} isDark={isDark} disabled={disabled} />
}
```

### 3.2 useAssistantChat.ts

```typescript
// 핵심 기능
- Edge Function 호출 (supabase.functions.invoke)
- 컨텍스트 자동 수집 (page, tab, dateRange, store)
- 액션 자동 실행 (dispatchActions)
- 로딩/스트리밍 상태 관리
- 후속 제안 표시

// 인터페이스 (기존 useChatPanel과 동일 + 확장)
interface UseAssistantChatReturn {
  isOpen: boolean;
  width: number;
  messages: ChatMessage[];
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  isLoading: boolean;      // 추가
  isStreaming: boolean;    // 추가
}
```

### 3.3 useActionDispatcher.ts

```typescript
// 지원 액션 타입
type UIAction = {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

// 구현 상태
- navigate: ✅ 완료 (useNavigate 사용)
- set_date_range: ✅ 완료 (useDateFilterStore 연동)
- open_dialog: 🔜 Phase 3 예정
- run_simulation: 🔜 Phase 3-C 예정
- run_optimization: 🔜 Phase 3-C 예정
```

### 3.4 DashboardLayout.tsx — disabled 전달

```typescript
<ChatPanel
  isOpen={isChatOpen}
  width={chatWidth}
  messages={messages}
  isDark={isDark}
  onClose={closePanel}
  onWidthChange={setWidth}
  onSendMessage={sendMessage}
  onClearMessages={clearMessages}
  disabled={isLoading || isStreaming}  // 로딩 중 입력 비활성화
/>
```

### 3.5 URL 쿼리 파라미터 탭 전환

```typescript
// InsightHubPage.tsx
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as InsightTabType | null;

useEffect(() => {
  if (tabFromUrl && ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);

// DigitalTwinStudioPage.tsx
useEffect(() => {
  if (tabFromUrl && ['layer', 'ai-simulation', 'ai-optimization', 'apply'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);
```

---

## 4. 완료 체크리스트

### 파일 생성
- [x] `src/hooks/useAssistantChat.ts` 생성
- [x] `src/features/assistant/hooks/useActionDispatcher.ts` 생성
- [x] `src/features/assistant/hooks/useAssistantContext.ts` 생성
- [x] `src/features/assistant/utils/actionDispatcher.ts` 생성
- [x] `src/features/assistant/context/AssistantProvider.tsx` 생성

### 기존 파일 수정
- [x] `ChatPanel.tsx` — disabled prop 추가 + ChatInput에 전달
- [x] `DashboardLayout.tsx` — import 변경 + 훅 호출 변경 + disabled 전달
- [x] `InsightHubPage.tsx` — useSearchParams + useEffect 추가
- [x] `DigitalTwinStudioPage.tsx` — useSearchParams + useEffect 추가

### 기능 테스트 (배포 후 확인 필요)
- [ ] 채팅창에서 메시지 전송 시 Edge Function 호출 확인
- [ ] "인사이트 허브로 가줘" → 실제 페이지 이동 확인
- [ ] "고객탭 보여줘" → 실제 탭 전환 확인
- [ ] "최근 7일로 변경해줘" → 날짜 필터 변경 확인
- [ ] "인사이트 허브 고객탭에서 7일 데이터 보여줘" → 복합 동작 확인
- [ ] **isLoading 동안 입력창 비활성화 확인** (v1.1 추가)
- [ ] 에러 발생 시 에러 메시지 표시 확인

---

## 5. 파일 구조

```
src/
├── hooks/
│   ├── useChatPanel.ts          # 기존 (미수정, 레거시)
│   └── useAssistantChat.ts      # 신규 (AI 연동)
├── components/
│   ├── DashboardLayout.tsx      # 수정 (useAssistantChat + disabled)
│   └── chat/
│       ├── ChatPanel.tsx        # 수정 (disabled prop 추가)
│       ├── ChatInput.tsx        # 기존 (이미 disabled 구현됨)
│       └── ChatMessage.tsx      # 미수정
├── features/
│   ├── assistant/
│   │   ├── context/
│   │   │   └── AssistantProvider.tsx
│   │   ├── hooks/
│   │   │   ├── useAssistantContext.ts
│   │   │   └── useActionDispatcher.ts
│   │   └── utils/
│   │       └── actionDispatcher.ts
│   ├── insights/
│   │   └── InsightHubPage.tsx   # 수정 (URL 탭 파라미터)
│   └── studio/
│       └── DigitalTwinStudioPage.tsx  # 수정 (URL 탭 파라미터)
```

---

## 6. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-02-05 | 초기 구현 (제약조건으로 ChatPanel 미수정) |
| v1.1 | 2026-02-05 | 제약조건 완화 - ChatPanel disabled prop 구현 |

---

## 7. 다음 단계

**Phase 3-A**: 일반 대화 + AI 연동
- `utils/geminiClient.ts` — Gemini API 클라이언트
- `actions/chatActions.ts` — general_chat 처리
- `response/generator.ts` — 자연어 응답 생성
- 시스템 프롬프트 정의

---

**Phase 2-C 개발 완료**
