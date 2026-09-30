import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type {
  CloudFrontDistributionSummary,
  CloudFrontDistribution,
  CloudFrontInvalidation,
  CloudFrontOriginAccessControl,
  CloudFrontCreateDistributionRequest,
  CloudFrontUpdateDistributionRequest,
  CloudFrontCreateInvalidationRequest,
  CloudFrontCreateOriginAccessControlRequest,
} from '@/api/types/aws'
import * as cloudfrontApi from '@/api/services/cloudfront'

export function useCloudFront() {
  const toast = useToast()

  const distributions = ref<CloudFrontDistributionSummary[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  const invalidations = ref<CloudFrontInvalidation[]>([])
  const invalidationsLoading = ref(false)

  const originAccessControls = ref<CloudFrontOriginAccessControl[]>([])
  const oacsLoading = ref(false)

  async function loadDistributions() {
    loading.value = true
    error.value = null
    try {
      const result = await cloudfrontApi.listDistributions()
      distributions.value = result.DistributionList?.Items || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      toast.error('Failed to load CloudFront distributions: ' + message)
    } finally {
      loading.value = false
    }
  }

  async function createDistribution(data: CloudFrontCreateDistributionRequest) {
    creating.value = true
    error.value = null
    try {
      await cloudfrontApi.createDistribution(data)
      toast.success('Distribution created successfully')
      await loadDistributions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      toast.error('Failed to create distribution: ' + message)
      throw err
    } finally {
      creating.value = false
    }
  }

  async function getDistribution(id: string): Promise<{ Distribution: CloudFrontDistribution; ETag?: string } | null> {
    try {
      return await cloudfrontApi.getDistribution(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to load distribution: ' + message)
      return null
    }
  }

  async function updateDistribution(id: string, data: CloudFrontUpdateDistributionRequest) {
    error.value = null
    try {
      await cloudfrontApi.updateDistribution(id, data)
      toast.success('Distribution updated successfully')
      await loadDistributions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      toast.error('Failed to update distribution: ' + message)
      throw err
    }
  }

  async function deleteDistribution(id: string) {
    deleting.value = true
    error.value = null
    try {
      await cloudfrontApi.deleteDistribution(id)
      toast.success('Distribution deleted successfully')
      await loadDistributions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      toast.error('Failed to delete distribution: ' + message)
      throw err
    } finally {
      deleting.value = false
    }
  }

  async function loadInvalidations(distributionId: string) {
    invalidationsLoading.value = true
    try {
      const result = await cloudfrontApi.listInvalidations(distributionId)
      invalidations.value = result.InvalidationList?.Items || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to load invalidations: ' + message)
    } finally {
      invalidationsLoading.value = false
    }
  }

  async function createInvalidationAction(distributionId: string, data: CloudFrontCreateInvalidationRequest) {
    try {
      await cloudfrontApi.createInvalidation(distributionId, data)
      toast.success('Invalidation created successfully')
      await loadInvalidations(distributionId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to create invalidation: ' + message)
      throw err
    }
  }

  async function loadOriginAccessControls() {
    oacsLoading.value = true
    try {
      const result = await cloudfrontApi.listOriginAccessControls()
      originAccessControls.value = result.OriginAccessControlList?.Items || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to load origin access controls: ' + message)
    } finally {
      oacsLoading.value = false
    }
  }

  async function createOriginAccessControl(data: CloudFrontCreateOriginAccessControlRequest) {
    try {
      await cloudfrontApi.createOriginAccessControl(data)
      toast.success('Origin access control created successfully')
      await loadOriginAccessControls()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to create origin access control: ' + message)
      throw err
    }
  }

  async function deleteOriginAccessControl(id: string) {
    try {
      await cloudfrontApi.deleteOriginAccessControl(id)
      toast.success('Origin access control deleted successfully')
      await loadOriginAccessControls()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to delete origin access control: ' + message)
      throw err
    }
  }

  return {
    distributions,
    loading,
    creating,
    deleting,
    error,
    invalidations,
    invalidationsLoading,
    originAccessControls,
    oacsLoading,
    loadDistributions,
    createDistribution,
    getDistribution,
    updateDistribution,
    deleteDistribution,
    loadInvalidations,
    createInvalidationAction,
    loadOriginAccessControls,
    createOriginAccessControl,
    deleteOriginAccessControl,
  }
}
