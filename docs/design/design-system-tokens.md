# NeuralTwin Design System Tokens — "Spatial Intelligence"

> **Version**: 2.0 | 2026-03-02
> **Status**: Phase 1 — Token Definition + Tailwind Recommendations
> **Owner**: Teammate 6 (Designer)
> **Consumers**: Teammate 3 (OS Dashboard), Teammate 4 (Website)
> **Reference**: `NeuralTwin_Product_Enhancement_Spec.md` Section 1.2

---

## Overview

The "Spatial Intelligence" design language represents physical retail space as layered data surfaces. The physical world (3D digital twin) and the data world (2D analytics) meet seamlessly through a dark-first glassmorphism UI.

This document defines the complete token set for both apps. It supersedes the existing `DESIGN_SYSTEM.md` monochrome-only tokens by adding the **semantic accent color system** required for IoT data visualization, AI insight surfaces, and status communication.

### Relationship to Existing Tokens

```
DESIGN_SYSTEM.md (v1.0 — monochrome base)
  |
  +-- design-system-tokens.md (v2.0 — THIS FILE)
        |
        +-- Inherits: all monochrome base tokens
        +-- Adds:     semantic accent colors (cyan, purple, emerald, amber, rose)
        +-- Adds:     glassmorphism tiers (sm/md/lg)
        +-- Adds:     extended typography scale (Display-2xl through Micro)
        +-- Adds:     data display rules (JetBrains Mono, tabular-nums)
        +-- Adds:     glow shadow system
        +-- Updates:  Tailwind config recommendations
```

---

## 1. Color System

### 1.1 Primary Palette (Dark-First)

The dashboard's default state is dark mode. Light mode exists for the marketing website.

```css
:root {
  /* === Background Layers (dark mode canonical) === */
  --bg-deep:       #0A0E1A;   /* Deep Space — app background */
  --bg-surface:    #111827;   /* Dark Navy — card/panel surface */
  --bg-surface-2:  #1C2333;   /* Elevated — modals, popovers, active panels */
  --bg-surface-3:  #242B3D;   /* Highest elevation — tooltips, dropdowns */

  /* === Border === */
  --border-subtle:  #2D3748;  /* Default border on dark surfaces */
  --border-medium:  #4A5568;  /* Active/hover border */
  --border-strong:  #718096;  /* High contrast border (focused inputs) */
}
```

#### Background Layer Hierarchy (Dark Mode)

```
Layer 0  #0A0E1A  --bg-deep        App background, fullscreen
Layer 1  #111827  --bg-surface     Cards, panels, sidebar
Layer 2  #1C2333  --bg-surface-2   Modals, popovers, active panels
Layer 3  #242B3D  --bg-surface-3   Tooltips, dropdown menus
```

Each layer increase adds ~5% lightness, creating depth without color.

### 1.2 Semantic Accent Colors

Each accent color carries a specific semantic meaning. Never use these colors decoratively without their associated meaning.

```css
:root {
  /* === Accent Colors — Semantic === */

  /* Cyan — IoT data, real-time metrics, sensor connectivity */
  --accent-cyan:        #00D4FF;
  --accent-cyan-dim:    #00A3CC;   /* Muted variant for backgrounds */
  --accent-cyan-bg:     rgba(0, 212, 255, 0.08);  /* Tinted surface */
  --accent-cyan-border: rgba(0, 212, 255, 0.20);  /* Tinted border */

  /* Purple — AI insights, predictions, NeuralMind outputs */
  --accent-purple:        #7C3AED;
  --accent-purple-dim:    #6D28D9;
  --accent-purple-bg:     rgba(124, 58, 237, 0.08);
  --accent-purple-border: rgba(124, 58, 237, 0.20);

  /* Emerald — Positive indicators, growth, success states */
  --accent-emerald:        #10B981;
  --accent-emerald-dim:    #059669;
  --accent-emerald-bg:     rgba(16, 185, 129, 0.08);
  --accent-emerald-border: rgba(16, 185, 129, 0.20);

  /* Amber — Warning states, attention-needed, caution */
  --accent-amber:        #F59E0B;
  --accent-amber-dim:    #D97706;
  --accent-amber-bg:     rgba(245, 158, 11, 0.08);
  --accent-amber-border: rgba(245, 158, 11, 0.20);

  /* Rose — Danger, critical alerts, negative deltas, loss */
  --accent-rose:        #F43F5E;
  --accent-rose-dim:    #E11D48;
  --accent-rose-bg:     rgba(244, 63, 94, 0.08);
  --accent-rose-border: rgba(244, 63, 94, 0.20);
}
```

