import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import * as elasticacheApi from '@/api/services/elasticache'

export interface ReplicationGroup {
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

export interface CreateGroupInput {
  ReplicationGroupId: string
  ReplicationGroupDescription?: string
  CacheNodeType?: string
  Engine?: string
  NumNodeGroups?: number
  Port?: number
}

export function useElastiCache() {
  const uiStore = useUIStore()
  const settingsStore = useSettingsStore()

  const groups = ref<ReplicationGroup[]>([])
  const loading = ref(false)
  const expandedGroups = ref<Set<string>>(new Set())

  const showCreateModal = ref(false)
  const creating = ref(false)
  const showDeleteConfirm = ref(false)
  const groupToDelete = ref<ReplicationGroup | null>(null)

  const createForm = ref<CreateGroupInput>({
    ReplicationGroupId: '',
    ReplicationGroupDescription: '',
    CacheNodeType: 'cache.t3.micro',
    Engine: 'valkey',
    NumNodeGroups: 1,
    Port: 6379,
  })

  async function loadGroups() {
    loading.value = true
    try {
      const result = await elasticacheApi.describeReplicationGroups()
      groups.value = result
    } catch (error: any) {
      console.error('Failed to load groups:', error)
      uiStore.notifyError('Error', `Failed to load groups: ${error}`)
      groups.value = []
    } finally {
      loading.value = false
    }
  }

  async function createGroup() {
    if (!createForm.value.ReplicationGroupId) {
      uiStore.notifyWarning('Validation', 'Group ID is required')
      return
    }

    creating.value = true
    try {
      await elasticacheApi.createReplicationGroup({
        ReplicationGroupId: createForm.value.ReplicationGroupId,
        ReplicationGroupDescription: createForm.value.ReplicationGroupDescription || 'My cache cluster',
        CacheNodeType: createForm.value.CacheNodeType,
        Engine: createForm.value.Engine,
        NumNodeGroups: createForm.value.NumNodeGroups,
        Port: createForm.value.Port,
      })
      
      await loadGroups()
      uiStore.notifySuccess('Success', `Group ${createForm.value.ReplicationGroupId} is being created`)
      showCreateModal.value = false
      resetForm()
    } catch (error: any) {
      console.error('Failed to create group:', error)
      uiStore.notifyError('Error', `Failed to create group: ${error}`)
    } finally {
      creating.value = false
    }
  }

  async function deleteGroup() {
    if (!groupToDelete.value) return
    try {
      await elasticacheApi.deleteReplicationGroup(groupToDelete.value.ReplicationGroupId)
      groups.value = groups.value.filter(g => g.ReplicationGroupId !== groupToDelete.value?.ReplicationGroupId)
      expandedGroups.value.delete(groupToDelete.value.ReplicationGroupId)
      uiStore.notifySuccess('Success', `Group ${groupToDelete.value.ReplicationGroupId} is being deleted`)
      showDeleteConfirm.value = false
      groupToDelete.value = null
    } catch (error) {
      uiStore.notifyError('Error', `Failed to delete group: ${error}`)
    }
  }

  function toggleGroup(groupId: string) {
    if (expandedGroups.value.has(groupId)) {
      expandedGroups.value.delete(groupId)
    } else {
      expandedGroups.value.add(groupId)
    }
    expandedGroups.value = new Set(expandedGroups.value)
  }

  function confirmDelete(group: ReplicationGroup) {
    groupToDelete.value = group
    showDeleteConfirm.value = true
  }

  function resetForm() {
    createForm.value = {
      ReplicationGroupId: '',
      ReplicationGroupDescription: '',
      CacheNodeType: 'cache.t3.micro',
      Engine: 'valkey',
      NumNodeGroups: 1,
      Port: 6379,
    }
  }

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

  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# Describe all replication groups
aws elasticache describe-replication-groups --region ${settingsStore.region}

# Describe specific group
aws elasticache describe-replication-group \\
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
  --region ${settingsStore.region}`,
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
console.log(createResponse.ReplicationGroup);`,
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
)`,
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/elasticache"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := elasticache.NewFromConfig(cfg, func(o *elasticache.Options) {
    o.BaseEndpoint = aws.String("http://127.0.0.1:4566")
})

// Describe replication groups
groups, _ := client.DescribeReplicationGroups(context.Background(), &elasticache.DescribeReplicationGroupsInput{})
for _, group := range groups.ReplicationGroups {
    fmt.Printf("Group: %s, Status: %s, Engine: %s\\n", aws.ToString(group.ReplicationGroupId), aws.ToString(group.Status), aws.ToString(group.Engine))
}

// Create replication group
client.CreateReplicationGroup(context.Background(), &elasticache.CreateReplicationGroupInput{
    ReplicationGroupId:          aws.String("my-cache"),
    ReplicationGroupDescription: aws.String("Dev cache"),
    Engine:                      aws.String("valkey"),
    CacheNodeType:               aws.String("cache.t3.micro"),
    NumNodeGroups:               aws.Int32(1),
})

// Delete replication group
client.DeleteReplicationGroup(context.Background(), &elasticache.DeleteReplicationGroupInput{
    ReplicationGroupId: aws.String("my-cache"),
})`,
    },
  ])

  return {
    groups,
    loading,
    expandedGroups,
    showCreateModal,
    creating,
    showDeleteConfirm,
    groupToDelete,
    createForm,
    codeExamples,
    loadGroups,
    createGroup,
    deleteGroup,
    toggleGroup,
    confirmDelete,
    resetForm,
    getStatus,
  }
}