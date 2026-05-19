import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import KinesisStreamInfo from './KinesisStreamInfo.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockStream = {
  StreamName: 'test-stream',
  StreamStatus: 'ACTIVE',
  ShardCount: 3,
  RetentionPeriodHours: 24,
  EncryptionType: 'KMS',
}

describe('KinesisStreamInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders stream name', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('test-stream')
  })

  it('renders shard count', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('3')
  })

  it('renders retention period', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('24')
  })

  it('renders encryption type', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('KMS')
  })

  it('renders status badge with ACTIVE status', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('Status')
  })

  it('shows Put Record button when stream is ACTIVE', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: false, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('Put Record')
  })

  it('hides Put Record button when stream is not ACTIVE', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: { ...mockStream, StreamStatus: 'CREATING' } },
      global: { stubs: { Button: false, StatusBadge: true } },
    })
    expect(wrapper.text()).not.toContain('Put Record')
  })

  it('emits put-record-click on button click', async () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    const btn = wrapper.findComponent({ name: 'Button' })
    await btn.vm.$emit('click')
    expect(wrapper.emitted('put-record-click')).toBeTruthy()
  })

  it('formats encryption display for KMS', () => {
    const wrapper = mount(KinesisStreamInfo, {
      props: { stream: mockStream },
      global: { stubs: { Button: true, StatusBadge: true } },
    })
    expect(wrapper.text()).toContain('KMS')
  })
})
