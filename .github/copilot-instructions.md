# Copilot instructions

## Repository at a glance

KeyboardShop is a small web-app monorepo for browsing and buying keyboards. It has two independent npm packages; there is no root `package.json`:

- `fe/`: React 19 + TypeScript SPA, built with Vite 8 and styled with Tailwind CSS 4. It uses React Router, Redux Toolkit, TanStack Query, and Vitest.
- `be/`: CommonJS Node.js/Express 5 API, backed by PostgreSQL on Neon. It uses JWT auth and the Neon serverless client.
- `docker-compose.yaml`: optional two-container deployment. Dockerfiles use Node 22 images. The README requires Node.js 22+; verified here with Node 24.20.0 and npm 12.0.2.

Frontend tool versions declared in `fe/package.json`: TypeScript 6, Vite 8, ESLint 10, Vitest 5, and Playwright 1.64.

Read `README.md` for configuration and deployment details. It is the main project documentation; `fe/README.md` is the unmodified Vite template and does not describe this app. No GitHub Actions/other CI workflow or repository-level lint/test configuration is tracked.

## Where to work

- Backend entry point: `be/index.js`; route registration is there and route modules are in `be/src/routes/`. Controllers are in `be/src/controllers/`; auth helpers/middleware are in `be/src/auth/` and `be/src/middlewares/`. Database schema/setup SQL is `be/database/init.sql`.
- Frontend bootstrap/router: `fe/src/main.tsx`, `fe/src/router.tsx`. Feature code is organized under `fe/src/features/<feature>/{schema,service,usecase}` and page/UI code under `fe/src/pages/` and `fe/src/components/`. Shared hooks, providers, Redux state, API client, and utilities are in `fe/src/hooks/`, `providers/`, `state/`, `api/`, and `utils/`.
- Backend tests are in `be/test/`; frontend tests are in `fe/src/test/` and generally follow the source tree. Frontend test setup/config: `fe/vitest.config.ts`, `fe/src/test/setup.ts`. Frontend lint/build configuration: `fe/eslint.config.js`, `fe/tsconfig*.json`, and `fe/vite.config.ts`. Optional performance tests/config live in `fe/perf/` and `fe/playwright.perf.config.ts`.

## Install, validate, and run

Always run npm commands from the package they target. From the repository root:

```sh
cd be && npm ci
cd ../fe && npm ci
```

These locked installs succeeded. Running `npm ci` at the repository root fails because there is no root package manifest/lockfile. Install warnings observed: the backend reports npm audit advisories; the frontend reports a React peer-version warning from `html-react-parser` (via `editorjs-blocks-react-renderer`) and audit advisories. They did not block install/build; do not run `npm audit fix` as an unrelated change.

Run checks from `be/` and `fe/` respectively:

```sh
# be/
npm test                 # Node's built-in test runner; no live database needed
npm run start            # Start API with node (dev uses nodemon)

# fe/
npm test                 # Vitest; coverage is enabled by default
npm run coverage         # Same suite with explicit V8 coverage
npm run lint             # ESLint (does not lint tests or src/components/ui)
npm run build            # TypeScript project build, then production Vite build
npm run preview          # Serve the built bundle, default port 4173
```

Backend has no build or lint script. The backend test suite passed (11 tests); frontend lint/build and the production preview passed. The full frontend test suite currently fails one RBAC redirect assertion in `src/test/router.rbac.test.tsx` (expects `/login`, observes `/admin/products`; 416/417 tests pass). This reproduced on two full runs, while running `npx vitest run src/test/router.rbac.test.tsx` alone passed all 19 tests. Report this known failure; do not mask it or change unrelated auth behavior just to make the suite green.

For local development, configure `be/.env` from `be/.env.example` and set a real `DATABASE_URL` plus private JWT secrets (ImgBB key is needed for image uploads). Initialize the database with `be/database/init.sql` in the Neon SQL editor as described in `README.md`. Set `fe/.env` to `VITE_BASE_URL=http://localhost:8000`. In separate terminals run `cd be && npm run dev` and `cd fe && npm run dev`; the API uses port 8000 and Vite prints its frontend URL (normally 5173). Both startup commands were verified; backend startup and `GET /api/products` returned HTTP 200, and Vite served HTTP 200.

Optional Docker flow from the root is `docker compose up --build`; it requires Docker Compose and both env files above. Compose exposes the API on 8000 and frontend preview on 4173. The performance script (`cd fe && npm run perf`) is not a unit test: it expects the app at localhost:4173, API/database at localhost:8000, seeded route data, a working `testuser` account, and Playwright's Desktop Chrome. It runs repeated measurements and enforces a 5-second p95 budget; run it only when that environment is ready.

Before finalizing, run the relevant package tests and frontend lint/build as applicable, and inspect `git diff --check`. Trust these repository-specific instructions; search further only when the instructions are incomplete or demonstrably outdated.
