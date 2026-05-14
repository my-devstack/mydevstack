## Description

<!-- Describe what this PR adds or fixes -->

## Type of Change

- [ ] New Service (FE + BE)
- [ ] Frontend Only
- [ ] Backend Only
- [ ] Bug Fix
- [ ] Refactoring
- [ ] Documentation

---

## Checklist: Backend (Go)

### Code Implementation
- [ ] **HTTP Handler** - `pkg/proxy/internal/adapters/http/<service>.go`
  - [ ] Routing added in `handle<Service>` function
  - [ ] All CRUD operations implemented
  - [ ] Error handling with `sendError` function

- [ ] **AWS Adapter** - `pkg/proxy/internal/adapters/aws/<service>.go`
  - [ ] Implements `S3Port` (or appropriate port interface)
  - [ ] Uses AWS SDK v2
  - [ ] Proper context handling

### Testing
- [ ] **Unit Tests** - `pkg/proxy/internal/adapters/http/<service>_test.go`
  - [ ] Tests for all endpoints
  - [ ] Error cases covered

- [ ] **Mock Interfaces** - `pkg/proxy/mocks/ports/`
  - [ ] Mock generated (run `make mockery`)
  - [ ] Mock matches port interface

### Integration
- [ ] **Service Port** - `pkg/proxy/internal/ports/service.go`
  - [ ] Interface defined if new service
  - [ ] Methods properly typed

- [ ] **Service Implementation** - `pkg/proxy/internal/service/`
  - [ ] Service layer uses adapter

### Verification
- [ ] **Go Tests Pass**
  ```bash
  go test ./pkg/proxy/...
  ```

- [ ] **Linting Pass**
  ```bash
  make lint-proxy
  ```

---

## Checklist: Frontend (Vue/TypeScript)

### API Layer
- [ ] **API Client** - `pkg/ui/src/api/services/<service>.ts`
  - [ ] All CRUD operations exported
  - [ ] Proper TypeScript types
  - [ ] Error handling with `APIError`

- [ ] **API Export** - `pkg/ui/src/api/services/index.ts`
  - [ ] New service exported

### Composables
- [ ] **Composable** - `pkg/ui/src/composables/use<Service>.ts`
  - [ ] State management (ref, reactive)
  - [ ] All API operations
  - [ ] Loading and error states

- [ ] **Unit Tests** - `pkg/ui/src/composables/use<Service>.test.ts`
  - [ ] Tests for all functions
  - [ ] Mock API calls

### Components
- [ ] **Component Folder** - `pkg/ui/src/components/<service>/`
  - [ ] `index.ts` barrel exports (REQUIRED!)
  - [ ] `<Service>List.vue` - List view component
  - [ ] `<Service>Modal.vue` - CRUD modal component

- [ ] **Storybook Stories**
  - [ ] `<Service>List.stories.ts` - All states (Default, Loading, Empty, Error)
  - [ ] `<Service>Modal.stories.ts` - All modes (Create, Edit, View, Delete)
  - [ ] Storybook builds successfully

- [ ] **Integration Tests** - `pkg/ui/src/components/<service>/integration.test.ts`

### Views & Routing
- [ ] **View** - `pkg/ui/src/views/services/<Service>.vue`
- [ ] **Router** - `pkg/ui/src/router/index.ts`
  - [ ] Route added: `path: '/services/<service>'`
- [ ] **Sidebar** - `pkg/ui/src/components/layout/Sidebar.vue`
  - [ ] Navigation item added with icon

### E2E Tests
- [ ] **E2E Test** - `pkg/regression-test/e2e/services/<service>.spec.ts`
  - [ ] Navigate to service page
  - [ ] Open create modal
  - [ ] Create new resource
  - [ ] View resource details
  - [ ] Edit resource
  - [ ] Delete resource
  - [ ] Cancel closes dialog

### Verification
- [ ] **Vue Tests Pass**
  ```bash
  cd pkg/ui && npm run test:run
  ```

- [ ] **Storybook Builds**
  ```bash
  cd pkg/ui && npm run build-storybook
  ```

- [ ] **E2E Tests Pass** (requires Floci on :4566)
  ```bash
  make test-e2e
  ```

- [ ] **Lint Pass**
  ```bash
  cd pkg/ui && npm run lint
  ```

---

## Files Changed

<!-- List all files modified/added in this PR -->

### Backend
-

### Frontend
-

---

## Testing Instructions

1. **Start Floci/LocalStack:**
   ```bash
   docker-compose -f docker-compose-floci.yml up -d
   ```

2. **Start Backend:**
   ```bash
   go run ./pkg/proxy/cmd/server
   ```

3. **Start Frontend:**
   ```bash
   cd pkg/ui && npm run dev
   ```

4. **Verify Service:**
   - Navigate to `http://localhost:3000/#/services/<service>`
   - Test all CRUD operations
   - Verify no console errors

---

## Checklist: E2E Tests

### Setup
- [ ] Floci/LocalStack running on port 4566
- [ ] Go proxy running on port 8081
- [ ] Vue UI running on port 3000

### Test Execution
- [ ] **Run All E2E Tests**
  ```bash
  make test-e2e
  ```

- [ ] **Run Specific Service Tests**
  ```bash
  cd pkg/regression-test && npx playwright test e2e/services/<service>.spec.ts
  ```

### Required Test Cases
- [ ] Navigate to service page
- [ ] Service page loads without errors
- [ ] Create new resource (success flow)
- [ ] View resource details
- [ ] Edit resource
- [ ] Delete resource (with confirmation)
- [ ] Cancel closes modal/dialog
- [ ] Error states display correctly
- [ ] Loading states work properly
- [ ] Empty states display correctly

### Verification
- [ ] All E2E tests pass (0 failures)
- [ ] No console errors during test execution

---

## Screenshots (Optional)

<!-- Add screenshots if UI changes -->

---

## Notes

<!-- Any additional notes for reviewers -->