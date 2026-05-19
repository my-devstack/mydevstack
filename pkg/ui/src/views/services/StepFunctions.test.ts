import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/stepfunctions', () => ({
  listStateMachines: vi.fn().mockResolvedValue({ stateMachines: [] }),
  describeStateMachine: vi.fn().mockResolvedValue(null),
  createStateMachine: vi.fn().mockResolvedValue({}),
  deleteStateMachine: vi.fn().mockResolvedValue({}),
  startExecution: vi.fn().mockResolvedValue({}),
  stopExecution: vi.fn().mockResolvedValue({}),
  listExecutions: vi.fn().mockResolvedValue({ executions: [] }),
  describeExecution: vi.fn().mockResolvedValue(null),
  getExecutionHistory: vi.fn().mockResolvedValue({ events: [] }),
  updateStateMachine: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import StepFunctions from './StepFunctions.vue'

const stubs = {
  StepFunctionsList: true,
  StepFunctionsCreateModal: true,
  StepFunctionsDeleteModal: true,
  StepFunctionsDetail: true,
  StepFunctionsExecutionList: true,
  StepFunctionsExecutionDetail: true,
  StepFunctionsStartExecutionModal: true,
  StepFunctionsHistoryModal: true,
  StepFunctionsCodeExamples: true,
}

describe('StepFunctions.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Step Functions heading', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    expect(wrapper.text()).toContain('Step Functions')
  })

  it('renders Create State Machine button', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    expect(wrapper.text()).toContain('Create State Machine')
  })

  it('renders StepFunctionsList component', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    const list = wrapper.findComponent({ name: 'StepFunctionsList' })
    expect(list.exists()).toBe(true)
  })

  it('shows state machine count text', async () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('state machine')
  })

  it('renders StepFunctionsCodeExamples when no machine selected', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    const codeExamples = wrapper.findComponent({ name: 'StepFunctionsCodeExamples' })
    expect(codeExamples.exists()).toBe(true)
  })

  it('renders Create modal', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    const createModal = wrapper.findComponent({ name: 'StepFunctionsCreateModal' })
    expect(createModal.exists()).toBe(true)
  })

  it('renders Delete modal', () => {
    const wrapper = shallowMount(StepFunctions, { global: { stubs } })
    const deleteModal = wrapper.findComponent({ name: 'StepFunctionsDeleteModal' })
    expect(deleteModal.exists()).toBe(true)
  })
})
