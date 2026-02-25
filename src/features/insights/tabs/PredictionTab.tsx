/**
 * PredictionTab.tsx
 *
 * 인사이트 허브 - AI 예측 탭
 * 3D Glassmorphism + Canvas Glow Charts + Monochrome
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Calendar,
  Users,
  Percent,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Info,
} from 'lucide-react';
import { useAIPrediction, DailyPrediction } from '../hooks/useAIPrediction';
import { formatCurrency } from '../components';
import { format, isSameDay, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useCountUp } from '@/hooks/useCountUp';

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

const GlassCard = ({ children, dark = false, className = '', id }: { children: React.ReactNode; dark?: boolean; className?: string; id?: string }) => (
  <div id={id} style={{ perspective: '1200px', height: '100%' }} className={className}>
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
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
    borderRadius: '10px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
    fontSize: '11px', fontWeight: 600,
  }}>
    {children}
  </div>
);

// ============================================================================
// 글로우 차트 컴포넌트
// ============================================================================
interface ChartDataPoint {
  date: string;
  revenue: number;
  visitors: number;
  conversion: number;
  isPrediction: boolean;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  value: string;
  subValue?: string;
  isPrediction: boolean;
}

const ChartTooltip = ({ data, isDark }: { data: TooltipData | null; isDark: boolean }) => {
  if (!data) return null;
  return (
    <div style={{
      position: 'absolute', left: data.x, top: data.y, transform: 'translate(-50%, -100%) translateY(-12px)',
      padding: '10px 14px', borderRadius: '12px', minWidth: '120px', pointerEvents: 'none', zIndex: 50,
      background: isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.98)',
      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
      backdropFilter: 'blur(20px)',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>{data.date}</p>
      <p style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#fff' : '#0a0a0c' }}>{data.value}</p>
      {data.subValue && <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', marginTop: '2px' }}>{data.subValue}</p>}
      <span style={{
        display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280',
      }}>{data.isPrediction ? '예측' : '실적'}</span>
    </div>
  );
};

// 매출 예측 차트
const GlowRevenueChart = ({ data, isDark }: { data: ChartDataPoint[]; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [progress, setProgress] = useState(0);
  const hitAreasRef = useRef<{ x: number; y: number; w: number; h: number; idx: number }[]>([]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: 350 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - start) / 1000, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 30, right: 20, bottom: 50, left: 90 }; // Y축 라벨 공간 확보
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const revenues = data.map(d => d.revenue);
    const maxRev = Math.max(...revenues) * 1.1;
    const minRev = Math.min(...revenues) * 0.9;

    // 그리드
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    // Y축 라벨 (간략 포맷)
    const formatCompact = (val: number): string => {
      if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
      if (val >= 10000) return `${Math.round(val / 10000)}만`;
      return formatCurrency(val);
    };
    ctx.font = '11px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH / 5) * i;
      const val = maxRev - ((maxRev - minRev) / 5) * i;
      ctx.fillText(formatCompact(val), pad.left - 10, y + 4);
    }

    // X축 라벨
    ctx.textAlign = 'center';
    const step = Math.ceil(data.length / 7);
    data.forEach((d, idx) => {
      if (idx % step === 0 || idx === data.length - 1) {
        const x = pad.left + (chartW / (data.length - 1)) * idx;
        ctx.fillText(d.date, x, height - pad.bottom + 20);
      }
    });

    // 예측 시작선
    const predIdx = data.findIndex(d => d.isPrediction);
    if (predIdx > 0) {
      const predX = pad.left + (chartW / (data.length - 1)) * predIdx;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(predX, pad.top);
      ctx.lineTo(predX, pad.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.font = '10px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillText('예측 시작', predX, pad.top - 10);
    }

    // 데이터 포인트 계산
    const points = data.map((d, idx) => ({
      x: pad.left + (chartW / (data.length - 1)) * idx,
      y: pad.top + chartH - ((d.revenue - minRev) / (maxRev - minRev)) * chartH * progress,
      isPrediction: d.isPrediction,
    }));

    hitAreasRef.current = points.map((pt, idx) => ({ x: pt.x - 15, y: pt.y - 15, w: 30, h: 30, idx }));

    // 실적 영역
    const actualPts = points.filter(p => !p.isPrediction);
    if (actualPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(actualPts[0].x, pad.top + chartH);
      actualPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(actualPts[actualPts.length - 1].x, pad.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
      grad.addColorStop(1, isDark ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 실적 라인
    if (actualPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(actualPts[0].x, actualPts[0].y);
      actualPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 예측 라인 (점선)
    const predPts = points.filter(p => p.isPrediction);
    if (predPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(predPts[0].x, predPts[0].y);
      predPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 모든 점 + 글로우 (실적 + 예측 모두)
    points.forEach(p => {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
      const gc = isDark ? '255,255,255' : '0,0,0';
      glow.addColorStop(0, `rgba(${gc},${0.4 * progress})`);
      glow.addColorStop(0.5, `rgba(${gc},${0.1 * progress})`);
      glow.addColorStop(1, `rgba(${gc},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? `rgba(255,255,255,${0.9 * progress})` : `rgba(0,0,0,${0.7 * progress})`;
      ctx.fill();
    });

  }, [data, dimensions, isDark, progress]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = hitAreasRef.current.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (hit && data[hit.idx]) {
      const d = data[hit.idx];
      setTooltip({
        x: hit.x + hit.w / 2, y: hit.y,
        date: d.date,
        value: formatCurrency(d.revenue),
        subValue: d.isPrediction && d.lowerBound && d.upperBound 
          ? `신뢰구간: ${formatCurrency(d.lowerBound)} ~ ${formatCurrency(d.upperBound)}`
          : undefined,
        isPrediction: d.isPrediction,
      });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 방문자/전환율 미니 차트
const GlowMiniLineChart = ({ data, dataKey, isDark, label }: { data: ChartDataPoint[]; dataKey: 'visitors' | 'conversion'; isDark: boolean; label: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 200 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hitAreasRef = useRef<{ x: number; y: number; w: number; h: number; idx: number }[]>([]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 200 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 15, bottom: 35, left: 50 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const values = data.map(d => d[dataKey]);
    const maxVal = Math.max(...values) * 1.1;
    const minVal = Math.min(...values) * 0.9;

    // 그리드
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    // Y축
    ctx.font = '10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      const val = maxVal - ((maxVal - minVal) / 4) * i;
      ctx.fillText(dataKey === 'conversion' ? `${val.toFixed(1)}%` : val.toLocaleString(), pad.left - 8, y + 3);
    }

    // X축
    ctx.textAlign = 'center';
    const step = Math.ceil(data.length / 5);
    data.forEach((d, idx) => {
      if (idx % step === 0) {
        const x = pad.left + (chartW / (data.length - 1)) * idx;
        ctx.fillText(d.date, x, height - 10);
      }
    });

    // 포인트
    const points = data.map((d, idx) => ({
      x: pad.left + (chartW / (data.length - 1)) * idx,
      y: pad.top + chartH - ((d[dataKey] - minVal) / (maxVal - minVal)) * chartH,
      isPrediction: d.isPrediction,
    }));

    hitAreasRef.current = points.map((pt, idx) => ({ x: pt.x - 12, y: pt.y - 12, w: 24, h: 24, idx }));

    // 라인
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 모든 점 + 글로우 (실적 + 예측 모두)
    points.forEach(p => {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
      const gc = isDark ? '255,255,255' : '0,0,0';
      glow.addColorStop(0, `rgba(${gc},0.35)`);
      glow.addColorStop(1, `rgba(${gc},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
      ctx.fill();
    });
  }, [data, dimensions, isDark, dataKey]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = hitAreasRef.current.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (hit && data[hit.idx]) {
      const d = data[hit.idx];
      setTooltip({
        x: hit.x + hit.w / 2, y: hit.y,
        date: d.date,
        value: dataKey === 'conversion' ? `${d.conversion.toFixed(1)}%` : `${d.visitors.toLocaleString()}명`,
        isPrediction: d.isPrediction,
      });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 신뢰도 프로그레스 바
const ConfidenceBar = ({ value, isDark }: { value: number; isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = 8;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 배경
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();

    // 채움
    const fillW = (value / 100) * width;
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
    ctx.roundRect(0, 0, fillW, height, 4);
    ctx.fill();
  }, [value, isDark]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 8, display: 'block' }} />;
};

// ============================================================================
// 유틸
// ============================================================================
function getConfidenceLevel(confidence: number): { label: string } {
  if (confidence >= 70) return { label: '높음' };
  if (confidence >= 40) return { label: '보통' };
  return { label: '낮음' };
}

function formatChartData(historical: DailyPrediction[], predictions: DailyPrediction[]): ChartDataPoint[] {
  return [...historical, ...predictions].map((d) => ({
    date: format(new Date(d.date), 'MM/dd'),
    fullDate: d.date,
    revenue: d.predicted_revenue,
    visitors: d.predicted_visitors,
    conversion: d.predicted_conversion,
    isPrediction: d.is_prediction,
    lowerBound: d.lower_bound_revenue,
    upperBound: d.upper_bound_revenue,
    confidence: d.confidence,
  }));
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function PredictionTab() {
  const { data, isLoading, error } = useAIPrediction();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  const chartData = useMemo(() => {
    if (!data?.historicalData || !data?.dailyPredictions) return [];
    return formatChartData(data.historicalData, data.dailyPredictions);
  }, [data]);

  // KPI 카운트업 애니메이션
  const animatedRevenue = useCountUp(data?.summary?.total_predicted_revenue || 0, { duration: 1500, enabled: !isLoading });
  const animatedVisitors = useCountUp(data?.summary?.total_predicted_visitors || 0, { duration: 1500, enabled: !isLoading });
  const animatedConversion = useCountUp(data?.summary?.avg_predicted_conversion || 0, { duration: 1500, decimals: 1, enabled: !isLoading });

  if (isLoading) return <PredictionTabSkeleton isDark={isDark} />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Info className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
          <p style={{ ...text3D.body }}>예측 데이터를 불러오는 중 오류가 발생했습니다</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  const { summary, dailyPredictions } = data || {};

  if (!summary || !dailyPredictions?.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
          <p style={{ ...text3D.body }}>예측을 위한 충분한 데이터가 없습니다</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>최소 7일 이상의 판매 데이터가 필요합니다</p>
        </div>
      </div>
    );
  }

  const confidenceLevel = getConfidenceLevel(summary.overall_confidence);

  return (
    <div className="space-y-6">
      {/* AI 예측 배너 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        padding: '16px 20px', borderRadius: '16px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon3D size={36} dark={isDark}>
            <Brain className="h-4 w-4" style={{ color: iconColor }} />
          </Icon3D>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
              {(data as any)?.isAIPowered ? '🤖 Gemini AI 예측' : 'AI 기반 예측'}
            </h3>
            <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>
              {(data as any)?.isAIPowered
                ? 'Google Gemini 2.5 Flash 모델을 사용한 실제 AI 예측'
                : '통계적 분석과 트렌드를 기반으로 향후 7일을 예측합니다'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(data as any)?.isAIPowered && (
            <Badge3D dark={isDark}>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>🧠 Real AI</span>
            </Badge3D>
          )}
          <Badge3D dark={isDark}>
            <Sparkles className="h-3 w-3" style={{ color: iconColor }} />
            <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>{summary.model_info.data_points}일 데이터 분석</span>
          </Badge3D>
        </div>
      </div>

      {/* 요약 카드 4개 */}
      <div id="prediction-kpi-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard dark={isDark}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calendar className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
              <span style={{ fontSize: '12px', ...text3D.body }}>향후 7일 예상 매출</span>
            </div>
            <p style={{ fontSize: '24px', margin: 0, ...text3D.heroNumber }}>{formatCurrency(animatedRevenue)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              {summary.revenue_change_percent > 0 ? <TrendingUp className="h-3 w-3" style={{ color: '#22c55e' }} /> : summary.revenue_change_percent < 0 ? <TrendingDown className="h-3 w-3" style={{ color: '#ef4444' }} /> : <TrendingUp className="h-3 w-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
              <span style={{ fontSize: '12px', fontWeight: 500, color: summary.revenue_change_percent > 0 ? '#22c55e' : summary.revenue_change_percent < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
                전주 대비 {summary.revenue_change_percent > 0 ? '+' : ''}{summary.revenue_change_percent.toFixed(1)}%
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard dark={isDark}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
              <span style={{ fontSize: '12px', ...text3D.body }}>예상 방문자</span>
            </div>
            <p style={{ fontSize: '24px', margin: 0, ...text3D.heroNumber }}>{animatedVisitors.toLocaleString()}명</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>향후 7일 누적</p>
          </div>
        </GlassCard>

        <GlassCard dark={isDark}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Percent className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
              <span style={{ fontSize: '12px', ...text3D.body }}>예상 전환율</span>
            </div>
            <p style={{ fontSize: '24px', margin: 0, ...text3D.heroNumber }}>{animatedConversion.toFixed(1)}%</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>7일 평균 예측</p>
          </div>
        </GlassCard>

        <GlassCard dark={isDark}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Activity className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
              <span style={{ fontSize: '12px', ...text3D.body }}>예측 신뢰도</span>
            </div>
            <p style={{ fontSize: '24px', margin: 0, ...text3D.heroNumber }}>{confidenceLevel.label}</p>
            <div style={{ marginTop: '12px' }}>
              <ConfidenceBar value={summary.overall_confidence} isDark={isDark} />
              <p style={{ fontSize: '11px', marginTop: '6px', ...text3D.body }}>{summary.overall_confidence}% 신뢰도</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 매출 예측 차트 */}
      <GlassCard dark={isDark} id="prediction-revenue">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles className="h-5 w-5" style={{ color: iconColor }} />
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>매출 예측</h3>
          </div>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>과거 14일 실적 및 향후 7일 예측</p>
          <GlowRevenueChart data={chartData} isDark={isDark} />
        </div>
      </GlassCard>

      {/* 방문자 & 전환율 예측 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard dark={isDark} id="prediction-visitors">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Users className="h-5 w-5" style={{ color: iconColor }} />
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>방문자 예측</h3>
            </div>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>일별 방문자 수 추이</p>
            <GlowMiniLineChart data={chartData} dataKey="visitors" isDark={isDark} label="방문자" />
          </div>
        </GlassCard>

        <GlassCard dark={isDark} id="prediction-conversion">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Percent className="h-5 w-5" style={{ color: iconColor }} />
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>전환율 예측</h3>
            </div>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>일별 전환율 추이</p>
            <GlowMiniLineChart data={chartData} dataKey="conversion" isDark={isDark} label="전환율" />
          </div>
        </GlassCard>
      </div>

      {/* 일별 예측 상세 테이블 */}
      <GlassCard dark={isDark} id="prediction-daily">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Calendar className="h-5 w-5" style={{ color: iconColor }} />
            <div>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>일별 예측 상세</h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>향후 7일 예측 데이터</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>날짜</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>예상 매출</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>신뢰구간</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>방문자</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>전환율</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {dailyPredictions.map((pred, idx) => {
                  const conf = Math.round(pred.confidence * 100);
                  const predDate = new Date(pred.date);
                  // 🔧 수정: 실제 내일 날짜와 비교하여 "내일" 배지 표시
                  const tomorrow = addDays(new Date(), 1);
                  const isTomorrow = isSameDay(predDate, tomorrow);
                  // 오늘인지도 확인
                  const isToday = isSameDay(predDate, new Date());

                  return (
                    <tr key={pred.date} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isDark ? '#fff' : '#1a1a1f' }}>{format(predDate, 'M월 d일 (EEE)', { locale: ko })}</span>
                          {isToday && <Badge3D dark={isDark}><span style={{ fontSize: '10px' }}>오늘</span></Badge3D>}
                          {isTomorrow && <Badge3D dark={isDark}><span style={{ fontSize: '10px' }}>내일</span></Badge3D>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{formatCurrency(pred.predicted_revenue)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
                        {formatCurrency(pred.lower_bound_revenue)} ~ {formatCurrency(pred.upper_bound_revenue)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', color: isDark ? '#fff' : '#1a1a1f' }}>{pred.predicted_visitors.toLocaleString()}명</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', color: isDark ? '#fff' : '#1a1a1f' }}>{pred.predicted_conversion.toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <div style={{ width: '50px' }}><ConfidenceBar value={conf} isDark={isDark} /></div>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>{conf}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* 예측 모델 정보 */}
      <GlassCard dark={isDark} id="prediction-model">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Info className="h-5 w-5" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
            <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>예측 모델 정보</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Badge3D dark={isDark}><span>데이터 기반</span></Badge3D>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>{summary.model_info.data_points}일</p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', ...text3D.body }}>분석된 데이터 일수</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Badge3D dark={isDark}><span>트렌드</span></Badge3D>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {summary.model_info.trend_direction === 'up' ? <TrendingUp className="h-4 w-4" style={{ color: '#22c55e' }} /> :
                 summary.model_info.trend_direction === 'down' ? <TrendingDown className="h-4 w-4" style={{ color: '#ef4444' }} /> :
                 <Activity className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: summary.model_info.trend_direction === 'up' ? '#22c55e' : summary.model_info.trend_direction === 'down' ? '#ef4444' : (isDark ? '#fff' : '#1a1a1f') }}>
                    {summary.model_info.trend_direction === 'up' ? '상승' : summary.model_info.trend_direction === 'down' ? '하락' : '안정'}
                  </p>
                  <p style={{ fontSize: '11px', margin: '2px 0 0 0', ...text3D.body }}>최근 매출 추세</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Badge3D dark={isDark}><span>요일 패턴</span></Badge3D>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
                  {summary.model_info.seasonality_detected ? '감지됨' : '미감지'}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', ...text3D.body }}>주중/주말 패턴</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Badge3D dark={isDark}><span>업데이트</span></Badge3D>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
                  {format(new Date(summary.model_info.last_updated), 'HH:mm')}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', ...text3D.body }}>마지막 분석 시간</p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', lineHeight: 1.6, ...text3D.body }}>
              이 예측은 과거 {summary.model_info.data_points}일간의 데이터를 기반으로 통계적 분석 (이동평균, 트렌드, 요일 패턴)을 적용하여 생성되었습니다. 예측값은 참고용이며, 프로모션, 날씨, 이벤트 등 외부 요인에 따라 실제 결과가 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// 스켈레톤
function PredictionTabSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="space-y-6">
      <div className="animate-pulse" style={{ height: '72px', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ height: '140px', borderRadius: '24px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
        ))}
      </div>
      <div className="animate-pulse" style={{ height: '400px', borderRadius: '24px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ height: '280px', borderRadius: '24px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
        ))}
      </div>
    </div>
  );
}
