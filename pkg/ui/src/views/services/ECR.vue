<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { CubeIcon } from '@heroicons/vue/24/outline'
import { useECR } from '@/composables/useECR'
import type { ECRRepository, ECRImageDetail } from '@/api/types/aws'
import Tabs from '@/components/common/Tabs.vue'
import {
  ECRRepositoryList,
  ECRImageList,
  ECRModal,
  ECRCodeExamples,
} from '@/components/ecr'

const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

const {
  repositories,
  loading,
  selectedRepository,
  creating,
  deleting,
  images,
  imagesLoading,
  loadRepositories,
  createRepository,
  deleteRepository,
  selectRepository,
  loadImages,
  deleteImage,
} = useECR()

const activeTab = ref('repositories')

const tabs = [
  { id: 'repositories', label: 'Repositories' },
  { id: 'images', label: 'Images' },
]

// Modal state
const showCreateModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref<'create' | 'view' | 'delete'>('create')
const repositoryToDelete = ref<ECRRepository | null>(null)
const imageToDelete = ref<ECRImageDetail | null>(null)

function handleTabChange(tabId: string) {
  activeTab.value = tabId
  if (tabId === 'images' && !selectedRepository.value && repositories.value.length > 0) {
    selectRepository(repositories.value[0])
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  showCreateModal.value = true
}

function openViewModal(repo: ECRRepository) {
  selectedRepository.value = repo
  modalMode.value = 'view'
  showViewModal.value = true
}

function openDeleteRepositoryModal(repo: ECRRepository) {
  repositoryToDelete.value = repo
  modalMode.value = 'delete'
  showDeleteModal.value = true
}

function openDeleteImageModal(image: ECRImageDetail) {
  imageToDelete.value = image
  modalMode.value = 'delete'
  showDeleteModal.value = true
}

async function handleCreate(data: { repositoryName: string; imageTagMutability: 'MUTABLE' | 'IMMUTABLE'; scanOnPush: boolean }) {
  try {
    await createRepository({
      repositoryName: data.repositoryName,
      imageTagMutability: data.imageTagMutability,
      scanOnPush: data.scanOnPush,
    })
    showCreateModal.value = false
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleDeleteRepository() {
  if (!repositoryToDelete.value) return
  try {
    await deleteRepository(repositoryToDelete.value.RepositoryName, true)
    showDeleteModal.value = false
    repositoryToDelete.value = null
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleDeleteImage() {
  if (!selectedRepository.value || !imageToDelete.value) return
  try {
    await deleteImage(selectedRepository.value.RepositoryName, {
      ImageDigest: imageToDelete.value.ImageDigest,
    })
    showDeleteModal.value = false
    imageToDelete.value = null
  } catch (error) {
    // Error handling is done in composable
  }
}

async function handleSelectRepository(repo: ECRRepository) {
  await selectRepository(repo)
  activeTab.value = 'images'
}

onMounted(() => {
  loadRepositories()
})

watch(reloadTrigger, () => {
  loadRepositories()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CubeIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            ECR
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ repositories.length }} repository(ies)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadRepositories"
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
            + Create Repository
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        v-model:active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
        @update:active-tab="handleTabChange"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Repositories Tab -->
      <template v-if="activeTab === 'repositories'">
        <ECRRepositoryList
          :repositories="repositories"
          :loading="loading"
          @view-repository="openViewModal"
          @delete-repository="openDeleteRepositoryModal"
        />
      </template>

      <!-- Images Tab -->
      <template v-else-if="activeTab === 'images'">
        <div
          v-if="repositories.length === 0"
          class="py-8"
        >
          <p class="text-center text-lg text-light-muted dark:text-dark-muted">
            No repositories found. Create a repository first to view images.
          </p>
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">Repository:</label>
            <select
              :value="selectedRepository?.RepositoryName || repositories[0].RepositoryName"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              @change="(e) => {
                const repo = repositories.find(r => r.RepositoryName === (e.target as HTMLSelectElement).value)
                if (repo) selectRepository(repo)
              }"
            >
              <option
                v-for="repo in repositories"
                :key="repo.RepositoryName"
                :value="repo.RepositoryName"
              >
                {{ repo.RepositoryName }}
              </option>
            </select>
          </div>
          <ECRImageList
            :images="images"
            :repository-name="selectedRepository?.RepositoryName || repositories[0].RepositoryName"
            :loading="imagesLoading"
            @delete-image="openDeleteImageModal"
          />
        </template>
      </template>

    </div>

    <!-- Code Examples (always visible at bottom) -->
    <div class="flex-shrink-0 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-6">
      <ECRCodeExamples
        :region="settingsStore.region"
        :access-key="settingsStore.accessKey"
        :secret-key="settingsStore.secretKey"
        :repository-name="selectedRepository?.RepositoryName || ''"
      />
    </div>

    <!-- Create/View/Delete Modal -->
    <ECRModal
      :open="showCreateModal || showViewModal || showDeleteModal"
      :mode="modalMode"
      :loading="modalMode === 'create' ? creating : deleting"
      :repository="modalMode === 'view' || modalMode === 'delete' ? (modalMode === 'delete' ? repositoryToDelete : selectedRepository) : null"
      :image="imageToDelete"
      @update:open="(v) => { showCreateModal = v; showViewModal = v; showDeleteModal = v }"
      @create="handleCreate"
      @delete="modalMode === 'delete' && repositoryToDelete ? handleDeleteRepository() : handleDeleteImage()"
    />
  </div>
</template>