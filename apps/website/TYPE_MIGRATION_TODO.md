# Type Migration TODO

향후 `@/integrations/supabase/types` → `@neuraltwin/types` 전환 대상 파일 목록.

## Supabase Client Types
- `src/integrations/supabase/client.ts` — `import type { Database } from './types'`

## Auth Types (`@/types/auth`)
- `src/hooks/useAuth.ts`
- `src/pages/Subscribe.tsx`
- `src/lib/permissions.ts`
- `src/components/ProtectedRoute.tsx`

## Chat Types (`../types/chat.types`)
- `src/shared/chat/index.ts`
- `src/shared/chat/components/ChatBubble.tsx`
- `src/shared/chat/components/ChatInput.tsx`
- `src/shared/chat/components/ChatScrollArea.tsx`
- `src/shared/chat/components/FeedbackButtons.tsx`
- `src/shared/chat/components/SuggestionChips.tsx`
- `src/shared/chat/components/TypingIndicator.tsx`
- `src/shared/chat/components/WelcomeMessage.tsx`
- `src/shared/chat/hooks/useChatSession.ts`
- `src/shared/chat/hooks/useStreaming.ts`

## Zod Migration
- Zod 사용 파일 수: **0개** (직접 import 없음, 의존성으로만 존재)
- v3 → v4 전환 시 영향 없음 (package.json 버전만 업데이트하면 됨)
