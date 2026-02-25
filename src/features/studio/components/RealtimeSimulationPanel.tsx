// src/features/studio/components/RealtimeSimulationPanel.tsx

/**
 * 실시간 시뮬레이션 컨트롤 패널
 *
 * - 시뮬레이션 시작/일시정지/중지/리셋
 * - 속도 조절
 * - 실시간 KPI 표시
 * - 고객 상태 범례
 */

import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Timer,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSimulationStore, STATE_COLORS, STATE_LABELS } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';

export function RealtimeSimulationPanel() {
  const {
    isRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start,
    pause,
    resume,
    stop,
    reset,
    setSpeed,
    updateConfig,
  } = useSimulationStore();

  // 시간 포맷팅 (초 → HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `₩${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 체류시간 포맷팅
  const formatDwellTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}분 ${s}초`;
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Clock className="h-4 w-4 text-blue-400" />
        실시간 시뮬레이션
      </div>

      {/* 시간 표시 */}
      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-mono text-white tracking-wider">
          {formatTime(simulationTime)}
        </div>
        <div className="text-xs text-gray-500 mt-1">시뮬레이션 경과 시간</div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex justify-center gap-2">
        {!isRunning ? (
          <Button
            onClick={start}
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            시작
          </Button>
        ) : isPaused ? (
          <Button
            onClick={resume}
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            재개
          </Button>
        ) : (
          <Button
            onClick={pause}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 flex-1"
          >
            <Pause className="h-4 w-4 mr-1" />
            일시정지
          </Button>
        )}

        <Button
          onClick={stop}
          size="sm"
          variant="destructive"
          disabled={!isRunning}
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          onClick={reset}
          size="sm"
          variant="outline"
          className="border-gray-600"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 속도 조절 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">재생 속도</span>
          <span className="text-xs text-blue-400 font-medium">{config.speed}x</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 4, 10].map((speed) => (
            <Button
              key={speed}
              onClick={() => setSpeed(speed)}
              size="sm"
              variant={config.speed === speed ? 'default' : 'outline'}
              className={cn(
                'flex-1 text-xs h-7',
                config.speed === speed
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'border-gray-600 text-gray-400 hover:text-white'
              )}
            >
              {speed}x
            </Button>
          ))}
        </div>
      </div>

      {/* 경로 표시 토글 */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-paths" className="text-xs text-gray-400 flex items-center gap-2">
          {config.showAgentPaths ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          고객 경로 표시
        </Label>
        <Switch
          id="show-paths"
          checked={config.showAgentPaths}
          onCheckedChange={(checked) => updateConfig({ showAgentPaths: checked })}
        />
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-700" />

      {/* 실시간 KPI */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <TrendingUp className="h-4 w-4 text-green-400" />
        실시간 KPI
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 현재 고객 */}
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3 w-3" />
            현재 고객
          </div>
          <div className="text-lg font-bold text-white">
            {kpi.currentCustomers}
            <span className="text-xs text-gray-500 font-normal ml-1">
              / {kpi.totalVisitors}
            </span>
          </div>
        </div>

        {/* 매출 */}
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <DollarSign className="h-3 w-3" />
            매출
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(kpi.totalRevenue)}
          </div>
        </div>

        {/* 평균 체류시간 */}
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Timer className="h-3 w-3" />
            평균 체류
          </div>
          <div className="text-lg font-bold text-white">
            {formatDwellTime(kpi.avgDwellTime)}
          </div>
        </div>

        {/* 전환율 */}
        <div className="bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <TrendingUp className="h-3 w-3" />
            전환율
          </div>
          <div className="text-lg font-bold text-blue-400">
            {kpi.conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-700" />

      {/* 고객 상태 범례 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">고객 상태 범례</div>
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(STATE_LABELS).map(([state, label]) => (
            <div key={state} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STATE_COLORS[state as keyof typeof STATE_COLORS] }}
              />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RealtimeSimulationPanel;
