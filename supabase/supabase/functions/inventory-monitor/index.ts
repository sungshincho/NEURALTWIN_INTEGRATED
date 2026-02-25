import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Monitoring inventory for user:', user.id);

    // Get all inventory levels with product details
    const { data: inventoryLevels, error: inventoryError } = await supabase
      .from('inventory_levels')
      .select(`
        *,
        products (
          id,
          name,
          sku,
          selling_price,
          lead_time_days,
          supplier
        )
      `)
      .eq('user_id', user.id);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      throw inventoryError;
    }

    console.log(`Found ${inventoryLevels?.length || 0} inventory items to monitor`);

    const suggestions = [];
    const now = new Date();

    for (const inventory of inventoryLevels || []) {
      const stockLevel = inventory.current_stock / inventory.optimal_stock;
      const daysUntilStockout = inventory.weekly_demand > 0 
        ? Math.floor(inventory.current_stock / (inventory.weekly_demand / 7))
        : 999;

      let urgencyLevel = 'low';
      let shouldCreateSuggestion = false;

      // Determine urgency level based on stock level and days until stockout
      if (inventory.current_stock <= inventory.minimum_stock || daysUntilStockout <= 3) {
        urgencyLevel = 'critical';
        shouldCreateSuggestion = true;
      } else if (stockLevel < 0.3 || daysUntilStockout <= 7) {
        urgencyLevel = 'high';
        shouldCreateSuggestion = true;
      } else if (stockLevel < 0.5 || daysUntilStockout <= 14) {
        urgencyLevel = 'medium';
        shouldCreateSuggestion = true;
      }

      if (shouldCreateSuggestion) {
        // Calculate suggested order quantity
        const deficit = inventory.optimal_stock - inventory.current_stock;
        const bufferStock = Math.ceil(inventory.weekly_demand * 0.5); // 50% buffer
        const suggestedQuantity = Math.max(deficit + bufferStock, 0);

        // Calculate potential revenue loss
        const product = inventory.products as any;
        const daysOfLoss = Math.max(daysUntilStockout - (product.lead_time_days || 7), 0);
        const dailyDemand = inventory.weekly_demand / 7;
        const potentialRevenueLoss = daysOfLoss * dailyDemand * (product.selling_price || 0);

        // Calculate estimated stockout date
        const stockoutDate = new Date(now);
        stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

        // Check if similar suggestion already exists and is pending
        const { data: existingSuggestions } = await supabase
          .from('auto_order_suggestions')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('product_id', inventory.product_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!existingSuggestions || existingSuggestions.length === 0) {
          // Create new suggestion
          const suggestion = {
            user_id: user.id,
            product_id: inventory.product_id,
            current_stock: inventory.current_stock,
            optimal_stock: inventory.optimal_stock,
            suggested_order_quantity: suggestedQuantity,
            urgency_level: urgencyLevel,
            estimated_stockout_date: stockoutDate.toISOString(),
            potential_revenue_loss: potentialRevenueLoss,
            status: 'pending'
          };

          const { data: created, error: createError } = await supabase
            .from('auto_order_suggestions')
            .insert(suggestion)
            .select()
            .single();

          if (createError) {
            console.error('Error creating suggestion:', createError);
          } else {
            console.log(`Created ${urgencyLevel} urgency suggestion for product ${product.name}`);
            suggestions.push(created);
          }
        } else {
          console.log(`Pending suggestion already exists for product ${product.name}`);
        }
      }
    }

    console.log(`Created ${suggestions.length} new order suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        monitored: inventoryLevels?.length || 0,
        suggestionsCreated: suggestions.length,
        suggestions: suggestions.map(s => ({
          product_id: s.product_id,
          urgency: s.urgency_level,
          quantity: s.suggested_order_quantity
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in inventory-monitor:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});