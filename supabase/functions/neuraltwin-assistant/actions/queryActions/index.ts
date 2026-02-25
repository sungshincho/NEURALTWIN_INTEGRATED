/**
 * queryActions 디스패처
 * handleQueryKpi switch → 탭별 모듈로 라우팅
 */

import { QueryActionResult, PageContext, ClassificationResult, SupabaseClient } from './types.ts';
import { createNavigationActions, getTabDisplayName, getDateRange, getDisambiguationInfo, createGenericNavigationResult } from './commonHelpers.ts';

// 탭별 쿼리 모듈
import { queryRevenue, queryVisitors, queryConversion, queryAvgTransaction, querySummary, queryFootfall, queryVisitFrequency, queryFunnel, queryGoal } from './overviewQueries.ts';
import { queryStoreSummary, queryPeakTime, queryPopularZone, queryTrackingCoverage, queryHourlyPattern, queryZoneAnalysis, queryZonePerformance, queryStoreDwell } from './storeQueries.ts';
import { queryNewVsReturning, queryRepeatRate, queryCustomerSegment, queryLoyalCustomers, querySegmentAvgPurchase, querySegmentVisitFrequency, querySegmentDetail } from './customerQueries.ts';
import { queryProduct, queryBestSeller, queryTopProducts, queryCategoryAnalysis, queryUnitsSold } from './productQueries.ts';
import { queryInventory, queryOverstock, queryStockAlert, queryStockMovement, queryStockDistribution, queryHealthyStock, queryInventoryCategory, queryInventoryDetail } from './inventoryQueries.ts';
import { queryROISummary, queryAppliedStrategies, queryROICategoryPerformance, handleFilterStrategies, handleExportStrategies, handleRoiTablePage } from './roiQueries.ts';
import { queryDataQuality, queryDataSources, queryContextDataSources, queryPipelineStatus, queryApiConnections, queryImportHistory } from './controlTowerQueries.ts';
import { handlePredictionNavigation, handleAIRecommendationNavigation } from './navigationOnlyQueries.ts';

/**
 * query_kpi 인텐트 처리 (컨텍스트 인식 버전)
 */
