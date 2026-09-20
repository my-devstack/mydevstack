import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewDeploymentModal from './APIGatewayViewDeploymentModal.vue';

const meta: Meta<typeof APIGatewayViewDeploymentModal> = {
  title: 'Services/APIGateway/ViewDeploymentModal',
  component: APIGatewayViewDeploymentModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDeployment = {
  id: 'dep-123',
  createdDate: '2024-01-15T10:00:00Z',
  description: 'Initial deployment'
};

export const Default: Story = {
  args: { open: true, deployment: mockDeployment, loading: false },
  render: (args) => ({ components: { APIGatewayViewDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewDeploymentModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, deployment: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewDeploymentModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, deployment: null, loading: false },
  render: (args) => ({ components: { APIGatewayViewDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewDeploymentModal v-bind="args" /></div>' })
};