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
})
