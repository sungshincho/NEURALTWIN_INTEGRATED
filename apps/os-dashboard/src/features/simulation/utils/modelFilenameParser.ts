/**
 * 3D 모델 파일명 파싱 유틸리티
 * 
 * 파일명 형식: {EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb
 * 예시: store_A매장_10.0x10.0x3.0.glb
 *      Shelf_메인진열대_2.0x1.5x0.5.glb
 */

export interface ParsedModelFilename {
  entityType: string;        // EntityType (예: Store, Shelf, DisplayTable)
  identifier: string;        // 설명/식별자 (예: A매장, 메인진열대)
  dimensions: {
    width: number;           // 너비 (미터)
    height: number;          // 높이 (미터)
    depth: number;           // 깊이 (미터)
  };
  originalFilename: string;  // 원본 파일명
  isValid: boolean;          // 파싱 성공 여부
}

/**
 * 3D 모델 파일명을 파싱합니다
 */
export function parseModelFilename(filename: string): ParsedModelFilename {
  // 확장자 제거
  const nameWithoutExt = filename.replace(/\.(glb|gltf)$/i, '');
  
  // 형식: {EntityType}_{Identifier}_{Width}x{Height}x{Depth}
  const pattern = /^([^_]+)_([^_]+)_([\d.]+)x([\d.]+)x([\d.]+)$/;
  const match = nameWithoutExt.match(pattern);
  
  if (!match) {
    return {
      entityType: '',
      identifier: '',
      dimensions: { width: 0, height: 0, depth: 0 },
      originalFilename: filename,
      isValid: false
    };
  }
  
  const [, entityType, identifier, width, height, depth] = match;
  
  return {
    entityType: entityType.trim(),
    identifier: identifier.trim(),
    dimensions: {
      width: parseFloat(width),
      height: parseFloat(height),
      depth: parseFloat(depth)
    },
    originalFilename: filename,
    isValid: true
  };
}

/**
 * 엔티티 타입이 movable인지 판단합니다
 */
export function isMovableEntityType(entityType: string): boolean {
  const movableTypes = [
    'shelf', 'displaytable', 'checkoutcounter', 'rack',
    'furniture', 'product', 'mannequin'
  ];
  
  return movableTypes.some(type => 
    entityType.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * 엔티티 타입이 고정형인지 판단합니다
 */
export function isFixedEntityType(entityType: string): boolean {
  const fixedTypes = [
    'store', 'zone', 'camera', 'sensor', 'wall', 'door', 'window'
  ];
  
  return fixedTypes.some(type => 
    entityType.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * 파일명에서 매장 정보를 추출합니다
 */
export function extractStoreInfo(identifier: string): { storeName?: string } {
  // "A매장", "B매장" 등의 패턴 감지
  const storePattern = /([A-Za-z가-힣0-9]+)매장/;
  const match = identifier.match(storePattern);
  
  if (match) {
    return { storeName: match[1] + '매장' };
  }
  
  return {};
}

/**
 * 파싱된 정보를 기반으로 기본 위치를 제안합니다
 */
export function suggestDefaultPosition(
  entityType: string, 
  dimensions: { width: number; height: number; depth: number },
  index: number = 0
): { x: number; y: number; z: number } {
  const type = entityType.toLowerCase();
  
  // Store는 중앙에 배치
  if (type.includes('store')) {
    return { x: 0, y: 0, z: 0 };
  }
  
  // 가구는 벽을 따라 배치
  if (type.includes('shelf') || type.includes('rack')) {
    return { 
      x: index * (dimensions.width + 1), 
      y: 0, 
      z: -5 
    };
  }
  
  // 테이블은 매장 중앙에 배치
  if (type.includes('table')) {
    return { 
      x: index * (dimensions.width + 2), 
      y: 0, 
      z: 0 
    };
  }
  
  // 제품은 선반 위에 배치
  if (type.includes('product')) {
    return { 
      x: index * (dimensions.width + 0.5), 
      y: 1.2, 
      z: -4.5 
    };
  }
  
  // 기본 위치
  return { 
    x: index * 2, 
    y: 0, 
    z: 0 
  };
}

/**
 * 파싱 결과를 로그로 출력합니다 (디버깅용)
 */
export function logParseResult(parsed: ParsedModelFilename): void {
  if (parsed.isValid) {
    console.log('✅ 파일명 파싱 성공:', {
      원본: parsed.originalFilename,
      엔티티타입: parsed.entityType,
      식별자: parsed.identifier,
      크기: `${parsed.dimensions.width}m × ${parsed.dimensions.height}m × ${parsed.dimensions.depth}m`,
      이동가능: isMovableEntityType(parsed.entityType) ? '예' : '아니오'
    });
  } else {
    console.log('❌ 파일명 파싱 실패:', parsed.originalFilename);
  }
}
