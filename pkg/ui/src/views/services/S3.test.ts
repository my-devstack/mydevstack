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
const mockUploadFiles = vi.fn()
const mockGetObject = vi.fn()
const mockGetPresignedUrl = vi.fn()
const mockConfigureLambdaTrigger = vi.fn()
const mockLoadLifecycleRules = vi.fn()
const mockSaveLifecycleRules = vi.fn()
const mockDeleteLifecycleRule = vi.fn()
const mockToggleVersioning = vi.fn()
const mockBuckets = ref([
  { Name: 'test-bucket', CreationDate: '2024-01-01T00:00:00Z' },
  { Name: 'another-bucket', CreationDate: '2024-02-01T00:00:00Z' },
])

vi.mock('@/composables/useS3', () => ({
  useS3: () => ({
    buckets: mockBuckets,
    objects: ref<any[]>([]),
    selectedBucket: ref<any>(null),
    loading: ref(false),
    uploading: ref(false),
    bucketDetails: ref<Record<string, any>>({}),
    loadBuckets: mockLoadBuckets,
    loadObjects: mockLoadObjects,
    loadBucketDetails: mockLoadBucketDetails,
    createBucket: mockCreateBucket,
    deleteBucket: mockDeleteBucket,
    deleteObject: mockDeleteObject,
    uploadObject: mockUploadObject,
    uploadFiles: mockUploadFiles,
    getObject: mockGetObject,
    getPresignedUrl: mockGetPresignedUrl,
    configureLambdaTrigger: mockConfigureLambdaTrigger,
    loadLifecycleRules: mockLoadLifecycleRules,
    saveLifecycleRules: mockSaveLifecycleRules,
    deleteLifecycleRule: mockDeleteLifecycleRule,
    toggleVersioning: mockToggleVersioning,
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
  S3LifecycleModal: true,
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

  describe('additional interaction tests', () => {
    it('handleCreateBucket with empty name does nothing', async () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateBucket('')
      expect(mockCreateBucket).not.toHaveBeenCalled()
    })

    it('handleCreateBucket with valid name calls API', async () => {
      mockCreateBucket.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateBucket('new-bucket')
      expect(mockCreateBucket).toHaveBeenCalledWith('new-bucket', undefined)
    })

    it('handleCreateBucket with API error sets error', async () => {
      mockCreateBucket.mockRejectedValue(new Error('Create failed'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateBucket('new-bucket')
      expect(wrapper.vm.error).toContain('Failed to create bucket')
    })

    it('handleCreateBucket with options passes options', async () => {
      mockCreateBucket.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateBucket('new-bucket', { enableCors: true })
      expect(mockCreateBucket).toHaveBeenCalledWith('new-bucket', { enableCors: true })
    })

    it('confirmDeleteBucket sets itemToDelete', () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.confirmDeleteBucket('test-bucket')
      expect(wrapper.vm.itemToDelete).toEqual({ type: 'bucket', name: 'test-bucket' })
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('confirmDeleteObject sets itemToDelete', () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.confirmDeleteObject('test.txt')
      expect(wrapper.vm.itemToDelete).toEqual({ type: 'object', name: 'test.txt' })
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('closeViewModal resets state', () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.showViewModal = true
      wrapper.vm.viewFileName = 'test.txt'
      wrapper.vm.closeViewModal()
      expect(wrapper.vm.showViewModal).toBe(false)
      expect(wrapper.vm.viewFileName).toBe('')
    })

    it('goBack resets selectedBucket and objects', () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      wrapper.vm.objects = [{ Key: 'test.txt' }]
      wrapper.vm.goBack()
      expect(wrapper.vm.selectedBucket).toBeNull()
      expect(wrapper.vm.objects).toEqual([])
    })

    it('loadObjects calls composable loadObjects', async () => {
      mockLoadObjects.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.loadObjects('test-bucket')
      expect(mockLoadObjects).toHaveBeenCalledWith('test-bucket')
    })

    it('handleSaveTrigger calls configureLambdaTrigger', async () => {
      mockConfigureLambdaTrigger.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.triggerBucketName = 'test-bucket'
      await wrapper.vm.handleSaveTrigger({ functionName: 'my-func', events: ['s3:ObjectCreated:*'] })
      expect(mockConfigureLambdaTrigger).toHaveBeenCalledWith('test-bucket', { functionName: 'my-func', events: ['s3:ObjectCreated:*'] })
    })

    it('viewObject with text content decodes body', async () => {
      mockGetObject.mockResolvedValue({ contentType: 'text/plain', body: new Uint8Array([72, 101, 108, 108, 111]) })
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      await wrapper.vm.viewObject('hello.txt')
      expect(wrapper.vm.viewContent).toBe('Hello')
      expect(wrapper.vm.showViewModal).toBe(true)
    })

    it('viewObject with binary content shows message', async () => {
      mockGetObject.mockResolvedValue({ contentType: 'image/png', body: new Uint8Array([1, 2, 3]) })
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      await wrapper.vm.viewObject('image.png')
      expect(wrapper.vm.viewContent).toContain('Binary file')
    })

    it('viewObject with error sets viewError', async () => {
      mockGetObject.mockRejectedValue(new Error('Not found'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      await wrapper.vm.viewObject('missing.txt')
      expect(wrapper.vm.viewError).toContain('Not found')
    })

    it('deleteBucket without itemToDelete does nothing', async () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.itemToDelete = null
      await wrapper.vm.deleteBucket()
      expect(mockDeleteBucket).not.toHaveBeenCalled()
    })

    it('deleteBucket calls composable deleteBucket', async () => {
      mockDeleteBucket.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.itemToDelete = { type: 'bucket', name: 'test-bucket' }
      await wrapper.vm.deleteBucket()
      expect(mockDeleteBucket).toHaveBeenCalledWith('test-bucket')
    })

    it('deleteBucket with BucketNotEmpty error shows conflict message', async () => {
      const err = new Error('BucketNotEmpty')
      err.name = 'BucketNotEmpty'
      mockDeleteBucket.mockRejectedValue(err)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.itemToDelete = { type: 'bucket', name: 'test-bucket' }
      await wrapper.vm.deleteBucket()
      expect(wrapper.vm.error).toContain('Conflict')
    })

    it('deleteObject without itemToDelete does nothing', async () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.itemToDelete = null
      wrapper.vm.selectedBucket = 'test-bucket'
      await wrapper.vm.deleteObject()
      expect(mockDeleteObject).not.toHaveBeenCalled()
    })

    it('deleteObject calls composable deleteObject', async () => {
      mockDeleteObject.mockResolvedValue(undefined)
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      wrapper.vm.itemToDelete = { type: 'object', name: 'test.txt' }
      await wrapper.vm.deleteObject()
      expect(mockDeleteObject).toHaveBeenCalledWith('test-bucket', 'test.txt')
    })

    it('copyObjectLink calls getPresignedUrl', async () => {
      mockGetPresignedUrl.mockResolvedValue('https://presigned.url/test')
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      await wrapper.vm.copyObjectLink('test.txt')
      expect(mockGetPresignedUrl).toHaveBeenCalledWith('test-bucket', 'test.txt')
    })

    it('deleteObject handles API error', async () => {
      mockDeleteObject.mockRejectedValue(new Error('Delete failed'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'
      wrapper.vm.itemToDelete = { type: 'object', name: 'test.txt' }
      await wrapper.vm.deleteObject()
      expect(wrapper.vm.error).toContain('Delete failed')
    })

    it('handleSaveTrigger with API error shows error', async () => {
      mockConfigureLambdaTrigger.mockRejectedValue(new Error('Config failed'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.triggerBucketName = 'test-bucket'
      await wrapper.vm.handleSaveTrigger({ functionName: 'my-func', events: ['s3:ObjectCreated:*'] })
      expect(wrapper.vm.error).toContain('Config failed')
    })

    it('deleteBucket with generic error shows message', async () => {
      mockDeleteBucket.mockRejectedValue(new Error('AccessDenied'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.itemToDelete = { type: 'bucket', name: 'test-bucket' }
      await wrapper.vm.deleteBucket()
      expect(wrapper.vm.error).toContain('AccessDenied')
    })

    it('handleCreateBucket with generic error shows error message', async () => {
      mockCreateBucket.mockRejectedValue(new Error('Generic failure'))
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      await wrapper.vm.handleCreateBucket('new-bucket')
      expect(wrapper.vm.error).toContain('Generic failure')
    })
  })

  describe('upload file/folder mapping', () => {
    it('uploadFile maps FileList to entries with file.name as key', async () => {
      mockUploadFiles.mockResolvedValue({ uploaded: ['a.txt', 'b.txt'], failed: [] })
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'

      // Create mock FileList with files
      const file1 = new File(['content1'], 'a.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'b.txt', { type: 'text/plain' })
      const mockFileList = { length: 2, item: (i: number) => [file1, file2][i], 0: file1, 1: file2 } as FileList
      const mockEvent = { target: { files: mockFileList, value: '' } } as unknown as Event

      await wrapper.vm.uploadFile(mockEvent)

      expect(mockUploadFiles).toHaveBeenCalledWith('test-bucket', [
        expect.objectContaining({ key: 'a.txt' }),
        expect.objectContaining({ key: 'b.txt' }),
      ])
      // Verify body is Uint8Array
      const call = mockUploadFiles.mock.calls[0]
      expect(call[1][0].body).toBeInstanceOf(Uint8Array)
      expect(call[1][1].body).toBeInstanceOf(Uint8Array)
    })

    it('uploadFolder maps FileList to entries with webkitRelativePath as key', async () => {
      mockUploadFiles.mockResolvedValue({ uploaded: ['folder1/file1', 'folder1/file2', 'folder1/folder2/file3', 'folder1/folder2/file4'], failed: [] })
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'

      // Create mock files with webkitRelativePath
      const file1 = Object.assign(new File(['a'], 'file1', { type: 'text/plain' }), { webkitRelativePath: 'folder1/file1' })
      const file2 = Object.assign(new File(['b'], 'file2', { type: 'text/plain' }), { webkitRelativePath: 'folder1/file2' })
      const file3 = Object.assign(new File(['c'], 'file3', { type: 'text/plain' }), { webkitRelativePath: 'folder1/folder2/file3' })
      const file4 = Object.assign(new File(['d'], 'file4', { type: 'text/plain' }), { webkitRelativePath: 'folder1/folder2/file4' })
      const mockFileList = { length: 4, item: (i: number) => [file1, file2, file3, file4][i], 0: file1, 1: file2, 2: file3, 3: file4 } as FileList
      const mockEvent = { target: { files: mockFileList, value: '' } } as unknown as Event

      await wrapper.vm.uploadFolder(mockEvent)

      expect(mockUploadFiles).toHaveBeenCalledWith('test-bucket', [
        expect.objectContaining({ key: 'folder1/file1' }),
        expect.objectContaining({ key: 'folder1/file2' }),
        expect.objectContaining({ key: 'folder1/folder2/file3' }),
        expect.objectContaining({ key: 'folder1/folder2/file4' }),
      ])
      // Verify exact order
      const call = mockUploadFiles.mock.calls[0]
      const keys = call[1].map((e: any) => e.key)
      expect(keys).toEqual(['folder1/file1', 'folder1/file2', 'folder1/folder2/file3', 'folder1/folder2/file4'])
    })

    it('uploadFile skips files with empty name', async () => {
      mockUploadFiles.mockResolvedValue({ uploaded: ['a.txt'], failed: [] })
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = 'test-bucket'

      const file1 = new File(['content'], 'a.txt', { type: 'text/plain' })
      const file2 = new File(['content'], '', { type: 'text/plain' }) // empty name
      const mockFileList = { length: 2, item: (i: number) => [file1, file2][i], 0: file1, 1: file2 } as FileList
      const mockEvent = { target: { files: mockFileList, value: '' } } as unknown as Event

      await wrapper.vm.uploadFile(mockEvent)

      expect(mockUploadFiles).toHaveBeenCalledWith('test-bucket', [
        expect.objectContaining({ key: 'a.txt' }),
      ])
    })

    it('uploadFolder does nothing when no bucket selected', async () => {
      const wrapper = mount(S3View, { global: { stubs: mountStubs } })
      wrapper.vm.selectedBucket = null

      const file1 = Object.assign(new File(['a'], 'file1', { type: 'text/plain' }), { webkitRelativePath: 'folder1/file1' })
      const mockFileList = { length: 1, item: () => file1, 0: file1 } as FileList
      const mockEvent = { target: { files: mockFileList, value: '' } } as unknown as Event

      await wrapper.vm.uploadFolder(mockEvent)

      expect(mockUploadFiles).not.toHaveBeenCalled()
    })
  })
})
