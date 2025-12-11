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

export const generateRecipe = async (
  ingredients: string[],
  cuisine: string,
  diet: string
): Promise<Recipe> => {
  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { ingredients, cuisine, diet }
  });

  if (error) {
    console.error('Error calling generate-recipe:', error);
    throw new Error(error.message || 'Failed to generate recipe');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate recipe');
  }

  return data.recipe;
};

export const scanFood = async (
  imageBase64: string
): Promise<{ dishName: string; ingredients: DetectedIngredient[] }> => {
  const { data, error } = await supabase.functions.invoke('scan-food', {
    body: { imageBase64 }
  });

  if (error) {
    console.error('Error calling scan-food:', error);
    throw new Error(error.message || 'Failed to analyze image');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to analyze image');
  }

  return {
    dishName: data.dishName,
    ingredients: data.ingredients
  };
};

export const calculateNutrition = async (
  ingredients: string[]
): Promise<NutritionData> => {
  const { data, error } = await supabase.functions.invoke('calculate-nutrition', {
    body: { ingredients }
  });

  if (error) {
    console.error('Error calling calculate-nutrition:', error);
    throw new Error(error.message || 'Failed to calculate nutrition');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to calculate nutrition');
  }

  return data.nutrition;
};
