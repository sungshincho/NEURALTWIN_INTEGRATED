/**
 * OverlayControlPanel.tsx
 *
 * 오버레이 컨트롤 패널
 * - 오버레이 토글
 * - 오버레이 설정
 */

import { useState } from 'react';
import {
  Thermometer,
  Users,
  Route,
  MapPin,
  Clock,
  Package,
  Wifi,
  Layout,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OverlayType, OverlayConfig } from '../types';

// ============================================================================
// Props
// ============================================================================
interface OverlayControlPanelProps {
  activeOverlays?: string[];
  onToggle?: (overlayId: string) => void;
  onSettingsChange?: (overlayId: string, settings: any) => void;
  compact?: boolean;
}

// ============================================================================
// 오버레이 정의
// ============================================================================
const overlayDefinitions: {
  id: OverlayType;
  name: string;
  icon: typeof Thermometer;
  color: string;
  description: string;
}[] = [
  {
    id: 'heatmap',
    name: '히트맵',
    icon: Thermometer,
    color: 'text-red-400',
    description: '방문자 밀집도',
  },
  {
    id: 'flow',
    name: '동선',
    icon: Route,
    color: 'text-blue-400',
    description: '고객 이동 패턴',
  },
  {
    id: 'avatar',
    name: '고객 아바타',
    icon: Users,
    color: 'text-green-400',
    description: '실시간 고객 위치',
  },
  {
    id: 'zone',
    name: '존 경계',
    icon: MapPin,
    color: 'text-purple-400',
    description: '매장 구역 표시',
  },
  {
    id: 'dwell',
    name: '체류 시간',
    icon: Clock,
    color: 'text-yellow-400',
    description: '구역별 체류 시간',
  },
  {
    id: 'product',
    name: '상품 정보',
    icon: Package,
    color: 'text-orange-400',
    description: '상품 재고/수요',
  },
  {
    id: 'wifi',
    name: 'WiFi 추적',
    icon: Wifi,
    color: 'text-cyan-400',
    description: 'WiFi 기반 추적',
  },
  {
    id: 'layout',
    name: '레이아웃 변경',
    icon: Layout,
    color: 'text-pink-400',
    description: 'Before/After 비교',
  },
];

// ============================================================================
// OverlayControlPanel 컴포넌트
// ============================================================================
export function OverlayControlPanel({
  activeOverlays = [],
  onToggle,
  onSettingsChange,
  compact = false,
}: OverlayControlPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSettingsId, setExpandedSettingsId] = useState<string | null>(null);

  const activeCount = activeOverlays.length;

  if (compact) {
    return (
      <CompactOverlayPanel
        activeOverlays={activeOverlays}
        onToggle={onToggle}
        expanded={expanded}
        setExpanded={setExpanded}
      />
    );
  }

  return (
    <div className="w-56 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Eye className="w-4 h-4" />
          오버레이
          {activeCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/30">
              {activeCount}
            </span>
          )}
        </h3>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </div>

      {/* 오버레이 목록 */}
      {expanded && (
        <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
          {overlayDefinitions.map((overlay) => {
            const isActive = activeOverlays.includes(overlay.id);
            const isSettingsExpanded = expandedSettingsId === overlay.id;

            return (
              <div
                key={overlay.id}
                className={cn(
                  'rounded-lg transition-colors',
                  isActive ? 'bg-white/5' : 'bg-transparent'
                )}
              >
                <div className="flex items-center gap-2 p-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => onToggle?.(overlay.id)}
                    className="scale-75"
                  />

                  <overlay.icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? overlay.color : 'text-white/30'
                    )}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isActive ? 'text-white' : 'text-white/50'
                      )}
                    >
                      {overlay.name}
                    </p>
                  </div>

                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setExpandedSettingsId(isSettingsExpanded ? null : overlay.id)
                      }
                    >
                      {isSettingsExpanded ? (
                        <ChevronUp className="w-3 h-3 text-white/40" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-white/40" />
                      )}
                    </Button>
                  )}
                </div>

                {/* 설정 패널 */}
                {isActive && isSettingsExpanded && (
                  <div className="px-3 pb-2 pt-0">
                    <OverlaySettings
                      overlayId={overlay.id}
                      onSettingsChange={onSettingsChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 컴팩트 패널
// ============================================================================
interface CompactOverlayPanelProps {
  activeOverlays: string[];
  onToggle?: (overlayId: string) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

function CompactOverlayPanel({
  activeOverlays,
  onToggle,
  expanded,
  setExpanded,
}: CompactOverlayPanelProps) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/60 hover:text-white"
        onClick={() => setExpanded(!expanded)}
      >
        {activeOverlays.length > 0 ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </Button>

      {expanded && (
        <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg p-2 space-y-1">
          {overlayDefinitions.map((overlay) => {
            const isActive = activeOverlays.includes(overlay.id);

            return (
              <button
                key={overlay.id}
                className={cn(
                  'flex items-center gap-2 w-full p-2 rounded transition-colors text-left',
                  isActive ? 'bg-white/10' : 'hover:bg-white/5'
                )}
                onClick={() => onToggle?.(overlay.id)}
              >
                <overlay.icon
                  className={cn('w-4 h-4', isActive ? overlay.color : 'text-white/30')}
                />
                <span
                  className={cn('text-xs', isActive ? 'text-white' : 'text-white/50')}
                >
                  {overlay.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 오버레이 설정
// ============================================================================
interface OverlaySettingsProps {
  overlayId: OverlayType;
  onSettingsChange?: (overlayId: string, settings: any) => void;
}

function OverlaySettings({ overlayId, onSettingsChange }: OverlaySettingsProps) {
  const [opacity, setOpacity] = useState([70]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">투명도</span>
        <span className="text-[10px] text-white/60">{opacity[0]}%</span>
      </div>
      <Slider
        value={opacity}
        onValueChange={(value) => {
          setOpacity(value);
          onSettingsChange?.(overlayId, { opacity: value[0] / 100 });
        }}
        max={100}
        step={5}
        className="w-full"
      />
    </div>
  );
}

export default OverlayControlPanel;
