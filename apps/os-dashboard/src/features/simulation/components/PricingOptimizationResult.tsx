import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';

// 안전한 숫자 헬퍼
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === undefined || value === null || isNaN(Number(value))) return defaultValue;
  return Number(value);
};

const safeToFixed = (value: any, digits: number = 1): string => {
  return safeNumber(value).toFixed(digits);
};

const safeToLocaleString = (value: any): string => {
  return safeNumber(value).toLocaleString();
};

// 권장사항 텍스트 추출 헬퍼
const getRecommendationText = (rec: any): string => {
  if (typeof rec === 'string') return rec;
  if (typeof rec === 'object' && rec !== null) {
    return rec.title || rec.description || rec.details || rec.message || rec.text || 
           rec.recommendation || rec.action || rec.content || JSON.stringify(rec);
  }
  return String(rec);
};

interface PricingOptimizationResultProps {
  recommendations?: any[];
  summary?: any;
  textRecommendations?: any[];
}

export function PricingOptimizationResult({ recommendations, summary, textRecommendations }: PricingOptimizationResultProps) {
  if (!recommendations || recommendations.length === 0) {
    if (!summary) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>가격 최적화 결과</CardTitle>
            <CardDescription>시뮬레이션을 실행하여 가격 최적화 방안을 확인하세요</CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  // 정규화된 summary
  const normalizedSummary = {
    totalProducts: safeNumber(summary?.totalProducts, recommendations?.length || 0),
    avgPriceChange: safeNumber(summary?.avgPriceChange),
    expectedRevenueIncrease: safeNumber(summary?.expectedRevenueIncrease || summary?.projectedRevenueIncrease),
    expectedMarginIncrease: safeNumber(summary?.expectedMarginIncrease),
    recommendedDiscounts: safeNumber(summary?.recommendedDiscounts || summary?.priceDecreases),
    recommendedIncreases: safeNumber(summary?.recommendedIncreases || summary?.priceIncreases),
  };

  // 정규화된 recommendations
  const normalizedRecs = (recommendations || []).map((rec: any, idx: number) => ({
    productSku: rec.productSku || rec.sku || `SKU-${idx + 1}`,
    productName: rec.productName || rec.name || `상품 ${idx + 1}`,
    currentPrice: safeNumber(rec.currentPrice),
    optimalPrice: safeNumber(rec.optimalPrice || rec.recommendedPrice || rec.currentPrice),
    priceChange: safeNumber(rec.priceChange),
    expectedDemandChange: safeNumber(rec.expectedDemandChange),
    expectedRevenueChange: safeNumber(rec.expectedRevenueChange),
    elasticity: safeNumber(rec.elasticity),
    strategy: rec.strategy,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>가격 최적화 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">분석 상품</p>
              <p className="text-2xl font-bold">{normalizedSummary.totalProducts}개</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 가격 변화</p>
              <p className={`text-2xl font-bold ${normalizedSummary.avgPriceChange > 0 ? 'text-green-500' : normalizedSummary.avgPriceChange < 0 ? 'text-red-500' : ''}`}>
                {normalizedSummary.avgPriceChange > 0 && '+'}
                {safeToFixed(normalizedSummary.avgPriceChange, 1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">할인 권장</p>
              <p className="text-2xl font-bold text-orange-500">{normalizedSummary.recommendedDiscounts}개</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                예상 매출 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{safeToFixed(normalizedSummary.expectedRevenueIncrease / 10000, 0)}만원/월
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Percent className="w-4 h-4" />
                예상 마진 증가
              </p>
              <p className="text-xl font-bold text-green-500">
                +{safeToFixed(normalizedSummary.expectedMarginIncrease, 1)}%p
              </p>
            </div>
          </div>

          {normalizedRecs.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">상품별 가격 변화 효과</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {normalizedRecs.map((rec, idx) => (
                  <div key={idx} className="py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{rec.productName}</p>
                      <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                        {rec.priceChange > 0 ? '인상' : rec.priceChange < 0 ? '할인' : '유지'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">가격 변화: </span>
                        <span className={rec.priceChange > 0 ? 'text-red-500' : rec.priceChange < 0 ? 'text-green-500' : ''}>
                          {rec.priceChange > 0 && '+'}
                          {safeToFixed(rec.priceChange, 1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">매출 효과: </span>
                        <span className="text-green-500">
                          +{safeToFixed(rec.expectedRevenueChange, 1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">탄력성: </span>
                        <span>{safeToFixed(Math.abs(rec.elasticity), 2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {normalizedRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>우선 적용 권장 상품</CardTitle>
            <CardDescription>가장 큰 매출 증가 효과가 예상되는 상품</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalizedRecs
                .sort((a, b) => b.expectedRevenueChange - a.expectedRevenueChange)
                .slice(0, 5)
                .map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">{rec.productName}</span>
                        <Badge variant={rec.priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                          {rec.priceChange > 0 ? '인상' : rec.priceChange < 0 ? '할인' : '유지'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">SKU: {rec.productSku}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">현재 가격: </span>
                        <span className="font-medium">{safeToLocaleString(rec.currentPrice)}원</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">권장 가격: </span>
                        <span className="font-medium text-primary">{safeToLocaleString(rec.optimalPrice)}원</span>
                      </div>
                      <div className="text-xs">
                        <span className={rec.priceChange > 0 ? 'text-red-500' : rec.priceChange < 0 ? 'text-green-500' : ''}>
                          {rec.priceChange > 0 && '+'}
                          {safeToFixed(rec.priceChange, 1)}%
                        </span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-green-500">
                          매출 +{safeToFixed(rec.expectedRevenueChange, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {textRecommendations && textRecommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">권장 액션</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {textRecommendations.map((rec: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{getRecommendationText(rec)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
