import { ChefHat } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner = ({ text = "Cooking up something delicious..." }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-up">
      <div className="relative">
        <div className="w-20 h-20 rounded-full gradient-warm animate-pulse-glow flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-primary-foreground animate-bounce" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
      </div>
      <p className="mt-6 text-muted-foreground font-medium">{text}</p>
    </div>
  );
};
