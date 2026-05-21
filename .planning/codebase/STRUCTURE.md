# Codebase Structure

**Analysis Date:** 2026-05-21

## Directory Layout

```
mydevstack/
├── pkg/
│   ├── proxy/                         # Go backend — hexagonal architecture
│   │   ├── cmd/server/main.go         # Entry point
│   │   ├── config.yaml                # YAML config template (env var substitution)
│   │   ├── config.yaml.example        # Example config
│   │   ├── .golangci.yml              # Linter config (v2, excludes mocks)
│   │   ├── .mockery.yml               # Mock generator config
│   │   ├── internal/
│   │   │   ├── ports/                 # Interface definitions (the "ports")
│   │   │   │   ├── aws_client.go      # Low-level AWS SDK client interfaces (20+ services)
│   │   │   │   ├── service.go         # High-level service port interfaces + ProxyService
│   │   │   │   ├── cache.go           # CachePort (2 methods)
│   │   │   │   ├── github_client.go   # GitHubClientPort + Release type
│   │   │   │   └── version.go         # VersionServicePort
│   │   │   ├── proxy/
│   │   │   │   ├── service.go         # ProxyService implementation (facade + region mgmt)
│   │   │   │   └── service_test.go
│   │   │   ├── config/
│   │   │   │   ├── config.go          # Config struct + LoadConfig() (ayotl lib)
│   │   │   │   └── config_test.go
│   │   │   ├── cache/
│   │   │   │   ├── cache.go           # In-memory TTL cache
│   │   │   │   └── cache_test.go
│   │   │   ├── version/
│   │   │   │   ├── version.go         # Version check service (GitHub + scheduler)
│   │   │   │   └── version_test.go
│   │   │   ├── application/
│   │   │   │   ├── app.go             # DI Container, route setup, server lifecycle
│   │   │   │   └── app_test.go
│   │   │   └── adapters/
│   │   │       ├── aws/               # AWS SDK driven adapters (20+ files)
│   │   │       │   ├── s3.go + _test.go
│   │   │       │   ├── lambda.go + _test.go
│   │   │       │   ├── dynamodb.go + _test.go
│   │   │       │   ├── iam.go + _test.go
│   │   │       │   ├── sqs.go + _test.go
│   │   │       │   ├── sns.go + _test.go
│   │   │       │   ├── kms.go + _test.go
│   │   │       │   ├── rds.go + _test.go
│   │   │       │   ├── elasticache.go + _test.go
│   │   │       │   ├── kinesis.go + _test.go
│   │   │       │   ├── stepfunctions.go + _test.go
│   │   │       │   ├── apigateway.go + _test.go
│   │   │       │   ├── apigatewayv2.go + _test.go
│   │   │       │   ├── ssm.go + _test.go
│   │   │       │   ├── secretsmanager.go + _test.go
│   │   │       │   ├── sesv2.go + _test.go
│   │   │       │   ├── msk.go + _test.go
│   │   │       │   ├── opensearch.go + _test.go
│   │   │       │   ├── cloudformation.go + _test.go
│   │   │       │   ├── cloudwatch.go + _test.go
│   │   │       │   ├── cloudwatchlogs.go + _test.go
│   │   │       │   ├── dynamodbstreams.go + _test.go
│   │   │       │   └── assert.go      # Test assertion helpers
│   │   │       ├── github/
│   │   │       │   ├── release.go     # GitHub API client
│   │   │       │   └── release_test.go
│   │   │       └── http/              # Gin HTTP driving adapters
│   │   │           ├── handlers.go    # ProxyHandler, ServiceRouter, HealthCheck, helpers
│   │   │           ├── handlers_test.go
│   │   │           ├── interfaces.go  # Per-service interfaces for handlers
│   │   │           ├── s3.go + _test.go
│   │   │           ├── lambda.go + _test.go
│   │   │           ├── dynamodb.go + _test.go
│   │   │           ├── iam.go + _test.go
│   │   │           ├── sqs.go + _test.go
│   │   │           ├── sns.go + _test.go
│   │   │           ├── kms.go + _test.go
│   │   │           ├── rds.go + _test.go
│   │   │           ├── elasticache.go + _test.go
│   │   │           ├── kinesis.go + _test.go
│   │   │           ├── msk.go + _test.go
│   │   │           ├── opensearch.go + _test.go
│   │   │           ├── apigateway.go + _test.go
│   │   │           ├── secretsmanager.go + _test.go
│   │   │           ├── cloudformation.go + _test.go
│   │   │           ├── cloudwatch.go + _test.go
│   │   │           ├── cloudwatchlogs.go + _test.go
│   │   │           ├── dynamodbstreams.go + _test.go
│   │   │           ├── sesv2.go + _test.go
│   │   │           ├── sfn.go + _test.go
│   │   │           └── ssm.go + _test.go
│   │   └── mocks/
│   │       └── ports/                 # Generated testify mocks
│   │
│   ├── ui/                            # Vue 3 SPA frontend
│   │   ├── package.json               # pnpm workspace package
│   │   ├── vite.config.ts             # Vite config + dev proxy rules
│   │   ├── vitest.config.ts           # Vitest config
│   │   ├── tsconfig.json              # TypeScript config (strict false, @ alias)
│   │   ├── tailwind.config.js         # TailwindCSS config
│   │   ├── postcss.config.js          # PostCSS config
│   │   ├── eslint.config.js           # Flat ESLint config
│   │   ├── index.html                 # HTML shell
│   │   ├── .storybook/                # Storybook config
│   │   └── src/
│   │       ├── main.ts                # Entry: createApp, Pinia, Router
│   │       ├── App.vue                # Root: Sidebar + TopBar + router-view + Toast
│   │       ├── config.ts              # Env-based client config (VITE_PROXY_BACKEND)
│   │       ├── env.d.ts               # Vue SFC type declarations
│   │       ├── router/
│   │       │   ├── index.ts           # Hash-based routes (20+ service routes)
│   │       │   └── index.test.ts
│   │       ├── stores/
│   │       │   ├── settings.ts + test  # Pinia: creds, region, theme, prefs
│   │       │   └── ui.ts + test       # Pinia: sidebar, modals, loading, search
│   │       ├── api/
│   │       │   ├── client.ts + test   # Axios singleton + SigV4 mock signer
│   │       │   ├── types/
│   │       │   │   └── aws.ts         # AWS API response types
│   │       │   └── services/          # Per-service API modules
│   │       │       ├── s3.ts + test
│   │       │       ├── lambda.ts + test
│   │       │       ├── dynamodb.ts + test
│   │       │       ├── iam.ts + test
│   │       │       ├── index.ts       # Barrel
│   │       │       └── ... 20+ service modules
│   │       ├── composables/           # Logic + state per service
│   │       │       ├── useS3.ts + test
│   │       │       ├── useLambda.ts + test
│   │       │       ├── useDynamoDB.ts + test
│   │       │       ├── ... 20+ composables
│   │       │       ├── useToast.ts + test
│   │       │       ├── usePagination.ts + test
│   │       │       ├── useConnectionStatus.ts + test
│   │       │       ├── useServiceRegistry.ts + test
│   │       │       └── useContentReload.ts + test
│   │       ├── components/
│   │       │   ├── common/            # Reusable UI components (25+)
│   │       │   │   ├── Modal.vue + test + stories
│   │       │   │   ├── DataTable.vue + test + stories
│   │       │   │   ├── Button.vue + test + stories
│   │       │   │   ├── FormInput.vue + test + stories
│   │       │   │   ├── LoadingSpinner.vue + test + stories
│   │       │   │   ├── Toast.vue + test + stories
│   │       │   │   ├── EmptyState.vue + test + stories
│   │       │   │   ├── ServiceTable.vue + test
│   │       │   │   ├── ServiceModal.vue + test
│   │       │   │   ├── UniversalCreateDeleteModal.vue + test
│   │       │   │   ├── UniversalViewModal.vue + test
│   │       │   │   ├── JsonViewer.vue + stories
│   │       │   │   ├── Tabs.vue + test + stories
│   │       │   │   ├── StatusBadge.vue + stories
│   │       │   │   ├── CodeSnippet.vue + test + stories
│   │       │   │   ├── ConfirmModal.vue + test + stories
│   │       │   │   ├── FormSelect.vue + test + stories
│   │       │   │   ├── AboutModal.vue + test
│   │       │   │   └── index.ts       # Barrel exports
│   │       │   ├── layout/            # App shell components
│   │       │   │   ├── Sidebar.vue + test + index.ts
│   │       │   │   ├── TopBar.vue + test
│   │       │   │   └── ServiceCard.vue + test
│   │       │   ├── s3/                # S3-specific components
│   │       │   │   ├── S3BucketsList.vue + test + stories
│   │       │   │   ├── S3ObjectsList.vue + test + stories
│   │       │   │   ├── S3BucketDetails.vue + test + stories
│   │       │   │   ├── S3CreateModal.vue + test + stories
│   │       │   │   ├── S3DeleteModal.vue + test + stories
│   │       │   │   ├── S3ViewModal.vue + test
│   │       │   │   ├── S3PolicyModal.vue
│   │       │   │   ├── S3TriggerModal.vue + test + stories
│   │       │   │   ├── S3CodeExamples.vue + test
│   │       │   │   ├── integration.test.ts
│   │       │   │   └── index.ts
│   │       │   ├── lambda/            # Lambda-specific components
│   │       │   ├── dynamodb/
│   │       │   ├── iam/
│   │       │   ├── sqs/
│   │       │   ├── sns/
│   │       │   ├── kms/
│   │       │   ├── rds/
│   │       │   ├── elasticache/
│   │       │   ├── cloudformation/
│   │       │   ├── cloudwatch/
│   │       │   ├── kinesis/
│   │       │   ├── apigateway/
│   │       │   ├── ssm/
│   │       │   ├── secretsmanager/
│   │       │   ├── ses/
│   │       │   ├── msk/
│   │       │   ├── opensearch/
│   │       │   └── stepfunctions/
│   │       ├── views/
│   │       │   ├── Dashboard.vue + test
│   │       │   ├── Settings.vue + test
│   │       │   ├── Logs.vue + test
│   │       │   └── services/          # Page-level views per service
│   │       │       ├── S3.vue + test
│   │       │       ├── Lambda.vue + test
│   │       │       ├── ... 20+ service views
│   │       ├── types/
│   │       │   ├── services.ts + test  # Service type definitions
│   │       │   └── serviceRegistry.ts + test
│   │       └── styles/
│   │           └── main.css           # TailwindCSS imports + custom styles
│   │
│   └── test/                          # E2E Playwright tests (standalone npm project)
│       ├── package.json               # pnpm with playwright
│       ├── playwright.config.ts       # baseURL :3000, retries 2, workers 3
│       ├── docker-compose.yml         # Floci container for E2E
│       ├── fixtures.js                # Playwright fixtures (cleanup helpers)
│       ├── setup.ts                   # Test setup
│       ├── health.spec.ts             # Health check E2E
│       ├── common/                    # Shared E2E utilities
│       └── e2e/services/             # Per-service E2E specs
│           ├── iam.spec.ts
│           ├── elasticache.spec.ts
│           ├── rds.spec.ts
│           └── ...
│
├── build/
│   ├── Dockerfile                     # Multi-platform Go binary + Vue dist
│   └── nginx.conf                     # Production nginx config
│
├── .github/workflows/
│   ├── test.yml                       # CI: lint → unit → E2E
│   └── release.yml                    # CI: tag → build → release
│
├── docker-compose.yml                 # Main services
├── docker-compose-floci.yml           # Floci (for CI)
├── docker-compose-ministack.yml       # MiniStack alternative
├── go.mod + go.sum                    # Go module (github.com/my-devstack/mydevstack)
├── Makefile                           # Build, lint, test commands
├── AGENTS.md                          # Agent configuration
├── ADDING_SERVICES.md                 # Workflow for adding new services
├── CHANGELOG.md
└── README.md
```

