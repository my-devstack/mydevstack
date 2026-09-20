import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayEditDeploymentModal from './APIGatewayEditDeploymentModal.vue'

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
const formInputStub = { template: '<div>{{label}}<input :value="modelValue" /></div>', props: ['modelValue', 'label'] }

const mockDeployment = {
  id: 'dep-123',
  description: 'Initial deployment',
}

const defaultProps = {
  open: true,
  deployment: mockDeployment,
  loading: false,
}

describe('APIGatewayEditDeploymentModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('renders deployment id', () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    expect(wrapper.text()).toContain('dep-123')
  })

  it('pre-fills description from deployment', async () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: { ...defaultProps, open: false },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    await wrapper.setProps({ open: true })
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('Initial deployment')
  })

  it('pre-fills description when mounted with open=true (v-if pattern)', () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('Initial deployment')
  })

  it('emits update with description on Save click', async () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: { ...defaultProps, open: false },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    await wrapper.setProps({ open: true })
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
    await saveBtn?.trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')![0]).toEqual(['Initial deployment'])
  })

  it('emits update:open false on Cancel click', async () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('shows Saving text when loading', () => {
    const wrapper = mount(APIGatewayEditDeploymentModal, {
      props: { ...defaultProps, loading: true },
      global: { stubs: { Modal: modalStub, Button: buttonStub, FormInput: formInputStub } },
    })
    expect(wrapper.text()).toContain('Saving...')
  })
})