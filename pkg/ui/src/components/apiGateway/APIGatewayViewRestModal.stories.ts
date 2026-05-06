import type { Meta, StoryObj } from '@storybook/vue3-vite';
import APIGatewayViewRestModal from './APIGatewayViewRestModal.vue';

const meta: Meta<typeof APIGatewayViewRestModal> = {
  title: 'Services/APIGateway/ViewRestModal',
  component: APIGatewayViewRestModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDetails = {
  id: 'abc123',
  name: 'my-api',
  description: 'My REST API',
  createdDate: '2024-01-15T10:00:00Z',
  version: 'V1'
};

export const Open: Story = {
  args: { open: true, details: mockDetails, loading: false },
  render: (args) => ({ components: { APIGatewayViewRestModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRestModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, details: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewRestModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRestModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, details: mockDetails, loading: false },
  render: (args) => ({ components: { APIGatewayViewRestModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRestModal v-bind="args" /></div>' })
};