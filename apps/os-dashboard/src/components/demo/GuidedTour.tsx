/**
 * GuidedTour.tsx
 *
 * 7단계 가이드 투어 오버레이 컴포넌트
 * - Step 1: 사이드바 내비게이션
 * - Step 2: 핵심 지표 카드 (MetricCard)
 * - Step 3: AI 인사이트 (AIInsightBubble)
 * - Step 4: 3D 디지털 트윈 스튜디오
 * - Step 5: Time Travel 타임라인
 * - Step 6: 자동 리포트 생성
 * - Step 7: CTA (체험 완료)
 *
 * 기능:
 * - 스포트라이트 하이라이트 (CSS clip-path mask)
 * - 툴팁 자동 배치 (target 위치 기반)
 * - 자동 진행 (8~10초 카운트다운)
 * - 키보드 접근성 (Tab, Enter, Escape, Arrow keys)
 * - 진행 프로그레스 도트
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, X, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/useDemoStore';
import { SCENARIO_PRESETS } from './ScenarioPresets';

// ============================================================================
// 타입
// ============================================================================

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

type TooltipPosition = 'bottom' | 'top' | 'right' | 'left';

// ============================================================================
// 투어 스텝 정의
// ============================================================================

const TOUR_STEPS = [
  {
    step: 1,
    targetSelector: '[data-tour="sidebar"]',
    title: '사이드바 내비게이션',
    description:
      '좌측 사이드바에서 각 기능에 접근할 수 있어요.\n홈, 실시간 현황, 분석, 3D 스튜디오, AI, ROI 추적 등\n매장 운영에 필요한 모든 도구가 여기 있습니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 2,
    targetSelector: '[data-tour="metric-cards"]',
    title: '핵심 지표 카드',
    description:
      '방문객, 체류시간, 전환율 등 매장의 핵심 KPI를\n한눈에 확인하세요. 전일 대비 변화율과 목표 달성률,\n7일 트렌드까지 바로 볼 수 있어요.\n카드를 클릭하면 상세 분석으로 이동합니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 3,
    targetSelector: '[data-tour="ai-insight"]',
    title: 'AI 인사이트',
    description:
      'NeuralMind AI가 이상 징후를 감지하면\n여기에 실시간 알림이 나타나요.\n\'왜 이런 일이 생겼는지\'부터 \'어떻게 해야 하는지\'까지\n4단계로 분석 결과를 제공합니다.',
    autoAdvanceSec: 10,
  },
  {
    step: 4,
    targetSelector: '[data-tour="digital-twin"]',
    title: '3D 디지털 트윈 스튜디오',
    description:
      '매장을 3D로 재현한 디지털 트윈입니다.\n고객 동선을 시각화하고, 히트맵을 오버레이하고,\n레이아웃 변경을 시뮬레이션할 수 있어요.\n실제 매장을 바꾸기 전에 여기서 먼저 테스트하세요.',
    autoAdvanceSec: 10,
  },
  {
    step: 5,
    targetSelector: '[data-tour="time-travel"]',
    title: 'Time Travel -- 과거 데이터 재생',
    description:
      '타임라인을 드래그해서 과거의 매장 상황을\n3D로 재생할 수 있어요. 진열 변경 전후 비교,\n피크 시간대 분석 등 시간 기반 분석이 가능합니다.\n재생 속도는 최대 8배속까지 지원해요.',
    autoAdvanceSec: 10,
  },
  {
    step: 6,
    targetSelector: '[data-tour="reports"]',
    title: '자동 리포트 생성',
    description:
      'AI가 매장 데이터를 분석해 PDF 리포트를\n자동으로 생성합니다. 일간/주간/월간 리포트를\n이메일로 받아보거나 즉시 다운로드할 수 있어요.\n본사 보고용 데이터도 한 번에 정리됩니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 7,
    targetSelector: '', // full-screen CTA
    title: '체험을 완료했어요!',
    description:
      '지금 보신 모든 기능을\n실제 매장 데이터로 사용해 보세요.\n\nStarter 플랜: 월 49,000원부터\n14일 무료 체험 포함',
    autoAdvanceSec: 0,
  },
];

const TOTAL_STEPS = TOUR_STEPS.length;

// ============================================================================
// 유틸
// ============================================================================

function getElementRect(selector: string): TargetRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);
  const borderRadius = parseFloat(styles.borderRadius) || 0;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius,
  };
}

/** 뷰포트 기준으로 최적 툴팁 위치 계산 */
function calculateTooltipPosition(
  targetRect: TargetRect | null,
  tooltipWidth: number,
  tooltipHeight: number
): { position: TooltipPosition; top: number; left: number } {
  if (!targetRect) {
    // 풀스크린 (step 7)
    return {
      position: 'bottom',
      top: Math.max(80, (window.innerHeight - tooltipHeight) / 2),
      left: Math.max(16, (window.innerWidth - tooltipWidth) / 2),
    };
  }

  const GAP = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  // Default: bottom
  let position: TooltipPosition = 'bottom';
  let top = targetRect.top + targetRect.height + GAP;
  let left = centerX - tooltipWidth / 2;

  // 아래쪽에 공간이 없으면 위쪽
  if (top + tooltipHeight > vh - 80) {
    position = 'top';
    top = targetRect.top - tooltipHeight - GAP;
  }

  // 위쪽에도 없으면 오른쪽
  if (top < 16) {
    position = 'right';
    top = centerY - tooltipHeight / 2;
    left = targetRect.left + targetRect.width + GAP;
  }

  // 오른쪽에도 없으면 왼쪽
  if (left + tooltipWidth > vw - 16) {
    position = 'left';
    left = targetRect.left - tooltipWidth - GAP;
  }

  // 경계 클램핑
  left = Math.max(16, Math.min(left, vw - tooltipWidth - 16));
  top = Math.max(16, Math.min(top, vh - tooltipHeight - 80));

  return { position, top, left };
}

