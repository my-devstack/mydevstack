import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayCreateModal from './APIGatewayCreateModal.vue'

const mockEmulator = { value: '' }

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false, emulator: mockEmulator.value }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal">{{title}}<slot name="title" /><slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled'],
  emits: ['click'],
}
const formInputStub = {
  template: '<div class="form-input">{{label}}<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
  props: ['modelValue', 'label', 'placeholder'],
  emits: ['update:modelValue'],
}
const formSelectStub = {
  template: '<div class="form-select">{{label}}<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></div>',
  props: ['modelValue', 'label', 'options'],
  emits: ['update:modelValue'],
}

const defaultProps = {
  open: true,
  type: 'rest' as const,
  loading: false,
  api: undefined,
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, FormSelect: formSelectStub }

describe('APIGatewayCreateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockEmulator.value = ''
  })

  describe('REST API mode', () => {
    it('renders REST API form when type is rest', () => {
      const wrapper = mount(APIGatewayCreateModal, { props: defaultProps, global: { stubs } })
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Create REST API')
    })

    it('emits create-rest with name and description', async () => {
      const wrapper = mount(APIGatewayCreateModal, { props: defaultProps, global: { stubs } })
      const input = wrapper.findAll('.form-input input').at(0)
      await input!.setValue('my-rest-api')
      const desc = wrapper.findAll('.form-input input').at(1)
      await desc!.setValue('My description')
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create-rest')![0]).toEqual(['my-rest-api', 'My description'])
    })

    it('does not emit create-rest when name is empty', async () => {
      const wrapper = mount(APIGatewayCreateModal, { props: defaultProps, global: { stubs } })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create-rest')).toBeUndefined()
    })
  })

  describe('HTTP API mode', () => {
    it('renders API Gateway V2 form when type is http', () => {
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      expect(wrapper.text()).toContain('Create API (V2)')
    })

    it('shows protocol dropdown for http type', () => {
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      expect(wrapper.text()).toContain('Protocol')
    })

    it('does not show protocol dropdown for rest type', () => {
      const wrapper = mount(APIGatewayCreateModal, { props: defaultProps, global: { stubs } })
      expect(wrapper.text()).not.toContain('Protocol')
    })

    it('emits create-http with name, description and HTTP protocol by default', async () => {
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      const input = wrapper.findAll('.form-input input').at(0)
      await input!.setValue('my-api')
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create-http')![0]).toEqual(['my-api', '', 'HTTP'])
    })
  })

  describe('protocol dropdown', () => {
    it('shows both HTTP and WebSocket options when no emulator (real AWS)', () => {
      mockEmulator.value = ''
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      const select = wrapper.find('.form-select select')
      const options = select.findAll('option')
      const optionTexts = options.map(o => o.text())
      expect(optionTexts).toContain('HTTP')
      expect(optionTexts).toContain('WebSocket')
    })

    it('shows WebSocket option when emulator is FLOCI', () => {
      mockEmulator.value = 'FLOCI'
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      const select = wrapper.find('.form-select select')
      const options = select.findAll('option')
      const optionTexts = options.map(o => o.text())
      expect(optionTexts).toContain('HTTP')
      expect(optionTexts).toContain('WebSocket')
    })

    it('shows WebSocket option when emulator is MINISTACK (now supported)', () => {
      mockEmulator.value = 'MINISTACK'
      const wrapper = mount(APIGatewayCreateModal, { props: { ...defaultProps, type: 'http' }, global: { stubs } })
      const select = wrapper.find('.form-select select')
      const options = select.findAll('option')
      const optionTexts = options.map(o => o.text())
      expect(optionTexts).toContain('HTTP')
      expect(optionTexts).toContain('WebSocket')
    })
  })
})
