/**
 * CloudWatch Logs Service API Client
 * Simple HTTP client for CloudWatch Logs via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function cloudwatchLogsRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/cloudwatchlogs/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `CloudWatchLogs.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`CloudWatch Logs ${action} failed: ${errorText}`, response.status, 'cloudwatch-logs')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to ${action}`, 500, 'cloudwatch-logs')
  }
}

export class CloudWatchLogsService {
  async describeLogGroups(params?: object): Promise<{ LogGroups?: any[] }> {
    return cloudwatchLogsRequest('DescribeLogGroups', params || {})
  }

  async createLogGroup(params: { logGroupName: string; tags?: Record<string, string> }): Promise<any> {
    return cloudwatchLogsRequest('CreateLogGroup', params)
  }

  async deleteLogGroup(logGroupName: string): Promise<any> {
    return cloudwatchLogsRequest('DeleteLogGroup', { logGroupName })
  }

  async describeLogStreams(params: { logGroupName: string }): Promise<{ LogStreams?: any[] }> {
    return cloudwatchLogsRequest('DescribeLogStreams', params)
  }

  async createLogStream(params: { logGroupName: string; logStreamName: string }): Promise<any> {
    return cloudwatchLogsRequest('CreateLogStream', params)
  }

  async putLogEvents(params: { logGroupName: string; logStreamName: string; logEvents: { timestamp: number; message: string }[] }): Promise<any> {
    return cloudwatchLogsRequest('PutLogEvents', params)
  }

  async getLogEvents(params: { logGroupName: string; logStreamName: string }): Promise<{ Events?: any[] }> {
    return cloudwatchLogsRequest('GetLogEvents', params)
  }

  async putRetentionPolicy(params: { logGroupName: string; retentionInDays: number }): Promise<any> {
    return cloudwatchLogsRequest('PutRetentionPolicy', params)
  }
}

export const cloudWatchLogsService = new CloudWatchLogsService()

export const describeLogGroups = (params?: object) => cloudWatchLogsService.describeLogGroups(params)
export const createLogGroup = (params: { logGroupName: string; tags?: Record<string, string> }) => cloudWatchLogsService.createLogGroup(params)
export const deleteLogGroup = (logGroupName: string) => cloudWatchLogsService.deleteLogGroup(logGroupName)
export const describeLogStreams = (params: { logGroupName: string }) => cloudWatchLogsService.describeLogStreams(params)
export const createLogStream = (params: { logGroupName: string; logStreamName: string }) => cloudWatchLogsService.createLogStream(params)
export const putLogEvents = (params: { logGroupName: string; logStreamName: string; logEvents: { timestamp: number; message: string }[] }) => cloudWatchLogsService.putLogEvents(params)
export const getLogEvents = (params: { logGroupName: string; logStreamName: string }) => cloudWatchLogsService.getLogEvents(params)
export const putRetentionPolicy = (params: { logGroupName: string; retentionInDays: number }) => cloudWatchLogsService.putRetentionPolicy(params)

export default cloudWatchLogsService
