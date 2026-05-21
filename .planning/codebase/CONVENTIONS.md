# Coding Conventions

**Analysis Date:** 2026-05-21

## Overview

This codebase has two distinct technology stacks with independent conventions:
- **Go backend** (`pkg/proxy/`) — hexagonal architecture, AWS proxy
- **Vue 3 frontend** (`pkg/ui/`) — Composition API, TypeScript, Pinia stores

## Naming Patterns

### Go

**Files:**
- `snake_case.go` — lowercase, underscore-separated
  - `apigatewayv2.go`, `cloudwatchlogs.go`, `dynamodbstreams.go`
  - Test files: `handlers_test.go`, `dynamodb_test.go`

**Functions/Methods:**
- `PascalCase` for exported functions and methods
  - `ListBuckets`, `CreateFunction`, `NewProxyService`, `SetRegion`
- `camelCase` for unexported/private functions
  - `readBody`, `parseBody`, `transformJSONKeys`, `sendError`, `checkBackendHealth`
  - `listBuckets`, `getObject` (unexported handler methods on `ProxyHandler`)

**Variables:**
- `camelCase` for all local variables
  - `cfg`, `svc`, `bodyBytes`, `response`, `statusCode`
- Single-letter receiver names used per Go convention: `h` for `*ProxyHandler`, `c` for `*Container`

**Types:**
- `PascalCase` for exported types
  - `ProxyHandler`, `Container`, `Config`, `ProxyService`
- Interface names suffixed with `Port` (in `internal/ports/`)
  - `S3Port`, `LambdaPort`, `DynamoDBPort`, `VersionServicePort`
- Interface names suffixed with `Service` (in `internal/adapters/http/interfaces.go`)
  - `S3Service`, `LambdaService`, `ConfigGetter`

**Constants:**
- `PascalCase` using Go iota pattern (`StatusActive Status = iota + 1`)

### Vue/TypeScript

**Files:**
- `PascalCase.vue` — Vue Single File Components
  - `S3BucketsList.vue`, `IAMCreateUserModal.vue`, `APIGatewayRouteModal.vue`
- `camelCase.ts` — modules, composables, API clients
  - `useS3.ts`, `settings.ts`, `s3.ts`, `client.ts`
- `PascalCase.test.ts` — test files match their source component name
  - `useS3.test.ts`, `S3BucketsList.test.ts`, `integration.test.ts`

**Functions:**
- `camelCase` for all functions
  - `listBuckets()`, `loadBuckets()`, `createBucket()`, `toggleDarkMode()`
- `camelCase` for composable returns (`loadBuckets`, `createBucket`, `selectedBucket`)

**Variables:**
- `camelCase` for all local variables
  - `response`, `error`, `mockBuckets`
- `SCREAMING_SNAKE_CASE` for config values
  - `PROXY_BACKEND`

**Types/Interfaces:**
- `PascalCase` for TypeScript types and interfaces
  - `S3Bucket`, `S3Object`, `TriggerConfig`, `ToastItem`, `ToastType`
  - `Theme`, `SidebarPosition`, `Provider` (union types)
- `SettingsState` — interface for Pinia store state shape

**Components:**
- Multi-word `PascalCase` (basic convention, but ESLint `vue/multi-word-component-names` is **off**)
- Prefixed by service domain: `S3*`, `IAM*`, `KMS*`, `Lambda*`, `APIGateway*`, `CloudWatch*`
- Common reusable components in `common/`: `Button`, `Modal`, `FormInput`, `FormSelect`, `LoadingSpinner`, `EmptyState`, `DataTable`, `Toast`, `StatusBadge`, `JsonViewer`, `CodeSnippet`, `ConfirmModal`, `Tabs`

## Code Style

### Go Formatting
- **Formatter:** `gofmt` (standard Go tooling)
- **Linter:** `golangci-lint` via `.golangci.yml` at `pkg/proxy/`
  - Config: version `2`, excludes `mocks/` path only
  - Run via: `make lint-proxy` or `cd pkg/proxy && golangci-lint run`
- **Import ordering:** Standard Go groups (stdlib → external → internal) separated by blank lines

