<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { PlusIcon, ArrowPathIcon, KeyIcon, BeakerIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useSSM } from '@/composables/useSSM'
import {
  SSMParametersList,
  SSMCreateModal,
  SSMValueModal,
  SSMHistoryModal,
  SSMDeleteModal,
} from '@/components/ssm'

const settingsStore = useSettingsStore()
const selectedExample = ref(0)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List parameters
aws ssm describe-parameters --endpoint-url http://localhost:4566

# Get parameter
aws ssm get-parameter \\
  --name /my-app/config \\
  --endpoint-url http://localhost:4566

# Put parameter
aws ssm put-parameter \\
  --name /my-app/config \\
  --value "my-value" \\
  --type String \\
  --endpoint-url http://localhost:4566

# Get parameters by path
aws ssm get-parameters-by-path \\
  --path /my-app/ \\
  --endpoint-url http://localhost:4566

# Delete parameter
aws ssm delete-parameter \\
  --name /my-app/config \\
  --endpoint-url http://localhost:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SSMClient, PutParameterCommand, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

// Put parameter
await client.send(new PutParameterCommand({
  Name: '/my-app/config',
  Value: 'my-value',
  Type: 'String',
}));

// Get parameter
const result = await client.send(new GetParameterCommand({
  Name: '/my-app/config',
}));
console.log(result.Parameter.Value);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'ssm',
    region_name='us-east-1',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

# Put parameter
client.put_parameter(
    Name='/my-app/config',
    Value='my-value',
    Type='String',
)

# Get parameter
response = client.get_parameter(
    Name='/my-app/config',
)
print(response['Parameter']['Value'])`
  },
])

const {
  // State
  loading,
  parameters,
  selectedParameter,
  parameterHistory,
  historyLoading,
  showCreateModal,
  showValueModal,
  showHistoryModal,
  showDeleteModal,
  newParamName,
  newParamValue,
  newParamType,
  newParamDescription,
  parameterToDelete,

  // Computed
  paramColumns,
  historyColumns,

  // Functions
  loadParameters,
  selectParameter,
  getParameterValue,
  loadParameterHistory,
  createParameter,
  updateParameter,
  deleteParameter,
  openDeleteModal,
  formatDate,
} = useSSM()
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-4 border-b flex items-center justify-between"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <div class="flex items-center gap-3">
        <KeyIcon
          class="h-6 w-6"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        />
        <h1
          class="text-xl font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Parameter Store
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="loading"
          @click="loadParameters"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          aria-label="Create Parameter"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-1" />Create Parameter
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Parameter List: show when loading OR have parameters -->
      <SSMParametersList
        v-if="loading || parameters.length > 0"
        :parameters="parameters"
        :loading="loading"
        @select="selectParameter"
        @view-value="getParameterValue"
        @view-history="(param) => { selectParameter(param); loadParameterHistory(); }"
        @delete="openDeleteModal"
      />

      <!-- Empty State: only when not loading AND no parameters -->
      <EmptyState
        v-if="!loading && parameters.length === 0"
        icon="folder"
        title="No Parameters"
        description="Create your first parameter to store and manage configuration data."
        @action="showCreateModal = true"
      />
    </div>

    <!-- Create Parameter Modal -->
    <SSMCreateModal
      :open="showCreateModal"
      :loading="loading"
      :new-param-name="newParamName"
      :new-param-value="newParamValue"
      :new-param-type="newParamType"
      :new-param-description="newParamDescription"
      @update:open="showCreateModal = $event"
      @update:new-param-name="newParamName = $event"
      @update:new-param-value="newParamValue = $event"
      @update:new-param-type="newParamType = $event"
      @update:new-param-description="newParamDescription = $event"
      @create="createParameter"
    />

    <!-- View Value Modal -->
    <SSMValueModal
      :open="showValueModal"
      :loading="loading"
      :parameter="selectedParameter"
      @update:open="showValueModal = $event"
      @update:new-param-value="newParamValue = $event"
      @update="updateParameter"
    />

    <!-- Parameter History Modal -->
    <SSMHistoryModal
      :open="showHistoryModal"
      :loading="historyLoading"
      :history="parameterHistory"
      :columns="historyColumns"
      @update:open="showHistoryModal = $event"
    />

    <!-- Delete Confirmation Modal -->
    <SSMDeleteModal
      :open="showDeleteModal"
      :loading="loading"
      :parameter-to-delete="parameterToDelete"
      @update:open="showDeleteModal = $event"
      @confirm="deleteParameter"
    />

    <!-- Usage Examples -->
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
