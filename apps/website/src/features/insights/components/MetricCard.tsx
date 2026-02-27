/**
 * MetricCard.tsx
 *
 * 3D Glassmorphism KPI Card Component
 * 영문 라벨 + 한글 라벨 + 3D 입체 효과
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Glass3DCard, Icon3D, Badge3D, text3DStyles } from '@/components/ui/glass-card';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  labelEn?: string;
  value: string | number;
  subLabel?: string;
  change?: number;
  changeLabel?: string;
  changeUnit?: string;
  className?: string;
  dark?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  labelEn,
  value,
  subLabel,
  change,
  changeLabel,
  changeUnit = '%',
  className,
  dark = false,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Glass3DCard dark={dark} className={className}>
      <div className="p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Labels */}
            {labelEn && (
              <p
                className="mb-0.5"
                style={dark ? text3DStyles.darkLabel : text3DStyles.label}
              >
                {labelEn}
              </p>
            )}
            <p
              className="text-sm"
              style={dark ? text3DStyles.darkBody : text3DStyles.body}
            >
              {label}
            </p>

            {/* Main Value */}
            <p
              className="text-3xl mt-2 truncate"
              style={dark ? text3DStyles.darkNumber : text3DStyles.heroNumber}
            >
              {value}
            </p>

            {/* Sub Label */}
            {subLabel && (
              <p
                className="text-xs mt-2"
                style={dark ? text3DStyles.darkBody : text3DStyles.body}
              >
                {subLabel}
              </p>
            )}

            {/* Change Badge */}
            {change !== undefined && (
              <div className="mt-3">
                <Badge3D dark={dark}>
                  <TrendIcon
                    className={cn(
                      'h-3.5 w-3.5',
                      isPositive
                        ? 'text-green-500'
                        : isNegative
                        ? 'text-red-500'
                        : dark
                        ? 'text-white/60'
                        : 'text-gray-500'
                    )}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: isPositive
                        ? '#22c55e'
                        : isNegative
                        ? '#ef4444'
                        : dark
                        ? 'rgba(255,255,255,0.6)'
                        : '#6b7280',
                    }}
                  >
                    {isPositive ? '+' : ''}
                    {change.toFixed(1)}
                    {changeUnit}
                    {changeLabel && ` ${changeLabel}`}
                  </span>
                </Badge3D>
              </div>
            )}
          </div>

          {/* Icon */}
          <Icon3D size={44} dark={dark}>
            <span
              className={cn(
                'text-lg',
                dark ? 'text-white/80' : 'text-gray-800'
              )}
            >
              {icon}
            </span>
          </Icon3D>
        </div>
      </div>
    </Glass3DCard>
  );
};

// ===== Format Utilities =====
export const formatCurrency = (
  value: number,
  unit: 'full' | 'man' | 'chun' = 'full'
): string => {
  if (unit === 'man') {
    return `₩${(value / 10000).toFixed(0)}만`;
  } else if (unit === 'chun') {
    return `₩${Math.round(value / 1000)}천`;
  }
  return `₩${value.toLocaleString('ko-KR')}원`;
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes > 0) {
    return secs > 0 ? `${minutes}분 ${secs}초` : `${minutes}분`;
  }
  return `${secs}초`;
};

export default MetricCard;
