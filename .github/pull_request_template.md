## Description

<!-- 1-2 lines what this PR does -->

## Type of Change

- [ ] New Service (FE + BE)
- [ ] Frontend Only
- [ ] Backend Only
- [ ] Bug Fix / Refactor

---

## Checklist

### Backend (Go)
- [ ] **Ports** — `internal/ports/{clients,service}.go`: interface defined
- [ ] **Adapter + Tests** — `internal/adapters/aws/<service>.go`: implements port, uses AWS SDK v2
- [ ] **HTTP Handler** — `internal/adapters/http/<service>.go`: routing + CRUD + error handling
- [ ] **Wiring** — `application/service.go` + `adapters/http/{handlers,interfaces}.go` + `main.go` log
- [ ] **Mocks** — `make mockery && go mod tidy`
- [ ] **Tests pass** — `go test ./pkg/proxy/...`

### Frontend (Vue)
- [ ] **API Client** — `api/services/<service>.ts`: CRUD + types + error handling
- [ ] **Composable + Tests** — `composables/use<Service>.ts`: state + all operations
- [ ] **Components** — `components/<service>/`: modals, code examples, barrel, storybooks, integration tests
- [ ] **View** — `views/services/<Service>.vue`: working UI
- [ ] **Routing + Nav** — `router/index.ts` + `layout/Sidebar.vue` + `composables/useServiceRegistry.ts`
- [ ] **Tests pass** — `cd pkg/ui && pnpm run test:run`
- [ ] **Storybook builds** — `cd pkg/ui && pnpm run build-storybook`

### E2E
- [ ] **E2E spec** — `pkg/test/e2e/services/<service>.spec.ts`: nav, create, delete, cancel, toast, pagination
- [ ] **All E2E pass** — `make test-e2e` (requires AWS emulator on :4566)

---

## Notes

<!-- Any additional notes for reviewers -->
