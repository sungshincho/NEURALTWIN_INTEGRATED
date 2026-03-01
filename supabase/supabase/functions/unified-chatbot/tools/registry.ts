/**
 * Function Calling Tool Registry
 *
 * AI 모델이 호출할 수 있는 도구 정의.
 * 두 채널(Website/OS) 모두에서 사용 가능.
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

// ═══════════════════════════════════════════
//  차트 생성 도구
// ═══════════════════════════════════════════

const generateChartTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'generate_chart',
    description: '매장 데이터를 기반으로 차트를 생성합니다. 매출, 방문자, 체류시간 등 다양한 지표를 시각화할 수 있습니다.',
    parameters: {
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          enum: ['bar', 'line', 'pie', 'heatmap', 'area', 'scatter'],
          description: '차트 유형',
        },
        metric: {
          type: 'string',
          enum: ['revenue', 'visitors', 'dwell_time', 'conversion_rate', 'avg_transaction', 'zone_traffic'],
          description: '시각화할 지표',
        },
        groupBy: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'zone', 'category', 'product'],
          description: '그룹화 기준',
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', description: 'ISO 8601 시작 날짜' },
            end: { type: 'string', description: 'ISO 8601 종료 날짜' },
          },
        },
        title: {
          type: 'string',
          description: '차트 제목',
        },
      },
      required: ['chartType', 'metric'],
    },
  },
};

// ═══════════════════════════════════════════
//  시뮬레이션 실행 도구
// ═══════════════════════════════════════════

const runSimulationTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'run_simulation',
    description: '고객 동선 시뮬레이션을 실행합니다. 다양한 시나리오로 매장 레이아웃의 효과를 분석할 수 있습니다.',
    parameters: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          enum: ['current', 'optimized', 'rush_hour', 'weekend', 'promotion', 'custom'],
          description: '시뮬레이션 시나리오',
        },
        customerCount: {
          type: 'number',
          description: '시뮬레이션할 고객 수 (기본: 50)',
        },
        duration: {
          type: 'number',
          description: '시뮬레이션 시간(분) (기본: 60)',
        },
        storeId: {
          type: 'string',
          description: '대상 매장 ID',
        },
      },
      required: ['scenario'],
    },
  },
};

// ═══════════════════════════════════════════
//  도구 레지스트리
// ═══════════════════════════════════════════

/** 모든 채널에서 사용 가능한 도구 */
export const UNIFIED_TOOLS: ToolDefinition[] = [
  generateChartTool,
  runSimulationTool,
];

/** Website 채널 전용 도구 */
export const WEBSITE_TOOLS: ToolDefinition[] = [
  generateChartTool,
  // Website에서는 시뮬레이션 불가 (OS 전용)
];

/** OS 채널 전용 도구 */
export const OS_TOOLS: ToolDefinition[] = [
  generateChartTool,
  runSimulationTool,
];

/** 도구 이름으로 조회 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return UNIFIED_TOOLS.find(t => t.function.name === name);
}
