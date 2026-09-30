import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CloudFrontOriginAccessControlModal } from './index'

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

describe('CloudFrontOriginAccessControlModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: false },
      global: { stubs },
    })
    expect(wrapper.html()).not.toContain('Create Origin Access Control')
  })

  it('renders create form when open', () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: true },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Create Origin Access Control')
    expect(wrapper.html()).toContain('Name')
    expect(wrapper.html()).toContain('Description')
  })

  it('emits create with form data when create clicked', async () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: true },
      global: { stubs },
    })
    wrapper.vm.form.name = 'my-oac'
    wrapper.vm.form.description = 'Test OAC'
    await wrapper.vm.handleConfirm()
    const emitted = wrapper.emitted('create')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0].Name).toBe('my-oac')
      expect(emitted[0][0].Description).toBe('Test OAC')
      expect(emitted[0][0].OriginAccessControlOriginType).toBe('s3')
      expect(emitted[0][0].SigningBehavior).toBe('always')
      expect(emitted[0][0].SigningProtocol).toBe('sigv4')
    }
  })

  it('does not emit create when name is empty', async () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: true },
      global: { stubs },
    })
    wrapper.vm.form.name = ''
    await wrapper.vm.handleConfirm()
    expect(wrapper.emitted('create')).toBeFalsy()
  })

  it('shows loading state when creating', () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: true, loading: true },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('Creating...')
  })

  it('resets form when opened', async () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
      props: { open: false },
      global: { stubs },
    })
    wrapper.vm.form.name = 'dirty'
    await wrapper.setProps({ open: true })
    expect(wrapper.vm.form.name).toBe('')
  })

  it('emits update:open false when cancel clicked', async () => {
    const wrapper = mount(CloudFrontOriginAccessControlModal, {
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
