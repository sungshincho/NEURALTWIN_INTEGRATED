/**
 * simulationIssueAnalyzer.ts
 *
 * 시뮬레이션 결과에서 문제점을 자동으로 분석하는 유틸리티
 * 기획서 기준: 혼잡, 병목, 데드존, 인력부족, 계산대 대기
 */

import type {
  SimulationIssue,
  SimulationIssueType,
  SimulationIssueSeverity,
  PresetScenario,
} from '../types/scenarioPresets.types';
import { ISSUE_THRESHOLDS } from '../types/scenarioPresets.types';

// ============================================================================
// 타입 정의
// ============================================================================

export interface ZoneData {
  id: string;
  name: string;
  type: string;
  capacity?: number;        // 수용인원
  currentVisitors?: number; // 현재 방문객
  visitRate?: number;       // 방문율 (0-1)
  avgDwellTime?: number;    // 평균 체류시간 (분)
  waitTime?: number;        // 대기시간 (분)
}

export interface SimulationAnalysisInput {
  zones: ZoneData[];
  totalVisitors: number;
  totalStaff: number;
  duration: number;           // 시뮬레이션 시간 (분)
  scenario?: PresetScenario;
  // 시간대별 데이터 (선택)
  hourlyData?: {
    hour: number;
    visitors: number;
    congestionLevel: number;
  }[];
  // 동선 데이터 (선택)
  flowData?: {
    fromZone: string;
    toZone: string;
    count: number;
    avgTime: number;
  }[];
}

export interface SimulationAnalysisResult {
  issues: SimulationIssue[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    totalRevenueImpact: number;
    totalCustomerImpact: number;
  };
  recommendations: string[];
}

// ============================================================================
// 메인 분석 함수
// ============================================================================

let issueIdCounter = 0;

function generateIssueId(): string {
  issueIdCounter += 1;
  return `issue-${Date.now()}-${issueIdCounter}`;
}

/**
 * 시뮬레이션 결과에서 문제점 자동 분석
 */
export function analyzeSimulationIssues(
  input: SimulationAnalysisInput
): SimulationAnalysisResult {
  const issues: SimulationIssue[] = [];

  // 1. 혼잡도 분석
  const congestionIssues = analyzeCongestion(input);
  issues.push(...congestionIssues);

  // 2. 동선 병목 분석
  const bottleneckIssues = analyzeBottlenecks(input);
  issues.push(...bottleneckIssues);

  // 3. 데드존 분석
  const deadzoneIssues = analyzeDeadzones(input);
  issues.push(...deadzoneIssues);

  // 4. 인력 부족 분석
  const staffingIssues = analyzeStaffing(input);
  issues.push(...staffingIssues);

  // 5. 계산대 대기 분석
  const checkoutIssues = analyzeCheckoutWait(input);
  issues.push(...checkoutIssues);

  // 심각도 순으로 정렬
  issues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // 요약 계산
  const summary = {
    criticalCount: issues.filter(i => i.severity === 'critical').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
    infoCount: issues.filter(i => i.severity === 'info').length,
    totalRevenueImpact: issues.reduce((sum, i) => sum + i.impact.revenueImpact, 0),
    totalCustomerImpact: issues.reduce((sum, i) => sum + i.impact.customerImpact, 0),
  };

  // 종합 권장사항
  const recommendations = generateOverallRecommendations(issues, input);

  return { issues, summary, recommendations };
}

// ============================================================================
// 개별 분석 함수들
// ============================================================================

/**
 * 혼잡도 분석
 */
