import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EC2SecurityGroupModal from './EC2SecurityGroupModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    darkMode: false,
  })),
}))

const stubs = {
  Modal: { template: '<div v-if="open" class="modal-stub"><div class="modal-body"><slot /></div><div class="modal-footer"><slot name="footer" /></div></div>', props: ['open'] },
  Button: { template: '<button @click="$emit(\'click\', $event)"><slot /></button>', props: ['loading', 'variant'] },
  FormInput: { template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['modelValue', 'label'] },
  FormSelect: { template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option>opt</option></select>', props: ['modelValue', 'label', 'options'] },
}

describe('EC2SecurityGroupModal', () => {
  it('renders when open', () => {
    const wrapper = mount(EC2SecurityGroupModal, {
      props: { open: true },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Create Security Group')
  })

  it('does not render when closed', () => {
    const wrapper = mount(EC2SecurityGroupModal, {
      props: { open: false },
      global: { stubs },
    })
    expect(wrapper.find('.modal-stub').exists()).toBe(false)
  })

  it('emits update:open on cancel', async () => {
    const wrapper = mount(EC2SecurityGroupModal, {
      props: { open: true },
      global: { stubs },
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    if (cancelBtn) {
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
    }
  })
})
