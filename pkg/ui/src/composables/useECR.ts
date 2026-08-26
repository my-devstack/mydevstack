import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type { ECRRepository, ECRImageDetail, ECRImageIdentifier, ECRTag } from '@/api/types/aws'
import * as ecrApi from '@/api/services/ecr'

export function useECR() {
  const toast = useToast()

  const repositories = ref<ECRRepository[]>([])
  const loading = ref(false)
  const selectedRepository = ref<ECRRepository | null>(null)
  const creating = ref(false)
  const deleting = ref(false)
  const images = ref<ECRImageDetail[]>([])
  const imagesLoading = ref(false)
  const tags = ref<ECRTag[]>([])
  const tagsLoading = ref(false)
  const authorizationToken = ref<string>('')
  const proxyEndpoint = ref<string>('')

  async function loadRepositories() {
    loading.value = true
    try {
      const result = await ecrApi.listRepositories()
      repositories.value = result.Repositories || []
    } catch (error) {
      toast.error('Failed to load ECR repositories: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createRepository(data: {
    repositoryName: string
    imageTagMutability?: 'MUTABLE' | 'IMMUTABLE'
    scanOnPush?: boolean
    tags?: ECRTag[]
  }) {
    creating.value = true
    try {
      await ecrApi.createRepository({
        RepositoryName: data.repositoryName,
        ImageTagMutability: data.imageTagMutability,
        ImageScanningConfiguration: data.scanOnPush ? { ScanOnPush: true } : undefined,
        Tags: data.tags,
      })
      toast.success(`Repository "${data.repositoryName}" created successfully`)
      await loadRepositories()
    } catch (error) {
      toast.error('Failed to create repository: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      creating.value = false
    }
  }

  async function deleteRepository(repositoryName: string, force?: boolean) {
    deleting.value = true
    try {
      await ecrApi.deleteRepository(repositoryName, force)
      toast.success(`Repository "${repositoryName}" deleted successfully`)
      if (selectedRepository.value?.RepositoryName === repositoryName) {
        selectedRepository.value = null
        images.value = []
      }
      await loadRepositories()
    } catch (error) {
      toast.error('Failed to delete repository: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      deleting.value = false
    }
  }

  async function selectRepository(repository: ECRRepository) {
    selectedRepository.value = repository
    await loadImages(repository.RepositoryName)
  }

  async function loadImages(repositoryName: string) {
    imagesLoading.value = true
    try {
      const result = await ecrApi.describeImages(repositoryName)
      images.value = result.ImageDetails || []
    } catch (error) {
      toast.error('Failed to load images: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      imagesLoading.value = false
    }
  }

  async function deleteImage(repositoryName: string, imageId: ECRImageIdentifier) {
    imagesLoading.value = true
    try {
      await ecrApi.batchDeleteImage(repositoryName, { ImageIds: [imageId] })
      toast.success('Image deleted successfully')
      await loadImages(repositoryName)
    } catch (error) {
      toast.error('Failed to delete image: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      imagesLoading.value = false
    }
  }

  async function loadTags(repositoryName: string) {
    tagsLoading.value = true
    try {
      const result = await ecrApi.listTagsForResource(repositoryName)
      tags.value = result.Tags || []
    } catch (error) {
      toast.error('Failed to load tags: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      tagsLoading.value = false
    }
  }

  async function updateTags(repositoryName: string, newTags: Record<string, string>, removedKeys: string[]) {
    tagsLoading.value = true
    try {
      await ecrApi.updateTags(repositoryName, { Tags: newTags, RemovedKeys: removedKeys })
      toast.success('Tags updated successfully')
      await loadTags(repositoryName)
    } catch (error) {
      toast.error('Failed to update tags: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      tagsLoading.value = false
    }
  }

  async function loadAuthorizationToken() {
    try {
      const result = await ecrApi.getAuthorizationToken()
      const data = result.AuthorizationData?.[0]
      authorizationToken.value = data?.AuthorizationToken || ''
      proxyEndpoint.value = data?.ProxyEndpoint || ''
    } catch (error) {
      toast.error('Failed to get authorization token: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return {
    repositories,
    loading,
    selectedRepository,
    creating,
    deleting,
    images,
    imagesLoading,
    tags,
    tagsLoading,
    authorizationToken,
    proxyEndpoint,
    loadRepositories,
    createRepository,
    deleteRepository,
    selectRepository,
    loadImages,
    deleteImage,
    loadTags,
    updateTags,
    loadAuthorizationToken,
  }
}