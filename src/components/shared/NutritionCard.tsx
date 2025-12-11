import { Flame, Drumstick, Wheat, Droplets } from "lucide-react";

interface NutritionCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dishName?: string;
}

export const NutritionCard = ({
  calories,
  protein,
  carbs,
  fats,
  dishName,
}: NutritionCardProps) => {
  const nutrients = [
    {
      label: "Calories",
      value: calories,
      unit: "kcal",
      icon: Flame,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Protein",
      value: protein,
      unit: "g",
      icon: Drumstick,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Carbs",
      value: carbs,
      unit: "g",
      icon: Wheat,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Fats",
      value: fats,
      unit: "g",
      icon: Droplets,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-scale-in">
      {dishName && (
        <div className="gradient-sage p-6">
          <h3 className="font-heading text-xl font-bold text-secondary-foreground">
            Nutrition Facts
          </h3>
          <p className="text-secondary-foreground/90 text-sm mt-1">
            {dishName}
          </p>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {nutrients.map((nutrient) => (
            <div
              key={nutrient.label}
              className={`p-4 rounded-xl ${nutrient.bgColor} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-2">
                <nutrient.icon className={`w-5 h-5 ${nutrient.color}`} />
                <span className="text-sm font-medium text-foreground">
                  {nutrient.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${nutrient.color}`}>
                  {nutrient.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {nutrient.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Macros Bar */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Macro Distribution
          </h4>
          <div className="h-4 rounded-full overflow-hidden flex bg-muted">
            <div
              className="bg-secondary h-full transition-all duration-500"
              style={{ width: `${(protein * 4 / (protein * 4 + carbs * 4 + fats * 9)) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${(carbs * 4 / (protein * 4 + carbs * 4 + fats * 9)) * 100}%` }}
            />
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${(fats * 9 / (protein * 4 + carbs * 4 + fats * 9)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Protein
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Carbs
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Fats
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