/** SVG mask 경로 생성 (스포트라이트 컷아웃) */
function createMaskPath(
  target: TargetRect | null,
  padding: number = 8
): string {
  if (!target) return '';

  const x = target.left - padding;
  const y = target.top - padding;
  const w = target.width + padding * 2;
  const h = target.height + padding * 2;
  const r = Math.min(target.borderRadius + padding, w / 2, h / 2);

  // SVG rounded rect path
  return `M ${x + r} ${y}
    L ${x + w - r} ${y}
    Q ${x + w} ${y} ${x + w} ${y + r}
    L ${x + w} ${y + h - r}
    Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    L ${x + r} ${y + h}
    Q ${x} ${y + h} ${x} ${y + h - r}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y} Z`;
}

// ============================================================================
// GuidedTour Component
// ============================================================================

export function GuidedTour() {
  const {
    isDemoMode,
    isTourActive,
    isTourPaused,
    tourStep,
    currentScenario,
    nextTourStep,
    prevTourStep,
    skipTour,
    pauseTour,
    resumeTour,
    trackInteraction,
  } = useDemoStore();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ position: 'bottom' as TooltipPosition, top: 0, left: 0 });
  const [countdown, setCountdown] = useState(0);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const currentStepData = tourStep >= 1 && tourStep <= TOTAL_STEPS
    ? TOUR_STEPS[tourStep - 1]
    : null;

  // =========================================================================
  // Target element 위치 추적
  // =========================================================================

  const updateTargetRect = useCallback(() => {
    if (!currentStepData) return;
    const rect = getElementRect(currentStepData.targetSelector);
    setTargetRect(rect);
  }, [currentStepData]);

  useEffect(() => {
    if (!isTourActive || !currentStepData) return;
    updateTargetRect();

    // 리사이즈 & 스크롤 대응
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    // ResizeObserver for target element changes
    const observer = new ResizeObserver(handleResize);
    if (currentStepData.targetSelector) {
      const el = document.querySelector(currentStepData.targetSelector);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer.disconnect();
    };
  }, [isTourActive, currentStepData, updateTargetRect]);

  // =========================================================================
  // 툴팁 위치 계산
  // =========================================================================

  useEffect(() => {
    if (!isTourActive) return;

    const TOOLTIP_WIDTH = Math.min(360, window.innerWidth - 32);
    const TOOLTIP_HEIGHT = 280; // 추정값

    const pos = calculateTooltipPosition(targetRect, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
    setTooltipPos(pos);
  }, [targetRect, isTourActive, tourStep]);

  // =========================================================================
  // 자동 진행 카운트다운
  // =========================================================================

  useEffect(() => {
    if (!isTourActive || !currentStepData || currentStepData.autoAdvanceSec === 0) {
      setCountdown(0);
      return;
    }

    setCountdown(currentStepData.autoAdvanceSec);
  }, [isTourActive, tourStep, currentStepData]);

  useEffect(() => {
    if (!isTourActive || countdown <= 0 || isTourPaused || isHoveringTooltip) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          nextTourStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTourActive, countdown, isTourPaused, isHoveringTooltip, nextTourStep]);

  // =========================================================================
  // 키보드 접근성
  // =========================================================================

  useEffect(() => {
    if (!isTourActive) return;

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
          nextTourStep();
          break;
        case 'ArrowLeft':
          prevTourStep();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, nextTourStep, prevTourStep, skipTour]);

  // 포커스 트랩: 새 스텝마다 다음 버튼에 포커스
  useEffect(() => {
    if (isTourActive && nextBtnRef.current) {
      const timer = setTimeout(() => nextBtnRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [isTourActive, tourStep]);

  // =========================================================================
  // 렌더 가드
  // =========================================================================

  if (!isDemoMode || !isTourActive || !currentStepData || tourStep < 1 || tourStep > TOTAL_STEPS) {
    return null;
  }

  const isFinalStep = tourStep === TOTAL_STEPS;
  const progressPercent = currentStepData.autoAdvanceSec > 0
    ? ((currentStepData.autoAdvanceSec - countdown) / currentStepData.autoAdvanceSec) * 100
    : 0;

  const maskPath = createMaskPath(targetRect);
  const spotlightPadding = 8;

  return createPortal(
    <div
      className="fixed inset-0 z-[70]"
      aria-live="polite"
      role="dialog"
      aria-modal="true"
      aria-label={`데모 가이드 투어 단계 ${tourStep}/${TOTAL_STEPS}: ${currentStepData.title}`}
    >
      {/* ================================================================ */}
      {/* Dimming + Spotlight Mask (SVG)                                    */}
      {/* ================================================================ */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* 전체 흰색 (표시) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* 스포트라이트 영역 검정 (투명) */}
            {maskPath && (
              <path d={maskPath} fill="black" />
            )}
          </mask>
        </defs>
        {/* Dimming 레이어 with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 14, 26, 0.60)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ================================================================ */}
      {/* Spotlight Ring (가이드 테두리)                                     */}
      {/* ================================================================ */}
      {targetRect && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 2,
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            borderRadius: targetRect.borderRadius + spotlightPadding,
            border: '2px solid rgba(0, 212, 255, 0.6)',
            boxShadow:
              '0 0 0 4px rgba(0, 212, 255, 0.20), 0 0 30px rgba(0, 212, 255, 0.15)',
            animation: 'tour-pulse-ring 2s ease-in-out infinite',
            transition: 'all 400ms ease-in-out',
          }}
        />
      )}

      {/* ================================================================ */}
      {/* Tooltip Box                                                       */}
      {/* ================================================================ */}
      <div
        ref={tooltipRef}
        className="fixed"
        style={{
          zIndex: 3,
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: Math.min(360, window.innerWidth - 32),
          transition: 'all 300ms ease-out',
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setIsHoveringTooltip(true)}
        onMouseLeave={() => setIsHoveringTooltip(false)}
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: '#1C2333',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '12px',
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.4), 0 12px 28px rgba(0,0,0,0.3)',
          }}
        >
          {/* Auto-advance progress bar */}
          {currentStepData.autoAdvanceSec > 0 && (
            <div className="h-[2px] w-full bg-white/[0.05]">
              <div
                className="h-full bg-cyan-400/30 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <div className="p-6">
            {/* Step indicator */}
            <span className="text-[12px] text-white/35 font-medium">
              Step {tourStep} / {TOTAL_STEPS}
            </span>

            {/* Title */}
            <h3 className="text-[18px] font-bold text-white/95 mt-2 mb-2 leading-tight">
              {currentStepData.title}
            </h3>

            {/* Description */}
            <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-line mb-5">
              {currentStepData.description}
            </p>

            {/* === Final Step CTA === */}
            {isFinalStep ? (
              <div className="space-y-3">
                <button
                  ref={nextBtnRef}
                  onClick={() => {
                    trackInteraction('demo_cta_clicked', { cta_type: 'signup' });
                    window.open('/auth', '_blank');
                    skipTour();
                  }}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg',
                    'text-[15px] font-bold',
                    'transition-all duration-200',
                    'hover:brightness-110 active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
                  )}
                  style={{
                    background: '#00D4FF',
                    color: '#111827',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.35)',
                    animation: 'tour-cta-pulse 2s ease-in-out infinite',
                  }}
                >
                  실제 데이터로 시작하기 (14일 무료 체험)
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => skipTour()}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg text-[13px] font-medium',
                      'text-white/50 bg-white/[0.05] border border-white/[0.08]',
                      'hover:bg-white/[0.08] hover:text-white/70',
                      'transition-all duration-200'
                    )}
                  >
                    더 둘러보기
                  </button>
                  <button
                    onClick={() => {
                      trackInteraction('demo_cta_clicked', { cta_type: 'pricing' });
                      window.open('/pricing', '_blank');
                    }}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg text-[13px] font-medium',
                      'text-white/50 border border-white/[0.12]',
                      'hover:bg-white/[0.05] hover:text-white/70',
                      'transition-all duration-200'
                    )}
                  >
                    가격 보기
                  </button>
                </div>
              </div>
            ) : (
              /* === Navigation Buttons === */
              <div className="flex items-center justify-between">
                <button
                  onClick={skipTour}
                  className={cn(
                    'text-[13px] text-white/35 hover:text-white/60',
                    'transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded'
                  )}
                >
                  건너뛰기
                </button>

                <div className="flex items-center gap-2">
                  {tourStep > 1 && (
                    <button
                      onClick={prevTourStep}
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium',
                        'text-white/50 bg-white/[0.05] border border-white/[0.08]',
                        'hover:bg-white/[0.08] hover:text-white/70',
                        'transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                      )}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      이전
                    </button>
                  )}

                  <button
                    ref={nextBtnRef}
                    onClick={nextTourStep}
                    className={cn(
                      'flex items-center gap-1 px-4 py-2 rounded-lg text-[13px] font-semibold',
                      'transition-all duration-200',
                      'hover:brightness-110 active:scale-[0.98]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400'
                    )}
                    style={{
                      background: '#00D4FF',
                      color: '#111827',
                    }}
                  >
                    다음 ({tourStep}/{TOTAL_STEPS})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Progress Dots (하단 중앙)                                         */}
      {/* ================================================================ */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3"
        style={{ zIndex: 3, pointerEvents: 'none' }}
      >
        {TOUR_STEPS.map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === tourStep;
          const isCompleted = stepNum < tourStep;
          return (
            <div
              key={stepNum}
              className={cn(
                'rounded-full transition-all duration-300',
                isActive && 'scale-125'
              )}
              style={{
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                background: isActive
                  ? '#00D4FF'
                  : isCompleted
                    ? 'rgba(0, 212, 255, 0.4)'
                    : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isActive
                  ? '0 0 8px rgba(0, 212, 255, 0.5)'
                  : 'none',
              }}
            />
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* Tour Paused Overlay                                               */}
      {/* ================================================================ */}
      {isTourPaused && (
        <button
          onClick={resumeTour}
          className={cn(
            'fixed bottom-24 right-6',
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'text-[13px] font-medium text-cyan-300',
            'transition-all duration-200',
            'hover:bg-white/[0.08]'
          )}
          style={{
            zIndex: 4,
            background: 'rgba(28, 35, 51, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          투어 계속하기
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ================================================================ */}
      {/* CSS Animations                                                    */}
      {/* ================================================================ */}
      <style>{`
        @keyframes tour-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.01); opacity: 0.85; }
        }
        @keyframes tour-cta-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.35); }
          50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.55); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default GuidedTour;
