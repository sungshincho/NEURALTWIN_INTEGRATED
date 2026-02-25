/**
 * promptBuilder.ts - Phase 1.1: Advanced Chain-of-Thought Prompt Builder
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * AI가 5단계 명시적 추론을 수행하도록 설계된 고급 프롬프트 빌더
 *
 * 주요 기능:
 * - Chain-of-Thought (CoT) 5단계 추론 프레임워크
 * - 환경/동선/연관성 데이터 통합
 * - 구조화된 출력 형식 강제
 * - 토큰 최적화
 */

import type { EnvironmentDataBundle } from '../data/environmentLoader.ts';
import type { FlowAnalysisResult } from '../data/flowAnalyzer.ts';
import type { ProductAssociationResult } from '../data/associationMiner.ts';

// Phase 1.2: Few-Shot Learning
import {
  selectExamples,
  buildFewShotSection,
  createScenarioFromEnvironment,
  type SelectionStrategy,
  type ExampleScenario,
  type OptimizationExample,
} from './fewShotExamples.ts';

// 🆕 Phase 5: Structured Output 스키마 (리테일 도메인 지식)
import {
  VMD_PRINCIPLES,
  PLACEMENT_STRATEGIES,
  FURNITURE_TYPES,
  SHELF_LEVELS,
  PLACEMENT_STRATEGY_CODEBOOK,
  VMD_PRINCIPLE_CODEBOOK,
} from '../schemas/retailOptimizationSchema.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 프롬프트 전략 설정
 */
export interface PromptConfig {
  strategy: 'basic' | 'chain_of_thought' | 'few_shot' | 'hybrid';
  chainOfThought: {
    enabled: boolean;
    steps: ReasoningStep[];
    requireExplicitReasoning: boolean;
  };
  fewShot: {
    enabled: boolean;
    exampleCount: number;
    selectionStrategy: SelectionStrategy;
  };
  constraints: {
    maxFurnitureChanges: number;
    maxProductChanges: number;
    respectMovableFlag: boolean;
    validateSlotCompatibility: boolean;
  };
  tokenLimits: {
    maxLayoutData: number;
    maxPerformanceData: number;
    maxSlotData: number;
  };
}

/**
 * 추론 단계 정의
 */
export interface ReasoningStep {
  stepNumber: number;
  stepName: string;
  description: string;
  requiredAnalysis: string[];
  expectedOutput: string;
}

/**
 * 최적화 설정
 */
export interface OptimizationSettings {
  optimizationType: 'furniture' | 'product' | 'both';
  optimizationGoal: 'revenue' | 'conversion' | 'traffic' | 'balanced';
  intensity: 'low' | 'medium' | 'high';
  maxChanges: number;
  weights: {
    revenue: number;
    conversion: number;
    traffic: number;
    experience: number;
  };
  parameters: Record<string, any>;
}

/**
 * 레이아웃 데이터
 */
export interface LayoutData {
  zones: any[];
  furniture: any[];
  products: any[];
  productDetails?: any[];
}

/**
 * 성과 데이터
 */
export interface PerformanceData {
  zoneMetrics: Record<string, any>;
  productPerformance: any[];
}

/**
 * 진단 이슈 (시뮬레이션에서 발견된 문제점)
 */
export interface DiagnosticIssue {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  zone_id?: string;
  zone_name?: string;
  description?: string;
  impact?: {
    revenueImpact?: number;
    trafficImpact?: number;
    conversionImpact?: number;
  };
  recommendations?: string[];
}

/**
 * 진단 이슈 컨텍스트
 */
export interface DiagnosticIssuesContext {
  priority_issues: DiagnosticIssue[];
  scenario_context?: {
    id: string;
    name: string;
    description?: string;
    expected_impact?: any;
    risk_tags?: string[];
  } | null;
  environment_context?: any | null;
  simulation_kpis?: any | null;
}

/**
 * 프롬프트 컨텍스트 (모든 입력 데이터 통합)
 */
export interface PromptContext {
  layout: LayoutData;
  performance: PerformanceData;
  slots: any[];
  environment: EnvironmentDataBundle | null;
  flowAnalysis: FlowAnalysisResult | null;
  associations: ProductAssociationResult | null;
  settings: OptimizationSettings;
  // 🆕 시뮬레이션에서 전달받은 진단 이슈
  diagnosticIssues?: DiagnosticIssuesContext | null;
}

/**
 * 빌드된 프롬프트 결과
 */
