<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useSNS } from '@/composables/useSNS'
import { MegaphoneIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  SNSCreateTopicModal,
  SNSSubscribeModal,
  SNSPublishModal,
  SNSDeleteModal,
} from '@/components/sns'
import SNSCodeExamples from '@/components/sns/SNSCodeExamples.vue'
import type { SNSTopic } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const {
  topics,
  loading,
  topicSubscriptions,
  loadingTopicSubscriptions,
  expandedTopics,
  protocolOptions,
  loadTopics,
  createTopic,
  deleteTopic,
  loadTopicSubscriptions,
  subscribe,
  publish,
  loadSubscriptions,
  toggleTopic,
  getSubscriptionStatus,
} = useSNS()

const selectedTopic = ref<SNSTopic | null>(null)
const selectedTopicArn = ref('')

const showCreateTopicModal = ref(false)
const showSubscribeModal = ref(false)
const showPublishModal = ref(false)
const showSubscriptionsModal = ref(false)
const showDeleteModal = ref(false)

const topicForm = ref({ name: '', displayName: '' })
const subscribeForm = ref({ protocol: 'https', endpoint: '' })
const publishForm = ref({ subject: '', message: '' })

const subscriptionColumns = computed(() => [
  { key: 'Protocol', label: 'Protocol', sortable: true },
  { key: 'Endpoint', label: 'Endpoint', sortable: false },
  { key: 'SubscriptionArn', label: 'Status', sortable: false },
])

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied', 'Copied to clipboard')
}

async function handleCreateTopic(name: string, displayName: string) {
  await createTopic(name, displayName)
  showCreateTopicModal.value = false
  topicForm.value = { name: '', displayName: '' }
}

async function handleSubscribe(protocol: string, endpoint: string) {
  if (!selectedTopic.value) return
  await subscribe(selectedTopic.value.TopicArn, protocol, endpoint)
  showSubscribeModal.value = false
  subscribeForm.value = { protocol: 'https', endpoint: '' }
}

async function handlePublish(subject: string, message: string) {
  if (!selectedTopic.value) return
  await publish(selectedTopic.value.TopicArn, message, subject)
  showPublishModal.value = false
  publishForm.value = { subject: '', message: '' }
}

async function handleDeleteTopic() {
  if (!selectedTopic.value) return
  await deleteTopic(selectedTopic.value.TopicArn)
  showDeleteModal.value = false
  selectedTopic.value = null
}

function openSubscribeModal(topic: SNSTopic) {
  selectedTopic.value = topic
  subscribeForm.value = { protocol: 'https', endpoint: '' }
  showSubscribeModal.value = true
}

function openPublishModal(topic: SNSTopic) {
  selectedTopic.value = topic
  publishForm.value = { subject: '', message: '' }
  showPublishModal.value = true
}

function openDeleteModal(topic: SNSTopic) {
  selectedTopic.value = topic
  showDeleteModal.value = true
}

async function openSubscriptionsModal(topicArn: string) {
  selectedTopicArn.value = topicArn
  showSubscriptionsModal.value = true
}

onMounted(() => loadTopics())
watch(reloadTrigger, () => loadTopics())

