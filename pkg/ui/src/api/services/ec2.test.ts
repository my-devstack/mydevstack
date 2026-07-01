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

})
