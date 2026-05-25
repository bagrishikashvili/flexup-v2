# ClickUp — DESIGN.md

> AI-readable design system extracted from clickup.com.
> Drop this file into your project root and tell your coding agent:
> *"Use DESIGN.md as the source of truth for all styling decisions."*

---

## 1. Visual Theme & Atmosphere

**Mood:** Energetic productivity. Vibrant but disciplined. The interface feels like a high-performance dashboard that just happens to be friendly.

**Density:** Information-dense but breathable. ClickUp pages and product surfaces pack a lot — sidebars, panels, tables, statuses, avatars — yet rely on generous internal padding and clear visual hierarchy to prevent overwhelm.

**Design philosophy:**
- Gradients are the brand signature. Solid colors anchor; gradients energize.
- Productivity-first: every visual choice serves clarity of task, state, and progress.
- Modern SaaS dashboard meets consumer-app warmth. Crisp geometry, rounded corners, soft shadows.
- "Everything app" aesthetic — the UI must scale from a single task card to a complex Gantt chart without losing identity.
- Light mode is canonical; dark mode is a first-class peer, not an afterthought.

**Avoid:** Skeuomorphism, heavy borders, muted/desaturated palettes, traditional enterprise grayness.

---

## 2. Color Palette & Roles

### Brand Core

| Token | Hex | Role |
|---|---|---|
| `--brand-pink` | `#FF02F0` | Gradient stop A — magenta endpoint of the "warm" brand gradient |
| `--brand-orange` | `#FC6D2D` | Gradient stop B — warm endpoint, used for energy/AI moments |
| `--brand-purple` | `#6647F0` | Gradient stop A — primary purple, used solid for icons and accents |
| `--brand-blue` | `#0091FF` | Gradient stop B — primary blue, used for links and key actions |
| `--brand-violet-legacy` | `#7B68EE` | Cornflower — legacy primary, still common in product surfaces |

### Signature Gradients

```css
--gradient-warm:   linear-gradient(135deg, #FF02F0 0%, #FC6D2D 100%);
--gradient-cool:   linear-gradient(135deg, #6647F0 0%, #0091FF 100%);
--gradient-brain:  linear-gradient(135deg, #FF02F0 0%, #6647F0 50%, #0091FF 100%);
```
- **Warm gradient (pink → orange)**: used for AI / Brain features, attention-grabbing CTAs, hero moments.
- **Cool gradient (purple → blue)**: the default brand gradient. Logo, primary buttons, focus states.
- **Brain gradient (pink → purple → blue)**: reserved for ClickUp Brain / AI surfaces only. Do not use for general UI.

### Neutrals (Light Mode)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#FFFFFF` | Page background |
| `--bg-subtle` | `#F9FAFB` | Sidebar, panel backgrounds |
| `--bg-muted` | `#F3F4F6` | Hover states, input fields |
| `--border` | `#E5E7EB` | Default dividers, card borders |
| `--border-strong` | `#D1D5DB` | Input borders, table dividers |
| `--text-primary` | `#292D34` | Body text, headlines (Shark) |
| `--text-secondary` | `#6B7280` | Captions, metadata, helper text |
| `--text-tertiary` | `#9CA3AF` | Placeholders, disabled labels |

### Neutrals (Dark Mode)

| Token | Hex | Role |
|---|---|---|
| `--bg-dark` | `#1A1A1F` | Page background |
| `--bg-subtle-dark` | `#22232A` | Sidebar, panel backgrounds |
| `--bg-muted-dark` | `#2C2D36` | Hover, elevated surfaces |
| `--border-dark` | `#3A3B45` | Dividers, card borders |
| `--text-primary-dark` | `#F5F5F7` | Body text |
| `--text-secondary-dark` | `#A1A1AA` | Captions, metadata |

### Semantic (Status Colors)

ClickUp's status system is famously colorful — these map directly to task statuses (To Do / In Progress / Done / Blocked etc.).

| Token | Hex | Role |
|---|---|---|
| `--status-red` | `#E50000` | Blocked, error, overdue |
| `--status-orange` | `#FF9800` | Warning, pending review |
| `--status-yellow` | `#FFC107` | In progress, attention |
| `--status-green` | `#4CAF50` | Complete, success |
| `--status-cyan` | `#00BCD4` | Info, neutral active |
| `--status-blue` | `#2196F3` | Standard active state |
| `--status-pink` | `#FD71AF` | Custom / highlight |
| `--status-gray` | `#C2C6C8` | To do, inactive |

