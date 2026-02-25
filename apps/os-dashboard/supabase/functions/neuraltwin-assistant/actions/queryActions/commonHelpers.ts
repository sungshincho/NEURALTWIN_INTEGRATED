/**
 * queryActions 공용 헬퍼 함수
 * 모든 탭 쿼리 모듈이 공유하는 함수들
 */

import { UIAction, QueryActionResult, PageContext } from './types.ts';
import { QUERY_TYPE_TO_TAB } from './constants.ts';
import { findTermLocation } from '../../config/dashboardStructure.ts';

/**
 * 쿼리 타입에서 용어 키워드 추출
 */
export function getTermKeyword(queryType: string): string {
  const termMap: Record<string, string> = {
    // 개요
    revenue: '매출',
    conversion: '전환율',
    avgTransaction: '객단가',
    footfall: '입장객',
    visitFrequency: '방문 빈도',
    funnel: '고객 여정 퍼널',
    goal: '목표 달성률',
    aiEffect: 'AI 추천 효과',
    dailyInsight: 'AI 인사이트',
    summary: '매출',
    // 매장
    peakTime: '피크타임',
    popularZone: '인기 존',
    trackingCoverage: '센서 커버율',
    hourlyPattern: '시간대별 방문',
    zoneAnalysis: '존 분석',
    zonePerformance: '존별 성과 비교',
    storeDwell: '평균 체류시간',
    // 고객
    visitors: '방문객',
    dwellTime: '평균 체류시간',
    newVsReturning: '방문객',
    repeatRate: '재방문율',
    customerSegment: '고객 세그먼트',
    loyalCustomers: '충성 고객',
    segmentAvgPurchase: '세그먼트별 평균 구매액',
    segmentVisitFrequency: '세그먼트별 방문 빈도',
    segmentDetail: '세그먼트 상세 분석',
    returnTrend: '재방문 추이',
    // 상품
    product: '상품',
    bestSeller: '베스트셀러',
    topProducts: '인기 상품',
    categoryAnalysis: '카테고리 분석',
    unitsSold: '판매량',
    // 재고
    inventory: '재고',
    overstock: '과잉 재고',
    stockAlert: '재고 부족 경고',
    stockMovement: '입출고 내역',
    stockDistribution: '재고 분포',
    healthyStock: '정상 재고',
    inventoryCategory: '카테고리별 재고',
    inventoryDetail: '상세 재고 현황',
    // 예측
    predictionRevenue: '예측',
    predictionVisitors: '예측',
    predictionConversion: '예측',
    predictionSummary: '예측',
    predictionConfidence: '예측',
    predictionDaily: '예측',
    predictionModel: '예측',
    // AI추천
    activeStrategies: 'AI추천',
    strategyRecommendation: 'AI추천',
    priceOptimization: 'AI추천',
    inventoryOptimization: 'AI추천',
    demandForecast: 'AI추천',
    seasonTrend: 'AI추천',
    riskPrediction: 'AI추천',
    campaignStatus: 'AI추천',
    // ROI 측정
    roiSummary: 'ROI 요약',
    appliedStrategies: '적용된 전략',
    categoryPerformance: '카테고리별 성과',
    roiInsight: 'ROI 인사이트',
    filterStrategies: '적용 이력 필터',
    exportStrategies: '적용 이력 내보내기',
    roiTablePage: '적용 이력',
    // 설정 & 관리
    storeManagement: '매장 관리',
    userManagement: '사용자 관리',
    subscriptionInfo: '구독 정보',
    systemSettings: '시스템 설정',
    dataSettings: '데이터 설정',
  };
  return termMap[queryType] || '매출';
}

/**
 * 날짜 범위를 기반으로 네비게이션 액션 생성 (컨텍스트 인식)
 */
export function createNavigationActions(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): { actions: UIAction[]; tabChanged: boolean; targetTab: string } {
  const mapping = QUERY_TYPE_TO_TAB[queryType] || QUERY_TYPE_TO_TAB.summary;
  const actions: UIAction[] = [];

  const currentPage = pageContext?.current || '';
  const currentTab = pageContext?.tab || '';
  const targetPage = mapping.page;
  const targetTab = mapping.tab || '';

  const pageNeedsChange = currentPage !== targetPage;
  const tabNeedsChange = targetTab ? currentTab !== targetTab : false;
  const tabChanged = pageNeedsChange || tabNeedsChange;

  if (pageNeedsChange && targetTab) {
    actions.push({ type: 'navigate', target: `${targetPage}?tab=${targetTab}` });
  } else if (pageNeedsChange) {
    actions.push({ type: 'navigate', target: targetPage });
  } else if (tabNeedsChange && targetTab) {
    actions.push({ type: 'set_tab', target: targetTab });
  }

  actions.push({
    type: 'set_date_range',
    target: { startDate: dateRange.startDate, endDate: dateRange.endDate },
  });

  if (mapping.section) {
    actions.push({
      type: 'scroll_to_section',
      sectionId: mapping.section,
      highlight: true,
      highlightDuration: 2000,
    });
  }

  return { actions, tabChanged, targetTab };
}

/**
 * 탭 이름을 한글로 변환
 */
export function getTabDisplayName(tabId: string): string {
  const tabNames: Record<string, string> = {
    overview: '개요',
    customer: '고객',
    store: '매장',
    product: '상품',
    inventory: '재고',
    prediction: '예측',
    ai: 'AI추천',
    stores: '매장 관리',
    data: '데이터',
    users: '사용자',
    system: '시스템',
    license: '플랜',
  };
  return tabNames[tabId] || tabId;
}

/**
 * 페이지 이름을 한글로 변환
 */
