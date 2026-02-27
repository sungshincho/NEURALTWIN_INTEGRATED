/**
 * LayoutResultPanel.tsx
 *
 * 레이아웃 최적화 시뮬레이션 결과 패널
 */

import { useState } from 'react';
import { DraggablePanel } from '../../components/DraggablePanel';
import { Layout, TrendingUp, ArrowRight, Package, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyStrategyModal } from '@/features/roi/components/ApplyStrategyModal';

export interface LayoutResult {
  currentEfficiency: number;
  optimizedEfficiency: number;
  revenueIncrease: number;
  dwellTimeIncrease: number;
  conversionIncrease: number;
  /** 가구 변경 사항 */
  changes: {
    item: string;
    from: string;
    to: string;
    effect: string;
  }[];
  /** 🆕 제품 재배치 변경 사항 (슬롯 바인딩 기반) */
  productChanges?: {
    productId: string;
    productSku?: string;
    productName: string;
    // As-Is (현재 위치)
    fromFurniture: string;   // 가구 코드/이름 (예: "RACK-001" 또는 "의류 행거")
    fromSlot: string;        // 슬롯 ID (예: "H1-1")
    // To-Be (제안 위치)
    toFurniture: string;     // 제안 가구 코드/이름 (예: "MANNE-001" 또는 "전신 마네킹")
    toSlot: string;          // 제안 슬롯 ID (예: "M3")
    // 사유 및 효과
    reason: string;
    expectedImpact?: {
      revenueChangePct: number;
      visibilityScore: number;
    };
  }[];
}

interface LayoutResultPanelProps {
  result?: LayoutResult | null;
  onClose: () => void;
  onApply: () => void;
  onShowIn3D: () => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
  defaultCollapsed?: boolean;
}

