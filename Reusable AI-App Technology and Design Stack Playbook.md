# Reusable AI-App Technology and Design Stack Playbook

## Executive summary

The frontend stack used for the Agentic AI Landscape Explorer is a **React-first, TypeScript-based interface stack** with Tailwind CSS, shadcn/ui primitives, Lucide icons, Vite, and responsive browser validation. The design stack combines an editorial dashboard structure with high-contrast typography, warm signal colors, soft depth, compact information cards, progressive disclosure, and purposeful motion.

The most reusable principle is to separate the application into four layers:

1. **Product structure:** routes, page sections, state, filters, comparison flows, and progressive disclosure.
2. **UI primitives:** buttons, badges, cards, dialogs, inputs, tables, drawers, tooltips, and icons.
3. **Visual language:** typography, palette, spacing, radii, shadows, borders, gradients, and motion.
4. **Quality loop:** type checking, production build, responsive screenshots, and semantic interaction testing.

## 1. Technology stack

| Layer | Stack | Purpose | Recommended default |
|---|---|---|---|
| Frontend framework | React 19 | Component-based UI and stateful interactions | Use functional components and hooks |
| Language | TypeScript | Type safety and maintainable component contracts | Define domain types before rendering complex data |
| Build tool | Vite | Fast local development and production bundling | Use Vite for lightweight web applications |
| Styling | Tailwind CSS 4 | Utility-first responsive styling | Use semantic design tokens plus utility classes |
| Component primitives | shadcn/ui | Accessible, composable UI primitives | Customize primitives instead of inventing every control |
| Icons | Lucide React | Consistent, lightweight interface iconography | Use icons to reinforce labels, not replace them |
| Routing | Wouter | Small client-side routing layer | Use for compact static or client-heavy apps |
| Motion | CSS transitions and restrained keyframes | Interaction feedback and entrance polish | Animate opacity and transform only |
| Data visualization | Recharts when needed | Charts and analytical views | Add only when a chart improves a decision |
| Notifications | Sonner | Toasts and lightweight feedback | Use for reversible, non-blocking status updates |
| Validation | TypeScript compiler and production build | Static correctness and bundle validation | Run `pnpm check` and `pnpm build` before delivery |
| Browser QA | Semantic browser inspection and screenshots | Functional and visual verification | Test desktop, mobile, search, filters, modals, and tables |
| Hosting | Manus WebDev preview or static hosting | Shareable browser deployment | Bind the app to a public preview or deployment URL |

## 2. Recommended project structure

```text
client/
  index.html
  src/
    App.tsx
    index.css
    main.tsx
    pages/
      Home.tsx
      NotFound.tsx
    components/
      ui/
        button.tsx
        card.tsx
        dialog.tsx
        input.tsx
        badge.tsx
        table.tsx
        tooltip.tsx
      DomainCard.tsx
      ProfileDrawer.tsx
      CompareTray.tsx
    contexts/
    hooks/
    lib/
      utils.ts
server/
shared/
package.json
vite.config.ts
tsconfig.json
```

For a static single-user app, keep the first implementation client-side. Upgrade to a backend-backed scaffold only when the app needs authentication, private data, scheduled jobs, server-side secrets, collaboration, or persistent storage.

## 3. Frontend architecture pattern

### 3.1 Define the domain model first

Complex interfaces become easier to maintain when the content schema is explicit. For example:

```ts
type Product = {
  name: string;
  maker: string;
  category: string;
  tagline: string;
  summary: string;
  bestFor: string[];
  capabilities: string[];
  connectors: string[];
  strengths: string[];
  watchouts: string[];
  score: number;
  maturity: "Frontier" | "Scaled" | "Emerging";
  confidence: "High" | "Medium" | "Low";
  links: string[];
};
```

This model supports cards, tables, drawers, comparisons, filters, and future API migration without duplicating content.

### 3.2 Keep state shallow and purposeful

Use local React state for view state such as search terms, active filters, selected comparison items, modal visibility, and display mode. Derive filtered collections with `useMemo` when filtering depends on multiple inputs. Avoid putting static domain data into state unless the user can modify it.

### 3.3 Use progressive disclosure

Show the minimum information needed to choose an item in a card. Open a drawer or modal for full capabilities, connectors, strengths, tradeoffs, sources, and uncertainty. This preserves scanability without sacrificing depth.

### 3.4 Design for two reading modes

Provide both a visual card view and a compact matrix/table view. Cards are better for discovery and qualitative judgment. Tables are better for scanning, sorting, and comparing many items.

### 3.5 Build comparison as a first-class interaction

A comparison tray should support a small bounded set of items, usually two to four. Keep the tray persistent while the user explores. Make removal obvious. Open comparison from the tray rather than forcing users to restart their search.

