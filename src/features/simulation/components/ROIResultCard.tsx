/**
 * ROIResultCard.tsx
 * 
 * AI 추천 적용 후 ROI 결과를 표시하는 카드 컴포넌트
 * - 시뮬레이션 허브 페이지에 통합
 * - 측정 중/완료 상태 표시
 * - KPI 변화량 시각화
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Users,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

import {
  useROIMeasurements,
  useRecommendationApplications,
  useCompleteROIMeasurement,
  useRevertRecommendation,
  formatROIChange,
  formatKPIValue,
  getROIColor,
  getROIBgColor,
  RECOMMENDATION_TYPE_LABELS,
  STATUS_LABELS,
  type ROIMeasurement,
  type RecommendationApplication,
  type KPIChange,
} from '@/hooks/useROITracking';

// ============================================================================
// 타입 정의
// ============================================================================

interface ROIResultCardProps {
  storeId?: string;
  limit?: number;
  showHeader?: boolean;
  onViewAll?: () => void;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ROIResultCard({ 
  storeId, 
  limit = 3, 
  showHeader = true,
  onViewAll 
}: ROIResultCardProps) {
  const { data: applications = [], isLoading: isLoadingApps } = useRecommendationApplications(storeId);
  const { data: measurements = [], isLoading: isLoadingMeasurements } = useROIMeasurements();
  const completeMeasurement = useCompleteROIMeasurement();
  const revertRecommendation = useRevertRecommendation();
  
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const isLoading = isLoadingApps || isLoadingMeasurements;

  // 최근 적용 건 + 측정 결과 결합
  const recentItems = applications.slice(0, limit).map(app => {
    const measurement = measurements.find(m => m.application_id === app.id);
    return { application: app, measurement };
  });

  // 측정 완료 가능한 항목 확인
  const today = new Date().toISOString().split('T')[0];
  const canComplete = (app: RecommendationApplication) => {
    return app.status === 'applied' && 
           app.measurement_end_date && 
           app.measurement_end_date <= today;
  };

  // 측정 진행률 계산
  const getMeasurementProgress = (app: RecommendationApplication) => {
    if (!app.measurement_start_date || !app.measurement_end_date) return 0;
    
    const start = new Date(app.measurement_start_date).getTime();
    const end = new Date(app.measurement_end_date).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  // ============================================================================
  // 렌더링: 빈 상태
  // ============================================================================

  if (!isLoading && applications.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              AI 추천 효과
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">아직 적용된 추천이 없습니다</p>
            <p className="text-sm">AI 시뮬레이션에서 추천을 적용하면<br />효과를 측정할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // 렌더링: 메인
  // ============================================================================

  return (
    <>
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                AI 추천 효과
              </CardTitle>
              {onViewAll && applications.length > limit && (
                <Button variant="ghost" size="sm" onClick={onViewAll}>
                  전체 보기
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <CardDescription>
              적용한 AI 추천의 실제 효과를 확인하세요
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          {isLoading ? (
            // 로딩 스켈레톤
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))
          ) : (
            recentItems.map(({ application, measurement }) => (
              <ROIItemCard
                key={application.id}
                application={application}
                measurement={measurement}
                progress={getMeasurementProgress(application)}
                canComplete={canComplete(application)}
                onComplete={() => completeMeasurement.mutate(application.id)}
                onRevert={() => {
                  setSelectedApplication(application.id);
                  setShowRevertDialog(true);
                }}
                isCompleting={completeMeasurement.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* 되돌리기 확인 다이얼로그 */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>추천 되돌리기</DialogTitle>
            <DialogDescription>
              이 추천을 되돌리시겠습니까? ROI 측정이 중단됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowRevertDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedApplication) {
                  revertRecommendation.mutate({ applicationId: selectedApplication });
                }
                setShowRevertDialog(false);
              }}
            >
              되돌리기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// 개별 ROI 항목 카드
// ============================================================================

interface ROIItemCardProps {
  application: RecommendationApplication & {
    stores?: { store_name: string } | null;
    scenarios?: { scenario_name: string } | null;
  };
  measurement?: ROIMeasurement | null;
  progress: number;
  canComplete: boolean;
  onComplete: () => void;
  onRevert: () => void;
  isCompleting: boolean;
}

