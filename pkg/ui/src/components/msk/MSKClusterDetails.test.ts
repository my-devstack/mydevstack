import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MSKClusterDetails from './MSKClusterDetails.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockDetails = {
  State: 'ACTIVE',
  CurrentVersion: '3.2.0',
  CreationTime: '2024-01-15T10:00:00Z',
  NumberOfBrokerNodes: 3,
  Provisioned: {
    BrokerNodeGroupInfo: {
      InstanceType: 'kafka.m5.large',
      StorageInfo: {
        EbsStorageInfo: {
          VolumeSize: 100,
        },
      },
    },
  },
}

const defaultProps = {
  clusterArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster',
  details: mockDetails,
  brokers: ['b-1.test.us-east-1.kafka.amazonaws.com:9092', 'b-2.test.us-east-1.kafka.amazonaws.com:9092'],
}

describe('MSKClusterDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders cluster arn', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('arn:aws:kafka')
  })

  it('renders loading state when details is null', () => {
    const wrapper = mount(MSKClusterDetails, {
      props: { ...defaultProps, details: null },
    })
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders loading state when details is undefined', () => {
    const wrapper = mount(MSKClusterDetails, {
      props: { ...defaultProps, details: undefined },
    })
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders state badge with ACTIVE status', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('ACTIVE')
  })

  it('renders current version', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('3.2.0')
  })

  it('renders broker count', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('3')
  })

  it('renders bootstrap brokers', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('b-1.test')
  })

  it('renders instance type', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('kafka.m5.large')
  })

  it('renders storage per broker', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('100')
  })

  it('hides brokers section when brokers is empty', () => {
    const wrapper = mount(MSKClusterDetails, {
      props: { ...defaultProps, brokers: [] },
    })
    expect(wrapper.text()).not.toContain('Bootstrap Brokers')
  })

  it('hides provisioned section when no provisioned data', () => {
    const wrapper = mount(MSKClusterDetails, {
      props: { ...defaultProps, details: { ...mockDetails, Provisioned: undefined } },
    })
    expect(wrapper.text()).not.toContain('Provisioned Details')
  })

  it('renders creation time', () => {
    const wrapper = mount(MSKClusterDetails, { props: defaultProps })
    expect(wrapper.text()).toContain('2024')
  })

  it('shows dash for missing version', () => {
    const wrapper = mount(MSKClusterDetails, {
      props: { ...defaultProps, details: { ...mockDetails, CurrentVersion: undefined } },
    })
    expect(wrapper.text()).toContain('-')
  })
})
