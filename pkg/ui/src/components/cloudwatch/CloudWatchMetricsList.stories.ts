import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchMetricsList from './CloudWatchMetricsList.vue'

const mockMetrics = [
  { MetricName: 'CPUUtilization', Namespace: 'AWS/EC2', Dimensions: [{ Name: 'InstanceId', Value: 'i-1234' }] },
  { MetricName: 'RequestCount', Namespace: 'AWS/ELB', Dimensions: [{ Name: 'LoadBalancerName', Value: 'my-lb' }] },
  { MetricName: 'ReadLatency', Namespace: 'AWS/RDS', Dimensions: [{ Name: 'DBInstanceIdentifier', Value: 'mydb' }] },
  { MetricName: 'FreeStorageSpace', Namespace: 'AWS/RDS', Dimensions: [{ Name: 'DBInstanceIdentifier', Value: 'mydb' }] },
]

const meta: Meta<typeof CloudWatchMetricsList> = {
  title: 'CloudWatch/MetricsList',
  component: CloudWatchMetricsList,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CloudWatchMetricsList>

export const Default: Story = {
  args: {
    metrics: mockMetrics,
    loading: false,
    expandedMetrics: new Set(),
    metricStats: {},
    paginatedMetrics: mockMetrics,
    metricPage: 1,
    totalMetricPages: 1,
    metricsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Loading: Story = {
  args: {
    metrics: [],
    loading: true,
    expandedMetrics: new Set(),
    metricStats: {},
    paginatedMetrics: [],
    metricPage: 1,
    totalMetricPages: 1,
    metricsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Empty: Story = {
  args: {
    metrics: [],
    loading: false,
    expandedMetrics: new Set(),
    metricStats: {},
    paginatedMetrics: [],
    metricPage: 1,
    totalMetricPages: 1,
    metricsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

export const Error: Story = {
  args: {
    error: 'Failed to load CloudWatch metrics',
    loading: false,
    metrics: [],
    expandedMetrics: new Set(),
    metricStats: {},
    paginatedMetrics: [],
    metricPage: 1,
    totalMetricPages: 1,
    metricsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}

const expandedKey = 'CPUUtilizationAWS/EC2'
export const ExpandedMetric: Story = {
  args: {
    metrics: mockMetrics,
    loading: false,
    expandedMetrics: new Set([expandedKey]),
    metricStats: {
      [expandedKey]: [
        { Timestamp: '2024-01-01T00:00:00Z', Average: 45.2 },
        { Timestamp: '2024-01-01T00:05:00Z', Average: 52.1 },
        { Timestamp: '2024-01-01T00:10:00Z', Average: 48.7 },
      ],
    },
    paginatedMetrics: mockMetrics,
    metricPage: 1,
    totalMetricPages: 1,
    metricsPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
  },
}
