import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock API layer — composables run real code against mocked API
vi.mock('@/api/services/stepfunctions', () => ({
  listStateMachines: vi.fn().mockResolvedValue({
    stateMachines: [
      {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:my-workflow',
        name: 'my-workflow',
        status: 'ACTIVE',
        type: 'STANDARD',
        creationDate: '2024-01-15T10:00:00Z',
        description: 'Test workflow',
      },
    ],
  }),
  describeStateMachine: vi.fn().mockResolvedValue({
    stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:my-workflow',
    name: 'my-workflow',
    status: 'ACTIVE',
    type: 'STANDARD',
    definition: '{"StartAt":"HelloWorld"}',
    roleArn: 'arn:aws:iam::123456789012:role/my-role',
    creationDate: '2024-01-15T10:00:00Z',
  }),
  createStateMachine: vi.fn().mockResolvedValue({ stateMachineArn: 'arn:new' }),
  deleteStateMachine: vi.fn().mockResolvedValue({}),
  startExecution: vi.fn().mockResolvedValue({ executionArn: 'arn:exec' }),
  stopExecution: vi.fn().mockResolvedValue({}),
  listExecutions: vi.fn().mockResolvedValue({ executions: [] }),
  describeExecution: vi.fn().mockResolvedValue({
    executionArn: 'arn:aws:states:us-east-1:123456789012:execution:my-workflow:exec-001',
    stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:my-workflow',
    name: 'exec-001',
    status: 'SUCCEEDED',
    startDate: '2024-01-15T10:00:00Z',
    stopDate: '2024-01-15T10:05:00Z',
    input: '{"key":"value"}',
    output: '{"result":"ok"}',
  }),
  getExecutionHistory: vi.fn().mockResolvedValue({ events: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test-key',
    secretKey: 'test-secret',
  })),
}))

import StepFunctionsView from './StepFunctions.vue'

// Helper: shared stubs config
function makeStubs() {
  return {
    StepFunctionsList: {
      name: 'StepFunctionsList',
      props: ['stateMachines', 'loading'],
      emits: ['view-detail', 'delete', 'select'],
      template: `
        <div class="mock-list">
          <button
            v-for="sm in stateMachines"
            :key="sm.stateMachineArn"
            :data-testid="'machine-' + sm.name"
            class="mock-machine-row"
            @click="$emit('view-detail', sm)"
          >
            {{ sm.name }}
          </button>
        </div>
      `,
    },
    StepFunctionsCreateModal: {
      name: 'StepFunctionsCreateModal',
      props: ['open'],
      template: '<div v-if="open" data-testid="create-modal" class="mock-modal">Create Modal</div>',
    },
    StepFunctionsDeleteModal: { template: '<div class="mock-modal" />' },
    StepFunctionsDetail: { template: '<div class="mock-detail" />' },
    StepFunctionsExecutionList: { template: '<div class="mock-execution-list" />' },
    StepFunctionsExecutionDetail: {
      name: 'StepFunctionsExecutionDetail',
      props: ['execution', 'loading'],
      emits: ['back'],
      template: '<div data-testid="execution-detail" class="mock-execution-detail">Execution Detail</div>',
    },
    StepFunctionsStartExecutionModal: { template: '<div class="mock-modal" />' },
    StepFunctionsHistoryModal: { template: '<div class="mock-modal" />' },
    StepFunctionsCodeExamples: { template: '<div class="mock-code-examples" />' },
  }
}

describe('StepFunctions View Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders state machine list on mount', async () => {
    const wrapper = mount(StepFunctionsView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create State Machine')
    expect(wrapper.text()).toContain('my-workflow')
  })

  it('clicks create button and shows create modal', async () => {
    const wrapper = mount(StepFunctionsView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Create button is a native button, find by text
    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create State Machine'))
    expect(createBtn).toBeDefined()
    await createBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    // showCreateModal should be true → modal renders
    const createModal = wrapper.find('[data-testid="create-modal"]')
    expect(createModal.exists()).toBe(true)
    expect(createModal.text()).toContain('Create Modal')
  })

  it('views state machine detail and navigates back', async () => {
    const wrapper = mount(StepFunctionsView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Click machine row → emits view-detail → selectStateMachine runs
    const machineRow = wrapper.find('[data-testid="machine-my-workflow"]')
    expect(machineRow.exists()).toBe(true)
    await machineRow.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Back button should appear (goBack uncovered before)
    const backBtn = wrapper.findAll('button').find(b => b.text().includes('Back to State Machines'))
    expect(backBtn).toBeDefined()

    // Click back → goBack runs
    await backBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    // Back to list view
    expect(wrapper.text()).toContain('Create State Machine')
  })

  it('shows execution detail modal when describeExecution is called', async () => {
    const wrapper = mount(StepFunctionsView, {
      global: { stubs: makeStubs() },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Navigate into machine detail
    const machineRow = wrapper.find('[data-testid="machine-my-workflow"]')
    await machineRow.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Call describeExecution to open the execution detail modal
    await wrapper.vm.describeExecution('arn:aws:states:us-east-1:123456789012:execution:my-workflow:exec-001')
    await wrapper.vm.$nextTick()

    // Execution detail modal should be visible
    const execDetail = wrapper.find('[data-testid="execution-detail"]')
    expect(execDetail.exists()).toBe(true)
  })
})