export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedOutputFormat: string;
  totalTokenEstimate: number;
  metadata: {
    strategy: string;
    cotEnabled: boolean;
    fewShotEnabled: boolean;
    fewShotCount: number;
    fewShotStrategy: SelectionStrategy;
    dataIncluded: {
      environment: boolean;
      flowAnalysis: boolean;
      associations: boolean;
    };
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 5단계 추론 프레임워크
 */
export const REASONING_STEPS: ReasoningStep[] = [
  {
    stepNumber: 1,
    stepName: 'Environment Assessment',
    description: '현재 환경 조건이 고객 행동에 미치는 영향 분석',
    requiredAnalysis: [
      '날씨 영향 분석 (traffic, dwell, conversion multipliers)',
      '이벤트/휴일 영향 평가',
      '시간대별 패턴 (피크/오프피크)',
      '리스크 요인 식별',
    ],
    expectedOutput: '환경 기반 최적화 방향성 도출',
  },
  {
    stepNumber: 2,
    stepName: 'Flow Analysis',
    description: '고객 동선 패턴과 최적화 기회 분석',
    requiredAnalysis: [
      '주요 고객 경로 식별 (high-value path)',
      '병목 구간 분석 (가구 재배치 필요 여부)',
      '데드존 활성화 전략 수립',
      '크로스셀 기회 (경로 기반)',
    ],
    expectedOutput: '동선 기반 가구/상품 배치 후보 도출',
  },
  {
    stepNumber: 3,
    stepName: 'Product Performance Review',
    description: '상품 배치 효율성 평가 및 연관성 분석',
    requiredAnalysis: [
      '저성과 상품 in 프리미엄 위치 → 재배치 필요',
      '고성과 상품 in 서브옵티멀 위치 → 업그레이드 기회',
      '연관 규칙 기반 번들/크로스셀 기회',
      '재고 및 시즌성 고려',
    ],
    expectedOutput: '상품 재배치 우선순위 목록',
  },
  {
    stepNumber: 4,
    stepName: 'VMD Principles Application',
    description: '시각적 머천다이징 원칙 적용',
    requiredAnalysis: [
      '골든존 최적화 (눈높이 = 구매 높이)',
      '컬러 블로킹 기회 탐색',
      '포컬 포인트 설정 (존 입구/교차점)',
      '여백 및 접근성 확보',
    ],
    expectedOutput: 'VMD 기반 배치 조정 사항',
  },
  {
    stepNumber: 5,
    stepName: 'Impact Estimation & Prioritization',
    description: '예상 효과 정량화 및 우선순위 결정',
    requiredAnalysis: [
      '변경별 예상 매출 영향 (% 단위)',
      '전환율 개선 예측',
      '구현 난이도 평가 (easy/medium/hard)',
      '리스크 평가 (low/medium/high)',
    ],
    expectedOutput: '최종 최적화 권고안 (우선순위 포함)',
  },
];

/**
 * 기본 프롬프트 설정
 */
export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  strategy: 'chain_of_thought',
  chainOfThought: {
    enabled: true,
    steps: REASONING_STEPS,
    requireExplicitReasoning: true,
  },
  fewShot: {
    enabled: false,
    exampleCount: 3,
    selectionStrategy: 'similar',
  },
  constraints: {
    maxFurnitureChanges: 10,
    maxProductChanges: 30,
    respectMovableFlag: true,
    validateSlotCompatibility: true,
  },
  tokenLimits: {
    maxLayoutData: 20,
    maxPerformanceData: 20,
    maxSlotData: 30,
  },
};

/**
 * 기본 최적화 설정
 */
export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  optimizationType: 'both',
  optimizationGoal: 'balanced',
  intensity: 'medium',
  maxChanges: 30,
  weights: {
    revenue: 0.35,
    conversion: 0.25,
    traffic: 0.20,
    experience: 0.20,
  },
  parameters: {},
};

/**
 * 🔧 FIX: 최적화 목표에 따른 가중치 반환
 * - revenue: 매출 최대화 우선
 * - dwell_time: 체류시간 증가 우선
 * - conversion: 전환율 향상 우선
 * - balanced: 균형 최적화
 */
export function getWeightsForGoal(goal: string): {
  revenue: number;
  conversion: number;
  traffic: number;
  experience: number;
} {
  switch (goal) {
    case 'revenue':
      return { revenue: 0.50, conversion: 0.20, traffic: 0.15, experience: 0.15 };
    case 'dwell_time':
      return { revenue: 0.15, conversion: 0.20, traffic: 0.20, experience: 0.45 };
    case 'conversion':
      return { revenue: 0.20, conversion: 0.50, traffic: 0.15, experience: 0.15 };
    case 'traffic':
      return { revenue: 0.15, conversion: 0.15, traffic: 0.50, experience: 0.20 };
    case 'balanced':
    default:
      return { revenue: 0.30, conversion: 0.25, traffic: 0.20, experience: 0.25 };
  }
}

// ============================================================================
// System Prompt Builder
// ============================================================================

/**
 * 시스템 프롬프트 생성
 * AI의 역할과 전문성을 정의
 */
export function buildSystemPrompt(config: PromptConfig): string {
  const cotInstruction = config.chainOfThought.enabled
    ? `

## REASONING PROTOCOL
You MUST follow a structured Chain-of-Thought reasoning process.
Before providing your final JSON output, work through each analysis step explicitly.
Your reasoning should be thorough but concise.`
    : '';

  return `You are an elite retail optimization AI with deep expertise in:
- Visual Merchandising (VMD) principles and retail psychology
- Customer behavior analysis and journey optimization
- Retail space economics and revenue maximization
- Data-driven decision making with confidence scoring

Your mission is to optimize retail store layouts for maximum revenue, conversion, and customer experience while respecting all operational constraints.
${cotInstruction}

## CORE PRINCIPLES
1. **Data-Driven**: Every recommendation must be backed by provided data
2. **Constraint-Aware**: Never violate physical or business constraints
3. **Impact-Focused**: Prioritize changes with highest expected ROI
4. **Risk-Conscious**: Flag high-risk changes clearly
5. **Actionable**: Provide specific, implementable recommendations`;
}

// ============================================================================
// Section Builders
// ============================================================================

/**
 * 5단계 추론 프레임워크 섹션 생성
 */
export function buildReasoningFramework(steps: ReasoningStep[]): string {
  const stepsText = steps.map(step => `
### Step ${step.stepNumber}: ${step.stepName}
**Goal**: ${step.description}

**Required Analysis:**
${step.requiredAnalysis.map(a => `- ${a}`).join('\n')}

**Expected Output**: ${step.expectedOutput}
`).join('\n');

  return `## 🧠 REASONING FRAMEWORK (Required)

You must work through these 5 steps in order. Show your reasoning for each step.

${stepsText}

After completing all steps, synthesize your findings into the final JSON output.`;
}

/**
 * 제약조건 섹션 생성
 */
