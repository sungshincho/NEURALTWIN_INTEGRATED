/**
 * useAIInsightStore.ts
 *
 * AI Insight 패널 전역 상태 관리 (Zustand)
 * - 프로액티브 AI 인사이트 (이상 탐지, 모닝 다이제스트, 제안 등)
 * - 패널 열림/닫힘 + 읽지 않은 개수 추적
 * - 라우트 변경 시에도 인사이트 유지
 */

import { create } from 'zustand';

// ============== Type Definitions ==============

export type InsightType = 'anomaly' | 'digest' | 'suggestion' | 'response';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface InsightAction {
  label: string;
  url?: string;
  action?: string;
}

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  severity?: InsightSeverity;
  actions?: InsightAction[];
  timestamp: number;
  read: boolean;
}

interface AIInsightState {
  /** 패널 열림 상태 */
  isOpen: boolean;
  /** 인사이트 목록 */
  insights: AIInsight[];
  /** 읽지 않은 인사이트 수 */
  unreadCount: number;

  /** 패널 토글 */
  togglePanel: () => void;
  /** 패널 열기 */
  openPanel: () => void;
  /** 패널 닫기 */
  closePanel: () => void;

  /** 새 인사이트 추가 (id, timestamp, read는 자동 생성) */
  addInsight: (insight: Omit<AIInsight, 'id' | 'timestamp' | 'read'>) => void;
  /** 특정 인사이트 읽음 처리 */
  markAsRead: (id: string) => void;
  /** 모든 인사이트 읽음 처리 */
  markAllRead: () => void;
  /** 특정 인사이트 삭제 */
  removeInsight: (id: string) => void;
  /** 모든 인사이트 삭제 */
  clearInsights: () => void;
}

// ============== Helper ==============

let insightCounter = 0;

function generateInsightId(): string {
  insightCounter += 1;
  return `insight-${Date.now()}-${insightCounter}`;
}

function computeUnreadCount(insights: AIInsight[]): number {
  return insights.filter((i) => !i.read).length;
}

// ============== Store ==============

export const useAIInsightStore = create<AIInsightState>()((set) => ({
  // 초기 상태
  isOpen: false,
  insights: [],
  unreadCount: 0,

  // 패널 상태 액션
  togglePanel: () =>
    set((state) => {
      const nextOpen = !state.isOpen;
      // 패널을 열면 모든 인사이트를 읽음 처리
      if (nextOpen) {
        const updatedInsights = state.insights.map((i) => ({ ...i, read: true }));
        return { isOpen: true, insights: updatedInsights, unreadCount: 0 };
      }
      return { isOpen: false };
    }),

  openPanel: () =>
    set((state) => {
      const updatedInsights = state.insights.map((i) => ({ ...i, read: true }));
      return { isOpen: true, insights: updatedInsights, unreadCount: 0 };
    }),

  closePanel: () => set({ isOpen: false }),

  // 인사이트 관리 액션
  addInsight: (insight) =>
    set((state) => {
      const newInsight: AIInsight = {
        ...insight,
        id: generateInsightId(),
        timestamp: Date.now(),
        read: state.isOpen, // 패널이 열려있으면 바로 읽음 처리
      };
      const updatedInsights = [newInsight, ...state.insights];
      return {
        insights: updatedInsights,
        unreadCount: computeUnreadCount(updatedInsights),
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updatedInsights = state.insights.map((i) =>
        i.id === id ? { ...i, read: true } : i
      );
      return {
        insights: updatedInsights,
        unreadCount: computeUnreadCount(updatedInsights),
      };
    }),

  markAllRead: () =>
    set((state) => ({
      insights: state.insights.map((i) => ({ ...i, read: true })),
      unreadCount: 0,
    })),

  removeInsight: (id) =>
    set((state) => {
      const updatedInsights = state.insights.filter((i) => i.id !== id);
      return {
        insights: updatedInsights,
        unreadCount: computeUnreadCount(updatedInsights),
      };
    }),

  clearInsights: () =>
    set({ insights: [], unreadCount: 0 }),
}));
