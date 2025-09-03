# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/app/` (App Router). Route files: `page.js`, `layout.js`.
- Styles: global in `src/app/globals.css`; route‑scoped in `*.module.css`.
- Public assets: `public/` (served from `/`).
- Config: `next.config.mjs`, `jsconfig.json` (alias `@/*` → `src/*`). Example: `import styles from '@/app/page.module.css';`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm start`: Run the production server from the build output.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; use ES modules and React function components.
- Files: Next.js reserved files use lowercase (`page.js`, `layout.js`); other components (if added) should be PascalCase in `src/components/`.
- Styles: Prefer CSS Modules (`*.module.css`) for component‑scoped styles; keep shared tokens in `globals.css`.
- Imports: Use the `@/` alias for paths under `src/`.

## Testing Guidelines
- No test framework is configured yet. If adding tests:
  - Unit: Jest + React Testing Library (`src/__tests__/*.test.js`).
  - E2E: Playwright (`e2e/*.spec.ts`).
  - Aim for coverage on critical routes and utilities; keep tests colocated or in `__tests__`.
  - Example run (after setup): `npm test` or `npx playwright test`.

## Commit & Pull Request Guidelines
- Commits: Current history has no convention established. Prefer Conventional Commits (`feat:`, `fix:`, `chore:`) with concise scope (e.g., `feat(home): add CTA button`).
- Pull Requests: Include a clear summary, linked issues, screenshots for UI changes, and steps to validate locally (`npm run dev`, route to verify, expected result).
- Keep PRs focused and small; update README if behavior or scripts change.

## Security & Configuration Tips
- Secrets: Use `.env.local` for sensitive values; never commit `.env*` files. Client‑visible vars must be prefixed with `NEXT_PUBLIC_`.
- Images and assets should live in `public/`; prefer `next/image` for optimization.