export function buildConstraintsSection(
  settings: OptimizationSettings,
  config: PromptConfig
): string {
  return `## 🎯 CRITICAL CONSTRAINTS

### Hard Constraints (MUST follow)
1. **Product IDs**: ONLY use exact product IDs from the provided data
2. **Furniture Movability**: ONLY suggest relocation for furniture with \`movable: true\`
3. **Slot Compatibility**: Product \`display_type\` MUST match slot's \`compatible_display_types\`
4. **Change Limits**: Max ${config.constraints.maxFurnitureChanges} furniture + ${config.constraints.maxProductChanges} product changes

### Optimization Parameters
- **Type**: ${settings.optimizationType}
- **Goal**: ${settings.optimizationGoal}
- **Intensity**: ${settings.intensity}
- **Weights**: Revenue ${Math.round(settings.weights.revenue * 100)}% | Conversion ${Math.round(settings.weights.conversion * 100)}% | Traffic ${Math.round(settings.weights.traffic * 100)}% | Experience ${Math.round(settings.weights.experience * 100)}%

### ⚠️ MINIMUM CHANGE REQUIREMENTS (CRITICAL)
${settings.optimizationType === 'furniture' || settings.optimizationType === 'both' ? `
**Furniture Optimization Required**: You MUST provide at least 2-3 furniture change suggestions.
- Analyze ALL movable furniture in the layout
- Even without explicit diagnostic issues, identify optimization opportunities
- Consider: traffic flow improvement, dead zone activation, bottleneck resolution
- If no critical issues exist, suggest PROACTIVE improvements based on VMD principles
` : ''}
${settings.optimizationType === 'product' || settings.optimizationType === 'both' ? `
**Product Optimization Required**: You MUST provide at least 3-5 product change suggestions.
- Analyze product placement efficiency based on performance data
- Apply golden_zone_placement for high-margin products
- Consider cross-sell opportunities based on association rules
` : ''}
${settings.optimizationType === 'both' ? `
**Combined Optimization**: For 'both' type, you MUST provide changes for BOTH furniture AND products.
` : ''}
**IMPORTANT**: Empty arrays are NOT acceptable. Always provide actionable recommendations.`;
}

/**
 * 🆕 진단 이슈 섹션 생성 (시뮬레이션에서 발견된 문제점)
 * - 최적화 시 이 문제점들을 최우선으로 해결하도록 지시
 */
export function buildDiagnosticIssuesSection(diagnosticIssues: DiagnosticIssuesContext | null): string {
  if (!diagnosticIssues || !diagnosticIssues.priority_issues || diagnosticIssues.priority_issues.length === 0) {
    return '';
  }

  const issues = diagnosticIssues.priority_issues;
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');
  const totalRevenueImpact = issues.reduce((sum, i) => sum + (i.impact?.revenueImpact || 0), 0);

  // 시나리오 컨텍스트 (있는 경우)
  const scenarioSection = diagnosticIssues.scenario_context
    ? `
### Simulation Scenario
- **Name**: ${diagnosticIssues.scenario_context.name}
${diagnosticIssues.scenario_context.description ? `- **Description**: ${diagnosticIssues.scenario_context.description}` : ''}
${diagnosticIssues.scenario_context.risk_tags?.length ? `- **Risk Tags**: ${diagnosticIssues.scenario_context.risk_tags.join(', ')}` : ''}
`
    : '';

  // KPI 컨텍스트 (있는 경우)
  const kpiSection = diagnosticIssues.simulation_kpis
    ? `
### Simulation KPIs
- Visitors: ${diagnosticIssues.simulation_kpis.visitors?.toLocaleString() || 'N/A'}
- Revenue: ₩${diagnosticIssues.simulation_kpis.revenue?.toLocaleString() || 'N/A'}
- Conversion: ${((diagnosticIssues.simulation_kpis.conversion || 0) * 100).toFixed(1)}%
- Avg Dwell: ${diagnosticIssues.simulation_kpis.avg_dwell?.toFixed(0) || 'N/A'}s
`
    : '';

  // 이슈 목록
  const issuesList = issues.map((issue, idx) => {
    const severityIcon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟠' : '🔵';
    const impactStr = issue.impact?.revenueImpact
      ? ` | Revenue Impact: ₩${(issue.impact.revenueImpact / 10000).toLocaleString()}만원`
      : '';
    const recsStr = issue.recommendations?.length
      ? `\n   - Recommendations: ${issue.recommendations.slice(0, 2).join('; ')}`
      : '';

    return `${idx + 1}. ${severityIcon} **[${issue.severity.toUpperCase()}]** ${issue.title}
   - Type: ${issue.type}
   - Zone: ${issue.zone_name || issue.zone_id || 'N/A'}
   - Description: ${issue.description || 'N/A'}${impactStr}${recsStr}`;
  }).join('\n\n');

  return `## 🚨 PRIORITY ISSUES TO SOLVE (FROM AI SIMULATION)

**CRITICAL**: The following issues were identified by the AI simulation.
**YOUR PRIMARY OBJECTIVE is to solve these issues through layout/product optimization.**

### Issue Summary
- **Total Issues**: ${issues.length}
- **Critical**: ${criticalIssues.length} 🔴
- **Warning**: ${warningIssues.length} 🟠
- **Estimated Revenue Impact**: ₩${(totalRevenueImpact / 10000).toLocaleString()}만원/day

${scenarioSection}
${kpiSection}
### Issue Details (MUST ADDRESS)
${issuesList}

### Optimization Directive
1. **PRIORITIZE** solving the critical issues (🔴) first
2. **FOCUS** changes on the affected zones: ${[...new Set(issues.map(i => i.zone_name || i.zone_id).filter(Boolean))].join(', ')}
3. **APPLY** the recommended solutions where possible
4. **QUANTIFY** expected improvement for each issue resolved
5. **CROSS-REFERENCE** with flow analysis and performance data to validate solutions

---`;
}

/**
 * 환경 컨텍스트 섹션 생성
 */
