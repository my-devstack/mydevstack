import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from './Tabs.vue'

const testTabs = [
  { id: 'tab1', label: 'Tab 1' },
  { id: 'tab2', label: 'Tab 2' },
  { id: 'tab3', label: 'Tab 3' }
]

describe('Tabs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1' }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render tab labels', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1' }
    })
    expect(wrapper.text()).toContain('Tab 1')
    expect(wrapper.text()).toContain('Tab 2')
    expect(wrapper.text()).toContain('Tab 3')
  })

  it('should respect activeTab prop', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab2' }
    })
    expect(wrapper.props('activeTab')).toBe('tab2')
  })

  it('should emit update:activeTab on tab change', async () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1' }
    })
    
    const tabs = wrapper.findAll('button')
    await tabs[1].trigger('click')
    expect(wrapper.emitted('update:activeTab')).toBeDefined()
    expect(wrapper.emitted('update:activeTab')?.[0]).toEqual(['tab2'])
  })

  it('should accept variant prop', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1', variant: 'pills' }
    })
    expect(wrapper.props('variant')).toBe('pills')
  })

  it('should accept size prop', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1', size: 'lg' }
    })
    expect(wrapper.props('size')).toBe('lg')
  })

  it('should accept align prop', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1', align: 'center' }
    })
    expect(wrapper.props('align')).toBe('center')
  })

  it('should accept different variants', () => {
    const variants = ['underline', 'pills', 'boxed']
    variants.forEach(variant => {
      const wrapper = mount(Tabs, {
        props: { tabs: testTabs, activeTab: 'tab1', variant }
      })
      expect(wrapper.props('variant')).toBe(variant)
    })
  })

  it('should not have overflow-x-auto when scrollable is false', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1', scrollable: false }
    })
    const container = wrapper.find('[role="tablist"]')
    expect(container.classes()).not.toContain('overflow-x-auto')
    expect(container.classes()).toContain('flex-wrap')
  })

  it('should have overflow-x-auto when scrollable is true (default)', () => {
    const wrapper = mount(Tabs, {
      props: { tabs: testTabs, activeTab: 'tab1' }
    })
    const container = wrapper.find('[role="tablist"]')
    expect(container.classes()).toContain('overflow-x-auto')
    expect(container.classes()).toContain('flex-nowrap')
  })

  it('should not emit when clicking disabled tab', async () => {
    const tabsWithDisabled = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2', disabled: true }
    ]
    const wrapper = mount(Tabs, {
      props: { tabs: tabsWithDisabled, activeTab: 'tab1' }
    })
    
    const tabs = wrapper.findAll('button')
    await tabs[1].trigger('click')
    expect(wrapper.emitted('update:activeTab')).toBeUndefined()
  })
})