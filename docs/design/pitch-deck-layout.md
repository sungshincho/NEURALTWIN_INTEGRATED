# Sales Pitch Deck Layout Specification

> **Version**: 1.0 | 2026-03-02
> **Sprint**: 4.10 — Demo Mode UI + Pitch Deck Layout
> **Owner**: Teammate 6 (Designer)
> **Format**: 16:9 (1920 x 1080px)
> **Slides**: 5
> **Reference**: `design-system-tokens.md` v2.0, `demo-mode-spec.md` v1.0

---

## Global Deck Specifications

### Dimensions & Grid

```
Slide Size: 1920 x 1080 px (16:9)
Safe Area:  1760 x 940 px (80px margin all sides)
Grid:       12-column, 40px gutter within safe area
Column Width: ~107px (within safe area)

+--80px--+------------------------------------------+--80px--+
|        |                                          |        |
| margin |          SAFE AREA (1760x940)            | margin |
|        |                                          |        |
+--------+------------------------------------------+--------+
```

### Color Palette (Dark Theme)

The pitch deck uses the NeuralTwin dark theme to match the product experience.

```
Backgrounds:
  Primary slide bg:     #0A0E1A  (--bg-deep)
  Content surface:      #111827  (--bg-surface)
  Elevated surface:     #1C2333  (--bg-surface-2)

Accents:
  Primary accent:       #00D4FF  (--accent-cyan / IoT + brand)
  AI accent:            #7C3AED  (--accent-purple)
  Positive:             #10B981  (--accent-emerald)
  Warning:              #F59E0B  (--accent-amber)
  Negative:             #F43F5E  (--accent-rose)

Text:
  Heading:              #F9FAFB  (--text-primary)
  Body:                 #D1D5DB  (--text-secondary)
  Caption:              #9CA3AF  (--text-tertiary)
  Muted:                #6B7280  (--text-quaternary)
```

### Typography

```
Fonts:
  Headings: Inter (weight 700)
  Body:     Inter (weight 400)
  Data:     JetBrains Mono (weight 700, tabular numerals)
  Korean:   Pretendard (fallback for Korean characters)

Scale:
  Slide Title:      48px / 700  (Display-xl equivalent)
  Section Label:    36px / 600  (H1 equivalent)
  Key Stat:         64px / 700  (Display-2xl, JetBrains Mono)
  Body Text:        24px / 400  (Body-lg scaled for projection)
  Caption:          18px / 400
  Micro/Label:      14px / 500

Note: All sizes are 1.5x larger than screen UI to ensure
      readability when projected or on a TV screen.
```

### Shared Elements

```
NeuralTwin Logo:
  Position: bottom-left of every slide
  Size: 120px wide
  Color: white (#F9FAFB)
  Margin from bottom-left corner: 80px

Page Number:
  Position: bottom-right
  Format: "N / 5"
  Style: Caption, --text-quaternary
  Margin from bottom-right corner: 80px

Accent Line:
  Thin horizontal line (2px, --accent-cyan) at top of each slide
  Width: 100% (edge to edge)
  Creates visual continuity across slides

Transition:
  Between slides: fade (300ms)
  Within slide (progressive reveal): fade-up (200ms, 50ms stagger)
```

---

## Slide 1 — Problem: 매장 운영자의 데이터 사각지대

### Layout: Split (Left Text / Right Illustration)

