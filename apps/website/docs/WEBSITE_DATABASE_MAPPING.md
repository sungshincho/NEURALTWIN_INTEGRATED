# NEURALTWIN 웹사이트 - 데이터베이스 연결 문서

## 문서 개요
본 문서는 NEURALTWIN 웹사이트 프로젝트의 모든 페이지와 기능이 Supabase 백엔드의 어떤 데이터 테이블/소스와 연결되어 있는지 상세하게 정리합니다.

**작성일**: 2025-01-26  
**프로젝트**: NEURALTWIN Website (Marketing & Signup)  
**백엔드**: Supabase (프로젝트 ID: bdrvowacecxnraaivlhr)

---

## 1. 페이지별 데이터베이스 연결 현황

### 1.1 Public Pages (인증 불필요)

#### 1.1.1 **Index (`/`)** - 랜딩 페이지
- **파일 경로**: `src/pages/Index.tsx`
- **데이터베이스 연결**: 없음 (정적 콘텐츠만)
- **데이터 소스**: 
  - 정적 이미지 파일 (`src/assets/hero-main-building.png`)
  - i18n 번역 파일 (`src/i18n/locales/`)
- **외부 연동**:
  - Google Analytics 4 (GA4)
  - Meta Pixel
  - 페이지뷰, 퍼널 스텝(1단계), CTA 클릭 추적

**데이터 흐름**:
```
사용자 방문 → GA4/Meta Pixel 이벤트 전송 → 정적 콘텐츠 표시
```

---

#### 1.1.2 **Product (`/product`)** - 제품 소개
- **파일 경로**: `src/pages/Product.tsx`
- **데이터베이스 연결**: 없음 (정적 콘텐츠만)
- **데이터 소스**:
  - 정적 이미지 파일 (다수의 dashboard/IoT 센서 이미지)
  - i18n 번역 파일
  - React 컴포넌트 (14개 feature components):
    - `DemandForecast`
    - `HQStoreSync`
    - `ConversionFunnel`
    - `ProductPerformance`
    - `InventoryOptimizer`
    - `StaffEfficiency`
    - `FootfallVisualizer3D` (등 3D 컴포넌트들)
- **외부 연동**:
  - GA4/Meta Pixel (페이지뷰, 퍼널 스텝 2, 미니 기능 인터랙션)

**데이터 흐름**:
```
사용자 방문 → 기능 인터랙션 → GA4 이벤트 전송 → 데모 데이터 표시
```

**참고**: 모든 feature components는 **하드코딩된 샘플 데이터**를 사용하며, 실제 데이터베이스 연결은 없음. 고객 대시보드 프로젝트에서는 실제 DB 연결됨.

---

#### 1.1.3 **Pricing (`/pricing`)** - 가격 정책
- **파일 경로**: `src/pages/Pricing.tsx`
- **데이터베이스 연결**: 없음 (정적 콘텐츠만)
- **데이터 소스**:
  - 하드코딩된 라이선스 가격 정보:
    - HQ License: $500/월
    - Store License: $250/월
    - Viewer: 무료 (초대 전용)
  - i18n 번역 파일
- **외부 연동**:
  - GA4/Meta Pixel (페이지뷰, 퍼널 스텝 1, CTA 클릭)

**데이터 흐름**:
```
사용자 방문 → 정적 가격 정보 표시 → CTA 클릭 → 라우팅 (/auth or /subscribe)
```

---

#### 1.1.4 **Contact (`/contact`)** - 문의
- **파일 경로**: `src/pages/Contact.tsx`
- **데이터베이스 연결**: 
  - ✅ **`contact_submissions`** 테이블 (Supabase Edge Function을 통해)
- **Edge Function**: `submit-contact`
- **데이터 소스**:
  - 사용자 입력 폼 데이터
  - i18n 번역 파일
- **외부 연동**:
  - GA4/Meta Pixel (페이지뷰, 퍼널 스텝 3, 폼 제출/에러 이벤트)
  - Supabase Edge Function (`supabase/functions/submit-contact/`)

**데이터 흐름**:
```
사용자 입력 → Form Submit → Edge Function 호출 → contact_submissions 테이블 INSERT
→ 성공 Toast → GA4 이벤트 전송
```

