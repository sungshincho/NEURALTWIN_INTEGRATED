/**
 * generateStoreReport.ts
 *
 * NeuralTwin OS Dashboard - PDF 리포트 생성 유틸리티
 *
 * 매장 진단 리포트(Store Diagnostic Report)를 jsPDF로 생성합니다.
 * - 커버 페이지, 경영 요약, 트래픽 분석, 전환 퍼널, AI 인사이트,
 *   이상 탐지, 주간 비교 7개 섹션으로 구성
 * - 한국어 텍스트, NeuralTwin 브랜딩 (#1e1b4b 퍼플)
 * - jspdf-autotable 없이 직접 테이블 드로잉 (의존성 최소화)
 */

import { jsPDF } from 'jspdf';

// ============================================================================
// Types
// ============================================================================

export interface ReportKPIData {
  /** 총 방문객 수 */
  visitors: number;
  /** 순 방문객 수 */
  uniqueVisitors: number;
  /** 총 매출 (원) */
  revenue: number;
  /** 구매 전환율 (%) */
  conversionRate: number;
  /** 거래 건수 */
  transactions: number;
  /** 객단가 (원) */
  atv: number;
  /** 평균 체류시간 (분) */
  avgDwellMinutes: number;
  /** 방문 빈도 */
  visitFrequency: number;
}

export interface ReportZoneData {
  name: string;
  visitors: number;
  avgDwellMinutes: number;
  conversionRate: string;
}

export interface ReportHourlyData {
  hour: number;
  visitors: number;
}

export interface ReportFunnelData {
  entry: number;
  browse: number;
  engage: number;
  fitting: number;
  purchase: number;
}

export interface ReportAnomaly {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export interface ReportAIInsight {
  title: string;
  message: string;
  type: string;
}

export interface WeeklyComparison {
  metric: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
}

export interface StoreReportParams {
  storeName: string;
  storeType: string;
  period: { start: string; end: string };
  kpiData: ReportKPIData;
  funnelData?: ReportFunnelData;
  zoneData?: ReportZoneData[];
  hourlyData?: ReportHourlyData[];
  anomalies?: ReportAnomaly[];
  aiInsights?: ReportAIInsight[];
  weeklyComparison?: WeeklyComparison[];
}

// ============================================================================
// Brand Constants
// ============================================================================

const BRAND = {
  primary: '#1e1b4b',      // indigo-950
  primaryRGB: [30, 27, 75] as [number, number, number],
  accent: '#7c3aed',       // violet-600
  accentRGB: [124, 58, 237] as [number, number, number],
  dark: '#0f0d1a',
  light: '#f5f3ff',
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f4f4f5',
  gray200: '#e4e4e7',
  gray400: '#a1a1aa',
  gray500: '#71717a',
  gray600: '#52525b',
  gray700: '#3f3f46',
  gray800: '#27272a',
  success: '#10b981',
  successRGB: [16, 185, 129] as [number, number, number],
  warning: '#f59e0b',
  warningRGB: [245, 158, 11] as [number, number, number],
  critical: '#ef4444',
  criticalRGB: [239, 68, 68] as [number, number, number],
  info: '#06b6d4',
  infoRGB: [6, 182, 212] as [number, number, number],
} as const;

const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 20,
  marginRight: 20,
  marginTop: 25,
  marginBottom: 25,
  contentWidth: 170, // 210 - 20 - 20
} as const;

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return `${formatNumber(value)}원`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function nowFormatted(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Ensure Y position doesn't exceed page. Returns new Y, adds page if needed. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.height - PAGE.marginBottom) {
    doc.addPage();
    addPageFooter(doc);
    return PAGE.marginTop;
  }
  return y;
}

/** Get current page count (jsPDF internal) */
function getPageCount(doc: jsPDF): number {
  return doc.getNumberOfPages();
}

// ============================================================================
// Drawing Primitives
// ============================================================================

function addPageFooter(doc: jsPDF) {
  const pageNum = getPageCount(doc);
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 170);
  doc.text(
    `NeuralTwin  |  ${pageNum}`,
    PAGE.width / 2,
    PAGE.height - 12,
    { align: 'center' }
  );
  // Thin line above footer
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, PAGE.height - 18, PAGE.width - PAGE.marginRight, PAGE.height - 18);
}

function addSectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string): number {
  y = ensureSpace(doc, y, 20);

  // Purple accent bar
  doc.setFillColor(...BRAND.primaryRGB);
  doc.rect(PAGE.marginLeft, y, 4, 12, 'F');

  // Title text
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.primaryRGB);
  doc.text(title, PAGE.marginLeft + 8, y + 9);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 140);
    doc.text(subtitle, PAGE.marginLeft + 8, y + 16);
    return y + 22;
  }
  return y + 18;
}

function addDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, y, PAGE.width - PAGE.marginRight, y);
  return y + 4;
}

/** Draw a simple KPI box */
function drawKPIBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  unit: string,
): number {
  // Box background
  doc.setFillColor(248, 247, 255);
  doc.roundedRect(x, y, width, 32, 3, 3, 'F');
  // Border
  doc.setDrawColor(220, 215, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, 32, 3, 3, 'S');

  // Label
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 140);
  doc.text(label, x + width / 2, y + 10, { align: 'center' });

  // Value
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.primaryRGB);
  doc.text(value, x + width / 2, y + 22, { align: 'center' });

  // Unit
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 170);
  doc.text(unit, x + width / 2, y + 28, { align: 'center' });

  return y + 36;
}

/**
 * Draw a table without jspdf-autotable.
 * Returns the Y position after the table.
 */
function drawTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
): number {
  const ROW_HEIGHT = 8;
  const HEADER_HEIGHT = 10;
  const x0 = PAGE.marginLeft;

  y = ensureSpace(doc, y, HEADER_HEIGHT + ROW_HEIGHT * Math.min(rows.length, 3) + 4);

  // Header background
  doc.setFillColor(...BRAND.primaryRGB);
  doc.rect(x0, y, PAGE.contentWidth, HEADER_HEIGHT, 'F');

  // Header text
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  let hx = x0 + 3;
  headers.forEach((header, i) => {
    doc.text(header, hx, y + 7);
    hx += colWidths[i];
  });

  y += HEADER_HEIGHT;

  // Data rows
  rows.forEach((row, rowIdx) => {
    y = ensureSpace(doc, y, ROW_HEIGHT + 2);

    // Alternating row background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 249, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(x0, y, PAGE.contentWidth, ROW_HEIGHT, 'F');

    // Row border bottom
    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.2);
    doc.line(x0, y + ROW_HEIGHT, x0 + PAGE.contentWidth, y + ROW_HEIGHT);

    // Cell text
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 70);
    let rx = x0 + 3;
    row.forEach((cell, i) => {
      // Truncate long text
      const maxChars = Math.floor(colWidths[i] / 2.2);
      const truncated = cell.length > maxChars ? cell.slice(0, maxChars - 1) + '..' : cell;
      doc.text(truncated, rx, y + 5.5);
      rx += colWidths[i];
    });

    y += ROW_HEIGHT;
  });

  // Bottom border
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(x0, y, x0 + PAGE.contentWidth, y);

  return y + 4;
}

/** Draw a simple horizontal bar chart */
function drawHorizontalBar(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: number,
  maxValue: number,
  barColor: [number, number, number],
  barWidth: number,
): number {
  // Label
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 90);
  doc.text(label, x, y + 4);

  const barX = x + 35;
  const barMaxW = barWidth;
  const barH = 5;
  const ratio = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;

  // Background track
  doc.setFillColor(240, 238, 250);
  doc.roundedRect(barX, y, barMaxW, barH, 2, 2, 'F');

  // Filled bar
  if (ratio > 0) {
    doc.setFillColor(...barColor);
    doc.roundedRect(barX, y, barMaxW * ratio, barH, 2, 2, 'F');
  }

  // Value text
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 110);
  doc.text(formatNumber(value), barX + barMaxW + 4, y + 4);

  return y + 9;
}

/** Draw a funnel step */
function drawFunnelStep(
  doc: jsPDF,
  x: number,
  y: number,
  stepLabel: string,
  value: number,
  maxValue: number,
  stepColor: [number, number, number],
  funnelWidth: number,
): number {
  const ratio = maxValue > 0 ? value / maxValue : 0;
  const barW = funnelWidth * ratio;
  const centerX = x + funnelWidth / 2;

  // Bar (centered)
  doc.setFillColor(...stepColor);
  doc.roundedRect(centerX - barW / 2, y, barW, 10, 2, 2, 'F');

  // Label on left
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 90);
  doc.text(stepLabel, x - 2, y + 7, { align: 'right' });

  // Value on right
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 70);
  doc.text(`${formatNumber(value)}명 (${(ratio * 100).toFixed(1)}%)`, x + funnelWidth + 6, y + 7);

  return y + 14;
}

