import { Clock, Users, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecipeCardProps {
  title: string;
  description: string;
  cookTime: string;
  servings: number;
  calories: number;
  ingredients: string[];
  instructions: string[];
  onGetNutrition?: () => void;
}

export const RecipeCard = ({
  title,
  description,
  cookTime,
  servings,
  calories,
  ingredients,
  instructions,
  onGetNutrition,
}: RecipeCardProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="gradient-warm p-6">
        <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-2">
          {title}
        </h3>
        <p className="text-primary-foreground/90 text-sm">{description}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 p-6 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm">{cookTime}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4 text-secondary" />
          <span className="text-sm">{servings} servings</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-sm">{calories} kcal</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Ingredients */}
        <div>
          <h4 className="font-heading font-semibold text-foreground mb-3">
            Ingredients
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ingredients.map((ingredient, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="font-heading font-semibold text-foreground mb-3">
            Instructions
          </h4>
          <ol className="space-y-3">
            {instructions.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action */}
        {onGetNutrition && (
          <Button
            variant="sage"
            className="w-full"
            onClick={onGetNutrition}
          >
            Get Nutrition Info
          </Button>
        )}
      </div>
    </div>
  );
};
