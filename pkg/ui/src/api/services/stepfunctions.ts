/**
 * Step Functions Service API Client
 * Simple HTTP client for Step Functions via Go proxy
 * Uses REST-style endpoints (no X-Amz-Target)
 * @module api/services/stepfunctions
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const BASE = PROXY_BACKEND.replace(/\/$/, '') + '/api/stepfunctions'

// --- State Machines ---

export async function listStateMachines(): Promise<any> {
  const response = await fetch(BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to list state machines: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function createStateMachine(body: Record<string, unknown>): Promise<any> {
  const response = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to create state machine: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function describeStateMachine(arn: string): Promise<any> {
  const url = `${BASE}/${encodeURIComponent(arn)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to describe state machine: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function updateStateMachine(arn: string, body: Record<string, unknown>): Promise<any> {
  const url = `${BASE}/${encodeURIComponent(arn)}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to update state machine: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function deleteStateMachine(arn: string): Promise<void> {
  const url = `${BASE}/${encodeURIComponent(arn)}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to delete state machine: ${errorText}`, response.status, 'stepfunctions')
  }
}

// --- Executions ---

export async function startExecution(arn: string, body: Record<string, unknown>): Promise<any> {
  const url = `${BASE}/${encodeURIComponent(arn)}/executions`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to start execution: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function listExecutions(arn: string, params?: Record<string, unknown>): Promise<any> {
  const url = new URL(`${BASE}/${encodeURIComponent(arn)}/executions`)
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) url.searchParams.set(key, String(val))
    })
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to list executions: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function stopExecution(arn: string, executionArn: string, body: Record<string, unknown>): Promise<void> {
  const url = `${BASE}/${encodeURIComponent(arn)}/executions/${encodeURIComponent(executionArn)}/stop`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to stop execution: ${errorText}`, response.status, 'stepfunctions')
  }
}

export async function describeExecution(arn: string, executionArn: string): Promise<any> {
  const url = `${BASE}/${encodeURIComponent(arn)}/executions/${encodeURIComponent(executionArn)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to describe execution: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}

export async function getExecutionHistory(arn: string, executionArn: string, params?: Record<string, unknown>): Promise<any> {
  const url = new URL(`${BASE}/${encodeURIComponent(arn)}/executions/${encodeURIComponent(executionArn)}/history`)
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) url.searchParams.set(key, String(val))
    })
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new APIError(`Failed to get execution history: ${errorText}`, response.status, 'stepfunctions')
  }
  return response.json()
}
