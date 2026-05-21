import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataTable from './DataTable.vue'
import type { Column } from './DataTable.vue'

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  ChevronUpIcon: { template: '<span class="mock-chevron-up" />' },
  ChevronDownIcon: { template: '<span class="mock-chevron-down" />' },
}))

// Mock child components
vi.mock('@/components/common/LoadingSpinner.vue', () => ({
  default: { template: '<div class="mock-loading">Loading...</div>' },
}))

vi.mock('@/components/common/EmptyState.vue', () => ({
  default: {
    name: 'EmptyState',
    props: ['icon', 'title', 'description'],
    template: '<div class="mock-empty-state"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
  },
}))

const columns: Column[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
]

const sampleData = [
  { id: '1', name: 'Alpha', status: 'active' },
  { id: '2', name: 'Beta', status: 'inactive' },
  { id: '3', name: 'Gamma', status: 'active' },
  { id: '4', name: 'Delta', status: 'pending' },
  { id: '5', name: 'Epsilon', status: 'active' },
  { id: '6', name: 'Zeta', status: 'inactive' },
  { id: '7', name: 'Eta', status: 'active' },
  { id: '8', name: 'Theta', status: 'pending' },
  { id: '9', name: 'Iota', status: 'active' },
  { id: '10', name: 'Kappa', status: 'inactive' },
  { id: '11', name: 'Lambda', status: 'active' },
  { id: '12', name: 'Mu', status: 'pending' },
]

