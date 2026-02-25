import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileUrl } = await req.json();
    
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }
    
    // Extract user ID from JWT token (Bearer token format)
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }
    
    // Decode JWT payload (base64url encoded)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // 1. Get existing entity types from ontology
    const { data: entityTypes, error: entityTypesError } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', userId);

    if (entityTypesError) throw entityTypesError;

    // 2. Analyze filename with AI
    const prompt = `
You are an AI assistant that analyzes 3D model filenames and matches them to retail store entity types.

Available Entity Types in the ontology:
${entityTypes?.map(et => `- ${et.name}: ${et.label} (${et.description})`).join('\n')}

3D Model Filename: "${fileName}"

Tasks:
1. Infer what this 3D model represents based on the filename
2. Match it to the most appropriate entity type from the list above
3. Suggest dimensions (width, height, depth in meters) based on typical real-world sizes
4. Determine if this object is movable (can be repositioned)
5. Provide a confidence score (0-1)

**Movability Rules:**
- movable=true: Rack, Shelf, DisplayTable, CheckoutCounter, Kiosk, Product, FittingRoom (furniture that can be moved/repositioned)
- movable=false: Store, Zone, Camera, Beacon, POS (fixed structures and permanently installed equipment)
- Keywords: "movable", "portable", "mobile" → movable=true
- Keywords: "fixed", "permanent", "installed" → movable=false

Respond in JSON format:
{
  "matched_entity_type": "entity_type_name",
  "confidence": 0.95,
  "movable": true,
  "inferred_type": "description of what you think this is",
  "suggested_dimensions": {
    "width": 2.0,
    "height": 2.0,
    "depth": 0.5
  },
  "reasoning": "why you matched it to this type and whether it's movable"
}
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful AI that analyzes 3D models for retail environments.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;
    
    // Remove markdown code block markers if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const analysisResult = JSON.parse(content);

    // 3. Find the matched entity type
    const matchedType = entityTypes?.find(et => et.name === analysisResult.matched_entity_type);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        matched_entity_type: matchedType,
        fileName,
        fileUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-3d-model:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
