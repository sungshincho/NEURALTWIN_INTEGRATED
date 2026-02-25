/**
 * NEURALTWIN Chat UI Kit - Common Types
 * 웹사이트 + OS 챗봇 공용 UI 타입 정의
 */

// =============================================
// 메시지 UI 타입
// =============================================

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
  actions?: UIActionUI[];
  suggestions?: string[];
  showLeadForm?: boolean;
}

export interface UIActionUI {
  type: string;
  label: string;
  onClick: () => void;
}

// =============================================
// 컴포넌트 Variant
// =============================================

export type ChatVariant = 'website' | 'os';

// =============================================
// 컴포넌트 Props
// =============================================

export interface ChatBubbleProps {
  message: ChatMessageUI;
  variant?: ChatVariant;
  showTimestamp?: boolean;
  feedbackSlot?: React.ReactNode;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  variant?: ChatVariant;
}

export interface TypingIndicatorProps {
  text?: string;
  variant?: ChatVariant;
}

export interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  maxItems?: number;
  variant?: ChatVariant;
}

export interface FeedbackButtonsProps {
  messageId: string;
  currentFeedback?: 'positive' | 'negative';
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
  disabled?: boolean;
}

export interface ChatScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export interface WelcomeMessageProps {
  variant?: ChatVariant;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

// =============================================
// 훅 타입
// =============================================

export interface UseStreamingOptions {
  onDelta: (chunk: string) => void;
  onComplete: (metadata: StreamingMetadata) => void;
  onError: (error: string) => void;
}

export interface StreamingMetadata {
  conversationId: string;
  topicCategory?: string;
  confidence?: number;
  suggestions?: string[];
  showLeadForm?: boolean;
  isAuthenticated?: boolean;
}

export interface UseChatSessionResult {
  sessionId: string;
  conversationId: string | null;
  setConversationId: (id: string) => void;
  clearSession: () => void;
}

// =============================================
// 스타일 설정
// =============================================

export const CHAT_STYLES = {
  website: {
    background: '#0a0a0a',
    userBubble: '#1a1a2e',
    assistantBubble: '#16213e',
    text: '#ffffff',
    accent: '#00d4aa',
    accentHover: '#00e8bb',
    border: 'rgba(255, 255, 255, 0.08)',
    inputBackground: '#111111',
    inputBorder: '#333333',
    placeholder: '#666666',
  },
  os: {
    // OS는 shadcn/ui 기본 테마 사용
    background: 'hsl(var(--background))',
    userBubble: 'hsl(var(--primary))',
    assistantBubble: 'hsl(var(--muted))',
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--primary))',
    accentHover: 'hsl(var(--primary) / 0.9)',
    border: 'hsl(var(--border))',
    inputBackground: 'hsl(var(--background))',
    inputBorder: 'hsl(var(--border))',
    placeholder: 'hsl(var(--muted-foreground))',
  },
} as const;

// =============================================
// 웰컴 메시지 설정
// =============================================

export const WELCOME_MESSAGES: Record<ChatVariant, {
  title: string;
  subtitle: string;
  greeting: string;
  defaultSuggestions: string[];
}> = {
  website: {
    title: 'NEURAL',
    subtitle: '리테일 인텔리전스 어드바이저',
    greeting: '안녕하세요! 리테일 매장 운영에 관한 전문 질문에 답변해드립니다.',
    defaultSuggestions: [
      '전환율 개선 방법은?',
      '매장 레이아웃 최적화',
      '리테일 KPI 벤치마크',
    ],
  },
  os: {
    title: 'AI Assistant',
    subtitle: 'NEURALTWIN OS',
    greeting: '무엇을 도와드릴까요?',
    defaultSuggestions: [
      '오늘 매출 보여줘',
      '시뮬레이션 실행',
      '최적화 제안',
    ],
  },
};