**저장되는 데이터 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | text | ✅ | 이름 |
| `company` | text | ✅ | 회사명 |
| `email` | text | ✅ | 이메일 |
| `phone` | text | ❌ | 전화번호 |
| `stores` | integer | ❌ | 매장 수 |
| `features` | text[] | ❌ | 관심 기능 |
| `timeline` | text | ❌ | 도입 시기 |
| `message` | text | ✅ | 문의 내용 |

---

#### 1.1.5 **Privacy (`/privacy`)** - 개인정보처리방침
- **파일 경로**: `src/pages/Privacy.tsx`
- **데이터베이스 연결**: 없음
- **데이터 소스**: 정적 법률 문서 콘텐츠

---

#### 1.1.6 **Terms (`/terms`)** - 이용약관
- **파일 경로**: `src/pages/Terms.tsx`
- **데이터베이스 연결**: 없음
- **데이터 소스**: 정적 법률 문서 콘텐츠

---

#### 1.1.7 **NotFound (`*`)** - 404 페이지
- **파일 경로**: `src/pages/NotFound.tsx`
- **데이터베이스 연결**: 없음
- **데이터 소스**: 정적 에러 메시지

---

### 1.2 Authentication Page

#### 1.2.1 **Auth (`/auth`)** - 로그인/회원가입
- **파일 경로**: `src/pages/Auth.tsx`
- **데이터베이스 연결**: 
  - ✅ **`auth.users`** (Supabase Auth 시스템)
  - ✅ **`organizations`** 테이블
  - ✅ **`organization_members`** 테이블
  - ✅ **`subscriptions`** 테이블 (구독 확인용)
- **인증 방식**:
  - Email/Password (Supabase Auth)
  - Google OAuth (Supabase Auth Provider)
- **외부 연동**:
  - Supabase Auth API
  - GA4/Meta Pixel (페이지뷰, 퍼널 스텝 2, 회원가입 완료)

**데이터 흐름 (회원가입)**:
```
1. 사용자 입력 (email, password, name, company, phone, roleType)
   ↓
2. supabase.auth.signUp() → auth.users 레코드 생성 (user_metadata 포함)
   ↓
3. organizations 테이블에서 company 이름 검색
   ├─ 존재 → 기존 org_id 사용
   └─ 미존재 → 새 organization 생성 (INSERT)
   ↓
4. organization_members 테이블 INSERT
   - user_id: 생성된 user ID
   - org_id: 조직 ID
   - role: roleType에 따라 'ORG_HQ' 또는 'ORG_STORE'
   ↓
5. subscriptions 테이블에서 active 구독 확인
   ├─ 구독 있음 → /dashboard 리다이렉트
   └─ 구독 없음 → /subscribe 리다이렉트
```

**데이터 흐름 (로그인)**:
```
1. 사용자 입력 (email, password)
   ↓
2. supabase.auth.signInWithPassword()
   ↓
3. organization_members에서 org_id 조회
   ↓
4. subscriptions에서 active 구독 확인
   ├─ 구독 있음 → /dashboard 리다이렉트
   └─ 구독 없음 → /subscribe 리다이렉트
```

**저장되는 데이터**:

**`auth.users.user_metadata`**:
```json
{
  "display_name": "홍길동",
  "name": "홍길동",
  "full_name": "홍길동",
  "company": "NEURALTWIN",
  "phone": "010-1234-5678",
  "roleType": "HQ"
}
```

**`organizations`**:
| 필드 | 값 |
|------|---|
| `org_name` | 사용자 입력 회사명 |
| `created_by` | 생성한 user_id |
| `metadata` | `{ "country": "KR" }` |

**`organization_members`**:
| 필드 | 값 |
|------|---|
| `user_id` | auth.users.id |
| `org_id` | organizations.id |
| `role` | `ORG_HQ` 또는 `ORG_STORE` |

---

### 1.3 Protected Pages (로그인 필요)

#### 1.3.1 **Subscribe (`/subscribe`)** - 구독 페이지
- **파일 경로**: `src/pages/Subscribe.tsx`
- **데이터베이스 연결**: 
  - ✅ **`organization_members`** (사용자 조직 확인)
  - 🚧 **`subscriptions`** (향후 Stripe 연동 시)
  - 🚧 **`licenses`** (향후 Stripe 연동 시)
- **인증 필요**: 예 (로그인 상태 확인)
- **외부 연동**:
  - 🚧 Stripe Checkout API (미구현)
  - GA4/Meta Pixel (페이지뷰, 퍼널 스텝 3)

