/**
 * ActiveStrategies.tsx
 *
 * 진행 중인 전략 카드
 * 3D Glassmorphism + Monochrome
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { ActiveStrategy } from '../types/aiDecision.types';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
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

const GlassCard = ({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) => (
  <div style={{ perspective: '1200px', height: '100%' }} className={className}>
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
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
    borderRadius: '8px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
    boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,1)',
    fontSize: '11px', fontWeight: 600,
  }}>
    {children}
  </div>
);

// Canvas 프로그레스 바
const GlowProgressBar = ({ progress, isDark }: { progress: number; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = 6;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 배경
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 3);
    ctx.fill();

    // 채움
    const fillW = (progress / 100) * width;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(0, 0, fillW, 0);
      if (isDark) {
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(255,255,255,0.6)');
      } else {
        grad.addColorStop(0, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, fillW, height, 3);
      ctx.fill();

      // 글로우
      const glow = ctx.createRadialGradient(fillW, height / 2, 0, fillW, height / 2, 4);
      const gc = isDark ? '255,255,255' : '0,0,0';
      glow.addColorStop(0, `rgba(${gc},0.3)`);
      glow.addColorStop(1, `rgba(${gc},0)`);
      ctx.beginPath();
      ctx.arc(fillW, height / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }, [progress, isDark]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 6, display: 'block' }} />;
};

interface ActiveStrategiesProps {
  strategies: ActiveStrategy[];
  onViewDetails: (id: string) => void;
  onCreateNew: () => void;
}

export function ActiveStrategies({ strategies, onViewDetails, onCreateNew }: ActiveStrategiesProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '실행 중';
      case 'scheduled': return '예정';
      case 'paused': return '일시정지';
      default: return status;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} />;
      case 'down': return <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />;
      default: return <Minus className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />;
    }
  };

  if (strategies.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>진행 중인 전략</h3>
            <Button size="sm" variant="ghost" onClick={onCreateNew} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: '8px', border: 'none',
            }}>
              <Plus className="w-4 h-4" style={{ color: iconColor }} />
              <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1f' }}>새 전략</span>
            </Button>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: '14px', ...text3D.body }}>진행 중인 전략이 없습니다</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
              AI 추천을 확인하고 전략을 실행해보세요
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>진행 중인 전략</h3>
            <Badge3D dark={isDark}><span style={{ color: isDark ? '#fff' : '#374151' }}>{strategies.length}</span></Badge3D>
          </div>
          <Button size="sm" variant="ghost" onClick={onCreateNew} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderRadius: '8px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <Plus className="w-4 h-4" style={{ color: iconColor }} />
            <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1f' }}>새 전략</span>
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              onClick={() => onViewDetails(strategy.id)}
              style={{
                padding: '14px', borderRadius: '14px', cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Badge3D dark={isDark}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>{getStatusLabel(strategy.status)}</span>
                    </Badge3D>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: isDark ? '#fff' : '#1a1a1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {strategy.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', ...text3D.body }}>
                    <span>D+{strategy.daysActive}</span>
                    <span>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      예상 ROI: {strategy.expectedROI}%
                      <ArrowRight className="w-3 h-3" style={{ color: iconColor }} />
                      <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>현재: {strategy.currentROI}%</span>
                      {getTrendIcon(strategy.trend)}
                    </span>
                  </div>
                </div>
                <button style={{
                  padding: '6px 10px', borderRadius: '6px', border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.7)' : '#515158',
                  cursor: 'pointer',
                }}>
                  상세보기
                </button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <GlowProgressBar progress={strategy.progress} isDark={isDark} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
