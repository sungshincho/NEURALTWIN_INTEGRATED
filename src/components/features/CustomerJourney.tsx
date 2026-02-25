import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, User } from "lucide-react";

interface JourneyStep {
  x: number;
  y: number;
  action: string;
  duration: number;
}

const customerJourneys = [
  {
    id: "C1",
    type: "구매",
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0 },
      { x: 30, y: 25, action: "신상품 구경", duration: 45 },
      { x: 30, y: 50, action: "피팅룸", duration: 180 },
      { x: 70, y: 70, action: "계산대", duration: 90 },
      { x: 50, y: 90, action: "퇴장", duration: 0 },
    ],
    revenue: 125000,
  },
  {
    id: "C2",
    type: "브라우징",
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0 },
      { x: 70, y: 30, action: "인기상품", duration: 60 },
      { x: 40, y: 40, action: "할인코너", duration: 120 },
      { x: 60, y: 60, action: "악세사리", duration: 45 },
      { x: 50, y: 90, action: "퇴장", duration: 0 },
    ],
    revenue: 0,
  },
  {
    id: "C3",
    type: "구매",
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0 },
      { x: 60, y: 35, action: "신발 코너", duration: 90 },
      { x: 70, y: 70, action: "계산대", duration: 60 },
      { x: 50, y: 90, action: "퇴장", duration: 0 },
    ],
    revenue: 85000,
  },
];

export const CustomerJourney = () => {
  const [selectedJourney, setSelectedJourney] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const journey = customerJourneys[selectedJourney];
  const visibleSteps = journey.steps.slice(0, currentStep + 1);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= journey.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, journey.steps.length]);

  const handlePlay = () => {
    if (currentStep >= journey.steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const totalDuration = journey.steps.reduce((sum, step) => sum + step.duration, 0);
  const avgDwellTime = totalDuration / (journey.steps.length - 2); // Exclude entrance/exit

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Journey Map */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">고객 동선 맵</h4>
            <div className="flex items-center gap-2">
              <Badge variant={journey.type === "구매" ? "default" : "outline"}>
                {journey.type}
              </Badge>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handlePlay}>
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Card className="glass p-6">
            <div className="relative aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
              {/* Store Layout */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-2 py-1 rounded">
                입구
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs bg-background/80 px-2 py-1 rounded">
                출구
              </div>

              {/* Journey Path */}
              <svg className="absolute inset-0 w-full h-full">
                {visibleSteps.length > 1 &&
                  visibleSteps.map((step, idx) => {
                    if (idx === 0) return null;
                    const prevStep = visibleSteps[idx - 1];
                    return (
                      <line
                        key={`line-${idx}`}
                        x1={`${prevStep.x}%`}
                        y1={`${prevStep.y}%`}
                        x2={`${step.x}%`}
                        y2={`${step.y}%`}
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-fade-in"
                      />
                    );
                  })}
              </svg>

              {/* Journey Steps */}
              {visibleSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="absolute transition-all duration-500 animate-scale-in"
                  style={{
                    left: `${step.x}%`,
                    top: `${step.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx === currentStep
                          ? "bg-primary ring-4 ring-primary/30"
                          : "bg-primary/50"
                      }`}
                    >
                      {idx === 0 || idx === journey.steps.length - 1 ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <span className="text-xs font-bold text-primary-foreground">
                          {idx}
                        </span>
                      )}
                    </div>
                    {idx === currentStep && (
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {step.action}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            {customerJourneys.map((j, idx) => (
              <Button
                key={j.id}
                variant={selectedJourney === idx ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedJourney(idx);
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
              >
                고객 {j.id}
              </Button>
            ))}
          </div>
        </div>

        {/* Journey Details */}
        <div className="space-y-4">
          <h4 className="font-semibold">여정 상세</h4>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">총 체류 시간</div>
            <div className="text-2xl font-bold">{Math.floor(totalDuration / 60)}분</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">평균 구역 체류</div>
            <div className="text-2xl font-bold">{Math.floor(avgDwellTime)}초</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">방문 구역</div>
            <div className="text-2xl font-bold">{journey.steps.length - 2}개</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">구매 금액</div>
            <div className="text-2xl font-bold">
              {journey.revenue > 0 ? `₩${journey.revenue.toLocaleString()}` : "-"}
            </div>
          </Card>

          <div className="space-y-2">
            <h5 className="text-sm font-semibold">동선 단계</h5>
            <div className="space-y-2">
              {journey.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg transition-all ${
                    idx <= currentStep
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.action}</span>
                    {step.duration > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {Math.floor(step.duration / 60)}:{String(step.duration % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-xs">
              <span className="font-semibold">인사이트:</span>{" "}
              {journey.type === "구매"
                ? "구매 고객은 평균 3개 구역 방문, 피팅룸 활용률 높음."
                : "브라우징 고객 전환을 위해 할인 정보 강화 필요."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
