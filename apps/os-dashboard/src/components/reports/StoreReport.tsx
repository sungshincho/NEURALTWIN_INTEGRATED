/**
 * StoreReport.tsx
 *
 * Store Diagnostic PDF Report Template
 * - A4 print-friendly layout (210mm x 297mm)
 * - NeuralTwin branding
 * - Sections: Executive Summary, Daily Trends, Zone Heatmap, AI Insights, Anomalies, Actions
 * - Dark-on-white for print, @media print optimized
 */

import React, { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ReportData } from '@/hooks/useReportData';

// ============================================================================
// Styles (inline for print portability)
// ============================================================================

const STYLES = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    margin: '0 auto',
    padding: '20mm 18mm',
    background: '#ffffff',
    color: '#1a1a2e',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '11px',
    lineHeight: '1.6',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '3px solid #1a1a2e',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: '#1a1a2e',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#1a1a2e',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: '10px',
    color: '#666',
    fontWeight: 500,
    marginTop: '2px',
  },
  headerMeta: {
    textAlign: 'right' as const,
    fontSize: '10px',
    color: '#555',
    lineHeight: '1.8',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1a2e',
    borderBottom: '2px solid #e5e5ea',
    paddingBottom: '8px',
    marginBottom: '16px',
    marginTop: '28px',
    pageBreakAfter: 'avoid' as const,
  },
  sectionNumber: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: '6px',
    textAlign: 'center' as const,
    lineHeight: '24px',
    fontSize: '12px',
    fontWeight: 700,
    marginRight: '10px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  kpiCard: {
    border: '1px solid #e5e5ea',
    borderRadius: '10px',
    padding: '14px 16px',
    background: '#fafafa',
  },
  kpiLabel: {
    fontSize: '10px',
    color: '#888',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1a1a2e',
    fontVariantNumeric: 'tabular-nums',
  },
  kpiUnit: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#666',
    marginLeft: '4px',
  },
  kpiTrend: {
    fontSize: '10px',
    fontWeight: 600,
    marginTop: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '10px',
    marginBottom: '16px',
  },
  th: {
    background: '#1a1a2e',
    color: '#ffffff',
    padding: '8px 12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '10px',
    letterSpacing: '0.02em',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e5ea',
    fontSize: '10px',
    fontVariantNumeric: 'tabular-nums',
  },
  tdRight: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e5ea',
    fontSize: '10px',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  zebraRow: {
    background: '#f8f8fa',
  },
  chartContainer: {
    marginBottom: '20px',
  },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    height: '120px',
    borderBottom: '1px solid #e5e5ea',
    padding: '0 4px',
  },
  insightCard: {
    border: '1px solid #e5e5ea',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '10px',
    borderLeft: '4px solid #1a1a2e',
  },
  insightTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  insightDesc: {
    fontSize: '10px',
    color: '#555',
    lineHeight: '1.5',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  severityBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  },
  footer: {
    borderTop: '2px solid #e5e5ea',
    paddingTop: '12px',
    marginTop: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '9px',
    color: '#888',
  },
  pageBreak: {
    pageBreakBefore: 'always' as const,
  },
  noDataMessage: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#888',
    fontSize: '13px',
  },
};

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatCurrency(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
}

function getTrendColor(value: number): string {
  if (value > 0) return '#16a34a';
  if (value < 0) return '#dc2626';
  return '#888';
}

function getTrendArrow(value: number): string {
  if (value > 0) return '+';
  return '';
}

function getPriorityColor(priority: string): { bg: string; color: string } {
  switch (priority) {
    case 'high':
      return { bg: '#fde2e2', color: '#c0392b' };
    case 'medium':
      return { bg: '#fef3cd', color: '#856404' };
    case 'low':
      return { bg: '#d1ecf1', color: '#0c5460' };
    default:
      return { bg: '#e2e8f0', color: '#475569' };
  }
}

