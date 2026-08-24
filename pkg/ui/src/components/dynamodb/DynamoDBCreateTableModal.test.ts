import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBCreateTableModal } from './index'

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
    props: ['disabled', 'variant'],
  },
})

const baseProps = () => ({
  open: true,
  tableName: 'my-table',
  partitionKeyName: 'pk',
  partitionKeyType: 'S',
  hasSortKey: false,
  sortKeyName: '',
  sortKeyType: 'S',
  billingMode: 'PAY_PER_REQUEST',
  readCapacity: 5,
  writeCapacity: 5,
  enableStreams: false,
  streamViewType: 'NEW_AND_OLD_IMAGES',
  creating: false,
})

describe('DynamoDBCreateTableModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Create DynamoDB Table')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), open: false },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).not.toContain('Create DynamoDB Table')
  })

  it('emits update:tableName on table name input', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('new-table')
    expect(wrapper.emitted('update:tableName')).toBeTruthy()
    expect(wrapper.emitted('update:tableName')![0]).toEqual(['new-table'])
  })

  it('emits update:partitionKeyName on partition key input', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[1].setValue('newpk')
    expect(wrapper.emitted('update:partitionKeyName')).toBeTruthy()
    expect(wrapper.emitted('update:partitionKeyName')![0]).toEqual(['newpk'])
  })

  it('emits update:hasSortKey when sort key checkbox toggled', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(wrapper.emitted('update:hasSortKey')).toBeTruthy()
    expect(wrapper.emitted('update:hasSortKey')![0]).toEqual([true])
  })

  it('shows sort key fields when hasSortKey is true', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), hasSortKey: true, sortKeyName: 'sk' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('sk')
  })

  it('emits update:billingMode when provisioned selected', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const radio = wrapper.find('input[value="PROVISIONED"]')
    await radio.setValue()
    expect(wrapper.emitted('update:billingMode')).toBeTruthy()
    expect(wrapper.emitted('update:billingMode')![0]).toEqual(['PROVISIONED'])
  })

  it('shows provisioned throughput when billingMode is PROVISIONED', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), billingMode: 'PROVISIONED' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Read Capacity Units')
    expect(wrapper.html()).toContain('Write Capacity Units')
  })

  it('emits update:enableStreams when streams checkbox toggled', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[1].setValue(true)
    expect(wrapper.emitted('update:enableStreams')).toBeTruthy()
    expect(wrapper.emitted('update:enableStreams')![0]).toEqual([true])
  })

  it('shows stream view type select when enableStreams is true', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), enableStreams: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Stream View Type')
  })

  it('emits create when create button clicked', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create Table'))
    await createBtn!.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('shows Creating... when creating', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), creating: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.html()).toContain('Creating...')
  })

  it('disables create button when tableName empty', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), tableName: '' },
      global: { stubs: createStubs() },
    })
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create Table'))
    expect(createBtn!.attributes('disabled')).toBeDefined()
  })

  it('disables create button when partitionKeyName empty', () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: { ...baseProps(), partitionKeyName: '' },
      global: { stubs: createStubs() },
    })
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create Table'))
    expect(createBtn!.attributes('disabled')).toBeDefined()
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(DynamoDBCreateTableModal, {
      props: baseProps(),
      global: { stubs: createStubs() },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})
