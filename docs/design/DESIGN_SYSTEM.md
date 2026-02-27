# NeuralTwin Unified Design System

> **Version**: 1.0 | 2026-02-27
> **Status**: Phase 0.1 — Token Definition
> **Owner**: PM Lead + Teammate 6 (Designer)
> **Consumers**: Teammate 3 (OS Dashboard), Teammate 4 (Website)

---

## 1. Design Principles

- **Monochromatic First**: The entire palette is built on achromatic HSL values (`0 0% L%`). Color, when introduced, is semantic (success, warning, error) — never decorative. This gives NeuralTwin its signature industrial/technical feel.
- **Glassmorphism as Brand Language**: Translucent surfaces, chrome-edged borders, and layered depth are the primary visual differentiators. Every interactive surface should feel like polished glass or brushed metal.
- **Progressive Depth**: UI layers communicate hierarchy through shadow intensity, glass opacity, and border luminance — not through color changes. Deeper layers are more opaque; surface layers are more transparent.
- **Shared Tokens, Scoped Extensions**: Both apps consume the same base token set. The OS Dashboard extends the base with 3D-specific tokens (chrome edges, reflection gradients, text-3D) that the Website does not need. Extensions are clearly namespaced and never conflict with base tokens.

---

## 2. Color Tokens

### 2.1 Unified `:root` Base Colors

These are the canonical token values. Both apps must converge on these.

```css
:root {
  /* --- Base --- */
  --background:            0 0% 95%;       /* middle ground: 92% too dark for website, 98% too washed for OS */
  --foreground:            0 0% 5%;

  /* --- Primary (interactive elements, CTAs) --- */
  --primary:               0 0% 10%;
  --primary-foreground:    0 0% 98%;

  /* --- Secondary (less emphasis) --- */
  --secondary:             0 0% 88%;
  --secondary-foreground:  0 0% 10%;

  /* --- Accent (highlights, hover states, badges) --- */
  /* RESOLVED: align with OS convention — accent is a LIGHT background color */
  --accent:                0 0% 96%;
  --accent-foreground:     0 0% 8%;

  /* --- Muted (disabled, placeholder) --- */
  --muted:                 0 0% 90%;
  --muted-foreground:      0 0% 40%;

  /* --- Card / Popover surfaces --- */
  --card:                  0 0% 98%;
  --card-foreground:       0 0% 5%;
  --popover:               0 0% 98%;
  --popover-foreground:    0 0% 5%;

  /* --- Borders --- */
  --border:                0 0% 85%;
  --input:                 0 0% 85%;
  --ring:                  0 0% 15%;

  /* --- Semantic --- */
  --destructive:           0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --success:               142 71% 45%;
  --success-foreground:    0 0% 98%;
  --warning:               38 92% 50%;
  --warning-foreground:    0 0% 5%;
}
```

### 2.2 Dark Mode Colors

```css
.dark {
  --background:            0 0% 5%;
  --foreground:            0 0% 95%;

  --primary:               0 0% 98%;
  --primary-foreground:    0 0% 5%;

  --secondary:             0 0% 15%;
  --secondary-foreground:  0 0% 90%;

  --accent:                0 0% 15%;
  --accent-foreground:     0 0% 95%;

  --muted:                 0 0% 12%;
  --muted-foreground:      0 0% 60%;

  --card:                  0 0% 8%;
  --card-foreground:       0 0% 95%;
  --popover:               0 0% 8%;
  --popover-foreground:    0 0% 95%;

  --border:                0 0% 18%;
  --input:                 0 0% 18%;
  --ring:                  0 0% 85%;

  --destructive:           0 62% 55%;
  --destructive-foreground: 0 0% 98%;
}
```

### 2.3 Conflict Resolution: `--accent`

| Property | Website (old) | OS Dashboard (old) | Unified (new) |
|----------|---------------|---------------------|----------------|
| `--accent` | `0 0% 20%` (dark) | `0 0% 96%` (light) | `0 0% 96%` (light) |
| `--accent-foreground` | `0 0% 98%` (light text) | `0 0% 8%` (dark text) | `0 0% 8%` (dark text) |

