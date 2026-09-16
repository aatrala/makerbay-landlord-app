---
kind: frontend_style
name: Tailwind CSS v4 Design System with Radix UI Primitives and Custom Component Library
category: frontend_style
scope:
    - '**'
source_files:
    - client/src/index.css
    - client/package.json
    - client/src/lib/utils.ts
    - client/src/components/ui/Button.tsx
    - client/src/components/ui/Card.tsx
    - client/src/components/ui/Input.tsx
    - client/src/components/ui/Badge.tsx
    - client/src/components/ui/StatCard.tsx
    - client/src/components/layout/AppLayout.tsx
---

## Approach

The RentLite client is styled exclusively with **Tailwind CSS v4** (via `@tailwindcss/vite` plugin) and a small in-house component library built on top of **Radix UI** primitives. There is no CSS-in-JS, SCSS, or separate stylesheet per component — all styling lives in `client/src/index.css` (global theme + base rules) and inline Tailwind utility classes composed through a shared `cn()` helper.

## Key files and packages

- `client/package.json` — declares Tailwind v4, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, plus Radix UI primitives (`react-dialog`, `react-dropdown-menu`, `react-label`, `react-select`, `react-separator`, `react-slot`, `react-tabs`, `react-tooltip`).
- `client/src/index.css` — single source of truth for design tokens via the Tailwind v4 `@theme` block: custom palette (`--color-ink`, `--color-muted`, `--color-canvas`, `--color-surface`, `--color-line`, `--color-signal`, `--color-signal-soft`, `--color-deep`, `--color-success`, `--color-danger`, `--color-warning`, `--color-violet`, `--color-blue`) and `--font-sans: "Plus Jakarta Sans"`. Also defines base body styles, typography helpers (`.hero-title`, `.eyebrow`), a `rise-in` keyframe animation (`.animate-rise`), global button transitions, a thin scrollbar style, and a `prefers-reduced-motion` media query that zeroes out animations/transitions.
- `client/src/lib/utils.ts` — exports the `cn(...)` utility used by every UI component to merge class names (powered by `clsx` + `tailwind-merge`).
- `client/src/components/ui/` — the internal component library:
  - `Button.tsx` — variants (`primary | secondary | signal | ghost | danger`), sizes (`sm | md | lg`), loading state with `Loader2` spinner, `asChild` support via `@radix-ui/react-slot`.
  - `Card.tsx` — padding variants (`none | sm | md | lg`) plus `CardHeader`, `CardTitle`, `CardDescription` sub-components.
  - `Input.tsx` — `Input`, `Label`, `Textarea`, `Select` primitives sharing consistent border/focus/disabled styles.
  - `Badge.tsx`, `StatCard.tsx` — presentational building blocks.
- `client/src/components/layout/AppLayout.tsx` — responsive sidebar layout using Tailwind breakpoints (`lg:`) to switch between a fixed mobile drawer and a static desktop sidebar; uses `wouter` routing and `lucide-react` icons.

## Architecture and conventions

1. **Design tokens are centralized in Tailwind's `@theme`**. All colors, fonts, and spacing derive from CSS custom properties declared in `index.css`; components never hard-code hex values directly — they reference semantic tokens like `bg-signal`, `text-ink`, `border-line`, `bg-surface`.
2. **Component composition via `cn()`**. Every UI primitive merges its default class string with any user-supplied `className` prop through `cn("default...", className)`, enabling override while preserving defaults.
3. **Variant-driven styling with `class-variance-authority` patterns**. The `Button` component maps variant and size enums to predefined Tailwind class maps (`variantClasses`, `sizeClasses`), keeping visual options explicit and type-safe.
4. **Radix UI as the accessibility layer**. Interactive primitives (dialog, dropdown, label, select, tabs, tooltip, slot) are imported from `@radix-ui/*` and wrapped in lightweight React components that add the project's Tailwind styling on top. This keeps keyboard/screen-reader behavior correct while the visual layer stays in Tailwind utilities.
5. **Icons from `lucide-react`**. All icons are imported by name and sized with Tailwind utility classes (`h-4 w-4`, `h-5 w-5`); there is no icon font or SVG sprite.
6. **Responsive strategy is breakpoint-based Tailwind**. Layout switches at `lg:` (sidebar becomes static, overlay disappears); form controls and cards use fluid spacing without custom media queries beyond the global reduced-motion rule.
7. **Global motion policy**. A single `@keyframes rise-in` and `.animate-rise` class provide page/card entrance animations; a `prefers-reduced-motion: reduce` block globally disables them for accessibility.
8. **No per-component CSS files**. There are no CSS modules, SCSS, or styled-components — styling is purely utility-first Tailwind applied inline in JSX.

## Conventions and constraints observed

- **Colors must come from the `@theme` token set** in `index.css`; components reference them as Tailwind utilities (e.g. `bg-signal`, `text-muted`, `border-line`) rather than raw hex values.
- **Interactive elements use Radix UI primitives** (`@radix-ui/react-*`) for focus management and ARIA semantics; custom wrappers only add presentation classes.
- **All reusable UI goes under `components/ui/`** and is exported as forward-ref'd React components with a `displayName`; pages compose these primitives instead of writing ad-hoc markup.
- **Class merging always goes through `cn()`** from `lib/utils.ts` so that conditional and user-provided classes resolve deterministically via `tailwind-merge`.
- **Typography is limited to the two provided helpers** (`.hero-title`, `.eyebrow`) plus standard Tailwind text utilities; new display types should be added to `index.css` under the same pattern.
- **Animations are centralized**: new keyframes belong in `index.css` and are exposed as reusable classes (e.g. `.animate-rise`); components consume them rather than defining inline `@keyframes`.
- **Accessibility baseline**: focus rings use `focus-visible:ring-2 focus-visible:ring-signal/50` on interactive components; reduced motion is respected globally via the existing media query.