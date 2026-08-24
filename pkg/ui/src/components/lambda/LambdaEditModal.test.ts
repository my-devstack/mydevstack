import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { LambdaEditModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const createStubs = () => ({
  Modal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'size'],
    emits: ['update:open', 'close'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading" :disabled="disabled" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
})

describe('LambdaEditModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', memory: 256, timeout: 60, loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Update Function Configuration')
    expect(wrapper.html()).toContain('test-function')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: false, functionName: '', loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Update Function Configuration')
  })

  it('initializes form from props', () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', memory: 512, timeout: 90, loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.vm.form.memory).toBe(512)
    expect(wrapper.vm.form.timeout).toBe(90)
  })

  it('uses defaults when props missing', () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.vm.form.memory).toBe(128)
    expect(wrapper.vm.form.timeout).toBe(30)
  })

  it('emits update-config with memory and timeout', async () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', memory: 256, timeout: 60, loading: false },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('1024')
    await inputs[1].setValue('120')
    const updateBtn = wrapper.findAll('button').find(b => b.text().includes('Update'))
    await updateBtn!.trigger('click')
    expect(wrapper.emitted('update-config')![0]).toEqual([1024, 120])
  })

  it('shows loading state when updating', () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Updating...')
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(LambdaEditModal, {
      props: { open: true, functionName: 'test-function', loading: false },
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
