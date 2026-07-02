<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useEC2 } from '@/composables/useEC2'
import {
  PlusIcon,
  ArrowPathIcon,
  ServerIcon,
  KeyIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Tabs from '@/components/common/Tabs.vue'
import {
  EC2CreateInstanceModal,
  EC2KeyPairModal,
  EC2SecurityGroupModal,
  EC2DeleteModal,
  EC2CodeExamples,
} from '@/components/ec2'

// Composable
const {
  instances,
  keyPairs,
  securityGroups,
  loading,
  expandedInstances,
  expandedKeyPairs,
  expandedSecurityGroups,
  showCreateModal,
  creating,
  showDeleteConfirm,
  itemToDelete,
  deleteType,
  showKeyPairModal,
  showSecurityGroupModal,
  createForm,
  loadAll,
  runInstance,
  terminateInstance,
  startInstance,
  stopInstance,
  createKeyPair,
  importKeyPair,
  deleteKeyPair,
  createSecurityGroup,
  deleteSecurityGroup,
  toggleInstances,
  toggleKeyPairs,
  toggleSecurityGroups,
  confirmDelete,
  getStatus,
  resetForm,
  codeExamples,
} = useEC2()

// Stores
const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Tabs
const activeTab = ref('instances')

const tabs = computed(() => [
  { id: 'instances', label: 'Instances', icon: ServerIcon },
  { id: 'key-pairs', label: 'Key Pairs', icon: KeyIcon },
  { id: 'security-groups', label: 'Security Groups', icon: ShieldCheckIcon },
])

// Pagination
const {
  currentPage: instancePage,
  itemsPerPage: instancesPerPage,
  totalPages: totalInstancePages,
  paginatedItems: paginatedInstances,
  goToPage: goToInstancePage,
  perPageOptions,
} = usePagination(instances, { defaultPerPage: 10 })

const {
  currentPage: keyPairPage,
  itemsPerPage: keyPairsPerPage,
  totalPages: totalKeyPairPages,
  paginatedItems: paginatedKeyPairs,
  goToPage: goToKeyPairPage,
} = usePagination(keyPairs, { defaultPerPage: 10 })

const {
  currentPage: sgPage,
  itemsPerPage: sgPerPage,
  totalPages: totalSgPages,
  paginatedItems: paginatedSecurityGroups,
  goToPage: goToSgPage,
} = usePagination(securityGroups, { defaultPerPage: 10 })

// Key pair modal state
const newKeyMaterial = ref<string | null>(null)
const keyPairCreating = ref(false)



const deleting = ref(false)

// Security group creation
const sgCreating = ref(false)
async function handleCreateSecurityGroup(params: any) {
  sgCreating.value = true
  try {
    await createSecurityGroup(params)
    showSecurityGroupModal.value = false
  } finally {
    sgCreating.value = false
  }
}

// Instance actions
async function handleStartInstance(instanceId: string) {
  await startInstance(instanceId)
}

async function handleStopInstance(instanceId: string) {
  await stopInstance(instanceId)
}

async function handleTerminateInstance(instance: any) {
  confirmDelete(instance, 'instance')
}

// Key pair actions
async function handleCreateKeyPair(keyName: string) {
  keyPairCreating.value = true
  try {
    const result = await createKeyPair(keyName)
    if (result?.KeyMaterial) {
      newKeyMaterial.value = result.KeyMaterial
    } else {
      newKeyMaterial.value = null
      showKeyPairModal.value = false
    }
  } catch {
    // error handled in composable
  } finally {
    keyPairCreating.value = false
  }
}

async function handleImportKeyPair(keyName: string, publicKeyMaterial: string) {
  keyPairCreating.value = true
  try {
    await importKeyPair(keyName, publicKeyMaterial)
    showKeyPairModal.value = false
    newKeyMaterial.value = null
  } catch {
    // error handled in composable
  } finally {
    keyPairCreating.value = false
  }
}

// Delete handler
async function handleDelete() {
  deleting.value = true
  try {
    if (deleteType.value === 'instance') {
      await terminateInstance()
    } else if (deleteType.value === 'keypair') {
      await deleteKeyPair()
    } else if (deleteType.value === 'secgroup') {
      await deleteSecurityGroup()
    }
  } finally {
    deleting.value = false
  }
}

function openDeleteConfirm(item: any, type: 'instance' | 'keypair' | 'secgroup') {
  confirmDelete(item, type)
}

// Counts
const instanceCount = computed(() => instances.value.length)
const keyPairCount = computed(() => keyPairs.value.length)
const sgCount = computed(() => securityGroups.value.length)

// Format helper
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadAll()
})

