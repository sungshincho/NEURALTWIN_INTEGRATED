/**
 * FurnitureSelector.tsx
 *
 * 이동 가능 가구 선택 컴포넌트
 * - 체크박스 리스트
 * - "전체 선택/해제" 버튼
 * - 제약 조건 체크박스
 */

import { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Check, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FurnitureItem, FurnitureSettings } from '../../types/optimization.types';

interface FurnitureSelectorProps {
  furniture: FurnitureItem[];
  settings: FurnitureSettings;
  onChange: (settings: FurnitureSettings) => void;
  disabled?: boolean;
}

export function FurnitureSelector({
  furniture,
  settings,
  onChange,
  disabled = false,
}: FurnitureSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const movableFurniture = furniture.filter((f) => f.movable !== false);
  const selectedCount = settings.movableIds.length;
  const allSelected = selectedCount === movableFurniture.length && movableFurniture.length > 0;
  const noneSelected = selectedCount === 0;

  const handleToggleFurniture = (id: string) => {
    if (disabled) return;
    const newIds = settings.movableIds.includes(id)
      ? settings.movableIds.filter((fid) => fid !== id)
      : [...settings.movableIds, id];
    onChange({ ...settings, movableIds: newIds });
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange({
      ...settings,
      movableIds: allSelected ? [] : movableFurniture.map((f) => f.id),
    });
  };

  const handleConstraintChange = (key: keyof FurnitureSettings, value: boolean) => {
    if (disabled) return;
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-medium text-white/70 hover:text-white/90 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base">📦</span>
          이동 가능 가구
          <span className="text-white/40">
            ({selectedCount}/{movableFurniture.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {/* 전체 선택/해제 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              disabled={disabled}
              className="h-7 text-xs border-white/20 text-white/70 hover:text-white"
            >
              {allSelected ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  전체 해제
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3 mr-1" />
                  전체 선택
                </>
              )}
            </Button>
          </div>

          {/* 가구 목록 - 높이 축소 */}
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {movableFurniture.length === 0 ? (
              <p className="text-xs text-white/40 py-2">이동 가능한 가구가 없습니다</p>
            ) : (
              movableFurniture.map((item) => {
                const isSelected = settings.movableIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                      disabled && 'opacity-50 cursor-not-allowed',
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFurniture(item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-white/40'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Package className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/80 truncate">
                        {item.name || item.furniture_type}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {item.furniture_type}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* 제약 조건 */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[10px] text-white/50 uppercase tracking-wide">
              제약 조건
            </div>
            <label
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="checkbox"
                checked={settings.keepWallAttached}
                onChange={(e) =>
                  handleConstraintChange('keepWallAttached', e.target.checked)
                }
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/40 text-blue-600 focus:ring-blue-500 bg-white/10"
              />
              <span className="text-xs text-white/70">벽면 배치 유지</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="checkbox"
                checked={settings.keepZoneBoundaries}
                onChange={(e) =>
                  handleConstraintChange('keepZoneBoundaries', e.target.checked)
                }
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/40 text-blue-600 focus:ring-blue-500 bg-white/10"
              />
              <span className="text-xs text-white/70">존 경계 유지</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default FurnitureSelector;
