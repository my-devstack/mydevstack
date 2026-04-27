import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3ViewModal from './S3ViewModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

describe('S3ViewModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(S3ViewModal).toBeDefined()
  })

  it('has required props defined', () => {
    expect(S3ViewModal.props).toBeDefined()
    expect(S3ViewModal.props.open).toBeDefined()
    expect(S3ViewModal.props.fileName).toBeDefined()
    expect(S3ViewModal.props.content).toBeDefined()
    expect(S3ViewModal.props.contentType).toBeDefined()
    expect(S3ViewModal.props.bucketName).toBeDefined()
  })

  it('open prop is required', () => {
    expect(S3ViewModal.props.open.required).toBe(true)
  })

  it('fileName prop is defined', () => {
    expect(S3ViewModal.props.fileName).toBeDefined()
  })

  it('content prop is defined', () => {
    expect(S3ViewModal.props.content).toBeDefined()
  })

  it('contentType prop is defined', () => {
    expect(S3ViewModal.props.contentType).toBeDefined()
  })

  it('bucketName prop is required', () => {
    expect(S3ViewModal.props.bucketName.required).toBe(true)
  })

  it('loading prop is optional boolean', () => {
    expect(S3ViewModal.props.loading.required).toBeFalsy()
    expect(S3ViewModal.props.loading.type).toBe(Boolean)
  })

  it('error prop is optional string or null', () => {
    expect(S3ViewModal.props.error.required).toBeFalsy()
  })

  it('emits update:open event', () => {
    expect(S3ViewModal.emits).toBeDefined()
    expect(S3ViewModal.emits).toContain('update:open')
  })

  it('emits close event', () => {
    expect(S3ViewModal.emits).toBeDefined()
    expect(S3ViewModal.emits).toContain('close')
  })

  it('emits download event', () => {
    expect(S3ViewModal.emits).toBeDefined()
    expect(S3ViewModal.emits).toContain('download')
  })

  it('computes isTextContent for text/plain', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'Hello',
        contentType: 'text/plain',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(true)
  })

  it('computes isTextContent for text/html', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.html',
        content: '<h1>Hello</h1>',
        contentType: 'text/html',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(true)
  })

  it('computes isTextContent for text/css', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.css',
        content: 'body { color: red; }',
        contentType: 'text/css',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(true)
  })

  it('computes isImageContent for image types', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.png',
        content: '',
        contentType: 'image/png',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isImageContent).toBe(true)
  })

  it('computes isJsonContent for application/json', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.json',
        content: '{"key":"value"}',
        contentType: 'application/json',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isJsonContent).toBe(true)
  })

  it('computes isJsonContent for types containing json', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.json',
        content: '{"key":"value"}',
        contentType: 'application/vnd.api+json',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isJsonContent).toBe(true)
  })

  it('isTextContent is false for non-text types', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.pdf',
        content: '',
        contentType: 'application/pdf',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(false)
  })

  it('isImageContent is false for non-image types', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'Hello',
        contentType: 'text/plain',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isImageContent).toBe(false)
  })

  it('isJsonContent is false for non-json types', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'Hello',
        contentType: 'text/plain',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isJsonContent).toBe(false)
  })

  it('handles empty content gracefully', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: '',
        contentType: 'text/plain',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(true)
  })

  it('handles whitespace content', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: '   \n\t  ',
        contentType: 'text/plain',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(true)
  })

  it('handles unknown content type', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.bin',
        content: '',
        contentType: 'application/octet-stream',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.vm.isTextContent).toBe(false)
    expect(wrapper.vm.isImageContent).toBe(false)
    expect(wrapper.vm.isJsonContent).toBe(false)
  })

  it('renders with different content types', () => {
    const types = ['text/plain', 'text/html', 'text/css', 'application/json', 'image/png', 'image/jpeg', 'application/pdf']
    types.forEach(type => {
      const wrapper = mount(S3ViewModal, {
        props: {
          open: true,
          fileName: 'test.file',
          content: 'test',
          contentType: type,
          bucketName: 'test-bucket',
        },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  it('renders with different loading states', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'test',
        contentType: 'text/plain',
        loading: false,
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders with different error states', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'test',
        contentType: 'text/plain',
        error: null,
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders with error message', () => {
    const wrapper = mount(S3ViewModal, {
      props: {
        open: true,
        fileName: 'test.txt',
        content: 'test',
        contentType: 'text/plain',
        error: 'Failed to load',
        bucketName: 'test-bucket',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})