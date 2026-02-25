# NEURALTWIN 웹사이트 기능 정의서

## 1. 프로젝트 개요

### 1.1 프로젝트 명
NEURALTWIN - 리테일 디지털 트윈 플랫폼 웹사이트

### 1.2 목적
B2B SaaS 리테일 분석 플랫폼의 마케팅 웹사이트로, 제품 소개, 회원가입, 구독 관리 기능 제공

### 1.3 주요 목표
- 제품 기능 및 가치 제안 전달
- 잠재 고객 리드 확보 (Contact Form)
- 사용자 회원가입 및 온보딩
- 구독 플랜 판매 (Stripe 결제)
- 다국어 지원 (한국어/영어)

---

## 2. 페이지 구조

### 2.1 공개 페이지

#### 2.1.1 메인 페이지 (/)
**경로**: `/`  
**접근**: 비로그인 사용자

**주요 섹션**:
- Hero 섹션: 주요 가치 제안 (매출 성장 +15%, 실시간 분석, 가시성 강화)
- Features 섹션: 핵심 기능 소개
- Use Cases 섹션: 활용 사례
- CTA 섹션: 행동 유도 버튼

**Analytics 추적**:
- 페이지 조회
- Funnel Step 1: Hero 랜딩
- CTA 클릭 추적

#### 2.1.2 제품 페이지 (/product)
**경로**: `/product`  
**접근**: 비로그인 사용자

**주요 섹션**:
1. **Hero 섹션**: 제품 핵심 가치
2. **5 Pillars 섹션**: 
   - Analyze (분석)
   - Predict (예측)
   - Forecast (수요 예측)
   - Simulate (시뮬레이션)
   - Optimize (최적화)

3. **License-based Dashboard 기능**:
   - Store License 대시보드 (4단계 워크플로우)
   - HQ/Enterprise License 대시보드 (4단계 워크플로우)

4. **3D Interactive Mini-features**:
   - 3D 공간 분석 탭:
     - Footfall Visualizer 3D
     - Layout Simulator 3D
     - Traffic Heatmap 3D
   - 2D 데이터 분석 탭:
     - Demand Forecast
     - Conversion Funnel
     - Product Performance
     - Inventory Optimizer
     - Staff Efficiency
     - HQ-Store Sync

5. **Technology Pipeline**:
   - NEURALSENSE: IoT 데이터 수집
   - NEURALMIND: AI 분석 엔진
   - NEURALTWIN: 3D 디지털 트윈

**Analytics 추적**:
- 페이지 조회
- Funnel Step 2: 제품 탐색
- Mini-feature 인터랙션 추적
- Dashboard 탭 전환 추적

#### 2.1.3 가격 페이지 (/pricing)
**경로**: `/pricing`  
**접근**: 비로그인 사용자

**구독 플랜**:
1. **HQ License**: $500/월
   - 무제한 기능 접근
   - 조직 관리 권한
   - 멤버/라이선스 관리
   - 고급 분석 도구

2. **Store License**: $250/월
   - 매장 수준 관리
   - 중급 분석 기능
   - 1개 매장 할당

3. **Viewer**: 무료
   - 초대 전용
   - 읽기 전용 액세스

**기능**:
- 플랜별 기능 비교표
- FAQ 섹션
- CTA 버튼 (회원가입/구독)

#### 2.1.4 문의 페이지 (/contact)
**경로**: `/contact`  
**접근**: 비로그인 사용자

**Contact Form 필드**:
- 이름 (필수)
- 이메일 (필수)
- 회사명 (필수)
- 전화번호 (선택)
- 매장 수 (선택)
- 관심 기능 (다중 선택)
- 도입 시기 (선택)
- 메시지 (필수)

**처리 프로세스**:
1. 클라이언트 측 유효성 검사 (Zod)
2. Edge Function 호출: `submit-contact`
3. Supabase `contact_submissions` 테이블에 저장
4. 관리자 이메일 알림 (선택)

