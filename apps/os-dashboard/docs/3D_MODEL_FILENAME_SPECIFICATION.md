# 3D 모델 파일명 & 메타데이터 규격서

## 개요
이 문서는 NEURALTWIN 시스템에서 3D 모델 파일을 자동으로 온톨로지 스키마에 매핑하기 위한 파일명 및 메타데이터 규격을 정의합니다.

---

## 1. 필수 파일명 형식

### 1.1 기본 형식
```
{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb
```

### 1.2 구성 요소

#### A. EntityType (필수)
온톨로지 스키마의 `ontology_entity_types.name`과 **정확히 일치**해야 합니다.

**현재 지원되는 엔티티 타입:**
- `Store` - 매장 전체 공간
- `Zone` - 매장 내 구역
- `Shelf` - 선반/진열대
- `DisplayTable` - 디스플레이 테이블
- `Rack` - 랙/행거
- `CheckoutCounter` - 계산대
- `FittingRoom` - 피팅룸
- `Product` - 상품
- `Camera` - CCTV 카메라
- `Beacon` - 비콘 장치
- `POS` - POS 단말기
- `Kiosk` - 키오스크

#### B. Identifier (권장)
엔티티를 식별할 수 있는 설명적인 이름
- 예: `WallMount`, `Clothing`, `Electronics`, `Corner`

#### C. Dimensions (필수)
`{Width}x{Height}x{Depth}` 형식 (단위: 미터)
- 예: `2.0x2.0x0.5` (너비 2m, 높이 2m, 깊이 0.5m)
- 소수점 한 자리까지 권장

### 1.3 예시

#### ✅ 올바른 파일명
```
Shelf_WallMount_2.0x2.0x0.5.glb
Rack_Clothing_1.5x2.0x0.6.glb
DisplayTable_Electronics_3.0x0.8x1.2.glb
Product_Phone_0.1x0.2x0.01.glb
Store_MainFloor_20.0x4.0x15.0.glb
Zone_Entrance_5.0x4.0x3.0.glb
CheckoutCounter_Main_2.5x1.0x0.8.glb
Camera_Corner_0.3x0.3x0.3.glb
```

#### ❌ 잘못된 파일명
```
shelf.glb                          # EntityType만 있고 dimensions 없음
MyShelf_2x2x0.5.glb               # EntityType이 온톨로지와 불일치
Shelf_2.0_2.0_0.5.glb             # dimensions 구분자가 'x'가 아님
Shelf_WallMount.glb               # dimensions 없음
```

---

## 2. 이동 가능 여부 (Movable)

### 2.1 자동 판단 규칙

#### Movable = true (이동 가능)
가구 및 집기 - AI 레이아웃 시뮬레이션 시 **위치 변경 제안 가능**
- `Rack` - 랙/행거
- `Shelf` - 선반
- `DisplayTable` - 디스플레이 테이블
- `CheckoutCounter` - 계산대
- `Kiosk` - 키오스크
- `Product` - 상품
- `FittingRoom` - 피팅룸

#### Movable = false (고정 구조물)
고정 설치 구조물 - AI가 **위치 변경 제안 안 함**
- `Store` - 매장 공간
- `Zone` - 구역
- `Camera` - CCTV (고정 설치)
- `Beacon` - 비콘 (고정 설치)
- `POS` - POS 단말기 (고정 설치)

### 2.2 파일명 키워드 힌트

AI가 파일명에서 다음 키워드를 감지하면 movable 속성을 추론합니다:

**movable=true 키워드:**
- `movable`, `portable`, `mobile`, `wheeled`
- 예: `Rack_Movable_Clothing_1.5x2.0x0.6.glb`

**movable=false 키워드:**
- `fixed`, `permanent`, `installed`, `builtin`
- 예: `Camera_Fixed_Corner_0.3x0.3x0.3.glb`

---

## 3. 선택적 메타데이터 JSON

### 3.1 파일명 형식
3D 모델 파일과 동일한 기본 이름 + `.json` 확장자
```
Rack_Clothing_1.5x2.0x0.6.glb
Rack_Clothing_1.5x2.0x0.6.json  ← 메타데이터 파일
```

