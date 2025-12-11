import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients } = await req.json();
    
    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    console.log(`Calculating nutrition for: ${ingredients.join(', ')}`);

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
          { role: 'user', content: `Calculate the combined nutrition for these ingredients: ${ingredients.join(', ')}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
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

    console.log('Nutrition calculation complete');

    // Parse the JSON response
    let nutrition;
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3);
      }
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to calculate nutrition' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
