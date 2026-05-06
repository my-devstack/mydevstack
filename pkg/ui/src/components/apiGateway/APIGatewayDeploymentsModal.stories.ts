import type { Meta, StoryObj } from '@storybook/vue3-vite'
import APIGatewayDeploymentsModal from './APIGatewayDeploymentsModal.vue'

const meta: Meta<typeof APIGatewayDeploymentsModal> = {
  title: 'Services/API Gateway/DeploymentsModal',
  component: APIGatewayDeploymentsModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    type: { control: 'select', options: ['rest', 'http'] },
    loading: { control: 'boolean' },
    loadingDeployments: { control: 'boolean' },
    loadingStages: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayDeploymentsModal>

export const Default: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    apiId: 'api123',
    type: 'rest',
    deployments: [
      { id: 'deploy1', createdDate: '2024-01-15T10:00:00Z', description: 'Initial deployment' },
      { id: 'deploy2', createdDate: '2024-01-20T14:30:00Z', description: 'Added new endpoints' },
    ],
    stages: [
      { stageName: 'prod', deploymentId: 'deploy2', description: 'Production', status: 'ACTIVE' },
      { stageName: 'dev', deploymentId: 'deploy1', description: 'Development', status: 'ACTIVE' },
    ],
    loadingDeployments: false,
    loadingStages: false,
    loading: false,
  },
}

export const HTTPApi: Story = {
  args: {
    open: true,
    apiName: 'my-http-api',
    apiId: 'http123',
    type: 'http',
    deployments: [
      { id: 'deploy1', createdDate: '2024-01-15T10:00:00Z', description: 'Initial' },
    ],
    stages: [
      { stageName: 'prod', description: 'Production', status: 'ACTIVE' },
    ],
    loadingDeployments: false,
    loadingStages: false,
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    apiId: 'api123',
    type: 'rest',
    deployments: [],
    stages: [],
    loadingDeployments: true,
    loadingStages: true,
    loading: false,
  },
}

export const Empty: Story = {
  args: {
    open: true,
    apiName: 'my-api',
    apiId: 'api123',
    type: 'rest',
    deployments: [],
    stages: [],
    loadingDeployments: false,
    loadingStages: false,
    loading: false,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    apiName: 'my-api',
    apiId: 'api123',
    type: 'rest',
  },
}