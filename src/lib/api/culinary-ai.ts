// src/lib/api/culinary-ai.ts
import { supabase } from "@/integrations/supabase/client";

export interface Recipe {
  title: string;
  description: string;
  cookTime: string;
  servings: number;
  calories: number;
  ingredients: string[];
  instructions: string[];
}

export interface DetectedIngredient {
  name: string;
  confidence: number;
}

export interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  breakdown?: Array<{
    ingredient: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
}

/**
 * Helper: ensure we send a sensible payload:
 * - Accept either a dataURL ("data:image/jpeg;base64,...") or raw base64.
 * - Strip data URI prefix if present.
 * - Validate size and return the base64-only string.
 */
function normalizeBase64(data: string) {
  if (!data || typeof data !== "string") {
    throw new Error("Invalid image data");
  }

  // If it's a data URL, strip prefix
  const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
  const base64 = match ? match[2] : data;

  // safety: check size (characters in base64). Adjust limit to suit your function.
  const maxChars = 4_000_000; // ~3MB base64 (roughly 3MB image). Lower if your function times out.
  if (base64.length > maxChars) {
    throw new Error(
      `Image too large (${Math.round(base64.length / 1024)} KB). Try a smaller image or reduce quality.`
    );
  }

  return base64;
}

/**
 * Generic wrapper for invoking Supabase Edge Functions with improved error messages.
 * Uses supabase.functions.invoke and throws a JS Error with server message on failure.
 */
async function invokeFunction<T = any>(
  name: string,
  payload: Record<string, any>
): Promise<T> {
  try {
    // supabase.functions.invoke returns { data, error }
    const { data, error } = await supabase.functions.invoke(name, {
      body: payload,
    });

    // If supabase client reports an error object — provide details
    if (error) {
      console.error(`Function ${name} invocation error`, error);
      // error.message usually contains useful text
      throw new Error(
        `Function ${name} failed: ${error.message || JSON.stringify(error)}`
      );
    }

    // Some functions return structured { success: boolean, ... }
    if (data && typeof data === "object" && "success" in data && !data.success) {
      const serverMessage = (data && (data.error || data.message)) || JSON.stringify(data);
      console.error(`Function ${name} returned success=false:`, data);
      throw new Error(serverMessage || `Function ${name} returned failure`);
    }

    return data as T;
  } catch (err: any) {
    // Re-throw with context
    const msg = err?.message || String(err);
    throw new Error(`Error calling function "${name}": ${msg}`);
  }
}

/* ---------------------------
   Public API functions (exported)
   --------------------------- */

/**
 * generateRecipe - calls the 'generate-recipe' Supabase function
 */
export const generateRecipe = async (
  ingredients: string[],
  cuisine: string,
  diet: string
): Promise<Recipe> => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("generateRecipe requires at least one ingredient");
  }

  const payload = { ingredients, cuisine, diet };
  const data = await invokeFunction<{ success?: boolean; recipe?: Recipe; error?: string }>(
    "generate-recipe",
    payload
  );

  // The invokeFunction wrapper already checks for success=false pattern,
  // but some functions just return the recipe directly:
  if (data && (data as any).recipe) {
    return (data as any).recipe as Recipe;
  }

  // If function returns recipe directly
  return data as unknown as Recipe;
};

/**
 * scanFood - calls the 'scan-food' Supabase function
 * Accepts either dataURL or raw base64; returns dishName + detected ingredients.
 */
export const scanFood = async (
  imageData: string
): Promise<{ dishName: string; ingredients: DetectedIngredient[] }> => {
  // Normalize & validate image
  const base64 = normalizeBase64(imageData);

  // Helpful debug log (remove or reduce in production)
  console.debug("scanFood: sending base64 length", base64.length);

  const payload = { imageBase64: base64 };

  // Invoke supabase function
  const data = await invokeFunction<{
    success?: boolean;
    dishName?: string;
    ingredients?: DetectedIngredient[];
    error?: string;
  }>("scan-food", payload);

  // If function returns structured response:
  if (data && typeof data === "object") {
    const dishName = (data as any).dishName ?? "";
    const ingredients = (data as any).ingredients ?? [];
    return { dishName, ingredients };
  }

  // Fallback
  throw new Error("Unexpected response from scan-food");
};

/**
 * calculateNutrition - calls the 'calculate-nutrition' Supabase function
 */
export const calculateNutrition = async (
  ingredients: string[]
): Promise<NutritionData> => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("calculateNutrition requires at least one ingredient");
  }

  const payload = { ingredients };
  const data = await invokeFunction<{ success?: boolean; nutrition?: NutritionData }>(
    "calculate-nutrition",
    payload
  );

  if ((data as any).nutrition) {
    return (data as any).nutrition as NutritionData;
  }

  return data as unknown as NutritionData;
};