```
+================================================================+
|  ====== accent line (2px, --accent-cyan, full width) =========  |
|                                                                  |
|  LEFT HALF (cols 1-6)           RIGHT HALF (cols 7-12)          |
|                                                                  |
|  Label:                         [ILLUSTRATION AREA]             |
|  "THE PROBLEM"                  +----------------------------+  |
|  (Micro, --accent-cyan,        |                            |  |
|   letter-spacing 0.1em)        |  Visual: Store manager     |  |
|                                 |  looking at spreadsheet    |  |
|  Heading:                       |  with question marks       |  |
|  "매장에서 지금 무슨 일이       |  floating around.          |  |
|   일어나고 있는지               |                            |  |
|   모릅니다"                     |  Style: Dark illustration  |  |
|  (Display-xl, 48px,            |  with cyan accent line     |  |
|   --text-primary)              |  highlights. Isometric     |  |
|                                 |  or flat style.            |  |
|  Body:                          |                            |  |
|  "대부분의 매장은 감과 경험에   |  Alternative: 3D render    |  |
|   의존해 운영됩니다.            |  of empty dashboard with   |  |
|   고객이 어디에 머무는지,       |  "데이터 없음" state      |  |
|   왜 떠나는지, 어떤 진열이      |                            |  |
|   효과적인지 알 방법이          +----------------------------+  |
|   없습니다."                                                    |
|  (Body, 24px, --text-secondary)                                 |
|                                                                  |
|  Stats Row:                                                      |
|  +----------------+  +----------------+                          |
|  | 70%            |  | 15%            |                          |
|  | 매장이 감에    |  | 연 평균        |                          |
|  | 의존           |  | 매출 기회 손실 |                          |
|  +----------------+  +----------------+                          |
|                                                                  |
|  [NeuralTwin logo]                                    [1 / 5]   |
|                                                                  |
+================================================================+
```

### Stats Row Detail

```
Each stat box:
  +------------------------+
  |                        |
  |  70%                   |  <- JetBrains Mono, 64px, weight 700
  |                        |      --accent-rose (negative connotation)
  |  매장이 감에 의존      |  <- Inter, 18px, --text-secondary
  |                        |
  +------------------------+

  Background: --bg-surface (#111827)
  Border: 1px solid --border-subtle (#2D3748)
  Border-left: 3px solid --accent-rose (accent bar)
  Border-radius: --radius-sm (8px)
  Padding: 24px
  Width: 280px
  Margin between stats: 24px
```

### Slide 1 Animation (Progressive Reveal)

```
1. Accent line draws from left to right (400ms)
2. Label fades in (200ms, 300ms delay)
3. Heading fades up line by line (200ms each, 50ms stagger)
4. Body text fades in (300ms, after heading complete)
5. Stats slide up from bottom (250ms, 100ms stagger)
6. Illustration fades in from right (400ms, concurrent with heading)
```

---

## Slide 2 — Solution: NeuralTwin = 매장의 눈과 두뇌

### Layout: Center Hero with 3 Feature Pillars

```
+================================================================+
|  ====== accent line ============================================|
|                                                                  |
|  Center:                                                         |
|  Label:                                                          |
|  "THE SOLUTION"                                                  |
|  (Micro, --accent-cyan, letter-spacing 0.1em, center-aligned)  |
|                                                                  |
|  Heading:                                                        |
|  "NeuralTwin"                                                    |
|  (Display-xl, 48px, --accent-cyan, center)                      |
|                                                                  |
|  Subheading:                                                     |
|  "매장의 눈과 두뇌"                                             |
|  (H1, 36px, --text-primary, center)                             |
|                                                                  |
|  Divider: thin line (1px, --border-subtle, 200px wide, center)  |
|                                                                  |
|  THREE PILLARS (evenly spaced, cols 2-4 / 5-8 / 9-11):         |
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  |    [Eye Icon]  |  |   [Brain Icon] |  | [Lightning     |      |
|  |    48px, cyan  |  |   48px, purple |  |  Icon] 48px,   |      |
|  |                |  |                |  |  emerald       |      |
|  |    SEE         |  |   UNDERSTAND   |  |    ACT         |      |
|  |    실시간 감지 |  |   AI 분석      |  |    자동 추천   |      |
|  |                |  |                |  |                |      |
|  |  WiFi 센서로   |  |  Gemini AI가   |  |  구체적인     |      |
|  |  매장 내 고객  |  |  패턴을 분석해 |  |  행동 추천과  |      |
|  |  흐름을 실시간 |  |  인사이트를    |  |  ROI 예측을   |      |
|  |  으로 감지     |  |  자동 생성     |  |  즉시 제공    |      |
|  +----------------+  +----------------+  +----------------+      |
|         |                    |                    |              |
|         +-------> -------> -------> ------->------+              |
|         (flow arrows connecting the three pillars, --accent-cyan)|
|                                                                  |
|  Bottom text (center):                                           |
|  "설치 2시간. WiFi 센서 8대. 내일부터 데이터 기반 운영."        |
|  (Body, 24px, --text-tertiary)                                  |
|                                                                  |
|  [NeuralTwin logo]                                    [2 / 5]   |
|                                                                  |
+================================================================+
```

