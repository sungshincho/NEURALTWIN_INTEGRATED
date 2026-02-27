/**
 * ROI 요약 KPI 카드 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, CheckCircle, TrendingUp, Banknote } from 'lucide-react';
import type { ROISummary } from '../types/roi.types';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.04em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: '#6b7280',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#6b7280',
  } as React.CSSProperties,
});

interface ROISummaryCardsProps {
  data: ROISummary | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 100000000) {
    return `₩${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000000) {
    return `₩${(value / 10000000).toFixed(1)}천만`;
  }
  if (value >= 1000000) {
    return `₩${(value / 1000000).toFixed(1)}M`;
  }
  return `₩${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(0)}%`;
};

export const ROISummaryCards: React.FC<ROISummaryCardsProps> = ({ data, isLoading }) => {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i} dark={isDark}>
            <div style={{ padding: '20px' }}>
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '12px', width: '60px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
                  <div style={{ height: '36px', width: '36px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
                </div>
                <div style={{ height: '28px', width: '80px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
                <div style={{ height: '10px', width: '100px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  const cards = [
    {
      labelEn: 'TOTAL APPLIED',
      label: '총 적용',
      value: `${data?.totalApplied || 0}건`,
      subLabel: `진행 중 ${data?.activeCount || 0}건`,
      icon: BarChart3,
    },
    {
      labelEn: 'SUCCESS RATE',
      label: '성공률',
      value: formatPercent(data?.successRate || 0),
      subLabel: `(${data?.successCount || 0}/${data?.totalApplied || 0})`,
      icon: CheckCircle,
    },
    {
      labelEn: 'AVG ROI',
      label: '평균 ROI',
      value: formatPercent(data?.averageRoi || 0),
      subLabel: data?.averageRoi ? '전략 적용 기준' : '-',
      icon: TrendingUp,
    },
    {
      labelEn: 'REVENUE IMPACT',
      label: '총 추가매출',
      value: formatCurrency(data?.totalRevenueImpact || 0),
      subLabel:
        data?.revenueChangePercent !== undefined
          ? `${data.revenueChangePercent > 0 ? '+' : ''}${data.revenueChangePercent}% 전월`
          : '추적 중',
      icon: Banknote,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <GlassCard key={card.label} dark={isDark}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Icon3D size={40} dark={isDark}>
                <card.icon className="w-4 h-4" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={{ margin: 0, ...text3D.label }}>{card.labelEn}</p>
                <p style={{ fontSize: '12px', margin: 0, ...text3D.body }}>{card.label}</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', margin: '0 0 4px 0', ...text3D.heroNumber }}>{card.value}</p>
            <p style={{ fontSize: '11px', margin: 0, ...text3D.body }}>{card.subLabel}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

export default ROISummaryCards;
