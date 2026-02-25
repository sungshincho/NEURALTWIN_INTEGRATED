import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-primary/20 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Powered by Advanced Neural Networks</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
          <span className="text-gradient">NEURALTWIN</span>
          <br />
          <span className="text-foreground">Digital Intelligence,</span>
          <br />
          <span className="text-foreground">Real Results</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
          Create accurate digital twins of complex systems using cutting-edge AI. 
          Simulate, predict, and optimize with unprecedented precision.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group">
            Start Building
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
            View Demo
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-in-up delay-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">99.9%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">10M+</div>
            <div className="text-sm text-muted-foreground">Simulations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Enterprises</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Monitoring</div>
          </div>
        </div>
      </div>
    </section>
  );
};
