import { ref, reactive } from 'vue'
import { useToast } from '@/composables/useToast'
import * as cwApi from '@/api/services/cloudwatch'
import * as cwLogsApi from '@/api/services/cloudwatch-logs'
import type { CWAlarm, CWMetric, CloudWatchLogGroup, CloudWatchLogStream, CWLogEvent } from '@/api/types/aws'

export function useCloudWatch() {
  const toast = useToast()

  // Alarms & Metrics state
  const alarms = ref<CWAlarm[]>([])
  const metrics = ref<CWMetric[]>([])
  const loading = ref(false)
  const expandedAlarms = ref<Set<string>>(new Set())
  const expandedMetrics = ref<Set<string>>(new Set())
  const selectedTab = ref<'logs' | 'alarms' | 'metrics'>('logs')

  // Logs state
  const logGroups = ref<CloudWatchLogGroup[]>([])
  const logStreams = reactive<Record<string, CloudWatchLogStream[]>>({})
  const logEvents = reactive<Record<string, CWLogEvent[]>>({})
  const expandedLogGroups = ref<Set<string>>(new Set())
  const expandedLogStreams = ref<Set<string>>(new Set())

  // Lazy-loaded caches
  const alarmHistory = reactive<Record<string, any[]>>({})
  const metricStats = reactive<Record<string, any[]>>({})

  async function loadAlarms() {
    loading.value = true
    try {
      const result = await cwApi.describeAlarms()
      alarms.value = result.MetricAlarms || []
    } catch (error) {
      toast.error('Failed to load CloudWatch alarms')
    } finally {
      loading.value = false
    }
  }

  async function createAlarm(params: any) {
    try {
      await cwApi.putMetricAlarm(params)
      toast.success('Alarm created successfully')
      await loadAlarms()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to create alarm: ${msg}`)
    }
  }

  async function deleteAlarm(alarmName: string) {
    try {
      await cwApi.deleteAlarms(alarmName)
      toast.success('Alarm deleted successfully')
      await loadAlarms()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to delete alarm: ${msg}`)
    }
  }

  async function setAlarmStateFn(alarmName: string, stateValue: string, stateReason: string) {
    try {
      await cwApi.setAlarmState(alarmName, stateValue, stateReason)
      toast.success('Alarm state updated successfully')
      await loadAlarms()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to set alarm state: ${msg}`)
    }
  }

  async function loadAlarmHistory(alarmName: string) {
    try {
      const result = await cwApi.describeAlarmHistory(alarmName)
      alarmHistory[alarmName] = result.AlarmHistoryItems || []
    } catch (error) {
      alarmHistory[alarmName] = [] // cache empty so we don't re-fetch on every expand
    }
  }

  async function loadMetrics() {
    loading.value = true
    try {
      const result = await cwApi.listMetrics()
      metrics.value = result.Metrics || []
    } catch (error) {
      toast.error('Failed to load CloudWatch metrics')
    } finally {
      loading.value = false
    }
  }

  async function getMetricStatsFn(metric: CWMetric) {
    const key = metric.MetricName + metric.Namespace
    try {
      const result = await cwApi.getMetricStatistics({
        Namespace: metric.Namespace,
        MetricName: metric.MetricName,
        Dimensions: metric.Dimensions,
        Statistics: ['Average'],
        Period: 300,
        StartTime: new Date(Date.now() - 3600000).toISOString(),
        EndTime: new Date().toISOString(),
      })
      metricStats[key] = result.Datapoints || []
    } catch (error) {
      toast.error(`Failed to load statistics for ${metric.MetricName}`)
    }
  }

  function toggleAlarm(alarmName: string) {
    if (expandedAlarms.value.has(alarmName)) {
      expandedAlarms.value.delete(alarmName)
    } else {
      expandedAlarms.value.add(alarmName)
      // Lazy-load alarm history on expand
      if (!alarmHistory[alarmName]) {
        loadAlarmHistory(alarmName)
      }
    }
    expandedAlarms.value = new Set(expandedAlarms.value)
  }

  function toggleMetric(metricKey: string) {
    if (expandedMetrics.value.has(metricKey)) {
      expandedMetrics.value.delete(metricKey)
    } else {
      expandedMetrics.value.add(metricKey)
      // Lazy-load metric stats on expand
      if (!metricStats[metricKey]) {
        const metric = metrics.value.find(
          (m) => m.MetricName + m.Namespace === metricKey
        )
        if (metric) {
          getMetricStatsFn(metric)
        }
      }
    }
    expandedMetrics.value = new Set(expandedMetrics.value)
  }

  // --- Logs methods ---
  // Normalize TitleCase JSON keys (from Go proxy) to camelCase (TypeScript convention)
  function normalizeLogGroup(raw: any): CloudWatchLogGroup {
    return {
      logGroupName: raw.LogGroupName ?? raw.logGroupName,
      creationTime: raw.CreationTime ?? raw.creationTime,
      retentionInDays: raw.RetentionInDays ?? raw.retentionInDays,
      metricFilterCount: raw.MetricFilterCount ?? raw.metricFilterCount,
      arn: raw.Arn ?? raw.arn,
      storedBytes: raw.StoredBytes ?? raw.storedBytes,
    }
  }

  function normalizeLogStream(raw: any): CloudWatchLogStream {
    return {
      logStreamName: raw.LogStreamName ?? raw.logStreamName,
      creationTime: raw.CreationTime ?? raw.creationTime,
      firstEventTimestamp: raw.FirstEventTimestamp ?? raw.firstEventTimestamp,
      lastEventTimestamp: raw.LastEventTimestamp ?? raw.lastEventTimestamp,
      lastIngestionTime: raw.LastIngestionTime ?? raw.lastIngestionTime,
      uploadSequenceToken: raw.UploadSequenceToken ?? raw.uploadSequenceToken,
      arn: raw.Arn ?? raw.arn,
      storedBytes: raw.StoredBytes ?? raw.storedBytes,
    }
  }

  function normalizeLogEvent(raw: any): CWLogEvent {
    return {
      timestamp: raw.Timestamp ?? raw.timestamp,
      message: raw.Message ?? raw.message,
      ingestionTime: raw.IngestionTime ?? raw.ingestionTime,
      eventId: raw.EventId ?? raw.eventId,
    }
  }

  async function loadLogGroups() {
    loading.value = true
    try {
      const result = await cwLogsApi.describeLogGroups()
      logGroups.value = (result.LogGroups || []).map(normalizeLogGroup)
    } catch (error) {
      toast.error('Failed to load CloudWatch log groups')
    } finally {
      loading.value = false
    }
  }

  async function createLogGroup(name: string, retention?: number, tags?: { Key: string; Value: string }[]) {
    try {
      const params: any = { logGroupName: name }
      if (tags?.length) {
        params.tags = tags.reduce((acc: Record<string, string>, t) => {
          acc[t.Key] = t.Value
          return acc
        }, {} as Record<string, string>)
      }
      await cwLogsApi.createLogGroup(params)
      if (retention) {
        await cwLogsApi.putRetentionPolicy(name, retention)
      }
      toast.success('Log group created successfully')
      await loadLogGroups()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to create log group: ${msg}`)
    }
  }

  async function deleteLogGroupFn(name: string) {
    try {
      await cwLogsApi.deleteLogGroup(name)
      toast.success('Log group deleted successfully')
      await loadLogGroups()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to delete log group: ${msg}`)
    }
  }

  async function createLogStreamFn(groupName: string, streamName: string) {
    try {
      await cwLogsApi.createLogStream(groupName, streamName)
      toast.success(`Stream ${streamName} created`)
      // Invalidate cache so re-expand fetches fresh streams
      delete logStreams[groupName]
      // Re-load if currently expanded
      if (expandedLogGroups.value.has(groupName)) {
        await loadLogStreams(groupName)
      }
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to create log stream: ${msg}`)
    }
  }

  async function loadLogStreams(groupName: string) {
    try {
      const result = await cwLogsApi.describeLogStreams(groupName)
      logStreams[groupName] = (result.LogStreams || []).map(normalizeLogStream)
    } catch (error) {
      logStreams[groupName] = [] // cache empty so we don't re-fetch on every expand
      toast.error(`Failed to load log streams for ${groupName}`)
    }
  }

  async function loadLogEventsFn(groupName: string, streamName: string) {
    const key = `${groupName}:${streamName}`
    try {
      const result = await cwLogsApi.getLogEvents(groupName, streamName)
      logEvents[key] = (result.Events || []).map(normalizeLogEvent)
    } catch (error) {
      logEvents[key] = [] // cache empty so we don't re-fetch on every expand
      toast.error(`Failed to load log events for ${streamName}`)
    }
  }

  async function setRetentionPolicy(groupName: string, days: number) {
    try {
      await cwLogsApi.putRetentionPolicy(groupName, days)
      toast.success('Retention policy updated')
      await loadLogGroups()
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to set retention policy: ${msg}`)
    }
  }

  function toggleLogGroup(name: string) {
    if (expandedLogGroups.value.has(name)) {
      expandedLogGroups.value.delete(name)
    } else {
      expandedLogGroups.value.add(name)
      // Lazy-load log streams on expand
      if (!logStreams[name]) {
        loadLogStreams(name)
      }
    }
    expandedLogGroups.value = new Set(expandedLogGroups.value)
  }

  function toggleLogStream(groupName: string, streamName: string) {
    const key = `${groupName}:${streamName}`
    if (expandedLogStreams.value.has(key)) {
      expandedLogStreams.value.delete(key)
    } else {
      expandedLogStreams.value.add(key)
      // Lazy-load log events on expand
      if (!logEvents[key]) {
        loadLogEventsFn(groupName, streamName)
      }
    }
    expandedLogStreams.value = new Set(expandedLogStreams.value)
  }

  function switchTab(tab: 'logs' | 'alarms' | 'metrics') {
    selectedTab.value = tab
    if (tab === 'logs' && logGroups.value.length === 0) {
      loadLogGroups()
    }
    if (tab === 'alarms' && alarms.value.length === 0) {
      loadAlarms()
    }
    if (tab === 'metrics' && metrics.value.length === 0) {
      loadMetrics()
    }
  }

  return {
    alarms,
    metrics,
    loading,
    expandedAlarms,
    expandedMetrics,
    selectedTab,
    alarmHistory,
    metricStats,
    loadAlarms,
    createAlarm,
    deleteAlarm,
    setAlarmState: setAlarmStateFn,
    loadAlarmHistory,
    loadMetrics,
    getMetricStats: getMetricStatsFn,
    toggleAlarm,
    toggleMetric,
    // Logs
    logGroups,
    logStreams,
    logEvents,
    expandedLogGroups,
    expandedLogStreams,
    loadLogGroups,
    createLogGroup,
    deleteLogGroup: deleteLogGroupFn,
    loadLogStreams,
    createLogStream: createLogStreamFn,
    loadLogEvents: loadLogEventsFn,
    setRetentionPolicy,
    toggleLogGroup,
    toggleLogStream,
    switchTab,
  }
}
