# NEURALTWIN 온보딩 가이드

> **최종 업데이트**: 2025-11-24  
> **버전**: 2.0

---

## 🚀 프로젝트 소개

NEURALTWIN은 AI 기반 리테일 데이터 분석 플랫폼으로, 매장의 디지털 트윈을 구축하고 다양한 시뮬레이션을 통해 최적의 의사결정을 지원합니다.

### 핵심 가치
- 🎯 **데이터 기반 의사결정**: 실시간 데이터 분석 및 AI 추천
- 🏬 **3D 디지털 트윈**: 매장의 3D 시각화 및 시뮬레이션
- 🤖 **AI 시뮬레이션**: 레이아웃, 가격, 재고, 수요 예측
- 📊 **통합 온톨로지**: 유연한 데이터 스키마 관리
- 🔄 **실시간 추적**: WiFi 기반 고객 동선 분석

---

## 🛠 기술 스택

### Frontend
- **Framework**: React 18.3.1 + TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Routing**: React Router DOM 6.30.1
- **UI**: shadcn/ui + Tailwind CSS 3.x
- **State**: TanStack Query 5.83.0
- **3D**: Three.js + React Three Fiber + drei
- **Charts**: Recharts 2.15.4

### Backend (Lovable Cloud)
- **Platform**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL 15+
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Supabase Edge Functions (Deno)
- **AI**: Lovable AI (Gemini, GPT)

---

## 📁 프로젝트 구조

```
src/
├── components/              # 공유 컴포넌트
│   ├── ui/                 # shadcn/ui
│   ├── AppSidebar.tsx
│   ├── DashboardLayout.tsx
│   ├── DataReadinessGuard.tsx
│   └── ProtectedRoute.tsx
│
├── core/                    # 핵심 페이지
│   └── pages/
│       ├── AuthPage.tsx
│       ├── DashboardPage.tsx
│       ├── SettingsPage.tsx
│       └── NotFoundPage.tsx
│
├── features/                # Feature-based 모듈
│   ├── data-management/    # 데이터 관리
│   ├── store-analysis/     # 매장 분석
│   ├── simulation/         # AI 시뮬레이션
│   ├── digital-twin/       # 3D Digital Twin
│   ├── profit-center/      # 수익 센터
│   └── cost-center/        # 비용 센터
│
├── hooks/                   # 커스텀 훅
├── utils/                   # 유틸리티
├── types/                   # 타입 정의
└── integrations/           # 외부 통합 (Supabase)
```

상세 구조: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)  
완전한 아키텍처: [NEURALTWIN_COMPLETE_ARCHITECTURE.md](./NEURALTWIN_COMPLETE_ARCHITECTURE.md)

