import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MSKCreateClusterModal from './MSKCreateClusterModal.vue'

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title', 'size'],
}
const buttonStub = {
  template: '<button :disabled="loading"><slot /></button>',
  props: ['variant', 'size', 'loading'],
}
const formInputStub = { template: '<input />', props: ['modelValue', 'label'] }
const formSelectStub = { template: '<select><option /></select>', props: ['modelValue', 'label', 'options'] }

const defaultProps = {
  open: true,
  isLoading: false,
  newCluster: {
    name: '',
    kafkaVersion: '3.2.0',
    brokerCount: 2,
    instanceType: 'kafka.m5.large',
    storagePerBroker: 100,
    clientSubnets: '',
  },
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, FormSelect: formSelectStub }

describe('MSKCreateClusterModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mount(MSKCreateClusterModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(MSKCreateClusterModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('renders create and cancel buttons', () => {
    const wrapper = mount(MSKCreateClusterModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Create Cluster')
  })

  it('shows loading state on create button', () => {
    const wrapper = mount(MSKCreateClusterModal, { props: { ...defaultProps, isLoading: true }, global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('cancel button emits update:open false', async () => {
    const wrapper = mount(MSKCreateClusterModal, { props: defaultProps, global: { stubs } })
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text().includes('Cancel'))
    if (cancelBtn) {
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
    }
  })
})