**Usage rule:** Status colors appear as solid dots, pill badges, or 4px left borders on rows. Never as large fills — they must remain readable signals, not decorative blocks.

---

## 3. Typography Rules

**Three families, strict roles. Do not mix.**

| Family | Usage | Weights |
|---|---|---|
| **Plus Jakarta Sans** | Headlines, hero text, marketing display | 500, 600, 700, 800 |
| **Inter** | Body text, UI labels, buttons, tables | 400, 500, 600 |
| **Sometype Mono** | Captions, code, illustration labels, metadata | 400, 500 |

```css
--font-display: "Plus Jakarta Sans", system-ui, sans-serif;
--font-body:    "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    "Sometype Mono", "JetBrains Mono", ui-monospace, monospace;
```

### Hierarchy

| Level | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| Hero (H1 marketing) | Plus Jakarta Sans | 64px / 4rem | 700 | 1.05 | -0.02em |
| H1 (app) | Plus Jakarta Sans | 32px | 700 | 1.15 | -0.01em |
| H2 | Plus Jakarta Sans | 24px | 600 | 1.2 | -0.01em |
| H3 | Plus Jakarta Sans | 20px | 600 | 1.3 | 0 |
| H4 | Inter | 16px | 600 | 1.4 | 0 |
| Body Large | Inter | 16px | 400 | 1.6 | 0 |
| Body | Inter | 14px | 400 | 1.5 | 0 |
| Small | Inter | 13px | 400 | 1.45 | 0 |
| Caption | Sometype Mono | 12px | 500 | 1.4 | 0.02em (often UPPERCASE) |
| Code | Sometype Mono | 13px | 400 | 1.5 | 0 |

**Rules:**
- Headlines use tight tracking (negative letter-spacing) for confidence.
- Mono captions are frequently UPPERCASE with slight tracking — used for section eyebrows ("INFINITE MEMORY", "PROJECTS").
- Never use Plus Jakarta Sans for body — too distinctive, fatigues at small sizes.
- Never use Inter for hero headlines — lacks the marketing character.

---

## 4. Component Stylings

### Buttons

**Primary**
```
background: var(--gradient-cool);
color: #FFFFFF;
font: 500 14px/1 Inter;
padding: 10px 18px;
border-radius: 8px;
border: none;
box-shadow: 0 1px 2px rgba(102, 71, 240, 0.2);
transition: transform 120ms ease, box-shadow 120ms ease;
```
- Hover: `transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 71, 240, 0.3);`
- Active: `transform: translateY(0);`
- Disabled: `background: #E5E7EB; color: #9CA3AF;` (no gradient)

**Secondary**
```
background: #FFFFFF;
color: #292D34;
border: 1px solid #E5E7EB;
padding: 10px 18px;
border-radius: 8px;
```
- Hover: `background: #F9FAFB; border-color: #D1D5DB;`

**Ghost / Tertiary**
- No border, no background. Color `#6647F0`. Underline on hover.

**AI / Brain CTA**
- Uses `--gradient-warm` (pink→orange) instead of cool. Reserved for AI features.

### Cards

```
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 12px;
padding: 20px 24px;
box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
```
- Hover (clickable cards): `border-color: #D1D5DB; box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);`
- Dark mode: `background: #22232A; border-color: #3A3B45;`

### Inputs

```
background: #FFFFFF;
border: 1px solid #D1D5DB;
border-radius: 8px;
padding: 10px 12px;
font: 400 14px Inter;
color: #292D34;
```
- Focus: `border-color: #6647F0; box-shadow: 0 0 0 3px rgba(102, 71, 240, 0.15);`
- Error: `border-color: #E50000; box-shadow: 0 0 0 3px rgba(229, 0, 0, 0.12);`
- Placeholder color: `#9CA3AF`.

### Navigation (Sidebar)

- Background: `#F9FAFB` (light) / `#22232A` (dark).
- Width: 240–280px, collapsible to 56px (icon-only).
- Items: 36px height, 8px border-radius, 10px horizontal padding.
- Active item: `background: rgba(102, 71, 240, 0.1); color: #6647F0;` with a 3px left-edge accent in `--brand-purple`.
- Hover: `background: rgba(0, 0, 0, 0.04);`
- Icons: 18px, stroke 1.5px, color matches text.

### Task Row / List Item

- Height: 40px minimum.
- 4px left border = status color (the signature ClickUp pattern).
- Padding: 8px 12px.
- Hover: `background: #F9FAFB;`.
- Contains in order: checkbox → status pill → task name → assignee avatar(s) → due date → priority flag.

