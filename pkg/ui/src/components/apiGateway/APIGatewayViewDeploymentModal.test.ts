import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayViewDeploymentModal from './APIGatewayViewDeploymentModal.vue'

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

const mockDeployment = {
  id: 'dep-123',
  createdDate: '2024-01-15T10:00:00Z',
  description: 'Initial deployment',
}

const defaultProps = {
  open: true,
  deployment: mockDeployment,
  loading: false,
}

describe('APIGatewayViewDeploymentModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders deployment data', () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('dep-123')
    expect(wrapper.text()).toContain('Initial deployment')
    expect(wrapper.text()).toContain('2024')
  })

  it('supports deploymentId key', () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: { ...defaultProps, deployment: { deploymentId: 'dep-456', description: 'Second' } },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('dep-456')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: { ...defaultProps, loading: true, deployment: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows fallback when no deployment data', () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: { ...defaultProps, deployment: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('No deployment data available')
  })

  it('emits update:open false on Close click', async () => {
    const wrapper = mount(APIGatewayViewDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn?.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})