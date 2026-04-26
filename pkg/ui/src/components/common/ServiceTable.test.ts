import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServiceTable, { type TableColumn } from '../../components/common/ServiceTable.vue'
import EmptyState from '../../components/common/EmptyState.vue'

describe('ServiceTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'arn', label: 'ARN' },
    { key: 'status', label: 'Status', width: '100px' },
  ]

  const mockData = [
    { name: 'func1', arn: 'arn:aws:lambda:us-east-1:123456789012:function:func1', status: 'Active' },
    { name: 'func2', arn: 'arn:aws:lambda:us-east-1:123456789012:function:func2', status: 'Inactive' },
  ]

  it('renders table with data', () => {
    const wrapper = mount(ServiceTable, {
      props: { columns: mockColumns, data: mockData },
      global: {
        stubs: { EmptyState },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('columns')).toEqual(mockColumns)
    expect(wrapper.props('data')).toEqual(mockData)
  })

  it('renders correct number of columns', () => {
    const wrapper = mount(ServiceTable, {
      props: { columns: mockColumns, data: mockData },
      global: {
        stubs: { EmptyState },
      },
    })

    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(3)
  })

  it('renders empty state when no data', () => {
    const wrapper = mount(ServiceTable, {
      props: { columns: mockColumns, data: [], emptyText: 'No items found' },
      global: {
        stubs: { EmptyState },
      },
    })

    expect(wrapper.props('emptyText')).toBe('No items found')
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(ServiceTable, {
      props: { columns: mockColumns, data: [], loading: true },
      global: {
        stubs: { EmptyState },
      },
    })

    expect(wrapper.props('loading')).toBe(true)
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(3)
  })

  it('emits row-click event when row clicked', async () => {
    const wrapper = mount(ServiceTable, {
      props: { columns: mockColumns, data: mockData },
      global: {
        stubs: { EmptyState },
      },
    })

    const rows = wrapper.findAll('tr')
    await rows[1].trigger('click')

    expect(wrapper.emitted('row-click')).toBeTruthy()
    expect(wrapper.emitted('row-click')?.[0]).toEqual([mockData[0]])
  })

  it('formats cell value - null/undefined to dash', () => {
    const wrapper = mount(ServiceTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        data: [{ name: null }, { name: undefined }],
      },
      global: {
        stubs: { EmptyState },
      },
    })

    const cells = wrapper.findAll('td')
    expect(cells[0].text()).toBe('-')
    expect(cells[1].text()).toBe('-')
  })

  it('stringifies object cell values', () => {
    const wrapper = mount(ServiceTable, {
      props: {
        columns: [{ key: 'config', label: 'Config' }],
        data: [{ config: { key: 'value' } }],
      },
      global: {
        stubs: { EmptyState },
      },
    })

    const cell = wrapper.find('td')
    expect(cell.text()).toBe('{"key":"value"}')
  })
})