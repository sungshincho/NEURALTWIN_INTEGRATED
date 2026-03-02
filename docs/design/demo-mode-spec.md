# Demo Mode UI Design Specification

> **Version**: 1.0 | 2026-03-02
> **Sprint**: 4.10 — Demo Mode UI + Pitch Deck Layout
> **Owner**: Teammate 6 (Designer)
> **Implementers**: Teammate 3 (OS Dashboard), Teammate 4 (Website)
> **Reference**: `NeuralTwin_Product_Enhancement_Spec.md` Section 2.2 (Flow 0), Section 6.1
> **Design Tokens**: `design-system-tokens.md` v2.0

---

## 1. Demo Mode Overview

### 1.1 What is Demo Mode?

Demo Mode is a zero-signup interactive experience that lets prospective customers explore the full NeuralTwin OS Dashboard using pre-built retail scenarios. It is the primary conversion tool on the marketing website -- the bridge between "I'm curious" and "I'm signing up."

**Core Principle**: Show, don't tell. The prospect should *feel* what it's like to operate a data-driven store before committing to anything.

### 1.2 When Demo Mode Activates

```
Trigger Points:
  1. Website "체험하기" CTA button (Hero section)
  2. Website "라이브 데모 체험" CTA button (anywhere on landing)
  3. Direct URL: https://app.neuraltwin.io/demo
  4. QR code scan from pitch deck or marketing materials
  5. Sales team shared link: https://app.neuraltwin.io/demo?scenario=fashion

Activation Flow:
  [User clicks "체험하기"]
      |
      v
  [Scenario Selection Screen] (3 choices)
      |
      | User selects scenario
      v
  [OS Dashboard loads in Demo Mode]
      |
      | 5-minute guided experience
      v
  [CTA: "실제 데이터로 시작하기"]
```

### 1.3 How Demo Mode Works

- **No authentication required** -- no signup, no email, no login
- **No real data** -- all data comes from pre-built demo datasets
- **Read-only** -- users can explore but cannot modify settings, import data, or access billing
- **Time-bounded** -- 5-minute guided tour with auto-progression, then free exploration
- **Session-based** -- each visit creates a temporary session stored in `sessionStorage`
- **Analytics tracked** -- demo interactions are logged for lead scoring (anonymized)

### 1.4 Demo Mode State Management

```typescript
interface DemoModeState {
  isDemo: true;
  scenario: 'fashion' | 'beauty' | 'department';
  scenarioName: string;          // e.g., "강남 플래그십 스토어"
  tourStep: number;              // 0 = not started, 1-7 = in progress, 8 = complete
  tourActive: boolean;           // true during guided tour
  startedAt: Date;
  freeExploreStartedAt?: Date;  // set when tour completes
  interactions: DemoInteraction[];  // tracked for lead scoring
}

// Zustand store: useDemoStore
// Persisted in sessionStorage (not localStorage -- fresh each visit)
```

---

## 2. Scenario Selection Screen

### 2.1 Layout

The scenario selection screen appears immediately after the user clicks "체험하기" on the website. It uses a full-screen overlay with the same dark theme as the OS Dashboard to begin the immersion early.

```
+================================================================+
|                                                                  |
|  NeuralTwin                                            [X 닫기] |
|                                                                  |
|                                                                  |
|          어떤 매장을 체험해 보시겠어요?                          |
|          업종을 선택하면 실제와 같은 데모 대시보드를 보여드려요.  |
|                                                                  |
|                                                                  |
|  +------------------+  +------------------+  +------------------+|
|  |                  |  |                  |  |                  ||
|  |    [Fashion      |  |    [Beauty       |  |   [Department   ||
|  |     Icon 48px]   |  |     Icon 48px]   |  |     Icon 48px]  ||
|  |                  |  |                  |  |                  ||
|  |    패션          |  |    뷰티          |  |    백화점       ||
|  |                  |  |                  |  |                  ||
|  |   강남           |  |   올리브영       |  |   현대백화점    ||
|  |   플래그십 스토어 |  |   성수점         |  |   판교점        ||
|  |                  |  |                  |  |                  ||
|  |   고객 동선 최적화|  |  존별 체류 분석  |  |  층별 트래픽    ||
|  |                  |  |                  |  |                  ||
|  +------------------+  +------------------+  +------------------+|
|                                                                  |
|                                                                  |
|          약 5분 소요 -- 가이드 투어 후 자유 탐색 가능            |
|                                                                  |
+================================================================+
```

### 2.2 Scenario Card Spec

```
Unselected Card:
+------------------+
|                  |     Surface: glass-sm
|   [Icon 48x48]  |     Border: --border-subtle
|                  |     Background: transparent
|   업종명         |     Text (업종명): H3, --text-primary
|                  |     Text (매장명): Caption, --text-secondary
|   매장명         |     Text (설명): Micro, --text-tertiary
|                  |
|   분석 키워드    |     Size: 240px x 280px (desktop)
|                  |     Corner radius: --radius-md (12px)
+------------------+

Hovered Card:
+------------------+
|                  |     Surface: glass-md
|   [Icon 48x48]  |     Border: --accent-cyan-border
|                  |     Background: --accent-cyan-bg
|   업종명         |     Shadow: shadow-glow-cyan
|                  |     Transform: scale(1.02)
|   매장명         |     Transition: 150ms ease-out
|                  |
|   분석 키워드    |
|                  |
+------------------+

Clicked (navigating):
  scale(0.98) -> scale(1) spring animation (200ms)
  then fade-out entire selection screen (300ms)
  then fade-in dashboard (300ms)
```

