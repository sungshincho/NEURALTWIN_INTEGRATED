/**
 * useReportData.ts
 *
 * Store Diagnostic Report 데이터 집계 Hook
 * - KPI, Zone, AI Recommendations, Alerts 데이터를 집계
 * - 기간별 트렌드 계산
 * - 리포트 템플릿에 사용할 수 있는 형태로 반환
 */

import { useMemo } from 'react';
import { useKPIsByDateRange, DashboardKPI } from './useDashboardKPI';
import { useZoneMetricsByDateRange, useZonesDim } from './useZoneMetrics';
import { useAIRecommendations } from './useAIRecommendations';
import { useAlerts, UserAlert } from './useAlerts';
import { useSelectedStore } from './useSelectedStore';
import { format, subDays } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface ReportKPISummary {
  totalVisitors: number;
  totalRevenue: number;
  avgConversionRate: number;
  avgDwellMinutes: number;
  totalTransactions: number;
  avgSalesPerSqm: number;
  visitorsTrend: number; // % change vs previous period
  revenueTrend: number;
  conversionTrend: number;
}

export interface ReportDailyTrend {
  date: string;
  visitors: number;
  revenue: number;
  conversionRate: number;
  transactions: number;
}

export interface ReportZoneSummary {
  zoneId: string;
  zoneName: string;
  visitors: number;
  avgDwellSeconds: number;
  intensity: number;
  revenue: number;
  conversionCount: number;
}

export interface ReportAIInsight {
  title: string;
  description: string;
  priority: string;
  category?: string;
}

export interface ReportAnomaly {
  title: string;
  message: string;
  severity: string;
  timestamp: string;
}

export interface ReportActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ReportData {
  storeName: string;
  storeCode: string;
  reportDate: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  kpiSummary: ReportKPISummary;
  dailyTrends: ReportDailyTrend[];
  zoneSummary: ReportZoneSummary[];
  aiInsights: ReportAIInsight[];
  anomalies: ReportAnomaly[];
  actionItems: ReportActionItem[];
  isLoading: boolean;
  hasData: boolean;
}

export type ReportPeriod = '7d' | '30d' | 'custom';

// ============================================================================
// Helper: Trend Calculation
// ============================================================================

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// ============================================================================
// Hook
// ============================================================================

