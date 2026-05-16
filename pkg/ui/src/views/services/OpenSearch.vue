<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useOpenSearch } from '@/composables/useOpenSearch'
import {
  PlusIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'
import FormInput from '@/components/common/FormInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  OpenSearchCreateDomainModal,
  OpenSearchDeleteModal,
  OpenSearchCodeExamples,
} from '@/components/opensearch'

// Composable
const {
  domains,
  loading,
  isAvailable,
  expandedDomains,
  showCreateModal,
  showDeleteConfirm,
  domainToDelete,
  codeExamples,
  loadDomains,
  deleteDomain,
  toggleDomain,
  confirmDelete,
  getStatus,
  createDomain,
  createForm,
  creating,
  domainDetails,
  loadingDomainDetails,
  compatibleVersions,
  loadingCompatibleVersions,
  loadDomainDetails,
  loadCompatibleVersions,
  getDomainTags,
  getDomainDetailsStatus,
  addDomainTag,
  removeDomainTag,
  getCompatibleVersionFor,
} = useOpenSearch()

// Pagination via composable
const {
  currentPage: domainPage,
  itemsPerPage: domainsPerPage,
  totalPages: totalDomainPages,
  paginatedItems: paginatedDomains,
  goToPage,
  perPageOptions,
} = usePagination(domains, { defaultPerPage: 10 })

// Add Tag modal state
const showAddTagModal = ref(false)
const addTagDomainName = ref('')
const newTagKey = ref('')
const newTagValue = ref('')
const addingTag = ref(false)

function openAddTagModal(domainName: string) {
  addTagDomainName.value = domainName
  newTagKey.value = ''
  newTagValue.value = ''
  showAddTagModal.value = true
}

async function handleAddTag() {
  if (!newTagKey.value) return
  addingTag.value = true
  await addDomainTag(addTagDomainName.value, newTagKey.value, newTagValue.value)
  addingTag.value = false
  showAddTagModal.value = false
}

// Load compatible versions on mount
onMounted(() => {
  loadDomains()
  loadCompatibleVersions()
})