### 2.3 Responsive Behavior

```
Desktop (xl+):
  3 cards in a row, centered
  Card size: 240px x 280px

Tablet (md-lg):
  3 cards in a row, smaller
  Card size: 200px x 260px

Mobile (< md):
  Vertical stack, full width
  Card size: 100% width x 160px (horizontal layout)
  Icon + text side by side
```

---

## 3. Demo Scenarios

### 3.1 Scenario 1: Fashion -- "강남 플래그십 스토어"

**Focus**: Customer flow optimization and conversion funnel

```
Store Profile:
  Name: 강남 플래그십 스토어
  Type: Fashion (SPA brand)
  Area: 180 pyeong (594 sqm)
  Floors: 1
  Zones: 입구, 디스플레이, 피팅룸, 계산대, VIP라운지

Demo Data Highlights:
  Daily visitors:   12,847
  Avg dwell time:   4m 12s
  Conversion rate:  3.8%
  Peak hours:       13:00-15:00, 18:00-20:00

AI Insight for Demo:
  "오후 2~4시 B존(디스플레이 구역) 체류시간이 전주 대비 -22% 하락했습니다.
   신상품 진열 변경 후 고객 동선이 바뀐 것으로 분석됩니다.
   입구에서 B존으로 유도하는 POP 사이니지 추가를 권장합니다."

3D Scene:
  - Open floor plan with mannequins, display tables, mirror walls
  - Animated customer avatars following realistic paths
  - Heatmap showing high traffic at entrance, moderate at display, low at VIP
  - Conversion funnel overlay available

Key Demo Moments:
  1. MetricCard showing 12,847 visitors with upward trend
  2. AI insight about B-zone dwell time drop
  3. 3D Studio with heatmap overlay showing the problem visually
  4. Time Travel to compare before/after display change
  5. PDF report generation
```

### 3.2 Scenario 2: Beauty -- "올리브영 성수점"

**Focus**: Zone dwell time analysis and tester zone effectiveness

```
Store Profile:
  Name: 올리브영 성수점
  Type: Beauty (H&B store)
  Area: 120 pyeong (396 sqm)
  Floors: 1
  Zones: 스킨케어, 메이크업, 향수, 테스터존, 계산대

Demo Data Highlights:
  Daily visitors:   8,420
  Avg dwell time:   3m 45s
  Conversion rate:  5.2%
  Peak hours:       12:00-14:00, 17:00-19:00

AI Insight for Demo:
  "테스터존 체류시간이 평균 6분 32초로 전체 매장 대비 가장 높습니다.
   테스터존 방문 고객의 구매 전환율은 12.8%로, 미방문 고객(2.1%) 대비
   6배 높습니다. 테스터존 접근성을 높이는 레이아웃 변경을 추천합니다."

3D Scene:
  - Shelving units, tester stations, checkout counter
  - Animated avatars with longer dwell at tester zone
  - Category-colored zones (skincare=blue, makeup=pink, fragrance=purple)
  - Dwell time overlay showing tester zone hotspot

Key Demo Moments:
  1. Zone analysis showing tester zone effectiveness
  2. AI comparing tester vs non-tester customer conversion
  3. 3D view with category-based heatmap
  4. Before/after simulation of tester zone relocation
  5. ROI calculation for the proposed change
```

### 3.3 Scenario 3: Department -- "현대백화점 판교점"

**Focus**: Multi-floor traffic analysis and tenant performance

```
Store Profile:
  Name: 현대백화점 판교점
  Type: Department store
  Area: 2,400 pyeong (7,920 sqm)
  Floors: 5 (B1-4F)
  Zones: B1 식품관, 1F 화장품/잡화, 2F 여성패션, 3F 남성패션, 4F 리빙

Demo Data Highlights:
  Daily visitors:   24,510
  Avg dwell time:   8m 45s (floor-weighted)
  Conversion rate:  6.1% (overall)
  Peak hours:       11:00-13:00, 15:00-18:00

AI Insight for Demo:
  "3F 남성패션 층 방문객이 전체의 8%로 가장 낮습니다.
   에스컬레이터 동선 분석 결과, 2F에서 3F로의 이동률이 23%에 불과합니다.
   2F-3F 연결 구역에 시즌 프로모션 안내판 설치를 권장합니다."

3D Scene:
  - Multi-floor building cutaway view
  - Floor-by-floor traffic visualization
  - Escalator flow paths with directional arrows
  - Tenant-level performance heatmap

Key Demo Moments:
  1. Multi-floor overview with floor-level KPIs
  2. Floor-by-floor traffic flow analysis
  3. AI identifying 3F as underperforming
  4. Escalator flow simulation
  5. Cross-floor comparison dashboard
```

