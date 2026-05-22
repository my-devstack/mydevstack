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

    it('sends GET to /cloudwatch/alarms', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MetricAlarms: [] }))
      await describeAlarms()
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('putMetricAlarm', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricAlarm({ AlarmName: 'cpu-high', ComparisonOperator: 'GreaterThanThreshold' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AlarmName).toBe('cpu-high')
    })

    it('sends POST to /cloudwatch/alarms', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricAlarm({ AlarmName: 'cpu-high' })
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('deleteAlarms', () => {
    it('sends DELETE to /cloudwatch/alarms/{alarmName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlarms('cpu-high')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/cpu-high')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      expect(mockFetch.mock.calls[0][1].body).toBeUndefined()
    })

    it('encodes alarm name in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlarms('cpu high')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/cpu%20high')
    })
  })

  describe('setAlarmState', () => {
    it('sends state value and reason in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setAlarmState('cpu-high', 'ALARM', 'CPU exceeded 90%')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.StateValue).toBe('ALARM')
      expect(body.StateReason).toBe('CPU exceeded 90%')
      expect(body.AlarmName).toBeUndefined()
    })

    it('sends PUT to /cloudwatch/alarms/{alarmName}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setAlarmState('cpu-high', 'ALARM', 'high CPU')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/cpu-high')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('describeAlarmHistory', () => {
    it('returns AlarmHistoryItems', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AlarmHistoryItems: [{ AlarmName: 'cpu-high' }] }))
      const result = await describeAlarmHistory('cpu-high')
      expect(result.AlarmHistoryItems).toHaveLength(1)
    })

    it('sends GET to /cloudwatch/alarms/{alarmName}/history', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AlarmHistoryItems: [] }))
      await describeAlarmHistory('cpu-high')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/cpu-high/history')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('passes additional params in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AlarmHistoryItems: [] }))
      await describeAlarmHistory('cpu-high', { HistoryItemType: 'StateUpdate' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.HistoryItemType).toBe('StateUpdate')
    })
  })

  describe('listMetrics', () => {
    it('returns Metrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Metrics: [{ MetricName: 'CPUUtilization' }] }))
      const result = await listMetrics()
      expect(result.Metrics).toHaveLength(1)
    })

    it('sends GET to /cloudwatch/metrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Metrics: [] }))
      await listMetrics()
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/metrics')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getMetricData', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricData({ MetricDataQueries: [{ Id: 'm1' }] })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MetricDataQueries[0].Id).toBe('m1')
    })

    it('sends POST to /cloudwatch/metrics/data', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricData({ MetricDataQueries: [] })
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/metrics/data')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('getMetricStatistics', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricStatistics({ Namespace: 'AWS/EC2', MetricName: 'CPUUtilization' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Namespace).toBe('AWS/EC2')
    })

    it('sends POST to /cloudwatch/metrics/statistics', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricStatistics({ Namespace: 'AWS/EC2' })
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/metrics/statistics')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('putMetricData', () => {
    it('sends params as body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricData({ Namespace: 'Custom', MetricData: [{ MetricName: 'test' }] })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Namespace).toBe('Custom')
    })

    it('sends POST to /cloudwatch/metrics', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putMetricData({ Namespace: 'Custom' })
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/metrics')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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

  describe('encodeURIComponent for path params', () => {
    it('encodes alarm names with special characters', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlarms('test/alarm')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/test%2Falarm')
    })

    it('encodes alarm names in setAlarmState', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await setAlarmState('my alarm', 'ALARM', 'reason')
      expect(mockFetch.mock.calls[0][0]).toContain('/cloudwatch/alarms/my%20alarm')
    })
  })
})
