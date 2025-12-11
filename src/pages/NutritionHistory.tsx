import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, Trash2, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface NutritionEntry {
  id: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tracked_at: string;
}

export default function NutritionHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("nutrition_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("tracked_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      toast({
        title: "Error",
        description: "Failed to load nutrition history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("nutrition_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: "Entry removed",
        description: "The entry has been removed from your history",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
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
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">Track Progress</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nutrition History
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your tracked nutrition calculations
            </p>
          </div>

          {/* Entries List */}
          {entries.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 bg-card rounded-2xl border border-border shadow-soft"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.tracked_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-accent rounded-full text-xs text-foreground"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-background rounded-xl">
                      <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {Math.round(entry.calories)}
                      </p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-xl">
                      <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {Math.round(entry.protein)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-xl">
                      <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {Math.round(entry.carbs)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-xl">
                      <Droplet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {Math.round(entry.fats)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Fats</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <History className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                No nutrition history yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Calculate nutrition for ingredients and save them here!
              </p>
              <Button variant="hero" onClick={() => navigate("/nutrition")}>
                Calculate Nutrition
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
