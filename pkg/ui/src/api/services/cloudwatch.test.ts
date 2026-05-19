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
  describeAlarms,
  putMetricAlarm,
  deleteAlarms,
  setAlarmState,
  describeAlarmHistory,
  listMetrics,
  getMetricData,
  getMetricStatistics,
  putMetricData,
} from './cloudwatch'

describe('CloudWatch Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('describeAlarms', () => {
    it('returns MetricAlarms', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MetricAlarms: [{ AlarmName: 'cpu-high' }] }))
      const result = await describeAlarms()
      expect(result.MetricAlarms).toHaveLength(1)
    })

    it('passes params in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MetricAlarms: [] }))
      await describeAlarms({ AlarmNames: ['cpu-high'] })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AlarmNames).toEqual(['cpu-high'])
    })
  })

  describe('putMetricAlarm', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricAlarm({ AlarmName: 'cpu-high', ComparisonOperator: 'GreaterThanThreshold' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AlarmName).toBe('cpu-high')
    })
  })

  describe('deleteAlarms', () => {
    it('sends AlarmNames array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlarms(['cpu-high', 'mem-high'])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AlarmNames).toEqual(['cpu-high', 'mem-high'])
    })
  })

  describe('setAlarmState', () => {
    it('sends alarm name, state value, and reason', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setAlarmState('cpu-high', 'ALARM', 'CPU exceeded 90%')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AlarmName).toBe('cpu-high')
      expect(body.StateValue).toBe('ALARM')
      expect(body.StateReason).toBe('CPU exceeded 90%')
    })
  })

  describe('describeAlarmHistory', () => {
    it('returns AlarmHistoryItems', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AlarmHistoryItems: [{ AlarmName: 'cpu-high' }] }))
      const result = await describeAlarmHistory()
      expect(result.AlarmHistoryItems).toHaveLength(1)
    })
  })

  describe('listMetrics', () => {
    it('returns Metrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Metrics: [{ MetricName: 'CPUUtilization' }] }))
      const result = await listMetrics()
      expect(result.Metrics).toHaveLength(1)
    })
  })

  describe('getMetricData', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricData({ MetricDataQueries: [{ Id: 'm1' }] })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MetricDataQueries[0].Id).toBe('m1')
    })
  })

  describe('getMetricStatistics', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricStatistics({ Namespace: 'AWS/EC2', MetricName: 'CPUUtilization' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Namespace).toBe('AWS/EC2')
    })
  })

  describe('putMetricData', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricData({ Namespace: 'Custom', MetricData: [{ MetricName: 'test' }] })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Namespace).toBe('Custom')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeAlarms()).rejects.toThrow(/CloudWatch DescribeAlarms failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'))
      await expect(describeAlarms()).rejects.toThrow(/Failed to DescribeAlarms/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses CloudWatch prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await describeAlarms()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('CloudWatch.DescribeAlarms')
    })
  })
})
