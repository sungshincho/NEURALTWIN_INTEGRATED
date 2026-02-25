# 3D 모델 업로드 시나리오 가이드

## 개요
NEURALTWIN은 두 가지 3D 모델 업로드 시나리오를 지원합니다:

1. **Scenario 1 (As-Is)**: 매장의 현재 레이아웃을 그대로 구현
2. **Scenario 2 (To-Be)**: AI 기반 최적화 배치 시뮬레이션

---

## Scenario 1: As-Is 레이아웃 구현

### 목적
매장의 **현재 상태**를 Digital Twin으로 정확히 재현하여 Before/After 비교 분석의 기준점(Baseline)을 설정합니다.

### 필수 파일

#### 1. GLB 파일
```
Rack_DisplayRack_2.0x1.8x0.6.glb
```

#### 2. 메타데이터 JSON (필수)
```json
{
  "entity_type": "Rack",
  "movable": true,
  "dimensions": { 
    "width": 2.0, 
    "height": 1.8, 
    "depth": 0.6 
  },
  "current_position": { 
    "x": 5.2, 
    "y": 0.0, 
    "z": 3.8 
  },
  "current_rotation": { 
    "x": 0, 
    "y": 1.57, 
    "z": 0 
  },
  "scale": { 
    "x": 1.0, 
    "y": 1.0, 
    "z": 1.0 
  },
  "properties": {
    "capacity": 50,
    "material": "metal",
    "zone": "main_sales"
  }
}
```

### 필드 설명

| 필드 | 필수 | 설명 |
|------|------|------|
| `current_position` | ✅ | **현재 매장 내 실제 위치** (미터 단위) |
| `current_rotation` | ✅ | 현재 회전값 (라디안, Y축 회전 주로 사용) |
| `scale` | 선택 | 크기 조정 (기본 1.0) |
| `properties` | 선택 | 추가 속성 (zone, capacity 등) |

### 배치 결과
```json
{
  "placement_mode": "as-is",
  "placement_reasoning": "As-Is 레이아웃: 현재 매장 배치 그대로 구현",
  "position": { "x": 5.2, "y": 0.0, "z": 3.8 }
}
```

---

## Scenario 2: AI 기반 최적 배치

### 목적
AI가 매장 컨텍스트를 분석하여 **최적의 위치**를 자동으로 추천합니다.

### 필수 파일

#### 1. GLB 파일만 업로드
```
Rack_DisplayRack_2.0x1.8x0.6.glb
```

#### 2. 메타데이터 JSON (선택)
```json
{
  "entity_type": "Rack",
  "movable": true,
  "dimensions": { 
    "width": 2.0, 
    "height": 1.8, 
    "depth": 0.6 
  },
  "properties": {
    "capacity": 50,
    "material": "metal"
  }
}
```

**주의**: `current_position` 필드를 **제공하지 않으면** AI가 자동 배치합니다.

### AI 배치 기준

1. **고객 동선 최적화**
   - 출입구에서 자연스러운 흐름
   - 주요 동선상 가시성 확보

2. **안전 거리 유지**
   - 기존 가구와 최소 1.5m 이격
   - 통행로 확보

3. **Zone별 밀도 균형**
   - 과밀 방지
   - 균등 분배

4. **카테고리별 전략**
   - `furniture`: 판매 구역 중심 배치
   - `product`: 진열대 근처 배치
   - `space`: 매장 구조 고려

### 배치 결과
```json
{
  "placement_mode": "ai",
  "placement_reasoning": "출입구에서 5m 거리, 기존 선반과 2m 안전거리 확보, 주요 동선상 가시성 확보",
  "position": { "x": 7.3, "y": 0.0, "z": 4.2 }
}
```

---

## 비교표

