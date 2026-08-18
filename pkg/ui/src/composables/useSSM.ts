import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { useSettingsStore } from '@/stores/settings'
import * as ssmApi from '@/api/services/ssm'

// Types
export interface SSMParameterItem {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value?: string
  Version?: number
  Tier?: string
  DataType?: string
  Description?: string
  LastModifiedDate?: string
}

export interface SSMParameterHistoryItem {
  Name: string
  Type: string
  Value: string
  Version: number
  LastModifiedDate: string
  LastModifiedUser?: string
}

export function useSSM() {
  const toast = useToast()
  const settingsStore = useSettingsStore()
  const { reloadTrigger } = useContentReload()

  // State
  const loading = ref(false)
  const parameters = ref<SSMParameterItem[]>([])
  const selectedParameter = ref<SSMParameterItem | null>(null)
  const parameterHistory = ref<SSMParameterHistoryItem[]>([])
  const historyLoading = ref(false)

  // Modal states
  const showCreateModal = ref(false)
  const showValueModal = ref(false)
  const showHistoryModal = ref(false)
  const showDeleteModal = ref(false)

  // Form state
  const newParamName = ref('')
  const newParamValue = ref('')
  const newParamType = ref<'String' | 'StringList' | 'SecureString'>('String')
  const newParamDescription = ref('')
  const getWithDecryption = ref(false)
  const parameterToDelete = ref<SSMParameterItem | null>(null)

  // Computed columns
  const paramColumns = computed(() => [
    { key: 'Name', label: 'Name', sortable: true },
    { key: 'Type', label: 'Type', sortable: true },
    { key: 'Version', label: 'Version', sortable: true },
    { key: 'Tier', label: 'Tier', sortable: true },
    { key: 'LastModifiedDate', label: 'Modified', sortable: true },
  ])

  const historyColumns = computed(() => [
    { key: 'Version', label: 'Version', sortable: true },
    { key: 'Value', label: 'Value', sortable: false },
    { key: 'LastModifiedDate', label: 'Modified', sortable: true },
    { key: 'LastModifiedUser', label: 'Modified By', sortable: false },
  ])

  // Helper functions
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  function getParamTypeStatus(type: string): 'active' | 'pending' | 'inactive' | 'warning' {
    const typeMap: Record<string, 'active' | 'pending' | 'inactive' | 'warning'> = {
      String: 'active',
      StringList: 'active',
      SecureString: 'warning',
    }
    return typeMap[type] || 'inactive'
  }

  // API functions
  async function loadParameters() {
    loading.value = true
    try {
      const result = await ssmApi.describeParameters()
      parameters.value = result.Parameters || []
    } catch (error) {
      toast.error(`Failed to load parameters: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function selectParameter(param: SSMParameterItem) {
    selectedParameter.value = param
  }

  async function getParameterValue(param: SSMParameterItem) {
    selectedParameter.value = param
    showValueModal.value = true

    try {
      const result = await ssmApi.getParameter(param.Name, { WithDecryption: true })
      if (result.Parameter) {
        selectedParameter.value.Value = result.Parameter.Value
      }
    } catch (error) {
      toast.error(`Failed to load parameter value: ${error}`)
    }
  }

  async function loadParameterHistory() {
    if (!selectedParameter.value) return

    historyLoading.value = true
    showHistoryModal.value = true
    try {
      const result = await ssmApi.getParameterHistory(selectedParameter.value.Name, {
        WithDecryption: true,
      })
      parameterHistory.value = result.Parameters || (result.Parameter ? [result.Parameter] : [])
    } catch (error) {
      toast.error(`Failed to load parameter history: ${error}`)
    } finally {
      historyLoading.value = false
    }
  }

  async function createParameter() {
    if (!newParamName.value || !newParamValue.value) {
      toast.warning('Name and value are required')
      return
    }

    loading.value = true
    try {
      await ssmApi.putParameter({
        Name: newParamName.value,
        Value: newParamValue.value,
        Type: newParamType.value,
        Description: newParamDescription.value,
      })

      toast.success(`Parameter ${newParamName.value} created successfully`)
      showCreateModal.value = false
      resetForm()
      await loadParameters()
    } catch (error) {
      toast.error(`Failed to create parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function updateParameter() {
    if (!selectedParameter.value || !newParamValue.value) {
      toast.warning('Value is required')
      return
    }

    loading.value = true
    try {
      await ssmApi.putParameter({
        Name: selectedParameter.value.Name,
        Value: newParamValue.value,
        Type: selectedParameter.value.Type,
        Overwrite: true,
      })

      toast.success(`Parameter ${selectedParameter.value.Name} updated successfully`)
      showValueModal.value = false
      newParamValue.value = ''
      await loadParameters()

      const updatedParam = parameters.value.find(p => p.Name === selectedParameter.value!.Name)
      if (updatedParam) {
        selectedParameter.value = updatedParam
        await getParameterValue(updatedParam)
      }
    } catch (error) {
      toast.error(`Failed to update parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  async function deleteParameter() {
    if (!parameterToDelete.value) return

    loading.value = true
    try {
      await ssmApi.deleteParameter(parameterToDelete.value.Name)
      toast.success(`Parameter ${parameterToDelete.value.Name} deleted successfully`)

      if (selectedParameter.value?.Name === parameterToDelete.value.Name) {
        selectedParameter.value = null
      }

      showDeleteModal.value = false
      parameterToDelete.value = null
      await loadParameters()
    } catch (error) {
      toast.error(`Failed to delete parameter: ${error}`)
    } finally {
      loading.value = false
    }
  }

  function openDeleteModal(param: SSMParameterItem) {
    parameterToDelete.value = param
    showDeleteModal.value = true
  }

  function resetForm() {
    newParamName.value = ''
    newParamValue.value = ''
    newParamType.value = 'String'
    newParamDescription.value = ''
  }

  // Lifecycle
  onMounted(() => {
    loadParameters()
  })

  watch(reloadTrigger, () => {
    loadParameters()
  })

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List parameters
aws ssm describe-parameters --endpoint-url ${settingsStore.publicEndpoint}

# Get parameter
aws ssm get-parameter \\
  --name /my-app/config \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Put parameter
aws ssm put-parameter \\
  --name /my-app/config \\
  --value "my-value" \\
  --type String \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Get parameters by path
aws ssm get-parameters-by-path \\
  --path /my-app/ \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete parameter
aws ssm delete-parameter \\
  --name /my-app/config \\
  --endpoint-url ${settingsStore.publicEndpoint}`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { SSMClient, PutParameterCommand, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({
  region: 'us-east-1',
  endpoint: '${settingsStore.publicEndpoint}',
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
    endpoint_url='${settingsStore.publicEndpoint}',
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
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/ssm"
    "github.com/aws/aws-sdk-go-v2/service/ssm/types"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("us-east-1"),
)

client := ssm.NewFromConfig(cfg, func(o *ssm.Options) {
    o.BaseEndpoint = aws.String("${settingsStore.publicEndpoint}")
})

// Put parameter (String type)
client.PutParameter(context.Background(), &ssm.PutParameterInput{
    Name:  aws.String("/my-app/config"),
    Value: aws.String("my-value"),
    Type:  types.ParameterTypeString,
})

// Get parameter
result, _ := client.GetParameter(context.Background(), &ssm.GetParameterInput{
    Name: aws.String("/my-app/config"),
})
fmt.Println(*result.Parameter.Value)`,
    },
  ])

  return {
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
    getWithDecryption,
    parameterToDelete,

    // Computed
    paramColumns,
    historyColumns,
    codeExamples,

    // Functions
    loadParameters,
    selectParameter,
    getParameterValue,
    loadParameterHistory,
    createParameter,
    updateParameter,
    deleteParameter,
    openDeleteModal,
    resetForm,
    formatDate,
    getParamTypeStatus,
  }
}
