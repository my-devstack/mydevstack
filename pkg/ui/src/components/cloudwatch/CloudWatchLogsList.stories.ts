import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchLogsList from './CloudWatchLogsList.vue'
import { createPinia, setActivePinia } from 'pinia'

const mockLogGroups = [
  { logGroupName: '/aws/lambda/test-func', creationTime: 1700000000000, retentionInDays: 30, metricFilterCount: 1, arn: 'arn:aws:logs:us-east-1:1:log-group:/aws/lambda/test-func', storedBytes: 1024 },
  { logGroupName: '/aws/ecs/my-service', creationTime: 1700001000000, retentionInDays: 7, metricFilterCount: 0, arn: 'arn:aws:logs:us-east-1:1:log-group:/aws/ecs/my-service', storedBytes: 4096 },
  { logGroupName: '/aws/rds/mydb', creationTime: 1700002000000, retentionInDays: 365, metricFilterCount: 2, arn: 'arn:aws:logs:us-east-1:1:log-group:/aws/rds/mydb', storedBytes: 9999999 },
]

const mockStreams: Record<string, any[]> = {
  '/aws/lambda/test-func': [
    { logStreamName: '2025/01/01/[$LATEST]abc123', creationTime: 1700000000000, lastEventTimestamp: 1700000500000, lastIngestionTime: 1700000600000, arn: 'arn:aws:logs:stream1', storedBytes: 512 },
    { logStreamName: '2025/01/01/[$LATEST]def456', creationTime: 1700000100000, lastEventTimestamp: 1700000600000, lastIngestionTime: 1700000700000, arn: 'arn:aws:logs:stream2', storedBytes: 256 },
  ],
}

const mockLogEvents: Record<string, any[]> = {
  '/aws/lambda/test-func:2025/01/01/[$LATEST]abc123': [
    { timestamp: 1700000300000, message: 'START RequestId: abc-123', ingestionTime: 1700000310000, eventId: 'e1' },
    { timestamp: 1700000400000, message: '{"level":"INFO","message":"Hello from Lambda"}', ingestionTime: 1700000410000, eventId: 'e2' },
    { timestamp: 1700000500000, message: 'END RequestId: abc-123', ingestionTime: 1700000510000, eventId: 'e3' },
  ],
}

export default {
  title: 'CloudWatch/CloudWatchLogsList',
  component: CloudWatchLogsList,
  decorators: [() => { setActivePinia(createPinia()); return { template: '<story/>' } }],
} as Meta<typeof CloudWatchLogsList>

export const Default: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: mockLogGroups,
    loading: false,
    expandedLogGroups: new Set(),
    logStreams: {},
    expandedLogStreams: new Set(),
    logEvents: {},
  },
}

export const Loading: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: [],
    loading: true,
    expandedLogGroups: new Set(),
    logStreams: {},
    expandedLogStreams: new Set(),
    logEvents: {},
  },
}

export const Empty: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: [],
    loading: false,
    expandedLogGroups: new Set(),
    logStreams: {},
    expandedLogStreams: new Set(),
    logEvents: {},
  },
}

export const WithLogGroups: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: mockLogGroups,
    loading: false,
    expandedLogGroups: new Set(),
    logStreams: {},
    expandedLogStreams: new Set(),
    logEvents: {},
  },
}

export const ExpandedLogGroup: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: mockLogGroups.slice(0, 1),
    loading: false,
    expandedLogGroups: new Set(['/aws/lambda/test-func']),
    logStreams: mockStreams,
    expandedLogStreams: new Set(),
    logEvents: {},
  },
}

export const ExpandedLogStream: StoryObj<typeof CloudWatchLogsList> = {
  args: {
    logGroups: mockLogGroups.slice(0, 1),
    loading: false,
    expandedLogGroups: new Set(['/aws/lambda/test-func']),
    logStreams: mockStreams,
    expandedLogStreams: new Set(['/aws/lambda/test-func:2025/01/01/[$LATEST]abc123']),
    logEvents: mockLogEvents,
  },
}
