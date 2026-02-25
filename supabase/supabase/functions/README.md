# Supabase Edge Functions 인벤토리

> 총 **50개** Edge Functions + `_shared/` 공유 모듈

## Import Map

모든 EF는 `deno.json`의 Import Map을 통해 의존성 버전을 통일합니다:

- `@supabase/supabase-js` → `2.89.0`
- `xlsx` → `0.18.5`

## 카테고리별 요약

| 카테고리 | 함수 수 | 비고 |
|----------|---------|------|
| AI/ML | 13 | 시뮬레이션, 최적화, 추론, 챗봇, 학습 등 |
| Data ETL | 22 | 파일 업로드/파싱, 검증, 임포트, 파이프라인, 롤백, 스케줄링 등 |
| Store Management | 3 | KPI 집계, 재고 모니터링, 시뮬레이션 데이터 매핑 |
| IoT | 2 | NEURALSENSE 센서 데이터, WiFi 트래킹 |
| Admin | 5 | 지식DB 관리, 공휴일/POI/트렌드/프리셋 동기화 |
| Utility | 5 | 환경 프록시, 템플릿 생성, 문의폼, 이미지 업스케일 |

## Edge Functions 전체 목록

### AI / ML (13개)

| 함수명 | 설명 |
|--------|------|
| `advanced-ai-inference` | ⚠️ Deprecated 예정. 인과분석, 이상탐지, 예측, 패턴분석, 동선/혼잡 시뮬레이션 등 고급 AI 추론 (`generate-optimization`으로 이관 중) |
| `ai-batch-qa-test` | AI 시뮬레이션/최적화 함수의 모든 변수 조합을 자동 배치 테스트하고 파인튜닝용 데이터셋 품질 검증 (QA 전용) |
| `analyze-3d-model` | 업로드된 3D 모델 파일(GLB/OBJ)을 AI로 분석하여 온톨로지 엔티티 타입 추론 및 매핑 |
| `auto-process-3d-models` | 복수의 3D 모델 파일을 배치로 자동 처리하여 온톨로지 엔티티 타입 추론 |
| `generate-optimization` | 환경/동선/고객 데이터 기반으로 매장 레이아웃, 인력, VMD 최적화안을 AI로 생성 |
| `graph-query` | N-hop 탐색, 최단경로, PageRank, 커뮤니티 탐지, Cypher-like 쿼리 등 지식 그래프 질의 |
| `neuraltwin-assistant` | OS 대시보드용 AI 어시스턴트 — 인텐트 분류, 네비게이션 제어, KPI 조회, 시뮬레이션/최적화 실행 |
| `retail-ai-inference` | 온톨로지 그래프 + 리테일 도메인 지식 기반 AI 추론 (레이아웃 최적화, 수요예측, 이상탐지) |
| `retail-chatbot` | 웹사이트 방문자용 리테일 AI 챗봇 — SSE 스트리밍, 토픽 라우팅, 벡터 검색, 대화 메모리 |
| `run-simulation` | 매장 데이터 기반 고객 행동, 혼잡도, 병목, 동선 AI 시뮬레이션 및 진단 이슈 생성 |
| `trigger-learning` | 피드백 축적 시 자동 페르소나 업데이트, 성공/실패 패턴 분석, 신뢰도 조정 학습 트리거 |
| `unified-ai` | KPI 추천, 온톨로지 추천, 이상탐지, 패턴분석, 관계추론 등 AI 기능 단일 엔드포인트 통합 |

### Data ETL / 임포트 (22개)

| 함수명 | 설명 |
|--------|------|
| `upload-file` | 파일(CSV/XLSX/JSON/GLB)을 Supabase Storage에 업로드하고 임포트 세션 생성 |
| `parse-file` | 업로드된 CSV/XLSX 파일을 파싱하여 컬럼 목록, 데이터 프리뷰, 자동 매핑 제안 생성 |
| `execute-import` | 컬럼 매핑에 따라 데이터를 변환하여 타겟 테이블(products, customers, transactions 등)에 저장 |
| `validate-data` | 임포트 데이터의 타입별 검증 규칙(필수값, 형식, 범위, 유니크)으로 검증 및 에러 리포팅 |
| `rollback-import` | 특정 임포트 세션에서 저장된 데이터를 타겟 테이블에서 롤백(삭제) |
| `replay-import` | raw_imports의 원본 데이터를 재처리(replay)하여 ETL 파이프라인 재실행 |
| `unified-etl` | raw_to_l2, l1_to_l2, l2_to_l3, 스키마 ETL, full_pipeline 등 ETL 타입을 단일 엔드포인트로 통합 |
| `import-with-ontology` | 임포트 데이터를 온톨로지 엔티티로 변환하고 raw_imports에 원본 보존, 그래프 DB 적재 |
| `integrated-data-pipeline` | CSV 파싱부터 검증, 매핑, ETL까지 전체 임포트 파이프라인을 단일 호출로 통합 실행 |
| `auto-map-etl` | 임포트 데이터의 컬럼과 샘플을 AI로 분석하여 온톨로지 스키마에 자동 매핑 |
| `smart-ontology-mapping` | 임포트 데이터에서 ID/FK 컬럼을 분석하여 온톨로지 엔티티와 관계를 자동 매핑 |
| `api-connector` | 외부 API 연결 테스트, 데이터 동기화 실행, 필드 매핑 미리보기, 매핑 템플릿 적용 |
| `datasource-mapper` | 데이터소스 등록, 스키마 자동 추론, 엔티티/관계 매핑 생성 및 관리 통합 함수 |
| `sync-api-data` | 스케줄 기반 또는 직접 API 연결을 통해 외부 데이터를 동기화하고 raw_imports에 저장 |
| `etl-health` | ETL 파이프라인의 L1/L2/L3 레이어별 헬스체크 및 데이터 신선도 모니터링 API |
| `etl-scheduler` | 모든 조직에 대해 unified-etl full_pipeline을 스케줄 기반으로 자동 실행하는 배치 스케줄러 |
| `bright-processor` | 🔗 `validate-data`의 별칭(alias) |
| `dynamic-handler` | 🔗 `upload-file`의 별칭(alias) |
| `hyper-task` | 🔗 `parse-file`의 별칭(alias) |
| `quick-handler` | 🔗 `execute-import`의 별칭(alias) |
| `super-responder` | 🔗 `rollback-import`의 별칭(alias) |
| `smooth-api` | 🔗 `generate-template`의 별칭(alias) |

