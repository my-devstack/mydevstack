import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

const mocks = {
  loadBuckets: vi.fn().mockResolvedValue(undefined),
  loadObjects: vi.fn().mockResolvedValue(undefined),
  createBucket: vi.fn().mockResolvedValue({}),
  deleteBucket: vi.fn().mockResolvedValue({}),
  deleteObject: vi.fn().mockResolvedValue({}),
  createFolder: vi.fn().mockResolvedValue({}),
  countFolderObjects: vi.fn().mockResolvedValue({ keys: [], total: 0 }),
  deleteFolderObjects: vi.fn().mockResolvedValue({ deleted: 0, failed: 0 }),
}

vi.mock('@/composables/useS3', () => ({
  useS3: vi.fn(() => ({
    buckets: { value: [] },
    objects: { value: [] },
    prefixes: { value: [] },
    selectedBucket: ref<string | null>(null),
    currentPrefix: { value: '' },
    viewMode: { value: 'folders' },
    breadcrumbs: { value: [] },
    loading: { value: false },
    uploading: { value: false },
    ...mocks,
    getObject: vi.fn().mockResolvedValue({}),
    formatBody: vi.fn(),
    navigateToPrefix: vi.fn(),
    navigateUp: vi.fn(),
    setViewMode: vi.fn(),
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

const readOnlyState = { value: false }

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    emulator: 'aws',
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test',
    get readOnly() { return readOnlyState.value },
  })),
}))

vi.mock('@heroicons/vue/24/outline', () => {
  const stub = { template: '<span class="mock-icon" />' }
  return {
    ArchiveBoxIcon: stub,
    CalendarDaysIcon: stub,
    PlusIcon: stub,
    TrashIcon: stub,
    ArrowPathIcon: stub,
  }
})

import S3View from './S3.vue'

const baseStubs = {
  S3BucketsList: { template: '<div class="mock-buckets-list" />' },
  S3ObjectsList: { template: '<div class="mock-objects-list" />' },
  S3CreateModal: {
    name: 'S3CreateModal',
    props: ['open'],
    emits: ['update:open', 'create'],
    template: '<div v-if="open" role="dialog" class="mock-create-modal" data-testid="create-modal">Create Modal</div>',
  },
  S3ViewModal: { template: '<div v-if="open" class="mock-view-modal" />' },
  S3DeleteModal: { template: '<div v-if="open" class="mock-delete-modal" />' },
  S3CodeExamples: { template: '<div class="mock-code-examples" />' },
  S3TriggerModal: { template: '<div v-if="open" class="mock-trigger-modal" />' },
  S3PolicyModal: { template: '<div v-if="open" class="mock-policy-modal" />' },
  S3LifecycleModal: { template: '<div v-if="open" class="mock-lifecycle-modal" />' },
}

function mountView() {
  return mount(S3View, { global: { stubs: baseStubs } })
}

function resetMocks() {
  Object.values(mocks).forEach(m => m.mockReset().mockResolvedValue({}))
  mocks.loadBuckets.mockResolvedValue(undefined)
  mocks.loadObjects.mockResolvedValue(undefined)
}

describe('S3 View Integration — read-only gating', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    readOnlyState.value = false
    resetMocks()
  })

  it('readOnly true: Create Bucket button is disabled', async () => {
    readOnlyState.value = true
    const wrapper = mountView()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Bucket'))
    expect(createBtn).toBeTruthy()
    expect(createBtn!.attributes('disabled')).toBeDefined()
    expect(createBtn!.attributes('title')).toBe('Read-only mode: action not allowed')
  })

  it('readOnly true: clicking disabled Create Bucket does not open modal and does not call createBucket API', async () => {
    readOnlyState.value = true
    const wrapper = mountView()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Bucket'))!
    await createBtn.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="create-modal"]').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(mocks.createBucket).not.toHaveBeenCalled()
  })

  it('readOnly false: Create Bucket enabled, click opens modal', async () => {
    readOnlyState.value = false
    const wrapper = mountView()
    await flushPromises()
    await wrapper.vm.$nextTick()

    const btn = wrapper.findAll('button').find(b => b.text().includes('+ Create Bucket'))!
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="create-modal"]').exists()).toBe(false)

    await btn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="create-modal"]').exists()).toBe(true)
  })

  it('toggle readOnly: remount reflects new gating state', async () => {
    readOnlyState.value = false
    const w1 = mountView()
    await flushPromises()
    const btnOff = w1.findAll('button').find(b => b.text().includes('+ Create Bucket'))!
    expect(btnOff.attributes('disabled')).toBeUndefined()
    w1.unmount()

    readOnlyState.value = true
    const w2 = mountView()
    await flushPromises()
    const btnOn = w2.findAll('button').find(b => b.text().includes('+ Create Bucket'))!
    expect(btnOn.attributes('disabled')).toBeDefined()
    expect(w2.find('[data-testid="create-modal"]').exists()).toBe(false)
  })
})
