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
    it('sends GET to /step-functions/state-machines', async () => {
      mockFetch.mockResolvedValue(mockResponse({ StateMachines: [{ name: 'my-sfn' }] }))
      const result = await listStateMachines()
      expect(result.StateMachines).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('createStateMachine', () => {
    it('sends POST to /step-functions/state-machines with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ stateMachineArn: 'arn:sfn:new' }))
      const result = await createStateMachine({ name: 'my-sfn', definition: '{}', roleArn: 'arn:role' })
      expect(result.stateMachineArn).toBe('arn:sfn:new')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.name).toBe('my-sfn')
    })
  })

  describe('describeStateMachine', () => {
    it('sends GET to /step-functions/state-machines/{arn}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ name: 'my-sfn' }))
      const result = await describeStateMachine('arn:sfn:machine')
      expect(result.name).toBe('my-sfn')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('updateStateMachine', () => {
    it('sends PUT to /step-functions/state-machines/{arn} with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateStateMachine('arn:sfn:machine', { definition: '{}' })
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.definition).toBe('{}')
      expect(body.StateMachineArn).toBeUndefined()
    })
  })

  describe('deleteStateMachine', () => {
    it('sends DELETE to /step-functions/state-machines/{arn}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteStateMachine('arn:sfn:machine')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('startExecution', () => {
    it('sends POST to /step-functions/state-machines/{arn}/executions with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ executionArn: 'arn:sfn:exec' }))
      const result = await startExecution('arn:sfn:machine', { input: '{}' })
      expect(result.executionArn).toBe('arn:sfn:exec')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine/executions')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.input).toBe('{}')
      expect(body.StateMachineArn).toBeUndefined()
    })
  })

  describe('listExecutions', () => {
    it('sends GET to /step-functions/state-machines/{arn}/executions', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine/executions')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })

    it('sends query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine', { maxResults: 10, statusFilter: 'SUCCEEDED' })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/step-functions/state-machines/arn%3Asfn%3Amachine/executions')
      expect(url).toContain('maxResults=10')
      expect(url).toContain('statusFilter=SUCCEEDED')
    })

    it('excludes undefined values from query', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Executions: [] }))
      await listExecutions('arn:sfn:machine', { maxResults: 10, statusFilter: undefined })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('maxResults=10')
      expect(url).not.toContain('statusFilter')
    })
  })

  describe('stopExecution', () => {
    it('sends POST to /step-functions/executions/{executionArn}/stop with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await stopExecution('arn:sfn:sm', 'arn:sfn:exec', { cause: 'test' })
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/executions/arn%3Asfn%3Aexec/stop')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.cause).toBe('test')
      expect(body.ExecutionArn).toBeUndefined()
    })
  })

  describe('describeExecution', () => {
    it('sends GET to /step-functions/executions/{executionArn}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ status: 'SUCCEEDED' }))
      const result = await describeExecution('arn:sfn:sm', 'arn:sfn:exec')
      expect(result.status).toBe('SUCCEEDED')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/executions/arn%3Asfn%3Aexec')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('getExecutionHistory', () => {
    it('sends GET to /step-functions/executions/{executionArn}/history', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [] }))
      await getExecutionHistory('arn:sfn:sm', 'arn:sfn:exec')
      expect(mockFetch.mock.calls[0][0]).toContain('/step-functions/executions/arn%3Asfn%3Aexec/history')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })

    it('sends query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Events: [] }))
      await getExecutionHistory('arn:sfn:sm', 'arn:sfn:exec', { maxResults: 50 })
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/step-functions/executions/arn%3Asfn%3Aexec/history')
      expect(url).toContain('maxResults=50')
    })
  })

  describe('Error handling', () => {
    const methods: [string, () => Promise<any>][] = [
      ['listStateMachines', () => listStateMachines()],
      ['createStateMachine', () => createStateMachine({ name: 't', definition: '{}', roleArn: 'r' })],
      ['describeStateMachine', () => describeStateMachine('arn:sfn:m')],
      ['updateStateMachine', () => updateStateMachine('arn:sfn:m', { definition: '{}' })],
      ['deleteStateMachine', () => deleteStateMachine('arn:sfn:m')],
      ['startExecution', () => startExecution('arn:sfn:m', { input: '{}' })],
      ['listExecutions', () => listExecutions('arn:sfn:m')],
      ['stopExecution', () => stopExecution('arn:sfn:m', 'arn:sfn:e', { cause: 'test' })],
      ['describeExecution', () => describeExecution('arn:sfn:m', 'arn:sfn:e')],
      ['getExecutionHistory', () => getExecutionHistory('arn:sfn:m', 'arn:sfn:e')],
    ]

    for (const [name, fn] of methods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/failed/)
      })
    }

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listStateMachines()).rejects.toThrow('Network error')
    })
  })
})
