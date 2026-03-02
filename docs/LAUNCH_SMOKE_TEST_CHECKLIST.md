# NeuralTwin Starter Tier Launch -- Smoke Test Checklist

> **Version**: 1.0 | 2026-03-02
> **Sprint**: 4.1 -- Starter Tier E2E Launch Verification
> **Owner**: PM Lead
> **Status**: Pre-Launch QA

---

## How to Use

- Run through each section in order (A -> F)
- Check off each item as you verify it
- Note any failures with the specific issue (screenshot + URL + expected vs actual)
- All items in section A-D must pass for launch approval
- Section E (payment) can be verified in Stripe test mode
- Section F (security/performance) is recommended but not blocking for MVP

---

## A. Website (apps/website)

### Landing Page
- [ ] Landing page loads successfully (< 3 seconds)
- [ ] Hero section renders with headline, subtext, CTA button
- [ ] Features section displays all feature cards
- [ ] Pricing section shows Starter / Professional / Enterprise tiers
- [ ] Interactive demo section works (auto-cycling tabs, manual tab switching)
- [ ] Footer renders with all links
- [ ] NEURALTWIN logo visible in header

### Navigation & Pages
- [ ] Blog/case study page loads (if implemented)
- [ ] Pricing page loads independently (/pricing or section scroll)
- [ ] Pricing CTA button links to Stripe Checkout (or expected target)
- [ ] All internal navigation links work (no broken links)

### i18n (Internationalization)
- [ ] Korean (ko) -- default language loads correctly
- [ ] English (en) -- language switch works, all text translates
- [ ] Japanese (ja) -- language switch works, all text translates
- [ ] Language preference persists across page navigation

### Responsive Design
- [ ] Mobile (320px width) -- layout stacks vertically, no horizontal scroll
- [ ] Tablet (768px width) -- layout adapts, all content accessible
- [ ] Desktop (1024px+ width) -- full layout renders correctly
- [ ] Interactive demo section works on mobile

---

## B. Sign-up & Onboarding (OS Dashboard)

### Authentication
- [ ] /auth page loads with NEURALTWIN branding
- [ ] "AI 기반 매장 분석 플랫폼" description visible
- [ ] Email input field present and functional
- [ ] Password input field present and functional
- [ ] Login button submits form correctly
- [ ] Google social login button present
- [ ] Kakao social login button present
- [ ] "비밀번호를 잊으셨나요?" (forgot password) link opens dialog
- [ ] Password reset dialog has email input and submit button

### Email Verification Flow
- [ ] Supabase Auth email signup sends verification email
- [ ] Email confirmation link redirects to app correctly
- [ ] Confirmed user can log in successfully

### 2-Step Onboarding (Sprint 3.10)
- [ ] New user sees onboarding dialog after first login
- [ ] Step indicator shows 2 dots (step 1 of 2)
- [ ] **Step 1**: Store type selection grid visible (Fashion, Beauty, F&B, Lifestyle, Other)
- [ ] Store type cards show sample metrics on hover/select
- [ ] Selecting a store type enables "다음" (Next) button
- [ ] **Step 2**: Store name input field visible
- [ ] Store name input validates (min length)
- [ ] "완료" (Complete) button creates store via Supabase
- [ ] On completion -> redirect to dashboard (/)

### Re-login Behavior
- [ ] Returning user (onboarding complete) goes directly to dashboard
- [ ] Onboarding dialog does NOT show for returning user
- [ ] "건너뛰기" (Skip) button dismisses onboarding permanently

---

## C. Dashboard (apps/os-dashboard)

### Insights Hub (Main Dashboard)
- [ ] Page loads at / or /insights
- [ ] Tab navigation visible with 7 tabs: 개요, 매장, 고객, 상품, 재고, 예측, AI추천
- [ ] **개요 (Overview)** tab: MetricCards render (visitors, dwell, conversion, revenue)
- [ ] **매장 (Store)** tab: Store metrics display, URL changes to ?tab=store
- [ ] **고객 (Customer)** tab: Customer analytics, URL changes to ?tab=customer
- [ ] **상품 (Product)** tab: Product analytics, URL changes to ?tab=product
- [ ] **재고 (Inventory)** tab: Inventory dashboard, URL changes to ?tab=inventory
- [ ] **예측 (Prediction)** tab: Prediction charts, URL changes to ?tab=prediction
- [ ] **AI추천 (AI Recommend)** tab: AI recommendations, URL changes to ?tab=ai-recommend

