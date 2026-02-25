# NEURALTWIN 기능 테스트 가이드 v2.0

## 📋 문서 정보
| 항목 | 값 |
|------|-----|
| Store ID | `d9830554-2688-4032-af40-acccda787ac4` |
| User ID | `e4200130-08e8-47da-8c92-3d0b90fafd77` |
| Supabase Project ID | `bdrvowacecxnraaivlhr` |
| 버전 | 2.0 |
| 최종 수정일 | 2026-01-05 |

---

# 📊 프로젝트 구현 현황 요약

## 전체 현황 Dashboard

| 구분 | 항목 수 | 완료 | 부분작동 | 미작동 |
|------|--------|------|---------|--------|
| 메인 페이지 | 4 | ✅ 4 | - | - |
| Edge Functions | 22 | ✅ 20 | ⚠️ 2 | - |
| Studio 훅 | 21 | ✅ 19 | ⚠️ 2 | - |
| Studio 패널 | 9 | ✅ 9 | - | - |
| Studio 오버레이 | 11 | ✅ 10 | ⚠️ 1 | - |
| 필수 데이터 테이블 | 10 | ✅ 6 | ⚠️ 2 | ❌ 2 |

---

# 🏗️ 프로젝트 아키텍처

## 디렉토리 구조
```
src/
├── features/
│   ├── studio/              # 🎯 디지털트윈 스튜디오 (핵심)
│   │   ├── core/            # 3D 캔버스, 씬 관리
│   │   ├── tabs/            # AI최적화, AI시뮬레이션, 적용
│   │   ├── panels/          # 레이어, 시뮬레이션, Ultimate분석
│   │   ├── hooks/           # 21개 훅 (시뮬레이션, 최적화)
│   │   ├── overlays/        # 히트맵, 동선, 혼잡도 시각화
│   │   ├── components/      # 공통 컴포넌트
│   │   ├── services/        # 환경 데이터 서비스
│   │   ├── types/           # 타입 정의
│   │   └── utils/           # 유틸리티
│   ├── insights/            # 인사이트 허브 (6개 탭)
│   │   ├── tabs/            # Overview, Store, Customer, Product, Prediction, AI
│   │   ├── hooks/           # 데이터 훅
│   │   └── components/      # 공통 컴포넌트
│   ├── roi/                 # ROI 측정 대시보드
│   │   ├── components/      # ROI 컴포넌트
│   │   ├── hooks/           # ROI 훅
│   │   └── types/           # 타입 정의
│   ├── simulation/          # 시뮬레이션 엔진
│   ├── data-management/     # 데이터 관리
│   └── settings/            # 설정
├── hooks/                   # 전역 훅
├── stores/                  # 상태 관리
└── integrations/supabase/   # Supabase 연동

supabase/functions/
├── generate-optimization/   # 🆕 Ultimate AI 최적화 (1,449줄)
│   ├── ai/                  # 프롬프트 빌더
│   ├── data/                # 환경/동선/연관 분석
│   ├── prediction/          # 매출/전환 예측
│   ├── vmd/                 # VMD 엔진
│   └── feedback/            # 자동 학습
├── advanced-ai-inference/   # AI 추론 엔진 (4,715줄)
├── environment-proxy/       # 날씨/공휴일 프록시 (367줄)
└── [19개 기타 함수...]
```

## 메인 라우트 (4개)
| 경로 | 페이지 | 파일 위치 | 상태 |
|------|--------|----------|------|
| `/` or `/insights` | Insight Hub | `src/features/insights/InsightHubPage.tsx` | ✅ |
| `/studio` | Digital Twin Studio | `src/features/studio/DigitalTwinStudioPage.tsx` | ✅ |
| `/roi` | ROI 측정 | `src/features/roi/ROIMeasurementPage.tsx` | ✅ |
| `/settings` | 설정 | `src/features/settings/SettingsPage.tsx` | ✅ |

