# 테이블 정리 분석 보고서

**작성일**: 2025-12-16
**버전**: 2.0 (코드 마이그레이션 완료)

---

## 1. Phase 1: 백업 테이블 삭제 (완료)

다음 7개 백업 테이블 삭제 SQL이 실행 완료되었습니다:

```sql
-- Phase 1: 백업 테이블 삭제 (실행 완료)
DROP TABLE IF EXISTS daily_kpis_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS daily_sales_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS store_visits_backup_20250608 CASCADE;
DROP TABLE IF EXISTS zone_daily_metrics_backup_20250610 CASCADE;
DROP TABLE IF EXISTS customer_daily_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS hourly_kpis_agg_backup_20250610 CASCADE;
DROP TABLE IF EXISTS hourly_zone_agg_backup_20250610 CASCADE;
```

**예상 공간 절약**: 약 15MB

---

## 2. Phase 2: 코드 마이그레이션 (완료)

### 2.1 visits → store_visits 마이그레이션 완료

**수정된 파일:**
- `src/hooks/useStoreData.ts`
  - SupportedTable 타입 변경: `'visits'` → `'store_visits'`
  - tableNameMap 매핑 변경 (2개소)
  - useStoreDataset 쿼리 변경
  - useVisits 훅 쿼리 변경

- `src/features/simulation/hooks/useDataSourceMapping.ts`
  - loadDataSourceStatusFallback 함수 내 visits 쿼리 → store_visits로 변경

**변경 사항:**
```typescript
// Before
.from('visits')

// After
.from('store_visits')  // visits → store_visits 마이그레이션
```

---

## 3. 즉시 삭제 가능 테이블 목록

### 3.1 Phase 2 삭제 SQL (즉시 실행 가능)

```sql
-- ============================================
-- Phase 2: 즉시 삭제 가능 테이블
-- 실행 전 백업 권장
-- ============================================

-- 1. zone_performance (레거시, 코드에서 미사용)
-- 크기: 3.7MB, 행: 630
DROP TABLE IF EXISTS zone_performance CASCADE;

-- 2. visits (store_visits로 마이그레이션 완료)
-- 크기: 8KB, 행: 0
DROP TABLE IF EXISTS visits CASCADE;
```

**예상 공간 절약**: 약 3.8MB

---

## 4. 중복 테이블 상세 분석

### 4.1 zone_performance vs zone_daily_metrics

| 구분 | zone_performance | zone_daily_metrics |
|------|------------------|-------------------|
| **행 수** | 630 rows | 630 rows |
| **크기** | 3.7MB | 568 KB |
| **코드 사용** | ❌ 0개 파일 | ✅ 2개 파일 (4회 호출) |
| **FK 관계** | zone_name (문자열) | zone_id (FK to zones_dim) |
| **데이터 완성도** | hourly_visits, heatmap_data | entry/exit_count, interaction_count, peak_hour 등 |

**결론**: `zone_performance`는 레거시 테이블. **삭제 가능**.

---

### 4.2 visits vs store_visits (마이그레이션 완료)

| 구분 | visits | store_visits |
|------|--------|--------------|
| **행 수** | 0 rows | 3,553 rows |
| **크기** | 8 KB | 1.1 MB |
| **코드 사용** | ❌ 0개 파일 (마이그레이션됨) | ✅ 6개 파일 (9회 호출) |
| **데이터 완성도** | 기본 필드만 | 확장 필드 포함 |

**결론**: 코드 마이그레이션 완료. `visits` **삭제 가능**.

---

### 4.3 dashboard_kpis vs daily_kpis_agg (보류)

| 구분 | dashboard_kpis | daily_kpis_agg |
|------|----------------|----------------|
| **행 수** | 90 rows | 90 rows |
| **크기** | 72 KB | 112 KB |
| **코드 사용** | ✅ 3개 파일 (4회 호출) | ✅ 9개 파일 (19회 호출) |
| **주요 용도** | ROI 추적, 임포트 상태 | KPI 대시보드, 알림, 인사이트 |

**dashboard_kpis 사용 위치:**
- `src/hooks/useROITracking.ts` - ROI 추적
- `src/features/data-management/import/components/IntegratedImportStatus.tsx` - 데이터 삭제
- `src/features/simulation/hooks/useStoreContext.ts` - 스토어 컨텍스트
- `src/features/simulation/hooks/useDataSourceMapping.ts` - 데이터 소스 매핑

**결론**: 두 테이블 모두 **활발히 사용 중**. 현재는 삭제 불가.
향후 통합 리팩토링 권장.

---

## 5. 필수 시딩 테이블 데이터

### 5.1 staff 테이블 (0 rows)

**사용 위치:**
- `src/hooks/useStoreData.ts` (2회)

**필수 시딩 SQL:**