### Status Pills

```
display: inline-flex;
padding: 2px 10px;
border-radius: 999px;
font: 500 11px/1.4 Inter;
text-transform: uppercase;
letter-spacing: 0.04em;
background: <status-color>;
color: #FFFFFF;
```

### Avatars

- Circle. Sizes: 20px (inline), 24px (table), 32px (default), 40px (header).
- Fallback: solid color (deterministic from name hash) + white initials in Inter 600.
- Stack overlap: -8px margin-left, 2px white ring (`box-shadow: 0 0 0 2px #FFFFFF;`).

### Modals

- Border-radius: 16px.
- Backdrop: `rgba(16, 24, 40, 0.5)` with `backdrop-filter: blur(4px)`.
- Padding: 24px.
- Max-width: 560px default, 720px for forms.
- Close button: top-right, 32px square, ghost style.

### Tooltips

- Background: `#292D34` (always dark, even in light mode).
- Color: `#FFFFFF`.
- Font: Inter 500 12px.
- Padding: 6px 10px.
- Border-radius: 6px.
- Delay: 400ms in, 0ms out.

---

## 5. Layout Principles

### Spacing Scale (4px base)

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Grid

- App shell: fixed left sidebar (240–280px) + flexible main + optional right panel (320–400px).
- Marketing: 1200px max container, 12-column grid, 24px gutters.
- Card grids: `repeat(auto-fill, minmax(280px, 1fr))` with 16–24px gap.

### Whitespace Philosophy

- **Marketing pages**: generous. Sections use 80–120px vertical padding. Hero areas breathe.
- **Product UI**: tight but consistent. 12–16px is the workhorse. Never stack content with less than 8px between distinct elements.
- **Density toggle**: ClickUp itself ships density settings (Comfortable / Compact). Default to Comfortable; compact reduces row heights by ~25%.

### Border Radii

```css
--radius-sm: 4px;   /* badges, tags */
--radius-md: 8px;   /* buttons, inputs */
--radius-lg: 12px;  /* cards, panels */
--radius-xl: 16px;  /* modals, large surfaces */
--radius-full: 999px; /* pills, avatars */
```

---

## 6. Depth & Elevation

ClickUp uses shadows sparingly — borders do most of the structural work. Shadows are reserved for floating/overlapping surfaces.

```css
--shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.04);   /* resting cards */
--shadow-sm: 0 2px 4px rgba(16, 24, 40, 0.06);   /* hover cards */
--shadow-md: 0 4px 12px rgba(16, 24, 40, 0.08);  /* dropdowns, popovers */
--shadow-lg: 0 12px 32px rgba(16, 24, 40, 0.12); /* modals */
--shadow-xl: 0 24px 64px rgba(16, 24, 40, 0.16); /* command palette */

/* Brand-colored glow for primary CTAs and focus rings */
--glow-purple: 0 4px 16px rgba(102, 71, 240, 0.25);
--glow-pink:   0 4px 16px rgba(255, 2, 240, 0.20);
```

**Surface hierarchy (z-index):**
1. Page background — flat.
2. Cards / panels — `--shadow-xs`, 1px border.
3. Hover surfaces — `--shadow-sm`.
4. Dropdowns, menus — `--shadow-md`.
5. Modals — `--shadow-lg` + backdrop blur.
6. Toasts, command palette — `--shadow-xl`.

---

## 7. Do's and Don'ts

### Do ✅
- Use the cool gradient (purple→blue) as the default brand expression.
- Reserve the warm gradient (pink→orange) and Brain gradient for AI features only.
- Use status colors as **signals** — small dots, pills, 4px borders.
- Let typography do the heavy hierarchy work (Plus Jakarta for display, Inter for everything else).
- Use generous padding inside cards and panels — the brand reads as confident, not cramped.
- Apply rounded corners consistently (8px is the workhorse).
- Treat dark mode as equally polished — do not just invert colors.
- Use Sometype Mono for eyebrow labels (UPPERCASE, tracked) — it's a signature touch.

### Don't ❌
- Don't fill large areas with status colors (red/yellow/green). They lose meaning and overwhelm.
- Don't use the warm gradient on non-AI surfaces — it's reserved.
- Don't use Plus Jakarta Sans for body copy — it's a display face.
- Don't use heavy borders (>1px). ClickUp's density is achieved with hairlines and color, not thick lines.
- Don't apply gradients to text in body content — only to logo, hero headlines, and selected accents.
- Don't use pure black (`#000000`) for text — use `#292D34` (Shark).
- Don't stack more than two shadows on a single element.
- Don't mix the legacy `#7B68EE` Cornflower with the new `#6647F0` purple in the same view.

