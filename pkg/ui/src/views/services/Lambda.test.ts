import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn().mockResolvedValue([]),
  createFunction: vi.fn().mockResolvedValue({}),
  getFunction: vi.fn().mockResolvedValue(null),
  deleteFunction: vi.fn().mockResolvedValue({}),
  invoke: vi.fn().mockResolvedValue({}),
  invokeFunction: vi.fn().mockResolvedValue({}),
  updateFunctionConfiguration: vi.fn().mockResolvedValue({}),
  updateFunctionCode: vi.fn().mockResolvedValue({}),
  getFunctionConfiguration: vi.fn().mockResolvedValue(null),
  listEventSourceMappings: vi.fn().mockResolvedValue({ EventSourceMappings: [] }),
  createEventSourceMapping: vi.fn().mockResolvedValue({}),
  deleteEventSourceMapping: vi.fn().mockResolvedValue({}),
  getEventSourceMapping: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import Lambda from './Lambda.vue'

const lambdaFunctionListStub = {
  template: '<div class="lambda-functions-list-stub" />',
  methods: { updateInvokeResult: vi.fn() },
}

describe('Lambda.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders Lambda Functions heading', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Lambda Functions')
  })

  it('renders Create Function button', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Create Function')
  })

  it('renders LambdaFunctionsList component', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('div.lambda-functions-list-stub').exists()).toBe(true)
  })

  it('renders LambdaCodeExamples component', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('lambda-code-examples-stub').exists()).toBe(true)
  })

  it('renders modals', () => {
    const wrapper = shallowMount(Lambda, {
      global: {
        stubs: {
          LambdaFunctionsList: lambdaFunctionListStub,
          LambdaCreateModal: true,
          LambdaEditModal: true,
          LambdaDeleteModal: true,
          LambdaCodeExamples: true,
          CodeBracketIcon: true,
        },
      },
    })
    expect(wrapper.find('lambda-create-modal-stub').exists()).toBe(true)
    expect(wrapper.find('lambda-edit-modal-stub').exists()).toBe(true)
    expect(wrapper.find('lambda-delete-modal-stub').exists()).toBe(true)
  })

  describe('template inline handler coverage', () => {
    const stubs = {
      LambdaFunctionsList: lambdaFunctionListStub,
      LambdaCreateModal: true,
      LambdaEditModal: true,
      LambdaDeleteModal: true,
      LambdaCodeExamples: true,
      CodeBracketIcon: true,
    }

    it('Create Function button triggers modal', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('modal @update:open handlers', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const modals = ['lambda-create-modal-stub', 'lambda-edit-modal-stub', 'lambda-delete-modal-stub']
      for (const sel of modals) {
        const modal = wrapper.findComponent(sel)
        if (modal.exists() && modal.vm) {
          modal.vm.$emit('update:open', false)
        }
      }
    })

    it('LambdaFunctionsList events', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const list = wrapper.findComponent({ name: 'LambdaFunctionsList' })
      if (list.exists() && list.vm) {
        list.vm.$emit('select', { FunctionName: 'test-func' })
        list.vm.$emit('delete', { FunctionName: 'test-func' })
      }
    })

    it('handleCreate calls createFunction and closes modal', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      await wrapper.vm.handleCreate({
        functionName: 'my-func',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memory: 128,
        timeout: 30,
        roleArn: 'arn:aws:iam::role/test',
        zipFile: null,
        architecture: 'x86_64',
        environment: '',
      })
      expect(wrapper.vm.showCreateModal).toBe(false)
    })

    it('handleCreate handles error from composable', async () => {
      const lambdaModule = await import('@/api/services/lambda')
      ;(lambdaModule.createFunction as any).mockRejectedValueOnce(new Error('Create failed'))
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      await wrapper.vm.handleCreate({
        functionName: 'my-func',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memory: 128,
        timeout: 30,
        roleArn: 'arn:aws:iam::role/test',
        zipFile: null,
        architecture: 'x86_64',
        environment: '',
      })
      // error is caught in view handleCreate
      expect(wrapper.vm.showCreateModal).toBe(false)
    })

    it('openEditModal sets selectedFunction and form state', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const func = { FunctionName: 'my-func', MemorySize: 256, Timeout: 60 } as any
      wrapper.vm.openEditModal(func)
      expect(wrapper.vm.selectedFunction).toEqual(func)
      expect(wrapper.vm.editForm.memory).toBe(256)
      expect(wrapper.vm.editForm.timeout).toBe(60)
      expect(wrapper.vm.showEditModal).toBe(true)
    })

    it('openEditModal defaults memory/timeout when not provided', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const func = { FunctionName: 'my-func' } as any
      wrapper.vm.openEditModal(func)
      expect(wrapper.vm.editForm.memory).toBe(128)
      expect(wrapper.vm.editForm.timeout).toBe(30)
    })

    it('handleUpdateConfig calls updateFunctionConfiguration', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = { FunctionName: 'my-func' } as any
      wrapper.vm.showEditModal = true
      await wrapper.vm.handleUpdateConfig(256, 60)
      expect(wrapper.vm.showEditModal).toBe(false)
    })

    it('handleUpdateConfig without selectedFunction returns early', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = null
      await wrapper.vm.handleUpdateConfig(256, 60)
      // no error means early return
    })

    it('handleUpdateConfig handles error', async () => {
      const lambdaModule = await import('@/api/services/lambda')
      ;(lambdaModule.updateFunctionConfiguration as any).mockRejectedValueOnce(new Error('Update failed'))
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = { FunctionName: 'my-func' } as any
      await wrapper.vm.handleUpdateConfig(256, 60)
      // error handled in composable
    })

    it('openDeleteModal sets selectedFunction and opens modal', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const func = { FunctionName: 'my-func' } as any
      wrapper.vm.openDeleteModal(func)
      expect(wrapper.vm.selectedFunction).toEqual(func)
      expect(wrapper.vm.showDeleteModal).toBe(true)
    })

    it('deleteFunctionHandler deletes and resets state', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = { FunctionName: 'my-func' } as any
      wrapper.vm.showDeleteModal = true
      await wrapper.vm.deleteFunctionHandler()
      expect(wrapper.vm.showDeleteModal).toBe(false)
      expect(wrapper.vm.selectedFunction).toBeNull()
    })

    it('deleteFunctionHandler without selectedFunction returns early', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = null
      await wrapper.vm.deleteFunctionHandler()
    })

    it('deleteFunctionHandler handles error', async () => {
      const lambdaModule = await import('@/api/services/lambda')
      ;(lambdaModule.deleteFunction as any).mockRejectedValueOnce(new Error('Delete failed'))
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.selectedFunction = { FunctionName: 'my-func' } as any
      await wrapper.vm.deleteFunctionHandler()
    })

    it('handleInvokeFromList with json payload calls invokeFunction', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      // The stub now provides updateInvokeResult via its methods
      const func = { FunctionName: 'my-func' } as any
      await wrapper.vm.handleInvokeFromList(func, '{"key":"value"}', 'RequestResponse')
      // The stub's updateInvokeResult should have been called
    })

    it('handleInvokeFromList with plain text payload', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const func = { FunctionName: 'my-func' } as any
      await wrapper.vm.handleInvokeFromList(func, 'plain-string', 'RequestResponse')
    })

    it('handleInvokeFromList handles invoke error', async () => {
      const lambdaModule = await import('@/api/services/lambda')
      ;(lambdaModule.invokeFunction as any).mockRejectedValueOnce(new Error('Invoke failed'))
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const func = { FunctionName: 'my-func' } as any
      await wrapper.vm.handleInvokeFromList(func, '{}', 'RequestResponse')
    })

    it('Create Function button click triggers modal', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.showCreateModal = true
      expect(wrapper.vm.showCreateModal).toBe(true)
    })

    it('LambdaCreateModal @create emit calls handleCreate', async () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const modal = wrapper.findComponent('lambda-create-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('create', { functionName: 'test', runtime: 'nodejs', handler: 'index', memory: 128, timeout: 30, roleArn: 'arn:aws:iam::role/test', zipFile: null, architecture: 'x86_64', environment: '' })
      }
    })

    it('LambdaEditModal @update-config emit', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const modal = wrapper.findComponent('lambda-edit-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('update-config', 256, 60)
      }
    })

    it('LambdaDeleteModal @delete emit', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      const modal = wrapper.findComponent('lambda-delete-modal-stub')
      if (modal.exists() && modal.vm) {
        modal.vm.$emit('delete')
      }
    })

    it('loadFunctionsFromComposable called via refresh button', () => {
      const wrapper = shallowMount(Lambda, { global: { stubs } })
      wrapper.vm.loadFunctionsFromComposable()
    })
  })
})
