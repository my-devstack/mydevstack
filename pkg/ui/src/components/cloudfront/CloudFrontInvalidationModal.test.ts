import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CloudFrontInvalidationModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const stubs = {
  FormInput: {
    template: '<div><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
    props: ['modelValue', 'label', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :loading="loading" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
}

describe('CloudFrontInvalidationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: false },
      global: { stubs },
    })
    expect(wrapper.html()).not.toContain('Create Invalidation')
  })

  it('renders create form when open', () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: true },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Create Invalidation')
    expect(wrapper.html()).toContain('Paths (one per line)')
  })

  it('emits create with paths when create clicked', async () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: true },
      global: { stubs },
    })
    wrapper.vm.form.paths = '/*\n/images/*'
    await wrapper.vm.handleConfirm()
    const emitted = wrapper.emitted('create')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0].Paths).toEqual(['/*', '/images/*'])
    }
  })

  it('does not emit create when paths is empty', async () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: true },
      global: { stubs },
    })
    wrapper.vm.form.paths = ''
    await wrapper.vm.handleConfirm()
    expect(wrapper.emitted('create')).toBeFalsy()
  })

  it('shows loading state when creating', () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: true, loading: true },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Creating...')
  })

  it('resets form when opened', async () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: false },
      global: { stubs },
    })
    wrapper.vm.form.paths = '/dirty/*'
    await wrapper.setProps({ open: true })
    expect(wrapper.vm.form.paths).toBe('/*')
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(CloudFrontInvalidationModal, {
      props: { open: true },
      global: { stubs },
    })
    await wrapper.vm.handleClose()
    expect(wrapper.emitted('update:open')).toBeTruthy()
    if (wrapper.emitted('update:open')) {
      expect(wrapper.emitted('update:open')[0]).toEqual([false])
    }
  })
})
