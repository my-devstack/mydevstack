import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayMethodModal from './APIGatewayMethodModal.vue'

const meta: Meta<typeof APIGatewayMethodModal> = {
  title: 'Services/API Gateway/MethodModal',
  component: APIGatewayMethodModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayMethodModal>

export const Default: Story = {
  args: {
    open: true,
    resources: [
      { id: 'res1', path: '/', pathPart: '' },
      { id: 'res2', path: '/items', pathPart: 'items' },
      { id: 'res3', path: '/users', pathPart: 'users' },
    ],
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    resources: [],
    loading: true,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    resources: [],
  },
}