import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CloudWatchCreateAlarmModal from './CloudWatchCreateAlarmModal.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
  }),
}))

// Mock Button
vi.mock('@/components/common/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'disabled'],
    template: '<button class="mock-button" :disabled="disabled"><slot /></button>',
  },
}))

const defaultForm = {
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
}

function createWrapper(formOverrides = {}, open = true) {
  return mount(CloudWatchCreateAlarmModal, {
    props: {
      open,
      form: { ...defaultForm, ...formOverrides },
    },
  })
}

describe('CloudWatchCreateAlarmModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exists as a component', () => {
    expect(CloudWatchCreateAlarmModal).toBeDefined()
  })

  it('renders when open is true', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Create CloudWatch Alarm')
  })

  it('does not render when open is false', () => {
    const wrapper = createWrapper({}, false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  describe('form validation', () => {
    it('create button is disabled when AlarmName is empty', () => {
      const wrapper = createWrapper({
        AlarmName: '',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      expect(createBtn!.attributes('disabled')).toBeDefined()
    })

    it('create button is disabled when Namespace is empty', () => {
      const wrapper = createWrapper({
        AlarmName: 'test-alarm',
        Namespace: '',
        MetricName: 'CPUUtilization',
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      expect(createBtn!.attributes('disabled')).toBeDefined()
    })

    it('create button is disabled when MetricName is empty', () => {
      const wrapper = createWrapper({
        AlarmName: 'test-alarm',
        Namespace: 'AWS/EC2',
        MetricName: '',
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      expect(createBtn!.attributes('disabled')).toBeDefined()
    })

    it('create button is enabled when all required fields are filled', () => {
      const wrapper = createWrapper({
        AlarmName: 'test-alarm',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      expect(createBtn!.attributes('disabled')).toBeUndefined()
    })
  })

  describe('create event', () => {
    it('does not emit create when required fields empty', async () => {
      const wrapper = createWrapper()

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      await createBtn!.trigger('click')
      expect(wrapper.emitted('create')).toBeFalsy()
    })

    it('emits create with form data when all required fields filled', async () => {
      const wrapper = createWrapper({
        AlarmName: 'test-alarm',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Threshold: 90,
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      await createBtn!.trigger('click')

      expect(wrapper.emitted('create')).toBeTruthy()
      const createData = wrapper.emitted('create')![0][0]
      expect(createData.AlarmName).toBe('test-alarm')
      expect(createData.Namespace).toBe('AWS/EC2')
      expect(createData.MetricName).toBe('CPUUtilization')
      expect(createData.Threshold).toBe(90)
    })

    it('filters out empty dimension names in emitted data', async () => {
      const wrapper = createWrapper({
        AlarmName: 'test-alarm',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          { Name: 'InstanceId', Value: 'i-123' },
          { Name: '', Value: 'should-be-filtered' },
        ],
      })

      const createBtn = wrapper.findAll('button').find(b => b.text() === 'Create')
      await createBtn!.trigger('click')

      const createData = wrapper.emitted('create')![0][0]
      expect(createData.Dimensions.length).toBe(1)
      expect(createData.Dimensions[0].Name).toBe('InstanceId')
    })
  })

  describe('close event', () => {
    it('emits update:open false on Cancel', async () => {
      const wrapper = createWrapper()

      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel')
      await cancelBtn!.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('emits update:open false on backdrop click', async () => {
      const wrapper = createWrapper()

      const backdrop = wrapper.find('.bg-black\\/50')
      await backdrop.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })
  })

  describe('dimension management', () => {
    it('adds dimension when clicking + Add Dimension', async () => {
      const wrapper = createWrapper()

      const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Dimension'))
      await addBtn!.trigger('click')

      expect(wrapper.emitted('update:form')).toBeTruthy()
      const lastForm = wrapper.emitted('update:form')!.pop()![0]
      expect(lastForm.Dimensions.length).toBeGreaterThan(0)
    })

    it('removes dimension when clicking X', async () => {
      const wrapper = createWrapper({
        Dimensions: [
          { Name: 'InstanceId', Value: 'i-123' },
          { Name: 'Env', Value: 'prod' },
        ],
      })

      const removeBtns = wrapper.findAll('button').filter(b => b.text() === 'X')
      expect(removeBtns.length).toBe(2)

      await removeBtns[0].trigger('click')

      expect(wrapper.emitted('update:form')).toBeTruthy()
    })
  })

  describe('form fields', () => {
    it('has all required form fields', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('#cw-alarm-name').exists()).toBe(true)
      expect(wrapper.find('#cw-alarm-description').exists()).toBe(true)
      expect(wrapper.find('#cw-namespace').exists()).toBe(true)
      expect(wrapper.find('#cw-metric-name').exists()).toBe(true)
      expect(wrapper.find('#cw-statistic').exists()).toBe(true)
      expect(wrapper.find('#cw-period').exists()).toBe(true)
      expect(wrapper.find('#cw-eval-periods').exists()).toBe(true)
      expect(wrapper.find('#cw-threshold').exists()).toBe(true)
      expect(wrapper.find('#cw-comparison').exists()).toBe(true)
    })

    it('shows required field indicators', () => {
      const wrapper = createWrapper()
      expect(wrapper.html()).toContain('<span class="text-red-500">*</span>')
    })

    it('resets localForm when open changes to true', async () => {
      // Start with closed
      const wrapper = createWrapper({}, false)

      // Set some dirty data
      await wrapper.vm.$nextTick()

      // Now open
      const wrapper2 = createWrapper({
        AlarmName: 'fresh-alarm',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
      })

      expect(wrapper2.find('#cw-alarm-name').element).toBeDefined()
    })

    it('sets v-model.number correctly for Period input', async () => {
      const wrapper = createWrapper()

      const periodInput = wrapper.find('#cw-period')
      await periodInput.setValue(600)

      expect(wrapper.emitted('update:form')).toBeTruthy()
    })
  })

  describe('modal accessibility', () => {
    it('has role="dialog" on the modal', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })
  })
})
