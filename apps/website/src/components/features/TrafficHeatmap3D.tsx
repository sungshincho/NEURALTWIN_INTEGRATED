import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Flame, Clock, TrendingUp, Target } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

interface Hotspot {
  x: number;
  y: number;
  intensity: number;
  zone: string;
}

/**
 * TrafficHeatmap3D 전용 히트맵 그리드 좌표들
 * -> 이 좌표들은 이미 "Viewer 좌표계 (x, z)" 기준의 통로 셀들이다.
 * -> Store3DViewer에서는 [x, 0.3, z] 형태로 사용된다.
 */
const allowedHeatmapPositions: [number, number][] = [
  // z = 5
  [-6, 5], [-5, 5], [-4, 5], [-3, 5], [-2, 5], [2, 5],

  // z = 4
  [-6, 4], [-5, 4], [-4, 4], [-3, 4], [-2, 4], [-1, 4],
  [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],

  // z = 3
  [-6, 3], [-5, 3], [-4, 3], [-3, 3], [-2, 3], [-1, 3],
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],

  // z = 2
  [-6, 2], [-5, 2], [-4, 2], [-3, 2], [-2, 2], [-1, 2],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],

  // z = 1
  [-6, 1], [-5, 1], [-4, 1], [-3, 1], [-2, 1], [-1, 1],
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],

  // z = 0
  [-6, 0], [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0],
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],

  // z = -1
  [-6, -1], [-5, -1], [-4, -1], [-3, -1], [-2, -1], [-1, -1],
  [0, -1], [1, -1], [2, -1], [3, -1], [4, -1], [5, -1], [6, -1],

  // z = -2
  [-6, -2], [-5, -2], [-4, -2], [-3, -2], [-2, -2], [-1, -2],
  [0, -2], [1, -2], [2, -2], [3, -2], [4, -2], [5, -2], [6, -2],

  // z = -3
  [-6, -3], [-5, -3], [-4, -3], [-3, -3], [-2, -3], [-1, -3],
  [0, -3], [1, -3], [2, -3], [3, -3], [4, -3], [5, -3], [6, -3],

  // z = -4
  [-6, -4], [-5, -4], [-4, -4], [-3, -4], [-2, -4], [-1, -4],
  [0, -4], [1, -4], [2, -4], [3, -4], [4, -4], [5, -4], [6, -4],

  // z = -5
  [-6, -5], [-5, -5], [-4, -5], [-3, -5], [-2, -5], [-1, -5],
  [0, -5], [1, -5], [2, -5], [3, -5], [4, -5], [5, -5], [6, -5],

  // z = -6
  [-6, -6], [-5, -6], [-4, -6], [-3, -6], [-2, -6], [-1, -6],
  [0, -6], [1, -6], [2, -6], [3, -6], [4, -6], [5, -6], [6, -6],

  // z = -7
  [-6, -7], [-5, -7], [-4, -7], [-3, -7], [-2, -7], [-1, -7],
  [0, -7], [1, -7], [2, -7], [3, -7], [4, -7], [5, -7], [6, -7],
];

/**
 * Blender(x, z) 좌표 → Viewer(x, z) 좌표 변환
 * 지금은 1:1 매핑이지만, 스케일/오프셋이 필요하면 이 함수만 수정하면 됨.
 */
const blenderToViewer = (bx: number, by: number): [number, number] => {
  const viewerX = bx;
  const viewerZ = -by; // 🔴 여기서 부호 뒤집기
  return [viewerX, viewerZ];
};

const mapBlenderGroup = (positions: [number, number][]): [number, number][] =>
  positions.map(([bx, by]) => blenderToViewer(bx, by));

/**
 * ====== 구역 정의 (입구 / 계산대 / 벽걸이선반 / 행거 / 테이블 / 마네킹) ======
 * 아래 좌표들은 "Blender 좌표"로 받은 값을 viewer 좌표로 변환해서 사용.
 * 이 좌표들은 사람이 설 수 있는 위치지만, 실제로는 진열/가구가 있어서
 * "사람이 다닐 수 없는 구역(히트맵 셀 미표시)"로 처리한다.
 */

