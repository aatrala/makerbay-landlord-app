---
kind: dependency_management
name: pnpm Workspace Monorepo with Local Shared Package
category: dependency_management
scope:
    - '**'
source_files:
    - pnpm-workspace.yaml
    - package.json
    - pnpm-lock.yaml
    - shared/package.json
    - client/package.json
    - server/package.json
---

## Dependency Management System

This repository is a **pnpm workspace monorepo** composed of three packages — `shared` (a TypeScript domain types package published as `@rentlite/shared`), `server` (an Express API), and `client` (a Vite+React SPA). All dependencies are managed centrally via pnpm, with a single lockfile at the repository root.

### What system/approach is used

- **Package manager**: pnpm (workspace mode). The root `package.json` declares `engines.node >=20` and `engines.pnpm >=9`, enforcing minimum versions for both Node.js and pnpm.
- **Workspace configuration**: `pnpm-workspace.yaml` lists the three packages (`shared`, `server`, `client`) as workspace members. There is no top-level dependency graph; the root `package.json` only contains scripts that delegate to each workspace package via `pnpm --filter <pkg> ...`.
- **Lockfile**: A single `pnpm-lock.yaml` at the repository root (lockfileVersion 9.0) records exact resolved versions and integrity hashes for every transitive dependency across all workspaces. This is committed to version control and serves as the source of truth for reproducible installs.
- **No vendoring / no private registry**: Dependencies are fetched from the public npm registry. No `.npmrc`, `pnpm.config.*`, or `packageManager` field overrides were found in the repo. There is no `vendor/` directory, no `yarn.lock`, and no `node_modules` checked in beyond the per-package `node_modules` directories created by pnpm's content-addressable store.

### Key files and packages

- `pnpm-workspace.yaml` — declares the three workspace members.
- Root `package.json` — defines workspace-wide scripts (`dev`, `build`, `check`, `db:*`) that use `pnpm --filter` to target individual packages; also pins required `node` and `pnpm` engine versions.
- `pnpm-lock.yaml` — the canonical lockfile pinning every dependency tree.
- `shared/package.json` — publishes the internal package under the `@rentlite/shared` name with explicit `exports` mapping (`.` → `./dist/index.js` + `./dist/index.d.ts`) so consumers get both runtime and type resolution.
- `client/package.json` and `server/package.json` — declare runtime and dev dependencies; both reference the internal package via `"@rentlite/shared": "workspace:*"`, which tells pnpm to resolve it to the local `../shared` link rather than fetching from npm.

### Architecture and conventions

1. **Internal package sharing via workspace protocol**: Both `client` and `server` depend on `@rentlite/shared` using the `workspace:*` specifier. In the lockfile this resolves to `version: link:../shared`, meaning pnpm creates an in-tree symlink instead of publishing/installing a copy. This keeps shared domain models, enums, and API shapes in sync between frontend and backend without any npm publish step during development.

2. **Per-package dependency isolation**: Each workspace package has its own `package.json`, `tsconfig.json`, and `node_modules`. The root does not hold runtime dependencies — only orchestration scripts. This prevents accidental cross-package dependency leaks and keeps install trees small.

3. **Version ranges over exact pins**: Runtime dependencies use caret ranges (e.g. `^4.21.0` for express, `^5.7.0` for typescript, `^19.0.0` for react). Exact pinned versions live only in `pnpm-lock.yaml`. This allows minor/patch updates while keeping the lockfile deterministic.

4. **Build-time vs runtime separation**: The `shared` package compiles TypeScript to `dist/` and exposes both JS and `.d.ts` through the `exports` field. Consumers import `@rentlite/shared` and receive the compiled output plus types. Dev-only tooling (vite, tsx, drizzle-kit, tailwindcss plugins) lives exclusively in each package's `devDependencies`.

5. **Dockerized install surface**: `docker-compose.yml` and per-package `Dockerfile`s pull dependencies inside containers, relying on the root `pnpm-lock.yaml` for deterministic builds. No separate Docker registry or private npm registry is configured.

### Conventions and constraints

- **Engine enforcement**: The root `package.json` `engines` block requires Node ≥20 and pnpm ≥9. Any environment violating this will be rejected by pnpm.
- **Workspace-only internal packages**: Internal packages must be referenced via `workspace:*` (as seen for `@rentlite/shared`). There is no convention for publishing internal packages to a registry during development.
- **Single lockfile policy**: All dependency resolution goes through the root `pnpm-lock.yaml`; there are no per-package lockfiles and no `--frozen-lockfile` flags observed in scripts, but the presence of one lockfile enforces deterministic installs across the whole monorepo.
- **No private registries or auth**: No `.npmrc`, `pnpm.config.yaml`, or `NPM_TOKEN` usage was detected. All third-party packages come from the public npm registry.
- **TypeScript alignment**: All three packages pin `typescript ^5.7.0` in their own `devDependencies`, ensuring consistent TS behavior across the workspace despite pnpm hoisting.