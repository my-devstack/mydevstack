import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayViewRouteModal from './APIGatewayViewRouteModal.vue'

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

const mockRoute = {
  routeKey: 'GET /pets',
  target: 'integrations/int-123',
  authorizationType: 'JWT',
  authorizerId: 'auth-1',
}

const defaultProps = {
  open: true,
  route: mockRoute,
  loading: false,
}

describe('APIGatewayViewRouteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayViewRouteModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders route data', () => {
    const wrapper = mount(APIGatewayViewRouteModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('GET /pets')
    expect(wrapper.text()).toContain('integrations/int-123')
    expect(wrapper.text()).toContain('JWT')
    expect(wrapper.text()).toContain('auth-1')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewayViewRouteModal, {
      props: { ...defaultProps, loading: true, route: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows fallback when no route data', () => {
    const wrapper = mount(APIGatewayViewRouteModal, {
      props: { ...defaultProps, route: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('No route data available')
  })

  it('emits update:open false on Close click', async () => {
    const wrapper = mount(APIGatewayViewRouteModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn?.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})