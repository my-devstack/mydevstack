<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { useRouteTab } from '@/composables/useRouteTab'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'
import { useCloudFront } from '@/composables/useCloudFront'
import { useToast } from '@/composables/useToast'
import type {
  CloudFrontDistributionSummary,
  CloudFrontDistribution,
  CloudFrontOriginAccessControl,
} from '@/api/types/aws'
import { putBucketPolicy } from '@/api/services/s3'
import Tabs from '@/components/common/Tabs.vue'
import {
  CloudFrontDistributionList,
  CloudFrontDistributionModal,
  CloudFrontInvalidationList,
  CloudFrontInvalidationModal,
  CloudFrontOriginAccessControlList,
  CloudFrontOriginAccessControlModal,
  CloudFrontCodeExamples,
} from '@/components/cloudfront'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const {
  distributions,
  loading,
  creating,
  deleting,
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
} = useCloudFront()

const { activeTab, setTab } = useRouteTab('distributions')

const tabs = [
  { id: 'distributions', label: 'Distributions' },
  { id: 'invalidations', label: 'Invalidations' },
  { id: 'origin-access', label: 'Origin Access' },
]

// Modal state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const showInvalidateModal = ref(false)
const showCreateOACModal = ref(false)
const showDeleteOACModal = ref(false)

const distributionToEdit = ref<CloudFrontDistributionSummary | null>(null)
const distributionToView = ref<CloudFrontDistributionSummary | null>(null)
const distributionToDelete = ref<CloudFrontDistributionSummary | null>(null)
const distributionToInvalidate = ref<CloudFrontDistributionSummary | null>(null)
const oacToDelete = ref<CloudFrontOriginAccessControl | null>(null)

const fullDistribution = ref<CloudFrontDistribution | null>(null)

function handleTabChange(tabId: string) {
  setTab(tabId)
  if (tabId === 'invalidations' && distributionToInvalidate.value) {
    loadInvalidations(distributionToInvalidate.value.Id)
  } else if (tabId === 'origin-access') {
    loadOriginAccessControls()
  }
}

function openCreateModal() {
  distributionToEdit.value = null
  fullDistribution.value = null
  showCreateModal.value = true
}

async function openEditModal(dist: CloudFrontDistributionSummary) {
  distributionToEdit.value = dist
  const result = await getDistribution(dist.Id)
  if (result) {
    fullDistribution.value = result.Distribution
  }
  showEditModal.value = true
}

function openViewModal(dist: CloudFrontDistributionSummary) {
  distributionToView.value = dist
  showViewModal.value = true
}

function openDeleteModal(dist: CloudFrontDistributionSummary) {
  distributionToDelete.value = dist
  showDeleteModal.value = true
}

function openInvalidateModal(dist: CloudFrontDistributionSummary) {
  distributionToInvalidate.value = dist
  showInvalidateModal.value = true
}

function openCreateOACModal() {
  showCreateOACModal.value = true
}

function openDeleteOACModal(oac: CloudFrontOriginAccessControl) {
  oacToDelete.value = oac
  showDeleteOACModal.value = true
}

async function handleCreate(data: any) {
  try {
    await createDistribution(data)
    showCreateModal.value = false
  } catch {
    // Error handling in composable
  }
}

async function handleUpdate(data: any) {
  if (!distributionToEdit.value) return
  try {
    await updateDistribution(distributionToEdit.value.Id, data)
    showEditModal.value = false
  } catch {
    // Error handling in composable
  }
}

async function handleDelete() {
  if (!distributionToDelete.value) return
  try {
    await deleteDistribution(distributionToDelete.value.Id)
    showDeleteModal.value = false
    distributionToDelete.value = null
  } catch {
    // Error handling in composable
  }
}

async function handleCreateInvalidation(data: any) {
  if (!distributionToInvalidate.value) return
  try {
    await createInvalidationAction(distributionToInvalidate.value.Id, data)
    showInvalidateModal.value = false
  } catch {
    // Error handling in composable
  }
}

async function handleCreateOAC(data: any) {
  try {
    await createOriginAccessControl(data)
    showCreateOACModal.value = false
  } catch {
    // Error handling in composable
  }
}

async function handleDeleteOAC() {
  if (!oacToDelete.value) return
  try {
    await deleteOriginAccessControl(oacToDelete.value.Id)
    showDeleteOACModal.value = false
    oacToDelete.value = null
  } catch {
    // Error handling in composable
  }
}

