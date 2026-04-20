<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Tabs from '@/components/common/Tabs.vue'
import * as apigateway from '@/api/services/api-gateway'
import { refreshAPIGatewayClient } from '@/api/services/api-gateway'
import { listFunctions } from '@/api/services/lambda'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { APIGatewayRestAPI, APIGatewayResource, APIGatewayMethod } from '@/api/types/aws'

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
  
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  const createdMethodKey = justCreatedMethod.value
  const createdMethod = createdMethodKey?.startsWith(`${resourceId}:`) 
    ? createdMethodKey.split(':')[1] 
    : null
  
  const promises = httpMethods.map(method => 
    apigateway.getMethod(selectedRestApi.value.id, resource.id, method)
      .then(result => ({ method, result }))
      .catch(() => ({ method, result: null }))
  )
  
  const results = await Promise.all(promises)
  
  for (const { method, result } of results) {
    if (result && (result.HttpMethod || result.httpMethod)) {
      resourceMethodsMap.value[resourceId][method] = result
    }
  }
  
  resourceMethodsLoading.value[resourceId] = false
  resourceMethodsMap.value = { ...resourceMethodsMap.value }
  
  if (createdMethod && resourceMethodsMap.value[resourceId][createdMethod]) {
    toast.success(`Method ${createdMethod} created successfully`)
    justCreatedMethod.value = null
  }
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
const showImportSwaggerModal = ref(false)
const showEditRestModal = ref(false)
const showViewRestModal = ref(false)
const showDeleteRestModal = ref(false)
const showDeleteResourceModal = ref(false)
const showIntegrationModal = ref(false)
const showMethodsModal = ref(false)
const showCreateDeploymentModal = ref(false)
const showCreateStageModal = ref(false)
const showCreateHttpStageModal = ref(false)

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

// Swagger import state
const swaggerFile = ref<File | null>(null)
const swaggerContent = ref('')
const swaggerValidationErrors = ref<string[]>([])
const swaggerSpecPreview = ref<{ title: string; version: string; pathCount: number } | null>(null)
const importingSwagger = ref(false)
const swaggerImportResult = ref<{
  success: boolean
  apiId?: string
  apiName?: string
  resourcesCreated?: number
  methodsCreated?: number
  errors?: string[]
} | null>(null)

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

// Handle Swagger file selection
function handleSwaggerFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  swaggerFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    swaggerContent.value = content
    validateSwaggerContent(content)
  }
  reader.readAsText(file)
}

// Validate Swagger content
function validateSwaggerContent(content: string) {
  swaggerValidationErrors.value = []
  swaggerSpecPreview.value = null
  
  try {
    const spec = apigateway.parseSwaggerSpec(content)
    const errors = apigateway.validateSwaggerSpec(spec)
    
    if (errors.length > 0) {
      swaggerValidationErrors.value = errors
      return
    }
    
    swaggerSpecPreview.value = {
      title: spec.info.title,
      version: spec.info.version,
      pathCount: Object.keys(spec.paths).length,
    }
  } catch (error) {
    swaggerValidationErrors.value = [`Failed to parse file: ${error}`]
  }
}

// Import Swagger file
async function importSwaggerFile() {
  if (!swaggerContent.value || swaggerValidationErrors.value.length > 0) {
    toast.error('Please fix validation errors before importing')
    return
  }
  
  importingSwagger.value = true
  swaggerImportResult.value = null
  
  try {
    const result = await apigateway.importSwaggerFromFile(swaggerContent.value)
    
    swaggerImportResult.value = {
      success: result.errors.length === 0,
      apiId: result.apiId,
      apiName: result.apiName,
      resourcesCreated: result.resourcesCreated,
      methodsCreated: result.methodsCreated,
      errors: result.errors,
    }
    
    if (result.errors.length === 0) {
      toast.success(`Imported ${result.resourcesCreated} resources and ${result.methodsCreated} methods`)
      showImportSwaggerModal.value = false
      loadRestApis()
      resetSwaggerImport()
    } else {
      toast.warning(`Imported with ${result.errors.length} errors`)
    }
  } catch (error) {
    console.error('Error importing Swagger:', error)
    toast.error('Failed to import Swagger specification')
  } finally {
    importingSwagger.value = false
  }
}

