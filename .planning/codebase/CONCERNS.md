# Codebase Concerns

**Analysis Date:** 2026-05-21

## Tech Debt

### Mock Bloat — 61% of Go code is generated mocks

- **Issue:** Generated mocks in `pkg/proxy/mocks/` total 43,687 lines vs 27,998 lines of actual source code. Mocks live as committed Go files and inflate the repo.
- **Files:** `pkg/proxy/mocks/ports/*.go` (50 files, ~43.7K lines)
- **Impact:** Higher maintenance surface (mocks need regeneration on any interface change), slower CI (`go build` processes all mocks), more noise in IDE.
- **Fix approach:** Move generated mocks to a separate `mocks` module with their own `go.mod`, or generate them on-the-fly during tests using `mockery --testonly --outdir /tmp`. Add `mocks/` to `.gitignore` and regenerate in CI.

### Triple Interface Definitions — Duplicated port interfaces

- **Issue:** Three separate files define near-identical service interfaces for the HTTP adapter layer:
  - `pkg/proxy/internal/ports/service.go` (ProxyService + all Port interfaces, 401 lines)
  - `pkg/proxy/internal/ports/aws_client.go` (ClientPort interfaces for AWS SDK, 399 lines)
  - `pkg/proxy/internal/adapters/http/interfaces.go` (Service interfaces for HTTP handlers, 333 lines)
- **Impact:** Adding a new method to any service requires changes in up to 3 interface files + 1 adapter + 1 handler. Easy to forget one, causing compile errors or runtime panics.
- **Fix approach:** Consolidate. Either use `ports/service.go` as the single source of truth and have adapters assert satisfaction, or generate HTTP handler interfaces from port definitions.

### Giant Router Switch Statement

- **Issue:** `pkg/proxy/internal/adapters/http/handlers.go:82-131` has a 23-case switch statement routing service names to handlers.
- **Impact:** Every new service adds a case here. Violates Open/Closed principle. Test coverage is manual.
- **Fix approach:** Use a `map[string]gin.HandlerFunc` registry pattern. Services register themselves. Same pattern could apply to sidebar nav in UI.

### Large Files — Maintenance hotspots

- **Issue:** Several files exceed 700 lines, making them hard to navigate and test comprehensively:
  - `pkg/proxy/internal/adapters/http/apigateway.go` (971 lines) — Largest handler
  - `pkg/proxy/internal/adapters/http/dynamodb.go` (546 lines)
  - `pkg/ui/src/views/services/IAM.vue` (1658 lines) — Largest UI component
  - `pkg/ui/src/views/services/IAM.test.ts` (1291 lines)
  - `pkg/ui/src/views/services/DynamoDB.vue` (862 lines)
  - `pkg/ui/src/api/types/aws.ts` (1038 lines) — Type definitions
  - `pkg/ui/src/components/layout/Sidebar.vue` (732 lines) — All 22+ services inline
- **Impact:** Difficult to review, refactor, or debug. Likely violates Single Responsibility.
- **Fix approach:** Split IAM.vue into sub-components. Break apigateway.go into separate files per resource type (restapis, resources, methods, integrations, stages). Extract sidebar service list into a composable or store.

### Duplicated Health Check URL Logic

- **Issue:** `pkg/proxy/internal/adapters/http/handlers.go:33-34` hard-codes `/_localstack/health` as the emulator health check path, but the emulator could be Floci (which uses the same path but behavior may differ).
- **Files:** `pkg/proxy/internal/adapters/http/handlers.go:34`, `pkg/proxy/internal/proxy/service.go:76`
- **Impact:** If a different emulator is used, health check silently succeeds or fails with misleading logs.
- **Fix approach:** Make the health check endpoint configurable in `config.yaml` (e.g., `emulator_health_path`).

## Security Considerations

### Hard-Coded AWS Credentials in Dockerfile

