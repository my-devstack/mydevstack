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
  listStateMachines,
  createStateMachine,
  describeStateMachine,
  updateStateMachine,
  deleteStateMachine,
  startExecution,
  listExecutions,
  stopExecution,
  describeExecution,
  getExecutionHistory,
} from './stepfunctions'

describe('Step Functions Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listStateMachines', () => {
    it('returns state machines', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StateMachines: [{ name: 'my-sfn' }] }))
      const result = await listStateMachines()
      expect(result.StateMachines).toHaveLength(1)
    })
  })

  describe('createStateMachine', () => {
    it('sends request body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ stateMachineArn: 'arn:sfn:new' }))
      const result = await createStateMachine({ name: 'my-sfn', definition: '{}', roleArn: 'arn:role' })
      expect(result.stateMachineArn).toBe('arn:sfn:new')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.name).toBe('my-sfn')
    })
  })

  describe('describeStateMachine', () => {
    it('sends StateMachineArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ name: 'my-sfn' }))
      const result = await describeStateMachine('arn:sfn:machine')
      expect(result.name).toBe('my-sfn')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateMachineArn).toBe('arn:sfn:machine')
    })
  })

  describe('updateStateMachine', () => {
    it('sends body with StateMachineArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateStateMachine('arn:sfn:machine', { definition: '{}' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateMachineArn).toBe('arn:sfn:machine')
      expect(body.definition).toBe('{}')
    })
  })

  describe('deleteStateMachine', () => {
    it('sends StateMachineArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteStateMachine('arn:sfn:machine')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateMachineArn).toBe('arn:sfn:machine')
    })
  })

  describe('startExecution', () => {
    it('sends body with StateMachineArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ executionArn: 'arn:sfn:exec' }))
      const result = await startExecution('arn:sfn:machine', { input: '{}' })
      expect(result.executionArn).toBe('arn:sfn:exec')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateMachineArn).toBe('arn:sfn:machine')
    })
  })

  describe('listExecutions', () => {
    it('sends StateMachineArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateMachineArn).toBe('arn:sfn:machine')
    })

    it('sends additional params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine', { maxResults: 10, statusFilter: 'SUCCEEDED' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.maxResults).toBe(10)
    })

    it('excludes undefined values from params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine', { maxResults: 10, statusFilter: undefined })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.maxResults).toBe(10)
      expect(body.statusFilter).toBeUndefined()
    })
  })

  describe('stopExecution', () => {
    it('sends ExecutionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await stopExecution('arn:sfn:sm', 'arn:sfn:exec', { cause: 'test' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ExecutionArn).toBe('arn:sfn:exec')
    })
  })

  describe('describeExecution', () => {
    it('sends ExecutionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ status: 'SUCCEEDED' }))
      const result = await describeExecution('arn:sfn:sm', 'arn:sfn:exec')
      expect(result.status).toBe('SUCCEEDED')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ExecutionArn).toBe('arn:sfn:exec')
    })
  })

  describe('getExecutionHistory', () => {
    it('sends ExecutionArn', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [] }))
      await getExecutionHistory('arn:sfn:sm', 'arn:sfn:exec')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ExecutionArn).toBe('arn:sfn:exec')
    })

    it('sends additional params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [] }))
      await getExecutionHistory('arn:sfn:sm', 'arn:sfn:exec', { maxResults: 50 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.maxResults).toBe(50)
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listStateMachines()).rejects.toThrow(/Step Functions ListStateMachines failed/)
    })

    it('throws on network error (no try/catch in sfRequest)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listStateMachines()).rejects.toThrow('Network error')
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses full action name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StateMachines: [] }))
      await listStateMachines()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('ListStateMachines')
    })
  })
})