## Edge Functions (22개)
| 함수명 | 줄 수 | 용도 | 상태 |
|--------|------|------|------|
| `generate-optimization` | 1,449 | 🆕 Ultimate AI 레이아웃 최적화 | ✅ |
| `advanced-ai-inference` | 4,715 | 고급 AI 추론 + 슬롯 시스템 | ✅ |
| `unified-ai` | 1,094 | 통합 AI (추천/이상탐지) | ✅ |
| `unified-etl` | 713 | 통합 ETL | ✅ |
| `datasource-mapper` | 642 | 데이터소스 매핑 | ✅ |
| `run-simulation` | 619 | 시뮬레이션 실행 | ✅ |
| `retail-ai-inference` | 615 | 리테일 AI 추론 | ✅ |
| `simulation-data-mapping` | 561 | 시뮬레이션 데이터 매핑 | ✅ |
| `import-with-ontology` | 485 | 온톨로지 기반 임포트 | ✅ |
| `integrated-data-pipeline` | 451 | 통합 데이터 파이프라인 | ✅ |
| `auto-process-3d-models` | 420 | 3D 모델 자동 처리 | ✅ |
| `smart-ontology-mapping` | 404 | 온톨로지 매핑 | ✅ |
| `environment-proxy` | 367 | 날씨/공휴일 API 프록시 | ✅ |
| `sync-api-data` | 359 | 외부 API 동기화 | ✅ |
| `graph-query` | 307 | 그래프 쿼리 | ✅ |
| `auto-map-etl` | 298 | 자동 ETL 매핑 | ✅ |
| `process-wifi-data` | 286 | WiFi 데이터 처리 | ✅ |
| `aggregate-dashboard-kpis` | 192 | KPI 집계 | ✅ |
| `aggregate-all-kpis` | 191 | 전체 KPI 집계 | ✅ |
| `inventory-monitor` | 169 | 재고 모니터링 | ✅ |
| `analyze-3d-model` | 156 | 3D 모델 분석 | ✅ |
| `etl-scheduler` | 79 | ETL 스케줄러 | ✅ |

---

# 🆕 Ultimate AI 최적화 시스템 (신규)

## 개요
`generate-optimization` Edge Function에 통합된 고급 AI 분석 시스템

### 모듈 구성
| 모듈 | 파일 | 기능 |
|------|------|------|
| 환경 분석 | `data/environmentLoader.ts` | 날씨/이벤트 영향 분석 |
| 동선 분석 | `data/flowAnalyzer.ts` | 고객 동선 패턴 분석 |
| 연관 분석 | `data/associationMiner.ts` | 상품 연관 규칙 마이닝 |
| 프롬프트 빌더 | `ai/promptBuilder.ts` | Chain-of-Thought 프롬프트 |
| 매출 예측 | `prediction/revenuePredictor.ts` | 배치 변경별 매출 예측 |
| 전환 예측 | `prediction/conversionPredictor.ts` | 전환율 예측 |
| VMD 엔진 | `vmd/vmdEngine.ts` | VMD 점수 및 위반 분석 |
| 자동 학습 | `feedback/autoLearning.ts` | 파라미터 자동 최적화 |

### 프론트엔드 통합
| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| UltimateAnalysisPanel | `panels/UltimateAnalysisPanel.tsx` | Ultimate 분석 결과 표시 |
| AIOptimizationTab | `tabs/AIOptimizationTab.tsx` | 최적화 탭 (Ultimate 통합) |
| useSceneSimulation | `hooks/useSceneSimulation.ts` | Ultimate API 호출 |

### 타입 정의
- **파일:** `types/simulationResults.types.ts`
- **추가된 타입:**
  - `UltimateOptimizationResponse`
  - `FlowAnalysisSummary`
  - `EnvironmentSummary`
  - `AssociationSummary`
  - `PredictionSummary`
  - `VMDAnalysis`
  - `LearningSession`

---

# 1. Digital Twin Studio (디지털트윈 스튜디오)

## 1.1 스튜디오 메인 페이지

### 파일 위치
- **메인:** `src/features/studio/DigitalTwinStudioPage.tsx`
- **3D 코어:** `src/features/studio/core/`
  - `Canvas3D.tsx` - 3D 캔버스
  - `SceneProvider.tsx` - 씬 컨텍스트
  - `ModelLoader.tsx` - 모델 로더

### 탭 구성
| 탭 | 파일 | 기능 |
|----|------|------|
| 레이어 | `tabs/` (패널 사용) | 가구/상품 레이어 관리 |
| AI 시뮬레이션 | `tabs/AISimulationTab.tsx` | 동선/혼잡/인력 시뮬레이션 |
| AI 최적화 | `tabs/AIOptimizationTab.tsx` | 🆕 Ultimate AI 최적화 |
| 적용 | `tabs/ApplyPanel.tsx` | 변경사항 적용 |

### 테스트 방법
1. `/studio` 접속
2. 3D 캔버스 로딩 확인 (2-5초)
3. 마우스 드래그로 회전
4. 스크롤로 줌 인/아웃
5. 가구 클릭 시 선택 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 3D 캔버스 로딩 | | |
| GLB 모델 렌더링 | | |
| 카메라 회전 | | |
| 줌 인/아웃 | | |
| 오브젝트 선택 | | |
| 탭 전환 | | |

---

## 1.2 AI 최적화 탭 (Ultimate 통합)

### 파일 위치
- **메인:** `src/features/studio/tabs/AIOptimizationTab.tsx` (45,949 bytes)
- **패널:** `src/features/studio/panels/UltimateAnalysisPanel.tsx` (18,696 bytes)
- **훅:** `src/features/studio/hooks/useSceneSimulation.ts` (27,198 bytes)

