import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StepFunctionsList from './StepFunctionsList.vue'
import type { StateMachineItem } from '@/composables/useStepFunctions'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  TrashIcon: { template: '<span class="mock-trash-icon" />' },
  EyeIcon: { template: '<span class="mock-eye-icon" />' },
  ArrowTopRightOnSquareIcon: { template: '<span class="mock-arrow-icon" />' },
}))

// Mock StatusBadge
vi.mock('@/components/common/StatusBadge.vue', () => ({
  default: {
    name: 'StatusBadge',
    props: ['status', 'label', 'size'],
    template: '<span class="mock-status-badge" :data-status="status" :data-label="label">{{ label }}</span>',
  },
}))

// Mock JsonViewer
vi.mock('@/components/common/JsonViewer.vue', () => ({
  default: {
    name: 'JsonViewer',
    props: ['data'],
    template: '<div class="mock-json-viewer">{{ JSON.stringify(data) }}</div>',
  },
}))

function createMachine(name: string, status: string, overrides = {}): StateMachineItem {
  return {
    stateMachineArn: `arn:aws:states:us-east-1:123456789012:stateMachine:${name}`,
    name,
    status,
    type: 'STANDARD',
    creationDate: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

const baseMachines = [
  createMachine('active-machine', 'ACTIVE'),
  createMachine('running-machine', 'RUNNING'),
  createMachine('failed-machine', 'FAILED'),
  createMachine('succeeded-machine', 'SUCCEEDED'),
  createMachine('timedout-machine', 'TIMED_OUT'),
  createMachine('aborted-machine', 'ABORTED'),
]

describe('StepFunctionsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exists as a component', () => {
    expect(StepFunctionsList).toBeDefined()
  })

  describe('loading state', () => {
    it('shows loading spinner when loading is true', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [],
          loading: true,
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading state machines...')
    })

    it('does not show loading when not loading', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [],
          loading: false,
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(false)
    })
  })

  describe('empty state', () => {
    it('shows empty state when stateMachines is empty', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('No state machines found.')
    })
  })

  describe('status badges', () => {
    it('renders ACTIVE status as "active" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('active')
      expect(badge.attributes('data-label')).toBe('ACTIVE')
    })

    it('renders RUNNING status as "pending" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'RUNNING')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('pending')
    })

    it('renders FAILED status as "inactive" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'FAILED')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('inactive')
    })

    it('renders SUCCEEDED status as "active" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'SUCCEEDED')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('active')
    })

    it('renders TIMED_OUT status as "inactive" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'TIMED_OUT')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('inactive')
    })

    it('renders ABORTED status as "inactive" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ABORTED')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('inactive')
    })

    it('renders unknown status as "inactive" type on StatusBadge', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'UNKNOWN_STATUS')],
          loading: false,
        },
      })

      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('inactive')
      expect(badge.attributes('data-label')).toBe('UNKNOWN_STATUS')
    })
  })

  describe('machine rendering', () => {
    it('renders all state machines', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: baseMachines,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('active-machine')
      expect(wrapper.text()).toContain('running-machine')
      expect(wrapper.text()).toContain('failed-machine')
    })

    it('renders header columns', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('Name')
      expect(wrapper.text()).toContain('Status')
      expect(wrapper.text()).toContain('Type')
      expect(wrapper.text()).toContain('Created')
      expect(wrapper.text()).toContain('Actions')
    })

    it('displays machine type', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('express-test', 'ACTIVE', { type: 'EXPRESS' })],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('EXPRESS')
    })

    it('displays default STANDARD type when type is not set', () => {
      const machine = createMachine('no-type', 'ACTIVE')
      delete machine.type
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('STANDARD')
    })
  })

  describe('navigation events', () => {
    it('emits select on row click', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([machine])
    })

    it('emits view-detail on view detail button click', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const viewBtn = wrapper.find('button[aria-label="View Detail"]')
      await viewBtn.trigger('click')

      expect(wrapper.emitted('view-detail')).toBeTruthy()
      expect(wrapper.emitted('view-detail')![0]).toEqual([machine])
    })

    it('emits delete on delete button click', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')![0]).toEqual([machine])
    })
  })

  describe('accordion expansion', () => {
    it('expands and shows ARN on row click', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain(machine.stateMachineArn)
    })

    it('collapses on second click', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain(machine.stateMachineArn)

      await row.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain(machine.stateMachineArn)
    })

    it('shows View Detail button inside expanded section', async () => {
      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // There should be at least one "View Detail" text in the expanded section
      const viewDetailEls = wrapper.findAll('button').filter(b => b.text() === 'View Detail')
      expect(viewDetailEls.length).toBeGreaterThan(0)
    })
  })

  describe('getDetails expansion', () => {
    it('loads details via getDetails prop on expand', async () => {
      const getDetails = vi.fn().mockResolvedValue({
        stateMachineArn: 'arn:aws:states:us-east-1:1:stateMachine:test',
        name: 'test',
        status: 'ACTIVE',
        definition: '{"StartAt":"HelloWorld"}',
        description: 'Loaded description',
      })

      const machine = createMachine('test', 'ACTIVE', { description: 'Original' })
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
          getDetails,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      expect(getDetails).toHaveBeenCalledWith(machine.stateMachineArn)
    })

    it('shows loading text while getDetails is in progress', async () => {
      const getDetails = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      const machine = createMachine('test', 'ACTIVE')
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
          getDetails,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()

      // Should show loading text
      expect(wrapper.text()).toContain('Loading details...')
    })

    it('uses getDetails returned data in expanded view', async () => {
      const getDetails = vi.fn().mockResolvedValue({
        stateMachineArn: 'arn:aws:states:us-east-1:1:stateMachine:test',
        name: 'test',
        status: 'ACTIVE',
        definition: '{"StartAt":"HelloWorld"}',
        description: 'Detailed description loaded',
      })

      const machine = createMachine('test', 'ACTIVE', { description: 'Basic' })
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [machine],
          loading: false,
          getDetails,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await wrapper.vm.$nextTick()
      // Wait for async getDetails
      await new Promise(resolve => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Detailed description loaded')
      expect(wrapper.text()).toContain('HelloWorld')
    })
  })

  describe('formatDate helper', () => {
    it('returns " - " for undefined date', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE', { creationDate: undefined })],
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      expect(vm.formatDate(undefined)).toBe('-')
    })

    it('formats valid date string', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      const result = vm.formatDate('2024-01-15T10:00:00Z')
      expect(typeof result).toBe('string')
      expect(result).not.toBe('-')
    })
  })

  describe('tryParseDefinition', () => {
    it('parses valid JSON definition', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      const result = vm.tryParseDefinition('{"StartAt":"Hello"}')
      expect(result).toContain('"StartAt"')
    })

    it('returns raw string for invalid JSON', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      const result = vm.tryParseDefinition('not valid json')
      expect(result).toBe('not valid json')
    })

    it('returns "-" for undefined', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [createMachine('test', 'ACTIVE')],
          loading: false,
        },
      })

      const vm = wrapper.vm as any
      expect(vm.tryParseDefinition(undefined)).toBe('-')
    })
  })
})
