/**
 * WiFi 트래킹 데이터 처리 유틸리티
 */

import type { TrackingData } from '../types/iot.types';

/**
 * 시간 범위로 필터링
 */
export function filterByTimeRange(
  data: TrackingData[],
  startTime: number,
  endTime: number
): TrackingData[] {
  return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
}

/**
 * 시간 윈도우로 그룹핑 (애니메이션용)
 */
export function groupByTimeWindow(
  data: TrackingData[],
  windowMs: number = 5000 // 5초 기본값
): Map<number, TrackingData[]> {
  const groups = new Map<number, TrackingData[]>();
  
  data.forEach(point => {
    const windowKey = Math.floor(point.timestamp / windowMs) * windowMs;
    if (!groups.has(windowKey)) {
      groups.set(windowKey, []);
    }
    groups.get(windowKey)!.push(point);
  });
  
  return groups;
}

/**
 * 히트맵 데이터로 변환 (그리드 기반 집계)
 */
export function convertToHeatmapData(
  data: TrackingData[],
  gridSize: number = 1.0 // 1미터 그리드
): Array<{ x: number; z: number; intensity: number }> {
  const heatMap = new Map<string, number>();
  
  data.forEach(point => {
    if (point.x === undefined || point.z === undefined) return;
    
    const gridX = Math.floor(point.x / gridSize) * gridSize;
    const gridZ = Math.floor(point.z / gridSize) * gridSize;
    const key = `${gridX},${gridZ}`;
    
    heatMap.set(key, (heatMap.get(key) || 0) + 1);
  });
  
  const maxCount = Math.max(...Array.from(heatMap.values()));
  
  return Array.from(heatMap.entries()).map(([key, count]) => {
    const [x, z] = key.split(',').map(Number);
    return {
      x,
      z,
      intensity: count / maxCount // 0~1 정규화
    };
  });
}

/**
 * 세션별로 그룹핑
 */
export function groupBySession(data: TrackingData[]): Map<string, TrackingData[]> {
  const sessions = new Map<string, TrackingData[]>();
  
  data.forEach(point => {
    const sessionId = point.customer_id;
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    sessions.get(sessionId)!.push(point);
  });
  
  return sessions;
}

/**
 * 고객 경로 추출
 */
export function extractCustomerPaths(
  data: TrackingData[],
  minPathLength: number = 3
): Array<{
  customer_id: string;
  path: Array<{ x: number; z: number; timestamp: number }>;
  duration: number;
  distance: number;
}> {
  const sessions = groupBySession(data);
  const paths: Array<any> = [];
  
  sessions.forEach((points, customerId) => {
    if (points.length < minPathLength) return;
    
    // 시간순 정렬
    const sortedPoints = points
      .filter(p => p.x !== undefined && p.z !== undefined)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (sortedPoints.length < minPathLength) return;
    
    // 경로 생성
    const path = sortedPoints.map(p => ({
      x: p.x!,
      z: p.z!,
      timestamp: p.timestamp
    }));
    
    // 총 이동 거리 계산
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dz = path[i].z - path[i - 1].z;
      distance += Math.sqrt(dx * dx + dz * dz);
    }
    
    paths.push({
      customer_id: customerId,
      path,
      duration: path[path.length - 1].timestamp - path[0].timestamp,
      distance
    });
  });
  
  return paths;
}

/**
 * 고유 방문자 수 추정
 */
export function estimateUniqueVisitors(data: TrackingData[]): number {
  const uniqueCustomers = new Set(data.map(d => d.customer_id));
  return uniqueCustomers.size;
}

/**
 * 체류 시간 분석
 */
export function analyzeDwellTime(data: TrackingData[]): {
  avgDwellTime: number;
  maxDwellTime: number;
  dwellTimeByCustomer: Map<string, number>;
} {
  const sessions = groupBySession(data);
  const dwellTimes = new Map<string, number>();
  
  sessions.forEach((points, customerId) => {
    if (points.length < 2) return;
    
    const sorted = points.sort((a, b) => a.timestamp - b.timestamp);
    const dwellTime = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    dwellTimes.set(customerId, dwellTime);
  });
  
  const times = Array.from(dwellTimes.values());
  
  return {
    avgDwellTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    maxDwellTime: times.length > 0 ? Math.max(...times) : 0,
    dwellTimeByCustomer: dwellTimes
  };
}
