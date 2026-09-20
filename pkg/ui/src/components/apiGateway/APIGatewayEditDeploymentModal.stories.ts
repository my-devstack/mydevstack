import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayEditDeploymentModal from './APIGatewayEditDeploymentModal.vue';

const meta: Meta<typeof APIGatewayEditDeploymentModal> = {
  title: 'Services/APIGateway/EditDeploymentModal',
  component: APIGatewayEditDeploymentModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDeployment = {
  id: 'dep-123',
  description: 'Initial deployment'
};

export const Default: Story = {
  args: { open: true, deployment: mockDeployment, loading: false },
  render: (args) => ({ components: { APIGatewayEditDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditDeploymentModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, deployment: mockDeployment, loading: true },
  render: (args) => ({ components: { APIGatewayEditDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditDeploymentModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, deployment: null, loading: false },
  render: (args) => ({ components: { APIGatewayEditDeploymentModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditDeploymentModal v-bind="args" /></div>' })
};