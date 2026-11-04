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
    it('GET /cloudwatch/metrics/data with params=<encoded JSON>', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricData({ MetricDataQueries: [{ Id: 'm1' }] })
      const call = mockFetch.mock.calls[0]
      const url = new URL(call[0])
      expect(url.pathname).toContain('/cloudwatch/metrics/data')
      expect(call[1].method).toBe('GET')
      expect(call[1].body).toBeUndefined()
      const paramsVal = url.searchParams.get('params')
      expect(paramsVal).toBeTruthy()
      expect(JSON.parse(paramsVal as string)).toEqual({ MetricDataQueries: [{ Id: 'm1' }] })
    })

    it('falls back to POST when URL exceeds 6000 chars', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const huge = { MetricDataQueries: [{ Id: 'm1', MetricStat: { Metric: { Dimensions: [{ Name: 'x'.repeat(7000), Value: 'v' }] } } }] }
      await getMetricData(huge)
      const call = mockFetch.mock.calls[0]
      expect(call[1].method).toBe('POST')
      expect(call[0]).toContain('/cloudwatch/metrics/data')
      const body = JSON.parse(call[1].body)
      expect(body.MetricDataQueries[0].Id).toBe('m1')
    })
  })

  describe('getMetricStatistics', () => {
    it('GET /cloudwatch/metrics/statistics with query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        StartTime: '2026-01-01T00:00:00Z',
        EndTime: '2026-01-02T00:00:00Z',
        Period: 300,
        Statistics: ['Average', 'Sum'],
        Dimensions: [{ Name: 'InstanceId', Value: 'i-1' }],
        Unit: 'Percent',
      })
      const call = mockFetch.mock.calls[0]
      const url = new URL(call[0])
      expect(url.pathname).toContain('/cloudwatch/metrics/statistics')
      expect(call[1].method).toBe('GET')
      expect(call[1].body).toBeUndefined()
      expect(url.searchParams.get('namespace')).toBe('AWS/EC2')
      expect(url.searchParams.get('metricName')).toBe('CPUUtilization')
      expect(url.searchParams.get('startTime')).toBe('2026-01-01T00:00:00Z')
      expect(url.searchParams.get('endTime')).toBe('2026-01-02T00:00:00Z')
      expect(url.searchParams.get('period')).toBe('300')
      expect(url.searchParams.get('statistics')).toBe('Average,Sum')
      expect(url.searchParams.get('dimensions')).toBe(JSON.stringify([{ Name: 'InstanceId', Value: 'i-1' }]))
      expect(url.searchParams.get('unit')).toBe('Percent')
    })

    it('omits undefined params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await getMetricStatistics({ Namespace: 'AWS/EC2' })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.searchParams.get('namespace')).toBe('AWS/EC2')
      expect(url.searchParams.has('metricName')).toBe(false)
      expect(url.searchParams.has('statistics')).toBe(false)
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