function analyzeCongestion(input: SimulationAnalysisInput): SimulationIssue[] {
  const issues: SimulationIssue[] = [];
  const { zones, totalVisitors, scenario } = input;

  for (const zone of zones) {
    if (!zone.capacity || zone.capacity <= 0) continue;

    const occupancyRate = (zone.currentVisitors || 0) / zone.capacity;

    if (occupancyRate >= ISSUE_THRESHOLDS.congestion.critical) {
      // 위험 수준
      issues.push({
        id: generateIssueId(),
        type: 'congestion',
        severity: 'critical',
        title: `${zone.name} 구역 심각한 혼잡`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: Math.round(occupancyRate * 100),
          threshold: ISSUE_THRESHOLDS.congestion.critical * 100,
          unit: '%',
          description: `수용인원 ${zone.capacity}명 대비 ${zone.currentVisitors || 0}명 (${Math.round(occupancyRate * 100)}%)`,
        },
        impact: {
          revenueImpact: calculateRevenueImpact(occupancyRate, totalVisitors, 'congestion'),
          customerImpact: Math.round((zone.currentVisitors || 0) * 0.2), // 20% 이탈 예상
        },
        recommendations: [
          '동선 분산 가구 배치 권장',
          '임시 출입구 확장 고려',
          '추가 직원 배치',
        ],
      });
    } else if (occupancyRate >= ISSUE_THRESHOLDS.congestion.warning) {
      // 주의 수준
      issues.push({
        id: generateIssueId(),
        type: 'congestion',
        severity: 'warning',
        title: `${zone.name} 구역 혼잡 주의`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: Math.round(occupancyRate * 100),
          threshold: ISSUE_THRESHOLDS.congestion.warning * 100,
          unit: '%',
          description: `수용인원 ${zone.capacity}명 대비 ${zone.currentVisitors || 0}명`,
        },
        impact: {
          revenueImpact: calculateRevenueImpact(occupancyRate, totalVisitors, 'congestion') * 0.5,
          customerImpact: Math.round((zone.currentVisitors || 0) * 0.1),
        },
        recommendations: [
          '피크 시간대 모니터링 강화',
          '유도 사이니지 활용',
        ],
      });
    }
  }

  return issues;
}

/**
 * 동선 병목 분석
 */
function analyzeBottlenecks(input: SimulationAnalysisInput): SimulationIssue[] {
  const issues: SimulationIssue[] = [];
  const { flowData, zones } = input;

  if (!flowData || flowData.length === 0) return issues;

  // 동선별 평균 이동시간 분석
  for (const flow of flowData) {
    const avgTime = flow.avgTime; // 분 단위

    if (avgTime >= ISSUE_THRESHOLDS.bottleneck.critical) {
      const fromZone = zones.find(z => z.id === flow.fromZone);
      const toZone = zones.find(z => z.id === flow.toZone);

      issues.push({
        id: generateIssueId(),
        type: 'bottleneck',
        severity: 'critical',
        title: `${fromZone?.name || flow.fromZone} → ${toZone?.name || flow.toZone} 구간 병목`,
        location: {
          zoneId: flow.fromZone,
          zoneName: fromZone?.name || flow.fromZone,
        },
        details: {
          currentValue: avgTime,
          threshold: ISSUE_THRESHOLDS.bottleneck.critical,
          unit: '분',
          description: `평균 이동시간 ${avgTime.toFixed(1)}분 (${flow.count}명 이용)`,
        },
        impact: {
          revenueImpact: flow.count * 5000, // 건당 5,000원 손실 추정
          customerImpact: flow.count,
        },
        recommendations: [
          '해당 구간 장애물 제거',
          '대체 동선 유도 사이니지 설치',
          '가구 배치 변경으로 동선 확보',
        ],
      });
    } else if (avgTime >= ISSUE_THRESHOLDS.bottleneck.warning) {
      const fromZone = zones.find(z => z.id === flow.fromZone);
      const toZone = zones.find(z => z.id === flow.toZone);

      issues.push({
        id: generateIssueId(),
        type: 'bottleneck',
        severity: 'warning',
        title: `${fromZone?.name || flow.fromZone} → ${toZone?.name || flow.toZone} 구간 지연`,
        location: {
          zoneId: flow.fromZone,
          zoneName: fromZone?.name || flow.fromZone,
        },
        details: {
          currentValue: avgTime,
          threshold: ISSUE_THRESHOLDS.bottleneck.warning,
          unit: '분',
          description: `평균 이동시간 ${avgTime.toFixed(1)}분`,
        },
        impact: {
          revenueImpact: flow.count * 2000,
          customerImpact: Math.round(flow.count * 0.5),
        },
        recommendations: [
          '피크 시간대 동선 모니터링',
        ],
      });
    }
  }

  return issues;
}

