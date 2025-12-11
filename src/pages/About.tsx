import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ChefHat, 
  Brain, 
  Sparkles, 
  Heart, 
  Target, 
  Lightbulb,
  ArrowRight 
} from "lucide-react";

const values = [
  {
    icon: Brain,
    title: "Intelligence",
    description: "Leveraging cutting-edge AI to understand ingredients, flavors, and cooking techniques.",
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Built by food enthusiasts who believe cooking should be accessible to everyone.",
  },
  {
    icon: Target,
    title: "Precision",
    description: "Accurate nutritional analysis and scientifically-backed flavor pairing.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Continuously improving our AI to deliver better recipes and recommendations.",
  },
];

const About = () => {
  return (
    <Layout>

      {/* HERO SECTION WITH BACKGROUND IMAGE */}
      <section
        className="py-20 md:py-32 gradient-hero relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://www.foodinspiration.com/img/cache/Dall-EinterpretationofafoodprofessionalusingAI.png-1600x900.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/40 rounded-full px-4 py-2 mb-6 animate-fade-up">
              
              <span className="text-sm font-medium text-white">
                About CulinaryAI
              </span>
            </div>

            <h1
              className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="text-yellow-500">Reimagining the Way</span>
              <span className="text-yellow-500 block mt-2">We Cook</span>
            </h1>

            <p
              className="text-lg md:text-xl text-white/80 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              CulinaryAI combines artificial intelligence with culinary expertise to transform how you discover, create, and enjoy food.
            </p>
          </div>
        </div>
      </section>

      {/* OUR MISSION SECTION WITH IMAGE */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

            {/* Mission Text */}
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We believe that everyone deserves access to delicious, nutritious, and easy-to-make recipes. Our mission is to democratize culinary creativity through the power of artificial intelligence.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                By combining advanced machine learning with extensive culinary databases, we've created a platform that understands not just ingredients, but the science of flavor, nutrition, and cooking techniques.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're a busy parent looking for quick meals, a fitness enthusiast tracking macros, or a curious cook exploring new cuisines — CulinaryAI is here to help.
              </p>
            </div>

            {/* Mission Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-elevated">
                <img
                  src="/robot.jpeg"
                  alt="Mission"
                  className="w-full h-full object-cover"
                />
              </div>

              
            </div>

          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do at CulinaryAI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-background border border-border shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Powered by Advanced AI
              </h2>
              <p className="text-muted-foreground">
                Our technology stack is designed to deliver accurate, creative, and practical culinary solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Recipe Generation
                </h3>
                <p className="text-sm text-muted-foreground">
                  GPT-powered models trained on millions of recipes to create unique, cookable dishes.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Image Recognition
                </h3>
                <p className="text-sm text-muted-foreground">
                  Computer vision to identify dishes and ingredients from photos with high accuracy.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  Nutrition Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive nutritional databases for accurate macro and micronutrient tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 gradient-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Start Cooking?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Experience the future of culinary creativity with CulinaryAI.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/generate">
                Generate Your First Recipe
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default About;
