import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVpcSelector } from './useVpcSelector'
import type { EC2Vpc, EC2Subnet, EC2SecurityGroup } from '@/api/types/aws'

// ── Mock API services ──────────────────────────────────────

const mockVpcs: EC2Vpc[] = [
  { VpcId: 'vpc-123', CidrBlock: '10.0.0.0/16', IsDefault: true, State: 'available' },
  { VpcId: 'vpc-456', CidrBlock: '172.16.0.0/12', IsDefault: false, State: 'available' },
]

const mockSubnets: EC2Subnet[] = [
  { SubnetId: 'subnet-a1', VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' },
  { SubnetId: 'subnet-a2', VpcId: 'vpc-123', CidrBlock: '10.0.2.0/24', AvailabilityZone: 'us-east-1b', State: 'available' },
  { SubnetId: 'subnet-b1', VpcId: 'vpc-456', CidrBlock: '172.16.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' },
]

const mockSecurityGroups: EC2SecurityGroup[] = [
  { GroupId: 'sg-111', GroupName: 'default', Description: 'Default SG', VpcId: 'vpc-123' },
  { GroupId: 'sg-222', GroupName: 'web', Description: 'Web SG', VpcId: 'vpc-123' },
  { GroupId: 'sg-333', GroupName: 'db-sg', Description: 'DB SG', VpcId: 'vpc-456' },
]

const mockDBSubnetGroups = {
  DBSubnetGroups: [
    { DBSubnetGroupName: 'db-subnet-group-1', VpcId: 'vpc-123', DBSubnetGroupDescription: 'Primary' },
    { DBSubnetGroupName: 'db-subnet-group-2', VpcId: 'vpc-456', DBSubnetGroupDescription: 'Secondary' },
  ],
}

const mockCacheSubnetGroups = {
  CacheSubnetGroups: [
    { CacheSubnetGroupName: 'cache-sg-1', VpcId: 'vpc-123', CacheSubnetGroupDescription: 'Redis SG' },
  ],
}

const mockCacheSecurityGroups = {
  CacheSecurityGroups: [
    { CacheSecurityGroupId: 'csg-001', CacheSecurityGroupName: 'cache-default', VpcId: 'vpc-123' },
  ],
}

// Lazy mocks — set per-test via vi.mocked()
vi.mock('@/api/services/vpc', () => ({
  describeVpcs: vi.fn(),
  describeSubnets: vi.fn(),
}))

vi.mock('@/api/services/ec2', () => ({
  describeSecurityGroups: vi.fn(),
}))

vi.mock('@/api/services/rds', () => ({
  describeDBSubnetGroups: vi.fn(),
}))

vi.mock('@/api/services/elasticache', () => ({
  describeCacheSubnetGroups: vi.fn(),
  describeCacheSecurityGroups: vi.fn(),
}))

import * as vpcApi from '@/api/services/vpc'
import * as rdsApi from '@/api/services/rds'
import * as elasticacheApi from '@/api/services/elasticache'

// ── Tests ──────────────────────────────────────────────────

describe('useVpcSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── VPC loading ──────────────────────────────────────────

  describe('loadVpcList', () => {
    it('loads VPCs successfully', async () => {
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })
      const { loadVpcList, vpcs, loading, error } = useVpcSelector('ec2')
      expect(loading.value).toBe(false)
      const promise = loadVpcList()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(vpcs.value).toHaveLength(2)
      expect(vpcs.value[0].VpcId).toBe('vpc-123')
    })

    it('handles VPC load failure', async () => {
      vi.mocked(vpcApi.describeVpcs).mockRejectedValue(new Error('Network error'))
      const { loadVpcList, vpcs, loading, error } = useVpcSelector('ec2')
      await loadVpcList()
      expect(loading.value).toBe(false)
      expect(error.value).toContain('Network error')
      expect(vpcs.value).toEqual([])
    })

    it('handles empty VPC list', async () => {
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: [] })
      const { loadVpcList, vpcs } = useVpcSelector('ec2')
      await loadVpcList()
      expect(vpcs.value).toEqual([])
    })
  })

  // ── Subnet loading ───────────────────────────────────────

  describe('loadSubnetList', () => {
    it('filters subnets by VPC ID for ec2 type', async () => {
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const { loadSubnetList, subnets } = useVpcSelector('ec2')
      await loadSubnetList('vpc-123')
      expect(subnets.value).toHaveLength(2)
      expect(subnets.value[0].SubnetId).toBe('subnet-a1')
      expect(subnets.value[1].SubnetId).toBe('subnet-a2')
    })

    it('filters subnets by VPC ID for msk type', async () => {
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const { loadSubnetList, subnets } = useVpcSelector('msk')
      await loadSubnetList('vpc-456')
      expect(subnets.value).toHaveLength(1)
      expect(subnets.value[0].SubnetId).toBe('subnet-b1')
    })

    it('loads DB subnet groups for rds type', async () => {
      vi.mocked(rdsApi.describeDBSubnetGroups).mockResolvedValue(mockDBSubnetGroups)
      const { loadSubnetList, subnets } = useVpcSelector('rds')
      await loadSubnetList('vpc-123')
      expect(subnets.value).toHaveLength(1)
      expect(subnets.value[0].DBSubnetGroupName).toBe('db-subnet-group-1')
    })

    it('loads cache subnet groups for elasticache type', async () => {
      vi.mocked(elasticacheApi.describeCacheSubnetGroups).mockResolvedValue(mockCacheSubnetGroups)
      const { loadSubnetList, subnets } = useVpcSelector('elasticache')
      await loadSubnetList('vpc-123')
      expect(subnets.value).toHaveLength(1)
      expect(subnets.value[0].CacheSubnetGroupName).toBe('cache-sg-1')
    })

    it('returns empty array when no subnets match VPC', async () => {
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const { loadSubnetList, subnets } = useVpcSelector('ec2')
      await loadSubnetList('vpc-nonexistent')
      expect(subnets.value).toEqual([])
    })

    it('returns empty array when no VPC ID given', async () => {
      const { loadSubnetList, subnets } = useVpcSelector('ec2')
      await loadSubnetList('')
      expect(subnets.value).toEqual([])
    })

    it('handles subnet load failure gracefully', async () => {
      vi.mocked(vpcApi.describeSubnets).mockRejectedValue(new Error('API down'))
      const { loadSubnetList, subnets, subnetsLoading } = useVpcSelector('ec2')
      await loadSubnetList('vpc-123')
      expect(subnetsLoading.value).toBe(false)
      expect(subnets.value).toEqual([])
    })
  })

  // ── Security Group loading ───────────────────────────────

  describe('loadSecurityGroupList', () => {
    it('filters SGs by VPC ID for ec2 type', async () => {
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const { loadVpcList, loadSecurityGroupList, securityGroups } = useVpcSelector('ec2')
      await loadVpcList()

      // We need to mock the ec2 module after importing
      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: mockSecurityGroups })

      await loadSecurityGroupList('vpc-123')
      expect(securityGroups.value).toHaveLength(2)
      expect(securityGroups.value[0].GroupId).toBe('sg-111')
      expect(securityGroups.value[1].GroupId).toBe('sg-222')
    })

    it('loads cache security groups for elasticache type', async () => {
      vi.mocked(elasticacheApi.describeCacheSecurityGroups).mockResolvedValue(mockCacheSecurityGroups)
      const { loadSecurityGroupList, securityGroups } = useVpcSelector('elasticache')
      await loadSecurityGroupList('vpc-123')
      expect(securityGroups.value).toHaveLength(1)
      expect(securityGroups.value[0].CacheSecurityGroupId).toBe('csg-001')
    })

    it('returns empty array when no SGs match VPC', async () => {
      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: mockSecurityGroups })
      const { loadSecurityGroupList, securityGroups } = useVpcSelector('ec2')
      await loadSecurityGroupList('vpc-nonexistent')
      expect(securityGroups.value).toEqual([])
    })

    it('returns empty array when no VPC ID given', async () => {
      const { loadSecurityGroupList, securityGroups } = useVpcSelector('ec2')
      await loadSecurityGroupList('')
      expect(securityGroups.value).toEqual([])
    })

    it('handles SG load failure gracefully', async () => {
      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockRejectedValue(new Error('SG API down'))
      const { loadSecurityGroupList, securityGroups, sgsLoading } = useVpcSelector('ec2')
      await loadSecurityGroupList('vpc-123')
      expect(sgsLoading.value).toBe(false)
      expect(securityGroups.value).toEqual([])
    })
  })

  // ── selectedVpcId watch ──────────────────────────────────

  describe('selectedVpcId watch', () => {
    it('reloads subnets and SGs when selectedVpcId changes', async () => {
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: mockSecurityGroups })

      const { selectedVpcId, subnets, securityGroups } = useVpcSelector('ec2')
      selectedVpcId.value = 'vpc-123'

      // Wait for watch to fire and async operations to complete
      await vi.waitFor(() => {
        expect(subnets.value.length).toBeGreaterThan(0)
        expect(securityGroups.value.length).toBeGreaterThan(0)
      })
    })

    it('clears subnets and SGs when selectedVpcId is cleared', async () => {
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })
      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: mockSecurityGroups })

      const { selectedVpcId, subnets, securityGroups } = useVpcSelector('ec2')
      selectedVpcId.value = 'vpc-123'
      await vi.waitFor(() => {
        expect(subnets.value.length).toBeGreaterThan(0)
      })

      selectedVpcId.value = ''
      await vi.waitFor(() => {
        expect(subnets.value).toEqual([])
        expect(securityGroups.value).toEqual([])
      })
    })
  })
})
