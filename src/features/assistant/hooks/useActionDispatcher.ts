/**
 * UIAction 실행 훅
 * 백엔드에서 반환된 모든 액션 타입을 처리
 */

import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDateFilterStore, type PresetPeriod } from '@/store/dateFilterStore';

// 확장된 UIAction 타입 정의
export interface UIAction {
  type:
    | 'navigate'
    | 'set_tab'
    | 'set_date_range'
    | 'scroll_to_section'
    | 'open_modal'
    | 'open_dialog'
    | 'highlight_element'
    | 'show_tooltip'
    | 'run_simulation'
    | 'run_optimization'
    | 'set_filter'
    | 'trigger_export'
    | 'set_table_page'
    // 스튜디오 제어
    | 'toggle_overlay'
    | 'simulation_control'
    | 'apply_preset'
    | 'set_simulation_params'
    | 'set_optimization_config'
    | 'set_view_mode'
    | 'toggle_panel'
    | 'save_scene'
    | 'set_environment';
  target?: string | { startDate: string; endDate: string };
  preset?: PresetPeriod;
  startDate?: string;
  endDate?: string;
  sectionId?: string;
  modalId?: string;
  dialogId?: string;
  elementId?: string;
  highlight?: boolean;
  highlightDuration?: number;
  duration?: number;
  message?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  params?: Record<string, any>;
  filterId?: string;
  value?: string;
  exportType?: string;
  page?: number | 'next' | 'prev';
  [key: string]: any;
}

