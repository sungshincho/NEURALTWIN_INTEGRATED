# DB 스키마 비교: 문서 vs 실제 DB

> **비교 일시**: 2026-02-23
> **문서**: REPO_ANALYSIS_C.md 섹션 5.1 (코드 역공학 기반, 76개 테이블)
> **실제 DB**: NEURALTWIN_backend (`bdrvowacecxnraaivlhr`) public 스키마 (153개 테이블 + 12개 뷰)

---

## 1. 문서에는 있는데 실제 DB에 없는 테이블: 0개

문서(76개)의 모든 테이블이 실제 DB에 존재합니다.

---

## 2. 실제 DB에는 있는데 문서에 없는 테이블: 77개

### 2.1 AI & Analytics (6개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 1 | `ai_inference_logs` | 17 | AI 추론 실행 로그 |
| 2 | `ai_insights` | 12 | AI 인사이트 |
| 3 | `ai_model_performance` | 19 | AI 모델 성능 추적 |
| 4 | `ai_scene_analysis` | 9 | AI 매장 씬 분석 |
| 5 | `analysis_history` | 8 | 분석 실행 이력 |
| 6 | `kpis` | 12 | KPI 마스터 정의 |

### 2.2 Core Business 확장 (7개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 7 | `customer_segments` | 13 | 고객 세그먼트 정의 |
| 8 | `customer_segments_agg` | 16 | 고객 세그먼트 집계 |
| 9 | `daily_sales` | 10 | 일별 매출 집계 |
| 10 | `inventory` | 9 | 재고 현황 |
| 11 | `inventory_history` | 12 | 재고 변동 이력 |
| 12 | `inventory_movements` | 13 | 재고 이동 기록 |
| 13 | `shift_schedules` | 14 | 근무 스케줄 |

### 2.3 HQ Management (5개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 14 | `hq_guidelines` | 14 | 본사 가이드라인 |
| 15 | `hq_notifications` | 11 | 본사 알림 |
| 16 | `hq_store_messages` | 16 | 본사-매장 메시지 |
| 17 | `store_comments` | 11 | 매장 코멘트 |
| 18 | `store_goals` | 12 | 매장 목표 설정 |

### 2.4 IoT Tracking (5개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 19 | `beacon_events` | 9 | 비콘 이벤트 |
| 20 | `beacons` | 8 | 비콘 장치 정보 |
| 21 | `camera_events` | 10 | 카메라 이벤트 |
| 22 | `web_events` | 10 | 웹 이벤트 추적 |
| 23 | `wifi_events` | 11 | WiFi 이벤트 |

### 2.5 Subscription / License (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 24 | `license_billing_history` | 10 | 라이선스 결제 이력 |
| 25 | `licenses` | 15 | 라이선스 관리 |
| 26 | `subscriptions` | 19 | 구독 정보 |

### 2.6 User / Auth / Onboarding (6개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 27 | `invitations` | 12 | 초대 관리 |
| 28 | `onboarding_progress` | 18 | 온보딩 진행 상태 |
| 29 | `profiles` | 5 | 사용자 프로필 |
| 30 | `user_activity_logs` | 8 | 사용자 활동 로그 |
| 31 | `user_guide_completions` | 4 | 가이드 완료 기록 |
| 32 | `quickstart_guides` | 13 | 퀵스타트 가이드 |

### 2.7 External Data & Sync 확장 (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 33 | `pos_integrations` | 21 | POS 시스템 연동 |
| 34 | `sync_endpoints` | 23 | 동기화 엔드포인트 |
| 35 | `sync_logs` | 14 | 동기화 로그 |

### 2.8 POS Realtime (2개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 36 | `realtime_inventory` | 20 | 실시간 재고 (POS 연동) |
| 37 | `realtime_transactions` | 25 | 실시간 거래 (POS 연동) |

### 2.9 Learning & Optimization 확장 (5개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 38 | `applied_strategies` | 25 | 적용된 전략 |
| 39 | `feedback_reason_codes` | 7 | 피드백 사유 코드 |
| 40 | `optimization_tasks` | 18 | 최적화 작업 |
| 41 | `recommendation_applications` | 19 | 추천 적용 기록 |
| 42 | `roi_measurements` | 13 | ROI 측정 |

### 2.10 Graph / Ontology 확장 (5개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 43 | `ontology_relation_inference_queue` | 9 | 관계 추론 큐 |
| 44 | `ontology_schema_versions` | 7 | 온톨로지 스키마 버전 |
| 45 | `ontology_schemas` | 11 | 온톨로지 스키마 정의 |
| 46 | `retail_concept_values` | 7 | 소매 개념 값 |
| 47 | `retail_concepts` | 14 | 소매 개념 정의 |

### 2.11 Furniture & Layout 확장 (VMD/3D) (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 48 | `furniture_facings` | 4 | 가구 페이싱 마스터 |
| 49 | `furniture_height_zones` | 7 | 가구 높이대 마스터 |
| 50 | `vmd_zone_types` | 6 | VMD 구역 유형 마스터 |

