# 3D 모델 메타데이터 CSV 가이드

## 개요
모든 3D 모델의 메타데이터를 하나의 CSV 파일로 통합 관리합니다.

---

## CSV 구조

### 파일명
```
3d_models_metadata.csv
```

### 필수 컬럼

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| `model_file` | TEXT | ✅ | GLB/GLTF 파일명 | `Rack_Main_2.0x1.8x0.6.glb` |
| `entity_type` | TEXT | ✅ | 엔티티 타입 | `Rack`, `Shelf`, `Product` |
| `movable` | BOOLEAN | ✅ | 이동 가능 여부 | `true`, `false` |
| `width` | NUMBER | ✅ | 너비 (미터) | `2.0` |
| `height` | NUMBER | ✅ | 높이 (미터) | `1.8` |
| `depth` | NUMBER | ✅ | 깊이 (미터) | `0.6` |

### As-Is 배치용 선택 컬럼

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| `current_x` | NUMBER | 선택 | 현재 X 좌표 | `5.2` |
| `current_y` | NUMBER | 선택 | 현재 Y 좌표 | `0.0` |
| `current_z` | NUMBER | 선택 | 현재 Z 좌표 | `3.8` |
| `rotation_x` | NUMBER | 선택 | X축 회전 (라디안) | `0` |
| `rotation_y` | NUMBER | 선택 | Y축 회전 (라디안) | `1.57` |
| `rotation_z` | NUMBER | 선택 | Z축 회전 (라디안) | `0` |
| `scale_x` | NUMBER | 선택 | X축 스케일 | `1.0` |
| `scale_y` | NUMBER | 선택 | Y축 스케일 | `1.0` |
| `scale_z` | NUMBER | 선택 | Z축 스케일 | `1.0` |

### 추가 속성 컬럼

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| `properties` | JSON | 선택 | 커스텀 속성 | `{"capacity":50,"material":"metal"}` |
| `zone` | TEXT | 선택 | 소속 Zone | `main_sales`, `fitting_area` |
| `description` | TEXT | 선택 | 설명 | `메인 디스플레이 랙` |

---

## 예시 CSV

### Scenario 1: As-Is 레이아웃 (현재 배치 재현)
```csv
model_file,entity_type,movable,width,height,depth,current_x,current_y,current_z,rotation_x,rotation_y,rotation_z,scale_x,scale_y,scale_z,zone,properties
Rack_Main_2.0x1.8x0.6.glb,Rack,true,2.0,1.8,0.6,5.2,0.0,3.8,0,1.57,0,1,1,1,main_sales,"{""capacity"":50,""material"":""metal""}"
Shelf_Wall_1.5x0.4x0.3.glb,Shelf,true,1.5,0.4,0.3,2.0,1.5,10.0,0,0,0,1,1,1,fitting_area,"{""wall_mounted"":true}"
Mannequin_Female_0.4x1.7x0.3.glb,Mannequin,true,0.4,1.7,0.3,1.5,0.0,2.3,0,0.785,0,1,1,1,entrance,"{""pose"":""standing"",""outfit"":""casual""}"
CheckoutCounter_Main_2.5x1.0x0.8.glb,CheckoutCounter,false,2.5,1.0,0.8,18.0,0.0,7.0,0,0,0,1,1,1,checkout,"{""terminals"":2}"
```

### Scenario 2: AI 자동 배치 (To-Be)
```csv
model_file,entity_type,movable,width,height,depth,zone,properties
DisplayTable_New_1.2x0.9x0.8.glb,DisplayTable,true,1.2,0.9,0.8,main_sales,"{""style"":""modern"",""color"":""white""}"
Rack_Additional_2.0x1.8x0.6.glb,Rack,true,2.0,1.8,0.6,main_sales,"{""capacity"":50}"
Product_Tshirt_0.3x0.4x0.05.glb,Product,true,0.3,0.4,0.05,main_sales,"{""sku"":""TSH-001""}"
```

---

## 업로드 워크플로우

### Step 1: CSV 준비
1. Excel 또는 Google Sheets에서 작성
2. UTF-8 인코딩으로 저장
3. 파일명: `3d_models_metadata.csv`

