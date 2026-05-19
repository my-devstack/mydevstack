import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisRecordsList from './KinesisRecordsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockRecords = [
  {
    SequenceNumber: '123456',
    PartitionKey: 'pk-1',
    Data: 'eyJtZXNzYWdlIjogImhlbGxvIHdvcmxkIn0=',
  },
  {
    SequenceNumber: '789012',
    PartitionKey: 'pk-2',
    Data: 'eyJmb28iOiAiYmFyIn0=',
  },
]

const mockShard = {
  ShardId: 'shard-000001',
}

const defaultProps = {
  records: mockRecords,
  isLoading: false,
  columns: [
    { key: 'SequenceNumber', label: 'Sequence Number', sortable: true },
    { key: 'Data', label: 'Data', sortable: false },
  ],
  selectedShard: mockShard,
}

describe('KinesisRecordsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when selectedShard is provided', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, EmptyState: true, LoadingSpinner: true } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders nothing when selectedShard is null', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: { ...defaultProps, selectedShard: null },
      global: { stubs: { DataTable: true, EmptyState: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toBe('')
  })

  it('shows shard ID text', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, EmptyState: true, LoadingSpinner: true } },
    })
    expect(wrapper.text()).toContain('shard-000001')
  })

  it('shows loading spinner when isLoading', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: { ...defaultProps, isLoading: true },
      global: { stubs: { DataTable: true, EmptyState: true, LoadingSpinner: false } },
    })
    const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
    expect(spinner.exists()).toBe(true)
  })

  it('shows empty state when records is empty', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: { ...defaultProps, records: [] },
      global: { stubs: { DataTable: true, EmptyState: false, LoadingSpinner: true } },
    })
    const emptyState = wrapper.findComponent({ name: 'EmptyState' })
    expect(emptyState.exists()).toBe(true)
  })

  it('renders DataTable when records exist', () => {
    const wrapper = mount(KinesisRecordsList, {
      props: defaultProps,
      global: { stubs: { DataTable: false, EmptyState: true, LoadingSpinner: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.exists()).toBe(true)
  })

  it('emits view on row click', async () => {
    const wrapper = mount(KinesisRecordsList, {
      props: defaultProps,
      global: { stubs: { DataTable: false, EmptyState: true, LoadingSpinner: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    await dataTable.vm.$emit('row-click', mockRecords[0])
    expect(wrapper.emitted('view')?.[0]).toEqual([mockRecords[0]])
  })
})