// 입구 (Blender 기준)
const entrancePositions = mapBlenderGroup([
  [2, -6],
  [2, -5],
  [2, -4],
]);

// 계산대
const checkoutPositions = mapBlenderGroup([
  [4, 4],
  [3, 4],
  [2, 4],
]);

// 벽걸이 선반
const wallShelfPositions = mapBlenderGroup([
  [3, -5],
  [4, -5],
  [5, -5],
  [6, -5],
  [7, -5],
  [7, -4],
  [7, -3],
  [7, -2],
  [7, -1],
  [7, 0],
  [7, 1],
  [7, 2],
  [-7, -4],
  [-7, -3],
  [-7, -2],
  [-7, -1],
  [-7, 0],
  [-7, 1],
  [-7, 2],
  [-7, 3],
  [-7, 4],
  [-7, 5],
  [-7, 6],
  [-5, 8],
  [-4, 8],
  [-3, 8],
  [-2, 8],
  [-1, 8],
  [0, 8],
]);

// 행거
const hangerPositions = mapBlenderGroup([
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [-1, 2],
  [-1, 3],
  [-1, 4],
  [-1, 5],
  [5, -2],
  [5, -1],
  [5, 0],
  [5, 1],
  [2, 1],
  [2, 0],
  [2, -1],
  [2, -2],
  [4, 1],
  [3, 1],
]);

// 원형 테이블
const roundTablePositions = mapBlenderGroup([
  [-3, 4],
  [-4, 4],
  [-3, 5],
  [-4, 5],
]);

// 중앙 테이블
const centerTablePositions = mapBlenderGroup([
  [-1, -1],
  [-2, -1],
  [-3, -1],
  [-4, -1],
]);

// 마네킹
const mannequinPositions = mapBlenderGroup([
  [-1, -5],
  [-2, -5],
  [-3, -5],
  [-4, -5],
]);

// 전부 합쳐서 "막힌 구역"으로 관리 (입구는 제외 - 통로이므로)
const blockedPositionsSet: Set<string> = new Set(
  [
    ...checkoutPositions,
    ...wallShelfPositions,
    ...hangerPositions,
    ...roundTablePositions,
    ...centerTablePositions,
    ...mannequinPositions,
  ].map(([x, z]) => `${x},${z}`)
);

// 맨해튼 거리
const manhattanDistance = (x1: number, z1: number, x2: number, z2: number) =>
  Math.abs(x1 - x2) + Math.abs(z1 - z2);

// 어떤 그룹과의 최소 거리
const minDistanceToGroup = (x: number, z: number, group: [number, number][]) => {
  if (group.length === 0) return Infinity;
  let min = Infinity;
  for (const [gx, gz] of group) {
    const d = manhattanDistance(x, z, gx, gz);
    if (d < min) min = d;
  }
  return min;
};

// 좌표 기반으로 구역 이름 반환 (핫스팟용)
const getZoneName = (x: number, z: number): string => {
  const dHanger = minDistanceToGroup(x, z, hangerPositions);
  const dWall = minDistanceToGroup(x, z, wallShelfPositions);
  const dEntrance = minDistanceToGroup(x, z, entrancePositions);
  const dCheckout = minDistanceToGroup(x, z, checkoutPositions);
  const dCenter = minDistanceToGroup(x, z, centerTablePositions);
  const dRound = minDistanceToGroup(x, z, roundTablePositions);
  const dMannequin = minDistanceToGroup(x, z, mannequinPositions);

  if (dHanger <= 2 || dWall <= 2) return "행거/벽면 선반 근처";
  if (dEntrance <= 2) return "입구 근처";
  if (dCheckout <= 2) return "계산대 근처";
  if (dCenter <= 2 || dRound <= 2) return "중앙/원형 테이블 근처";
  if (dMannequin <= 2) return "마네킹 주변";
  return "일반 통로";
};

