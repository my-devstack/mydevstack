import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useECR } from './useECR'

vi.mock('@/api/services/ecr', () => ({
  listRepositories: vi.fn(),
  createRepository: vi.fn(),
  deleteRepository: vi.fn(),
  describeImages: vi.fn(),
  batchDeleteImage: vi.fn(),
  listTagsForResource: vi.fn(),
  updateTags: vi.fn(),
  getAuthorizationToken: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as ecrApi from '@/api/services/ecr'

const mockRepository = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:000000000000:repository/my-app',
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  RepositoryUri: '000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
}

describe('useECR', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { repositories, loading, selectedRepository, creating, deleting, images, imagesLoading, tags, tagsLoading } = useECR()
    expect(repositories.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(selectedRepository.value).toBeNull()
    expect(creating.value).toBe(false)
    expect(deleting.value).toBe(false)
    expect(images.value).toEqual([])
    expect(imagesLoading.value).toBe(false)
    expect(tags.value).toEqual([])
    expect(tagsLoading.value).toBe(false)
  })

  it('loadRepositories success', async () => {
    const mockRepos = [mockRepository]
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: mockRepos })

    const { loadRepositories, repositories, loading } = useECR()

    await loadRepositories()

    expect(ecrApi.listRepositories).toHaveBeenCalled()
    expect(repositories.value).toHaveLength(1)
    expect(loading.value).toBe(false)
  })

  it('loadRepositories handles empty result', async () => {
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { loadRepositories, repositories } = useECR()

    await loadRepositories()

    expect(repositories.value).toEqual([])
  })

  it('loadRepositories handles error', async () => {
    vi.mocked(ecrApi.listRepositories).mockRejectedValue(new Error('Network error'))

    const { loadRepositories, loading } = useECR()

    await loadRepositories()

    expect(loading.value).toBe(false)
  })

  it('createRepository calls API and reloads', async () => {
    vi.mocked(ecrApi.createRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [mockRepository] })

    const { createRepository, creating } = useECR()

    await createRepository({ repositoryName: 'my-app' })

    expect(ecrApi.createRepository).toHaveBeenCalledWith(
      expect.objectContaining({ RepositoryName: 'my-app' })
    )
    expect(ecrApi.listRepositories).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('createRepository includes scanOnPush config when set', async () => {
    vi.mocked(ecrApi.createRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { createRepository } = useECR()

    await createRepository({ repositoryName: 'my-app', scanOnPush: true })

    expect(ecrApi.createRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        ImageScanningConfiguration: { ScanOnPush: true },
      })
    )
  })

  it('createRepository throws on error', async () => {
    vi.mocked(ecrApi.createRepository).mockRejectedValue(new Error('Failed'))

    const { createRepository, creating } = useECR()

    await expect(createRepository({ repositoryName: 'my-app' })).rejects.toThrow()
    expect(creating.value).toBe(false)
  })

  it('deleteRepository calls API and reloads', async () => {
    vi.mocked(ecrApi.deleteRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { deleteRepository, deleting } = useECR()

    await deleteRepository('my-app')

    expect(ecrApi.deleteRepository).toHaveBeenCalledWith('my-app', undefined)
    expect(ecrApi.listRepositories).toHaveBeenCalled()
    expect(deleting.value).toBe(false)
  })

  it('deleteRepository passes force flag', async () => {
    vi.mocked(ecrApi.deleteRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { deleteRepository } = useECR()

    await deleteRepository('my-app', true)

    expect(ecrApi.deleteRepository).toHaveBeenCalledWith('my-app', true)
  })

  it('deleteRepository clears selected if matches', async () => {
    vi.mocked(ecrApi.deleteRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { deleteRepository, selectedRepository, images } = useECR()
    selectedRepository.value = mockRepository as any
    images.value = [{ ImageDigest: 'sha256:abc' }] as any

    await deleteRepository('my-app')

    expect(selectedRepository.value).toBeNull()
    expect(images.value).toEqual([])
  })

  it('deleteRepository does not clear selected if different', async () => {
    vi.mocked(ecrApi.deleteRepository).mockResolvedValue({ Repository: mockRepository })
    vi.mocked(ecrApi.listRepositories).mockResolvedValue({ Repositories: [] })

    const { deleteRepository, selectedRepository } = useECR()
    selectedRepository.value = mockRepository as any

    await deleteRepository('other-repo')

    expect(selectedRepository.value).not.toBeNull()
  })

  it('selectRepository sets selected and loads images', async () => {
    vi.mocked(ecrApi.describeImages).mockResolvedValue({ ImageDetails: [{ ImageDigest: 'sha256:abc' }] })

    const { selectRepository, selectedRepository, images } = useECR()

    await selectRepository(mockRepository as any)

    expect(selectedRepository.value).toEqual(mockRepository)
    expect(ecrApi.describeImages).toHaveBeenCalledWith('my-app')
    expect(images.value).toHaveLength(1)
  })

  it('loadImages success', async () => {
    const mockImages = [
      { ImageDigest: 'sha256:abc', ImageTags: ['latest'], ImageSizeInBytes: 1024 },
    ]
    vi.mocked(ecrApi.describeImages).mockResolvedValue({ ImageDetails: mockImages })

    const { loadImages, images, imagesLoading } = useECR()

    await loadImages('my-app')

    expect(ecrApi.describeImages).toHaveBeenCalledWith('my-app')
    expect(images.value).toHaveLength(1)
    expect(imagesLoading.value).toBe(false)
  })

  it('loadImages handles error', async () => {
    vi.mocked(ecrApi.describeImages).mockRejectedValue(new Error('Failed'))

    const { loadImages, imagesLoading } = useECR()

    await loadImages('my-app')

    expect(imagesLoading.value).toBe(false)
  })

  it('deleteImage calls API and reloads', async () => {
    vi.mocked(ecrApi.batchDeleteImage).mockResolvedValue({ ImageIds: [], Failures: [] })
    vi.mocked(ecrApi.describeImages).mockResolvedValue({ ImageDetails: [] })

    const { deleteImage, imagesLoading } = useECR()

    await deleteImage('my-app', { ImageDigest: 'sha256:abc' })

    expect(ecrApi.batchDeleteImage).toHaveBeenCalledWith('my-app', { ImageIds: [{ ImageDigest: 'sha256:abc' }] })
    expect(ecrApi.describeImages).toHaveBeenCalledWith('my-app')
    expect(imagesLoading.value).toBe(false)
  })

  it('loadTags success', async () => {
    vi.mocked(ecrApi.listTagsForResource).mockResolvedValue({ Tags: [{ Key: 'env', Value: 'prod' }] })

    const { loadTags, tags, tagsLoading } = useECR()

    await loadTags('my-app')

    expect(ecrApi.listTagsForResource).toHaveBeenCalledWith('my-app')
    expect(tags.value).toHaveLength(1)
    expect(tagsLoading.value).toBe(false)
  })

  it('updateTags calls API and reloads', async () => {
    vi.mocked(ecrApi.updateTags).mockResolvedValue({ message: 'Tags updated successfully' })
    vi.mocked(ecrApi.listTagsForResource).mockResolvedValue({ Tags: [] })

    const { updateTags, tagsLoading } = useECR()

    await updateTags('my-app', { env: 'prod' }, ['old-key'])

    expect(ecrApi.updateTags).toHaveBeenCalledWith('my-app', { Tags: { env: 'prod' }, RemovedKeys: ['old-key'] })
    expect(ecrApi.listTagsForResource).toHaveBeenCalledWith('my-app')
    expect(tagsLoading.value).toBe(false)
  })

  it('loadAuthorizationToken sets token and endpoint', async () => {
    vi.mocked(ecrApi.getAuthorizationToken).mockResolvedValue({
      AuthorizationData: [{ AuthorizationToken: 'dG9rZW4=', ProxyEndpoint: 'http://127.0.0.1:4566' }],
    })

    const { loadAuthorizationToken, authorizationToken, proxyEndpoint } = useECR()

    await loadAuthorizationToken()

    expect(ecrApi.getAuthorizationToken).toHaveBeenCalled()
    expect(authorizationToken.value).toBe('dG9rZW4=')
    expect(proxyEndpoint.value).toBe('http://127.0.0.1:4566')
  })

  it('loadAuthorizationToken handles empty data', async () => {
    vi.mocked(ecrApi.getAuthorizationToken).mockResolvedValue({ AuthorizationData: [] })

    const { loadAuthorizationToken, authorizationToken, proxyEndpoint } = useECR()

    await loadAuthorizationToken()

    expect(authorizationToken.value).toBe('')
    expect(proxyEndpoint.value).toBe('')
  })
})