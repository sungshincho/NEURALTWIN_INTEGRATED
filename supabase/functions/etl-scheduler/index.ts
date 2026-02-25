import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ETL Scheduler] Starting scheduled ETL pipeline...');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get all organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id');

    const results: any[] = [];

    for (const org of orgs || []) {
      console.log(`[ETL Scheduler] Processing org: ${org.id}`);

      // Run full ETL pipeline using unified-etl
      try {
        const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/unified-etl`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            etl_type: 'full_pipeline',
            org_id: org.id,
            date_from: yesterday,
            date_to: today,
          }),
        });
        const pipelineResult = await pipelineResponse.json();
        console.log(`[ETL Scheduler] Full pipeline result for ${org.id}:`, pipelineResult);
        results.push({ org_id: org.id, phase: 'full_pipeline', result: pipelineResult });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ETL Scheduler] Pipeline error for ${org.id}:`, error);
        results.push({ org_id: org.id, phase: 'full_pipeline', error: errorMessage });
      }
    }

    console.log('[ETL Scheduler] Completed all ETL pipelines');

    return new Response(JSON.stringify({
      success: true,
      orgs_processed: orgs?.length || 0,
      results,
      executed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[ETL Scheduler] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Scheduler failed';
    return new Response(JSON.stringify({
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
