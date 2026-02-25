/**
 * OptimizationEffectSection.tsx
 *
 * B안: 최적화 효과 분석 섹션
 * - 마지막 최적화 정보 표시
 * - 예측 vs 실측 비교
 * - 추가 최적화 권장
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Armchair, BarChart3, RefreshCw, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ============================================================================
// 타입 정의
// ============================================================================

interface OptimizationHistory {
  id: string;
  optimization_type: 'layout' | 'staff' | 'both';
  applied_at: string;
  predicted_impact: {
    revenue_change?: number;
    efficiency_change?: number;
    coverage_change?: number;
  };
  status: 'applied' | 'partial' | 'pending';
}

interface MeasuredImpact {
  revenue_change: number;
  efficiency_change: number;
  coverage_change: number;
  data_quality: 'high' | 'medium' | 'low';
  measurement_period_days: number;
}

interface Recommendation {
  type: 'layout' | 'staff' | 'product';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

interface OptimizationEffectSectionProps {
  /** 마지막 최적화 기록 */
  lastOptimization?: OptimizationHistory | null;
  /** 측정된 실제 효과 */
  measuredImpact?: MeasuredImpact | null;
  /** 추가 최적화 권장 */
  recommendations?: Recommendation[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 상세 보기 클릭 */
  onViewHistory?: () => void;
  /** 최적화 시작 클릭 */
  onStartOptimization?: (type: 'layout' | 'staff' | 'both' | 'product') => void;
}

// ============================================================================
// 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  heroNumber: isDark
    ? { fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }
    : { fontWeight: 800, letterSpacing: '-0.04em', color: '#0a0a0c' },
  number: isDark
    ? { fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }
    : { fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c' },
  body: isDark
    ? { fontWeight: 500, color: 'rgba(255,255,255,0.6)' }
    : { fontWeight: 500, color: '#515158' },
});

