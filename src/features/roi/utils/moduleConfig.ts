/**
 * 모듈별 설정 (아이콘, 이름 등)
 */

import type { SourceModule, SimulationSource } from '../types/roi.types';

interface ModuleConfig {
  displayName: string;
  shortName: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const MODULE_CONFIG: Record<SourceModule, ModuleConfig> = {
  // 2D 시뮬레이션
  price_optimization: {
    displayName: '가격 최적화',
    shortName: '가격',
    icon: '💰',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
  inventory_optimization: {
    displayName: '재고 최적화',
    shortName: '재고',
    icon: '📦',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  promotion: {
    displayName: '프로모션',
    shortName: '프로모',
    icon: '🎁',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/30',
  },
  promotion_optimization: {
    displayName: '프로모션 최적화',
    shortName: '프로모 최적화',
    icon: '🎯',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30',
  },
  demand_forecast: {
    displayName: '수요 예측',
    shortName: '수요',
    icon: '📈',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  ai_recommendation: {
    displayName: 'AI 추천 전략',
    shortName: 'AI 추천',
    icon: '🤖',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
  },

  // 3D 시뮬레이션
  layout_optimization: {
    displayName: '레이아웃 최적화',
    shortName: '레이아웃',
    icon: '🏗️',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  flow_optimization: {
    displayName: '동선 최적화',
    shortName: '동선',
    icon: '🚶',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
  },
  congestion_simulation: {
    displayName: '혼잡도 시뮬레이션',
    shortName: '혼잡도',
    icon: '👥',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
  },
  staffing_optimization: {
    displayName: '인력 배치 최적화',
    shortName: '인력',
    icon: '👔',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
  },
};

export const SOURCE_CONFIG: Record<SimulationSource, { displayName: string; description: string }> = {
  '2d_simulation': {
    displayName: '2D 시뮬레이션 (인사이트 허브)',
    description: '데이터 기반 분석 및 최적화',
  },
  '3d_simulation': {
    displayName: '3D 시뮬레이션 (디지털트윈 스튜디오)',
    description: '공간 기반 시뮬레이션',
  },
};

const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  displayName: '기타',
  shortName: '기타',
  icon: '📊',
  color: 'text-gray-400',
  bgColor: 'bg-gray-500/20',
  borderColor: 'border-gray-500/30',
};

export const getModuleConfig = (module: SourceModule | string | undefined | null): ModuleConfig => {
  if (!module || !(module in MODULE_CONFIG)) {
    return DEFAULT_MODULE_CONFIG;
  }
  return MODULE_CONFIG[module as SourceModule];
};

export const getModuleIcon = (module: SourceModule | string | undefined | null): string => {
  if (!module || !(module in MODULE_CONFIG)) {
    return '📊';
  }
  return MODULE_CONFIG[module as SourceModule].icon;
};

export const getModuleDisplayName = (module: SourceModule): string => {
  return MODULE_CONFIG[module]?.displayName || module;
};

export const getModuleShortName = (module: SourceModule): string => {
  return MODULE_CONFIG[module]?.shortName || module;
};

export const getSourceDisplayName = (source: SimulationSource): string => {
  return SOURCE_CONFIG[source]?.displayName || source;
};

// 상태별 설정
export const STATUS_CONFIG = {
  active: {
    label: '진행 중',
    icon: '🔄',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  completed: {
    label: '완료',
    icon: '✅',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  cancelled: {
    label: '취소됨',
    icon: '❌',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
};

// 결과별 설정
export const RESULT_CONFIG = {
  success: {
    label: '성공',
    icon: '✅',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  partial: {
    label: '부분 달성',
    icon: '⚠️',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  failed: {
    label: '미달성',
    icon: '📉',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
};

// 트렌드 아이콘
export const TREND_ICONS = {
  up: '📈',
  down: '📉',
  stable: '➡️',
};
