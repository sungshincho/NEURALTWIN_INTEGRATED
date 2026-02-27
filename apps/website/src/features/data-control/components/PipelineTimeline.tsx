// ============================================================================
// PipelineTimeline.tsx - 데이터 파이프라인 현황 (비즈니스 관점 + 실시간 모니터링)
// ============================================================================

import {
  ShoppingCart,
  Wifi,
  Users,
  Package,
  FileUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import type { PipelineStats, DataSourceFlow, PipelineHealth } from '../types';
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
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.02em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 50%, #1a1a1f 100%)',
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

// ============================================================================
// 상태 배지 컴포넌트
// ============================================================================

const StatusBadge = ({ status, dark }: { status: 'healthy' | 'warning' | 'error' | 'unknown'; dark: boolean }) => {
  const config = {
    healthy: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', label: '정상 운영 중' },
    warning: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', color: '#eab308', label: '주의 필요' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: '오류 발생' },
    unknown: { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', color: '#6b7280', label: '확인 중' },
  };
  const c = config[status];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: '20px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color,
        boxShadow: `0 0 8px ${c.color}`, animation: status === 'healthy' ? 'pulse 2s infinite' : 'none' }} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: c.color }}>{c.label}</span>
    </div>
  );
};

// ============================================================================
// 데이터 흐름 컬럼 헤더 컴포넌트
// ============================================================================

const DataFlowHeader = ({ dark, text3D }: { dark: boolean; text3D: ReturnType<typeof getText3D> }) => {
  const grayColor = dark ? 'rgba(255,255,255,0.4)' : '#9ca3af';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '8px 16px',
      marginBottom: '8px',
    }}>
      {/* 변환 전 소스 */}
      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: grayColor, textAlign: 'center' }}>
        변환 전 소스
      </div>

      {/* 변환 결과 */}
      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: grayColor, textAlign: 'center' }}>
        변환 결과
      </div>

      {/* 대시보드 연결 */}
      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: grayColor, textAlign: 'center' }}>
        대시보드 연결
      </div>

      {/* 추세 */}
      <div style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: grayColor, textAlign: 'center' }}>
        추세
      </div>
    </div>
  );
};

// ============================================================================
// 데이터 흐름 행 컴포넌트
// ============================================================================