// ============================================================================
// Page Builders
// ============================================================================

function buildCoverPage(doc: jsPDF, params: StoreReportParams): void {
  // Full-page purple gradient background
  doc.setFillColor(...BRAND.primaryRGB);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  // Subtle gradient overlay (lighter purple band)
  doc.setFillColor(40, 36, 95);
  doc.rect(0, PAGE.height * 0.35, PAGE.width, PAGE.height * 0.3, 'F');

  // Brand logo text
  doc.setFontSize(11);
  doc.setTextColor(180, 170, 240);
  doc.text('NEURALTWIN', PAGE.marginLeft, 40);

  // Decorative line
  doc.setDrawColor(100, 90, 180);
  doc.setLineWidth(0.5);
  doc.line(PAGE.marginLeft, 46, PAGE.marginLeft + 30, 46);

  // Main title
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('\uB9E4\uC7A5 \uC9C4\uB2E8 \uB9AC\uD3EC\uD2B8', PAGE.marginLeft, 90);

  // Store name
  doc.setFontSize(20);
  doc.setTextColor(200, 195, 255);
  doc.text(params.storeName, PAGE.marginLeft, 110);

  // Store type badge
  doc.setFontSize(10);
  doc.setTextColor(160, 155, 210);
  doc.text(`\uC5C5\uC885: ${params.storeType}`, PAGE.marginLeft, 125);

  // Period box
  const periodY = 155;
  doc.setFillColor(40, 36, 95);
  doc.roundedRect(PAGE.marginLeft, periodY, PAGE.contentWidth, 28, 4, 4, 'F');
  doc.setDrawColor(80, 70, 150);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE.marginLeft, periodY, PAGE.contentWidth, 28, 4, 4, 'S');

  doc.setFontSize(9);
  doc.setTextColor(160, 155, 210);
  doc.text('\uBD84\uC11D \uAE30\uAC04', PAGE.marginLeft + 10, periodY + 11);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${formatDate(params.period.start)} ~ ${formatDate(params.period.end)}`,
    PAGE.marginLeft + 10,
    periodY + 22,
  );

  // Generation timestamp at bottom
  doc.setFontSize(9);
  doc.setTextColor(120, 115, 180);
  doc.text(`\uBCF4\uACE0\uC11C \uC0DD\uC131\uC77C: ${nowFormatted()}`, PAGE.marginLeft, PAGE.height - 50);

  // Footer branding
  doc.setFontSize(8);
  doc.setTextColor(100, 95, 160);
  doc.text(
    'Powered by NeuralTwin AI  \u00B7  \uC624\uD504\uB77C\uC778 \uB9AC\uD14C\uC77C \uC778\uD154\uB9AC\uC804\uC2A4 \uD50C\uB7AB\uD3FC',
    PAGE.width / 2,
    PAGE.height - 30,
    { align: 'center' },
  );

  // Decorative bottom line
  doc.setDrawColor(80, 70, 150);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, PAGE.height - 38, PAGE.width - PAGE.marginRight, PAGE.height - 38);
}

function buildExecutiveSummary(doc: jsPDF, params: StoreReportParams): void {
  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '1. \uACBD\uC601 \uC694\uC57D', 'Executive Summary');
  y += 4;

  const { kpiData } = params;
  const colW = (PAGE.contentWidth - 6) / 4; // 4 columns with gaps
  const gap = 2;

  // Row 1: Visitors, Unique, Revenue, Conversion
  drawKPIBox(doc, PAGE.marginLeft, y, colW, '\uCD1D \uBC29\uBB38\uAC1D', formatNumber(kpiData.visitors), '\uBA85');
  drawKPIBox(doc, PAGE.marginLeft + colW + gap, y, colW, '\uC21C \uBC29\uBB38\uAC1D', formatNumber(kpiData.uniqueVisitors), '\uBA85');
  drawKPIBox(doc, PAGE.marginLeft + (colW + gap) * 2, y, colW, '\uCD1D \uB9E4\uCD9C', formatCurrency(kpiData.revenue), '');
  drawKPIBox(doc, PAGE.marginLeft + (colW + gap) * 3, y, colW, '\uC804\uD658\uC728', `${kpiData.conversionRate.toFixed(1)}%`, '');
  y += 40;

  // Row 2: Transactions, ATV, Dwell Time, Visit Frequency
  drawKPIBox(doc, PAGE.marginLeft, y, colW, '\uAC70\uB798 \uAC74\uC218', formatNumber(kpiData.transactions), '\uAC74');
  drawKPIBox(doc, PAGE.marginLeft + colW + gap, y, colW, '\uAC1D\uB2E8\uAC00', formatCurrency(kpiData.atv), '');
  drawKPIBox(doc, PAGE.marginLeft + (colW + gap) * 2, y, colW, '\uD3C9\uADE0 \uCCB4\uB958', `${kpiData.avgDwellMinutes.toFixed(0)}`, '\uBD84');
  drawKPIBox(doc, PAGE.marginLeft + (colW + gap) * 3, y, colW, '\uBC29\uBB38 \uBE48\uB3C4', `${kpiData.visitFrequency.toFixed(1)}`, '\uD68C');
  y += 40;

  // Summary paragraph
  y = addDivider(doc, y);
  y += 2;

  doc.setFontSize(9);
  doc.setTextColor(70, 70, 80);
  const summaryText = [
    `\uBD84\uC11D \uAE30\uAC04 \uB3D9\uC548 ${params.storeName}\uC740(\uB294) \uCD1D ${formatNumber(kpiData.visitors)}\uBA85\uC758 \uBC29\uBB38\uAC1D\uC744 \uAE30\uB85D\uD558\uC600\uC73C\uBA70,`,
    `\uAD6C\uB9E4 \uC804\uD658\uC728 ${kpiData.conversionRate.toFixed(1)}%, \uAC1D\uB2E8\uAC00 ${formatCurrency(kpiData.atv)}\uB85C \uC9D1\uACC4\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
    `\uD3C9\uADE0 \uCCB4\uB958\uC2DC\uAC04\uC740 ${kpiData.avgDwellMinutes.toFixed(0)}\uBD84\uC73C\uB85C, \uACE0\uAC1D\uC758 \uB9E4\uC7A5 \uD0D0\uC0C9 \uD589\uB3D9\uC744 \uC9C0\uC18D\uC801\uC73C\uB85C \uBAA8\uB2C8\uD130\uB9C1\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.`,
  ];
  summaryText.forEach((line) => {
    doc.text(line, PAGE.marginLeft, y);
    y += 5;
  });
}

