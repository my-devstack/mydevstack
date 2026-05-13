<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useSES } from '@/composables/useSES'
import { EnvelopeIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  SESCreateIdentityModal,
  SESSendEmailModal,
  SESDeleteIdentityModal,
  SESCreateTemplateModal,
  SESDeleteTemplateModal,
  SESEditTemplateModal,
} from '@/components/ses'
import SESCodeExamples from '@/components/ses/SESCodeExamples.vue'
import type { SESIdentity, SESTemplate } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const {
  identities,
  templates,
  loading,
  sending,
  expandedIdentities,
  expandedTemplates,
  selectedTab,
  templateDetails,
  loadingTemplateDetails,
  identityDetails,
  loadingIdentityDetails,
  loadIdentities,
  createIdentity,
  deleteIdentity,
  sendEmail,
  sendEmailWithTemplate,
  loadTemplates,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  toggleIdentity,
  toggleTemplate,
  getVerificationStatus,
  switchTab,
} = useSES()

const selectedIdentity = ref<SESIdentity | null>(null)
const selectedIdentityName = ref('')
const selectedTemplate = ref<SESTemplate | null>(null)

const showCreateIdentityModal = ref(false)
const showSendEmailModal = ref(false)
const showDeleteIdentityModal = ref(false)
const showCreateTemplateModal = ref(false)
const showDeleteTemplateModal = ref(false)
const showEditTemplateModal = ref(false)
const selectedTemplateName = ref('')
const selectedTemplateForEdit = ref<any>(null)

const identityForm = ref({ name: '', type: 'EMAIL_ADDRESS', tags: [] as { Key: string; Value: string }[] })
const sendEmailForm = ref({ from: '', to: '', subject: '', body: '', htmlBody: '' })
const templateForm = ref({ name: '', subject: '', htmlBody: '', textBody: '' })

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

async function handleCreateIdentity(name: string, type: string, tags?: { Key: string; Value: string }[]) {
  await createIdentity(name, type, tags)
  showCreateIdentityModal.value = false
  identityForm.value = { name: '', type: 'EMAIL_ADDRESS', tags: [] }
}

async function handleSendEmail(form: { from: string; to: string; subject: string; body: string; htmlBody: string }) {
  const toArray = form.to.split(',').map(s => s.trim()).filter(Boolean)
  const sent = await sendEmail(form.from, toArray, form.subject, form.body, {
    HtmlBody: form.htmlBody || undefined,
  })
  if (sent) {
    showSendEmailModal.value = false
    sendEmailForm.value = { from: '', to: '', subject: '', body: '', htmlBody: '' }
  }
}

async function handleSendEmailWithTemplate(form: { from: string; to: string; templateName: string; templateData: string }) {
  const toArray = form.to.split(',').map(s => s.trim()).filter(Boolean)
  const sent = await sendEmailWithTemplate(form.from, toArray, form.templateName, form.templateData)
  if (sent) {
    showSendEmailModal.value = false
    sendEmailForm.value = { from: '', to: '', subject: '', body: '', htmlBody: '' }
  }
}

async function handleDeleteIdentity() {
  if (!selectedIdentityName.value) return
  await deleteIdentity(selectedIdentityName.value)
  showDeleteIdentityModal.value = false
  selectedIdentityName.value = ''
}

async function handleCreateTemplate(name: string, subject: string, htmlBody: string, textBody: string) {
  await createTemplate(name, subject, htmlBody || undefined, textBody || undefined)
  showCreateTemplateModal.value = false
  templateForm.value = { name: '', subject: '', htmlBody: '', textBody: '' }
}

async function handleEditTemplate(name: string, subject: string, htmlBody: string, textBody: string) {
  await updateTemplate(name, subject, htmlBody || undefined, textBody || undefined)
  showEditTemplateModal.value = false
  selectedTemplateForEdit.value = null
}

function openEditTemplateModal(template: any) {
  selectedTemplateForEdit.value = template
  showEditTemplateModal.value = true
}

function openDeleteTemplateModal(template: SESTemplate) {
  selectedTemplateName.value = template.TemplateName
  showDeleteTemplateModal.value = true
}

