/**
 * StoreTab.tsx
 *
 * 인사이트 허브 - 매장 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import {
  Clock,
  MapPin,
  Users,
  Radio,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useZoneMetricsByDateRange, useZonesDim } from '@/hooks/useZoneMetrics';
import { useAuth } from '@/hooks/useAuth';
import { useCountUp } from '@/hooks/useCountUp';
import { useIntegratedMetrics, useHourlyVisitors } from '../context/InsightDataContext';
import { formatDuration } from '../components';
import { useScreenDataStore } from '@/store/screenDataStore';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// 3D Text 스타일 (다크모드 지원)
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

// ============================================================================
// 툴팁 컴포넌트
// ============================================================================
interface TooltipData {
  x: number;
  y: number;
  title: string;
  value: string;
  subValue?: string;
}

const ChartTooltip = ({ data, isDark }: { data: TooltipData | null; isDark: boolean }) => {
  if (!data) return null;
  return (
    <div style={{
      position: 'absolute',
      left: data.x,
      top: data.y,
      transform: 'translate(-50%, -100%) translateY(-10px)',
      background: isDark
        ? 'linear-gradient(165deg, rgba(40,40,45,0.98) 0%, rgba(25,25,30,0.97) 100%)'
        : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      zIndex: 50,
      minWidth: '100px',
    }}>
      <p style={{ color: isDark ? '#fff' : '#1a1a1a', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{data.title}</p>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '12px' }}>{data.value}</p>
      {data.subValue && <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{data.subValue}</p>}
    </div>
  );
};

// ============================================================================
// 글로우 세로 바 차트 (시간대별 방문 패턴)
// ============================================================================
interface HourlyBarChartProps {
  data: Array<{ hour: string; visitors: number }>;
  isDark: boolean;
}

const GlowHourlyBarChart = ({ data, isDark }: HourlyBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 300 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: { hour: string; visitors: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: 300 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 800;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(1 - Math.pow(1 - progress, 4));
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    const padding = { top: 20, right: 20, bottom: 45, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const baseY = height - padding.bottom;
    const maxValue = Math.max(...data.map(d => d.visitors), 1) * 1.1;
    const barWidth = Math.min(20, (chartWidth / data.length) * 0.7);
    const gap = chartWidth / data.length;
    const bars: Array<{ x: number; y: number; width: number; height: number; data: { hour: string; visitors: number } }> = [];
    
    // 그리드
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    
    // Y축 라벨 (M-3: "명" 단위 추가)
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = baseY - (chartHeight / 4) * i;
      ctx.fillText(`${value}명`, padding.left - 8, y + 3);
    }
    
    data.forEach((item, idx) => {
      const x = padding.left + idx * gap + (gap - barWidth) / 2;
      const fullBarHeight = (item.visitors / maxValue) * chartHeight;
      const barHeight = fullBarHeight * animationProgress;
      const y = baseY - barHeight;
      bars.push({ x, y: baseY - fullBarHeight, width: barWidth, height: fullBarHeight, data: item });
      
      if (barHeight > 0) {
        const barGradient = ctx.createLinearGradient(0, baseY, 0, y);
        if (isDark) {
          barGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
          barGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
          barGradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
        } else {
          barGradient.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
          barGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
          barGradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        }
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
        
        // 상단 글로우
        const glowX = x + barWidth / 2;
        const glowY = y;
        const glowColor = isDark ? '255, 255, 255' : '0, 0, 0';
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 8);
        glow.addColorStop(0, `rgba(${glowColor}, ${0.3 * animationProgress})`);
        glow.addColorStop(0.5, `rgba(${glowColor}, ${0.08 * animationProgress})`);
        glow.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(glowX, glowY, 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.85 * animationProgress})` : `rgba(0,0,0,${0.8 * animationProgress})`;
        ctx.fill();
      }
      
      // X축 라벨 (3시간 간격)
      if (idx % 3 === 0) {
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(item.hour, x + barWidth / 2, baseY + 18);
      }
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    if (bar) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: bar.data.hour, value: `방문자: ${bar.data.visitors.toLocaleString()}명` });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 가로 바 차트 (존별 체류시간)
// ============================================================================
interface ZoneDwellChartProps {
  data: Array<{ name: string; avgDwell: number }>;
  isDark: boolean;
}

const GlowZoneDwellChart = ({ data, isDark }: ZoneDwellChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: { name: string; avgDwell: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: 250 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 700;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(1 - Math.pow(1 - progress, 4));
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    
    const padding = { top: 10, right: 50, bottom: 10, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = 20;
    const gap = Math.min(45, (height - padding.top - padding.bottom) / data.length);
    const maxValue = Math.max(...data.map(d => d.avgDwell), 1);
    const bars: Array<{ x: number; y: number; width: number; height: number; data: { name: string; avgDwell: number } }> = [];
    
    // 그리드
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartWidth / 4) * i;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    data.forEach((item, idx) => {
      const y = padding.top + idx * gap + (gap - barHeight) / 2;
      const fullBarWidth = (item.avgDwell / maxValue) * chartWidth;
      const barWidth = fullBarWidth * animationProgress;
      bars.push({ x: padding.left, y, width: fullBarWidth, height: barHeight, data: item });
      
      // 라벨
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.textAlign = 'right';
      const displayName = item.name.length > 8 ? item.name.substring(0, 8) + '..' : item.name;
      ctx.fillText(displayName, padding.left - 10, y + barHeight / 2 + 4);
      
      // 바 배경
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
      ctx.beginPath();
      ctx.roundRect(padding.left, y, chartWidth, barHeight, 3);
      ctx.fill();
      
      if (barWidth > 0) {
        const barGradient = ctx.createLinearGradient(padding.left, 0, padding.left + barWidth, 0);
        if (isDark) {
          barGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
          barGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
          barGradient.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
        } else {
          barGradient.addColorStop(0, 'rgba(0, 0, 0, 0.06)');
          barGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.22)');
          barGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        }
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, 3);
        ctx.fill();
        
        const glowX = padding.left + barWidth;
        const glowY = y + barHeight / 2;
        const glowColor = isDark ? '255, 255, 255' : '0, 0, 0';
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 10);
        glow.addColorStop(0, `rgba(${glowColor}, ${0.6 * animationProgress})`);
        glow.addColorStop(0.5, `rgba(${glowColor}, ${0.15 * animationProgress})`);
        glow.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(glowX, glowY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.9 * animationProgress})` : `rgba(0,0,0,${0.8 * animationProgress})`;
        ctx.fill();
      }
      
      // 값 표시
      ctx.font = '500 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${0.6 * animationProgress})` : `rgba(0, 0, 0, ${0.6 * animationProgress})`;
      ctx.textAlign = 'left';
      ctx.fillText(`${item.avgDwell}분`, width - padding.right + 8, y + barHeight / 2 + 4);
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    if (bar) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: bar.data.name, value: `평균 체류: ${bar.data.avgDwell}분` });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 도넛 차트 (존별 방문자 분포)
// ============================================================================
interface ZoneDonutChartProps {
  data: Array<{ name: string; visitors: number }>;
  isDark: boolean;
}

const GlowZoneDonutChart = ({ data, isDark }: ZoneDonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 250 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const segmentAnglesRef = useRef<Array<{ startAngle: number; endAngle: number; data: { name: string; visitors: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: Math.min(containerRef.current.offsetWidth, 350), height: 250 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 800;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(1 - Math.pow(1 - progress, 3));
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 45;
    const innerRadius = outerRadius * 0.55;
    const total = data.reduce((sum, d) => sum + d.visitors, 0);
    ctx.clearRect(0, 0, width, height);
    
    let currentAngle = -Math.PI / 2;
    const angles: Array<{ startAngle: number; endAngle: number; data: { name: string; visitors: number } }> = [];
    
    const getColor = (idx: number, opacity: number) => {
      if (isDark) {
        const brightness = [0.85, 0.6, 0.4, 0.25, 0.15][idx] || 0.3;
        return `rgba(255, 255, 255, ${opacity * brightness})`;
      } else {
        const darkness = [0.9, 0.65, 0.45, 0.3, 0.18][idx] || 0.3;
        return `rgba(0, 0, 0, ${opacity * darkness})`;
      }
    };
    
    const maxAngle = Math.PI * 2 * animationProgress;
    let accumulatedAngle = 0;
    
    data.forEach((segment, idx) => {
      const fullSliceAngle = (segment.visitors / total) * Math.PI * 2;
      const remainingAngle = maxAngle - accumulatedAngle;
      if (remainingAngle <= 0) return;
      
      const sliceAngle = Math.min(fullSliceAngle, remainingAngle);
      const startAngle = currentAngle;
      const midAngle = currentAngle + fullSliceAngle / 2;
      
      if (animationProgress >= 1) {
        angles.push({ startAngle, endAngle: currentAngle + fullSliceAngle, data: segment });
      }
      
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, getColor(idx, 0.3));
      gradient.addColorStop(0.6, getColor(idx, 0.55));
      gradient.addColorStop(1, getColor(idx, 0.85));
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      if (sliceAngle >= fullSliceAngle - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(currentAngle + sliceAngle) * innerRadius, centerY + Math.sin(currentAngle + sliceAngle) * innerRadius);
        ctx.lineTo(centerX + Math.cos(currentAngle + sliceAngle) * outerRadius, centerY + Math.sin(currentAngle + sliceAngle) * outerRadius);
        ctx.stroke();
      }
      
      if (animationProgress >= 1) {
        const labelRadius = outerRadius + 22;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        const percent = ((segment.visitors / total) * 100).toFixed(0);
        ctx.font = '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        const displayName = segment.name.length > 6 ? segment.name.substring(0, 6) + '..' : segment.name;
        ctx.fillText(`${displayName} ${percent}%`, labelX, labelY);
      }
      
      currentAngle += fullSliceAngle;
      accumulatedAngle += fullSliceAngle;
    });
    
    segmentAnglesRef.current = angles;
    
    const displayTotal = Math.round(total * animationProgress);
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(displayTotal.toLocaleString(), centerX, centerY + 2);
    ctx.font = '500 8px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText('VISITORS', centerX, centerY + 16);
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 45;
    const innerRadius = outerRadius * 0.55;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= innerRadius && distance <= outerRadius) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const total = data.reduce((sum, d) => sum + d.visitors, 0);
      const segment = segmentAnglesRef.current.find(s => angle >= s.startAngle && angle < s.endAngle);
      if (segment) {
        const percent = ((segment.data.visitors / total) * 100).toFixed(1);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: segment.data.name, value: `${segment.data.visitors.toLocaleString()}명`, subValue: `전체의 ${percent}%` });
        return;
      }
    }
    setTooltip(null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function StoreTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { orgId } = useAuth();
  const { data: metrics } = useIntegratedMetrics();
  const { data: hourlyRawData } = useHourlyVisitors();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  // 시간대별 데이터 변환 (Context에서 제공하는 데이터 형식 → 차트 형식)
  const hourlyData = useMemo(() => {
    if (!hourlyRawData) return [];
    return hourlyRawData.map(d => ({
      hour: `${d.hour}시`,
      visitors: d.count,
    }));
  }, [hourlyRawData]);

  const { data: rawZoneMetrics } = useZoneMetricsByDateRange(selectedStore?.id, dateRange.startDate, dateRange.endDate);
  const { data: zonesDim } = useZonesDim(selectedStore?.id);

  const zoneData = useMemo(() => {
    if (!rawZoneMetrics || rawZoneMetrics.length === 0) return [];
    const zoneMap = new Map<string, { visitors: number; dwell: number; conversion: number; count: number }>();
    rawZoneMetrics.forEach((m: any) => {
      const existing = zoneMap.get(m.zone_id) || { visitors: 0, dwell: 0, conversion: 0, count: 0 };
      zoneMap.set(m.zone_id, {
        visitors: existing.visitors + (m.total_visitors || 0),
        dwell: existing.dwell + (m.avg_dwell_seconds || 0),
        conversion: existing.conversion + (m.conversion_count || 0),
        count: existing.count + 1,
      });
    });
    const zoneNameMap = new Map((zonesDim || []).map((z: any) => [z.id, z.zone_name || z.name || z.id]));
    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      name: zoneNameMap.get(zoneId) || zoneId.substring(0, 8),
      visitors: data.visitors,
      avgDwell: Math.round((data.dwell / Math.max(data.count, 1)) / 60),
      conversion: data.visitors > 0 ? ((data.conversion / data.visitors) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.visitors - a.visitors);
  }, [rawZoneMetrics, zonesDim]);

  const peakHour = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return null;
    return hourlyData.reduce((max, item) => (item.visitors > (max?.visitors || 0) ? item : max), hourlyData[0]);
  }, [hourlyData]);

  // 센서 커버율: 데이터가 있는 존 / 등록된 전체 존
  const trackedVisitors = useMemo(() => {
    if (!zoneData || zoneData.length === 0) return 0;
    return zoneData.reduce((sum, z) => sum + z.visitors, 0);
  }, [zoneData]);

  const trackingCoverage = useMemo(() => {
    const totalZones = zonesDim?.length || 0;
    if (totalZones === 0) return 0;
    const zonesWithData = zoneData?.filter(z => z.visitors > 0).length || 0;
    return (zonesWithData / totalZones) * 100;
  }, [zoneData, zonesDim]);

  // 평균 체류시간 계산 (분 단위)
  const avgDwellMinutes = useMemo(() => {
    if (metrics?.avgDwellTime) return Math.round(metrics.avgDwellTime / 60);
    if (zoneData?.length) return Math.round(zoneData.reduce((s, z) => s + z.avgDwell, 0) / zoneData.length);
    return 0;
  }, [metrics?.avgDwellTime, zoneData]);

  // screenDataStore에 동기화 — 챗봇이 프론트엔드 계산값을 그대로 사용
  const setStoreData = useScreenDataStore((s) => s.setStoreData);
  useEffect(() => {
    if (hourlyRawData && hourlyRawData.length > 0) {
      setStoreData(
        {
          peakHour: peakHour ? parseInt(peakHour.hour) : 0,
          peakVisitors: peakHour?.visitors || 0,
          popularZone: zoneData?.[0]?.name || '',
          popularZoneVisitors: zoneData?.[0]?.visitors || 0,
          avgDwellMinutes,
          trackingCoverage,
          hourlyPattern: hourlyRawData.map(d => ({ hour: d.hour, visitors: d.count })),
          zones: zoneData.map(z => ({
            name: z.name,
            visitors: z.visitors,
            avgDwellMinutes: z.avgDwell,
            conversionRate: `${z.conversion}%`,
          })),
        },
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
    }
  }, [hourlyRawData, zoneData, peakHour, avgDwellMinutes, trackingCoverage, setStoreData, dateRange.startDate, dateRange.endDate]);

  // KPI 카운트업 애니메이션
  const animatedPeakVisitors = useCountUp(peakHour?.visitors || 0, { duration: 1500 });
  const animatedZoneVisitors = useCountUp(zoneData?.[0]?.visitors || 0, { duration: 1500 });
  const animatedAvgDwell = useCountUp(avgDwellMinutes, { duration: 1500 });
  const animatedCoverage = useCountUp(trackingCoverage, { duration: 1500, decimals: 1 });
  const animatedTrackedVisitors = useCountUp(trackedVisitors, { duration: 1500 });

  return (
    <div className="space-y-6">
      <div id="store-kpi-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Clock className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>PEAK TIME</p><p style={{ fontSize: '12px', ...text3D.body }}>피크타임</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{peakHour?.hour || '0시'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{animatedPeakVisitors.toLocaleString()}명 방문</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><MapPin className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>POPULAR ZONE</p><p style={{ fontSize: '12px', ...text3D.body }}>인기 존</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{zoneData?.[0]?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{animatedZoneVisitors.toLocaleString()}회 방문</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Users className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>AVG DWELL TIME</p><p style={{ fontSize: '12px', ...text3D.body }}>평균 체류시간</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{animatedAvgDwell}분</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>전체 존 평균</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Radio className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>TRACKING COVERAGE</p><p style={{ fontSize: '12px', ...text3D.body }}>센서 커버율</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{animatedCoverage.toFixed(1)}%</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{animatedTrackedVisitors.toLocaleString()}명 추적</p>
          </div>
        </Glass3DCard>
      </div>

      {/* 센서 커버율 안내 배너 - 데이터 있을 때만 표시 */}
      {trackedVisitors > 0 && (metrics?.uniqueVisitors ?? 0) > 0 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            존 분석은 센서 감지 방문객 <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{trackedVisitors.toLocaleString()}명</span> 기준
            (전체 {metrics.uniqueVisitors.toLocaleString()}명의 <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{trackingCoverage.toFixed(0)}%</span>)
          </p>
        </div>
      )}

      <Glass3DCard dark={isDark}>
        <div id="store-hourly-pattern" className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>시간대별 방문 패턴</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>시간대별 입장 횟수</p>
          {hourlyData && hourlyData.some(h => h.visitors > 0) ? (
            <GlowHourlyBarChart data={hourlyData} isDark={isDark} />
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={text3D.body}>해당 기간에 방문 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div id="store-zone-dwell" className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>존별 체류시간</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>각 존별 평균 체류시간 (분)</p>
            {zoneData && zoneData.length > 0 ? (
              <GlowZoneDwellChart data={zoneData} isDark={isDark} />
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>존 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div id="store-zone-distribution" className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>존별 방문자 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>각 존별 방문자 비율 (중복 포함, 연 방문 기준)</p>
            {zoneData && zoneData.length > 0 ? (
              <GlowZoneDonutChart data={zoneData} isDark={isDark} />
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>존 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      <Glass3DCard dark={isDark}>
        <div id="store-zone-performance" className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>존별 성과 비교</h3>
          <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>방문자 수는 중복 포함 (1명이 여러 존 방문 시 각각 카운트)</p>
          {zoneData && zoneData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>존</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>방문자</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>체류시간</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData?.map((zone) => (
                    <tr key={zone.name} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{zone.name}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{zone.visitors.toLocaleString()}명</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{zone.avgDwell}분</td>
                      <td className="text-right py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: parseFloat(zone.conversion) > 20 ? (isDark ? 'rgba(255,255,255,0.2)' : '#1a1a1f') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                          color: parseFloat(zone.conversion) > 20 ? (isDark ? '#fff' : '#fff') : (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'),
                        }}>{zone.conversion}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 존 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
