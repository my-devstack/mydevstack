import { describe, it, expect, vi, beforeEach } from 'vitest'

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
  })

  describe('deleteDBInstance', () => {
    it('sends identifier', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDBInstance('db1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DBInstanceIdentifier).toBe('db1')
    })

    it('sends SkipFinalSnapshot when option set', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteDBInstance('db1', { skipFinalSnapshot: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SkipFinalSnapshot).toBe(true)
    })
  })

  describe('describeDBEngineVersions', () => {
    it('sends engine and options', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBEngineVersions: [] }))
      await describeDBEngineVersions('mysql', { engineVersion: '8.0' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Engine).toBe('mysql')
      expect(body.engineVersion).toBe('8.0')
    })
  })

  describe('modifyDBInstance', () => {
    it('sends identifier and modifications', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstance: { DBInstanceIdentifier: 'db1' } }))
      const result = await modifyDBInstance('db1', { DBInstanceClass: 'db.t3.large' })
      expect(result.DBInstanceIdentifier).toBe('db1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DBInstanceIdentifier).toBe('db1')
      expect(body.DBInstanceClass).toBe('db.t3.large')
    })
  })

  describe('rebootDBInstance', () => {
    it('sends identifier', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await rebootDBInstance('db1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.DBInstanceIdentifier).toBe('db1')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeDBInstances()).rejects.toThrow(/RDS DescribeDBInstances failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(describeDBInstances()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses rds prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ DBInstances: [] }))
      await describeDBInstances()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('rds.DescribeDBInstances')
    })
  })
})
