/**
 * OnboardingOverlay — OS Dashboard 온보딩 투어 UI
 *
 * 스포트라이트 오버레이 + 애니메이션 툴팁.
 * framer-motion으로 부드러운 전환 효과.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Sparkles } from "lucide-react";
import type { TourStep } from "@/hooks/useOnboardingTour";

interface OnboardingOverlayProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: OnboardingOverlayProps) {
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Navigate if needed and find target element
  const findTarget = useCallback(() => {
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  useEffect(() => {
    if (step.navigateTo) {
      navigate(step.navigateTo);
      // Wait for navigation + render
      const timer = setTimeout(findTarget, 300);
      return () => clearTimeout(timer);
    } else {
      findTarget();
    }
  }, [step, navigate, findTarget]);

  // Update position on resize
  useEffect(() => {
    const onResize = () => findTarget();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [findTarget]);

  // Keyboard: Escape to skip, Enter/Right to next
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "Enter" || e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNext, onSkip]);

  const isLast = currentStep === totalSteps - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const gap = 16;
    const tooltipWidth = 320;

    switch (step.placement) {
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left + targetRect.width + gap,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - tooltipWidth - gap,
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          top: targetRect.top + targetRect.height + gap,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          top: targetRect.top - gap,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      default:
        return {
          top: targetRect.top + targetRect.height + gap,
          left: targetRect.left,
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Semi-transparent backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onSkip}
        />

        {/* Spotlight cutout on target */}
        {targetRect && (
          <motion.div
            className="absolute rounded-lg ring-2 ring-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              backgroundColor: "transparent",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          className="absolute w-80 rounded-xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-sm"
          style={getTooltipStyle()}
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-accent">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-white">
            {step.title}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 transition-colors hover:text-white"
            >
              건너뛰기
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {isLast ? "시작하기" : "다음"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Progress dots */}
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-4 bg-accent"
                    : i < currentStep
                      ? "w-1.5 bg-accent/50"
                      : "w-1.5 bg-gray-600"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
