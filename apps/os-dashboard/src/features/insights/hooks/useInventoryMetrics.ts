/**
 * useInventoryMetrics.ts
 *
 * 재고/ERP 데이터 메트릭 조회 훅
 * - inventory_levels 테이블에서 재고 수준 조회
 * - inventory_movements 테이블에서 입출고 내역 조회
 * - 재고 건강 지표 계산 (재고 부족, 과잉 재고, 회전율 등)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { useDateFilterStore } from '@/store/dateFilterStore';

// ============================================================================
// 타입 정의
// ============================================================================

export interface InventoryLevel {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string | null;
  current_stock: number;
  optimal_stock: number;
  minimum_stock: number;
  weekly_demand: number;
  days_until_stockout: number | null;
  stock_status: 'critical' | 'low' | 'normal' | 'overstock';
  last_updated: string | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  previous_stock: number | null;
  new_stock: number | null;
  reason: string | null;
  reference_id: string | null;
  moved_at: string;
}

export interface InventoryMetrics {
  // KPI 지표
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  overstockCount: number;
  criticalStockCount: number;
  healthyStockCount: number;
  avgTurnoverRate: number;

  // 상태별 분포
  stockDistribution: {
    critical: number;
    low: number;
    normal: number;
    overstock: number;
  };

  // 카테고리별 재고 현황
  categoryBreakdown: Array<{
    category: string;
    totalStock: number;
    lowStockItems: number;
    overstockItems: number;
  }>;

  // 재고 수준 목록
  inventoryLevels: InventoryLevel[];

  // 최근 입출고 내역
  recentMovements: InventoryMovement[];

  // 위험 상품 목록 (재고 부족)
  riskProducts: Array<{
    product_id: string;
    product_name: string;
    current_stock: number;
    optimal_stock: number;
    days_until_stockout: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// 재고 상태 계산 헬퍼
// ============================================================================

function calculateStockStatus(
  current: number,
  optimal: number,
  minimum: number
): 'critical' | 'low' | 'normal' | 'overstock' {
  if (current <= minimum) return 'critical';
  if (current < optimal * 0.5) return 'low';
  if (current > optimal * 1.5) return 'overstock';
  return 'normal';
}

function calculateDaysUntilStockout(
  current: number,
  weeklyDemand: number
): number | null {
  if (!weeklyDemand || weeklyDemand <= 0) return null;
  const dailyDemand = weeklyDemand / 7;
  return Math.floor(current / dailyDemand);
}

function getUrgencyLevel(
  daysUntilStockout: number | null
): 'critical' | 'high' | 'medium' | 'low' {
  if (daysUntilStockout === null) return 'low';
  if (daysUntilStockout <= 3) return 'critical';
  if (daysUntilStockout <= 7) return 'high';
  if (daysUntilStockout <= 14) return 'medium';
  return 'low';
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useInventoryMetrics() {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const { dateRange } = useDateFilterStore();

  const storeId = selectedStore?.id;

  return useQuery<InventoryMetrics | null>({
    queryKey: ['inventory-metrics', storeId, orgId, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!orgId) return null;

      // 1. 재고 수준 조회 (별도 쿼리 후 병합)
      const { data: levelsData, error: levelsError } = await supabase
        .from('inventory_levels')
        .select('id, product_id, current_stock, optimal_stock, minimum_stock, weekly_demand, last_updated')
        .eq('org_id', orgId)
        .limit(1000);

      if (levelsError) {
        console.error('[useInventoryMetrics] Levels error:', levelsError);
      }

      // 1-1. 상품 정보 별도 조회 (product_id 기준)
      const productIds = [...new Set((levelsData || []).map((l: any) => l.product_id).filter(Boolean))];
      let productsMap: Record<string, { product_name: string; sku: string; category: string | null; price: number | null }> = {};

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, product_name, sku, category, price')
          .in('id', productIds);

        if (productsError) {
          console.error('[useInventoryMetrics] Products error:', productsError);
        }

        productsMap = (productsData || []).reduce((acc: any, p: any) => {
          acc[p.id] = { product_name: p.product_name, sku: p.sku, category: p.category, price: p.price };
          return acc;
        }, {});
      }

      // 2. 최근 입출고 내역 조회 (별도 쿼리)
      const { data: movementsData, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('id, product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id, moved_at')
        .eq('org_id', orgId)
        .gte('moved_at', dateRange.startDate)
        .lte('moved_at', dateRange.endDate)
        .order('moved_at', { ascending: false })
        .limit(100);

      if (movementsError) {
        console.error('[useInventoryMetrics] Movements error:', movementsError);
      }

      // 2-1. 입출고 내역의 상품 정보 조회
      const movementProductIds = [...new Set((movementsData || []).map((m: any) => m.product_id).filter(Boolean))];
      const missingProductIds = movementProductIds.filter(id => !productsMap[id]);

      if (missingProductIds.length > 0) {
        const { data: moreProductsData } = await supabase
          .from('products')
          .select('id, product_name, sku, category, price')
          .in('id', missingProductIds);

        (moreProductsData || []).forEach((p: any) => {
          productsMap[p.id] = { product_name: p.product_name, sku: p.sku, category: p.category, price: p.price };
        });
      }

      // 3. 데이터 가공
      const inventoryLevels: InventoryLevel[] = (levelsData || []).map((level: any) => {
        const product = (productsMap[level.product_id] || {}) as { product_name?: string; sku?: string; category?: string | null; price?: number | null };
        const daysUntilStockout = calculateDaysUntilStockout(
          level.current_stock,
          level.weekly_demand
        );

        return {
          id: level.id,
          product_id: level.product_id,
          product_name: product.product_name || 'Unknown',
          sku: product.sku || '',
          category: product.category || null,
          current_stock: level.current_stock || 0,
          optimal_stock: level.optimal_stock || 0,
          minimum_stock: level.minimum_stock || 0,
          weekly_demand: level.weekly_demand || 0,
          days_until_stockout: daysUntilStockout,
          stock_status: calculateStockStatus(
            level.current_stock || 0,
            level.optimal_stock || 0,
            level.minimum_stock || 0
          ),
          last_updated: level.last_updated,
        };
      });

      const recentMovements: InventoryMovement[] = (movementsData || []).map((mov: any) => ({
        id: mov.id,
        product_id: mov.product_id,
        product_name: productsMap[mov.product_id]?.product_name || 'Unknown',
        movement_type: mov.movement_type,
        quantity: mov.quantity,
        previous_stock: mov.previous_stock,
        new_stock: mov.new_stock,
        reason: mov.reason,
        reference_id: mov.reference_id,
        moved_at: mov.moved_at,
      }));

      // 4. KPI 계산
      const stockDistribution = {
        critical: inventoryLevels.filter(l => l.stock_status === 'critical').length,
        low: inventoryLevels.filter(l => l.stock_status === 'low').length,
        normal: inventoryLevels.filter(l => l.stock_status === 'normal').length,
        overstock: inventoryLevels.filter(l => l.stock_status === 'overstock').length,
      };

      // 카테고리별 집계
      const categoryMap = new Map<string, { totalStock: number; lowStockItems: number; overstockItems: number }>();
      inventoryLevels.forEach(level => {
        const cat = level.category || '기타';
        const current = categoryMap.get(cat) || { totalStock: 0, lowStockItems: 0, overstockItems: 0 };
        categoryMap.set(cat, {
          totalStock: current.totalStock + level.current_stock,
          lowStockItems: current.lowStockItems + (level.stock_status === 'low' || level.stock_status === 'critical' ? 1 : 0),
          overstockItems: current.overstockItems + (level.stock_status === 'overstock' ? 1 : 0),
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.totalStock - a.totalStock);

      // 위험 상품 목록
      const riskProducts = inventoryLevels
        .filter(l => l.stock_status === 'critical' || l.stock_status === 'low')
        .map(l => ({
          product_id: l.product_id,
          product_name: l.product_name,
          current_stock: l.current_stock,
          optimal_stock: l.optimal_stock,
          days_until_stockout: l.days_until_stockout || 0,
          urgency: getUrgencyLevel(l.days_until_stockout),
        }))
        .sort((a, b) => a.days_until_stockout - b.days_until_stockout)
        .slice(0, 10);

      // 재고 가치 계산 (products.price 기준 - 실제로는 원가 사용 필요)
      // 여기서는 임시로 재고 수량만 표시
      const totalStockValue = inventoryLevels.reduce((sum, l) => sum + l.current_stock, 0);

      // 회전율 계산 (판매량 / 평균 재고)
      // 실제로는 transactions 데이터와 연동 필요, 여기서는 임시 값
      const avgTurnoverRate = 0; // TODO: 실제 계산 로직 추가

      return {
        totalProducts: inventoryLevels.length,
        totalStockValue,
        lowStockCount: stockDistribution.critical + stockDistribution.low,
        overstockCount: stockDistribution.overstock,
        criticalStockCount: stockDistribution.critical,
        healthyStockCount: stockDistribution.normal,
        avgTurnoverRate,
        stockDistribution,
        categoryBreakdown,
        inventoryLevels,
        recentMovements,
        riskProducts,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

// ============================================================================
// 개별 조회 훅들
// ============================================================================

/**
 * 재고 수준만 조회
 */
export function useInventoryLevels() {
  const { data, isLoading, error, refetch } = useInventoryMetrics();
  return {
    data: data?.inventoryLevels || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 최근 입출고 내역만 조회
 */
export function useRecentMovements() {
  const { data, isLoading, error, refetch } = useInventoryMetrics();
  return {
    data: data?.recentMovements || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 위험 상품 목록만 조회
 */
export function useRiskProducts() {
  const { data, isLoading, error, refetch } = useInventoryMetrics();
  return {
    data: data?.riskProducts || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 재고 상태 분포만 조회
 */
export function useStockDistribution() {
  const { data, isLoading, error } = useInventoryMetrics();
  return {
    data: data?.stockDistribution || { critical: 0, low: 0, normal: 0, overstock: 0 },
    isLoading,
    error,
  };
}
