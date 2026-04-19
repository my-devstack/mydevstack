# AGENTS.md - Development Guidelines for Agentic Coding

This document provides guidelines for agentic coding agents operating in this repository.

## Project Overview

This is a monorepo containing:
- **Go Backend** (`pkg/proxy/`): Gin-based HTTP proxy server for AWS services
- **Vue 3 Frontend** (`pkg/ui/`): TypeScript/Vue 3 SPA with Pinia, Vue Router, TailwindCSS

---

## Build, Lint, and Test Commands

### Go Backend (pkg/proxy/)

| Command | Description |
|---------|-------------|
| `make run-proxy` | Run Go proxy backend server |
| `make build` | Build production binaries for all platforms |
| `make lint-proxy` | Run golangci-lint on proxy |
| `make test` | Run all Go tests |
| `go test ./pkg/proxy/...` | Run all Go tests (full path) |
| `go test -v ./pkg/proxy/internal/application` | Run tests for specific package |
| `go test -v -run TestProxyService_Region ./pkg/proxy/...` | Run single test by name |
| `go test -v -count=1 ./pkg/proxy/...` | Run tests with no caching |
| `go test -race ./pkg/proxy/...` | Run tests with race detector |
| `cd pkg/proxy && mockery` | Generate mocks with mockery |

### Vue UI (pkg/ui/)

| Command | Description |
|---------|-------------|
| `cd pkg/ui && npm run dev` | Run Vue dev server |
| `cd pkg/ui && npm run build` | Build production dist |
| `cd pkg/ui && npm run lint` | Run ESLint |
| `cd pkg/ui && npm run lint -- --max-warnings=0` | Lint with zero warnings |
| `cd pkg/ui && npm run test` | Run Vitest in watch mode |
| `cd pkg/ui && npm run test:run` | Run Vitest once |
| `cd pkg/ui && npm run test:run src/stores/settings.test.ts` | Run single test file |
| `cd pkg/ui && npm run test:run -- --reporter=verbose src/stores/settings.test.ts` | Verbose single test |
| `cd pkg/ui && npm run test:coverage` | Run tests with coverage |

### All (Root)

| Command | Description |
|---------|-------------|
| `make run-dev` | Run both proxy and UI |
| `make lint` | Run all linters |
| `make test` | Run Go tests only |
| `make build` | Build full project |

---

## Skills Usage

When working on this codebase, agents MUST load the relevant skill:

- **Go Backend**: Load `go-best-practices` and `go-domain-driven-hexagonal-architecture` skills
- **Vue Frontend**: Load `vue-best-practices` skill

Use the `skill` tool to load these before writing or editing code.

---

## Important Rules

1. **Never assume or hallucinate**: If you're unsure about requirements, implementation details, or user intent, always ask the user for clarification before proceeding
2. **Never invent patterns**: Don't create new conventions without confirming with the user first
3. **Verify before acting**: When uncertain about file contents or code behavior, read the relevant files first

---

## Code Style Guidelines

### Go Backend

#### Import Organization

```go
import (
    // Standard library
    "context"
    "fmt"
    "log"
    "net/http"

    // Third-party packages (one per line, alphabetical)
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"

    // Internal packages
    "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/aws"
    configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
    "github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)
```

#### Naming Conventions

- **Files**: Use snake_case: `service.go`, `http_handlers.go`, `s3_test.go`
- **Interfaces**: Suffix with `Port` or `er`: `ProxyService`, `S3Port`, `Reader`
- **Types**: PascalCase: `ProxyService`, `Config`, `SecretsManagerPort`
- **Variables**: camelCase, favor explicitness over brevity
- **Constants**: PascalCase for typed, SCREAMING_SNAKE_CASE for untyped
- **Packages**: Single short word, lowercase: `adapters`, `ports`, `config`

#### Error Handling

- Return errors explicitly; avoid wrapping without context
- Use `fmt.Errorf("action: %w", err)` for wrapping with verb
- Log errors before returning when appropriate
- Handle named error variables: `var ErrNotFound = errors.New("not found")`

```go
// Good
func (s *ProxyService) SetRegion(region string) error {
    if region == "" {
        return errors.New("region cannot be empty")
    }
    // ... logic
    if err != nil {
        return fmt.Errorf("failed to set region: %w", err)
    }
    return nil
}
```

#### Type Definitions