---

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Electric Blue (#1B6BFF)
- **Background**: Dark Navy (#0A1020)
- **Accent**: Neural Purple (#9B59FF)
- **Surface**: Glassmorphism (rgba)

### 주요 유틸리티 클래스
- `gradient-text` - 그라디언트 텍스트
- `hover-lift` - 호버 리프트 효과
- `bg-gradient-primary` - 메인 그라디언트 배경
- `shadow-glow` - 글로우 효과

### 애니메이션
- `animate-fade-in` - 페이드인
- `animate-slide-up` - 슬라이드 업
- `animate-scale-in` - 스케일 인

**💡 중요**: 항상 디자인 시스템의 semantic tokens를 사용하세요!
- ❌ `text-white`, `bg-blue-500` (하드코딩)
- ✅ `text-foreground`, `bg-primary` (시맨틱 토큰)

---

## 🚦 시작하기

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. Lovable Cloud 설정

Lovable Cloud가 자동으로 설정됩니다:
- Supabase 프로젝트 자동 연결
- 환경 변수 자동 관리
- 데이터베이스 마이그레이션 자동 적용

### 3. 첫 매장 등록

1. `/stores` 페이지로 이동
2. "매장 추가" 버튼 클릭
3. 매장 정보 입력 후 저장
4. 사이드바에서 매장 선택

### 4. 데이터 임포트

1. `/data-import` 페이지로 이동
2. CSV 파일 업로드 (customers, products, purchases, visits)
3. 데이터 검증 후 저장
4. 온톨로지 자동 매핑 확인

---

## 📄 주요 페이지 소개

### 대시보드 (`/`)
- 실시간 KPI (방문자, 매출, 전환율)
- 주간 트렌드 차트
- AI 추천 카드
- 퍼널 시각화

### 매장 분석
- **Footfall Analysis** (`/footfall-analysis`) - 고객 동선 분석
- **Traffic Heatmap** (`/traffic-heatmap`) - 히트맵 시각화
- **Customer Journey** (`/customer-journey`) - 고객 여정
- **Conversion Funnel** (`/conversion-funnel`) - 전환 퍼널

### 데이터 관리
- **Unified Data Import** (`/data-import`) - 데이터 임포트
- **Schema Builder** (`/schema-builder`) - 온톨로지 스키마
- **Graph Analysis** (`/graph-analysis`) - 그래프 분석

### 3D Digital Twin
- **Digital Twin 3D** (`/digital-twin-3d`) - 3D 매장 시각화
- 히트맵 오버레이
- 고객 동선 오버레이
- WiFi 트래킹 오버레이

---

## 🔐 인증 시스템

### 로그인
- 이메일/비밀번호 인증
- Supabase Auth 사용
- Protected Routes로 보호

### 회원가입
- 이메일 자동 검증 (auto-confirm 활성화)
- 자동 프로필 생성

### 보호된 라우트
모든 대시보드 페이지는 `ProtectedRoute`로 보호됩니다.

---

## 💻 개발 가이드

### 새 페이지 추가

```typescript
// 1. 페이지 생성
// src/features/my-feature/pages/MyPage.tsx
export default function MyPage() {
  return <div>My Page</div>;
}

// 2. 라우트 추가 (src/App.tsx)
<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>

// 3. 메뉴 추가 (src/components/AppSidebar.tsx)
<NavLink to="/my-page" icon={Icon}>
  My Page
</NavLink>
```

### 새 컴포넌트 생성

```typescript
// Feature 특화 컴포넌트
// src/features/my-feature/components/MyComponent.tsx

// 공유 컴포넌트
// src/components/MySharedComponent.tsx
```

### 스타일링 가이드

```tsx
// ✅ 좋은 예시
<Button className="bg-gradient-primary hover:shadow-glow">
  <span className="gradient-text">클릭</span>
</Button>

// ❌ 나쁜 예시
<Button className="bg-blue-500 hover:bg-blue-600">
  <span className="text-white">클릭</span>
</Button>
```

---

## 🗄 데이터베이스 구조

### 주요 테이블

#### 매장 관리
- `stores` - 매장 정보
- `hq_store_master` - 본사 매장 마스터
- `store_mappings` - 매장 매핑

#### 데이터 임포트 & 온톨로지
- `user_data_imports` - 업로드 데이터
- `ontology_entity_types` - 엔티티 타입
- `ontology_relation_types` - 관계 타입
- `graph_entities` - 엔티티 인스턴스
- `graph_relations` - 관계

#### WiFi 추적
- `neuralsense_devices` - WiFi 센서
- `wifi_tracking` - 트래킹 데이터
- `wifi_zones` - 존 정의

#### 분석 & KPI
- `dashboard_kpis` - KPI 집계
- `funnel_metrics` - 퍼널 메트릭
- `analysis_history` - 분석 이력

#### AI & 시뮬레이션
- `scenarios` - 시나리오
- `simulation_results` - 시뮬레이션 결과
- `ai_recommendations` - AI 추천

### RLS (Row Level Security)
모든 테이블에 사용자별 데이터 격리 정책 적용:
```sql
auth.uid() = user_id
```

---

## 🔧 트러블슈팅

### 로그인 후 대시보드가 로딩되지 않음
- 브라우저 콘솔에서 에러 확인
- Lovable Cloud 연결 상태 확인
- 페이지 새로고침 (Ctrl+F5)

### 데이터가 표시되지 않음
1. 매장이 선택되었는지 확인
2. 데이터가 임포트되었는지 확인 (`/data-import`)
3. 온톨로지 스키마가 설정되었는지 확인 (`/schema-builder`)

### 3D 모델이 로딩되지 않음
- Supabase Storage에 모델 업로드 확인
- 파일명 규칙 준수 확인 (`Entity_Name_WxDxH.glb`)
- 브라우저 콘솔에서 에러 확인

### 차트가 표시되지 않음
- 데이터 형식 확인
- Recharts 컴포넌트 props 확인
- 브라우저 호환성 확인

---

## 📚 추가 문서

### 필수 문서
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 프로젝트 구조 및 개발 로드맵
- **[NEURALTWIN_COMPLETE_ARCHITECTURE.md](./NEURALTWIN_COMPLETE_ARCHITECTURE.md)** - 완전한 시스템 아키텍처
- **[COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)** - 협업 가이드

### 기술 문서 (docs/)
- `3D_MODEL_FILENAME_SPECIFICATION.md` - 3D 모델 파일명 규칙
- `DEMO_DATASET_REQUIREMENTS.md` - 데모 데이터셋 요구사항
- `WIFI_TRACKING_CSV_GUIDE.md` - WiFi 트래킹 데이터 가이드
- `SIMULATION_GUIDE.md` - 시뮬레이션 가이드

### 통합 가이드
- **[DIGITAL_TWIN_3D_INTEGRATION.md](./DIGITAL_TWIN_3D_INTEGRATION.md)** - 3D 디지털 트윈 통합 가이드

---

## 🎓 학습 리소스

### 외부 문서
- [Lovable 문서](https://docs.lovable.dev)
- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

---

## ✅ 다음 단계

1. ✅ 기본 인증 시스템
2. ✅ Feature-based 아키텍처
3. ✅ 디자인 시스템
4. ✅ 3D Digital Twin 통합
5. ⏳ AI 시뮬레이션 통합
6. ⏳ 외부 API 연동

---

**최종 업데이트**: 2025-11-24  
**작성자**: NEURALTWIN Development Team  
**버전**: 2.0
