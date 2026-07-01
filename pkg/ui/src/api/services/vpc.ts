/**
 * VPC Service API Client
 * REST client for VPC via Go proxy
 * @module api/services/vpc
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'
import type { EC2Vpc, EC2Subnet, EC2RouteTable, EC2InternetGateway, EC2NatGateway, EC2NetworkAcl, EC2FlowLog, EC2ElasticIp } from '@/api/types/aws'

const BASE_URL = `${PROXY_BACKEND.replace(/\/$/, '')}/vpc`

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
      throw new APIError(`VPC request failed: ${responseText}`, response.status, 'vpc')
    }

    if (!responseText) {
      return {} as T
    }

    return JSON.parse(responseText) as T
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error('VPC request error:', error)
    throw new APIError(`Failed to ${method} ${path}`, 500, 'vpc')
  }
}

// VPCs
export interface DescribeVpcsResponse {
  Vpcs: EC2Vpc[]
}

export async function describeVpcs(): Promise<DescribeVpcsResponse> {
  return request<DescribeVpcsResponse>('GET', '/vpcs')
}

export async function createVpc(params: { CidrBlock: string }): Promise<EC2Vpc> {
  return request<EC2Vpc>('POST', '/vpcs', params)
}

export async function deleteVpc(vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/vpcs/${encodeURIComponent(vpcId)}`)
}

// Subnets
export interface DescribeSubnetsResponse {
  Subnets: EC2Subnet[]
}

export async function describeSubnets(): Promise<DescribeSubnetsResponse> {
  return request<DescribeSubnetsResponse>('GET', '/subnets')
}

export async function createSubnet(params: { VpcId: string; CidrBlock: string; AvailabilityZone?: string }): Promise<EC2Subnet> {
  return request<EC2Subnet>('POST', '/subnets', params)
}

export async function deleteSubnet(subnetId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/subnets/${encodeURIComponent(subnetId)}`)
}

// Route Tables
export interface DescribeRouteTablesResponse {
  RouteTables: EC2RouteTable[]
}

export async function describeRouteTables(): Promise<DescribeRouteTablesResponse> {
  return request<DescribeRouteTablesResponse>('GET', '/route-tables')
}

export async function createRouteTable(params: { VpcId: string }): Promise<EC2RouteTable> {
  return request<EC2RouteTable>('POST', '/route-tables', params)
}

export async function deleteRouteTable(rtbId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/route-tables/${encodeURIComponent(rtbId)}`)
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
export interface DescribeInternetGatewaysResponse {
  InternetGateways: EC2InternetGateway[]
}

export async function describeInternetGateways(): Promise<DescribeInternetGatewaysResponse> {
  return request<DescribeInternetGatewaysResponse>('GET', '/internet-gateways')
}

export async function createInternetGateway(): Promise<EC2InternetGateway> {
  return request<EC2InternetGateway>('POST', '/internet-gateways')
}

export async function deleteInternetGateway(igwId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/internet-gateways/${encodeURIComponent(igwId)}`)
}

export async function attachInternetGateway(igwId: string, vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/internet-gateways/${encodeURIComponent(igwId)}/attach`, { VpcId: vpcId })
}

export async function detachInternetGateway(igwId: string, vpcId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', `/internet-gateways/${encodeURIComponent(igwId)}/detach`, { VpcId: vpcId })
}

// NAT Gateways
export interface DescribeNatGatewaysResponse {
  NatGateways: EC2NatGateway[]
}

export async function describeNatGateways(): Promise<DescribeNatGatewaysResponse> {
  return request<DescribeNatGatewaysResponse>('GET', '/nat-gateways')
}

export async function createNatGateway(params: { SubnetId: string; AllocationId: string }): Promise<EC2NatGateway> {
  return request<EC2NatGateway>('POST', '/nat-gateways', params)
}

export async function deleteNatGateway(natGwId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/nat-gateways/${encodeURIComponent(natGwId)}`)
}

// Network ACLs
export interface DescribeNetworkAclsResponse {
  NetworkAcls: EC2NetworkAcl[]
}

export async function describeNetworkAcls(): Promise<DescribeNetworkAclsResponse> {
  return request<DescribeNetworkAclsResponse>('GET', '/network-acls')
}

export async function createNetworkAcl(params: { VpcId: string }): Promise<EC2NetworkAcl> {
  return request<EC2NetworkAcl>('POST', '/network-acls', params)
}

export async function deleteNetworkAcl(naclId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/network-acls/${encodeURIComponent(naclId)}`)
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
export interface DescribeFlowLogsResponse {
  FlowLogs: EC2FlowLog[]
  Unsupported?: boolean
}

export async function describeFlowLogs(): Promise<DescribeFlowLogsResponse> {
  return request<DescribeFlowLogsResponse>('GET', '/flow-logs')
}

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

// Elastic IPs
export interface DescribeAddressesResponse {
  Addresses: EC2ElasticIp[]
}

export async function describeAddresses(): Promise<DescribeAddressesResponse> {
  return request<DescribeAddressesResponse>('GET', '/elastic-ips')
}

export async function allocateElasticIp(): Promise<EC2ElasticIp> {
  return request<EC2ElasticIp>('POST', '/elastic-ips')
}

export async function releaseElasticIp(allocationId: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('DELETE', `/elastic-ips/${encodeURIComponent(allocationId)}`)
}

export default {
  describeVpcs,
  createVpc,
  deleteVpc,
  describeSubnets,
  createSubnet,
  deleteSubnet,
  describeRouteTables,
  createRouteTable,
  deleteRouteTable,
  createRoute,
  deleteRoute,
  associateRouteTable,
  disassociateRouteTable,
  describeInternetGateways,
  createInternetGateway,
  deleteInternetGateway,
  attachInternetGateway,
  detachInternetGateway,
  describeNatGateways,
  createNatGateway,
  deleteNatGateway,
  describeNetworkAcls,
  createNetworkAcl,
  deleteNetworkAcl,
  createNetworkAclEntry,
  deleteNetworkAclEntry,
  describeFlowLogs,
  createFlowLogs,
  deleteFlowLogs,
  describeAddresses,
  allocateElasticIp,
  releaseElasticIp,
}
