import type { Meta, StoryObj } from '@storybook/vue3-vite'
import APIGatewayCodeExamples from './APIGatewayCodeExamples.vue'

const meta: Meta<typeof APIGatewayCodeExamples> = {
  title: 'Services/API Gateway/CodeExamples',
  component: APIGatewayCodeExamples,
  tags: ['autodocs'],
  argTypes: {
    region: { control: 'text' },
    accessKey: { control: 'text' },
    secretKey: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayCodeExamples>

export const Default: Story = {
  args: {
    region: 'us-east-1',
    accessKey: 'testkey',
    secretKey: 'testsecret',
  },
}

export const DifferentRegion: Story = {
  args: {
    region: 'eu-west-1',
    accessKey: 'testkey',
    secretKey: 'testsecret',
  },
}