import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CloudFrontCodeExamples } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/components/common/CodeSnippet.vue', () => ({
  default: {
    name: 'CodeSnippet',
    template: '<div class="code-snippet"><h3>{{ title }}</h3><div v-for="s in snippets" :key="s.language" class="snippet">{{ s.code }}</div></div>',
    props: ['snippets', 'title', 'defaultTab', 'disableHighlight'],
  },
}))

describe('CloudFrontCodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('CloudFront Usage Examples')
  })

  it('includes create-distribution command', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws cloudfront create-distribution')
  })

  it('includes create-invalidation command', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws cloudfront create-invalidation')
  })

  it('includes create-origin-access-control command', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws cloudfront create-origin-access-control')
  })

  it('includes list-distributions command', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws cloudfront list-distributions')
  })

  it('uses default distribution ID', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('E1ABCDEF123456')
  })

  it('uses custom distribution ID when provided', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test', distributionId: 'E2CUSTOM' },
    })
    expect(wrapper.html()).toContain('E2CUSTOM')
  })

  it('includes S3 origin domain in examples', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('my-bucket.s3.amazonaws.com')
  })

  it('includes CachePolicyId in examples', () => {
    const wrapper = mount(CloudFrontCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('658327ea-f89d-4fab-a63d-7e88639e58f6')
  })
})
