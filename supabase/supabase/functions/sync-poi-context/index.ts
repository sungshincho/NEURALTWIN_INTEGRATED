import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncPoiPayload {
  orgId: string;
  storeId?: string;
  externalSourceId?: string;
}

interface PoiData {
  category: string;
  name: string;
  distance: number;
  latitude: number;
  longitude: number;
}

interface StoreContext {
  storeId: string;
  totalPois: number;
  categories: { category: string; count: number }[];
  stats: Record<string, number>;
  rawPois: PoiData[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if user is NEURALTWIN_MASTER or ORG_HQ
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, org_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !['NEURALTWIN_MASTER', 'ORG_HQ'].includes(memberData?.role)) {
      throw new Error('Unauthorized: Only NEURALTWIN_MASTER or ORG_HQ can sync POI data');
    }

    // Parse request body
    const { orgId, storeId, externalSourceId }: SyncPoiPayload = await req.json();
    console.log('Syncing POI context for org:', orgId, 'store:', storeId || 'all');

    // Get stores to process
    let storeQuery = supabase
      .from('stores')
      .select('id, store_name, location, latitude, longitude')
      .eq('org_id', orgId);

    if (storeId) {
      storeQuery = storeQuery.eq('id', storeId);
    }

    const { data: stores, error: storeError } = await storeQuery;

    if (storeError || !stores || stores.length === 0) {
      throw new Error('No stores found for the specified criteria');
    }

    console.log(`Processing ${stores.length} store(s)`);

    // Get external data source configuration
    let sourceQuery = supabase
      .from('external_data_sources')
      .select(`
        *,
        api_connections!inner(*)
      `)
      .eq('source_type', 'poi')
      .eq('is_active', true);

    if (externalSourceId) {
      sourceQuery = sourceQuery.eq('id', externalSourceId);
    } else {
      sourceQuery = sourceQuery.limit(1);
    }

    const { data: sources, error: sourceError } = await sourceQuery;

    if (sourceError || !sources || sources.length === 0) {
      throw new Error('No active POI data source found');
    }

    const source = sources[0];
    const provider = source.metadata?.provider || 'generic';
    const radiusM = source.metadata?.radius_m || 500;

    console.log('Using POI source:', source.name, 'with provider:', provider, 'radius:', radiusM);

    // Process each store
    const results = [];
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const store of stores) {
      try {
        // Fetch POI data for this store
        const pois = await fetchPoisForStore(store, radiusM, source);
        
        // Aggregate POI data
        const context = aggregatePoisData(store.id, pois, provider, radiusM);
        
        // Upsert store context
        const { inserted, updated } = await upsertStoreContext(supabase, orgId, context);
        
        totalInserted += inserted;
        totalUpdated += updated;
        
        results.push({
          storeId: store.id,
          storeName: store.store_name,
          totalPois: context.totalPois,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error processing store ${store.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          storeId: store.id,
          storeName: store.store_name,
          success: false,
          error: errorMessage,
        });
      }
    }

    const stats = {
      storesProcessed: stores.length,
      storesSuccessful: results.filter(r => r.success).length,
      storesFailed: results.filter(r => !r.success).length,
      contextsInserted: totalInserted,
      contextsUpdated: totalUpdated,
    };

    // Create sync log
    await supabase
      .from('data_sync_logs')
      .insert({
        org_id: orgId,
        source_id: source.id,
        status: stats.storesFailed === 0 ? 'success' : 'partial_success',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        stats,
      });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        results,
        message: 'POI context synchronized successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function fetchPoisForStore(
  store: any,
  radiusM: number,
  source: any
): Promise<PoiData[]> {
  // Mock implementation - replace with actual API calls
  // For now, return sample POI data
  const provider = source.metadata?.provider || 'generic';
  
  console.log(`Fetching POIs for store ${store.id} from ${provider}`);

  // In production, this would make actual HTTP requests to external APIs
  // Example providers: Foursquare, Google Places, Kakao Local, etc.
  
  // Mock data for demonstration
  return [
    {
      category: 'cafe',
      name: 'Coffee Shop A',
      distance: 100,
      latitude: store.latitude + 0.001,
      longitude: store.longitude + 0.001,
    },
    {
      category: 'cafe',
      name: 'Coffee Shop B',
      distance: 200,
      latitude: store.latitude - 0.001,
      longitude: store.longitude + 0.001,
    },
    {
      category: 'restaurant',
      name: 'Restaurant A',
      distance: 150,
      latitude: store.latitude + 0.0015,
      longitude: store.longitude - 0.001,
    },
    {
      category: 'retail',
      name: 'Competitor Store',
      distance: 300,
      latitude: store.latitude - 0.002,
      longitude: store.longitude - 0.001,
    },
    {
      category: 'retail',
      name: 'Other Retail',
      distance: 400,
      latitude: store.latitude + 0.003,
      longitude: store.longitude,
    },
  ];
}

function aggregatePoisData(
  storeId: string,
  pois: PoiData[],
  provider: string,
  radiusM: number
): StoreContext {
  // Count by category
  const categoryCounts = new Map<string, number>();
  const stats: Record<string, number> = {};

  for (const poi of pois) {
    categoryCounts.set(
      poi.category,
      (categoryCounts.get(poi.category) || 0) + 1
    );
    stats[poi.category] = (stats[poi.category] || 0) + 1;
  }

  const categories = Array.from(categoryCounts.entries()).map(
    ([category, count]) => ({ category, count })
  );

  return {
    storeId,
    totalPois: pois.length,
    categories,
    stats,
    rawPois: pois.slice(0, 100), // Truncate to first 100 for storage
  };
}

async function upsertStoreContext(
  supabase: any,
  orgId: string,
  context: StoreContext
): Promise<{ inserted: number; updated: number }> {
  // Check if context already exists
  const { data: existing } = await supabase
    .from('store_trade_area_context')
    .select('id')
    .eq('org_id', orgId)
    .eq('store_id', context.storeId)
    .single();

  const contextData = {
    org_id: orgId,
    store_id: context.storeId,
    provider: 'generic',
    radius_m: 500,
    total_pois: context.totalPois,
    categories: context.categories,
    stats: context.stats,
    raw_payload: context.rawPois,
  };

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('store_trade_area_context')
      .update(contextData)
      .eq('id', existing.id);

    return { inserted: 0, updated: error ? 0 : 1 };
  } else {
    // Insert new
    const { error } = await supabase
      .from('store_trade_area_context')
      .insert(contextData);

    return { inserted: error ? 0 : 1, updated: 0 };
  }
}