### Pillar Card Detail

```
Each pillar:
  +---------------------------+
  |                           |
  |      [Icon 48x48]        |     Icon: Lucide icon, outlined style
  |      (accent colored)    |     Color: cyan / purple / emerald respectively
  |                           |
  |      SEE                  |     <- Micro (14px), --accent-cyan, uppercase
  |      실시간 감지          |     <- H2 (28px), --text-primary
  |                           |
  |  WiFi 센서로 매장 내      |     <- Body (20px), --text-secondary
  |  고객 흐름을 실시간으로   |        3-4 lines max
  |  감지합니다.              |
  |                           |
  +---------------------------+

  Background: glass-sm (bg-white/5, border-white/10)
  Border-radius: --radius-md (12px)
  Padding: 32px
  Width: ~480px (4 grid columns)
  Glow: respective accent color glow on hover/focus
```

### Flow Arrows

```
Between pillars, show directional flow:

  SEE  ------>  UNDERSTAND  ------>  ACT

Arrow style:
  Stroke: 2px, --accent-cyan at 40% opacity
  Arrowhead: 8px, filled, --accent-cyan
  Position: vertically centered between pillar tops
  Animation: draw from left to right (500ms each, staggered)
```

### Slide 2 Animation

```
1. "THE SOLUTION" label fades in (200ms)
2. "NeuralTwin" heading scales in from 0.9 to 1.0 (300ms, ease-out)
3. "매장의 눈과 두뇌" fades up (200ms)
4. Divider draws from center outward (300ms)
5. Three pillars fade up (250ms each, 100ms stagger left to right)
6. Flow arrows draw left to right (500ms, after pillars)
7. Bottom text fades in (200ms, last)
```

---

## Slide 3 — Product Demo: 실제 대시보드 스크린샷 레이아웃

### Layout: Full-Screen Dashboard Mockup with Callout Bubbles

```
+================================================================+
|  ====== accent line ============================================|
|                                                                  |
|  Label (top-left):                                               |
|  "PRODUCT"                                                       |
|  (Micro, --accent-cyan, letter-spacing 0.1em)                   |
|                                                                  |
|  +------------------------------------------------------------+ |
|  |                                                              | |
|  |  [DASHBOARD SCREENSHOT / MOCKUP]                            | |
|  |  Full OS Dashboard in demo mode (fashion scenario)          | |
|  |                                                              | |
|  |  +------+  +------------------------------------------+     | |
|  |  | Side |  |  Morning Digest                          |     | |
|  |  | bar  |  |  +--------+ +--------+ +--------+       |     | |
|  |  |      |  |  |Visitors| | Dwell  | |Convert |       |     | |
|  |  | Home |  |  | 12,847 | | 4:12   | | 3.8%   |       | (A) | |
|  |  | Live |  |  | +8.3%  | | +12%   | | -0.2%p |       |     | |
|  |  | Anal |  |  +--------+ +--------+ +--------+       |     | |
|  |  | 3D   |  |                                          |     | |
|  |  | AI   |  |  [AI Insight Card]                       | (B) | |
|  |  | ROI  |  |  "B존 체류시간이 전주 대비..."           |     | |
|  |  |      |  |                                          |     | |
|  |  |      |  |  [Quick Actions]  [Live Status]          | (C) | |
|  |  +------+  +------------------------------------------+     | |
|  |                                                              | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  [NeuralTwin logo]                                    [3 / 5]   |
|                                                                  |
+================================================================+

CALLOUT BUBBLES (overlaid on screenshot):

  (A) Top-right of MetricCards:
  +-------------------------------------+
  |  실시간 KPI 한눈에                  |
  |  전일 대비, 목표 대비, 7일 트렌드   |
  +-------------------------------------+
       \
        \ (pointer to MetricCard row)

  (B) Right of AI Insight:
  +-------------------------------------+
  |  AI가 먼저 알려주는 인사이트        |
  |  진단 -> 원인 -> 영향 -> 실행 4단계 |
  +-------------------------------------+
       \
        \ (pointer to AI card)

  (C) Bottom-right:
  +-------------------------------------+
  |  3D 스튜디오 + 시뮬레이션           |
  |  매장 레이아웃을 바꾸기 전에 테스트  |
  +-------------------------------------+
       \
        \ (pointer to quick actions / 3D)
```

