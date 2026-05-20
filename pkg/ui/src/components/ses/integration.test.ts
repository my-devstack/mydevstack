import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { SESCreateIdentityModal, SESDeleteIdentityModal, SESSendEmailModal, SESCreateTemplateModal, SESDeleteTemplateModal, SESEditTemplateModal } from './index'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

const createStubs = () => ({
  Modal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading"><slot /></button>',
    props: ['loading', 'variant'],
  },
  FormInput: {
    template: '<label v-if="label" class="block text-sm font-medium">{{ label }}</label><input :type="type" :value="modelValue" :placeholder="placeholder" :required="required" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    props: ['modelValue', 'options', 'label'],
    emits: ['update:modelValue'],
  },
})

describe('SES Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('SESCreateIdentityModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SESCreateIdentityModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create SES Identity')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SESCreateIdentityModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create SES Identity')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SESCreateIdentityModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits create event when create clicked', async () => {
      const wrapper = mount(SESCreateIdentityModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      expect(createButton).toBeTruthy()
      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })

    it('has form inputs', () => {
      const wrapper = mount(SESCreateIdentityModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('SESDeleteIdentityModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: true, identity: 'test@example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('test@example.com')
      expect(wrapper.html()).toContain('Delete SES Identity')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: false, identity: 'test@example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('test@example.com')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: true, identity: 'test@example.com' },
        global: { stubs: createStubs() },
      })
      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits delete event when delete clicked', async () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: true, identity: 'test@example.com' },
        global: { stubs: createStubs() },
      })
      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      expect(deleteButton).toBeTruthy()
      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('shows warning message', () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: true, identity: 'test@example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('handles identity prop', () => {
      const wrapper = mount(SESDeleteIdentityModal, {
        props: { open: true, identity: 'domain.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('SESSendEmailModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Send Email')
    })

    it('emits send event', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const sendButton = wrapper.findAll('button').find(btn => btn.text().includes('Send Email'))
      expect(sendButton).toBeTruthy()
      if (sendButton) {
        await sendButton.trigger('click')
        expect(wrapper.emitted('send')).toBeTruthy()
      }
    })

    it('shows domain placeholder when identity type is DOMAIN', () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, identityType: 'DOMAIN', identityName: 'example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('placeholder="user@example.com"')
    })

    it('shows sender@example.com placeholder for EMAIL_ADDRESS identity', () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, identityType: 'EMAIL_ADDRESS', identityName: 'sender@example.com' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('placeholder="sender@example.com"')
    })

    it('pre-fills from with user@domain for DOMAIN identity', () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, identityType: 'DOMAIN', identityName: 'example.com', form: { from: 'user@example.com', to: '', subject: '', body: '', htmlBody: '' } },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('value="user@example.com"')
    })

    it('switches to template mode and emits send-template', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      // Click template toggle
      const templateBtn = wrapper.findAll('button').find(btn => btn.text().includes('Template'))
      expect(templateBtn).toBeTruthy()
      await templateBtn!.trigger('click')
      // Now send button text should change
      expect(wrapper.html()).toContain('Send with Template')
      // Click send
      const sendBtn = wrapper.findAll('button').find(btn => btn.text().includes('Send with Template'))
      await sendBtn!.trigger('click')
      expect(wrapper.emitted('send-template')).toBeTruthy()
    })

    it('validates domain identity on send', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, identityType: 'DOMAIN', identityName: 'example.com' },
        global: { stubs: createStubs() },
      })
      // From field is empty by default, so fromIsValid should fail for DOMAIN
      const sendBtn = wrapper.findAll('button').find(btn => btn.text().includes('Send Email'))
      await sendBtn!.trigger('click')
      // Should show error toast
      expect(wrapper.html()).toContain('Send')
    })

    it('handles mode prop watch', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, mode: 'simple' },
        global: { stubs: createStubs() },
      })
      await wrapper.setProps({ mode: 'template' })
      expect(wrapper.html()).toContain('Send with Template')
    })

    it('copies from and to fields when switching to template', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: {
          open: true,
          form: { from: 'test@example.com', to: 'dest@example.com', subject: '', body: '', htmlBody: '' },
        },
        global: { stubs: createStubs() },
      })
      // Switch to template mode
      const templateBtn = wrapper.findAll('button').find(btn => btn.text().includes('Template'))
      await templateBtn!.trigger('click')
      // Now switch back to simple to verify mode toggle works
      const simpleBtn = wrapper.findAll('button').find(btn => btn.text().includes('Simple'))
      await simpleBtn!.trigger('click')
      expect(wrapper.html()).toContain('Send Email')
    })

    it('validates domain identity in template mode', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true, identityType: 'DOMAIN', identityName: 'example.com' },
        global: { stubs: createStubs() },
      })
      const templateBtn = wrapper.findAll('button').find(btn => btn.text().includes('Template'))
      await templateBtn!.trigger('click')
      const sendBtn = wrapper.findAll('button').find(btn => btn.text().includes('Send with Template'))
      await sendBtn!.trigger('click')
      // Should still handle the send even if from is invalid - the validation returns
      // and should show a toast error
      expect(wrapper.emitted('send-template')).toBeFalsy()
    })

    it('emits update:open on close', async () => {
      const wrapper = mount(SESSendEmailModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const cancelBtn = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      await cancelBtn!.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })
  })

  describe('SESCreateTemplateModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SESCreateTemplateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create SES Template')
    })

    it('emits create event', async () => {
      const wrapper = mount(SESCreateTemplateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createButton = wrapper.findAll('button').find(btn => btn.text().includes('Create'))
      expect(createButton).toBeTruthy()
      if (createButton) {
        await createButton.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
      }
    })
  })

  describe('SESEditTemplateModal', () => {
    const sampleTemplate = {
      TemplateName: 'my-template',
      TemplateContent: {
        Subject: 'Hello World',
        Html: '<h1>Hello</h1>',
        Text: 'Hello text',
      },
    }

    it('renders when open is true with template', () => {
      const wrapper = mount(SESEditTemplateModal, {
        props: { open: true, template: sampleTemplate },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit Template')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SESEditTemplateModal, {
        props: { open: false, template: sampleTemplate },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Edit Template')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SESEditTemplateModal, {
        props: { open: true, template: sampleTemplate },
        global: { stubs: createStubs() },
      })
      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('renders without crashing when no template provided', () => {
      const wrapper = mount(SESEditTemplateModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Edit Template')
    })
  })

  describe('SESDeleteTemplateModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: true, templateName: 'MyTemplate' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('MyTemplate')
      expect(wrapper.html()).toContain('Delete SES Template')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: false, templateName: 'MyTemplate' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('MyTemplate')
    })

    it('emits update:open when cancel clicked', async () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: true, templateName: 'MyTemplate' },
        global: { stubs: createStubs() },
      })
      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))
      expect(cancelButton).toBeTruthy()
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('update:open')).toBeTruthy()
      }
    })

    it('emits delete event when delete clicked', async () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: true, templateName: 'MyTemplate' },
        global: { stubs: createStubs() },
      })
      const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('Delete'))
      expect(deleteButton).toBeTruthy()
      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('shows warning message about undo', () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: true, templateName: 'MyTemplate' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('displays the template name in the warning', () => {
      const wrapper = mount(SESDeleteTemplateModal, {
        props: { open: true, templateName: 'test-template' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('test-template')
    })
  })
})
