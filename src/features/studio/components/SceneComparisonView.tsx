/**
 * SceneComparisonView.tsx
 *
 * As-is / To-be 씬 비교 UI 컴포넌트
 * - Split View (좌우 분할)
 * - Overlay View (겹쳐서 보기)
 * - 변경 사항 목록 및 선택
 */

import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Check,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Columns,
  Layers,
  Save,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Move,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SceneComparison, SceneChange } from '../utils/ToBeSceneGenerator';
import type { SceneSimulationState } from '../hooks/useSceneSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

interface SceneComparisonViewProps {
  comparison: SceneComparison | null;
  viewMode: SceneSimulationState['viewMode'];
  selectedChanges: string[];
  onViewModeChange: (mode: SceneSimulationState['viewMode']) => void;
  onSelectChange: (changeId: string) => void;
  onDeselectChange: (changeId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApplySelected: () => void;
  onApplyAll: () => void;
  onSaveToBeScene: (name: string) => void;
  onReset: () => void;
  isApplying?: boolean;
  className?: string;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function SceneComparisonView({
  comparison,
  viewMode,
  selectedChanges,
  onViewModeChange,
  onSelectChange,
  onDeselectChange,
  onSelectAll,
  onDeselectAll,
  onApplySelected,
  onApplyAll,
  onSaveToBeScene,
  onReset,
  isApplying = false,
  className,
}: SceneComparisonViewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['changes', 'summary']);
  const [saveSceneName, setSaveSceneName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // 변경 사항 그룹화
  const groupedChanges = useMemo(() => {
    if (!comparison) return {};

    return comparison.changes.reduce(
      (acc, change) => {
        const key = change.assetType;
        if (!acc[key]) acc[key] = [];
        acc[key].push(change);
        return acc;
      },
      {} as Record<string, SceneChange[]>
    );
  }, [comparison]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleSaveScene = () => {
    if (saveSceneName.trim()) {
      onSaveToBeScene(saveSceneName.trim());
      setSaveSceneName('');
      setShowSaveInput(false);
    }
  };

  if (!comparison) {
    return (
      <div className={cn('p-4 text-center text-white/50', className)}>
        <p className="text-sm">시뮬레이션을 실행하면 결과가 여기에 표시됩니다.</p>
      </div>
    );
  }

  const selectedCount = selectedChanges.length;
  const totalChanges = comparison.changes.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 헤더 - 뷰 모드 전환 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-sm font-medium text-white">씬 비교</h3>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={viewMode === 'split' ? 'secondary' : 'ghost'}
            className="h-7 px-2"
            onClick={() => onViewModeChange('split')}
            title="분할 뷰"
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'overlay' ? 'secondary' : 'ghost'}
            className="h-7 px-2"
            onClick={() => onViewModeChange('overlay')}
            title="오버레이 뷰"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'asIs' ? 'secondary' : 'ghost'}
            className="h-7 px-2"
            onClick={() => onViewModeChange('asIs')}
            title="As-is만 보기"
          >
            As-is
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'toBe' ? 'secondary' : 'ghost'}
            className="h-7 px-2"
            onClick={() => onViewModeChange('toBe')}
            title="To-be만 보기"
          >
            To-be
          </Button>
        </div>
      </div>