## Directory Purposes

**`pkg/proxy/`** — Go 1.26 backend implementing an AWS service proxy with hexagonal architecture. Contains all server-side logic: config loading, DI container, port interfaces, AWS SDK adapter implementations, HTTP handlers, and generated mocks.

**`pkg/proxy/cmd/server/`** — Application entry point. `main.go` calls config loader, creates the DI container, starts the HTTP server and version check scheduler.

**`pkg/proxy/internal/ports/`** — Interface definitions. Defines all port contracts: `ProxyService` (facade for 20+ services), low-level AWS SDK client interfaces (`S3ClientPort`, `LambdaClientPort`, etc.), `CachePort`, `GitHubClientPort`, `VersionServicePort`.

**`pkg/proxy/internal/proxy/`** — `ProxyService` implementation. Concrete struct that implements the `ports.ProxyService` interface. Manages region lifecycle (mutex-protected), creates/recreates all AWS adapters via `SetServices()`.

**`pkg/proxy/internal/adapters/aws/`** — AWS SDK driven adapters. One file per service, each implementing the corresponding high-level port interface by wrapping the AWS SDK v2 client.

**`pkg/proxy/internal/adapters/http/`** — Gin HTTP driving adapters. One handler file per service + shared `handlers.go` (router, health, CORS) + `interfaces.go` (per-service interfaces). Each handler dispatches by `X-Amz-Target` header.