### API 호출
```bash
# generate-optimization (Ultimate)
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/generate-optimization" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "optimization_type": "both",
    "parameters": {
      "prioritize_revenue": true,
      "max_changes": 30
    }
  }'
```

### 응답 구조 (Ultimate)
```json
{
  "success": true,
  "result": {
    "furniture_changes": [...],
    "product_changes": [...],
    "summary": {
      "total_furniture_changes": 5,
      "total_product_changes": 12,
      "expected_revenue_increase": 15.2,
      "expected_conversion_increase": 8.5,
      "overall_confidence": 0.83
    }
  },
  "environment_summary": {
    "weather": { "condition": "sunny", "temperature": 15 },
    "events": [...],
    "temporal": { "dayOfWeek": "월요일", "isWeekend": false },
    "impact_multipliers": { "traffic": 1.1, "conversion": 1.05 }
  },
  "flow_analysis_summary": {
    "flow_health_score": 72,
    "total_zones": 10,
    "key_paths": [...],
    "bottlenecks": [...],
    "dead_zones": [...],
    "opportunities": [...]
  },
  "association_summary": {
    "strong_rules_count": 5,
    "top_rules": [...],
    "recommendations": [...]
  },
  "prediction_summary": {
    "predictions_applied": 12,
    "high_confidence_changes": 8,
    "total_expected_revenue_change": 15.2,
    "total_daily_revenue_increase": 125000,
    "overall_confidence": 83
  },
  "vmd_analysis": {
    "score": {
      "overall": 55,
      "grade": "D",
      "balance": 60,
      "visibility": 50,
      "flow_integration": 55,
      "category_coherence": 55
    },
    "violations": [...],
    "recommendations": [...]
  },
  "learning_session": null
}
```

### Ultimate 분석 패널 섹션
| 섹션 | 표시 항목 | 상태 |
|------|----------|------|
| 전체 신뢰도 | 신뢰도 % 배지 | ✅ |
| 동선 분석 | 건강도, 병목, 데드존, 기회 | ✅ |
| VMD 점수 | 등급, 세부점수, 위반사항 | ✅ |
| 환경 영향 | 날씨, 이벤트, 시간대 | ⚠️ 데이터 부족 |
| 연관 분석 | 규칙 수, 상위 규칙, 배치 추천 | ⚠️ 데이터 부족 |
| 예측 분석 | 매출 변화, 신뢰도 | ✅ |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| "최적화 실행" 버튼 클릭 | | |
| 로딩 스피너 표시 | | |
| Ultimate 분석 패널 렌더링 | | |
| 동선 분석 섹션 접기/펼치기 | | |
| VMD 점수 표시 | | |
| 환경 영향 표시 | | weather_data 필요 |
| 연관 상품 표시 | | association 데이터 필요 |
| 예측 분석 표시 | | |
| 가구 추천 목록 | | |
| 상품 추천 목록 | | |
| 3D 하이라이트 | | |

---

## 1.3 AI 시뮬레이션 탭

### 파일 위치
- **메인:** `src/features/studio/tabs/AISimulationTab.tsx` (29,413 bytes)
- **훅:**
  - `useLayoutSimulation.ts` (19,382 bytes)
  - `useFlowSimulation.ts` (25,065 bytes)
  - `useCongestionSimulation.ts` (18,998 bytes)
  - `useStaffingSimulation.ts` (21,438 bytes)

### 시뮬레이션 유형
| 유형 | 설명 | 데이터 소스 |
|------|------|-----------|
| 레이아웃 | 가구 배치 최적화 | `furniture`, `zones_dim` |
| 동선 | 고객 동선 분석 | `zone_transitions` |
| 혼잡도 | 혼잡 구역 분석 | `zone_metrics` |
| 인력 배치 | 직원 최적화 | `staff_schedules` |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 레이아웃 시뮬레이션 | | |
| 동선 시뮬레이션 | | zone_transitions 필요 |
| 혼잡도 시뮬레이션 | | |
| 인력 배치 시뮬레이션 | | |
| 통합 시뮬레이션 | | |
| 결과 패널 표시 | | |
| 3D 오버레이 반영 | | |

---

## 1.4 패널 시스템

