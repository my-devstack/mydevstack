/**
 * Step Functions Service API Client
 * REST HTTP client for Step Functions via Go proxy
 * @module api/services/stepfunctions
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

// --- State Machines ---

export async function listStateMachines(): Promise<any> {
  const res = await fetch(`${api}/step-functions/state-machines`)
  if (!res.ok) throw new APIError(`List state machines failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function createStateMachine(body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${api}/step-functions/state-machines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(`Create state machine failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function describeStateMachine(arn: string): Promise<any> {
  const res = await fetch(`${api}/step-functions/state-machines/${encodeURIComponent(arn)}`)
  if (!res.ok) throw new APIError(`Describe state machine failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function updateStateMachine(arn: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${api}/step-functions/state-machines/${encodeURIComponent(arn)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(`Update state machine failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function deleteStateMachine(arn: string): Promise<void> {
  const res = await fetch(`${api}/step-functions/state-machines/${encodeURIComponent(arn)}`, { method: 'DELETE' })
  if (!res.ok) throw new APIError(`Delete state machine failed`, res.status, 'stepfunctions')
}

// --- Executions ---

export async function startExecution(arn: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${api}/step-functions/state-machines/${encodeURIComponent(arn)}/executions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(`Start execution failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function listExecutions(arn: string, params?: Record<string, unknown>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await fetch(`${api}/step-functions/state-machines/${encodeURIComponent(arn)}/executions${query}`)
  if (!res.ok) throw new APIError(`List executions failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function stopExecution(arn: string, executionArn: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${api}/step-functions/executions/${encodeURIComponent(executionArn)}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(`Stop execution failed`, res.status, 'stepfunctions')
}

export async function describeExecution(arn: string, executionArn: string): Promise<any> {
  const res = await fetch(`${api}/step-functions/executions/${encodeURIComponent(executionArn)}`)
  if (!res.ok) throw new APIError(`Describe execution failed`, res.status, 'stepfunctions')
  return res.json()
}

export async function getExecutionHistory(arn: string, executionArn: string, params?: Record<string, unknown>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const res = await fetch(`${api}/step-functions/executions/${encodeURIComponent(executionArn)}/history${query}`)
  if (!res.ok) throw new APIError(`Get execution history failed`, res.status, 'stepfunctions')
  return res.json()
}
