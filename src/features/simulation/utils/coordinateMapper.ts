/**
 * 좌표 변환 유틸리티
 * 실제 매장 좌표 ↔ 3D 모델 좌표 변환
 */

import type { StoreSpaceMetadata, TrackingData, SensorPosition } from '../types/iot.types';

/**
 * 실제 매장 좌표를 3D 모델 좌표로 변환
 * @param realX 실제 X 좌표 (미터)
 * @param realZ 실제 Z 좌표 (미터)
 * @param metadata 매장 공간 메타데이터
 */
export function realToModel(
  realX: number,
  realZ: number,
  metadata: StoreSpaceMetadata
): { x: number; z: number } {
  // 매장 중심을 원점(0, 0)으로 변환
  const normalizedX = realX - (metadata.real_width / 2);
  const normalizedZ = realZ - (metadata.real_depth / 2);
  
  // 3D 모델 스케일 적용
  const modelX = normalizedX * metadata.model_scale + metadata.origin_offset.x;
  const modelZ = normalizedZ * metadata.model_scale + metadata.origin_offset.z;
  
  return { x: modelX, z: modelZ };
}

/**
 * 3D 모델 좌표를 실제 매장 좌표로 역변환
 * @param modelX 3D 모델 X 좌표
 * @param modelZ 3D 모델 Z 좌표
 * @param metadata 매장 공간 메타데이터
 */
export function modelToReal(
  modelX: number,
  modelZ: number,
  metadata: StoreSpaceMetadata
): { x: number; z: number } {
  // 오프셋 제거 및 스케일 역변환
  const normalizedX = (modelX - metadata.origin_offset.x) / metadata.model_scale;
  const normalizedZ = (modelZ - metadata.origin_offset.z) / metadata.model_scale;
  
  // 매장 좌표계로 복원
  const realX = normalizedX + (metadata.real_width / 2);
  const realZ = normalizedZ + (metadata.real_depth / 2);
  
  return { x: realX, z: realZ };
}

/**
 * 다중 센서 데이터를 사용한 삼각측량 (Trilateration)
 * @param trackingData 여러 센서에서 수집한 트래킹 데이터
 * @param sensors 센서 위치 정보
 */
export function trilaterate(
  trackingData: TrackingData[],
  sensors: SensorPosition[]
): { x: number; z: number; accuracy: number } | null {
  // 최소 3개 센서 필요
  if (trackingData.length < 3) {
    console.warn('삼각측량에는 최소 3개의 센서 데이터가 필요합니다');
    return null;
  }

  // 신호 강도를 거리로 변환 (간단한 모델)
  const measurements = trackingData.map(data => {
    const sensor = sensors.find(s => s.sensor_id === data.sensor_id);
    if (!sensor) return null;

    // RSSI를 거리로 변환 (Free Space Path Loss)
    // d = 10 ^ ((TxPower - RSSI) / (10 * n))
    const signalStrength = data.signal_strength || -70;
    const txPower = -59; // 일반적인 송신 전력
    const pathLossExponent = 2.0; // 실내 환경
    const distance = Math.pow(10, (txPower - signalStrength) / (10 * pathLossExponent));

    return {
      x: sensor.x,
      z: sensor.z,
      distance: Math.min(distance, sensor.coverage_radius || 10)
    };
  }).filter(Boolean);

  if (measurements.length < 3) return null;

  // 최소 제곱법을 사용한 위치 추정
  const [s1, s2, s3] = measurements as { x: number; z: number; distance: number }[];
  
  // 행렬 계산
  const A = 2 * (s2.x - s1.x);
  const B = 2 * (s2.z - s1.z);
  const C = s1.distance ** 2 - s2.distance ** 2 - s1.x ** 2 - s1.z ** 2 + s2.x ** 2 + s2.z ** 2;
  
  const D = 2 * (s3.x - s2.x);
  const E = 2 * (s3.z - s2.z);
  const F = s2.distance ** 2 - s3.distance ** 2 - s2.x ** 2 - s2.z ** 2 + s3.x ** 2 + s3.z ** 2;
  
  // 크래머 공식
  const denominator = A * E - B * D;
  if (Math.abs(denominator) < 0.001) {
    console.warn('센서 배치가 선형적입니다. 정확한 위치 추정 불가');
    return null;
  }
  
  const x = (C * E - F * B) / denominator;
  const z = (A * F - D * C) / denominator;
  
  // 정확도 계산 (평균 오차)
  const errors = measurements.map(m => {
    const calculatedDist = Math.sqrt((x - m.x) ** 2 + (z - m.z) ** 2);
    return Math.abs(calculatedDist - m.distance);
  });
  const accuracy = errors.reduce((sum, err) => sum + err, 0) / errors.length;
  
  return { x, z, accuracy };
}

