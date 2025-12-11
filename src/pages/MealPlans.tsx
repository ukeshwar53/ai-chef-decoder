import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Plus, Trash2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MealPlan {
  id: string;
  name: string;
  date: string;
  meal_type: string;
  notes: string | null;
  recipe_id: string | null;
  created_at: string;
}

interface SavedRecipe {
  id: string;
  title: string;
}

export default function MealPlans() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState<string>("breakfast");
  const [recipeId, setRecipeId] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [plansResult, recipesResult] = await Promise.all([
        supabase
          .from("meal_plans")
          .select("*")
          .eq("user_id", user?.id)
          .order("date", { ascending: true }),
        supabase
          .from("saved_recipes")
          .select("id, title")
          .eq("user_id", user?.id),
      ]);

      if (plansResult.error) throw plansResult.error;
      if (recipesResult.error) throw recipesResult.error;

      setMealPlans(plansResult.data || []);
      setSavedRecipes(recipesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load meal plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !date || !mealType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("meal_plans").insert({
        user_id: user?.id,
        name,
        date,
        meal_type: mealType,
        recipe_id: recipeId || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Meal plan added",
        description: "Your meal has been added to the plan",
      });

      setName("");
      setNotes("");
      setRecipeId("");
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error adding meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to add meal plan",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("meal_plans").delete().eq("id", id);

      if (error) throw error;

      setMealPlans(mealPlans.filter((m) => m.id !== id));
      toast({
        title: "Meal removed",
        description: "The meal has been removed from your plan",
      });
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete meal plan",
        variant: "destructive",
      });
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-amber-100 text-amber-800";
      case "lunch":
        return "bg-green-100 text-green-800";
      case "dinner":
        return "bg-blue-100 text-blue-800";
      case "snack":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-muted text-muted-foreground";
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
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Plan Ahead</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meal Plans
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Organize your meals for the week
            </p>
            <Button variant="hero" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Meal
            </Button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="max-w-xl mx-auto mb-12 p-6 bg-card rounded-2xl border border-border shadow-soft">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Meal Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chicken Salad"
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meal Type *</Label>
                    <Select value={mealType} onValueChange={setMealType}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {savedRecipes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Saved Recipe (optional)</Label>
                    <Select value={recipeId} onValueChange={setRecipeId}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedRecipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="h-12"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="hero" className="flex-1">
                    Add to Plan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Meal Plans List */}
          {mealPlans.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {mealPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 bg-card rounded-xl border border-border shadow-soft flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(plan.date), "MMM")}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {format(new Date(plan.date), "d")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{plan.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getMealTypeColor(plan.meal_type)}`}
                        >
                          {plan.meal_type}
                        </span>
                        {plan.notes && (
                          <span className="text-xs text-muted-foreground">
                            {plan.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
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
                No meal plans yet
              </h3>
              <p className="text-muted-foreground">
                Start planning your meals by clicking "Add Meal" above
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
