<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import { GlobeAltIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import APIGatewayIntegrationDetailsModal from '@/components/apiGateway/APIGatewayIntegrationDetailsModal.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Tabs from '@/components/common/Tabs.vue'
import * as apigateway from '@/api/services/api-gateway'
import { listFunctions } from '@/api/services/lambda'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { APIGatewayRestAPI, APIGatewayResource, APIGatewayMethod } from '@/api/types/aws'

// New component imports
import APIGatewayCodeExamples from '@/components/apiGateway/APIGatewayCodeExamples.vue'
import APIGatewayRestApisList from '@/components/apiGateway/APIGatewayRestApisList.vue'
import APIGatewayHttpApisList from '@/components/apiGateway/APIGatewayHttpApisList.vue'
import APIGatewayCreateModal from '@/components/apiGateway/APIGatewayCreateModal.vue'
import APIGatewayDeleteModal from '@/components/apiGateway/APIGatewayDeleteModal.vue'
import APIGatewayDeploymentsModal from '@/components/apiGateway/APIGatewayDeploymentsModal.vue'
import APIGatewayMethodModal from '@/components/apiGateway/APIGatewayMethodModal.vue'
import APIGatewayResourceModal from '@/components/apiGateway/APIGatewayResourceModal.vue'
import APIGatewayRouteModal from '@/components/apiGateway/APIGatewayRouteModal.vue'
import APIGatewayIntegrationModal from '@/components/apiGateway/APIGatewayIntegrationModal.vue'
import APIGatewayStageModal from '@/components/apiGateway/APIGatewayStageModal.vue'
import APIGatewayRoutesModal from '@/components/apiGateway/APIGatewayRoutesModal.vue'
import APIGatewayIntegrationsModal from '@/components/apiGateway/APIGatewayIntegrationsModal.vue'
import APIGatewayEditConfigModal from '@/components/apiGateway/APIGatewayEditConfigModal.vue'
import APIGatewayEditRouteModal from '@/components/apiGateway/APIGatewayEditRouteModal.vue'
import APIGatewayEditIntegrationModal from '@/components/apiGateway/APIGatewayEditIntegrationModal.vue'
import APIGatewayEditStageModal from '@/components/apiGateway/APIGatewayEditStageModal.vue'
import APIGatewayViewDetailsModal from '@/components/apiGateway/APIGatewayViewDetailsModal.vue'
import APIGatewayViewRestModal from '@/components/apiGateway/APIGatewayViewRestModal.vue'
import APIGatewaySetupIntegrationModal from '@/components/apiGateway/APIGatewaySetupIntegrationModal.vue'
import APIGatewayInvokeUrlModal from '@/components/apiGateway/APIGatewayInvokeUrlModal.vue'

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toast = useToast()

// State
const activeTab = ref<'rest' | 'http'>('rest')
const loading = ref(false)

// REST API state
const restApis = ref<APIGatewayRestAPI[]>([])
const restResources = ref<APIGatewayResource[]>([])
const restMethods = ref<Record<string, APIGatewayMethod>>({})
const selectedRestApi = ref<APIGatewayRestAPI | null>(null)
const selectedResource = ref<APIGatewayResource | null>(null)
const loadingRestApis = ref(false)
const loadingResources = ref(false)
const loadingMethods = ref(false)
const expandedApis = ref<Set<string>>(new Set())
const expandedResources = ref<Set<string>>(new Set())
const resourceMethodsMap = ref<Record<string, Record<string, APIGatewayMethod>>>({})
const resourceMethodsLoading = ref<Record<string, boolean>>({})
const justCreatedMethod = ref<string | null>(null)
function toggleApiExpansion(apiId: string) {
  if (expandedApis.value.has(apiId)) {
    expandedApis.value.delete(apiId)
  } else {
    expandedApis.value.add(apiId)
    loadResourcesForApi(apiId)
  }
  expandedApis.value = new Set(expandedApis.value)
}

// Toggle resource expansion
function toggleResourceExpansion(resourceId: string) {
  if (expandedResources.value.has(resourceId)) {
    expandedResources.value.delete(resourceId)
  } else {
    expandedResources.value.add(resourceId)
    loadMethodsForResource(resourceId)
  }
  expandedResources.value = new Set(expandedResources.value)
}

// HTTP API state
const expandedHttpApis = ref<Set<string>>(new Set())

// Toggle HTTP API expansion
function toggleHttpApiExpansion(apiId: string) {
  if (expandedHttpApis.value.has(apiId)) {
    expandedHttpApis.value.delete(apiId)
  } else {
    expandedHttpApis.value.add(apiId)
    loadHttpApiDetails(apiId)
  }
  expandedHttpApis.value = new Set(expandedHttpApis.value)
}

// Load routes and integrations for expanded HTTP API
async function loadHttpApiDetails(apiId: string) {
  if (!apiId) {
    console.warn('loadHttpApiDetails called with empty apiId')
    return
  }
  
  const api = httpApis.value.find(a => a.apiId === apiId)
  if (!api) {
    console.warn('API not found in list:', apiId)
    // Try reloading the APIs list first
    try {
      await loadHttpApis()
      const updatedApi = httpApis.value.find(a => a.apiId === apiId)
      if (!updatedApi) {
        console.error('API still not found after reload:', apiId)
        return
      }
      selectedHttpApi.value = updatedApi
    } catch (error) {
      console.error('Failed to reload APIs:', error)
      return
    }
  } else {
    selectedHttpApi.value = api
  }
  loadingRoutes.value = true
  loadingIntegrations.value = true
  loadingHttpStages.value = true
  
  try {
    const [routesResponse, integrationsResponse, stagesResponse] = await Promise.all([
      apigateway.getRoutes(apiId).catch((err) => { 
        console.error('Error loading routes:', err)
        return { items: [] } 
      }),
      apigateway.getIntegrations(apiId).catch((err) => { 
        console.error('Error loading integrations:', err)
        return { items: [] } 
      }),
      apigateway.getHttpApiStages(apiId).catch((err) => { 
        console.error('Error loading stages:', err)
        return { items: [] } 
      }),
    ])

    httpRoutes.value = routesResponse?.items || []
    httpIntegrations.value = integrationsResponse?.items || []
    httpStages.value = stagesResponse?.items || []
  } catch (error) {
    console.error('Error loading HTTP API details:', error)
    httpRoutes.value = []
    httpIntegrations.value = []
    httpStages.value = []
  } finally {
    loadingRoutes.value = false
    loadingIntegrations.value = false
    loadingHttpStages.value = false
  }
}

// Load resources for expanded API
async function loadResourcesForApi(apiId: string) {
  const api = restApis.value.find(a => a.id === apiId)
  if (!api) return
  
  selectedRestApi.value = api
  loadingResources.value = true
  loadingDeployments.value = true
  loadingRestStages.value = true
  
  try {
    const [resourcesResponse, deploymentsResponse, stagesResponse] = await Promise.all([
      apigateway.getResources(api.id).catch((err) => { 
        console.error('Error loading resources:', err)
        return { items: [] } 
      }),
      apigateway.getDeployments(api.id).catch((err) => { 
        console.error('Error loading deployments:', err)
        return { items: [] } 
      }),
      apigateway.getRestApiStages(api.id).catch((err) => { 
        console.error('Error loading stages:', err)
        return { items: [] } 
      }),
    ])

    restResources.value = resourcesResponse?.items || []
    restDeployments.value = deploymentsResponse?.items || []
    restStages.value = stagesResponse?.items || []
  } catch (error) {
    console.error('Error loading REST API details:', error)
    restResources.value = []
    restDeployments.value = []
    restStages.value = []
  } finally {
    loadingResources.value = false
    loadingDeployments.value = false
    loadingRestStages.value = false
  }
}

// Load methods for expanded resource
async function loadMethodsForResource(resourceId: string) {
  if (!selectedRestApi.value) return
  
  const resource = restResources.value.find(r => r.id === resourceId)
  if (!resource) return
  
  resourceMethodsLoading.value[resourceId] = true
  resourceMethodsMap.value[resourceId] = {}
  
  // Try to get methods from resourceMethods, fallback to trying all common methods
  const resourceMethods = resource.resourceMethods || {}
  const methods = Object.keys(resourceMethods)
  
  // If resourceMethods exists and has entries, use it; otherwise try all methods
  const methodsToTry = methods.length > 0 ? methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  
  for (const method of methodsToTry) {
    try {
      const result = await apigateway.getMethod(selectedRestApi.value.id, resource.id, method)
      // Only add if method actually exists (has httpMethod)
      if (result && (result.httpMethod || result.HttpMethod)) {
        try {
          const integration = await apigateway.getIntegration(selectedRestApi.value.id, resource.id, method)
          resourceMethodsMap.value[resourceId][method] = { ...result, ...integration }
        } catch {
          resourceMethodsMap.value[resourceId][method] = result
        }
      }
    } catch {
      // Method doesn't exist - skip
    }
  }
  
  resourceMethodsLoading.value[resourceId] = false
  resourceMethodsMap.value = { ...resourceMethodsMap.value }
}

// HTTP API state
const httpApis = ref<any[]>([])
const httpRoutes = ref<any[]>([])
const httpIntegrations = ref<any[]>([])
const httpStages = ref<any[]>([])
const selectedHttpApi = ref<any | null>(null)
const loadingHttpApis = ref(false)
const loadingRoutes = ref(false)
const loadingIntegrations = ref(false)
const loadingHttpStages = ref(false)

// REST API Deployments & Stages state
const restDeployments = ref<any[]>([])
const restStages = ref<any[]>([])
const loadingDeployments = ref(false)
const loadingRestStages = ref(false)

// Modal state
const showCreateRestModal = ref(false)
const showCreateResourceModal = ref(false)
const showCreateMethodModal = ref(false)
const showCreateHttpModal = ref(false)
const showCreateRouteModal = ref(false)
const showCreateIntegrationModal = ref(false)
const showRoutesModal = ref(false)
const showIntegrationsModal = ref(false)
const showEditRestModal = ref(false)
const showViewRestModal = ref(false)
const showDeleteRestModal = ref(false)
const showDeleteResourceModal = ref(false)
const showIntegrationModal = ref(false)
const showMethodsModal = ref(false)
const showCreateDeploymentModal = ref(false)
const showCreateStageModal = ref(false)
const showCreateHttpStageModal = ref(false)

// Invoke URL modal state
const showInvokeUrlModal = ref(false)
const invokeUrlLoading = ref(false)
const invokeUrl = ref('')
const selectedInvokeUrlApi = ref<any>(null)
const selectedInvokeUrlStage = ref('')

// Edit modals state
const showEditRouteModal = ref(false)
const showEditIntegrationModal = ref(false)
const showEditHttpStageModal = ref(false)
const editingRoute = ref<any>(null)
const editingIntegration = ref<any>(null)
const editingStage = ref<any>(null)

// Delete confirmation state
const showDeleteMethodModal = ref(false)
const showDeleteRouteModal = ref(false)
const showDeleteIntegrationModal = ref(false)
const showDeleteHttpStageModal = ref(false)
const showDeleteDeploymentModal = ref(false)
const showDeleteRestStageModal = ref(false)
const deleteIntegrationApiId = ref('')
const deleteIntegrationId = ref('')
const deleteHttpStageApiId = ref('')
const deleteDeploymentApiId = ref('')
const deleteDeploymentId = ref('')
const deleteRestStageApiId = ref('')
const deleteMethodName = ref('')
const deleteRouteApiId = ref('')
const deleteRouteId = ref('')
const deleteStageName = ref('')
const deleteResourceId = ref('')

// Edit REST API state
const editingRestApi = ref<APIGatewayRestAPI | null>(null)
const editRestApiName = ref('')
const editRestApiDescription = ref('')
const editing = ref(false)

// View REST API state
const viewRestApiDetails = ref<APIGatewayRestAPI | null>(null)
const viewLoading = ref(false)

// Delete REST API state
const apiToDelete = ref<APIGatewayRestAPI | null>(null)
const deleting = ref(false)

// Delete HTTP API state
const deleteApiId = ref('')
const deleteApiName = ref('')
const showDeleteHttpApiModal = ref(false)

// Delete Resource state
const resourceToDelete = ref<APIGatewayResource | null>(null)
const deletingResource = ref(false)

// Integration modal state
const selectedMethodForIntegration = ref<APIGatewayMethod | null>(null)
const selectedMethodName = ref('')
const loadingIntegration = ref(false)
const currentIntegration = ref<any>(null)
const newIntegrationType = ref('MOCK')
const newIntegrationUri = ref('')
const newIntegrationHttpMethod = ref('POST')
const savingIntegration = ref(false)

// Integration details modal
const showIntegrationDetailsModal = ref(false)
const integrationDetailsData = ref<any>(null)

function showMethodIntegrationDetails(details: any) {
  integrationDetailsData.value = details
  showIntegrationDetailsModal.value = true
}

// Deployment modal state
const newDeploymentStageName = ref('')
const newDeploymentDescription = ref('')

// REST API Stage modal state
const newRestStageName = ref('')
const newRestStageDeploymentId = ref('')
const newRestStageDescription = ref('')

// HTTP API Stage modal state
const newHttpStageName = ref('')
const newHttpStageDescription = ref('')
const newHttpStageAutoDeploy = ref(true)

// Invoke URL stages dropdown
const restStagesForInvoke = ref<any[]>([])
const httpStagesForInvoke = ref<any[]>([])

// HTTP API Route form state
const newRouteAuthType = ref('NONE')
const newRouteAuthorizerId = ref('')
const newRouteTarget = ref('')

// HTTP API Integration form state
const httpApiIntegrationType = ref('AWS_PROXY')
const httpApiIntegrationUri = ref('')
const httpApiIntegrationDescription = ref('')
const httpApiIntegrationMethod = ref('POST')
const httpApiIntegrationTimeout = ref(30000)
const httpApiIntegrationCredentialsArn = ref('')
const httpApiConnectionType = ref('INTERNET')
const httpApiConnectionId = ref('')
const availableLambdas = ref<any[]>([])
const selectedLambdaArn = ref('')

// Load Lambda functions for integration dropdown
async function loadLambdaFunctions() {
  try {
    const result = await listFunctions()
    availableLambdas.value = result.functions || []
  } catch (error) {
    console.error('Error loading Lambda functions:', error)
    availableLambdas.value = []
  }
}

// Usage Examples
const selectedExample = ref(0)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List REST APIs
aws apigateway get-rest-apis --endpoint-url http://127.0.0.1:4566

# Get REST API details
aws apigateway get-rest-api --rest-api-id <api-id> --endpoint-url http://127.0.0.1:4566

# Create REST API
aws apigateway create-rest-api --name "my-api" --endpoint-url http://127.0.0.1:4566

# Create Resource
aws apigateway create-resource --rest-api-id <api-id> --parent-id <parent-id> --path-part "items" --endpoint-url http://127.0.0.1:4566

# Create Method (GET)
aws apigateway put-method --rest-api-id <api-id> --resource-id <resource-id> --http-method GET --authorization-type NONE --endpoint-url http://127.0.0.1:4566

# Create Deployment
aws apigateway create-deployment --rest-api-id <api-id> --stage-name prod --endpoint-url http://127.0.0.1:4566

# Delete REST API
aws apigateway delete-rest-api --rest-api-id <api-id> --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { APIGatewayClient, GetRestApisCommand, CreateRestApiCommand, GetRestApiCommand, DeleteRestApiCommand } from "@aws-sdk/client-api-gateway";

const client = new APIGatewayClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List REST APIs
  const listResponse = await client.send(new GetRestApisCommand({}));
  const createResponse = await client.send(new CreateRestApiCommand({
    name: 'my-api',
    description: 'My API',
  }));
const getResponse = await client.send(new GetRestApiCommand({
    restApiId: '<api-id>',
  }));

  // Delete REST API
await client.send(new DeleteRestApiCommand({
  restApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'apigateway',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List REST APIs
response = client.get_rest_apis()
for api in response['items']:
    print(f"  {api['name']} ({api['id']})")

# Create REST API
response = client.create_rest_api(
    name='my-api',
    description='My API'
)
print(f"Created API: {response['id']}")

# Get REST API details
response = client.get_rest_api(rest_api_id='<api-id>')
print(f"API: {response}")

# Delete REST API
client.delete_rest_api(rest_api_id='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigateway"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := apigateway.New(apigateway.Options{
    Region: "${settingsStore.region}",
    BaseURL: aws.String("http://127.0.0.1:4566"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${settingsStore.accessKey}",
                SecretAccessKey: "${settingsStore.secretKey}",
            }, nil
        },
    ),
})

// List REST APIs
listOutput, err := client.GetRestApis(context.Background(), &apigateway.GetRestApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.Id))
}

