/**
 * DemoScenarioCard.tsx
 *
 * Scenario preview card for the Interactive Landing Demo.
 * Composes DemoMetricCard + DemoHeatmapGrid + AI insight preview bubble.
 * Glassmorphism dark card with animated transitions.
 */

import { DemoMetricCard } from "./DemoMetricCard";
import { DemoHeatmapGrid } from "./DemoHeatmapGrid";
import type { DemoScenario } from "./demo-data";

interface DemoScenarioCardProps {
  scenario: DemoScenario;
  /** Whether this scenario is the actively displayed one */
  isActive: boolean;
  /** Whether the card should animate in (controlled by parent) */
  isVisible: boolean;
}

export const DemoScenarioCard: React.FC<DemoScenarioCardProps> = ({
  scenario,
  isActive,
  isVisible,
}) => {
  return (
    <div
      className={`
        transition-all duration-700 ease-in-out
        ${isActive ? "opacity-100 translate-x-0 scale-100" : "opacity-0 absolute translate-x-4 scale-95 pointer-events-none"}
      `}
      role="tabpanel"
      aria-label={`${scenario.storeName} 시나리오 미리보기`}
      aria-hidden={!isActive}
    >
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 md:p-6">
        {/* Header: store name + type */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF]/20 to-[#8B5CF6]/20 border border-[#6C63FF]/20 flex items-center justify-center flex-shrink-0">
            <ScenarioIcon type={scenario.icon} />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-white">
              {scenario.storeName}
            </h4>
            <p className="text-xs text-white/40">{scenario.storeType}</p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {scenario.metrics.map((metric, i) => (
            <DemoMetricCard
              key={metric.label}
              metric={metric}
              isVisible={isVisible && isActive}
              animationDelay={i * 100}
            />
          ))}
        </div>

        {/* Main content: Heatmap + AI Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Heatmap */}
          <div className="lg:col-span-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Zone Heatmap
              </span>
              <div className="flex items-center gap-1 ml-auto" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-blue-500/60" />
                <span className="text-[10px] text-white/30">낮음</span>
                <div className="w-8 h-1.5 rounded-full bg-gradient-to-r from-blue-500/60 via-yellow-500/60 to-red-500/60 mx-1" />
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <span className="text-[10px] text-white/30">높음</span>
              </div>
            </div>
            <DemoHeatmapGrid scenario={scenario} isActive={isActive} />
          </div>

          {/* AI Insight Bubble */}
          <div className="lg:col-span-2 flex flex-col justify-end">
            <AIInsightBubble insight={scenario.aiInsight} isActive={isActive} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== AI Insight Bubble =====

interface AIInsightBubbleProps {
  insight: string;
  isActive: boolean;
}

const AIInsightBubble: React.FC<AIInsightBubbleProps> = ({ insight, isActive }) => {
  return (
    <div
      className={`
        backdrop-blur-lg bg-gradient-to-br from-[#6C63FF]/10 to-[#8B5CF6]/5
        border border-[#6C63FF]/20 rounded-xl p-4
        transition-all duration-700 delay-300
        ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      aria-label="AI 인사이트"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
        </div>
        <span className="text-xs font-semibold text-[#6C63FF]">
          NeuralMind AI
        </span>
        <span className="text-[10px] text-white/30 ml-auto">방금 분석</span>
      </div>

      {/* Insight text */}
      <p className="text-xs md:text-sm text-white/70 leading-relaxed">
        {insight}
      </p>
    </div>
  );
};

// ===== Scenario Icons =====

interface ScenarioIconProps {
  type: string;
}

const ScenarioIcon: React.FC<ScenarioIconProps> = ({ type }) => {
  const commonClass = "w-5 h-5 text-[#6C63FF]";

  switch (type) {
    case "shirt":
      return (
        <svg className={commonClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={commonClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      );
    case "building":
      return (
        <svg className={commonClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    default:
      return null;
  }
};

export default DemoScenarioCard;