### 3.2 JSON 구조

#### A. 기존 매장 가구 (Before/After 비교용)
```json
{
  "entity_type": "Rack",
  "movable": true,
  "dimensions": {
    "width": 1.5,
    "height": 2.0,
    "depth": 0.6
  },
  "current_position": {
    "x": 5.0,
    "y": 0.0,
    "z": 3.0
  },
  "current_rotation": {
    "x": 0,
    "y": 90,
    "z": 0
  },
  "properties": {
    "rack_type": "clothing",
    "hanging_capacity": 30,
    "material": "metal",
    "color": "#silver"
  },
  "scale": {
    "x": 1.0,
    "y": 1.0,
    "z": 1.0
  }
}
```

#### B. 신규 가구 (초기 배치 힌트용)
```json
{
  "entity_type": "DisplayTable",
  "movable": true,
  "dimensions": {
    "width": 3.0,
    "height": 0.8,
    "depth": 1.2
  },
  "position_hint": {
    "x": 10.0,
    "y": 0.0,
    "z": 5.0
  },
  "rotation_hint": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "properties": {
    "table_type": "electronics"
  }
}
```

### 3.3 필드 설명

| 필드 | 타입 | 필수 | 설명 | 사용 시나리오 |
|------|------|------|------|--------------|
| `entity_type` | string | 권장 | 온톨로지 엔티티 타입명 (파일명과 동일) | 모든 경우 |
| `movable` | boolean | 선택 | 이동 가능 여부 (true/false) | 모든 경우 |
| `dimensions` | object | 권장 | 실제 크기 (미터 단위) | 모든 경우 |
| `dimensions.width` | number | 권장 | 너비 (m) | 모든 경우 |
| `dimensions.height` | number | 권장 | 높이 (m) | 모든 경우 |
| `dimensions.depth` | number | 권장 | 깊이 (m) | 모든 경우 |
| **`current_position`** | object | **기존 가구 필수** | **현재 매장의 실제 위치 (Before)** | **기존 매장 가구** |
| **`current_rotation`** | object | 선택 | **현재 회전 각도 (degree)** | **기존 매장 가구** |
| `position_hint` | object | 선택 | 초기 배치 위치 제안 (신규 가구용) | 신규 가구 |
| `rotation_hint` | object | 선택 | 초기 회전 각도 제안 (degree) | 신규 가구 |
| `properties` | object | 선택 | 커스텀 속성 (용량, 재질 등) | 모든 경우 |
| `scale` | object | 선택 | 스케일 조정 (기본값 1.0) | 모든 경우 |

#### 위치 필드 차이점

| 필드 | 용도 | 필수 여부 | 설명 |
|------|------|----------|------|
| **`current_position`** | Before/After 비교 | 기존 가구 **필수** | 현재 오프라인 매장의 **실제 위치**. AI 시뮬레이션 시 "현재 위치(Before)"로 사용 |
| **`suggested_position`** | AI 최적화 제안 | AI가 자동 생성 | AI가 분석한 **최적 위치(After)**. 시뮬레이션 결과로 생성됨 |
| `position_hint` | 신규 가구 배치 | 선택 | 신규 추가 가구의 초기 위치 힌트. AI가 참고용으로 사용 |

---

## 4. 업로드 시나리오별 가이드

### 4.1 시나리오 A: 기존 매장 가구 (Before/After 비교용)

**목적**: 현재 오프라인 매장을 디지털 트윈으로 복제하여 AI 최적화 시뮬레이션 수행

**필수 정보**:
- ✅ `current_position` (필수) - 현재 실제 위치
- ✅ `current_rotation` (권장) - 현재 회전 각도
- ✅ `movable=true` (권장) - AI가 위치 최적화 제안 가능

