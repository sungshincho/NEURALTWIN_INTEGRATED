# Supabase Edge Functions 인벤토리

> 총 **50개** Edge Functions + `_shared/` 공유 모듈

## Import Map

모든 EF는 `deno.json`의 Import Map을 통해 의존성 버전을 통일합니다:

- `@supabase/supabase-js` → `2.89.0`
- `xlsx` → `0.18.5`

## Edge Functions 목록

### AI / ML

| 함수명 | 설명 |
|--------|------|
| `advanced-ai-inference` | ⚠️ Deprecated 예정. AI 추론 엔진 (시뮬레이션, 최적화, 분석). `generate-optimization`으로 마이그레이션 중 |
| `generate-optimization` | 매장 최적화 생성 (레이아웃, 인력, VMD). 환경/동선/고객 데이터 기반 AI 분석 |
| `retail-ai-inference` | 리테일 전문 AI 추론 엔진 |
| `run-simulation` | AI 시뮬레이션 엔진 (동선 시뮬레이션, 혼잡도 분석) |
| `unified-ai` | AI 함수 통합 엔드포인트 (추론, 시뮬레이션, 최적화 통합) |
| `trigger-learning` | AI 학습 트리거 (Sprint 3 자동 학습) |

### 챗봇 / 어시스턴트

| 함수명 | 설명 |
|--------|------|
| `neuraltwin-assistant` | OS 대시보드용 AI 어시스턴트 (스튜디오 제어, 시뮬레이션 실행, 데이터 조회) |
| `retail-chatbot` | 웹사이트 방문자용 리테일 AI 챗봇 |

### 데이터 ETL / 임포트

| 함수명 | 설명 |
|--------|------|
| `upload-file` | 파일 업로드 및 임포트 세션 생성 |
| `parse-file` | 업로드된 파일(CSV, Excel) 파싱 및 프리뷰 생성 |
| `execute-import` | ETL 실행 — 데이터 변환 및 타겟 테이블 저장 (customers, transactions, staff, inventory) |
| `rollback-import` | 임포트 롤백 처리 |
| `replay-import` | raw_imports 재처리 (raw data 보존, replay 가능) |
| `validate-data` | 데이터 검증 — 타입별 규칙 검증 및 에러 리포팅 |
| `unified-etl` | ETL 함수 통합 엔드포인트 (upload, parse, execute, validate 통합) |
| `import-with-ontology` | 온톨로지 기반 임포트 (엔티티 자동 생성, 타입 매핑) |
| `integrated-data-pipeline` | 통합 데이터 파이프라인 실행 |
| `auto-map-etl` | ETL 자동 매핑 |

### 데이터 소스 / API 연동

| 함수명 | 설명 |
|--------|------|
| `api-connector` | API 연결 테스트 및 데이터 동기화 |
| `datasource-mapper` | 데이터소스 등록, 스키마 추론, 매핑 관리 통합 함수 |
| `sync-api-data` | 스케줄 기반 / 직접 API 연결 데이터 동기화 |
| `sync-preset-data` | 프리셋 데이터 동기화 |
| `environment-proxy` | 외부 환경 데이터 API 프록시 (CORS/시크릿 처리) |
| `graph-query` | 그래프 데이터 쿼리 |

### 매장 / KPI

| 함수명 | 설명 |
|--------|------|
| `aggregate-all-kpis` | 전체 KPI 집계 |
| `aggregate-dashboard-kpis` | 대시보드용 KPI 집계 |
| `simulation-data-mapping` | 시뮬레이션 허브 데이터 소스 매핑 상태 조회 및 관리 |
| `smart-ontology-mapping` | 스마트 온톨로지 매핑 |
| `inventory-monitor` | 재고 모니터링 |

### IoT / 센서

| 함수명 | 설명 |
|--------|------|
| `process-neuralsense-data` | NEURALSENSE 센서 데이터 처리 (WiFi/BLE Probe Request → zone_events 변환) |
| `process-wifi-data` | WiFi 데이터 처리 |

### 3D / 시각화

| 함수명 | 설명 |
|--------|------|
| `analyze-3d-model` | 3D 모델 분석 |
| `auto-process-3d-models` | 3D 모델 자동 처리 |
| `upscale-image` | 이미지 업스케일링 |

### 외부 데이터 동기화

| 함수명 | 설명 |
|--------|------|
| `sync-holidays` | 공휴일 데이터 동기화 |
| `sync-poi-context` | POI(관심 지점) 컨텍스트 동기화 |
| `sync-trend-signals` | 트렌드 시그널 동기화 |

### 지식 관리

| 함수명 | 설명 |
|--------|------|
| `knowledge-admin` | 벡터 지식 DB 관리 API |

### 시스템 / 유틸리티

| 함수명 | 설명 |
|--------|------|
| `etl-health` | ETL 파이프라인 Health Check (데이터 컨트롤타워 모니터링용) |
| `etl-scheduler` | ETL 스케줄러 |
| `submit-contact` | Contact Form 제출 처리 및 Zapier Webhook 연동 |
| `generate-template` | 임포트 타입별 샘플 템플릿(CSV/Excel) 생성 |

### 통합 핸들러

| 함수명 | 설명 |
|--------|------|
| `bright-processor` | 데이터 검증 및 처리 (타입별 규칙 검증, 에러 리포팅) |
| `dynamic-handler` | 파일 업로드 및 임포트 세션 동적 처리 |
| `dynamic-responder` | 시뮬레이션 데이터 매핑 동적 응답 |
| `hyper-task` | 파일 파싱 및 프리뷰 생성 (Excel 지원) |
| `quick-handler` | ETL 실행 — 빠른 데이터 변환 핸들러 |

### 미사용 후보 (팀 검토 필요)

| 함수명 | 사유 | 프론트엔드 사용 |
|--------|------|-----------------|
| `super-responder` | `dynamic-responder`와 기능 중복 의심 | ❌ |
| `smooth-api` | `generate-template`과 기능 중복 의심 | ❌ |
| `ai-batch-qa-test` | QA 테스트 전용 | ❌ |

> `environment-proxy`는 `os-dashboard`에서 사용 중이므로 삭제 불가.

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
