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
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface RDSInstance {
  DBInstanceIdentifier: string
  DBInstanceClass: string
  Engine: string
  EngineVersion: string
  DBInstanceStatus: string
  MasterUsername: string
  Endpoint?: { Address: string; Port: number | string }
  DBName?: string
  AllocatedStorage: number | string
  StorageType: string
  MultiAZ: boolean
  PubliclyAccessible: boolean
}

// State
const loading = ref(false)
const instances = ref<RDSInstance[]>([])
const expandedInstances = ref<Set<string>>(new Set())
const loadingDetails = ref<Set<string>>(new Set())

// Create form state
const newInstanceId = ref('')
const newDBEngine = ref('mysql')
const newDBVersion = ref('8.0.36')
const newDBPort = ref(3306)
const newMasterUsername = ref('root')
const newMasterPassword = ref('')
const newDBInstanceClass = ref('db.t3.micro')
const newAllocatedStorage = ref(20)
const showCreateModal = ref(false)
const creating = ref(false)

// Confirmation modals
const showDeleteConfirm = ref(false)
const showRebootConfirm = ref(false)
const instanceToDelete = ref<RDSInstance | null>(null)
const instanceToReboot = ref<RDSInstance | null>(null)
const selectedExample = ref(0)

// Usage Examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# Describe all DB instances
aws rds describe-db-instances --region us-east-1

# Describe specific instance
aws rds describe-db-instances --db-instance-identifier my-db-instance --region us-east-1

# Create DB instance (MySQL)
aws rds create-db-instance \\
  --db-instance-identifier my-db-instance \\
  --db-instance-class db.t3.micro \\
  --engine mysql \\
  --master-username admin \\
  --master-user-password mypassword \\
  --allocated-storage 20 \\
  --region us-east-1

# Create DB instance (PostgreSQL)
aws rds create-db-instance \\
  --db-instance-identifier my-postgres \\
  --db-instance-class db.t3.micro \\
  --engine postgres \\
  --master-username postgres \\
  --master-user-password mypassword \\
  --allocated-storage 20 \\
  --region us-east-1

# Delete DB instance
aws rds delete-db-instance \\
  --db-instance-identifier my-db-instance \\
  --skip-final-snapshot \\
  --region us-east-1

# Reboot DB instance
aws rds reboot-db-instance \\
  --db-instance-identifier my-db-instance \\
  --region us-east-1

# Describe available engine versions
aws rds describe-db-engine-versions --engine mysql --region us-east-1

# Modify DB instance (change instance class)
aws rds modify-db-instance \\
  --db-instance-identifier my-db-instance \\
  --db-instance-class db.t3.small \\
  --apply-immediately \\
  --region us-east-1`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { RDSClient, DescribeDBInstancesCommand, CreateDBInstanceCommand, DeleteDBInstanceCommand, RebootDBInstanceCommand } from "@aws-sdk/client-rds";

const client = new RDSClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// Describe all DB instances
const describeResponse = await client.send(new DescribeDBInstancesCommand({}));
console.log(describeResponse.DBInstances);

// Create DB instance
const createResponse = await client.send(new CreateDBInstanceCommand({
  DBInstanceIdentifier: 'my-db-instance',
  DBInstanceClass: 'db.t3.micro',
  Engine: 'mysql',
  MasterUsername: 'admin',
  MasterUserPassword: 'mypassword',
  AllocatedStorage: 20,
}));
console.log(createResponse.DBInstance);

// Delete DB instance
await client.send(new DeleteDBInstanceCommand({
  DBInstanceIdentifier: 'my-db-instance',
  SkipFinalSnapshot: true,
}));

// Reboot DB instance
await client.send(new RebootDBInstanceCommand({
  DBInstanceIdentifier: 'my-db-instance',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `import boto3

# Create RDS client
rds = boto3.client('rds',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}'
)

# Describe all DB instances
response = rds.describe_db_instances()
for instance in response['DBInstances']:
    print(f"Instance: {instance['DBInstanceIdentifier']}")
    print(f"  Status: {instance['DBInstanceStatus']}")
    print(f"  Engine: {instance['Engine']} {instance['EngineVersion']}")
    print(f"  Endpoint: {instance['Endpoint']['Address']}")

# Create DB instance
rds.create_db_instance(
    DBInstanceIdentifier='my-db-instance',
    DBInstanceClass='db.t3.micro',
    Engine='mysql',
    MasterUsername='admin',
    MasterUserPassword='mypassword',
    AllocatedStorage=20
)

# Delete DB instance
rds.delete_db_instance(
    DBInstanceIdentifier='my-db-instance',
    SkipFinalSnapshot=True
)

# Reboot DB instance
rds.reboot_db_instance(
    DBInstanceIdentifier='my-db-instance'
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
    modified: 'pending',
    failed: 'error',
    rebooting: 'pending',
  }
  const lowerStatus = status?.toLowerCase() || ''
  return statusMap[lowerStatus] || 'inactive'
}

// API calls
import {
  describeDBInstances,
  createDBInstance as apiCreateDBInstance,
  deleteDBInstance as apiDeleteDBInstance,
  rebootDBInstance as apiRebootDBInstance,
} from '@/api/services/rds'