**현재 상태**: 
- ✅ UI 완성 (라이선스 선택, 수량 입력, 주문 요약)
- 🚧 Stripe 결제 연동 미구현 (Edge Function `create-checkout` 필요)
- 임시로 "준비 중" 메시지 표시 후 Dashboard로 리다이렉트

**향후 데이터 흐름 (Stripe 연동 후)**:
```
1. 사용자가 라이선스 타입 선택 (HQ_SEAT or STORE)
   ↓
2. 수량 입력 (1~999개)
   ↓
3. "결제하기" 버튼 클릭 → Edge Function 'create-checkout' 호출
   ↓
4. Stripe Checkout Session 생성 → 결제 페이지로 리다이렉트
   ↓
5. 결제 완료 → Stripe Webhook 수신 → subscriptions/licenses 테이블 업데이트
   ↓
6. /dashboard로 리다이렉트
```

**예정된 데이터 저장 구조**:

**`subscriptions`**:
| 필드 | 설명 |
|------|------|
| `org_id` | 조직 ID |
| `subscription_type` | `LICENSE_BASED` |
| `status` | `active` |
| `hq_license_count` | HQ 라이선스 개수 (자동 계산) |
| `store_license_count` | Store 라이선스 개수 (자동 계산) |
| `monthly_cost` | 월 비용 (자동 계산) |

**`licenses`**:
| 필드 | 설명 |
|------|------|
| `org_id` | 조직 ID |
| `license_type` | `HQ_SEAT` or `STORE` |
| `status` | `active` (구매 직후) |
| `monthly_price` | 500 (HQ) or 250 (Store) |
| `subscription_id` | 연결된 subscription ID |

---

#### 1.3.2 **Dashboard (`/dashboard`)** - 고객 대시보드
- **파일 경로**: `src/pages/Dashboard.tsx`
- **데이터베이스 연결**: 
  - ✅ **`organization_members`** (사용자 역할 확인)
  - ✅ **`organizations`** (조직 정보)
- **인증 필요**: 예 (로그인 상태 확인 + 리다이렉트)
- **외부 연동**: 
  - Supabase Auth (세션 확인)

**데이터 흐름**:
```
1. 페이지 로드 → supabase.auth.getSession()
   ├─ 세션 없음 → /auth로 리다이렉트
   └─ 세션 있음 → 계속
   ↓
2. organization_members JOIN organizations 쿼리
   - user_id로 조회
   - org_id, role, org_name 가져오기
   ↓
3. 화면에 표시:
   - 사용자 이름 (user_metadata.name 또는 email)
   - 조직 이름
   - 역할 (ORG_HQ/ORG_STORE/ORG_VIEWER)
   - 프로젝트 카드 (하드코딩된 외부 Dashboard 링크)
```

**표시되는 정보**:
- 사용자 이름
- 조직 이름 및 역할
- 대시보드 프로젝트 링크 (하드코딩: `https://neuraltwintest.app/`)
- 구독 정보 (하드코딩된 샘플 데이터)

**참고**: 실제 고객 대시보드 기능은 별도 프로젝트에 구현되어 있으며, 이 페이지는 단순히 링크를 제공하는 허브 역할만 수행.

---

#### 1.3.3 **Profile (`/profile`)** - 프로필
- **파일 경로**: `src/pages/Profile.tsx`
- **데이터베이스 연결**: 
  - ✅ **`auth.users`** (user_metadata)
  - ✅ **`organization_members`** (역할 및 조직 정보)
  - ✅ **`organizations`** (조직명)
  - ✅ **`licenses`** (라이선스 정보)
- **인증 필요**: 예
- **기능**: 읽기 전용 (수정 불가)

**데이터 흐름**:
```
1. 페이지 로드 → supabase.auth.getSession()
   ↓
2. 다중 쿼리 실행 (병렬):
   
   A. 사용자 기본 정보 (auth.users)
      - user_metadata.name
      - user_metadata.company
      - user_metadata.phone
      - user_metadata.roleType
      - email
      - created_at
   
   B. 조직 정보 (organization_members JOIN organizations)
      - org_name
      - role
      - license_id
      - joined_at
   
   C. 라이선스 정보 (licenses - license_id가 있는 경우)
      - license_type
      - status
      - monthly_price
      - effective_date
      - expiry_date
   ↓
3. 화면에 모든 정보 표시
```

**표시되는 정보 섹션**:

**1) 기본 정보**:
- 이름
- 이메일
- 전화번호
- 계정 생성일