### TypeScript/Vue Formatting
- **Linter:** ESLint flat config at `pkg/ui/eslint.config.js`
- **Config details:**
  - `typescript-eslint` recommended rules
  - `eslint-plugin-vue` flat/recommended rules
  - `eslint-plugin-storybook` recommended rules
  - **Not enforced** (turned off): `vue/multi-word-component-names`, `vue/require-default-prop`, `vue/no-unused-vars`, `vue/no-v-html`, `vue/require-prop-types`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-empty-function`, `no-console`, `no-unused-vars`, `no-empty`, `no-redeclare`
  - **Warn only:** `no-debugger`
  - Run via: `make lint-ui` or `cd pkg/ui && pnpm run lint`
- **No Prettier** — no `.prettierrc*` detected (formatting handled by ESLint or editor defaults)

## Import Organization

### Go
1. Standard library (`context`, `io`, `log`, `net/http`, `testing`, `time`)
2. Blank line
3. External dependencies (`github.com/aws/*`, `github.com/gin-gonic/gin`, `github.com/stretchr/testify/*`)
4. Blank line
5. Internal package imports (`github.com/my-devstack/mydevstack/pkg/proxy/internal/...`, `mockports`)

### TypeScript/Vue
1. Vue core (`import { ref, computed } from 'vue'`)
2. External lib (`import axios from 'axios'`, `import { defineStore } from 'pinia'`, `import { useRouter } from 'vue-router'`)
3. Config/constants (`import { PROXY_BACKEND } from '@/config'`)
4. Stores/composables (`import { useSettingsStore } from '@/stores/settings'`, `import { useS3 } from '@/composables/useS3'`)
5. API modules (`import * as s3Api from '@/api/services/s3'`)
6. Components (`import S3BucketsList from '@/components/s3/S3BucketsList.vue'`)
7. Types (`import type { S3Bucket } from '@/api/types/aws'`)

**Path Aliases:**
- `@` → `pkg/ui/src` (configured in `vite.config.ts`, `vitest.config.ts`, and `tsconfig`)

## Error Handling

### Go
**Pattern: Return errors with `fmt.Errorf` and `%w` wrapping:**
```go
// From handlers.go
if err := json.Unmarshal(bodyBytes, target); err != nil {
    return fmt.Errorf("failed to parse request body: %w", err)
}
```

**Pattern: `sendError` helper for HTTP handler errors:**
```go
func sendError(c *gin.Context, status int, message string, err error) {
    if err != nil {
        log.Printf("%s: %v", message, err)
    }
    c.JSON(status, gin.H{"error": message})
}
```

**Pattern: Health check caching with `sync.RWMutex` double-check locking:**
```go
h.mu.RLock()
if !h.lastHealthCheck.IsZero() && time.Since(h.lastHealthCheck) < 30*time.Second {
    defer h.mu.RUnlock()
    return h.backendHealthy
}
h.mu.RUnlock()
```

**Pattern: `parseBody` handles empty body gracefully:**
```go
if len(bodyBytes) == 0 {
    return nil
}
```

### Vue/TypeScript
**Pattern: async/await with try/catch and user-facing toast notifications:**
```typescript
async function loadBuckets() {
  loading.value = true
  try {
    const response = await s3Api.listBuckets()
    buckets.value = response
  } catch (error) {
    toast.error('Failed to load buckets: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    loading.value = false
  }
}
```

**Pattern: Custom `APIError` class with statusCode, service, errorCode, details:**
```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public service: string,
    public errorCode?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }
}
```

**Pattern: CORS/network error detection in axios interceptor:**
```typescript
const isCorsError = 
  message?.includes('Network Error') ||
  message?.includes('Failed to fetch') ||
  request?.readyState === 0 ||
  !response
```

## Logging

### Go
- Package-level `log` (standard library `log` package) — no structured logging framework detected
- Log format: `log.Printf`, `log.Println`
- Error context includes operation name before error value
```go
log.Printf("%s: %v", message, err)
log.Printf("http server started")
log.Println("shutting down gracefully http server")
```

### Vue/TypeScript
- `console.error()` for API errors
- `console.log` is allowed (ESLint `no-console: off`)
- User-facing errors use `toast.error()` composable

## Comments

### Go
**Doc comments on exported types and functions:**
```go
// checkBackendHealth probes the emulator health endpoint with 30s cache.
// If no health check URL configured, returns healthy by default.
func (h *ProxyHandler) checkBackendHealth() bool {
```

**Section marker comments in test files:**
```go
// ---------------------------------------------------------------------------
// Common test infrastructure
// ---------------------------------------------------------------------------
```

**Keep comments concise and explain WHY, not what (the code shows what)**

### Vue/TypeScript
**JSDoc/TSDoc used sparingly — only for major modules:**
```typescript
/**
 * S3 Service API Client
 * Simple HTTP client for S3 via Go proxy
 * @module api/services/s3
 */
