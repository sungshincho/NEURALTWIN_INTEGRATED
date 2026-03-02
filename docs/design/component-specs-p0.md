# P0 Component Specifications

> **Version**: 1.0 | 2026-03-02
> **Priority**: P0 (Must-have for Phase 1)
> **Owner**: Teammate 6 (Designer)
> **Implementers**: Teammate 3 (OS Dashboard), Teammate 4 (Website)
> **Reference**: `NeuralTwin_Product_Enhancement_Spec.md` Sections 1.3, 2.2

---

## 1. MetricCard 2.0

**Current State**: Basic card with number + label only (no trend, no goal, no status).
**Target**: Rich data card with sparkline, goal progress, status-aware styling, and drill-down.

### 1.1 Visual Spec

```
Normal State
+-------------------------------------------------------------+
|                                                               |
|   [Icon]  Visitors                              [...]  <- context menu
|                                                               |
|   12,847                                  ▲ 8.3%             |
|   visitors                                vs yesterday        |
|                                                               |
|   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░  78%                 |
|   78% of daily goal                                           |
|                                                               |
|   ▁▂▃▄▃▅▆▇▆▅▃▂  7-day trend                                 |
|                                                               |
+-------------------------------------------------------------+

Hovered State (glass-md + glow shadow)
+-------------------------------------------------------------+  <- shadow-glow-cyan
|                                                               |     (IoT data)
|   [Icon]  Visitors                              [...]        |     or
|                                                               |     shadow-glow-purple
|   12,847                                  ▲ 8.3%             |     (AI data)
|   visitors                                vs yesterday        |
|                                                               |
|   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░  78%                 |
|   78% of daily goal                                           |
|                                                               |
|   ▁▂▃▄▃▅▆▇▆▅▃▂  7-day trend                                 |
|                                                               |
+-------------------------------------------------------------+

Clicked/Active State (expanded detail)
+-------------------------------------------------------------+
|                                                               |
|   [Icon]  Visitors                         [Close]           |
|                                                               |
|   12,847                                  ▲ 8.3%             |
|   visitors                                vs yesterday        |
|                                                               |
|   +--- Detail breakdown (slide-down) --+                     |
|   |  Morning (9-12):   4,210  ▲12%     |                     |
|   |  Afternoon (12-6):  6,431  ▲5%     |                     |
|   |  Evening (6-10):   2,206  ▲8%      |                     |
|   +-------------------------------------+                     |
|                                                               |
|   [Full Analysis ->]                                          |
+-------------------------------------------------------------+
```

### 1.2 Status States

The card border and glow change based on the `status` prop:

```
Status: 'normal'
  Border:  --border-subtle (#2D3748)
  Glow:    none
  Icon:    default color

Status: 'excellent'
  Border:  --accent-emerald-border
  Glow:    shadow-glow-emerald
  Icon:    --accent-emerald
  Badge:   "Excellent" emerald micro badge (top-right)

Status: 'warning'
  Border:  --accent-amber-border
  Glow:    shadow-glow-amber
  Icon:    --accent-amber
  Badge:   "Attention" amber micro badge (top-right)
  Animation: subtle pulse on border (1 cycle, then static)

Status: 'critical'
  Border:  --accent-rose-border
  Glow:    shadow-glow-rose
  Icon:    --accent-rose
  Badge:   "Critical" rose micro badge (top-right)
  Animation: persistent slow pulse on border
```

### 1.3 Layout Zones

```
+-------------------------------------------------------------+
|  ZONE A: Header                                               |
|  [Icon 24x24] [Label: H3] ..................... [Menu: ...]  |
|                                                               |
|  ZONE B: Value                                                |
|  [Value: H1, font-data]  .............. [Delta: Caption]     |
|  [Unit: Caption, text-tertiary]         [Period: Micro]      |
|                                                               |
|  ZONE C: Goal Progress (optional, shown when goal prop set)  |
|  [ProgressBar: h-1.5, rounded-full]  ... [Percentage: Mono]  |
|  [GoalLabel: Micro, text-quaternary]                          |
|                                                               |
|  ZONE D: Sparkline (optional, shown when trend prop set)     |
|  [SVG sparkline: h-8, full width, accent-cyan stroke]        |
|  [TrendLabel: Micro, text-quaternary, right-aligned]         |
+-------------------------------------------------------------+
```

