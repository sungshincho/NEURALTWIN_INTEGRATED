/**
 * ViewModeToggle.tsx
 *
 * 3D 뷰어 As-Is / 비교 / To-Be 모드 전환 토글
 * - As-Is: 현재 배치 (시각 효과 없음)
 * - compare: As-Is → To-Be 변화 비교 (빨간/초록 박스, 점선 화살표)
 * - To-Be: 최적화 결과 (시각 효과 없음)
 */

import { useEffect, useCallback } from 'react';
import { Eye, GitCompare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type ViewMode = 'as-is' | 'compare' | 'to-be';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  hasOptimizationResults?: boolean;
}

const modeConfig = [
  {
    id: 'as-is' as ViewMode,
    label: 'As-Is',
    shortcut: 'A',
    icon: Eye,
    description: '현재 배치',
    activeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'compare' as ViewMode,
    label: '비교',
    shortcut: 'C',
    icon: GitCompare,
    description: 'As-Is ↔ To-Be 변화 비교',
    activeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'to-be' as ViewMode,
    label: 'To-Be',
    shortcut: 'T',
    icon: Sparkles,
    description: '최적화 결과',
    activeColor: 'bg-green-600 text-white',
  },
];

export function ViewModeToggle({
  mode,
  onChange,
  disabled = false,
  hasOptimizationResults = false,
}: ViewModeToggleProps) {
  const canUseToBe = hasOptimizationResults;

  // 🆕 키보드 단축키 핸들러
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 입력 필드에서는 단축키 무시
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl, Alt, Meta 키가 눌려있으면 무시
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    const key = e.key.toLowerCase();

    if (key === 'a') {
      e.preventDefault();
      onChange('as-is');
    } else if (key === 'c' && canUseToBe) {
      e.preventDefault();
      onChange('compare');
    } else if (key === 't' && canUseToBe) {
      e.preventDefault();
      onChange('to-be');
    }
  }, [onChange, canUseToBe]);

  // 키보드 이벤트 등록
  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleKeyDown]);

  return (
    <TooltipProvider>
      <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg p-1 flex gap-0.5">
        {modeConfig.map((config) => {
          const Icon = config.icon;
          const isActive = mode === config.id;
          const isDisabled = disabled || (config.id !== 'as-is' && !canUseToBe);

          return (
            <Tooltip key={config.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isDisabled && onChange(config.id)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? config.activeColor
                      : 'text-white/60 hover:text-white hover:bg-white/10',
                    isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{config.description}</p>
                {!canUseToBe && config.id !== 'as-is' && (
                  <p className="text-muted-foreground">최적화 결과가 필요합니다</p>
                )}
                <p className="text-muted-foreground">단축키: {config.shortcut}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default ViewModeToggle;