### 매장 / KPI (3개)

| 함수명 | 설명 |
|--------|------|
| `aggregate-all-kpis` | 온톨로지 기반 방문/구매 엔티티에서 전체 기간 KPI를 집계하여 반환 |
| `aggregate-dashboard-kpis` | 특정 날짜 기준으로 대시보드에 표시할 일별 KPI(방문수, 매출 등)를 온톨로지에서 집계 |
| `simulation-data-mapping` | 시뮬레이션 허브에서 사용할 데이터소스 매핑 상태 조회 및 API 연동 관리 |
| `inventory-monitor` | 재고 수준 모니터링 — 재주문점, 안전재고 이하 알림 및 재고 상태 분석 |

### IoT / 센서 (2개)

| 함수명 | 설명 |
|--------|------|
| `process-neuralsense-data` | NEURALSENSE IoT 센서(WiFi/BLE Probe)의 원시 데이터를 수신하여 zone_events로 변환 |
| `process-wifi-data` | WiFi 트래킹 데이터(좌표, 세션, 정확도)를 수신하여 존 매핑 및 센서 데이터 처리 |

### Admin (5개)

| 함수명 | 설명 |
|--------|------|
| `knowledge-admin` | 벡터 지식 DB에 리테일 도메인 지식을 마이그레이션/시딩하고 통계 및 임베딩 품질 검증 |
| `sync-holidays` | Calendarific API를 통해 공휴일 데이터를 조직 단위로 동기화 (관리자 전용) |
| `sync-poi-context` | 매장 주변 POI(관심지점) 데이터를 외부 소스에서 동기화하여 매장 컨텍스트로 저장 |
| `sync-preset-data` | 등록된 프리셋 API 연결(날씨, 경제지표 등)의 데이터를 일괄 동기화 (관리자 전용) |
| `sync-trend-signals` | 카테고리/브랜드/키워드별 트렌드 지수를 외부 소스에서 동기화하여 트렌드 시그널로 저장 |

### Utility (5개)

| 함수명 | 설명 |
|--------|------|
| `environment-proxy` | OpenWeatherMap 날씨 데이터와 공휴일 데이터를 프록시로 조회하고 DB에 저장 |
| `generate-template` | 임포트 타입별(products, customers 등) 샘플 CSV/JSON 템플릿을 한/영 다국어로 생성 |
| `submit-contact` | 웹사이트 Contact Form 제출 처리 및 Zapier Webhook 알림 전송 |
| `upscale-image` | 이미지 URL(base64 또는 공개 URL)을 받아 AI 기반 이미지 업스케일링 수행 |
| `dynamic-responder` | 🔗 `simulation-data-mapping`의 별칭(alias) |

---

## 별칭(Alias) 함수 매핑

다음 7개 함수는 다른 함수의 코드를 복사하여 별도 엔드포인트로 배포된 별칭 함수입니다.
후속 정리 작업에서 통합 검토가 필요합니다.

| 별칭 함수 | 원본 함수 |
|-----------|-----------|
| `bright-processor` | `validate-data` |
| `dynamic-handler` | `upload-file` |
| `dynamic-responder` | `simulation-data-mapping` |
| `hyper-task` | `parse-file` |
| `quick-handler` | `execute-import` |
| `smooth-api` | `generate-template` |
| `super-responder` | `rollback-import` |

---

## _shared/ 공유 모듈 (17개 파일)

| 파일 | 설명 |
|------|------|
| `supabase-client.ts` | Supabase 클라이언트 팩토리 (Admin/Anon) |
| `aiResponseLogger.ts` | AI 응답 로깅 시스템 |
| `chatEventLogger.ts` | 채팅 이벤트 로거 |
| `chatLogger.ts` | 채팅 메시지 저장 |
| `chatTypes.ts` | 채팅 관련 타입 정의 |
| `errorHandler.ts` | 에러 핸들러 유틸 |
| `rateLimiter.ts` | Rate Limiting |
| `safeJsonParse.ts` | 안전한 JSON 파싱 (fallback 포함) |
| `streamingResponse.ts` | 스트리밍 응답 유틸 |
| `calculations/index.ts` | 계산 모듈 진입점 |
| `calculations/roiPredictor.ts` | ROI 예측기 |
| `calculations/roiPredictor_v2.ts` | ROI 예측기 v2 |
| `calculations/trafficFlow.ts` | 고객 동선 분석 |
| `calculations/validation.ts` | 계산 검증 유틸 |
| `optimization/integratedOptimization.ts` | 통합 최적화 엔진 |
| `persona/storePersonaLoader.ts` | 매장 페르소나 로더 |
| `vmd/vmdRulesetLoader.ts` | VMD 규칙셋 로더 |
