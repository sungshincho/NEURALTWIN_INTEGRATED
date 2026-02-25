/**
 * DiagnosticIssueList.tsx
 *
 * AI 시뮬레이션에서 발견된 문제점 리스트
 * - 심각도별 색상 코딩 (critical: red, warning: yellow, info: blue)
 * - 접기/펼치기 기능
 * - AI 최적화 탭으로 연결 버튼
 */

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입 정의
// ============================================================================

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface DiagnosticIssue {
  id: string;
  severity: IssueSeverity;
  zone?: string;
  title: string;
  metric?: string;
  impact: string;
  recommendation?: string;
  // simulation.types.ts 호환
  zone_name?: string;
  zone_id?: string;
  description?: string;
  category?: string;
  current_value?: number;
  threshold_value?: number;
  suggested_action?: string;
  // AIOptimizationTab 호환
  message?: string;
  scenario_context?: {
    name: string;
    description?: string;
  };
  environment_context?: unknown;
  simulation_kpis?: unknown;
}

interface DiagnosticIssueListProps {
  issues: DiagnosticIssue[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onNavigateToOptimization?: (issues: DiagnosticIssue[]) => void;
  className?: string;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

const getSeverityConfig = (severity: IssueSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/50',
        label: '심각',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        label: '경고',
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        label: '정보',
      };
  }
};

// ============================================================================
// 컴포넌트
// ============================================================================

export function DiagnosticIssueList({
  issues,
  isExpanded: isExpandedProp,
  onToggleExpand,
  onNavigateToOptimization,
  className,
}: DiagnosticIssueListProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = isExpandedProp ?? internalExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // 심각도별 카운트
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 헤더 */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span>발견된 문제점 ({issues.length}건)</span>
        </div>

        {/* 심각도 요약 배지 */}
        <div className="flex items-center gap-1">
          {criticalCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-400 border-red-500/50">
              🔴 {criticalCount}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
              🟠 {warningCount}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/20 text-blue-400 border-blue-500/50">
              🔵 {infoCount}
            </Badge>
          )}
        </div>
      </button>

      {/* 이슈 리스트 */}
      {isExpanded && (
        <div className="space-y-2">
          {issues.map((issue) => {
            const config = getSeverityConfig(issue.severity);
            const Icon = config.icon;

            return (
              <div
                key={issue.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    {/* 제목 및 존 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', config.badgeClass)}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-sm font-medium text-white">
                        {issue.title}
                      </span>
                    </div>

                    {/* 존 위치 */}
                    {(issue.zone || issue.zone_name) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
                        <MapPin className="w-3 h-3" />
                        {issue.zone || issue.zone_name}
                      </div>
                    )}

                    {/* 메트릭 및 영향 */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {(issue.metric || issue.category || issue.description) && (
                        <span className={cn('font-medium', config.color)}>
                          {issue.metric || issue.category || issue.description}
                        </span>
                      )}
                      {issue.impact && (
                        <span className="flex items-center gap-1 text-white/50">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          {issue.impact}
                        </span>
                      )}
                    </div>

                    {/* 권장사항 */}
                    {(issue.recommendation || issue.suggested_action) && (
                      <p className="mt-2 text-xs text-white/40 italic">
                        💡 {issue.recommendation || issue.suggested_action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI 최적화로 해결하기 버튼 */}
          {onNavigateToOptimization && (
            <Button
              onClick={() => onNavigateToOptimization(issues)}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI 최적화로 문제 해결하기 →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default DiagnosticIssueList;