export const LayoutResultPanel: React.FC<LayoutResultPanelProps> = ({
  result,
  onClose,
  onApply,
  onShowIn3D,
  defaultPosition = { x: 350, y: 100 },
  rightOffset,
  defaultCollapsed = true,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const improvement = result ? result.optimizedEfficiency - result.currentEfficiency : 0;

  // ROI 계산 (매출 증가 / 예상 비용 * 100)
  const estimatedROI = result ? Math.round((result.revenueIncrease / (result.revenueIncrease * 0.3)) * 100) : 0;

  const handleApplyClick = () => {
    setShowApplyModal(true);
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    onApply();
  };

  return (
    <DraggablePanel
      id="layout-result"
      title="레이아웃 최적화"
      icon={<Layout className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      defaultCollapsed={defaultCollapsed}
      closable
      onClose={onClose}
      width="w-64"
    >
      {!result ? (
        <div className="py-6 text-center">
          <Layout className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-xs text-white/40">표시할 결과 없음</p>
          <p className="text-[10px] text-white/30 mt-1">시뮬레이션 실행 후 결과가 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 효율성 점수 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-1">효율성 점수</p>
            <div className="flex items-center gap-2">
              <span className="text-lg text-white/60">{result.currentEfficiency}%</span>
              <ArrowRight className="w-4 h-4 text-white/40" />
              <span className="text-lg text-white font-semibold">{result.optimizedEfficiency}%</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                improvement > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {improvement > 0 ? '+' : ''}{improvement}%p
              </span>
            </div>
          </div>

          {/* 예상 효과 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              예상 효과
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">매출 증가</span>
                <span className="text-xs font-medium text-green-400">
                  +₩{(result.revenueIncrease / 10000).toFixed(0)}만/월
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">체류시간</span>
                <span className="text-xs font-medium text-green-400">
                  +{result.dwellTimeIncrease}분
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">전환율</span>
                <span className="text-xs font-medium text-green-400">
                  +{result.conversionIncrease}%p
                </span>
              </div>
            </div>
          </div>

          {/* 가구 변경 사항 */}
          {result.changes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                <Armchair className="w-3 h-3" />
                가구 변경 ({result.changes.length}건)
              </p>
              <div className="space-y-2 max-h-28 overflow-y-auto">
                {result.changes.map((change, i) => (
                  <div key={i} className="text-xs bg-white/5 rounded p-2">
                    <p className="text-white font-medium">{change.item}</p>
                    <p className="text-white/40">{change.from} → {change.to}</p>
                    <p className="text-green-400">{change.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🆕 제품 재배치 변경 사항 (슬롯 바인딩 기반) */}
          {result.productChanges && result.productChanges.length > 0 && (
            <div className="mb-3 border-t border-purple-500/30 pt-3 mt-3">
              <p className="text-xs text-purple-300 mb-2 flex items-center gap-1 font-semibold">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                📦 제품 재배치 ({result.productChanges.length}건)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.productChanges.map((change, i) => (
                  <div key={i} className="text-xs bg-purple-500/15 border border-purple-500/30 rounded-lg p-2.5">
                    {/* 제품 정보 */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-white font-medium">{change.productName}</span>
                      {change.productSku && (
                        <span className="text-purple-300 text-[10px] font-mono bg-purple-500/20 px-1 rounded">
                          {change.productSku}
                        </span>
                      )}
                    </div>

                    {/* 슬롯 바인딩 변경 (As-Is → To-Be) */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {/* As-Is */}
                      <div className="bg-red-500/25 px-1.5 py-1 rounded flex-1 text-center border border-red-500/30">
                        <div className="text-red-300 font-mono truncate">{change.fromFurniture}</div>
                        <div className="text-red-200/70 font-mono text-[9px]">[{change.fromSlot}]</div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />

                      {/* To-Be */}
                      <div className="bg-green-500/25 px-1.5 py-1 rounded flex-1 text-center border border-green-500/30">
                        <div className="text-green-300 font-mono truncate">{change.toFurniture}</div>
                        <div className="text-green-200/70 font-mono text-[9px]">[{change.toSlot}]</div>
                      </div>
                    </div>

                    {/* 사유 */}
                    <p className="text-purple-200/80 text-[10px] mt-1.5 leading-tight">💡 {change.reason}</p>

                    {/* 예상 효과 */}
                    {change.expectedImpact && (
                      <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-white/10">
                        <span className="text-green-400 text-[10px]">
                          📈 {change.expectedImpact.revenueChangePct >= 0 ? '+' : ''}{change.expectedImpact.revenueChangePct.toFixed(1)}%
                        </span>
                        <span className="text-yellow-400 text-[10px]">
                          👁 {(change.expectedImpact.visibilityScore * 100).toFixed(0)}점
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 변경 사항 없음 */}
          {result.changes.length === 0 && (!result.productChanges || result.productChanges.length === 0) && (
            <div className="text-xs text-white/40 text-center py-2">
              변경 사항 없음
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowIn3D}
              className="flex-1 h-8 text-xs bg-white/10 hover:bg-white/20 text-white"
            >
              3D 보기
            </Button>
            <Button
              size="sm"
              onClick={handleApplyClick}
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
              sourceModule: 'layout_optimization',
              name: `레이아웃 최적화 (가구 ${result.changes.length}개, 제품 ${result.productChanges?.length || 0}개 변경)`,
              description: `가구 ${result.changes.length}개 재배치${result.productChanges?.length ? `, 제품 ${result.productChanges.length}개 재배치` : ''}를 통한 매장 효율성 ${improvement}%p 개선`,
              settings: {
                furnitureChanges: result.changes,
                productChanges: result.productChanges || [],
              },
              expectedRoi: estimatedROI,
              expectedRevenue: result.revenueIncrease,
              confidence: 85,
              baselineMetrics: {
                efficiency: result.currentEfficiency,
                dwellTime: 0,
                conversionRate: 0,
              },
            }}
          />
        </>
      )}
    </DraggablePanel>
  );
};

export default LayoutResultPanel;
