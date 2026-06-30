import type { Meta, StoryObj } from '@storybook/vue3'
import S3LifecycleModal from './S3LifecycleModal.vue'

const meta: Meta<typeof S3LifecycleModal> = {
  title: 'Services/S3/LifecycleModal',
  component: S3LifecycleModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    bucketName: { control: 'text' },
    rules: { control: 'object' },
    loading: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof S3LifecycleModal>

const sampleRules = [
  {
    ID: 'ExpireLogs',
    Status: 'Enabled',
    Filter: { Prefix: 'logs/' },
    Expiration: { Days: 30 },
  },
  {
    ID: 'ArchiveOldData',
    Status: 'Enabled',
    Transitions: [{ StorageClass: 'GLACIER', Days: 90 }],
  },
  {
    ID: 'DeepArchive',
    Status: 'Disabled',
    Filter: { Prefix: 'archive/' },
    Expiration: { Days: 365 },
    Transitions: [{ StorageClass: 'DEEP_ARCHIVE', Days: 180 }],
  },
]

export const Default: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    rules: [],
  },
}

export const WithRules: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    rules: sampleRules,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    rules: [],
    loading: true,
  },
}

export const SingleRule: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    rules: [
      {
        ID: 'ExpireTemp',
        Status: 'Enabled',
        Filter: { Prefix: 'temp/' },
        Expiration: { Days: 7 },
        Transitions: [{ StorageClass: 'INTELLIGENT_TIERING', Days: 1 }],
      },
    ],
  },
}

export const Closed: Story = {
  args: {
    open: false,
    bucketName: 'my-bucket',
    rules: [],
  },
}