const GlassCard = ({ children, dark = false, gradient = '' }: { children: React.ReactNode; dark?: boolean; gradient?: string }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div
      style={{
        borderRadius: '20px',
        padding: '1.5px',
        background: gradient || (dark
          ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)'),
        boxShadow: dark
          ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
          : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
        height: '100%',
      }}
    >
      <div
        style={{
          background: dark
            ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
            : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
          backdropFilter: 'blur(80px) saturate(200%)',
          borderRadius: '19px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function OptimizationEffectSection({
  lastOptimization,
  measuredImpact,
  recommendations = [],
  isLoading = false,
  onViewHistory,
  onStartOptimization,
}: OptimizationEffectSectionProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // 예측 vs 실측 비교
  const getPredictionAccuracy = () => {
    if (!lastOptimization?.predicted_impact || !measuredImpact) return null;

    const predictedRevenue = lastOptimization.predicted_impact.revenue_change || 0;
    const actualRevenue = measuredImpact.revenue_change;

    if (predictedRevenue === 0) return null;

    const accuracy = Math.max(0, 100 - Math.abs((actualRevenue - predictedRevenue) / predictedRevenue) * 100);
    return {
      accuracy: accuracy.toFixed(0),
      status: actualRevenue >= predictedRevenue * 0.9 ? 'success' : actualRevenue >= predictedRevenue * 0.7 ? 'partial' : 'underperform',
    };
  };

  const predictionResult = getPredictionAccuracy();

  const getOptimizationTypeLabel = (type: string) => {
    switch (type) {
      case 'layout':
        return '레이아웃 최적화';
      case 'staff':
        return '인력배치 최적화';
      case 'both':
        return '통합 최적화 (B안)';
      default:
        return '최적화';
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', width: '50%' }} />
      <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '75%' }} />
      <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '66%' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, rgba(139,92,246,0.3), rgba(6,182,212,0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: isDark ? '#fff' : '#374151',
            }}
          >
            B
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
            최적화 효과 분석
          </h3>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'linear-gradient(145deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
              color: isDark ? 'rgba(255,255,255,0.8)' : '#6b21a8',
            }}
          >
            B안 통합
          </span>
        </div>
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            style={{
              fontSize: '12px',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <BarChart3 className="w-3 h-3" />
            히스토리
          </button>
        )}
      </div>

      {isLoading ? (
        <GlassCard dark={isDark}>
          <div style={{ padding: '20px' }}>
            <LoadingSkeleton />
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 마지막 최적화 정보 */}
          <GlassCard dark={isDark}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Clock className="w-4 h-4" style={{ color: iconColor }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>마지막 최적화</span>
              </div>

              {lastOptimization ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
                        {getOptimizationTypeLabel(lastOptimization.optimization_type)}
                      </p>
                      <p style={{ fontSize: '11px', margin: '4px 0 0', ...text3D.body }}>
                        {formatDistanceToNow(new Date(lastOptimization.applied_at), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                    <CheckCircle2
                      className="w-5 h-5"
                      style={{ color: lastOptimization.status === 'applied' ? '#22c55e' : '#f59e0b' }}
                    />
                  </div>

                  {/* 예측 효과 */}
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 500, marginBottom: '8px', ...text3D.body }}>예측 효과</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {lastOptimization.predicted_impact.revenue_change !== undefined && (
                        <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>매출</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#22c55e', fontWeight: 700 }}>
                            +{lastOptimization.predicted_impact.revenue_change}%
                          </p>
                        </div>
                      )}
                      {lastOptimization.predicted_impact.efficiency_change !== undefined && (
                        <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>효율</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3b82f6', fontWeight: 700 }}>
                            +{lastOptimization.predicted_impact.efficiency_change}%
                          </p>
                        </div>
                      )}
                      {lastOptimization.predicted_impact.coverage_change !== undefined && (
                        <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>커버리지</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#8b5cf6', fontWeight: 700 }}>
                            +{lastOptimization.predicted_impact.coverage_change}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <RefreshCw className="w-8 h-8 mx-auto mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                  <p style={{ fontSize: '13px', margin: '0 0 12px', ...text3D.body }}>아직 최적화를 적용하지 않았습니다</p>
                  {onStartOptimization && (
                    <button
                      onClick={() => onStartOptimization('both')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(145deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
                        border: '1px solid rgba(139,92,246,0.3)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#6b21a8',
                        cursor: 'pointer',
                      }}
                    >
                      통합 최적화 시작
                    </button>
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* 예측 vs 실측 비교 */}
          <GlassCard dark={isDark}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BarChart3 className="w-4 h-4" style={{ color: iconColor }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>예측 vs 실측</span>
              </div>

              {measuredImpact ? (
                <>
                  {/* 정확도 표시 */}
                  {predictionResult && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        background:
                          predictionResult.status === 'success'
                            ? 'rgba(34,197,94,0.1)'
                            : predictionResult.status === 'partial'
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(239,68,68,0.1)',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '11px', margin: '0 0 4px', ...text3D.body }}>예측 정확도</p>
                        <p
                          style={{
                            fontSize: '28px',
                            margin: 0,
                            fontWeight: 800,
                            color:
                              predictionResult.status === 'success'
                                ? '#22c55e'
                                : predictionResult.status === 'partial'
                                  ? '#f59e0b'
                                  : '#ef4444',
                          }}
                        >
                          {predictionResult.accuracy}%
                        </p>
                        <p style={{ fontSize: '10px', margin: '4px 0 0', ...text3D.body }}>
                          {predictionResult.status === 'success'
                            ? '예측 목표 달성'
                            : predictionResult.status === 'partial'
                              ? '부분 달성'
                              : '추가 분석 필요'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 실측 효과 */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 500, marginBottom: '8px', ...text3D.body }}>
                      실제 효과 ({measuredImpact.measurement_period_days}일 측정)
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>매출</p>
                        <p
                          style={{
                            fontSize: '14px',
                            margin: 0,
                            color: measuredImpact.revenue_change >= 0 ? '#22c55e' : '#ef4444',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                          }}
                        >
                          {measuredImpact.revenue_change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {measuredImpact.revenue_change >= 0 ? '+' : ''}
                          {measuredImpact.revenue_change}%
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>효율</p>
                        <p
                          style={{
                            fontSize: '14px',
                            margin: 0,
                            color: measuredImpact.efficiency_change >= 0 ? '#3b82f6' : '#ef4444',
                            fontWeight: 700,
                          }}
                        >
                          {measuredImpact.efficiency_change >= 0 ? '+' : ''}
                          {measuredImpact.efficiency_change}%
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <p style={{ fontSize: '10px', margin: '0 0 2px', ...text3D.body }}>커버리지</p>
                        <p
                          style={{
                            fontSize: '14px',
                            margin: 0,
                            color: measuredImpact.coverage_change >= 0 ? '#8b5cf6' : '#ef4444',
                            fontWeight: 700,
                          }}
                        >
                          {measuredImpact.coverage_change >= 0 ? '+' : ''}
                          {measuredImpact.coverage_change}%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
                  <p style={{ fontSize: '13px', margin: 0, ...text3D.body }}>효과 측정 데이터가 아직 없습니다</p>
                  <p style={{ fontSize: '11px', margin: '4px 0 0', ...text3D.body }}>
                    최적화 적용 후 7일 이상 경과해야 측정됩니다
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* 추가 최적화 권장 */}
      {recommendations.length > 0 && (
        <GlassCard dark={isDark} gradient="linear-gradient(145deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))">
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>추가 최적화 권장</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onStartOptimization?.(rec.type)}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background:
                        rec.type === 'layout'
                          ? 'rgba(139,92,246,0.2)'
                          : rec.type === 'staff'
                            ? 'rgba(6,182,212,0.2)'
                            : 'rgba(245,158,11,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {rec.type === 'layout' ? (
                      <Armchair className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                    ) : rec.type === 'staff' ? (
                      <Users className="w-4 h-4" style={{ color: '#06b6d4' }} />
                    ) : (
                      <TrendingUp className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>{rec.title}</p>
                    <p style={{ fontSize: '10px', margin: '2px 0 0', ...text3D.body }}>{rec.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default OptimizationEffectSection;
