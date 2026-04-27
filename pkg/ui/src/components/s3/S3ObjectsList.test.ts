import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import S3ObjectsList from './S3ObjectsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

describe('S3ObjectsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  const mockObjects = [
    { Key: 'file1.txt', Size: 1024, LastModified: '2024-01-01T00:00:00Z' },
    { Key: 'file2.txt', Size: 2048, LastModified: '2024-01-02T00:00:00Z' },
  ]

  it('renders upload section', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('Upload File')
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  it('renders empty state when no objects', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('No objects in this bucket')
  })

  it('renders objects table when objects exist', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: mockObjects,
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('file1.txt')
    expect(wrapper.text()).toContain('file2.txt')
  })

  it('shows uploading state when uploading prop is true', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
        uploading: true,
      },
    })

    expect(wrapper.text()).toContain('Uploading...')
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('disabled')).toBeDefined()
  })

  it('emits upload-file when file selected', async () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const fileInput = wrapper.find('input[type="file"]')
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })

    await fileInput.trigger('change')

    expect(wrapper.emitted('upload-file')).toBeTruthy()
  })

  it('emits select-object when view button clicked', async () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: mockObjects,
        bucketName: 'test-bucket',
      },
    })

    const viewButton = wrapper.findAll('button').find(b => b.text() === 'View')
    await viewButton?.trigger('click')

    expect(wrapper.emitted('select-object')).toBeTruthy()
    expect(wrapper.emitted('select-object')?.[0]).toEqual(['file1.txt'])
  })

  it('emits download-object when download button clicked', async () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: mockObjects,
        bucketName: 'test-bucket',
      },
    })

    const downloadButton = wrapper.findAll('button').find(b => b.text() === 'Download')
    await downloadButton?.trigger('click')

    expect(wrapper.emitted('download-object')).toBeTruthy()
    expect(wrapper.emitted('download-object')?.[0]).toEqual(['file1.txt'])
  })

  it('emits delete-object when delete button clicked', async () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: mockObjects,
        bucketName: 'test-bucket',
      },
    })

    const deleteButton = wrapper.find('button[title="Delete"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete-object')).toBeTruthy()
    expect(wrapper.emitted('delete-object')?.[0]).toEqual(['file1.txt'])
  })

  it('formats size correctly - bytes', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'small.txt', Size: 512 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('512 B')
  })

  it('formats size correctly - kilobytes', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'medium.txt', Size: 1024 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('1 KB')
  })

  it('formats size correctly - megabytes', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'large.txt', Size: 1048576 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('1 MB')
  })

  it('formats size correctly - gigabytes', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'huge.txt', Size: 1073741824 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('1 GB')
  })

  it('handles undefined size', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'no-size.txt' }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('0 B')
  })

  it('handles string size', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'string-size.txt', Size: '2048' }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('2 KB')
  })

  it('handles invalid size gracefully', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'invalid-size.txt', Size: -1 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('0 B')
  })

  it('handles missing LastModified', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'no-date.txt', Size: 100 }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('Unknown')
  })

  it('handles invalid LastModified format', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'invalid-date.txt', Size: 100, LastModified: 'invalid' }],
        bucketName: 'test-bucket',
      },
    })

    expect(wrapper.text()).toContain('invalid')
  })

  it('renders all table headers', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: mockObjects,
        bucketName: 'test-bucket',
      },
    })

    const headers = wrapper.findAll('th')
    expect(headers[0].text()).toContain('Name')
    expect(headers[1].text()).toContain('Size')
    expect(headers[2].text()).toContain('Last Modified')
    expect(headers[3].text()).toContain('Actions')
  })

  it('renders multiple objects correctly', () => {
    const multipleObjects = [
      { Key: 'a.txt', Size: 100, LastModified: '2024-01-01' },
      { Key: 'b.txt', Size: 200, LastModified: '2024-01-02' },
      { Key: 'c.txt', Size: 300, LastModified: '2024-01-03' },
    ]

    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: multipleObjects,
        bucketName: 'test-bucket',
      },
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('file input is disabled when uploading', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
        uploading: true,
      },
    })

    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('disabled')).toBe('')
  })

  it('shows choose file text when not uploading', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
        uploading: false,
      },
    })

    expect(wrapper.text()).toContain('Choose File')
  })
})