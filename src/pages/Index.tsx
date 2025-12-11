import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  ChefHat,
  Sparkles,
  Camera,
  PieChart,
  Leaf,
  ArrowRight,
  Heart,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Recipe Generation",
    description:
      "Transform your ingredients into delicious recipes with our intelligent AI engine.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Camera,
    title: "Food Scanner",
    description:
      "Upload a photo of any dish and instantly identify ingredients and get the recipe.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: PieChart,
    title: "Nutrition Analysis",
    description:
      "Get detailed nutritional breakdowns for any recipe or ingredient combination.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Leaf,
    title: "Diet Optimization",
    description:
      "Personalized recipes for vegan, keto, low-carb, and other dietary preferences.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const stats = [
  { value: "10K+", label: "Recipes Generated" },
  { value: "50+", label: "Cuisines Supported" },
  { value: "99%", label: "Accuracy Rate" },
  { value: "24/7", label: "AI Availability" },
];

const Index = () => {
  const heroBg = {
    backgroundImage: `url("https://www.digicomply.com/hubfs/ai%20in%20food%20safety%20(1).png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden gradient-hero"
        style={heroBg}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-6 animate-fade-up">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">
                AI-Powered Culinary Intelligence
              </span>
            </div>

            <h1
              className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Transform Ingredients Into
              <span className="text-gradient block mt-2">Culinary Masterpieces</span>
            </h1>

            <p
              className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Discover the future of cooking with YummiAI. Generate recipes, analyze nutrition,
              and explore flavor science with cutting-edge artificial intelligence.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/generate" className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Start Cooking
                </Link>
              </Button>

              <Button
                variant="outline"
                size="xl"
                asChild
                className="border-primary/50 text-white hover:bg-primary/20"
              >
                <Link to="/scan" className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scan Food
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="font-heading text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section WITH Background Image */}
      <section
        className="py-20 md:py-32 relative"
        style={{
          backgroundImage:
            'url("https://usercontent.one/wp/foodbydesign.nl/wp-content/uploads/2024/04/0glWSHFES0OWni4uEUTN5A-600x400.png?media=1757318354")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features for Food Lovers
            </h2>
            <p className="text-white/80">
              Everything you need to explore, create, and perfect your culinary journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-secondary-foreground">
                Made with love for food enthusiasts
              </span>
            </div>

            <h2 className="font-heading text-3xl md:text-5xl font-bold text-secondary-foreground mb-6">
              Ready to Elevate Your Cooking?
            </h2>

            <p className="text-lg text-secondary-foreground/70 mb-10">
              Join thousands of home cooks and professional chefs who use YummiAI every day.
            </p>

            <Button variant="hero" size="xl" asChild>
              <Link to="/auth" className="flex items-center gap-2 justify-center">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
