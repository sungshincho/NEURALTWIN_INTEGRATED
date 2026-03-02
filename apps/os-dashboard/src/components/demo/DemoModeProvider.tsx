/**
 * DemoModeProvider.tsx
 *
 * 데모 모드 컨텍스트 래퍼
 * - URL 파라미터 감지 (?demo=fashion, ?demo=beauty, ?demo=department)
 * - 데모 세션 타이머 (1초 interval)
 * - 시나리오 선택 화면 (3개 카드)
 * - DemoBadge, DemoCTABar, GuidedTour 렌더링
 * - 데모 모드에서 특정 기능 비활성화
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  Building2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoStore, type DemoScenario } from '@/store/useDemoStore';
import { SCENARIO_CARDS } from './ScenarioPresets';
import { DemoBadge } from './DemoBadge';
import { DemoCTABar } from './DemoCTABar';
import { GuidedTour } from './GuidedTour';

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Sparkles,
  Building2,
};

// ============================================================================
// ScenarioSelector 컴포넌트
// ============================================================================

function ScenarioSelector() {
  const { showScenarioSelector, hideSelector, startDemo } = useDemoStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectScenario = useCallback(
    (scenarioId: DemoScenario) => {
      setSelectedCard(scenarioId);
      // 짧은 클릭 애니메이션 후 시작
      setTimeout(() => {
        startDemo(scenarioId);
        navigate(`/insights?demo=${scenarioId}`, { replace: true });
      }, 300);
    },
    [startDemo, navigate]
  );

  if (!showScenarioSelector) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(180deg, #0a0a0c 0%, #111114 40%, #0d0d10 100%)',
      }}
    >
      {/* Close button */}
      <button
        onClick={hideSelector}
        className={cn(
          'absolute top-6 right-6',
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'text-[13px] text-white/40 hover:text-white/70',
          'bg-white/[0.05] border border-white/[0.08]',
          'hover:bg-white/[0.08]',
          'transition-all duration-200'
        )}
      >
        <X className="w-4 h-4" />
        닫기
      </button>

      {/* Logo */}
      <div className="mb-8">
        <span className="text-[16px] font-bold tracking-[0.15em] text-white/90">
          NEURALTWIN
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[24px] md:text-[28px] font-bold text-white/95 text-center mb-3">
        어떤 매장을 체험해 보시겠어요?
      </h2>
      <p className="text-[15px] text-white/45 text-center mb-10 max-w-md">
        업종을 선택하면 실제와 같은 데모 대시보드를 보여드려요.
      </p>

      {/* Scenario Cards */}
      <div className="flex flex-col md:flex-row gap-5 mb-8">
        {SCENARIO_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon] || ShoppingBag;
          const isHovered = hoveredCard === card.id;
          const isSelected = selectedCard === card.id;

          return (
            <button
              key={card.id}
              onClick={() => handleSelectScenario(card.id)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                'relative flex flex-col items-center justify-center text-center',
                'transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                // Desktop: 세로 카드 / Mobile: 가로 카드
                'md:w-[240px] md:h-[280px] md:rounded-xl',
                'w-full h-[100px] rounded-xl flex-row md:flex-col',
                'max-md:px-6 max-md:gap-4',
                isSelected && 'scale-[0.98]'
              )}
              style={{
                background: isHovered
                  ? 'rgba(0, 212, 255, 0.06)'
                  : 'transparent',
                border: isHovered
                  ? '1.5px solid rgba(0, 212, 255, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                boxShadow: isHovered
                  ? '0 0 20px rgba(0, 212, 255, 0.1), 0 4px 12px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.2)',
                transform: isHovered
                  ? 'scale(1.02)'
                  : isSelected
                    ? 'scale(0.98)'
                    : 'scale(1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl mb-4 max-md:mb-0',
                  'transition-all duration-200'
                )}
                style={{
                  width: 48,
                  height: 48,
                  background: isHovered
                    ? 'rgba(0, 212, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isHovered
                    ? '1px solid rgba(0, 212, 255, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: isHovered
                      ? 'rgba(0, 212, 255, 0.9)'
                      : 'rgba(255, 255, 255, 0.5)',
                  }}
                />
              </div>

              {/* Text content */}
              <div className="max-md:text-left">
                <div className="text-[18px] font-bold text-white/90 mb-1">
                  {card.typeKo}
                </div>
                <div className="text-[13px] text-white/50 mb-2">
                  {card.storeName}
                </div>
                <div className="text-[12px] text-white/35">{card.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Duration note */}
      <p className="text-[13px] text-white/30">
        약 5분 소요 -- 가이드 투어 후 자유 탐색 가능
      </p>
    </div>
  );
}

// ============================================================================
// DemoModeProvider Component
// ============================================================================

interface DemoModeProviderProps {
  children: React.ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [searchParams] = useSearchParams();
  const {
    isDemoMode,
    isTourActive,
    tick,
    initFromUrl,
    showSelector,
    showScenarioSelector,
  } = useDemoStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // =========================================================================
  // URL 파라미터 감지
  // =========================================================================

  useEffect(() => {
    const demoParam = searchParams.get('demo');
    if (demoParam && ['fashion', 'beauty', 'department'].includes(demoParam)) {
      initFromUrl(demoParam as DemoScenario);
    }
  }, [searchParams, initFromUrl]);

  // =========================================================================
  // 1초 타이머 (남은 시간 갱신)
  // =========================================================================

  useEffect(() => {
    if (isDemoMode) {
      timerRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isDemoMode, tick]);

  // =========================================================================
  // /demo 루트 경로 감지 (시나리오 선택 화면)
  // =========================================================================

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/demo' && !isDemoMode && !showScenarioSelector) {
      showSelector();
    }
  }, [isDemoMode, showScenarioSelector, showSelector]);

  return (
    <>
      {children}

      {/* 시나리오 선택 화면 */}
      <ScenarioSelector />

      {/* 데모 모드 UI 요소 */}
      {isDemoMode && (
        <>
          <DemoBadge />
          <DemoCTABar />
          <GuidedTour />
        </>
      )}
    </>
  );
}

export default DemoModeProvider;
