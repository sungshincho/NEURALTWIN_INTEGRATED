# NEURALTWIN HQ Admin Dashboard Integration Guide

> **목적**: 별도의 Lovable 프로젝트로 생성될 NEURALTWIN HQ Admin 대시보드가 Customer Dashboard와 동일한 Multi-Tenancy 백엔드 인프라를 공유하도록 하기 위한 통합 가이드

---

## 1. 프로젝트 개요

### 1.1 HQ Admin 역할
- **도메인**: `hq.neuraltwin.ai`
- **접근 권한**: NEURALTWIN 내부 직원만 (role = 'NEURALTWIN_ADMIN' 또는 is_internal = true)
- **주요 기능**:
  - 전체 조직(Tenant) 관리 및 모니터링
  - 조직별 구독/라이선스 관리
  - 온톨로지 스키마 마스터 관리
  - ETL 파이프라인 모니터링
  - 시뮬레이션 설정 관리
  - 매출/사용량 통계 및 분석

### 1.2 아키텍처 원칙
- **공유 백엔드**: Customer Dashboard, Website와 **동일한 Supabase 프로젝트** 연결
- **Read-Heavy**: 주로 조회 및 모니터링 기능
- **Admin-Only**: 모든 민감한 작업은 `NEURALTWIN_ADMIN` 역할 검증 필수
- **Audit Logging**: 모든 관리 작업은 로그 기록

---

## 2. Supabase 백엔드 연결

### 2.1 프로젝트 연결 정보
```typescript
// src/integrations/supabase/client.ts
// Customer Dashboard, Website와 동일한 Supabase 프로젝트에 연결
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

## 3. NEURALTWIN Admin 역할 확인

### 3.1 Admin 역할 검증 함수 (이미 존재)

```sql
-- Security Definer 함수 (Customer Dashboard에서 이미 생성됨)
CREATE OR REPLACE FUNCTION public.is_neuraltwin_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND role = 'NEURALTWIN_ADMIN'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### 3.2 Admin Guard 컴포넌트

```typescript
// src/components/AdminGuard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Admin 역할 확인
      const { data, error } = await supabase
        .rpc("is_neuraltwin_admin", { _user_id: user.id });

      if (error || !data) {
        navigate("/unauthorized");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdminRole();
  }, [user, navigate]);

  if (loading) {
    return <div>권한 확인 중...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
```

