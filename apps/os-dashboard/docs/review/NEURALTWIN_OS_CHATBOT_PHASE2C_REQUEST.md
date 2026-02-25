# NEURALTWIN OS 챗봇 — Phase 2-C 기능 개발 요청서

> **버전**: v1.1
> **작성일**: 2026-02-05
> **수정일**: 2026-02-05 (제약조건 완화 - ChatPanel 관련 파일 수정 허용)
> **선행 Phase**: Phase 2-B (엔티티 추출 + 탭/날짜 액션) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 2-C 목표

**프론트엔드 통합 — useAssistantChat 훅 + ActionDispatcher + DashboardLayout 연결**

이 Phase가 완료되면:
- 채팅창에서 메시지 입력 시 실제 `neuraltwin-assistant` Edge Function 호출
- 응답의 `actions` 배열을 실행하여 실제 페이지 이동/탭 전환/날짜 변경
- "인사이트 허브 고객탭 보여줘" 명령 시 실제로 해당 페이지/탭으로 이동
- 로딩 중 입력창 비활성화

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
✅ ChatPanel.tsx 수정 (disabled prop 추가)
✅ ChatInput.tsx (이미 disabled 구현됨, 수정 불필요)
✅ ChatMessage.tsx (수정 불필요)
✅ useChatPanel.ts (수정 불필요, useAssistantChat으로 대체)
✅ 새로운 훅/컨텍스트 파일 추가
✅ DashboardLayout.tsx 수정 (import 변경 + 훅 호출 변경 + disabled prop 전달)
✅ InsightHubPage.tsx, DigitalTwinStudioPage.tsx에 URL 쿼리 파라미터 읽기 코드 추가
```

---

## 3. 구현 범위

### 3.1 신규 파일 목록

```
src/
├── hooks/
│   └── useAssistantChat.ts           # 신규
├── features/
│   └── assistant/
│       ├── context/
│       │   └── AssistantProvider.tsx  # 신규
│       ├── hooks/
│       │   ├── useAssistantContext.ts # 신규
│       │   └── useActionDispatcher.ts # 신규
│       └── utils/
│           └── actionDispatcher.ts   # 신규
```

### 3.2 ChatPanel.tsx 수정 — disabled prop 추가

```typescript
// interface에 disabled 추가
interface ChatPanelProps {
  isOpen: boolean;
  width: number;
  messages: ChatMessageType[];
  isDark: boolean;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  onSendMessage: (content: string) => void;
  onClearMessages: () => void;
  disabled?: boolean;  // 추가
}

// 함수 파라미터에 disabled 추가
export function ChatPanel({
  ...
  disabled = false,  // 추가
}: ChatPanelProps) {

// ChatInput에 disabled 전달
<ChatInput onSend={onSendMessage} isDark={isDark} disabled={disabled} />
```

### 3.3 useAssistantChat.ts — AI 연동 채팅 훅

```typescript
/**
 * AI 연동 채팅 훅
 * 기존 useChatPanel과 동일한 인터페이스 유지
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useActionDispatcher } from '@/features/assistant/hooks/useActionDispatcher';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

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
  isLoading: boolean;
  isStreaming: boolean;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export function useAssistantChat(): UseAssistantChatReturn {
  // ... (생략, 기존과 동일)
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
```

### 3.4 useActionDispatcher.ts — UIAction 실행 훅

```typescript
/**
 * UIAction 실행 훅
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';

interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export function useActionDispatcher() {
  const navigate = useNavigate();
  const { setPreset, setCustomRange } = useDateFilterStore();

  const dispatchAction = useCallback(async (action: UIAction): Promise<void> => {
    switch (action.type) {
      case 'navigate':
        navigate(action.target);
        break;
      case 'set_date_range':
        if (action.preset) {
          setPreset(action.preset);
        } else if (action.startDate && action.endDate) {
          setCustomRange(action.startDate, action.endDate);
        }
        break;
      // ... 기타 액션
    }
  }, [navigate, setPreset, setCustomRange]);

  const dispatchActions = useCallback(async (actions: UIAction[]): Promise<void> => {
    for (const action of actions) {
      await dispatchAction(action);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [dispatchAction]);

  return { dispatchAction, dispatchActions };
}
```

### 3.5 actionDispatcher.ts — 유틸리티 (순수 함수)

```typescript
export interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export function validateAction(action: UIAction): boolean { /* ... */ }
export function filterValidActions(actions: UIAction[]): UIAction[] { /* ... */ }
```

### 3.6 useAssistantContext.ts — 대시보드 상태 수집 훅

```typescript
export interface AssistantContext {
  page: { current: string; tab?: string; };
  dateRange: { preset: string; startDate: string; endDate: string; };
  store: { id: string; name: string; };
}