### Callout Bubble Spec

```
Each callout bubble:
  +-------------------------------------+
  |  Title line                         |  <- Caption (18px), --text-primary
  |  Description line                   |  <- Caption (18px), --text-secondary
  +-------------------------------------+

  Background: --bg-surface-2 (#1C2333) at 95% opacity
  Border: 1px solid --accent-cyan-border
  Border-radius: --radius-sm (8px)
  Padding: 16px 20px
  Max-width: 320px
  Shadow: --shadow-elevation-sm
  Pointer: 8px triangle pointing toward target element

  Accent dot: 6px circle, --accent-cyan, top-left of title line
  (visually connects the callout to the product)
```

### Screenshot Spec

```
The dashboard mockup should be:
  1. A real screenshot of the OS Dashboard in demo mode (preferred)
     OR
  2. A high-fidelity mockup matching exact component designs

Requirements:
  - Show fashion scenario (강남 플래그십 스토어)
  - Dark theme, full dashboard with sidebar
  - MetricCards populated with demo data
  - AI insight card visible
  - No browser chrome (just the app content)
  - Border-radius: --radius-lg (16px) on the screenshot container
  - Subtle shadow: --shadow-elevation-lg
  - Scale: ~85% of slide safe area width
```

### Slide 3 Animation

```
1. "PRODUCT" label fades in (200ms)
2. Screenshot slides up from bottom (400ms, ease-out)
3. Callout A appears (fade-in + scale from pointer, 250ms, 500ms delay)
4. Callout B appears (250ms, 300ms after A)
5. Callout C appears (250ms, 300ms after B)
```

---

## Slide 4 — ROI: 도입 효과 숫자

### Layout: Before/After Comparison

```
+================================================================+
|  ====== accent line ============================================|
|                                                                  |
|  Label:                                                          |
|  "ROI"                                                           |
|  (Micro, --accent-cyan, letter-spacing 0.1em)                   |
|                                                                  |
|  Heading:                                                        |
|  "도입 3개월, 눈에 보이는 변화"                                 |
|  (Display-xl, 48px, --text-primary, center)                     |
|                                                                  |
|  BEFORE / AFTER COMPARISON:                                      |
|                                                                  |
|  +-----------------------+    +-----------------------+          |
|  |  BEFORE               |    |  AFTER                |          |
|  |  NeuralTwin 도입 전   |    |  NeuralTwin 도입 후   |          |
|  |                       |    |                       |          |
|  |  전환율               |    |  전환율               |          |
|  |  3.2%                 | -> |  5.5%                 |          |
|  |  (rose, dimmed)       |    |  (emerald, bright)    |          |
|  |                       |    |  +2.3%p               |          |
|  |  월 매출              |    |  월 매출              |          |
|  |  ₩3,200만             | -> |  ₩3,584만             |          |
|  |  (rose, dimmed)       |    |  (emerald, bright)    |          |
|  |                       |    |  +12%                 |          |
|  |  인건비 비율          |    |  인건비 비율          |          |
|  |  28%                  | -> |  20%                  |          |
|  |  (rose, dimmed)       |    |  (emerald, bright)    |          |
|  |                       |    |  -8%p                 |          |
|  +-----------------------+    +-----------------------+          |
|                                                                  |
|  KEY METRICS ROW (bottom):                                       |
|  +-------------+  +-------------+  +-------------+              |
|  | +2.3%p      |  | +12%        |  | -8%         |              |
|  | 전환율 증가 |  | 매출 증가   |  | 인건비 절감 |              |
|  +-------------+  +-------------+  +-------------+              |
|                                                                  |
|  Source:                                                         |
|  "* 2025 파일럿 매장 3개월 평균 (패션 업종 기준)"               |
|  (Micro, --text-quaternary, center)                              |
|                                                                  |
|  [NeuralTwin logo]                                    [4 / 5]   |
|                                                                  |
+================================================================+
```