| 항목 | As-Is (Scenario 1) | AI 최적 배치 (Scenario 2) |
|------|-------------------|------------------------|
| **목적** | 현재 상태 재현 | 최적화 제안 |
| **메타데이터 JSON** | 필수 | 선택 |
| **current_position** | 필수 | 제공 금지 |
| **배치 방식** | 수동 지정 | AI 자동 추론 |
| **사용 사례** | Before/After 기준점 | 개선안 시뮬레이션 |

---

## 실전 예시

### Case 1: 기존 매장 스캔 후 As-Is 구현
```bash
# 업로드 파일
Shelf_WallShelf_1.5x0.4x0.3.glb
Shelf_WallShelf_1.5x0.4x0.3.json
```

```json
{
  "entity_type": "Shelf",
  "movable": true,
  "dimensions": { "width": 1.5, "height": 0.4, "depth": 0.3 },
  "current_position": { "x": 2.0, "y": 1.5, "z": 10.0 },
  "current_rotation": { "x": 0, "y": 0, "z": 0 },
  "properties": {
    "wall_mounted": true,
    "zone": "fitting_area"
  }
}
```

**결과**: 정확히 (2.0, 1.5, 10.0) 위치에 배치됨

---

### Case 2: 신규 가구 추가 시 AI 배치
```bash
# 업로드 파일
Mannequin_Female_0.4x1.7x0.3.glb
# JSON 파일 없음 (또는 current_position 없는 JSON)
```

**결과**: AI가 분석 후 최적 위치 자동 배치
```
Position: (1.5, 0.0, 2.3)
Reasoning: "출입구 정면 3m 거리, 첫 시선 확보를 위한 배치"
```

---

## Layout Simulation 통합 워크플로우

### Step 1: As-Is 업로드
```bash
# 현재 매장의 모든 가구를 current_position과 함께 업로드
Store_MainStore_20.0x15.0x3.5.glb + JSON
Rack_Main_2.0x1.8x0.6.glb + JSON (current_position 포함)
Shelf_Wall_1.5x0.4x0.3.glb + JSON (current_position 포함)
...
```

### Step 2: Baseline 씬 생성
- `store_scenes` 테이블에 "As-Is Baseline" 씬 저장
- 모든 가구의 현재 위치 기록

### Step 3: AI 시뮬레이션 실행
```typescript
// Layout Simulation API 호출
{
  "scenario_type": "layout_optimization",
  "store_id": "...",
  "target_kpi": "conversion_rate"
}
```

### Step 4: To-Be 씬 생성
- AI가 최적 배치 계산
- `suggested_position` 생성
- "To-Be Optimized" 씬으로 저장

### Step 5: Before/After 비교
```typescript
<BeforeAfterSceneComparison
  beforeSceneId="as-is-scene-id"
  afterSceneId="to-be-scene-id"
/>
```

---

## FAQ

### Q1. current_position이 없으면 어떻게 되나요?
**A**: AI가 자동으로 최적 위치를 계산하여 배치합니다.

### Q2. As-Is와 AI 배치를 섞어서 쓸 수 있나요?
**A**: 가능합니다. 일부 가구는 current_position 제공, 나머지는 AI 자동 배치.

### Q3. 배치 이유를 어떻게 확인하나요?
**A**: `graph_entities.properties.placement_reasoning` 필드에 저장됩니다.

### Q4. 메타데이터 JSON 없이 업로드하면?
**A**: 파일명에서 EntityType과 Dimensions를 추출하고, AI가 자동 배치합니다.

### Q5. Fallback 배치는 언제 발생하나요?
**A**: AI 추론 실패 시 Grid 패턴(3m 간격)으로 자동 배치됩니다.

---

## 관련 문서
- [3D_MODEL_FILENAME_SPECIFICATION.md](./3D_MODEL_FILENAME_SPECIFICATION.md): 파일명 규칙 상세
- [SIMULATION_GUIDE.md](./SIMULATION_GUIDE.md): Layout Simulation 가이드
- [DIGITAL_TWIN_3D_INTEGRATION.md](../DIGITAL_TWIN_3D_INTEGRATION.md): Digital Twin 아키텍처