// Pagination via composable
const {
  currentPage: topicPage,
  itemsPerPage: topicsPerPage,
  totalPages: totalTopicPages,
  paginatedItems: paginatedTopics,
  goToPage,
  perPageOptions,
} = usePagination(topics, { defaultPerPage: 10 })
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <MegaphoneIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            SNS Topics
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ topics.length }} topic{{ topics.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <Button
          variant="primary"
          @click="showCreateTopicModal = true"
        >
          <template #icon>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Create Topic
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <LoadingSpinner
        v-if="loading"
        size="lg"
      />

      <EmptyState
        v-else-if="topics.length === 0"
        icon="megaphone"
        title="No SNS Topics"
        description="Create your first SNS topic to get started."
        action-label="Create Topic"
        @action="showCreateTopicModal = true"
      />

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="topic in paginatedTopics"
          :key="topic.TopicArn"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <div
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleTopic(topic.TopicArn)"
          >
            <div class="col-span-10 flex items-center gap-2">
              <svg
                class="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H5a4 4 0 110-6z"
                />
              </svg>
              <code class="text-xs text-light-text dark:text-dark-text truncate">{{ topic.TopicArn }}</code>
            </div>
            <div class="col-span-2 flex items-center justify-end gap-2">
              <button
                class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete"
                @click.stop="openDeleteModal(topic)"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <svg
                class="w-5 h-5 text-light-muted dark:text-dark-muted transition-transform"
                :class="expandedTopics.has(topic.TopicArn) ? 'rotate-90' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          <div
            v-if="expandedTopics.has(topic.TopicArn)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Topic ARN</label>
                <div class="flex items-center gap-2">
                  <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ topic.TopicArn }}</code>
                  <button
                    class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                    title="Copy ARN"
                    @click="copyToClipboard(topic.TopicArn)"
                  >
                    <svg
                      class="w-4 h-4 text-light-muted dark:text-dark-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  @click="openSubscribeModal(topic)"
                >
                  Subscribe
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  @click="openPublishModal(topic)"
                >
                  Publish
                </Button>
              </div>

              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subscriptions</label>
                <LoadingSpinner
                  v-if="loadingTopicSubscriptions"
                  size="sm"
                />
                <div
                  v-else-if="!topicSubscriptions[topic.TopicArn]?.length"
                  class="text-sm text-light-muted dark:text-dark-muted py-2"
                >
                  No subscriptions
                </div>
                <div
                  v-else
                  class="divide-y divide-light-border dark:divide-dark-border"
                >
                  <div
                    v-for="(sub, idx) in topicSubscriptions[topic.TopicArn]"
                    :key="idx"
                    class="py-2 flex items-center justify-between"
                  >
                    <div>
                      <span class="text-xs text-light-text dark:text-dark-text">{{ sub.Protocol }}</span>
                      <span class="text-xs text-light-muted dark:text-dark-muted ml-2">{{ sub.Endpoint }}</span>
                    </div>
                    <span
                      class="text-xs px-2 py-0.5 rounded"
                      :class="sub.SubscriptionArn?.includes('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                    >
                      {{ sub.SubscriptionArn?.includes('Pending') ? 'Pending' : 'Confirmed' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="topics.length > 0"
          class="flex flex-wrap items-center justify-between gap-4 py-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
            <select
              v-model="topicsPerPage"
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
            v-if="totalTopicPages > 1"
            class="flex items-center gap-2"
          >
            <button
              class="px-3 py-1 rounded border disabled:opacity-50"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
              :disabled="topicPage === 1"
              @click="goToPage(topicPage - 1)"
            >
              Previous
            </button>
            <span
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Page {{ topicPage }} of {{ totalTopicPages }}
            </span>
            <button
              class="px-3 py-1 rounded border disabled:opacity-50"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
              :disabled="topicPage === totalTopicPages"
              @click="goToPage(topicPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <SNSCreateTopicModal
      v-model:open="showCreateTopicModal"
      v-model:form="topicForm"
      @create="handleCreateTopic"
    />

    <SNSSubscribeModal
      v-model:open="showSubscribeModal"
      v-model:form="subscribeForm"
      :topic="selectedTopic"
      :protocol-options="protocolOptions"
      @subscribe="handleSubscribe"
    />

    <SNSPublishModal
      v-model:open="showPublishModal"
      v-model:form="publishForm"
      :topic="selectedTopic"
      @publish="handlePublish"
    />

    <Modal
      v-model:open="showSubscriptionsModal"
      title="Topic Subscriptions"
      size="lg"
    >
      <LoadingSpinner v-if="loadingTopicSubscriptions" />
      <EmptyState
        v-else-if="!topicSubscriptions[selectedTopicArn]?.length"
        icon="user"
        title="No Subscriptions"
        description="No subscriptions found for this topic."
      />
      <DataTable
        v-else
        :columns="subscriptionColumns"
        :data="topicSubscriptions[selectedTopicArn] || []"
        empty-title="No Subscriptions"
        empty-text="No subscriptions found."
      >
        <template #cell-Protocol="{ value }">
          <StatusBadge
            status="active"
            :label="value"
          />
        </template>
        <template #cell-Endpoint="{ value }">
          <span class="text-light-text dark:text-dark-text truncate">{{ value }}</span>
        </template>
        <template #cell-SubscriptionArn="{ value }">
          <StatusBadge
            :status="getSubscriptionStatus(value)"
            :label="value?.includes('PendingConfirmation') ? 'Pending' : value?.includes(':confirmed') ? 'Confirmed' : 'Unknown'"
          />
        </template>
      </DataTable>
      <template #footer>
        <Button
          variant="secondary"
          @click="showSubscriptionsModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <SNSDeleteModal
      v-model:open="showDeleteModal"
      :topic="selectedTopic"
      @delete="handleDeleteTopic"
    />

    <SNSCodeExamples v-if="!loading" />
  </div>
</template>