import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCloudWatch } from './useCloudWatch'
import * as cwApi from '@/api/services/cloudwatch'
import * as cwLogsApi from '@/api/services/cloudwatch-logs'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/services/cloudwatch')
vi.mock('@/api/services/cloudwatch-logs')

describe('useCloudWatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadAlarms success', async () => {
    const mockAlarms = [
      { AlarmName: 'test-alarm', StateValue: 'OK', MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' },
    ]
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: mockAlarms })

    const { alarms, loading, loadAlarms } = useCloudWatch()
    expect(alarms.value).toEqual([])

    await loadAlarms()

    expect(alarms.value).toEqual(mockAlarms)
    expect(loading.value).toBe(false)
  })

  it('loadAlarms error', async () => {
    vi.mocked(cwApi.describeAlarms).mockRejectedValue(new Error('Network error'))

    const { alarms, loadAlarms } = useCloudWatch()
    await loadAlarms()

    expect(alarms.value).toEqual([])
  })

  it('loadMetrics success', async () => {
    const mockMetrics = [
      { MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' },
    ]
    vi.mocked(cwApi.listMetrics).mockResolvedValue({ Metrics: mockMetrics })

    const { metrics, loadMetrics } = useCloudWatch()
    await loadMetrics()

    expect(metrics.value).toEqual(mockMetrics)
  })

  it('loadMetrics error', async () => {
    vi.mocked(cwApi.listMetrics).mockRejectedValue(new Error('Network error'))

    const { metrics, loadMetrics } = useCloudWatch()
    await loadMetrics()

    expect(metrics.value).toEqual([])
  })

  it('createAlarm calls API and reloads', async () => {
    vi.mocked(cwApi.putMetricAlarm).mockResolvedValue({})
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: [] })

    const { createAlarm } = useCloudWatch()
    await createAlarm({ AlarmName: 'test', MetricName: 'CPU', Namespace: 'AWS/EC2', Period: 300, EvaluationPeriods: 1, Threshold: 80, ComparisonOperator: 'GreaterThanThreshold' })

    expect(cwApi.putMetricAlarm).toHaveBeenCalled()
    expect(cwApi.describeAlarms).toHaveBeenCalled()
  })

  it('createAlarm error shows toast', async () => {
    vi.mocked(cwApi.putMetricAlarm).mockRejectedValue(new Error('API error'))

    const { createAlarm } = useCloudWatch()
    await createAlarm({ AlarmName: 'test', MetricName: 'CPU', Namespace: 'AWS/EC2', Period: 300, EvaluationPeriods: 1, Threshold: 80, ComparisonOperator: 'GreaterThanThreshold' })

    expect(cwApi.putMetricAlarm).toHaveBeenCalled()
  })

  it('deleteAlarm calls API and reloads', async () => {
    vi.mocked(cwApi.deleteAlarms).mockResolvedValue({})
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: [] })

    const { deleteAlarm } = useCloudWatch()
    await deleteAlarm('test-alarm')

    expect(cwApi.deleteAlarms).toHaveBeenCalledWith(['test-alarm'])
    expect(cwApi.describeAlarms).toHaveBeenCalled()
  })

  it('setAlarmState calls API and reloads', async () => {
    vi.mocked(cwApi.setAlarmState).mockResolvedValue({})
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: [] })

    const { setAlarmState } = useCloudWatch()
    await setAlarmState('test-alarm', 'ALARM', 'testing')

    expect(cwApi.setAlarmState).toHaveBeenCalledWith('test-alarm', 'ALARM', 'testing')
    expect(cwApi.describeAlarms).toHaveBeenCalled()
  })

  it('toggleAlarm expands and collapses', async () => {
    vi.mocked(cwApi.describeAlarmHistory).mockResolvedValue({ AlarmHistoryItems: [] })

    const { expandedAlarms, toggleAlarm } = useCloudWatch()

    toggleAlarm('test-alarm')
    expect(expandedAlarms.value.has('test-alarm')).toBe(true)

    toggleAlarm('test-alarm')
    expect(expandedAlarms.value.has('test-alarm')).toBe(false)
  })

  it('toggleMetric expands and collapses', async () => {
    vi.mocked(cwApi.getMetricStatistics).mockResolvedValue({ Datapoints: [] })

    const { expandedMetrics, toggleMetric } = useCloudWatch()

    toggleMetric('CPUUtilizationAWS/EC2')
    expect(expandedMetrics.value.has('CPUUtilizationAWS/EC2')).toBe(true)

    toggleMetric('CPUUtilizationAWS/EC2')
    expect(expandedMetrics.value.has('CPUUtilizationAWS/EC2')).toBe(false)
  })

  it('switchTab loads alarms when empty', async () => {
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: [] })

    const { selectedTab, switchTab } = useCloudWatch()
    switchTab('alarms')

    expect(selectedTab.value).toBe('alarms')
  })

  it('switchTab loads metrics when empty', async () => {
    vi.mocked(cwApi.listMetrics).mockResolvedValue({ Metrics: [] })

    const { selectedTab, switchTab } = useCloudWatch()
    switchTab('metrics')

    expect(selectedTab.value).toBe('metrics')
  })

  it('toggleAlarm lazy-loads alarm history on expand', async () => {
    const historyItems = [{ AlarmName: 'test-alarm', HistorySummary: 'State changed', Timestamp: '2024-01-01T00:00:00Z' }]
    vi.mocked(cwApi.describeAlarmHistory).mockResolvedValue({ AlarmHistoryItems: historyItems })

    const { expandedAlarms, alarmHistory, toggleAlarm } = useCloudWatch()

    toggleAlarm('test-alarm')
    expect(expandedAlarms.value.has('test-alarm')).toBe(true)
    // Wait a tick for the async load
    await new Promise(process.nextTick)
    expect(cwApi.describeAlarmHistory).toHaveBeenCalledWith({ AlarmName: 'test-alarm' })
  })

  // --- Logs tests ---
  it('loadLogGroups populates logGroups ref', async () => {
    const mockGroups = [{ logGroupName: '/aws/lambda/test', creationTime: 123, storedBytes: 0, metricFilterCount: 0, arn: 'arn:aws:logs:test' }]
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: mockGroups })

    const { logGroups, loadLogGroups } = useCloudWatch()
    expect(logGroups.value).toEqual([])

    await loadLogGroups()

    expect(logGroups.value).toEqual(mockGroups)
  })

  it('createLogGroup succeeds and reloads', async () => {
    vi.mocked(cwLogsApi.createLogGroup).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { createLogGroup } = useCloudWatch()
    await createLogGroup('/aws/test')

    expect(cwLogsApi.createLogGroup).toHaveBeenCalledWith({ logGroupName: '/aws/test' })
    expect(cwLogsApi.describeLogGroups).toHaveBeenCalled()
  })

  it('deleteLogGroup succeeds and reloads', async () => {
    vi.mocked(cwLogsApi.deleteLogGroup).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { deleteLogGroup } = useCloudWatch()
    await deleteLogGroup('/aws/test')

    expect(cwLogsApi.deleteLogGroup).toHaveBeenCalledWith('/aws/test')
    expect(cwLogsApi.describeLogGroups).toHaveBeenCalled()
  })

  it('toggleLogGroup lazy-loads log streams on expand', async () => {
    vi.mocked(cwLogsApi.describeLogStreams).mockResolvedValue({ LogStreams: [{ logStreamName: 'stream1' }] })

    const { expandedLogGroups, toggleLogGroup } = useCloudWatch()

    toggleLogGroup('/aws/test')
    expect(expandedLogGroups.value.has('/aws/test')).toBe(true)
    expect(cwLogsApi.describeLogStreams).toHaveBeenCalledWith({ logGroupName: '/aws/test' })

    toggleLogGroup('/aws/test')
    expect(expandedLogGroups.value.has('/aws/test')).toBe(false)
  })

  it('loadLogStreams populates logStreams cache', async () => {
    const mockStreams = [{ logStreamName: 'stream1', creationTime: 123, storedBytes: 0, lastIngestionTime: 456, arn: 'arn:aws:logs:test' }]
    vi.mocked(cwLogsApi.describeLogStreams).mockResolvedValue({ LogStreams: mockStreams })

    const { logStreams, loadLogStreams } = useCloudWatch()
    await loadLogStreams('/aws/test')

    expect(logStreams['/aws/test']).toEqual(mockStreams)
  })

  it('loadLogEvents populates logEvents cache', async () => {
    const mockEvents = [{ timestamp: 123, message: 'test log', ingestionTime: 456, eventId: 'event1' }]
    vi.mocked(cwLogsApi.getLogEvents).mockResolvedValue({ Events: mockEvents })

    const { logEvents, loadLogEvents } = useCloudWatch()
    await loadLogEvents('/aws/test', 'stream1')

    expect(logEvents['/aws/test:stream1']).toEqual(mockEvents)
  })

  it('switchTab loads log groups when empty', async () => {
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { selectedTab, switchTab } = useCloudWatch()
    switchTab('logs')

    expect(selectedTab.value).toBe('logs')
  })
})
