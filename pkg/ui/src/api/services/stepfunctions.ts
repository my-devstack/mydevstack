/**
 * Step Functions Service API Client
 * Uses proxy pattern with X-Amz-Target header dispatch
 * @module api/services/stepfunctions
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function sfRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/stepfunctions/`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Target': action,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Step Functions ${action} failed: ${errorText}`, response.status, 'stepfunctions')
  }

  return response.json()
}

// --- State Machines ---

export async function listStateMachines(): Promise<any> {
  return sfRequest('ListStateMachines', {})
}

export async function createStateMachine(body: Record<string, unknown>): Promise<any> {
  return sfRequest('CreateStateMachine', body)
}

export async function describeStateMachine(arn: string): Promise<any> {
  return sfRequest('DescribeStateMachine', { StateMachineArn: arn })
}

export async function updateStateMachine(arn: string, body: Record<string, unknown>): Promise<any> {
  return sfRequest('UpdateStateMachine', { ...body, StateMachineArn: arn })
}

export async function deleteStateMachine(arn: string): Promise<void> {
  await sfRequest('DeleteStateMachine', { StateMachineArn: arn })
}

// --- Executions ---

export async function startExecution(arn: string, body: Record<string, unknown>): Promise<any> {
  return sfRequest('StartExecution', { ...body, StateMachineArn: arn })
}

export async function listExecutions(arn: string, params?: Record<string, unknown>): Promise<any> {
  const body: Record<string, unknown> = { StateMachineArn: arn }
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) body[key] = val
    })
  }
  return sfRequest('ListExecutions', body)
}

export async function stopExecution(arn: string, executionArn: string, body: Record<string, unknown>): Promise<void> {
  await sfRequest('StopExecution', { ...body, ExecutionArn: executionArn })
}

export async function describeExecution(arn: string, executionArn: string): Promise<any> {
  return sfRequest('DescribeExecution', { ExecutionArn: executionArn })
}

export async function getExecutionHistory(arn: string, executionArn: string, params?: Record<string, unknown>): Promise<any> {
  const body: Record<string, unknown> = { ExecutionArn: executionArn }
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) body[key] = val
    })
  }
  return sfRequest('GetExecutionHistory', body)
}
