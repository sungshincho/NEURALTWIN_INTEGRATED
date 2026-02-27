/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * 3D Glassmorphism + Glow Funnel Chart + Dark Mode Support
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  UserCheck,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Box,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useCountUp } from '@/hooks/useCountUp';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';
import { useIntegratedMetrics } from '../context/InsightDataContext';

import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';
import { AIRecommendationEffectWidget } from '@/components/dashboard/AIRecommendationEffectWidget';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.04em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.1))',
  } as React.CSSProperties,
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
    textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    fontSize: '9px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontSize: '9px',
    background: 'linear-gradient(180deg, #8a8a8f 0%, #9a9a9f 50%, #7a7a7f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158', textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,
});

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
    borderRadius: '10px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
    position: 'relative', overflow: 'hidden',
  }}>
    {!dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
      borderRadius: '10px 10px 0 0', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>{children}</span>
  </div>
);

const formatCurrency = (value: number): string => `₩${value.toLocaleString()}원`;
const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const MetricCard = ({
  icon, labelEn, label, value, subLabel, change, changeUnit = '%', isDark = false,
}: {
  icon: React.ReactNode; labelEn: string; label: string; value: string;
  subLabel?: string; change?: number; changeUnit?: string; isDark?: boolean;
}) => {
  const text3D = getText3D(isDark);
  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Icon3D size={40} dark={isDark}>{icon}</Icon3D>
          <div>
            <p style={text3D.label}>{labelEn}</p>
            <p style={{ fontSize: '12px', ...text3D.body }}>{label}</p>
          </div>
        </div>
        <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{value}</p>
        {subLabel && <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{subLabel}</p>}
        {change !== undefined && (
          <div style={{ marginTop: '12px' }}>
            <Badge3D dark={isDark}>
              {change > 0 ? <TrendingUp className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                : change < 0 ? <TrendingDown className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
                : <Minus className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
              <span style={{ fontSize: '11px', fontWeight: 600,
                color: change > 0 ? '#22c55e' : change < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280')
              }}>{change > 0 ? '+' : ''}{change.toFixed(1)}{changeUnit}</span>
            </Badge3D>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// 글로우 퍼널 차트
// ============================================================================
interface FunnelChartProps {
  data: { entry: number; browse: number; engage: number; fitting: number; purchase: number };
  isDark: boolean;
}

const GlowFunnelChart = ({ data, isDark }: FunnelChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 140 });
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 140 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - start) / 800, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const stages = [
      { key: 'entry', label: 'ENTRY', value: data.entry, isAccent: true },
      { key: 'browse', label: 'BROWSE', value: data.browse, isAccent: false },
      { key: 'engage', label: 'ENGAGE', value: data.engage, isAccent: false },
      { key: 'fitting', label: 'FITTING', value: data.fitting, isAccent: false },
      { key: 'purchase', label: 'PURCHASE', value: data.purchase, isAccent: true },
    ];

    const pad = { top: 10, bottom: 50, left: 10, right: 10 };
    const barAreaHeight = height - pad.top - pad.bottom;
    const gap = (width - pad.left - pad.right) / stages.length;
    const barWidth = Math.min(50, gap * 0.7);
    const maxValue = data.entry || 1;

    stages.forEach((stage, idx) => {
      const x = pad.left + idx * gap + (gap - barWidth) / 2;
      const pct = stage.value / maxValue;
      const fullH = Math.max(pct * barAreaHeight, 8);
      const barH = fullH * progress;
      const y = pad.top + barAreaHeight - barH;

      // 바 그라데이션
      const grad = ctx.createLinearGradient(0, pad.top + barAreaHeight, 0, y);
      if (stage.isAccent) {
        if (isDark) {
          grad.addColorStop(0, 'rgba(255,255,255,0.5)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.75)');
          grad.addColorStop(1, 'rgba(255,255,255,0.9)');
        } else {
          grad.addColorStop(0, 'rgba(30,30,40,0.4)');
          grad.addColorStop(0.5, 'rgba(30,30,40,0.7)');
          grad.addColorStop(1, 'rgba(30,30,40,0.9)');
        }
      } else {
        if (isDark) {
          grad.addColorStop(0, 'rgba(255,255,255,0.08)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
          grad.addColorStop(1, 'rgba(255,255,255,0.3)');
        } else {
          grad.addColorStop(0, 'rgba(0,0,0,0.04)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
          grad.addColorStop(1, 'rgba(0,0,0,0.22)');
        }
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 2, 2]);
      ctx.fill();

      // 상단 글로우 (은은하게)
      if (barH > 5) {
        const gx = x + barWidth / 2, gy = y;
        const gc = isDark ? '255,255,255' : '0,0,0';
        const intensity = stage.isAccent ? 0.35 : 0.2;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 8);
        glow.addColorStop(0, `rgba(${gc},${intensity * progress})`);
        glow.addColorStop(0.5, `rgba(${gc},${intensity * 0.3 * progress})`);
        glow.addColorStop(1, `rgba(${gc},0)`);
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 중심 점
        ctx.beginPath();
        ctx.arc(gx, gy, 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${(stage.isAccent ? 0.9 : 0.5) * progress})`
          : `rgba(0,0,0,${(stage.isAccent ? 0.8 : 0.4) * progress})`;
        ctx.fill();
      }

      // 라벨
      const labelY = pad.top + barAreaHeight + 14;
      ctx.font = '600 9px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(stage.label, x + barWidth / 2, labelY);

      // 값
      ctx.font = '700 12px system-ui';
      ctx.fillStyle = isDark ? '#ffffff' : '#0a0a0c';
      ctx.fillText(Math.round(stage.value * progress).toLocaleString(), x + barWidth / 2, labelY + 14);

      // 비율
      const rate = ((stage.value / maxValue) * 100).toFixed(1);
      ctx.font = '500 10px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
      ctx.fillText(`(${rate}%)`, x + barWidth / 2, labelY + 28);
    });
  }, [data, isDark, dimensions, progress]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height }} />
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function OverviewTab() {
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { data: metrics, isLoading } = useIntegratedMetrics();
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  const topRecommendations = recommendations?.slice(0, 2) || [];

  // KPI 카운트업 애니메이션
  const animatedFootfall = useCountUp(metrics?.footfall || 0, { duration: 1500, enabled: !isLoading });
  const animatedUniqueVisitors = useCountUp(metrics?.uniqueVisitors || 0, { duration: 1500, enabled: !isLoading });
  const animatedRevenue = useCountUp(metrics?.revenue || 0, { duration: 1500, enabled: !isLoading });
  const animatedConversionRate = useCountUp(metrics?.conversionRate || 0, { duration: 1500, decimals: 1, enabled: !isLoading });
  const animatedTransactions = useCountUp(metrics?.transactions || 0, { duration: 1500, enabled: !isLoading });
  const animatedAtv = useCountUp(metrics?.atv || 0, { duration: 1500, enabled: !isLoading });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 rounded-3xl bg-white/50 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div id="overview-kpi-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="FOOTFALL" label="총 입장"
          value={animatedFootfall.toLocaleString()}
          subLabel="기간 내 총 입장 횟수"
          change={metrics?.changes.footfall} isDark={isDark}
        />
        <MetricCard
          icon={<UserCheck className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="UNIQUE VISITORS" label="순 방문객"
          value={animatedUniqueVisitors.toLocaleString()}
          subLabel={metrics?.visitFrequency ? `평균 ${metrics.visitFrequency.toFixed(1)}회 방문` : undefined}
          change={metrics?.changes.uniqueVisitors} isDark={isDark}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="REVENUE" label="총 매출"
          value={formatCurrency(animatedRevenue)}
          subLabel={metrics?.atv ? `객단가 ${formatCurrency(animatedAtv)}` : undefined}
          change={metrics?.changes.revenue} isDark={isDark}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" style={{ color: iconColor }} />}
          labelEn="CONVERSION" label="구매 전환율"
          value={formatPercent(animatedConversionRate)}
          subLabel={`${animatedTransactions.toLocaleString()}건 거래`}
          change={metrics?.changes.conversionRate} changeUnit="%p" isDark={isDark}
        />
      </div>

      {/* 방문 빈도 안내 */}
      {(metrics?.visitFrequency ?? 0) > 1 && (
        <div className={cn("p-3 rounded-lg flex items-start gap-2",
          isDark ? "bg-white/5 border border-white/10" : "bg-black/[0.02] border border-black/5"
        )}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p className={cn("text-sm", isDark ? "text-white/70" : "text-muted-foreground")}>
            <span className={cn("font-medium", isDark ? "text-white" : "text-foreground")}>
              평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:
            </span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

      {/* 고객 여정 퍼널 */}
      {metrics?.funnel && (
        <div id="overview-funnel">
        <GlassCard dark={isDark}>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>고객 여정 퍼널</h3>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>
                방문 빈도 {metrics?.visitFrequency?.toFixed(1) || '0'}회
              </p>
            </div>

            <GlowFunnelChart data={metrics.funnel} isDark={isDark} />

            {/* Drop-off Alert - 동적 계산 */}
            {(() => {
              // 퍼널 단계별 이탈률 계산
              const funnel = metrics.funnel;
              const stages = [
                { from: '입장', to: '탐색', dropoff: funnel.entry > 0 ? ((funnel.entry - funnel.browse) / funnel.entry) * 100 : 0 },
                { from: '탐색', to: '관심', dropoff: funnel.browse > 0 ? ((funnel.browse - funnel.engage) / funnel.browse) * 100 : 0 },
                { from: '관심', to: '피팅', dropoff: funnel.engage > 0 ? ((funnel.engage - funnel.fitting) / funnel.engage) * 100 : 0 },
                { from: '피팅', to: '구매', dropoff: funnel.fitting > 0 ? ((funnel.fitting - funnel.purchase) / funnel.fitting) * 100 : 0 },
              ];
              const maxDropoff = stages.reduce((max, stage) => stage.dropoff > max.dropoff ? stage : max, stages[0]);

              return (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px', marginTop: '16px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: '12px' }}>!</span>
                  </div>
                  <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : '#515158' }}>
                    최대 이탈 구간: {maxDropoff.from} → {maxDropoff.to} ({maxDropoff.dropoff.toFixed(1)}%)
                  </span>
                </div>
              );
            })()}

            {/* Final Conversion */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <span style={{ fontSize: '12px', ...text3D.body }}>최종 구매 전환율</span>
              <span style={{ fontSize: '24px', marginLeft: '12px', ...text3D.heroNumber }}>
                {metrics.funnel.entry > 0
                  ? ((metrics.funnel.purchase / metrics.funnel.entry) * 100).toFixed(1)
                  : '0'}%
              </span>
            </div>
          </div>
        </GlassCard>
        </div>
      )}

      {/* 목표 달성률 & AI 추천 효과 */}
      <div id="overview-goals" className="grid gap-6 lg:grid-cols-2">
        <GoalProgressWidget />
        <AIRecommendationEffectWidget />
      </div>

      {/* 오늘의 AI 인사이트 */}
      <div id="overview-insights">
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Icon3D size={40} dark={isDark}>
              <Lightbulb className="h-5 w-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>오늘의 AI 인사이트</h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>
                AI가 분석한 주요 인사이트와 추천 액션
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {topRecommendations.length > 0 ? (
              topRecommendations.map((rec) => (
                <div key={rec.id} style={{
                  padding: '16px', borderRadius: '16px',
                  borderLeft: isDark ? '4px solid rgba(255,255,255,0.3)' : '4px solid rgba(0,0,0,0.2)',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                          color: isDark ? 'rgba(255,255,255,0.8)' : '#374151',
                        }}>
                          {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                        <span style={{ fontWeight: 600, color: isDark ? '#ffffff' : '#1a1a1f' }}>{rec.title}</span>
                      </div>
                      <p style={{ fontSize: '13px', ...text3D.body }}>{rec.description}</p>
                      {rec.expected_impact && (
                        <p style={{ fontSize: '13px', marginTop: '8px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>
                          예상 효과: 매출 +{rec.expected_impact.revenue_increase?.toLocaleString() || '?'}원
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* M-4: 분석 버튼 핸들러 구현 - AI 예측 탭으로 이동 */}
                      <button
                        onClick={() => navigate('/insights?tab=prediction')}
                        style={{
                        padding: '8px 12px', borderRadius: '8px',
                        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                        background: 'transparent', fontSize: '12px', fontWeight: 500,
                        color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <BarChart3 className="h-3 w-3" />분석
                      </button>
                      <button onClick={() => navigate('/studio')} style={{
                        padding: '8px 12px', borderRadius: '8px',
                        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                        background: 'transparent', fontSize: '12px', fontWeight: 500,
                        color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <Box className="h-3 w-3" />3D
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lightbulb className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
                </div>
                <p style={{ fontSize: '14px', ...text3D.body }}>AI 인사이트가 없습니다</p>
                <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                  데이터가 축적되면 AI가 인사이트를 생성합니다
                </p>
              </div>
            )}

            {topRecommendations.length > 0 && (
              <button onClick={() => navigate('/insights?tab=ai')} style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                fontSize: '13px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                모든 AI 추천 보기
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>
      </div>
    </div>
  );
}
