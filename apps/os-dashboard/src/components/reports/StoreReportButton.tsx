/**
 * StoreReportButton.tsx
 *
 * 매장 진단 리포트 PDF 다운로드 버튼 컴포넌트
 *
 * - Zustand 스토어(screenDataStore, dateFilterStore, useAIInsightStore)에서
 *   현재 화면 데이터를 읽어 PDF 리포트를 생성합니다.
 * - 생성 중 로딩 스피너 표시
 * - OS Dashboard의 glassmorphism dark theme과 일관된 스타일
 */

import { useState, useCallback } from 'react';
import { FileDown, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenDataStore } from '@/store/screenDataStore';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAIInsightStore } from '@/store/useAIInsightStore';
import {
  generateStoreReport,
  downloadPdfBlob,
  type StoreReportParams,
  type ReportAnomaly,
  type ReportAIInsight,
  type WeeklyComparison,
} from '@/utils/generateStoreReport';

// ============================================================================
// Types
// ============================================================================

interface StoreReportButtonProps {
  /** 매장 이름 (기본: "NeuralTwin 매장") */
  storeName?: string;
  /** 업종 (기본: "리테일") */
  storeType?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 아이콘만 표시 (텍스트 숨김) */
  iconOnly?: boolean;
}

type ButtonState = 'idle' | 'generating' | 'success' | 'error';

// ============================================================================
// Helpers
// ============================================================================

function generateFilename(storeName: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const safeName = storeName.replace(/[^a-zA-Z0-9\uAC00-\uD7AF]/g, '_');
  return `NeuralTwin_${safeName}_진단리포트_${dateStr}.pdf`;
}

/**
 * 주간 비교 데이터 생성 (현재 KPI 기반, 지난 주는 추정치로 시뮬레이션)
 * 실제 환경에서는 DB에서 지난 주 데이터를 가져와야 합니다.
 */
function buildWeeklyComparison(kpiData: StoreReportParams['kpiData']): WeeklyComparison[] {
  // 지난 주 값은 현재 값 대비 +/- 랜덤 시뮬레이션 (실제 구현 시 DB 조회)
  // 여기서는 데모 목적으로 고정 비율을 사용합니다.
  const estimatePrev = (current: number, changePercent: number) =>
    Math.round(current / (1 + changePercent / 100));

  return [
    {
      metric: '총 방문객',
      thisWeek: kpiData.visitors,
      lastWeek: estimatePrev(kpiData.visitors, 8.3),
      unit: '명',
    },
    {
      metric: '총 매출',
      thisWeek: kpiData.revenue,
      lastWeek: estimatePrev(kpiData.revenue, 5.2),
      unit: '원',
    },
    {
      metric: '전환율',
      thisWeek: Math.round(kpiData.conversionRate * 10),
      lastWeek: Math.round(kpiData.conversionRate * 10 * 0.95),
      unit: '%',
    },
    {
      metric: '객단가',
      thisWeek: kpiData.atv,
      lastWeek: estimatePrev(kpiData.atv, 2.1),
      unit: '원',
    },
    {
      metric: '평균 체류시간',
      thisWeek: Math.round(kpiData.avgDwellMinutes),
      lastWeek: Math.round(kpiData.avgDwellMinutes * 0.92),
      unit: '분',
    },
  ];
}

// ============================================================================
// Component
// ============================================================================

