import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBViewTableModal } from './index'

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
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['disabled', 'size'],
  },
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
})

const baseProps = () => ({
  open: true,
  tableName: 'my-table',
  tableDetails: null,
  loading: false,
  error: null,
})

const details = {
  TableStatus: 'ACTIVE',
  BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
  KeySchema: [
    { AttributeName: 'pk', KeyType: 'HASH' },
    { AttributeName: 'sk', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'pk', AttributeType: 'S' },
    { AttributeName: 'sk', AttributeType: 'N' },
  ],
  ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  ItemCount: 100,
  TableSizeBytes: 2048,
  StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
}

describe('DynamoDBViewTableModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title with table name', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('my-table')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.html()).toContain('Loading table details...')
  })

  it('shows error when present', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), error: 'Describe failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Describe failed')
  })

  it('shows table status badge when ACTIVE', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('ACTIVE')
  })

  it('shows billing mode label', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('On-Demand')
  })

  it('shows key schema with key types', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('HASH')
    expect(wrapper.html()).toContain('RANGE')
    expect(wrapper.html()).toContain('pk')
    expect(wrapper.html()).toContain('sk')
  })

  it('shows attribute definitions with type labels', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('String')
    expect(wrapper.html()).toContain('Number')
  })

  it('shows provisioned throughput', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Read Capacity')
    expect(wrapper.html()).toContain('Write Capacity')
  })

  it('shows item count and table size', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('100')
    expect(wrapper.html()).toContain('2.00 KB')
  })

  it('shows streams enabled section and view streams button', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('DynamoDB Streams Enabled')
    expect(wrapper.html()).toContain('NEW AND OLD IMAGES')
    const btn = wrapper.findAll('button').find(b => b.text().includes('View Streams'))
    expect(btn).toBeTruthy()
  })

  it('emits viewStreams with table name when view streams clicked', async () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: { ...baseProps(), tableDetails: details },
      global: { stubs: createStubs() },
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('View Streams'))
    await btn!.trigger('click')
    expect(wrapper.emitted('viewStreams')).toBeTruthy()
    expect(wrapper.emitted('viewStreams')![0]).toEqual(['my-table'])
  })

  it('shows streams not enabled when StreamEnabled false', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: {
        ...baseProps(),
        tableDetails: { ...details, StreamSpecification: { StreamEnabled: false } },
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Not enabled for this table')
  })

  it('shows default billing mode label when missing', () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: {
        ...baseProps(),
        tableDetails: { ...details, BillingModeSummary: undefined },
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Provisioned')
  })

  it('emits update:open false when close clicked', async () => {
    const wrapper = mount(DynamoDBViewTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
