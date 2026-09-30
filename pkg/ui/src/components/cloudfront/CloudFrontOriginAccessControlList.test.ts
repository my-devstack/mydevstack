import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { CloudFrontOriginAccessControlList } from './index'

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

const oac = {
  Id: 'OAC123',
  Name: 'my-oac',
  Description: 'Test OAC',
  OriginAccessControlOriginType: 's3',
  SigningBehavior: 'always',
  SigningProtocol: 'sigv4',
}

describe('CloudFrontOriginAccessControlList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no OACs', () => {
    const wrapper = mount(CloudFrontOriginAccessControlList, {
      props: { originAccessControls: [], loading: true },
    })
    expect(wrapper.html()).toContain('Loading origin access controls...')
  })

  it('shows empty message when no OACs and not loading', () => {
    const wrapper = mount(CloudFrontOriginAccessControlList, {
      props: { originAccessControls: [], loading: false },
    })
    expect(wrapper.html()).toContain('No origin access controls found')
  })

  it('renders OAC rows', () => {
    paginatedItems.value = [oac]
    const wrapper = mount(CloudFrontOriginAccessControlList, {
      props: { originAccessControls: [oac], loading: false },
    })
    expect(wrapper.html()).toContain('my-oac')
    expect(wrapper.html()).toContain('OAC123')
    expect(wrapper.html()).toContain('s3')
    expect(wrapper.html()).toContain('always')
  })

  it('emits delete when delete button clicked', async () => {
    paginatedItems.value = [oac]
    const wrapper = mount(CloudFrontOriginAccessControlList, {
      props: { originAccessControls: [oac], loading: false },
    })
    const deleteBtn = wrapper.find('button[title="Delete OAC"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual([oac])
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [oac]
    totalPages.value = 2
    const wrapper = mount(CloudFrontOriginAccessControlList, {
      props: { originAccessControls: [oac], loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})
