/**
 * OnboardingFlow.tsx
 *
 * Onboarding 2.0 — 2단계 간소화 온보딩 플로우
 *
 * Step 1: 매장 유형 선택 (비주얼 카드) + 미리보기 메트릭
 * Step 2: 매장 이름 입력 + "샘플 데이터로 시작하기"
 * Loading: 대시보드 설정 중 애니메이션 (2-3초)
 *
 * 디자인: Glassmorphism dark theme, purple-to-cyan gradient accents
 * 언어: Korean (한국어)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Coffee,
  Home,
  Store,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useOnboardingStore,
  STORE_TYPE_OPTIONS,
  type StoreType,
  type StoreTypeOption,
} from '@/store/useOnboardingStore';
import { useForceCompleteOnboarding } from '@/hooks/useOnboarding';

// ============================================================================
// Icon mapping
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Sparkles,
  Coffee,
  Home,
  Store,
};

// ============================================================================
// Sub-components
// ============================================================================

/** 매장 유형 카드 */
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${option.labelKo} (${option.label})`}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl p-4 text-center',
        'transition-all duration-200 cursor-pointer outline-none',
        'focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
        isSelected
          ? 'bg-white/10 backdrop-blur-lg border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,200,255,0.15)]'
          : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/8 hover:border-cyan-400/40 hover:shadow-[0_0_12px_rgba(0,200,255,0.08)]'
      )}
    >
      {/* 선택 체크마크 */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200',
          isSelected
            ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/30'
            : 'bg-white/5'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            isSelected ? 'text-cyan-300' : 'text-gray-400'
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            'font-medium text-sm transition-colors duration-200',
            isSelected ? 'text-white' : 'text-gray-300'
          )}
        >
          {option.labelKo}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
      </div>
    </motion.button>
  );
}

/** 미리보기 메트릭 카드 */
function PreviewMetric({
  label,
  value,
  change,
  unit,
  delay,
}: {
  label: string;
  value: string;
  change: number;
  unit?: string;
  delay: number;
}) {
  const isPositive = change >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 text-center"
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums">
        {value}
        {unit && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
      </p>
      <div
        className={cn(
          'flex items-center justify-center gap-1 text-xs mt-1',
          isPositive ? 'text-emerald-400' : 'text-rose-400'
        )}
      >
        <ChangeIcon className="w-3 h-3" />
        <span>
          {isPositive ? '+' : ''}
          {change}%
        </span>
      </div>
    </motion.div>
  );
}

/** 로딩 진행 상태 표시 */
function SetupProgress() {
  const [progress, setProgress] = useState(0);
  const steps = [
    { label: '매장 프로필 생성 중...', threshold: 25 },
    { label: '샘플 데이터 로딩 중...', threshold: 55 },
    { label: '대시보드 준비 중...', threshold: 85 },
    { label: '완료!', threshold: 100 },
  ];

  useEffect(() => {
    // 2.5초에 걸쳐 자연스러운 프로그레스 진행
    const timers: NodeJS.Timeout[] = [];
    const schedule = [
      { time: 200, value: 15 },
      { time: 600, value: 30 },
      { time: 1000, value: 55 },
      { time: 1500, value: 75 },
      { time: 2000, value: 90 },
      { time: 2400, value: 100 },
    ];

    schedule.forEach(({ time, value }) => {
      timers.push(setTimeout(() => setProgress(value), time));
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const currentStepIndex = steps.findIndex((s) => progress <= s.threshold);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* 스피너 */}
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 rounded-full border-2 border-white/10 border-t-cyan-400 border-r-purple-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white tabular-nums">
            {progress}%
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 단계 리스트 */}
      <div className="space-y-2 w-full max-w-xs">
        {steps.map((step, i) => {
          const isDone = i < activeStep || progress >= 100;
          const isActive = i === activeStep && progress < 100;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors duration-300',
                isDone
                  ? 'text-emerald-400'
                  : isActive
                    ? 'text-white'
                    : 'text-gray-500'
              )}
            >
              {isDone ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
              )}
              <span>{step.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function OnboardingFlow() {
  const navigate = useNavigate();
  const {
    step,
    storeType,
    storeName,
    isComplete,
    isLoading,
    error,
    setStoreType,
    setStoreName,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    setLoading,
    setError,
  } = useOnboardingStore();

  const forceComplete = useForceCompleteOnboarding();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState('');

  // Step 2로 진입 시 input focus
  useEffect(() => {
    if (step === 2 && !isComplete) {
      // 약간의 딜레이 후 focus (애니메이션 완료 대기)
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [step, isComplete]);

  // 이미 온보딩 완료된 경우 표시하지 않음
  if (isComplete) return null;

  // ============================================================================
  // 핸들러
  // ============================================================================

  const handleStoreTypeSelect = (type: StoreType) => {
    setStoreType(type);
  };

  const handleNext = () => {
    if (step === 1) {
      nextStep();
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = storeName.trim();
    if (trimmed.length < 2) {
      setNameError('매장 이름을 2자 이상 입력해주세요.');
      inputRef.current?.focus();
      return;
    }
    setNameError('');
    setLoading(true);
    nextStep(); // step -> 3 (loading)

    // 2.5초 대기 후 온보딩 완료 + 대시보드 이동
    setTimeout(() => {
      completeOnboarding();
      // Supabase onboarding_progress 테이블도 완료 처리 (best-effort)
      forceComplete.mutate(undefined, {
        onSettled: () => {
          navigate('/insights');
        },
      });
    }, 2700);
  };

  const handleSkip = () => {
    skipOnboarding();
    forceComplete.mutate(undefined, {
      onSettled: () => {
        navigate('/insights');
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 2) {
      handleSubmit();
    }
  };

  // 선택된 유형의 정보
  const selectedOption = STORE_TYPE_OPTIONS.find((o) => o.id === storeType);

  // ============================================================================
  // 렌더링
  // ============================================================================

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 백드롭: 블러 + 다크 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* 모달 컨테이너 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative w-full mx-4 overflow-hidden rounded-2xl',
          'bg-gray-900/90 backdrop-blur-xl border border-white/10',
          'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
          // 반응형: mobile 풀스크린, desktop 모달
          'max-w-[640px] max-h-[90vh] overflow-y-auto',
          'sm:mx-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 그라디언트 바 */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />

        <AnimatePresence mode="wait">
          {step === 3 ? (
            // ============================================================
            // Step 3: 로딩 (대시보드 설정 중)
            // ============================================================
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-8 sm:px-10"
            >
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  대시보드를 설정하고 있어요
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedOption?.labelKo} 매장에 맞는 샘플 데이터를 준비 중입니다
                </p>
              </div>
              <SetupProgress />
            </motion.div>
          ) : step === 2 ? (
            // ============================================================
            // Step 2: 매장 이름 입력
            // ============================================================
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 py-6 sm:px-10 sm:py-8"
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>이전</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label="온보딩 건너뛰기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 콘텐츠 */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-cyan-400 font-medium mb-1">
                    STEP 2 / 2
                  </p>
                  <h2 className="text-xl font-bold text-white">
                    거의 다 됐어요!
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    매장 이름을 입력해주세요
                  </p>
                </div>

                {/* 매장 이름 입력 */}
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="예: 강남 플래그십 스토어"
                    maxLength={50}
                    className={cn(
                      'w-full h-12 px-4 rounded-lg text-base text-white placeholder:text-gray-500',
                      'bg-white/5 backdrop-blur-md outline-none transition-all duration-200',
                      'focus:ring-0',
                      nameError
                        ? 'border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                        : 'border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,200,255,0.12)]'
                    )}
                  />
                  {nameError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-400 mt-1.5"
                    >
                      {nameError}
                    </motion.p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    대시보드에 표시되는 이름입니다. 설정에서 언제든 변경할 수
                    있어요.
                  </p>
                </div>

                {/* 선택한 유형 표시 */}
                {selectedOption && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    {(() => {
                      const Icon = ICON_MAP[selectedOption.icon] || Store;
                      return (
                        <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      );
                    })()}
                    <span className="text-sm text-gray-300">
                      {selectedOption.labelKo} 매장
                    </span>
                  </div>
                )}

                {/* 시작하기 버튼 */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 rounded-lg font-medium text-sm text-white',
                    'bg-gradient-to-r from-purple-600 to-cyan-600',
                    'hover:from-purple-500 hover:to-cyan-500',
                    'transition-all duration-200',
                    'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
                    'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      설정 중...
                    </>
                  ) : (
                    <>
                      샘플 데이터로 시작하기
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // ============================================================
            // Step 1: 매장 유형 선택
            // ============================================================
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 py-6 sm:px-10 sm:py-8"
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-cyan-400 font-medium mb-1">
                    STEP 1 / 2
                  </p>
                  <h2 className="text-xl font-bold text-white">
                    NeuralTwin에 오신 것을 환영합니다
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    어떤 유형의 매장을 운영하시나요?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-300 transition-colors mt-1"
                  aria-label="온보딩 건너뛰기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 매장 유형 카드 그리드 */}
              <div
                role="radiogroup"
                aria-label="매장 유형 선택"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
              >
                {STORE_TYPE_OPTIONS.map((option, i) => (
                  <StoreTypeCard
                    key={option.id}
                    option={option}
                    isSelected={storeType === option.id}
                    onSelect={() => handleStoreTypeSelect(option.id)}
                    index={i}
                  />
                ))}
              </div>

              {/* 미리보기 메트릭 */}
              {selectedOption && (
                <motion.div
                  key={storeType}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  {/* 미리보기 카드 */}
                  <div className="grid grid-cols-3 gap-3">
                    <PreviewMetric
                      label="방문자"
                      value={selectedOption.sampleMetrics.visitors.toLocaleString('ko-KR')}
                      change={selectedOption.sampleMetrics.visitorsChange}
                      delay={0.15}
                    />
                    <PreviewMetric
                      label="체류 시간"
                      value={selectedOption.sampleMetrics.dwell}
                      change={selectedOption.sampleMetrics.dwellChange}
                      delay={0.25}
                    />
                    <PreviewMetric
                      label="전환율"
                      value={`${selectedOption.sampleMetrics.conversion}`}
                      unit="%"
                      change={selectedOption.sampleMetrics.conversionChange}
                      delay={0.35}
                    />
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    {selectedOption.labelKo} 매장 대시보드 미리보기입니다
                  </p>
                </motion.div>
              )}

              {/* 다음 버튼 */}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className={cn(
                  'w-full h-12 mt-6 rounded-lg font-medium text-sm text-white',
                  'bg-gradient-to-r from-purple-600 to-cyan-600',
                  'hover:from-purple-500 hover:to-cyan-500',
                  'transition-all duration-200',
                  'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
                  'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
                  'flex items-center justify-center gap-2'
                )}
              >
                다음: 매장 이름 입력
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default OnboardingFlow;
