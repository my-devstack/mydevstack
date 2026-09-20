import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayViewIntegrationModal from './APIGatewayViewIntegrationModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot name="title" /><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant', 'size', 'loading'],
}

const mockIntegration = {
  integrationId: 'int-123',
  integrationType: 'AWS_PROXY',
  integrationUri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/my-fn/invocations',
  integrationMethod: 'POST',
  payloadFormatVersion: '2.0',
  timeoutInMillis: 29000,
  connectionType: 'INTERNET',
  connectionId: '',
  credentialsArn: '',
  description: 'Lambda integration',
}

const defaultProps = {
  open: true,
  integration: mockIntegration,
  loading: false,
}

describe('APIGatewayViewIntegrationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayViewIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders integration data', () => {
    const wrapper = mount(APIGatewayViewIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('int-123')
    expect(wrapper.text()).toContain('AWS_PROXY')
    expect(wrapper.text()).toContain('my-fn/invocations')
    expect(wrapper.text()).toContain('POST')
    expect(wrapper.text()).toContain('2.0')
    expect(wrapper.text()).toContain('29000')
    expect(wrapper.text()).toContain('Lambda integration')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewayViewIntegrationModal, {
      props: { ...defaultProps, loading: true, integration: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows fallback when no integration data', () => {
    const wrapper = mount(APIGatewayViewIntegrationModal, {
      props: { ...defaultProps, integration: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('No integration data available')
  })

  it('emits update:open false on Close click', async () => {
    const wrapper = mount(APIGatewayViewIntegrationModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn?.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})