export async function handleQueryKpi(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string,
  pageContext?: PageContext,
  orgId?: string
): Promise<QueryActionResult> {
  const queryType = classification.entities.queryType || 'summary';

  // ROI 쿼리는 기본 기간을 90일로 설정 (프론트엔드 ROI 페이지 기본값과 통일)
  const ROI_QUERY_TYPES = ['roiSummary', 'appliedStrategies', 'categoryPerformance', 'roiInsight'];
  const defaultPeriod = ROI_QUERY_TYPES.includes(queryType) ? { type: '90d' } : { type: 'today' };
  const period = classification.entities.period || defaultPeriod;

  try {
    const dateRange = getDateRange(period);

    // 중복 위치 용어 체크 (disambiguation)
    const disambiguationInfo = getDisambiguationInfo(queryType, pageContext);

    let result: QueryActionResult;

    switch (queryType) {
      // 개요(Overview) 탭 — get_overview_kpis RPC 사용
      case 'revenue':
        result = await queryRevenue(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'conversion':
        result = await queryConversion(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'avgTransaction':
        result = await queryAvgTransaction(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'footfall':
        result = await queryFootfall(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'visitFrequency':
        result = await queryVisitFrequency(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'funnel':
        result = await queryFunnel(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'goal':
        result = await queryGoal(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'aiEffect':
      case 'dailyInsight':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // 매장(Store) 탭 — get_zone_metrics RPC 사용 (존 관련)
      case 'storeSummary':
        result = await queryStoreSummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'peakTime':
        result = await queryPeakTime(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'popularZone':
        result = await queryPopularZone(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'trackingCoverage':
        result = await queryTrackingCoverage(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'hourlyPattern':
        result = await queryHourlyPattern(supabase, storeId, dateRange, pageContext, classification.entities.hour, orgId);
        break;
      case 'zoneAnalysis':
        result = await queryZoneAnalysis(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter, classification.entities.responseHint);
        break;
      case 'zonePerformance':
        result = await queryZonePerformance(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'storeDwell':
        result = await queryStoreDwell(supabase, storeId, dateRange, pageContext, orgId);
        break;

      // 고객(Customer) 탭 — get_overview_kpis / get_customer_segments RPC 사용
      case 'visitors':
        result = await queryVisitors(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'dwellTime':
        // 고객탭에 체류시간 KPI가 없으므로 storeDwell로 통합
        result = await queryStoreDwell(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'newVsReturning':
        result = await queryNewVsReturning(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'repeatRate':
        result = await queryRepeatRate(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'customerSegment':
        result = await queryCustomerSegment(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter, classification.entities.responseHint);
        break;
      case 'loyalCustomers':
        result = await queryLoyalCustomers(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'segmentAvgPurchase':
        result = await querySegmentAvgPurchase(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'segmentVisitFrequency':
        result = await querySegmentVisitFrequency(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'segmentDetail':
        result = await querySegmentDetail(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'returnTrend':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // 상품(Product) 탭 — get_product_performance RPC 사용
      case 'product':
        result = await queryProduct(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'bestSeller':
        result = await queryBestSeller(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'topProducts':
        result = await queryTopProducts(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'categoryAnalysis':
        result = await queryCategoryAnalysis(supabase, storeId, dateRange, pageContext, orgId, classification.entities.responseHint, classification.entities.itemFilter);
        break;
      case 'unitsSold':
        result = await queryUnitsSold(supabase, storeId, dateRange, pageContext, orgId);
        break;

      // 재고(Inventory) 탭
      case 'inventory':
        result = await queryInventory(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter, classification.entities.responseHint);
        break;
      case 'overstock':
        result = await queryOverstock(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'stockAlert':
        result = await queryStockAlert(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'stockMovement':
        result = await queryStockMovement(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'stockDistribution':
        result = await queryStockDistribution(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'healthyStock':
        result = await queryHealthyStock(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'inventoryCategory':
        result = await queryInventoryCategory(supabase, storeId, dateRange, pageContext, orgId, classification.entities.itemFilter);
        break;
      case 'inventoryDetail':
        result = await queryInventoryDetail(supabase, storeId, dateRange, pageContext, orgId);
        break;

      // 예측(Prediction) 탭 — 탭 네비게이션만 수행
      case 'predictionRevenue':
      case 'predictionVisitors':
      case 'predictionConversion':
      case 'predictionSummary':
      case 'predictionConfidence':
      case 'predictionDaily':
      case 'predictionModel':
        result = handlePredictionNavigation(queryType, dateRange, pageContext);
        break;

      // AI추천(AI Recommendation) 탭 — 탭 네비게이션만 수행
      case 'activeStrategies':
      case 'strategyRecommendation':
      case 'priceOptimization':
      case 'inventoryOptimization':
      case 'demandForecast':
      case 'seasonTrend':
      case 'riskPrediction':
      case 'campaignStatus':
        result = handleAIRecommendationNavigation(queryType, dateRange, pageContext);
        break;

      // 데이터 컨트롤타워 — org_id 필터 추가
      case 'dataQuality':
        result = await queryDataQuality(supabase, storeId, pageContext);
        break;
      case 'dataSources':
        result = await queryDataSources(supabase, storeId, pageContext);
        break;
      case 'contextDataSources':
        result = await queryContextDataSources(supabase, storeId, pageContext, orgId);
        break;
      case 'apiConnections':
        result = await queryApiConnections(supabase, storeId, pageContext, orgId);
        break;
      case 'importHistory':
        result = await queryImportHistory(supabase, storeId, pageContext, orgId);
        break;
      case 'pipelineStatus':
        result = await queryPipelineStatus(supabase, storeId, pageContext);
        break;

      // ROI 측정 — org_id 필터 추가
      case 'roiSummary':
        result = await queryROISummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'appliedStrategies':
        result = await queryAppliedStrategies(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'categoryPerformance':
        result = await queryROICategoryPerformance(supabase, storeId, dateRange, pageContext, orgId);
        break;
      case 'roiInsight':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      // ROI 테이블 제어
      case 'filterStrategies':
        result = handleFilterStrategies(classification, pageContext);
        break;
      case 'exportStrategies':
        result = handleExportStrategies(pageContext);
        break;
      case 'roiTablePage':
        result = handleRoiTablePage(classification, pageContext);
        break;

      // 설정 & 관리
      case 'storeManagement':
      case 'userManagement':
      case 'subscriptionInfo':
      case 'systemSettings':
      case 'dataSettings':
        result = createGenericNavigationResult(queryType, dateRange, pageContext);
        break;

      case 'summary':
      default:
        result = await querySummary(supabase, storeId, dateRange, pageContext, orgId);
        break;
    }

    // 중복 위치 용어인 경우 → 다른 탭 안내 메시지 추가
    if (disambiguationInfo && disambiguationInfo.extraMessage) {
      result.message += disambiguationInfo.extraMessage;
      // 다른 탭으로의 제안도 추가
      const altSuggestions = disambiguationInfo.alternativeTabs.map(tab =>
        `${getTabDisplayName(tab)} 탭에서 보기`
      );
      result.suggestions = [...result.suggestions, ...altSuggestions].slice(0, 4);
    }

    return result;

  } catch (error) {
    console.error('[queryActions] Error:', error);
    return {
      actions: [],
      message: '데이터 조회 중 문제가 발생했어요.',
      suggestions: ['다시 시도해줘', '인사이트 허브에서 확인하기'],
    };
  }
}

// Re-export types for external consumers
export type { QueryActionResult, PageContext } from './types.ts';
