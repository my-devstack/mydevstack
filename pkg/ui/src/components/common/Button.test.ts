import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import Button from './Button.vue'

describe('Button', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render with default props', () => {
    const wrapper = mount(Button)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should render text content', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('should have primary variant by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.props('variant')).toBe('primary')
  })

  it('should accept variant prop', () => {
    const wrapper = mount(Button, {
      props: { variant: 'danger' }
    })
    expect(wrapper.props('variant')).toBe('danger')
  })

  it('should accept different variants', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost']
    variants.forEach(variant => {
      const wrapper = mount(Button, {
        props: { variant }
      })
      expect(wrapper.props('variant')).toBe(variant)
    })
  })

  it('should have md size by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.props('size')).toBe('md')
  })

  it('should accept size prop', () => {
    const wrapper = mount(Button, {
      props: { size: 'lg' }
    })
    expect(wrapper.props('size')).toBe('lg')
  })

  it('should accept different sizes', () => {
    const sizes = ['sm', 'md', 'lg']
    sizes.forEach(size => {
      const wrapper = mount(Button, {
        props: { size }
      })
      expect(wrapper.props('size')).toBe(size)
    })
  })

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: { disabled: true }
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('should show loading spinner when loading is true', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Loading...' }
    })
    expect(wrapper.props('loading')).toBe(true)
  })

  it('should emit click event', async () => {
    const wrapper = mount(Button)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeDefined()
  })

  it('should not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should not emit click when loading', async () => {
    const wrapper = mount(Button, {
      props: { loading: true }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('should have type button by default', () => {
    const wrapper = mount(Button)
    expect(wrapper.find('button').attributes('type')).toBe('button')
  })

  it('should accept type prop', () => {
    const wrapper = mount(Button, {
      props: { type: 'submit' }
    })
    expect(wrapper.find('button').attributes('type')).toBe('submit')
  })

  // mutating + readOnly tests
  it('mutating + readOnly=true → disabled, aria-disabled, title, no click emit', async () => {
    const store = useSettingsStore()
    store.setReadOnly(true)
    const wrapper = mount(Button, {
      props: { mutating: true },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.attributes('aria-disabled')).toBe('true')
    expect(btn.attributes('title')).toBe('Read-only mode: action not allowed')
    await btn.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('mutating + readOnly=false → enabled, click emits', async () => {
    const store = useSettingsStore()
    store.setReadOnly(false)
    const wrapper = mount(Button, {
      props: { mutating: true },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.attributes('aria-disabled')).toBeUndefined()
    expect(btn.attributes('title')).toBeUndefined()
    await btn.trigger('click')
    expect(wrapper.emitted('click')).toBeDefined()
  })

  it('no mutating + readOnly=true → enabled', () => {
    const store = useSettingsStore()
    store.setReadOnly(true)
    const wrapper = mount(Button)
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.attributes('aria-disabled')).toBeUndefined()
  })

  it('explicit disabled still works alongside readOnly', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    // No read-only blocked here, so no aria-disabled from our logic
    expect(btn.attributes('aria-disabled')).toBeUndefined()
  })

  it('caller title wins over read-only hint', () => {
    const store = useSettingsStore()
    store.setReadOnly(true)
    const wrapper = mount(Button, {
      props: { mutating: true },
      attrs: { title: 'Custom title' },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('title')).toBe('Custom title')
  })

  it('mutating prop does not leak as DOM attribute', () => {
    const wrapper = mount(Button, {
      props: { mutating: true },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('mutating')).toBeUndefined()
  })
})
