import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { LambdaInvokeModal } from './index'

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
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="RequestResponse">Synchronous</option><option value="Event">Asynchronous</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
})

describe('LambdaInvokeModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Invoke: test-function')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: false, functionName: '', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Invoke:')
  })

  it('emits invoke with payload and invocation type', async () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    const input = wrapper.find('input')
    await input.setValue('{"key": "value"}')
    const select = wrapper.find('select')
    await select.setValue('Event')
    const invokeBtn = wrapper.findAll('button').find(b => b.text().includes('Invoke'))
    await invokeBtn!.trigger('click')
    expect(wrapper.emitted('invoke')![0]).toEqual(['{"key": "value"}', 'Event'])
  })

  it('emits invoke with default payload and type', async () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    const invokeBtn = wrapper.findAll('button').find(b => b.text().includes('Invoke'))
    await invokeBtn!.trigger('click')
    expect(wrapper.emitted('invoke')![0]).toEqual(['{}', 'RequestResponse'])
  })

  it('shows result when provided', () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '{"statusCode": 200}' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Result:')
    expect(wrapper.html()).toContain('statusCode')
  })

  it('does not show result when empty', () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Result:')
  })

  it('shows loading state when invoking', () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: true, result: '' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Invoking...')
  })

  it('handleClose resets payload and emits update:open false', async () => {
    const wrapper = mount(LambdaInvokeModal, {
      props: { open: true, functionName: 'test-function', loading: false, result: '' },
      global: { stubs: createStubs() },
    })
    const input = wrapper.find('input')
    await input.setValue('{"x": 1}')
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.vm.payload).toBe('{}')
    expect(wrapper.vm.invocationType).toBe('RequestResponse')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