**예시: 기존 의류 랙**
```
파일명: Rack_Clothing_1.5x2.0x0.6.glb

메타데이터: Rack_Clothing_1.5x2.0x0.6.json
{
  "entity_type": "Rack",
  "movable": true,
  "dimensions": { "width": 1.5, "height": 2.0, "depth": 0.6 },
  "current_position": { "x": 5.0, "y": 0.0, "z": 3.0 },
  "current_rotation": { "x": 0, "y": 90, "z": 0 },
  "properties": {
    "rack_type": "clothing",
    "hanging_capacity": 30
  }
}
```

**결과**: 
- AI가 `current_position` (5.0, 0.0, 3.0)을 **Before**로 사용
- AI가 최적화 후 `suggested_position` (7.0, 0.0, 4.0)을 **After**로 제안
- 3D 비교 뷰어에서 Before/After 시각적 비교 가능

---

### 4.2 시나리오 B: 신규 추가 가구 (초기 배치 힌트)

**목적**: 새로운 가구를 매장에 추가할 때 초기 위치 힌트 제공

**필수 정보**:
- ✅ `position_hint` (선택) - 초기 배치 위치 제안
- ✅ `rotation_hint` (선택) - 초기 회전 각도
- ❌ `current_position` 불필요 (기존 위치가 없음)

**예시: 신규 디스플레이 테이블**
```
파일명: DisplayTable_Electronics_3.0x0.8x1.2.glb

메타데이터: DisplayTable_Electronics_3.0x0.8x1.2.json
{
  "entity_type": "DisplayTable",
  "movable": true,
  "dimensions": { "width": 3.0, "height": 0.8, "depth": 1.2 },
  "position_hint": { "x": 10.0, "y": 0.0, "z": 5.0 },
  "rotation_hint": { "x": 0, "y": 0, "z": 0 },
  "properties": {
    "table_type": "electronics",
    "has_lighting": true
  }
}
```

**결과**:
- AI가 `position_hint`를 참고하여 초기 배치
- AI 레이아웃 시뮬레이션 시 최적 위치 재계산

---

### 4.3 시나리오 C: 고정 구조물 (매장 공간/CCTV 등)

**목적**: 이동 불가능한 고정 구조물 (벽, CCTV, 기둥 등)

**필수 정보**:
- ✅ `current_position` (필수) - 고정 설치 위치
- ✅ `movable=false` (필수) - AI가 위치 변경 제안 안 함

**예시: 고정 CCTV 카메라**
```
파일명: Camera_Fixed_Corner_0.3x0.3x0.3.glb

메타데이터: Camera_Fixed_Corner_0.3x0.3x0.3.json
{
  "entity_type": "Camera",
  "movable": false,
  "dimensions": { "width": 0.3, "height": 0.3, "depth": 0.3 },
  "current_position": { "x": 0.5, "y": 3.5, "z": 0.5 },
  "current_rotation": { "x": -30, "y": 45, "z": 0 },
  "properties": {
    "camera_type": "fixed",
    "resolution": "1080p",
    "fov_degrees": 120
  }
}
```

**결과**:
- AI가 `movable=false`를 확인하고 위치 변경 제안 안 함
- 3D 씬에서 고정 요소로 렌더링

---

## 5. 엔티티 타입별 예시

### 5.1 Rack (랙/행거)
```
파일명: Rack_Clothing_1.5x2.0x0.6.glb

메타데이터:
{
  "entity_type": "Rack",
  "movable": true,
  "dimensions": { "width": 1.5, "height": 2.0, "depth": 0.6 },
  "properties": {
    "rack_type": "clothing",
    "hanging_capacity": 30,
    "load_capacity_kg": 50
  }
}
```

### 5.2 Shelf (선반)
```
파일명: Shelf_WallMount_2.0x2.0x0.5.glb

메타데이터:
{
  "entity_type": "Shelf",
  "movable": true,
  "dimensions": { "width": 2.0, "height": 2.0, "depth": 0.5 },
  "properties": {
    "shelf_type": "wall_mount",
    "shelves_count": 4,
    "weight_per_shelf_kg": 20
  }
}
```

