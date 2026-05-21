# Codebase Concerns

**Analysis Date:** 2026-05-21

## Tech Debt

### Massive Boilerplate Duplication in HTTP Handlers

**Issue:** Every HTTP handler action follows the exact same 6-line pattern (parse body → check error → call service → check error → return result), copy-pasted across ~200 handler functions in 20+ handler files. The IAM handler alone (`pkg/proxy/internal/adapters/http/iam.go`) is 505 lines of near-identical functions.

**Files:**
- `pkg/proxy/internal/adapters/http/iam.go` (505 lines)
- `pkg/proxy/internal/adapters/http/lambda.go` (227 lines)
- `pkg/proxy/internal/adapters/http/apigateway.go` (971 lines)
- All files in `pkg/proxy/internal/adapters/http/`

**Impact:** High maintenance cost when adding new services or changing error handling patterns. ~30x increase in lines vs a handler-generic approach.

**Fix approach:** Generate handler functions with generics or a handler factory. Define action → handler mapping with middleware to eliminate body parsing and error handling boilerplate.

### Widespread `context.Background()` in Production Code Paths

**Issue:** `context.Background()` is used instead of propagating the request context in production paths:
- `pkg/proxy/internal/proxy/service.go:76` — AWS config loading uses `context.Background()` instead of a cancellable context
- `pkg/proxy/internal/application/app.go:68` — Server shutdown timeout uses `context.Background()` instead of being configurable
- `pkg/proxy/cmd/server/main.go:91` — `loadConfig` uses `context.Background()`

**Files:** `pkg/proxy/internal/proxy/service.go`, `pkg/proxy/internal/application/app.go`, `pkg/proxy/cmd/server/main.go`

**Impact:** Cancellation signals are not propagated to AWS SDK clients during service initialization. The 5-second shutdown timeout is hardcoded with no config override.

**Fix approach:** Thread the application context through `NewProxyService` and all adapter constructors. Make shutdown timeout configurable.

### Widespread `any` Type Usage in Vue Frontend

**Issue:** The Vue 3 TypeScript frontend uses `any` type extensively — 900+ matches across composables, views, API clients, and components. This undermines TypeScript's benefits and causes the type system to provide almost no safety for the majority of application code.

**Files:** `pkg/ui/src/views/services/APIGatewayHttpApis.vue`, `pkg/ui/src/views/services/APIGatewayRestApis.vue`, `pkg/ui/src/composables/useDynamoDB.ts`, `pkg/ui/src/api/services/dynamodb.ts`, `pkg/ui/src/api/client.ts`, and most files under `pkg/ui/src/`

**Impact:** Runtime errors that could be caught at compile time. Poor IDE support. Makes refactoring error-prone. New developers get no guidance on data shape from types.

**Fix approach:** Define proper TypeScript interfaces for all API response types, composable return types, and component props/emits. Start with the `api/services/` layer since it defines the contract with the backend.

### Deprecated `defaultConfig()` Still Actively Used

**Issue:** `defaultConfig()` in `pkg/proxy/cmd/server/main.go:95` is marked as deprecated ("will be removed in favor of loading from config files") but is still actively used as a fallback whenever config loading fails. It reads env vars directly and ignores the config file entirely.

**Files:** `pkg/proxy/cmd/server/main.go` (lines 94-115)

**Impact:** Any config file loading error silently falls back to reading env vars only, which may cause difficult-to-debug production behavior where config files are ignored.

**Fix approach:** Remove the deprecated `defaultConfig()`. Make config file mandatory in production (check `CONFIG_FILE` env). Only use env vars for CONFIG_FILE path.

### Pure Pass-Through AWS Adapters With No Error Handling

**Issue:** All AWS adapter implementations (`pkg/proxy/internal/adapters/aws/`) are pure pass-through wrappers that add no error wrapping, logging, retries, or transformation. Every method just calls the SDK method directly and returns raw errors.

**Files:** All files in `pkg/proxy/internal/adapters/aws/` (s3.go, lambda.go, dynamodb.go, iam.go, etc.)

**Impact:** Error messages from AWS SDK or LocalStack/Floci are passed directly to the HTTP response with no context about which operation failed. Makes debugging difficult.

**Fix approach:** Wrap errors at the adapter level with operation context. Add consistent logging middleware. Consider a retry wrapper.

### `Cache.Get()` Doesn't Prune Expired Entries (Memory Leak)

