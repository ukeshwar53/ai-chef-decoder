import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IngredientInputProps {
  ingredients: string[];
  onAdd: (ingredient: string) => void;
  onRemove: (index: number) => void;
}

export const IngredientInput = ({
  ingredients,
  onAdd,
  onRemove,
}: IngredientInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add an ingredient (e.g., chicken breast)"
          className="flex-1"
        />
        <Button onClick={handleAdd} size="icon" variant="default">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-accent rounded-full px-4 py-2 animate-scale-in"
            >
              <span className="text-sm font-medium text-foreground">
                {ingredient}
              </span>
              <button
                onClick={() => onRemove(index)}
                className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
