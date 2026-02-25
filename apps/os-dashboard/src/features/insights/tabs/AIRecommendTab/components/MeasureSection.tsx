/**
 * MeasureSection.tsx
 *
 * 5단계: ROI 측정 섹션
 * - 성과 테이블
 * - ROI 트렌드 차트
 * - AI 학습 인사이트
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Lightbulb,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ROIMeasurement, ROISummary, ROIStatus } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface MeasureSectionProps {
  measurements: ROIMeasurement[];
  summary: ROISummary | null;
  isLoading?: boolean;
}

const statusConfig: Record<ROIStatus, { icon: typeof CheckCircle; className: string; label: string }> = {
  exceeded: { icon: TrendingUp, className: 'text-green-500', label: '초과 달성' },
  met: { icon: CheckCircle, className: 'text-blue-500', label: '달성' },
  missed: { icon: AlertCircle, className: 'text-red-500', label: '미달' },
  ongoing: { icon: Clock, className: 'text-yellow-500', label: '진행 중' },
};

export function MeasureSection({
  measurements,
  summary,
  isLoading,
}: MeasureSectionProps) {
  // ROI 트렌드 데이터 생성
  const trendData = useMemo(() => {
    if (!measurements.length) return [];

    return measurements
      .filter(m => m.status !== 'ongoing')
      .sort((a, b) => new Date(a.period.start).getTime() - new Date(b.period.start).getTime())
      .slice(-10)
      .map(m => ({
        date: new Date(m.period.start).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        expectedROI: m.expectedROI,
        actualROI: m.actualROI,
        name: m.campaignName,
      }));
  }, [measurements]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
          5
        </div>
        <h3 className="text-lg font-semibold">ROI 측정 (Measure)</h3>
      </div>

      {/* 성과 테이블 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                전략 성과 요약
              </CardTitle>
              <CardDescription>최근 30일 기준</CardDescription>
            </div>
            {summary && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">평균 ROI</p>
                <p className={cn(
                  'text-xl font-bold',
                  summary.averageROI >= 100 ? 'text-green-500' : 'text-yellow-500'
                )}>
                  {summary.averageROI.toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : measurements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">전략</th>
                    <th className="text-left py-3 px-2 font-medium">유형</th>
                    <th className="text-left py-3 px-2 font-medium">기간</th>
                    <th className="text-right py-3 px-2 font-medium">예상 ROI</th>
                    <th className="text-right py-3 px-2 font-medium">실제 ROI</th>
                    <th className="text-center py-3 px-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.slice(0, 10).map((m) => {
                    const status = statusConfig[m.status];
                    const StatusIcon = status.icon;

                    return (
                      <tr key={m.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium truncate max-w-[150px]">
                          {m.campaignName}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {m.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">
                          {m.period.days}일
                        </td>
                        <td className="py-3 px-2 text-right">
                          {m.expectedROI}%
                        </td>
                        <td className={cn(
                          'py-3 px-2 text-right font-medium',
                          m.actualROI >= m.expectedROI ? 'text-green-500' : 'text-red-500'
                        )}>
                          {m.actualROI}%
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <StatusIcon className={cn('w-4 h-4', status.className)} />
                            <span className={cn('text-xs', status.className)}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>측정된 성과가 없습니다</p>
              <p className="text-sm mt-1">전략을 실행하면 7일 후 자동으로 ROI가 측정됩니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROI 트렌드 차트 */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              성과 트렌드
            </CardTitle>
            <CardDescription>시간별 ROI 변화 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'expectedROI' ? '예상 ROI' : '실제 ROI'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="expectedROI"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="expectedROI"
                />
                <Line
                  type="monotone"
                  dataKey="actualROI"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="actualROI"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI 학습 인사이트 */}
      {summary && summary.learnings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              AI 학습 인사이트
            </CardTitle>
            <CardDescription>과거 성과 데이터 기반 학습 결과</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.learnings.map((learning) => (
              <div
                key={learning.id}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{learning.insight}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>데이터 포인트: {learning.dataPoints}개</span>
                    <span>신뢰도: {learning.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 요약 통계 */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">총 캠페인</p>
            <p className="text-2xl font-bold">{summary.totalCampaigns}개</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">성공률</p>
            <p className={cn(
              'text-2xl font-bold',
              summary.successRate >= 70 ? 'text-green-500' : 'text-yellow-500'
            )}>
              {summary.successRate.toFixed(0)}%
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">총 매출 영향</p>
            <p className={cn(
              'text-2xl font-bold',
              summary.totalRevenueImpact >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {summary.totalRevenueImpact >= 0 ? '+' : ''}
              {formatCurrency(summary.totalRevenueImpact)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">최고 성과 유형</p>
            <p className="text-xl font-bold">{summary.topPerformingType}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
