import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Gauge } from 'lucide-react';
import { useSimulationStore, SimulationMode } from '@/stores/simulationStore';

// ============== Mode Configuration ==============

const simulationModes: { value: SimulationMode; label: string; description: string }[] = [
  { value: 'idle', label: '대기', description: '시뮬레이션 모드를 선택하세요' },
  { value: 'customer_flow', label: '고객 동선', description: '고객 이동 패턴 시뮬레이션' },
  { value: 'heatmap', label: '히트맵', description: '구역별 밀집도 분석' },
  { value: 'layout', label: '레이아웃 최적화', description: '매장 배치 최적화 분석' },
  { value: 'demand', label: '수요 예측', description: '시간대별 수요 예측' },
  { value: 'inventory', label: '재고 시뮬레이션', description: '재고 흐름 분석' },
  { value: 'staff', label: '인력 배치', description: '직원 배치 최적화' },
  { value: 'promotion', label: '프로모션 효과', description: '프로모션 영향 분석' },
];

// ============== Time Formatting ==============

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ============== Status Badge ==============

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    stopped: 'secondary',
    running: 'default',
    paused: 'outline',
    completed: 'destructive',
  };

  const labels: Record<string, string> = {
    stopped: '정지',
    running: '실행 중',
    paused: '일시정지',
    completed: '완료',
  };

  const colors: Record<string, string> = {
    stopped: 'bg-gray-400',
    running: 'bg-green-500 animate-pulse',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
      <Badge variant={variants[status]}>{labels[status]}</Badge>
    </div>
  );
};

// ============== Main Component ==============

export function SimulationControls() {
  const {
    status,
    config,
    currentTime,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    setConfig,
  } = useSimulationStore();

  const progress = config.duration > 0 ? (currentTime / config.duration) * 100 : 0;
  const selectedMode = simulationModes.find((m) => m.value === config.mode);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            시뮬레이션 컨트롤
          </CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">시뮬레이션 모드</label>
          <Select
            value={config.mode}
            onValueChange={(v) => setConfig({ mode: v as SimulationMode })}
            disabled={status === 'running'}
          >
            <SelectTrigger>
              <SelectValue placeholder="모드 선택" />
            </SelectTrigger>
            <SelectContent>
              {simulationModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <div className="flex flex-col">
                    <span>{mode.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {mode.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMode && config.mode !== 'idle' && (
            <p className="text-xs text-muted-foreground">{selectedMode.description}</p>
          )}
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">재생 속도</label>
            <span className="text-sm text-muted-foreground">{config.speed}x</span>
          </div>
          <Slider
            value={[config.speed]}
            onValueChange={([v]) => setConfig({ speed: v })}
            min={1}
            max={8}
            step={1}
            disabled={status === 'running'}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1x</span>
            <span>4x</span>
            <span>8x</span>
          </div>
        </div>

        {/* Duration Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">시뮬레이션 시간</label>
            <span className="text-sm text-muted-foreground">
              {Math.floor(config.duration / 60)}분
            </span>
          </div>
          <Slider
            value={[config.duration]}
            onValueChange={([v]) => setConfig({ duration: v })}
            min={300}
            max={7200}
            step={300}
            disabled={status === 'running'}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5분</span>
            <span>1시간</span>
            <span>2시간</span>
          </div>
        </div>

        {/* Time Display */}
        <div className="text-center py-4 bg-muted rounded-lg">
          <div className="text-4xl font-mono font-bold">{formatTime(currentTime)}</div>
          <div className="text-sm text-muted-foreground mt-1">
            / {formatTime(config.duration)}
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2 mt-3 mx-auto max-w-xs">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {progress.toFixed(1)}% 완료
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {status === 'running' ? (
            <Button
              onClick={pauseSimulation}
              className="flex-1"
              variant="secondary"
            >
              <Pause className="w-4 h-4 mr-2" />
              일시정지
            </Button>
          ) : (
            <Button
              onClick={startSimulation}
              className="flex-1"
              disabled={config.mode === 'idle'}
            >
              <Play className="w-4 h-4 mr-2" />
              {status === 'paused' ? '계속' : '시작'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={stopSimulation}
            disabled={status === 'stopped'}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={resetSimulation}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Disabled Warning */}
        {config.mode === 'idle' && (
          <p className="text-xs text-amber-600 text-center">
            시뮬레이션을 시작하려면 모드를 선택하세요
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default SimulationControls;