- Use structs with meaningful field names
- Embedding should be explicit via composition
- interfaces define behavior, structs define data

#### Testing (Go)

- Test files: `*_test.go` adjacent to source
- Use `testing` package with `t *testing.T`
- Use `testify/assert` for assertions
- Table-driven tests for multiple cases

```go
func TestProxyService_Region(t *testing.T) {
    cfg := &configloader.Config{}
    svc := NewProxyService(cfg)

    region := svc.Region()
    if region != "us-east-1" {
        t.Errorf("Region() = %v, want us-east-1", region)
    }
}
```

---

### Vue 3 Frontend (TypeScript)

#### Import Organization

```typescript
// Vue/core
import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

// External packages
import axios from 'axios'
import { useDebounceFn } from '@vueuse/core'

// Internal modules (use @ alias)
import { PROXY_BACKEND } from '@/config'
import { useServices } from '@/composables/useServices'
import type { Service } from '@/types/services'
```

#### Naming Conventions

- **Files**: camelCase with type suffix: `useToast.ts`, `settings.test.ts`, `aws.ts`
- **Components**: PascalCase: `AppSidebar.vue`, `ServiceList.vue`
- **Composables**: camelCase with `use` prefix: `useToast.ts`, `useServices.ts`
- **Stores**: camelCase: `settings.ts`, `ui.ts`
- **Types/Interfaces**: PascalCase: `Service`, `SettingsState`, `ToastItem`
- **Constants**: SCREAMING_SNAKE_CASE

#### TypeScript Guidelines

- Always use explicit types for props, function returns
- Use `interface` for object shapes
- Use `type` for unions, primitives, aliases
- Prefer `unknown` over `any`
- Use strict null checks

```typescript
// Good
interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

type ToastType = 'success' | 'error' | 'warning' | 'info'

export function useToast() {
  // explicit return type
  return {
    toasts: computed(() => toasts.value),
    success: (message: string, duration?: number): string => {
      return addToast('success', message, duration)
    },
  }
}
```

#### Vue 3 Composition API

- Use `<script setup>` with TypeScript
- Use composables for reusable logic
- Use Pinia stores for global state
- Avoid Options API unless required

```typescript
// Pinia store pattern
export const useSettingsStore = defineStore('settings', () => {
  const region = ref<string>(localStorage.getItem('region') || 'us-east-1')
  const isDarkMode = computed(() => theme.value === 'dark')

  function setRegion(newRegion: string) {
    region.value = newRegion
  }

  return { region, isDarkMode, setRegion }
})
```

#### Testing (Vitest)

- Test files: `*.test.ts` or `*.spec.ts`
- Use `vitest` with `@vue/test-utils` for components
- Use `happy-dom` for DOM mocking

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should have default region', () => {
    const store = useSettingsStore()
    expect(store.region).toBe('us-east-1')
  })
})
```

---

## Project Architecture

```
pkg/
├── proxy/                      # Go backend
│   ├── cmd/server/            # Entry point
│   ├── internal/
│   │   ├── adapters/         # AWS & HTTP adapters
│   │   ├── application/      # Business logic
│   │   ├── config/          # Configuration
│   │   └── ports/          # Interfaces
│   └── mocks/               # Generated mocks
└── ui/                       # Vue frontend
    ├── src/
    │   ├── api/            # API clients
    │   ├── components/     # Vue components
    │   ├── composables/   # Vue composables
    │   ├── stores/       # Pinia stores
    │   └── types/       # TypeScript types
    └── node_modules/
```

---

## General Guidelines

1. **Never commit secrets**: Never add credentials, API keys, or secrets to the repo
2. **Run lint before commit**: Always run `make lint` before committing
3. **Run tests**: Ensure tests pass before submitting changes
4. **Type safety**: Prefer TypeScript types over loose typing; Go should use explicit types
5. **Keep packages focused**: Each package should have a single responsibility
6. **Use interfaces**: Define interfaces in `ports/` for testability

---

## Useful Tips

- Go uses `go.mod` at root; Vue uses `pkg/ui/package.json`
- Vue path alias `@` maps to `pkg/ui/src`
- Go mocks generated in `pkg/proxy/mocks/ports/`
- Frontend proxy backend defaults to `http://127.0.0.1:8081`
- AWS SDK v2 for Go, AWS SDK v3 for TypeScript