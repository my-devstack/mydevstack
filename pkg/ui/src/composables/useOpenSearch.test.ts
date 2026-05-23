import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOpenSearch } from './useOpenSearch'
import { useSettingsStore } from '@/stores/settings'

const mockDescribeDomain = vi.fn()
const mockListTags = vi.fn()
const mockGetCompatibleVersions = vi.fn()
const mockTagResource = vi.fn()
const mockUntagResource = vi.fn()

vi.mock('@/api/services/opensearch', () => ({
  listDomainNames: vi.fn(),
  createDomain: vi.fn(),
  deleteDomain: vi.fn(),
  describeDomain: (...args: any[]) => mockDescribeDomain(...args),
  listTags: (...args: any[]) => mockListTags(...args),
  getCompatibleVersions: (...args: any[]) => mockGetCompatibleVersions(...args),
  tagResource: (...args: any[]) => mockTagResource(...args),
  untagResource: (...args: any[]) => mockUntagResource(...args),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    emulator: '',
    accessKey: 'test-key',
    secretKey: 'test-secret',
  })),
}))

import * as openSearchApi from '@/api/services/opensearch'

describe('useOpenSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { domains, loading, isAvailable, expandedDomains, showCreateModal, showDeleteConfirm } = useOpenSearch()
    expect(domains.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(isAvailable.value).toBe(true)
    expect(expandedDomains.value).toEqual(new Set())
    expect(showCreateModal.value).toBe(false)
    expect(showDeleteConfirm.value).toBe(false)
  })

  it('loadDomains success', async () => {
    const mockDomains = [
      { DomainName: 'my-domain', EngineVersion: 'OpenSearch_2.13' },
      { DomainName: 'another-domain', EngineVersion: 'OpenSearch_2.11' },
    ]
    vi.mocked(openSearchApi.listDomainNames).mockResolvedValue(mockDomains)

    const { loadDomains, domains, loading } = useOpenSearch()

    await loadDomains()

    expect(openSearchApi.listDomainNames).toHaveBeenCalled()
    expect(domains.value).toHaveLength(2)
    expect(domains.value[0].DomainName).toBe('my-domain')
    expect(loading.value).toBe(false)
  })

  it('loadDomains handles error', async () => {
    vi.mocked(openSearchApi.listDomainNames).mockRejectedValue(new Error('Network error'))

    const { loadDomains, loading, domains, isAvailable } = useOpenSearch()

    await loadDomains()

    expect(loading.value).toBe(false)
    expect(domains.value).toEqual([])
    expect(isAvailable.value).toBe(false)
  })

  it('skips API call and sets unavailable when emulator is ministack', async () => {
    vi.mocked(useSettingsStore).mockReturnValueOnce({
      region: 'us-east-1',
      emulator: 'MINISTACK',
      accessKey: 'test-key',
      secretKey: 'test-secret',
    })

    const { loadDomains, domains, loading, isAvailable } = useOpenSearch()

    await loadDomains()

    expect(openSearchApi.listDomainNames).not.toHaveBeenCalled()
    expect(domains.value).toEqual([])
    expect(isAvailable.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('createDomain validates required name', async () => {
    const { createDomain, creating } = useOpenSearch()
    creating.value = false

    await createDomain()

    expect(creating.value).toBe(false)
    expect(openSearchApi.createDomain).not.toHaveBeenCalled()
  })

  it('createDomain calls API and reloads on success', async () => {
    vi.mocked(openSearchApi.createDomain).mockResolvedValue({})
    vi.mocked(openSearchApi.listDomainNames).mockResolvedValue([])

    const { createDomain, createForm, creating } = useOpenSearch()
    createForm.value.DomainName = 'test-domain'
    creating.value = false

    await createDomain()

    expect(openSearchApi.createDomain).toHaveBeenCalledWith({
      DomainName: 'test-domain',
      EngineVersion: 'OpenSearch_2.13',
      ClusterConfig: {
        InstanceType: 't3.medium.search',
        InstanceCount: 1,
        DedicatedMasterEnabled: false,
        ZoneAwarenessEnabled: false,
      },
      EBSOptions: {
        EBSEnabled: true,
        VolumeType: 'gp2',
        VolumeSize: 10,
      },
    })
    expect(openSearchApi.listDomainNames).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('deleteDomain calls API and removes from list', async () => {
    vi.mocked(openSearchApi.deleteDomain).mockResolvedValue({})
    vi.mocked(openSearchApi.listDomainNames).mockResolvedValue([])

    const { deleteDomain, domainToDelete, domains, expandedDomains, domainDetails } = useOpenSearch()
    domains.value = [{ DomainName: 'test-domain', EngineVersion: 'OpenSearch_2.13' }]
    expandedDomains.value.add('test-domain')
    domainToDelete.value = { DomainName: 'test-domain', EngineVersion: 'OpenSearch_2.13' }

    await deleteDomain()

    expect(openSearchApi.deleteDomain).toHaveBeenCalledWith('test-domain')
    expect(domains.value).toHaveLength(0)
    expect(expandedDomains.value.has('test-domain')).toBe(false)
    expect(domainDetails.value['test-domain']).toBeUndefined()
  })

  it('deleteDomain returns early if no domain selected', async () => {
    const { deleteDomain, domainToDelete } = useOpenSearch()
    domainToDelete.value = null

    await deleteDomain()

    expect(openSearchApi.deleteDomain).not.toHaveBeenCalled()
  })

  it('toggleDomain adds to expanded and triggers loadDomainDetails', async () => {
    mockDescribeDomain.mockResolvedValue({ DomainStatus: { EngineVersion: 'OpenSearch_2.13', ARN: 'arn:test' } })
    mockListTags.mockResolvedValue({ TagList: [{ Key: 'Env', Value: 'test' }] })

    const { toggleDomain, expandedDomains, domainDetails } = useOpenSearch()

    toggleDomain('test-domain')

    expect(expandedDomains.value.has('test-domain')).toBe(true)
    // Wait for async loadDomainDetails
    await vi.waitFor(() => {
      expect(domainDetails.value['test-domain']).toBeDefined()
    })
    expect(mockDescribeDomain).toHaveBeenCalledWith('test-domain')
    expect(mockListTags).toHaveBeenCalledWith('arn:test')
  })

  it('toggleDomain removes from expanded when already expanded', () => {
    const { toggleDomain, expandedDomains } = useOpenSearch()
    expandedDomains.value.add('test-domain')

    toggleDomain('test-domain')

    expect(expandedDomains.value.has('test-domain')).toBe(false)
  })

  it('toggleDomain does not reload if already loaded', async () => {
    const { toggleDomain, expandedDomains, domainDetails } = useOpenSearch()
    domainDetails.value['test-domain'] = { EngineVersion: 'OpenSearch_2.13' }
    mockDescribeDomain.mockClear()

    toggleDomain('test-domain')
    expect(expandedDomains.value.has('test-domain')).toBe(true)
    expect(mockDescribeDomain).not.toHaveBeenCalled()
  })

  it('loadDomainDetails success', async () => {
    mockDescribeDomain.mockResolvedValue({
      DomainStatus: {
        EngineVersion: 'OpenSearch_2.13',
        ARN: 'arn:aws:es:us-east-1:123456789012:domain/test-domain',
        ClusterConfig: { InstanceType: 'r6g.large.search', InstanceCount: 2 },
      },
    })
    mockListTags.mockResolvedValue({ TagList: [{ Key: 'Env', Value: 'production' }] })

    const { loadDomainDetails, domainDetails, loadingDomainDetails } = useOpenSearch()

    await loadDomainDetails('test-domain')

    expect(domainDetails.value['test-domain'].EngineVersion).toBe('OpenSearch_2.13')
    expect(domainDetails.value['test-domain'].ClusterConfig.InstanceType).toBe('r6g.large.search')
    expect(domainDetails.value['test-domain'].Tags).toEqual([{ Key: 'Env', Value: 'production' }])
    expect(loadingDomainDetails.value['test-domain']).toBe(false)
  })

  it('loadDomainDetails handles error', async () => {
    mockDescribeDomain.mockRejectedValue(new Error('API error'))

    const { loadDomainDetails, domainDetails, loadingDomainDetails } = useOpenSearch()

    await loadDomainDetails('test-domain')

    expect(domainDetails.value['test-domain']).toBeUndefined()
    expect(loadingDomainDetails.value['test-domain']).toBe(false)
  })

  it('loadDomainDetails handles listTags error gracefully', async () => {
    mockDescribeDomain.mockResolvedValue({
      DomainStatus: {
        EngineVersion: 'OpenSearch_2.13',
        ARN: 'arn:test',
      },
    })
    mockListTags.mockRejectedValue(new Error('Tags API error'))

    const { loadDomainDetails, domainDetails } = useOpenSearch()

    await loadDomainDetails('test-domain')

    expect(domainDetails.value['test-domain'].EngineVersion).toBe('OpenSearch_2.13')
    // Tags should not be set but should not throw
    expect(domainDetails.value['test-domain'].Tags).toBeUndefined()
  })

  it('loadCompatibleVersions success', async () => {
    mockGetCompatibleVersions.mockResolvedValue({
      CompatibleVersions: [
        { SourceVersion: 'OpenSearch_2.13', TargetVersions: ['OpenSearch_2.15'] },
      ],
    })

    const { loadCompatibleVersions, compatibleVersions, loadingCompatibleVersions } = useOpenSearch()

    await loadCompatibleVersions()

    expect(compatibleVersions.value).toHaveLength(1)
    expect(loadingCompatibleVersions.value).toBe(false)
  })

  it('loadCompatibleVersions handles error', async () => {
    mockGetCompatibleVersions.mockRejectedValue(new Error('API error'))

    const { loadCompatibleVersions, compatibleVersions, loadingCompatibleVersions } = useOpenSearch()

    await loadCompatibleVersions()

    expect(compatibleVersions.value).toEqual([])
    expect(loadingCompatibleVersions.value).toBe(false)
  })

  it('getDomainTags returns tags from domainDetails', () => {
    const { getDomainTags, domainDetails } = useOpenSearch()
    domainDetails.value['test-domain'] = { Tags: [{ Key: 'Env', Value: 'prod' }] }

    const tags = getDomainTags('test-domain')
    expect(tags).toEqual([{ Key: 'Env', Value: 'prod' }])
  })

  it('getDomainTags returns tags from domains list if no details', () => {
    const { getDomainTags, domains } = useOpenSearch()
    domains.value = [{ DomainName: 'test-domain', TagList: [{ Key: 'Name', Value: 'test' }] }]

    const tags = getDomainTags('test-domain')
    expect(tags).toEqual([{ Key: 'Name', Value: 'test' }])
  })

  it('getDomainTags returns empty array if no tags', () => {
    const { getDomainTags } = useOpenSearch()

    const tags = getDomainTags('unknown')
    expect(tags).toEqual([])
  })

  it('getCompatibleVersionFor returns matching versions', () => {
    const { getCompatibleVersionFor, compatibleVersions } = useOpenSearch()
    compatibleVersions.value = [
      { SourceVersion: 'OpenSearch_2.13', TargetVersions: ['OpenSearch_2.15'] },
    ]

    const versions = getCompatibleVersionFor('OpenSearch_2.13')
    expect(versions).toEqual(['OpenSearch_2.15'])
  })

  it('getCompatibleVersionFor returns empty if no match', () => {
    const { getCompatibleVersionFor, compatibleVersions } = useOpenSearch()
    compatibleVersions.value = [
      { SourceVersion: 'OpenSearch_2.13', TargetVersions: ['OpenSearch_2.15'] },
    ]

    const versions = getCompatibleVersionFor('OpenSearch_1.0')
    expect(versions).toEqual([])
  })

  it('getCompatibleVersionFor returns empty if no versions loaded', () => {
    const { getCompatibleVersionFor } = useOpenSearch()

    const versions = getCompatibleVersionFor('OpenSearch_2.13')
    expect(versions).toEqual([])
  })

  it('confirmDelete sets domain and opens modal', () => {
    const { confirmDelete, domainToDelete, showDeleteConfirm } = useOpenSearch()
    const domain = { DomainName: 'test-domain', EngineVersion: 'OpenSearch_2.13' }

    confirmDelete(domain)

    expect(domainToDelete.value).toEqual(domain)
    expect(showDeleteConfirm.value).toBe(true)
  })

  it('resetForm resets createForm', () => {
    const { resetForm, createForm } = useOpenSearch()
    createForm.value.DomainName = 'test-domain'
    createForm.value.EngineVersion = 'OpenSearch_2.11'
    createForm.value.ClusterConfig = { InstanceType: 'm5.large.search', InstanceCount: 3, DedicatedMasterEnabled: true, ZoneAwarenessEnabled: true }

    resetForm()

    expect(createForm.value.DomainName).toBe('')
    expect(createForm.value.EngineVersion).toBe('OpenSearch_2.13')
    expect(createForm.value.ClusterConfig?.InstanceType).toBe('t3.medium.search')
    expect(createForm.value.ClusterConfig?.InstanceCount).toBe(1)
  })

  describe('getStatus', () => {
    it('maps active to active', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('active')).toBe('active')
    })

    it('maps creating to pending', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('creating')).toBe('pending')
    })

    it('maps processing to pending', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('processing')).toBe('pending')
    })

    it('maps deleted to error', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('deleted')).toBe('error')
    })

    it('maps uppercase status', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('ACTIVE')).toBe('active')
    })

    it('returns inactive for unknown status', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('unknown-status')).toBe('inactive')
    })

    it('handles empty status', () => {
      const { getStatus } = useOpenSearch()
      expect(getStatus('')).toBe('inactive')
    })
  })

  describe('addDomainTag', () => {
    it('calls tagResource and reloads details', async () => {
      mockTagResource.mockResolvedValue({})
      mockDescribeDomain.mockResolvedValue({
        DomainStatus: { EngineVersion: 'OpenSearch_2.13', ARN: 'arn:test' },
      })

      const { addDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = { ARN: 'arn:test' }

      await addDomainTag('test-domain', 'Env', 'prod')

      expect(mockTagResource).toHaveBeenCalledWith('arn:test', 'Env', 'prod')
      expect(mockDescribeDomain).toHaveBeenCalledWith('test-domain')
    })

    it('shows error if no ARN', async () => {
      const { addDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = {}

      await addDomainTag('test-domain', 'Env', 'prod')

      expect(mockTagResource).not.toHaveBeenCalled()
    })

    it('handles API error', async () => {
      mockTagResource.mockRejectedValue(new Error('Tag API error'))

      const { addDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = { ARN: 'arn:test' }

      await addDomainTag('test-domain', 'Env', 'prod')

      expect(mockTagResource).toHaveBeenCalledWith('arn:test', 'Env', 'prod')
    })
  })

  describe('removeDomainTag', () => {
    it('calls untagResource and reloads details', async () => {
      mockUntagResource.mockResolvedValue({})
      mockDescribeDomain.mockResolvedValue({
        DomainStatus: { EngineVersion: 'OpenSearch_2.13', ARN: 'arn:test' },
      })

      const { removeDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = { ARN: 'arn:test' }

      await removeDomainTag('test-domain', 'Env')

      expect(mockUntagResource).toHaveBeenCalledWith('arn:test', 'Env')
      expect(mockDescribeDomain).toHaveBeenCalledWith('test-domain')
    })

    it('shows error if no ARN', async () => {
      const { removeDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = {}

      await removeDomainTag('test-domain', 'Env')

      expect(mockUntagResource).not.toHaveBeenCalled()
    })

    it('handles API error', async () => {
      mockUntagResource.mockRejectedValue(new Error('Untag API error'))

      const { removeDomainTag, domainDetails } = useOpenSearch()
      domainDetails.value['test-domain'] = { ARN: 'arn:test' }

      await removeDomainTag('test-domain', 'Env')

      expect(mockUntagResource).toHaveBeenCalledWith('arn:test', 'Env')
    })
  })

  it('codeExamples generates content', () => {
    const { codeExamples } = useOpenSearch()

    expect(codeExamples.value).toHaveLength(4)
    expect(codeExamples.value[0].language).toBe('aws-cli')
    expect(codeExamples.value[1].language).toBe('javascript')
    expect(codeExamples.value[2].language).toBe('python')
    expect(codeExamples.value[3].language).toBe('go')
  })
})