export function useActionDispatcher() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setPreset, setCustomRange } = useDateFilterStore();

  /**
   * 섹션으로 스크롤 및 하이라이트
   */
  const scrollToSection = useCallback((sectionId: string, highlight?: boolean, duration?: number) => {
    const element = document.getElementById(sectionId) ||
                   document.querySelector(`[data-section="${sectionId}"]`);

    if (element) {
      // 스크롤
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 하이라이트 효과
      if (highlight) {
        element.classList.add('assistant-highlight');
        setTimeout(() => {
          element.classList.remove('assistant-highlight');
        }, duration || 2000);
      }
    } else {
      console.warn('[ActionDispatcher] Section not found:', sectionId);
    }
  }, []);

  /**
   * 모달/다이얼로그 열기
   */
  const openModal = useCallback((modalId: string, params?: Record<string, any>) => {
    // 커스텀 이벤트로 모달 열기 요청
    const event = new CustomEvent('assistant:open-modal', {
      detail: { modalId, params },
    });
    window.dispatchEvent(event);
    console.log('[ActionDispatcher] open_modal:', modalId, params);
  }, []);

  /**
   * 요소 하이라이트
   */
  const highlightElement = useCallback((elementId: string, duration?: number) => {
    const element = document.getElementById(elementId) ||
                   document.querySelector(`[data-element="${elementId}"]`);

    if (element) {
      element.classList.add('assistant-highlight');
      setTimeout(() => {
        element.classList.remove('assistant-highlight');
      }, duration || 2000);
    } else {
      console.warn('[ActionDispatcher] Element not found:', elementId);
    }
  }, []);

  /**
   * 툴팁 표시
   */
  const showTooltip = useCallback((targetId: string, message: string, position?: string) => {
    const event = new CustomEvent('assistant:show-tooltip', {
      detail: { targetId, message, position },
    });
    window.dispatchEvent(event);
    console.log('[ActionDispatcher] show_tooltip:', targetId, message);
  }, []);

  /**
   * 단일 액션 실행
   */
  const dispatchAction = useCallback(async (action: UIAction): Promise<void> => {
    console.log('[ActionDispatcher] Dispatching action:', action.type, action);

    switch (action.type) {
      case 'navigate':
        // 페이지 이동 (탭 파라미터 포함 가능)
        if (typeof action.target === 'string') {
          navigate(action.target);
        }
        break;

      case 'set_tab':
        // 탭 전환 (URL 쿼리 파라미터로)
        if (typeof action.target === 'string') {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('tab', action.target);
          setSearchParams(newParams);
        }
        break;

      case 'set_date_range':
        // 날짜 필터 변경 - 여러 형식 지원
        if (action.preset) {
          setPreset(action.preset as PresetPeriod);
        } else if (action.startDate && action.endDate) {
          setCustomRange(action.startDate, action.endDate);
        } else if (typeof action.target === 'object' && action.target.startDate && action.target.endDate) {
          setCustomRange(action.target.startDate, action.target.endDate);
        }
        // 페이지별 로컬 날짜 필터 동기화 이벤트
        window.dispatchEvent(new CustomEvent('assistant:set-date-range', {
          detail: { preset: action.preset, startDate: action.startDate, endDate: action.endDate },
        }));
        break;

      case 'scroll_to_section':
        // 섹션으로 스크롤
        if (action.sectionId) {
          // 약간의 딜레이 후 스크롤 (페이지 렌더링 대기)
          setTimeout(() => {
            scrollToSection(action.sectionId!, action.highlight, action.highlightDuration);
          }, 300);
        }
        break;

      case 'open_modal':
      case 'open_dialog':
        // 모달/다이얼로그 열기
        const modalOrDialogId = action.modalId || action.dialogId;
        if (modalOrDialogId) {
          openModal(modalOrDialogId, action.params);
        }
        break;

      case 'highlight_element':
        // 요소 하이라이트
        if (action.elementId) {
          highlightElement(action.elementId, action.duration);
        }
        break;

      case 'show_tooltip':
        // 툴팁 표시
        if (action.elementId && action.message) {
          showTooltip(action.elementId, action.message, action.position);
        }
        break;

      case 'run_simulation':
        // 시뮬레이션 실행 - 커스텀 이벤트
        const simEvent = new CustomEvent('assistant:run-simulation', {
          detail: action,
        });
        window.dispatchEvent(simEvent);
        console.log('[ActionDispatcher] run_simulation:', action);
        break;

      case 'run_optimization':
        // 최적화 실행 - 커스텀 이벤트
        const optEvent = new CustomEvent('assistant:run-optimization', {
          detail: action,
        });
        window.dispatchEvent(optEvent);
        console.log('[ActionDispatcher] run_optimization:', action);
        break;

      case 'set_filter':
        // 테이블 필터 변경 - 커스텀 이벤트
        window.dispatchEvent(new CustomEvent('assistant:set-filter', {
          detail: { filterId: action.filterId, value: action.value },
        }));
        console.log('[ActionDispatcher] set_filter:', action.filterId, action.value);
        break;

      case 'trigger_export':
        // 내보내기 트리거 - 커스텀 이벤트
        window.dispatchEvent(new CustomEvent('assistant:trigger-export', {
          detail: { exportType: action.exportType },
        }));
        console.log('[ActionDispatcher] trigger_export:', action.exportType);
        break;

      case 'set_table_page':
        // 테이블 페이지 이동 - 커스텀 이벤트
        window.dispatchEvent(new CustomEvent('assistant:set-table-page', {
          detail: { page: action.page },
        }));
        console.log('[ActionDispatcher] set_table_page:', action.page);
        break;

      // ============================================
      // 디지털트윈 스튜디오 제어 액션
      // ============================================

      case 'toggle_overlay':
        window.dispatchEvent(new CustomEvent('assistant:toggle-overlay', {
          detail: { overlay: action.overlay, visible: action.visible },
        }));
        console.log('[ActionDispatcher] toggle_overlay:', action.overlay, action.visible);
        break;

      case 'simulation_control':
        window.dispatchEvent(new CustomEvent('assistant:simulation-control', {
          detail: { command: action.command, speed: action.speed },
        }));
        console.log('[ActionDispatcher] simulation_control:', action.command, action.speed);
        break;

      case 'apply_preset':
        window.dispatchEvent(new CustomEvent('assistant:apply-preset', {
          detail: { preset: action.preset },
        }));
        console.log('[ActionDispatcher] apply_preset:', action.preset);
        break;

      case 'set_simulation_params':
        window.dispatchEvent(new CustomEvent('assistant:set-simulation-params', {
          detail: action.params || action,
        }));
        console.log('[ActionDispatcher] set_simulation_params:', action.params);
        break;

      case 'set_optimization_config':
        window.dispatchEvent(new CustomEvent('assistant:set-optimization-config', {
          detail: action.config || action,
        }));
        console.log('[ActionDispatcher] set_optimization_config:', action.config);
        break;

      case 'set_view_mode':
        window.dispatchEvent(new CustomEvent('assistant:set-view-mode', {
          detail: { mode: action.mode },
        }));
        console.log('[ActionDispatcher] set_view_mode:', action.mode);
        break;

      case 'toggle_panel':
        window.dispatchEvent(new CustomEvent('assistant:toggle-panel', {
          detail: { panel: action.panel, visible: action.visible },
        }));
        console.log('[ActionDispatcher] toggle_panel:', action.panel, action.visible);
        break;

      case 'save_scene':
        window.dispatchEvent(new CustomEvent('assistant:save-scene', {
          detail: { name: action.name },
        }));
        console.log('[ActionDispatcher] save_scene:', action.name);
        break;

      case 'set_environment':
        window.dispatchEvent(new CustomEvent('assistant:set-environment', {
          detail: { weather: action.weather, timeOfDay: action.timeOfDay, holidayType: action.holidayType },
        }));
        console.log('[ActionDispatcher] set_environment:', action.weather, action.timeOfDay, action.holidayType);
        break;

      default:
        console.warn('[ActionDispatcher] Unknown action type:', action.type);
    }
  }, [navigate, searchParams, setSearchParams, setPreset, setCustomRange, scrollToSection, openModal, highlightElement, showTooltip]);

  /**
   * 여러 액션 순차 실행
   */
  const dispatchActions = useCallback(async (actions: UIAction[]): Promise<void> => {
    for (const action of actions) {
      await dispatchAction(action);
      // 액션 간 딜레이 (애니메이션/렌더링 대기)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }, [dispatchAction]);

  return { dispatchAction, dispatchActions };
}