---

## 4. Guided Tour Overlay Spec

### 4.1 Tour Overview

The guided tour walks the user through 7 key features of the OS Dashboard. It starts automatically when the demo dashboard loads and can be skipped at any time.

```
Tour Duration: ~5 minutes total
Auto-advance: 8 seconds per step (if user does not click "다음")
Steps: 7
Skip: Available at all times
Resume: If user interacts with dashboard, tour pauses; resumes on "다음" click
```

### 4.2 Tour Overlay Component Spec

```
+================================================================+
|                                                                  |
|  Dashboard content (dimmed to 40% opacity)                       |
|                                                                  |
|        +-------- Spotlight Ring --------+                        |
|        |                                |                        |
|        |   [Target Element]             |  <-- Full brightness   |
|        |    (not dimmed)                |      + cyan glow ring  |
|        |                                |                        |
|        +--------------------------------+                        |
|                     |                                            |
|                     v                                            |
|        +-----------------------------------+                     |
|        |                                   |                     |
|        |  Step 2 / 7                       |  <-- Step indicator |
|        |  ================================ |                     |
|        |                                   |                     |
|        |  핵심 지표 카드                    |  <-- Title (H3)    |
|        |                                   |                     |
|        |  이 카드는 방문객 수, 체류시간,   |  <-- Description    |
|        |  전환율 등 매장의 핵심 KPI를       |      (Body)        |
|        |  실시간으로 보여줍니다.            |                     |
|        |  카드를 클릭하면 상세 분석을       |                     |
|        |  확인할 수 있어요.                 |                     |
|        |                                   |                     |
|        |  [건너뛰기]         [다음 (3/7) ->]|                     |
|        |                                   |                     |
|        +-----------------------------------+                     |
|                                                                  |
|  +-------+                                                       |
|  | 1 / 7 |  <-- Progress dots (bottom center)                   |
|  | o O o o o o o |                                               |
|  +-------+                                                       |
|                                                                  |
+================================================================+
```

### 4.3 Overlay Rendering Spec

```
Dimming Layer:
  Position: fixed, inset: 0
  Background: rgba(10, 14, 26, 0.60)  (--bg-deep at 60% opacity)
  Z-index: z-70 (above modals)
  Pointer events: none (except on tooltip and buttons)

Spotlight Ring:
  Shape: rounded rectangle matching target element's border-radius + 8px padding
  Border: 2px solid --accent-cyan
  Box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.20),
              0 0 30px rgba(0, 212, 255, 0.15)
  Animation: pulse-ring (subtle scale 1.0 -> 1.01 -> 1.0, 2s infinite)
  The area inside the spotlight is NOT dimmed (use CSS clip-path or SVG mask)

Tooltip Box:
  Surface: glass-lg
  Background: --bg-surface-2 (#1C2333)
  Border: 1px solid --accent-cyan-border
  Border-radius: --radius-md (12px)
  Shadow: --shadow-elevation-md
  Width: 360px (desktop), 100% - 32px (mobile)
  Padding: 24px
  Z-index: z-71

Tooltip Arrow:
  Direction: points toward the spotlight target
  Style: 8px CSS triangle, same color as tooltip background
  Position: auto-calculated based on target element position

Step Indicator:
  Format: "Step N / 7"
  Style: Micro, --text-tertiary
  Position: top of tooltip

Title:
  Style: H3, --text-primary
  Margin-bottom: 8px

Description:
  Style: Body, --text-secondary
  Margin-bottom: 16px

Progress Dots:
  Position: fixed, bottom: 80px, center
  Dot size: 8px
  Active dot: --accent-cyan, 10px
  Inactive dot: --text-quaternary, 8px
  Spacing: 12px
```

### 4.4 Tooltip Positioning Rules

```
Positioning Priority (relative to target element):
  1. Bottom (tooltip appears below target)
  2. Top (if target is in lower half of screen)
  3. Right (if target is a sidebar item)
  4. Left (if target is on the right edge)

Spacing:
  Gap between spotlight ring and tooltip: 12px
  Tooltip must never overflow viewport -- auto-reposition if necessary

Mobile Override:
  Tooltip always appears at bottom of screen (fixed, bottom: 0)
  Full width with 16px horizontal padding
  Spotlight ring remains around target
  Content scrolls to bring target into upper half of viewport
```

### 4.5 Tour Steps

#### Step 1: Sidebar Navigation

```
Target: Sidebar navigation panel
Spotlight: Entire sidebar (collapsed state, 64px width)

Title: 사이드바 내비게이션
Description:
  "좌측 사이드바에서 각 기능에 접근할 수 있어요.
   홈, 실시간 현황, 분석, 3D 스튜디오, AI, ROI 추적 등
   매장 운영에 필요한 모든 도구가 여기 있습니다."

Auto-advance: 8s
```

#### Step 2: MetricCard Overview

