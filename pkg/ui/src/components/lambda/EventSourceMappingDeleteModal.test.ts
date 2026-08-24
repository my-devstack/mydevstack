import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { EventSourceMappingDeleteModal } from './index'

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
    props: ['disabled', 'variant'],
  },
})

const mapping = {
  UUID: 'uuid-1',
  FunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-func',
  EventSourceArn: 'arn:aws:sqs:us-east-1:123:queue:my-queue',
}

describe('EventSourceMappingDeleteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Delete Event Source Mapping')
    expect(wrapper.html()).toContain('Delete Event Source Mapping?')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: false, mapping },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Delete Event Source Mapping')
  })

  it('shows function name from mapping', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('my-func')
  })

  it('shows warning that action cannot be undone', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('cannot be undone')
  })

  it('emits delete when delete button clicked', async () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('shows Deleting... when loading', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping, loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Deleting...')
  })

  it('disables delete button when loading', () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping, loading: true },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Deleting...'))
    expect(deleteBtn!.attributes('disabled')).toBeDefined()
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(EventSourceMappingDeleteModal, {
      props: { open: true, mapping },
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
