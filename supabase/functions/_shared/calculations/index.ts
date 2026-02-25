/**
 * calculations/index.ts
 *
 * 계산 모듈 통합 엔트리포인트
 * Gemini Function Calling을 위한 Tool 정의 및 핸들러 포함
 *
 * Sprint 1 Task: S1-3
 * 작성일: 2026-01-12
 */

// ============================================================================
// 모듈 재export
// ============================================================================

export {
  calculateTrafficFlow,
  calculateTrafficFlowBatch,
  summarizeStoreTraffic,
  TRAFFIC_FLOW_FUNCTION_DECLARATION,
  TIME_MULTIPLIERS,
  DAY_MULTIPLIERS,
  ZONE_ATTRACTION,
  ZONE_DWELL_TIME,
  CONGESTION_THRESHOLDS,
  type TrafficFlowInput,
  type TrafficFlowOutput,
  type ZoneType,
  type TimeOfDay,
  type DayOfWeek,
  type StoreTrafficSummary,
} from './trafficFlow.ts';

export {
  calculateROI,
  calculateROIBatch,
  summarizeROIResults,
  compareROI,
  getPositionBonus,
  getVMDPlacementBonus,
  ROI_FUNCTION_DECLARATION,
  POSITION_VISIBILITY_BONUS,
  VMD_PLACEMENT_BONUS,
  INDUSTRY_AVG_ROI,
  type ROIInput,
  type ROIOutput,
  type ROISummary,
  type ROIComparison,
  type ROIRecommendation,
  type ComparisonMetrics,
} from './roiPredictor.ts';

// 🆕 Sprint 1: 검증 모듈 (S1-4)
export {
  validateRange,
  validateTrafficFlowOutput,
  validateROIOutput,
  detectOutliersIQR,
  detectOutliersZScore,
  detectOutliers,
  checkResultConsistency,
  checkMultiFieldConsistency,
  summarizeValidation,
  TRAFFIC_FLOW_RULES,
  ROI_RULES,
  type ValidationResult,
  type ValidationWarning,
  type ValidationError,
  type RangeRule,
  type OutlierConfig,
  type ConsistencyResult,
} from './validation.ts';

// 🆕 Sprint 1: 리테일 ROI v2 (증분 기반)
export {
  calculateRetailROI,
  calculateRetailROIBatch,
  summarizeRetailROIResults,
  RETAIL_ROI_FUNCTION_DECLARATION,
  POSITION_VISIBILITY_MULTIPLIER,
  POSITION_CONVERSION_BONUS,
  VERDICT_THRESHOLDS,
  type RetailROIInput,
  type RetailROIOutput,
  type RetailROISummary,
  type PositionInfo,
} from './roiPredictor_v2.ts';

// ============================================================================
// Tool Use 통합 정의
// ============================================================================

import {
  calculateTrafficFlow,
  TRAFFIC_FLOW_FUNCTION_DECLARATION,
  type TrafficFlowInput,
  type TrafficFlowOutput,
} from './trafficFlow.ts';

import {
  calculateROI,
  ROI_FUNCTION_DECLARATION,
  type ROIInput,
  type ROIOutput,
} from './roiPredictor.ts';

import {
  calculateRetailROI,
  RETAIL_ROI_FUNCTION_DECLARATION,
  type RetailROIInput,
  type RetailROIOutput,
} from './roiPredictor_v2.ts';

/**
 * Gemini Function Calling을 위한 Tool 정의 배열
 * AI 모델에 전달할 수 있는 형식
 */
export const CALCULATION_TOOLS = [
  {
    type: 'function' as const,
    function: TRAFFIC_FLOW_FUNCTION_DECLARATION,
  },
  {
    type: 'function' as const,
    function: ROI_FUNCTION_DECLARATION,
  },
  {
    type: 'function' as const,
    function: RETAIL_ROI_FUNCTION_DECLARATION,
  },
];

/**
 * OpenRouter/Gemini 형식의 Tool 정의
 */
export const OPENROUTER_TOOLS = CALCULATION_TOOLS.map(tool => ({
  type: 'function' as const,
  function: {
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
  },
}));

// ============================================================================
// Tool Call 핸들러
// ============================================================================

/** Tool Call 요청 형식 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** Tool Call 결과 */
export interface ToolCallResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

/**
 * Gemini Function Call 인자를 RetailROIInput으로 변환
 */
function convertToRetailROIInput(args: Record<string, unknown>): RetailROIInput {
  return {
    product_name: args.product_name as string,
    product_price: args.product_price as number,
    product_margin: args.product_margin as number,
    base_conversion_rate: args.base_conversion_rate as number,
    current_position: {
      zone_name: args.current_zone_name as string,
      daily_traffic: args.current_daily_traffic as number,
      visibility: args.current_visibility as number,
      position_type: args.current_position_type as RetailROIInput['current_position']['position_type'],
    },
    proposed_position: {
      zone_name: args.proposed_zone_name as string,
      daily_traffic: args.proposed_daily_traffic as number,
      visibility: args.proposed_visibility as number,
      position_type: args.proposed_position_type as RetailROIInput['proposed_position']['position_type'],
    },
    implementation_cost: args.implementation_cost as number | undefined,
  };
}

/**
 * 단일 Tool Call 처리
 */