export function useReportData(period: ReportPeriod = '7d', customStart?: string, customEnd?: string): ReportData {
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  // Calculate date ranges
  const { startDate, endDate, prevStartDate, prevEndDate, periodLabel } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    let label: string;

    if (period === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      label = `${format(start, 'yyyy.MM.dd')} ~ ${format(end, 'yyyy.MM.dd')} (${days}일)`;
    } else {
      const days = period === '30d' ? 30 : 7;
      start = subDays(now, days);
      label = `최근 ${days}일`;
    }

    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevEnd = subDays(start, 1);
    const prevStart = subDays(prevEnd, periodDays);

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      prevStartDate: format(prevStart, 'yyyy-MM-dd'),
      prevEndDate: format(prevEnd, 'yyyy-MM-dd'),
      periodLabel: label,
    };
  }, [period, customStart, customEnd]);

  // Fetch data
  const { data: currentKPIs, isLoading: kpiLoading } = useKPIsByDateRange(storeId, startDate, endDate);
  const { data: previousKPIs } = useKPIsByDateRange(storeId, prevStartDate, prevEndDate);
  const { data: zoneMetrics, isLoading: zoneLoading } = useZoneMetricsByDateRange(storeId, startDate, endDate);
  const { data: zonesDim } = useZonesDim(storeId);
  const { data: aiRecommendations, isLoading: aiLoading } = useAIRecommendations(storeId);
  const { data: alerts, isLoading: alertsLoading } = useAlerts(50);

  const isLoading = kpiLoading || zoneLoading || aiLoading || alertsLoading;

  // Build KPI summary
  const kpiSummary = useMemo((): ReportKPISummary => {
    const kpis = currentKPIs || [];
    const prevKpis = previousKPIs || [];

    if (kpis.length === 0) {
      return {
        totalVisitors: 0,
        totalRevenue: 0,
        avgConversionRate: 0,
        avgDwellMinutes: 0,
        totalTransactions: 0,
        avgSalesPerSqm: 0,
        visitorsTrend: 0,
        revenueTrend: 0,
        conversionTrend: 0,
      };
    }

    const totalVisitors = kpis.reduce((sum, k) => sum + k.total_visits, 0);
    const totalRevenue = kpis.reduce((sum, k) => sum + k.total_revenue, 0);
    const avgConversionRate = kpis.reduce((sum, k) => sum + k.conversion_rate, 0) / kpis.length;
    const totalTransactions = kpis.reduce((sum, k) => sum + k.total_purchases, 0);
    const avgSalesPerSqm = kpis.reduce((sum, k) => sum + k.sales_per_sqm, 0) / kpis.length;

    const prevTotalVisitors = prevKpis.reduce((sum, k) => sum + k.total_visits, 0);
    const prevTotalRevenue = prevKpis.reduce((sum, k) => sum + k.total_revenue, 0);
    const prevAvgConversion = prevKpis.length > 0
      ? prevKpis.reduce((sum, k) => sum + k.conversion_rate, 0) / prevKpis.length
      : 0;

    return {
      totalVisitors,
      totalRevenue,
      avgConversionRate: Number(avgConversionRate.toFixed(1)),
      avgDwellMinutes: 0, // Will be populated from zone metrics
      totalTransactions,
      avgSalesPerSqm: Number(avgSalesPerSqm.toFixed(0)),
      visitorsTrend: calculateTrend(totalVisitors, prevTotalVisitors),
      revenueTrend: calculateTrend(totalRevenue, prevTotalRevenue),
      conversionTrend: calculateTrend(avgConversionRate, prevAvgConversion),
    };
  }, [currentKPIs, previousKPIs]);

  // Build daily trends
  const dailyTrends = useMemo((): ReportDailyTrend[] => {
    if (!currentKPIs || currentKPIs.length === 0) return [];
    return currentKPIs.map((kpi) => ({
      date: kpi.date,
      visitors: kpi.total_visits,
      revenue: kpi.total_revenue,
      conversionRate: kpi.conversion_rate,
      transactions: kpi.total_purchases,
    }));
  }, [currentKPIs]);

  // Build zone summary
  const zoneSummary = useMemo((): ReportZoneSummary[] => {
    if (!zoneMetrics || zoneMetrics.length === 0) return [];

    // Build zone name map
    const zoneNameMap: Record<string, string> = {};
    if (zonesDim) {
      for (const z of zonesDim) {
        zoneNameMap[z.id] = z.zone_name || z.zone_code || z.id;
      }
    }

    // Aggregate zone metrics across dates
    const zoneMap = new Map<string, {
      visitors: number;
      dwellSum: number;
      dwellCount: number;
      intensitySum: number;
      intensityCount: number;
      revenue: number;
      conversions: number;
    }>();

    for (const m of zoneMetrics) {
      const existing = zoneMap.get(m.zone_id) || {
        visitors: 0,
        dwellSum: 0,
        dwellCount: 0,
        intensitySum: 0,
        intensityCount: 0,
        revenue: 0,
        conversions: 0,
      };

      existing.visitors += m.total_visitors || 0;
      existing.dwellSum += m.avg_dwell_seconds || 0;
      existing.dwellCount += 1;
      existing.intensitySum += m.heatmap_intensity || 0;
      existing.intensityCount += 1;
      existing.revenue += m.revenue_attributed || 0;
      existing.conversions += m.conversion_count || 0;

      zoneMap.set(m.zone_id, existing);
    }

    return Array.from(zoneMap.entries())
      .map(([zoneId, data]) => ({
        zoneId,
        zoneName: zoneNameMap[zoneId] || zoneId.slice(0, 8),
        visitors: data.visitors,
        avgDwellSeconds: data.dwellCount > 0
          ? Math.round(data.dwellSum / data.dwellCount)
          : 0,
        intensity: data.intensityCount > 0
          ? Number((data.intensitySum / data.intensityCount).toFixed(1))
          : 0,
        revenue: data.revenue,
        conversionCount: data.conversions,
      }))
      .sort((a, b) => b.visitors - a.visitors);
  }, [zoneMetrics, zonesDim]);

  // Build AI insights
  const aiInsights = useMemo((): ReportAIInsight[] => {
    if (!aiRecommendations || aiRecommendations.length === 0) return [];
    return aiRecommendations.map((r) => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      category: r.action_category,
    }));
  }, [aiRecommendations]);

  // Build anomalies from alerts with severity
  const anomalies = useMemo((): ReportAnomaly[] => {
    if (!alerts || alerts.length === 0) return [];
    return alerts
      .filter((a: UserAlert) => a.severity === 'critical' || a.severity === 'warning')
      .slice(0, 10)
      .map((a: UserAlert) => ({
        title: a.title,
        message: a.message || '',
        severity: a.severity,
        timestamp: a.created_at,
      }));
  }, [alerts]);

  // Build action items from AI recommendations and critical alerts
  const actionItems = useMemo((): ReportActionItem[] => {
    const items: ReportActionItem[] = [];

    // From AI recommendations
    if (aiRecommendations) {
      for (const r of aiRecommendations) {
        items.push({
          title: r.title,
          description: r.description,
          priority: r.priority as 'high' | 'medium' | 'low',
        });
      }
    }

    // From critical alerts
    if (alerts) {
      for (const a of alerts.filter((al: UserAlert) => al.severity === 'critical').slice(0, 3)) {
        items.push({
          title: a.title,
          description: a.message || '',
          priority: 'high',
        });
      }
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return items
      .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
      .slice(0, 6);
  }, [aiRecommendations, alerts]);

  // Update dwellMinutes in kpiSummary from zone data
  const finalKpiSummary = useMemo((): ReportKPISummary => {
    if (zoneSummary.length === 0) return kpiSummary;
    const totalDwellSeconds = zoneSummary.reduce((sum, z) => sum + z.avgDwellSeconds, 0);
    const avgDwellMinutes = zoneSummary.length > 0
      ? Number((totalDwellSeconds / zoneSummary.length / 60).toFixed(1))
      : 0;
    return { ...kpiSummary, avgDwellMinutes };
  }, [kpiSummary, zoneSummary]);

  return {
    storeName: selectedStore?.store_name || '매장명 없음',
    storeCode: selectedStore?.store_code || '',
    reportDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
    periodLabel,
    startDate,
    endDate,
    kpiSummary: finalKpiSummary,
    dailyTrends,
    zoneSummary,
    aiInsights,
    anomalies,
    actionItems,
    isLoading,
    hasData: (currentKPIs?.length || 0) > 0,
  };
}
