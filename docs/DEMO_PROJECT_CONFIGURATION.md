# NEURALTWIN 데모 프로젝트 구성

> 최종 업데이트: 2025-11-17

## 1. 프로젝트 개요

### 1.1 핵심 목적
NEURALTWIN은 오프라인 매장을 디지털 트윈으로 구현하여 실시간 분석과 최적화를 제공하는 AI 기반 리테일 분석 플랫폼입니다.

### 1.2 주요 특징
- **3D 디지털 트윈**: 매장 공간의 3D 시각화 및 실시간 데이터 오버레이
- **WiFi 트래킹**: 고객 동선 추적 및 체류 시간 분석
- **온톨로지 기반**: 유연한 데이터 모델링 및 관계 분석
- **AI 인사이트**: 자동화된 분석 및 추천 시스템

## 2. 시스템 아키텍처

### 2.1 프론트엔드 구조
```
src/
├── features/              # 기능별 모듈
│   ├── digital-twin/      # 3D 디지털 트윈
│   ├── store-analysis/    # 매장 분석
│   ├── profit-center/     # 수익 최적화
│   ├── cost-center/       # 비용 최적화
│   └── data-management/   # 데이터 관리
├── core/                  # 공통 기능
│   └── pages/            # 기본 페이지
├── components/           # 공통 컴포넌트
│   └── ui/              # shadcn/ui 컴포넌트
└── hooks/               # 커스텀 훅
```

### 2.2 백엔드 구조 (Lovable Cloud / Supabase)
```
Database Tables:
├── stores                    # 매장 정보
├── graph_entities           # 온톨로지 엔티티
├── graph_relations          # 온톨로지 관계
├── ontology_entity_types    # 엔티티 타입 정의
├── ontology_relation_types  # 관계 타입 정의
├── wifi_tracking            # WiFi 트래킹 데이터
├── wifi_zones              # Zone 좌표
├── user_data_imports       # 데이터 임포트 이력
└── analysis_history        # AI 분석 이력

Storage Buckets:
├── store-data/             # 매장 데이터 (CSV)
│   └── {userId}/{storeId}/
│       ├── customers.csv
│       ├── products.csv
│       ├── purchases.csv
│       ├── visits.csv
│       └── staff.csv
├── 3d-models/              # 3D 모델
└── ontology-models/        # 온톨로지 3D 모델

Edge Functions:
├── analyze-store-data      # 매장 데이터 분석
├── auto-map-etl           # 자동 ETL 매핑
├── schema-etl             # 스키마 기반 ETL
├── graph-query            # 그래프 쿼리
└── advanced-ai-inference  # 고급 AI 추론
```

## 3. 주요 기능 모듈

### 3.1 Digital Twin (디지털 트윈)
**경로**: `src/features/digital-twin/`

#### 핵심 컴포넌트
- `Store3DViewer`: 3D 매장 뷰어
- `SceneComposer`: 3D 씬 구성 도구
- `AutoModelMapper`: 자동 모델 매핑
- `HeatmapOverlay`: 히트맵 오버레이
- `CustomerPathOverlay`: 고객 동선 오버레이
- `WiFiTrackingOverlay`: WiFi 트래킹 오버레이

#### 주요 페이지
- `/digital-twin/3d`: 3D 디지털 트윈 뷰어
- `/digital-twin/setup-3d-data`: 3D 데이터 설정
- `/digital-twin/wifi-tracking-demo`: WiFi 트래킹 데모

### 3.2 Store Analysis (매장 분석)
**경로**: `src/features/store-analysis/`

#### Footfall (유동인구 분석)
- `TrafficHeatmap`: 트래픽 히트맵
- `ConversionFunnel`: 전환 퍼널
- `CustomerJourney`: 고객 여정 분석
- `FootfallVisualizer`: 유동인구 시각화

#### Stores (매장 관리)
- `StoreForm`: 매장 등록/수정
- `HQStoreSync`: 본사-지점 동기화

### 3.3 Profit Center (수익 센터)
**경로**: `src/features/profit-center/`

#### Demand & Inventory (수요 및 재고)
- `DemandForecast`: 수요 예측
- `InventoryOptimizer`: 재고 최적화

#### Personalization (개인화)
- `LayoutSimulator`: 레이아웃 시뮬레이터
- Customer Recommendations (개발 중)

#### Pricing (가격 최적화)
- Pricing Optimizer (개발 중)

### 3.4 Cost Center (비용 센터)
**경로**: `src/features/cost-center/`

#### Automation (자동화)
- `ProductPerformance`: 상품 성과 분석
- `StaffEfficiency`: 직원 효율성 분석

### 3.5 Data Management (데이터 관리)
**경로**: `src/features/data-management/`

#### Import (데이터 임포트)
- `CSVDataImport`: CSV 데이터 임포트
- `ThreeDModelUpload`: 3D 모델 업로드
- `WiFiDataManagement`: WiFi 데이터 관리
- `SchemaMapper`: 스키마 매핑
- `StorageManager`: 스토리지 관리

#### Analysis (분석)
- `AIAnalysisButton`: AI 분석 트리거
- `AIInsights`: AI 인사이트 표시
- `AdvancedFilters`: 고급 필터
- `ComparisonView`: 비교 뷰
- `EnhancedChart`: 향상된 차트

