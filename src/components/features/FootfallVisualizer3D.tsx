import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Users, Clock, TrendingUp, MapPin } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";
import { generateRandomCustomerPath, pathReachesCheckout } from "@/lib/pathfinding";

interface CustomerPath {
  id: string;
  points: [number, number, number][];
  isReturning: boolean;
  dwellTime: number;
}

const generateDemoData = (timeRange: [number, number]): CustomerPath[] => {
  // 10 ~ 20 사이 랜덤 정수
  const pathCount = Math.floor(Math.random() * 11) + 5;
  const paths: CustomerPath[] = [];
  
  const timeRangeStr = `${String(timeRange[0]).padStart(2, '0')}:00-${String(timeRange[1]).padStart(2, '0')}:00`;
  
  for (let i = 0; i < pathCount; i++) {
    const { path: points, caseIndex } = generateRandomCustomerPath(timeRangeStr);
    const wentToCheckout = pathReachesCheckout(points, caseIndex);
    
    const dwellTime = wentToCheckout 
      ? Math.random() * 12 + 3
      : Math.random() * 2 + 0.5;
    
    paths.push({
      id: `customer-${i}`,
      points,
      isReturning: !wentToCheckout,
      dwellTime,
    });
  }
  
  return paths;
};

export const FootfallVisualizer3D = () => {
  const [timeRange, setTimeRange] = useState<[number, number]>([10, 20]);
  const [showReturning, setShowReturning] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentHour, setCurrentHour] = useState(10);
  
  const customerPaths = useMemo(() => generateDemoData(timeRange), [timeRange]);
  

  // 통계 계산
  const filteredPaths = customerPaths.filter(
    (path) =>
      ((path.isReturning && showReturning) || (!path.isReturning && showNew))
  );
  
  const totalVisitors = filteredPaths.length;
  const newVisitors = filteredPaths.filter(p => !p.isReturning).length;
  const returningVisitors = filteredPaths.filter(p => p.isReturning).length;
  const avgDwellTime = filteredPaths.length > 0 
    ? (filteredPaths.reduce((sum, p) => sum + p.dwellTime, 0) / filteredPaths.length).toFixed(1)
    : '0';
  const conversionRate = ((filteredPaths.filter(p => p.dwellTime > 5).length / Math.max(filteredPaths.length, 1)) * 100).toFixed(1);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentHour(timeRange[0]);
  };

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="footfall"
        showReturning={showReturning}
        showNew={showNew}
        customerPaths={filteredPaths}
        isPlaying={isPlaying}
      />

      {/* 컨트롤 패널 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 시간 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              시간 범위
            </h4>
            <Badge variant="secondary">
              {String(currentHour).padStart(2, "0")}:00
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              영업 시간: {timeRange[0]}시 - {timeRange[1]}시
            </Label>
            <Slider
              min={10}
              max={20}
              step={1}
              value={timeRange}
              onValueChange={(value) => {
                setTimeRange(value as [number, number]);
                setCurrentHour(value[0]);
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 필터 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            방문자 필터
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <Label htmlFor="new-visitors">신규 방문자</Label>
              </div>
              <Switch 
                id="new-visitors" 
                checked={showNew} 
                onCheckedChange={setShowNew} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <Label htmlFor="returning-visitors">재방문자</Label>
              </div>
              <Switch 
                id="returning-visitors" 
                checked={showReturning} 
                onCheckedChange={setShowReturning} 
              />
            </div>
          </div>
        </Card>

        {/* 통계 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            실시간 통계
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">총 방문자</div>
              <div className="text-2xl font-bold gradient-text">{totalVisitors}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">전환율</div>
              <div className="text-2xl font-bold gradient-text">{conversionRate}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">평균 체류</div>
              <div className="text-2xl font-bold gradient-text">{avgDwellTime}분</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">재방문율</div>
              <div className="text-2xl font-bold gradient-text">
                {totalVisitors > 0 ? ((returningVisitors / totalVisitors) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="flex-1 justify-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
              신규 {newVisitors}
            </Badge>
            <Badge variant="outline" className="flex-1 justify-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-1" />
              재방문 {returningVisitors}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
