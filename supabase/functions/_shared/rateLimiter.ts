/**
 * rateLimiter.ts
 *
 * Rate Limiting 유틸리티
 * - 사용자별 분당 요청 수 제한
 * - 메모리 기반 (Edge Function 인스턴스 내)
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Rate Limit 엔트리
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate Limit 체크 결과
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 기본 분당 요청 제한 */
const DEFAULT_LIMIT = 30;

/** 제한 윈도우 (1분) */
const WINDOW_MS = 60 * 1000;

// ============================================================================
// 내부 상태
// ============================================================================

/** Rate Limit 저장소 (메모리 기반) */
const rateLimitMap = new Map<string, RateLimitEntry>();

// ============================================================================
// 메인 함수
// ============================================================================

/**
 * Rate Limit 체크
 *
 * @param userId - 사용자 ID
 * @param limit - 분당 최대 요청 수 (기본: 30)
 * @returns Rate Limit 결과
 */
export function checkRateLimit(
  userId: string,
  limit: number = DEFAULT_LIMIT
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${userId}`;

  let entry = rateLimitMap.get(key);

  // 새 윈도우 시작 또는 기존 윈도우 만료
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    rateLimitMap.set(key, entry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
    };
  }

  // 기존 윈도우 내 요청 - 제한 초과
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // 기존 윈도우 내 요청 - 허용
  entry.count++;
  rateLimitMap.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 만료된 엔트리 정리 (메모리 누수 방지)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * 특정 사용자의 Rate Limit 리셋 (테스트/관리용)
 */
export function resetRateLimit(userId: string): void {
  const key = `ratelimit:${userId}`;
  rateLimitMap.delete(key);
}

/**
 * 현재 Rate Limit 상태 조회 (디버깅용)
 */
export function getRateLimitStatus(userId: string): RateLimitEntry | null {
  const key = `ratelimit:${userId}`;
  return rateLimitMap.get(key) || null;
}

// ============================================================================
// Export
// ============================================================================

export default {
  checkRateLimit,
  cleanupExpiredEntries,
  resetRateLimit,
  getRateLimitStatus,
};
