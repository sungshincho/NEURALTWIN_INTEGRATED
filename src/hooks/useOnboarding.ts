/**
 * useOnboarding.ts
 * 
 * Customer Dashboard 온보딩 시스템 Hook
 * - 7단계 온보딩 프로세스 관리
 * - 샘플 데이터 템플릿 적용
 * - 빠른 시작 가이드 표시
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// 타입 정의
// ============================================================================

export interface OnboardingProgress {
  id: string;
  org_id: string;
  user_id: string;
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  skipped_steps: number[];
  steps_status: Record<string, StepStatus>;
  selected_template: string | null;
  business_type: string | null;
  store_count: number | null;
  primary_goals: string[] | null;
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
}

export interface SampleDataTemplate {
  id: string;
  template_name: string;
  template_type: string;
  display_name: string;
  description: string | null;
  preview_image_url: string | null;
  estimated_setup_minutes: number;
  is_active: boolean;
  sort_order: number;
}

export interface QuickstartGuide {
  id: string;
  guide_key: string;
  title: string;
  description: string | null;
  target_page: string;
  target_role: string[];
  steps: QuickstartStep[];
  auto_show: boolean;
  show_once: boolean;
  priority: number;
}

export interface QuickstartStep {
  step: number;
  title: string;
  description: string;
  target_selector?: string;
  action_type?: 'click' | 'input' | 'navigate' | 'wait';
  highlight?: boolean;
}

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// 온보딩 단계 정의
export const ONBOARDING_STEPS = [
  { step: 1, key: '1_account_setup', title: '계정 설정', description: '기본 정보를 입력해주세요', icon: 'User', estimatedMinutes: 1 },
  { step: 2, key: '2_store_creation', title: '매장 등록', description: '분석할 매장을 등록해주세요', icon: 'Store', estimatedMinutes: 2 },
  { step: 3, key: '3_data_source', title: '데이터 연결', description: 'POS 또는 CSV 데이터를 연결해주세요', icon: 'Database', estimatedMinutes: 3 },
  { step: 4, key: '4_sample_data', title: '샘플 데이터', description: '샘플 데이터로 빠르게 시작해보세요', icon: 'FileSpreadsheet', estimatedMinutes: 1 },
  { step: 5, key: '5_first_dashboard', title: '대시보드 확인', description: '첫 대시보드를 확인해보세요', icon: 'LayoutDashboard', estimatedMinutes: 1 },
  { step: 6, key: '6_first_simulation', title: 'AI 시뮬레이션', description: '첫 AI 추천을 받아보세요', icon: 'Sparkles', estimatedMinutes: 2 },
  { step: 7, key: '7_completion', title: '완료', description: '온보딩이 완료되었습니다!', icon: 'CheckCircle', estimatedMinutes: 0 },
] as const;

// ============================================================================
// 온보딩 진행 상태 조회
// ============================================================================

export function useOnboardingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (error && error.code !== 'PGRST116') throw error;
      return data as OnboardingProgress | null;
    },
    enabled: !!user?.id,
  });
}

// ============================================================================
// 온보딩 초기화 (첫 로그인 시)
// ============================================================================

export function useInitializeOnboarding() {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !orgId) throw new Error('User not authenticated');

      // 이미 온보딩이 있는지 확인
      const { data: existing } = await (supabase
        .from('onboarding_progress' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (existing) return existing;

      // 새 온보딩 생성
      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .insert({
          org_id: orgId,
          user_id: user.id,
          current_step: 1,
          total_steps: 7,
          completed_steps: [],
          skipped_steps: [],
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
    onError: (error) => {
      console.error('온보딩 초기화 실패:', error);
    },
  });
}

// ============================================================================
// 온보딩 단계 완료
// ============================================================================

export function useCompleteOnboardingStep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (step: number) => {
      if (!user?.id) throw new Error('User not authenticated');

      // 현재 진행 상태 조회
      const { data: progress, error: fetchError } = await (supabase
        .from('onboarding_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .single() as any);

      if (fetchError) throw fetchError;

      const completedSteps = [...(progress.completed_steps || [])];
      if (!completedSteps.includes(step)) {
        completedSteps.push(step);
      }

      const stepKey = ONBOARDING_STEPS.find(s => s.step === step)?.key;
      const stepsStatus = { ...progress.steps_status };
      if (stepKey) {
        stepsStatus[stepKey] = 'completed';
      }

      // 다음 단계로 이동
      const nextStep = Math.min(step + 1, 7);
      const nextStepKey = ONBOARDING_STEPS.find(s => s.step === nextStep)?.key;
      if (nextStepKey && stepsStatus[nextStepKey] === 'pending') {
        stepsStatus[nextStepKey] = 'in_progress';
      }

      const isComplete = completedSteps.length >= 6; // 7단계 제외

      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .update({
          current_step: nextStep,
          completed_steps: completedSteps,
          steps_status: stepsStatus,
          completed_at: isComplete ? new Date().toISOString() : null,
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: (data, step) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      
      const stepConfig = ONBOARDING_STEPS.find(s => s.step === step);
      if (stepConfig && step < 7) {
        toast({
          title: `${stepConfig.title} 완료!`,
          description: '다음 단계로 진행합니다.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: '오류 발생',
        description: '단계 완료 처리 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 온보딩 단계 건너뛰기
// ============================================================================

export function useSkipOnboardingStep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: number) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: progress } = await (supabase
        .from('onboarding_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .single() as any);

      if (!progress) throw new Error('Onboarding not found');

      const skippedSteps = [...(progress.skipped_steps || [])];
      if (!skippedSteps.includes(step)) {
        skippedSteps.push(step);
      }

      const stepKey = ONBOARDING_STEPS.find(s => s.step === step)?.key;
      const stepsStatus = { ...progress.steps_status };
      if (stepKey) {
        stepsStatus[stepKey] = 'skipped';
      }

      const nextStep = Math.min(step + 1, 7);

      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .update({
          current_step: nextStep,
          skipped_steps: skippedSteps,
          steps_status: stepsStatus,
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });
}

// ============================================================================
// 샘플 데이터 템플릿 조회
// ============================================================================

export function useSampleDataTemplates() {
  return useQuery({
    queryKey: ['sample-data-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('sample_data_templates' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }) as any);

      if (error) throw error;
      return data as SampleDataTemplate[];
    },
  });
}

// ============================================================================
// 샘플 데이터 적용
// ============================================================================

export function useApplySampleData() {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ templateId, storeId }: { templateId: string; storeId: string }) => {
      if (!user?.id || !orgId) throw new Error('User not authenticated');

      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('apply-sample-data', {
        body: {
          templateId,
          storeId,
          orgId,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      
      toast({
        title: '샘플 데이터 적용 완료!',
        description: `${data.template} 템플릿이 적용되었습니다. 대시보드에서 확인해보세요.`,
      });
    },
    onError: (error) => {
      toast({
        title: '샘플 데이터 적용 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 빠른 시작 가이드 조회
// ============================================================================

export function useQuickstartGuides() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ['quickstart-guides', role],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('quickstart_guides' as any)
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false }) as any);

      if (error) throw error;
      
      // 현재 역할에 해당하는 가이드만 필터링
      return (data as QuickstartGuide[]).filter(guide => 
        !role || guide.target_role.includes(role)
      );
    },
    enabled: !!role,
  });
}

// ============================================================================
// 현재 페이지에 맞는 가이드 조회
// ============================================================================

export function useActiveGuide(currentPath: string) {
  const { user, role } = useAuth();
  const { data: guides = [] } = useQuickstartGuides();
  const { data: completions = [] } = useGuideCompletions();

  // 현재 페이지에 맞는 가이드 찾기
  const activeGuide = guides.find(guide => {
    // 페이지 매칭
    if (!currentPath.startsWith(guide.target_page)) return false;
    
    // 역할 매칭
    if (role && !guide.target_role.includes(role)) return false;
    
    // 이미 완료한 가이드 제외 (show_once인 경우)
    if (guide.show_once && completions.some(c => c.guide_key === guide.guide_key)) {
      return false;
    }
    
    return true;
  });

  return activeGuide || null;
}

// ============================================================================
// 가이드 완료 기록 조회
// ============================================================================

export function useGuideCompletions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guide-completions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('user_guide_completions' as any)
        .select('*')
        .eq('user_id', user.id) as any);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// ============================================================================
// 가이드 완료 기록
// ============================================================================

export function useCompleteGuide() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guideKey: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase
        .from('user_guide_completions' as any)
        .upsert({
          user_id: user.id,
          guide_key: guideKey,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,guide_key',
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-completions'] });
    },
  });
}

// ============================================================================
// 온보딩 완료 여부 확인
// ============================================================================

export function useIsOnboardingComplete() {
  const { data: progress, isLoading } = useOnboardingProgress();
  
  return {
    isComplete: progress?.completed_at !== null,
    isLoading,
    progress,
  };
}

// ============================================================================
// 온보딩 강제 완료 (건너뛰기)
// ============================================================================

export function useForceCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .update({
          current_step: 7,
          completed_at: new Date().toISOString(),
          steps_status: {
            '1_account_setup': 'skipped',
            '2_store_creation': 'skipped',
            '3_data_source': 'skipped',
            '4_sample_data': 'skipped',
            '5_first_dashboard': 'skipped',
            '6_first_simulation': 'skipped',
            '7_completion': 'completed',
          },
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast({
        title: '온보딩 건너뛰기',
        description: '언제든 설정에서 온보딩을 다시 시작할 수 있습니다.',
      });
    },
  });
}

// ============================================================================
// 온보딩 재시작
// ============================================================================

export function useRestartOnboarding() {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !orgId) throw new Error('User not authenticated');

      const { data, error } = await (supabase
        .from('onboarding_progress' as any)
        .update({
          current_step: 1,
          completed_steps: [],
          skipped_steps: [],
          completed_at: null,
          steps_status: {
            '1_account_setup': 'in_progress',
            '2_store_creation': 'pending',
            '3_data_source': 'pending',
            '4_sample_data': 'pending',
            '5_first_dashboard': 'pending',
            '6_first_simulation': 'pending',
            '7_completion': 'pending',
          },
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });
}
