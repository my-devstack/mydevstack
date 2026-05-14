import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import * as openSearchApi from '@/api/services/opensearch'
import type { DomainInfo, CreateDomainInput } from '@/api/services/opensearch'

export function useOpenSearch() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  const domains = ref<DomainInfo[]>([])
  const loading = ref(false)
  const expandedDomains = ref<Set<string>>(new Set())

  const showCreateModal = ref(false)
  const creating = ref(false)
  const showDeleteConfirm = ref(false)
  const domainToDelete = ref<DomainInfo | null>(null)

  // Domain details (from DescribeDomain) indexed by domain name
  const domainDetails = ref<Record<string, any>>({})
  const loadingDomainDetails = ref<Record<string, boolean>>({})

  // Compatible versions (from GetCompatibleVersions)
  const compatibleVersions = ref<any[]>([])
  const loadingCompatibleVersions = ref(false)

  const createForm = ref<CreateDomainInput>({
    DomainName: '',
    EngineVersion: 'OpenSearch_2.13',
    ClusterConfig: {
      InstanceType: 't3.medium.search',
      InstanceCount: 1,
      DedicatedMasterEnabled: false,
      ZoneAwarenessEnabled: false,
    },
    EBSOptions: {
      EBSEnabled: true,
      VolumeType: 'gp2',
      VolumeSize: 10,
    },
    TagList: [],
  })

  async function loadDomains() {
    loading.value = true
    try {
      const result = await openSearchApi.listDomainNames()
      domains.value = result
    } catch (error: any) {
      console.error('Failed to load domains:', error)
      toast.error(`Failed to load domains: ${error}`)
      domains.value = []
    } finally {
      loading.value = false
    }
  }

  async function createDomain() {
    if (!createForm.value.DomainName) {
      toast.warning('Domain name is required')
      return
    }

    creating.value = true
    try {
      const createInput: CreateDomainInput = {
        DomainName: createForm.value.DomainName,
        EngineVersion: createForm.value.EngineVersion,
        ClusterConfig: createForm.value.ClusterConfig,
        EBSOptions: createForm.value.EBSOptions,
      }
      if (createForm.value.TagList?.length) {
        createInput.TagList = createForm.value.TagList
      }
      await openSearchApi.createDomain(createInput)

      await loadDomains()
      toast.success(`Domain ${createForm.value.DomainName} is being created`)
      showCreateModal.value = false
      resetForm()
    } catch (error: any) {
      console.error('Failed to create domain:', error)
      toast.error(`Failed to create domain: ${error}`)
    } finally {
      creating.value = false
    }
  }

  async function deleteDomain() {
    if (!domainToDelete.value) return
    try {
      await openSearchApi.deleteDomain(domainToDelete.value.DomainName)
      domains.value = domains.value.filter(d => d.DomainName !== domainToDelete.value?.DomainName)
      expandedDomains.value.delete(domainToDelete.value.DomainName)
      // Cleanup domain details cache
      delete domainDetails.value[domainToDelete.value.DomainName]
      delete loadingDomainDetails.value[domainToDelete.value.DomainName]
      toast.success(`Domain ${domainToDelete.value.DomainName} is being deleted`)
      showDeleteConfirm.value = false
      domainToDelete.value = null
    } catch (error) {
      toast.error(`Failed to delete domain: ${error}`)
    }
  }

  async function toggleDomain(domainName: string) {
    if (expandedDomains.value.has(domainName)) {
      expandedDomains.value.delete(domainName)
    } else {
      expandedDomains.value.add(domainName)
      // Load domain details on first expand
      if (!domainDetails.value[domainName] && !loadingDomainDetails.value[domainName]) {
        loadDomainDetails(domainName)
      }
    }
    expandedDomains.value = new Set(expandedDomains.value)
  }

  async function loadDomainDetails(domainName: string) {
    loadingDomainDetails.value[domainName] = true
    try {
      const result = await openSearchApi.describeDomain(domainName)
      domainDetails.value[domainName] = result.DomainStatus || result
      // If ARN is available, also load tags
      const arn = result.DomainStatus?.ARN || result.ARN
      if (arn) {
        try {
          const tagsResult = await openSearchApi.listTags(arn)
          domainDetails.value[domainName].Tags = tagsResult.TagList || []
        } catch (tagErr) {
          console.error(`Failed to load tags for ${domainName}:`, tagErr)
        }
      }
    } catch (error: any) {
      console.error(`Failed to load domain details for ${domainName}:`, error)
      toast.error(`Failed to load details for ${domainName}`)
    } finally {
      loadingDomainDetails.value[domainName] = false
    }
  }

  async function addDomainTag(domainName: string, key: string, value: string) {
    const details = domainDetails.value[domainName]
    const arn = details?.ARN
    if (!arn) {
      toast.error('Cannot add tag: ARN not available')
      return
    }
    try {
      await openSearchApi.tagResource(arn, key, value)
      await loadDomainDetails(domainName)
      toast.success(`Tag ${key} added`)
    } catch (error: any) {
      toast.error(`Failed to add tag: ${error}`)
    }
  }

  async function removeDomainTag(domainName: string, key: string) {
    const details = domainDetails.value[domainName]
    const arn = details?.ARN
    if (!arn) {
      toast.error('Cannot remove tag: ARN not available')
      return
    }
    try {
      await openSearchApi.untagResource(arn, key)
      await loadDomainDetails(domainName)
      toast.success(`Tag ${key} removed`)
    } catch (error: any) {
      toast.error(`Failed to remove tag: ${error}`)
    }
  }

  async function loadCompatibleVersions() {
    loadingCompatibleVersions.value = true
    try {
      const result = await openSearchApi.getCompatibleVersions()
      compatibleVersions.value = result.CompatibleVersions || []
    } catch (error: any) {
      console.error('Failed to load compatible versions:', error)
      compatibleVersions.value = []
    } finally {
      loadingCompatibleVersions.value = false
    }
  }

  function getDomainTags(domainName: string): { Key: string; Value: string }[] {
    const details = domainDetails.value[domainName]
    if (details?.Tags?.length) return details.Tags
    const domain = domains.value.find(d => d.DomainName === domainName)
    return domain?.Tags || []
  }

  function getCompatibleVersionFor(engineVersion?: string): string[] {
    if (!compatibleVersions.value.length || !engineVersion) return []
    const match = compatibleVersions.value.find(
      (v: any) => v.SourceVersion === engineVersion
    )
    return match?.TargetVersions || []
  }

  function confirmDelete(domain: DomainInfo) {
    domainToDelete.value = domain
    showDeleteConfirm.value = true
  }

  function resetForm() {
    createForm.value = {
      DomainName: '',
      EngineVersion: 'OpenSearch_2.13',
      ClusterConfig: {
        InstanceType: 't3.medium.search',
        InstanceCount: 1,
        DedicatedMasterEnabled: false,
        ZoneAwarenessEnabled: false,
      },
      EBSOptions: {
        EBSEnabled: true,
        VolumeType: 'gp2',
        VolumeSize: 10,
      },
      TagList: [],
    }
  }

  function getDomainDetailsStatus(domainName: string): string {
    const details = domainDetails.value[domainName]
    if (details) {
      if (details.Processing) return 'Processing'
      if (details.Created && details.Deleted) return 'Deleted'
      if (details.Created) return 'Active'
      return 'Creating'
    }
    return 'Unknown'
  }

  function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
    const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
      active: 'active',
      creating: 'pending',
      processing: 'pending',
      updating: 'pending',
      deleted: 'error',
      available: 'active',
    }
    const lowerStatus = status?.toLowerCase() || ''
    return statusMap[lowerStatus] || 'inactive'
  }

  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List all domains