**Analytics 추적**:
- Funnel Step 3: Contact 제출
- 제출 성공/실패 추적

#### 2.1.5 이용약관 (/terms)
**경로**: `/terms`  
**접근**: 모든 사용자

**내용**:
- 서비스 이용 약관
- 책임 및 면책 조항
- 지적 재산권

#### 2.1.6 개인정보처리방침 (/privacy)
**경로**: `/privacy`  
**접근**: 모든 사용자

**내용**:
- 개인정보 수집 항목
- 이용 목적
- 보관 기간
- 제3자 제공
- GDPR 준수

---

### 2.2 인증 페이지

#### 2.2.1 인증 페이지 (/auth)
**경로**: `/auth`  
**접근**: 비로그인 사용자

**로그인 탭**:
- 이메일 로그인
- 비밀번호
- Google OAuth 로그인

**회원가입 탭**:
- 이메일 (ID)
- 비밀번호 (최소 6자)
- 비밀번호 확인
- 이름
- 회사명 (조직명)
- 전화번호
- **역할 선택**: HQ / Store (라디오 버튼)
- Google OAuth 회원가입

**회원가입 로직**:
1. 입력 유효성 검사
2. Supabase Auth 회원가입
3. 조직 확인:
   - 입력한 회사명이 DB에 존재하는지 확인
   - **존재하는 경우**: 해당 조직에 사용자 추가
   - **존재하지 않는 경우**: 신규 조직 생성
4. `organization_members` 테이블에 추가:
   - 선택한 역할에 따라 `ORG_HQ` 또는 `ORG_STORE` 설정
5. 자동 로그인 후 홈 화면(/) 이동

**에러 처리**:
- 이미 가입된 이메일: "이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요."
- 비밀번호 불일치
- 입력 필드 누락

**Analytics 추적**:
- Funnel Step 2: Auth 페이지 방문
- 회원가입 완료 추적

---

### 2.3 보호된 페이지 (인증 필요)

#### 2.3.1 구독 페이지 (/subscribe)
**경로**: `/subscribe`  
**접근**: 로그인 사용자 (구독 없음)

**기능**:
- 라이선스 선택 (HQ/Store)
- 수량 선택
- Stripe Checkout 연동
- 결제 처리

**프로세스**:
1. 라이선스 타입 및 수량 선택
2. Stripe Checkout Session 생성
3. Stripe 결제 페이지로 리디렉션
4. 결제 성공 시:
   - Webhook으로 라이선스 생성
   - 구독 활성화
   - Dashboard로 이동

#### 2.3.2 대시보드 (/dashboard)
**경로**: `/dashboard`  
**접근**: 로그인 + 활성 구독

**기능**:
- 조직 정보 표시
- 라이선스 현황
- 주요 KPI 요약
- 매장 목록
- 빠른 작업 링크

**역할별 접근**:
- `ORG_HQ`: 전체 조직 데이터
- `ORG_STORE`: 할당된 매장 데이터
- `ORG_VIEWER`: 읽기 전용

#### 2.3.3 프로필 페이지 (/profile)
**경로**: `/profile`  
**접근**: 로그인 사용자

**기능**:
- 사용자 정보 조회/수정
- 프로필 사진 변경
- 비밀번호 변경
- 알림 설정

#### 2.3.4 설정 페이지 (/settings)
**경로**: `/settings`  
**접근**: 로그인 사용자

**기능**:
- 계정 설정
- 조직 설정 (HQ만)
- 라이선스 관리 (HQ만)
- 멤버 초대 (HQ/Store)
- 결제 정보 (HQ만)

#### 2.3.5 404 페이지 (*)
**경로**: 기타 모든 경로  
**접근**: 모든 사용자

**기능**:
- 404 에러 메시지
- 홈으로 돌아가기 버튼

---

## 3. 인증 및 사용자 관리

### 3.1 인증 시스템 (Supabase Auth)