### 패널 목록
| 패널 | 파일 | 크기 | 기능 |
|------|------|------|------|
| LayerPanel | `panels/LayerPanel.tsx` | 26KB | 레이어 관리 |
| UltimateAnalysisPanel | `panels/UltimateAnalysisPanel.tsx` | 19KB | 🆕 Ultimate 분석 |
| OptimizationResultPanel | `panels/OptimizationResultPanel.tsx` | 17KB | 최적화 결과 |
| SimulationPanel | `panels/SimulationPanel.tsx` | 14KB | 시뮬레이션 설정 |
| PropertyPanel | `panels/PropertyPanel.tsx` | 9KB | 속성 편집 |
| OverlayControlPanel | `panels/OverlayControlPanel.tsx` | 9KB | 오버레이 토글 |
| ToolPanel | `panels/ToolPanel.tsx` | 8KB | 도구 모음 |
| SceneSavePanel | `panels/SceneSavePanel.tsx` | 7KB | 씬 저장/불러오기 |

### 결과 패널 (results/)
| 패널 | 용도 |
|------|------|
| LayoutResultPanel | 레이아웃 결과 |
| FlowResultPanel | 동선 결과 |
| CongestionResultPanel | 혼잡도 결과 |
| StaffingResultPanel | 인력 결과 |

---

## 1.5 오버레이 시스템

### 오버레이 목록
| 오버레이 | 파일 | 기능 | 상태 |
|----------|------|------|------|
| HeatmapOverlay | `HeatmapOverlay.tsx` | 방문자 밀도 | ✅ |
| CustomerFlowOverlay | `CustomerFlowOverlay.tsx` | 고객 동선 기본 | ✅ |
| CustomerFlowOverlayEnhanced | `CustomerFlowOverlayEnhanced.tsx` | 고객 동선 강화 (zone_transitions) | ⚠️ |
| ZoneBoundaryOverlay | `ZoneBoundaryOverlay.tsx` | 구역 경계 | ✅ |
| ZonesFloorOverlay | `ZonesFloorOverlay.tsx` | 구역 바닥 | ✅ |
| LayoutOptimizationOverlay | `LayoutOptimizationOverlay.tsx` | 레이아웃 제안 | ✅ |
| FlowOptimizationOverlay | `FlowOptimizationOverlay.tsx` | 동선 최적화 | ✅ |
| CongestionOverlay | `CongestionOverlay.tsx` | 혼잡도 | ✅ |
| StaffingOverlay | `StaffingOverlay.tsx` | 인력 배치 | ✅ |
| StaffAvatarsOverlay | `StaffAvatarsOverlay.tsx` | 직원 아바타 | ✅ |
| StaffReallocationOverlay | `StaffReallocationOverlay.tsx` | 인력 재배치 | ✅ |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 히트맵 토글 | | |
| 동선 화살표 표시 | | zone_transitions 데이터 필요 |
| 구역 라벨 표시 | | |
| 혼잡도 색상 | | |
| 인력 배치 아이콘 | | |

---

## 1.6 환경 설정 (날씨/이벤트)

### 파일 위치
- **컴포넌트:** `components/SimulationEnvironmentSettings.tsx` (23,527 bytes)
- **서비스:** `services/environmentDataService.ts`
- **타입:** `types/environment.types.ts` (11,351 bytes)

### API 호출
```bash
# 날씨 조회 + DB 저장
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather",
    "lat": 37.5665,
    "lon": 126.9780,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'

# 공휴일 조회 + DB 저장
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "holidays",
    "year": 2026,
    "month": 1,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'
```

### 데이터 소스
| 테이블 | 용도 | 현재 상태 |
|--------|------|----------|
| `weather_data` | 날씨 데이터 | ❌ 비어있음 |
| `holidays_events` | 공휴일/이벤트 | ⚠️ 확인 필요 |
| `zone_events` | 매장 이벤트 | ⚠️ 확인 필요 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 환경 설정 패널 열기 | | |
| 실시간 날씨 로드 | | API 키 필요 |
| 과거 날씨 조회 | | DB 데이터 필요 |
| 공휴일 표시 | | |
| 환경 영향도 계산 | | |
| DB 저장 확인 | | |

---

## 1.7 훅 시스템

