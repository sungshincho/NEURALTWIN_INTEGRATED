/**
 * 전략 상세 모달 컴포넌트
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Calendar, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useStrategyDetail, useUpdateStrategyStatus } from '../hooks/useAppliedStrategies';
import { getModuleConfig, STATUS_CONFIG, RESULT_CONFIG, getSourceDisplayName } from '../utils/moduleConfig';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

interface StrategyDetailModalProps {
  strategyId: string;
  onClose: () => void;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '-';
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`;
  return `₩${value.toLocaleString()}`;
};

const formatPercent = (value: number | null): string => {
  if (value === null) return '-';
  return `${value.toFixed(0)}%`;
};

export const StrategyDetailModal: React.FC<StrategyDetailModalProps> = ({
  strategyId,
  onClose,
}) => {
  const { data: strategy, isLoading } = useStrategyDetail(strategyId);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateStrategyStatus();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  if (isLoading || !strategy) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <Skeleton className="h-32 w-full" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <Skeleton className="h-48 w-full" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const config = getModuleConfig(strategy.sourceModule);
  const actualRoi = strategy.finalRoi || strategy.currentRoi;
  const achievementRate = actualRoi !== null && strategy.targetRoi
    ? Math.round((actualRoi / strategy.targetRoi) * 100)
    : null;

  // 진행 중인 경우 남은 일수 계산
  const daysRemaining = strategy.status === 'active'
    ? Math.max(0, Math.ceil((new Date(strategy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const totalDays = Math.ceil(
    (new Date(strategy.endDate).getTime() - new Date(strategy.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPassed = strategy.status === 'active' ? totalDays - (daysRemaining || 0) : totalDays;

  const handleCancelStrategy = () => {
    if (confirm('정말로 이 전략을 취소하시겠습니까?')) {
      updateStatus(
        { strategyId, status: 'cancelled' },
        {
          onSuccess: () => {
            toast.success('전략이 취소되었습니다');
            onClose();
          },
        }
      );
    }
  };

  const handleCompleteStrategy = () => {
    // 실제 구현 시 ROI 입력 모달 표시
    const finalRoiInput = prompt('최종 ROI를 입력하세요 (%):', actualRoi?.toString() || '');
    if (finalRoiInput === null) return;

    const finalRoi = parseFloat(finalRoiInput);
    if (isNaN(finalRoi)) {
      toast.error('올바른 숫자를 입력해주세요');
      return;
    }

    const result = finalRoi >= (strategy.targetRoi || 100)
      ? 'success'
      : finalRoi >= (strategy.targetRoi || 100) * 0.8
        ? 'partial'
        : 'failed';

    updateStatus(
      { strategyId, status: 'completed', result, finalRoi },
      {
        onSuccess: () => {
          toast.success('전략이 완료 처리되었습니다');
        },
      }
    );
  };

  // 텍스트/배경 색상 변수
  const textPrimary = isDark ? '#ffffff' : '#1a1a1f';
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : '#515158';
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : '#6b7280';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const innerCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="transition-colors flex items-center gap-1 text-sm"
              style={{ color: textSecondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl', config.bgColor)}>
              {config.icon}
            </span>
            <div>
              <DialogTitle style={{ color: textPrimary }} className="text-xl">{strategy.name}</DialogTitle>
              <p className="text-sm mt-1" style={{ color: textMuted }}>
                적용일: {formatDate(strategy.startDate)} | 상태:{' '}
                <span style={{
                  color: strategy.status === 'cancelled'
                    ? '#ef4444'
                    : strategy.status === 'active'
                      ? '#3b82f6'
                      : textPrimary,
                  fontWeight: 500
                }}>
                  {strategy.status === 'cancelled'
                    ? '취소됨'
                    : strategy.status === 'active'
                      ? '진행중'
                      : strategy.result === 'success'
                        ? '완료 (목표 달성)'
                        : strategy.result === 'partial'
                          ? '완료 (부분 달성)'
                          : '완료 (미달성)'}
                </span>
                {daysRemaining !== null && ` (D+${daysPassed}/${totalDays})`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 전략 요약 */}
          <Card className="p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
              📋 전략 요약
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p style={{ color: textMuted }}>유형</p>
                <p className="font-medium" style={{ color: textPrimary }}>{config.displayName}</p>
              </div>
              <div>
                <p style={{ color: textMuted }}>출처</p>
                <p className="font-medium" style={{ color: textPrimary }}>{getSourceDisplayName(strategy.source)}</p>
              </div>
              <div>
                <p style={{ color: textMuted }}>기간</p>
                <p className="font-medium" style={{ color: textPrimary }}>
                  {formatDate(strategy.startDate)} ~ {formatDate(strategy.endDate)}
                </p>
              </div>
              {strategy.description && (
                <div className="col-span-2">
                  <p style={{ color: textMuted }}>설명</p>
                  <p style={{ color: textPrimary }}>{strategy.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* ROI 추적 */}
          <Card className="p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: textSecondary }}>
              📈 ROI 추적
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: innerCardBg }}>
                <p className="text-xs mb-1" style={{ color: textMuted }}>예상 ROI</p>
                <p className="text-2xl font-bold" style={{ color: textPrimary }}>{formatPercent(strategy.expectedRoi)}</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>→</span>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: innerCardBg }}>
                <p className="text-xs mb-1" style={{ color: textMuted }}>현재 ROI</p>
                <p className={cn(
                  'text-2xl font-bold',
                  actualRoi === null
                    ? ''
                    : actualRoi >= strategy.expectedRoi
                      ? 'text-green-500'
                      : 'text-yellow-500'
                )} style={actualRoi === null ? { color: textMuted } : undefined}>
                  {formatPercent(actualRoi)}
                </p>
              </div>
            </div>
            {achievementRate !== null && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: innerCardBg }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: textMuted }}>달성률</span>
                  <span className={cn(
                    'font-medium',
                    achievementRate >= 100 ? 'text-green-500' : achievementRate >= 80 ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {achievementRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      achievementRate >= 100 ? 'bg-green-500' : achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, achievementRate)}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* 세부 지표 */}
          {Object.keys(strategy.baselineMetrics).length > 0 && (
            <Card className="p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: textSecondary }}>
                📊 기준 메트릭 (적용 전)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(strategy.baselineMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 rounded" style={{ background: innerCardBg }}>
                    <span style={{ color: textMuted }}>{key}</span>
                    <span className="font-medium" style={{ color: textPrimary }}>
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 메모 */}
          {strategy.notes && (
            <Card className="p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: textSecondary }}>
                📝 메모
              </h4>
              <p className="text-sm whitespace-pre-wrap" style={{ color: textPrimary }}>{strategy.notes}</p>
            </Card>
          )}

          {/* 액션 버튼 - 순서: 전략 수정 → 기간 연장 → 조기 종료 → 완료 처리 */}
          {strategy.status === 'active' && (
            <div className="flex justify-center gap-3 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <Button variant="outline" onClick={() => toast.info('전략 수정 기능 준비 중')}>
                전략 수정
              </Button>
              <Button variant="outline" onClick={() => toast.info('기간 연장 기능 준비 중')}>
                기간 연장
              </Button>
              <Button variant="outline" onClick={handleCancelStrategy} disabled={isUpdating}>
                조기 종료
              </Button>
              <Button variant="outline" onClick={handleCompleteStrategy} disabled={isUpdating}>
                완료 처리
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyDetailModal;