/**
 * 칼만 필터를 사용한 위치 스무딩
 * 노이즈가 많은 센서 데이터를 부드럽게 필터링
 */
export class KalmanFilter {
  private x: number; // 추정 위치 X
  private z: number; // 추정 위치 Z
  private vx: number; // 추정 속도 X
  private vz: number; // 추정 속도 Z
  private P: number[][]; // 공분산 행렬
  private Q: number; // 프로세스 노이즈
  private R: number; // 측정 노이즈

  constructor(initialX: number, initialZ: number) {
    this.x = initialX;
    this.z = initialZ;
    this.vx = 0;
    this.vz = 0;
    this.P = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    this.Q = 0.01; // 프로세스 노이즈 (작을수록 예측 신뢰)
    this.R = 1.0;  // 측정 노이즈 (작을수록 측정 신뢰)
  }

  /**
   * 새로운 측정값으로 위치 업데이트
   */
  update(measuredX: number, measuredZ: number, dt: number): { x: number; z: number; vx: number; vz: number } {
    // 예측 단계
    const predictedX = this.x + this.vx * dt;
    const predictedZ = this.z + this.vz * dt;
    
    // 간단한 1D 칼만 필터 적용 (X, Z 독립적)
    const Kx = this.P[0][0] / (this.P[0][0] + this.R);
    const Kz = this.P[2][2] / (this.P[2][2] + this.R);
    
    // 업데이트 단계
    this.x = predictedX + Kx * (measuredX - predictedX);
    this.z = predictedZ + Kz * (measuredZ - predictedZ);
    
    // 속도 추정
    this.vx = (this.x - predictedX) / dt;
    this.vz = (this.z - predictedZ) / dt;
    
    // 공분산 업데이트
    this.P[0][0] = (1 - Kx) * this.P[0][0] + this.Q;
    this.P[2][2] = (1 - Kz) * this.P[2][2] + this.Q;
    
    return { x: this.x, z: this.z, vx: this.vx, vz: this.vz };
  }
}

/**
 * 고객이 어느 구역에 있는지 판단
 */
export function getZoneId(x: number, z: number, metadata: StoreSpaceMetadata): string | undefined {
  if (!metadata.zones) return undefined;
  
  const zone = metadata.zones.find(zone => 
    x >= zone.bounds.min_x && x <= zone.bounds.max_x &&
    z >= zone.bounds.min_z && z <= zone.bounds.max_z
  );
  
  return zone?.zone_id;
}

/**
 * Convert zone bounds from real-world to model coordinates
 */
export function getZoneBoundsInModel(zone: { bounds: { min_x: number; max_x: number; min_z: number; max_z: number } }, metadata: StoreSpaceMetadata) {
  const minModel = realToModel(zone.bounds.min_x, zone.bounds.min_z, metadata);
  const maxModel = realToModel(zone.bounds.max_x, zone.bounds.max_z, metadata);
  
  return {
    minX: minModel.x,
    maxX: maxModel.x,
    minZ: minModel.z,
    maxZ: maxModel.z
  };
}
