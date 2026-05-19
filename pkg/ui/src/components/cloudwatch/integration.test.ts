import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CloudWatchAlarmsList from './CloudWatchAlarmsList.vue'
import CloudWatchMetricsList from './CloudWatchMetricsList.vue'
import CloudWatchCreateAlarmModal from './CloudWatchCreateAlarmModal.vue'
import CloudWatchDeleteAlarmModal from './CloudWatchDeleteAlarmModal.vue'
import CloudWatchLogsList from './CloudWatchLogsList.vue'
import CloudWatchCreateLogGroupModal from './CloudWatchCreateLogGroupModal.vue'
import CloudWatchDeleteLogGroupModal from './CloudWatchDeleteLogGroupModal.vue'

// Mock useSettingsStore
vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

const mockAlarms = [
  {
    AlarmName: 'alarm-1',
    AlarmArn: 'arn:aws:cloudwatch:us-east-1:1:alarm:alarm-1',
    StateValue: 'ALARM' as const,
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/EC2',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 80,
    ComparisonOperator: 'GreaterThanThreshold',
    Statistic: 'Average',
  },
]

const mockMetrics = [
  { MetricName: 'CPUUtilization', Namespace: 'AWS/EC2' },
  { MetricName: 'RequestCount', Namespace: 'AWS/ELB' },
]

const mockLogGroups = [
  { logGroupName: '/aws/lambda/test', creationTime: 1700000000000, retentionInDays: 30, metricFilterCount: 1, arn: 'arn:aws:logs:test', storedBytes: 1024 },
  { logGroupName: '/aws/ecs/service', creationTime: 1700001000000, retentionInDays: 7, metricFilterCount: 0, arn: 'arn:aws:logs:test2', storedBytes: 4096 },
]

const modalStub = {
  template: '<div v-if="open" class="modal-dialog"><div class="modal-content"><slot /></div></div>',
  props: ['open', 'title', 'size'],
  emits: ['update:open'],
}
const buttonStub = {
  template: '<button :disabled="disabled" :loading="loading" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled', 'size'],
  emits: ['click'],
}

