/**
 * IoTStatusPanel.tsx
 *
 * Settings panel showing IoT Raspberry Pi device status.
 * Currently displays a static list of known Pi devices with
 * placeholder status. Future versions will connect to a
 * sensor heartbeat table for live status.
 */

import { Wifi, WifiOff, Radio, Activity, AlertTriangle } from 'lucide-react';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';
import { useDarkMode } from '@/hooks/useDarkMode';

interface PiDevice {
  id: string;
  name: string;
  zones: string[];
}

const PI_DEVICES: PiDevice[] = [
  { id: 'pi5', name: 'Pi 5', zones: ['NS001', 'NS002'] },
  { id: 'pi7', name: 'Pi 7', zones: ['NS003', 'NS004'] },
  { id: 'pi8', name: 'Pi 8', zones: ['NS005', 'NS006', 'NS007'] },
  { id: 'pi9', name: 'Pi 9', zones: ['NS008', 'NS009'] },
  { id: 'pi10', name: 'Pi 10', zones: ['NS010', 'NS011', 'NS012'] },
  { id: 'pi11', name: 'Pi 11', zones: ['NS013', 'NS014'] },
  { id: 'pi12', name: 'Pi 12', zones: ['NS015', 'NS016'] },
  { id: 'pi13', name: 'Pi 13', zones: ['NS017', 'NS018', 'NS019'] },
];

type DeviceStatus = 'online' | 'offline' | 'degraded' | 'pending';

interface IoTStatusPanelProps {
  className?: string;
}

export function IoTStatusPanel({ className }: IoTStatusPanelProps) {
  const isDark = useDarkMode();

  const textColor = isDark ? '#fff' : '#1a1a1f';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#515158';
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af';
  const headerColor = isDark ? 'rgba(255,255,255,0.5)' : '#6b7280';
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const rowBorder = isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)';
  const headerBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)';

  // For now, all devices show as "pending" (data awaiting)
  const getDeviceStatus = (_id: string): DeviceStatus => 'pending';

  const statusConfig: Record<DeviceStatus, { color: string; shadow: string; label: string; Icon: typeof Wifi }> = {
    online: { color: '#22c55e', shadow: '0 0 6px rgba(34,197,94,0.5)', label: '온라인', Icon: Wifi },
    offline: { color: '#ef4444', shadow: '0 0 6px rgba(239,68,68,0.5)', label: '오프라인', Icon: WifiOff },
    degraded: { color: '#eab308', shadow: '0 0 6px rgba(234,179,8,0.5)', label: '불안정', Icon: AlertTriangle },
    pending: { color: '#6b7280', shadow: '0 0 4px rgba(107,114,128,0.3)', label: '대기 중', Icon: Radio },
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary card */}
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Icon3D size={32} dark={isDark}>
              <Radio className="w-4 h-4" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: textColor,
                  ...(isDark ? { textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : {}),
                }}
              >
                IoT 센서 디바이스
              </h3>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500, color: subTextColor }}>
                NeuralSense Raspberry Pi 네트워크
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {[
              { label: '총 디바이스', value: PI_DEVICES.length, icon: Radio },
              { label: '모니터링 구역', value: 19, icon: Activity },
              { label: '연결 상태', value: '대기 중', icon: Wifi },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <stat.icon
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: mutedColor }}
                />
                <p
                  style={{
                    fontSize: typeof stat.value === 'number' ? '22px' : '13px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    margin: '0 0 2px 0',
                    color: textColor,
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: '10px', fontWeight: 500, margin: 0, color: mutedColor }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Device table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: headerBorder }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: headerColor, fontSize: '12px' }}>
                    디바이스
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: headerColor, fontSize: '12px' }}>
                    상태
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: headerColor, fontSize: '12px' }}>
                    구역
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: headerColor, fontSize: '12px' }}>
                    마지막 하트비트
                  </th>
                </tr>
              </thead>
              <tbody>
                {PI_DEVICES.map((device) => {
                  const status = getDeviceStatus(device.id);
                  const cfg = statusConfig[status];
                  return (
                    <tr key={device.id} style={{ borderBottom: rowBorder }}>
                      {/* Device name */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          <span style={{ fontWeight: 600, color: textColor }}>
                            {device.name}
                          </span>
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              display: 'inline-block',
                              backgroundColor: cfg.color,
                              boxShadow: cfg.shadow,
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 500, color: subTextColor }}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      {/* Zones */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {device.zones.map((z) => (
                            <span
                              key={z}
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                color: subTextColor,
                              }}
                            >
                              {z}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Last heartbeat */}
                      <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: 500, color: mutedColor }}>
                        데이터 대기 중
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 500, color: mutedColor, margin: 0 }}>
              Raspberry Pi 디바이스가 Tailscale VPN을 통해 MQTT 브로커에 연결되면 실시간 상태가 업데이트됩니다.
              현재는 센서 하트비트 테이블 연동 대기 중입니다.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