// Reset Swagger import state
function resetSwaggerImport() {
  swaggerFile.value = null
  swaggerContent.value = ''
  swaggerValidationErrors.value = []
  swaggerSpecPreview.value = null
  swaggerImportResult.value = null
}

// Clear import modal
function closeImportModal() {
  showImportSwaggerModal.value = false
  resetSwaggerImport()
}

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
  { key: 'apiEndpoint', label: 'Endpoint', sortable: false },
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
  // Try to load all common HTTP methods since LocalStack's GetResources 
  // doesn't reliably return resourceMethods
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  
  for (const method of httpMethods) {
    try {
      const methodDetails = await apigateway.getMethod(selectedRestApi.value.id, resource.id, method)
      restMethods.value[method] = methodDetails
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
    }
  }
  loadingMethods.value = false
}

// Create REST API
async function createRestApi() {
  if (!newRestApiName.value) {
    toast.error('API name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRestApi(newRestApiName.value, {
      Description: newRestApiDescription.value,
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
    // Reload method to get updated integration
    loadMethods(selectedResource.value)
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
async function createResource() {
  if (!selectedRestApi.value || !newResourcePath.value) {
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

    await apigateway.createResource(selectedRestApi.value.id, parentId, newResourcePath.value)
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
async function createMethod() {
  if (!selectedRestApi.value || !newMethodResourceId.value || !newMethodType.value) {
    toast.error('Resource and method type are required')
    return
  }

  const resourceId = newMethodResourceId.value
  const methodType = newMethodType.value
  
  creating.value = true
  try {
    const options: any = { 
      authorizationType: newMethodAuthType.value,
    }
    if (newMethodApiKeyRequired.value) {
      options.apiKeyRequired = true
    }
    if (newMethodAuthorizerId.value) {
      options.authorizerId = newMethodAuthorizerId.value
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
async function createHttpApi() {
  creating.value = true
  try {
    const options: any = {}
    if (newHttpApiName.value) options.name = newHttpApiName.value
    if (newHttpApiDescription.value) options.description = newHttpApiDescription.value
    
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
async function createRoute() {
  if (!selectedHttpApi.value || !newRouteKey.value) {
    toast.error('Route key is required')
    return
  }

  creating.value = true
  try {
    const routeOptions: Record<string, any> = {
      routeKey: newRouteKey.value,
    }
    
    // Target (integration) is required for the route to work
    if (newRouteTarget.value) {
      routeOptions.target = newRouteTarget.value
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
async function createIntegration() {
  if (!selectedHttpApi.value) {
    toast.error('HTTP API is required')
    return
  }

  if (httpApiIntegrationType.value === 'AWS_PROXY' && !httpApiIntegrationUri.value) {
    toast.error('Integration URI is required for AWS_PROXY integrations')
    return
  }

  creating.value = true
  try {
    const integrationOptions: Record<string, any> = {
      integrationType: httpApiIntegrationType.value,
    }
    
    // Add optional fields based on integration type
    if (httpApiIntegrationUri.value) {
      integrationOptions.integrationUri = httpApiIntegrationUri.value
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
    if (httpApiIntegrationType.value === 'AWS_PROXY') {
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
    creating.value = false
  }
}

// Create deployment (REST API)
async function createDeployment() {
  if (!selectedRestApi.value) {
    toast.error('REST API is required')
    return
  }

  if (!newDeploymentStageName.value) {
    toast.error('Stage name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createDeployment(selectedRestApi.value.id, {
      stageName: newDeploymentStageName.value,
      description: newDeploymentDescription.value,
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
async function createRestApiStage() {
  if (!selectedRestApi.value) {
    toast.error('REST API is required')
    return
  }

  if (!newRestStageName.value) {
    toast.error('Stage name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRestApiStage(selectedRestApi.value.id, newRestStageDeploymentId.value, newRestStageName.value)
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

// Create HTTP API stage
async function createHttpApiStage() {
  if (!selectedHttpApi.value) {
    toast.error('HTTP API is required')
    return
  }

  if (!newHttpStageName.value) {
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
      stageName: newHttpStageName.value,
      description: newHttpStageDescription.value,
      autoDeploy: newHttpStageAutoDeploy.value,
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
  try {
    await apigateway.deleteRoute(deleteRouteApiId.value, deleteRouteId.value)
    toast.success('Route deleted successfully')
    showDeleteRouteModal.value = false
    deleteRouteApiId.value = ''
    deleteRouteId.value = ''
    loadHttpApiDetails(deleteRouteApiId.value)
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
  
  try {
    await apigateway.deleteIntegration(deleteIntegrationApiId.value, deleteIntegrationId.value)
    toast.success('Integration deleted successfully')
    showDeleteIntegrationModal.value = false
    deleteIntegrationApiId.value = ''
    deleteIntegrationId.value = ''
    loadHttpApiDetails(deleteIntegrationApiId.value)
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
  
  try {
    await apigateway.deleteHttpApiStage(deleteHttpStageApiId.value, deleteStageName.value)
    toast.success('Stage deleted successfully')
    showDeleteHttpStageModal.value = false
    deleteHttpStageApiId.value = ''
    deleteStageName.value = ''
    loadHttpApiDetails(deleteHttpStageApiId.value)
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

async function saveEditRoute() {
  if (!selectedHttpApi.value || !editingRoute.value) return
  
  try {
    await apigateway.updateHttpRoute(selectedHttpApi.value.apiId, editingRoute.value.routeId, {
      routeKey: editingRoute.value.routeKey,
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

async function saveEditIntegration() {
  if (!selectedHttpApi.value || !editingIntegration.value) return
  
  try {
    await apigateway.updateHttpIntegration(selectedHttpApi.value.apiId, editingIntegration.value.integrationId, {
      description: editingIntegration.value.description,
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

async function saveEditHttpStage() {
  if (!selectedHttpApi.value || !editingStage.value) return
  
  try {
    await apigateway.updateHttpApiStage(selectedHttpApi.value.apiId, editingStage.value.stageName, {
      description: editingStage.value.description,
      autoDeploy: editingStage.value.autoDeploy,
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
    loadResourcesForApi(deleteDeploymentApiId.value)
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
  
  try {
    await apigateway.deleteRestApiStage(deleteRestStageApiId.value, deleteStageName.value)
    toast.success('Stage deleted successfully')
    showDeleteRestStageModal.value = false
    deleteRestStageApiId.value = ''
    deleteStageName.value = ''
    loadResourcesForApi(deleteRestStageApiId.value)
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
          <Button
            variant="secondary"
            @click="showImportSwaggerModal = true"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </template>
            Import Swagger
          </Button>
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
              <svg
                class="w-5 h-5 text-orange-500 transition-transform flex-shrink-0"
                :class="{ 'rotate-90': expandedApis.has(api.id) }"
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
            <div class="flex items-center gap-2">
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
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          class="px-2 py-1 text-xs rounded hover:bg-light-border dark:hover:bg-dark-border"
                          title="Setup Integration"
                          @click.stop="selectedResource = resource; openIntegrationModalForMethod(method as string)"
                        >
                          Integration
                        </button>
                        <button
                          class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                          title="Delete Method"
                          @click.stop="selectedResource = resource; deleteMethod(method as string)"
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
              <svg
                class="w-5 h-5 transition-transform"
                :class="{ 'rotate-90': expandedHttpApis.has(api.apiId) }"
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
              <div>
                <div class="font-medium">
                  {{ api.name }}
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
                v-if="api.description"
                class="text-sm truncate block"
                :title="api.description"
              >
                {{ api.description }}
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
                    @click.stop="selectedHttpApi = api; showCreateRouteModal = true"
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
                    <div class="col-span-2">
                      Stage Name
                    </div>
                    <div class="col-span-3">
                      Invoke URL
                    </div>
                    <div class="col-span-2">
                      Auto Deploy
                    </div>
                    <div class="col-span-2">
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
                    <div class="col-span-2">
                      <span class="text-sm font-medium">{{ stage.stageName }}</span>
                    </div>
                    <div class="col-span-3">
                      <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded break-all">
                        http://localhost:4566/restapis/{{ api.apiId }}/{{ stage.stageName }}/_user_request_/{route_key}
                      </code>
                    </div>
                    <div class="col-span-2">
                      <span
                        :class="stage.autoDeploy ? 'text-green-500' : 'text-gray-400'"
                        class="text-xs"
                      >
                        {{ stage.autoDeploy ? 'Yes' : 'No' }}
                      </span>
                    </div>
                    <div class="col-span-2">
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
    <Modal
      v-model:open="showCreateRestModal"
      title="Create REST API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRestApiName"
          label="API Name"
          placeholder="my-rest-api"
          required
        />
        <FormInput
          v-model="newRestApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateRestModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRestApi"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create HTTP API Modal -->
    <Modal
      v-model:open="showCreateHttpModal"
      title="Create HTTP API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newHttpApiName"
          label="API Name"
          placeholder="my-http-api"
        />
        <FormInput
          v-model="newHttpApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateHttpModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createHttpApi"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>
    <Modal
      v-model:open="showCreateMethodModal"
      title="Create Method"
      size="md"
      :z-index="60"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Resource</label>
          <select
            v-model="newMethodResourceId"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="">
              Select a resource...
            </option>
            <option
              v-for="resource in restResources"
              :key="resource.id"
              :value="resource.id"
            >
              {{ resource.path }} ({{ resource.pathPart }})
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">HTTP Method</label>
          <select
            v-model="newMethodType"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="GET">
              GET
            </option>
            <option value="POST">
              POST
            </option>
            <option value="PUT">
              PUT
            </option>
            <option value="PATCH">
              PATCH
            </option>
            <option value="DELETE">
              DELETE
            </option>
            <option value="OPTIONS">
              OPTIONS
            </option>
            <option value="HEAD">
              HEAD
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Authorization Type</label>
          <select
            v-model="newMethodAuthType"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="NONE">
              NONE - No authorization
            </option>
            <option value="AWS_IAM">
              AWS_IAM - IAM role based
            </option>
            <option value="CUSTOM">
              CUSTOM - Custom authorizer (requires Authorizer ID)
            </option>
            <option value="COGNITO_USER_POOLS">
              COGNITO_USER_POOLS - Cognito (requires Authorizer ID)
            </option>
          </select>
        </div>
        <div v-if="newMethodAuthType === 'CUSTOM' || newMethodAuthType === 'COGNITO_USER_POOLS'">
          <label class="block text-sm font-medium mb-1">Authorizer ID</label>
          <input
            v-model="newMethodAuthorizerId"
            type="text"
            placeholder="Enter authorizer ID"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
        </div>
        <div class="flex items-center gap-2">
          <input
            id="apiKeyRequired"
            v-model="newMethodApiKeyRequired"
            type="checkbox"
            class="w-4 h-4 rounded border-light-border dark:border-dark-border"
          >
          <label
            for="apiKeyRequired"
            class="text-sm font-medium"
          >
            API Key Required
          </label>
        </div>
        <FormInput
          v-model="newIntegrationUri"
          label="Integration URI (optional)"
          placeholder="arn:aws:apigateway:region:lambda:path/..."
          hint="Leave empty for mock integration"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateMethodModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createMethod"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Resource Modal -->
    <Modal
      v-model:open="showCreateResourceModal"
      title="Create Resource"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newResourcePath"
          label="Resource Path"
          placeholder="items"
          required
        />
        <div>
          <label class="block text-sm font-medium mb-1">Parent Resource</label>
          <select
            v-model="newResourceParentId"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="">
              Root (/)
            </option>
            <option
              v-for="resource in restResources.filter(r => r.path !== '/')"
              :key="resource.id"
              :value="resource.id"
            >
              {{ resource.path }} ({{ resource.pathPart }})
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateResourceModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createResource"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Routes Modal -->
    <Modal
      v-model:open="showRoutesModal"
      :title="`Routes: ${selectedHttpApi?.name}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="showCreateRouteModal = true"
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

      <div
        v-if="loadingRoutes"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="httpRoutes.length === 0"
        icon="server"
        title="No Routes"
        description="No routes found for this API."
      />

      <DataTable
        v-else
        :columns="routeColumns"
        :data="httpRoutes"
        empty-title="No Routes"
        empty-text="No routes found."
      >
        <template #cell-routeKey="{ value }">
          <span class="font-mono font-medium">{{ value }}</span>
        </template>
        <template #cell-routeId="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showRoutesModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Route Modal -->
    <Modal
      v-model:open="showCreateRouteModal"
      title="Create Route"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRouteKey"
          label="Route Key"
          placeholder="GET /items or $default"
          required
          hint="For HTTP APIs, use format: METHOD /path or $default"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Integration
          </label>
          <select
            v-model="newRouteTarget"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="">
              -- Select Integration --
            </option>
            <option
              v-for="integration in httpIntegrations"
              :key="integration.integrationId"
              :value="`integrations/${integration.integrationId}`"
            >
              {{ integration.integrationType }}: {{ integration.integrationId }}
              {{ integration.integrationUri ? `- ${integration.integrationUri}` : '' }}
            </option>
          </select>
          <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
            Select an integration to connect this route to
          </p>
        </div>
        <FormSelect
          v-model="newRouteAuthType"
          label="Authorization Type"
          :options="[
            { value: 'NONE', label: 'NONE (No authorization)' },
            { value: 'JWT', label: 'JWT (JSON Web Token)' },
            { value: 'AWS_IAM', label: 'AWS IAM' },
            { value: 'CUSTOM', label: 'CUSTOM (Lambda Authorizer)' },
          ]"
        />
        <FormInput
          v-if="newRouteAuthType !== 'NONE' && newRouteAuthType !== 'AWS_IAM'"
          v-model="newRouteAuthorizerId"
          label="Authorizer ID"
          placeholder="abc123"
          hint="The ID of the authorizer resource to associate with this route"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateRouteModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRoute"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Integrations Modal -->
    <Modal
      v-model:open="showIntegrationsModal"
      :title="`Integrations: ${selectedHttpApi?.name}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="showCreateIntegrationModal = true"
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

      <div
        v-if="loadingIntegrations"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="httpIntegrations.length === 0"
        icon="server"
        title="No Integrations"
        description="No integrations found for this API."
      />

      <DataTable
        v-else
        :columns="integrationColumns"
        :data="httpIntegrations"
        empty-title="No Integrations"
        empty-text="No integrations found."
      >
        <template #cell-integrationType="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>
        <template #cell-integrationId="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
        <template #cell-integrationUri="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value || '-' }}</code>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showIntegrationsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Integration Modal -->
    <Modal
      v-model:open="showCreateIntegrationModal"
      title="Create Integration"
      size="lg"
    >
      <div class="space-y-4">
        <FormSelect
          v-model="httpApiIntegrationType"
          label="Integration Type"
          :options="[
            { value: 'AWS_PROXY', label: 'AWS_PROXY (Lambda Proxy)' },
            { value: 'AWS', label: 'AWS (Lambda or Service)' },
            { value: 'HTTP_PROXY', label: 'HTTP_PROXY (HTTP Backend)' },
            { value: 'MOCK', label: 'MOCK (Passthrough)' },
          ]"
        />
        
        <!-- Lambda dropdown for AWS_PROXY -->
        <div v-if="httpApiIntegrationType === 'AWS_PROXY'">
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Lambda Function
          </label>
          <select
            v-model="selectedLambdaArn"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
            @change="httpApiIntegrationUri = selectedLambdaArn"
          >
            <option value="">
              -- Select Lambda Function --
            </option>
            <option
              v-for="lambda in availableLambdas"
              :key="lambda.FunctionName"
              :value="lambda.FunctionArn"
            >
              {{ lambda.FunctionName }}
            </option>
          </select>
          <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
            Select a Lambda function to use as the integration target
          </p>
        </div>
        
        <!-- Manual URI input for HTTP_PROXY and AWS -->
        <FormInput
          v-if="httpApiIntegrationType === 'HTTP_PROXY' || httpApiIntegrationType === 'AWS'"
          v-model="httpApiIntegrationUri"
          label="Integration URI"
          placeholder="https://example.com/path"
          :required="true"
        />
        
        <FormInput
          v-if="httpApiIntegrationType === 'HTTP_PROXY'"
          v-model="httpApiIntegrationMethod"
          label="Integration HTTP Method"
          placeholder="GET, POST, PUT, etc."
        />
        
        <FormInput
          v-model="httpApiIntegrationDescription"
          label="Description"
          placeholder="Optional description for this integration"
        />
        
        <FormSelect
          v-model="httpApiConnectionType"
          label="Connection Type"
          :options="[
            { value: 'INTERNET', label: 'INTERNET (Public)' },
            { value: 'VPC_LINK', label: 'VPC_LINK (Private)' },
          ]"
        />
        
        <FormInput
          v-if="httpApiConnectionType === 'VPC_LINK'"
          v-model="httpApiConnectionId"
          label="VPC Link ID"
          placeholder="abc123"
        />
        
        <FormInput
          v-model="httpApiIntegrationCredentialsArn"
          label="Credentials ARN"
          placeholder="arn:aws:iam::account-id:role/role-name"
          hint="IAM role for invoking the integration (optional for Lambda)"
        />
        
        <div class="flex items-center gap-2">
          <label
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Timeout (ms)
          </label>
          <input
            v-model.number="httpApiIntegrationTimeout"
            type="number"
            min="50"
            max="30000"
            class="w-32 px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
          <span class="text-xs text-light-muted dark:text-dark-muted">50-30000 ms (default: 30000)</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createIntegration"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Deployment Modal (REST API) -->
    <Modal
      v-model:open="showCreateDeploymentModal"
      title="Create Deployment"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newDeploymentStageName"
          label="Stage Name"
          placeholder="prod"
          required
        />
        <FormInput
          v-model="newDeploymentDescription"
          label="Description"
          placeholder="Production deployment"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateDeploymentModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createDeployment"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Stage Modal (REST API) -->
    <Modal
      v-model:open="showCreateStageModal"
      title="Create Stage"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRestStageName"
          label="Stage Name"
          placeholder="prod"
          required
        />
        <FormInput
          v-model="newRestStageDeploymentId"
          label="Deployment ID (optional)"
          placeholder="Deployment ID"
        />
        <FormInput
          v-model="newRestStageDescription"
          label="Description"
          placeholder="Stage description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateStageModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRestApiStage"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create HTTP API Stage Modal -->
    <Modal
      v-model:open="showCreateHttpStageModal"
      title="Create HTTP API Stage"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newHttpStageName"
          label="Stage Name"
          placeholder="prod"
          required
        />
        <FormInput
          v-model="newHttpStageDescription"
          label="Description"
          placeholder="Stage description"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Auto Deploy
          </label>
          <select
            v-model="newHttpStageAutoDeploy"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option :value="true">
              Enabled
            </option>
            <option :value="false">
              Disabled
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateHttpStageModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createHttpApiStage"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Edit Route Modal -->
    <Modal
      v-model:open="showEditRouteModal"
      title="Edit Route"
      size="md"
    >
      <div
        v-if="editingRoute"
        class="space-y-4"
      >
        <FormInput
          v-model="editingRoute.routeKey"
          label="Route Key"
          placeholder="GET /api"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditRouteModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="saveEditRoute"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Edit Integration Modal -->
    <Modal
      v-model:open="showEditIntegrationModal"
      title="Edit Integration"
      size="md"
    >
      <div
        v-if="editingIntegration"
        class="space-y-4"
      >
        <div class="mb-4">
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Integration ID
          </label>
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ editingIntegration.integrationId }}</code>
        </div>
        <FormInput
          v-model="editingIntegration.integrationType"
          label="Type"
          disabled
        />
        <FormInput
          v-model="editingIntegration.description"
          label="Description"
          placeholder="Integration description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="saveEditIntegration"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Edit HTTP API Stage Modal -->
    <Modal
      v-model:open="showEditHttpStageModal"
      title="Edit Stage"
      size="md"
    >
      <div
        v-if="editingStage"
        class="space-y-4"
      >
        <div class="mb-4">
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Stage Name
          </label>
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ editingStage.stageName }}</code>
        </div>
        <FormInput
          v-model="editingStage.description"
          label="Description"
          placeholder="Stage description"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Auto Deploy
          </label>
          <select
            v-model="editingStage.autoDeploy"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option :value="true">
              Enabled
            </option>
            <option :value="false">
              Disabled
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditHttpStageModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="saveEditHttpStage"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Import Swagger Modal -->
    <Modal
      v-model:open="showImportSwaggerModal"
      title="Import Swagger / OpenAPI Specification"
      size="lg"
    >
      <div class="space-y-4">
        <!-- File Upload -->
        <div class="border-2 border-dashed border-light-border dark:border-dark-border rounded-lg p-6 text-center">
          <input
            id="swagger-file-input"
            type="file"
            accept=".json,.yaml,.yml"
            class="hidden"
            @change="handleSwaggerFileSelect"
          >
          <label
            for="swagger-file-input"
            class="cursor-pointer flex flex-col items-center gap-2"
          >
            <svg
              class="w-12 h-12 text-light-muted dark:text-dark-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span class="text-sm text-light-muted dark:text-dark-muted">
              Click to upload or drag and drop
            </span>
            <span class="text-xs text-light-muted dark:text-dark-muted">
              JSON or YAML files (.json, .yaml, .yml)
            </span>
          </label>
          <div
            v-if="swaggerFile"
            class="mt-4"
          >
            <div class="flex items-center gap-2 justify-center">
              <svg
                class="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-sm font-medium">{{ swaggerFile.name }}</span>
              <span class="text-xs text-light-muted dark:text-dark-muted">
                ({{ (swaggerFile.size / 1024).toFixed(2) }} KB)
              </span>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <div
          v-if="swaggerValidationErrors.length > 0"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Validation Errors:
          </h4>
          <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li
              v-for="(error, index) in swaggerValidationErrors"
              :key="index"
              class="flex items-start gap-2"
            >
              <svg
                class="w-4 h-4 mt-0.5 flex-shrink-0"
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
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- Spec Preview -->
        <div
          v-if="swaggerSpecPreview"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Specification Valid:
          </h4>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Title:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.title }}
              </p>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Version:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.version }}
              </p>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Paths:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.pathCount }} endpoints
              </p>
            </div>
          </div>
        </div>

        <!-- Import Result -->
        <div
          v-if="swaggerImportResult"
          class="rounded-lg p-4"
          :class="swaggerImportResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'"
        >
          <div class="flex items-center gap-2 mb-3">
            <svg
              v-if="swaggerImportResult.success"
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span
              class="font-medium"
              :class="swaggerImportResult.success ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'"
            >
              {{ swaggerImportResult.success ? 'Import Successful' : 'Import Completed with Errors' }}
            </span>
          </div>
          
          <div
            v-if="swaggerImportResult.success"
            class="grid grid-cols-3 gap-4 text-sm mb-3"
          >
            <div>
              <span class="text-green-600 dark:text-green-400">API ID:</span>
              <code class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.apiId }}</code>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400">Resources:</span>
              <span class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.resourcesCreated }}</span>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400">Methods:</span>
              <span class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.methodsCreated }}</span>
            </div>
          </div>
          
          <div v-if="swaggerImportResult.errors && swaggerImportResult.errors.length > 0">
            <h5 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Errors:
            </h5>
            <ul class="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
              <li
                v-for="(error, index) in swaggerImportResult.errors"
                :key="index"
              >
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <Button
            variant="secondary"
            @click="closeImportModal"
          >
            {{ swaggerImportResult ? 'Close' : 'Cancel' }}
          </Button>
          <Button
            v-if="!swaggerImportResult"
            :loading="importingSwagger"
            :disabled="!swaggerSpecPreview || swaggerValidationErrors.length > 0"
            @click="importSwaggerFile"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </template>
            Import Specification
          </Button>
        </div>
      </template>
    </Modal>

    <!-- View REST API Modal -->
    <Modal
      v-model:open="showViewRestModal"
      :title="`API Details: ${viewRestApiDetails?.name || ''}`"
      size="md"
    >
      <div
        v-if="viewLoading"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      
      <div
        v-else-if="viewRestApiDetails"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API ID</label>
            <p
              class="font-mono text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.id }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API Key Source</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.apiKeySource || 'HEADER' }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Endpoint Type</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.endpointConfiguration?.types?.join(', ') || 'REGIONAL' }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Created</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ new Date(Number(viewRestApiDetails.createdDate) * 1000).toLocaleString() }}
            </p>
          </div>
        </div>
        
        <div v-if="viewRestApiDetails.description">
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ viewRestApiDetails.description }}
          </p>
        </div>
        
        <div v-if="viewRestApiDetails.binaryMediaTypes?.length">
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Binary Media Types</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="type in viewRestApiDetails.binaryMediaTypes"
              :key="type"
              class="px-2 py-1 text-xs rounded bg-light-border dark:bg-dark-border"
            >
              {{ type }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <Button
            variant="secondary"
            @click="showViewRestModal = false"
          >
            Close
          </Button>
          <div class="flex gap-2">
            <Button
              variant="secondary"
              @click="() => { showViewRestModal = false; openEditModal(viewRestApiDetails!) }"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              @click="() => { showViewRestModal = false; openDeleteModal(viewRestApiDetails!) }"
            >
              Delete
            </Button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Edit REST API Modal -->
    <Modal
      v-model:open="showEditRestModal"
      title="Edit REST API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editRestApiName"
          label="API Name"
          placeholder="my-rest-api"
          required
        />
        <FormInput
          v-model="editRestApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditRestModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="editing"
            @click="updateRestApi"
          >
            Save Changes
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete REST API Confirmation -->
    <Modal
      v-model:open="showDeleteRestModal"
      title="Delete REST API"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the REST API <strong>"{{ apiToDelete?.name }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone. All resources and methods associated with this API will be deleted.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteRestModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            :loading="deleting"
            @click="confirmDeleteRestApi"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Resource Confirmation -->
    <Modal
      v-model:open="showDeleteResourceModal"
      title="Delete Resource"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the resource <strong>"{{ resourceToDelete?.path }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone. All methods associated with this resource will be deleted.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteResourceModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            :loading="deletingResource"
            @click="confirmDeleteResource"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Integration Setup Modal -->
    <Modal
      v-model:open="showIntegrationModal"
      title="Setup Integration"
      size="md"
    >
      <div
        v-if="loadingIntegration"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <div>
          <label class="block text-sm font-medium mb-1">Integration Type</label>
          <select
            v-model="newIntegrationType"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="MOCK">
              Mock
            </option>
            <option value="AWS">
              AWS (Lambda)
            </option>
            <option value="HTTP">
              HTTP
            </option>
            <option value="HTTP_PROXY">
              HTTP Proxy
            </option>
          </select>
        </div>
        
        <FormInput
          v-model="newIntegrationUri"
          label="Integration URI"
          placeholder="arn:aws:apigateway:region:lambda:path/..."
          hint="Required for AWS, HTTP, and HTTP_PROXY types"
        />
        
        <div>
          <label class="block text-sm font-medium mb-1">Integration HTTP Method</label>
          <select
            v-model="newIntegrationHttpMethod"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="GET">
              GET
            </option>
            <option value="POST">
              POST
            </option>
            <option value="PUT">
              PUT
            </option>
            <option value="PATCH">
              PATCH
            </option>
            <option value="DELETE">
              DELETE
            </option>
            <option value="HEAD">
              HEAD
            </option>
            <option value="OPTIONS">
              OPTIONS
            </option>
          </select>
        </div>
        
        <div
          v-if="currentIntegration"
          class="text-sm text-light-muted dark:text-dark-muted"
        >
          Current integration: {{ currentIntegration.type || 'None' }}
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="savingIntegration"
            @click="saveIntegration"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Integration Confirmation -->
    <Modal
      v-model:open="showDeleteIntegrationModal"
      title="Delete Integration"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete this integration?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteIntegration"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete HTTP API Stage Confirmation -->
    <Modal
      v-model:open="showDeleteHttpStageModal"
      title="Delete Stage"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the stage <strong>"{{ deleteStageName }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteHttpStageModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteHttpStage"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Deployment Confirmation -->
    <Modal
      v-model:open="showDeleteDeploymentModal"
      title="Delete Deployment"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete this deployment?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteDeploymentModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteDeployment"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete REST Stage Confirmation -->
    <Modal
      v-model:open="showDeleteRestStageModal"
      title="Delete Stage"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the stage <strong>"{{ deleteStageName }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteRestStageModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteRestStage"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Usage Examples -->
    <div
      v-if="activeTab === 'rest'"
      class="mt-8"
    >
      <h3 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        REST API Usage Examples
      </h3>
      <div 
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              restExampleIndex === index
                ? settingsStore.darkMode ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'
                : settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text hover:bg-dark-bg' : 'text-light-muted hover:text-light-text hover:bg-light-bg'
            ]"
            @click="restExampleIndex = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre 
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >{{ codeExamples[restExampleIndex].code }}</pre>
        </div>
      </div>
    </div>

    <!-- HTTP API Usage Examples -->
    <div
      v-if="activeTab === 'http'"
      class="mt-8"
    >
      <h3 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        HTTP API Usage Examples
      </h3>
      <div 
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <button
            v-for="(example, index) in httpApiExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              httpExampleIndex === index
                ? settingsStore.darkMode ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'
                : settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text hover:bg-dark-bg' : 'text-light-muted hover:text-light-text hover:bg-light-bg'
            ]"
            @click="httpExampleIndex = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre 
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >{{ httpApiExamples[httpExampleIndex].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
