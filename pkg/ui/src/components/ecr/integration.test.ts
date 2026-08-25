import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { ECRModal, ECRRepositoryList, ECRImageList, ECRCodeExamples } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
  })),
}))

const paginatedItems = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)

vi.mock('@/composables/usePagination', () => ({
  usePagination: vi.fn(() => ({
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    goToPage: vi.fn(),
    perPageOptions: [5, 10, 20, 50],
  })),
}))

vi.mock('@/components/common/CodeSnippet.vue', () => ({
  default: {
    name: 'CodeSnippet',
    template: '<div class="code-snippet"><h3>{{ title }}</h3><div v-for="s in snippets" :key="s.language" class="snippet">{{ s.code }}</div></div>',
    props: ['snippets', 'title', 'defaultTab', 'disableHighlight'],
  },
}))

const stubs = {
  FormInput: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :loading="loading" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
}

const mockRepository = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:000000000000:repository/my-app',
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  RepositoryUri: '000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
}

const mockImage = {
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  ImageDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ImageTags: ['latest'],
  ImageSizeInBytes: 5242880,
  ImagePushedAt: '2024-01-15T10:30:00Z',
}

describe('ECR Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  describe('ECRModal', () => {
    it('renders create form when open', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create ECR Repository')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(ECRModal, {
        props: { open: false, mode: 'create', repository: null },
        global: { stubs },
      })
      expect(wrapper.html()).not.toContain('Create ECR Repository')
    })

    it('has repository name input', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('emits create event when create clicked with valid name', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      wrapper.vm.form.repositoryName = 'test-repo'
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0].repositoryName).toBe('test-repo')
      }
    })

    it('shows loading state when creating', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', loading: true, repository: null },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Creating...')
    })

    it('renders view mode with repository details', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'view', repository: mockRepository },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Repository Details')
      expect(wrapper.html()).toContain('my-app')
    })

    it('renders delete mode with warning', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'delete', repository: mockRepository },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('permanently delete')
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('emits delete event when delete clicked', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'delete', repository: mockRepository },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('ECRRepositoryList', () => {
    it('renders repository rows', () => {
      paginatedItems.value = [mockRepository]
      const wrapper = mount(ECRRepositoryList, {
        props: { repositories: [mockRepository], loading: false },
      })
      expect(wrapper.html()).toContain('my-app')
      expect(wrapper.html()).toContain('MUTABLE')
    })

    it('shows empty state', () => {
      const wrapper = mount(ECRRepositoryList, {
        props: { repositories: [], loading: false },
      })
      expect(wrapper.html()).toContain('No ECR repositories found')
    })

    it('shows loading state', () => {
      const wrapper = mount(ECRRepositoryList, {
        props: { repositories: [], loading: true },
      })
      expect(wrapper.html()).toContain('Loading repositories...')
    })

    it('emits view-repository on row click', async () => {
      paginatedItems.value = [mockRepository]
      const wrapper = mount(ECRRepositoryList, {
        props: { repositories: [mockRepository], loading: false },
      })
      await wrapper.find('.cursor-pointer').trigger('click')
      expect(wrapper.emitted('view-repository')).toBeTruthy()
    })

    it('emits delete-repository on delete click', async () => {
      paginatedItems.value = [mockRepository]
      const wrapper = mount(ECRRepositoryList, {
        props: { repositories: [mockRepository], loading: false },
      })
      await wrapper.find('button[title="Delete"]').trigger('click')
      expect(wrapper.emitted('delete-repository')).toBeTruthy()
    })
  })

  describe('ECRImageList', () => {
    it('renders image rows', () => {
      paginatedItems.value = [mockImage]
      const wrapper = mount(ECRImageList, {
        props: { images: [mockImage], repositoryName: 'my-app', loading: false },
      })
      expect(wrapper.html()).toContain('latest')
    })

    it('shows empty state', () => {
      const wrapper = mount(ECRImageList, {
        props: { images: [], repositoryName: 'my-app', loading: false },
      })
      expect(wrapper.html()).toContain('No images found in this repository')
    })

    it('shows loading state', () => {
      const wrapper = mount(ECRImageList, {
        props: { images: [], repositoryName: 'my-app', loading: true },
      })
      expect(wrapper.html()).toContain('Loading images...')
    })

    it('emits delete-image on delete click', async () => {
      paginatedItems.value = [mockImage]
      const wrapper = mount(ECRImageList, {
        props: { images: [mockImage], repositoryName: 'my-app', loading: false },
      })
      await wrapper.find('button[title="Delete"]').trigger('click')
      expect(wrapper.emitted('delete-image')).toBeTruthy()
    })
  })

  describe('ECRCodeExamples', () => {
    it('renders AWS CLI push/pull commands', () => {
      const wrapper = mount(ECRCodeExamples, {
        props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
      })
      expect(wrapper.html()).toContain('aws ecr get-login-password')
      expect(wrapper.html()).toContain('docker push')
      expect(wrapper.html()).toContain('docker pull')
      expect(wrapper.html()).toContain('aws ecr create-repository')
      expect(wrapper.html()).toContain('aws ecr delete-repository')
    })
  })
})