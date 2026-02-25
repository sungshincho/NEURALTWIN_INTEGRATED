/**
 * GoalProgressWidget.tsx
 *
 * 목표 달성률 위젯 - 3D Glassmorphism Design + Dark Mode Support
 * Monochrome Style (컬러 제거)
 */

import { useState, useEffect, useRef } from 'react';
import { Target, DollarSign, Users, TrendingUp, ShoppingCart, Trash2, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoalProgress, useDeleteGoal, formatGoalValue, GOAL_TYPES, GoalType, PeriodType } from '@/hooks/useGoals';
import { GoalSettingDialog } from './GoalSettingDialog';
import React from 'react';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// 기간 유형 라벨
const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

const getText3D = (isDark: boolean) => ({
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

const GlassCard = ({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) => (
  <div style={{ perspective: '1200px', height: '100%' }} className={className}>
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

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
    borderRadius: '8px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
    position: 'relative', overflow: 'hidden',
  }}>
    {!dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
      borderRadius: '8px 8px 0 0', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>{children}</span>
  </div>
);

// 글로우 프로그레스 바 컴포넌트
const GlowProgressBar = ({ progress, isDark, isAchieved }: { progress: number; isDark: boolean; isAchieved: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const animate = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setAnimatedProgress(progress * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = 10;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 배경
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 5);
    ctx.fill();

    // 채움 바
    const fillWidth = (Math.min(animatedProgress, 100) / 100) * width;
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
  }, [animatedProgress, isDark, isAchieved]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 10, display: 'block' }} />;
};

const iconMap = {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  Target,
};

export function GoalProgressWidget() {
  const { data: progressList = [], isLoading } = useGoalProgress();
  const deleteGoal = useDeleteGoal();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  if (isLoading) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
            <div className="h-10 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!progressList || progressList.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Icon3D size={40} dark={isDark}>
              <Target className="h-5 w-5" style={{ color: iconColor }} />
            </Icon3D>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>목표 달성률</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,248,0.95) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
              boxShadow: isDark ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1)',
            }}>
              <Target className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
            </div>
            <p style={{ fontSize: '14px', marginBottom: '16px', ...text3D.body }}>설정된 목표가 없습니다</p>
            <GoalSettingDialog />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={40} dark={isDark}>
              <Target className="h-5 w-5" style={{ color: iconColor }} />
            </Icon3D>
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>목표 달성률</h3>
          </div>
          <GoalSettingDialog />
        </div>

        <div className="space-y-5">
          {progressList.map(({ goal, currentValue, progress, isAchieved }) => {
            const goalType = GOAL_TYPES.find((t) => t.value === goal.goal_type);
            const Icon = goalType ? iconMap[goalType.icon as keyof typeof iconMap] : Target;

            return (
              <div key={goal.id} className="group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDark
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(235,235,245,0.95) 100%)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
                      boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,1)',
                    }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }} />
                    </div>
                    <span style={{ fontSize: '14px', ...text3D.number }}>{goalType?.label}</span>
                    {/* M-2: 기간 표시 (일간/주간/월간) */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                    }}>
                      <Calendar className="h-2.5 w-2.5" />
                      {PERIOD_LABELS[goal.period_type as PeriodType] || goal.period_type}
                    </span>
                    {isAchieved && (
                      <Badge3D dark={isDark}>
                        <Trophy className="h-3 w-3" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>달성!</span>
                      </Badge3D>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                      {progress.toFixed(0)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-3 w-3" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
                    </Button>
                  </div>
                </div>

                <GlowProgressBar progress={progress} isDark={isDark} isAchieved={isAchieved} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', ...text3D.body }}>현재: {formatGoalValue(currentValue, goal.goal_type as GoalType)}</span>
                  <span style={{ fontSize: '12px', ...text3D.body }}>목표: {formatGoalValue(goal.target_value, goal.goal_type as GoalType)}</span>
                </div>
              </div>
            );
          })}

          {progressList.length > 1 && (
            <div style={{ paddingTop: '16px', marginTop: '16px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', ...text3D.body }}>전체 달성률</span>
                <span style={{ fontSize: '18px', ...text3D.number }}>
                  {(progressList.reduce((sum, p) => sum + p.progress, 0) / progressList.length).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default GoalProgressWidget;
