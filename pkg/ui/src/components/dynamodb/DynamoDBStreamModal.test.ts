import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBStreamModal } from './index'

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
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
})

const baseProps = () => ({
  open: true,
  tableName: 'my-table',
  streams: [],
  shards: [],
  loading: false,
  error: null,
  records: [],
  selectedStream: null,
  loadingRecords: false,
  streamError: null,
  hasMore: false,
})

const stream = { StreamArn: 'arn:aws:dynamodb:us-east-1:123:table/my-table/stream/1', StreamStatus: 'ENABLED', StreamViewType: 'NEW_AND_OLD_IMAGES', StreamLabel: 'label-1' }

describe('DynamoDBStreamModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title with table name', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('DynamoDB Streams: my-table')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error when error present and no streams', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: { ...baseProps(), error: 'Stream fetch failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Stream fetch failed')
  })

  it('shows no streams message when streams empty', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('No streams available for this table')
  })

  it('shows stream details when streams present', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: { ...baseProps(), streams: [stream] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('arn:aws:dynamodb:us-east-1:123:table/my-table/stream/1')
    expect(wrapper.html()).toContain('ENABLED')
    expect(wrapper.html()).toContain('NEW AND OLD IMAGES')
  })

  it('shows shards when present', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        shards: [{ ShardId: 'shard-1' }],
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Shards (1)')
    expect(wrapper.html()).toContain('shard-1')
  })

  it('shows view stream events button when streams present and no selection', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: { ...baseProps(), streams: [stream] },
      global: { stubs: createStubs() },
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('View Stream Events'))
    expect(btn).toBeTruthy()
  })

  it('emits selectStream when view stream events clicked', async () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: { ...baseProps(), streams: [stream] },
      global: { stubs: createStubs() },
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('View Stream Events'))
    await btn!.trigger('click')
    expect(wrapper.emitted('selectStream')).toBeTruthy()
    expect(wrapper.emitted('selectStream')![0]).toEqual([stream])
  })

  it('shows records when selectedStream present', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [{ eventName: 'INSERT', dynamodb: { ApproximateCreationDateTime: 1700000000 } }],
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Stream Records')
    expect(wrapper.html()).toContain('INSERT')
  })

  it('shows no records message when selectedStream and no records', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [],
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('No records in stream yet')
  })

  it('shows load more button when hasMore', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [{ eventName: 'INSERT' }],
        hasMore: true,
      },
      global: { stubs: createStubs() },
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Load More'))
    expect(btn).toBeTruthy()
  })

  it('emits loadRecords when load more clicked', async () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [{ eventName: 'INSERT' }],
        hasMore: true,
      },
      global: { stubs: createStubs() },
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Load More'))
    await btn!.trigger('click')
    expect(wrapper.emitted('loadRecords')).toBeTruthy()
  })

  it('shows loading text on load more when loadingRecords', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [{ eventName: 'INSERT' }],
        hasMore: true,
        loadingRecords: true,
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Loading...')
  })

  it('emits update:open false when close clicked', async () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('formats event name for MODIFY and REMOVE', () => {
    const wrapper = mount(DynamoDBStreamModal, {
      props: {
        ...baseProps(),
        streams: [stream],
        selectedStream: stream,
        records: [
          { eventName: 'MODIFY' },
          { eventName: 'REMOVE' },
          { eventName: 'UNKNOWN' },
        ],
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('MODIFY')
    expect(wrapper.html()).toContain('REMOVE')
    expect(wrapper.html()).toContain('UNKNOWN')
  })
})
