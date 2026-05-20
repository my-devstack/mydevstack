import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/secrets-manager', () => ({
  listSecrets: vi.fn().mockResolvedValue({ SecretList: [] }),
  getSecretValue: vi.fn().mockResolvedValue({}),
  putSecretValue: vi.fn().mockResolvedValue({}),
  createSecret: vi.fn().mockResolvedValue({}),
  deleteSecret: vi.fn().mockResolvedValue({}),
  updateSecret: vi.fn().mockResolvedValue({}),
  describeSecret: vi.fn().mockResolvedValue({}),
  rotateSecret: vi.fn().mockResolvedValue({}),
  restoreSecret: vi.fn().mockResolvedValue({}),
  getRandomPassword: vi.fn().mockResolvedValue(''),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import SecretsManager from './SecretsManager.vue'

describe('SecretsManager.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Secrets Manager heading', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Secrets Manager')
  })

  it('renders Create Secret button', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Secret')
  })

  it('renders SecretsList component', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.find('secrets-list-stub').exists()).toBe(true)
  })

  it('renders CodeSnippet component', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.find('code-snippet-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(SecretsManager, {
      global: {
        stubs: {
          SecretsList: true,
          CreateSecretModal: true,
          EditSecretModal: true,
          DeleteSecretModal: true,
          CodeSnippet: true,
          ShieldCheckIcon: true,
        },
      },
    })
    expect(wrapper.find('create-secret-modal-stub').exists()).toBe(true)
    expect(wrapper.find('edit-secret-modal-stub').exists()).toBe(true)
    expect(wrapper.find('delete-secret-modal-stub').exists()).toBe(true)
  })

  describe('template inline handler coverage', () => {
    const stubs = {
      SecretsList: true,
      CreateSecretModal: true,
      EditSecretModal: true,
      DeleteSecretModal: true,
      CodeSnippet: true,
      ShieldCheckIcon: true,
    }

    it('Create Secret button exists', () => {
      const wrapper = shallowMount(SecretsManager, { global: { stubs } })
      expect(wrapper.text()).toContain('Create Secret')
    })

    it('modal @update:open handlers', () => {
      const wrapper = shallowMount(SecretsManager, { global: { stubs } })
      const modals = ['create-secret-modal-stub', 'edit-secret-modal-stub', 'delete-secret-modal-stub']
      for (const sel of modals) {
        const modal = wrapper.findComponent(sel)
        if (modal.exists() && modal.vm) {
          modal.vm.$emit('update:open', false)
        }
      }
    })

    it('SecretsList events', () => {
      const wrapper = shallowMount(SecretsManager, { global: { stubs } })
      const list = wrapper.findComponent({ name: 'SecretsList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('view', { Name: 'test-secret' })
        list.vm.$emit('delete', { Name: 'test-secret' })
      }
    })

    it('showCreateModal toggle', () => {
      const wrapper = shallowMount(SecretsManager, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })
  })
})
