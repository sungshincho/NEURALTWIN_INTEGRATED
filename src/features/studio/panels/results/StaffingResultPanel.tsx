/**
 * StaffingResultPanel.tsx
 *
 * 인력 배치 최적화 시뮬레이션 결과 패널
 */

import { useState } from 'react';
import { DraggablePanel } from '../../components/DraggablePanel';
import { UserCheck, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';

export interface StaffingResult {
  currentCoverage: number;
  optimizedCoverage: number;
  staffCount: number;
  staffPositions: {
    name: string;
    current: string;
    suggested: string;
    coverageGain: string;
  }[];
  improvements: {
    metric: string;
    value: string;
  }[];
}

interface StaffingResultPanelProps {
  result?: StaffingResult | null;
  onClose: () => void;
  onApply: () => void;
  onShowPositions: () => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
  defaultCollapsed?: boolean;
}

export const StaffingResultPanel: React.FC<StaffingResultPanelProps> = ({
  result,
  onClose,
  onApply,
  onShowPositions,
  defaultPosition = { x: 640, y: 320 },
  rightOffset,
  defaultCollapsed = true,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const improvement = result ? result.optimizedCoverage - result.currentCoverage : 0;
  const estimatedROI = 180; // 인력 배치 기본 예상 ROI

  return (
    <DraggablePanel
      id="staffing-result"
      title="인력 배치 최적화"
      icon={<UserCheck className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      defaultCollapsed={defaultCollapsed}
      closable
      onClose={onClose}
      width="w-64"
    >
      {!result ? (
        <div className="py-6 text-center">
          <UserCheck className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-xs text-white/40">표시할 결과 없음</p>
          <p className="text-[10px] text-white/30 mt-1">시뮬레이션 실행 후 결과가 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 커버리지 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-1">매장 커버리지</p>
            <div className="flex items-center gap-2">
              <span className="text-lg text-white/60">{result.currentCoverage}%</span>
              <ArrowRight className="w-4 h-4 text-white/40" />
              <span className="text-lg text-white font-semibold">{result.optimizedCoverage}%</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                +{improvement}%p
              </span>
            </div>
          </div>

          {/* 직원별 배치 제안 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              배치 제안 ({result.staffCount}명)
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {result.staffPositions.map((staff, i) => (
                <div key={i} className="text-xs bg-white/5 rounded p-2">
                  <p className="text-white font-medium">{staff.name}</p>
                  <p className="text-white/40">{staff.current} → {staff.suggested}</p>
                  <p className="text-green-400">{staff.coverageGain}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 예상 효과 */}
          <div>
            <p className="text-xs text-white/50 mb-2">예상 효과</p>
            <div className="space-y-1">
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/60">{imp.metric}</span>
                  <span className="text-green-400">{imp.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowPositions}
              className="flex-1 h-8 text-xs bg-white/10 hover:bg-white/20 text-white"
            >
              배치 보기
            </Button>
            <Button
              size="sm"
              onClick={() => setShowApplyModal(true)}
              className="flex-1 h-8 text-xs"
            >
              적용하기
            </Button>
          </div>

          {/* 전략 적용 모달 */}
          <ApplyStrategyModal
            isOpen={showApplyModal}
            onClose={() => setShowApplyModal(false)}
            strategyData={{
              source: '3d_simulation',
              sourceModule: 'staffing_optimization',
              name: `인력 배치 최적화 (${result.staffCount}명 재배치)`,
              description: `직원 ${result.staffCount}명 배치 최적화로 매장 커버리지 ${improvement}%p 개선`,
              settings: { positions: result.staffPositions, improvements: result.improvements },
              expectedRoi: estimatedROI,
              confidence: 82,
              baselineMetrics: {
                coverage: result.currentCoverage,
                staffCount: result.staffCount,
              },
            }}
          />
        </>
      )}
    </DraggablePanel>
  );
};

export default StaffingResultPanel;
