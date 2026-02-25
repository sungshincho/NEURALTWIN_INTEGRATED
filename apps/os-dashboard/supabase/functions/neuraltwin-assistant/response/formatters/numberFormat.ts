/**
 * 공통 숫자 포맷 함수
 * 모든 탭 쿼리 모듈과 응답 생성기에서 공유
 */

/**
 * 한국식 숫자 포맷 (만, 억)
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}

/**
 * 통화 포맷 (₩)
 */
export function formatCurrency(num: number): string {
  return `₩${formatNumber(num)}`;
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}