function buildTrafficAnalysis(doc: jsPDF, params: StoreReportParams): void {
  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '2. \uD2B8\uB798\uD53D \uBD84\uC11D', 'Traffic Analysis');
  y += 4;

  // 2-a. Hourly pattern
  if (params.hourlyData && params.hourlyData.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primaryRGB);
    doc.text('\uC2DC\uAC04\uB300\uBCC4 \uBC29\uBB38 \uD328\uD134', PAGE.marginLeft, y);
    y += 6;

    const maxVisitors = Math.max(...params.hourlyData.map((h) => h.visitors));
    const barChartWidth = PAGE.contentWidth - 50;
    const peakHour = params.hourlyData.reduce((prev, curr) =>
      curr.visitors > prev.visitors ? curr : prev
    );

    params.hourlyData.forEach((item) => {
      if (item.visitors === 0) return; // skip empty hours
      y = ensureSpace(doc, y, 10);

      const isPeak = item.hour === peakHour.hour;
      const barColor: [number, number, number] = isPeak
        ? BRAND.accentRGB
        : [180, 170, 230];

      y = drawHorizontalBar(
        doc,
        PAGE.marginLeft,
        y,
        `${String(item.hour).padStart(2, '0')}\uC2DC`,
        item.visitors,
        maxVisitors,
        barColor,
        barChartWidth,
      );
    });

    y += 4;

    // Peak hour callout
    doc.setFillColor(248, 247, 255);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 16, 3, 3, 'F');
    doc.setDrawColor(200, 195, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 16, 3, 3, 'S');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.accentRGB);
    doc.text(
      `\uD53C\uD06C\uD0C0\uC784: ${String(peakHour.hour).padStart(2, '0')}:00 ~ ${String(peakHour.hour + 1).padStart(2, '0')}:00  |  ${formatNumber(peakHour.visitors)}\uBA85`,
      PAGE.marginLeft + 8,
      y + 10,
    );
    y += 22;
  }

  // 2-b. Zone heatmap data (table)
  if (params.zoneData && params.zoneData.length > 0) {
    y = ensureSpace(doc, y, 30);

    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primaryRGB);
    doc.text('\uC874\uBCC4 \uD788\uD2B8\uB9F5 \uB370\uC774\uD130', PAGE.marginLeft, y);
    y += 6;

    const headers = ['\uC874 \uC774\uB984', '\uBC29\uBB38\uAC1D', '\uD3C9\uADE0 \uCCB4\uB958(\uBD84)', '\uC804\uD658\uC728'];
    const colWidths = [55, 35, 40, 40];
    const rows = params.zoneData.map((z) => [
      z.name,
      formatNumber(z.visitors),
      z.avgDwellMinutes.toFixed(1),
      z.conversionRate,
    ]);

    y = drawTable(doc, y, headers, rows, colWidths);
  }
}

