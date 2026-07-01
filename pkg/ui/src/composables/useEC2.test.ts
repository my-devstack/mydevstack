import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEC2 } from './useEC2'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    emulator: '',
  })),
}))

vi.mock('@/api/services/ec2', () => ({
  describeInstances: vi.fn(),
  runInstances: vi.fn(),
  terminateInstance: vi.fn(),
  startInstance: vi.fn(),
  stopInstance: vi.fn(),
  describeKeyPairs: vi.fn(),
  createKeyPair: vi.fn(),
  importKeyPair: vi.fn(),
  deleteKeyPair: vi.fn(),
  describeSecurityGroups: vi.fn(),
  createSecurityGroup: vi.fn(),
  deleteSecurityGroup: vi.fn(),
  authorizeSecurityGroupIngress: vi.fn(),
  describeVpcs: vi.fn(),
  describeSubnets: vi.fn(),
}))

import * as ec2Api from '@/api/services/ec2'

describe('useEC2', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const {
        instances, keyPairs, securityGroups, vpcs, subnets,
        loading, expandedInstances, expandedKeyPairs, expandedSecurityGroups,
        showCreateModal, showDeleteConfirm, showKeyPairModal, showSecurityGroupModal,
      } = useEC2()

      expect(instances.value).toEqual([])
      expect(keyPairs.value).toEqual([])
      expect(securityGroups.value).toEqual([])
      expect(vpcs.value).toEqual([])
      expect(subnets.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(expandedInstances.value).toEqual(new Set())
      expect(expandedKeyPairs.value).toEqual(new Set())
      expect(expandedSecurityGroups.value).toEqual(new Set())
      expect(showCreateModal.value).toBe(false)
      expect(showDeleteConfirm.value).toBe(false)
      expect(showKeyPairModal.value).toBe(false)
      expect(showSecurityGroupModal.value).toBe(false)
    })
  })

  describe('loadAll', () => {
    it('loads all resources in parallel', async () => {
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [] })
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })
      vi.mocked(ec2Api.describeVpcs).mockResolvedValue({ Vpcs: [] })
      vi.mocked(ec2Api.describeSubnets).mockResolvedValue({ Subnets: [] })

      const { loadAll } = useEC2()
      await loadAll()

      expect(ec2Api.describeInstances).toHaveBeenCalled()
      expect(ec2Api.describeKeyPairs).toHaveBeenCalled()
      expect(ec2Api.describeSecurityGroups).toHaveBeenCalled()
      expect(ec2Api.describeVpcs).toHaveBeenCalled()
      expect(ec2Api.describeSubnets).toHaveBeenCalled()
    })
  })

  describe('instances', () => {
    it('loadInstances collects instances from reservations', async () => {
      const mockInstances = [
        { InstanceId: 'i-1', InstanceType: 't2.micro', ImageId: 'ami-abc' },
        { InstanceId: 'i-2', InstanceType: 't2.small', ImageId: 'ami-def' },
      ]
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({
        Reservations: [
          { Instances: [mockInstances[0]] },
          { Instances: [mockInstances[1]] },
        ],
      })

      const { loadInstances, instances, loading } = useEC2()
      expect(loading.value).toBe(false)
      await loadInstances()
      expect(instances.value).toHaveLength(2)
      expect(instances.value[0].InstanceId).toBe('i-1')
      expect(loading.value).toBe(false)
    })

    it('loadInstances handles error', async () => {
      vi.mocked(ec2Api.describeInstances).mockRejectedValue(new Error('API error'))
      const { loadInstances, instances } = useEC2()
      await loadInstances()
      expect(instances.value).toEqual([])
    })

    it('runInstance validates required ImageId', async () => {
      const { runInstance, creating, createForm } = useEC2()
      createForm.value.ImageId = ''
      await runInstance()
      expect(creating.value).toBe(false)
      expect(ec2Api.runInstances).not.toHaveBeenCalled()
    })

    it('runInstance calls API and reloads on success', async () => {
      vi.mocked(ec2Api.runInstances).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })

      const { runInstance, createForm, creating } = useEC2()
      createForm.value.ImageId = 'ami-abc'
      await runInstance()
      expect(ec2Api.runInstances).toHaveBeenCalled()
      expect(ec2Api.describeInstances).toHaveBeenCalled()
      expect(creating.value).toBe(false)
    })

    it('terminateInstance removes from list', async () => {
      vi.mocked(ec2Api.terminateInstance).mockResolvedValue({ Instances: [] })
      const { terminateInstance, itemToDelete, instances, expandedInstances } = useEC2()
      instances.value = [{ InstanceId: 'i-1', ImageId: 'ami-abc', InstanceType: 't2.micro' }]
      expandedInstances.value.add('i-1')
      itemToDelete.value = { InstanceId: 'i-1' }
      await terminateInstance()
      expect(ec2Api.terminateInstance).toHaveBeenCalledWith('i-1')
      expect(instances.value).toHaveLength(0)
      expect(expandedInstances.value.has('i-1')).toBe(false)
    })

    it('terminateInstance returns early if no item', async () => {
      const { terminateInstance } = useEC2()
      await terminateInstance()
      expect(ec2Api.terminateInstance).not.toHaveBeenCalled()
    })

    it('startInstance calls API', async () => {
      vi.mocked(ec2Api.startInstance).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      const { startInstance } = useEC2()
      await startInstance('i-1')
      expect(ec2Api.startInstance).toHaveBeenCalledWith('i-1')
    })

    it('stopInstance calls API', async () => {
      vi.mocked(ec2Api.stopInstance).mockResolvedValue({ Instances: [] })
      vi.mocked(ec2Api.describeInstances).mockResolvedValue({ Reservations: [] })
      const { stopInstance } = useEC2()
      await stopInstance('i-1')
      expect(ec2Api.stopInstance).toHaveBeenCalledWith('i-1')
    })
  })

  describe('key pairs', () => {
    it('createKeyPair calls API and reloads', async () => {
      vi.mocked(ec2Api.createKeyPair).mockResolvedValue({
        KeyName: 'my-key', KeyFingerprint: 'ab:cd', KeyMaterial: 'ssh-rsa ...',
      })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [{ KeyName: 'my-key', KeyFingerprint: 'ab:cd' }] })
      const { createKeyPair } = useEC2()
      const result = await createKeyPair('my-key')
      expect(ec2Api.createKeyPair).toHaveBeenCalledWith('my-key')
      expect(result.KeyName).toBe('my-key')
    })

    it('importKeyPair calls API and reloads', async () => {
      vi.mocked(ec2Api.importKeyPair).mockResolvedValue({ KeyName: 'imported', KeyFingerprint: 'ef:gh' })
      vi.mocked(ec2Api.describeKeyPairs).mockResolvedValue({ KeyPairs: [] })
      const { importKeyPair } = useEC2()
      await importKeyPair('imported', 'ssh-rsa AAA...')
      expect(ec2Api.importKeyPair).toHaveBeenCalledWith('imported', 'ssh-rsa AAA...')
    })

    it('deleteKeyPair removes from list', async () => {
      vi.mocked(ec2Api.deleteKeyPair).mockResolvedValue()
      const { deleteKeyPair, itemToDelete, keyPairs } = useEC2()
      keyPairs.value = [{ KeyName: 'my-key', KeyFingerprint: 'ab:cd' }]
      itemToDelete.value = { KeyName: 'my-key' }
      await deleteKeyPair()
      expect(ec2Api.deleteKeyPair).toHaveBeenCalledWith('my-key')
      expect(keyPairs.value).toHaveLength(0)
    })
  })

  describe('security groups', () => {
    it('createSecurityGroup with ingress rules', async () => {
      vi.mocked(ec2Api.createSecurityGroup).mockResolvedValue({ GroupId: 'sg-new' })
      vi.mocked(ec2Api.authorizeSecurityGroupIngress).mockResolvedValue()
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })

      const { createSecurityGroup } = useEC2()
      await createSecurityGroup({
        GroupName: 'web',
        Description: 'Web SG',
        IngressRules: [{ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }],
      })
      expect(ec2Api.createSecurityGroup).toHaveBeenCalledWith({
        GroupName: 'web', Description: 'Web SG', VpcId: undefined,
      })
      expect(ec2Api.authorizeSecurityGroupIngress).toHaveBeenCalled()
    })

    it('deleteSecurityGroup removes from list', async () => {
      vi.mocked(ec2Api.deleteSecurityGroup).mockResolvedValue()
      const { deleteSecurityGroup, itemToDelete, securityGroups } = useEC2()
      securityGroups.value = [{ GroupId: 'sg-1', GroupName: 'default', Description: 'default', VpcId: 'vpc-1' }]
      itemToDelete.value = { GroupId: 'sg-1' }
      await deleteSecurityGroup()
      expect(ec2Api.deleteSecurityGroup).toHaveBeenCalledWith('sg-1')
      expect(securityGroups.value).toHaveLength(0)
    })

    it('authorizeIngress calls API', async () => {
      vi.mocked(ec2Api.authorizeSecurityGroupIngress).mockResolvedValue()
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: [] })
      const { authorizeIngress } = useEC2()
      await authorizeIngress('sg-1', { IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
      expect(ec2Api.authorizeSecurityGroupIngress).toHaveBeenCalled()
    })
  })

  describe('toggle functions', () => {
    it('toggleInstances adds and removes', () => {
      const { toggleInstances, expandedInstances } = useEC2()
      toggleInstances('i-1')
      expect(expandedInstances.value.has('i-1')).toBe(true)
      toggleInstances('i-1')
      expect(expandedInstances.value.has('i-1')).toBe(false)
    })

    it('toggleKeyPairs adds and removes', () => {
      const { toggleKeyPairs, expandedKeyPairs } = useEC2()
      toggleKeyPairs('my-key')
      expect(expandedKeyPairs.value.has('my-key')).toBe(true)
      toggleKeyPairs('my-key')
      expect(expandedKeyPairs.value.has('my-key')).toBe(false)
    })

    it('toggleSecurityGroups adds and removes', () => {
      const { toggleSecurityGroups, expandedSecurityGroups } = useEC2()
      toggleSecurityGroups('sg-1')
      expect(expandedSecurityGroups.value.has('sg-1')).toBe(true)
      toggleSecurityGroups('sg-1')
      expect(expandedSecurityGroups.value.has('sg-1')).toBe(false)
    })
  })

  describe('confirmDelete', () => {
    it('sets item and type and opens modal', () => {
      const { confirmDelete, itemToDelete, deleteType, showDeleteConfirm } = useEC2()
      const item = { InstanceId: 'i-1' }
      confirmDelete(item, 'instance')
      expect(itemToDelete.value).toEqual(item)
      expect(deleteType.value).toBe('instance')
      expect(showDeleteConfirm.value).toBe(true)
    })
  })

  describe('getStatus', () => {
    it('maps running to active', () => {
      const { getStatus } = useEC2()
      expect(getStatus('running')).toBe('active')
    })

    it('maps pending to pending', () => {
      const { getStatus } = useEC2()
      expect(getStatus('pending')).toBe('pending')
    })

    it('maps stopped to inactive', () => {
      const { getStatus } = useEC2()
      expect(getStatus('stopped')).toBe('inactive')
    })

    it('maps terminated to inactive', () => {
      const { getStatus } = useEC2()
      expect(getStatus('terminated')).toBe('inactive')
    })

    it('handles uppercase', () => {
      const { getStatus } = useEC2()
      expect(getStatus('RUNNING')).toBe('active')
    })

    it('returns inactive for unknown', () => {
      const { getStatus } = useEC2()
      expect(getStatus('unknown')).toBe('inactive')
    })
  })

  describe('resetForm', () => {
    it('resets to defaults', () => {
      const { resetForm, createForm } = useEC2()
      createForm.value.ImageId = 'changed'
      createForm.value.InstanceType = 't3.large'
      resetForm()
      expect(createForm.value.ImageId).toBe('ami-0abcdef1234567890')
      expect(createForm.value.InstanceType).toBe('t2.micro')
      expect(createForm.value.MinCount).toBe(1)
      expect(createForm.value.MaxCount).toBe(1)
    })
  })

  describe('codeExamples', () => {
    it('generates 4 code examples', () => {
      const { codeExamples } = useEC2()
      expect(codeExamples.value).toHaveLength(4)
      expect(codeExamples.value[0].language).toBe('aws-cli')
      expect(codeExamples.value[1].language).toBe('javascript')
      expect(codeExamples.value[2].language).toBe('python')
      expect(codeExamples.value[3].language).toBe('go')
    })
  })
})
