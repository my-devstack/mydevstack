import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3BucketDetails from './S3BucketDetails.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

describe('S3BucketDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3BucketDetails).toBeDefined()
  })

  it('has bucketName prop defined', () => {
    expect(S3BucketDetails.props).toBeDefined()
    expect(S3BucketDetails.props.bucketName).toBeDefined()
  })

  it('bucketName prop is required string', () => {
    expect(S3BucketDetails.props.bucketName.required).toBe(true)
    expect(S3BucketDetails.props.bucketName.type).toBe(String)
  })

  it('details prop is optional object', () => {
    expect(S3BucketDetails.props.details.required).toBeFalsy()
  })

  it('emits close event', () => {
    expect(S3BucketDetails.emits).toBeDefined()
    expect(S3BucketDetails.emits).toContain('close')
  })

  it('emits addTrigger event', () => {
    expect(S3BucketDetails.emits).toBeDefined()
    expect(S3BucketDetails.emits).toContain('addTrigger')
  })

  it('emits viewPolicy event', () => {
    expect(S3BucketDetails.emits).toBeDefined()
    expect(S3BucketDetails.emits).toContain('viewPolicy')
  })

  it('renders versioning status', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('Versioning')
    expect(wrapper.text()).toContain('Enabled')
  })

  it('renders encryption info', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'aws:kms', keyId: 'test-key-id' },
          tags: [],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('Encryption')
    expect(wrapper.text()).toContain('aws:kms')
  })

  it('renders tags', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [
            { Key: 'Environment', Value: 'Production' },
            { Key: 'Project', Value: 'MyApp' }
          ],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.text()).toContain('Environment')
    expect(wrapper.text()).toContain('Production')
    expect(wrapper.text()).toContain('Project')
    expect(wrapper.text()).toContain('MyApp')
  })

  it('shows "No tags" when tags are empty', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('No tags')
  })

  it('renders loading state', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: null,
          encryption: null,
          tags: [],
          loading: true
        }
      }
    })

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading bucket details')
  })

  it('renders nothing when details is null', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: null
      }
    })

    expect(wrapper.text()).not.toContain('Versioning')
    expect(wrapper.text()).not.toContain('Encryption')
  })

  it('shows MFA Delete badge when enabled', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Enabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('MFA Delete')
  })

  it('emits addTrigger when button clicked', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    wrapper.findAll('button').find(b => b.text().includes('Add Trigger'))?.trigger('click')
    expect(wrapper.emitted('addTrigger')).toBeTruthy()
    expect(wrapper.emitted('addTrigger')?.[0]).toEqual(['test-bucket'])
  })

  it('emits viewPolicy when button clicked', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'AES256', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    wrapper.findAll('button').find(b => b.text().includes('View Policy'))?.trigger('click')
    expect(wrapper.emitted('viewPolicy')).toBeTruthy()
    expect(wrapper.emitted('viewPolicy')?.[0]).toEqual(['test-bucket'])
  })

  it('handles versioning Suspended status', () => {
    const wrapper = mount(S3BucketDetails, {
      props: {
        bucketName: 'test-bucket',
        details: {
          versioning: { status: 'Suspended', mfaDelete: 'Disabled' },
          encryption: { algorithm: 'None', keyId: '' },
          tags: [],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('Suspended')
  })
})