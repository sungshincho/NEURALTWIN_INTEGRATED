// ============================================================================
// RecentImportsList.tsx - 최근 Import 목록 (3D Glassmorphism Design)
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  RotateCcw,
  FileUp,
} from 'lucide-react';
import { useReplayImport } from '../hooks/useDataControlTower';
import type { RawImport } from '../types';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

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
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.7)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#374151',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#9ca3af',
  } as React.CSSProperties,
  mono: isDark ? {
    fontWeight: 600, fontSize: '13px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '13px', fontFamily: 'monospace', color: '#1a1a1f',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '24px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.2)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02), 0 16px 16px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '23px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: dark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          borderRadius: '23px 23px 50% 50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 44, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.04)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '3px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

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
// 상태 설정
// ============================================================================

const statusConfig: Record<string, { label: string; icon: any; variant: 'success' | 'error' | 'warning' | 'default' }> = {
  completed: { label: '완료', icon: CheckCircle, variant: 'success' },
  failed: { label: '실패', icon: XCircle, variant: 'error' },
  processing: { label: '처리 중', icon: Loader2, variant: 'warning' },
  pending: { label: '대기', icon: Clock, variant: 'default' },
};

const dataTypeLabels: Record<string, string> = {
  purchases: '구매 데이터',
  customers: '고객 데이터',
  products: '상품 데이터',
  visits: '방문 데이터',
  wifi: 'WiFi 센서',
  ble: 'BLE 센서',
  staff: '직원 데이터',
  unknown: '기타',
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface RecentImportsListProps {
  imports: RawImport[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function RecentImportsList({ imports, isLoading, onRefresh }: RecentImportsListProps) {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const { replay, isReplaying } = useReplayImport();
  const [replayingId, setReplayingId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const handleReplay = async (importId: string) => {
    setReplayingId(importId);
    try {
      await replay(importId, true);
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <FileUp className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>Recent Imports</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>최근 데이터 Import</h3>
            </div>
          </div>
          {onRefresh && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('최근 Import 새로고침 버튼 클릭됨');
                onRefresh();
              }}
              disabled={isLoading}
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
            </Button>
          )}
        </div>

        {/* 콘텐츠 */}
        {imports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#d1d5db' }} />
            </div>
            <p style={text3D.body}>Import 기록이 없습니다</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* 테이블 헤더 */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr 80px',
              gap: '12px', padding: '12px 16px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '12px', marginBottom: '8px',
            }}>
              <span style={text3D.label}>소스</span>
              <span style={text3D.label}>데이터 유형</span>
              <span style={{ ...text3D.label, textAlign: 'right' }}>레코드</span>
              <span style={text3D.label}>상태</span>
              <span style={text3D.label}>일시</span>
              <span style={{ ...text3D.label, textAlign: 'right' }}>액션</span>
            </div>

            {/* 테이블 바디 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {imports.map((item) => {
                const status = statusConfig[item.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isReplayable = item.status === 'completed' || item.status === 'failed';
                const isCurrentlyReplaying = replayingId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr 80px',
                      gap: '12px', padding: '14px 16px', alignItems: 'center',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {/* 소스 */}
                    <div>
                      <div style={text3D.body}>{item.source_name || item.source_type}</div>
                      <div style={text3D.small}>{item.source_type}</div>
                    </div>

                    {/* 데이터 유형 */}
                    <div style={text3D.body}>
                      {dataTypeLabels[item.data_type || 'unknown'] || item.data_type}
                    </div>

                    {/* 레코드 */}
                    <div style={{ textAlign: 'right', ...text3D.mono }}>
                      {item.row_count.toLocaleString()}
                    </div>

                    {/* 상태 */}
                    <div>
                      <Badge3D dark={isDark} variant={status.variant}>
                        <StatusIcon className={`w-3 h-3 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </Badge3D>
                    </div>

                    {/* 일시 */}
                    <div style={text3D.small}>
                      {formatDate(item.created_at)}
                    </div>

                    {/* 액션 */}
                    <div style={{ textAlign: 'right' }}>
                      {isReplayable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplay(item.id)}
                          disabled={isReplaying}
                          title="재처리"
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                          }}
                        >
                          {isCurrentlyReplaying ? (
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
                          ) : (
                            <RotateCcw className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  }
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
