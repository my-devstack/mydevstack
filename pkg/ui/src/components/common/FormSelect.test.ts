import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FormSelect from './FormSelect.vue'

const testOptions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' }
]

describe('FormSelect', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render with default props', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('should render label when provided', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, label: 'Region' }
    })
    expect(wrapper.text()).toContain('Region')
  })

  it('should render all options', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions }
    })
    const options = wrapper.findAll('option')
    // 1 placeholder + 3 options
    expect(options).toHaveLength(4)
  })

  it('should display placeholder option', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, placeholder: 'Choose region' }
    })
    expect(wrapper.text()).toContain('Choose region')
  })

  it('should bind modelValue to select', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: 'us-east-1', options: testOptions }
    })
    expect(wrapper.find('select').element.value).toBe('us-east-1')
  })

  it('should update modelValue on change', async () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions }
    })
    await wrapper.find('select').setValue('us-west-2')
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['us-west-2'])
  })

  it('should display error message when error prop is provided', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, error: 'This field is required' }
    })
    expect(wrapper.text()).toContain('This field is required')
  })

  it('should display help text when provided and no error', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, helpText: 'Select your region' }
    })
    expect(wrapper.text()).toContain('Select your region')
  })

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, disabled: true }
    })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('should show required asterisk when required is true', () => {
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: testOptions, label: 'Region', required: true }
    })
    expect(wrapper.find('label').text()).toContain('*')
  })

  it('should handle disabled options', () => {
    const optionsWithDisabled = [
      { value: 'us-east-1', label: 'US East', disabled: true },
      { value: 'us-west-2', label: 'US West' }
    ]
    const wrapper = mount(FormSelect, {
      props: { modelValue: '', options: optionsWithDisabled }
    })
    const disabledOption = wrapper.find('option[disabled]')
    expect(disabledOption.exists()).toBe(true)
  })
})