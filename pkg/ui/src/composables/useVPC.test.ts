import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVPC } from './useVPC'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    emulator: '',
  })),
}))

vi.mock('@/api/services/vpc', () => ({
  describeVpcs: vi.fn(),
  createVpc: vi.fn(),
  deleteVpc: vi.fn(),
  describeSubnets: vi.fn(),
  createSubnet: vi.fn(),
  deleteSubnet: vi.fn(),
  describeRouteTables: vi.fn(),
  createRouteTable: vi.fn(),
  deleteRouteTable: vi.fn(),
  createRoute: vi.fn(),
  deleteRoute: vi.fn(),
  associateRouteTable: vi.fn(),
  disassociateRouteTable: vi.fn(),
  describeInternetGateways: vi.fn(),
  createInternetGateway: vi.fn(),
  deleteInternetGateway: vi.fn(),
  attachInternetGateway: vi.fn(),
  detachInternetGateway: vi.fn(),
  describeNatGateways: vi.fn(),
  createNatGateway: vi.fn(),
  deleteNatGateway: vi.fn(),
  describeNetworkAcls: vi.fn(),
  createNetworkAcl: vi.fn(),
  deleteNetworkAcl: vi.fn(),
  createNetworkAclEntry: vi.fn(),
  deleteNetworkAclEntry: vi.fn(),
  describeFlowLogs: vi.fn(),
  createFlowLogs: vi.fn(),
  deleteFlowLogs: vi.fn(),
  describeAddresses: vi.fn(),
  allocateElasticIp: vi.fn(),
  releaseElasticIp: vi.fn(),
}))

import * as vpcApi from '@/api/services/vpc'