- **Risk:** `build/Dockerfile` lines 69-70 set `AWS_ACCESS_KEY=test` and `AWS_SECRET_KEY=test` as ENV defaults. Also hard-coded in all 3 `docker-compose*.yml` files.
- **Files:** `build/Dockerfile:69-70`, `docker-compose.yml:12-13`, `docker-compose-floci.yml:12-13`, `docker-compose-ministack.yml` (if exists with same pattern)
- **Current mitigation:** The credentials are dummy test values for local development only. Dockerfile line 1 has `# check=skip=SecretsUsedInArgOrEnv` to suppress scanner warnings.
- **Recommendations:** Remove the hard-coded values. Force users to set via `.env` file or environment variables at runtime. Remove the `check=skip` comment so scanners can flag future credential leaks.

### Wide-Open CORS Policy

- **Risk:** `pkg/proxy/internal/application/app.go:106` sets `Access-Control-Allow-Origin: *` on all routes.
- **Files:** `pkg/proxy/internal/application/app.go:106`
- **Current mitigation:** This is a local development tool running on localhost. Not exposed to the internet (no auth layer either).
- **Recommendations:** Restrict CORS origin to the UI origin in production builds. Add a config option `allowed_origins` in `config.yaml`.

### No Authentication on Proxy API

- **Risk:** The entire proxy API at `/:service/*path` is unauthenticated. Any process on localhost can make requests.
- **Files:** `pkg/proxy/internal/application/app.go:128`
- **Current mitigation:** Only accessible on localhost (port 8081). Designed for local development tooling.
- **Recommendations:** Add an optional API key or token-based auth for the proxy when deployed in shared environments. This is medium priority since the tool is explicitly for local development.

### Makefile Exports .env File Contents

- **Risk:** `Makefile:5` runs `export $(shell sed 's/=.*//' $(FILE))` which loads all `KEY=value` pairs from `.env` into the shell environment. If `.env` contains real AWS credentials or tokens, they leak to any child process.
- **Files:** `Makefile:3-5`
- **Current mitigation:** `.env` is in `.gitignore` and only contains test credentials by default.
- **Recommendations:** Use explicit env var mappings instead of a blind export. Only export the vars the Makefile needs.

### No Secrets Scanning in CI

- **Risk:** CI pipeline has no Gitleaks or similar secrets scanning step.
- **Files:** `.github/workflows/test.yml`, `.github/workflows/release.yml`
- **Recommendations:** Add a `gitleaks` or `trufflehog` scan step to the test workflow, running on every PR and push.

## Performance Bottlenecks

### Region Change Recreates All AWS Clients

- **Problem:** `pkg/proxy/internal/proxy/service.go:62-73` — `SetRegion()` calls `SetServices()` which recreates ALL 22 AWS service adapters from scratch, including new AWS config loading.
- **Files:** `pkg/proxy/internal/proxy/service.go:62-73`
- **Cause:** Each adapter has its own AWS SDK client. There's no per-service lazy initialization or client pooling.
- **Improvement path:** Use a single AWS config and create adapters lazily on first access. When region changes, invalidate the adapter cache instead of rebuilding everything.

### S3 Presign Client Created Unconditionally

- **Problem:** `pkg/proxy/internal/adapters/aws/s3.go:26` creates a `PresignClient` on every `NewS3Adapter` call, even if presign operations are never used.
- **Files:** `pkg/proxy/internal/adapters/aws/s3.go:26`
- **Improvement path:** Create PresignClient lazily or make it a separate optional adapter.

### GitHub API Call Without Rate Limiting

- **Problem:** `pkg/proxy/internal/adapters/github/release.go:40` calls the unauthenticated GitHub API (`api.github.com/repos/.../releases/latest`) every `VERSION_CHECK_HOURS` (default 24h) with no rate limit awareness. Unauthenticated GitHub API has 60 requests/hour limit.
- **Files:** `pkg/proxy/internal/adapters/github/release.go`, `pkg/proxy/internal/version/version.go`
- **Improvement path:** Add a GitHub token via env var `GITHUB_TOKEN` for authenticated requests (5000 req/hr). Implement exponential backoff. Cache the result aggressively (already has 25h TTL).