### Before/After Card Detail

```
BEFORE card:
  +---------------------------+
  |  BEFORE                   |     Label: Micro, --accent-rose
  |  NeuralTwin 도입 전       |     Subtitle: Caption, --text-tertiary
  |                           |
  |  전환율                   |     Metric label: Caption, --text-tertiary
  |  3.2%                     |     Value: 48px, JetBrains Mono,
  |                           |            --text-quaternary (dimmed)
  |  월 매출                  |
  |  ₩3,200만                 |
  |                           |
  |  인건비 비율              |
  |  28%                      |
  |                           |
  +---------------------------+

  Background: --bg-surface (#111827)
  Border: 1px solid --border-subtle
  Border-left: 3px solid --accent-rose
  Border-radius: --radius-md (12px)
  Padding: 32px
  Width: 400px
  Opacity on values: 0.6 (dimmed to suggest "old" state)

AFTER card:
  +---------------------------+
  |  AFTER                    |     Label: Micro, --accent-emerald
  |  NeuralTwin 도입 후       |     Subtitle: Caption, --text-secondary
  |                           |
  |  전환율                   |
  |  5.5%                     |     Value: 48px, JetBrains Mono,
  |  +2.3%p  [arrow-up]      |            --accent-emerald (bright)
  |                           |     Delta: 24px, --accent-emerald
  |  월 매출                  |
  |  ₩3,584만                 |
  |  +12%  [arrow-up]        |
  |                           |
  |  인건비 비율              |
  |  20%                      |
  |  -8%p  [arrow-down]      |     Delta for cost: --accent-emerald
  |                           |     (negative cost = positive outcome)
  +---------------------------+

  Background: --bg-surface (#111827)
  Border: 1px solid --accent-emerald-border
  Border-left: 3px solid --accent-emerald
  Border-radius: --radius-md (12px)
  Padding: 32px
  Width: 400px
  Shadow: shadow-glow-emerald (subtle)

Arrow between cards:
  Position: centered between BEFORE and AFTER
  Icon: ArrowRight (32px), --accent-cyan
  Background: --bg-surface-2, circular (48px), border --accent-cyan-border
```

### Key Metrics Row Detail

```
Each metric highlight:
  +---------------------------+
  |                           |
  |  +2.3%p                   |     <- JetBrains Mono, 48px, weight 700
  |                           |        --accent-emerald
  |  전환율 증가              |     <- Inter, 18px, --text-secondary
  |                           |
  +---------------------------+

  Background: glass-sm
  Border-top: 2px solid --accent-emerald
  Border-radius: --radius-sm (8px)
  Padding: 24px
  Width: ~340px (3 across with gutters)
  Alignment: center
```

### Slide 4 Animation

```
1. "ROI" label and heading fade in (200ms)
2. BEFORE card slides in from left (300ms)
3. Arrow appears (scale-in, 200ms)
4. AFTER card slides in from right (300ms)
5. AFTER values count up from BEFORE values (500ms each, staggered)
   e.g., 3.2% -> 5.5% with countUp animation
6. Delta badges pop in (scale-in, 200ms, after count-up)
7. Key metrics row slides up from bottom (250ms, 100ms stagger)
8. Source text fades in last (200ms)
```

---

## Slide 5 — CTA: 시작하기

