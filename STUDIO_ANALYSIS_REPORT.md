# NEURALTWIN 디지털트윈 스튜디오 비교 분석 보고서

## 📋 문서 정보

| 항목 | 내용 |
|-----|------|
| **작성일** | 2024-12-23 |
| **분석자** | Claude Code |
| **목적** | 현재 구조 vs 신규 계획 비교 분석 |

---

## 🏗️ 실제 디렉토리 구조 (확인됨)

```
Customer_Dashboard/
├── src/
│   ├── features/
│   │   ├── studio/                     # ✅ 실제 스튜디오 위치 (digital-twin-studio 아님)
│   │   │   ├── DigitalTwinStudioPage.tsx  # 메인 페이지 (1,320 lines)
│   │   │   ├── core/
│   │   │   │   ├── Canvas3D.tsx           # 3D 렌더링 (374 lines)
│   │   │   │   ├── SceneProvider.tsx      # 상태 관리 Context (770 lines)
│   │   │   │   ├── ModelLoader.tsx
│   │   │   │   ├── SceneEnvironment.tsx
│   │   │   │   ├── SelectionManager.tsx
│   │   │   │   ├── TransformControls.tsx
│   │   │   │   └── PostProcessing.tsx
│   │   │   ├── tabs/
│   │   │   │   ├── AIOptimizationTab.tsx  # AI 최적화 탭 (829 lines)
│   │   │   │   └── AISimulationTab.tsx    # AI 시뮬레이션 탭 (580 lines)
│   │   │   ├── panels/
│   │   │   │   ├── LayerPanel.tsx         # 레이어 패널 (536 lines)
│   │   │   │   ├── SimulationPanel.tsx
│   │   │   │   ├── ToolPanel.tsx
│   │   │   │   ├── PropertyPanel.tsx
│   │   │   │   ├── SceneSavePanel.tsx
│   │   │   │   ├── OverlayControlPanel.tsx
│   │   │   │   ├── OptimizationResultPanel.tsx
│   │   │   │   └── results/
│   │   │   │       ├── LayoutResultPanel.tsx
│   │   │   │       ├── FlowResultPanel.tsx
│   │   │   │       ├── CongestionResultPanel.tsx
│   │   │   │       └── StaffingResultPanel.tsx
│   │   │   ├── components/
│   │   │   │   ├── CustomerAgents.tsx
│   │   │   │   ├── DraggablePanel.tsx
│   │   │   │   ├── SceneComparisonView.tsx
│   │   │   │   └── optimization/
│   │   │   │       ├── OptimizationSettingsPanel.tsx
│   │   │   │       ├── FurnitureSelector.tsx
│   │   │   │       ├── ProductSelector.tsx
│   │   │   │       ├── IntensitySlider.tsx
│   │   │   │       └── ObjectiveSelector.tsx
│   │   │   ├── overlays/
│   │   │   │   ├── HeatmapOverlay.tsx
│   │   │   │   ├── CustomerFlowOverlay.tsx
│   │   │   │   ├── ZoneBoundaryOverlay.tsx
│   │   │   │   ├── CustomerAvatarOverlay.tsx
│   │   │   │   ├── LayoutOptimizationOverlay.tsx
│   │   │   │   ├── FlowOptimizationOverlay.tsx
│   │   │   │   ├── CongestionOverlay.tsx
│   │   │   │   ├── StaffingOverlay.tsx
│   │   │   │   ├── StaffAvatarsOverlay.tsx
│   │   │   │   ├── ZonesFloorOverlay.tsx
│   │   │   │   └── SlotVisualizerOverlay.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSceneSimulation.ts   # 씬 시뮬레이션 훅 (721 lines)
│   │   │   │   ├── useStudioMode.ts
│   │   │   │   ├── useOverlayVisibility.ts
│   │   │   │   ├── useScenePersistence.ts
│   │   │   │   ├── useStoreBounds.ts
│   │   │   │   ├── useStaffData.ts
│   │   │   │   ├── useOptimization.ts
│   │   │   │   └── useFurnitureSlots.ts
│   │   │   ├── models/
│   │   │   │   ├── StoreModel.tsx
│   │   │   │   ├── FurnitureModel.tsx
│   │   │   │   └── ProductModel.tsx
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── scene.types.ts
│   │   │   │   ├── model.types.ts
│   │   │   │   ├── overlay.types.ts
│   │   │   │   ├── simulation.types.ts
│   │   │   │   ├── simulationResults.types.ts
│   │   │   │   └── optimization.types.ts
│   │   │   └── utils/
│   │   │       ├── ToBeSceneGenerator.ts
│   │   │       └── store-context-builder.ts
│   │   │
│   │   ├── simulation/                 # 시뮬레이션 관련 (별도 모듈)
│   │   │   ├── hooks/
│   │   │   │   ├── useSimulationEngine.ts
│   │   │   │   ├── useStoreContext.ts
│   │   │   │   ├── useEnhancedAIInference.ts
│   │   │   │   └── ...
│   │   │   ├── components/
│   │   │   │   └── digital-twin/
│   │   │   │       ├── ChildProductItem.tsx
│   │   │   │       ├── Store3DViewer.tsx
│   │   │   │       └── ...
│   │   │   ├── utils/
│   │   │   │   ├── sceneRecipeGenerator.ts
│   │   │   │   └── modelLayerLoader.ts
│   │   │   └── types/
│   │   │
│   │   ├── insights/, roi/, settings/
│   │
│   ├── hooks/                          # 41개 공통 훅
│   │   ├── useAuth.tsx
│   │   ├── useSelectedStore.tsx
│   │   ├── useSimulationEngine.ts
│   │   ├── useZoneMetrics.ts
│   │   └── ...
│   │
│   ├── store/
│   │   └── dateFilterStore.ts          # Zustand 스토어
│   ├── stores/
│   │   └── simulationStore.ts          # 실시간 시뮬레이션 스토어 (430 lines)
│   │
│   ├── components/ui/                  # shadcn/ui (48개 컴포넌트)
│   │
│   └── types/
│       └── database.types.ts
│
└── supabase/functions/                 # Edge Functions (20개)
    ├── advanced-ai-inference/          # AI 추론 통합
    ├── generate-optimization/          # 레이아웃 최적화 (769 lines)
    ├── retail-ai-inference/
    └── ...
```

