import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L2 line_items + L3 product_performance_agg 테이블 기반 상품 분석 Hook
 * Phase 3: 3-Layer Architecture
 */

export interface ProductPerformanceAgg {
  id: string;
  product_id: string;
  store_id: string;
  org_id: string;
  date: string;
  units_sold: number;
  revenue: number;
  transactions: number;
  conversion_rate: number;
  avg_selling_price: number;
  discount_rate: number;
  return_rate: number;
  stock_level: number;
  stockout_hours: number;
  category_rank: number;
  store_rank: number;
  calculated_at: string;
}

export function useProductPerformanceAgg(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['product-performance-agg', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('product_performance_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .order('revenue', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useTopProducts(storeId?: string, limit: number = 10, days: number = 7) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['top-products', storeId, limit, days],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      try {
        // 1차 시도: L3 product_performance_agg
        // limit(10000) 추가: 90일 × 25상품 = 2,250 rows, Supabase 기본 limit 1000 초과 방지
        const { data, error } = await supabase
          .from('product_performance_agg')
          .select('product_id, units_sold, revenue')
          .eq('org_id', orgId)
          .eq('store_id', storeId)
          .gte('date', startDate)
          .limit(10000);

        if (!error && data && data.length > 0) {
          // 제품별 집계
          const productMap = new Map<string, { units_sold: number; revenue: number }>();
          data.forEach(row => {
            const current = productMap.get(row.product_id) || { units_sold: 0, revenue: 0 };
            productMap.set(row.product_id, {
              units_sold: current.units_sold + (row.units_sold || 0),
              revenue: current.revenue + (row.revenue || 0),
            });
          });

          // 상위 N개 반환
          return Array.from(productMap.entries())
            .map(([product_id, stats]) => ({ product_id, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
        }

        // 2차 시도 (Fallback): L2 line_items
        const { data: lineData, error: lineError } = await supabase
          .from('line_items')
          .select('product_id, quantity, line_total')
          .eq('org_id', orgId)
          .eq('store_id', storeId)
          .gte('transaction_date', startDate);

        if (lineError || !lineData) {
          console.warn('[useTopProducts] Fallback query failed:', lineError);
          return [];
        }

        const productMap = new Map<string, { units_sold: number; revenue: number }>();
        lineData.forEach(row => {
          const current = productMap.get(row.product_id) || { units_sold: 0, revenue: 0 };
          productMap.set(row.product_id, {
            units_sold: current.units_sold + (row.quantity || 1),
            revenue: current.revenue + (row.line_total || 0),
          });
        });

        return Array.from(productMap.entries())
          .map(([product_id, stats]) => ({ product_id, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit);
      } catch (error) {
        console.error('[useTopProducts] Error:', error);
        return [];
      }
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useLineItems(storeId?: string, startDate?: Date, endDate?: Date) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['line-items', storeId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const start = startDate || subDays(new Date(), 7);
      const end = endDate || new Date();

      const { data, error } = await supabase
        .from('line_items')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useCategoryPerformance(storeId?: string, days: number = 7) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['category-performance', storeId, days],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      try {
        // 1차 시도: L3 product_performance_agg + products 테이블 조인
        // limit(10000) 추가: 90일 × 25상품 = 2,250 rows, Supabase 기본 limit 1000 초과 방지
        const { data: perfData, error: perfError } = await supabase
          .from('product_performance_agg')
          .select('product_id, units_sold, revenue')
          .eq('org_id', orgId)
          .eq('store_id', storeId)
          .gte('date', startDate)
          .limit(10000);

        if (!perfError && perfData && perfData.length > 0) {
          // L3 데이터 사용
          const productIds = [...new Set(perfData.map(d => d.product_id).filter(Boolean))];

          const { data: products } = await supabase
            .from('products')
            .select('id, category')
            .in('id', productIds);

          const productCategoryMap = new Map((products || []).map(p => [p.id, p.category || 'Unknown']));

          // 카테고리별 집계
          const categoryMap = new Map<string, { count: number; revenue: number }>();
          perfData.forEach(item => {
            const category = productCategoryMap.get(item.product_id) || 'Unknown';
            const current = categoryMap.get(category) || { count: 0, revenue: 0 };
            categoryMap.set(category, {
              count: current.count + (item.units_sold || 0),
              revenue: current.revenue + (item.revenue || 0),
            });
          });

          return Array.from(categoryMap.entries())
            .map(([category, stats]) => ({
              category,
              count: stats.count,
              revenue: stats.revenue,
              avgPrice: stats.count > 0 ? stats.revenue / stats.count : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
        }

        // 2차 시도 (Fallback): L2 line_items 사용
        const { data, error } = await supabase
          .from('line_items')
          .select('product_id, quantity, line_total')
          .eq('org_id', orgId)
          .eq('store_id', storeId)
          .gte('transaction_date', startDate);

        if (error) {
          console.warn('[useCategoryPerformance] line_items query failed:', error);
          return [];
        }

        if (!data || data.length === 0) return [];

        // 제품별 집계 후 products 테이블에서 카테고리 조회
        const productIds = [...new Set(data.map(d => d.product_id).filter(Boolean))];

        if (productIds.length === 0) return [];

        const { data: products } = await supabase
          .from('products')
          .select('id, category')
          .in('id', productIds);

        const productCategoryMap = new Map((products || []).map(p => [p.id, p.category || 'Unknown']));

        // 카테고리별 집계
        const categoryMap = new Map<string, { count: number; revenue: number }>();
        data.forEach(item => {
          const category = productCategoryMap.get(item.product_id) || 'Unknown';
          const current = categoryMap.get(category) || { count: 0, revenue: 0 };
          categoryMap.set(category, {
            count: current.count + (item.quantity || 1),
            revenue: current.revenue + (item.line_total || 0),
          });
        });

        return Array.from(categoryMap.entries())
          .map(([category, stats]) => ({
            category,
            count: stats.count,
            revenue: stats.revenue,
            avgPrice: stats.count > 0 ? stats.revenue / stats.count : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue);
      } catch (error) {
        console.error('[useCategoryPerformance] Error:', error);
        return [];
      }
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useHourlyRevenue(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hourly-revenue', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('line_items')
        .select('transaction_hour, line_total, quantity')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('transaction_date', targetDate);

      if (error) throw error;

      // 시간대별 집계
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        revenue: 0,
        count: 0,
      }));

      (data || []).forEach(item => {
        const hour = item.transaction_hour || 0;
        if (hour >= 0 && hour < 24) {
          hourlyData[hour].revenue += item.line_total || 0;
          hourlyData[hour].count += item.quantity || 1;
        }
      });

      return hourlyData;
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useWeeklyRevenue(storeId?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['weekly-revenue', storeId],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('line_items')
        .select('transaction_date, line_total, quantity')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('transaction_date', startDate);

      if (error) throw error;

      // 요일별 집계
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weeklyMap = new Map<string, { revenue: number; count: number }>();

      (data || []).forEach(item => {
        const dayIndex = new Date(item.transaction_date).getDay();
        const day = weekdays[dayIndex];
        const current = weeklyMap.get(day) || { revenue: 0, count: 0 };
        weeklyMap.set(day, {
          revenue: current.revenue + (item.line_total || 0),
          count: current.count + (item.quantity || 1),
        });
      });

      return weekdays.map(day => ({
        day,
        ...(weeklyMap.get(day) || { revenue: 0, count: 0 }),
      }));
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}
