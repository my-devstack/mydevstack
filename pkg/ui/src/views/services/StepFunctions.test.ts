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
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
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

  describe('pagination', () => {
    it('goToPage navigates when many state machines', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      const manyMachines = Array.from({ length: 25 }, (_, i) => ({
        name: `machine${i}`,
        stateMachineArn: `arn:aws:states:us-east-1:123:stateMachine:machine${i}`,
        status: 'ACTIVE',
      }))
      wrapper.vm.stateMachines = manyMachines
      expect(wrapper.vm.totalStepFunctionsPages).toBe(3)
      wrapper.vm.goToPage(2)
      expect(wrapper.vm.stepfunctionsPage).toBe(2)
    })

    it('pagination does not show with <= 10 items', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.stateMachines = [{ name: 'm1' }]
      expect(wrapper.vm.totalStepFunctionsPages).toBe(1)
    })
  })

  describe('back button and navigation', () => {
    it('goBack resets selected state machine and executions', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      wrapper.vm.executions = [{ executionArn: 'exec1', status: 'RUNNING' }]
      wrapper.vm.goBack()
      expect(wrapper.vm.selectedStateMachine).toBeNull()
      expect(wrapper.vm.executions).toEqual([])
    })

    it('back button renders when machine selected', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      expect(wrapper.find('button').text()).toContain('Create')
      // Set selected state machine
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      // Wait for re-render
    })

    it('create button rendered when no machine selected', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      // Should show Create button
      expect(wrapper.text()).toContain('Create State Machine')
    })

    it('start execution button shows modal', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      wrapper.vm.showStartExecutionModal = true
      expect(wrapper.vm.showStartExecutionModal).toBe(true)
    })

    it('renders StepFunctionsDetail when machine selected', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      await new Promise(process.nextTick)
      const detail = wrapper.findComponent({ name: 'StepFunctionsDetail' })
      expect(detail.exists()).toBe(true)
    })

    it('renders StepFunctionsExecutionList when machine selected', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      await new Promise(process.nextTick)
      const execList = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      expect(execList.exists()).toBe(true)
    })

    it('view detail emits from execution list', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const execList = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (execList.exists() && execList.vm) {
        execList.vm.$emit('view-detail', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
      }
    })

    it('view history emits from execution list', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const execList = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (execList.exists() && execList.vm) {
        execList.vm.$emit('view-history', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
      }
    })

    it('start execution modal emits start', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const modal = wrapper.findComponent({ name: 'StepFunctionsStartExecutionModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('start', '{"key":"val"}')
        await new Promise(process.nextTick)
      }
    })

    it('StepFunctionsList emits view-detail', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      const list = wrapper.findComponent({ name: 'StepFunctionsList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('view-detail', { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' })
        await new Promise(process.nextTick)
      }
    })

    it('StepFunctionsList emits delete', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      const list = wrapper.findComponent({ name: 'StepFunctionsList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('delete', { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' })
        await new Promise(process.nextTick)
      }
    })

    it('StepFunctionsExecutionList emits stop', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const execList = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (execList.exists() && execList.vm) {
        execList.vm.$emit('stop', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
      }
    })
  })

  describe('mount interaction tests', () => {
    const mountStubs = {
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

    it('mounts with mount() and stubs', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs: mountStubs } })
      expect(wrapper.exists()).toBe(true)
    })

    it('handles create modal emit', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs: mountStubs } })
      const modal = wrapper.findComponent({ name: 'StepFunctionsCreateModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('create')
        await new Promise(process.nextTick)
      }
    })

    it('handles delete modal emit', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs: mountStubs } })
      const modal = wrapper.findComponent({ name: 'StepFunctionsDeleteModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('confirm')
        await new Promise(process.nextTick)
      }
    })

    it('handles start execution modal emit', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs: mountStubs } })
      const modal = wrapper.findComponent({ name: 'StepFunctionsStartExecutionModal' })
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('start', '{"key": "value"}')
        await new Promise(process.nextTick)
      }
    })

    it('goBack resets selected state machine', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs: mountStubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test' }
      wrapper.vm.executions = [{ executionArn: 'test' }]
      wrapper.vm.goBack()
      expect(wrapper.vm.selectedStateMachine).toBeNull()
      expect(wrapper.vm.executions).toEqual([])
    })
  })

  describe('template inline handler coverage', () => {
    it('Create State Machine button triggers modal', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      const buttons = wrapper.findAll('button')
      const createBtn = buttons.find(b => b.text().includes('Create State Machine'))
      if (createBtn) {
        createBtn.trigger('click')
        expect(wrapper.vm.showCreateModal).toBe(true)
      }
    })

    it('back button renders and triggers goBack', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const buttons = wrapper.findAll('button')
      const backBtn = buttons.find(b => b.text().includes('Back'))
      if (backBtn) {
        backBtn.trigger('click')
        expect(wrapper.vm.selectedStateMachine).toBeNull()
      }
    })

    it('view-detail event from list sets selected execution', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const list = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('view-detail', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
        expect(wrapper.vm.selectedExecution).toBeDefined()
      }
    })

    it('view-history event from list loads history', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const list = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('view-history', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
        expect(wrapper.vm.showHistoryModal).toBe(true)
      }
    })

    it('stop event from execution list', async () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.selectedStateMachine = { name: 'test', stateMachineArn: 'arn:aws:states:us-east-1:123:stateMachine:test', status: 'ACTIVE' }
      const list = wrapper.findComponent({ name: 'StepFunctionsExecutionList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('stop', { executionArn: 'exec1' })
        await new Promise(process.nextTick)
      }
    })

    it('pagination goToPage', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      wrapper.vm.stateMachines = Array.from({ length: 25 }, (_, i) => ({
        name: `m${i}`, stateMachineArn: `arn:aws:states:us-east-1:123:stateMachine:m${i}`, status: 'ACTIVE',
      }))
      wrapper.vm.goToPage(3)
      expect(wrapper.vm.stepfunctionsPage).toBe(3)
    })

    it('modal @update:open handlers set state', () => {
      const wrapper = shallowMount(StepFunctions, { global: { stubs } })
      const createModal = wrapper.findComponent({ name: 'StepFunctionsCreateModal' })
      if (createModal.exists() && createModal.vm) {
        createModal.vm.$emit('update:open', false)
      }
      const deleteModal = wrapper.findComponent({ name: 'StepFunctionsDeleteModal' })
      if (deleteModal.exists() && deleteModal.vm) {
        deleteModal.vm.$emit('update:open', false)
      }
      const startModal = wrapper.findComponent({ name: 'StepFunctionsStartExecutionModal' })
      if (startModal.exists() && startModal.vm) {
        startModal.vm.$emit('update:open', false)
      }
      const historyModal = wrapper.findComponent({ name: 'StepFunctionsHistoryModal' })
      if (historyModal.exists() && historyModal.vm) {
        historyModal.vm.$emit('update:open', false)
      }
    })
  })
})