**Issue:** The `Cache` implementation (`pkg/proxy/internal/cache/cache.go`) never removes expired entries from the map. `Get()` returns `false` for expired keys but the entry remains in the underlying map indefinitely. With the version checker setting entries every 25h, this is a slow leak.

**Files:** `pkg/proxy/internal/cache/cache.go` (lines 33-47)

**Impact:** Slow memory leak over time, especially if the cache is used for more keys in the future.

**Fix approach:** Add periodic cleanup goroutine or prune entries on `Set()`. Add `Len()` and `Cleanup()` methods.

### `context.TODO()` in Production Config Test

**Issue:** `context.TODO()` is used in config test (`pkg/proxy/internal/config/config_test.go` lines 233 and 271) for production test code paths instead of `context.Background()`.

**Files:** `pkg/proxy/internal/config/config_test.go`

**Impact:** Minor — `context.TODO()` is intended for code where the right context is unclear, not for tests. Creates lint noise.

**Fix approach:** Replace with `context.Background()`.

## Security Considerations

### CORS Wildcard `*` in Production

**Risk:** The gin CORS middleware in `pkg/proxy/internal/application/app.go:106` sets `Access-Control-Allow-Origin: *`, allowing any website to make cross-origin requests to the proxy.

**Files:** `pkg/proxy/internal/application/app.go` (line 106)

**Current mitigation:** None. The wildcard allows arbitrary origins.

**Recommendations:** Restrict to known origins, or at minimum document why wildcard is needed (development proxy). For production behind nginx, ensure nginx handles CORS enforcement.

### No Request Size Limits or Input Validation

**Risk:** The HTTP handlers accept arbitrary-sized request bodies with no size limit, and parse them directly into AWS SDK input structs with no sanitization. A malicious client could send oversized payloads causing OOM or triggering AWS SDK parsing vulnerabilities.

**Files:** All files in `pkg/proxy/internal/adapters/http/` — `readBody()` in `handlers.go:183-190`

**Current mitigation:** None at the application level. Relies on gin's default body size limiter (32MB).

**Recommendations:** Add configurable max request body size. Add input validation middleware that rejects unexpected fields.

### Default Hardcoded Credentials

**Risk:** Default AWS credentials (`test`/`test`) are hardcoded in:
- `pkg/proxy/internal/config/config.go` (lines 31-32)
- `pkg/proxy/cmd/server/main.go` (lines 108-109)
- `build/Dockerfile` (lines 68-69)
- `docker-compose.yml` (lines 12-13)

**Files:** `pkg/proxy/internal/config/config.go`, `pkg/proxy/cmd/server/main.go`, `build/Dockerfile`, `docker-compose.yml`

**Current mitigation:** These are defaults for local development with LocalStack/Floci. Production deploys are expected to override via environment variables.

**Recommendations:** Add a startup warning if default credentials are detected. Remove defaults from Dockerfile and make them required env vars.

### No Secrets Redaction in Logs

**Risk:** The Secrets Manager adapter logs may expose secret values in debug output. Adapter implementations use `fmt.Errorf` which includes the full error including potentially sensitive data.

**Files:** All adapters in `pkg/proxy/internal/adapters/aws/` use `fmt.Errorf()` with operation name but the raw SDK error may contain secret values in "AccessDenied" or similar error responses.

**Current mitigation:** None specific. Errors are logged via `sendError()` which calls `log.Printf`.

**Recommendations:** Implement a logging middleware that redacts sensitive values (secret values, credentials, keys) from error messages before logging.

### No CSRF Protection

**Risk:** The proxy has no CSRF tokens or SameSite cookie enforcement. Any authenticated session could be targeted by cross-site request forgery.

**Files:** `pkg/proxy/internal/application/app.go` (route setup), `build/nginx.conf`

**Current mitigation:** None. The application relies on the emulator's existing security model.

**Recommendations:** Add CSRF middleware if user sessions are introduced. For now, document that the proxy is designed for local development only.

### Secrets Manager Debug Logging

**Risk:** The Secrets Manager adapter (`pkg/proxy/internal/adapters/aws/secretsmanager.go`) uses `fmt.Println` for debug output when creating secrets. This will print secret values to stdout in production.

**Files:** `pkg/proxy/internal/adapters/aws/secretsmanager.go`

**Current mitigation:** None. `fmt.Println` outputs to stdout which appears in container logs.

**Recommendations:** Remove `fmt.Println` calls. Use structured logging with redaction.

## Performance Bottlenecks

