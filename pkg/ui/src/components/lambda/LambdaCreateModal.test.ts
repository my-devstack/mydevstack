import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { LambdaCreateModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
  })),
}))

const createStubs = () => ({
  VpcSelector: {
    name: 'VpcSelector',
    template: '<div class="vpc-selector-stub" data-testid="vpc-selector"><slot /></div>',
    props: ['modelValue', 'resourceType', 'required', 'showSubnet', 'showSecurityGroup'],
    emits: ['update:modelValue'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="nodejs22.x">Node.js 22</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading" :disabled="disabled" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
})

describe('LambdaCreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Create Lambda Function')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: false, loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Create Lambda Function')
  })

  it('shows loading state when creating', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Creating...')
  })

  it('renders VPC Configuration collapsible section', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    expect(details.text()).toContain('VPC Configuration')
    expect(wrapper.find('.vpc-selector-stub').exists()).toBe(true)
  })

  it('emits create with form data when functionName set', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    wrapper.vm.form.functionName = 'my-fn'
    wrapper.vm.form.vpcSelection = { vpcId: 'vpc-1', subnetIds: ['subnet-1'], securityGroupIds: ['sg-1'] }
    wrapper.vm.handleCreate()
    const emitted = wrapper.emitted('create')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0].functionName).toBe('my-fn')
    expect(emitted![0][0].vpcSelection).toEqual({ vpcId: 'vpc-1', subnetIds: ['subnet-1'], securityGroupIds: ['sg-1'] })
  })

  it('does not emit create when functionName empty', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    wrapper.vm.form.functionName = '   '
    wrapper.vm.handleCreate()
    expect(wrapper.emitted('create')).toBeFalsy()
  })

  it('emits create with null vpcSelection when none selected', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    wrapper.vm.form.functionName = 'my-fn'
    wrapper.vm.form.vpcSelection = null
    wrapper.vm.handleCreate()
    expect(wrapper.emitted('create')![0][0].vpcSelection).toBeNull()
  })

  it('handleClose resets form and emits update:open false', () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    wrapper.vm.form.functionName = 'test-fn'
    wrapper.vm.form.runtime = 'python3.14'
    wrapper.vm.handleClose()
    expect(wrapper.vm.form.functionName).toBe('')
    expect(wrapper.vm.form.runtime).toBe('nodejs22.x')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('sets zipFile when file selected', async () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    const file = new File(['test'], 'test.zip', { type: 'application/zip' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file], writable: true })
    await input.trigger('change')
    expect(wrapper.vm.form.zipFile).toStrictEqual(file)
  })

  it('does not set zipFile when no file selected', async () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [], writable: true })
    await input.trigger('change')
    expect(wrapper.vm.form.zipFile).toBeNull()
  })

  it('closes when backdrop clicked', async () => {
    const wrapper = mount(LambdaCreateModal, {
      props: { open: true, loading: false },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.fixed.inset-0').trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
