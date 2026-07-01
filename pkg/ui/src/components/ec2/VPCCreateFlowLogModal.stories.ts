import type { Meta, StoryObj } from '@storybook/vue3';
import VPCCreateFlowLogModal from './VPCCreateFlowLogModal.vue';

const meta: Meta<typeof VPCCreateFlowLogModal> = {
  title: 'Services/EC2/VPC/CreateFlowLogModal',
  component: VPCCreateFlowLogModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { VPCCreateFlowLogModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateFlowLogModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCCreateFlowLogModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateFlowLogModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { VPCCreateFlowLogModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateFlowLogModal v-bind="args" /></div>' })
};