**Decision**: Adopt the OS Dashboard convention. Accent is a *subtle highlight background*, not a dark emphasis color. The Website's old accent usage was minimal and maps better to `--primary` anyway.

### 2.4 Conflict Resolution: `--background`

| Property | Website (old) | OS Dashboard (old) | Unified (new) |
|----------|---------------|---------------------|----------------|
| `--background` | `0 0% 98%` | `0 0% 92%` | `0 0% 95%` |

**Decision**: Split the difference at `95%`. Pure `98%` is nearly white and washes out glass effects. `92%` is slightly heavy for marketing pages. `95%` preserves glass contrast while keeping the Website light and airy.

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: 'Pretendard', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
```

**Decision**: Pretendard is the primary typeface (superior Korean/Latin coverage, already the sole font in OS Dashboard). Inter serves as a Latin-only fallback for environments where Pretendard is not loaded. Both apps must load Pretendard as the first web font.

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 0.75rem (12px) | 1rem | 400 | Captions, timestamps |
| `--text-sm` | 0.875rem (14px) | 1.25rem | 400 | Secondary text, labels |
| `--text-base` | 1rem (16px) | 1.5rem | 400 | Body text |
| `--text-lg` | 1.125rem (18px) | 1.75rem | 500 | Subheadings |
| `--text-xl` | 1.25rem (20px) | 1.75rem | 600 | Section titles |
| `--text-2xl` | 1.5rem (24px) | 2rem | 700 | Page headings |
| `--text-3xl` | 1.875rem (30px) | 2.25rem | 700 | Hero subheadlines |
| `--text-4xl` | 2.25rem (36px) | 2.5rem | 800 | Hero headlines |

### 3.3 Font Weights

```css
:root {
  --font-normal:    400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  --font-extrabold: 800;
}
```

---

## 4. Spacing & Radius

### 4.1 Spacing Scale

Standard Tailwind scale applies. No custom spacing tokens needed beyond Tailwind defaults.

### 4.2 Border Radius

```css
:root {
  --radius:    1.25rem;   /* 20px — unified base radius */
  --radius-sm: 0.75rem;   /* 12px — small elements (badges, chips) */
  --radius-md: 1.25rem;   /* 20px — cards, inputs, buttons */
  --radius-lg: 1.5rem;    /* 24px — modals, large panels */
  --radius-xl: 2rem;      /* 32px — hero cards, feature sections */
  --radius-full: 9999px;  /* pills, avatars */
}
```

### 4.3 Conflict Resolution: `--radius`

| Property | Website (old) | OS Dashboard (old) | Unified (new) |
|----------|---------------|---------------------|----------------|
| `--radius` | `1rem` (16px) | `24px` | `1.25rem` (20px) |

**Decision**: `20px` (1.25rem) is the middle ground. This preserves the rounded, approachable feel of the OS Dashboard while not being so aggressive that Website marketing layouts look overly bubbly. OS Dashboard's large panels can use `--radius-lg` (24px) to maintain their current look with zero visual change.

---

## 5. Glassmorphism System

The glassmorphism system is the most critical brand element. The OS Dashboard's implementation is significantly more mature (multi-stop gradients, chrome edges, reflections). The unified system adopts the OS approach as canonical and provides a simplified subset for the Website.

### 5.1 Glass Background

```css
:root {
  /* --- Base glass (Website + simple OS surfaces) --- */
  --glass-bg-simple: hsla(0, 0%, 100%, 0.7);

  /* --- Full glass (OS Dashboard 3D surfaces) --- */
  --glass-bg: linear-gradient(
    165deg,
    hsla(0, 0%, 100%, 0.85) 0%,
    hsla(0, 0%, 100%, 0.65) 25%,
    hsla(0, 0%, 98%, 0.55) 50%,
    hsla(0, 0%, 100%, 0.6)  75%,
    hsla(0, 0%, 100%, 0.8)  100%
  );

  /* --- Glass border --- */
  --glass-border-simple: hsla(0, 0%, 15%, 0.15);

  --glass-border: linear-gradient(
    145deg,
    hsla(0, 0%, 100%, 0.9) 0%,
    hsla(0, 0%, 100%, 0.4) 30%,
    hsla(0, 0%, 80%, 0.2)  60%,
    hsla(0, 0%, 100%, 0.6) 100%
  );
}

