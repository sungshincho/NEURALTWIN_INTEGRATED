# 실제 데이터 전환 가이드 (Production Data Migration Guide)

NEURALTWIN 시스템을 샘플 데이터에서 실제 프로덕션 데이터로 전환하기 위한 상세 가이드입니다.

---

## 📋 목차

1. [매장 정보 등록](#1-매장-정보-등록)
2. [3D 모델 준비 및 업로드](#2-3d-모델-준비-및-업로드)
3. [온톨로지 데이터 구축](#3-온톨로지-데이터-구축)
4. [WiFi 트래킹 데이터 수집](#4-wifi-트래킹-데이터-수집)
5. [고객 방문 데이터 업로드](#5-고객-방문-데이터-업로드)
6. [제품 및 재고 데이터](#6-제품-및-재고-데이터)
7. [구매 데이터 업로드](#7-구매-데이터-업로드)
8. [데이터 검증 체크리스트](#8-데이터-검증-체크리스트)

---

## 1. 매장 정보 등록

### 1.1 필수 정보
매장 등록 시 다음 정보가 필요합니다:

```typescript
interface StoreData {
  store_name: string;      // 매장명 (예: "강남점")
  store_code: string;      // 매장 코드 (예: "A001", 고유값)
  address?: string;        // 주소
  manager_name?: string;   // 매장 관리자명
  email?: string;          // 연락처 이메일
  phone?: string;          // 전화번호
  metadata?: {
    real_width: number;    // 실제 매장 너비 (미터)
    real_depth: number;    // 실제 매장 깊이 (미터)
    real_height: number;   // 실제 매장 높이 (미터)
    opening_hours?: string;
    floor?: number;
  }
}
```

### 1.2 등록 방법

**방법 1: UI를 통한 등록**
1. 사이드바 → "매장 관리" 메뉴 이동
2. "매장 추가" 버튼 클릭
3. 폼에 정보 입력 후 저장

**방법 2: CSV 일괄 업로드**

CSV 파일 형식:
```csv
store_name,store_code,address,manager_name,email,phone,real_width,real_depth,real_height
강남본점,A001,서울시 강남구,김철수,manager@store.com,02-1234-5678,25.5,18.0,3.5
```

**방법 3: API 직접 호출**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('stores')
  .insert({
    store_name: '강남본점',
    store_code: 'A001',
    address: '서울시 강남구',
    metadata: {
      real_width: 25.5,
      real_depth: 18.0,
      real_height: 3.5
    }
  });
```

---

## 2. 3D 모델 준비 및 업로드

### 2.1 3D 모델 파일 요구사항

**지원 포맷:**
- `.glb` (권장) - Binary glTF, 단일 파일
- `.gltf` - Text glTF + 별도 bin/텍스처 파일

**파일 명명 규칙:**
```
{user_id}/{store_id}/store-model.glb
또는
{user_id}/{store_id}/store.gltf
```

**모델 제작 가이드라인:**
1. **좌표계**: Y-up, Right-handed 좌표계 사용
2. **단위**: 1 unit = 1 meter (미터 단위)
3. **원점**: 매장 입구 또는 좌측 하단 모서리를 (0, 0, 0)으로 설정
4. **스케일**: 실제 크기 그대로 모델링 (스케일 1:1)
5. **최적화**: 폴리곤 수 최소화 (10만 이하 권장)

**매장 실측 → 3D 모델 매핑:**
```
실측 매장 크기: 25m (너비) × 18m (깊이) × 3.5m (높이)
                    ↓
3D 모델 크기:   25 units × 18 units × 3.5 units
```

### 2.2 Blender에서 내보내기 (Export)

1. **Blender 설정:**
   - File → Export → glTF 2.0 (.glb/.gltf)
   - Format: `glTF Binary (.glb)` 선택
   - Include → Selected Objects 체크 해제 (전체 내보내기)
   - Transform → +Y Up 선택

2. **메타데이터 설정:**
   - 모델의 원점이 매장 실제 좌표계와 일치하는지 확인
   - 좌표 단위가 미터(m)인지 확인

### 2.3 Supabase Storage 업로드

**방법 1: UI 업로드**
1. "디지털 트윈 3D" 페이지 이동
2. "3D 모델 업로드" 버튼 클릭
3. 매장 선택 후 `.glb` 파일 업로드

**방법 2: 프로그래매틱 업로드**
```typescript
import { supabase } from '@/integrations/supabase/client';

const uploadStoreModel = async (
  storeId: string, 
  file: File
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const filePath = `${user.id}/${storeId}/store-model.glb`;
  
  const { data, error } = await supabase.storage
    .from('3d-models')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  return data;
};
```

### 2.4 모델 검증

업로드 후 다음 사항을 확인하세요:
- [ ] 3D 뷰어에서 모델이 정상적으로 렌더링되는가?
- [ ] 모델의 스케일이 실제 매장 크기와 일치하는가?
- [ ] 텍스처와 재질이 올바르게 표시되는가?
- [ ] 성능 문제(프레임 드롭)가 없는가?

---

## 3. 온톨로지 데이터 구축

### 3.1 Entity Type 정의

매장의 구성 요소를 Entity Type으로 정의합니다.

**필수 Entity Types:**

```typescript
// 1. StoreSpace (매장 공간)
{
  name: "StoreSpace",
  label: "매장 공간",
  description: "전체 매장 공간",
  icon: "building",
  color: "#1B6BFF",
  model_3d_type: "gltf",  // "gltf" 또는 "primitive"
  model_3d_url: null,     // StoreSpace는 3D 모델을 매장 전체 모델 사용
  properties: [
    { name: "area", type: "number", required: true },
    { name: "floor", type: "string", required: false }
  ]
}

// 2. Shelf (진열대)
{
  name: "Shelf",
  label: "진열대",
  model_3d_type: "primitive",
  model_3d_url: "box",  // primitive: box, sphere, cylinder
  model_3d_dimensions: {
    width: 2.0,   // 미터 단위
    height: 1.8,
    depth: 0.5
  },
  properties: [
    { name: "capacity", type: "number" },
    { name: "zone", type: "string" }
  ]
}

// 3. Product (제품)
{
  name: "Product",
  label: "제품",
  model_3d_type: "primitive",
  model_3d_url: "box",
  model_3d_dimensions: {
    width: 0.3,
    height: 0.2,
    depth: 0.15
  },
  properties: [
    { name: "sku", type: "string", required: true },
    { name: "price", type: "number" },
    { name: "stock", type: "number" }
  ]
}
```

### 3.2 Graph Entity 생성

Entity Type을 기반으로 실제 인스턴스를 생성합니다.

**CSV 포맷:**
```csv
entity_type,label,x,y,z,rotation_x,rotation_y,rotation_z,scale_x,scale_y,scale_z,properties
Shelf,음료진열대_1,5.0,0.0,2.0,0,90,0,1,1,1,"{""zone"":""beverage"",""capacity"":50}"
Shelf,스낵진열대_1,15.0,0.0,2.0,0,0,0,1,1,1,"{""zone"":""snack"",""capacity"":30}"
Product,콜라,5.5,1.2,2.0,0,0,0,1,1,1,"{""sku"":""COLA-001"",""price"":1500,""stock"":25}"
```

**프로그래매틱 생성:**
```typescript
const createEntity = async (entityData: {
  entity_type_id: string;
  store_id: string;
  label: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  properties: Record<string, any>;
}) => {
  const { data, error } = await supabase
    .from('graph_entities')
    .insert({
      entity_type_id: entityData.entity_type_id,
      store_id: entityData.store_id,
      label: entityData.label,
      model_3d_position: entityData.position,
      model_3d_rotation: entityData.rotation || { x: 0, y: 0, z: 0 },
      model_3d_scale: entityData.scale || { x: 1, y: 1, z: 1 },
      properties: entityData.properties
    });
  
  return data;
};
```

### 3.3 Relation Type 정의

Entity 간의 관계를 정의합니다.

```typescript
// 예시: Shelf와 Product의 관계
{
  name: "contains",
  label: "포함함",
  source_entity_type: "Shelf",
  target_entity_type: "Product",
  directionality: "directed",
  properties: [
    { name: "quantity", type: "number" },
    { name: "position_index", type: "number" }
  ]
}
```

---

## 4. WiFi 트래킹 데이터 수집

### 4.1 WiFi 존(센서) 배치

**센서 위치 계획:**
1. 매장 도면에서 센서 배치 위치 결정
2. 각 센서의 실제 좌표 측정 (미터 단위)
3. 센서 ID 부여 (sensor_01, sensor_02, ...)

**CSV 포맷 (wifi_zones):**
```csv
zone_id,x,y,z,coverage_radius,location
1,0,2.5,0,5,entrance_area
2,10,2.5,0,5,beverage_area
3,10,2.5,10,5,snack_area
4,0,2.5,10,5,checkout_area
```

**데이터베이스 삽입:**
```typescript
const createWiFiZones = async (storeId: string, zones: Array<{
  zone_id: number;
  x: number;
  y: number;
  z: number;
  metadata?: any;
}>) => {
  const { data, error } = await supabase
    .from('wifi_zones')
    .insert(
      zones.map(zone => ({
        store_id: storeId,
        zone_id: zone.zone_id,
        x: zone.x,
        y: zone.y,
        z: zone.z || 0,
        metadata: zone.metadata || {}
      }))
    );
  
  return data;
};
```

### 4.2 WiFi Raw Signals 수집

**Raspberry Pi에서 수집한 데이터 포맷:**

```csv
timestamp,mac_address,sensor_id,rssi
2025-01-15T10:30:00Z,AA:BB:CC:DD:EE:01,sensor_01,-45
2025-01-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_02,-55
2025-01-15T10:30:01Z,AA:BB:CC:DD:EE:01,sensor_03,-65
```

**Supabase 업로드:**
```typescript
const uploadWiFiSignals = async (
  storeId: string,
  signals: Array<{
    timestamp: string;
    mac_address: string;
    sensor_id: string;
    rssi: number;
  }>
) => {
  const { data, error } = await supabase
    .from('wifi_raw_signals')
    .insert(
      signals.map(signal => ({
        store_id: storeId,
        timestamp: signal.timestamp,
        mac_address: signal.mac_address,
        sensor_id: signal.sensor_id,
        rssi: signal.rssi
      }))
    );
  
  return data;
};
```

### 4.3 WiFi Tracking (위치 추정)

Raw signal 데이터를 기반으로 고객 위치를 추정합니다.

**삼변측량(Trilateration) 알고리즘 사용:**

```typescript
interface SensorReading {
  sensor_id: string;
  x: number;
  y: number;
  z: number;
  rssi: number;
}

function trilaterate(readings: SensorReading[]): { x: number; z: number } {
  // RSSI를 거리로 변환
  const distances = readings.map(r => ({
    ...r,
    distance: Math.pow(10, (-55 - r.rssi) / (10 * 2))  // Path loss 모델
  }));
  
  // 최소 3개의 센서 필요
  if (distances.length < 3) {
    throw new Error('Trilateration requires at least 3 sensors');
  }
  
  // 삼변측량 계산 (간단한 중심점 방식)
  let totalWeight = 0;
  let weightedX = 0;
  let weightedZ = 0;
  
  distances.forEach(d => {
    const weight = 1 / (d.distance * d.distance);
    totalWeight += weight;
    weightedX += d.x * weight;
    weightedZ += d.z * weight;
  });
  
  return {
    x: weightedX / totalWeight,
    z: weightedZ / totalWeight
  };
}
```

**Tracking 데이터 저장:**
```csv
timestamp,session_id,x,z,accuracy,status
2025-01-15T10:30:00Z,customer_001,2.5,3.0,1.5,entering
2025-01-15T10:30:05Z,customer_001,5.0,4.0,1.2,browsing
```

```typescript
const saveTrackingData = async (
  storeId: string,
  trackingData: Array<{
    timestamp: string;
    session_id: string;
    x: number;
    z: number;
    accuracy?: number;
    status?: string;
  }>
) => {
  const { data, error } = await supabase
    .from('wifi_tracking')
    .insert(
      trackingData.map(point => ({
        store_id: storeId,
        timestamp: point.timestamp,
        session_id: point.session_id,
        x: point.x,
        z: point.z,
        accuracy: point.accuracy,
        status: point.status
      }))
    );
  
  return data;
};
```

### 4.4 히트맵 캐시 생성

성능 최적화를 위해 히트맵 데이터를 미리 집계합니다.

```typescript
const generateHeatmapCache = async (
  storeId: string,
  date: string,
  hour: number,
  gridSize: number = 1.0
) => {
  // 해당 시간대의 tracking 데이터 가져오기
  const { data: trackingData } = await supabase
    .from('wifi_tracking')
    .select('x, z')
    .eq('store_id', storeId)
    .gte('timestamp', `${date}T${hour}:00:00Z`)
    .lt('timestamp', `${date}T${hour + 1}:00:00Z`);
  
  // 그리드 셀별로 집계
  const gridCounts = new Map<string, number>();
  
  trackingData?.forEach(point => {
    const gridX = Math.floor(point.x / gridSize) * gridSize;
    const gridZ = Math.floor(point.z / gridSize) * gridSize;
    const key = `${gridX},${gridZ}`;
    gridCounts.set(key, (gridCounts.get(key) || 0) + 1);
  });
  
  // 히트맵 캐시 저장
  const heatmapData = Array.from(gridCounts.entries()).map(([key, count]) => {
    const [gridX, gridZ] = key.split(',').map(Number);
    return {
      store_id: storeId,
      date,
      hour,
      grid_x: gridX,
      grid_z: gridZ,
      visit_count: count
    };
  });
  
  const { data, error } = await supabase
    .from('wifi_heatmap_cache')
    .insert(heatmapData);
  
  return data;
};
```

---

## 5. 고객 방문 데이터 업로드

### 5.1 방문 데이터 포맷

```csv
visit_id,store_id,customer_id,visit_date,entry_time,exit_time,duration_minutes,zone_visited,purchase_made
V001,store_001,C12345,2025-01-15,10:30:00,10:45:00,15,beverage;snack,true
V002,store_001,C67890,2025-01-15,11:00:00,11:10:00,10,entrance;checkout,false
```

### 5.2 프로그래매틱 업로드

```typescript
const uploadVisits = async (visits: Array<{
  store_id: string;
  customer_id: string;
  visit_date: string;
  entry_time: string;
  exit_time: string;
  zones_visited?: string[];
  purchase_made?: boolean;
}>) => {
  // visits 테이블이 없으면 user_data_imports를 사용
  const { data, error } = await supabase
    .from('user_data_imports')
    .insert({
      data_type: 'visits',
      file_name: 'visits.csv',
      file_type: 'csv',
      raw_data: visits,
      row_count: visits.length
    });
  
  return data;
};
```

---

## 6. 제품 및 재고 데이터

### 6.1 제품 마스터 데이터

```csv
product_id,sku,name,category,cost_price,selling_price,supplier,lead_time_days
P001,COLA-001,코카콜라 500ml,음료,800,1500,코카콜라사,3
P002,SNACK-001,허니버터칩,스낵,1200,2000,해태제과,5
```

```typescript
const uploadProducts = async (products: Array<{
  sku: string;
  name: string;
  category?: string;
  cost_price: number;
  selling_price: number;
  supplier?: string;
  lead_time_days?: number;
}>) => {
  const { data, error } = await supabase
    .from('products')
    .insert(products);
  
  return data;
};
```

### 6.2 재고 데이터

```csv
product_id,store_id,current_stock,optimal_stock,minimum_stock,last_updated
P001,store_001,45,100,20,2025-01-15T10:00:00Z
P002,store_001,30,80,15,2025-01-15T10:00:00Z
```

```typescript
const uploadInventory = async (inventory: Array<{
  product_id: string;
  store_id?: string;
  current_stock: number;
  optimal_stock: number;
  minimum_stock: number;
}>) => {
  const { data, error } = await supabase
    .from('inventory_levels')
    .insert(inventory);
  
  return data;
};
```

---

## 7. 구매 데이터 업로드

### 7.1 구매 내역 포맷

```csv
purchase_id,store_id,customer_id,product_id,purchase_date,purchase_time,quantity,unit_price,total_amount,payment_method
PUR001,store_001,C12345,P001,2025-01-15,10:45:00,2,1500,3000,card
PUR002,store_001,C12345,P002,2025-01-15,10:45:00,1,2000,2000,card
```

### 7.2 업로드 방법

```typescript
const uploadPurchases = async (purchases: Array<{
  store_id: string;
  customer_id: string;
  product_id: string;
  purchase_datetime: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method?: string;
}>) => {
  const { data, error } = await supabase
    .from('user_data_imports')
    .insert({
      data_type: 'purchases',
      file_name: 'purchases.csv',
      file_type: 'csv',
      raw_data: purchases,
      row_count: purchases.length
    });
  
  return data;
};
```

---

## 8. 데이터 검증 체크리스트

### 8.1 매장 데이터
- [ ] 모든 매장에 고유한 store_code가 부여되었는가?
- [ ] 매장의 실제 크기(real_width, real_depth, real_height)가 정확한가?
- [ ] 3D 모델이 업로드되었고 정상적으로 렌더링되는가?

### 8.2 온톨로지 데이터
- [ ] Entity Type이 매장 구성요소를 모두 표현하는가?
- [ ] Graph Entity의 3D 좌표가 실제 매장 레이아웃과 일치하는가?
- [ ] Entity 간의 Relation이 올바르게 설정되었는가?

### 8.3 WiFi 트래킹
- [ ] WiFi 센서 위치가 매장 도면과 일치하는가?
- [ ] Raw signal 데이터가 정상적으로 수집되는가?
- [ ] 삼변측량으로 추정된 위치가 합리적인가?
- [ ] 히트맵 캐시가 생성되었는가?

### 8.4 거래 데이터
- [ ] 고객 방문 데이터가 WiFi 트래킹과 연결되는가?
- [ ] 제품 SKU가 모든 시스템에서 일관되게 사용되는가?
- [ ] 재고 수준이 실제 매장 상황을 반영하는가?
- [ ] 구매 데이터에 누락된 필드가 없는가?

---

## 9. 데이터 마이그레이션 순서

실제 프로덕션 환경으로 전환할 때 권장 순서:

1. **매장 기본 정보 등록** → `stores` 테이블
2. **3D 모델 업로드** → Supabase Storage (`3d-models` bucket)
3. **온톨로지 스키마 구축** → `ontology_entity_types`, `ontology_relation_types`
4. **매장 엔티티 생성** → `graph_entities`, `graph_relations`
5. **제품 마스터 등록** → `products`
6. **재고 데이터 입력** → `inventory_levels`
7. **WiFi 존 설정** → `wifi_zones`
8. **WiFi 트래킹 시작** → `wifi_raw_signals` → `wifi_tracking`
9. **고객 방문 데이터 통합** → `user_data_imports` (visits)
10. **구매 데이터 연동** → `user_data_imports` (purchases)
11. **히트맵 캐시 생성** → `wifi_heatmap_cache`

---

## 10. 자동화 스크립트

대량 데이터 업로드를 위한 스크립트 예시:

```typescript
// scripts/migrate-production-data.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateAllData() {
  console.log('Starting data migration...');
  
  // 1. Stores
  const stores = csv.parse(fs.readFileSync('./data/stores.csv'), { columns: true });
  await supabase.from('stores').insert(stores);
  console.log(`✓ Migrated ${stores.length} stores`);
  
  // 2. Products
  const products = csv.parse(fs.readFileSync('./data/products.csv'), { columns: true });
  await supabase.from('products').insert(products);
  console.log(`✓ Migrated ${products.length} products`);
  
  // 3. WiFi Zones
  const zones = csv.parse(fs.readFileSync('./data/wifi_zones.csv'), { columns: true });
  await supabase.from('wifi_zones').insert(zones);
  console.log(`✓ Migrated ${zones.length} WiFi zones`);
  
  // ... 추가 마이그레이션
  
  console.log('Migration complete!');
}

migrateAllData();
```

---

## 11. 문제 해결 (Troubleshooting)

### WiFi 트래킹이 부정확한 경우
- 센서 배치 간격을 조정 (권장: 5~10m 간격)
- RSSI 값의 임계값 조정
- 삼변측량 알고리즘 파라미터 튜닝

### 3D 모델이 표시되지 않는 경우
- 파일 크기 확인 (20MB 이하)
- 파일 경로 확인
- glTF 스펙 호환성 검증

### 데이터 업로드 실패
- RLS (Row Level Security) 정책 확인
- 인증 상태 확인
- 필수 필드 누락 여부 확인

---

## 12. 참고 자료

- [3D 모델 파일 명명 규칙](./3D_MODEL_FILENAME_SPECIFICATION.md)
- [WiFi 트래킹 CSV 가이드](./WIFI_TRACKING_CSV_GUIDE.md)
- [온톨로지 통합 아키텍처](./INTEGRATED_ARCHITECTURE_GUIDE.md)
- [IoT 트래킹 통합 가이드](./IOT_TRACKING_INTEGRATION.md)

---

**마지막 업데이트**: 2025-01-15  
**작성자**: NEURALTWIN Development Team
