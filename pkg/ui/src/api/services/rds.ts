/**
 * RDS Service API Client
 * HTTP client for RDS via Go proxy
 * Uses REST-style endpoints
 * @module api/services/rds
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { RDSInstance, CreateDBInstanceInput, DescribeDBEngineVersionsOutput } from '../types/aws'

export interface DBSubnetGroup {
  DBSubnetGroupName: string
  DBSubnetGroupDescription?: string
  VpcId?: string
  SubnetGroupStatus?: string
  Subnets?: Array<{
    SubnetIdentifier: string
    SubnetAvailabilityZone: string
    SubnetStatus: string
  }>
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const fullUrl = `${endpoint}${url}`

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`RDS request failed: ${errorText}`, response.status, 'rds')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('RDS request error:', error)
    throw new APIError('Failed to call RDS service', 500, 'rds')
  }
}

export class RDSService {
  async describeDBInstances(): Promise<RDSInstance[]> {
    const response = await request<{ DBInstances?: any[] }>('/rds/db-instances', { method: 'GET' })
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
      VpcSecurityGroups: instance.VpcSecurityGroups,
      DBSubnetGroup: instance.DBSubnetGroup,
    }))
  }

  async createDBInstance(input: CreateDBInstanceInput): Promise<RDSInstance> {
    const response = await request<{ DBInstance: any }>('/rds/db-instances', {
      method: 'POST',
      body: JSON.stringify(input),
    })
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
      VpcSecurityGroups: instance.VpcSecurityGroups,
      DBSubnetGroup: instance.DBSubnetGroup,
    }
  }

  async deleteDBInstance(dbInstanceIdentifier: string, options?: { skipFinalSnapshot?: boolean }): Promise<void> {
    const body: any = {}
    if (options?.skipFinalSnapshot) {
      body.SkipFinalSnapshot = true
    }
    return request(`/rds/db-instances/${encodeURIComponent(dbInstanceIdentifier)}`, {
      method: 'DELETE',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    })
  }

  async describeDBEngineVersions(
    engine: string,
    options?: { engineVersion?: string; maxRecords?: number }
  ): Promise<DescribeDBEngineVersionsOutput> {
    const query = new URLSearchParams({ Engine: engine })
    if (options?.engineVersion) query.set('EngineVersion', options.engineVersion)
    if (options?.maxRecords !== undefined) query.set('MaxRecords', String(options.maxRecords))
    return request(`/rds/engine-versions?${query.toString()}`, { method: 'GET' })
  }

  async modifyDBInstance(dbInstanceIdentifier: string, modifications: object): Promise<RDSInstance> {
    const response = await request<{ DBInstance: any }>(`/rds/db-instances/${encodeURIComponent(dbInstanceIdentifier)}`, {
      method: 'PUT',
      body: JSON.stringify(modifications),
    })
    return response.DBInstance
  }

  async rebootDBInstance(dbInstanceIdentifier: string): Promise<void> {
    return request(`/rds/db-instances/${encodeURIComponent(dbInstanceIdentifier)}/reboot`, { method: 'POST' })
  }

  async describeDBParameterGroups(): Promise<any> {
    throw new APIError('RDS parameter groups not implemented by proxy backend', 501, 'rds')
  }

  async describeDBParameters(groupName: string): Promise<any> {
    throw new APIError('RDS parameters not implemented by proxy backend', 501, 'rds')
  }

  async describeDBSubnetGroups(): Promise<DBSubnetGroup[]> {
    const response = await request<{ DBSubnetGroups?: any[] }>('/rds/db-subnet-groups', { method: 'GET' })
    return (response.DBSubnetGroups || []).map((group: any) => ({
      DBSubnetGroupName: group.DBSubnetGroupName || '',
      DBSubnetGroupDescription: group.DBSubnetGroupDescription,
      VpcId: group.VpcId,
      SubnetGroupStatus: group.SubnetGroupStatus,
      Subnets: (group.Subnets || []).map((subnet: any) => ({
        SubnetIdentifier: subnet.SubnetIdentifier || '',
        SubnetAvailabilityZone: subnet.SubnetAvailabilityZone || '',
        SubnetStatus: subnet.SubnetStatus || '',
      })),
    }))
  }

  async listTagsForResource(resourceArn: string): Promise<any> {
    throw new APIError('RDS tags not implemented by proxy backend', 501, 'rds')
  }

  async addTagsToResource(resourceArn: string, tags: Array<{ Key: string; Value: string }>): Promise<void> {
    throw new APIError('RDS tags not implemented by proxy backend', 501, 'rds')
  }

  async removeTagsFromResource(resourceArn: string, tagKeys: string[]): Promise<void> {
    throw new APIError('RDS tags not implemented by proxy backend', 501, 'rds')
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
export const describeDBParameterGroups = () => rdsService.describeDBParameterGroups()
export const describeDBParameters = (groupName: string) => rdsService.describeDBParameters(groupName)
export const describeDBSubnetGroups = () => rdsService.describeDBSubnetGroups()
export const listTagsForResource = (arn: string) => rdsService.listTagsForResource(arn)
export const addTagsToResource = (arn: string, tags: Array<{ Key: string; Value: string }>) =>
  rdsService.addTagsToResource(arn, tags)
export const removeTagsFromResource = (arn: string, tagKeys: string[]) =>
  rdsService.removeTagsFromResource(arn, tagKeys)

export default rdsService
