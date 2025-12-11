import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { IngredientInput } from "@/components/shared/IngredientInput";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Beaker, Sparkles, ChefHat, Lightbulb, Leaf, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedDish {
  name: string;
  description: string;
}

interface ChemistryResult {
  score: number;
  label: string;
  explanation: string;
  flavorProfile?: {
    dominant: string[];
    secondary: string[];
  };
  suggestedDishes: SuggestedDish[];
  suggestedAdjustments: string[];
}

const cuisineOptions = [
  "Any",
  "Italian",
  "Mexican",
  "Indian",
  "Chinese",
  "Japanese",
  "Thai",
  "Mediterranean",
  "American",
  "French",
  "Middle Eastern",
];

const dishTypeOptions = [
  "Any",
  "Main Course",
  "Salad",
  "Soup",
  "Appetizer",
  "Dessert",
  "Pasta",
  "Curry",
  "Stir-Fry",
  "Sandwich",
];

const IngredientChemistry = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Pre-fill ingredients if passed via URL
  const initialIngredients = searchParams.get("ingredients")?.split(",").filter(Boolean) || [];
  
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [cuisine, setCuisine] = useState("Any");
  const [dishType, setDishType] = useState("Any");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ChemistryResult | null>(null);

  const handleAddIngredient = (ingredient: string) => {
    if (!ingredients.includes(ingredient.toLowerCase())) {
      setIngredients([...ingredients, ingredient.toLowerCase()]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setResult(null);
  };

  const analyzeChemistry = async () => {
    if (ingredients.length < 2) {
      toast.error("Please add at least 2 ingredients");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ingredient-chemistry', {
        body: {
          ingredients,
          cuisine: cuisine !== "Any" ? cuisine : undefined,
          dishType: dishType !== "Any" ? dishType : undefined,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult({
        score: data.score,
        label: data.label,
        explanation: data.explanation,
        flavorProfile: data.flavorProfile,
        suggestedDishes: data.suggestedDishes || [],
        suggestedAdjustments: data.suggestedAdjustments || [],
      });
      toast.success("Chemistry analysis complete!");
    } catch (error) {
      console.error("Error analyzing chemistry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze chemistry");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRecipe = (dish: SuggestedDish) => {
    navigate(`/generate?ingredients=${ingredients.join(",")}&dish=${encodeURIComponent(dish.name)}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-sage";
    if (score >= 40) return "text-yellow-500";
    return "text-destructive";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-sage";
    if (score >= 60) return "from-sage to-yellow-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-orange-500 to-destructive";
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-2 mb-4">
              <Beaker className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Flavor Lab
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ingredient Chemistry
            </h1>
            <p className="text-muted-foreground">
              Discover how your ingredients pair together using molecular gastronomy principles.
              Get compatibility scores, flavor profiles, and dish suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Input Panel */}
            <div className="bg-card rounded-2xl border border-border shadow-soft p-6 md:p-8">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Your Ingredients
              </h2>
              
              <IngredientInput
                ingredients={ingredients}
                onAdd={handleAddIngredient}
                onRemove={handleRemoveIngredient}
              />

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Cuisine Context
                  </label>
                  <Select value={cuisine} onValueChange={setCuisine}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Leaf className="w-4 h-4 text-secondary" />
                    Dish Type
                  </label>
                  <Select value={dishType} onValueChange={setDishType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dishTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-8"
                onClick={analyzeChemistry}
                disabled={isAnalyzing || ingredients.length < 2}
              >
                <Beaker className="w-5 h-5" />
                {isAnalyzing ? "Analyzing..." : "Analyze Chemistry"}
              </Button>

              {ingredients.length < 2 && ingredients.length > 0 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Add at least 2 ingredients to analyze their chemistry
                </p>
              )}
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {isAnalyzing && <LoadingSpinner text="Analyzing flavor chemistry..." />}
              
              {result && !isAnalyzing && (
                <div className="space-y-6 animate-fade-up">
                  {/* Score Card */}
                  <div className="bg-card rounded-2xl shadow-card border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        Compatibility Score
                      </h3>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full bg-accent ${getScoreColor(result.score)}`}>
                        {result.label}
                      </span>
                    </div>

                    {/* Score Meter */}
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getScoreGradient(result.score)} transition-all duration-500`}
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0</span>
                      <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </span>
                      <span>100</span>
                    </div>

                    <p className="mt-4 text-foreground">{result.explanation}</p>

                    {/* Flavor Profile */}
                    {result.flavorProfile && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3">Flavor Profile</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.flavorProfile.dominant.map((flavor, idx) => (
                            <span
                              key={`dom-${idx}`}
                              className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium"
                            >
                              {flavor}
                            </span>
                          ))}
                          {result.flavorProfile.secondary.map((flavor, idx) => (
                            <span
                              key={`sec-${idx}`}
                              className="px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-sm"
                            >
                              {flavor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested Dishes */}
                  {result.suggestedDishes.length > 0 && (
                    <div className="bg-card rounded-2xl shadow-card border border-border p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ChefHat className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          Suggested Dishes
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {result.suggestedDishes.map((dish, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-foreground">{dish.name}</p>
                              <p className="text-sm text-muted-foreground">{dish.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateRecipe(dish)}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adjustments */}
                  {result.suggestedAdjustments.length > 0 && (
                    <div className="bg-card rounded-2xl shadow-card border border-border p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          Tips to Enhance
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {result.suggestedAdjustments.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-foreground">
                            <span className="text-primary mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!result && !isAnalyzing && (
                <div className="h-full flex items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-border">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
                      <Beaker className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Chemistry analysis will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default IngredientChemistry;
