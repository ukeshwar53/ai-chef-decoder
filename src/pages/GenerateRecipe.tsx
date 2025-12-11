import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { IngredientInput } from "@/components/shared/IngredientInput";
import { RecipeCard } from "@/components/shared/RecipeCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NutritionCard } from "@/components/shared/NutritionCard";
import { CameraCapture } from "@/components/shared/CameraCapture"; // named import works
import { Sparkles, Leaf, Globe, Heart, Loader2, Camera as CameraIcon, Type, Beaker } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateRecipe, scanFood, type Recipe } from "@/lib/api/culinary-ai";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const cuisineOptions = [
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

const dietOptions = [
  "None",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Low-Carb",
  "High-Protein",
  "Gluten-Free",
  "Dairy-Free",
];

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const GenerateRecipe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pre-fill ingredients if passed via URL
  const initialIngredients = (searchParams.get("ingredients")?.split(",").filter(Boolean)) || [];

  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [cuisine, setCuisine] = useState("Italian");
  const [diet, setDiet] = useState("None");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "camera">("text");
  const [detectedDish, setDetectedDish] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const dish = searchParams.get("dish");
    if (dish) {
      console.log("Generating recipe for:", dish);
    }
  }, [searchParams]);

  const handleAddIngredient = (ingredient: string) => {
    const normalized = ingredient.toLowerCase().trim();
    if (normalized && !ingredients.includes(normalized)) {
      setIngredients((prev) => [...prev, normalized]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = async (imageBase64: string) => {
    setIsScanning(true);
    setDetectedDish(null);

    try {
      const result = await scanFood(imageBase64);

      // Add detected ingredients
      const newIngredients = result.ingredients
        .filter((ing) => ing.confidence >= 60)
        .map((ing) => ing.name.toLowerCase());

      const uniqueIngredients = [...new Set([...ingredients, ...newIngredients])];
      setIngredients(uniqueIngredients);

      if (result.dishName && result.dishName !== "Unknown dish") {
        setDetectedDish(result.dishName);
      }

      toast.success(`Detected ${newIngredients.length} ingredients from image!`);
      setInputMode("text"); // switch back to text to show results
    } catch (error) {
      console.error("Error scanning image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze image");
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length < 2) {
      toast.error("Please add at least 2 ingredients");
      return;
    }

    setIsLoading(true);
    setRecipe(null);
    setNutrition(null);

    try {
      const generatedRecipe = await generateRecipe(ingredients, cuisine, diet);
      setRecipe(generatedRecipe);
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate recipe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetNutrition = () => {
    if (!recipe) return;

    setNutrition({
      calories: recipe.calories,
      protein: Math.round((recipe.calories * 0.15) / 4),
      carbs: Math.round((recipe.calories * 0.45) / 4),
      fats: Math.round((recipe.calories * 0.35) / 9),
    });
    toast.success("Nutrition info calculated!");
  };

  const handleSaveRecipe = async () => {
    if (!recipe || !user) {
      toast.error("Please log in to save recipes");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("saved_recipes").insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        calories: recipe.calories,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cuisine,
        diet: diet === "None" ? null : diet,
      });

      if (error) throw error;
      toast.success("Recipe saved to your collection!");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckChemistry = () => {
    navigate(`/ingredient-chemistry?ingredients=${ingredients.join(",")}`);
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Recipe Generator</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Generate Your Perfect Recipe
            </h1>
            <p className="text-muted-foreground">
              Add your ingredients, select your preferences, and let our AI create a delicious recipe just for you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Input Panel */}
            <div className="bg-card rounded-2xl border border-border shadow-soft p-6 md:p-8">
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "text" | "camera")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="text" className="gap-2">
                    <Type className="w-4 h-4" />
                    Text Input
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="gap-2">
                    <CameraIcon className="w-4 h-4" />
                    Camera Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-0">
                  <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Your Ingredients</h2>

                  <IngredientInput ingredients={ingredients} onAdd={handleAddIngredient} onRemove={handleRemoveIngredient} />

                  {detectedDish && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-xl text-sm">
                      <span className="text-muted-foreground">Detected dish: </span>
                      <span className="font-medium text-foreground">{detectedDish}</span>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="camera" className="mt-0">
                  <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Capture Ingredients</h2>

                  {/* Mount CameraCapture only when camera tab is active to avoid hidden-video issues */}
                  {inputMode === "camera" && (
                    <CameraCapture onCapture={handleCameraCapture} isProcessing={isScanning} />
                  )}

                  {ingredients.length > 0 && (
                    <div className="mt-4 p-4 bg-accent rounded-xl">
                      <p className="text-sm font-medium text-foreground mb-2">Detected Ingredients ({ingredients.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {ingredients.map((ing, idx) => (
                          <span key={idx} className="px-3 py-1 bg-background rounded-full text-sm text-foreground">{ing}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Cuisine Type
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
                    Diet Preference
                  </label>
                  <Select value={diet} onValueChange={setDiet}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dietOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <Button variant="hero" size="lg" className="w-full" onClick={handleGenerateRecipe} disabled={isLoading || ingredients.length < 2}>
                  <Sparkles className="w-5 h-5" />
                  {isLoading ? "Generating..." : "Generate Recipe"}
                </Button>

                {ingredients.length >= 2 && (
                  <Button variant="outline" className="w-full" onClick={handleCheckChemistry}>
                    <Beaker className="w-4 h-4 mr-2" />
                    Check Ingredient Chemistry
                  </Button>
                )}
              </div>
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {isLoading && <LoadingSpinner />}

              {recipe && !isLoading && (
                <div className="space-y-4">
                  <RecipeCard {...recipe} onGetNutrition={handleGetNutrition} />
                  {user && (
                    <Button variant="sage" className="w-full" onClick={handleSaveRecipe} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                      Save to My Recipes
                    </Button>
                  )}
                </div>
              )}

              {nutrition && recipe && <NutritionCard {...nutrition} dishName={recipe.title} />}

              {!recipe && !isLoading && (
                <div className="h-full flex items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-border">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Your AI-generated recipe will appear here</p>
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

export default GenerateRecipe;