describe('CloudWatch Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('CloudWatchAlarmsList renders alarms', () => {
    const wrapper = mount(CloudWatchAlarmsList, {
      props: {
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
    })
    expect(wrapper.text()).toContain('alarm-1')
    expect(wrapper.text()).toContain('ALARM')
    expect(wrapper.text()).toContain('CPUUtilization')
  })

  it('CloudWatchAlarmsList emits toggleAlarm on click', async () => {
    const wrapper = mount(CloudWatchAlarmsList, {
      props: {
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
    })
    await wrapper.find('[class*="grid"]').trigger('click')
    expect(wrapper.emitted('toggleAlarm')).toBeTruthy()
    expect(wrapper.emitted('toggleAlarm')![0]).toEqual(['alarm-1'])
  })

  it('CloudWatchMetricsList renders metrics', () => {
    const wrapper = mount(CloudWatchMetricsList, {
      props: {
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
    })
    expect(wrapper.text()).toContain('CPUUtilization')
    expect(wrapper.text()).toContain('RequestCount')
    expect(wrapper.text()).toContain('AWS/ELB')
  })

  it('CloudWatchMetricsList emits toggleMetric', async () => {
    const wrapper = mount(CloudWatchMetricsList, {
      props: {
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
    })
    await wrapper.find('[class*="grid"]').trigger('click')
    expect(wrapper.emitted('toggleMetric')).toBeTruthy()
  })

  describe('CloudWatchCreateAlarmModal', () => {
    const baseProps = {
      open: true,
      form: {
        AlarmName: '',
        AlarmDescription: '',
        Namespace: '',
        MetricName: '',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 0,
        ComparisonOperator: 'GreaterThanThreshold',
        ActionsEnabled: false,
        Dimensions: [] as { Name: string; Value: string }[],
      },
    }

    it('renders when open', () => {
      const wrapper = mount(CloudWatchCreateAlarmModal, {
        props: baseProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub } },
      })
      expect(wrapper.text()).toContain('Create CloudWatch Alarm')
    })

    it('adds dimension when clicking Add Dimension button', async () => {
      const wrapper = mount(CloudWatchCreateAlarmModal, {
        props: baseProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub } },
      })

      // Click "Add Dimension" button
      const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Dimension'))
      expect(addBtn).toBeTruthy()
      await addBtn!.trigger('click')

      // Verify the form was updated
      expect(wrapper.emitted('update:form')).toBeTruthy()
      const formUpdate = wrapper.emitted('update:form') as any[][]
      const lastForm = formUpdate[formUpdate.length - 1][0]
      expect(lastForm.Dimensions.length).toBeGreaterThan(0)
    })

    it('emits update:open false when clicking Cancel', async () => {
      const wrapper = mount(CloudWatchCreateAlarmModal, {
        props: baseProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub } },
      })

      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
      expect(cancelBtn).toBeTruthy()
      await cancelBtn!.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('does not emit create when form is empty', async () => {
      const wrapper = mount(CloudWatchCreateAlarmModal, {
        props: baseProps,
        global: { stubs: { Modal: modalStub, Button: buttonStub } },
      })

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      // Button should be disabled because form is empty
      expect(createBtn).toBeTruthy()
      if (createBtn) {
        expect(createBtn.attributes('disabled')).toBeDefined()
      }
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create')).toBeFalsy()
    })

    it('emits create when form is valid', async () => {
      const filledForm = {
        ...baseProps.form,
        AlarmName: 'test-alarm',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
      }
      const wrapper = mount(CloudWatchCreateAlarmModal, {
        props: { ...baseProps, form: filledForm },
        global: { stubs: { Modal: modalStub, Button: buttonStub } },
      })

      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create'))
      expect(createBtn).toBeTruthy()
      if (createBtn) {
        expect(createBtn.attributes('disabled')).toBeUndefined()
      }
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    })
  })

  it('CloudWatchDeleteAlarmModal renders alarm name', () => {
    const wrapper = mount(CloudWatchDeleteAlarmModal, {
      props: {
        open: true,
        alarmName: 'test-alarm',
      },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('test-alarm')
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('CloudWatchDeleteAlarmModal emits delete and close', async () => {
    const wrapper = mount(CloudWatchDeleteAlarmModal, {
      props: { open: true, alarmName: 'test-alarm' },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })

    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  // --- Logs integration tests ---
  it('CloudWatchLogsList renders log groups', () => {
    const wrapper = mount(CloudWatchLogsList, {
      props: {
        logGroups: mockLogGroups,
        loading: false,
        expandedLogGroups: new Set(),
        logStreams: {},
        expandedLogStreams: new Set(),
        logEvents: {},
      },
    })
    expect(wrapper.text()).toContain('/aws/lambda/test')
    expect(wrapper.text()).toContain('/aws/ecs/service')
    expect(wrapper.text()).toContain('30 days')
    expect(wrapper.text()).toContain('7 days')
  })

  it('CloudWatchLogsList emits toggleLogGroup on click', async () => {
    const wrapper = mount(CloudWatchLogsList, {
      props: {
        logGroups: mockLogGroups,
        loading: false,
        expandedLogGroups: new Set(),
        logStreams: {},
        expandedLogStreams: new Set(),
        logEvents: {},
      },
    })
    await wrapper.find('[class*="grid"]').trigger('click')
    expect(wrapper.emitted('toggleLogGroup')).toBeTruthy()
    expect(wrapper.emitted('toggleLogGroup')![0]).toEqual(['/aws/lambda/test'])
  })

  it('CloudWatchLogsList emits deleteLogGroup on delete button click', async () => {
    const wrapper = mount(CloudWatchLogsList, {
      props: {
        logGroups: mockLogGroups,
        loading: false,
        expandedLogGroups: new Set(),
        logStreams: {},
        expandedLogStreams: new Set(),
        logEvents: {},
      },
    })
    const deleteBtn = wrapper.find('[title="Delete log group"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('deleteLogGroup')).toBeTruthy()
  })

  it('CloudWatchCreateLogGroupModal renders when open', () => {
    const wrapper = mount(CloudWatchCreateLogGroupModal, {
      props: { open: true },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('Create Log Group')
    expect(wrapper.find('#cw-log-group-name').exists()).toBe(true)
  })

  it('CloudWatchDeleteLogGroupModal renders log group name', () => {
    const wrapper = mount(CloudWatchDeleteLogGroupModal, {
      props: { open: true, logGroupName: '/aws/lambda/test' },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('/aws/lambda/test')
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('CloudWatchDeleteLogGroupModal emits delete event', async () => {
    const wrapper = mount(CloudWatchDeleteLogGroupModal, {
      props: { open: true, logGroupName: '/aws/lambda/test' },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })

    const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn!.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
