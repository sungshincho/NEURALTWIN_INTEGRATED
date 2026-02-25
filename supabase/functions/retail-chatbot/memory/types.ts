/**
 * Memory Layer 3 — 타입 정의
 *
 * 사용자 프로파일, 대화 인사이트, 컨텍스트 메모리 공통 타입
 */

// ═══════════════════════════════════════════
//  사용자 프로파일 (자동 추출)
// ═══════════════════════════════════════════

export interface UserProfile {
  // 업종/카테고리
  industry?: string;          // 'fashion' | 'fnb' | 'beauty' | 'grocery' | 'general'
  industryDetail?: string;    // 자유 텍스트 (예: "프리미엄 캐주얼 의류")

  // 매장 규모
  storeSize?: 'small' | 'medium' | 'large';     // 소형(<50평) / 중형(50-150평) / 대형(150평+)
  storeSizeRaw?: string;      // 원본 표현 (예: "30평", "100m²")

  // 역할/직책
  role?: string;              // 'owner' | 'manager' | 'md' | 'vmd' | 'marketer' | 'staff'

  // 주요 관심 영역
  interests: string[];        // ['layout_flow', 'sales_conversion', ...]

  // Pain Points (축적)
  painPoints: string[];       // ['cost_pressure', 'staffing_challenge', ...]

  // 경험 수준 (추정)
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';

  // 지역 (언급된 경우)
  location?: string;          // '강남', '성수', 자유 텍스트
}

// ═══════════════════════════════════════════
//  대화 인사이트 (턴별 축적)
// ═══════════════════════════════════════════

export interface ConversationInsight {
  turn: number;               // 해당 턴 번호
  topicId: string;            // 분류된 토픽
  keyPoint: string;           // 핵심 내용 요약 (1줄, 최대 100자)
  userIntent?: string;        // 'learning' | 'problem_solving' | 'comparison' | 'planning'
  mentionedEntities?: string[]; // 언급된 브랜드/기업
  timestamp: string;          // ISO 8601
}

// ═══════════════════════════════════════════
//  컨텍스트 메모리 (DB 레코드)
// ═══════════════════════════════════════════

export interface ContextMemory {
  id: string;
  conversationId: string;
  sessionId: string | null;
  userId: string | null;
  userProfile: UserProfile;
  conversationInsights: ConversationInsight[];
  conversationSummary: string;
  lastTurnCount: number;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
//  프로파일 추출 입력
// ═══════════════════════════════════════════

export interface ProfileExtractionInput {
  message: string;
  topicId: string;
  painPointCategory: string | null;
  questionDepth: 'beginner' | 'advanced';
  turnCount: number;
}

// ═══════════════════════════════════════════
//  인사이트 축적 입력
// ═══════════════════════════════════════════

export interface InsightInput {
  message: string;
  topicId: string;
  turnCount: number;
  detectedEntities?: string[];
}

// ═══════════════════════════════════════════
//  기본값 생성자
// ═══════════════════════════════════════════

export function createEmptyProfile(): UserProfile {
  return {
    interests: [],
    painPoints: [],
  };
}

export function createEmptyMemory(
  conversationId: string,
  sessionId: string | null,
  userId: string | null
): Omit<ContextMemory, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    conversationId,
    sessionId,
    userId,
    userProfile: createEmptyProfile(),
    conversationInsights: [],
    conversationSummary: '',
    lastTurnCount: 0,
  };
}
