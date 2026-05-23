import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayInvokeUrlModal from './APIGatewayInvokeUrlModal.vue'

const meta: Meta<typeof APIGatewayInvokeUrlModal> = {
  title: 'Services/API Gateway/InvokeUrlModal',
  component: APIGatewayInvokeUrlModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    apiType: { control: 'select', options: ['rest', 'http'] },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayInvokeUrlModal>

export const Default: Story = {
  args: {
    open: true,
    api: { id: 'abc123', name: 'my-api' },
    apiType: 'rest',
    invokeUrl: 'http://localhost:4566/restapis/abc123/prod/_user_request_/',
    loading: false,
    stages: [
      { stageName: 'prod' },
      { stageName: 'dev' },
    ],
  },
}

export const HTTPApi: Story = {
  args: {
    open: true,
    api: { apiId: 'xyz789', name: 'my-http-api' },
    apiType: 'http',
    invokeUrl: 'http://localhost:4566/httpapis/xyz789/prod',
    loading: false,
    stages: [
      { stageName: 'prod' },
    ],
  },
}

export const Loading: Story = {
  args: {
    open: true,
    api: { id: 'abc123', name: 'my-api' },
    apiType: 'rest',
    invokeUrl: '',
    loading: true,
    stages: [{ stageName: 'prod' }],
  },
}

export const NoStages: Story = {
  args: {
    open: true,
    api: { id: 'abc123', name: 'my-api' },
    apiType: 'rest',
    invokeUrl: '',
    loading: false,
    stages: [],
  },
}

export const Closed: Story = {
  args: {
    open: false,
    api: { id: 'abc123', name: 'my-api' },
    apiType: 'rest',
    invokeUrl: '',
    stages: [{ stageName: 'prod' }],
  },
}

export const WebSocket: Story = {
  args: {
    open: true,
    api: { apiId: 'ws-api', name: 'my-ws-api', protocolType: 'WEBSOCKET' },
    apiType: 'http',
    invokeUrl: 'wss://ws-api.execute-api.us-east-1.amazonaws.com/prod',
    loading: false,
    stages: [
      { stageName: 'prod' },
    ],
  },
}