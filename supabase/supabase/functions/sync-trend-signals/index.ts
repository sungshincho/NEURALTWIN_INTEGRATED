import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";

interface SyncTrendSignalsPayload {
  orgId: string;
  scope?: 'category' | 'brand' | 'keyword';
  keys?: string[];
  externalSourceId?: string;
}

interface TrendDataPoint {
  date: string;
  indexValue: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's JWT
    const supabase = createSupabaseWithAuth(authHeader);

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
      throw new Error('Unauthorized: Only NEURALTWIN_MASTER or ORG_HQ can sync trend data');
    }

    // Parse request body
    const { orgId, scope = 'category', keys, externalSourceId }: SyncTrendSignalsPayload = await req.json();
    console.log('Syncing trend signals for org:', orgId, 'scope:', scope);

    // Get external data source configuration
    let sourceQuery = supabase
      .from('external_data_sources')
      .select(`
        *,
        api_connections!inner(*)
      `)
      .eq('source_type', 'trend')
      .eq('is_active', true);

    if (externalSourceId) {
      sourceQuery = sourceQuery.eq('id', externalSourceId);
    } else {
      sourceQuery = sourceQuery.limit(1);
    }

    const { data: sources, error: sourceError } = await sourceQuery;

    if (sourceError || !sources || sources.length === 0) {
      throw new Error('No active trend data source found');
    }

    const source = sources[0];
    const provider = source.metadata?.provider || 'generic';

    console.log('Using trend source:', source.name, 'with provider:', provider);

    // Determine keys to sync
    let trendKeys: string[];
    if (keys && keys.length > 0) {
      trendKeys = keys;
    } else {
      trendKeys = await getTrendKeysForOrg(supabase, orgId, scope);
    }

    console.log(`Processing ${trendKeys.length} ${scope}(s):`, trendKeys);

    // Process each key
    let totalInserted = 0;
    let totalUpdated = 0;
    const results = [];

    for (const key of trendKeys) {
      try {
        // Fetch trend data for this key
        const trendData = await fetchTrendDataForKey(key, scope, source);
        
        // Upsert trend signals
        const { inserted, updated } = await upsertTrendSignals(
          supabase,
          orgId,
          source.id,
          scope,
          key,
          provider,
          trendData
        );
        
        totalInserted += inserted;
        totalUpdated += updated;
        
        results.push({
          scope,
          key,
          dataPoints: trendData.length,
          inserted,
          updated,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error processing ${scope} "${key}":`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          scope,
          key,
          success: false,
          error: errorMessage,
        });
      }
    }

    const stats = {
      keysProcessed: trendKeys.length,
      keysSuccessful: results.filter(r => r.success).length,
      keysFailed: results.filter(r => !r.success).length,
      signalsInserted: totalInserted,
      signalsUpdated: totalUpdated,
    };

    // Create sync log
    await supabase
      .from('data_sync_logs')
      .insert({
        org_id: orgId,
        source_id: source.id,
        status: stats.keysFailed === 0 ? 'success' : 'partial_success',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        stats,
      });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        results,
        message: 'Trend signals synchronized successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorResponse(errorMessage, 400);
  }
});

async function getTrendKeysForOrg(
  supabase: any,
  orgId: string,
  scope: string
): Promise<string[]> {
  // Get keys from products table based on scope
  if (scope === 'category') {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('org_id', orgId)
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    // Get unique categories
    const categories = new Set<string>(data.map((p: any) => p.category as string));
    return Array.from(categories);
  } else if (scope === 'brand') {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('org_id', orgId)
      .not('brand', 'is', null);

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    // Get unique brands
    const brands = new Set<string>(data.map((p: any) => p.brand as string));
    return Array.from(brands);
  } else {
    // For keywords, return default keywords
    return ['retail', 'fashion', 'shopping'];
  }
}

async function fetchTrendDataForKey(
  key: string,
  scope: string,
  source: any
): Promise<TrendDataPoint[]> {
  // Mock implementation - replace with actual API calls
  // For now, return sample trend data
  const provider = source.metadata?.provider || 'generic';
  
  console.log(`Fetching trend data for ${scope} "${key}" from ${provider}`);

  // In production, this would make actual HTTP requests to external APIs
  // Example providers: Google Trends, Naver DataLab, etc.
  
  // Generate mock data for last 30 days
  const trendData: TrendDataPoint[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate random trend index between 40 and 90
    const baseValue = 65;
    const variation = Math.sin(i / 5) * 15 + Math.random() * 10;
    const indexValue = Math.round(baseValue + variation);
    
    trendData.push({
      date: date.toISOString().split('T')[0],
      indexValue: Math.max(0, Math.min(100, indexValue)),
    });
  }
  
  return trendData;
}

async function upsertTrendSignals(
  supabase: any,
  orgId: string,
  sourceId: string,
  scope: string,
  key: string,
  provider: string,
  trendData: TrendDataPoint[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const dataPoint of trendData) {
    // Check if signal already exists
    const { data: existing } = await supabase
      .from('trend_signals')
      .select('id')
      .eq('org_id', orgId)
      .eq('scope', scope)
      .eq('key', key)
      .eq('date', dataPoint.date)
      .single();

    const signalData = {
      org_id: orgId,
      source_provider: provider,
      scope,
      key,
      date: dataPoint.date,
      index_value: dataPoint.indexValue,
      metadata: {
        source_id: sourceId,
        synced_at: new Date().toISOString(),
      },
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('trend_signals')
        .update(signalData)
        .eq('id', existing.id);

      if (!error) updated++;
    } else {
      // Insert new
      const { error } = await supabase
        .from('trend_signals')
        .insert(signalData);

      if (!error) inserted++;
    }
  }

  return { inserted, updated };
}