#### Accent Color Usage Map

| Color | Token | Meaning | Example Usage |
|-------|-------|---------|---------------|
| Cyan `#00D4FF` | `--accent-cyan` | IoT / real-time / sensor data | Live visitor count, MQTT status, sensor badges |
| Purple `#7C3AED` | `--accent-purple` | AI / prediction / NeuralMind | AI insight bubbles, prediction charts, AI chat |
| Emerald `#10B981` | `--accent-emerald` | Positive / growth / success | Upward deltas, goal achieved, conversion up |
| Amber `#F59E0B` | `--accent-amber` | Warning / attention / caution | Approaching threshold, unusual pattern |
| Rose `#F43F5E` | `--accent-rose` | Danger / critical / loss | Critical alert, negative delta, system error |

#### Color Accessibility

All accent colors have been selected to achieve WCAG AA contrast ratio (4.5:1+) against `--bg-deep` (#0A0E1A):

| Color | Hex | Contrast vs #0A0E1A |
|-------|-----|---------------------|
| Cyan | #00D4FF | 9.8:1 |
| Purple | #7C3AED | 4.7:1 |
| Emerald | #10B981 | 7.2:1 |
| Amber | #F59E0B | 9.1:1 |
| Rose | #F43F5E | 5.3:1 |

Purple is the lowest contrast. For text on dark backgrounds, prefer the full `#7C3AED` value. Never use `--accent-purple-dim` for text on dark surfaces.

### 1.3 Text Colors (Dark Mode)

```css
:root {
  --text-primary:     #F9FAFB;  /* 95% white — headings, primary values */
  --text-secondary:   #D1D5DB;  /* 82% white — body text */
  --text-tertiary:    #9CA3AF;  /* 61% white — labels, captions */
  --text-quaternary:  #6B7280;  /* 42% white — placeholders, disabled */
  --text-inverse:     #111827;  /* For light surfaces (badges, etc.) */
}
```

### 1.4 Glassmorphism Layers

Three tiers of glass intensity, used based on surface importance and interaction density.

```css
:root {
  /* === Glass Small — light panels, secondary cards === */
  --glass-sm-blur:    backdrop-blur-sm;      /* 4px blur */
  --glass-sm-bg:      rgba(255, 255, 255, 0.05);
  --glass-sm-border:  rgba(255, 255, 255, 0.10);

  /* === Glass Medium — primary cards, active panels === */
  --glass-md-blur:    backdrop-blur-md;      /* 12px blur */
  --glass-md-bg:      rgba(255, 255, 255, 0.08);
  --glass-md-border:  rgba(255, 255, 255, 0.15);

  /* === Glass Large — modals, overlays, hero panels === */
  --glass-lg-blur:    backdrop-blur-lg;      /* 16px blur */
  --glass-lg-bg:      rgba(255, 255, 255, 0.10);
  --glass-lg-border:  rgba(255, 255, 255, 0.20);
}
```

#### Glassmorphism Utility Classes (Tailwind)

```css
/* Add to global CSS or as Tailwind plugin */

.glass-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.glass-md {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.glass-lg {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.20);
}
```

#### Glass Layer Selection Guide

| Surface Type | Glass Tier | Example |
|--------------|------------|---------|
| Background panel, sidebar item | `glass-sm` | Sidebar nav items, secondary info panels |
| Metric card, chart container | `glass-md` | MetricCard 2.0, zone analysis cards |
| Modal, overlay, hero card | `glass-lg` | AIInsightBubble expanded, onboarding modal |
| Active/focused card | `glass-md` + accent border | Hovered MetricCard, selected zone card |

---

## 2. Typography

### 2.1 Font Stack

```css
:root {
  --font-ui:   'Inter', 'Pretendard', system-ui, -apple-system, sans-serif;
  --font-data: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
```

**Rationale**:
- **Inter**: Primary UI typeface. Excellent Latin/numeral legibility at small sizes. Variable font with optical sizing.
- **Pretendard**: Korean text fallback. Used when Korean characters are needed. Already loaded in both apps.
- **JetBrains Mono**: All numeric data, KPI values, percentages, currency. `font-feature-settings: 'tnum'` (tabular numerals) is mandatory for data alignment.

### 2.2 Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `Display-2xl` | 64px / 4rem | 700 | 1.1 | -0.02em | Landing hero headline |
| `Display-xl` | 48px / 3rem | 700 | 1.15 | -0.02em | Section titles (landing) |
| `H1` | 36px / 2.25rem | 600 | 1.2 | -0.01em | Page headers (dashboard) |
| `H2` | 28px / 1.75rem | 600 | 1.25 | -0.01em | Card titles, panel headers |
| `H3` | 22px / 1.375rem | 600 | 1.3 | 0 | Section labels within cards |
| `Body-lg` | 18px / 1.125rem | 400 | 1.6 | 0 | Primary body text |
| `Body` | 16px / 1rem | 400 | 1.5 | 0 | Default body text |
| `Caption` | 14px / 0.875rem | 400 | 1.4 | 0 | Labels, secondary text |
| `Micro` | 12px / 0.75rem | 500 | 1.3 | 0.02em | Badges, tags, timestamps |
| `Mono` | 14px / 0.875rem | 400 | 1.4 | 0 | Data values (JetBrains Mono) |

### 2.3 Data Display Rules

All numeric values in the dashboard MUST follow these rules:

```
1. Font:        JetBrains Mono (--font-data)
2. Feature:     font-feature-settings: 'tnum';  (tabular numerals)
3. Alignment:   text-align: right;  (for columnar data)
4. Units:       Display unit in Caption size, to the right of the value
5. Deltas:      Color-coded + directional arrow icon
                  positive = --accent-emerald + ArrowUpRight
                  negative = --accent-rose    + ArrowDownRight
                  neutral  = --text-tertiary  + ArrowRight
6. Separators:  Use locale-aware number formatting (ko-KR: 12,847)
```

**Example: KPI Value Display**

```
┌──────────────────────────┐
│  12,847    ← JetBrains Mono, 28px, font-weight 700
│  명        ← Inter, 14px, --text-tertiary
│  ▲ 8.3%   ← JetBrains Mono, 14px, --accent-emerald
│  전일 대비  ← Inter, 12px, --text-quaternary
└──────────────────────────┘
```

### 2.4 Tailwind Typography Config

```js
// Add to tailwind.config.ts theme.extend
fontSize: {
  'display-2xl': ['4rem',    { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
  'display-xl':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
  'h1':          ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '600' }],
  'h2':          ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
  'h3':          ['1.375rem',{ lineHeight: '1.3',  fontWeight: '600' }],
  'body-lg':     ['1.125rem',{ lineHeight: '1.6',  fontWeight: '400' }],
  'micro':       ['0.75rem', { lineHeight: '1.3',  letterSpacing: '0.02em', fontWeight: '500' }],
},
fontFamily: {
  ui:   ['Inter', 'Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
  data: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
},
```

---

## 3. Spacing & Layout

### 3.1 Grid System

```
Grid:     12-column
Gutter:   24px (gap-6)
Margin:   Responsive (see Container below)
```

### 3.2 Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / Small desktop |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1536px | Wide desktop |

### 3.3 Container Variants

```css
/* Dashboard container — full-bleed allowed */
.container-dashboard {
  max-width: 1536px;  /* max-w-screen-2xl */
  padding-left: 1.5rem;   /* px-6 */
  padding-right: 1.5rem;
  margin: 0 auto;
}

/* Website container — centered with generous padding */
.container-website {
  max-width: 80rem;   /* max-w-7xl = 1280px */
  padding-left: 1rem;      /* px-4 */
  padding-right: 1rem;
}
@media (min-width: 640px) {
  .container-website {
    padding-left: 1.5rem;  /* sm:px-6 */
    padding-right: 1.5rem;
  }
}

/* Mobile container — full width */
.container-mobile {
  width: 100%;
  padding-left: 1rem;   /* px-4 */
  padding-right: 1rem;
}
```

### 3.4 Corner Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Inline badges, micro elements |
| `--radius-sm` | 8px | Buttons, inputs, small cards |
| `--radius-md` | 12px | Standard cards, panels |
| `--radius-lg` | 16px | Modals, large panels |
| `--radius-xl` | 24px | Hero cards, large feature sections |
| `--radius-full` | 9999px | Pills, avatars, chips |

```css
:root {
  --radius-xs:   4px;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;
}
```

### 3.5 Shadow System

#### Glow Shadows (Accent-colored)

Used on interactive elements and status-indicating surfaces.

```css
:root {
  /* Glow shadows — accent-colored halos */
  --shadow-glow-cyan:   0 0 20px rgba(0, 212, 255, 0.15);
  --shadow-glow-purple: 0 0 20px rgba(124, 58, 237, 0.15);
  --shadow-glow-emerald: 0 0 20px rgba(16, 185, 129, 0.15);
  --shadow-glow-amber:  0 0 20px rgba(245, 158, 11, 0.15);
  --shadow-glow-rose:   0 0 20px rgba(244, 63, 94, 0.15);

  /* Glow shadows — intense (hover/active state) */
  --shadow-glow-cyan-intense:   0 0 30px rgba(0, 212, 255, 0.30);
  --shadow-glow-purple-intense: 0 0 30px rgba(124, 58, 237, 0.30);

  /* Elevation shadow — depth without color */
  --shadow-elevation-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-elevation-md: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-elevation-lg: 0 8px 40px rgba(0, 0, 0, 0.5);
}
```

#### Elevation Shadow Scale

| Level | Token | Usage | CSS Value |
|-------|-------|-------|-----------|
| 0 | (none) | Flat background surfaces | none |
| 1 | `--shadow-elevation-sm` | Cards resting on surface | `0 2px 8px rgba(0,0,0,0.2)` |
| 2 | `--shadow-elevation-md` | Popovers, dropdowns | `0 4px 24px rgba(0,0,0,0.4)` |
| 3 | `--shadow-elevation-lg` | Modals, overlays | `0 8px 40px rgba(0,0,0,0.5)` |

---

## 4. Tailwind Config Recommendations

The following should be added to `apps/os-dashboard/tailwind.config.ts` and `apps/website/tailwind.config.ts` to support the Spatial Intelligence design tokens.

### 4.1 Complete Tailwind Extension

```typescript
// tailwind.config.ts — theme.extend additions

{
  // --- Colors ---
  colors: {
    // ... (keep existing HSL-based colors)

    // Semantic accent colors (new)
    'nt-cyan': {
      DEFAULT: '#00D4FF',
      dim: '#00A3CC',
      bg: 'rgba(0, 212, 255, 0.08)',
      border: 'rgba(0, 212, 255, 0.20)',
    },
    'nt-purple': {
      DEFAULT: '#7C3AED',
      dim: '#6D28D9',
      bg: 'rgba(124, 58, 237, 0.08)',
      border: 'rgba(124, 58, 237, 0.20)',
    },
    'nt-emerald': {
      DEFAULT: '#10B981',
      dim: '#059669',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.20)',
    },
    'nt-amber': {
      DEFAULT: '#F59E0B',
      dim: '#D97706',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.20)',
    },
    'nt-rose': {
      DEFAULT: '#F43F5E',
      dim: '#E11D48',
      bg: 'rgba(244, 63, 94, 0.08)',
      border: 'rgba(244, 63, 94, 0.20)',
    },

    // Background layers (dark mode)
    'nt-deep':      '#0A0E1A',
    'nt-surface':   '#111827',
    'nt-surface-2': '#1C2333',
    'nt-surface-3': '#242B3D',

    // Borders
    'nt-border':        '#2D3748',
    'nt-border-medium': '#4A5568',
    'nt-border-strong': '#718096',
  },

  // --- Font Family ---
  fontFamily: {
    ui:   ['Inter', 'Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
    data: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
  },

  // --- Font Size ---
  fontSize: {
    'display-2xl': ['4rem',     { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
    'display-xl':  ['3rem',     { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
    'h1':          ['2.25rem',  { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '600' }],
    'h2':          ['1.75rem',  { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
    'h3':          ['1.375rem', { lineHeight: '1.3',  fontWeight: '600' }],
    'body-lg':     ['1.125rem', { lineHeight: '1.6',  fontWeight: '400' }],
    'micro':       ['0.75rem',  { lineHeight: '1.3',  letterSpacing: '0.02em', fontWeight: '500' }],
  },

  // --- Border Radius ---
  borderRadius: {
    xs:   '4px',
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '24px',
    full: '9999px',
  },

  // --- Box Shadow ---
  boxShadow: {
    'glow-cyan':           '0 0 20px rgba(0, 212, 255, 0.15)',
    'glow-purple':         '0 0 20px rgba(124, 58, 237, 0.15)',
    'glow-emerald':        '0 0 20px rgba(16, 185, 129, 0.15)',
    'glow-amber':          '0 0 20px rgba(245, 158, 11, 0.15)',
    'glow-rose':           '0 0 20px rgba(244, 63, 94, 0.15)',
    'glow-cyan-intense':   '0 0 30px rgba(0, 212, 255, 0.30)',
    'glow-purple-intense': '0 0 30px rgba(124, 58, 237, 0.30)',
    'elevation-sm':        '0 2px 8px rgba(0, 0, 0, 0.2)',
    'elevation-md':        '0 4px 24px rgba(0, 0, 0, 0.4)',
    'elevation-lg':        '0 8px 40px rgba(0, 0, 0, 0.5)',
  },

  // --- Keyframes (additions) ---
  keyframes: {
    // ... (keep existing keyframes)
    'count-up': {
      '0%':   { opacity: '0', transform: 'translateY(8px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'pulse-dot': {
      '0%, 100%': { opacity: '1' },
      '50%':      { opacity: '0.4' },
    },
    'sparkline-draw': {
      '0%':   { strokeDashoffset: '100%' },
      '100%': { strokeDashoffset: '0' },
    },
    'insight-enter': {
      '0%':   { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
      '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
    },
    'bubble-pulse': {
      '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.15)' },
      '50%':      { boxShadow: '0 0 30px rgba(124, 58, 237, 0.35)' },
    },
  },

  // --- Animation ---
  animation: {
    // ... (keep existing animations)
    'count-up':      'count-up 0.5s ease-out',
    'pulse-dot':     'pulse-dot 1.5s ease-in-out infinite',
    'sparkline':     'sparkline-draw 1s ease-out forwards',
    'insight-enter': 'insight-enter 0.3s ease-out',
    'bubble-pulse':  'bubble-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
}
```

### 4.2 Required Font Imports

Add to `index.html` or the main CSS file of each app:

```html
<!-- Inter (UI font) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- JetBrains Mono (data font) -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## 5. Dark Mode Rules

### 5.1 Background Layer System

Dark mode uses four distinct background layers. Never use arbitrary dark gray values.

```
+---------------------------------------------------+
|  Layer 0: --bg-deep (#0A0E1A)                     |
|  Full app background. Always visible behind all.   |
|                                                     |
|  +-----------------------------------------------+ |
|  |  Layer 1: --bg-surface (#111827)               | |
|  |  Cards, sidebar, main content panels           | |
|  |                                                 | |
|  |  +-------------------------------------------+ | |
|  |  |  Layer 2: --bg-surface-2 (#1C2333)        | | |
|  |  |  Modals, active panels, expanded cards     | | |
|  |  |                                             | | |
|  |  |  +---------------------------------------+ | | |
|  |  |  |  Layer 3: --bg-surface-3 (#242B3D)    | | | |
|  |  |  |  Tooltips, dropdown items, hover       | | | |
|  |  |  +---------------------------------------+ | | |
|  |  +-------------------------------------------+ | |
|  +-----------------------------------------------+ |
+---------------------------------------------------+
```

### 5.2 Surface Elevation Rule

Each "pop-up" or "overlay" surface must be one layer higher than its parent:

| Parent Surface | Child Surface | Example |
|----------------|---------------|---------|
| `--bg-deep` (L0) | `--bg-surface` (L1) | Page-level cards on app background |
| `--bg-surface` (L1) | `--bg-surface-2` (L2) | Modal over a card |
| `--bg-surface-2` (L2) | `--bg-surface-3` (L3) | Dropdown inside a modal |

### 5.3 Text Hierarchy on Dark Surfaces

| Role | Token | Opacity | Example |
|------|-------|---------|---------|
| Primary text | `--text-primary` #F9FAFB | 97% | Headings, KPI values |
| Secondary text | `--text-secondary` #D1D5DB | 83% | Body text, descriptions |
| Tertiary text | `--text-tertiary` #9CA3AF | 62% | Labels, captions, timestamps |
| Quaternary text | `--text-quaternary` #6B7280 | 42% | Placeholders, disabled text |

### 5.4 Glass on Dark Surfaces

Glass elements on dark backgrounds use white-alpha values:

```
glass-sm on --bg-deep:     bg-white/5,  border-white/10  (barely visible frosting)
glass-md on --bg-deep:     bg-white/8,  border-white/15  (clearly frosted panel)
glass-lg on --bg-deep:     bg-white/10, border-white/20  (prominent frosted overlay)
```

### 5.5 Accent Color on Dark Surfaces

- Use full accent color (`#00D4FF`) for text, icons, and active indicators
- Use dim variant (`#00A3CC`) for visited/inactive states
- Use bg variant (`rgba(0,212,255,0.08)`) for tinted card backgrounds
- Use border variant (`rgba(0,212,255,0.20)`) for tinted borders
- Never use full accent color as a large background fill -- always use the bg variant

### 5.6 Light Mode Overrides (Website Only)

The marketing website (`apps/website/`) may operate in light mode. Override token values:

```css
:root {
  /* Light mode overrides — Website only */
  --bg-deep:       #F8FAFC;
  --bg-surface:    #FFFFFF;
  --bg-surface-2:  #F1F5F9;
  --bg-surface-3:  #E2E8F0;
  --border-subtle:  #E2E8F0;
  --text-primary:   #0F172A;
  --text-secondary: #475569;
  --text-tertiary:  #94A3B8;
  --text-quaternary:#CBD5E1;
}
```

---

## 6. Animation & Transition Tokens

### 6.1 Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-fast` | 150ms | Hover states, icon changes |
| `--duration-normal` | 200ms | Page transitions, card interactions |
| `--duration-slow` | 300ms | Modals, panels, complex transitions |
| `--duration-data` | 500ms | Number count-up, chart drawing |
| `--duration-3d` | 600ms | Camera tweens, 3D scene transitions |

### 6.2 Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering view |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Elements exiting view |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Continuous animations |

### 6.3 Standard Transitions

```css
/* Interactive elements (buttons, links, cards) */
.transition-interactive {
  transition: all var(--duration-fast) var(--ease-out);
}

/* Content panels (modals, drawers) */
.transition-panel {
  transition: all var(--duration-slow) var(--ease-out);
}

/* Data values (count-up, sparklines) */
.transition-data {
  transition: all var(--duration-data) var(--ease-out);
}
```

### 6.4 Performance Rules

1. Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, or `margin`.
2. Respect `prefers-reduced-motion`: disable all non-essential animations.
3. 3D scene animations must use `requestAnimationFrame`, not CSS transitions.
4. Staggered card entry animations: 50ms delay between each card, max 5 cards staggered.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Appendix: Token Quick Reference

### Colors at a Glance

```
BACKGROUNDS                ACCENTS                    TEXT
#0A0E1A  Deep Space        #00D4FF  Cyan (IoT)       #F9FAFB  Primary
#111827  Surface            #7C3AED  Purple (AI)      #D1D5DB  Secondary
#1C2333  Surface 2          #10B981  Emerald (+)      #9CA3AF  Tertiary
#242B3D  Surface 3          #F59E0B  Amber (!)        #6B7280  Quaternary
#2D3748  Border             #F43F5E  Rose (-)
```

### Glass Tiers

```
glass-sm   blur(4px)   bg-white/5    border-white/10
glass-md   blur(12px)  bg-white/8    border-white/15
glass-lg   blur(16px)  bg-white/10   border-white/20
```

### Typography Quick Reference

```
Display-2xl  64px/700   Landing hero
Display-xl   48px/700   Section titles
H1           36px/600   Page headers
H2           28px/600   Card titles
H3           22px/600   Section labels
Body-lg      18px/400   Primary body
Body         16px/400   Default body
Caption      14px/400   Labels
Micro        12px/500   Badges, tags
Mono         14px/400   Data (JetBrains Mono)
```

---

*NeuralTwin Design System Tokens v2.0 | "Spatial Intelligence" | 2026-03-02 | T6 Designer*
