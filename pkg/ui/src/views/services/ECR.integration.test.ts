import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock API layer — composable runs real code against mocked API
vi.mock('@/api/services/ecr', () => ({
  listRepositories: vi.fn(),
  createRepository: vi.fn().mockResolvedValue({}),
  deleteRepository: vi.fn().mockResolvedValue({}),
  describeImages: vi.fn(),
  batchDeleteImage: vi.fn().mockResolvedValue({}),
  listTagsForResource: vi.fn().mockResolvedValue({ Tags: [] }),
  updateTags: vi.fn().mockResolvedValue({}),
  getAuthorizationToken: vi.fn().mockResolvedValue({ AuthorizationData: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

const ecrReadOnly = { value: false }

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test-key',
    secretKey: 'test-secret',
    get readOnly() { return ecrReadOnly.value },
  })),
}))

import ECR from './ECR.vue'
import * as ecrApi from '@/api/services/ecr'

const mockRepository = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:123456789012:repository/my-app',
  RegistryId: '123456789012',
  RepositoryName: 'my-app',
  RepositoryUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
}

const mockImage = {
  RegistryId: '123456789012',
  RepositoryName: 'my-app',
  ImageDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ImageTags: ['latest'],
  ImageSizeInBytes: 5242880,
  ImagePushedAt: '2024-01-15T10:30:00Z',
}

function makeStubs() {
  return {
    Tabs: {
      name: 'Tabs',
      props: ['tabs', 'activeTab'],
      emits: ['update:activeTab'],
      template: `
        <div class="tabs-stub" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            role="tab"
            :data-testid="'tab-' + tab.id"
            @click="$emit('update:activeTab', tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      `,
    },
    ECRRepositoryList: {
      name: 'ECRRepositoryList',
      props: ['repositories', 'loading'],
      emits: ['view-repository', 'delete-repository'],
      template: `
        <div class="mock-repo-list">
          <div
            v-for="repo in repositories"
            :key="repo.RepositoryName"
            :data-testid="'repo-' + repo.RepositoryName"
            class="mock-repo-row"
            @click="$emit('view-repository', repo)"
          >
            {{ repo.RepositoryName }}
          </div>
        </div>
      `,
    },
    ECRImageList: {
      name: 'ECRImageList',
      props: ['images', 'repositoryName', 'loading'],
      emits: ['delete-image'],
      template: '<div class="mock-image-list">Images</div>',
    },
    ECRModal: {
      name: 'ECRModal',
      props: ['open', 'mode'],
      template: '<div v-if="open" data-testid="ecr-modal" class="mock-modal">Modal</div>',
    },
    ECRCodeExamples: {
      name: 'ECRCodeExamples',
      props: ['region', 'accessKey', 'secretKey', 'repositoryName'],
      template: '<div class="mock-code-examples">Code Examples</div>',
    },
  }
}

describe('ECR View Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    ecrReadOnly.value = false
  })

  it('renders the view with tabs and code examples section on mount', async () => {
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [mockRepository] })

    const wrapper = mount(ECR, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('ECR')

    // Tabs present
    expect(wrapper.find('[data-testid="tab-repositories"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-images"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Repositories')
    expect(wrapper.text()).toContain('Images')

    // Code Examples section always visible
    expect(wrapper.find('.mock-code-examples').exists()).toBe(true)
    expect(wrapper.text()).toContain('Code Examples')
  })

  it('loads repositories on initial mount', async () => {
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [mockRepository] })

    const wrapper = mount(ECR, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(ecrApi.listRepositories).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.repositories).toHaveLength(1)
    expect(wrapper.find('[data-testid="repo-my-app"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1 repository(ies)')
  })

  it('switches to images tab and loads images for first repository', async () => {
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [mockRepository] })
    vi.mocked(ecrApi.describeImages).mockResolvedValue({ ImageDetails: [mockImage] })

    const wrapper = mount(ECR, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Click Images tab → handleTabChange auto-selects first repository
    await wrapper.find('[data-testid="tab-images"]').trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeTab).toBe('images')
    expect(ecrApi.describeImages).toHaveBeenCalledWith('my-app')
    expect(wrapper.find('.mock-image-list').exists()).toBe(true)
  })

  it('shows pagination controls when more than one page of repositories', async () => {
    const manyRepos = Array.from({ length: 25 }, (_, i) => ({
      ...mockRepository,
      RepositoryName: `repo-${i}`,
      RepositoryArn: `arn:aws:ecr:us-east-1:123456789012:repository/repo-${i}`,
      RepositoryUri: `123456789012.dkr.ecr.us-east-1.amazonaws.com/repo-${i}`,
    }))
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: manyRepos })

    const wrapper = mount(ECR, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.repositories).toHaveLength(25)
    expect(wrapper.text()).toContain('25 repository(ies)')
  })

  describe('read-only gating', () => {
    it('readOnly true: Create Repository button is disabled', async () => {
      ecrReadOnly.value = true
      vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

      const wrapper = mount(ECR, {
        global: { stubs: makeStubs() },
      })
      await flushPromises()
      await wrapper.vm.$nextTick()

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Repository'))
      expect(createBtn).toBeTruthy()
      expect(createBtn!.attributes('disabled')).toBeDefined()
      expect(createBtn!.attributes('title')).toBe('Read-only mode: action not allowed')
    })

    it('readOnly false: Create Repository button is enabled', async () => {
      ecrReadOnly.value = false
      vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

      const wrapper = mount(ECR, {
        global: { stubs: makeStubs() },
      })
      await flushPromises()
      await wrapper.vm.$nextTick()

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Repository'))
      expect(createBtn).toBeTruthy()
      expect(createBtn!.attributes('disabled')).toBeUndefined()
    })

    it('readOnly true: clicking Create Repository does NOT call createRepository API', async () => {
      ecrReadOnly.value = true
      vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

      const wrapper = mount(ECR, {
        global: { stubs: makeStubs() },
      })
      await flushPromises()
      await wrapper.vm.$nextTick()

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Repository'))!
      await createBtn.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(ecrApi.createRepository).not.toHaveBeenCalled()
    })

    it('readOnly false: clicking Create Repository calls openCreateModal (modal opens)', async () => {
      ecrReadOnly.value = false
      vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

      const wrapper = mount(ECR, {
        global: { stubs: makeStubs() },
      })
      await flushPromises()
      await wrapper.vm.$nextTick()

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('+ Create Repository'))!
      await createBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="ecr-modal"]').exists()).toBe(true)
    })
  })
})
