/**
 * 레이아웃 시뮬레이션 전용 타입
 */

import { Vector3D } from '@/types/scene3d';

export interface ZoneChange {
  zoneId: string;
  zoneName: string;
  zoneType?: 'main' | 'sale' | 'fitting' | 'cashier' | 'entrance' | 'storage';
  originalPosition?: Vector3D;
  newPosition?: Vector3D;
  originalSize?: { width: number; depth: number; height?: number };
  newSize?: { width: number; depth: number; height?: number };
  facingCount?: number;
  changeReason?: string;
}

export interface FurnitureMove {
  furnitureId: string;
  furnitureType: string;
  fromZoneId?: string;
  toZoneId?: string;
  fromPosition: Vector3D;
  toPosition: Vector3D;
  rotation?: Vector3D;
  movable: boolean;
}

export interface ProductMove {
  productId: string;
  productName: string;
  sku?: string;
  fromPosition: Vector3D;
  toPosition: Vector3D;
  fromShelfId?: string;
  toShelfId?: string;
}

export interface LayoutFeatures {
  totalArea: number;
  usableArea: number;
  zoneCount: number;
  entranceDistances: Record<string, number>;
  cashierDistances: Record<string, number>;
  fittingRoomDistances?: Record<string, number>;
  pathComplexity: number;
  averageZoneSize: number;
  facingDensity: number;
}

export interface TrafficSimulation {
  expectedVisitors: number;
  zoneTraffic: Record<string, number>;
  pathHotspots: Array<{
    position: Vector3D;
    traffic: number;
  }>;
  dwellTimes: Record<string, number>;
  conversionZones: string[];
}

export interface LayoutOptimizationSuggestion {
  type: 'zone_move' | 'furniture_move' | 'product_move' | 'facing_adjust';
  targetId: string;
  currentState: any;
  suggestedState: any;
  reason: string;
  expectedImpact: {
    cvr?: number;
    traffic?: number;
    dwellTime?: number;
  };
  priority: 'high' | 'medium' | 'low';
}
