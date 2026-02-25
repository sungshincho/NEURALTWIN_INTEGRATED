/**
 * screenDataStore.ts
 *
 * 현재 화면에 표시 중인 데이터를 전역으로 공유하는 Zustand 스토어
 *
 * 목적:
 * - 프론트엔드에서 이미 계산된 지표를 챗봇(neuraltwin-assistant)이
 *   DB를 직접 조회하지 않고 그대로 텍스트로 전달할 수 있게 함
 * - 프론트엔드 계산 로직 수정 시 챗봇 응답에 자동 반영
 */

import { create } from 'zustand';

// 개요탭 KPI 카드 데이터 (프론트엔드 표시값 그대로)
export interface OverviewKPIs {
  footfall: number;           // 총 입장
  uniqueVisitors: number;     // 순 방문객
  revenue: number;            // 총 매출
  conversionRate: number;     // 구매 전환율 (%)
  transactions: number;       // 거래 건수
  atv: number;                // 객단가
  visitFrequency: number;     // 방문 빈도
}

// 고객 여정 퍼널 데이터 (5단계)
export interface FunnelStages {
  entry: number;
  browse: number;
  engage: number;
  fitting: number;
  purchase: number;
}

// 매장탭 KPI & 상세 데이터 (프론트엔드 표시값 그대로)
export interface StoreKPIs {
  peakHour: number;              // 피크타임 시간 (0-23)
  peakVisitors: number;          // 피크타임 방문객 수
  popularZone: string;           // 인기 존 이름
  popularZoneVisitors: number;   // 인기 존 방문객 수
  avgDwellMinutes: number;       // 평균 체류시간 (분)
  trackingCoverage: number;      // 센서 커버율 (%)
  hourlyPattern: { hour: number; visitors: number }[];  // 시간대별 방문 패턴 (24개)
  zones: {
    name: string;
    visitors: number;
    avgDwellMinutes: number;
    conversionRate: string;      // "X.X%" 형태
  }[];
}

// 화면 데이터 전체 구조
export interface ScreenData {
  overviewKPIs: OverviewKPIs | null;
  funnel: FunnelStages | null;
  storeKPIs: StoreKPIs | null;
  // screenData가 생성된 시점의 날짜 범위 (stale 데이터 방지)
  dateRange: { startDate: string; endDate: string } | null;
}

interface ScreenDataState {
  screenData: ScreenData;
  setOverviewData: (kpis: OverviewKPIs, funnel: FunnelStages, dateRange: { startDate: string; endDate: string }) => void;
  setStoreData: (store: StoreKPIs, dateRange: { startDate: string; endDate: string }) => void;
  clearScreenData: () => void;
}

const INITIAL_SCREEN_DATA: ScreenData = {
  overviewKPIs: null,
  funnel: null,
  storeKPIs: null,
  dateRange: null,
};

export const useScreenDataStore = create<ScreenDataState>((set) => ({
  screenData: INITIAL_SCREEN_DATA,

  setOverviewData: (kpis, funnel, dateRange) =>
    set((state) => ({
      screenData: {
        ...state.screenData,
        overviewKPIs: kpis,
        funnel,
        dateRange,
      },
    })),

  setStoreData: (store, dateRange) =>
    set((state) => ({
      screenData: {
        ...state.screenData,
        storeKPIs: store,
        dateRange,
      },
    })),

  clearScreenData: () =>
    set({ screenData: INITIAL_SCREEN_DATA }),
}));