### Step 2: GLB 파일 업로드
1. `/digital-twin/setup` 페이지에서 ModelUploader 사용
2. 모든 GLB 파일을 한번에 드래그 앤 드롭
3. Storage에 업로드됨

### Step 3: 메타데이터 CSV 업로드
1. `/data-import` 페이지로 이동
2. UnifiedDataUpload 컴포넌트 사용
3. CSV 파일 선택
4. Data Type: `3d_model_metadata` 선택
5. 업로드 버튼 클릭

### Step 4: 자동 처리
1. `integrated-data-pipeline` Edge Function이 CSV 파싱
2. 각 행을 GLB 파일과 매칭
3. `current_x/y/z` 있으면 As-Is 배치
4. 없으면 AI가 최적 배치 계산
5. `graph_entities`에 인스턴스 생성

---

## 데이터 검증 규칙

### 필수 검증
- [x] `model_file`이 Storage에 존재하는지 확인
- [x] `entity_type`이 `ontology_entity_types`에 존재하는지 확인
- [x] `width`, `height`, `depth` > 0
- [x] `movable`이 `true` 또는 `false`

### 선택 검증
- [x] `current_x/y/z`가 모두 있거나 모두 없어야 함
- [x] `rotation_x/y/z`는 라디안 단위 (-π ~ π)
- [x] `scale_x/y/z` > 0
- [x] `properties`는 유효한 JSON 형식

---

## Edge Function 연동

### integrated-data-pipeline 수정
```typescript
// CSV 파싱 후
if (dataType === '3d_model_metadata') {
  const metadataRows = parsedData.map(row => ({
    model_file: row.model_file,
    entity_type: row.entity_type,
    movable: row.movable === 'true',
    dimensions: {
      width: Number(row.width),
      height: Number(row.height),
      depth: Number(row.depth)
    },
    current_position: row.current_x ? {
      x: Number(row.current_x),
      y: Number(row.current_y),
      z: Number(row.current_z)
    } : null,
    current_rotation: row.rotation_x ? {
      x: Number(row.rotation_x),
      y: Number(row.rotation_y),
      z: Number(row.rotation_z)
    } : null,
    scale: row.scale_x ? {
      x: Number(row.scale_x),
      y: Number(row.scale_y),
      z: Number(row.scale_z)
    } : { x: 1, y: 1, z: 1 },
    properties: row.properties ? JSON.parse(row.properties) : {},
    zone: row.zone
  }));

  // auto-process-3d-models 호출
  await processModelsWithMetadata(metadataRows, storeId, userId);
}
```

---

## 장점

### 1. 일괄 관리
- 모든 모델 정보를 하나의 파일로 관리
- Excel/Sheets로 편집 가능
- 버전 관리 용이

### 2. 효율성
- 수십~수백 개 모델을 한번에 처리
- JSON 파일 개별 생성 불필요
- 대량 업데이트 간편

### 3. 재사용성
- 기존 CSV 임포트 인프라 활용
- 검증 로직 공유
- 데이터 정합성 보장

### 4. 협업
- 비개발자도 Excel로 편집 가능
- 팀원 간 공유 용이
- 리뷰 및 승인 프로세스 적용 가능

---

## 주의사항

### 1. 파일명 일치
- CSV의 `model_file`과 Storage의 실제 파일명이 정확히 일치해야 함
- 대소문자 구분

### 2. 인코딩
- UTF-8 인코딩 필수
- JSON 속성 내 특수문자 이스케이프

### 3. 좌표계
- Y축은 높이 (위)
- 매장 출입구를 (0, 0, 0) 기준으로 설정 권장

### 4. 순서
- GLB 파일 먼저 업로드
- CSV는 나중에 업로드 (파일 존재 검증 위해)

---

## 관련 문서
- [3D_MODEL_FILENAME_SPECIFICATION.md](./3D_MODEL_FILENAME_SPECIFICATION.md)
- [3D_MODEL_UPLOAD_SCENARIOS.md](./3D_MODEL_UPLOAD_SCENARIOS.md)
- [CORRECTED_DATASET_STRUCTURE.md](./CORRECTED_DATASET_STRUCTURE.md)
