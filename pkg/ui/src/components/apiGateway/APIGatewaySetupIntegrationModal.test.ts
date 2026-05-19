import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewaySetupIntegrationModal from './APIGatewaySetupIntegrationModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false, region: 'us-east-1' }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot name="title" /><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button :disabled="loading"><slot /></button>',
  props: ['variant', 'loading'],
}

const defaultProps = {
  open: true,
  loading: false,
  currentIntegration: undefined,
  initialType: 'MOCK',
  initialUri: '',
  initialHttpMethod: 'POST',
  lambdaFunctions: [],
}

describe('APIGatewaySetupIntegrationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: { ...defaultProps, loading: true },
      global: { stubs: { Modal: modalStub, Button: true, FormInput: true, FormSelect: true, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('renders integration type select', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('Integration Type')
  })

  it('renders HTTP method select', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('Integration HTTP Method')
  })

  it('shows current integration info', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: { ...defaultProps, currentIntegration: { type: 'MOCK' } },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('Current integration')
  })

  it('renders cancel and save buttons', () => {
    const wrapper = mount(APIGatewaySetupIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Save')
  })
})
