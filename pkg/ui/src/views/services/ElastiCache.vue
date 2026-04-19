<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ServerIcon,
  CircleStackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloudIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types - Floci uses Replication Groups (Valkey/Redis)
interface ReplicationGroup {
  ReplicationGroupId: string
  ReplicationGroupDescription: string
  Status: string
  NodeGroups?: Array<{
    NodeGroupId: string
    PrimaryEndpoint?: { Address: string; Port: number }
    ReaderEndpoint?: { Address: string; Port: number }
    Slots?: string
  }>
  CacheNodeType?: string
  Engine?: string
  EngineVersion?: string
  MultiAZ?: string
  AutomaticFailover?: string
}

// State
const loading = ref(false)
const groups = ref<ReplicationGroup[]>([])
const expandedGroups = ref<Set<string>>(new Set())

// Create form state
const newGroupId = ref('')
const newGroupDescription = ref('')
const newNodeType = ref('cache.t3.micro')
const newEngine = ref('valkey')
const newNumNodeGroups = ref(1)
const newPort = ref(6379)
const showCreateModal = ref(false)
const creating = ref(false)

// Confirmation modals
const showDeleteConfirm = ref(false)
const groupToDelete = ref<ReplicationGroup | null>(null)
const selectedExample = ref(0)

// Usage Examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# Describe all replication groups
aws elasticache describe-replication-groups --region ${settingsStore.region}

# Describe specific group
aws elasticache describe-replication-groups \\
  --replication-group-id my-cache --region ${settingsStore.region}

# Create replication group (starts Valkey container)
aws elasticache create-replication-group \\
  --replication-group-id my-cache \\
  --replication-group-description "Dev cache" \\
  --engine valkey \\
  --cache-node-type cache.t3.micro \\
  --num-node-groups 1 \\
  --port 6379 \\
  --region ${settingsStore.region}

# Delete replication group
aws elasticache delete-replication-group \\
  --replication-group-id my-cache \\
  --region ${settingsStore.region}

# Describe users
aws elasticache describe-users --region ${settingsStore.region}

# Create user with IAM auth
aws elasticache create-user \\
  --user-id alice \\
  --user-name alice \\
  --engine redis \\
  --access-string "on ~* +@all" \\
  --no-password-required \\
  --region ${settingsStore.region}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { ElastiCacheClient, DescribeReplicationGroupsCommand, CreateReplicationGroupCommand } from "@aws-sdk/client-elasticache";

const client = new ElastiCacheClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// Describe replication groups
const describeResponse = await client.send(new DescribeReplicationGroupsCommand({}));
console.log(describeResponse.ReplicationGroups);

// Create replication group
const createResponse = await client.send(new CreateReplicationGroupCommand({
  ReplicationGroupId: 'my-cache',
  ReplicationGroupDescription: 'Dev cache',
  Engine: 'valkey',
  CacheNodeType: 'cache.t3.micro',
  NumNodeGroups: 1,
}));
console.log(createResponse.ReplicationGroup);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `import boto3

# Create ElastiCache client
elasticache = boto3.client('elasticache',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}'
)

# Describe replication groups
response = elasticache.describe_replication_groups()
for group in response['ReplicationGroups']:
    print(f"Group: {group['ReplicationGroupId']}")
    print(f"  Status: {group['Status']}")
    print(f"  Engine: {group['Engine']}")
    if group.get('NodeGroups'):
        port = group['NodeGroups'][0]['PrimaryEndpoint']['Port']
        print(f"  Port: {port}")

# Create replication group
elasticache.create_replication_group(
    ReplicationGroupId='my-cache',
    ReplicationGroupDescription='Dev cache',
    Engine='valkey',
    CacheNodeType='cache.t3.micro',
    NumNodeGroups=1
)

# Delete replication group
elasticache.delete_replication_group(
    ReplicationGroupId='my-cache'
)`
  },
])

// Helper functions
function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    available: 'active',
    creating: 'pending',
    running: 'active',
    deleting: 'pending',
    deleted: 'inactive',
    active: 'active',
  }
  const lowerStatus = status?.toLowerCase() || ''
  return statusMap[lowerStatus] || 'inactive'
}

// API calls - Floci uses Replication Groups
import {
  describeReplicationGroups,
  createReplicationGroup as apiCreateReplicationGroup,
  deleteReplicationGroup as apiDeleteReplicationGroup,
} from '@/api/services/elasticache'

async function loadGroups() {
  loading.value = true
  try {
    const result = await describeReplicationGroups()
    groups.value = result
  } catch (error: any) {
    console.error('Failed to load groups:', error)
    uiStore.notifyError('Error', `Failed to load groups: ${error}`)
    groups.value = []
  } finally {
    loading.value = false
  }
}

