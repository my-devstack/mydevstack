import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ReadOnlyBanner from './ReadOnlyBanner.vue'

describe('ReadOnlyBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('is hidden when readOnly false', () => {
    const store = useSettingsStore()
    store.setReadOnly(false)
    const wrapper = mount(ReadOnlyBanner)
    expect(wrapper.find('[data-testid="read-only-banner"]').exists()).toBe(false)
  })

  it('is visible with exact text when readOnly true', () => {
    const store = useSettingsStore()
    store.setReadOnly(true)
    const wrapper = mount(ReadOnlyBanner)
    const banner = wrapper.find('[data-testid="read-only-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toBe(
      'Read-only mode — create, edit and delete are disabled'
    )
    expect(banner.attributes('role')).toBe('status')
  })

  it('is non-dismissible (no close button)', () => {
    const store = useSettingsStore()
    store.setReadOnly(true)
    const wrapper = mount(ReadOnlyBanner)
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
