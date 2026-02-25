/**
 * NEURALTWIN Dual Chatbot System - Common Types
 * 웹사이트 챗봇 + OS 챗봇 공통 타입 정의
 */

// =============================================
// 채널 타입
// =============================================

export type ChatChannel = 'website' | 'os_app';

// =============================================
// 대화 & 메시지
// =============================================

export interface ChatConversation {
  id: string;
  channel: ChatChannel;
  userId?: string;
  sessionId?: string;
  storeId?: string;
  messageCount: number;
  totalTokensUsed: number;
  channelMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  executionTimeMs?: number;
  channelData: Record<string, unknown>;
  userFeedback?: 'positive' | 'negative';
  feedbackComment?: string;
  createdAt: string;
}

// =============================================
// 웹사이트 전용 channel_data
// =============================================

export interface WebsiteChannelData {
  topicCategory: string;
  subCategory?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  painPointSummary?: string;
  containsPainPoint: boolean;
  solutionMentioned: boolean;
  detectedKeywords?: string[];
  confidence?: number;
}

// =============================================
// OS 전용 channel_data
// =============================================

export interface OSChannelData {
  intent: string;
  confidence: number;
  subIntent?: string;
  actions?: UIAction[];
  suggestions?: string[];
  entities?: Record<string, unknown>;
}

export interface UIAction {
  type: 'navigate' | 'toggle_layer' | 'select_zone' | 'run_simulation' | 'run_optimization' | 'camera_move';
  target?: string;
  params?: Record<string, unknown>;
  label: string;
}

// =============================================
// 웹사이트 챗봇 요청/응답
// =============================================

export interface WebChatRequest {
  message: string;
  sessionId: string;
  conversationId?: string;
  turnCount: number;
  accessToken?: string;  // v2.1: JWT 토큰 (선택, 로그인 시 전달)
  metadata?: {
    utmSource?: string;
    referrer?: string;
    userAgent?: string;
  };
}

export interface WebChatResponse {
  message: string;
  meta: {
    conversationId: string;
    topicCategory: string;
    confidence: number;
    isAuthenticated: boolean;  // v2.1: 로그인 여부 반환
  };
  suggestions?: string[];
  showLeadForm?: boolean;
}

// =============================================
// OS 챗봇 요청/응답
// =============================================

export interface OSAssistantRequest {
  message: string;
  conversationId?: string;
  context: {
    page: {
      current: string;
      tab?: string;
    };
    selection?: {
      zoneIds?: string[];
      furnitureIds?: string[];
    };
    dateRange?: {
      start: string;
      end: string;
    };
    store: {
      id: string;
      name: string;
    };
    recentResults?: {
      hasSimulation: boolean;
      hasOptimization: boolean;
    };
  };
  settings?: {
    language: 'ko' | 'en';
    detailLevel: 'brief' | 'detailed';
  };
}

export interface OSAssistantResponse {
  message: {
    content: string;
    format: 'text' | 'markdown';
  };
  actions?: UIAction[];
  suggestions?: string[];
  meta: {
    conversationId: string;
    intent: string;
    confidence: number;
    executionTime: number;
  };
}

// =============================================
// 리드 캡처
// =============================================

export interface LeadCaptureRequest {
  type: 'lead';
  conversationId: string;
  email: string;
  company?: string;
  role?: string;
  sourcePage?: string;
}

export interface LeadCaptureResponse {
  success: boolean;
  message: string;
}

// =============================================
// 세션 인계 (v2.1)
// =============================================

export interface SessionHandoverRequest {
  type: 'handover';
  sessionId: string;
  accessToken: string;
}

export interface SessionHandoverResponse {
  success: boolean;
  conversationsLinked: number;
}

// =============================================
// 토픽 분류 결과
// =============================================

export interface TopicClassification {
  primaryTopic: string;
  secondaryTopic?: string;
  confidence: number;
  detectedKeywords: string[];
}

export interface EnrichedPrompt {
  systemPrompt: string;
  classification: TopicClassification;
}

// =============================================
// 이벤트 타입
// =============================================

export type ChatEventType =
  | 'session_start'
  | 'lead_captured'
  | 'feedback'
  | 'sales_bridge_triggered'
  | 'pain_point_detected'
  | 'session_handover';  // v2.1 추가

// =============================================
// Rate Limit
// =============================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: string;
}

// =============================================
// 에러
// =============================================

export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
