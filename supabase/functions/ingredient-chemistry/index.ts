import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, cuisine, dishType } = await req.json();
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 ingredients are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    console.log('Analyzing ingredient chemistry for:', ingredients.join(', '));

    const systemPrompt = `You are CulinaryAI's culinary chemistry expert. Analyze the flavor compatibility between ingredients using molecular gastronomy principles and culinary traditions.

Consider:
1. Flavor compound overlap (ingredients that share aromatic compounds pair well)
2. Taste balance (sweet, sour, salty, bitter, umami)
3. Texture complementarity
4. Traditional culinary pairings
5. Contrast vs harmony principles

OUTPUT FORMAT (JSON only, no markdown):
{
  "score": 85,
  "label": "Highly compatible" | "Good pairing" | "Moderate compatibility" | "Weak pairing" | "May clash",
  "explanation": "Detailed 2-3 sentence explanation of why these ingredients work together or not, mentioning specific flavor compounds or culinary traditions.",
  "flavorProfile": {
    "dominant": ["umami", "savory"],
    "secondary": ["herbal", "acidic"]
  },
  "suggestedDishes": [
    {
      "name": "Dish Name",
      "description": "One line description of the dish"
    }
  ],
  "suggestedAdjustments": [
    "Suggestion to improve the combination",
    "Another helpful tip"
  ]
}

Score guidelines:
- 90-100: Classic, perfect pairing
- 75-89: Excellent compatibility
- 60-74: Good, works well
- 40-59: Moderate, might work with adjustments
- 20-39: Weak pairing, challenging
- 0-19: Likely to clash

Provide 2-4 suggested dishes and 1-3 adjustments.`;

    const userPrompt = `Analyze the flavor chemistry and compatibility of these ingredients: ${ingredients.join(', ')}
${cuisine ? `Cuisine context: ${cuisine}` : ''}
${dishType ? `Intended dish type: ${dishType}` : ''}

Provide a detailed compatibility analysis.`;

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
      throw new Error('Failed to analyze ingredient chemistry');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('Chemistry analysis complete');

    // Parse the JSON response
    let result;
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
      result = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse chemistry analysis');
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ingredient-chemistry:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to analyze chemistry' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