### Proxy DNS Resolution on Every Health Check

- **Problem:** `pkg/proxy/internal/adapters/http/handlers.go:66-69` creates a new `http.Client` with timeout on every health check call that misses cache, causing new DNS resolution each time.
- **Files:** `pkg/proxy/internal/adapters/http/handlers.go:66`
- **Improvement path:** Move the `http.Client` to a struct field and reuse it.

## Fragile Areas

### E2E Test Flakiness — Floci Dependency

- **Files:** `pkg/test/e2e/services/*.spec.ts` (18 spec files, ~4.8K total lines), `.github/workflows/test.yml:152-162`
- **Why fragile:** E2E tests depend on Floci Docker container running on `:4566`. CI starts Floci with a 30-retry loop (60s max), then builds and starts the Go proxy + Vite preview server with 5 retries of 20s each. If Floci is slow or the response format changes, tests fail.
- **Current issues:** TODO at `pkg/test/e2e/services/kinesis.spec.ts:140` — debug proxy/UI communication for delete. Indicates known test issues.
- **Safe modification:** Always run E2E tests locally before changes. Check Floci version compatibility. Consider adding retry logic in Playwright fixtures.
- **Test coverage:** All 18 services have E2E tests but some are minimal (ElastiCache 69 lines, Lambda 71 lines, RDS 72 lines).

### Version Service Scheduler — No Graceful Error Recovery

- **Files:** `pkg/proxy/internal/version/version.go`
- **Why fragile:** The `checkAndUpdateVersion` method uses a hard-coded `retryDelay = 5 * time.Minute` _within_ the scheduler ticker loop. If GitHub is unreachable for the first check after startup, the scheduler thread blocks for 5 minutes before trying the cache. The `StartScheduler` is called from `app.go:86` inside an errgroup goroutine.
- **Safe modification:** The retry delay should be configurable or use exponential backoff instead of a fixed 5-minute sleep.

### Docker CMD — No Process Supervision

- **Files:** `build/Dockerfile:78`
- **Why fragile:** `CMD ["/bin/sh", "-c", "/usr/local/bin/mydevstack-proxy & sleep 2 && nginx -g 'daemon off;'"]` — The proxy runs as a background process. If the proxy crashes, nginx keeps running and the container appears healthy (nginx serves 502s for API routes). The health check only tests nginx (`curl -f http://localhost:3000`), not the proxy.
- **Safe modification:** Use a process supervisor like `s6-overlay` or `supervisord`, or restructure as two containers. Fix the health check to actually test the proxy endpoint at `/health`.

### UI API Client Singleton — Stale After Region/Settings Change

- **Files:** `pkg/ui/src/api/client.ts:213-219`
- **Why fragile:** `getApiClient()` creates the axios instance once with a fixed `baseURL` from `PROXY_BACKEND`. If the user changes settings (endpoint, region, credentials) the API client still uses the old config until page reload. The `AWSSigV4Signer` reads `settingsStore.accessKey/secretKey/region` on each request interceptor call, but the base URL is fixed.
- **Safe modification:** Invalidate the `apiClient` singleton when settings change. Or move `baseURL` into the request interceptor so it reads from settings store each time.

## Scaling Limits

### 22 AWS Services — Linear Code Growth

- **Current capacity:** 22 AWS services implemented with ~15-17 files each per `ADDING_SERVICES.md` (Go: port interface + AWS adapter + HTTP handler; Vue: API client + composable + component + view + route + story + test + E2E).
- **Limit:** Each new service adds ~5 Go files (port, client port, adapter, handler, tests) + ~10 UI files (API service, composable, component(s), view, story, tests). At 22 services, this is already ~330-374 files.
- **Scaling path:** Adopt code generation for the repetitive adapter/handler/service layer. Use a plugin architecture or service registry pattern to avoid modifying existing files when adding services.

## Dependencies at Risk

