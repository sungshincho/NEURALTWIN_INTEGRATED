/**
 * TimelineControls.tsx
 *
 * 시간 여행 (Time Travel) 타임라인 컨트롤 UI
 * - 하단 고정 바 (비디오 플레이어 스타일)
 * - 글래스모피즘 다크 배경
 * - 24시간 타임라인 스크러버 + 활동 히트맵
 * - 재생/일시정지, 속도 조절, 프레임 이동
 * - 반응형 (모바일 대응)
 */

import { memo, useRef, useState, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Clock,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTimeTravelPlayback } from '@/hooks/useTimeTravelPlayback';
import { useTimeTravelStore, type PlaybackSpeed } from '@/store/useTimeTravelStore';

// ============================================================================
// 상수
// ============================================================================

const SPEEDS: PlaybackSpeed[] = [1, 2, 4, 8];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0')
);
// 15분 단위 스냅 (밀리초)
const SNAP_INTERVAL_MS = 15 * 60 * 1000;

// ============================================================================
// 서브 컴포넌트: 활동 히트맵 바
// ============================================================================
const ActivityHeatmap = memo(function ActivityHeatmap({
  className,
}: {
  className?: string;
}) {
  const hourlyActivity = useTimeTravelStore((s) => s.hourlyActivity);

  // 각 시간대를 4등분 (15분 간격)하여 96개 바를 그림
  const bars: number[] = [];
  for (let h = 0; h < 24; h++) {
    const intensity = hourlyActivity.find((a) => a.hour === h)?.intensity ?? 0;
    // 4개의 15분 구간에 동일한 강도 할당 (부드러운 보간은 향후 구현)
    for (let q = 0; q < 4; q++) {
      bars.push(intensity);
    }
  }

  return (
    <div className={cn('flex items-end h-6 gap-px', className)}>
      {bars.map((intensity, idx) => (
        <div
          key={idx}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${Math.max(2, intensity * 100)}%`,
            backgroundColor:
              intensity > 0.7
                ? 'rgba(168, 85, 247, 0.6)' // 보라 (바쁜 시간)
                : intensity > 0.4
                ? 'rgba(168, 85, 247, 0.35)'
                : intensity > 0.1
                ? 'rgba(168, 85, 247, 0.18)'
                : 'rgba(255, 255, 255, 0.05)', // 거의 투명 (조용한 시간)
          }}
        />
      ))}
    </div>
  );
});

// ============================================================================
// 서브 컴포넌트: 타임라인 스크러버
// ============================================================================
const TimelineScrubber = memo(function TimelineScrubber() {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const progress = useTimeTravelStore((s) => s.getProgress());
  const seekToProgress = useTimeTravelStore((s) => s.seekToProgress);
  const startTime = useTimeTravelStore((s) => s.startTime);
  const endTime = useTimeTravelStore((s) => s.endTime);

  /** progress(0~1)를 15분 단위로 스냅 */
  const snapProgress = useCallback(
    (p: number): number => {
      const totalMs = endTime.getTime() - startTime.getTime();
      const targetMs = startTime.getTime() + totalMs * p;
      const snappedMs =
        Math.round(targetMs / SNAP_INTERVAL_MS) * SNAP_INTERVAL_MS;
      return (snappedMs - startTime.getTime()) / totalMs;
    },
    [startTime, endTime]
  );

  /** 마우스/터치 위치에서 progress 계산 */
  const getProgressFromEvent = useCallback(
    (clientX: number): number => {
      if (!scrubberRef.current) return 0;
      const rect = scrubberRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    },
    []
  );

  /** progress를 시간 문자열로 변환 */
  const progressToTimeString = useCallback(
    (p: number): string => {
      const totalMs = endTime.getTime() - startTime.getTime();
      const time = new Date(startTime.getTime() + totalMs * p);
      const h = time.getHours().toString().padStart(2, '0');
      const m = time.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    },
    [startTime, endTime]
  );

  // 드래그 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const p = snapProgress(getProgressFromEvent(e.clientX));
      seekToProgress(p);
    },
    [getProgressFromEvent, snapProgress, seekToProgress]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const p = snapProgress(getProgressFromEvent(e.clientX));
      seekToProgress(p);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getProgressFromEvent, snapProgress, seekToProgress]);

  // 호버 핸들러
  const handleMouseMoveHover = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      setHoverProgress(getProgressFromEvent(e.clientX));
    },
    [isDragging, getProgressFromEvent]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) setHoverProgress(null);
  }, [isDragging]);

  return (
    <div className="relative w-full select-none">
      {/* 시간 마커 (00~23) */}
      <div className="relative h-4 mb-1">
        {HOUR_LABELS.map((label, idx) => (
          <span
            key={idx}
            className="absolute text-[9px] text-white/30 -translate-x-1/2 leading-none select-none"
            style={{ left: `${(idx / 24) * 100}%` }}
          >
            {idx % 3 === 0 ? label : ''}
          </span>
        ))}
      </div>

      {/* 활동 히트맵 + 스크러버 트랙 */}
      <div
        ref={scrubberRef}
        className={cn(
          'relative h-8 rounded-lg overflow-hidden cursor-pointer',
          'bg-white/5 border border-white/10',
          isDragging && 'ring-1 ring-purple-500/50'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveHover}
        onMouseLeave={handleMouseLeave}
      >
        {/* 히트맵 배경 */}
        <ActivityHeatmap className="absolute inset-0" />

        {/* 재생 진행 영역 */}
        <div
          className="absolute inset-y-0 left-0 bg-purple-500/15 border-r border-purple-400/30 transition-[width]"
          style={{
            width: `${progress * 100}%`,
            transitionDuration: isDragging ? '0ms' : '200ms',
          }}
        />

        {/* 호버 인디케이터 */}
        {hoverProgress !== null && (
          <>
            <div
              className="absolute inset-y-0 w-px bg-white/20 pointer-events-none"
              style={{ left: `${hoverProgress * 100}%` }}
            />
            <div
              className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white border border-white/20 pointer-events-none whitespace-nowrap"
              style={{ left: `${hoverProgress * 100}%` }}
            >
              {progressToTimeString(snapProgress(hoverProgress))}
            </div>
          </>
        )}

        {/* 현재 위치 인디케이터 (빛나는 도트) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none"
          style={{
            left: `${progress * 100}%`,
            transition: isDragging ? 'none' : 'left 200ms ease-out',
          }}
        >
          {/* 외부 글로우 */}
          <div className="w-5 h-5 rounded-full bg-purple-500/30 absolute -top-2.5 -left-2.5 animate-pulse" />
          {/* 내부 도트 */}
          <div className="w-3 h-3 rounded-full bg-purple-400 border-2 border-white shadow-lg shadow-purple-500/50 absolute -top-1.5 -left-1.5" />
        </div>

        {/* 시간 눈금 */}
        {[0, 6, 12, 18].map((hour) => (
          <div
            key={hour}
            className="absolute inset-y-0 w-px bg-white/10 pointer-events-none"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// 메인 컴포넌트: TimelineControls
// ============================================================================
export const TimelineControls = memo(function TimelineControls({
  className,
}: {
  className?: string;
}) {
  const {
    isEnabled,
    isPlaying,
    playbackSpeed,
    formattedTime,
    togglePlayback,
    nextFrame,
    prevFrame,
    setSpeed,
    disable,
  } = useTimeTravelPlayback();

  // 속도 사이클
  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(playbackSpeed);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(nextSpeed);
  }, [playbackSpeed, setSpeed]);

  if (!isEnabled) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          // 하단 고정 + 글래스모피즘
          'absolute bottom-0 left-0 right-0 z-30 pointer-events-auto',
          'animate-in slide-in-from-bottom-4 duration-300',
          className
        )}
      >
        <div
          className={cn(
            'mx-4 mb-4 rounded-2xl',
            'bg-gray-900/80 backdrop-blur-xl',
            'border border-white/10',
            'shadow-2xl shadow-black/50',
            'px-4 py-3 sm:px-6 sm:py-4'
          )}
        >
          {/* 상단: 타임라인 스크러버 */}
          <TimelineScrubber />

          {/* 하단: 컨트롤 버튼들 */}
          <div className="flex items-center justify-between mt-3 gap-2">
            {/* 좌측: 시간 표시 */}
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-lg sm:text-xl font-mono font-bold text-white tracking-wider tabular-nums">
                {formattedTime}
              </span>
              <span className="text-xs text-white/40 hidden sm:inline">
                시간 여행
              </span>
            </div>

            {/* 중앙: 재생 컨트롤 */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 이전 프레임 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevFrame}
                    className="h-8 w-8 p-0 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  이전 (-15분) [←]
                </TooltipContent>
              </Tooltip>

              {/* 재생/일시정지 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayback}
                    className={cn(
                      'h-10 w-10 p-0 rounded-full transition-all',
                      isPlaying
                        ? 'bg-purple-500/30 border border-purple-500 text-purple-300 hover:bg-purple-500/40'
                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  {isPlaying ? '일시정지 [Space]' : '재생 [Space]'}
                </TooltipContent>
              </Tooltip>

              {/* 다음 프레임 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextFrame}
                    className="h-8 w-8 p-0 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  다음 (+15분) [→]
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 우측: 속도 + 닫기 */}
            <div className="flex items-center gap-2">
              {/* 속도 선택 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={cycleSpeed}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'border border-white/10 hover:border-white/20',
                      playbackSpeed > 1
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    )}
                  >
                    <Gauge className="w-3 h-3" />
                    <span className="tabular-nums">{playbackSpeed}x</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  속도 변경 [+/-]
                </TooltipContent>
              </Tooltip>

              {/* 모바일에서는 숨기는 속도 버튼 그룹 */}
              <div className="hidden sm:flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSpeed(speed)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                      playbackSpeed === speed
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* 구분선 */}
              <div className="w-px h-6 bg-white/10" />

              {/* 닫기 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disable}
                    className="h-8 w-8 p-0 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  시간 여행 종료 [Esc]
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 키보드 단축키 힌트 (sm 이상에서만) */}
          <div className="hidden sm:flex items-center justify-center gap-3 mt-2 text-[10px] text-white/20">
            <span>Space: 재생/정지</span>
            <span>|</span>
            <span>←→: 15분 이동</span>
            <span>|</span>
            <span>+/-: 속도</span>
            <span>|</span>
            <span>Esc: 종료</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

export default TimelineControls;
