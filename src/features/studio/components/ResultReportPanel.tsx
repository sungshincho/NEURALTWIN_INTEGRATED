/**
 * ResultReportPanel.tsx
 *
 * 통합 시뮬레이션 결과 리포트 패널
 * - Layout, Flow, Congestion, Staffing 결과 통합 표시
 * - 실제 시뮬레이션 결과 데이터 연동
 * - DraggablePanel 기반
 */

import { memo, useState } from 'react';
import {
  Layout,
  Route,
  Users2,
  UserCog,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileBarChart,
  Package,
  Armchair,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LayoutResult, FlowResult, CongestionResult, StaffingResult } from '../panels/results';

interface SimulationResults {
  layout: LayoutResult | null;
  flow: FlowResult | null;
  congestion: CongestionResult | null;
  staffing: StaffingResult | null;
}

interface ResultReportPanelProps {
  results: SimulationResults;
  onClose: () => void;
  onApply: (type: keyof SimulationResults) => void;
  onShowIn3D: (type: keyof SimulationResults) => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
  /** 외부에서 y 위치 동기화 (변경 시 자동 업데이트) */
  syncY?: number;
  /** 최소 크기 */
  minSize?: { width: number; height: number };
  /** 최대 크기 */
  maxSize?: { width: number; height: number };
}