aws opensearch list-domain-names --region ${settingsStore.region}

# Describe a domain
aws opensearch describe-domain \\
  --domain-name my-domain --region ${settingsStore.region}

# Create a domain
aws opensearch create-domain \\
  --domain-name my-domain \\
  --engine-version OpenSearch_2.13 \\
  --cluster-config InstanceType=t3.medium.search,InstanceCount=1 \\
  --ebs-options EBSEnabled=true,VolumeType=gp2,VolumeSize=10 \\
  --region ${settingsStore.region}

# Delete a domain
aws opensearch delete-domain \\
  --domain-name my-domain \\
  --region ${settingsStore.region}

# List tags
aws opensearch list-tags \\
  --arn arn:aws:es:${settingsStore.region}:123456789012:domain/my-domain \\
  --region ${settingsStore.region}

# Get compatible versions
aws opensearch get-compatible-versions --region ${settingsStore.region}`,
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { OpenSearchClient, ListDomainNamesCommand, CreateDomainCommand, DeleteDomainCommand } from "@aws-sdk/client-opensearch";

const client = new OpenSearchClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List domain names
const listResponse = await client.send(new ListDomainNamesCommand({}));
console.log(listResponse.DomainNames);

// Create domain
const createResponse = await client.send(new CreateDomainCommand({
  DomainName: 'my-domain',
  EngineVersion: 'OpenSearch_2.13',
  ClusterConfig: { InstanceType: 't3.medium.search', InstanceCount: 1 },
  EBSOptions: { EBSEnabled: true, VolumeType: 'gp2', VolumeSize: 10 },
}));
console.log(createResponse.DomainStatus);

// Delete domain
await client.send(new DeleteDomainCommand({ DomainName: 'my-domain' }));`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import boto3

