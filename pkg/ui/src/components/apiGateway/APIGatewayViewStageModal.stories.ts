import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewStageModal from './APIGatewayViewStageModal.vue';

const meta: Meta<typeof APIGatewayViewStageModal> = {
  title: 'Services/APIGateway/ViewStageModal',
  component: APIGatewayViewStageModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStage = {
  stageName: 'prod',
  autoDeploy: true,
  description: 'Production stage',
  stageVariables: { ENV: 'prod', REGION: 'us-east-1' }
};

export const Default: Story = {
  args: { open: true, stage: mockStage, loading: false },
  render: (args) => ({ components: { APIGatewayViewStageModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, stage: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewStageModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, stage: null, loading: false },
  render: (args) => ({ components: { APIGatewayViewStageModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageModal v-bind="args" /></div>' })
};