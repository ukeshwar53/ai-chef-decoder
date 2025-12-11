import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { IngredientInput } from "@/components/shared/IngredientInput";
import { NutritionCard } from "@/components/shared/NutritionCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PieChart, Calculator, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calculateNutrition, type NutritionData } from "@/lib/api/culinary-ai";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Quick-add ingredients
const suggestedIngredients = [
  "chicken", "rice", "broccoli", "egg", "salmon", "avocado",
  "spinach", "olive oil", "tomato", "pasta", "beef", "cheese",
  "potato", "beans", "tofu"
];

const Nutrition = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const { user } = useAuth();

  const handleAddIngredient = (ingredient: string) => {
    if (!ingredients.includes(ingredient.toLowerCase())) {
      setIngredients([...ingredients, ingredient.toLowerCase()]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setNutrition(null);
  };

  const handleCalculateNutrition = async () => {
    if (ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    setIsCalculating(true);

    try {
      const result = await calculateNutrition(ingredients);
      setNutrition(result);
      toast.success("Nutrition calculated!");
    } catch (error) {
      console.error("Error calculating nutrition:", error);
      toast.error(error instanceof Error ? error.message : "Failed to calculate nutrition");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveNutrition = async () => {
    if (!nutrition || !user) {
      toast.error("Please log in to save nutrition history");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("nutrition_history").insert({
        user_id: user.id,
        ingredients,
        calories: nutrition.totalCalories,
        protein: nutrition.totalProtein,
        carbs: nutrition.totalCarbs,
        fats: nutrition.totalFats,
      });

      if (error) throw error;
      toast.success("Saved to nutrition history!");
    } catch (error) {
      console.error("Error saving nutrition:", error);
      toast.error("Failed to save nutrition history");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      {/* SECTION WITH BLURRED BACKGROUND */}
      <section className="relative py-12 md:py-20 overflow-hidden">

        {/* Blurred Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
          style={{
            backgroundImage: "url('/nutritionss.png')",
          }}
        ></div>

        {/* CONTENT ABOVE BLURRED BG */}
        <div className="relative z-10">
          <div className="container mx-auto px-4">

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/40 rounded-full px-4 py-2 mb-4">
                <span className="text-sm font-medium text-white">
                  AI Nutrition Calculator
                </span>
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-black mb-4">
                Analyze Your Nutrition
              </h1>
              <p className="text-white">
                Add ingredients to calculate detailed nutritional information powered by AI.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

              {/* Input Panel */}
              <div className="bg-card rounded-2xl border border-border shadow-soft p-6 md:p-8">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                  Add Ingredients
                </h2>

                <IngredientInput
                  ingredients={ingredients}
                  onAdd={handleAddIngredient}
                  onRemove={handleRemoveIngredient}
                />

                <div className="mt-8 p-4 rounded-xl bg-accent/50 border border-border">
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Quick Add
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedIngredients.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleAddIngredient(item)}
                        disabled={ingredients.includes(item)}
                        className="text-xs px-3 py-1 rounded-full bg-background border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-8"
                  onClick={handleCalculateNutrition}
                  disabled={isCalculating || ingredients.length === 0}
                >
                  <Calculator className="w-5 h-5" />
                  {isCalculating ? "Calculating..." : "Calculate Nutrition"}
                </Button>
              </div>

              {/* Output Panel */}
              <div>
                {isCalculating && <LoadingSpinner text="Calculating nutrition with AI..." />}

                {nutrition && !isCalculating && (
                  <div className="space-y-6">
                    <NutritionCard
                      calories={nutrition.totalCalories}
                      protein={nutrition.totalProtein}
                      carbs={nutrition.totalCarbs}
                      fats={nutrition.totalFats}
                      dishName={`${ingredients.length} ingredient${ingredients.length > 1 ? "s" : ""} combined`}
                    />

                    {user && (
                      <Button
                        variant="sage"
                        className="w-full"
                        onClick={handleSaveNutrition}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <History className="w-4 h-4 mr-2" />
                        )}
                        Save to History
                      </Button>
                    )}

                    {nutrition.breakdown && nutrition.breakdown.length > 0 && (
                      <div className="bg-card rounded-2xl shadow-card border border-border p-6 animate-fade-up">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                          Per Ingredient Breakdown
                        </h3>
                        <div className="space-y-3">
                          {nutrition.breakdown.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-xl bg-accent"
                            >
                              <span className="font-medium text-foreground capitalize">
                                {item.ingredient}
                              </span>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>{item.calories} kcal</span>
                                <span>{item.protein}g P</span>
                                <span>{item.carbs}g C</span>
                                <span>{item.fats}g F</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!nutrition && !isCalculating && (
                  <div className="h-full flex items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-border">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
                        <PieChart className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Nutrition info will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Nutrition;