## 4. Design stack

### 4.1 Design direction

The interface uses an **editorial intelligence dashboard** direction. It combines the authority of a research publication with the utility of an operations console.

| Design decision | Implementation |
|---|---|
| Primary mood | Precise, optimistic, analytical, and premium |
| Primary surface | Warm off-white background with white content cards |
| Main accent | Signal orange for calls to action and emphasis |
| Analytical surface | Deep navy for high-contrast insight sections and comparison tray |
| Secondary accents | Violet, sky blue, emerald, teal, and pink for capability categories |
| Display typography | Plus Jakarta Sans, heavy weights, tight tracking |
| Body typography | Plus Jakarta Sans, readable medium weights, generous line height |
| Technical labels | Uppercase micro-labels with wide letter spacing |
| Icon style | Lucide outline icons with restrained sizing |
| Shape language | Rounded cards, rounded controls, small-radius fields |
| Depth | Soft shadows, thin borders, translucent backdrops, subtle blur |
| Motion | Short entrance reveals, hover lift, active scale, and drawer transitions |

### 4.2 Typography

Use a display hierarchy with large, heavy headings and quieter supporting text.

```css
body {
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.97;
}

.eyebrow {
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
```

Use a large display heading only once per page. Use a clear section heading scale for subsequent sections. Avoid using bold weight for every sentence; reserve the strongest weight for titles, labels, scores, and primary actions.

### 4.3 Palette

```css
:root {
  --ink: #0f172a;
  --muted: #64748b;
  --canvas: #f7f8fb;
  --surface: #ffffff;
  --line: #e2e8f0;
  --signal: #f97316;
  --signal-soft: #fff7ed;
  --deep: #020617;
  --success: #10b981;
  --violet: #7c3aed;
  --blue: #0ea5e9;
}
```

Use orange for action and signal, not for every decorative element. Use deep navy sparingly so it retains emphasis. Use semantic color families consistently: green for confidence or success, violet for tools and integrations, blue for ecosystem context, and slate for uncertainty or neutral metadata.

### 4.4 Spacing and layout

Use a compact spacing scale for controls and a generous spacing scale for sections.

| Context | Recommended spacing |
|---|---:|
| Icon-to-label gap | 0.5rem |
| Card internal padding | 1.25rem |
| Card grid gap | 1rem |
| Section heading to body | 0.75rem |
| Section vertical padding | 3.5–5rem |
| Desktop content gutter | 2–2.5rem |
| Maximum content width | 1,280–1,500px |
| Mobile content gutter | 1.25rem |

Prefer asymmetric layouts for hero sections. A common pattern is a large text block on the left and a capability summary panel on the right. On mobile, stack the two regions and keep the text width comfortable.

### 4.5 Cards and surfaces

Use cards as decision units rather than generic containers. Each card should have a clear identity, one-sentence positioning, a short summary, use-case tags, and a direct next action.

```tsx
<article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
  {/* identity, summary, tags, score, action */}
</article>
```

Use soft shadows instead of heavy borders for hierarchy. Use borders where the user needs to understand grouping or table structure.

### 4.6 Controls

Use dark filled buttons for primary actions, white bordered buttons for secondary actions, and orange filled buttons for high-signal actions such as “Compare” or “Run”. Every control should have a visible hover state, active state, focus ring, and disabled state.

```css
button {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

button:active {
  transform: scale(0.97);
}
```

### 4.7 Motion

Motion should clarify state changes. Use entrance animation for repeated content, hover lift for interactive cards, and opacity/transform for drawers and modals. Avoid animating layout properties such as width, height, margin, or padding.