function buildConversionFunnel(doc: jsPDF, params: StoreReportParams): void {
  if (!params.funnelData) return;

  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '3. \uC804\uD658 \uD37C\uB110', 'Conversion Funnel');
  y += 8;

  const { funnelData } = params;
  const maxVal = funnelData.entry;
  const funnelWidth = 120;
  const funnelX = PAGE.marginLeft + 30;

  // Funnel description
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text('\uACE0\uAC1D \uC5EC\uC815 5\uB2E8\uACC4 \uBD84\uC11D: \uC785\uC7A5 \u2192 \uD0D0\uC0C9 \u2192 \uAD00\uC2EC \u2192 \uD53C\uD305 \u2192 \uAD6C\uB9E4', PAGE.marginLeft, y);
  y += 10;

  const steps: { label: string; value: number; color: [number, number, number] }[] = [
    { label: '\uC785\uC7A5 (Entry)', value: funnelData.entry, color: [99, 102, 241] },    // indigo
    { label: '\uD0D0\uC0C9 (Browse)', value: funnelData.browse, color: [124, 58, 237] },   // violet
    { label: '\uAD00\uC2EC (Engage)', value: funnelData.engage, color: [168, 85, 247] },   // purple
    { label: '\uD53C\uD305 (Fitting)', value: funnelData.fitting, color: [192, 132, 252] }, // purple-lighter
    { label: '\uAD6C\uB9E4 (Purchase)', value: funnelData.purchase, color: [16, 185, 129] }, // emerald
  ];

  steps.forEach((step) => {
    y = ensureSpace(doc, y, 16);
    y = drawFunnelStep(doc, funnelX, y, step.label, step.value, maxVal, step.color, funnelWidth);
  });

  y += 8;

  // Conversion rate summary
  const overallConversion = maxVal > 0 ? ((funnelData.purchase / maxVal) * 100).toFixed(1) : '0.0';
  const browseToEngage = funnelData.browse > 0
    ? ((funnelData.engage / funnelData.browse) * 100).toFixed(1)
    : '0.0';
  const engageToPurchase = funnelData.engage > 0
    ? ((funnelData.purchase / funnelData.engage) * 100).toFixed(1)
    : '0.0';

  y = ensureSpace(doc, y, 40);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.primaryRGB);
  doc.text('\uD37C\uB110 \uC804\uD658\uC728 \uC694\uC57D', PAGE.marginLeft, y);
  y += 8;

  const convHeaders = ['\uAD6C\uAC04', '\uC804\uD658\uC728'];
  const convWidths = [100, 70];
  const convRows = [
    ['\uC804\uCCB4 (\uC785\uC7A5 \u2192 \uAD6C\uB9E4)', `${overallConversion}%`],
    ['\uD0D0\uC0C9 \u2192 \uAD00\uC2EC', `${browseToEngage}%`],
    ['\uAD00\uC2EC \u2192 \uAD6C\uB9E4', `${engageToPurchase}%`],
  ];

  y = drawTable(doc, y, convHeaders, convRows, convWidths);
}

