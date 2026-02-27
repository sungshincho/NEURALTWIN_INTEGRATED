/**
 * OptimizeSection.tsx
 *
 * 2단계: 최적화 섹션
 * 3D Glassmorphism + Monochrome
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Package,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import type { PriceOptimization, InventoryOptimization } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

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
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
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
    display: 'inline-flex', alignItems: 'center', padding: '4px 8px',
    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: '6px', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    fontSize: '10px', fontWeight: 600,
  }}>
    {children}
  </div>
);

interface OptimizeSectionProps {
  priceOptimization: PriceOptimization | null;
  inventoryOptimization: InventoryOptimization | null;
  onViewDetails: (type: 'price' | 'inventory') => void;
  onApply: (type: 'price' | 'inventory') => void;
  isLoading?: boolean;
}

export function OptimizeSection({
  priceOptimization,
  inventoryOptimization,
  onViewDetails,
  onApply,
  isLoading,
}: OptimizeSectionProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: isDark ? '#fff' : '#374151',
        }}>2</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: isDark ? '#fff' : '#1a1a1f' }}>최적화 (Optimize)</h3>
      </div>

      {/* 2개 카드 그리드 */}
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

            {isLoading ? <LoadingSkeleton /> : priceOptimization ? (
              <>
                {/* 통계 */}
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

                {/* 잠재 수익 */}
                <div style={{
                  padding: '14px', borderRadius: '12px', marginBottom: '16px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>잠재 수익 증가</span>
                  </div>
                  <p style={{ fontSize: '20px', margin: '0 0 4px 0', color: '#22c55e', fontWeight: 800 }}>
                    +{priceOptimization.potentialRevenueIncreasePercent.toFixed(1)}%
                  </p>
                  <p style={{ fontSize: '11px', margin: 0, ...text3D.body }}>
                    예상 {formatCurrency(priceOptimization.potentialRevenueIncrease)} 추가 매출
                  </p>
                </div>

                {/* 추천 액션 */}
                {priceOptimization.actions.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', ...text3D.body }}>추천 액션</p>
                    {priceOptimization.actions.slice(0, 2).map((action) => (
                      <div key={action.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      }}>
                        <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#fff' : '#1a1a1f' }}>
                          {action.productName}
                        </span>
                        <Badge3D dark={isDark}>
                          <span style={{ color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                            {action.recommendedValue > action.currentValue ? '+' : ''}
                            {((action.recommendedValue - action.currentValue) / action.currentValue * 100).toFixed(0)}%
                          </span>
                        </Badge3D>
                      </div>
                    ))}
                  </div>
                )}

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onViewDetails('price')}
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
                    onClick={() => onApply('price')}
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '13px', ...text3D.body }}>분석할 상품 데이터가 없습니다</p>
              </div>
            )}
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

            {isLoading ? <LoadingSkeleton /> : inventoryOptimization ? (
              <>
                {/* 통계 */}
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

                {/* 품절 방지 / 과재고 감소 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    textAlign: 'center', padding: '14px', borderRadius: '12px',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>품절 방지</p>
                    <p style={{ fontSize: '20px', margin: 0, ...text3D.heroNumber }}>{inventoryOptimization.stockoutPrevention}건</p>
                  </div>
                  <div style={{
                    textAlign: 'center', padding: '14px', borderRadius: '12px',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <p style={{ fontSize: '11px', marginBottom: '4px', ...text3D.body }}>과재고 감소</p>
                    <p style={{ fontSize: '20px', margin: 0, ...text3D.heroNumber }}>{inventoryOptimization.overStockReduction}건</p>
                  </div>
                </div>

                {/* 추천 액션 */}
                {inventoryOptimization.actions.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', ...text3D.body }}>추천 액션</p>
                    {inventoryOptimization.actions.slice(0, 2).map((action) => (
                      <div key={action.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      }}>
                        <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#fff' : '#1a1a1f' }}>
                          {action.productName}
                        </span>
                        <span style={{ fontSize: '11px', ...text3D.body }}>+{action.recommendedValue}개 발주</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onViewDetails('inventory')}
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
                    onClick={() => onApply('inventory')}
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '13px', ...text3D.body }}>분석할 재고 데이터가 없습니다</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
