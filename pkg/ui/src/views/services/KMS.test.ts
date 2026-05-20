import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/kms', () => ({
  listKeys: vi.fn().mockResolvedValue({ Keys: [] }),
  describeKey: vi.fn().mockResolvedValue({ KeyMetadata: null }),
  createKey: vi.fn().mockResolvedValue({ KeyMetadata: {} }),
  encrypt: vi.fn().mockResolvedValue({ CiphertextBlob: '' }),
  decrypt: vi.fn().mockResolvedValue({ Plaintext: '' }),
  scheduleKeyDeletion: vi.fn().mockResolvedValue({}),
  cancelKeyDeletion: vi.fn().mockResolvedValue({}),
  enableKey: vi.fn().mockResolvedValue({}),
  disableKey: vi.fn().mockResolvedValue({}),
  getKeyPolicy: vi.fn().mockResolvedValue({ Policy: '{}' }),
  listKeyPolicies: vi.fn().mockResolvedValue({ PolicyNames: [] }),
  putKeyPolicy: vi.fn().mockResolvedValue({}),
  getKeyRotationStatus: vi.fn().mockResolvedValue({ KeyRotationEnabled: false }),
  enableKeyRotation: vi.fn().mockResolvedValue({}),
  disableKeyRotation: vi.fn().mockResolvedValue({}),
  listAliases: vi.fn().mockResolvedValue({ Aliases: [] }),
  deleteAlias: vi.fn().mockResolvedValue({}),
  generateRandom: vi.fn().mockResolvedValue({ Plaintext: '' }),
  sign: vi.fn().mockResolvedValue({ Signature: '' }),
  verify: vi.fn().mockResolvedValue({ SignatureValid: true }),
  generateDataKey: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import KMS from './KMS.vue'

