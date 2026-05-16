import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CloudWatchCreateLogStreamModal from './CloudWatchCreateLogStreamModal.vue'

const meta: Meta<typeof CloudWatchCreateLogStreamModal> = {
  title: 'Services/CloudWatch/CloudWatchCreateLogStreamModal',
  component: CloudWatchCreateLogStreamModal,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    logGroupName: '/aws/lambda/my-function',
  },
}