/**
 * 데드존 분석
 */
function analyzeDeadzones(input: SimulationAnalysisInput): SimulationIssue[] {
  const issues: SimulationIssue[] = [];
  const { zones, totalVisitors } = input;

  for (const zone of zones) {
    const visitRate = zone.visitRate ?? 0;

    // 입구, 계산대 등은 제외
    if (['entrance', 'checkout', 'exit', 'storage'].includes(zone.type.toLowerCase())) {
      continue;
    }

    if (visitRate <= ISSUE_THRESHOLDS.deadzone.critical) {
      issues.push({
        id: generateIssueId(),
        type: 'deadzone',
        severity: 'critical',
        title: `${zone.name} 방문율 매우 저조`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: Math.round(visitRate * 100),
          threshold: ISSUE_THRESHOLDS.deadzone.critical * 100,
          unit: '%',
          description: `전체 방문객의 ${(visitRate * 100).toFixed(1)}%만 방문`,
        },
        impact: {
          revenueImpact: calculateDeadzoneRevenueLoss(zone, totalVisitors),
          customerImpact: Math.round(totalVisitors * (0.25 - visitRate)), // 기대 방문율 25% 가정
        },
        recommendations: [
          '유도 사이니지 추가',
          '진열대 위치 변경',
          '조명 개선',
          '인기 상품 배치',
        ],
      });
    } else if (visitRate <= ISSUE_THRESHOLDS.deadzone.warning) {
      issues.push({
        id: generateIssueId(),
        type: 'deadzone',
        severity: 'warning',
        title: `${zone.name} 방문율 저조`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: Math.round(visitRate * 100),
          threshold: ISSUE_THRESHOLDS.deadzone.warning * 100,
          unit: '%',
          description: `전체 방문객의 ${(visitRate * 100).toFixed(1)}%만 방문`,
        },
        impact: {
          revenueImpact: calculateDeadzoneRevenueLoss(zone, totalVisitors) * 0.5,
          customerImpact: Math.round(totalVisitors * (0.25 - visitRate) * 0.5),
        },
        recommendations: [
          '동선 유도 개선 검토',
          '상품 구성 검토',
        ],
      });
    }
  }

  return issues;
}

/**
 * 인력 부족 분석
 */
function analyzeStaffing(input: SimulationAnalysisInput): SimulationIssue[] {
  const issues: SimulationIssue[] = [];
  const { totalVisitors, totalStaff, zones, scenario } = input;

  if (totalStaff <= 0) return issues;

  const customerStaffRatio = totalVisitors / totalStaff;

  if (customerStaffRatio >= ISSUE_THRESHOLDS.understaffed.critical) {
    issues.push({
      id: generateIssueId(),
      type: 'understaffed',
      severity: 'critical',
      title: '심각한 인력 부족',
      location: { zoneId: 'store', zoneName: '전체 매장' },
      details: {
        currentValue: Math.round(customerStaffRatio),
        threshold: ISSUE_THRESHOLDS.understaffed.critical,
        unit: ':1 (고객:직원)',
        description: `고객 ${totalVisitors}명 대비 직원 ${totalStaff}명 (${Math.round(customerStaffRatio)}:1)`,
      },
      impact: {
        revenueImpact: totalVisitors * 3000, // 고객당 3,000원 손실
        customerImpact: Math.round(totalVisitors * 0.15),
        conversionImpact: -5, // 전환율 5% 감소
      },
      recommendations: [
        `추가 직원 ${Math.ceil(totalVisitors / 15) - totalStaff}명 배치 필요`,
        '피크 시간대 임시 직원 투입',
        '셀프 서비스 안내 강화',
      ],
    });
  } else if (customerStaffRatio >= ISSUE_THRESHOLDS.understaffed.warning) {
    issues.push({
      id: generateIssueId(),
      type: 'understaffed',
      severity: 'warning',
      title: '인력 부족 주의',
      location: { zoneId: 'store', zoneName: '전체 매장' },
      details: {
        currentValue: Math.round(customerStaffRatio),
        threshold: ISSUE_THRESHOLDS.understaffed.warning,
        unit: ':1',
        description: `고객 ${totalVisitors}명 대비 직원 ${totalStaff}명`,
      },
      impact: {
        revenueImpact: totalVisitors * 1000,
        customerImpact: Math.round(totalVisitors * 0.08),
        conversionImpact: -3,
      },
      recommendations: [
        '피크 시간대 직원 배치 조정',
        '응대 효율화 검토',
      ],
    });
  }

  return issues;
}

