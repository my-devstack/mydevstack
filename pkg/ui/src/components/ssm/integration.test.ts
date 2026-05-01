import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock SSMParameterDetails (rendered inside SSMParametersList accordion)
vi.mock('@/components/ssm/SSMParameterDetails.vue', () => ({
  default: {
    name: 'SSMParameterDetails',
    props: ['parameter'],
    emits: ['view-value', 'view-history', 'update'],
    template: `<div class="mock-param-details" v-if="parameter" />`,
  },
}))

// Mock other SSM components (for SSM view tests)
vi.mock('@/components/ssm/SSMCreateModal.vue', () => ({
  default: {
    name: 'SSMCreateModal',
    props: ['open', 'loading', 'newParamName', 'newParamValue', 'newParamType', 'newParamDescription'],
    emits: ['update:open', 'update:new-param-name', 'update:new-param-value', 'update:new-param-type', 'update:new-param-description', 'create'],
    template: `<div class="mock-create-modal" v-if="open" />`,
  },
}))

vi.mock('@/components/ssm/SSMValueModal.vue', () => ({
  default: {
    name: 'SSMValueModal',
    props: ['open', 'loading', 'parameter'],
    emits: ['update:open', 'update:new-param-value', 'update'],
    template: `<div class="mock-value-modal" v-if="open && parameter" />`,
  },
}))

vi.mock('@/components/ssm/SSMHistoryModal.vue', () => ({
  default: {
    name: 'SSMHistoryModal',
    props: ['open', 'loading', 'history', 'columns'],
    emits: ['update:open'],
    template: `<div class="mock-history-modal" v-if="open" />`,
  },
}))

vi.mock('@/components/ssm/SSMDeleteModal.vue', () => ({
  default: {
    name: 'SSMDeleteModal',
    props: ['open', 'loading', 'parameterToDelete'],
    emits: ['update:open', 'confirm'],
    template: `<div class="mock-delete-modal" v-if="open" />`,
  },
}))

// Mock common components used by SSMParametersList
vi.mock('@/components/common/StatusBadge.vue', () => ({
  default: {
    name: 'StatusBadge',
    props: ['status', 'label', 'size'],
    template: `<span class="mock-status-badge">{{ label }}</span>`,
  },
}))

vi.mock('@/components/common/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'loading'],
    template: '<button class="mock-button"><slot /></button>',
  },
}))

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

// Mock heroicons as proper Vue components
vi.mock('@heroicons/vue/24/outline', () => ({
  PlusIcon: { template: '<div class="mock-icon" />' },
  ArrowPathIcon: { template: '<div class="mock-icon" />' },
  KeyIcon: { template: '<div class="mock-icon" />' },
  BeakerIcon: { template: '<div class="mock-icon" />' },
  TrashIcon: { template: '<div class="mock-icon" />' },
  EyeIcon: { template: '<div class="mock-icon" />' },
}))

// Mock the useSSM composable
vi.mock('@/composables/useSSM', () => ({
  useSSM: vi.fn(),
}))

// Import real SSMParametersList AFTER all mocks
import SSMParametersList from '@/components/ssm/SSMParametersList.vue'

describe('SSMParametersList - Accordion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders parameter list with accordion rows', () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [
          { Name: 'param-1', Type: 'String', Version: 1, LastModifiedDate: '2024-01-01' },
          { Name: 'param-2', Type: 'SecureString', Version: 2 },
        ],
        loading: false,
      },
    })

    // Header row present
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Type')
    expect(wrapper.text()).toContain('Version')

    // Parameter rows present
    expect(wrapper.text()).toContain('param-1')
    expect(wrapper.text()).toContain('param-2')
  })

  it('starts with no expanded parameter', () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    // SSMParameterDetails should NOT be rendered (nothing expanded)
    expect(wrapper.find('.mock-param-details').exists()).toBe(false)
  })

  it('expands on row click (exclusive)', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [
          { Name: 'param-1', Type: 'String', Version: 1 },
          { Name: 'param-2', Type: 'StringList', Version: 1 },
        ],
        loading: false,
      },
    })

    // Find clickable rows (the main row divs with cursor-pointer)
    const clickableRows = wrapper.findAll('.cursor-pointer')
    expect(clickableRows.length).toBe(2)

    // Click first row
    await clickableRows[0].trigger('click')

    // First param details should be visible
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mock-param-details').exists()).toBe(true)

    // Click second row — should collapse first, expand second (exclusive)
    await clickableRows[1].trigger('click')
    await wrapper.vm.$nextTick()

    // Details still rendered (second param)
    expect(wrapper.find('.mock-param-details').exists()).toBe(true)
  })

  it('emits select event on row click', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([{ Name: 'param-1', Type: 'String', Version: 1 }])
  })

  it('emits view-value event via button', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    const viewValueBtn = wrapper.find('button[aria-label="View Value"]')
    expect(viewValueBtn.exists()).toBe(true)
    await viewValueBtn.trigger('click')

    expect(wrapper.emitted('view-value')).toBeTruthy()
  })

  it('emits view-history event via button', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    const viewHistoryBtn = wrapper.find('button[aria-label="View History"]')
    expect(viewHistoryBtn.exists()).toBe(true)
    await viewHistoryBtn.trigger('click')

    expect(wrapper.emitted('view-history')).toBeTruthy()
  })

  it('emits delete event via button', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    const deleteBtn = wrapper.find('button[aria-label="Delete"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('shows loading state', () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [],
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('Loading parameters')
  })

  it('shows empty state when no parameters and not loading', () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('No parameters found')
  })

  it('renders SSMParameterDetails inside expanded row', async () => {
    const wrapper = mount(SSMParametersList, {
      props: {
        parameters: [{ Name: 'param-1', Type: 'String', Version: 1 }],
        loading: false,
      },
    })

    // Expand row
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    await wrapper.vm.$nextTick()

    // SSMParameterDetails should be rendered
    expect(wrapper.find('.mock-param-details').exists()).toBe(true)
  })
})
