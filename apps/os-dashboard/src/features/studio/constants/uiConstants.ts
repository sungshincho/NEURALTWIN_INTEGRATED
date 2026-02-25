/**
 * uiConstants.ts
 *
 * 디지털트윈 스튜디오 UI 상수
 * - 심각도 색상
 * - As-Is / To-Be 색상
 * - 오버레이 색상
 * - 아이콘 매핑
 */

// ============================================================================
// 심각도 색상 시스템
// ============================================================================
export const SEVERITY_COLORS = {
  critical: {
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    solid: 'bg-red-500',
  },
  warning: {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    solid: 'bg-yellow-500',
  },
  info: {
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    solid: 'bg-blue-500',
  },
  success: {
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    solid: 'bg-green-500',
  },
} as const;

export type SeverityLevel = keyof typeof SEVERITY_COLORS;

// ============================================================================
// As-Is / To-Be 뷰 모드 색상
// ============================================================================
export const VIEW_MODE_COLORS: Record<string, {
  text: string;
  bg: string;
  border: string;
  solid: string;
  gradient: string;
}> = {
  'as-is': {
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    solid: 'bg-blue-500',
    gradient: 'from-blue-600 to-blue-700',
  },
  'to-be': {
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    solid: 'bg-green-500',
    gradient: 'from-green-600 to-emerald-600',
  },
  split: {
    text: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    solid: 'bg-purple-500',
    gradient: 'from-purple-600 to-purple-700',
  },
};

export type ViewModeType = keyof typeof VIEW_MODE_COLORS;

// ============================================================================
// 오버레이 색상
// ============================================================================
export const OVERLAY_COLORS = {
  heatmap: { text: 'text-orange-500', icon: '🔥' },
  flow: { text: 'text-cyan-500', icon: '🚶' },
  zone: { text: 'text-purple-500', icon: '📍' },
  avatar: { text: 'text-green-500', icon: '👥' },
  staff: { text: 'text-blue-500', icon: '👤' },
} as const;

export type OverlayColorType = keyof typeof OVERLAY_COLORS;

// ============================================================================
// 최적화 유형 색상
// ============================================================================
export const OPTIMIZATION_COLORS = {
  layout: {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    solid: 'bg-yellow-500',
  },
  flow: {
    text: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    solid: 'bg-cyan-500',
  },
  staffing: {
    text: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    solid: 'bg-purple-500',
  },
  congestion: {
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    solid: 'bg-red-500',
  },
} as const;

export type OptimizationType = keyof typeof OPTIMIZATION_COLORS;

// ============================================================================
// 패널 크기 상수
// ============================================================================
export const PANEL_DIMENSIONS = {
  minWidth: 280,
  maxWidth: 500,
  defaultWidth: 320,
  collapsedWidth: 40,
} as const;

// ============================================================================
// 애니메이션 지속 시간 (ms)
// ============================================================================
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

// ============================================================================
// 키보드 단축키
// ============================================================================
export const KEYBOARD_SHORTCUTS = {
  toggleTab1: '1', // 레이어
  toggleTab2: '2', // AI 시뮬레이션
  toggleTab3: '3', // AI 최적화
  toggleTab4: '4', // 적용하기
  toggleHeatmap: 'h',
  toggleFlow: 'f',
  toggleZone: 'z',
  toggleAvatar: 'a',
  playPause: 'space',
  escape: 'Escape',
} as const;

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 심각도에 따른 클래스 조합 반환
 */
export function getSeverityClasses(
  severity: SeverityLevel,
  options: { withBorder?: boolean } = {}
): string {
  const colors = SEVERITY_COLORS[severity];
  const classes: string[] = [colors.text, colors.bg];
  if (options.withBorder) {
    classes.push(colors.border, 'border');
  }
  return classes.join(' ');
}

/**
 * 뷰 모드에 따른 클래스 조합 반환
 */
export function getViewModeClasses(
  mode: ViewModeType,
  options: { withBorder?: boolean; gradient?: boolean } = {}
): string {
  const colors = VIEW_MODE_COLORS[mode];
  if (options.gradient) {
    return `bg-gradient-to-r ${colors.gradient}`;
  }
  const classes: string[] = [colors.text, colors.bg];
  if (options.withBorder) {
    classes.push(colors.border, 'border');
  }
  return classes.join(' ');
}
