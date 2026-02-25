/**
 * SimulationControlPopup.tsx
 *
 * 고객 시뮬레이션 제어 팝업 컴포넌트
 * - 실제 simulationStore 연동
 * - 실시간 KPI 표시
 * - 시뮬레이션 속도 조절
 */

import { memo, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Gauge, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { useSimulationStore, STATE_COLORS, STATE_LABELS, CustomerState } from '@/stores/simulationStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SimulationControlPopupProps {
  className?: string;
}

export const SimulationControlPopup = memo(function SimulationControlPopup({
  className,
}: SimulationControlPopupProps) {
  const {
    isRunning,
    isPaused,
    config,
    kpi,
    customers,
    start,
    pause,
    resume,
    stop,
    reset,
    setSpeed,
  } = useSimulationStore();

  // 상태별 고객 수 계산
  const customersByState = customers.reduce((acc, customer) => {
    acc[customer.state] = (acc[customer.state] || 0) + 1;
    return acc;
  }, {} as Record<CustomerState, number>);

  // 속도 조절 핸들러
  const handleSpeedChange = useCallback((value: number[]) => {
    setSpeed(value[0]);
  }, [setSpeed]);

  // 재생/일시정지 토글
  const handlePlayPause = useCallback(() => {
    if (!isRunning) {
      start();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isRunning, isPaused, start, resume, pause]);

  // 정지
  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  // 리셋
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // 금액 포맷
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  // 시간 포맷 (초 → 분:초)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'w-72 p-3 rounded-xl',
        'bg-black/80 backdrop-blur-md border border-white/10',
        'shadow-xl',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">고객 시뮬레이션</span>
        </div>
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-xs',
            isRunning && !isPaused
              ? 'bg-green-500/20 text-green-400'
              : isPaused
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-white/10 text-white/60'
          )}
        >
          {isRunning && !isPaused ? '실행중' : isPaused ? '일시정지' : '정지'}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePlayPause}
          className={cn(
            'flex-1 h-8',
            isRunning && !isPaused
              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
          )}
        >
          {isRunning && !isPaused ? (
            <>
              <Pause className="w-4 h-4 mr-1" /> 일시정지
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> {isPaused ? '재개' : '시작'}
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStop}
          disabled={!isRunning && !isPaused}
          className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-40"
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="h-8 bg-white/10 hover:bg-white/20 text-white/80"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* 속도 조절 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Gauge className="w-3.5 h-3.5" />
            <span>속도</span>
          </div>
          <span className="text-xs text-white font-medium">{config.speed}x</span>
        </div>
        <Slider
          value={[config.speed]}
          onValueChange={handleSpeedChange}
          min={0.5}
          max={4}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-[10px] text-white/40">
          <span>0.5x</span>
          <span>1x</span>
          <span>2x</span>
          <span>4x</span>
        </div>
      </div>

      {/* 실시간 KPI */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Users className="w-3 h-3" />
            <span>현재 고객</span>
          </div>
          <div className="text-lg font-semibold text-white">{kpi.currentCustomers}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>총 방문</span>
          </div>
          <div className="text-lg font-semibold text-white">{kpi.totalVisitors}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <DollarSign className="w-3 h-3" />
            <span>매출</span>
          </div>
          <div className="text-lg font-semibold text-green-400">₩{formatCurrency(kpi.totalRevenue)}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Clock className="w-3 h-3" />
            <span>평균 체류</span>
          </div>
          <div className="text-lg font-semibold text-white">{formatTime(kpi.avgDwellTime)}</div>
        </div>
      </div>

      {/* 전환율 */}
      <div className="p-2 rounded-lg bg-white/5 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/60">전환율</span>
          <span className="text-xs font-medium text-blue-400">{kpi.conversionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(kpi.conversionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* 상태별 고객 분포 */}
      {customers.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-white/60 mb-1">고객 상태 분포</div>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(STATE_COLORS) as CustomerState[]).map((state) => {
              const count = customersByState[state] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={state}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: `${STATE_COLORS[state]}20`,
                    color: STATE_COLORS[state],
                  }}
                >
                  <span>{STATE_LABELS[state]}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default SimulationControlPopup;
