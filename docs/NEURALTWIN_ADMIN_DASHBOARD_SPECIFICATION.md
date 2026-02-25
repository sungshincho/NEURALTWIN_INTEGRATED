# NEURALTWIN 관리자 대시보드 기능 정의

## 개요

NEURALTWIN 관리자 대시보드는 **NEURALTWIN_MASTER** 권한을 가진 시스템 관리자 전용 대시보드입니다. 모든 고객 조직, 구독, 사용자 활동을 통합 관리하고 모니터링하는 중앙 관리 시스템입니다.

---

## 핵심 기능

### 1. 조직 관리 (Organization Management)

**권한**: NEURALTWIN_MASTER

**기능 설명**:
- 모든 고객 조직 조회 및 상세 정보 확인
- 조직별 멤버 관리 (ORG_HQ, ORG_STORE, ORG_VIEWER)
- 조직별 구독 현황 및 라이선스 할당 현황
- 조직 생성/수정/삭제 (필요시)
- 조직별 매출 및 사용 통계

**구현 상태**: ✅ 구현 완료
- `/organizations` - 전체 조직 목록
- `/organizations/:id` - 조직 상세 페이지
- 조직별 멤버, 구독, 라이선스 현황 표시

**주요 데이터**:
- 조직명 (org_name)
- 생성일 (created_at)
- 멤버 수 (member_count)
- 구독 상태 (subscription status)
- 활성 라이선스 수 (HQ, Store, Viewer)

---

### 2. 구독 관리 (Subscription Management)

**권한**: NEURALTWIN_MASTER

**기능 설명**:
- 모든 고객 구독 조회 및 상태 관리
- 구독별 라이선스 현황 (HQ Seat, Store License)
- 구독 활성화/정지/취소 처리
- 월별 청구 금액 확인 및 관리
- 구독 만료 임박 알림 및 갱신 관리
- 라이선스 추가/제거 권한

**구현 상태**: ✅ 구현 완료
- `/subscriptions` - 전체 구독 목록
- `/subscriptions/:id` - 구독 상세 페이지
- 구독 상태 필터링 (active, suspended, cancelled)
- 라이선스 카운트 및 월 비용 자동 계산

**주요 데이터**:
- 구독 플랜 (plan_type: HQ_SEAT, STORE)
- 라이선스 수 (hq_license_count, store_license_count, viewer_count)
- 월 비용 (monthly_cost = HQ × $500 + Store × $250)
- 구독 상태 (status: active, suspended, cancelled)
- 시작일/종료일 (start_date, end_date)
- 다음 청구일 (next_billing_date)

**권한 작업**:
```sql
-- NEURALTWIN_MASTER는 모든 구독 조회/수정 가능
is_neuraltwin_admin(auth.uid())
```

---

### 3. 사용자 활동 분석 (User Analytics)

**권한**: NEURALTWIN_MASTER

**기능 설명**:
- 모든 유저 계정의 웹사이트 및 고객 대시보드 사용 패턴 분석
- 조직별/유저별 트래픽 및 활동 로그
- 페이지 뷰, 세션 시간, 기능 사용 빈도 추적
- 웹 및 앱 내 사용자 행동 분석 (UX 개선 데이터)
- 이상 활동 탐지 및 보안 모니터링
- 기능별 사용률 통계 (ETL, Simulation, Ontology 등)

**구현 상태**: 🚧 부분 구현
- `/analytics` - 기본 분석 페이지 구조 존재
- ⚠️ 실제 트래킹 및 로그 수집 시스템 미구현

**구현 필요 사항**:

#### 3.1 프론트엔드 트래킹
```typescript
// 사용자 활동 이벤트 추적
- 페이지 뷰 로깅
- 클릭 이벤트 추적
- 기능 사용 로깅 (ETL 실행, 시뮬레이션 생성 등)
- 세션 타임아웃 추적
```

#### 3.2 백엔드 로깅 테이블
```sql
-- user_activity_logs 테이블 생성 필요
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  event_type TEXT NOT NULL, -- 'page_view', 'feature_use', 'click', 'session'
  event_name TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_activity_user ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_org ON user_activity_logs(org_id, created_at DESC);
CREATE INDEX idx_activity_event ON user_activity_logs(event_type, created_at DESC);
```

#### 3.3 분석 대시보드 UI
- 일별/주별/월별 활동 차트
- 조직별 사용 현황 비교
- 인기 기능 랭킹
- 사용자 세그먼트 분석
- 리텐션 분석 (재방문율)

**데이터 수집 예시**:
```typescript
// 페이지 뷰 로깅
await supabase.from('user_activity_logs').insert({
  user_id: user.id,
  org_id: userOrgId,
  event_type: 'page_view',
  event_name: 'dashboard_view',
  page_url: window.location.pathname,
  metadata: { referrer: document.referrer }
});

// 기능 사용 로깅
await supabase.from('user_activity_logs').insert({
  user_id: user.id,
  org_id: userOrgId,
  event_type: 'feature_use',
  event_name: 'etl_pipeline_run',
  metadata: { pipeline_id: pipelineId, status: 'success' }
});
```

---

## 접근 권한 요약

| 기능 | 필요 권한 | RLS 정책 |
|------|----------|----------|
| 조직 관리 | NEURALTWIN_MASTER | `is_neuraltwin_admin(auth.uid())` |
| 구독 관리 | NEURALTWIN_MASTER | `is_neuraltwin_admin(auth.uid())` |
| 사용자 활동 분석 | NEURALTWIN_MASTER | `is_neuraltwin_admin(auth.uid())` |

---

## 보안 고려사항

1. **역할 검증**:
   - 모든 관리자 기능은 서버 사이드에서 `is_neuraltwin_admin()` 함수로 검증
   - 클라이언트 사이드 검증은 UX 개선용으로만 사용

2. **감사 로그**:
   - 관리자의 모든 조직/구독 수정 작업 로깅
   - 민감한 데이터 접근 이력 추적

3. **데이터 격리**:
   - 각 조직의 데이터는 RLS로 격리
   - NEURALTWIN_MASTER만 전체 데이터 접근 가능

---

## 향후 개발 계획

### 우선순위 1 (필수)
- [x] 조직 관리 기능
- [x] 구독 관리 기능
- [ ] 사용자 활동 로깅 시스템 구축
- [ ] 활동 분석 대시보드 UI 개발

### 우선순위 2 (중요)
- [ ] 자동 알림 시스템 (구독 만료 임박, 이상 활동 등)
- [ ] 청구 관리 및 결제 내역 조회
- [ ] 조직별 커스텀 설정 관리

### 우선순위 3 (선택)
- [ ] 고급 분석 (머신러닝 기반 사용 패턴 예측)
- [ ] 실시간 모니터링 대시보드
- [ ] CSV/Excel 내보내기 기능

---

## 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, RLS)
- **Authentication**: Supabase Auth
- **Analytics**: 구현 예정 (Supabase Functions + Custom Logging)

---

## 참고 문서

- [전체 아키텍처](./architecture-overview.md)
- [고객 대시보드 로드맵](./customer-dashboard-roadmap.md)
- [통합 개발 계획](./integrated-development-plan.md)
