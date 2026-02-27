/**
 * OptimizationPanel.tsx
 *
 * AI 최적화 결과 패널 컴포넌트
 * - 최적화 제안 목록 표시
 * - 개별 제안 선택/적용
 * - 예상 영향도 시각화
 * - 일괄 적용/롤백
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sparkles,
  TrendingUp,
  Package,
  Armchair,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import type { AILayoutOptimizationResult, Vector3D } from '@/types/scene3d';

// ============================================================================
// 타입 정의
// ============================================================================

interface OptimizationPanelProps {
  result: AILayoutOptimizationResult | null;
  isLoading?: boolean;
  onApplyChange?: (changeId: string, type: 'furniture' | 'product') => void;
  onRejectChange?: (changeId: string, type: 'furniture' | 'product') => void;
  onApplyAll?: () => void;
  onRejectAll?: () => void;
  onPreview?: (changeId: string, type: 'furniture' | 'product') => void;
  onRefresh?: () => void;
  selectedChangeIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

interface ChangeItemProps {
  id: string;
  type: 'furniture' | 'product';
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  fromPosition: Vector3D;
  toPosition: Vector3D;
  isSelected: boolean;
  isApplied?: boolean;
  onSelect: () => void;
  onApply: () => void;
  onReject: () => void;
  onPreview: () => void;
}

// ============================================================================
// 유틸리티
// ============================================================================

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

const priorityLabels = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

function formatPosition(pos: Vector3D): string {
  return `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
}

function calculateDistance(from: Vector3D, to: Vector3D): number {
  return Math.sqrt(
    Math.pow(to.x - from.x, 2) +
    Math.pow(to.y - from.y, 2) +
    Math.pow(to.z - from.z, 2)
  );
}

// ============================================================================
// 변경 항목 컴포넌트
// ============================================================================

function ChangeItem({
  id,
  type,
  name,
  reason,
  priority,
  impact,
  fromPosition,
  toPosition,
  isSelected,
  isApplied,
  onSelect,
  onApply,
  onReject,
  onPreview,
}: ChangeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const distance = calculateDistance(fromPosition, toPosition);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={`border rounded-lg transition-colors ${
          isApplied
            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            : isSelected
            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
            : 'bg-background hover:bg-muted/50'
        }`}
      >
        <div className="p-3 flex items-center gap-3">
          {/* 체크박스 */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            disabled={isApplied}
          />

          {/* 아이콘 */}
          <div className={`p-2 rounded-full ${type === 'furniture' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {type === 'furniture' ? (
              <Armchair className="w-4 h-4 text-blue-600" />
            ) : (
              <Package className="w-4 h-4 text-purple-600" />
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{name}</span>
              <Badge
                variant="outline"
                className={`${priorityColors[priority]} bg-opacity-20 text-xs`}
              >
                {priorityLabels[priority]}
              </Badge>
              {isApplied && (
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  적용됨
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{reason}</p>
          </div>

          {/* 영향도 */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="w-4 h-4" />
              +{impact.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">{distance.toFixed(1)}m 이동</div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPreview}
              title="미리보기"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* 이동 정보 */}
              <div>
                <div className="text-muted-foreground mb-1">이동 전</div>
                <code className="bg-muted px-2 py-1 rounded">{formatPosition(fromPosition)}</code>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">이동 후</div>
                <code className="bg-muted px-2 py-1 rounded">{formatPosition(toPosition)}</code>
              </div>
            </div>

            {/* 상세 이유 */}
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">최적화 이유</div>
              <p className="text-sm">{reason}</p>
            </div>

            {/* 액션 버튼 */}
            {!isApplied && (
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={onReject}>
                  <X className="w-4 h-4 mr-1" />
                  제외
                </Button>
                <Button size="sm" onClick={onApply}>
                  <Check className="w-4 h-4 mr-1" />
                  적용
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// 요약 통계 컴포넌트
// ============================================================================

interface SummaryStatsProps {
  summary: AILayoutOptimizationResult['summary'];
}

function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">
          {summary.total_furniture_changes + summary.total_product_changes}
        </div>
        <div className="text-xs text-muted-foreground">총 변경</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          +{summary.expected_revenue_improvement.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground">예상 매출</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          +{summary.expected_traffic_improvement.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground">예상 동선</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">
          +{summary.expected_conversion_improvement.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground">예상 전환</div>
      </div>
    </div>
  );
}

// ============================================================================
// 메인 OptimizationPanel 컴포넌트
// ============================================================================

export function OptimizationPanel({
  result,
  isLoading = false,
  onApplyChange,
  onRejectChange,
  onApplyAll,
  onRejectAll,
  onPreview,
  onRefresh,
  selectedChangeIds = [],
  onSelectionChange,
}: OptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'furniture' | 'product'>('all');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // 변경 목록 통합
  const allChanges = useMemo(() => {
    if (!result) return [];

    const furniture = (result.furniture_changes || []).map((c) => ({
      id: c.furniture_id,
      type: 'furniture' as const,
      name: c.furniture_type,
      reason: c.reason,
      priority: c.priority,
      impact: c.expected_impact,
      fromPosition: c.current.position,
      toPosition: c.suggested.position,
    }));

    const products = (result.product_changes || []).map((c) => ({
      id: c.product_id,
      type: 'product' as const,
      name: c.sku,
      reason: c.reason,
      priority: c.priority,
      impact: c.expected_revenue_impact,
      fromPosition: c.current.position,
      toPosition: c.suggested.position,
    }));

    return [...furniture, ...products];
  }, [result]);

  // 필터링된 변경 목록
  const filteredChanges = useMemo(() => {
    if (activeTab === 'all') return allChanges;
    return allChanges.filter((c) => c.type === activeTab);
  }, [allChanges, activeTab]);

  // 선택 토글
  const handleSelect = useCallback(
    (id: string) => {
      const newIds = selectedChangeIds.includes(id)
        ? selectedChangeIds.filter((i) => i !== id)
        : [...selectedChangeIds, id];
      onSelectionChange?.(newIds);
    },
    [selectedChangeIds, onSelectionChange]
  );

  // 전체 선택
  const handleSelectAll = useCallback(() => {
    const allIds = filteredChanges.map((c) => c.id);
    onSelectionChange?.(allIds);
  }, [filteredChanges, onSelectionChange]);

  // 전체 선택 해제
  const handleDeselectAll = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // 개별 적용
  const handleApply = useCallback(
    (id: string, type: 'furniture' | 'product') => {
      onApplyChange?.(id, type);
      setAppliedIds((prev) => new Set(prev).add(id));
    },
    [onApplyChange]
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="font-medium mb-2">AI 최적화 분석 중...</h3>
          <p className="text-sm text-muted-foreground">
            매장 레이아웃과 상품 배치를 분석하고 있습니다
          </p>
          <Progress value={66} className="mt-4 max-w-xs mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // 결과 없음
  if (!result) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">최적화 결과 없음</h3>
          <p className="text-sm text-muted-foreground mb-4">
            AI 최적화를 실행하여 레이아웃 개선 제안을 받으세요
          </p>
          <Button onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            최적화 실행
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI 최적화 제안
            </CardTitle>
            <CardDescription>
              {new Date(result.created_at).toLocaleString('ko-KR')} 생성
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            새로고침
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
        {/* 요약 통계 */}
        <SummaryStats summary={result.summary} />

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                전체 ({allChanges.length})
              </TabsTrigger>
              <TabsTrigger value="furniture">
                <Armchair className="w-4 h-4 mr-1" />
                가구 ({result.furniture_changes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="product">
                <Package className="w-4 h-4 mr-1" />
                상품 ({result.product_changes?.length || 0})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 text-xs">
              <Button variant="link" size="sm" onClick={handleSelectAll}>
                전체 선택
              </Button>
              <Button variant="link" size="sm" onClick={handleDeselectAll}>
                선택 해제
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {filteredChanges.map((change) => (
                  <ChangeItem
                    key={change.id}
                    {...change}
                    isSelected={selectedChangeIds.includes(change.id)}
                    isApplied={appliedIds.has(change.id)}
                    onSelect={() => handleSelect(change.id)}
                    onApply={() => handleApply(change.id, change.type)}
                    onReject={() => onRejectChange?.(change.id, change.type)}
                    onPreview={() => onPreview?.(change.id, change.type)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* 하단 액션 바 */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedChangeIds.length}개 선택됨
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRejectAll}
              disabled={selectedChangeIds.length === 0}
            >
              <XCircle className="w-4 h-4 mr-1" />
              선택 제외
            </Button>
            <Button
              onClick={onApplyAll}
              disabled={selectedChangeIds.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              선택 적용
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OptimizationPanel;
