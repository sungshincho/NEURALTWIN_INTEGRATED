/**
 * AIRecommendationEffectWidget.tsx
 *
 * AI 추천 적용 후 ROI 측정 결과를 표시하는 위젯
 * 3D Glassmorphism Design + Dark Mode Support
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useROISummary, useRecommendationApplications, usePendingMeasurements, useCompleteROIMeasurement, RECOMMENDATION_TYPE_LABELS } from '@/hooks/useROITracking';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
    textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158', textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '24px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02), 0 32px 32px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '23px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          borderRadius: '23px 23px 50% 50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 40, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '32%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '3px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

// 글로우 프로그레스 바
const GlowProgressBar = ({ progress, isDark }: { progress: number; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = 4;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 2);
    ctx.fill();

    const fillWidth = (Math.min(progress, 100) / 100) * width;
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(0, 0, fillWidth, 0);
      if (isDark) {
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(255,255,255,0.6)');
      } else {
        grad.addColorStop(0, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, fillWidth, height, 2);
      ctx.fill();
    }
  }, [progress, isDark]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 4, display: 'block' }} />;
};

export function AIRecommendationEffectWidget() {
  const { selectedStore } = useSelectedStore();
  const { data: roiSummary, isLoading: summaryLoading } = useROISummary(selectedStore?.id);
  const { data: applications = [] } = useRecommendationApplications(selectedStore?.id);
  const pendingMeasurements = usePendingMeasurements(selectedStore?.id);
  const completeROI = useCompleteROIMeasurement();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  const appliedApplications = applications.filter(app => app.status === 'applied');
  const completedApplications = applications.filter(app => app.status === 'completed');

  const handleCompleteMeasurement = async (applicationId: string) => {
    try {
      await completeROI.mutateAsync(applicationId);
    } catch (error) {
      console.error('ROI 측정 실패:', error);
    }
  };

  if (!roiSummary && applications.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Icon3D size={40} dark={isDark}>
              <Sparkles className="h-5 w-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>AI 추천 효과</h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>적용된 추천의 ROI 측정 결과</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,248,0.95) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
              boxShadow: isDark ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1)',
            }}>
              <BarChart3 className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
            </div>
            <p style={{ fontSize: '14px', ...text3D.body }}>아직 적용된 추천이 없습니다</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
              AI 추천을 적용하면 효과를 측정할 수 있습니다
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icon3D size={40} dark={isDark}>
            <Sparkles className="h-5 w-5" style={{ color: iconColor }} />
          </Icon3D>
          <div>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>AI 추천 효과</h3>
            <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>적용된 추천의 ROI 측정 결과</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 총 효과 요약 */}
          {roiSummary && roiSummary.completedMeasurements > 0 && (
            <div style={{
              padding: '16px', borderRadius: '14px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', ...text3D.body }}>총 매출 영향</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#fff' : '#0a0a0c' }}>
                  {(roiSummary.avgROI || 0) > 0 ? '+' : ''}{(roiSummary.avgROI || 0).toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                <span>{roiSummary.completedMeasurements}개 추천 측정 완료</span>
                <span>{roiSummary.positiveImpactRate}% 긍정적 효과</span>
              </div>
              {(roiSummary.totalEstimatedAnnualImpact || 0) > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>예상 연간 영향: </span>
                  <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#0a0a0c' }}>
                    +₩{(roiSummary.totalEstimatedAnnualImpact || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 측정 준비 완료 */}
          {pendingMeasurements.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <RefreshCw className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                  측정 준비 완료 ({pendingMeasurements.length}개)
                </span>
              </div>
              {pendingMeasurements.map(app => (
                <div key={app.id} style={{
                  padding: '12px', borderRadius: '10px', marginBottom: '8px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.recommendation_summary}
                      </p>
                      <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                        {RECOMMENDATION_TYPE_LABELS[app.recommendation_type] || app.recommendation_type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteMeasurement(app.id)}
                      disabled={completeROI.isPending}
                      style={{
                        marginLeft: '12px', padding: '6px 12px', borderRadius: '8px',
                        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                        border: 'none', fontSize: '12px', fontWeight: 500,
                        color: isDark ? '#fff' : '#1a1a1f',
                      }}
                    >
                      {completeROI.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
                      <span style={{ marginLeft: '4px' }}>ROI 측정</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 측정 중 */}
          {appliedApplications.filter(app => !pendingMeasurements.find(p => p.id === app.id)).length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Clock className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                  측정 중 ({appliedApplications.filter(app => !pendingMeasurements.find(p => p.id === app.id)).length}개)
                </span>
              </div>
              {appliedApplications
                .filter(app => !pendingMeasurements.find(p => p.id === app.id))
                .slice(0, 3)
                .map(app => {
                  const endDate = app.measurement_end_date ? parseISO(app.measurement_end_date) : new Date();
                  const daysRemaining = differenceInDays(endDate, new Date());
                  const totalDays = app.measurement_period_days || 7;
                  const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

                  return (
                    <div key={app.id} style={{
                      padding: '12px', borderRadius: '10px', marginBottom: '8px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.recommendation_summary}
                        </p>
                        <span style={{
                          marginLeft: '8px', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 500,
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280',
                        }}>
                          {daysRemaining > 0 ? `${daysRemaining}일 남음` : '측정 준비'}
                        </span>
                      </div>
                      <GlowProgressBar progress={progress} isDark={isDark} />
                      <p style={{ fontSize: '11px', margin: '6px 0 0 0', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                        {app.measurement_end_date && format(parseISO(app.measurement_end_date), 'M월 d일', { locale: ko })} 측정 예정
                      </p>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 측정 완료 */}
          {completedApplications.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                  측정 완료 ({completedApplications.length}개)
                </span>
              </div>
              {completedApplications.slice(0, 3).map(app => (
                <div key={app.id} style={{
                  padding: '12px', borderRadius: '10px', marginBottom: '8px',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.recommendation_summary}
                      </p>
                      <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                        {RECOMMENDATION_TYPE_LABELS[app.recommendation_type] || app.recommendation_type}
                        {app.applied_at && ` • ${format(parseISO(app.applied_at), 'M월 d일', { locale: ko })} 적용`}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                    }}>
                      <CheckCircle2 className="h-3 w-3" />
                      완료
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 유형별 성과 */}
          {roiSummary && Object.keys(roiSummary.byType || {}).length > 0 && (
            <div style={{ paddingTop: '16px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>유형별 평균 ROI</h4>
              <div className="space-y-2">
                {Object.entries(roiSummary.byType).map(([type, data]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                      {RECOMMENDATION_TYPE_LABELS[type as keyof typeof RECOMMENDATION_TYPE_LABELS] || type}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{data.count}건</span>
                      <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#0a0a0c' }}>
                        {data.avgROI > 0 ? '+' : ''}{data.avgROI.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