// Stores
const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Lifecycle
watch(reloadTrigger, () => {
  loadDomains()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <svg
            class="h-6 w-6 text-light-text dark:text-dark-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            OpenSearch
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ domains.length }} domain{{ domains.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadDomains"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            :disabled="!isAvailable"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Domain
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Unavailable message -->
      <div
        v-if="!isAvailable && !loading"
        class="mb-6 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
      >
        <div class="flex items-center gap-3">
          <svg
            class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              OpenSearch is not available in this environment
            </p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
              The OpenSearch API is not supported by the current emulator. Some features may not work until a compatible backend is available.
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="!loading && domains.length === 0"
        icon="server"
        title="No Domains"
        description="Create a new OpenSearch domain to get started."
        :action-label="isAvailable ? 'Create Domain' : undefined"
        @action="showCreateModal = true"
      />

      <!-- Domain List as Accordions -->
      <template v-else>
        <div class="space-y-3">
          <div
            v-for="domain in paginatedDomains"
            :key="domain.DomainName"
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <!-- Accordion Header -->
            <div
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-50"
              :class="settingsStore.darkMode ? 'hover:bg-dark-hover' : 'hover:bg-light-hover'"
              @click="toggleDomain(domain.DomainName)"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="h-5 w-5 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div>
                  <span
                    class="font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ domain.DomainName }}
                  </span>
                  <span
                    class="ml-2 text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    {{ domain.EngineVersion || '' }}
                  </span>
                </div>
              </div>

              <div
                class="flex items-center gap-2"
                @click.stop
              >
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click="confirmDelete(domain)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <component
                  :is="expandedDomains.has(domain.DomainName) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
              </div>
            </div>

            <!-- Accordion Content -->
            <div
              v-if="expandedDomains.has(domain.DomainName)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <!-- Loading indicator for domain details -->
              <div
                v-if="loadingDomainDetails[domain.DomainName]"
                class="mt-4 flex items-center gap-2 text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                <svg
                  class="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading details...
              </div>

              <!-- Basic Info Grid -->
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Status
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    <StatusBadge
                      :status="getStatus(getDomainDetailsStatus(domain.DomainName))"
                      :label="getDomainDetailsStatus(domain.DomainName)"
                    />
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Endpoint
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ domainDetails[domain.DomainName]?.Endpoint || domainDetails[domain.DomainName]?.EndpointV2 || domain.Endpoint || domain.EndpointV2 || '-' }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Instance Type
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ (domainDetails[domain.DomainName]?.ClusterConfig?.InstanceType || domain.ClusterConfig?.InstanceType || '-') }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Instance Count
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ (domainDetails[domain.DomainName]?.ClusterConfig?.InstanceCount || domain.ClusterConfig?.InstanceCount || 1) }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    EBS Volume
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ domainDetails[domain.DomainName]?.EBSOptions?.VolumeSize ? `${domainDetails[domain.DomainName]?.EBSOptions?.VolumeSize} GB` : domain.EBSOptions?.VolumeSize ? `${domain.EBSOptions.VolumeSize} GB` : '-' }}
                  </p>
                </div>
              </div>

              <!-- Engine Version Section -->
              <div
                class="mt-4 border-t pt-4"
                :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
              >
                <h4
                  class="text-sm font-semibold mb-2 uppercase tracking-wider"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Engine Version
                </h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      class="text-xs"
                      :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                    >
                      Current Version
                    </p>
                    <p
                      class="mt-1 text-sm font-medium"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      {{ domainDetails[domain.DomainName]?.EngineVersion || domain.EngineVersion || '-' }}
                    </p>
                  </div>
                  <div v-if="domainDetails[domain.DomainName]?.EngineVersion">
                    <p
                      class="text-xs"
                      :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                    >
                      Compatible Versions
                    </p>
                    <div
                      v-if="loadingCompatibleVersions"
                      class="mt-1 text-sm"
                      :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                    >
                      Loading...
                    </div>
                    <div
                      v-else
                      class="mt-1"
                    >
                      <span
                        v-for="(v, idx) in getCompatibleVersionFor(domainDetails[domain.DomainName]?.EngineVersion || domain.EngineVersion)"
                        :key="idx"
                        class="inline-block mr-1 mb-1 px-2 py-0.5 text-xs rounded bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
                      >
                        {{ v }}
                      </span>
                      <span
                        v-if="!getCompatibleVersionFor(domainDetails[domain.DomainName]?.EngineVersion || domain.EngineVersion).length"
                        class="text-sm"
                        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                      >None</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tags Section -->
              <div
                class="mt-4 border-t pt-4"
                :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4
                    class="text-sm font-semibold uppercase tracking-wider"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Tags
                  </h4>
                  <button
                    type="button"
                    class="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1"
                    title="Add tag"
                    @click.stop="openAddTagModal(domain.DomainName)"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Tag
                  </button>
                </div>
                <div v-if="getDomainTags(domain.DomainName).length">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(tag, idx) in getDomainTags(domain.DomainName)"
                      :key="idx"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
                    >
                      <span class="font-medium">{{ tag.Key }}:</span>
                      <span>{{ tag.Value }}</span>
                      <button
                        type="button"
                        class="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700"
                        title="Remove tag"
                        @click="removeDomainTag(domain.DomainName, tag.Key)"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  </div>
                </div>
                <p
                  v-else
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  No tags
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div
      v-if="domains.length > 0"
      class="flex flex-wrap items-center justify-between gap-4 py-4 px-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
        <select
          v-model="domainsPerPage"
          class="text-sm border rounded px-2 py-1"
          :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
        >
          <option
            v-for="opt in perPageOptions"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
        <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
      </div>

      <div
        v-if="totalDomainPages > 1"
        class="flex items-center gap-2"
      >
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="domainPage === 1"
          @click="goToPage(domainPage - 1)"
        >
          Previous
        </button>
        <span
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Page {{ domainPage }} of {{ totalDomainPages }}
        </span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="domainPage === totalDomainPages"
          @click="goToPage(domainPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Modals -->
    <OpenSearchCreateDomainModal
      v-model:open="showCreateModal"
      v-model:form="createForm"
      :creating="creating"
      @create="createDomain"
    />

    <OpenSearchDeleteModal
      v-model:open="showDeleteConfirm"
      :domain="domainToDelete"
      @delete="deleteDomain"
    />

    <!-- Add Tag Modal -->
    <Modal
      :open="showAddTagModal"
      title="Add Tag"
      size="sm"
      @update:open="showAddTagModal = $event"
    >
      <div class="space-y-4 py-2">
        <FormInput
          v-model="newTagKey"
          label="Key"
          placeholder="tag-key"
          required
        />
        <FormInput
          v-model="newTagValue"
          label="Value"
          placeholder="tag-value"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showAddTagModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="addingTag"
            :disabled="!newTagKey"
            @click="handleAddTag"
          >
            Add Tag
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Code Examples -->
    <OpenSearchCodeExamples :examples="codeExamples" />
  </div>
</template>
