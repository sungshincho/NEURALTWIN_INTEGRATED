import { Brain, Zap, Shield, TrendingUp, Cpu, Network } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Neural Architecture",
    description: "Advanced deep learning models that adapt and evolve with your data in real-time.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Process millions of data points per second with sub-millisecond latency.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and compliance with SOC 2, GDPR, and ISO standards.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    description: "Forecast outcomes with 99.9% accuracy using advanced AI algorithms.",
  },
  {
    icon: Cpu,
    title: "Edge Computing",
    description: "Deploy models anywhere - cloud, edge, or on-premise infrastructure.",
  },
  {
    icon: Network,
    title: "Seamless Integration",
    description: "Connect with your existing tools via REST API, GraphQL, or SDKs.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="text-gradient">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build, deploy, and scale AI-powered digital twins
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
