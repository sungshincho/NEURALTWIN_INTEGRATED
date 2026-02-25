import { useMemo } from 'react';
import { useWiFiTracking } from './useWiFiTracking';
import { useSelectedStore } from './useSelectedStore';
import { realToModel } from '@/features/simulation/utils/coordinateMapper';
import type { StoreSpaceMetadata } from '@/features/simulation/types/iot.types';

export interface CustomerPath {
  session_id: string;
  points: Array<{
    x: number;  // 3D coordinates
    z: number;  // 3D coordinates
    timestamp: string;
    accuracy?: number;
  }>;
  startTime: string;
  endTime: string;
  totalDistance: number;
}

export interface CustomerPosition {
  session_id: string;
  x: number;  // 3D coordinates
  z: number;  // 3D coordinates
  timestamp: string;
  accuracy?: number;
}

/**
 * Convert WiFi tracking data to customer journey paths
 * Groups tracking points by session_id to create paths
 */
export function useCustomerJourney(storeId: string | undefined, timeOfDay?: number) {
  const wifiData = useWiFiTracking(storeId);
  const { selectedStore } = useSelectedStore();
  
  return useMemo(() => {
    if (!selectedStore?.metadata?.storeSpaceMetadata) {
      console.warn('No store space metadata found for customer journey');
      return { paths: [], currentPositions: [] };
    }
    
    const metadata = selectedStore.metadata.storeSpaceMetadata as StoreSpaceMetadata;
    let trackingData = wifiData.trackingData || [];
    
    // Filter by time of day if specified
    if (timeOfDay !== undefined) {
      trackingData = trackingData.filter(point => {
        const hour = new Date(point.timestamp).getHours();
        return hour === timeOfDay;
      });
    }
    
    // Group by session_id
    const sessionMap = new Map<string, typeof trackingData>();
    trackingData.forEach(point => {
      if (!point.x || !point.z) return;
      
      const sessionId = point.customer_id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(point);
    });
    
    // Convert to paths
    const paths: CustomerPath[] = [];
    const currentPositions: CustomerPosition[] = [];
    
    sessionMap.forEach((points, sessionId) => {
      // Sort by timestamp
      points.sort((a, b) => a.timestamp - b.timestamp);
      
      // Convert to 3D coordinates
      const pathPoints = points.map(point => {
        const modelCoords = realToModel(point.x!, point.z!, metadata);
        return {
          x: modelCoords.x,
          z: modelCoords.z,
          timestamp: new Date(point.timestamp).toISOString(),
          accuracy: point.accuracy
        };
      });
      
      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < pathPoints.length; i++) {
        const dx = pathPoints[i].x - pathPoints[i - 1].x;
        const dz = pathPoints[i].z - pathPoints[i - 1].z;
        totalDistance += Math.sqrt(dx * dx + dz * dz);
      }
      
      paths.push({
        session_id: sessionId,
        points: pathPoints,
        startTime: pathPoints[0].timestamp,
        endTime: pathPoints[pathPoints.length - 1].timestamp,
        totalDistance
      });
      
      // Add current position (last point)
      const lastPoint = pathPoints[pathPoints.length - 1];
      currentPositions.push({
        session_id: sessionId,
        x: lastPoint.x,
        z: lastPoint.z,
        timestamp: lastPoint.timestamp,
        accuracy: lastPoint.accuracy
      });
    });
    
    return { paths, currentPositions };
  }, [wifiData.trackingData, selectedStore, timeOfDay]);
}

/**
 * Calculate journey statistics
 */
export function useJourneyStatistics(paths: CustomerPath[]) {
  return useMemo(() => {
    if (paths.length === 0) {
      return {
        totalCustomers: 0,
        avgPathLength: 0,
        avgDistance: 0,
        avgDuration: 0
      };
    }
    
    const avgPathLength = paths.reduce((sum, p) => sum + p.points.length, 0) / paths.length;
    const avgDistance = paths.reduce((sum, p) => sum + p.totalDistance, 0) / paths.length;
    
    const avgDuration = paths.reduce((sum, path) => {
      const start = new Date(path.startTime).getTime();
      const end = new Date(path.endTime).getTime();
      return sum + (end - start) / 1000 / 60; // minutes
    }, 0) / paths.length;
    
    return {
      totalCustomers: paths.length,
      avgPathLength: Math.round(avgPathLength),
      avgDistance: Math.round(avgDistance * 10) / 10,
      avgDuration: Math.round(avgDuration)
    };
  }, [paths]);
}
