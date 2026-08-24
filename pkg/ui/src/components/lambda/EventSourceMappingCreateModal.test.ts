import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { EventSourceMappingCreateModal } from './index'

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
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['disabled', 'variant', 'loading'],
  },
  FormSelect: {
    template: `
      <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    `,
    props: ['modelValue', 'options', 'placeholder'],
    emits: ['update:modelValue'],
  },
  FormInput: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'type', 'min', 'max', 'placeholder'],
    emits: ['update:modelValue'],
  },
})

const baseProps = () => ({
  open: true,
  functions: [{ FunctionName: 'fn-1', FunctionArn: 'arn:aws:lambda:us-east-1:123:function:fn-1' }],
  eventSources: [{ arn: 'arn:aws:sqs:us-east-1:123:queue:q1', name: 'q1', type: 'SQS' }],
  loading: false,
})

describe('EventSourceMappingCreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Create Event Source Mapping')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: { ...baseProps(), open: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Create Event Source Mapping')
  })

  it('create button disabled when no function selected', () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    expect(createBtn!.attributes('disabled')).toBeDefined()
  })

  it('emits create with selected values', async () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const selects = wrapper.findAll('select')
    await selects[0].setValue('fn-1')
    await selects[1].setValue('arn:aws:sqs:us-east-1:123:queue:q1')
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
    expect(wrapper.emitted('create')![0]).toEqual([
      {
        functionName: 'fn-1',
        eventSourceArn: 'arn:aws:sqs:us-east-1:123:queue:q1',
        batchSize: 10,
        maxBatchingWindow: 0,
        parallelizationFactor: 1,
        onSuccessDestination: undefined,
        onFailureDestination: undefined,
      },
    ])
  })

  it('does not emit create when invalid', async () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')).toBeFalsy()
  })

  it('shows Creating... when loading', () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Creating...')
  })

  it('resets form when opened', async () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: { ...baseProps(), open: false },
      global: { stubs: createStubs() },
    })
    await wrapper.setProps({ open: true })
    const selects = wrapper.findAll('select')
    expect((selects[0].element as HTMLSelectElement).value).toBe('')
    expect((selects[1].element as HTMLSelectElement).value).toBe('')
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(EventSourceMappingCreateModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
