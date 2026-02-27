/**
 * 3D 오버레이 데이터 변환 유틸리티
 * 분석 데이터를 3D 시각화 형식으로 변환
 */

import type { PathPoint, HeatPoint, ProductInfo, CustomerAvatar } from '../types/overlay.types';

/**
 * 방문 데이터를 3D 고객 동선 경로로 변환
 */
export function generateCustomerPaths(visitsData: any[], maxPaths = 5): PathPoint[][] {
  return visitsData.slice(0, maxPaths).map((visit, idx) => {
    const baseX = (idx - 2) * 3;
    return [
      { x: baseX, y: 0, z: -8 },
      { x: baseX + 1, y: 0, z: -4 },
      { x: baseX - 1, y: 0, z: 0 },
      { x: baseX + 2, y: 0, z: 4 },
      { x: baseX, y: 0, z: 8 },
    ];
  });
}

/**
 * 방문 데이터를 3D 히트맵 포인트로 변환
 */
export function generateHeatPoints(visitsData: any[]): HeatPoint[] {
  const grid: { [key: string]: number } = {};
  
  visitsData.forEach((visit, idx) => {
    const x = ((idx % 10) - 5) * 2;
    const z = (Math.floor(idx / 10) - 5) * 2;
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    grid[key] = (grid[key] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(grid), 1);
  
  return Object.entries(grid).map(([key, count]) => {
    const [x, z] = key.split(',').map(Number);
    return { x, z, intensity: count / maxCount };
  });
}

/**
 * 제품 데이터를 3D 제품 정보 마커로 변환
 */
export function convertToProductInfo(productData: any[]): ProductInfo[] {
  return productData.map((item, idx) => {
    const stockRatio = item.currentStock / item.optimalStock;
    let status: 'normal' | 'low' | 'critical';
    
    if (stockRatio >= 0.5) status = 'normal';
    else if (stockRatio >= 0.3) status = 'low';
    else status = 'critical';

    const row = Math.floor(idx / 3);
    const col = idx % 3;
    
    return {
      id: `product-${idx}`,
      name: item.product,
      position: { x: (col - 1) * 4, y: 0, z: (row - 1) * 4 },
      stock: item.currentStock,
      demand: item.predictedDemand,
      status,
      price: item.revenueImpact ? Math.abs(item.revenueImpact / item.weeklyDemand) : undefined
    };
  });
}

/**
 * 방문 데이터를 고객 아바타 인스턴스로 변환
 */
export function generateCustomerAvatars(visitsData: any[], maxCustomers = 100): CustomerAvatar[] {
  return visitsData.slice(0, maxCustomers).map((visit, idx) => {
    const angle = (idx / maxCustomers) * Math.PI * 2;
    const radius = 5 + Math.random() * 5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    const purchased = visit.purchased === 'Y' || visit.purchased === true;
    const isLeaving = Math.random() < 0.1;
    
    let status: 'browsing' | 'purchasing' | 'leaving';
    if (isLeaving) status = 'leaving';
    else if (purchased) status = 'purchasing';
    else status = 'browsing';
    
    const speed = status === 'leaving' ? 2.0 : status === 'purchasing' ? 0.5 : 1.0;
    const velocity = {
      x: (Math.random() - 0.5) * speed,
      z: (Math.random() - 0.5) * speed
    };
    
    return {
      id: visit.visit_id || `customer-${idx}`,
      position: { x, y: 0, z },
      velocity,
      status,
      timestamp: visit.entry_time ? new Date(visit.entry_time).getTime() : Date.now()
    };
  });
}
