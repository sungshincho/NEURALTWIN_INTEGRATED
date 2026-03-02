# Case Study Page Design Specification

> **Version**: 1.0 | 2026-03-02
> **Sprint**: 4.10 — Demo Mode UI + Pitch Deck Layout
> **Owner**: Teammate 6 (Designer)
> **Implementer**: Teammate 4 (Website)
> **Reference**: `design-system-tokens.md` v2.0, `NeuralTwin_Product_Enhancement_Spec.md` Section 6.1

---

## 1. Page Overview

The Case Study page is a marketing page on the NeuralTwin website (`apps/website/`) that showcases real or anonymized customer success stories. Each case study follows a **Problem -> Solution -> Results** narrative structure with quantitative evidence.

### URL Structure

```
/case-studies                    -> Case study listing page
/case-studies/gangnam-flagship   -> Individual case study page
/case-studies/olive-young-seongsu
/case-studies/hyundai-pangyo
```

### Target Audience

- Retail store managers evaluating NeuralTwin
- Corporate HQ operations teams
- Franchise owners considering multi-store deployment

### Design Language

The case study page uses the **website light mode** variant of the NeuralTwin design system (see `design-system-tokens.md` Section 5.6). The page may include embedded dark-mode dashboard screenshots for product context.

---

## 2. Page Layout (Individual Case Study)

### Full Page Structure

```
+================================================================+
|  [GLOBAL NAV BAR]                                                |
+================================================================+
|                                                                  |
|  SECTION 1: HERO                                                 |
|  +------------------------------------------------------------+ |
|  |                                                              | |
|  |  [STORE PHOTO AREA — full width, 480px height]              | |
|  |  Gradient overlay: linear-gradient(transparent 40%,          | |
|  |                    rgba(15,23,42,0.85) 100%)                 | |
|  |                                                              | |
|  |  +------------------------------------------------------+   | |
|  |  |  Industry badge:  패션                               |   | |
|  |  |                                                       |   | |
|  |  |  Title:                                               |   | |
|  |  |  "강남 플래그십 스토어:                               |   | |
|  |  |   고객 동선 최적화로 전환율 +2.3%p 달성"             |   | |
|  |  |                                                       |   | |
|  |  |  Key Metric (hero stat):                              |   | |
|  |  |  +12%  월 매출 증가                                   |   | |
|  |  |                                                       |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                              | |
|  +------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 2: OVERVIEW STATS (sticky-ish summary bar)             |
|  +------------------------------------------------------------+ |
|  |  +----------+  +----------+  +----------+  +----------+    | |
|  |  | +2.3%p   |  | +12%     |  | -8%      |  | 3개월    |    | |
|  |  | 전환율   |  | 매출     |  | 인건비   |  | 도입기간 |    | |
|  |  +----------+  +----------+  +----------+  +----------+    | |
|  +------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 3: PROBLEM                                              |
|  "도입 전 과제"                                                  |
|  [Problem description text + pain point cards]                   |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 4: SOLUTION                                             |
|  "NeuralTwin 도입"                                               |
|  [Solution description + implementation timeline]                |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 5: RESULTS — BEFORE/AFTER                               |
|  "도입 효과"                                                     |
|  [Before/After comparison charts]                                |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 6: QUOTE / TESTIMONIAL                                  |
|  [Customer quote with photo]                                     |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 7: RELATED CASE STUDIES CAROUSEL                        |
|  [3 cards of other case studies]                                 |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 8: CTA                                                  |
|  "우리 매장에도 적용하기"                                        |
|  [CTA buttons]                                                   |
|                                                                  |
+================================================================+
|  [GLOBAL FOOTER]                                                 |
+================================================================+
```

---

## 3. Section Specifications

### 3.1 Hero Section

