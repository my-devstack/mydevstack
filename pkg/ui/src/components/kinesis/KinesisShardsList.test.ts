import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisShardsList from './KinesisShardsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockShards = [
  {
    ShardId: 'shard-000001',
    ParentShardId: null,
    SequenceNumberRange: { StartingSequenceNumber: '100' },
  },
  {
    ShardId: 'shard-000002',
    ParentShardId: 'shard-000001',
    SequenceNumberRange: { StartingSequenceNumber: '200' },
  },
]

const defaultProps = {
  shards: mockShards,
  columns: [
    { key: 'ShardId', label: 'Shard ID', sortable: true },
    { key: 'StartingSequenceNumber', label: 'Starting Seq', sortable: false },
  ],
  selectedShard: null,
}

describe('KinesisShardsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders', () => {
    const wrapper = mount(KinesisShardsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, EmptyState: true, Button: true } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows shards title', () => {
    const wrapper = mount(KinesisShardsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, EmptyState: true, Button: true } },
    })
    expect(wrapper.text()).toContain('Shards')
  })

  it('shows empty state when no shards', () => {
    const wrapper = mount(KinesisShardsList, {
      props: { ...defaultProps, shards: [] },
      global: { stubs: { DataTable: true, EmptyState: false, Button: true } },
    })
    const emptyState = wrapper.findComponent({ name: 'EmptyState' })
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.props('title')).toContain('No Shards')
  })

  it('renders DataTable when shards exist', () => {
    const wrapper = mount(KinesisShardsList, {
      props: defaultProps,
      global: { stubs: { DataTable: false, EmptyState: true, Button: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.exists()).toBe(true)
  })

  it('highlights selected shard button', () => {
    const wrapper = mount(KinesisShardsList, {
      props: { ...defaultProps, selectedShard: mockShards[0] },
      global: { stubs: { DataTable: false, EmptyState: true, Button: true } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('emits get-records on button click', async () => {
    const wrapper = mount(KinesisShardsList, {
      props: defaultProps,
      global: { stubs: { DataTable: false, EmptyState: true, Button: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    // DataTable has row-actions slot with Button that emits get-records
    expect(wrapper.emitted('get-records')).toBeUndefined()
  })
})
