/**
 * 카테고리별 성과 테이블 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryPerformance } from '../types/roi.types';
import { getModuleConfig } from '../utils/moduleConfig';
import { useDarkMode } from '@/hooks/useDarkMode';
import { GlassCard, Icon3D } from '@/components/ui/glass-card';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

interface CategoryPerformanceTableProps {
  data: {
    '2d': CategoryPerformance[];
    '3d': CategoryPerformance[];
  };
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  if (value === 0) return '-';
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `+₩${(value / 1000000).toFixed(0)}M`;
  return `+₩${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => {
  if (value === 0) return '-';
  return `${value.toFixed(0)}%`;
};

const CategoryTable: React.FC<{
  title: string;
  data: CategoryPerformance[];
  isLoading: boolean;
  isDark: boolean;
}> = ({ title, data, isLoading, isDark }) => {
  const text3D = getText3D(isDark);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>{title}</h4>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
            <div style={{ height: '14px', width: '120px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <div style={{ height: '14px', width: '50px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
            <div style={{ height: '14px', width: '50px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
            <div style={{ height: '14px', width: '60px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }} />
            <div style={{ height: '14px', width: '60px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>{title}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>유형</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>적용</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>성공</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>평균ROI</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>총 효과</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const config = getModuleConfig(item.sourceModule);
              const hasData = item.appliedCount > 0;

              return (
                <tr
                  key={item.sourceModule}
                  style={{
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
                    opacity: hasData ? 1 : 0.5,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (hasData) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon3D size={28} dark={isDark}>{config.icon}</Icon3D>
                      <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{config.displayName}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px', color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                    {hasData ? `${item.appliedCount}건` : '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px', color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                    {hasData ? `${item.successCount}건` : '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>
                    {formatPercent(item.averageRoi)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px', color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
                    -
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CategoryPerformanceTable: React.FC<CategoryPerformanceTableProps> = ({
  data,
  isLoading,
}) => {
  const isDark = useDarkMode();

  const text3D = getText3D(isDark);

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', ...text3D.number }}>
          카테고리별 성과
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <CategoryTable
            title="2D 시뮬레이션 (인사이트 허브)"
            data={data['2d']}
            isLoading={isLoading}
            isDark={isDark}
          />
          <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
          <CategoryTable
            title="3D 시뮬레이션 (디지털트윈 스튜디오)"
            data={data['3d']}
            isLoading={isLoading}
            isDark={isDark}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default CategoryPerformanceTable;