// 결과 유형 설정
const RESULT_TYPES = [
  { id: 'layout' as const, label: '레이아웃', icon: Layout, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { id: 'flow' as const, label: '동선', icon: Route, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { id: 'congestion' as const, label: '혼잡도', icon: Users2, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { id: 'staffing' as const, label: '직원 배치', icon: UserCog, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
];

export const ResultReportPanel = memo(function ResultReportPanel({
  results,
  onClose,
  onApply,
  onShowIn3D,
  defaultPosition = { x: 350, y: 100 },
  rightOffset,
  syncY,
  minSize,
  maxSize,
}: ResultReportPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layout: true,
    flow: false,
    congestion: false,
    staffing: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // 결과가 하나라도 있는지 확인
  const hasAnyResult = Object.values(results).some((r) => r !== null);

  // 총 개선 효과 계산
  const totalImprovements = {
    revenue: (results.layout?.revenueIncrease || 0),
    efficiency:
      (results.layout ? results.layout.optimizedEfficiency - results.layout.currentEfficiency : 0) +
      (results.staffing ? results.staffing.optimizedCoverage - results.staffing.currentCoverage : 0),
    changes:
      (results.layout?.changes?.length || 0) +
      (results.layout?.productChanges?.length || 0) +
      (results.flow?.bottlenecks?.length || 0) +
      (results.staffing?.staffPositions?.length || 0),
  };

  return (
    <DraggablePanel
      id="result-report"
      title="AI 분석 리포트"
      icon={<FileBarChart className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      syncY={syncY}
      defaultCollapsed={false}
      closable
      onClose={onClose}
      width="w-80"
      minSize={minSize}
      maxSize={maxSize}
    >
      {!hasAnyResult ? (
        <div className="py-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40">분석 결과 없음</p>
          <p className="text-xs text-white/30 mt-1">
            AI 시뮬레이션 또는 AI 최적화 탭에서
            <br />
            분석을 실행하세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 전체 요약 */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white">총 개선 효과</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">
                  +{totalImprovements.revenue.toFixed(1)}%
                </div>
                <div className="text-[10px] text-white/50">예상 매출</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">
                  +{totalImprovements.efficiency.toFixed(1)}%
                </div>
                <div className="text-[10px] text-white/50">효율성</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{totalImprovements.changes}</div>
                <div className="text-[10px] text-white/50">변경 사항</div>
              </div>
            </div>
          </div>

          {/* 🆕 ROI 분석 - 예상 개선 효과 기반 */}
          {totalImprovements.revenue > 0 && (
            <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">ROI 분석</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-black/30">
                  <div className="text-white/50 text-[10px]">예상 매출 증가</div>
                  <div className="text-green-400 font-medium">+{totalImprovements.revenue.toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-black/30">
                  <div className="text-white/50 text-[10px]">예상 효율성 증가</div>
                  <div className="text-blue-400 font-medium">+{totalImprovements.efficiency.toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-black/30">
                  <div className="text-white/50 text-[10px]">변경 사항 수</div>
                  <div className="text-white font-medium">{totalImprovements.changes}건</div>
                </div>
                <div className="p-2 rounded bg-black/30">
                  <div className="text-white/50 text-[10px]">적용 권장</div>
                  <div className="text-amber-400 font-medium">
                    {totalImprovements.revenue >= 5 ? '강력 권장' : totalImprovements.revenue >= 2 ? '권장' : '선택적'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 적용 우선순위 가이드 */}
          {totalImprovements.changes > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">적용 가이드</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                {results.layout && (results.layout.changes?.length > 0 || (results.layout.productChanges?.length || 0) > 0) && (
                  <div className="flex items-center gap-2 p-1.5 rounded bg-black/30">
                    <span className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-[9px]">1</span>
                    <span className="text-white/80">레이아웃 변경 먼저 적용</span>
                    <span className="ml-auto text-yellow-400">{(results.layout.changes?.length || 0) + (results.layout.productChanges?.length || 0)}건</span>
                  </div>
                )}
                {results.flow && results.flow.bottlenecks?.length > 0 && (
                  <div className="flex items-center gap-2 p-1.5 rounded bg-black/30">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-[9px]">2</span>
                    <span className="text-white/80">병목 구간 개선</span>
                    <span className="ml-auto text-cyan-400">{results.flow.bottlenecks.length}건</span>
                  </div>
                )}
                {results.staffing && results.staffing.staffPositions?.length > 0 && (
                  <div className="flex items-center gap-2 p-1.5 rounded bg-black/30">
                    <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-black font-bold text-[9px]">3</span>
                    <span className="text-white/80">직원 배치 조정</span>
                    <span className="ml-auto text-purple-400">{results.staffing.staffPositions.length}건</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 결과별 섹션 */}
          {RESULT_TYPES.map((type) => {
            const result = results[type.id];
            if (!result) return null;

            const Icon = type.icon;
            const isExpanded = expandedSections[type.id];

            return (
              <div
                key={type.id}
                className={cn('rounded-lg border border-white/10 overflow-hidden', type.bgColor)}
              >
                {/* 섹션 헤더 */}
                <button
                  onClick={() => toggleSection(type.id)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', type.color)} />
                    <span className="text-sm font-medium text-white">{type.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      완료
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </button>

                {/* 섹션 내용 */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 space-y-2">
                    {/* Layout 결과 */}
                    {type.id === 'layout' && results.layout && (
                      <LayoutResultContent result={results.layout} />
                    )}

                    {/* Flow 결과 */}
                    {type.id === 'flow' && results.flow && (
                      <FlowResultContent result={results.flow} />
                    )}

                    {/* Congestion 결과 */}
                    {type.id === 'congestion' && results.congestion && (
                      <CongestionResultContent result={results.congestion} />
                    )}

                    {/* Staffing 결과 */}
                    {type.id === 'staffing' && results.staffing && (
                      <StaffingResultContent result={results.staffing} />
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onShowIn3D(type.id)}
                        className="flex-1 h-7 text-xs bg-white/10 hover:bg-white/20 text-white"
                      >
                        3D 보기
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApply(type.id)}
                        className="flex-1 h-7 text-xs bg-white/10 hover:bg-white/20 text-white"
                      >
                        적용
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DraggablePanel>
  );
});

// Layout 결과 내용 - 상세 정보 포함
const LayoutResultContent = memo(function LayoutResultContent({ result }: { result: LayoutResult }) {
  const [showFurnitureDetails, setShowFurnitureDetails] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const improvement = result.optimizedEfficiency - result.currentEfficiency;

  return (
    <div className="space-y-2">
      {/* 효율성 점수 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentEfficiency}%</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedEfficiency}%</span>
        <span
          className={cn(
            'text-xs px-1 py-0.5 rounded',
            improvement > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}
        >
          {improvement > 0 ? '+' : ''}
          {improvement}%p
        </span>
      </div>

      {/* 예상 효과 */}
      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-green-400 font-medium">+{result.revenueIncrease.toFixed(1)}%</div>
          <div className="text-white/40 text-[10px]">매출</div>
        </div>
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-blue-400 font-medium">+{result.dwellTimeIncrease.toFixed(1)}%</div>
          <div className="text-white/40 text-[10px]">체류</div>
        </div>
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-purple-400 font-medium">+{result.conversionIncrease.toFixed(1)}%</div>
          <div className="text-white/40 text-[10px]">전환</div>
        </div>
      </div>

      {/* 가구 변경 사항 상세 */}
      {result.changes.length > 0 && (
        <div className="space-y-1">
          <button
            onClick={() => setShowFurnitureDetails(!showFurnitureDetails)}
            className="w-full flex items-center justify-between text-xs text-white/60 hover:text-white/80 p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/20"
          >
            <div className="flex items-center gap-1.5">
              <Armchair className="w-3 h-3 text-orange-400" />
              <span>가구 재배치 {result.changes.length}건</span>
            </div>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showFurnitureDetails && 'rotate-180')} />
          </button>
          {showFurnitureDetails && (
            <div className="max-h-32 overflow-y-auto space-y-1.5 pl-1">
              {result.changes.map((change, i) => (
                <div key={i} className="p-2 rounded bg-black/30 text-xs">
                  <div className="font-medium text-white mb-1">{change.item}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{change.from}</span>
                    <ArrowRight className="w-3 h-3 text-white/40" />
                    <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">{change.to}</span>
                  </div>
                  {change.effect && (
                    <div className="mt-1 text-[10px] text-white/50">💡 {change.effect}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 제품 변경 사항 상세 */}
      {result.productChanges && result.productChanges.length > 0 && (
        <div className="space-y-1">
          <button
            onClick={() => setShowProductDetails(!showProductDetails)}
            className="w-full flex items-center justify-between text-xs text-white/60 hover:text-white/80 p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20"
          >
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-blue-400" />
              <span>제품 재배치 {result.productChanges.length}건</span>
            </div>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showProductDetails && 'rotate-180')} />
          </button>
          {showProductDetails && (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pl-1">
              {result.productChanges.map((change, i) => (
                <div key={i} className="p-2 rounded bg-black/30 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{change.productName}</span>
                    {change.productSku && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/50 font-mono">
                        {change.productSku}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="p-1 rounded bg-red-500/10">
                      <div className="text-red-400 font-medium">From:</div>
                      <div className="text-white/70">{change.fromFurniture}</div>
                      <div className="text-white/50">슬롯: {change.fromSlot}</div>
                    </div>
                    <div className="p-1 rounded bg-green-500/10">
                      <div className="text-green-400 font-medium">To:</div>
                      <div className="text-white/70">{change.toFurniture}</div>
                      <div className="text-white/50">슬롯: {change.toSlot}</div>
                    </div>
                  </div>
                  {change.reason && (
                    <div className="mt-1 text-[10px] text-white/50">💡 {change.reason}</div>
                  )}
                  {change.expectedImpact && (
                    <div className="mt-1 flex gap-2 text-[10px]">
                      <span className="text-green-400">
                        📈 {change.expectedImpact.revenueChangePct >= 0 ? '+' : ''}{change.expectedImpact.revenueChangePct.toFixed(1)}%
                      </span>
                      <span className="text-yellow-400">
                        👁 {(change.expectedImpact.visibilityScore * 100).toFixed(0)}점
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Flow 결과 내용
const FlowResultContent = memo(function FlowResultContent({ result }: { result: FlowResult }) {
  const improvement = result.currentPathLength - result.optimizedPathLength;

  return (
    <div className="space-y-2">
      {/* 경로 길이 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentPathLength}m</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedPathLength}m</span>
        {improvement > 0 && (
          <span className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400">
            -{improvement}m
          </span>
        )}
      </div>

      {/* 병목 지점 */}
      {result.bottlenecks.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-white/60 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            병목 지점 {result.bottlenecks.length}개
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {result.bottlenecks.slice(0, 3).map((b, i) => (
              <div key={i} className="text-xs p-1.5 rounded bg-black/20">
                <span className="text-white">{b.location}</span>
                <span className="text-white/40 ml-1">({b.congestion}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 개선 사항 */}
      {result.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.improvements.map((imp, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
              {imp.metric}: {imp.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// Congestion 결과 내용
const CongestionResultContent = memo(function CongestionResultContent({
  result,
}: {
  result: CongestionResult;
}) {
  return (
    <div className="space-y-2">
      {/* 피크 혼잡도 */}
      <div className="p-2 rounded bg-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-white/60">피크 시간</span>
          </div>
          <span className="text-sm font-medium text-white">{result.peakHours}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/60">최대 혼잡도</span>
          <span className="text-sm font-semibold text-red-400">{result.peakCongestion}%</span>
        </div>
      </div>

      {/* 구역별 혼잡도 */}
      {result.zoneData.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-white/60 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            구역별 혼잡도
          </div>
          <div className="grid grid-cols-2 gap-1">
            {result.zoneData.slice(0, 4).map((z, i) => (
              <div key={i} className="text-xs p-1.5 rounded bg-black/20 flex justify-between">
                <span className="text-white/70 truncate">{z.zone}</span>
                <span
                  className={cn(
                    'font-medium',
                    z.congestion >= 80 ? 'text-red-400' : z.congestion >= 50 ? 'text-yellow-400' : 'text-green-400'
                  )}
                >
                  {z.congestion}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권장 사항 */}
      {result.recommendations.length > 0 && (
        <div className="text-xs text-blue-400 p-1.5 rounded bg-blue-500/10">
          {result.recommendations[0]}
        </div>
      )}
    </div>
  );
});

// Staffing 결과 내용
const StaffingResultContent = memo(function StaffingResultContent({
  result,
}: {
  result: StaffingResult;
}) {
  const improvement = result.optimizedCoverage - result.currentCoverage;

  return (
    <div className="space-y-2">
      {/* 커버리지 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentCoverage}%</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedCoverage}%</span>
        {improvement > 0 && (
          <span className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400">
            +{improvement}%p
          </span>
        )}
      </div>

      {/* 직원 배치 */}
      <div className="flex items-center gap-2 text-xs">
        <UserCog className="w-3 h-3 text-purple-400" />
        <span className="text-white/60">직원 {result.staffCount}명</span>
        <span className="text-white/40">|</span>
        <span className="text-white/60">재배치 {result.staffPositions.length}명</span>
      </div>

      {/* 개선 사항 */}
      {result.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.improvements.map((imp, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/80">
              {imp.metric}: {imp.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default ResultReportPanel;
