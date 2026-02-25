import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  Timer,
  TrendingUp,
  MapPin,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';

// ============== KPI Card Component ==============

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

function KPICard({ icon, label, value, subValue, trend, color = 'text-blue-500' }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={color}>{icon}</div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
            {subValue && (
              <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>
            )}
          </div>
          {trend && (
            <TrendingUp
              className={`w-4 h-4 ${
                trend === 'up'
                  ? 'text-green-500'
                  : trend === 'down'
                  ? 'text-red-500 rotate-180'
                  : 'text-gray-400'
              }`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Zone Metric Item ==============

interface ZoneMetricItemProps {
  zoneName: string;
  visitorCount: number;
  avgDwellTime: number;
  heatmapIntensity: number;
  conversionRate: number;
}

function ZoneMetricItem({
  zoneName,
  visitorCount,
  avgDwellTime,
  heatmapIntensity,
  conversionRate,
}: ZoneMetricItemProps) {
  const intensityColor = `rgb(${Math.floor(255 * heatmapIntensity)}, 100, ${Math.floor(
    255 * (1 - heatmapIntensity)
  )})`;

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{zoneName}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{visitorCount}명</span>
        <span className="text-muted-foreground">{avgDwellTime.toFixed(0)}초</span>
        <span className="text-muted-foreground">{(conversionRate * 100).toFixed(1)}%</span>
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${heatmapIntensity * 100}%`,
              backgroundColor: intensityColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============== Results Panel ==============

function ResultsPanel() {
  const { results } = useSimulationStore();

  if (!results) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          시뮬레이션 결과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded">
            <div className="text-muted-foreground">총 방문자</div>
            <div className="font-bold">{results.metrics.totalVisitors}명</div>
          </div>
          <div className="bg-muted p-2 rounded">
            <div className="text-muted-foreground">총 매출</div>
            <div className="font-bold">₩{results.metrics.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-muted p-2 rounded">
            <div className="text-muted-foreground">평균 전환율</div>
            <div className="font-bold">{(results.metrics.avgConversion * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-muted p-2 rounded">
            <div className="text-muted-foreground">피크 시간</div>
            <div className="font-bold">{results.metrics.peakHour}시</div>
          </div>
        </div>

        {/* Bottleneck Zones */}
        {results.metrics.bottleneckZones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              병목 구역
            </div>
            <div className="flex flex-wrap gap-1">
              {results.metrics.bottleneckZones.map((zone, i) => (
                <Badge key={i} variant="outline" className="text-amber-600 border-amber-300">
                  {zone}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            AI 추천
          </div>
          <ul className="space-y-2">
            {results.recommendations.map((rec, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground pl-4 border-l-2 border-yellow-300"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Main Component ==============

export function SimulationMetrics() {
  const { customers, zoneMetrics, results, status } = useSimulationStore();

  // Calculate aggregated metrics
  const totalVisitors = zoneMetrics.reduce((s, z) => s + z.visitorCount, 0);
  const totalRevenue = zoneMetrics.reduce((s, z) => s + z.revenue, 0);
  const avgDwell =
    zoneMetrics.length > 0
      ? zoneMetrics.reduce((s, z) => s + z.avgDwellTime, 0) / zoneMetrics.length
      : 0;
  const avgConversion =
    zoneMetrics.length > 0
      ? (zoneMetrics.reduce((s, z) => s + z.conversionRate, 0) / zoneMetrics.length) * 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Real-time KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label="현재 고객"
          value={customers.length}
          subValue={`누적 ${totalVisitors}명`}
          color="text-blue-500"
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5" />}
          label="누적 매출"
          value={`₩${totalRevenue.toLocaleString()}`}
          color="text-green-500"
        />
        <KPICard
          icon={<Timer className="w-5 h-5" />}
          label="평균 체류"
          value={`${avgDwell.toFixed(0)}초`}
          color="text-orange-500"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="전환율"
          value={`${avgConversion.toFixed(1)}%`}
          color="text-purple-500"
        />
      </div>

      {/* Zone Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              구역별 성과
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {zoneMetrics.length}개 구역
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
              {zoneMetrics.length > 0 ? (
                zoneMetrics.map((zone) => (
                  <ZoneMetricItem
                    key={zone.zoneId}
                    zoneName={zone.zoneName}
                    visitorCount={zone.visitorCount}
                    avgDwellTime={zone.avgDwellTime}
                    heatmapIntensity={zone.heatmapIntensity}
                    conversionRate={zone.conversionRate}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {status === 'stopped'
                    ? '시뮬레이션을 시작하면 구역별 데이터가 표시됩니다'
                    : '데이터를 수집 중입니다...'}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Customer Behavior Distribution */}
      {customers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">고객 행동 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default" className="bg-blue-500">
                탐색: {customers.filter((c) => c.behavior === 'browsing').length}명
              </Badge>
              <Badge variant="default" className="bg-green-500">
                이동: {customers.filter((c) => c.behavior === 'walking').length}명
              </Badge>
              <Badge variant="default" className="bg-yellow-500">
                구매: {customers.filter((c) => c.behavior === 'purchasing').length}명
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation Results */}
      {status === 'completed' && results && <ResultsPanel />}
    </div>
  );
}

export default SimulationMetrics;