### Digital Twin Studio (/studio)
- [ ] Page loads at /studio
- [ ] 3D canvas (Three.js) renders without errors
- [ ] Layer panel visible (left side)
- [ ] Overlay controls available (heatmap, customer flow, etc.)
- [ ] Simulation panel accessible

### Time Travel (Sprint 4.9)
- [ ] Time Travel activation button/toggle present in Studio
- [ ] Timeline control bar appears at bottom when enabled
- [ ] Play/Pause button functional
- [ ] Playback speed controls (1x, 2x, 4x, 8x) work
- [ ] Skip forward/backward buttons work
- [ ] 24-hour timeline scrubber is draggable
- [ ] Activity heatmap overlay on timeline visible
- [ ] Close/disable Time Travel returns to normal mode

### ROI Measurement (/roi)
- [ ] Page loads at /roi
- [ ] ROI summary cards render
- [ ] Category performance table visible
- [ ] Strategy detail modal opens on interaction
- [ ] AI insights card visible

### Settings (/settings)
- [ ] Page loads at /settings
- [ ] Settings sections render (store info, preferences, etc.)

### Data Control Tower (/data/control-tower)
- [ ] Page loads at /data/control-tower
- [ ] Data source cards visible
- [ ] Import history widget functional
- [ ] Data quality score displayed
- [ ] Pipeline timeline visible

### AI Insight Bubble (Sprint 3.9)
- [ ] Floating AI bubble button visible (bottom-right corner)
- [ ] "AI가 할 말 있어요" tooltip text visible
- [ ] Click bubble -> panel slides in from right
- [ ] Panel header shows "NeuralMind" and "AI 인사이트 어시스턴트"
- [ ] Message input field with placeholder "메시지 입력..."
- [ ] Send button disabled when input is empty
- [ ] Send button enabled when text is entered
- [ ] Escape key closes panel
- [ ] X (close) button closes panel
- [ ] Bubble re-appears after panel closes
- [ ] aria-expanded toggles correctly (false -> true)

### PDF Report Generation (Sprint 3.11)
- [ ] Report button visible ("진단 리포트" or FileDown icon)
- [ ] Click report button -> loading state ("리포트 생성 중...")
- [ ] PDF file downloads successfully
- [ ] PDF filename format: NeuralTwin_{StoreName}_진단리포트_{YYYYMMDD}.pdf
- [ ] PDF content includes KPI summary
- [ ] PDF content includes zone analysis (if data available)
- [ ] Success state shown briefly after download

### Dark Mode
- [ ] Theme toggle button visible (Moon/Sun icon)
- [ ] Click toggle -> html element gets/loses "dark" class
- [ ] UI colors change appropriately in dark mode
- [ ] Theme preference saved to localStorage
- [ ] Theme persists after page reload

### DashboardLayout Structure
- [ ] Sidebar present with 5 menu items
- [ ] Menu labels: 데이터 컨트롤타워, 인사이트 허브, 디지털트윈 스튜디오, ROI 측정, 설정 & 관리
- [ ] User avatar/profile area visible
- [ ] Sidebar trigger button on mobile (375px)

### Legacy Route Redirects
- [ ] /overview/dashboard -> /insights
- [ ] /overview/settings -> /settings
- [ ] /simulation/digital-twin -> /studio
- [ ] /analysis/store -> /insights?tab=store
- [ ] /analysis/customer -> /insights?tab=customer

### 404 Page
- [ ] Non-existent route shows "404" text
- [ ] "Page not found" message visible
- [ ] Home link (a[href="/"]) navigates back to dashboard

---

## D. Demo Mode (Sprint 4.4)

### Scenario Selection (/demo)
- [ ] /demo route loads scenario selection screen (no auth required)
- [ ] Dark background with NEURALTWIN logo
- [ ] Title: "어떤 매장을 체험해 보시겠어요?"
- [ ] Subtitle: "업종을 선택하면 실제와 같은 데모 대시보드를 보여드려요."
- [ ] 3 scenario cards visible:
  - [ ] **패션**: 강남 플래그십 스토어 / 고객 동선 최적화
  - [ ] **뷰티**: 올리브영 성수점 / 존별 체류 분석
  - [ ] **백화점**: 현대백화점 판교점 / 층별 트래픽 분석
- [ ] Card hover effect (cyan glow, scale)
- [ ] Close button ("닫기") dismisses selector
- [ ] "약 5분 소요" text visible at bottom