export function processToolCall(toolCall: ToolCall): ToolCallResult {
  const { id, function: fn } = toolCall;
  const functionName = fn.name;

  try {
    // arguments 파싱
    const args = JSON.parse(fn.arguments);

    let result: TrafficFlowOutput | ROIOutput | RetailROIOutput;

    // Function 라우팅
    switch (functionName) {
      case 'calculate_traffic_flow':
        result = calculateTrafficFlow(args as TrafficFlowInput);
        break;

      case 'calculate_roi':
        result = calculateROI(args as ROIInput);
        break;

      case 'calculate_retail_roi':
        // v2: 증분 기반 리테일 ROI
        result = calculateRetailROI(convertToRetailROIInput(args));
        break;

      default:
        return {
          tool_call_id: id,
          role: 'tool',
          content: JSON.stringify({
            error: `Unknown function: ${functionName}`,
            available_functions: ['calculate_traffic_flow', 'calculate_roi', 'calculate_retail_roi'],
          }),
        };
    }

    return {
      tool_call_id: id,
      role: 'tool',
      content: JSON.stringify(result),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[processToolCall] Error processing ${functionName}:`, error);

    return {
      tool_call_id: id,
      role: 'tool',
      content: JSON.stringify({
        error: errorMessage,
        function: functionName,
      }),
    };
  }
}

/**
 * 여러 Tool Call 일괄 처리
 */
export function processToolCalls(toolCalls: ToolCall[]): ToolCallResult[] {
  return toolCalls.map(tc => processToolCall(tc));
}

/**
 * Tool Call 처리 후 AI 메시지 형식으로 변환
 * (다음 API 호출에 포함할 메시지들)
 */
export function formatToolResultsForAI(
  assistantMessage: { role: string; content: string | null; tool_calls: ToolCall[] },
  toolResults: ToolCallResult[]
): Array<{ role: string; content?: string; tool_calls?: ToolCall[] } | ToolCallResult> {
  // Deno/TS strict mode: content는 null이 아닌 string/undefined 여야 함
  const safeAssistantMessage: { role: string; content?: string; tool_calls?: ToolCall[] } = {
    role: assistantMessage.role,
    ...(assistantMessage.content != null ? { content: assistantMessage.content } : {}),
    ...(assistantMessage.tool_calls?.length ? { tool_calls: assistantMessage.tool_calls } : {}),
  };

  return [safeAssistantMessage, ...toolResults];
}

// ============================================================================
// Tool Use 유틸리티
// ============================================================================

/**
 * AI 응답에서 Tool Call이 있는지 확인
 */
export function hasToolCalls(response: { choices: Array<{ message: { tool_calls?: ToolCall[] } }> }): boolean {
  return !!(response.choices?.[0]?.message?.tool_calls?.length);
}

/**
 * AI 응답에서 Tool Call 추출
 */
export function extractToolCalls(response: { choices: Array<{ message: { tool_calls?: ToolCall[] } }> }): ToolCall[] {
  return response.choices?.[0]?.message?.tool_calls || [];
}

/**
 * Tool Use 활성화 여부 결정
 * (최적화 타입과 파라미터에 따라 결정)
 */
export function shouldEnableToolUse(
  optimizationType: string,
  parameters?: { enable_function_calling?: boolean }
): boolean {
  // 명시적으로 비활성화된 경우
  if (parameters?.enable_function_calling === false) {
    return false;
  }

  // staffing 타입은 별도 처리 (현재는 Tool Use 미사용)
  if (optimizationType === 'staffing') {
    return false;
  }

  // 기본적으로 활성화
  return true;
}

/**
 * Tool Use 관련 로깅
 */
export function logToolUsage(
  toolCalls: ToolCall[],
  results: ToolCallResult[],
  functionName: string
): void {
  console.log(`[${functionName}] Tool Use: ${toolCalls.length} call(s)`);

  toolCalls.forEach((tc, i) => {
    const result = results[i];
    const resultObj = JSON.parse(result.content);
    const hasError = 'error' in resultObj;

    console.log(`  [${i + 1}] ${tc.function.name}: ${hasError ? 'ERROR' : 'SUCCESS'}`);

    if (hasError) {
      console.warn(`      Error: ${resultObj.error}`);
    } else if (tc.function.name === 'calculate_traffic_flow') {
      console.log(`      → visitors=${resultObj.expected_visitors}, congestion=${resultObj.congestion_risk}`);
    } else if (tc.function.name === 'calculate_roi') {
      console.log(`      → ROI=${resultObj.roi_percent}%, profit=₩${resultObj.expected_profit?.toLocaleString()}`);
    } else if (tc.function.name === 'calculate_retail_roi') {
      const s = resultObj.summary;
      console.log(`      → ${s.verdict_kr}: ${s.one_liner}`);
      console.log(`      → 월 증분이익=₩${resultObj.profit?.incremental_monthly?.toLocaleString()}, 회수=${resultObj.roi?.payback_period_text}`);
    }
  });
}

// ============================================================================
// 최대 Tool Call 반복 횟수 및 설정
// ============================================================================

/** Tool Use 설정 */
export const TOOL_USE_CONFIG = {
  /** 최대 Tool Call 반복 횟수 */
  maxIterations: 5,
  /** Tool Use 활성화 여부 */
  enabled: true,
  /** 병렬 Tool Call 허용 여부 */
  allowParallel: true,
  /** Tool Call 결과 로깅 */
  logResults: true,
};

// ============================================================================
// Export
// ============================================================================

export default {
  CALCULATION_TOOLS,
  OPENROUTER_TOOLS,
  processToolCall,
  processToolCalls,
  formatToolResultsForAI,
  hasToolCalls,
  extractToolCalls,
  shouldEnableToolUse,
  logToolUsage,
  TOOL_USE_CONFIG,
};