async function handleDeleteTemplate() {
  if (!selectedTemplateName.value) return
  await deleteTemplate(selectedTemplateName.value)
  showDeleteTemplateModal.value = false
  selectedTemplateName.value = ''
}

function openSendEmailModal(identity: SESIdentity) {
  selectedIdentity.value = identity
  if (identity.IdentityType === 'DOMAIN') {
    sendEmailForm.value = { from: `user@${identity.IdentityName}`, to: '', subject: '', body: '', htmlBody: '' }
  } else {
    sendEmailForm.value = { from: identity.IdentityName, to: '', subject: '', body: '', htmlBody: '' }
  }
  showSendEmailModal.value = true
}

function openDeleteIdentityModal(identity: SESIdentity) {
  selectedIdentityName.value = identity.IdentityName
  showDeleteIdentityModal.value = true
}

function openCreateTemplateModal() {
  templateForm.value = { name: '', subject: '', htmlBody: '', textBody: '' }
  showCreateTemplateModal.value = true
}

onMounted(() => {
  loadIdentities()
})
watch(reloadTrigger, () => {
  if (selectedTab.value === 'identities') loadIdentities()
  else loadTemplates()
})

// Pagination for identities
const {
  currentPage: identityPage,
  itemsPerPage: identitiesPerPage,
  totalPages: totalIdentityPages,
  paginatedItems: paginatedIdentities,
  goToPage: goToIdentityPage,
  perPageOptions,
} = usePagination(identities, { defaultPerPage: 10 })

// Pagination for templates
const {
  currentPage: templatePage,
  itemsPerPage: templatesPerPage,
  totalPages: totalTemplatePages,
  paginatedItems: paginatedTemplates,
  goToPage: goToTemplatePage,
} = usePagination(templates, { defaultPerPage: 10 })

