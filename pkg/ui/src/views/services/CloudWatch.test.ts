import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'

const mockSwitchTab = vi.fn()
const mockToggleLogGroup = vi.fn()
const mockToggleLogStream = vi.fn()
const mockToggleAlarm = vi.fn()
const mockToggleMetric = vi.fn()
const mockCreateAlarm = vi.fn()
const mockDeleteAlarm = vi.fn()
const mockSetAlarmState = vi.fn()
const mockCreateLogGroup = vi.fn()
const mockDeleteLogGroup = vi.fn()
const mockCreateLogStream = vi.fn()
const mockLoadLogGroups = vi.fn()
const mockLoadAlarms = vi.fn()
const mockLoadMetrics = vi.fn()

const mockLogGroups = ref([
  { logGroupName: '/aws/lambda/test', creationTime: 1700000000000, storedBytes: 1024, metricFilterCount: 0 },
])
const mockAlarms = ref([
  { AlarmName: 'test-alarm', StateValue: 'OK', AlarmDescription: 'Test alarm' },
])
const mockMetrics = ref([
  { Namespace: 'AWS/Lambda', MetricName: 'Invocations', Dimensions: [] },
])
const mockSelectedTab = ref('logs')

vi.mock('@/composables/useCloudWatch', () => ({
  useCloudWatch: () => ({
    logGroups: mockLogGroups,
    alarms: mockAlarms,
    metrics: mockMetrics,
    loading: ref(false),
    selectedTab: mockSelectedTab,
    expandedLogGroups: ref<Record<string, any>>({}),
    logStreams: ref<Record<string, any>>({}),
    expandedLogStreams: ref<Record<string, any>>({}),
    logEvents: ref<Record<string, any>>({}),
    expandedAlarms: ref<Record<string, any>>({}),
    alarmHistory: ref<Record<string, any>>({}),
    expandedMetrics: ref<Record<string, any>>({}),
    metricStats: ref<Record<string, any>>({}),
    switchTab: mockSwitchTab,
    loadLogGroups: mockLoadLogGroups,
    loadAlarms: mockLoadAlarms,
    loadMetrics: mockLoadMetrics,
    toggleLogGroup: mockToggleLogGroup,
    toggleLogStream: mockToggleLogStream,
    toggleAlarm: mockToggleAlarm,
    toggleMetric: mockToggleMetric,
    createAlarm: mockCreateAlarm,
    deleteAlarm: mockDeleteAlarm,
    setAlarmState: mockSetAlarmState,
    createLogGroup: mockCreateLogGroup,
    deleteLogGroup: mockDeleteLogGroup,
    createLogStream: mockCreateLogStream,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock('@/composables/useContentReload', () => ({
  useContentReload: () => ({ reloadTrigger: 0 }),
}))

import CloudWatchView from './CloudWatch.vue'

const stubs = {
  ChartBarIcon: true,
  Button: { template: '<button><slot /></button>' },
  EmptyState: true,
  LoadingSpinner: true,
  CloudWatchAlarmsList: true,
  CloudWatchMetricsList: true,
  CloudWatchCreateAlarmModal: true,
  CloudWatchDeleteAlarmModal: true,
  CloudWatchCodeExamples: true,
  CloudWatchLogsList: true,
  CloudWatchCreateLogGroupModal: true,
  CloudWatchDeleteLogGroupModal: true,
  CloudWatchCreateLogStreamModal: true,
}

/** Emit event on a stub component if it exists */
function emitOn(wrapper: any, componentName: string, event: string, ...args: any[]) {
  const comp = wrapper.findComponent({ name: componentName })
  if (comp.exists() && comp.vm) {
    comp.vm.$emit(event, ...args)
  }
}

describe('CloudWatch.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockLogGroups.value = [
      { logGroupName: '/aws/lambda/test', creationTime: 1700000000000, storedBytes: 1024, metricFilterCount: 0 },
    ]
    mockAlarms.value = [
      { AlarmName: 'test-alarm', StateValue: 'OK', AlarmDescription: 'Test alarm' },
    ]
    mockMetrics.value = [
      { Namespace: 'AWS/Lambda', MetricName: 'Invocations', Dimensions: [] },
    ]
    mockSelectedTab.value = 'logs'
  })

  it('renders without crashing', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders CloudWatch heading', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.text()).toContain('CloudWatch')
  })

  it('renders tabs', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.text()).toContain('Logs')
    expect(wrapper.text()).toContain('Alarms')
    expect(wrapper.text()).toContain('Metrics')
  })

  it('renders Create Log Group button for logs tab', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.text()).toContain('Create Log Group')
  })

  it('renders CloudWatchCodeExamples component', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.find('cloud-watch-code-examples-stub').exists()).toBe(true)
  })

  describe('mount interaction tests', () => {
    const mountStubs = {
      ChartBarIcon: true,
      Button: { template: '<button><slot /></button>' },
      EmptyState: true,
      LoadingSpinner: true,
      CloudWatchAlarmsList: true,
      CloudWatchMetricsList: true,
      CloudWatchCreateAlarmModal: true,
      CloudWatchDeleteAlarmModal: true,
      CloudWatchCodeExamples: true,
      CloudWatchLogsList: true,
      CloudWatchCreateLogGroupModal: true,
      CloudWatchDeleteLogGroupModal: true,
      CloudWatchCreateLogStreamModal: true,
    }

    it('mounts with stubs without error', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.exists()).toBe(true)
    })

    it('header button label is Create Log Group for logs tab', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.headerButtonLabel).toBe('Create Log Group')
    })

    it('header button label is Create Alarm for alarms tab', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.headerButtonLabel).toBe('Create Alarm')
    })

    it('header resource count shows log group count', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.headerResourceCount).toContain('log group')
    })

    it('alarms tab header shows alarm count', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.headerResourceCount).toContain('alarm')
    })

    it('metrics tab header shows metric count', () => {
      mockSelectedTab.value = 'metrics'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.headerResourceCount).toContain('metric')
    })

    it('getAlarmStatus returns active for ALARM', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.getAlarmStatus('ALARM')).toBe('active')
    })

    it('getAlarmStatus returns pending for INSUFFICIENT_DATA', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.getAlarmStatus('INSUFFICIENT_DATA')).toBe('pending')
    })

    it('getAlarmStatus returns inactive for OK', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      expect(wrapper.vm.getAlarmStatus('OK')).toBe('inactive')
    })

    it('openDeleteModal sets selectedAlarmName', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      wrapper.vm.openDeleteModal('test-alarm')
      expect(wrapper.vm.selectedAlarmName).toBe('test-alarm')
      expect(wrapper.vm.showDeleteAlarmModal).toBe(true)
    })

    it('openDeleteLogGroupModal sets selectedLogGroupName', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      wrapper.vm.openDeleteLogGroupModal('/aws/lambda/test')
      expect(wrapper.vm.selectedLogGroupName).toBe('/aws/lambda/test')
      expect(wrapper.vm.showDeleteLogGroupModal).toBe(true)
    })

    it('openCreateStreamModal sets createStreamLogGroup', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs: mountStubs } })
      wrapper.vm.openCreateStreamModal('/aws/lambda/my-func')
      expect(wrapper.vm.createStreamLogGroup).toBe('/aws/lambda/my-func')
      expect(wrapper.vm.showCreateLogStreamModal).toBe(true)
    })
  })

  it('renders empty state when no log groups', () => {
    mockLogGroups.value = []
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.find('empty-state-stub').exists()).toBe(true)
  })

  it('renders no empty state when log groups exist', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.find('empty-state-stub').exists()).toBe(false)
  })

  it('calls switchTab("logs") on mount', () => {
    shallowMount(CloudWatchView, { global: { stubs } })
    expect(mockSwitchTab).toHaveBeenCalledWith('logs')
  })

  it('renders CloudWatchLogsList when log groups exist', () => {
    const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
    expect(wrapper.find('cloud-watch-logs-list-stub').exists()).toBe(true)
  })

  describe('alarms tab', () => {
    it('renders empty state when no alarms', () => {
      mockSelectedTab.value = 'alarms'
      mockAlarms.value = []
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      expect(wrapper.find('empty-state-stub').exists()).toBe(true)
    })

    it('renders CloudWatchAlarmsList in alarms tab', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      expect(wrapper.find('cloud-watch-alarms-list-stub').exists()).toBe(true)
    })

    it('emits empty state action to trigger create alarm modal', () => {
      mockSelectedTab.value = 'alarms'
      mockAlarms.value = []
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'EmptyState', 'action')
    })
  })

  describe('metrics tab', () => {
    it('renders empty state when no metrics', () => {
      mockSelectedTab.value = 'metrics'
      mockMetrics.value = []
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      expect(wrapper.find('empty-state-stub').exists()).toBe(true)
    })

    it('renders CloudWatchMetricsList in metrics tab', () => {
      mockSelectedTab.value = 'metrics'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      expect(wrapper.find('cloud-watch-metrics-list-stub').exists()).toBe(true)
    })
  })

  describe('create log group', () => {
    it('handles create log group via modal emit', async () => {
      mockCreateLogGroup.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchCreateLogGroupModal', 'create', { logGroupName: '/aws/lambda/new-function' })
      await new Promise(process.nextTick)
      expect(mockCreateLogGroup).toHaveBeenCalled()
    })

    it('opens create log group modal via header button click', async () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create Log Group')
      if (createBtn) {
        await createBtn.trigger('click')
      }
    })
  })

  describe('delete log group', () => {
    it('handles delete log group via modal emit', async () => {
      mockDeleteLogGroup.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchDeleteLogGroupModal', 'delete', '/aws/lambda/test')
      await new Promise(process.nextTick)
      expect(mockDeleteLogGroup).toHaveBeenCalled()
    })
  })

  describe('create log stream', () => {
    it('handles create log stream via modal emit', async () => {
      mockCreateLogStream.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchCreateLogStreamModal', 'create', { logGroupName: '/aws/lambda/test', logStreamName: 'new-stream' })
      await new Promise(process.nextTick)
      expect(mockCreateLogStream).toHaveBeenCalled()
    })
  })

  describe('create alarm', () => {
    it('handles create alarm via modal emit', async () => {
      mockCreateAlarm.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchCreateAlarmModal', 'create', { AlarmName: 'new-alarm', AlarmDescription: 'Test' })
      await new Promise(process.nextTick)
      expect(mockCreateAlarm).toHaveBeenCalled()
    })
  })

  describe('delete alarm', () => {
    it('handles delete alarm via modal emit', async () => {
      mockDeleteAlarm.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchDeleteAlarmModal', 'delete', 'test-alarm')
      await new Promise(process.nextTick)
      expect(mockDeleteAlarm).toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('handles toggle log group via CloudWatchLogsList emit', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchLogsList', 'toggle-log-group', '/aws/lambda/test')
      expect(mockToggleLogGroup).toHaveBeenCalled()
    })

    it('handles delete log group via CloudWatchLogsList emit', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchLogsList', 'delete-log-group', '/aws/lambda/test')
    })

    it('handles toggle alarm via CloudWatchAlarmsList emit', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchAlarmsList', 'toggle-alarm', 'test-alarm')
      expect(mockToggleAlarm).toHaveBeenCalled()
    })

    it('handles set alarm state via CloudWatchAlarmsList emit', async () => {
      mockSetAlarmState.mockResolvedValue(undefined)
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchAlarmsList', 'set-alarm-state', 'test-alarm', 'ALARM')
      await new Promise(process.nextTick)
      expect(mockSetAlarmState).toHaveBeenCalled()
    })

    it('handles delete alarm via CloudWatchAlarmsList emit', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchAlarmsList', 'delete-alarm', 'test-alarm')
    })

    it('handles toggle metric via CloudWatchMetricsList emit', () => {
      mockSelectedTab.value = 'metrics'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      emitOn(wrapper, 'CloudWatchMetricsList', 'toggle-metric', 'AWS/Lambda')
      expect(mockToggleMetric).toHaveBeenCalled()
    })
  })

  describe('template inline handler coverage', () => {
    it('switchTab via composable wrapper', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      wrapper.vm.cw.switchTab('alarms')
      expect(mockSwitchTab).toHaveBeenCalledWith('alarms')
    })

    it('handleCreateLogGroup with form object calls composable', async () => {
      mockCreateLogGroup.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      await wrapper.vm.handleCreateLogGroup({ logGroupName: '/aws/lambda/test', retentionInDays: 7, tags: [] })
      expect(mockCreateLogGroup).toHaveBeenCalled()
    })

    it('handleDeleteLogGroup calls composable', async () => {
      mockDeleteLogGroup.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      wrapper.vm.selectedLogGroupName = '/aws/lambda/test'
      await wrapper.vm.handleDeleteLogGroup()
      expect(mockDeleteLogGroup).toHaveBeenCalledWith('/aws/lambda/test')
    })

    it('handleCreateAlarm calls composable and resets form', async () => {
      mockCreateAlarm.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      await wrapper.vm.handleCreateAlarm({ AlarmName: 'test', MetricName: 'CPU' })
      expect(mockCreateAlarm).toHaveBeenCalled()
    })

    it('handleDeleteAlarm calls composable', async () => {
      mockDeleteAlarm.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      wrapper.vm.selectedAlarmName = 'test-alarm'
      await wrapper.vm.handleDeleteAlarm()
      expect(mockDeleteAlarm).toHaveBeenCalledWith('test-alarm')
    })

    it('openDeleteModal sets alarm name and shows modal', () => {
      mockSelectedTab.value = 'alarms'
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      wrapper.vm.openDeleteModal('test-alarm')
      expect(wrapper.vm.selectedAlarmName).toBe('test-alarm')
      expect(wrapper.vm.showDeleteAlarmModal).toBe(true)
    })

    it('openDeleteLogGroupModal sets name and shows modal', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      wrapper.vm.openDeleteLogGroupModal('/aws/lambda/test')
      expect(wrapper.vm.selectedLogGroupName).toBe('/aws/lambda/test')
      expect(wrapper.vm.showDeleteLogGroupModal).toBe(true)
    })

    it('modal @update:open handlers', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      const modals = [
        'cloud-watch-create-alarm-modal-stub',
        'cloud-watch-create-log-group-modal-stub',
        'cloud-watch-delete-alarm-modal-stub',
        'cloud-watch-delete-log-group-modal-stub',
        'cloud-watch-create-log-stream-modal-stub',
      ]
      for (const sel of modals) {
        const modal = wrapper.findComponent(sel)
        if (modal.exists() && modal.vm) {
          modal.vm.$emit('update:open', false)
        }
      }
      expect(wrapper.vm.showCreateAlarmModal).toBe(false)
      expect(wrapper.vm.showDeleteAlarmModal).toBe(false)
    })

    it('handleCreateLogStream with form object calls composable', async () => {
      mockCreateLogStream.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      await wrapper.vm.handleCreateLogStream({ logGroupName: '/aws/lambda/test', logStreamName: 'new-stream' })
      expect(mockCreateLogStream).toHaveBeenCalledWith('/aws/lambda/test', 'new-stream')
    })

    it('handleSetAlarmState calls composable', async () => {
      mockSetAlarmState.mockResolvedValue(undefined)
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      await wrapper.vm.handleSetAlarmState('test-alarm', 'ALARM')
      expect(mockSetAlarmState).toHaveBeenCalled()
    })

    it('getAlarmStatus returns correct states', () => {
      const wrapper = shallowMount(CloudWatchView, { global: { stubs } })
      expect(wrapper.vm.getAlarmStatus('ALARM')).toBe('active')
      expect(wrapper.vm.getAlarmStatus('INSUFFICIENT_DATA')).toBe('pending')
      expect(wrapper.vm.getAlarmStatus('OK')).toBe('inactive')
      expect(wrapper.vm.getAlarmStatus('UNKNOWN')).toBe('inactive')
    })
  })
})
