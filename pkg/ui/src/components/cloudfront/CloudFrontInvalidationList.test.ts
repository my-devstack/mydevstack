import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { CloudFrontInvalidationList } from './index'

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

const inv = {
  Id: 'INV123456',
  Status: 'Completed',
  CreateTime: '2024-01-15T10:30:00Z',
  InvalidationBatch: {
    Paths: { Quantity: 1, Items: ['/*'] },
    CallerReference: 'ref1',
  },
}

describe('CloudFrontInvalidationList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no invalidations', () => {
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [], loading: true },
    })
    expect(wrapper.html()).toContain('Loading invalidations...')
  })

  it('shows empty message when no invalidations and not loading', () => {
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [], loading: false },
    })
    expect(wrapper.html()).toContain('No invalidations found')
  })

  it('renders invalidation rows', () => {
    paginatedItems.value = [inv]
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [inv], loading: false },
    })
    expect(wrapper.html()).toContain('INV123456')
    expect(wrapper.html()).toContain('Completed')
    expect(wrapper.html()).toContain('/*')
  })

  it('shows InProgress status badge', () => {
    const inProgressInv = { ...inv, Status: 'InProgress' }
    paginatedItems.value = [inProgressInv]
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [inProgressInv], loading: false },
    })
    expect(wrapper.html()).toContain('InProgress')
  })

  it('shows multiple paths', () => {
    const multiPathInv = {
      ...inv,
      InvalidationBatch: {
        Paths: { Quantity: 2, Items: ['/images/*', '/css/*'] },
        CallerReference: 'ref2',
      },
    }
    paginatedItems.value = [multiPathInv]
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [multiPathInv], loading: false },
    })
    expect(wrapper.html()).toContain('/images/*')
    expect(wrapper.html()).toContain('/css/*')
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [inv]
    totalPages.value = 2
    const wrapper = mount(CloudFrontInvalidationList, {
      props: { invalidations: [inv], loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})
