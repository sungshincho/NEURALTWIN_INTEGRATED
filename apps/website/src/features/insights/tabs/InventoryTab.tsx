/**
 * InventoryTab.tsx
 *
 * 인사이트 허브 - 재고 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 *
 * 주요 기능:
 * - 재고 현황 KPI 카드 (총 상품, 재고 부족, 과잉 재고, 정상 재고)
 * - 재고 상태 분포 도넛 차트
 * - 카테고리별 재고 현황 바 차트
 * - 재고 부족 경고 상품 목록
 * - 최근 입출고 내역
 * - 상세 재고 테이블
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useInventoryMetricsData } from '../context/InsightDataContext';
import { useCountUp } from '@/hooks/useCountUp';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    fontSize: '9px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

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
      position: 'absolute', left: data.x, top: data.y,
      transform: 'translate(-50%, -100%) translateY(-10px)',
      background: isDark
        ? 'linear-gradient(165deg, rgba(40,40,45,0.98) 0%, rgba(25,25,30,0.97) 100%)'
        : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
      pointerEvents: 'none', zIndex: 50, minWidth: '120px',
    }}>
      <p style={{ color: isDark ? '#fff' : '#1a1a1a', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{data.title}</p>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '12px' }}>{data.value}</p>
      {data.subValue && <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{data.subValue}</p>}
    </div>
  );
};

// 재고 상태 분포 글로우 도넛 차트 (고객 세그먼트 분포 스타일)
interface StockDistributionChartProps {
  data: { critical: number; low: number; normal: number; overstock: number };
  isDark: boolean;
}

const StockDistributionChart = ({ data, isDark }: StockDistributionChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 280 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const segmentAnglesRef = useRef<Array<{ startAngle: number; endAngle: number; data: { label: string; count: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  const segments = [
    { label: '위험', count: data.critical },
    { label: '부족', count: data.low },
    { label: '정상', count: data.normal },
    { label: '과잉', count: data.overstock },
  ];
  const total = data.critical + data.low + data.normal + data.overstock;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width: Math.min(width, 400), height: 280 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 애니메이션 시작
  useEffect(() => {
    if (total === 0) return;

    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 800; // 0.8초

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 50;
    const innerRadius = outerRadius * 0.52;

    ctx.clearRect(0, 0, width, height);

    let currentAngle = -Math.PI / 2;
    const angles: Array<{ startAngle: number; endAngle: number; data: { label: string; count: number } }> = [];

    // 모노크롬 색상 함수 (밝기로 세그먼트 구분)
    const getColor = (idx: number, opacity: number) => {
      if (isDark) {
        const brightness = [0.8, 0.55, 0.35, 0.18][idx] || 0.4;
        return `rgba(255, 255, 255, ${opacity * brightness})`;
      } else {
        const darkness = [0.85, 0.6, 0.4, 0.2][idx] || 0.4;
        return `rgba(0, 0, 0, ${opacity * darkness})`;
      }
    };

    // 애니메이션: 전체 각도를 progress에 따라 제한
    const maxAngle = Math.PI * 2 * animationProgress;
    let accumulatedAngle = 0;

    segments.forEach((segment, idx) => {
      if (segment.count === 0) return;

      const fullSliceAngle = (segment.count / total) * Math.PI * 2;
      const remainingAngle = maxAngle - accumulatedAngle;
      if (remainingAngle <= 0) return;

      const sliceAngle = Math.min(fullSliceAngle, remainingAngle);
      const startAngle = currentAngle;
      const midAngle = currentAngle + fullSliceAngle / 2;

      if (animationProgress >= 1) {
        angles.push({ startAngle, endAngle: currentAngle + fullSliceAngle, data: segment });
      }

      // 세그먼트 라디얼 그라데이션 (글로우 효과)
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, getColor(idx, 0.3));
      gradient.addColorStop(0.6, getColor(idx, 0.55));
      gradient.addColorStop(1, getColor(idx, 0.8));

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // 구분선 (완료된 세그먼트만)
      if (sliceAngle >= fullSliceAngle - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(currentAngle + sliceAngle) * innerRadius,
          centerY + Math.sin(currentAngle + sliceAngle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(currentAngle + sliceAngle) * outerRadius,
          centerY + Math.sin(currentAngle + sliceAngle) * outerRadius
        );
        ctx.stroke();
      }

      // 라벨 (애니메이션 완료 후, 도넛 바깥쪽에 표시)
      if (animationProgress >= 1) {
        const labelRadius = outerRadius + 28;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        const percent = ((segment.count / total) * 100).toFixed(0);

        ctx.font = '600 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        ctx.fillText(`${segment.label} ${percent}%`, labelX, labelY);
      }

      currentAngle += fullSliceAngle;
      accumulatedAngle += fullSliceAngle;
    });

    segmentAnglesRef.current = angles;

    // 중심 텍스트 (애니메이션 중에도 표시, 숫자는 카운트업)
    const displayTotal = Math.round(total * animationProgress);
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(displayTotal.toLocaleString(), centerX, centerY + 2);
    ctx.font = '500 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText('TOTAL', centerX, centerY + 18);

  }, [data, isDark, dimensions, animationProgress, total, segments]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 50;
    const innerRadius = outerRadius * 0.52;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= innerRadius && distance <= outerRadius) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;

      const segment = segmentAnglesRef.current.find(s => angle >= s.startAngle && angle < s.endAngle);

      if (segment) {
        const percent = ((segment.data.count / total) * 100).toFixed(1);
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          title: segment.data.label,
          value: `${segment.data.count.toLocaleString()}개`,
          subValue: `전체의 ${percent}%`,
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);

  if (total === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
        재고 데이터가 없습니다
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 카테고리별 재고 현황 바 차트
interface CategoryBarChartProps {
  data: Array<{ category: string; totalStock: number; lowStockItems: number; overstockItems: number }>;
  isDark: boolean;
}

const CategoryBarChart = ({ data, isDark }: CategoryBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 280 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: CategoryBarChartProps['data'][0] }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 280 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setProgress(0);
    const start = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - start) / 700, 1);
      setProgress(1 - Math.pow(1 - p, 4));
      if (p < 1) animationRef.current = requestAnimationFrame(animate);
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

    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;
    const baseY = height - pad.bottom;
    const max = Math.max(...data.map(d => d.totalStock)) * 1.1;
    const cnt = Math.min(data.length, 8);
    const bw = Math.min(50, (cw / cnt) * 0.6);
    const gap = cw / cnt;
    const bars: typeof barsRef.current = [];

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.font = '10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(Math.round((max / 4) * i).toLocaleString(), pad.left - 8, baseY - (ch / 4) * i + 3);
    }

    data.slice(0, cnt).forEach((item, idx) => {
      const x = pad.left + idx * gap + (gap - bw) / 2;
      const fh = (item.totalStock / max) * ch;
      const bh = fh * progress;
      const y = baseY - bh;
      bars.push({ x, y: baseY - fh, width: bw, height: fh, data: item });

      if (bh > 0) {
        // Bar gradient
        const grad = ctx.createLinearGradient(0, baseY, 0, y);
        if (isDark) {
          grad.addColorStop(0, 'rgba(255,255,255,0.1)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
          grad.addColorStop(1, 'rgba(255,255,255,0.6)');
        } else {
          grad.addColorStop(0, 'rgba(0,0,0,0.08)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
          grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, [4, 4, 0, 0]);
        ctx.fill();

        // Glow effect at top
        const gx = x + bw / 2, gy = y;
        const gc = isDark ? '255,255,255' : '0,0,0';
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12);
        glow.addColorStop(0, `rgba(${gc},${0.5 * progress})`);
        glow.addColorStop(0.5, `rgba(${gc},${0.12 * progress})`);
        glow.addColorStop(1, `rgba(${gc},0)`);
        ctx.beginPath();
        ctx.arc(gx, gy, 12, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.85 * progress})` : `rgba(0,0,0,${0.8 * progress})`;
        ctx.fill();
      }

      // X-axis labels
      ctx.font = '10px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.textAlign = 'center';
      const label = item.category.length > 6 ? item.category.slice(0, 6) + '..' : item.category;
      ctx.fillText(label, x + bw / 2, baseY + 18);
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, progress]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    setTooltip(bar ? {
      x, y,
      title: bar.data.category,
      value: `재고: ${bar.data.totalStock.toLocaleString()}개`,
      subValue: `부족: ${bar.data.lowStockItems} / 과잉: ${bar.data.overstockItems}`,
    } : null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
        카테고리 데이터가 없습니다
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={onMove}
        onMouseLeave={() => setTooltip(null)}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 상태 뱃지 컴포넌트
const StatusBadge = ({
  status,
  isDark,
}: {
  status: 'critical' | 'low' | 'normal' | 'overstock';
  isDark: boolean;
}) => {
  const config = {
    critical: { label: '위험', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    low: { label: '부족', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    normal: { label: '정상', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    overstock: { label: '과잉', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  };
  const c = config[status];
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {c.label}
    </span>
  );
};

// 긴급도 뱃지
const UrgencyBadge = ({
  urgency,
  isDark,
}: {
  urgency: 'critical' | 'high' | 'medium' | 'low';
  isDark: boolean;
}) => {
  const config = {
    critical: { label: '긴급', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    high: { label: '높음', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    medium: { label: '보통', bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
    low: { label: '낮음', bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' },
  };
  const c = config[urgency];
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {c.label}
    </span>
  );
};

// 이동 유형 아이콘
const MovementTypeIcon = ({ type, isDark }: { type: string; isDark: boolean }) => {
  const t = type.toLowerCase();
  if (t === 'purchase' || t === 'in' || t === '입고') {
    return <ArrowDownCircle className="h-4 w-4" style={{ color: '#22c55e' }} />;
  }
  if (t === 'sale' || t === 'out' || t === '출고') {
    return <ArrowUpCircle className="h-4 w-4" style={{ color: '#ef4444' }} />;
  }
  if (t === 'adjustment' || t === '조정') {
    return <RefreshCw className="h-4 w-4" style={{ color: '#3b82f6' }} />;
  }
  return <Package className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />;
};

export function InventoryTab() {
  const { data, isLoading, refetch, enableLoading } = useInventoryMetricsData();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  // 컴포넌트 마운트 시 데이터 로딩 활성화
  useEffect(() => {
    enableLoading();
  }, [enableLoading]);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';
  const [inventoryPage, setInventoryPage] = useState(0);

  // KPI 카운트업 애니메이션
  const animatedTotalProducts = useCountUp(data?.totalProducts || 0, { duration: 1500, enabled: !isLoading });
  const animatedLowStock = useCountUp(data?.lowStockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedCriticalStock = useCountUp(data?.criticalStockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedOverstock = useCountUp(data?.overstockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedHealthyStock = useCountUp(data?.healthyStockCount || 0, { duration: 1500, enabled: !isLoading });
  const healthyRatio = data?.totalProducts ? (data.healthyStockCount / data.totalProducts) * 100 : 0;
  const animatedHealthyRatio = useCountUp(healthyRatio, { duration: 1500, decimals: 1, enabled: !isLoading });

  // 데이터가 없는 경우
  if (!data && !isLoading) {
    return (
      <div className="space-y-6">
        <Glass3DCard dark={isDark}>
          <div className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px', ...text3D.number }}>재고 데이터가 없습니다</h3>
            <p style={{ fontSize: '14px', ...text3D.body }}>
              ERP 시스템을 연동하거나 데이터 컨트롤타워에서 재고 데이터를 가져오세요.
            </p>
          </div>
        </Glass3DCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div id="inventory-kpi-cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Package className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>TOTAL ITEMS</p><p style={{ fontSize: '12px', ...text3D.body }}>총 상품 수</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{animatedTotalProducts.toLocaleString()}개</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>관리 중인 SKU</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <AlertTriangle className="h-5 w-5" style={{ color: (data?.lowStockCount || 0) > 0 ? '#ef4444' : iconColor }} />
              </Icon3D>
              <div><p style={text3D.label}>LOW STOCK</p><p style={{ fontSize: '12px', ...text3D.body }}>재고 부족</p></div>
            </div>
            <p style={{
              fontSize: '28px',
              color: (data?.lowStockCount || 0) > 0 ? '#ef4444' : (isDark ? '#fff' : '#1a1a1f'),
              ...text3D.heroNumber
            }}>
              {animatedLowStock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
              위험 {animatedCriticalStock} / 부족 {animatedLowStock - animatedCriticalStock}
            </p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <TrendingUp className="h-5 w-5" style={{ color: (data?.overstockCount || 0) > 0 ? '#3b82f6' : iconColor }} />
              </Icon3D>
              <div><p style={text3D.label}>OVERSTOCK</p><p style={{ fontSize: '12px', ...text3D.body }}>과잉 재고</p></div>
            </div>
            <p style={{
              fontSize: '28px',
              color: (data?.overstockCount || 0) > 0 ? '#3b82f6' : (isDark ? '#fff' : '#1a1a1f'),
              ...text3D.heroNumber
            }}>
              {animatedOverstock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>적정 재고 대비 150% 초과</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <CheckCircle2 className="h-5 w-5" style={{ color: '#22c55e' }} />
              </Icon3D>
              <div><p style={text3D.label}>HEALTHY</p><p style={{ fontSize: '12px', ...text3D.body }}>정상 재고</p></div>
            </div>
            <p style={{ fontSize: '28px', color: '#22c55e', ...text3D.heroNumber }}>
              {animatedHealthyStock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
              {animatedHealthyRatio.toFixed(1)}% 정상 비율
            </p>
          </div>
        </Glass3DCard>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard id="inventory-distribution" dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>재고 상태 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>전체 상품의 재고 상태별 분포</p>
            <StockDistributionChart
              data={data?.stockDistribution || { critical: 0, low: 0, normal: 0, overstock: 0 }}
              isDark={isDark}
            />
          </div>
        </Glass3DCard>

        <Glass3DCard id="inventory-category" dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 재고 현황</h3>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>카테고리별 총 재고 수량</p>
            <CategoryBarChart data={data?.categoryBreakdown || []} isDark={isDark} />
          </div>
        </Glass3DCard>
      </div>

      {/* Risk Products & Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 재고 부족 경고 */}
        <Glass3DCard id="inventory-risk" dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '16px', ...text3D.number }}>재고 부족 경고</h3>
            </div>
            {data?.riskProducts && data.riskProducts.length > 0 ? (
              <div className="space-y-3">
                {data.riskProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f', fontSize: '13px' }} className="truncate">
                        {product.product_name}
                      </p>
                      <p style={{ fontSize: '11px', ...text3D.body }}>
                        현재 {product.current_stock}개 / 적정 {product.optimal_stock}개
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                          {product.days_until_stockout > 0 ? `D-${product.days_until_stockout}` : '품절 임박'}
                        </p>
                      </div>
                      <UrgencyBadge urgency={product.urgency} isDark={isDark} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" style={text3D.body}>
                재고 부족 상품이 없습니다
              </div>
            )}
          </div>
        </Glass3DCard>

        {/* 최근 입출고 내역 */}
        <Glass3DCard id="inventory-movements" dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
              <h3 style={{ fontSize: '16px', ...text3D.number }}>최근 입출고 내역</h3>
            </div>
            {data?.recentMovements && data.recentMovements.length > 0 ? (
              <div className="space-y-3">
                {data.recentMovements.slice(0, 5).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <MovementTypeIcon type={movement.movement_type} isDark={isDark} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f', fontSize: '13px' }} className="truncate">
                        {movement.product_name}
                      </p>
                      <p style={{ fontSize: '11px', ...text3D.body }}>
                        {movement.movement_type} · {new Date(movement.moved_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: movement.quantity >= 0 ? '#22c55e' : '#ef4444',
                      }}>
                        {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                      </p>
                      {movement.new_stock !== null && (
                        <p style={{ fontSize: '11px', ...text3D.body }}>
                          잔여 {movement.new_stock}개
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" style={text3D.body}>
                입출고 내역이 없습니다
              </div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* Detailed Inventory Table */}
      <Glass3DCard id="inventory-detail" dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>상세 재고 현황</h3>
          {data?.inventoryLevels && data.inventoryLevels.length > 0 ? (() => {
            const ITEMS_PER_PAGE = 10;
            const totalPages = Math.ceil(data.inventoryLevels.length / ITEMS_PER_PAGE);
            const safePage = Math.min(inventoryPage, totalPages - 1);
            const paginatedLevels = data.inventoryLevels.slice(
              safePage * ITEMS_PER_PAGE,
              (safePage + 1) * ITEMS_PER_PAGE
            );
            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                        <th className="text-left py-3 px-4" style={text3D.body}>상품명</th>
                        <th className="text-left py-3 px-4" style={text3D.body}>SKU</th>
                        <th className="text-left py-3 px-4" style={text3D.body}>카테고리</th>
                        <th className="text-right py-3 px-4" style={text3D.body}>현재고</th>
                        <th className="text-right py-3 px-4" style={text3D.body}>적정재고</th>
                        <th className="text-right py-3 px-4" style={text3D.body}>최소재고</th>
                        <th className="text-center py-3 px-4" style={text3D.body}>상태</th>
                        <th className="text-right py-3 px-4" style={text3D.body}>품절 예상</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLevels.map((item) => (
                        <tr
                          key={item.id}
                          style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}
                        >
                          <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>
                            {item.product_name}
                          </td>
                          <td className="py-3 px-4" style={text3D.body}>{item.sku || '-'}</td>
                          <td className="py-3 px-4">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              color: isDark ? 'rgba(255,255,255,0.8)' : '#6b7280',
                            }}>
                              {item.category || '기타'}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4" style={{
                            fontWeight: 600,
                            color: item.stock_status === 'critical' ? '#ef4444'
                              : item.stock_status === 'low' ? '#f97316'
                              : (isDark ? '#fff' : '#1a1a1f'),
                          }}>
                            {item.current_stock.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4" style={text3D.body}>{item.optimal_stock.toLocaleString()}</td>
                          <td className="text-right py-3 px-4" style={text3D.body}>{item.minimum_stock.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">
                            <StatusBadge status={item.stock_status} isDark={isDark} />
                          </td>
                          <td className="text-right py-3 px-4" style={{
                            color: item.days_until_stockout !== null && item.days_until_stockout <= 7 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280'),
                            fontWeight: item.days_until_stockout !== null && item.days_until_stockout <= 7 ? 600 : 400,
                          }}>
                            {item.days_until_stockout !== null ? `${item.days_until_stockout}일` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <button
                      onClick={() => setInventoryPage(p => Math.max(0, p - 1))}
                      disabled={safePage === 0}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: safePage === 0 ? 'not-allowed' : 'pointer',
                        background: safePage === 0
                          ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                          : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                        color: safePage === 0
                          ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')
                          : (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'),
                      }}
                    >
                      이전
                    </button>
                    <span style={{
                      fontSize: '12px',
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                    }}>
                      {safePage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setInventoryPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={safePage >= totalPages - 1}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                        background: safePage >= totalPages - 1
                          ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                          : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                        color: safePage >= totalPages - 1
                          ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')
                          : (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'),
                      }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            );
          })() : (
            <div className="py-8 text-center" style={text3D.body}>재고 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