export function buildEnvironmentSection(environment: EnvironmentDataBundle | null): string {
  if (!environment) {
    return `## 🌤️ ENVIRONMENT CONTEXT
*No environment data available - apply standard optimization strategies*`;
  }

  const weather = environment.weather;
  const impact = environment.impact;
  const events = environment.events;

  // 영향도 아이콘 결정
  const getImpactIcon = (value: number) => {
    if (value > 1.2) return '📈';
    if (value < 0.8) return '📉';
    return '➖';
  };

  return `## 🌤️ ENVIRONMENT CONTEXT

### Current Conditions
${weather ? `- Weather: **${weather.condition}** (${weather.temperature}°C, Humidity: ${weather.humidity}%)` : '- Weather: Unknown'}
- Day: **${environment.temporal.dayOfWeek}** (${environment.temporal.isWeekend ? 'Weekend' : 'Weekday'})
- Time: **${environment.temporal.timeOfDay}** (${environment.temporal.businessHourWeight > 0.5 ? 'Business Hours' : 'Off-peak'})

### Impact Multipliers
| Factor | Multiplier | Trend |
|--------|-----------|-------|
| Traffic | ${impact.combined.traffic.toFixed(2)}x | ${getImpactIcon(impact.combined.traffic)} |
| Dwell Time | ${impact.combined.dwell.toFixed(2)}x | ${getImpactIcon(impact.combined.dwell)} |
| Conversion | ${impact.combined.conversion.toFixed(2)}x | ${getImpactIcon(impact.combined.conversion)} |

**Confidence**: ${Math.round(impact.confidence * 100)}%

### Active Events
${events.length > 0
  ? events.map(e => `- **${e.eventName}** (${e.eventType}, Impact: ${e.impactLevel})`).join('\n')
  : '- No special events'}

### Environment-Based Recommendations
${impact.weather.recommendations.length > 0
  ? impact.weather.recommendations.map(r => `- ${r}`).join('\n')
  : ''}
${impact.event.recommendations.length > 0
  ? impact.event.recommendations.map(r => `- ${r}`).join('\n')
  : ''}
${impact.weather.recommendations.length === 0 && impact.event.recommendations.length === 0
  ? '- Standard optimization applies'
  : ''}

### 🎯 Environment-Driven Placement Strategy Priorities (P1)
${weather?.condition?.toLowerCase().includes('rain') || weather?.condition?.toLowerCase().includes('비') ?
`**Rainy Weather Strategy:**
- PRIORITIZE: \`impulse_buy_position\` (customers stay longer indoors, impulse purchases increase)
- PRIORITIZE: \`cross_sell_bundle\` (umbrellas, rainwear near entrance)
- AVOID: Outdoor-related products in golden zones` : ''}
${environment.temporal.isWeekend ?
`**Weekend Strategy:**
- PRIORITIZE: \`hero_product_display\` (families browse more)
- PRIORITIZE: \`cross_sell_bundle\` (family bundles)
- FOCUS: Experience-oriented displays` : ''}
${['morning', '아침'].includes(environment.temporal.timeOfDay as string) ?
`**Morning Rush Strategy:**
- PRIORITIZE: \`impulse_buy_position\` near checkout
- PRIORITIZE: \`golden_zone_placement\` for grab-and-go items
- MINIMIZE: Complex cross-sell bundles (customers in hurry)` : ''}
${['evening', '저녁'].includes(environment.temporal.timeOfDay as string) ?
`**Evening Strategy:**
- PRIORITIZE: \`slow_mover_activation\` (clearance items)
- PRIORITIZE: \`high_margin_spotlight\` (impulse dinner items)
- FOCUS: Quick meal solutions near entrance` : ''}
${events.some(e => e.impactLevel === 'high') ?
`**High-Impact Event Strategy:**
- PRIORITIZE: \`seasonal_highlight\` for event-related products
- MAXIMIZE: \`hero_product_display\` at entrance
- EXPECT: ${Math.round((impact.combined.traffic - 1) * 100)}% traffic increase` : ''}

### Key Insight
${impact.summary}`;
}

/**
 * 동선 분석 섹션 생성
 */
export function buildFlowAnalysisSection(flowAnalysis: FlowAnalysisResult | null): string {
  if (!flowAnalysis) {
    return `## 🚶 CUSTOMER FLOW ANALYSIS
*No flow data available - focus on general traffic patterns*`;
  }

  const summary = flowAnalysis.summary;
  const healthIcon = summary.flowHealthScore >= 70 ? '✅' : summary.flowHealthScore >= 50 ? '⚡' : '⚠️';

  // 주요 경로 포맷
  const topPaths = flowAnalysis.keyPaths.slice(0, 5).map((p, i) =>
    `${i + 1}. ${p.zoneNames.join(' → ')} (freq: ${p.frequency}, type: ${p.pathType})`
  ).join('\n');

  // 병목 포맷
  const bottlenecks = flowAnalysis.bottlenecks.length > 0
    ? flowAnalysis.bottlenecks.map(b =>
        `- **${b.zoneName}** [${b.severity.toUpperCase()}]: Congestion ${(b.congestionScore * 100).toFixed(0)}%`
      ).join('\n')
    : '- No critical bottlenecks';

  // 데드존 포맷
  const deadZones = flowAnalysis.deadZones.length > 0
    ? flowAnalysis.deadZones.map(d =>
        `- **${d.zoneName}** [${d.severity.toUpperCase()}]: Visit rate ${(d.visitRate * 100).toFixed(1)}%`
      ).join('\n')
    : '- No critical dead zones';

  return `## 🚶 CUSTOMER FLOW ANALYSIS

### Flow Health Score: ${summary.flowHealthScore}/100 ${healthIcon}

### Key Metrics
- Total Zones: ${summary.totalZones}
- Total Transitions: ${summary.totalTransitions.toLocaleString()}
- Avg Path Length: ${summary.avgPathLength.toFixed(1)} zones
- Avg Path Duration: ${Math.round(summary.avgPathDuration)}s
- Overall Conversion: ${(summary.overallConversionRate * 100).toFixed(1)}%

### Top Customer Paths
${topPaths}

### Bottleneck Zones (Action Required)
${bottlenecks}

### Dead Zones (Activation Opportunity)
${deadZones}