.dark {
  --glass-bg-simple: hsla(0, 0%, 10%, 0.7);

  --glass-bg: linear-gradient(
    165deg,
    hsla(0, 0%, 15%, 0.85) 0%,
    hsla(0, 0%, 12%, 0.65) 25%,
    hsla(0, 0%, 10%, 0.55) 50%,
    hsla(0, 0%, 12%, 0.6)  75%,
    hsla(0, 0%, 15%, 0.8)  100%
  );

  --glass-border-simple: hsla(0, 0%, 85%, 0.12);

  --glass-border: linear-gradient(
    145deg,
    hsla(0, 0%, 30%, 0.6)  0%,
    hsla(0, 0%, 20%, 0.3)  30%,
    hsla(0, 0%, 15%, 0.15) 60%,
    hsla(0, 0%, 25%, 0.4)  100%
  );
}
```

### 5.2 Glass Utility Classes

```css
/* Simple glass — suitable for Website cards, navbars */
.glass-simple {
  background: var(--glass-bg-simple);
  border: 1px solid var(--glass-border-simple);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Full glass — OS Dashboard 3D panels */
.glass {
  background: var(--glass-bg);
  border: 1px solid transparent;
  border-image: var(--glass-border) 1;
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
}
```

### 5.3 Glass Reflection (OS Dashboard Extension)

These tokens are scoped to the OS Dashboard. The Website does not need them.

```css
:root {
  --glass-reflection: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0.15) 0%,
    hsla(0, 0%, 100%, 0.05) 40%,
    transparent 60%
  );

  --glass-reflection-dark: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0.08) 0%,
    hsla(0, 0%, 100%, 0.02) 40%,
    transparent 60%
  );
}
```

### 5.4 Conflict Resolution: Glass Format

| Property | Website (old) | OS Dashboard (old) | Unified (new) |
|----------|---------------|---------------------|----------------|
| `--glass-bg` | `0 0% 100% / 0.7` (HSL shorthand) | `linear-gradient(165deg, ...)` | Both: `--glass-bg-simple` (HSL) + `--glass-bg` (gradient) |
| `--glass-border` | `0 0% 15% / 0.15` (HSL shorthand) | `linear-gradient(145deg, ...)` | Both: `--glass-border-simple` (HSL) + `--glass-border` (gradient) |

**Decision**: Provide both variants. The Website uses `--glass-bg-simple` / `--glass-border-simple` (backward compatible with its current approach). The OS Dashboard uses `--glass-bg` / `--glass-border` (its existing gradient system). Both are defined in the shared token set, so either app can adopt the other's style if desired.

---

## 6. Shadow System

### 6.1 Base Shadows (Both Apps)

```css
:root {
  /* Elevation 1 — subtle lift (cards, inputs) */
  --shadow-sm:
    0 1px 2px hsla(0, 0%, 0%, 0.05),
    0 1px 3px hsla(0, 0%, 0%, 0.08);

  /* Elevation 2 — standard card */
  --shadow-md:
    0 2px 4px hsla(0, 0%, 0%, 0.06),
    0 4px 8px hsla(0, 0%, 0%, 0.08);

  /* Elevation 3 — popovers, dropdowns */
  --shadow-lg:
    0 4px 8px hsla(0, 0%, 0%, 0.08),
    0 8px 16px hsla(0, 0%, 0%, 0.1);

  /* Elevation 4 — modals, dialogs */
  --shadow-xl:
    0 8px 16px hsla(0, 0%, 0%, 0.1),
    0 16px 32px hsla(0, 0%, 0%, 0.12);

  /* Sharp edge shadow — Website industrial aesthetic */
  --shadow-sharp:
    4px 4px 0px hsla(0, 0%, 0%, 0.15);

  /* Chrome/metallic highlight — Website CTAs */
  --shadow-chrome:
    0 1px 0 hsla(0, 0%, 100%, 0.5) inset,
    0 -1px 0 hsla(0, 0%, 0%, 0.1) inset,
    0 4px 12px hsla(0, 0%, 0%, 0.15);

  /* Glass panel shadow — Website glass surfaces */
  --shadow-glass:
    0 8px 32px hsla(0, 0%, 0%, 0.08),
    0 2px 8px hsla(0, 0%, 0%, 0.04);
}
```

### 6.2 3D Shadows (OS Dashboard Extension)

These are scoped to the OS Dashboard's 3D interface and are not required by the Website.

```css
:root {
  /* 6-layer 3D depth shadow — OS Dashboard panels */
  --shadow-3d:
    0 1px 2px hsla(0, 0%, 0%, 0.04),
    0 2px 4px hsla(0, 0%, 0%, 0.04),
    0 4px 8px hsla(0, 0%, 0%, 0.04),
    0 8px 16px hsla(0, 0%, 0%, 0.04),
    0 16px 32px hsla(0, 0%, 0%, 0.04),
    0 32px 64px hsla(0, 0%, 0%, 0.04);

  --shadow-3d-dark:
    0 1px 2px hsla(0, 0%, 0%, 0.15),
    0 2px 4px hsla(0, 0%, 0%, 0.12),
    0 4px 8px hsla(0, 0%, 0%, 0.10),
    0 8px 16px hsla(0, 0%, 0%, 0.08),
    0 16px 32px hsla(0, 0%, 0%, 0.06),
    0 32px 64px hsla(0, 0%, 0%, 0.04);
}
```

### 6.3 Chrome Edge Highlights (OS Dashboard Extension)

```css
:root {
  --chrome-top:  linear-gradient(180deg, hsla(0,0%,100%,0.6) 0%, transparent 3px);
  --chrome-left: linear-gradient(90deg,  hsla(0,0%,100%,0.4) 0%, transparent 3px);
}