### 1.4 Props Interface

```typescript
interface MetricCardProps {
  // Required
  value: number;
  label: string;

  // Display
  unit?: string;                              // e.g., "visitors", "minutes", "%"
  format?: 'number' | 'percent' | 'currency' | 'duration';
  locale?: string;                            // default: 'ko-KR'

  // Change indicator
  change?: {
    value: number;                            // e.g., 8.3 (percent change)
    period: string;                           // e.g., "vs yesterday", "vs last week"
  };

  // Goal progress
  goal?: {
    target: number;                           // target value
    current: number;                          // current value
    label?: string;                           // e.g., "daily goal"
  };

  // Sparkline
  trend?: number[];                           // 7-day values for sparkline

  // Status
  status: 'normal' | 'warning' | 'critical' | 'excellent';

  // Interaction
  onClick?: () => void;                       // click -> drill-down view
  onContextMenu?: (action: string) => void;   // "..." menu actions

  // Visual
  icon?: React.ReactNode;                     // Lucide icon
  accentColor?: 'cyan' | 'purple' | 'emerald' | 'amber';
  className?: string;

  // Loading
  loading?: boolean;                          // show skeleton state
}
```

### 1.5 Responsive Behavior

```
Desktop (xl+):
  4 cards per row (grid-cols-4)
  Full layout: icon + label + value + delta + goal + sparkline

Tablet (md-lg):
  2 cards per row (grid-cols-2)
  Full layout maintained

Mobile (< md):
  1 card per row (grid-cols-1)
  Compact layout:
    - Icon + Label inline with value
    - Delta below value
    - Goal bar full width
    - Sparkline hidden (show on tap)
```

```
Desktop Card:
+---------------------------+
|  [Icon] Label     [...]  |
|                           |
|  12,847          ▲ 8.3%  |
|  visitors        vs yest  |
|                           |
|  ━━━━━━━━━━░░░░  78%     |
|  ▁▂▃▄▃▅▆▇▆▅              |
+---------------------------+

Mobile Card (compact):
+--------------------------------------------+
|  [Icon]  Visitors    12,847  ▲ 8.3%       |
|          visitors    ━━━━━━━━░░░  78%      |
+--------------------------------------------+
```

### 1.6 Animation Specs

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Value number | countUp from 0 | 500ms | ease-out | Card enters viewport |
| Delta arrow + value | fade-in + slide-up | 200ms, 100ms delay | ease-out | After value countUp |
| Progress bar | width grow from 0 | 600ms | ease-out | Card enters viewport |
| Sparkline | stroke draw (SVG dashoffset) | 1000ms | ease-out | Card enters viewport |
| Status badge | scale-in | 200ms | ease-out | Card enters viewport |
| Hover glow | opacity 0->1 | 150ms | ease-out | Mouse enter |
| Card entry (stagger) | fade-up | 150ms, stagger 50ms | ease-out | Page load |

### 1.7 Skeleton State

When `loading={true}`:

```
+-------------------------------------------------------------+
|                                                               |
|   [====]  [========]                           [..]          |
|                                                               |
|   [================]                  [=======]              |
|   [=====]                             [===]                  |
|                                                               |
|   [============================================]  [===]      |
|   [==========]                                               |
|                                                               |
|   [=============================================]            |
|                                                               |
+-------------------------------------------------------------+

All skeleton bars: bg-white/5, animate-shimmer
Skeleton uses the same layout zones to prevent layout shift on load.
```

### 1.8 Implementation Notes for T3

- Use `glass-md` as the base card style.
- Number values MUST use `font-data` (JetBrains Mono) with `tabular-nums`.
- Sparkline: Use lightweight SVG `<polyline>`. No chart library needed. 7 data points max.
- Progress bar: Use a `<div>` with percentage width + transition. Not a `<progress>` element.
- The countUp animation can use a simple `requestAnimationFrame` loop or `framer-motion`'s `useMotionValue`.
- Context menu (`[...]`): Use Radix `DropdownMenu`. Actions: "View Detail", "Set Alert", "Export".
- The card should be a `<button>` for accessibility when `onClick` is provided.
- Status pulse animation: Use CSS `animation` with `@keyframes`, not JS.
- Z-index: Cards are at z-10. Status badge at z-20. Context menu at z-30.

