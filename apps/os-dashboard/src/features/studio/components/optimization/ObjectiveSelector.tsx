/**
 * ObjectiveSelector.tsx
 *
 * 최적화 목표 선택 컴포넌트
 * - 4개 옵션: revenue, dwell_time, conversion, balanced
 * - 각각 아이콘, 라벨, 설명
 * - balanced에 "추천" 배지
 */

import { DollarSign, Clock, TrendingUp, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OptimizationObjective } from '../../types/optimization.types';

interface ObjectiveSelectorProps {
  value: OptimizationObjective;
  onChange: (value: OptimizationObjective) => void;
  disabled?: boolean;
}

interface ObjectiveOptionData {
  value: OptimizationObjective;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

const objectives: ObjectiveOptionData[] = [
  {
    value: 'revenue',
    label: '매출 최대화',
    description: '예상 매출을 최대화합니다',
    icon: DollarSign,
  },
  {
    value: 'dwell_time',
    label: '체류시간 증가',
    description: '고객 체류시간을 늘립니다',
    icon: Clock,
  },
  {
    value: 'conversion',
    label: '전환율 향상',
    description: '구매 전환율을 높입니다',
    icon: TrendingUp,
  },
  {
    value: 'balanced',
    label: '균형 최적화',
    description: '모든 지표를 균형있게 개선합니다',
    icon: Scale,
    recommended: true,
  },
];

export function ObjectiveSelector({
  value,
  onChange,
  disabled = false,
}: ObjectiveSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-white/70 flex items-center gap-1.5">
        <span className="text-base">🎯</span>
        최적화 목표
      </div>
      <div className="space-y-1.5">
        {objectives.map((objective) => {
          const Icon = objective.icon;
          const isSelected = value === objective.value;

          return (
            <label
              key={objective.value}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all',
                'border border-transparent',
                disabled && 'opacity-50 cursor-not-allowed',
                isSelected
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-white/5 hover:bg-white/10'
              )}
            >
              <input
                type="radio"
                name="optimization-objective"
                value={objective.value}
                checked={isSelected}
                onChange={() => !disabled && onChange(objective.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-white/40'
                )}
              >
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isSelected ? 'text-purple-400' : 'text-white/50'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-white' : 'text-white/70'
                    )}
                  >
                    {objective.label}
                  </span>
                  {objective.recommended && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/30 text-purple-300 rounded font-medium">
                      추천
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">
                  {objective.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default ObjectiveSelector;
