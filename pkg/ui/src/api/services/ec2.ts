/**
 * EC2 Service API Client
 * REST client for EC2 via Go proxy
 * EC2 uses AWS JSON protocol — proxy returns raw AWS SDK JSON responses
 * @module api/services/ec2
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { EC2Instance, EC2KeyPair, EC2SecurityGroup, EC2Vpc, EC2Subnet, EC2RouteTable, EC2InternetGateway, EC2NatGateway, EC2NetworkAcl, EC2FlowLog, EC2ElasticIp } from '@/api/types/aws'

const BASE_URL = `${PROXY_BACKEND.replace(/\/$/, '')}/ec2`

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const url = `${BASE_URL}${path}`
  const fetchOptions: RequestInit = { method }

  if (body !== undefined) {
    fetchOptions.headers = { 'Content-Type': 'application/json' }
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, fetchOptions)
    const responseText = await response.text()

    if (!response.ok) {
      throw new APIError(`EC2 request failed: ${responseText}`, response.status, 'ec2')
    }

    if (!responseText) {
      return {} as T
    }

    return JSON.parse(responseText) as T
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('EC2 request error:', error)
    throw new APIError(`Failed to ${method} ${path}`, 500, 'ec2')
  }
}

// Instances

export interface DescribeInstancesResponse {
  Reservations?: Array<{
    Groups?: Array<{ GroupId: string; GroupName: string }>
    Instances?: EC2Instance[]
    OwnerId?: string
    RequesterId?: string
    ReservationId?: string
  }>
  NextToken?: string
}

export async function describeInstances(params?: {
  InstanceIds?: string[]
  MaxResults?: number
  NextToken?: string
}): Promise<DescribeInstancesResponse> {
  const queryParts: string[] = []
  if (params?.InstanceIds?.length) {
    params.InstanceIds.forEach((id) => queryParts.push(`InstanceId=${encodeURIComponent(id)}`))
  }
  if (params?.MaxResults) queryParts.push(`MaxResults=${params.MaxResults}`)
  if (params?.NextToken) queryParts.push(`NextToken=${encodeURIComponent(params.NextToken)}`)
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return request<DescribeInstancesResponse>('GET', `/instances${qs}`)
}

export async function runInstances(params: {
  ImageId: string
  InstanceType: string
  KeyName?: string
  SecurityGroupIds?: string[]
  SubnetId?: string
  MinCount?: number
  MaxCount?: number
}): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', '/instances', params)
}

export async function terminateInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('DELETE', `/instances/${encodeURIComponent(instanceId)}`)
}

export async function startInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', `/instances/${encodeURIComponent(instanceId)}/start`)
}

export async function stopInstance(instanceId: string): Promise<{ Instances: EC2Instance[] }> {
  return request<{ Instances: EC2Instance[] }>('POST', `/instances/${encodeURIComponent(instanceId)}/stop`)
}

// Key Pairs

export interface DescribeKeyPairsResponse {
  KeyPairs: EC2KeyPair[]
}

export async function describeKeyPairs(): Promise<DescribeKeyPairsResponse> {
  return request<DescribeKeyPairsResponse>('GET', '/key-pairs')
}

export async function createKeyPair(keyName: string): Promise<EC2KeyPair & { KeyMaterial?: string }> {
  return request<EC2KeyPair & { KeyMaterial?: string }>('POST', '/key-pairs', { KeyName: keyName })
}

export async function importKeyPair(keyName: string, publicKeyMaterial: string): Promise<EC2KeyPair> {
  return request<EC2KeyPair>('POST', '/key-pairs/import', { KeyName: keyName, PublicKeyMaterial: publicKeyMaterial })
}

export async function deleteKeyPair(keyName: string): Promise<void> {
  await request<Record<string, never>>('DELETE', `/key-pairs/${encodeURIComponent(keyName)}`)
}

// Security Groups

export interface DescribeSecurityGroupsResponse {
  SecurityGroups: EC2SecurityGroup[]
}

export async function describeSecurityGroups(): Promise<DescribeSecurityGroupsResponse> {
  return request<DescribeSecurityGroupsResponse>('GET', '/security-groups')
}

export async function createSecurityGroup(params: {
  GroupName: string
  Description: string
  VpcId?: string
}): Promise<{ GroupId: string }> {
  return request<{ GroupId: string }>('POST', '/security-groups', params)
}

export async function deleteSecurityGroup(groupId: string): Promise<void> {
  await request<Record<string, never>>('DELETE', `/security-groups/${encodeURIComponent(groupId)}`)
}

export async function authorizeSecurityGroupIngress(
  groupId: string,
  params: {
    IpProtocol: string
    FromPort?: number
    ToPort?: number
    CidrIp?: string
  },
): Promise<void> {
  await request<Record<string, never>>('POST', `/security-groups/${encodeURIComponent(groupId)}/ingress`, params)
}

// VPCs

export interface DescribeVpcsResponse {
  Vpcs: EC2Vpc[]
}

export async function describeVpcs(): Promise<DescribeVpcsResponse> {
  return request<DescribeVpcsResponse>('GET', '/vpcs')
}

// Subnets

export interface DescribeSubnetsResponse {
  Subnets: EC2Subnet[]
}

export async function describeSubnets(): Promise<DescribeSubnetsResponse> {
  return request<DescribeSubnetsResponse>('GET', '/subnets')
}

// VPC Responses
export interface DescribeRouteTablesResponse {
  RouteTables: EC2RouteTable[]
}

export interface DescribeInternetGatewaysResponse {
  InternetGateways: EC2InternetGateway[]
}

export interface DescribeNatGatewaysResponse {
  NatGateways: EC2NatGateway[]
}

export interface DescribeNetworkAclsResponse {
  NetworkAcls: EC2NetworkAcl[]
}

export interface DescribeFlowLogsResponse {
  FlowLogs: EC2FlowLog[]
  Unsupported?: boolean
}

export interface DescribeAddressesResponse {
  Addresses: EC2ElasticIp[]
}

// VPCs
export async function createVpc(params: { CidrBlock: string }): Promise<EC2Vpc> {
  return request<EC2Vpc>('POST', '/vpcs', params)
}

export async function deleteVpc(vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/vpcs/${encodeURIComponent(vpcId)}`)
}

// Subnets
export async function createSubnet(params: { VpcId: string; CidrBlock: string; AvailabilityZone?: string }): Promise<EC2Subnet> {
  return request<EC2Subnet>('POST', '/subnets', params)
}

export async function deleteSubnet(subnetId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/subnets/${encodeURIComponent(subnetId)}`)
}

// Route Tables
export async function createRouteTable(params: { VpcId: string }): Promise<EC2RouteTable> {
  return request<EC2RouteTable>('POST', '/route-tables', params)
}

export async function deleteRouteTable(rtbId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/route-tables/${encodeURIComponent(rtbId)}`)
}

export async function describeRouteTables(): Promise<DescribeRouteTablesResponse> {
  return request<DescribeRouteTablesResponse>('GET', '/route-tables')
}

export async function createRoute(rtbId: string, params: { DestinationCidrBlock: string; GatewayId?: string; NatGatewayId?: string }): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/route-tables/${encodeURIComponent(rtbId)}/routes`, params)
}

export async function deleteRoute(rtbId: string, cidr: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/route-tables/${encodeURIComponent(rtbId)}/routes/${encodeURIComponent(cidr)}`)
}

export async function associateRouteTable(rtbId: string, subnetId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/route-tables/${encodeURIComponent(rtbId)}/associate`, { SubnetId: subnetId })
}

export async function disassociateRouteTable(associationId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/route-tables/${encodeURIComponent(associationId)}/disassociate`)
}

// Internet Gateways
export async function createInternetGateway(): Promise<EC2InternetGateway> {
  return request<EC2InternetGateway>('POST', '/internet-gateways')
}

export async function deleteInternetGateway(igwId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/internet-gateways/${encodeURIComponent(igwId)}`)
}

export async function describeInternetGateways(): Promise<DescribeInternetGatewaysResponse> {
  return request<DescribeInternetGatewaysResponse>('GET', '/internet-gateways')
}

export async function attachInternetGateway(igwId: string, vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/internet-gateways/${encodeURIComponent(igwId)}/attach`, { VpcId: vpcId })
}

export async function detachInternetGateway(igwId: string, vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/internet-gateways/${encodeURIComponent(igwId)}/detach`, { VpcId: vpcId })
}

// NAT Gateways
export async function createNatGateway(params: { SubnetId: string; AllocationId: string }): Promise<EC2NatGateway> {
  return request<EC2NatGateway>('POST', '/nat-gateways', params)
}

export async function deleteNatGateway(natGwId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/nat-gateways/${encodeURIComponent(natGwId)}`)
}

export async function describeNatGateways(): Promise<DescribeNatGatewaysResponse> {
  return request<DescribeNatGatewaysResponse>('GET', '/nat-gateways')
}

// Network ACLs
export async function createNetworkAcl(params: { VpcId: string }): Promise<EC2NetworkAcl> {
  return request<EC2NetworkAcl>('POST', '/network-acls', params)
}

export async function deleteNetworkAcl(naclId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/network-acls/${encodeURIComponent(naclId)}`)
}

export async function describeNetworkAcls(): Promise<DescribeNetworkAclsResponse> {
  return request<DescribeNetworkAclsResponse>('GET', '/network-acls')
}

export async function createNetworkAclEntry(naclId: string, params: {
  RuleNumber: number
  Protocol: string
  PortRange?: { From: number; To: number }
  CidrBlock: string
  Egress: boolean
  RuleAction: 'allow' | 'deny'
}): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/network-acls/${encodeURIComponent(naclId)}/entries`, params)
}

export async function deleteNetworkAclEntry(naclId: string, ruleNumber: number): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/network-acls/${encodeURIComponent(naclId)}/entries/${ruleNumber}`)
}

// Flow Logs
export async function createFlowLogs(params: {
  ResourceId: string
  LogDestinationType: string
  LogDestination: string
  TrafficType: string
}): Promise<EC2FlowLog> {
  return request<EC2FlowLog>('POST', '/flow-logs', params)
}

export async function deleteFlowLogs(flowLogId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/flow-logs/${encodeURIComponent(flowLogId)}`)
}

export async function describeFlowLogs(): Promise<DescribeFlowLogsResponse> {
  return request<DescribeFlowLogsResponse>('GET', '/flow-logs')
}

// Elastic IPs
export async function allocateElasticIp(): Promise<EC2ElasticIp> {
  return request<EC2ElasticIp>('POST', '/elastic-ips')
}

export async function releaseElasticIp(allocationId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/elastic-ips/${encodeURIComponent(allocationId)}`)
}

export async function describeAddresses(): Promise<DescribeAddressesResponse> {
  return request<DescribeAddressesResponse>('GET', '/elastic-ips')
}

export default {
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
}
