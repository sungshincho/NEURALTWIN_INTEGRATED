/**
 * Feature Flags for Tier 1/2/3 Progressive Enhancement
 * 
 * 개발 완료 시 해당 Tier의 flag를 true로 변경하여 기능 활성화
 */

export interface FeatureFlagConfig {
  enabled: boolean;
  tier: 1 | 2 | 3;
  requiredData?: string[];
  requiredAPI?: string[];
}

export const FEATURE_FLAGS = {
  // ==========================================
  // 🟢 TIER 1: Minimum Data (현재 데이터로 즉시 구현 가능)
  // ==========================================
  tier1: {
    // Dashboard
    salesSummary: { enabled: true, tier: 1 } as FeatureFlagConfig,
    realtimeVisitors: { enabled: true, tier: 1 } as FeatureFlagConfig,
    topProducts: { enabled: true, tier: 1 } as FeatureFlagConfig,
    customerSegmentDistribution: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Store Analysis
    trafficHeatmap: { enabled: true, tier: 1 } as FeatureFlagConfig,
    conversionFunnel: { enabled: true, tier: 1 } as FeatureFlagConfig,
    zoneDwellTime: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Customer Analysis
    customerSegmentation: { enabled: true, tier: 1 } as FeatureFlagConfig,
    purchasePatterns: { enabled: true, tier: 1 } as FeatureFlagConfig,
    ltvDistribution: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Product Analysis
    productPerformance: { enabled: true, tier: 1 } as FeatureFlagConfig,
    inventoryTurnover: { enabled: true, tier: 1 } as FeatureFlagConfig,
    stockoutRisk: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Digital Twin 3D
    basic3DViewer: { enabled: true, tier: 1 } as FeatureFlagConfig,
    realtimeAvatars: { enabled: true, tier: 1 } as FeatureFlagConfig,
    heatmapOverlay: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Data Management
    simplifiedUpload: { enabled: true, tier: 1 } as FeatureFlagConfig,
    aiAutoMapping: { enabled: true, tier: 1 } as FeatureFlagConfig,
    sampleDataGeneration: { enabled: true, tier: 1 } as FeatureFlagConfig,
    dataQualityScore: { enabled: true, tier: 1 } as FeatureFlagConfig,

    // Reports
    basicReports: { enabled: true, tier: 1 } as FeatureFlagConfig,
  },

  // ==========================================
  // 🟡 TIER 2: Basic Data + External APIs
  // ==========================================
  tier2: {
    // Dashboard
    weatherSalesCorrelation: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['Weather API'],
    } as FeatureFlagConfig,
    competitorPerformance: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['CRM API'],
    } as FeatureFlagConfig,

    // Store Analysis
    weatherImpact: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['Weather API'],
    } as FeatureFlagConfig,
    eventImpact: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['Event Data API'],
    } as FeatureFlagConfig,

    // Product Analysis
    realtimeInventory: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['POS API'],
    } as FeatureFlagConfig,
    autoReorderSuggestions: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['POS API', 'Supply Chain API'],
    } as FeatureFlagConfig,

    // Data Management
    externalAPIIntegration: { 
      enabled: false, 
      tier: 2,
      requiredAPI: ['POS API', 'CRM API', 'Weather API'],
    } as FeatureFlagConfig,
    autoSyncScheduling: { enabled: false, tier: 2 } as FeatureFlagConfig,
  },

  // ==========================================
  // 🔴 TIER 3: Advanced AI Inference
  // ==========================================
  tier3: {
    // Dashboard
    aiSalesForecast: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    anomalyDetection: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,

    // Customer Analysis
    customerJourneyPrediction: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    churnRiskPrediction: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    personalizedRecommendations: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,

    // Digital Twin 3D
    aiLayoutOptimization: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    displayEfficiencyScore: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    abTestSimulation: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,

    // Data Management
    aiDataImputation: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
      requiredData: ['age', 'gender', 'category'],
    } as FeatureFlagConfig,
    autoProductCategorization: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    missingFieldInference: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,

    // Forecasting
    salesForecast7d: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    demandForecast: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    visitorForecast: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,

    // Ontology Graph
    aiRelationInference: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
    autoGraphDiscovery: { 
      enabled: false, 
      tier: 3,
      requiredAPI: ['Lovable AI'],
    } as FeatureFlagConfig,
  },
} as const;

/**
 * Helper: 특정 Tier의 모든 기능이 활성화되었는지 확인
 */
export function isTierComplete(tier: 1 | 2 | 3): boolean {
  const tierKey = `tier${tier}` as keyof typeof FEATURE_FLAGS;
  const features = FEATURE_FLAGS[tierKey];
  return Object.values(features).every((config) => config.enabled);
}

/**
 * Helper: 특정 기능이 활성화되었는지 확인
 */
export function isFeatureEnabled(tier: 1 | 2 | 3, featureName: string): boolean {
  const tierKey = `tier${tier}` as keyof typeof FEATURE_FLAGS;
  const features = FEATURE_FLAGS[tierKey] as Record<string, FeatureFlagConfig>;
  return features[featureName]?.enabled ?? false;
}

/**
 * Helper: 활성화된 모든 기능 목록
 */
export function getEnabledFeatures(): string[] {
  const enabled: string[] = [];
  
  Object.entries(FEATURE_FLAGS).forEach(([tierKey, features]) => {
    Object.entries(features).forEach(([featureName, config]) => {
      if (config.enabled) {
        enabled.push(`${tierKey}.${featureName}`);
      }
    });
  });
  
  return enabled;
}

/**
 * Helper: Tier별 진행률 계산
 */
export function getTierProgress(tier: 1 | 2 | 3): number {
  const tierKey = `tier${tier}` as keyof typeof FEATURE_FLAGS;
  const features = Object.values(FEATURE_FLAGS[tierKey]);
  const enabled = features.filter((config) => config.enabled).length;
  return Math.round((enabled / features.length) * 100);
}
