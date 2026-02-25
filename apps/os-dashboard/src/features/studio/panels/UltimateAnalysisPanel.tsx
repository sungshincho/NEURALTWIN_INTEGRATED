/**
 * UltimateAnalysisPanel.tsx
 *
 * Ultimate AI 최적화 분석 결과 표시 패널
 * - 동선 분석 (Flow Analysis)
 * - VMD 분석 (Visual Merchandising Display)
 * - 환경 영향 (Environment Impact)
 * - 연관 상품 추천 (Association Rules)
 * - 예측 신뢰도 (Prediction Confidence)
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Eye,
  Cloud,
  Link2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Zap,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  FlowAnalysisSummary,
  EnvironmentSummary,
  AssociationSummary,
  PredictionSummary,
  VMDAnalysis,
} from '../types';

interface UltimateAnalysisPanelProps {
  flowAnalysis?: FlowAnalysisSummary;
  environment?: EnvironmentSummary;
  association?: AssociationSummary;
  prediction?: PredictionSummary;
  vmd?: VMDAnalysis;
  overallConfidence?: number;
}

export function UltimateAnalysisPanel({
  flowAnalysis,
  environment,
  association,
  prediction,
  vmd,
  overallConfidence,
}: UltimateAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['flow', 'vmd'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // 분석 데이터가 없으면 렌더링하지 않음
  if (!flowAnalysis && !environment && !association && !vmd && !prediction) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* 전체 신뢰도 배지 */}
      {overallConfidence !== undefined && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Ultimate AI 분석</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/60">신뢰도</span>
            <span className={cn(
              "text-sm font-bold",
              overallConfidence >= 80 ? "text-green-400" :
              overallConfidence >= 60 ? "text-yellow-400" : "text-red-400"
            )}>
              {overallConfidence}%
            </span>
          </div>
        </div>
      )}

      {/* 동선 분석 */}
      {flowAnalysis && (
        <CollapsibleSection
          id="flow"
          title="동선 분석"
          icon={<Activity className="h-4 w-4" />}
          isExpanded={expandedSections.has('flow')}
          onToggle={() => toggleSection('flow')}
          badge={
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              (flowAnalysis?.flow_health_score ?? 0) >= 80 ? "bg-green-500/20 text-green-400" :
              (flowAnalysis?.flow_health_score ?? 0) >= 60 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            )}>
              건강도 {flowAnalysis?.flow_health_score ?? 0}점
            </span>
          }
        >
          <div className="space-y-2">
            {/* 주요 지표 */}
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="주요 경로"
                value={flowAnalysis?.key_paths?.length ?? 0}
                unit="개"
                color="blue"
              />
              <MetricCard
                label="병목"
                value={flowAnalysis?.bottleneck_count ?? 0}
                unit="개"
                color={(flowAnalysis?.bottleneck_count ?? 0) > 2 ? "red" : "yellow"}
              />
              <MetricCard
                label="데드존"
                value={flowAnalysis?.dead_zone_count ?? 0}
                unit="개"
                color={(flowAnalysis?.dead_zone_count ?? 0) > 0 ? "red" : "green"}
              />
            </div>

            {/* 병목 지점 */}
            {(flowAnalysis?.bottlenecks?.length ?? 0) > 0 && (
              <div className="mt-2">
                <div className="text-[10px] text-white/50 mb-1">병목 지점</div>
                <div className="space-y-1">
                  {(flowAnalysis?.bottlenecks ?? []).slice(0, 3).map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[10px] bg-red-500/10 rounded px-2 py-1"
                    >
                      <span className="text-red-300">{b.zone}</span>
                      <span className={cn(
                        "px-1.5 rounded text-[9px]",
                        b.severity === 'high' ? "bg-red-500/30 text-red-300" :
                        "bg-yellow-500/30 text-yellow-300"
                      )}>
                        {b.severity === 'high' ? '심각' : '주의'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 기회 영역 */}
            {(flowAnalysis?.opportunities?.length ?? 0) > 0 && (
              <div className="mt-2">
                <div className="text-[10px] text-white/50 mb-1">개선 기회</div>
                <div className="space-y-1">
                  {(flowAnalysis?.opportunities ?? []).slice(0, 2).map((o, i) => (
                    <div
                      key={i}
                      className="text-[10px] bg-green-500/10 rounded px-2 py-1 text-green-300"
                    >
                      <span className="text-green-400 mr-1">💡</span>
                      {o.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* VMD 분석 */}
      {vmd && (
        <CollapsibleSection
          id="vmd"
          title="VMD 점수"
          icon={<Eye className="h-4 w-4" />}
          isExpanded={expandedSections.has('vmd')}
          onToggle={() => toggleSection('vmd')}
          badge={
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded",
              vmd?.score?.grade === 'A' ? "bg-green-500/30 text-green-400" :
              vmd?.score?.grade === 'B' ? "bg-blue-500/30 text-blue-400" :
              vmd?.score?.grade === 'C' ? "bg-yellow-500/30 text-yellow-400" :
              "bg-red-500/30 text-red-400"
            )}>
              {vmd?.score?.grade ?? '-'}등급 ({vmd?.score?.overall ?? 0}점)
            </span>
          }
        >
          <div className="space-y-2">
            {/* 세부 점수 */}
            <div className="grid grid-cols-2 gap-2">
              <ScoreBar label="균형" value={vmd?.score?.balance ?? 0} />
              <ScoreBar label="가시성" value={vmd?.score?.visibility ?? 0} />
              <ScoreBar label="동선연계" value={vmd?.score?.flow_integration ?? 0} />
              <ScoreBar label="카테고리" value={vmd?.score?.category_coherence ?? 0} />
            </div>

            {/* 위반 사항 */}
            {(vmd?.violations?.length ?? 0) > 0 && (
              <div className="mt-2">
                <div className="text-[10px] text-white/50 mb-1">개선 필요</div>
                <div className="space-y-1">
                  {(vmd?.violations ?? []).slice(0, 3).map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-1.5 text-[10px] rounded px-2 py-1",
                        v.severity === 'high' ? "bg-red-500/10 text-red-300" :
                        v.severity === 'medium' ? "bg-yellow-500/10 text-yellow-300" :
                        "bg-white/5 text-white/60"
                      )}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* 환경 영향 */}
      {environment && (
        <CollapsibleSection
          id="environment"
          title="환경 영향"
          icon={<Cloud className="h-4 w-4" />}
          isExpanded={expandedSections.has('environment')}
          onToggle={() => toggleSection('environment')}
          badge={
            environment.weather ? (
              <span className="text-xs text-white/60">
                {environment.weather.condition} {environment.weather.temperature}°C
              </span>
            ) : null
          }
        >
          <div className="space-y-2">
            {/* 날씨 영향 */}
            {environment.weather && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-white">
                    {environment.weather.condition}
                  </span>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  (environment?.impact_multipliers?.traffic ?? 1) > 1 ? "text-green-400" :
                  (environment?.impact_multipliers?.traffic ?? 1) < 1 ? "text-red-400" :
                  "text-white/60"
                )}>
                  트래픽 {(environment?.impact_multipliers?.traffic ?? 1) > 1 ? '+' : ''}
                  {(((environment?.impact_multipliers?.traffic ?? 1) - 1) * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {/* 이벤트 */}
            {(environment?.events?.length ?? 0) > 0 && (
              <div>
                <div className="text-[10px] text-white/50 mb-1">오늘의 이벤트</div>
                {(environment?.events ?? []).slice(0, 2).map((e, i) => (
                  <div
                    key={i}
                    className="text-[10px] bg-purple-500/10 rounded px-2 py-1 text-purple-300 mb-1"
                  >
                    <span className="text-purple-400 mr-1">📅</span>
                    {e.name}
                    <span className={cn(
                      "ml-2 px-1 rounded text-[9px]",
                      e.impact === 'high' ? "bg-green-500/30 text-green-300" :
                      "bg-white/10 text-white/50"
                    )}>
                      {e.impact === 'high' ? '높은 영향' : '보통'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 시간대 정보 */}
            <div className="flex items-center gap-2 text-[10px] text-white/50">
              <span>{environment?.temporal?.dayOfWeek ?? '-'}</span>
              <span>•</span>
              <span>{environment?.temporal?.isWeekend ? '주말' : '평일'}</span>
              <span>•</span>
              <span>{environment?.temporal?.timeOfDay ?? '-'}</span>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* 연관 분석 */}
      {association && (
        <CollapsibleSection
          id="association"
          title="연관 상품 추천"
          icon={<Link2 className="h-4 w-4" />}
          isExpanded={expandedSections.has('association')}
          onToggle={() => toggleSection('association')}
          badge={
            <span className="text-xs text-white/60">
              {association?.strong_rules_count ?? 0}개 규칙
            </span>
          }
        >
          <div className="space-y-2">
            {/* 상위 연관 규칙 */}
            {(association?.top_rules ?? []).slice(0, 3).map((rule, i) => (
              <div
                key={i}
                className="text-[10px] bg-white/5 rounded px-2 py-1.5"
              >
                <div className="text-white/80 mb-1">{rule.rule}</div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="text-green-400">신뢰도 {rule.confidence}</span>
                  <span className="text-white/30">•</span>
                  <span className={cn(
                    rule.strength === '매우 강함' ? "text-purple-400" :
                    rule.strength === '강함' ? "text-blue-400" : "text-white/50"
                  )}>
                    {rule.strength}
                  </span>
                </div>
              </div>
            ))}

            {/* 배치 추천 */}
            {(association?.recommendations?.length ?? 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-[10px] text-white/50 mb-1">배치 추천</div>
                {(association?.recommendations ?? []).slice(0, 2).map((r, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-blue-300 flex items-start gap-1.5"
                  >
                    <Zap className="h-3 w-3 shrink-0 mt-0.5 text-blue-400" />
                    <span>{r.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* 예측 요약 */}
      {prediction && (
        <CollapsibleSection
          id="prediction"
          title="예측 분석"
          icon={<BarChart3 className="h-4 w-4" />}
          isExpanded={expandedSections.has('prediction')}
          onToggle={() => toggleSection('prediction')}
          badge={
            <span className={cn(
              "text-xs font-medium",
              (prediction?.total_expected_revenue_change ?? 0) > 0 ? "text-green-400" : "text-red-400"
            )}>
              매출 {(prediction?.total_expected_revenue_change ?? 0) > 0 ? '+' : ''}
              {(prediction?.total_expected_revenue_change ?? 0).toFixed(1)}%
            </span>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="고신뢰 변경"
                value={prediction?.high_confidence_changes ?? 0}
                unit="건"
                color="green"
              />
              <MetricCard
                label="일 매출 증가"
                value={prediction?.total_daily_revenue_increase ?? 0}
                unit="원"
                color="blue"
                format="currency"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-white/50">예측 적용:</span>
              <span className="text-white">{prediction?.predictions_applied ?? 0}건</span>
              <span className="text-white/30">|</span>
              <span className="text-white/50">신뢰도:</span>
              <span className={cn(
                (prediction?.overall_confidence ?? 0) >= 80 ? "text-green-400" :
                (prediction?.overall_confidence ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {prediction?.overall_confidence ?? 0}%
              </span>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============================================================================
// 하위 컴포넌트
// ============================================================================

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  badge,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/60">{icon}</span>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-2.5 pt-0">{children}</div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  format?: 'number' | 'currency';
}

function MetricCard({ label, value, unit, color, format = 'number' }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  const formatValue = (v: number) => {
    if (format === 'currency') {
      if (v >= 10000) {
        return `${(v / 10000).toFixed(1)}만`;
      }
      return v.toLocaleString();
    }
    return v.toString();
  };

  return (
    <div className="p-2 bg-white/5 rounded text-center">
      <div className="text-[9px] text-white/50 mb-0.5">{label}</div>
      <div className={cn("text-sm font-bold", colorClasses[color])}>
        {formatValue(value)}{unit !== '원' && <span className="text-[10px] font-normal ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const percentage = Math.min(100, Math.max(0, value));
  const color =
    percentage >= 80 ? 'bg-green-500' :
    percentage >= 60 ? 'bg-blue-500' :
    percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] mb-0.5">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80">{value}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default UltimateAnalysisPanel;