```
+================================================================+
|                                                                  |
|  [STORE PHOTO — full bleed, 480px height on desktop]            |
|                                                                  |
|  Photo requirements:                                             |
|    - Interior shot of the retail store (or stock photo)         |
|    - Minimum resolution: 1920 x 960px                           |
|    - Aspect ratio: 2:1 (cropped to fit)                         |
|    - Warm, inviting lighting preferred                          |
|    - If no real photo: use a subtle 3D render of the store      |
|                                                                  |
|  Gradient overlay (bottom 60%):                                  |
|    background: linear-gradient(                                  |
|      to bottom,                                                  |
|      transparent 0%,                                             |
|      rgba(15, 23, 42, 0.4) 40%,                                |
|      rgba(15, 23, 42, 0.85) 100%                                |
|    );                                                            |
|                                                                  |
|  Content overlay (bottom-left, within safe area):                |
|                                                                  |
|  +------------------------------------------------------+       |
|  |                                                       |       |
|  |  [패션]                                              |       |
|  |  ^^^^^^                                               |       |
|  |  Industry badge:                                      |       |
|  |    Background: --accent-cyan at 15% opacity           |       |
|  |    Text: --accent-cyan, Micro (12px), weight 600     |       |
|  |    Padding: 4px 12px                                  |       |
|  |    Border-radius: --radius-full                       |       |
|  |    Border: 1px solid --accent-cyan at 30% opacity     |       |
|  |                                                       |       |
|  |  "강남 플래그십 스토어:                               |       |
|  |   고객 동선 최적화로 전환율 +2.3%p 달성"             |       |
|  |  Title: Display-xl (48px on desktop, 28px mobile)     |       |
|  |         --text-primary (#F9FAFB, white for overlay)   |       |
|  |         max-width: 720px                              |       |
|  |                                                       |       |
|  |  +12%  월 매출 증가                                   |       |
|  |  Hero stat:                                           |       |
|  |    Value: JetBrains Mono, 64px, weight 700            |       |
|  |           --accent-emerald                            |       |
|  |    Label: Inter, 24px, --text-secondary               |       |
|  |                                                       |       |
|  +------------------------------------------------------+       |
|                                                                  |
+================================================================+

Responsive:
  Desktop (xl+):  height: 480px, title 48px, stat 64px
  Tablet (md-lg): height: 400px, title 36px, stat 48px
  Mobile (< md):  height: 320px, title 28px, stat 36px
                  Content stacked vertically, centered
```

### 3.2 Overview Stats Bar

A horizontal bar showing 3-4 key metrics. Serves as a quick summary scannable at a glance.

```
+================================================================+
|                                                                  |
|  +----------+    +----------+    +----------+    +----------+   |
|  |          |    |          |    |          |    |          |   |
|  | +2.3%p   |    | +12%     |    | -8%      |    | 3개월    |   |
|  |          |    |          |    |          |    |          |   |
|  | 전환율   |    | 매출     |    | 인건비   |    | 도입기간 |   |
|  | 향상     |    | 증가     |    | 절감     |    |          |   |
|  |          |    |          |    |          |    |          |   |
|  +----------+    +----------+    +----------+    +----------+   |
|                                                                  |
+================================================================+

Each stat card:
  Value: JetBrains Mono, H1 (36px), weight 700
         Positive: --accent-emerald
         Neutral: --accent-cyan
  Label: Inter, Caption (14px), --text-tertiary (light mode)
  Separator: thin vertical line (1px, --border-subtle) between cards

Bar container:
  Background: --bg-surface (light mode: #FFFFFF)
  Border-top: 1px solid --border-subtle (light mode: #E2E8F0)
  Border-bottom: 1px solid --border-subtle
  Padding: 32px (vertical), container-website (horizontal)
  Display: flex, justify-content: space-around

  Position: sticky on scroll (optional, top: nav-height)
  When sticky: add shadow-elevation-sm

Responsive:
  Desktop: 4 stats in a row
  Tablet:  4 stats in a row (compressed)
  Mobile:  2x2 grid, or horizontal scroll
```

### 3.3 Problem Section

