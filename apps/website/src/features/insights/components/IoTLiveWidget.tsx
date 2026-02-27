/**
 * IoTLiveWidget.tsx
 *
 * Compact card widget showing real-time IoT visitor status.
 * Designed for the InsightHub page summary area.
 *
 * - Green/red dot for connection status
 * - Animated active visitor count
 * - Zone breakdown (top zones with visitor counts)
 * - Last update timestamp
 * - GlassCard styling, dark mode compatible
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Users, MapPin } from 'lucide-react';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useIoTRealtimeStatus } from '@/hooks/useIoTRealtimeStatus';
import { useSelectedStore } from '@/hooks/useSelectedStore';

interface IoTLiveWidgetProps {
  className?: string;
}

export function IoTLiveWidget({ className }: IoTLiveWidgetProps) {
  const isDark = useDarkMode();
  const { selectedStore } = useSelectedStore();
  const { visitors, activeCount, isConnected, lastUpdate } = useIoTRealtimeStatus(
    selectedStore?.id
  );

  // Group visitors by zone
  const zoneBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    visitors.forEach((v) => {
      const key = v.zoneName || v.zoneId || '미분류';
      map.set(key, (map.get(key) || 0) + 1);
    });
    // Sort by count desc, take top 5
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [visitors]);

  const lastUpdateText = lastUpdate
    ? lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const textColor = isDark ? '#fff' : '#1a1a1f';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#515158';
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af';

  return (
    <GlassCard dark={isDark} className={className}>
      <div style={{ padding: '20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon3D size={32} dark={isDark}>
              {isConnected
                ? <Wifi className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }} />
                : <WifiOff className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />}
            </Icon3D>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: textColor,
                  }}
                >
                  실시간 방문자
                </span>
                {/* Connection dot */}
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    display: 'inline-block',
                    backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                    boxShadow: isConnected
                      ? '0 0 6px rgba(34,197,94,0.5)'
                      : '0 0 6px rgba(239,68,68,0.5)',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: mutedColor }}>
                IoT NeuralSense
              </span>
            </div>
          </div>
        </div>

        {/* Active count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeCount}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                fontSize: '36px',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: textColor,
                ...(isDark
                  ? { textShadow: '0 2px 4px rgba(0,0,0,0.4)' }
                  : {}),
              }}
            >
              {activeCount}
            </motion.span>
          </AnimatePresence>
          <span style={{ fontSize: '13px', fontWeight: 500, color: subTextColor }}>
            명 활동 중
          </span>
        </div>

        {/* Zone breakdown */}
        {zoneBreakdown.length > 0 ? (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <MapPin className="w-3 h-3" style={{ color: mutedColor }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: mutedColor, letterSpacing: '0.02em' }}>
                구역별 분포
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {zoneBreakdown.map(([zone, count]) => (
                <div
                  key={zone}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 500, color: subTextColor }}>
                    {zone}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: textColor }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              marginBottom: '12px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Users className="w-5 h-5 mx-auto mb-1" style={{ color: mutedColor }} />
              <span style={{ fontSize: '11px', fontWeight: 500, color: mutedColor }}>
                데이터 대기 중
              </span>
            </div>
          </div>
        )}

        {/* Last update */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 500, color: mutedColor }}>
            마지막 업데이트
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: subTextColor }}>
            {lastUpdateText}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
