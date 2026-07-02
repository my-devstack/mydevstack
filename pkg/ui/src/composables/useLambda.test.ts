import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLambda } from './useLambda'

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn(),
  createFunction: vi.fn(),
  updateFunctionConfiguration: vi.fn(),
  updateFunctionCode: vi.fn(),
  deleteFunction: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as lambdaApi from '@/api/services/lambda'

describe('useLambda', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { functions, loading, selectedFunction, creating, updating, invokeLoading } = useLambda()
    expect(functions.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(selectedFunction.value).toBeNull()
    expect(creating.value).toBe(false)
    expect(updating.value).toBe(false)
    expect(invokeLoading.value).toBe(false)
  })

  it('loadFunctions success', async () => {
    const mockFunctions = [
      { FunctionName: 'func1', Runtime: 'nodejs18.x' },
      { FunctionName: 'func2', Runtime: 'python3.10' },
    ]
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: mockFunctions })

    const { loadFunctions, functions, loading } = useLambda()
    
    await loadFunctions()
    
    expect(lambdaApi.listFunctions).toHaveBeenCalled()
    expect(functions.value).toHaveLength(2)
    expect(loading.value).toBe(false)
  })

  it('loadFunctions handles empty result', async () => {
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({})

    const { loadFunctions, functions } = useLambda()
    
    await loadFunctions()
    
    expect(functions.value).toEqual([])
  })

  it('loadFunctions handles error', async () => {
    vi.mocked(lambdaApi.listFunctions).mockRejectedValue(new Error('Network error'))

    const { loadFunctions, loading } = useLambda()
    
    await loadFunctions()
    
    expect(loading.value).toBe(false)
  })

  it('createFunction with file uploads code', async () => {
    const mockFile = new File(['test'], 'index.js', { type: 'application/javascript' })
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { createFunction, creating } = useLambda()
    
    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: 'arn:aws:iam::123456789012:role/test',
      zipFile: mockFile,
      architecture: 'x86_64',
      environment: '{}',
    })
    
    expect(lambdaApi.createFunction).toHaveBeenCalled()
    expect(creating.value).toBe(false)
  })

  it('createFunction includes VpcConfig when vpcSelection set', async () => {
    const mockFile = new File(['test'], 'index.js', { type: 'application/javascript' })
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { createFunction, creating } = useLambda()

    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: 'arn:aws:iam::123456789012:role/test',
      zipFile: mockFile,
      architecture: 'x86_64',
      environment: '{}',
      vpcSelection: {
        vpcId: 'vpc-123',
        subnetIds: ['subnet-1', 'subnet-2'],
        securityGroupIds: ['sg-1'],
      },
    })

    expect(lambdaApi.createFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        VpcConfig: {
          SubnetIds: ['subnet-1', 'subnet-2'],
          SecurityGroupIds: ['sg-1'],
        },
      })
    )
    expect(creating.value).toBe(false)
  })

  it('createFunction excludes VpcConfig when vpcSelection is null', async () => {
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { createFunction } = useLambda()

    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: '',
      zipFile: null,
      architecture: 'x86_64',
      environment: '',
      vpcSelection: null,
    })

    expect(lambdaApi.createFunction).toHaveBeenCalledWith(
      expect.not.objectContaining({ VpcConfig: expect.anything() })
    )
  })

  it('createFunction excludes VpcConfig when vpcSelection has no vpcId', async () => {
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { createFunction } = useLambda()

    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: '',
      zipFile: null,
      architecture: 'x86_64',
      environment: '',
      vpcSelection: {
        vpcId: '',
        subnetIds: [],
        securityGroupIds: [],
      },
    })

    expect(lambdaApi.createFunction).toHaveBeenCalledWith(
      expect.not.objectContaining({ VpcConfig: expect.anything() })
    )
  })

  it('createFunction with invalid environment JSON shows error', async () => {
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})

    const { createFunction } = useLambda()
    
    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: 'arn:aws:iam::123456789012:role/test',
      zipFile: null,
      architecture: 'x86_64',
      environment: 'invalid json',
    })
    
    expect(lambdaApi.createFunction).not.toHaveBeenCalled()
  })

  it('createFunction uses default role when not provided', async () => {
    vi.mocked(lambdaApi.createFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { createFunction } = useLambda()
    
    await createFunction({
      functionName: 'test-func',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: '',
      zipFile: null,
      architecture: 'x86_64',
      environment: '',
    })
    
    expect(lambdaApi.createFunction).toHaveBeenCalledWith(
      expect.objectContaining({ Role: 'arn:aws:iam::123456789012:role/test' })
    )
  })

  it('updateFunctionConfiguration calls API and reloads', async () => {
    vi.mocked(lambdaApi.updateFunctionConfiguration).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { updateFunctionConfiguration, updating } = useLambda()
    
    await updateFunctionConfiguration('test-func', 256, 60)
    
    expect(lambdaApi.updateFunctionConfiguration).toHaveBeenCalledWith({
      FunctionName: 'test-func',
      MemorySize: 256,
      Timeout: 60,
    })
    expect(lambdaApi.listFunctions).toHaveBeenCalled()
    expect(updating.value).toBe(false)
  })

  it('updateFunctionConfiguration throws on error', async () => {
    vi.mocked(lambdaApi.updateFunctionConfiguration).mockRejectedValue(new Error('Failed'))

    const { updateFunctionConfiguration, updating } = useLambda()
    
    await expect(updateFunctionConfiguration('test-func', 256, 60)).rejects.toThrow()
    expect(updating.value).toBe(false)
  })

  it('updateFunctionCode uploads and reloads', async () => {
    const mockFile = new File(['test'], 'index.js', { type: 'application/javascript' })
    vi.mocked(lambdaApi.updateFunctionCode).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { updateFunctionCode, updating } = useLambda()
    
    await updateFunctionCode('test-func', mockFile)
    
    expect(lambdaApi.updateFunctionCode).toHaveBeenCalled()
    expect(updating.value).toBe(false)
  })

  it('deleteFunction calls API and reloads', async () => {
    vi.mocked(lambdaApi.deleteFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { deleteFunction, loading, selectedFunction } = useLambda()
    selectedFunction.value = { FunctionName: 'test-func', Runtime: 'nodejs18.x' } as any
    
    await deleteFunction('test-func')
    
    expect(lambdaApi.deleteFunction).toHaveBeenCalledWith('test-func')
    expect(lambdaApi.listFunctions).toHaveBeenCalled()
    expect(selectedFunction.value).toBeNull()
  })

  it('deleteFunction clears selected if matches', async () => {
    vi.mocked(lambdaApi.deleteFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { deleteFunction, selectedFunction } = useLambda()
    selectedFunction.value = { FunctionName: 'test-func', Runtime: 'nodejs18.x' } as any
    
    await deleteFunction('test-func')
    
    expect(selectedFunction.value).toBeNull()
  })

  it('deleteFunction does not clear selected if different', async () => {
    vi.mocked(lambdaApi.deleteFunction).mockResolvedValue({})
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ functions: [] })

    const { deleteFunction, selectedFunction } = useLambda()
    selectedFunction.value = { FunctionName: 'other-func', Runtime: 'nodejs18.x' } as any
    
    await deleteFunction('test-func')
    
    expect(selectedFunction.value).not.toBeNull()
  })

  it('invokeFunction returns result', async () => {
    const mockResult = { Payload: '{"result": "success"}' }
    vi.mocked(lambdaApi.invoke).mockResolvedValue(mockResult)

    const { invokeFunction, invokeLoading } = useLambda()
    
    const result = await invokeFunction('test-func', '{}')
    
    expect(lambdaApi.invoke).toHaveBeenCalledWith('test-func', '{}')
    expect(result).toEqual(mockResult)
    expect(invokeLoading.value).toBe(false)
  })

  it('invokeFunction throws on error', async () => {
    vi.mocked(lambdaApi.invoke).mockRejectedValue(new Error('Invocation failed'))

    const { invokeFunction } = useLambda()
    
    await expect(invokeFunction('test-func', '{}')).rejects.toThrow('Invocation failed')
  })
})