import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@/config', () => ({
  PROXY_BACKEND: 'http://127.0.0.1:8081',
}))

import {
  describeInstances,
  runInstances,
  terminateInstance,
  startInstance,
  stopInstance,
  describeKeyPairs,
  createKeyPair,
  importKeyPair,
  deleteKeyPair,
  describeSecurityGroups,
  createSecurityGroup,
  deleteSecurityGroup,
  authorizeSecurityGroupIngress,
  describeVpcs,
  describeSubnets,
  createVpc,
  deleteVpc,
  createSubnet,
  deleteSubnet,
  createRouteTable,
  deleteRouteTable,
  describeRouteTables,
  createRoute,
  deleteRoute,
  associateRouteTable,
  disassociateRouteTable,
  createInternetGateway,
  deleteInternetGateway,
  describeInternetGateways,
  attachInternetGateway,
  detachInternetGateway,
  createNatGateway,
  deleteNatGateway,
  describeNatGateways,
  createNetworkAcl,
  deleteNetworkAcl,
  describeNetworkAcls,
  createNetworkAclEntry,
  deleteNetworkAclEntry,
  createFlowLogs,
  deleteFlowLogs,
  describeFlowLogs,
  allocateElasticIp,
  releaseElasticIp,
  describeAddresses,
} from './ec2'

