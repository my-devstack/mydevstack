# Adding a New AWS Service

This guide provides a complete workflow for adding a new AWS service to MyDevStack, including frontend components, tests, and integration.

## Prerequisites

1. **Backend**: Service already implemented in Go (`pkg/proxy/internal/adapters/`)
2. **API Client**: Exists or needs to be created in `pkg/ui/src/api/services/<service>.ts`
3. **Environment**: FloCi or LocalStack running on port 4566 for testing

---

## Complete Workflow

### Phase 1: Backend (Go)

If the service doesn't exist in the backend, add it first:

```
pkg/proxy/internal/adapters/
├── http/<service>.go    # HTTP handler (routing, request/response)
├── aws/<service>.go      # AWS SDK adapter
└── ...                   # Tests
```

**Backend requirements:**
- Unit tests in same package
- Integration with HTTP handler
- Mock interfaces in `pkg/proxy/mocks/ports/`

Run backend tests:
```bash
go test ./pkg/proxy/...
```

---

### Phase 2: Frontend API Client

Create or update the API client:

```
pkg/ui/src/api/services/<service>.ts
```

**Requirements:**
- Export all CRUD operations (list, get, create, update, delete)
- Use existing patterns from other services (e.g., `s3.ts`, `lambda.ts`)
- Return properly typed responses

**Testing:**
- Manual testing via browser DevTools
- No unit test required for API client (covered by integration tests)

---

### Phase 3: Composable with Unit Tests

Create a composable to manage service state and operations:

```
pkg/ui/src/composables/use<Service>.ts
pkg/ui/src/composables/use<Service>.test.ts
```

**Example structure:**

```typescript
// useLambda.ts
import { ref } from 'vue'
import * as lambdaApi from '@/api/services/lambda'

export function useLambda() {
  const functions = ref<LambdaFunction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFunctions() {
    loading.value = true
    error.value = null
    try {
      const result = await lambdaApi.listFunctions()
      functions.value = result.functions || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createFunction(config: CreateFunctionConfig) {
    await lambdaApi.createFunction(config)
    await loadFunctions()
  }

  // ... other operations

  return {
    functions,
    loading,
    error,
    loadFunctions,
    createFunction,
    // ...
  }
}
```

**Unit Test Example:**

```typescript
// useLambda.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLambda } from './useLambda'

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn(),
  createFunction: vi.fn(),
}))

describe('useLambda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads functions on mount', async () => {
    const mockFunctions = [{ name: 'test-fn', runtime: 'nodejs20.x' }]
    vi.mocked(listFunctions).mockResolvedValue({ functions: mockFunctions })

    const { functions, loadFunctions } = useLambda()
    await loadFunctions()

    expect(functions.value).toEqual(mockFunctions)
  })
})
```

**Run tests:**
```bash
cd pkg/ui && pnpm run test:run src/composables/use<Service>.test.ts
```

---

### Phase 4: Vue Components

Create component folder with barrel exports:

```
pkg/ui/src/components/<service>/
├── index.ts                          # Barrel export (REQUIRED!)
├── <Service>List.vue                 # Main list view
├── <Service>List.stories.ts           # Storybook stories
├── <Service>Modal.vue                # Create/Edit/View modal
├── <Service>Modal.stories.ts         # Storybook stories
└── <Service>CodeExamples.vue         # Optional: code snippets
```

#### 4.1 Create index.ts (REQUIRED!)

```typescript
// index.ts - Barrel exports
export { default as <Service>List } from './<Service>List.vue'
export { default as <Service>Modal } from './<Service>Modal.vue'
export { default as <Service>CodeExamples } from './<Service>CodeExamples.vue'
```

#### 4.2 Create ServiceList.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ServiceTable, { type TableColumn } from '@/components/common/ServiceTable.vue'
import <Service>Modal from '@/components/<service>/<Service>Modal.vue'
import { use<Service> } from '@/composables/use<Service>'

const { items, loading, error, loadItems, deleteItem } = use<Service>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'arn', label: 'ARN' },
  { key: 'createdAt', label: 'Created', width: '200px' },
]

const selectedItem = ref(null)
const showModal = ref(false)
const modalMode = ref<'create' | 'edit' | 'view' | 'delete'>('create')

onMounted(loadItems)

function handleRowClick(item: any) {
  selectedItem.value = item
  modalMode.value = 'view'
  showModal.value = true
}