```
Target: Top row of MetricCards (3 cards)
Spotlight: Entire MetricCard row

Title: 핵심 지표 카드
Description:
  "방문객, 체류시간, 전환율 등 매장의 핵심 KPI를
   한눈에 확인하세요. 전일 대비 변화율과 목표 달성률,
   7일 트렌드까지 바로 볼 수 있어요.
   카드를 클릭하면 상세 분석으로 이동합니다."

Auto-advance: 8s
```

#### Step 3: AI Insight

```
Target: AIInsightBubble (bottom-right)
Spotlight: AIInsightBubble collapsed state

Title: AI 인사이트
Description:
  "NeuralMind AI가 이상 징후를 감지하면
   여기에 실시간 알림이 나타나요.
   '왜 이런 일이 생겼는지'부터 '어떻게 해야 하는지'까지
   4단계로 분석 결과를 제공합니다."

Action: Bubble automatically expands to show a sample insight
Auto-advance: 10s (longer because bubble animation)
```

#### Step 4: 3D Studio

```
Target: 3D Studio view (navigate to /studio route)
Spotlight: Full 3D canvas area

Title: 3D 디지털 트윈 스튜디오
Description:
  "매장을 3D로 재현한 디지털 트윈입니다.
   고객 동선을 시각화하고, 히트맵을 오버레이하고,
   레이아웃 변경을 시뮬레이션할 수 있어요.
   실제 매장을 바꾸기 전에 여기서 먼저 테스트하세요."

Action: Auto-enable heatmap overlay on 3D scene
Auto-advance: 10s
```

#### Step 5: Time Travel

```
Target: Timeline control bar (bottom of 3D Studio)
Spotlight: Timeline scrubber + playback controls

Title: Time Travel -- 과거 데이터 재생
Description:
  "타임라인을 드래그해서 과거의 매장 상황을
   3D로 재생할 수 있어요. 진열 변경 전후 비교,
   피크 시간대 분석 등 시간 기반 분석이 가능합니다.
   재생 속도는 최대 10배속까지 지원해요."

Action: Auto-play a 5-second clip at 5x speed
Auto-advance: 10s
```

#### Step 6: PDF Report

```
Target: Report generation button (navigate to /reports or show modal)
Spotlight: Report generation panel

Title: 자동 리포트 생성
Description:
  "AI가 매장 데이터를 분석해 PDF 리포트를
   자동으로 생성합니다. 일간/주간/월간 리포트를
   이메일로 받아보거나 즉시 다운로드할 수 있어요.
   본사 보고용 데이터도 한 번에 정리됩니다."

Auto-advance: 8s
```

#### Step 7: CTA (Final Step)

```
Target: None (full-screen overlay)
Spotlight: None

+================================================================+
|                                                                  |
|  Dashboard (dimmed to 30%)                                       |
|                                                                  |
|           +----------------------------------------+             |
|           |                                        |             |
|           |   체험을 완료했어요!                    |             |
|           |                                        |             |
|           |   지금 보신 모든 기능을                 |             |
|           |   실제 매장 데이터로 사용해 보세요.     |             |
|           |                                        |             |
|           |   Starter 플랜: 월 ₩49,000부터         |             |
|           |   14일 무료 체험 포함                   |             |
|           |                                        |             |
|           |   +----------------------------------+ |             |
|           |   |  실제 데이터로 시작하기           | |             |
|           |   |  (14일 무료 체험)                 | |             |
|           |   +----------------------------------+ |             |
|           |                                        |             |
|           |   [더 둘러보기]          [가격 보기]   |             |
|           |                                        |             |
|           +----------------------------------------+             |
|                                                                  |
+================================================================+

Primary CTA Button:
  Style: Full width (within tooltip), h-12
  Background: --accent-cyan
  Text: --text-inverse (#111827), font-weight 600
  Border-radius: --radius-sm (8px)
  Shadow: shadow-glow-cyan-intense
  Animation: subtle pulse (glow intensity oscillation, 2s infinite)

Secondary Actions:
  "더 둘러보기": ghost button, closes overlay, enters free explore mode
  "가격 보기": outline button, opens pricing page in new tab
```

### 4.6 Tour Animation Specs

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Dimming layer appear | opacity 0 -> 0.6 | 300ms | ease-out |
| Spotlight ring appear | scale(0.95) + opacity 0 -> scale(1) + opacity 1 | 300ms | ease-out |
| Spotlight move to next target | morphing clip-path + position tween | 400ms | ease-in-out |
| Tooltip appear | fade-in + slide (12px from arrow direction) | 250ms | ease-out |
| Tooltip disappear | fade-out + slide reverse | 200ms | ease-in |
| Progress dot activate | scale(1) -> scale(1.25) -> scale(1) + color change | 200ms | spring |
| Auto-advance countdown | circular progress around "다음" button border | 8000ms | linear |
| Step transition (combined) | old tooltip out (200ms) -> spotlight morph (400ms) -> new tooltip in (250ms) | 850ms total | sequential |

### 4.7 Auto-Advance Behavior

