/**
 * SimulationPanel.tsx
 *
 * 공간 시뮬레이션 패널
 * - 레이아웃 최적화 (P0)
 * - 동선 최적화 (P0)
 * - 혼잡도 시뮬레이션 (P1)
 * - 인력 배치 최적화 (P1)
 *
 * 데이터 분석 기반 시뮬레이션(수요예측, 가격/재고 최적화)은
 * 인사이트 허브 > AI추천 탭으로 이동
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layout,
  Route,
  Users,
  UserCheck,
  Play,
  Loader2,
  Lock,
  Monitor,
  Eye,
  Lightbulb,
  Info,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SimulationScenario } from '../types';
import { RealtimeSimulationPanel } from '../components/RealtimeSimulationPanel';

// ============================================================================
// 타입 정의
// ============================================================================
interface SpaceSimulationConfig {
  id: SimulationScenario;
  name: string;
  description: string;
  icon: typeof Layout;
  iconColor: string;
  priority: 'P0' | 'P1' | 'P2';
  enabled: boolean;
  locked?: boolean;
  currentMetrics?: {
    label: string;
    value: string;
    potential?: string;
  }[];
  settings?: {
    key: string;
    label: string;
    type: 'select' | 'number' | 'date';
    value: string;
    options?: string[];
  }[];
}

interface SimulationPanelProps {
  onRunSimulation?: (scenarios: SimulationScenario[]) => void;
  isRunning?: boolean;
}

// ============================================================================
// SimulationPanel 컴포넌트
// ============================================================================
export function SimulationPanel({
  onRunSimulation,
  isRunning = false,
}: SimulationPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>('layout');

  // 공간 시뮬레이션 설정
  const [spaceSimulations, setSpaceSimulations] = useState<SpaceSimulationConfig[]>([
    {
      id: 'layout',
      name: '레이아웃 최적화',
      description: '가구/존 배치 변경 효과 예측',
      icon: Layout,
      iconColor: 'text-cyan-400',
      priority: 'P0',
      enabled: true,
      currentMetrics: [
        { label: '현재 배치 효율성', value: '72%', potential: '+18%' },
      ],
      settings: [
        {
          key: 'goal',
          label: '최적화 목표',
          type: 'select',
          value: '매출 최대화',
          options: ['매출 최대화', '체류시간 최대화', '동선 최소화'],
        },
      ],
    },
    {
      id: 'flow',
      name: '동선 최적화',
      description: '고객 흐름 시뮬레이션',
      icon: Route,
      iconColor: 'text-pink-400',
      priority: 'P0',
      enabled: true,
      currentMetrics: [
        { label: '평균 동선 길이', value: '45m' },
        { label: '병목 구간', value: '입구 → A존' },
      ],
      settings: [
        {
          key: 'duration',
          label: '시뮬레이션 시간',
          type: 'select',
          value: '1시간',
          options: ['30분', '1시간', '2시간'],
        },
        {
          key: 'customers',
          label: '가상 고객 수',
          type: 'number',
          value: '100',
        },
      ],
    },
    {
      id: 'congestion',
      name: '혼잡도 시뮬레이션',
      description: '시간대별 밀집도 예측',
      icon: Users,
      iconColor: 'text-red-400',
      priority: 'P1',
      enabled: false,
      currentMetrics: [
        { label: '예상 피크 시간', value: '14:00-16:00' },
        { label: '최대 수용 인원', value: '50명' },
      ],
      settings: [
        {
          key: 'date',
          label: '예측 날짜',
          type: 'date',
          value: new Date().toISOString().split('T')[0],
        },
        {
          key: 'timeRange',
          label: '시간대',
          type: 'select',
          value: '전체',
          options: ['전체', '오전', '오후', '저녁'],
        },
      ],
    },
    {
      id: 'staffing',
      name: '인력 배치 최적화',
      description: '직원 위치별 효과 분석',
      icon: UserCheck,
      iconColor: 'text-orange-400',
      priority: 'P1',
      enabled: false,
      currentMetrics: [
        { label: '현재 직원 수', value: '3명' },
        { label: '커버리지', value: '68%' },
      ],
      settings: [
        {
          key: 'staffCount',
          label: '직원 수',
          type: 'number',
          value: '3',
        },
        {
          key: 'goal',
          label: '목표',
          type: 'select',
          value: '고객 응대 최대화',
          options: ['고객 응대 최대화', '구역 커버리지 최대화'],
        },
      ],
    },
  ]);

  // 시각화 시뮬레이션 (P2 - 향후 추가)
  const visualSimulations: SpaceSimulationConfig[] = [
    {
      id: 'layout' as SimulationScenario,
      name: '디스플레이 효과',
      description: '신상품 배치 영향 분석',
      icon: Monitor,
      iconColor: 'text-blue-400',
      priority: 'P2',
      enabled: false,
      locked: true,
    },
    {
      id: 'flow' as SimulationScenario,
      name: '시선 흐름 분석',
      description: '고객 시선 예측',
      icon: Eye,
      iconColor: 'text-purple-400',
      priority: 'P2',
      enabled: false,
      locked: true,
    },
    {
      id: 'layout' as SimulationScenario,
      name: '조명/환경 효과',
      description: '환경 변화 영향 분석',
      icon: Lightbulb,
      iconColor: 'text-yellow-400',
      priority: 'P2',
      enabled: false,
      locked: true,
    },
  ];

  const toggleEnabled = (id: string) => {
    setSpaceSimulations((prev) =>
      prev.map((sim) => (sim.id === id ? { ...sim, enabled: !sim.enabled } : sim))
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRunSingle = (id: SimulationScenario) => {
    onRunSimulation?.([id]);
  };

  const handleRunAll = () => {
    const enabledScenarios = spaceSimulations
      .filter((sim) => sim.enabled && !sim.locked)
      .map((sim) => sim.id);
    onRunSimulation?.(enabledScenarios);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-500/20 text-red-400';
      case 'P1':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'P2':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const enabledCount = spaceSimulations.filter((sim) => sim.enabled && !sim.locked).length;

  const renderSimulationCard = (sim: SpaceSimulationConfig, isVisual = false) => {
    const isExpanded = expandedId === sim.id && !isVisual;
    const Icon = sim.icon;

    return (
      <div
        key={`${sim.id}-${sim.name}`}
        className={cn(
          'rounded-lg border transition-all overflow-hidden',
          sim.locked
            ? 'bg-white/[0.02] border-white/5 opacity-50'
            : sim.enabled
            ? 'bg-white/5 border-white/20'
            : 'bg-transparent border-white/10'
        )}
      >
        {/* 헤더 */}
        <div
          className={cn(
            'flex items-center gap-3 p-3',
            !sim.locked && 'cursor-pointer'
          )}
          onClick={() => !sim.locked && toggleExpanded(sim.id)}
        >
          {!sim.locked && (
            <Switch
              checked={sim.enabled}
              onCheckedChange={() => toggleEnabled(sim.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div
            className={cn(
              'p-1.5 rounded',
              sim.enabled && !sim.locked ? 'bg-primary/20' : 'bg-white/10'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4',
                sim.enabled && !sim.locked ? sim.iconColor : 'text-white/40'
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-white">{sim.name}</h4>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium',
                  getPriorityColor(sim.priority)
                )}
              >
                {sim.priority}
              </span>
              {sim.locked && <Lock className="w-3 h-3 text-white/40" />}
            </div>
            <p className="text-xs text-white/50 truncate">{sim.description}</p>
          </div>

          {!sim.locked &&
            (isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            ))}
        </div>

        {/* 확장 내용 */}
        {isExpanded && !sim.locked && (
          <div className="px-3 pb-3 space-y-3 border-t border-white/10">
            {/* 현재 메트릭 */}
            {sim.currentMetrics && sim.currentMetrics.length > 0 && (
              <div className="pt-3 space-y-1.5">
                {sim.currentMetrics.map((metric, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white/40">{metric.label}</span>
                    <span className="text-white/80">
                      {metric.value}
                      {metric.potential && (
                        <span className="text-green-400 ml-1">({metric.potential})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 설정 */}
            {sim.settings && sim.settings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/60 font-medium">설정</p>
                {sim.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-white/40">{setting.label}</span>
                    {setting.type === 'select' && (
                      <Select defaultValue={setting.value}>
                        <SelectTrigger className="w-32 h-7 text-xs bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {setting.type === 'number' && (
                      <Input
                        type="number"
                        defaultValue={setting.value}
                        className="w-20 h-7 text-xs bg-white/5 border-white/10"
                      />
                    )}
                    {setting.type === 'date' && (
                      <Input
                        type="date"
                        defaultValue={setting.value}
                        className="w-32 h-7 text-xs bg-white/5 border-white/10"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 실행 버튼 */}
            <Button
              size="sm"
              className="w-full gap-2 bg-primary/80 hover:bg-primary"
              disabled={!sim.enabled || isRunning}
              onClick={(e) => {
                e.stopPropagation();
                handleRunSingle(sim.id);
              }}
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              시뮬레이션 실행
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-4">
      {/* 🆕 실시간 시뮬레이션 패널 */}
      <RealtimeSimulationPanel />

      {/* 구분선 */}
      <div className="border-t border-gray-700" />

      {/* 안내 메시지 */}
      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-blue-200/80">
          데이터 분석 기반 예측(수요/가격/재고)은{' '}
          <span className="text-blue-300 font-medium">인사이트 허브 &gt; AI추천</span> 탭에서
          확인하세요.
        </p>
      </div>

      {/* 공간 시뮬레이션 */}
      <div>
        <h3 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2 px-1">
          <Layout className="w-3.5 h-3.5" />
          공간 시뮬레이션
        </h3>
        <div className="space-y-2">
          {spaceSimulations.map((sim) => renderSimulationCard(sim))}
        </div>
      </div>

      {/* 시각화 시뮬레이션 (P2 - 향후 추가) */}
      <div>
        <h3 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2 px-1">
          <Eye className="w-3.5 h-3.5" />
          시각화 시뮬레이션 (P2 - 향후 추가)
        </h3>
        <div className="space-y-2">
          {visualSimulations.map((sim) => renderSimulationCard(sim, true))}
        </div>
      </div>

      {/* 전체 실행 버튼 */}
      <Button
        className="w-full gap-2 mt-4"
        disabled={enabledCount === 0 || isRunning}
        onClick={handleRunAll}
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        선택된 시뮬레이션 실행 ({enabledCount})
      </Button>
    </div>
  );
}

export default SimulationPanel;
