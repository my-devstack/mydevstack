import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIError } from '../client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  describeDBInstances,
  createDBInstance,
  deleteDBInstance,
  describeDBEngineVersions,
  modifyDBInstance,
  rebootDBInstance,
  describeDBParameterGroups,
  describeDBParameters,
  describeDBSubnetGroups,
  listTagsForResource,
  addTagsToResource,
  removeTagsFromResource,
} from './rds'

describe('RDS Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('describeDBInstances', () => {
    it('returns mapped instances', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBInstances: [{
          DBInstanceIdentifier: 'db1',
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql',
          DBInstanceStatus: 'available',
          Endpoint: { Address: 'db1.example.com', Port: 3306 },
        }],
      }))
      const result = await describeDBInstances()
      expect(result).toHaveLength(1)
      expect(result[0].DBInstanceIdentifier).toBe('db1')
      expect(result[0].Endpoint?.Address).toBe('db1.example.com')
    })

    it('handles endpoint as undefined', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBInstances: [{ DBInstanceIdentifier: 'db1' }],
      }))
      const result = await describeDBInstances()
      expect(result[0].Endpoint).toBeUndefined()
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await describeDBInstances()
      expect(result).toEqual([])
    })

    it('uses GET /rds/db-instances', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await describeDBInstances()
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-instances')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('maps VpcSecurityGroups and DBSubnetGroup from response', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBInstances: [{
          DBInstanceIdentifier: 'db1',
          Engine: 'mysql',
          VpcSecurityGroups: [
            { VpcSecurityGroupId: 'sg-123', Status: 'active' },
          ],
          DBSubnetGroup: {
            DBSubnetGroupName: 'default-vpc',
            DBSubnetGroupDescription: 'Default VPC subnet group',
            VpcId: 'vpc-456',
            SubnetGroupStatus: 'Complete',
          },
        }],
      }))
      const result = await describeDBInstances()
      expect(result[0].VpcSecurityGroups).toHaveLength(1)
      expect(result[0].VpcSecurityGroups![0].VpcSecurityGroupId).toBe('sg-123')
      expect(result[0].DBSubnetGroup?.DBSubnetGroupName).toBe('default-vpc')
      expect(result[0].DBSubnetGroup?.VpcId).toBe('vpc-456')
    })
  })

  describe('createDBInstance', () => {
    it('returns mapped instance from DBInstance', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBInstance: {
          DBInstanceIdentifier: 'new-db',
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql',
          DBInstanceStatus: 'creating',
        },
      }))
      const result = await createDBInstance({
        DBInstanceIdentifier: 'new-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
      } as any)
      expect(result.DBInstanceIdentifier).toBe('new-db')
    })

    it('uses POST /rds/db-instances with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstance: { DBInstanceIdentifier: 'new-db' } }))
      await createDBInstance({ DBInstanceIdentifier: 'new-db', DBInstanceClass: 'db.t3.micro', Engine: 'mysql' } as any)
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-instances')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DBInstanceIdentifier).toBe('new-db')
    })

    it('sends VpcSecurityGroupIds and DBSubnetGroupName when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstance: { DBInstanceIdentifier: 'vpc-db' } }))
      await createDBInstance({
        DBInstanceIdentifier: 'vpc-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
        VpcSecurityGroupIds: ['sg-abc', 'sg-def'],
        DBSubnetGroupName: 'default-vpc-123',
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.VpcSecurityGroupIds).toEqual(['sg-abc', 'sg-def'])
      expect(body.DBSubnetGroupName).toBe('default-vpc-123')
    })

    it('omits VpcSecurityGroupIds and DBSubnetGroupName when not provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstance: { DBInstanceIdentifier: 'no-vpc-db' } }))
      await createDBInstance({
        DBInstanceIdentifier: 'no-vpc-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql',
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.VpcSecurityGroupIds).toBeUndefined()
      expect(body.DBSubnetGroupName).toBeUndefined()
    })
  })

  describe('deleteDBInstance', () => {
    it('encodes identifier in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDBInstance('db1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-instances/db1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('sends SkipFinalSnapshot in body when option set', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDBInstance('db1', { skipFinalSnapshot: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SkipFinalSnapshot).toBe(true)
    })
  })

  describe('describeDBEngineVersions', () => {
    it('sends engine and options as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBEngineVersions: [] }))
      await describeDBEngineVersions('mysql', { engineVersion: '8.0' })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/engine-versions')
      expect(url).toContain('Engine=mysql')
      expect(url).toContain('EngineVersion=8.0')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('modifyDBInstance', () => {
    it('sends identifier in URL and modifications in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstance: { DBInstanceIdentifier: 'db1' } }))
      const result = await modifyDBInstance('db1', { DBInstanceClass: 'db.t3.large' })
      expect(result.DBInstanceIdentifier).toBe('db1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-instances/db1')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DBInstanceClass).toBe('db.t3.large')
    })
  })

  describe('rebootDBInstance', () => {
    it('posts to reboot endpoint', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await rebootDBInstance('db1')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-instances/db1/reboot')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('describeDBParameterGroups', () => {
    it('throws APIError (not implemented by backend)', async () => {
      await expect(describeDBParameterGroups()).rejects.toThrow(APIError)
    })
  })

  describe('describeDBParameters', () => {
    it('throws APIError (not implemented by backend)', async () => {
      await expect(describeDBParameters('my-group')).rejects.toThrow(APIError)
    })
  })

  describe('describeDBSubnetGroups', () => {
    it('returns mapped subnet groups with subnets', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBSubnetGroups: [{
          DBSubnetGroupName: 'default',
          DBSubnetGroupDescription: 'Default subnet group',
          VpcId: 'vpc-12345',
          SubnetGroupStatus: 'Complete',
          Subnets: [
            { SubnetIdentifier: 'subnet-abc', SubnetAvailabilityZone: 'us-east-1a', SubnetStatus: 'Active' },
            { SubnetIdentifier: 'subnet-def', SubnetAvailabilityZone: 'us-east-1b', SubnetStatus: 'Active' },
          ],
        }],
      }))
      const result = await describeDBSubnetGroups()
      expect(result).toHaveLength(1)
      expect(result[0].DBSubnetGroupName).toBe('default')
      expect(result[0].VpcId).toBe('vpc-12345')
      expect(result[0].Subnets).toHaveLength(2)
      expect(result[0].Subnets![0].SubnetIdentifier).toBe('subnet-abc')
      expect(result[0].Subnets![0].SubnetAvailabilityZone).toBe('us-east-1a')
    })

    it('handles group without subnets', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        DBSubnetGroups: [{
          DBSubnetGroupName: 'default',
          DBSubnetGroupDescription: 'No subnets yet',
        }],
      }))
      const result = await describeDBSubnetGroups()
      expect(result[0].Subnets).toEqual([])
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await describeDBSubnetGroups()
      expect(result).toEqual([])
    })

    it('uses GET /rds/db-subnet-groups', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await describeDBSubnetGroups()
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/rds/db-subnet-groups')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeDBSubnetGroups()).rejects.toThrow(/RDS request failed/)
    })
  })

  describe('listTagsForResource', () => {
    it('throws APIError (not implemented by backend)', async () => {
      await expect(listTagsForResource('arn:aws:rds:db1')).rejects.toThrow(APIError)
    })
  })

  describe('addTagsToResource', () => {
    it('throws APIError (not implemented by backend)', async () => {
      await expect(addTagsToResource('arn:aws:rds:db1', [{ Key: 'Env', Value: 'prod' }])).rejects.toThrow(APIError)
    })
  })

  describe('removeTagsFromResource', () => {
    it('throws APIError (not implemented by backend)', async () => {
      await expect(removeTagsFromResource('arn:aws:rds:db1', ['Env'])).rejects.toThrow(APIError)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeDBInstances()).rejects.toThrow(/RDS request failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(describeDBInstances()).rejects.toThrow(/Failed to call RDS service/)
    })
  })

  describe('Headers', () => {
    it('uses application/json content type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstances: [] }))
      await describeDBInstances()
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
    })

    it('does not send X-Amz-Target', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstances: [] }))
      await describeDBInstances()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBeUndefined()
    })
  })
})
