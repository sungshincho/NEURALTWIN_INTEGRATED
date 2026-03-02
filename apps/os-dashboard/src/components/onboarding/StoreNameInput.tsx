/**
 * StoreNameInput.tsx
 *
 * Onboarding 2.0 -- Step 2: Store Name Input
 * - Single text input with glassmorphism styling
 * - Validation: min 2 characters
 * - "Start with Sample Data" CTA button
 * - Back navigation to Step 1
 * - Loading state with step-by-step progress
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Loader2,
  Rocket,
  AlertCircle,
} from 'lucide-react';

import {
  type StoreType,
  STORE_TYPE_OPTIONS,
} from '@/store/useOnboardingStore';

// ============================================================================
// Props
// ============================================================================

interface StoreNameInputProps {
  storeType: StoreType;
  storeName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Placeholder map per store type
// ============================================================================

const PLACEHOLDER_MAP: Record<StoreType, string> = {
  fashion: '예: 강남 플래그십 스토어',
  beauty: '예: 성수 뷰티 스토어',
  fnb: '예: 홍대 카페',
  lifestyle: '예: 한남 리빙 스토어',
  other: '예: 내 매장 이름',
};

// ============================================================================
// Loading step messages
// ============================================================================

const LOADING_STEPS = [
  { label: '매장 프로필 생성 중...', delay: 0 },
  { label: '샘플 데이터 로딩 중...', delay: 800 },
  { label: '대시보드 준비 중...', delay: 1600 },
];

// ============================================================================
// Main Component
// ============================================================================

export function StoreNameInput({
  storeType,
  storeName,
  onNameChange,
  onBack,
  onSubmit,
  isLoading,
  error,
}: StoreNameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const isValid = storeName.trim().length >= 2;
  const showError = touched && !isValid && storeName.length > 0;

  // Focus input on mount (with delay for slide animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Loading step progression
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEPS.forEach((step, index) => {
      timers.push(
        setTimeout(() => {
          setLoadingStep(index);
        }, step.delay),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const handleSubmit = () => {
    setTouched(true);
    if (isValid && !isLoading) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          aria-label="이전 단계로"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div>
          <h2 className="text-xl font-bold text-white">거의 다 됐어요!</h2>
          <p className="text-sm text-white/50">매장 이름을 입력해 주세요</p>
        </div>
      </div>

      {/* Input field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="store-name" className="text-xs font-medium text-white/40">
          매장 이름
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="store-name"
            type="text"
            value={storeName}
            onChange={(e) => {
              onNameChange(e.target.value);
              if (!touched) setTouched(true);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={PLACEHOLDER_MAP[storeType]}
            maxLength={50}
            autoComplete="off"
            className={`w-full h-12 rounded-xl px-4 text-base font-medium transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              showError ? 'animate-shake' : ''
            }`}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: showError
                ? '2px solid rgba(244,63,94,0.6)'
                : '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              boxShadow: showError
                ? '0 0 12px rgba(244,63,94,0.15)'
                : 'inset 0 1px 1px rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Character count */}
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {storeName.length}/50
          </span>
        </div>

        {/* Validation error */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs text-rose-400">
                최소 2자 이상 입력해 주세요
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backend error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2"
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.2)',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-400">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper text */}
        <p className="text-xs text-white/30">
          대시보드에 표시되는 이름입니다. 설정에서 언제든 변경할 수 있습니다.
        </p>
      </div>

      {/* Submit button / Loading state */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3 rounded-xl px-4 py-5"
            style={{
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.15)',
            }}
          >
            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm font-medium text-white">
                대시보드를 설정하고 있습니다...
              </span>
            </div>

            {/* Loading steps */}
            <div className="flex flex-col gap-2 pl-8">
              {LOADING_STEPS.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: index <= loadingStep ? 1 : 0.3,
                  }}
                  className="flex items-center gap-2"
                >
                  {index < loadingStep ? (
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(6,182,212,0.8)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1 4L3 6L7 2"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : index === loadingStep ? (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : (
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                  <span
                    className="text-xs"
                    style={{
                      color:
                        index <= loadingStep
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileHover={isValid ? { scale: 1.01 } : {}}
            whileTap={isValid ? { scale: 0.99 } : {}}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isValid
                ? 'linear-gradient(145deg, rgba(6,182,212,0.9) 0%, rgba(6,182,212,0.7) 100%)'
                : 'rgba(255,255,255,0.06)',
              border: isValid
                ? '1px solid rgba(6,182,212,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              color: isValid ? '#ffffff' : 'rgba(255,255,255,0.3)',
              boxShadow: isValid
                ? '0 4px 16px rgba(6,182,212,0.25), 0 2px 4px rgba(0,0,0,0.2)'
                : 'none',
            }}
          >
            <Rocket className="w-4 h-4" />
            샘플 데이터로 시작하기
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoreNameInput;
