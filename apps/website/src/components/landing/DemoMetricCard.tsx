/**
 * DemoMetricCard.tsx
 *
 * Mini metric card for the Interactive Landing Demo.
 * Shows value + label + trend indicator with animated counter on scroll-into-view.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { DemoMetric } from "./demo-data";

interface DemoMetricCardProps {
  metric: DemoMetric;
  /** Whether this card is currently visible (controlled by parent section) */
  isVisible?: boolean;
  /** Delay before starting the counter animation (stagger effect) */
  animationDelay?: number;
}

export const DemoMetricCard: React.FC<DemoMetricCardProps> = ({
  metric,
  isVisible = false,
  animationDelay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const isPositive = metric.trend > 0;
  const isNegative = metric.trend < 0;

  // Animate counter when visible
  const animateCounter = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    const isTimeFormat = metric.value.includes(":");
    const targetDisplay = metric.value;

    if (isTimeFormat) {
      // For time values like "4:12", just fade in the value
      setTimeout(() => {
        setDisplayValue(targetDisplay);
      }, animationDelay);
      return;
    }

    // Parse target number (remove commas)
    const targetNum = parseFloat(metric.value.replace(/,/g, ""));
    const duration = 1200; // ms
    const startTime = performance.now() + animationDelay;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;

      // Format to match original format
      if (targetNum >= 100) {
        setDisplayValue(Math.round(current).toLocaleString("ko-KR"));
      } else {
        // decimal value like 3.8 or 5.2
        setDisplayValue(current.toFixed(1));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetDisplay);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, [hasAnimated, metric.value, animationDelay]);

  // Use IntersectionObserver for scroll-triggered animation
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateCounter();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateCounter]);

  // Also trigger when parent signals visibility
  useEffect(() => {
    if (isVisible && !hasAnimated) {
      animateCounter();
    }
  }, [isVisible, hasAnimated, animateCounter]);

  return (
    <div
      ref={cardRef}
      className={`
        backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]
        rounded-xl p-4 transition-all duration-500
        hover:bg-white/[0.07] hover:border-white/[0.15]
        ${hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="group"
      aria-label={`${metric.label}: ${metric.value}${metric.suffix}`}
    >
      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {displayValue}
        </span>
        {metric.suffix && (
          <span className="text-sm text-white/50 font-medium">
            {metric.suffix}
          </span>
        )}
      </div>

      {/* Label + Trend */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-medium">{metric.label}</span>
        <span
          className={`text-xs font-semibold flex items-center gap-0.5 ${
            isPositive
              ? "text-emerald-400"
              : isNegative
              ? "text-red-400"
              : "text-white/40"
          }`}
          aria-label={`전일 대비 ${metric.trend > 0 ? "+" : ""}${metric.trend}${metric.trendUnit}`}
        >
          {isPositive ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
            </svg>
          ) : isNegative ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
            </svg>
          ) : null}
          {metric.trend > 0 ? "+" : ""}
          {metric.trend}
          {metric.trendUnit}
        </span>
      </div>
    </div>
  );
};

export default DemoMetricCard;