### Optimization Opportunities
${flowAnalysis.opportunities.slice(0, 5).map(o =>
  `- [${o.priority.toUpperCase()}/${o.type}] ${o.description}`
).join('\n') || '- No specific opportunities identified'}

### Flow-Based Guidelines
${summary.flowHealthScore < 50
  ? '⚠️ **LOW FLOW HEALTH**: Prioritize fixing bottlenecks and activating dead zones'
  : summary.flowHealthScore < 70
    ? '⚡ **MODERATE FLOW HEALTH**: Focus on opportunity zones and path optimization'
    : '✅ **GOOD FLOW HEALTH**: Fine-tune for marginal improvements'}`;
}

/**
 * 연관성 분석 섹션 생성
 */
export function buildAssociationSection(associations: ProductAssociationResult | null): string {
  if (!associations) {
    return `## 🔗 PRODUCT ASSOCIATION ANALYSIS
*No association data available - apply standard merchandising rules*`;
  }

  const summary = associations.summary;

  // 상위 규칙 포맷
  const topRules = associations.associationRules.slice(0, 8).map(r =>
    `- [${r.ruleStrength.toUpperCase()}] ${r.antecedentNames.join(', ')} → ${r.consequentNames.join(', ')} ` +
    `(conf: ${(r.confidence * 100).toFixed(0)}%, lift: ${r.lift.toFixed(1)}x)`
  ).join('\n');

  // 카테고리 친화도 포맷
  const categoryAffinities = associations.categoryAffinities.slice(0, 5).map(a =>
    `- ${a.category1} + ${a.category2}: ${(a.affinityScore * 100).toFixed(0)}% → ${a.recommendedProximity}`
  ).join('\n');

  // 배치 추천 포맷
  const recommendations = associations.placementRecommendations.slice(0, 5).map(r =>
    `- [${r.type.toUpperCase()}] ${r.primaryProduct.name} | ${r.reason}`
  ).join('\n');

  return `## 🔗 PRODUCT ASSOCIATION ANALYSIS

### Data Quality: ${summary.dataQuality.toUpperCase()}
- Total Transactions: ${summary.totalTransactions.toLocaleString()}
- Avg Basket Size: ${summary.avgBasketSize.toFixed(1)} items
- Strong Rules: ${summary.strongRulesCount} (Very Strong: ${summary.veryStrongRulesCount})

### Top Association Rules
${topRules || '- No significant rules found'}

### Category Affinities
${categoryAffinities || '- Using default affinities'}

### Placement Recommendations
${recommendations || '- No specific recommendations'}

### Association-Based Guidelines
${summary.veryStrongRulesCount > 0
  ? '🔥 **VERY STRONG ASSOCIATIONS FOUND**: Prioritize bundle displays for these products'
  : ''}
${summary.strongRulesCount > 3
  ? '💡 **MULTIPLE STRONG ASSOCIATIONS**: Apply cross-sell placement actively'
  : ''}
${associations.placementRecommendations.length > 0
  ? `📍 **${associations.placementRecommendations.length} placement recommendations** available`
  : ''}`;
}

/**
 * 레이아웃 데이터 섹션 생성
 */
export function buildLayoutDataSection(
  layout: LayoutData,
  config: PromptConfig
): string {
  const maxFurniture = config.tokenLimits.maxLayoutData;
  const maxProducts = config.tokenLimits.maxLayoutData + 10;

  // 존 테이블 포맷
  const zonesTable = layout.zones.length > 0
    ? `| Zone ID | Name | Type | Area |
|---------|------|------|------|
${layout.zones.slice(0, 10).map(z =>
  `| ${z.id?.slice(0, 8) || 'N/A'} | ${z.zone_name || z.zoneName || 'N/A'} | ${z.zone_type || z.zoneType || 'N/A'} | ${z.area_sqm || 'N/A'}m² |`
).join('\n')}`
    : '*No zone data*';

  // 가구 목록 포맷 (movable 강조)
  const furnitureList = layout.furniture.slice(0, maxFurniture).map(f =>
    `- ${f.furniture_name || f.id?.slice(0, 8)} [${f.furniture_type}] ` +
    `${f.movable !== false ? '✅ movable' : '🔒 fixed'} @ Zone ${f.zone_id?.slice(0, 8) || 'N/A'}`
  ).join('\n');

  // 상품 목록 포맷 (현재 위치 포함)
  const productsList = layout.products.slice(0, maxProducts).map(p =>
    `- ${p.product_name || p.sku || p.id?.slice(0, 8)} | ` +
    `Zone: ${p.zone_id?.slice(0, 8) || 'N/A'} | ` +
    `Slot: ${p.slot_code || p.slot_id?.slice(0, 8) || 'N/A'} | ` +
    `Display: ${p.display_type || 'N/A'}`
  ).join('\n');

  return `## 🏪 CURRENT LAYOUT DATA

### Zones (${layout.zones.length} total)
${zonesTable}

### Furniture (${layout.furniture.length} total, showing ${Math.min(layout.furniture.length, maxFurniture)})
${furnitureList || '*No furniture data*'}

### Products with Placements (${layout.products.length} total, showing ${Math.min(layout.products.length, maxProducts)})
${productsList || '*No product placement data*'}

### Raw Data (for exact IDs)
\`\`\`json
{
  "furniture_sample": ${JSON.stringify(layout.furniture.slice(0, 5), null, 2)},
  "products_sample": ${JSON.stringify(layout.products.slice(0, 5), null, 2)}
}
\`\`\``;
}

/**
 * 슬롯 데이터 섹션 생성
 */