```css
@keyframes rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: rise-in 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 5. Reusable component recipes

| Component | Purpose | Important behavior |
|---|---|---|
| Hero section | Establish the product promise | Large title, concise value proposition, one primary CTA, one secondary CTA |
| Capability panel | Communicate a product or system’s breadth | Four to six progress bars or metrics, one explanatory insight |
| Filter bar | Narrow a large dataset | Search, category chips, optional filter drawer, reset control |
| Profile card | Support fast comparison | Identity, tagline, summary, tags, score, profile action, compare toggle |
| Matrix table | Support high-density scanning | Sticky headers when needed, horizontal scroll on mobile, semantic columns |
| Profile drawer | Show depth without navigation loss | Sticky header, score, best-for tags, capabilities, connectors, strengths, watch-outs, sources |
| Compare tray | Preserve selected items during browsing | Bounded selection, visible removal, compare CTA, mobile stacking |
| Signal section | Explain trends or strategic patterns | Dark analytical surface, numbered cards, examples, expand/collapse |
| Evidence note | Prevent overclaiming | Confidence level, date, source posture, uncertainty caveat |

## 6. Content and evidence design

For research-heavy applications, store more than a summary. Use separate fields for capabilities, integrations, strengths, tradeoffs, confidence, and uncertainty. This prevents marketing claims from being presented as facts.

Recommended evidence fields:

```ts
type Evidence = {
  confidence: "High" | "Medium" | "Low";
  lastVerified: string;
  sources: string[];
  uncertainties: string[];
};
```

Use explicit language such as **verified**, **emerging**, **plan-dependent**, **beta**, or **ambiguous**. Do not merge similarly named products without confirming their product boundary. For fast-moving AI products, include a snapshot date and tell users that pricing, model names, quotas, connectors, and regional availability can change.

## 7. Accessibility and responsive behavior

Use semantic headings in order. Give every icon-only control an accessible label. Keep keyboard focus visible. Ensure all drawers and modals can be closed with a visible close control and, where supported, the Escape key. Use sufficient contrast for text over translucent backgrounds.

On mobile, hide secondary navigation links rather than compressing them into unreadable text. Stack hero content, allow filter chips to scroll horizontally, keep tables horizontally scrollable, and make comparison trays vertically compact. Test at approximately 375px, 768px, and 1280px widths.

## 8. Quality checklist

### Before implementation

- Define the domain schema and primary user job.
- Choose the information hierarchy and the main interaction loop.
- Select a visual direction, typography pairing, palette, and spacing scale.
- Decide which content belongs on the page and which content belongs in progressive disclosure.

### During implementation

- Keep static data separate from view state.
- Use reusable components for repeated patterns.
- Add hover, active, focus, loading, empty, and error states.
- Preserve semantic colors and avoid hard-coded one-off styling wherever a token is appropriate.
- Respect reduced-motion preferences.

### Before delivery

```bash
pnpm check
pnpm build
```

Then verify the following interactions in a browser:

| Scenario | Expected result |
|---|---|
| Search | Results narrow immediately and accurately |
| Category filter | Only matching categories remain visible |
| Use-case filter | Results reflect the selected job |
| Card/matrix switch | The same filtered data appears in both views |
| Profile action | Full details open without losing page context |
| Compare toggle | Selection is added or removed with visible feedback |
| Compare tray | Selection remains available during browsing |
| Mobile layout | No critical content is clipped or inaccessible |
| External source link | Opens the intended source in a new tab |
| Empty state | The user receives a clear recovery action |

## 9. Starter prompt for future apps

```text
Build a polished React + TypeScript web app using Vite, Tailwind CSS, shadcn/ui primitives, and Lucide icons.

Design direction:
- Editorial intelligence dashboard.
- Warm off-white canvas, white surfaces, deep navy analytical sections.
- Signal orange for primary actions and emphasis.
- Plus Jakarta Sans with heavy display headings and readable body text.
- Rounded cards, soft shadows, thin borders, subtle gradients, and restrained motion.
- Use progressive disclosure through drawers or modals.
- Include responsive layouts for mobile, tablet, and desktop.
- Respect prefers-reduced-motion.

Implementation rules:
- Define the domain TypeScript model before building the UI.
- Use reusable components for cards, badges, filters, tables, drawers, and comparison trays.
- Keep static domain data separate from UI state.
- Include search, filters, an alternate high-density matrix view, and a detail profile view when the data is comparative.
- Add explicit loading, empty, error, hover, focus, active, and disabled states.
- Validate with pnpm check and pnpm build.
- Test desktop and mobile screenshots plus semantic browser interactions.
- Add evidence confidence, source links, dates, and uncertainty fields for research-heavy content.
```

## 10. Recommended future upgrades

The next architectural upgrade should be a typed data layer. Move the static domain array into JSON, a database, or a typed API while preserving the same domain model. Add URL-synchronized filters so searches and shortlists can be shared. Add a weighted scoring model so users can choose priorities such as autonomy, integrations, cost, privacy, or coding quality. Add source freshness and scheduled re-verification when the app becomes a maintained intelligence product.

## References

[1]: https://react.dev/ "React documentation"
[2]: https://www.typescriptlang.org/docs/ "TypeScript documentation"
[3]: https://vite.dev/guide/ "Vite guide"
[4]: https://tailwindcss.com/docs "Tailwind CSS documentation"
[5]: https://ui.shadcn.com/ "shadcn/ui documentation"
[6]: https://lucide.dev/guide/packages/lucide-react "Lucide React documentation"
[7]: https://developer.mozilla.org/en-US/docs/Web/Accessibility "MDN Web accessibility documentation"