function buildAIInsights(doc: jsPDF, params: StoreReportParams): void {
  if (!params.aiInsights || params.aiInsights.length === 0) return;

  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '4. AI \uC778\uC0AC\uC774\uD2B8', 'AI-Powered Recommendations');
  y += 4;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text('NeuralTwin AI\uAC00 \uB9E4\uC7A5 \uB370\uC774\uD130\uB97C \uBD84\uC11D\uD558\uC5EC \uB3C4\uCD9C\uD55C \uC8FC\uC694 \uC778\uC0AC\uC774\uD2B8\uC785\uB2C8\uB2E4.', PAGE.marginLeft, y);
  y += 10;

  // Top 3 insights only
  const topInsights = params.aiInsights.slice(0, 3);

  topInsights.forEach((insight, idx) => {
    y = ensureSpace(doc, y, 30);

    // Card background
    doc.setFillColor(248, 247, 255);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 28, 3, 3, 'F');
    doc.setDrawColor(210, 205, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 28, 3, 3, 'S');

    // Number badge
    doc.setFillColor(...BRAND.accentRGB);
    doc.circle(PAGE.marginLeft + 10, y + 14, 5, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, PAGE.marginLeft + 10, y + 16, { align: 'center' });

    // Title
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primaryRGB);
    doc.text(insight.title, PAGE.marginLeft + 20, y + 10);

    // Message (wrap at ~80 chars per line)
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 100);
    const msgLines = doc.splitTextToSize(insight.message, PAGE.contentWidth - 25);
    doc.text(msgLines.slice(0, 2), PAGE.marginLeft + 20, y + 18);

    y += 32;
  });
}

function buildAnomalyReport(doc: jsPDF, params: StoreReportParams): void {
  if (!params.anomalies || params.anomalies.length === 0) return;

  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '5. \uC774\uC0C1 \uD0D0\uC9C0 \uBCF4\uACE0', 'Anomaly Report');
  y += 4;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text('\uBD84\uC11D \uAE30\uAC04 \uC911 \uD0D0\uC9C0\uB41C \uC774\uC0C1 \uD56D\uBAA9\uC785\uB2C8\uB2E4. \uC2EC\uAC01\uB3C4 \uC21C\uC73C\uB85C \uC815\uB82C\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.', PAGE.marginLeft, y);
  y += 10;

  // Severity sort: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...params.anomalies].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  const severityConfig: Record<string, {
    label: string;
    color: [number, number, number];
    bgColor: [number, number, number];
    borderColor: [number, number, number];
  }> = {
    critical: {
      label: '\uC2EC\uAC01',
      color: BRAND.criticalRGB,
      bgColor: [254, 242, 242],
      borderColor: [252, 165, 165],
    },
    warning: {
      label: '\uACBD\uACE0',
      color: BRAND.warningRGB,
      bgColor: [255, 251, 235],
      borderColor: [252, 211, 77],
    },
    info: {
      label: '\uC815\uBCF4',
      color: BRAND.infoRGB,
      bgColor: [240, 253, 250],
      borderColor: [153, 246, 228],
    },
  };

  sorted.forEach((anomaly) => {
    y = ensureSpace(doc, y, 28);

    const config = severityConfig[anomaly.severity] || severityConfig.info;

    // Card background
    doc.setFillColor(...config.bgColor);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 24, 3, 3, 'F');

    // Left accent bar
    doc.setFillColor(...config.color);
    doc.rect(PAGE.marginLeft, y, 3, 24, 'F');

    // Severity badge
    doc.setFontSize(7);
    doc.setTextColor(...config.color);
    doc.text(`[${config.label}]`, PAGE.marginLeft + 8, y + 7);

    // Title
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 60);
    doc.text(anomaly.title, PAGE.marginLeft + 28, y + 7);

    // Message
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 110);
    const msgLines = doc.splitTextToSize(anomaly.message, PAGE.contentWidth - 14);
    doc.text(msgLines.slice(0, 2), PAGE.marginLeft + 8, y + 15);

    // Timestamp
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 170);
    doc.text(
      formatTimestamp(anomaly.timestamp),
      PAGE.width - PAGE.marginRight - 2,
      y + 7,
      { align: 'right' },
    );

    y += 28;
  });
}

