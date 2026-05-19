import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisViewRecordModal from './KinesisViewRecordModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title', 'size'],
}
const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant'],
}

const mockRecord = {
  SequenceNumber: '123456789',
  PartitionKey: 'pk-test',
  Data: 'eyJtZXNzYWdlIjogImhlbGxvIHdvcmxkIn0=',
}

const defaultProps = {
  open: true,
  selectedRecord: mockRecord,
}

const stubs = { Modal: modalStub, Button: buttonStub, JsonViewer: true }

describe('KinesisViewRecordModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open with record', () => {
    const wrapper = mount(KinesisViewRecordModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('shows partition key', () => {
    const wrapper = mount(KinesisViewRecordModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('pk-test')
  })

  it('shows sequence number', () => {
    const wrapper = mount(KinesisViewRecordModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('123456789')
  })

  it('does not render content when selectedRecord is null', () => {
    const wrapper = mount(KinesisViewRecordModal, { props: { open: true, selectedRecord: null }, global: { stubs } })
    expect(wrapper.text()).not.toContain('pk-test')
  })

  it('renders close button', () => {
    const wrapper = mount(KinesisViewRecordModal, { props: defaultProps, global: { stubs } })
    expect(wrapper.text()).toContain('Close')
  })
})