**2) 회원가입 정보**:
- 회사명
- 선택한 역할 타입 (HQ/Store)

**3) 조직 정보**:
- 조직명
- 조직 역할 (ORG_HQ/ORG_STORE/ORG_VIEWER)
- 조직 가입일
- 라이선스 ID (있는 경우)

**4) 라이선스 정보** (license_id가 있는 경우):
- 라이선스 타입 (HQ License/Store License)
- 라이선스 상태 (활성/만료 등)
- 월 비용
- 유효 기간

---

#### 1.3.4 **Settings (`/settings`)** - 설정
- **파일 경로**: `src/pages/Settings.tsx`
- **데이터베이스 연결**: 
  - ✅ **`organization_members`** (사용자 조직 확인)
  - ✅ **`organizations`** (조직 정보)
  - ✅ **`subscriptions`** (구독 정보)
  - ✅ **`licenses`** (모든 라이선스 목록)
- **인증 필요**: 예
- **기능**: 읽기 전용 + 일부 수정 가능 (비밀번호 변경)

**데이터 흐름**:
```
1. 페이지 로드 → supabase.auth.getSession()
   ↓
2. 다중 쿼리 실행 (순차):
   
   A. 조직 멤버십 정보
      organization_members JOIN organizations JOIN licenses
      - org_id, org_name, role, license_id, license 정보
   
   B. 구독 정보 (org_id가 있는 경우)
      subscriptions WHERE org_id = ?
      - subscription_type, status, monthly_cost
      - hq_license_count, store_license_count, viewer_count
      - current_period_start, current_period_end
   
   C. 모든 라이선스 목록 (org_id가 있는 경우)
      licenses WHERE org_id = ? AND status NOT IN ('revoked', 'expired')
      - license_type, status, monthly_price, effective_date
   ↓
3. 화면에 정보 표시
```

**표시되는 정보 섹션**:

**1) 계정 정보** (읽기 전용):
- 이름
- 이메일

**2) 조직 정보** (읽기 전용):
- 조직명
- 조직 역할
- 라이선스 타입 (있는 경우)

**3) 구독 정보** (org_id가 있는 경우):
- 구독 타입 (LICENSE_BASED)
- 구독 상태 (활성/일시정지/취소됨)
- 월 비용
- 라이선스 개수 (HQ/Store/Viewer)
- 다음 결제일
- 구독 시작일

**4) 라이선스 목록** (org_id가 있는 경우):
- 각 라이선스별:
  - 라이선스 타입
  - 상태
  - 월 가격
  - 유효 기간

**5) 비밀번호 변경** (수정 가능):
- 새 비밀번호 입력 → `supabase.auth.updateUser()` 호출

---

## 2. 전체 데이터베이스 테이블 사용 현황

### 2.1 직접 사용하는 테이블

| 테이블명 | 사용 페이지 | 작업 유형 | 설명 |
|---------|------------|----------|------|
| **`auth.users`** | Auth, Profile, Settings | READ, INSERT | Supabase Auth 시스템. 사용자 인증 정보 저장 |
| **`organizations`** | Auth, Dashboard, Profile, Settings | READ, INSERT | 조직(회사) 정보 |
| **`organization_members`** | Auth, Dashboard, Profile, Settings, Subscribe | READ, INSERT | 조직 멤버십 및 역할 관리 |
| **`subscriptions`** | Auth, Settings | READ | 구독 및 라이선스 집계 정보 (자동 계산) |
| **`licenses`** | Profile, Settings | READ | 개별 라이선스 정보 |
| **`contact_submissions`** | Contact | INSERT | 문의 폼 제출 데이터 (Edge Function 경유) |

### 2.2 향후 사용 예정 테이블 (Stripe 연동 후)

| 테이블명 | 사용 예정 페이지 | 작업 유형 | 설명 |
|---------|----------------|----------|------|
| **`licenses`** | Subscribe | INSERT | 라이선스 구매 시 생성 |
| **`subscriptions`** | Subscribe | INSERT/UPDATE | 구독 생성 및 갱신 |

---

## 3. Edge Functions 사용 현황

### 3.1 **submit-contact**
- **경로**: `supabase/functions/submit-contact/index.ts`
- **호출 페이지**: Contact (`/contact`)
- **메서드**: POST
- **역할**: 문의 폼 데이터를 받아 `contact_submissions` 테이블에 저장
- **파라미터**:
  ```json
  {
    "name": "string",
    "company": "string",
    "email": "string",
    "phone": "string?",
    "stores": "number?",
    "features": "string[]?",
    "timeline": "string?",
    "message": "string"
  }
  ```