const DataFlowRow = ({ flow, dark, text3D }: { flow: DataSourceFlow; dark: boolean; text3D: ReturnType<typeof getText3D> }) => {
  const icons: Record<string, any> = {
    pos: ShoppingCart,
    sensor: Wifi,
    customer: Users,
    inventory: Package,
    import: FileUp,
  };
  const Icon = icons[flow.source] || Activity;

  const grayColor = dark ? 'rgba(255,255,255,0.5)' : '#6b7280';
  const textStyle = { fontSize: '13px', fontWeight: 500, color: dark ? 'rgba(255,255,255,0.8)' : '#374151' };

  const TrendIcon = flow.trend === 'up' ? TrendingUp : flow.trend === 'down' ? TrendingDown : Minus;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: '12px', marginBottom: '8px',
      border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
    }}>
      {/* 변환 전 소스: 아이콘 + 라벨 + 건수 (한 줄) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        }}>
          <Icon className="w-4 h-4" style={{ color: grayColor }} />
        </div>
        <span style={textStyle}>{flow.label} {flow.inputCount.toLocaleString()}건</span>
      </div>

      {/* 변환 결과: 테이블명 + 건수 (한 줄) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span style={textStyle}>{flow.outputTable} {flow.outputCount.toLocaleString()}건</span>
      </div>

      {/* 대시보드 연결 상태 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {flow.kpiConnected ? (
          <>
            <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#22c55e' }}>연결됨</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" style={{ color: '#eab308' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#eab308' }}>미연결</span>
          </>
        )}
      </div>

      {/* 추세 (미연결 시 빈 공간 유지) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {flow.kpiConnected && flow.trend && (
          <TrendIcon className="w-4 h-4" style={{
            color: flow.trend === 'up' ? '#22c55e' : flow.trend === 'down' ? '#ef4444' : '#6b7280',
          }} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 처리량 요약 컴포넌트
// ============================================================================

const ProcessingSummary = ({ stats, dark, text3D }: {
  stats: { input: number; transformed: number; aggregated: number; failed: number };
  dark: boolean;
  text3D: ReturnType<typeof getText3D>;
}) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
    padding: '16px',
    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: '12px',
    border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
  }}>
    {[
      { label: '입력', value: stats.input, color: '#3b82f6' },
      { label: '변환', value: stats.transformed, color: '#8b5cf6' },
      { label: '집계', value: stats.aggregated, color: '#22c55e' },
      { label: '실패', value: stats.failed, color: stats.failed > 0 ? '#ef4444' : '#6b7280' },
    ].map((item) => (
      <div key={item.label} style={{ textAlign: 'center' }}>
        <div style={{ ...text3D.small }}>{item.label}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>
          {item.value.toLocaleString()}
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// 메인 컴포넌트
// ============================================================================

interface PipelineTimelineProps {
  stats: PipelineStats;
  onRefresh?: () => void;
}

export function PipelineTimeline({ stats, onRefresh }: PipelineTimelineProps) {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // 기본 데이터 흐름 (stats.data_flows가 없을 경우 fallback)
  const dataFlows: DataSourceFlow[] = stats.data_flows || [
    {
      source: 'pos',
      label: 'POS',
      icon: 'shopping-cart',
      inputCount: 0,
      outputTable: 'transactions',
      outputCount: 0,
      kpiConnected: false,
      status: 'inactive',
      lastSync: null,
    },
    {
      source: 'sensor',
      label: '센서',
      icon: 'wifi',
      inputCount: stats.l2_records,
      outputTable: 'zone_events',
      outputCount: stats.l2_records,
      kpiConnected: stats.l3_records > 0,
      status: stats.l2_records > 0 ? 'active' : 'inactive',
      lastSync: null,
    },
    {
      source: 'customer',
      label: '고객',
      icon: 'users',
      inputCount: 0,
      outputTable: 'customers',
      outputCount: 0,
      kpiConnected: false,
      status: 'inactive',
      lastSync: null,
    },
    {
      source: 'inventory',
      label: '재고',
      icon: 'package',
      inputCount: 0,
      outputTable: 'inventory_levels',
      outputCount: 0,
      kpiConnected: false,
      status: 'inactive',
      lastSync: null,
    },
    {
      source: 'import',
      label: '파일',
      icon: 'file-up',
      inputCount: stats.raw_imports.total,
      outputTable: 'user_data_imports',
      outputCount: stats.raw_imports.completed,
      kpiConnected: false,
      status: stats.raw_imports.total > 0 ? 'active' : 'inactive',
      lastSync: null,
    },
  ];

  // 파이프라인 건강 상태
  const pipelineHealth: PipelineHealth = stats.pipeline_health || {
    status: stats.l2_records > 0 && stats.l3_records > 0 ? 'healthy' :
            stats.l2_records > 0 ? 'warning' : 'unknown',
    message: stats.l2_records > 0 && stats.l3_records > 0
      ? '모든 데이터 파이프라인이 정상 작동 중입니다.'
      : stats.l2_records > 0
        ? '일부 데이터 소스가 미연동 상태입니다.'
        : '데이터 파이프라인을 확인해주세요.',
    warnings: [],
  };

  // 오늘 처리량
  const todayProcessed = stats.today_processed || {
    input: stats.raw_imports.total,
    transformed: stats.l2_records,
    aggregated: stats.l3_records,
    failed: stats.raw_imports.failed,
  };

  // 활성 데이터 소스 수
  const activeFlows = dataFlows.filter(f => f.status === 'active').length;
  const connectedFlows = dataFlows.filter(f => f.kpiConnected).length;

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={44} dark={isDark}>
              <Activity className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>Data Pipeline</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>데이터 흐름 현황</h3>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
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
              <RefreshCw className="w-4 h-4" style={{ color: isDark ? '#ffffff' : '#1a1a1f' }} />
            </button>
          )}
        </div>

        {/* 요약 통계 */}
        <div style={{
          display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px 0',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }}>
          <div>
            <span style={text3D.small}>활성 소스</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
              {activeFlows}/{dataFlows.length}
            </div>
          </div>
          <div>
            <span style={text3D.small}>KPI 연결</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>
              {connectedFlows}/{dataFlows.length}
            </div>
          </div>
          <div>
            <span style={text3D.small}>L3 집계</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
              {stats.l3_records.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 데이터 흐름 목록 */}
        <div style={{ marginBottom: '20px' }}>
          <DataFlowHeader dark={isDark} text3D={text3D} />
          {dataFlows.map((flow) => (
            <DataFlowRow key={flow.source} flow={flow} dark={isDark} text3D={text3D} />
          ))}
        </div>

        {/* 오늘 처리량 */}
        <div>
          <div style={{ ...text3D.small, marginBottom: '12px' }}>오늘 처리량</div>
          <ProcessingSummary stats={todayProcessed} dark={isDark} text3D={text3D} />
        </div>

        {/* 경고 메시지 */}
        {pipelineHealth.warnings.length > 0 && (
          <div style={{
            marginTop: '16px', padding: '12px', borderRadius: '8px',
            background: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.3)',
          }}>
            {pipelineHealth.warnings.map((warning, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', ...text3D.small, color: '#eab308' }}>
                <AlertTriangle className="w-4 h-4" />
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
