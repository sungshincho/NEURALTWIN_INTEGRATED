/**
 * MetricCard.tsx (v2.0)
 *
 * Enhanced KPI Metric Card for NeuralTwin OS Dashboard.
 * Features:
 *  - Dark glassmorphism theme with status-based accent colors
 *  - Locale-formatted numbers with tabular-nums alignment
 *  - Change indicator (arrow up/down with color)
 *  - Goal progress bar (target vs current)
 *  - Inline sparkline for 7-day trend
 *  - Context menu placeholder (three-dot button)
 *  - Smooth hover transitions
 *  - Fully responsive grid-friendly layout
 *
 * Usage:
 *   <MetricCard
 *     icon={<Users className="h-5 w-5" />}
 *     label="방문객"
 *     value={12847}
 *     unit="명"
 *     change={{ value: 8.3, period: "전일 대비" }}
 *     goal={{ target: 16500, current: 12847 }}
 *     trend={[980, 1020, 1150, 1280, 1190, 1350, 1480]}
 *     status="excellent"
 *   />
 */

import React from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from './Sparkline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MetricCardStatus = 'normal' | 'warning' | 'critical' | 'excellent';

export interface MetricCardChange {
  /** Percentage or absolute change value. Positive = up, negative = down. */
  value: number;
  /** Period label, e.g., "전일 대비", "전주 대비" */
  period: string;
}

export interface MetricCardGoal {
  /** Target value (100% of goal) */
  target: number;
  /** Current progress value */
  current: number;
}

export interface MetricCardProps {
  /** Icon element rendered in the card header */
  icon: React.ReactNode;
  /** Metric label (e.g., "방문객", "매출") */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Unit label displayed below the value (e.g., "명", "원") */
  unit: string;
  /** Change indicator showing delta and period */
  change: MetricCardChange;
  /** Optional goal progress bar */
  goal?: MetricCardGoal;
  /** Optional sparkline data points (e.g., 7 daily values) */
  trend?: number[];
  /** Status determines accent color for borders and indicators */
  status: MetricCardStatus;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Additional className for the outer container */
  className?: string;
}

// ---------------------------------------------------------------------------
// Status color mappings
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<
  MetricCardStatus,
  {
    text: string;
    border: string;
    glow: string;
    sparklineStroke: string;
    sparklineFill: string;
    progressBar: string;
    progressBg: string;
  }
