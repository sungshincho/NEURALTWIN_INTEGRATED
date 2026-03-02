/**
 * Sparkline.tsx
 *
 * Lightweight inline SVG sparkline component.
 * Renders a 7-day (or arbitrary) trend as a small area + line chart.
 * No external chart library required.
 */

import React, { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SparklineProps {
  /** Array of numeric data points (e.g., 7 days of values) */
  data: number[];
  /** SVG width in pixels */
  width?: number;
  /** SVG height in pixels */
  height?: number;
  /** Stroke color for the line */
  strokeColor?: string;
  /** Fill color for the area beneath the line (with opacity) */
  fillColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Whether to show a dot on the last data point */
  showEndDot?: boolean;
  /** Additional className for the SVG element */
  className?: string;
}

/**
 * Converts an array of numeric values into SVG path coordinates.
 * Applies internal padding so the line does not touch the edges.
 */
function buildPathData(
  data: number[],
  width: number,
  height: number,
  padding: number = 2,
): { linePath: string; areaPath: string; lastPoint: { x: number; y: number } } {
  if (data.length === 0) {
    return { linePath: '', areaPath: '', lastPoint: { x: 0, y: 0 } };
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1; // avoid division by zero

  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * drawWidth;
    const y = padding + drawHeight - ((value - minVal) / range) * drawHeight;
    return { x, y };
  });

  // Build the line path using smooth quadratic bezier curves
  let linePath = `M ${points[0].x},${points[0].y}`;

  if (points.length === 1) {
    // Single point: just a horizontal line
    linePath += ` L ${points[0].x},${points[0].y}`;
  } else if (points.length === 2) {
    linePath += ` L ${points[1].x},${points[1].y}`;
  } else {
    // Use smooth curves for 3+ points
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      linePath += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
  }

  // Build the filled area path (line path + bottom edge closure)
  const bottomY = height;
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x},${bottomY}` +
    ` L ${points[0].x},${bottomY}` +
    ' Z';

  const lastPoint = points[points.length - 1];

  return { linePath, areaPath, lastPoint };
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 32,
  strokeColor = 'rgba(255, 255, 255, 0.6)',
  fillColor = 'rgba(255, 255, 255, 0.08)',
  strokeWidth = 1.5,
  showEndDot = true,
  className,
}) => {
  const gradientId = useId();
  const { linePath, areaPath, lastPoint } = useMemo(
    () => buildPathData(data, width, height),
    [data, width, height],
  );

  if (data.length < 2) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block flex-shrink-0', className)}
      aria-hidden="true"
    >
      {/* Gradient definition for the fill area (unique per instance) */}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={1} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* End dot */}
      {showEndDot && (
        <>
          {/* Glow ring */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={3.5}
            fill="none"
            stroke={strokeColor}
            strokeWidth={0.5}
            opacity={0.4}
          />
          {/* Solid dot */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={2}
            fill={strokeColor}
          />
        </>
      )}
    </svg>
  );
};

export default Sparkline;
