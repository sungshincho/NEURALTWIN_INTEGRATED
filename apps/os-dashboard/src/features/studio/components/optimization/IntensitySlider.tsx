/**
 * IntensitySlider.tsx
 *
 * 최적화 강도 선택 컴포넌트
 * - low/medium/high 3단계
 * - 각 단계별 최대 변경 수 표시
 */

import { Gauge, Zap, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OptimizationIntensity } from '../../types/optimization.types';
import { INTENSITY_LIMITS } from '../../types/optimization.types';

interface IntensitySelectorProps {
  value: OptimizationIntensity;
  onChange: (value: OptimizationIntensity) => void;
  disabled?: boolean;
}

interface IntensityOptionData {
  value: OptimizationIntensity;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const intensityOptions: IntensityOptionData[] = [
  {
    value: 'low',
    label: '보수적',
    description: '최소한의 변경',
    icon: Gauge,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
  {
    value: 'medium',
    label: '균형',
    description: '적절한 변경',
    icon: Zap,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  {
    value: 'high',
    label: '적극적',
    description: '대폭 변경 허용',
    icon: Flame,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/50',
  },
];

export function IntensitySlider({
  value,
  onChange,
  disabled = false,
}: IntensitySelectorProps) {
  const currentIndex = intensityOptions.findIndex((opt) => opt.value === value);
  const currentLimits = INTENSITY_LIMITS[value];
  const currentOption = intensityOptions[currentIndex];

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-white/70 flex items-center gap-1.5">
        <span className="text-base">⚡</span>
        최적화 강도
      </div>

      {/* 슬라이더 트랙 */}
      <div className="relative">
        {/* 배경 트랙 */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          {/* 진행 바 */}
          <div
            className={cn(
              'h-full transition-all duration-300',
              currentOption.bgColor.replace('/20', '/40')
            )}
            style={{ width: `${((currentIndex + 1) / 3) * 100}%` }}
          />
        </div>

        {/* 선택 버튼들 */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {intensityOptions.map((option, index) => {
            const isSelected = value === option.value;
            const isPast = index <= currentIndex;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                  disabled && 'opacity-50 cursor-not-allowed',
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} scale-125`
                    : isPast
                    ? 'border-white/40 bg-white/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 레이블 */}
      <div className="flex justify-between text-[10px] text-white/40">
        {intensityOptions.map((option) => {
          const isSelected = value === option.value;
          return (
            <span
              key={option.value}
              className={cn(
                'transition-colors',
                isSelected && option.color
              )}
            >
              {option.label}
            </span>
          );
        })}
      </div>

      {/* 현재 선택 정보 카드 */}
      <div
        className={cn(
          'p-3 rounded-lg border transition-all',
          currentOption.bgColor,
          currentOption.borderColor
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <currentOption.icon className={cn('h-4 w-4', currentOption.color)} />
          <span className={cn('text-sm font-medium', currentOption.color)}>
            {currentOption.label}
          </span>
          <span className="text-xs text-white/50">
            - {currentOption.description}
          </span>
        </div>

        {/* 최대 변경 수 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1">
            <span className="text-white/50">가구 이동:</span>
            <span className={cn('font-medium', currentOption.color)}>
              최대 {currentLimits.maxFurnitureMoves}개
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1">
            <span className="text-white/50">제품 재배치:</span>
            <span className={cn('font-medium', currentOption.color)}>
              최대 {currentLimits.maxProductRelocations}개
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntensitySlider;
