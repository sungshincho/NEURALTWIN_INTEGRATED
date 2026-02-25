/**
 * FunnelChart.tsx
 *
 * 3D Glassmorphism Funnel Chart Component
 * Entry → Browse → Engage → Fitting → Purchase
 */

import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Glass3DCard, text3DStyles } from '@/components/ui/glass-card';

export interface FunnelData {
  entry: number;
  browse: number;
  engage: number;
  fitting: number;
  purchase: number;
}

interface FunnelChartProps {
  data: FunnelData;
  className?: string;
}

const stages = [
  { key: 'entry', label: '입장', labelEn: 'ENTRY', isAccent: true },
  { key: 'browse', label: '탐색', labelEn: 'BROWSE', isAccent: false },
  { key: 'engage', label: '관심', labelEn: 'ENGAGE', isAccent: false },
  { key: 'fitting', label: '피팅', labelEn: 'FITTING', isAccent: false },
  { key: 'purchase', label: '구매', labelEn: 'PURCHASE', isAccent: true },
] as const;

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, className }) => {
  const maxValue = data.entry || 1;

  // Find max dropoff
  const { dropoffs, maxDropoff } = useMemo(() => {
    const drops = stages.slice(0, -1).map((stage, i) => {
      const current = data[stage.key as keyof FunnelData];
      const next = data[stages[i + 1].key as keyof FunnelData];
      return {
        from: stage.label,
        to: stages[i + 1].label,
        dropoffRate: current > 0 ? ((current - next) / current) * 100 : 0,
        dropoffCount: current - next,
      };
    });

    const max = drops.reduce((m, d) =>
      d.dropoffRate > m.dropoffRate ? d : m
    );

    return { dropoffs: drops, maxDropoff: max };
  }, [data]);

  if (data.entry === 0) {
    return (
      <Glass3DCard className={className}>
        <div className="p-6">
          <h3 className="text-base mb-4" style={text3DStyles.heading}>
            고객 여정 퍼널
          </h3>
          <div className="h-40 flex items-center justify-center" style={text3DStyles.body}>
            해당 기간에 퍼널 데이터가 없습니다
          </div>
        </div>
      </Glass3DCard>
    );
  }

  return (
    <Glass3DCard className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-base" style={text3DStyles.heading}>
            고객 여정 퍼널
          </h3>
          <p className="text-xs mt-1" style={text3DStyles.body}>
            방문 빈도 {(data.entry / Math.max(data.purchase, 1)).toFixed(1)}회
          </p>
        </div>

        {/* Funnel Bars */}
        <div className="flex items-end justify-between gap-3" style={{ height: '160px' }}>
          {stages.map((stage, idx) => {
            const value = data[stage.key as keyof FunnelData];
            const percentage = (value / maxValue) * 100;
            const rate = data.entry > 0 ? ((value / data.entry) * 100).toFixed(1) : '0';

            return (
              <div
                key={stage.key}
                className="flex-1 flex flex-col items-center h-full justify-end"
              >
                {/* Bar */}
                <div className="w-full relative" style={{ height: '120px' }}>
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 transition-all duration-500',
                      stage.isAccent ? 'funnel-bar-dark' : 'funnel-bar'
                    )}
                    style={{
                      height: `${Math.max(percentage, 8)}%`,
                      borderRadius: '10px 10px 3px 3px',
                      background: stage.isAccent
                        ? 'linear-gradient(180deg, #2c2c35 0%, #1c1c24 35%, #252530 65%, #1a1a22 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(235,235,242,0.95) 30%, rgba(248,248,252,0.98) 60%, rgba(242,242,248,0.95) 100%)',
                      border: stage.isAccent
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(255,255,255,0.95)',
                      boxShadow: stage.isAccent
                        ? '0 4px 8px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)'
                        : '0 2px 4px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Glass highlight for light bars */}
                    {!stage.isAccent && (
                      <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                          height: '50%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
                          borderRadius: '10px 10px 0 0',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Labels */}
                <div className="mt-3 text-center w-full">
                  <p style={{ ...text3DStyles.label, fontSize: '8px' }}>
                    {stage.labelEn}
                  </p>
                  <p
                    className="text-sm font-bold mt-1 tabular-nums"
                    style={text3DStyles.number}
                  >
                    {value.toLocaleString()}
                  </p>
                  <p className="text-[10px] mt-0.5" style={text3DStyles.body}>
                    ({rate}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Max Dropoff Alert */}
        {maxDropoff.dropoffRate > 0 && (
          <div
            className="mt-5 p-3 rounded-xl flex items-start gap-2"
            style={{
              background: 'linear-gradient(165deg, rgba(255,251,235,0.95) 0%, rgba(254,243,199,0.85) 100%)',
              border: '1px solid rgba(251,191,36,0.3)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-900">최대 이탈 구간:</span>{' '}
              <span className="text-amber-800">
                {maxDropoff.from} → {maxDropoff.to}
              </span>{' '}
              <span className="text-amber-600 font-medium">
                ({maxDropoff.dropoffRate.toFixed(1)}% 이탈, {maxDropoff.dropoffCount.toLocaleString()}명)
              </span>
            </div>
          </div>
        )}

        {/* Conversion Summary */}
        <div
          className="mt-4 pt-4 flex items-center justify-between text-sm"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <span style={text3DStyles.body}>최종 구매 전환율</span>
          <span
            className="text-lg"
            style={text3DStyles.heroNumber}
          >
            {data.entry > 0 ? ((data.purchase / data.entry) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </Glass3DCard>
  );
};

export default FunnelChart;
