/**
 * ROI 측정 대시보드 메인 페이지
 *
 * 모든 시뮬레이션(2D/3D) 적용 결과를 한 곳에서 추적하고 ROI를 측정
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';

import { useROISummary } from './hooks/useROISummary';
import { useCategoryPerformanceGrouped } from './hooks/useCategoryPerformance';
import { useAppliedStrategies } from './hooks/useAppliedStrategies';

import {
  ROISummaryCards,
  CategoryPerformanceTable,
  AppliedStrategyTable,
  StrategyDetailModal,
  AIInsightsCard,
} from './components';

import type { DateRange } from './types/roi.types';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export const ROIMeasurementPage: React.FC = () => {
  const { selectedStore } = useSelectedStore();
  const [dateRange, setDateRange] = useState<DateRange>('90d');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // AI 어시스턴트 날짜 필터 연동
  useEffect(() => {
    const handleDateRange = (e: Event) => {
      const { preset } = (e as CustomEvent).detail;
      const validPresets: DateRange[] = ['7d', '30d', '90d', 'all'];
      if (preset && validPresets.includes(preset)) {
        setDateRange(preset as DateRange);
      }
    };
    window.addEventListener('assistant:set-date-range', handleDateRange);
    return () => window.removeEventListener('assistant:set-date-range', handleDateRange);
  }, []);

  // 데이터 훅
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useROISummary(dateRange);

  const {
    data: categoryData,
    isLoading: categoryLoading,
    refetch: refetchCategory,
  } = useCategoryPerformanceGrouped(dateRange);

  const {
    data: strategies,
    isLoading: strategiesLoading,
    refetch: refetchStrategies,
  } = useAppliedStrategies(dateRange);

  const handleRefresh = () => {
    refetchSummary();
    refetchCategory();
    refetchStrategies();
  };

  const handleExportAll = () => {
    // 전체 데이터 내보내기 로직 (간단히 JSON 형태로)
    const exportData = {
      summary,
      categoryData,
      strategies,
      exportedAt: new Date().toISOString(),
      dateRange,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roi_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 min-h-screen">
        {/* 헤더 - InsightHub/Settings 스타일 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Logo - 3D glassmorphism button style */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Chrome highlight */}
              <div
                className="absolute"
                style={{
                  top: '2px',
                  left: '18%',
                  right: '18%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                }}
              />
              <TrendingUp
                className="h-5 w-5"
                style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  ...(isDark ? {
                    color: '#ffffff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  } : {
                    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                  }),
                }}
              >
                ROI 측정 대시보드
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#515158',
                  textShadow: isDark ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                모든 시뮬레이션 적용 결과를 한눈에 추적하고 분석하세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className={`w-32 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
                <SelectItem value="all">전체 기간</SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
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
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExportAll}
              className="flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm transition-all duration-200"
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
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>
        </div>

        {/* KPI 요약 카드 */}
        <ROISummaryCards data={summary} isLoading={summaryLoading} />

        {/* 카테고리별 성과 */}
        <CategoryPerformanceTable
          data={categoryData || { '2d': [], '3d': [] }}
          isLoading={categoryLoading}
        />

        {/* 적용 이력 테이블 */}
        <AppliedStrategyTable
          data={strategies}
          isLoading={strategiesLoading}
          onRowClick={(id) => setSelectedStrategyId(id)}
        />

        {/* AI 인사이트 */}
        <AIInsightsCard dateRange={dateRange} />

        {/* 전략 상세 모달 */}
        {selectedStrategyId && (
          <StrategyDetailModal
            strategyId={selectedStrategyId}
            onClose={() => setSelectedStrategyId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ROIMeasurementPage;
