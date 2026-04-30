# Dark / Light Mode Toggle — Design Spec

*Date: 2026-04-30*

---

## Summary

Add a user-togglable dark/light mode to jeredleisey.com. Dark mode is the existing design. Light mode is a new warm-parchment palette derived from the same design language. Preference persists in `localStorage` and defaults to the user's OS preference.

---

## Light Mode Palette

The light mode palette role-reverses the existing tokens. Cream becomes ground, espresso becomes ink. One new token (`my-walnut`) fills the secondary-text gap — stone is too faint for legibility on cream.

| Token | Hex | Light role | Dark role |
|---|---|---|---|
| `my-espresso` | `#1C1714` | Primary text | Background |
| `my-cream` | `#F4EFE6` | Background | Primary text |
| `my-parchment` | `#EAE3D6` | Sidebar / card surface | — |
| `my-walnut` | `#7A6E64` | Secondary text | — |
| `my-stone` | `#C2B8A8` | Muted text / borders | Secondary text / borders |
| `my-amber` | `#CC922F` | Warm detail | Warm detail |
| `my-orange` | `#FF4F00` | Accent | Accent |

---

## Architecture

**Strategy: Tailwind `darkMode: 'class'`**

- Light mode is the CSS baseline (no class on `<html>`)
- Dark mode activates when `<html>` has `class="dark"`
- All current dark-mode styles migrate to `dark:` Tailwind prefixes
- One-time migration cost; clean and idiomatic long-term

**Why not CSS variables?**
The codebase already uses named Tailwind tokens everywhere. CSS variables would require a parallel naming system and add indirection. Class-based variants keep all styling in the existing Tailwind layer with no new abstractions.

---

## Components

### `ThemeProvider` (new, client component)
- Reads `localStorage` key `theme` on mount
- Falls back to `window.matchMedia('prefers-color-scheme: dark')`
- Sets/removes `dark` class on `document.documentElement`
- Wraps children; renders nothing itself
- Provides `useTheme()` context hook returning `{ theme, toggle }`

### `ThemeToggle` (new, client component)
- Icon button: sun (light) / moon (dark)
- Placed at the bottom of `GlobalNav`, above the copyright line
- Calls `toggle()` from `useTheme()`
- No tooltip; icon is self-explanatory
- Styled to match nav — `text-my-stone` hover `text-my-cream` (dark) / `text-my-walnut` hover `text-my-espresso` (light)

---

## Migration Plan

Every component and page that uses a hardcoded dark-mode color class gets `dark:` variants added. Light-mode class becomes the default.

**Mapping:**
| Current class | Light default | Dark variant |
|---|---|---|
| `bg-my-espresso` | `bg-my-cream` | `dark:bg-my-espresso` |
| `text-my-cream` | `text-my-espresso` | `dark:text-my-cream` |
| `text-my-stone` | `text-my-walnut` | `dark:text-my-stone` |
| `border-my-stone/20` | `border-my-stone/30` | `dark:border-my-stone/20` |
| `text-my-espresso/40` | `text-my-stone` | `dark:text-my-espresso/40` |

**Files requiring migration:**
- `tailwind.config.ts` — add `darkMode`, add `my-walnut`
- `app/globals.css` — update prose styles for both modes
- `app/layout.tsx` — wrap with ThemeProvider, update body class
- `components/Sidebar.tsx`
- `components/GlobalNav.tsx`
- `components/SeriesTOC.tsx`
- `components/ProjectsList.tsx`
- `components/WritingList.tsx`
- `app/page.tsx`
- `app/learn/page.tsx`
- `app/learn/[series]/page.tsx`
- `app/learn/[series]/[lesson]/page.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/page.tsx`
- `app/writing/page.tsx`
- `app/writing/[slug]/page.tsx`

---

## Behavior

- **Default:** matches OS `prefers-color-scheme`
- **Persistence:** `localStorage` key `theme` = `'dark'` | `'light'`
- **Toggle:** instant, no animation (color transitions handled by Tailwind `transition-colors` where already present)
- **SSR:** `ThemeProvider` sets class client-side on mount; no flash-of-wrong-theme mitigation needed for this site (Netlify static, acceptable tradeoff)

---

## Out of Scope

- Per-page mode overrides
- Animated mode transition
- Flash-of-wrong-theme (FOUT) prevention via inline script
- System preference auto-follow after manual override

