import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { EC2Instance, EC2KeyPair, EC2SecurityGroup } from '@/api/types/aws'
import type { VpcSelection } from '@/types/vpc'
import * as ec2Api from '@/api/services/ec2'

export function useEC2() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  // State
  const instances = ref<EC2Instance[]>([])
  const keyPairs = ref<EC2KeyPair[]>([])
  const securityGroups = ref<EC2SecurityGroup[]>([])
  const loading = ref(false)

  // Accordion state
  const expandedInstances = ref<Set<string>>(new Set())
  const expandedKeyPairs = ref<Set<string>>(new Set())
  const expandedSecurityGroups = ref<Set<string>>(new Set())

  // Modal state
  const showCreateModal = ref(false)
  const creating = ref(false)
  const showDeleteConfirm = ref(false)
  const itemToDelete = ref<any>(null)
  const deleteType = ref<'instance' | 'keypair' | 'secgroup'>('instance')
  const showKeyPairModal = ref(false)
  const showSecurityGroupModal = ref(false)

  const newKeyMaterial = ref<string | null>(null)

  // Create instance form
  const createForm = ref({
    ImageId: 'ami-0abcdef1234567890',
    InstanceType: 't2.micro',
    KeyName: '',
    SecurityGroupIds: [] as string[],
    SubnetId: '',
    MinCount: 1,
    MaxCount: 1,
    vpcSelection: null as VpcSelection | null,
  })

  // Load functions
  async function loadInstances() {
    loading.value = true
    try {
      const result = await ec2Api.describeInstances()
      const allInstances: EC2Instance[] = []
      for (const res of result.Reservations || []) {
        if (res.Instances) {
          allInstances.push(...res.Instances)
        }
      }
      instances.value = allInstances
    } catch (error: any) {
      console.error('Failed to load instances:', error)
      toast.error(`Failed to load instances: ${error}`)
      instances.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadKeyPairs() {
    try {
      const result = await ec2Api.describeKeyPairs()
      keyPairs.value = result.KeyPairs || []
    } catch (error: any) {
      console.error('Failed to load key pairs:', error)
      toast.error(`Failed to load key pairs: ${error}`)
      keyPairs.value = []
    }
  }

  async function loadSecurityGroups() {
    try {
      const result = await ec2Api.describeSecurityGroups()
      securityGroups.value = result.SecurityGroups || []
    } catch (error: any) {
      console.error('Failed to load security groups:', error)
      toast.error(`Failed to load security groups: ${error}`)
      securityGroups.value = []
    }
  }

  async function loadAll() {
    await Promise.all([
      loadInstances(),
      loadKeyPairs(),
      loadSecurityGroups(),
    ])
  }

  // CRUD - Instances
  async function runInstance() {
    if (!createForm.value.ImageId) {
      toast.warning('Image ID is required')
      return
    }

    creating.value = true
    try {
      const vpcSelection = createForm.value.vpcSelection
      // Prefer vpcSelection as source of truth; fall back to form fields for backward compat
      const subnetId = vpcSelection ? vpcSelection.subnetIds[0] || '' : createForm.value.SubnetId
      const securityGroupIds = vpcSelection ? vpcSelection.securityGroupIds : createForm.value.SecurityGroupIds
      await ec2Api.runInstances({
        ImageId: createForm.value.ImageId,
        InstanceType: createForm.value.InstanceType,
        KeyName: createForm.value.KeyName || undefined,
        SecurityGroupIds: securityGroupIds.length > 0 ? securityGroupIds : undefined,
        SubnetId: subnetId || undefined,
        MinCount: createForm.value.MinCount,
        MaxCount: createForm.value.MaxCount,
      })

      await loadInstances()
      toast.success('Instance is being launched')
      showCreateModal.value = false
      resetForm()
    } catch (error: any) {
      console.error('Failed to run instance:', error)
      toast.error(`Failed to run instance: ${error}`)
    } finally {
      creating.value = false
    }
  }

  async function terminateInstance() {
    if (!itemToDelete.value) return
    try {
      await ec2Api.terminateInstance(itemToDelete.value.InstanceId)
      instances.value = instances.value.filter(
        (i) => i.InstanceId !== itemToDelete.value?.InstanceId,
      )
      expandedInstances.value.delete(itemToDelete.value.InstanceId)
      toast.success(`Instance ${itemToDelete.value.InstanceId} is being terminated`)
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to terminate instance: ${error}`)
    }
  }

  async function startInstance(instanceId: string) {
    try {
      await ec2Api.startInstance(instanceId)
      toast.success(`Instance ${instanceId} is starting`)
      await loadInstances()
    } catch (error: any) {
      toast.error(`Failed to start instance: ${error}`)
    }
  }

  async function stopInstance(instanceId: string) {
    try {
      await ec2Api.stopInstance(instanceId)
      toast.success(`Instance ${instanceId} is stopping`)
      await loadInstances()
    } catch (error: any) {
      toast.error(`Failed to stop instance: ${error}`)
    }
  }

  // CRUD - Key Pairs
  async function createKeyPair(keyName: string) {
    try {
      const result = await ec2Api.createKeyPair(keyName)
      await loadKeyPairs()
      return result
    } catch (error: any) {
      toast.error(`Failed to create key pair: ${error}`)
      throw error
    }
  }

  async function importKeyPair(keyName: string, publicKeyMaterial: string) {
    try {
      await ec2Api.importKeyPair(keyName, publicKeyMaterial)
      await loadKeyPairs()
      toast.success(`Key pair "${keyName}" imported`)
    } catch (error: any) {
      toast.error(`Failed to import key pair: ${error}`)
      throw error
    }
  }

  async function deleteKeyPair() {
    if (!itemToDelete.value) return
    try {
      await ec2Api.deleteKeyPair(itemToDelete.value.KeyName)
      keyPairs.value = keyPairs.value.filter(
        (k) => k.KeyName !== itemToDelete.value?.KeyName,
      )
      expandedKeyPairs.value.delete(itemToDelete.value.KeyName)
      toast.success(`Key pair ${itemToDelete.value.KeyName} deleted`)
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete key pair: ${error}`)
    }
  }

  // CRUD - Security Groups
  async function createSecurityGroup(params: {
    GroupName: string
    Description: string
    VpcId?: string
    IngressRules?: Array<{
      IpProtocol: string
      FromPort?: number
      ToPort?: number
      CidrIp?: string
    }>
  }) {
    try {
      const result = await ec2Api.createSecurityGroup({
        GroupName: params.GroupName,
        Description: params.Description,
        VpcId: params.VpcId,
      })
      // Authorize ingress rules if provided
      if (params.IngressRules && result.GroupId) {
        for (const rule of params.IngressRules) {
          await ec2Api.authorizeSecurityGroupIngress(result.GroupId, rule)
        }
      }
      await loadSecurityGroups()
      toast.success(`Security group "${params.GroupName}" created`)
      return result
    } catch (error: any) {
      toast.error(`Failed to create security group: ${error}`)
      throw error
    }
  }

  async function deleteSecurityGroup() {
    if (!itemToDelete.value) return
    try {
      await ec2Api.deleteSecurityGroup(itemToDelete.value.GroupId)
      securityGroups.value = securityGroups.value.filter(
        (sg) => sg.GroupId !== itemToDelete.value?.GroupId,
      )
      expandedSecurityGroups.value.delete(itemToDelete.value.GroupId)
      toast.success(`Security group ${itemToDelete.value.GroupId} deleted`)
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete security group: ${error}`)
    }
  }

  async function authorizeIngress(groupId: string, rule: {
    IpProtocol: string
    FromPort?: number
    ToPort?: number
    CidrIp?: string
  }) {
    try {
      await ec2Api.authorizeSecurityGroupIngress(groupId, rule)
      await loadSecurityGroups()
      toast.success('Ingress rule added')
    } catch (error: any) {
      toast.error(`Failed to add ingress rule: ${error}`)
    }
  }

  // UI helpers
  function toggleInstances(id: string) {
    if (expandedInstances.value.has(id)) {
      expandedInstances.value.delete(id)
    } else {
      expandedInstances.value.add(id)
    }
    expandedInstances.value = new Set(expandedInstances.value)
  }

  function toggleKeyPairs(name: string) {
    if (expandedKeyPairs.value.has(name)) {
      expandedKeyPairs.value.delete(name)
    } else {
      expandedKeyPairs.value.add(name)
    }
    expandedKeyPairs.value = new Set(expandedKeyPairs.value)
  }

  function toggleSecurityGroups(id: string) {
    if (expandedSecurityGroups.value.has(id)) {
      expandedSecurityGroups.value.delete(id)
    } else {
      expandedSecurityGroups.value.add(id)
    }
    expandedSecurityGroups.value = new Set(expandedSecurityGroups.value)
  }

  function confirmDelete(item: any, type: 'instance' | 'keypair' | 'secgroup') {
    itemToDelete.value = item
    deleteType.value = type
    showDeleteConfirm.value = true
  }

  function getStatus(state?: string): 'active' | 'pending' | 'inactive' | 'error' {
    const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
      running: 'active',
      pending: 'pending',
      stopping: 'pending',
      stopped: 'inactive',
      terminated: 'inactive',
      shuttingdown: 'pending',
      available: 'active',
      creating: 'pending',
      deleting: 'pending',
      deleted: 'inactive',
    }
    const lowerStatus = state?.toLowerCase() || ''
    return statusMap[lowerStatus] || 'inactive'
  }

  function resetForm() {
    createForm.value = {
      ImageId: 'ami-0abcdef1234567890',
      InstanceType: 't2.micro',
      KeyName: '',
      SecurityGroupIds: [],
      SubnetId: '',
      MinCount: 1,
      MaxCount: 1,
      vpcSelection: null,
    }
  }

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# Describe all EC2 instances
aws ec2 describe-instances --endpoint-url ${settingsStore.publicEndpoint}

# Run (create) an EC2 instance
aws ec2 run-instances \\
  --image-id ami-0abcdef1234567890 \\
  --instance-type t2.micro \\
  --key-name my-key \\
  --security-group-ids sg-123 \\
  --subnet-id subnet-123 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Terminate an EC2 instance
aws ec2 terminate-instances \\
  --instance-ids i-123 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Start an instance
aws ec2 start-instances \\
  --instance-ids i-123 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Stop an instance
aws ec2 stop-instances \\
  --instance-ids i-123 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Describe key pairs
aws ec2 describe-key-pairs --endpoint-url ${settingsStore.publicEndpoint}

# Create key pair
aws ec2 create-key-pair \\
  --key-name my-key \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Describe security groups
aws ec2 describe-security-groups --endpoint-url ${settingsStore.publicEndpoint}

# Create security group
aws ec2 create-security-group \\
  --group-name web-sg \\
  --description "Web server SG" \\
  --vpc-id vpc-123 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Authorize security group ingress
aws ec2 authorize-security-group-ingress \\
  --group-id sg-123 \\
  --protocol tcp \\
  --port 80 \\
  --cidr 0.0.0.0/0 \\
  --endpoint-url ${settingsStore.publicEndpoint}`,
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { EC2Client, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand, StartInstancesCommand, StopInstancesCommand, CreateKeyPairCommand, DescribeSecurityGroupsCommand, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// Describe instances
const instances = await client.send(new DescribeInstancesCommand({}));
console.log(instances.Reservations);

// Run instance
await client.send(new RunInstancesCommand({
  ImageId: 'ami-0abcdef1234567890',
  InstanceType: 't2.micro',
  MinCount: 1,
  MaxCount: 1,
}));

// Terminate instance
await client.send(new TerminateInstancesCommand({
  InstanceIds: ['i-123'],
}));

// Create key pair
const key = await client.send(new CreateKeyPairCommand({ KeyName: 'my-key' }));
console.log(key.KeyMaterial);

// Create security group
const sg = await client.send(new CreateSecurityGroupCommand({
  GroupName: 'web-sg',
  Description: 'Web server SG',
}));

// Authorize ingress
await client.send(new AuthorizeSecurityGroupIngressCommand({
  GroupId: sg.GroupId,
  IpPermissions: [{
    IpProtocol: 'tcp',
    FromPort: 80,
    ToPort: 80,
    IpRanges: [{ CidrIp: '0.0.0.0/0' }],
  }],
}));`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import boto3

# Create EC2 client
ec2 = boto3.client('ec2',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}'
)

# Describe instances
response = ec2.describe_instances()
for reservation in response['Reservations']:
    for instance in reservation['Instances']:
        print(f"Instance: {instance['InstanceId']}, State: {instance['State']['Name']}")

# Run instance
ec2.run_instances(
    ImageId='ami-0abcdef1234567890',
    InstanceType='t2.micro',
    MinCount=1,
    MaxCount=1
)

# Terminate instance
ec2.terminate_instances(InstanceIds=['i-123'])

# Create key pair
key = ec2.create_key_pair(KeyName='my-key')
print(key['KeyMaterial'])

# Create security group
sg = ec2.create_security_group(
    GroupName='web-sg',
    Description='Web server SG'
)

# Authorize ingress
ec2.authorize_security_group_ingress(
    GroupId=sg['GroupId'],
    IpPermissions=[{
        'IpProtocol': 'tcp',
        'FromPort': 80,
        'ToPort': 80,
        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
    }]
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
    "github.com/aws/aws-sdk-go-v2/service/ec2"
    "github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := ec2.NewFromConfig(cfg, func(o *ec2.Options) {
    o.BaseEndpoint = "${settingsStore.publicEndpoint}"
})

ctx := context.Background()

// Describe instances
instances, _ := client.DescribeInstances(ctx, &ec2.DescribeInstancesInput{})
for _, r := range instances.Reservations {
    for _, i := range r.Instances {
        fmt.Printf("Instance: %s, State: %s\\n", *i.InstanceId, i.State.Name)
    }
}

// Run instance
client.RunInstances(ctx, &ec2.RunInstancesInput{
    ImageId:      aws.String("ami-0abcdef1234567890"),
    InstanceType: types.InstanceTypeT2Micro,
    MinCount:     aws.Int32(1),
    MaxCount:     aws.Int32(1),
})

// Terminate instance
client.TerminateInstances(ctx, &ec2.TerminateInstancesInput{
    InstanceIds: []string{"i-123"},
})

// Create key pair
key, _ := client.CreateKeyPair(ctx, &ec2.CreateKeyPairInput{KeyName: aws.String("my-key")})
fmt.Println(*key.KeyMaterial)

// Create security group
sg, _ := client.CreateSecurityGroup(ctx, &ec2.CreateSecurityGroupInput{
    GroupName:   aws.String("web-sg"),
    Description: aws.String("Web server SG"),
})

// Authorize ingress
client.AuthorizeSecurityGroupIngress(ctx, &ec2.AuthorizeSecurityGroupIngressInput{
    GroupId: sg.GroupId,
    IpPermissions: []types.IpPermission{{
        IpProtocol: aws.String("tcp"),
        FromPort:   aws.Int32(80),
        ToPort:     aws.Int32(80),
        IpRanges:   []types.IpRange{{CidrIp: aws.String("0.0.0.0/0")}},
    }},
})`,
    },
  ])

  return {
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
    newKeyMaterial,
    createForm,
    loadAll,
    loadInstances,
    loadKeyPairs,
    loadSecurityGroups,
    runInstance,
    terminateInstance,
    startInstance,
    stopInstance,
    createKeyPair,
    importKeyPair,
    deleteKeyPair,
    createSecurityGroup,
    deleteSecurityGroup,
    authorizeIngress,
    toggleInstances,
    toggleKeyPairs,
    toggleSecurityGroups,
    confirmDelete,
    getStatus,
    resetForm,
    codeExamples,
  }
}
