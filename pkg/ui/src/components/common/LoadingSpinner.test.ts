import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from './LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('should have default size', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.props('size')).toBe('md')
  })

  it('should accept size prop', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { size: 'lg' }
    })
    expect(wrapper.props('size')).toBe('lg')
  })

  it('should have different sizes', () => {
    const sizes = ['sm', 'md', 'lg']
    sizes.forEach(size => {
      const wrapper = mount(LoadingSpinner, { props: { size } })
      expect(wrapper.props('size')).toBe(size)
    })
  })

  it('should have default color', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.props('color')).toBeUndefined()
  })

  it('should accept color prop', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { color: 'white' }
    })
    expect(wrapper.props('color')).toBe('white')
  })

  it('should accept label prop in fullscreen mode', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { label: 'Loading...', fullScreen: true }
    })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('should use default color', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.props('color')).toBeUndefined()
  })
})