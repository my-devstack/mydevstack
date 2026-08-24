import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBPutItemModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
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
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading" :disabled="disabled" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
})

const baseProps = () => ({
  open: true,
  keySchema: [
    { AttributeName: 'pk', KeyType: 'HASH' },
    { AttributeName: 'sk', KeyType: 'RANGE' },
  ],
  loading: false,
  error: null,
  modelValue: '{"pk": {"S": "user1"}}',
})

describe('DynamoDBPutItemModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Add Item')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: { ...baseProps(), open: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Add Item')
  })

  it('shows error when present', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: { ...baseProps(), error: 'Invalid JSON' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Invalid JSON')
  })

  it('shows required keys from keySchema', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('pk, sk')
  })

  it('shows textarea with modelValue', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toContain('user1')
  })

  it('emits update:modelValue when textarea input changes', async () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const textarea = wrapper.find('textarea')
    await textarea.setValue('{"pk": {"S": "user2"}}')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['{"pk": {"S": "user2"}}'])
  })

  it('emits submit when add item clicked', async () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Item'))
    await addBtn!.trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('shows Adding... when loading', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Adding...')
  })

  it('disables add button when loading', () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Adding...'))
    expect(addBtn!.attributes('disabled')).toBeDefined()
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(DynamoDBPutItemModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
