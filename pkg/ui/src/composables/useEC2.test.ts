import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEC2 } from './useEC2'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    emulator: '',
  })),
}))

vi.mock('@/api/services/ec2', () => ({
  describeInstances: vi.fn(),
  runInstances: vi.fn(),
  terminateInstance: vi.fn(),
  startInstance: vi.fn(),
  stopInstance: vi.fn(),
  describeKeyPairs: vi.fn(),
  createKeyPair: vi.fn(),
  importKeyPair: vi.fn(),
  deleteKeyPair: vi.fn(),
  describeSecurityGroups: vi.fn(),
  createSecurityGroup: vi.fn(),
  deleteSecurityGroup: vi.fn(),
  authorizeSecurityGroupIngress: vi.fn(),
  describeVpcs: vi.fn(),
  describeSubnets: vi.fn(),
  createVpc: vi.fn(),
  deleteVpc: vi.fn(),
  createSubnet: vi.fn(),
  deleteSubnet: vi.fn(),
  createRouteTable: vi.fn(),
  deleteRouteTable: vi.fn(),
  describeRouteTables: vi.fn(),
  createRoute: vi.fn(),
  deleteRoute: vi.fn(),
  associateRouteTable: vi.fn(),
  disassociateRouteTable: vi.fn(),
  createInternetGateway: vi.fn(),
  deleteInternetGateway: vi.fn(),
  describeInternetGateways: vi.fn(),
  attachInternetGateway: vi.fn(),
  detachInternetGateway: vi.fn(),
  createNatGateway: vi.fn(),
  deleteNatGateway: vi.fn(),
  describeNatGateways: vi.fn(),
  createNetworkAcl: vi.fn(),
  deleteNetworkAcl: vi.fn(),
  describeNetworkAcls: vi.fn(),
  createNetworkAclEntry: vi.fn(),
  deleteNetworkAclEntry: vi.fn(),
  createFlowLogs: vi.fn(),
  deleteFlowLogs: vi.fn(),
  describeFlowLogs: vi.fn(),
  allocateElasticIp: vi.fn(),
  releaseElasticIp: vi.fn(),
  describeAddresses: vi.fn(),
}))

import * as ec2Api from '@/api/services/ec2'

