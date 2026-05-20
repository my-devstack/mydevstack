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

  describe('lambda selection', () => {
    it('renders lambda dropdown when type AWS and functions available', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'AWS', lambdaFunctions: ['fn-1', 'fn-2'] },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: false, LoadingSpinner: true } },
      })
      expect(wrapper.text()).toContain('Lambda Function')
    })

    it('shows manual URI hint when type AWS and no functions', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'AWS', lambdaFunctions: [] },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
      })
      expect(wrapper.text()).toContain('No Lambda functions found')
    })
  })

  describe('URI input visibility', () => {
    it('shows URI input for AWS type', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'AWS' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: false, FormSelect: true, LoadingSpinner: true } },
      })
      expect(wrapper.text()).toContain('Integration URI')
    })

    it('shows URI input for HTTP type', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'HTTP' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: false, FormSelect: true, LoadingSpinner: true } },
      })
      expect(wrapper.text()).toContain('Integration URI')
    })

    it('shows URI input for HTTP_PROXY type', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'HTTP_PROXY' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: false, FormSelect: true, LoadingSpinner: true } },
      })
      expect(wrapper.text()).toContain('Integration URI')
    })

    it('hides URI input for MOCK type', () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, initialType: 'MOCK' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: false, FormSelect: true, LoadingSpinner: true } },
      })
      expect(wrapper.text()).not.toContain('Integration URI')
    })
  })

  describe('save emits', () => {
    it('emits all update events on save', async () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: defaultProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
      })
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
      await saveBtn?.trigger('click')
      expect(wrapper.emitted('update:type')).toBeTruthy()
      expect(wrapper.emitted('update:uri')).toBeTruthy()
      expect(wrapper.emitted('update:httpMethod')).toBeTruthy()
      expect(wrapper.emitted('save')).toBeTruthy()
    })
  })

  describe('open/close', () => {
    it('resets form when closing', async () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: defaultProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
      })
      // Close modal
      await wrapper.setProps({ open: false })
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })

    it('re-initializes form when reopening', async () => {
      const wrapper = mount(APIGatewaySetupIntegrationModal, {
        props: { ...defaultProps, open: false },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: true, FormSelect: true, LoadingSpinner: true } },
      })
      // Reopen
      await wrapper.setProps({ open: true })
      expect(wrapper.text()).toContain('Integration Type')
    })
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