**`pkg/proxy/mocks/ports/`** — Auto-generated testify mock implementations for all ports in `internal/ports/`. Generated by `make mockery` using `.mockery.yml` config.

**`pkg/ui/`** — Vue 3 SPA frontend. Composition API + `<script setup>` + TypeScript. Pinia for state management, TailwindCSS for styling, Vite for dev/build.

**`pkg/ui/src/api/services/`** — Per-service API modules. Each exports functions that call the Go proxy backend via the shared Axios client. Corresponds 1:1 with backend services.

**`pkg/ui/src/composables/`** — Per-service composables. Each `use{Service}()` encapsulates all reactive state, API calls, and error handling for a single AWS service. Also includes cross-cutting composables (`useToast`, `usePagination`, `useConnectionStatus`).

**`pkg/ui/src/components/common/`** — Reusable UI component library. Each component has a `.vue` file, a `.test.ts` (unit test), and a `.stories.ts` (Storybook). Barrel exported from `index.ts`.

**`pkg/ui/src/components/{service}/`** — Per-service component folders. Each contains sub-components (lists, modals, details) with tests, stories, and barrel export.

**`pkg/ui/src/views/services/`** — Page-level view components. One per route, composes service-specific components with the composable.

**`pkg/test/`** — Standalone Playwright E2E test project. Uses separate `package.json` and `node_modules`. Tests run against the running app (Vite dev or preview) with Floci/LocalStack backend.