/**
 * 계산대 대기 분석
 */
function analyzeCheckoutWait(input: SimulationAnalysisInput): SimulationIssue[] {
  const issues: SimulationIssue[] = [];
  const { zones, totalVisitors } = input;

  // 계산대 존 찾기
  const checkoutZones = zones.filter(z =>
    z.type.toLowerCase().includes('checkout') ||
    z.type.toLowerCase().includes('register') ||
    z.name.includes('계산')
  );

  for (const zone of checkoutZones) {
    const waitTime = zone.waitTime ?? 0;

    if (waitTime >= ISSUE_THRESHOLDS.checkout_wait.critical) {
      issues.push({
        id: generateIssueId(),
        type: 'checkout_wait',
        severity: 'critical',
        title: `${zone.name} 대기시간 과다`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: waitTime,
          threshold: ISSUE_THRESHOLDS.checkout_wait.critical,
          unit: '분',
          description: `예상 대기시간 ${waitTime}분`,
        },
        impact: {
          revenueImpact: Math.round(totalVisitors * 0.1 * 50000), // 10% 이탈, 평균 객단가 5만원
          customerImpact: Math.round(totalVisitors * 0.1),
        },
        recommendations: [
          '임시 계산대 추가 개설',
          '셀프 계산대 활성화',
          '모바일 결제 안내',
        ],
      });
    } else if (waitTime >= ISSUE_THRESHOLDS.checkout_wait.warning) {
      issues.push({
        id: generateIssueId(),
        type: 'checkout_wait',
        severity: 'warning',
        title: `${zone.name} 대기시간 주의`,
        location: { zoneId: zone.id, zoneName: zone.name },
        details: {
          currentValue: waitTime,
          threshold: ISSUE_THRESHOLDS.checkout_wait.warning,
          unit: '분',
          description: `예상 대기시간 ${waitTime}분`,
        },
        impact: {
          revenueImpact: Math.round(totalVisitors * 0.05 * 50000),
          customerImpact: Math.round(totalVisitors * 0.05),
        },
        recommendations: [
          '추가 계산대 준비',
          '대기열 관리 강화',
        ],
      });
    }
  }

  return issues;
}

// ============================================================================
// 헬퍼 함수들
// ============================================================================

/**
 * 혼잡도에 따른 매출 손실 계산
 */
function calculateRevenueImpact(
  occupancyRate: number,
  totalVisitors: number,
  type: 'congestion' | 'other'
): number {
  const avgTransactionValue = 50000; // 평균 객단가 5만원
  const conversionRate = 0.3; // 기본 전환율 30%

  // 혼잡도가 높을수록 전환율 감소
  const conversionDrop = Math.max(0, (occupancyRate - 0.8) * 0.5);
  const lostConversions = totalVisitors * conversionDrop * conversionRate;

  return Math.round(lostConversions * avgTransactionValue);
}

/**
 * 데드존 매출 손실 계산
 */
function calculateDeadzoneRevenueLoss(zone: ZoneData, totalVisitors: number): number {
  const expectedVisitRate = 0.25; // 기대 방문율 25%
  const actualVisitRate = zone.visitRate ?? 0;
  const missedVisitors = totalVisitors * (expectedVisitRate - actualVisitRate);
  const avgPurchaseInZone = 30000; // 존 평균 구매액 3만원
  const conversionRate = 0.2;

  return Math.round(missedVisitors * conversionRate * avgPurchaseInZone);
}

/**
 * 종합 권장사항 생성
 */