### golangci-lint v2 — Rapid Evolution

- **Risk:** CI pins `golangci-lint@v2.3.0` (`test.yml:24`). The v2 config format changed significantly from v1. The `.golangci.yml` at `pkg/proxy/.golangci.yml` is v2 format.
- **Impact:** If CI image or golangci-lint versions diverge from local dev, lint results may differ. Team members may have different versions installed.
- **Migration plan:** Pin the version in a `.tool-versions` file or use `go install` with a specific version in the Makefile.

### `@headlessui/vue` v1.x

- **Risk:** UI uses `@headlessui/vue: ^1.7.0`. Headless UI v2 has significant breaking changes and is the active development track.
- **Impact:** Staying on v1.x misses accessibility improvements and new component patterns. Migration would be a breaking change.
- **Migration plan:** Evaluate v2 migration when upgrading other dependencies.

## Missing Critical Features

### No Error Tracking or Monitoring

- **Problem:** No error tracking (Sentry, etc.), no structured logging (uses `log.Printf`), no metrics. Errors in production Docker containers go to stdout/stderr only.
- **Files:** All `log.Printf` calls across `pkg/proxy/internal/`
- **Blocks:** Troubleshooting issues in deployed containers requires access to container logs. No way to track error frequency or patterns.

### No Input Validation Middleware

- **Problem:** Request body parsing happens ad-hoc in each handler via `parseBody()` / `transformJSONKeys()` in `handlers.go:192-227`. No centralized validation or schema enforcement.
- **Files:** `pkg/proxy/internal/adapters/http/handlers.go`
- **Blocks:** Malformed requests can cause cryptic errors. Adding validation for each handler individually is tedious and inconsistent.

### No API Documentation

- **Problem:** The proxy API has no OpenAPI/Swagger spec. API routes are defined in code (`app.go:125-128`) and the router switch (`handlers.go:82-131`).
- **Blocks:** Onboarding new contributors requires reading handler code. No auto-generated client or API reference.

## Test Coverage Gaps

### UI Test Coverage Not Enforced

- **What's not tested:** CI runs `vitest run --coverage` for UI but has no coverage threshold (`test.yml` only enforces Go coverage at 90%).
- **Files:** `.github/workflows/test.yml:77` (UI test step), `.github/workflows/test.yml:105-113` (Go coverage threshold)
- **Risk:** UI coverage can degrade without detection. Storybook stories (122 files) exist but don't verify behavior.
- **Priority:** Medium — UI has 155 test files for 388 source files (~40% test density) but actual coverage percentage is unknown.

### Storybook Coverage — Visual Only

- **What's not tested:** 122 Storybook stories exist but none have interaction tests or accessibility assertions. Stories render components but don't verify behavior, error states, or async flows.
- **Files:** `pkg/ui/src/**/*.stories.ts` (122 files)
- **Risk:** Stories become stale — they can pass CI even if the component behavior is broken.
- **Priority:** Low — better than no stories. But stories should include interaction tests via `@storybook/addon-interactions`.

### Several Services Have Minimal E2E Coverage

- **What's not tested:** ElastiCache (69 lines), Lambda (71 lines), RDS (72 lines) E2E tests cover only basic CRUD.
- **Files:** `pkg/test/e2e/services/elasticache.spec.ts`, `lambda.spec.ts`, `rds.spec.ts`
- **Risk:** UI regressions for these services may not be caught by E2E.
- **Priority:** Low — these are simpler services. But any new feature for these services needs E2E expansion.

## Known Bugs

### Kinesis Delete — Proxy/UI Communication Issue

- **Symptoms:** Kinesis delete operations have a known communication issue between proxy and UI.
- **Files:** `pkg/test/e2e/services/kinesis.spec.ts:140`
- **Trigger:** Kinesis resource deletion via UI.
- **Workaround:** None documented. The TODO has been present since the service was added.
- **Priority:** Medium — affects core functionality for Kinesis.

---

*Concerns audit: 2026-05-21*