```
Each step has a countdown timer (default 8 seconds):
  - Visual indicator: thin progress bar along the bottom of the tooltip
  - Color: --accent-cyan at 10% opacity, filling left to right
  - On complete: auto-advance to next step

Pause conditions:
  - User hovers over tooltip (pause countdown)
  - User clicks on dashboard content within spotlight (pause tour)
  - User scrolls the page (pause for 3 seconds, then resume)

Resume:
  - After user interaction pause: show a floating "투어 계속하기" button
  - Position: fixed, bottom-right, above AIInsightBubble
  - Style: glass-md, --accent-cyan border, Micro text

Skip behavior:
  - "건너뛰기" button skips to free explore mode (tour complete)
  - Confirmation: none (immediate skip)
  - Analytics event: demo_tour_skipped { step: N }
```

### 4.8 Keyboard Accessibility

```
Tab:     Focus cycles between "건너뛰기" and "다음" buttons
Enter:   Activates focused button
Escape:  Skips tour entirely (same as "건너뛰기")
Left/Right Arrow: Navigate between steps (back/forward)
```

---

## 5. Demo Mode UI Indicators

### 5.1 Floating "DEMO" Badge

```
Position: fixed, top: 16px, left: 16px (or below sidebar header if sidebar visible)
Z-index: z-60 (above content, below tour overlay)

+------------------+
|  DEMO            |
|  데모 모드       |
+------------------+

Style:
  Background: --accent-amber (#F59E0B)
  Text: --text-inverse (#111827)
  Font: "DEMO" = Micro (12px), weight 700, letter-spacing 0.05em
  Font: "데모 모드" = Micro (12px), weight 500
  Padding: 6px 12px
  Border-radius: --radius-sm (8px)
  Shadow: --shadow-elevation-sm
  Opacity: 0.9

Interaction:
  Click -> expand to show:
  +------------------------------------+
  |  DEMO                              |
  |  데모 모드                         |
  |                                    |
  |  현재 강남 플래그십 스토어 데모를  |
  |  체험하고 있습니다.                |
  |                                    |
  |  [실제 데이터로 시작하기 ->]       |
  |  [다른 시나리오 보기]              |
  +------------------------------------+

Expanded style:
  glass-lg, width: 280px, max-height: auto
  Animation: scale-in from top-left corner, 200ms ease-out
```

### 5.2 Bottom CTA Bar

A persistent bottom bar that encourages signup. Always visible during free exploration.

```
+================================================================+
|                                                                  |
|  Dashboard content                                               |
|                                                                  |
|                                                                  |
+================================================================+
|                                                                  |
|  데모 모드 -- 실제 데이터가 아닙니다       [실제 데이터로 시작하기]|
|                                                                  |
+================================================================+

Layout:
  Position: fixed, bottom: 0, left: 0 (or left: sidebar-width), right: 0
  Height: 56px
  Z-index: z-45 (above content, below AIInsightBubble at z-50)
  Display: flex, align-items: center, justify-content: space-between

Left Side:
  Text: "데모 모드 -- 실제 데이터가 아닙니다"
  Style: Caption (14px), --text-tertiary
  Icon: Info circle (16px), --text-quaternary, margin-right: 8px

Right Side:
  Button: "실제 데이터로 시작하기"
  Style: Primary button
    Background: --accent-cyan
    Text: --text-inverse, font-weight 600
    Padding: 8px 24px
    Border-radius: --radius-sm
    Shadow: shadow-glow-cyan

Bar Style:
  Background: --bg-surface (#111827)
  Border-top: 1px solid --border-subtle (#2D3748)
  Backdrop-filter: blur(8px)

Responsive:
  Mobile: stack vertically
    Line 1: text (centered)
    Line 2: button (full width, centered)
    Height: 88px
```

### 5.3 Demo Data Watermark

A subtle watermark overlaid on charts and data tables to indicate demo data.

```
Watermark Text: "DEMO DATA"
Style:
  Font: font-data (JetBrains Mono), 48px, weight 700
  Color: rgba(255, 255, 255, 0.03)  (barely visible)
  Transform: rotate(-15deg)
  Position: absolute, centered in each chart/table container
  Pointer-events: none
  Z-index: 1 (within the chart container, behind interactive elements)

Do NOT apply watermark to:
  - 3D Studio view (would interfere with rendering)
  - AIInsightBubble (too small)
  - Sidebar navigation
```

### 5.4 Disabled Features in Demo Mode

Features that are inaccessible in demo mode should be visually muted with a tooltip explaining why.

```
Disabled Features:
  - Settings (all subpages)
  - Data Import / Export (real data operations)
  - Billing / Subscription
  - Team management / Invite
  - Sensor connection
  - Store name editing
  - Notification preferences

Disabled UI Treatment:
  Opacity: 0.4
  Cursor: not-allowed
  On click -> tooltip:
    +------------------------------------+
    |  이 기능은 데모에서 사용할 수       |
    |  없습니다.                          |
    |                                     |
    |  [무료 체험 시작하기 ->]            |
    +------------------------------------+

  Tooltip style:
    glass-md, --accent-amber-border
    Width: 240px
    Show on click (not hover, to avoid accidental triggers)
    Auto-dismiss after 3 seconds

Sidebar disabled items:
  Icon: same but opacity 0.4
  Label: same but --text-quaternary
  Badge: lock icon (12px) to the right of label
```

