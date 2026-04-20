import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FormInput from './FormInput.vue'

describe('FormInput', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '' }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('should render label when provided', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', label: 'Username' }
    })
    expect(wrapper.text()).toContain('Username')
  })

  it('should show required asterisk when required is true', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', label: 'Username', required: true }
    })
    expect(wrapper.find('label').text()).toContain('*')
  })

  it('should not show required asterisk when not required', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', label: 'Username', required: false }
    })
    expect(wrapper.find('label').text()).not.toContain('*')
  })

  it('should bind modelValue to input', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: 'test value' }
    })
    expect(wrapper.find('input').attributes('value')).toBe('test value')
  })

  it('should update modelValue on input', async () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '' }
    })
    await wrapper.find('input').setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
  })

  it('should display error message when error prop is provided', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', error: 'This field is required' }
    })
    expect(wrapper.text()).toContain('This field is required')
  })

  it('should display help text when provided and no error', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', helpText: 'Enter your username' }
    })
    expect(wrapper.text()).toContain('Enter your username')
  })

  it('should not display help text when there is an error', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', error: 'Error', helpText: 'Help text' }
    })
    expect(wrapper.text()).not.toContain('Help text')
  })

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', disabled: true }
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('should accept placeholder prop', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', placeholder: 'Enter text...' }
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text...')
  })

  it('should accept type prop', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '', type: 'password' }
    })
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('should have type text by default', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '' }
    })
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('should have correct id', () => {
    const wrapper = mount(FormInput, {
      props: { modelValue: '' },
      attrs: { id: 'my-input' }
    })
    expect(wrapper.find('input').attributes('id')).toBe('my-input')
  })
})