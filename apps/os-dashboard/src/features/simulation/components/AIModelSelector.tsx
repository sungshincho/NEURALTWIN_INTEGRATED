import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  Package,
  DollarSign,
  Grid3x3,
  Target,
  Settings2,
  Sparkles,
  Calendar,
  Percent,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 시뮬레이션 시나리오 타입
 */
export type SimulationScenario = 'demand' | 'inventory' | 'pricing' | 'layout' | 'marketing';

export interface SimulationScenarioConfig {
  id: SimulationScenario;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  requiredData: string[];
}

export interface SimulationParameters {
  dataRange: number;        // 분석할 과거 데이터 기간 (일)
  forecastPeriod: number;   // 예측 기간 (일)
  confidenceLevel: number;  // 신뢰도 (0-100)
  includeSeasonality: boolean;   // 계절성 반영
  includeExternalFactors: boolean;  // 외부 요인 반영 (날씨, 경제지표 등)
}

interface AIModelSelectorProps {
  scenarios: SimulationScenarioConfig[];
  selectedScenarios: SimulationScenario[];
  parameters: SimulationParameters;
  onScenarioToggle: (scenario: SimulationScenario) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onParameterChange: (params: Partial<SimulationParameters>) => void;
  onRunSimulation: () => void;
  isRunning?: boolean;
  disabled?: boolean;
}

/**
 * AIModelSelector
 * 
 * AI 추론 모델 선택 및 파라미터 설정 컴포넌트
 * - 시뮬레이션 시나리오 선택 (수요예측, 재고, 가격, 레이아웃, 마케팅)
 * - 분석 파라미터 설정 (기간, 신뢰도 등)
 */
