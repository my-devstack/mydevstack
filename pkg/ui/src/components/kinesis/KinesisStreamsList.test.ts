import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisStreamsList from './KinesisStreamsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockStreams = [
  { StreamName: 'stream-1', StreamStatus: 'ACTIVE', StreamARN: 'arn:aws:kinesis:us-east-1:1:stream/stream-1' },
  { StreamName: 'stream-2', StreamStatus: 'DELETING', StreamARN: 'arn:aws:kinesis:us-east-1:1:stream/stream-2' },
]

const defaultProps = {
  streams: mockStreams,
  isLoading: false,
  columns: [
    { key: 'StreamName', label: 'Name', sortable: true },
    { key: 'StreamStatus', label: 'Status', sortable: true },
  ],
  selectedStream: null,
}

describe('KinesisStreamsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders', () => {
    const wrapper = mount(KinesisStreamsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, Button: true, StatusBadge: true, EmptyState: true } },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders data streams heading', () => {
    const wrapper = mount(KinesisStreamsList, {
      props: defaultProps,
      global: { stubs: { DataTable: true, Button: true, StatusBadge: true, EmptyState: true } },
    })
    expect(wrapper.text()).toContain('Data Streams')
  })

  it('emits select on row click', async () => {
    const wrapper = mount(KinesisStreamsList, {
      props: defaultProps,
      global: { stubs: { DataTable: false, Button: true, StatusBadge: true, EmptyState: true } },
    })
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    await dataTable.vm.$emit('row-click', mockStreams[0])
    expect(wrapper.emitted('select')?.[0]).toEqual([mockStreams[0]])
  })
})
