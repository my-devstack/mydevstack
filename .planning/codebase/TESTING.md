# Testing Patterns

**Analysis Date:** 2026-05-21

## Test Frameworks

### Go Backend (`pkg/proxy/`)

| Concern | Tool | Details |
|---------|------|---------|
| Test runner | `go test` (built-in) | Go 1.26.1 |
| Assertion library | `github.com/stretchr/testify` v1.9+ | `assert`, `mock` packages |
| Mocking | `github.com/vektra/mockery` v2 | Testify-based mocks generated from `internal/ports/` interfaces |
| E2E | Playwright via `pkg/test/` | Separate npm project |

**Run commands:**
```bash
make test                # go test ./pkg/proxy/...
make unit                # go mod tidy + go test with -race -coverprofile, excludes /mocks
make unit-coverage       # unit + HTML coverage report at unit.html
```

### Vue Frontend (`pkg/ui/`)

| Concern | Tool | Details |
|---------|------|---------|
| Test runner | Vitest | Config at `pkg/ui/vitest.config.ts` |
| UI testing | `@vue/test-utils` | Component mounting and interaction |
| DOM environment | `happy-dom` | Lightweight DOM simulation |
| Assertion | Vitest built-in + `expect` | Globals enabled |
| Coverage | `@vitest/coverage-v8` | Provider: v8 |

**Run commands:**
```bash
pnpm run test:run          # Vitest run (CI)
pnpm run test:coverage     # Run with coverage
pnpm run test              # Vitest watch mode
```

### E2E (`pkg/test/`)

| Concern | Tool | Details |
|---------|------|---------|
| Runner | Playwright | Config at `pkg/test/playwright.config.ts` |
| Browser | Chromium (Desktop Chrome) | Single project |
| Workers | 3 | `workers: 3` |
| Retries | 2 | `retries: 2` |
| Timeout | 30s test, 5s expect | |

**Run commands:**
```bash
make test-e2e              # cd pkg/test && pnpm exec playwright test
cd pkg/test && pnpm exec playwright test e2e/services/iam.spec.ts
cd pkg/test && pnpm exec playwright test e2e/services/iam.spec.ts -g "navigate"
```

## Test File Organization

### Go

**Location:** Co-located with source code in the same package
```
pkg/proxy/internal/proxy/service.go          # source
pkg/proxy/internal/proxy/service_test.go      # test
```

**Naming:** `{source_file_name}_test.go`
- `handlers.go` → `handlers_test.go`
- `dynamodb.go` → `dynamodb_test.go`
- `config.go` → `config_test.go`

**Structure:**
```
pkg/proxy/internal/
├── adapters/
│   ├── aws/
│   │   ├── s3.go
│   │   ├── s3_test.go
│   │   ├── dynamodb.go
│   │   ├── dynamodb_test.go
│   │   └── assert.go          # compile-time interface assertions
│   └── http/
│       ├── handlers.go
│       ├── handlers_test.go    # shared test infrastructure + core handler tests
│       ├── s3.go
│       ├── s3_test.go          # S3-specific HTTP handler tests
│       ├── dynamodb.go
│       ├── dynamodb_test.go    # DynamoDB-specific handler tests
│       └── [...service].go / _test.go pairs
├── application/
│   └── app.go / app_test.go
├── config/
│   └── config.go / config_test.go
├── cache/
│   └── cache.go / cache_test.go
├── version/
│   └── version.go / version_test.go
└── proxy/
    └── service.go / service_test.go
```

### Vue/TypeScript

**Location:** Co-located with source code (same directory)
```
pkg/ui/src/composables/useS3.ts
pkg/ui/src/composables/useS3.test.ts          # composable unit test
pkg/ui/src/components/s3/S3BucketsList.vue
pkg/ui/src/components/s3/S3BucketsList.test.ts
pkg/ui/src/components/iam/integration.test.ts  # component integration test
pkg/ui/src/api/services/s3.ts
pkg/ui/src/api/services/s3.test.ts            # API service test
pkg/ui/src/views/services/S3.vue
pkg/ui/src/views/services/S3.test.ts          # view integration test
```

**Naming:** Three patterns:
- `{source}.test.ts` — unit tests for composables, stores, utilities
- `integration.test.ts` — component integration tests within a service folder
- `{View}.test.ts` — view-level integration tests

