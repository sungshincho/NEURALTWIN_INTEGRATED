/**
 * dateFilterStore.ts
 *
 * 전역 날짜 필터 상태 관리
 * - 모든 페이지에서 동일한 기간 필터 사용
 * - LocalStorage에 persist
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PresetPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  preset: PresetPeriod;
  startDate: string;
  endDate: string;
}

interface DateFilterState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: PresetPeriod) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
  getDays: () => number;
}

const calculateDates = (preset: PresetPeriod): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'today':
      break;
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const calculateDaysDiff = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const useDateFilterStore = create<DateFilterState>()(
  persist(
    (set, get) => ({
      dateRange: {
        preset: '7d',
        ...calculateDates('7d'),
      },
      setDateRange: (range) => set({ dateRange: range }),
      setPreset: (preset) =>
        set({
          dateRange: {
            preset,
            ...calculateDates(preset),
          },
        }),
      setCustomRange: (startDate, endDate) =>
        set({
          dateRange: {
            preset: 'custom',
            startDate,
            endDate,
          },
        }),
      getDays: () => {
        const { dateRange } = get();
        switch (dateRange.preset) {
          case 'today':
            return 1;
          case '7d':
            return 7;
          case '30d':
            return 30;
          case '90d':
            return 90;
          case 'custom':
            return calculateDaysDiff(dateRange.startDate, dateRange.endDate);
          default:
            return 7;
        }
      },
    }),
    {
      name: 'neuraltwin-date-filter',
    }
  )
);

// 프리셋 라벨
export const PRESET_LABELS: Record<PresetPeriod, string> = {
  today: '오늘',
  '7d': '7일',
  '30d': '30일',
  '90d': '90일',
  custom: '직접 설정',
};