function toggleGroup(groupId: string) {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

async function deleteGroup() {
  if (!groupToDelete.value) return
  try {
    await apiDeleteReplicationGroup(groupToDelete.value.ReplicationGroupId)
    groups.value = groups.value.filter(g => g.ReplicationGroupId !== groupToDelete.value?.ReplicationGroupId)
    expandedGroups.value.delete(groupToDelete.value.ReplicationGroupId)
    uiStore.notifySuccess('Success', `Group ${groupToDelete.value.ReplicationGroupId} is being deleted`)
    showDeleteConfirm.value = false
    groupToDelete.value = null
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete group: ${error}`)
  }
}

function confirmDelete(group: ReplicationGroup) {
  groupToDelete.value = group
  showDeleteConfirm.value = true
}

function resetForm() {
  newGroupId.value = ''
  newGroupDescription.value = ''
  newNodeType.value = 'cache.t3.micro'
  newEngine.value = 'valkey'
  newNumNodeGroups.value = 1
  newPort.value = 6379
}

async function createGroup() {
  if (!newGroupId.value) {
    uiStore.notifyWarning('Validation', 'Group ID is required')
    return
  }

  creating.value = true
  try {
    await apiCreateReplicationGroup({
      ReplicationGroupId: newGroupId.value,
      ReplicationGroupDescription: newGroupDescription.value || 'My cache cluster',
      CacheNodeType: newNodeType.value,
      Engine: newEngine.value,
      NumNodeGroups: newNumNodeGroups.value,
      Port: newPort.value,
    })
    
    await loadGroups()
    uiStore.notifySuccess('Success', `Group ${newGroupId.value} is being created`)
    showCreateModal.value = false
    resetForm()
  } catch (error: any) {
    console.error('Failed to create group:', error)
    uiStore.notifyError('Error', `Failed to create group: ${error}`)
  } finally {
    creating.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadGroups()
})

watch(reloadTrigger, () => {
  loadGroups()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CircleStackIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            ElastiCache
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ groups.length }} group{{ groups.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadGroups"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Group
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && groups.length === 0"
        icon="server"
        title="No Replication Groups"
        description="Create a new Valkey/Redis replication group to get started."
        action-label="Create Group"
        @action="showCreateModal = true"
      />
      
      <!-- Group List as Accordions -->
      <template v-else>
        <div class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.ReplicationGroupId"
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <!-- Accordion Header -->
            <div
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-50"
              :class="settingsStore.darkMode ? 'hover:bg-dark-hover' : 'hover:bg-light-hover'"
              @click="toggleGroup(group.ReplicationGroupId)"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="expandedGroups.has(group.ReplicationGroupId) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
                <ServerIcon class="h-5 w-5 text-primary-500" />
                <div>
                  <span
                    class="font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.ReplicationGroupId }}
                  </span>
                  <span
                    class="ml-2 text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    {{ group.Engine }} {{ group.EngineVersion }}
                  </span>
                </div>
                <StatusBadge
                  :status="getStatus(group.Status)"
                  :label="group.Status"
                />
              </div>
              
              <div
                class="flex items-center gap-2"
                @click.stop
              >
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click="confirmDelete(group)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <!-- Accordion Content -->
            <div
              v-if="expandedGroups.has(group.ReplicationGroupId)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Node Type
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.CacheNodeType || '-' }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Node Groups
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.NodeGroups?.length || 1 }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Primary Port
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Port || 6379 }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Description
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ group.ReplicationGroupDescription || '-' }}
                  </p>
                </div>
              </div>
              
              <!-- Connection Examples -->
              <div class="mt-6">
                <h4
                  class="text-sm font-medium mb-3 flex items-center gap-2"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  <CloudIcon class="h-4 w-4" />
                  Connection Examples
                </h4>
                
                <div class="grid gap-3">
                  <!-- redis-cli -->
                  <div
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      redis-cli
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      redis-cli -h {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Address || 'localhost' }} -p {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Port || 6379 }}
                    </code>
                  </div>
                  
                  <!-- Docker -->
                  <div
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      Docker
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      docker run -it --rm valkey/valkey redis-cli -h {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Address || 'localhost' }} -p {{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Port || 6379 }}
                    </code>
                  </div>
                  
                  <!-- Environment Variables -->
                  <div
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      Environment Variables
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      REDIS_HOST={{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Address || 'localhost' }}
                      REDIS_PORT={{ group.NodeGroups?.[0]?.PrimaryEndpoint?.Port || 6379 }}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Group Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create Replication Group"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newGroupId"
          label="Replication Group ID"
          placeholder="my-cache"
          required
        />
        
        <FormInput
          v-model="newGroupDescription"
          label="Description"
          placeholder="My cache cluster"
        />
        
        <FormSelect
          v-model="newNodeType"
          label="Node Type"
          :options="[
            { value: 'cache.t3.micro', label: 't3.micro (0.5 vCPU, 0.5 GB)' },
            { value: 'cache.t3.small', label: 't3.small (1 vCPU, 2 GB)' },
            { value: 'cache.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
            { value: 'cache.m5.large', label: 'm5.large (2 vCPU, 8 GB)' },
          ]"
        />
        
        <FormSelect
          v-model="newEngine"
          label="Engine"
          :options="[
            { value: 'valkey', label: 'Valkey (Redis OSS compatible)' },
            { value: 'redis', label: 'Redis (legacy)' },
          ]"
        />
        
        <FormInput
          v-model="newNumNodeGroups"
          label="Number of Node Groups"
          type="number"
          placeholder="1"
        />
        
        <FormInput
          v-model="newPort"
          label="Port"
          type="number"
          placeholder="6379"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createGroup"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model:open="showDeleteConfirm"
      title="Delete Replication Group"
      size="sm"
    >
      <div class="py-4">
        <p
          class="mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Are you sure you want to delete the replication group
          <span class="font-semibold">{{ groupToDelete?.ReplicationGroupId }}</span>?
        </p>
        <div
          class="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-yellow-400' : 'text-yellow-700'"
          >
            ⚠️ This will stop and remove the Docker container.
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteConfirm = false; groupToDelete = null"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="deleteGroup"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
    <div
      class="mt-8 p-4 border-t"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>