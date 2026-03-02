/**
 * DemoHeatmapGrid.tsx
 *
 * Simplified CSS Grid zone heatmap for the Interactive Landing Demo.
 * No Three.js -- pure CSS with color intensity based on traffic data.
 * Different layouts per scenario.
 */

import { useState } from "react";
import type { DemoZone, DemoScenario } from "./demo-data";

interface DemoHeatmapGridProps {
  scenario: DemoScenario;
  /** Whether animations should play */
  isActive?: boolean;
}

/**
 * Maps traffic value (0-100) to an opacity level for the zone cell background.
 */
function trafficToOpacity(traffic: number): number {
  // Range from 0.15 (low traffic) to 0.7 (high traffic)
  return 0.15 + (traffic / 100) * 0.55;
}

/**
 * Maps traffic to a text label.
 */
function trafficLabel(traffic: number): string {
  if (traffic >= 80) return "매우 높음";
  if (traffic >= 60) return "높음";
  if (traffic >= 40) return "보통";
  if (traffic >= 20) return "낮음";
  return "매우 낮음";
}

export const DemoHeatmapGrid: React.FC<DemoHeatmapGridProps> = ({
  scenario,
  isActive = true,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Build CSS grid template from scenario data
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${scenario.gridCols}, 1fr)`,
    gridTemplateRows: `repeat(${scenario.gridRows}, 1fr)`,
    gridTemplateAreas: scenario.gridTemplate,
    gap: "3px",
  };

  return (
    <div
      className="relative w-full aspect-[4/3] rounded-lg overflow-hidden"
      role="img"
      aria-label={`${scenario.storeName} 존별 트래픽 히트맵`}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      {/* Zone grid */}
      <div className="relative w-full h-full p-1" style={gridStyle}>
        {scenario.zones.map((zone) => (
          <ZoneCell
            key={zone.id}
            zone={zone}
            isActive={isActive}
            isHovered={hoveredZone === zone.id}
            onHover={() => setHoveredZone(zone.id)}
            onLeave={() => setHoveredZone(null)}
          />
        ))}
      </div>

      {/* Tooltip overlay */}
      {hoveredZone && (
        <ZoneTooltip
          zone={scenario.zones.find((z) => z.id === hoveredZone)!}
        />
      )}
    </div>
  );
};

// ===== Zone Cell =====

interface ZoneCellProps {
  zone: DemoZone;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const ZoneCell: React.FC<ZoneCellProps> = ({
  zone,
  isActive,
  isHovered,
  onHover,
  onLeave,
}) => {
  const opacity = trafficToOpacity(zone.traffic);

  return (
    <div
      className={`
        relative rounded-md cursor-pointer
        transition-all duration-300 ease-out
        flex items-center justify-center
        ${isHovered ? "scale-[1.02] z-10" : ""}
        ${isActive ? "opacity-100" : "opacity-40"}
      `}
      style={{
        gridArea: zone.gridArea,
        backgroundColor: zone.color,
        opacity: isHovered ? Math.min(opacity + 0.15, 0.85) : opacity,
        boxShadow: isHovered
          ? `0 0 16px ${zone.color}40, inset 0 0 20px rgba(255,255,255,0.1)`
          : "none",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      tabIndex={0}
      role="button"
      aria-label={`${zone.name}: 방문자 ${zone.visitors.toLocaleString("ko-KR")}명, 트래픽 ${trafficLabel(zone.traffic)}`}
    >
      {/* Zone name */}
      <span className="text-[10px] md:text-xs font-medium text-white/80 text-center leading-tight select-none pointer-events-none">
        {zone.name}
      </span>

      {/* Traffic pulse animation for high-traffic zones */}
      {zone.traffic >= 70 && isActive && (
        <div
          className="absolute inset-0 rounded-md animate-pulse pointer-events-none"
          style={{
            backgroundColor: zone.color,
            opacity: 0.12,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// ===== Zone Tooltip =====

interface ZoneTooltipProps {
  zone: DemoZone;
}

const ZoneTooltip: React.FC<ZoneTooltipProps> = ({ zone }) => {
  return (
    <div
      className={`
        absolute bottom-2 left-1/2 -translate-x-1/2
        backdrop-blur-lg bg-black/80 border border-white/10
        rounded-lg px-3 py-2 pointer-events-none z-20
        transition-all duration-200 ease-out
        animate-in fade-in-0 slide-in-from-bottom-1
      `}
      role="tooltip"
    >
      <div className="flex items-center gap-3">
        {/* Color dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: zone.color }}
          aria-hidden="true"
        />
        <div>
          <div className="text-xs font-semibold text-white">{zone.name}</div>
          <div className="text-[10px] text-white/50">
            {zone.visitors.toLocaleString("ko-KR")}명 &middot;{" "}
            {trafficLabel(zone.traffic)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHeatmapGrid;