```sql
-- staff 샘플 데이터 (15명 직원)
INSERT INTO staff (id, staff_name, staff_code, role, department, email, phone, hire_date, hourly_rate, store_id, org_id, is_active)
VALUES
  -- 매장 관리자
  ('staff-001', '김민수', 'MGR001', 'store_manager', 'management', 'minsu.kim@store.com', '010-1234-5678', '2020-03-15', 35000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-002', '이서연', 'MGR002', 'assistant_manager', 'management', 'seoyeon.lee@store.com', '010-2345-6789', '2021-06-01', 28000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 판매 직원
  ('staff-003', '박지훈', 'SLS001', 'sales_associate', 'sales', 'jihun.park@store.com', '010-3456-7890', '2022-01-10', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-004', '최유나', 'SLS002', 'sales_associate', 'sales', 'yuna.choi@store.com', '010-4567-8901', '2022-03-20', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-005', '정현우', 'SLS003', 'senior_sales', 'sales', 'hyunwoo.jung@store.com', '010-5678-9012', '2021-08-15', 18000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-006', '한소희', 'SLS004', 'sales_associate', 'sales', 'sohee.han@store.com', '010-6789-0123', '2023-02-01', 15000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-007', '오준혁', 'SLS005', 'sales_associate', 'sales', 'junhyuk.oh@store.com', '010-7890-1234', '2023-05-10', 15000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 재고 관리
  ('staff-008', '윤지민', 'INV001', 'inventory_manager', 'operations', 'jimin.yun@store.com', '010-8901-2345', '2021-04-01', 22000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-009', '임도현', 'INV002', 'inventory_staff', 'operations', 'dohyun.lim@store.com', '010-9012-3456', '2022-09-15', 14000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 고객 서비스
  ('staff-010', '신예은', 'CSR001', 'customer_service', 'service', 'yeeun.shin@store.com', '010-0123-4567', '2022-11-01', 16000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-011', '강민재', 'CSR002', 'customer_service', 'service', 'minjae.kang@store.com', '010-1111-2222', '2023-01-15', 16000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 캐셔
  ('staff-012', '조수빈', 'CSH001', 'cashier', 'operations', 'subin.jo@store.com', '010-2222-3333', '2022-07-01', 14000, 'store-gangnam-001', 'org-neuraltwin', true),
  ('staff-013', '백승호', 'CSH002', 'cashier', 'operations', 'seungho.baek@store.com', '010-3333-4444', '2023-03-01', 14000, 'store-gangnam-001', 'org-neuraltwin', true),

  -- 비활성 직원 (퇴사)
  ('staff-014', '문채원', 'SLS006', 'sales_associate', 'sales', 'chaewon.moon@store.com', '010-4444-5555', '2021-01-01', 15000, 'store-gangnam-001', 'org-neuraltwin', false),
  ('staff-015', '류태준', 'INV003', 'inventory_staff', 'operations', 'taejun.ryu@store.com', '010-5555-6666', '2020-06-01', 14000, 'store-gangnam-001', 'org-neuraltwin', false);
```

---

### 5.2 transactions 테이블 (0 rows)

**사용 위치:**
- `src/features/simulation/hooks/useStoreContext.ts` (1회)
- `src/features/insights/hooks/useInsightMetrics.ts` (1회)
- `src/features/insights/hooks/useAIPrediction.ts` (1회)

**필수 시딩 SQL:**

```sql
-- transactions 샘플 데이터 (store_visits 연동)
INSERT INTO transactions (
  id, transaction_datetime, customer_id, store_id, visit_id,
  total_amount, discount_amount, net_amount, payment_method, channel
)
SELECT
  'txn-' || LPAD(row_number() OVER ()::text, 6, '0'),
  sv.visit_date::timestamp + (random() * interval '4 hours'),
  sv.customer_id,
  sv.store_id,
  sv.id,
  ROUND((random() * 200000 + 10000)::numeric, 0),
  ROUND((random() * 20000)::numeric, 0),
  ROUND((random() * 200000 + 10000 - random() * 20000)::numeric, 0),
  (ARRAY['credit_card', 'debit_card', 'cash', 'mobile_pay', 'gift_card'])[floor(random() * 5 + 1)],
  'in_store'
FROM store_visits sv
WHERE sv.made_purchase = true
  AND sv.visit_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY random()
LIMIT 500;
```

---

## 6. 전체 정리 요약

### 6.1 삭제 가능 테이블 (즉시 실행)

| 테이블명 | 크기 | 행 수 | 삭제 사유 |
|---------|------|-------|----------|
| `zone_performance` | 3.7MB | 630 | 레거시, 코드 미사용 |
| `visits` | 8KB | 0 | store_visits로 마이그레이션 완료 |
| **합계** | **~3.8MB** | - | - |

### 6.2 삭제 보류 테이블

| 테이블명 | 사유 |
|---------|------|
| `dashboard_kpis` | 4개 파일에서 활발히 사용 중 |

### 6.3 시딩 필요 테이블

| 테이블명 | 현재 상태 | 영향 기능 |
|---------|----------|----------|
| `staff` | 0 rows | 직원 관리, 인력 시뮬레이션 |
| `transactions` | 0 rows | AI 예측, 인사이트 분석 |

---

## 7. 최종 실행 SQL

```sql
-- ============================================
-- 최종 테이블 정리 SQL
-- 실행 전 반드시 백업 확인
-- ============================================

-- Phase 2: 즉시 삭제 가능 (코드 마이그레이션 완료)
DROP TABLE IF EXISTS zone_performance CASCADE;
DROP TABLE IF EXISTS visits CASCADE;

-- 결과 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;
```

---

## 8. 최종 테이블 구조 (정리 후 예상)

| 카테고리 | 정리 전 | 정리 후 | 절약 |
|---------|--------|---------|------|
| 백업 테이블 | 7개 | 0개 | ~15MB |
| 중복/레거시 테이블 | 2개 | 0개 | ~3.8MB |
| **총 테이블** | **121개** | **112개** | **~19MB** |
