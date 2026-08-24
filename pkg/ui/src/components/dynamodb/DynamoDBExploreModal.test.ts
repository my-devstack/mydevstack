import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBExploreModal } from './index'

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
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :size="size"><slot /></button>',
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
  scanMode: 'scan' as const,
  error: null,
  loading: false,
  items: [],
  lastEvaluatedKey: null,
  tableDetails: null,
  pkName: 'pk',
  skName: null,
})

describe('DynamoDBExploreModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title with table name', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Explore: my-table')
  })

  it('shows error when present', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), error: 'Scan failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Scan failed')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows no items message when items empty', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('No items found in this table.')
  })

  it('shows item count', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), items: [{ pk: { S: 'a' } }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('1 item(s) found')
  })

  it('emits scan when scan all clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const scanBtn = wrapper.findAll('button').find(b => b.text().includes('Scan All'))
    await scanBtn!.trigger('click')
    expect(wrapper.emitted('scan')).toBeTruthy()
    expect(wrapper.emitted('update:scanMode')).toBeTruthy()
  })

  it('emits update:scanMode query when query clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const queryBtn = wrapper.findAll('button').find(b => b.text().includes('Query'))
    await queryBtn!.trigger('click')
    expect(wrapper.emitted('update:scanMode')).toBeTruthy()
    expect(wrapper.emitted('update:scanMode')![0]).toEqual(['query'])
  })

  it('emits addItem when add item clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Item'))
    await addBtn!.trigger('click')
    expect(wrapper.emitted('addItem')).toBeTruthy()
  })

  it('shows query filters when scanMode is query', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), scanMode: 'query', skName: 'sk' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Partition Key')
    expect(wrapper.html()).toContain('Sort Key')
    expect(wrapper.html()).toContain('Condition')
  })

  it('does not show sort key filters when skName null', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), scanMode: 'query', skName: null },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Sort Key')
  })

  it('emits query when run query clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), scanMode: 'query' },
      global: { stubs: createStubs() },
    })
    const runBtn = wrapper.findAll('button').find(b => b.text().includes('Run Query'))
    await runBtn!.trigger('click')
    expect(wrapper.emitted('query')).toBeTruthy()
  })

  it('renders items table with attributes', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: {
        ...baseProps(),
        items: [{ pk: { S: 'user1' }, age: { N: '30' } }],
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('pk')
    expect(wrapper.html()).toContain('user1')
    expect(wrapper.html()).toContain('age')
    expect(wrapper.html()).toContain('30')
  })

  it('emits deleteItem when delete button clicked', async () => {
    const item = { pk: { S: 'user1' } }
    const wrapper = mount(DynamoDBExploreModal, {
      props: { ...baseProps(), items: [item] },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('deleteItem')).toBeTruthy()
    expect(wrapper.emitted('deleteItem')![0]).toEqual([item])
  })

  it('shows load more when lastEvaluatedKey present', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: {
        ...baseProps(),
        items: [{ pk: { S: 'a' } }],
        lastEvaluatedKey: { pk: { S: 'a' } },
      },
      global: { stubs: createStubs() },
    })
    const loadMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Load More'))
    expect(loadMoreBtn).toBeTruthy()
  })

  it('emits loadMore when load more clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: {
        ...baseProps(),
        items: [{ pk: { S: 'a' } }],
        lastEvaluatedKey: { pk: { S: 'a' } },
      },
      global: { stubs: createStubs() },
    })
    const loadMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Load More'))
    await loadMoreBtn!.trigger('click')
    expect(wrapper.emitted('loadMore')).toBeTruthy()
  })

  it('shows key type badge for hash key', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: {
        ...baseProps(),
        items: [{ pk: { S: 'a' } }],
        tableDetails: {
          KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }],
        },
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('HASH')
  })

  it('shows key type badge for range key', () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: {
        ...baseProps(),
        items: [{ pk: { S: 'a' }, sk: { S: 'b' } }],
        tableDetails: {
          KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' },
          ],
        },
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('RANGE')
  })

  it('emits update:open false when close clicked', async () => {
    const wrapper = mount(DynamoDBExploreModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
