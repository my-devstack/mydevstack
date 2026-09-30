<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import FormInput from '@/components/common/FormInput.vue'
import Button from '@/components/common/Button.vue'
import type {
  CloudFrontDistributionSummary,
  CloudFrontDistribution,
  CloudFrontOriginAccessControl,
  CloudFrontCreateDistributionRequest,
  CloudFrontUpdateDistributionRequest,
} from '@/api/types/aws'
import type { S3Bucket } from '@/api/types/aws'
import { listBuckets } from '@/api/services/s3'

type ModalMode = 'create' | 'edit' | 'view' | 'delete'

const props = defineProps<{
  open: boolean
  mode: ModalMode
  loading?: boolean
  distribution?: CloudFrontDistributionSummary | null
  fullDistribution?: CloudFrontDistribution | null
  originAccessControls?: CloudFrontOriginAccessControl[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [data: CloudFrontCreateDistributionRequest]
  'update': [data: CloudFrontUpdateDistributionRequest]
  'delete': []
  'grant-access': [dist: CloudFrontDistributionSummary, mode: 'public' | 'oac', oacId?: string]
}>()

const settingsStore = useSettingsStore()

const buckets = ref<S3Bucket[]>([])
const bucketsLoading = ref(false)

const form = ref({
  bucketName: '',
  defaultRootObject: 'index.html',
  originAccessMode: 'public' as 'public' | 'oac',
  selectedOacId: '',
  newOacName: '',
  comment: '',
  enabled: true,
  priceClass: 'PriceClass_100',
  viewerProtocolPolicy: 'redirect-to-https' as 'allow-all' | 'https-only' | 'redirect-to-https',
})

const title = computed(() => {
  if (props.mode === 'create') return 'Create CloudFront Distribution'
  if (props.mode === 'edit') return 'Edit Distribution'
  if (props.mode === 'delete') return 'Delete Distribution'
  return 'Distribution Details'
})

const confirmText = computed(() => {
  if (props.mode === 'create') return 'Create'
  if (props.mode === 'edit') return 'Update'
  if (props.mode === 'delete') return 'Delete'
  return 'Close'
})

async function loadBuckets() {
  bucketsLoading.value = true
  try {
    buckets.value = await listBuckets()
  } catch {
    buckets.value = []
  } finally {
    bucketsLoading.value = false
  }
}

function handleConfirm() {
  if (props.mode === 'create') {
    if (!form.value.bucketName) return
    const originDomain = `${form.value.bucketName}.s3.amazonaws.com`
    const data: CloudFrontCreateDistributionRequest = {
      Comment: form.value.comment || undefined,
      Enabled: form.value.enabled,
      DefaultRootObject: form.value.defaultRootObject || undefined,
      Origins: [
        {
          Id: `S3-${form.value.bucketName}`,
          DomainName: originDomain,
          S3OriginConfig: {
            OriginAccessIdentity: '',
          },
          ...(form.value.originAccessMode === 'oac' && form.value.selectedOacId
            ? { OriginAccessControlId: form.value.selectedOacId }
            : {}),
        },
      ],
      DefaultCacheBehavior: {
        TargetOriginId: `S3-${form.value.bucketName}`,
        ViewerProtocolPolicy: form.value.viewerProtocolPolicy,
        AllowedMethods: ['GET', 'HEAD'],
        CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        Compress: true,
      },
      PriceClass: form.value.priceClass,
    }
    emit('create', data)
  } else if (props.mode === 'edit') {
    if (!props.fullDistribution) return
    const data: CloudFrontUpdateDistributionRequest = {
      Comment: form.value.comment,
      Enabled: form.value.enabled,
      DefaultRootObject: form.value.defaultRootObject || undefined,
      PriceClass: form.value.priceClass,
    }
    emit('update', data)
  } else if (props.mode === 'delete') {
    emit('delete')
  } else {
    emit('update:open', false)
  }
}

function handleClose() {
  emit('update:open', false)
}

function handleGrantAccess() {
  if (!props.distribution) return
  const mode = form.value.originAccessMode
  emit('grant-access', props.distribution, mode, form.value.selectedOacId || undefined)
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      if (props.mode === 'create') {
        form.value = {
          bucketName: '',
          defaultRootObject: 'index.html',
          originAccessMode: 'public',
          selectedOacId: '',
          newOacName: '',
          comment: '',
          enabled: true,
          priceClass: 'PriceClass_100',
          viewerProtocolPolicy: 'redirect-to-https',
        }
        loadBuckets()
      } else if (props.mode === 'edit' && props.fullDistribution) {
        const config = props.fullDistribution.DistributionConfig
        const origins = config.Origins || []
        const firstOrigin = origins[0]?.DomainName || ''
        const bucketMatch = firstOrigin.match(/^(.+)\.s3\.amazonaws\.com$/)
        form.value = {
          bucketName: bucketMatch ? bucketMatch[1] : '',
          defaultRootObject: config.DefaultRootObject || '',
          originAccessMode: origins[0]?.OriginAccessControlId ? 'oac' : 'public',
          selectedOacId: origins[0]?.OriginAccessControlId || '',
          newOacName: '',
          comment: config.Comment || '',
          enabled: config.Enabled ?? true,
          priceClass: config.PriceClass || 'PriceClass_100',
          viewerProtocolPolicy: config.DefaultCacheBehavior?.ViewerProtocolPolicy || 'redirect-to-https',
        }
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div
      class="p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto shadow-xl"
      :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
      role="dialog"
      :aria-label="title"
    >
      <h2
        class="text-xl font-bold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        {{ title }}
      </h2>

      <!-- Create Mode -->
      <template v-if="mode === 'create'">
        <div class="mb-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            S3 Bucket Origin
          </label>
          <select
            v-model="form.bucketName"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
            :disabled="bucketsLoading"
          >
            <option value="" disabled>
              {{ bucketsLoading ? 'Loading buckets...' : 'Select an S3 bucket' }}
            </option>
            <option
              v-for="bucket in buckets"
              :key="bucket.Name"
              :value="bucket.Name"
            >
              {{ bucket.Name }}
            </option>
          </select>
        </div>

        <FormInput
          v-model="form.defaultRootObject"
          label="Default Root Object"
          placeholder="index.html"
        />

        <FormInput
          v-model="form.comment"
          label="Comment"
          placeholder="Optional description"
        />

        <div class="mt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Origin Access
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.originAccessMode"
                type="radio"
                value="public"
                class="rounded border-light-border dark:border-dark-border"
              >
              <span class="text-sm text-light-text dark:text-dark-text">Public bucket</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.originAccessMode"
                type="radio"
                value="oac"
                class="rounded border-light-border dark:border-dark-border"
              >
              <span class="text-sm text-light-text dark:text-dark-text">Origin Access Control (OAC)</span>
            </label>
          </div>
        </div>

        <div
          v-if="form.originAccessMode === 'oac'"
          class="mt-4"
        >
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Select OAC
          </label>
          <select
            v-model="form.selectedOacId"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
          >
            <option value="">
              Select an existing OAC
            </option>
            <option
              v-for="oac in originAccessControls"
              :key="oac.Id"
              :value="oac.Id"
            >
              {{ oac.Name }}
            </option>
          </select>
          <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
            Or create a new OAC from the "Origin Access" tab first.
          </p>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Viewer Protocol Policy
          </label>
          <select
            v-model="form.viewerProtocolPolicy"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
          >
            <option value="redirect-to-https">Redirect to HTTPS</option>
            <option value="https-only">HTTPS Only</option>
            <option value="allow-all">HTTP and HTTPS</option>
          </select>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Price Class
          </label>
          <select
            v-model="form.priceClass"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
          >
            <option value="PriceClass_100">PriceClass_100</option>
            <option value="PriceClass_200">PriceClass_200</option>
            <option value="PriceClass_All">PriceClass_All</option>
          </select>
        </div>

        <label class="mt-4 flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.enabled"
            type="checkbox"
            class="rounded border-light-border dark:border-dark-border"
          >
          <span class="text-sm text-light-text dark:text-dark-text">Enabled</span>
        </label>
      </template>

      <!-- Edit Mode -->
      <template v-else-if="mode === 'edit'">
        <FormInput
          v-model="form.comment"
          label="Comment"
          placeholder="Optional description"
        />

        <FormInput
          v-model="form.defaultRootObject"
          label="Default Root Object"
          placeholder="index.html"
        />

        <div class="mt-4">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Price Class
          </label>
          <select
            v-model="form.priceClass"
            class="block w-full rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2"
          >
            <option value="PriceClass_100">PriceClass_100</option>
            <option value="PriceClass_200">PriceClass_200</option>
            <option value="PriceClass_All">PriceClass_All</option>
          </select>
        </div>

        <label class="mt-4 flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.enabled"
            type="checkbox"
            class="rounded border-light-border dark:border-dark-border"
          >
          <span class="text-sm text-light-text dark:text-dark-text">Enabled</span>
        </label>

        <div class="mt-4">
          <Button
            variant="secondary"
            size="sm"
            @click="handleGrantAccess"
          >
            Grant Bucket Access
          </Button>
        </div>
      </template>

      <!-- View Mode -->
      <template v-else-if="mode === 'view' && distribution">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Distribution ID</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ distribution.Id }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Domain Name</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
              {{ distribution.DomainName }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
              {{ distribution.ARN }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ distribution.Status }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Enabled</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ distribution.Enabled ? 'Yes' : 'No' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Price Class</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ distribution.PriceClass || '-' }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Modified</label>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ formatDate(distribution.LastModifiedTime) }}
              </p>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Comment</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ distribution.Comment || '-' }}
            </p>
          </div>
        </div>
      </template>

      <!-- Delete Mode -->
      <template v-else-if="mode === 'delete'">
        <p class="text-sm text-light-text dark:text-dark-text">
          Are you sure you want to permanently delete distribution
          <span class="font-mono font-semibold">{{ distribution?.Id || '' }}</span>?
        </p>
        <p class="mt-2 text-sm text-red-500">
          This action cannot be undone.
        </p>
      </template>

      <div class="flex gap-2 justify-end mt-6">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :variant="mode === 'delete' ? 'danger' : 'primary'"
          :disabled="(mode === 'create' && !form.bucketName) || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ loading ? (mode === 'create' ? 'Creating...' : mode === 'delete' ? 'Deleting...' : mode === 'edit' ? 'Updating...' : 'Loading...') : confirmText }}
        </Button>
      </div>
    </div>
  </div>
</template>
