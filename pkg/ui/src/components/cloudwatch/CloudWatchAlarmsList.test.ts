import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CloudWatchAlarmsList from './CloudWatchAlarmsList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

// Mock StatusBadge
vi.mock('@/components/common/StatusBadge.vue', () => ({
  default: {
    name: 'StatusBadge',
    props: ['status', 'label', 'size'],
    template: '<span class="mock-status-badge" :data-status="status">{{ label }}</span>',
  },
}))

// Mock Button
vi.mock('@/components/common/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'disabled'],
    template: '<button class="mock-button" :disabled="disabled"><slot /></button>',
  },
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline/ChartBarIcon', () => ({
  default: { template: '<span class="mock-chart-icon" />' },
}))

const baseProps = {
  alarms: [] as any[],
  loading: false,
  expandedAlarms: new Set<string>(),
  alarmHistory: {} as Record<string, any[]>,
  paginatedAlarms: [] as any[],
  alarmPage: 1,
  totalAlarmPages: 1,
  alarmsPerPage: 10,
  perPageOptions: [5, 10, 20, 50],
}

function createAlarm(name: string, state: string) {
  return {
    AlarmName: name,
    AlarmArn: `arn:aws:cloudwatch:us-east-1:1:alarm:${name}`,
    StateValue: state,
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/EC2',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 80,
    ComparisonOperator: 'GreaterThanThreshold',
    Statistic: 'Average',
  }
}

