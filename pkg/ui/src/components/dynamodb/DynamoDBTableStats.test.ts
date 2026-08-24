import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBTableStats } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/composables/useDynamoDB', () => ({
  useDynamoDB: vi.fn(() => ({
    getKeyTypeLabel: (t: string) => ({ S: 'String', N: 'Number', B: 'Binary' }[t] || t),
    getBillingModeLabel: (m: string) => ({ PAY_PER_REQUEST: 'On-Demand', PROVISIONED: 'Provisioned' }[m] || m),
  })),
}))

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

describe('DynamoDBTableStats', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders nothing when details null and not loading', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details: null, loading: false },
    })
    expect(wrapper.text()).toBe('')
  })

  it('shows loading when details null and loading true', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details: null, loading: true },
    })
    expect(wrapper.html()).toContain('Loading table details...')
  })

  it('shows table status', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('ACTIVE')
  })

  it('shows billing mode label', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('On-Demand')
  })

  it('shows key schema with partition and sort key labels', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('Partition Key')
    expect(wrapper.html()).toContain('Sort Key')
    expect(wrapper.html()).toContain('pk')
    expect(wrapper.html()).toContain('sk')
  })

  it('shows attribute definitions', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('pk (S)')
    expect(wrapper.html()).toContain('sk (N)')
  })

  it('shows provisioned throughput', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('Read Capacity')
    expect(wrapper.html()).toContain('Write Capacity')
  })

  it('shows item count and size', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('100')
    expect(wrapper.html()).toContain('2.00 KB')
  })

  it('shows stream badge when streams enabled', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    expect(wrapper.html()).toContain('Stream')
  })

  it('emits viewStreams when stream badge clicked', async () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: { tableName: 'my-table', details, loading: false },
    })
    const streamBadge = wrapper.findAll('span').find(s => s.text().includes('Stream'))
    await streamBadge!.trigger('click')
    expect(wrapper.emitted('viewStreams')).toBeTruthy()
    expect(wrapper.emitted('viewStreams')![0]).toEqual(['my-table'])
  })

  it('does not show stream badge when streams disabled', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: {
        tableName: 'my-table',
        details: { ...details, StreamSpecification: { StreamEnabled: false } },
        loading: false,
      },
    })
    expect(wrapper.html()).not.toContain('>Stream<')
  })

  it('shows default billing mode when missing', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: {
        tableName: 'my-table',
        details: { ...details, BillingModeSummary: undefined },
        loading: false,
      },
    })
    expect(wrapper.html()).toContain('Provisioned')
  })

  it('shows 0 KB when TableSizeBytes missing', () => {
    const wrapper = mount(DynamoDBTableStats, {
      props: {
        tableName: 'my-table',
        details: { ...details, TableSizeBytes: undefined },
        loading: false,
      },
    })
    expect(wrapper.html()).toContain('0 KB')
  })
})