#### 3.1.1 인증 방법
- **이메일/비밀번호**: 기본 인증
- **Google OAuth**: 소셜 로그인

#### 3.1.2 세션 관리
- localStorage에 세션 저장
- 자동 세션 갱신 (Auto Refresh Token)
- `useAuth` Hook으로 중앙 관리

#### 3.1.3 비밀번호 정책
- 최소 6자 이상
- Supabase 기본 정책 적용

### 3.2 사용자 프로필 (profiles 테이블)

**구조**:
```typescript
interface Profile {
  id: uuid;              // auth.users.id 참조
  display_name: string;  // 표시 이름
  avatar_url: string;    // 프로필 사진 URL
  created_at: timestamp;
  updated_at: timestamp;
}
```

**관리**:
- 회원가입 시 자동 생성 (Trigger)
- 사용자가 직접 수정 가능

### 3.3 useAuth Hook

**위치**: `src/hooks/useAuth.ts`

**제공 데이터**:
```typescript
{
  user: User | null;
  authContext: UserAuthContext | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}
```

**UserAuthContext**:
```typescript
interface UserAuthContext {
  userId: string;
  email: string;
  role: AppRole;
  orgId: string;
  orgName: string;
  license?: License;
  permissions: {
    storeIds?: string[];
    features?: string[];
    canInvite?: boolean;
    canExport?: boolean;
  };
}
```

**기능**:
1. 세션 초기화
2. 인증 상태 변경 감지
3. 조직/라이선스 정보 로드
4. 역할 기반 권한 체크

---

## 4. 조직 및 역할 관리

### 4.1 4단계 역할 계층

#### 4.1.1 NEURALTWIN_MASTER
- **권한**: 시스템 전체 관리자
- **접근**: 모든 조직 데이터
- **기능**: 
  - 수동 라이선스 발급
  - 조직 관리
  - 시스템 설정

#### 4.1.2 ORG_HQ
- **권한**: 조직 본사 관리자
- **라이선스**: HQ_SEAT 필수 ($500/월)
- **접근**: 조직 전체 데이터
- **기능**:
  - 무제한 매장 관리
  - 고급 분석 도구
  - ETL 파이프라인
  - 멤버/라이선스 관리
  - 구독 관리

#### 4.1.3 ORG_STORE
- **권한**: 매장 관리자
- **라이선스**: STORE 필수 ($250/월)
- **접근**: 할당된 매장만
- **기능**:
  - 1개 매장 관리
  - 중급 분석 도구
  - Viewer 초대 가능

#### 4.1.4 ORG_VIEWER
- **권한**: 읽기 전용
- **라이선스**: 무료 (초대 전용)
- **접근**: 읽기 전용
- **기능**:
  - 데이터 조회만
  - 리포트 열람

### 4.2 조직 구조 (organizations 테이블)

**구조**:
```typescript
interface Organization {
  id: uuid;
  org_name: string;
  created_by: uuid;
  member_count: number;
  metadata: {
    country?: string;
    industry?: string;
    company_size?: string;
    phone?: string;
    address?: string;
    website?: string;
    billing_email?: string;
  };
  created_at: timestamp;
  updated_at: timestamp;
}
```

### 4.3 조직 멤버십 (organization_members 테이블)

**구조**:
```typescript
interface OrganizationMember {
  id: uuid;
  org_id: uuid;
  user_id: uuid;
  role: AppRole;  // NEURALTWIN_MASTER | ORG_HQ | ORG_STORE | ORG_VIEWER
  license_id?: uuid;  // HQ/Store의 경우 필수
  invited_by?: uuid;
  invitation_accepted_at?: timestamp;
  permissions: {
    storeIds?: string[];
    features?: string[];
    canInvite?: boolean;
    canExport?: boolean;
  };
  joined_at: timestamp;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**제약 조건**:
- `ORG_HQ`, `ORG_STORE`: `license_id` NOT NULL
- `ORG_VIEWER`: `license_id` NULL, `invitation_accepted_at` NOT NULL

### 4.4 회원가입 시 조직 연결 로직

```
1. 사용자가 회사명 입력
2. organizations 테이블에서 org_name 검색
3. IF 존재:
   - 해당 조직에 사용자 추가
   - 선택한 역할(HQ/Store)에 따라 role 설정