---

## 2. AIInsightBubble

**Current State**: AI assistant is a separate page/tab. Context breaks on navigation.
**Target**: Floating bubble (bottom-right) that proactively surfaces AI insights. Expands into a side panel.

### 2.1 Visual Spec

#### Collapsed State (Bubble)

```
                                                 Screen edge
                                                     |
                                                     v
+--------------------------------------------------+--+
|  Dashboard content                                |  |
|                                                    |  |
|                                                    |  |
|                                                    |  |
|                                                    |  |
|                                                    |  |
|                                                    |  |
|                                      +----------+  |  |
|                                      | [AI Icon]|  |  |
|                                      |  AI has  |  |  |
|                                      | insights |  |  |
|                                      +----------+  |  |
+--------------------------------------------------+--+

Bubble Detail:
+----------------------------------+
|                                    |
|       [AI Brain Icon 24x24]       |
|                                    |
|    AI has something to say        |   <- Caption, text-secondary
|                                    |
+----------------------------------+

Position: fixed, bottom: 24px, right: 24px
Size: collapsed = 200px wide, auto height (min 64px)
Style: glass-lg, rounded-xl, shadow-glow-purple
Animation: bubble-pulse (slow pulsing glow when new insight available)
Z-index: 50
```

#### Collapsed State Variants

```
[No pending insight]
+----------------------------------+
|  [AI Icon]  NeuralMind            |   <- Muted, no pulse
+----------------------------------+
Style: glass-sm, no glow, opacity 0.7

[New insight available — pulsing]
+----------------------------------+
|  [AI Icon]  AI has insights  [1] |   <- Pulse animation, badge count
+----------------------------------+
Style: glass-lg, shadow-glow-purple, animate-bubble-pulse

[Urgent insight — critical]
+----------------------------------+
|  [!] Critical Alert              |   <- Rose accent, stronger pulse
+----------------------------------+
Style: glass-lg, border --accent-rose-border, shadow-glow-rose
```

#### Expanded State (Side Panel)

```
Screen layout with expanded panel:

+-----------------------------+----------------------------+
|                             |                            |
|  Dashboard content          |  NeuralMind          [X]  |
|  (shrinks by 320px)         |  ========================  |
|                             |                            |
|                             |  Today's B-zone dwell     |
|                             |  time dropped -34% from   |
|                             |  the weekly average.      |
|                             |                            |
|                             |  The entrance promotion   |
|                             |  table may be blocking    |
|                             |  the natural flow into    |
|                             |  B-zone.                  |
|                             |                            |
|                             |  ========================  |
|                             |                            |
|                             |  [View Suggestion]        |
|                             |  [Later]                  |
|                             |                            |
+-----------------------------+----------------------------+
```

Panel Detail:

```
+--------------------------------------------+
|  HEADER                                      |
|  [AI Icon] NeuralMind              [X]      |
+--------------------------------------------+
|                                              |
|  MESSAGE AREA                                |
|                                              |
|  [Severity Icon]  Insight Title              |
|                                              |
|  "Today B-zone dwell time is -34%           |
|   compared to the weekly average.            |
|   The entrance promotion table               |
|   may be blocking the natural                |
|   customer flow."                            |
|                                              |
|  Source: Zone Analysis + Traffic Data        |  <- Micro, text-quaternary
|  Generated: 2 min ago                        |  <- Micro, text-quaternary
|                                              |
+--------------------------------------------+
|  ACTIONS                                     |
|                                              |
|  [View Suggestion]          <- primary btn  |
|  [Simulate in 3D]           <- outline btn  |
|  [Dismiss]                  <- ghost btn    |
|                                              |
+--------------------------------------------+
|  HISTORY                                     |
|                                              |
|  Previous Insights (Today)                   |
|  +-----------------------------------------+|
|  | 10:30  Peak hour approaching (Normal)   ||
|  | 09:15  Morning digest ready (Info)      ||
|  +-----------------------------------------+|
|                                              |
+--------------------------------------------+
```

### 2.2 Message Types

