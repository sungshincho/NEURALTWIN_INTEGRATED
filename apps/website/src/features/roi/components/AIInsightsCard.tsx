/**
 * AI 인사이트 카드 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useCategoryPerformanceGrouped } from '../hooks/useCategoryPerformance';
import { useROISummary } from '../hooks/useROISummary';
import { getModuleDisplayName } from '../utils/moduleConfig';
import type { DateRange, CategoryPerformance } from '../types/roi.types';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.7)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

interface AIInsightsCardProps {
  dateRange: DateRange;
}

// 인사이트 생성 로직
const generateInsights = (
  summary: { averageRoi: number; successRate: number; totalApplied: number } | undefined,
  categoryData: { '2d': CategoryPerformance[]; '3d': CategoryPerformance[] }
): {
  analysis: string[];
  recommendations: string[];
} => {
  const analysis: string[] = [];
  const recommendations: string[] = [];

  if (!summary || summary.totalApplied === 0) {
    return {
      analysis: ['아직 적용된 전략이 없습니다.'],
      recommendations: ['인사이트 허브나 디지털트윈 스튜디오에서 첫 번째 전략을 적용해보세요.'],
    };
  }

  const allCategories = [...categoryData['2d'], ...categoryData['3d']].filter(
    (c) => c.appliedCount > 0
  );

  if (allCategories.length === 0) {
    return {
      analysis: ['적용된 전략 데이터를 분석 중입니다.'],
      recommendations: ['더 많은 데이터가 쌓이면 정확한 인사이트를 제공할 수 있습니다.'],
    };
  }

  const bestROI = allCategories.reduce((best, curr) =>
    curr.averageRoi > best.averageRoi ? curr : best
  );

  const categoriesWithEnoughData = allCategories.filter((c) => c.appliedCount >= 2);
  const bestSuccessRate = categoriesWithEnoughData.length > 0
    ? categoriesWithEnoughData.reduce((best, curr) => {
        const currRate = curr.successCount / curr.appliedCount;
        const bestRate = best.successCount / best.appliedCount;
        return currRate > bestRate ? curr : best;
      })
    : null;

  const lowROI = allCategories.filter((c) => c.averageRoi < 100 && c.appliedCount > 0);

  if (bestROI.averageRoi > 0) {
    analysis.push(
      `"${getModuleDisplayName(bestROI.sourceModule)}" 전략이 가장 높은 평균 ROI (${bestROI.averageRoi.toFixed(0)}%)를 기록했습니다.`
    );
  }

  if (bestSuccessRate && bestSuccessRate.appliedCount > 0) {
    const rate = ((bestSuccessRate.successCount / bestSuccessRate.appliedCount) * 100).toFixed(1);
    analysis.push(
      `"${getModuleDisplayName(bestSuccessRate.sourceModule)}" 성공률이 ${rate}%로 가장 안정적입니다.`
    );
  }

  if (lowROI.length > 0) {
    const lowROINames = lowROI.map((c) => `"${getModuleDisplayName(c.sourceModule)}"`).join(', ');
    analysis.push(`${lowROINames}은 예상 대비 실제 ROI 차이가 있어 개선이 필요합니다.`);
  }

  if (bestROI.averageRoi >= 200 && bestSuccessRate) {
    recommendations.push(
      `${getModuleDisplayName(bestROI.sourceModule)} + ${getModuleDisplayName(bestSuccessRate.sourceModule)} 조합 전략을 추천합니다.`
    );
  }

  if (lowROI.length > 0) {
    recommendations.push(`${lowROI.map(c => getModuleDisplayName(c.sourceModule)).join(', ')} 적용 전 A/B 테스트를 권장합니다.`);
  }

  const currentMonth = new Date().getMonth() + 1;
  if (currentMonth === 12) {
    recommendations.push('12월 성수기: 재고 최적화와 프로모션 우선 적용을 권장합니다.');
  }

  if (recommendations.length === 0) {
    recommendations.push('더 많은 전략을 적용하여 데이터를 축적하면 정교한 추천이 가능합니다.');
  }

  return { analysis, recommendations };
};

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ dateRange }) => {
  const { data: summary, isLoading: summaryLoading } = useROISummary(dateRange);
  const { data: categoryData, isLoading: categoryLoading } = useCategoryPerformanceGrouped(dateRange);
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const isLoading = summaryLoading || categoryLoading;

  if (isLoading) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Icon3D size={24} dark={isDark}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: iconColor }} />
            </Icon3D>
            <h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>AI 인사이트</h3>
          </div>
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '14px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '100%' }} />
            <div style={{ height: '14px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', width: '75%' }} />
            <div style={{ height: '14px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', width: '85%' }} />
          </div>
        </div>
      </GlassCard>
    );
  }

  const insights = generateInsights(summary, categoryData);

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icon3D size={28} dark={isDark}>
            <Sparkles className="w-4 h-4" style={{ color: iconColor }} />
          </Icon3D>
          <h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>AI 인사이트</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 성과 분석 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icon3D size={20} dark={isDark}>
                <TrendingUp className="w-3 h-3" style={{ color: iconColor }} />
              </Icon3D>
              <h4 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>성과 분석</h4>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {insights.analysis.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', ...text3D.body }}>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af', marginTop: '2px' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 추천 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icon3D size={20} dark={isDark}>
                <Lightbulb className="w-3 h-3" style={{ color: iconColor }} />
              </Icon3D>
              <h4 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>추천</h4>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {insights.recommendations.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', ...text3D.body }}>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af', marginTop: '2px' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AIInsightsCard;
