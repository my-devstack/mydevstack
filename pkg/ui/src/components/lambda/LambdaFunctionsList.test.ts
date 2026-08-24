import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { LambdaFunctionsList } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const paginatedItems = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)

vi.mock('@/composables/usePagination', () => ({
  usePagination: vi.fn(() => ({
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    goToPage: vi.fn(),
    perPageOptions: [5, 10, 20, 50],
  })),
}))

const func = {
  FunctionName: 'my-func',
  Runtime: 'nodejs22.x',
  MemorySize: 128,
  Timeout: 30,
  LastModified: '2024-01-01T00:00:00.000Z',
  Handler: 'index.handler',
  FunctionArn: 'arn:aws:lambda:us-east-1:123:function:my-func',
  Role: 'arn:aws:iam::123:role/test',
  Description: 'test function',
  CodeSize: 2048,
  State: 'Active',
}

describe('LambdaFunctionsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    paginatedItems.value = []
    currentPage.value = 1
    totalPages.value = 1
  })

  it('shows loading when loading and no functions', () => {
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [], loading: true },
    })
    expect(wrapper.html()).toContain('Loading functions...')
  })

  it('shows empty message when no functions and not loading', () => {
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [], loading: false },
    })
    expect(wrapper.html()).toContain('No Lambda functions found')
  })

  it('renders function rows', () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    expect(wrapper.html()).toContain('my-func')
    expect(wrapper.html()).toContain('nodejs22.x')
    expect(wrapper.html()).toContain('128 MB')
    expect(wrapper.html()).toContain('30s')
  })

  it('formats memory as - when missing', () => {
    paginatedItems.value = [{ ...func, MemorySize: undefined }]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [{ ...func, MemorySize: undefined }], loading: false },
    })
    expect(wrapper.html()).toContain('-')
  })

  it('formats date as Unknown when missing', () => {
    paginatedItems.value = [{ ...func, LastModified: undefined }]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [{ ...func, LastModified: undefined }], loading: false },
    })
    expect(wrapper.html()).toContain('Unknown')
  })

  it('emits delete-function when delete button clicked', async () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete-function')).toBeTruthy()
    expect(wrapper.emitted('delete-function')![0]).toEqual([func])
  })

  it('expands function details on row click', async () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    expect(wrapper.html()).not.toContain('Handler')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.html()).toContain('Handler')
    expect(wrapper.html()).toContain('index.handler')
    expect(wrapper.html()).toContain('arn:aws:lambda:us-east-1:123:function:my-func')
  })

  it('collapses function details on second click', async () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.html()).toContain('Handler')
    await row.trigger('click')
    expect(wrapper.html()).not.toContain('Handler')
  })

  it('shows VPC configuration when present', async () => {
    const vpcFunc = {
      ...func,
      VpcConfig: { VpcId: 'vpc-123', SubnetIds: ['subnet-1'], SecurityGroupIds: ['sg-1'] },
    }
    paginatedItems.value = [vpcFunc]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [vpcFunc], loading: false },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.html()).toContain('VPC Configuration')
    expect(wrapper.html()).toContain('vpc-123')
    expect(wrapper.html()).toContain('subnet-1')
    expect(wrapper.html()).toContain('sg-1')
  })

  it('emits invoke-function with payload and invocation type', async () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    const invokeBtn = wrapper.findAll('button').find(b => b.text().includes('Invoke'))
    await invokeBtn!.trigger('click')
    expect(wrapper.emitted('invoke-function')).toBeTruthy()
    expect(wrapper.emitted('invoke-function')![0]).toEqual([func, '{}', 'RequestResponse'])
  })

  it('shows result after updateInvokeResult', async () => {
    paginatedItems.value = [func]
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    ;(wrapper.vm as any).updateInvokeResult('my-func', '{"status": 200}')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('{"status": 200}')
  })

  it('shows pagination controls when totalPages > 1', () => {
    paginatedItems.value = [func]
    totalPages.value = 2
    const wrapper = mount(LambdaFunctionsList, {
      props: { functions: [func], loading: false },
    })
    expect(wrapper.html()).toContain('Previous')
    expect(wrapper.html()).toContain('Next')
  })
})
