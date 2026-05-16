import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchAlarmsList from './CloudWatchAlarmsList.vue'

const mockAlarms = [
  {
    AlarmName: 'high-cpu',
    AlarmArn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:high-cpu',
    StateValue: 'ALARM' as const,
    StateReason: 'CPU exceeded 80% for 2 consecutive periods',
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/EC2',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 80,
    ComparisonOperator: 'GreaterThanThreshold',
    Statistic: 'Average',
    ActionsEnabled: true,
    Dimensions: [{ Name: 'InstanceId', Value: 'i-1234567890abcdef0' }],
  },
  {
    AlarmName: 'low-memory',
    AlarmArn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:low-memory',
    StateValue: 'OK' as const,
    MetricName: 'FreeMemory',
    Namespace: 'AWS/EC2',
    Period: 60,
    EvaluationPeriods: 1,
    Threshold: 256,
    ComparisonOperator: 'LessThanThreshold',
    Statistic: 'Average',
  },
  {
    AlarmName: 'high-latency',
    AlarmArn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:high-latency',
    StateValue: 'INSUFFICIENT_DATA' as const,
    MetricName: 'Latency',
    Namespace: 'AWS/ELB',
    Period: 60,
    EvaluationPeriods: 1,
    Threshold: 500,
    ComparisonOperator: 'GreaterThanThreshold',
    Statistic: 'Average',
  },
]

const meta: Meta<typeof CloudWatchAlarmsList> = {
  title: 'CloudWatch/AlarmsList',
  component: CloudWatchAlarmsList,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CloudWatchAlarmsList>

export const Default: Story = {
  args: {
    alarms: mockAlarms,
    loading: false,
    expandedAlarms: new Set(),
    alarmHistory: {},
    paginatedAlarms: mockAlarms,
    alarmPage: 1,
    totalAlarmPages: 1,
    alarmsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Loading: Story = {
  args: {
    alarms: [],
    loading: true,
    expandedAlarms: new Set(),
    alarmHistory: {},
    paginatedAlarms: [],
    alarmPage: 1,
    totalAlarmPages: 1,
    alarmsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Empty: Story = {
  args: {
    alarms: [],
    loading: false,
    expandedAlarms: new Set(),
    alarmHistory: {},
    paginatedAlarms: [],
    alarmPage: 1,
    totalAlarmPages: 1,
    alarmsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Error: Story = {
  args: {
    error: 'Failed to load CloudWatch alarms',
    loading: false,
    alarms: [],
    expandedAlarms: new Set(),
    alarmHistory: {},
    paginatedAlarms: [],
    alarmPage: 1,
    totalAlarmPages: 1,
    alarmsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const ExpandedAlarm: Story = {
  args: {
    alarms: mockAlarms,
    loading: false,
    expandedAlarms: new Set(['high-cpu']),
    alarmHistory: {
      'high-cpu': [
        { Timestamp: '2024-01-01T00:00:00Z', HistorySummary: 'Alarm state changed to ALARM', HistoryItemType: 'StateUpdate' },
        { Timestamp: '2024-01-01T01:00:00Z', HistorySummary: 'Alarm state changed to OK', HistoryItemType: 'StateUpdate' },
      ],
    },
    paginatedAlarms: mockAlarms,
    alarmPage: 1,
    totalAlarmPages: 1,
    alarmsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}
