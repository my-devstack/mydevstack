import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayDeploymentsModal from './APIGatewayDeploymentsModal.vue'

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
const formInputStub = { template: '<div>{{label}}<input /></div>', props: ['modelValue', 'label'] }

const mockDeployments = [
  { id: 'dep-1', createdDate: '2024-01-15T10:00:00Z', description: 'Initial deploy' },
]
const mockStages = [
  { stageName: 'prod', deploymentId: 'dep-1', description: 'Production', status: 'ACTIVE' },
]

const defaultProps = {
  open: true,
  apiName: 'My API',
  apiId: 'api-123',
  deployments: mockDeployments,
  stages: mockStages,
  loadingDeployments: false,
  loadingStages: false,
  type: 'rest',
  loading: false,
}

describe('APIGatewayDeploymentsModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders deployments tab by default', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Create New Deployment')
  })

  it('shows deployment count', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Deployments (1)')
  })

  it('shows stage count', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Stages (1)')
  })

  it('renders deployment list', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('dep-1')
  })

  it('switches to stages tab on click', async () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    const stagesTab = wrapper.findAll('button').find(b => b.text().includes('Stages'))
    await stagesTab?.trigger('click')
    expect(wrapper.text()).toContain('Create New Stage')
  })

  it('shows loading spinner when loadingDeployments', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: { ...defaultProps, loadingDeployments: true, deployments: [] },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: false, EmptyState: true } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows empty state when no deployments', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: { ...defaultProps, deployments: [] },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: false } },
    })
    const emptyState = wrapper.findComponent({ name: 'EmptyState' })
    expect(emptyState.exists()).toBe(true)
  })

  it('renders close button in footer', () => {
    const wrapper = mount(APIGatewayDeploymentsModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, LoadingSpinner: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Close')
  })
})
