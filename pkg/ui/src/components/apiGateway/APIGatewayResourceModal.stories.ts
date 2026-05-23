import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayResourceModal from './APIGatewayResourceModal.vue'

const meta: Meta<typeof APIGatewayResourceModal> = {
  title: 'Services/API Gateway/ResourceModal',
  component: APIGatewayResourceModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayResourceModal>

export const Default: Story = {
  args: {
    open: true,
    parentId: 'parent123',
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    parentId: 'parent123',
    loading: true,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    parentId: 'parent123',
  },
}