#### Ontology (온톨로지)
- `EntityTypeManager`: 엔티티 타입 관리
- `RelationTypeManager`: 관계 타입 관리
- `SchemaGraphVisualization`: 스키마 그래프 시각화
- `OntologyVariableCalculator`: 온톨로지 변수 계산기
- `GraphQueryBuilder`: 그래프 쿼리 빌더

#### NeuralSense (WiFi 센서)
- `DeviceRegistrationForm`: 디바이스 등록
- `DeviceList`: 디바이스 목록
- `WiFiDataUploader`: WiFi 데이터 업로드

#### BigData API
- `DataSourceForm`: 데이터 소스 등록
- `SyncScheduleForm`: 동기화 스케줄 설정

## 4. 데이터 플로우

### 4.1 데이터 임포트 플로우
```
1. 사용자 데이터 업로드 (CSV/Excel)
   ↓
2. 자동 스키마 분류 (AI 기반)
   ↓
3. 데이터 정규화 및 검증
   ↓
4. Supabase Storage 저장
   ↓
5. 메타데이터 DB 저장
   ↓
6. 온톨로지 그래프 생성 (선택)
```

### 4.2 3D 디지털 트윈 플로우
```
1. 3D 모델 업로드 (.glb/.gltf)
   ↓
2. 파일명 파싱 (EntityType_Identifier_WxHxD.glb)
   ↓
3. Storage 저장
   ↓
4. 온톨로지 엔티티 생성
   ↓
5. 3D 좌표 매핑
   ↓
6. Scene Viewer 렌더링
```

### 4.3 WiFi 트래킹 플로우
```
1. WiFi 센서 등록 (NeuralSense)
   ↓
2. Raw Signal 수집 (RSSI)
   ↓
3. Trilateration 위치 추정
   ↓
4. 좌표 정규화 (매장 좌표계)
   ↓
5. 히트맵 캐시 생성
   ↓
6. 3D 오버레이 표시
```

### 4.4 AI 분석 플로우
```
1. 사용자 분석 요청
   ↓
2. 데이터 수집 (Storage + DB)
   ↓
3. Edge Function 호출
   ↓
4. Lovable AI 추론 (Gemini/GPT)
   ↓
5. 인사이트 생성
   ↓
6. 분석 이력 저장
   ↓
7. UI 표시 및 알림
```

## 5. 기술 스택

### 5.1 프론트엔드
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **3D Rendering**: Three.js + React Three Fiber + Drei
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Graph Visualization**: React Force Graph 2D (D3.js)

### 5.2 백엔드 (Lovable Cloud)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Functions**: Edge Functions (Deno)
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime

### 5.3 AI/ML
- **Lovable AI**: Gemini 2.5, GPT-5 모델
- **분석 유형**:
  - 데이터 분류 (스키마 매핑)
  - 인사이트 생성
  - 추천 시스템
  - 이상 탐지

## 6. 환경 설정

### 6.1 필수 환경 변수
```env
VITE_SUPABASE_URL=https://fbffryjvvykhgoviektl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[자동 설정]
VITE_SUPABASE_PROJECT_ID=fbffryjvvykhgoviektl
```

### 6.2 Supabase 설정
- **프로젝트 ID**: fbffryjvvykhgoviektl
- **Region**: ap-northeast-2 (서울)
- **Auth 설정**: 
  - Email/Password 활성화
  - Auto-confirm Email 활성화
- **Storage 정책**: RLS 활성화

## 7. 배포 및 운영

### 7.1 배포 프로세스
1. **프론트엔드**: Lovable 자동 배포 (lovable.app)
2. **백엔드**: Edge Functions 자동 배포
3. **데이터베이스**: Migration 자동 실행

### 7.2 모니터링
- Supabase Dashboard: 데이터베이스 상태
- Edge Function Logs: 함수 실행 로그
- Analytics: 사용자 행동 분석

## 8. 보안 고려사항

### 8.1 Row Level Security (RLS)
- 모든 테이블에 RLS 정책 적용
- user_id 기반 데이터 격리
- store_id 기반 접근 제어

### 8.2 인증 & 권한
- JWT 기반 인증
- 사용자별 데이터 격리
- 관리자 권한 분리

### 8.3 데이터 보호
- Storage 파일 암호화
- 민감 정보 제외 (개인정보)
- HTTPS 통신 강제

## 9. 성능 최적화

### 9.1 프론트엔드
- Code Splitting (React.lazy)
- 이미지 최적화 (WebP)
- 3D 모델 LOD (Level of Detail)
- Virtual Scrolling (대량 데이터)

### 9.2 백엔드
- Database Indexing
- Query Optimization
- Caching (wifi_heatmap_cache)
- Connection Pooling

## 10. 향후 확장 계획

### 10.1 단기 (1-3개월)
- [ ] 고급 AI 추천 알고리즘
- [ ] 실시간 알림 시스템
- [ ] 모바일 반응형 개선
- [ ] 다국어 지원 (영어)

### 10.2 중기 (3-6개월)
- [ ] 멀티 테넌시 지원
- [ ] 고급 권한 관리
- [ ] 커스텀 대시보드 빌더
- [ ] API 외부 제공

### 10.3 장기 (6-12개월)
- [ ] AR/VR 매장 경험
- [ ] IoT 센서 통합 확장
- [ ] 블록체인 기반 데이터 검증
- [ ] 메타버스 매장 연동