export function buildSlotsSection(slots: any[], config: PromptConfig): string {
  const maxSlots = config.tokenLimits.maxSlotData;

  // 빈 슬롯 우선 필터링
  const availableSlots = slots.filter(s => !s.is_occupied).slice(0, maxSlots);
  const occupiedSlots = slots.filter(s => s.is_occupied).slice(0, 10);

  const availableList = availableSlots.map(s =>
    `- Slot ${s.slot_id || s.id?.slice(0, 8)} | ` +
    `Furniture: ${s.furniture_code || s.furniture_id?.slice(0, 8) || 'N/A'} | ` +
    `Zone: ${s.zone_id?.slice(0, 8) || 'N/A'} | ` +
    `Types: ${(s.compatible_display_types || []).join(', ') || 'any'}`
  ).join('\n');

  return `## 📦 AVAILABLE SLOTS

### Empty Slots (${availableSlots.length} available for placement)
${availableList || '*No available slots*'}

### Slot Data (for exact IDs)
\`\`\`json
${JSON.stringify(availableSlots.slice(0, 10), null, 2)}
\`\`\``;
}

/**
 * 성과 데이터 섹션 생성
 */
export function buildPerformanceSection(
  performance: PerformanceData,
  config: PromptConfig
): string {
  const maxProducts = config.tokenLimits.maxPerformanceData;

  // 존 메트릭 요약
  const zoneEntries = Object.entries(performance.zoneMetrics || {});
  const zonesSummary = zoneEntries.slice(0, 10).map(([zoneId, metrics]: [string, any]) =>
    `- Zone ${zoneId.slice(0, 8)}: Visitors ${metrics.visitors?.toLocaleString() || 'N/A'} | ` +
    `Revenue ${metrics.revenue?.toLocaleString() || 'N/A'} | ` +
    `Conv ${((metrics.conversions / (metrics.visitors || 1)) * 100).toFixed(1)}%`
  ).join('\n');

  // 상품 성과 요약
  const topProducts = (performance.productPerformance || [])
    .slice(0, maxProducts)
    .map((p: any, i: number) =>
      `${i + 1}. ${p.product_id?.slice(0, 8) || 'N/A'} | ` +
      `Revenue: ${p.revenue?.toLocaleString() || 'N/A'} | ` +
      `Units: ${p.units_sold || 'N/A'} | ` +
      `Conv: ${((p.conversion_rate || 0) * 100).toFixed(1)}%`
    ).join('\n');

  return `## 📊 PERFORMANCE DATA

### Zone Performance (${zoneEntries.length} zones)
${zonesSummary || '*No zone metrics*'}

### Top Performing Products
${topProducts || '*No product performance data*'}`;
}

/**
 * 출력 형식 섹션 생성
 */
export function buildOutputFormatSection(config: PromptConfig): string {
  const thinkingBlock = config.chainOfThought.requireExplicitReasoning
    ? `
### Reasoning Block (Required but CONCISE)
Before your JSON output, provide BRIEF reasoning in a <thinking> block.

**⚠️ CRITICAL**: Keep the <thinking> block under 500 words total. Focus on key decisions only.
**⚠️ PRIORITY**: The JSON output is MORE IMPORTANT than the reasoning. Never let reasoning truncate the JSON.

\`\`\`
<thinking>
Step 1 - Environment: [1-2 sentences on key environmental factors]
Step 2 - Flow: [1-2 sentences on critical flow patterns]
Step 3 - Products: [1-2 sentences on product performance issues]
Step 4 - VMD: [1-2 sentences on VMD adjustments]
Step 5 - Impact: [1-2 sentences on prioritization]
Key Decision: [Main optimization strategy in 1 sentence]
</thinking>
\`\`\`
`
    : '';

  // 🆕 Phase 5: 도메인 지식 enum 값 정의
  const domainKnowledgeBlock = `
### 🏪 Retail Domain Knowledge (Required Values)

**VMD Principles** (use in furniture_changes.vmd_principle AND product_changes.reason):
${VMD_PRINCIPLES.map(p => `- \`${p}\`: ${VMD_PRINCIPLE_CODEBOOK[p]?.description || p}`).join('\n')}

⚠️ **VMD Integration for Product Optimization**:
When optimizing products, you MUST consider and reference VMD principles:
1. **focal_point_creation**: 입구/교차점 상품 배치 시 사용
2. **traffic_flow_optimization**: 동선 기반 상품 재배치 시 사용
3. **dead_zone_activation**: 저트래픽 구역 상품 배치 시 사용
4. **sightline_improvement**: 시야선 고려한 상품 배치 시 사용
5. **cross_sell_proximity**: 연관 상품 근접 배치 시 사용

For EACH product change, include the relevant VMD principle in the "reason" field.
Example: "골든존(eye_level) 배치로 시야선 확보, cross_sell_proximity 원칙 적용하여 연관상품과 근접 배치"

**Placement Strategies** (use in product_changes.placement_strategy.type):
${PLACEMENT_STRATEGIES.map(s => `- \`${s}\`: ${PLACEMENT_STRATEGY_CODEBOOK[s]?.description || s} (lift: ${PLACEMENT_STRATEGY_CODEBOOK[s]?.expected_lift?.min * 100}-${PLACEMENT_STRATEGY_CODEBOOK[s]?.expected_lift?.max * 100}%)`).join('\n')}

🔴 **CRITICAL: PLACEMENT STRATEGY DIVERSITY REQUIREMENT**
Your product_changes MUST use **at least 3 different placement strategies** from the list above.
- DO NOT use only one strategy (e.g., all "cross_sell_bundle")
- Analyze each product's characteristics and select the MOST APPROPRIATE strategy:
  - High-margin products → \`golden_zone_placement\`, \`high_margin_spotlight\`
  - New arrivals → \`new_arrival_feature\`, \`eye_level_optimization\`
  - Slow movers → \`slow_mover_activation\`, \`clearance_optimization\`
  - Related products → \`cross_sell_bundle\`
  - Impulse buys → \`impulse_buy_position\`
  - Seasonal items → \`seasonal_highlight\`
  - Hero/flagship products → \`hero_product_display\`
- If you have 5+ product changes, use at least 3-4 different strategies
- If you have 10+ product changes, use at least 5 different strategies

**Shelf Levels** (use in shelf_level - VMD 골든존 분석용):
${SHELF_LEVELS.map(l => `- \`${l}\``).join(', ')}

