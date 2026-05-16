import type { Meta, StoryObj } from '@storybook/vue3'
import CloudWatchCreateLogGroupModal from './CloudWatchCreateLogGroupModal.vue'
import { createPinia, setActivePinia } from 'pinia'

export default {
  title: 'CloudWatch/CloudWatchCreateLogGroupModal',
  component: CloudWatchCreateLogGroupModal,
  decorators: [() => { setActivePinia(createPinia()); return { template: '<story/>' } }],
} as Meta<typeof CloudWatchCreateLogGroupModal>

export const Default: StoryObj<typeof CloudWatchCreateLogGroupModal> = {
  args: {
    open: true,
  },
}
