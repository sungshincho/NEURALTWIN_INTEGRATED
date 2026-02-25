import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Demo data: simplified footfall points
const generateDemoData = () => {
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push({
      x: Math.random() * 400,
      y: Math.random() * 300,
      time: Math.random() * 24,
      isReturning: Math.random() > 0.6,
      dwell: Math.random() * 10 + 1,
    });
  }
  return points;
};

export const FootfallVisualizer = () => {
  const [data] = useState(generateDemoData());
  const [timeRange, setTimeRange] = useState([0, 24]);
  const [showReturning, setShowReturning] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const filteredData = data.filter(
    (point) =>
      point.time >= timeRange[0] &&
      point.time <= timeRange[1] &&
      ((point.isReturning && showReturning) || (!point.isReturning && showNew))
  );

  const inboundRate = ((filteredData.length / data.length) * 100).toFixed(1);
  const avgDwell = (filteredData.reduce((sum, p) => sum + p.dwell, 0) / filteredData.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-4 block">시간 범위: {timeRange[0]}시 - {timeRange[1]}시</Label>
          <Slider
            min={0}
            max={24}
            step={1}
            value={timeRange}
            onValueChange={setTimeRange}
            className="mb-6"
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-visitors">신규 방문자</Label>
              <Switch id="new-visitors" checked={showNew} onCheckedChange={setShowNew} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="returning-visitors">재방문자</Label>
              <Switch id="returning-visitors" checked={showReturning} onCheckedChange={setShowReturning} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap">Heatmap 오버레이</Label>
              <Switch id="heatmap" checked={showHeatmap} onCheckedChange={setShowHeatmap} />
            </div>
          </div>
        </Card>

        <Card className="glass p-6 space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Inbound Rate</div>
            <div className="text-3xl font-bold gradient-text">{inboundRate}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Avg Dwell Time</div>
            <div className="text-3xl font-bold gradient-text">{avgDwell} min</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Visitors in Range</div>
            <div className="text-3xl font-bold gradient-text">{filteredData.length}</div>
          </div>
        </Card>
      </div>

      {/* Visualization */}
      <Card className="glass p-6">
        <div className="relative w-full h-80 bg-muted/20 rounded-xl overflow-hidden">
          {showHeatmap && (
            <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-primary/10 to-transparent" />
          )}
          <svg className="w-full h-full">
            {filteredData.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={point.dwell * 0.5 + 2}
                fill={point.isReturning ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
                opacity={0.6}
                className="transition-smooth hover:opacity-100"
              >
                <title>
                  {point.isReturning ? "재방문" : "신규"} | {point.dwell.toFixed(1)}분 체류
                </title>
              </circle>
            ))}
          </svg>
          <div className="absolute bottom-4 left-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>재방문자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span>신규 방문자</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