### 3.3 App.tsx에 AdminGuard 적용

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminGuard } from "@/components/AdminGuard";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* 모든 관리 페이지는 AdminGuard로 보호 */}
        <Route path="/*" element={
          <AdminGuard>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/licenses" element={<LicensesPage />} />
              {/* ... 기타 관리 페이지 */}
            </Routes>
          </AdminGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 4. 페이지 구조 및 기능

### 4.1 Dashboard (Overview)

**경로**: `/dashboard`

**기능**:
- 전체 조직 수, 활성 구독 수, 총 매출
- 최근 가입 조직 목록
- 라이선스 만료 예정 알림
- 시스템 상태 모니터링

```typescript
// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    expiringLicenses: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // 전체 조직 수
      const { count: orgCount } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      // 활성 구독 수
      const { count: subCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setStats({
        totalOrgs: orgCount || 0,
        activeSubscriptions: subCount || 0,
        totalRevenue: 0, // 실제 계산 로직 추가
        expiringLicenses: 0 // 실제 계산 로직 추가
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">HQ Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>전체 조직</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalOrgs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>활성 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
        
        {/* ... 기타 통계 카드 */}
      </div>
    </div>
  );
}
```

---

### 4.2 Organizations (조직 관리)

**경로**: `/organizations`

**기능**:
- 전체 조직 목록 조회 (검색, 필터링)
- 조직 상세 정보 조회
- 조직 구독/라이선스 현황
- 조직 비활성화/재활성화

```typescript
// src/pages/OrganizationsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface Organization {
  id: string;
  org_name: string;
  industry: string | null;
  created_at: string;
  member_count?: number;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          org_name,
          industry,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setOrganizations(data);
      }
      setLoading(false);
    };

    fetchOrganizations();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">조직 관리</h1>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>조직명</TableHead>
            <TableHead>산업군</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>{org.org_name}</TableCell>
              <TableCell>{org.industry || "-"}</TableCell>
              <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <button>상세보기</button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### 4.3 Subscriptions (구독 관리)

**경로**: `/subscriptions`

**기능**:
- 전체 구독 목록 조회
- 구독 상태 변경 (활성/취소/만료)
- 구독 갱신 일정 관리
- 결제 이력 조회

```typescript
// src/pages/SubscriptionsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  org_id: string;
  plan_type: string;
  status: string;
  store_quota: number;
  hq_seat_quota: number;
  billing_cycle_end: string;
  organizations?: {
    org_name: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select(`
          *,
          organizations(org_name)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setSubscriptions(data);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("id", subscriptionId);

    if (!error) {
      // 상태 업데이트 후 목록 새로고침
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">구독 관리</h1>
      
      {/* 구독 목록 테이블 */}
    </div>
  );
}
```

---

### 4.4 Licenses (라이선스 관리)

**경로**: `/licenses`

**기능**:
- 전체 라이선스 목록 조회
- 라이선스 발급/갱신/만료 처리
- 라이선스 타입별 현황
- 만료 예정 라이선스 알림

---

### 4.5 Ontology Schema (온톨로지 마스터 관리)

**경로**: `/ontology-schemas`

**기능**:
- 공통 온톨로지 스키마 마스터 관리
- Entity Types 및 Relation Types 정의
- 버전 관리 및 배포
- 고객사별 스키마 커스터마이징 지원

```typescript
// src/pages/OntologySchemaPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function OntologySchemaPage() {
  const [entityTypes, setEntityTypes] = useState([]);

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const { data } = await supabase
        .from("ontology_entity_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setEntityTypes(data);
      }
    };

    fetchEntityTypes();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">온톨로지 스키마 관리</h1>
      
      {/* Entity Types 목록 및 관리 UI */}
    </div>
  );
}
```

---

### 4.6 ETL Pipeline (데이터 파이프라인 모니터링)

**경로**: `/etl-pipeline`

**기능**:
- 조직별 데이터 임포트 현황
- ETL 작업 성공/실패 통계
- 에러 로그 조회 및 재처리
- 데이터 품질 모니터링

```typescript
// src/pages/ETLPipelinePage.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ETLPipelinePage() {
  const [imports, setImports] = useState([]);

  useEffect(() => {
    const fetchImports = async () => {
      const { data } = await supabase
        .from("user_data_imports")
        .select(`
          *,
          organizations(org_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        setImports(data);
      }
    };

    fetchImports();

    // Realtime 구독으로 실시간 업데이트
    const channel = supabase
      .channel("user_data_imports_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_data_imports"
        },
        () => {
          fetchImports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ETL 파이프라인 모니터링</h1>
      
      {/* 데이터 임포트 현황 테이블 */}
    </div>
  );
}
```

---

### 4.7 Simulation Config (시뮬레이션 설정 관리)

**경로**: `/simulation-config`

**기능**:
- AI 모델 파라미터 마스터 설정
- 시나리오 타입별 기본값 관리
- 조직별 시뮬레이션 사용 통계
- 성능 지표 모니터링

---

### 4.8 Analytics (매출/사용량 분석)

**경로**: `/analytics`

**기능**:
- 월별/분기별 매출 통계
- 조직별 사용량 분석 (API 호출, 스토리지 등)
- 플랜별 가입자 분포
- 리텐션 및 이탈 분석

---

## 5. RLS 정책 (Multi-Tenant 읽기 권한)

### 5.1 Organizations 테이블 RLS
```sql
-- NEURALTWIN_ADMIN은 모든 조직 조회 가능
CREATE POLICY "neuraltwin_admin_select_all_orgs"
ON public.organizations FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

-- NEURALTWIN_ADMIN은 조직 정보 수정 가능
CREATE POLICY "neuraltwin_admin_update_orgs"
ON public.organizations FOR UPDATE
USING (public.is_neuraltwin_admin(auth.uid()));
```

### 5.2 Subscriptions 테이블 RLS
```sql
-- NEURALTWIN_ADMIN은 모든 구독 조회 가능
CREATE POLICY "neuraltwin_admin_select_all_subscriptions"
ON public.subscriptions FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

-- NEURALTWIN_ADMIN은 구독 상태 변경 가능
CREATE POLICY "neuraltwin_admin_update_subscriptions"
ON public.subscriptions FOR UPDATE
USING (public.is_neuraltwin_admin(auth.uid()));
```

### 5.3 Licenses 테이블 RLS
```sql
-- NEURALTWIN_ADMIN은 모든 라이선스 조회 가능
CREATE POLICY "neuraltwin_admin_select_all_licenses"
ON public.licenses FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

-- NEURALTWIN_ADMIN은 라이선스 발급/갱신 가능
CREATE POLICY "neuraltwin_admin_insert_licenses"
ON public.licenses FOR INSERT
WITH CHECK (public.is_neuraltwin_admin(auth.uid()));

CREATE POLICY "neuraltwin_admin_update_licenses"
ON public.licenses FOR UPDATE
USING (public.is_neuraltwin_admin(auth.uid()));
```

### 5.4 데이터 테이블 RLS (조직별 데이터 조회)
```sql
-- NEURALTWIN_ADMIN은 모든 조직의 데이터 조회 가능
CREATE POLICY "neuraltwin_admin_select_all_stores"
ON public.stores FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

CREATE POLICY "neuraltwin_admin_select_all_products"
ON public.products FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

CREATE POLICY "neuraltwin_admin_select_all_visits"
ON public.visits FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

-- ... 기타 데이터 테이블에도 동일 패턴 적용
```

---

## 6. Audit Logging (관리 작업 로깅)

### 6.1 Admin Audit Logs 테이블 생성

```sql
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'update_subscription', 'issue_license', 'disable_org', etc.
  target_type TEXT NOT NULL, -- 'organization', 'subscription', 'license', etc.
  target_id UUID NOT NULL,
  changes JSONB, -- 변경 전후 값
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: NEURALTWIN_ADMIN만 조회 가능
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "neuraltwin_admin_select_audit_logs"
ON public.admin_audit_logs FOR SELECT
USING (public.is_neuraltwin_admin(auth.uid()));

CREATE POLICY "neuraltwin_admin_insert_audit_logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (public.is_neuraltwin_admin(auth.uid()));
```

### 6.2 Audit Log 기록 함수

```typescript
// src/utils/auditLog.ts
import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  targetType: string;
  targetId: string;
  changes?: any;
  metadata?: any;
}

