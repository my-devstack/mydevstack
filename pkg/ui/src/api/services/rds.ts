/**
 * RDS Service API Client
 * HTTP client for RDS via Go proxy
 * @module api/services/rds
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { RDSInstance, CreateDBInstanceInput, DescribeDBEngineVersionsOutput } from '../types/aws'

async function rdsRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/rds/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `rds.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`RDS ${action} failed: ${errorText}`, response.status, 'rds')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`RDS ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'rds')
  }
}

export class RDSService {
  async describeDBInstances(): Promise<RDSInstance[]> {
    const response = await rdsRequest('DescribeDBInstances', {})
    return (response.DBInstances || []).map((instance: any) => ({
      DBInstanceIdentifier: instance.DBInstanceIdentifier || '',
      DBInstanceClass: instance.DBInstanceClass || '',
      Engine: instance.Engine || '',
      EngineVersion: instance.EngineVersion || '',
      DBInstanceStatus: instance.DBInstanceStatus || '',
      MasterUsername: instance.MasterUsername || '',
      Endpoint: instance.Endpoint ? {
        Address: instance.Endpoint.Address || '',
        Port: instance.Endpoint.Port || 0,
      } : undefined,
      DBName: instance.DBName,
      AllocatedStorage: instance.AllocatedStorage || 0,
      StorageType: instance.StorageType || '',
      InstanceCreateTime: instance.InstanceCreateTime || '',
      AvailabilityZone: instance.AvailabilityZone,
      MultiAZ: instance.MultiAZ || false,
      PubliclyAccessible: instance.PubliclyAccessible || false,
    }))
  }

  async createDBInstance(input: CreateDBInstanceInput): Promise<RDSInstance> {
    const response = await rdsRequest('CreateDBInstance', input)
    const instance = response.DBInstance
    return {
      DBInstanceIdentifier: instance.DBInstanceIdentifier || '',
      DBInstanceClass: instance.DBInstanceClass || '',
      Engine: instance.Engine || '',
      EngineVersion: instance.EngineVersion || '',
      DBInstanceStatus: instance.DBInstanceStatus || '',
      MasterUsername: instance.MasterUsername || '',
      Endpoint: instance.Endpoint ? {
        Address: instance.Endpoint.Address || '',
        Port: instance.Endpoint.Port || 0,
      } : undefined,
      DBName: instance.DBName,
      AllocatedStorage: instance.AllocatedStorage || 0,
      StorageType: instance.StorageType || '',
      InstanceCreateTime: instance.InstanceCreateTime || '',
      AvailabilityZone: instance.AvailabilityZone,
      MultiAZ: instance.MultiAZ || false,
      PubliclyAccessible: instance.PubliclyAccessible || false,
    }
  }

  async deleteDBInstance(dbInstanceIdentifier: string, options?: { skipFinalSnapshot?: boolean }): Promise<void> {
    const params: any = { DBInstanceIdentifier: dbInstanceIdentifier }
    if (options?.skipFinalSnapshot) {
      params.SkipFinalSnapshot = true
    }
    return rdsRequest('DeleteDBInstance', params)
  }

  async describeDBEngineVersions(
    engine: string,
    options?: { engineVersion?: string; maxRecords?: number }
  ): Promise<DescribeDBEngineVersionsOutput> {
    const params: any = { Engine: engine, ...options }
    return rdsRequest('DescribeDBEngineVersions', params)
  }

  async modifyDBInstance(dbInstanceIdentifier: string, modifications: object): Promise<RDSInstance> {
    const response = await rdsRequest('ModifyDBInstance', {
      DBInstanceIdentifier: dbInstanceIdentifier,
      ...modifications,
    })
    return response.DBInstance
  }

  async rebootDBInstance(dbInstanceIdentifier: string): Promise<void> {
    return rdsRequest('RebootDBInstance', { DBInstanceIdentifier: dbInstanceIdentifier })
  }
}

export const rdsService = new RDSService()

export const describeDBInstances = () => rdsService.describeDBInstances()
export const createDBInstance = (input: CreateDBInstanceInput) => rdsService.createDBInstance(input)
export const deleteDBInstance = (identifier: string, options?: { skipFinalSnapshot?: boolean }) =>
  rdsService.deleteDBInstance(identifier, options)
export const describeDBEngineVersions = (engine: string, options?: Parameters<RDSService['describeDBEngineVersions']>[1]) =>
  rdsService.describeDBEngineVersions(engine, options)
export const modifyDBInstance = (identifier: string, modifications: object) =>
  rdsService.modifyDBInstance(identifier, modifications)
export const rebootDBInstance = (identifier: string) => rdsService.rebootDBInstance(identifier)

export default rdsService