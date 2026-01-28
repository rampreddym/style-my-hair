import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InstructionRequest {
  serviceName: string;
  styleDescription?: string;
  styleImageUrl?: string;
  customerGender?: string;
  customerAge?: number;
  preferredStyleDescription?: string;
  previousNotes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      serviceName,
      styleDescription,
      styleImageUrl,
      customerGender,
      customerAge,
      preferredStyleDescription,
      previousNotes,
    }: InstructionRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive context for the AI
    const contextParts: string[] = [];
    
    if (customerGender) {
      contextParts.push(`Client Gender: ${customerGender}`);
    }
    if (customerAge) {
      contextParts.push(`Client Age: ${customerAge} years`);
    }
    if (preferredStyleDescription) {
      contextParts.push(`Client's General Style Preference: ${preferredStyleDescription}`);
    }
    if (previousNotes) {
      contextParts.push(`Previous Stylist Notes: ${previousNotes}`);
    }
    if (styleDescription) {
      contextParts.push(`Requested Style Description: ${styleDescription}`);
    }

    const clientContext = contextParts.length > 0 
      ? `\n\nCLIENT INFORMATION:\n${contextParts.join('\n')}`
      : '';

    const systemPrompt = `You are an expert master hairstylist and training coach with 25+ years of experience in professional barbering and cosmetology. You provide clear, actionable technical instructions that any licensed hairstylist would understand.

Your instructions should:
1. Use proper industry terminology (e.g., guard sizes, clipper-over-comb, point cutting, texturizing, blending)
2. Include specific measurements and techniques (e.g., "1.5 guard on sides, fade from temple to parietal ridge")
3. Cover the complete workflow: consultation points, sectioning, cutting sequence, finishing
4. Note any product recommendations relevant to the style
5. Include tips for adapting to different hair types/textures
6. Mention maintenance advice to share with the client

Format your response as a professional instruction sheet with clear sections.`;

    const userPrompt = `Generate professional stylist instructions for the following service:

SERVICE: ${serviceName}${clientContext}

Provide detailed, expert-level instructions that a professional hairstylist would use to execute this service perfectly. Include:

1. **PRE-SERVICE CONSULTATION** - Key questions to ask, what to assess
2. **PREPARATION** - Tools needed, client positioning, sectioning plan
3. **TECHNIQUE BREAKDOWN** - Step-by-step cutting/styling instructions with precise measurements
4. **BLENDING & FINISHING** - How to refine and complete the look
5. **STYLING & PRODUCT** - Recommended products and styling technique
6. **CLIENT AFTERCARE** - Maintenance tips to share with the client

Be specific and technical - this is for a trained professional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const instructions = data.choices?.[0]?.message?.content;

    if (!instructions) {
      throw new Error("No instructions generated");
    }

    return new Response(
      JSON.stringify({ 
        instructions,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating stylist instructions:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate instructions" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