describe('CloudWatchAlarmsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exists as a component', () => {
    expect(CloudWatchAlarmsList).toBeDefined()
  })

  describe('empty state', () => {
    it('renders nothing when alarms array is empty and not loading', () => {
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [],
          paginatedAlarms: [],
        },
      })

      // No alarm cards rendered
      expect(wrapper.findAll('[class*="grid"]').length).toBe(0)
    })

    it('does not show pagination when alarms array is empty', () => {
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [],
          paginatedAlarms: [],
        },
      })

      expect(wrapper.text()).not.toContain('Show:')
    })
  })

  describe('alarm states rendering', () => {
    it('renders ALARM state correctly', () => {
      const alarm = createAlarm('test-alarm-1', 'ALARM')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      expect(wrapper.text()).toContain('test-alarm-1')
      // StatusBadge should receive "active" status for ALARM
      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('active')
    })

    it('renders OK state correctly', () => {
      const alarm = createAlarm('test-alarm-2', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      expect(wrapper.text()).toContain('test-alarm-2')
      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('inactive')
    })

    it('renders INSUFFICIENT_DATA state correctly', () => {
      const alarm = createAlarm('test-alarm-3', 'INSUFFICIENT_DATA')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      expect(wrapper.text()).toContain('test-alarm-3')
      const badge = wrapper.find('.mock-status-badge')
      expect(badge.attributes('data-status')).toBe('pending')
    })

    it('renders MetricName and Namespace', () => {
      const alarm = createAlarm('test-alarm-4', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      expect(wrapper.text()).toContain('CPUUtilization')
      expect(wrapper.text()).toContain('AWS/EC2')
    })
  })

  describe('events', () => {
    it('emits toggleAlarm on row click', async () => {
      const alarm = createAlarm('test-toggle', 'ALARM')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      const row = wrapper.find('.cursor-pointer')
      await row.trigger('click')

      expect(wrapper.emitted('toggleAlarm')).toBeTruthy()
      expect(wrapper.emitted('toggleAlarm')![0]).toEqual(['test-toggle'])
    })

    it('emits setAlarmState on Set ALARM button click', async () => {
      const alarm = createAlarm('test-set-alarm', 'OK')
      const expandedAlarms = new Set<string>(['test-set-alarm'])
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
        },
      })

      const setAlarmBtn = wrapper.findAll('button').find(b => b.text() === 'Set ALARM')
      expect(setAlarmBtn).toBeTruthy()
      await setAlarmBtn!.trigger('click')

      expect(wrapper.emitted('setAlarmState')).toBeTruthy()
      expect(wrapper.emitted('setAlarmState')![0]).toEqual(['test-set-alarm', 'ALARM'])
    })

    it('emits setAlarmState on Set OK button click', async () => {
      const alarm = createAlarm('test-set-ok', 'ALARM')
      const expandedAlarms = new Set<string>(['test-set-ok'])
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
        },
      })

      const setOkBtn = wrapper.findAll('button').find(b => b.text() === 'Set OK')
      expect(setOkBtn).toBeTruthy()
      await setOkBtn!.trigger('click')

      expect(wrapper.emitted('setAlarmState')).toBeTruthy()
      expect(wrapper.emitted('setAlarmState')![0]).toEqual(['test-set-ok', 'OK'])
    })

    it('emits deleteAlarm on Delete button click', async () => {
      const alarm = createAlarm('test-delete', 'ALARM')
      const expandedAlarms = new Set<string>(['test-delete'])
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
        },
      })

      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Delete')
      expect(deleteBtn).toBeTruthy()
      await deleteBtn!.trigger('click')

      expect(wrapper.emitted('deleteAlarm')).toBeTruthy()
      expect(wrapper.emitted('deleteAlarm')![0]).toEqual(['test-delete'])
    })

    it('emits updateAlarmsPerPage on select change', async () => {
      const alarm = createAlarm('test-per-page', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
        },
      })

      const select = wrapper.find('select')
      await select.setValue('20')

      expect(wrapper.emitted('updateAlarmsPerPage')).toBeTruthy()
      expect(wrapper.emitted('updateAlarmsPerPage')![0]).toEqual([20])
    })

    it('emits goToPage on Previous button click', async () => {
      const alarm = createAlarm('test-page', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          alarmPage: 2,
          totalAlarmPages: 3,
        },
      })

      const prevBtn = wrapper.findAll('button').find(b => b.text() === 'Previous')
      expect(prevBtn).toBeTruthy()
      await prevBtn!.trigger('click')

      expect(wrapper.emitted('goToPage')).toBeTruthy()
      expect(wrapper.emitted('goToPage')![0]).toEqual([1])
    })

    it('emits goToPage on Next button click', async () => {
      const alarm = createAlarm('test-next', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          alarmPage: 1,
          totalAlarmPages: 3,
        },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text() === 'Next')
      expect(nextBtn).toBeTruthy()
      await nextBtn!.trigger('click')

      expect(wrapper.emitted('goToPage')).toBeTruthy()
      expect(wrapper.emitted('goToPage')![0]).toEqual([2])
    })
  })

  describe('expanded alarm details', () => {
    it('shows alarm details when expanded', () => {
      const alarm = createAlarm('expanded-test', 'ALARM')
      const expandedAlarms = new Set<string>(['expanded-test'])
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
        },
      })

      expect(wrapper.text()).toContain('Threshold')
      expect(wrapper.text()).toContain('80')
      expect(wrapper.text()).toContain('Period')
      expect(wrapper.text()).toContain('300s')
      expect(wrapper.text()).toContain('GreaterThanThreshold')
    })

    it('shows dimensions when alarm has them', () => {
      const alarm = {
        ...createAlarm('dim-test', 'ALARM'),
        Dimensions: [{ Name: 'InstanceId', Value: 'i-123' }],
      }
      const expandedAlarms = new Set<string>(['dim-test'])
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
        },
      })

      expect(wrapper.text()).toContain('InstanceId=i-123')
    })

    it('shows alarm history when available', () => {
      const alarm = createAlarm('history-test', 'ALARM')
      const expandedAlarms = new Set<string>(['history-test'])
      const alarmHistory = {
        'history-test': [
          { Timestamp: '2024-01-01T00:00:00Z', HistorySummary: 'State update to ALARM' },
        ],
      }
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          expandedAlarms,
          alarmHistory,
        },
      })

      expect(wrapper.text()).toContain('State update to ALARM')
    })
  })

  describe('pagination', () => {
    it('renders pagination when totalAlarmPages > 1', () => {
      const alarm = createAlarm('page-test', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          totalAlarmPages: 3,
        },
      })

      expect(wrapper.text()).toContain('Page 1 of 3')
    })

    it('disables Previous on first page', () => {
      const alarm = createAlarm('first', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          totalAlarmPages: 3,
          alarmPage: 1,
        },
      })

      const prevBtn = wrapper.findAll('button').find(b => b.text() === 'Previous')
      expect(prevBtn!.attributes('disabled')).toBeDefined()
    })

    it('disables Next on last page', () => {
      const alarm = createAlarm('last', 'OK')
      const wrapper = mount(CloudWatchAlarmsList, {
        props: {
          ...baseProps,
          alarms: [alarm],
          paginatedAlarms: [alarm],
          totalAlarmPages: 3,
          alarmPage: 3,
        },
      })

      const nextBtn = wrapper.findAll('button').find(b => b.text() === 'Next')
      expect(nextBtn!.attributes('disabled')).toBeDefined()
    })
  })
})
