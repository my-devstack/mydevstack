/**
 * CloudWatch Logs Service API Client
 * RESTful HTTP client for CloudWatch Logs via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

export class CloudWatchLogsService {
  private baseUrl: string

  constructor() {
    this.baseUrl = PROXY_BACKEND.replace(/\/$/, '')
  }

  private async request(method: string, path: string, options?: { body?: unknown; label?: string }): Promise<any> {
    const url = `${this.baseUrl}${path}`
    const label = options?.label || `${method} ${path}`
    const fetchOptions: RequestInit = { method }

    if (options?.body !== undefined) {
      fetchOptions.headers = { 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`CloudWatch Logs ${label} failed: ${errorText}`, response.status, 'cloudwatch-logs')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to ${label}`, 500, 'cloudwatch-logs')
    }
  }

  async describeLogGroups(params?: object): Promise<{ LogGroups?: any[] }> {
    return this.request('GET', '/cloudwatch-logs/log-groups', { body: params, label: 'DescribeLogGroups' })
  }

  async createLogGroup(params: { logGroupName: string; tags?: Record<string, string> }): Promise<any> {
    return this.request('POST', '/cloudwatch-logs/log-groups', { body: params, label: 'CreateLogGroup' })
  }

  async deleteLogGroup(logGroupName: string): Promise<any> {
    return this.request('DELETE', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}`, { label: 'DeleteLogGroup' })
  }

  async describeLogStreams(logGroupName: string, params?: object): Promise<{ LogStreams?: any[] }> {
    return this.request('GET', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}/log-streams`, { body: params, label: 'DescribeLogStreams' })
  }

  async createLogStream(logGroupName: string, logStreamName: string): Promise<any> {
    return this.request('POST', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}/log-streams`, {
      body: { logStreamName },
      label: 'CreateLogStream',
    })
  }

  async putLogEvents(logGroupName: string, logStreamName: string, logEvents: { timestamp: number; message: string }[]): Promise<any> {
    return this.request('POST', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}/log-streams/${encodeURIComponent(logStreamName)}/events`, {
      body: { logEvents },
      label: 'PutLogEvents',
    })
  }

  async getLogEvents(logGroupName: string, logStreamName: string, params?: object): Promise<{ Events?: any[] }> {
    return this.request('GET', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}/log-streams/${encodeURIComponent(logStreamName)}/events`, {
      body: params,
      label: 'GetLogEvents',
    })
  }

  async putRetentionPolicy(logGroupName: string, retentionInDays: number): Promise<any> {
    return this.request('PUT', `/cloudwatch-logs/log-groups/${encodeURIComponent(logGroupName)}/retention`, {
      body: { retentionInDays },
      label: 'PutRetentionPolicy',
    })
  }
}

export const cloudWatchLogsService = new CloudWatchLogsService()

export const describeLogGroups = (params?: object) => cloudWatchLogsService.describeLogGroups(params)
export const createLogGroup = (params: { logGroupName: string; tags?: Record<string, string> }) => cloudWatchLogsService.createLogGroup(params)
export const deleteLogGroup = (logGroupName: string) => cloudWatchLogsService.deleteLogGroup(logGroupName)
export const describeLogStreams = (logGroupName: string, params?: object) => cloudWatchLogsService.describeLogStreams(logGroupName, params)
export const createLogStream = (logGroupName: string, logStreamName: string) => cloudWatchLogsService.createLogStream(logGroupName, logStreamName)
export const putLogEvents = (logGroupName: string, logStreamName: string, logEvents: { timestamp: number; message: string }[]) => cloudWatchLogsService.putLogEvents(logGroupName, logStreamName, logEvents)
export const getLogEvents = (logGroupName: string, logStreamName: string, params?: object) => cloudWatchLogsService.getLogEvents(logGroupName, logStreamName, params)
export const putRetentionPolicy = (logGroupName: string, retentionInDays: number) => cloudWatchLogsService.putRetentionPolicy(logGroupName, retentionInDays)

export default cloudWatchLogsService
