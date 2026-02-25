import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Note: This function aggregates KPIs from user data, not admin-only
    // No NEURALTWIN_ADMIN check needed - regular users can aggregate their own data

    const { store_id, user_id, start_date, end_date } = await req.json();
    console.log('📊 Aggregating KPIs for store:', { store_id, user_id, start_date, end_date });

    // 온톨로지에서 모든 방문/구매 데이터의 날짜 범위 파악
    const { data: entityTypes } = await supabaseClient
      .from('ontology_entity_types')
      .select('id, name')
      .eq('user_id', user.id)
      .in('name', ['visit', 'purchase']);

    const visitTypeId = entityTypes?.find(t => t.name === 'visit')?.id;
    const purchaseTypeId = entityTypes?.find(t => t.name === 'purchase')?.id;

    if (!visitTypeId || !purchaseTypeId) {
      console.log('⚠️ Visit or Purchase entity types not found, using CSV dates');
    }

    // 모든 방문/구매 엔티티 가져오기
    const { data: allEntities } = await supabaseClient
      .from('graph_entities')
      .select('properties, created_at')
      .eq('user_id', user.id)
      .or(`entity_type_id.eq.${visitTypeId},entity_type_id.eq.${purchaseTypeId}`);

    // 날짜별로 그룹화
    const dateMap = new Map<string, { visits: any[], purchases: any[] }>();

    allEntities?.forEach(entity => {
      const props = entity.properties as any;
      let dateStr: string | null = null;

      // visit_date 또는 purchase_date 추출
      if (props?.visit_date) {
        dateStr = props.visit_date.split('T')[0];
      } else if (props?.purchase_date) {
        dateStr = props.purchase_date.split('T')[0];
      }

      if (dateStr) {
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { visits: [], purchases: [] });
        }
        const entry = dateMap.get(dateStr)!;
        
        // visit인지 purchase인지 구분
        if (props?.visit_date) {
          entry.visits.push(entity);
        }
        if (props?.purchase_date) {
          entry.purchases.push(entity);
        }
      }
    });

    console.log(`📅 Found ${dateMap.size} unique dates in data`);

    // 매장 정보 가져오기
    const { data: storeData } = await supabaseClient
      .from('stores')
      .select('metadata')
      .eq('id', store_id)
      .single();

    const storeMetadata = storeData?.metadata as any;
    const storeArea = storeMetadata?.area || 100;

    // 각 날짜별로 KPI 집계 (날짜 범위 필터링)
    const kpiResults = [];
    for (const [date, data] of dateMap.entries()) {
      // 날짜 범위 필터 적용
      if (start_date && date < start_date) continue;
      if (end_date && date > end_date) continue;
      
      const totalVisits = data.visits.length;
      const totalPurchases = data.purchases.length;
      const totalRevenue = data.purchases.reduce((sum, p) => {
        const props = p.properties as any;
        return sum + ((props?.total_amount || props?.unit_price || 0) as number);
      }, 0);

      const conversionRate = totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;
      const salesPerSqm = storeArea > 0 ? totalRevenue / storeArea : 0;

      // 퍼널 메트릭 (실제 데이터 기반 추정)
      const funnelMetrics = {
        funnel_entry: totalVisits,
        funnel_browse: Math.floor(totalVisits * 0.8), // 80%가 상품 탐색
        funnel_fitting: Math.floor(totalVisits * 0.4), // 40%가 피팅
        funnel_purchase: totalPurchases,
        funnel_return: Math.floor(totalPurchases * 0.2), // 20% 재방문 추정
      };

      // 기존 KPI 확인
      const { data: existingKpi } = await supabaseClient
        .from('dashboard_kpis')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', store_id)
        .eq('date', date)
        .maybeSingle();

      const kpiData = {
        user_id: user.id,
        store_id,
        date,
        total_revenue: totalRevenue,
        total_visits: totalVisits,
        total_purchases: totalPurchases,
        conversion_rate: conversionRate,
        sales_per_sqm: salesPerSqm,
        labor_hours: 0,
        ...funnelMetrics,
        weather_condition: null,
        is_holiday: false,
        special_event: null,
        consumer_sentiment_index: null,
      };

      if (existingKpi) {
        await supabaseClient
          .from('dashboard_kpis')
          .update(kpiData)
          .eq('id', existingKpi.id);
      } else {
        await supabaseClient
          .from('dashboard_kpis')
          .insert(kpiData);
      }

      kpiResults.push({ date, totalVisits, totalPurchases, totalRevenue });
    }

    console.log(`✅ Aggregated KPIs for ${kpiResults.length} dates`);

    return new Response(
      JSON.stringify({
        success: true,
        dates_processed: kpiResults.length,
        kpis: kpiResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error aggregating all KPIs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
