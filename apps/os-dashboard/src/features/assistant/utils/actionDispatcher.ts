/**
 * ActionDispatcher 유틸리티
 * React Hook 외부에서 사용 가능한 순수 함수들
 */

export interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

/**
 * 액션 유효성 검증
 */
export function validateAction(action: UIAction): boolean {
  if (!action || !action.type) {
    return false;
  }

  switch (action.type) {
    case 'navigate':
      return typeof action.target === 'string' && action.target.startsWith('/');

    case 'set_date_range':
      return (
        typeof action.preset === 'string' ||
        (typeof action.startDate === 'string' && typeof action.endDate === 'string')
      );

    case 'open_dialog':
      return typeof action.dialogId === 'string';

    case 'run_simulation':
    case 'run_optimization':
      return true; // Phase 3-C에서 상세 검증

    default:
      return false;
  }
}

/**
 * 액션 배열 필터링 (유효한 것만)
 */
export function filterValidActions(actions: UIAction[]): UIAction[] {
  return actions.filter(validateAction);
}
