# NEURALTWIN 프로젝트 구조 및 개발 가이드

> **최종 업데이트**: 2025-01-25  
> **버전**: 3.0 (A/B/C/D 구조 개편 반영)

---

## 📋 목차

1. [현재 구현 상태](#현재-구현-상태)
2. [프로젝트 구조](#프로젝트-구조)
3. [Feature별 상세 가이드](#feature별-상세-가이드)
4. [데이터베이스 구조](#데이터베이스-구조)
5. [기술 스택](#기술-스택)
6. [관련 문서](#관련-문서)

---

## 현재 구현 상태

### ✅ 완료된 기능 (100% 완료)

프로젝트는 **A/B/C/D 4개 섹션, 총 12개 페이지**로 구성되어 있으며 모두 구현 완료되었습니다.

#### A. Overview (4/4)
- ✅ 대시보드 - KPI 종합 대시보드
- ✅ 매장 관리 - 매장 CRUD
- ✅ HQ-매장 커뮤니케이션 - 본사-매장 소통
- ✅ 설정 - 사용자/조직 설정

#### B. 매장 현황 분석 (3/3)
- ✅ 매장 분석 - 방문자/히트맵/존 분석
- ✅ 고객 분석 - 고객 세그먼트/동선/구매패턴
- ✅ 상품 분석 - 상품 성과/재고/매출

#### C. 시뮬레이션 (2/2)
- ✅ 디지털 트윈 3D - 3D 매장 시각화
- ✅ 시뮬레이션 허브 - 5가지 AI 시뮬레이션 통합

#### D. 데이터 관리 (3/3)
- ✅ 통합 데이터 임포트 - CSV/3D 모델 업로드
- ✅ 스키마 빌더 - 온톨로지 스키마 관리
- ✅ API 연동 - 외부 API 관리

---

## 프로젝트 구조

### 최상위 구조

```
NEURALTWIN/
├── src/                    # 소스 코드
│   ├── components/         # 공유 컴포넌트
│   ├── core/              # 핵심 페이지 (Dashboard, Settings, Auth)
│   ├── features/          # Feature-based 모듈 (A/B/C/D)
│   ├── hooks/             # 커스텀 훅
│   ├── integrations/      # Supabase 통합
│   ├── lib/               # 라이브러리
│   ├── types/             # 타입 정의
│   └── utils/             # 유틸리티
├── supabase/              # Supabase 설정
│   ├── functions/         # Edge Functions (20+)
│   └── migrations/        # DB 마이그레이션
├── public/                # 정적 파일
│   └── lighting-presets/  # 조명 프리셋
└── docs/                  # 기술 문서
```

### Feature-based 아키텍처 (A/B/C/D)

```
src/features/
├── overview/              # A. Overview
│   ├── pages/            
│   │   ├── StoresPage.tsx         # 매장 관리
│   │   └── HQCommunicationPage.tsx # HQ-매장 커뮤니케이션
│   ├── components/       
│   │   ├── StoreForm.tsx
│   │   ├── UnifiedMessageThread.tsx
│   │   ├── GuidelineForm.tsx
│   │   ├── GuidelineList.tsx
│   │   └── NotificationPanel.tsx
│   └── index.ts
│
├── analysis/              # B. 매장 현황 분석
│   ├── pages/            
│   │   ├── StoreAnalysisPage.tsx    # 매장 분석
│   │   ├── CustomerAnalysisPage.tsx # 고객 분석
│   │   └── ProductAnalysisPage.tsx  # 상품 분석
│   └── index.ts
│
├── simulation/            # C. 시뮬레이션
│   ├── pages/            
│   │   ├── DigitalTwin3DPage.tsx    # 디지털 트윈 3D
│   │   └── SimulationHubPage.tsx    # 시뮬레이션 허브
│   ├── components/       
│   │   ├── digital-twin/            # 3D 씬 컴포넌트
│   │   │   ├── SceneComposer.tsx
│   │   │   ├── SceneViewer.tsx
│   │   │   ├── SharedDigitalTwinScene.tsx
│   │   │   ├── Store3DViewer.tsx
│   │   │   ├── ModelLayerManager.tsx
│   │   │   ├── ModelUploader.tsx
│   │   │   └── ...
│   │   ├── overlays/                # 3D 오버레이
│   │   │   ├── HeatmapOverlay3D.tsx
│   │   │   ├── CustomerPathOverlay.tsx
│   │   │   ├── WiFiTrackingOverlay.tsx
│   │   │   └── ...
│   │   ├── DemandForecastResult.tsx
│   │   ├── InventoryOptimizationResult.tsx
│   │   ├── PricingOptimizationResult.tsx
│   │   └── RecommendationStrategyResult.tsx
│   ├── hooks/            
│   │   ├── useAIInference.ts
│   │   ├── useStoreContext.ts
│   │   └── useRealtimeTracking.ts
│   ├── types/            
│   │   ├── scenario.types.ts
│   │   ├── prediction.types.ts
│   │   ├── layout.types.ts
│   │   ├── pricing.types.ts
│   │   ├── inventory.types.ts
│   │   ├── recommendation.types.ts
│   │   ├── iot.types.ts
│   │   ├── avatar.types.ts
│   │   └── overlay.types.ts
│   ├── utils/            
│   │   ├── modelStorageManager.ts
│   │   ├── modelFilenameParser.ts
│   │   ├── sceneRecipeGenerator.ts
│   │   └── ...
│   └── index.ts
│
└── data-management/       # D. 데이터 관리
    ├── import/            # 통합 데이터 임포트
    │   ├── pages/
    │   │   └── UnifiedDataManagementPage.tsx
    │   └── components/
    │       ├── UnifiedDataUpload.tsx
    │       ├── OntologyDataManagement.tsx
    │       ├── StorageManager.tsx
    │       ├── DataValidation.tsx
    │       └── ...
    ├── ontology/          # 스키마 빌더
    │   ├── pages/
    │   │   └── SchemaBuilderPage.tsx
    │   └── components/
    │       ├── EntityTypeManager.tsx
    │       ├── RelationTypeManager.tsx
    │       ├── SchemaGraphVisualization.tsx
    │       └── ...
    └── api/               # API 연동
        └── pages/
            └── APIIntegrationPage.tsx
```

---

## Feature별 상세 가이드

### A. Overview 섹션

#### A-1. 대시보드 (`/overview/dashboard`)
**파일**: `src/core/pages/DashboardPage.tsx`

**주요 기능**:
- KPI 카드 (방문자, 매출, 전환율, 평당매출)
- 최근 7일 트렌드 차트
- 전환 퍼널 시각화
- AI 추천사항 표시

**사용 테이블**:
- `dashboard_kpis` - KPI 데이터
- `funnel_metrics` - 퍼널 메트릭
- `ai_recommendations` - AI 추천

**관련 Hooks**:
- `useDashboardKPI(storeId, dateStr)`
- `useLatestKPIs(storeId, days)`
- `useAIRecommendations(storeId)`

**Edge Functions**:
- `aggregate-dashboard-kpis` - KPI 집계
- `generate-ai-recommendations` - AI 추천 생성

---

#### A-2. 매장 관리 (`/overview/stores`)
**파일**: `src/features/overview/pages/StoresPage.tsx`

**주요 기능**:
- 매장 목록 표시
- 매장 추가/수정/삭제
- 매장 선택

**사용 테이블**:
- `stores` - 매장 정보

**관련 Hooks**:
- `useSelectedStore()` - 매장 선택 관리

---

#### A-3. HQ-매장 커뮤니케이션 (`/overview/hq-communication`)
**파일**: `src/features/overview/pages/HQCommunicationPage.tsx`

**주요 기능**:
- 메시지 & 코멘트 송수신
- 가이드라인 배포 (본사 → 매장)
- 알림 조회

**사용 테이블**:
- `hq_store_messages` - 메시지
- `hq_guidelines` - 가이드라인
- `hq_notifications` - 알림

**관련 Hooks**:
- `useHQCommunication()` - 메시지 관리

**Components**:
- `UnifiedMessageThread` - 통합 메시지 스레드
- `GuidelineForm` - 가이드라인 생성
- `GuidelineList` - 가이드라인 목록
- `NotificationPanel` - 알림 패널

---

#### A-4. 설정 (`/overview/settings`)
**파일**: `src/core/pages/SettingsPage.tsx`

**주요 기능**:
- 사용자 프로필
- 조직 정보
- 라이선스 정보
- 알림 설정

**사용 테이블**:
- `profiles` - 프로필
- `organizations` - 조직
- `organization_members` - 멤버십
- `subscriptions` - 구독
- `licenses` - 라이선스
- `notification_settings` - 알림 설정

---

### B. 매장 현황 분석 섹션

#### B-1. 매장 분석 (`/analysis/store`)
**파일**: `src/features/analysis/pages/StoreAnalysisPage.tsx`

**주요 기능**:
- 방문자 통계 (일별, 시간별)
- 트래픽 히트맵 3D 시각화
- 존별 통계 (방문자, 전환율, 체류시간)
- 외부 컨텍스트 인사이트 (날씨, 이벤트)

**사용 테이블**:
- `dashboard_kpis` - 방문자 통계
- `wifi_tracking` - WiFi 트래킹 → 히트맵
- `stores` - 매장 메타데이터 (zones)
- `holidays_events` - 휴일/이벤트
- `economic_indicators` - 경제 지표

**관련 Hooks**:
- `useFootfallAnalysis(storeId, startDate, endDate)` - 방문자 분석
- `useTrafficHeatmap(storeId, timeOfDay)` - 시간대별 히트맵
- `useZoneStatistics(heatPoints, metadata)` - 존별 통계
- `useTrafficContext(storeId)` - 컨텍스트 인사이트

**3D 오버레이**:
- `HeatmapOverlay3D` - 히트맵 시각화
- `ZoneBoundaryOverlay` - 존 경계 표시

**Edge Functions**:
- `process-wifi-data` - WiFi 데이터 처리

---

#### B-2. 고객 분석 (`/analysis/customer`)
**파일**: `src/features/analysis/pages/CustomerAnalysisPage.tsx`

**주요 기능**:
- 고객 세그먼트 분석 (VIP/Regular/New)
- 고객 동선 경로 3D 시각화
- 구매 패턴 분석
- 전환 퍼널 시각화

**사용 테이블**:
- `wifi_tracking` - 고객 동선
- `customers` - 고객 정보
- `purchases` - 구매 데이터
- `stores` - 매장 메타데이터

**Storage**:
- `store-data` - visits.csv, purchases.csv, customers.csv

**관련 Hooks**:
- `useCustomerJourney(storeId, timeOfDay)` - 고객 동선
- `useJourneyStatistics(paths)` - 경로 통계
- `useCustomerSegments()` - 세그먼트 분석
- `usePurchasePatterns()` - 구매 패턴

**3D 오버레이**:
- `CustomerPathOverlay` - 고객 경로 표시
- `CustomerAvatarOverlay` - 고객 아바타
- `ZoneBoundaryOverlay` - 존 경계

---

#### B-3. 상품 분석 (`/analysis/product`)
**파일**: `src/features/analysis/pages/ProductAnalysisPage.tsx`

**주요 기능**:
- 상품별 매출/판매량
- 카테고리별 성과
- 재고 수준 모니터링
- 마진율 분석

**사용 테이블**:
- `products` - 상품 정보
- `inventory_levels` - 재고 레벨
- `purchases` - 구매 데이터

**Storage**:
- `store-data` - purchases.csv, products.csv

**관련 Hooks**:
- `useStoreDataset()` - 데이터셋 로드
- `useRealtimeInventory()` - 실시간 재고

---

### C. 시뮬레이션 섹션

#### C-1. 디지털 트윈 3D (`/simulation/digital-twin`)
**파일**: `src/features/simulation/pages/DigitalTwin3DPage.tsx`

**주요 기능**:
- 3D 모델 업로드 (Space/Furniture/Product)
- 레이어별 모델 관리
- 씬 레시피 생성/저장
- 조명 프리셋 적용
- 온톨로지 기반 자동 매핑

**사용 테이블**:
- `ai_scene_analysis` - 씬 레시피 저장
- `graph_entities` - 온톨로지 엔티티
- `ontology_entity_types` - 엔티티 타입 (3D 모델 URL)

**Storage**:
- `3d-models` - GLB/FBX 파일

**주요 컴포넌트**:
- `SceneComposer` - 씬 렌더링 (Store/Furniture/Product/Lighting)
- `ModelLayerManager` - 레이어 관리
- `ModelUploader` - 3D 모델 업로드
- `AutoModelMapper` - 자동 모델 매핑

**Utils**:
- `modelStorageManager.ts` - Storage 관리
- `modelFilenameParser.ts` - 파일명 파싱
- `modelLayerLoader.ts` - 레이어 로딩
- `sceneRecipeGenerator.ts` - SceneRecipe 생성

**Edge Functions**:
- `analyze-3d-model` - 3D 모델 분석
- `auto-process-3d-models` - 자동 처리

---

#### C-2. 시뮬레이션 허브 (`/simulation/hub`)
**파일**: `src/features/simulation/pages/SimulationHubPage.tsx`

**주요 기능**: 5가지 AI 시뮬레이션 통합
1. **레이아웃 최적화** - 고객 동선 기반 최적 레이아웃 제안 (3D)
2. **향후 수요 예측** - 30일 수요 예측 및 주요 드라이버 분석
3. **재고 최적화** - 최적 재고 수준 및 발주 시점 제안
4. **가격 최적화** - 가격 탄력성 기반 최적 가격 전략
5. **추천 마케팅/프로모션 전략** - 세그먼트별 개인화 전략

**사용 테이블**:
- `graph_entities` - 온톨로지 엔티티
- `graph_relations` - 엔티티 간 관계
- `products` - 상품 정보
- `inventory_levels` - 재고 레벨
- `dashboard_kpis` - 최근 KPI
- `ai_scene_analysis` - 3D 씬 (레이아웃 시뮬레이션용)

**관련 Hooks**:
- `useStoreContext(storeId)` - 통합 컨텍스트 데이터
- `useAIInference()` - AI 추론 실행

**결과 컴포넌트**:
- `DemandForecastResult` - 수요 예측 결과
- `InventoryOptimizationResult` - 재고 최적화 결과
- `PricingOptimizationResult` - 가격 최적화 결과
- `RecommendationStrategyResult` - 추천 전략 결과

**Edge Functions**:
- `advanced-ai-inference` - AI 시뮬레이션 (5가지 타입)
  - `layout` - 레이아웃 최적화
  - `demand` - 수요 예측
  - `inventory` - 재고 최적화
  - `pricing` - 가격 최적화
  - `recommendation` - 추천 전략

**시뮬레이션 타입**:
```typescript
type ScenarioType = 
  | 'layout'          // 레이아웃 최적화
  | 'pricing'         // 가격 최적화
  | 'inventory'       // 재고 최적화
  | 'demand'          // 수요 예측
  | 'recommendation'  // 추천 전략
  | 'staffing'        // 인력 최적화 (미래)
  | 'promotion';      // 프로모션 (미래)
```

---

### D. 데이터 관리 섹션

#### D-1. 통합 데이터 임포트 (`/data-management/import`)
**파일**: `src/features/data-management/import/pages/UnifiedDataManagementPage.tsx`

**주요 기능**:
- CSV 파일 업로드 (visits, purchases, products 등)
- 3D 모델 업로드 (GLB/FBX)
- 자동 스키마 매핑 (AI)
- 데이터 검증 및 수정
- 온톨로지 기반 데이터 관리
- 데모 준비 상태 확인

**사용 테이블**:
- `user_data_imports` - 임포트 세션
- `upload_sessions` - 업로드 세션
- `graph_entities` - 온톨로지 엔티티
- `graph_relations` - 관계
- `ontology_entity_types` - 엔티티 타입
- `ontology_mapping_cache` - 매핑 캐시

**Storage**:
- `store-data` - CSV 파일
- `3d-models` - 3D 모델

**Components**:
- `UnifiedDataUpload` - 업로드 UI
- `OntologyDataManagement` - 온톨로지 관리
- `SchemaMapper` - 스키마 매핑
- `DataValidation` - 검증
- `StorageManager` - Storage 관리
- `DemoReadinessChecker` - 준비 상태

**Edge Functions**:
- `integrated-data-pipeline` - 통합 파이프라인
- `smart-ontology-mapping` - AI 매핑
- `import-with-ontology` - 온톨로지 임포트
- `validate-and-fix-csv` - CSV 검증
- `auto-fix-data` - 데이터 수정
- `cleanup-integrated-data` - 데이터 정리

---

#### D-2. 스키마 빌더 (`/data-management/schema`)
**파일**: `src/features/data-management/ontology/pages/SchemaBuilderPage.tsx`

**주요 기능**:
- 엔티티 타입 정의 (상품, 매장, 고객 등)
- 관계 타입 정의 (포함, 구매, 방문 등)
- 스키마 그래프 시각화
- 스키마 버전 관리
- 리테일 프리셋

**사용 테이블**:
- `ontology_entity_types` - 엔티티 타입
- `ontology_relation_types` - 관계 타입
- `ontology_schema_versions` - 버전
- `ontology_schemas` - 스키마 정의

**Components**:
- `EntityTypeManager` - 엔티티 관리
- `RelationTypeManager` - 관계 관리
- `SchemaGraphVisualization` - 그래프 시각화
- `SchemaValidator` - 검증
- `RetailSchemaPreset` - 프리셋

**Edge Functions**:
- `graph-query` - 그래프 쿼리 (N-hop, Shortest Path)
- `schema-etl` - 스키마 ETL

---

#### D-3. API 연동 (`/data-management/api`)
**파일**: `src/features/data-management/api/pages/APIIntegrationPage.tsx`

**주요 기능**:
- 외부 API 연결 관리
- 데이터 동기화 스케줄링
- API 연결 테스트
- 동기화 로그 조회

**사용 테이블**:
- `api_connections` - API 연결
- `external_data_sources` - 외부 소스
- `data_sync_schedules` - 스케줄
- `data_sync_logs` - 로그

**Edge Functions**:
- `test-api-connection` - 연결 테스트

---

## 데이터베이스 구조

### 주요 테이블 (30+ 테이블)

#### 조직 & 사용자
```sql
- organizations          # 조직 정보
- organization_members   # 조직 멤버십
- profiles              # 사용자 프로필
- subscriptions         # 구독
- licenses              # 라이선스
- invitations           # 초대
```

#### 매장 관리
```sql
- stores                # 매장 정보
```

#### 커뮤니케이션
```sql
- hq_store_messages     # HQ-매장 메시지
- hq_guidelines         # 가이드라인
- hq_notifications      # 알림
```

#### 데이터 임포트 & 온톨로지
```sql
- user_data_imports            # 임포트 세션
- upload_sessions              # 업로드 세션
- ontology_entity_types        # 엔티티 타입 정의
- ontology_relation_types      # 관계 타입 정의
- ontology_schema_versions     # 스키마 버전
- ontology_schemas             # 스키마 저장
- ontology_mapping_cache       # 매핑 캐시
- graph_entities               # 온톨로지 엔티티
- graph_relations              # 엔티티 관계
```

#### WiFi 추적 & 센서
```sql
- neuralsense_devices   # WiFi 센서 디바이스
- wifi_tracking         # 트래킹 데이터
- wifi_zones            # 존 정의
```

#### 분석 & KPI
```sql
- dashboard_kpis        # KPI 집계 데이터
- funnel_metrics        # 퍼널 메트릭
- analysis_history      # 분석 이력
```

#### AI & 시뮬레이션
```sql
- scenarios             # 시뮬레이션 시나리오
- ai_recommendations    # AI 추천
- ai_scene_analysis     # 3D 씬 분석/저장
```

#### 재고 & 제품
```sql
- products              # 상품 정보
- customers             # 고객 정보
- inventory_levels      # 재고 수준
- auto_order_suggestions # 자동 발주 제안
```

#### 외부 데이터
```sql
- external_data_sources # 외부 데이터 소스
- api_connections       # API 연결
- data_sync_schedules   # 동기화 스케줄
- data_sync_logs        # 동기화 로그
- holidays_events       # 공휴일/이벤트
- economic_indicators   # 경제 지표
```

---

## Storage 버킷

### `store-data` (Private)
**용도**: 사용자 업로드 CSV 데이터

**파일 구조**:
```
store-data/
└── {user_id}/
    └── {store_id}/
        ├── visits.csv          # 방문 데이터
        ├── purchases.csv       # 구매 데이터
        ├── products.csv        # 상품 데이터
        ├── customers.csv       # 고객 데이터
        ├── wifi_tracking.csv   # WiFi 트래킹
        ├── zones.csv           # 존 정의
        └── inventory.csv       # 재고 데이터
```

### `3d-models` (Public)
**용도**: 3D 모델 파일

**파일명 규칙**:
```
Space_{store_id}_{name}.glb        # 매장 공간
Furniture_{type}_{name}.glb        # 가구
Product_{category}_{sku}.glb       # 상품
```

---

## 공통 Hooks

### 데이터 로딩
- `useStoreData.ts` - Storage CSV 로드
- `useStoreDataset()` - 전체 데이터셋
- `useMultipleStoreDataFiles()` - 여러 파일 동시 로드
- `useRealSampleData.ts` - 샘플 데이터

### 분석
- `useFootfallAnalysis.ts` - 방문자 분석
- `useCustomerJourney.ts` - 고객 동선
- `useDwellTime.ts` - 체류 시간
- `useTrafficHeatmap.ts` - 트래픽 히트맵
- `useWiFiTracking.ts` - WiFi 트래킹
- `useZoneTransition.ts` - 존 전환
- `useCustomerSegments.ts` - 고객 세그먼트
- `usePurchasePatterns.ts` - 구매 패턴

### 시뮬레이션
- `useAIInference.ts` - AI 추론 실행
- `useStoreContext.ts` - 시뮬레이션 컨텍스트
- `useRealtimeTracking.ts` - 실시간 트래킹
- `useStoreScene.ts` - 3D 씬 관리

### 데이터 관리
- `useImportProgress.ts` - 임포트 진행률
- `useUploadSession.ts` - 업로드 세션
- `useOntologyData.ts` - 온톨로지 데이터
- `useDataReadiness.ts` - 데이터 준비 상태

### UI/기타
- `useAuth.tsx` - 인증/역할
- `useSelectedStore.tsx` - 매장 선택
- `useDashboardKPI.ts` - 대시보드 KPI
- `useAIRecommendations.ts` - AI 추천
- `useRealtimeInventory.ts` - 실시간 재고
- `useHQCommunication.ts` - HQ 커뮤니케이션

---

## Edge Functions (20+)

### 데이터 처리
- `integrated-data-pipeline` - 통합 파이프라인
- `validate-and-fix-csv` - CSV 검증
- `auto-fix-data` - 데이터 수정
- `cleanup-integrated-data` - 정리
- `process-wifi-data` - WiFi 처리

### AI Functions
- `advanced-ai-inference` - AI 시뮬레이션 (5가지)
- `generate-ai-recommendations` - AI 추천
- `analyze-3d-model` - 3D 모델 분석
- `smart-ontology-mapping` - AI 스키마 매핑
- `auto-process-3d-models` - 자동 3D 처리

### 집계
- `aggregate-dashboard-kpis` - KPI 집계
- `aggregate-all-kpis` - 전체 KPI 집계

### 유틸리티
- `graph-query` - 그래프 쿼리
- `schema-etl` - 스키마 ETL
- `auto-map-etl` - ETL 자동 매핑
- `test-api-connection` - API 테스트
- `analyze-retail-data` - 리테일 분석
- `analyze-store-data` - 매장 데이터 분석
- `inventory-monitor` - 재고 모니터링

---

## 기술 스택

### Frontend
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.x",
  "routing": "React Router DOM 6.30.1",
  "state": "TanStack Query 5.83.0",
  "styling": "Tailwind CSS 3.x",
  "ui": "shadcn/ui",
  "3d": "Three.js 0.160.1 + React Three Fiber 8.18.0 + drei 9.122.0",
  "charts": "Recharts 2.15.4",
  "build": "Vite 5.x"
}
```

### Backend
```json
{
  "platform": "Supabase",
  "database": "PostgreSQL 15+",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "functions": "Supabase Edge Functions (Deno)",
  "ai": "Lovable AI Gateway (Gemini 2.0 Flash)"
}
```

### 주요 라이브러리
- **폼 관리**: react-hook-form 7.61.1 + zod 4.1.12
- **데이터 처리**: xlsx 0.18.5, jspdf 3.0.3, date-fns 3.6.0
- **그래프**: react-force-graph-2d 1.29.0, d3-force 3.0.0
- **알림**: sonner 1.7.4
- **다크모드**: next-themes 0.3.0
- **3D**: @react-three/fiber 8.18.0, @react-three/drei 9.122.0, three 0.160.1

---

## 라우팅 구조

### A. Overview (4 routes)
```
/                              → DashboardPage
/overview/dashboard            → DashboardPage
/overview/stores               → StoresPage
/overview/hq-communication     → HQCommunicationPage
/overview/settings             → SettingsPage
```

### B. 매장 현황 분석 (3 routes)
```
/analysis/store                → StoreAnalysisPage
/analysis/customer             → CustomerAnalysisPage
/analysis/product              → ProductAnalysisPage
```

### C. 시뮬레이션 (2 routes)
```
/simulation/digital-twin       → DigitalTwin3DPage
/simulation/hub                → SimulationHubPage
```

### D. 데이터 관리 (3 routes)
```
/data-management/import        → UnifiedDataManagementPage
/data-management/schema        → SchemaBuilderPage
/data-management/api           → APIIntegrationPage
```

### 기타
```
/auth                          → AuthPage
/*                             → NotFoundPage
```

---

## RLS (Row-Level Security) 정책

### 조직 기반 RLS
대부분의 테이블은 `org_id` 기반 멀티테넌시 적용:
```sql
-- 조회
is_org_member(user_id, org_id)

-- 수정/삭제
is_org_admin(user_id, org_id)
```

### 역할 기반 접근 제어
```sql
- NEURALTWIN_MASTER  # 시스템 관리자 (모든 권한)
- ORG_HQ            # 본사 관리자 (조직 전체 관리)
- ORG_STORE         # 매장 관리자 (매장 데이터만)
- ORG_VIEWER        # 읽기 전용
```

### 라이선스 기반 RLS
일부 테이블은 유효한 라이선스 확인:
```sql
has_valid_license(user_id, license_type)
```

---

## 데이터 흐름

### 1. 데이터 임포트 → 분석
```
CSV 업로드 (UnifiedDataUpload)
    ↓
Storage: store-data/{user_id}/{store_id}/
    ↓
Edge Function: integrated-data-pipeline
    ↓
온톨로지 변환 + 검증
    ↓
DB 저장: graph_entities, products, customers 등
    ↓
분석 페이지에서 조회
```

### 2. KPI 집계
```
Storage CSV 파일
    ↓
aggregate-dashboard-kpis
    ↓
집계 계산 (방문자, 전환율, 퍼널)
    ↓
dashboard_kpis 테이블
    ↓
DashboardPage 표시
```

### 3. AI 시뮬레이션
```
시뮬레이션 허브에서 실행
    ↓
useStoreContext로 데이터 수집
    ↓
advanced-ai-inference 호출
    ↓
AI 모델 실행 (시나리오별)
    ↓
결과 컴포넌트 표시
```

### 4. 3D 씬 생성
```
3D 모델 업로드
    ↓
3d-models Storage
    ↓
파일명 파싱 + 온톨로지 매핑
    ↓
SceneRecipe 생성
    ↓
ai_scene_analysis 저장
    ↓
SceneComposer 렌더링
```

---

## 개발 가이드

### 새 페이지 추가 시
1. 해당 섹션 폴더에 페이지 생성 (`src/features/{section}/pages/`)
2. 필요한 컴포넌트 생성 (`src/features/{section}/components/`)
3. 필요한 hooks 생성 (공통이면 `src/hooks/`, 특화면 `src/features/{section}/hooks/`)
4. `App.tsx`에 라우트 추가
5. `AppSidebar.tsx`에 메뉴 추가
6. 타입 정의 (`src/features/{section}/types/` 또는 `src/types/`)
7. index.ts 파일 업데이트

### 새 Edge Function 추가 시
1. `supabase/functions/{function-name}/index.ts` 생성
2. 필요한 타입 정의
3. 테스트 실행
4. 관련 hook에서 호출

### 새 테이블 추가 시
1. `supabase/migrations/` 에 SQL 작성
2. RLS 정책 정의
3. Foreign Key 관계 설정
4. 관련 hook 업데이트
5. `src/integrations/supabase/types.ts` 자동 업데이트 확인

---

## 관련 문서

### 필수 문서
- **[DATA_SOURCE_MAPPING.md](./DATA_SOURCE_MAPPING.md)** - ⭐ 데이터 소스 매핑 (모든 페이지의 DB 연결)
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - 코드 구조 재정리 내역
- **[NEURALTWIN_COMPLETE_ARCHITECTURE.md](./NEURALTWIN_COMPLETE_ARCHITECTURE.md)** - 완전한 아키텍처
- **[ONBOARDING.md](./ONBOARDING.md)** - 온보딩 가이드
- **[COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)** - 협업 가이드

### 통합 가이드
- **[DIGITAL_TWIN_3D_INTEGRATION.md](./DIGITAL_TWIN_3D_INTEGRATION.md)** - 3D 통합 가이드

### 기술 문서 (docs/)
- `3D_MODEL_FILENAME_SPECIFICATION.md` - 3D 모델 파일명 규칙
- `3D_MODEL_METADATA_CSV_GUIDE.md` - 3D 모델 메타데이터
- `DEMO_DATASET_REQUIREMENTS.md` - 데모 데이터셋 요구사항
- `WIFI_TRACKING_CSV_GUIDE.md` - WiFi 트래킹 CSV 가이드
- `SIMULATION_GUIDE.md` - 시뮬레이션 가이드
- `DATA_MANAGEMENT_GUIDE.md` - 데이터 관리 가이드
- `INTEGRATED_ARCHITECTURE_GUIDE.md` - 통합 아키텍처

---

## 마이그레이션 가이드

### v2.0 → v3.0 (A/B/C/D 구조 개편)

#### 경로 변경
| 기존 | 새로운 |
|------|--------|
| `@/features/store-analysis/stores/` | `@/features/overview/` |
| `@/features/store-analysis/pages/` | `@/features/analysis/pages/` |
| `@/features/digital-twin/` | `@/features/simulation/` |
| `@/features/cost-center/` | 삭제 (ProductAnalysisPage 통합) |
| `@/features/data-management/analysis/` | 삭제 |
| `@/features/data-management/bigdata/` | 삭제 |
| `@/features/data-management/neuralsense/` | 삭제 |

#### Import 경로 업데이트
```typescript
// 기존
import { DigitalTwinScene } from '@/features/digital-twin/components';
import { StoresPage } from '@/features/store-analysis/stores/pages';

// 새로운
import { SharedDigitalTwinScene } from '@/features/simulation/components/digital-twin';
import { StoresPage } from '@/features/overview/pages';
```

#### 삭제된 컴포넌트
- 시뮬레이션 관련: `ScenarioList`, `ScenarioSaveDialog`, `ScenarioTypeSelector`, `BeforeAfterComparison` 등
- Params 폴더 전체: `LayoutParamsForm`, `PricingParamsForm` 등
- Hooks: `useScenarioManager`, `useKpiComparison`, `useAutoAnalysis`

---

## 아키텍처 원칙

### 1. Feature-based Organization
각 기능은 독립적인 모듈로 구성되며 pages/components/hooks/types/utils를 포함합니다.

### 2. 멀티테넌시
모든 데이터는 `org_id` 기반으로 격리되며 RLS로 보안이 보장됩니다.

### 3. 온톨로지 기반 데이터 모델
비정형 데이터를 온톨로지 그래프로 변환하여 유연한 데이터 관리를 지원합니다.

### 4. 3D 디지털 트윈 통합
모든 분석/시뮬레이션 페이지에서 `SharedDigitalTwinScene`을 재사용합니다.

### 5. AI 자동화
데이터 매핑, 분석, 시뮬레이션에 AI를 활용하여 사용자 편의성을 극대화합니다.

---

**최종 업데이트**: 2025-01-25  
**작성자**: NeuralTwin Development Team  
**버전**: 3.0