```
+================================================================+
|  container-website, padding-top: 80px                            |
|                                                                  |
|  Section label:                                                  |
|  "도입 전 과제"                                                  |
|  (Micro, --accent-rose, letter-spacing 0.05em, uppercase)       |
|                                                                  |
|  Section title:                                                  |
|  "데이터 없이 운영하던 매장의 세 가지 과제"                     |
|  (H1, 36px, --text-primary)                                     |
|                                                                  |
|  Problem description (1-2 paragraphs):                           |
|  "강남 플래그십 스토어는 180평 규모의 SPA 패션 매장입니다.      |
|   월 평균 38만 명이 방문하지만, 매장 운영팀은 고객이 어디에     |
|   머무는지, 어떤 진열이 효과적인지 데이터로 파악할 방법이       |
|   없었습니다."                                                   |
|  (Body-lg, 18px, --text-secondary, max-width: 720px)           |
|                                                                  |
|  Pain Point Cards (3 cards in a row):                            |
|                                                                  |
|  +------------------+  +------------------+  +------------------+|
|  |  [X icon, rose]  |  |  [X icon, rose]  |  |  [X icon, rose] ||
|  |                  |  |                  |  |                  ||
|  |  감에 의존하는   |  |  비효율적        |  |  매출 기회       ||
|  |  레이아웃 변경   |  |  인력 배치       |  |  손실 인지 불가  ||
|  |                  |  |                  |  |                  ||
|  |  진열 변경 효과를|  |  피크 시간대를   |  |  고객 이탈이     ||
|  |  측정할 수 없어  |  |  모르고 고정된   |  |  어디서 발생     ||
|  |  매번 시행착오를 |  |  시프트로 운영   |  |  하는지 파악     ||
|  |  반복            |  |                  |  |  불가            ||
|  +------------------+  +------------------+  +------------------+|
|                                                                  |
+================================================================+

Pain Point Card:
  Icon: XCircle (24px), --accent-rose
  Title: H3 (22px), --text-primary
  Description: Body (16px), --text-secondary, 3-4 lines
  Background: --bg-surface (light: white)
  Border: 1px solid --border-subtle (light: #E2E8F0)
  Border-top: 3px solid --accent-rose
  Border-radius: --radius-md (12px)
  Padding: 24px
  Width: 1/3 of container (minus gaps)

Responsive:
  Desktop: 3 cards in a row
  Tablet:  3 cards (compressed)
  Mobile:  stacked vertically, full width
```

### 3.4 Solution Section

```
+================================================================+
|  container-website, padding-top: 80px                            |
|  Background: --bg-surface-2 (light: #F1F5F9) — subtle contrast |
|                                                                  |
|  Section label:                                                  |
|  "NeuralTwin 도입"                                               |
|  (Micro, --accent-cyan, letter-spacing 0.05em)                  |
|                                                                  |
|  Section title:                                                  |
|  "WiFi 센서 8대, 설치 2시간으로 시작"                           |
|  (H1, 36px, --text-primary)                                     |
|                                                                  |
|  Solution description:                                           |
|  "NeuralTwin은 WiFi 프로브 센서 8대를 천장에 설치하여           |
|   매장 전체의 고객 흐름을 실시간으로 감지합니다.                |
|   설치부터 첫 인사이트까지 2시간이면 충분합니다."               |
|  (Body-lg, 18px, --text-secondary, max-width: 720px)           |
|                                                                  |
|  Implementation Timeline:                                        |
|                                                                  |
|  DAY 1          DAY 2          WEEK 1         MONTH 1           |
|  ----o-----------o--------------o--------------o----            |
|  |               |              |              |                 |
|  센서 설치       첫 데이터      AI 인사이트    ROI 리포트       |
|  (2시간)         확인           자동 생성      첫 발행          |
|                                                                  |
|  Embedded Dashboard Screenshot (optional):                       |
|  +------------------------------------------------------------+ |
|  |  [Screenshot of the actual dashboard with this store's     | |
|  |   data, dark theme, showing Morning Digest view]           | |
|  |                                                              | |
|  |  Border-radius: --radius-lg (16px)                          | |
|  |  Shadow: --shadow-elevation-md                              | |
|  |  Max-width: 900px, center-aligned                           | |
|  +------------------------------------------------------------+ |
|                                                                  |
+================================================================+

Timeline:
  Line: 2px, --accent-cyan, horizontal
  Dots: 12px circle, --accent-cyan fill
  Labels (top): Micro (14px), --accent-cyan, weight 600
  Labels (bottom): Caption (14px), --text-secondary
  Connector: dashed line between dots

  Responsive:
    Desktop: horizontal timeline
    Mobile: vertical timeline (left-aligned, dots on left rail)
```

