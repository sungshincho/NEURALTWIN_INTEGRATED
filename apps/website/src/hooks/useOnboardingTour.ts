/**
 * useOnboardingTour — OS Dashboard 온보딩 투어 상태 관리
 *
 * 3단계 투어:
 * 1. 인사이트 허브 소개
 * 2. 디지털트윈 스튜디오 소개
 * 3. AI 어시스턴트 소개
 *
 * localStorage로 완료 상태를 기억합니다.
 */

import { useState, useCallback, useEffect } from "react";

const TOUR_STORAGE_KEY = "neuraltwin_onboarding_completed";
const TOUR_VERSION = "1"; // 투어 버전이 바뀌면 다시 표시

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector of the target element to highlight */
  targetSelector: string;
  /** Position of the tooltip relative to target */
  placement: "top" | "bottom" | "left" | "right";
  /** Optional path to navigate before showing this step */
  navigateTo?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "insights",
    title: "인사이트 허브",
    description:
      "매장 데이터를 한눈에 확인하세요. AI가 분석한 핵심 인사이트와 실시간 방문자 현황을 볼 수 있습니다.",
    targetSelector: '[data-tour="insights-nav"]',
    placement: "right",
    navigateTo: "/os/insights",
  },
  {
    id: "studio",
    title: "디지털트윈 스튜디오",
    description:
      "3D 매장 모델에서 고객 동선을 시뮬레이션하고, 레이아웃 최적화를 테스트해보세요.",
    targetSelector: '[data-tour="studio-nav"]',
    placement: "right",
    navigateTo: "/os/studio",
  },
  {
    id: "assistant",
    title: "AI 어시스턴트",
    description:
      "무엇이든 물어보세요. 매출 데이터 조회, 시뮬레이션 실행, 페이지 이동까지 AI가 도와드립니다.",
    targetSelector: '[data-tour="assistant-toggle"]',
    placement: "left",
  },
];

export interface UseOnboardingTourReturn {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Current step data */
  step: TourStep | null;
  /** Total number of steps */
  totalSteps: number;
  /** Start the tour */
  startTour: () => void;
  /** Go to the next step */
  nextStep: () => void;
  /** Skip/close the tour */
  skipTour: () => void;
  /** Whether the tour has been completed before */
  hasCompleted: boolean;
}

export function useOnboardingTour(): UseOnboardingTourReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    if (stored === TOUR_VERSION) {
      setHasCompleted(true);
    }
  }, []);

  const markComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, TOUR_VERSION);
    setHasCompleted(true);
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      markComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, markComplete]);

  const skipTour = useCallback(() => {
    markComplete();
  }, [markComplete]);

  return {
    isActive,
    currentStep,
    step: isActive ? TOUR_STEPS[currentStep] ?? null : null,
    totalSteps: TOUR_STEPS.length,
    startTour,
    nextStep,
    skipTour,
    hasCompleted,
  };
}
