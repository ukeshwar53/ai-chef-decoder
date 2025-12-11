import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import GenerateRecipe from "./pages/GenerateRecipe";
import ScanFood from "./pages/ScanFood";
import Nutrition from "./pages/Nutrition";
import IngredientChemistry from "./pages/IngredientChemistry";
import About from "./pages/About";
import Auth from "./pages/Auth";
import SavedRecipes from "./pages/SavedRecipes";
import MealPlans from "./pages/MealPlans";
import NutritionHistory from "./pages/NutritionHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/generate" element={
              <ProtectedRoute>
                <GenerateRecipe />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <ScanFood />
              </ProtectedRoute>
            } />
            <Route path="/nutrition" element={
              <ProtectedRoute>
                <Nutrition />
              </ProtectedRoute>
            } />
            <Route path="/ingredient-chemistry" element={
              <ProtectedRoute>
                <IngredientChemistry />
              </ProtectedRoute>
            } />
            <Route path="/saved-recipes" element={
              <ProtectedRoute>
                <SavedRecipes />
              </ProtectedRoute>
            } />
            <Route path="/meal-plans" element={
              <ProtectedRoute>
                <MealPlans />
              </ProtectedRoute>
            } />
            <Route path="/nutrition-history" element={
              <ProtectedRoute>
                <NutritionHistory />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
