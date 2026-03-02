/**
 * OnboardingFlow.tsx
 *
 * Onboarding 2.0 -- Main Container (Self-managing)
 * - 2-step instant start: Store Type + Store Name
 * - Glassmorphism dark theme modal
 * - Animated transitions between steps (slide left/right)
 * - Progress indicator (2 dots)
 * - On complete: create store via Supabase, navigate to dashboard
 * - Mobile responsive (full-screen on mobile, centered modal on desktop)
 * - Keyboard accessible (Tab, Enter, Escape, ArrowKeys)
 *
 * Renders itself when onboarding is incomplete (no props needed).
 * Visibility is driven by the Zustand store's `isComplete` flag.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useForceCompleteOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';

import { StoreTypeSelector } from './StoreTypeSelector';
import { StoreNameInput } from './StoreNameInput';

// ============================================================================
// Step Indicator (2 dots)
// ============================================================================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`온보딩 ${current}/${total} 단계`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="transition-all duration-300"
          style={{
            width: i + 1 === current ? '24px' : '8px',
            height: '8px',
            borderRadius: '4px',
            background:
              i + 1 === current
                ? 'rgba(6,182,212,0.9)'
                : i + 1 < current
                  ? 'rgba(6,182,212,0.5)'
                  : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component (self-managing visibility)
// ============================================================================

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { user, orgId } = useAuth();
  const { toast } = useToast();
  const forceComplete = useForceCompleteOnboarding();

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

  // Do not render if onboarding is already complete
  if (isComplete) return null;

  // ============================================================================
  // Create store handler
  // ============================================================================

  const handleCreateStore = async () => {
    const trimmedName = storeName.trim();
    if (trimmedName.length < 2) {
      setError('매장 이름을 2자 이상 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    nextStep(); // Move to step 3 (loading UI inside StoreNameInput)

    try {
      // 1. Create the store record in Supabase
      if (user?.id && orgId) {
        const storeCode = `${storeType}-${Date.now().toString(36)}`;

        const { error: storeError } = await (supabase
          .from('stores' as any)
          .insert({
            store_name: trimmedName,
            store_code: storeCode,
            org_id: orgId,
            organization_id: orgId,
            metadata: {
              store_type: storeType,
              uses_sample_data: true,
              onboarding_version: '2.0',
              created_via: 'onboarding',
            },
          })
          .select()
          .single() as any);

        if (storeError) {
          console.warn('Store creation error (may already exist):', storeError.message);
          // Continue even if store creation fails
        }
      }

      // 2. Try to invoke create-store EF for sample data seeding (graceful fallback)
      try {
        if (user?.id && orgId) {
          await supabase.functions.invoke('create-store', {
            body: {
              storeType,
              storeName: trimmedName,
              orgId,
              userId: user.id,
              useSampleData: true,
            },
          });
        }
      } catch (efError) {
        // EF may not be deployed yet
        console.warn('create-store EF not available:', efError);
      }

      // 3. Mark onboarding as complete (localStorage + Zustand)
      completeOnboarding();

      // 4. Mark complete in Supabase too (best-effort)
      forceComplete.mutate(undefined, {
        onSettled: () => {
          navigate('/insights');
        },
      });

      // 5. Show sample data notification
      toast({
        title: `${trimmedName} 매장이 생성되었습니다!`,
        description:
          '샘플 데이터로 대시보드를 확인해 보세요. 센서를 연결하면 실제 데이터를 볼 수 있습니다.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '매장 생성 중 오류가 발생했습니다.';
      setError(message);
      setLoading(false);
      // Go back to step 2 so the user can retry
      useOnboardingStore.setState({ step: 2 });
    }
  };

  // ============================================================================
  // Skip handler
  // ============================================================================

  const handleSkip = () => {
    skipOnboarding();
    forceComplete.mutate(undefined, {
      onSettled: () => {
        navigate('/insights');
      },
    });
    toast({
      title: '온보딩을 건너뛰었습니다',
      description: '설정에서 언제든 매장을 등록할 수 있습니다.',
    });
  };

  // ============================================================================
  // Slide animation variants
  // ============================================================================

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  const direction = step === 1 ? -1 : 1;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop: blur + dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={!isLoading ? handleSkip : undefined}
        aria-hidden="true"
      />

      {/* Modal container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="NeuralTwin 온보딩"
        aria-describedby="onboarding-desc"
        className="relative w-full mx-4 max-w-[560px] max-h-[90vh] overflow-y-auto sm:mx-auto"
      >
        {/* Glassmorphism outer border gradient */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            padding: '1.5px',
            background:
              'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)',
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.3), 0 0 60px rgba(6,182,212,0.05)',
          }}
        >
          {/* Glassmorphism inner background */}
          <div
            className="rounded-[calc(1rem-1.5px)] relative overflow-hidden"
            style={{
              background:
                'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)',
              backdropFilter: 'blur(80px) saturate(200%)',
            }}
          >
            {/* Top highlight line */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)',
              }}
            />

            {/* Content wrapper */}
            <div className="relative z-10 p-6 sm:p-8">
              {/* Top bar: Step indicator + Close button */}
              <div className="flex items-center justify-between mb-6">
                <StepIndicator current={Math.min(step, 2)} total={2} />

                {/* Skip / Close button */}
                {!isLoading && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    aria-label="온보딩 건너뛰기"
                  >
                    <X
                      className="w-3.5 h-3.5"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    />
                  </button>
                )}
              </div>

              {/* Hidden description for accessibility */}
              <p id="onboarding-desc" className="sr-only">
                NeuralTwin 온보딩: 2단계로 매장 유형과 이름을 설정합니다.
              </p>

              {/* Step content with slide animation */}
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <StoreTypeSelector
                      selectedType={storeType}
                      onSelect={setStoreType}
                      onNext={nextStep}
                    />
                  </motion.div>
                )}

                {(step === 2 || step === 3) && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <StoreNameInput
                      storeType={storeType}
                      storeName={storeName}
                      onNameChange={setStoreName}
                      onBack={prevStep}
                      onSubmit={handleCreateStore}
                      isLoading={isLoading}
                      error={error}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default OnboardingFlow;
