import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import * as s3Api from '@/api/services/s3'
import type { LifecycleRule } from '@/api/services/s3'
import * as lambdaApi from '@/api/services/lambda'

export interface TriggerConfig {
  functionName: string
  events: string[]
  prefix?: string
  suffix?: string
}

export function useS3() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

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
  const lifecycleRules = ref<Record<string, LifecycleRule[]>>({})
  const lifecycleLoading = ref(false)

  async function loadBuckets() {
    loading.value = true
    try {
      const response = await s3Api.listBuckets()
      buckets.value = response
    } catch (error) {
      toast.error('Failed to load buckets: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
      toast.error('Failed to load objects: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function loadBucketDetails(bucketName: string) {
    bucketDetails.value[bucketName] = { ...bucketDetails.value[bucketName], loading: true }
    try {
      const [versioning, encryption, tags, lifecycle] = await Promise.all([
        s3Api.getBucketVersioning(bucketName).catch(() => null),
        s3Api.getBucketEncryption(bucketName).catch(() => null),
        s3Api.getBucketTagging(bucketName).catch(() => ({ tags: [] })),
        s3Api.getBucketLifecycleConfiguration(bucketName).catch(() => ({ rules: [] })),
      ])
      bucketDetails.value[bucketName] = {
        versioning,
        encryption,
        tags: tags?.tags || [],
        lifecycleRules: lifecycle?.rules || [],
        loading: false,
      }
    } catch (error) {
      toast.error('Failed to load bucket details: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
      toast.success(`Bucket "${name}" created successfully`)
      // Refresh bucket list from API, then add new bucket to ensure it's at top
      await loadBuckets()
      // Check if bucket already in list (some mocks return it), otherwise add it
      if (!buckets.value.find(b => b.Name === name)) {
        buckets.value.unshift({ 
          Name: name, 
          CreationDate: new Date().toISOString() 
        })
      }
    } catch (error) {
      toast.error('Failed to create bucket: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteBucket(name: string) {
    loading.value = true
    try {
      await s3Api.deleteBucket(name)
      toast.success(`Bucket "${name}" deleted successfully`)
      if (selectedBucket.value === name) {
        selectedBucket.value = null
        objects.value = []
      }
      await loadBuckets()
    } catch (error) {
      toast.error('Failed to delete bucket: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteObject(bucketName: string, objectKey: string) {
    loading.value = true
    try {
      await s3Api.deleteObject(bucketName, objectKey)
      toast.success('Object deleted successfully')
      await loadObjects(bucketName)
    } catch (error) {
      toast.error('Failed to delete object: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadObject(bucketName: string, key: string, body: string, contentType: string = 'text/plain') {
    uploading.value = true
    try {
      await s3Api.putObject(bucketName, key, body, contentType)
      toast.success(`Object "${key}" uploaded successfully`)
      await loadObjects(bucketName)
    } catch (error) {
      toast.error('Failed to upload object: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      uploading.value = false
    }
  }

  async function getObject(bucketName: string, key: string) {
    try {
      return await s3Api.getObject(bucketName, key)
    } catch (error) {
      toast.error('Failed to get object: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    }
  }

  async function getPresignedUrl(bucket: string, key: string): Promise<string> {
    try {
      return await s3Api.getPresignedUrl(bucket, key)
    } catch (error) {
      toast.error('Failed to get presigned URL: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
      toast.success(`Lambda trigger added to bucket "${bucket}"`)
    } catch (error) {
      toast.error('Failed to configure trigger: ' + (error instanceof Error ? error.message : 'Unknown error'))
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

  async function loadLifecycleRules(bucketName: string): Promise<LifecycleRule[]> {
    lifecycleLoading.value = true
    try {
      const result = await s3Api.getBucketLifecycleConfiguration(bucketName)
      lifecycleRules.value[bucketName] = result.rules
      return result.rules
    } catch (error) {
      toast.error('Failed to load lifecycle rules: ' + (error instanceof Error ? error.message : 'Unknown error'))
      lifecycleRules.value[bucketName] = []
      return []
    } finally {
      lifecycleLoading.value = false
    }
  }

  async function saveLifecycleRules(bucketName: string, rules: LifecycleRule[]): Promise<void> {
    lifecycleLoading.value = true
    try {
      await s3Api.putBucketLifecycleConfiguration(bucketName, rules)
      toast.success(`Lifecycle rules saved for "${bucketName}"`)
      await loadLifecycleRules(bucketName)
    } catch (error) {
      toast.error('Failed to save lifecycle rules: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      lifecycleLoading.value = false
    }
  }

  async function deleteLifecycleRule(bucketName: string): Promise<void> {
    lifecycleLoading.value = true
    try {
      await s3Api.deleteBucketLifecycleConfiguration(bucketName)
      toast.success(`Lifecycle rules deleted for "${bucketName}"`)
      delete lifecycleRules.value[bucketName]
    } catch (error) {
      toast.error('Failed to delete lifecycle rules: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      lifecycleLoading.value = false
    }
  }

  async function toggleVersioning(bucketName: string, enable: boolean): Promise<void> {
    try {
      await s3Api.putBucketVersioning(bucketName, enable ? 'Enabled' : 'Suspended')
      toast.success(`Versioning ${enable ? 'enabled' : 'suspended'} for "${bucketName}"`)
      await loadBucketDetails(bucketName)
    } catch (error) {
      toast.error('Failed to toggle versioning: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
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
    lifecycleRules,
    lifecycleLoading,
    loadLifecycleRules,
    saveLifecycleRules,
    deleteLifecycleRule,
    toggleVersioning,
  }
}