      {/* 요약 */}
      <div
        className="border-b border-white/10 cursor-pointer"
        onClick={() => toggleSection('summary')}
      >
        <div className="flex items-center justify-between p-3">
          <span className="text-xs font-medium text-white/60">최적화 요약</span>
          {expandedSections.includes('summary') ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>

        {expandedSections.includes('summary') && (
          <div className="px-3 pb-3 grid grid-cols-3 gap-2">
            <SummaryCard
              label="효율성"
              value={`+${comparison.summary.expectedImpact.efficiency.toFixed(1)}%`}
              color="text-green-400"
            />
            <SummaryCard
              label="매출 효과"
              value={`+${comparison.summary.expectedImpact.revenue.toFixed(1)}%`}
              color="text-blue-400"
            />
            <SummaryCard
              label="트래픽"
              value={`+${comparison.summary.expectedImpact.traffic.toFixed(1)}%`}
              color="text-purple-400"
            />
          </div>
        )}
      </div>

      {/* 변경 사항 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer sticky top-0 bg-black/90 backdrop-blur-sm z-10"
          onClick={() => toggleSection('changes')}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/60">변경 사항</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {totalChanges}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* 전체 선택/해제 */}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                selectedCount === totalChanges ? onDeselectAll() : onSelectAll();
              }}
            >
              {selectedCount === totalChanges ? '전체 해제' : '전체 선택'}
            </Button>
            {expandedSections.includes('changes') ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </div>
        </div>

        {expandedSections.includes('changes') && (
          <div className="p-2 space-y-3">
            {Object.entries(groupedChanges).map(([assetType, changes]) => (
              <ChangeGroup
                key={assetType}
                assetType={assetType}
                changes={changes}
                selectedChanges={selectedChanges}
                onSelect={onSelectChange}
                onDeselect={onDeselectChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* 선택된 변경 수 */}
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>
            {selectedCount > 0
              ? `${selectedCount}/${totalChanges}개 선택됨`
              : '변경 사항을 선택하세요'}
          </span>
        </div>

        {/* 씬 저장 */}
        {showSaveInput ? (
          <div className="flex gap-2">
            <Input
              value={saveSceneName}
              onChange={(e) => setSaveSceneName(e.target.value)}
              placeholder="씬 이름 입력"
              className="h-8 text-xs bg-white/5 border-white/10"
              autoFocus
            />
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={handleSaveScene}
              disabled={!saveSceneName.trim()}
            >
              저장
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => setShowSaveInput(false)}
            >
              취소
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => setShowSaveInput(true)}
            >
              <Save className="w-3 h-3 mr-1" />
              To-be 씬 저장
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={onReset}
              title="초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 적용 버튼 */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 h-9"
            onClick={onApplySelected}
            disabled={selectedCount === 0 || isApplying}
          >
            선택 적용 ({selectedCount})
          </Button>
          <Button
            size="sm"
            className="flex-1 h-9 bg-green-600 hover:bg-green-700"
            onClick={onApplyAll}
            disabled={totalChanges === 0 || isApplying}
          >
            전체 적용
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 서브 컴포넌트
// ============================================================================

interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className={cn('text-lg font-bold', color)}>{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
    </div>
  );
}

interface ChangeGroupProps {
  assetType: string;
  changes: SceneChange[];
  selectedChanges: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

function ChangeGroup({
  assetType,
  changes,
  selectedChanges,
  onSelect,
  onDeselect,
}: ChangeGroupProps) {
  const typeLabels: Record<string, string> = {
    furniture: '가구',
    product: '상품',
    zone: '구역/인력',
  };

  const typeColors: Record<string, string> = {
    furniture: 'bg-cyan-500/20 text-cyan-400',
    product: 'bg-purple-500/20 text-purple-400',
    zone: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Badge className={cn('text-[10px] px-1.5 py-0', typeColors[assetType])}>
          {typeLabels[assetType] || assetType}
        </Badge>
        <span className="text-[10px] text-white/40">{changes.length}개</span>
      </div>

      <div className="space-y-1">
        {changes.map((change) => (
          <ChangeItem
            key={change.id}
            change={change}
            isSelected={selectedChanges.includes(change.id)}
            onToggle={() => {
              if (selectedChanges.includes(change.id)) {
                onDeselect(change.id);
              } else {
                onSelect(change.id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ChangeItemProps {
  change: SceneChange;
  isSelected: boolean;
  onToggle: () => void;
}

function ChangeItem({ change, isSelected, onToggle }: ChangeItemProps) {
  const getChangeIcon = () => {
    switch (change.type) {
      case 'move':
        return <Move className="w-3 h-3 text-blue-400" />;
      case 'add':
        return <Plus className="w-3 h-3 text-green-400" />;
      case 'remove':
        return <Minus className="w-3 h-3 text-red-400" />;
      default:
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
    }
  };

  const getChangeTypeLabel = () => {
    switch (change.type) {
      case 'move':
        return '이동';
      case 'add':
        return '추가';
      case 'remove':
        return '제거';
      default:
        return '변경';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/20 border border-primary/40' : 'bg-white/5 hover:bg-white/10'
      )}
      onClick={onToggle}
    >
      {/* 체크박스 */}
      <div className="mt-0.5">
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-primary" />
        ) : (
          <Square className="w-4 h-4 text-white/40" />
        )}
      </div>

      {/* 변경 아이콘 */}
      <div className="mt-0.5">{getChangeIcon()}</div>

      {/* 변경 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white truncate">{change.assetName}</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
            {getChangeTypeLabel()}
          </Badge>
        </div>

        {/* 위치 변경 정보 */}
        {change.type === 'move' && change.before?.position && change.after?.position && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-white/50">
            <span className="font-mono">
              ({change.before.position.x.toFixed(1)}, {change.before.position.z.toFixed(1)})
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-mono text-green-400">
              ({change.after.position.x.toFixed(1)}, {change.after.position.z.toFixed(1)})
            </span>
          </div>
        )}

        {/* 이유 및 영향 */}
        {change.reason && (
          <div className="text-[10px] text-white/40 mt-0.5 truncate">{change.reason}</div>
        )}
        {change.impact && (
          <div className="text-[10px] text-green-400 mt-0.5">{change.impact}</div>
        )}
      </div>
    </div>
  );
}

export default SceneComparisonView;