⚠️ **Eye Level = Buy Level**: 눈높이(eye_level, 120-150cm)가 골든존이며, 이 위치에 고마진/전략상품 배치 필수
`;

  return `## 📤 OUTPUT FORMAT

${thinkingBlock}
${domainKnowledgeBlock}

### JSON Output (Required - Structured Output Schema)
Respond with valid JSON in this exact structure:

\`\`\`json
{
  "reasoning_summary": "핵심 최적화 전략 요약 (500자 이내)",
  "furniture_changes": [
    {
      "furniture_id": "exact-uuid-from-data",
      "furniture_type": "${FURNITURE_TYPES.slice(0, 3).join('|')}|...",
      "movable": true,
      "current": {
        "zone_id": "current-zone-uuid",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 }
      },
      "suggested": {
        "zone_id": "target-zone-uuid",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 }
      },
      "vmd_principle": "${VMD_PRINCIPLES[0]}",
      "reason": "데이터 기반 변경 이유",
      "priority": "high|medium|low",
      "expected_impact": {
        "traffic_change": 0.15,
        "dwell_time_change": 0.10,
        "visibility_score": 85,
        "confidence": 0.8
      },
      "risk_level": "low|medium|high",
      "implementation_difficulty": "easy|medium|hard"
    }
  ],
  "product_changes": [
    {
      "product_id": "exact-uuid-from-data",
      "sku": "exact-sku",
      "current": {
        "zone_id": "current-zone-uuid",
        "furniture_id": "current-furniture-uuid",
        "slot_id": "current-slot-uuid",
        "position": { "x": 0, "y": 0, "z": 0 },
        "shelf_level": "eye_level"
      },
      "suggested": {
        "zone_id": "target-zone-uuid",
        "furniture_id": "target-furniture-uuid",
        "slot_id": "target-slot-uuid",
        "position": { "x": 0, "y": 0, "z": 0 },
        "shelf_level": "${SHELF_LEVELS[3]}"
      },
      "placement_strategy": {
        "type": "${PLACEMENT_STRATEGIES[0]}",
        "associated_products": ["uuid-1", "uuid-2"],
        "association_rule": {
          "confidence": 0.75,
          "lift": 2.1,
          "support": 0.08
        }
      },
      "reason": "데이터 기반 변경 이유",
      "priority": "high|medium|low",
      "expected_impact": {
        "revenue_change": 0.12,
        "visibility_change": 0.20,
        "conversion_change": 0.08,
        "confidence": 0.85
      },
      "slot_compatibility": {
        "is_compatible": true,
        "display_type_match": true,
        "size_fit": "exact|acceptable|tight"
      }
    }
  ],
  "summary": {
    "total_furniture_changes": 3,
    "total_product_changes": 8,
    "expected_revenue_improvement": 0.18,
    "expected_traffic_improvement": 0.10,
    "expected_conversion_improvement": 0.12,
    "expected_dwell_time_improvement": 0.08,
    "confidence_score": 0.85,
    "key_strategies": ["전략 1", "전략 2", "전략 3"],
    "ai_insights": [
      "VMD 원칙 적용: focal_point_creation으로 입구 시선 집중점 강화, 방문객 유입율 15% 개선 예상",
      "배치 전략: golden_zone_placement로 고마진 상품 눈높이 배치, 전환율 12% 향상",
      "연관 규칙: 상품A-상품B 동시구매율 35%, cross_sell_bundle 전략 적용",
      "병목 해소: 메인존의 혼잡도 25% 감소를 위한 가구 재배치 권장"
    ],
    "issues_addressed": [
      {
        "issue_id": "from-diagnostic-issues",
        "issue_type": "bottleneck|dead_zone|low_conversion",
        "resolution_approach": "해결 방법",
        "expected_resolution_rate": 0.8
      }
    ],
    "environmental_adaptations": ["환경 적응 1"],
    "risk_factors": ["리스크 1"]
  }
}
\`\`\`

### 🧠 AI Insights Requirements (REQUIRED)

Your response MUST include meaningful AI insights. These insights will be used for fine-tuning and customer-facing recommendations.

**For furniture/product optimization, add these in summary.ai_insights:**
\`\`\`json
{
  "summary": {
    "ai_insights": [
      "VMD 원칙 적용: [specific principle] 활용하여 [zone] 존의 [metric] 개선",
      "배치 전략: [strategy] 전략으로 [product] 상품의 가시성/전환율 향상",
      "연관 규칙 발견: [product A]와 [product B]의 동시구매율 [X]%, 근접 배치 권장",
      "병목 해소: [zone] 존의 혼잡도 [X]% 감소 예상"
    ],
    ...
  }
}
\`\`\`

**Insight Quality Guidelines:**
- Each insight MUST reference specific data (zone names, product IDs, percentages)
- Each insight MUST explain the applied strategy or principle
- Include at least 3-5 actionable insights
- Insights should cover: VMD principles, placement strategies, flow optimization

### ⚠️ Validation Rules (CRITICAL)
1. **ID 정확성**: 모든 ID는 제공된 데이터에서 정확히 복사
2. **VMD 원칙**: furniture_changes.vmd_principle은 위 목록에서만 선택 (REQUIRED for furniture changes)
3. **배치 전략**: product_changes.placement_strategy.type은 위 목록에서만 선택 (REQUIRED)
4. **이동 가능**: movable: false인 가구는 변경 불가
5. **슬롯 호환성**: slot의 display_type과 상품의 display_type 일치 필수
6. **수치 범위**: 개선율은 일반적으로 5-25% (0.05-0.25)
7. **신뢰도**: confidence는 0-1 범위
8. **AI 인사이트**: summary.ai_insights 배열에 3-5개의 인사이트 필수 포함`;
}

// ============================================================================
// Main Builder Function
// ============================================================================

/**
 * 고급 최적화 프롬프트 생성 (메인 함수)
 */
