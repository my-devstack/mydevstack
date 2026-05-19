import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SSMParameterDetails from './SSMParameterDetails.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant', 'size'],
}
const statusBadgeStub = {
  template: '<span>{{ label }}</span>',
  props: ['status', 'label'],
}

const mockParam = {
  Name: '/test/param',
  Type: 'String',
  Value: 'test-value',
  Version: 3,
  Tier: 'Standard',
  DataType: 'text',
}

describe('SSMParameterDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when parameter is provided', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('does not render when parameter is null', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: null },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toBe('')
  })

  it('displays parameter name', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('/test/param')
  })

  it('displays parameter type', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('String')
  })

  it('displays version', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('3')
  })

  it('displays tier', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('Standard')
  })

  it('displays data type', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('text')
  })

  it('renders View Value button', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('View Value')
  })

  it('renders View History button', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: mockParam },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('View History')
  })

  it('defaults version to 1 when not provided', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: { ...mockParam, Version: undefined } },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('1')
  })

  it('shows SecureString type', () => {
    const wrapper = mount(SSMParameterDetails, {
      props: { parameter: { ...mockParam, Type: 'SecureString' } },
      global: { stubs: { Button: buttonStub, StatusBadge: statusBadgeStub } },
    })
    expect(wrapper.text()).toContain('SecureString')
  })
})
