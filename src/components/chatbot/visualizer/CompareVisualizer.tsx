/**
 * NEURALTWIN Store Visualizer - Compare Mode (A-8)
 *
 * Before/After 레이아웃을 나란히 비교하는 컴포넌트
 * - 좌: Before (현재 레이아웃)
 * - 우: After (제안 레이아웃)
 * - 라벨 오버레이 + 동기화된 카메라 상태
 */

import StoreVisualizer from './StoreVisualizer';
import type { VizDirective, DynamicZone } from './vizDirectiveTypes';

interface CompareVisualizerProps {
  vizDirective: VizDirective;
  chatHighlightZones?: string[];
}

export default function CompareVisualizer({ vizDirective, chatHighlightZones = [] }: CompareVisualizerProps) {
  const compare = vizDirective.compare;
  if (!compare) return null;

  const beforeLabel = compare.beforeLabel || '현재 레이아웃';
  const afterLabel = compare.afterLabel || '제안 레이아웃';

  const mergedHighlights = [...(vizDirective.highlights || []), ...chatHighlightZones];

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      gap: '2px',
      position: 'relative',
      background: '#030712',
    }}>
      {/* Before (좌) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px 0 0 8px' }}>
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          fontSize: '11px',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 600,
          letterSpacing: '0.05em',
          backdropFilter: 'blur(8px)',
        }}>
          {beforeLabel}
        </div>
        <StoreVisualizer
          vizState={vizDirective.vizState}
          highlights={mergedHighlights}
          annotations={[]}
          showFlow={false}
          zones={compare.beforeZones}
          stage={vizDirective.stage}
          storeParams={vizDirective.storeParams}
          zoneScale={vizDirective.zoneScale}
        />
      </div>

      {/* 중앙 구분선 */}
      <div style={{
        width: '2px',
        background: 'linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.5), transparent)',
        flexShrink: 0,
      }} />

      {/* After (우) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0 8px 8px 0' }}>
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          color: '#4ade80',
          fontSize: '11px',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 600,
          letterSpacing: '0.05em',
          backdropFilter: 'blur(8px)',
        }}>
          {afterLabel}
        </div>
        <StoreVisualizer
          vizState={vizDirective.vizState}
          highlights={mergedHighlights}
          annotations={vizDirective.annotations || []}
          showFlow={vizDirective.flowPath || false}
          zones={vizDirective.zones}
          kpis={vizDirective.kpis}
          stage={vizDirective.stage}
          storeParams={vizDirective.storeParams}
          zoneScale={vizDirective.zoneScale}
          focusZone={vizDirective.focusZone}
          cameraAngle={vizDirective.cameraAngle}
        />
      </div>
    </div>
  );
}
