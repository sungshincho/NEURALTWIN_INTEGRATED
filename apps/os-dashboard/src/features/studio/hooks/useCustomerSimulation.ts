/**
 * useCustomerSimulation.ts
 *
 * 고객 시뮬레이션 React 훅
 * - CustomerSimulationEngine을 React에서 사용할 수 있도록 래핑
 * - useFrame으로 매 프레임 업데이트
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CustomerSimulationEngine, SimulationState } from '../simulation/CustomerSimulation';
import { useCustomerFlowData, CustomerFlowData } from './useCustomerFlowData';

interface UseCustomerSimulationOptions {
  storeId: string;
  autoStart?: boolean;
  maxCustomers?: number;
  spawnInterval?: number;
  enabled?: boolean;
}

interface UseCustomerSimulationReturn {
  state: SimulationState | null;
  isLoading: boolean;
  error: Error | null;
  controls: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: number) => void;
    setMaxCustomers: (max: number) => void;
    setSpawnInterval: (interval: number) => void;
  };
}

export const useCustomerSimulation = ({
  storeId,
  autoStart = false,
  maxCustomers = 30,
  spawnInterval = 5,
  enabled = true,
}: UseCustomerSimulationOptions): UseCustomerSimulationReturn => {
  const { data: flowData, isLoading, error } = useCustomerFlowData({
    storeId,
    enabled,
  });

  const engineRef = useRef<CustomerSimulationEngine | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);

  // 엔진 초기화
  useEffect(() => {
    if (flowData && enabled) {
      if (!engineRef.current) {
        console.log('[useCustomerSimulation] 엔진 초기화');
        engineRef.current = new CustomerSimulationEngine(flowData);
        engineRef.current.setMaxCustomers(maxCustomers);
        engineRef.current.setSpawnInterval(spawnInterval);

        if (autoStart) {
          engineRef.current.start();
        }
      } else {
        // flowData 업데이트
        engineRef.current.updateFlowData(flowData);
      }
    }
  }, [flowData, enabled, autoStart, maxCustomers, spawnInterval]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.pause();
        engineRef.current = null;
      }
    };
  }, []);

  // 매 프레임 업데이트
  useFrame((_, delta) => {
    if (engineRef.current && enabled) {
      const newState = engineRef.current.update(delta);
      // 상태가 변경된 경우에만 업데이트 (불필요한 리렌더링 방지)
      setState((prevState) => {
        if (!prevState) return { ...newState };

        // 고객 수나 실행 상태가 변경된 경우에만 업데이트
        if (
          prevState.customers.length !== newState.customers.length ||
          prevState.isRunning !== newState.isRunning ||
          prevState.stats.exitedCustomers !== newState.stats.exitedCustomers
        ) {
          return { ...newState };
        }

        // 고객 위치 업데이트 (매 프레임)
        return {
          ...newState,
          customers: newState.customers.map((c) => ({ ...c, position: c.position.clone() })),
        };
      });
    }
  });

  // 컨트롤 함수들
  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.reset();
    setState(null);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    engineRef.current?.setSpeed(speed);
  }, []);

  const setMaxCustomersControl = useCallback((max: number) => {
    engineRef.current?.setMaxCustomers(max);
  }, []);

  const setSpawnIntervalControl = useCallback((interval: number) => {
    engineRef.current?.setSpawnInterval(interval);
  }, []);

  return {
    state,
    isLoading,
    error: error as Error | null,
    controls: {
      start,
      pause,
      reset,
      setSpeed,
      setMaxCustomers: setMaxCustomersControl,
      setSpawnInterval: setSpawnIntervalControl,
    },
  };
};

export default useCustomerSimulation;
