/**
 * CongestionResultPanel.tsx
 *
 * 혼잡도 시뮬레이션 결과 패널
 */

import { DraggablePanel } from '../../components/DraggablePanel';
import { Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CongestionResult {
  date: string;
  peakHours: string;
  peakCongestion: number;
  maxCapacity: number;
  hourlyData: { hour: string; congestion: number }[];
  zoneData: { zone: string; congestion: number }[];
  recommendations: string[];
}

interface CongestionResultPanelProps {
  result?: CongestionResult | null;
  onClose: () => void;
  onPlayAnimation: () => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
  defaultCollapsed?: boolean;
}

export const CongestionResultPanel: React.FC<CongestionResultPanelProps> = ({
  result,
  onClose,
  onPlayAnimation,
  defaultPosition = { x: 350, y: 320 },
  rightOffset,
  defaultCollapsed = true,
}) => {
  const getCongestionColor = (value: number) => {
    if (value >= 70) return 'bg-red-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCongestionBadge = (value: number) => {
    if (value >= 70) return 'bg-red-500/20 text-red-400';
    if (value >= 40) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-green-500/20 text-green-400';
  };

  return (
    <DraggablePanel
      id="congestion-result"
      title="혼잡도 예측"
      icon={<Users className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      defaultCollapsed={defaultCollapsed}
      closable
      onClose={onClose}
      width="w-64"
    >
      {!result ? (
        <div className="py-6 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-xs text-white/40">표시할 결과 없음</p>
          <p className="text-[10px] text-white/30 mt-1">시뮬레이션 실행 후 결과가 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 예측 정보 */}
          <div className="mb-3">
            <p className="text-xs text-white/50">예측 날짜</p>
            <p className="text-sm text-white">{result.date}</p>
          </div>

          {/* 피크 시간 */}
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-xs text-white/50">피크 시간대</p>
            <p className="text-sm text-red-400 font-medium">{result.peakHours}</p>
            <p className="text-xs text-white/60 mt-1">
              예상 혼잡도: {result.peakCongestion}% | 수용: {result.maxCapacity}명
            </p>
          </div>

          {/* 시간대별 그래프 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-2">시간대별 혼잡도</p>
            <div className="space-y-1">
              {result.hourlyData.slice(0, 6).map((data, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-10">{data.hour}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${getCongestionColor(data.congestion)}`}
                      style={{ width: `${data.congestion}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60 w-8 text-right">{data.congestion}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 구역별 */}
          <div className="mb-3">
            <p className="text-xs text-white/50 mb-2">구역별 혼잡 예측</p>
            <div className="flex flex-wrap gap-1">
              {result.zoneData.map((zone, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${getCongestionBadge(zone.congestion)}`}
                >
                  {zone.zone}: {zone.congestion}%
                </span>
              ))}
            </div>
          </div>

          {/* 권장 조치 */}
          <div>
            <p className="text-xs text-white/50 mb-1">💡 권장 조치</p>
            <ul className="text-xs text-white/60 space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayAnimation}
            className="w-full mt-3 h-8 text-xs bg-white/10 hover:bg-white/20 text-white gap-1"
          >
            <Play className="w-3 h-3" />
            시간대별 애니메이션
          </Button>
        </>
      )}
    </DraggablePanel>
  );
};

export default CongestionResultPanel;