function ROIItemCard({
  application,
  measurement,
  progress,
  canComplete,
  onComplete,
  onRevert,
  isCompleting,
}: ROIItemCardProps) {
  const isCompleted = application.status === 'completed' && measurement;
  const isMeasuring = application.status === 'applied';
  const isReverted = application.status === 'reverted';

  // 완료된 경우 - ROI 결과 표시
  if (isCompleted && measurement) {
    const revenueChange = measurement.kpi_changes?.total_revenue;
    const isPositive = (revenueChange?.percentage || 0) > 0;

    return (
      <div className={`p-4 rounded-lg border ${getROIBgColor(revenueChange?.percentage || 0)}`}>
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isPositive ? 'default' : 'secondary'}>
                {RECOMMENDATION_TYPE_LABELS[application.recommendation_type]}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                측정 완료
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {application.recommendation_summary}
            </p>
          </div>
        </div>

        {/* KPI 변화 */}
        <div className="grid grid-cols-3 gap-3">
          <KPIChangeItem
            label="매출"
            icon={DollarSign}
            change={measurement.kpi_changes?.total_revenue}
            baseline={application.baseline_kpis.total_revenue}
            formatValue={(v) => formatKPIValue('total_revenue', v)}
          />
          <KPIChangeItem
            label="방문자"
            icon={Users}
            change={measurement.kpi_changes?.total_visitors}
            baseline={application.baseline_kpis.total_visitors}
            formatValue={(v) => formatKPIValue('total_visitors', v)}
          />
          <KPIChangeItem
            label="전환율"
            icon={ShoppingCart}
            change={measurement.kpi_changes?.conversion_rate}
            baseline={application.baseline_kpis.conversion_rate}
            formatValue={(v) => formatKPIValue('conversion_rate', v)}
          />
        </div>

        {/* 연간 예상 효과 */}
        {measurement.estimated_annual_impact && isPositive && (
          <div className="mt-3 p-2 bg-white/60 rounded text-center">
            <span className="text-sm text-muted-foreground">연간 예상 효과: </span>
            <span className="font-semibold text-green-600">
              +{formatKPIValue('total_revenue', measurement.estimated_annual_impact.revenue)}
            </span>
          </div>
        )}

        {/* 측정 기간 */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {measurement.measurement_start_date} ~ {measurement.measurement_end_date} ({measurement.measurement_days}일)
          </span>
        </div>
      </div>
    );
  }

  // 측정 중인 경우
  if (isMeasuring) {
    return (
      <div className="p-4 rounded-lg border bg-blue-50/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">
                {RECOMMENDATION_TYPE_LABELS[application.recommendation_type]}
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                측정 중
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {application.recommendation_summary}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevert}
            className="text-muted-foreground hover:text-red-600"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">측정 진행률</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{application.measurement_start_date}</span>
            <span>{application.measurement_end_date}</span>
          </div>
        </div>

        {/* 측정 완료 버튼 */}
        {canComplete && (
          <Button
            size="sm"
            className="w-full mt-3"
            onClick={onComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              'ROI 계산 중...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                ROI 측정 완료하기
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // 되돌린 경우
  if (isReverted) {
    return (
      <div className="p-4 rounded-lg border bg-gray-50 opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary">
            {RECOMMENDATION_TYPE_LABELS[application.recommendation_type]}
          </Badge>
          <Badge variant="secondary">
            <RotateCcw className="h-3 w-3 mr-1" />
            되돌림
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {application.recommendation_summary}
        </p>
      </div>
    );
  }

  return null;
}

// ============================================================================
// KPI 변화 아이템
// ============================================================================

interface KPIChangeItemProps {
  label: string;
  icon: React.ElementType;
  change?: KPIChange;
  baseline: number;
  formatValue: (value: number) => string;
}

function KPIChangeItem({ label, icon: Icon, change, baseline, formatValue }: KPIChangeItemProps) {
  const percentage = change?.percentage || 0;
  const isPositive = percentage > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-lg font-bold ${getROIColor(percentage)}`}>
        {formatROIChange(change)}
      </div>
      {change && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <span>{formatValue(Math.abs(change.absolute))}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROI 요약 카드 (대시보드용)
// ============================================================================

interface ROISummaryCardProps {
  storeId?: string;
}

export function ROISummaryCard({ storeId }: ROISummaryCardProps) {
  const { data: measurements = [] } = useROIMeasurements();
  
  const recentPositive = measurements
    .filter(m => m.is_positive_impact)
    .slice(0, 1)[0];

  if (!recentPositive) return null;

  const revenueChange = recentPositive.kpi_changes?.total_revenue;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-green-800 font-medium">AI 추천 효과</p>
            <p className="text-2xl font-bold text-green-600">
              {formatROIChange(revenueChange)}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-green-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ROIResultCard;
