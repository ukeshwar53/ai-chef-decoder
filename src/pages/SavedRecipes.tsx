import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { RecipeCard } from "@/components/shared/RecipeCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SavedRecipe {
  id: string;
  title: string;
  description: string;
  cook_time: string;
  servings: number;
  calories: number;
  ingredients: string[];
  instructions: string[];
  cuisine: string;
  diet: string;
  created_at: string;
}

export default function SavedRecipes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load saved recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRecipes(recipes.filter((r) => r.id !== id));
      toast({
        title: "Recipe removed",
        description: "The recipe has been removed from your collection",
      });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Your Collection</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Saved Recipes
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your personal collection of AI-generated recipes
            </p>
          </div>

          {/* Recipes Grid */}
          {recipes.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="relative">
                  <RecipeCard
                    title={recipe.title}
                    description={recipe.description || ""}
                    cookTime={recipe.cook_time || ""}
                    servings={recipe.servings || 4}
                    calories={recipe.calories || 0}
                    ingredients={recipe.ingredients}
                    instructions={recipe.instructions}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                No saved recipes yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start generating recipes and save your favorites!
              </p>
              <Button variant="hero" onClick={() => navigate("/generate")}>
                Generate a Recipe
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
