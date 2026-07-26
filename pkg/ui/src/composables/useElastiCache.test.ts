import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useElastiCache } from './useElastiCache'

vi.mock('@/api/services/elasticache', () => ({
  describeReplicationGroups: vi.fn(),
  createReplicationGroup: vi.fn(),
  deleteReplicationGroup: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  })),
}))

import * as elasticacheApi from '@/api/services/elasticache'

describe('useElastiCache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { groups, loading, expandedGroups, showCreateModal, showDeleteConfirm, createForm } = useElastiCache()
    expect(groups.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(expandedGroups.value).toEqual(new Set())
    expect(showCreateModal.value).toBe(false)
    expect(showDeleteConfirm.value).toBe(false)
    expect(createForm.value.vpcSelection).toBeNull()
  })

  it('loadGroups success', async () => {
    const mockGroups = [
      { ReplicationGroupId: 'my-cache', Status: 'available', Engine: 'valkey' },
      { ReplicationGroupId: 'another-cache', Status: 'creating', Engine: 'redis' },
    ]
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue(mockGroups)

    const { loadGroups, groups, loading } = useElastiCache()
    
    await loadGroups()
    
    expect(elasticacheApi.describeReplicationGroups).toHaveBeenCalled()
    expect(groups.value).toHaveLength(2)
    expect(groups.value[0].ReplicationGroupId).toBe('my-cache')
    expect(loading.value).toBe(false)
  })

  it('loadGroups handles error', async () => {
    vi.mocked(elasticacheApi.describeReplicationGroups).mockRejectedValue(new Error('Network error'))

    const { loadGroups, loading, groups } = useElastiCache()
    
    await loadGroups()
    
    expect(loading.value).toBe(false)
    expect(groups.value).toEqual([])
  })

  it('createGroup validates required ID', async () => {
    const { createGroup, creating } = useElastiCache()
    creating.value = false
    
    await createGroup()
    
    expect(creating.value).toBe(false)
    expect(elasticacheApi.createReplicationGroup).not.toHaveBeenCalled()
  })

  it('createGroup calls API and reloads on success', async () => {
    vi.mocked(elasticacheApi.createReplicationGroup).mockResolvedValue({})
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue([])

    const { createGroup, createForm, creating } = useElastiCache()
    createForm.value.ReplicationGroupId = 'test-cache'
    creating.value = false
    
    await createGroup()
    
    expect(elasticacheApi.createReplicationGroup).toHaveBeenCalledWith({
      ReplicationGroupId: 'test-cache',
      ReplicationGroupDescription: 'My cache cluster',
      CacheNodeType: 'cache.t3.micro',
      Engine: 'valkey',
      NumNodeGroups: 1,
      Port: 6379,
    })
    expect(elasticacheApi.describeReplicationGroups).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('createGroup includes VPC fields when vpcSelection is set', async () => {
    vi.mocked(elasticacheApi.createReplicationGroup).mockResolvedValue({})
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue([])

    const { createGroup, createForm, creating } = useElastiCache()
    createForm.value.ReplicationGroupId = 'test-cache-vpc'
    createForm.value.vpcSelection = {
      vpcId: 'vpc-123',
      subnetIds: ['my-cache-subnet-group'],
      securityGroupIds: ['sg-456', 'sg-789'],
    }
    creating.value = false

    await createGroup()

    expect(elasticacheApi.createReplicationGroup).toHaveBeenCalledWith({
      ReplicationGroupId: 'test-cache-vpc',
      ReplicationGroupDescription: 'My cache cluster',
      CacheNodeType: 'cache.t3.micro',
      Engine: 'valkey',
      NumNodeGroups: 1,
      Port: 6379,
      CacheSubnetGroupName: 'my-cache-subnet-group',
      SecurityGroupIds: ['sg-456', 'sg-789'],
    })
    expect(creating.value).toBe(false)
  })

  it('createGroup excludes VPC fields when vpcSelection is null', async () => {
    vi.mocked(elasticacheApi.createReplicationGroup).mockResolvedValue({})
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue([])

    const { createGroup, createForm, creating } = useElastiCache()
    createForm.value.ReplicationGroupId = 'test-cache-no-vpc'
    createForm.value.vpcSelection = null
    creating.value = false

    await createGroup()

    const calledWith = vi.mocked(elasticacheApi.createReplicationGroup).mock.calls[0][0]
    expect(calledWith.CacheSubnetGroupName).toBeUndefined()
    expect(calledWith.SecurityGroupIds).toBeUndefined()
    expect(creating.value).toBe(false)
  })

  it('deleteGroup calls API and removes from list', async () => {
    vi.mocked(elasticacheApi.deleteReplicationGroup).mockResolvedValue({})
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue([])

    const { deleteGroup, groupToDelete, groups, expandedGroups } = useElastiCache()
    groups.value = [{ ReplicationGroupId: 'test-cache', Status: 'available', Engine: 'valkey' }]
    expandedGroups.value.add('test-cache')
    groupToDelete.value = { ReplicationGroupId: 'test-cache', Status: 'available', Engine: 'valkey' }
    
    await deleteGroup()
    
    expect(elasticacheApi.deleteReplicationGroup).toHaveBeenCalledWith('test-cache')
    expect(groups.value).toHaveLength(0)
    expect(expandedGroups.value.has('test-cache')).toBe(false)
  })

  it('deleteGroup returns early if no group selected', async () => {
    const { deleteGroup, groupToDelete } = useElastiCache()
    groupToDelete.value = null
    
    await deleteGroup()
    
    expect(elasticacheApi.deleteReplicationGroup).not.toHaveBeenCalled()
  })

  it('toggleGroup adds to expanded', () => {
    const { toggleGroup, expandedGroups } = useElastiCache()
    
    toggleGroup('test-cache')
    
    expect(expandedGroups.value.has('test-cache')).toBe(true)
  })

  it('toggleGroup removes from expanded when already expanded', () => {
    const { toggleGroup, expandedGroups } = useElastiCache()
    expandedGroups.value.add('test-cache')
    
    toggleGroup('test-cache')
    
    expect(expandedGroups.value.has('test-cache')).toBe(false)
  })

  it('confirmDelete sets group and opens modal', () => {
    const { confirmDelete, groupToDelete, showDeleteConfirm } = useElastiCache()
    const group = { ReplicationGroupId: 'test-cache', Status: 'available', Engine: 'valkey' }
    
    confirmDelete(group)
    
    expect(groupToDelete.value).toEqual(group)
    expect(showDeleteConfirm.value).toBe(true)
  })

  it('resetForm resets createForm', () => {
    const { resetForm, createForm } = useElastiCache()
    createForm.value.ReplicationGroupId = 'test-cache'
    createForm.value.Engine = 'redis'
    createForm.value.NumNodeGroups = 5
    createForm.value.vpcSelection = {
      vpcId: 'vpc-123',
      subnetIds: ['my-subnet'],
      securityGroupIds: ['sg-456'],
    }
    
    resetForm()
    
    expect(createForm.value.ReplicationGroupId).toBe('')
    expect(createForm.value.Engine).toBe('valkey')
    expect(createForm.value.NumNodeGroups).toBe(1)
    expect(createForm.value.vpcSelection).toBeNull()
  })

  describe('getStatus', () => {
    it('maps available to active', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('available')).toBe('active')
    })

    it('maps creating to pending', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('creating')).toBe('pending')
    })

    it('maps running to active', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('running')).toBe('active')
    })

    it('maps deleted to inactive', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('deleted')).toBe('inactive')
    })

    it('maps uppercase status', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('AVAILABLE')).toBe('active')
    })

    it('returns inactive for unknown status', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('unknown-status')).toBe('inactive')
    })

    it('handles empty status', () => {
      const { getStatus } = useElastiCache()
      expect(getStatus('')).toBe('inactive')
    })
  })

  it('codeExamples generates content', () => {
    const { codeExamples } = useElastiCache()
    
    expect(codeExamples.value).toHaveLength(4)
    expect(codeExamples.value[0].language).toBe('aws-cli')
    expect(codeExamples.value[1].language).toBe('javascript')
    expect(codeExamples.value[2].language).toBe('python')
    expect(codeExamples.value[3].language).toBe('go')
  })
})