# Create OpenSearch client
opensearch = boto3.client('opensearch',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}'
)

# List domain names
response = opensearch.list_domain_names()
for domain in response['DomainNames']:
    print(f"Domain: {domain['DomainName']}")
    print(f"  Engine: {domain['EngineVersion']}")

# Create domain
response = opensearch.create_domain(
    DomainName='my-domain',
    EngineVersion='OpenSearch_2.13',
    ClusterConfig={
        'InstanceType': 't3.medium.search',
        'InstanceCount': 1,
    },
    EBSOptions={
        'EBSEnabled': True,
        'VolumeType': 'gp2',
        'VolumeSize': 10,
    },
)

# Delete domain
opensearch.delete_domain(DomainName='my-domain')`,
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/opensearch"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := opensearch.NewFromConfig(cfg, func(o *opensearch.Options) {
    o.BaseEndpoint = aws.String("http://127.0.0.1:4566")
})

// List domain names
domains, _ := client.ListDomainNames(context.Background(), &opensearch.ListDomainNamesInput{})
for _, d := range domains.DomainNames {
    fmt.Printf("Domain: %s, Engine: %s\\n", aws.ToString(d.DomainName), d.EngineType)
}

// Create domain
client.CreateDomain(context.Background(), &opensearch.CreateDomainInput{
    DomainName:    aws.String("my-domain"),
    EngineVersion: aws.String("OpenSearch_2.13"),
    ClusterConfig: &opensearch.ClusterConfig{
        InstanceType:  "t3.medium.search",
        InstanceCount: aws.Int32(1),
    },
    EBSOptions: &opensearch.EBSOptions{
        EBSEnabled: aws.Bool(true),
        VolumeType: aws.String("gp2"),
        VolumeSize: aws.Int32(10),
    },
})

// Delete domain
client.DeleteDomain(context.Background(), &opensearch.DeleteDomainInput{
    DomainName: aws.String("my-domain"),
})`,
    },
  ])

  return {
    domains,
    loading,
    expandedDomains,
    showCreateModal,
    creating,
    showDeleteConfirm,
    domainToDelete,
    createForm,
    codeExamples,
    domainDetails,
    loadingDomainDetails,
    compatibleVersions,
    loadingCompatibleVersions,
    loadDomains,
    createDomain,
    deleteDomain,
    toggleDomain,
    confirmDelete,
    resetForm,
    getStatus,
    loadDomainDetails,
    loadCompatibleVersions,
    getDomainTags,
    getDomainDetailsStatus,
    addDomainTag,
    removeDomainTag,
    getCompatibleVersionFor,
  }
}
