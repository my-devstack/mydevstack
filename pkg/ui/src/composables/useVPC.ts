import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { EC2Vpc, EC2Subnet, EC2RouteTable, EC2InternetGateway, EC2NatGateway, EC2NetworkAcl, EC2FlowLog, EC2ElasticIp } from '@/api/types/aws'
import * as vpcApi from '@/api/services/vpc'

export function useVPC() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  // State
  const vpcs = ref<EC2Vpc[]>([])
  const subnets = ref<EC2Subnet[]>([])
  const routeTables = ref<EC2RouteTable[]>([])
  const internetGateways = ref<EC2InternetGateway[]>([])
  const natGateways = ref<EC2NatGateway[]>([])
  const networkAcls = ref<EC2NetworkAcl[]>([])
  const flowLogs = ref<EC2FlowLog[]>([])
  const elasticIps = ref<EC2ElasticIp[]>([])
  const loading = ref(false)

  // Accordion state
  const expandedVpcs = ref<Set<string>>(new Set())
  const expandedSubnets = ref<Set<string>>(new Set())
  const expandedRouteTables = ref<Set<string>>(new Set())
  const expandedInternetGateways = ref<Set<string>>(new Set())
  const expandedNatGateways = ref<Set<string>>(new Set())
  const expandedNetworkAcls = ref<Set<string>>(new Set())
  const expandedFlowLogs = ref<Set<string>>(new Set())
  const expandedElasticIps = ref<Set<string>>(new Set())

  // Modal state
  const showDeleteConfirm = ref(false)
  const itemToDelete = ref<any>(null)
  const deleteType = ref<'vpc' | 'subnet' | 'routetable' | 'igw' | 'natgw' | 'nacl' | 'flowlog' | 'eip'>('vpc')

  const showVpcModal = ref(false)
  const showSubnetModal = ref(false)
  const showRouteTableModal = ref(false)
  const showIgwModal = ref(false)
  const showNatGatewayModal = ref(false)
  const showNaclModal = ref(false)
  const showFlowLogModal = ref(false)
  const showRouteTableDetailModal = ref(false)
  const showNaclRuleModal = ref(false)

  const selectedRouteTable = ref<EC2RouteTable | null>(null)
  const selectedNacl = ref<EC2NetworkAcl | null>(null)

  // Creating states
  const vpcCreating = ref(false)
  const subnetCreating = ref(false)
  const routeTableCreating = ref(false)
  const igwCreating = ref(false)
  const natGatewayCreating = ref(false)
  const naclCreating = ref(false)
  const flowLogCreating = ref(false)

  // Load functions
  async function loadVpcs() {
    try {
      const result = await vpcApi.describeVpcs()
      vpcs.value = result.Vpcs || []
    } catch (error: any) {
      console.error('Failed to load VPCs:', error)
      toast.error(`Failed to load VPCs: ${error}`)
      vpcs.value = []
    }
  }

  async function loadSubnets() {
    try {
      const result = await vpcApi.describeSubnets()
      subnets.value = result.Subnets || []
    } catch (error: any) {
      console.error('Failed to load subnets:', error)
      toast.error(`Failed to load subnets: ${error}`)
      subnets.value = []
    }
  }

  async function loadRouteTables() {
    try {
      const result = await vpcApi.describeRouteTables()
      routeTables.value = result.RouteTables || []
    } catch (error: any) {
      console.error('Failed to load route tables:', error)
      toast.error(`Failed to load route tables: ${error}`)
      routeTables.value = []
    }
  }

  async function loadInternetGateways() {
    try {
      const result = await vpcApi.describeInternetGateways()
      internetGateways.value = result.InternetGateways || []
    } catch (error: any) {
      console.error('Failed to load internet gateways:', error)
      toast.error(`Failed to load internet gateways: ${error}`)
      internetGateways.value = []
    }
  }

  async function loadNatGateways() {
    try {
      const result = await vpcApi.describeNatGateways()
      natGateways.value = result.NatGateways || []
    } catch (error: any) {
      console.error('Failed to load NAT gateways:', error)
      toast.error(`Failed to load NAT gateways: ${error}`)
      natGateways.value = []
    }
  }

  async function loadNetworkAcls() {
    try {
      const result = await vpcApi.describeNetworkAcls()
      networkAcls.value = result.NetworkAcls || []
    } catch (error: any) {
      console.error('Failed to load network ACLs:', error)
      toast.error(`Failed to load network ACLs: ${error}`)
      networkAcls.value = []
    }
  }

  async function loadFlowLogs() {
    try {
      const result = await vpcApi.describeFlowLogs()
      flowLogs.value = result.FlowLogs || []
    } catch (error: any) {
      console.error('Failed to load flow logs:', error)
      toast.error(`Failed to load flow logs: ${error}`)
      flowLogs.value = []
    }
  }

  async function loadElasticIps() {
    try {
      const result = await vpcApi.describeAddresses()
      elasticIps.value = result.Addresses || []
    } catch (error: any) {
      console.error('Failed to load elastic IPs:', error)
      toast.error(`Failed to load elastic IPs: ${error}`)
      elasticIps.value = []
    }
  }

  async function loadAll() {
    loading.value = true
    await Promise.all([
      loadVpcs(),
      loadSubnets(),
      loadRouteTables(),
      loadInternetGateways(),
      loadNatGateways(),
      loadNetworkAcls(),
      loadFlowLogs(),
      loadElasticIps(),
    ])
    loading.value = false
  }

  // CRUD - VPCs
  async function handleCreateVpc(data: { CidrBlock: string }) {
    vpcCreating.value = true
    try {
      await vpcApi.createVpc(data)
      await loadVpcs()
      toast.success('VPC created')
      showVpcModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create VPC: ${error}`)
    } finally {
      vpcCreating.value = false
    }
  }

  async function handleDeleteVpc() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteVpc(itemToDelete.value.VpcId)
      vpcs.value = vpcs.value.filter((v: EC2Vpc) => v.VpcId !== itemToDelete.value?.VpcId)
      toast.success('VPC deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete VPC: ${error}`)
    }
  }

  // CRUD - Subnets
  async function handleCreateSubnet(data: { VpcId: string; CidrBlock: string; AvailabilityZone?: string }) {
    subnetCreating.value = true
    try {
      await vpcApi.createSubnet(data)
      await loadSubnets()
      toast.success('Subnet created')
      showSubnetModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create subnet: ${error}`)
    } finally {
      subnetCreating.value = false
    }
  }

  async function handleDeleteSubnet() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteSubnet(itemToDelete.value.SubnetId)
      subnets.value = subnets.value.filter((s: EC2Subnet) => s.SubnetId !== itemToDelete.value?.SubnetId)
      toast.success('Subnet deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete subnet: ${error}`)
    }
  }

  // CRUD - Route Tables
  async function handleCreateRouteTable(data: { VpcId: string }) {
    routeTableCreating.value = true
    try {
      await vpcApi.createRouteTable(data)
      await loadRouteTables()
      toast.success('Route table created')
      showRouteTableModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create route table: ${error}`)
    } finally {
      routeTableCreating.value = false
    }
  }

  async function handleDeleteRouteTable() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteRouteTable(itemToDelete.value.RouteTableId)
      routeTables.value = routeTables.value.filter((rt: EC2RouteTable) => rt.RouteTableId !== itemToDelete.value?.RouteTableId)
      toast.success('Route table deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete route table: ${error}`)
    }
  }

  async function handleCreateRoute(rtbId: string, params: { DestinationCidrBlock: string; GatewayId?: string; NatGatewayId?: string }) {
    try {
      await vpcApi.createRoute(rtbId, params)
      await loadRouteTables()
      toast.success('Route added')
    } catch (error: any) {
      toast.error(`Failed to add route: ${error}`)
    }
  }

  async function handleDeleteRoute(rtbId: string, cidr: string) {
    try {
      await vpcApi.deleteRoute(rtbId, cidr)
      await loadRouteTables()
      toast.success('Route deleted')
    } catch (error: any) {
      toast.error(`Failed to delete route: ${error}`)
    }
  }

  async function handleAssociateRouteTable(rtbId: string, subnetId: string) {
    try {
      await vpcApi.associateRouteTable(rtbId, subnetId)
      await loadRouteTables()
      toast.success('Subnet associated')
    } catch (error: any) {
      toast.error(`Failed to associate subnet: ${error}`)
    }
  }

  async function handleDisassociateRouteTable(associationId: string) {
    try {
      await vpcApi.disassociateRouteTable(associationId)
      await loadRouteTables()
      toast.success('Subnet disassociated')
    } catch (error: any) {
      toast.error(`Failed to disassociate subnet: ${error}`)
    }
  }

  // CRUD - Internet Gateways
  async function handleCreateIgw(vpcId?: string) {
    igwCreating.value = true
    try {
      const igw = await vpcApi.createInternetGateway()
      if (vpcId && igw.InternetGatewayId) {
        await vpcApi.attachInternetGateway(igw.InternetGatewayId, vpcId)
      }
      await loadInternetGateways()
      toast.success('Internet gateway created')
      showIgwModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create internet gateway: ${error}`)
    } finally {
      igwCreating.value = false
    }
  }

  async function handleDeleteIgw() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteInternetGateway(itemToDelete.value.InternetGatewayId)
      internetGateways.value = internetGateways.value.filter((igw: EC2InternetGateway) => igw.InternetGatewayId !== itemToDelete.value?.InternetGatewayId)
      toast.success('Internet gateway deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete internet gateway: ${error}`)
    }
  }

  // CRUD - NAT Gateways
  async function handleCreateNatGateway(data: { SubnetId: string; AllocationId: string }) {
    natGatewayCreating.value = true
    try {
      await vpcApi.createNatGateway(data)
      await loadNatGateways()
      toast.success('NAT gateway created')
      showNatGatewayModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create NAT gateway: ${error}`)
    } finally {
      natGatewayCreating.value = false
    }
  }

  async function handleDeleteNatGateway() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteNatGateway(itemToDelete.value.NatGatewayId)
      natGateways.value = natGateways.value.filter((nat: EC2NatGateway) => nat.NatGatewayId !== itemToDelete.value?.NatGatewayId)
      toast.success('NAT gateway deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete NAT gateway: ${error}`)
    }
  }

  // CRUD - Network ACLs
  async function handleCreateNacl(data: { VpcId: string }) {
    naclCreating.value = true
    try {
      await vpcApi.createNetworkAcl(data)
      await loadNetworkAcls()
      toast.success('Network ACL created')
      showNaclModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create network ACL: ${error}`)
    } finally {
      naclCreating.value = false
    }
  }

  async function handleDeleteNacl() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteNetworkAcl(itemToDelete.value.NetworkAclId)
      networkAcls.value = networkAcls.value.filter((nacl: EC2NetworkAcl) => nacl.NetworkAclId !== itemToDelete.value?.NetworkAclId)
      toast.success('Network ACL deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete network ACL: ${error}`)
    }
  }

  async function handleCreateNaclRule(naclId: string, params: {
    RuleNumber: number
    Protocol: string
    PortRange?: { From: number; To: number }
    CidrBlock: string
    Egress: boolean
    RuleAction: 'allow' | 'deny'
  }) {
    try {
      await vpcApi.createNetworkAclEntry(naclId, params)
      await loadNetworkAcls()
      toast.success('NACL rule added')
    } catch (error: any) {
      toast.error(`Failed to add NACL rule: ${error}`)
    }
  }

  async function handleDeleteNaclRule(naclId: string, ruleNumber: number) {
    try {
      await vpcApi.deleteNetworkAclEntry(naclId, ruleNumber)
      await loadNetworkAcls()
      toast.success('NACL rule deleted')
    } catch (error: any) {
      toast.error(`Failed to delete NACL rule: ${error}`)
    }
  }

  // CRUD - Flow Logs
  async function handleCreateFlowLog(data: {
    ResourceId: string
    LogDestinationType: string
    LogDestination: string
    TrafficType: string
  }) {
    flowLogCreating.value = true
    try {
      await vpcApi.createFlowLogs(data)
      await loadFlowLogs()
      toast.success('Flow log created')
      showFlowLogModal.value = false
    } catch (error: any) {
      toast.error(`Failed to create flow log: ${error}`)
    } finally {
      flowLogCreating.value = false
    }
  }

  async function handleDeleteFlowLog() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.deleteFlowLogs(itemToDelete.value.FlowLogId)
      flowLogs.value = flowLogs.value.filter((fl: EC2FlowLog) => fl.FlowLogId !== itemToDelete.value?.FlowLogId)
      toast.success('Flow log deleted')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to delete flow log: ${error}`)
    }
  }

  // CRUD - Elastic IPs
  async function handleAllocateElasticIp() {
    try {
      const eip = await vpcApi.allocateElasticIp()
      await loadElasticIps()
      toast.success(`Elastic IP ${eip.PublicIp} allocated`)
      return eip
    } catch (error: any) {
      toast.error(`Failed to allocate elastic IP: ${error}`)
      throw error
    }
  }

  async function handleReleaseElasticIp() {
    if (!itemToDelete.value) return
    try {
      await vpcApi.releaseElasticIp(itemToDelete.value.AllocationId)
      elasticIps.value = elasticIps.value.filter((eip: EC2ElasticIp) => eip.AllocationId !== itemToDelete.value?.AllocationId)
      toast.success('Elastic IP released')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to release elastic IP: ${error}`)
    }
  }

  // UI helpers
  function toggleVpcs(id: string) {
    if (expandedVpcs.value.has(id)) {
      expandedVpcs.value.delete(id)
    } else {
      expandedVpcs.value.add(id)
    }
    expandedVpcs.value = new Set(expandedVpcs.value)
  }

  function toggleSubnets(id: string) {
    if (expandedSubnets.value.has(id)) {
      expandedSubnets.value.delete(id)
    } else {
      expandedSubnets.value.add(id)
    }
    expandedSubnets.value = new Set(expandedSubnets.value)
  }

  function toggleRouteTables(id: string) {
    if (expandedRouteTables.value.has(id)) {
      expandedRouteTables.value.delete(id)
    } else {
      expandedRouteTables.value.add(id)
    }
    expandedRouteTables.value = new Set(expandedRouteTables.value)
  }

  function toggleInternetGateways(id: string) {
    if (expandedInternetGateways.value.has(id)) {
      expandedInternetGateways.value.delete(id)
    } else {
      expandedInternetGateways.value.add(id)
    }
    expandedInternetGateways.value = new Set(expandedInternetGateways.value)
  }

  function toggleNatGateways(id: string) {
    if (expandedNatGateways.value.has(id)) {
      expandedNatGateways.value.delete(id)
    } else {
      expandedNatGateways.value.add(id)
    }
    expandedNatGateways.value = new Set(expandedNatGateways.value)
  }

  function toggleNetworkAcls(id: string) {
    if (expandedNetworkAcls.value.has(id)) {
      expandedNetworkAcls.value.delete(id)
    } else {
      expandedNetworkAcls.value.add(id)
    }
    expandedNetworkAcls.value = new Set(expandedNetworkAcls.value)
  }

  function toggleFlowLogs(id: string) {
    if (expandedFlowLogs.value.has(id)) {
      expandedFlowLogs.value.delete(id)
    } else {
      expandedFlowLogs.value.add(id)
    }
    expandedFlowLogs.value = new Set(expandedFlowLogs.value)
  }

  function toggleElasticIps(id: string) {
    if (expandedElasticIps.value.has(id)) {
      expandedElasticIps.value.delete(id)
    } else {
      expandedElasticIps.value.add(id)
    }
    expandedElasticIps.value = new Set(expandedElasticIps.value)
  }

  function confirmDelete(item: any, type: 'vpc' | 'subnet' | 'routetable' | 'igw' | 'natgw' | 'nacl' | 'flowlog' | 'eip') {
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

  // Route table / NACL detail helpers
  function openRouteTableDetail(rt: EC2RouteTable) {
    selectedRouteTable.value = rt
    showRouteTableDetailModal.value = true
  }

  function openNaclRuleDetail(nacl: EC2NetworkAcl) {
    selectedNacl.value = nacl
    showNaclRuleModal.value = true
  }

  // Code examples
  const codeExamples = computed(() => [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --endpoint-url http://127.0.0.1:4566

# Describe VPCs
aws ec2 describe-vpcs --endpoint-url http://127.0.0.1:4566

# Create subnet
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --endpoint-url http://127.0.0.1:4566

# Create route table
aws ec2 create-route-table --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566

# Create internet gateway and attach
aws ec2 create-internet-gateway --endpoint-url http://127.0.0.1:4566
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxxxx --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566

# Create NAT gateway
aws ec2 create-nat-gateway --subnet-id subnet-xxxxx --allocation-id eipalloc-xxxxx --endpoint-url http://127.0.0.1:4566

# Create network ACL
aws ec2 create-network-acl --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566

# Create flow logs
aws ec2 create-flow-logs --resource-id vpc-xxxxx --resource-type VPC --traffic-type ALL --log-destination-type cloud-watch-logs --log-group-name my-flow-logs --endpoint-url http://127.0.0.1:4566

# Allocate elastic IP
aws ec2 allocate-address --domain vpc --endpoint-url http://127.0.0.1:4566`,
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { EC2Client, CreateVpcCommand, DescribeVpcsCommand, CreateSubnetCommand, CreateRouteTableCommand, CreateInternetGatewayCommand, AttachInternetGatewayCommand, CreateNatGatewayCommand, CreateNetworkAclCommand, CreateFlowLogsCommand, AllocateAddressCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// Create VPC
const vpc = await client.send(new CreateVpcCommand({ CidrBlock: '10.0.0.0/16' }));
console.log(vpc.Vpc.VpcId);

// Describe VPCs
const vpcs = await client.send(new DescribeVpcsCommand({}));
console.log(vpcs.Vpcs);

// Create subnet
await client.send(new CreateSubnetCommand({
  VpcId: vpc.Vpc.VpcId,
  CidrBlock: '10.0.1.0/24',
}));

// Create route table
await client.send(new CreateRouteTableCommand({ VpcId: vpc.Vpc.VpcId }));

// Create IGW and attach
const igw = await client.send(new CreateInternetGatewayCommand({}));
await client.send(new AttachInternetGatewayCommand({
  InternetGatewayId: igw.InternetGateway.InternetGatewayId,
  VpcId: vpc.Vpc.VpcId,
}));

// Allocate elastic IP
const eip = await client.send(new AllocateAddressCommand({ Domain: 'vpc' }));

// Create NAT gateway
await client.send(new CreateNatGatewayCommand({
  SubnetId: 'subnet-xxxxx',
  AllocationId: eip.AllocationId,
}));`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `import boto3

ec2 = boto3.client('ec2',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}'
)

# Create VPC
vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
vpc_id = vpc['Vpc']['VpcId']
print(f"VPC: {vpc_id}")

# Describe VPCs
vpcs = ec2.describe_vpcs()
for v in vpcs['Vpcs']:
    print(f"VPC: {v['VpcId']}, CIDR: {v['CidrBlock']}")

# Create subnet
ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24')

# Create route table
ec2.create_route_table(VpcId=vpc_id)

# Create IGW and attach
igw = ec2.create_internet_gateway()
ec2.attach_internet_gateway(
    InternetGatewayId=igw['InternetGateway']['InternetGatewayId'],
    VpcId=vpc_id
)

# Allocate elastic IP and create NAT gateway
eip = ec2.allocate_address(Domain='vpc')
ec2.create_nat_gateway(
    SubnetId='subnet-xxxxx',
    AllocationId=eip['AllocationId']
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
    o.BaseEndpoint = "http://127.0.0.1:4566"
})

ctx := context.Background()

// Create VPC
vpc, _ := client.CreateVpc(ctx, &ec2.CreateVpcInput{
    CidrBlock: aws.String("10.0.0.0/16"),
})
fmt.Printf("VPC: %s\\n", *vpc.Vpc.VpcId)

// Describe VPCs
vpcs, _ := client.DescribeVpcs(ctx, &ec2.DescribeVpcsInput{})
for _, v := range vpcs.Vpcs {
    fmt.Printf("VPC: %s\\n", *v.VpcId)
}

// Create subnet
client.CreateSubnet(ctx, &ec2.CreateSubnetInput{
    VpcId:     vpc.Vpc.VpcId,
    CidrBlock: aws.String("10.0.1.0/24"),
})

// Create IGW and attach
igw, _ := client.CreateInternetGateway(ctx, &ec2.CreateInternetGatewayInput{})
client.AttachInternetGateway(ctx, &ec2.AttachInternetGatewayInput{
    InternetGatewayId: igw.InternetGateway.InternetGatewayId,
    VpcId:             vpc.Vpc.VpcId,
})

// Allocate EIP and create NAT gateway
eip, _ := client.AllocateAddress(ctx, &ec2.AllocateAddressInput{Domain: types.DomainTypeVpc})
client.CreateNatGateway(ctx, &ec2.CreateNatGatewayInput{
    SubnetId:     aws.String("subnet-xxxxx"),
    AllocationId: eip.AllocationId,
})`,
    },
  ])

  return {
    vpcs,
    subnets,
    routeTables,
    internetGateways,
    natGateways,
    networkAcls,
    flowLogs,
    elasticIps,
    loading,
    expandedVpcs,
    expandedSubnets,
    expandedRouteTables,
    expandedInternetGateways,
    expandedNatGateways,
    expandedNetworkAcls,
    expandedFlowLogs,
    expandedElasticIps,
    showDeleteConfirm,
    itemToDelete,
    deleteType,
    showVpcModal,
    showSubnetModal,
    showRouteTableModal,
    showIgwModal,
    showNatGatewayModal,
    showNaclModal,
    showFlowLogModal,
    showRouteTableDetailModal,
    showNaclRuleModal,
    selectedRouteTable,
    selectedNacl,
    vpcCreating,
    subnetCreating,
    routeTableCreating,
    igwCreating,
    natGatewayCreating,
    naclCreating,
    flowLogCreating,
    loadAll,
    loadVpcs,
    loadSubnets,
    loadRouteTables,
    loadInternetGateways,
    loadNatGateways,
    loadNetworkAcls,
    loadFlowLogs,
    loadElasticIps,
    handleCreateVpc,
    handleDeleteVpc,
    handleCreateSubnet,
    handleDeleteSubnet,
    handleCreateRouteTable,
    handleDeleteRouteTable,
    handleCreateRoute,
    handleDeleteRoute,
    handleAssociateRouteTable,
    handleDisassociateRouteTable,
    handleCreateIgw,
    handleDeleteIgw,
    handleCreateNatGateway,
    handleDeleteNatGateway,
    handleCreateNacl,
    handleDeleteNacl,
    handleCreateNaclRule,
    handleDeleteNaclRule,
    handleCreateFlowLog,
    handleDeleteFlowLog,
    handleAllocateElasticIp,
    handleReleaseElasticIp,
    toggleVpcs,
    toggleSubnets,
    toggleRouteTables,
    toggleInternetGateways,
    toggleNatGateways,
    toggleNetworkAcls,
    toggleFlowLogs,
    toggleElasticIps,
    confirmDelete,
    getStatus,
    codeExamples,
    openRouteTableDetail,
    openNaclRuleDetail,
  }
}
