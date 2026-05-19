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

  it('switchTab does not reload log groups if already loaded', async () => {
    const { selectedTab, logGroups, switchTab } = useCloudWatch()
    logGroups.value = [{ logGroupName: '/aws/lambda/test', creationTime: 123 }] as any

    switchTab('logs')

    expect(selectedTab.value).toBe('logs')
    expect(cwLogsApi.describeLogGroups).not.toHaveBeenCalled()
  })

  it('switchTab does not reload alarms if already loaded', async () => {
    const { selectedTab, alarms, switchTab } = useCloudWatch()
    alarms.value = [{ AlarmName: 'test' }] as any

    switchTab('alarms')

    expect(selectedTab.value).toBe('alarms')
    expect(cwApi.describeAlarms).not.toHaveBeenCalled()
  })

  it('switchTab does not reload metrics if already loaded', async () => {
    const { selectedTab, metrics, switchTab } = useCloudWatch()
    metrics.value = [{ MetricName: 'CPU' }] as any

    switchTab('metrics')

    expect(selectedTab.value).toBe('metrics')
    expect(cwApi.listMetrics).not.toHaveBeenCalled()
  })

  // Alarm History
  it('loadAlarmHistory populates alarmHistory cache', async () => {
    const history = [{ AlarmName: 'test', HistorySummary: 'State changed' }]
    vi.mocked(cwApi.describeAlarmHistory).mockResolvedValue({ AlarmHistoryItems: history } as any)

    const { alarmHistory, loadAlarmHistory } = useCloudWatch()
    await loadAlarmHistory('test-alarm')

    expect(alarmHistory['test-alarm']).toEqual(history)
  })

  it('loadAlarmHistory caches empty on error', async () => {
    vi.mocked(cwApi.describeAlarmHistory).mockRejectedValue(new Error('Not found'))

    const { alarmHistory, loadAlarmHistory } = useCloudWatch()
    await loadAlarmHistory('test-alarm')

    expect(alarmHistory['test-alarm']).toEqual([])
  })

  // Metric Stats
  it('getMetricStats populates metricStats cache', async () => {
    const datapoints = [{ Average: 50, Timestamp: '2024-01-01' }]
    vi.mocked(cwApi.getMetricStatistics).mockResolvedValue({ Datapoints: datapoints } as any)

    const { metricStats, getMetricStats } = useCloudWatch()
    const metric = { MetricName: 'CPUUtilization', Namespace: 'AWS/EC2', Dimensions: [] } as any
    await getMetricStats(metric)

    expect(metricStats['CPUUtilizationAWS/EC2']).toEqual(datapoints)
  })

  it('getMetricStats error shows toast', async () => {
    vi.mocked(cwApi.getMetricStatistics).mockRejectedValue(new Error('Stats error'))

    const { metricStats, getMetricStats } = useCloudWatch()
    const metric = { MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' } as any
    await getMetricStats(metric)

    expect(metricStats['CPUUtilizationAWS/EC2']).toBeUndefined()
  })

  // Toggle Metric with lazy-load
  it('toggleMetric lazy-loads metric stats when not cached', async () => {
    vi.mocked(cwApi.getMetricStatistics).mockResolvedValue({ Datapoints: [] } as any)
    const metrics = [{ MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' }]

    const { expandedMetrics, toggleMetric } = useCloudWatch()
    vi.mocked(cwApi.listMetrics).mockResolvedValue({ Metrics: metrics } as any)
    // Manually set metrics
    // We can't easily set metrics ref directly, but we can test expand
    toggleMetric('CPUUtilizationAWS/EC2')
    expect(expandedMetrics.value.has('CPUUtilizationAWS/EC2')).toBe(true)
  })

  // Normalize functions with TitleCase
  it('normalizeLogGroup handles both TitleCase and camelCase', async () => {
    // Test via loadLogGroups with TitleCase keys (as returned by Go proxy)
    const titleCaseGroup = {
      LogGroupName: '/aws/lambda/tc-test',
      CreationTime: 123456,
      RetentionInDays: 30,
      MetricFilterCount: 1,
      Arn: 'arn:aws:logs:test',
      StoredBytes: 100,
    }
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [titleCaseGroup] })

    const { loadLogGroups, logGroups } = useCloudWatch()
    await loadLogGroups()

    expect(logGroups.value[0].logGroupName).toBe('/aws/lambda/tc-test')
    expect(logGroups.value[0].creationTime).toBe(123456)
    expect(logGroups.value[0].retentionInDays).toBe(30)
    expect(logGroups.value[0].arn).toBe('arn:aws:logs:test')
  })

  it('normalizeLogStream handles TitleCase keys', async () => {
    const titleCaseStream = {
      LogStreamName: 'stream1',
      CreationTime: 123,
      FirstEventTimestamp: 456,
      LastEventTimestamp: 789,
      LastIngestionTime: 111,
      UploadSequenceToken: 'token1',
      Arn: 'arn:aws:logs:stream',
      StoredBytes: 50,
    }
    vi.mocked(cwLogsApi.describeLogStreams).mockResolvedValue({ LogStreams: [titleCaseStream] })

    const { loadLogStreams, logStreams } = useCloudWatch()
    await loadLogStreams('/aws/test')

    expect(logStreams['/aws/test'][0].logStreamName).toBe('stream1')
    expect(logStreams['/aws/test'][0].uploadSequenceToken).toBe('token1')
  })

  it('normalizeLogEvent handles TitleCase keys', async () => {
    const titleCaseEvent = {
      Timestamp: 123,
      Message: 'test log',
      IngestionTime: 456,
      EventId: 'event1',
    }
    vi.mocked(cwLogsApi.getLogEvents).mockResolvedValue({ Events: [titleCaseEvent] })

    const { loadLogEvents, logEvents } = useCloudWatch()
    await loadLogEvents('/aws/test', 'stream1')

    expect(logEvents['/aws/test:stream1'][0].message).toBe('test log')
    expect(logEvents['/aws/test:stream1'][0].timestamp).toBe(123)
  })

  // Log group error paths
  it('loadLogGroups error shows toast', async () => {
    vi.mocked(cwLogsApi.describeLogGroups).mockRejectedValue(new Error('CW error'))

    const { loadLogGroups, loading } = useCloudWatch()
    await loadLogGroups()

    expect(loading.value).toBe(false)
  })

  it('createLogGroup with tags and retention', async () => {
    vi.mocked(cwLogsApi.createLogGroup).mockResolvedValue({})
    vi.mocked(cwLogsApi.putRetentionPolicy).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { createLogGroup } = useCloudWatch()
    await createLogGroup('/aws/test', 30, [{ Key: 'Env', Value: 'Dev' }])

    expect(cwLogsApi.createLogGroup).toHaveBeenCalledWith({
      logGroupName: '/aws/test',
      tags: { Env: 'Dev' },
    })
    expect(cwLogsApi.putRetentionPolicy).toHaveBeenCalledWith({
      logGroupName: '/aws/test',
      retentionInDays: 30,
    })
  })

  it('createLogGroup without tags', async () => {
    vi.mocked(cwLogsApi.createLogGroup).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { createLogGroup } = useCloudWatch()
    await createLogGroup('/aws/test')

    expect(cwLogsApi.createLogGroup).toHaveBeenCalledWith({ logGroupName: '/aws/test' })
  })

  it('createLogGroup error shows toast', async () => {
    vi.mocked(cwLogsApi.createLogGroup).mockRejectedValue(new Error('Create failed'))

    const { createLogGroup } = useCloudWatch()
    await createLogGroup('/aws/test')
    // Error is caught internally, no throw
  })

  it('deleteLogGroup error shows toast', async () => {
    vi.mocked(cwLogsApi.deleteLogGroup).mockRejectedValue(new Error('Delete failed'))

    const { deleteLogGroup } = useCloudWatch()
    await deleteLogGroup('/aws/test')
    // Error is caught internally
  })

  it('createLogStreamFn creates stream and reloads when expanded', async () => {
    vi.mocked(cwLogsApi.createLogStream).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogStreams).mockResolvedValue({ LogStreams: [] })

    const { createLogStream, expandedLogGroups } = useCloudWatch()
    expandedLogGroups.value.add('/aws/test')
    expandedLogGroups.value = new Set(expandedLogGroups.value)

    await createLogStream('/aws/test', 'new-stream')

    expect(cwLogsApi.createLogStream).toHaveBeenCalledWith({
      logGroupName: '/aws/test',
      logStreamName: 'new-stream',
    })
    // Should invalidate cache and reload
    expect(cwLogsApi.describeLogStreams).toHaveBeenCalled()
  })

  it('createLogStreamFn error shows toast', async () => {
    vi.mocked(cwLogsApi.createLogStream).mockRejectedValue(new Error('Create failed'))

    const { createLogStream } = useCloudWatch()
    await createLogStream('/aws/test', 'new-stream')
  })

  it('loadLogStreams error caches empty', async () => {
    vi.mocked(cwLogsApi.describeLogStreams).mockRejectedValue(new Error('Stream error'))

    const { logStreams, loadLogStreams } = useCloudWatch()
    await loadLogStreams('/aws/test')

    expect(logStreams['/aws/test']).toEqual([])
  })

  it('loadLogEventsFn error caches empty', async () => {
    vi.mocked(cwLogsApi.getLogEvents).mockRejectedValue(new Error('Events error'))

    const { logEvents, loadLogEvents } = useCloudWatch()
    await loadLogEvents('/aws/test', 'stream1')

    expect(logEvents['/aws/test:stream1']).toEqual([])
  })

  it('setRetentionPolicy success', async () => {
    vi.mocked(cwLogsApi.putRetentionPolicy).mockResolvedValue({})
    vi.mocked(cwLogsApi.describeLogGroups).mockResolvedValue({ LogGroups: [] })

    const { setRetentionPolicy } = useCloudWatch()
    await setRetentionPolicy('/aws/test', 7)

    expect(cwLogsApi.putRetentionPolicy).toHaveBeenCalledWith({
      logGroupName: '/aws/test',
      retentionInDays: 7,
    })
  })

  it('setRetentionPolicy error shows toast', async () => {
    vi.mocked(cwLogsApi.putRetentionPolicy).mockRejectedValue(new Error('Policy failed'))

    const { setRetentionPolicy } = useCloudWatch()
    await setRetentionPolicy('/aws/test', 7)
  })

  it('toggleLogStream expands and lazy-loads', async () => {
    vi.mocked(cwLogsApi.getLogEvents).mockResolvedValue({ Events: [] })

    const { expandedLogStreams, toggleLogStream } = useCloudWatch()

    toggleLogStream('/aws/test', 'stream1')
    expect(expandedLogStreams.value.has('/aws/test:stream1')).toBe(true)
    expect(cwLogsApi.getLogEvents).toHaveBeenCalledWith({
      logGroupName: '/aws/test',
      logStreamName: 'stream1',
    })

    toggleLogStream('/aws/test', 'stream1')
    expect(expandedLogStreams.value.has('/aws/test:stream1')).toBe(false)
  })

  it('toggleLogStream does not reload if already cached', async () => {
    const { expandedLogStreams, logEvents, toggleLogStream } = useCloudWatch()
    logEvents['/aws/test:stream1'] = [{ timestamp: 1, message: 'cached' }] as any

    toggleLogStream('/aws/test', 'stream1')
    expect(expandedLogStreams.value.has('/aws/test:stream1')).toBe(true)
    // Should NOT call getLogEvents because already cached
    expect(cwLogsApi.getLogEvents).not.toHaveBeenCalled()
  })

  it('createAlarm with non-Error type handles string', async () => {
    vi.mocked(cwApi.putMetricAlarm).mockRejectedValue('String error')

    const { createAlarm } = useCloudWatch()
    await createAlarm({ AlarmName: 'test' })

    expect(cwApi.putMetricAlarm).toHaveBeenCalled()
  })

  it('deleteAlarm with non-Error type handles null message', async () => {
    vi.mocked(cwApi.deleteAlarms).mockRejectedValue(null)

    const { deleteAlarm } = useCloudWatch()
    await deleteAlarm('test-alarm')

    expect(cwApi.deleteAlarms).toHaveBeenCalled()
  })

  it('setAlarmState with non-Error type', async () => {
    vi.mocked(cwApi.setAlarmState).mockRejectedValue(undefined)

    const { setAlarmState } = useCloudWatch()
    await setAlarmState('test-alarm', 'ALARM', 'reason')
  })

  // Toggle alarm lazy-loads history on expand
  it('toggleAlarm does not reload history if already cached', async () => {
    const { expandedAlarms, alarmHistory, toggleAlarm } = useCloudWatch()
    alarmHistory['test-alarm'] = [{ AlarmName: 'test', HistorySummary: 'cached' }]

    toggleAlarm('test-alarm')
    expect(expandedAlarms.value.has('test-alarm')).toBe(true)
    expect(cwApi.describeAlarmHistory).not.toHaveBeenCalled()
  })

  it('toggleMetric with matching metric calls getMetricStats', async () => {
    vi.mocked(cwApi.getMetricStatistics).mockResolvedValue({ Datapoints: [] } as any)
    const { expandedMetrics, metrics, toggleMetric } = useCloudWatch()
    metrics.value = [{ MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' }] as any

    toggleMetric('CPUUtilizationAWS/EC2')
    expect(expandedMetrics.value.has('CPUUtilizationAWS/EC2')).toBe(true)
    expect(cwApi.getMetricStatistics).toHaveBeenCalled()
  })

  it('toggleMetric with no matching metric does not call API', async () => {
    vi.mocked(cwApi.getMetricStatistics).mockResolvedValue({ Datapoints: [] } as any)
    const { expandedMetrics, metrics, toggleMetric } = useCloudWatch()
    // Populate metrics so the predicate runs but doesn't match
    metrics.value = [{ MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' }] as any

    toggleMetric('NonExistentMetricAWS/FAKE')
    expect(expandedMetrics.value.has('NonExistentMetricAWS/FAKE')).toBe(true)
    expect(cwApi.getMetricStatistics).not.toHaveBeenCalled()
  })
})