### 3.5 Results -- Before/After Comparison Charts

```
+================================================================+
|  container-website, padding-top: 80px                            |
|                                                                  |
|  Section label:                                                  |
|  "도입 효과"                                                     |
|  (Micro, --accent-emerald, letter-spacing 0.05em)               |
|                                                                  |
|  Section title:                                                  |
|  "3개월 만에 눈에 보이는 변화"                                  |
|  (H1, 36px, --text-primary)                                     |
|                                                                  |
|  CHART 1: Conversion Rate Before/After                           |
|  +------------------------------------------------------------+ |
|  |  전환율 변화                                                | |
|  |                                                              | |
|  |  BEFORE (3 months)         |  AFTER (3 months)              | |
|  |                            |                                | |
|  |  3.5%  ----               |           ----  5.8%           | |
|  |  3.2%  ------             |       ------  5.5%             | |
|  |  3.0%  --------  avg 3.2% |   --------  5.3%  avg 5.5%    | |
|  |  2.8%  ----------         | ----------  5.1%               | |
|  |                            |                                | |
|  |  Month 1  Month 2  Month 3 | Month 4  Month 5  Month 6    | |
|  |                            |                                | |
|  |  Vertical divider: dashed line, --border-subtle             | |
|  |  "NeuralTwin 도입" label on divider line                   | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  CHART 2: Monthly Revenue Before/After                           |
|  +------------------------------------------------------------+ |
|  |  월 매출 변화                                               | |
|  |                                                              | |
|  |  [Bar chart: gray bars before, emerald bars after]          | |
|  |                                                              | |
|  |  ₩3,200만  ₩3,100만  ₩3,250만 | ₩3,450만 ₩3,520만 ₩3,584만| |
|  |                                |                            | |
|  |  Before bars: --text-quaternary (muted)                     | |
|  |  After bars:  --accent-emerald                              | |
|  |  Divider: "NeuralTwin 도입" dashed line                    | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  CHART 3: Zone Dwell Time Improvement                            |
|  +------------------------------------------------------------+ |
|  |  존별 체류시간 변화                                         | |
|  |                                                              | |
|  |  입구       ████████████  3:45 -> 2:10  (-42%)  개선       | |
|  |  디스플레이 ████████████████  2:30 -> 4:12  (+68%)  개선   | |
|  |  피팅룸     ██████████████  5:20 -> 5:45  (+8%)             | |
|  |  계산대     ████████  1:15 -> 0:52  (-31%)  개선            | |
|  |                                                              | |
|  |  Horizontal bar chart                                        | |
|  |  Before: --text-quaternary bars                              | |
|  |  After: --accent-cyan bars (overlaid or side-by-side)       | |
|  |  Delta: --accent-emerald for improvement                    | |
|  +------------------------------------------------------------+ |
|                                                                  |
+================================================================+

Chart Container:
  Background: --bg-surface (light: white)
  Border: 1px solid --border-subtle (light: #E2E8F0)
  Border-radius: --radius-md (12px)
  Padding: 32px
  Shadow: --shadow-elevation-sm (light mode)
  Margin-bottom: 32px between charts

Chart Title:
  H3 (22px), --text-primary
  Margin-bottom: 24px

Chart Colors:
  Before data: #CBD5E1 (light gray, muted)
  After data: --accent-emerald (#10B981)
  Divider line: dashed, --accent-cyan, 1px
  Divider label: Micro, --accent-cyan, background: --accent-cyan-bg, pill badge
  Grid lines: --border-subtle at 30% opacity
  Axis labels: Micro (12px), --text-tertiary

Chart Libraries:
  Recommend: Recharts (already in project) or Chart.js
  Style: clean, minimal, lots of whitespace
  Animation: draw-in on scroll (IntersectionObserver trigger)

Responsive:
  Desktop: charts full width within container
  Mobile: charts simplify (fewer data points, larger text)
          Horizontal bar charts become preferred over line charts
```

