/**
 * useTimeTravelStore.ts
 *
 * 시간 여행 (Time Travel) 상태 관리 Zustand 스토어
 * - 24시간 타임라인 스크러버 제어
 * - 재생/일시정지/탐색/속도 조절
 * - 3D 디지털트윈 스튜디오와 연동
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// 타입 정의
// ============================================================================

export type PlaybackSpeed = 1 | 2 | 4 | 8;

/** 시간대별 활동 강도 (히트맵 오버레이용) */
export interface HourlyActivity {
  hour: number;       // 0~23
  intensity: number;  // 0~1
}

interface TimeTravelState {
  /** Time Travel 모드 활성화 여부 */
  isEnabled: boolean;

  /** 현재 재생 시각 */
  currentTime: Date;

  /** 재생 속도 (1x, 2x, 4x, 8x) */
  playbackSpeed: PlaybackSpeed;

  /** 재생 중 여부 */
  isPlaying: boolean;

  /** 타임라인 시작 (오늘 00:00) */
  startTime: Date;

  /** 타임라인 끝 (오늘 23:59) */
  endTime: Date;

  /** 프레임 간격 (밀리초, 기본 15분 = 900000ms) */
  frameInterval: number;

  /** 시간대별 활동 강도 (히트맵용) */
  hourlyActivity: HourlyActivity[];
}

interface TimeTravelActions {
  /** Time Travel 모드 활성화 */
  enable: () => void;

  /** Time Travel 모드 비활성화 */
  disable: () => void;

  /** Time Travel 모드 토글 */
  toggle: () => void;

  /** 재생 시작 */
  play: () => void;

  /** 일시정지 */
  pause: () => void;

  /** 특정 시각으로 이동 */
  seekTo: (time: Date) => void;

  /** 타임라인 진행률로 이동 (0~1) */
  seekToProgress: (progress: number) => void;

  /** 재생 속도 변경 */
  setSpeed: (speed: PlaybackSpeed) => void;

  /** 다음 프레임 (+15분) */
  nextFrame: () => void;

  /** 이전 프레임 (-15분) */
  prevFrame: () => void;

  /** 현재 시간을 1틱만큼 전진 (playback loop에서 호출) */
  tick: () => void;

  /** 시간대별 활동 데이터 설정 */
  setHourlyActivity: (activity: HourlyActivity[]) => void;

  /** 현재 시각의 진행률 (0~1) 반환 */
  getProgress: () => number;

  /** 현재 시각을 HH:MM 형식으로 반환 */
  getFormattedTime: () => string;
}

export type TimeTravelStore = TimeTravelState & TimeTravelActions;

// ============================================================================
// 헬퍼 함수
// ============================================================================

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTodayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/** 기본 시간대별 활동 데이터 (리테일 매장 패턴) */
function getDefaultHourlyActivity(): HourlyActivity[] {
  return [
    { hour: 0, intensity: 0.0 },
    { hour: 1, intensity: 0.0 },
    { hour: 2, intensity: 0.0 },
    { hour: 3, intensity: 0.0 },
    { hour: 4, intensity: 0.0 },
    { hour: 5, intensity: 0.02 },
    { hour: 6, intensity: 0.05 },
    { hour: 7, intensity: 0.08 },
    { hour: 8, intensity: 0.15 },
    { hour: 9, intensity: 0.25 },
    { hour: 10, intensity: 0.45 },
    { hour: 11, intensity: 0.6 },
    { hour: 12, intensity: 0.75 },
    { hour: 13, intensity: 0.8 },
    { hour: 14, intensity: 0.9 },
    { hour: 15, intensity: 1.0 },
    { hour: 16, intensity: 0.85 },
    { hour: 17, intensity: 0.7 },
    { hour: 18, intensity: 0.6 },
    { hour: 19, intensity: 0.5 },
    { hour: 20, intensity: 0.35 },
    { hour: 21, intensity: 0.2 },
    { hour: 22, intensity: 0.08 },
    { hour: 23, intensity: 0.02 },
  ];
}