### `SetRegion()` Recreates All 20+ Service Adapters Unnecessarily

**Problem:** Every call to `SetRegion()` (`pkg/proxy/internal/proxy/service.go:62-73`) recreates ALL 21 AWS service adapters from scratch — re-initializing every AWS SDK client, even if the region hasn't changed. This blocks on the RWMutex and has no caching of the previous configuration.

**Files:** `pkg/proxy/internal/proxy/service.go` (lines 62-73, 75-109)

**Cause:** Naive implementation — the entire service graph is rebuilt on every region change because adapters store a reference to their region at creation time.

**Improvement path:** Add region-change detection (skip recreation if same region). Create adapters lazily. Use a version counter to invalidate cached adapters only when region changes.

### No Expired Entry Cleanup in Cache

**Problem:** The `Cache` (`pkg/proxy/internal/cache/cache.go`) accumulates expired entries indefinitely. Each `Get()` call skips expired entries but doesn't remove them. Only called with version check keys (~1 entry/day), but the pattern is wrong.

**Files:** `pkg/proxy/internal/cache/cache.go`

**Cause:** No eviction policy or cleanup mechanism.

**Improvement path:** Add periodic cleanup goroutine. Use `map` delete on `Get()` when entry is expired. Add capacity limits with LRU eviction.

### Sidebar Uses `setTimeout` + MutationObserver Instead of `ResizeObserver`

**Problem:** The sidebar scroll detection in `Sidebar.vue:141` uses `setTimeout(checkScroll, 100)` instead of `ResizeObserver`. The MutationObserver adds unnecessary DOM observation overhead.

**Files:** `pkg/ui/src/components/layout/Sidebar.vue` (lines 139-151)

**Cause:** Workaround for DOM measurement timing.

**Improvement path:** Replace with `ResizeObserver` on the scroll container. Remove MutationObserver entirely — content changes inside the scroll container will be captured by `ResizeObserver`.

### AWS SDK Clients Have No Explicit Retry Configuration

**Problem:** All AWS service adapters use the default AWS SDK retry behavior without explicit configuration. The HTTP client timeout is set to 30s but no retry strategy is defined, meaning transient failures (throttling, network issues) propagate immediately as errors.

**Files:** All files in `pkg/proxy/internal/adapters/aws/`

**Cause:** SDK defaults are used without explicit override.

**Improvement path:** Configure retry strategy (max attempts, backoff) at the config level in `proxy/service.go`.

## Known Bugs

### Health Check Returns `false` When Body Close Fails

**Symptoms:** If the health check HTTP request succeeds (200 OK) but `resp.Body.Close()` returns an error, `checkBackendHealth()` returns `false` (unhealthy). The body close error is unrelated to backend health.

**Files:** `pkg/proxy/internal/adapters/http/handlers.go` (lines 74-76)

**Trigger:** Any transient I/O error during TCP connection teardown after a successful health probe.

**Workaround:** None, besides the error being rare.

**Fix:** Log but don't return `false` on body close errors. The health status should be determined by the HTTP status code only.

### `VersionService.Stop()` Panics on Double Close

**Symptoms:** Calling `versionService.Stop()` more than once causes a panic because `close(s.stopCh)` on an already-closed channel panics in Go.

**Files:** `pkg/proxy/internal/version/version.go` (lines 60-62)

**Trigger:** Multiple goroutines calling `Stop()` or `Stop()` being called after the scheduler has already returned from context cancellation.

**Workaround:** Only call `Stop()` once. Currently called from `app.go:94` which is the only caller.

**Fix:** Use `sync.Once` for stop channel close or use a boolean flag to guard the close.

### Lambda Invoke Response Missing Fields

**Symptoms:** The Lambda invoke handler (`pkg/proxy/internal/adapters/http/lambda.go:104-129`) doesn't forward `LogResult` or `ExecutedVersion` fields from the invoke response. The `Payload` is base64-encoded but upstream AWS SDK returns it raw.

**Files:** `pkg/proxy/internal/adapters/http/lambda.go` (lines 116-126)

**Trigger:** Invoking a Lambda function with `LogType=Tail` or needing `ExecutedVersion`.

**Workaround:** Use the Go proxy directly instead of the HTTP handler for full response.

**Fix:** Forward all response fields from the Lambda invoke output, including `LogResult` and `ExecutedVersion`. Respect the response format expected by the AWS SDK.

### IAM `ListUsersForGroup` Type Alias Shadowing

