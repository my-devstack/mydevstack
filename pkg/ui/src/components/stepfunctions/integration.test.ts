import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, nextTick } from 'vue'
import {
  StepFunctionsList,
  StepFunctionsDeleteModal,
  StepFunctionsCreateModal,
  StepFunctionsCodeExamples,
} from './index'
import type { StateMachineItem } from '@/composables/useStepFunctions'

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test-key',
    secretKey: 'test-secret',
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  TrashIcon: { template: '<div class="mock-icon" />' },
  EyeIcon: { template: '<div class="mock-icon" />' },
  ArrowTopRightOnSquareIcon: { template: '<div class="mock-icon" />' },
}))

// Mock common components used by the stepfunctions components
vi.mock('@/components/common/StatusBadge.vue', () => ({
  default: {
    name: 'StatusBadge',
    props: ['status', 'label', 'size'],
    template: '<span class="mock-status-badge">{{ label }}</span>',
  },
}))

vi.mock('@/components/common/Modal.vue', () => ({
  default: {
    name: 'Modal',
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
    template: `
      <div v-if="open" class="mock-modal" data-testid="modal">
        <div class="mock-modal-title">{{ title }}</div>
        <div class="mock-modal-body"><slot /></div>
        <div class="mock-modal-footer"><slot name="footer" /></div>
      </div>
    `,
  },
}))

vi.mock('@/components/common/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'loading'],
    template: '<button class="mock-button" :disabled="loading"><slot /></button>',
  },
}))

vi.mock('@/components/common/CodeSnippet.vue', () => ({
  default: {
    name: 'CodeSnippet',
    props: ['snippets', 'title'],
    template: '<div class="mock-code-snippet"><h3>{{ title }}</h3><div v-for="s in snippets" :key="s.language" class="mock-snippet"><span class="mock-label">{{ s.label }}</span><pre>{{ s.code }}</pre></div></div>',
  },
}))

vi.mock('@/components/common/FormInput.vue', () => ({
  default: {
    name: 'FormInput',
    props: ['modelValue', 'label', 'placeholder', 'required', 'helpText'],
    emits: ['update:modelValue'],
    template:
      '<div class="mock-form-input"><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
  },
}))

vi.mock('@/components/common/FormSelect.vue', () => ({
  default: {
    name: 'FormSelect',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
    template:
      '<div class="mock-form-select"><label v-if="label">{{ label }}</label><select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></div>',
  },
}))

// --- Mock Data ---
const mockStateMachines: StateMachineItem[] = [
  {
    stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:my-workflow',
    name: 'my-workflow',
    status: 'ACTIVE',
    type: 'STANDARD',
    creationDate: '2024-01-15T10:00:00Z',
    description: 'Test workflow description',
  },
  {
    stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:another-workflow',
    name: 'another-workflow',
    status: 'ACTIVE',
    type: 'EXPRESS',
    creationDate: '2024-02-20T14:30:00Z',
  },
]

// --- Integration Wrappers ---
function createDeleteIntegrationWrapper() {
  return {
    components: { StepFunctionsList, StepFunctionsDeleteModal },
    template: `
      <div>
        <StepFunctionsList
          :stateMachines="machines"
          :loading="false"
          @delete="onDelete"
        />
        <StepFunctionsDeleteModal
          :open="showDelete"
          :loading="false"
          :stateMachineToDelete="machineToDelete"
          @update:open="showDelete = $event"
          @confirm="onConfirm"
        />
      </div>
    `,
    setup() {
      const showDelete = ref(false)
      const machineToDelete = ref<StateMachineItem | null>(null)
      const machines = ref<StateMachineItem[]>([...mockStateMachines])

      function onDelete(machine: StateMachineItem) {
        machineToDelete.value = machine
        showDelete.value = true
      }

      function onConfirm() {
        machines.value = machines.value.filter(
          (m) => m.stateMachineArn !== machineToDelete.value?.stateMachineArn,
        )
        showDelete.value = false
        machineToDelete.value = null
      }

      return { showDelete, machineToDelete, machines, onDelete, onConfirm }
    },
  }
}