## Test Structure

### Go — Table-Driven Tests

**Pattern — basic unit test:**
```go
func TestNewProxyService(t *testing.T) {
    cfg := &configloader.Config{
        AWS: configloader.AWSProxyConfig{
            AccessKey: "test",
            SecretKey: "test",
        },
    }

    svc := NewProxyService(cfg)

    if svc == nil {
        t.Fatal("NewProxyService returned nil")
    }

    if svc.Region() != "us-east-1" {
        t.Errorf("Default region = %v, want us-east-1", svc.Region())
    }
}
```

**Pattern — table-driven with `t.Parallel()` and named subtests:**
```go
func TestTransformJSONKeys(t *testing.T) {
    t.Parallel()
    tests := []struct {
        name  string
        input string
        want  string
    }{
        {name: "mixed case keys", input: `{"listBuckets":{}}`, want: `{"listBuckets":{}}`},
        {name: "empty object", input: `{}`, want: `{}`},
    }
    for _, tt := range tests {
        tt := tt
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got := transformJSONKeys(tt.input)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### Vue — `describe`/`it`/`expect`

**Pattern — composable unit test:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('useS3', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { buckets, objects, selectedBucket, loading, uploading } = useS3()
    expect(buckets.value).toEqual([])
    expect(objects.value).toEqual([])
    expect(selectedBucket.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(uploading.value).toBe(false)
  })
})
```

**Pattern — nested `describe` blocks for logical grouping:**
```typescript
describe('Settings Store', () => {
  describe('isDarkMode computed', () => { ... })
  describe('setRegion', () => { ... })
  describe('localStorage persistence', () => { ... })
})
```

## Mocking

### Go — Testify Mocks via Mockery

**Infrastructure:**
- Mocks generated from `internal/ports/` interfaces using `mockery` with `testify` template
- Generated files in `pkg/proxy/mocks/ports/`
- Run `make mockery` after any interface change

**Pattern — mock setup for HTTP handler testing:**
```go
// Test helper to create a fully mocked ProxyService
func createMockSvc(t TWithCleanup, cfg *configloader.Config) *mockports.ProxyService {
    svc := mockports.NewProxyService(t)
    if cfg == nil {
        cfg = &configloader.Config{
            AWS: configloader.AWSProxyConfig{
                Endpoint: "http://localhost:4566",
            },
        }
    }
    svc.EXPECT().Config().Return(cfg).Maybe()
    svc.EXPECT().Region().Return("us-east-1").Maybe()
    svc.EXPECT().SetRegion(mock.Anything).Return(nil).Maybe()
    svc.EXPECT().SetServices().Return(nil).Maybe()
    return svc
}
```

**Pattern — port mock with EXPECT in handler test:**
```go
func TestS3_ListBuckets(t *testing.T) {
    t.Parallel()
    t.Run("success", func(t *testing.T) {
        t.Parallel()
        svc := createMockSvc(t, nil)
        mp := mockports.NewS3Port(t)
        mp.EXPECT().ListBuckets(mock.Anything).Return(&s3.ListBucketsOutput{}, nil)
        svc.EXPECT().S3().Return(mp)
        versionSvc := createTestVersionService(t)
        handler := NewProxyHandler(context.Background(), svc, versionSvc)
        r := setupTestRouter(handler)
        w := performRequest(r, "POST", "/s3/", "ListBuckets", []byte("{}"))
        assert.Equal(t, http.StatusOK, w.Code)
    })
}
```

**Pattern — adapter-level tests with client mocks:**
```go
func TestDynamoDBAdapter_ListTables(t *testing.T) {
    mockClient := ddbmocks.NewDynamoDBClientPort(t)
    ctx := context.Background()
    input := &dynamodb.ListTablesInput{}
    expectedOutput := &dynamodb.ListTablesOutput{TableNames: []string{"test-table"}}
    mockClient.EXPECT().ListTables(ctx, input).Return(expectedOutput, nil)
    adapter := &DynamoDBAdapter{client: mockClient}
    output, err := adapter.ListTables(ctx, input)
    assert.NoError(t, err)
    assert.Equal(t, expectedOutput, output)
}
```

### Vue — `vi.mock` Module-Level Mocks

