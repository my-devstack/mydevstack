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

    expect(wrapper.find('h3').text()).toContain('Actions')
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  it('renders empty state when no objects and no folders', () => {
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

    const viewButton = wrapper.find('button[title="View"]')
    await viewButton.trigger('click')

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

    const downloadButton = wrapper.find('button[title="Download"]')
    await downloadButton.trigger('click')

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

  it('renders upload files icon button', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
        uploading: false,
      },
    })

    const uploadLabel = wrapper.find('label[title="Upload Files"]')
    expect(uploadLabel.exists()).toBe(true)
  })

  it('file input has multiple attribute', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    const fileInput = wrapper.find('input[type="file"][multiple]')
    expect(fileInput.exists()).toBe(true)
  })

  it('folder input has webkitdirectory attribute', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    const folderInput = wrapper.find('input[type="file"][webkitdirectory]')
    expect(folderInput.exists()).toBe(true)
  })

  it('renders upload folder icon button', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    const uploadFolderLabel = wrapper.find('label[title="Upload Folder"]')
    expect(uploadFolderLabel.exists()).toBe(true)
  })

  it('emits upload-folder when folder selected', async () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
      },
    })

    const folderInput = wrapper.find('input[type="file"][webkitdirectory]')
    await folderInput.trigger('change')

    expect(wrapper.emitted('upload-folder')).toBeTruthy()
  })

  it('folder input disabled when uploading', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [],
        bucketName: 'test-bucket',
        uploading: true,
      },
    })

    const folderInput = wrapper.find('input[type="file"][webkitdirectory]')
    expect(folderInput.attributes('disabled')).toBeDefined()
  })

  it('every action has accessible name (title and aria-label)', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'file.txt', Size: 100 }],
        prefixes: ['folder/'],
        currentPrefix: '',
        bucketName: 'test-bucket',
      },
    })

    const expectedTitles = ['Upload Files', 'Upload Folder', 'Create Folder', 'View', 'Download', 'Copy Link', 'Delete']
    for (const title of expectedTitles) {
      const control = wrapper.find(`[title="${title}"]`)
      expect(control.exists(), `missing title="${title}"`).toBe(true)
      expect(control.attributes('aria-label'), `missing aria-label for "${title}"`).toBe(title)
    }
  })

  it('action buttons in rows have title and aria-label', () => {
    const wrapper = mount(S3ObjectsList, {
      props: {
        objects: [{ Key: 'file.txt', Size: 100 }],
        bucketName: 'test-bucket',
      },
    })

    const rowTitles = ['View', 'Download', 'Copy Link', 'Delete']
    for (const title of rowTitles) {
      const button = wrapper.find(`button[title="${title}"]`)
      expect(button.exists(), `missing button[title="${title}"]`).toBe(true)
      expect(button.attributes('aria-label')).toBe(title)
    }
  })

  // New folder navigation tests
  describe('Folder Navigation', () => {
    it('renders folder rows when prefixes provided', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [],
          prefixes: ['folder1/', 'folder2/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const folderRows = wrapper.findAll('tbody tr').filter(tr => !tr.find('button[title="Delete"]').exists())
      expect(folderRows).toHaveLength(2)
      expect(wrapper.text()).toContain('folder1')
      expect(wrapper.text()).toContain('folder2')
    })

    it('shows folders above files', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [{ Key: 'file.txt', Size: 100 }],
          prefixes: ['folder/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(2)
      expect(rows[0].text()).toContain('folder')
      expect(rows[1].text()).toContain('file.txt')
    })

    it('emits open-folder when folder row clicked', async () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [],
          prefixes: ['folder/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const folderRow = wrapper.findAll('tbody tr')[0]
      await folderRow.trigger('click')

      expect(wrapper.emitted('open-folder')).toBeTruthy()
      expect(wrapper.emitted('open-folder')?.[0]).toEqual(['folder/'])
    })

    it('displays relative file names when in folder', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [{ Key: 'folder/file.txt', Size: 100 }],
          prefixes: [],
          currentPrefix: 'folder/',
          bucketName: 'test-bucket',
        },
      })

      expect(wrapper.text()).toContain('file.txt')
      expect(wrapper.text()).not.toContain('folder/file.txt')
    })

    it('shows "-" for folder size and date', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [],
          prefixes: ['folder/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const folderRow = wrapper.findAll('tbody tr')[0]
      const cells = folderRow.findAll('td')
      expect(cells[1].text()).toContain('-')
      expect(cells[2].text()).toContain('-')
    })

    it('shows "Folder" label for folder rows', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [],
          prefixes: ['folder/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const folderRow = wrapper.findAll('tbody tr')[0]
      expect(folderRow.text()).toContain('Folder')
    })

    it('renders folder icon', () => {
      const wrapper = mount(S3ObjectsList, {
        props: {
          objects: [],
          prefixes: ['folder/'],
          currentPrefix: '',
          bucketName: 'test-bucket',
        },
      })

      const folderIcon = wrapper.find('tbody tr svg')
      expect(folderIcon.exists()).toBe(true)
    })
  })
})