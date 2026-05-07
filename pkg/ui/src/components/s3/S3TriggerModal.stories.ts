import type { Meta, StoryObj } from '@storybook/vue3'
import S3TriggerModal from './S3TriggerModal.vue'

const meta: Meta<typeof S3TriggerModal> = {
  title: 'Services/S3/TriggerModal',
  component: S3TriggerModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    bucketName: { control: 'text' },
    existingTriggers: { control: 'object' },
  },
}

export default meta
type Story = StoryObj<typeof S3TriggerModal>

export const Default: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    existingTriggers: [],
  },
  parameters: {
    mockData: [
      {
        url: '/lambda/',
        method: 'POST',
        status: 200,
        response: {
          Functions: [
            { FunctionName: 'MyFunction1', FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction1', Runtime: 'nodejs20.x' },
            { FunctionName: 'MyFunction2', FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction2', Runtime: 'python3.11' },
            { FunctionName: 'ImageProcessor', FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:ImageProcessor', Runtime: 'nodejs20.x' },
          ],
        },
      },
    ],
  },
}

export const NoFunctions: Story = {
  args: {
    open: true,
    bucketName: 'empty-bucket',
    existingTriggers: [],
  },
  parameters: {
    mockData: [
      {
        url: '/lambda/',
        method: 'POST',
        status: 200,
        response: {
          Functions: [],
        },
      },
    ],
  },
}

export const Loading: Story = {
  args: {
    open: true,
    bucketName: 'loading-bucket',
    existingTriggers: [],
  },
}

export const WithExistingTriggers: Story = {
  args: {
    open: true,
    bucketName: 'my-bucket',
    existingTriggers: [
      {
        functionName: 'MyFunction1',
        events: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'],
        prefix: 'uploads/',
        suffix: '.json',
      },
    ],
  },
  parameters: {
    mockData: [
      {
        url: '/lambda/',
        method: 'POST',
        status: 200,
        response: {
          Functions: [
            { FunctionName: 'MyFunction1', FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction1', Runtime: 'nodejs20.x' },
            { FunctionName: 'MyFunction2', FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction2', Runtime: 'python3.11' },
          ],
        },
      },
    ],
  },
}

export const Closed: Story = {
  args: {
    open: false,
    bucketName: 'my-bucket',
    existingTriggers: [],
  },
}