watch(reloadTrigger, () => {
  loadAll()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ServerIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            EC2
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadAll"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            v-if="activeTab === 'instances'"
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Run Instance
          </Button>
          <Button
            v-else-if="activeTab === 'key-pairs'"
            size="sm"
            @click="showKeyPairModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Manage Key Pairs
          </Button>
          <Button
            v-else-if="activeTab === 'security-groups'"
            size="sm"
            @click="showSecurityGroupModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Security Group
          </Button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        v-model:active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- Instances Tab -->
      <template v-if="activeTab === 'instances'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ instanceCount }} instance{{ instanceCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="instances.length === 0 && !loading"
          icon="server"
          title="No EC2 Instances"
          description="Launch your first EC2 instance to get started"
          action-label="Run Instance"
          @action="showCreateModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="instance in paginatedInstances"
            :key="instance.InstanceId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleInstances(instance.InstanceId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ServerIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ instance.InstanceId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ instance.InstanceType }} | {{ instance.ImageId }}
                  </p>
                </div>
                <StatusBadge
                  :status="getStatus(instance.State?.Name)"
                  :label="instance.State?.Name || 'unknown'"
                />
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="instance.State?.Name === 'running'"
                  variant="ghost"
                  size="sm"
                  title="Stop"
                  @click.stop="handleStopInstance(instance.InstanceId)"
                >
                  <StopIcon class="h-4 w-4" />
                </Button>
                <Button
                  v-if="instance.State?.Name === 'stopped'"
                  variant="ghost"
                  size="sm"
                  title="Start"
                  @click.stop="handleStartInstance(instance.InstanceId)"
                >
                  <PlayIcon class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Terminate"
                  @click.stop="openDeleteConfirm(instance, 'instance')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedInstances.has(instance.InstanceId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedInstances.has(instance.InstanceId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Instance ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.InstanceId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Image ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.ImageId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Instance Type</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.InstanceType }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.State?.Name || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.KeyName || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Launch Time</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ formatDate(instance.LaunchTime) }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Availability Zone</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.Placement?.AvailabilityZone || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.VpcId || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subnet ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.SubnetId || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Public IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.PublicIpAddress || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Private IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.PrivateIpAddress || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="instances.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="instancesPerPage"
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
              v-if="totalInstancePages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="instancePage === 1"
                @click="goToInstancePage(instancePage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ instancePage }} of {{ totalInstancePages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="instancePage === totalInstancePages"
                @click="goToInstancePage(instancePage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Key Pairs Tab -->
      <template v-else-if="activeTab === 'key-pairs'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ keyPairCount }} key pair{{ keyPairCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="keyPairs.length === 0 && !loading"
          icon="key"
          title="No Key Pairs"
          description="Create or import a key pair to get started"
          action-label="Manage Key Pairs"
          @action="showKeyPairModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="kp in paginatedKeyPairs"
            :key="kp.KeyName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleKeyPairs(kp.KeyName)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <KeyIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ kp.KeyName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                    {{ kp.KeyFingerprint }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(kp, 'keypair')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedKeyPairs.has(kp.KeyName) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedKeyPairs.has(kp.KeyName)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ kp.KeyName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Fingerprint</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                    {{ kp.KeyFingerprint }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Type</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ kp.KeyType || 'rsa' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Pair ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ kp.KeyPairId || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="keyPairs.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="keyPairsPerPage"
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
              v-if="totalKeyPairPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="keyPairPage === 1"
                @click="goToKeyPairPage(keyPairPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ keyPairPage }} of {{ totalKeyPairPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="keyPairPage === totalKeyPairPages"
                @click="goToKeyPairPage(keyPairPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Security Groups Tab -->
      <template v-else-if="activeTab === 'security-groups'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ sgCount }} security group{{ sgCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="securityGroups.length === 0 && !loading"
          icon="shield-check"
          title="No Security Groups"
          description="Create a security group to get started"
          action-label="Create Security Group"
          @action="showSecurityGroupModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="sg in paginatedSecurityGroups"
            :key="sg.GroupId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleSecurityGroups(sg.GroupId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <ShieldCheckIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ sg.GroupName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                    {{ sg.GroupId }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(sg, 'secgroup')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedSecurityGroups.has(sg.GroupId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedSecurityGroups.has(sg.GroupId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ sg.GroupId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ sg.GroupName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ sg.Description }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ sg.VpcId }}
                  </p>
                </div>
              </div>

              <div v-if="sg.IpPermissions && sg.IpPermissions.length > 0">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Ingress Rules</label>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="border-b border-light-border dark:border-dark-border">
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Protocol
                        </th>
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Port Range
                        </th>
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(rule, idx) in sg.IpPermissions"
                        :key="idx"
                        class="border-b border-light-border/50 dark:border-dark-border/50"
                      >
                        <td class="py-2 px-3 text-light-text dark:text-dark-text">
                          {{ rule.IpProtocol }}
                        </td>
                        <td class="py-2 px-3 text-light-text dark:text-dark-text">
                          {{ rule.FromPort }}{{ rule.ToPort !== rule.FromPort ? ` - ${rule.ToPort}` : '' }}
                        </td>
                        <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                          {{ rule.IpRanges?.[0]?.CidrIp || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Ingress Rules</label>
                <p class="text-sm text-light-muted dark:text-dark-muted">
                  No ingress rules
                </p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="securityGroups.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="sgPerPage"
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
              v-if="totalSgPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="sgPage === 1"
                @click="goToSgPage(sgPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ sgPage }} of {{ totalSgPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="sgPage === totalSgPages"
                @click="goToSgPage(sgPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>



      <!-- Code Examples -->
      <EC2CodeExamples :examples="codeExamples" />
    </div>

    <!-- Modals -->
    <EC2CreateInstanceModal
      v-model:open="showCreateModal"
      v-model:form="createForm"
      :creating="creating"
      :key-pairs="keyPairs"
      :security-groups="securityGroups"
      @create="runInstance"
    />

    <EC2KeyPairModal
      v-model:open="showKeyPairModal"
      :creating="keyPairCreating"
      :new-key-material="newKeyMaterial"
      @create-key-pair="handleCreateKeyPair"
      @import-key-pair="handleImportKeyPair"
    />

    <EC2SecurityGroupModal
      v-model:open="showSecurityGroupModal"
      :creating="sgCreating"
      :vpc-list="[]"
      @create="handleCreateSecurityGroup"
    />

    <EC2DeleteModal
      v-model:open="showDeleteConfirm"
      :item-name="itemToDelete?.InstanceId || itemToDelete?.KeyName || itemToDelete?.GroupId || ''"
      :item-type="deleteType"
      :deleting="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
