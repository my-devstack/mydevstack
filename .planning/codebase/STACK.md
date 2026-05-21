# Technology Stack

**Analysis Date:** 2026-05-21

## Languages

**Primary:**
- Go 1.26.1 - Backend proxy server (`pkg/proxy/`)
- TypeScript 5.x - Frontend UI (`pkg/ui/`) and E2E tests (`pkg/test/`)

**Secondary:**
- Vue 3.5.x - Frontend SFC templates (`pkg/ui/src/`)
- CSS (TailwindCSS) - Styling (`pkg/ui/src/styles/`)

## Runtime

**Environment:**
- Go 1.26 runtime for backend (`go.mod` line 3)
- Node.js >=24.0.0 for frontend build & dev server (`pkg/ui/package.json` line 8)
- Alpine Linux 3.x in production Docker image (`build/Dockerfile`)

**Package Manager:**
- Go modules (built-in) - Backend dependencies
- pnpm 11.1.3 - Frontend & E2E dependencies
- Lockfiles: `go.sum`, `pkg/ui/pnpm-lock.yaml`, `pkg/test/pnpm-lock.yaml` - all present

## Frameworks

**Core:**
- Gin v1.12.0 - Go HTTP framework for proxy backend (`go.mod` line 32)
- Vue 3.5.x - Frontend SPA framework (`pkg/ui/package.json` line 56)
- Vue Router 4.x - Client-side routing with hash-based history (`pkg/ui/src/router/index.ts`)
- Pinia 2.x - State management (`pkg/ui/package.json` line 54)
- axios 1.x - HTTP client for frontend API calls (`pkg/ui/package.json` line 52)

**Testing:**
- Vitest 2.x - Vue unit test runner, with happy-dom environment (`pkg/ui/vitest.config.ts`)
- Vue Test Utils 2.4 - Vue component testing utilities
- Playwright 1.48+ - E2E test framework (`pkg/test/package.json` line 10)
- Testify 1.11 - Go test assertions (`go.mod` line 33)
- Storybook 8.6 - Component development environment (`pkg/ui/package.json` lines 46-50, 55)
- @vitest/coverage-v8 - Test coverage provider (`pkg/ui/package.json` line 67)

**Build/Dev:**
- Vite 5.x - Vue build tool and dev server (`pkg/ui/package.json` line 81)
- @vitejs/plugin-vue 5.x - Vite Vue plugin (`pkg/ui/package.json` line 65)
- golangci-lint v2 - Go linter (`pkg/proxy/.golangci.yml`, CI config)
- ESLint 9.x - TypeScript/Vue linter (`pkg/ui/eslint.config.js`)
- PostCSS 8.x + Autoprefixer 10.x - CSS post-processing (`pkg/ui/postcss.config.js`)
- esbuild - JS/CSS minifier in Vite build (`pkg/ui/vite.config.ts` line 135)

## Key Dependencies

**Critical:**
- `github.com/aws/aws-sdk-go-v2` v1.41.7 - All AWS service SDK clients for Go backend (`go.mod` line 6)
- `@aws-sdk/client-*` v3.1023/598 - AWS SDK v3 for frontend browser clients (`pkg/ui/package.json` lines 23-41)
- `github.com/gin-gonic/gin` v1.12.0 - HTTP routing and middleware (`go.mod` line 32)
- `@smithy/fetch-http-handler` v5.3.15 - AWS SDK fetch-based HTTP handler for browser (`pkg/ui/package.json` line 45)
- `@aws-sdk/xhr-http-handler` v3.1023 - XHR-based HTTP handler for AWS SDK in browser (`pkg/ui/package.json` line 42)

**Infrastructure:**
- `github.com/beabys/ayotl` v0.0.13 - YAML config loader with env var substitution (`go.mod` line 31)
- `golang.org/x/sync/errgroup` - Goroutine lifecycle management (`go.mod` line 34)
- `github.com/stretchr/testify` v1.11 - Go test assertions and mocking (`go.mod` line 33)
- `gopkg.in/yaml.v3` - YAML parsing (indirect via ayotl, `go.mod` line 89)
- `@headlessui/vue` v1.7 - Unstyled accessible Vue UI primitives (`pkg/ui/package.json` line 43)
- `@heroicons/vue` v2 - SVG icon set (`pkg/ui/package.json` line 44)
- `@vueuse/core` v10 - Vue composition utilities (`pkg/ui/package.json` line 51)
- `js-yaml` v4.1 - YAML parsing in browser (`pkg/ui/package.json` line 53)

## Configuration

**Environment:**
- Go backend configured via `pkg/proxy/config.yaml` with `${VAR}` env var substitution
- Env fallbacks: `PROXY_PORT`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `EMULATOR`, `SERVICE_PATTERN`, `GITHUB_REPO`, `VERSION_CHECK_HOURS`
- Frontend via Vite env vars: `VITE_PROXY_BACKEND` (defaults to `http://127.0.0.1:8081`)
- `.env` file auto-loaded by Makefile (optional, gitignored); `.env.example` committed
- Docker compose files set env vars for all deployment modes (plain, Floci, Ministack)

**Build:**
- `Makefile` at project root orchestrates all build/test/lint commands
- `CGO_ENABLED=0` for Go cross-compilation in release builds
- Multi-platform Go binary build: linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64
- `build/Dockerfile` multi-stage: Go builder → Node/pnpm builder → Alpine nginx runtime

**Config files:**
- `pkg/proxy/config.yaml` - Backend config with env var substitution
- `pkg/proxy/.golangci.yml` - Go lint rules (v2 config, excludes `mocks/`)
- `pkg/ui/vite.config.ts` - Vite bundler config with path aliases (`@` → `src/`)
- `pkg/ui/tsconfig.json` - TypeScript config with `@/` path alias
- `pkg/ui/tailwind.config.js` - TailwindCSS with custom color palette and dark mode
- `pkg/ui/postcss.config.js` - PostCSS plugins (TailwindCSS + Autoprefixer)
- `pkg/ui/eslint.config.js` - ESLint flat config (TS, Vue, Storybook)
- `pkg/ui/vitest.config.ts` - Vitest config with v8 coverage and 90% thresholds

## Platform Requirements

**Development:**
- Go 1.26+
- Node.js >=24 + pnpm
- AWS emulator running on port 4566 (Floci or LocalStack)
- Optional: Docker for containerized emulator

**Production:**
- Docker runtime
- Multi-platform image published to Docker Hub (`beabys/mydevstack`)
- nginx serves static UI assets, reverse proxies `/s3`, `/lambda`, etc. to Go proxy
- Go proxy on port 8081, nginx on port 3000

---

*Stack analysis: 2026-05-21*
