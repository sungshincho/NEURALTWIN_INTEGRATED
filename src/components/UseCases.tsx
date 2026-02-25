import { Card } from "@/components/ui/card";
import { Factory, Hospital, Plane, Building2 } from "lucide-react";

const useCases = [
  {
    icon: Factory,
    title: "Manufacturing",
    description: "Optimize production lines, predict equipment failures, and reduce downtime by 60%.",
    stats: "60% less downtime",
  },
  {
    icon: Hospital,
    title: "Healthcare",
    description: "Create patient digital twins for personalized treatment and drug development.",
    stats: "3x faster diagnosis",
  },
  {
    icon: Plane,
    title: "Aerospace",
    description: "Simulate flight dynamics and predict maintenance needs before issues arise.",
    stats: "40% cost reduction",
  },
  {
    icon: Building2,
    title: "Smart Cities",
    description: "Model traffic patterns, energy consumption, and urban infrastructure.",
    stats: "25% energy savings",
  },
];

export const UseCases = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Industry <span className="text-gradient">Use Cases</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trusted by leading organizations across multiple sectors
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="p-8 bg-gradient-to-br from-card to-secondary/20 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <useCase.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2 text-foreground">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-3">{useCase.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {useCase.stats}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
