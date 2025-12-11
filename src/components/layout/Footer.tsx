import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/yummiai-logo.png"
                alt="YummiAI Logo"
                className="w-12 h-12 object-contain rounded-xl shadow-soft transition-all duration-300"
              />
              <span className="font-heading text-xl font-bold text-secondary-foreground">
                Yummi<span className="text-primary">AI</span>
              </span>
            </Link>

            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Transform ingredients into culinary masterpieces with AI-powered recipe generation and food intelligence.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4">Features</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/generate" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  Recipe Generation
                </Link>
              </li>
              <li>
                <Link to="/scan" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  Food Scanner
                </Link>
              </li>
              <li>
                <Link to="/nutrition" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  Nutrition Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/70 hover:text-primary text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4">Connect</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/70 hover:text-primary hover:bg-primary/20 transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/70 hover:text-primary hover:bg-primary/20 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/70 hover:text-primary hover:bg-primary/20 transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-secondary-foreground/70 text-sm">
            © {new Date().getFullYear()} YummiAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
