<!-- refreshed: 2026-05-21 -->
# Architecture

**Analysis Date:** 2026-05-21

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vue 3 SPA)                          │
│                                                                          │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │  Views    │  │ Composables │  │ API Client│  │ Pinia Stores       │   │
│  │ *.vue     │─→│ use*()     │─→│ api/*.ts  │  │ (settings, ui)     │   │
│  │ Dashboard │  │ useS3() etc│  │ axios     │  │ localStorage sync  │   │
│  │ Service.vue│  └────────────┘  └─────┬─────┘  └────────────────────┘   │
│  └──────────┘                          │                                  │
└────────────────────────────────────────┼──────────────────────────────────┘
                                         │ HTTP (Vite proxy or nginx)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Go Proxy Server)                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  HTTP ADAPTER (inbound)                          │   │
│  │  Gin Router: /:service/*path → ServiceRouter()                  │   │
│  │  CORS middleware → dispatch by X-Amz-Target / service name     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │   │
│  │  │ handleS3()   │ │ handleIAM() │ │ handler()  │ ... 18 more  │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │   │
│  └─────────┼───────────────┼───────────────┼──────────────────────┘   │
│            ▼               ▼               ▼                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              PROXY SERVICE (core domain)                         │   │
│  │  ProxyService struct — accessor methods per AWS service          │   │
│  │  Manages AWS SDK config, region switching with RWMutex            │   │
│  │  Delegates to adapter implementations via ports interfaces       │   │
│  └──────┬──────────────────────┬────────────────────┬───────────────┘   │
│         │                      │                    │                   │
│         ▼                      ▼                    ▼                   │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐         │
│  │ AWS Adapters  │  │ GitHub Adapter   │  │ In-Memory Cache   │         │
│  │ (outbound)    │  │ (outbound)       │  │ (internal)        │         │
│  │ 20 services   │  │ release.go       │  │ cache.go          │         │
│  │ per AWS SDK   │  │ GetLatestRelease │  │ TTL map sync.RWM  │         │
│  └───────┬───────┘  └──────────────────┘  └───────────────────┘         │
│          │                                                              │
│          ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              AWS Emulator (LocalStack / MiniStack)               │   │
│  │              OR real AWS (for reference)                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Version Service (sidecar)                           │   │
│  │  VersionService: scheduled GitHub release check via ticker       │   │
│  │  Uses CachePort + GitHubClientPort — cached in memory            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Container | DI wiring, lifecycle, graceful shutdown | `pkg/proxy/internal/application/app.go` |
| ProxyService | Core domain: manages region, holds all AWS adapters | `pkg/proxy/internal/proxy/service.go` |
| HTTP Handlers | Gin routing, CORS, request parsing, response formatting | `pkg/proxy/internal/adapters/http/handlers.go` |
| Service Handlers | Per-AWS-service request dispatching & response rendering | `pkg/proxy/internal/adapters/http/s3.go` (etc.) |
| AWS Adapters | Thin wrappers over AWS SDK v2 clients targeting emulator endpoint | `pkg/proxy/internal/adapters/aws/s3.go` (etc.) |
| VersionService | Periodic GitHub release check with retry + cache | `pkg/proxy/internal/version/version.go` |
| Cache | In-memory TTL cache (sync.RWMutex guarded) | `pkg/proxy/internal/cache/cache.go` |
| Config | File-based + env var config via ayotl library | `pkg/proxy/internal/config/config.go` |
| Ports/Interfaces | All interfaces: ProxyService, *Port, *ClientPort | `pkg/proxy/internal/ports/` (5 files) |
| Views | Vue pages per service (42 files incl. tests) | `pkg/ui/src/views/services/*.vue` |
| Composables | Reactive state + API orchestration per service | `pkg/ui/src/composables/use*.ts` |
| API Services | HTTP fetch per AWS service action | `pkg/ui/src/api/services/*.ts` |
| API Client | Axios singleton with mock SigV4 signing interceptor | `pkg/ui/src/api/client.ts` |
| Pinia Stores | settings (persisted to localStorage) + ui (sidebar state) | `pkg/ui/src/stores/` |
| Router | Hash-based Vue Router with lazy-loaded views | `pkg/ui/src/router/index.ts` |
| E2E Tests | Playwright: fixtures, per-service specs | `pkg/test/e2e/` |

## Pattern Overview

**Overall:** Hexagonal Architecture (Ports & Adapters) for the Go backend, paired with a layered Vue 3 SPA frontend communicating via REST.

**Key Characteristics:**
- **Port separation**: `pkg/proxy/internal/ports/` defines all interfaces (`ProxyService`, `S3Port`, `CachePort`, `GitHubClientPort`, etc.). Adapters import ports, never the other way around.
- **Two layers of adapters** (inbound: HTTP, outbound: AWS SDK + GitHub)
- **Manually wired DI** in `application.NewContainer()` — no code generation, no Wire framework
- **Service-routed HTTP**: single `/:service/*path` route dispatches by service name → `ServiceRouter()` switch statement
- **Vue 3 Composition API** with `<script setup>` throughout; composables encapsulate all async state + API calls
- **Hash-based routing** in Vue Router to avoid conflicts with S3 proxy paths

## Layers

**HTTP Handlers (Inbound Adapters):**
- Purpose: Parse HTTP requests, dispatch to proxy service, format JSON responses
- Location: `pkg/proxy/internal/adapters/http/`
- Contains: Gin handler functions, one file per AWS service + `handlers.go` (router, CORS, health, region)
- Depends on: `ports.ProxyService`, `ports.VersionServicePort`
- Used by: Container (`setupRoutes()`)

**ProxyService (Core Domain):**
- Purpose: Holds all AWS adapter instances, manages region switching, exposes accessor methods
- Location: `pkg/proxy/internal/proxy/service.go`
- Contains: `ProxyService` struct with region-aware AWS SDK config initialization
- Depends on: `internal/config`, `internal/adapters/aws/` (via ports)
- Used by: HTTP handlers (via `ports.ProxyService` interface)

**AWS Adapters (Outbound Adapteers):**
- Purpose: Thin wrappers over AWS SDK v2 service clients, targeting emulator base endpoint
- Location: `pkg/proxy/internal/adapters/aws/`
- Contains: 20 service adapter files (s3.go, lambda.go, etc.), each with constructor + delegation methods
- Depends on: `ports.S3ClientPort` etc., AWS SDK v2
- Used by: ProxyService

**Config (Cross-cutting):**
- Purpose: Load config from YAML file + env var overrides via ayotl library
- Location: `pkg/proxy/internal/config/config.go`
- Contains: `Config` struct, `LoadConfig()` with default fallback
- Used by: Container, ProxyService

**Cache (Cross-cutting):**
- Purpose: In-memory TTL cache for version check results
- Location: `pkg/proxy/internal/cache/cache.go`
- Contains: `Cache` struct with Set/Get/Delete/GetOrSet, sync.RWMutex guarded
- Used by: VersionService

**VersionService (Sidecar):**
- Purpose: Periodic GitHub release version check with retry logic
- Location: `pkg/proxy/internal/version/version.go`
- Contains: `VersionService` struct, scheduler loop, retry with backoff
- Depends on: `ports.CachePort`, `ports.GitHubClientPort`
- Used by: Container (started via `RunScheduler()`)

**Frontend Views:**
- Purpose: Page-level components per AWS service
- Location: `pkg/ui/src/views/services/*.vue`
- Contains: 20 service views + Dashboard, Logs, Settings
- Depends on: Composables, common components, router

**Frontend Composables:**
- Purpose: Encapsulate service-specific reactive state and API orchestration
- Location: `pkg/ui/src/composables/use*.ts`
- Contains: 25 composables (per-service + utilities: usePagination, useToast, useConnectionStatus, useContentReload, useServiceRegistry)
- Pattern: Each composable owns `ref()` state, exposes async actions that call API services, error handling with toast

**Frontend API Layer:**
- Purpose: HTTP calls to backend, response parsing
- Location: `pkg/ui/src/api/services/*.ts` (20 files) + `client.ts` (singleton axios), `types/` for shared type definitions
- Depends on: `config.ts` for `PROXY_BACKEND` base URL

## Data Flow

### Primary Request Path (Frontend → Backend → Emulator)

1. **Vue View** (`pkg/ui/src/views/services/S3.vue`) calls composable action, e.g. `loadBuckets()`
2. **Composable** (`pkg/ui/src/composables/useS3.ts:28`) sets `loading=true`, calls API service function
3. **API Service** (`pkg/ui/src/api/services/s3.ts:11`) sends POST to `${PROXY_BACKEND}/s3/` with `X-Amz-Target: s3.ListBuckets` header
4. **Vite dev proxy or nginx** forwards to Go backend at `http://127.0.0.1:8081`
5. **Gin Router** (`pkg/proxy/internal/application/app.go:128`) matches `/:service/*path` → `handler.ServiceRouter()`
6. **ServiceRouter** (`pkg/proxy/internal/adapters/http/handlers.go:86`) switches on `service` → calls `h.handleS3(c)`
7. **S3 handler** (`pkg/proxy/internal/adapters/http/s3.go:75`) calls `h.Svc.S3().ListBuckets(ctx)` (delegates to port interface)
8. **ProxyService.S3()** (`pkg/proxy/internal/proxy/service.go:120`) returns the stored `S3Adapter` instance
9. **S3Adapter.ListBuckets** (`pkg/proxy/internal/adapters/aws/s3.go:30`) calls `a.client.ListBuckets(ctx, &s3.ListBucketsInput{})` — targets emulator endpoint
10. **AWS SDK** sends request to LocalStack/MiniStack at configured `Endpoint` (default `http://localhost:4566`)
11. **Response** propagates back: AWS SDK → S3Adapter → ProxyService → HTTP handler JSON response → axios → composable state update → Vue reactivity

### Health Check Flow

1. **GET /health** (`pkg/proxy/internal/adapters/http/handlers.go:133`)
2. `checkBackendHealth()` probes `/_localstack/health` with 30s cache of probe result
3. Returns JSON with status, region, proxy info, latest version (from VersionService)

### Region Switching Flow

1. **POST /proxy/region** with `{"region":"eu-west-1"}`
2. `SetRegion()` in ProxyService locks mutex, updates region, calls `SetServices()` to recreate all 20 AWS adapters with new region

### Version Check Flow (background)

1. **Container.RunScheduler()** creates ticker at configured interval (default 24h)
2. On tick: `VersionService.checkAndUpdateVersion()` → `github.GetLatestRelease()` → parses tag → caches in `CachePort`
3. **Health endpoint** reads latest version via `VersionSvc.GetLatestVersion()` (from cache or memory)

## Key Abstractions

**Ports (Interfaces):**
- Purpose: Define boundaries between layers — HTTP handlers depend on service ports, service depends on adapter ports
- Examples: `ports.ProxyService` (20+ accessor methods), `ports.S3Port`, `ports.CachePort`, `ports.GitHubClientPort`, `ports.VersionServicePort` — all in `pkg/proxy/internal/ports/`
- Pattern: `*Port` suffix for domain ports, `*ClientPort` suffix for SDK client ports, `er` suffix for service ports

**Adapters:**
- Purpose: Implement port interfaces. Two categories: inbound (HTTP) and outbound (AWS SDK, GitHub)
- Pattern: Constructor `New*Adapter(awsCfg, endpoint)` returns interface type, methods delegate 1:1 to SDK client

**ProxyService:**
- Purpose: Core domain object that owns region state and all 20 AWS adapter instances
- Pattern: Facade — exposes `Region()`, `SetRegion()`, `Config()`, and per-service accessors like `S3() ports.S3Port`

**Container:**
- Purpose: Manual dependency injection container, lifecycle management
- Pattern: Creates ProxyService → adapters → handlers → sets up Gin routes → starts server + scheduler in errgroup

## Entry Points

**Go Backend:**
- Location: `pkg/proxy/cmd/server/main.go`
- Triggers: `go run pkg/proxy/cmd/server/main.go` (or `make run-proxy`)
- Responsibilities: Load config, create Container (wires DI), start HTTP server + version scheduler, handle OS signals (SIGINT/SIGTERM/ SIGKILL) for graceful shutdown via errgroup

**Vue Frontend:**
- Location: `pkg/ui/src/main.ts`
- Triggers: `pnpm run dev` (Vite dev server on :3000)
- Responsibilities: Create Vue app, install Pinia + Vue Router, mount to `#app`

**E2E Tests:**
- Location: `pkg/test/e2e/` (separate Playwright project)
- Triggers: `make test-e2e` (requires LocalStack on :4566)
- Responsibilities: Playwright tests per AWS service, uses hash-based URLs, `fixtures.js` for cleanup utilities

## Architectural Constraints

- **Threading:** Go backend uses goroutines via errgroup. HTTP server runs in one goroutine, version scheduler in another, graceful shutdown listener in a third. No worker pool pattern. Vue frontend is single-threaded (browser event loop).
- **Global state:** `ports` package has no global state. `cache` struct is instantiated per-container. `VersionService` has a mutable `retryDelay` package-level variable (flagged `//nolint:gochecknoglobals`) for test injection.
- **Circular imports:** None detected. Strict layering: `cmd` → `application` → `config` + `ports` + `adapters/http` + `adapters/aws` + `cache` + `version` + `proxy`. No adapter imports adapter or ports imports implementation.
- **Region switching:** `ProxyService.SetRegion()` recreates all 20 AWS adapters under write lock — this is a potential contention point if region is switched under load.
- **Singleton API client:** Frontend `getApiClient()` returns a singleton axios instance created once. Settings store changes (credentials, region) do NOT recreate the client — the mock SignV4 signer reads fresh values from the store at request time.

## Anti-Patterns

### Switch-based Service Routing

**What happens:** `handlers.go:ServiceRouter()` uses a hard-coded switch statement over 20+ service name strings to dispatch to per-service handlers.
**Why it's wrong:** Each new service requires editing this file. No extensibility via registration.
**Do this instead:** Register handler factories in a map at initialization time. See `ports.ProxyService` interface for a service registry pattern — this would be the natural extension point.

### Direct `awsadapter` Imports in ProxyService

**What happens:** `pkg/proxy/internal/proxy/service.go` directly imports `github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/aws` and calls constructors like `awsadapter.NewS3Adapter(...)`.
**Why it's wrong:** This couples the service layer to the adapter implementation. A pure hexagonal architecture would inject adapters via constructor, not import them directly.
**Do this instead:** Pass adapter factories or already-constructed adapters into `NewProxyService()` via the Container. The current design is close (Container calls `proxy.NewProxyService` then `svc.SetServices()` which creates adapters), but `SetServices()` is a public method that directly instantiates adapters.

### JSON Key Case Transformation

**What happens:** `handlers.go:transformJSONKeys()` does a naive string-level capitalization of JSON keys for AWS SDK compatibility (camelCase → PascalCase).
**Why it's wrong:** String manipulation of JSON is fragile — it could corrupt string values containing `"` or complex Unicode. This bypasses json.Unmarshal with proper field tags.
**Do this instead:** Define proper JSON struct tags or use a `json.Decoder` with `UseNumber()`, then recursively transform keys on the parsed map.

## Error Handling

**Strategy:** Errors propagate up: AWS SDK error → adapter propagates → handler logs + returns JSON error response. Frontend interceptors catch HTTP errors and show toast notifications.

**Patterns:**
- Backend: `sendError()` helper logs and returns `{"error": "message"}` JSON
- Backend: `handlers.go:sendError()` logs the error, returns user-safe message to client
- Frontend: API client interceptor (`client.ts:150`) handles network errors (CORS), 500+, and throws typed `APIError`
- Frontend: Composables catch `APIError`, show toast, and re-throw for views
- Frontend: Client 4xx errors are not toasted (expected for "not found" scenarios)

## Cross-Cutting Concerns

**Logging:** Go backend uses `log.Printf` throughout — no structured logging library. `application.app.go` sets up `gin.Logger()` middleware for request logging.

**Validation:** Minimal. Backend validates region is non-empty in `SetRegion()`. Request body parsing in handlers is per-endpoint. No centralized validation layer.

**Authentication:** None. The proxy is designed for local development with mock AWS emulators. Frontend sends `X-Mock-Signature: local-dev-signature` header. No real SigV4 signing implemented. `AWSSigV4Signer` class in `client.ts` is a placeholder.

**CORS:** Backend sets permissive `Access-Control-Allow-Origin: *` with all common AWS headers allowed. This is safe for local dev but would need tightening for production.

**Graceful Shutdown:** `main.go` uses `signal.NotifyContext` + `errgroup` to handle OS signals. When signalled, the shutdown goroutine calls `server.Shutdown()` with 5s timeout and stops the version scheduler. Both goroutines must complete before `wg.Wait()` returns.

---

*Architecture analysis: 2026-05-21*
