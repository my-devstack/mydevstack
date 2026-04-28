import { ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import * as s3Api from '@/api/services/s3'

export function useS3() {
  const uiStore = useUIStore()

  const buckets = ref<any[]>([])
  const objects = ref<any[]>([])
  const selectedBucket = ref<string | null>(null)
  const loading = ref(false)
  const uploading = ref(false)

  async function loadBuckets() {
    loading.value = true
    try {
      const response = await s3Api.listBuckets()
      buckets.value = response
    } catch (error) {
      uiStore.notifyError('Failed to load buckets', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      loading.value = false
    }
  }

  async function loadObjects(bucketName: string) {
    selectedBucket.value = bucketName
    loading.value = true
    try {
      const response = await s3Api.listObjects(bucketName)
      objects.value = response.objects
    } catch (error) {
      uiStore.notifyError('Failed to load objects', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      loading.value = false
    }
  }

  async function createBucket(name: string, options?: { enableCors?: boolean }) {
    loading.value = true
    try {
      await s3Api.createBucket(name, options?.enableCors)
      uiStore.notifySuccess('Bucket created', `Bucket "${name}" created successfully`)
      await loadBuckets()
    } catch (error) {
      uiStore.notifyError('Failed to create bucket', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteBucket(name: string) {
    loading.value = true
    try {
      await s3Api.deleteBucket(name)
      uiStore.notifySuccess('Bucket deleted', `Bucket "${name}" deleted successfully`)
      if (selectedBucket.value === name) {
        selectedBucket.value = null
        objects.value = []
      }
      await loadBuckets()
    } catch (error) {
      uiStore.notifyError('Failed to delete bucket', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteObject(bucketName: string, objectKey: string) {
    loading.value = true
    try {
      await s3Api.deleteObject(bucketName, objectKey)
      uiStore.notifySuccess('Object deleted', 'Object deleted successfully')
      await loadObjects(bucketName)
    } catch (error) {
      uiStore.notifyError('Failed to delete object', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadObject(bucketName: string, key: string, body: string, contentType: string = 'text/plain') {
    uploading.value = true
    try {
      await s3Api.putObject(bucketName, key, body, contentType)
      uiStore.notifySuccess('Object uploaded', `Object "${key}" uploaded successfully`)
      await loadObjects(bucketName)
    } catch (error) {
      uiStore.notifyError('Failed to upload object', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      uploading.value = false
    }
  }

  async function getObject(bucketName: string, key: string) {
    try {
      return await s3Api.getObject(bucketName, key)
    } catch (error) {
      uiStore.notifyError('Failed to get object', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  function formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return body
    }
  }

  return {
    buckets,
    objects,
    selectedBucket,
    loading,
    uploading,
    loadBuckets,
    loadObjects,
    createBucket,
    deleteBucket,
    deleteObject,
    uploadObject,
    getObject,
    formatBody,
  }
}