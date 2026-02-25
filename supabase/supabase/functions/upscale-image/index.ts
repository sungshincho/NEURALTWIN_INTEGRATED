import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // ── Authentication ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authentication required', 401);
    }

    const supabase = createSupabaseWithAuth(authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Invalid authentication', 401);
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return errorResponse('Image URL is required', 400);
    }

    // Validate that it's a data URL or public URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
      return errorResponse('Image must be a data URL (base64) or public URL', 400);
    }

    const GOOGLE_AI_API_KEY = requireEnv('GOOGLE_AI_API_KEY');

    console.log('Starting image upscaling for user:', user.id);

    // Prepare image content for Google AI
    // Support both data URLs (base64) and public URLs
    const imageParts: any[] = [
      { text: "Upscale this image to higher resolution. Enhance the details, sharpness, and clarity while maintaining the original composition and style. Make it ultra high definition and crystal clear." }
    ];

    if (imageUrl.startsWith('data:')) {
      // Extract base64 from data URL: data:image/png;base64,xxxxx
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        imageParts.push({
          inlineData: { mimeType: matches[1], data: matches[2] }
        });
      }
    } else {
      // For HTTP URLs, download the image first
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        return errorResponse('Failed to download source image', 400);
      }
      const imgBuffer = await imgResponse.arrayBuffer();
      const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
      const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
      imageParts.push({
        inlineData: { mimeType, data: imgBase64 }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: imageParts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return errorResponse('Rate limit exceeded. Please try again later.', 429);
      }

      const errorText = await response.text();
      console.error('Google AI error:', response.status, errorText);
      return errorResponse('Failed to upscale image', response.status);
    }

    const data = await response.json();
    console.log('Upscaling completed successfully');

    // Extract the upscaled image from Google AI response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    const upscaledImageUrl = imagePart
      ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      : null;
    
    if (!upscaledImageUrl) {
      console.error('No image in response');
      return errorResponse('No upscaled image returned', 500);
    }

    return new Response(
      JSON.stringify({ 
        upscaledImage: upscaledImageUrl,
        message: 'Image upscaled successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in upscale-image function:', error);
    return errorResponse('Internal server error', 500);
  }
});
