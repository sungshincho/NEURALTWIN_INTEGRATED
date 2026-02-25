/**
 * OptimizationResultPanel.tsx
 *
 * AI 최적화 결과 표시 패널
 * - 레이아웃/동선/인력배치 결과 요약
 * - 예상 효과 지표
 * - AI 인사이트
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, TrendingUp, Clock, Users, Percent, Package, ArrowRight, Armchair, UserCircle2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type OptimizationType = 'layout' | 'flow' | 'staffing';

interface OptimizationResultPanelProps {
  type: OptimizationType;
  title: string;
  result: any;
  onToggleOverlay?: (visible: boolean) => void;
}

export function OptimizationResultPanel({
  type,
  title,
  result,
  onToggleOverlay,
}: OptimizationResultPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [showFurnitureDetails, setShowFurnitureDetails] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  // B안: 직원 제안 및 가구 조정 표시 상태
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);
  const [showFurnitureAdjustments, setShowFurnitureAdjustments] = useState(false);

  const toggleOverlay = () => {
    const newValue = !isOverlayVisible;
    setIsOverlayVisible(newValue);
    onToggleOverlay?.(newValue);
  };

  // 결과 요약 데이터 추출
  const getSummary = () => {
    switch (type) {
      case 'layout':
        return {
          confidence: result.confidence?.overall ? result.confidence.overall * 100 : 75,
          revenueIncrease: result.improvements?.revenueIncreasePercent || result.improvements?.revenueIncrease || 0,
          dwellTimeIncrease: result.improvements?.dwellTimeIncrease || 0,
          conversionIncrease: result.improvements?.conversionIncrease || 0,
          furnitureChangesCount: result.furnitureMoves?.length || 0,
          productChangesCount: result.productPlacements?.length || 0,
          currentEfficiency: result.currentEfficiency || 0,
          optimizedEfficiency: result.optimizedEfficiency || 0,
          // B안: 직원 제안 수
          staffSuggestionsCount: result.staff_suggestions?.items?.length || 0,
        };
      case 'flow':
        return {
          confidence: 78,
          pathReduction: result.comparison?.pathLengthReduction || result.improvements?.pathReduction || 15,
          timeReduction: result.comparison?.timeReduction || 12,
          bottleneckCount: result.bottlenecks?.length || 0,
          pathCount: result.paths?.length || 0,
        };
      case 'staffing':
        return {
          confidence: 82,
          coverageGain: result.metrics?.coverageGain || result.improvements?.coverageGain || 24,
          responseTimeImprove: result.metrics?.avgResponseTime || 45,
          staffMoves: result.staffPositions?.length || result.suggestions?.length || 0,
          currentCoverage: result.currentCoverage || 68,
          optimizedCoverage: result.optimizedCoverage || 92,
          // B안: 가구 미세 조정 수
          furnitureAdjustmentsCount: result.furniture_adjustments?.items?.length || 0,
        };
      default:
        return {};
    }
  };

  const summary = getSummary();

  // 인사이트 추출
  const insights = result.insights || result.aiInsights || [];

  return (
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        <div className="flex items-center gap-2">
          {typeof summary.confidence === 'number' && (
            <span className="text-xs text-green-400">
              신뢰도 {summary.confidence.toFixed(0)}%
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>

      {/* 콘텐츠 */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* 레이아웃 최적화 결과 */}
          {type === 'layout' && (
            <>
              {/* 효율성 비교 */}
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                <div className="flex-1">
                  <div className="text-[10px] text-white/50">현재 효율</div>
                  <div className="text-sm font-medium text-white/70">{summary.currentEfficiency?.toFixed(0)}%</div>
                </div>
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div className="flex-1 text-right">
                  <div className="text-[10px] text-white/50">최적화 후</div>
                  <div className="text-sm font-medium text-green-400">{summary.optimizedEfficiency?.toFixed(0)}%</div>
                </div>
              </div>

              {/* 예상 효과 */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    예상 매출 증가
                  </div>
                  <div className="text-green-400 font-medium">
                    +{typeof summary.revenueIncrease === 'number' && summary.revenueIncrease > 100
                      ? `₩${(summary.revenueIncrease / 10000).toFixed(0)}만`
                      : `${summary.revenueIncrease}%`}
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    체류시간 증가
                  </div>
                  <div className="text-blue-400 font-medium">+{summary.dwellTimeIncrease}%</div>
                </div>
              </div>

              {/* 가구 재배치 상세 */}
              {summary.furnitureChangesCount > 0 && (
                <div className="space-y-1">
                  <button
                    onClick={() => setShowFurnitureDetails(!showFurnitureDetails)}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors w-full"
                  >
                    <Armchair className="h-3 w-3" />
                    <span>가구 재배치: {summary.furnitureChangesCount}건</span>
                    {showFurnitureDetails ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>

                  {showFurnitureDetails && result.furnitureMoves?.length > 0 && (
                    <div className="space-y-1.5 mt-1 max-h-24 overflow-y-auto">
                      {result.furnitureMoves.slice(0, 5).map((move: any, i: number) => (
                        <div key={i} className="text-[10px] bg-white/5 rounded p-1.5">
                          <div className="text-white font-medium truncate">
                            {move.furnitureName || move.furnitureLabel || move.furnitureId}
                          </div>
                          <div className="text-white/40 truncate">{move.reason || '위치 최적화'}</div>
                        </div>
                      ))}
                      {result.furnitureMoves.length > 5 && (
                        <div className="text-[9px] text-white/30 text-center">
                          +{result.furnitureMoves.length - 5}건 더보기
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 🆕 제품 재배치 상세 */}
              {summary.productChangesCount > 0 && (
                <div className="space-y-1 border-t border-purple-500/20 pt-2 mt-2">
                  <button
                    onClick={() => setShowProductDetails(!showProductDetails)}
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors w-full"
                  >
                    <Package className="h-3 w-3 text-purple-400" />
                    <span>📦 제품 재배치: {summary.productChangesCount}건</span>
                    {showProductDetails ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>

                  {showProductDetails && result.productPlacements?.length > 0 && (
                    <div className="space-y-1.5 mt-1 max-h-32 overflow-y-auto">
                      {result.productPlacements.slice(0, 6).map((placement: any, i: number) => (
                        <div key={i} className="text-[10px] bg-purple-500/10 border border-purple-500/20 rounded p-1.5">
                          {/* 제품명 */}
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-white font-medium truncate flex-1">
                              {placement.productName || placement.productLabel || placement.productSku}
                            </span>
                            {placement.productSku && (
                              <span className="text-purple-300 text-[9px] font-mono bg-purple-500/20 px-0.5 rounded shrink-0">
                                {placement.productSku}
                              </span>
                            )}
                          </div>

                          {/* 슬롯 변경 정보 */}
                          <div className="flex items-center gap-1 text-[9px]">
                            <div className="bg-red-500/20 px-1 py-0.5 rounded text-red-300 truncate flex-1 text-center">
                              {placement.fromFurniture || placement.currentFurnitureLabel || '-'}
                              {placement.fromSlot && (
                                <span className="text-red-200/60 ml-0.5">[{placement.fromSlot}]</span>
                              )}
                            </div>
                            <ArrowRight className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                            <div className="bg-green-500/20 px-1 py-0.5 rounded text-green-300 truncate flex-1 text-center">
                              {placement.toFurniture || placement.suggestedFurnitureLabel || '-'}
                              {placement.toSlot && (
                                <span className="text-green-200/60 ml-0.5">[{placement.toSlot}]</span>
                              )}
                            </div>
                          </div>

                          {/* 사유 */}
                          {placement.reason && (
                            <div className="text-purple-200/60 mt-1 truncate">
                              💡 {placement.reason}
                            </div>
                          )}
                        </div>
                      ))}
                      {result.productPlacements.length > 6 && (
                        <div className="text-[9px] text-purple-300/50 text-center">
                          +{result.productPlacements.length - 6}건 더보기
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* B안: 직원 위치 제안 (레이아웃 최적화 → 직원 연동) */}
              {summary.staffSuggestionsCount > 0 && (
                <div className="space-y-1 border-t border-cyan-500/20 pt-2 mt-2">
                  <button
                    onClick={() => setShowStaffSuggestions(!showStaffSuggestions)}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors w-full"
                  >
                    <UserCircle2 className="h-3 w-3 text-cyan-400" />
                    <span>👥 직원 위치 제안: {summary.staffSuggestionsCount}건</span>
                    <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 border-cyan-500/30 text-cyan-400">
                      선택 사항
                    </Badge>
                    {showStaffSuggestions ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>

                  {showStaffSuggestions && result.staff_suggestions?.items?.length > 0 && (
                    <div className="space-y-1.5 mt-1 max-h-32 overflow-y-auto">
                      {result.staff_suggestions.items.slice(0, 5).map((suggestion: any, i: number) => (
                        <div key={i} className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 rounded p-1.5">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-white font-medium truncate flex-1">
                              {suggestion.staff_name}
                            </span>
                            <span className="text-cyan-300 text-[9px] bg-cyan-500/20 px-1 rounded">
                              {suggestion.role}
                            </span>
                          </div>
                          {suggestion.reason && (
                            <div className="text-cyan-200/60 truncate">
                              💡 {suggestion.reason}
                            </div>
                          )}
                        </div>
                      ))}
                      {result.staff_suggestions.items.length > 5 && (
                        <div className="text-[9px] text-cyan-300/50 text-center">
                          +{result.staff_suggestions.items.length - 5}건 더보기
                        </div>
                      )}
                      <div className="text-[9px] text-cyan-400/70 mt-1 italic">
                        {result.staff_suggestions.summary?.note || '가구 배치 변경에 따른 권장 직원 위치'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 변경 사항 없음 */}
              {summary.furnitureChangesCount === 0 && summary.productChangesCount === 0 && (
                <div className="text-xs text-white/40">변경 사항 없음</div>
              )}
            </>
          )}

          {/* 동선 최적화 결과 */}
          {type === 'flow' && (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs">동선 길이 감소</div>
                  <div className="text-green-400 font-medium">-{summary.pathReduction}%</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs">이동 시간 감소</div>
                  <div className="text-blue-400 font-medium">-{summary.timeReduction}%</div>
                </div>
              </div>

              <div className="text-xs text-white/50">
                병목 지점: {summary.bottleneckCount}개 발견 | 분석 경로: {summary.pathCount}개
              </div>

              {/* 오버레이 토글 */}
              {onToggleOverlay && (
                <Button
                  onClick={toggleOverlay}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                >
                  {isOverlayVisible ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      동선 오버레이 숨기기
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      동선 오버레이 표시
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {/* 인력 배치 최적화 결과 */}
          {type === 'staffing' && (
            <>
              {/* 커버리지 비교 */}
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                <div className="flex-1">
                  <div className="text-[10px] text-white/50">현재 커버리지</div>
                  <div className="text-sm font-medium text-white/70">{summary.currentCoverage}%</div>
                </div>
                <Users className="h-4 w-4 text-green-400" />
                <div className="flex-1 text-right">
                  <div className="text-[10px] text-white/50">최적화 후</div>
                  <div className="text-sm font-medium text-green-400">{summary.optimizedCoverage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    커버리지 향상
                  </div>
                  <div className="text-green-400 font-medium">+{summary.coverageGain}%</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    평균 응답 시간
                  </div>
                  <div className="text-blue-400 font-medium">{summary.responseTimeImprove}초</div>
                </div>
              </div>

              <div className="text-xs text-white/50">
                직원 재배치 제안: {summary.staffMoves}건
              </div>

              {/* B안: 가구 미세 조정 (인력배치 최적화 → 가구 연동) */}
              {summary.furnitureAdjustmentsCount > 0 && (
                <div className="space-y-1 border-t border-orange-500/20 pt-2 mt-2">
                  <button
                    onClick={() => setShowFurnitureAdjustments(!showFurnitureAdjustments)}
                    className="flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200 transition-colors w-full"
                  >
                    <Move className="h-3 w-3 text-orange-400" />
                    <span>🪑 가구 미세 조정: {summary.furnitureAdjustmentsCount}건</span>
                    <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 border-orange-500/30 text-orange-400">
                      선택 사항
                    </Badge>
                    {showFurnitureAdjustments ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>

                  {showFurnitureAdjustments && result.furniture_adjustments?.items?.length > 0 && (
                    <div className="space-y-1.5 mt-1 max-h-32 overflow-y-auto">
                      {result.furniture_adjustments.items.slice(0, 5).map((adjustment: any, i: number) => (
                        <div key={i} className="text-[10px] bg-orange-500/10 border border-orange-500/20 rounded p-1.5">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-white font-medium truncate flex-1">
                              {adjustment.furniture_name || adjustment.furniture_type}
                            </span>
                            <span className="text-orange-300 text-[9px] bg-orange-500/20 px-1 rounded">
                              {adjustment.adjustment_distance}cm
                            </span>
                          </div>
                          {adjustment.reason && (
                            <div className="text-orange-200/60 truncate">
                              💡 {adjustment.reason}
                            </div>
                          )}
                        </div>
                      ))}
                      {result.furniture_adjustments.items.length > 5 && (
                        <div className="text-[9px] text-orange-300/50 text-center">
                          +{result.furniture_adjustments.items.length - 5}건 더보기
                        </div>
                      )}
                      <div className="text-[9px] text-orange-400/70 mt-1 italic">
                        {result.furniture_adjustments.summary?.note || '직원 동선 확보를 위한 미세 조정'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 오버레이 토글 */}
              {onToggleOverlay && (
                <Button
                  onClick={toggleOverlay}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                >
                  {isOverlayVisible ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      배치 오버레이 숨기기
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      배치 오버레이 표시
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {/* AI 인사이트 */}
          {insights.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
              <div className="text-xs text-yellow-400/80 mb-1 font-medium">AI 인사이트</div>
              <ul className="text-xs text-white/70 space-y-1">
                {insights.slice(0, 3).map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OptimizationResultPanel;
