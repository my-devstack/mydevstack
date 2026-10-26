import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
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

  const buckets = ref<any[]>([])
  const objects = ref<any[]>([])
  const prefixes = ref<string[]>([])
  const selectedBucket = ref<string | null>(null)
  const currentPrefix = ref<string>('')
  const viewMode = ref<'folders' | 'all'>('folders')
  const bucketDetails = ref<Record<string, {
    versioning: { status: string; mfaDelete: string } | null
    encryption: { algorithm: string; keyId: string } | null
    tags: Array<{ Key: string; Value: string }>
    lifecycleRules: LifecycleRule[]
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

  async function loadObjects(bucketName: string, options?: { prefix?: string; delimiter?: string }) {
    const bucketChanged = selectedBucket.value !== bucketName
    selectedBucket.value = bucketName
    if (bucketChanged && options?.prefix === undefined) {
      currentPrefix.value = ''
      prefixes.value = []
    }
    loading.value = true
    try {
      const requestPrefix = options?.prefix ?? currentPrefix.value
      let delimiter = options?.delimiter
      if (!delimiter && viewMode.value === 'folders') {
        delimiter = '/'
      }
      const isAllMode = viewMode.value === 'all'
      const effectivePrefix = requestPrefix
      const effectiveDelimiter = isAllMode ? undefined : delimiter

      const response = await s3Api.listObjects(bucketName, { prefix: effectivePrefix, delimiter: effectiveDelimiter })

      // Defensive: strip marker keys (ending with /) from file rows; fold into prefixes (dedupe, keep order).
      // Skip the "self" marker whose key matches the real requested prefix.
      const newPrefixes = [...(response.prefixes || [])]
      const filteredObjects: any[] = []
      for (const obj of response.objects || []) {
        if (obj.Key === requestPrefix) continue
        if (obj.Key && obj.Key.endsWith('/')) {
          if (!newPrefixes.includes(obj.Key)) newPrefixes.push(obj.Key)
          continue
        }
        filteredObjects.push(obj)
      }
      objects.value = filteredObjects
      prefixes.value = newPrefixes
      // Do NOT clobber currentPrefix in 'all' mode — keep folder context for returning.
      currentPrefix.value = requestPrefix
    } catch (error) {
      toast.error('Failed to load objects: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  function navigateToPrefix(prefix: string) {
    if (!selectedBucket.value) return
    loadObjects(selectedBucket.value, { prefix })
  }

  function navigateUp() {
    if (!selectedBucket.value) return
    const parent = getParentPrefix(currentPrefix.value)
    loadObjects(selectedBucket.value, { prefix: parent })
  }

  function setViewMode(mode: 'folders' | 'all') {
    viewMode.value = mode
    if (selectedBucket.value) {
      loadObjects(selectedBucket.value, { prefix: currentPrefix.value })
    }
  }

  async function createFolder(folderName: string) {
    if (!selectedBucket.value) {
      toast.error('No bucket selected')
      return
    }
    const raw = typeof folderName === 'string' ? folderName : ''
    const trimmed = raw.trim()
    if (!trimmed) {
      toast.error('Folder name cannot be empty')
      return
    }
    // Normalize: collapse repeated slashes, strip leading/trailing slashes
    const sanitized = trimmed.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '')
    if (!sanitized) {
      toast.error('Folder name cannot be empty')
      return
    }
    // Reject any segment that is exactly ".." (directory traversal)
    if (sanitized.split('/').some(seg => seg === '..')) {
      toast.error('Folder name cannot contain ".."')
      return
    }
    const fullPath = currentPrefix.value + sanitized + '/'
    if (prefixes.value.includes(fullPath)) {
      toast.error(`Folder "${sanitized}" already exists`)
      return
    }
    loading.value = true
    try {
      await s3Api.createFolder(selectedBucket.value, fullPath)
      toast.success(`Folder "${sanitized}" created`)
      await loadObjects(selectedBucket.value, { prefix: currentPrefix.value })
    } catch (error) {
      toast.error('Failed to create folder: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  const breadcrumbs = computed(() => {
    if (!selectedBucket.value) return []
    const crumbs: Array<{ label: string; prefix: string }> = [
      { label: selectedBucket.value, prefix: '' },
    ]
    if (!currentPrefix.value) return crumbs
    const segments = currentPrefix.value.split('/').filter(Boolean)
    let acc = ''
    for (const seg of segments) {
      acc += seg + '/'
      crumbs.push({ label: seg, prefix: acc })
    }
    return crumbs
  })

  function getParentPrefix(prefix: string): string {
    if (!prefix) return ''
    const trimmed = prefix.replace(/\/$/, '')
    const idx = trimmed.lastIndexOf('/')
    if (idx < 0) return ''
    return trimmed.slice(0, idx + 1)
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

  async function uploadObject(bucketName: string, key: string, body: string | Uint8Array, contentType: string = 'text/plain') {
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

  async function uploadFiles(
    bucketName: string,
    entries: Array<{ key: string; body: Uint8Array; contentType: string }>,
    concurrency: number = 5
  ): Promise<{ uploaded: string[]; failed: string[] }> {
    if (entries.length === 0) return { uploaded: [], failed: [] }
    uploading.value = true
    const uploaded: string[] = []
    const failed: string[] = []
    let idx = 0
    const workers = Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
      while (true) {
        const i = idx++
        if (i >= entries.length) break
        const e = entries[i]
        try {
          await s3Api.putObject(bucketName, e.key, e.body, e.contentType)
          uploaded.push(e.key)
        } catch {
          failed.push(e.key)
        }
      }
    })
    await Promise.all(workers)
    try {
      await loadObjects(bucketName)
    } catch {
      // loadObjects already toasts; don't fail the batch
    }
    uploading.value = false
    if (uploaded.length > 0) {
      toast.success(`${uploaded.length} file(s) uploaded successfully`)
    }
    if (failed.length > 0) {
      toast.error(`Upload failed for ${failed.length} file(s): ${failed.join(', ')}`)
    }
    return { uploaded, failed }
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

  async function countFolderObjects(prefix: string): Promise<{ keys: string[]; total: number }> {
    if (!selectedBucket.value) {
      return { keys: [], total: 0 }
    }
    const bucket = selectedBucket.value
    const keys: string[] = []
    let marker: string | undefined
    try {
      while (true) {
        const res = await s3Api.listObjects(bucket, {
          prefix,
          maxKeys: 1000,
          ...(marker ? { marker } : {}),
        })
        for (const obj of res.objects || []) {
          if (obj.Key) keys.push(obj.Key)
        }
        if (!res.isTruncated || !res.nextMarker) break
        marker = res.nextMarker
      }
      return { keys, total: keys.length }
    } catch (error) {
      toast.error('Failed to count folder objects: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    }
  }

  async function deleteFolderObjects(bucketName: string, keys: string[]): Promise<{ deleted: number; failed: number }> {
    if (keys.length === 0) return { deleted: 0, failed: 0 }
    let deleted = 0
    let failed = 0
    let idx = 0
    const workers = Array.from({ length: Math.min(5, keys.length) }, async () => {
      while (true) {
        const i = idx++
        if (i >= keys.length) break
        try {
          await s3Api.deleteObject(bucketName, keys[i])
          deleted++
        } catch {
          failed++
        }
      }
    })
    await Promise.all(workers)
    try {
      await loadObjects(bucketName, { prefix: currentPrefix.value })
    } catch {
      // loadObjects already toasts; don't fail the batch
    }
    return { deleted, failed }
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
    prefixes,
    selectedBucket,
    currentPrefix,
    viewMode,
    breadcrumbs,
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
    uploadFiles,
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
    navigateToPrefix,
    navigateUp,
    setViewMode,
    createFolder,
    countFolderObjects,
    deleteFolderObjects,
  }
}