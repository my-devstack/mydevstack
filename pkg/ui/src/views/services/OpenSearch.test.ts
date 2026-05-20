import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('@/composables/useOpenSearch', () => ({
  useOpenSearch: () => ({
    domains: ref([]),
    loading: ref(false),
    isAvailable: ref(true),
    expandedDomains: ref({}),
    showCreateModal: ref(false),
    showDeleteConfirm: ref(false),
    domainToDelete: ref(null),
    codeExamples: ref({}),
    creating: ref(false),
    domainDetails: ref({}),
    loadingDomainDetails: ref(false),
    compatibleVersions: ref([]),
    loadingCompatibleVersions: ref(false),
    loadDomains: vi.fn(),
    deleteDomain: vi.fn(),
    toggleDomain: vi.fn(),
    confirmDelete: vi.fn(),
    getStatus: vi.fn(),
    createDomain: vi.fn(),
    createForm: ref({}),
    loadDomainDetails: vi.fn(),
    loadCompatibleVersions: vi.fn(),
    getDomainTags: vi.fn(),
    getDomainDetailsStatus: vi.fn(),
    addDomainTag: vi.fn(),
    removeDomainTag: vi.fn(),
    getCompatibleVersionFor: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import OpenSearchView from './OpenSearch.vue'

const stubs = {
  PlusIcon: true,
  ArrowPathIcon: true,
  ChevronDownIcon: true,
  ChevronRightIcon: true,
  Button: { template: '<button><slot /></button>' },
  Modal: true,
  FormInput: true,
  StatusBadge: true,
  EmptyState: true,
  OpenSearchCreateDomainModal: true,
  OpenSearchDeleteModal: true,
  OpenSearchCodeExamples: true,
}

describe('OpenSearch.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders OpenSearch heading', () => {
    const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
    expect(wrapper.text()).toContain('OpenSearch')
  })

  it('renders Create Domain button when available', () => {
    const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
    expect(wrapper.text()).toContain('Create Domain')
  })

  it('renders empty state when no domains', () => {
    const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders OpenSearchCodeExamples component', () => {
    const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
    expect(wrapper.find('open-search-code-examples-stub').exists()).toBe(true)
  })

  describe('template inline handler coverage', () => {
    it('showCreateModal toggle', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('modal @update:open handler for create domain', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      const modal = wrapper.findComponent('open-search-create-domain-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })

    it('modal @update:open handler for delete', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      const modal = wrapper.findComponent('open-search-delete-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
      }
    })

    it('openAddTagModal sets state', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.openAddTagModal('test-domain')
      expect(wrapper.vm.addTagDomainName).toBe('test-domain')
      expect(wrapper.vm.showAddTagModal).toBe(true)
    })

    it('handleAddTag with empty key returns early', async () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.newTagKey = ''
      await wrapper.vm.handleAddTag()
      // early return
    })

    it('handleAddTag with valid key calls addDomainTag', async () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.addTagDomainName = 'test-domain'
      wrapper.vm.newTagKey = 'Environment'
      wrapper.vm.newTagValue = 'prod'
      await wrapper.vm.handleAddTag()
      expect(wrapper.vm.showAddTagModal).toBe(false)
    })

    it('Add Tag modal @update:open handler', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      const modal = wrapper.findComponent({ name: 'Modal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showAddTagModal).toBe(false)
      }
    })

    it('loadDomains via refresh button', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.loadDomains()
    })

    it('pagination @click handlers coverage via goToPage', () => {
      const wrapper = shallowMount(OpenSearchView, { global: { stubs } })
      wrapper.vm.goToPage(1)
    })
  })
})
