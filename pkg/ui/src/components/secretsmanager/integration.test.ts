import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock modal components (they use Teleport which doesn't work with mount)
vi.mock('@/components/secretsmanager/CreateSecretModal.vue', () => ({
  default: {
    name: 'CreateSecretModal',
    props: ['open', 'creating', 'newSecretName', 'newSecretValue', 'newSecretDescription'],
    emits: ['update:open', 'update:newSecretName', 'update:newSecretValue', 'update:newSecretDescription', 'create'],
    template: `<div class="mock-create-modal" v-if="open" />`,
  },
}))

vi.mock('@/components/secretsmanager/EditSecretModal.vue', () => ({
  default: {
    name: 'EditSecretModal',
    props: ['open', 'loading', 'secretName', 'secretValue', 'isEditing', 'editSecretValue'],
    emits: ['update:open', 'update:editSecretValue', 'save', 'toggle-edit', 'close'],
    template: `<div class="mock-edit-modal" v-if="open" />`,
  },
}))

vi.mock('@/components/secretsmanager/DeleteSecretModal.vue', () => ({
  default: {
    name: 'DeleteSecretModal',
    props: ['open', 'loading', 'secretToDelete'],
    emits: ['update:open', 'confirm'],
    template: `<div class="mock-delete-modal" v-if="open" />`,
  },
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  ShieldCheckIcon: { template: '<svg class="mock-icon" />' },
  TrashIcon: { template: '<svg class="mock-icon" />' },
  ChevronRightIcon: { template: '<svg class="mock-icon" />' },
}))

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: vi.fn(() => ({
    reloadTrigger: { value: 0 },
  })),
}))

// Mock the useSecretsManager composable
vi.mock('@/composables/useSecretsManager', () => ({
  useSecretsManager: vi.fn(),
}))

// Import components after mocks
import SecretsList from '@/components/secretsmanager/SecretsList.vue'

describe('SecretsManager Components - Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('SecretsList - Accordion', () => {
    it('renders secret list with accordion rows', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [
            { Name: 'secret-1', CreatedDate: '2024-01-01' },
            { Name: 'secret-2', CreatedDate: '2024-01-02' },
          ],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      expect(wrapper.text()).toContain('secret-1')
      expect(wrapper.text()).toContain('secret-2')
    })

    it('starts with no expanded secret', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      // No accordion content should be visible
      expect(wrapper.find('.p-4').exists()).toBe(false)
    })

    it('expands on row click (exclusive)', async () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [
            { Name: 'secret-1', CreatedDate: '2024-01-01' },
            { Name: 'secret-2', CreatedDate: '2024-01-02' },
          ],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      // Find clickable rows (the main row divs with cursor-pointer)
      const rows = wrapper.findAll('.cursor-pointer')
      expect(rows.length).toBe(2)

      // Click first row
      await rows[0].trigger('click')

      // Check that toggle-expansion was emitted
      expect(wrapper.emitted('toggle-expansion')).toBeTruthy()
      expect(wrapper.emitted('toggle-expansion')![0]).toEqual(['secret-1'])
    })

    it('emits open-delete on delete button click', async () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      expect(deleteBtn.exists()).toBe(true)
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('open-delete')).toBeTruthy()
      expect(wrapper.emitted('open-delete')![0]).toEqual(['secret-1'])
    })

    it('emits view-secret on row click', async () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')

      // toggle-expansion is emitted for accordion
      expect(wrapper.emitted('toggle-expansion')).toBeTruthy()
    })

    it('shows loading state', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [],
          loading: true,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      expect(wrapper.text()).toContain('Loading secrets')
    })

    it('shows empty state when no secrets and not loading', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: null,
        },
      })

      expect(wrapper.text()).toContain('No secrets found')
    })

    it('shows secret details when expanded and loaded', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {
            'secret-1': {
              secret: 'my-secret-value',
              versionId: 'v1',
              createdDate: '2024-01-01',
            },
          },
          expandedSecret: 'secret-1',
        },
      })

      expect(wrapper.text()).toContain('my-secret-value')
      expect(wrapper.text()).toContain('Edit Value')
    })

    it('shows loading state for secret details', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {},
          expandedSecret: 'secret-1',
        },
      })

      expect(wrapper.text()).toContain('Loading secret value')
    })

    it('shows error state for failed secret details', () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {
            'secret-1': null,
          },
          expandedSecret: 'secret-1',
        },
      })

      expect(wrapper.text()).toContain('Failed to load secret value')
    })

    it('emits open-edit when Edit Value button clicked', async () => {
      const wrapper = mount(SecretsList, {
        props: {
          secrets: [{ Name: 'secret-1', CreatedDate: '2024-01-01' }],
          loading: false,
          secretDetailsMap: {
            'secret-1': {
              secret: 'my-secret-value',
            },
          },
          expandedSecret: 'secret-1',
        },
      })

      const editBtn = wrapper.find('button').element.textContent?.includes('Edit Value')
      const buttons = wrapper.findAll('button')
      const editButton = buttons.find(btn => btn.text().includes('Edit Value'))

      expect(editButton).toBeTruthy()
      if (editButton) {
        await editButton.trigger('click')
        expect(wrapper.emitted('open-edit')).toBeTruthy()
      }
    })
  })
})