## Key File Locations

**Entry Points:**
- `pkg/proxy/cmd/server/main.go`: Go backend entry point
- `pkg/ui/src/main.ts`: Vue SPA entry point
- `pkg/ui/index.html`: HTML shell

**Configuration:**
- `pkg/proxy/config.yaml`: Default config template with `${ENV_VAR}` substitution
- `pkg/proxy/config.yaml.example`: Example config
- `pkg/ui/src/config.ts`: Frontend config (`VITE_PROXY_BACKEND` env var)
- `pkg/ui/vite.config.ts`: Vite config with AWS service proxy rules
- `pkg/ui/vitest.config.ts`: Vitest test runner config
- `pkg/ui/tsconfig.json`: TypeScript config
- `pkg/ui/tailwind.config.js`: TailwindCSS theme config
- `pkg/ui/eslint.config.js`: Flat ESLint config
- `pkg/proxy/.golangci.yml`: Go linter config
- `pkg/proxy/.mockery.yml`: Mock generation config
- `pkg/test/playwright.config.ts`: E2E test config

**Core Logic (Go Backend):**
- `pkg/proxy/internal/ports/service.go`: `ProxyService` composite interface + 20+ service port interfaces
- `pkg/proxy/internal/ports/aws_client.go`: 20+ low-level AWS SDK client port interfaces
- `pkg/proxy/internal/proxy/service.go`: `ProxyService` concrete implementation
- `pkg/proxy/internal/application/app.go`: DI Container, route setup, server lifecycle
- `pkg/proxy/internal/adapters/http/handlers.go`: `ProxyHandler`, `ServiceRouter`, helpers
- `pkg/proxy/internal/adapters/aws/s3.go`: S3 adapter (example adapter pattern)

**Core Logic (Vue Frontend):**
- `pkg/ui/src/api/client.ts`: Axios singleton with mock SigV4 signing
- `pkg/ui/src/composables/useS3.ts`: Example composable pattern
- `pkg/ui/src/stores/settings.ts`: Pinia settings store
- `pkg/ui/src/stores/ui.ts`: Pinia UI store
- `pkg/ui/src/router/index.ts`: Route definitions

**Testing:**
- `pkg/proxy/internal/application/app_test.go`: Integration tests for DI + routes
- `pkg/proxy/internal/adapters/http/handlers_test.go`: Handler integration tests with mocks
- `pkg/ui/src/components/s3/integration.test.ts`: Vue component integration test example
- `pkg/test/e2e/services/iam.spec.ts`: Playwright E2E test example

## Naming Conventions

**Files (Go):**
- `snake_case.go` for all Go files
- `{name}_test.go` for test files (co-located)
- Per-service files match the AWS service name: `s3.go`, `lambda.go`, `iam.go`

