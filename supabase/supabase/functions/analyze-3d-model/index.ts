import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";
import { chatCompletion } from "../_shared/ai/gateway.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const { fileName, fileUrl } = await req.json();

    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization header required', 401, { success: false });
    }

    const supabase = createSupabaseWithAuth(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401, { success: false });
    }

    const userId = user.id;
    
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

    const aiData = await chatCompletion({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a helpful AI that analyzes 3D models for retail environments.' },
        { role: 'user', content: prompt }
      ],
      jsonMode: true,
    });

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
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      { success: false }
    );
  }
});