### 훅 목록 (21개)
| 훅 | 파일 | 크기 | 용도 |
|----|------|------|------|
| useSceneSimulation | `useSceneSimulation.ts` | 27KB | 🆕 통합 시뮬레이션 + Ultimate |
| useFlowSimulation | `useFlowSimulation.ts` | 25KB | 동선 시뮬레이션 |
| useStaffingSimulation | `useStaffingSimulation.ts` | 21KB | 인력 시뮬레이션 |
| useLayoutSimulation | `useLayoutSimulation.ts` | 19KB | 레이아웃 시뮬레이션 |
| useCongestionSimulation | `useCongestionSimulation.ts` | 19KB | 혼잡도 시뮬레이션 |
| useCustomerFlowData | `useCustomerFlowData.ts` | 17KB | 고객 동선 데이터 |
| useSceneRecipe | `useSceneRecipe.ts` | 14KB | 씬 레시피 관리 |
| usePlacement | `usePlacement.ts` | 13KB | 배치 관리 |
| useOptimization | `useOptimization.ts` | 12KB | 최적화 API |
| useFurnitureSlots | `useFurnitureSlots.ts` | 11KB | 슬롯 시스템 |
| useEnvironmentContext | `useEnvironmentContext.ts` | 10KB | 환경 컨텍스트 |
| useStoreBounds | `useStoreBounds.ts` | 8KB | 매장 경계 |
| useStaffData | `useStaffData.ts` | 6KB | 직원 데이터 |
| useScenePersistence | `useScenePersistence.ts` | 5KB | 씬 저장 |
| useSpaceTextures | `useSpaceTextures.ts` | 4KB | 공간 텍스처 |
| useEnvironmentModels | `useEnvironmentModels.ts` | 4KB | 환경 모델 |
| useCustomerSimulation | `useCustomerSimulation.ts` | 4KB | 고객 시뮬레이션 |
| useOverlayVisibility | `useOverlayVisibility.ts` | 2KB | 오버레이 표시 |
| useStudioMode | `useStudioMode.ts` | 1KB | 스튜디오 모드 |

---

# 2. Insight Hub (인사이트 허브)

## 2.1 페이지 구조

### 파일 위치
- **메인:** `src/features/insights/InsightHubPage.tsx` (8,768 bytes)
- **탭:** `src/features/insights/tabs/`

### 탭 구성
| 탭 | 파일 | 크기 | 기능 |
|----|------|------|------|
| 개요 | `OverviewTab.tsx` | 27KB | KPI 대시보드 |
| 매장 | `StoreTab.tsx` | 36KB | 매장/구역 분석 |
| 고객 | `CustomerTab.tsx` | 43KB | 고객 세그먼트/퍼널 |
| 상품 | `ProductTab.tsx` | 31KB | 상품 성과 |
| 예측 | `PredictionTab.tsx` | 41KB | AI 예측 |
| AI추천 | `AIRecommendationTab.tsx` | 43KB | AI 추천 |

---

## 2.2 개요 탭 (Overview)

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `dashboard_kpis` | 일별 KPI |
| `daily_kpis_agg` | 집계 KPI |
| `stores` | 매장 정보 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| KPI 카드 렌더링 (매출/방문자/전환율/객단가) | | |
| 매출 트렌드 차트 | | |
| 시간대별 방문자 차트 | | |
| 전일 대비 변화율 표시 | | |
| 날짜 필터 동작 | | |

---

## 2.3 매장 탭 (Store)

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `zones_dim` | 구역 정보 |
| `zone_metrics` | 구역별 지표 |
| `zone_daily_metrics` | 일별 구역 지표 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 구역 목록 로딩 | | |
| 구역별 체류시간 | | |
| 구역별 방문자 수 | | |
| 히트맵 렌더링 | | |

---

## 2.4 고객 탭 (Customer)

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `customer_segments` | 고객 세그먼트 |
| `customer_segments_agg` | 세그먼트 집계 |
| `funnel_events` | 퍼널 이벤트 |
| `funnel_metrics` | 퍼널 지표 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 세그먼트 파이 차트 | | |
| 퍼널 시각화 | | |
| 체류시간 분포 | | |
| 재방문율 | | |

---

## 2.5 상품 탭 (Product)

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `products` | 상품 마스터 |
| `product_performance_agg` | 상품 성과 |
| `inventory` | 재고 현황 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 상품 목록 로딩 | | |
| 매출/판매량/전환율 | | |
| 카테고리 필터 | | |
| 정렬 기능 | | |

---

## 2.6 예측 탭 (Prediction)

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `ai_inference_results` | AI 추론 결과 |
| `trend_signals` | 트렌드 신호 |
| `daily_kpis_agg` | 과거 KPI |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 매출 예측 차트 | | |
| 방문자 예측 | | |
| 신뢰 구간 표시 | | |
| 7일/30일 예측 | | |

---

## 2.7 AI 추천 탭

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `ai_recommendations` | AI 추천 목록 |
| `ai_insights` | AI 인사이트 |
| `applied_strategies` | 적용된 전략 |

