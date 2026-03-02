/**
 * DemoBadge.tsx
 *
 * 데모 모드 플로팅 배지 컴포넌트
 * - 좌측 상단 고정 (사이드바 아래)
 * - 시나리오 이름 + 남은 시간 표시
 * - 클릭 시 확장 (상세 정보 + CTA)
 * - Amber 색상 테마 (경고/알림 느낌)
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/useDemoStore';
import { SCENARIO_PRESETS } from './ScenarioPresets';

// ============================================================================
// 헬퍼
// ============================================================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// DemoBadge Component
// ============================================================================

export function DemoBadge() {
  const {
    isDemoMode,
    currentScenario,
    remainingSeconds,
    isTourActive,
    endDemo,
    showSelector,
  } = useDemoStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // 투어 중에는 배지 숨김 (z-index 충돌 방지)
  if (!isDemoMode || !currentScenario || isTourActive) return null;

  const preset = SCENARIO_PRESETS[currentScenario];
  if (!preset) return null;

  const handleEndDemo = useCallback(() => {
    endDemo();
    setIsExpanded(false);
  }, [endDemo]);

  const handleChangeScenario = useCallback(() => {
    endDemo();
    showSelector();
    setIsExpanded(false);
  }, [endDemo, showSelector]);

  return (
    <div
      className="fixed top-4 left-4 z-[60]"
      style={{ marginLeft: '64px' }} // 사이드바 너비만큼 오프셋
    >
      {/* === Collapsed Badge === */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02] active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
          )}
          style={{
            background: 'rgba(245, 158, 11, 0.9)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          }}
          role="status"
          aria-label="현재 데모 모드입니다"
        >
          <span className="text-[12px] font-bold text-gray-900 tracking-[0.05em]">
            DEMO
          </span>
          <span className="text-[11px] font-medium text-gray-800">
            {formatTime(remainingSeconds)}
          </span>
        </button>
      )}

      {/* === Expanded Panel === */}
      {isExpanded && (
        <div
          className={cn(
            'rounded-xl overflow-hidden',
            'animate-in fade-in slide-in-from-top-1 duration-200'
          )}
          style={{
            width: '280px',
            background:
              'linear-gradient(165deg, rgba(15,15,20,0.97) 0%, rgba(10,10,14,0.98) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold tracking-[0.05em]"
                style={{
                  background: 'rgba(245, 158, 11, 0.9)',
                  color: '#111827',
                }}
              >
                DEMO
              </span>
              <span className="text-[12px] font-medium text-white/50">
                데모 모드
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-colors"
              aria-label="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 space-y-3">
            <p className="text-[13px] text-white/70 leading-relaxed">
              현재{' '}
              <span className="text-white/90 font-semibold">
                {preset.storeName}
              </span>{' '}
              데모를 체험하고 있습니다.
            </p>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40">남은 시간</span>
              <span className="text-[13px] font-mono font-semibold text-amber-400">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  window.open('/auth', '_blank');
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                  'text-[13px] font-semibold',
                  'transition-all duration-200',
                  'hover:brightness-110 active:scale-[0.98]'
                )}
                style={{
                  background: '#00D4FF',
                  color: '#111827',
                  boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
                }}
              >
                실제 데이터로 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleChangeScenario}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                  'text-[12px] font-medium text-white/60',
                  'bg-white/[0.05] border border-white/[0.08]',
                  'hover:bg-white/[0.08] hover:text-white/80',
                  'transition-all duration-200'
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다른 시나리오 보기
              </button>

              <button
                onClick={handleEndDemo}
                className={cn(
                  'w-full text-center py-1.5',
                  'text-[11px] text-white/30 hover:text-white/50',
                  'transition-colors duration-200'
                )}
              >
                데모 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoBadge;
