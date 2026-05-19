import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCloudFormation } from './useCloudFormation'

vi.mock('@/api/services/cloudformation', () => ({
  listStacks: vi.fn(),
  createStack: vi.fn(),
  deleteStack: vi.fn(),
  getStackDetails: vi.fn(),
  getStackTemplate: vi.fn(),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import * as cfApi from '@/api/services/cloudformation'

describe('useCloudFormation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { stacks, loading, error, selectedStackName } = useCloudFormation()
    expect(stacks.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(selectedStackName.value).toBeNull()
  })

  it('fetchStacks success', async () => {
    const mockStacks = [
      { StackName: 'stack1', StackStatus: 'CREATE_COMPLETE', CreationTime: '2024-01-01' },
      { StackName: 'stack2', StackStatus: 'CREATE_COMPLETE', CreationTime: '2024-01-02' },
    ]
    vi.mocked(cfApi.listStacks).mockResolvedValue(mockStacks)

    const { fetchStacks, stacks, loading } = useCloudFormation()

    await fetchStacks()

    expect(cfApi.listStacks).toHaveBeenCalled()
    expect(stacks.value).toHaveLength(2)
    expect(loading.value).toBe(false)
  })

  it('fetchStacks handles error', async () => {
    vi.mocked(cfApi.listStacks).mockRejectedValue(new Error('Network error'))

    const { fetchStacks, loading, error } = useCloudFormation()

    await fetchStacks()

    expect(loading.value).toBe(false)
    expect(error.value).not.toBeNull()
  })

  it('createStack calls API and reloads', async () => {
    vi.mocked(cfApi.createStack).mockResolvedValue({ StackId: 'arn:aws:cloudformation:...' })
    vi.mocked(cfApi.listStacks).mockResolvedValue([])

    const { createStack, loading } = useCloudFormation()

    await createStack({ StackName: 'test-stack', TemplateBody: '{}' })

    expect(cfApi.createStack).toHaveBeenCalledWith({ StackName: 'test-stack', TemplateBody: '{}' })
    expect(cfApi.listStacks).toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('createStack throws on error', async () => {
    vi.mocked(cfApi.createStack).mockRejectedValue(new Error('Failed'))

    const { createStack, loading, error } = useCloudFormation()

    await expect(createStack({ StackName: 'test-stack' })).rejects.toThrow('Failed')
    expect(loading.value).toBe(false)
    expect(error.value).not.toBeNull()
  })

  it('deleteStack calls API and reloads', async () => {
    vi.mocked(cfApi.deleteStack).mockResolvedValue(undefined)
    vi.mocked(cfApi.listStacks).mockResolvedValue([])

    const { deleteStack, loading, selectedStackName } = useCloudFormation()
    selectedStackName.value = 'test-stack'

    await deleteStack('test-stack')

    expect(cfApi.deleteStack).toHaveBeenCalledWith({ StackName: 'test-stack' })
    expect(cfApi.listStacks).toHaveBeenCalled()
    expect(selectedStackName.value).toBeNull()
  })

  it('deleteStack clears selectedStackName if matches', async () => {
    vi.mocked(cfApi.deleteStack).mockResolvedValue(undefined)
    vi.mocked(cfApi.listStacks).mockResolvedValue([])

    const { deleteStack, selectedStackName } = useCloudFormation()
    selectedStackName.value = 'test-stack'

    await deleteStack('test-stack')

    expect(selectedStackName.value).toBeNull()
  })

  it('deleteStack does not clear selectedStackName if different', async () => {
    vi.mocked(cfApi.deleteStack).mockResolvedValue(undefined)
    vi.mocked(cfApi.listStacks).mockResolvedValue([])

    const { deleteStack, selectedStackName } = useCloudFormation()
    selectedStackName.value = 'other-stack'

    await deleteStack('test-stack')

    expect(selectedStackName.value).not.toBeNull()
    expect(selectedStackName.value).toBe('other-stack')
  })

  it('selectStack sets selected stack name (toggle on)', () => {
    const { selectStack, selectedStackName } = useCloudFormation()
    const stack = { StackName: 'my-stack', StackStatus: 'CREATE_COMPLETE', CreationTime: '2024-01-01' } as any

    selectStack(stack)

    expect(selectedStackName.value).toEqual('my-stack')
  })

  it('selectStack toggles off when same stack selected', () => {
    const { selectStack, selectedStackName } = useCloudFormation()
    const stack = { StackName: 'my-stack', StackStatus: 'CREATE_COMPLETE', CreationTime: '2024-01-01' } as any

    // First select
    selectStack(stack)
    expect(selectedStackName.value).toEqual('my-stack')

    // Second select (same) → deselect
    selectStack(stack)
    expect(selectedStackName.value).toBeNull()
  })

  it('selectStack clears selection when null', () => {
    const { selectStack, selectedStackName } = useCloudFormation()
    selectedStackName.value = 'my-stack'

    selectStack(null)

    expect(selectedStackName.value).toBeNull()
  })

  it('clearError resets error', () => {
    const { clearError, error } = useCloudFormation()
    error.value = 'Some error'

    clearError()

    expect(error.value).toBeNull()
  })

  it('getStackDetails returns stack details', async () => {
    const mockDetails = { StackName: 'stack1', StackStatus: 'CREATE_COMPLETE' }
    vi.mocked(cfApi.getStackDetails).mockResolvedValue(mockDetails as any)

    const { getStackDetails } = useCloudFormation()
    const result = await getStackDetails('stack1')

    expect(cfApi.getStackDetails).toHaveBeenCalledWith({ StackName: 'stack1' })
    expect(result).toEqual(mockDetails)
  })

  it('getStackDetails propagates error', async () => {
    vi.mocked(cfApi.getStackDetails).mockRejectedValue(new Error('Not found'))

    const { getStackDetails } = useCloudFormation()
    await expect(getStackDetails('nonexistent')).rejects.toThrow('Not found')
  })

  it('getStackTemplate returns template', async () => {
    const mockTemplate = { TemplateBody: '{"Resources":{}}' }
    vi.mocked(cfApi.getStackTemplate).mockResolvedValue(mockTemplate as any)

    const { getStackTemplate } = useCloudFormation()
    const result = await getStackTemplate('stack1')

    expect(cfApi.getStackTemplate).toHaveBeenCalledWith('stack1')
    expect(result).toEqual(mockTemplate)
  })

  it('getStackTemplate propagates error', async () => {
    vi.mocked(cfApi.getStackTemplate).mockRejectedValue(new Error('No template'))

    const { getStackTemplate } = useCloudFormation()
    await expect(getStackTemplate('nonexistent')).rejects.toThrow('No template')
  })

  it('deleteStack error sets error and throws', async () => {
    vi.mocked(cfApi.deleteStack).mockRejectedValue(new Error('Delete failed'))

    const { deleteStack, error, loading } = useCloudFormation()
    await expect(deleteStack('stack1')).rejects.toThrow('Delete failed')

    expect(error.value).not.toBeNull()
    expect(error.value).toContain('Delete failed')
    expect(loading.value).toBe(false)
  })

  it('deleteStack handles non-Error rejection', async () => {
    vi.mocked(cfApi.deleteStack).mockRejectedValue('String error')

    const { deleteStack, loading } = useCloudFormation()
    await expect(deleteStack('stack1')).rejects.toBe('String error')
    expect(loading.value).toBe(false)
  })

  it('fetchStacks handles non-Error rejection', async () => {
    vi.mocked(cfApi.listStacks).mockRejectedValue('String error')

    const { fetchStacks, error, loading } = useCloudFormation()
    await fetchStacks()

    expect(error.value).toBe('Failed to load stacks')
    expect(loading.value).toBe(false)
  })

  it('codeExamples contains code snippets', () => {
    const { codeExamples } = useCloudFormation()
    expect(codeExamples.value.length).toBeGreaterThan(0)
    expect(codeExamples.value[0].language).toBe('aws-cli')
  })
})
