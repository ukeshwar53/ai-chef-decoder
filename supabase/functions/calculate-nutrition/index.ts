import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_INGREDIENTS = 20;
const MAX_STRING_LENGTH = 100;
const ALLOWED_CHARS = /^[a-zA-Z0-9\s,.\-'()\/]+$/;

function sanitize(text: string): string {
  return text.replace(/[<>"]/g, '').substring(0, MAX_STRING_LENGTH).trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ingredients } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ingredients.length > MAX_INGREDIENTS) {
      return new Response(
        JSON.stringify({ error: `Too many ingredients (max ${MAX_INGREDIENTS})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedIngredients: string[] = [];
    for (const ing of ingredients) {
      if (typeof ing !== 'string' || ing.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Each ingredient must be a non-empty string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const cleaned = sanitize(ing);
      if (!ALLOWED_CHARS.test(cleaned)) {
        return new Response(
          JSON.stringify({ error: `Invalid characters in ingredient: ${cleaned.substring(0, 20)}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sanitizedIngredients.push(cleaned);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    console.log(`Calculating nutrition for user ${claimsData.claims.sub}: ${sanitizedIngredients.join(', ')}`);

    const systemPrompt = `You are CulinaryAI's nutrition expert. Calculate accurate nutritional information for ingredient combinations.

For each ingredient, assume a standard serving size (about 100g or 1 cup for vegetables, appropriate portions for proteins, etc.).

OUTPUT FORMAT (JSON only, no markdown):
{
  "totalCalories": 450,
  "totalProtein": 32,
  "totalCarbs": 45,
  "totalFats": 18,
  "breakdown": [
    {"ingredient": "chicken breast", "calories": 165, "protein": 31, "carbs": 0, "fats": 3.6},
    {"ingredient": "rice", "calories": 130, "protein": 2.7, "carbs": 28, "fats": 0.3}
  ]
}

Provide realistic nutritional values based on standard portion sizes.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Calculate the combined nutrition for these ingredients: ${sanitizedIngredients.join(', ')}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to calculate nutrition');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    let nutrition;
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
      else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
      if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);
      nutrition = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse nutrition response');
    }

    return new Response(
      JSON.stringify({ success: true, nutrition }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-nutrition:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate nutrition' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
