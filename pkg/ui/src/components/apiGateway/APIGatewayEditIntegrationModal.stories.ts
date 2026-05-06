import type { Meta, StoryObj } from '@storybook/vue3-vite';
import APIGatewayEditIntegrationModal from './APIGatewayEditIntegrationModal.vue';

const meta: Meta<typeof APIGatewayEditIntegrationModal> = {
  title: 'Services/APIGateway/EditIntegrationModal',
  component: APIGatewayEditIntegrationModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, integrationId: 'int-123', description: 'My integration', loading: false },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, integrationId: 'int-123', description: 'My integration', loading: true },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, integrationId: 'int-123', description: 'My integration', loading: false },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};