export function StoreReportButton({
  storeName = 'NeuralTwin 매장',
  storeType = '리테일',
  className,
  size = 'md',
  iconOnly = false,
}: StoreReportButtonProps) {
  const [buttonState, setButtonState] = useState<ButtonState>('idle');

  // Read from Zustand stores
  const screenData = useScreenDataStore((s) => s.screenData);
  const dateRange = useDateFilterStore((s) => s.dateRange);
  const insights = useAIInsightStore((s) => s.insights);

  const handleGenerate = useCallback(async () => {
    if (buttonState === 'generating') return;

    setButtonState('generating');

    try {
      // Build KPI data from screen store (with fallbacks)
      const overview = screenData.overviewKPIs;
      const storeKPIs = screenData.storeKPIs;
      const funnel = screenData.funnel;

      const kpiData: StoreReportParams['kpiData'] = {
        visitors: overview?.footfall ?? 0,
        uniqueVisitors: overview?.uniqueVisitors ?? 0,
        revenue: overview?.revenue ?? 0,
        conversionRate: overview?.conversionRate ?? 0,
        transactions: overview?.transactions ?? 0,
        atv: overview?.atv ?? 0,
        avgDwellMinutes: storeKPIs?.avgDwellMinutes ?? 0,
        visitFrequency: overview?.visitFrequency ?? 0,
      };

      // Zone data
      const zoneData = storeKPIs?.zones?.map((z) => ({
        name: z.name,
        visitors: z.visitors,
        avgDwellMinutes: z.avgDwellMinutes,
        conversionRate: z.conversionRate,
      }));

      // Hourly data
      const hourlyData = storeKPIs?.hourlyPattern?.map((h) => ({
        hour: h.hour,
        visitors: h.visitors,
      }));

      // Funnel data
      const funnelData = funnel
        ? {
            entry: funnel.entry,
            browse: funnel.browse,
            engage: funnel.engage,
            fitting: funnel.fitting,
            purchase: funnel.purchase,
          }
        : undefined;

      // AI Insights (top 3 suggestions)
      const aiInsights: ReportAIInsight[] = insights
        .filter((i) => i.type === 'suggestion' || i.type === 'digest')
        .slice(0, 3)
        .map((i) => ({
          title: i.title,
          message: i.message,
          type: i.type,
        }));

      // Anomalies
      const anomalies: ReportAnomaly[] = insights
        .filter((i) => i.type === 'anomaly')
        .slice(0, 10)
        .map((i) => ({
          title: i.title,
          message: i.message,
          severity: i.severity ?? 'info',
          timestamp: i.timestamp,
        }));

      // Weekly comparison (simulated from current data)
      const weeklyComparison = buildWeeklyComparison(kpiData);

      // Period
      const period = {
        start: screenData.dateRange?.startDate ?? dateRange.startDate,
        end: screenData.dateRange?.endDate ?? dateRange.endDate,
      };

      const reportParams: StoreReportParams = {
        storeName,
        storeType,
        period,
        kpiData,
        funnelData,
        zoneData,
        hourlyData,
        anomalies: anomalies.length > 0 ? anomalies : undefined,
        aiInsights: aiInsights.length > 0 ? aiInsights : undefined,
        weeklyComparison,
      };

      // Generate in next microtask to let UI update to loading state
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const blob = generateStoreReport(reportParams);
          const filename = generateFilename(storeName);
          downloadPdfBlob(blob, filename);
          resolve();
        });
      });

      setButtonState('success');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
    } catch (err) {
      console.error('[StoreReportButton] PDF 생성 실패:', err);
      setButtonState('error');
      setTimeout(() => setButtonState('idle'), 3000);
    }
  }, [buttonState, screenData, dateRange, insights, storeName, storeType]);

  // ── Size variants ──
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-base gap-2.5',
  };

  const iconSizeStyles = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconOnlySizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // ── State-dependent rendering ──
  const isDisabled = buttonState === 'generating';

  const renderIcon = () => {
    const iconClass = iconSizeStyles[size];

    switch (buttonState) {
      case 'generating':
        return <Loader2 className={cn(iconClass, 'animate-spin')} />;
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
      case 'idle':
      default:
        return <FileDown className={iconClass} />;
    }
  };

  const renderLabel = () => {
    switch (buttonState) {
      case 'generating':
        return '리포트 생성 중...';
      case 'success':
        return '다운로드 완료';
      case 'error':
        return '생성 실패';
      default:
        return '진단 리포트';
    }
  };

  const stateColors = {
    idle: '',
    generating: 'opacity-80 cursor-wait',
    success: '!border-emerald-500/30 !shadow-[0_0_16px_rgba(16,185,129,0.15)]',
    error: '!border-rose-500/30 !shadow-[0_0_16px_rgba(239,68,68,0.15)]',
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isDisabled}
      title="매장 진단 리포트 PDF 다운로드"
      aria-label="매장 진단 리포트 PDF 다운로드"
      className={cn(
        // ── Glassmorphism dark base ──
        'relative inline-flex items-center justify-center',
        'bg-white/[0.06] backdrop-blur-md',
        'border border-white/[0.1]',
        'rounded-xl',
        'text-white/80 font-medium',
        'shadow-lg shadow-black/10',

        // ── Hover & transitions ──
        'hover:bg-white/[0.1] hover:border-white/[0.16] hover:text-white',
        'hover:shadow-[0_0_20px_rgba(124,58,237,0.12)]',
        'active:scale-[0.97]',
        'transition-all duration-200 ease-out',

        // ── Focus ──
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',

        // ── Disabled ──
        'disabled:pointer-events-none',

        // ── Size ──
        iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],

        // ── State colors ──
        stateColors[buttonState],

        className,
      )}
    >
      {/* Subtle gradient overlay */}
      <span
        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)',
        }}
      />

      {/* Content */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {renderIcon()}
        {!iconOnly && (
          <span className="whitespace-nowrap">{renderLabel()}</span>
        )}
      </span>
    </button>
  );
}

export default StoreReportButton;