### 5.5 Demo Mode Banner (Top)

An optional top banner for additional context. Shown during free exploration (not during guided tour).

```
+================================================================+
|  [i]  지금 보시는 데이터는 데모용 시뮬레이션 데이터입니다.      |
|       실제 매장 데이터로 이 화면을 보시려면 →                    |
|       [14일 무료 체험 시작하기]                           [X]   |
+================================================================+

Style:
  Position: sticky, top: 0
  Height: 40px
  Background: --accent-amber-bg (rgba(245, 158, 11, 0.08))
  Border-bottom: 1px solid --accent-amber-border
  Z-index: z-40

Text:
  Style: Caption (14px), --text-secondary
  Icon: Info (16px), --accent-amber

CTA Link:
  Style: Caption, --accent-cyan, underline on hover
  Click -> opens signup page in new tab

Dismiss:
  [X] button sets sessionStorage flag, banner does not reappear in this session
```

---

## 6. Demo Data Visualization Spec

### 6.1 Data Realism Rules

All demo data must look realistic and professional. The goal is for the prospect to imagine this is *their* store data.

```
General Rules:
  1. Numbers use Korean locale formatting (12,847 not 12847)
  2. Percentages show one decimal place (3.8% not 4%)
  3. Time durations use minutes:seconds format (4:12 not 252s)
  4. Trends show believable patterns (weekday dip, weekend peak)
  5. Negative deltas exist (not everything is positive -- realism)
  6. All timestamps are relative to "today" (auto-adjusted)
  7. Currency uses KRW formatting with won sign (₩1,200,000)

Data Labeling:
  - MetricCard values: display normally (no "demo" label on values)
  - Charts: subtle watermark (Section 5.3)
  - Tables: "데모 데이터" label in table caption
  - 3D Scene: no special labeling (immersive experience)
  - AI responses: prefix with "[데모]" in very light text

Never:
  - Show 0 values (always have some data)
  - Show perfectly round numbers (12,847 not 13,000)
  - Show impossibly perfect trends (add natural variance)
  - Mix real and demo data (everything is demo in demo mode)
```

### 6.2 Demo MetricCard Data

```
Fashion Scenario:
  +--------+--------+--------+--------+
  |Visitors| Dwell  |Convert |Revenue |
  | 12,847 | 4:12   | 3.8%   |₩4.2M  |
  | +8.3%  | +12%   | -0.2%p | +6.1%  |
  +--------+--------+--------+--------+

Beauty Scenario:
  +--------+--------+--------+--------+
  |Visitors| Dwell  |Convert |Revenue |
  | 8,420  | 3:45   | 5.2%   |₩2.8M  |
  | +3.1%  | -5%    | +0.4%p | +4.7%  |
  +--------+--------+--------+--------+

Department Scenario:
  +--------+--------+--------+--------+
  |Visitors| Dwell  |Convert |Revenue |
  | 24,510 | 8:45   | 6.1%   |₩18.7M |
  | -2.1%  | +3%    | +0.1%p | +1.2%  |
  +--------+--------+--------+--------+

Goal progress for all:
  Visitors: 78% of daily goal
  Dwell: 85% of target
  Conversion: 92% of target

Sparkline data (7 days, normalized):
  Fashion:    [72, 68, 85, 91, 88, 95, 100]
  Beauty:     [80, 75, 82, 78, 90, 85, 84]
  Department: [95, 88, 92, 100, 97, 85, 90]
```

### 6.3 3D Scene Demo Spec

```
Avatar Animation:
  - 15-25 avatars visible at any time (density depends on scenario)
  - Avatars follow pre-defined paths with slight randomization
  - Walk speed: 0.8-1.2 m/s (natural walking pace)
  - Dwell behavior: avatars stop at display areas for 5-30 seconds
  - Color coding by dwell time (blue -> green -> yellow -> orange)
  - Smooth trail particles behind each avatar (recent 10-second path)

Avatar Spawn/Despawn:
  - New avatars enter from entrance every 3-8 seconds
  - Avatars despawn at exit after 30-120 seconds in scene
  - Keep 15-25 avatars for performance

Heatmap Overlay (Demo):
  - Pre-computed heatmap texture (not real-time calculated)
  - Color gradient: blue (low) -> green -> yellow -> red (high)
  - Animated: subtle intensity pulsing (opacity 0.3-0.5, 4s cycle)
  - Resolution: 50x50 grid minimum for smooth appearance

Lighting:
  - Use standard scene lighting from design-system-tokens.md
  - Warm overhead fluorescent (RectAreaLight)
  - Subtle ambient light (AmbientLight 0.3)
  - Contact shadows enabled

Camera:
  - Default: 45-degree overview angle
  - Auto-orbit: slow rotation (1 degree per second)
  - User can override with mouse/touch controls
  - Smooth tween on tour step navigation (600ms ease-in-out)
```