### 3.6 Quote / Testimonial Section

```
+================================================================+
|                                                                  |
|  Background: --bg-deep (#0A0E1A) — dark section for contrast   |
|  Padding: 80px vertical                                         |
|                                                                  |
|  +------------------------------------------------------------+ |
|  |                                                              | |
|  |  [Large quotation mark " — decorative]                      | |
|  |  (120px, --accent-cyan at 15% opacity, position: absolute)  | |
|  |                                                              | |
|  |  "NeuralTwin 도입 후 매장 운영이 완전히 달라졌습니다.       | |
|  |   더 이상 감으로 결정하지 않아요. AI가 데이터로 보여주니까  | |
|  |   매일 확신을 가지고 결정할 수 있게 됐습니다."              | |
|  |                                                              | |
|  |  Quote text: H2 (28px), --text-primary (#F9FAFB)            | |
|  |  Style: italic (font-style: italic)                          | |
|  |  Max-width: 800px, center-aligned                            | |
|  |  Line-height: 1.6                                            | |
|  |                                                              | |
|  |  +------+                                                    | |
|  |  | [Photo| 김OO 점장                                        | |
|  |  |  48px]| 강남 플래그십 스토어                               | |
|  |  +------+                                                    | |
|  |                                                              | |
|  |  Attribution:                                                 | |
|  |    Photo: 48px circle avatar (or default avatar icon)        | |
|  |    Name: Body (16px), --text-primary, weight 600             | |
|  |    Title: Caption (14px), --text-tertiary                    | |
|  |    Layout: flex row, centered                                 | |
|  |                                                              | |
|  +------------------------------------------------------------+ |
|                                                                  |
+================================================================+

Decorative Elements:
  Large " mark: top-left of quote container
  Size: 120px, --accent-cyan at 10% opacity
  Font: Georgia or serif, for visual distinction

Alternative (if no real quote available):
  Use AI-generated insight summary instead:
  "NeuralMind AI 분석: 이 매장의 레이아웃 최적화 효과는
   업계 상위 10% 수준입니다."
  Attribution: NeuralMind AI 분석 리포트
```

### 3.7 Related Case Studies Carousel

