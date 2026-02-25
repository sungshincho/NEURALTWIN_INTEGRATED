/**
 * 네비게이션 전용 쿼리 핸들러
 * DB 조회 없이 해당 탭/섹션으로 이동만 수행
 * queryType: prediction*, ai추천*, settings*
 */

import { QueryActionResult, PageContext } from './types.ts';
import { createNavigationActions, createGenericNavigationResult } from './commonHelpers.ts';

/**
 * 예측(Prediction) 탭 — 네비게이션만 수행
 */
export function handlePredictionNavigation(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  const { actions } = createNavigationActions(queryType, dateRange, pageContext);
  return {
    actions,
    message: '예측 데이터는 예측 탭에서 직접 확인하실 수 있습니다.',
    suggestions: ['예측탭 보여줘', '매출 알려줘', '방문객 알려줘'],
  };
}

/**
 * AI추천(AI Recommendation) 탭 — 네비게이션만 수행
 */
export function handleAIRecommendationNavigation(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  const { actions } = createNavigationActions(queryType, dateRange, pageContext);
  return {
    actions,
    message: 'AI 추천 데이터는 AI추천 탭에서 직접 확인하실 수 있습니다.',
    suggestions: ['AI추천탭 보여줘', '매출 알려줘', '재고 현황 알려줘'],
  };
}

/**
 * 설정 & 관리, 기타 네비게이션 전용 queryType
 * aiEffect, dailyInsight, returnTrend, roiInsight 포함
 */
export { createGenericNavigationResult };