> = {
  normal: {
    text: 'text-white',
    border: 'border-white/10',
    glow: '',
    sparklineStroke: 'rgba(255, 255, 255, 0.5)',
    sparklineFill: 'rgba(255, 255, 255, 0.06)',
    progressBar: 'bg-white/40',
    progressBg: 'bg-white/10',
  },
  warning: {
    text: 'text-amber-400',
    border: 'border-amber-400/20',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.08)]',
    sparklineStroke: 'rgba(251, 191, 36, 0.7)',
    sparklineFill: 'rgba(251, 191, 36, 0.1)',
    progressBar: 'bg-amber-400/70',
    progressBg: 'bg-amber-400/10',
  },
  critical: {
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)]',
    sparklineStroke: 'rgba(244, 63, 94, 0.7)',
    sparklineFill: 'rgba(244, 63, 94, 0.1)',
    progressBar: 'bg-rose-500/70',
    progressBg: 'bg-rose-500/10',
  },
  excellent: {
    text: 'text-emerald-400',
    border: 'border-emerald-400/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]',
    sparklineStroke: 'rgba(52, 211, 153, 0.7)',
    sparklineFill: 'rgba(52, 211, 153, 0.1)',
    progressBar: 'bg-emerald-400/70',
    progressBg: 'bg-emerald-400/10',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a number with locale-aware thousands separators.
 * Uses 'ko-KR' locale for comma separation.
 */
function formatValue(value: number): string {
  return value.toLocaleString('ko-KR');
}

/**
 * Compute goal progress as a percentage clamped to [0, 100].
 */
function computeProgress(goal: MetricCardGoal): number {
  if (goal.target <= 0) return 0;
  return Math.min(Math.max((goal.current / goal.target) * 100, 0), 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Change indicator: colored arrow + value + period label */
const ChangeIndicator: React.FC<{ change: MetricCardChange }> = ({ change }) => {
  const isPositive = change.value > 0;
  const isNegative = change.value < 0;
  const isNeutral = change.value === 0;

  const ArrowIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const colorClass = isPositive
    ? 'text-emerald-400'
    : isNegative
      ? 'text-rose-400'
      : 'text-white/40';

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex items-center gap-1', colorClass)}>
        <ArrowIcon className="h-3.5 w-3.5" />
        <span className="text-sm font-semibold font-mono tabular-nums">
          {isPositive ? '+' : ''}
          {change.value.toFixed(1)}%
        </span>
      </div>
      {!isNeutral && (
        <span className="text-xs text-white/40">{change.period}</span>
      )}
    </div>
  );
};

/** Progress bar showing current vs target with percentage label */
const GoalProgress: React.FC<{
  goal: MetricCardGoal;
  status: MetricCardStatus;
}> = ({ goal, status }) => {
  const progress = computeProgress(goal);
  const colors = STATUS_COLORS[status];

  return (
    <div className="space-y-1.5">
      {/* Progress bar track */}
      <div className={cn('h-1.5 w-full rounded-full overflow-hidden', colors.progressBg)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            colors.progressBar,
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/40">
          목표 대비 {progress.toFixed(0)}%
        </span>
        <span className="text-[11px] text-white/30 font-mono tabular-nums">
          {formatValue(goal.current)} / {formatValue(goal.target)}
        </span>
      </div>
    </div>
  );
};

/** Context menu button (placeholder) */
const ContextMenuButton: React.FC = () => (
  <button
    type="button"
    className={cn(
      'p-1 rounded-md',
      'text-white/30 hover:text-white/60',
      'hover:bg-white/5',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-1 focus:ring-white/20',
    )}
    aria-label="More options"
    onClick={(e) => {
      // Stop propagation so card onClick is not triggered
      e.stopPropagation();
    }}
  >
    <MoreHorizontal className="h-4 w-4" />
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  change,
  goal,
  trend,
  status,
  onClick,
  className,
}) => {
  const colors = STATUS_COLORS[status];

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        // Glassmorphism base
        'bg-white/5 backdrop-blur-md',
        'border rounded-xl',
        colors.border,
        colors.glow,

        // Padding & layout
        'p-5',

        // Hover & interaction
        'hover:bg-white/[0.08] transition-all duration-200',
        onClick && 'cursor-pointer active:scale-[0.98]',

        // Focus styles for keyboard nav
        onClick && 'focus:outline-none focus:ring-1 focus:ring-white/20',

        className,
      )}
    >
      {/* ── Row 1: Icon + Label + Context Menu ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex items-center justify-center',
              'w-9 h-9 rounded-lg',
              'bg-white/[0.07] border border-white/[0.08]',
              'flex-shrink-0',
            )}
          >
            <span className={cn('flex items-center justify-center', colors.text)}>
              {icon}
            </span>
          </div>
          <span className="text-sm font-medium text-white/70 truncate">
            {label}
          </span>
        </div>
        <ContextMenuButton />
      </div>

      {/* ── Row 2: Main Value + Change Indicator ── */}
      <div className="flex items-end justify-between mb-1">
        <div className="min-w-0">
          <span
            className={cn(
              'text-3xl font-extrabold tracking-tight',
              'font-mono tabular-nums',
              'text-white',
            )}
          >
            {formatValue(value)}
          </span>
          <span className="text-sm text-white/40 ml-1.5">{unit}</span>
        </div>
        <div className="flex-shrink-0 ml-3">
          <ChangeIndicator change={change} />
        </div>
      </div>

      {/* ── Row 3: Goal Progress ── */}
      {goal && (
        <div className="mt-3">
          <GoalProgress goal={goal} status={status} />
        </div>
      )}

      {/* ── Row 4: Sparkline ── */}
      {trend && trend.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <Sparkline
            data={trend}
            width={320}
            height={28}
            strokeColor={colors.sparklineStroke}
            fillColor={colors.sparklineFill}
            strokeWidth={1.5}
            showEndDot
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
