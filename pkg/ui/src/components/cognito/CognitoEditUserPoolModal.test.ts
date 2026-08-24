import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoEditUserPoolModal from './CognitoEditUserPoolModal.vue'

const modalStub = {
  template: '<div v-if="open" data-testid="modal">{{title}}<slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
  emits: ['update:open', 'close'],
}
const buttonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled'],
  emits: ['click'],
}
const formInputStub = {
  template: '<div class="form-input">{{label}}<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
  props: ['modelValue', 'label', 'placeholder', 'type'],
  emits: ['update:modelValue'],
}
const tagsSectionStub = {
  template: '<div class="tags-section"><slot /></div>',
  props: ['tags'],
  emits: ['update'],
}

const stubs = { Modal: modalStub, Button: buttonStub, FormInput: formInputStub, CognitoTagsSection: tagsSectionStub }

const defaultProps = {
  open: true,
  userPoolId: 'us-east-1_abc123',
  poolName: 'my-user-pool',
  mfaConfiguration: 'ON',
  deletionProtection: 'ACTIVE',
  tags: { env: 'dev' },
}

describe('CognitoEditUserPoolModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open is true', () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit User Pool')
  })

  it('does not render when open is false', () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('populates form from props when opened', async () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: { ...defaultProps, open: false }, global: { stubs } })
    await wrapper.setProps({ open: true })
    const inputs = wrapper.findAll('.form-input input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('my-user-pool')
  })

  it('renders tags section', () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('.tags-section').exists()).toBe(true)
  })

  it('emits update with userPoolId, params and tags on save', async () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: defaultProps, global: { stubs } })
    const input = wrapper.find('.form-input input')
    await input.setValue('renamed-pool')
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([
      'us-east-1_abc123',
      {
        PoolName: 'renamed-pool',
        MfaConfiguration: 'ON',
        DeletionProtection: 'ACTIVE',
        Tags: { env: 'dev' },
        RemovedKeys: [],
      },
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(CognitoEditUserPoolModal, { props: defaultProps, global: { stubs } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })
})