- **응답**: 성공 시 `{ success: true }`

### 3.2 **create-checkout** (🚧 미구현)
- **경로**: `supabase/functions/create-checkout/index.ts` (예정)
- **호출 예정 페이지**: Subscribe (`/subscribe`)
- **메서드**: POST
- **역할**: Stripe Checkout Session 생성
- **예정 파라미터**:
  ```json
  {
    "org_id": "uuid",
    "license_type": "HQ_SEAT | STORE",
    "quantity": "number",
    "price": "number"
  }
  ```
- **예정 응답**: `{ checkoutUrl: "https://checkout.stripe.com/..." }`

---

## 4. 외부 서비스 연동

### 4.1 Google Analytics 4 (GA4)
- **설정 파일**: `src/lib/analytics.ts`
- **연동 페이지**: 모든 public pages + 일부 protected pages
- **추적 이벤트**:
  - `page_view`: 모든 페이지
  - `funnel_step_1`: 랜딩/Pricing 방문
  - `funnel_step_2`: Product/Auth 방문, 미니 기능 클릭
  - `funnel_step_3`: Contact 방문, Subscribe 방문
  - `cta_click`: CTA 버튼 클릭
  - `mini_feature_interaction`: Product 페이지 기능 데모 인터랙션
  - `submit_contact`: Contact 폼 제출

### 4.2 Meta Pixel
- **설정 파일**: `src/lib/analytics.ts`
- **연동 페이지**: GA4와 동일
- **추적 이벤트**: GA4 이벤트를 Meta 표준 이벤트로 매핑
  - `PageView`
  - `Lead` (Contact 폼 제출)
  - `InitiateCheckout` (Subscribe CTA 클릭)
  - 기타 커스텀 이벤트

### 4.3 Supabase Auth
- **사용 페이지**: Auth, 모든 protected pages
- **제공 기능**:
  - Email/Password 인증
  - Google OAuth
  - 세션 관리
  - 자동 리프레시 토큰

### 4.4 Stripe (🚧 향후 연동)
- **사용 예정 페이지**: Subscribe
- **제공 기능**:
  - Checkout Session
  - Webhook (결제 완료 시 DB 업데이트)
  - 구독 관리

---

## 5. 데이터 보안 및 RLS (Row Level Security)

### 5.1 적용된 RLS 정책

#### **`organizations`**
- ✅ 조직 멤버만 조회 가능 (`is_org_member()`)
- ✅ 조직 생성 시 자동으로 생성자를 ORG_OWNER로 설정

#### **`organization_members`**
- ✅ 조직 멤버만 조직의 멤버 목록 조회 가능
- ✅ HQ 역할만 멤버 초대/수정 가능

#### **`subscriptions`**
- ✅ 조직 멤버만 조직의 구독 정보 조회 가능
- ✅ ORG_HQ 역할만 구독 생성/수정 가능

#### **`licenses`**
- ✅ 조직 멤버만 조직의 라이선스 조회 가능
- ✅ ORG_HQ 역할만 라이선스 생성/수정 가능

#### **`contact_submissions`**
- ✅ PUBLIC 테이블 (누구나 INSERT 가능)
- ❌ SELECT/UPDATE/DELETE 불가 (관리자만 Supabase Dashboard에서 접근)

### 5.2 인증 없이 접근 가능한 데이터
- 정적 페이지 콘텐츠 (Index, Product, Pricing, Contact, Privacy, Terms)
- 공개 이미지 파일 (`public/`, `src/assets/`)
- i18n 번역 파일

---

## 6. 환경 변수 및 설정

### 6.1 Supabase 연결 정보
- **파일 경로**: `src/integrations/supabase/client.ts`
- **환경 변수**: 
  - `SUPABASE_URL`: `https://bdrvowacecxnraaivlhr.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY`: (Anon Key, 공개 가능)

### 6.2 Analytics 설정
- **파일 경로**: `src/lib/analytics.ts`
- **환경 변수** (추후 설정 필요):
  - `GA4_MEASUREMENT_ID`
  - `META_PIXEL_ID`

---

## 7. 데이터 흐름 다이어그램

