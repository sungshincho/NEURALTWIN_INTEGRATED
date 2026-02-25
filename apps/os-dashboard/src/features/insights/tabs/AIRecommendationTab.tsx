/**
 * AIRecommendationTab.tsx
 *
 * 인사이트 허브 - AI 추천 탭
 * AI 의사결정 허브 (예측 → 최적화 → 추천 → 실행 → 측정)
 * 3D Glassmorphism + Monochrome Design
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  Package,
  Target,
  Play,
  Settings,
  FlaskConical,
  Plus,
  ArrowRight,
  Minus,
  X,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useNavigate } from 'react-router-dom';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';
import type { SourceModule } from '@/features/roi/types/roi.types';

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

const GlassCard = ({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) => (
  <div style={{ perspective: '1200px', height: '100%' }} className={className}>
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

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 3);
    ctx.fill();

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

// ============================================================================
// 타입 정의
// ============================================================================
interface ActiveStrategy {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled';
  daysActive: number;
  expectedROI: number;
  currentROI: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
}

interface DemandForecast {
  predictedRevenue: number;
  predictedVisitors: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

interface PriceOptimization {
  totalProducts: number;
  optimizableCount: number;
  potentialRevenueIncreasePercent: number;
}

interface InventoryOptimization {
  totalItems: number;
  orderRecommendations: number;
  stockoutPrevention: number;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function AIRecommendationTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { data: recommendations = [], isLoading } = useAIRecommendations(selectedStore?.id);

  // 다크모드 감지
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const { toast } = useToast();

  // 적용 모달 상태
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyModalData, setApplyModalData] = useState<{
    source: '2d_simulation' | '3d_simulation';
    sourceModule: SourceModule;
    name: string;
    description?: string;
    settings: Record<string, any>;
    expectedRoi: number;
    expectedRevenue?: number;
    confidence?: number;
    baselineMetrics: Record<string, number>;
  } | null>(null);

  // H-5: 상세 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalData, setDetailModalData] = useState<{
    type: 'strategy' | 'price' | 'inventory' | 'settings';
    title: string;
    content: React.ReactNode;
  } | null>(null);

  // Mock 데이터
  const activeStrategies: ActiveStrategy[] = useMemo(() => [
    {
      id: '1',
      name: '겨울 패딩 10% 할인',
      status: 'active',
      daysActive: 3,
      expectedROI: 245,
      currentROI: 198,
      progress: 43,
      trend: 'up',
    },
  ], []);

  const demandForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 12.5,
  }), []);

  const visitorForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 8.3,
  }), []);

  const priceOptimization: PriceOptimization = useMemo(() => ({
    totalProducts: 156,
    optimizableCount: 23,
    potentialRevenueIncreasePercent: 15.2,
  }), []);

  const inventoryOptimization: InventoryOptimization = useMemo(() => ({
    totalItems: 89,
    orderRecommendations: 12,
    stockoutPrevention: 5,
  }), []);

  // 추천 전략 변환
  const strategyRecommendations = useMemo(() => {
    return recommendations
      .filter(r => r.status === 'pending')
      .slice(0, 3)
      .map((rec, index) => ({
        id: rec.id,
        rank: index + 1,
        title: rec.title,
        description: rec.description,
        confidence: rec.priority === 'high' ? 94 : rec.priority === 'medium' ? 87 : 75,
        targetAudience: '전체 고객',
        duration: 7,
        expectedResults: {
          revenueIncrease: rec.expected_impact?.revenue_increase || 0,
          conversionIncrease: 2.1,
          roi: rec.priority === 'high' ? 312 : rec.priority === 'medium' ? 187 : 120,
        },
        priority: rec.priority,
      }));
  }, [recommendations]);

  // 핸들러들
  const handleApplyPriceOptimization = () => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'price_optimization',
      name: `가격 최적화 (${priceOptimization.optimizableCount}개 상품)`,
      description: `${priceOptimization.optimizableCount}개 상품 가격 최적화로 ${priceOptimization.potentialRevenueIncreasePercent}% 매출 증가 예상`,
      settings: { totalProducts: priceOptimization.totalProducts },
      expectedRoi: Math.round(priceOptimization.potentialRevenueIncreasePercent * 10),
      confidence: 88,
      baselineMetrics: {
        totalProducts: priceOptimization.totalProducts,
        optimizableCount: priceOptimization.optimizableCount,
      },
    });
    setShowApplyModal(true);
  };

  const handleApplyInventoryOptimization = () => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'inventory_optimization',
      name: `재고 최적화 (${inventoryOptimization.orderRecommendations}건 발주)`,
      description: `${inventoryOptimization.stockoutPrevention}건 품절 방지`,
      settings: { totalItems: inventoryOptimization.totalItems },
      expectedRoi: 120,
      confidence: 90,
      baselineMetrics: {
        totalItems: inventoryOptimization.totalItems,
        orderRecommendations: inventoryOptimization.orderRecommendations,
      },
    });
    setShowApplyModal(true);
  };

  const handleApplyStrategy = (strategy: typeof strategyRecommendations[0]) => {
    setApplyModalData({
      source: '2d_simulation',
      sourceModule: 'ai_recommendation',
      name: strategy.title,
      description: strategy.description,
      settings: { strategyId: strategy.id, priority: strategy.priority },
      expectedRoi: strategy.expectedResults.roi,
      expectedRevenue: strategy.expectedResults.revenueIncrease,
      confidence: strategy.confidence,
      baselineMetrics: {
        conversionIncrease: strategy.expectedResults.conversionIncrease,
      },
    });
    setShowApplyModal(true);
  };

  // H-5: 새 전략 버튼 핸들러
  const handleNewStrategy = useCallback(() => {
    navigate('/studio', { state: { mode: 'create_strategy' } });
    toast({
      title: '전략 생성',
      description: '시뮬레이션 스튜디오에서 새 전략을 생성할 수 있습니다.',
    });
  }, [navigate, toast]);

  // H-5: 활성 전략 상세보기 핸들러
  const handleActiveStrategyDetail = useCallback((strategy: ActiveStrategy) => {
    setDetailModalData({
      type: 'strategy',
      title: strategy.name,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>상태</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>
                {strategy.status === 'active' ? '실행 중' : strategy.status === 'paused' ? '일시정지' : '예정됨'}
              </p>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>진행일</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>D+{strategy.daysActive}</p>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>예상 ROI</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.expectedROI}%</p>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>현재 ROI</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: strategy.currentROI >= strategy.expectedROI ? '#22c55e' : '#ef4444' }}>
                {strategy.currentROI}%
              </p>
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: '11px', marginBottom: '8px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>진행률</p>
            <div style={{ height: '8px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${strategy.progress}%`, background: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)', borderRadius: '4px' }} />
            </div>
            <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.progress}%</p>
          </div>
        </div>
      ),
    });
    setShowDetailModal(true);
  }, [isDark]);

  // H-5: 최적화 상세보기 핸들러
  const handleOptimizationDetail = useCallback((type: 'price' | 'inventory') => {
    if (type === 'price') {
      setDetailModalData({
        type: 'price',
        title: '가격 최적화 상세',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>
              AI가 분석한 {priceOptimization.totalProducts}개 상품 중 {priceOptimization.optimizableCount}개의 가격 조정이 권장됩니다.
            </p>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#22c55e10', border: '1px solid #22c55e30' }}>
              <p style={{ fontSize: '12px', color: '#22c55e' }}>예상 효과: 매출 +{priceOptimization.potentialRevenueIncreasePercent}%</p>
            </div>
            <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
              상세 분석 결과는 가격 최적화 페이지에서 확인할 수 있습니다.
            </p>
          </div>
        ),
      });
    } else {
      setDetailModalData({
        type: 'inventory',
        title: '재고 최적화 상세',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>
              {inventoryOptimization.totalItems}개 품목 분석 결과, {inventoryOptimization.orderRecommendations}건의 발주가 권장됩니다.
            </p>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#ef444410', border: '1px solid #ef444430' }}>
              <p style={{ fontSize: '12px', color: '#ef4444' }}>품절 위험: {inventoryOptimization.stockoutPrevention}건 예방 가능</p>
            </div>
            <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
              상세 분석 결과는 재고 관리 페이지에서 확인할 수 있습니다.
            </p>
          </div>
        ),
      });
    }
    setShowDetailModal(true);
  }, [isDark, priceOptimization, inventoryOptimization]);

  // H-5: 전략 상세 설정 핸들러
  const handleStrategySettings = useCallback((strategy: typeof strategyRecommendations[0]) => {
    setDetailModalData({
      type: 'settings',
      title: `${strategy.title} 설정`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: '11px', marginBottom: '4px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>대상 고객</p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.targetAudience}</p>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: '11px', marginBottom: '4px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>실행 기간</p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.duration}일</p>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: '11px', marginBottom: '4px', color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>신뢰도</p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.confidence}%</p>
          </div>
          <p style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
            상세 설정을 변경하려면 시뮬레이션 스튜디오를 이용해주세요.
          </p>
        </div>
      ),
    });
    setShowDetailModal(true);
  }, [isDark]);

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} dark={isDark}>
              <div style={{ padding: '24px' }}>
                <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '16px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', width: '50%' }} />
                  <div style={{ height: '32px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', width: '75%' }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 헤더 */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
          <Sparkles className="h-5 w-5" style={{ color: iconColor }} />
          AI 의사결정 허브
        </h2>
        <p style={{ fontSize: '13px', marginTop: '4px', ...text3D.body }}>
          데이터 기반 예측 → 최적화 → 추천 → 실행 → 측정
        </p>
      </div>

      {/* 진행 중인 전략 */}
      <div id="ai-active-strategies">
      <GlassCard dark={isDark}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', margin: 0, ...text3D.number }}>진행 중인 전략</h3>
              <Badge3D dark={isDark}><span style={{ color: isDark ? '#fff' : '#374151' }}>{activeStrategies.length}</span></Badge3D>
            </div>
            <button
              onClick={handleNewStrategy}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderRadius: '8px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f', cursor: 'pointer',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: iconColor }} />
              새 전략
            </button>
          </div>

          {activeStrategies.map((strategy) => (
            <div key={strategy.id} style={{
              padding: '14px', borderRadius: '14px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Badge3D dark={isDark}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>실행 중</span>
                    </Badge3D>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', ...text3D.body }}>
                    <span>D+{strategy.daysActive}</span>
                    <span>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      예상 ROI: {strategy.expectedROI}%
                      <ArrowRight className="w-3 h-3" style={{ color: iconColor }} />
                      <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>현재: {strategy.currentROI}%</span>
                      {strategy.trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} />}
                      {strategy.trend === 'down' && <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />}
                      {strategy.trend === 'stable' && <Minus className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleActiveStrategyDetail(strategy)}
                  style={{
                    padding: '6px 10px', borderRadius: '6px', border: 'none',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.7)' : '#515158', cursor: 'pointer',
                  }}
                >
                  상세보기
                </button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <GlowProgressBar progress={strategy.progress} isDark={isDark} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      </div>

      {/* 구분선 */}
      <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />

      {/* 1단계: 예측 */}
      <div id="ai-predict" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
          }}>1</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>예측 (Predict)</h3>
        </div>

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
              <p style={{ fontSize: '22px', margin: '0 0 4px 0', ...text3D.heroNumber }}>
                {formatCurrency(demandForecast.predictedRevenue)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {demandForecast.percentChange > 0 ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} /> :
                 demandForecast.percentChange < 0 ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> :
                 <Minus className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
                <span style={{ fontSize: '12px', fontWeight: 500, color: demandForecast.percentChange > 0 ? '#22c55e' : demandForecast.percentChange < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
                  전주 대비 {demandForecast.percentChange > 0 ? '+' : ''}{demandForecast.percentChange}%
                </span>
              </div>
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
              <p style={{ fontSize: '22px', margin: '0 0 4px 0', ...text3D.heroNumber }}>
                {visitorForecast.predictedVisitors.toLocaleString()}명
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {visitorForecast.percentChange > 0 ? <TrendingUp className="w-3 h-3" style={{ color: '#22c55e' }} /> :
                 visitorForecast.percentChange < 0 ? <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} /> :
                 <Minus className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />}
                <span style={{ fontSize: '12px', fontWeight: 500, color: visitorForecast.percentChange > 0 ? '#22c55e' : visitorForecast.percentChange < 0 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280') }}>
                  전주 대비 {visitorForecast.percentChange > 0 ? '+' : ''}{visitorForecast.percentChange}%
                </span>
              </div>
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
              <p style={{ fontSize: '18px', margin: '0 0 4px 0', ...text3D.number }}>12월 성수기</p>
              <p style={{ fontSize: '12px', ...text3D.body }}>예상 피크: 12/20-25</p>
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
              <p style={{ fontSize: '11px', marginBottom: '12px', ...text3D.body }}>위험 요소</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge3D dark={isDark}>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>높음</span>
                </Badge3D>
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>2건</span>
              </div>
              <p style={{ fontSize: '12px', ...text3D.body }}>재고 부족 위험: 3품목</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />

      {/* 2단계: 최적화 */}
      <div id="ai-optimize" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
          }}>2</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>최적화 (Optimize)</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 가격 최적화 */}
          <GlassCard dark={isDark}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Icon3D size={32} dark={isDark}>
                  <DollarSign className="h-4 w-4" style={{ color: iconColor }} />
                </Icon3D>
                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>가격 최적화</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  textAlign: 'center', padding: '12px', borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>분석 대상</p>
                  <p style={{ fontSize: '18px', margin: 0, ...text3D.number }}>{priceOptimization.totalProducts}개</p>
                </div>
                <div style={{
                  textAlign: 'center', padding: '12px', borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>최적화 가능</p>
                  <p style={{ fontSize: '18px', margin: 0, ...text3D.number }}>{priceOptimization.optimizableCount}개</p>
                </div>
              </div>

              <div style={{
                padding: '14px', borderRadius: '12px', marginBottom: '16px',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>잠재 수익 증가</span>
                </div>
                <p style={{ fontSize: '20px', margin: 0, color: '#22c55e', fontWeight: 800 }}>
                  +{priceOptimization.potentialRevenueIncreasePercent}%
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOptimizationDetail('price')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                    fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f', cursor: 'pointer',
                  }}
                >
                  상세 보기
                </button>
                <button
                  onClick={handleApplyPriceOptimization}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    color: isDark ? '#fff' : '#1a1a1f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <CheckCircle className="w-3 h-3" /> 적용
                </button>
              </div>
            </div>
          </GlassCard>

          {/* 재고 최적화 */}
          <GlassCard dark={isDark}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Icon3D size={32} dark={isDark}>
                  <Package className="h-4 w-4" style={{ color: iconColor }} />
                </Icon3D>
                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>재고 최적화</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  textAlign: 'center', padding: '12px', borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>분석 대상</p>
                  <p style={{ fontSize: '18px', margin: 0, ...text3D.number }}>{inventoryOptimization.totalItems}개</p>
                </div>
                <div style={{
                  textAlign: 'center', padding: '12px', borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                }}>
                  <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>발주 추천</p>
                  <p style={{ fontSize: '18px', margin: 0, ...text3D.number }}>{inventoryOptimization.orderRecommendations}건</p>
                </div>
              </div>

              <div style={{
                textAlign: 'center', padding: '14px', borderRadius: '12px', marginBottom: '16px',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
              }}>
                <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>품절 방지</p>
                <p style={{ fontSize: '20px', margin: 0, ...text3D.heroNumber }}>{inventoryOptimization.stockoutPrevention}건</p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOptimizationDetail('inventory')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                    fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f', cursor: 'pointer',
                  }}
                >
                  상세 보기
                </button>
                <button
                  onClick={handleApplyInventoryOptimization}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                    border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    color: isDark ? '#fff' : '#1a1a1f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  <CheckCircle className="w-3 h-3" /> 적용
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />

      {/* 3단계: 추천 */}
      <div id="ai-recommend" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
          }}>3</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>추천 전략 (Recommend)</h3>
        </div>

        <GlassCard dark={isDark}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon3D size={36} dark={isDark}>
                  <Sparkles className="h-4 w-4" style={{ color: iconColor }} />
                </Icon3D>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>이번 주 AI 추천 전략</h4>
                  <p style={{ fontSize: '12px', margin: '2px 0 0 0', ...text3D.body }}>데이터 분석 기반 최적 전략 추천</p>
                </div>
              </div>
              <Badge3D dark={isDark}>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>신뢰도 기준</span>
              </Badge3D>
            </div>

            {strategyRecommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {strategyRecommendations.map((strategy) => (
                  <div key={strategy.id} style={{
                    padding: '16px', borderRadius: '16px',
                    borderLeft: isDark ? '4px solid rgba(255,255,255,0.3)' : '4px solid rgba(0,0,0,0.15)',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Badge3D dark={isDark}>
                          <span style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#374151', fontWeight: 700 }}>{strategy.rank}위</span>
                        </Badge3D>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>{strategy.title}</h4>
                          <p style={{ fontSize: '12px', marginTop: '4px', ...text3D.body }}>{strategy.description}</p>
                        </div>
                      </div>
                      <Badge3D dark={isDark}>
                        <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>신뢰도 {strategy.confidence}%</span>
                      </Badge3D>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...text3D.body }}>
                        <Target className="w-3 h-3" style={{ color: iconColor }} />
                        {strategy.targetAudience}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...text3D.body }}>
                        <Calendar className="w-3 h-3" style={{ color: iconColor }} />
                        {strategy.duration}일
                      </div>
                    </div>

                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
                      padding: '12px', borderRadius: '12px', marginBottom: '12px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>추가 매출</p>
                        <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
                          +{formatCurrency(strategy.expectedResults.revenueIncrease)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)', borderRight: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>전환율 증가</p>
                        <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
                          +{strategy.expectedResults.conversionIncrease}%p
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '10px', marginBottom: '4px', ...text3D.body }}>예상 ROI</p>
                        <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: isDark ? '#fff' : '#1a1a1f' }}>
                          {strategy.expectedResults.roi}%
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStrategySettings(strategy)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px',
                          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                          fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#515158',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}
                      >
                        <Settings className="w-3 h-3" /> 상세 설정
                      </button>
                      <button
                        onClick={() => handleApplyStrategy(strategy)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px',
                          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                          border: 'none', fontSize: '11px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}
                      >
                        <Play className="w-3 h-3" /> 실행하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Sparkles className="h-12 w-12" style={{ margin: '0 auto 12px', color: isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db' }} />
                <p style={{ fontSize: '14px', ...text3D.body }}>추천 전략을 분석 중입니다</p>
                <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                  충분한 데이터가 수집되면 AI가 전략을 추천합니다
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ROI 측정 바로가기 */}
      <div id="ai-execute" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', borderRadius: '16px',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: isDark ? '1px dashed rgba(255,255,255,0.15)' : '1px dashed rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 className="h-8 w-8" style={{ margin: '0 auto 12px', color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
          <p style={{ fontSize: '13px', marginBottom: '12px', ...text3D.body }}>
            적용된 전략의 ROI를 측정하고 성과를 추적하세요
          </p>
          <button
            onClick={() => navigate('/roi')}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
              fontSize: '13px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: iconColor }} />
            ROI 측정 대시보드 바로가기
          </button>
        </div>
      </div>

      {/* 적용 전략 모달 */}
      {showApplyModal && applyModalData && (
        <ApplyStrategyModal
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            setApplyModalData(null);
          }}
          strategyData={applyModalData}
        />
      )}

      {/* H-5: 상세 정보 모달 */}
      {showDetailModal && detailModalData && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              maxWidth: '400px', width: '90%', padding: '24px', borderRadius: '16px',
              background: isDark ? '#1e1e2a' : '#fff',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>
                {detailModalData.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
              </button>
            </div>
            {detailModalData.content}
          </div>
        </div>
      )}
    </div>
  );
}
