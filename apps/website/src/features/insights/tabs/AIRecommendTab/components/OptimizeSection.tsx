/**
 * OptimizeSection.tsx
 *
 * 2단계: 최적화 섹션
 * 3D Glassmorphism + Monochrome
 */

import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Package,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import type { PriceOptimization, InventoryOptimization } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

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
  const isDark = useDarkMode();

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