// --- Tests ---
describe('StepFunctions Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ===============================================
  // 3. StepFunctionsList renders correct rows
  // ===============================================
  describe('StepFunctionsList', () => {
    it('renders state machine rows with correct data', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: mockStateMachines,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('my-workflow')
      expect(wrapper.text()).toContain('another-workflow')
      expect(wrapper.text()).toContain('STANDARD')
      expect(wrapper.text()).toContain('EXPRESS')
      expect(wrapper.text()).toContain('ACTIVE')

      // Header columns
      expect(wrapper.text()).toContain('Name')
      expect(wrapper.text()).toContain('Status')
      expect(wrapper.text()).toContain('Type')
      expect(wrapper.text()).toContain('Created')
      expect(wrapper.text()).toContain('Actions')
    })

    it('renders empty state when no state machines', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('No state machines found.')
    })

    it('renders loading state when loading', () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [],
          loading: true,
        },
      })

      expect(wrapper.text()).toContain('Loading state machines...')
    })

    it('emits select event on row click', async () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [mockStateMachines[0]],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([mockStateMachines[0]])
    })

    it('emits view-detail event via eye button', async () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [mockStateMachines[0]],
          loading: false,
        },
      })

      const viewBtn = wrapper.find('button[aria-label="View Detail"]')
      expect(viewBtn.exists()).toBe(true)
      await viewBtn.trigger('click')

      expect(wrapper.emitted('view-detail')).toBeTruthy()
      expect(wrapper.emitted('view-detail')![0]).toEqual([mockStateMachines[0]])
    })

    it('emits delete event via trash button', async () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [mockStateMachines[0]],
          loading: false,
        },
      })

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      expect(deleteBtn.exists()).toBe(true)
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')![0]).toEqual([mockStateMachines[0]])
    })

    it('expands accordion on row click showing ARN and description', async () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: [mockStateMachines[0]],
          loading: false,
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain(mockStateMachines[0].stateMachineArn)
      expect(wrapper.text()).toContain('Test workflow description')
      expect(wrapper.text()).toContain('View Detail')
    })

    it('supports exclusive accordion (expanding one collapses other)', async () => {
      const wrapper = mount(StepFunctionsList, {
        props: {
          stateMachines: mockStateMachines,
          loading: false,
        },
      })

      const rows = wrapper.findAll('.cursor-pointer')
      expect(rows.length).toBe(2)

      // Click first row
      await rows[0].trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain(mockStateMachines[0].stateMachineArn)

      // Click second row — first should collapse, second expand
      await rows[1].trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain(mockStateMachines[1].stateMachineArn)
    })
  })

  // ===============================================
  // 1. StateMachineList + DeleteModal integration
  // ===============================================
  describe('StepFunctionsList + DeleteModal Integration', () => {
    it('opens delete modal when delete button clicked', async () => {
      const wrapper = mount(createDeleteIntegrationWrapper())

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      await deleteBtn.trigger('click')

      const modal = wrapper.find('[data-testid="modal"]')
      expect(modal.exists()).toBe(true)
      expect(modal.text()).toContain('Delete State Machine')
      expect(modal.text()).toContain('my-workflow')
    })

    it('shows the correct machine name in delete confirmation', async () => {
      const wrapper = mount(createDeleteIntegrationWrapper())

      // Click delete on first row
      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      await deleteBtn.trigger('click')

      expect(wrapper.text()).toContain('my-workflow')
      expect(wrapper.text()).toContain('cannot be undone')
    })

    it('closes modal on cancel button click', async () => {
      const wrapper = mount(createDeleteIntegrationWrapper())

      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      await deleteBtn.trigger('click')
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)

      const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
      expect(cancelBtn).toBeTruthy()
      await cancelBtn!.trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })

    it('emits confirm and removes machine from list', async () => {
      const wrapper = mount(createDeleteIntegrationWrapper())

      // Verify both machines present
      expect(wrapper.text()).toContain('my-workflow')
      expect(wrapper.text()).toContain('another-workflow')

      // Click delete on first machine
      const deleteBtn = wrapper.find('button[aria-label="Delete"]')
      await deleteBtn.trigger('click')
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)

      // Click Delete confirm button
      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete')
      expect(confirmBtn).toBeTruthy()
      await confirmBtn!.trigger('click')
      await nextTick()

      // Modal closed, machine removed from list
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('my-workflow')
      expect(wrapper.text()).toContain('another-workflow')
    })
  })

  // ===============================================
  // 2. CreateModal interaction
  // ===============================================
  describe('StepFunctionsCreateModal', () => {
    it('does not render modal when open is false', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: false,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })

    it('renders modal with form fields when open', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: 'my-new-machine',
          newMachineDefinition: '{"StartAt":"HelloWorld"}',
          newMachineRoleArn: 'arn:aws:iam::123456789012:role/my-role',
          newMachineType: 'STANDARD',
        },
      })

      const modal = wrapper.find('[data-testid="modal"]')
      expect(modal.exists()).toBe(true)
      expect(modal.text()).toContain('Create State Machine')
      expect(modal.text()).toContain('Name')
      expect(modal.text()).toContain('Type')
      expect(modal.text()).toContain('Role ARN')
      expect(modal.text()).toContain('Definition')
    })

    it('pre-populates form fields from props', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: 'my-test-machine',
          newMachineDefinition: '{"StartAt":"Step1"}',
          newMachineRoleArn: 'arn:aws:iam::123:role/test-role',
          newMachineType: 'EXPRESS',
        },
      })

      // Name input has value
      const nameInput = wrapper.find('.mock-form-input input')
      expect(nameInput.exists()).toBe(true)
      expect(nameInput.element).toBeDefined()

      // Type select has EXPRESS
      const typeSelect = wrapper.find('.mock-form-select select')
      expect(typeSelect.exists()).toBe(true)

      // Definition input
      const defInput = wrapper.find('.mock-form-input input')
      expect(defInput.exists()).toBe(true)
      expect(defInput.element).toBeDefined()
    })

    it('has STANDARD and EXPRESS type options', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      expect(wrapper.text()).toContain('STANDARD')
      expect(wrapper.text()).toContain('EXPRESS')
    })

    it('has Cancel and Create buttons', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      expect(wrapper.text()).toContain('Cancel')
      expect(wrapper.text()).toContain('Create')
    })

    it('emits create event when Create clicked', async () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: 'my-machine',
          newMachineDefinition: '{}',
          newMachineRoleArn: 'arn:aws:iam::1:role/r',
          newMachineType: 'STANDARD',
        },
      })

      const createBtn = wrapper.findAll('button').find((b) => b.text() === 'Create')
      expect(createBtn).toBeTruthy()
      await createBtn!.trigger('click')

      expect(wrapper.emitted('create')).toBeTruthy()
    })

    it('disables create button and shows loading state', () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: true,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      const createBtn = wrapper.findAll('button').find((b) => b.text() === 'Create')
      expect(createBtn).toBeTruthy()
      expect(createBtn!.attributes('disabled')).toBeDefined()
    })

    it('emits update:open(false) on Cancel click', async () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
      expect(cancelBtn).toBeTruthy()
      await cancelBtn!.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('emits update events on form field changes (name)', async () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      const nameInput = wrapper.find('.mock-form-input input')
      await nameInput.setValue('updated-name')

      expect(wrapper.emitted('update:new-machine-name')).toBeTruthy()
      expect(wrapper.emitted('update:new-machine-name')![0]).toEqual(['updated-name'])
    })

    it('emits update events on type select change', async () => {
      const wrapper = mount(StepFunctionsCreateModal, {
        props: {
          open: true,
          loading: false,
          newMachineName: '',
          newMachineDefinition: '',
          newMachineRoleArn: '',
          newMachineType: 'STANDARD',
        },
      })

      const typeSelect = wrapper.find('.mock-form-select select')
      await typeSelect.setValue('EXPRESS')

      expect(wrapper.emitted('update:new-machine-type')).toBeTruthy()
      expect(wrapper.emitted('update:new-machine-type')![0]).toEqual(['EXPRESS'])
    })
  })

  // ===============================================
  // 4. StepFunctionsCodeExamples renders all language tabs
  // ===============================================
  describe('StepFunctionsCodeExamples', () => {
    it('renders Usage Examples heading', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('Usage Examples')
    })

    it('renders AWS CLI tab content', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('list-state-machines')
      expect(wrapper.text()).toContain('create-state-machine')
    })

    it('renders JavaScript tab content via CodeSnippet', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('SFNClient')
      expect(wrapper.text()).toContain('ListStateMachinesCommand')
    })

    it('renders Python tab content', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('boto3')
      expect(wrapper.text()).toContain('list_state_machines')
    })

    it('renders Go tab content', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('sfn.NewFromConfig')
      expect(wrapper.text()).toContain('ListStateMachines')
    })

    it('renders all four language tabs', () => {
      const wrapper = mount(StepFunctionsCodeExamples)

      expect(wrapper.text()).toContain('AWS CLI')
      expect(wrapper.text()).toContain('JavaScript')
      expect(wrapper.text()).toContain('Python')
      expect(wrapper.text()).toContain('Go')
    })
  })
})