**Pattern — mocking API modules:**
```typescript
vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(),
  listObjects: vi.fn(),
  createBucket: vi.fn(),
  deleteBucket: vi.fn(),
  putObject: vi.fn(),
  getObject: vi.fn(),
}))
```

**Pattern — mocking composables:**
```typescript
vi.mock('@/composables/useIAM', () => ({
  useIAM: vi.fn(() => ({
    users: { value: [] },
    roles: { value: [] },
    loading: { value: false },
    createUser: vi.fn(),
    deleteUser: vi.fn(),
  })),
}))
```

**Pattern — mocking toast:**
```typescript
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
```

**Pattern — mocking Pinia stores:**
```typescript
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))
```

**Pattern — mock resolved values with `vi.mocked()`:**
```typescript
vi.mocked(s3Api.listBuckets).mockResolvedValue(mockBuckets)
vi.mocked(s3Api.listBuckets).mockRejectedValue(new Error('Network error'))
```

## Test Infrastructure Patterns

### Go HTTP Handler Tests

**Shared test infrastructure in `handlers_test.go`:**
```go
// Test helper types for mock cleanup
type TWithCleanup interface {
    mock.TestingT
    Cleanup(func())
}

// Test Gin router setup
func setupTestRouter(handler *ProxyHandler) *gin.Engine {
    gin.SetMode(gin.TestMode)
    r := gin.New()
    r.GET("/health", handler.HealthCheck)
    r.Any("/:service/*path", handler.ServiceRouter)
    return r
}

// Helper to perform HTTP requests
func performRequest(r *gin.Engine, method, path, target string, body []byte) *httptest.ResponseRecorder {
    w := httptest.NewRecorder()
    req, _ := http.NewRequest(method, path, bytes.NewReader(body))
    if target != "" {
        req.Header.Set("X-Amz-Target", target)
    }
    r.ServeHTTP(w, req)
    return w
}
```

### Vue Component Integration Tests

**Pattern — `mount` with stubs for child components:**
```typescript
import { mount } from '@vue/test-utils'
// Define stubs for all child components
const createStubs = () => ({
  Modal: {
    template: `<div><slot /><slot name="footer" /></div>`,
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'variant', 'size'],
  },
})

const wrapper = mount(IAMCreateUserModal, {
  props: { open: true },
  global: { stubs: createStubs() },
})
```

**Pattern — view-level tests with child component stubs:**
```typescript
const mountStubs = {
  ArchiveBoxIcon: true,
  S3BucketsList: true,
  S3ObjectsList: true,
  S3CreateModal: true,
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
}
```

## Fixtures and Factories

### Go
- Test fixtures are inline struct literals — no separate fixture files
- Config fixtures built inline per test:
```go
cfg := &configloader.Config{
    AWS: configloader.AWSProxyConfig{
        Endpoint: "http://localhost:4566",
    },
    Emulator: "localstack",
}
```

### Vue
- **Mock data** defined inline in tests
- **Shared mock data** at top of file:
```typescript
const mockBuckets = ref([
  { Name: 'test-bucket', CreationDate: '2024-01-01T00:00:00Z' },
  { Name: 'another-bucket', CreationDate: '2024-02-01T00:00:00Z' },
])
```

- **Store init** in `beforeEach`:
```typescript
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})
```

## Coverage

### Go
- **No explicit coverage threshold** in configuration
- Coverage generated via `make unit-coverage` → `unit.html`
- Command: `go test -race -coverprofile .testCoverage.txt`
- **Coverage excludes** `mocks/` directory

### Vue
- **Enforced thresholds** in `vitest.config.ts`:
  - Statements: **90%**
  - Branches: **85%**
  - Functions: **75%**
  - Lines: **90%**
- Coverage provider: `v8`
- Coverage reporters: `text`, `json`, `html`
- **Included:** `src/**/*.ts`, `src/**/*.vue`
- **Excluded:** `*.d.ts`, `*.test.ts`, `*.spec.ts`, `*.stories.ts`, `main.ts`, `env.d.ts`, `api/client.ts`, `vite-env.d.ts`
- Run: `cd pkg/ui && pnpm run test:coverage`

## Test Types

### Unit Tests

**Go:**
- Standard `go test` — tests co-located with source
- Pure unit tests for adapters with mocked clients (`adapters/aws/*_test.go`)
- Service tests (`proxy/service_test.go`)
- Config tests (`config/config_test.go`)
- All test files in `pkg/proxy/internal/` (excluding `mocks/`) run via `make unit`

