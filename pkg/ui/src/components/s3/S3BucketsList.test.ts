import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3BucketsList from './S3BucketsList.vue'
import S3BucketDetails from './S3BucketDetails.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

describe('S3BucketsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3BucketsList).toBeDefined()
  })

  it('has buckets prop defined', () => {
    expect(S3BucketsList.props).toBeDefined()
    expect(S3BucketsList.props.buckets).toBeDefined()
  })

  it('buckets prop is required array', () => {
    expect(S3BucketsList.props.buckets.required).toBe(true)
    expect(S3BucketsList.props.buckets.type).toBe(Array)
  })

  it('loading prop is optional boolean', () => {
    expect(S3BucketsList.props.loading.required).toBeFalsy()
    expect(S3BucketsList.props.loading.type).toBe(Boolean)
  })

  it('emits select-bucket event', () => {
    expect(S3BucketsList.emits).toBeDefined()
    expect(S3BucketsList.emits).toContain('select-bucket')
  })

  it('emits delete-bucket event', () => {
    expect(S3BucketsList.emits).toBeDefined()
    expect(S3BucketsList.emits).toContain('delete-bucket')
  })

  it('renders loading state', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [],
        loading: true,
      },
    })

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders empty state when no buckets', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('No buckets found')
  })

  it('renders buckets list when buckets exist', () => {
    const mockBuckets = [
      { Name: 'bucket1', CreationDate: '2024-01-01T00:00:00Z' },
      { Name: 'bucket2', CreationDate: '2024-01-02T00:00:00Z' },
    ]

    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: mockBuckets,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('bucket1')
    expect(wrapper.text()).toContain('bucket2')
  })

  it('handles bucket without CreationDate', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [{ Name: 'bucket-no-date' }],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('bucket-no-date')
  })

  it('handles invalid date format gracefully', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [{ Name: 'bucket-invalid', CreationDate: 'invalid-date' }],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('bucket-invalid')
  })

  it('handles empty buckets array', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [],
        loading: false,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('handles single bucket', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [{ Name: 'single-bucket' }],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('single-bucket')
  })

  it('handles many buckets', () => {
    const manyBuckets = Array.from({ length: 50 }, (_, i) => ({
      Name: `bucket-${i}`,
      CreationDate: '2024-01-01T00:00:00Z'
    }))

    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: manyBuckets,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('bucket-0')
    expect(wrapper.text()).toContain('bucket-49')
  })

  it('emits expand-bucket event when clicking bucket row', () => {
    const wrapper = mount(S3BucketsList, {
      props: {
        buckets: [{ Name: 'test-bucket', CreationDate: '2024-01-01T00:00:00Z' }],
        loading: false,
      },
    })

    wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('expand-bucket')).toBeTruthy()
    expect(wrapper.emitted('expand-bucket')?.[0]).toEqual(['test-bucket'])
  })

  

  it('has bucketDetails prop defined', () => {
    expect(S3BucketsList.props).toBeDefined()
    expect(S3BucketsList.props.bucketDetails).toBeDefined()
  })

  it('bucketDetails prop is optional', () => {
    expect(S3BucketsList.props.bucketDetails.required).toBeFalsy()
  })

  it('emits expand-bucket event', () => {
    expect(S3BucketsList.emits).toBeDefined()
    expect(S3BucketsList.emits).toContain('expand-bucket')
  })

  it('emits add-trigger event', () => {
    expect(S3BucketsList.emits).toBeDefined()
    expect(S3BucketsList.emits).toContain('add-trigger')
  })

  it('emits view-policy event', () => {
    expect(S3BucketsList.emits).toBeDefined()
    expect(S3BucketsList.emits).toContain('view-policy')
  })
})