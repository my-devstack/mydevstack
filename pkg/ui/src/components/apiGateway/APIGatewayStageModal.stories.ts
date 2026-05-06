import type { Meta, StoryObj } from '@storybook/vue3-vite'
import APIGatewayStageModal from './APIGatewayStageModal.vue'

const meta: Meta<typeof APIGatewayStageModal> = {
  title: 'Services/API Gateway/StageModal',
  component: APIGatewayStageModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    type: { control: 'select', options: ['rest', 'http'] },
    loading: { control: 'boolean' },
    autoDeploy: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayStageModal>

export const CreateREST: Story = {
  args: {
    open: true,
    type: 'rest',
    loading: false,
    autoDeploy: false,
    deployments: [
      { id: 'deployment1', createdDate: '2024-01-01', description: 'First deployment' },
      { id: 'deployment2', createdDate: '2024-01-02', description: 'Second deployment' },
    ],
  },
}

export const CreateHTTP: Story = {
  args: {
    open: true,
    type: 'http',
    loading: false,
    autoDeploy: true,
    deployments: [],
  },
}

export const Loading: Story = {
  args: {
    open: true,
    type: 'rest',
    loading: true,
    deployments: [],
  },
}

export const Closed: Story = {
  args: {
    open: false,
    type: 'rest',
  },
}