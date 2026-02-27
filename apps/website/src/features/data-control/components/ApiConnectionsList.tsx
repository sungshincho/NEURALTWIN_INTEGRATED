// ============================================================================
// ApiConnectionsList.tsx - API 연결 목록 (3D Glassmorphism Design)
// ============================================================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plug,
  Plus,
  MoreVertical,
  PlayCircle,
  TestTube,
  Settings,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Link2,
} from 'lucide-react';
import {
  useApiConnections,
  useTestConnection,
  useSyncConnection,
  useDeleteConnection,
  useToggleConnectionStatus,
} from '../hooks/useApiConnector';
import {
  ApiConnection,
  ConnectionStatus,
  DATA_CATEGORIES,
} from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '15px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '15px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  subtitle: isDark ? {
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#6b7280',
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
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#6b7280',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#9ca3af',
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
// 상태 배지 컴포넌트
// ============================================================================

function StatusBadge({ status, isDark }: { status: ConnectionStatus; isDark: boolean }) {
  const variants: Record<ConnectionStatus, { variant: 'success' | 'default' | 'error' | 'warning'; icon: React.ReactNode; label: string }> = {
    active: { variant: 'success', icon: <CheckCircle2 className="h-3 w-3" />, label: '활성' },
    inactive: { variant: 'default', icon: <Clock className="h-3 w-3" />, label: '비활성' },
    error: { variant: 'error', icon: <XCircle className="h-3 w-3" />, label: '오류' },
    testing: { variant: 'warning', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: '테스트 중' },
  };

  const config = variants[status] || variants.inactive;

  return (
    <Badge3D variant={config.variant} dark={isDark}>
      {config.icon}
      {config.label}
    </Badge3D>
  );
}

// ============================================================================
// 카테고리 아이콘
// ============================================================================

function getCategoryIcon(category?: string) {
  const cat = DATA_CATEGORIES.find(c => c.value === category);
  return cat?.label || category || '알 수 없음';
}

// ============================================================================
// 연결 카드 컴포넌트
// ============================================================================

interface ConnectionCardProps {
  connection: ApiConnection;
  onEdit?: (id: string) => void;
  isDark: boolean;
}

function ConnectionCard({ connection, onEdit, isDark }: ConnectionCardProps) {
  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const testMutation = useTestConnection();
  const syncMutation = useSyncConnection();
  const deleteMutation = useDeleteConnection();
  const toggleMutation = useToggleConnectionStatus();

  // 시스템 관리 컨텍스트 데이터 소스 여부 (날씨, 공휴일 등)
  // data_category가 weather/holidays이면 시스템 컨텍스트로 판별
  const isSystemContext =
    connection.is_system_managed ||
    connection.connection_category === 'context' ||
    connection.data_category === 'weather' ||
    connection.data_category === 'holidays';

  const handleTest = () => {
    testMutation.mutate({ connectionId: connection.id });
  };

  const handleSync = () => {
    syncMutation.mutate(connection.id);
  };

  const handleDelete = () => {
    if (confirm('이 연결을 삭제하시겠습니까?')) {
      deleteMutation.mutate(connection.id);
    }
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id: connection.id, isActive: !connection.is_active });
  };

  const isLoading = testMutation.isPending || syncMutation.isPending;

  return (
    <div style={{
      padding: '16px',
      borderRadius: '16px',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
      position: 'relative',
    }}>
      {/* Line 1: 아이콘 + 제목 + More 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <Icon3D size={36} dark={isDark}>
            <Plug className="w-4 h-4" style={{ color: iconColor }} />
          </Icon3D>
          <h4 style={{
            margin: 0,
            ...text3D.title,
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{connection.name}</h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '8px',
              }}
            >
              <MoreVertical className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
            </Button>
          </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isSystemContext ? (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    자동 동기화 (Edge Function)
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleTest} disabled={isLoading}>
                      <TestTube className="h-4 w-4 mr-2" />
                      연결 테스트
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSync} disabled={isLoading || connection.status === 'error'}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      지금 동기화
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(connection.id)}>
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggle}>
                  {connection.is_active ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      비활성화
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      활성화
                    </>
                  )}
                </DropdownMenuItem>
                {!isSystemContext && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

      {/* Line 2: 카테고리 + 활성 배지 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={text3D.small}>{getCategoryIcon(connection.data_category)}</span>
        <StatusBadge status={isSystemContext ? 'active' : connection.status} isDark={isDark} />
      </div>

      {/* Line 3: 연결 상태 텍스트 */}
      <div>
        {isSystemContext ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
            <CheckCircle2 className="h-3 w-3" />
            <span>자동 연결됨 (Edge Function 경유)</span>
          </div>
        ) : connection.last_sync ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
            <Clock className="h-3 w-3" />
            <span>
              마지막 동기화:{' '}
              {formatDistanceToNow(new Date(connection.last_sync), { addSuffix: true, locale: ko })}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
            <Clock className="h-3 w-3" />
            <span>동기화 대기 중</span>
          </div>
        )}
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isDark ? 'rgba(32,32,40,0.8)' : 'rgba(255,255,255,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '16px',
        }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// API Connections List 메인 컴포넌트
// ============================================================================

interface ApiConnectionsListProps {
  orgId?: string;
  storeId?: string;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
}

export function ApiConnectionsList({ orgId, storeId, onEdit, onAdd }: ApiConnectionsListProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const { data: connections, isLoading, isFetching, error, refetch } = useApiConnections({ orgId, storeId });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0',
      }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }} />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '16px',
            borderRadius: '12px',
            background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
            border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)',
          }}>
            <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444' }}>연결 목록을 불러오는 중 오류가 발생했습니다.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex h-10 items-center justify-center gap-2 px-3 text-sm rounded-xl transition-all duration-200 mt-4"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
              color: isDark ? '#ffffff' : '#1a1a1f',
            }}
          >
            다시 시도
          </button>
        </div>
      </GlassCard>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plug className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', ...text3D.title }}>API 연결 없음</h3>
            <p style={{ margin: '0 0 16px 0', ...text3D.body }}>
              외부 시스템에서 데이터를 자동으로 가져오려면 API 연결을 추가하세요.
            </p>
            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="flex h-10 items-center justify-center gap-2 px-3 text-sm rounded-xl transition-all duration-200 mx-auto"
                style={{
                  background: isDark
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  boxShadow: isDark
                    ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                    : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
                  color: isDark ? '#ffffff' : '#1a1a1f',
                }}
              >
                <Plus className="w-4 h-4" />
                새 연결 추가
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <Link2 className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>API Connections</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>API 연결 ({connections.length})</h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                console.log('API 연결 새로고침 버튼 클릭됨');
                refetch();
              }}
              disabled={isFetching}
              title="새로고침"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isDark
                  ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                  : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} style={{ color: isDark ? '#ffffff' : '#1a1a1f' }} />
            </button>
            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="flex h-10 items-center justify-center gap-2 px-3 text-sm rounded-xl transition-all duration-200"
                style={{
                  background: isDark
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,255,0.8) 100%)',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  boxShadow: isDark
                    ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2)'
                    : '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
                  color: isDark ? '#ffffff' : '#1a1a1f',
                }}
              >
                <Plus className="w-4 h-4" />
                새 연결 추가
              </button>
            )}
          </div>
        </div>

        {/* 연결 카드 그리드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={onEdit}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default ApiConnectionsList;
