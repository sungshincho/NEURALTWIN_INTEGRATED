import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

// 2D 그리드용 허용된 히트맵 위치
const allowedHeatmapPositions: [number, number][] = [
  // 입구 영역 (상단)
  [3, 0], [4, 0], [5, 0], [6, 0],
  
  // 메인 통로 (세로)
  [3, 1], [4, 1], [5, 1], [6, 1],
  [3, 2], [4, 2], [5, 2], [6, 2],
  [3, 3], [4, 3], [5, 3], [6, 3],
  [3, 4], [4, 4], [5, 4], [6, 4],
  [3, 5], [4, 5], [5, 5], [6, 5],
  [3, 6], [4, 6], [5, 6], [6, 6],
  [3, 7], [4, 7], [5, 7], [6, 7],
  
  // 좌측 진열대 영역
  [0, 2], [1, 2], [2, 2],
  [0, 3], [1, 3], [2, 3],
  [0, 4], [1, 4], [2, 4],
  [0, 5], [1, 5], [2, 5],
  [0, 6], [1, 6], [2, 6],
  
  // 우측 진열대 영역
  [7, 2], [8, 2], [9, 2],
  [7, 3], [8, 3], [9, 3],
  [7, 4], [8, 4], [9, 4],
  [7, 5], [8, 5], [9, 5],
  [7, 6], [8, 6], [9, 6],
  
  // 계산대 영역 (하단)
  [3, 8], [4, 8], [5, 8], [6, 8],
  [3, 9], [4, 9], [5, 9], [6, 9],
];

const generateHeatmapData = (timeOfDay: number): HeatmapCell[] => {
  const data: HeatmapCell[] = [];

  // 시간대별 패턴
  const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;
  const isPeakHour = (timeOfDay >= 12 && timeOfDay <= 14) || (timeOfDay >= 18 && timeOfDay <= 20);
  const peakBonus = isPeakHour ? 0.25 : 0;

  // allowedHeatmapPositions에 정의된 좌표에만 히트맵 생성
  allowedHeatmapPositions.forEach(([x, y]) => {
    // 구역별 기본 강도
    let zoneIntensity = 0;
    
    // 입구 영역 (y = 0)
    if (y === 0) {
      zoneIntensity = 0.6;
    }
    // 계산대 영역 (y >= 8)
    else if (y >= 8 && x >= 3 && x <= 6) {
      zoneIntensity = 0.8;
    }
    // 좌측 진열대 (x < 3)
    else if (x < 3) {
      zoneIntensity = 0.5;
    }
    // 우측 진열대 (x > 6)
    else if (x > 6) {
      zoneIntensity = 0.45;
    }
    // 중앙 통로 (x 3-6, y 1-7)
    else if (x >= 3 && x <= 6 && y >= 1 && y <= 7) {
      zoneIntensity = 0.4;
    }
    // 기타
    else {
      zoneIntensity = 0.2;
    }

    const randomVariation = (Math.random() - 0.5) * 0.2;
    const intensity = Math.min(
      1,
      Math.max(0, (zoneIntensity + randomVariation + peakBonus) * timeMultiplier)
    );

    data.push({ x, y, intensity });
  });

  return data;
};

export const TrafficHeatmap = () => {
  const [timeOfDay, setTimeOfDay] = useState(14); // 2 PM
  const [isPlaying, setIsPlaying] = useState(false);
  const [heatmapData, setHeatmapData] = useState(() => generateHeatmapData(14));

  const updateHeatmap = (newTime: number) => {
    setTimeOfDay(newTime);
    setHeatmapData(generateHeatmapData(newTime));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    updateHeatmap(14);
  };

  useState(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev >= 23 ? 9 : prev + 1;
        setHeatmapData(generateHeatmapData(next));
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  });

  const getHeatColor = (intensity: number) => {
    if (intensity < 0.2) return "bg-blue-500/10";
    if (intensity < 0.4) return "bg-cyan-500/30";
    if (intensity < 0.6) return "bg-yellow-500/50";
    if (intensity < 0.8) return "bg-orange-500/70";
    return "bg-red-500/90";
  };

  const maxIntensity = Math.max(...heatmapData.map((d) => d.intensity));
  const avgIntensity = heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length;
  const hotspots = heatmapData.filter((d) => d.intensity > 0.7).length;

  // 10x10 그리드에서 허용된 위치만 표시
  const gridCells = Array.from({ length: 100 }, (_, idx) => {
    const x = idx % 10;
    const y = Math.floor(idx / 10);
    const cellData = heatmapData.find(cell => cell.x === x && cell.y === y);
    return { x, y, intensity: cellData?.intensity || 0, isAllowed: !!cellData };
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Heatmap Visualization */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">실시간 히트맵</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {String(timeOfDay).padStart(2, "0")}:00
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
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-10 gap-1">
                {gridCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`rounded-sm transition-all duration-300 ${
                      cell.isAllowed 
                        ? getHeatColor(cell.intensity)
                        : 'bg-muted/10'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute top-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
                입구
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/10 rounded" />
                낮음
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500/50 rounded" />
                중간
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/90 rounded" />
                높음
              </span>
            </div>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">시간대 선택</label>
            <Slider
              value={[timeOfDay]}
              onValueChange={(v) => updateHeatmap(v[0])}
              min={9}
              max={23}
              step={1}
              disabled={isPlaying}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>09:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-4">
          <h4 className="font-semibold">분석 결과</h4>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">피크 강도</div>
            <div className="text-2xl font-bold">{(maxIntensity * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">최대 혼잡도</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">평균 트래픽</div>
            <div className="text-2xl font-bold">{(avgIntensity * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">전체 평균</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">핫스팟</div>
            <div className="text-2xl font-bold">{hotspots}개</div>
            <div className="text-xs text-muted-foreground">고밀도 구역</div>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">시간대별 추이</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">오전 (09-12)</span>
                <span className="font-medium">35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">점심 (12-15)</span>
                <span className="font-medium text-primary">72%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오후 (15-18)</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">저녁 (18-23)</span>
                <span className="font-medium">45%</span>
              </div>
            </div>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-xs">
              <span className="font-semibold">인사이트:</span> 점심시간(12-15시) 트래픽 집중.
              입구 우측 구역에 인기 상품 배치 권장.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};