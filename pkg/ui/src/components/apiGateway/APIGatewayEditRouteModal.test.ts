import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayEditRouteModal from './APIGatewayEditRouteModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot name="title" /><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant', 'size', 'loading', 'disabled'],
}
const formInputStub = {
  template: '<div>{{ label }}<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
  props: ['modelValue', 'label', 'placeholder', 'helpText'],
}
const formSelectStub = {
  template:
    '<div>{{ label }}<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select></div>',
  props: ['modelValue', 'label', 'options', 'placeholder'],
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, FormSelect: formSelectStub }

function mountModal(props: Record<string, unknown>) {
  return mount(APIGatewayEditRouteModal, {
    props: { open: true, routeKey: '', ...props },
    global: { stubs },
  })
}

function saveButton(wrapper: any) {
  return wrapper.findAll('button').find((b: any) => b.text().includes('Save'))
}

describe('APIGatewayEditRouteModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mountModal({ routeKey: 'GET /items' })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('pre-fills route key when mounted with open=true (v-if pattern)', () => {
    const wrapper = mountModal({ routeKey: 'GET /items', target: 'https://example.com', integrations: [] })
    const inputs = wrapper.findAll('input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('GET /items')
  })

  it('pre-fills integration target and selects Existing Integration type', () => {
    const wrapper = mountModal({
      routeKey: 'GET /items',
      target: 'integrations/int-1',
      integrations: ['int-1', 'int-2'],
    })
    const selects = wrapper.findAll('select')
    // selects: [targetType, integration, authorization]
    expect((selects[0].element as HTMLSelectElement).value).toBe('integration')
    expect((selects[1].element as HTMLSelectElement).value).toBe('int-1')
  })

  it('pre-fills http proxy target', () => {
    const wrapper = mountModal({ routeKey: 'GET /items', target: 'https://old.example.com', integrations: [] })
    const selects = wrapper.findAll('select')
    expect((selects[0].element as HTMLSelectElement).value).toBe('http')
    const inputs = wrapper.findAll('input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('https://old.example.com')
  })

  it('emits update with integrations/{id} target on save', async () => {
    const wrapper = mountModal({
      routeKey: 'GET /items',
      target: 'integrations/int-1',
      integrations: ['int-1', 'int-2'],
      authorizationType: 'NONE',
    })
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual(['GET /items', 'integrations/int-1', 'NONE', ''])
  })

  it('emits update with newly selected integration target', async () => {
    const wrapper = mountModal({
      routeKey: 'GET /items',
      target: 'integrations/int-1',
      integrations: ['int-1', 'int-2'],
    })
    const integrationSelect = wrapper.findAll('select')[1]
    await integrationSelect.setValue('int-2')
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual(['GET /items', 'integrations/int-2', 'NONE', ''])
  })

  it('emits update with edited http proxy URL', async () => {
    const wrapper = mountModal({ routeKey: 'GET /items', target: 'https://old.example.com', integrations: [] })
    const urlInput = wrapper.findAll('input')[1]
    await urlInput.setValue('https://new.example.com')
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual(['GET /items', 'https://new.example.com', 'NONE', ''])
  })

  it('emits update with authorization fields', async () => {
    const wrapper = mountModal({
      routeKey: 'GET /items',
      target: 'integrations/int-1',
      integrations: ['int-1'],
      authorizationType: 'AWS_IAM',
    })
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual(['GET /items', 'integrations/int-1', 'AWS_IAM', ''])
  })

  it('emits update:open false on Cancel click', async () => {
    const wrapper = mountModal({ routeKey: 'GET /items' })
    const cancelBtn = wrapper.findAll('button').find((b: any) => b.text().includes('Cancel'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('shows JWT option and authorizerId field when authorizationType is JWT', async () => {
    const wrapper = mountModal({
      routeKey: 'GET /items',
      target: 'integrations/int-1',
      integrations: ['int-1'],
      authorizationType: 'JWT',
      authorizerId: 'jwt-auth-123',
    })
    // Authorization select should have JWT value
    const selects = wrapper.findAll('select')
    const authSelect = selects[2] // targetType, integration, authorization
    expect((authSelect.element as HTMLSelectElement).value).toBe('JWT')
    // Authorizer ID field should be visible
    const authInput = wrapper.findAll('input').find((i: any) => i.element.getAttribute('value') === 'jwt-auth-123' || (i.element as HTMLInputElement).value === 'jwt-auth-123')
    expect(authInput).toBeTruthy()
    // Save emits JWT auth fields
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual(['GET /items', 'integrations/int-1', 'JWT', 'jwt-auth-123'])
  })

  it('shows Saving text when loading', () => {
    const wrapper = mountModal({ routeKey: 'GET /items', loading: true })
    expect(wrapper.text()).toContain('Saving...')
  })
})
