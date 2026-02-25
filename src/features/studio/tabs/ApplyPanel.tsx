/**
 * ApplyPanel.tsx
 *
 * 적용하기 패널 - 4번째 탭
 * - 저장된 시나리오 관리 (localStorage 연동)
 * - 시나리오 비교
 * - 실매장 적용 및 ROI 측정 연계 (applied_strategies 테이블)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
  ExternalLink,
  Printer,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppliedStrategies, useApplyStrategy } from '@/features/roi/hooks/useAppliedStrategies';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// 타입 정의
// ============================================================================

interface StoredScenario {
  id: string;
  name: string;
  createdAt: string;
  goal: string;
  optimizations: string[];
  results: {
    layout?: any;
    flow?: any;
    staffing?: any;
  };
  settings: any;
}

interface ScenarioChange {
  id: string;
  type: 'furniture' | 'product' | 'staff';
  item: string;
  from: string;
  to: string;
  expectedEffect: string;
  estimatedTime: string;
  completed?: boolean;
}

interface TransformedScenario {
  id: string;
  name: string;
  createdAt: string;
  changesCount: number;
  expectedRevenue: number;
  expectedConversion: number;
  implementationCost: number;
  expectedROI: number;
  difficulty: 'low' | 'medium' | 'high';
  changes: ScenarioChange[];
  originalData: StoredScenario;
}

interface ApplyPanelProps {
  storeId: string;
  onApplyScenario?: (scenarioId: string) => void;
  onNavigateToROI?: () => void;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

const LOCAL_STORAGE_KEY = 'optimization_scenarios';

// localStorage에서 시나리오 로드
const loadScenariosFromStorage = (): StoredScenario[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading scenarios from localStorage:', error);
  }
  return [];
};

// 시나리오 삭제
const deleteScenarioFromStorage = (scenarioId: string): StoredScenario[] => {
  const scenarios = loadScenariosFromStorage();
  const filtered = scenarios.filter((s) => s.id !== scenarioId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

// 저장된 시나리오를 표시용으로 변환
const transformScenario = (scenario: StoredScenario): TransformedScenario => {
  const changes: ScenarioChange[] = [];
  let furnitureMoves = 0;
  let productMoves = 0;
  let staffChanges = 0;

  // Layout 결과에서 변경사항 추출
  if (scenario.results?.layout) {
    const layoutResult = scenario.results.layout;

    // furniture_moves 추출
    const furnitureMovesData = layoutResult.furniture_moves || layoutResult.furnitureMoves || [];
    furnitureMovesData.forEach((move: any, idx: number) => {
      changes.push({
        id: `furniture-${idx}`,
        type: 'furniture',
        item: move.furniture_name || move.furniture_code || `가구 ${idx + 1}`,
        from: move.current_position
          ? `(${move.current_position.x?.toFixed(1)}, ${move.current_position.z?.toFixed(1)})`
          : '현재 위치',
        to: move.suggested_position || move.new_position
          ? `(${(move.suggested_position?.x || move.new_position?.x || 0).toFixed(1)}, ${(move.suggested_position?.z || move.new_position?.z || 0).toFixed(1)})`
          : '최적 위치',
        expectedEffect: move.reason || move.expected_effect || '동선 개선',
        estimatedTime: '예상 15분',
      });
      furnitureMoves++;
    });

    // product_placements 추출
    const productPlacements = layoutResult.product_placements || layoutResult.productPlacements || [];
    productPlacements.forEach((placement: any, idx: number) => {
      changes.push({
        id: `product-${idx}`,
        type: 'product',
        item: placement.product_name || placement.product_sku || `제품 ${idx + 1}`,
        from: placement.from_slot || placement.current_slot || '현재 슬롯',
        to: placement.to_slot || placement.suggested_slot || '추천 슬롯',
        expectedEffect: placement.reason || '노출 증가',
        estimatedTime: '예상 5분',
      });
      productMoves++;
    });
  }

  // Flow 결과에서 변경사항 추출
  if (scenario.results?.flow) {
    const flowResult = scenario.results.flow;
    const suggestions = flowResult.path_suggestions || flowResult.suggestions || [];

    suggestions.forEach((suggestion: any, idx: number) => {
      if (suggestion.type === 'furniture' || suggestion.action_type === 'move_furniture') {
        changes.push({
          id: `flow-furniture-${idx}`,
          type: 'furniture',
          item: suggestion.furniture_name || suggestion.target || `항목 ${idx + 1}`,
          from: suggestion.from || '현재',
          to: suggestion.to || suggestion.suggestion || '권장',
          expectedEffect: suggestion.expected_improvement || '동선 개선',
          estimatedTime: '예상 20분',
        });
        furnitureMoves++;
      }
    });
  }

  // Staffing 결과에서 변경사항 추출
  if (scenario.results?.staffing) {
    const staffingResult = scenario.results.staffing;
    const recommendations = staffingResult.zone_recommendations || staffingResult.recommendations || [];

    recommendations.forEach((rec: any, idx: number) => {
      if (rec.change_needed || rec.recommended_count !== rec.current_count) {
        changes.push({
          id: `staff-${idx}`,
          type: 'staff',
          item: rec.zone_name || `구역 ${idx + 1}`,
          from: `${rec.current_count || 0}명`,
          to: `${rec.recommended_count || rec.suggested_count || 0}명`,
          expectedEffect: rec.reason || '서비스 개선',
          estimatedTime: '즉시 적용',
        });
        staffChanges++;
      }
    });
  }

  // 예상 지표 계산
  const totalChanges = furnitureMoves + productMoves + staffChanges;
  const expectedRevenue = scenario.results?.layout?.expected_revenue_increase
    || scenario.results?.layout?.expectedRevenueIncrease
    || Math.min(totalChanges * 3, 30); // 변경 건수당 3%, 최대 30%
  const expectedConversion = expectedRevenue * 0.8; // 매출 대비 80%
  const implementationCost = furnitureMoves * 50000 + productMoves * 10000 + staffChanges * 30000;
  const expectedROI = implementationCost > 0
    ? Math.round((expectedRevenue * 1000000 / implementationCost) * 100)
    : 0;

  // 난이도 계산
  let difficulty: 'low' | 'medium' | 'high' = 'low';
  if (totalChanges > 10 || furnitureMoves > 5) {
    difficulty = 'high';
  } else if (totalChanges > 5 || furnitureMoves > 2) {
    difficulty = 'medium';
  }

  return {
    id: scenario.id,
    name: scenario.name,
    createdAt: new Date(scenario.createdAt).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    changesCount: totalChanges,
    expectedRevenue,
    expectedConversion,
    implementationCost,
    expectedROI,
    difficulty,
    changes,
    originalData: scenario,
  };
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ApplyPanel({ storeId, onApplyScenario, onNavigateToROI }: ApplyPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // localStorage 시나리오 상태
  const [storedScenarios, setStoredScenarios] = useState<StoredScenario[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);

  // 변환된 시나리오
  const scenarios = useMemo(
    () => storedScenarios.map(transformScenario),
    [storedScenarios]
  );

  // UI 상태
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['comparison', 'checklist']));
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Supabase에서 적용 중인 전략 조회
  const { data: appliedStrategies, isLoading: isLoadingStrategies, refetch: refetchStrategies } = useAppliedStrategies('90d', { status: 'active' });

  // 전략 적용 뮤테이션
  const applyStrategyMutation = useApplyStrategy();

  // 초기 로드
  useEffect(() => {
    const loadScenarios = () => {
      setIsLoadingScenarios(true);
      const loaded = loadScenariosFromStorage();
      setStoredScenarios(loaded);
      if (loaded.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(loaded[0].id);
      }
      setIsLoadingScenarios(false);
    };

    loadScenarios();
  }, []);

  // 선택된 시나리오
  const selectedScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId),
    [scenarios, selectedScenarioId]
  );

  // 시나리오 새로고침
  const handleRefresh = useCallback(() => {
    const loaded = loadScenariosFromStorage();
    setStoredScenarios(loaded);
    toast.success('시나리오 목록을 새로고침했습니다');
  }, []);

  // 시나리오 삭제
  const handleDeleteScenario = useCallback((scenarioId: string) => {
    const updated = deleteScenarioFromStorage(scenarioId);
    setStoredScenarios(updated);
    if (selectedScenarioId === scenarioId && updated.length > 0) {
      setSelectedScenarioId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedScenarioId('');
    }
    toast.success('시나리오가 삭제되었습니다');
  }, [selectedScenarioId]);

  // 섹션 토글
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // 작업 완료 토글
  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 실매장 적용 핸들러
  const handleApply = async () => {
    if (!selectedScenario) {
      toast.error('시나리오를 선택해주세요');
      return;
    }

    try {
      // Supabase에 전략 저장
      const result = await applyStrategyMutation.mutateAsync({
        source: '3d_simulation',
        sourceModule: 'layout_optimization',
        name: selectedScenario.name,
        description: `${selectedScenario.changesCount}건 변경, 예상 매출 +${selectedScenario.expectedRevenue}%`,
        settings: selectedScenario.originalData,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
        expectedRoi: Number(selectedScenario.expectedRevenue) || 0,
        expectedRevenue: (Number(selectedScenario.expectedRevenue) || 0) * 10000, // 예상 추가 매출
        baselineMetrics: {
          changesCount: selectedScenario.changesCount,
          difficultyLevel: selectedScenario.difficulty === 'high' ? 3 : selectedScenario.difficulty === 'medium' ? 2 : 1,
          implementationCost: selectedScenario.implementationCost,
        },
      });

      toast.success(`"${selectedScenario.name}" 적용 및 ROI 측정을 시작합니다`);
      onApplyScenario?.(selectedScenario.id);

      // 전략 목록 새로고침
      refetchStrategies();

      // ROI 페이지로 이동 옵션
      setTimeout(() => {
        if (window.confirm('ROI 대시보드로 이동하시겠습니까?')) {
          navigate(`/roi?strategy=${result.id}`);
        }
      }, 500);
    } catch (error) {
      console.error('Error applying strategy:', error);
      toast.error('전략 적용에 실패했습니다');
    }
  };

  // ROI 페이지 이동
  const handleNavigateToROI = (strategyId?: string) => {
    if (strategyId) {
      navigate(`/roi?strategy=${strategyId}`);
    } else {
      navigate('/roi');
    }
    onNavigateToROI?.();
  };

  // 난이도 색상
  const getDifficultyColor = (difficulty: 'low' | 'medium' | 'high') => {
    switch (difficulty) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
    }
  };

  const getDifficultyLabel = (difficulty: 'low' | 'medium' | 'high') => {
    switch (difficulty) {
      case 'low': return '하';
      case 'medium': return '중';
      case 'high': return '상';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">적용하기</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-xs text-white/60 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateToROI()}
            className="text-xs border-white/20 text-white/80 hover:bg-white/10"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            ROI 대시보드
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* 저장된 시나리오 목록 */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-white/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            저장된 시나리오
            {scenarios.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-white/30 text-white/60">
                {scenarios.length}건
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {isLoadingScenarios ? (
            <div className="flex items-center justify-center py-8 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              불러오는 중...
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">저장된 시나리오가 없습니다</p>
              <p className="text-xs mt-1">AI 최적화 탭에서 시나리오를 저장해주세요</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedScenarioId}
              onValueChange={setSelectedScenarioId}
              className="space-y-2"
            >
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group',
                    selectedScenarioId === scenario.id
                      ? 'bg-primary/20 border border-primary/40'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  )}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  <RadioGroupItem value={scenario.id} id={scenario.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={scenario.id}
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      {scenario.name}
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-white/60">
                      <span>{scenario.changesCount}건 변경</span>
                      <span>•</span>
                      <span className="text-green-400">+{scenario.expectedRevenue.toFixed(1)}% 매출</span>
                      <span>•</span>
                      <span>{scenario.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      난이도 {getDifficultyLabel(scenario.difficulty)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScenario(scenario.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* 시나리오 비교 테이블 */}
      {scenarios.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('comparison')}
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white w-full"
          >
            {expandedSections.has('comparison') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <BarChart3 className="w-4 h-4 text-purple-400" />
            시나리오 비교
          </button>

          {expandedSections.has('comparison') && (
            <div className="bg-white/5 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-white/60">지표</th>
                    {scenarios.slice(0, 3).map((s) => (
                      <th
                        key={s.id}
                        className={cn(
                          'text-center p-2',
                          s.id === selectedScenarioId ? 'text-primary' : 'text-white/60'
                        )}
                      >
                        {s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60">예상 매출</td>
                    {scenarios.slice(0, 3).map((s) => (
                      <td key={s.id} className="text-center p-2 text-green-400">
                        +{s.expectedRevenue.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60">전환율</td>
                    {scenarios.slice(0, 3).map((s) => (
                      <td key={s.id} className="text-center p-2 text-blue-400">
                        +{s.expectedConversion.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60">구현 비용</td>
                    {scenarios.slice(0, 3).map((s) => (
                      <td key={s.id} className="text-center p-2 text-white/80">
                        ₩{(s.implementationCost / 10000).toFixed(0)}만
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-2 text-white/60">예상 ROI</td>
                    {scenarios.slice(0, 3).map((s) => (
                      <td key={s.id} className="text-center p-2 text-yellow-400 font-medium">
                        {s.expectedROI}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 text-white/60">난이도</td>
                    {scenarios.slice(0, 3).map((s) => (
                      <td key={s.id} className="text-center p-2">
                        <Badge className={cn('text-[10px]', getDifficultyColor(s.difficulty))}>
                          {getDifficultyLabel(s.difficulty)}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 구현 체크리스트 */}
      {selectedScenario && selectedScenario.changes.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('checklist')}
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white w-full"
          >
            {expandedSections.has('checklist') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <FileText className="w-4 h-4 text-orange-400" />
            구현 체크리스트
            <Badge variant="outline" className="text-[10px] border-white/30 text-white/60">
              {completedTasks.size}/{selectedScenario.changes.length}
            </Badge>
          </button>

          {expandedSections.has('checklist') && (
            <div className="space-y-2">
              {selectedScenario.changes.map((change) => (
                <div
                  key={change.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg bg-white/5 transition-colors',
                    completedTasks.has(change.id) && 'bg-green-500/10'
                  )}
                >
                  <Checkbox
                    checked={completedTasks.has(change.id)}
                    onCheckedChange={() => toggleTask(change.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          change.type === 'furniture' ? 'border-blue-500/50 text-blue-400' :
                          change.type === 'product' ? 'border-green-500/50 text-green-400' :
                          'border-purple-500/50 text-purple-400'
                        )}
                      >
                        {change.type === 'furniture' ? '가구' : change.type === 'product' ? '제품' : '직원'}
                      </Badge>
                      <span className={cn(
                        'text-sm',
                        completedTasks.has(change.id) ? 'text-white/50 line-through' : 'text-white'
                      )}>
                        {change.item}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {change.from} → {change.to}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-green-400">{change.expectedEffect}</span>
                      <span className="text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {change.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 체크리스트 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => {
                    // 체크리스트 인쇄용 HTML 생성
                    const printContent = selectedScenario.changes.map((c) =>
                      `☐ [${c.type}] ${c.item}: ${c.from} → ${c.to} (${c.estimatedTime})`
                    ).join('\n');
                    navigator.clipboard.writeText(printContent);
                    toast.success('체크리스트가 클립보드에 복사되었습니다');
                  }}
                >
                  <Printer className="w-3 h-3 mr-1" />
                  복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => toast.info('담당자 할당 기능은 준비 중입니다')}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  담당자 할당
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 적용 버튼 */}
      <Button
        onClick={handleApply}
        disabled={!selectedScenario || applyStrategyMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {applyStrategyMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            적용 중...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            실매장에 적용하고 ROI 측정 시작
          </>
        )}
      </Button>

      {/* 적용 중인 전략 */}
      {(appliedStrategies && appliedStrategies.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <TrendingUp className="w-4 h-4 text-green-400" />
            적용 중인 전략 ({appliedStrategies.length}건)
          </div>

          <div className="space-y-2">
            {appliedStrategies.slice(0, 5).map((strategy) => (
              <div
                key={strategy.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleNavigateToROI(strategy.id)}
              >
                <div>
                  <div className="text-sm text-white">{strategy.name}</div>
                  <div className="text-xs text-white/60">
                    적용일: {new Date(strategy.startDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-400 font-medium">
                    {strategy.currentRoi !== null ? `+${strategy.currentRoi}%` : '측정중'}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      strategy.status === 'active' ? 'border-green-500/50 text-green-400' :
                      'border-white/30 text-white/60'
                    )}
                  >
                    {strategy.status === 'active' ? '측정중' : '완료'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300/80">
          시나리오를 적용하면 ROI 대시보드에서 실시간으로 효과를 측정할 수 있습니다.
          변경사항은 체크리스트를 통해 단계별로 구현하세요.
        </p>
      </div>
    </div>
  );
}

export default ApplyPanel;
