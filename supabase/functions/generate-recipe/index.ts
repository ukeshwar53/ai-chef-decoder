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

    const { ingredients, cuisine, diet } = await req.json();

    // Input validation
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

    const sanitizedCuisine = cuisine ? sanitize(String(cuisine)) : undefined;
    const sanitizedDiet = diet ? sanitize(String(diet)) : undefined;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    console.log(`Generating recipe for user ${claimsData.claims.sub}, ingredients: ${sanitizedIngredients.join(', ')}`);

    const systemPrompt = `You are CulinaryAI, an expert chef and recipe creator. Generate realistic, cookable recipes based on provided ingredients.

CRITICAL RULES:
1. ONLY use the provided ingredients plus basic pantry staples (salt, pepper, oil, water, butter, common spices)
2. Never invent or hallucinate ingredients the user didn't provide
3. All cooking steps must be practical and executable by a home cook
4. Provide accurate nutritional estimates
5. Match the cuisine style and dietary restrictions requested

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "Recipe Name",
  "description": "Brief appetizing description (1-2 sentences)",
  "cookTime": "XX mins",
  "servings": 4,
  "calories": 350,
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1 description", "Step 2 description"]
}`;

    const userPrompt = `Create a ${sanitizedCuisine || 'any'} recipe using these ingredients: ${sanitizedIngredients.join(', ')}.
${sanitizedDiet && sanitizedDiet !== 'None' ? `Dietary requirement: ${sanitizedDiet}` : ''}
Provide a complete, cookable recipe.`;

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
          { role: 'user', content: userPrompt }
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
      throw new Error('Failed to generate recipe');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    let recipe;
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
      else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
      if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);
      recipe = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse recipe response');
    }

    return new Response(
      JSON.stringify({ success: true, recipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recipe:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate recipe' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
