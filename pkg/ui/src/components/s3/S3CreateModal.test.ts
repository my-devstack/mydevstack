import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3CreateModal from './S3CreateModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

describe('S3CreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3CreateModal).toBeDefined()
  })

  it('has required props defined', () => {
    expect(S3CreateModal.props).toBeDefined()
    expect(S3CreateModal.props.open).toBeDefined()
    expect(S3CreateModal.props.loading).toBeDefined()
  })

  it('open prop is required', () => {
    expect(S3CreateModal.props.open.required).toBe(true)
  })

  it('loading prop is optional boolean', () => {
    expect(S3CreateModal.props.loading.required).toBeFalsy()
    expect(S3CreateModal.props.loading.type).toBe(Boolean)
  })

  it('emits update:open event', () => {
    expect(S3CreateModal.emits).toBeDefined()
    expect(S3CreateModal.emits).toContain('update:open')
  })

  it('emits create event', () => {
    expect(S3CreateModal.emits).toBeDefined()
    expect(S3CreateModal.emits).toContain('create')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: false,
        loading: false,
      },
    })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders when open is true', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('renders input field', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('renders CORS checkbox', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('renders Create and Cancel buttons', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts).toContain('Cancel')
    expect(buttonTexts).toContain('Create')
  })

  it('create button shows creating text when loading', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: true,
      },
    })
    expect(wrapper.text()).toContain('Creating...')
  })

  it('shows creating text when loading', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: true,
      },
    })
    expect(wrapper.text()).toContain('Creating...')
  })

  it('emits create with bucket name and CORS option', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('my-bucket')

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setChecked()

    const createButton = wrapper.findAll('button').find(b => b.text() === 'Create')
    await createButton?.trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
    expect(wrapper.emitted('create')?.[0]).toEqual(['my-bucket', { enableCors: true }])
  })

  it('emits create without CORS when unchecked', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('my-bucket')

    const createButton = wrapper.findAll('button').find(b => b.text() === 'Create')
    await createButton?.trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
    expect(wrapper.emitted('create')?.[0]).toEqual(['my-bucket', { enableCors: false }])
  })

  it('does not emit create for empty bucket name', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const createButton = wrapper.findAll('button').find(b => b.text() === 'Create')
    await createButton?.trigger('click')

    expect(wrapper.emitted('create')).toBeFalsy()
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const cancelButton = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('emits update:open false on backdrop click', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('update:open')).toBeTruthy()
  })

  it('handles Enter key to submit', async () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('my-bucket')
    await input.trigger('keyup.enter')

    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('renders bucket naming guidelines', () => {
    const wrapper = mount(S3CreateModal, {
      props: {
        open: true,
        loading: false,
      },
    })
    expect(wrapper.text()).toContain('Bucket names must be unique and lowercase')
  })
})