async function loadInstances() {
  loading.value = true
  try {
    const result = await describeDBInstances()
    instances.value = result
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load instances: ${error}`)
  } finally {
    loading.value = false
  }
}

function toggleInstance(instanceId: string) {
  if (expandedInstances.value.has(instanceId)) {
    expandedInstances.value.delete(instanceId)
  } else {
    expandedInstances.value.add(instanceId)
  }
}

async function deleteInstance() {
  if (!instanceToDelete.value) return
  try {
    await apiDeleteDBInstance(instanceToDelete.value.DBInstanceIdentifier, { skipFinalSnapshot: true })
    instances.value = instances.value.filter(i => i.DBInstanceIdentifier !== instanceToDelete.value?.DBInstanceIdentifier)
    expandedInstances.value.delete(instanceToDelete.value.DBInstanceIdentifier)
    uiStore.notifySuccess('Success', `Instance ${instanceToDelete.value.DBInstanceIdentifier} is being deleted`)
    showDeleteConfirm.value = false
    instanceToDelete.value = null
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete instance: ${error}`)
  }
}

async function rebootInstance() {
  if (!instanceToReboot.value) return
  try {
    await apiRebootDBInstance(instanceToReboot.value.DBInstanceIdentifier)
    uiStore.notifySuccess('Success', `Instance ${instanceToReboot.value.DBInstanceIdentifier} is rebooting`)
    await loadInstances()
    showRebootConfirm.value = false
    instanceToReboot.value = null
  } catch (error) {
    uiStore.notifyError('Error', `Failed to reboot instance: ${error}`)
  }
}

function confirmDelete(instance: RDSInstance) {
  instanceToDelete.value = instance
  showDeleteConfirm.value = true
}

function confirmReboot(instance: RDSInstance) {
  instanceToReboot.value = instance
  showRebootConfirm.value = true
}

function resetForm() {
  newInstanceId.value = ''
  newDBEngine.value = 'mysql'
  newDBVersion.value = '8.0.36'
  newDBPort.value = 3306
  newMasterUsername.value = 'root'
  newMasterPassword.value = ''
  newDBInstanceClass.value = 'db.t3.micro'
  newAllocatedStorage.value = 20
}

