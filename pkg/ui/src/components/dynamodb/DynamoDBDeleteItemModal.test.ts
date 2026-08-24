import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBDeleteItemModal } from './index'

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
    name: 'Modal',
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

describe('DynamoDBDeleteItemModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Delete Item')
    expect(wrapper.html()).toContain('Delete this item?')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Delete Item')
  })

  it('shows warning that action cannot be undone', () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('cannot be undone')
  })

  it('emits delete when delete button clicked', async () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete Item'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('emits update:open false when modal close triggered', async () => {
    const wrapper = mount(DynamoDBDeleteItemModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    const modal = wrapper.findComponent({ name: 'Modal' })
    expect(modal.exists()).toBe(true)
    // Simulate the Modal emitting update:open (e.g. clicking backdrop)
    modal.vm.$emit('update:open', false)
    await nextTick()
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
