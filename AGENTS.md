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
| `make mockery` | Generate mocks (generates in `pkg/proxy/mocks/ports/`) |
| `go test ./pkg/proxy/...` | Run all Go tests |
| `go test -v ./pkg/proxy/internal/application` | Run tests for specific package |
| `go test -v -run TestName ./pkg/proxy/...` | Run single test by name |
| `go test -v -count=1 ./pkg/proxy/...` | Run tests with no caching |
| `go test -race ./pkg/proxy/...` | Run tests with race detector |

### Vue UI (pkg/ui/)

| Command | Description |
|---------|-------------|
| `cd pkg/ui && npm run dev` | Run Vue dev server |
| `cd pkg/ui && npm run build` | Build production dist |
| `cd pkg/ui && npm run lint` | Run ESLint |
| `cd pkg/ui && npm run test:run` | Run Vitest once |
| `cd pkg/ui && npm run test:run src/stores/settings.test.ts` | Run single test file |
| `cd pkg/ui && npm run test:coverage` | Run tests with coverage |

### All (Root)

| Command | Description |
|---------|-------------|
| `make run-dev` | Run both proxy and UI |
| `make lint` | Run all linters |
| `make build` | Build full project |

---

## Skills Usage

When working on this codebase:
- **Go Backend**: Load `go-best-practices` and `go-domain-driven-hexagonal-architecture` skills
- **Vue Frontend**: Load `vue-best-practices` skill

Use the `skill` tool to load these before writing or editing code.

---

## Go Backend Code Style

### Import Organization

```go
import (
    "context"
    "fmt"

    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/gin-gonic/gin"

    "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/aws"
    configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
    "github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)
```

### Naming Conventions

- **Files**: snake_case (`service.go`, `http_handlers.go`)
- **Interfaces**: suffix with `Port` (`ProxyService`, `S3Port`)
- **Types/Variables**: PascalCase / camelCase
- **Packages**: lowercase, single word

### Error Handling

```go
func (s *ProxyService) SetRegion(region string) error {
    if region == "" {
        return errors.New("region cannot be empty")
    }
    if err != nil {
        return fmt.Errorf("failed to set region: %w", err)
    }
    return nil
}
```

### Testing

- Test files: `*_test.go` adjacent to source
- Use `testing` package with `testify/assert`
- Table-driven tests for multiple cases

### Service Structure (Hexagonal Architecture)

New AWS services should follow the same pattern:
1. Define interface in `pkg/proxy/internal/ports/`
2. Implement AWS adapter in `pkg/proxy/internal/adapters/aws/`
3. Implement HTTP handler in `pkg/proxy/internal/adapters/http/`
4. Wire in `pkg/proxy/internal/application/service.go`

Mocks generated via `make mockery` go to `pkg/proxy/mocks/ports/`.

---

## Vue Frontend Code Style

### Naming Conventions

- **Files**: camelCase (`useToast.ts`, `settings.test.ts`)
- **Components**: PascalCase (`AppSidebar.vue`)
- **Composables**: `use` prefix (`useServices.ts`, `useToast.ts`)
- **Stores**: camelCase (`settings.ts`)
- **Types**: PascalCase (`Service`, `ToastItem`)

### Vue Best Practices

- Use **Composition API** with `<script setup>` and TypeScript
- Reusable components go in `components/common/`
- Service-specific components in `components/<service>/`
- Views in `views/services/<ServiceName>.vue`
- Use composables for reusable logic
- Use Pinia stores for global state

### File Organization

```
pkg/ui/src/
├── api/           # API clients
├── components/    # Vue components (common/, <service>/, layout/)
├── composables/   # Vue composables
├── stores/        # Pinia stores
├── types/         # TypeScript types
└── views/        # Page components
```

Keep files focused and under 200 lines. Break large components into smaller, reusable parts.

---

## Important Rules

1. **Never assume or hallucinate**: Ask for clarification when uncertain
2. **Never commit secrets**: Never add credentials, API keys to repo
3. **Run lint before commit**: Always run `make lint`
4. **Verify tests pass**: Ensure tests pass before submitting

---

## Architecture

```
pkg/
├── proxy/                  # Go backend (hexagonal)
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── adapters/      # AWS & HTTP adapters
│   │   ├── application/   # Business logic
│   │   ├── config/       # Configuration
│   │   └── ports/        # Interfaces
│   └── mocks/ports/       # Generated mocks
└── ui/                     # Vue frontend
    └── src/
        ├── api/          # API clients
        ├── components/  # Reusable components
        ├── composables/  # Composables
        ├── stores/      # Pinia stores
        ├── types/       # TypeScript types
        └── views/       # Page views
```