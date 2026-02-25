/**
 * rateLimiter.ts
 *
 * Rate Limiting 유틸리티 (통합 버전)
 * - 메모리 기반 (C 버전 베이스) + 설정 객체 (E 버전 통합)
 * - createRateLimiter 팩토리로 한도를 인자로 받도록 통합
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * Rate Limit 설정
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

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
// 기본 설정
// ============================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 10 * 60 * 1000, // 10분
};

// ============================================================================
// 팩토리 함수
// ============================================================================

/**
 * Rate Limiter 생성
 *
 * @param config - Rate Limit 설정 (기본: 30요청/10분)
 * @returns checkRateLimit 함수
 */
export function createRateLimiter(config: RateLimitConfig = DEFAULT_CONFIG) {
  const requests = new Map<string, RateLimitEntry>();

  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;

    let entry = requests.get(key);

    // 새 윈도우 시작 또는 기존 윈도우 만료
    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      requests.set(key, entry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    // 기존 윈도우 내 요청 - 제한 초과
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // 기존 윈도우 내 요청 - 허용
    entry.count++;
    requests.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  };
}

// ============================================================================
// 기본 Rate Limiter (하위 호환)
// ============================================================================

/** 기본 Rate Limit 저장소 (메모리 기반) */
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate Limit 체크 (하위 호환용)
 *
 * @param userId - 사용자 ID
 * @param limit - 최대 요청 수 (기본: 30)
 * @param windowMs - 시간 윈도우 (기본: 10분)
 * @returns Rate Limit 결과
 */
export function checkRateLimit(
  userId: string,
  limit: number = DEFAULT_CONFIG.maxRequests,
  windowMs: number = DEFAULT_CONFIG.windowMs
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${userId}`;

  let entry = rateLimitMap.get(key);

  // 새 윈도우 시작 또는 기존 윈도우 만료
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
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
  createRateLimiter,
  checkRateLimit,
  cleanupExpiredEntries,
  resetRateLimit,
  getRateLimitStatus,
};
