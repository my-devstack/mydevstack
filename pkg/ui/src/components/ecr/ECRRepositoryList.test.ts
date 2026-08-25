import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { ECRRepositoryList } from './index'

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

const repo = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:000000000000:repository/my-app',
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  RepositoryUri: '000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
}

describe('ECRRepositoryList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no repositories', () => {
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [], loading: true },
    })
    expect(wrapper.html()).toContain('Loading repositories...')
  })

  it('shows empty message when no repositories and not loading', () => {
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [], loading: false },
    })
    expect(wrapper.html()).toContain('No ECR repositories found')
  })

  it('renders repository rows', () => {
    paginatedItems.value = [repo]
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [repo], loading: false },
    })
    expect(wrapper.html()).toContain('my-app')
    expect(wrapper.html()).toContain('000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app')
    expect(wrapper.html()).toContain('MUTABLE')
  })

  it('formats date as Unknown when missing', () => {
    paginatedItems.value = [{ ...repo, CreatedAt: undefined }]
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [{ ...repo, CreatedAt: undefined }], loading: false },
    })
    expect(wrapper.html()).toContain('Unknown')
  })

  it('shows default mutability when missing', () => {
    paginatedItems.value = [{ ...repo, ImageTagMutability: undefined }]
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [{ ...repo, ImageTagMutability: undefined }], loading: false },
    })
    expect(wrapper.html()).toContain('MUTABLE')
  })

  it('emits view-repository when row clicked', async () => {
    paginatedItems.value = [repo]
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [repo], loading: false },
    })
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.emitted('view-repository')).toBeTruthy()
    expect(wrapper.emitted('view-repository')![0]).toEqual([repo])
  })

  it('emits delete-repository when delete button clicked', async () => {
    paginatedItems.value = [repo]
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [repo], loading: false },
    })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete-repository')).toBeTruthy()
    expect(wrapper.emitted('delete-repository')![0]).toEqual([repo])
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [repo]
    totalPages.value = 2
    const wrapper = mount(ECRRepositoryList, {
      props: { repositories: [repo], loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})