### 5.3 DisplayTable (디스플레이 테이블)
```
파일명: DisplayTable_Electronics_3.0x0.8x1.2.glb

메타데이터:
{
  "entity_type": "DisplayTable",
  "movable": true,
  "dimensions": { "width": 3.0, "height": 0.8, "depth": 1.2 },
  "properties": {
    "table_type": "electronics",
    "surface_material": "glass",
    "has_lighting": true
  }
}
```

### 5.4 CheckoutCounter (계산대)
```
파일명: CheckoutCounter_Main_2.5x1.0x0.8.glb

메타데이터:
{
  "entity_type": "CheckoutCounter",
  "movable": true,
  "dimensions": { "width": 2.5, "height": 1.0, "depth": 0.8 },
  "properties": {
    "checkout_type": "main",
    "has_pos": true,
    "has_cash_drawer": true
  }
}
```

### 5.5 Product (상품)
```
파일명: Product_Phone_0.1x0.2x0.01.glb

메타데이터:
{
  "entity_type": "Product",
  "movable": true,
  "dimensions": { "width": 0.1, "height": 0.2, "depth": 0.01 },
  "properties": {
    "product_type": "phone",
    "brand": "SampleBrand",
    "sku": "PHONE-001"
  }
}
```

### 5.6 Store (매장 공간)
```
파일명: Store_MainFloor_20.0x4.0x15.0.glb

메타데이터:
{
  "entity_type": "Store",
  "movable": false,
  "dimensions": { "width": 20.0, "height": 4.0, "depth": 15.0 },
  "properties": {
    "store_type": "retail",
    "floor_area_sqm": 300,
    "zone_count": 5
  }
}
```

### 5.7 Camera (CCTV)
```
파일명: Camera_Fixed_Corner_0.3x0.3x0.3.glb

메타데이터:
{
  "entity_type": "Camera",
  "movable": false,
  "dimensions": { "width": 0.3, "height": 0.3, "depth": 0.3 },
  "properties": {
    "camera_type": "fixed",
    "resolution": "1080p",
    "fov_degrees": 120
  }
}
```

---

## 6. AI 자동 인식 키워드

파일명에 다음 키워드가 포함되면 AI가 자동으로 엔티티 타입을 추론합니다:

| 키워드 | 추론 엔티티 타입 |
|--------|------------------|
| `store`, `space`, `room` | Store |
| `zone`, `area`, `section` | Zone |
| `shelf`, `shelving`, `bookcase` | Shelf |
| `table`, `desk`, `display` | DisplayTable |
| `rack`, `hanger`, `rail` | Rack |
| `counter`, `checkout`, `cashier` | CheckoutCounter |
| `fitting`, `changing`, `dressing` | FittingRoom |
| `product`, `item`, `goods`, `phone`, `laptop` | Product |
| `camera`, `cctv`, `surveillance` | Camera |
| `beacon`, `sensor`, `ble` | Beacon |
| `pos`, `terminal`, `payment` | POS |
| `kiosk`, `terminal`, `self-service` | Kiosk |

---

## 7. 100% 자동 매핑을 위한 최소 요구사항

다음 정보만 있으면 AI가 자동으로 온톨로지에 매핑합니다:

1. **EntityType** - 온톨로지 `name`과 정확히 일치
2. **Dimensions** - `{W}x{H}x{D}` 형식 (미터)

**최소 예시:**
```
Shelf_2.0x2.0x0.5.glb          → 100% 자동 매핑
Rack_1.5x2.0x0.6.glb           → 100% 자동 매핑
```

---

## 8. AI 레이아웃 시뮬레이션 제안 구조

AI가 movable=true인 가구에 대해 생성하는 위치 최적화 제안:

