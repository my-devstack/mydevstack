import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { ECRImageList } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const paginatedItems = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)

vi.mock('@/composables/usePagination', () => ({
  usePagination: vi.fn(() => ({
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    goToPage: vi.fn(),
    perPageOptions: [5, 10, 20, 50],
  })),
}))

const image = {
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  ImageDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ImageTags: ['latest', 'v1.0.0'],
  ImageSizeInBytes: 5242880,
  ImagePushedAt: '2024-01-15T10:30:00Z',
}

describe('ECRImageList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no images', () => {
    const wrapper = mount(ECRImageList, {
      props: { images: [], repositoryName: 'my-app', loading: true },
    })
    expect(wrapper.html()).toContain('Loading images...')
  })

  it('shows empty message when no images and not loading', () => {
    const wrapper = mount(ECRImageList, {
      props: { images: [], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('No images found in this repository')
  })

  it('renders image rows with tags', () => {
    paginatedItems.value = [image]
    const wrapper = mount(ECRImageList, {
      props: { images: [image], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('latest')
    expect(wrapper.html()).toContain('v1.0.0')
    expect(wrapper.html()).toContain('5.0 MB')
  })

  it('shows untagged label when no tags', () => {
    paginatedItems.value = [{ ...image, ImageTags: [] }]
    const wrapper = mount(ECRImageList, {
      props: { images: [{ ...image, ImageTags: [] }], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('untagged')
  })

  it('formats size as - when missing', () => {
    paginatedItems.value = [{ ...image, ImageSizeInBytes: undefined }]
    const wrapper = mount(ECRImageList, {
      props: { images: [{ ...image, ImageSizeInBytes: undefined }], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('-')
  })

  it('formats date as Unknown when missing', () => {
    paginatedItems.value = [{ ...image, ImagePushedAt: undefined }]
    const wrapper = mount(ECRImageList, {
      props: { images: [{ ...image, ImagePushedAt: undefined }], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('Unknown')
  })

  it('emits delete-image when delete button clicked', async () => {
    paginatedItems.value = [image]
    const wrapper = mount(ECRImageList, {
      props: { images: [image], repositoryName: 'my-app', loading: false },
    })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete-image')).toBeTruthy()
    expect(wrapper.emitted('delete-image')![0]).toEqual([image])
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [image]
    totalPages.value = 2
    const wrapper = mount(ECRImageList, {
      props: { images: [image], repositoryName: 'my-app', loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})