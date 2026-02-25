/**
 * DiagnosticsSummary.tsx
 *
 * AI 시뮬레이션에서 전달받은 진단 결과 요약 표시
 * - AI 최적화 탭 상단에 배치
 * - 발견된 문제점 수와 심각도별 카운트
 * - 최적화 제안 표시
 */

import {
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { DiagnosticIssue, IssueSeverity } from './DiagnosticIssueList';

// ============================================================================
// 타입 정의
// ============================================================================

interface DiagnosticsSummaryProps {
  issues: DiagnosticIssue[];
  className?: string;
  defaultExpanded?: boolean;
  onOptimizeClick?: (issues: DiagnosticIssue[]) => void;
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
        label: '심각',
        emoji: '🔴',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        label: '경고',
        emoji: '🟠',
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        label: '정보',
        emoji: '🔵',
      };
  }
};

// ============================================================================
// 컴포넌트
// ============================================================================

export function DiagnosticsSummary({
  issues,
  className,
  defaultExpanded = false,
  onOptimizeClick,
}: DiagnosticsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 심각도별 카운트
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  // 이슈가 없으면 렌더링하지 않음
  if (issues.length === 0) {
    return (
      <div className={cn('p-3 bg-green-500/10 border border-green-500/30 rounded-lg', className)}>
        <div className="flex items-center gap-2 text-green-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">모든 지표가 정상입니다</span>
        </div>
        <p className="text-xs text-white/50 mt-1">
          AI 시뮬레이션에서 발견된 문제가 없습니다.
        </p>
      </div>
    );
  }

  // 최우선 해결 필요 이슈
  const priorityIssues = issues
    .filter((i) => i.severity === 'critical' || i.severity === 'warning')
    .slice(0, 3);

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        criticalCount > 0
          ? 'bg-red-500/10 border-red-500/30'
          : warningCount > 0
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-blue-500/10 border-blue-500/30',
        className
      )}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'w-4 h-4',
              criticalCount > 0
                ? 'text-red-400'
                : warningCount > 0
                ? 'text-yellow-400'
                : 'text-blue-400'
            )}
          />
          <span className="text-sm font-medium text-white">
            AI 시뮬레이션 진단 결과
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0',
              criticalCount > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : warningCount > 0
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            )}
          >
            {issues.length}건
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* 심각도 배지 */}
          <div className="flex items-center gap-1">
            {criticalCount > 0 && (
              <span className="text-[10px] text-red-400">🔴{criticalCount}</span>
            )}
            {warningCount > 0 && (
              <span className="text-[10px] text-yellow-400">🟠{warningCount}</span>
            )}
            {infoCount > 0 && (
              <span className="text-[10px] text-blue-400">🔵{infoCount}</span>
            )}
          </div>

          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* 확장 시 상세 내용 */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* 우선 해결 이슈 */}
          {priorityIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/50 font-medium">
                ⚡ 우선 해결 필요
              </p>
              {priorityIssues.map((issue) => {
                const config = getSeverityConfig(issue.severity);
                const Icon = config.icon;
                return (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-2 rounded-lg flex items-start gap-2',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5 mt-0.5', config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {issue.title}
                      </p>
                      <p className="text-[10px] text-white/50">
                        {issue.zone || issue.zone_name || '전체'}
                        {(issue.metric || issue.category) && ` • ${issue.metric || issue.category}`}
                      </p>
                      {(issue.recommendation || issue.suggested_action) && (
                        <p className="text-[10px] text-white/40 mt-1 italic">
                          💡 {issue.recommendation || issue.suggested_action}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 최적화 제안 요약 */}
          <div className="p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <p className="text-xs text-purple-300 font-medium mb-1">
              💡 AI 최적화 제안
            </p>
            <p className="text-[10px] text-white/60">
              {criticalCount > 0 && `심각한 문제 ${criticalCount}건 발견. `}
              {warningCount > 0 && `경고 ${warningCount}건 발견. `}
              아래 최적화를 실행하여 문제를 해결하세요.
            </p>
          </div>

          {/* AI 최적화 실행 버튼 */}
          {onOptimizeClick && (
            <button
              onClick={() => onOptimizeClick(issues)}
              className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              발견된 문제 기반으로 최적화 실행
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DiagnosticsSummary;
