import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, Package, Zap } from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// 안전한 숫자 헬퍼
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === undefined || value === null || isNaN(Number(value))) return defaultValue;
  return Number(value);
};

const safeToFixed = (value: any, digits: number = 0): string => {
  return safeNumber(value).toFixed(digits);
};

// 권장사항 텍스트 추출 헬퍼 (객체면 title/description 등에서 추출)
const getRecommendationText = (rec: any): string => {
  if (typeof rec === 'string') return rec;
  if (typeof rec === 'object' && rec !== null) {
    return rec.title || rec.description || rec.details || rec.message || rec.text || 
           rec.recommendation || rec.action || rec.content || JSON.stringify(rec);
  }
  return String(rec);
};

interface DemandForecastResultProps {
  forecastData?: any;
  summary?: any;
  demandDrivers?: any[];
  topProducts?: any[];
  recommendations?: any[];
}

export function DemandForecastResult({ 
  forecastData, 
  summary, 
  demandDrivers,
  topProducts,
  recommendations 
}: DemandForecastResultProps) {
  if (!forecastData && !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>수요 예측 결과</CardTitle>
          <CardDescription>시뮬레이션을 실행하여 수요 예측 결과를 확인하세요</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const normalizedSummary = {
    avgDailyDemand: safeNumber(summary?.avgDailyDemand),
    peakDemand: safeNumber(summary?.peakDemand),
    totalForecast: safeNumber(summary?.totalForecast),
    trend: summary?.trend || 'stable',
  };

  const normalizedForecastData = {
    dates: forecastData?.dates || [],
    predictedDemand: forecastData?.predictedDemand || [],
    confidence: forecastData?.confidence || [],
    peakDays: forecastData?.peakDays || [],
    lowDays: forecastData?.lowDays || [],
  };

  const chartData = normalizedForecastData.dates.map((date: string, idx: number) => ({
    date: date ? new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`,
    demand: safeNumber(normalizedForecastData.predictedDemand[idx]),
    confidence: safeNumber(normalizedForecastData.confidence[idx]) * 100
  }));

  const getTrendBadge = (trend: string) => {
    if (trend === 'increasing') return 'default';
    if (trend === 'decreasing') return 'destructive';
    return 'secondary';
  };

  const getTrendLabel = (trend: string) => {
    if (trend === 'increasing') return '증가 추세';
    if (trend === 'decreasing') return '감소 추세';
    return '안정';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>수요 예측 요약</span>
            <Badge variant={getTrendBadge(normalizedSummary.trend)}>
              {normalizedSummary.trend === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
              {normalizedSummary.trend === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
              {getTrendLabel(normalizedSummary.trend)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 일일 수요</p>
              <p className="text-2xl font-bold">{safeToFixed(normalizedSummary.avgDailyDemand, 0)}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">최대 수요 (피크)</p>
              <p className="text-2xl font-bold">{safeToFixed(normalizedSummary.peakDemand, 0)}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">예측 기간 총계</p>
              <p className="text-2xl font-bold">{safeToFixed(normalizedSummary.totalForecast, 0)}건</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">일별 수요 예측 차트</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="demand" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {demandDrivers && demandDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              수요 영향 요인 분석
            </CardTitle>
            <CardDescription>예측된 수요에 영향을 미치는 주요 요인들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demandDrivers.map((driver: any, idx: number) => {
                const magnitude = safeNumber(driver?.magnitude);
                const isPositive = driver?.impact === 'positive' || magnitude > 0;
                const displayMagnitude = Math.abs(magnitude);
                const factor = driver?.factor || driver?.name || `요인 ${idx + 1}`;
                const explanation = driver?.explanation || driver?.description || '';
                
                return (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{factor}</span>
                      <Badge variant={isPositive ? 'default' : 'destructive'}>
                        {isPositive ? '+' : '-'}{displayMagnitude}%
                      </Badge>
                    </div>
                    {explanation && (
                      <p className="text-xs text-muted-foreground">{explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {topProducts && topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Top 10 상품별 수요 예측
            </CardTitle>
            <CardDescription>높은 수요가 예상되는 상품들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.slice(0, 10).map((product: any, idx: number) => {
                const productName = product?.name || product?.productName || `상품 ${idx + 1}`;
                const confidence = safeNumber(product?.confidence);
                const confidencePercent = confidence > 1 ? confidence : confidence * 100;
                const trend = product?.trend || 'stable';
                
                return (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{productName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product?.sku || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold">{safeNumber(product?.predictedDemand)}개</p>
                        <p className="text-xs text-muted-foreground">신뢰도 {safeToFixed(confidencePercent, 0)}%</p>
                      </div>
                      <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                        {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {trend === 'up' ? '증가' : trend === 'down' ? '감소' : '안정'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations && recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              권장 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{getRecommendationText(rec)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {normalizedForecastData.peakDays.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              수요 급증 예상일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {normalizedForecastData.peakDays.map((day: string, idx: number) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {day ? new Date(day).toLocaleDateString('ko-KR') : `Day ${idx + 1}`}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              💡 해당 날짜에 재고와 인력을 추가로 확보하는 것이 좋습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
