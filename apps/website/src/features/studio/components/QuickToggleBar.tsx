/**
 * QuickToggleBar.tsx
 *
 * 3D 뷰어 상단 중앙에 표시되는 오버레이 퀵 토글 바
 * - 히트맵, 동선, 고객, 존, 직원 5개 토글
 * - 플로팅 UI로 3D 뷰어 위에 오버레이됨
 * - 고객(avatar) 토글 시 시뮬레이션 제어 팝업 표시
 * - React.memo로 불필요한 리렌더링 방지
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Flame, Route, Users, MapPin, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SimulationControlPopup } from './SimulationControlPopup';

export type OverlayType = 'heatmap' | 'flow' | 'avatar' | 'zone' | 'staff' | 'layoutOptimization' | 'flowOptimization' | 'congestion' | 'staffing';

interface QuickToggle {
  id: OverlayType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
}

const QUICK_TOGGLES: QuickToggle[] = [
  { id: 'heatmap', label: '히트맵', icon: Flame, color: 'text-orange-400', activeColor: 'bg-orange-500/30 border-orange-500' },
  { id: 'flow', label: '동선', icon: Route, color: 'text-blue-400', activeColor: 'bg-blue-500/30 border-blue-500' },
  { id: 'avatar', label: '고객', icon: Users, color: 'text-green-400', activeColor: 'bg-green-500/30 border-green-500' },
  { id: 'zone', label: '존', icon: MapPin, color: 'text-purple-400', activeColor: 'bg-purple-500/30 border-purple-500' },
  { id: 'staff', label: '직원', icon: UserCog, color: 'text-yellow-400', activeColor: 'bg-yellow-500/30 border-yellow-500' },
];

interface QuickToggleBarProps {
  activeOverlays: OverlayType[];
  onToggle: (id: OverlayType) => void;
  className?: string;
}

export const QuickToggleBar = memo(function QuickToggleBar({
  activeOverlays,
  onToggle,
  className,
}: QuickToggleBarProps) {
  const [showSimPopup, setShowSimPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target as Node)
      ) {
        setShowSimPopup(false);
      }
    };

    if (showSimPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSimPopup]);

  // 고객(avatar) 토글 핸들러
  const handleAvatarClick = useCallback(() => {
    // 토글과 동시에 팝업 표시/숨기기
    const isCurrentlyActive = activeOverlays.includes('avatar');
    onToggle('avatar');
    // 활성화될 때 팝업 표시, 비활성화될 때 팝업 숨기기
    setShowSimPopup(!isCurrentlyActive);
  }, [activeOverlays, onToggle]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-xl',
            'bg-black/60 backdrop-blur-md border border-white/10',
            'shadow-lg',
            className
          )}
        >
          {QUICK_TOGGLES.map((toggle) => {
            const Icon = toggle.icon;
            const isActive = activeOverlays.includes(toggle.id);
            const isAvatar = toggle.id === 'avatar';

            return (
              <Tooltip key={toggle.id}>
                <TooltipTrigger asChild>
                  <Button
                    ref={isAvatar ? avatarButtonRef : undefined}
                    variant="ghost"
                    size="sm"
                    onClick={isAvatar ? handleAvatarClick : () => onToggle(toggle.id)}
                    className={cn(
                      'h-8 w-8 p-0 rounded-lg transition-all',
                      'border border-transparent',
                      isActive ? toggle.activeColor : 'hover:bg-white/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? toggle.color : 'text-white/50'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-black/90 text-white text-xs border-white/20"
                >
                  {toggle.label}
                  {isActive && <span className="ml-1 text-green-400">(활성)</span>}
                  {isAvatar && <span className="ml-1 text-white/60">(클릭: 시뮬레이션)</span>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* 시뮬레이션 제어 팝업 */}
        {showSimPopup && (
          <div
            ref={popupRef}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50"
          >
            <SimulationControlPopup />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

export default QuickToggleBar;
