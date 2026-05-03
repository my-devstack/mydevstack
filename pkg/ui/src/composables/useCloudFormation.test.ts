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
})
