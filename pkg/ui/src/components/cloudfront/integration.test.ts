import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import {
  CloudFrontDistributionModal,
  CloudFrontDistributionList,
  CloudFrontInvalidationList,
  CloudFrontInvalidationModal,
  CloudFrontOriginAccessControlList,
  CloudFrontOriginAccessControlModal,
  CloudFrontCodeExamples,
} from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
  })),
}))

vi.mock('@/api/services/cloudfront', () => ({
  localViewerUrl: (id: string) => `http://${id.toLowerCase()}.cloudfront.localhost.floci.io:4566`,
}))

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(() => Promise.resolve([
    { Name: 'my-bucket', CreationDate: '2024-01-01T00:00:00Z' },
  ])),
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
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :loading="loading" :variant="variant" :size="size"><slot /></button>',
    props: ['loading', 'variant', 'disabled', 'size'],
  },
}

const mockDistribution = {
  Id: 'E1ABCDEF123456',
  ARN: 'arn:aws:cloudfront::000000000000:distribution/E1ABCDEF123456',
  Status: 'Deployed',
  Enabled: true,
  DomainName: 'e1abcdef123456.cloudfront.net',
  Comment: 'Test distribution',
  PriceClass: 'PriceClass_100',
  Origins: {
    Quantity: 1,
    Items: [
      {
        Id: 'S3-my-bucket',
        DomainName: 'my-bucket.s3.amazonaws.com',
        S3OriginConfig: { OriginAccessIdentity: '' },
      },
    ],
  },
  LastModifiedTime: '2024-01-15T10:30:00Z',
}

const mockInvalidation = {
  Id: 'INV123456',
  Status: 'Completed',
  CreateTime: '2024-01-15T10:30:00Z',
  InvalidationBatch: {
    Paths: { Quantity: 1, Items: ['/*'] },
    CallerReference: 'ref1',
  },
}

const mockOAC = {
  Id: 'OAC123',
  Name: 'my-oac',
  Description: 'Test OAC',
  OriginAccessControlOriginType: 's3',
  SigningBehavior: 'always',
  SigningProtocol: 'sigv4',
}

describe('CloudFront Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  describe('CloudFrontDistributionModal', () => {
    it('renders create form when open', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create CloudFront Distribution')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: false, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).not.toContain('Create CloudFront Distribution')
    })

    it('emits create event when create clicked with valid bucket', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      wrapper.vm.form.bucketName = 'test-bucket'
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0].Origins[0].DomainName).toBe('test-bucket.s3.amazonaws.com')
      }
    })

    it('shows loading state when creating', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', loading: true, distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Creating...')
    })

    it('renders delete mode with warning', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'delete', distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('permanently delete')
      expect(wrapper.html()).toContain('cannot be undone')
    })
  })

  describe('CloudFrontDistributionList', () => {
    it('renders distribution rows', () => {
      paginatedItems.value = [mockDistribution]
      const wrapper = mount(CloudFrontDistributionList, {
        props: { distributions: [mockDistribution], loading: false },
      })
      expect(wrapper.html()).toContain('e1abcdef123456.cloudfront.net')
      expect(wrapper.html()).toContain('Enabled')
    })

    it('shows empty state', () => {
      const wrapper = mount(CloudFrontDistributionList, {
        props: { distributions: [], loading: false },
      })
      expect(wrapper.html()).toContain('No CloudFront distributions found')
    })

    it('shows loading state', () => {
      const wrapper = mount(CloudFrontDistributionList, {
        props: { distributions: [], loading: true },
      })
      expect(wrapper.html()).toContain('Loading distributions...')
    })

    it('emits edit on edit click', async () => {
      paginatedItems.value = [mockDistribution]
      const wrapper = mount(CloudFrontDistributionList, {
        props: { distributions: [mockDistribution], loading: false },
      })
      await wrapper.find('button[title="Edit Distribution"]').trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('emits delete on delete click', async () => {
      paginatedItems.value = [mockDistribution]
      const wrapper = mount(CloudFrontDistributionList, {
        props: { distributions: [mockDistribution], loading: false },
      })
      await wrapper.find('button[title="Delete Distribution"]').trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('CloudFrontInvalidationList', () => {
    it('renders invalidation rows', () => {
      paginatedItems.value = [mockInvalidation]
      const wrapper = mount(CloudFrontInvalidationList, {
        props: { invalidations: [mockInvalidation], loading: false },
      })
      expect(wrapper.html()).toContain('INV123456')
      expect(wrapper.html()).toContain('Completed')
    })

    it('shows empty state', () => {
      const wrapper = mount(CloudFrontInvalidationList, {
        props: { invalidations: [], loading: false },
      })
      expect(wrapper.html()).toContain('No invalidations found')
    })

    it('shows loading state', () => {
      const wrapper = mount(CloudFrontInvalidationList, {
        props: { invalidations: [], loading: true },
      })
      expect(wrapper.html()).toContain('Loading invalidations...')
    })
  })

  describe('CloudFrontInvalidationModal', () => {
    it('renders create form when open', () => {
      const wrapper = mount(CloudFrontInvalidationModal, {
        props: { open: true },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create Invalidation')
    })

    it('emits create event when create clicked with valid paths', async () => {
      const wrapper = mount(CloudFrontInvalidationModal, {
        props: { open: true },
        global: { stubs },
      })
      wrapper.vm.form.paths = '/*'
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0].Paths).toEqual(['/*'])
      }
    })
  })

  describe('CloudFrontOriginAccessControlList', () => {
    it('renders OAC rows', () => {
      paginatedItems.value = [mockOAC]
      const wrapper = mount(CloudFrontOriginAccessControlList, {
        props: { originAccessControls: [mockOAC], loading: false },
      })
      expect(wrapper.html()).toContain('my-oac')
    })

    it('shows empty state', () => {
      const wrapper = mount(CloudFrontOriginAccessControlList, {
        props: { originAccessControls: [], loading: false },
      })
      expect(wrapper.html()).toContain('No origin access controls found')
    })

    it('emits delete on delete click', async () => {
      paginatedItems.value = [mockOAC]
      const wrapper = mount(CloudFrontOriginAccessControlList, {
        props: { originAccessControls: [mockOAC], loading: false },
      })
      await wrapper.find('button[title="Delete OAC"]').trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('CloudFrontOriginAccessControlModal', () => {
    it('renders create form when open', () => {
      const wrapper = mount(CloudFrontOriginAccessControlModal, {
        props: { open: true },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create Origin Access Control')
    })

    it('emits create event when create clicked with valid name', async () => {
      const wrapper = mount(CloudFrontOriginAccessControlModal, {
        props: { open: true },
        global: { stubs },
      })
      wrapper.vm.form.name = 'test-oac'
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0].Name).toBe('test-oac')
      }
    })
  })

  describe('CloudFrontCodeExamples', () => {
    it('renders AWS CLI commands', () => {
      const wrapper = mount(CloudFrontCodeExamples, {
        props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
      })
      expect(wrapper.html()).toContain('aws cloudfront create-distribution')
      expect(wrapper.html()).toContain('aws cloudfront create-invalidation')
      expect(wrapper.html()).toContain('aws cloudfront create-origin-access-control')
    })
  })
})