| Type | Icon | Accent Color | Description |
|------|------|-------------|-------------|
| `insight` | Lightbulb | `--accent-purple` | Proactive data insight |
| `alert` | AlertTriangle | `--accent-amber` | Warning threshold reached |
| `critical` | AlertCircle | `--accent-rose` | Critical anomaly detected |
| `suggestion` | Sparkles | `--accent-cyan` | Actionable recommendation |
| `digest` | BarChart3 | `--accent-emerald` | Morning digest / summary |
| `info` | Info | `--text-tertiary` | Low-priority notification |

### 2.3 Severity Indicators

```
info:
  Border: --border-subtle
  Glow:   none
  Badge:  none
  Sound:  none

insight:
  Border: --accent-purple-border
  Glow:   shadow-glow-purple
  Badge:  purple dot
  Sound:  none

alert:
  Border: --accent-amber-border
  Glow:   shadow-glow-amber
  Badge:  amber dot + count
  Sound:  subtle chime (optional, user preference)

critical:
  Border: --accent-rose-border
  Glow:   shadow-glow-rose
  Badge:  rose dot + count + pulse
  Sound:  alert tone (optional, user preference)
```

### 2.4 Props Interface

```typescript
interface AIInsightBubbleProps {
  // State
  insights: AIInsight[];
  isExpanded: boolean;
  onToggle: () => void;

  // Callbacks
  onAction: (insightId: string, action: 'view' | 'simulate' | 'dismiss') => void;
  onNavigate: (target: 'zone' | '3d-studio' | 'analytics', params: Record<string, string>) => void;
}

interface AIInsight {
  id: string;
  type: 'insight' | 'alert' | 'critical' | 'suggestion' | 'digest' | 'info';
  title: string;
  message: string;
  source: string;          // e.g., "Zone Analysis + Traffic Data"
  timestamp: Date;
  read: boolean;
  actions: InsightAction[];
}

interface InsightAction {
  label: string;
  type: 'primary' | 'secondary' | 'ghost';
  target?: string;         // navigation target
  params?: Record<string, string>;
}
```

### 2.5 Animation Specs

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Bubble appear (page load) | fade-in + scale-in | 300ms, 500ms delay | ease-out |
| Bubble pulse (new insight) | glow opacity oscillation | 2000ms, infinite | cubic-bezier(0.4,0,0.6,1) |
| Bubble -> Panel expand | slide-in-left + dashboard shrink | 300ms | ease-out |
| Panel -> Bubble collapse | slide-out-right + dashboard expand | 250ms | ease-in |
| New message enter | slide-up + fade-in | 200ms | ease-out |
| Message dismiss | fade-out + slide-down | 150ms | ease-in |
| Badge count increment | scale bounce (1 -> 1.2 -> 1) | 200ms | spring |

### 2.6 Z-Index Rules

```
Z-Index Layer Map:
  z-10    Dashboard cards, content
  z-20    Sidebar (collapsed/expanded)
  z-30    Dropdown menus, popovers
  z-40    Toast notifications
  z-50    AIInsightBubble (collapsed)
  z-50    AIInsightBubble (expanded panel)
  z-60    Modal overlays
  z-70    Modal content
  z-80    Critical alert overlay (full-screen dim)
```

The AIInsightBubble sits at z-50, above tooltips and dropdowns but below modals. This ensures the bubble is always accessible but does not interfere with modal interactions.

### 2.7 Responsive Behavior

```
Desktop (xl+):
  Bubble: bottom-right corner, 24px from edges
  Panel: 320px wide side panel, dashboard content shifts left

Tablet (md-lg):
  Bubble: bottom-right corner, 16px from edges
  Panel: Full-width bottom sheet (320px height), slides up from bottom

Mobile (< md):
  Bubble: bottom-center, 16px from bottom, centered
  Panel: Full-screen overlay with back button
  Interaction: swipe down to dismiss
```

### 2.8 Implementation Notes for T3

- Use Zustand store for insight state management. Create `useAIInsightStore` with:
  - `insights: AIInsight[]`
  - `isExpanded: boolean`
  - `unreadCount: number`
  - `addInsight(insight)`, `togglePanel()`, `markRead(id)`, `dismissInsight(id)`
