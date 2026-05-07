import { ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import * as s3Api from '@/api/services/s3'
import * as lambdaApi from '@/api/services/lambda'

export interface TriggerConfig {
  functionName: string
  events: string[]
  prefix?: string
  suffix?: string
}

export function useS3() {
  const uiStore = useUIStore()

  const buckets = ref<any[]>([])
  const objects = ref<any[]>([])
  const selectedBucket = ref<string | null>(null)
  const bucketDetails = ref<Record<string, {
    versioning: { status: string; mfaDelete: string } | null
    encryption: { algorithm: string; keyId: string } | null
    tags: Array<{ Key: string; Value: string }>
    loading: boolean
  }>>({})
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

  async function loadBucketDetails(bucketName: string) {
    bucketDetails.value[bucketName] = { ...bucketDetails.value[bucketName], loading: true }
    try {
      const [versioning, encryption, tags] = await Promise.all([
        s3Api.getBucketVersioning(bucketName).catch(() => null),
        s3Api.getBucketEncryption(bucketName).catch(() => null),
        s3Api.getBucketTagging(bucketName).catch(() => ({ tags: [] })),
      ])
      bucketDetails.value[bucketName] = {
        versioning,
        encryption,
        tags: tags?.tags || [],
        loading: false,
      }
    } catch (error) {
      uiStore.notifyError('Failed to load bucket details', error instanceof Error ? error.message : 'Unknown error')
      if (bucketDetails.value[bucketName]) {
        bucketDetails.value[bucketName].loading = false
      }
    }
  }

  async function createBucket(
    name: string,
    options?: {
      enableCors?: boolean
      enableVersioning?: boolean
      encryptionType?: 'AES256' | 'aws:kms'
      kmsKeyId?: string
      blockPublicAccess?: boolean
      tags?: Array<{ Key: string; Value: string }>
      bucketPolicy?: string
    }
  ) {
    loading.value = true
    try {
      await s3Api.createBucket(name, options)
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

  async function getPresignedUrl(bucket: string, key: string): Promise<string> {
    try {
      return await s3Api.getPresignedUrl(bucket, key)
    } catch (error) {
      uiStore.notifyError('Failed to get presigned URL', error instanceof Error ? error.message : 'Unknown error')
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

  async function configureLambdaTrigger(bucket: string, config: TriggerConfig) {
    loading.value = true
    try {
      // Get Lambda function ARN
      const { functions } = await lambdaApi.listFunctions()
      const fn = functions?.find((f: any) => f.FunctionName === config.functionName)
      if (!fn) {
        throw new Error(`Lambda function "${config.functionName}" not found`)
      }

      // Build notification configuration
      const notificationConfig: any = {
        LambdaFunctionConfigurations: [
          {
            Id: `trigger-${Date.now()}`,
            LambdaFunctionArn: fn.FunctionArn,
            Events: config.events,
          },
        ],
      }

      // Add filters if specified
      if (config.prefix || config.suffix) {
        const filterRules: Array<{ Name: string; Value: string }> = []
        if (config.prefix) {
          filterRules.push({ Name: 'prefix', Value: config.prefix })
        }
        if (config.suffix) {
          filterRules.push({ Name: 'suffix', Value: config.suffix })
        }
        notificationConfig.LambdaFunctionConfigurations[0].Filter = {
          Key: {
            FilterRules: filterRules,
          },
        }
      }

      await s3Api.configureNotification(bucket, {
        Bucket: bucket,
        NotificationConfiguration: notificationConfig,
      })
      uiStore.notifySuccess('Trigger configured', `Lambda trigger added to bucket "${bucket}"`)
    } catch (error) {
      uiStore.notifyError('Failed to configure trigger', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function getLambdaTriggers(bucket: string): Promise<TriggerConfig[]> {
    try {
      const config = await s3Api.getNotificationConfig(bucket)
      const lambdaConfigs = config.LambdaFunctionConfigurations || []

      return lambdaConfigs.map((lc: any) => ({
        functionName: lc.LambdaFunctionArn?.split(':')?.pop() || '',
        events: lc.Events || [],
        prefix: lc.Filter?.Key?.FilterRules?.find((r: any) => r.Name === 'prefix')?.Value,
        suffix: lc.Filter?.Key?.FilterRules?.find((r: any) => r.Name === 'suffix')?.Value,
      }))
    } catch (error) {
      console.error('Failed to get Lambda triggers:', error)
      return []
    }
  }

  return {
    buckets,
    objects,
    selectedBucket,
    bucketDetails,
    loading,
    uploading,
    loadBuckets,
    loadObjects,
    loadBucketDetails,
    createBucket,
    deleteBucket,
    deleteObject,
    uploadObject,
    getObject,
    getPresignedUrl,
    formatBody,
    configureLambdaTrigger,
    getLambdaTriggers,
  }
}