// Create REST API
createOutput, err := client.CreateRestApi(context.Background(), &apigateway.CreateRestApiInput{
    Name:        aws.String("my-api"),
    Description: aws.String("My API"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created API ID: %s\\n", aws.StringValue(createOutput.Id))

// Delete REST API
_, err = client.DeleteRestApi(context.Background(), &apigateway.DeleteRestApiInput{
    RestApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("API deleted")`
  },
])

// HTTP API Examples
const httpApiExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List HTTP APIs
aws apigatewayv2 get-apis --endpoint-url http://127.0.0.1:4566

# Get HTTP API details
aws apigatewayv2 get-api --api-id <api-id> --endpoint-url http://127.0.0.1:4566

# Create HTTP API
aws apigatewayv2 create-api --name "my-http-api" --protocol-type HTTP --endpoint-url http://127.0.0.1:4566

# Create Route
aws apigatewayv2 create-route --api-id <api-id> --route-key "GET /items" --endpoint-url http://127.0.0.1:4566

# Create Integration
aws apigatewayv2 create-integration --api-id <api-id> --integration-type HTTP_PROXY --uri "http://localhost:8080" --endpoint-url http://127.0.0.1:4566

# Create Stage
aws apigatewayv2 create-stage --api-id <api-id> --stage-name prod --endpoint-url http://127.0.0.1:4566

# Delete HTTP API
aws apigatewayv2 delete-api --api-id <api-id> --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3 - ApiGatewayV2
import { ApiGatewayV2Client, GetApisCommand, CreateApiCommand, DeleteApiCommand } from "@aws-sdk/client-api-gatewayv2";

const client = new ApiGatewayV2Client({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List HTTP APIs
const listResponse = await client.send(new GetApisCommand({}));

// Create HTTP API
const createResponse = await client.send(new CreateApiCommand({
  Name: 'my-http-api',
  ProtocolType: 'HTTP',
}));

// Delete HTTP API
await client.send(new DeleteApiCommand({
  ApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3 - apigatewayv2
import boto3

client = boto3.client(
    'apigatewayv2',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List HTTP APIs
response = client.get_apis()
for api in response['Items']:
    print(f"  {api['Name']} ({api['ApiId']})")

# Create HTTP API
response = client.create_api(
    Name='my-http-api',
    ProtocolType='HTTP'
)
print(f"Created API: {response['ApiId']}")

# Delete HTTP API
client.delete_api(ApiId='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2 - ApiGatewayV2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := apigatewayv2.New(apigatewayv2.Options{
    Region: "${settingsStore.region}",
    BaseURL: aws.String("http://127.0.0.1:4566"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${settingsStore.accessKey}",
                SecretAccessKey: "${settingsStore.secretKey}",
            }, nil
        },
    ),
})

// List HTTP APIs
listOutput, err := client.GetApis(context.Background(), &apigatewayv2.GetApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("HTTP API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.ApiId))
}

// Create HTTP API
createOutput, err := client.CreateApi(context.Background(), &apigatewayv2.CreateApiInput{
    Name:        aws.String("my-http-api"),
    ProtocolType: aws.String("HTTP"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created HTTP API ID: %s\\n", aws.StringValue(createOutput.ApiId))

// Delete HTTP API
_, err = client.DeleteApi(context.Background(), &apigatewayv2.DeleteApiInput{
    ApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("HTTP API deleted")`
  },
])

// Selected example index for each tab
const restExampleIndex = ref(0)
const httpExampleIndex = ref(0)

// Form state
const newRestApiName = ref('')
const newRestApiDescription = ref('')
const newResourcePath = ref('')
const newResourceParentId = ref('')
const newMethodType = ref('GET')
const newMethodResourceId = ref('')
const newMethodAuthType = ref('NONE')
const newMethodAuthorizerId = ref('')
const newMethodApiKeyRequired = ref(false)
const newHttpApiName = ref('')
const newHttpApiDescription = ref('')
const newRouteKey = ref('GET /')

const creating = ref(false)
const creatingIntegration = ref(false)

// REST API columns
const restApiColumns = computed(() => [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'id', label: 'ID', sortable: false },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'createdDate', label: 'Created', sortable: true },
])