**Files (Vue):**
- `PascalCase.vue` for Vue components (e.g., `DataTable.vue`, `S3BucketsList.vue`)
- `camelCase.ts` for TypeScript modules (e.g., `api/client.ts`, `composables/useS3.ts`)
- `kebab-case.vue` for views (e.g., `LambdaEventSourceMapping.vue`)
- Component folders match the service name in lowercase: `s3/`, `lambda/`, `iam/`

**Functions (Go):**
- `PascalCase` for exported functions and methods
- `camelCase` for unexported functions and methods
- Factory functions: `New{Type}` (e.g., `NewProxyService`, `NewS3Adapter`)

**Functions (Vue):**
- `camelCase` for functions and composable return values
- `PascalCase` for component names and `defineProps<Props>()` type names

**Variables (Go):**
- `camelCase` for local variables
- `PascalCase` for exported constants and variables

**Variables (Vue):**
- `camelCase` for refs, computed, and functions
- `UPPER_CASE` for environment-derived config constants (`PROXY_BACKEND`)

**Types (Go):**
- `PascalCase` for structs, interfaces, and type aliases
- Interface suffix: `Port` for output ports (e.g., `S3Port`, `CachePort`), `Service` for handler-facing interfaces

**Types (Vue):**
- `PascalCase` for TypeScript interfaces and types (e.g., `SettingsState`, `LoadingState`)
- `PascalCase` for props interfaces (e.g., `Props` local to each component)
- `camelCase` for event names

## Where to Add New Code

**New AWS Service (Backend):**
1. Interface: Add `{Service}ClientPort` to `internal/ports/aws_client.go`
2. Port: Add `{Service}Port` to `internal/ports/service.go`
3. Adapter: Create `internal/adapters/aws/{service}.go` implementing `{Service}Port`
4. ProxyService: Add field + accessor in `internal/proxy/service.go`
5. Handler interface: Add `{Service}Service` to `internal/adapters/http/interfaces.go`
6. Handler: Create `internal/adapters/http/{service}.go` with X-Amz-Target dispatch
7. Route: Add `case "servicename":` to `ServiceRouter` in `handlers.go`
8. Tests: Create `_test.go` for adapter + handler
9. Mocks: Run `make mockery` to regenerate mocks

**New AWS Service (Frontend):**
1. API client: Create `src/api/services/{service}.ts`
2. Types: Add response types to `src/types/services.ts`
3. Composable: Create `src/composables/use{Service}.ts` + test
4. Components: Create `src/components/{service}/` with sub-components, stories, tests, barrel
5. Component integration test: Add `integration.test.ts` in component folder
6. View: Create `src/views/services/{Service}.vue` + test
7. Route: Add to `src/router/index.ts`
8. Nav: Add to `src/components/layout/Sidebar.vue`
9. E2E: Create `pkg/test/e2e/services/{service}.spec.ts`

**New Shared Component (Frontend):**
- Implementation: `src/components/common/{ComponentName}.vue`
- Unit test: `src/components/common/{ComponentName}.test.ts`
- Storybook: `src/components/common/{ComponentName}.stories.ts`
- Barrel: Add to `src/components/common/index.ts`

**New Composable (Frontend):**
- Implementation: `src/composables/use{*}.ts`
- Unit test: `src/composables/use{*}.test.ts`

## Special Directories

**`pkg/proxy/mocks/`**
- Purpose: Generated testify mock implementations of port interfaces
- Generated: Yes (by `make mockery`)
- Committed: Yes (committed for CI speed)

**`pkg/ui/src/components/common/`**
- Purpose: Shared reusable UI component library
- Generated: No
- Committed: Yes

**`pkg/test/e2e/`**
- Purpose: Standalone Playwright E2E test project
- Generated: No
- Committed: Yes (separate `package.json` from UI)

**`pkg/ui/dist/`**
- Purpose: Production build output
- Generated: Yes (by `make dist` or `pnpm run build`)
- Committed: No (in `.gitignore`)

**`pkg/ui/storybook-static/`**
- Purpose: Static Storybook build
- Generated: Yes (by `pnpm run build-storybook`)
- Committed: No

**`pkg/proxy/coverage.out` / `pkg/proxy/coverage.html` / `unit.html`**
- Purpose: Go test coverage reports
- Generated: Yes (by `make unit-coverage`)
- Committed: No

---

*Structure analysis: 2026-05-21*