async function handleGrantAccess(dist: CloudFrontDistributionSummary, mode: 'public' | 'oac', oacId?: string) {
  const origin = dist.Origins?.Items?.[0]
  if (!origin) {
    toast.error('No origin found for distribution')
    return
  }

  const bucketMatch = origin.DomainName.match(/^(.+)\.s3\.amazonaws\.com$/)
  if (!bucketMatch) {
    toast.error('Origin is not an S3 bucket')
    return
  }

  const bucketName = bucketMatch[1]
  let policy: any

  if (mode === 'public') {
    policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    }
  } else {
    // OAC mode
    policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipal',
          Effect: 'Allow',
          Principal: { Service: 'cloudfront.amazonaws.com' },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': dist.ARN,
            },
          },
        },
      ],
    }
  }

  try {
    await putBucketPolicy(bucketName, JSON.stringify(policy))
    toast.success(`Bucket policy applied to ${bucketName}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    toast.error('Failed to apply bucket policy: ' + message)
  }
}

onMounted(() => {
  loadDistributions()
  loadOriginAccessControls()
})

watch(reloadTrigger, () => {
  loadDistributions()
  loadOriginAccessControls()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <GlobeAltIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            CloudFront
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ distributions.length }} distribution(s)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadDistributions"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="openCreateModal"
          >
            + Create Distribution
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        :active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
        @update:active-tab="handleTabChange"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Distributions Tab -->
      <template v-if="activeTab === 'distributions'">
        <CloudFrontDistributionList
          :distributions="distributions"
          :loading="loading"
          @edit="openEditModal"
          @delete="openDeleteModal"
          @invalidate="openInvalidateModal"
          @grant-access="handleGrantAccess"
        />
      </template>

      <!-- Invalidations Tab -->
      <template v-else-if="activeTab === 'invalidations'">
        <div
          v-if="!distributionToInvalidate"
          class="py-8"
        >
          <p class="text-center text-lg text-light-muted dark:text-dark-muted">
            Select a distribution from the Distributions tab to view invalidations.
          </p>
        </div>
        <template v-else>
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-light-text dark:text-dark-text">
                Invalidation for {{ distributionToInvalidate.Id }}
              </h2>
              <button
                class="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                @click="openInvalidateModal(distributionToInvalidate)"
              >
                + Create Invalidation
              </button>
            </div>
          </div>
          <CloudFrontInvalidationList
            :invalidations="invalidations"
            :loading="invalidationsLoading"
          />
        </template>
      </template>

      <!-- Origin Access Tab -->
      <template v-else-if="activeTab === 'origin-access'">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-light-text dark:text-dark-text">
            Origin Access Controls
          </h2>
          <button
            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            @click="openCreateOACModal"
          >
            + Create OAC
          </button>
        </div>
        <CloudFrontOriginAccessControlList
          :origin-access-controls="originAccessControls"
          :loading="oacsLoading"
          @delete="openDeleteOACModal"
        />
      </template>
    </div>

    <!-- Code Examples (always visible at bottom) -->
    <div class="flex-shrink-0 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-6">
      <CloudFrontCodeExamples
        :region="settingsStore.region"
        :access-key="settingsStore.accessKey"
        :secret-key="settingsStore.secretKey"
        :distribution-id="distributionToView?.Id || distributionToEdit?.Id || ''"
      />
    </div>

    <!-- Create Distribution Modal -->
    <CloudFrontDistributionModal
      :open="showCreateModal"
      mode="create"
      :loading="creating"
      :distribution="null"
      :full-distribution="null"
      :origin-access-controls="originAccessControls"
      @update:open="(v) => showCreateModal = v"
      @create="handleCreate"
    />

    <!-- Edit Distribution Modal -->
    <CloudFrontDistributionModal
      :open="showEditModal"
      mode="edit"
      :loading="creating"
      :distribution="distributionToEdit"
      :full-distribution="fullDistribution"
      :origin-access-controls="originAccessControls"
      @update:open="(v) => showEditModal = v"
      @update="handleUpdate"
      @grant-access="handleGrantAccess"
    />

    <!-- View Distribution Modal -->
    <CloudFrontDistributionModal
      :open="showViewModal"
      mode="view"
      :loading="false"
      :distribution="distributionToView"
      :full-distribution="null"
      :origin-access-controls="[]"
      @update:open="(v) => showViewModal = v"
    />

    <!-- Delete Distribution Modal -->
    <CloudFrontDistributionModal
      :open="showDeleteModal"
      mode="delete"
      :loading="deleting"
      :distribution="distributionToDelete"
      :full-distribution="null"
      :origin-access-controls="[]"
      @update:open="(v) => showDeleteModal = v"
      @delete="handleDelete"
    />

    <!-- Create Invalidation Modal -->
    <CloudFrontInvalidationModal
      :open="showInvalidateModal"
      :loading="invalidationsLoading"
      @update:open="(v) => showInvalidateModal = v"
      @create="handleCreateInvalidation"
    />

    <!-- Create OAC Modal -->
    <CloudFrontOriginAccessControlModal
      :open="showCreateOACModal"
      :loading="oacsLoading"
      @update:open="(v) => showCreateOACModal = v"
      @create="handleCreateOAC"
    />

    <!-- Delete OAC Modal (reuse generic confirm pattern) -->
    <div
      v-if="showDeleteOACModal && oacToDelete"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteOACModal = false"
    >
      <div
        class="p-6 rounded-lg w-[500px] shadow-xl"
        :class="settingsStore.darkMode ? 'bg-gray-800' : 'bg-white'"
        role="dialog"
        aria-label="Delete OAC"
      >
        <h2
          class="text-xl font-bold mb-4"
          :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
        >
          Delete Origin Access Control
        </h2>
        <p class="text-sm text-light-text dark:text-dark-text">
          Are you sure you want to permanently delete OAC
          <span class="font-mono font-semibold">{{ oacToDelete.Name }}</span>?
        </p>
        <p class="mt-2 text-sm text-red-500">
          This action cannot be undone.
        </p>
        <div class="flex gap-2 justify-end mt-6">
          <button
            class="px-4 py-2 rounded border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-border dark:hover:bg-dark-border"
            @click="showDeleteOACModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            :disabled="oacsLoading"
            @click="handleDeleteOAC"
          >
            {{ oacsLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
