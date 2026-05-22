/**
 * CloudWatch Service API Client
 * RESTful HTTP client for CloudWatch via Go proxy
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

export class CloudWatchService {
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
        throw new APIError(`CloudWatch ${label} failed: ${errorText}`, response.status, 'cloudwatch')
      }

      const text = await response.text()
      if (!text) return {}
      return JSON.parse(text)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to ${label}`, 500, 'cloudwatch')
    }
  }

  async describeAlarms(params?: object): Promise<{ MetricAlarms?: any[] }> {
    return this.request('GET', '/cloudwatch/alarms', { body: params, label: 'DescribeAlarms' })
  }

  async putMetricAlarm(params: any): Promise<any> {
    return this.request('POST', '/cloudwatch/alarms', { body: params, label: 'PutMetricAlarm' })
  }

  async deleteAlarms(alarmName: string): Promise<any> {
    return this.request('DELETE', `/cloudwatch/alarms/${encodeURIComponent(alarmName)}`, { label: 'DeleteAlarms' })
  }

  async setAlarmState(alarmName: string, stateValue: string, stateReason: string): Promise<any> {
    return this.request('PUT', `/cloudwatch/alarms/${encodeURIComponent(alarmName)}`, {
      body: { StateValue: stateValue, StateReason: stateReason },
      label: 'SetAlarmState',
    })
  }

  async describeAlarmHistory(alarmName: string, params?: object): Promise<{ AlarmHistoryItems?: any[] }> {
    return this.request('GET', `/cloudwatch/alarms/${encodeURIComponent(alarmName)}/history`, { body: params, label: 'DescribeAlarmHistory' })
  }

  async listMetrics(params?: object): Promise<{ Metrics?: any[] }> {
    return this.request('GET', '/cloudwatch/metrics', { body: params, label: 'ListMetrics' })
  }

  async getMetricData(params: any): Promise<any> {
    return this.request('POST', '/cloudwatch/metrics/data', { body: params, label: 'GetMetricData' })
  }

  async getMetricStatistics(params: any): Promise<any> {
    return this.request('POST', '/cloudwatch/metrics/statistics', { body: params, label: 'GetMetricStatistics' })
  }

  async putMetricData(params: any): Promise<any> {
    return this.request('POST', '/cloudwatch/metrics', { body: params, label: 'PutMetricData' })
  }
}

export const cloudWatchService = new CloudWatchService()

export const describeAlarms = (params?: object) => cloudWatchService.describeAlarms(params)
export const putMetricAlarm = (params: any) => cloudWatchService.putMetricAlarm(params)
export const deleteAlarms = (alarmName: string) => cloudWatchService.deleteAlarms(alarmName)
export const setAlarmState = (alarmName: string, stateValue: string, stateReason: string) => cloudWatchService.setAlarmState(alarmName, stateValue, stateReason)
export const describeAlarmHistory = (alarmName: string, params?: object) => cloudWatchService.describeAlarmHistory(alarmName, params)
export const listMetrics = (params?: object) => cloudWatchService.listMetrics(params)
export const getMetricData = (params: any) => cloudWatchService.getMetricData(params)
export const getMetricStatistics = (params: any) => cloudWatchService.getMetricStatistics(params)
export const putMetricData = (params: any) => cloudWatchService.putMetricData(params)

export default cloudWatchService
