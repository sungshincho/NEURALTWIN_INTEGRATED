/**
 * OnboardingWizard.tsx
 * 
 * Customer Dashboard 온보딩 마법사 컴포넌트
 * - 첫 로그인 시 자동 표시
 * - 7단계 가이드
 * - 샘플 템플릿 선택
 * - 5분 안에 첫 대시보드 확인
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Store, 
  Database, 
  FileSpreadsheet, 
  LayoutDashboard, 
  Sparkles, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Loader2,
  ShoppingBag,
  Palette,
  Coffee,
  Package,
} from 'lucide-react';

import {
  useOnboardingProgress,
  useInitializeOnboarding,
  useCompleteOnboardingStep,
  useSkipOnboardingStep,
  useSampleDataTemplates,
  useApplySampleData,
  useForceCompleteOnboarding,
  ONBOARDING_STEPS,
  type SampleDataTemplate,
} from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';

// ============================================================================
// 아이콘 매핑
// ============================================================================

const STEP_ICONS: Record<string, React.ElementType> = {
  User,
  Store,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Sparkles,
  CheckCircle,
};

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  fashion: ShoppingBag,
  beauty: Palette,
  grocery: Package,
  restaurant: Coffee,
  general: Store,
};

// ============================================================================
// Props
// ============================================================================

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { user, orgName } = useAuth();
  const { selectedStore } = useSelectedStore();
  
  // Hooks
  const { data: progress, isLoading: isLoadingProgress } = useOnboardingProgress();
  const { data: templates = [] } = useSampleDataTemplates();
  const initializeOnboarding = useInitializeOnboarding();
  const completeStep = useCompleteOnboardingStep();
  const skipStep = useSkipOnboardingStep();
  const applyTemplate = useApplySampleData();
  const forceComplete = useForceCompleteOnboarding();
  
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // 온보딩 초기화 (없으면 생성)
  useEffect(() => {
    if (open && user && !progress && !isLoadingProgress) {
      initializeOnboarding.mutate();
    }
  }, [open, user, progress, isLoadingProgress]);

  // 현재 단계
  const currentStep = progress?.current_step || 1;
  const progressPercent = ((currentStep - 1) / 7) * 100;
  const currentStepConfig = ONBOARDING_STEPS.find(s => s.step === currentStep);
  const StepIcon = currentStepConfig ? STEP_ICONS[currentStepConfig.icon] : User;

  // ============================================================================
  // 핸들러
  // ============================================================================

  const handleNext = () => {
    completeStep.mutate(currentStep);
  };

  const handleSkip = () => {
    skipStep.mutate(currentStep);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedStore?.id) return;
    
    setIsApplying(true);
    try {
      await applyTemplate.mutateAsync({
        templateId: selectedTemplate,
        storeId: selectedStore.id,
      });
      // 샘플 데이터 적용 성공 후 다음 단계로
      completeStep.mutate(4);
    } catch (error) {
      console.error('Template apply error:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    navigate('/overview/dashboard');
  };

  const handleForceSkip = () => {
    forceComplete.mutate();
    onOpenChange(false);
  };

  // ============================================================================
  // 단계별 콘텐츠 렌더링
  // ============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // 계정 설정
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <User className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <h3 className="font-medium mb-1">안녕하세요, {user?.email}님!</h3>
              <p className="text-sm text-muted-foreground">
                {orgName ? `${orgName}에서` : ''} NEURALTWIN을 시작해볼까요?
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>예상 소요 시간: 약 5분</span>
            </div>
          </div>
        );

      case 2: // 매장 등록
        return (
          <div className="space-y-4">
            {selectedStore ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{selectedStore.store_name}</p>
                    <p className="text-sm text-green-600">매장이 이미 등록되어 있습니다</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  아직 등록된 매장이 없습니다. 매장 관리에서 매장을 먼저 등록해주세요.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/overview/stores');
                  }}
                >
                  매장 등록하러 가기
                </Button>
              </div>
            )}
          </div>
        );

      case 3: // 데이터 연결
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              POS 시스템을 연결하거나 CSV 파일을 업로드하세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/data-management/api');
                    }}>
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium text-sm">POS 연결</p>
                  <p className="text-xs text-muted-foreground">Square, Shopify 등</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/data-management/import');
                    }}>
                <CardContent className="p-4 text-center">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium text-sm">CSV 업로드</p>
                  <p className="text-xs text-muted-foreground">엑셀, CSV 파일</p>
                </CardContent>
              </Card>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>팁:</strong> 아래에서 샘플 데이터를 먼저 적용하면 바로 체험해볼 수 있어요!
              </p>
            </div>
          </div>
        );

      case 4: // 샘플 데이터
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              업종에 맞는 샘플 데이터로 빠르게 시작해보세요.
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {templates.map((template) => {
                const TemplateIcon = TEMPLATE_ICONS[template.template_type] || Store;
                const isSelected = selectedTemplate === template.id;
                
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-muted'}`}>
                          <TemplateIcon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{template.display_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {template.estimated_setup_minutes}분
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {selectedTemplate && selectedStore && (
              <Button 
                className="w-full"
                onClick={handleApplyTemplate}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    적용 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    이 템플릿으로 시작하기
                  </>
                )}
              </Button>
            )}
            
            {!selectedStore && (
              <p className="text-sm text-yellow-600 text-center">
                ⚠️ 먼저 매장을 등록해주세요
              </p>
            )}
          </div>
        );

      case 5: // 대시보드 확인
        return (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg">
              <LayoutDashboard className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="font-medium mb-2">대시보드 준비 완료!</h3>
              <p className="text-sm text-muted-foreground">
                매출, 방문자, 전환율 등 주요 KPI를 확인할 수 있습니다.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                completeStep.mutate(5);
                onOpenChange(false);
                navigate('/overview/dashboard');
              }}
            >
              대시보드 바로가기
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        );

      case 6: // AI 시뮬레이션
        return (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-gradient-to-b from-purple-50 to-white rounded-lg">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-600" />
              <h3 className="font-medium mb-2">AI 추천을 받아보세요!</h3>
              <p className="text-sm text-muted-foreground">
                레이아웃, 가격, 재고 최적화 등 AI가 분석한 추천을 확인하세요.
              </p>
            </div>
            <Button 
              onClick={() => {
                completeStep.mutate(6);
                onOpenChange(false);
                navigate('/simulation/hub');
              }}
            >
              AI 시뮬레이션 시작
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 7: // 완료
        return (
          <div className="space-y-4 text-center">
            <div className="p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">축하합니다!</h3>
              <p className="text-muted-foreground">
                NEURALTWIN 설정이 완료되었습니다.<br />
                이제 매장 분석을 시작할 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => navigate('/overview/dashboard')}>
                대시보드
              </Button>
              <Button onClick={handleComplete}>
                시작하기
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // 렌더링
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                {currentStep === 7 ? '온보딩 완료' : 'NEURALTWIN 시작하기'}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleForceSkip}
              >
                건너뛰기
              </Button>
            </div>
            {currentStep < 7 && (
              <DialogDescription>
                5분 만에 첫 대시보드를 확인하세요
              </DialogDescription>
            )}
          </DialogHeader>

          {/* 진행률 */}
          {currentStep < 7 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {currentStep}/7 단계
                </span>
                <span className="text-sm font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              
              {/* 단계 인디케이터 */}
              <div className="flex justify-between mt-4 px-2">
                {ONBOARDING_STEPS.map((step) => {
                  const Icon = STEP_ICONS[step.icon];
                  const isCompleted = progress?.completed_steps?.includes(step.step);
                  const isSkipped = progress?.skipped_steps?.includes(step.step);
                  const isCurrent = step.step === currentStep;
                  
                  return (
                    <div
                      key={step.step}
                      className={`flex flex-col items-center ${
                        isCompleted ? 'text-green-600' :
                        isSkipped ? 'text-gray-400' :
                        isCurrent ? 'text-blue-600' :
                        'text-gray-300'
                      }`}
                      title={step.title}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted ? 'bg-green-100' :
                        isSkipped ? 'bg-gray-100' :
                        isCurrent ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* 단계 제목 */}
              {currentStep < 7 && currentStepConfig && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <StepIcon className="h-5 w-5 text-blue-600" />
                    {currentStepConfig.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStepConfig.description}
                  </p>
                </div>
              )}

              {/* 단계별 콘텐츠 */}
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 푸터 버튼 */}
        {currentStep < 7 && currentStep !== 4 && (
          <div className="p-6 pt-0 flex justify-between">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={() => {
                  // 이전 단계로 (구현 시 추가)
                }}
                disabled
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-2">
              {![5, 6].includes(currentStep) && (
                <Button variant="ghost" onClick={handleSkip}>
                  건너뛰기
                </Button>
              )}
              <Button 
                onClick={handleNext}
                disabled={completeStep.isPending}
              >
                {completeStep.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    다음
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingWizard;
