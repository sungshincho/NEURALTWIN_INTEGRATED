// ============================================================================
// DataSourceCards.tsx - 데이터 소스 상태 카드 (3D Glassmorphism Design)
// ============================================================================

import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Users,
  Package,
  Wifi,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Boxes,
  CloudSun,
  Calendar,
  TrendingUp,
  BarChart3,
  Database,
  Lock,
} from 'lucide-react';
import type { DataSourceStatus, ContextDataSource } from '../types';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '14px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '14px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#6b7280',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '11px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '11px', color: '#9ca3af',
  } as React.CSSProperties,
});

const Badge3D = ({ children, dark = false, variant = 'default' }: { children: React.ReactNode; dark?: boolean; variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const colors = {
    default: { bg: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: dark ? 'rgba(255,255,255,0.8)' : '#6b7280' },
    success: { bg: dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)', text: '#22c55e' },
    warning: { bg: dark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.1)', text: '#eab308' },
    error: { bg: dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', text: '#ef4444' },
  };
  const color = colors[variant];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
      background: color.bg,
      borderRadius: '8px',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
      fontSize: '11px', fontWeight: 600, color: color.text,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// 비즈니스 데이터 소스 카드
// ============================================================================

interface DataSourceCardsProps {
  dataSources: Record<string, DataSourceStatus>;
}

const sourceIcons: Record<string, any> = {
  pos: ShoppingCart,
  sensor: Wifi,
  crm: Users,
  product: Package,
  erp: Boxes,
  external: Cloud,
};

// 데이터 소스 키에 따른 고정 표시 이름 (RPC 응답과 관계없이 일관된 이름 표시)
const sourceDisplayNames: Record<string, string> = {
  pos: 'POS',
  sensor: 'NEURALSENSE',
  crm: 'CRM',
  product: '상품',
  erp: 'ERP',
  external: 'External',
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: '연결됨', variant: 'success' },
  inactive: { label: '비활성', variant: 'default' },
  error: { label: '오류', variant: 'error' },
  testing: { label: '테스트중', variant: 'warning' },
};

export function DataSourceCards({ dataSources }: DataSourceCardsProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const sources = Object.entries(dataSources);

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={text3D.label}>Business Data Sources</span>
          <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>비즈니스 데이터 소스</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sources.map(([key, source]) => {
            const Icon = sourceIcons[key] || Cloud;
            const status = statusConfig[source.status] || statusConfig.inactive;
            const StatusIcon = source.status === 'active' ? CheckCircle : source.status === 'error' ? XCircle : AlertCircle;

            return (
              <div
                key={key}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
                  borderRadius: '16px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon3D size={48} dark={isDark}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </Icon3D>
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: status.variant === 'success' ? '#22c55e' : status.variant === 'error' ? '#ef4444' : status.variant === 'warning' ? '#eab308' : (isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isDark ? '2px solid rgba(48,48,58,0.98)' : '2px solid rgba(255,255,255,0.95)',
                  }}>
                    <StatusIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <span style={{ marginTop: '10px', textAlign: 'center', ...text3D.title }}>{sourceDisplayNames[key] || source.name}</span>
                <Badge3D dark={isDark} variant={status.variant}>{status.label}</Badge3D>
                {source.last_sync && (
                  <span style={{ marginTop: '6px', ...text3D.small }}>{formatRelativeTime(source.last_sync)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================================
// 컨텍스트 데이터 소스 카드 (날씨, 이벤트 등)
// ============================================================================

interface ContextDataSourceCardsProps {
  sources: ContextDataSource[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const contextIcons: Record<string, any> = {
  CloudSun: CloudSun,
  Calendar: Calendar,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Cloud: Cloud,
  Database: Database,
  weather: CloudSun,
  holidays: Calendar,
  exchange: TrendingUp,
  trends: BarChart3,
};

export function ContextDataSourceCards({ sources, isLoading }: ContextDataSourceCardsProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(100,149,237,0.9)' : '#3b82f6';

  if (isLoading) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={text3D.label}>Context Data Sources</span>
            <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>컨텍스트 데이터 소스</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={text3D.label}>Context Data Sources</span>
            <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>컨텍스트 데이터 소스</h3>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CloudSun className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
            </div>
            <p style={text3D.body}>컨텍스트 데이터 소스가 없습니다.</p>
            <p style={{ marginTop: '4px', ...text3D.small }}>시스템이 자동으로 기본 연결을 생성합니다.</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={text3D.label}>Context Data Sources</span>
          <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>컨텍스트 데이터 소스</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sources.map((source) => {
            const iconKey = source.icon_name || source.data_category || 'Cloud';
            const Icon = contextIcons[iconKey] || Cloud;
            // 컨텍스트 소스는 data_category로 판별 (weather, holidays)
            const isSystemManaged =
              source.is_system_managed ||
              source.data_category === 'weather' ||
              source.data_category === 'holidays';
            // 항상 활성으로 표시
            const StatusIcon = CheckCircle;

            return (
              <div
                key={source.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
                  borderRadius: '16px',
                  background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                  border: isDark ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <StatusIcon className="w-3 h-3 text-white" />
                  </div>
                  {isSystemManaged && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <span style={{ marginTop: '10px', textAlign: 'center', ...text3D.title }}>{source.name}</span>
                <Badge3D dark={isDark} variant="success">자동 연결</Badge3D>
                {source.total_records_synced > 0 && (
                  <span style={{ marginTop: '6px', ...text3D.body }}>{source.total_records_synced.toLocaleString()}건</span>
                )}
                {source.last_sync && (
                  <span style={{ marginTop: '2px', ...text3D.small }}>{formatRelativeTime(source.last_sync)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================================
// 통합 데이터 소스 카드 (비즈니스 + 컨텍스트를 하나의 박스에)
// ============================================================================

interface UnifiedDataSourceCardsProps {
  businessSources: Record<string, DataSourceStatus>;
  contextSources: ContextDataSource[];
  isContextLoading?: boolean;
}

export function UnifiedDataSourceCards({
  businessSources,
  contextSources,
  isContextLoading,
}: UnifiedDataSourceCardsProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';
  const sources = Object.entries(businessSources);

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '20px' }}>
        {/* 비즈니스 데이터 소스 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={text3D.label}>Business Data Sources</span>
            <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>비즈니스 데이터 소스</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {sources.map(([key, source]) => {
              const Icon = sourceIcons[key] || Cloud;
              const status = statusConfig[source.status] || statusConfig.inactive;
              const StatusIcon = source.status === 'active' ? CheckCircle : source.status === 'error' ? XCircle : AlertCircle;

              return (
                <div
                  key={key}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
                    borderRadius: '16px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Icon3D size={48} dark={isDark}>
                      <Icon className="w-5 h-5" style={{ color: iconColor }} />
                    </Icon3D>
                    <div style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: status.variant === 'success' ? '#22c55e' : status.variant === 'error' ? '#ef4444' : status.variant === 'warning' ? '#eab308' : (isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: isDark ? '2px solid rgba(48,48,58,0.98)' : '2px solid rgba(255,255,255,0.95)',
                    }}>
                      <StatusIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span style={{ marginTop: '10px', textAlign: 'center', ...text3D.title }}>{sourceDisplayNames[key] || source.name}</span>
                  <Badge3D dark={isDark} variant={status.variant}>{status.label}</Badge3D>
                  {source.last_sync && (
                    <span style={{ marginTop: '6px', ...text3D.small }}>{formatRelativeTime(source.last_sync)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{
          height: '1px',
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.15) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent 100%)',
          marginBottom: '24px',
        }} />

        {/* 컨텍스트 데이터 소스 섹션 */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <span style={text3D.label}>Context Data Sources</span>
            <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>컨텍스트 데이터 소스</h3>
          </div>

          {isContextLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
              ))}
            </div>
          ) : !contextSources || contextSources.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
              borderRadius: '12px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
            }}>
              <CloudSun className="w-5 h-5" style={{ color: iconColor }} />
              <span style={text3D.body}>시스템이 자동으로 컨텍스트 연결을 생성합니다.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {contextSources.map((source) => {
                const iconKey = source.icon_name || source.data_category || 'Cloud';
                const Icon = contextIcons[iconKey] || Cloud;
                const isSystemManaged =
                  source.is_system_managed ||
                  source.data_category === 'weather' ||
                  source.data_category === 'holidays';
                const StatusIcon = CheckCircle;

                return (
                  <div
                    key={source.id}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
                      borderRadius: '16px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="relative">
                      <Icon3D size={48} dark={isDark}>
                        <Icon className="w-5 h-5" style={{ color: iconColor }} />
                      </Icon3D>
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <StatusIcon className="w-3 h-3 text-white" />
                      </div>
                      {isSystemManaged && (
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span style={{ marginTop: '10px', textAlign: 'center', ...text3D.title }}>{source.name}</span>
                    <Badge3D dark={isDark} variant="success">자동 연결</Badge3D>
                    {source.total_records_synced > 0 && (
                      <span style={{ marginTop: '6px', ...text3D.body }}>{source.total_records_synced.toLocaleString()}건</span>
                    )}
                    {source.last_sync && (
                      <span style={{ marginTop: '2px', ...text3D.small }}>{formatRelativeTime(source.last_sync)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}
