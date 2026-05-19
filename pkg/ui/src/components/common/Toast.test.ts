import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Toast from './Toast.vue'
import type { ToastItem } from './Toast.vue'

const baseStubs = {
  Teleport: true,
  TransitionRoot: {
    props: ['show'],
    template: '<div v-if="show"><slot /></div>',
  },
  TransitionChild: {
    props: ['as'],
    template: '<component :is="as"><slot /></component>',
  },
}

function createToast(
  overrides: Partial<ToastItem> = {},
): ToastItem {
  return {
    id: 'test-1',
    type: 'success',
    message: 'Operation completed successfully',
    ...overrides,
  }
}

describe('Toast', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when toast is null', () => {
    const wrapper = mount(Toast, {
      props: { toast: null },
      global: { stubs: baseStubs },
    })
    // The outer Teleport wrapper renders but toast content is hidden
    expect(wrapper.find('.pointer-events-auto').exists()).toBe(false)
  })

  it('renders toast message for success type', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast() },
      global: { stubs: baseStubs },
    })
    expect(wrapper.text()).toContain('Operation completed successfully')
  })

  it('renders toast message for error type', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast({ type: 'error', message: 'Error occurred' }) },
      global: { stubs: baseStubs },
    })
    expect(wrapper.text()).toContain('Error occurred')
  })

  it('renders toast message for warning type', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast({ type: 'warning', message: 'Warning message' }) },
      global: { stubs: baseStubs },
    })
    expect(wrapper.text()).toContain('Warning message')
  })

  it('renders toast message for info type', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast({ type: 'info', message: 'Info message' }) },
      global: { stubs: baseStubs },
    })
    expect(wrapper.text()).toContain('Info message')
  })

  it('has dismiss button', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast() },
      global: { stubs: baseStubs },
    })
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
  })

  it('emits dismiss with toast id on button click', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Toast, {
      props: { toast: createToast({ id: 'dismiss-test' }) },
      global: { stubs: baseStubs },
    })

    await wrapper.find('button').trigger('click')
    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('dismiss')).toBeTruthy()
    expect(wrapper.emitted('dismiss')![0]).toEqual(['dismiss-test'])
  })

  it('shows progress bar on mount', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast() },
      global: { stubs: baseStubs },
    })
    // Progress bar is the last child of .pointer-events-auto
    const progressBar = wrapper.find('.h-full')
    expect(progressBar.exists()).toBe(true)
  })

  it('progress bar starts at 100% width', () => {
    const wrapper = mount(Toast, {
      props: { toast: createToast() },
      global: { stubs: baseStubs },
    })
    const progressBar = wrapper.find('.h-full')
    expect(progressBar.attributes('style')).toContain('width: 100%')
  })

  it('applies correct progress color for each toast type', () => {
    const types: Array<ToastItem['type']> = ['success', 'error', 'warning', 'info']
    const expectedColors: Record<ToastItem['type'], string> = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500',
    }

    for (const type of types) {
      const wrapper = mount(Toast, {
        props: { toast: createToast({ type }) },
        global: { stubs: baseStubs },
      })
      const progressBar = wrapper.find('.h-full')
      expect(progressBar.classes()).toContain(expectedColors[type])
    }
  })
})