export function useAssistantContext(): AssistantContext { /* ... */ }
```

### 3.7 AssistantProvider.tsx — 컨텍스트 Provider

```typescript
export function AssistantProvider({ children }: { children: ReactNode }) { /* ... */ }
export function useAssistantProvider(): AssistantProviderContextType { /* ... */ }
```

### 3.8 DashboardLayout.tsx 수정

```typescript
// 변경 전
import { useChatPanel } from '@/hooks/useChatPanel';

// 변경 후
import { useAssistantChat } from '@/hooks/useAssistantChat';

// 훅 호출 변경
const {
  isOpen: isChatOpen,
  width: chatWidth,
  messages,
  togglePanel,
  closePanel,
  setWidth,
  sendMessage,
  clearMessages,
  isLoading,      // 추가
  isStreaming,    // 추가
} = useAssistantChat();  // useChatPanel() → useAssistantChat()

// ChatPanel props에 disabled 추가
<ChatPanel
  isOpen={isChatOpen}
  width={chatWidth}
  messages={messages}
  isDark={isDark}
  onClose={closePanel}
  onWidthChange={setWidth}
  onSendMessage={sendMessage}
  onClearMessages={clearMessages}
  disabled={isLoading || isStreaming}  // 추가
/>
```

### 3.9 InsightHubPage.tsx URL 쿼리 파라미터 읽기 추가

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as InsightTabType | null;

useEffect(() => {
  if (tabFromUrl && ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);
```

### 3.10 DigitalTwinStudioPage.tsx URL 쿼리 파라미터 읽기 추가

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as TabType | null;

useEffect(() => {
  if (tabFromUrl && ['layer', 'ai-simulation', 'ai-optimization', 'apply'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);
```

---

## 4. 완료 체크리스트

### 파일 생성
- [ ] `src/hooks/useAssistantChat.ts` 생성
- [ ] `src/features/assistant/hooks/useActionDispatcher.ts` 생성
- [ ] `src/features/assistant/hooks/useAssistantContext.ts` 생성
- [ ] `src/features/assistant/utils/actionDispatcher.ts` 생성
- [ ] `src/features/assistant/context/AssistantProvider.tsx` 생성

### 기존 파일 수정
- [ ] `ChatPanel.tsx` — disabled prop 추가 + ChatInput에 전달
- [ ] `DashboardLayout.tsx` — import 변경 + 훅 호출 변경 + disabled 전달
- [ ] `InsightHubPage.tsx` — useSearchParams + useEffect 추가
- [ ] `DigitalTwinStudioPage.tsx` — useSearchParams + useEffect 추가

### 기능 테스트
- [ ] 채팅창에서 메시지 전송 시 Edge Function 호출 확인
- [ ] "인사이트 허브로 가줘" → 실제 페이지 이동 확인
- [ ] "고객탭 보여줘" → 실제 탭 전환 확인
- [ ] "최근 7일로 변경해줘" → 날짜 필터 변경 확인
- [ ] "인사이트 허브 고객탭에서 7일 데이터 보여줘" → 복합 동작 확인
- [ ] isLoading 동안 입력창 비활성화 확인
- [ ] 에러 발생 시 에러 메시지 표시 확인

---

## 5. 다음 Phase 예고

**Phase 3-A**: 일반 대화 + AI 연동
- `utils/geminiClient.ts` — Gemini API 클라이언트
- `actions/chatActions.ts` — general_chat 처리
- `response/generator.ts` — 자연어 응답 생성
- 시스템 프롬프트 정의

---

**Phase 2-C 요청서 끝**