**Symptoms:** `pkg/proxy/internal/adapters/aws/iam.go` re-exports port types as local type aliases (`ListUsersForGroupInput = ports.ListUsersForGroupInput`). This creates confusion about which type is canonical and makes the adapter responsible for defining its own input types rather than using them from ports.

**Files:** `pkg/proxy/internal/adapters/aws/iam.go` (lines 14-15)

**Trigger:** Any change to the port interface types in `internal/ports/`.

**Fix:** Remove local aliases and reference `ports.ListUsersForGroupInput` directly in method signatures. Or move the type definitions to the port package where they belong.

## Fragile Areas

### AWS Adapter Interface vs Client Double-Wrapping

**Why fragile:** Each AWS adapter has a dual pattern — it wraps an AWS SDK client but the port interface defines methods that return AWS SDK types directly. The IAM adapter (`iam.go`) also stores a `directClient *iam.Client` alongside the wrapped `client ports.IAMClientPort`, creating two paths to the same client. This is inconsistent across adapters.

**Files:** `pkg/proxy/internal/adapters/aws/iam.go` (lines 18-20), `pkg/proxy/internal/adapters/aws/lambda.go` (lines 13-15), similar in all adapter files.

**Safe modification:** When adding new methods, add to both the port interface and the adapter. Ensure only one client reference is used.

**Test coverage:** Adapter tests exist (50 test files) but test only the AWS adapter methods, not the port-interface contract. Mock coverage is generated from port interfaces.

### E2E Test Fixtures Suppress All Errors

