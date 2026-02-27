/**
 * SimulationExporter
 * 
 * 시뮬레이션 결과를 CSV, PDF, JSON으로 내보내는 유틸리티
 */

import { toast } from 'sonner';

export type ExportFormat = 'csv' | 'pdf' | 'json';
export type SimulationType = 'demand' | 'inventory' | 'pricing' | 'layout' | 'marketing';

interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  includeOntologyInsights?: boolean;
}

/**
 * 시뮬레이션 결과를 내보내기
 */
export async function exportSimulationResult(
  type: SimulationType,
  result: any,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<boolean> {
  const {
    filename = `simulation_${type}_${new Date().toISOString().split('T')[0]}`,
    includeMetadata = true,
    includeOntologyInsights = true,
  } = options;

  try {
    switch (format) {
      case 'csv':
        return exportToCSV(type, result, filename, { includeMetadata, includeOntologyInsights });
      case 'pdf':
        return exportToPDF(type, result, filename, { includeMetadata, includeOntologyInsights });
      case 'json':
        return exportToJSON(type, result, filename, { includeMetadata, includeOntologyInsights });
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    toast.error(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    return false;
  }
}

/**
 * CSV 내보내기
 */
function exportToCSV(
  type: SimulationType,
  result: any,
  filename: string,
  options: { includeMetadata: boolean; includeOntologyInsights: boolean }
): boolean {
  let csvContent = '';
  const rows: string[][] = [];

  // 메타데이터 헤더
  if (options.includeMetadata) {
    rows.push(['# 시뮬레이션 결과 내보내기']);
    rows.push(['시뮬레이션 유형', getSimulationTypeLabel(type)]);
    rows.push(['생성 일시', result.timestamp || new Date().toISOString()]);
    rows.push(['신뢰도', `${result.confidenceScore || 0}%`]);
    rows.push(['']);
  }

  // 시뮬레이션 타입별 데이터 변환
  switch (type) {
    case 'demand':
      rows.push(...convertDemandToCSV(result));
      break;
    case 'inventory':
      rows.push(...convertInventoryToCSV(result));
      break;
    case 'pricing':
      rows.push(...convertPricingToCSV(result));
      break;
    case 'marketing':
      rows.push(...convertMarketingToCSV(result));
      break;
    case 'layout':
      rows.push(...convertLayoutToCSV(result));
      break;
  }

  // 온톨로지 인사이트
  if (options.includeOntologyInsights && result.ontologyBasedInsights) {
    rows.push(['']);
    rows.push(['# 온톨로지 기반 인사이트']);
    Object.entries(result.ontologyBasedInsights).forEach(([key, value]) => {
      rows.push([key, Array.isArray(value) ? value.join(', ') : String(value)]);
    });
  }

  // CSV 문자열 생성
  csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  // BOM 추가 (한글 지원)
  const BOM = '\uFEFF';
  downloadFile(BOM + csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
  
  toast.success('CSV 파일이 다운로드되었습니다');
  return true;
}

/**
 * 수요 예측 결과를 CSV 행으로 변환
 */
function convertDemandToCSV(result: any): string[][] {
  const rows: string[][] = [];

  // 요약
  if (result.demandForecast?.summary) {
    rows.push(['# 수요 예측 요약']);
    rows.push(['평균 일일 수요', result.demandForecast.summary.avgDailyDemand]);
    rows.push(['최대 수요 (피크)', result.demandForecast.summary.peakDemand]);
    rows.push(['예측 기간 총계', result.demandForecast.summary.totalForecast]);
    rows.push(['추세', result.demandForecast.summary.trend]);
    rows.push(['']);
  }

  // 일별 예측
  if (result.demandForecast?.forecastData) {
    rows.push(['# 일별 수요 예측']);
    rows.push(['날짜', '예측 수요', '신뢰도 (%)']);
    
    const { dates, predictedDemand, confidence } = result.demandForecast.forecastData;
    dates?.forEach((date: string, idx: number) => {
      rows.push([
        date,
        predictedDemand?.[idx] || 0,
        ((confidence?.[idx] || 0) * 100).toFixed(1)
      ]);
    });
    rows.push(['']);
  }

  // 수요 영향 요인
  if (result.demandDrivers?.length > 0) {
    rows.push(['# 수요 영향 요인']);
    rows.push(['요인', '영향', '크기 (%)', '설명']);
    result.demandDrivers.forEach((driver: any) => {
      rows.push([
        driver.factor,
        driver.impact === 'positive' ? '긍정' : '부정',
        driver.magnitude,
        driver.explanation
      ]);
    });
    rows.push(['']);
  }

  // Top 상품
  if (result.topProducts?.length > 0) {
    rows.push(['# Top 상품별 수요 예측']);
    rows.push(['SKU', '상품명', '예측 수요', '추세', '신뢰도 (%)']);
    result.topProducts.forEach((product: any) => {
      rows.push([
        product.sku,
        product.name,
        product.predictedDemand,
        product.trend === 'up' ? '증가' : product.trend === 'down' ? '감소' : '안정',
        ((product.confidence || 0) * 100).toFixed(1)
      ]);
    });
    rows.push(['']);
  }

  // 권장 액션
  if (result.recommendations?.length > 0) {
    rows.push(['# 권장 액션']);
    result.recommendations.forEach((rec: string, idx: number) => {
      rows.push([`${idx + 1}`, rec]);
    });
  }

  return rows;
}

/**
 * 재고 최적화 결과를 CSV 행으로 변환
 */
function convertInventoryToCSV(result: any): string[][] {
  const rows: string[][] = [];

  // 요약
  if (result.summary) {
    rows.push(['# 재고 최적화 요약']);
    rows.push(['총 항목 수', result.summary.totalItems]);
    rows.push(['재고 증가 필요', result.summary.itemsToIncrease]);
    rows.push(['재고 감소 필요', result.summary.itemsToDecrease]);
    rows.push(['최적 상태', result.summary.itemsOptimal]);
    rows.push(['예상 절감액', `${(result.summary.potentialSavings || 0).toLocaleString()}원`]);
    rows.push(['']);
  }

  // 상품별 권장사항
  if (result.recommendations?.length > 0) {
    rows.push(['# 상품별 재고 권장사항']);
    rows.push(['SKU', '상품명', '현재 재고', '최적 재고', '재주문점', '안전재고', '액션', '긴급도']);
    result.recommendations.forEach((rec: any) => {
      rows.push([
        rec.sku || '',
        rec.name || '',
        rec.currentStock || 0,
        rec.optimalStock || 0,
        rec.reorderPoint || 0,
        rec.safetyStock || 0,
        rec.action === 'increase' ? '증가' : rec.action === 'decrease' ? '감소' : '유지',
        rec.urgency === 'high' ? '높음' : rec.urgency === 'medium' ? '중간' : '낮음'
      ]);
    });
  }

  return rows;
}

/**
 * 가격 최적화 결과를 CSV 행으로 변환
 */
function convertPricingToCSV(result: any): string[][] {
  const rows: string[][] = [];

  // 요약
  if (result.summary) {
    rows.push(['# 가격 최적화 요약']);
    rows.push(['총 상품 수', result.summary.totalProducts]);
    rows.push(['가격 인상 상품', result.summary.priceIncreases]);
    rows.push(['가격 인하 상품', result.summary.priceDecreases]);
    rows.push(['가격 유지 상품', result.summary.noChange]);
    rows.push(['예상 매출 증가', `${(result.summary.projectedRevenueIncrease || 0).toLocaleString()}원`]);
    rows.push(['']);
  }

  // 상품별 권장사항
  if (result.recommendations?.length > 0) {
    rows.push(['# 상품별 가격 권장사항']);
    rows.push(['SKU', '상품명', '현재 가격', '권장 가격', '변동률 (%)', '전략', '예상 효과']);
    result.recommendations.forEach((rec: any) => {
      rows.push([
        rec.sku || '',
        rec.name || '',
        `${(rec.currentPrice || 0).toLocaleString()}원`,
        `${(rec.recommendedPrice || 0).toLocaleString()}원`,
        rec.priceChange || 0,
        rec.strategy || '',
        rec.expectedImpact || ''
      ]);
    });
  }

  return rows;
}

/**
 * 마케팅 전략 결과를 CSV 행으로 변환
 */
function convertMarketingToCSV(result: any): string[][] {
  const rows: string[][] = [];

  // 요약
  if (result.summary) {
    rows.push(['# 마케팅 전략 요약']);
    rows.push(['전략 수', result.summary.totalStrategies]);
    rows.push(['예상 매출 증가', `${(result.summary.projectedRevenueIncrease || 0).toLocaleString()}원`]);
    rows.push(['최우선 전략', result.summary.topStrategy]);
    rows.push(['']);
  }

  // 전략 목록
  if (result.strategies?.length > 0) {
    rows.push(['# 추천 마케팅 전략']);
    rows.push(['전략명', '유형', '타겟 세그먼트', '대상 상품', '예상 전환율', '예상 매출', '온톨로지 근거']);
    result.strategies.forEach((strategy: any) => {
      rows.push([
        strategy.name || '',
        strategy.type || '',
        strategy.targetSegment || '',
        (strategy.products || []).join(', '),
        `${((strategy.expectedConversion || 0) * 100).toFixed(1)}%`,
        `${(strategy.expectedRevenue || 0).toLocaleString()}원`,
        strategy.ontologyBasis || ''
      ]);
    });
    rows.push(['']);

    // 전략별 액션
    rows.push(['# 전략별 실행 액션']);
    result.strategies.forEach((strategy: any, idx: number) => {
      rows.push([`전략 ${idx + 1}: ${strategy.name}`]);
      (strategy.actions || []).forEach((action: string, actionIdx: number) => {
        rows.push(['', `${actionIdx + 1}. ${action}`]);
      });
    });
  }

  return rows;
}

/**
 * 레이아웃 최적화 결과를 CSV 행으로 변환
 */
function convertLayoutToCSV(result: any): string[][] {
  const rows: string[][] = [];

  // KPI 예측
  if (result.predictedKpi) {
    rows.push(['# 레이아웃 최적화 예측 KPI']);
    rows.push(['전환율', `${((result.predictedKpi.conversionRate || 0) * 100).toFixed(1)}%`]);
    rows.push(['평균 거래액', `${(result.predictedKpi.averageTransactionValue || 0).toLocaleString()}원`]);
    rows.push(['㎡당 매출', `${(result.predictedKpi.salesPerSqm || 0).toLocaleString()}원`]);
    rows.push(['재고 회전율', result.predictedKpi.inventoryTurnover || 0]);
    rows.push(['고객 만족도', result.predictedKpi.customerSatisfaction || 0]);
    rows.push(['']);
  }

  // 권장사항
  if (result.recommendations?.length > 0) {
    rows.push(['# 레이아웃 권장사항']);
    result.recommendations.forEach((rec: string, idx: number) => {
      rows.push([`${idx + 1}`, rec]);
    });
    rows.push(['']);
  }

  // 경고
  if (result.warnings?.length > 0) {
    rows.push(['# 주의사항']);
    result.warnings.forEach((warning: string, idx: number) => {
      rows.push([`${idx + 1}`, warning]);
    });
  }

  return rows;
}

/**
 * JSON 내보내기
 */
function exportToJSON(
  type: SimulationType,
  result: any,
  filename: string,
  options: { includeMetadata: boolean; includeOntologyInsights: boolean }
): boolean {
  const exportData: any = {
    exportInfo: {
      type: getSimulationTypeLabel(type),
      exportedAt: new Date().toISOString(),
      format: 'JSON',
    },
  };

  if (options.includeMetadata) {
    exportData.metadata = {
      timestamp: result.timestamp,
      confidenceScore: result.confidenceScore,
      type: result.type,
      ontologyEnhanced: result.ontologyEnhanced || false,
    };
  }

  exportData.result = result;

  if (!options.includeOntologyInsights) {
    delete exportData.result.ontologyBasedInsights;
    delete exportData.result.ontologyInsights;
  }

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
  
  toast.success('JSON 파일이 다운로드되었습니다');
  return true;
}

/**
 * PDF 내보내기 (HTML 기반)
 */
function exportToPDF(
  type: SimulationType,
  result: any,
  filename: string,
  options: { includeMetadata: boolean; includeOntologyInsights: boolean }
): boolean {
  // HTML 기반 PDF 생성
  const htmlContent = generatePDFHTML(type, result, options);
  
  // 새 창에서 인쇄 (브라우저 기본 PDF 저장)
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    return false;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // 인쇄 다이얼로그 표시
  setTimeout(() => {
    printWindow.print();
  }, 500);

  toast.success('PDF 인쇄 대화상자가 열렸습니다');
  return true;
}

/**
 * PDF용 HTML 생성
 */
function generatePDFHTML(
  type: SimulationType,
  result: any,
  options: { includeMetadata: boolean; includeOntologyInsights: boolean }
): string {
  const title = `${getSimulationTypeLabel(type)} 결과`;
  
  let content = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; margin-top: 20px; }
    .metadata { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .metadata p { margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .ontology-insight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
    .recommendation { background: #f0fdf4; padding: 10px; border-radius: 6px; margin: 8px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>📊 ${title}</h1>
`;

  // 메타데이터
  if (options.includeMetadata) {
    content += `
  <div class="metadata">
    <p><strong>생성 일시:</strong> ${result.timestamp ? new Date(result.timestamp).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')}</p>
    <p><strong>신뢰도:</strong> ${result.confidenceScore || 0}%</p>
    <p><strong>온톨로지 강화:</strong> ${result.ontologyEnhanced ? '✅ 예' : '❌ 아니오'}</p>
  </div>
`;
  }

  // AI 인사이트
  if (result.aiInsights) {
    content += `
  <div class="card">
    <h3>🤖 AI 분석 인사이트</h3>
    <p>${result.aiInsights}</p>
  </div>
`;
  }

  // 타입별 콘텐츠
  content += generateTypeSpecificHTML(type, result);

  // 온톨로지 인사이트
  if (options.includeOntologyInsights && result.ontologyBasedInsights) {
    content += `
  <div class="ontology-insight">
    <h3>🔗 온톨로지 기반 인사이트</h3>
    <ul>
`;
    Object.entries(result.ontologyBasedInsights).forEach(([key, value]) => {
      content += `      <li><strong>${key}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</li>\n`;
    });
    content += `
    </ul>
  </div>
`;
  }

  // 권장사항
  if (result.recommendations?.length > 0) {
    content += `
  <h2>💡 권장 액션</h2>
`;
    result.recommendations.forEach((rec: string) => {
      content += `  <div class="recommendation">• ${rec}</div>\n`;
    });
  }

  content += `
  <hr style="margin-top: 40px;">
  <p style="text-align: center; color: #9ca3af; font-size: 12px;">
    Generated by NEURALTWIN Simulation Hub • ${new Date().toLocaleDateString('ko-KR')}
  </p>
</body>
</html>
`;

  return content;
}

/**
 * 타입별 HTML 콘텐츠 생성
 */
function generateTypeSpecificHTML(type: SimulationType, result: any): string {
  let html = '';

  switch (type) {
    case 'demand':
      if (result.demandForecast?.summary) {
        html += `
  <h2>📈 수요 예측 요약</h2>
  <table>
    <tr><th>지표</th><th>값</th></tr>
    <tr><td>평균 일일 수요</td><td>${result.demandForecast.summary.avgDailyDemand?.toFixed(0) || 0}건</td></tr>
    <tr><td>최대 수요 (피크)</td><td>${result.demandForecast.summary.peakDemand?.toFixed(0) || 0}건</td></tr>
    <tr><td>예측 기간 총계</td><td>${result.demandForecast.summary.totalForecast?.toFixed(0) || 0}건</td></tr>
    <tr><td>추세</td><td>${result.demandForecast.summary.trend === 'increasing' ? '📈 증가' : result.demandForecast.summary.trend === 'decreasing' ? '📉 감소' : '➡️ 안정'}</td></tr>
  </table>
`;
      }
      break;

    case 'inventory':
      if (result.summary) {
        html += `
  <h2>📦 재고 최적화 요약</h2>
  <table>
    <tr><th>지표</th><th>값</th></tr>
    <tr><td>총 항목 수</td><td>${result.summary.totalItems || 0}개</td></tr>
    <tr><td>재고 증가 필요</td><td>${result.summary.itemsToIncrease || 0}개</td></tr>
    <tr><td>재고 감소 필요</td><td>${result.summary.itemsToDecrease || 0}개</td></tr>
    <tr><td>예상 절감액</td><td>${(result.summary.potentialSavings || 0).toLocaleString()}원</td></tr>
  </table>
`;
      }
      break;

    case 'pricing':
      if (result.summary) {
        html += `
  <h2>💰 가격 최적화 요약</h2>
  <table>
    <tr><th>지표</th><th>값</th></tr>
    <tr><td>가격 인상 상품</td><td>${result.summary.priceIncreases || 0}개</td></tr>
    <tr><td>가격 인하 상품</td><td>${result.summary.priceDecreases || 0}개</td></tr>
    <tr><td>예상 매출 증가</td><td>${(result.summary.projectedRevenueIncrease || 0).toLocaleString()}원</td></tr>
  </table>
`;
      }
      break;

    case 'marketing':
      if (result.summary) {
        html += `
  <h2>🎯 마케팅 전략 요약</h2>
  <table>
    <tr><th>지표</th><th>값</th></tr>
    <tr><td>추천 전략 수</td><td>${result.summary.totalStrategies || 0}개</td></tr>
    <tr><td>최우선 전략</td><td>${result.summary.topStrategy || '-'}</td></tr>
    <tr><td>예상 매출 증가</td><td>${(result.summary.projectedRevenueIncrease || 0).toLocaleString()}원</td></tr>
  </table>
`;
      }
      break;

    case 'layout':
      if (result.predictedKpi) {
        html += `
  <h2>🏗️ 레이아웃 최적화 예측 KPI</h2>
  <table>
    <tr><th>지표</th><th>값</th></tr>
    <tr><td>예상 전환율</td><td>${((result.predictedKpi.conversionRate || 0) * 100).toFixed(1)}%</td></tr>
    <tr><td>평균 거래액</td><td>${(result.predictedKpi.averageTransactionValue || 0).toLocaleString()}원</td></tr>
    <tr><td>㎡당 매출</td><td>${(result.predictedKpi.salesPerSqm || 0).toLocaleString()}원</td></tr>
  </table>
`;
      }
      break;
  }

  return html;
}

/**
 * 파일 다운로드 헬퍼
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 시뮬레이션 타입 라벨
 */
function getSimulationTypeLabel(type: SimulationType): string {
  const labels: Record<SimulationType, string> = {
    demand: '수요 예측',
    inventory: '재고 최적화',
    pricing: '가격 최적화',
    layout: '레이아웃 최적화',
    marketing: '마케팅 전략',
  };
  return labels[type] || type;
}

export default exportSimulationResult;
