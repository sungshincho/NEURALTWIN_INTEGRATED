/**
 * StaffOptimizationResult.tsx
 *
 * 인력 배치 최적화 결과 상세 UI 컴포넌트
 */

import React, { useState } from 'react';
import {
  Users,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  StaffOptimizationResult,
  StaffReallocation,
} from '../types/staffOptimization.types';
import { ROLE_LABELS, ROLE_ICONS } from '../types/staffOptimization.types';

interface StaffOptimizationResultPanelProps {
  result: StaffOptimizationResult;
  onViewIn3D?: () => void;
  onApply?: () => void;
  isOverlayVisible?: boolean;
  onToggleOverlay?: (visible: boolean) => void;
}

export const StaffOptimizationResultPanel: React.FC<StaffOptimizationResultPanelProps> = ({
  result,
  onApply,
  isOverlayVisible = false,
  onToggleOverlay,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // 🔧 FIX: null/undefined 체크 - summary와 overall_impact가 없을 수 있음
  const summary = result?.summary ?? {
    total_staff: 0,
    reallocated_count: result?.reallocations?.length ?? 0,
    efficiency_before: 0,
    efficiency_after: 0,
    efficiency_change: 0,
  };

  const overallImpact = result?.overall_impact ?? {
    customer_response_rate_change: 0,
    wait_time_change: 0,
    coverage_change: 0,
    peak_hour_coverage: 0,
  };

  const reallocations = result?.reallocations ?? [];
  const insights = result?.insights ?? [];
  // 🔧 FIX: confidence가 객체일 수 있음 - {overall, factors} 구조 처리
  const confidenceValue = typeof result?.confidence === 'object'
    ? (result?.confidence as any)?.overall ?? 0
    : result?.confidence ?? 0;
  const confidence = Math.round(confidenceValue * 100);

  return (
    <div className="bg-muted/30 rounded-lg border">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">직원 배치</span>
          <span className="text-xs text-green-500">완료</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            신뢰도 {confidence}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* 효율성 변화 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {summary.efficiency_before}%
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-green-500">
              {summary.efficiency_after}%
            </span>
            {summary.efficiency_change > 0 && (
              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                +{summary.efficiency_change}%p
              </span>
            )}
          </div>

          {/* 요약 */}
          <div className="text-xs text-muted-foreground">
            • 직원 {summary.total_staff}명 | 재배치{' '}
            {summary.reallocated_count}명
          </div>

          {/* 전체 효과 뱃지 */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
              고객 응대율: +{overallImpact.customer_response_rate_change}%
            </span>
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">
              대기 시간: {overallImpact.wait_time_change}%
            </span>
            <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded">
              커버리지: +{overallImpact.coverage_change}%
            </span>
          </div>

          {/* 상세 토글 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 border-t border-dashed"
          >
            {showDetails
              ? '상세 정보 숨기기'
              : `상세 정보 보기 (${reallocations.length}명)`}
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* 상세 재배치 목록 */}
          {showDetails && (
            <div className="space-y-2 max-h-72 overflow-auto">
              {reallocations.map((realloc, idx) => (
                <StaffReallocationCard key={idx} reallocation={realloc} />
              ))}

              {/* AI 인사이트 */}
              {insights.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <div className="flex items-center gap-1 text-xs font-medium text-yellow-600 mb-1">
                    <Lightbulb className="w-3 h-3" />
                    AI 인사이트
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {insights.map((insight, i) => (
                      <li key={i}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onToggleOverlay?.(!isOverlayVisible)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition"
            >
              {isOverlayVisible ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              3D 보기
            </button>
            <button
              onClick={onApply}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 개별 직원 재배치 카드 =====
interface StaffReallocationCardProps {
  reallocation: StaffReallocation;
}

const StaffReallocationCard: React.FC<StaffReallocationCardProps> = ({
  reallocation: r,
}) => {
  const priorityStyles = {
    high: 'border-l-red-500 bg-red-500/5',
    medium: 'border-l-yellow-500 bg-yellow-500/5',
    low: 'border-l-blue-500 bg-blue-500/5',
  };

  const priorityLabels = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  };

  return (
    <div className={cn('p-2.5 rounded border-l-2', priorityStyles[r.priority])}>
      {/* 직원 정보 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{ROLE_ICONS[r.role] || '👤'}</span>
          <div>
            <div className="font-medium text-sm">{r.staff_name}</div>
            <div className="text-xs text-muted-foreground">
              {r.staff_code} • {ROLE_LABELS[r.role] || r.role}
            </div>
          </div>
        </div>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            r.priority === 'high' && 'bg-red-500/20 text-red-500',
            r.priority === 'medium' && 'bg-yellow-500/20 text-yellow-600',
            r.priority === 'low' && 'bg-blue-500/20 text-blue-500'
          )}
        >
          {priorityLabels[r.priority]}
        </span>
      </div>

      {/* 이동 정보 */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-red-400" />
          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">
            {r.from_zone_name}
          </span>
        </div>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-green-400" />
          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">
            {r.to_zone_name}
          </span>
        </div>
      </div>

      {/* 재배치 이유 */}
      <div className="text-xs text-muted-foreground mb-2 leading-relaxed">
        💡 {r.reason}
      </div>

      {/* 예상 효과 */}
      <div className="flex flex-wrap gap-1">
        {r.expected_impact.coverage_change_pct !== 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">
            커버리지{' '}
            {r.expected_impact.coverage_change_pct > 0 ? '+' : ''}
            {r.expected_impact.coverage_change_pct}%
          </span>
        )}
        {r.expected_impact.response_time_change_sec !== 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
            응대시간 {r.expected_impact.response_time_change_sec}초
          </span>
        )}
        {r.expected_impact.customers_served_change !== 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">
            응대고객{' '}
            {r.expected_impact.customers_served_change > 0 ? '+' : ''}
            {r.expected_impact.customers_served_change}명
          </span>
        )}
      </div>
    </div>
  );
};

export default StaffOptimizationResultPanel;