### API 호출
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_recommendations",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'
```

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 추천 목록 로딩 | | |
| 우선순위 필터 | | |
| 카테고리 필터 | | |
| 추천 적용 기능 | | |

---

# 3. ROI 측정 페이지

## 3.1 페이지 구조

### 파일 위치
- **메인:** `src/features/roi/ROIMeasurementPage.tsx` (6,126 bytes)
- **컴포넌트:** `src/features/roi/components/`
- **훅:** `src/features/roi/hooks/`

### 컴포넌트 목록
| 컴포넌트 | 파일 | 크기 | 기능 |
|----------|------|------|------|
| AppliedStrategyTable | `AppliedStrategyTable.tsx` | 19KB | 적용 전략 테이블 |
| StrategyDetailModal | `StrategyDetailModal.tsx` | 12KB | 전략 상세 모달 |
| AIInsightsCard | `AIInsightsCard.tsx` | 11KB | AI 인사이트 |
| CategoryPerformanceTable | `CategoryPerformanceTable.tsx` | 11KB | 카테고리별 성과 |
| ApplyStrategyModal | `ApplyStrategyModal.tsx` | 9KB | 전략 적용 모달 |
| ROISummaryCards | `ROISummaryCards.tsx` | 8KB | ROI 요약 카드 |

### 훅 목록
| 훅 | 파일 | 용도 |
|----|------|------|
| useAppliedStrategies | `useAppliedStrategies.ts` | 적용 전략 조회 |
| useCategoryPerformance | `useCategoryPerformance.ts` | 카테고리 성과 |
| useROISummary | `useROISummary.ts` | ROI 요약 |

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `applied_strategies` | 적용된 전략 |
| `recommendation_applications` | 추천 적용 이력 |
| `daily_kpis_agg` | KPI 비교 |

### 테스트 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| ROI 요약 카드 | | |
| 카테고리별 ROI | | |
| 적용 전략 테이블 | | |
| 전략 상세 모달 | | |
| AI 인사이트 카드 | | |
| 데이터 내보내기 | | |

---

# 4. 데이터베이스 테이블 검증

## 4.1 필수 데이터 현황

```sql
-- 1. 매장 확인
SELECT id, name, address FROM stores
WHERE id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 2. 구역 확인
SELECT COUNT(*) as zone_count FROM zones_dim
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 3. KPI 확인 (최근 7일)
SELECT date, total_revenue, total_visitors, conversion_rate
FROM daily_kpis_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY date DESC LIMIT 7;

-- 4. 동선 데이터 확인 ⚠️ 중요
SELECT COUNT(*) as transition_count,
       MIN(occurred_at) as first_record,
       MAX(occurred_at) as last_record
FROM zone_transitions
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 5. 날씨 데이터 확인 ⚠️ 중요
SELECT COUNT(*) as weather_count,
       MIN(date) as first_date,
       MAX(date) as last_date
FROM weather_data
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 6. 공휴일 확인
SELECT COUNT(*) as holiday_count FROM holidays_events
WHERE date >= '2026-01-01' AND date <= '2026-12-31';

-- 7. 가구 확인
SELECT COUNT(*) as furniture_count FROM furniture
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 8. 슬롯 확인
SELECT COUNT(*) as slot_count FROM furniture_slots
WHERE store_id = 'd9830554-2688-4032-af40-acccda887ac4';

