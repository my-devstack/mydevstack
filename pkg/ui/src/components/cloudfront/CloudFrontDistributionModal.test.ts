import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CloudFrontDistributionModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(() => Promise.resolve([
    { Name: 'my-bucket', CreationDate: '2024-01-01T00:00:00Z' },
    { Name: 'another-bucket', CreationDate: '2024-01-02T00:00:00Z' },
  ])),
}))

const stubs = {
  FormInput: {
    template: '<div><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
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
  LastModifiedTime: '2024-01-15T10:30:00Z',
}

const mockFullDistribution = {
  Id: 'E1ABCDEF123456',
  ARN: 'arn:aws:cloudfront::000000000000:distribution/E1ABCDEF123456',
  Status: 'Deployed',
  DomainName: 'e1abcdef123456.cloudfront.net',
  DistributionConfig: {
    Comment: 'Test distribution',
    Enabled: true,
    DefaultRootObject: 'index.html',
    PriceClass: 'PriceClass_100',
    Origins: [
      {
        Id: 'S3-my-bucket',
        DomainName: 'my-bucket.s3.amazonaws.com',
        S3OriginConfig: { OriginAccessIdentity: '' },
      },
    ],
    DefaultCacheBehavior: {
      ViewerProtocolPolicy: 'redirect-to-https' as const,
    },
  },
}

describe('CloudFrontDistributionModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CloudFrontDistributionModal, {
      props: { open: false, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
      global: { stubs },
    })
    expect(wrapper.html()).not.toContain('Create CloudFront Distribution')
  })

  describe('create mode', () => {
    it('renders create form when open', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create CloudFront Distribution')
      expect(wrapper.html()).toContain('S3 Bucket Origin')
      expect(wrapper.html()).toContain('Default Root Object')
    })

    it('shows origin access radio buttons', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Public bucket')
      expect(wrapper.html()).toContain('Origin Access Control (OAC)')
    })

    it('emits create with form data when create clicked', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      wrapper.vm.form.bucketName = 'my-bucket'
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0].Origins[0].DomainName).toBe('my-bucket.s3.amazonaws.com')
        expect(emitted[0][0].Enabled).toBe(true)
        expect(emitted[0][0].PriceClass).toBe('PriceClass_100')
      }
    })

    it('does not emit create when bucketName is empty', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      wrapper.vm.form.bucketName = ''
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('create')).toBeFalsy()
    })

    it('shows loading state when creating', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'create', loading: true, distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Creating...')
    })

    it('resets form when opened', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: false, mode: 'create', distribution: null, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      wrapper.vm.form.bucketName = 'dirty'
      await wrapper.setProps({ open: true })
      expect(wrapper.vm.form.bucketName).toBe('')
    })
  })

  describe('edit mode', () => {
    it('renders edit form with distribution data', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'edit', distribution: mockDistribution, fullDistribution: mockFullDistribution, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Edit Distribution')
      expect(wrapper.html()).toContain('Comment')
    })

    it('emits update when update clicked', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'edit', distribution: mockDistribution, fullDistribution: mockFullDistribution, originAccessControls: [] },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('update')).toBeTruthy()
    })

    it('shows Grant Bucket Access button', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'edit', distribution: mockDistribution, fullDistribution: mockFullDistribution, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Grant Bucket Access')
    })
  })

  describe('view mode', () => {
    it('renders distribution details', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'view', distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Distribution Details')
      expect(wrapper.html()).toContain('E1ABCDEF123456')
      expect(wrapper.html()).toContain('e1abcdef123456.cloudfront.net')
    })

    it('emits update:open false when close clicked', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'view', distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('update:open')).toBeTruthy()
    })
  })

  describe('delete mode', () => {
    it('renders delete confirmation', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'delete', distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Delete Distribution')
      expect(wrapper.html()).toContain('permanently delete')
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('emits delete when delete clicked', async () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'delete', distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('shows loading state when deleting', () => {
      const wrapper = mount(CloudFrontDistributionModal, {
        props: { open: true, mode: 'delete', loading: true, distribution: mockDistribution, fullDistribution: null, originAccessControls: [] },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Deleting...')
    })
  })
})
