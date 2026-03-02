/**
 * StoreTypeSelector.tsx
 *
 * Onboarding 2.0 -- Step 1: Store Type Selection
 * - Visual card grid with icons and Korean labels
 * - Sample metric preview on selection
 * - Glassmorphism dark theme
 * - Keyboard accessible (radiogroup pattern with arrow keys)
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Coffee,
  Home,
  Store,
  Check,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  type StoreType,
  type StoreTypeOption,
  STORE_TYPE_OPTIONS,
} from '@/store/useOnboardingStore';

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Sparkles,
  Coffee,
  Home,
  Store,
};

// ============================================================================
// Props
// ============================================================================

interface StoreTypeSelectorProps {
  selectedType: StoreType;
  onSelect: (type: StoreType) => void;
  onNext: () => void;
}

// ============================================================================
// Mini Metric Card (preview)
// ============================================================================

function MiniMetricCard({
  label,
  value,
  change,
  suffix,
}: {
  label: string;
  value: string;
  change: number;
  suffix?: string;
}) {
  const isPositive = change >= 0;

  return (
    <div
      className="flex-1 rounded-xl px-3 py-3 text-center min-w-0"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-xs text-white/50 mb-1 truncate">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums">
        {value}
        {suffix && <span className="text-xs text-white/40 ml-0.5">{suffix}</span>}
      </p>
      <div className="flex items-center justify-center gap-1 mt-1">
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-rose-400" />
        )}
        <span
          className={`text-xs font-medium tabular-nums ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {change}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Store Type Card
// ============================================================================

function StoreTypeCard({
  option,
  isSelected,
  onSelect,
  index,
}: {
  option: StoreTypeOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const Icon = ICON_MAP[option.icon] || Store;

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${option.labelKo} (${option.label})`}
      tabIndex={0}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="relative flex flex-col items-center gap-2 rounded-xl px-4 py-5 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        background: isSelected
          ? 'rgba(6,182,212,0.08)'
          : 'rgba(255,255,255,0.03)',
        border: isSelected
          ? '2px solid rgba(6,182,212,0.7)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isSelected
          ? '0 0 20px rgba(6,182,212,0.15), 0 0 40px rgba(6,182,212,0.05)'
          : 'none',
        backdropFilter: isSelected ? 'blur(12px)' : 'blur(4px)',
      }}
    >
      {/* Selected checkmark */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(6,182,212,0.9)',
            }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-1"
        style={{
          background: isSelected
            ? 'rgba(6,182,212,0.15)'
            : 'rgba(255,255,255,0.06)',
          border: isSelected
            ? '1px solid rgba(6,182,212,0.3)'
            : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{
            color: isSelected ? '#06b6d4' : 'rgba(255,255,255,0.5)',
          }}
        />
      </div>

      {/* Labels */}
      <span
        className="text-sm font-semibold"
        style={{
          color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
        }}
      >
        {option.labelKo}
      </span>
      <span
        className="text-xs"
        style={{
          color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)',
        }}
      >
        {option.description}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StoreTypeSelector({
  selectedType,
  onSelect,
  onNext,
}: StoreTypeSelectorProps) {
  const selectedOption = STORE_TYPE_OPTIONS.find((o) => o.id === selectedType);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = STORE_TYPE_OPTIONS.findIndex((o) => o.id === selectedType);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % STORE_TYPE_OPTIONS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex =
          (currentIndex - 1 + STORE_TYPE_OPTIONS.length) % STORE_TYPE_OPTIONS.length;
      }

      if (nextIndex !== currentIndex) {
        onSelect(STORE_TYPE_OPTIONS[nextIndex].id);
      }
    },
    [selectedType, onSelect],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          어떤 매장을 운영하시나요?
        </h2>
        <p className="text-sm text-white/50">
          선택하시면 맞춤 미리보기를 보여드립니다.
        </p>
      </div>

      {/* Store type cards grid */}
      <div
        role="radiogroup"
        aria-label="매장 유형 선택"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {STORE_TYPE_OPTIONS.map((option, index) => (
          <StoreTypeCard
            key={option.id}
            option={option}
            isSelected={selectedType === option.id}
            onSelect={() => onSelect(option.id)}
            index={index}
          />
        ))}
      </div>

      {/* Sample data preview */}
      <AnimatePresence mode="wait">
        {selectedOption && (
          <motion.div
            key={selectedOption.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {/* Mini metrics row */}
            <div className="flex gap-2">
              <MiniMetricCard
                label="방문자"
                value={selectedOption.sampleMetrics.visitors.toLocaleString()}
                change={selectedOption.sampleMetrics.visitorsChange}
              />
              <MiniMetricCard
                label="체류시간"
                value={selectedOption.sampleMetrics.dwell}
                change={selectedOption.sampleMetrics.dwellChange}
              />
              <MiniMetricCard
                label="전환율"
                value={`${selectedOption.sampleMetrics.conversion}`}
                change={selectedOption.sampleMetrics.conversionChange}
                suffix="%"
              />
            </div>

            {/* Explanatory text */}
            <p className="text-xs text-white/40 text-center">
              {selectedOption.labelKo} 매장 대시보드의 샘플 데이터입니다.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      <motion.button
        type="button"
        onClick={onNext}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          background:
            'linear-gradient(145deg, rgba(6,182,212,0.9) 0%, rgba(6,182,212,0.7) 100%)',
          border: '1px solid rgba(6,182,212,0.5)',
          color: '#ffffff',
          boxShadow:
            '0 4px 16px rgba(6,182,212,0.25), 0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        다음: 매장 이름 입력
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

export default StoreTypeSelector;
