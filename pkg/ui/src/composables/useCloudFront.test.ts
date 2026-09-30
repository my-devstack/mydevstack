import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCloudFront } from './useCloudFront'

vi.mock('@/api/services/cloudfront', () => ({
  listDistributions: vi.fn(),
  createDistribution: vi.fn(),
  getDistribution: vi.fn(),
  updateDistribution: vi.fn(),
  deleteDistribution: vi.fn(),
  listInvalidations: vi.fn(),
  createInvalidation: vi.fn(),
  listOriginAccessControls: vi.fn(),
  createOriginAccessControl: vi.fn(),
  deleteOriginAccessControl: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as cloudfrontApi from '@/api/services/cloudfront'

const mockDistribution = {
  Id: 'E123',
  ARN: 'arn:aws:cloudfront::000000000000:distribution/E123',
  Status: 'Deployed',
  Enabled: true,
  DomainName: 'd123.cloudfront.net',
  Comment: 'test distribution',
}

const mockInvalidation = {
  Id: 'I123',
  Status: 'Completed',
  CreateTime: '2024-01-15T10:30:00Z',
}

const mockOAC = {
  Id: 'OAC123',
  Name: 'my-oac',
  OriginAccessControlOriginType: 's3',
  SigningBehavior: 'always',
  SigningProtocol: 'sigv4',
}

describe('useCloudFront', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const {
      distributions,
      loading,
      creating,
      deleting,
      error,
      invalidations,
      invalidationsLoading,
      originAccessControls,
      oacsLoading,
    } = useCloudFront()
    expect(distributions.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(creating.value).toBe(false)
    expect(deleting.value).toBe(false)
    expect(error.value).toBeNull()
    expect(invalidations.value).toEqual([])
    expect(invalidationsLoading.value).toBe(false)
    expect(originAccessControls.value).toEqual([])
    expect(oacsLoading.value).toBe(false)
  })

  it('loadDistributions success', async () => {
    const mockDists = [mockDistribution]
    vi.mocked(cloudfrontApi.listDistributions).mockResolvedValue({
      DistributionList: { Items: mockDists, Quantity: 1 },
    })

    const { loadDistributions, distributions, loading } = useCloudFront()

    await loadDistributions()

    expect(cloudfrontApi.listDistributions).toHaveBeenCalled()
    expect(distributions.value).toHaveLength(1)
    expect(loading.value).toBe(false)
  })

  it('loadDistributions handles empty result', async () => {
    vi.mocked(cloudfrontApi.listDistributions).mockResolvedValue({
      DistributionList: { Items: [], Quantity: 0 },
    })

    const { loadDistributions, distributions } = useCloudFront()

    await loadDistributions()

    expect(distributions.value).toEqual([])
  })

  it('loadDistributions handles error', async () => {
    vi.mocked(cloudfrontApi.listDistributions).mockRejectedValue(new Error('Network error'))

    const { loadDistributions, loading, error } = useCloudFront()

    await loadDistributions()

    expect(loading.value).toBe(false)
    expect(error.value).toBe('Network error')
  })

  it('createDistribution calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.createDistribution).mockResolvedValue({
      Distribution: { Id: 'E123', ARN: '', Status: '', DomainName: '', DistributionConfig: {} },
      ETag: 'E123ETag',
    })
    vi.mocked(cloudfrontApi.listDistributions).mockResolvedValue({
      DistributionList: { Items: [mockDistribution], Quantity: 1 },
    })

    const { createDistribution, creating } = useCloudFront()

    await createDistribution({
      Comment: 'test',
      Origins: [{ DomainName: 'bucket.s3.amazonaws.com' }],
    })

    expect(cloudfrontApi.createDistribution).toHaveBeenCalledWith(
      expect.objectContaining({ Comment: 'test' }),
    )
    expect(cloudfrontApi.listDistributions).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('createDistribution throws on error', async () => {
    vi.mocked(cloudfrontApi.createDistribution).mockRejectedValue(new Error('Failed'))

    const { createDistribution, creating } = useCloudFront()

    await expect(
      createDistribution({
        Comment: 'test',
        Origins: [{ DomainName: 'bucket.s3.amazonaws.com' }],
      }),
    ).rejects.toThrow()
    expect(creating.value).toBe(false)
  })

  it('getDistribution returns distribution', async () => {
    vi.mocked(cloudfrontApi.getDistribution).mockResolvedValue({
      Distribution: { Id: 'E123', ARN: '', Status: '', DomainName: '', DistributionConfig: {} },
      ETag: 'E123ETag',
    })

    const { getDistribution } = useCloudFront()

    const result = await getDistribution('E123')

    expect(cloudfrontApi.getDistribution).toHaveBeenCalledWith('E123')
    expect(result?.Distribution.Id).toBe('E123')
  })

  it('getDistribution handles error', async () => {
    vi.mocked(cloudfrontApi.getDistribution).mockRejectedValue(new Error('Failed'))

    const { getDistribution } = useCloudFront()

    const result = await getDistribution('E999')

    expect(result).toBeNull()
  })

  it('updateDistribution calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.updateDistribution).mockResolvedValue({
      Distribution: { Id: 'E123', ARN: '', Status: '', DomainName: '', DistributionConfig: {} },
      ETag: 'E123ETag2',
    })
    vi.mocked(cloudfrontApi.listDistributions).mockResolvedValue({
      DistributionList: { Items: [mockDistribution], Quantity: 1 },
    })

    const { updateDistribution } = useCloudFront()

    await updateDistribution('E123', { Comment: 'updated' })

    expect(cloudfrontApi.updateDistribution).toHaveBeenCalledWith('E123', { Comment: 'updated' })
    expect(cloudfrontApi.listDistributions).toHaveBeenCalled()
  })

  it('updateDistribution throws on error', async () => {
    vi.mocked(cloudfrontApi.updateDistribution).mockRejectedValue(new Error('Failed'))

    const { updateDistribution } = useCloudFront()

    await expect(updateDistribution('E123', { Comment: 'updated' })).rejects.toThrow()
  })

  it('deleteDistribution calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.deleteDistribution).mockResolvedValue({ message: 'deleted' })
    vi.mocked(cloudfrontApi.listDistributions).mockResolvedValue({
      DistributionList: { Items: [], Quantity: 0 },
    })

    const { deleteDistribution, deleting } = useCloudFront()

    await deleteDistribution('E123')

    expect(cloudfrontApi.deleteDistribution).toHaveBeenCalledWith('E123')
    expect(cloudfrontApi.listDistributions).toHaveBeenCalled()
    expect(deleting.value).toBe(false)
  })

  it('deleteDistribution throws on error', async () => {
    vi.mocked(cloudfrontApi.deleteDistribution).mockRejectedValue(new Error('Failed'))

    const { deleteDistribution, deleting } = useCloudFront()

    await expect(deleteDistribution('E123')).rejects.toThrow()
    expect(deleting.value).toBe(false)
  })

  it('loadInvalidations success', async () => {
    vi.mocked(cloudfrontApi.listInvalidations).mockResolvedValue({
      InvalidationList: { Items: [mockInvalidation], Quantity: 1 },
    })

    const { loadInvalidations, invalidations, invalidationsLoading } = useCloudFront()

    await loadInvalidations('E123')

    expect(cloudfrontApi.listInvalidations).toHaveBeenCalledWith('E123')
    expect(invalidations.value).toHaveLength(1)
    expect(invalidationsLoading.value).toBe(false)
  })

  it('loadInvalidations handles error', async () => {
    vi.mocked(cloudfrontApi.listInvalidations).mockRejectedValue(new Error('Failed'))

    const { loadInvalidations, invalidationsLoading } = useCloudFront()

    await loadInvalidations('E123')

    expect(invalidationsLoading.value).toBe(false)
  })

  it('createInvalidationAction calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.createInvalidation).mockResolvedValue({
      Invalidation: mockInvalidation,
    })
    vi.mocked(cloudfrontApi.listInvalidations).mockResolvedValue({
      InvalidationList: { Items: [mockInvalidation], Quantity: 1 },
    })

    const { createInvalidationAction } = useCloudFront()

    await createInvalidationAction('E123', { Paths: ['/*'] })

    expect(cloudfrontApi.createInvalidation).toHaveBeenCalledWith('E123', { Paths: ['/*'] })
    expect(cloudfrontApi.listInvalidations).toHaveBeenCalledWith('E123')
  })

  it('createInvalidationAction throws on error', async () => {
    vi.mocked(cloudfrontApi.createInvalidation).mockRejectedValue(new Error('Failed'))

    const { createInvalidationAction } = useCloudFront()

    await expect(createInvalidationAction('E123', { Paths: ['/*'] })).rejects.toThrow()
  })

  it('loadOriginAccessControls success', async () => {
    vi.mocked(cloudfrontApi.listOriginAccessControls).mockResolvedValue({
      OriginAccessControlList: { Items: [mockOAC], Quantity: 1 },
    })

    const { loadOriginAccessControls, originAccessControls, oacsLoading } = useCloudFront()

    await loadOriginAccessControls()

    expect(cloudfrontApi.listOriginAccessControls).toHaveBeenCalled()
    expect(originAccessControls.value).toHaveLength(1)
    expect(oacsLoading.value).toBe(false)
  })

  it('loadOriginAccessControls handles error', async () => {
    vi.mocked(cloudfrontApi.listOriginAccessControls).mockRejectedValue(new Error('Failed'))

    const { loadOriginAccessControls, oacsLoading } = useCloudFront()

    await loadOriginAccessControls()

    expect(oacsLoading.value).toBe(false)
  })

  it('createOriginAccessControl calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.createOriginAccessControl).mockResolvedValue({
      OriginAccessControl: mockOAC,
    })
    vi.mocked(cloudfrontApi.listOriginAccessControls).mockResolvedValue({
      OriginAccessControlList: { Items: [mockOAC], Quantity: 1 },
    })

    const { createOriginAccessControl } = useCloudFront()

    await createOriginAccessControl({
      Name: 'my-oac',
      OriginAccessControlOriginType: 's3',
      SigningBehavior: 'always',
      SigningProtocol: 'sigv4',
    })

    expect(cloudfrontApi.createOriginAccessControl).toHaveBeenCalledWith(
      expect.objectContaining({ Name: 'my-oac' }),
    )
    expect(cloudfrontApi.listOriginAccessControls).toHaveBeenCalled()
  })

  it('createOriginAccessControl throws on error', async () => {
    vi.mocked(cloudfrontApi.createOriginAccessControl).mockRejectedValue(new Error('Failed'))

    const { createOriginAccessControl } = useCloudFront()

    await expect(
      createOriginAccessControl({
        Name: 'my-oac',
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      }),
    ).rejects.toThrow()
  })

  it('deleteOriginAccessControl calls API and reloads', async () => {
    vi.mocked(cloudfrontApi.deleteOriginAccessControl).mockResolvedValue({ message: 'deleted' })
    vi.mocked(cloudfrontApi.listOriginAccessControls).mockResolvedValue({
      OriginAccessControlList: { Items: [], Quantity: 0 },
    })

    const { deleteOriginAccessControl } = useCloudFront()

    await deleteOriginAccessControl('OAC123')

    expect(cloudfrontApi.deleteOriginAccessControl).toHaveBeenCalledWith('OAC123')
    expect(cloudfrontApi.listOriginAccessControls).toHaveBeenCalled()
  })

  it('deleteOriginAccessControl throws on error', async () => {
    vi.mocked(cloudfrontApi.deleteOriginAccessControl).mockRejectedValue(new Error('Failed'))

    const { deleteOriginAccessControl } = useCloudFront()

    await expect(deleteOriginAccessControl('OAC123')).rejects.toThrow()
  })
})
