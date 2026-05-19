import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  listStacks,
  createStack,
  deleteStack,
  getStackDetails,
  getStackTemplate,
  listStackResources,
} from './cloudformation'

describe('CloudFormation Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('listStacks returns mapped stacks from StackSummaries', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      StackSummaries: [{ StackName: 'my-stack', StackId: 'id1', StackStatus: 'CREATE_COMPLETE', CreationTime: '2024-01-01' }],
    }))
    const result = await listStacks()
    expect(result).toHaveLength(1)
    expect(result[0].StackName).toBe('my-stack')
    expect(result[0].StackStatus).toBe('CREATE_COMPLETE')
  })

  it('listStacks handles empty StackSummaries', async () => {
    mockFetch.mockResolvedValue(mockResponse({}))
    const result = await listStacks()
    expect(result).toEqual([])
  })

  it('createStack returns StackId', async () => {
    mockFetch.mockResolvedValue(mockResponse({ StackId: 'arn:stack:new' }))
    const result = await createStack({ StackName: 'new-stack', TemplateBody: '{}' })
    expect(result.StackId).toBe('arn:stack:new')
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.StackName).toBe('new-stack')
  })

  it('deleteStack calls with StackName', async () => {
    mockFetch.mockResolvedValue(mockResponse({}))
    await deleteStack({ StackName: 'my-stack' })
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.StackName).toBe('my-stack')
  })

  it('getStackDetails returns mapped stack from Stacks array', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      Stacks: [{ StackName: 'my-stack', StackStatus: 'CREATE_COMPLETE' }],
    }))
    const result = await getStackDetails({ StackName: 'my-stack' })
    expect(result.StackName).toBe('my-stack')
    expect(result.StackStatus).toBe('CREATE_COMPLETE')
  })

  it('getStackDetails throws APIError when stack not found', async () => {
    mockFetch.mockResolvedValue(mockResponse({ Stacks: [] }))
    await expect(getStackDetails({ StackName: 'missing' })).rejects.toThrow('not found')
  })

  it('getStackTemplate returns TemplateBody', async () => {
    mockFetch.mockResolvedValue(mockResponse({ TemplateBody: '{"key":"value"}' }))
    const result = await getStackTemplate('my-stack')
    expect(result).toBe('{"key":"value"}')
  })

  it('getStackTemplate returns empty string when missing', async () => {
    mockFetch.mockResolvedValue(mockResponse({}))
    const result = await getStackTemplate('my-stack')
    expect(result).toBe('')
  })

  it('listStackResources returns mapped resources', async () => {
    mockFetch.mockResolvedValue(mockResponse({
      StackResourceSummaries: [{ LogicalResourceId: 'log1', ResourceType: 'AWS::S3::Bucket', ResourceStatus: 'CREATE_COMPLETE' }],
    }))
    const result = await listStackResources({ StackName: 'my-stack' })
    expect(result).toHaveLength(1)
    expect(result[0].LogicalResourceId).toBe('log1')
  })

  it('listStackResources handles empty', async () => {
    mockFetch.mockResolvedValue(mockResponse({}))
    const result = await listStackResources({ StackName: 'my-stack' })
    expect(result).toEqual([])
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listStacks()).rejects.toThrow(/CloudFormation ListStacks failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'))
      await expect(listStacks()).rejects.toThrow(/Failed to ListStacks/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('sets correct target header', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await listStacks()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('cloudformation.ListStacks')
    })
  })
})