function getSeverityColor(severity: string): { bg: string; color: string; label: string } {
  switch (severity) {
    case 'critical':
      return { bg: '#fde2e2', color: '#c0392b', label: 'CRITICAL' };
    case 'warning':
      return { bg: '#fef3cd', color: '#856404', label: 'WARNING' };
    case 'success':
      return { bg: '#d4edda', color: '#155724', label: 'OK' };
    default:
      return { bg: '#d1ecf1', color: '#0c5460', label: 'INFO' };
  }
}

function formatDwellTime(seconds: number): string {
  if (seconds === 0) return '-';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

// ============================================================================
// Sub-Components
// ============================================================================

function KPICard({ label, value, unit, trend }: {
  label: string;
  value: string;
  unit: string;
  trend?: number;
}) {
  return (
    <div style={STYLES.kpiCard}>
      <div style={STYLES.kpiLabel}>{label}</div>
      <div>
        <span style={STYLES.kpiValue}>{value}</span>
        <span style={STYLES.kpiUnit}>{unit}</span>
      </div>
      {trend !== undefined && (
        <div style={{ ...STYLES.kpiTrend, color: getTrendColor(trend) }}>
          {getTrendArrow(trend)}{trend}% vs 이전 기간
        </div>
      )}
    </div>
  );
}

function MiniBarChart({ data, labelKey, valueKey, color = '#1a1a2e' }: {
  data: Array<Record<string, any>>;
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  if (data.length === 0) return null;
  const maxValue = Math.max(...data.map((d) => d[valueKey] || 0));
  if (maxValue === 0) return null;

  return (
    <div style={STYLES.chartContainer}>
      <div style={STYLES.barChart}>
        {data.map((d, i) => {
          const height = maxValue > 0 ? ((d[valueKey] || 0) / maxValue) * 100 : 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: '8px',
                  color: '#888',
                  marginBottom: '2px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatNumber(d[valueKey] || 0)}
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${Math.max(height, 2)}%`,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.8 + (height / 500),
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '8px',
              color: '#aaa',
            }}
          >
            {d[labelKey]
              ? format(parseISO(d[labelKey]), 'M/d', { locale: ko })
              : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div style={STYLES.sectionTitle}>
      <span style={STYLES.sectionNumber}>{number}</span>
      {title}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface StoreReportProps {
  data: ReportData;
}

export const StoreReport = forwardRef<HTMLDivElement, StoreReportProps>(
  function StoreReport({ data }, ref) {
    if (!data.hasData) {
      return (
        <div ref={ref} style={STYLES.page}>
          <ReportHeader data={data} />
          <div style={STYLES.noDataMessage}>
            선택한 기간에 데이터가 없습니다.
            <br />
            다른 기간을 선택하거나 데이터를 먼저 등록해주세요.
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} id="store-report">
        {/* Page 1 */}
        <div style={STYLES.page}>
          <ReportHeader data={data} />

          {/* Section 1: Executive Summary */}
          <SectionHeader number={1} title="Executive Summary - 핵심 KPI 요약" />
          <div style={STYLES.kpiGrid}>
            <KPICard
              label="총 방문자"
              value={formatNumber(data.kpiSummary.totalVisitors)}
              unit="명"
              trend={data.kpiSummary.visitorsTrend}
            />
            <KPICard
              label="총 매출"
              value={formatCurrency(data.kpiSummary.totalRevenue)}
              unit="원"
              trend={data.kpiSummary.revenueTrend}
            />
            <KPICard
              label="평균 전환율"
              value={String(data.kpiSummary.avgConversionRate)}
              unit="%"
              trend={data.kpiSummary.conversionTrend}
            />
            <KPICard
              label="평균 체류시간"
              value={String(data.kpiSummary.avgDwellMinutes)}
              unit="분"
            />
          </div>
          <div style={{ ...STYLES.kpiGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <KPICard
              label="총 거래 건수"
              value={formatNumber(data.kpiSummary.totalTransactions)}
              unit="건"
            />
            <KPICard
              label="평균 매출/㎡"
              value={formatCurrency(data.kpiSummary.avgSalesPerSqm)}
              unit="원/㎡"
            />
            <KPICard
              label="분석 기간"
              value={String(data.dailyTrends.length)}
              unit="일"
            />
          </div>

          {/* Section 2: Daily Trends */}
          <SectionHeader number={2} title="Daily Trends - 일별 추이" />

          {/* Visitors chart */}
          <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#1a1a2e' }}>
            방문자 추이
          </div>
          <MiniBarChart
            data={data.dailyTrends}
            labelKey="date"
            valueKey="visitors"
            color="#1a1a2e"
          />

          {/* Revenue chart */}
          <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#1a1a2e' }}>
            매출 추이 (원)
          </div>
          <MiniBarChart
            data={data.dailyTrends}
            labelKey="date"
            valueKey="revenue"
            color="#4a4a5a"
          />

          {/* Daily trend table */}
          <table style={STYLES.table}>
            <thead>
              <tr>
                <th style={STYLES.th}>날짜</th>
                <th style={{ ...STYLES.th, textAlign: 'right' }}>방문자</th>
                <th style={{ ...STYLES.th, textAlign: 'right' }}>매출</th>
                <th style={{ ...STYLES.th, textAlign: 'right' }}>전환율</th>
                <th style={{ ...STYLES.th, textAlign: 'right' }}>거래</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyTrends.map((day, i) => (
                <tr key={day.date} style={i % 2 === 1 ? STYLES.zebraRow : undefined}>
                  <td style={STYLES.td}>
                    {format(parseISO(day.date), 'M/d (EEE)', { locale: ko })}
                  </td>
                  <td style={STYLES.tdRight}>{formatNumber(day.visitors)}</td>
                  <td style={STYLES.tdRight}>{formatCurrency(day.revenue)}</td>
                  <td style={STYLES.tdRight}>{day.conversionRate.toFixed(1)}%</td>
                  <td style={STYLES.tdRight}>{formatNumber(day.transactions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Page 2 */}
        <div style={{ ...STYLES.page, ...STYLES.pageBreak }}>
          {/* Section 3: Zone Heatmap Summary */}
          <SectionHeader number={3} title="Zone Heatmap Summary - 구역별 성과" />
          {data.zoneSummary.length > 0 ? (
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th style={STYLES.th}>구역명</th>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>방문자</th>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>평균 체류</th>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>강도</th>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>매출</th>
                  <th style={{ ...STYLES.th, textAlign: 'right' }}>전환</th>
                </tr>
              </thead>
              <tbody>
                {data.zoneSummary.map((zone, i) => (
                  <tr key={zone.zoneId} style={i % 2 === 1 ? STYLES.zebraRow : undefined}>
                    <td style={STYLES.td}>
                      <strong>{zone.zoneName}</strong>
                    </td>
                    <td style={STYLES.tdRight}>{formatNumber(zone.visitors)}</td>
                    <td style={STYLES.tdRight}>{formatDwellTime(zone.avgDwellSeconds)}</td>
                    <td style={STYLES.tdRight}>
                      <span style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '8px',
                        background: `linear-gradient(to right, #e5e5ea ${100 - zone.intensity}%, #1a1a2e ${100 - zone.intensity}%)`,
                        borderRadius: '4px',
                        marginRight: '6px',
                        verticalAlign: 'middle',
                      }} />
                      {zone.intensity}
                    </td>
                    <td style={STYLES.tdRight}>{formatCurrency(zone.revenue)}</td>
                    <td style={STYLES.tdRight}>{formatNumber(zone.conversionCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ ...STYLES.noDataMessage, padding: '20px' }}>
              구역 데이터가 없습니다.
            </div>
          )}

          {/* Section 4: AI Insights */}
          <SectionHeader number={4} title="AI Insights - AI 분석 및 추천" />
          {data.aiInsights.length > 0 ? (
            data.aiInsights.map((insight, i) => {
              const colors = getPriorityColor(insight.priority);
              return (
                <div
                  key={i}
                  style={{
                    ...STYLES.insightCard,
                    borderLeftColor: colors.color,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        ...STYLES.priorityBadge,
                        background: colors.bg,
                        color: colors.color,
                      }}
                    >
                      {insight.priority.toUpperCase()}
                    </span>
                    {insight.category && (
                      <span style={{ fontSize: '9px', color: '#888' }}>
                        {insight.category}
                      </span>
                    )}
                  </div>
                  <div style={STYLES.insightTitle}>{insight.title}</div>
                  <div style={STYLES.insightDesc}>{insight.description}</div>
                </div>
              );
            })
          ) : (
            <div style={{ ...STYLES.noDataMessage, padding: '20px' }}>
              AI 추천 데이터가 없습니다.
            </div>
          )}

          {/* Section 5: Anomaly Report */}
          <SectionHeader number={5} title="Anomaly Report - 이상 탐지" />
          {data.anomalies.length > 0 ? (
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th style={{ ...STYLES.th, width: '80px' }}>심각도</th>
                  <th style={STYLES.th}>제목</th>
                  <th style={STYLES.th}>상세</th>
                  <th style={{ ...STYLES.th, width: '100px' }}>발생일시</th>
                </tr>
              </thead>
              <tbody>
                {data.anomalies.map((anomaly, i) => {
                  const sev = getSeverityColor(anomaly.severity);
                  return (
                    <tr key={i} style={i % 2 === 1 ? STYLES.zebraRow : undefined}>
                      <td style={STYLES.td}>
                        <span
                          style={{
                            ...STYLES.severityBadge,
                            background: sev.bg,
                            color: sev.color,
                          }}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td style={{ ...STYLES.td, fontWeight: 600 }}>{anomaly.title}</td>
                      <td style={{ ...STYLES.td, color: '#555' }}>{anomaly.message}</td>
                      <td style={{ ...STYLES.td, fontSize: '9px', color: '#888' }}>
                        {format(new Date(anomaly.timestamp), 'M/d HH:mm', { locale: ko })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ ...STYLES.noDataMessage, padding: '20px' }}>
              이상 탐지 내역이 없습니다.
            </div>
          )}

          {/* Section 6: Action Items */}
          <SectionHeader number={6} title="Action Items - 우선 조치 사항" />
          {data.actionItems.length > 0 ? (
            <table style={STYLES.table}>
              <thead>
                <tr>
                  <th style={{ ...STYLES.th, width: '30px' }}>#</th>
                  <th style={{ ...STYLES.th, width: '70px' }}>우선순위</th>
                  <th style={STYLES.th}>조치 사항</th>
                  <th style={STYLES.th}>상세</th>
                </tr>
              </thead>
              <tbody>
                {data.actionItems.map((item, i) => {
                  const colors = getPriorityColor(item.priority);
                  return (
                    <tr key={i} style={i % 2 === 1 ? STYLES.zebraRow : undefined}>
                      <td style={{ ...STYLES.td, textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                      <td style={STYLES.td}>
                        <span
                          style={{
                            ...STYLES.priorityBadge,
                            background: colors.bg,
                            color: colors.color,
                          }}
                        >
                          {item.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...STYLES.td, fontWeight: 600 }}>{item.title}</td>
                      <td style={{ ...STYLES.td, color: '#555', fontSize: '9px' }}>{item.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ ...STYLES.noDataMessage, padding: '20px' }}>
              조치 사항이 없습니다.
            </div>
          )}

          {/* Footer */}
          <div style={STYLES.footer}>
            <div>
              <strong>NeuralTwin</strong> | AI-Powered Retail Analytics Platform
            </div>
            <div>
              Generated: {data.reportDate} | Confidential
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// ============================================================================
// Report Header Sub-Component
// ============================================================================

function ReportHeader({ data }: { data: ReportData }) {
  return (
    <div style={STYLES.header}>
      <div style={STYLES.logoArea}>
        <div style={STYLES.logoIcon}>NT</div>
        <div>
          <div style={STYLES.logoText}>NeuralTwin</div>
          <div style={STYLES.logoSub}>Store Diagnostic Report</div>
        </div>
      </div>
      <div style={STYLES.headerMeta}>
        <div>
          <strong>매장:</strong> {data.storeName}
          {data.storeCode && <span> ({data.storeCode})</span>}
        </div>
        <div><strong>분석 기간:</strong> {data.periodLabel}</div>
        <div><strong>생성일:</strong> {data.reportDate}</div>
      </div>
    </div>
  );
}

export default StoreReport;