```
+================================================================+
|  container-website, padding-top: 80px                            |
|                                                                  |
|  Section label:                                                  |
|  "다른 사례도 확인해 보세요"                                     |
|  (H2, 28px, --text-primary)                                     |
|                                                                  |
|  CAROUSEL (3 visible on desktop, 1 on mobile):                   |
|                                                                  |
|  [<]  +----------+  +----------+  +----------+  [>]             |
|       |          |  |          |  |          |                   |
|       | [Photo]  |  | [Photo]  |  | [Photo]  |                   |
|       | 200px h  |  | 200px h  |  | 200px h  |                   |
|       |          |  |          |  |          |                   |
|       | [뷰티]   |  | [백화점] |  | [F&B]    |                   |
|       |          |  |          |  |          |                   |
|       | 올리브영 |  | 현대     |  | 카페     |                   |
|       | 성수점   |  | 판교점   |  | OO점     |                   |
|       |          |  |          |  |          |                   |
|       | 전환율   |  | 층간     |  | 좌석     |                   |
|       | +1.8%p   |  | 이동률   |  | 회전율   |                   |
|       |          |  | +35%     |  | +22%     |                   |
|       |          |  |          |  |          |                   |
|       | [자세히  |  | [자세히  |  | [자세히  |                   |
|       |  보기 ->]|  |  보기 ->]|  |  보기 ->]|                   |
|       |          |  |          |  |          |                   |
|       +----------+  +----------+  +----------+                   |
|                                                                  |
|  Pagination dots: o O o                                          |
|                                                                  |
+================================================================+

Related Case Study Card:
  +---------------------------+
  |                           |
  |  [Photo area — 200px h]   |     Photo: store interior or 3D render
  |  Aspect ratio: 16:9       |     Object-fit: cover
  |                           |
  +---------------------------+
  |                           |
  |  [뷰티]                   |     Industry badge (same as hero)
  |                           |
  |  올리브영 성수점           |     Title: H3 (22px), --text-primary
  |                           |
  |  테스터존 최적화로         |     Description: Caption (14px),
  |  전환율 +1.8%p 달성       |     --text-secondary, 2 lines max
  |                           |
  |  Key stat:                 |
  |  +1.8%p  전환율           |     Value: JetBrains Mono, H2 (28px),
  |                           |            --accent-emerald
  |                           |     Label: Caption, --text-tertiary
  |  [자세히 보기 ->]         |
  |                           |     Link: Caption, --accent-cyan
  +---------------------------+     Underline on hover

  Background: --bg-surface (light: white)
  Border: 1px solid --border-subtle
  Border-radius: --radius-md (12px)
  Shadow: --shadow-elevation-sm
  Overflow: hidden (photo clips to border-radius)
  Width: ~360px (desktop), 100% (mobile)
  Hover: scale(1.01), shadow-elevation-md (150ms ease-out)

Carousel Controls:
  Left/Right arrows:
    Size: 40px circle
    Background: --bg-surface, border --border-subtle
    Icon: ChevronLeft / ChevronRight (20px), --text-secondary
    Hover: border --accent-cyan, icon --accent-cyan
    Position: vertically centered, outside card row
    Hidden on mobile (swipe instead)

  Pagination dots:
    Active: 10px, --accent-cyan
    Inactive: 8px, --text-quaternary
    Spacing: 12px
    Position: centered below carousel, margin-top 24px

Responsive:
  Desktop (xl+):  3 cards visible, arrows visible
  Tablet (md-lg): 2 cards visible, arrows visible
  Mobile (< md):  1 card visible, swipe gesture, dots visible
```

### 3.8 CTA Section

```
+================================================================+
|                                                                  |
|  Background: gradient from --bg-surface-2 to --bg-deep          |
|  (light mode: from #F1F5F9 to #E2E8F0)                         |
|  Padding: 80px vertical                                         |
|                                                                  |
|  Center content:                                                 |
|                                                                  |
|  Heading:                                                        |
|  "우리 매장에도 적용해 보세요"                                  |
|  (H1, 36px, --text-primary, center)                             |
|                                                                  |
|  Subheading:                                                     |
|  "14일 무료 체험으로 시작하세요. 설치 2시간, 위약금 없음."      |
|  (Body-lg, 18px, --text-secondary, center)                      |
|                                                                  |
|  CTA Buttons (row, centered):                                    |
|                                                                  |
|  +----------------------------+  +----------------------------+  |
|  |  무료 체험 시작하기        |  |  데모 체험하기             |  |
|  +----------------------------+  +----------------------------+  |
|                                                                  |
|  Primary CTA:                                                    |
|    Background: --accent-cyan                                     |
|    Text: --text-inverse, 16px, weight 600                        |
|    Padding: 12px 32px                                            |
|    Border-radius: --radius-sm (8px)                              |
|    Shadow: shadow-glow-cyan                                      |
|    -> Links to: /signup                                          |
|                                                                  |
|  Secondary CTA:                                                  |
|    Background: transparent                                       |
|    Border: 1px solid --accent-cyan                               |
|    Text: --accent-cyan, 16px, weight 600                         |
|    Padding: 12px 32px                                            |
|    Border-radius: --radius-sm (8px)                              |
|    -> Links to: /demo                                            |
|                                                                  |
|  Contact line:                                                   |
|  "궁금한 점이 있으신가요? sales@neuraltwin.io"                  |
|  (Caption, --text-tertiary, center)                              |
|                                                                  |
+================================================================+
```

