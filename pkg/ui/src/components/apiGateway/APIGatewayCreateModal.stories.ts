import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayCreateModal from './APIGatewayCreateModal.vue'

const meta: Meta<typeof APIGatewayCreateModal> = {
  title: 'Services/API Gateway/CreateModal',
  component: APIGatewayCreateModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    type: { control: 'select', options: ['rest', 'http'] },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayCreateModal>

export const CreateREST: Story = {
  args: {
    open: true,
    type: 'rest',
    loading: false,
  },
}

export const CreateHTTP: Story = {
  args: {
    open: true,
    type: 'http',
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    type: 'rest',
    loading: true,
  },
}

export const EditMode: Story = {
  args: {
    open: true,
    type: 'rest',
    loading: false,
    api: {
      id: 'abc123',
      name: 'my-api',
      description: 'My existing API',
    },
  },
}

export const Closed: Story = {
  args: {
    open: false,
    type: 'rest',
  },
}