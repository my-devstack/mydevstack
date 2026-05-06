import type { Meta, StoryObj } from '@storybook/vue3-vite';
import APIGatewayEditStageModal from './APIGatewayEditStageModal.vue';

const meta: Meta<typeof APIGatewayEditStageModal> = {
  title: 'Services/APIGateway/EditStageModal',
  component: APIGatewayEditStageModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, stageName: 'prod', description: 'Production stage', autoDeploy: true, loading: false },
  render: (args) => ({ components: { APIGatewayEditStageModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditStageModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, stageName: 'prod', description: 'Production stage', autoDeploy: true, loading: true },
  render: (args) => ({ components: { APIGatewayEditStageModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditStageModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, stageName: 'prod', description: 'Production stage', autoDeploy: true, loading: false },
  render: (args) => ({ components: { APIGatewayEditStageModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditStageModal v-bind="args" /></div>' })
};