// Resource columns
const resourceColumns = computed(() => [
  { key: 'path', label: 'Path', sortable: true },
  { key: 'pathPart', label: 'Path Part', sortable: false },
  { key: 'id', label: 'Resource ID', sortable: false },
])

// HTTP API columns
const httpApiColumns = computed(() => [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'apiId', label: 'API ID', sortable: false },
  { key: 'createdDate', label: 'Created', sortable: true },
])

// Route columns
const routeColumns = computed(() => [
  { key: 'routeKey', label: 'Route Key', sortable: true },
  { key: 'routeId', label: 'Route ID', sortable: false },
])

// Integration columns
const integrationColumns = computed(() => [
  { key: 'integrationType', label: 'Type', sortable: true },
  { key: 'integrationId', label: 'Integration ID', sortable: false },
  { key: 'integrationUri', label: 'URI', sortable: false },
])

const isLocalStack = computed(() => {
  return settingsStore.provider === 'localstack' || settingsStore.emulator === 'localstack'
})

// Load REST APIs
async function loadRestApis() {
  loadingRestApis.value = true
  try {
    const response = await apigateway.getRestApis()
    restApis.value = response?.items || response?.Items || []
  } catch (error) {
    console.error('Error loading REST APIs:', error)
    toast.error('Failed to load REST APIs')
  } finally {
    loadingRestApis.value = false
  }
}

// Load resources for selected REST API
async function loadResources(api: APIGatewayRestAPI) {
  selectedRestApi.value = api
  loadingResources.value = true
  try {
    const response = await apigateway.getResources(api.id)
    restResources.value = response?.items || response?.Items || []
  } catch (error) {
    console.error('Error loading resources:', error)
  } finally {
    loadingResources.value = false
  }
}

// Load methods for selected resource
async function loadMethods(resource: APIGatewayResource) {
  if (!selectedRestApi.value) return
  selectedResource.value = resource
  loadingMethods.value = true

  restMethods.value = {}
  
  // Try to get methods from resourceMethods, fallback to trying all common methods
  const resourceMethods = resource.resourceMethods || {}
  const methods = Object.keys(resourceMethods)
  
  // If resourceMethods exists and has entries, use it; otherwise try all methods
  const methodsToTry = methods.length > 0 ? methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  
  for (const method of methodsToTry) {
    try {
      const methodDetails = await apigateway.getMethod(selectedRestApi.value.id, resource.id, method)
      // Only add if method actually exists
      if (methodDetails && (methodDetails.httpMethod || methodDetails.HttpMethod)) {
        // Also fetch integration info for this method
        try {
          const integration = await apigateway.getIntegration(selectedRestApi.value.id, resource.id, method)
          restMethods.value[method] = { ...methodDetails, ...integration }
        } catch {
          // Integration might not exist - that's ok
          restMethods.value[method] = methodDetails
        }
      }
    } catch (error: any) {
      // Method doesn't exist - that's expected for most methods
      // LocalStack returns 500 for non-existent methods, so treat 500 as "doesn't exist"
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const status = error.statusCode
        // 404 or 500 typically means method doesn't exist
        if (status === 404 || status === 500) {
          // Method doesn't exist - silently skip
          continue
        }
      }
      // Unexpected error - log it but don't fail
      console.error(`Error loading method ${method}:`, error)
    }
  }
  loadingMethods.value = false
}

// Create REST API
async function createRestApi(name?: string, description?: string) {
  const apiName = name || newRestApiName.value
  const apiDescription = description || newRestApiDescription.value
  
  if (!apiName) {
    toast.error('API name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRestApi(apiName, {
      Description: apiDescription,
    })
    toast.success('REST API created successfully')
    showCreateRestModal.value = false
    newRestApiName.value = ''
    newRestApiDescription.value = ''
    loadRestApis()
  } catch (error) {
    console.error('Error creating REST API:', error)
    toast.error('Failed to create REST API: ' + String(error))
  } finally {
    creating.value = false
  }
}

// View REST API details
async function viewRestApi(api: APIGatewayRestAPI) {
  viewRestApiDetails.value = null
  viewLoading.value = true
  showViewRestModal.value = true
  
  try {
    const details = await apigateway.getRestApi(api.id)
    viewRestApiDetails.value = details
  } catch (error) {
    console.error('Error getting REST API details:', error)
    toast.error('Failed to load API details')
    showViewRestModal.value = false
  } finally {
    viewLoading.value = false
  }
}

// Open edit modal
function openEditModal(api: APIGatewayRestAPI) {
  editingRestApi.value = api
  editRestApiName.value = api.name
  editRestApiDescription.value = api.description || ''
  showEditRestModal.value = true
}

// Update REST API
async function updateRestApi() {
  if (!editingRestApi.value || !editRestApiName.value.trim()) {
    toast.error('API name is required')
    return
  }

  editing.value = true
  try {
    await apigateway.updateRestApi(editingRestApi.value.id, {
      name: editRestApiName.value.trim(),
      description: editRestApiDescription.value.trim(),
    })
    toast.success('REST API updated successfully')
    showEditRestModal.value = false
    editingRestApi.value = null
    loadRestApis()
  } catch (error) {
    console.error('Error updating REST API:', error)
    toast.error('Failed to update REST API')
  } finally {
    editing.value = false
  }
}

// Open delete confirmation
function openDeleteModal(api: APIGatewayRestAPI) {
  apiToDelete.value = api
  showDeleteRestModal.value = true
}

// Delete REST API
async function confirmDeleteRestApi() {
  if (!apiToDelete.value) return

  deleting.value = true
  try {
    await apigateway.deleteRestApi(apiToDelete.value.id)
    toast.success('REST API deleted successfully')
    showDeleteRestModal.value = false
    apiToDelete.value = null
    loadRestApis()
  } catch (error) {
    console.error('Error deleting REST API:', error)
    toast.error('Failed to delete REST API')
  } finally {
    deleting.value = false
  }
}

// Open delete resource modal
function openDeleteResourceModal(resource: APIGatewayResource) {
  resourceToDelete.value = resource
  showDeleteResourceModal.value = true
}

// Delete resource
async function confirmDeleteResource() {
  if (!selectedRestApi.value || !resourceToDelete.value) return

  deletingResource.value = true
  try {
    await apigateway.deleteResource(selectedRestApi.value.id, resourceToDelete.value.id)
    toast.success('Resource deleted successfully')
    showDeleteResourceModal.value = false
    resourceToDelete.value = null
    loadResourcesForApi(selectedRestApi.value.id)
  } catch (error) {
    console.error('Error deleting resource:', error)
    toast.error('Failed to delete resource')
  } finally {
    deletingResource.value = false
  }
}

// Open integration modal for a method
async function openIntegrationModalForMethod(method: string) {
  if (!selectedRestApi.value || !selectedResource.value) return
  
  selectedMethodName.value = method
  selectedMethodForIntegration.value = restMethods.value[method]
  loadingIntegration.value = true
  newIntegrationType.value = 'MOCK'
  newIntegrationUri.value = ''
  newIntegrationHttpMethod.value = 'POST'
  
  await loadLambdaFunctions()
  showIntegrationModal.value = true
  
  try {
    const integration = await apigateway.getIntegration(
      selectedRestApi.value.id,
      selectedResource.value.id,
      method
    )
    currentIntegration.value = integration
    newIntegrationType.value = integration.type || 'MOCK'
    newIntegrationUri.value = integration.uri || ''
    newIntegrationHttpMethod.value = integration.integrationHttpMethod || 'POST'
  } catch (error: any) {
    // Integration might not exist - that's ok, we'll create one
    currentIntegration.value = null
  } finally {
    loadingIntegration.value = false
  }
}

// Save integration for method
async function saveIntegration() {
  if (!selectedRestApi.value || !selectedResource.value || !selectedMethodName.value) {
    toast.error('No method selected')
    return
  }

  savingIntegration.value = true
  try {
    await apigateway.putIntegration(
      selectedRestApi.value.id,
      selectedResource.value.id,
      selectedMethodName.value,
      {
        type: newIntegrationType.value,
        uri: newIntegrationUri.value,
        integrationHttpMethod: newIntegrationHttpMethod.value,
      }
    )
    toast.success('Integration saved successfully')
    showIntegrationModal.value = false
    // Reload method to get updated integration (both stores)
    await loadMethods(selectedResource.value)
    if (selectedResource.value?.id) {
      await loadMethodsForResource(selectedResource.value.id)
    }
  } catch (error) {
    console.error('Error saving integration:', error)
    toast.error('Failed to save integration')
  } finally {
    savingIntegration.value = false
  }
}

// Delete method
async function deleteMethod(method: string) {
  if (!selectedRestApi.value || !selectedResource.value) {
    toast.error('No resource selected')
    return
  }
  
  deleteMethodName.value = method
  showDeleteMethodModal.value = true
}

async function confirmDeleteMethod() {
  try {
    await apigateway.deleteMethod(
      selectedRestApi.value!.id,
      selectedResource.value!.id,
      deleteMethodName.value
    )
    toast.success(`Method ${deleteMethodName.value} deleted successfully`)
    showDeleteMethodModal.value = false
    deleteMethodName.value = ''
    await loadMethodsForResource(selectedResource.value!.id)
  } catch (error) {
    console.error('Error deleting method:', error)
    toast.error('Failed to delete method')
  }
}

