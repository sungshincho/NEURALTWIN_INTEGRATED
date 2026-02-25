/**
 * CustomerSimulation.ts
 *
 * 고객 시뮬레이션 엔진
 * - useCustomerFlowData의 transitionMatrix 사용
 * - 확률 기반 존 간 이동
 */

import * as THREE from 'three';
import {
  FlowPath,
  ZoneInfo,
  CustomerFlowData,
  selectNextZone,
  getRandomPositionInZone,
} from '../hooks/useCustomerFlowData';

// ===== 타입 정의 =====
export interface SimulatedCustomer {
  id: string;
  avatarType: string;
  currentZoneId: string;
  targetZoneId: string | null;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  state: 'idle' | 'walking' | 'browsing' | 'returning' | 'exiting'; // 🆕 returning 상태 추가
  dwellTimeRemaining: number; // 현재 존에서 남은 체류 시간 (초)
  totalTimeInStore: number;   // 매장 내 총 시간
  visitedZones: string[];     // 방문한 존 목록
  speed: number;              // 이동 속도 (m/s)
}

export interface SimulationState {
  customers: SimulatedCustomer[];
  isRunning: boolean;
  speed: number; // 시뮬레이션 속도 배율
  elapsedTime: number;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    exitedCustomers: number;
    avgDwellTime: number;
  };
}

// 고객 아바타 타입 (가중치 기반)
const AVATAR_TYPES = [
  { type: 'vip_male', weight: 0.05 },
  { type: 'vip_female', weight: 0.05 },
  { type: 'regular_male', weight: 0.25 },
  { type: 'regular_female', weight: 0.25 },
  { type: 'new_male', weight: 0.12 },
  { type: 'new_female', weight: 0.13 },
  { type: 'dormant_male', weight: 0.05 },
  { type: 'dormant_female', weight: 0.05 },
  { type: 'teen_male', weight: 0.02 },
  { type: 'teen_female', weight: 0.02 },
  { type: 'senior_male', weight: 0.005 },
  { type: 'senior_female', weight: 0.005 },
];

// ===== 시뮬레이션 클래스 =====
export class CustomerSimulationEngine {
  private flowData: CustomerFlowData;
  private state: SimulationState;
  private customerIdCounter: number = 0;
  private spawnInterval: number = 5; // 고객 생성 간격 (초)
  private timeSinceLastSpawn: number = 0;
  private maxCustomers: number = 30;
  private exitedCustomerDwellTimes: number[] = [];

  constructor(flowData: CustomerFlowData) {
    this.flowData = flowData;
    this.state = this.createInitialState();
  }

