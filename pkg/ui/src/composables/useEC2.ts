import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { EC2Instance, EC2KeyPair, EC2SecurityGroup, EC2Vpc, EC2Subnet, EC2RouteTable, EC2InternetGateway, EC2NatGateway, EC2NetworkAcl, EC2FlowLog, EC2ElasticIp } from '@/api/types/aws'
import * as ec2Api from '@/api/services/ec2'

export function useEC2() {
  const toast = useToast()
  const settingsStore = useSettingsStore()

  // State
  const instances = ref<EC2Instance[]>([])
  const keyPairs = ref<EC2KeyPair[]>([])
  const securityGroups = ref<EC2SecurityGroup[]>([])
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
  const expandedInstances = ref<Set<string>>(new Set())
  const expandedKeyPairs = ref<Set<string>>(new Set())
  const expandedSecurityGroups = ref<Set<string>>(new Set())
  const expandedVpcs = ref<Set<string>>(new Set())
  const expandedSubnets = ref<Set<string>>(new Set())
  const expandedRouteTables = ref<Set<string>>(new Set())
  const expandedInternetGateways = ref<Set<string>>(new Set())
  const expandedNatGateways = ref<Set<string>>(new Set())
  const expandedNetworkAcls = ref<Set<string>>(new Set())
  const expandedFlowLogs = ref<Set<string>>(new Set())
  const expandedElasticIps = ref<Set<string>>(new Set())

  // Modal state
  const showCreateModal = ref(false)
  const creating = ref(false)
  const showDeleteConfirm = ref(false)
  const itemToDelete = ref<any>(null)
  const deleteType = ref<'instance' | 'keypair' | 'secgroup' | 'vpc' | 'subnet' | 'routetable' | 'igw' | 'natgw' | 'nacl' | 'flowlog' | 'eip'>('instance')
  const showKeyPairModal = ref(false)
  const showSecurityGroupModal = ref(false)

  // VPC Modal states
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
  const newKeyMaterial = ref<string | null>(null)

  // Creating states
  const vpcCreating = ref(false)
  const subnetCreating = ref(false)
  const routeTableCreating = ref(false)
  const igwCreating = ref(false)
  const natGatewayCreating = ref(false)
  const naclCreating = ref(false)
  const flowLogCreating = ref(false)

  // Create instance form
  const createForm = ref({
    ImageId: 'ami-0abcdef1234567890',
    InstanceType: 't2.micro',
    KeyName: '',
    SecurityGroupIds: [] as string[],
    SubnetId: '',
    MinCount: 1,
    MaxCount: 1,
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

  async function loadVpcs() {
    try {
      const result = await ec2Api.describeVpcs()
      vpcs.value = result.Vpcs || []
    } catch (error: any) {
      console.error('Failed to load VPCs:', error)
      toast.error(`Failed to load VPCs: ${error}`)
      vpcs.value = []
    }
  }

  async function loadSubnets() {
    try {
      const result = await ec2Api.describeSubnets()
      subnets.value = result.Subnets || []
    } catch (error: any) {
      console.error('Failed to load subnets:', error)
      toast.error(`Failed to load subnets: ${error}`)
      subnets.value = []
    }
  }

  async function loadRouteTables() {
    try {
      const result = await ec2Api.describeRouteTables()
      routeTables.value = result.RouteTables || []
    } catch (error: any) {
      console.error('Failed to load route tables:', error)
      toast.error(`Failed to load route tables: ${error}`)
      routeTables.value = []
    }
  }

  async function loadInternetGateways() {
    try {
      const result = await ec2Api.describeInternetGateways()
      internetGateways.value = result.InternetGateways || []
    } catch (error: any) {
      console.error('Failed to load internet gateways:', error)
      toast.error(`Failed to load internet gateways: ${error}`)
      internetGateways.value = []
    }
  }

  async function loadNatGateways() {
    try {
      const result = await ec2Api.describeNatGateways()
      natGateways.value = result.NatGateways || []
    } catch (error: any) {
      console.error('Failed to load NAT gateways:', error)
      toast.error(`Failed to load NAT gateways: ${error}`)
      natGateways.value = []
    }
  }

  async function loadNetworkAcls() {
    try {
      const result = await ec2Api.describeNetworkAcls()
      networkAcls.value = result.NetworkAcls || []
    } catch (error: any) {
      console.error('Failed to load network ACLs:', error)
      toast.error(`Failed to load network ACLs: ${error}`)
      networkAcls.value = []
    }
  }

  async function loadFlowLogs() {
    try {
      const result = await ec2Api.describeFlowLogs()
      flowLogs.value = result.FlowLogs || []
    } catch (error: any) {
      console.error('Failed to load flow logs:', error)
      toast.error(`Failed to load flow logs: ${error}`)
      flowLogs.value = []
    }
  }

  async function loadElasticIps() {
    try {
      const result = await ec2Api.describeAddresses()
      elasticIps.value = result.Addresses || []
    } catch (error: any) {
      console.error('Failed to load elastic IPs:', error)
      toast.error(`Failed to load elastic IPs: ${error}`)
      elasticIps.value = []
    }
  }

  async function loadAll() {
    await Promise.all([
      loadInstances(),
      loadKeyPairs(),
      loadSecurityGroups(),
      loadVpcs(),
      loadSubnets(),
      loadRouteTables(),
      loadInternetGateways(),
      loadNatGateways(),
      loadNetworkAcls(),
      loadFlowLogs(),
      loadElasticIps(),
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
      await ec2Api.runInstances({
        ImageId: createForm.value.ImageId,
        InstanceType: createForm.value.InstanceType,
        KeyName: createForm.value.KeyName || undefined,
        SecurityGroupIds: createForm.value.SecurityGroupIds.length > 0 ? createForm.value.SecurityGroupIds : undefined,
        SubnetId: createForm.value.SubnetId || undefined,
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

  // CRUD - VPCs
  async function handleCreateVpc(data: { CidrBlock: string }) {
    vpcCreating.value = true
    try {
      await ec2Api.createVpc(data)
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
      await ec2Api.deleteVpc(itemToDelete.value.VpcId)
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
      await ec2Api.createSubnet(data)
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
      await ec2Api.deleteSubnet(itemToDelete.value.SubnetId)
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
      await ec2Api.createRouteTable(data)
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
      await ec2Api.deleteRouteTable(itemToDelete.value.RouteTableId)
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
      await ec2Api.createRoute(rtbId, params)
      await loadRouteTables()
      toast.success('Route added')
    } catch (error: any) {
      toast.error(`Failed to add route: ${error}`)
    }
  }

  async function handleDeleteRoute(rtbId: string, cidr: string) {
    try {
      await ec2Api.deleteRoute(rtbId, cidr)
      await loadRouteTables()
      toast.success('Route deleted')
    } catch (error: any) {
      toast.error(`Failed to delete route: ${error}`)
    }
  }

  async function handleAssociateRouteTable(rtbId: string, subnetId: string) {
    try {
      await ec2Api.associateRouteTable(rtbId, subnetId)
      await loadRouteTables()
      toast.success('Subnet associated')
    } catch (error: any) {
      toast.error(`Failed to associate subnet: ${error}`)
    }
  }

  async function handleDisassociateRouteTable(associationId: string) {
    try {
      await ec2Api.disassociateRouteTable(associationId)
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
      const igw = await ec2Api.createInternetGateway()
      if (vpcId && igw.InternetGatewayId) {
        await ec2Api.attachInternetGateway(igw.InternetGatewayId, vpcId)
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
      await ec2Api.deleteInternetGateway(itemToDelete.value.InternetGatewayId)
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
      await ec2Api.createNatGateway(data)
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
      await ec2Api.deleteNatGateway(itemToDelete.value.NatGatewayId)
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
      await ec2Api.createNetworkAcl(data)
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
      await ec2Api.deleteNetworkAcl(itemToDelete.value.NetworkAclId)
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
      await ec2Api.createNetworkAclEntry(naclId, params)
      await loadNetworkAcls()
      toast.success('NACL rule added')
    } catch (error: any) {
      toast.error(`Failed to add NACL rule: ${error}`)
    }
  }

  async function handleDeleteNaclRule(naclId: string, ruleNumber: number) {
    try {
      await ec2Api.deleteNetworkAclEntry(naclId, ruleNumber)
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
      await ec2Api.createFlowLogs(data)
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
      await ec2Api.deleteFlowLogs(itemToDelete.value.FlowLogId)
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
      const eip = await ec2Api.allocateElasticIp()
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
      await ec2Api.releaseElasticIp(itemToDelete.value.AllocationId)
      elasticIps.value = elasticIps.value.filter((eip: EC2ElasticIp) => eip.AllocationId !== itemToDelete.value?.AllocationId)
      toast.success('Elastic IP released')
      showDeleteConfirm.value = false
      itemToDelete.value = null
    } catch (error: any) {
      toast.error(`Failed to release elastic IP: ${error}`)
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

  function confirmDelete(item: any, type: 'instance' | 'keypair' | 'secgroup' | 'vpc' | 'subnet' | 'routetable' | 'igw' | 'natgw' | 'nacl' | 'flowlog' | 'eip') {
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
    }
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
      code: `# Describe all EC2 instances
aws ec2 describe-instances --endpoint-url http://127.0.0.1:4566

# Run (create) an EC2 instance
aws ec2 run-instances \\
  --image-id ami-0abcdef1234567890 \\
  --instance-type t2.micro \\
  --key-name my-key \\
  --security-group-ids sg-123 \\
  --subnet-id subnet-123 \\
  --endpoint-url http://127.0.0.1:4566

# Terminate an EC2 instance
aws ec2 terminate-instances \\
  --instance-ids i-123 \\
  --endpoint-url http://127.0.0.1:4566

# Start an instance
aws ec2 start-instances \\
  --instance-ids i-123 \\
  --endpoint-url http://127.0.0.1:4566

# Stop an instance
aws ec2 stop-instances \\
  --instance-ids i-123 \\
  --endpoint-url http://127.0.0.1:4566

# Describe key pairs
aws ec2 describe-key-pairs --endpoint-url http://127.0.0.1:4566

# Create key pair
aws ec2 create-key-pair \\
  --key-name my-key \\
  --endpoint-url http://127.0.0.1:4566

# Describe security groups
aws ec2 describe-security-groups --endpoint-url http://127.0.0.1:4566

# Create security group
aws ec2 create-security-group \\
  --group-name web-sg \\
  --description "Web server SG" \\
  --vpc-id vpc-123 \\
  --endpoint-url http://127.0.0.1:4566

# Authorize security group ingress
aws ec2 authorize-security-group-ingress \\
  --group-id sg-123 \\
  --protocol tcp \\
  --port 80 \\
  --cidr 0.0.0.0/0 \\
  --endpoint-url http://127.0.0.1:4566

# VPC examples
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --endpoint-url http://127.0.0.1:4566
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --endpoint-url http://127.0.0.1:4566
aws ec2 create-route-table --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566
aws ec2 create-internet-gateway --endpoint-url http://127.0.0.1:4566
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxxxx --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566
aws ec2 create-nat-gateway --subnet-id subnet-xxxxx --allocation-id eipalloc-xxxxx --endpoint-url http://127.0.0.1:4566
aws ec2 create-network-acl --vpc-id vpc-xxxxx --endpoint-url http://127.0.0.1:4566
aws ec2 create-flow-logs --resource-id vpc-xxxxx --resource-type VPC --traffic-type ALL --log-destination-type cloud-watch-logs --log-group-name my-flow-logs --endpoint-url http://127.0.0.1:4566
aws ec2 allocate-address --domain vpc --endpoint-url http://127.0.0.1:4566`,
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { EC2Client, DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand, StartInstancesCommand, StopInstancesCommand, CreateKeyPairCommand, DescribeSecurityGroupsCommand, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
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
    endpoint_url='http://127.0.0.1:4566',
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
    o.BaseEndpoint = "http://127.0.0.1:4566"
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
    vpcs,
    subnets,
    routeTables,
    internetGateways,
    natGateways,
    networkAcls,
    flowLogs,
    elasticIps,
    loading,
    expandedInstances,
    expandedKeyPairs,
    expandedSecurityGroups,
    expandedVpcs,
    expandedSubnets,
    expandedRouteTables,
    expandedInternetGateways,
    expandedNatGateways,
    expandedNetworkAcls,
    expandedFlowLogs,
    expandedElasticIps,
    showCreateModal,
    creating,
    showDeleteConfirm,
    itemToDelete,
    deleteType,
    showKeyPairModal,
    showSecurityGroupModal,
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
    newKeyMaterial,
    vpcCreating,
    subnetCreating,
    routeTableCreating,
    igwCreating,
    natGatewayCreating,
    naclCreating,
    flowLogCreating,
    createForm,
    loadAll,
    loadInstances,
    loadKeyPairs,
    loadSecurityGroups,
    loadVpcs,
    loadSubnets,
    loadRouteTables,
    loadInternetGateways,
    loadNatGateways,
    loadNetworkAcls,
    loadFlowLogs,
    loadElasticIps,
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
    toggleInstances,
    toggleKeyPairs,
    toggleSecurityGroups,
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
    resetForm,
    codeExamples,
    openRouteTableDetail,
    openNaclRuleDetail,
  }
}