export async function recordAuditLog(params: AuditLogParams) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from("admin_audit_logs").insert({
    admin_user_id: user.id,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    changes: params.changes,
    metadata: params.metadata
  });
}
```

### 6.3 사용 예시

```typescript
// 구독 상태 변경 시 로그 기록
const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
  const oldStatus = subscriptions.find((s) => s.id === subscriptionId)?.status;

  await supabase
    .from("subscriptions")
    .update({ status: newStatus })
    .eq("id", subscriptionId);

  // Audit Log 기록
  await recordAuditLog({
    action: "update_subscription_status",
    targetType: "subscription",
    targetId: subscriptionId,
    changes: {
      before: { status: oldStatus },
      after: { status: newStatus }
    }
  });
};
```

---

## 7. Organization Context Provider (Admin용)

```typescript
// src/contexts/AdminOrgContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminOrgContextType {
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  allOrganizations: Array<{ id: string; org_name: string }>;
  loading: boolean;
}

const AdminOrgContext = createContext<AdminOrgContextType | undefined>(undefined);

export function AdminOrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAllOrganizations = async () => {
      // NEURALTWIN_ADMIN은 모든 조직 조회 가능
      const { data } = await supabase
        .from("organizations")
        .select("id, org_name")
        .order("org_name", { ascending: true });

      if (data) {
        setAllOrganizations(data);
      }

      setLoading(false);
    };

    fetchAllOrganizations();
  }, [user]);

  return (
    <AdminOrgContext.Provider
      value={{ selectedOrgId, setSelectedOrgId, allOrganizations, loading }}
    >
      {children}
    </AdminOrgContext.Provider>
  );
}