// Create resource
async function createResource(passedPath?: string) {
  const pathToUse = passedPath || newResourcePath.value

  if (!selectedRestApi.value || !pathToUse) {
    toast.error('Resource path is required')
    return
  }

  creating.value = true
  try {
    let parentId = newResourceParentId.value
    
    if (!parentId) {
      const root = restResources.value.find(r => r.path === '/' || r.pathPart === '')
      parentId = root?.id
    }

    if (!parentId) {
      toast.error('No parent resource found')
      return
    }

    await apigateway.createResource(selectedRestApi.value.id, parentId, pathToUse)
    toast.success('Resource created successfully')
    showCreateResourceModal.value = false
    newResourcePath.value = ''
    newResourceParentId.value = ''
    loadResourcesForApi(selectedRestApi.value.id)
  } catch (error: any) {
    console.error('Error creating resource:', error, error?.error)
    toast.error(error?.error || 'Failed to create resource')
  } finally {
    creating.value = false
  }
}

// Create method
async function createMethod(
  passedResourceId?: string, 
  passedMethodType?: string, 
  passedAuthType?: string, 
  passedAuthorizerId?: string
) {
  const resourceIdToUse = passedResourceId || newMethodResourceId.value
  const methodTypeToUse = passedMethodType || newMethodType.value
  const authTypeToUse = passedAuthType || newMethodAuthType.value
  const authorizerIdToUse = passedAuthorizerId || newMethodAuthorizerId.value

  if (!selectedRestApi.value || !resourceIdToUse || !methodTypeToUse) {
    toast.error('Resource and method type are required')
    return
  }

  const resourceId = resourceIdToUse
  const methodType = methodTypeToUse
  
  creating.value = true
  try {
    const options: any = { 
      authorizationType: authTypeToUse,
    }
    if (newMethodApiKeyRequired.value) {
      options.apiKeyRequired = true
    }
    if (authorizerIdToUse) {
      options.authorizerId = authorizerIdToUse
    }
    
    await apigateway.createMethod(
      selectedRestApi.value.id,
      resourceId,
      methodType,
      options
    )
    toast.success('Method created successfully')
    
    justCreatedMethod.value = `${resourceId}:${methodType}`
    showCreateMethodModal.value = false
    newMethodType.value = 'GET'
    newMethodResourceId.value = ''
    newMethodAuthType.value = 'NONE'
    newMethodAuthorizerId.value = ''
    newMethodApiKeyRequired.value = false
    
    const resource = restResources.value.find(r => r.id === resourceId)
    if (resource) {
      // Reload resources to get updated resourceMethods
      await loadResourcesForApi(selectedRestApi.value.id)
      setTimeout(() => {
        loadMethodsForResource(resourceId)
        if (!expandedResources.value.has(resourceId)) {
          expandedResources.value.add(resourceId)
          expandedResources.value = new Set(expandedResources.value)
        }
      }, 500)
    }
  } catch (error) {
    console.error('Error creating method:', error)
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
    toast.error('Failed to create method: ' + errorMsg)
  } finally {
    creating.value = false
  }
}

// HTTP APIs
async function loadHttpApis() {
  loadingHttpApis.value = true
  try {
    const response = await apigateway.getHttpApis()
    httpApis.value = response.items || []
  } catch (error) {
    console.error('Error loading HTTP APIs:', error)
    toast.error('Failed to load HTTP APIs')
  } finally {
    loadingHttpApis.value = false
  }
}

// Load routes for HTTP API
async function loadRoutes(api: any) {
  selectedHttpApi.value = api
  loadingRoutes.value = true
  showRoutesModal.value = true
  try {
    const response = await apigateway.getRoutes(api.apiId)
    httpRoutes.value = response.items || []
  } catch (error) {
    console.error('Error loading routes:', error)
    toast.error('Failed to load routes')
  } finally {
    loadingRoutes.value = false
  }
}

// Load integrations for HTTP API
async function loadIntegrations(api: any) {
  selectedHttpApi.value = api
  loadingIntegrations.value = true
  showIntegrationsModal.value = true
  try {
    const response = await apigateway.getIntegrations(api.apiId)
    httpIntegrations.value = response.items || []
  } catch (error) {
    console.error('Error loading integrations:', error)
    toast.error('Failed to load integrations')
  } finally {
    loadingIntegrations.value = false
  }
}

// Create HTTP API
async function createHttpApi(passedName?: string, passedDescription?: string) {
  const nameToUse = passedName || newHttpApiName.value
  const descToUse = passedDescription || newHttpApiDescription.value

  if (!nameToUse) {
    toast.error('HTTP API name is required')
    return
  }

  creating.value = true
  try {
    const options: any = {}
    if (nameToUse) options.name = nameToUse
    if (descToUse) options.description = descToUse
    
    await apigateway.createHttpApi(options)
    toast.success('HTTP API created successfully')
    showCreateHttpModal.value = false
    newHttpApiName.value = ''
    newHttpApiDescription.value = ''
    loadHttpApis()
  } catch (error: any) {
    console.error('Error creating HTTP API:', error)
    const message = error?.message || 'Failed to create HTTP API'
    toast.error(message)
  } finally {
    creating.value = false
  }
}

// Delete HTTP API
async function deleteHttpApi(api: any) {
  deleteApiId.value = api.apiId
  deleteApiName.value = api.name
  showDeleteHttpApiModal.value = true
}

async function confirmDeleteHttpApi() {
  try {
    await apigateway.deleteHttpApi(deleteApiId.value)
    toast.success('HTTP API deleted successfully')
    showDeleteHttpApiModal.value = false
    deleteApiId.value = ''
    deleteApiName.value = ''
    loadHttpApis()
  } catch (error) {
    console.error('Error deleting HTTP API:', error)
    toast.error('Failed to delete HTTP API')
  }
}

// Create route
async function createRoute(passedRouteKey?: string, passedTarget?: string) {
  const routeKeyToUse = passedRouteKey || newRouteKey.value
  const targetToUse = passedTarget || newRouteTarget.value

  if (!selectedHttpApi.value || !routeKeyToUse) {
    toast.error('Route key is required')
    return
  }

  let integrationId = targetToUse

  // Auto-create mock integration if target is $mock
  if (targetToUse === '$mock') {
    try {
      const mockIntegration = await apigateway.createIntegration(selectedHttpApi.value.apiId, {
        integrationType: 'MOCK',
        description: 'Mock integration for route',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      })
      integrationId = mockIntegration.IntegrationId
    } catch (error) {
      console.error('Error creating mock integration:', error)
      toast.error('Failed to create mock integration')
      return
    }
  }

  // Validate target exists
  if (!integrationId) {
    toast.error('Please select an integration for this route')
    return
  }

  creating.value = true
  try {
    const routeOptions: Record<string, any> = {
      routeKey: routeKeyToUse,
    }
    
    // Target (integration) is required for the route to work
    if (integrationId) {
      routeOptions.target = integrationId
    } else {
      toast.error('Please select an integration for this route')
      creating.value = false
      return
    }
    
    // Add optional fields if provided
    if (newRouteAuthType.value && newRouteAuthType.value !== 'NONE') {
      routeOptions.authorizationType = newRouteAuthType.value
    }
    if (newRouteAuthorizerId.value) {
      routeOptions.authorizerId = newRouteAuthorizerId.value
    }
    
    await apigateway.createRoute(selectedHttpApi.value.apiId, routeOptions)
    toast.success('Route created successfully')
    showCreateRouteModal.value = false
    newRouteKey.value = 'GET /'
    newRouteAuthType.value = 'NONE'
    newRouteAuthorizerId.value = ''
    newRouteTarget.value = ''
    loadHttpApiDetails(selectedHttpApi.value.apiId)
  } catch (error) {
    console.error('Error creating route:', error)
    toast.error('Failed to create route')
  } finally {
    creating.value = false
  }
}

// Create integration
async function createIntegration(passedIntegrationType?: string, passedUri?: string, passedPayloadFormat?: string) {
  const integrationTypeToUse = passedIntegrationType || httpApiIntegrationType.value
  const uriToUse = passedUri || httpApiIntegrationUri.value

  if (!selectedHttpApi.value) {
    toast.error('HTTP API is required')
    return
  }

  if (integrationTypeToUse === 'lambda' && !uriToUse) {
    toast.error('Integration URI is required for Lambda integrations')
    return
  }

  creatingIntegration.value = true
  try {
    const integrationOptions: Record<string, any> = {
      integrationType: integrationTypeToUse === 'lambda' ? 'AWS_PROXY' : integrationTypeToUse,
    }
    
    // Add optional fields based on integration type
    if (uriToUse) {
      integrationOptions.integrationUri = uriToUse
    }
    if (httpApiIntegrationMethod.value) {
      integrationOptions.integrationMethod = httpApiIntegrationMethod.value
    }
    if (httpApiIntegrationDescription.value) {
      integrationOptions.description = httpApiIntegrationDescription.value
    }
    if (httpApiIntegrationTimeout.value !== 30000) {
      integrationOptions.timeoutInMillis = httpApiIntegrationTimeout.value
    }
    if (httpApiIntegrationCredentialsArn.value) {
      integrationOptions.credentialsArn = httpApiIntegrationCredentialsArn.value
    }
    if (httpApiConnectionType.value && httpApiConnectionType.value !== 'INTERNET') {
      integrationOptions.connectionType = httpApiConnectionType.value
    }
    if (httpApiConnectionId.value) {
      integrationOptions.connectionId = httpApiConnectionId.value
    }
    
    // Payload format version is required for AWS_PROXY
    if (integrationTypeToUse === 'lambda') {
      integrationOptions.payloadFormatVersion = '2.0'
    }
    
    await apigateway.createIntegration(selectedHttpApi.value.apiId, integrationOptions)
    toast.success('Integration created successfully')
    showCreateIntegrationModal.value = false
    httpApiIntegrationType.value = 'AWS_PROXY'
    httpApiIntegrationUri.value = ''
    httpApiIntegrationDescription.value = ''
    httpApiIntegrationMethod.value = 'POST'
    httpApiIntegrationTimeout.value = 30000
    httpApiIntegrationCredentialsArn.value = ''
    httpApiConnectionType.value = 'INTERNET'
    httpApiConnectionId.value = ''
    selectedLambdaArn.value = ''
    loadHttpApiDetails(selectedHttpApi.value.apiId)
  } catch (error) {
    console.error('Error creating integration:', error)
    toast.error('Failed to create integration')
  } finally {
    creatingIntegration.value = false
  }
}