### 6.4 Chart Data Spec

```
Hourly Traffic Chart (24h):
  Fashion:    [0,0,0,0,0,0,0,120,340,520,680,780,
               920,1050,980,840,720,890,1020,950,680,420,180,60]
  Beauty:     [0,0,0,0,0,0,0,80,250,380,520,680,
               740,620,580,520,640,780,720,580,380,220,100,30]
  Department: [0,0,0,0,0,0,0,0,180,520,880,1200,
               1450,1380,1200,1520,1680,1450,1100,720,380,150,40,0]

Weekly Trend (7 days):
  Format: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  Fashion:    [10200, 9800, 11500, 12100, 11800, 14200, 12847]
  Beauty:     [6800, 6500, 7200, 7800, 7500, 9100, 8420]
  Department: [18500, 17200, 20100, 22400, 21800, 28500, 24510]

Zone Dwell Time Distribution:
  Fashion: {
    entrance: "0:45", display: "2:30", fitting: "5:20",
    checkout: "1:15", vip: "8:40"
  }
  Beauty: {
    skincare: "2:10", makeup: "1:45", fragrance: "3:20",
    tester: "6:32", checkout: "0:55"
  }
  Department: {
    b1_food: "12:20", f1_cosmetics: "6:45", f2_women: "8:30",
    f3_men: "5:10", f4_living: "7:40"
  }

Chart Style:
  Line charts: 2px stroke, accent-cyan for primary, accent-purple for secondary
  Bar charts: rounded-top corners (4px), accent-cyan fill at 80% opacity
  Area charts: linear gradient fill from accent-cyan-bg (top) to transparent (bottom)
  Grid lines: --border-subtle at 30% opacity
  Axis labels: Micro (12px), --text-quaternary
  Data labels: Mono (14px), --text-primary
```

---

## 7. Demo Mode Analytics & Lead Scoring

### 7.1 Tracked Interactions

```
Every interaction in demo mode is tracked for lead scoring:

Events:
  demo_started          { scenario, timestamp, referrer }
  demo_tour_step        { step: 1-7, duration_on_step }
  demo_tour_skipped     { step: N (which step they skipped at) }
  demo_tour_completed   { total_duration }
  demo_feature_clicked  { feature: string, count }
  demo_ai_interacted    { question_count, insight_clicked }
  demo_3d_interacted    { overlay_toggled, zone_clicked, time_travel_used }
  demo_cta_clicked      { cta_type: 'signup' | 'pricing' | 'contact' }
  demo_session_ended    { total_duration, pages_visited, features_used }
```

### 7.2 Lead Score Calculation

```
Lead Score (0-100):

  Tour completion:
    Completed all 7 steps:        +20
    Skipped at step 5+:           +15
    Skipped at step 3-4:          +10
    Skipped at step 1-2:          +5

  Feature engagement:
    Clicked MetricCard (drill):   +5 (max 15)
    Used AI insight panel:        +10
    Asked AI a question:          +15
    Used 3D Studio:               +10
    Used Time Travel:             +10
    Toggled heatmap overlay:      +5

  Session duration:
    > 5 minutes:                  +10
    > 10 minutes:                 +15
    > 15 minutes:                 +20

  CTA interaction:
    Clicked "실제 데이터로 시작하기": +20
    Clicked "가격 보기":           +10

  Score -> Lead Quality:
    0-20:   Cold (browsing)
    21-50:  Warm (interested)
    51-80:  Hot (evaluating)
    81-100: Very Hot (ready to buy)
```

---

## 8. Demo-to-Signup Transition

### 8.1 Transition Flow

```
[Demo Mode CTA Clicked]
    |
    | "실제 데이터로 시작하기" or "14일 무료 체험 시작하기"
    |
    v
+===================================+
||                                   ||
||  NeuralTwin에 오신 것을 환영해요  ||
||                                   ||
||  방금 체험하신 모든 기능을         ||
||  실제 매장에서 사용하세요.        ||
||                                   ||
||  이메일: [_________________]      ||
||  비밀번호: [_________________]    ||
||                                   ||
||  [14일 무료 체험 시작 ->]         ||
||                                   ||
||  이미 계정이 있으신가요? 로그인   ||
||                                   ||
+===================================+
    |
    | Signup successful
    |
    v
[OS Dashboard loads with onboarding]
    |
    | Pre-fill store type from demo scenario:
    |   fashion demo -> fashion type pre-selected
    |   beauty demo -> beauty type pre-selected
    |   department -> "other" type (no exact match)
    |
    v
[Onboarding Step 1: store type pre-selected]
[Onboarding Step 2: store name input]
[Dashboard with sample data]

Transition Animation:
  Demo dashboard -> fade out (300ms)
  Signup form -> scale-in from center (300ms)
  Post-signup -> dashboard fade-in with confetti (500ms)
```

### 8.2 Context Preservation

