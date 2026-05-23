import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayDeleteModal from './APIGatewayDeleteModal.vue'

const meta: Meta<typeof APIGatewayDeleteModal> = {
  title: 'Services/API Gateway/DeleteModal',
  component: APIGatewayDeleteModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    type: { control: 'select', options: ['rest', 'http', 'resource', 'method', 'deployment', 'stage'] },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayDeleteModal>

export const DeleteREST: Story = {
  args: {
    open: true,
    title: 'my-api',
    type: 'rest',
    loading: false,
  },
}

export const DeleteHTTP: Story = {
  args: {
    open: true,
    title: 'my-http-api',
    type: 'http',
    loading: false,
  },
}

export const DeleteMethod: Story = {
  args: {
    open: true,
    title: 'GET /items',
    type: 'method',
    loading: false,
  },
}

export const DeleteStage: Story = {
  args: {
    open: true,
    title: 'prod',
    type: 'stage',
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    title: 'my-api',
    type: 'rest',
    loading: true,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    title: 'my-api',
    type: 'rest',
  },
}