-- 9. 상품 성과 확인
SELECT COUNT(*) as product_count FROM product_performance_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 10. 연관 규칙 확인 ⚠️ 중요
SELECT COUNT(*) as rule_count FROM product_associations
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';
```

## 4.2 데이터 상태 체크리스트

| 테이블 | 예상 데이터 | 현재 상태 | 건수 | 영향 기능 |
|--------|-----------|----------|------|----------|
| `stores` | 매장 정보 | | | 전체 |
| `zones_dim` | 10+ 존 | | | 구역 분석 |
| `daily_kpis_agg` | 90일 | | | KPI 대시보드 |
| `zone_transitions` | 63,000+ | | | 동선 분석 |
| `weather_data` | 90일 | ❌ 비어있음 | 0 | 환경 분석 |
| `holidays_events` | 연간 | ⚠️ | | 이벤트 영향 |
| `furniture` | 가구 목록 | | | 레이아웃 |
| `furniture_slots` | 슬롯 정보 | | | 슬롯 시스템 |
| `product_performance_agg` | 상품 성과 | | | 상품 분석 |
| `product_associations` | 연관 규칙 | ⚠️ | | 연관 추천 |

---

# 5. 발견된 이슈 및 개선 사항

## 5.1 발견된 이슈

| ID | 영역 | 설명 | 심각도 | 파일 | 상태 |
|----|------|------|--------|------|------|
| ISS-001 | 데이터 | weather_data 테이블 비어있음 | 🔴 높음 | DB | ❌ 미해결 |
| ISS-002 | 데이터 | product_associations 0건 (연관 분석 불가) | 🔴 높음 | DB | ❌ 미해결 |
| ISS-003 | Ultimate | 신뢰도 0.83% (매우 낮음) | 🟡 중간 | generate-optimization | ⚠️ 데이터 부족 |
| ISS-004 | Ultimate | VMD 점수 D등급 55점 | 🟡 중간 | vmd/vmdEngine.ts | ⚠️ 데이터 부족 |
| ISS-005 | 동선 | zone_transitions 없으면 빈 화살표 | 🟡 중간 | useFlowSimulation.ts:597 | ⚠️ |
| ISS-006 | 실시간 | iot_sensors 테이블 미생성 | 🟡 중간 | useRealtimeTracking.ts:76 | ❌ TODO |
| ISS-007 | 3D | 기본 GLB 모델 URL 미설정 | 🟢 낮음 | modelLayerLoader.ts:585 | ❌ TODO |
| ISS-008 | 데이터 | user_data_imports file_path 컬럼 없음 | 🟢 낮음 | DataValidation.tsx:83 | ❌ TODO |

## 5.2 TODO 주석 현황

| 파일 | 라인 | 내용 | 우선순위 |
|------|------|------|----------|
| `DigitalTwinStudioPage.tsx` | 282 | 피크 시간 데이터 연동 | P2 |
| `modelLayerLoader.ts` | 585 | 기본 모델 URL 교체 | P2 |
| `useRealtimeTracking.ts` | 76 | iot_sensors 테이블 생성 | P1 |
| `useDataSourceMapping.ts` | 444 | 프리셋 API 활성화 로직 | P3 |
| `DataValidation.tsx` | 83 | file_path 컬럼 추가 | P3 |
| `DataImportHistory.tsx` | 221 | 스토리지 정리 구현 | P3 |
| `SceneViewer.tsx` | 119, 193 | GLB 모델 로드 | P2 |

## 5.3 콘솔 경고 현황

| 파일 | 경고 내용 | 원인 |
|------|----------|------|
| `CustomerSimulation.ts:180` | 입구 존이 없습니다 | zones_dim 데이터 부족 |
| `environmentDataService.ts:432` | zone_events 테이블이 없습니다 | 테이블 미생성 |
| `CustomerFlowOverlayEnhanced.tsx:79` | 데이터 없음 | zone_transitions 부족 |
| `useFlowSimulation.ts:597` | No zone data available | zones_dim 부족 |

---

# 6. 개선 작업 우선순위

## P0: 긴급 (즉시 수정)

| # | 작업 | 파일/테이블 | 설명 | 담당 |
|---|------|-----------|------|------|
| 1 | 날씨 데이터 자동 수집 설정 | `environment-proxy` + Cron | weather_data 테이블 채우기 | |
| 2 | zone_transitions 데이터 확인 | DB | 동선 분석 기본 데이터 | |

## P1: 높음 (이번 주)

| # | 작업 | 파일/테이블 | 설명 | 담당 |
|---|------|-----------|------|------|
| 1 | holidays_events 데이터 로드 | `environment-proxy` | 연간 공휴일 데이터 | |
| 2 | product_associations 데이터 생성 | 거래 데이터 ETL | 연관 규칙 마이닝 | |
| 3 | iot_sensors 테이블 생성 | DB 스키마 | 실시간 트래킹 활성화 | |
| 4 | VMD 규칙 데이터 보강 | `vmd_rules` 테이블 | VMD 점수 개선 | |

## P2: 중간 (다음 주)

| # | 작업 | 파일 | 설명 | 담당 |
|---|------|------|------|------|
| 1 | 피크 시간 데이터 연동 | `DigitalTwinStudioPage.tsx:282` | TODO 해결 | |
| 2 | 기본 3D 모델 URL 설정 | `modelLayerLoader.ts:585` | 폴백 모델 | |
| 3 | zone_events 테이블 생성 | DB 스키마 | 매장 이벤트 | |
| 4 | 콘솔 경고 정리 | 다수 파일 | 프로덕션 로그 | |

## P3: 낮음 (백로그)

| # | 작업 | 파일 | 설명 | 담당 |
|---|------|------|------|------|
| 1 | advanced-ai-inference 리팩토링 | Edge Function | 4,715줄 모듈 분리 | |
| 2 | API 응답 캐싱 | hooks | 성능 최적화 | |
| 3 | user_data_imports 컬럼 추가 | DB 스키마 | file_path | |
| 4 | 스토리지 정리 로직 | `DataImportHistory.tsx` | 구현 | |
| 5 | 프리셋 API | `useDataSourceMapping.ts` | 구현 | |

---

# 7. 통합 테스트 시나리오

## 7.1 시나리오 1: Ultimate AI 최적화 전체 플로우

### 사전 조건
- [ ] weather_data에 최소 1건 데이터 존재
- [ ] zone_transitions에 데이터 존재
- [ ] zones_dim에 매장 구역 정의됨

### 테스트 단계
1. **Studio 접속**
   - `/studio` 이동
   - 3D 캔버스 로딩 확인 (2-5초)

2. **AI 최적화 탭 선택**
   - "AI 최적화" 탭 클릭
   - 탭 전환 확인

3. **최적화 실행**
   - "최적화 실행" 버튼 클릭
   - 로딩 스피너 표시 확인
   - 예상 소요시간: 5-15초

4. **Ultimate 분석 패널 확인**
   - [ ] 전체 신뢰도 배지 표시
   - [ ] 동선 분석 섹션 (건강도 점수)
   - [ ] VMD 점수 섹션 (등급/점수)
   - [ ] 환경 영향 섹션 (날씨/이벤트)
   - [ ] 연관 분석 섹션 (규칙/추천)
   - [ ] 예측 분석 섹션 (매출 변화)

5. **추천 결과 확인**
   - [ ] 가구 이동 추천 목록
   - [ ] 상품 배치 변경 추천
   - [ ] 3D 하이라이트 표시

6. **적용 테스트**
   - "적용" 버튼 클릭
   - 확인 모달 표시
   - applied_strategies 테이블 저장 확인

### 테스트 결과
| 단계 | 상태 | 소요시간 | 비고 |
|------|------|---------|------|
| Studio 로딩 | | | |
| 최적화 실행 | | | |
| Ultimate 패널 | | | |
| 추천 결과 | | | |
| 적용 저장 | | | |

---

## 7.2 시나리오 2: 환경 데이터 수집 → 분석

### 테스트 단계
1. **환경 프록시 호출 (날씨)**
   ```bash
   curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "weather",
       "lat": 37.5665,
       "lon": 126.9780,
       "store_id": "d9830554-2688-4032-af40-acccda787ac4",
       "save_to_db": true
     }'
   ```

2. **DB 저장 확인**
   ```sql
   SELECT * FROM weather_data
   WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
   ORDER BY date DESC LIMIT 1;
   ```

3. **최적화 재실행**
   - Studio AI 최적화 탭에서 재실행
   - 환경 영향 섹션에 날씨 표시 확인

### 테스트 결과
| 단계 | 상태 | 비고 |
|------|------|------|
| 날씨 API 호출 | | |
| DB 저장 | | |
| 환경 영향 표시 | | |

---

## 7.3 시나리오 3: ROI 측정 플로우

### 사전 조건
- [ ] applied_strategies에 최소 1건 데이터 존재

### 테스트 단계
1. **ROI 페이지 접속**
   - `/roi` 이동

2. **ROI 요약 확인**
   - [ ] 총 ROI 카드
   - [ ] 적용 전략 수
   - [ ] 성공률

3. **적용 전략 테이블 확인**
   - [ ] 전략 목록 표시
   - [ ] 상태 표시 (활성/완료)
   - [ ] 측정된 효과

4. **상세 모달 테스트**
   - 전략 행 클릭
   - 상세 모달 표시 확인

### 테스트 결과
| 단계 | 상태 | 비고 |
|------|------|------|
| ROI 요약 | | |
| 전략 테이블 | | |
| 상세 모달 | | |

---

# 8. API 테스트 명령어

## 8.1 generate-optimization (Ultimate)
```bash
# 기본 최적화
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/generate-optimization" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "optimization_type": "both"
  }'