```json
{
  "zones": [
    {
      "zone_id": "main_zone",
      "furniture": [
        {
          "furniture_id": "rack_001",
          "entity_type": "Rack",
          "movable": true,
          "current_position": { "x": 5, "y": 0, "z": 3 },
          "suggested_position": { "x": 7, "y": 0, "z": 4 },
          "suggested_rotation": { "x": 0, "y": 90, "z": 0 },
          "optimization_reason": "높은 유동 인구 지역으로 이동하여 가시성 20% 향상 예상"
        }
      ],
      "products": [
        {
          "product_id": "product_001",
          "entity_type": "Product",
          "movable": true,
          "current_position": { "x": 5, "y": 1, "z": 3 },
          "suggested_position": { "x": 7, "y": 1.2, "z": 4 },
          "optimization_reason": "시선 높이로 이동하여 구매 전환율 15% 증가 예상"
        }
      ]
    }
  ],
  "optimization_summary": "전체 레이아웃 최적화로 매출 12% 증가 예상"
}
```

---

## 9. 파일 업로드 워크플로우

1. **파일명 검증**
   - EntityType이 온톨로지에 존재하는지 확인
   - Dimensions 형식 검증 (`{W}x{H}x{D}`)

2. **AI 자동 분석**
   - Edge Function: `analyze-3d-model`
   - 파일명에서 EntityType, movable, dimensions 추출
   - 신뢰도 점수 계산 (0-1)

3. **매핑 제안**
   - 매칭된 온톨로지 엔티티 타입 표시
   - 추론된 movable 속성 표시
   - 사용자 확인 후 적용

4. **데이터베이스 업데이트**
   - `ontology_entity_types.model_3d_url` 업데이트
   - `ontology_entity_types.model_3d_dimensions` 업데이트
   - `graph_entities` 생성 (필요 시)

---

## 10. 체크리스트

### 파일명 체크리스트
- [ ] EntityType이 온톨로지 스키마와 정확히 일치
- [ ] Dimensions가 `{W}x{H}x{D}` 형식
- [ ] 파일 확장자가 `.glb`
- [ ] 파일명에 특수문자 없음 (underscore `_`만 허용)

### 메타데이터 체크리스트 (선택)
- [ ] JSON 파일명이 GLB 파일과 동일
- [ ] `entity_type` 필드가 파일명과 일치
- [ ] `movable` 필드가 명시적으로 설정됨
- [ ] `dimensions` 객체가 정확한 값 포함
- [ ] `properties`에 의미 있는 속성 포함

### 메타데이터 체크리스트 - 기존 매장 가구
- [ ] JSON 파일명이 GLB 파일과 동일
- [ ] `entity_type` 필드가 파일명과 일치
- [ ] **`current_position` 필드가 실제 매장 위치로 설정됨 (필수)**
- [ ] **`current_rotation` 필드가 실제 회전 각도로 설정됨 (권장)**
- [ ] `movable=true` 설정 (AI 최적화 제안용)
- [ ] `dimensions` 객체가 정확한 값 포함
- [ ] `properties`에 의미 있는 속성 포함

### 메타데이터 체크리스트 - 신규 가구
- [ ] JSON 파일명이 GLB 파일과 동일
- [ ] `entity_type` 필드가 파일명과 일치
- [ ] `position_hint` 필드로 초기 배치 위치 제안 (선택)
- [ ] `rotation_hint` 필드로 초기 회전 각도 제안 (선택)
- [ ] `movable=true` 설정
- [ ] `dimensions` 객체가 정확한 값 포함

---

## 11. 참고사항

- **단위**: 모든 dimensions는 **미터(m)** 단위
- **파일 형식**: GLB 권장 (GLTF도 가능)
- **최대 파일 크기**: 50MB 권장
- **텍스처**: 임베디드 텍스처 권장 (외부 참조 지양)
- **폴리곤**: 최적화된 low-poly 모델 권장 (10만 폴리곤 이하)

---

## 문의

규격 관련 문의사항은 개발팀으로 연락 바랍니다.

---

**Before/After 비교 핵심 요약:**
- **기존 가구**: `current_position` 필수 → AI가 `suggested_position` 생성 → Before/After 비교
- **신규 가구**: `position_hint` 선택 → AI가 최적 위치 계산
- **고정 구조물**: `movable=false` + `current_position` 필수 → AI가 위치 변경 안 함

마지막 업데이트: 2025-11-13