export const useAdminOrg = () => {
  const context = useContext(AdminOrgContext);
  if (!context) throw new Error("useAdminOrg must be used within AdminOrgProvider");
  return context;
};
```

---

## 8. Organization Selector Component

```typescript
// src/components/OrgSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminOrg } from "@/contexts/AdminOrgContext";

export function OrgSelector() {
  const { selectedOrgId, setSelectedOrgId, allOrganizations } = useAdminOrg();

  return (
    <Select value={selectedOrgId || ""} onValueChange={setSelectedOrgId}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="조직 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">전체 조직</SelectItem>
        {allOrganizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.org_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 9. 체크리스트

### 9.1 백엔드 연결 확인
- [ ] Supabase 프로젝트 URL 및 Anon Key 설정
- [ ] Customer Dashboard, Website와 동일한 프로젝트 연결 확인
- [ ] 환경 변수 설정 완료

### 9.2 Admin 역할 확인
- [ ] `is_neuraltwin_admin` 함수 존재 확인
- [ ] `AdminGuard` 컴포넌트 구현 및 적용
- [ ] 모든 관리 페이지에 `AdminGuard` 적용

### 9.3 RLS 정책 확인
- [ ] Organizations 테이블에 Admin SELECT 정책 추가
- [ ] Subscriptions 테이블에 Admin SELECT/UPDATE 정책 추가
- [ ] Licenses 테이블에 Admin SELECT/INSERT/UPDATE 정책 추가
- [ ] 데이터 테이블(stores, products, visits 등)에 Admin SELECT 정책 추가

### 9.4 Audit Logging 구현
- [ ] `admin_audit_logs` 테이블 생성
- [ ] `recordAuditLog` 유틸리티 함수 구현
- [ ] 모든 민감한 작업에 Audit Log 기록 추가

### 9.5 페이지 구현
- [ ] Dashboard (Overview) 페이지
- [ ] Organizations 관리 페이지
- [ ] Subscriptions 관리 페이지
- [ ] Licenses 관리 페이지
- [ ] Ontology Schema 관리 페이지
- [ ] ETL Pipeline 모니터링 페이지
- [ ] Simulation Config 관리 페이지
- [ ] Analytics 페이지

### 9.6 Multi-Tenant 컨텍스트
- [ ] `AdminOrgProvider` 구현
- [ ] `OrgSelector` 컴포넌트 구현
- [ ] 각 페이지에서 조직 필터링 기능 구현

---

## 10. 트러블슈팅

### 10.1 Admin 권한이 확인되지 않는 경우
- `organization_members` 테이블에서 `role = 'NEURALTWIN_ADMIN'` 레코드 확인
- `is_neuraltwin_admin` 함수가 올바르게 작동하는지 확인

### 10.2 RLS 정책으로 인해 데이터 조회 실패
- Admin용 RLS 정책이 추가되었는지 확인
- `NEURALTWIN_ADMIN` 역할이 정확히 설정되었는지 확인

### 10.3 Audit Log 기록 실패
- `admin_audit_logs` 테이블 존재 확인
- RLS 정책에서 INSERT 권한 확인

### 10.4 조직 선택 후 데이터 조회 안 됨
- `selectedOrgId` 상태가 올바르게 전달되는지 확인
- 쿼리에 `eq("org_id", selectedOrgId)` 필터 적용 확인

---

## 11. 보안 권장사항

### 11.1 IP 화이트리스트
- HQ Admin 접근을 특정 IP 대역으로 제한 고려
- Cloudflare Access 또는 AWS WAF 사용 권장

### 11.2 2FA (이중 인증)
- NEURALTWIN_ADMIN 계정에 2FA 필수 적용

### 11.3 세션 타임아웃
- 관리자 세션은 30분 후 자동 로그아웃

### 11.4 민감한 작업 재확인
- 조직 삭제, 구독 취소 등 중요한 작업은 확인 다이얼로그 필수

---

## 12. 참고 자료

- [Supabase Multi-Tenancy Best Practices](https://supabase.com/docs/guides/auth/multi-tenancy)
- [Supabase RLS Admin Access](https://supabase.com/docs/guides/auth/row-level-security#bypass-rls-with-service-role)
- [Audit Logging Best Practices](https://supabase.com/docs/guides/database/audit-logs)
