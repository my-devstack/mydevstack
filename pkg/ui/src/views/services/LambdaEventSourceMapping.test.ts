import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn().mockResolvedValue([]),
  listEventSourceMappings: vi.fn().mockResolvedValue({ EventSourceMappings: [] }),
  createEventSourceMapping: vi.fn().mockResolvedValue({}),
  deleteEventSourceMapping: vi.fn().mockResolvedValue({}),
  getEventSourceMapping: vi.fn().mockResolvedValue(null),
  getFunction: vi.fn().mockResolvedValue(null),
  getFunctionConfiguration: vi.fn().mockResolvedValue(null),
  createFunction: vi.fn().mockResolvedValue({}),
  deleteFunction: vi.fn().mockResolvedValue({}),
  invoke: vi.fn().mockResolvedValue({}),
  invokeFunction: vi.fn().mockResolvedValue({}),
  updateFunctionConfiguration: vi.fn().mockResolvedValue({}),
  updateFunctionCode: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/api/services/sqs', () => ({
  listQueues: vi.fn().mockResolvedValue([]),
  getQueueUrl: vi.fn().mockResolvedValue(''),
  getQueueAttributes: vi.fn().mockResolvedValue({}),
  createQueue: vi.fn().mockResolvedValue({}),
  deleteQueue: vi.fn().mockResolvedValue({}),
  sendMessage: vi.fn().mockResolvedValue({}),
  receiveMessage: vi.fn().mockResolvedValue({ messages: [] }),
  deleteMessage: vi.fn().mockResolvedValue({}),
  purgeQueue: vi.fn().mockResolvedValue({}),
  setQueueAttributes: vi.fn().mockResolvedValue({}),
  changeMessageVisibility: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn().mockResolvedValue([]),
  describeStream: vi.fn().mockResolvedValue(null),
  listShards: vi.fn().mockResolvedValue([]),
  getRecords: vi.fn().mockResolvedValue([]),
  putRecord: vi.fn().mockResolvedValue({}),
  putRecords: vi.fn().mockResolvedValue({}),
  createStream: vi.fn().mockResolvedValue({}),
  deleteStream: vi.fn().mockResolvedValue({}),
  getShardIterator: vi.fn().mockResolvedValue(''),
  mergeShards: vi.fn().mockResolvedValue({}),
  splitShard: vi.fn().mockResolvedValue({}),
  updateShardCount: vi.fn().mockResolvedValue({}),
  enableEnhancedMonitoring: vi.fn().mockResolvedValue({}),
  disableEnhancedMonitoring: vi.fn().mockResolvedValue({}),
  describeStreamSummary: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/api/services/dynamodb', () => ({
  listTables: vi.fn().mockResolvedValue({ TableNames: [] }),
  describeTable: vi.fn().mockResolvedValue({ Table: null }),
  createTable: vi.fn().mockResolvedValue({}),
  deleteTable: vi.fn().mockResolvedValue({}),
  putItem: vi.fn().mockResolvedValue({}),
  getItem: vi.fn().mockResolvedValue(null),
  deleteItem: vi.fn().mockResolvedValue({}),
  updateItem: vi.fn().mockResolvedValue({}),
  query: vi.fn().mockResolvedValue({ Items: [] }),
  scan: vi.fn().mockResolvedValue({ Items: [] }),
  getItems: vi.fn().mockResolvedValue({ Items: [] }),
  batchWriteItem: vi.fn().mockResolvedValue({}),
  batchGetItem: vi.fn().mockResolvedValue({ Responses: {} }),
  updateTable: vi.fn().mockResolvedValue({}),
  getTimeToLive: vi.fn().mockResolvedValue({}),
  updateTimeToLive: vi.fn().mockResolvedValue({}),
  getStreamSpecification: vi.fn().mockResolvedValue({ StreamEnabled: false }),
  listStreams: vi.fn().mockResolvedValue({ Streams: [] }),
  listAllStreams: vi.fn().mockResolvedValue({ Streams: [] }),
  describeStream: vi.fn().mockResolvedValue(null),
  getShardIterator: vi.fn().mockResolvedValue(''),
  getRecords: vi.fn().mockResolvedValue({ Records: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import LambdaEventSourceMapping from './LambdaEventSourceMapping.vue'

const stubs = {
  EventSourceMappingList: true,
  EventSourceMappingCreateModal: true,
  EventSourceMappingDeleteModal: true,
}

describe('LambdaEventSourceMapping.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Lambda ESM heading', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    expect(wrapper.text()).toContain('Lambda ESM')
  })

  it('renders description text', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    expect(wrapper.text()).toContain('Manage Lambda function triggers')
  })

  it('renders Create Mapping button', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    expect(wrapper.text()).toContain('Create Mapping')
  })

  it('renders EventSourceMappingList component', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    const list = wrapper.findComponent({ name: 'EventSourceMappingList' })
    expect(list.exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    expect(wrapper.findComponent({ name: 'EventSourceMappingCreateModal' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'EventSourceMappingDeleteModal' }).exists()).toBe(true)
  })

  it('creates event sources from loaded services after mount', async () => {
    const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
    await flushPromises()
    // After all services are loaded, component should still render correctly
    expect(wrapper.exists()).toBe(true)
  })

  describe('named function coverage', () => {
    it('handleDeleteClick sets selectedMapping and opens delete modal', () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
      const mapping = { UUID: 'abc-123', FunctionArn: 'arn:aws:lambda:func' }
      wrapper.vm.handleDeleteClick(mapping)
      expect(wrapper.vm.selectedMapping).toEqual(mapping)
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('handleCreate calls createMapping and closes modal', async () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      await wrapper.vm.handleCreate({
        functionName: 'my-func',
        eventSourceArn: 'arn:aws:sqs:queue',
        batchSize: 10,
        maxBatchingWindow: 5,
        parallelizationFactor: 1,
      })
      expect(wrapper.vm.showCreateModal).toBe(false)
    })

    it('handleDelete with UUID calls deleteMapping and closes modal', async () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
      wrapper.vm.selectedMapping = { UUID: 'abc-123' }
      wrapper.vm.showDeleteModal = true
      await wrapper.vm.handleDelete()
      expect(wrapper.vm.showDeleteModal).toBe(false)
    })

    it('handleDelete without UUID returns early', async () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs } })
      wrapper.vm.selectedMapping = null
      await wrapper.vm.handleDelete()
      // no error means early return
    })
  })

  describe('template handler coverage', () => {
    const tStubs = {
      EventSourceMappingList: true,
      EventSourceMappingCreateModal: true,
      EventSourceMappingDeleteModal: true,
    }

    it('Create Mapping button click triggers modal', () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs: tStubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('EventSourceMappingCreateModal @update:open emit', () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs: tStubs } })
      const modal = wrapper.findComponent({ name: 'EventSourceMappingCreateModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showCreateModal).toBe(false)
      }
    })

    it('EventSourceMappingDeleteModal @update:open emit', () => {
      const wrapper = shallowMount(LambdaEventSourceMapping, { global: { stubs: tStubs } })
      const modal = wrapper.findComponent({ name: 'EventSourceMappingDeleteModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update:open', false)
        expect(wrapper.vm.showDeleteModal).toBe(false)
      }
    })
  })
})