### Layout: Centered CTA with Pricing Overview

```
+================================================================+
|  ====== accent line ============================================|
|                                                                  |
|  Center content:                                                 |
|                                                                  |
|  Heading:                                                        |
|  "지금 시작하세요"                                               |
|  (Display-xl, 48px, --text-primary, center)                     |
|                                                                  |
|  Subheading:                                                     |
|  "14일 무료 체험. 설치 2시간. 내일부터 데이터 기반 운영."       |
|  (Body, 24px, --text-secondary, center)                         |
|                                                                  |
|  PRICING TIERS (3 cards):                                        |
|                                                                  |
|  +----------------+  +==================+  +----------------+    |
|  |  Starter       |  ||  Growth         ||  |  Enterprise   |    |
|  |                |  ||  RECOMMENDED    ||  |               |    |
|  |  ₩49,000/월   |  ||  ₩149,000/월   ||  |  문의         |    |
|  |                |  ||                 ||  |               |    |
|  |  1 매장       |  ||  3 매장         ||  |  무제한       |    |
|  |  기본 분석    |  ||  고급 분석      ||  |  전용 지원    |    |
|  |  AI 인사이트  |  ||  3D 스튜디오    ||  |  커스텀 AI    |    |
|  |  이메일 리포트|  ||  시뮬레이션     ||  |  API 연동     |    |
|  |               |  ||  멀티 매장 비교 ||  |  온프레미스   |    |
|  +----------------+  +==================+  +----------------+    |
|                                                                  |
|  CTA:                                                            |
|  +------------------------------------------+                    |
|  |         무료 체험 시작하기                |                    |
|  +------------------------------------------+                    |
|  (centered, prominent)                                           |
|                                                                  |
|  Contact row:                                                    |
|  이메일: sales@neuraltwin.io                                    |
|  전화: 02-XXX-XXXX                                              |
|                                                                  |
|  +--------+                                                      |
|  | [QR]   |  <- QR code to demo URL                             |
|  | [CODE] |     (https://app.neuraltwin.io/demo)                |
|  +--------+                                                      |
|                                                                  |
|  [NeuralTwin logo]                                    [5 / 5]   |
|                                                                  |
+================================================================+
```

### Pricing Tier Card Detail

```
Standard Tier (Starter / Enterprise):
  +---------------------------+
  |                           |
  |  Starter                  |     <- H2 (28px), --text-primary
  |                           |
  |  ₩49,000                  |     <- H1 (36px), JetBrains Mono,
  |  / 월                     |        --text-primary
  |                           |        "/ 월" = Caption, --text-tertiary
  |  -------------------------+
  |  1 매장                   |     <- Body (20px), --text-secondary
  |  기본 분석                |        Each feature on its own line
  |  AI 인사이트              |        Checkmark icon (16px, --accent-emerald)
  |  이메일 리포트            |        before each feature
  |                           |
  +---------------------------+

  Background: --bg-surface (#111827)
  Border: 1px solid --border-subtle
  Border-radius: --radius-md (12px)
  Padding: 32px
  Width: 320px

Recommended Tier (Growth) — highlighted:
  +===========================+
  ||                          ||
  ||  Growth                  ||    <- H2 (28px), --accent-cyan
  ||  RECOMMENDED             ||    <- Micro badge, --accent-cyan bg
  ||                          ||
  ||  ₩149,000                ||    <- H1 (36px), --accent-cyan
  ||  / 월                    ||
  ||                          ||
  ||  ========================||
  ||  3 매장                  ||
  ||  고급 분석               ||
  ||  3D 스튜디오             ||
  ||  시뮬레이션              ||
  ||  멀티 매장 비교          ||
  ||                          ||
  +===========================+

  Background: --bg-surface (#111827)
  Border: 2px solid --accent-cyan
  Border-radius: --radius-md (12px)
  Shadow: shadow-glow-cyan
  Padding: 32px
  Width: 340px (slightly wider)
  Scale: transform: scale(1.02) (slightly larger)
  "RECOMMENDED" badge:
    Position: top of card, centered
    Background: --accent-cyan
    Text: --text-inverse, Micro, weight 700
    Padding: 4px 16px
    Border-radius: --radius-full (pill)
    Margin-top: -14px (overlaps card border)
```