function openCreate() {
  selectedItem.value = null
  modalMode.value = 'create'
  showModal.value = true
}

function openEdit(item: any) {
  selectedItem.value = item
  modalMode.value = 'edit'
  showModal.value = true
}
</script>

<template>
  <div>
    <div class="flex justify-between mb-4">
      <h2 class="text-lg font-semibold"><Service></h2>
      <button @click="openCreate" class="btn-primary">Create</button>
    </div>

    <ServiceTable
      :columns="columns"
      :data="items"
      :loading="loading"
      :error="error"
      @row-click="handleRowClick"
    />

    <<Service>Modal
      v-model:open="showModal"
      :mode="modalMode"
      :data="selectedItem"
      @refresh="loadItems"
    />
  </div>
</template>
```

#### 4.3 Create ServiceModal.vue

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ServiceModal from '@/components/common/ServiceModal.vue'
import FormInput from '@/components/common/FormInput.vue'
import { use<Service> } from '@/composables/use<Service>'

interface Props {
  open: boolean
  mode: 'create' | 'edit' | 'view' | 'delete'
  data: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'refresh': []
}>()

const { createItem, updateItem, deleteItem } = use<Service>()
const saving = ref(false)

const form = ref({ name: '', description: '' })

watch(() => props.data, (newData) => {
  if (newData && props.mode !== 'create') {
    form.value = { ...newData }
  } else {
    form.value = { name: '', description: '' }
  }
}, { immediate: true })

async function handleConfirm() {
  saving.value = true
  try {
    if (props.mode === 'create') {
      await createItem(form.value)
    } else if (props.mode === 'edit') {
      await updateItem(props.data.name, form.value)
    } else if (props.mode === 'delete') {
      await deleteItem(props.data.name)
    }
    emit('update:open', false)
    emit('refresh')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ServiceModal
    :open="open"
    :mode="mode"
    title="<Service>"
    :loading="saving"
    @update:open="$emit('update:open', $event)"
    @confirm="handleConfirm"
  >
    <template v-if="mode === 'delete'">
      <p>Are you sure you want to delete "{{ data?.name }}"?</p>
    </template>
    <template v-else>
      <FormInput
        v-model="form.name"
        label="Name"
        :disabled="mode === 'view'"
        required
      />
      <FormInput
        v-model="form.description"
        label="Description"
        :disabled="mode === 'view'"
      />
    </template>
  </ServiceModal>
</template>
```

---

### Phase 5: Storybook Stories (REQUIRED)

Create stories for all component states:

```
pkg/ui/src/components/<service>/
├── <Service>List.stories.ts
└── <Service>Modal.stories.ts
```

**Start Storybook:**
```bash
cd pkg/ui && pnpm run storybook  # Runs on port 6006
```

**ServiceList.stories.ts:**

```typescript
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import <Service>List from './<Service>List.vue'

const meta: Meta<typeof <Service>List> = {
  title: 'Services/<Service>/<Service>List',
  component: <Service>List,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { name: 'item-1', arn: 'arn:aws:...' },
      { name: 'item-2', arn: 'arn:aws:...' },
    ],
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    items: [],
  },
}

export const Empty: Story = {
  args: {
    loading: false,
    items: [],
  },
}

export const Error: Story = {
  args: {
    error: 'Failed to load items',
    items: [],
  },
}
```

**ServiceModal.stories.ts:**

```typescript
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import <Service>Modal from './<Service>Modal.vue'

const meta: Meta<typeof <Service>Modal> = {
  title: 'Services/<Service>/<Service>Modal',
  component: <Service>Modal,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  args: {
    open: true,
    mode: 'create',
    data: null,
  },
}

export const Edit: Story = {
  args: {
    open: true,
    mode: 'edit',
    data: { name: 'test-item', description: 'Test description' },
  },
}

export const View: Story = {
  args: {
    open: true,
    mode: 'view',
    data: { name: 'test-item', description: 'Test description' },
  },
}

export const Delete: Story = {
  args: {
    open: true,
    mode: 'delete',
    data: { name: 'test-item' },
  },
}
```

**Required Story States:**
- Lists: Default, Loading, Empty, Error
- Modals: Create, Edit, View, Delete

---

### Phase 6: Integration Tests

Create integration tests:

```
pkg/ui/src/components/<service>/
└── integration.test.ts
```

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import <Service>List from './<Service>List.vue'

vi.mock('@/api/services/<service>', () => ({
  listItems: vi.fn().mockResolvedValue([{ name: 'test' }]),
}))