export function buildAdvancedOptimizationPrompt(
  context: PromptContext,
  config: PromptConfig = DEFAULT_PROMPT_CONFIG
): BuiltPrompt {
  // 1. 시스템 프롬프트 생성
  const systemPrompt = buildSystemPrompt(config);

  // 2. 유저 프롬프트 섹션들 생성
  const sections: string[] = [];

  // 제약조건
  sections.push(buildConstraintsSection(context.settings, config));

  // 🆕 진단 이슈 (시뮬레이션에서 발견된 문제점) - 제약조건 바로 다음에 배치하여 최우선으로 처리
  const diagnosticSection = buildDiagnosticIssuesSection(context.diagnosticIssues || null);
  if (diagnosticSection) {
    sections.push(diagnosticSection);
  }

  // 🆕 Phase 1.2: Few-Shot 예시 (CoT 프레임워크 앞에 배치)
  if (config.fewShot.enabled && config.fewShot.exampleCount > 0) {
    // 현재 환경에서 시나리오 생성
    const currentScenario = context.environment
      ? createScenarioFromEnvironment(
          context.environment.weather,
          context.environment.events,
          context.environment.temporal,
          context.flowAnalysis?.summary?.flowHealthScore
        )
      : null;

    // 예시 선택 및 섹션 빌드
    const selectedExamples = selectExamples(
      currentScenario,
      config.fewShot.exampleCount,
      config.fewShot.selectionStrategy
    );

    if (selectedExamples.length > 0) {
      sections.push(buildFewShotSection(selectedExamples));
    }
  }

  // 추론 프레임워크 (CoT 활성화 시)
  if (config.chainOfThought.enabled) {
    sections.push(buildReasoningFramework(config.chainOfThought.steps));
  }

  // 환경 컨텍스트
  sections.push(buildEnvironmentSection(context.environment));

  // 동선 분석
  sections.push(buildFlowAnalysisSection(context.flowAnalysis));

  // 연관성 분석
  sections.push(buildAssociationSection(context.associations));

  // 레이아웃 데이터
  sections.push(buildLayoutDataSection(context.layout, config));

  // 슬롯 데이터
  sections.push(buildSlotsSection(context.slots, config));

  // 성과 데이터
  sections.push(buildPerformanceSection(context.performance, config));

  // 출력 형식
  sections.push(buildOutputFormatSection(config));

  // 유저 프롬프트 조합
  const userPrompt = sections.join('\n\n---\n\n');

  // 3. 토큰 수 추정 (대략 4글자 = 1토큰 기준)
  const totalChars = systemPrompt.length + userPrompt.length;
  const totalTokenEstimate = Math.ceil(totalChars / 4);

  return {
    systemPrompt,
    userPrompt,
    expectedOutputFormat: 'json_object',
    totalTokenEstimate,
    metadata: {
      strategy: config.strategy,
      cotEnabled: config.chainOfThought.enabled,
      fewShotEnabled: config.fewShot.enabled,
      fewShotCount: config.fewShot.enabled ? config.fewShot.exampleCount : 0,
      fewShotStrategy: config.fewShot.selectionStrategy,
      dataIncluded: {
        environment: context.environment !== null,
        flowAnalysis: context.flowAnalysis !== null,
        associations: context.associations !== null,
      },
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * AI 응답에서 <thinking> 블록 추출
 */
export function extractThinkingBlock(response: string): {
  thinking: string | null;
  jsonContent: string;
} {
  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/);
  const thinking = thinkingMatch ? thinkingMatch[1].trim() : null;

  // <thinking> 블록 제거 후 JSON 추출
  let jsonContent = response.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();

  // JSON 블록만 추출
  const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  } else {
    // 직접 JSON 객체 찾기
    const jsonObjectMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonContent = jsonObjectMatch[0];
    }
  }

  return { thinking, jsonContent };
}

/**
 * 프롬프트 컨텍스트 생성 헬퍼
 */
export function createPromptContext(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData: EnvironmentDataBundle | null,
  flowAnalysis: FlowAnalysisResult | null,
  associationData: ProductAssociationResult | null,
  diagnosticIssues?: DiagnosticIssuesContext | null
): PromptContext {
  return {
    layout: {
      zones: layoutData.zones || [],
      furniture: layoutData.furniture || [],
      products: layoutData.products || [],
      productDetails: layoutData.productDetails || [],
    },
    performance: {
      zoneMetrics: performanceData.zoneMetrics || {},
      productPerformance: performanceData.productPerformance || [],
    },
    slots: slotsData || [],
    environment: environmentData,
    flowAnalysis: flowAnalysis,
    associations: associationData,
    settings: {
      optimizationType: optimizationType as any,
      optimizationGoal: parameters.goal || 'balanced',
      intensity: parameters.intensity || 'medium',
      maxChanges: parameters.max_changes || 30,
      // 🔧 FIX: goal에 따라 가중치 자동 결정
      weights: getWeightsForGoal(parameters.goal || 'balanced'),
      parameters,
    },
    // 🆕 시뮬레이션에서 전달받은 진단 이슈
    diagnosticIssues: diagnosticIssues || null,
  };
}

/**
 * 프롬프트 설정 생성 헬퍼
 */
export function createPromptConfig(
  options: Partial<PromptConfig> = {}
): PromptConfig {
  return {
    ...DEFAULT_PROMPT_CONFIG,
    ...options,
    chainOfThought: {
      ...DEFAULT_PROMPT_CONFIG.chainOfThought,
      ...(options.chainOfThought || {}),
    },
    fewShot: {
      ...DEFAULT_PROMPT_CONFIG.fewShot,
      ...(options.fewShot || {}),
    },
    constraints: {
      ...DEFAULT_PROMPT_CONFIG.constraints,
      ...(options.constraints || {}),
    },
    tokenLimits: {
      ...DEFAULT_PROMPT_CONFIG.tokenLimits,
      ...(options.tokenLimits || {}),
    },
  };
}
