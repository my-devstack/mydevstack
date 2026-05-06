import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EventSourceMappingList from './EventSourceMappingList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

const createMapping = (uuid: string) => ({
  UUID: uuid,
  FunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:my-function`,
  EventSourceArn: `arn:aws:sqs:us-east-1:123456789012:my-queue`,
  BatchSize: 10,
  State: 'Enabled' as const,
})

describe('EventSourceMappingList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(EventSourceMappingList).toBeDefined()
  })

  it('has mappings prop defined', () => {
    expect(EventSourceMappingList.props).toBeDefined()
    expect(EventSourceMappingList.props.mappings).toBeDefined()
  })

  it('mappings prop is required array', () => {
    expect(EventSourceMappingList.props.mappings.required).toBe(true)
    expect(EventSourceMappingList.props.mappings.type).toBe(Array)
  })

  it('loading prop is optional boolean', () => {
    expect(EventSourceMappingList.props.loading.required).toBeFalsy()
    expect(EventSourceMappingList.props.loading.type).toBe(Boolean)
  })

  it('emits delete-mapping event', () => {
    expect(EventSourceMappingList.emits).toBeDefined()
    expect(EventSourceMappingList.emits).toContain('delete-mapping')
  })

  it('renders loading state', () => {
    const wrapper = mount(EventSourceMappingList, {
      props: {
        mappings: [],
        loading: true,
      },
    })

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders empty state when no mappings', () => {
    const wrapper = mount(EventSourceMappingList, {
      props: {
        mappings: [],
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('No Event Source Mappings')
  })

  it('renders mappings list when mappings exist', () => {
    const mockMappings = [
      createMapping('uuid-1'),
      createMapping('uuid-2'),
    ]

    const wrapper = mount(EventSourceMappingList, {
      props: {
        mappings: mockMappings,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('my-function')
    expect(wrapper.text()).toContain('uuid-1')
    expect(wrapper.text()).toContain('uuid-2')
  })

  // Accordion Tests
  describe('accordion behavior', () => {
    it('toggleExpand expands accordion', async () => {
      const mockMappings = [createMapping('uuid-1')]
      const wrapper = mount(EventSourceMappingList, {
        props: {
          mappings: mockMappings,
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      vm.toggleExpand('uuid-1')

      await wrapper.vm.$nextTick()
      expect(vm.isExpanded('uuid-1')).toBe(true)
    })

    it('toggleExpand collapses if already expanded', async () => {
      const mockMappings = [createMapping('uuid-1')]
      const wrapper = mount(EventSourceMappingList, {
        props: {
          mappings: mockMappings,
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      vm.toggleExpand('uuid-1')
      await wrapper.vm.$nextTick()
      expect(vm.isExpanded('uuid-1')).toBe(true)

      vm.toggleExpand('uuid-1')
      await wrapper.vm.$nextTick()
      expect(vm.isExpanded('uuid-1')).toBe(false)
    })

    it('clicking new item collapses previous', async () => {
      const mockMappings = [
        createMapping('uuid-a'),
        createMapping('uuid-b'),
      ]
      const wrapper = mount(EventSourceMappingList, {
        props: {
          mappings: mockMappings,
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      vm.toggleExpand('uuid-a')
      await wrapper.vm.$nextTick()
      expect(vm.isExpanded('uuid-a')).toBe(true)
      expect(vm.isExpanded('uuid-b')).toBe(false)

      vm.toggleExpand('uuid-b')
      await wrapper.vm.$nextTick()
      expect(vm.isExpanded('uuid-a')).toBe(false)
      expect(vm.isExpanded('uuid-b')).toBe(true)
    })
  })
})