# NEURALTWIN Website Project Integration Guide

> **목적**: 별도의 Lovable 프로젝트로 생성될 NEURALTWIN 웹사이트 프로젝트가 Customer Dashboard와 동일한 Multi-Tenancy 백엔드 인프라를 공유하도록 하기 위한 통합 가이드

---

## 1. 프로젝트 개요

### 1.1 웹사이트 역할
- **도메인**: `www.neuraltwin.ai`
- **주요 기능**:
  - 마케팅 랜딩 페이지
  - 사용자 회원가입 (Email/Password, OAuth)
  - 요금제 선택 및 결제 (PG/Stripe)
  - Organization 및 License 생성
  - Customer Dashboard로 자동 리디렉션

### 1.2 아키텍처 원칙
- **공유 백엔드**: Customer Dashboard와 **동일한 Supabase 프로젝트** 연결
- **Single Source of Truth**: Auth, Organizations, Subscriptions, Licenses는 모두 공유 테이블
- **역할 분리**: Website는 **생성(CREATE)** 담당, Customer Dashboard는 **사용(READ/UPDATE)** 담당

---

## 2. Supabase 백엔드 연결

### 2.1 프로젝트 연결 정보
```typescript
// src/integrations/supabase/client.ts
// Customer Dashboard와 동일한 Supabase 프로젝트에 연결
const SUPABASE_URL = "https://olrpznsmzxbmkfppptgc.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### 2.2 환경 변수 설정
```env
VITE_SUPABASE_URL=https://olrpznsmzxbmkfppptgc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=olrpznsmzxbmkfppptgc
```

---

## 3. Multi-Tenancy 테이블 구조

> **중요**: 아래 테이블들은 Customer Dashboard에서 이미 생성되어 있습니다. Website 프로젝트에서는 **생성하지 않고** **연결만** 하면 됩니다.

### 3.1 Organizations 테이블
```sql
-- 이미 존재하는 테이블 (생성 불필요)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  industry TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Organization Members 테이블
```sql
-- 이미 존재하는 테이블 (생성 불필요)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'ORG_MEMBER',
  permissions JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
```

**App Role Enum**:
```sql
CREATE TYPE app_role AS ENUM (
  'ORG_OWNER',
  'ORG_ADMIN',
  'ORG_MEMBER',
  'NEURALTWIN_ADMIN'
);
```

### 3.3 Subscriptions 테이블
```sql
-- 이미 존재하는 테이블 (생성 불필요)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- 'starter', 'professional', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  store_quota INTEGER NOT NULL DEFAULT 1,
  hq_seat_quota INTEGER NOT NULL DEFAULT 1,
  billing_cycle_start TIMESTAMPTZ NOT NULL,
  billing_cycle_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Licenses 테이블
```sql
-- 이미 존재하는 테이블 (생성 불필요)
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Profiles 테이블
```sql
-- 이미 존재하는 테이블 (생성 불필요)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  department TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Security Definer Functions

> **중요**: 아래 함수들도 이미 생성되어 있습니다. Website 프로젝트에서 RLS 정책에 **사용만** 하면 됩니다.

```sql
-- 조직 멤버십 확인
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 사용자의 조직 ID 조회
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID AS $$
  SELECT org_id FROM public.organization_members
  WHERE user_id = _user_id LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 조직 관리자 확인
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
      AND role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 조직 소유자 확인
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
      AND role = 'ORG_OWNER'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- NEURALTWIN 관리자 확인
CREATE OR REPLACE FUNCTION public.is_neuraltwin_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND role = 'NEURALTWIN_ADMIN'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

## 5. 회원가입 및 조직 생성 플로우

### 5.1 회원가입 페이지 (`/signup`)

```typescript
// src/pages/SignUpPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    orgName: "",
    industry: ""
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Auth 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // 2. Organization 생성
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          org_name: formData.orgName,
          industry: formData.industry,
          created_by: authData.user.id
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Organization Member 추가 (ORG_OWNER 역할)
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          org_id: orgData.id,
          user_id: authData.user.id,
          role: "ORG_OWNER"
        });

      if (memberError) throw memberError;

      toast({
        title: "회원가입 완료",
        description: "요금제를 선택해주세요"
      });

      // 4. 요금제 선택 페이지로 이동 (org_id 전달)
      navigate(`/pricing?org_id=${orgData.id}`);

    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    // 회원가입 폼 UI
  );
}
```

### 5.2 요금제 선택 페이지 (`/pricing`)

