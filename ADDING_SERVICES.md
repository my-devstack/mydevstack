# Adding a New AWS Service

This guide explains how to add a new AWS service to the MyDevStack frontend.

## Prerequisites

- Service is already implemented in Go backend (`pkg/proxy/internal/adapters/`)
- API client exists in `pkg/ui/src/api/services/<service>.ts`

## Steps to Add a New Service

### Step 1: Create API Client (if not exists)

Create `pkg/ui/src/api/services/<service>.ts` following existing patterns.
Export all CRUD operations.

### Step 2: Create Service Components Folder

Create folder: `pkg/ui/src/components/<service>/`

```
components/
└── <service>/
    ├── index.ts              # Barrel export (REQUIRED)
    ├── ServiceList.vue     # Main list view
    ├── ServiceModal.vue   # Create/Edit/View/Delete modal
    └── ServiceCodeExamples.vue  # Optional: code snippets
```

**Important**: Always create `index.ts` with barrel exports:

```typescript
export { default as <Service>List } from './<Service>List.vue'
export { default as <Service>Modal } from './<Service>Modal.vue'
export { default as <Service>CodeExamples } from './<Service>CodeExamples.vue'
```

### Step 3: Create Components

Minimum 2 files:

1. **ServiceList.vue** - Displays list of resources
2. **ServiceModal.vue** - Handles all CRUD operations via mode prop

Example ServiceList.vue:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import * as api from '@/api/services/<service>'
import ServiceTable, { type TableColumn } from '@/components/common/ServiceTable.vue'
import <Service>Modal from '@/components/<service>/<Service>Modal.vue'

const items = ref([])
const loading = ref(false)
const selectedItem = ref(null)
const showModal = ref(false)
const modalMode = ref<'create'|'edit'|'view'|'delete'>('create')

const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'arn', label: 'ARN' },
]

