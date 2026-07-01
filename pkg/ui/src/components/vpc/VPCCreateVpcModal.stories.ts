import type { Meta, StoryObj } from '@storybook/vue3';
import VPCCreateVpcModal from './VPCCreateVpcModal.vue';

const meta: Meta<typeof VPCCreateVpcModal> = {
  title: 'Services/VPC/CreateVpcModal',
  component: VPCCreateVpcModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { VPCCreateVpcModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateVpcModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCCreateVpcModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateVpcModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { VPCCreateVpcModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateVpcModal v-bind="args" /></div>' })
};
