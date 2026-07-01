import type { Meta, StoryObj } from '@storybook/vue3';
import VPCCreateSubnetModal from './VPCCreateSubnetModal.vue';

const meta: Meta<typeof VPCCreateSubnetModal> = {
  title: 'Services/VPC/CreateSubnetModal',
  component: VPCCreateSubnetModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { VPCCreateSubnetModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateSubnetModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCCreateSubnetModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateSubnetModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { VPCCreateSubnetModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateSubnetModal v-bind="args" /></div>' })
};
