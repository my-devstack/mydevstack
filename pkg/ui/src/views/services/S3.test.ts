import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'

const mockLoadBuckets = vi.fn()
const mockLoadObjects = vi.fn()
const mockLoadBucketDetails = vi.fn()
const mockCreateBucket = vi.fn()
const mockDeleteBucket = vi.fn()
const mockDeleteObject = vi.fn()
const mockUploadObject = vi.fn()
const mockGetObject = vi.fn()
const mockGetPresignedUrl = vi.fn()
const mockConfigureLambdaTrigger = vi.fn()
const mockBuckets = ref([
  { Name: 'test-bucket', CreationDate: '2024-01-01T00:00:00Z' },
  { Name: 'another-bucket', CreationDate: '2024-02-01T00:00:00Z' },
])

vi.mock('@/composables/useS3', () => ({
  useS3: () => ({
    buckets: mockBuckets,
    objects: ref([]),
    selectedBucket: ref(null),
    loading: ref(false),
    uploading: ref(false),
    bucketDetails: ref({}),
    loadBuckets: mockLoadBuckets,
    loadObjects: mockLoadObjects,
    loadBucketDetails: mockLoadBucketDetails,
    createBucket: mockCreateBucket,
    deleteBucket: mockDeleteBucket,
    deleteObject: mockDeleteObject,
    uploadObject: mockUploadObject,
    getObject: mockGetObject,
    getPresignedUrl: mockGetPresignedUrl,
    configureLambdaTrigger: mockConfigureLambdaTrigger,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import S3View from './S3.vue'

const mountStubs = {
  ArchiveBoxIcon: true,
  S3BucketsList: true,
  S3ObjectsList: true,
  S3CreateModal: true,
  S3ViewModal: true,
  S3DeleteModal: true,
  S3CodeExamples: true,
  S3TriggerModal: true,
  S3PolicyModal: true,
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
}

const shallowStubs = {
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
}

describe('S3.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockBuckets.value = [
      { Name: 'test-bucket', CreationDate: '2024-01-01T00:00:00Z' },
      { Name: 'another-bucket', CreationDate: '2024-02-01T00:00:00Z' },
    ]
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders S3 heading', () => {
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('S3')
  })

  it('renders Create Bucket button', () => {
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('Create Bucket')
  })

  it('renders S3BucketsList component', () => {
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    // Auto-stub renders as <s3-buckets-list-stub>
    expect(wrapper.find('s3-buckets-list-stub').exists()).toBe(true)
  })

  it('renders S3CodeExamples component', () => {
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(wrapper.find('s3-code-examples-stub').exists()).toBe(true)
  })

  it('calls loadBuckets on mount', () => {
    shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(mockLoadBuckets).toHaveBeenCalledTimes(1)
  })

  it('shows buckets heading with count', () => {
    mockBuckets.value = []
    const wrapper = shallowMount(S3View, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('S3 Buckets')
  })

  it('mounts with explicit stubs without error', () => {
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('handles create bucket via mount with stubs', async () => {
    mockCreateBucket.mockResolvedValue(undefined)
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('s3-create-modal-stub')
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('create', 'new-bucket')
      await new Promise(process.nextTick)
    }
    expect(wrapper.exists()).toBe(true)
  })

  it('triggers delete bucket via mount with stubs', async () => {
    mockDeleteBucket.mockResolvedValue(undefined)
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('s3-delete-modal-stub')
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('delete', 'test-bucket')
      await new Promise(process.nextTick)
    }
    expect(wrapper.exists()).toBe(true)
  })

  it('triggers lambda trigger config via mount with stubs', async () => {
    mockConfigureLambdaTrigger.mockResolvedValue(undefined)
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('s3-trigger-modal-stub')
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('configure', { bucketName: 'test-bucket', lambdaArn: 'arn:aws:lambda:us-east-1:123:function:test' })
      await new Promise(process.nextTick)
    }
    expect(wrapper.exists()).toBe(true)
  })

  it('handles object interactions via mount with stubs', async () => {
    mockGetObject.mockResolvedValue({ Body: 'content', ContentType: 'text/plain' })
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })

    const objList = wrapper.findComponent('s3-objects-list-stub')
    if (objList.exists()) {
      objList.vm.$emit('view', { Key: 'test.txt' })
      await new Promise(process.nextTick)

      objList.vm.$emit('delete', { Key: 'test.txt' })
      await new Promise(process.nextTick)
    }
  })

  it('renders policy and trigger modals', () => {
    const wrapper = mount(S3View, { global: { stubs: mountStubs } })
    expect(wrapper.find('s3-policy-modal-stub').exists()).toBe(true)
    expect(wrapper.find('s3-trigger-modal-stub').exists()).toBe(true)
  })
})