- The bubble should persist across route changes (render in root layout, not per-page).
- Panel expand/collapse: use CSS `transform: translateX()` for performance. Do not animate `width`.
- Dashboard content shift: use CSS `margin-right` transition, not `width` change.
- For the message list, use `react-virtuoso` or similar if insights accumulate beyond 20 items.
- Connect to Supabase Realtime channel `ai-insights:{store_id}` for push notifications.
- The `[Simulate in 3D]` action should call `useNavigate('/studio', { state: { zoneId, overlay: 'heatmap' } })`.
- Keyboard accessibility: `Escape` closes the panel. `Tab` cycles through actions. `Enter` activates.
- Store user preference for panel state in `localStorage` key `neuraltwin-ai-panel-expanded`.

---

## 3. OnboardingFlow 2.0

**Current State**: 7-step wizard with excessive form fields. High drop-off rate.
**Target**: 2-step instant start + progressive disclosure. Under 60 seconds total.

### 3.1 Visual Spec

#### Step 1: Store Type Selection (30 seconds)

```
+-------------------------------------------------------------+
|                                                               |
|  Welcome to NeuralTwin                                 [X]   |
|                                                               |
|  What type of store do you run?                               |
|  Choose one to see a tailored preview.                        |
|                                                               |
|  +----------+  +----------+  +----------+                    |
|  |          |  |          |  |          |                    |
|  | [Fashion |  | [Beauty  |  | [F&B     |                    |
|  |  Icon]   |  |  Icon]   |  |  Icon]   |                    |
|  |          |  |          |  |          |                    |
|  | Fashion  |  |  Beauty  |  |  F & B   |                    |
|  |          |  |          |  |          |                    |
|  +----------+  +----------+  +----------+                    |
|                                                               |
|  +----------+  +----------+                                   |
|  |          |  |          |                                   |
|  | [Life-   |  | [Other   |                                   |
|  |  style]  |  |  Icon]   |                                   |
|  |          |  |          |                                   |
|  |Lifestyle |  |  Other   |                                   |
|  |          |  |          |                                   |
|  +----------+  +----------+                                   |
|                                                               |
+-------------------------------------------------------------+
```

**Store Type Cards Detail:**

```
Unselected Card:
+------------------+
|                    |     Glass: glass-sm
|   [Icon 40x40]   |     Border: --border-subtle
|                    |     Bg: transparent
|   Store Type      |     Text: --text-secondary
|                    |
+------------------+

Hovered Card:
+------------------+
|                    |     Glass: glass-md
|   [Icon 40x40]   |     Border: --accent-cyan-border
|                    |     Bg: --accent-cyan-bg
|   Store Type      |     Text: --text-primary
|                    |     Shadow: shadow-glow-cyan (subtle)
+------------------+

Selected Card:
+==================+
||                  ||    Glass: glass-lg
||  [Icon 40x40]   ||    Border: --accent-cyan (solid, 2px)
||                  ||    Bg: --accent-cyan-bg
||  Store Type  [v] ||    Text: --text-primary
||                  ||    Shadow: shadow-glow-cyan
+==================+     Checkmark icon in corner
```

**Below the store type cards, show immediate preview:**

```
After selecting "Fashion":

+-------------------------------------------------------------+
|                                                               |
|  [Animated preview fades in below the cards]                 |
|                                                               |
|  +---------+ +---------+ +---------+                        |
|  | Visitors| | Dwell   | | Convert |   <- Mini MetricCards   |
|  | 12,847  | | 4:12    | | 3.8%    |      with sample data   |
|  | ▲ 8.3%  | | ▲ 12%   | | ▼ 0.2%  |                        |
|  +---------+ +---------+ +---------+                        |
|                                                               |
|  "Here is what a fashion store dashboard looks like."        |
|                                                               |
|                                   [Next: Name Your Store ->] |
+-------------------------------------------------------------+
```

#### Step 2: Store Name (10 seconds)