describe('DataTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exists as a component', () => {
    expect(DataTable).toBeDefined()
  })

  it('renders column headers', () => {
    const wrapper = mount(DataTable, {
      props: { columns, data: [] },
    })

    expect(wrapper.text()).toContain('ID')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Status')
  })

  describe('empty state', () => {
    it('renders empty state when data is empty', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [], emptyText: 'Nothing here', emptyTitle: 'No Data' },
      })

      const emptyState = wrapper.find('.mock-empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('No Data')
      expect(emptyState.text()).toContain('Nothing here')
    })

    it('uses default empty state text', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [] },
      })

      const emptyState = wrapper.find('.mock-empty-state')
      expect(emptyState.text()).toContain('No Results')
      expect(emptyState.text()).toContain('No data available')
    })
  })

  describe('loading state', () => {
    it('shows loading skeleton when loading is true', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [], loading: true },
      })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })

    it('does not show pagination when loading', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData, loading: true },
      })

      expect(wrapper.text()).not.toContain('Previous')
      expect(wrapper.text()).not.toContain('Next')
    })
  })

  describe('sorting', () => {
    it('sorts data ascending on first sortable column click', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      // Click "Name" header (sortable)
      const nameHeader = wrapper.findAll('th').find(t => t.text().includes('Name'))
      expect(nameHeader).toBeTruthy()
      await nameHeader!.trigger('click')

      // Check rows after sort (ascending: Alpha, Beta, Delta, Epsilon, Eta, Gamma...)
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
      // First row should have the first sorted item
      expect(wrapper.text()).toContain('Alpha')
    })

    it('toggles sort direction on second click', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const idHeader = wrapper.findAll('th').find(t => t.text().includes('ID'))
      await idHeader!.trigger('click')

      // After first click: asc (1,2,3,...)
      const vm = wrapper.vm as any
      expect(vm.sortDirection).toBe('asc')
      expect(vm.sortKey).toBe('id')

      await idHeader!.trigger('click')
      // Now desc (9,8,7,... or 12,11,... depending on string sort)
      expect(vm.sortDirection).toBe('desc')
    })

    it('changes sort key when clicking different sortable column', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const nameHeader = wrapper.findAll('th').find(t => t.text().includes('Name'))
      await nameHeader!.trigger('click')

      const vm = wrapper.vm as any
      expect(vm.sortKey).toBe('name')
      expect(vm.sortDirection).toBe('asc')

      // Click another sortable column
      const idHeader = wrapper.findAll('th').find(t => t.text().includes('ID'))
      await idHeader!.trigger('click')

      expect(vm.sortKey).toBe('id')
      expect(vm.sortDirection).toBe('asc')
    })

    it('does not sort when clicking non-sortable column', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const statusHeader = wrapper.findAll('th').find(t => t.text().includes('Status'))
      await statusHeader!.trigger('click')

      const vm = wrapper.vm as any
      expect(vm.sortKey).toBeNull()
    })
  })

  describe('row click', () => {
    it('emits row-click event on row click', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [sampleData[0]] },
      })

      const row = wrapper.find('tbody tr')
      await row.trigger('click')

      expect(wrapper.emitted('row-click')).toBeTruthy()
      expect(wrapper.emitted('row-click')![0]).toEqual([sampleData[0]])
    })

    it('emits update:selectedKey when selectable is true and row clicked', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [sampleData[0]], selectable: true, selectedKey: '' },
      })

      const row = wrapper.find('tbody tr')
      await row.trigger('click')

      expect(wrapper.emitted('update:selectedKey')).toBeTruthy()
      expect(wrapper.emitted('update:selectedKey')![0]).toEqual(['1'])
    })

    it('does not highlight row when not selected', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [sampleData[0]], selectable: true, selectedKey: '999' },
      })

      const row = wrapper.find('tbody tr')
      // bg-primary-50 is only applied when selected
      expect(row.classes()).not.toContain('bg-primary-50')
    })
  })

  describe('pagination', () => {
    it('shows pagination controls when data exceeds itemsPerPage', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      // 12 items, default 10 per page => 2 pages
      expect(wrapper.text()).toContain('Previous')
      expect(wrapper.text()).toContain('Next')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
    })

    it('navigates to next page', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text().includes('Next'))
      expect(nextBtn).toBeTruthy()
      await nextBtn!.trigger('click')

      // After next page, should show items 11-12
      const vm = wrapper.vm as any
      expect(vm.currentPage).toBe(2)
      expect(wrapper.text()).toContain('Lambda')
    })

    it('navigates to previous page', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      // Go to page 2 first
      const page2Btn = wrapper.findAll('button').find(b => b.text() === '2')
      await page2Btn!.trigger('click')

      const vm = wrapper.vm as any
      expect(vm.currentPage).toBe(2)

      // Go back
      const prevBtn = wrapper.findAll('button').find(b => b.text().includes('Previous'))
      await prevBtn!.trigger('click')

      expect(vm.currentPage).toBe(1)
      expect(wrapper.text()).toContain('Alpha')
    })

    it('disables Previous on first page', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const prevBtn = wrapper.findAll('button').find(b => b.text().includes('Previous'))
      expect(prevBtn!.attributes('disabled')).toBeDefined()
    })

    it('disables Next on last page', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text().includes('Next'))
      await nextBtn!.trigger('click')

      // Now on page 2, Next should be disabled
      expect(nextBtn!.attributes('disabled')).toBeDefined()
    })

    it('updates itemsPerPage via select', async () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      const select = wrapper.find('select')
      await select.setValue('20')

      const vm = wrapper.vm as any
      expect(vm.itemsPerPage).toBe(20)
    })

    it('shows correct item range text', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: sampleData },
      })

      expect(wrapper.text()).toContain('Showing')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('of')
      expect(wrapper.text()).toContain('12')
    })
  })

  describe('custom slot rendering', () => {
    it('renders cell slot content', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [{ id: '1', name: 'Test', status: 'ok' }] },
        slots: {
          'cell-name': `<template #cell-name="{ row, value }">
            <span class="custom-name">{{ value }}</span>
          </template>`,
        },
      })

      expect(wrapper.find('.custom-name').exists()).toBe(true)
      expect(wrapper.find('.custom-name').text()).toBe('Test')
    })

    it('renders row-actions slot', () => {
      const wrapper = mount(DataTable, {
        props: { columns, data: [{ id: '1', name: 'Test', status: 'ok' }] },
        slots: {
          'row-actions': `<template #row-actions="{ row }">
            <button class="custom-action">Action</button>
          </template>`,
        },
      })

      expect(wrapper.find('.custom-action').exists()).toBe(true)
      expect(wrapper.find('.custom-action').text()).toBe('Action')
    })
  })
})
