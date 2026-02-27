/**
 * PredictSection.tsx
 *
 * 1단계: 예측 섹션
 * 3D Glassmorphism + Monochrome
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import type { DemandForecast, SeasonTrend, RiskPrediction } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

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
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
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

const Icon3D = ({ children, size = 32, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
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
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: '4px 8px',
    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: '6px', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    fontSize: '10px', fontWeight: 600,
  }}>
    {children}
  </div>
);

interface PredictSectionProps {
  demandForecast: DemandForecast | null;
  visitorForecast: DemandForecast | null;
  seasonTrend: SeasonTrend | null;
  riskPredictions: RiskPrediction[];
  onViewDetails: (type: string) => void;
  isLoading?: boolean;
}

export function PredictSection({
  demandForecast,
  visitorForecast,
  seasonTrend,
  riskPredictions,
  onViewDetails,
  isLoading,
}: PredictSectionProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const highRiskCount = riskPredictions.filter(r => r.severity === 'high').length;

  const LoadingSkeleton = () => (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ height: '32px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', width: '75%' }} />
      <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '50%' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
        }}>1</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>예측 (Predict)</h3>
      </div>

      {/* 4개 카드 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 수요 예측 */}
        <GlassCard dark={isDark}>
          <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon3D size={28} dark={isDark}>
                <TrendingUp className="h-3.5 w-3.5" style={{ color: iconColor }} />
              </Icon3D>
              <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>수요 예측</span>
            </div>
            <p style={{ fontSize: '11px', marginBottom: '12px', ...text3D.body }}>다음 7일 예상 매출</p>
            
            {isLoading ? <LoadingSkeleton /> : demandForecast ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '22px', margin: '0 0 4px 0', ...text3D.heroNumber }}>
                  {formatCurrency(demandForecast.predictedRevenue)}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                  {demandForecast.trend === 'up' ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} /> :
                   demandForecast.trend === 'down' ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> : null}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: demandForecast.percentChange > 0 ? '#22c55e' : demandForecast.percentChange < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
                    전주 대비 {demandForecast.percentChange > 0 ? '+' : ''}{demandForecast.percentChange.toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={() => onViewDetails('demand')}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', fontSize: '11px', fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <BarChart3 className="w-3 h-3" /> 상세 분석
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', ...text3D.body }}>데이터 없음</p>
            )}
          </div>
        </GlassCard>

        {/* 방문자 예측 */}
        <GlassCard dark={isDark}>
          <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon3D size={28} dark={isDark}>
                <Users className="h-3.5 w-3.5" style={{ color: iconColor }} />
              </Icon3D>
              <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>방문자 예측</span>
            </div>
            <p style={{ fontSize: '11px', marginBottom: '12px', ...text3D.body }}>다음 7일 예상 방문</p>
            
            {isLoading ? <LoadingSkeleton /> : visitorForecast ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '22px', margin: '0 0 4px 0', ...text3D.heroNumber }}>
                  {visitorForecast.predictedVisitors.toLocaleString()}명
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                  {visitorForecast.trend === 'up' ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} /> :
                   visitorForecast.trend === 'down' ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> : null}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: visitorForecast.percentChange > 0 ? '#22c55e' : visitorForecast.percentChange < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
                    전주 대비 {visitorForecast.percentChange > 0 ? '+' : ''}{visitorForecast.percentChange.toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={() => onViewDetails('visitor')}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', fontSize: '11px', fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <BarChart3 className="w-3 h-3" /> 상세 분석
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', ...text3D.body }}>데이터 없음</p>
            )}
          </div>
        </GlassCard>

        {/* 시즌 트렌드 */}
        <GlassCard dark={isDark}>
          <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon3D size={28} dark={isDark}>
                <Calendar className="h-3.5 w-3.5" style={{ color: iconColor }} />
              </Icon3D>
              <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>시즌 트렌드</span>
            </div>
            <p style={{ fontSize: '11px', marginBottom: '12px', ...text3D.body }}>계절성 분석</p>
            
            {isLoading ? <LoadingSkeleton /> : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '18px', margin: '0 0 4px 0', ...text3D.number }}>
                  {seasonTrend?.currentSeason || '12월 성수기'}
                </p>
                <p style={{ fontSize: '12px', marginBottom: '12px', ...text3D.body }}>
                  예상 피크: {seasonTrend?.peakPeriod?.start || '12/20'} - {seasonTrend?.peakPeriod?.end || '12/25'}
                </p>
                <button
                  onClick={() => onViewDetails('season')}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', fontSize: '11px', fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <BarChart3 className="w-3 h-3" /> 상세 분석
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 리스크 예측 */}
        <GlassCard dark={isDark}>
          <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon3D size={28} dark={isDark}>
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: iconColor }} />
              </Icon3D>
              <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>리스크 예측</span>
            </div>
            <p style={{ fontSize: '11px', marginBottom: '12px', ...text3D.body }}>위험 요소 모니터링</p>
            
            {isLoading ? <LoadingSkeleton /> : riskPredictions.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {highRiskCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Badge3D dark={isDark}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>높음</span>
                    </Badge3D>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{highRiskCount}건</span>
                  </div>
                )}
                <p style={{ fontSize: '12px', marginBottom: '12px', ...text3D.body }}>
                  재고 부족 위험: {riskPredictions.filter(r => r.type === 'stockout').length}품목
                </p>
                <button
                  onClick={() => onViewDetails('risk')}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', fontSize: '11px', fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <BarChart3 className="w-3 h-3" /> 상세 분석
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Badge3D dark={isDark}>
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>정상</span>
                  </Badge3D>
                </div>
                <p style={{ fontSize: '12px', marginBottom: '12px', ...text3D.body }}>현재 감지된 위험 없음</p>
                <button
                  onClick={() => onViewDetails('risk')}
                  style={{
                    marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', fontSize: '11px', fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <BarChart3 className="w-3 h-3" /> 상세 분석
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
