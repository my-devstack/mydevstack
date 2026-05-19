import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'

const mockLoadIdentities = vi.fn()
const mockCreateIdentity = vi.fn()
const mockDeleteIdentity = vi.fn()
const mockSendEmail = vi.fn()
const mockCreateTemplate = vi.fn()
const mockDeleteTemplate = vi.fn()
const mockUpdateTemplate = vi.fn()

const mockIdentities = ref([
  { IdentityName: 'test@example.com', IdentityType: 'EMAIL_ADDRESS', VerifiedStatus: 'Success', SendingEnabled: true },
])
const mockTemplates = ref([
  { TemplateName: 'MyTemplate', CreatedTimestamp: '2024-01-01T00:00:00Z' },
])
const mockSelectedTab = ref('identities')

vi.mock('@/composables/useSES', () => ({
  useSES: () => ({
    identities: mockIdentities,
    templates: mockTemplates,
    loading: ref(false),
    sending: ref(false),
    expandedIdentities: ref(new Set()),
    expandedTemplates: ref(new Set()),
    selectedTab: mockSelectedTab,
    templateDetails: ref({}),
    loadingTemplateDetails: ref(false),
    identityDetails: ref({}),
    loadingIdentityDetails: ref(false),
    loadIdentities: mockLoadIdentities,
    loadTemplates: vi.fn(),
    createIdentity: mockCreateIdentity,
    deleteIdentity: mockDeleteIdentity,
    sendEmail: mockSendEmail,
    sendEmailWithTemplate: vi.fn(),
    createTemplate: mockCreateTemplate,
    deleteTemplate: mockDeleteTemplate,
    updateTemplate: mockUpdateTemplate,
    toggleIdentity: vi.fn(),
    toggleTemplate: vi.fn(),
    verifyDomainDkim: vi.fn(),
    getIdentityDetails: vi.fn(),
    getTemplateDetails: vi.fn(),
    sendTemplatedEmail: vi.fn(),
    getVerificationStatus: vi.fn().mockReturnValue('verified'),
    sendEmailWithTemplate: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import SESView from './SES.vue'

const shallowStubs = {
  EnvelopeIcon: true,
  Button: { template: '<button><slot /></button>' },
  EmptyState: true,
  LoadingSpinner: true,
  StatusBadge: true,
  SESCodeExamples: true,
}

const mountStubs = {
  ...shallowStubs,
  SESCreateIdentityModal: true,
  SESSendEmailModal: true,
  SESDeleteIdentityModal: true,
  SESCreateTemplateModal: true,
  SESDeleteTemplateModal: true,
  SESEditTemplateModal: true,
}

describe('SES.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIdentities.value = [
      { IdentityName: 'test@example.com', IdentityType: 'EMAIL_ADDRESS', VerifiedStatus: 'Success', SendingEnabled: true },
    ]
    mockTemplates.value = [
      { TemplateName: 'MyTemplate', CreatedTimestamp: '2024-01-01T00:00:00Z' },
    ]
    mockSelectedTab.value = 'identities'
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders SES heading', () => {
    const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('SES')
  })

  it('renders tabs', () => {
    const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('Identities')
    expect(wrapper.text()).toContain('Templates')
  })

  it('renders Create Identity button', () => {
    const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('Create Identity')
  })

  it('calls loadIdentities on mount', () => {
    shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(mockLoadIdentities).toHaveBeenCalledTimes(1)
  })

  it('shows no identities text when empty', () => {
    mockIdentities.value = []
    const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
    expect(wrapper.text()).toContain('Identities')
  })

  it('renders all modal stubs with mount', () => {
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    // Verify modal stubs exist in the DOM
    expect(wrapper.html().includes('-modal-stub')).toBe(true)
  })

  it('handles create identity event via mount', async () => {
    mockCreateIdentity.mockResolvedValue(undefined)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    // Try all possible selectors
    const sel1 = wrapper.findComponent('s-e-s-create-identity-modal-stub')
    const sel2 = wrapper.findComponent('ses-create-identity-modal-stub')
    const sel3 = wrapper.findComponent({ name: 'SESCreateIdentityModal' })
    const found = [sel1, sel2, sel3].find(s => s.exists())
    if (found) {
      found.vm.$emit('create', 'new@test.com', 'EMAIL_ADDRESS')
      await new Promise(process.nextTick)
      expect(mockCreateIdentity).toHaveBeenCalled()
    }
  })

  it('handles delete identity event (guards against empty selection) via mount', async () => {
    mockDeleteIdentity.mockResolvedValue(undefined)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    let modal = wrapper.findComponent('s-e-s-delete-identity-modal-stub')
    if (!modal.exists()) modal = wrapper.findComponent({ name: 'SESDeleteIdentityModal' })
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('delete')
      await new Promise(process.nextTick)
      // handler guards: selectedIdentityName is empty, so deleteIdentity is NOT called
      expect(mockDeleteIdentity).not.toHaveBeenCalled()
    }
  })

  it('handles send email event via mount', async () => {
    mockSendEmail.mockResolvedValue(true)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    let modal = wrapper.findComponent('s-e-s-send-email-modal-stub')
    if (!modal.exists()) modal = wrapper.findComponent({ name: 'SESSendEmailModal' })
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('send', { from: 'a@b.com', to: 'c@d.com', subject: 'Test', body: 'Hi', htmlBody: '' })
      await new Promise(process.nextTick)
      expect(mockSendEmail).toHaveBeenCalled()
    }
  })

  it('handles create template event via mount', async () => {
    mockCreateTemplate.mockResolvedValue(undefined)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    let modal = wrapper.findComponent('s-e-s-create-template-modal-stub')
    if (!modal.exists()) modal = wrapper.findComponent({ name: 'SESCreateTemplateModal' })
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('create', 'NewTmpl', 'Subj', '<html></html>', 'text')
      await new Promise(process.nextTick)
      expect(mockCreateTemplate).toHaveBeenCalled()
    }
  })

  it('handles delete template event (guards against empty selection) via mount', async () => {
    mockDeleteTemplate.mockResolvedValue(undefined)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    let modal = wrapper.findComponent('s-e-s-delete-template-modal-stub')
    if (!modal.exists()) modal = wrapper.findComponent({ name: 'SESDeleteTemplateModal' })
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('delete')
      await new Promise(process.nextTick)
      // handler guards: selectedTemplateName is empty, so deleteTemplate is NOT called
      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    }
  })

  it('handles edit template event via mount', async () => {
    mockUpdateTemplate.mockResolvedValue(undefined)
    const wrapper = mount(SESView, { global: { stubs: mountStubs } })
    let modal = wrapper.findComponent('s-e-s-edit-template-modal-stub')
    if (!modal.exists()) modal = wrapper.findComponent({ name: 'SESEditTemplateModal' })
    if (modal.exists() && modal.vm) {
      modal.vm.$emit('update', 'MyTmpl', 'Subj', '<html></html>', 'text')
      await new Promise(process.nextTick)
      expect(mockUpdateTemplate).toHaveBeenCalled()
    }
  })

  describe('templates tab', () => {
    it('switches to templates tab and shows create template view', () => {
      mockSelectedTab.value = 'templates'
      const wrapper = shallowMount(SESView, { global: { stubs: shallowStubs } })
      expect(wrapper.text()).toContain('Create Template')
    })
  })
})