```
+-------------------------------------------------------------+
|                                                               |
|  [<- Back]    Almost done!                             [X]   |
|                                                               |
|  Name your store                                              |
|                                                               |
|  +-----------------------------------------------+          |
|  |  My Fashion Store                              |          |
|  +-----------------------------------------------+          |
|                                                               |
|  This is how your store will appear in the dashboard.        |
|  You can change it anytime in Settings.                       |
|                                                               |
|                                                               |
|                                [Start with Sample Data ->]   |
|                                                               |
+-------------------------------------------------------------+

Input field:
  Style: glass-md, rounded-sm, h-12
  Placeholder: "e.g., Gangnam Flagship Store"
  Focus: border --accent-cyan, shadow-glow-cyan (subtle)
  Font: font-ui, text-lg

Button:
  Style: primary, full-width on mobile, auto on desktop
  Loading state: spinner + "Setting up your dashboard..."
```

#### Post-Onboarding: Dashboard with Sample Data

```
+-------------------------------------------------------------+
|  BANNER (dismissible)                                        |
|  +=========================================================+|
|  || [Info Icon]  You are viewing sample data.               ||
|  ||              Connect a Pi sensor for real data.          ||
|  ||                                                          ||
|  ||  [Connect Sensor ->]                    [Maybe Later]   ||
|  +=========================================================+|
|                                                               |
|  [Normal dashboard layout with all cards populated]          |
|                                                               |
|  TIP OVERLAY (one-time, on first card):                      |
|  +-----------------------------+                              |
|  | "This shows zone dwell time |  <- Tooltip pointing to     |
|  |  for each area of your     |     the first MetricCard     |
|  |  store."                    |                              |
|  |  [Got it]                   |                              |
|  +-----------------------------+                              |
|                                                               |
|  AI WELCOME MESSAGE (in AIInsightBubble):                    |
|  +----------------------------------+                        |
|  | [AI Icon]  Welcome! I will be    |                        |
|  | helping you analyze your fashion |                        |
|  | store. What would you like to    |                        |
|  | know about today's dashboard?    |                        |
|  +----------------------------------+                        |
|                                                               |
+-------------------------------------------------------------+
```

### 3.2 Progressive Disclosure Pattern

The onboarding captures only 2 data points (type + name). All other settings are deferred:

```
ONBOARDING (mandatory, 2 steps):
  Step 1: Store type      -> drives sample data selection
  Step 2: Store name      -> personalizes dashboard

PROGRESSIVE SETUP (optional, when ready):
  Settings > Store Layout -> Define zones on a floor plan
  Settings > Sensors      -> Connect Raspberry Pi devices
  Settings > Data Sources -> POS integration, weather API
  Settings > Team         -> Invite colleagues

Each progressive step is surfaced via:
  1. Contextual nudges in relevant dashboard sections
  2. AI suggestions: "Ready to connect real sensors?"
  3. Settings page checklist with completion percentage
```

### 3.3 Sample Data Strategy

Each store type has a pre-built sample dataset that feels realistic:

| Store Type | Sample Visitors | Avg Dwell | Conversion | Zones | Sample Period |
|------------|-----------------|-----------|------------|-------|---------------|
| Fashion | 12,847/day | 4m 12s | 3.8% | Entrance, Display, Fitting, Checkout | 30 days |
| Beauty | 8,420/day | 3m 45s | 5.2% | Skincare, Makeup, Fragrance, Tester, Checkout | 30 days |
| F&B | 6,200/day | 18m 30s | 12.1% | Entrance, Seating, Counter, Takeout | 30 days |
| Lifestyle | 9,100/day | 5m 20s | 2.9% | Living, Kitchen, Bedroom, Decor, Checkout | 30 days |
| Other | 7,500/day | 4m 00s | 4.0% | Zone A, Zone B, Zone C, Checkout | 30 days |

Sample data includes:
- 30 days of hourly visitor data with realistic daily/weekly patterns
- Zone-level dwell time data
- Simulated heatmap coordinates for 3D view
- AI-generated insights based on sample patterns
- Morning digest content for the most recent "day"

### 3.4 Props Interface

```typescript
interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

interface OnboardingData {
  storeType: 'fashion' | 'beauty' | 'fnb' | 'lifestyle' | 'other';
  storeName: string;
}

// Store type card data
interface StoreTypeOption {
  id: string;
  label: string;
  labelKo: string;
  icon: React.ReactNode;          // Lucide icon
  description: string;            // Subtitle under icon
  sampleMetrics: {
    visitors: number;
    dwell: string;
    conversion: number;
  };
}
```