  private createInitialState(): SimulationState {
    return {
      customers: [],
      isRunning: false,
      speed: 1,
      elapsedTime: 0,
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        exitedCustomers: 0,
        avgDwellTime: 0,
      },
    };
  }

  // 시뮬레이션 시작
  start(): void {
    this.state.isRunning = true;
    console.log('[CustomerSimulation] Started');
  }

  // 시뮬레이션 일시정지
  pause(): void {
    this.state.isRunning = false;
    console.log('[CustomerSimulation] Paused');
  }

  // 시뮬레이션 리셋
  reset(): void {
    this.state = this.createInitialState();
    this.customerIdCounter = 0;
    this.timeSinceLastSpawn = 0;
    this.exitedCustomerDwellTimes = [];
    console.log('[CustomerSimulation] Reset');
  }

  // 속도 설정
  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
    console.log('[CustomerSimulation] Speed set to:', this.state.speed);
  }

  // 최대 고객 수 설정
  setMaxCustomers(max: number): void {
    this.maxCustomers = max;
  }

  // 생성 간격 설정
  setSpawnInterval(interval: number): void {
    this.spawnInterval = Math.max(1, interval);
  }

  // flowData 업데이트
  updateFlowData(flowData: CustomerFlowData): void {
    this.flowData = flowData;
  }

  // 매 프레임 업데이트
  update(deltaTime: number): SimulationState {
    if (!this.state.isRunning) return this.state;

    const scaledDelta = deltaTime * this.state.speed;
    this.state.elapsedTime += scaledDelta;

    // 1. 새 고객 생성
    this.timeSinceLastSpawn += scaledDelta;
    if (
      this.timeSinceLastSpawn >= this.spawnInterval &&
      this.state.customers.length < this.maxCustomers
    ) {
      this.spawnCustomer();
      this.timeSinceLastSpawn = 0;
    }

    // 2. 각 고객 업데이트
    this.state.customers.forEach((customer) => {
      this.updateCustomer(customer, scaledDelta);
    });

    // 3. 퇴장한 고객 처리
    const exitingCustomers = this.state.customers.filter((c) => c.state === 'exiting');
    exitingCustomers.forEach((c) => {
      this.exitedCustomerDwellTimes.push(c.totalTimeInStore);
    });

    this.state.customers = this.state.customers.filter((c) => c.state !== 'exiting');

    // 4. 통계 업데이트
    this.state.stats.activeCustomers = this.state.customers.length;
    this.state.stats.exitedCustomers += exitingCustomers.length;

    if (this.exitedCustomerDwellTimes.length > 0) {
      this.state.stats.avgDwellTime =
        this.exitedCustomerDwellTimes.reduce((a, b) => a + b, 0) /
        this.exitedCustomerDwellTimes.length;
    }

    return this.state;
  }

  // 새 고객 생성
  private spawnCustomer(): void {
    if (!this.flowData.entranceZone) {
      console.warn('[CustomerSimulation] 입구 존이 없습니다');
      return;
    }

    const avatarType = this.selectAvatarType();
    const spawnPosition = getRandomPositionInZone(this.flowData.entranceZone);

    const customer: SimulatedCustomer = {
      id: `customer-${++this.customerIdCounter}`,
      avatarType,
      currentZoneId: this.flowData.entranceZone.id,
      targetZoneId: null,
      position: new THREE.Vector3(spawnPosition.x, 0, spawnPosition.z),
      targetPosition: null,
      state: 'browsing',
      dwellTimeRemaining: this.getRandomDwellTime(),
      totalTimeInStore: 0,
      visitedZones: [this.flowData.entranceZone.id],
      speed: 0.8 + Math.random() * 0.4, // 0.8-1.2 m/s
    };

    this.state.customers.push(customer);
    this.state.stats.totalCustomers++;

    console.log('[CustomerSimulation] Customer spawned:', customer.id, customer.avatarType);
  }

  // 고객 업데이트
  private updateCustomer(customer: SimulatedCustomer, deltaTime: number): void {
    customer.totalTimeInStore += deltaTime;

    switch (customer.state) {
      case 'browsing':
        // 체류 시간 감소
        customer.dwellTimeRemaining -= deltaTime;

        // 체류 시간 완료 → 다음 존으로 이동
        if (customer.dwellTimeRemaining <= 0) {
          this.decideNextMove(customer);
        }
        break;

      case 'walking':
        // 목표 위치로 이동
        if (customer.targetPosition) {
          const direction = new THREE.Vector3()
            .subVectors(customer.targetPosition, customer.position)
            .normalize();

          const distance = customer.position.distanceTo(customer.targetPosition);
          const moveDistance = customer.speed * deltaTime;

          if (distance <= moveDistance) {
            // 목표 도착
            customer.position.copy(customer.targetPosition);
            customer.currentZoneId = customer.targetZoneId!;
            customer.targetZoneId = null;
            customer.targetPosition = null;
            customer.state = 'browsing';
            customer.dwellTimeRemaining = this.getRandomDwellTime();
            customer.visitedZones.push(customer.currentZoneId);
          } else {
            // 이동 중
            customer.position.add(direction.multiplyScalar(moveDistance));
          }
        }
        break;

      case 'returning':
        // 🆕 입구로 돌아가는 중
        if (customer.targetPosition) {
          const direction = new THREE.Vector3()
            .subVectors(customer.targetPosition, customer.position)
            .normalize();

          const distance = customer.position.distanceTo(customer.targetPosition);
          const moveDistance = customer.speed * deltaTime * 1.2; // 돌아갈 때는 조금 더 빠르게

          if (distance <= moveDistance) {
            // 입구 도착 → 퇴장 완료
            customer.position.copy(customer.targetPosition);
            customer.state = 'exiting';
          } else {
            // 이동 중
            customer.position.add(direction.multiplyScalar(moveDistance));
          }
        } else {
          // targetPosition이 없으면 바로 퇴장
          customer.state = 'exiting';
        }
        break;

      case 'idle':
        // 잠시 대기 후 다음 행동 결정
        customer.dwellTimeRemaining -= deltaTime;
        if (customer.dwellTimeRemaining <= 0) {
          this.decideNextMove(customer);
        }
        break;
    }
  }

  // 다음 이동 결정
  private decideNextMove(customer: SimulatedCustomer): void {
    // 확률 기반으로 다음 존 선택
    const nextPath = selectNextZone(customer.currentZoneId, this.flowData.transitionMatrix);

    if (!nextPath) {
      // 더 이상 갈 곳 없음 → 입구로 돌아가기
      this.startReturning(customer);
      return;
    }

    // 출구 존인지 확인
    const isExitZone = this.flowData.exitZones.some((z) => z.id === nextPath.to_zone_id);

    // 일정 시간 이상 머물렀으면 퇴장 확률 증가
    const exitProbability = Math.min(0.3, customer.totalTimeInStore / 600); // 최대 30%

    if (isExitZone && Math.random() < 0.7 + exitProbability) {
      // 🆕 바로 퇴장하지 않고 입구로 돌아가기
      this.startReturning(customer);
      return;
    }

    // 다음 존으로 이동 설정
    customer.targetZoneId = nextPath.to_zone_id;
    const targetPos = getRandomPositionInZone(nextPath.to_zone);
    customer.targetPosition = new THREE.Vector3(targetPos.x, 0, targetPos.z);
    customer.state = 'walking';
  }

  // 🆕 입구로 돌아가기 시작
  private startReturning(customer: SimulatedCustomer): void {
    if (!this.flowData.entranceZone) {
      // 입구 존이 없으면 바로 퇴장
      customer.state = 'exiting';
      return;
    }

    // 입구 위치로 목표 설정
    const entrancePos = getRandomPositionInZone(this.flowData.entranceZone);
    customer.targetPosition = new THREE.Vector3(entrancePos.x, 0, entrancePos.z);
    customer.targetZoneId = this.flowData.entranceZone.id;
    customer.state = 'returning';
  }

  // 랜덤 체류 시간 (초)
  private getRandomDwellTime(): number {
    // 30-120초 사이 (정규분포 유사)
    const base = 60;
    const variance = 30;
    return base + (Math.random() - 0.5) * variance * 2;
  }

  // 아바타 타입 선택 (가중치 기반)
  private selectAvatarType(): string {
    const random = Math.random();
    let cumulative = 0;

    for (const avatar of AVATAR_TYPES) {
      cumulative += avatar.weight;
      if (random <= cumulative) {
        return avatar.type;
      }
    }

    return 'regular_male';
  }

  // 현재 상태 반환
  getState(): SimulationState {
    return this.state;
  }

  // 실행 중 여부
  isRunning(): boolean {
    return this.state.isRunning;
  }
}

export default CustomerSimulationEngine;
