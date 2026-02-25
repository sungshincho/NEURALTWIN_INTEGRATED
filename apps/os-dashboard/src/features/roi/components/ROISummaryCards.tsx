/**
 * ROI 요약 KPI 카드 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, CheckCircle, TrendingUp, Banknote } from 'lucide-react';
import type { ROISummary } from '../types/roi.types';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

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

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '20px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '19px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 36, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,1)',
  }}>
    {children}
  </div>
);

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
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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
