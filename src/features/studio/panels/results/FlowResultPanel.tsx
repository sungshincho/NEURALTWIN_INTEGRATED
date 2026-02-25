/**
 * FlowResultPanel.tsx
 *
 * 동선 최적화 시뮬레이션 결과 패널
 */

import { useState } from 'react';
import { DraggablePanel } from '../../components/DraggablePanel';
import { Route, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';

export interface FlowResult {
  currentPathLength: number;
  optimizedPathLength: number;
  bottlenecks: {
    location: string;
    congestion: number;
    cause: string;
    suggestion: string;
  }[];
  improvements: {
    metric: string;
    value: string;
  }[];
}

interface FlowResultPanelProps {
  result?: FlowResult | null;
  onClose: () => void;
  onApply: () => void;
  onShowFlow: () => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
  defaultCollapsed?: boolean;
}

export const FlowResultPanel: React.FC<FlowResultPanelProps> = ({
  result,
  onClose,
  onApply,
  onShowFlow,
  defaultPosition = { x: 640, y: 100 },
  rightOffset,
  defaultCollapsed = true,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const pathReduction = result ? ((result.currentPathLength - result.optimizedPathLength) / result.currentPathLength * 100).toFixed(1) : '0';
  const estimatedROI = 150; // 동선 최적화 기본 예상 ROI

  return (
    <DraggablePanel
      id="flow-result"
      title="동선 최적화"
      icon={<Route className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      defaultCollapsed={defaultCollapsed}
      closable
      onClose={onClose}
      width="w-64"
    >
      {!result ? (
        <div className="py-6 text-center">
          <Route className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-xs text-white/40">표시할 결과 없음</p>
          <p className="text-[10px] text-white/30 mt-1">시뮬레이션 실행 후 결과가 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 동선 길이 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-1">평균 동선 길이</p>
            <div className="flex items-center gap-2">
              <span className="text-lg text-white/60">{result.currentPathLength}m</span>
              <ArrowRight className="w-4 h-4 text-white/40" />
              <span className="text-lg text-white font-semibold">{result.optimizedPathLength}m</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                -{pathReduction}%
              </span>
            </div>
          </div>

          {/* 병목 구간 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              병목 구간 ({result.bottlenecks.length}곳)
            </p>
            <div className="space-y-2 max-h-28 overflow-y-auto">
              {result.bottlenecks.map((bn, i) => (
                <div key={i} className="text-xs bg-red-500/10 border border-red-500/20 rounded p-2">
                  <div className="flex justify-between">
                    <span className="text-white">{bn.location}</span>
                    <span className="text-red-400">{bn.congestion}%</span>
                  </div>
                  <p className="text-white/40 mt-1">원인: {bn.cause}</p>
                  <p className="text-yellow-400 mt-1">💡 {bn.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 개선 효과 */}
          <div>
            <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              예상 개선 효과
            </p>
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
              onClick={onShowFlow}
              className="flex-1 h-8 text-xs bg-white/10 hover:bg-white/20 text-white"
            >
              동선 보기
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
              sourceModule: 'flow_optimization',
              name: `동선 최적화 (${result.bottlenecks.length}개 병목 해소)`,
              description: `평균 동선 ${pathReduction}% 단축, 병목 ${result.bottlenecks.length}곳 개선`,
              settings: { bottlenecks: result.bottlenecks, improvements: result.improvements },
              expectedRoi: estimatedROI,
              confidence: 78,
              baselineMetrics: {
                pathLength: result.currentPathLength,
              },
            }}
          />
        </>
      )}
    </DraggablePanel>
  );
};

export default FlowResultPanel;