```typescript
// src/pages/PricingPage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function PricingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orgId = searchParams.get("org_id");

  const [selectedPlan, setSelectedPlan] = useState({
    planType: "professional", // 'starter', 'professional', 'enterprise'
    storeCount: 1,
    hqSeatCount: 1
  });

  const handleSelectPlan = () => {
    // Checkout 페이지로 이동 (org_id, plan 정보 전달)
    navigate(
      `/checkout?org_id=${orgId}&plan=${selectedPlan.planType}&stores=${selectedPlan.storeCount}&seats=${selectedPlan.hqSeatCount}`
    );
  };

  return (
    // 요금제 선택 UI
  );
}
```

### 5.3 결제 페이지 (`/checkout`)

```typescript
// src/pages/CheckoutPage.tsx
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get("org_id");
  const planType = searchParams.get("plan");
  const storeCount = parseInt(searchParams.get("stores") || "1");
  const seatCount = parseInt(searchParams.get("seats") || "1");

  const handlePayment = async () => {
    // PG/Stripe 결제 처리
    const paymentResult = await processPayment({
      orgId,
      planType,
      storeCount,
      seatCount
    });

    if (paymentResult.success) {
      // Webhook이 처리하도록 대기 후 Customer Dashboard로 리디렉션
      window.location.href = `https://app.neuraltwin.ai?org_id=${orgId}`;
    }
  };

  return (
    // 결제 폼 UI
  );
}
```

### 5.4 결제 완료 Webhook (Edge Function)

```typescript
// supabase/functions/payment-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const payload = await req.json();

  // PG/Stripe Webhook 검증
  // ...

  const { org_id, plan_type, store_quota, hq_seat_quota } = payload;

  try {
    // 1. Subscription 생성
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .insert({
        org_id,
        plan_type,
        store_quota,
        hq_seat_quota,
        status: "active",
        billing_cycle_start: new Date().toISOString(),
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (subError) throw subError;

    // 2. License 생성
    const { error: licError } = await supabaseClient
      .from("licenses")
      .insert({
        org_id,
        license_type: plan_type,
        effective_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        metadata: { store_quota, hq_seat_quota }
      });

    if (licError) throw licError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

---

## 6. JWT Claims 및 조직 컨텍스트

### 6.1 JWT Claims 구조
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "org_id": "org-uuid",
  "role": "ORG_OWNER"
}
```

### 6.2 조직 컨텍스트 Provider

```typescript
// src/contexts/OrgContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrgContextType {
  orgId: string | null;
  orgName: string | null;
  role: string | null;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrgContext = async () => {
      // Organization Member 조회
      const { data: memberData } = await supabase
        .from("organization_members")
        .select("org_id, role, organizations(org_name)")
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        setOrgId(memberData.org_id);
        setRole(memberData.role);
        setOrgName(memberData.organizations?.org_name || null);
      }

      setLoading(false);
    };

    fetchOrgContext();
  }, [user]);

  return (
    <OrgContext.Provider value={{ orgId, orgName, role, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
};
```

---

## 7. RLS 정책 패턴

### 7.1 Organizations 테이블 RLS
```sql
-- SELECT: 조직 멤버만 조회 가능
CREATE POLICY "org_members_select_own_org"
ON public.organizations FOR SELECT
USING (public.is_org_member(auth.uid(), id));

-- INSERT: 인증된 사용자 누구나 생성 가능 (회원가입 시)
CREATE POLICY "authenticated_users_insert_org"
ON public.organizations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: 조직 관리자만 수정 가능
CREATE POLICY "org_admins_update_org"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(auth.uid(), id));
```

### 7.2 Organization Members 테이블 RLS
```sql
-- SELECT: 같은 조직 멤버만 조회 가능
CREATE POLICY "org_members_select_own_members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: 조직 관리자만 추가 가능
CREATE POLICY "org_admins_insert_members"
ON public.organization_members FOR INSERT
WITH CHECK (
  public.is_org_admin(auth.uid(), org_id)
  OR auth.uid() = user_id -- 회원가입 시 본인 추가 허용
);

-- DELETE: 조직 관리자만 삭제 가능
CREATE POLICY "org_admins_delete_members"
ON public.organization_members FOR DELETE
USING (public.is_org_admin(auth.uid(), org_id));
```

### 7.3 Subscriptions 테이블 RLS
```sql
-- SELECT: 조직 멤버만 조회 가능
CREATE POLICY "org_members_select_subscription"
ON public.subscriptions FOR SELECT
USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: 시스템(Service Role)만 생성 가능 (Webhook)
CREATE POLICY "service_role_insert_subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- UPDATE: 조직 소유자 또는 시스템만 수정 가능
CREATE POLICY "org_owner_update_subscription"
ON public.subscriptions FOR UPDATE
USING (
  public.is_org_owner(auth.uid(), org_id)
  OR auth.role() = 'service_role'
);
```

---

## 8. Customer Dashboard 리디렉션

### 8.1 결제 완료 후 자동 리디렉션
```typescript
// 결제 완료 페이지
const redirectToApp = (orgId: string) => {
  // org_id를 URL 파라미터로 전달
  window.location.href = `https://app.neuraltwin.ai?org_id=${orgId}`;
};
```

### 8.2 Customer Dashboard에서 org_id 수신
```typescript
// Customer Dashboard: src/App.tsx
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useOrg } from "@/contexts/OrgContext";

