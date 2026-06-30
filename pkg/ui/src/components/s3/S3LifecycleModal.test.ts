import { describe, it, expect, beforeEach, vi, nextTick } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3LifecycleModal from './S3LifecycleModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

const mockRules = [
  {
    ID: 'ExpireLogs',
    Status: 'Enabled',
    Filter: { Prefix: 'logs/' },
    Expiration: { Days: 30 },
  },
  {
    ID: 'ArchiveOld',
    Status: 'Disabled',
    Transitions: [{ StorageClass: 'GLACIER', Days: 90 }],
  },
]

describe('S3LifecycleModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3LifecycleModal).toBeDefined()
  })

  it('has required props defined', () => {
    expect(S3LifecycleModal.props).toBeDefined()
    expect(S3LifecycleModal.props.open).toBeDefined()
    expect(S3LifecycleModal.props.bucketName).toBeDefined()
    expect(S3LifecycleModal.props.rules).toBeDefined()
  })

  it('emits update:open', () => {
    expect(S3LifecycleModal.emits).toBeDefined()
    expect(S3LifecycleModal.emits).toContain('update:open')
  })

  it('shows "No lifecycle rules" in empty state', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: [],
      },
    })

    expect(document.body.textContent).toContain('No lifecycle rules configured')
    wrapper.unmount()
  })

  it('shows loading state', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: [],
        loading: true,
      },
    })

    expect(document.body.textContent).toContain('Loading lifecycle rules')
    wrapper.unmount()
  })

  it('shows title with bucket name', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'my-test-bucket',
        rules: [],
      },
    })

    expect(document.body.textContent).toContain('my-test-bucket')
    wrapper.unmount()
  })

  it('shows rule list with IDs', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: mockRules,
      },
    })

    expect(document.body.textContent).toContain('ExpireLogs')
    expect(document.body.textContent).toContain('ArchiveOld')
    wrapper.unmount()
  })

  it('shows rule details like prefix and expiration', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: mockRules,
      },
    })

    expect(document.body.textContent).toContain('logs/')
    expect(document.body.textContent).toContain('30 day(s)')
    expect(document.body.textContent).toContain('GLACIER')
    wrapper.unmount()
  })

  it('emits save when Save Changes button clicked', async () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: mockRules,
      },
    })

    // Find and click Save Changes button in footer
    const saveBtn = Array.from(document.body.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save Changes'))
    expect(saveBtn).toBeDefined()
    saveBtn!.click()

    expect(wrapper.emitted('save')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits delete when Delete All is confirmed', async () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: mockRules,
      },
    })

    // Click Delete All button
    const deleteAllBtn = Array.from(document.body.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Delete All'))
    expect(deleteAllBtn).toBeDefined()
    deleteAllBtn!.click()

    // Wait for Vue to update DOM
    await wrapper.vm.$nextTick()

    // Confirm delete
    const confirmBtn = Array.from(document.body.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Confirm'))
    expect(confirmBtn).toBeDefined()
    confirmBtn!.click()

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['test-bucket'])
    wrapper.unmount()
  })

  it('shows Add Rule button when rules exist', () => {
    const wrapper = mount(S3LifecycleModal, {
      attachTo: document.body,
      props: {
        open: true,
        bucketName: 'test-bucket',
        rules: mockRules,
      },
    })

    const addBtn = Array.from(document.body.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Add Rule'))
    expect(addBtn).toBeDefined()
    wrapper.unmount()
  })
})
