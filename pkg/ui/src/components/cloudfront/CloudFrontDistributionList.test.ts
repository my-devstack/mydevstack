import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { CloudFrontDistributionList } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/api/services/cloudfront', () => ({
  localViewerUrl: (id: string) => `http://${id.toLowerCase()}.cloudfront.localhost.floci.io:4566`,
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

const dist = {
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

describe('CloudFrontDistributionList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no distributions', () => {
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [], loading: true },
    })
    expect(wrapper.html()).toContain('Loading distributions...')
  })

  it('shows empty message when no distributions and not loading', () => {
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [], loading: false },
    })
    expect(wrapper.html()).toContain('No CloudFront distributions found')
  })

  it('renders distribution rows', () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    expect(wrapper.html()).toContain('e1abcdef123456.cloudfront.net')
    expect(wrapper.html()).toContain('my-bucket.s3.amazonaws.com')
    expect(wrapper.html()).toContain('Test distribution')
    expect(wrapper.html()).toContain('Enabled')
  })

  it('shows Disabled badge when distribution disabled', () => {
    const disabledDist = { ...dist, Enabled: false }
    paginatedItems.value = [disabledDist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [disabledDist], loading: false },
    })
    expect(wrapper.html()).toContain('Disabled')
  })

  it('shows local viewer URL with copy button', () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    expect(wrapper.html()).toContain('http://e1abcdef123456.cloudfront.localhost.floci.io:4566')
    expect(wrapper.find('button[title="Copy local viewer URL"]').exists()).toBe(true)
  })

  it('emits edit when edit button clicked', async () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    const editBtn = wrapper.find('button[title="Edit Distribution"]')
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([dist])
  })

  it('emits delete when delete button clicked', async () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    const deleteBtn = wrapper.find('button[title="Delete Distribution"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('emits invalidate when invalidate button clicked', async () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    const invalidateBtn = wrapper.find('button[title="Create Invalidation"]')
    await invalidateBtn.trigger('click')
    expect(wrapper.emitted('invalidate')).toBeTruthy()
  })

  it('emits grant-access when grant button clicked', async () => {
    paginatedItems.value = [dist]
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    const grantBtn = wrapper.find('button[title="Grant Bucket Access"]')
    await grantBtn.trigger('click')
    expect(wrapper.emitted('grant-access')).toBeTruthy()
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [dist]
    totalPages.value = 2
    const wrapper = mount(CloudFrontDistributionList, {
      props: { distributions: [dist], loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})
