import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const GenerateStyleSchema = z.object({
  stylePrompt: z.string().min(1, "Style prompt is required").max(500, "Style prompt too long"),
  userPhotoUrls: z.array(
    z.string().url("Invalid URL format").refine(
      (url) => url.startsWith('https://'),
      { message: 'URL must use HTTPS' }
    )
  ).min(1, "At least one photo URL is required").max(5, "A maximum of 5 photo URLs is allowed"),
  selectedPhotoUrl: z.string().url("Invalid selected photo URL format").refine(
    (url) => url.startsWith('https://'),
    { message: 'Selected photo URL must use HTTPS' }
  ),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Validate input
    const body = await req.json();
    const validationResult = GenerateStyleSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: validationResult.error.issues 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { stylePrompt, userPhotoUrls, selectedPhotoUrl } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!userPhotoUrls.includes(selectedPhotoUrl)) {
      return new Response(JSON.stringify({
        error: 'selectedPhotoUrl must be one of the provided userPhotoUrls'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating hairstyle with prompt:', stylePrompt);
    console.log('Selected source photo:', selectedPhotoUrl);

    const sourceResponse = await fetch(selectedPhotoUrl);
    if (!sourceResponse.ok) {
      return new Response(JSON.stringify({ error: 'The selected photo could not be loaded.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceBlob = await sourceResponse.blob();
    const variations: string[] = [];
    const prompts = [
      `Edit only the hair in this salon consultation photo. Requested look: ${stylePrompt}. Preserve the person's identity, facial features, skin tone, expression, clothing, pose, camera angle, lighting, and background. Create a realistic professional salon preview with natural hair texture.`,
      `Create a second realistic salon interpretation of this requested hairstyle: ${stylePrompt}. Change only the hair. Keep the same person, face, expression, clothing, framing, lighting, and background exactly recognizable.`,
      `Create a third polished but natural variation of this hairstyle: ${stylePrompt}. Preserve identity and every non-hair detail from the source image. The result should look like a credible after photo from a professional salon consultation.`,
    ];

    for (let index = 0; index < prompts.length; index += 1) {
      const form = new FormData();
      form.append('model', 'openai/gpt-image-2.5-sunburst');
      form.append('prompt', prompts[index]);
      form.append('image', sourceBlob, `source-${index}.jpg`);
      form.append('size', '1024x1024');
      form.append('quality', 'high');

      const response = await fetch('https://ai.gateway.lovable.dev/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const safeMessage = typeof errorPayload?.message === 'string'
          ? errorPayload.message
          : typeof errorPayload?.error?.message === 'string'
            ? errorPayload.error.message
            : 'The hairstyle preview could not be generated.';
        console.error('AI gateway error:', response.status, safeMessage);
        return new Response(JSON.stringify({ error: safeMessage }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      const base64Image = data.data?.[0]?.b64_json;

      if (typeof base64Image === 'string') {
        const imageBytes = Uint8Array.from(atob(base64Image), (character) => character.charCodeAt(0));
        const outputPath = `${user.id}/generated-styles/${Date.now()}-${index}.png`;
        const { error: uploadError } = await supabaseClient.storage
          .from('user-photos')
          .upload(outputPath, imageBytes, { contentType: 'image/png', upsert: false });

        if (uploadError) {
          console.error('Generated image upload failed:', uploadError.message);
          throw new Error('The preview was created but could not be saved.');
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('user-photos')
          .getPublicUrl(outputPath);
        variations.push(publicUrlData.publicUrl);
      }
    }

    console.log(`Generated ${variations.length} variations`);

    return new Response(JSON.stringify({ variations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-hairstyle function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
