import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3CodeExamples from './S3CodeExamples.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
    publicEndpoint: 'http://127.0.0.1:4566',
  }),
}))

describe('S3CodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  const defaultProps = {
    region: 'us-east-1',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  }

  it('exists as a component', () => {
    expect(S3CodeExamples).toBeDefined()
  })

  it('renders with all props', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props('region')).toBe('us-east-1')
    expect(wrapper.props('accessKey')).toBe('test-access-key')
    expect(wrapper.props('secretKey')).toBe('test-secret-key')
  })

  it('renders Usage Examples heading', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('Usage Examples')
  })

  it('renders all language tabs', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts).toContain('AWS CLI')
    expect(buttonTexts).toContain('JavaScript')
    expect(buttonTexts).toContain('Python')
    expect(buttonTexts).toContain('Go')
  })

  it('renders code block', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    expect(wrapper.find('pre').exists()).toBe(true)
  })

  it('shows AWS CLI code by default', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('aws s3 ls')
    expect(wrapper.text()).toContain('aws s3 mb')
  })

  it('switches to JavaScript code when tab clicked', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    expect(wrapper.text()).toContain('S3Client')
    expect(wrapper.text()).toContain('ListBucketsCommand')
  })

  it('switches to Python code when tab clicked', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const pythonButton = wrapper.findAll('button').find(b => b.text() === 'Python')
    await pythonButton!.trigger('click')

    expect(wrapper.text()).toContain('boto3.client')
    expect(wrapper.text()).toContain('list_buckets')
  })

  it('switches to Go code when tab clicked', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const goButton = wrapper.findAll('button').find(b => b.text() === 'Go')
    await goButton!.trigger('click')

    expect(wrapper.text()).toContain('s3.New')
    expect(wrapper.text()).toContain('ListBuckets')
  })

  it('interpolates region into JavaScript code', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: { ...defaultProps, region: 'eu-west-1' },
    })

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    expect(wrapper.text()).toContain("region: 'eu-west-1'")
  })

  it('AWS CLI examples include endpoint URL', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('--endpoint-url http://127.0.0.1:4566')
  })

  it('JavaScript examples include endpoint URL', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    expect(wrapper.text()).toContain("endpoint: 'http://127.0.0.1:4566'")
  })

  it('Python examples include endpoint URL', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const pythonButton = wrapper.findAll('button').find(b => b.text() === 'Python')
    await pythonButton!.trigger('click')

    expect(wrapper.text()).toContain("endpoint_url='http://127.0.0.1:4566'")
  })

  it('Go examples include endpoint URL', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const goButton = wrapper.findAll('button').find(b => b.text() === 'Go')
    await goButton!.trigger('click')

    expect(wrapper.text()).toContain('BaseURL: aws.String("http://127.0.0.1:4566")')
  })

  it('code uses forcePathStyle for JavaScript', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    expect(wrapper.text()).toContain('forcePathStyle: true')
  })

  it('has all example operations in AWS CLI', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const code = wrapper.find('pre').text()
    expect(code).toContain('aws s3 ls')
    expect(code).toContain('aws s3 mb')
    expect(code).toContain('aws s3 cp')
    expect(code).toContain('aws s3 rm')
    expect(code).toContain('aws s3 rb')
  })

  it('has all example operations in JavaScript', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    const code = wrapper.find('pre').text()
    expect(code).toContain('ListBucketsCommand')
    expect(code).toContain('PutObjectCommand')
    expect(code).toContain('GetObjectCommand')
    expect(code).toContain('DeleteObjectCommand')
  })

  it('has all example operations in Python', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const pythonButton = wrapper.findAll('button').find(b => b.text() === 'Python')
    await pythonButton!.trigger('click')

    const code = wrapper.find('pre').text()
    expect(code).toContain('list_buckets')
    expect(code).toContain('put_object')
    expect(code).toContain('get_object')
    expect(code).toContain('delete_object')
  })

  it('has all example operations in Go', async () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const goButton = wrapper.findAll('button').find(b => b.text() === 'Go')
    await goButton!.trigger('click')

    const code = wrapper.find('pre').text()
    expect(code).toContain('ListBuckets')
    expect(code).toContain('PutObject')
    expect(code).toContain('GetObject')
  })

  it('renders code with monospace font', () => {
    const wrapper = mount(S3CodeExamples, {
      props: defaultProps,
    })

    const pre = wrapper.find('pre')
    expect(pre.classes()).toContain('font-mono')
  })

  it('handles empty credentials', () => {
    const wrapper = mount(S3CodeExamples, {
      props: {
        region: 'us-east-1',
        accessKey: '',
        secretKey: '',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('handles special characters in region', () => {
    const wrapper = mount(S3CodeExamples, {
      props: {
        region: 'us-west-2',
        accessKey: 'test-key',
        secretKey: 'test-secret',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})