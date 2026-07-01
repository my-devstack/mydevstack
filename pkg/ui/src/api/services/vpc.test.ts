import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vpcApi from './vpc'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

function mockResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockEmptyResponse(status = 200) {
  return new Response('', { status })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VPC API', () => {
  describe('describeVpcs', () => {
    it('fetches VPCs', async () => {
      const data = { Vpcs: [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', State: 'available', IsDefault: false }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeVpcs()
      expect(result.Vpcs).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/vpcs'), expect.objectContaining({ method: 'GET' }))
    })
  })

  describe('createVpc', () => {
    it('creates a VPC', async () => {
      const data = { VpcId: 'vpc-new', CidrBlock: '10.0.0.0/16', State: 'available', IsDefault: false }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createVpc({ CidrBlock: '10.0.0.0/16' })
      expect(result.VpcId).toBe('vpc-new')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/vpcs'), expect.objectContaining({ method: 'POST' }))
    })
  })

  describe('deleteVpc', () => {
    it('deletes a VPC', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteVpc('vpc-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/vpcs/vpc-1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('describeSubnets', () => {
    it('fetches subnets', async () => {
      const data = { Subnets: [{ SubnetId: 'sn-1', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeSubnets()
      expect(result.Subnets).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/subnets'), expect.objectContaining({ method: 'GET' }))
    })
  })

  describe('createSubnet', () => {
    it('creates a subnet', async () => {
      const data = { SubnetId: 'sn-new', VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createSubnet({ VpcId: 'vpc-1', CidrBlock: '10.0.1.0/24' })
      expect(result.SubnetId).toBe('sn-new')
    })
  })

  describe('deleteSubnet', () => {
    it('deletes a subnet', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteSubnet('sn-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/subnets/sn-1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('route tables', () => {
    it('describeRouteTables', async () => {
      const data = { RouteTables: [{ RouteTableId: 'rtb-1', VpcId: 'vpc-1' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeRouteTables()
      expect(result.RouteTables).toHaveLength(1)
    })

    it('createRouteTable', async () => {
      const data = { RouteTableId: 'rtb-new', VpcId: 'vpc-1' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createRouteTable({ VpcId: 'vpc-1' })
      expect(result.RouteTableId).toBe('rtb-new')
    })

    it('deleteRouteTable', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteRouteTable('rtb-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/route-tables/rtb-1'), expect.objectContaining({ method: 'DELETE' }))
    })

    it('createRoute', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.createRoute('rtb-1', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-1' })
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/route-tables/rtb-1/routes'), expect.objectContaining({ method: 'POST' }))
    })

    it('deleteRoute', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteRoute('rtb-1', '0.0.0.0/0')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/route-tables/rtb-1/routes/'), expect.objectContaining({ method: 'DELETE' }))
    })

    it('associateRouteTable', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.associateRouteTable('rtb-1', 'sn-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/route-tables/rtb-1/associate'), expect.objectContaining({ method: 'POST' }))
    })

    it('disassociateRouteTable', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.disassociateRouteTable('assoc-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/route-tables/assoc-1/disassociate'), expect.objectContaining({ method: 'POST' }))
    })
  })

  describe('internet gateways', () => {
    it('describeInternetGateways', async () => {
      const data = { InternetGateways: [{ InternetGatewayId: 'igw-1' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeInternetGateways()
      expect(result.InternetGateways).toHaveLength(1)
    })

    it('createInternetGateway', async () => {
      const data = { InternetGatewayId: 'igw-new' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createInternetGateway()
      expect(result.InternetGatewayId).toBe('igw-new')
    })

    it('deleteInternetGateway', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteInternetGateway('igw-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/internet-gateways/igw-1'), expect.objectContaining({ method: 'DELETE' }))
    })

    it('attachInternetGateway', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.attachInternetGateway('igw-1', 'vpc-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/internet-gateways/igw-1/attach'), expect.objectContaining({ method: 'POST' }))
    })

    it('detachInternetGateway', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.detachInternetGateway('igw-1', 'vpc-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/internet-gateways/igw-1/detach'), expect.objectContaining({ method: 'POST' }))
    })
  })

  describe('NAT gateways', () => {
    it('describeNatGateways', async () => {
      const data = { NatGateways: [{ NatGatewayId: 'nat-1', State: 'available', SubnetId: 'sn-1' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeNatGateways()
      expect(result.NatGateways).toHaveLength(1)
    })

    it('createNatGateway', async () => {
      const data = { NatGatewayId: 'nat-new', State: 'pending', SubnetId: 'sn-1' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createNatGateway({ SubnetId: 'sn-1', AllocationId: 'eip-1' })
      expect(result.NatGatewayId).toBe('nat-new')
    })

    it('deleteNatGateway', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteNatGateway('nat-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/nat-gateways/nat-1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('network ACLs', () => {
    it('describeNetworkAcls', async () => {
      const data = { NetworkAcls: [{ NetworkAclId: 'acl-1', VpcId: 'vpc-1', IsDefault: false }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeNetworkAcls()
      expect(result.NetworkAcls).toHaveLength(1)
    })

    it('createNetworkAcl', async () => {
      const data = { NetworkAclId: 'acl-new', VpcId: 'vpc-1', IsDefault: false }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createNetworkAcl({ VpcId: 'vpc-1' })
      expect(result.NetworkAclId).toBe('acl-new')
    })

    it('deleteNetworkAcl', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteNetworkAcl('acl-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/network-acls/acl-1'), expect.objectContaining({ method: 'DELETE' }))
    })

    it('createNetworkAclEntry', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.createNetworkAclEntry('acl-1', { RuleNumber: 100, Protocol: 'tcp', CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow', PortRange: { From: 80, To: 80 } })
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/network-acls/acl-1/entries'), expect.objectContaining({ method: 'POST' }))
    })

    it('deleteNetworkAclEntry', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteNetworkAclEntry('acl-1', 100)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/network-acls/acl-1/entries/100'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('flow logs', () => {
    it('describeFlowLogs', async () => {
      const data = { FlowLogs: [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1', LogDestination: 'arn:logs', TrafficType: 'ALL' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeFlowLogs()
      expect(result.FlowLogs).toHaveLength(1)
    })

    it('createFlowLogs', async () => {
      const data = { FlowLogId: 'fl-new', ResourceId: 'vpc-1', LogDestination: 'arn:logs', TrafficType: 'ALL' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.createFlowLogs({ ResourceId: 'vpc-1', LogDestinationType: 'cloud-watch-logs', LogDestination: 'arn:logs', TrafficType: 'ALL' })
      expect(result.FlowLogId).toBe('fl-new')
    })

    it('deleteFlowLogs', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.deleteFlowLogs('fl-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/flow-logs/fl-1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('elastic IPs', () => {
    it('describeAddresses', async () => {
      const data = { Addresses: [{ AllocationId: 'eip-1', PublicIp: '1.2.3.4', Domain: 'vpc' }] }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.describeAddresses()
      expect(result.Addresses).toHaveLength(1)
    })

    it('allocateElasticIp', async () => {
      const data = { AllocationId: 'eip-new', PublicIp: '1.2.3.5', Domain: 'vpc' }
      mockFetch.mockResolvedValue(mockResponse(data))
      const result = await vpcApi.allocateElasticIp()
      expect(result.PublicIp).toBe('1.2.3.5')
    })

    it('releaseElasticIp', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await vpcApi.releaseElasticIp('eip-1')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/vpc/elastic-ips/eip-1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'Not found' }, 404))
      await expect(vpcApi.describeVpcs()).rejects.toThrow('VPC request failed')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(vpcApi.describeVpcs()).rejects.toThrow()
    })
  })
})
