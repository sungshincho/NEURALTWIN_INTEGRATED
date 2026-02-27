/**
 * ProductSelector.tsx
 *
 * 재배치 가능 제품 선택 컴포넌트
 * - 라디오: 전체/선택
 * - 선택 모드일 때 제품 체크박스
 */

import { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductItem, ProductSettings } from '../../types/optimization.types';

interface ProductSelectorProps {
  products: ProductItem[];
  settings: ProductSettings;
  onChange: (settings: ProductSettings) => void;
  disabled?: boolean;
}

export function ProductSelector({
  products,
  settings,
  onChange,
  disabled = false,
}: ProductSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedCount = settings.relocateAll
    ? products.length
    : settings.relocatableIds.length;

  const handleModeChange = (relocateAll: boolean) => {
    if (disabled) return;
    onChange({
      ...settings,
      relocateAll,
      relocatableIds: relocateAll ? [] : settings.relocatableIds,
    });
  };

  const handleToggleProduct = (id: string) => {
    if (disabled || settings.relocateAll) return;
    const newIds = settings.relocatableIds.includes(id)
      ? settings.relocatableIds.filter((pid) => pid !== id)
      : [...settings.relocatableIds, id];
    onChange({ ...settings, relocatableIds: newIds });
  };

  const handleConstraintChange = (key: keyof ProductSettings, value: boolean) => {
    if (disabled) return;
    onChange({ ...settings, [key]: value });
  };

  // 카테고리별 그룹핑
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || '기타';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, ProductItem[]>);

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-medium text-white/70 hover:text-white/90 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base">🏷️</span>
          재배치 가능 제품
          <span className="text-white/40">
            ({selectedCount}/{products.length})
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
          {/* 모드 선택 (라디오) */}
          <div className="space-y-1.5">
            <label
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                disabled && 'opacity-50 cursor-not-allowed',
                settings.relocateAll
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              )}
            >
              <input
                type="radio"
                name="product-mode"
                checked={settings.relocateAll}
                onChange={() => handleModeChange(true)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  settings.relocateAll
                    ? 'border-green-500 bg-green-500'
                    : 'border-white/40'
                )}
              >
                {settings.relocateAll && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-xs text-white/80">
                전체 제품 ({products.length}개)
              </span>
            </label>

            <label
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                disabled && 'opacity-50 cursor-not-allowed',
                !settings.relocateAll
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              )}
            >
              <input
                type="radio"
                name="product-mode"
                checked={!settings.relocateAll}
                onChange={() => handleModeChange(false)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  !settings.relocateAll
                    ? 'border-green-500 bg-green-500'
                    : 'border-white/40'
                )}
              >
                {!settings.relocateAll && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-xs text-white/80">선택한 제품만</span>
            </label>
          </div>

          {/* 제품 목록 (선택 모드일 때만) - 높이 축소 */}
          {!settings.relocateAll && (
            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category}>
                  <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {items.map((product) => {
                      const isSelected = settings.relocatableIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className={cn(
                            'flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all',
                            disabled && 'opacity-50 cursor-not-allowed',
                            isSelected
                              ? 'bg-green-500/15'
                              : 'hover:bg-white/5'
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleProduct(product.id);
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
                              'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-white/40'
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <ShoppingBag className="h-3 w-3 text-white/40 flex-shrink-0" />
                          <span className="text-xs text-white/70 truncate">
                            {product.product_name || product.sku}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                checked={settings.respectDisplayType}
                onChange={(e) =>
                  handleConstraintChange('respectDisplayType', e.target.checked)
                }
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/40 text-green-600 focus:ring-green-500 bg-white/10"
              />
              <span className="text-xs text-white/70">진열 타입 호환성 유지</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="checkbox"
                checked={settings.keepCategory}
                onChange={(e) =>
                  handleConstraintChange('keepCategory', e.target.checked)
                }
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/40 text-green-600 focus:ring-green-500 bg-white/10"
              />
              <span className="text-xs text-white/70">카테고리별 구역 유지</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductSelector;
