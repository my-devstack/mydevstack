import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SSMValueModal from './SSMValueModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button :disabled="loading" :aria-label="$attrs.ariaLabel"><slot /></button>',
  props: ['variant', 'loading', 'size', 'ariaLabel'],
}
const statusBadgeStub = {
  template: '<span>{{ label }}</span>',
  props: ['status', 'label'],
}

const mockParam = {
  Name: '/test/param',
  Type: 'String',
  Value: 'test-value',
  Version: 2,
  Description: 'A test parameter',
}

const defaultProps = {
  open: true,
  loading: false,
  parameter: mockParam,
}

describe('SSMValueModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open with parameter', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('displays parameter type', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('String')
  })

  it('displays version', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('2')
  })

  it('displays parameter value', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('test-value')
  })

  it('displays description', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('A test parameter')
  })

  it('renders textarea for new value', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    const textareas = wrapper.findAll('textarea')
    expect(textareas.length).toBeGreaterThanOrEqual(1)
  })

  it('renders update and close buttons', () => {
    const wrapper = mount(SSMValueModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('Update')
    expect(wrapper.text()).toContain('Close')
  })

  it('shows placeholder text when description missing', () => {
    const wrapper = mount(SSMValueModal, {
      props: { ...defaultProps, parameter: { ...mockParam, Description: undefined } },
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).not.toContain('A test parameter')
  })

  it('shows Value not loaded text when value missing', () => {
    const wrapper = mount(SSMValueModal, {
      props: { ...defaultProps, parameter: { ...mockParam, Value: undefined } },
      global: { stubs: { Modal: modalStub, Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('(Value not loaded)')
  })
})
