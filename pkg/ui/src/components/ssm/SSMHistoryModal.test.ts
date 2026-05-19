import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SSMHistoryModal from './SSMHistoryModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant'],
}

const mockHistory = [
  { Name: '/test/param', Version: 2, Value: 'value-v2', LastModifiedDate: '2024-06-01T10:00:00Z', LastModifiedUser: 'user1' },
  { Name: '/test/param', Version: 1, Value: 'value-v1', LastModifiedDate: '2024-05-01T10:00:00Z', LastModifiedUser: 'user2' },
]

const defaultProps = {
  open: true,
  loading: false,
  history: mockHistory,
  columns: [
    { key: 'Version', label: 'Version', sortable: true },
    { key: 'Value', label: 'Value', sortable: false },
    { key: 'LastModifiedDate', label: 'Last Modified', sortable: true },
    { key: 'LastModifiedUser', label: 'Modified By', sortable: false },
  ],
}

describe('SSMHistoryModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(SSMHistoryModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, DataTable: true, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(SSMHistoryModal, {
      props: { ...defaultProps, loading: true },
      global: { stubs: { Modal: modalStub, Button: buttonStub, DataTable: true, LoadingSpinner: false, EmptyState: true } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows empty state when history is empty', () => {
    const wrapper = mount(SSMHistoryModal, {
      props: { ...defaultProps, history: [] },
      global: { stubs: { Modal: modalStub, Button: buttonStub, DataTable: true, LoadingSpinner: true, EmptyState: false } },
    })
    const emptyState = wrapper.findComponent({ name: 'EmptyState' })
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.props('title')).toContain('No History')
  })

  it('renders DataTable when history exists', () => {
    const wrapper = mount(SSMHistoryModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, DataTable: false, LoadingSpinner: true, EmptyState: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.exists()).toBe(true)
  })

  it('renders close button', () => {
    const wrapper = mount(SSMHistoryModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, DataTable: true, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Close')
  })
})
