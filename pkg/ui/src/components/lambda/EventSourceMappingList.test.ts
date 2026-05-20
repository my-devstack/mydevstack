import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EventSourceMappingList from './EventSourceMappingList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

function createMapping(
  uuid: string,
  overrides: Partial<{
    FunctionArn: string
    EventSourceArn: string
    BatchSize: number
    State: string
    StateTransitionReason: string
    StartingPosition: string
    MaximumBatchingWindowInSeconds: number
    ParallelizationFactor: number
    MaximumRecordAgeInSeconds: number
    BisectBatchOnFunctionError: boolean
    DestinationConfig: { OnFailure: { Destination: string } } | undefined
  }> = {}
) {
  return {
    UUID: uuid,
    FunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:my-function`,
    EventSourceArn: `arn:aws:sqs:us-east-1:123456789012:my-queue`,
    BatchSize: 10,
    State: 'Enabled' as const,
    ...overrides,
  }
}

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

  describe('event source type detection', () => {
    it('detects SQS event source', () => {
      const mapping = createMapping('sqs-test', {
        EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
      })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('SQS')
    })

    it('detects Kinesis event source', () => {
      const mapping = createMapping('kinesis-test', {
        EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/my-stream',
      })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Kinesis')
    })

    it('detects DynamoDB event source', () => {
      const mapping = createMapping('dynamodb-test', {
        EventSourceArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/my-table/stream/2024-01-01',
      })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('DynamoDB')
    })

    it('detects MSK event source', () => {
      const mapping = createMapping('msk-test', {
        EventSourceArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/my-cluster',
      })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('MSK')
    })

    it('shows Unknown for unrecognized source', () => {
      const mapping = createMapping('unknown-test', {
        EventSourceArn: 'arn:aws:custom:us-east-1:123456789012:something',
      })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('state display', () => {
    it('shows Active for Enabled state', () => {
      const mapping = createMapping('enabled-test', { State: 'Enabled' })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Active')
    })

    it('shows Disabled for Disabled state', () => {
      const mapping = createMapping('disabled-test', { State: 'Disabled' })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Disabled')
    })

    it('shows Creating... for Creating state', () => {
      const mapping = createMapping('creating-test', { State: 'Creating' })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Creating...')
    })

    it('shows Deleting... for Deleting state', () => {
      const mapping = createMapping('deleting-test', { State: 'Deleting' })
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      expect(wrapper.text()).toContain('Deleting...')
    })
  })

  describe('delete event', () => {
    it('emits delete-mapping on delete button click', async () => {
      const mapping = createMapping('delete-test')
      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      expect(deleteBtn.exists()).toBe(true)
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete-mapping')).toBeTruthy()
      expect(wrapper.emitted('delete-mapping')![0]).toEqual([mapping])
    })
  })

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

    it('expands accordion via click on row', async () => {
      const mockMappings = [createMapping('click-uuid')]
      const wrapper = mount(EventSourceMappingList, {
        props: {
          mappings: mockMappings,
          loading: false,
        },
      })

      // Find the row with the cursor-pointer class (the main row div)
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // After expand, should show details like UUID, State, etc.
      expect(wrapper.text()).toContain('click-uuid')
    })
  })

  describe('expanded detail view', () => {
    it('shows detail sections when expanded', async () => {
      const mapping = createMapping('detail-test', {
        State: 'Enabled',
        StateTransitionReason: 'User action',
        StartingPosition: 'LATEST',
        MaximumBatchingWindowInSeconds: 5,
        ParallelizationFactor: 2,
        MaximumRecordAgeInSeconds: 86400,
        BisectBatchOnFunctionError: true,
      })

      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      // Click to expand
      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show expanded detail fields
      expect(wrapper.text()).toContain('UUID')
      expect(wrapper.text()).toContain('detail-test')
      expect(wrapper.text()).toContain('State Transition Reason')
      expect(wrapper.text()).toContain('User action')
      expect(wrapper.text()).toContain('Starting Position')
      expect(wrapper.text()).toContain('LATEST')
      expect(wrapper.text()).toContain('Enabled')
      expect(wrapper.text()).toContain('2')
    })

    it('shows DLQ destination when configured', async () => {
      const mapping = createMapping('dlq-test', {
        DestinationConfig: {
          OnFailure: {
            Destination: 'arn:aws:sqs:us-east-1:123456789012:dlq-queue',
          },
        },
      })

      const wrapper = mount(EventSourceMappingList, {
        props: { mappings: [mapping], loading: false },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('DLQ Destination')
      expect(wrapper.text()).toContain('arn:aws:sqs:us-east-1:123456789012:dlq-queue')
    })
  })
})