### 3.5 Animation Specs

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Modal enter | fade-in + scale-in | 300ms | ease-out |
| Store type cards | stagger fade-up, 80ms apart | 150ms each | ease-out |
| Card hover | scale(1.02) + glow | 150ms | ease-out |
| Card select | scale(0.98) -> scale(1) + border color | 200ms | spring |
| Preview metrics appear | fade-in + slide-up | 300ms, 200ms delay | ease-out |
| Step 1 -> Step 2 | slide-left (step 1 out) + slide-in-right (step 2 in) | 250ms | ease-out |
| Step 2 -> Dashboard | scale-out + fade (modal) -> fade-in (dashboard) | 400ms | ease-in-out |
| Sample data banner | slide-down from top | 300ms, 500ms delay | ease-out |
| Tip overlay | fade-in + scale-in, pointing to target | 300ms, 1000ms delay | ease-out |

### 3.6 Responsive Behavior

```
Desktop (xl+):
  Modal: centered, max-width 640px, max-height 80vh
  Store type cards: 3 per row (first row), 2 per row (second row)
  Preview: inline below cards

Tablet (md-lg):
  Modal: centered, max-width 560px
  Store type cards: 3 per row (first row), 2 per row (second row)
  Preview: inline below cards

Mobile (< md):
  Full-screen overlay (not modal)
  Store type cards: 2 per row, scrollable
  Preview: below cards, full width
  Step 2: full width input, button fixed at bottom
```

### 3.7 Implementation Notes for T3/T4

- The onboarding flow is shared between both apps. Implement in `packages/ui/` or duplicate if needed.
- Step 1 auto-advances: selecting a store type shows the preview and "Next" button. No separate submit.
- Step 2 has a single text input. No validation beyond non-empty (min 2 characters).
- On completion, call the `create-store` Edge Function with `{ storeType, storeName, useSampleData: true }`.
- Sample data is seeded server-side (Edge Function) based on `storeType`. The client does not generate sample data.
- The dismissible banner persists until the user connects a real sensor OR clicks "Maybe Later". Store preference in `localStorage` key `neuraltwin-onboarding-banner-dismissed`.
- Tip overlay: use Radix `Tooltip` or a custom floating element. Show once, then set `localStorage` key `neuraltwin-onboarding-tips-shown`.
- AI welcome message: trigger via the AIInsightBubble's `addInsight()` with type `info` after dashboard loads.
- Accessibility: all store type cards are radio buttons (`role="radio"`) within a `role="radiogroup"`. Focus ring is visible. Keyboard arrow keys switch selection.

---

## Appendix: Component Inventory Cross-Reference

### Existing Components (No Changes Needed)

These components from `apps/os-dashboard/src/components/ui/` are unaffected by P0 specs:

- `accordion.tsx`, `alert-dialog.tsx`, `avatar.tsx`, `breadcrumb.tsx`
- `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`
- `command.tsx`, `context-menu.tsx`, `dialog.tsx`, `drawer.tsx`
- `dropdown-menu.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`
- `label.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`
- `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`
- `scroll-area.tsx`, `select.tsx`, `sheet.tsx`, `sidebar.tsx`
- `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `switch.tsx`
- `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`
- `toggle.tsx`, `toggle-group.tsx`, `tooltip.tsx`

### Components to Update

| Component | Change | Priority |
|-----------|--------|----------|
| `glass-card.tsx` | Add accent color support, status border variants | P0 |
| `button.tsx` | Add accent-colored variants (cyan, purple) | P1 |
| `card.tsx` | Extend with glass tiers (sm/md/lg) | P1 |
| `input.tsx` | Add focus glow variant | P1 |

### New Components (P0)

| Component | File | Owner |
|-----------|------|-------|
| `MetricCard` | `metric-card.tsx` | T3 |
| `AIInsightBubble` | `ai-insight-bubble.tsx` | T3 |
| `OnboardingFlow` | `onboarding-flow.tsx` | T3 + T4 |
| `Sparkline` | `sparkline.tsx` (SVG) | T3 |
| `StatusBadge` | `status-badge.tsx` | T3 |

---

*NeuralTwin P0 Component Specs v1.0 | 2026-03-02 | T6 Designer*