### 7.1 회원가입 → 구독 → 대시보드 접근 플로우

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       │ 1. 회원가입 (이메일, 회사명, 역할 선택)
       ↓
┌──────────────────┐
│   Auth Page      │ ← auth.users INSERT
│   (/auth)        │ ← organizations INSERT (또는 기존 조직 조인)
└────────┬─────────┘ ← organization_members INSERT
         │
         │ 2. 구독 확인
         ↓
    subscriptions SELECT
         │
    ┌────┴────┐
    │         │
 구독 있음  구독 없음
    │         │
    │         ↓
    │   ┌──────────────────┐
    │   │  Subscribe Page  │ ← licenses INSERT (향후)
    │   │   (/subscribe)   │ ← subscriptions INSERT (향후)
    │   └────────┬─────────┘
    │            │
    │            │ 3. 결제 완료
    │            │
    └────────────┴───────────┐
                             │
                             ↓
                    ┌─────────────────┐
                    │  Dashboard Page │ ← organization_members SELECT
                    │   (/dashboard)  │ ← organizations SELECT
                    └─────────────────┘
```

### 7.2 Contact 폼 제출 플로우

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       │ 1. Contact 폼 작성
       ↓
┌──────────────────┐
│  Contact Page    │
│   (/contact)     │
└────────┬─────────┘
         │
         │ 2. supabase.functions.invoke('submit-contact')
         ↓
┌──────────────────────┐
│  Edge Function:      │
│  submit-contact      │
└────────┬─────────────┘
         │
         │ 3. contact_submissions INSERT
         ↓
┌────────────────────────┐
│  contact_submissions   │
│      테이블             │
└────────────────────────┘
```

---

## 8. 향후 개발 계획

### 8.1 Stripe 결제 연동 (우선순위: 높음)
- **필요 작업**:
  1. Stripe API 키 설정 (Supabase Secrets)
  2. Edge Function `create-checkout` 구현
  3. Edge Function `stripe-webhook` 구현 (결제 완료 시 DB 업데이트)
  4. Subscribe 페이지에서 Edge Function 호출 연결
  5. 테스트 모드 결제 → 프로덕션 전환

### 8.2 실제 구독 관리 기능 (우선순위: 중간)
- **필요 작업**:
  1. Settings 페이지에서 구독 취소 기능 추가
  2. 라이선스 추가 구매 기능
  3. 결제 수단 변경 기능
  4. 결제 이력 조회

### 8.3 프로필/설정 수정 기능 (우선순위: 낮음)
- **필요 작업**:
  1. Profile 페이지에 이름/전화번호 수정 기능
  2. Settings 페이지에 이메일 변경 기능
  3. 프로필 사진 업로드 기능 (Supabase Storage 연동)

### 8.4 대시보드 프로젝트 통합 (우선순위: 낮음)
- **필요 작업**:
  1. 실제 고객 대시보드 프로젝트 URL을 DB에서 관리
  2. Dashboard 페이지에서 동적으로 프로젝트 목록 표시
  3. 역할별 접근 권한 제어

---

## 9. 기술 스택 요약

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **Frontend** | React + TypeScript | UI 컴포넌트 |
| **Routing** | React Router v6 | 페이지 라우팅 |
| **Styling** | Tailwind CSS + shadcn/ui | 디자인 시스템 |
| **State** | React Hooks | 로컬 상태 관리 |
| **i18n** | react-i18next | 다국어 지원 |
| **Backend** | Supabase | BaaS (인증, DB, Edge Functions) |
| **Database** | PostgreSQL (Supabase) | 데이터 저장소 |
| **Auth** | Supabase Auth | 인증 시스템 |
| **Analytics** | GA4 + Meta Pixel | 사용자 행동 추적 |
| **Payment** | Stripe (예정) | 결제 처리 |

---

## 10. 참고 문서

- **프로젝트 전체 스펙**: `docs/NEURALTWIN_WEBSITE_SPECIFICATION.md`
- **백엔드 스펙**: `docs/NEURALTWIN_BACKEND_SPECIFICATION.md`
- **통합 개발 계획**: `docs/integrated-development-plan.md`
- **Auth Types**: `src/types/auth.ts`
- **Supabase Client**: `src/integrations/supabase/client.ts`
- **Analytics Library**: `src/lib/analytics.ts`

---

**문서 작성자**: NEURALTWIN Development Team  
**마지막 업데이트**: 2025-01-26  
**버전**: 1.0