```
Demo session data preserved during transition:
  - Selected scenario (for pre-filling onboarding)
  - Lead score (passed to CRM / analytics)
  - Time spent in demo (for personalization)
  - Features explored (for onboarding customization)

If user explored AI heavily:
  -> Onboarding tip focuses on AI features
  -> AI welcome message: "데모에서 좋은 질문 하셨네요! 실제 데이터로 더 정확한 답을 드릴게요."

If user explored 3D heavily:
  -> Onboarding tip focuses on 3D Studio
  -> Quick action: "3D 스튜디오로 바로 가기"
```

---

## 9. Responsive Design

### 9.1 Breakpoint Behavior

```
Desktop (xl+ / 1280px+):
  Full demo experience
  3 scenario cards side by side
  Tour tooltips positioned contextually
  Bottom CTA bar: single row

Tablet (md-lg / 768-1279px):
  Full demo experience (slightly compressed)
  3 scenario cards side by side (smaller)
  Tour tooltips: bottom sheet style
  Bottom CTA bar: single row

Mobile (< 768px):
  Simplified demo experience
  Scenario cards: vertical stack
  Tour: bottom sheet tooltips (full width)
  3D Studio: simplified (fewer avatars, lower detail)
  Bottom CTA bar: two rows (text + button)
  DEMO badge: smaller, top-right corner
  No watermark on charts (too small)
```

### 9.2 Mobile-Specific Adaptations

```
3D Scene on Mobile:
  - Reduce avatar count: 8-12 (from 15-25)
  - Disable contact shadows (performance)
  - Lower DPR: [1, 1.5] instead of [1, 2]
  - Simplified heatmap (lower resolution grid)
  - Touch controls: pinch-to-zoom, drag-to-rotate

Tour on Mobile:
  - Bottom sheet style (slides up from bottom)
  - Full width, max-height: 50vh
  - Swipe left/right to navigate steps
  - Swipe down to minimize (pause tour)
  - "건너뛰기" as text link (not button)
```

---

## 10. Implementation Notes

### 10.1 For Teammate 3 (OS Dashboard)

```
Demo Mode Detection:
  - URL param: ?demo=true&scenario=fashion
  - useDemoStore Zustand store manages all demo state
  - Route guard: if demo mode, intercept settings/billing routes -> disabled tooltip

Data Layer:
  - Create /src/data/demo/ directory with JSON files per scenario
  - Import statically (no API calls in demo mode)
  - demo-fashion.json, demo-beauty.json, demo-department.json
  - Each file contains: metrics, charts, zones, ai_insights, 3d_config

Tour Component:
  - <DemoTour /> component rendered at root layout level
  - Uses Radix Dialog (or custom portal) for overlay
  - useRef to get target element positions for spotlight
  - ResizeObserver for responsive repositioning
  - requestAnimationFrame for smooth spotlight morphing

Performance:
  - Lazy load 3D scene (React.lazy + Suspense)
  - Preload demo data on scenario selection (before dashboard mounts)
  - Use Intersection Observer for chart animations (render when visible)
```

### 10.2 For Teammate 4 (Website)

```
CTA Integration:
  - "체험하기" button links to: /demo (same-origin if deployed together)
    or https://app.neuraltwin.io/demo?scenario=fashion (cross-origin)
  - Pass UTM params for analytics: ?utm_source=website&utm_content=hero_cta
  - "가격 보기" from demo links to: /pricing

Signup Form (post-demo):
  - Embed signup form within the OS Dashboard app (not redirect to website)
  - Or use a shared signup component from @neuraltwin/ui
  - Pass demo context via URL params or sessionStorage
```

### 10.3 For Teammate 2 (Backend)

```
Demo Analytics:
  - Create demo_analytics Edge Function to receive interaction events
  - Store in demo_sessions table:
    id, scenario, lead_score, events (JSONB), duration,
    cta_clicked, created_at, ip_hash (anonymized)
  - No authentication required for demo analytics endpoint
  - Rate limit: 100 events per session, 1 session per IP per hour

Lead Scoring:
  - Calculate lead_score on session end
  - If score > 50: create lead record in leads table
  - If score > 80: trigger notification to sales team (Slack webhook)
```

---

## 11. Accessibility (A11y)

```
Tour Overlay:
  - Focus trap within tooltip during tour steps
  - aria-live="polite" on step change
  - Screen reader: "데모 가이드 투어 단계 2/7: 핵심 지표 카드"
  - High contrast mode: spotlight ring uses 4px solid border instead of glow

DEMO Badge:
  - role="status"
  - aria-label="현재 데모 모드입니다"

Bottom CTA Bar:
  - role="banner"
  - Landmark navigation: accessible via screen reader landmarks

Disabled Features:
  - aria-disabled="true"
  - Tooltip content accessible via aria-describedby

Keyboard Navigation:
  - All demo features fully keyboard navigable
  - Tab order: sidebar -> content -> CTA bar -> DEMO badge
  - Escape key: close any open overlay/tooltip
  - Enter/Space: activate buttons and interactive elements
```

---

*NeuralTwin Demo Mode UI Spec v1.0 | Sprint 4.10 | 2026-03-02 | T6 Designer*
