// ============================================================================
// DataQualityScore.tsx - 데이터 품질 점수 (3D Glassmorphism Design)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Info,
  CloudSun,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import type { DataQualityScore as DataQualityScoreType } from '../types';

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
    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.08))',
  } as React.CSSProperties,
  title: isDark ? {
    fontWeight: 600, fontSize: '14px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '14px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#6b7280',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#9ca3af',
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
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02)',
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

const Icon3D = ({ children, size = 44, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
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

const Badge3D = ({ children, dark = false, variant = 'default' }: { children: React.ReactNode; dark?: boolean; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) => {
  const colors = {
    default: { bg: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: dark ? 'rgba(255,255,255,0.8)' : '#6b7280' },
    success: { bg: dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)', text: '#22c55e' },
    warning: { bg: dark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.1)', text: '#eab308' },
    error: { bg: dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', text: '#ef4444' },
    info: { bg: dark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  };
  const color = colors[variant];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
      background: color.bg,
      borderRadius: '10px',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
      fontSize: '12px', fontWeight: 600, color: color.text,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// 글로우 프로그레스 바 (목표 달성률 스타일)
// ============================================================================

const GlowProgressBar = ({ value, isDark }: { value: number; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // 애니메이션
  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const animate = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setAnimatedProgress(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  // ResizeObserver로 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    // 초기 크기 설정
    setCanvasWidth(container.offsetWidth);

    return () => observer.disconnect();
  }, []);

  // 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const height = 10;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, height);

    // 배경
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvasWidth, height, 5);
    ctx.fill();

    // 채움 바
    const fillWidth = (Math.min(animatedProgress, 100) / 100) * canvasWidth;
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(0, 0, fillWidth, 0);
      if (isDark) {
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0.7)');
      } else {
        grad.addColorStop(0, 'rgba(0,0,0,0.1)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0.6)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, fillWidth, height, 5);
      ctx.fill();

      // 끝 글로우
      const gx = fillWidth;
      const gy = height / 2;
      const gc = isDark ? '255,255,255' : '0,0,0';
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6);
      glow.addColorStop(0, `rgba(${gc},0.4)`);
      glow.addColorStop(0.5, `rgba(${gc},0.1)`);
      glow.addColorStop(1, `rgba(${gc},0)`);
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
      ctx.fill();
    }
  }, [animatedProgress, isDark, canvasWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 10 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 10, display: 'block' }} />
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface ContextDataStatus {
  weather?: { record_count: number; has_recent: boolean };
  events?: { record_count: number; upcoming_count: number };
}

interface DataQualityScoreProps {
  score: DataQualityScoreType;
  contextData?: ContextDataStatus;
}

const confidenceConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error'; icon: any }> = {
  high: { label: '높음', variant: 'success', icon: CheckCircle },
  medium: { label: '보통', variant: 'warning', icon: AlertTriangle },
  low: { label: '낮음', variant: 'error', icon: XCircle },
};

export function DataQualityScoreCard({ score, contextData }: DataQualityScoreProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const confidence = confidenceConfig[score.confidence_level] || confidenceConfig.medium;
  const ConfidenceIcon = confidence.icon;

  const getScoreColor = (value: number): 'success' | 'warning' | 'error' => {
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'error';
  };

  const scoreColor = getScoreColor(score.overall_score);
  const scoreTextColor = scoreColor === 'success' ? '#22c55e' : scoreColor === 'warning' ? '#eab308' : '#ef4444';

  // 컨텍스트 데이터 점수 계산 (날씨 최신 데이터 OR 이벤트/공휴일 데이터 존재)
  const contextScore = contextData
    ? Math.round(
        ((contextData.weather?.has_recent ? 50 : (contextData.weather?.record_count ? 25 : 0)) +
          ((contextData.events?.record_count && contextData.events.record_count > 0) ? 50 : 0))
      )
    : 0;

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <ShieldCheck className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>Data Quality Score</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>데이터 품질 점수</h3>
            </div>
          </div>
          <Badge3D dark={isDark} variant={confidence.variant}>
            <ConfidenceIcon className="w-3 h-3" />
            신뢰도 {confidence.label}
          </Badge3D>
        </div>

        {/* 점수 표시 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '48px', color: scoreTextColor, ...text3D.heroNumber }}>{score.overall_score}</span>
            <span style={{ fontSize: '20px', ...text3D.body }}>/ 100</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <GlowProgressBar value={score.overall_score} isDark={isDark} />
          </div>
        </div>

        {/* Coverage Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ ...text3D.label, display: 'block', marginBottom: '12px' }}>데이터 소스 커버리지</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'pos', fallbackLabel: 'POS/매출 데이터' },
              { key: 'sensor', fallbackLabel: 'NEURALSENSE 센서' },
              { key: 'crm', fallbackLabel: 'CRM/고객 데이터' },
              { key: 'product', fallbackLabel: '상품 마스터' },
              { key: 'erp', fallbackLabel: 'ERP/재고 데이터' },
            ].map(({ key, fallbackLabel }) => {
              const data = (score.coverage as Record<string, any>)[key] || {
                available: false,
                record_count: 0,
                label: fallbackLabel,
              };
              const completeness = data.completeness ?? (data.available ? 1 : 0);
              const progressColor = data.available ? 'success' : 'default';

              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '120px', whiteSpace: 'nowrap', ...text3D.small }}>{data.label || fallbackLabel}</div>
                  <div style={{ flex: 1 }}>
                    <GlowProgressBar value={completeness * 100} isDark={isDark} />
                  </div>
                  <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-start' }}>
                    {data.available ? (
                      <Badge3D dark={isDark} variant="default">{(data.record_count || 0).toLocaleString()}건</Badge3D>
                    ) : (
                      <Badge3D dark={isDark} variant="default">없음</Badge3D>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warnings */}
        {score.warnings.length > 0 && (
          <div style={{
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <span style={{ ...text3D.label, display: 'block', marginBottom: '12px' }}>
              경고 ({score.warning_count})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {score.warnings.slice(0, 3).map((warning, index) => {
                const warningVariant = warning.severity === 'high' ? 'error' : warning.severity === 'medium' ? 'warning' : 'info';
                const WarningIcon = warning.severity === 'high' ? XCircle : warning.severity === 'medium' ? AlertTriangle : Info;

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px',
                      borderRadius: '12px',
                      background: warningVariant === 'error'
                        ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)')
                        : warningVariant === 'warning'
                        ? (isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.08)')
                        : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'),
                      border: warningVariant === 'error'
                        ? (isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)')
                        : warningVariant === 'warning'
                        ? (isDark ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(234,179,8,0.2)')
                        : (isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.2)'),
                    }}
                  >
                    <WarningIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
                      color: warningVariant === 'error' ? '#ef4444' : warningVariant === 'warning' ? '#eab308' : '#3b82f6'
                    }} />
                    <span style={text3D.body}>{warning.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Good Message */}
        {score.warnings.length === 0 && score.overall_score >= 80 && (
          <div style={{
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
              borderRadius: '12px',
              background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
              border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.2)',
            }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
              <span style={{ fontWeight: 500, color: '#22c55e' }}>모든 데이터 소스가 정상입니다</span>
            </div>
          </div>
        )}

        {/* Context Data Section */}
        {contextData && (
          <div style={{
            marginTop: '16px', paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={text3D.label}>컨텍스트 데이터</span>
              {contextScore > 0 && (
                <Badge3D dark={isDark} variant="info">보조 점수: {contextScore}%</Badge3D>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* 날씨 데이터 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                borderRadius: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
              }}>
                <CloudSun className="w-5 h-5" style={{ color: iconColor }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={text3D.title}>날씨</div>
                  <div style={text3D.small}>
                    {contextData.weather?.record_count || 0}건
                    {contextData.weather?.has_recent && (
                      <span style={{ marginLeft: '6px', color: '#22c55e' }}>• 최신</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 이벤트 데이터 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                borderRadius: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
              }}>
                <Calendar className="w-5 h-5" style={{ color: iconColor }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={text3D.title}>공휴일/이벤트</div>
                  <div style={text3D.small}>
                    {contextData.events?.record_count || 0}건
                    {(contextData.events?.upcoming_count || 0) > 0 && (
                      <span style={{ marginLeft: '6px', color: '#22c55e' }}>
                        • 예정 {contextData.events?.upcoming_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