function buildWeeklyComparison(doc: jsPDF, params: StoreReportParams): void {
  if (!params.weeklyComparison || params.weeklyComparison.length === 0) return;

  doc.addPage();
  addPageFooter(doc);

  let y = PAGE.marginTop;

  y = addSectionTitle(doc, y, '6. \uC8FC\uAC04 \uBE44\uAD50', 'Weekly Comparison');
  y += 4;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text('\uC774\uBC88 \uC8FC vs \uC9C0\uB09C \uC8FC \uC8FC\uC694 \uC9C0\uD45C \uBE44\uAD50\uC785\uB2C8\uB2E4.', PAGE.marginLeft, y);
  y += 8;

  const headers = ['\uC9C0\uD45C', '\uC774\uBC88 \uC8FC', '\uC9C0\uB09C \uC8FC', '\uBCC0\uD654\uC728'];
  const colWidths = [50, 40, 40, 40];

  const rows = params.weeklyComparison.map((item) => {
    const change = item.lastWeek > 0
      ? (((item.thisWeek - item.lastWeek) / item.lastWeek) * 100).toFixed(1)
      : 'N/A';
    const changeStr = change === 'N/A' ? change : `${Number(change) >= 0 ? '+' : ''}${change}%`;

    return [
      item.metric,
      `${formatNumber(item.thisWeek)} ${item.unit}`,
      `${formatNumber(item.lastWeek)} ${item.unit}`,
      changeStr,
    ];
  });

  y = drawTable(doc, y, headers, rows, colWidths);

  y += 8;

  // Summary insight box
  y = ensureSpace(doc, y, 24);
  doc.setFillColor(248, 247, 255);
  doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 20, 3, 3, 'F');
  doc.setDrawColor(200, 195, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 20, 3, 3, 'S');

  doc.setFontSize(8);
  doc.setTextColor(...BRAND.accentRGB);
  doc.text(
    '\uD301: \uC8FC\uAC04 \uBE44\uAD50\uB97C \uD1B5\uD574 \uD2B8\uB80C\uB4DC \uBCC0\uD654\uB97C \uC870\uAE30\uC5D0 \uD30C\uC545\uD558\uACE0, AI \uCD94\uCC9C \uC804\uB7B5\uC744 \uC801\uC6A9\uD574 \uBCF4\uC138\uC694.',
    PAGE.marginLeft + 8,
    y + 12,
  );
}

function buildClosingPage(doc: jsPDF, params: StoreReportParams): void {
  doc.addPage();

  // Full-page purple background
  doc.setFillColor(...BRAND.primaryRGB);
  doc.rect(0, 0, PAGE.width, PAGE.height, 'F');

  // Center content
  const centerY = PAGE.height / 2 - 30;

  doc.setFontSize(11);
  doc.setTextColor(180, 170, 240);
  doc.text('NEURALTWIN', PAGE.width / 2, centerY, { align: 'center' });

  doc.setDrawColor(100, 90, 180);
  doc.setLineWidth(0.5);
  doc.line(PAGE.width / 2 - 20, centerY + 6, PAGE.width / 2 + 20, centerY + 6);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('\uBCF4\uACE0\uC11C \uB05D', PAGE.width / 2, centerY + 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(160, 155, 210);
  doc.text(
    `${params.storeName} \uB9E4\uC7A5 \uC9C4\uB2E8 \uB9AC\uD3EC\uD2B8`,
    PAGE.width / 2,
    centerY + 36,
    { align: 'center' },
  );

  doc.setFontSize(9);
  doc.setTextColor(130, 125, 190);
  doc.text(`\uC0DD\uC131\uC77C: ${nowFormatted()}`, PAGE.width / 2, centerY + 48, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 95, 160);
  doc.text(
    '\uBB38\uC758: support@neuraltwin.io  |  www.neuraltwin.io',
    PAGE.width / 2,
    PAGE.height - 30,
    { align: 'center' },
  );
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * NeuralTwin 매장 진단 리포트 PDF를 생성합니다.
 *
 * @param params 리포트에 포함할 데이터
 * @returns PDF Blob (다운로드용)
 */
export function generateStoreReport(params: StoreReportParams): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // ── 1. Cover Page ──
  buildCoverPage(doc, params);

  // ── 2. Executive Summary ──
  buildExecutiveSummary(doc, params);

  // ── 3. Traffic Analysis ──
  buildTrafficAnalysis(doc, params);

  // ── 4. Conversion Funnel ──
  buildConversionFunnel(doc, params);

  // ── 5. AI Insights ──
  buildAIInsights(doc, params);

  // ── 6. Anomaly Report ──
  buildAnomalyReport(doc, params);

  // ── 7. Weekly Comparison ──
  buildWeeklyComparison(doc, params);

  // ── 8. Closing Page ──
  buildClosingPage(doc, params);

  // Add page numbers to all pages retroactively
  const totalPages = getPageCount(doc);
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 180);
    doc.text(
      `${i} / ${totalPages}`,
      PAGE.width - PAGE.marginRight,
      PAGE.height - 10,
      { align: 'right' },
    );
  }

  return doc.output('blob');
}

/**
 * PDF Blob을 브라우저 다운로드로 트리거합니다.
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