async function loadItems() {
  loading.value = true
  items.value = await api.listItems()
  loading.value = false
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

function handleRowClick(item: any) {
  selectedItem.value = item
  modalMode.value = 'view'
  showModal.value = true
}
</script>

<template>
  <div>
    <ServiceTable :columns="columns" :data="items" :loading="loading" @row-click="handleRowClick" />
    
    <<Service>Modal
      v-model:open="showModal"
      :mode="modalMode"
      :data="selectedItem"
      @confirm="handleConfirm"
    />
  </div>
</template>
```

Example ServiceModal.vue:

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ServiceModal from '@/components/common/ServiceModal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

interface Props {
  open: boolean
  mode: 'create' | 'edit' | 'view' | 'delete'
  data: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const form = ref({ name: '' })

watch(() => props.data, (newData) => {
  if (newData) form.value = { ...newData }
}, { immediate: true })

function handleConfirm() {
  emit('confirm', form.value)
}
</script>

<template>
  <ServiceModal
    :open="open"
    :mode="mode"
    title="Service"
    @update:open="$emit('update:open', $event)"
    @confirm="handleConfirm"
  >
    <FormInput v-model="form.name" label="Name" :disabled="mode === 'view'" />
  </ServiceModal>
</template>
```

### Step 4: Create View

Create `pkg/ui/src/views/services/<Service>.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContentReload } from '@/composables/useContentReload'
import <Service>List from '@/components/<service>/<Service>List.vue'
</script>

<template>
  <<Service>List />
</template>
```

### Step 5: Add Router Entry

Add to `pkg/ui/src/router/index.ts`:

```typescript
{
  path: '/<service>',
  name: '<Service>',
  component: () => import('@/views/services/<Service>.vue'),
}
```

### Step 6: Add Sidebar Navigation

Add to `pkg/ui/src/components/layout/Sidebar.vue`:

```typescript
{
  name: '<Service>',
  path: '/<service>',
  icon: CubeIcon, // or other appropriate icon
}
```

## Current Services

The following services are currently implemented:

- API Gateway (api-gateway)
- CloudFormation (cloudformation)
- DynamoDB (dynamodb)
- ElastiCache (elasticache)
- IAM (iam)
- Kinesis (kinesis)
- KMS (kms)
- Lambda (lambda)
- RDS (rds)
- S3 (s3)
- Secrets Manager (secrets-manager)
- SNS (sns)
- SQS (sqs)
- SSM (ssm)

## File Summary

| What | Files | Description |
|------|-------|-------------|
| API Client | 1 | `api/services/<service>.ts` |
| Composable | 1 | `composables/use<Service>.ts` (+ unit test) |
| Components | 2-4 | List, Modal, optionally CodeExamples (+ integration test) |
| View | 1 | Container component |
| Router | 1 | Add route entry |
| E2E Test | 1 | `e2e/services/<service>.spec.ts` |
| **Total** | **7-10** | Per service |

## Testing Requirements

Every service MUST include:

1. **Composable** (`composables/use<Service>.ts`)
   - Unit tests (`composables/use<Service>.test.ts`)
2. **Components** (`components/<service>/`)
   - Integration tests (`components/<service>/integration.test.ts`)
3. **E2E Tests** (`e2e/services/<service>.spec.ts`)

Run tests:
```bash
# Vue unit tests
cd pkg/ui && npm run test:run

# Vue single test file
cd pkg/ui && npx vitest run <file>

# E2E tests (requires Floci/LocalStack on :4566)
make test-e2e
```

## Best Practices

1. **Use Composition API** with `<script setup>` and TypeScript
2. **Use TypeScript** - always type props and emits
3. **Barrel exports** - ALWAYS create `index.ts` in component folders
4. **Reuse generic components** - Use ServiceModal and ServiceTable
5. **Consistent naming** - PascalCase for components, camelCase for files
6. **Keep under 200 lines** - Break large components into smaller reusable parts
7. **Always write tests** - Unit + integration for frontend, unit for backend

## Using Generic Components

### ServiceModal

```vue
import ServiceModal from '@/components/common/ServiceModal.vue'

<ServiceModal
  :open="showModal"
  :mode="modalMode"
  title="My Service"
  :loading="saving"
  confirm-text="Save"
  @update:open="showModal = $event"
  @confirm="handleSave"
>
  <!-- Form content here -->
</ServiceModal>
```

Props:
- `open` - boolean
- `mode` - `'create' | 'edit' | 'view' | 'delete'`
- `title` - optional string
- `size` - optional `'sm' | 'md' | 'lg' | 'xl' ...`
- `loading` - optional boolean
- `confirmText` - optional string
- `cancelText` - optional string

### ServiceTable

```vue
import ServiceTable, { type TableColumn } from '@/components/common/ServiceTable.vue'

const columns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'arn', label: 'ARN' },
  { key: 'createdAt', label: 'Created', width: '200px' },
]

<ServiceTable
  :columns="columns"
  :data="items"
  :loading="loading"
  @row-click="handleRowClick"
/>
```

Props:
- `columns` - `TableColumn[]` with key, label, sortable, width
- `data` - array of objects
- `loading` - optional boolean
- `emptyText` - optional string
- `loadingText` - optional string

Events:
- `row-click` - emits the clicked row

### useGenericCrud (optional)

```typescript
import { useGenericCrud } from '@/composables/useGenericCrud'

const { items, loading, fetch, create, update, remove } = useGenericCrud({
  getEndpoint: '/lambda',
  createEndpoint: '/lambda',
  updateEndpoint: '/lambda',
  deleteEndpoint: '/lambda',
})

await fetch()  // loads items.value
await create({ name: 'test' })
await update('id', { name: 'updated' })
await remove('id')
```

---

## Troubleshooting

### Component not found
Make sure `index.ts` barrel export exists in your components folder.

### Router 404
Check route is added in `router/index.ts` and navigation in `Sidebar.vue`.

### API errors
Verify API client exists in `api/services/<service>.ts` and exports functions correctly.