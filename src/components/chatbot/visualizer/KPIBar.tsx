/**
 * NEURALTWIN Store Visualizer - KPI Bar Component (A-5 Enhanced)
 *
 * 비주얼라이저 상단에 표시되는 KPI 카드 바
 * - Glassmorphism 스타일
 * - 숫자값 count-up 애니메이션
 * - slide-in 등장 애니메이션
 */

import { useEffect, useRef, useState } from 'react';
import type { VizKPI } from './vizDirectiveTypes';

interface KPIBarProps {
  kpis: VizKPI[];
}

/**
 * 숫자값 추출 (문자열에서 첫 번째 숫자 추출)
 * "$25-35" → 25, "70%" → 70, "1,000+" → 1000
 */
function extractNumeric(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '');
  const match = cleaned.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * count-up 애니메이션 훅
 */
function useCountUp(target: number | null, duration: number = 800): number {
  const [current, setCurrent] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === null || target === 0) {
      setCurrent(0);
      return;
    }

    const startVal = 0;
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startVal + (target - startVal) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

function KPICard({ kpi, index }: { kpi: VizKPI; index: number }) {
  const numericVal = extractNumeric(kpi.value);
  const animatedVal = useCountUp(numericVal);

  // 게이지 값: 명시적 gauge 필드 또는 % 값이면 자동 추출
  const gaugeValue = kpi.gauge ?? (kpi.value.includes('%') && numericVal !== null ? Math.min(100, numericVal) : null);
  const animatedGauge = useCountUp(gaugeValue, 1000);

  // 표시할 값: 숫자면 애니메이션, 아니면 원본 그대로
  const displayValue = numericVal !== null
    ? kpi.value.replace(
        String(numericVal),
        numericVal % 1 === 0 ? Math.round(animatedVal).toLocaleString() : animatedVal.toFixed(1)
      )
    : kpi.value;

  // 스타일 결정
  let borderColor = 'rgba(30, 41, 59, 0.5)';
  let valueColor = '#ffffff';
  let glowColor = 'rgba(100, 116, 139, 0.1)';

  if (kpi.alert) {
    borderColor = 'rgba(239, 68, 68, 0.3)';
    valueColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.08)';
  } else if (kpi.highlight) {
    borderColor = 'rgba(139, 92, 246, 0.3)';
    valueColor = '#8b5cf6';
    glowColor = 'rgba(139, 92, 246, 0.08)';
  }

  return (
    <div
      className="w-[calc(50%-3px)] sm:w-auto sm:flex-1 min-w-0 rounded-xl"
      style={{
        padding: 'clamp(6px, 1vw, 12px) clamp(8px, 1.2vw, 16px)',
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.4))`,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `0 4px 16px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.03)`,
        animation: `kpiSlideIn 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* 라벨 */}
      <div
        className="truncate"
        style={{
          fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
          fontSize: 'clamp(8px, 1.5vw, 11px)',
          color: '#94a3b8',
          marginBottom: '2px',
          letterSpacing: '0.02em',
        }}
      >
        {kpi.label}
      </div>

      {/* 값 + 트렌드 */}
      <div className="flex items-center gap-1">
        <div
          className="font-bold leading-tight"
          style={{
            fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
            fontSize: 'clamp(13px, 2.8vw, 20px)',
            color: valueColor,
            textShadow: kpi.alert || kpi.highlight ? `0 0 8px ${valueColor}44` : 'none',
          }}
        >
          {displayValue}
        </div>
        {kpi.trend && (
          <span style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            color: kpi.trend === 'up' ? '#22c55e' : kpi.trend === 'down' ? '#ef4444' : '#94a3b8',
          }}>
            {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '—'}
          </span>
        )}
      </div>

      {/* 미니 게이지 바 */}
      {gaugeValue !== null && (
        <div
          style={{
            width: '100%',
            height: '3px',
            borderRadius: '2px',
            backgroundColor: 'rgba(100, 116, 139, 0.2)',
            marginTop: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, animatedGauge)}%`,
              height: '100%',
              borderRadius: '2px',
              backgroundColor: kpi.alert ? '#ef4444' : kpi.highlight ? '#8b5cf6' : '#22c55e',
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      )}

      {/* 서브텍스트 */}
      {kpi.sub && (
        <div
          className="truncate"
          style={{
            fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
            fontSize: 'clamp(7px, 1.3vw, 10px)',
            color: '#64748b',
            marginTop: '2px',
          }}
        >
          {kpi.sub}
        </div>
      )}
    </div>
  );
}

export default function KPIBar({ kpis }: KPIBarProps) {
  if (!kpis || kpis.length === 0) {
    return null;
  }

  return (
    <>
      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes kpiSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        className="flex flex-wrap sm:flex-nowrap min-w-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,7,18,0.88) 50%, transparent 100%)',
          gap: 'clamp(4px, 0.8vw, 10px)',
          padding: 'clamp(6px, 1.2vw, 12px) clamp(6px, 1.5vw, 14px) clamp(10px, 1.5vw, 16px)',
        }}
      >
        {kpis.map((kpi, index) => (
          <KPICard key={`${kpi.label}-${index}`} kpi={kpi} index={index} />
        ))}
      </div>
    </>
  );
}
