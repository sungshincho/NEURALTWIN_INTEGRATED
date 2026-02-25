import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  product_name: string;
  sku: string;
  category: string | null;
  cost_price: number;
  price: number;
  supplier: string | null;
}

export interface InventoryLevel {
  id: string;
  product_id: string;
  current_stock: number;
  optimal_stock: number;
  minimum_stock: number;
  weekly_demand: number;
  last_updated: string;
  products: Product;
}

export interface OrderSuggestion {
  id: string;
  product_id: string;
  current_stock: number;
  optimal_stock: number;
  suggested_order_quantity: number;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_stockout_date: string | null;
  potential_revenue_loss: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
  created_at: string;
  products: Product;
}

export const useRealtimeInventory = () => {
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [orderSuggestions, setOrderSuggestions] = useState<OrderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch inventory levels
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_levels')
        .select(`
          *,
          products!inventory_levels_product_id_fkey (
            id,
            product_name,
            sku,
            category,
            cost_price,
            price,
            supplier
          )
        `)
        .order('current_stock', { ascending: true });

      if (inventoryError) throw inventoryError;

      // Fetch order suggestions
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('auto_order_suggestions')
        .select(`
          *,
          products (
            id,
            product_name,
            sku,
            category,
            cost_price,
            price,
            supplier
          )
        `)
        .eq('status', 'pending')
        .order('urgency_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;

      setInventoryLevels(inventory || []);
      setOrderSuggestions((suggestions || []) as OrderSuggestion[]);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "재고 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscriptions
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_levels'
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the full record with product data
            supabase
              .from('inventory_levels')
              .select(`
                *,
                products (
                  id,
                  name,
                  sku,
                  category,
                  cost_price,
                  selling_price,
                  supplier
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setInventoryLevels(prev => [...prev, data as any]);
                }
              });
          } else if (payload.eventType === 'UPDATE') {
            supabase
              .from('inventory_levels')
              .select(`
                *,
                products (
                  id,
                  name,
                  sku,
                  category,
                  cost_price,
                  selling_price,
                  supplier
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setInventoryLevels(prev => 
                    prev.map(item => item.id === data.id ? data as any : item)
                  );
                }
              });
          } else if (payload.eventType === 'DELETE') {
            setInventoryLevels(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const suggestionsChannel = supabase
      .channel('suggestions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auto_order_suggestions'
        },
        (payload) => {
          console.log('Order suggestion change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            supabase
              .from('auto_order_suggestions')
              .select(`
                *,
                products (
                  id,
                  name,
                  sku,
                  category,
                  cost_price,
                  selling_price,
                  supplier
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setOrderSuggestions(prev => [data as any, ...prev]);
                  
                  // Show toast notification for critical/high urgency
                  if (data.urgency_level === 'critical' || data.urgency_level === 'high') {
                    toast({
                      title: "긴급 발주 알림",
                      description: `${(data.products as any).name} - ${data.suggested_order_quantity}개 발주 필요`,
                      variant: data.urgency_level === 'critical' ? 'destructive' : 'default'
                    });
                  }
                }
              });
          } else if (payload.eventType === 'UPDATE') {
            supabase
              .from('auto_order_suggestions')
              .select(`
                *,
                products (
                  id,
                  name,
                  sku,
                  category,
                  cost_price,
                  selling_price,
                  supplier
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setOrderSuggestions(prev => 
                    prev.map(item => item.id === data.id ? data as any : item)
                  );
                }
              });
          } else if (payload.eventType === 'DELETE') {
            setOrderSuggestions(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(suggestionsChannel);
    };
  }, [toast]);

  const triggerMonitoring = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('inventory-monitor', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "재고 모니터링 완료",
        description: `${data.monitored}개 상품 확인, ${data.suggestionsCreated}개 발주 제안 생성`
      });

      return data;
    } catch (error) {
      console.error('Error triggering monitoring:', error);
      toast({
        title: "모니터링 실패",
        description: "재고 모니터링 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSuggestionStatus = async (
    suggestionId: string, 
    status: 'approved' | 'rejected' | 'ordered'
  ) => {
    try {
      const { error } = await supabase
        .from('auto_order_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

      toast({
        title: "상태 업데이트",
        description: `발주 제안이 ${status === 'approved' ? '승인' : status === 'rejected' ? '거부' : '발주 완료'}되었습니다.`
      });
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      toast({
        title: "업데이트 실패",
        description: "상태 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    inventoryLevels,
    orderSuggestions,
    isLoading,
    triggerMonitoring,
    updateSuggestionStatus,
    refetch: fetchData
  };
};