---

## 4. Page Animations

### Scroll-Triggered Animations

```
All sections use IntersectionObserver with threshold: 0.2

Section entrance:
  - Each section fades up (opacity 0->1, translateY 20px->0)
  - Duration: 400ms
  - Easing: ease-out
  - Stagger: children stagger 100ms

Stats bar:
  - Stat values count up from 0 (500ms, ease-out)
  - Triggered when stats bar enters viewport

Charts:
  - Line charts: draw from left to right (800ms)
  - Bar charts: grow from bottom (500ms, 50ms stagger)
  - Triggered when chart enters viewport

Quote:
  - Fade in + slight scale (0.98 -> 1.0), 400ms

Carousel cards:
  - Stagger fade-up (200ms each, 100ms stagger)

Performance:
  - All animations use transform + opacity only
  - prefers-reduced-motion: disable all animations
```

---

## 5. SEO & Meta Data

```html
<title>강남 플래그십 스토어 사례 - 전환율 +2.3%p | NeuralTwin</title>
<meta name="description"
      content="NeuralTwin으로 강남 플래그십 스토어의 고객 동선을 최적화하여
               전환율 +2.3%p, 월 매출 +12% 달성. 패션 매장 AI 분석 사례." />

<!-- Open Graph -->
<meta property="og:title" content="강남 플래그십 스토어: 전환율 +2.3%p 달성" />
<meta property="og:description" content="NeuralTwin AI 분석으로 고객 동선 최적화..." />
<meta property="og:image" content="/images/case-studies/gangnam-og.jpg" />
<meta property="og:type" content="article" />

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "강남 플래그십 스토어: 고객 동선 최적화로 전환율 +2.3%p 달성",
  "author": { "@type": "Organization", "name": "NeuralTwin" },
  "publisher": { "@type": "Organization", "name": "NeuralTwin" },
  "datePublished": "2026-03-01"
}
</script>
```

---

## 6. Implementation Notes for T4 (Website)

```
Routing:
  - /case-studies -> listing page (grid of case study cards)
  - /case-studies/:slug -> individual case study page
  - Use React Router with dynamic routes
  - Data: case study content stored as JSON files or MDX in /src/data/case-studies/

Content Structure:
  Each case study JSON:
  {
    slug: "gangnam-flagship",
    title: "강남 플래그십 스토어",
    subtitle: "고객 동선 최적화로 전환율 +2.3%p 달성",
    industry: "fashion",
    heroImage: "/images/case-studies/gangnam-hero.jpg",
    heroStat: { value: "+12%", label: "월 매출 증가" },
    stats: [
      { value: "+2.3%p", label: "전환율 향상" },
      { value: "+12%", label: "매출 증가" },
      { value: "-8%", label: "인건비 절감" },
      { value: "3개월", label: "도입 기간" }
    ],
    problem: { ... },
    solution: { ... },
    results: { ... },
    quote: { text: "...", author: "김OO", title: "점장" },
    relatedSlugs: ["olive-young-seongsu", "hyundai-pangyo"]
  }

Components to Create:
  - CaseStudyHero
  - StatsBar
  - ProblemSection (with PainPointCard)
  - SolutionSection (with Timeline)
  - ResultsSection (with BeforeAfterChart)
  - TestimonialSection
  - RelatedCaseStudies (carousel)
  - CaseStudyCTA

Chart Library:
  - Use Recharts (already installed in the project)
  - Custom styled to match NeuralTwin light-mode palette
  - Responsive container: <ResponsiveContainer>

Images:
  - Store photos: /public/images/case-studies/
  - Use <picture> with webp + jpg fallback
  - Lazy load below-the-fold images
  - Hero image: eager load (LCP optimization)

i18n:
  - All text through i18n system (ko/en/ja support)
  - Chart labels and data values localized
  - Case study content may be Korean-only initially
```

---

*NeuralTwin Case Study Page Spec v1.0 | Sprint 4.10 | 2026-03-02 | T6 Designer*