export function getPageDisplayName(pagePath: string): string {
  const pageNames: Record<string, string> = {
    '/insights': '인사이트 허브',
    '/studio': '디지털트윈 스튜디오',
    '/roi': 'ROI 측정',
    '/settings': '설정',
    '/data/control-tower': '데이터 컨트롤타워',
  };
  return pageNames[pagePath] || pagePath;
}

/**
 * DB 쿼리 없이 해당 탭으로 네비게이션만 수행
 */
export function createGenericNavigationResult(
  queryType: string,
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  const termKeyword = getTermKeyword(queryType);
  const mapping = QUERY_TYPE_TO_TAB[queryType] || QUERY_TYPE_TO_TAB.summary;
  const { actions, tabChanged, targetTab } = createNavigationActions(queryType, dateRange, pageContext);

  let message: string;
  if (targetTab) {
    const tabName = getTabDisplayName(targetTab);
    if (tabChanged) {
      message = `${tabName} 탭의 ${termKeyword} 섹션으로 이동합니다.`;
    } else {
      message = `현재 ${tabName} 탭에서 ${termKeyword}을(를) 확인할 수 있습니다.`;
    }
  } else {
    const pageName = getPageDisplayName(mapping.page);
    if (tabChanged) {
      message = `${pageName} 페이지의 ${termKeyword} 섹션으로 이동합니다.`;
    } else {
      message = `현재 ${pageName} 페이지에서 ${termKeyword}을(를) 확인할 수 있습니다.`;
    }
  }

  return {
    actions,
    message,
    suggestions: [`${termKeyword} 더 보기`, '다른 지표 보기'],
  };
}

/**
 * 중복 위치 용어 체크 및 메시지 생성
 */
export function getDisambiguationInfo(
  queryType: string,
  pageContext?: PageContext
): { extraMessage: string; shouldAsk: boolean; alternativeTabs: string[] } | null {
  const termKeyword = getTermKeyword(queryType);
  const entry = findTermLocation(termKeyword);

  if (!entry || !entry.secondary || entry.secondary.length === 0) {
    return null;
  }

  const currentTab = pageContext?.tab || '';

  const allLocations = [entry.primary, ...entry.secondary];
  const allTabs = allLocations
    .filter(loc => loc.tab)
    .map(loc => ({
      tab: loc.tab!,
      tabName: getTabDisplayName(loc.tab!),
      description: entry.description?.[loc.tab!] || '',
    }));

  const isOnMatchingTab = allTabs.some(t => t.tab === currentTab);
  const otherTabs = allTabs.filter(t => t.tab !== currentTab);

  if (isOnMatchingTab && otherTabs.length > 0) {
    const otherTabNames = otherTabs.map(t => {
      return t.description ? `${t.tabName} 탭(${t.description})` : `${t.tabName} 탭`;
    }).join(', ');
    return {
      extraMessage: `\n참고: ${termKeyword}은(는) ${otherTabNames}에서도 확인할 수 있습니다.`,
      shouldAsk: false,
      alternativeTabs: otherTabs.map(t => t.tab),
    };
  }

  if (!isOnMatchingTab && allTabs.length > 1) {
    const otherTabsFromPrimary = allTabs.filter(t => t.tab !== entry.primary.tab);
    const otherTabNames = otherTabsFromPrimary.map(t => {
      return t.description ? `${t.tabName} 탭(${t.description})` : `${t.tabName} 탭`;
    }).join(', ');
    return {
      extraMessage: `\n참고: ${termKeyword}은(는) ${otherTabNames}에서도 확인할 수 있습니다.`,
      shouldAsk: false,
      alternativeTabs: otherTabsFromPrimary.map(t => t.tab),
    };
  }

  return null;
}

/**
 * 기간 계산 (확장됨)
 */
export function getDateRange(period: { type: string; startDate?: string; endDate?: string }): {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (period.type) {
    case 'custom': {
      if (period.startDate && period.endDate) {
        return { startDate: period.startDate, endDate: period.endDate };
      }
      return { startDate: formatDate(today), endDate: formatDate(today) };
    }

    case 'today': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: formatDate(today), endDate: formatDate(today),
        compareStartDate: formatDate(yesterday), compareEndDate: formatDate(yesterday),
      };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);
      return {
        startDate: formatDate(yesterday), endDate: formatDate(yesterday),
        compareStartDate: formatDate(dayBefore), compareEndDate: formatDate(dayBefore),
      };
    }

    case 'thisWeek': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { startDate: formatDate(startOfWeek), endDate: formatDate(today) };
    }

    case 'lastWeek': {
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return { startDate: formatDate(startOfLastWeek), endDate: formatDate(endOfLastWeek) };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(startOfMonth), endDate: formatDate(today) };
    }

    case 'lastMonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(startOfLastMonth), endDate: formatDate(endOfLastMonth) };
    }

    case 'thisQuarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      return { startDate: formatDate(startOfQuarter), endDate: formatDate(today) };
    }

    case '7d': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return { startDate: formatDate(sevenDaysAgo), endDate: formatDate(today) };
    }

    case '30d': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return { startDate: formatDate(thirtyDaysAgo), endDate: formatDate(today) };
    }

    case '90d': {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 89);
      return { startDate: formatDate(ninetyDaysAgo), endDate: formatDate(today) };
    }

    case '365d': {
      const yearAgo = new Date(today);
      yearAgo.setDate(today.getDate() - 364);
      return { startDate: formatDate(yearAgo), endDate: formatDate(today) };
    }

    default:
      return { startDate: formatDate(today), endDate: formatDate(today) };
  }
}

/**
 * 숫자 포맷 (한국식: 만, 억)
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억';
  if (num >= 10000) return (num / 10000).toFixed(0) + '만';
  return num.toLocaleString();
}