**Vue:**
- Composables (`composables/*.test.ts`) — mock API modules, test state transitions
- API service modules (`api/services/*.test.ts`) — mock fetch/axios
- Stores (`stores/*.test.ts`) — activate Pinia, test actions/getters
- Pure utility/type tests (`types/*.test.ts`, `router/index.test.ts`)
- **Environment:** `happy-dom`

### Component Integration Tests

**Vue component tests:** `components/*/integration.test.ts`
- Mount components with `@vue/test-utils` `mount()` or `shallowMount()`
- Mock composables that the component depends on
- Stub child components using inline stubs
- Test rendering, button clicks, input events, emitted events
- Files: `components/iam/integration.test.ts`, `components/s3/*.test.ts`, `components/apiGateway/*.test.ts`, etc.

### View Integration Tests

**Vue view tests:** `views/services/*.test.ts`, `views/*.test.ts`
- Similar to component tests but at route level
- Mock all composables and stores
- Stub all child components
- Test layout, conditional rendering, modal interactions

### E2E Tests

**Playwright in `pkg/test/e2e/`:**
- Location: `pkg/test/e2e/services/`
- Imports: `import { test, expect } from '../fixtures.js'`
- Config: `pkg/test/playwright.config.ts` — baseURL `http://localhost:3000`, retries 2, workers 3
- Hash-based URLs: `/#/services/iam`
- Key patterns:
  - `page.goto('/#/services/iam')`
  - `page.waitForLoadState('networkidle')` after navigation
  - `toBeVisible()` (never `waitForTimeout`)
  - `.first()` for ambiguous selectors
  - `getByRole('heading')`, `getByRole('dialog')` for semantic queries
- Cleanup utilities in `fixtures.js`: `cleanupDynamoTables('test-')`, `cleanupS3Buckets('test-')`
- Prerequisite: Floci/LocalStack on `:4566`

## Common Testing Patterns

### Async Error Testing (Vue)
```typescript
it('createBucket throws on error', async () => {
  vi.mocked(s3Api.createBucket).mockRejectedValue(new Error('Failed'))
  const { createBucket, loading } = useS3()
  await expect(createBucket('test-bucket')).rejects.toThrow('Failed')
  expect(loading.value).toBe(false)
})
```

### Loading State Verification (Vue)
```typescript
it('loadBuckets success', async () => {
  vi.mocked(s3Api.listBuckets).mockResolvedValue(mockBuckets)
  const { loadBuckets, buckets, loading } = useS3()
  await loadBuckets()
  expect(s3Api.listBuckets).toHaveBeenCalled()
  expect(buckets.value).toHaveLength(2)
  expect(loading.value).toBe(false)
})
```

### Storage Persistence Testing (Vue)
```typescript
it('persists region to localStorage', async () => {
  const store = useSettingsStore()
  store.setRegion('eu-west-1')
  await nextTick()
  expect(localStorage.getItem('region')).toBe('eu-west-1')
})
```

### Table-Driven Service Router Test (Go)
```go
func TestServiceRouter(t *testing.T) {
    t.Parallel()
    type serviceCase struct {
        name       string
        service    string
        target     string
        wantStatus int
    }
    cases := []serviceCase{
        {name: "unknown", service: "unknown", target: "Unknown", wantStatus: http.StatusNotFound},
        {name: "secretsmanager", service: "secretsmanager", target: "ListSecrets", wantStatus: http.StatusOK},
        // ... 20+ services covered
    }
    for _, sc := range cases {
        sc := sc
        t.Run(sc.name, func(t *testing.T) {
            t.Parallel()
            runServiceCase(t, sc, func(t TWithCleanup, svc *mockports.ProxyService) {
                // mock setup per service
            })
        })
    }
}
```

## Quality Enforcement

- **Go linting:** `golangci-lint` via `make lint-proxy` (excludes `mocks/`)
- **Vue linting:** ESLint via `make lint-ui` or `cd pkg/ui && pnpm run lint`
- **CI:** `make test-e2e` requires lint + unit tests to pass first
- **Coverage threshold:** Only enforced for Vue (90% statements, 85% branches, 75% functions, 90% lines)

---

*Testing analysis: 2026-05-21*