const tabs = [
  { id: 'identities' as const, label: 'Identities' },
  { id: 'templates' as const, label: 'Templates' },
]
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <EnvelopeIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            SES
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ selectedTab === 'identities' ? `${identities.length} identity${identities.length !== 1 ? 'ies' : 'y'}` : `${templates.length} template${templates.length !== 1 ? 's' : ''}` }}
          </span>
        </div>
        <Button
          v-if="selectedTab === 'identities'"
          variant="primary"
          @click="showCreateIdentityModal = true"
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
          Create Identity
        </Button>
        <Button
          v-else
          variant="primary"
          @click="openCreateTemplateModal"
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
          Create Template
        </Button>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <div class="flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="py-3 text-sm font-medium border-b-2 transition-colors"
          :class="selectedTab === tab.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:border-light-border dark:hover:border-dark-border'"
          @click="switchTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <LoadingSpinner
        v-if="loading"
        size="lg"
      />

      <!-- Identities Tab -->
      <template v-if="selectedTab === 'identities' && !loading">
        <EmptyState
          v-if="identities.length === 0"
          icon="envelope"
          title="No SES Identities"
          description="Create your first email identity to start sending emails."
          action-label="Create Identity"
          @action="showCreateIdentityModal = true"
        />

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="identity in paginatedIdentities"
            :key="identity.IdentityName"
            class="border rounded-lg overflow-hidden"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div
              class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
              :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
              @click="toggleIdentity(identity.IdentityName)"
            >
              <div class="col-span-6 flex items-center gap-2">
                <EnvelopeIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                <span class="text-sm text-light-text dark:text-dark-text truncate font-medium">{{ identity.IdentityName }}</span>
              </div>
              <div class="col-span-2">
                <span
                  class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                  :class="identity.IdentityType === 'EMAIL_ADDRESS'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
                >
                  {{ identity.IdentityType === 'EMAIL_ADDRESS' ? 'Email' : 'Domain' }}
                </span>
              </div>
              <div class="col-span-2">
                <StatusBadge
                  :status="getVerificationStatus(identity.VerifiedStatus || identity.VerificationStatus)"
                  :label="identity.VerifiedStatus || identity.VerificationStatus || 'Unknown'"
                />
              </div>
              <div class="col-span-2 flex items-center justify-end gap-2">
                <button
                  class="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded"
                  title="Send Email"
                  @click.stop="openSendEmailModal(identity)"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click.stop="openDeleteIdentityModal(identity)"
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
                  :class="expandedIdentities.has(identity.IdentityName) ? 'rotate-90' : ''"
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
              v-if="expandedIdentities.has(identity.IdentityName)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="mt-4 space-y-4">
                <!-- Loading state -->
                <div
                  v-if="loadingIdentityDetails && !identityDetails[identity.IdentityName]"
                  class="py-4 text-center text-sm text-light-muted dark:text-dark-muted"
                >
                  Loading identity details...
                </div>

                <template v-else>
                  <div>
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Identity Name</label>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ identity.IdentityName }}</code>
                      <button
                        class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                        title="Copy"
                        @click="copyToClipboard(identity.IdentityName)"
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

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Type</label>
                      <span class="text-sm text-light-text dark:text-dark-text">{{ identity.IdentityType }}</span>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Sending Enabled</label>
                      <span
                        class="text-sm"
                        :class="(identityDetails[identity.IdentityName]?.SendingEnabled ?? identity.SendingEnabled) ? 'text-green-600' : 'text-red-600'"
                      >{{ (identityDetails[identity.IdentityName]?.SendingEnabled ?? identity.SendingEnabled) ? 'Yes' : 'No' }}</span>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Verified Status</label>
                      <StatusBadge
                        :status="getVerificationStatus(identityDetails[identity.IdentityName]?.VerificationStatus || identity.VerifiedStatus || identity.VerificationStatus)"
                        :label="identityDetails[identity.IdentityName]?.VerificationStatus || identity.VerifiedStatus || identity.VerificationStatus || 'Unknown'"
                      />
                    </div>
                    <div v-if="identityDetails[identity.IdentityName]?.FeedbackForwardingStatus !== undefined">
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Feedback Forwarding</label>
                      <span
                        class="text-sm"
                        :class="identityDetails[identity.IdentityName].FeedbackForwardingStatus ? 'text-green-600' : 'text-red-600'"
                      >{{ identityDetails[identity.IdentityName].FeedbackForwardingStatus ? 'Enabled' : 'Disabled' }}</span>
                    </div>
                    <div v-if="identityDetails[identity.IdentityName]?.MailFromAttributes">
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Custom MAIL FROM</label>
                      <span class="text-sm text-light-text dark:text-dark-text">
                        {{ identityDetails[identity.IdentityName].MailFromAttributes.MailFromDomain || 'Not set' }}
                        <span
                          v-if="identityDetails[identity.IdentityName].MailFromAttributes.MailFromDomainStatus"
                          class="text-xs text-light-muted"
                        >({{ identityDetails[identity.IdentityName].MailFromAttributes.MailFromDomainStatus }})</span>
                      </span>
                    </div>
                    <div v-if="identityDetails[identity.IdentityName]?.DkimSigningAttributes">
                      <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">DKIM</label>
                      <span
                        class="text-sm"
                        :class="identityDetails[identity.IdentityName].DkimSigningAttributes.DkimStatus === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'"
                      >{{ identityDetails[identity.IdentityName].DkimSigningAttributes.DkimStatus || 'Unknown' }}</span>
                    </div>
                  </div>

                  <div v-if="identityDetails[identity.IdentityName]?.Tags?.length">
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Tags</label>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="(tag, idx) in identityDetails[identity.IdentityName].Tags"
                        :key="idx"
                        class="text-xs bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text px-2 py-0.5 rounded"
                      >
                        {{ tag.Key }}={{ tag.Value }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="identities.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="identitiesPerPage"
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
              v-if="totalIdentityPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="identityPage === 1"
                @click="goToIdentityPage(identityPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ identityPage }} of {{ totalIdentityPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="identityPage === totalIdentityPages"
                @click="goToIdentityPage(identityPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Templates Tab -->
      <template v-if="selectedTab === 'templates' && !loading">
        <EmptyState
          v-if="templates.length === 0"
          icon="document"
          title="No SES Templates"
          description="Create your first email template to get started."
          action-label="Create Template"
          @action="openCreateTemplateModal"
        />

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="template in paginatedTemplates"
            :key="template.TemplateName"
            class="border rounded-lg overflow-hidden"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div
              class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
              :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
              @click="toggleTemplate(template.TemplateName)"
            >
              <div class="col-span-9 flex items-center gap-2">
                <svg
                  class="w-5 h-5 text-blue-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-sm text-light-text dark:text-dark-text truncate font-medium">{{ template.TemplateName }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-xs text-light-muted dark:text-dark-muted">{{ template.CreatedTimestamp ? new Date(template.CreatedTimestamp).toLocaleDateString() : '' }}</span>
              </div>
              <div class="col-span-1 flex items-center justify-end gap-1">
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete Template"
                  @click.stop="openDeleteTemplateModal(template)"
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
                  :class="expandedTemplates.has(template.TemplateName) ? 'rotate-90' : ''"
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
              v-if="expandedTemplates.has(template.TemplateName)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="mt-4 space-y-4">
                <div
                  v-if="loadingTemplateDetails && !templateDetails[template.TemplateName]"
                  class="py-4 text-center text-sm text-light-muted dark:text-dark-muted"
                >
                  Loading template details...
                </div>

                <template v-else>
                  <div>
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Template Name</label>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded flex-1 break-all">{{ template.TemplateName }}</code>
                      <button
                        class="p-2 rounded hover:bg-light-border dark:hover:bg-dark-border"
                        title="Copy"
                        @click="copyToClipboard(template.TemplateName)"
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

                  <div class="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      @click.stop="openEditTemplateModal(templateDetails[template.TemplateName] || template)"
                    >
                      Edit
                    </Button>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subject</label>
                    <p class="text-sm text-light-text dark:text-dark-text">
                      {{ (templateDetails[template.TemplateName]?.TemplateContent?.Subject) || 'No subject' }}
                    </p>
                  </div>

                  <div v-if="templateDetails[template.TemplateName]?.TemplateContent?.Html">
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">HTML Body</label>
                    <pre class="text-xs text-light-text dark:text-dark-text bg-light-border dark:bg-dark-border p-3 rounded overflow-x-auto max-h-48">{{ templateDetails[template.TemplateName].TemplateContent.Html }}</pre>
                  </div>

                  <div v-if="templateDetails[template.TemplateName]?.TemplateContent?.Text">
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Text Body</label>
                    <pre class="text-xs text-light-text dark:text-dark-text bg-light-border dark:bg-dark-border p-3 rounded overflow-x-auto max-h-48">{{ templateDetails[template.TemplateName].TemplateContent.Text }}</pre>
                  </div>

                  <div v-if="template.CreatedTimestamp">
                    <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
                    <span class="text-sm text-light-text dark:text-dark-text">{{ new Date(template.CreatedTimestamp).toLocaleString() }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="templates.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="templatesPerPage"
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
              v-if="totalTemplatePages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="templatePage === 1"
                @click="goToTemplatePage(templatePage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ templatePage }} of {{ totalTemplatePages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="templatePage === totalTemplatePages"
                @click="goToTemplatePage(templatePage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <SESCreateIdentityModal
      v-model:open="showCreateIdentityModal"
      v-model:form="identityForm"
      @create="handleCreateIdentity"
    />

    <SESSendEmailModal
      v-model:open="showSendEmailModal"
      v-model:form="sendEmailForm"
      :templates-list="templates"
      :sending="sending"
      :identity-name="selectedIdentity?.IdentityName"
      :identity-type="selectedIdentity?.IdentityType"
      @send="handleSendEmail"
      @send-template="handleSendEmailWithTemplate"
    />

    <SESDeleteIdentityModal
      v-model:open="showDeleteIdentityModal"
      :identity="selectedIdentityName"
      @delete="handleDeleteIdentity"
    />

    <SESCreateTemplateModal
      v-model:open="showCreateTemplateModal"
      v-model:form="templateForm"
      @create="handleCreateTemplate"
    />

    <SESDeleteTemplateModal
      v-model:open="showDeleteTemplateModal"
      :template-name="selectedTemplateName"
      @delete="handleDeleteTemplate"
    />

    <SESEditTemplateModal
      v-model:open="showEditTemplateModal"
      :template="selectedTemplateForEdit"
      @update="handleEditTemplate"
    />

    <SESCodeExamples v-if="!loading" />
  </div>
</template>