.dark {
  --chrome-top:  linear-gradient(180deg, hsla(0,0%,100%,0.15) 0%, transparent 3px);
  --chrome-left: linear-gradient(90deg,  hsla(0,0%,100%,0.1)  0%, transparent 3px);
}
```

### 6.4 3D Text Gradients (OS Dashboard Extension)

```css
:root {
  --text-3d-hero: linear-gradient(
    180deg,
    hsl(0, 0%, 5%)  0%,
    hsl(0, 0%, 25%) 50%,
    hsl(0, 0%, 5%)  100%
  );

  --text-3d-label: linear-gradient(
    180deg,
    hsl(0, 0%, 15%) 0%,
    hsl(0, 0%, 35%) 100%
  );
}

.dark {
  --text-3d-hero: linear-gradient(
    180deg,
    hsl(0, 0%, 95%) 0%,
    hsl(0, 0%, 75%) 50%,
    hsl(0, 0%, 95%) 100%
  );

  --text-3d-label: linear-gradient(
    180deg,
    hsl(0, 0%, 85%) 0%,
    hsl(0, 0%, 65%) 100%
  );
}
```

---

## 7. Gradients (Shared)

```css
:root {
  /* Primary gradient — CTAs, hero elements */
  --gradient-primary: linear-gradient(135deg, hsl(0,0%,8%) 0%, hsl(0,0%,25%) 100%);

  /* Metallic sheen — premium surfaces */
  --gradient-metallic: linear-gradient(
    135deg,
    hsl(0,0%,90%) 0%,
    hsl(0,0%,70%) 25%,
    hsl(0,0%,85%) 50%,
    hsl(0,0%,65%) 75%,
    hsl(0,0%,80%) 100%
  );

  /* Chrome highlight — subtle interactive hover */
  --gradient-chrome: linear-gradient(
    180deg,
    hsla(0,0%,100%,0.2) 0%,
    transparent 50%,
    hsla(0,0%,0%,0.05) 100%
  );
}
```

---

## 8. Dark Mode Convention

### Decision: Standardize on `.dark` class

| Aspect | Website (old) | OS Dashboard (old) | Unified (new) |
|--------|---------------|---------------------|----------------|
| Dark mode class | `.light` (rarely used) | `.dark` (132 usages) | `.dark` |
| Default theme | Dark | Light | Light |
| Toggle target | `<html>` element | `<html>` element | `<html>` element |

**Rationale**: The OS Dashboard has 132 references to `.dark`, making it the dominant convention. The Website barely uses `.light` (it defaults to dark). Standardizing on `.dark` means:
- The default (no class on `<html>`) is **light mode**.
- Adding `class="dark"` to `<html>` activates **dark mode**.
- This aligns with Tailwind CSS's `darkMode: 'class'` convention.

### Implementation

```js
// Shared theme toggle logic
function setTheme(mode: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
  localStorage.setItem('neuraltwin-theme', mode);
}
```

---

## 9. Token Architecture: Base vs Extension

```
tokens/
├── base/                    ← Both apps consume these
│   ├── colors               (Section 2.1, 2.2)
│   ├── typography            (Section 3)
│   ├── spacing-radius        (Section 4)
│   ├── glass-simple          (Section 5.1 — simple variants)
│   ├── shadows-base          (Section 6.1)
│   └── gradients             (Section 7)
│
└── extensions/
    └── os-3d/               ← Only OS Dashboard consumes these
        ├── glass-3d          (Section 5.1 — gradient variants)
        ├── glass-reflection  (Section 5.3)
        ├── shadows-3d        (Section 6.2)
        ├── chrome-edges      (Section 6.3)
        └── text-3d           (Section 6.4)
