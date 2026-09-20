import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayViewStageModal from './APIGatewayViewStageModal.vue'

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

const mockStage = {
  stageName: 'prod',
  autoDeploy: true,
  description: 'Production stage',
  stageVariables: { ENV: 'prod' },
}

const defaultProps = {
  open: true,
  stage: mockStage,
  loading: false,
}

describe('APIGatewayViewStageModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayViewStageModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders stage data', () => {
    const wrapper = mount(APIGatewayViewStageModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('prod')
    expect(wrapper.text()).toContain('Yes')
    expect(wrapper.text()).toContain('Production stage')
    expect(wrapper.text()).toContain('ENV')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewayViewStageModal, {
      props: { ...defaultProps, loading: true, stage: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows fallback when no stage data', () => {
    const wrapper = mount(APIGatewayViewStageModal, {
      props: { ...defaultProps, stage: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('No stage data available')
  })

  it('emits update:open false on Close click', async () => {
    const wrapper = mount(APIGatewayViewStageModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, LoadingSpinner: true } },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn?.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})