### Demo Session
- [ ] Selecting Fashion -> navigates to /insights?demo=fashion
- [ ] Selecting Beauty -> navigates to /insights?demo=beauty
- [ ] Selecting Department -> navigates to /insights?demo=department
- [ ] Demo badge visible (shows "DEMO" or "데모 모드")
- [ ] Remaining time counter visible (starts from 5:00)
- [ ] Timer counts down every second

### 7-Step Guided Tour
- [ ] Tour starts automatically after scenario selection
- [ ] **Step 1**: Sidebar navigation highlighted
- [ ] **Step 2**: Metric cards highlighted
- [ ] **Step 3**: AI insight area highlighted
- [ ] **Step 4**: Digital twin studio highlighted
- [ ] **Step 5**: Time Travel timeline highlighted
- [ ] **Step 6**: Report generation highlighted
- [ ] **Step 7**: Full-screen CTA ("체험을 완료했어요!")
- [ ] Auto-advance works (8-10 seconds per step)
- [ ] Manual next/prev navigation works (arrow buttons)
- [ ] Skip tour button works -> free exploration mode
- [ ] Keyboard navigation (Arrow keys, Escape)

### Demo End
- [ ] Demo CTA bar visible after tour completion
- [ ] CTA shows pricing info ("Starter 플랜: 월 49,000원부터")
- [ ] Demo auto-ends after 5 minutes
- [ ] Session data cleared on demo end

---

## E. Payment Flow (Stripe Integration -- Sprint 3.14)

### Stripe Checkout (Test Mode)
- [ ] Starter Tier selection -> redirects to Stripe Checkout
- [ ] Professional Tier selection -> redirects to Stripe Checkout
- [ ] Stripe Checkout page loads with correct product/price
- [ ] Test card (4242 4242 4242 4242) processes successfully
- [ ] Payment completion webhook received by Supabase
- [ ] User tier updated in database after payment
- [ ] Dashboard access granted after payment
- [ ] Enterprise Tier shows "문의하기" (contact sales) instead of checkout

### Subscription Management
- [ ] Active subscription visible in settings
- [ ] Plan details correct (tier, price, billing cycle)

---

## F. Security & Performance

### CORS (Edge Functions)
- [ ] OPTIONS preflight returns correct CORS headers
- [ ] Access-Control-Allow-Origin set correctly
- [ ] Access-Control-Allow-Headers includes Authorization, Content-Type
- [ ] Run: `./scripts/smoke-test-ef.sh` -- all EFs return 200/204

### Row Level Security (RLS)
- [ ] Authenticated user can read own store data
- [ ] Authenticated user CANNOT read another user's store data
- [ ] Unauthenticated request to protected tables returns 401/403
- [ ] Service role operations (Edge Functions) bypass RLS correctly

### Performance
- [ ] Lighthouse Performance Score > 70 (Desktop)
- [ ] Lighthouse Accessibility Score > 80
- [ ] First Contentful Paint (FCP) < 2 seconds
- [ ] Largest Contentful Paint (LCP) < 4 seconds
- [ ] Total Blocking Time (TBT) < 300ms
- [ ] No console errors in production build

### Error Handling
- [ ] Network error shows user-friendly message (not raw error)
- [ ] Supabase auth token refresh works silently
- [ ] Edge Function timeout returns graceful error
- [ ] 404 page displays correctly for unknown routes

---

## Test Environment Reference

| Environment | URL | Notes |
|---|---|---|
| OS Dashboard (local) | http://localhost:5174 | `pnpm dev:os` |
| Website (local) | http://localhost:5173 | `pnpm dev:website` |
| OS Dashboard (Vercel) | TBD | Production deployment |
| Website (Vercel) | TBD | Production deployment |
| Supabase | bdrvowacecxnraaivlhr | ap-northeast-1 |
| Stripe | Test mode | Use test API keys |

## Automated Test Commands

```bash
# Run all E2E tests
cd apps/os-dashboard && npx playwright test

# Run only starter launch verification tests
cd apps/os-dashboard && npx playwright test starter-launch

# Run with UI mode (visual debugging)
cd apps/os-dashboard && npx playwright test --ui

# Run specific browser
cd apps/os-dashboard && npx playwright test --project=chromium

# Generate HTML report
cd apps/os-dashboard && npx playwright show-report
```

## Sign-off

| Role | Name | Date | Pass/Fail | Notes |
|---|---|---|---|---|
| PM Lead | | | | |
| CEO | 성신 | | | |
| QA | | | | |