describe('EC2 API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('describeInstances', () => {
    it('calls GET /ec2/instances and returns parsed response', async () => {
      const mockResponse = {
        Reservations: [
          {
            Instances: [
              { InstanceId: 'i-123', InstanceType: 't2.micro', ImageId: 'ami-abc' },
            ],
          },
        ],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      })

      const result = await describeInstances()
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/instances', { method: 'GET' })
      expect(result.Reservations).toHaveLength(1)
      expect(result.Reservations![0].Instances![0].InstanceId).toBe('i-123')
    })

    it('passes query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Reservations: [] })),
      })

      await describeInstances({ InstanceIds: ['i-123'], MaxResults: 10 })
      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('InstanceId=i-123')
      expect(callUrl).toContain('MaxResults=10')
    })

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      })

      await expect(describeInstances()).rejects.toThrow('EC2 request failed')
    })
  })

  describe('runInstances', () => {
    it('calls POST /ec2/instances with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Instances: [{ InstanceId: 'i-new' }] })),
      })

      const params = { ImageId: 'ami-abc', InstanceType: 't2.micro', MinCount: 1, MaxCount: 1 }
      const result = await runInstances(params)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/instances',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        }),
      )
      expect(result.Instances[0].InstanceId).toBe('i-new')
    })
  })

  describe('terminateInstance', () => {
    it('calls DELETE /ec2/instances/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Instances: [] })),
      })

      await terminateInstance('i-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/instances/i-123',
        { method: 'DELETE' },
      )
    })
  })

  describe('startInstance', () => {
    it('calls POST /ec2/instances/:id/start', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Instances: [] })),
      })

      await startInstance('i-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/instances/i-123/start',
        { method: 'POST' },
      )
    })
  })

  describe('stopInstance', () => {
    it('calls POST /ec2/instances/:id/stop', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Instances: [] })),
      })

      await stopInstance('i-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/instances/i-123/stop',
        { method: 'POST' },
      )
    })
  })

  describe('describeKeyPairs', () => {
    it('calls GET /ec2/key-pairs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ KeyPairs: [{ KeyName: 'my-key', KeyFingerprint: 'ab:cd' }] })),
      })

      const result = await describeKeyPairs()
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/key-pairs', { method: 'GET' })
      expect(result.KeyPairs).toHaveLength(1)
    })
  })

  describe('createKeyPair', () => {
    it('calls POST /ec2/key-pairs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ KeyName: 'my-key', KeyFingerprint: 'ab:cd', KeyMaterial: 'ssh-rsa ...' })),
      })

      const result = await createKeyPair('my-key')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/key-pairs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ KeyName: 'my-key' }),
        }),
      )
      expect(result.KeyMaterial).toBeDefined()
    })
  })

  describe('importKeyPair', () => {
    it('calls POST /ec2/key-pairs/import', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ KeyName: 'imported', KeyFingerprint: 'ef:gh' })),
      })

      const result = await importKeyPair('imported', 'ssh-rsa AAA...')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/key-pairs/import',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ KeyName: 'imported', PublicKeyMaterial: 'ssh-rsa AAA...' }),
        }),
      )
      expect(result.KeyName).toBe('imported')
    })
  })

  describe('deleteKeyPair', () => {
    it('calls DELETE /ec2/key-pairs/:name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      })

      await deleteKeyPair('my-key')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/key-pairs/my-key',
        { method: 'DELETE' },
      )
    })
  })

  describe('describeSecurityGroups', () => {
    it('calls GET /ec2/security-groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ SecurityGroups: [{ GroupId: 'sg-123', GroupName: 'default', Description: 'default', VpcId: 'vpc-123' }] })),
      })

      const result = await describeSecurityGroups()
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/security-groups', { method: 'GET' })
      expect(result.SecurityGroups).toHaveLength(1)
    })
  })

  describe('createSecurityGroup', () => {
    it('calls POST /ec2/security-groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ GroupId: 'sg-new' })),
      })

      const result = await createSecurityGroup({ GroupName: 'web', Description: 'Web SG', VpcId: 'vpc-123' })
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/security-groups',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ GroupName: 'web', Description: 'Web SG', VpcId: 'vpc-123' }),
        }),
      )
      expect(result.GroupId).toBe('sg-new')
    })
  })

  describe('deleteSecurityGroup', () => {
    it('calls DELETE /ec2/security-groups/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      })

      await deleteSecurityGroup('sg-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/security-groups/sg-123',
        { method: 'DELETE' },
      )
    })
  })

  describe('authorizeSecurityGroupIngress', () => {
    it('calls POST /ec2/security-groups/:id/ingress', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      })

      await authorizeSecurityGroupIngress('sg-123', { IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' })
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8081/ec2/security-groups/sg-123/ingress',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
        }),
      )
    })
  })

  describe('describeVpcs', () => {
    it('calls GET /ec2/vpcs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Vpcs: [{ VpcId: 'vpc-123', CidrBlock: '10.0.0.0/16', IsDefault: true, State: 'available' }] })),
      })

      const result = await describeVpcs()
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/vpcs', { method: 'GET' })
      expect(result.Vpcs).toHaveLength(1)
    })
  })

  describe('describeSubnets', () => {
    it('calls GET /ec2/subnets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Subnets: [{ SubnetId: 'subnet-123', VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' }] })),
      })

      const result = await describeSubnets()
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/subnets', { method: 'GET' })
      expect(result.Subnets).toHaveLength(1)
    })
  })

  describe('VPC API', () => {
    describe('createVpc', () => {
      it('calls POST /ec2/vpcs with CidrBlock', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ VpcId: 'vpc-new', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' })),
        })
        const result = await createVpc({ CidrBlock: '10.0.0.0/16' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/vpcs',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ CidrBlock: '10.0.0.0/16' }) }),
        )
        expect(result.VpcId).toBe('vpc-new')
      })
    })

    describe('deleteVpc', () => {
      it('calls DELETE /ec2/vpcs/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteVpc('vpc-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/vpcs/vpc-123', { method: 'DELETE' })
      })
    })

    describe('createSubnet', () => {
      it('calls POST /ec2/subnets', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ SubnetId: 'subnet-new', VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' })),
        })
        const result = await createSubnet({ VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/subnets',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24' }) }),
        )
        expect(result.SubnetId).toBe('subnet-new')
      })
    })

    describe('deleteSubnet', () => {
      it('calls DELETE /ec2/subnets/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteSubnet('subnet-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/subnets/subnet-123', { method: 'DELETE' })
      })
    })

    describe('createRouteTable', () => {
      it('calls POST /ec2/route-tables', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ RouteTableId: 'rtb-new', VpcId: 'vpc-123' })),
        })
        const result = await createRouteTable({ VpcId: 'vpc-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/route-tables',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ VpcId: 'vpc-123' }) }),
        )
        expect(result.RouteTableId).toBe('rtb-new')
      })
    })

    describe('deleteRouteTable', () => {
      it('calls DELETE /ec2/route-tables/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteRouteTable('rtb-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/route-tables/rtb-123', { method: 'DELETE' })
      })
    })

    describe('describeRouteTables', () => {
      it('calls GET /ec2/route-tables', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ RouteTables: [{ RouteTableId: 'rtb-123', VpcId: 'vpc-123' }] })),
        })
        const result = await describeRouteTables()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/route-tables', { method: 'GET' })
        expect(result.RouteTables).toHaveLength(1)
      })
    })

    describe('createRoute', () => {
      it('calls POST /ec2/route-tables/:id/routes', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await createRoute('rtb-123', { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/route-tables/rtb-123/routes',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' }),
          }),
        )
      })
    })

    describe('deleteRoute', () => {
      it('calls DELETE /ec2/route-tables/:id/routes/:cidr', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteRoute('rtb-123', '0.0.0.0/0')
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/route-tables/rtb-123/routes/0.0.0.0%2F0',
          { method: 'DELETE' },
        )
      })
    })

    describe('associateRouteTable', () => {
      it('calls POST /ec2/route-tables/:id/associate', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await associateRouteTable('rtb-123', 'subnet-123')
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/route-tables/rtb-123/associate',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ SubnetId: 'subnet-123' }) }),
        )
      })
    })

    describe('disassociateRouteTable', () => {
      it('calls POST /ec2/route-tables/:id/disassociate', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await disassociateRouteTable('assoc-123')
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/route-tables/assoc-123/disassociate',
          { method: 'POST' },
        )
      })
    })

    describe('createInternetGateway', () => {
      it('calls POST /ec2/internet-gateways', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ InternetGatewayId: 'igw-new' })),
        })
        const result = await createInternetGateway()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/internet-gateways', { method: 'POST' })
        expect(result.InternetGatewayId).toBe('igw-new')
      })
    })

    describe('deleteInternetGateway', () => {
      it('calls DELETE /ec2/internet-gateways/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteInternetGateway('igw-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/internet-gateways/igw-123', { method: 'DELETE' })
      })
    })

    describe('describeInternetGateways', () => {
      it('calls GET /ec2/internet-gateways', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ InternetGateways: [{ InternetGatewayId: 'igw-123' }] })),
        })
        const result = await describeInternetGateways()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/internet-gateways', { method: 'GET' })
        expect(result.InternetGateways).toHaveLength(1)
      })
    })

    describe('attachInternetGateway', () => {
      it('calls POST /ec2/internet-gateways/:id/attach', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await attachInternetGateway('igw-123', 'vpc-123')
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/internet-gateways/igw-123/attach',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ VpcId: 'vpc-123' }) }),
        )
      })
    })

    describe('detachInternetGateway', () => {
      it('calls POST /ec2/internet-gateways/:id/detach', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await detachInternetGateway('igw-123', 'vpc-123')
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/internet-gateways/igw-123/detach',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ VpcId: 'vpc-123' }) }),
        )
      })
    })

    describe('createNatGateway', () => {
      it('calls POST /ec2/nat-gateways', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ NatGatewayId: 'nat-new', State: 'pending', SubnetId: 'subnet-123' })),
        })
        const result = await createNatGateway({ SubnetId: 'subnet-123', AllocationId: 'eipalloc-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/nat-gateways',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ SubnetId: 'subnet-123', AllocationId: 'eipalloc-123' }) }),
        )
        expect(result.NatGatewayId).toBe('nat-new')
      })
    })

    describe('deleteNatGateway', () => {
      it('calls DELETE /ec2/nat-gateways/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteNatGateway('nat-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/nat-gateways/nat-123', { method: 'DELETE' })
      })
    })

    describe('describeNatGateways', () => {
      it('calls GET /ec2/nat-gateways', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ NatGateways: [{ NatGatewayId: 'nat-123' }] })),
        })
        const result = await describeNatGateways()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/nat-gateways', { method: 'GET' })
        expect(result.NatGateways).toHaveLength(1)
      })
    })

    describe('createNetworkAcl', () => {
      it('calls POST /ec2/network-acls', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ NetworkAclId: 'nacl-new', VpcId: 'vpc-123', IsDefault: false })),
        })
        const result = await createNetworkAcl({ VpcId: 'vpc-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/network-acls',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ VpcId: 'vpc-123' }) }),
        )
        expect(result.NetworkAclId).toBe('nacl-new')
      })
    })

    describe('deleteNetworkAcl', () => {
      it('calls DELETE /ec2/network-acls/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteNetworkAcl('nacl-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/network-acls/nacl-123', { method: 'DELETE' })
      })
    })

    describe('describeNetworkAcls', () => {
      it('calls GET /ec2/network-acls', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ NetworkAcls: [{ NetworkAclId: 'nacl-123', VpcId: 'vpc-123', IsDefault: false }] })),
        })
        const result = await describeNetworkAcls()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/network-acls', { method: 'GET' })
        expect(result.NetworkAcls).toHaveLength(1)
      })
    })

    describe('createNetworkAclEntry', () => {
      it('calls POST /ec2/network-acls/:id/entries', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await createNetworkAclEntry('nacl-123', {
          RuleNumber: 100,
          Protocol: 'tcp',
          CidrBlock: '0.0.0.0/0',
          Egress: false,
          RuleAction: 'allow',
          PortRange: { From: 80, To: 80 },
        })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/network-acls/nacl-123/entries',
          expect.objectContaining({ method: 'POST' }),
        )
      })
    })

    describe('deleteNetworkAclEntry', () => {
      it('calls DELETE /ec2/network-acls/:id/entries/:ruleNumber', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteNetworkAclEntry('nacl-123', 100)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/network-acls/nacl-123/entries/100',
          { method: 'DELETE' },
        )
      })
    })

    describe('createFlowLogs', () => {
      it('calls POST /ec2/flow-logs', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ FlowLogId: 'fl-123', ResourceId: 'vpc-123', LogDestination: 'arn:aws:logs:us-east-1:123:log-group:my-flow-logs', TrafficType: 'ALL' })),
        })
        const result = await createFlowLogs({ ResourceId: 'vpc-123', LogDestinationType: 'cloud-watch-logs', LogDestination: 'arn:aws:logs:...', TrafficType: 'ALL' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://127.0.0.1:8081/ec2/flow-logs',
          expect.objectContaining({ method: 'POST' }),
        )
        expect(result.FlowLogId).toBe('fl-123')
      })
    })

    describe('deleteFlowLogs', () => {
      it('calls DELETE /ec2/flow-logs/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await deleteFlowLogs('fl-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/flow-logs/fl-123', { method: 'DELETE' })
      })
    })

    describe('describeFlowLogs', () => {
      it('calls GET /ec2/flow-logs', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ FlowLogs: [{ FlowLogId: 'fl-123' }] })),
        })
        const result = await describeFlowLogs()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/flow-logs', { method: 'GET' })
        expect(result.FlowLogs).toHaveLength(1)
      })
    })

    describe('allocateElasticIp', () => {
      it('calls POST /ec2/elastic-ips', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ AllocationId: 'eipalloc-123', PublicIp: '1.2.3.4', Domain: 'vpc' })),
        })
        const result = await allocateElasticIp()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/elastic-ips', { method: 'POST' })
        expect(result.AllocationId).toBe('eipalloc-123')
      })
    })

    describe('releaseElasticIp', () => {
      it('calls DELETE /ec2/elastic-ips/:id', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('{}') })
        await releaseElasticIp('eipalloc-123')
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/elastic-ips/eipalloc-123', { method: 'DELETE' })
      })
    })

    describe('describeAddresses', () => {
      it('calls GET /ec2/elastic-ips', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ Addresses: [{ AllocationId: 'eipalloc-123', PublicIp: '1.2.3.4', Domain: 'vpc' }] })),
        })
        const result = await describeAddresses()
        expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8081/ec2/elastic-ips', { method: 'GET' })
        expect(result.Addresses).toHaveLength(1)
      })
    })
  })
})