function generateOverallRecommendations(
  issues: SimulationIssue[],
  input: SimulationAnalysisInput
): string[] {
  const recommendations: string[] = [];

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const congestionCount = issues.filter(i => i.type === 'congestion').length;
  const staffingIssue = issues.find(i => i.type === 'understaffed');
  const deadzoneCount = issues.filter(i => i.type === 'deadzone').length;

  if (criticalCount >= 3) {
    recommendations.push('🚨 심각한 문제가 다수 감지되었습니다. AI 최적화를 통한 종합 개선을 권장합니다.');
  }

  if (congestionCount >= 2) {
    recommendations.push('📍 다수 구역에서 혼잡이 예상됩니다. 동선 분산 레이아웃 재검토가 필요합니다.');
  }

  if (staffingIssue) {
    const neededStaff = Math.ceil(input.totalVisitors / 15) - input.totalStaff;
    if (neededStaff > 0) {
      recommendations.push(`👥 최소 ${neededStaff}명의 추가 직원 배치를 권장합니다.`);
    }
  }

  if (deadzoneCount >= 2) {
    recommendations.push('💡 방문율 저조 구역이 다수입니다. 유도 사이니지 및 상품 배치 개선을 검토하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 현재 시나리오에서 심각한 문제는 감지되지 않았습니다.');
  }

  return recommendations;
}

// ============================================================================
// AI 응답에서 문제점 추출
// ============================================================================

/**
 * AI 시뮬레이션 결과에서 문제점 추출
 */
export function extractIssuesFromAIResult(
  aiResult: any,
  zones: ZoneData[]
): SimulationIssue[] {
  const issues: SimulationIssue[] = [];

  // congestionZones에서 추출
  if (aiResult.congestionZones) {
    for (const cz of aiResult.congestionZones) {
      const zone = zones.find(z => z.id === cz.zoneId || z.name === cz.zoneName);
      const severity: SimulationIssueSeverity =
        cz.congestionLevel > 0.9 ? 'critical' :
        cz.congestionLevel > 0.7 ? 'warning' : 'info';

      issues.push({
        id: generateIssueId(),
        type: 'congestion',
        severity,
        title: `${cz.zoneName || zone?.name || '알 수 없는 구역'} 혼잡`,
        location: {
          zoneId: cz.zoneId || zone?.id || '',
          zoneName: cz.zoneName || zone?.name || '',
        },
        details: {
          currentValue: Math.round(cz.congestionLevel * 100),
          threshold: 80,
          unit: '%',
          description: cz.description || `혼잡도 ${Math.round(cz.congestionLevel * 100)}%`,
        },
        impact: {
          revenueImpact: cz.estimatedRevenueLoss || 0,
          customerImpact: cz.affectedCustomers || 0,
        },
        recommendations: cz.recommendations || [],
      });
    }
  }

  // bottlenecks에서 추출
  if (aiResult.bottlenecks) {
    for (const bn of aiResult.bottlenecks) {
      issues.push({
        id: generateIssueId(),
        type: 'bottleneck',
        severity: bn.severity || 'warning',
        title: bn.title || `${bn.zoneName} 동선 병목`,
        location: {
          zoneId: bn.zoneId || '',
          zoneName: bn.zoneName || '',
        },
        details: {
          currentValue: bn.waitTime || 0,
          threshold: 3,
          unit: '분',
          description: bn.description || '',
        },
        impact: {
          revenueImpact: bn.revenueImpact || 0,
          customerImpact: bn.customerImpact || 0,
        },
        recommendations: bn.recommendations || [],
      });
    }
  }

  // diagnostic_issues에서 추출 (기존 형식 호환)
  if (aiResult.diagnostic_issues) {
    for (const di of aiResult.diagnostic_issues) {
      if (!issues.find(i => i.location.zoneName === di.zone_name && i.type === di.type)) {
        issues.push({
          id: generateIssueId(),
          type: di.type || 'congestion',
          severity: di.severity || 'warning',
          title: di.title || di.message || '',
          location: {
            zoneId: di.zone_id || '',
            zoneName: di.zone_name || '',
          },
          details: {
            currentValue: di.value || 0,
            threshold: di.threshold || 0,
            unit: di.unit || '',
            description: di.description || di.message || '',
          },
          impact: {
            revenueImpact: di.revenue_impact || 0,
            customerImpact: di.customer_impact || 0,
          },
          recommendations: di.recommendations || [],
        });
      }
    }
  }

  return issues;
}
