import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CloudWatchMetricsList from './CloudWatchMetricsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline/ChartBarIcon', () => ({
  default: { template: '<span class="mock-chart-icon" />' },
}))

const baseProps = {
  metrics: [] as any[],
  loading: false,
  expandedMetrics: new Set<string>(),
  metricStats: {} as Record<string, any[]>,
  paginatedMetrics: [] as any[],
  metricPage: 1,
  totalMetricPages: 1,
  metricsPerPage: 10,
  perPageOptions: [5, 10, 20, 50],
}

function createMetric(name: string, namespace: string, dimensions?: { Name: string; Value: string }[]) {
  return {
    MetricName: name,
    Namespace: namespace,
    Dimensions: dimensions,
  }
}

describe('CloudWatchMetricsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exists as a component', () => {
    expect(CloudWatchMetricsList).toBeDefined()
  })

  describe('empty state', () => {
    it('renders nothing when metrics array is empty', () => {
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [],
          paginatedMetrics: [],
        },
      })

      expect(wrapper.findAll('[class*="grid"]').length).toBe(0)
    })

    it('does not show pagination when metrics array is empty', () => {
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [],
          paginatedMetrics: [],
        },
      })

      expect(wrapper.text()).not.toContain('Show:')
    })
  })

  describe('metrics rendering', () => {
    it('renders metric name and namespace', () => {
      const metric = createMetric('CPUUtilization', 'AWS/EC2')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
        },
      })

      expect(wrapper.text()).toContain('CPUUtilization')
      expect(wrapper.text()).toContain('AWS/EC2')
    })

    it('renders multiple metrics', () => {
      const metrics = [
        createMetric('CPUUtilization', 'AWS/EC2'),
        createMetric('RequestCount', 'AWS/ELB'),
      ]
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics,
          paginatedMetrics: metrics,
        },
      })

      expect(wrapper.text()).toContain('CPUUtilization')
      expect(wrapper.text()).toContain('RequestCount')
      expect(wrapper.text()).toContain('AWS/ELB')
    })
  })

  describe('dimensions rendering', () => {
    it('displays dimensions when expanded', () => {
      const metric = createMetric('BytesIn', 'AWS/EC2', [
        { Name: 'InstanceId', Value: 'i-123' },
        { Name: 'InstanceType', Value: 't2.micro' },
      ])
      const expandedMetrics = new Set<string>(['BytesInAWS/EC2'])
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          expandedMetrics,
        },
      })

      expect(wrapper.text()).toContain('InstanceId=i-123')
      expect(wrapper.text()).toContain('InstanceType=t2.micro')
    })

    it('shows "None" when no dimensions and expanded', () => {
      const metric = createMetric('NoDimMetric', 'AWS/Lambda')
      const expandedMetrics = new Set<string>(['NoDimMetricAWS/Lambda'])
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          expandedMetrics,
        },
      })

      expect(wrapper.text()).toContain('None')
    })
  })

  describe('events', () => {
    it('emits toggleMetric on row click', async () => {
      const metric = createMetric('CPUUtilization', 'AWS/EC2')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')

      expect(wrapper.emitted('toggleMetric')).toBeTruthy()
      expect(wrapper.emitted('toggleMetric')![0]).toEqual(['CPUUtilizationAWS/EC2'])
    })

    it('emits updateMetricsPerPage on select change', async () => {
      const metric = createMetric('CPUUtilization', 'AWS/EC2')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
        },
      })

      const select = wrapper.find('select')
      await select.setValue('20')

      expect(wrapper.emitted('updateMetricsPerPage')).toBeTruthy()
      expect(wrapper.emitted('updateMetricsPerPage')![0]).toEqual([20])
    })

    it('emits goToPage on Next button click', async () => {
      const metric = createMetric('TestMetric', 'AWS/Test')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          totalMetricPages: 3,
        },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text() === 'Next')
      expect(nextBtn).toBeTruthy()
      await nextBtn!.trigger('click')

      expect(wrapper.emitted('goToPage')).toBeTruthy()
      expect(wrapper.emitted('goToPage')![0]).toEqual([2])
    })

    it('emits goToPage on Previous button click', async () => {
      const metric = createMetric('TestMetric', 'AWS/Test')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          metricPage: 2,
          totalMetricPages: 3,
        },
      })

      const prevBtn = wrapper.findAll('button').find(b => b.text() === 'Previous')
      expect(prevBtn).toBeTruthy()
      await prevBtn!.trigger('click')

      expect(wrapper.emitted('goToPage')).toBeTruthy()
      expect(wrapper.emitted('goToPage')![0]).toEqual([1])
    })
  })

  describe('expanded metric stats', () => {
    it('shows stats table when expanded and stats available', () => {
      const metric = createMetric('CPUUtilization', 'AWS/EC2')
      const expandedMetrics = new Set<string>(['CPUUtilizationAWS/EC2'])
      const metricStats = {
        'CPUUtilizationAWS/EC2': [
          { Timestamp: '2024-01-01T00:00:00Z', Average: 75.5 },
        ],
      }
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          expandedMetrics,
          metricStats,
        },
      })

      expect(wrapper.text()).toContain('Average')
      expect(wrapper.text()).toContain('75.5')
    })

    it('shows loading text when expanded but no stats yet', () => {
      const metric = createMetric('CPUUtilization', 'AWS/EC2')
      const expandedMetrics = new Set<string>(['CPUUtilizationAWS/EC2'])
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          expandedMetrics,
        },
      })

      expect(wrapper.text()).toContain('Loading statistics...')
    })
  })

  describe('pagination', () => {
    it('renders pagination when totalMetricPages > 1', () => {
      const metric = createMetric('Test', 'AWS/X')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          totalMetricPages: 3,
        },
      })

      expect(wrapper.text()).toContain('Page 1 of 3')
    })

    it('disables Previous on first page', () => {
      const metric = createMetric('Test', 'AWS/X')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          totalMetricPages: 3,
          metricPage: 1,
        },
      })

      const prevBtn = wrapper.findAll('button').find(b => b.text() === 'Previous')
      expect(prevBtn!.attributes('disabled')).toBeDefined()
    })

    it('disables Next on last page', () => {
      const metric = createMetric('Test', 'AWS/X')
      const wrapper = mount(CloudWatchMetricsList, {
        props: {
          ...baseProps,
          metrics: [metric],
          paginatedMetrics: [metric],
          totalMetricPages: 3,
          metricPage: 3,
        },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text() === 'Next')
      expect(nextBtn!.attributes('disabled')).toBeDefined()
    })
  })
})
