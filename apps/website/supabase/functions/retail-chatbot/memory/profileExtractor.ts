/**
 * Profile Extractor — Phase 2 (Layer 3)
 *
 * 사용자 메시지에서 프로파일 정보를 자동 추출하여 축적
 * 규칙 기반 패턴 매칭 (AI 호출 없음, 레이턴시 0)
 *
 * 추출 대상:
 * - 업종 (fashion, fnb, beauty, grocery, general)
 * - 매장 규모 (small, medium, large)
 * - 역할/직책 (owner, manager, md, vmd, marketer, staff)
 * - 관심 영역 (토픽 ID 누적)
 * - 경험 수준 추정 (beginner, intermediate, expert)
 * - 지역 (언급된 경우)
 */

import type { UserProfile, ProfileExtractionInput } from './types.ts';

// ═══════════════════════════════════════════
//  업종 패턴
// ═══════════════════════════════════════════

const INDUSTRY_PATTERNS: Array<{ pattern: RegExp; industry: string; detail?: string }> = [
  // 패션
  { pattern: /(패션|의류|옷|SPA|어패럴|캐주얼|정장|스포츠웨어)/i, industry: 'fashion' },
  { pattern: /(구두|신발|슈즈|풋웨어)/i, industry: 'fashion', detail: '슈즈/풋웨어' },
  { pattern: /(명품|럭셔리|luxury|하이엔드)/i, industry: 'fashion', detail: '명품/럭셔리' },
  // F&B
  { pattern: /(카페|커피|coffee|음료|베이커리|빵집|제과)/i, industry: 'fnb', detail: '카페/베이커리' },
  { pattern: /(레스토랑|식당|음식점|맛집|다이닝)/i, industry: 'fnb', detail: '레스토랑' },
  { pattern: /(프랜차이즈|체인|가맹)/i, industry: 'fnb', detail: '프랜차이즈' },
  // 뷰티
  { pattern: /(뷰티|화장품|코스메틱|스킨케어|메이크업|드럭스토어)/i, industry: 'beauty' },
  // 식품/그로서리
  { pattern: /(그로서리|식품|마트|슈퍼|편의점|CVS)/i, industry: 'grocery' },
  // 일반
  { pattern: /(백화점|쇼핑몰|아울렛|리빙|가전|전자)/i, industry: 'general' },
  { pattern: /(골프|스포츠|아웃도어|레저)/i, industry: 'general', detail: '스포츠/레저' },
];

// ═══════════════════════════════════════════
//  매장 규모 패턴
// ═══════════════════════════════════════════

const STORE_SIZE_PATTERNS: Array<{ pattern: RegExp; size: 'small' | 'medium' | 'large'; raw?: string }> = [
  // 직접 수치 (평)
  { pattern: /(\d{1,2})평/, size: 'small' },     // 1-49평
  { pattern: /(5\d|6\d|7\d|8\d|9\d|1[0-4]\d)평/, size: 'medium' },  // 50-149평
  { pattern: /(1[5-9]\d|[2-9]\d\d|\d{4})평/, size: 'large' },        // 150평+
  // 묘사적 표현
  { pattern: /(소형|작은|좁은)\s*(매장|가게|점포)/, size: 'small' },
  { pattern: /(중형|중간|보통)\s*(매장|가게|점포)/, size: 'medium' },
  { pattern: /(대형|큰|넓은|플래그십)\s*(매장|가게|점포|스토어)/, size: 'large' },
  { pattern: /1인\s*운영|혼자\s*운영/, size: 'small' },
];

// ═══════════════════════════════════════════
//  역할 패턴
// ═══════════════════════════════════════════

const ROLE_PATTERNS: Array<{ pattern: RegExp; role: string }> = [
  { pattern: /(사장|대표|오너|owner|창업|운영자)/, role: 'owner' },
  { pattern: /(점장|매니저|manager|관리자|스토어\s*매니저)/, role: 'manager' },
  { pattern: /(MD|머천다이저|바이어|buyer)/, role: 'md' },
  { pattern: /(VMD|비주얼\s*머천다이저|디스플레이)/i, role: 'vmd' },
  { pattern: /(마케터|마케팅|marketing|홍보|브랜드\s*매니저)/, role: 'marketer' },
  { pattern: /(스태프|직원|알바|아르바이트|파트타이머)/, role: 'staff' },
];

// ═══════════════════════════════════════════
//  지역 패턴
// ═══════════════════════════════════════════

const LOCATION_PATTERNS: Array<{ pattern: RegExp; location: string }> = [
  { pattern: /강남/, location: '강남' },
  { pattern: /성수/, location: '성수' },
  { pattern: /홍대/, location: '홍대' },
  { pattern: /명동/, location: '명동' },
  { pattern: /가로수길/, location: '가로수길' },
  { pattern: /압구정/, location: '압구정' },
  { pattern: /이태원/, location: '이태원' },
  { pattern: /한남/, location: '한남동' },
  { pattern: /청담/, location: '청담' },
  { pattern: /판교/, location: '판교' },
  { pattern: /해운대/, location: '해운대' },
  { pattern: /여의도/, location: '여의도' },
  { pattern: /삼성동/, location: '삼성동' },
  { pattern: /잠실/, location: '잠실' },
];

