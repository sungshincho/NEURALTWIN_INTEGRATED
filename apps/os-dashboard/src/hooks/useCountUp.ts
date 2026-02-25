/**
 * useCountUp.ts
 *
 * KPI 카드 숫자 카운팅 애니메이션 훅
 * 0에서 목표값까지 부드럽게 증가하는 애니메이션 제공
 */

import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  /** 애니메이션 지속 시간 (ms) - 기본 1500ms */
  duration?: number;
  /** 소수점 자릿수 - 기본 0 */
  decimals?: number;
  /** 애니메이션 시작 지연 (ms) - 기본 0 */
  delay?: number;
  /** 활성화 여부 - false면 즉시 최종값 표시 */
  enabled?: boolean;
  /** 이전 값에서 시작할지 여부 - true면 값 변경 시 현재값에서 새 값으로 애니메이션 */
  preserveValue?: boolean;
}

/**
 * 숫자 카운트업 애니메이션 훅
 *
 * @param end - 목표 숫자값
 * @param options - 애니메이션 옵션
 * @returns 현재 애니메이션 중인 숫자값
 *
 * @example
 * ```tsx
 * const animatedValue = useCountUp(1180, { duration: 1500 });
 * return <span>{animatedValue.toLocaleString()}</span>;
 * ```
 */
export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
): number {
  const {
    duration = 1500,
    decimals = 0,
    delay = 0,
    enabled = true,
    preserveValue = false,
  } = options;

  const [currentValue, setCurrentValue] = useState(enabled ? 0 : end);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(0);
  const previousEndRef = useRef<number>(end);

  useEffect(() => {
    // 비활성화 상태면 즉시 최종값 표시
    if (!enabled) {
      setCurrentValue(end);
      return;
    }

    // end가 0이면 애니메이션 불필요
    if (end === 0) {
      setCurrentValue(0);
      return;
    }

    // NaN이나 무한대 체크
    if (!Number.isFinite(end)) {
      setCurrentValue(0);
      return;
    }

    // preserveValue가 true이고 이전 값이 있으면 현재값에서 시작
    const startFrom = preserveValue && previousEndRef.current !== end
      ? currentValue
      : 0;

    startValueRef.current = startFrom;
    previousEndRef.current = end;

    // 기존 애니메이션 취소
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // easeOutQuart 이징 함수 - 자연스러운 감속
    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current - delay;

      if (elapsed < 0) {
        // 아직 지연 시간이 지나지 않음
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const value = startValueRef.current + (end - startValueRef.current) * easedProgress;

      // 소수점 처리
      const roundedValue = decimals > 0
        ? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
        : Math.round(value);

      setCurrentValue(roundedValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 - 정확한 최종값 설정
        setCurrentValue(decimals > 0
          ? Math.round(end * Math.pow(10, decimals)) / Math.pow(10, decimals)
          : end
        );
      }
    };

    // 애니메이션 시작
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, decimals, delay, enabled]);

  return currentValue;
}

/**
 * 포맷된 카운트업 훅 - 통화, 퍼센트 등 포맷팅된 문자열 반환
 */
export function useFormattedCountUp(
  end: number,
  formatter: (value: number) => string,
  options: UseCountUpOptions = {}
): string {
  const animatedValue = useCountUp(end, options);
  return formatter(animatedValue);
}

export default useCountUp;