async function createInstance() {
  if (!newInstanceId.value || !newMasterPassword.value) {
    uiStore.notifyWarning('Validation', 'Instance ID and password are required')
    return
  }

  creating.value = true
  try {
    await apiCreateDBInstance({
      DBInstanceIdentifier: newInstanceId.value,
      DBInstanceClass: newDBInstanceClass.value,
      Engine: newDBEngine.value,
      EngineVersion: newDBVersion.value,
      MasterUsername: newMasterUsername.value,
      MasterUserPassword: newMasterPassword.value,
      Port: newDBPort.value,
      AllocatedStorage: newAllocatedStorage.value,
    })
    
    await loadInstances()
    uiStore.notifySuccess('Success', `Instance ${newInstanceId.value} is being created`)
    showCreateModal.value = false
    resetForm()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create instance: ${error}`)
  } finally {
    creating.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadInstances()
})

watch(reloadTrigger, () => {
  loadInstances()
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
            RDS
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ instances.length }} instance{{ instances.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadInstances"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Instance
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State -->
      <EmptyState
        v-if="!loading && instances.length === 0"
        icon="server"
        title="No RDS Instances"
        description="Create a new RDS instance to get started."
        action-label="Create Instance"
        @action="showCreateModal = true"
      />
      
      <!-- Instance List as Accordions -->
      <template v-else>
        <div class="space-y-3">
          <div
            v-for="instance in instances"
            :key="instance.DBInstanceIdentifier"
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <!-- Accordion Header -->
            <div
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-50"
              :class="settingsStore.darkMode ? 'hover:bg-dark-hover' : 'hover:bg-light-hover'"
              @click="toggleInstance(instance.DBInstanceIdentifier)"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="expandedInstances.has(instance.DBInstanceIdentifier) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                />
                <ServerIcon class="h-5 w-5 text-primary-500" />
                <div>
                  <span
                    class="font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.DBInstanceIdentifier }}
                  </span>
                  <span
                    class="ml-2 text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    {{ instance.Engine }} {{ instance.EngineVersion }}
                  </span>
                </div>
                <StatusBadge
                  :status="getStatus(instance.DBInstanceStatus)"
                  :label="instance.DBInstanceStatus"
                />
              </div>
              
              <div
                class="flex items-center gap-2"
                @click.stop
              >
                <Button
                  variant="secondary"
                  size="sm"
                  @click="confirmReboot(instance)"
                >
                  Reboot
                </Button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click="confirmDelete(instance)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <!-- Accordion Content -->
            <div
              v-if="expandedInstances.has(instance.DBInstanceIdentifier)"
              class="px-4 pb-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Instance Class
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.DBInstanceClass }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Endpoint
                  </p>
                  <code
                    class="mt-1 text-xs block"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.Endpoint?.Address || '-' }}:{{ instance.Endpoint?.Port }}
                  </code>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Storage
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.AllocatedStorage }} GB ({{ instance.StorageType }})
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Master Username
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.MasterUsername }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Multi-AZ
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.MultiAZ ? 'Yes' : 'No' }}
                  </p>
                </div>
                <div>
                  <p
                    class="text-sm"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                  >
                    Public Access
                  </p>
                  <p
                    class="mt-1 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    {{ instance.PubliclyAccessible ? 'Yes' : 'No' }}
                  </p>
                </div>
              </div>
              
              <!-- Usage Examples -->
              <div class="mt-6">
                <h4
                  class="text-sm font-medium mb-3 flex items-center gap-2"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  <CloudIcon class="h-4 w-4" />
                  Connection Examples
                </h4>
                
                <div class="grid gap-3">
                  <!-- MySQL -->
                  <div
                    v-if="instance.Engine?.toLowerCase().includes('mysql')"
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      MySQL CLI
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      mysql -h {{ instance.Endpoint?.Address || 'localhost' }} -P {{ instance.Endpoint?.Port || 3306 }} -u {{ instance.MasterUsername }} -p
                    </code>
                  </div>
                  
                  <!-- PostgreSQL -->
                  <div
                    v-if="instance.Engine?.toLowerCase().includes('postgres')"
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      PostgreSQL CLI
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      psql -h {{ instance.Endpoint?.Address || 'localhost' }} -p {{ instance.Endpoint?.Port || 5432 }} -U {{ instance.MasterUsername }} -d {{ instance.DBName || 'postgres' }}
                    </code>
                  </div>
                  
                  <!-- Docker connection -->
                  <div
                    class="p-3 rounded bg-opacity-10"
                    :class="settingsStore.darkMode ? 'bg-dark-hover' : 'bg-light-hover'"
                  >
                    <p
                      class="text-xs font-medium mb-2"
                      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                    >
                      Docker Container Connection
                    </p>
                    <code
                      class="text-xs block p-2 rounded"
                      :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
                    >
                      docker run -it --rm mysql mysql -h {{ instance.Endpoint?.Address || 'localhost' }} -P {{ instance.Endpoint?.Port || 3306 }} -u {{ instance.MasterUsername }} -p
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
                      DB_HOST={{ instance.Endpoint?.Address || 'localhost' }}
                      DB_PORT={{ instance.Endpoint?.Port || 3306 }}
                      DB_USER={{ instance.MasterUsername }}
                      DB_PASS=\$DB_PASSWORD
                      DB_NAME={{ instance.DBName || 'postgres' }}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Instance Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create DB Instance"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newInstanceId"
          label="Instance Identifier"
          placeholder="my-db-instance"
          required
        />
        
        <FormSelect
          v-model="newDBEngine"
          label="Database Engine"
          :options="[
            { value: 'mysql', label: 'MySQL' },
            { value: 'postgres', label: 'PostgreSQL' },
            { value: 'mariadb', label: 'MariaDB' },
          ]"
        />
        
        <FormInput
          v-model="newDBVersion"
          label="Engine Version"
          :placeholder="newDBEngine === 'mysql' ? '8.0.36' : '15.3'"
        />
        
        <FormInput
          v-model="newMasterUsername"
          label="Master Username"
          placeholder="root"
        />
        
        <FormInput
          v-model="newMasterPassword"
          label="Master Password"
          type="password"
          placeholder="Enter password"
          required
        />
        
        <FormSelect
          v-model="newDBInstanceClass"
          label="Instance Class"
          :options="[
            { value: 'db.t3.micro', label: 't3.micro (2 vCPU, 1 GB)' },
            { value: 'db.t3.small', label: 't3.small (2 vCPU, 2 GB)' },
            { value: 'db.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
          ]"
        />
        
        <FormInput
          v-model="newDBPort"
          label="Port"
          type="number"
          :placeholder="newDBEngine === 'mysql' ? '3306' : '5432'"
        />
        
        <FormInput
          v-model="newAllocatedStorage"
          label="Allocated Storage (GB)"
          type="number"
          placeholder="20"
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
            @click="createInstance"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model:open="showDeleteConfirm"
      title="Delete DB Instance"
      size="sm"
    >
      <div class="py-4">
        <p
          class="mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Are you sure you want to delete the database instance
          <span class="font-semibold">{{ instanceToDelete?.DBInstanceIdentifier }}</span>?
        </p>
        <div
          class="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <p
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-yellow-400' : 'text-yellow-700'"
          >
            ⚠️ This action cannot be undone. The instance will be permanently deleted.
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteConfirm = false; instanceToDelete = null"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="deleteInstance"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Reboot Confirmation Modal -->
    <Modal
      v-model:open="showRebootConfirm"
      title="Reboot DB Instance"
      size="sm"
    >
      <div class="py-4">
        <p
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Are you sure you want to reboot the database instance
          <span class="font-semibold">{{ instanceToReboot?.DBInstanceIdentifier }}</span>?
        </p>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showRebootConfirm = false; instanceToReboot = null"
          >
            Cancel
          </Button>
          <Button
            @click="rebootInstance"
          >
            Reboot
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
    <div class="mt-8">
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