// ═══════════════════════════════════════════
//  메인 추출 함수
// ═══════════════════════════════════════════

/**
 * 메시지에서 프로파일 정보를 추출하고 기존 프로파일에 병합
 * 기존 값은 유지하면서 새로 감지된 정보만 추가/업데이트
 */
export function extractAndMergeProfile(
  existingProfile: UserProfile,
  input: ProfileExtractionInput
): UserProfile {
  const { message, topicId, painPointCategory, questionDepth, turnCount } = input;
  const updated = { ...existingProfile };

  // 1. 업종 추출 (기존에 없을 때만)
  if (!updated.industry) {
    for (const { pattern, industry, detail } of INDUSTRY_PATTERNS) {
      if (pattern.test(message)) {
        updated.industry = industry;
        if (detail) updated.industryDetail = detail;
        break;
      }
    }
  }

  // 2. 매장 규모 추출
  if (!updated.storeSize) {
    for (const { pattern, size } of STORE_SIZE_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        updated.storeSize = size;
        updated.storeSizeRaw = match[0];
        break;
      }
    }
  }

  // 3. 역할 추출
  if (!updated.role) {
    for (const { pattern, role } of ROLE_PATTERNS) {
      if (pattern.test(message)) {
        updated.role = role;
        break;
      }
    }
  }

  // 4. 관심 영역 축적 (중복 방지)
  if (topicId && topicId !== 'general_retail') {
    if (!updated.interests.includes(topicId)) {
      updated.interests = [...updated.interests, topicId];
    }
  }

  // 5. Pain Points 축적
  if (painPointCategory && !updated.painPoints.includes(painPointCategory)) {
    updated.painPoints = [...updated.painPoints, painPointCategory];
  }

  // 6. 경험 수준 추정 (누적 기반)
  updated.experienceLevel = estimateExperienceLevel(updated, questionDepth, turnCount);

  // 7. 지역 추출
  if (!updated.location) {
    for (const { pattern, location } of LOCATION_PATTERNS) {
      if (pattern.test(message)) {
        updated.location = location;
        break;
      }
    }
  }

  return updated;
}

// ═══════════════════════════════════════════
//  경험 수준 추정
// ═══════════════════════════════════════════

function estimateExperienceLevel(
  profile: UserProfile,
  questionDepth: 'beginner' | 'advanced',
  turnCount: number
): 'beginner' | 'intermediate' | 'expert' {
  let score = 0;

  // 고급 질문 패턴
  if (questionDepth === 'advanced') score += 2;

  // 다양한 관심 영역 (3개 이상이면 경험자)
  if (profile.interests.length >= 3) score += 1;
  if (profile.interests.length >= 5) score += 1;

  // 전문 역할 (MD, VMD)
  if (profile.role === 'md' || profile.role === 'vmd') score += 2;
  if (profile.role === 'owner' || profile.role === 'manager') score += 1;

  // Pain Point 인식 (구체적 고민이 있으면 현직자)
  if (profile.painPoints.length >= 2) score += 1;

  // 대화 깊이
  if (turnCount >= 6) score += 1;

  if (score >= 4) return 'expert';
  if (score >= 2) return 'intermediate';
  return 'beginner';
}

// ═══════════════════════════════════════════
//  프로파일 → 프롬프트 텍스트 변환
// ═══════════════════════════════════════════

const INDUSTRY_NAMES: Record<string, string> = {
  fashion: '패션/의류',
  fnb: 'F&B/식음료',
  beauty: '뷰티/화장품',
  grocery: '식품/그로서리',
  general: '종합/기타',
};

const ROLE_NAMES: Record<string, string> = {
  owner: '매장 오너/대표',
  manager: '매장 매니저/점장',
  md: 'MD/바이어',
  vmd: 'VMD/디스플레이 담당',
  marketer: '마케터/브랜드 매니저',
  staff: '매장 스태프',
};

const SIZE_NAMES: Record<string, string> = {
  small: '소형 매장',
  medium: '중형 매장',
  large: '대형 매장',
};

/**
 * 프로파일이 충분히 축적되었을 때만 프롬프트 텍스트 생성
 * 정보가 부족하면 빈 문자열 반환
 */
export function formatProfileForPrompt(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.industry) {
    const name = INDUSTRY_NAMES[profile.industry] || profile.industry;
    parts.push(`업종: ${name}${profile.industryDetail ? ` (${profile.industryDetail})` : ''}`);
  }

  if (profile.storeSize) {
    const name = SIZE_NAMES[profile.storeSize] || profile.storeSize;
    parts.push(`규모: ${name}${profile.storeSizeRaw ? ` (${profile.storeSizeRaw})` : ''}`);
  }

  if (profile.role) {
    parts.push(`역할: ${ROLE_NAMES[profile.role] || profile.role}`);
  }

  if (profile.location) {
    parts.push(`지역: ${profile.location}`);
  }

  // 최소 2개 이상 정보가 있어야 주입
  if (parts.length < 2) return '';

  return `\n[사용자 프로파일]\n이 사용자에 대해 파악된 정보입니다. 답변 시 이 맥락을 자연스럽게 반영하세요.\n${parts.join(' | ')}`;
}