/**
 * 시간대 + 구역별 규칙을 반영한 히트맵 생성
 * - allowedHeatmapPositions: "사람이 다닐 수 있는 통로" + 가구가 있는 칸
 * - blockedPositionsSet: 실제로는 가구가 있는 칸 (plane 자체를 생성하지 않음)
 */
const generateHeatmapData = (timeOfDay: number): HeatmapCell[] => {
  const data: HeatmapCell[] = [];

  // 시간대별 패턴 (기존 로직 유지)
  const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;
  const isPeakHour =
    (timeOfDay >= 12 && timeOfDay <= 14) || (timeOfDay >= 18 && timeOfDay <= 20);
  const peakBonus = isPeakHour ? 0.25 : 0;

  allowedHeatmapPositions.forEach(([x, z]) => {
    // 1) 사람이 다닐 수 없는 구역이면 셀 생성 자체를 하지 않음
    if (blockedPositionsSet.has(`${x},${z}`)) {
      return;
    }

    // 2) 구역별 기본 강도 (순위: 행거/벽선 > 입구/계산대 > 중앙/원형 테이블 > 마네킹 > 일반 통로)
    const dHanger = minDistanceToGroup(x, z, hangerPositions);
    const dWall = minDistanceToGroup(x, z, wallShelfPositions);
    const dEntrance = minDistanceToGroup(x, z, entrancePositions);
    const dCheckout = minDistanceToGroup(x, z, checkoutPositions);
    const dCenter = minDistanceToGroup(x, z, centerTablePositions);
    const dRound = minDistanceToGroup(x, z, roundTablePositions);
    const dMannequin = minDistanceToGroup(x, z, mannequinPositions);

    let zoneIntensity = 0.3; // 기본 통로

    // 입구: 최우선 (모든 시간대에 높은 강도 유지, 거리 0~2칸)
    if (dEntrance <= 2) {
      zoneIntensity = dEntrance === 0 ? 0.95 : dEntrance === 1 ? 0.85 : 0.75;
    }
    // 행거/벽면 선반 근처
    else if (dHanger <= 2 || dWall <= 2) {
      zoneIntensity = dHanger <= 1 || dWall <= 1 ? 0.9 : 0.8;
    }
    // 계산대 근처
    else if (dCheckout <= 2) {
      zoneIntensity = dCheckout <= 1 ? 0.75 : 0.65;
    }
    // 중앙 테이블 & 원형 테이블 근처
    else if (dCenter <= 2 || dRound <= 2) {
      zoneIntensity = dCenter <= 1 || dRound <= 1 ? 0.55 : 0.5;
    }
    // 마네킹 주변: 상대적으로 제일 낮음 (하지만 완전 0은 아님)
    else if (dMannequin <= 2) {
      zoneIntensity = dMannequin <= 1 ? 0.35 : 0.32;
    }
    // 그 외 일반 통로
    else {
      zoneIntensity = 0.35;
    }

    // 약간의 랜덤 + 피크 시간 보너스 + 시간대 multiplier
    const randomVariation = (Math.random() - 0.5) * 0.2;

    const intensity = Math.min(
      1,
      Math.max(
        0,
        (zoneIntensity + randomVariation + peakBonus) * timeMultiplier
      )
    );

    data.push({ x, y: z, intensity });
  });

  return data;
};

const detectHotspots = (heatmapData: HeatmapCell[]): Hotspot[] => {
  const hotspots: Hotspot[] = [];
  const threshold = 0.65;

  const highIntensityCells = heatmapData.filter((cell) => cell.intensity > threshold);

  const visited = new Set<string>();

  highIntensityCells.forEach((cell) => {
    const key = `${cell.x}-${cell.y}`;
    if (visited.has(key)) return;

    visited.add(key);

    const zone = getZoneName(cell.x, cell.y);

    hotspots.push({
      x: cell.x,
      y: cell.y,
      intensity: cell.intensity,
      zone,
    });
  });

  // 상위 5개만 반환
  return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
};

