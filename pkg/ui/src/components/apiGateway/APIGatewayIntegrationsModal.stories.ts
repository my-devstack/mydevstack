import type { Meta, StoryObj } from '@storybook/vue3-vite'
import APIGatewayIntegrationsModal from './APIGatewayIntegrationsModal.vue'

const meta: Meta<typeof APIGatewayIntegrationsModal> = {
  title: 'Services/API Gateway/IntegrationsModal',
  component: APIGatewayIntegrationsModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayIntegrationsModal>

export const Default: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    integrations: [
      { integrationId: 'int1', integrationType: 'HTTP', integrationUri: 'http://localhost:8080/items' },
      { integrationId: 'int2', integrationType: 'Lambda', integrationUri: 'arn:aws:lambda:us-east-1:123456789:function:handler' },
      { integrationId: 'int3', integrationType: 'MOCK', integrationUri: '' },
    ],
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    integrations: [],
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    integrations: [],
    loading: false,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    apiName: 'my-api',
    integrations: [],
  },
}