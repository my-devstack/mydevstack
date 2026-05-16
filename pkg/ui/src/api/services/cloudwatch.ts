/**
 * CloudWatch Service API Client
 * Simple HTTP client for CloudWatch via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function cloudwatchRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/cloudwatch/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `CloudWatch.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`CloudWatch ${action} failed: ${errorText}`, response.status, 'cloudwatch')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to ${action}`, 500, 'cloudwatch')
  }
}

export class CloudWatchService {
  async describeAlarms(params?: object): Promise<{ MetricAlarms?: any[] }> {
    return cloudwatchRequest('DescribeAlarms', params || {})
  }

  async putMetricAlarm(params: any): Promise<any> {
    return cloudwatchRequest('PutMetricAlarm', params)
  }

  async deleteAlarms(alarmNames: string[]): Promise<any> {
    return cloudwatchRequest('DeleteAlarms', { AlarmNames: alarmNames })
  }

  async setAlarmState(alarmName: string, stateValue: string, stateReason: string): Promise<any> {
    return cloudwatchRequest('SetAlarmState', {
      AlarmName: alarmName,
      StateValue: stateValue,
      StateReason: stateReason,
    })
  }

  async describeAlarmHistory(params?: object): Promise<{ AlarmHistoryItems?: any[] }> {
    return cloudwatchRequest('DescribeAlarmHistory', params || {})
  }

  async listMetrics(params?: object): Promise<{ Metrics?: any[] }> {
    return cloudwatchRequest('ListMetrics', params || {})
  }

  async getMetricData(params: any): Promise<any> {
    return cloudwatchRequest('GetMetricData', params)
  }

  async getMetricStatistics(params: any): Promise<any> {
    return cloudwatchRequest('GetMetricStatistics', params)
  }

  async putMetricData(params: any): Promise<any> {
    return cloudwatchRequest('PutMetricData', params)
  }
}

export const cloudWatchService = new CloudWatchService()

export const describeAlarms = (params?: object) => cloudWatchService.describeAlarms(params)
export const putMetricAlarm = (params: any) => cloudWatchService.putMetricAlarm(params)
export const deleteAlarms = (alarmNames: string[]) => cloudWatchService.deleteAlarms(alarmNames)
export const setAlarmState = (alarmName: string, stateValue: string, stateReason: string) => cloudWatchService.setAlarmState(alarmName, stateValue, stateReason)
export const describeAlarmHistory = (params?: object) => cloudWatchService.describeAlarmHistory(params)
export const listMetrics = (params?: object) => cloudWatchService.listMetrics(params)
export const getMetricData = (params: any) => cloudWatchService.getMetricData(params)
export const getMetricStatistics = (params: any) => cloudWatchService.getMetricStatistics(params)
export const putMetricData = (params: any) => cloudWatchService.putMetricData(params)

export default cloudWatchService
