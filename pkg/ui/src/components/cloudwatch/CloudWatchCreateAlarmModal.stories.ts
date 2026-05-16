import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchCreateAlarmModal from './CloudWatchCreateAlarmModal.vue'

const meta: Meta<typeof CloudWatchCreateAlarmModal> = {
  title: 'CloudWatch/CreateAlarmModal',
  component: CloudWatchCreateAlarmModal,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CloudWatchCreateAlarmModal>

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

export const Default: Story = {
  args: {
    open: true,
    form: { ...defaultForm },
  },
}

export const Filled: Story = {
  args: {
    open: true,
    form: {
      ...defaultForm,
      AlarmName: 'high-cpu',
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Threshold: 80,
      Period: 300,
      EvaluationPeriods: 2,
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [{ Name: 'InstanceId', Value: 'i-1234' }],
    },
  },
}
