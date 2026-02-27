/**
 * 전략 적용 모달 컴포넌트
 * - 인사이트 허브와 디지털트윈 스튜디오에서 공통으로 사용
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, Target, Loader2 } from 'lucide-react';
import { useApplyStrategy } from '../hooks/useAppliedStrategies';
import { useApplyRecommendation, RecommendationType } from '@/hooks/useROITracking';
import { getModuleConfig, getSourceDisplayName } from '../utils/moduleConfig';
import type { ApplyStrategyInput, SimulationSource, SourceModule } from '../types/roi.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useDarkMode } from '@/hooks/useDarkMode';

interface ApplyStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyData: {
    source: SimulationSource;
    sourceModule: SourceModule;
    name: string;
    description?: string;
    settings: Record<string, any>;
    expectedRoi: number;
    expectedRevenue?: number;
    confidence?: number;
    baselineMetrics: Record<string, number>;
  };
  /** 적용 후 ROI 페이지로 이동 여부 */
  navigateToROI?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`;
  return `₩${value.toLocaleString()}`;
};

export const ApplyStrategyModal: React.FC<ApplyStrategyModalProps> = ({
  isOpen,
  onClose,
  strategyData,
  navigateToROI = false,
}) => {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const [name, setName] = useState(strategyData.name);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [targetRoi, setTargetRoi] = useState(strategyData.expectedRoi.toString());
  const [notes, setNotes] = useState('');

  // 다크 모드 감지
  const isDark = useDarkMode();

  const { mutate: applyStrategy, isPending: isApplyingStrategy } = useApplyStrategy();
  const { mutate: applyRecommendation, isPending: isApplyingRecommendation } = useApplyRecommendation();
  const isPending = isApplyingStrategy || isApplyingRecommendation;
  const config = getModuleConfig(strategyData.sourceModule);

  // 색상 변수
  const textPrimary = isDark ? '#ffffff' : '#1a1a1f';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : '#515158';
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : '#6b7280';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,1)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)';

  // sourceModule을 recommendation_type으로 매핑
  const getRecommendationType = (sourceModule: SourceModule): RecommendationType => {
    switch (sourceModule) {
      case 'price_optimization':
        return 'pricing';
      case 'inventory_optimization':
        return 'inventory';
      case 'flow_optimization':
      case 'layout_optimization':
        return 'layout';
      case 'staffing_optimization':
        return 'staffing';
      case 'promotion_optimization':
        return 'promotion';
      case 'ai_recommendation':
      default:
        return 'marketing';
    }
  };

  const handleApply = () => {
    if (!name.trim()) {
      toast.error('전략명을 입력해주세요');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('종료일은 시작일 이후여야 합니다');
      return;
    }

    const input: ApplyStrategyInput = {
      source: strategyData.source,
      sourceModule: strategyData.sourceModule,
      name: name.trim(),
      description: strategyData.description,
      settings: strategyData.settings,
      startDate,
      endDate,
      expectedRoi: strategyData.expectedRoi,
      expectedRevenue: strategyData.expectedRevenue,
      targetRoi: parseFloat(targetRoi) || strategyData.expectedRoi,
      baselineMetrics: strategyData.baselineMetrics,
      notes: notes.trim() || undefined,
    };

    // applied_strategies 테이블에 저장
    applyStrategy(input, {
      onSuccess: () => {
        // recommendation_applications 테이블에도 저장하여 ROI 추적 활성화
        const measurementDays = Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        const effectiveStoreId = selectedStore?.id || input.settings?.storeId;

        if (!effectiveStoreId) {
          // storeId가 없으면 ROI 추적 없이 전략만 적용
          console.warn('storeId가 없어 ROI 추적을 건너뜁니다');
          toast.success('전략이 적용되었습니다', {
            description: '매장을 선택하면 ROI 추적이 가능합니다',
          });
          onClose();
          if (navigateToROI) {
            navigate('/os/roi');
          }
          return;
        }

        applyRecommendation({
          storeId: effectiveStoreId,
          recommendationType: getRecommendationType(strategyData.sourceModule),
          recommendationSummary: name.trim(),
          recommendationDetails: {
            ...strategyData.settings,
            expectedROI: strategyData.expectedRoi,
            expectedRevenue: strategyData.expectedRevenue,
            source: strategyData.source,
            sourceModule: strategyData.sourceModule,
            notes: notes.trim() || undefined,
          },
          measurementDays: measurementDays > 0 ? measurementDays : 7,
        }, {
          onSuccess: () => {
            toast.success('전략이 적용되었습니다', {
              description: 'ROI 측정 대시보드에서 성과를 추적할 수 있습니다',
              action: navigateToROI
                ? undefined
                : {
                    label: 'ROI 대시보드 보기',
                    onClick: () => navigate('/os/roi'),
                  },
            });
            onClose();
            if (navigateToROI) {
              navigate('/os/roi');
            }
          },
          onError: (error) => {
            // recommendation_applications 저장 실패해도 applied_strategies는 이미 저장됨
            console.error('ROI 추적 저장 실패:', error);
            toast.warning('전략이 적용되었으나 ROI 추적에 실패했습니다', {
              description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요',
            });
            onClose();
            if (navigateToROI) {
              navigate('/os/roi');
            }
          },
        });
      },
      onError: (error) => {
        toast.error('전략 적용 실패', {
          description: error.message,
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: textPrimary }}>
            <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
              {config.icon}
            </span>
            전략 적용
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 전략 요약 */}
          <div className="p-4 rounded-lg" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h4 className="font-medium mb-3" style={{ color: textPrimary }}>{strategyData.name}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p style={{ color: textMuted }}>예상 ROI</p>
                <p className="font-medium text-lg" style={{ color: textPrimary }}>{strategyData.expectedRoi}%</p>
              </div>
              {strategyData.expectedRevenue !== undefined && (
                <div>
                  <p style={{ color: textMuted }}>예상 매출</p>
                  <p className="font-medium text-lg text-green-500">
                    +{formatCurrency(strategyData.expectedRevenue)}
                  </p>
                </div>
              )}
              {strategyData.confidence !== undefined && (
                <div>
                  <p style={{ color: textMuted }}>신뢰도</p>
                  <p className="font-medium text-lg" style={{ color: textPrimary }}>{strategyData.confidence}%</p>
                </div>
              )}
            </div>
            <p className="text-xs mt-3" style={{ color: textMuted }}>
              출처: {getSourceDisplayName(strategyData.source)}
            </p>
          </div>

          {/* 전략명 */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: textSecondary }}>전략명 (수정 가능)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="전략명 입력"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textPrimary,
              }}
            />
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1" style={{ color: textSecondary }}>
                <Calendar className="w-3 h-3" />
                시작일
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1" style={{ color: textSecondary }}>
                <Calendar className="w-3 h-3" />
                종료일
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                }}
              />
            </div>
          </div>

          {/* ROI 목표 */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1" style={{ color: textSecondary }}>
              <Target className="w-3 h-3" />
              ROI 목표 (%)
            </Label>
            <Input
              type="number"
              value={targetRoi}
              onChange={(e) => setTargetRoi(e.target.value)}
              placeholder="예상 ROI 기준"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textPrimary,
              }}
            />
            <p className="text-xs" style={{ color: textMuted }}>비워두면 예상 ROI ({strategyData.expectedRoi}%)가 목표가 됩니다</p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: textSecondary }}>메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모나 특이사항을 입력하세요..."
              className="resize-none"
              rows={3}
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textPrimary,
              }}
            />
          </div>

          {/* 안내 - 빨간색으로 변경 */}
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: '#ef4444' }}>
              적용 시 ROI 측정 대시보드에 기록되며, 실시간으로 성과가 추적됩니다.
              적용 기간 동안 전략의 효과를 측정하여 최종 ROI를 산출합니다.
            </p>
          </div>

          {/* 버튼 - 검정색 + 테두리 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isPending}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: `1px solid ${cardBorder}`,
                color: textPrimary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              취소
            </button>
            <button
              onClick={handleApply}
              disabled={isPending}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: `1px solid ${cardBorder}`,
                color: textPrimary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  적용 중...
                </>
              ) : (
                '적용하기'
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyStrategyModal;