# 매출 우선 최적화
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/generate-optimization" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "optimization_type": "both",
    "parameters": {
      "prioritize_revenue": true,
      "max_changes": 30
    }
  }'
```

## 8.2 advanced-ai-inference
```bash
# 레이아웃 최적화
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/advanced-ai-inference" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "inference_type": "layout_optimization",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "parameters": {
      "simulation_type": "layout"
    }
  }'
```

## 8.3 environment-proxy
```bash
# 날씨 (저장 포함)
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather",
    "lat": 37.5665,
    "lon": 126.9780,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'

# 공휴일
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "holidays",
    "year": 2026,
    "month": 1,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'
```

## 8.4 unified-ai
```bash
# 추천 생성
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_recommendations",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'

# 이상 탐지
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "anomaly_detection",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'
```

---

# 부록

## A. 환경 변수

```bash
# Supabase
VITE_SUPABASE_URL=https://bdrvowacecxnraaivlhr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# 외부 API (선택)
VITE_OPENWEATHERMAP_API_KEY=<your_key>
VITE_DATA_GO_KR_API_KEY=<your_key>
VITE_CALENDARIFIC_API_KEY=<your_key>
```

## B. Edge Function 배포

```bash
# 전체 함수 배포
supabase functions deploy

# 개별 함수 배포
supabase functions deploy generate-optimization
supabase functions deploy environment-proxy
supabase functions deploy advanced-ai-inference
```

## C. 데이터 시딩

```bash
# 필요시 시딩 스크립트 실행
psql -f scripts/seed_missing_data_v4.sql
```

## D. 참고 문서

- Supabase Dashboard: https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr
- Edge Functions Logs: https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions

---

**작성자:** Claude AI
**버전:** 2.0
**최종 수정:** 2026-01-05
