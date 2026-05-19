import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ServiceCard from './ServiceCard.vue'

describe('ServiceCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockService = {
    id: 's3',
    name: 'S3',
    category: 'storage' as const,
    icon: 'CloudIcon',
    route: '/services/s3',
    description: 'Object Storage',
  }

  it('renders service name and description with minimal props', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService },
    })
    expect(wrapper.text()).toContain('S3')
    expect(wrapper.text()).toContain('Object Storage')
    wrapper.unmount()
  })

  it('shows resource count', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, resourceCount: 42 },
    })
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('resources')
    wrapper.unmount()
  })

  it('formats large resource count with k suffix', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, resourceCount: 1500 },
    })
    expect(wrapper.text()).toContain('1.5k')
    expect(wrapper.text()).toContain('resources')
    wrapper.unmount()
  })

  it('displays healthy status color', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, status: 'healthy' },
    })
    expect(wrapper.text()).toContain('Healthy')
    wrapper.unmount()
  })

  it('displays warning status color', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, status: 'warning' },
    })
    expect(wrapper.text()).toContain('Warning')
    wrapper.unmount()
  })

  it('displays error status color', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, status: 'error' },
    })
    expect(wrapper.text()).toContain('Error')
    wrapper.unmount()
  })

  it('displays unknown status color (default)', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService },
    })
    expect(wrapper.text()).toContain('Unknown')
    wrapper.unmount()
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, loading: true },
    })
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not show loading spinner when not loading', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, loading: false },
    })
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits view event when View button clicked', async () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    await buttons[0].trigger('click')

    expect(wrapper.emitted('view')).toBeTruthy()
    expect(wrapper.emitted('view')![0]).toEqual([mockService])
    wrapper.unmount()
  })

  it('emits configure event when Configure button clicked', async () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    await buttons[1].trigger('click')

    expect(wrapper.emitted('configure')).toBeTruthy()
    expect(wrapper.emitted('configure')![0]).toEqual([mockService])
    wrapper.unmount()
  })

  it('does not crash with empty resources array', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, resources: [] },
    })
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not crash when resources are provided', () => {
    const wrapper = mount(ServiceCard, {
      props: {
        service: mockService,
        resources: [
          {
            id: 'bucket-1',
            name: 'my-bucket',
            serviceId: 's3',
            status: 'active' as const,
            lastUpdated: new Date(),
          },
        ],
      },
    })
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders service category', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService },
    })
    expect(wrapper.text()).toContain('storage')
    wrapper.unmount()
  })

  it('renders zero resource count', () => {
    const wrapper = mount(ServiceCard, {
      props: { service: mockService, resourceCount: 0 },
    })
    expect(wrapper.text()).toContain('0')
    wrapper.unmount()
  })
})
