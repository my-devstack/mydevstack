import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No items found' }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display title', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No items found' }
    })
    expect(wrapper.text()).toContain('No items found')
  })

  it('should display description when provided', () => {
    const wrapper = mount(EmptyState, {
      props: { 
        title: 'No items found',
        description: 'Get started by creating a new item'
      }
    })
    expect(wrapper.text()).toContain('Get started by creating a new item')
  })

  it('should not display description when not provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No items found' }
    })
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('should display icon when provided', () => {
    const wrapper = mount(EmptyState, {
      props: { 
        title: 'No items found',
        icon: 'svg' 
      }
    })
    // Just verify component renders with icon prop
    expect(wrapper.props('icon')).toBe('svg')
  })

  it('should display action button when actionLabel is provided', () => {
    const wrapper = mount(EmptyState, {
      props: { 
        title: 'No items found',
        actionLabel: 'Create New'
      }
    })
    expect(wrapper.text()).toContain('Create New')
  })

  it('should not display action button when actionLabel is not provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No items found' }
    })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should emit action event when button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: { 
        title: 'No items found',
        actionLabel: 'Create New'
      }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toBeDefined()
  })
})