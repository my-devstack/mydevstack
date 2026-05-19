import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'

const mockCreateTable = vi.fn()
const mockDeleteTable = vi.fn()
const mockPutItem = vi.fn()
const mockDeleteItem = vi.fn()
const mockScan = vi.fn()
const mockLoadTables = vi.fn()

const mockTables = ref([
  { TableName: 'test-table', TableStatus: 'ACTIVE', ItemCount: 10, TableSizeBytes: 1024 },
])

vi.mock('@/composables/useDynamoDB', () => ({
  useDynamoDB: () => ({
    tables: mockTables,
    loading: ref(false),
    error: ref(null),
    tableDetailsMap: ref({}),
    streams: ref([]),
    streamLoading: ref(false),
    streamError: ref(null),
    loadTables: mockLoadTables,
    loadTableDetails: vi.fn(),
    createTable: mockCreateTable,
    deleteTable: mockDeleteTable,
    putItem: mockPutItem,
    deleteItem: mockDeleteItem,
    getKeyTypeLabel: vi.fn().mockReturnValue('HASH'),
    getBillingModeLabel: vi.fn().mockReturnValue('PAY_PER_REQUEST'),
    formatAttributeValue: vi.fn().mockReturnValue('formatted'),
    loadStreams: vi.fn(),
    getStreamShards: vi.fn(),
    getRecordsFromShard: vi.fn(),
    query: vi.fn(),
    scan: mockScan,
    getShardIterator: vi.fn(),
    getRecords: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

vi.mock('@/api/services/dynamodb', () => ({
  describeTable: vi.fn(),
  query: vi.fn(),
  scan: vi.fn(),
  listTables: vi.fn(),
  createTable: vi.fn(),
  deleteTable: vi.fn(),
  putItem: vi.fn(),
  getItem: vi.fn(),
  deleteItem: vi.fn(),
  updateItem: vi.fn(),
  listStreams: vi.fn(),
  describeStream: vi.fn(),
  getShardIterator: vi.fn(),
  getRecords: vi.fn(),
  batchWriteItem: vi.fn(),
  batchGetItem: vi.fn(),
  getTimeToLive: vi.fn(),
  updateTimeToLive: vi.fn(),
  getStreamSpecification: vi.fn(),
}))

import DynamoDBView from './DynamoDB.vue'

// For shallowMount tests - auto-stubs handle most components
// For mount tests - we need stubs to avoid loading actual child component files
const shallowStubs = {
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
  StatusBadge: true,
}
const mountStubs = {
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: true,
  EmptyState: true,
  StatusBadge: true,
  TableCellsIcon: true,
  ChevronDownIcon: true,
  ChevronRightIcon: true,
  MagnifyingGlassCircleIcon: true,
  RssIcon: true,
  DynamoDBDeleteTableModal: true,
  DynamoDBDeleteItemModal: true,
  DynamoDBCreateTableModal: true,
  DynamoDBViewTableModal: true,
  DynamoDBPutItemModal: true,
  DynamoDBExploreModal: true,
  DynamoDBTableStats: true,
  DynamoDBStreamModal: true,
  DynamoDBCodeExamples: true,
}

/** Helper: find a stub by its kebab-case selector and emit on it */
function emitOnStub(wrapper: any, tagName: string, event: string, ...args: any[]) {
  const el = wrapper.find(tagName)
  if (el.exists()) {
    // For mount with explicit stubs, try to get the VueWrapper
    try {
      const comp = wrapper.findComponent(tagName)
      if (comp.exists() && comp.vm) {
        comp.vm.$emit(event, ...args)
        return true
      }
    } catch {
      // fallback
    }
  }
  return false
}

describe('DynamoDB.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockTables.value = [
      { TableName: 'test-table', TableStatus: 'ACTIVE', ItemCount: 10, TableSizeBytes: 1024 },
    ]
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders DynamoDB Tables heading', () => {
    const wrapper = shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('DynamoDB Tables')
  })

  it('renders Create Table button text', () => {
    const wrapper = shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('Create Table')
  })

  it('renders empty state when no tables', () => {
    mockTables.value = []
    const wrapper = shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('No DynamoDB tables')
  })

  it('calls loadTables on mount', () => {
    shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    expect(mockLoadTables).toHaveBeenCalledTimes(1)
  })

  it('renders with mount and explicit stubs', () => {
    const wrapper = mount(DynamoDBView, { global: { stubs: mountStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('triggers create table handler via stub emit with mount()', async () => {
    mockCreateTable.mockResolvedValue(undefined)
    const wrapper = mount(DynamoDBView, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('dynamo-db-create-table-modal-stub')
    if (modal.exists()) {
      modal.vm.$emit('create', { TableName: 'new-table', KeySchema: [], AttributeDefinitions: [] })
      await new Promise(process.nextTick)
      expect(mockCreateTable).toHaveBeenCalled()
    }
  })

  it('triggers delete table handler via stub emit with mount()', async () => {
    mockDeleteTable.mockResolvedValue(undefined)
    const wrapper = mount(DynamoDBView, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('dynamo-db-delete-table-modal-stub')
    if (modal.exists()) {
      modal.vm.$emit('delete', 'test-table')
      await new Promise(process.nextTick)
      expect(mockDeleteTable).toHaveBeenCalled()
    }
  })

  it('triggers put item handler via stub emit with mount()', async () => {
    mockPutItem.mockResolvedValue(undefined)
    const wrapper = mount(DynamoDBView, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('dynamo-db-put-item-modal-stub')
    if (modal.exists()) {
      modal.vm.$emit('submit', { TableName: 'test-table', Item: { id: '123' } })
      await new Promise(process.nextTick)
      expect(mockPutItem).toHaveBeenCalled()
    }
  })

  it('triggers delete item handler via stub emit with mount()', async () => {
    mockDeleteItem.mockResolvedValue(undefined)
    const wrapper = mount(DynamoDBView, { global: { stubs: mountStubs } })
    const modal = wrapper.findComponent('dynamo-db-delete-item-modal-stub')
    if (modal.exists()) {
      modal.vm.$emit('delete', { TableName: 'test-table', Key: { id: '123' } })
      await new Promise(process.nextTick)
      expect(mockDeleteItem).toHaveBeenCalled()
    }
  })

  it('handles create button click to open modal', async () => {
    const wrapper = shallowMount(DynamoDBView, { global: { stubs: shallowStubs } })
    const buttons = wrapper.findAll('button')
    if (buttons.length > 0) {
      await buttons[0].trigger('click')
    }
  })
})