---

## 📊 현재 탭/패널 구조 분석

### 현재 구조 (3탭 시스템)

```
┌──────────────────────────────────────────────────────────────────┐
│           DigitalTwinStudioPage.tsx (메인 페이지)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  좌측 패널 (고정, w-80)              3D 캔버스 (중앙)              │
│  ┌────────────────────┐            ┌─────────────────────────┐   │
│  │ [레이어] [AI최적화]  │            │                         │   │
│  │ [AI시뮬레이션]      │            │   Canvas3D              │   │
│  │                    │            │   + SceneProvider       │   │
│  │ 탭 컨텐츠:         │            │   + Overlays            │   │
│  │ - LayerPanel       │            │   + CustomerAgents      │   │
│  │ - AIOptimizationTab│            │                         │   │
│  │ - AISimulationTab  │            └─────────────────────────┘   │
│  └────────────────────┘                                          │
│                                                                   │
│  드래그 가능 패널들 (DraggablePanel):                             │
│  - ToolPanel (도구)                                              │
│  - OverlayControlPanel (오버레이)                                 │
│  - SceneSavePanel (씬 저장)                                      │
│  - PropertyPanel (속성)                                          │
│  - LayoutResultPanel, FlowResultPanel, ... (시뮬레이션 결과)      │
│                                                                   │
│  하단 중앙: 시뮬레이션 실행 버튼                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 탭 상세 분석

| 탭 | 파일 | 라인 수 | 주요 기능 |
|---|------|---------|----------|
| **레이어** | `LayerPanel.tsx` | 536 | 모델 계층 구조, 가시성 토글, 씬 저장/불러오기 |
| **AI 최적화** | `AIOptimizationTab.tsx` | 829 | 레이아웃/인력배치 최적화, 목표 선택, 상세 설정, As-Is/To-Be 비교 |
| **AI 시뮬레이션** | `AISimulationTab.tsx` | 580 | 실시간 고객 시뮬레이션, 혼잡도 분석, 시간 컨트롤 |

---

## 🔄 상태 관리 분석

### 현재 상태 관리 체계

| 위치 | 방식 | 용도 |
|-----|------|------|
| `SceneProvider.tsx` | React Context + useReducer | 3D 씬 상태 (모델, 선택, 오버레이, 카메라) |
| `simulationStore.ts` | Zustand | 실시간 고객 시뮬레이션 (에이전트, KPI) |
| `dateFilterStore.ts` | Zustand | 날짜 필터 상태 |
| `useSceneSimulation.ts` | useState + useMutation | As-Is/To-Be 씬 시뮬레이션 |

### SceneProvider 상태 구조

```typescript
interface SceneState {
  mode: StudioMode;              // 'view' | 'edit' | 'simulate'
  models: Model3D[];             // 모든 3D 모델 (공간, 가구, 제품)
  layers: SceneLayer[];          // 레이어 목록
  selectedId: string | null;     // 선택된 모델 ID
  hoveredId: string | null;      // 호버된 모델 ID
  activeOverlays: string[];      // 활성 오버레이 목록
  camera: CameraSettings;        // 카메라 설정
  isDirty: boolean;              // 변경 여부
}
```

### simulationStore 상태 구조

```typescript
interface SimulationState {
  status: SimulationStatus;      // 'stopped' | 'running' | 'paused' | 'completed'
  config: SimulationConfig;      // 속도, 최대 고객 수, 스폰율 등
  customers: CustomerAgent[];    // 고객 에이전트 목록
  kpi: SimulationKPI;            // 현재 고객 수, 매출, 전환율 등
  isRunning: boolean;
  isPaused: boolean;
  simulationTime: number;
}
```

---

## 🔌 연동 분석

### 주요 Hooks

| Hook | 위치 | 기능 |
|------|------|------|
| `useSceneSimulation` | studio/hooks | As-Is → To-Be 시뮬레이션, Edge Function 호출 |
| `useSimulationEngine` | hooks | 실시간 고객 AI 에이전트 엔진 |
| `useStoreContext` | simulation/hooks | 매장 컨텍스트 데이터 로드 |
| `useEnhancedAIInference` | simulation/hooks | AI 추론 상태 |
| `useStoreBounds` | studio/hooks | 매장 경계 및 존 위치 |
| `useStaffData` | studio/hooks | 스태프 데이터 로드 |

### Edge Function 연동

| Edge Function | 호출 위치 | 기능 |
|--------------|----------|------|
| `advanced-ai-inference` | useSceneSimulation | layout/flow/staffing 최적화 |
| `generate-optimization` | 직접 호출 가능 | 슬롯 기반 제품/가구 배치 최적화 |

---

## 📋 비교 분석 매트릭스

### ✅ 그대로 재사용 (AS-IS)

| 컴포넌트/파일 | 경로 | 용도 | 비고 |
|--------------|------|------|------|
| shadcn/ui 컴포넌트 | `src/components/ui/` | 기본 UI (48개) | 전체 재사용 |
| useAuth | `src/hooks/useAuth.tsx` | 인증 | 그대로 사용 |
| useSelectedStore | `src/hooks/useSelectedStore.tsx` | 매장 선택 | 그대로 사용 |
| Canvas3D | `studio/core/Canvas3D.tsx` | 3D 렌더링 | 그대로 사용 |
| SceneProvider | `studio/core/SceneProvider.tsx` | 씬 상태 관리 | 그대로 사용 |
| ModelLoader | `studio/core/ModelLoader.tsx` | 모델 로딩 | 그대로 사용 |
| DraggablePanel | `studio/components/DraggablePanel.tsx` | 드래그 패널 | 그대로 사용 |
| 모든 Overlays | `studio/overlays/` | 10개 오버레이 | 그대로 사용 |
| simulationStore | `stores/simulationStore.ts` | 실시간 시뮬레이션 | 그대로 사용 |
| CustomerAgents | `studio/components/CustomerAgents.tsx` | 고객 에이전트 렌더링 | 그대로 사용 |
| useSimulationEngine | `hooks/useSimulationEngine.ts` | 고객 시뮬레이션 엔진 | 그대로 사용 |
| useSceneSimulation | `studio/hooks/useSceneSimulation.ts` | 씬 시뮬레이션 | 그대로 사용 |
| generate-optimization | `supabase/functions/` | 레이아웃 최적화 | 그대로 사용 |
| advanced-ai-inference | `supabase/functions/` | AI 추론 통합 | 그대로 사용 |

### 🔄 수정 후 재사용 (MODIFY)

| 컴포넌트/파일 | 경로 | 현재 기능 | 수정 내용 | 우선순위 |
|--------------|------|----------|----------|---------|
| **DigitalTwinStudioPage** | studio/ | 3탭 구조 | 4패널 구조로 변경, 탭 순서 변경 | **높음** |
| **LayerPanel** | studio/panels/ | 평면 리스트 | 계층 트리 구조 강화, 제품 개별 가시성 이미 구현됨 | 중간 |
| **AIOptimizationTab** | studio/tabs/ | 최적화+설정 | 진단 연계 강화, UI 정리 | 중간 |
| **AISimulationTab** | studio/tabs/ | 시뮬레이션 | 진단 기능 추가, 퀵 토글 바 추가 | 중간 |
| OptimizationSettingsPanel | studio/components/ | 상세 설정 | 새 패널 구조에 맞게 조정 | 낮음 |

### 🆕 신규 생성 (CREATE)

| 컴포넌트/파일 | 경로 | 용도 | Phase |
|--------------|------|------|-------|
| **ApplyPanel** | studio/panels/ | 4번 패널: 실매장 적용, ROI 연계 | Phase 4 |
| QuickToggleBar | studio/components/ | 3D 뷰어 상단 퀵 토글 바 | Phase 2 |
| DiagnosisResultCard | studio/components/ | 진단 결과 카드 UI | Phase 2 |
| ScenarioManager | studio/components/ | 시나리오 저장/관리 UI | Phase 3 |
| useScenarioHistory | studio/hooks/ | 시나리오 히스토리 관리 | Phase 3 |
| ROI측정Modal | studio/components/ | ROI 측정 모달 | Phase 4 |

### 🔗 연결/연동 (CONNECT)

| From | To | 연결 방식 | 비고 |
|------|-----|----------|------|
| **ApplyPanel (신규)** | ROI 페이지 (`/roi`) | react-router 딥링크 | 새 패널 |
| AISimulationTab | useSimulationStore | Hook import | 기존 연동 유지 |
| AIOptimizationTab | useSceneSimulation | Hook import | 기존 연동 유지 |
| AIOptimizationTab | advanced-ai-inference | Edge Function 호출 | 기존 연동 유지 |
| LayoutOptimizationOverlay | SceneProvider | applySimulationResults | 기존 연동 유지 |

### 🗑️ 제거 또는 대체 (REMOVE/REPLACE)

| 컴포넌트/파일 | 이유 | 대체 |
|--------------|------|------|
| 기존 3탭 UI 구조 | 4패널로 변경 | 새 패널 구조 |
| 탭 순서 (레이어→AI최적화→AI시뮬) | 순서 변경 | 레이어→AI시뮬→AI최적화→적용하기 |

---

## 🎯 패널 매핑 (기존 → 신규)

| 기존 탭 | 신규 패널 | 매핑 관계 | 작업 내용 |
|--------|----------|----------|----------|
| 레이어 탭 | 1. 레이어 | 1:1 확장 | 계층 구조 이미 구현됨, 제품 개별 가시성 이미 구현됨 |
| AI 시뮬레이션 탭 | 2. AI 시뮬레이션 | 1:1 확장 | 진단 기능 추가 필요, 퀵 토글 추가 |
| AI 최적화 탭 | 3. AI 최적화 | 1:1 확장 | 진단 연계 강화, 시나리오 관리 추가 |
| (없음) | 4. 적용하기 | 신규 | 시나리오 저장, 실매장 적용, ROI 연계 |

---

## 🔧 Hook 매핑

| 기존 Hook | 변경 사항 |
|----------|----------|
| useSceneSimulation | 진단 결과 반환 포맷 추가 가능 |
| useStoreContext | 그대로 사용 |
| useSimulationEngine | 그대로 사용 |
| useOverlayVisibility | 그대로 사용 |
| useScenePersistence | 그대로 사용 |
| (신규 필요) useScenarioManager | 시나리오 CRUD |

---

## 📡 Edge Function 매핑

| 기존 Function | 변경 사항 |
|--------------|----------|
| advanced-ai-inference | 그대로 사용 (layout/flow/staffing/congestion 지원) |
| generate-optimization | 그대로 사용 (슬롯 기반 최적화) |
| (신규 필요) | 필요시 scene-environment, scene-sales 추가 |

---

## 📈 구현 우선순위 및 단계

### Phase 0: 사전 준비
- [ ] 현재 코드 백업
- [ ] 기존 테스트 확인

### Phase 1: 탭 구조 변경 (높음)
- [ ] DigitalTwinStudioPage.tsx에서 탭 순서 변경
- [ ] 탭 이름 변경: AI시뮬레이션 ↔ AI최적화 순서 교체
- [ ] 4번째 탭 "적용하기" 추가 (빈 컴포넌트)

### Phase 2: AI 시뮬레이션 강화 (중간)
- [ ] 진단 기능 UI 추가
- [ ] QuickToggleBar 컴포넌트 추가
- [ ] 진단 결과 시각화

### Phase 3: AI 최적화 강화 (중간)
- [ ] 진단 결과 연계
- [ ] 시나리오 관리 기능 추가
- [ ] 최적화 결과 히스토리

### Phase 4: 적용하기 패널 (중간)
- [ ] ApplyPanel 컴포넌트 생성
- [ ] 시나리오 저장 기능
- [ ] ROI 페이지 연계
- [ ] 실매장 적용 워크플로우

---

## ✅ 완료 체크리스트

### 분석 완료
- [x] Task 1: 디렉토리 구조 파악
- [x] Task 2: 메인 페이지 분석
- [x] Task 3: 기존 탭 컴포넌트 분석
- [x] Task 4: 패널 컴포넌트 분석
- [x] Task 5: 3D 뷰어 분석
- [x] Task 6: 시뮬레이션 엔진 분석
- [x] Task 7: Edge Function 분석
- [x] Task 8: 상태 관리 분석
- [x] Task 9: 타입 정의 분석
- [x] Task 10: UI 컴포넌트 확인

### 산출물
- [x] 비교 분석 매트릭스 작성
- [x] 재사용/수정/신규/연결 분류 완료
- [x] 구현 우선순위 확정

---

## 🔍 주요 발견 사항

### 긍정적 발견
1. **실제 구조가 문서보다 더 잘 정리됨**: `src/features/studio/`에 모든 스튜디오 관련 코드가 체계적으로 구성됨
2. **제품 개별 가시성 이미 구현됨**: `SceneProvider.toggleProductVisibility()` 및 `LayerPanel`에서 childProduct 개별 가시성 토글 지원
3. **슬롯 기반 배치 이미 구현됨**: `generate-optimization` Edge Function에서 슬롯 호환성 기반 제품 배치 지원
4. **상태 관리 체계 정립됨**: SceneProvider(Context) + simulationStore(Zustand) 조합
5. **10개 오버레이 완비**: 히트맵, 동선, 존, 고객, 스태프 등 모든 시각화 오버레이 구현됨

### 수정 필요 사항
1. **탭 순서 변경 필요**: 현재 `레이어 → AI최적화 → AI시뮬레이션` → `레이어 → AI시뮬레이션 → AI최적화 → 적용하기`
2. **진단 기능 부재**: AI시뮬레이션 탭에 진단 결과 UI 추가 필요
3. **적용하기 패널 부재**: 4번째 패널 신규 생성 필요
4. **ROI 연계 부재**: 적용하기 패널에서 ROI 페이지로 딥링크 필요

---

## 📎 참고: 데이터 현황 (콘솔 로그 기반)

- products: 25개
- product_models: 60개
- furniture: 68개
- furniture_slots: 176개
- staff: 8개
- customers: 2,500명
- zones: 7개
- childProducts (가구 배치): 175개

---

*분석 완료: 2024-12-23*