describe('useEC2', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        instances, keyPairs, securityGroups, vpcs, subnets,
        routeTables, internetGateways, natGateways, networkAcls, flowLogs, elasticIps,
        loading, expandedInstances, expandedKeyPairs, expandedSecurityGroups,
        expandedRouteTables, expandedInternetGateways, expandedNatGateways, expandedNetworkAcls, expandedFlowLogs,
        showCreateModal, showDeleteConfirm, showKeyPairModal, showSecurityGroupModal,
        showVpcModal, showSubnetModal, showRouteTableModal, showIgwModal,
        showNatGatewayModal, showNaclModal, showFlowLogModal,
      } = useEC2()

      expect(instances.value).toEqual([])
      expect(keyPairs.value).toEqual([])
      expect(securityGroups.value).toEqual([])
      expect(vpcs.value).toEqual([])
      expect(subnets.value).toEqual([])
      expect(routeTables.value).toEqual([])
      expect(internetGateways.value).toEqual([])
      expect(natGateways.value).toEqual([])
      expect(networkAcls.value).toEqual([])
      expect(flowLogs.value).toEqual([])
      expect(elasticIps.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(expandedInstances.value).toEqual(new Set())
      expect(expandedKeyPairs.value).toEqual(new Set())
      expect(expandedSecurityGroups.value).toEqual(new Set())
      expect(expandedRouteTables.value).toEqual(new Set())
      expect(expandedInternetGateways.value).toEqual(new Set())
      expect(expandedNatGateways.value).toEqual(new Set())
      expect(expandedNetworkAcls.value).toEqual(new Set())
      expect(expandedFlowLogs.value).toEqual(new Set())
      expect(showCreateModal.value).toBe(false)
      expect(showDeleteConfirm.value).toBe(false)
      expect(showKeyPairModal.value).toBe(false)
      expect(showSecurityGroupModal.value).toBe(false)
      expect(showVpcModal.value).toBe(false)
      expect(showSubnetModal.value).toBe(false)
      expect(showRouteTableModal.value).toBe(false)
      expect(showIgwModal.value).toBe(false)
      expect(showNatGatewayModal.value).toBe(false)
      expect(showNaclModal.value).toBe(false)
      expect(showFlowLogModal.value).toBe(false)
    })
  })

  describe('loadAll', () => {
    it('loads all resources in parallel', async () => {
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [] })
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })
      vi.mocked(ec2Api.describeVpcs).mockResolvedValue({ Vpcs: [] })
      vi.mocked(ec2Api.describeSubnets).mockResolvedValue({ Subnets: [] })
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      vi.mocked(ec2Api.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      vi.mocked(ec2Api.describeNatGateways).mockResolvedValue({ NatGateways: [] })
      vi.mocked(ec2Api.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      vi.mocked(ec2Api.describeFlowLogs).mockResolvedValue({ FlowLogs: [] })
      vi.mocked(ec2Api.describeAddresses).mockResolvedValue({ Addresses: [] })

      const { loadAll } = useEC2()
      await loadAll()

      expect(ec2Api.describeInstances).toHaveBeenCalled()
      expect(ec2Api.describeKeyPairs).toHaveBeenCalled()
      expect(ec2Api.describeSecurityGroups).toHaveBeenCalled()
      expect(ec2Api.describeVpcs).toHaveBeenCalled()
      expect(ec2Api.describeSubnets).toHaveBeenCalled()
      expect(ec2Api.describeRouteTables).toHaveBeenCalled()
      expect(ec2Api.describeInternetGateways).toHaveBeenCalled()
      expect(ec2Api.describeNatGateways).toHaveBeenCalled()
      expect(ec2Api.describeNetworkAcls).toHaveBeenCalled()
      expect(ec2Api.describeFlowLogs).toHaveBeenCalled()
      expect(ec2Api.describeAddresses).toHaveBeenCalled()
    })
  })

  describe('instances', () => {
    it('loadInstances collects instances from reservations', async () => {
      const mockInstances = [
        { InstanceId: 'i-1', InstanceType: 't2.micro', ImageId: 'ami-abc' },
        { InstanceId: 'i-2', InstanceType: 't2.small', ImageId: 'ami-def' },
      ]
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({
        Reservations: [
          { Instances: [mockInstances[0]] },
          { Instances: [mockInstances[1]] },
        ],
      })

      const { loadInstances, instances, loading } = useEC2()
      expect(loading.value).toBe(false)
      await loadInstances()
      expect(instances.value).toHaveLength(2)
      expect(instances.value[0].InstanceId).toBe('i-1')
      expect(loading.value).toBe(false)
    })

    it('loadInstances handles error', async () => {
      vi.mocked(ec2Api.describeInstances).mockRejectedValue(new Error('API error'))
      const { loadInstances, instances } = useEC2()
      await loadInstances()
      expect(instances.value).toEqual([])
    })

    it('runInstance validates required ImageId', async () => {
      const { runInstance, creating, createForm } = useEC2()
      createForm.value.ImageId = ''
      await runInstance()
      expect(creating.value).toBe(false)
      expect(ec2Api.runInstances).not.toHaveBeenCalled()
    })

    it('runInstance calls API and reloads on success', async () => {
      vi.mocked(ec2Api.runInstances).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })

      const { runInstance, createForm, creating } = useEC2()
      createForm.value.ImageId = 'ami-abc'
      await runInstance()
      expect(ec2Api.runInstances).toHaveBeenCalled()
      expect(ec2Api.describeInstances).toHaveBeenCalled()
      expect(creating.value).toBe(false)
    })

    it('terminateInstance removes from list', async () => {
      vi.mocked(ec2Api.terminateInstance).mockResolvedValue({ Instances: [] })
      const { terminateInstance, itemToDelete, instances, expandedInstances } = useEC2()
      instances.value = [{ InstanceId: 'i-1', ImageId: 'ami-abc', InstanceType: 't2.micro' }]
      expandedInstances.value.add('i-1')
      itemToDelete.value = { InstanceId: 'i-1' }
      await terminateInstance()
      expect(ec2Api.terminateInstance).toHaveBeenCalledWith('i-1')
      expect(instances.value).toHaveLength(0)
      expect(expandedInstances.value.has('i-1')).toBe(false)
    })

    it('terminateInstance returns early if no item', async () => {
      const { terminateInstance } = useEC2()
      await terminateInstance()
      expect(ec2Api.terminateInstance).not.toHaveBeenCalled()
    })

    it('startInstance calls API', async () => {
      vi.mocked(ec2Api.startInstance).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      const { startInstance } = useEC2()
      await startInstance('i-1')
      expect(ec2Api.startInstance).toHaveBeenCalledWith('i-1')
    })

    it('stopInstance calls API', async () => {
      vi.mocked(ec2Api.stopInstance).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      const { stopInstance } = useEC2()
      await stopInstance('i-1')
      expect(ec2Api.stopInstance).toHaveBeenCalledWith('i-1')
    })
  })

  describe('key pairs', () => {
    it('createKeyPair calls API and reloads', async () => {
      vi.mocked(ec2Api.createKeyPair).mockResolvedValue({
        KeyName: 'my-key', KeyFingerprint: 'ab:cd', KeyMaterial: 'ssh-rsa ...',
      })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [{ KeyName: 'my-key', KeyFingerprint: 'ab:cd' }] })
      const { createKeyPair } = useEC2()
      const result = await createKeyPair('my-key')
      expect(ec2Api.createKeyPair).toHaveBeenCalledWith('my-key')
      expect(result.KeyName).toBe('my-key')
    })

    it('importKeyPair calls API and reloads', async () => {
      vi.mocked(ec2Api.importKeyPair).mockResolvedValue({ KeyName: 'imported', KeyFingerprint: 'ef:gh' })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [] })
      const { importKeyPair } = useEC2()
      await importKeyPair('imported', 'ssh-rsa AAA...')
      expect(ec2Api.importKeyPair).toHaveBeenCalledWith('imported', 'ssh-rsa AAA...')
    })

    it('deleteKeyPair removes from list', async () => {
      vi.mocked(ec2Api.deleteKeyPair).mockResolvedValue()
      const { deleteKeyPair, itemToDelete, keyPairs } = useEC2()
      keyPairs.value = [{ KeyName: 'my-key', KeyFingerprint: 'ab:cd' }]
      itemToDelete.value = { KeyName: 'my-key' }
      await deleteKeyPair()
      expect(ec2Api.deleteKeyPair).toHaveBeenCalledWith('my-key')
      expect(keyPairs.value).toHaveLength(0)
    })
  })

  describe('security groups', () => {
    it('createSecurityGroup with ingress rules', async () => {
      vi.mocked(ec2Api.createSecurityGroup).mockResolvedValue({ GroupId: 'sg-new' })
      vi.mocked(ec2Api.authorizeSecurityGroupIngress).mockResolvedValue()
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })

      const { createSecurityGroup } = useEC2()
      await createSecurityGroup({
        GroupName: 'web',
        Description: 'Web SG',
        IngressRules: [{ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }],
      })
      expect(ec2Api.createSecurityGroup).toHaveBeenCalledWith({
        GroupName: 'web', Description: 'Web SG', VpcId: undefined,
      })
      expect(ec2Api.authorizeSecurityGroupIngress).toHaveBeenCalled()
    })

    it('deleteSecurityGroup removes from list', async () => {
      vi.mocked(ec2Api.deleteSecurityGroup).mockResolvedValue()
      const { deleteSecurityGroup, itemToDelete, securityGroups } = useEC2()
      securityGroups.value = [{ GroupId: 'sg-1', GroupName: 'default', Description: 'default', VpcId: 'vpc-1' }]
      itemToDelete.value = { GroupId: 'sg-1' }
      await deleteSecurityGroup()
      expect(ec2Api.deleteSecurityGroup).toHaveBeenCalledWith('sg-1')
      expect(securityGroups.value).toHaveLength(0)
    })

    it('authorizeIngress calls API', async () => {
      vi.mocked(ec2Api.authorizeSecurityGroupIngress).mockResolvedValue()
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })
      const { authorizeIngress } = useEC2()
      await authorizeIngress('sg-1', { IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
      expect(ec2Api.authorizeSecurityGroupIngress).toHaveBeenCalled()
    })
  })

  describe('toggle functions', () => {
    it('toggleInstances adds and removes', () => {
      const { toggleInstances, expandedInstances } = useEC2()
      toggleInstances('i-1')
      expect(expandedInstances.value.has('i-1')).toBe(true)
      toggleInstances('i-1')
      expect(expandedInstances.value.has('i-1')).toBe(false)
    })

    it('toggleKeyPairs adds and removes', () => {
      const { toggleKeyPairs, expandedKeyPairs } = useEC2()
      toggleKeyPairs('my-key')
      expect(expandedKeyPairs.value.has('my-key')).toBe(true)
      toggleKeyPairs('my-key')
      expect(expandedKeyPairs.value.has('my-key')).toBe(false)
    })

    it('toggleSecurityGroups adds and removes', () => {
      const { toggleSecurityGroups, expandedSecurityGroups } = useEC2()
      toggleSecurityGroups('sg-1')
      expect(expandedSecurityGroups.value.has('sg-1')).toBe(true)
      toggleSecurityGroups('sg-1')
      expect(expandedSecurityGroups.value.has('sg-1')).toBe(false)
    })
  })

  describe('confirmDelete', () => {
    it('sets item and type and opens modal', () => {
      const { confirmDelete, itemToDelete, deleteType, showDeleteConfirm } = useEC2()
      const item = { InstanceId: 'i-1' }
      confirmDelete(item, 'instance')
      expect(itemToDelete.value).toEqual(item)
      expect(deleteType.value).toBe('instance')
      expect(showDeleteConfirm.value).toBe(true)
    })
  })

  describe('getStatus', () => {
    it('maps running to active', () => {
      const { getStatus } = useEC2()
      expect(getStatus('running')).toBe('active')
    })

    it('maps pending to pending', () => {
      const { getStatus } = useEC2()
      expect(getStatus('pending')).toBe('pending')
    })

    it('maps stopped to inactive', () => {
      const { getStatus } = useEC2()
      expect(getStatus('stopped')).toBe('inactive')
    })

    it('maps terminated to inactive', () => {
      const { getStatus } = useEC2()
      expect(getStatus('terminated')).toBe('inactive')
    })

    it('handles uppercase', () => {
      const { getStatus } = useEC2()
      expect(getStatus('RUNNING')).toBe('active')
    })

    it('returns inactive for unknown', () => {
      const { getStatus } = useEC2()
      expect(getStatus('unknown')).toBe('inactive')
    })
  })

  describe('resetForm', () => {
    it('resets to defaults', () => {
      const { resetForm, createForm } = useEC2()
      createForm.value.ImageId = 'changed'
      createForm.value.InstanceType = 't3.large'
      resetForm()
      expect(createForm.value.ImageId).toBe('ami-0abcdef1234567890')
      expect(createForm.value.InstanceType).toBe('t2.micro')
      expect(createForm.value.MinCount).toBe(1)
      expect(createForm.value.MaxCount).toBe(1)
    })
  })

  describe('codeExamples', () => {
    it('generates 4 code examples', () => {
      const { codeExamples } = useEC2()
      expect(codeExamples.value).toHaveLength(4)
      expect(codeExamples.value[0].language).toBe('aws-cli')
      expect(codeExamples.value[1].language).toBe('javascript')
      expect(codeExamples.value[2].language).toBe('python')
      expect(codeExamples.value[3].language).toBe('go')
    })
  })

  describe('VPC load functions', () => {
    it('loadRouteTables loads successfully', async () => {
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }] })
      const { loadRouteTables, routeTables } = useEC2()
      await loadRouteTables()
      expect(routeTables.value).toHaveLength(1)
    })

    it('loadRouteTables handles error', async () => {
      vi.mocked(ec2Api.describeRouteTables).mockRejectedValue(new Error('fail'))
      const { loadRouteTables, routeTables } = useEC2()
      await loadRouteTables()
      expect(routeTables.value).toEqual([])
    })

    it('loadInternetGateways loads successfully', async () => {
      vi.mocked(ec2Api.describeInternetGateways).mockResolvedValue({ InternetGateways: [{ InternetGatewayId: 'igw-1' }] })
      const { loadInternetGateways, internetGateways } = useEC2()
      await loadInternetGateways()
      expect(internetGateways.value).toHaveLength(1)
    })

    it('loadInternetGateways handles error', async () => {
      vi.mocked(ec2Api.describeInternetGateways).mockRejectedValue(new Error('fail'))
      const { loadInternetGateways, internetGateways } = useEC2()
      await loadInternetGateways()
      expect(internetGateways.value).toEqual([])
    })

    it('loadNatGateways loads successfully', async () => {
      vi.mocked(ec2Api.describeNatGateways).mockResolvedValue({ NatGateways: [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }] })
      const { loadNatGateways, natGateways } = useEC2()
      await loadNatGateways()
      expect(natGateways.value).toHaveLength(1)
    })

    it('loadNatGateways handles error', async () => {
      vi.mocked(ec2Api.describeNatGateways).mockRejectedValue(new Error('fail'))
      const { loadNatGateways, natGateways } = useEC2()
      await loadNatGateways()
      expect(natGateways.value).toEqual([])
    })

    it('loadNetworkAcls loads successfully', async () => {
      vi.mocked(ec2Api.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }] })
      const { loadNetworkAcls, networkAcls } = useEC2()
      await loadNetworkAcls()
      expect(networkAcls.value).toHaveLength(1)
    })

    it('loadNetworkAcls handles error', async () => {
      vi.mocked(ec2Api.describeNetworkAcls).mockRejectedValue(new Error('fail'))
      const { loadNetworkAcls, networkAcls } = useEC2()
      await loadNetworkAcls()
      expect(networkAcls.value).toEqual([])
    })

    it('loadFlowLogs loads successfully', async () => {
      vi.mocked(ec2Api.describeFlowLogs).mockResolvedValue({ FlowLogs: [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:aws:logs:lg', TrafficType: 'ALL' }] })
      const { loadFlowLogs, flowLogs } = useEC2()
      await loadFlowLogs()
      expect(flowLogs.value).toHaveLength(1)
    })

    it('loadFlowLogs handles error', async () => {
      vi.mocked(ec2Api.describeFlowLogs).mockRejectedValue(new Error('fail'))
      const { loadFlowLogs, flowLogs } = useEC2()
      await loadFlowLogs()
      expect(flowLogs.value).toEqual([])
    })

    it('loadElasticIps loads successfully', async () => {
      vi.mocked(ec2Api.describeAddresses).mockResolvedValue({ Addresses: [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }] })
      const { loadElasticIps, elasticIps } = useEC2()
      await loadElasticIps()
      expect(elasticIps.value).toHaveLength(1)
    })

    it('loadElasticIps handles error', async () => {
      vi.mocked(ec2Api.describeAddresses).mockRejectedValue(new Error('fail'))
      const { loadElasticIps, elasticIps } = useEC2()
      await loadElasticIps()
      expect(elasticIps.value).toEqual([])
    })
  })

  describe('VPC CRUD', () => {
    it('handleCreateVpc calls API and reloads', async () => {
      vi.mocked(ec2Api.createVpc).mockResolvedValue({ VpcId: 'vpc-new', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' })
      vi.mocked(ec2Api.describeVpcs).mockResolvedValue({ Vpcs: [] })
      const { handleCreateVpc, showVpcModal } = useEC2()
      showVpcModal.value = true
      await handleCreateVpc({ CidrBlock: '10.0.0.0/16' })
      expect(ec2Api.createVpc).toHaveBeenCalledWith({ CidrBlock: '10.0.0.0/16' })
      expect(showVpcModal.value).toBe(false)
    })

    it('handleCreateVpc handles error', async () => {
      vi.mocked(ec2Api.createVpc).mockRejectedValue(new Error('create fail'))
      const { handleCreateVpc, vpcCreating } = useEC2()
      await handleCreateVpc({ CidrBlock: '10.0.0.0/16' })
      expect(vpcCreating.value).toBe(false)
    })

    it('handleDeleteVpc removes from list', async () => {
      vi.mocked(ec2Api.deleteVpc).mockResolvedValue({})
      const { handleDeleteVpc, itemToDelete, vpcs } = useEC2()
      vpcs.value = [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }]
      itemToDelete.value = { VpcId: 'vpc-1' }
      await handleDeleteVpc()
      expect(ec2Api.deleteVpc).toHaveBeenCalledWith('vpc-1')
      expect(vpcs.value).toHaveLength(0)
    })

    it('handleDeleteVpc returns early if no item', async () => {
      const { handleDeleteVpc } = useEC2()
      await handleDeleteVpc()
      expect(ec2Api.deleteVpc).not.toHaveBeenCalled()
    })

    it('handleDeleteVpc handles error', async () => {
      vi.mocked(ec2Api.deleteVpc).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteVpc, itemToDelete, vpcs, showDeleteConfirm } = useEC2()
      vpcs.value = [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }]
      itemToDelete.value = { VpcId: 'vpc-1' }
      showDeleteConfirm.value = true
      await handleDeleteVpc()
      expect(ec2Api.deleteVpc).toHaveBeenCalledWith('vpc-1')
      // Modal stays open on error? Catch does not close it. Verify state.
      expect(vpcs.value).toHaveLength(1)
    })

    it('handleCreateSubnet calls API and reloads', async () => {
      vi.mocked(ec2Api.createSubnet).mockResolvedValue({ SubnetId: 'sn-new', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' })
      vi.mocked(ec2Api.describeSubnets).mockResolvedValue({ Subnets: [] })
      const { handleCreateSubnet, showSubnetModal } = useEC2()
      showSubnetModal.value = true
      await handleCreateSubnet({ VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24' })
      expect(ec2Api.createSubnet).toHaveBeenCalled()
      expect(showSubnetModal.value).toBe(false)
    })

    it('handleDeleteSubnet removes from list', async () => {
      vi.mocked(ec2Api.deleteSubnet).mockResolvedValue({})
      const { handleDeleteSubnet, itemToDelete, subnets } = useEC2()
      subnets.value = [{ SubnetId: 'sn-1', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }]
      itemToDelete.value = { SubnetId: 'sn-1' }
      await handleDeleteSubnet()
      expect(ec2Api.deleteSubnet).toHaveBeenCalledWith('sn-1')
      expect(subnets.value).toHaveLength(0)
    })

    it('handleCreateSubnet handles error', async () => {
      vi.mocked(ec2Api.createSubnet).mockRejectedValue(new Error('create fail'))
      const { handleCreateSubnet, subnetCreating } = useEC2()
      await handleCreateSubnet({ VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24' })
      expect(subnetCreating.value).toBe(false)
    })

    it('handleDeleteSubnet handles error', async () => {
      vi.mocked(ec2Api.deleteSubnet).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteSubnet, itemToDelete, subnets } = useEC2()
      subnets.value = [{ SubnetId: 'sn-1', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }]
      itemToDelete.value = { SubnetId: 'sn-1' }
      await handleDeleteSubnet()
      expect(ec2Api.deleteSubnet).toHaveBeenCalled()
      expect(subnets.value).toHaveLength(1)
    })

    it('handleCreateRouteTable calls API and reloads', async () => {
      vi.mocked(ec2Api.createRouteTable).mockResolvedValue({ RouteTableId: 'rtb-new', VpcId: 'vpc-1' })
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleCreateRouteTable, showRouteTableModal } = useEC2()
      showRouteTableModal.value = true
      await handleCreateRouteTable({ VpcId: 'vpc-1' })
      expect(ec2Api.createRouteTable).toHaveBeenCalled()
      expect(showRouteTableModal.value).toBe(false)
    })

    it('handleDeleteRouteTable removes from list', async () => {
      vi.mocked(ec2Api.deleteRouteTable).mockResolvedValue({})
      const { handleDeleteRouteTable, itemToDelete, routeTables } = useEC2()
      routeTables.value = [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }]
      itemToDelete.value = { RouteTableId: 'rtb-1' }
      await handleDeleteRouteTable()
      expect(ec2Api.deleteRouteTable).toHaveBeenCalledWith('rtb-1')
      expect(routeTables.value).toHaveLength(0)
    })

    it('handleCreateRouteTable handles error', async () => {
      vi.mocked(ec2Api.createRouteTable).mockRejectedValue(new Error('create fail'))
      const { handleCreateRouteTable, routeTableCreating } = useEC2()
      await handleCreateRouteTable({ VpcId: 'vpc-1' })
      expect(routeTableCreating.value).toBe(false)
    })

    it('handleDeleteRouteTable handles error', async () => {
      vi.mocked(ec2Api.deleteRouteTable).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteRouteTable, itemToDelete, routeTables } = useEC2()
      routeTables.value = [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }]
      itemToDelete.value = { RouteTableId: 'rtb-1' }
      await handleDeleteRouteTable()
      expect(ec2Api.deleteRouteTable).toHaveBeenCalled()
      expect(routeTables.value).toHaveLength(1)
    })

    it('handleCreateIgw calls API and optional attach', async () => {
      vi.mocked(ec2Api.createInternetGateway).mockResolvedValue({ InternetGatewayId: 'igw-new' })
      vi.mocked(ec2Api.attachInternetGateway).mockResolvedValue({})
      vi.mocked(ec2Api.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      const { handleCreateIgw, showIgwModal } = useEC2()
      showIgwModal.value = true
      await handleCreateIgw('vpc-1')
      expect(ec2Api.createInternetGateway).toHaveBeenCalled()
      expect(ec2Api.attachInternetGateway).toHaveBeenCalledWith('igw-new', 'vpc-1')
      expect(showIgwModal.value).toBe(false)
    })

    it('handleCreateIgw without attach', async () => {
      vi.mocked(ec2Api.createInternetGateway).mockResolvedValue({ InternetGatewayId: 'igw-new' })
      vi.mocked(ec2Api.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      const { handleCreateIgw } = useEC2()
      await handleCreateIgw()
      expect(ec2Api.attachInternetGateway).not.toHaveBeenCalled()
    })

    it('handleDeleteIgw removes from list', async () => {
      vi.mocked(ec2Api.deleteInternetGateway).mockResolvedValue({})
      const { handleDeleteIgw, itemToDelete, internetGateways } = useEC2()
      internetGateways.value = [{ InternetGatewayId: 'igw-1' }]
      itemToDelete.value = { InternetGatewayId: 'igw-1' }
      await handleDeleteIgw()
      expect(ec2Api.deleteInternetGateway).toHaveBeenCalledWith('igw-1')
      expect(internetGateways.value).toHaveLength(0)
    })

    it('handleCreateIgw handles error', async () => {
      vi.mocked(ec2Api.createInternetGateway).mockRejectedValue(new Error('create fail'))
      const { handleCreateIgw, igwCreating } = useEC2()
      await handleCreateIgw('vpc-1')
      expect(igwCreating.value).toBe(false)
    })

    it('handleDeleteIgw handles error', async () => {
      vi.mocked(ec2Api.deleteInternetGateway).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteIgw, itemToDelete, internetGateways } = useEC2()
      internetGateways.value = [{ InternetGatewayId: 'igw-1' }]
      itemToDelete.value = { InternetGatewayId: 'igw-1' }
      await handleDeleteIgw()
      expect(ec2Api.deleteInternetGateway).toHaveBeenCalled()
      expect(internetGateways.value).toHaveLength(1)
    })

    it('handleCreateIgw error during attach still reloads', async () => {
      vi.mocked(ec2Api.createInternetGateway).mockResolvedValue({ InternetGatewayId: 'igw-new' })
      vi.mocked(ec2Api.attachInternetGateway).mockRejectedValue(new Error('attach fail'))
      vi.mocked(ec2Api.describeInternetGateways).mockResolvedValue({ InternetGateways: [] })
      const { handleCreateIgw, igwCreating } = useEC2()
      await handleCreateIgw('vpc-1')
      expect(ec2Api.attachInternetGateway).toHaveBeenCalledWith('igw-new', 'vpc-1')
      expect(igwCreating.value).toBe(false)
    })

    it('handleCreateNatGateway calls API', async () => {
      vi.mocked(ec2Api.createNatGateway).mockResolvedValue({ NatGatewayId: 'nat-new', State: 'pending', SubnetId: 'sn-1' })
      vi.mocked(ec2Api.describeNatGateways).mockResolvedValue({ NatGateways: [] })
      const { handleCreateNatGateway, showNatGatewayModal } = useEC2()
      showNatGatewayModal.value = true
      await handleCreateNatGateway({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(ec2Api.createNatGateway).toHaveBeenCalledWith({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(showNatGatewayModal.value).toBe(false)
    })

    it('handleDeleteNatGateway removes from list', async () => {
      vi.mocked(ec2Api.deleteNatGateway).mockResolvedValue({})
      const { handleDeleteNatGateway, itemToDelete, natGateways } = useEC2()
      natGateways.value = [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }]
      itemToDelete.value = { NatGatewayId: 'nat-1' }
      await handleDeleteNatGateway()
      expect(ec2Api.deleteNatGateway).toHaveBeenCalledWith('nat-1')
      expect(natGateways.value).toHaveLength(0)
    })

    it('handleCreateNatGateway handles error', async () => {
      vi.mocked(ec2Api.createNatGateway).mockRejectedValue(new Error('create fail'))
      const { handleCreateNatGateway, natGatewayCreating } = useEC2()
      await handleCreateNatGateway({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(natGatewayCreating.value).toBe(false)
    })

    it('handleDeleteNatGateway handles error', async () => {
      vi.mocked(ec2Api.deleteNatGateway).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteNatGateway, itemToDelete, natGateways } = useEC2()
      natGateways.value = [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }]
      itemToDelete.value = { NatGatewayId: 'nat-1' }
      await handleDeleteNatGateway()
      expect(ec2Api.deleteNatGateway).toHaveBeenCalled()
      expect(natGateways.value).toHaveLength(1)
    })

    it('handleCreateNacl calls API', async () => {
      vi.mocked(ec2Api.createNetworkAcl).mockResolvedValue({ NetworkAclId: 'acl-new', VpcId: 'vpc-1', IsDefault: false })
      vi.mocked(ec2Api.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleCreateNacl, showNaclModal } = useEC2()
      showNaclModal.value = true
      await handleCreateNacl({ VpcId: 'vpc-1' })
      expect(ec2Api.createNetworkAcl).toHaveBeenCalled()
      expect(showNaclModal.value).toBe(false)
    })

    it('handleDeleteNacl removes from list', async () => {
      vi.mocked(ec2Api.deleteNetworkAcl).mockResolvedValue({})
      const { handleDeleteNacl, itemToDelete, networkAcls } = useEC2()
      networkAcls.value = [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }]
      itemToDelete.value = { NetworkAclId: 'acl-1' }
      await handleDeleteNacl()
      expect(ec2Api.deleteNetworkAcl).toHaveBeenCalledWith('acl-1')
      expect(networkAcls.value).toHaveLength(0)
    })

    it('handleCreateNacl handles error', async () => {
      vi.mocked(ec2Api.createNetworkAcl).mockRejectedValue(new Error('create fail'))
      const { handleCreateNacl, naclCreating } = useEC2()
      await handleCreateNacl({ VpcId: 'vpc-1' })
      expect(naclCreating.value).toBe(false)
    })

    it('handleDeleteNacl handles error', async () => {
      vi.mocked(ec2Api.deleteNetworkAcl).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteNacl, itemToDelete, networkAcls } = useEC2()
      networkAcls.value = [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }]
      itemToDelete.value = { NetworkAclId: 'acl-1' }
      await handleDeleteNacl()
      expect(ec2Api.deleteNetworkAcl).toHaveBeenCalled()
      expect(networkAcls.value).toHaveLength(1)
    })

    it('handleCreateFlowLog calls API', async () => {
      vi.mocked(ec2Api.createFlowLogs).mockResolvedValue({ FlowLogId: 'fl-new', ResourceId: 'vpc-1', LogDestination: 'arn:lg', TrafficType: 'ALL' })
      vi.mocked(ec2Api.describeFlowLogs).mockResolvedValue({ FlowLogs: [] })
      const { handleCreateFlowLog, showFlowLogModal } = useEC2()
      showFlowLogModal.value = true
      await handleCreateFlowLog({ ResourceId: 'vpc-1', LogDestinationType: 'cloud-watch-logs', LogDestination: 'arn:lg', TrafficType: 'ALL' })
      expect(ec2Api.createFlowLogs).toHaveBeenCalled()
      expect(showFlowLogModal.value).toBe(false)
    })

    it('handleDeleteFlowLog removes from list', async () => {
      vi.mocked(ec2Api.deleteFlowLogs).mockResolvedValue({})
      const { handleDeleteFlowLog, itemToDelete, flowLogs } = useEC2()
      flowLogs.value = [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:lg', TrafficType: 'ALL' }]
      itemToDelete.value = { FlowLogId: 'fl-1' }
      await handleDeleteFlowLog()
      expect(ec2Api.deleteFlowLogs).toHaveBeenCalledWith('fl-1')
      expect(flowLogs.value).toHaveLength(0)
    })

    it('handleCreateFlowLog handles error', async () => {
      vi.mocked(ec2Api.createFlowLogs).mockRejectedValue(new Error('create fail'))
      const { handleCreateFlowLog, flowLogCreating } = useEC2()
      await handleCreateFlowLog({ ResourceId: 'vpc-1', LogDestinationType: 'cloud-watch-logs', LogDestination: 'arn:lg', TrafficType: 'ALL' })
      expect(flowLogCreating.value).toBe(false)
    })

    it('handleDeleteFlowLog handles error', async () => {
      vi.mocked(ec2Api.deleteFlowLogs).mockRejectedValue(new Error('delete fail'))
      const { handleDeleteFlowLog, itemToDelete, flowLogs } = useEC2()
      flowLogs.value = [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:lg', TrafficType: 'ALL' }]
      itemToDelete.value = { FlowLogId: 'fl-1' }
      await handleDeleteFlowLog()
      expect(ec2Api.deleteFlowLogs).toHaveBeenCalled()
      expect(flowLogs.value).toHaveLength(1)
    })

    it('handleAllocateElasticIp calls API and returns result', async () => {
      vi.mocked(ec2Api.allocateElasticIp).mockResolvedValue({ AllocationId: 'eip-new', PublicIp: '1.2.3.5', Domain: 'vpc' })
      vi.mocked(ec2Api.describeAddresses).mockResolvedValue({ Addresses: [] })
      const { handleAllocateElasticIp } = useEC2()
      const result = await handleAllocateElasticIp()
      expect(ec2Api.allocateElasticIp).toHaveBeenCalled()
      expect(result.PublicIp).toBe('1.2.3.5')
    })

    it('handleAllocateElasticIp handles error', async () => {
      vi.mocked(ec2Api.allocateElasticIp).mockRejectedValue(new Error('alloc fail'))
      const { handleAllocateElasticIp } = useEC2()
      await expect(handleAllocateElasticIp()).rejects.toThrow('alloc fail')
    })

    it('handleReleaseElasticIp returns early if no item', async () => {
      const { handleReleaseElasticIp } = useEC2()
      await handleReleaseElasticIp()
      expect(ec2Api.releaseElasticIp).not.toHaveBeenCalled()
    })

    it('handleReleaseElasticIp removes from list', async () => {
      vi.mocked(ec2Api.releaseElasticIp).mockResolvedValue({})
      const { handleReleaseElasticIp, itemToDelete, elasticIps } = useEC2()
      elasticIps.value = [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }]
      itemToDelete.value = { AllocationId: 'eip-1' }
      await handleReleaseElasticIp()
      expect(ec2Api.releaseElasticIp).toHaveBeenCalledWith('eip-1')
      expect(elasticIps.value).toHaveLength(0)
    })

    it('handleReleaseElasticIp handles error', async () => {
      vi.mocked(ec2Api.releaseElasticIp).mockRejectedValue(new Error('release fail'))
      const { handleReleaseElasticIp, itemToDelete, elasticIps } = useEC2()
      elasticIps.value = [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }]
      itemToDelete.value = { AllocationId: 'eip-1' }
      await handleReleaseElasticIp()
      expect(ec2Api.releaseElasticIp).toHaveBeenCalled()
      expect(elasticIps.value).toHaveLength(1)
    })

    it('handleCreateRoute calls API', async () => {
      vi.mocked(ec2Api.createRoute).mockResolvedValue({})
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleCreateRoute } = useEC2()
      await handleCreateRoute('rtb-1', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-1' })
      expect(ec2Api.createRoute).toHaveBeenCalledWith('rtb-1', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-1' })
    })

    it('handleDeleteRoute calls API', async () => {
      vi.mocked(ec2Api.deleteRoute).mockResolvedValue({})
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleDeleteRoute } = useEC2()
      await handleDeleteRoute('rtb-1', '0.0.0.0/0')
      expect(ec2Api.deleteRoute).toHaveBeenCalledWith('rtb-1', '0.0.0.0/0')
    })

    it('handleAssociateRouteTable calls API', async () => {
      vi.mocked(ec2Api.associateRouteTable).mockResolvedValue({})
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleAssociateRouteTable } = useEC2()
      await handleAssociateRouteTable('rtb-1', 'sn-1')
      expect(ec2Api.associateRouteTable).toHaveBeenCalledWith('rtb-1', 'sn-1')
    })

    it('handleDisassociateRouteTable calls API', async () => {
      vi.mocked(ec2Api.disassociateRouteTable).mockResolvedValue({})
      vi.mocked(ec2Api.describeRouteTables).mockResolvedValue({ RouteTables: [] })
      const { handleDisassociateRouteTable } = useEC2()
      await handleDisassociateRouteTable('assoc-1')
      expect(ec2Api.disassociateRouteTable).toHaveBeenCalledWith('assoc-1')
    })

    it('handleCreateNaclRule calls API', async () => {
      vi.mocked(ec2Api.createNetworkAclEntry).mockResolvedValue({})
      vi.mocked(ec2Api.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleCreateNaclRule } = useEC2()
      await handleCreateNaclRule('acl-1', { RuleNumber: 100, Protocol: 'tcp', CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow', PortRange: { From: 80, To: 80 } })
      expect(ec2Api.createNetworkAclEntry).toHaveBeenCalledWith('acl-1', expect.any(Object))
    })

    it('handleDeleteNaclRule calls API', async () => {
      vi.mocked(ec2Api.deleteNetworkAclEntry).mockResolvedValue({})
      vi.mocked(ec2Api.describeNetworkAcls).mockResolvedValue({ NetworkAcls: [] })
      const { handleDeleteNaclRule } = useEC2()
      await handleDeleteNaclRule('acl-1', 100)
      expect(ec2Api.deleteNetworkAclEntry).toHaveBeenCalledWith('acl-1', 100)
    })
  })

  describe('VPC toggle functions', () => {
    it('toggleVpcs adds and removes', () => {
      const { toggleVpcs, expandedVpcs } = useEC2()
      toggleVpcs('vpc-1')
      expect(expandedVpcs.value.has('vpc-1')).toBe(true)
      toggleVpcs('vpc-1')
      expect(expandedVpcs.value.has('vpc-1')).toBe(false)
    })

    it('toggleSubnets adds and removes', () => {
      const { toggleSubnets, expandedSubnets } = useEC2()
      toggleSubnets('sn-1')
      expect(expandedSubnets.value.has('sn-1')).toBe(true)
      toggleSubnets('sn-1')
      expect(expandedSubnets.value.has('sn-1')).toBe(false)
    })

    it('toggleRouteTables adds and removes', () => {
      const { toggleRouteTables, expandedRouteTables } = useEC2()
      toggleRouteTables('rtb-1')
      expect(expandedRouteTables.value.has('rtb-1')).toBe(true)
      toggleRouteTables('rtb-1')
      expect(expandedRouteTables.value.has('rtb-1')).toBe(false)
    })

    it('toggleInternetGateways adds and removes', () => {
      const { toggleInternetGateways, expandedInternetGateways } = useEC2()
      toggleInternetGateways('igw-1')
      expect(expandedInternetGateways.value.has('igw-1')).toBe(true)
      toggleInternetGateways('igw-1')
      expect(expandedInternetGateways.value.has('igw-1')).toBe(false)
    })

    it('toggleNatGateways adds and removes', () => {
      const { toggleNatGateways, expandedNatGateways } = useEC2()
      toggleNatGateways('nat-1')
      expect(expandedNatGateways.value.has('nat-1')).toBe(true)
      toggleNatGateways('nat-1')
      expect(expandedNatGateways.value.has('nat-1')).toBe(false)
    })

    it('toggleNetworkAcls adds and removes', () => {
      const { toggleNetworkAcls, expandedNetworkAcls } = useEC2()
      toggleNetworkAcls('acl-1')
      expect(expandedNetworkAcls.value.has('acl-1')).toBe(true)
      toggleNetworkAcls('acl-1')
      expect(expandedNetworkAcls.value.has('acl-1')).toBe(false)
    })

    it('toggleFlowLogs adds and removes', () => {
      const { toggleFlowLogs, expandedFlowLogs } = useEC2()
      toggleFlowLogs('fl-1')
      expect(expandedFlowLogs.value.has('fl-1')).toBe(true)
      toggleFlowLogs('fl-1')
      expect(expandedFlowLogs.value.has('fl-1')).toBe(false)
    })
  })

  describe('VPC detail helpers', () => {
    it('openRouteTableDetail sets selected and opens modal', () => {
      const { openRouteTableDetail, selectedRouteTable, showRouteTableDetailModal } = useEC2()
      const rt = { RouteTableId: 'rtb-1', VpcId: 'vpc-1' }
      openRouteTableDetail(rt)
      expect(selectedRouteTable.value).toEqual(rt)
      expect(showRouteTableDetailModal.value).toBe(true)
    })

    it('openNaclRuleDetail sets selected and opens modal', () => {
      const { openNaclRuleDetail, selectedNacl, showNaclRuleModal } = useEC2()
      const nacl = { NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }
      openNaclRuleDetail(nacl)
      expect(selectedNacl.value).toEqual(nacl)
      expect(showNaclRuleModal.value).toBe(true)
    })
  })
})
