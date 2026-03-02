/**
 * InteractiveDemo.tsx
 *
 * Main interactive demo section for the NeuralTwin website landing/product page.
 * Full-width dark glassmorphism section with:
 * - 3 scenario tabs (auto-cycling every 8 seconds)
 * - Scenario preview cards with mini dashboard
 * - Progress bar for auto-cycle
 * - CTA button linking to OS Dashboard demo
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { DemoScenarioCard } from "./DemoScenarioCard";
import { DEMO_SCENARIOS, type ScenarioId } from "./demo-data";

const AUTO_CYCLE_INTERVAL = 8000; // 8 seconds

export const InteractiveDemo: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("fashion");
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = DEMO_SCENARIOS.findIndex((s) => s.id === activeScenario);

  // IntersectionObserver: detect when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setIsPaused(true);
        } else {
          setIsPaused(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Get next scenario ID
  const getNextScenario = useCallback((): ScenarioId => {
    const nextIndex = (activeIndex + 1) % DEMO_SCENARIOS.length;
    return DEMO_SCENARIOS[nextIndex].id;
  }, [activeIndex]);

  // Auto-cycle logic with progress
  useEffect(() => {
    if (isPaused || !isVisible) {
      // Clear timers when paused or not visible
      if (progressTimerRef.current) {
        cancelAnimationFrame(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      return;
    }

    const startTime = performance.now();

    const animateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min((elapsed / AUTO_CYCLE_INTERVAL) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        progressTimerRef.current = requestAnimationFrame(animateProgress);
      }
    };

    progressTimerRef.current = requestAnimationFrame(animateProgress);

    cycleTimerRef.current = setTimeout(() => {
      setActiveScenario(getNextScenario());
      setProgress(0);
    }, AUTO_CYCLE_INTERVAL);

    return () => {
      if (progressTimerRef.current) {
        cancelAnimationFrame(progressTimerRef.current);
      }
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, [activeScenario, isPaused, isVisible, getNextScenario]);

  // Handle manual tab click
  const handleTabClick = (scenarioId: ScenarioId) => {
    setActiveScenario(scenarioId);
    setProgress(0);
  };

  return (
    <section
      ref={sectionRef}
      id="interactive-demo"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #0c0c14, #1a1a2e)",
      }}
      aria-label="매장 인터랙티브 데모 체험"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Radial gradient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #6C63FF15 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-wider">
              Live Demo
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            매장의 미래를{" "}
            <span className="bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] bg-clip-text text-transparent">
              직접 체험
            </span>
            하세요
          </h2>
          <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto">
            실제 매장 데이터 기반의 AI 분석 대시보드를 업종별로 미리 보세요.
            가입 없이 바로 체험할 수 있습니다.
          </p>
        </div>

        {/* Scenario Tabs */}
        <div className="flex justify-center mb-8" role="tablist" aria-label="매장 시나리오 선택">
          <div className="inline-flex backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
            {DEMO_SCENARIOS.map((scenario) => {
              const isActive = scenario.id === activeScenario;
              return (
                <button
                  key={scenario.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`demo-panel-${scenario.id}`}
                  className={`
                    relative px-4 md:px-6 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-300 ease-out
                    ${
                      isActive
                        ? "text-white bg-gradient-to-r from-[#6C63FF]/20 to-[#8B5CF6]/20 border border-[#6C63FF]/30"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                    }
                  `}
                  onClick={() => handleTabClick(scenario.id)}
                >
                  <span className="flex items-center gap-2">
                    <span className="hidden md:inline">{scenario.storeType}</span>
                    <span className="md:hidden">{scenario.storeType.split(" ")[0]}</span>
                  </span>

                  {/* Progress bar inside active tab */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] transition-none"
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="다음 시나리오까지 남은 시간"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="relative max-w-5xl mx-auto mb-12">
          {DEMO_SCENARIOS.map((scenario) => (
            <DemoScenarioCard
              key={scenario.id}
              scenario={scenario}
              isActive={scenario.id === activeScenario}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/demo?scenario=fashion"
            className="
              inline-flex items-center gap-2 px-8 py-3.5
              bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6]
              hover:from-[#5B54EE] hover:to-[#7C4FE6]
              text-white font-semibold rounded-xl
              transition-all duration-300 ease-out
              shadow-lg shadow-[#6C63FF]/25
              hover:shadow-xl hover:shadow-[#6C63FF]/35
              hover:-translate-y-0.5
              focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50 focus:ring-offset-2 focus:ring-offset-[#0c0c14]
            "
            aria-label="무료 데모 시작하기 - OS 대시보드 체험"
          >
            무료 데모 시작하기
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <p className="mt-4 text-xs text-white/30">
            가입 불필요 &middot; 5분 가이드 투어 &middot; 3가지 업종 체험
          </p>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