export function AIModelSelector({
  scenarios,
  selectedScenarios,
  parameters,
  onScenarioToggle,
  onSelectAll,
  onDeselectAll,
  onParameterChange,
  onRunSimulation,
  isRunning = false,
  disabled = false,
}: AIModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 시나리오 아이콘 매핑
  const getScenarioIcon = (id: SimulationScenario) => {
    const icons: Record<SimulationScenario, React.ReactNode> = {
      demand: <TrendingUp className="h-4 w-4" />,
      inventory: <Package className="h-4 w-4" />,
      pricing: <DollarSign className="h-4 w-4" />,
      layout: <Grid3x3 className="h-4 w-4" />,
      marketing: <Target className="h-4 w-4" />,
    };
    return icons[id];
  };

  // 시나리오 색상 매핑
  const getScenarioColor = (id: SimulationScenario) => {
    const colors: Record<SimulationScenario, string> = {
      demand: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      inventory: 'text-green-500 bg-green-500/10 border-green-500/20',
      pricing: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      layout: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      marketing: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    };
    return colors[id];
  };

  // 데이터 범위 옵션
  const dataRangeOptions = [
    { value: 7, label: '최근 7일' },
    { value: 14, label: '최근 14일' },
    { value: 30, label: '최근 30일' },
    { value: 60, label: '최근 60일' },
    { value: 90, label: '최근 90일' },
  ];

  // 예측 기간 옵션
  const forecastPeriodOptions = [
    { value: 7, label: '향후 7일' },
    { value: 14, label: '향후 14일' },
    { value: 30, label: '향후 30일' },
    { value: 60, label: '향후 60일' },
  ];

  const selectedCount = selectedScenarios.length;
  const allSelected = selectedCount === scenarios.length;
  const noneSelected = selectedCount === 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
        
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI 추론 모델 설정</CardTitle>
                  <CardDescription>
                    {selectedCount}개 시나리오 선택됨 · 분석 기간 {parameters.dataRange}일
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunSimulation();
                  }}
                  disabled={disabled || isRunning || noneSelected}
                  className="gap-2"
                >
                  {isRunning ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      시뮬레이션 실행
                    </>
                  )}
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* 시나리오 선택 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">시뮬레이션 시나리오</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSelectAll}
                    disabled={allSelected}
                    className="text-xs h-7"
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeselectAll}
                    disabled={noneSelected}
                    className="text-xs h-7"
                  >
                    전체 해제
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {scenarios.map((scenario) => {
                  const isSelected = selectedScenarios.includes(scenario.id);
                  const colorClass = getScenarioColor(scenario.id);
                  
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => onScenarioToggle(scenario.id)}
                      disabled={disabled || !scenario.enabled}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isSelected 
                          ? colorClass
                          : "border-border bg-card hover:bg-accent/50",
                        !scenario.enabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSelected ? "" : "bg-muted"
                      )}>
                        {getScenarioIcon(scenario.id)}
                      </div>
                      <span className="text-xs font-medium text-center">
                        {scenario.name}
                      </span>
                      {!scenario.enabled && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          데이터 필요
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 기본 파라미터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 데이터 범위 */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  분석 데이터 범위
                </Label>
                <Select
                  value={String(parameters.dataRange)}
                  onValueChange={(v) => onParameterChange({ dataRange: Number(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataRangeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 예측 기간 */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  예측 기간
                </Label>
                <Select
                  value={String(parameters.forecastPeriod)}
                  onValueChange={(v) => onParameterChange({ forecastPeriod: Number(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {forecastPeriodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 고급 설정 토글 */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 w-full justify-center">
                  <Settings2 className="h-4 w-4" />
                  고급 설정
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4 space-y-4">
                {/* 신뢰도 슬라이더 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      신뢰도 수준
                    </Label>
                    <Badge variant="outline">{parameters.confidenceLevel}%</Badge>
                  </div>
                  <Slider
                    value={[parameters.confidenceLevel]}
                    onValueChange={([v]) => onParameterChange({ confidenceLevel: v })}
                    min={70}
                    max={99}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    높은 신뢰도 = 보수적 예측, 낮은 신뢰도 = 공격적 예측
                  </p>
                </div>

                {/* 옵션 스위치들 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">계절성 반영</Label>
                      <p className="text-xs text-muted-foreground">
                        주간/월간/연간 패턴 분석
                      </p>
                    </div>
                    <Switch
                      checked={parameters.includeSeasonality}
                      onCheckedChange={(v) => onParameterChange({ includeSeasonality: v })}
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">외부 요인 반영</Label>
                      <p className="text-xs text-muted-foreground">
                        날씨, 경제지표, 공휴일 등
                      </p>
                    </div>
                    <Switch
                      checked={parameters.includeExternalFactors}
                      onCheckedChange={(v) => onParameterChange({ includeExternalFactors: v })}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 선택된 시나리오 요약 */}
            {selectedCount > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">실행 예정:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedScenarios.map((id) => {
                      const scenario = scenarios.find(s => s.id === id);
                      return scenario ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {scenario.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/**
 * 기본 시나리오 설정 (export)
 */
export const defaultScenarios: SimulationScenarioConfig[] = [
  {
    id: 'demand',
    name: '수요 예측',
    description: '향후 수요량과 트렌드를 예측합니다',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'blue',
    enabled: true,
    requiredData: ['purchases', 'visits'],
  },
  {
    id: 'inventory',
    name: '재고 최적화',
    description: '최적 재고 수준과 발주 시점을 제안합니다',
    icon: <Package className="h-4 w-4" />,
    color: 'green',
    enabled: true,
    requiredData: ['inventory_levels', 'products'],
  },
  {
    id: 'pricing',
    name: '가격 최적화',
    description: '가격 탄력성 기반 최적 가격을 제안합니다',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'yellow',
    enabled: true,
    requiredData: ['products', 'purchases'],
  },
  {
    id: 'layout',
    name: '레이아웃 최적화',
    description: '매장 공간 배치 최적화를 제안합니다',
    icon: <Grid3x3 className="h-4 w-4" />,
    color: 'cyan',
    enabled: true,
    requiredData: ['wifi_tracking', 'zones_dim'],
  },
  {
    id: 'marketing',
    name: '마케팅 전략',
    description: '고객 세그먼트별 마케팅 전략을 제안합니다',
    icon: <Target className="h-4 w-4" />,
    color: 'purple',
    enabled: true,
    requiredData: ['customers', 'customer_segments_agg'],
  },
];

/**
 * 기본 파라미터 (export)
 */
export const defaultParameters: SimulationParameters = {
  dataRange: 30,
  forecastPeriod: 7,
  confidenceLevel: 85,
  includeSeasonality: true,
  includeExternalFactors: true,
};
