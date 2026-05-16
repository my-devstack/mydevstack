import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchDeleteLogGroupModal from './CloudWatchDeleteLogGroupModal.vue'
import { createPinia, setActivePinia } from 'pinia'

export default {
  title: 'CloudWatch/CloudWatchDeleteLogGroupModal',
  component: CloudWatchDeleteLogGroupModal,
  decorators: [() => { setActivePinia(createPinia()); return { template: '<story/>' } }],
} as Meta<typeof CloudWatchDeleteLogGroupModal>

export const Default: StoryObj<typeof CloudWatchDeleteLogGroupModal> = {
  args: {
    open: true,
    logGroupName: '/aws/lambda/my-function',
  },
}
