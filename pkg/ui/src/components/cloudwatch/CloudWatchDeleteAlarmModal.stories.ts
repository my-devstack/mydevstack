import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchDeleteAlarmModal from './CloudWatchDeleteAlarmModal.vue'

const meta: Meta<typeof CloudWatchDeleteAlarmModal> = {
  title: 'CloudWatch/DeleteAlarmModal',
  component: CloudWatchDeleteAlarmModal,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof CloudWatchDeleteAlarmModal>

export const Default: Story = {
  args: {
    open: true,
    alarmName: 'high-cpu',
  },
}
