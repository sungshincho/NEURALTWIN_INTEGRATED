// Layout Simulator Utilities
// 좌표 변환 및 가구 크기 파싱 유틸리티

// 3D 월드 좌표 범위 (Store3DViewer 기준)
const WORLD_BOUNDS = {
  minX: -7.5,
  maxX: 7.5,
  minY: -8,  // 3D에서 y가 depth (입구방향이 +)
  maxY: 6,
};

// 2D 캔버스 % → 3D 월드 좌표 변환 (Y축 반전 적용)
export const percentToWorld = (percentX: number, percentY: number): { x: number; y: number } => {
  // 2D: x% (0=left, 100=right), y% (0=top=계산대, 100=bottom=입구)
  // 3D: x (-7.5 to 7.5), y (-8=계산대방향 to 6=입구방향)
  const x = WORLD_BOUNDS.minX + (percentX / 100) * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX);
  // Y축 반전: 3D 탑뷰 카메라 시점과 일치
  const y = WORLD_BOUNDS.minY + (percentY / 100) * (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY);
  return { x, y };
};

// 3D 월드 좌표 → 2D 캔버스 % 변환 (Y축 반전 적용)
export const worldToPercent = (worldX: number, worldY: number): { x: number; y: number } => {
  const percentX = ((worldX - WORLD_BOUNDS.minX) / (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX)) * 100;
  // Y축 반전: 3D에서 +y가 입구방향이지만, 탑뷰 카메라에서 반전되어 보임
  const percentY = ((worldY - WORLD_BOUNDS.minY) / (WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY)) * 100;
  return { x: percentX, y: percentY };
};

// GLB 파일명에서 크기 파싱: "Name_1.7x2.5x0.5.glb" → { width: 1.7, height: 2.5, depth: 0.5 }
export const parseDimensionsFromFilename = (filename: string): { width: number; height: number; depth: number } | null => {
  const match = filename.match(/(\d+\.?\d*)x(\d+\.?\d*)x(\d+\.?\d*)\.glb$/i);
  if (match) {
    return {
      width: parseFloat(match[1]),
      height: parseFloat(match[2]),
      depth: parseFloat(match[3]),
    };
  }
  return null;
};

// 가구 카테고리 추출: "Shelf_WallShelf1_1.7x2.5x0.5.glb" → "WallShelf"
export const parseFurnitureCategory = (filename: string): string => {
  const parts = filename.split('_');
  if (parts.length >= 2) {
    // "Shelf_WallShelf1" → "WallShelf" (숫자 제거)
    return parts[1].replace(/\d+$/, '');
  }
  return 'Unknown';
};

// 가구 라벨 (한글)
export const FURNITURE_LABELS: Record<string, string> = {
  'WallShelf': '선반',
  'SideShelf': '선반',
  'FullMannequin': '마네킹',
  'HalfMannequin': '마네킹',
  'CenterTable': '중앙테이블',
  'CircularTable': '원형테이블',
  'CheckoutCounter': '계산대',
  'Hanger': '행거',
};

// 가구 색상
export const FURNITURE_COLORS: Record<string, string> = {
  'WallShelf': 'bg-slate-500/30 border-slate-400',
  'SideShelf': 'bg-slate-400/30 border-slate-300',
  'FullMannequin': 'bg-pink-500/30 border-pink-400',
  'HalfMannequin': 'bg-pink-400/30 border-pink-300',
  'CenterTable': 'bg-amber-500/30 border-amber-400',
  'CircularTable': 'bg-amber-400/30 border-amber-300',
  'CheckoutCounter': 'bg-red-500/30 border-red-400',
  'Hanger': 'bg-blue-500/30 border-blue-400',
};

// 가구 데이터 타입
export interface FurnitureItem {
  file: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  category: string;
  label: string;
  dimensions: { width: number; height: number; depth: number } | null;
  percentX: number;
  percentY: number;
}

// furnitureLayout 데이터를 2D 표시용으로 변환
export const convertFurnitureFor2D = (
  furnitureLayout: Array<{ file: string; x: number; y: number; z: number; rotationY: number }>
): FurnitureItem[] => {
  return furnitureLayout.map(item => {
    const category = parseFurnitureCategory(item.file);
    const dimensions = parseDimensionsFromFilename(item.file);
    const { x: percentX, y: percentY } = worldToPercent(item.x, item.y);
    
    return {
      ...item,
      category,
      label: FURNITURE_LABELS[category] || category,
      dimensions,
      percentX,
      percentY,
    };
  });
};

// 가까운 가구 찾기 (스냅용)
export const findNearestFurniture = (
  percentX: number,
  percentY: number,
  furnitureItems: FurnitureItem[],
  snapDistance: number = 15 // % 단위
): FurnitureItem | null => {
  let nearest: FurnitureItem | null = null;
  let minDistance = Infinity;

  for (const item of furnitureItems) {
    const distance = Math.sqrt(
      Math.pow(percentX - item.percentX, 2) + Math.pow(percentY - item.percentY, 2)
    );
    if (distance < snapDistance && distance < minDistance) {
      minDistance = distance;
      nearest = item;
    }
  }

  return nearest;
};

// 가구 크기에 맞게 상품 박스 크기 계산 (% 단위)
export const calculateProductSize = (
  furniture: FurnitureItem | null,
  defaultSize: number = 14 // 기본 박스 크기 (%)
): { width: number; height: number } => {
  if (!furniture || !furniture.dimensions) {
    return { width: defaultSize, height: defaultSize };
  }

  // 가구 크기를 % 단위로 변환 (world 범위 대비)
  const worldWidth = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX; // 15
  const worldHeight = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY; // 14

  // 가구의 회전 고려 (90도 회전시 width와 depth 교환)
  const isRotated = Math.abs(furniture.rotationY) === 90 || Math.abs(furniture.rotationY) === 270;
  const furnitureWidth = isRotated ? furniture.dimensions.depth : furniture.dimensions.width;
  const furnitureDepth = isRotated ? furniture.dimensions.width : furniture.dimensions.depth;

  // % 단위로 변환 (최소/최대 제한)
  const widthPercent = Math.max(8, Math.min(20, (furnitureWidth / worldWidth) * 100));
  const heightPercent = Math.max(8, Math.min(20, (furnitureDepth / worldHeight) * 100));

  return { width: widthPercent, height: heightPercent };
};