export const TrafficHeatmap3D = () => {
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  const heatmapData = useMemo(() => generateHeatmapData(timeOfDay), [timeOfDay]);
  const hotspots = useMemo(() => detectHotspots(heatmapData), [heatmapData]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev >= 20 ? 10 : prev + 1;
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOfDay(14);
  };

  // 통계 계산
  const maxIntensity = Math.max(...heatmapData.map((d) => d.intensity));
  const avgIntensity =
    heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length;
  const hotspotCount = heatmapData.filter((d) => d.intensity > 0.65).length;
  const totalTraffic = Math.floor(avgIntensity * 450);

  // 시간대 분류
  const getTimeCategory = (hour: number) => {
    if (hour >= 10 && hour < 12) return { label: "오전", status: "보통" };
    if (hour >= 12 && hour < 14) return { label: "점심", status: "피크" };
    if (hour >= 14 && hour < 18) return { label: "오후", status: "보통" };
    if (hour >= 18 && hour < 20) return { label: "저녁", status: "피크" };
    return { label: "야간", status: "한산" };
  };

  const timeCategory = getTimeCategory(timeOfDay);

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer
        mode="heatmap"
        timeOfDay={timeOfDay}
        heatmapData={heatmapData}
        hotspots={showHotspots ? hotspots : []}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* 시간 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              시간대 분석
            </h4>
            <div className="flex items-center gap-2">
              <Badge
                variant={timeCategory.status === "피크" ? "destructive" : "secondary"}
              >
                {timeCategory.label} - {timeCategory.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">현재 시간</span>
              <span className="text-lg font-bold">
                {String(timeOfDay).padStart(2, "0")}:00
              </span>
            </div>
            <Slider
              min={10}
              max={20}
              step={1}
              value={[timeOfDay]}
              onValueChange={(value) => setTimeOfDay(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10:00 오픈</span>
              <span>20:00 마감</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} className="flex-1">
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
                  시뮬레이션
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 옵션 & 범례 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            표시 옵션
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-hotspots" className="flex items-center gap-2">
                <Flame className="w-3 h-3 text-red-500" />
                상위 핫스팟 표시
              </Label>
              <Switch
                id="show-hotspots"
                checked={showHotspots}
                onCheckedChange={setShowHotspots}
              />
            </div>
          </div>

          {/* 히트맵 범례 */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="text-sm font-medium">트래픽 강도</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/60" />
              <span className="text-xs flex-1">낮음</span>
              <div className="flex-[3] h-3 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full" />
              <span className="text-xs flex-1 text-right">높음</span>
              <div className="w-6 h-6 rounded bg-red-500/80" />
            </div>
          </div>
        </Card>

        {/* 실시간 통계 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            실시간 통계
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">최대 밀집도</div>
              <div className="text-2xl font-bold gradient-text">
                {(maxIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">평균 트래픽</div>
              <div className="text-2xl font-bold gradient-text">
                {(avgIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">핫스팟 구역</div>
              <div className="text-2xl font-bold gradient-text">{hotspotCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">예상 방문자</div>
              <div className="text-2xl font-bold gradient-text">{totalTraffic}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 핫스팟 상세 */}
      {showHotspots && hotspots.length > 0 && (
        <Card className="glass p-6">
          <h4 className="font-semibold flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-red-500" />
            감지된 핫스팟 ({hotspots.length}개)
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {hotspots.map((spot, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: `hsl(${(1 - spot.intensity) * 60}, 100%, 50%)`,
                    }}
                  />
                  <span className="text-xs font-medium">{spot.zone}</span>
                </div>
                <div className="text-lg font-bold">
                  {(spot.intensity * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">밀집도</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