// Alias for template
const createHttpApiIntegration = createIntegration

// Create deployment (REST API)
async function createDeployment(stageName?: string, description?: string) {
  const actualStageName = stageName || newDeploymentStageName.value
  const actualDescription = description || newDeploymentDescription.value

  if (!selectedRestApi.value) {
    toast.error('REST API is required')
    return
  }

  if (!actualStageName) {
    toast.error('Stage name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createDeployment(selectedRestApi.value.id, {
      stageName: actualStageName,
      description: actualDescription,
    })
    toast.success('Deployment created successfully')
    showCreateDeploymentModal.value = false
    newDeploymentStageName.value = ''
    newDeploymentDescription.value = ''
    loadResourcesForApi(selectedRestApi.value.id)
  } catch (error) {
    console.error('Error creating deployment:', error)
    toast.error('Failed to create deployment')
  } finally {
    creating.value = false
  }
}

// Create REST API stage
async function createRestApiStage(passedStageName?: string, passedDeploymentId?: string) {
  const stageToUse = passedStageName || newRestStageName.value
  const deploymentIdToUse = passedDeploymentId || newRestStageDeploymentId.value

  if (!selectedRestApi.value) {
    toast.error('REST API is required')
    return
  }

  if (!stageToUse) {
    toast.error('Stage name is required')
    return
  }

  if (!deploymentIdToUse) {
    toast.error('Deployment is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRestApiStage(selectedRestApi.value.id, deploymentIdToUse, stageToUse)
    toast.success('Stage created successfully')
    showCreateStageModal.value = false
    newRestStageName.value = ''
    newRestStageDeploymentId.value = ''
    newRestStageDescription.value = ''
    loadResourcesForApi(selectedRestApi.value.id)
  } catch (error) {
    console.error('Error creating stage:', error)
    toast.error('Failed to create stage')
  } finally {
    creating.value = false
  }
}

// Get Invoke URL for REST API
async function openInvokeUrlModalForRestApi(api: APIGatewayRestAPI) {
  selectedInvokeUrlApi.value = api
  selectedInvokeUrlStage.value = ''
  invokeUrl.value = ''
  showInvokeUrlModal.value = true
  
  try {
    const response = await apigateway.getStages(api.id)
    restStagesForInvoke.value = response?.items || []
    if (restStagesForInvoke.value.length > 0) {
      selectedInvokeUrlStage.value = restStagesForInvoke.value[0].stageName
      await fetchRestApiInvokeUrl()
    }
  } catch (error) {
    console.error('Error loading stages:', error)
    restStagesForInvoke.value = []
  }
}

// Get Invoke URL for HTTP API
async function openInvokeUrlModalForHttpApi(api: any) {
  selectedInvokeUrlApi.value = api
  selectedInvokeUrlStage.value = ''
  invokeUrl.value = ''
  showInvokeUrlModal.value = true
  
  try {
    const response = await apigateway.getHttpApiStages(api.apiId)
    httpStagesForInvoke.value = response?.items || []
    if (httpStagesForInvoke.value.length > 0) {
      selectedInvokeUrlStage.value = httpStagesForInvoke.value[0].stageName
      await fetchHttpApiInvokeUrl()
    }
  } catch (error) {
    console.error('Error loading stages:', error)
    httpStagesForInvoke.value = []
  }
}

async function fetchRestApiInvokeUrl() {
  if (!selectedInvokeUrlApi.value || !selectedInvokeUrlStage.value) {
    invokeUrl.value = ''
    return
  }
  
  invokeUrlLoading.value = true
  try {
    const response = await apigateway.getRestApiInvokeUrl(selectedInvokeUrlApi.value.id, selectedInvokeUrlStage.value)
    invokeUrl.value = response?.invokeUrl || ''
  } catch (error) {
    console.error('Error getting invoke URL:', error)
    invokeUrl.value = ''
  } finally {
    invokeUrlLoading.value = false
  }
}

async function fetchHttpApiInvokeUrl() {
  if (!selectedInvokeUrlApi.value || !selectedInvokeUrlStage.value) {
    invokeUrl.value = ''
    return
  }
  
  invokeUrlLoading.value = true
  try {
    const response = await apigateway.getHttpApiInvokeUrl(selectedInvokeUrlApi.value.apiId, selectedInvokeUrlStage.value)
    invokeUrl.value = response?.invokeUrl || ''
  } catch (error) {
    console.error('Error getting invoke URL:', error)
    invokeUrl.value = ''
  } finally {
    invokeUrlLoading.value = false
  }
}

function onStageChange() {
  if (activeTab.value === 'rest') {
    fetchRestApiInvokeUrl()
  } else {
    fetchHttpApiInvokeUrl()
  }
}

// Create HTTP API stage
async function createHttpApiStage(passedStageName?: string, passedAutoDeploy?: boolean, passedDescription?: string) {
  const stageToUse = passedStageName || newHttpStageName.value
  const autoDeployToUse = passedAutoDeploy ?? newHttpStageAutoDeploy.value
  const descToUse = passedDescription ?? newHttpStageDescription.value

  if (!selectedHttpApi.value) {
    toast.error('HTTP API is required')
    return
  }

  if (!stageToUse) {
    toast.error('Stage name is required')
    return
  }

  const apiId = selectedHttpApi.value.apiId
  if (!apiId) {
    toast.error('Invalid HTTP API ID')
    return
  }

  creating.value = true
  try {
    await apigateway.createHttpApiStage(apiId, {
      stageName: stageToUse,
      description: descToUse,
      autoDeploy: autoDeployToUse,
    })
    toast.success('Stage created successfully')
    showCreateHttpStageModal.value = false
    newHttpStageName.value = ''
    newHttpStageDescription.value = ''
    newHttpStageAutoDeploy.value = true
    loadHttpApiDetails(apiId)
  } catch (error) {
    console.error('Error creating stage:', error)
    toast.error('Failed to create stage')
  } finally {
    creating.value = false
  }
}

// Delete HTTP API route
async function deleteRoute(apiId: string, routeId: string) {
  deleteRouteApiId.value = apiId
  deleteRouteId.value = routeId
  showDeleteRouteModal.value = true
}

async function confirmDeleteRoute() {
  const apiId = deleteRouteApiId.value
  try {
    await apigateway.deleteRoute(deleteRouteApiId.value, deleteRouteId.value)
    toast.success('Route deleted successfully')
    showDeleteRouteModal.value = false
    deleteRouteApiId.value = ''
    deleteRouteId.value = ''
    loadHttpApiDetails(apiId)
  } catch (error) {
    console.error('Error deleting route:', error)
    toast.error('Failed to delete route')
  }
}

// Delete HTTP API integration
async function deleteIntegration(apiId: string, integrationId: string) {
  deleteIntegrationApiId.value = apiId
  deleteIntegrationId.value = integrationId
  showDeleteIntegrationModal.value = true
}

async function confirmDeleteIntegration() {
  if (!deleteIntegrationApiId.value || !deleteIntegrationId.value) return
  
  const apiId = deleteIntegrationApiId.value
  try {
    await apigateway.deleteHttpApiIntegration(deleteIntegrationApiId.value, deleteIntegrationId.value)
    toast.success('Integration deleted successfully')
    showDeleteIntegrationModal.value = false
    deleteIntegrationApiId.value = ''
    deleteIntegrationId.value = ''
    loadHttpApiDetails(apiId)
  } catch (error) {
    console.error('Error deleting integration:', error)
    toast.error('Failed to delete integration')
  }
}

// Delete HTTP API stage
async function deleteHttpApiStage(apiId: string, stageName: string) {
  if (!apiId || !stageName) {
    toast.error('Invalid API ID or stage name')
    return
  }
  
  deleteHttpStageApiId.value = apiId
  deleteStageName.value = stageName
  showDeleteHttpStageModal.value = true
}

async function confirmDeleteHttpStage() {
  if (!deleteHttpStageApiId.value || !deleteStageName.value) return
  
  const apiId = deleteHttpStageApiId.value
  try {
    await apigateway.deleteHttpApiStage(deleteHttpStageApiId.value, deleteStageName.value)
    toast.success('Stage deleted successfully')
    showDeleteHttpStageModal.value = false
    deleteHttpStageApiId.value = ''
    deleteStageName.value = ''
    loadHttpApiDetails(apiId)
  } catch (error: any) {
    console.error('Error deleting stage:', error)
    toast.error(error?.error || error?.message || 'Failed to delete stage')
  }
}

// Edit Route
function openEditRouteModal(apiId: string, route: any) {
  selectedHttpApi.value = httpApis.value.find(a => a.apiId === apiId)
  editingRoute.value = { 
    ...route,
    routeKey: route.routeKey || ''
  }
  showEditRouteModal.value = true
}

async function saveEditRoute(routeKey: string, authType: string, authorizerId: string) {
  if (!selectedHttpApi.value || !editingRoute.value) return
   
  try {
    await apigateway.updateHttpRoute(selectedHttpApi.value.apiId, editingRoute.value.routeId, {
      routeKey: routeKey,
      authorizationType: authType,
      authorizerId: authorizerId || undefined,
    })
    toast.success('Route updated successfully')
    showEditRouteModal.value = false
    editingRoute.value = null
    loadHttpApiDetails(selectedHttpApi.value.apiId)
  } catch (error: any) {
    console.error('Error updating route:', error)
    toast.error(error?.message || error?.error || 'Failed to update route')
  }
}

// Edit Integration
function openEditIntegrationModal(apiId: string, integration: any) {
  selectedHttpApi.value = httpApis.value.find(a => a.apiId === apiId)
  editingIntegration.value = { 
    ...integration,
    description: integration.description || ''
  }
  showEditIntegrationModal.value = true
}

async function saveEditIntegration(description: string) {
  if (!selectedHttpApi.value || !editingIntegration.value) return
   
  try {
    await apigateway.updateHttpIntegration(selectedHttpApi.value.apiId, editingIntegration.value.integrationId, {
      description: description,
    })
    toast.success('Integration updated successfully')
    showEditIntegrationModal.value = false
    editingIntegration.value = null
    loadHttpApiDetails(selectedHttpApi.value.apiId)
  } catch (error: any) {
    console.error('Error updating integration:', error)
    toast.error(error?.message || error?.error || 'Failed to update integration')
  }
}

// Edit HTTP API Stage
function openEditHttpStageModal(apiId: string, stage: any) {
  selectedHttpApi.value = httpApis.value.find(a => a.apiId === apiId)
  editingStage.value = { 
    ...stage,
    description: stage.description || '',
    autoDeploy: stage.autoDeploy ?? false
  }
  showEditHttpStageModal.value = true
}

async function saveEditHttpStage(description: string, autoDeploy: boolean) {
  if (!selectedHttpApi.value || !editingStage.value) return
   
  try {
    await apigateway.updateHttpApiStage(selectedHttpApi.value.apiId, editingStage.value.stageName, {
      description: description,
      autoDeploy: autoDeploy,
    })
    toast.success('Stage updated successfully')
    showEditHttpStageModal.value = false
    editingStage.value = null
    loadHttpApiDetails(selectedHttpApi.value.apiId)
  } catch (error: any) {
    console.error('Error updating stage:', error)
    toast.error(error?.message || error?.error || 'Failed to update stage')
  }
}

// Delete REST API deployment
async function deleteDeployment(apiId: string, deploymentId: string) {
  deleteDeploymentApiId.value = apiId
  deleteDeploymentId.value = deploymentId
  showDeleteDeploymentModal.value = true
}

async function confirmDeleteDeployment() {
  if (!deleteDeploymentApiId.value || !deleteDeploymentId.value) return
  
  const apiId = deleteDeploymentApiId.value
  try {
    const result = await apigateway.deleteDeployment(deleteDeploymentApiId.value, deleteDeploymentId.value)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Deployment deleted successfully')
    showDeleteDeploymentModal.value = false
    deleteDeploymentApiId.value = ''
    deleteDeploymentId.value = ''
    loadResourcesForApi(apiId)
  } catch (error: any) {
    console.error('Error deleting deployment:', error)
    toast.error(error?.error || error?.message || 'Failed to delete deployment')
  }
}

// Delete REST API stage
async function deleteRestApiStage(apiId: string, stageName: string) {
  deleteRestStageApiId.value = apiId
  deleteStageName.value = stageName
  showDeleteRestStageModal.value = true
}

async function confirmDeleteRestStage() {
  if (!deleteRestStageApiId.value || !deleteStageName.value) return
  
  const apiId = deleteRestStageApiId.value
  try {
    await apigateway.deleteRestApiStage(deleteRestStageApiId.value, deleteStageName.value)
    toast.success('Stage deleted successfully')
    showDeleteRestStageModal.value = false
    deleteRestStageApiId.value = ''
    deleteStageName.value = ''
    loadResourcesForApi(apiId)
  } catch (error) {
    console.error('Error deleting stage:', error)
    toast.error('Failed to delete stage')
  }
}

// Copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

onMounted(() => {
  loadRestApis()
  loadHttpApis()
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
            API Gateway
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ restApis.length + httpApis.length }} API{{ restApis.length + httpApis.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs
      v-model:active-tab="activeTab"
      :tabs="[
        { id: 'rest', label: 'REST APIs' },
        { id: 'http', label: 'HTTP APIs' },
      ]"
    />

    <!-- REST APIs -->
    <div
      v-if="activeTab === 'rest'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          REST APIs
        </h3>
        <div class="flex items-center gap-2">
          <Button @click="showCreateRestModal = true">
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
            Create REST API
          </Button>
        </div>
      </div>

      <EmptyState
        v-if="!loadingRestApis && restApis.length === 0"
        icon="server"
        title="No REST APIs"
        description="Create your first REST API to get started."
        @action="showCreateRestModal = true"
      />

      <div
        v-else
        class="space-y-4"
      >
        <!-- Column Headers -->
        <div
          class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
          :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
        >
          <div class="col-span-5">
            Name / ID
          </div>
          <div class="col-span-4">
            Description
          </div>
          <div class="col-span-3 text-right">
            Actions
          </div>
        </div>

        <div
          v-for="api in restApis"
          :key="api.id"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <div
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-border/50 dark:hover:bg-dark-border/50"
            :class="{ 'border-b': expandedApis.has(api.id), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
            @click="toggleApiExpansion(api.id)"
          >
            <div class="col-span-5 flex items-center gap-3">
              <GlobeAltIcon class="h-5 w-5 text-primary-500 flex-shrink-0" />
              <div>
                <div class="font-medium">
                  {{ api.name }}
                </div>
                <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ api.id }}</code>
              </div>
            </div>
            <div class="col-span-4">
              <span
                v-if="api.description"
                class="text-sm text-light-muted dark:text-dark-muted truncate block"
                :title="api.description"
              >
                {{ api.description }}
              </span>
              <span
                v-else
                class="text-sm text-light-muted dark:text-dark-muted italic"
              >
                No description
              </span>
            </div>
            <div class="col-span-3 flex justify-end gap-2">
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                title="Get Invoke URL"
                @click.stop="openInvokeUrlModalForRestApi(api)"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                title="View Details"
                @click.stop="viewRestApi(api)"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                title="Edit"
                @click.stop="openEditModal(api)"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                title="Delete"
                @click.stop="openDeleteModal(api)"
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
              <ChevronRightIcon
                class="h-5 w-5 transition-transform flex-shrink-0"
                :class="{ 'rotate-90': expandedApis.has(api.id) }"
              />
            </div>
          </div>

          <div
            v-if="expandedApis.has(api.id)"
            class="border-t p-4"
            :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
          >
            <div class="flex justify-between items-center mb-4">
              <h4
                class="text-sm font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Resources
              </h4>
              <Button
                size="sm"
                @click.stop="selectedRestApi = api; showCreateResourceModal = true"
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
                Create Resource
              </Button>
            </div>

            <div
              v-if="loadingResources"
              class="flex justify-center py-4"
            >
              <LoadingSpinner />
            </div>

            <EmptyState
              v-else-if="restResources.length === 0"
              icon="server"
              title="No Resources"
              description="No resources found for this API."
            />

            <div
              v-else
              class="space-y-2"
            >
              <!-- Column Headers -->
              <div
                class="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
              >
                <div class="col-span-6">
                  Resource Path
                </div>
                <div class="col-span-3">
                  Methods
                </div>
                <div class="col-span-3 text-right">
                  Actions
                </div>
              </div>

              <div
                v-for="resource in restResources"
                :key="resource.id"
                class="border rounded-lg overflow-hidden"
                :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
              >
                <div
                  class="grid grid-cols-12 gap-4 px-3 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
                  :class="{ 'border-b': expandedResources.has(resource.id), 'border-dark-border': settingsStore.darkMode, 'border-light-border': !settingsStore.darkMode }"
                  @click="toggleResourceExpansion(resource.id)"
                >
                  <div class="col-span-6 flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-light-muted dark:text-dark-muted transition-transform flex-shrink-0"
                      :class="{ 'rotate-90': expandedResources.has(resource.id) }"
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
                    <span class="font-mono text-sm">{{ resource.path }}</span>
                    <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ resource.pathPart }}</code>
                  </div>
                  <div class="col-span-3">
                    <span
                      v-if="resourceMethodsMap[resource.id] && Object.keys(resourceMethodsMap[resource.id]).length > 0"
                      class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {{ Object.keys(resourceMethodsMap[resource.id]).join(', ') }}
                    </span>
                  </div>
                  <div class="col-span-3 flex items-center justify-end gap-2">
                    <button
                      class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                      title="Add Method"
                      @click.stop="selectedResource = resource; newMethodResourceId = resource.id; showCreateMethodModal = true"
                    >
                      + Method
                    </button>
                    <button
                      class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                      title="Delete"
                      @click.stop="openDeleteResourceModal(resource)"
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
                  </div>
                </div>

                <div
                  v-if="expandedResources.has(resource.id)"
                  class="border-t p-3"
                  :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
                >
                  <div
                    v-if="resourceMethodsLoading[resource.id]"
                    class="flex justify-center py-2"
                  >
                    <LoadingSpinner />
                  </div>

                  <EmptyState
                    v-else-if="!resourceMethodsMap[resource.id] || Object.keys(resourceMethodsMap[resource.id]).length === 0"
                    icon="server"
                    title="No Methods"
                    description="No methods found for this resource."
                  />

                  <div
                    v-else
                    class="space-y-2"
                  >
                    <div
                      v-for="(methodDetails, method) in resourceMethodsMap[resource.id]"
                      :key="method"
                      class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="px-2 py-0.5 text-xs font-bold rounded"
                          :class="{
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': method === 'GET',
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': method === 'POST',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': method === 'PUT',
                            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': method === 'PATCH',
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': method === 'DELETE',
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method as string),
                          }"
                        >
                          {{ method }}
                        </span>
                        <span class="text-xs text-light-muted dark:text-dark-muted">
                          Auth: {{ methodDetails?.AuthorizationType || methodDetails?.authorizationType || 'NONE' }}
                        </span>
                        <span
                          v-if="methodDetails?.ApiKeyRequired || methodDetails?.apiKeyRequired"
                          class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          API Key
                        </span>
                        <!-- Integration Info -->
                        <button
                          v-if="methodDetails?.uri || methodDetails?.type || methodDetails?.Uri || methodDetails?.Type"
                          type="button"
                          class="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                          @click.stop="showMethodIntegrationDetails(methodDetails)"
                        >
                          {{ methodDetails?.type || methodDetails?.Type || 'INT' }}
                        </button>
                        <span
                          v-else
                          class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        >
                          No INT
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                          title="Setup Integration"
                          @click.stop="selectedRestApi = api; selectedResource = resource; openIntegrationModalForMethod(method as string)"
                        >
                          Integration
                        </button>
                        <button
                          class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                          title="Delete Method"
                          @click.stop="selectedRestApi = api; selectedResource = resource; deleteMethod(method as string)"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deployments Section -->
            <div
              class="mt-4 pt-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="flex justify-between items-center mb-4">
                <h4
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  Deployments
                </h4>
                <Button
                  size="sm"
                  @click.stop="selectedRestApi = api; showCreateDeploymentModal = true"
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
                  Create Deployment
                </Button>
              </div>

              <div
                v-if="loadingDeployments"
                class="flex justify-center py-4"
              >
                <LoadingSpinner />
              </div>
              <EmptyState
                v-else-if="restDeployments.length === 0"
                icon="server"
                title="No Deployments"
                description="No deployments found for this API."
              />
              <div
                v-else
                class="space-y-2"
              >
                <div
                  class="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                  :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
                >
                  <div class="col-span-4">
                    ID
                  </div>
                  <div class="col-span-5">
                    Description
                  </div>
                  <div class="col-span-3 text-right">
                    Actions
                  </div>
                </div>
                <div
                  v-for="deployment in restDeployments"
                  :key="deployment.id"
                  class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
                >
                  <div class="col-span-4">
                    <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ deployment.id }}</code>
                  </div>
                  <div class="col-span-5 text-sm text-light-muted dark:text-dark-muted truncate">
                    {{ deployment.description || '-' }}
                  </div>
                  <div class="col-span-3 flex justify-end gap-2">
                    <button
                      class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                      title="Create Stage"
                      @click.stop="selectedRestApi = api; showCreateStageModal = true"
                    >
                      + Stage
                    </button>
                    <button
                      class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                      title="Delete"
                      @click.stop="deleteDeployment(api.id, deployment.id)"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stages Section -->
            <div
              class="mt-4 pt-4 border-t"
              :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
            >
              <div class="flex justify-between items-center mb-4">
                <h4
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  Stages
                </h4>
                <Button
                  size="sm"
                  @click.stop="selectedRestApi = api; showCreateStageModal = true"
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
                  Create Stage
                </Button>
              </div>

              <div
                v-if="loadingRestStages"
                class="flex justify-center py-4"
              >
                <LoadingSpinner />
              </div>
              <EmptyState
                v-else-if="restStages.length === 0"
                icon="server"
                title="No Stages"
                description="No stages found for this API."
              />
              <div
                v-else
                class="space-y-2"
              >
                <div
                  class="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                  :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
                >
                  <div class="col-span-3">
                    Name
                  </div>
                  <div class="col-span-3">
                    Deployment ID
                  </div>
                  <div class="col-span-3">
                    Created
                  </div>
                  <div class="col-span-3 text-right">
                    Actions
                  </div>
                </div>
                <div
                  v-for="stage in restStages"
                  :key="stage.stageName"
                  class="flex items-center justify-between p-2 rounded bg-light-border/30 dark:bg-dark-border/30"
                >
                  <div class="col-span-3">
                    <span class="text-sm font-medium">{{ stage.stageName }}</span>
                  </div>
                  <div class="col-span-3">
                    <code
                      v-if="stage.deploymentId"
                      class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded"
                    >{{ stage.deploymentId }}</code>
                    <span
                      v-else
                      class="text-xs text-light-muted dark:text-dark-muted italic"
                    >N/A</span>
                  </div>
                  <div class="col-span-3 text-xs text-light-muted dark:text-dark-muted">
                    {{ stage.createdDate ? new Date(stage.createdDate).toLocaleDateString() : '-' }}
                  </div>
                  <div class="col-span-3 flex justify-end gap-2">
                    <button
                      class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                      title="Delete"
                      @click.stop="deleteRestApiStage(api.id, stage.stageName)"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HTTP APIs -->
    <div
      v-if="activeTab === 'http'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          HTTP APIs
        </h3>
        <Button @click="showCreateHttpModal = true">
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
          Create HTTP API
        </Button>
      </div>

      <!-- Loading State -->
      <div
        v-if="loadingHttpApis"
        class="flex justify-center py-12"
      >
        <LoadingSpinner />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="httpApis.length === 0"
        icon="server"
        title="No HTTP APIs"
        description="Create your first HTTP API to get started."
      />

      <!-- HTTP API List -->
      <div
        v-else
        class="space-y-4"
      >
        <!-- Column Headers -->
        <div
          class="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
          :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
        >
          <div class="col-span-4">
            Name / ID
          </div>
          <div class="col-span-4">
            Protocol
          </div>
          <div class="col-span-3">
            Description
          </div>
          <div class="col-span-1 text-right">
            Actions
          </div>
        </div>

        <!-- HTTP API Accordion -->
        <div
          v-for="api in httpApis"
          :key="api.apiId"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
        >
          <!-- Header Row (clickable) -->
          <div
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer"
            :class="{ 'border-b': expandedHttpApis.has(api.apiId) }"
            @click="toggleHttpApiExpansion(api.apiId)"
          >
            <div class="col-span-4 flex items-center gap-3">
              <GlobeAltIcon class="h-5 w-5 text-primary-500 flex-shrink-0" />
              <div>
                <div class="font-medium">
                  {{ api.name || api.Name || 'Unnamed API' }}
                </div>
                <code
                  class="text-xs"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >{{ api.apiId }}</code>
              </div>
            </div>
            <div class="col-span-4">
              <StatusBadge :status="api.protocolType || 'HTTP'" />
            </div>
            <div class="col-span-3">
              <span
                v-if="api.description || api.Description"
                class="text-sm truncate block"
                :title="api.description || api.Description"
              >
                {{ api.description || api.Description }}
              </span>
              <span
                v-else
                class="text-sm italic"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                No description
              </span>
            </div>
            <div
              class="col-span-1 flex justify-end gap-2"
              @click.stop
            >
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                title="Get Invoke URL"
                @click="openInvokeUrlModalForHttpApi(api)"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
              <button
                class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                title="Delete"
                @click="deleteHttpApi(api)"
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
              <ChevronRightIcon
                class="h-5 w-5 transition-transform flex-shrink-0"
                :class="{ 'rotate-90': expandedHttpApis.has(api.apiId) }"
              />
            </div>
          </div>

          <!-- Expanded Content -->
          <div
            v-if="expandedHttpApis.has(api.apiId)"
            class="border-t p-4"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <!-- Loading -->
            <div
              v-if="loadingRoutes && loadingIntegrations"
              class="flex justify-center py-4"
            >
              <LoadingSpinner />
            </div>

            <!-- HTTP API Details -->
            <div
              v-else
              class="space-y-6"
            >
              <!-- Routes Section -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h4
                    class="text-sm font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    Routes
                  </h4>
                  <Button
                    size="sm"
                    @click.stop="selectedHttpApi = api; loadLambdaFunctions(); showCreateRouteModal = true"
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
                    Create Route
                  </Button>
                </div>

                <EmptyState
                  v-if="httpRoutes.length === 0"
                  icon="server"
                  title="No Routes"
                  description="No routes found for this API."
                  compact
                />

                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    class="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                    :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
                  >
                    <div class="col-span-4">
                      Route Key
                    </div>
                    <div class="col-span-5">
                      Target
                    </div>
                    <div class="col-span-3 text-right">
                      Actions
                    </div>
                  </div>
                  <div
                    v-for="route in httpRoutes"
                    :key="route.routeId"
                    class="grid grid-cols-12 gap-4 px-3 py-3 items-center rounded-lg bg-light-border/30 dark:bg-dark-border/30"
                  >
                    <div class="col-span-4">
                      <span class="text-sm font-mono">{{ route.routeKey }}</span>
                    </div>
                    <div class="col-span-5">
                      <code
                        v-if="route.target"
                        class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded"
                      >{{ route.target }}</code>
                      <span
                        v-else
                        class="text-xs italic"
                        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                      >No target</span>
                    </div>
                    <div class="col-span-3 flex justify-end gap-2">
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-blue-500"
                        title="Edit"
                        @click.stop="openEditRouteModal(api.apiId, route)"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                        title="Delete"
                        @click.stop="deleteRoute(api.apiId, route.routeId)"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Integrations Section -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h4
                    class="text-sm font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    Integrations
                  </h4>
                  <Button
                    size="sm"
                    @click.stop="selectedHttpApi = api; loadLambdaFunctions(); showCreateIntegrationModal = true"
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
                    Create Integration
                  </Button>
                </div>

                <EmptyState
                  v-if="httpIntegrations.length === 0"
                  icon="server"
                  title="No Integrations"
                  description="No integrations found for this API."
                  compact
                />

                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    class="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                    :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
                  >
                    <div class="col-span-3">
                      Integration ID
                    </div>
                    <div class="col-span-3">
                      Type
                    </div>
                    <div class="col-span-4">
                      URI
                    </div>
                    <div class="col-span-2 text-right">
                      Actions
                    </div>
                  </div>
                  <div
                    v-for="integration in httpIntegrations"
                    :key="integration.integrationId"
                    class="grid grid-cols-12 gap-4 px-3 py-3 items-center rounded-lg bg-light-border/30 dark:bg-dark-border/30"
                  >
                    <div class="col-span-3">
                      <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded">{{ integration.integrationId }}</code>
                    </div>
                    <div class="col-span-3">
                      <StatusBadge :status="integration.integrationType || 'UNKNOWN'" />
                    </div>
                    <div class="col-span-3">
                      <code
                        v-if="integration.integrationUri"
                        class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded truncate block"
                        :title="integration.integrationUri"
                      >{{ integration.integrationUri }}</code>
                      <span
                        v-else
                        class="text-xs italic"
                        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                      >No URI</span>
                    </div>
                    <div class="col-span-3 flex justify-end gap-2">
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-blue-500"
                        title="Edit"
                        @click.stop="openEditIntegrationModal(api.apiId, integration)"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                        title="Delete"
                        @click.stop="deleteIntegration(api.apiId, integration.integrationId)"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Stages Section -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h4
                    class="text-sm font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                  >
                    Stages
                  </h4>
                  <Button
                    size="sm"
                    @click.stop="selectedHttpApi = api; showCreateHttpStageModal = true"
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
                    Create Stage
                  </Button>
                </div>

                <EmptyState
                  v-if="httpStages.length === 0"
                  icon="server"
                  title="No Stages"
                  description="No stages found for this API."
                  compact
                />

                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    class="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
                    :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
                  >
                    <div class="col-span-3">
                      Stage Name
                    </div>
                    <div class="col-span-3">
                      Auto Deploy
                    </div>
                    <div class="col-span-3">
                      Description
                    </div>
                    <div class="col-span-3 text-right">
                      Actions
                    </div>
                  </div>
                  <div
                    v-for="stage in httpStages"
                    :key="stage.stageName"
                    class="grid grid-cols-12 gap-4 px-3 py-3 items-center rounded-lg bg-light-border/30 dark:bg-dark-border/30"
                  >
                    <div class="col-span-3">
                      <span class="text-sm font-medium">{{ stage.stageName }}</span>
                    </div>
                    <div class="col-span-3">
                      <span
                        :class="stage.autoDeploy ? 'text-green-500' : 'text-gray-400'"
                        class="text-xs"
                      >
                        {{ stage.autoDeploy ? 'Yes' : 'No' }}
                      </span>
                    </div>
                    <div class="col-span-3">
                      <span
                        v-if="stage.description"
                        class="text-xs text-light-muted dark:text-dark-muted truncate block"
                        :title="stage.description"
                      >
                        {{ stage.description }}
                      </span>
                      <span
                        v-else
                        class="text-xs italic"
                        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                      >-</span>
                    </div>
                    <div class="col-span-3 flex justify-end gap-2">
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-blue-500"
                        title="Edit"
                        @click.stop="openEditHttpStageModal(api.apiId, stage)"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                        title="Delete"
                        @click.stop="deleteHttpApiStage(api.apiId, stage.stageName)"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create REST API Modal -->
    <APIGatewayCreateModal
      v-model:open="showCreateRestModal"
      type="rest"
      :loading="creating"
      @create-rest="createRestApi"
    />

    <!-- Create HTTP API Modal -->
    <APIGatewayCreateModal
      v-model:open="showCreateHttpModal"
      type="http"
      :loading="creating"
      @create-http="createHttpApi"
    />

    <APIGatewayMethodModal
      v-model:open="showCreateMethodModal"
      :resources="restResources"
      :loading="creating"
      @create="createMethod"
    />

    <!-- Create Resource Modal -->
    <APIGatewayResourceModal
      v-model:open="showCreateResourceModal"
      :parent-id="newResourceParentId"
      :loading="creating"
      @create="createResource"
    />

    <!-- Routes Modal -->
    <APIGatewayRoutesModal
      v-model:open="showRoutesModal"
      :api-name="selectedHttpApi?.name || ''"
      :routes="httpRoutes"
      :loading="loadingRoutes"
      @create-route="showCreateRouteModal = true"
    />

    <!-- Create Route Modal -->
    <APIGatewayRouteModal
      v-model:open="showCreateRouteModal"
      :integrations="httpIntegrations.map(i => i.integrationId)"
      :loading="creating"
      :show-mock-target="!isLocalStack"
      @create="createRoute"
    />

    <!-- Duplicate removed - using component above -->

    <!-- Integrations Modal -->
    <APIGatewayIntegrationsModal
      v-model:open="showIntegrationsModal"
      :api-name="selectedHttpApi?.name || ''"
      :integrations="httpIntegrations"
      :loading="loadingIntegrations"
      @create-integration="showCreateIntegrationModal = true"
    />

    <!-- Create Integration Modal -->
    <APIGatewayIntegrationModal
      v-model:open="showCreateIntegrationModal"
      type="http"
      :lambda-functions="availableLambdas.map(l => l.FunctionName)"
      :loading="creatingIntegration"
      @create="createHttpApiIntegration"
    />
    <!-- Dummy comment -->

    <!-- Create Deployment Modal (REST API) - Using existing component -->
    <APIGatewayDeploymentsModal
      v-model:open="showCreateDeploymentModal"
      type="rest"
      :loading="creating"
      @create-deployment="createDeployment"
    />

    <!-- Create Stage Modal (REST API) -->
    <APIGatewayStageModal
      v-model:open="showCreateStageModal"
      type="rest"
      :loading="creating"
      :deployments="restDeployments"
      @create-rest="createRestApiStage"
    />

    <!-- Create HTTP API Stage Modal -->
    <APIGatewayStageModal
      v-model:open="showCreateHttpStageModal"
      type="http"
      :loading="creating"
      @create-http="createHttpApiStage"
    />

    <!-- Edit Route Modal -->
    <APIGatewayEditRouteModal
      v-model:open="showEditRouteModal"
      :route-key="editingRoute?.routeKey || ''"
      :authorization-type="editingRoute?.authorizationType"
      :authorizer-id="editingRoute?.authorizerId"
      :loading="creating"
      @update="saveEditRoute"
    />

    <!-- Edit Integration Modal -->
    <APIGatewayEditIntegrationModal
      v-model:open="showEditIntegrationModal"
      :integration-id="editingIntegration?.integrationId || ''"
      :description="editingIntegration?.description"
      :loading="creating"
      @update="saveEditIntegration"
    />

    <!-- Edit HTTP API Stage Modal -->
    <APIGatewayEditStageModal
      v-model:open="showEditHttpStageModal"
      :stage-name="editingStage?.stageName || ''"
      :description="editingStage?.description"
      :auto-deploy="editingStage?.autoDeploy"
      :loading="creating"
      @update="saveEditHttpStage"
    />

    <!-- Edit REST API Modal -->
    <APIGatewayEditConfigModal
      v-model:open="showEditRestModal"
      title="Edit REST API"
      :name="editRestApiName"
      :description="editRestApiDescription"
      :loading="editing"
      @update-config="updateRestApi"
    />

    <!-- View REST API Modal -->
    <APIGatewayViewRestModal
      v-model:open="showViewRestModal"
      :details="viewRestApiDetails"
      :loading="viewLoading"
      @edit="() => openEditModal(viewRestApiDetails!)"
      @delete="() => openDeleteModal(viewRestApiDetails!)"
    />

    <!-- Delete REST API Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteRestModal"
      :item-name="apiToDelete?.name || ''"
      item-type="REST API"
      :loading="deleting"
      @delete="confirmDeleteRestApi"
    />

    <!-- Delete HTTP API Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteHttpApiModal"
      :item-name="deleteApiName || ''"
      item-type="HTTP API"
      :loading="deleting"
      @delete="confirmDeleteHttpApi"
    />

    <!-- Delete Resource Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteResourceModal"
      :item-name="resourceToDelete?.path || ''"
      item-type="Resource"
      :loading="deletingResource"
      @delete="confirmDeleteResource"
    />

    <!-- Integration Setup Modal -->
    <APIGatewaySetupIntegrationModal
      v-model:open="showIntegrationModal"
      :loading="loadingIntegration"
      :current-integration="currentIntegration"
      :initial-type="newIntegrationType"
      :initial-uri="newIntegrationUri"
      :initial-http-method="newIntegrationHttpMethod"
      :lambda-functions="availableLambdas.map(fn => fn.FunctionName)"
      @update:type="newIntegrationType = $event"
      @update:uri="newIntegrationUri = $event"
      @update:http-method="newIntegrationHttpMethod = $event"
      @save="saveIntegration"
    />

    <!-- Integration Details Modal -->
    <APIGatewayIntegrationDetailsModal
      v-model:open="showIntegrationDetailsModal"
      :integration-data="integrationDetailsData"
    />

    <!-- Delete Method Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteMethodModal"
      :item-name="deleteMethodName"
      item-type="Method"
      :loading="deleting"
      @delete="confirmDeleteMethod"
    />

    <!-- Delete Integration Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteIntegrationModal"
      item-name="Integration"
      :loading="deleting"
      @delete="confirmDeleteIntegration"
    />

    <!-- Delete HTTP API Route Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteRouteModal"
      item-name="Route"
      :loading="deleting"
      @delete="confirmDeleteRoute"
    />

    <!-- Delete HTTP Stage Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteHttpStageModal"
      item-name="Stage"
      :loading="deleting"
      @delete="confirmDeleteHttpStage"
    />

    <!-- Delete Deployment Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteDeploymentModal"
      item-name="Deployment"
      :loading="deleting"
      @delete="confirmDeleteDeployment"
    />

    <!-- Delete REST Stage Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteRestStageModal"
      item-name="Stage"
      :loading="deleting"
      @delete="confirmDeleteRestStage"
    />

    <!-- Delete HTTP API Route Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteRouteModal"
      item-name="Route"
      @delete="confirmDeleteRoute"
    />

    <!-- Delete HTTP API Stage Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteHttpStageModal"
      :item-name="deleteStageName"
      item-type="Stage"
      @delete="confirmDeleteHttpStage"
    />

    <!-- Delete Deployment Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteDeploymentModal"
      item-name="Deployment"
      @delete="confirmDeleteDeployment"
    />

    <!-- Delete REST Stage Confirmation -->
    <APIGatewayDeleteModal
      v-model:open="showDeleteRestStageModal"
      :item-name="deleteStageName"
      item-type="Stage"
      @delete="confirmDeleteRestStage"
    />

    <!-- Invoke URL Modal -->
    <APIGatewayInvokeUrlModal
      :show="showInvokeUrlModal"
      :title="`Invoke URL - ${activeTab === 'rest' ? 'REST' : 'HTTP'} API`"
      :invoke-url="invokeUrl"
      :loading="invokeUrlLoading"
      :stages="activeTab === 'rest' ? restStagesForInvoke : httpStagesForInvoke"
      :api-type="activeTab"
      :api-id="selectedInvokeUrlApi?.id || selectedInvokeUrlApi?.apiId || ''"
      @close="showInvokeUrlModal = false"
      @update:selected-stage="selectedInvokeUrlStage = $event"
      @fetch-url="onStageChange"
    />

    <!-- Usage Examples -->
    <APIGatewayCodeExamples
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
    />
  </div>
</template>