4. ELSE:
   - 신규 조직 생성 (org_name = 입력한 회사명)
   - 조직에 사용자 추가
   - 선택한 역할(HQ/Store)에 따라 role 설정
5. 자동 로그인 후 홈(/) 이동
```

---

## 5. 구독 및 라이선스 시스템

### 5.1 라이선스 기반 가격 모델

#### 5.1.1 라이선스 타입

**HQ License (HQ_SEAT)**:
- 가격: $500/월
- 대상: 본사 관리자
- 기능: 무제한 접근 + 조직 관리

**Store License (STORE)**:
- 가격: $250/월
- 대상: 매장 관리자
- 기능: 매장별 관리 + 중급 기능

**Viewer**:
- 가격: 무료
- 대상: 읽기 전용 사용자
- 기능: 데이터 조회만

#### 5.1.2 월 비용 계산
```
Monthly Cost = (HQ License Count × $500) + (Store License Count × $250)
```

### 5.2 구독 (subscriptions 테이블)

**구조**:
```typescript
interface Subscription {
  id: uuid;
  org_id: uuid;
  subscription_type: 'LICENSE_BASED' | 'ENTERPRISE_CONTRACT';
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  hq_license_count: number;      // COUNT(licenses WHERE type=HQ_SEAT)
  store_license_count: number;   // COUNT(licenses WHERE type=STORE)
  viewer_count: number;           // COUNT(members WHERE role=ORG_VIEWER)
  monthly_cost: number;           // Auto-calculated
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: date;
  current_period_end: date;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**자동 업데이트 (Trigger)**:
- 라이선스 생성/취소 시 `hq_license_count`, `store_license_count` 자동 갱신
- Viewer 멤버 추가/제거 시 `viewer_count` 자동 갱신
- `monthly_cost` 자동 재계산

### 5.3 라이선스 (licenses 테이블)

**구조**:
```typescript
interface License {
  id: uuid;
  org_id: uuid;
  subscription_id?: uuid;
  license_type: 'HQ_SEAT' | 'STORE';
  license_key: string;  // NT-HQ-xxx or NT-ST-xxx
  status: 'active' | 'assigned' | 'suspended' | 'expired' | 'revoked';
  monthly_price: number;  // 500 or 250
  effective_date: date;
  expiry_date?: date;
  next_billing_date: date;
  assigned_to?: uuid;         // HQ 라이선스: user_id
  assigned_store_id?: uuid;   // Store 라이선스: store_id
  activated_at?: timestamp;
  last_used_at?: timestamp;
  billing_history: jsonb[];
  metadata: {
    issued_by?: uuid;
    assignment_history?: Array<{
      user_id?: uuid;
      store_id?: uuid;
      assigned_at: timestamp;
      revoked_at?: timestamp;
    }>;
    auto_renew: boolean;
  };
  created_at: timestamp;
  updated_at: timestamp;
}
```

**라이선스 할당**:
- **HQ 라이선스**: `assigned_to` (user_id) 설정
- **Store 라이선스**: `assigned_store_id` (store_id) 설정

**상태 흐름**:
```
active (구매) → assigned (할당) → {suspended | expired | revoked}
```

### 5.4 Stripe 결제 연동

#### 5.4.1 결제 프로세스
1. 사용자가 `/subscribe`에서 라이선스 선택
2. Stripe Checkout Session 생성
3. Stripe 결제 페이지 리디렉션
4. 결제 완료
5. **Stripe Webhook** 수신
6. 라이선스 자동 생성 및 활성화
7. 구독 업데이트
8. Dashboard로 이동

#### 5.4.2 Webhook 이벤트
- `checkout.session.completed`: 결제 완료
- `invoice.paid`: 결제 성공
- `invoice.payment_failed`: 결제 실패
- `customer.subscription.updated`: 구독 변경
- `customer.subscription.deleted`: 구독 취소

#### 5.4.3 추가 라이선스 구매
- 기존 구독에 즉시 추가 가능
- Proration 자동 처리
- `monthly_cost` 자동 재계산
- 새 라이선스는 즉시 활성화

### 5.5 라이선스 검증 (RLS)

**함수**: `has_valid_license(user_id, license_type)`

```sql
SELECT EXISTS (
  SELECT 1
  FROM organization_members om
  JOIN licenses l ON l.id = om.license_id
  WHERE om.user_id = $user_id
    AND l.license_type = $license_type
    AND l.status IN ('active', 'assigned')
    AND (l.expiry_date IS NULL OR l.expiry_date > CURRENT_DATE)
);
```

**RLS 정책**:
- `ORG_HQ` 역할: `has_valid_license(user_id, 'HQ_SEAT')` 필수
- `ORG_STORE` 역할: `has_valid_license(user_id, 'STORE')` 필수
- `ORG_VIEWER`: 라이선스 불필요, `invitation_accepted_at` 필수

---

## 6. 초대 시스템

### 6.1 Viewer 초대 (invitations 테이블)

**구조**:
```typescript
interface Invitation {
  id: uuid;
  org_id: uuid;
  email: string;
  role: AppRole;  // 항상 'ORG_VIEWER'
  invited_by: uuid;
  token: string;  // 고유 토큰
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: timestamp;  // 7일 TTL
  accepted_at?: timestamp;
  license_id?: uuid;  // Store 라이선스 할당 (선택)
  metadata: jsonb;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### 6.2 초대 프로세스

**HQ/Store 사용자가 Viewer 초대**:
1. `/settings`에서 이메일 입력
2. `invitations` 테이블에 레코드 생성
3. 이메일로 초대 링크 발송
4. 초대 링크 클릭 시 회원가입 페이지 이동
5. 회원가입 완료 시:
   - `organization_members`에 추가 (role=ORG_VIEWER)
   - `invitation.status = 'accepted'`
   - `organization_members.invitation_accepted_at` 설정
6. Dashboard 접근

### 6.3 초대 권한

- **ORG_HQ**: Viewer 초대 가능
- **ORG_STORE**: Viewer 초대 가능
- **ORG_VIEWER**: 초대 불가능

---

## 7. 주요 기능 컴포넌트

### 7.1 Feature Components (14개)

#### 7.1.1 3D 공간 분석 컴포넌트

**FootfallVisualizer3D**:
- 고객 동선 3D 시각화
- 시간대별 필터링
- 신규/재방문 구분
- Heatmap 오버레이

**Store3DViewer**:
- 3D 매장 레이아웃
- 인터랙티브 카메라
- 객체 선택/정보 표시

**LayoutSimulator3D**:
- 레이아웃 시뮬레이션
- 배치 변경 테스트
- 효과 예측

**TrafficHeatmap3D**:
- 3D 히트맵 시각화
- 혼잡도 분석
- 시간대별 변화

#### 7.1.2 2D 데이터 분석 컴포넌트

**ConversionFunnel**:
- 판매 퍼널 시각화
- 단계별 전환율
- 최적화 추천

**CustomerJourney**:
- 고객 여정 추적
- 동선 재생
- 구매 패턴 분석

**DemandForecast**:
- 수요 예측
- 외부 변수 고려 (날씨, 이벤트)
- 시나리오 테스트

**InventoryOptimizer**:
- 재고 최적화
- 자동 발주 제안
- 비용 절감 추정

**StaffEfficiency**:
- 인력 효율성 분석
- 시간대별 배치 최적화

**ProductPerformance**:
- 제품별 성과 분석
- 카테고리별 비교

**HQStoreSync**:
- 본사-매장 실시간 동기화
- 승인 요청/처리
- AI 자동 승인

### 7.2 Layout Components

**Header**:
- 로고
- 네비게이션 메뉴
- 언어 토글 (한국어/영어)
- 로그인/회원가입 버튼
- 사용자 메뉴 (로그인 후)

**Footer**:
- 회사 정보
- 소셜 미디어 링크
- 법적 문서 링크

**LanguageToggle**:
- i18n 언어 전환
- 한국어/English

---

## 8. 다국어 지원 (i18n)

### 8.1 설정

**라이브러리**: i18next, react-i18next

**지원 언어**:
- 한국어 (ko) - 기본
- 영어 (en)

**번역 파일**:
- `src/i18n/locales/ko.ts`
- `src/i18n/locales/en.ts`

### 8.2 번역 키 구조

```typescript
{
  nav: { home, product, pricing, contact, ... },
  hero: { title, subtitle, cta, ... },
  features: { ... },
  pricing: { ... },
  contact: { ... },
  auth: { ... },
  dashboard: { ... },
  ...
}
```

### 8.3 사용법

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('hero.title')}</h1>
```

---

## 9. Analytics 추적

### 9.1 통합 도구

- **Google Analytics 4 (GA4)**
- **Meta Pixel**

### 9.2 Funnel Tracking (4단계)

**Step 1: Hero/Landing**
- 이벤트: `page_view`, `funnel_progress`
- 페이지: `/`

**Step 2: Product/Features**
- 이벤트: `view_product`, `funnel_progress`
- 페이지: `/product`, `/auth`

**Step 3: Contact/Inquiry**
- 이벤트: `submit_contact`, `funnel_progress`
- 페이지: `/contact`

**Step 4: Meeting/Booking**
- 이벤트: `meeting_booked`, `funnel_progress`
- 페이지: (외부 스케줄링 도구)

### 9.3 추적 이벤트

**페이지 이동**:
```typescript
trackPageView(pageName: string)
```

**Funnel 진행**:
```typescript
trackFunnelStep(step: number, stepName: string)
```

**CTA 클릭**:
```typescript
trackCTAClick(ctaName: string, location: string)
```

**Mini-feature 인터랙션**:
```typescript
trackMiniFeature(featureName: string, action: string)
```

**Contact Form 제출**:
```typescript
trackContactForm(success: boolean, error?: string)
```

---

## 10. 데이터베이스 구조

### 10.1 핵심 테이블

#### 인증 및 사용자
- `auth.users` (Supabase 관리)
- `profiles`

#### 조직 및 멤버십
- `organizations`
- `organization_members`
- `organization_settings`

#### 구독 및 라이선스
- `subscriptions`
- `licenses`
- `invitations`

#### 비즈니스 데이터
- `stores` (매장)
- `products` (제품)
- `customers` (고객)
- `purchases` (구매)
- `dashboard_kpis` (KPI)
- `inventory_levels` (재고)

#### 분석 및 추천
- `ai_recommendations`
- `analysis_history`
- `scenarios` (시뮬레이션)

#### 데이터 통합
- `etl_pipelines`
- `external_data_sources`
- `data_sync_schedules`
- `data_sync_logs`

#### 그래프 데이터 (Knowledge Graph)
- `graph_entities`
- `graph_relations`
- `ontology_entity_types`
- `ontology_relation_types`

#### 기타
- `contact_submissions`
- `holidays_events`
- `economic_indicators`
- `neuralsense_devices`

### 10.2 RLS 정책

**Multi-tenant 격리**:
- 모든 테이블에 `org_id` 컬럼
- RLS 정책으로 조직별 데이터 격리

**역할 기반 접근**:
- `is_org_member(user_id, org_id)`: 조직 멤버 확인
- `is_org_admin(user_id, org_id)`: 조직 관리자 확인
- `has_valid_license(user_id, license_type)`: 라이선스 검증

**예시 정책**:
```sql
-- Org 멤버는 조직 데이터 조회 가능
CREATE POLICY "Org members can view org data"
ON stores FOR SELECT
USING (is_org_member(auth.uid(), org_id));

-- Org 관리자만 삭제 가능
CREATE POLICY "Org admins can delete org data"
ON stores FOR DELETE
USING (is_org_admin(auth.uid(), org_id));
```

### 10.3 Database Functions

**트리거 함수**:
- `update_updated_at_column()`: updated_at 자동 갱신
- `handle_new_user()`: 신규 사용자 프로필 생성
- `update_license_counts()`: 라이선스 카운트 자동 갱신
- `update_viewer_count()`: Viewer 카운트 자동 갱신
- `update_org_member_count()`: 조직 멤버 수 자동 갱신

**권한 체크 함수**:
- `has_valid_license(user_id, license_type)`
- `is_org_member(user_id, org_id)`
- `is_org_admin(user_id, org_id)`
- `is_neuraltwin_admin(user_id)`
- `get_user_org_id(user_id)`

**그래프 쿼리 함수**:
- `graph_n_hop_query(user_id, start_id, max_hops)`: N-hop 그래프 탐색
- `graph_shortest_path(user_id, start_id, end_id)`: 최단 경로

---

## 11. Edge Functions (Serverless)

### 11.1 submit-contact

**경로**: `supabase/functions/submit-contact/index.ts`

**기능**: Contact Form 제출 처리

**프로세스**:
1. POST 요청 수신
2. 입력 유효성 검사
3. `contact_submissions` 테이블에 저장
4. (선택) 관리자 이메일 발송
5. 성공/실패 응답

**요청 본문**:
```typescript
{
  name: string;
  email: string;
  company: string;
  phone?: string;
  stores?: number;
  features?: string[];
  timeline?: string;
  message: string;
}
```

### 11.2 upscale-image (예시)

**경로**: `supabase/functions/upscale-image/index.ts`

**기능**: 이미지 업스케일링 (AI 서비스 연동 예시)

---

## 12. 파일 저장소 (Storage)

### 12.1 Buckets

**store-data** (Private):
- 매장 데이터 파일
- CSV, Excel 업로드
- RLS로 조직별 접근 제어

**3d-models** (Public):
- 3D 모델 파일
- GLB, GLTF 형식
- 공개 접근 가능

### 12.2 Storage RLS

**store-data 정책**:
```sql
-- 조직 멤버만 조직 폴더 접근
CREATE POLICY "Org members can access org folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'store-data' AND
  is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);
```

---

## 13. 디자인 시스템

### 13.1 테마

**Studio Chrome & Glass Aesthetic**:
- 모노크로매틱 중립 팔레트 (다크 네이비 + 그레이)
- 블루/시안 색상 없음 - 순수 중립 컬러
- Glassmorphism 효과 (backdrop blur)
- 샤프한 메탈릭 텍스트
- 크롬 효과
- 미니멀리즘, 하이테크 스튜디오 감성

### 13.2 컬러 시스템 (HSL)

**index.css에 정의된 CSS 변수**:
```css
:root {
  --primary: [hsl];
  --primary-glow: [hsl];
  --background: [hsl];
  --foreground: [hsl];
  --muted: [hsl];
  --accent: [hsl];
  ...
}
```

**Semantic Tokens 사용**:
- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- 직접 색상 클래스 사용 금지 (`text-white`, `bg-black` 등)

### 13.3 타이포그래피

**폰트**:
- 본문: Inter
- 헤드라인: Pretendard (한국어 최적화)

**클래스**:
- `gradient-text`: 그라디언트 텍스트 효과
- `metallic-text`: 메탈릭 텍스트
- `glass`: Glassmorphism 카드
- `glow`: 발광 효과

### 13.4 UI 컴포넌트 (shadcn/ui)

**설치된 컴포넌트**:
- Button, Card, Input, Label
- Tabs, Dialog, Sheet
- Select, Checkbox, Radio
- Toast, Alert, Badge
- Table, Accordion, Carousel
- Chart (Recharts 통합)
- 기타 30+ 컴포넌트

**커스터마이징**:
- `src/components/ui/` 폴더에 위치
- Tailwind + CVA로 Variant 관리
- 디자인 시스템 토큰 사용

---

## 14. 기술 스택

### 14.1 Frontend

**프레임워크**:
- React 18.3
- TypeScript
- Vite (번들러)

**라우팅**:
- React Router DOM 6.30

**스타일링**:
- Tailwind CSS 3.x
- CSS Variables (디자인 토큰)
- shadcn/ui 컴포넌트

**3D 렌더링**:
- Three.js
- @react-three/fiber
- @react-three/drei

**상태 관리**:
- React Query (@tanstack/react-query)
- useState, useContext (로컬 상태)

**폼 관리**:
- React Hook Form
- Zod (유효성 검사)

**다국어**:
- i18next
- react-i18next

**차트**:
- Recharts

### 14.2 Backend

**인증**:
- Supabase Auth
- Google OAuth

**데이터베이스**:
- PostgreSQL (Supabase)
- Row-Level Security (RLS)

**API**:
- Supabase Client SDK
- RESTful API (자동 생성)

**Serverless Functions**:
- Supabase Edge Functions (Deno)

**파일 저장소**:
- Supabase Storage

### 14.3 결제

- Stripe Checkout
- Stripe Webhooks

### 14.4 Analytics

- Google Analytics 4
- Meta Pixel

### 14.5 배포

**호스팅**: Lovable (Vite 기반)
**CI/CD**: Lovable 자동 배포
**도메인**: 커스텀 도메인 연결 가능

---

## 15. 보안 및 규정 준수

### 15.1 인증 보안

- Supabase Auth 기본 보안
- JWT 토큰 기반 인증
- HTTPS 필수
- CORS 설정

### 15.2 데이터 보안

- RLS 정책으로 Multi-tenant 격리
- 라이선스 검증 (Database Level)
- 민감 정보 암호화 (Supabase)

### 15.3 결제 보안

- PCI DSS 준수 (Stripe)
- 카드 정보 직접 저장 안 함
- Webhook Signature 검증

### 15.4 규정 준수

- GDPR 준수 (EU 사용자)
- 개인정보처리방침 제공
- 이용약관 동의 필수

---

## 16. 성능 최적화

### 16.1 Frontend

- Vite 기반 빠른 빌드
- Code Splitting (React.lazy)
- 이미지 최적화
- 3D 모델 레이지 로딩

### 16.2 Database

- 인덱스 최적화
- RLS 정책 최적화
- Connection Pooling (Supabase)

### 16.3 API

- React Query 캐싱
- Stale-While-Revalidate
- Prefetching

---

## 17. 향후 개선 사항

### 17.1 단기 (1-3개월)

- [ ] Stripe 결제 완전 연동
- [ ] 추가 라이선스 구매 UI
- [ ] 멤버 초대 기능 (/settings)
- [ ] 프로필 페이지 구현
- [ ] 설정 페이지 구현

### 17.2 중기 (3-6개월)

- [ ] Dashboard 페이지 개발
- [ ] 14개 Feature 컴포넌트 완성
- [ ] 실시간 데이터 스트리밍
- [ ] 알림 시스템
- [ ] 리포트 생성 기능

### 17.3 장기 (6-12개월)

- [ ] 모바일 앱 (React Native)
- [ ] AI 추천 엔진 고도화
- [ ] API 플랫폼 (3rd Party 연동)
- [ ] White-label 솔루션
- [ ] Enterprise SSO

---

## 18. 문의

**기술 문의**: dev@neuraltwin.io  
**영업 문의**: sales@neuraltwin.io  
**지원**: support@neuraltwin.io

**문서 버전**: 1.0  
**최종 수정일**: 2025-11-25