**Why fragile:** The E2E test `fixtures.js` uses bare `catch { //ignore }` blocks for all cleanup operations. If a cleanup request fails (e.g., proxy is down, resource doesn't exist), the error is silently swallowed and subsequent tests may interact with stale state.

**Files:** `pkg/test/e2e/fixtures.js` (lines 16-19, 32-35)

**Safe modification:** Log errors at minimum. Add retry with backoff for cleanup operations.

**Test coverage:** These are the test fixtures themselves — they lack unit tests.

### DynamoDB `isDynamoDBFormat` First-Key Check

**Why fragile:** `isDynamoDBFormat` in `pkg/ui/src/api/services/dynamodb.ts` only checks the first key's value to determine if an object is in DynamoDB attribute format. If the first key happens to have `S`, `N`, or `B` properties but isn't actually DynamoDB format, the marshalling is skipped.

**Files:** `pkg/ui/src/api/services/dynamodb.ts` (lines 167-174, 243-256)

**Safe modification:** Check ALL keys, not just the first one. Or require explicit `isDynamoDBFormat` flag.

**Test coverage:** Covered by composable tests but edge cases for partial matches are not tested.

### Docker `CMD` Startup Order Race Condition

**Why fragile:** The Docker CMD (`build/Dockerfile:78`) uses `sleep 2` to ensure the proxy starts before nginx. This is a classic race condition — on slow systems, 2 seconds might not be enough.

**Files:** `build/Dockerfile` (line 78)

**Safe modification:** Use a startup script that waits for the proxy health endpoint before starting nginx. Example: `while ! curl -sf http://localhost:8081/health; do sleep 1; done && nginx -g 'daemon off;'`.

**Test coverage:** Not covered by any test.

### Docker nginx PID Path Mismatch

**Why fragile:** The nginx config (`build/nginx.conf:3`) sets `pid /tmp/nginx.pid` but the Dockerfile (`build/Dockerfile:53`) only `chown`s `/var/cache/nginx`, `/var/log/nginx`, `/var/lib/nginx`, `/var/run`, and `/etc/nginx` to `appuser`. The `/tmp/nginx.pid` path is owned by root and doesn't need special ownership, but this mismatch could cause issues if `/tmp` permissions are restricted.

**Files:** `build/Dockerfile` (line 53), `build/nginx.conf` (line 3)

**Safe modification:** Either move pid to a dir that's explicitly chowned, or ensure `/tmp` is writable.

**Test coverage:** Not covered by tests.

### `ProxyService.SetServices()` Not Safe for Concurrent Calls

**Why fragile:** `SetServices()` is called from `SetRegion()` which acquires a write lock, but `SetServices()` itself writes to unguarded fields on the service struct. If called from outside the lock guard, it would race with reader methods.

**Files:** `pkg/proxy/internal/proxy/service.go` (lines 62-73, 75-109)

**Safe modification:** Only call `SetServices()` from within `SetRegion()` which holds the write lock. Document this requirement.

**Test coverage:** `pkg/proxy/internal/proxy/service_test.go` tests `SetRegion` but does not test concurrent access.

## Test Coverage Gaps

**Untested area:** HTTP handler error paths — the `sendError` function logs and returns JSON, but no tests verify the error response format or status codes for every handler action. Most tests use mocked adapters but only test the happy path.

**Files:** All `*_test.go` files in `pkg/proxy/internal/adapters/http/`

**Risk:** Error handling logic changes without test coverage.

**Priority:** Medium

---

**Untested area:** Vue composable error states — while composable unit tests exist, many only test the loading/success path and skip testing what happens when API calls fail (e.g., `useDynamoDB.ts` has `catch` blocks for toast errors but tests don't verify the toast is called).

**Files:** `pkg/ui/src/composables/useDynamoDB.test.ts`, and test files for other composables

**Risk:** Error handling in the UI may silently fail or show incorrect states.

**Priority:** Medium

---

**Untested area:** E2E test cleanup — `fixtures.js` uses `catch { //ignore }` making cleanup failures invisible in CI.

**Files:** `pkg/test/e2e/fixtures.js`

**Risk:** Stale resources from failed tests accumulate and cause subsequent test failures.

**Priority:** Low

---

**Untested area:** GitHub release adapter — `pkg/proxy/internal/adapters/github/release.go` has no unit tests. It makes real HTTP calls and has complex error handling for non-200 responses.

**Files:** `pkg/proxy/internal/adapters/github/release.go`

**Risk:** GitHub API changes or rate limiting could break version checking without detection.

**Priority:** Medium

---

**Untested area:** Cache expiry — `pkg/proxy/internal/cache/cache.go` tests exist but don't test edge cases like concurrent `Get`/`Set` races or cleanup of expired entries.

**Files:** `pkg/proxy/internal/cache/cache_test.go`

**Risk:** Race conditions in cache access patterns.

**Priority:** Low

## Dependencies at Risk

### `github.com/beabys/ayotl` (Config Library)

**Risk:** This is a custom config library (`github.com/beabys/ayotl`) owned by the same author as `mydevstack`. It has version `v0.0.0-20250508165002-...` (pre-1.0, dated recently) and is imported at `pkg/proxy/internal/config/config.go:7`.

**Impact:** If the library API changes or becomes unmaintained, the config loading layer breaks. Being pre-1.0, breaking changes are expected.

**Migration plan:** Consider switching to a well-established config library like `spf13/viper` or Go's standard `encoding/json`/`gopkg.in/yaml.v3`.

---

**Risk:** All AWS SDK v2 dependencies are pinned to specific minor versions (e.g., `github.com/aws/aws-sdk-go-v2 v1.41.7`). AWS regularly releases updates and the project depends on ~25 AWS SDK packages. Keeping these in sync manually is error-prone.

**Impact:** Missing security patches or bug fixes in AWS SDK. Version drift between tightly coupled SDK packages.

**Migration plan:** Use `go get -u` on the entire AWS SDK package family regularly. Consider Dependabot/Renovate for automated updates.

---

**Risk:** Vue UI `package.json` pins AWS SDK packages to `^3.1023.0` (very recent) but `elasticache` and `rds` are pinned to `^3.598.0` — significantly older. All SDK packages should be on the same major version for consistency.

**Files:** `pkg/ui/package.json` (lines 23-40)

**Impact:** Feature disparity between AWS SDK packages. Potential behavioral inconsistencies.

**Migration plan:** Update `elasticache` and `rds` SDK packages to match the rest (`^3.1023.0`).

## Missing Critical Features

**Feature gap:** No request/response logging middleware — the proxy has no structured logging layer. All logging is ad-hoc `log.Printf()`. No correlation IDs, no request tracing.

**Blocks:** Debugging production issues, understanding traffic patterns, auditing access.

**Priority:** Medium

---

**Feature gap:** No rate limiting or throttling — the proxy has no protection against request flooding.

**Blocks:** Production deployment without nginx rate limiting.

**Priority:** Low (mitigated by nginx in production)

---

**Feature gap:** No metrics or monitoring integration — the proxy exposes `/health` only. No Prometheus metrics, no request duration tracking, no error rate counters.

**Blocks:** Monitoring production health, setting up alerts, capacity planning.

**Priority:** Medium

---

*Concerns audit: 2026-05-21*
