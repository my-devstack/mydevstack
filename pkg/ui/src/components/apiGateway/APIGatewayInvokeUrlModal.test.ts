import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayInvokeUrlModal from './APIGatewayInvokeUrlModal.vue'

const mockSettings = vi.fn()
vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => mockSettings(),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot name="title" /><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant'],
}
const formSelectStub = {
  template: '<div><span>{{label}}</span><select><option v-for="o in options" :key="o.value" :value="o.value">{{o.label}}</option></select></div>',
  props: ['modelValue', 'label', 'options'],
}

const mockStages = [
  { stageName: 'prod' },
  { stageName: 'dev' },
]

const defaultProps = {
  open: true,
  api: { id: 'api-123', name: 'My API' },
  apiType: 'rest' as const,
  invokeUrl: 'https://api-123.execute-api.us-east-1.amazonaws.com/prod',
  loading: false,
  stages: mockStages,
}

describe('APIGatewayInvokeUrlModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSettings.mockReturnValue({ darkMode: false, emulator: 'floci', publicEndpoint: 'localhost:4566' })
    vi.clearAllMocks()
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
  })

  describe('copy operations', () => {
    it('does nothing when invokeUrl is empty', () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, invokeUrl: '' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      // copyUrl returns early when invokeUrl is empty
      expect(wrapper.vm.copyUrl()).toBeUndefined()
    })

    it('handles copy URL failure gracefully', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Permission denied'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: defaultProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      wrapper.vm.copyUrl()
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })

    it('does nothing when emulatorUrl is empty (no selectedStage)', () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, api: { id: '', name: 'No Id' } },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      expect(wrapper.vm.copyEmulatorUrl()).toBeUndefined()
    })

    it('handles copy emulator URL failure gracefully', async () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, open: false, stages: [] },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      // Open with stages to trigger the open watch and set selectedStage
      await wrapper.setProps({ open: true, stages: mockStages })
      await wrapper.vm.$nextTick()
      // Now emulatorUrl should be truthy, making copyEmulatorUrl proceed
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard error'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      wrapper.vm.copyEmulatorUrl()
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy emulator URL:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('emulator URL', () => {
    it('returns empty when no emulator URL for unknown emulator', () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, stages: [], invokeUrl: '' },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      // Initially selectedStage is empty, so emulatorUrl is false
      expect(wrapper.text()).not.toContain('Emulator URL')
    })
  })

  describe('open/close', () => {
    it('shows emulator URL when opening modal with stages', async () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, open: false, stages: [] },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      // Open with stages
      await wrapper.setProps({ open: true, stages: mockStages })
      await wrapper.vm.$nextTick()
      // Watch on open should set selectedStage, making emulatorUrl truthy
      expect(wrapper.text()).toContain('Emulator URL')
    })
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders stage select', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('Stage')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: { ...defaultProps, loading: true },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
  })

  it('shows invoke URL when provided', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('Invoke URL')
    expect(wrapper.text()).toContain('execute-api')
  })

  it('shows copy button for invoke URL', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('Copy')
  })

  it('shows emulator URL section', async () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: { ...defaultProps, stages: [] },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    // Set stages after mount to trigger the watch that sets selectedStage
    await wrapper.setProps({ stages: mockStages })
    expect(wrapper.text()).toContain('Emulator URL')
    expect(wrapper.text()).toContain('FLOCI')
  })

  it('shows no stages message when empty', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: { ...defaultProps, stages: [], invokeUrl: '' },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('No stages available')
  })

  it('shows no URL message when no invokeUrl', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: { ...defaultProps, invokeUrl: '' },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('No invoke URL available')
  })

  it('renders close button in footer', () => {
    const wrapper = mount(APIGatewayInvokeUrlModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
    })
    expect(wrapper.text()).toContain('Close')
  })

  describe('WebSocket emulator URL', () => {
    it('shows WebSocket emulator URL for FLOCI', async () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: {
          ...defaultProps,
          stages: [],
          api: { id: 'ws-api', name: 'WS API', protocolType: 'WEBSOCKET' },
        },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      await wrapper.setProps({ stages: mockStages })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('ws://localhost:4566/ws/ws-api/prod')
    })

    it('shows WebSocket emulator URL for MINISTACK', async () => {
      mockSettings.mockReturnValue({ darkMode: false, emulator: 'ministack', publicEndpoint: 'localhost:4566' })
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: {
          ...defaultProps,
          stages: [],
          api: { id: 'ws-api', name: 'WS API', protocolType: 'WEBSOCKET' },
        },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      await wrapper.setProps({ stages: mockStages })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('ws://localhost:4566/_aws/execute-api/ws-api/prod')
    })

    it('shows HTTP emulator URL by default', async () => {
      const wrapper = mount(APIGatewayInvokeUrlModal, {
        props: { ...defaultProps, stages: [] },
        global: { stubs: { Modal: modalStub, Button: buttonStub, FormSelect: formSelectStub } },
      })
      await wrapper.setProps({ stages: mockStages })
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('http://localhost:4566/restapis/')
    })
  })
})
