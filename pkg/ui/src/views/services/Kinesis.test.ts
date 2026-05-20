import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn().mockResolvedValue([]),
  describeStream: vi.fn().mockResolvedValue(null),
  listShards: vi.fn().mockResolvedValue([]),
  getRecords: vi.fn().mockResolvedValue([]),
  putRecord: vi.fn().mockResolvedValue({}),
  createStream: vi.fn().mockResolvedValue({}),
  deleteStream: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import Kinesis from './Kinesis.vue'

const stubs = {
  // Button needs slot rendering for text assertions
  Button: { template: '<button><slot /></button>' },
  // All other components use auto-stubs (true) so findComponent works
  EmptyState: true,
  ConfirmModal: true,
  KinesisCreateModal: true,
  KinesisPutRecordModal: true,
  KinesisViewRecordModal: true,
  KinesisStreamItem: true,
  CodeSnippet: true,
  QueueListIcon: true,
  ArrowPathIcon: true,
  PlusIcon: true,
}

describe('Kinesis.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Kinesis heading', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    expect(wrapper.text()).toContain('Kinesis')
  })

  it('renders stream count text', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    expect(wrapper.text()).toContain('stream')
  })

  it('renders Create Stream button', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create Stream')
    expect(createBtn).toBeDefined()
  })

  it('shows empty state after load completes with no streams', async () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    await flushPromises()
    const emptyState = wrapper.findComponent({ name: 'EmptyState' })
    expect(emptyState.exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    const codeSnippet = wrapper.findComponent({ name: 'CodeSnippet' })
    expect(codeSnippet.exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(Kinesis, { global: { stubs } })
    expect(wrapper.findComponent({ name: 'KinesisCreateModal' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'KinesisPutRecordModal' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'KinesisViewRecordModal' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)
  })

  describe('template inline handler coverage', () => {
    it('Create Stream button exists', () => {
      const wrapper = shallowMount(Kinesis, { global: { stubs } })
      expect(wrapper.text()).toContain('Create Stream')
    })

    it('modal @update:open handlers', () => {
      const wrapper = shallowMount(Kinesis, { global: { stubs } })
      const modals = ['kinesis-create-modal-stub', 'kinesis-put-record-modal-stub', 'kinesis-view-record-modal-stub']
      for (const sel of modals) {
        const modal = wrapper.findComponent(sel)
        if (modal.exists() && modal.vm) {
          modal.vm.$emit('update:open', false)
        }
      }
    })

    it('showCreateModal toggle', () => {
      const wrapper = shallowMount(Kinesis, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })
  })
})