/** 시간을 startTime~endTime 범위로 클램핑 */
function clampTime(time: Date, start: Date, end: Date): Date {
  const t = time.getTime();
  const s = start.getTime();
  const e = end.getTime();
  if (t < s) return new Date(s);
  if (t > e) return new Date(e);
  return time;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useTimeTravelStore = create<TimeTravelStore>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    isEnabled: false,
    currentTime: getTodayStart(),
    playbackSpeed: 1,
    isPlaying: false,
    startTime: getTodayStart(),
    endTime: getTodayEnd(),
    frameInterval: 900_000, // 15분 = 900,000ms
    hourlyActivity: getDefaultHourlyActivity(),

    // =========================================================================
    // 모드 제어
    // =========================================================================
    enable: () => {
      const start = getTodayStart();
      const end = getTodayEnd();
      set({
        isEnabled: true,
        isPlaying: false,
        currentTime: start,
        startTime: start,
        endTime: end,
        playbackSpeed: 1,
      });
      // 3D 씬에 Time Travel 활성화 이벤트 전파
      window.dispatchEvent(
        new CustomEvent('timetravel:enabled', {
          detail: { currentTime: start },
        })
      );
    },

    disable: () => {
      set({
        isEnabled: false,
        isPlaying: false,
      });
      window.dispatchEvent(new CustomEvent('timetravel:disabled'));
    },

    toggle: () => {
      const { isEnabled } = get();
      if (isEnabled) {
        get().disable();
      } else {
        get().enable();
      }
    },

    // =========================================================================
    // 재생 제어
    // =========================================================================
    play: () => {
      const { isEnabled, currentTime, endTime } = get();
      if (!isEnabled) return;

      // 끝에 도달한 상태에서 play하면 처음부터
      if (currentTime.getTime() >= endTime.getTime()) {
        set({ currentTime: get().startTime, isPlaying: true });
      } else {
        set({ isPlaying: true });
      }
    },

    pause: () => {
      set({ isPlaying: false });
    },

    seekTo: (time: Date) => {
      const { startTime, endTime, isEnabled } = get();
      if (!isEnabled) return;
      const clamped = clampTime(time, startTime, endTime);
      set({ currentTime: clamped });
      window.dispatchEvent(
        new CustomEvent('timetravel:seek', {
          detail: { currentTime: clamped },
        })
      );
    },

    seekToProgress: (progress: number) => {
      const { startTime, endTime, isEnabled } = get();
      if (!isEnabled) return;
      const p = Math.max(0, Math.min(1, progress));
      const totalMs = endTime.getTime() - startTime.getTime();
      const targetMs = startTime.getTime() + totalMs * p;
      const time = new Date(targetMs);
      set({ currentTime: time });
      window.dispatchEvent(
        new CustomEvent('timetravel:seek', {
          detail: { currentTime: time },
        })
      );
    },

    setSpeed: (speed: PlaybackSpeed) => {
      set({ playbackSpeed: speed });
    },

    // =========================================================================
    // 프레임 이동
    // =========================================================================
    nextFrame: () => {
      const { currentTime, frameInterval, endTime, isEnabled } = get();
      if (!isEnabled) return;
      const next = new Date(
        Math.min(currentTime.getTime() + frameInterval, endTime.getTime())
      );
      set({ currentTime: next });
      window.dispatchEvent(
        new CustomEvent('timetravel:seek', {
          detail: { currentTime: next },
        })
      );
    },

    prevFrame: () => {
      const { currentTime, frameInterval, startTime, isEnabled } = get();
      if (!isEnabled) return;
      const prev = new Date(
        Math.max(currentTime.getTime() - frameInterval, startTime.getTime())
      );
      set({ currentTime: prev });
      window.dispatchEvent(
        new CustomEvent('timetravel:seek', {
          detail: { currentTime: prev },
        })
      );
    },

    // =========================================================================
    // 재생 틱 (useTimeTravelPlayback에서 호출)
    // =========================================================================
    tick: () => {
      const { currentTime, frameInterval, playbackSpeed, endTime, isPlaying } =
        get();
      if (!isPlaying) return;

      // 1틱 = frameInterval * playbackSpeed의 비율만큼 전진
      // 1초에 1프레임 기준으로 playbackSpeed만큼 빠르게
      const advanceMs = frameInterval * playbackSpeed;
      const nextMs = currentTime.getTime() + advanceMs;

      if (nextMs >= endTime.getTime()) {
        // 타임라인 끝 도달
        set({ currentTime: endTime, isPlaying: false });
        window.dispatchEvent(
          new CustomEvent('timetravel:ended', {
            detail: { currentTime: endTime },
          })
        );
        return;
      }

      const next = new Date(nextMs);
      set({ currentTime: next });
      window.dispatchEvent(
        new CustomEvent('timetravel:tick', {
          detail: { currentTime: next },
        })
      );
    },

    // =========================================================================
    // 데이터
    // =========================================================================
    setHourlyActivity: (activity: HourlyActivity[]) => {
      set({ hourlyActivity: activity });
    },

    // =========================================================================
    // 유틸리티
    // =========================================================================
    getProgress: () => {
      const { currentTime, startTime, endTime } = get();
      const total = endTime.getTime() - startTime.getTime();
      if (total <= 0) return 0;
      return (currentTime.getTime() - startTime.getTime()) / total;
    },

    getFormattedTime: () => {
      const { currentTime } = get();
      const h = currentTime.getHours().toString().padStart(2, '0');
      const m = currentTime.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    },
  }))
);

export default useTimeTravelStore;
