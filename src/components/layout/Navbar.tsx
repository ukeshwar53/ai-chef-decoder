import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, Menu, X, User, LogOut, Heart, Calendar, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate Recipe" },
  { href: "/scan", label: "Scan Food" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/ingredient-chemistry", label: "Flavor Lab" },
  { href: "/about", label: "About" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft group-hover:shadow-card transition-all duration-300 group-hover:scale-105">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-secondary-foreground">
              Yummi<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 border-primary/50 text-secondary-foreground hover:bg-primary/20">
                        <User className="w-4 h-4" />
                        <span className="max-w-24 truncate">
                          {user.user_metadata?.display_name || user.email?.split("@")[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate("/saved-recipes")}>
                        <Heart className="w-4 h-4 mr-2" />
                        Saved Recipes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/meal-plans")}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Meal Plans
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/nutrition-history")}>
                        <History className="w-4 h-4 mr-2" />
                        Nutrition History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
                    Get Started
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary-foreground/10 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-secondary-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-secondary-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                    location.pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    to="/saved-recipes"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Saved Recipes
                  </Link>
                  <Link
                    to="/meal-plans"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Meal Plans
                  </Link>
                  <Link
                    to="/nutrition-history"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Nutrition History
                  </Link>
                </>
              )}
              <div className="pt-2">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full border-primary/50 text-secondary-foreground"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={() => {
                      navigate("/auth");
                      setIsOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
