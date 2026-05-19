import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/elasticache', () => ({
  describeReplicationGroups: vi.fn().mockResolvedValue([]),
  createReplicationGroup: vi.fn().mockResolvedValue({}),
  deleteReplicationGroup: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import ElastiCache from './ElastiCache.vue'

describe('ElastiCache.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders ElastiCache heading', () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('ElastiCache')
  })

  it('renders Create Group button', () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Group')
  })

  it('shows EmptyState when no groups after load', async () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders ElastiCacheCodeExamples component', () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    // ElastiCacheCodeExamples -> elasti-cache-code-examples-stub
    expect(wrapper.find('elasti-cache-code-examples-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(ElastiCache, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          ElastiCacheCreateGroupModal: true,
          ElastiCacheDeleteModal: true,
          ElastiCacheCodeExamples: true,
          PlusIcon: true,
          ArrowPathIcon: true,
          ServerIcon: true,
          CircleStackIcon: true,
          ChevronDownIcon: true,
          ChevronRightIcon: true,
        },
      },
    })
    // ElastiCacheCreateGroupModal -> elasti-cache-create-group-modal-stub
    expect(wrapper.find('elasti-cache-create-group-modal-stub').exists()).toBe(true)
    // ElastiCacheDeleteModal -> elasti-cache-delete-modal-stub
    expect(wrapper.find('elasti-cache-delete-modal-stub').exists()).toBe(true)
  })
})