describe('<Service>List', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders list items', async () => {
    const wrapper = mount(<Service>List)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('test')
  })
})
```

**Run tests:**
```bash
cd pkg/ui && pnpm run test:run src/components/<service>/integration.test.ts
```

---

### Phase 7: View & Router

Create the view page:

```
pkg/ui/src/views/services/<Service>.vue
```

```vue
<script setup lang="ts">
import <Service>List from '@/components/<service>/<Service>List.vue'
</script>

<template>
  <<Service>List />
</template>
```

Add router entry in `pkg/ui/src/router/index.ts`:

```typescript
{
  path: '/services/<service>',
  name: '<Service>',
  component: () => import('@/views/services/<Service>.vue'),
}
```

---

### Phase 8: Sidebar Navigation

Add navigation in `pkg/ui/src/components/layout/Sidebar.vue`:

```typescript
{
  name: '<Service>',
  path: '/services/<service>',
  icon: CubeIcon, // Import from @heroicons/vue
}
```

---

### Phase 9: E2E Tests

Create E2E test in:

```
pkg/test/e2e/services/<service>.spec.ts
```

```typescript
import { test, expect } from '../fixtures.js'

test.describe('<Service>', () => {
  test('navigate to service page', async ({ page }) => {
    await page.goto('/#/services/<service>')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '<Service>' })).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/<service>')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/<service>')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
```

**Run E2E tests:**
```bash
make test-e2e
# Or with specific service:
cd pkg/regression-test && pnpm exec playwright test e2e/services/<service>.spec.ts
```

---

## File Summary

| Layer | File | Description |
|-------|------|-------------|
| **Backend** | `pkg/proxy/internal/adapters/http/<service>.go` | HTTP handler |
| **Backend** | `pkg/proxy/internal/adapters/aws/<service>.go` | AWS adapter |
| **Backend** | `pkg/proxy/internal/adapters/http/<service>_test.go` | Unit tests |
| **API** | `pkg/ui/src/api/services/<service>.ts` | API client |
| **Composable** | `pkg/ui/src/composables/use<Service>.ts` | State management |
| **Composable** | `pkg/ui/src/composables/use<Service>.test.ts` | Unit tests |
| **Component** | `pkg/ui/src/components/<service>/index.ts` | Barrel export |
| **Component** | `pkg/ui/src/components/<service>/<Service>List.vue` | List component |
| **Component** | `pkg/ui/src/components/<service>/<Service>Modal.vue` | Modal component |
| **Stories** | `pkg/ui/src/components/<service>/<Service>List.stories.ts` | Storybook |
| **Stories** | `pkg/ui/src/components/<service>/<Service>Modal.stories.ts` | Storybook |
| **Integration** | `pkg/ui/src/components/<service>/integration.test.ts` | Integration tests |
| **View** | `pkg/ui/src/views/services/<Service>.vue` | Page view |
| **Router** | `pkg/ui/src/router/index.ts` | Route entry |
| **Nav** | `pkg/ui/src/components/layout/Sidebar.vue` | Navigation |
| **E2E** | `pkg/regression-test/e2e/services/<service>.spec.ts` | E2E tests |
| **Total** | **15-17 files** | Per service |

---

## Testing Commands

```bash
# Backend tests
go test ./pkg/proxy/...

# UI unit tests (all)
cd pkg/ui && pnpm run test:run

# UI single test
cd pkg/ui && pnpm run test:run src/composables/use<Service>.test.ts

# Storybook (port 6006)
cd pkg/ui && pnpm run storybook

# Build Storybook
cd pkg/ui && pnpm run build-storybook

# E2E tests (requires Floci on :4566)
make test-e2e

# Specific E2E test
cd pkg/regression-test && pnpm exec playwright test e2e/services/<service>.spec.ts

# Lint
make lint
cd pkg/ui && pnpm run lint
```

---

## Best Practices

1. **Use Composition API** with `<script setup>` and TypeScript
2. **Barrel exports** - ALWAYS create `index.ts` in component folders
3. **Type everything** - props, emits, and function return types
4. **Test-driven** - Write Storybook stories first, then component code
5. **Reuse generic components** - ServiceModal, ServiceTable, FormInput
6. **Keep components small** - Break into smaller reusable parts
7. **Consistent naming** - PascalCase for components, camelCase for files
8. **Handle all states** - Loading, Empty, Error, Success