function App() {
  const [searchParams] = useSearchParams();
  const { setOrgId } = useOrg();
  
  useEffect(() => {
    const orgIdFromUrl = searchParams.get("org_id");
    if (orgIdFromUrl) {
      setOrgId(orgIdFromUrl);
      // URL에서 org_id 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  return (
    // App 렌더링
  );
}
```

---

## 9. OAuth 통합 (Google, Kakao)

### 9.1 Google OAuth
```typescript
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error("Google 로그인 실패:", error);
  }
};
```

### 9.2 OAuth 콜백 처리
```typescript
// src/pages/AuthCallbackPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // 기존 조직이 있는지 확인
        const { data: memberData } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", session.user.id)
          .single();

        if (memberData) {
          // 기존 조직 있음 → Customer Dashboard로
          window.location.href = `https://app.neuraltwin.ai?org_id=${memberData.org_id}`;
        } else {
          // 신규 사용자 → 조직 생성 페이지로
          navigate("/create-organization");
        }
      }
    };

    handleCallback();
  }, []);

  return <div>로그인 처리 중...</div>;
}
```

---

## 10. 체크리스트

### 10.1 백엔드 연결 확인
- [ ] Supabase 프로젝트 URL 및 Anon Key 설정
- [ ] Customer Dashboard와 동일한 프로젝트 연결 확인
- [ ] 환경 변수 설정 완료

### 10.2 테이블 구조 확인
- [ ] `organizations` 테이블 존재 확인
- [ ] `organization_members` 테이블 존재 확인
- [ ] `subscriptions` 테이블 존재 확인
- [ ] `licenses` 테이블 존재 확인
- [ ] `profiles` 테이블 존재 확인

### 10.3 Security Functions 확인
- [ ] `is_org_member` 함수 존재 확인
- [ ] `get_user_org_id` 함수 존재 확인
- [ ] `is_org_admin` 함수 존재 확인
- [ ] `is_org_owner` 함수 존재 확인
- [ ] `is_neuraltwin_admin` 함수 존재 확인

### 10.4 RLS 정책 확인
- [ ] Organizations 테이블 RLS 활성화
- [ ] Organization Members 테이블 RLS 활성화
- [ ] Subscriptions 테이블 RLS 활성화
- [ ] Licenses 테이블 RLS 활성화

### 10.5 회원가입 플로우 구현
- [ ] 회원가입 페이지 구현
- [ ] Organization 생성 로직 구현
- [ ] Organization Member 추가 로직 구현
- [ ] 요금제 선택 페이지 구현
- [ ] 결제 페이지 구현
- [ ] 결제 Webhook 구현
- [ ] Subscription/License 자동 생성 구현

### 10.6 Customer Dashboard 연동
- [ ] org_id 파라미터 전달 구현
- [ ] Customer Dashboard 리디렉션 테스트
- [ ] 조직 컨텍스트 공유 확인

---

## 11. 트러블슈팅

### 11.1 조직이 생성되지 않는 경우
- RLS 정책에서 `INSERT` 권한 확인
- `authenticated_users_insert_org` 정책 존재 여부 확인

### 11.2 Organization Member 추가 실패
- 회원가입 시 본인 추가는 허용되어야 함
- RLS 정책에 `auth.uid() = user_id` 조건 확인

### 11.3 Subscription이 생성되지 않는 경우
- Webhook에서 Service Role Key 사용 확인
- `service_role_insert_subscription` 정책 존재 확인

### 11.4 Customer Dashboard 리디렉션 실패
- `org_id` URL 파라미터 전달 확인
- CORS 설정 확인 (필요 시)

---

## 12. 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy Best Practices](https://supabase.com/docs/guides/auth/multi-tenancy)