---

## 8. Responsive Behavior

### Breakpoints

```css
--bp-sm:  640px;   /* mobile landscape, large phones */
--bp-md:  768px;   /* tablet portrait */
--bp-lg:  1024px;  /* tablet landscape, small laptop */
--bp-xl:  1280px;  /* desktop */
--bp-2xl: 1536px;  /* large desktop */
```

### Touch Targets

- Minimum 44×44px on mobile (iOS HIG baseline).
- Desktop UI controls can drop to 32px (rows, icon buttons) given precise pointer input.

### Collapsing Strategy

| Surface | Mobile (<768px) | Tablet (768–1024px) | Desktop (>1024px) |
|---|---|---|---|
| Sidebar | Hidden, overlay drawer on hamburger | Icon-only rail (56px) | Full sidebar (240–280px) |
| Right panel | Bottom sheet or full-screen modal | Slide-over drawer | Inline panel (320–400px) |
| Task list | Card layout (stacked) | Compact table | Full table with all columns |
| Headlines | Drop hero size 64px → 36px | 48px | 64px |
| Gradients | Same | Same | Same — gradients scale beautifully |

**Mobile-specific rules:**
- Bottom nav bar replaces sidebar (5 max items).
- FAB (floating action button, 56px circle, cool gradient) for primary creation action.
- Modals become full-screen sheets below 640px.

---

## 9. Agent Prompt Guide

### Quick Color Reference

```
Primary brand:     #6647F0 (purple)
Primary accent:    #0091FF (blue)
Brand gradient:    linear-gradient(135deg, #6647F0, #0091FF)
AI gradient:       linear-gradient(135deg, #FF02F0, #FC6D2D)
Text:              #292D34
Background:        #FFFFFF
Subtle background: #F9FAFB
Border:            #E5E7EB
```

### Ready-to-Use Prompts

**"Build a ClickUp-style task card"**
> White background, 12px border-radius, 1px `#E5E7EB` border, 20px padding. 4px left border in status color (`#4CAF50` for done, `#FFC107` for in progress). Task title in Inter 600 14px `#292D34`. Below: row of 24px avatar(s) overlapping by 8px, due date in Sometype Mono 12px `#6B7280`, priority flag icon in `--status-orange`. Hover: shadow `0 4px 12px rgba(16, 24, 40, 0.08)`.

**"Build a ClickUp-style dashboard"**
> Left sidebar 260px wide, `#F9FAFB` background. Main area `#FFFFFF`. Top bar 56px tall with breadcrumb (Sometype Mono 12px UPPERCASE) on left and avatar stack + primary button on right. Primary button uses cool gradient. Section headers in Plus Jakarta Sans 24px 600. Metric cards in a `repeat(auto-fill, minmax(240px, 1fr))` grid with 16px gap.

**"Build a ClickUp-style hero section"**
> Headline in Plus Jakarta Sans 64px 700, line-height 1.05, tracking -0.02em. The last word or phrase wrapped in a `<span>` with `background: linear-gradient(135deg, #6647F0, #0091FF); -webkit-background-clip: text; color: transparent;`. Eyebrow above: Sometype Mono 12px 500 UPPERCASE, color `#6647F0`, letter-spacing 0.04em. Subhead in Inter 18px 400 `#6B7280`. Primary CTA uses cool gradient with shadow `0 4px 16px rgba(102, 71, 240, 0.25)`.

**"Build a ClickUp Brain (AI) surface"**
> Use the warm or Brain (pink→purple→blue) gradient. Sparkle/star iconography. Border can be a gradient stroke: `border: 1px solid transparent; background: linear-gradient(#FFF, #FFF) padding-box, linear-gradient(135deg, #FF02F0, #6647F0, #0091FF) border-box;`. Brain content typically uses Sometype Mono for emphasis labels.

---

### File credits

Based on the public brand guidelines at https://clickup.com/brand and observed product UI patterns.
Format follows the [Google Stitch DESIGN.md spec](https://stitch.withgoogle.com/docs/design-md/overview/) with extensions matching the [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 9-section structure.

Provided as-is. ClickUp™ is a trademark of Mango Technologies, Inc. This document exists to help AI agents generate UI consistent with ClickUp's public visual identity.