```

This separation ensures the Website does not carry unused 3D tokens, while both apps share the same foundational design language.

---

## 10. Migration Guide

### 10.1 Website (`apps/website/`) — Changes Required

| # | Change | Details | Effort |
|---|--------|---------|--------|
| 1 | **`--accent` inversion** | Change from dark (`0 0% 20%`) to light (`0 0% 96%`). Audit every `accent` usage — if the element needs a dark color, switch it to `primary`. | Medium |
| 2 | **`--background` adjustment** | Change from `0 0% 98%` to `0 0% 95%`. Minimal visual impact. | Low |
| 3 | **`--radius` update** | Change from `1rem` to `1.25rem`. All `rounded-*` utilities via `--radius` update automatically. | Low |
| 4 | **Dark mode class flip** | Replace any `.light { ... }` blocks with inverted `.dark { ... }` blocks. Since dark is the Website's default, ensure `<html class="dark">` is set on load. | Medium |
| 5 | **Font stack update** | Change `font-family` from `Inter, Pretendard, ...` to `Pretendard, Inter, system-ui, ...`. Ensure Pretendard is loaded first in `<head>`. | Low |
| 6 | **Glass token rename** | Rename `--glass-bg` to `--glass-bg-simple` and `--glass-border` to `--glass-border-simple` (or keep old names as aliases during transition). | Low |
| 7 | **Add unified shadow tokens** | Add `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` alongside existing `--shadow-sharp`, `--shadow-chrome`, `--shadow-glass`. | Low |

**Estimated total effort**: 2-3 hours

### 10.2 OS Dashboard (`apps/os-dashboard/`) — Changes Required

| # | Change | Details | Effort |
|---|--------|---------|--------|
| 1 | **`--background` adjustment** | Change from `0 0% 92%` to `0 0% 95%`. Test glass contrast. | Low |
| 2 | **`--primary` adjustment** | Change from `0 0% 8%` to `0 0% 10%`. Barely perceptible. | Low |
| 3 | **`--radius` update** | Change from `24px` to `1.25rem` (20px) for base `--radius`. Add `--radius-lg: 1.5rem` (24px) for large panels that need to retain current appearance. | Low |
| 4 | **Add simple glass tokens** | Add `--glass-bg-simple` and `--glass-border-simple` for potential use in simpler surfaces. No existing code changes needed. | Low |
| 5 | **Font stack update** | Add `Inter` as fallback: `Pretendard, Inter, system-ui, ...`. No visual change since Pretendard is already primary. | Low |
| 6 | **Add unified shadow tokens** | Add `--shadow-sm` through `--shadow-xl` alongside existing `--shadow-3d` tokens. | Low |

**Estimated total effort**: 1 hour

### 10.3 Shared Packages — Changes Required

| Package | Change | Details |
|---------|--------|---------|
| `packages/ui/` | Update component styles to use unified tokens | Ensure `Button`, `Input`, `Card`, `Dialog` reference `--radius`, `--primary`, `--accent` with the new unified values. |
| `packages/types/` | No changes | Type definitions are unaffected by design tokens. |
| `packages/shared/` | No changes | Backend utilities are unaffected by design tokens. |

### 10.4 Migration Order

```
Step 1: Update packages/ui/        (shared components adopt unified tokens)
Step 2: Update apps/website/        (fewer changes, simpler system)
Step 3: Update apps/os-dashboard/   (minimal changes, test 3D surfaces)
Step 4: Remove deprecated aliases   (clean up old token names)
```

Each step should be a separate PR, reviewed by PM Lead before merge.

---

## Appendix A: Complete Token Reference

| Token | Light Value | Dark Value | Used By |
|-------|-------------|------------|---------|
| `--background` | `0 0% 95%` | `0 0% 5%` | Both |
| `--foreground` | `0 0% 5%` | `0 0% 95%` | Both |
| `--primary` | `0 0% 10%` | `0 0% 98%` | Both |
| `--primary-foreground` | `0 0% 98%` | `0 0% 5%` | Both |
| `--secondary` | `0 0% 88%` | `0 0% 15%` | Both |
| `--secondary-foreground` | `0 0% 10%` | `0 0% 90%` | Both |
| `--accent` | `0 0% 96%` | `0 0% 15%` | Both |
| `--accent-foreground` | `0 0% 8%` | `0 0% 95%` | Both |
| `--muted` | `0 0% 90%` | `0 0% 12%` | Both |
| `--muted-foreground` | `0 0% 40%` | `0 0% 60%` | Both |
| `--card` | `0 0% 98%` | `0 0% 8%` | Both |
| `--card-foreground` | `0 0% 5%` | `0 0% 95%` | Both |
| `--border` | `0 0% 85%` | `0 0% 18%` | Both |
| `--radius` | `1.25rem` | `1.25rem` | Both |
| `--radius-lg` | `1.5rem` | `1.5rem` | Both |
| `--glass-bg-simple` | `hsla(0,0%,100%,0.7)` | `hsla(0,0%,10%,0.7)` | Website |
| `--glass-bg` | `linear-gradient(165deg, ...)` | `linear-gradient(165deg, ...)` | OS Dashboard |
| `--shadow-3d` | 6-layer composite | 6-layer composite | OS Dashboard |
| `--shadow-sharp` | `4px 4px 0 ...` | N/A | Website |
| `--font-sans` | `Pretendard, Inter, system-ui` | Same | Both |

---

## Appendix B: Tailwind CSS Configuration Alignment

Both apps should configure Tailwind to consume these tokens consistently:

```js
// tailwind.config.js (shared pattern)
module.exports = {
  darkMode: 'class',   // Standardized: .dark class
  theme: {
    extend: {
      borderRadius: {
        sm:   'calc(var(--radius) - 8px)',   // ~12px
        md:   'calc(var(--radius) - 2px)',   // ~18px
        lg:   'var(--radius)',               // 20px
        xl:   'calc(var(--radius) + 4px)',   // 24px
        '2xl': 'calc(var(--radius) + 12px)', // 32px
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
      },
    },
  },
};
```