```

**Inline comments for complex logic:**
```typescript
// Always use the fixed endpoint from config
```

## Function Design

### Go
- **Receiver methods:** Value receivers for read-only access; pointer receivers when state mutation needed
- **Constructor pattern:** `New*` functions return pointer to struct
  - `NewProxyService`, `NewProxyHandler`, `NewContainer`, `NewVersionService`
- **Helper functions** are small and focused (e.g., `readBody`, `parseBody`, `sendError`, `transformJSONKeys`)
- **Exhaustive switch** with explicit handler per service in `ServiceRouter`
- **`context.Context`** as first argument for all external-facing operations

### Vue/TypeScript
- **Composables** encapsulate state + operations: `useS3()`, `useIAM()`, `useToast()`
- **Composables return** `{ state, methods }` object pattern
- **View components** compose composables but stay thin (orchestration layer)
- **API service modules** (`api/services/*.ts`) handle HTTP calls only
- **Functions default parameters** used: `contentType: string = 'text/plain'`
- **Optional chaining** throughout: `errorData?.Message`, `response?.data`

## Module Design

### Go
- **Exported types, functions, constants** via `PascalCase` naming
- **Packages** named after their concern (singular):
  - `ports`, `proxy`, `version`, `config` (configloader), `cache`
  - `application`, `httphandlers`, `aws`, `github`
- **Interface assertions** at compile time using `var _ ports.S3Port = (*S3Adapter)(nil)` in `adapters/aws/assert.go`

### Vue/TypeScript
- **Named exports** from composables, API modules, stores
- **Barrel exports:** Every component folder has `index.ts` that re-exports all components
  - `import { S3BucketsList, S3ObjectsList, S3CreateModal } from '@/components/s3'`
- **Default export** for Vue SFCs (component definitions)
- **Named types exported** for external consumption (`export type { ToastType, ToastItem }`)

## Vue-Specific Conventions

**Composition API + `<script setup lang="ts">`** is the universal standard (required):
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// ...
</script>
```

**Props defined with `defineProps<Props>()` and emits with `defineEmits<{...}>()`:**
```typescript
const props = defineProps<{
  buckets: Bucket[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'select-bucket': [bucketName: string]
  'delete-bucket': [bucketName: string]
}>()
```

**Store pattern — Pinia setup stores (not options stores):**
```typescript
export const useSettingsStore = defineStore('settings', () => {
  const region = ref<string>('us-east-1')
  const isDarkMode = computed(() => ...)
  function setRegion(newRegion: string) { ... }
  return { region, isDarkMode, setRegion }
})
```

## Go-Specific Conventions

**Hexagonal Architecture pattern used throughout `pkg/proxy/internal/`:**
- **`internal/ports/`** — Interface definitions (`S3Port`, `LambdaPort`, `ProxyService`)
- **`internal/adapters/aws/`** — AWS SDK adapter implementations
- **`internal/adapters/http/`** — Gin HTTP handler implementations
- **`internal/adapters/github/`** — GitHub client adapter
- **`internal/application/`** — Wiring and server bootstrap
- **`internal/proxy/`** — Core proxy service implementation
- **`internal/cache/`** — Caching layer
- **`internal/config/`** — Configuration loading
- **`internal/version/`** — Version checking service

**Mock generation — mockery with testify template:**

Config in `pkg/proxy/.mockery.yml`:
```yaml
all: true
structname: '{{.InterfaceName}}'
template: testify
packages:
  github.com/my-devstack/mydevstack/pkg/proxy/internal/ports:
    config:
      dir: mocks/ports
      filename: "{{.InterfaceName}}.go"
```
Run via `make mockery`.

---

*Convention analysis: 2026-05-21*
