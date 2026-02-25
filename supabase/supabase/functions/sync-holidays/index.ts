import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";

interface SyncHolidaysPayload {
  orgId: string;
  externalSourceId?: string;
}

interface HolidayRecord {
  date: string;
  name: string;
  country_code: string;
  region_code?: string;
  type: string;
  description?: string;
  metadata?: any;
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

    // Verify user authentication and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if user is NEURALTWIN_MASTER
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (memberError || memberData?.role !== 'NEURALTWIN_MASTER') {
      throw new Error('Unauthorized: Only NEURALTWIN_MASTER can sync holiday data');
    }

    // Parse request body
    const { orgId, externalSourceId }: SyncHolidaysPayload = await req.json();
    console.log('Syncing holidays for org:', orgId);

    // Get external data source configuration
    let query = supabase
      .from('external_data_sources')
      .select(`
        *,
        api_connections!inner(*)
      `)
      .eq('source_type', 'holiday')
      .eq('is_active', true);

    if (externalSourceId) {
      query = query.eq('id', externalSourceId);
    } else {
      query = query.limit(1);
    }

    const { data: sources, error: sourceError } = await query;

    if (sourceError || !sources || sources.length === 0) {
      throw new Error('No active holiday data source found');
    }

    const source = sources[0];
    const apiConnection = source.api_connections;

    console.log('Using holiday source:', source.name, 'with provider:', source.metadata?.provider);

    // Fetch holidays from external API (mocked for now)
    const holidays = await fetchHolidaysFromProvider(source, apiConnection);
    console.log(`Fetched ${holidays.length} holidays`);

    // Upsert holidays into database
    const stats = await upsertHolidays(supabase, orgId, source.id, holidays);
    console.log('Upsert stats:', stats);

    // Create sync log
    await supabase
      .from('data_sync_logs')
      .insert({
        org_id: orgId,
        source_id: source.id,
        status: 'success',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        stats: stats,
      });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: 'Holiday data synchronized successfully',
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

async function fetchHolidaysFromProvider(
  source: any,
  apiConnection: any
): Promise<HolidayRecord[]> {
  // Mock implementation - replace with actual API calls
  // For now, return sample holiday data
  const currentYear = new Date().getFullYear();
  const provider = source.metadata?.provider || 'generic';
  const countryCode = source.metadata?.country_code || 'KR';

  console.log(`Fetching holidays from ${provider} for country: ${countryCode}`);

  // In production, this would make actual HTTP requests to external APIs
  // Example providers: Calendarific, Nager.Date, etc.
  
  // Mock data for demonstration
  return [
    {
      date: `${currentYear}-01-01`,
      name: 'New Year\'s Day',
      country_code: countryCode,
      type: 'public_holiday',
      description: 'First day of the year',
      metadata: { provider },
    },
    {
      date: `${currentYear}-03-01`,
      name: 'Independence Movement Day',
      country_code: countryCode,
      type: 'public_holiday',
      description: 'Korean independence movement',
      metadata: { provider },
    },
    {
      date: `${currentYear}-05-05`,
      name: 'Children\'s Day',
      country_code: countryCode,
      type: 'public_holiday',
      description: 'Day for children',
      metadata: { provider },
    },
  ];
}

async function upsertHolidays(
  supabase: any,
  orgId: string,
  sourceId: string,
  holidays: HolidayRecord[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const holiday of holidays) {
    // Check if holiday already exists
    const { data: existing } = await supabase
      .from('holidays_events')
      .select('id')
      .eq('org_id', orgId)
      .eq('date', holiday.date)
      .eq('event_name', holiday.name)
      .single();

    const holidayData = {
      org_id: orgId,
      date: holiday.date,
      event_name: holiday.name,
      event_type: holiday.type,
      country_code: holiday.country_code,
      region_code: holiday.region_code,
      description: holiday.description,
      source_provider: holiday.metadata?.provider,
      raw_payload: holiday.metadata || {},
      is_global: true,
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('holidays_events')
        .update(holidayData)
        .eq('id', existing.id);

      if (!error) updated++;
    } else {
      // Insert new
      const { error } = await supabase
        .from('holidays_events')
        .insert(holidayData);

      if (!error) inserted++;
    }
  }

  return { inserted, updated };
}