### CTA Button Detail

```
+------------------------------------------+
|         무료 체험 시작하기                |
+------------------------------------------+

  Width: 360px
  Height: 56px
  Background: --accent-cyan (#00D4FF)
  Text: --text-inverse (#111827), 20px, weight 700
  Border-radius: --radius-sm (8px)
  Shadow: shadow-glow-cyan-intense
  Animation: subtle pulse glow (opacity oscillation, 2s infinite)
  Center-aligned below pricing cards
  Margin-top: 40px
```

### Contact & QR Section

```
Layout: horizontal row, centered below CTA

Left:
  이메일: sales@neuraltwin.io     <- Body (20px), --text-secondary
  전화: 02-XXX-XXXX               <- Body (20px), --text-secondary
  (Icon: Mail / Phone, 20px, --accent-cyan, before each line)

Right:
  +--------+
  | [QR    |     QR code pointing to: https://app.neuraltwin.io/demo
  |  CODE] |     Size: 80x80px
  |        |     Colors: white on transparent (dark background makes it visible)
  +--------+     Border: 1px solid --border-subtle
  체험하기       <- Micro, --text-tertiary, below QR

Spacing: 80px between contact info and QR code
```

### Slide 5 Animation

```
1. Heading + subheading fade in (200ms)
2. Pricing cards rise up (250ms each, 100ms stagger, center first)
3. "RECOMMENDED" badge pops in (scale-in, 200ms, after Growth card)
4. CTA button scales in with glow (300ms, ease-out)
5. Contact info and QR fade in (200ms, last)
```

---

## Export & Delivery Specifications

### File Formats

```
Primary:   PDF (vectorized, no rasterization of text)
Secondary: PPTX (editable, with embedded fonts)
Web:       HTML (for interactive/animated presentation)

PDF settings:
  Resolution: 300 DPI
  Color space: sRGB
  Font embedding: all fonts embedded
  File size target: < 5 MB

PPTX settings:
  Slide size: 1920x1080 (widescreen 16:9)
  Fonts: Inter + JetBrains Mono embedded
  Theme colors: match NeuralTwin palette
  Editable text and shapes (not rasterized)
```

### Print Considerations

```
If printed (for handout):
  - Background: switch to white (#FFFFFF)
  - Text: switch to dark (#0F172A)
  - Accent colors remain the same
  - QR code: black on white
  - Add URL text below QR code for accessibility
  - Page size: A4 landscape
```

### Presentation Notes

```
Slide 1: (2 min)
  "이 슬라이드에서는 매장 운영자들이 겪는 데이터 사각지대를 설명합니다.
   70% 통계는 한국리테일연구원 2025년 보고서 기준입니다."

Slide 2: (2 min)
  "SEE-UNDERSTAND-ACT 3단계가 핵심 메시지입니다.
   각 단계를 순서대로 설명하며, 기존 솔루션과의 차별점을 강조하세요."

Slide 3: (3 min)
  "라이브 데모를 직접 보여줄 수 있다면 이 슬라이드 대신 데모 시연.
   프로젝터/TV가 있다면 demo URL을 직접 열어 패션 시나리오를 시연하세요."

Slide 4: (2 min)
  "숫자가 핵심입니다. 전환율 +2.3%p가 월 매출 +12%로 이어진다는
   연결고리를 명확히 설명하세요. 파일럿 데이터 기반임을 언급하세요."

Slide 5: (1 min)
  "QR 코드를 스캔하면 바로 체험할 수 있다고 안내하세요.
   Growth 플랜을 추천하되, 가격보다 가치(ROI)에 초점을 맞추세요."
```

---

*NeuralTwin Sales Pitch Deck Layout v1.0 | Sprint 4.10 | 2026-03-02 | T6 Designer*