### 2.12 Spatial / Zone 확장 (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 51 | `visit_zone_events` | 12 | 방문-구역 이벤트 |
| 52 | `zone_metrics` | 12 | 구역 지표 |
| 53 | `zone_performance` | 15 | 구역 성과 |

### 2.13 3D / Spatial (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 54 | `model_3d_files` | 15 | 3D 모델 파일 |
| 55 | `product_models` | 7 | 상품 3D 모델 |
| 56 | `store_scenes` | 12 | 매장 씬 구성 |

### 2.14 Simulation 확장 (2개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 57 | `scenarios` | 11 | 시나리오 정의 |
| 58 | `simulation_configs` | 11 | 시뮬레이션 설정 |

### 2.15 Data Import / ETL 확장 (3개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 59 | `column_mappings` | 8 | 컬럼 매핑 규칙 |
| 60 | `field_transform_rules` | 13 | 필드 변환 규칙 |
| 61 | `import_type_schemas` | 9 | 임포트 유형별 스키마 |

### 2.16 Chat System 확장 (1개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 62 | `chat_daily_analytics` | 11 | 채팅 일별 분석 |

### 2.17 System / Notification (5개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 63 | `alerts` | 14 | 시스템 알림 |
| 64 | `notification_settings` | 9 | 알림 설정 |
| 65 | `push_subscriptions` | 5 | 푸시 구독 |
| 66 | `user_alerts` | 16 | 사용자 알림 |
| 67 | `report_schedules` | 13 | 보고서 스케줄 |

### 2.18 System / Misc (6개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 68 | `assistant_command_cache` | 9 | 어시스턴트 명령 캐시 |
| 69 | `kpi_snapshots` | 15 | KPI 스냅샷 |
| 70 | `models` | 10 | ML 모델 레지스트리 |
| 71 | `organization_settings` | 12 | 조직 설정 |
| 72 | `sample_data_templates` | 23 | 샘플 데이터 템플릿 |
| 73 | `tasks` | 15 | 작업 관리 |

### 2.19 Strategy (2개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 74 | `staff_assignments` | 20 | 직원 배치 |
| 75 | `strategy_daily_metrics` | 7 | 전략 일별 지표 |

### 2.20 기타 (2개)

| # | 테이블명 | 컬럼 수 | 추정 용도 |
|---|---------|---------|----------|
| 76 | `funnel_metrics` | 11 | 퍼널 지표 집계 |
| 77 | `v_org_id` | 1 | 조직 ID (materialized/helper) |

---

## 3. 요약

| 구분 | 수 |
|------|---|
| 문서에 기록된 테이블 | 76 |
| 실제 DB 테이블 | 153 |
| 실제 DB 뷰 | 12 |
| 문서에만 있는 테이블 | **0** |
| DB에만 있는 테이블 | **77** |
| **문서 커버리지** | **49.7%** |

### 누락 영역 분포

| 카테고리 | 누락 수 | 비고 |
|---------|---------|------|
| Core Business 확장 | 7 | 재고, 세그먼트, 스케줄 |
| AI & Analytics | 6 | 추론 로그, 모델 성능 |
| User / Auth / Onboarding | 6 | 프로필, 온보딩, 가이드 |
| HQ Management | 5 | 본사 관리 기능 전체 누락 |
| IoT Tracking | 5 | 비콘, 카메라, 웹 이벤트 |
| System / Notification | 5 | 알림, 푸시 |
| Learning & Optimization 확장 | 5 | 전략 적용, ROI 측정 |
| Graph / Ontology 확장 | 5 | 스키마 버전, 소매 개념 |
| System / Misc | 6 | 캐시, 모델 레지스트리, 설정 |
| External Data & Sync 확장 | 3 | POS 연동, 동기화 |
| Data Import / ETL 확장 | 3 | 매핑, 변환 규칙 |
| Furniture & Layout (VMD/3D) | 3 | VMD 마스터 테이블 |
| Spatial / Zone 확장 | 3 | 구역 지표/성과 |
| 3D / Spatial | 3 | 3D 모델, 씬 |
| Subscription / License | 3 | 구독/라이선스 전체 누락 |
| POS Realtime | 2 | 실시간 재고/거래 |
| Simulation 확장 | 2 | 시나리오, 설정 |
| Strategy | 2 | 직원 배치, 전략 지표 |
| Chat System 확장 | 1 | 일별 분석 |
| 기타 | 2 | 퍼널 지표, v_org_id |

> **원인**: 문서는 Edge Function 코드의 Supabase 클라이언트 호출 패턴(`.from()`, `.select()`, `.insert()`)만으로 역공학했기 때문에, 코드에서 직접 참조되지 않는 테이블(마스터 데이터, 시스템 테이블, RPC 전용 테이블 등)이 누락됨.