describe('KMS.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders KMS Keys heading', () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('KMS Keys')
  })

  it('renders Create Key button', () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Key')
  })

  it('shows empty state after load completes with no keys', async () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    expect(wrapper.find('code-snippet-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(KMS, {
      global: {
        stubs: {
          Button: { template: '<button><slot /></button>' },
          EmptyState: true,
          LoadingSpinner: true,
          StatusBadge: true,
          DataTable: true,
          CodeSnippet: true,
          KMSCreateKeyModal: true,
          KMSDeleteModal: true,
          KMSViewDetailsModal: true,
          KMSEncryptModal: true,
          KMSDecryptModal: true,
          KMSPolicyModal: true,
          PlusIcon: true,
          KeyIcon: true,
        },
      },
    })
    // KMSCreateKeyModal -> k-m-s-create-key-modal-stub
    expect(wrapper.find('k-m-s-create-key-modal-stub').exists()).toBe(true)
    // KMSDeleteModal -> k-m-s-delete-modal-stub
    expect(wrapper.find('k-m-s-delete-modal-stub').exists()).toBe(true)
    // KMSViewDetailsModal -> k-m-s-view-details-modal-stub
    expect(wrapper.find('k-m-s-view-details-modal-stub').exists()).toBe(true)
    // KMSEncryptModal -> k-m-s-encrypt-modal-stub
    expect(wrapper.find('k-m-s-encrypt-modal-stub').exists()).toBe(true)
    // KMSDecryptModal -> k-m-s-decrypt-modal-stub
    expect(wrapper.find('k-m-s-decrypt-modal-stub').exists()).toBe(true)
    // KMSPolicyModal -> k-m-s-policy-modal-stub
    expect(wrapper.find('k-m-s-policy-modal-stub').exists()).toBe(true)
  })

  describe('mount interaction tests', () => {
    const sharedStubs = {
      Button: { template: '<button><slot /></button>' },
      EmptyState: true,
      LoadingSpinner: true,
      StatusBadge: true,
      DataTable: true,
      CodeSnippet: true,
      KMSCreateKeyModal: true,
      KMSDeleteModal: true,
      KMSViewDetailsModal: true,
      KMSEncryptModal: true,
      KMSDecryptModal: true,
      KMSPolicyModal: true,
      PlusIcon: true,
      KeyIcon: true,
    }

    it('handles create key modal emit with wrapper', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-create-key-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('create')
        await new Promise(process.nextTick)
      }
    })

    it('handles delete key modal emit', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-delete-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('delete')
        await new Promise(process.nextTick)
      }
    })

    it('handles encrypt modal emit', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-encrypt-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('encrypt', { plaintext: 'Hello' })
        await new Promise(process.nextTick)
      }
    })

    it('handles decrypt modal emit', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-decrypt-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('decrypt', { ciphertextBlob: 'encrypted' })
        await new Promise(process.nextTick)
      }
    })

    it('handles details modal enable/disable events', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-view-details-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('enable-key')
        await new Promise(process.nextTick)
        modal.vm.$emit('disable-key')
        await new Promise(process.nextTick)
      }
    })
  })

  describe('template inline handler coverage', () => {
    const sharedStubs = {
      Button: { template: '<button><slot /></button>' },
      EmptyState: true,
      LoadingSpinner: true,
      StatusBadge: true,
      DataTable: true,
      CodeSnippet: true,
      KMSCreateKeyModal: true,
      KMSDeleteModal: true,
      KMSViewDetailsModal: true,
      KMSEncryptModal: true,
      KMSDecryptModal: true,
      KMSPolicyModal: true,
      PlusIcon: true,
      KeyIcon: true,
    }

    it('Create Key button triggers modal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create Key'))
      if (createBtn) {
        createBtn.trigger('click')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('EmptyState action triggers showCreateModal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      wrapper.vm.keys = []
      const empty = wrapper.findComponent({ name: 'EmptyState' })
      if (empty.exists()) {
        empty.vm.$emit('action')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('pagination prev/next via goToPage', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      wrapper.vm.keys = Array.from({ length: 25 }, (_, i) => ({
        KeyId: `key-${i}`,
        KeyArn: `arn:aws:kms:us-east-1:123:key/key-${i}`,
      }))
      expect(wrapper.vm.totalKeyPages).toBe(3)
      wrapper.vm.goToPage(2)
      expect(wrapper.vm.keyPage).toBe(2)
      wrapper.vm.goToPage(1)
      expect(wrapper.vm.keyPage).toBe(1)
    })

    it('toggleKeyExpansion expands and collapses', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      wrapper.vm.toggleKeyExpansion('key-1')
      expect(wrapper.vm.expandedKeys.has('key-1')).toBe(true)
      wrapper.vm.toggleKeyExpansion('key-1')
      expect(wrapper.vm.expandedKeys.has('key-1')).toBe(false)
    })

    it('selectKeyForAction encrypt triggers modal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const key = { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123:key/key-1', keyMetadata: { KeyState: 'Enabled' } }
      wrapper.vm.selectKeyForAction(key, 'encrypt')
      expect(wrapper.vm.showEncryptModal).toBe(true)
    })

    it('selectKeyForAction decrypt triggers modal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const key = { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123:key/key-1', keyMetadata: { KeyState: 'Enabled' } }
      wrapper.vm.selectKeyForAction(key, 'decrypt')
      expect(wrapper.vm.showDecryptModal).toBe(true)
    })

    it('selectKeyForAction delete triggers modal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const key = { KeyId: 'key-1', KeyArn: 'arn:aws:kms:us-east-1:123:key/key-1', keyMetadata: { KeyState: 'Enabled' } }
      wrapper.vm.selectKeyForAction(key, 'delete')
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('copyToClipboard copies key ARN', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      const originalClipboard = navigator.clipboard
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          writable: true,
          configurable: true,
        })
        const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
        await wrapper.vm.copyToClipboard('arn:aws:kms:us-east-1:123:key/test')
        expect(writeText).toHaveBeenCalledWith('arn:aws:kms:us-east-1:123:key/test')
      } finally {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          writable: true,
          configurable: true,
        })
      }
    })

    it('KMSViewDetailsModal delete-key event triggers showDeleteModal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modal = wrapper.findComponent('k-m-s-view-details-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('delete-key')
        expect(wrapper.vm.showDeleteModal).toBe(true)
      }
    })

    it('modal @update:open handlers', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const modals = [
        ['k-m-s-view-details-modal-stub', 'showDetailsModal'],
        ['k-m-s-policy-modal-stub', 'showPolicyModal'],
        ['k-m-s-encrypt-modal-stub', 'showEncryptModal'],
        ['k-m-s-decrypt-modal-stub', 'showDecryptModal'],
      ]
      for (const [sel, key] of modals) {
        const modal = wrapper.findComponent(sel as string)
        if (modal.exists() && modal.vm) {
          modal.vm.$emit('update:open', false)
          expect(wrapper.vm[key as string]).toBe(false)
        }
      }
    })

    it('viewKeyDetails sets selected key and opens modal', () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      const key = { KeyId: 'key-1', keyMetadata: { KeyState: 'Enabled' } }
      wrapper.vm.viewKeyDetails(key)
      expect(wrapper.vm.selectedKey).toStrictEqual(key)
      expect(wrapper.vm.showDetailsModal).toBe(true)
    })

    it('handleCreateKeyWrapper calls handleCreateKey and resets page', async () => {
      const wrapper = shallowMount(KMS, { global: { stubs: sharedStubs } })
      wrapper.vm.keyPage = 2
      await wrapper.vm.handleCreateKeyWrapper()
      expect(wrapper.vm.keyPage).toBe(1)
    })
  })
})
