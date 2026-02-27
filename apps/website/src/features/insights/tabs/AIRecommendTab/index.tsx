/**
 * AIRecommendTab/index.tsx
 *
 * AI 의사결정 허브
 * 예측 → 최적화 → 추천 → 실행 → 측정 루프
 *
 * 🤖 실제 AI 사용: Gemini 2.5 Flash via retail-ai-inference Edge Function
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import {
  useDemandForecast,
  useRiskPrediction,
  useOptimizationSuggestions,
  useSeasonTrend,
} from '@/hooks/useRetailAI';

import {
  ActiveStrategies,
  PredictSection,
  OptimizeSection,
  RecommendSection,
  ExecuteSection,
} from './components';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';

import type {
  DemandForecast,
  SeasonTrend,
  RiskPrediction,
  PriceOptimization,
  InventoryOptimization,
  StrategyRecommendation,
  Campaign,
  ActiveStrategy,
} from './types/aiDecision.types';
import type { SourceModule } from '@/features/roi/types/roi.types';

export function AIDecisionHub() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { data: aiRecommendations = [], isLoading: isLoadingRecs } = useAIRecommendations(selectedStore?.id);

  // 🤖 실제 AI 훅 사용 - retail-ai-inference Edge Function 호출
  const { data: demandData, isLoading: isLoadingDemand } = useDemandForecast(selectedStore?.id, { days: 60, forecastDays: 7 });
  const { data: riskData, isLoading: isLoadingRisk } = useRiskPrediction(selectedStore?.id);
  const { data: optimizationData, isLoading: isLoadingOptimization } = useOptimizationSuggestions(selectedStore?.id);
  const { data: seasonData, isLoading: isLoadingSeason } = useSeasonTrend(selectedStore?.id);

  // AI 예측 데이터 변환 (실제 AI 결과 사용)
  const demandForecast: DemandForecast | null = useMemo(() => {
    if (!demandData) return null;
    return {
      period: demandData.period || '7d',
      predictedRevenue: demandData.predictedRevenue || 0,
      predictedVisitors: demandData.predictedVisitors || 0,
      confidence: demandData.confidence || 75,
      trend: demandData.trend || 'stable',
      percentChange: demandData.percentChange || 0,
    };
  }, [demandData]);

  const visitorForecast: DemandForecast | null = useMemo(() => {
    if (!demandData) return null;
    return {
      period: demandData.period || '7d',
      predictedRevenue: demandData.predictedRevenue || 0,
      predictedVisitors: demandData.predictedVisitors || 0,
      confidence: demandData.confidence ? demandData.confidence - 3 : 72,
      trend: demandData.trend || 'stable',
      percentChange: demandData.percentChange ? demandData.percentChange * 0.8 : 0,
    };
  }, [demandData]);

  const seasonTrend: SeasonTrend | null = useMemo(() => {
    if (!seasonData) return null;
    return {
      currentSeason: seasonData.currentSeason,
      peakPeriod: seasonData.peakPeriod,
      expectedImpact: seasonData.expectedImpact,
      recommendations: seasonData.recommendations,
    };
  }, [seasonData]);

  const riskPredictions: RiskPrediction[] = useMemo(() => {
    if (!riskData) return [];
    return riskData.map(risk => ({
      id: risk.id,
      type: risk.type,
      severity: risk.severity,
      productName: risk.productName,
      description: risk.description,
      probability: risk.probability,
      mitigationActions: risk.mitigationActions,
    }));
  }, [riskData]);

  // AI 최적화 데이터 변환 (실제 AI 결과 사용)
  const priceOptimization: PriceOptimization | null = useMemo(() => {
    if (!optimizationData?.priceOptimization) return null;
    const opt = optimizationData.priceOptimization;
    return {
      totalProducts: opt.totalProducts || 0,
      optimizableCount: opt.optimizableCount || 0,
      potentialRevenueIncrease: opt.potentialRevenueIncrease || 0,
      potentialRevenueIncreasePercent: opt.potentialRevenueIncreasePercent || 0,
      actions: opt.actions || [],
    };
  }, [optimizationData]);

  const inventoryOptimization: InventoryOptimization | null = useMemo(() => {
    if (!optimizationData?.inventoryOptimization) return null;
    const opt = optimizationData.inventoryOptimization;
    return {
      totalItems: opt.totalItems || 0,
      orderRecommendations: opt.orderRecommendations || 0,
      stockoutPrevention: opt.stockoutPrevention || 0,
      overStockReduction: opt.overStockReduction || 0,
      actions: opt.actions || [],
    };
  }, [optimizationData]);

  // 통합 로딩 상태
  const isPredictLoading = isLoadingDemand || isLoadingRisk || isLoadingSeason;
  const isOptimizeLoading = isLoadingOptimization;

  // 추천 전략 데이터 변환
  const strategyRecommendations: StrategyRecommendation[] = useMemo(() => {
    return aiRecommendations.slice(0, 3).map((rec, index) => ({
      id: rec.id,
      rank: (index + 1) as 1 | 2 | 3,
      title: rec.title,
      description: rec.description,
      type: 'discount' as const,
      confidence: rec.priority === 'high' ? 94 : rec.priority === 'medium' ? 87 : 75,
      targetAudience: '전체 고객',
      duration: 7,
      expectedResults: {
        revenueIncrease: rec.expected_impact?.revenue_increase || 0,
        conversionIncrease: 2.1,
        roi: rec.priority === 'high' ? 312 : rec.priority === 'medium' ? 187 : 120,
      },
      status: rec.status === 'pending' ? 'recommended' as const : rec.status as any,
    }));
  }, [aiRecommendations]);

  // 진행 중인 전략 (mock)
  const activeStrategies: ActiveStrategy[] = useMemo(() => [
    {
      id: '1',
      name: '겨울 패딩 10% 할인',
      type: 'discount',
      status: 'active',
      startDate: '2024-12-07',
      endDate: '2024-12-14',
      daysActive: 3,
      expectedROI: 245,
      currentROI: 198,
      progress: 43,
      trend: 'up' as const,
    },
    {
      id: '2',
      name: '재고 발주 최적화',
      type: 'bundle',
      status: 'active',
      startDate: '2024-12-09',
      endDate: '2024-12-16',
      daysActive: 1,
      expectedROI: 150,
      currentROI: 145,
      progress: 14,
      trend: 'stable' as const,
    },
  ], []);

  // 실행 중인 캠페인 (mock)
  const campaigns: Campaign[] = useMemo(() => [
    {
      id: '1',
      strategyId: 's1',
      name: '겨울 패딩 10% 할인',
      description: '시즌 패딩 전 품목 10% 할인',
      type: 'discount',
      startDate: '2024-12-07',
      endDate: '2024-12-14',
      status: 'active',
      progress: 43,
      expectedROI: 245,
      currentROI: 198,
      metrics: {
        revenue: 4200000,
        conversions: 85,
        reach: 1200,
      },
    },
  ], []);

  // 적용 모달 상태
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyModalData, setApplyModalData] = useState<{
    source: '2d_simulation' | '3d_simulation';
    sourceModule: SourceModule;
    name: string;
    description: string;
    settings: Record<string, any>;
    expectedRoi: number;
    expectedRevenue?: number;
    confidence: number;
    baselineMetrics: Record<string, number>;
  } | null>(null);

  // 핸들러
  const handleViewStrategyDetails = (id: string) => {
    console.log('View strategy details:', id);
  };

  const handleCreateNewStrategy = () => {
    navigate('/insights?tab=ai');
  };

  const handleViewPredictDetails = (type: string) => {
    console.log('View predict details:', type);
  };

  const handleOptimizeDetails = (type: 'price' | 'inventory') => {
    console.log('View optimize details:', type);
  };

  const handleApplyOptimization = (type: 'price' | 'inventory') => {
    if (type === 'price' && priceOptimization) {
      setApplyModalData({
        source: '2d_simulation',
        sourceModule: 'price_optimization',
        name: `가격 최적화 (${priceOptimization.optimizableCount}개 상품)`,
        description: `${priceOptimization.optimizableCount}개 상품 가격 최적화로 ${priceOptimization.potentialRevenueIncreasePercent}% 매출 증가 예상`,
        settings: { actions: priceOptimization.actions },
        expectedRoi: Math.round(priceOptimization.potentialRevenueIncreasePercent * 10),
        expectedRevenue: priceOptimization.potentialRevenueIncrease,
        confidence: 88,
        baselineMetrics: {
          totalProducts: priceOptimization.totalProducts,
          optimizableCount: priceOptimization.optimizableCount,
        },
      });
      setShowApplyModal(true);
    } else if (type === 'inventory' && inventoryOptimization) {
      setApplyModalData({
        source: '2d_simulation',
        sourceModule: 'inventory_optimization',
        name: `재고 최적화 (${inventoryOptimization.orderRecommendations}건 발주)`,
        description: `${inventoryOptimization.stockoutPrevention}건 품절 방지, ${inventoryOptimization.overStockReduction}건 과재고 감소`,
        settings: { actions: inventoryOptimization.actions },
        expectedRoi: 120,
        confidence: 90,
        baselineMetrics: {
          totalItems: inventoryOptimization.totalItems,
          orderRecommendations: inventoryOptimization.orderRecommendations,
        },
      });
      setShowApplyModal(true);
    }
  };

  const handleSimulateStrategy = (id: string) => {
    console.log('Simulate strategy:', id);
    navigate('/studio');
  };

  const handleConfigureStrategy = (id: string) => {
    console.log('Configure strategy:', id);
  };

  const handleExecuteStrategy = async (id: string) => {
    const strategy = strategyRecommendations.find(s => s.id === id);
    if (strategy) {
      setApplyModalData({
        source: '2d_simulation',
        sourceModule: 'ai_recommendation',
        name: strategy.title,
        description: strategy.description,
        settings: { strategyId: id, type: strategy.type },
        expectedRoi: strategy.expectedResults.roi,
        expectedRevenue: strategy.expectedResults.revenueIncrease,
        confidence: strategy.confidence,
        baselineMetrics: {
          conversionIncrease: strategy.expectedResults.conversionIncrease,
        },
      });
      setShowApplyModal(true);
    }
  };

  const handlePauseCampaign = (id: string) => {
    console.log('Pause campaign:', id);
  };

  const handleResumeCampaign = (id: string) => {
    console.log('Resume campaign:', id);
  };

  const handleStopCampaign = (id: string) => {
    console.log('Stop campaign:', id);
  };

  const handleEditCampaign = (id: string) => {
    console.log('Edit campaign:', id);
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          AI 의사결정 허브
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          데이터 기반 예측 → 최적화 → 추천 → 실행
        </p>
      </div>

      {/* 진행 중인 전략 */}
      <ActiveStrategies
        strategies={activeStrategies}
        onViewDetails={handleViewStrategyDetails}
        onCreateNew={handleCreateNewStrategy}
      />

      <Separator />

      {/* 1단계: 예측 (🤖 실제 AI 사용) */}
      <PredictSection
        demandForecast={demandForecast}
        visitorForecast={visitorForecast}
        seasonTrend={seasonTrend}
        riskPredictions={riskPredictions}
        onViewDetails={handleViewPredictDetails}
        isLoading={isPredictLoading}
      />

      <Separator />

      {/* 2단계: 최적화 (🤖 실제 AI 사용) */}
      <OptimizeSection
        priceOptimization={priceOptimization}
        inventoryOptimization={inventoryOptimization}
        onViewDetails={handleOptimizeDetails}
        onApply={handleApplyOptimization}
        isLoading={isOptimizeLoading}
      />

      <Separator />

      {/* 3단계: 추천 */}
      <RecommendSection
        recommendations={strategyRecommendations}
        onSimulate={handleSimulateStrategy}
        onConfigure={handleConfigureStrategy}
        onExecute={handleExecuteStrategy}
        isLoading={isLoadingRecs}
      />

      <Separator />

      {/* 4단계: 실행 */}
      <ExecuteSection
        campaigns={campaigns}
        onPause={handlePauseCampaign}
        onResume={handleResumeCampaign}
        onStop={handleStopCampaign}
        onEdit={handleEditCampaign}
        isLoading={false}
      />

      {/* ROI 측정 - 별도 페이지로 이동 */}
      <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            적용된 전략의 ROI를 측정하고 성과를 추적하세요
          </p>
          <button
            onClick={() => navigate('/roi')}
            className="text-sm text-primary hover:underline font-medium"
          >
            ROI 측정 대시보드 바로가기 →
          </button>
        </div>
      </div>

      {/* 적용 전략 모달 */}
      {showApplyModal && applyModalData && (
        <ApplyStrategyModal
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            setApplyModalData(null);
          }}
          strategyData={applyModalData}
        />
      )}
    </div>
  );
}

export default AIDecisionHub;
