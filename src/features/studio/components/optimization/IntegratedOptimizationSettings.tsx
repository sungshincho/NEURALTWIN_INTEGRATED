/**
 * IntegratedOptimizationSettings.tsx
 *
 * B안: 통합 최적화 설정 컴포넌트
 * - 레이아웃 최적화 시 직원 위치 제안 옵션
 * - 인력배치 최적화 시 가구 미세 조정 옵션
 */

import { Users, Move, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IntegratedOptimizationSettings } from '../../types/optimization.types';
import { DEFAULT_INTEGRATED_SETTINGS } from '../../types/optimization.types';

interface IntegratedOptimizationSettingsProps {
  /** 현재 설정 값 */
  settings: IntegratedOptimizationSettings;
  /** 설정 변경 콜백 */
  onChange: (settings: IntegratedOptimizationSettings) => void;
  /** 최적화 타입 ('layout' | 'staffing') */
  optimizationType?: 'layout' | 'staffing' | 'both';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

export function IntegratedOptimizationSettings({
  settings = DEFAULT_INTEGRATED_SETTINGS,
  onChange,
  optimizationType = 'both',
  disabled = false,
  className,
}: IntegratedOptimizationSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStaffOptimizationChange = (checked: boolean) => {
    onChange({ ...settings, includeStaffOptimization: checked });
  };

  const handleFurnitureAdjustmentChange = (checked: boolean) => {
    onChange({ ...settings, allowFurnitureAdjustment: checked });
  };

  const showStaffOption = optimizationType === 'layout' || optimizationType === 'both';
  const showFurnitureOption = optimizationType === 'staffing' || optimizationType === 'both';

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <Users className="h-4 w-4 text-cyan-400" />
            <Move className="h-4 w-4 text-orange-400" />
          </div>
          <span className="text-sm font-medium text-white/90">통합 최적화 설정</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400">
            B안
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {settings.includeStaffOptimization && showStaffOption && (
            <span className="text-[10px] text-cyan-400">+직원</span>
          )}
          {settings.allowFurnitureAdjustment && showFurnitureOption && (
            <span className="text-[10px] text-orange-400">+가구</span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>

      {/* 콘텐츠 */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* 레이아웃 최적화 → 직원 제안 */}
          {showStaffOption && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="includeStaff"
                checked={settings.includeStaffOptimization}
                onCheckedChange={handleStaffOptimizationChange}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="includeStaff"
                  className="text-sm text-white/80 cursor-pointer flex items-center gap-1"
                >
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  직원 위치도 함께 최적화
                </Label>
                <p className="text-[10px] text-white/40 mt-0.5">
                  가구 배치 변경 시 연동 직원 위치도 제안합니다
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-cyan-500/30 text-cyan-400 shrink-0"
              >
                권장
              </Badge>
            </div>
          )}

          {/* 인력배치 최적화 → 가구 미세 조정 */}
          {showFurnitureOption && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="allowFurniture"
                checked={settings.allowFurnitureAdjustment}
                onCheckedChange={handleFurnitureAdjustmentChange}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="allowFurniture"
                  className="text-sm text-white/80 cursor-pointer flex items-center gap-1"
                >
                  <Move className="h-3.5 w-3.5 text-orange-400" />
                  가구 미세 조정 허용
                </Label>
                <p className="text-[10px] text-white/40 mt-0.5">
                  직원 동선 확보를 위한 가구 위치 미세 조정을 허용합니다
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-orange-500/30 text-orange-400 shrink-0"
              >
                권장
              </Badge>
            </div>
          )}

          {/* 안내 문구 */}
          <div className="text-[10px] text-white/40 bg-white/5 rounded p-2">
            💡 통합 최적화는 가구와 직원을 함께 고려하여 더 정확한 최적화 결과를 제공합니다.
            부가 결과는 선택적으로 적용할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegratedOptimizationSettings;