describe('useVPC', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        vpcs, subnets, routeTables, internetGateways, natGateways, networkAcls, flowLogs, elasticIps,
        loading, expandedVpcs, expandedSubnets, expandedRouteTables, expandedInternetGateways,
        expandedNatGateways, expandedNetworkAcls, expandedFlowLogs, expandedElasticIps,
        showVpcModal, showSubnetModal, showRouteTableModal, showIgwModal,
        showNatGatewayModal, showNaclModal, showFlowLogModal, showDeleteConfirm,
      } = useVPC()

      expect(vpcs.value).toEqual([])
      expect(subnets.value).toEqual([])
      expect(routeTables.value).toEqual([])
      expect(internetGateways.value).toEqual([])
      expect(natGateways.value).toEqual([])
      expect(networkAcls.value).toEqual([])
      expect(flowLogs.value).toEqual([])
      expect(elasticIps.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(expandedVpcs.value).toEqual(new Set())
      expect(expandedSubnets.value).toEqual(new Set())
      expect(expandedRouteTables.value).toEqual(new Set())
      expect(expandedInternetGateways.value).toEqual(new Set())
      expect(expandedNatGateways.value).toEqual(new Set())
      expect(expandedNetworkAcls.value).toEqual(new Set())
      expect(expandedFlowLogs.value).toEqual(new Set())
      expect(expandedElasticIps.value).toEqual(new Set())
      expect(showVpcModal.value).toBe(false)
      expect(showSubnetModal.value).toBe(false)
      expect(showRouteTableModal.value).toBe(false)
      expect(showIgwModal.value).toBe(false)
      expect(showNatGatewayModal.value).toBe(false)
      expect(showNaclModal.value).toBe(false)
      expect(showFlowLogModal.value).toBe(false)
      expect(showDeleteConfirm.value).toBe(false)
    })
  })

  describe('loadAll', () => {
    it('loads all resources in parallel', async () => {
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: [] })
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: [] })
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      vi.mocked(vpcApi.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      vi.mocked(vpcApi.describeNatGateways).mockResolvedValue({ NatGateways: [] })
      vi.mocked(vpcApi.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      vi.mocked(vpcApi.describeFlowLogs).mockResolvedValue({ FlowLogs: [] })
      vi.mocked(vpcApi.describeAddresses).mockResolvedValue({ Addresses: [] })

      const { loadAll } = useVPC()
      await loadAll()

      expect(vpcApi.describeVpcs).toHaveBeenCalled()
      expect(vpcApi.describeSubnets).toHaveBeenCalled()
      expect(vpcApi.describeRouteTables).toHaveBeenCalled()
      expect(vpcApi.describeInternetGateways).toHaveBeenCalled()
      expect(vpcApi.describeNatGateways).toHaveBeenCalled()
      expect(vpcApi.describeNetworkAcls).toHaveBeenCalled()
      expect(vpcApi.describeFlowLogs).toHaveBeenCalled()
      expect(vpcApi.describeAddresses).toHaveBeenCalled()
    })
  })

  describe('VPC CRUD', () => {
    it('handleCreateVpc calls API and reloads', async () => {
      vi.mocked(vpcApi.createVpc).mockResolvedValue({ VpcId: 'vpc-new', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' })
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: [] })
      const { handleCreateVpc, showVpcModal } = useVPC()
      showVpcModal.value = true
      await handleCreateVpc({ CidrBlock: '10.0.0.0/16' })
      expect(vpcApi.createVpc).toHaveBeenCalledWith({ CidrBlock: '10.0.0.0/16' })
      expect(showVpcModal.value).toBe(false)
    })

    it('handleDeleteVpc removes from list', async () => {
      vi.mocked(vpcApi.deleteVpc).mockResolvedValue({})
      const { handleDeleteVpc, itemToDelete, vpcs } = useVPC()
      vpcs.value = [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }]
      itemToDelete.value = { VpcId: 'vpc-1' }
      await handleDeleteVpc()
      expect(vpcApi.deleteVpc).toHaveBeenCalledWith('vpc-1')
      expect(vpcs.value).toHaveLength(0)
    })
  })

  describe('load functions', () => {
    it('loadRouteTables loads successfully', async () => {
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }] })
      const { loadRouteTables, routeTables } = useVPC()
      await loadRouteTables()
      expect(routeTables.value).toHaveLength(1)
    })

    it('loadNatGateways loads successfully', async () => {
      vi.mocked(vpcApi.describeNatGateways).mockResolvedValue({ NatGateways: [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }] })
      const { loadNatGateways, natGateways } = useVPC()
      await loadNatGateways()
      expect(natGateways.value).toHaveLength(1)
    })

    it('loadNetworkAcls loads successfully', async () => {
      vi.mocked(vpcApi.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }] })
      const { loadNetworkAcls, networkAcls } = useVPC()
      await loadNetworkAcls()
      expect(networkAcls.value).toHaveLength(1)
    })

    it('loadFlowLogs loads successfully', async () => {
      vi.mocked(vpcApi.describeFlowLogs).mockResolvedValue({ FlowLogs: [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:logs', TrafficType: 'ALL' }] })
      const { loadFlowLogs, flowLogs } = useVPC()
      await loadFlowLogs()
      expect(flowLogs.value).toHaveLength(1)
    })

    it('loadElasticIps loads successfully', async () => {
      vi.mocked(vpcApi.describeAddresses).mockResolvedValue({ Addresses: [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }] })
      const { loadElasticIps, elasticIps } = useVPC()
      await loadElasticIps()
      expect(elasticIps.value).toHaveLength(1)
    })

    it('loadInternetGateways loads successfully', async () => {
      vi.mocked(vpcApi.describeInternetGateways).mockResolvedValue({ InternetGateways: [{ InternetGatewayId: 'igw-1' }] })
      const { loadInternetGateways, internetGateways } = useVPC()
      await loadInternetGateways()
      expect(internetGateways.value).toHaveLength(1)
    })
  })

  describe('subnet CRUD', () => {
    it('handleCreateSubnet calls API and reloads', async () => {
      vi.mocked(vpcApi.createSubnet).mockResolvedValue({ SubnetId: 'sn-new', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' })
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: [] })
      const { handleCreateSubnet, showSubnetModal } = useVPC()
      showSubnetModal.value = true
      await handleCreateSubnet({ VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24' })
      expect(vpcApi.createSubnet).toHaveBeenCalled()
      expect(showSubnetModal.value).toBe(false)
    })

    it('handleDeleteSubnet removes from list', async () => {
      vi.mocked(vpcApi.deleteSubnet).mockResolvedValue({})
      const { handleDeleteSubnet, itemToDelete, subnets } = useVPC()
      subnets.value = [{ SubnetId: 'sn-1', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }]
      itemToDelete.value = { SubnetId: 'sn-1' }
      await handleDeleteSubnet()
      expect(vpcApi.deleteSubnet).toHaveBeenCalledWith('sn-1')
      expect(subnets.value).toHaveLength(0)
    })
  })

  describe('route table CRUD', () => {
    it('handleCreateRouteTable calls API', async () => {
      vi.mocked(vpcApi.createRouteTable).mockResolvedValue({ RouteTableId: 'rtb-new', VpcId: 'vpc-1' })
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleCreateRouteTable, showRouteTableModal } = useVPC()
      showRouteTableModal.value = true
      await handleCreateRouteTable({ VpcId: 'vpc-1' })
      expect(vpcApi.createRouteTable).toHaveBeenCalled()
      expect(showRouteTableModal.value).toBe(false)
    })

    it('handleDeleteRouteTable removes from list', async () => {
      vi.mocked(vpcApi.deleteRouteTable).mockResolvedValue({})
      const { handleDeleteRouteTable, itemToDelete, routeTables } = useVPC()
      routeTables.value = [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }]
      itemToDelete.value = { RouteTableId: 'rtb-1' }
      await handleDeleteRouteTable()
      expect(vpcApi.deleteRouteTable).toHaveBeenCalledWith('rtb-1')
      expect(routeTables.value).toHaveLength(0)
    })

    it('handleCreateRoute calls API', async () => {
      vi.mocked(vpcApi.createRoute).mockResolvedValue({})
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleCreateRoute } = useVPC()
      await handleCreateRoute('rtb-1', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-1' })
      expect(vpcApi.createRoute).toHaveBeenCalledWith('rtb-1', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-1' })
    })

    it('handleDeleteRoute calls API', async () => {
      vi.mocked(vpcApi.deleteRoute).mockResolvedValue({})
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleDeleteRoute } = useVPC()
      await handleDeleteRoute('rtb-1', '0.0.0.0/0')
      expect(vpcApi.deleteRoute).toHaveBeenCalledWith('rtb-1', '0.0.0.0/0')
    })

    it('handleAssociateRouteTable calls API', async () => {
      vi.mocked(vpcApi.associateRouteTable).mockResolvedValue({})
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleAssociateRouteTable } = useVPC()
      await handleAssociateRouteTable('rtb-1', 'sn-1')
      expect(vpcApi.associateRouteTable).toHaveBeenCalledWith('rtb-1', 'sn-1')
    })

    it('handleDisassociateRouteTable calls API', async () => {
      vi.mocked(vpcApi.disassociateRouteTable).mockResolvedValue({})
      vi.mocked(vpcApi.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleDisassociateRouteTable } = useVPC()
      await handleDisassociateRouteTable('assoc-1')
      expect(vpcApi.disassociateRouteTable).toHaveBeenCalledWith('assoc-1')
    })
  })

  describe('IGW CRUD', () => {
    it('handleCreateIgw calls API and attach', async () => {
      vi.mocked(vpcApi.createInternetGateway).mockResolvedValue({ InternetGatewayId: 'igw-new' })
      vi.mocked(vpcApi.attachInternetGateway).mockResolvedValue({})
      vi.mocked(vpcApi.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      const { handleCreateIgw, showIgwModal } = useVPC()
      showIgwModal.value = true
      await handleCreateIgw('vpc-1')
      expect(vpcApi.createInternetGateway).toHaveBeenCalled()
      expect(vpcApi.attachInternetGateway).toHaveBeenCalledWith('igw-new', 'vpc-1')
      expect(showIgwModal.value).toBe(false)
    })

    it('handleCreateIgw without vpcId skips attach', async () => {
      vi.mocked(vpcApi.createInternetGateway).mockResolvedValue({ InternetGatewayId: 'igw-new' })
      vi.mocked(vpcApi.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      const { handleCreateIgw } = useVPC()
      await handleCreateIgw()
      expect(vpcApi.attachInternetGateway).not.toHaveBeenCalled()
    })

    it('handleDeleteIgw removes from list', async () => {
      vi.mocked(vpcApi.deleteInternetGateway).mockResolvedValue({})
      const { handleDeleteIgw, itemToDelete, internetGateways } = useVPC()
      internetGateways.value = [{ InternetGatewayId: 'igw-1' }]
      itemToDelete.value = { InternetGatewayId: 'igw-1' }
      await handleDeleteIgw()
      expect(vpcApi.deleteInternetGateway).toHaveBeenCalledWith('igw-1')
      expect(internetGateways.value).toHaveLength(0)
    })
  })

  describe('NAT gateway CRUD', () => {
    it('handleCreateNatGateway calls API', async () => {
      vi.mocked(vpcApi.createNatGateway).mockResolvedValue({ NatGatewayId: 'nat-new', State: 'pending', SubnetId: 'sn-1' })
      vi.mocked(vpcApi.describeNatGateways).mockResolvedValue({ NatGateways: [] })
      const { handleCreateNatGateway, showNatGatewayModal } = useVPC()
      showNatGatewayModal.value = true
      await handleCreateNatGateway({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(vpcApi.createNatGateway).toHaveBeenCalledWith({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(showNatGatewayModal.value).toBe(false)
    })

    it('handleDeleteNatGateway removes from list', async () => {
      vi.mocked(vpcApi.deleteNatGateway).mockResolvedValue({})
      const { handleDeleteNatGateway, itemToDelete, natGateways } = useVPC()
      natGateways.value = [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }]
      itemToDelete.value = { NatGatewayId: 'nat-1' }
      await handleDeleteNatGateway()
      expect(vpcApi.deleteNatGateway).toHaveBeenCalledWith('nat-1')
      expect(natGateways.value).toHaveLength(0)
    })
  })

  describe('NACL CRUD', () => {
    it('handleCreateNacl calls API', async () => {
      vi.mocked(vpcApi.createNetworkAcl).mockResolvedValue({ NetworkAclId: 'acl-new', VpcId: 'vpc-1', IsDefault: false })
      vi.mocked(vpcApi.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleCreateNacl, showNaclModal } = useVPC()
      showNaclModal.value = true
      await handleCreateNacl({ VpcId: 'vpc-1' })
      expect(vpcApi.createNetworkAcl).toHaveBeenCalled()
      expect(showNaclModal.value).toBe(false)
    })

    it('handleDeleteNacl removes from list', async () => {
      vi.mocked(vpcApi.deleteNetworkAcl).mockResolvedValue({})
      const { handleDeleteNacl, itemToDelete, networkAcls } = useVPC()
      networkAcls.value = [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }]
      itemToDelete.value = { NetworkAclId: 'acl-1' }
      await handleDeleteNacl()
      expect(vpcApi.deleteNetworkAcl).toHaveBeenCalledWith('acl-1')
      expect(networkAcls.value).toHaveLength(0)
    })

    it('handleCreateNaclRule calls API', async () => {
      vi.mocked(vpcApi.createNetworkAclEntry).mockResolvedValue({})
      vi.mocked(vpcApi.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleCreateNaclRule } = useVPC()
      await handleCreateNaclRule('acl-1', { RuleNumber: 100, Protocol: 'tcp', CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow', PortRange: { From: 80, To: 80 } })
      expect(vpcApi.createNetworkAclEntry).toHaveBeenCalledWith('acl-1', expect.any(Object))
    })

    it('handleDeleteNaclRule calls API', async () => {
      vi.mocked(vpcApi.deleteNetworkAclEntry).mockResolvedValue({})
      vi.mocked(vpcApi.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleDeleteNaclRule } = useVPC()
      await handleDeleteNaclRule('acl-1', 100)
      expect(vpcApi.deleteNetworkAclEntry).toHaveBeenCalledWith('acl-1', 100)
    })
  })

  describe('flow log CRUD', () => {
    it('handleCreateFlowLog calls API', async () => {
      vi.mocked(vpcApi.createFlowLogs).mockResolvedValue({ FlowLogId: 'fl-new', ResourceId: 'vpc-1', LogDestination: 'arn:logs', TrafficType: 'ALL' })
      vi.mocked(vpcApi.describeFlowLogs).mockResolvedValue({ FlowLogs: [] })
      const { handleCreateFlowLog, showFlowLogModal } = useVPC()
      showFlowLogModal.value = true
      await handleCreateFlowLog({ ResourceId: 'vpc-1', LogDestinationType: 'cloud-watch-logs', LogDestination: 'arn:logs', TrafficType: 'ALL' })
      expect(vpcApi.createFlowLogs).toHaveBeenCalled()
      expect(showFlowLogModal.value).toBe(false)
    })

    it('handleDeleteFlowLog removes from list', async () => {
      vi.mocked(vpcApi.deleteFlowLogs).mockResolvedValue({})
      const { handleDeleteFlowLog, itemToDelete, flowLogs } = useVPC()
      flowLogs.value = [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:logs', TrafficType: 'ALL' }]
      itemToDelete.value = { FlowLogId: 'fl-1' }
      await handleDeleteFlowLog()
      expect(vpcApi.deleteFlowLogs).toHaveBeenCalledWith('fl-1')
      expect(flowLogs.value).toHaveLength(0)
    })
  })

  describe('elastic IP CRUD', () => {
    it('handleAllocateElasticIp calls API', async () => {
      vi.mocked(vpcApi.allocateElasticIp).mockResolvedValue({ AllocationId: 'eip-new', PublicIp: '1.2.3.5', Domain: 'vpc' })
      vi.mocked(vpcApi.describeAddresses).mockResolvedValue({ Addresses: [] })
      const { handleAllocateElasticIp } = useVPC()
      const result = await handleAllocateElasticIp()
      expect(vpcApi.allocateElasticIp).toHaveBeenCalled()
      expect(result.PublicIp).toBe('1.2.3.5')
    })

    it('handleReleaseElasticIp returns early if no item', async () => {
      const { handleReleaseElasticIp } = useVPC()
      await handleReleaseElasticIp()
      expect(vpcApi.releaseElasticIp).not.toHaveBeenCalled()
    })

    it('handleReleaseElasticIp removes from list', async () => {
      vi.mocked(vpcApi.releaseElasticIp).mockResolvedValue({})
      const { handleReleaseElasticIp, itemToDelete, elasticIps } = useVPC()
      elasticIps.value = [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }]
      itemToDelete.value = { AllocationId: 'eip-1' }
      await handleReleaseElasticIp()
      expect(vpcApi.releaseElasticIp).toHaveBeenCalledWith('eip-1')
      expect(elasticIps.value).toHaveLength(0)
    })
  })

  describe('toggle functions', () => {
    it('toggleVpcs adds and removes', () => {
      const { toggleVpcs, expandedVpcs } = useVPC()
      toggleVpcs('vpc-1')
      expect(expandedVpcs.value.has('vpc-1')).toBe(true)
      toggleVpcs('vpc-1')
      expect(expandedVpcs.value.has('vpc-1')).toBe(false)
    })

    it('toggleSubnets adds and removes', () => {
      const { toggleSubnets, expandedSubnets } = useVPC()
      toggleSubnets('sn-1')
      expect(expandedSubnets.value.has('sn-1')).toBe(true)
      toggleSubnets('sn-1')
      expect(expandedSubnets.value.has('sn-1')).toBe(false)
    })

    it('toggleRouteTables adds and removes', () => {
      const { toggleRouteTables, expandedRouteTables } = useVPC()
      toggleRouteTables('rtb-1')
      expect(expandedRouteTables.value.has('rtb-1')).toBe(true)
      toggleRouteTables('rtb-1')
      expect(expandedRouteTables.value.has('rtb-1')).toBe(false)
    })

    it('toggleInternetGateways adds and removes', () => {
      const { toggleInternetGateways, expandedInternetGateways } = useVPC()
      toggleInternetGateways('igw-1')
      expect(expandedInternetGateways.value.has('igw-1')).toBe(true)
      toggleInternetGateways('igw-1')
      expect(expandedInternetGateways.value.has('igw-1')).toBe(false)
    })

    it('toggleNatGateways adds and removes', () => {
      const { toggleNatGateways, expandedNatGateways } = useVPC()
      toggleNatGateways('nat-1')
      expect(expandedNatGateways.value.has('nat-1')).toBe(true)
      toggleNatGateways('nat-1')
      expect(expandedNatGateways.value.has('nat-1')).toBe(false)
    })

    it('toggleNetworkAcls adds and removes', () => {
      const { toggleNetworkAcls, expandedNetworkAcls } = useVPC()
      toggleNetworkAcls('acl-1')
      expect(expandedNetworkAcls.value.has('acl-1')).toBe(true)
      toggleNetworkAcls('acl-1')
      expect(expandedNetworkAcls.value.has('acl-1')).toBe(false)
    })

    it('toggleFlowLogs adds and removes', () => {
      const { toggleFlowLogs, expandedFlowLogs } = useVPC()
      toggleFlowLogs('fl-1')
      expect(expandedFlowLogs.value.has('fl-1')).toBe(true)
      toggleFlowLogs('fl-1')
      expect(expandedFlowLogs.value.has('fl-1')).toBe(false)
    })

    it('toggleElasticIps adds and removes', () => {
      const { toggleElasticIps, expandedElasticIps } = useVPC()
      toggleElasticIps('eip-1')
      expect(expandedElasticIps.value.has('eip-1')).toBe(true)
      toggleElasticIps('eip-1')
      expect(expandedElasticIps.value.has('eip-1')).toBe(false)
    })
  })

  describe('detail helpers', () => {
    it('openRouteTableDetail sets selected and opens modal', () => {
      const { openRouteTableDetail, selectedRouteTable, showRouteTableDetailModal } = useVPC()
      const rt = { RouteTableId: 'rtb-1', VpcId: 'vpc-1' }
      openRouteTableDetail(rt)
      expect(selectedRouteTable.value).toEqual(rt)
      expect(showRouteTableDetailModal.value).toBe(true)
    })

    it('openNaclRuleDetail sets selected and opens modal', () => {
      const { openNaclRuleDetail, selectedNacl, showNaclRuleModal } = useVPC()
      const nacl = { NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }
      openNaclRuleDetail(nacl)
      expect(selectedNacl.value).toEqual(nacl)
      expect(showNaclRuleModal.value).toBe(true)
    })
  })

  describe('confirmDelete', () => {
    it('sets item and type and opens modal', () => {
      const { confirmDelete, itemToDelete, deleteType, showDeleteConfirm } = useVPC()
      const item = { VpcId: 'vpc-1' }
      confirmDelete(item, 'vpc')
      expect(itemToDelete.value).toEqual(item)
      expect(deleteType.value).toBe('vpc')
      expect(showDeleteConfirm.value).toBe(true)
    })
  })

  describe('getStatus', () => {
    it('maps status values correctly', () => {
      const { getStatus } = useVPC()
      expect(getStatus('available')).toBe('active')
      expect(getStatus('pending')).toBe('pending')
      expect(getStatus('deleting')).toBe('pending')
      expect(getStatus('deleted')).toBe('inactive')
      expect(getStatus('unknown')).toBe('inactive')
    })
  })

  describe('codeExamples', () => {
    it('generates 4 code examples', () => {
      const { codeExamples } = useVPC()
      expect(codeExamples.value).toHaveLength(4)
      expect(codeExamples.value[0].language).toBe('aws-cli')
      expect(codeExamples.value[1].language).toBe('javascript')
      expect(codeExamples.value[2].language).toBe('python')
      expect(codeExamples.value[3].language).toBe('go')
    })
  })
})
