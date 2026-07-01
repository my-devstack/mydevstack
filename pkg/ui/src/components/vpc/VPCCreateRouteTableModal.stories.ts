import type { Meta, StoryObj } from '@storybook/vue3';
import VPCCreateRouteTableModal from './VPCCreateRouteTableModal.vue';

const meta: Meta<typeof VPCCreateRouteTableModal> = {
  title: 'Services/VPC/CreateRouteTableModal',
  component: VPCCreateRouteTableModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { VPCCreateRouteTableModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateRouteTableModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCCreateRouteTableModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateRouteTableModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { VPCCreateRouteTableModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateRouteTableModal v-bind="args" /></div>' })
};
