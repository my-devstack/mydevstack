import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewDetailsModal from './APIGatewayViewDetailsModal.vue';

const meta: Meta<typeof APIGatewayViewDetailsModal> = {
  title: 'Services/APIGateway/ViewDetailsModal',
  component: APIGatewayViewDetailsModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDetails = {
  apiId: 'abc123',
  apiVersion: 'V1',
  protocolType: 'HTTP',
  cors: { allowOrigins: ['*'], allowMethods: ['GET', 'POST'] },
  stage: 'prod',
  created: '2024-01-15T10:00:00Z'
};

export const Open: Story = {
  args: { open: true, title: 'API Details', details: mockDetails },
  render: (args) => ({ components: { APIGatewayViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayViewDetailsModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, title: 'API Details', details: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayViewDetailsModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, title: 'API Details', details: mockDetails },
  render: (args) => ({ components: { APIGatewayViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayViewDetailsModal v-bind="args" /></div>' })
};